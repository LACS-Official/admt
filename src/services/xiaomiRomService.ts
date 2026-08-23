import { DeviceInfo } from "../types/device";

export interface XiaomiRomInfo {
  deviceCode: string;
  romVersion: string;
  region: string;
  downloadUrl?: string;
  filename?: string;
  source: "official_api" | "ota_cdn" | "community" | "manual";
}

/**
 * 判断设备是否为小米/红米/POCO品牌
 */
export function isXiaomiDevice(device: DeviceInfo | null | undefined): boolean {
  if (!device || !device.properties) return false;
  const brand = (device.properties.brand || "").toLowerCase();
  const manufacturer = (device.properties.manufacturer || "").toLowerCase();
  
  const xiaomiBrands = ["xiaomi", "redmi", "poco", "blackshark"];
  return xiaomiBrands.some(b => brand.includes(b) || manufacturer.includes(b));
}

/**
 * 提取小米设备代号
 */
export function extractXiaomiDeviceCode(device: DeviceInfo): string {
  if (!device.properties) return "";
  
  const candidates = [
    device.properties.deviceName,
    device.properties.productName,
    device.properties.productBoard,
    device.properties.boardPlatform,
    device.properties.model
  ];

  for (const c of candidates) {
    if (c && c !== "未知" && c !== "unknown" && !c.includes(" ") && c.length > 2) {
      return c.toLowerCase().trim();
    }
  }

  return (device.properties.model || "").toLowerCase().replace(/\s+/g, "_");
}

/**
 * 提取增量系统版本号（例如 OS1.0.32.0.UNCCNXM 或 V14.0.23.0.TLACNXM）
 */
export function extractXiaomiRomVersion(device: DeviceInfo): string {
  if (!device.properties) return "";

  const buildId = device.properties.buildId || "";
  const systemVersion = device.properties.systemVersion || "";

  // 匹配 HyperOS 或 MIUI 格式
  const versionRegex = /(OS\d+\.\d+\.\d+\.\d+\.[A-Z]+|V\d+\.\d+\.\d+\.\d+\.[A-Z]+)/i;
  
  const matchBuildId = buildId.match(versionRegex);
  if (matchBuildId) return matchBuildId[1].toUpperCase();

  const matchSys = systemVersion.match(versionRegex);
  if (matchSys) return matchSys[1].toUpperCase();

  return buildId || systemVersion;
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
 * 根据设备信息自动获取官方全量包直链
 */
export async function queryXiaomiOfficialRom(device: DeviceInfo): Promise<XiaomiRomInfo> {
  const deviceCode = extractXiaomiDeviceCode(device);
  const romVersion = extractXiaomiRomVersion(device);
  const region = detectXiaomiRegion(romVersion);

  if (!deviceCode || !romVersion) {
    throw new Error("未能识别到有效的小米机型代号或系统版本号");
  }

  // 1. 构造官方 BigOTA / CDN 直链规则
  // 格式示例：https://bn.d.miui.com/OS1.0.32.0.UNCCNXM/miui_HOUJI_OS1.0.32.0.UNCCNXM_885744439c_14.0.zip
  // 或者通过官方 update 接口获取精确完整文件名
  const cdnHosts = [
    "https://ultimate-ota.d.miui.com",
    "https://hugeota.d.miui.com",
    "https://bn.d.miui.com",
    "https://bno.d.miui.com"
  ];

  // 尝试从官方 OTA 接口检索精确地址
  try {
    const apiUrl = `https://update.miui.com/updates/v1/fullrom.php?d=${encodeURIComponent(deviceCode)}&v=${encodeURIComponent(romVersion)}&b=F&r=${encodeURIComponent(region)}&l=zh_CN`;
    
    // 如果支持直接 fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const response = await fetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 14; Build/ADMT)"
      }
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.Rom && data.Rom.download) {
        return {
          deviceCode,
          romVersion: data.Rom.version || romVersion,
          region,
          downloadUrl: data.Rom.download,
          filename: data.Rom.filename || `${deviceCode}_${romVersion}.zip`,
          source: "official_api"
        };
      }
    }
  } catch (_e) {
    // 忽略接口错误，降级到 CDN 直链与镜像库
  }

  // 2. 构造通用官方 CDN 直链预测 (如已存在标准规则)
  const isHyperOS = romVersion.toUpperCase().startsWith("OS");
  const prefix = isHyperOS ? "miui" : "miui";
  const defaultFilename = `${prefix}_${deviceCode.toUpperCase()}_${romVersion}.zip`;
  const defaultUrl = `${cdnHosts[0]}/${romVersion}/${defaultFilename}`;

  return {
    deviceCode,
    romVersion,
    region,
    downloadUrl: defaultUrl,
    filename: defaultFilename,
    source: "ota_cdn"
  };
}
