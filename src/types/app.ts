export interface AppConfig {
  theme: "light" | "dark" | "auto";
  language: "zh-CN" | "en-US";
  autoDetectDevices: boolean;
  scanInterval: number;
  deviceDetectionInterval: number;
  logLevel: "debug" | "info" | "warn" | "error";
  adbPath?: string;
  fastbootPath?: string;
}

export interface AppState {
  isInitialized: boolean;
  config: AppConfig;
  currentView: AppView;
  isLoading: boolean;
  error?: string;
}

export type AppView =
  | "home"
  | "adb-zone"
  | "flash-zone"
  | "device-management"
  | "extended-features"
  | "settings";

export type SettingsView =
  | "about"
  | "tool-settings"
  | "other-settings"
  | "logs";

export interface NotificationMessage {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

export interface FileOperation {
  id: string;
  type: "upload" | "download" | "install" | "extract";
  fileName: string;
  progress: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  executable: string;
  args?: string[];
  icon?: string;
  version?: string;
  isInstalled: boolean;
  downloadUrl?: string;
}

// 版本管理相关类型定义
export interface VersionInfo {
  id: number;
  version: string;
  releaseNotes: string;
  releaseNotesEn?: string;
  releaseDate: string;
  downloadLinks?: {
    official?: string;
    quark?: string;
    baidu?: string;
    github?: string;
  };
  fileSize?: string;
  isStable: boolean;
  versionType: "release" | "beta" | "alpha";
  metadata?: {
    buildNumber?: string;
    commitHash?: string;
    changelog?: string[];
  };
}

export interface SoftwareInfo {
  id: number;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  currentVersion: string;
  category?: string;
  tags?: string[];
  officialWebsite?: string;
  metadata?: {
    developer?: string;
    license?: string;
    platform?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface VersionCheckResult {
  needsUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  isForceUpdate: boolean;
  updateInfo?: VersionInfo;
  message: string;
}

export interface VersionCheckResponse {
  success: boolean;
  data?: {
    software: SoftwareInfo;
    versions: VersionInfo[];
  };
  error?: string;
}
