import { load as yamlLoad } from "js-yaml";
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
  { name: "Redmi K80", codename: "dada", series: "Redmi" },
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

/**
 * 获取完整小米 ROM 数据库 (基于 XiaomiFirmwareUpdater 高速镜像)
 */
export async function fetchXiaomiRomDatabase(forceRefresh = false): Promise<XiaomiRomItem[]> {
  const now = Date.now();
  if (!forceRefresh && cachedRomDatabase && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRomDatabase;
  }

  const mirrorUrls = [
    "https://fastly.jsdelivr.net/gh/XiaomiFirmwareUpdater/miui-updates-tracker@master/data/latest.yml",
    "https://cdn.jsdelivr.net/gh/XiaomiFirmwareUpdater/miui-updates-tracker@master/data/latest.yml",
    "https://raw.githubusercontent.com/XiaomiFirmwareUpdater/miui-updates-tracker/master/data/latest.yml",
  ];

  let rawYamlText = "";
  let lastError: any = null;

  for (const url of mirrorUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        rawYamlText = await res.text();
        if (rawYamlText && rawYamlText.length > 1000) {
          break;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!rawYamlText) {
    throw new Error(lastError ? `获取 ROM 索引失败: ${lastError.message || String(lastError)}` : "获取官方 ROM 索引失败，请检查网络连接");
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
    }));

    cachedRomDatabase = items;
    lastFetchTime = now;
    return items;
  } catch (parseErr: any) {
    throw new Error(`解析 ROM 索引数据失败: ${parseErr.message || String(parseErr)}`);
  }
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

// 页面级固件与版本缓存
const regionalRomCache = new Map<string, XiaomiRomItem[]>();
const supportedVersionsCache = new Map<string, SupportedSystemVersion[]>();

/**
 * 从 xiaomirom.com 系列页面动态解析指定机型和地区的分区/历史 ROM 完整清单
 */
export async function fetchXiaomiRomByRegionalPage(
  codename: string,
  region = "cn"
): Promise<XiaomiRomItem[]> {
  const cleanCode = codename.toLowerCase().trim();
  const cacheKey = `${cleanCode}_${region.toLowerCase()}`;
  if (regionalRomCache.has(cacheKey)) {
    return regionalRomCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const seriesRes = await fetch(`https://xiaomirom.com/series/${cleanCode}/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!seriesRes.ok) {
      return [];
    }

    const seriesHtml = await seriesRes.text();
    const romLinks = [
      ...new Set(
        seriesHtml.match(/https:\/\/xiaomirom\.com\/rom\/[^\/<>\s"']+\//g) ||
          seriesHtml.match(/\/rom\/[^\/<>\s"']+\//g) ||
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

    const pageController = new AbortController();
    const pageTimeoutId = setTimeout(() => pageController.abort(), 10000);
    const pageRes = await fetch(matchedPage, { signal: pageController.signal });
    clearTimeout(pageTimeoutId);

    if (!pageRes.ok) return [];

    const pageHtml = await pageRes.text();

    const rowRegex =
      /<td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=right>([^<]+)<\/td><td align=left>([^<]+)<\/td><td align=left>([^<]+)<\/td>/g;
    const downloadLinkMatches = [
      ...pageHtml.matchAll(
        /<p>([a-zA-Z0-9_\-\.]+?\.(?:tgz|zip))\s*\|\s*<a href=([^>]+)>下载<\/a><\/p>/gi
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
      });
    }

    if (items.length > 0) {
      regionalRomCache.set(cacheKey, items);
    }
    return items;
  } catch (_err) {
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
  if (supportedVersionsCache.has(cacheKey)) {
    return supportedVersionsCache.get(cacheKey)!;
  }

  // 并行获取来自 XiaomiFirmwareUpdater 与 xiaomirom.com 的数据
  const [fastUpdaterRoms, scrapedRoms] = await Promise.all([
    fetchXiaomiRomDatabase().catch(() => [] as XiaomiRomItem[]),
    fetchXiaomiRomByRegionalPage(cleanCode, region).catch(() => [] as XiaomiRomItem[]),
  ]);

  // 1. 合并并过滤符合 codename 的记录
  const allCandidates: XiaomiRomItem[] = [...scrapedRoms];

  fastUpdaterRoms.forEach((r) => {
    const c = r.codename.toLowerCase();
    if (c === cleanCode || c.startsWith(`${cleanCode}_`)) {
      // 检查是否已存在
      const exists = allCandidates.some(
        (e) => e.version.toLowerCase() === r.version.toLowerCase() && e.method === r.method
      );
      if (!exists) {
        allCandidates.push(r);
      }
    }
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

  // 并行拉取全库与指定地区的详细历史 ROM
  const [db, regionalRoms] = await Promise.all([
    fetchXiaomiRomDatabase(forceRefresh).catch(() => [] as XiaomiRomItem[]),
    fetchXiaomiRomByRegionalPage(targetCode, region).catch(() => [] as XiaomiRomItem[]),
  ]);

  // 合并数据源，以爬虫精确解析的直链为优先
  const combined: XiaomiRomItem[] = [...regionalRoms];
  db.forEach((item) => {
    const itemCode = item.codename.toLowerCase();
    if (itemCode === targetCode || itemCode.startsWith(`${targetCode}_`)) {
      const exists = combined.some(
        (c) => c.version.toLowerCase() === item.version.toLowerCase() && c.method === item.method
      );
      if (!exists) {
        combined.push(item);
      }
    }
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
    path = originalUrl.replace(/^https?:\/\/[^\/]+/, "");
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

