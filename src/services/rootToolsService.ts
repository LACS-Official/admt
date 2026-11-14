import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { appDataDir, join } from "@tauri-apps/api/path";
import { writeFile, mkdir, stat } from "@tauri-apps/plugin-fs";
import { PatchEngineType } from "./oneClickRootService";
import { useAppStore } from "../stores/appStore";

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

// ===== 在线数据源健康状态（供 UI 显示在线 / 离线）=====
export interface RootDataSourceStatus {
  online: boolean; // 是否有任一在线数据源成功
  lastSyncedAt: string | null; // 最近一次成功同步时间
  lastError: string | null; // 最近一次失败原因
  fromCache: boolean; // 当前展示是否来自离线静态兜底 / 缓存
  toolVersionsOnline: boolean; // 工具版本在线数据是否获取成功
  modulesOnline: boolean; // 模块列表在线数据是否获取成功
}

let rootDataSourceState: RootDataSourceStatus = {
  online: false,
  lastSyncedAt: null,
  lastError: null,
  fromCache: true,
  toolVersionsOnline: false,
  modulesOnline: false,
};

export function getRootDataSourceStatus(): RootDataSourceStatus {
  const online =
    rootDataSourceState.toolVersionsOnline || rootDataSourceState.modulesOnline;
  return {
    ...rootDataSourceState,
    online,
    fromCache: !online,
  };
}

/** 供两个 root 服务各自上报在线拉取结果，统一汇总到同一份状态 */
export function reportRootDataSource(patch: Partial<RootDataSourceStatus>): void {
  rootDataSourceState = { ...rootDataSourceState, ...patch };
}

const GH_API_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
};

/**
 * 用 Tauri HTTP 插件发起 GET，绕过 WebView CORS，并带真实超时。
 * 失败一律抛出明确错误，绝不静默吞掉。
 */
async function tauriFetchWithTimeout(
  url: string,
  timeoutMs: number,
  headers?: Record<string, string>
): Promise<Response> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`请求超时 (${timeoutMs}ms): ${url}`));
    }, timeoutMs);
  });

  try {
    const resp = await Promise.race([
      tauriFetch(url, {
        method: "GET",
        headers: { "User-Agent": "ADMT/1.0", ...(headers || {}) },
        signal: controller.signal,
      }),
      timeout,
    ]);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${url}`);
    }
    return resp;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 复用给其它 root 服务：带超时、明确失败的 GitHub Releases JSON 拉取 */
export async function fetchGithubJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const resp = await tauriFetchWithTimeout(url, timeoutMs, GH_API_HEADERS);
  return (await resp.json()) as T;
}

interface GhRelease {
  tag_name?: string;
  name?: string;
  published_at?: string;
  body?: string;
  assets?: Array<{
    name?: string;
    browser_download_url?: string;
    size?: number;
  }>;
}

/** 每个引擎对应的 GitHub Releases 仓库（多仓库结果合并去重） */
const ENGINE_REPOS: Record<PatchEngineType, { repo: string; toolName: string }[]> = {
  Magisk: [{ repo: "topjohnwu/Magisk", toolName: "Magisk" }],
  KernelSU: [{ repo: "tiann/KernelSU", toolName: "KernelSU" }],
  APatch: [{ repo: "bmax121/APatch", toolName: "APatch" }],
  "SukiSU Ultra": [
    { repo: "KernelSU-Next/KernelSU-Next", toolName: "KernelSU-Next" },
    { repo: "ShirkNeko/SukiSU-Ultra", toolName: "SukiSU Ultra" },
  ],
};

function parseReleases(rels: GhRelease[], toolName: string): ToolVersionInfo[] {
  const list: ToolVersionInfo[] = [];
  for (const rel of rels) {
    if (!rel.assets || rel.assets.length === 0) continue;
    const apk = rel.assets.find(
      (a) => typeof a.name === "string" && a.name.toLowerCase().endsWith(".apk")
    );
    if (!apk || !apk.browser_download_url || !apk.name) continue;

    const tag = rel.tag_name || rel.name || "";
    const cleanTag = tag.startsWith("v") ? tag : `v${tag}`;
    let desc = "";
    if (rel.body) {
      desc = rel.body.split("\n")[0].replace(/^[#*\s-]+/, "").trim();
      if (desc.length > 60) desc = desc.slice(0, 58) + "...";
    }
    if (!desc) desc = `${toolName} 官方发布版本，包含完整修补管理器`;
    const dateStr = rel.published_at ? rel.published_at.slice(0, 10) : "";

    list.push({
      id: `${toolName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${cleanTag}`,
      version: cleanTag,
      label: `${toolName} ${cleanTag}${dateStr ? ` (${dateStr})` : ""}`,
      downloadUrl: apk.browser_download_url,
      filename: apk.name,
      description: desc,
      releaseDate: dateStr,
      sizeBytes: apk.size,
      isRealOnline: true,
      sourceType: "github_release",
    });
  }
  return list;
}

/** 在线优先、按版本号去重后与静态兜底合并 */
function mergeVersions(engine: PatchEngineType, online: ToolVersionInfo[]): ToolVersionInfo[] {
  const staticList = ROOT_TOOL_VERSIONS[engine] || [];
  if (online.length === 0) return staticList.map((v) => ({ ...v }));

  const seen = new Set<string>();
  const merged: ToolVersionInfo[] = [];
  for (const item of online) {
    const key = item.version.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...item, isLatest: merged.length === 0 });
  }
  for (const item of staticList) {
    const key = item.version.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...item, isLatest: false });
  }
  return merged;
}

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
    } catch (_e) {
      // ignore cache load error
    }
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
    } catch (_e) {
      // ignore cache save error
    }
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

  /** 将在线拉取到的版本列表写入缓存，使 getAvailableVersions 也能反映在线数据 */
  public cacheOnlineVersions(record: Record<PatchEngineType, ToolVersionInfo[]>): void {
    for (const [k, v] of Object.entries(record)) {
      if (v && v.length > 0) {
        this.realVersionsCache.set(k as PatchEngineType, v);
      }
    }
    this.saveCache();
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
      const resp = await tauriFetchWithTimeout(targetUrl, 6000);
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
    } catch (err) {
      console.warn("[RootTools] Magisk 官方稳定清单拉取失败:", err);
    }

    // 2. 尝试从 GitHub Releases 获取历史与最新列表
    try {
      const ghVersions = await this.fetchRealGithubReleases("topjohnwu/Magisk", "Magisk", useMirror);
      for (const ghv of ghVersions) {
        if (!results.some((r) => r.version.toLowerCase() === ghv.version.toLowerCase())) {
          results.push(ghv);
        }
      }
    } catch (err) {
      console.warn("[RootTools] Magisk GitHub Releases 拉取失败:", err);
    }

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
    // 使用 Tauri HTTP 插件绕过 WebView CORS，带真实超时，失败抛出明确错误
    const releases = await fetchGithubJson<any[]>(apiUrl, 7000);
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
   * 校验落盘文件真实存在且大小 > 0。
   * 优先用 plugin-fs stat 读取磁盘真实大小；若 stat 命令未放行，
   * 退回调用方已知的写入字节长度（仅 plugin-fs 落盘路径有该值）。
   */
  private async verifyDownloadedFile(
    filePath: string,
    writtenByteLength: number
  ): Promise<boolean> {
    try {
      const info = await stat(filePath);
      return typeof info.size === "number" && info.size > 0;
    } catch {
      return writtenByteLength > 0;
    }
  }

  /** 统一处理「真实落盘成功」后的缓存与全局状态栏 / 下载指示器联动 */
  private finishDownloadSuccess(
    tool: ToolVersionInfo,
    taskId: string,
    filePath: string,
    onProgress: (percent: number, status: string) => void
  ): { success: boolean; filePath?: string; message: string } {
    this.downloadedCache.add(tool.id);
    this.downloadedFilesMap.set(tool.id, filePath);
    this.saveCache();

    onProgress(100, `工具包已成功就绪: ${tool.filename}`);
    useAppStore.getState().setGlobalDownload({
      taskId,
      fileName: tool.filename,
      progress: 100,
      status: "completed",
    });
    useAppStore.getState().setStatusBarMessage({
      type: "success",
      message: `工具包下载就绪: ${tool.filename}`,
      duration: 3500,
    });
    setTimeout(() => {
      if (useAppStore.getState().globalDownload?.taskId === taskId) {
        useAppStore.getState().setGlobalDownload(null);
      }
    }, 3500);

    return {
      success: true,
      filePath,
      message: `下载成功: ${filePath}`,
    };
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
    const taskId = `root_tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    useAppStore.getState().setStatusBarMessage({
      type: "info",
      message: `开始下载工具: ${tool.filename}`,
      duration: 2000,
    });
    useAppStore.getState().setGlobalDownload({
      taskId,
      fileName: tool.filename,
      progress: 10,
      status: "downloading",
    });

    let finalUrl = tool.downloadUrl;
    if (useMirror && finalUrl.includes("github.com") && !finalUrl.startsWith(GH_PROXY_PREFIX)) {
      finalUrl = `${GH_PROXY_PREFIX}${finalUrl}`;
    }

    try {
      let unlistenProgress: (() => void) | null = null;
      try {
        const window = getCurrentWindow();
        unlistenProgress = await listen<any>(`download-progress-${taskId}`, (event) => {
          const payload = event.payload;
          if (payload && typeof payload.progress === "number") {
            const pct = Math.min(99, Math.max(10, Math.round(payload.progress)));
            onProgress(pct, `正在下载 ${tool.filename}: ${pct}%`);
            useAppStore.getState().setGlobalDownload({
              taskId,
              fileName: tool.filename,
              progress: pct,
              status: "downloading",
            });
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

        useAppStore.getState().setGlobalDownload({
          taskId,
          fileName: tool.filename,
          progress: 100,
          status: "completed",
        });
        useAppStore.getState().setStatusBarMessage({
          type: "success",
          message: `工具包下载就绪: ${tool.filename}`,
          duration: 3500,
        });
        setTimeout(() => {
          if (useAppStore.getState().globalDownload?.taskId === taskId) {
            useAppStore.getState().setGlobalDownload(null);
          }
        }, 3500);

        return {
          success: true,
          filePath: savedFilePath,
          message: `下载成功: ${savedFilePath}`,
        };
      } catch (backendErr: any) {
        if (unlistenProgress) unlistenProgress();
        console.warn("[RootTools] invoke('download_file') 失败，尝试备用下载:", backendErr);

        // 备用方式 1：改用另一条后端下载命令真实落盘。
        // download_apk 真实签名：url / file_name / is_direct（JS 侧为 camelCase 的 url/fileName/isDirect）。
        try {
          onProgress(40, `备用通道：通过后端命令下载并落盘 (${tool.filename})...`);
          const backendPath = await invoke<string>("download_apk", {
            url: finalUrl,
            fileName: tool.filename,
            isDirect: true,
          });
          if (!backendPath) {
            throw new Error("后端下载命令未返回有效文件路径");
          }
          if (!(await this.verifyDownloadedFile(backendPath, 0))) {
            throw new Error("后端落盘文件为空或无法校验文件大小");
          }
          return this.finishDownloadSuccess(tool, taskId, backendPath, onProgress);
        } catch (apkErr: any) {
          console.warn(
            "[RootTools] download_apk 备用失败，回退到 plugin-fs 落盘:",
            apkErr?.message || apkErr
          );
        }

        // 备用方式 2：经 Tauri HTTP 插件拉取字节，用 plugin-fs 写入 appDataDir 持久化目录。
        // capabilities/default.json 已放行 fs:allow-write-file / fs:allow-mkdir 且作用域含 $APP/**。
        onProgress(55, `备用通道：拉取数据并写入持久化目录 (${tool.filename})...`);
        const resp = await tauriFetchWithTimeout(finalUrl, 30000);
        const bytes = new Uint8Array(await resp.arrayBuffer());
        if (bytes.byteLength === 0) {
          throw new Error("下载内容为空 (0 字节)，拒绝标记为已下载");
        }

        onProgress(85, `数据已拉取，正在写入磁盘并校验...`);
        const baseDir = await appDataDir();
        const targetDir = await join(baseDir, "root-tools");
        await mkdir(targetDir, { recursive: true });
        const filePath = await join(targetDir, tool.filename);
        await writeFile(filePath, bytes);

        // 落盘后必须校验文件大小 > 0，才允许加入缓存并返回成功；任何失败都向上抛出明确错误。
        if (!(await this.verifyDownloadedFile(filePath, bytes.byteLength))) {
          throw new Error("文件落盘后校验失败（大小为 0 或无法读取）");
        }
        return this.finishDownloadSuccess(tool, taskId, filePath, onProgress);
      }
    } catch (err: any) {
      const errMsg = err.message || String(err);
      useAppStore.getState().setGlobalDownload({
        taskId,
        fileName: tool.filename,
        progress: 0,
        status: "failed",
      });
      useAppStore.getState().setStatusBarMessage({
        type: "error",
        message: `下载失败: ${tool.filename} (${errMsg})`,
        duration: 4000,
      });
      setTimeout(() => {
        if (useAppStore.getState().globalDownload?.taskId === taskId) {
          useAppStore.getState().setGlobalDownload(null);
        }
      }, 4000);
      onProgress(0, `下载失败: ${errMsg}`);
      return {
        success: false,
        message: errMsg,
      };
    }
  }
}

export const rootToolsService = RootToolsService.getInstance();

/**
 * 通过 GitHub Releases API 拉取 Magisk / KernelSU / KernelSU-Next / APatch / SukiSU-Ultra
 * 的最新 release 版本号与安装包直链，与内置静态列表合并去重（在线优先）。
 * 全部失败时返回静态列表；每个请求独立超时，失败原因记录到数据源状态，绝不静默吞掉。
 */
export async function fetchLatestRootToolVersions(): Promise<
  Record<PatchEngineType, ToolVersionInfo[]>
> {
  const engines = Object.keys(ENGINE_REPOS) as PatchEngineType[];
  const errors: string[] = [];
  let anyOnline = false;

  const tasks = engines.map(async (engine) => {
    const repos = ENGINE_REPOS[engine];
    const results = await Promise.allSettled(
      repos.map(async ({ repo, toolName }) => {
        const rels = await fetchGithubJson<GhRelease[]>(
          `https://api.github.com/repos/${repo}/releases?per_page=6`
        );
        if (!Array.isArray(rels)) {
          throw new Error(`${repo} 返回数据格式异常`);
        }
        return parseReleases(rels, toolName);
      })
    );

    const online: ToolVersionInfo[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        online.push(...r.value);
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.push(`${engine}: ${msg}`);
        console.warn(`[RootTools] 拉取在线版本失败 (${engine}):`, msg);
      }
    }

    // 多仓库之间按版本号去重
    const deduped: ToolVersionInfo[] = [];
    const seen = new Set<string>();
    for (const item of online) {
      const key = item.version.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    if (deduped.length > 0) anyOnline = true;
    return { engine, list: mergeVersions(engine, deduped) };
  });

  const settled = await Promise.all(tasks);
  const record = {} as Record<PatchEngineType, ToolVersionInfo[]>;
  for (const s of settled) {
    record[s.engine] = s.list;
  }

  if (anyOnline) {
    rootToolsService.cacheOnlineVersions(record);
    reportRootDataSource({
      lastSyncedAt: new Date().toISOString(),
      lastError: errors.length > 0 ? errors.join(" | ") : null,
      toolVersionsOnline: true,
    });
  } else {
    // 全部失败：明确降级为静态列表
    reportRootDataSource({
      lastError: errors.length > 0 ? errors.join(" | ") : "所有在线工具版本数据源均不可用",
      toolVersionsOnline: false,
    });
    for (const engine of engines) {
      record[engine] = (ROOT_TOOL_VERSIONS[engine] || []).map((v) => ({ ...v }));
    }
  }

  return record;
}
