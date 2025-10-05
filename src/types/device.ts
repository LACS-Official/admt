export interface DeviceInfo {
  serial: string;
  mode: DeviceMode;
  properties?: DeviceProperties;
  connected: boolean;
  lastSeen?: Date;
  boardSerialNumber?: string;
  fastbootVariables?: Record<string, string>; // Fastboot模式下的设备变量
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
  // 设备基本信息
  marketName?: string;        // 商品名称
  productName?: string;       // 产品名称
  brand?: string;            // 品牌
  model?: string;            // 型号
  deviceName?: string;       // 设备代号
  manufacturer?: string;     // 制造商
  serialNumber?: string;     // 序列号

  // 系统版本信息
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

  // 硬件信息
  cpuAbi?: string;          // CPU架构
  cpuAbiList?: string;      // 支持的CPU架构列表
  socManufacturer?: string;  // SoC制造商
  socModel?: string;        // SoC型号
  hardware?: string;        // 硬件平台
  hardwareChipname?: string; // 硬件芯片名称
  boardPlatform?: string;   // 主板平台
  productBoard?: string;    // 产品主板

  // 安全和启动信息
  bootloaderLocked?: boolean; // Bootloader锁定状态
  verifiedBootState?: string; // 验证启动状态
  verityMode?: string;      // 完整性验证模式
  debuggable?: boolean;     // 调试模式
  secure?: boolean;         // 安全模式
  adbSecure?: boolean;      // ADB安全模式

  // 显示和UI信息
  lcdDensity?: string;      // 屏幕密度
  locale?: string;          // 语言区域
  timezone?: string;        // 时区

  // 网络和通信
  defaultNetwork?: string;  // 默认网络类型
  firstApiLevel?: string;   // 首次API级别
  vndkVersion?: string;     // VNDK版本

  // 运行时信息
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

export interface DeviceStatus {
  devices: DeviceInfo[];
  selectedDevice?: DeviceInfo;
  isScanning: boolean;
  lastUpdate: Date;
}

export interface AdbCommand {
  command: string;
  args?: string[];
  timeout?: number;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

export interface InstalledApp {
  packageName: string;
  versionName?: string;
  versionCode?: string;
  installLocation?: string;
  isSystemApp: boolean;
  isEnabled: boolean;
  apkPath?: string;
  installTime?: string;
  updateTime?: string;
  permissions: string[];
}

export interface ApkInfo {
  filePath: string;
  packageName?: string;
  appName?: string;
  versionName?: string;
  versionCode?: string;
  minSdkVersion?: string;
  targetSdkVersion?: string;
  compileSdkVersion?: string;
  permissions: string[];
  features: string[];
  fileSize: number;
  isDebuggable: boolean;
  isTestOnly: boolean;
  iconPath?: string;
}

export interface InstallProgress {
  id: string;
  fileName: string;
  packageName?: string;
  status: InstallStatus;
  progress: number;
  message?: string;
  startTime: string;
  endTime?: string;
}

export type InstallStatus = 'pending' | 'installing' | 'success' | 'failed' | 'cancelled';

export interface BatchOperation {
  id: string;
  operationType: BatchOperationType;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  status: BatchOperationStatus;
  items: BatchOperationItem[];
  startTime: string;
  endTime?: string;
}

export type BatchOperationType = 'install' | 'uninstall' | 'freeze' | 'unfreeze' | 'forceStop' | 'exportApk' | 'clearData';
export type BatchOperationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BatchOperationItem {
  id: string;
  name: string;
  status: InstallStatus;
  message?: string;
}

export interface ConnectionInfo {
  serial: string;
  state: string;
  connected: boolean;
  usb_connection: boolean;
  wifi_connection: boolean;
  adb_version?: string;
  transport_id?: string;
}

// APK市场相关类型定义
export interface ApkMarketData {
  apk_list: ApkCategory[];
}

export interface ApkCategory {
  category: string;
  apps: ApkItem[];
}

export interface ApkItem {
  name: string;
  download_link: {
    url: string;
    is_direct: boolean;
  };
}

export interface ApkDownloadItem {
  id: string;
  name: string;
  category: string;
  url: string;
  isDirect: boolean;
  status: ApkDownloadStatus;
  progress: number;
  downloadedSize: number;
  totalSize: number;
  filePath?: string;
  error?: string;
  startTime?: string;
  endTime?: string;
}

export type ApkDownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused' | 'cancelled';

export interface DeviceFile {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  permissions?: string;
  modifiedTime?: string;
}
