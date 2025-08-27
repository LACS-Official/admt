/**
 * 优化设备统计相关类型定义
 * 专为存储空间限制优化，简化数据结构
 */

// 优化设备统计请求
export interface DeviceStatsRequest {
  deviceFingerprint: string
  osVersion: string
  arch: string
}

// 优化设备统计响应
export interface DeviceStatsResponse {
  success: boolean
  message?: string
  installRank?: number
  runCount?: number
  isNewDevice?: boolean
  data?: {
    totalDevices: number
    totalRuns: number
    deviceRank: number
    runCount: number
    firstSeen: string
    lastSeen: string
  }
  error?: string
}

// 统计概览响应
export interface StatsOverviewResponse {
  success: boolean
  data: {
    totalDevices: number
    totalRuns: number
    newDevicesToday: number
    activeDevicesToday: number
    topCountries: Array<{
      country: string
      count: number
      percentage: number
    }>
    osDistribution: Array<{
      os: string
      count: number
      percentage: number
    }>
    archDistribution: Array<{
      arch: string
      count: number
      percentage: number
    }>
  }
}

// 国家统计响应
export interface CountryStatsResponse {
  success: boolean
  data: Array<{
    country: string
    deviceCount: number
    runCount: number
    percentage: number
    firstSeen: string
    lastSeen: string
  }>
}

// 活动趋势响应
export interface ActivityTrendsResponse {
  success: boolean
  data: {
    trends: Array<{
      date: string
      newDevices: number
      activeDevices: number
      totalRuns: number
    }>
    summary: {
      totalDays: number
      averageNewDevicesPerDay: number
      averageActiveDevicesPerDay: number
      averageRunsPerDay: number
      growthRate: number
    }
  }
}
