export type LogLevel = "fatal" | "error" | "warning" | "info" | "debug";
export type LogCategory = "device" | "firmware" | "system" | "user" | "network" | "security" | "ai";

export interface StructuredLogEntry {
  id: string;
  timestamp: string; // ISO 8601 格式
  level: LogLevel;
  category: LogCategory;
  message: string;
  source: string;
  context: {
    deviceId?: string;
    deviceModel?: string;
    deviceMode?: string;
    operationId?: string;
    errorCode?: string;
    stackTrace?: string;
    userAgent?: string;
    sessionId?: string;
    [key: string]: any;
  };
  metadata: {
    version: string;
    platform: string;
    buildId?: string;
  };
}

export interface DeviceEvent {
  type: 'connected' | 'disconnected' | 'mode_changed' | 'error';
  deviceId: string;
  deviceModel?: string;
  previousMode?: string;
  currentMode?: string;
  timestamp: string;
  details?: any;
}

export interface FirmwareFlashEvent {
  type: 'started' | 'progress' | 'verification' | 'completed' | 'failed';
  operationId: string;
  deviceId: string;
  firmwareFile?: string;
  progress?: number;
  stage?: string;
  errorCode?: string;
  errorMessage?: string;
  timestamp: string;
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  source?: string;
  search?: string;
  deviceId?: string;
  operationId?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface LogRetentionPolicy {
  basicLogs: number; // 基础状态信息保留天数 (30天)
  errorLogs: number; // 错误日志保留天数 (180天)
  maxMemoryLogs: number; // 内存中最大日志条数
}

export interface LogStats {
  fatal: number;
  error: number;
  warning: number;
  info: number;
  debug: number;
  total: number;
  byCategory: { [key in LogCategory]: number };
  recentErrors: number;
}