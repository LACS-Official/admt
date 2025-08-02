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
  | "online-resources"
  | "settings";

export type SettingsView =
  | "about"
  | "tool-settings"
  | "other-settings"
  | "privacy"
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

// 公告相关类型
export interface Announcement {
  id: number;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  type: 'general' | 'update' | 'security' | 'maintenance';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  version?: string;
  isPublished: boolean;
  publishedAt: string;
  expiresAt?: string;
  metadata?: {
    author?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface AnnouncementResponse {
  success: boolean;
  data: {
    software: {
      id: number;
      name: string;
    };
    announcements: Announcement[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

// 在线资源相关类型
export interface OnlineSoftware {
  id: number;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  currentVersion: string;
  currentVersionId?: number;
  latestDownloadUrl?: string;
  category?: string;
  tags?: string[];
  officialWebsite?: string;
  openname?: string;
  filetype?: string;
  systemRequirements?: {
    os?: string[];
    memory?: string;
    storage?: string;
  };
  metadata?: {
    developer?: string;
    license?: string;
    platform?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface OnlineSoftwareResponse {
  success: boolean;
  data: OnlineSoftware[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface DownloadTask {
  id: string;
  softwareId: number;
  softwareName: string;
  fileName: string;
  downloadUrl: string;
  progress: number;
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  error?: string;
  startTime: Date;
  endTime?: Date;
  fileSize?: number;
  downloadedSize?: number;
}

// 在线资源页面状态
export type OnlineResourcesView = "list" | "detail";

export interface OnlineResourcesState {
  currentView: OnlineResourcesView;
  selectedSoftwareId?: number;
  selectedSoftware?: OnlineSoftware;
}
