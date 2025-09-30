export interface AppConfig {
  theme: "light" | "dark" | "auto";
  language: "zh-CN" | "en-US";
  autoDetectDevices: boolean;
  scanInterval: number;
  deviceDetectionInterval: number;
  logLevel: "debug" | "info" | "warn" | "error";
  adbPath?: string;
  fastbootPath?: string;
  systemTrayEnabled: boolean;
  autoStartEnabled: boolean;
  minimizeToTrayOnClose: boolean;
  startMinimizedToTray: boolean;
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
  | "settings"
  | "demo";

export type SettingsView =
  | "about"
  | "devices-settings"
  | "tool-settings"
  | "display-settings"
  | "other-settings"
  | "privacy"
  | "usage-tracking"
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
  hasUpdate: boolean;
  currentVersion: string;
  localVersion: string;
  updateInfo?: {
    updateLog?: string;
    downloadUrl: string;
  };
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
  fileSize?: number;
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
  iconUrl?: string;
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
  status: "pending" | "downloading" | "paused" | "downloaded" | "extracting" | "completed" | "failed" | "cancelled";
  error?: string;
  startTime: Date;
  endTime?: Date;
  fileSize?: number;
  downloadedSize?: number;
  downloadSpeed?: number; // 下载速度 (bytes/second)
  remainingTime?: number; // 剩余时间 (seconds)
  filePath?: string; // 下载完成后的文件路径
  extractedPath?: string; // 解压后的目录路径
  openname?: string; // 启动文件名或命令
}

// 下载管理状态
export interface DownloadManagerState {
  tasks: DownloadTask[];
  activeDownloads: number;
  totalDownloaded: number;
  downloadHistory: DownloadTask[];
}

// 在线资源页面状态
export type OnlineResourcesView = "list" | "detail" | "downloads";

export interface OnlineResourcesState {
  currentView: OnlineResourcesView;
  selectedSoftwareId?: number;
  selectedSoftware?: OnlineSoftware;
  showResourceDetailModal?: boolean;
  selectedResourceForModal?: OnlineSoftware;
}
