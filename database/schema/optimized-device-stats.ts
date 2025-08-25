/**
 * 优化设备统计数据的类型定义
 * 用于设备统计API请求和响应
 */

export interface DeviceStatsRequest {
  deviceFingerprint: string;
  osVersion: string;
  arch: string;
}

export interface DeviceStatsResponse {
  success: boolean;
  installRank?: number;
  runCount?: number;
  isNewDevice?: boolean;
  message?: string;
  error?: string;
}
