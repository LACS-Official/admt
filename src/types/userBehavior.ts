/**
 * 用户行为统计相关类型定义
 */

// 软件激活记录
export interface SoftwareActivation {
  id: string
  softwareId: number
  softwareName: string
  softwareVersion?: string
  deviceFingerprint: string
  deviceOs?: string
  deviceArch?: string
  activationCode?: string
  activatedAt: string
  username?: string
  userEmail?: string
  ipAddress?: string
  country?: string
  region?: string
  city?: string
  createdAt: string
  updatedAt: string
}

// 激活记录请求
export interface ActivationRequest {
  softwareId: number
  softwareName?: string
  softwareVersion?: string
  deviceFingerprint: string
  deviceOs?: string
  deviceArch?: string
  activationCode?: string
  username?: string
  userEmail?: string
  ipAddress?: string
  country?: string
  region?: string
  city?: string
}

// 设备连接记录
export interface DeviceConnection {
  id: string
  deviceSerial: string
  deviceBoardId?: string
  deviceUniqueId: string
  deviceBrand?: string
  deviceModel?: string
  deviceManufacturer?: string
  androidVersion?: string
  connectionType?: 'usb' | 'wifi'
  connectionMode?: 'sys' | 'rec' | 'fastboot' | 'fastbootd' | 'sideload' | 'edl' | 'unauthorized' | 'offline' | 'unknown'
  softwareId: number
  softwareVersion?: string
  userDeviceFingerprint?: string
  connectedAt: string
  disconnectedAt?: string
  sessionDuration?: number
  ipAddress?: string
  country?: string
  region?: string
  city?: string
  createdAt: string
  updatedAt: string
}

// 设备连接请求
export interface DeviceConnectionRequest {
  deviceSerial: string
  deviceBrand?: string
  deviceModel?: string
  softwareId: number
  softwareVersion?: string
  userDeviceFingerprint?: string
}

// 统计汇总数据
export interface BehaviorStat {
  id: string
  statType: 'activation' | 'device_connection' | 'daily_summary'
  softwareId: number
  statData: string // JSON字符串
  statDate: string
  statPeriod: 'daily' | 'weekly' | 'monthly'
  createdAt: string
  updatedAt: string
}

// 激活统计响应
export interface ActivationStatsResponse {
  success: boolean
  data: {
    totalActivations: number
    uniqueDevices: number
    recentActivations: Array<{
      id: string
      softwareName: string
      softwareVersion?: string
      deviceOs?: string
      deviceArch?: string
      activatedAt: string
      country?: string
      region?: string
      city?: string
    }>
    summary: {
      totalActivations: number
      uniqueDevices: number
      averageActivationsPerDevice: string
    }
  }
}

// 设备连接统计响应
export interface DeviceConnectionStatsResponse {
  success: boolean
  data: {
    totalConnections: number
    uniqueDevices: number
    brandStats: Array<{
      brand: string
      count: number
    }>
    connectionTypeStats: Array<{
      connectionType: string
      count: number
    }>
    recentConnections: Array<{
      id: string
      deviceSerial: string
      deviceBrand?: string
      deviceModel?: string
      androidVersion?: string
      connectionType?: string
      connectionMode?: string
      connectedAt: string
      sessionDuration?: number
      country?: string
      region?: string
      city?: string
    }>
    summary: {
      totalConnections: number
      uniqueDevices: number
      averageConnectionsPerDevice: string
    }
  }
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: any
}

// 离线缓存项
export interface OfflineCacheItem {
  id: string
  type: 'activation' | 'device_connection'
  data: ActivationRequest | DeviceConnectionRequest
  timestamp: number
  retryCount: number
}

// 用户行为统计配置
export interface UserBehaviorConfig {
  apiBaseUrl: string
  softwareId: number
  softwareName: string
  enableOfflineCache: boolean
  maxCacheItems: number
  maxRetryCount: number
  retryInterval: number
  enableEncryption: boolean // 是否启用数据加密传输
}

// 设备指纹信息
export interface DeviceFingerprint {
  fingerprint: string
  os: string
  arch: string
  timestamp: number
}
