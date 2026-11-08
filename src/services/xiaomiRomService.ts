import { load as yamlLoad } from "js-yaml";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { DeviceInfo } from "../types/device";

export interface XiaomiRomItem {
  name: string;
  codename: string;
  version: string;
  android: string;
  branch: string; // Stable, Public Beta, Stable Beta, Weekly
  method: "Recovery" | "Fastboot";
  date: string;
  size: string;
  link: string;
  md5?: string;
  /** index = 官方索引自带的真实直链；scraped = 站点页面推导，仅用于历史版本 */
  source?: "index" | "scraped";
}

export interface XiaomiDevicePreset {
  name: string;
  codename: string;
  series: "Xiaomi" | "Redmi" | "POCO";
}

// 常见热门小米机型快捷预设
export const POPULAR_XIAOMI_DEVICES: XiaomiDevicePreset[] = [
  // 小米数字系列
  { name: "Xiaomi 15", codename: "dada", series: "Xiaomi" },
  { name: "Xiaomi 15 Pro", codename: "haotian", series: "Xiaomi" },
  { name: "Xiaomi 14", codename: "houji", series: "Xiaomi" },
  { name: "Xiaomi 14 Pro", codename: "shennong", series: "Xiaomi" },
  { name: "Xiaomi 14 Ultra", codename: "aurora", series: "Xiaomi" },
  { name: "Xiaomi 13", codename: "fuxi", series: "Xiaomi" },
  { name: "Xiaomi 13 Pro", codename: "nuwa", series: "Xiaomi" },
  { name: "Xiaomi 13 Ultra", codename: "ishtar", series: "Xiaomi" },
  { name: "Xiaomi 12S Ultra", codename: "thor", series: "Xiaomi" },
  { name: "Xiaomi 12S Pro", codename: "unicorn", series: "Xiaomi" },
  { name: "Xiaomi 12S", codename: "mayfly", series: "Xiaomi" },
  { name: "Xiaomi 12 Pro", codename: "zeus", series: "Xiaomi" },
  { name: "Xiaomi 12", codename: "cupid", series: "Xiaomi" },
  { name: "Xiaomi 11", codename: "venus", series: "Xiaomi" },
  { name: "Xiaomi 11 Ultra / Pro", codename: "star", series: "Xiaomi" },

  // Redmi K 系列
  { name: "Redmi K80", codename: "zorn", series: "Redmi" },
  { name: "Redmi K70", codename: "manet", series: "Redmi" },
  { name: "Redmi K70 Pro", codename: "vermeer", series: "Redmi" },
  { name: "Redmi K70E", codename: "duchamp", series: "Redmi" },
  { name: "Redmi K60", codename: "mondrian", series: "Redmi" },
  { name: "Redmi K60 Pro", codename: "socrates", series: "Redmi" },
  { name: "Redmi K60 Ultra", codename: "corot", series: "Redmi" },
  { name: "Redmi K50", codename: "rubens", series: "Redmi" },
  { name: "Redmi K50 Pro", codename: "matisse", series: "Redmi" },
  { name: "Redmi K50 Gaming", codename: "ingres", series: "Redmi" },
  { name: "Redmi K40 / POCO F3", codename: "alioth", series: "Redmi" },
  { name: "Redmi K40 Pro / +", codename: "haydn", series: "Redmi" },
  { name: "Redmi K40 Gaming", codename: "ares", series: "Redmi" },

  // Redmi Note 系列
  { name: "Redmi Note 14 Pro+", codename: "amethyst", series: "Redmi" },
  { name: "Redmi Note 14 Pro", codename: "malachite", series: "Redmi" },
  { name: "Redmi Note 13 Pro+", codename: "zircon", series: "Redmi" },
  { name: "Redmi Note 13 Pro", codename: "garnet", series: "Redmi" },
  { name: "Redmi Note 12 Turbo / POCO F5", codename: "marble", series: "Redmi" },
  { name: "Redmi Note 11T Pro / POCO X4 GT", codename: "xaga", series: "Redmi" },

  // POCO 系列
  { name: "POCO F6 Pro", codename: "vermeer", series: "POCO" },
  { name: "POCO F6", codename: "peridot", series: "POCO" },
  { name: "POCO X6 Pro", codename: "duchamp", series: "POCO" },

  // 2025–2026 新机型：仅在索引不可达时作为离线兜底，正常情况由动态预设覆盖
  { name: "Redmi K80 Pro", codename: "miro", series: "Redmi" },
  { name: "Redmi K80 Ultra", codename: "dali", series: "Redmi" },
  { name: "Redmi K90", codename: "annibale", series: "Redmi" },
  { name: "Redmi K90 Pro Max", codename: "myron", series: "Redmi" },
  { name: "Xiaomi 17 Max", codename: "byron", series: "Xiaomi" },
  { name: "Xiaomi 17 Ultra", codename: "nezha", series: "Xiaomi" },
  { name: "Xiaomi 17T", codename: "chagall", series: "Xiaomi" },
  { name: "Redmi Note 17 Pro", codename: "iolite", series: "Redmi" },
  { name: "Redmi Note 17", codename: "mist", series: "Redmi" },
];

/**
 * 判断是否为小米体系设备
 */
export function isXiaomiDevice(device: DeviceInfo | null | undefined): boolean {
  if (!device) return false;
  
  // Fastboot 模式下优先检查 fastbootVariables 中的 product
  if (device.fastbootVariables?.product) {
    const p = device.fastbootVariables.product.toLowerCase();
    if (POPULAR_XIAOMI_DEVICES.some(d => d.codename === p)) return true;
  }

  if (!device.properties) return false;
  const brand = (device.properties.brand || "").toLowerCase();
  const manufacturer = (device.properties.manufacturer || "").toLowerCase();
  
  const xiaomiBrands = ["xiaomi", "redmi", "poco", "blackshark"];
  return xiaomiBrands.some(b => brand.includes(b) || manufacturer.includes(b));
}

/**
 * 提取小米设备代号（Codename）
 */
export function extractXiaomiDeviceCode(device: DeviceInfo | null | undefined): string {
  if (!device) return "";

  // 1. Fastboot 模式下
  if (device.fastbootVariables?.product) {
    return device.fastbootVariables.product.toLowerCase().trim();
  }

  // 2. ADB 系统模式下 properties
  if (device.properties) {
    const candidates = [
      device.properties.deviceName,
      device.properties.productName,
      device.properties.productBoard,
      device.properties.boardPlatform,
      device.properties.model,
    ];

    for (const c of candidates) {
      if (c && c !== "未知" && c !== "unknown" && !c.includes(" ") && c.length >= 2) {
        return c.toLowerCase().trim();
      }
    }

    if (device.properties.model) {
      return device.properties.model.toLowerCase().replace(/\s+/g, "_");
    }
  }

  return "";
}

/**
 * 提取设备当前系统版本号（例如 OS1.0.305.0.WNCCNXM 或 V14.0.32.0.TMCCNXM）
 */
export function extractXiaomiRomVersion(device: DeviceInfo | null | undefined): string {
  if (!device || !device.properties) return "";

  // 1. 优先读取 HyperOS 真实的系统版本增量 (例如 OS1.0.6.0.TKHCNXM)
  const osInc = device.properties.osVersionIncremental || "";
  if (osInc) {
    const match = osInc.match(/(OS\d+\.\d+\.\d+\.\d+\.[A-Z]+)/i);
    if (match) return match[1].toUpperCase();
    return osInc;
  }

  const buildId = device.properties.buildId || "";
  const systemVersion = device.properties.systemVersion || "";

  // 2. 智能校正 HyperOS 底层对旧应用的 V816 兼容编码 (例如 V816.0.6.0.TKHCNXM -> OS1.0.6.0.TKHCNXM)
  const normalizeHyperOs = (str: string) => {
    if (!str) return "";
    if (/^V?816\./i.test(str)) {
      return str.replace(/^V?816\./i, "OS1.");
    }
    return str;
  };

  const cleanSys = normalizeHyperOs(systemVersion);
  const cleanBuild = normalizeHyperOs(buildId);

  const versionRegex = /(OS\d+\.\d+\.\d+\.\d+\.[A-Z]+|V\d+\.\d+\.\d+\.\d+\.[A-Z]+)/i;

  const matchSys = cleanSys.match(versionRegex);
  if (matchSys) return matchSys[1].toUpperCase();

  const matchBuildId = cleanBuild.match(versionRegex);
  if (matchBuildId) return matchBuildId[1].toUpperCase();

  return cleanSys || cleanBuild || "";
}

/**
 * 将底层 ROM 固件版本号格式化为人类友好的可读字符串
 * 例如：
 *  - OS1.0.6.0.TKHCNXM -> HyperOS 1.0.6.0 (OS1.0.6.0.TKHCNXM)
 *  - V816.0.6.0.TKHCNXM -> HyperOS 1.0.6.0 (OS1.0.6.0.TKHCNXM)
 *  - V14.0.23.0.TMCCNXM -> MIUI 14.0.23.0 (V14.0.23.0.TMCCNXM)
 */
export function formatXiaomiVersionFriendly(rawVersion: string): string {
  if (!rawVersion) return "未知版本";

  let normalized = rawVersion.trim();
  if (/^V?816\./i.test(normalized)) {
    normalized = normalized.replace(/^V?816\./i, "OS1.");
  }

  // 匹配 HyperOS: OS1.0.6.0
  const hyperMatch = normalized.match(/OS(\d+\.\d+\.\d+(\.\d+)?)/i);
  if (hyperMatch) {
    const verNum = hyperMatch[1];
    return `HyperOS ${verNum} (${normalized})`;
  }

  // 匹配传统 MIUI: V14.0.23.0
  const miuiMatch = normalized.match(/V(\d+\.\d+\.\d+(\.\d+)?)/i);
  if (miuiMatch) {
    const verNum = miuiMatch[1];
    return `MIUI ${verNum} (${normalized})`;
  }

  return normalized;
}

export interface XiaomiRomInfo {
  deviceCode: string;
  romVersion: string;
  region: string;
  downloadUrl?: string;
  filename?: string;
  source: "official_api" | "ota_cdn" | "community" | "manual";
}

/**
 * 根据版本号推断地区代码（CN / Global / EEA / RU / IN 等）
 */
export function detectXiaomiRegion(version: string): string {
  const upper = version.toUpperCase();
  if (upper.includes("CN")) return "cn";
  if (upper.includes("MI")) return "global";
  if (upper.includes("EU") || upper.includes("EEA")) return "eea";
  if (upper.includes("RU")) return "ru";
  if (upper.includes("IN")) return "in";
  if (upper.includes("ID")) return "id";
  if (upper.includes("TW")) return "tw";
  if (upper.includes("TR")) return "tr";
  return "cn";
}

/**
 * 兼容原有接口：根据设备信息自动获取官方全量包直链
 */
export async function queryXiaomiOfficialRom(device: DeviceInfo): Promise<XiaomiRomInfo> {
  const deviceCode = extractXiaomiDeviceCode(device);
  const romVersion = extractXiaomiRomVersion(device);
  const region = detectXiaomiRegion(romVersion);

  if (!deviceCode) {
    throw new Error("未能识别到有效的小米机型代号");
  }

  // 优先从最新 ROM 镜像库查找匹配的 Recovery 卡刷包
  try {
    const list = await queryXiaomiRoms({
      codename: deviceCode,
      versionFilter: romVersion || undefined,
      methodFilter: "Recovery",
    });

    if (list.length > 0 && list[0].link) {
      return {
        deviceCode,
        romVersion: list[0].version || romVersion,
        region,
        downloadUrl: list[0].link,
        filename: list[0].link.split("/").pop(),
        source: "community",
      };
    }
  } catch (_e) {
    // 降级使用官方 CDN 构造
  }

  // 降级方案：通用官方 BigOTA CDN 直链规则
  const defaultFilename = `miui_${deviceCode.toUpperCase()}_${romVersion}.zip`;
  const defaultUrl = `https://bigota.d.miui.com/${romVersion}/${defaultFilename}`;

  return {
    deviceCode,
    romVersion,
    region,
    downloadUrl: defaultUrl,
    filename: defaultFilename,
    source: "ota_cdn",
  };
}

// 缓存查询结果，避免重复请求大数据集
let cachedRomDatabase: XiaomiRomItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 分钟缓存

const GITHUB_API_BASE =
  "https://api.github.com/repos/XiaomiFirmwareUpdater/miui-updates-tracker";
const GITHUB_API_HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ADMT-ROM-Center",
};
// 本机实测：testingcf / gcore 两个 jsDelivr 节点可直连且返回完整索引；
// fastly / cdn / raw 常被代理或 TLS 握手拦截，留作其它网络环境的兜底。
const LEGACY_YAML_MIRRORS = [
  "https://testingcf.jsdelivr.net/gh/XiaomiFirmwareUpdater/miui-updates-tracker@master/data/latest.yml",
  "https://gcore.jsdelivr.net/gh/XiaomiFirmwareUpdater/miui-updates-tracker@master/data/latest.yml",
  "https://fastly.jsdelivr.net/gh/XiaomiFirmwareUpdater/miui-updates-tracker@master/data/latest.yml",
  "https://cdn.jsdelivr.net/gh/XiaomiFirmwareUpdater/miui-updates-tracker@master/data/latest.yml",
  "https://raw.githubusercontent.com/XiaomiFirmwareUpdater/miui-updates-tracker/master/data/latest.yml",
];

// GitHub 未认证 API 限流 60 次/小时，撞限流时仍需能展示上次的完整索引
const INDEX_CACHE_KEY = "admt_xiaomi_rom_index_yaml";
const INDEX_CACHE_TIME_KEY = "admt_xiaomi_rom_index_time";

function readCachedYaml(): string | null {
  try {
    const raw = localStorage.getItem(INDEX_CACHE_KEY);
    return raw && raw.length > 1000 ? raw : null;
  } catch {
    return null;
  }
}

function writeCachedYaml(yaml: string): void {
  try {
    localStorage.setItem(INDEX_CACHE_KEY, yaml);
    localStorage.setItem(INDEX_CACHE_TIME_KEY, String(Date.now()));
  } catch {
    // 超出 localStorage 配额时忽略，不影响在线获取
  }
}

function readCachedYamlTime(): number | null {
  try {
    const value = Number(localStorage.getItem(INDEX_CACHE_TIME_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

// 数据源健康状态：让 UI 能显示「索引同步到哪天 / 哪个源失败」，而不是静默显示空列表
let lastIndexError: string | null = null;
let lastRegionalError: string | null = null;
let lastIndexSyncedAt: string | null = null;
let lastIndexFromCache = false;

export interface XiaomiDataSourceStatus {
  syncedAt: string | null;
  indexError: string | null;
  regionalError: string | null;
  fromCache: boolean;
  cachedAt: number | null;
  deviceCount: number;
  romCount: number;
}

export function getXiaomiDataSourceStatus(): XiaomiDataSourceStatus {
  return {
    syncedAt: lastIndexSyncedAt,
    indexError: lastIndexError,
    regionalError: lastRegionalError,
    fromCache: lastIndexFromCache,
    cachedAt: readCachedYamlTime(),
    deviceCount: cachedRomDatabase
      ? new Set(cachedRomDatabase.map((item) => item.codename)).size
      : 0,
    romCount: cachedRomDatabase?.length ?? 0,
  };
}

/** 用 Tauri HTTP 插件请求文本，绕过 WebView 的 CORS；同时提供真正的超时保护 */
async function fetchRomText(
  url: string,
  timeoutMs = 15000,
  headers?: Record<string, string>
): Promise<{ ok: boolean; text: string }> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`请求超时 (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      tauriFetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      }),
      timeout,
    ]);
    return { ok: response.ok, text: response.ok ? await response.text() : "" };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** GitHub blob 返回 base64，需按 UTF-8 解码（索引里含中文设备名） */
function decodeGithubBase64(content: string): string {
  const clean = content.replace(/\s/g, "");
  if (!clean) return "";
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * 主数据源：GitHub API。
 * latest.yml 超过 1MB，contents 接口不返回正文，需先取 sha 再走 git/blobs 拿完整内容。
 * 本机实测 api.github.com 可达，jsdelivr / raw.githubusercontent.com 常被 TLS 或代理拦截。
 */
async function fetchLatestYamlViaGithubApi(): Promise<string> {
  const meta = await fetchRomText(
    `${GITHUB_API_BASE}/contents/data/latest.yml`,
    15000,
    GITHUB_API_HEADERS
  );
  if (!meta.ok) throw new Error("GitHub contents API 请求失败");

  const metaJson = JSON.parse(meta.text) as { content?: string; sha?: string };
  const inline = decodeGithubBase64(metaJson.content || "");
  if (inline.length > 1000) return inline;
  if (!metaJson.sha) throw new Error("未取到 latest.yml 的 blob sha");

  const blob = await fetchRomText(
    `${GITHUB_API_BASE}/git/blobs/${metaJson.sha}`,
    30000,
    GITHUB_API_HEADERS
  );
  if (!blob.ok) throw new Error("GitHub blob API 请求失败");
  const blobJson = JSON.parse(blob.text) as { content?: string };
  return decodeGithubBase64(blobJson.content || "");
}

/**
 * 获取完整小米 ROM 数据库（GitHub API 主源 + CDN 镜像兜底）
 */
export async function fetchXiaomiRomDatabase(forceRefresh = false): Promise<XiaomiRomItem[]> {
  const now = Date.now();
  if (!forceRefresh && cachedRomDatabase && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRomDatabase;
  }

  let rawYamlText = "";
  let fromCache = false;
  const failures: string[] = [];

  // GitHub API 数据最新，但撞 60 次/小时限流时会 403，需要快速转镜像
  try {
    const viaApi = await fetchLatestYamlViaGithubApi();
    if (viaApi.length > 1000) {
      rawYamlText = viaApi;
    } else {
      failures.push("GitHub API: 索引内容过短");
    }
  } catch (err) {
    failures.push(`GitHub API: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!rawYamlText) {
    for (const url of LEGACY_YAML_MIRRORS) {
      try {
        const res = await fetchRomText(url, 12000);
        if (res.ok && res.text.length > 1000) {
          rawYamlText = res.text;
          break;
        }
        failures.push(`${new URL(url).host}: 响应异常`);
      } catch (err) {
        failures.push(
          `${new URL(url).host}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  // 在线源全失败时回退到上次成功拉取的完整索引，应用仍可用
  if (!rawYamlText) {
    const cached = readCachedYaml();
    if (cached) {
      rawYamlText = cached;
      fromCache = true;
    }
  }

  if (!rawYamlText) {
    lastIndexError = failures.slice(0, 3).join("；") || "所有数据源均不可用";
    lastIndexFromCache = false;
    throw new Error(`获取 ROM 索引失败（${lastIndexError}）`);
  }

  try {
    const parsed = yamlLoad(rawYamlText) as any[];
    if (!Array.isArray(parsed)) {
      throw new Error("ROM 数据库格式错误");
    }

    const items: XiaomiRomItem[] = parsed.map((item: any) => ({
      name: String(item.name || ""),
      codename: String(item.codename || "").toLowerCase().trim(),
      version: String(item.version || ""),
      android: String(item.android || ""),
      branch: String(item.branch || "Stable"),
      method: (String(item.method || "Recovery") === "Fastboot" ? "Fastboot" : "Recovery") as "Recovery" | "Fastboot",
      date: String(item.date || ""),
      size: String(item.size || ""),
      link: String(item.link || ""),
      md5: item.md5 ? String(item.md5) : undefined,
      source: "index" as const,
    }));

    cachedRomDatabase = items;
    lastFetchTime = now;
    lastIndexFromCache = fromCache;
    lastIndexError = fromCache
      ? `在线源不可用（${failures.slice(0, 2).join("；")}），正在使用离线缓存`
      : null;
    lastIndexSyncedAt = items.reduce(
      (latest, item) => (item.date > latest ? item.date : latest),
      ""
    );
    if (!fromCache) writeCachedYaml(rawYamlText);
    return items;
  } catch (parseErr: any) {
    lastIndexError = `解析失败: ${parseErr.message || String(parseErr)}`;
    throw new Error(`解析 ROM 索引数据失败: ${parseErr.message || String(parseErr)}`);
  }
}

const REGION_SUFFIX_RE =
  /\s+(China|Global|EEA|Russia|Turkey|Indonesia|India|Taiwan|Japan|Chinese|International)$/i;

function inferXiaomiSeries(name: string): XiaomiDevicePreset["series"] {
  const lower = name.toLowerCase();
  if (lower.includes("poco")) return "POCO";
  if (lower.includes("redmi")) return "Redmi";
  return "Xiaomi";
}

/** 从实时索引生成机型下拉，覆盖全部在维护的设备，替代写死的少量预设 */
export async function fetchXiaomiDevicePresets(): Promise<XiaomiDevicePreset[]> {
  const db = await fetchXiaomiRomDatabase();
  const latestByCode = new Map<string, { name: string; date: string }>();

  db.forEach((item) => {
    const code = item.codename.toLowerCase().trim();
    if (!code) return;
    const current = latestByCode.get(code);
    if (!current || item.date >= current.date) {
      latestByCode.set(code, { name: item.name, date: item.date });
    }
  });

  const presets: XiaomiDevicePreset[] = Array.from(latestByCode.entries()).map(
    ([codename, meta]) => ({
      name: meta.name.replace(REGION_SUFFIX_RE, "").trim() || meta.name,
      codename,
      series: inferXiaomiSeries(meta.name),
    })
  );

  presets.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  return presets;
}

/** 首页默认展示：全站按日期倒序的最新固件（无需先填代号） */
export async function fetchLatestXiaomiRoms(
  limit = 60,
  forceRefresh = false
): Promise<XiaomiRomItem[]> {
  const db = await fetchXiaomiRomDatabase(forceRefresh);
  return [...db]
    .sort((a, b) => b.date.localeCompare(a.date) || b.version.localeCompare(a.version))
    .slice(0, limit);
}

export interface SupportedSystemVersion {
  version: string;
  android?: string;
  branch: string; // "Stable" | "Beta" | "Weekly"
  method?: "Recovery" | "Fastboot" | "Both";
  isLatest?: boolean;
  date?: string;
  size?: string;
  displayName: string;
}

const REGION_SLUG_KEYWORDS: Record<string, string[]> = {
  cn: ["china", "国行"],
  global: ["global", "国际"],
  eea: ["europe", "eea", "欧洲"],
  ru: ["russia", "俄罗斯"],
  in: ["india", "印度"],
  tw: ["taiwan", "台湾"],
  id: ["indonesia", "印尼"],
  tr: ["turkey", "土耳其"],
};

// 页面级固件与版本缓存（带过期时间，避免切换筛选后永远读到旧结果）
const regionalRomCache = new Map<string, XiaomiRomItem[]>();
const regionalRomCacheTime = new Map<string, number>();
const supportedVersionsCache = new Map<string, SupportedSystemVersion[]>();
const supportedVersionsCacheTime = new Map<string, number>();

/**
 * 从 xiaomirom.com 系列页面动态解析指定机型和地区的分区/历史 ROM 完整清单
 */
export async function fetchXiaomiRomByRegionalPage(
  codename: string,
  region = "cn"
): Promise<XiaomiRomItem[]> {
  const cleanCode = codename.toLowerCase().trim();
  const cacheKey = `${cleanCode}_${region.toLowerCase()}`;
  const cachedRegional = regionalRomCache.get(cacheKey);
  if (cachedRegional && Date.now() - (regionalRomCacheTime.get(cacheKey) ?? 0) < CACHE_TTL_MS) {
    return cachedRegional;
  }

  try {
    lastRegionalError = null;
    // 站点没有 CORS 响应头，必须走 Tauri HTTP 插件，WebView 原生 fetch 会被拦
    const seriesRes = await fetchRomText(
      `https://xiaomirom.com/series/${cleanCode}/`,
      10000
    );

    if (!seriesRes.ok) {
      lastRegionalError = `机型页不可用 (${cleanCode})`;
      return [];
    }

    const seriesHtml = seriesRes.text;
    const romLinks = [
      ...new Set(
        seriesHtml.match(/https:\/\/xiaomirom\.com\/rom\/[^/<>\s"']+\//g) ||
          seriesHtml.match(/\/rom\/[^/<>\s"']+\//g) ||
          []
      ),
    ].map((l) => (l.startsWith("http") ? l : `https://xiaomirom.com${l}`));

    const keywords = REGION_SLUG_KEYWORDS[region.toLowerCase()] || ["china"];
    let matchedPage = romLinks.find((url) =>
      keywords.some((k) => url.toLowerCase().includes(k))
    );

    // 若未精准匹配，默认使用第一个找到的页面
    if (!matchedPage && romLinks.length > 0) {
      matchedPage = romLinks[0];
    }

    if (!matchedPage) {
      return [];
    }

    const pageRes = await fetchRomText(matchedPage, 15000);
    if (!pageRes.ok) {
      lastRegionalError = "历史版本页不可用";
      return [];
    }

    const pageHtml = pageRes.text;

    const rowRegex =
      /<td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=right>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td>/g;
    const downloadLinkMatches = [
      ...pageHtml.matchAll(
        /<p>([a-zA-Z0-9_\-.]+?\.(?:tgz|zip))\s*\|\s*<a href=([^>]+)>下载<\/a><\/p>/gi
      ),
    ];

    const items: XiaomiRomItem[] = [];
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = rowRegex.exec(pageHtml)) !== null) {
      const [, devName, code, methodStr, ver, android, size, date] = match;
      const isFastboot =
        methodStr.includes("Fastboot") || methodStr.includes("线刷");
      const isBeta =
        ver.toUpperCase().includes("DEV") ||
        ver.toUpperCase().includes("BETA") ||
        ver.split(".").length > 5;
      const dl = downloadLinkMatches[idx];
      const filename = dl ? dl[1] : "";
      idx++;

      let directLink = "";
      if (filename) {
        // 卡刷 Recovery 或线刷 Fastboot 官方 BigOTA/BN 直链规则
        if (isFastboot) {
          directLink = `https://bn.d.miui.com/${ver}/${filename}`;
        } else {
          directLink = `https://bigota.d.miui.com/${ver}/${filename}`;
        }
      } else {
        const defaultFilename = `miui_${cleanCode.toUpperCase()}_${ver}.${isFastboot ? "tgz" : "zip"}`;
        directLink = `https://bigota.d.miui.com/${ver}/${defaultFilename}`;
      }

      items.push({
        name: devName.trim(),
        codename: code.toLowerCase().trim() || cleanCode,
        version: ver.trim(),
        android: android.trim(),
        branch: isBeta ? "Beta" : "Stable",
        method: isFastboot ? "Fastboot" : "Recovery",
        date: date.trim(),
        size: size.trim(),
        link: directLink,
        source: "scraped" as const,
      });
    }

    if (items.length > 0) {
      regionalRomCache.set(cacheKey, items);
      regionalRomCacheTime.set(cacheKey, Date.now());
    } else {
      lastRegionalError = `页面结构解析到 0 条记录 (${cleanCode})`;
    }
    return items;
  } catch (err) {
    lastRegionalError = err instanceof Error ? err.message : String(err);
    return [];
  }
}

/**
 * 检索指定机型代号、地区版本、版本分支对应的系统版本支持列表
 */
export async function getXiaomiSupportedVersions(options: {
  codename: string;
  region?: string;
  branch?: string;
}): Promise<SupportedSystemVersion[]> {
  const { codename, region = "cn", branch = "all" } = options;
  if (!codename.trim()) return [];

  const cleanCode = codename.toLowerCase().trim();
  const cacheKey = `${cleanCode}_${region.toLowerCase()}_${branch.toLowerCase()}`;
  const cachedVersions = supportedVersionsCache.get(cacheKey);
  if (cachedVersions && Date.now() - (supportedVersionsCacheTime.get(cacheKey) ?? 0) < CACHE_TTL_MS) {
    return cachedVersions;
  }

  // 并行获取来自 XiaomiFirmwareUpdater 与 xiaomirom.com 的数据
  const [fastUpdaterRoms, scrapedRoms] = await Promise.all([
    fetchXiaomiRomDatabase().catch(() => [] as XiaomiRomItem[]),
    fetchXiaomiRomByRegionalPage(cleanCode, region).catch(() => [] as XiaomiRomItem[]),
  ]);

  // 1. 以官方索引为主（自带真实直链与 md5），站点抓取仅补历史版本
  const allCandidates: XiaomiRomItem[] = fastUpdaterRoms.filter((r) => {
    const c = r.codename.toLowerCase();
    return c === cleanCode || c.startsWith(`${cleanCode}_`);
  });

  scrapedRoms.forEach((r) => {
    const exists = allCandidates.some(
      (e) => e.version.toLowerCase() === r.version.toLowerCase() && e.method === r.method
    );
    if (!exists) allCandidates.push(r);
  });

  // 2. 根据分支进行初步过滤
  let branchFiltered = allCandidates;
  if (branch && branch !== "all") {
    branchFiltered = allCandidates.filter((r) => {
      const b = r.branch.toLowerCase();
      if (branch === "Stable" || branch === "正式版") {
        return b.includes("stable") && !b.includes("beta");
      }
      if (branch === "Beta" || branch === "开发版" || branch === "内测版") {
        return b.includes("beta") || b.includes("weekly") || b.includes("dev");
      }
      return true;
    });
  }

  // 3. 聚合版本号并提取元数据
  const versionMap = new Map<string, SupportedSystemVersion>();

  branchFiltered.forEach((r) => {
    const verKey = r.version.trim();
    if (!verKey) return;

    if (!versionMap.has(verKey)) {
      versionMap.set(verKey, {
        version: verKey,
        android: r.android,
        branch: r.branch,
        method: r.method,
        date: r.date,
        size: r.size,
        displayName: verKey,
      });
    } else {
      const cur = versionMap.get(verKey)!;
      if (cur.method !== r.method) {
        cur.method = "Both";
      }
      if (!cur.date && r.date) cur.date = r.date;
      if (!cur.android && r.android) cur.android = r.android;
    }
  });

  const versionList = Array.from(versionMap.values());

  // 排序：优先按日期降序，若无日期按版本号降序
  versionList.sort((a, b) => {
    if (a.date && b.date) {
      const d = b.date.localeCompare(a.date);
      if (d !== 0) return d;
    }
    return b.version.localeCompare(a.version);
  });

  // 标记最新版本并丰富 displayName
  if (versionList.length > 0) {
    versionList[0].isLatest = true;
  }

  versionList.forEach((item, index) => {
    const extras: string[] = [];
    if (index === 0) extras.push("最新");
    if (item.branch && item.branch.toLowerCase().includes("beta")) extras.push("开发版");
    if (item.android) extras.push(`Android ${item.android}`);
    if (item.method === "Both") extras.push("线刷+卡刷");
    else if (item.method) extras.push(item.method === "Fastboot" ? "线刷包" : "卡刷包");

    item.displayName = extras.length > 0 ? `${item.version} (${extras.join(" · ")})` : item.version;
  });

  if (versionList.length > 0) {
    supportedVersionsCache.set(cacheKey, versionList);
    supportedVersionsCacheTime.set(cacheKey, Date.now());
  }

  return versionList;
}

/**
 * 根据设备代号、地区、分支与可选版本号过滤 ROM 列表
 */
export async function queryXiaomiRoms(options: {
  codename: string;
  region?: string;
  versionFilter?: string;
  branchFilter?: string;
  methodFilter?: "all" | "Recovery" | "Fastboot";
  forceRefresh?: boolean;
}): Promise<XiaomiRomItem[]> {
  const {
    codename,
    region = "cn",
    versionFilter,
    branchFilter,
    methodFilter = "all",
    forceRefresh,
  } = options;
  if (!codename) return [];

  const targetCode = codename.toLowerCase().trim();

  // 并行拉取全库与指定地区的详细历史 ROM；失败不再静默吞掉
  let indexFailure = "";
  const [db, regionalRoms] = await Promise.all([
    fetchXiaomiRomDatabase(forceRefresh).catch((err) => {
      indexFailure = err instanceof Error ? err.message : String(err);
      return [] as XiaomiRomItem[];
    }),
    fetchXiaomiRomByRegionalPage(targetCode, region).catch(() => [] as XiaomiRomItem[]),
  ]);

  if (db.length === 0 && regionalRoms.length === 0) {
    throw new Error(indexFailure || "ROM 索引与历史版本源均不可用，请检查网络后重试");
  }

  // 官方索引优先：link / md5 来自上游，不靠规则猜域名
  const combined: XiaomiRomItem[] = db.filter((item) => {
    const itemCode = item.codename.toLowerCase();
    return itemCode === targetCode || itemCode.startsWith(`${targetCode}_`);
  });
  regionalRoms.forEach((item) => {
    const exists = combined.some(
      (c) => c.version.toLowerCase() === item.version.toLowerCase() && c.method === item.method
    );
    if (!exists) combined.push(item);
  });

  let filtered = combined;

  // 地区过滤（若为 regionalRoms 已经按地区过滤；对于 fastUpdater 补全的再判断 region）
  if (region && region !== "all") {
    filtered = filtered.filter((item) => {
      const reg = detectXiaomiRegion(item.version);
      if (reg === region.toLowerCase()) return true;
      const kw = REGION_SLUG_KEYWORDS[region.toLowerCase()] || [];
      return kw.some((k) => item.name.toLowerCase().includes(k));
    });
  }

  // 分支过滤 (Stable / Beta 等)
  if (branchFilter && branchFilter !== "all") {
    filtered = filtered.filter((item) => {
      const b = item.branch.toLowerCase();
      if (branchFilter === "Stable" || branchFilter === "正式版") {
        return b.includes("stable") && !b.includes("beta");
      }
      if (branchFilter === "Beta" || branchFilter === "开发版") {
        return b.includes("beta") || b.includes("weekly") || b.includes("dev");
      }
      return b.includes(branchFilter.toLowerCase());
    });
  }

  // 刷机方式过滤 (Recovery 卡刷 / Fastboot 线刷)
  if (methodFilter && methodFilter !== "all") {
    filtered = filtered.filter((item) => item.method === methodFilter);
  }

  // 版本精确或模糊匹配
  if (versionFilter && versionFilter.trim()) {
    const q = versionFilter.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.version.toLowerCase() === q ||
        item.version.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
    );
  }

  // 排序：优先按日期降序，若日期一致优先 Fastboot 线刷或 Recovery
  filtered.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return b.version.localeCompare(a.version);
  });

  return filtered;
}

/**
 * 生成提取卡刷包指定镜像的分区下载/提取脚本命令 (支持 curl + payload-dumper-go / ADMT 内置调用)
 */
export function generatePartitionExtractScript(params: {
  romUrl: string;
  partitionName: string;
  outputDir: string;
  scriptType: "powershell" | "bash" | "curl_range";
}): string {
  const { romUrl, partitionName, outputDir, scriptType } = params;

  if (scriptType === "powershell") {
    return `# ADMT - 小米官方卡刷包在线指定镜像提取脚本 (PowerShell)
# 固件直链: ${romUrl}
# 目标分区: ${partitionName}.img
# 输出目录: ${outputDir}

Write-Host ">>> 准备从卡刷包中流式提取 ${partitionName}.img..." -ForegroundColor Cyan

# 方式 1: 若已安装 payload-dumper-go (推荐，支持从网络 URL 直接提取单镜像)
if (Get-Command "payload-dumper-go" -ErrorAction SilentlyContinue) {
    Write-Host "检测到 payload-dumper-go，正在流式提取..." -ForegroundColor Green
    payload-dumper-go -p ${partitionName} -o "${outputDir}" "${romUrl}"
} else {
    Write-Host "提示: 也可以直接在 ADMT 软件中点击【一键流式提取镜像】由内置 Rust 引擎完成流式切片提取" -ForegroundColor Yellow
}
`;
  }

  if (scriptType === "bash") {
    return `#!/usr/bin/env bash
# ADMT - 小米官方卡刷包在线指定镜像提取脚本 (Shell)
# 固件直链: ${romUrl}
# 目标分区: ${partitionName}.img
# 输出目录: ${outputDir}

echo ">>> 准备从卡刷包中流式提取 ${partitionName}.img..."

if command -v payload-dumper-go &> /dev/null; then
    echo "使用 payload-dumper-go 在线解包..."
    payload-dumper-go -p "${partitionName}" -o "${outputDir}" "${romUrl}"
else
    echo "提示: 未检测到 payload-dumper-go，建议在 ADMT 客户端中直接点击【一键流式提取镜像】"
fi
`;
  }

  return `# ADMT 分区提取命令
payload-dumper-go -p ${partitionName} -o "${outputDir}" "${romUrl}"`;
}

export interface RomMirrorItem {
  id: string;
  name: string;
  url: string;
  badge: string;
  desc: string;
}

/**
 * 根据原始官方固件下载链接生成各服务商/分流加速镜像链接
 */
export function getRomMirrors(originalUrl: string): RomMirrorItem[] {
  if (!originalUrl) return [];

  let path = "";
  try {
    const u = new URL(originalUrl);
    path = u.pathname;
  } catch {
    path = originalUrl.replace(/^https?:\/\/[^/]+/, "");
  }

  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return [
    {
      id: "bigota",
      name: "官方 BigOTA",
      url: `https://bigota.d.miui.com${path}`,
      badge: "推荐",
      desc: "小米官方主节点，国内绝大多数网络下速度最快",
    },
    {
      id: "ultimateota",
      name: "官方 UltimateOTA",
      url: `https://ultimateota.d.miui.com${path}`,
      badge: "分流加速",
      desc: "小米官方高带宽分流节点",
    },
    {
      id: "hugeota",
      name: "官方 HugeOTA",
      url: `https://hugeota.d.miui.com${path}`,
      badge: "备用",
      desc: "小米官方备用节点，主节点繁忙或限速时使用",
    },
    {
      id: "bnkota",
      name: "官方 BnkOTA",
      url: `https://bnkota.d.miui.com${path}`,
      badge: "大包节点",
      desc: "小米官方大容量镜像分发节点",
    },
    {
      id: "cdnorg",
      name: "官方 CDN 节点",
      url: `https://cdnorg.d.miui.com${path}`,
      badge: "稳定",
      desc: "全球企业级 CDN 节点",
    },
  ];
}

