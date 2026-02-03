/**
 * 小米解锁工具相关类型定义
 * 重构点：将类型定义提取到独立文件，提升代码组织性
 */

export interface XiaomiTool {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  dangerous: boolean;
  available: boolean;
}

export interface CommandOutput {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  success: boolean;
}

export interface ToolConfig {
  name: string;
  folder: string;
  configFile: string;
  downloadTag?: string;
}

export interface DetectionResult {
  androidVersion: string;
  systemVersion: string;
  cpuInfo: string;
  isXiaomiDevice: boolean;
  guidance: string;
}

export interface SystemInfo {
  androidVersion: string;
  androidMajor: number;
  miuiName: string;
  cpuInfo: string;
  isQualcomm: boolean;
  isMediatek: boolean;
}