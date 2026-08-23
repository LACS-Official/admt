import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { DeviceInfo } from "../types/device";
import { isXiaomiDevice, queryXiaomiOfficialRom } from "./xiaomiRomService";

export type PatchEngineType = "KernelSU" | "SukiSU Ultra" | "Magisk" | "APatch";

export type WorkflowStepId = 
  | "idle"
  | "check_device"
  | "acquire_image"
  | "patch_image"
  | "reboot_fastboot"
  | "flash_fastboot"
  | "reboot_system"
  | "completed"
  | "failed";

export interface RootWorkflowConfig {
  device: DeviceInfo;
  sourceType: "auto_xiaomi" | "online_url" | "local_rom" | "local_image";
  onlineUrl?: string;
  localRomPath?: string;
  localImagePath?: string;
  patchType: PatchEngineType;
  targetPartition?: "auto" | "boot" | "init_boot";
  autoFlash: boolean;
  autoReboot: boolean;
}

export interface WorkflowProgressState {
  currentStep: WorkflowStepId;
  progressPercent: number;
  statusMessage: string;
  logs: string[];
  outputImagePath?: string;
  error?: string;
}

export class OneClickRootService {
  private static instance: OneClickRootService;
  private isRunning = false;
  private abortRequested = false;

  private constructor() {}

  public static getInstance(): OneClickRootService {
    if (!OneClickRootService.instance) {
      OneClickRootService.instance = new OneClickRootService();
    }
    return OneClickRootService.instance;
  }

  /**
   * 自动探测推荐的目标刷入分区（init_boot 或 boot）
   */
  public detectRecommendedPartition(device: DeviceInfo): "boot" | "init_boot" {
    if (!device.properties) return "boot";

    const sdkVersion = parseInt(device.properties.sdkVersion || "0", 10);
    const androidVersion = parseInt(device.properties.androidVersion || "0", 10);

    // Android 13 (API 33) 及以上首推 init_boot
    if (sdkVersion >= 33 || androidVersion >= 13) {
      return "init_boot";
    }

    return "boot";
  }

  /**
   * 执行一键 Root 完整流程
   */
  public async executeWorkflow(
    config: RootWorkflowConfig,
    onStateUpdate: (state: WorkflowProgressState) => void
  ): Promise<boolean> {
    if (this.isRunning) {
      throw new Error("任务正在执行中，请勿重复提交");
    }

    this.isRunning = true;
    this.abortRequested = false;

    const state: WorkflowProgressState = {
      currentStep: "check_device",
      progressPercent: 0,
      statusMessage: "开始检查设备环境...",
      logs: [],
    };

    const appendLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const line = `[${timestamp}] ${msg}`;
      state.logs.push(line);
      onStateUpdate({ ...state });
    };

    const updateStep = (step: WorkflowStepId, percent: number, status: string) => {
      state.currentStep = step;
      state.progressPercent = percent;
      state.statusMessage = status;
      appendLog(status);
      onStateUpdate({ ...state });
    };

    // 监听底层固件提取进度
    const unlistenExtract = await listen<{ progress: number; status: string }>(
      "rom-extract-progress",
      (event) => {
        state.progressPercent = Math.min(80, Math.max(10, event.payload.progress));
        state.statusMessage = event.payload.status;
        appendLog(`[提取进度] ${event.payload.status} (${event.payload.progress}%)`);
        onStateUpdate({ ...state });
      }
    );

    // 监听底层修补进度
    const unlistenPatch = await listen<{ progress: number; status: string }>(
      "patch-progress",
      (event) => {
        state.progressPercent = Math.min(90, Math.max(50, event.payload.progress));
        state.statusMessage = event.payload.status;
        appendLog(`[修补进度] ${event.payload.status} (${event.payload.progress}%)`);
        onStateUpdate({ ...state });
      }
    );

    try {
      // 步骤 1: 检查设备连接与 Bootloader 状态
      updateStep("check_device", 5, "正在校验设备状态与 Bootloader 锁...");
      
      const { device } = config;
      if (!device || !device.serial) {
        throw new Error("未检测到有效设备连接");
      }

      appendLog(`设备型号: ${device.properties?.model || device.serial}`);
      appendLog(`Android 版本: ${device.properties?.androidVersion || "未知"}`);
      appendLog(`增量系统版本: ${device.properties?.buildId || "未知"}`);

      const isUnlocked = String(device.properties?.bootloaderLocked) === "false";
      if (!isUnlocked && config.autoFlash) {
        appendLog("警告: 设备 Bootloader 当前处于锁定状态 (Locked)。未解锁 BL 无法刷入第三方镜像。");
      } else {
        appendLog("Bootloader 状态正常 (Unlocked / 已解锁)。");
      }

      const targetPart = config.targetPartition === "auto" || !config.targetPartition
        ? this.detectRecommendedPartition(device)
        : config.targetPartition;

      appendLog(`目标操作分区: ${targetPart}`);

      // 步骤 2: 获取原始镜像文件 (Extract / Prepare raw image)
      updateStep("acquire_image", 15, "正在准备并提取目标分区镜像...");

      let rawImagePath = "";
      const outDir = await this.getWorkspaceTempDir();

      if (config.sourceType === "local_image") {
        if (!config.localImagePath) {
          throw new Error("未选择本地镜像文件路径");
        }
        rawImagePath = config.localImagePath;
        appendLog(`使用用户指定本地镜像: ${rawImagePath}`);
      } else if (config.sourceType === "local_rom") {
        if (!config.localRomPath) {
          throw new Error("未选择本地固件包路径");
        }
        appendLog(`正在从本地固件包解析提取 ${targetPart}.img...`);
        rawImagePath = await invoke<string>("extract_local_partition", {
          romPath: config.localRomPath,
          partName: targetPart,
          outDir,
        });
        appendLog(`成功提取分区镜像: ${rawImagePath}`);
      } else {
        // 在线固件源 (自动小米检索或自定义直链)
        let romUrl = config.onlineUrl;

        if (config.sourceType === "auto_xiaomi") {
          if (!isXiaomiDevice(device)) {
            throw new Error("当前设备非小米/红米品牌，无法自动检索小米官方 ROM 直链");
          }

          appendLog("正在请求小米官方分发服务器获取固件直链...");
          const romInfo = await queryXiaomiOfficialRom(device);
          if (!romInfo.downloadUrl) {
            throw new Error("未能成功解析到官方 ROM 直链，请尝试手动输入链接或提供本地文件");
          }
          romUrl = romInfo.downloadUrl;
          appendLog(`成功获取官方固件直链 (${romInfo.source}): ${romUrl}`);
        }

        if (!romUrl) {
          throw new Error("固件直链为空，无法继续");
        }

        appendLog(`开始通过 HTTP Range 流式提取 ${targetPart}.img (无需下载完整全量包)...`);
        rawImagePath = await invoke<string>("extract_online_partition", {
          url: romUrl,
          partName: targetPart,
          outDir,
        });
        appendLog(`在线流式提取完成: ${rawImagePath}`);
      }

      if (!rawImagePath) {
        throw new Error("未能获取到有效的分区镜像文件");
      }

      // 步骤 3: 镜像修补
      updateStep("patch_image", 50, `正在使用 ${config.patchType} 引擎修补镜像...`);

      const patcherInternalType = config.patchType === "SukiSU Ultra" 
        ? "KernelSU" 
        : config.patchType;

      appendLog(`执行 ${config.patchType} 核心修补逻辑...`);
      
      const patchResult = await invoke<{ success: boolean; output: string; error?: string }>(
        "patch_boot_image_local",
        {
          imagePath: rawImagePath,
          patcherPath: "", // 内置引擎
          patchType: patcherInternalType,
        }
      );

      if (!patchResult.success) {
        throw new Error(patchResult.error || patchResult.output || "镜像修补失败");
      }

      const patchedImagePath = rawImagePath.replace(/(\.img)$/i, "_patched.img");
      state.outputImagePath = patchedImagePath;
      appendLog(`修补完成，产出镜像: ${patchedImagePath}`);

      // 步骤 4: 刷入 Fastboot (若配置 autoFlash)
      if (config.autoFlash) {
        updateStep("reboot_fastboot", 75, "正在重启设备进入 Fastboot 刷机模式...");

        await invoke("reboot_device", {
          serial: device.serial,
          mode: "bootloader",
        }).catch((e) => {
          appendLog(`重启命令已下发: ${e}`);
        });

        appendLog("等待 Fastboot 设备连接...");
        await new Promise((r) => setTimeout(r, 6000));

        updateStep("flash_fastboot", 85, `正在向 ${targetPart} 分区写入修补镜像...`);

        const flashResult = await invoke<{ success: boolean; output: string; error?: string }>(
          "fastboot_flash_image",
          {
            serial: device.serial,
            imagePath: patchedImagePath,
            partition: targetPart,
          }
        );

        if (!flashResult.success) {
          throw new Error(`Fastboot 刷入失败: ${flashResult.error || flashResult.output}`);
        }

        appendLog("Fastboot 镜像写入成功。");

        // 步骤 5: 重启系统
        if (config.autoReboot) {
          updateStep("reboot_system", 95, "正在重启设备进入系统...");
          await invoke("execute_fastboot_command", {
            args: ["reboot"],
            timeout: 10,
          }).catch(() => null);
          appendLog("已发送重启指令，请等待系统开机。");
        }
      }

      updateStep("completed", 100, "流程执行完毕");
      appendLog("全部任务执行成功。");
      return true;

    } catch (err: any) {
      const errorMsg = err.message || String(err);
      state.currentStep = "failed";
      state.error = errorMsg;
      state.statusMessage = `任务失败: ${errorMsg}`;
      appendLog(`错误: ${errorMsg}`);
      onStateUpdate({ ...state });
      return false;
    } finally {
      this.isRunning = false;
      unlistenExtract();
      unlistenPatch();
    }
  }

  private async getWorkspaceTempDir(): Promise<string> {
    try {
      const tempDir = await invoke<string>("get_downloads_directory");
      return tempDir;
    } catch {
      return ".";
    }
  }
}

export const oneClickRootService = OneClickRootService.getInstance();
