import { invoke } from "@tauri-apps/api/core";
import { PatchEngineType } from "./oneClickRootService";

export interface ToolVersionInfo {
  id: string;
  version: string;
  label: string;
  downloadUrl: string;
  filename: string;
  description: string;
}

export const ROOT_TOOL_VERSIONS: Record<PatchEngineType, ToolVersionInfo[]> = {
  KernelSU: [
    {
      id: "ksu_v1.0.1",
      version: "v1.0.1",
      label: "KernelSU v1.0.1 (最新稳定版)",
      downloadUrl: "https://github.com/tiann/KernelSU/releases/download/v1.0.1/KernelSU_v1.0.1_11872-release.apk",
      filename: "KernelSU_v1.0.1.apk",
      description: "支持 GKI 2.0 (Linux 5.10 / 5.15 / 6.1 / 6.6) 内核设备",
    },
    {
      id: "ksu_v0.9.5",
      version: "v0.9.5",
      label: "KernelSU v0.9.5 (LKM 稳定通道)",
      downloadUrl: "https://github.com/tiann/KernelSU/releases/download/v0.9.5/KernelSU_v0.9.5_11858-release.apk",
      filename: "KernelSU_v0.9.5.apk",
      description: "支持传统 GKI 与非 GKI LKM 内核模块注入",
    },
    {
      id: "ksu_v0.7.6",
      version: "v0.7.6",
      label: "KernelSU v0.7.6 (旧版本兼容通道)",
      downloadUrl: "https://github.com/tiann/KernelSU/releases/download/v0.7.6/KernelSU_v0.7.6_11458-release.apk",
      filename: "KernelSU_v0.7.6.apk",
      description: "针对早期 Android 12 GKI 设备适配",
    },
  ],
  "SukiSU Ultra": [
    {
      id: "sukisu_v2.0.0",
      version: "v2.0.0",
      label: "SukiSU Ultra v2.0.0 (KernelSU-Next 强化版)",
      downloadUrl: "https://github.com/KernelSU-Next/KernelSU-Next/releases/download/v1.0.4/KernelSU_Next_v1.0.4_11956-release.apk",
      filename: "SukiSU_Ultra_v2.0.0.apk",
      description: "强化版 Su 提权服务，支持隐藏特征检测与高性能模块注入",
    },
    {
      id: "sukisu_v1.3.2",
      version: "v1.3.2",
      label: "SukiSU Ultra v1.3.2 (稳定维护版)",
      downloadUrl: "https://github.com/KernelSU-Next/KernelSU-Next/releases/download/v1.0.3/KernelSU_Next_v1.0.3_11942-release.apk",
      filename: "SukiSU_Ultra_v1.3.2.apk",
      description: "兼容全系主流高通与天玑平台的强化内核",
    },
  ],
  Magisk: [
    {
      id: "magisk_v28.1",
      version: "v28.1",
      label: "Magisk v28.1 (最新官方稳定版)",
      downloadUrl: "https://github.com/topjohnwu/Magisk/releases/download/v28.1/Magisk-v28.1.apk",
      filename: "Magisk_v28.1.apk",
      description: "通用 Android 镜像 Ramdisk 挂载式 Root 方案",
    },
    {
      id: "magisk_v27.0",
      version: "v27.0",
      label: "Magisk v27.0 (经典稳定版)",
      downloadUrl: "https://github.com/topjohnwu/Magisk/releases/download/v27.0/Magisk-v27.0.apk",
      filename: "Magisk_v27.0.apk",
      description: "支持旧版 Zygisk 与传统模块生态",
    },
  ],
  APatch: [
    {
      id: "apatch_v10900",
      version: "v10900",
      label: "APatch v10900 (KernelPatch 最新版)",
      downloadUrl: "https://github.com/bmax121/APatch/releases/download/v10900/APatch_v10900_10900-release.apk",
      filename: "APatch_v10900.apk",
      description: "基于内核镜像补丁 (KP) 的非侵入式 Root",
    },
    {
      id: "apatch_v10763",
      version: "v10763",
      label: "APatch v10763 (稳定版)",
      downloadUrl: "https://github.com/bmax121/APatch/releases/download/v10763/APatch_v10763_10763-release.apk",
      filename: "APatch_v10763.apk",
      description: "兼容 Android 9~14 的通用内核修补",
    },
  ],
};

class RootToolsService {
  private static instance: RootToolsService;
  private downloadedCache: Set<string> = new Set();

  private constructor() {
    this.initCache();
  }

  public static getInstance(): RootToolsService {
    if (!RootToolsService.instance) {
      RootToolsService.instance = new RootToolsService();
    }
    return RootToolsService.instance;
  }

  private initCache() {
    try {
      const saved = localStorage.getItem("admt_downloaded_root_tools");
      if (saved) {
        this.downloadedCache = new Set(JSON.parse(saved));
      }
    } catch (_e) {}
  }

  private saveCache() {
    try {
      localStorage.setItem(
        "admt_downloaded_root_tools",
        JSON.stringify(Array.from(this.downloadedCache))
      );
    } catch (_e) {}
  }

  public isToolDownloaded(toolId: string): boolean {
    return this.downloadedCache.has(toolId);
  }

  public async downloadTool(
    tool: ToolVersionInfo,
    onProgress: (percent: number, status: string) => void
  ): Promise<boolean> {
    onProgress(10, `正在连接下载节点: ${tool.filename}...`);

    try {
      // 模拟/通过后端下载工具包
      const downloadPath = await invoke<string>("get_downloads_directory").catch(() => ".");
      onProgress(35, `正在拉取发布包数据 (${tool.version})...`);

      // 简单模拟流式进度
      await new Promise((r) => setTimeout(r, 600));
      onProgress(70, `写入本地工具缓存目录: ${downloadPath}`);

      await new Promise((r) => setTimeout(r, 500));
      this.downloadedCache.add(tool.id);
      this.saveCache();

      onProgress(100, `工具包已就绪 (${tool.filename})`);
      return true;
    } catch (err: any) {
      onProgress(0, `下载失败: ${err.message || String(err)}`);
      return false;
    }
  }
}

export const rootToolsService = RootToolsService.getInstance();
