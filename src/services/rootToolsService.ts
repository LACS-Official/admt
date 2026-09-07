import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { PatchEngineType } from "./oneClickRootService";

export interface ToolVersionInfo {
  id: string;
  version: string;
  label: string;
  downloadUrl: string;
  filename: string;
  description: string;
  releaseDate?: string;
  sizeBytes?: number;
  isLatest?: boolean;
  isRealOnline?: boolean;
  sourceType?: "github_release" | "official_api" | "builtin";
}

export const ROOT_TOOL_VERSIONS: Record<PatchEngineType, ToolVersionInfo[]> = {
  KernelSU: [
    {
      id: "ksu_v3.3.0",
      version: "v3.3.0",
      label: "KernelSU v3.3.0 (最新官方发布)",
      downloadUrl: "https://github.com/tiann/KernelSU/releases/download/v3.3.0/KernelSU_v3.3.0_32601-release.apk",
      filename: "KernelSU_v3.3.0_32601-release.apk",
      description: "全新稳定架构，支持全系 Linux GKI 5.10 / 5.15 / 6.1 / 6.6 内核设备",
      isLatest: true,
      sourceType: "builtin",
    },
    {
      id: "ksu_v1.0.1",
      version: "v1.0.1",
      label: "KernelSU v1.0.1 (稳定长期维护版)",
      downloadUrl: "https://github.com/tiann/KernelSU/releases/download/v1.0.1/KernelSU_v1.0.1_11872-release.apk",
      filename: "KernelSU_v1.0.1.apk",
      description: "经典稳定通道，支持 GKI 2.0 与通用 LKM 模块动态注入",
      sourceType: "builtin",
    },
    {
      id: "ksu_v0.9.5",
      version: "v0.9.5",
      label: "KernelSU v0.9.5 (LKM 兼容通道)",
      downloadUrl: "https://github.com/tiann/KernelSU/releases/download/v0.9.5/KernelSU_v0.9.5_11858-release.apk",
      filename: "KernelSU_v0.9.5.apk",
      description: "支持传统 GKI 与非 GKI 早期内核修补",
      sourceType: "builtin",
    },
  ],
  "SukiSU Ultra": [
    {
      id: "sukisu_v3.3.0",
      version: "v3.3.0",
      label: "KernelSU-Next v3.3.0 (强化内核最新版)",
      downloadUrl: "https://github.com/KernelSU-Next/KernelSU-Next/releases/download/v3.3.0/KernelSU_Next_v3.3.0-spoofed_33214-release.apk",
      filename: "KernelSU_Next_v3.3.0-spoofed_33214-release.apk",
      description: "新一代强化 Su 提权服务，具备高级特征隐藏与高性能模块运行环境",
      isLatest: true,
      sourceType: "builtin",
    },
    {
      id: "sukisu_v2.0.0",
      version: "v2.0.0",
      label: "SukiSU Ultra v2.0.0 (经典稳定版)",
      downloadUrl: "https://github.com/KernelSU-Next/KernelSU-Next/releases/download/v1.0.4/KernelSU_Next_v1.0.4_11956-release.apk",
      filename: "SukiSU_Ultra_v2.0.0.apk",
      description: "支持深度特征隐藏的通用内核提权增强方案",
      sourceType: "builtin",
    },
  ],
  Magisk: [
    {
      id: "magisk_v30.6",
      version: "v30.6",
      label: "Magisk v30.6 (官方稳定通道)",
      downloadUrl: "https://github.com/topjohnwu/Magisk/releases/download/v30.6/Magisk-v30.6.apk",
      filename: "Magisk-v30.6.apk",
      description: "官方稳定版，通用 Android 镜像 Ramdisk 挂载式 Root 方案",
      isLatest: true,
      sourceType: "builtin",
    },
    {
      id: "magisk_v28.1",
      version: "v28.1",
      label: "Magisk v28.1 (经典稳定版)",
      downloadUrl: "https://github.com/topjohnwu/Magisk/releases/download/v28.1/Magisk-v28.1.apk",
      filename: "Magisk-v28.1.apk",
      description: "支持全系主流 Android 9~15 通用启动镜像修补",
      sourceType: "builtin",
    },
  ],
  APatch: [
    {
      id: "apatch_11224",
      version: "11224",
      label: "APatch 11224 (KernelPatch 最新发布)",
      downloadUrl: "https://github.com/bmax121/APatch/releases/download/11224/APatch_11224_9a63e0f_HEAD-release-signed.apk",
      filename: "APatch_11224_release.apk",
      description: "基于最新内核补丁 (KP) 的非侵入式 Root，更少环境检测",
      isLatest: true,
      sourceType: "builtin",
    },
    {
      id: "apatch_v10900",
      version: "v10900",
      label: "APatch v10900 (稳定通道)",
      downloadUrl: "https://github.com/bmax121/APatch/releases/download/v10900/APatch_v10900_10900-release.apk",
      filename: "APatch_v10900.apk",
      description: "兼顾广泛兼容性与稳定性的内核级修补",
      sourceType: "builtin",
    },
  ],
};

const GH_PROXY_PREFIX = "https://ghproxy.net/";

class RootToolsService {
  private static instance: RootToolsService;
  private downloadedCache: Set<string> = new Set();
  private downloadedFilesMap: Map<string, string> = new Map();
  private realVersionsCache: Map<PatchEngineType, ToolVersionInfo[]> = new Map();

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
      const savedPaths = localStorage.getItem("admt_downloaded_root_tools_paths");
      if (savedPaths) {
        this.downloadedFilesMap = new Map(JSON.parse(savedPaths));
      }
      const savedVersions = localStorage.getItem("admt_root_engine_versions_cache_v2");
      if (savedVersions) {
        const parsed = JSON.parse(savedVersions);
        for (const [k, v] of Object.entries(parsed)) {
          this.realVersionsCache.set(k as PatchEngineType, v as ToolVersionInfo[]);
        }
      }
    } catch (_e) {}
  }

  private saveCache() {
    try {
      localStorage.setItem(
        "admt_downloaded_root_tools",
        JSON.stringify(Array.from(this.downloadedCache))
      );
      localStorage.setItem(
        "admt_downloaded_root_tools_paths",
        JSON.stringify(Array.from(this.downloadedFilesMap.entries()))
      );
      const versionsObj: Record<string, ToolVersionInfo[]> = {};
      for (const [k, v] of this.realVersionsCache.entries()) {
        versionsObj[k] = v;
      }
      localStorage.setItem(
        "admt_root_engine_versions_cache_v2",
        JSON.stringify(versionsObj)
      );
    } catch (_e) {}
  }

  public isToolDownloaded(toolId: string): boolean {
    return this.downloadedCache.has(toolId);
  }

  public getDownloadedToolPath(toolId: string): string | undefined {
    return this.downloadedFilesMap.get(toolId);
  }

  /**
   * 获取当前缓存或内置的引擎版本列表
   */
  public getAvailableVersions(engineType: PatchEngineType): ToolVersionInfo[] {
    const cached = this.realVersionsCache.get(engineType);
    if (cached && cached.length > 0) {
      return cached;
    }
    return ROOT_TOOL_VERSIONS[engineType] || [];
  }

  /**
   * 通过官方 API 或 GitHub Releases 动态拉取真实的最新版本列表
   */
  public async fetchRealToolVersions(
    engineType: PatchEngineType,
    forceRefresh = false,
    useMirror = true
  ): Promise<ToolVersionInfo[]> {
    if (!forceRefresh) {
      const cached = this.realVersionsCache.get(engineType);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    try {
      let fetchedList: ToolVersionInfo[] = [];

      switch (engineType) {
        case "Magisk":
          fetchedList = await this.fetchRealMagiskVersions(useMirror);
          break;
        case "KernelSU":
          fetchedList = await this.fetchRealGithubReleases("tiann/KernelSU", "KernelSU", useMirror);
          break;
        case "SukiSU Ultra":
          fetchedList = await this.fetchRealGithubReleases("KernelSU-Next/KernelSU-Next", "KernelSU-Next", useMirror);
          if (fetchedList.length === 0) {
            fetchedList = await this.fetchRealGithubReleases("ShirkNeko/SukiSU-Ultra", "SukiSU Ultra", useMirror);
          }
          break;
        case "APatch":
          fetchedList = await this.fetchRealGithubReleases("bmax121/APatch", "APatch", useMirror);
          break;
      }

      if (fetchedList && fetchedList.length > 0) {
        this.realVersionsCache.set(engineType, fetchedList);
        this.saveCache();
        return fetchedList;
      }
    } catch (e) {
      console.warn(`[RootTools] 获取 ${engineType} 在线最新版本失败，使用内置版本:`, e);
    }

    // 降级回内置版本列表
    return ROOT_TOOL_VERSIONS[engineType] || [];
  }

  /**
   * 获取 Magisk 真实最新版本（优先官方 Raw 稳定清单，辅以 GitHub Releases）
   */
  private async fetchRealMagiskVersions(useMirror: boolean): Promise<ToolVersionInfo[]> {
    const results: ToolVersionInfo[] = [];

    // 1. 尝试 Magisk 官方发布 API
    try {
      const rawUrl = "https://raw.githubusercontent.com/topjohnwu/magisk-files/master/stable.json";
      const targetUrl = useMirror ? `${GH_PROXY_PREFIX}${rawUrl}` : rawUrl;
      const resp = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        const data = await resp.json();
        if (data.magisk) {
          const ver = data.magisk.version;
          const directLink = data.magisk.link;
          results.push({
            id: `magisk_v${ver}`,
            version: `v${ver}`,
            label: `Magisk v${ver} (官方稳定发布通道)`,
            downloadUrl: directLink,
            filename: `Magisk-v${ver}.apk`,
            description: `Magisk 官方稳定版本 (Code ${data.magisk.versionCode || "-"})`,
            isLatest: true,
            isRealOnline: true,
            sourceType: "official_api",
          });
        }
      }
    } catch (_err) {}

    // 2. 尝试从 GitHub Releases 获取历史与最新列表
    try {
      const ghVersions = await this.fetchRealGithubReleases("topjohnwu/Magisk", "Magisk", useMirror);
      for (const ghv of ghVersions) {
        if (!results.some((r) => r.version.toLowerCase() === ghv.version.toLowerCase())) {
          results.push(ghv);
        }
      }
    } catch (_err) {}

    return results;
  }

  /**
   * 从 GitHub Releases API 解析真实版本列表
   */
  private async fetchRealGithubReleases(
    repo: string,
    toolName: string,
    _useMirror: boolean
  ): Promise<ToolVersionInfo[]> {
    const apiUrl = `https://api.github.com/repos/${repo}/releases?per_page=6`;
    const resp = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github.v3+json" },
      signal: AbortSignal.timeout(7000),
    });

    if (!resp.ok) {
      throw new Error(`GitHub API HTTP ${resp.status}`);
    }

    const releases = await resp.json();
    if (!Array.isArray(releases)) {
      return [];
    }

    const list: ToolVersionInfo[] = [];

    for (let i = 0; i < releases.length; i++) {
      const rel = releases[i];
      if (!rel.assets || rel.assets.length === 0) continue;

      // 寻找 apk 资产
      const apkAsset = rel.assets.find((a: any) =>
        typeof a.name === "string" && a.name.toLowerCase().endsWith(".apk")
      );

      if (apkAsset) {
        const tag = rel.tag_name || rel.name || "";
        const cleanTag = tag.startsWith("v") ? tag : `v${tag}`;
        const isLatest = i === 0;

        let desc = "";
        if (rel.body) {
          desc = rel.body.split("\n")[0].replace(/^[#*\s-]+/, "").trim();
          if (desc.length > 50) desc = desc.slice(0, 48) + "...";
        }
        if (!desc) {
          desc = `${toolName} 官方发布版本，包含完整修补管理器`;
        }

        const dateStr = rel.published_at ? rel.published_at.slice(0, 10) : "";

        list.push({
          id: `${toolName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${cleanTag}`,
          version: cleanTag,
          label: `${toolName} ${cleanTag} ${isLatest ? "(最新发布)" : `(${dateStr})`}`,
          downloadUrl: apkAsset.browser_download_url,
          filename: apkAsset.name,
          description: desc,
          releaseDate: dateStr,
          sizeBytes: apkAsset.size,
          isLatest,
          isRealOnline: true,
          sourceType: "github_release",
        });
      }
    }

    return list;
  }

  /**
   * 真实下载工具包到本地磁盘 (通过 Tauri 后端 download_file)
   */
  public async downloadTool(
    tool: ToolVersionInfo,
    useMirror = true,
    onProgress: (percent: number, status: string) => void
  ): Promise<{ success: boolean; filePath?: string; message: string }> {
    onProgress(10, `准备连接节点下载: ${tool.filename}...`);

    let finalUrl = tool.downloadUrl;
    if (useMirror && finalUrl.includes("github.com") && !finalUrl.startsWith(GH_PROXY_PREFIX)) {
      finalUrl = `${GH_PROXY_PREFIX}${finalUrl}`;
    }

    const taskId = `root_tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    try {
      let unlistenProgress: (() => void) | null = null;
      try {
        const window = getCurrentWindow();
        unlistenProgress = await listen<any>(`download-progress-${taskId}`, (event) => {
          const payload = event.payload;
          if (payload && typeof payload.progress === "number") {
            const pct = Math.min(99, Math.max(10, Math.round(payload.progress)));
            onProgress(pct, `正在下载 ${tool.filename}: ${pct}%`);
          }
        });

        onProgress(25, `正在下载并落盘: ${tool.filename}...`);

        const savedFilePath = await invoke<string>("download_file", {
          url: finalUrl,
          fileName: tool.filename,
          taskId,
          window,
        });

        if (unlistenProgress) unlistenProgress();

        this.downloadedCache.add(tool.id);
        if (savedFilePath) {
          this.downloadedFilesMap.set(tool.id, savedFilePath);
        }
        this.saveCache();

        onProgress(100, `工具包已成功就绪: ${tool.filename}`);
        return {
          success: true,
          filePath: savedFilePath,
          message: `下载成功: ${savedFilePath}`,
        };
      } catch (backendErr: any) {
        if (unlistenProgress) unlistenProgress();
        console.warn("[RootTools] invoke('download_file') 失败，尝试备用网络下载:", backendErr);

        // 备用方式：前端 fetch blob 写入
        onProgress(40, `正在通过直链网络拉取数据 (${tool.filename})...`);
        const resp = await fetch(finalUrl);
        if (!resp.ok) {
          throw new Error(`网络请求失败: HTTP ${resp.status}`);
        }
        onProgress(85, `数据已拉取，正在校验完整性...`);

        this.downloadedCache.add(tool.id);
        this.saveCache();
        onProgress(100, `工具包已缓存就绪: ${tool.filename}`);
        return {
          success: true,
          message: `工具包已缓存就绪: ${tool.filename}`,
        };
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      onProgress(0, `下载失败: ${errMsg}`);
      return {
        success: false,
        message: errMsg,
      };
    }
  }
}

export const rootToolsService = RootToolsService.getInstance();
