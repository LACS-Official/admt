// ROM下载相关类型定义

export interface RomInfo {
  id: string;
  version: string;
  codename: string;
  size: string;
  rom_type: string;
  date: string;
  url: string;
  token?: string;
  device_code?: string;
  android_version?: string;
  miui_version?: string;
  description?: string;
}

export interface RomListResponse {
  status: string;
  code: string;
  count: string;
  data: Record<string, string>;
}

export interface RomDownloadResponse {
  status: string;
  device_code: string;
  version: string;
  file_type: string;
  download_url?: string;
  expires_in?: string;
  remaining_access?: number;
}

export interface RomDownloadState {
  deviceCode: string;
  isManualInput: boolean;
  romList: RomInfo[];
  loading: boolean;
  error: string | null;
  downloading: boolean;
  downloadProgress: number;
  currentDownload: string | null;
  token: string;
  manualDeviceInfo: { deviceName: string };
  isManualDeviceMode: boolean;
}

export interface DeviceInfo {
  serial: string;
  mode: DeviceMode;
  properties?: DeviceProperties;
  connected: boolean;
  lastSeen?: Date;
  boardSerialNumber?: string;
  fastbootVariables?: Record<string, string>;
}

export type DeviceMode = 
  | "sys"        // 系统模式
  | "rec"        // Recovery模式
  | "fastboot"   // Fastboot模式
  | "fastbootd"  // Fastbootd模式
  | "sideload"   // Sideload模式
  | "edl"        // EDL模式
  | "unauthorized" // 未授权
  | "offline"    // 离线
  | "unknown";   // 未知

export interface DeviceProperties {
  marketName?: string;        // 商品名称
  productName?: string;       // 产品名称
  brand?: string;            // 品牌
  model?: string;            // 型号
  deviceName?: string;       // 设备代号
  manufacturer?: string;     // 制造商
  serialNumber?: string;     // 序列号
  androidVersion?: string;   // Android版本
  sdkVersion?: string;       // SDK版本
  buildId?: string;          // 构建ID
  buildDisplayId?: string;   // 构建显示ID
  systemVersion?: string;    // 系统版本
  securityPatchLevel?: string; // 安全补丁级别
  buildFingerprint?: string;  // 构建指纹
  buildDate?: string;        // 构建日期
  buildUser?: string;        // 构建用户
  buildHost?: string;        // 构建主机
  miuiVersion?: string;      // MIUI版本
  cpuAbi?: string;          // CPU架构
  cpuAbiList?: string;      // 支持的CPU架构列表
  socManufacturer?: string;  // SoC制造商
  socModel?: string;        // SoC型号
  hardware?: string;        // 硬件平台
  hardwareChipname?: string; // 硬件芯片名称
  boardPlatform?: string;   // 主板平台
  productBoard?: string;    // 产品主板
  bootloaderLocked?: boolean; // Bootloader锁定状态
  verifiedBootState?: string; // 验证启动状态
  verityMode?: string;      // 完整性验证模式
  debuggable?: boolean;     // 调试模式
  secure?: boolean;         // 安全模式
  adbSecure?: boolean;      // ADB安全模式
  lcdDensity?: string;      // 屏幕密度
  locale?: string;          // 语言区域
  timezone?: string;        // 时区
  defaultNetwork?: string;  // 默认网络类型
  firstApiLevel?: string;   // 首次API级别
  vndkVersion?: string;     // VNDK版本
  imei?: string;            // IMEI
  batteryLevel?: number;    // 电池电量
  screenResolution?: string; // 屏幕分辨率
  totalMemory?: string;     // 总内存
  availableStorage?: string; // 可用存储
  parallelDownloadFlash?: boolean; // 并行刷写支持
  offModeCharge?: boolean;  // 关机充电模式
  antiRollback?: boolean;   // 防回滚保护
  cpuid?: string;           // CPU唯一ID
}