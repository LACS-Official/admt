export interface AppConfig {
  theme: "light" | "dark" | "auto";
  language: "zh-CN" | "en-US";
  autoDetectDevices: boolean;
  scanInterval: number;
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
  | "device-info"
  | "file-manager"
  | "adb-tools"
  | "device-control"
  | "app-manager"
  | "screen-mirror"
  | "tools"
  | "settings";

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
