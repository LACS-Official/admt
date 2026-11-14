import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { DeviceInfo } from "../types/device";
import { isXiaomiDevice, queryXiaomiOfficialRom } from "./xiaomiRomService";

export type PatchEngineType = "KernelSU" | "SukiSU Ultra" | "Magisk" | "APatch";

export type WorkflowStepId =
  | "idle"
  | "check_device"
  | "acquire_image"
  | "backup_image"
  | "patch_image"
  | "device_patch"
  | "verify_image"
  | "reboot_fastboot"
  | "flash_fastboot"
  | "reboot_system"
  | "verify_root"
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
  /** Magisk PC 端修补所需的完整安装包（APK/ZIP）路径 */
  patcherPath?: string;
  /** 是否在刷入前备份原镜像，默认 true */
  backupImage?: boolean;
  /** 刷入/验证失败时自动回滚，默认 true */
  rollbackOnFailure?: boolean;
  /** 设备端辅助修补产物的路径；为空时等待用户在 UI 中提交 */
  devicePatchedPath?: string;
  /** 允许在无法确认 BL 状态时继续（风险自负） */
  acknowledgeUnknownBootloader?: boolean;
  /** 可选：设备启用 AVB 校验时提供的 vbmeta 镜像，显式提供才会执行禁用校验 */
  vbmetaPath?: string;
  /** 从上次保存的修补产物继续 */
  resume?: boolean;
}

export type PatchMode = "pc_native" | "device_assisted" | "unavailable";

export interface EngineCapability {
  engine: string;
  mode: PatchMode;
  available: boolean;
  reason: string;
  requiredFiles: string[];
  hint: string;
}

export interface RootPatchCapabilities {
  engines: EngineCapability[];
  toolsDir: string;
  magiskbootPath?: string | null;
}

export interface RootPreflight {
  serial: string;
  connected: boolean;
  model?: string | null;
  sdk?: number | null;
  bootloaderUnlocked?: boolean | null;
  verifiedBootState?: string | null;
  abSlot?: string | null;
  antiRollback?: string | null;
  avbEnabled?: boolean | null;
  recommendedPartition: string;
  requestedPartition: string;
  blockers: string[];
  warnings: string[];
}

export interface DevicePatchSession {
  deviceInput: string;
  deviceDir: string;
  suggestedOutput: string;
  engine: string;
  appPackage?: string | null;
  hint: string;
}

export interface RootVerification {
  rooted: boolean;
  detail: string;
}

export interface RootBackupRecord {
  imagePath: string;
  metaPath: string;
  sha256: string;
  size: number;
  serial: string;
  partition: string;
  createdAt: string;
}

export interface PatchOutcome {
  success: boolean;
  output: string;
  error?: string | null;
  exitCode?: number | null;
  outputPath?: string | null;
  sourceSha256: string;
  patchedSha256: string;
  engine: string;
}

export interface WorkflowProgressState {
  currentStep: WorkflowStepId;
  progressPercent: number;
  statusMessage: string;
  logs: string[];
  outputImagePath?: string;
  backupPath?: string;
  error?: string;
  capabilities?: EngineCapability[];
  preflight?: RootPreflight | null;
  needsDeviceAction?: boolean;
  deviceSession?: DevicePatchSession | null;
  verification?: RootVerification | null;
}

export interface PersistedWorkflow {
  state: WorkflowProgressState;
  config: RootWorkflowConfig;
  savedAt: number;
}

interface CommandResultLike {
  success: boolean;
  output?: string;
  error?: string | null;
}

const STORAGE_KEY = "admt.rootWorkflow.v1";

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const maybe = err as { message?: string; Message?: string };
    if (maybe.message) return maybe.message;
    if (maybe.Message) return maybe.Message;
    try {
      return JSON.stringify(err);
    } catch {
      return "未知错误";
    }
  }
  return String(err);
}

function assertCommand(result: CommandResultLike, action: string): void {
  if (!result?.success) {
    throw new Error(`${action}失败: ${result?.error || result?.output || "设备未返回成功状态"}`);
  }
}

export class OneClickRootService {
  private static instance: OneClickRootService;
  private isRunning = false;
  private abortRequested = false;
  private deviceResolve: ((path: string) => void) | null = null;
  private deviceReject: ((err: Error) => void) | null = null;

  private constructor() {}

  public static getInstance(): OneClickRootService {
    if (!OneClickRootService.instance) {
      OneClickRootService.instance = new OneClickRootService();
    }
    return OneClickRootService.instance;
  }

  public detectRecommendedPartition(device: DeviceInfo): "boot" | "init_boot" {
    if (!device.properties) return "boot";
    const sdkVersion = parseInt(device.properties.sdkVersion || "0", 10);
    const androidVersion = parseInt(device.properties.androidVersion || "0", 10);
    return sdkVersion >= 33 || androidVersion >= 13 ? "init_boot" : "boot";
  }

  public async getCapabilities(): Promise<RootPatchCapabilities> {
    return invoke<RootPatchCapabilities>("get_root_patch_capabilities");
  }

  public async scanDevicePatchedImages(serial: string): Promise<string[]> {
    return invoke<string[]>("root_scan_device_patched_images", { serial });
  }

  public loadPersisted(): PersistedWorkflow | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PersistedWorkflow;
      if (!parsed?.state || !parsed?.config) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  public clearPersisted(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }

  public abortWorkflow(): void {
    this.abortRequested = true;
    if (this.deviceReject) {
      this.deviceReject(new Error("任务已取消"));
      this.deviceResolve = null;
      this.deviceReject = null;
    }
  }

  public submitDevicePatchedImage(path: string): void {
    const trimmed = path.trim();
    if (!this.deviceResolve) return;
    if (!trimmed) {
      this.deviceReject?.(new Error("请填写设备端修补产物路径"));
      this.deviceResolve = null;
      this.deviceReject = null;
      return;
    }
    this.deviceResolve(trimmed);
    this.deviceResolve = null;
    this.deviceReject = null;
  }

  private awaitDevicePatchedImage(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.deviceResolve = resolve;
      this.deviceReject = reject;
      if (this.abortRequested) {
        reject(new Error("任务已取消"));
        this.deviceResolve = null;
        this.deviceReject = null;
      }
    });
  }

  private async getWorkspaceTempDir(): Promise<string> {
    try {
      return await invoke<string>("get_downloads_directory");
    } catch {
      return ".";
    }
  }

  /**
   * 执行完整流程。所有分支都要求后端返回经校验的真实产物，
   * 任何依赖缺失或校验失败都会终止，不会把未修补镜像送进刷写环节。
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

    const persisted = config.resume ? this.loadPersisted() : null;
    const state: WorkflowProgressState = {
      currentStep: "check_device",
      progressPercent: 0,
      statusMessage: "开始检查设备环境...",
      logs: persisted?.state?.logs ? [...persisted.state.logs] : [],
      capabilities: persisted?.state?.capabilities,
      preflight: persisted?.state?.preflight ?? null,
    };

    const persist = () => {
      try {
        const snapshot: PersistedWorkflow = { state: { ...state }, config, savedAt: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        /* 存储不可用时不影响流程 */
      }
    };
    const emit = () => {
      persist();
      onStateUpdate({ ...state });
    };
    const appendLog = (msg: string) => {
      state.logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      emit();
    };
    const updateStep = (step: WorkflowStepId, percent: number, status: string) => {
      state.currentStep = step;
      state.progressPercent = percent;
      state.statusMessage = status;
      appendLog(status);
    };
    const throwIfAborted = () => {
      if (this.abortRequested) throw new Error("任务已取消");
    };

    const unlistenExtract = await listen<{ progress: number; status: string }>(
      "rom-extract-progress",
      (event) => {
        state.progressPercent = Math.min(45, Math.max(10, event.payload.progress));
        state.statusMessage = event.payload.status;
        appendLog(`[提取进度] ${event.payload.status} (${event.payload.progress}%)`);
      }
    );
    const unlistenPatch = await listen<{ progress: number; status: string }>(
      "patch-progress",
      (event) => {
        state.progressPercent = Math.min(65, Math.max(40, event.payload.progress));
        state.statusMessage = event.payload.status;
        appendLog(`[修补进度] ${event.payload.status} (${event.payload.progress}%)`);
      }
    );

    let rawImagePath = "";
    let patchedImagePath = "";
    let backupPath: string | undefined;
    let targetPart = config.targetPartition === "boot" || config.targetPartition === "init_boot"
      ? config.targetPartition
      : "boot";
    let flashed = false;
    let skippedEarly = false;

    try {
      const serial = config.device?.serial;
      if (!serial) throw new Error("未检测到有效设备连接");

      // 断点续做：复用已保存且经校验的修补产物，从刷入阶段继续
      if (config.resume && persisted?.state?.outputImagePath) {
        patchedImagePath = persisted.state.outputImagePath;
        backupPath = persisted.state.backupPath;
        targetPart = (persisted.state.preflight?.requestedPartition as typeof targetPart) || targetPart;
        state.outputImagePath = patchedImagePath;
        state.backupPath = backupPath;
        skippedEarly = true;
        appendLog(`从上次中断处继续，复用修补产物: ${patchedImagePath}`);
      }

      if (!skippedEarly) {
        // 1. 能力探测 + 前置检查（BL 锁定为硬阻断）
        updateStep("check_device", 3, "正在校验设备状态、解锁状态与修补环境...");
        throwIfAborted();
        const caps = await this.getCapabilities();
        state.capabilities = caps.engines;
        const engineCap = caps.engines.find((e) => e.engine === config.patchType);
        if (!engineCap) throw new Error(`未找到 ${config.patchType} 的修补能力声明`);
        appendLog(`修补方式: ${engineCap.mode}${engineCap.available ? "（就绪）" : "（依赖缺失）"}`);
        if (!engineCap.available) {
          throw new Error(`${engineCap.reason}。${engineCap.hint}`);
        }

        const preflight = await invoke<RootPreflight>("root_preflight", {
          serial,
          partition: config.targetPartition || "auto",
        });
        state.preflight = preflight;
        preflight.warnings.forEach((w) => appendLog(`[提示] ${w}`));
        if (preflight.blockers.length > 0) {
          throw new Error(preflight.blockers.join("；"));
        }
        if (preflight.bootloaderUnlocked == null && !config.acknowledgeUnknownBootloader) {
          throw new Error("无法确认 Bootloader 解锁状态。若确认已解锁，请勾选「已确认 BL 解锁」后重试");
        }
        targetPart = (preflight.requestedPartition as typeof targetPart) || targetPart;
        appendLog(`设备: ${preflight.model || serial}，目标分区: ${targetPart}`);
        emit();

        // 2. 获取原始镜像
        throwIfAborted();
        updateStep("acquire_image", 12, "正在准备并提取目标分区镜像...");
        const outDir = await this.getWorkspaceTempDir();

        if (config.sourceType === "local_image") {
          if (!config.localImagePath) throw new Error("未选择本地镜像文件路径");
          rawImagePath = config.localImagePath;
          appendLog(`使用用户指定本地镜像: ${rawImagePath}`);
        } else if (config.sourceType === "local_rom") {
          if (!config.localRomPath) throw new Error("未选择本地固件包路径");
          rawImagePath = await invoke<string>("extract_local_partition", {
            romPath: config.localRomPath,
            partName: targetPart,
            outDir,
          });
          appendLog(`成功提取分区镜像: ${rawImagePath}`);
        } else {
          let romUrl = config.onlineUrl;
          if (config.sourceType === "auto_xiaomi") {
            if (!isXiaomiDevice(config.device)) {
              throw new Error("当前设备非小米/红米品牌，无法自动检索小米官方 ROM 直链");
            }
            const romInfo = await queryXiaomiOfficialRom(config.device);
            if (!romInfo.downloadUrl) {
              throw new Error("未能解析到官方 ROM 直链，请手动输入链接或提供本地文件");
            }
            romUrl = romInfo.downloadUrl;
            appendLog(`取得官方固件直链 (${romInfo.source})`);
          }
          if (!romUrl) throw new Error("固件直链为空，无法继续");
          rawImagePath = await invoke<string>("extract_online_partition", {
            url: romUrl,
            partName: targetPart,
            outDir,
          });
          appendLog(`在线流式提取完成: ${rawImagePath}`);
        }
        if (!rawImagePath) throw new Error("未能获取到有效的分区镜像文件");

        // 3. 备份原镜像（不依赖设备 root）
        if (config.backupImage !== false) {
          throwIfAborted();
          updateStep("backup_image", 25, "正在备份原始分区镜像...");
          const record = await invoke<RootBackupRecord>("root_backup_image", {
            imagePath: rawImagePath,
            serial,
            partition: targetPart,
          });
          backupPath = record.imagePath;
          state.backupPath = backupPath;
          appendLog(`原镜像已备份: ${backupPath} (sha256 ${record.sha256.slice(0, 12)}…)`);
        }

        // 4. 按引擎能力修补；不支持电脑端注入的引擎走设备端辅助通道
        throwIfAborted();
        updateStep("patch_image", 40, `正在使用 ${config.patchType} 修补镜像...`);

        if (engineCap.mode === "pc_native") {
          if (!config.patcherPath) {
            throw new Error("Magisk 电脑端修补需要选择完整的 Magisk 安装包（APK/ZIP）");
          }
          const outcome = await invoke<PatchOutcome>("patch_boot_image_local", {
            imagePath: rawImagePath,
            patcherPath: config.patcherPath,
            patchType: config.patchType,
          });
          if (!outcome.outputPath) throw new Error("后端未返回修补产物路径");
          patchedImagePath = outcome.outputPath;
          appendLog(`修补产物已校验 (sha256 ${outcome.patchedSha256.slice(0, 12)}…)`);
        } else if (engineCap.mode === "device_assisted") {
          updateStep("device_patch", 45, "正在把原镜像交给设备端官方 App 修补...");
          const session = await invoke<DevicePatchSession>("root_prepare_device_patch", {
            serial,
            imagePath: rawImagePath,
            engine: config.patchType,
          });
          state.deviceSession = session;
          state.needsDeviceAction = true;
          appendLog(session.hint);
          appendLog(`设备端原镜像: ${session.deviceInput}`);
          emit();

          const devicePath = config.devicePatchedPath?.trim() || (await this.awaitDevicePatchedImage());
          state.needsDeviceAction = false;
          throwIfAborted();
          appendLog(`取回设备端产物: ${devicePath}`);
          const outcome = await invoke<PatchOutcome>("root_collect_device_patch", {
            serial,
            devicePath,
            originalPath: rawImagePath,
            outDir: await this.getWorkspaceTempDir(),
            engine: config.patchType,
          });
          if (!outcome.outputPath) throw new Error("后端未返回设备端修补产物路径");
          patchedImagePath = outcome.outputPath;
          appendLog(`设备端产物已校验 (sha256 ${outcome.patchedSha256.slice(0, 12)}…)`);
        } else {
          throw new Error(`${engineCap.reason}。${engineCap.hint}`);
        }

        state.outputImagePath = patchedImagePath;
        updateStep("verify_image", 62, "修补产物校验通过");
      }

      if (!patchedImagePath) throw new Error("没有可用的修补产物，流程已终止");

      // 5. 刷入闭环
      if (config.autoFlash) {
        throwIfAborted();
        updateStep("reboot_fastboot", 70, "正在重启设备进入 Fastboot 模式...");
        const reboot = await invoke<CommandResultLike>("reboot_device", {
          serial: config.device.serial,
          mode: "bootloader",
        });
        assertCommand(reboot, "重启进入 Fastboot");

        appendLog("等待设备进入 Fastboot（最长 90 秒）...");
        const inFastboot = await invoke<boolean>("root_wait_for_fastboot", {
          serial: config.device.serial,
          timeoutSecs: 90,
        });
        if (!inFastboot) {
          throw new Error("未检测到 Fastboot 设备，请检查数据线与驱动后重试");
        }

        // 仅在用户显式提供 vbmeta 镜像时处理 AVB 校验，不做静默自动禁用
        if (config.vbmetaPath?.trim()) {
          appendLog("正在禁用 AVB 校验并刷入 vbmeta（可能导致清除用户数据）...");
          const vbmeta = await invoke<CommandResultLike>("execute_fastboot_command", {
            serial: config.device.serial,
            command: "--disable-verity",
            args: ["--disable-verification", "flash", "vbmeta", config.vbmetaPath.trim()],
            timeout: 120,
          });
          assertCommand(vbmeta, "刷入 vbmeta");
          appendLog("vbmeta 处理完成。");
        }

        throwIfAborted();
        updateStep("flash_fastboot", 82, `正在向 ${targetPart} 分区写入修补镜像...`);
        const flash = await invoke<CommandResultLike>("fastboot_flash_image", {
          serial: config.device.serial,
          imagePath: patchedImagePath,
          partition: targetPart,
        });
        assertCommand(flash, "Fastboot 刷入");
        flashed = true;
        appendLog("镜像写入成功。");

        if (config.autoReboot) {
          throwIfAborted();
          updateStep("reboot_system", 90, "正在重启设备进入系统...");
          const rebootSystem = await invoke<CommandResultLike>("execute_fastboot_command", {
            serial: config.device.serial,
            command: "reboot",
            args: [],
            timeout: 30,
          });
          assertCommand(rebootSystem, "重启进入系统");

          appendLog("等待设备重新上线（最长 180 秒）...");
          const online = await invoke<boolean>("root_wait_for_adb", {
            serial: config.device.serial,
            timeoutSecs: 180,
          });
          if (!online) {
            appendLog("设备尚未回到系统，跳过自动验证，请开机后手动复检 Root 状态");
          } else {
            updateStep("verify_root", 95, "正在验证 Root 是否生效...");
            const verification = await invoke<RootVerification>("root_verify_root", {
              serial: config.device.serial,
            });
            state.verification = verification;
            appendLog(verification.detail);
            if (!verification.rooted) {
              throw new Error(`刷入后未检测到 Root：${verification.detail}`);
            }
          }
        }
      } else {
        appendLog("未启用自动刷入，流程在产物校验后结束。");
      }

      updateStep("completed", 100, "流程完成");
      appendLog(`修补产物: ${patchedImagePath}`);
      return true;
    } catch (err) {
      const message = describeError(err);
      state.currentStep = "failed";
      state.error = message;
      state.statusMessage = `任务失败: ${message}`;
      appendLog(`错误: ${message}`);

      if (flashed && backupPath && config.rollbackOnFailure !== false && config.device?.serial) {
        appendLog("正在用备份镜像回滚...");
        try {
          const rollback = await invoke<CommandResultLike>("root_restore_backup", {
            serial: config.device.serial,
            backupPath,
            partition: targetPart,
          });
          appendLog(rollback?.success
            ? "回滚完成，原分区已恢复"
            : `回滚未成功: ${rollback?.error || rollback?.output || "未知原因"}`);
        } catch (rollbackErr) {
          appendLog(`回滚失败: ${describeError(rollbackErr)}。请手动刷回备份: ${backupPath}`);
        }
      }
      return false;
    } finally {
      this.isRunning = false;
      this.deviceResolve = null;
      this.deviceReject = null;
      unlistenExtract();
      unlistenPatch();
      try {
        await invoke<string>("root_append_workflow_log", { lines: state.logs });
      } catch {
        /* 日志落盘失败不影响主流程结果 */
      }
      emit();
    }
  }
}

export const oneClickRootService = OneClickRootService.getInstance();
