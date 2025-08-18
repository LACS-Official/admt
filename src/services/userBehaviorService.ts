/**
 * 用户行为统计服务
 * 负责收集和上传用户行为数据
 */

import { invoke } from '@tauri-apps/api/core'
import {
  ActivationRequest,
  DeviceConnectionRequest,
  ActivationStatsResponse,
  DeviceConnectionStatsResponse,
  ApiResponse,
  OfflineCacheItem,
  UserBehaviorConfig,
  DeviceFingerprint
} from '../types/userBehavior'
import { AuthUtils } from '../utils/authUtils'
import { SecureDataTransmissionService } from './secureDataTransmissionService'
import { usePrivacyConsentStore } from '../stores/privacyConsentStore'

// 默认配置
const DEFAULT_CONFIG: UserBehaviorConfig = {
  apiBaseUrl: 'http://localhost:3000', // 开发环境，生产环境需要修改
  softwareId: 1001, // 玩机管家软件ID
  softwareName: '玩机管家',
  enableOfflineCache: true,
  maxCacheItems: 100,
  maxRetryCount: 3,
  retryInterval: 5000, // 5秒
  enableEncryption: true // 启用数据加密传输
}

class UserBehaviorService {
  private config: UserBehaviorConfig
  private deviceFingerprint: string | null = null
  private retryTimer: number | null = null
  private secureTransmission: SecureDataTransmissionService

  constructor(config?: Partial<UserBehaviorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.secureTransmission = SecureDataTransmissionService.getInstance()
    // 延迟初始化，等待安全配置准备就绪
    this.deferredInitialize()
    this.startRetryTimer()
  }

  /**
   * 延迟初始化服务
   */
  private async deferredInitialize(): Promise<void> {
    // 等待一小段时间，让安全配置有机会初始化
    setTimeout(async () => {
      try {
        await this.initializeServices()
      } catch (error) {
        console.warn('用户行为服务延迟初始化失败，将在后续重试:', error)
        // 如果初始化失败，可以在后续的操作中重试
      }
    }, 1000) // 延迟1秒
  }

  /**
   * 初始化服务
   */
  private async initializeServices(): Promise<void> {
    try {
      // 初始化安全数据传输服务
      await this.secureTransmission.initialize()

      // 初始化设备指纹
      await this.initializeDeviceFingerprint()

      this.isInitialized = true
      console.log('✅ 用户行为服务初始化成功')
    } catch (error) {
      console.error('❌ 用户行为服务初始化失败:', error)
      // 不抛出错误，允许服务在后续操作中重试初始化
    }
  }

  /**
   * 确保服务已初始化（懒加载）
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeServices()
    }
  }

  /**
   * 初始化设备指纹
   */
  private async initializeDeviceFingerprint(): Promise<void> {
    try {
      // 尝试从本地存储获取已保存的设备指纹
      const saved = localStorage.getItem('device_fingerprint')
      if (saved) {
        const fingerprintData: DeviceFingerprint = JSON.parse(saved)
        // 检查是否过期（30天）
        const isExpired = Date.now() - fingerprintData.timestamp > 30 * 24 * 60 * 60 * 1000
        if (!isExpired) {
          this.deviceFingerprint = fingerprintData.fingerprint
          return
        }
      }

      // 生成新的设备指纹
      const fingerprint = await invoke<string>('get_device_fingerprint')
      const os = await this.getSystemInfo()
      
      const fingerprintData: DeviceFingerprint = {
        fingerprint,
        os: os.os,
        arch: os.arch,
        timestamp: Date.now()
      }

      localStorage.setItem('device_fingerprint', JSON.stringify(fingerprintData))
      this.deviceFingerprint = fingerprint

      console.log('设备指纹已生成:', fingerprint)
    } catch (error) {
      console.error('生成设备指纹失败:', error)
      // 使用备用方案
      this.deviceFingerprint = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 初始化认证
    await this.initializeAuth()
  }

  /**
   * 初始化认证
   */
  private async initializeAuth(): Promise<void> {
    try {
      await AuthUtils.initializeAuth(this.deviceFingerprint)
    } catch (error) {
      console.error('认证初始化失败:', error)
      // 认证失败不影响其他功能，但会记录错误
    }
  }

  /**
   * 获取系统信息
   */
  private async getSystemInfo(): Promise<{ os: string; arch: string }> {
    try {
      // 这里可以调用Tauri API获取系统信息
      // 暂时使用浏览器信息作为备用
      return {
        os: navigator.platform || 'Unknown',
        arch: navigator.userAgent.includes('x64') ? 'x64' : 'x86'
      }
    } catch (error) {
      return { os: 'Unknown', arch: 'Unknown' }
    }
  }

  /**
   * 检查隐私政策同意状态
   */
  private checkPrivacyConsent(): boolean {
    const privacyStore = usePrivacyConsentStore.getState();

    if (!privacyStore.canCollectData()) {
      console.log('🚫 用户未同意数据收集，跳过数据上传');
      return false;
    }

    return true;
  }

  /**
   * 记录软件激活
   */
  async recordActivation(data: Partial<ActivationRequest>): Promise<boolean> {
    await this.ensureInitialized()

    // 首先检查隐私政策同意状态
    if (!this.checkPrivacyConsent()) {
      console.log('🚫 隐私政策检查失败，跳过激活记录');
      return false;
    }

    if (!this.deviceFingerprint) {
      await this.initializeDeviceFingerprint()
    }

    const activationData: ActivationRequest = {
      softwareId: this.config.softwareId,
      softwareName: this.config.softwareName,
      deviceFingerprint: this.deviceFingerprint!,
      ...data
    }

    // 添加系统信息
    const systemInfo = await this.getSystemInfo()
    activationData.deviceOs = systemInfo.os
    activationData.deviceArch = systemInfo.arch

    return this.sendRequest('/api/user-behavior/activations', activationData, 'activation')
  }

  /**
   * 记录设备连接
   */
  async recordDeviceConnection(data: DeviceConnectionRequest): Promise<boolean> {
    await this.ensureInitialized()

    if (!this.deviceFingerprint) {
      await this.initializeDeviceFingerprint()
    }

    const connectionData: DeviceConnectionRequest = {
      softwareId: this.config.softwareId,
      userDeviceFingerprint: this.deviceFingerprint!,
      ...data
    }

    return this.sendRequest('/api/user-behavior/device-connections', connectionData, 'device_connection')
  }

  /**
   * 发送请求到API
   */
  private async sendRequest(
    endpoint: string,
    data: ActivationRequest | DeviceConnectionRequest,
    type: 'activation' | 'device_connection'
  ): Promise<boolean> {
    try {
      // 创建安全传输包
      const securePacket = this.secureTransmission.createSecurePacket(data, this.config.enableEncryption)

      console.log(`📤 发送${type}数据 (加密: ${securePacket.encrypted})`)

      const response = await AuthUtils.authenticatedFetch(`${this.config.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(securePacket),
        headers: {
          'X-Data-Encrypted': securePacket.encrypted.toString(),
          'X-Data-Version': securePacket.version
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success) {
        console.log(`✅ ${type} 数据上传成功:`, result.data)
        return true
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error(`❌ ${type} 数据上传失败:`, error)

      // 如果启用离线缓存，保存到本地
      if (this.config.enableOfflineCache) {
        this.saveToOfflineCache(data, type)
      }

      return false
    }
  }

  /**
   * 保存到离线缓存
   */
  private saveToOfflineCache(
    data: ActivationRequest | DeviceConnectionRequest, 
    type: 'activation' | 'device_connection'
  ): void {
    try {
      const cacheKey = 'user_behavior_offline_cache'
      const existingCache = localStorage.getItem(cacheKey)
      let cache: OfflineCacheItem[] = existingCache ? JSON.parse(existingCache) : []

      // 限制缓存数量
      if (cache.length >= this.config.maxCacheItems) {
        cache = cache.slice(-this.config.maxCacheItems + 1)
      }

      const cacheItem: OfflineCacheItem = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0
      }

      cache.push(cacheItem)
      localStorage.setItem(cacheKey, JSON.stringify(cache))
      
      console.log(`数据已保存到离线缓存: ${type}`)
    } catch (error) {
      console.error('保存离线缓存失败:', error)
    }
  }

  /**
   * 重试离线缓存中的数据
   */
  async retryOfflineCache(): Promise<void> {
    try {
      const cacheKey = 'user_behavior_offline_cache'
      const existingCache = localStorage.getItem(cacheKey)
      if (!existingCache) return

      const cache: OfflineCacheItem[] = JSON.parse(existingCache)
      const remainingCache: OfflineCacheItem[] = []

      for (const item of cache) {
        if (item.retryCount >= this.config.maxRetryCount) {
          console.log(`缓存项重试次数已达上限，丢弃: ${item.id}`)
          continue
        }

        const endpoint = item.type === 'activation' 
          ? '/api/user-behavior/activations'
          : '/api/user-behavior/device-connections'

        const success = await this.sendRequest(endpoint, item.data, item.type)
        
        if (!success) {
          item.retryCount++
          remainingCache.push(item)
        }
      }

      // 更新缓存
      localStorage.setItem(cacheKey, JSON.stringify(remainingCache))
      
      if (remainingCache.length === 0) {
        console.log('所有离线缓存数据已成功上传')
      } else {
        console.log(`还有 ${remainingCache.length} 条数据待重试`)
      }
    } catch (error) {
      console.error('重试离线缓存失败:', error)
    }
  }

  /**
   * 启动重试定时器
   */
  private startRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer)
    }

    this.retryTimer = window.setInterval(() => {
      this.retryOfflineCache()
    }, this.config.retryInterval)
  }

  /**
   * 停止重试定时器
   */
  stopRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer)
      this.retryTimer = null
    }
  }

  /**
   * 获取激活统计
   */
  async getActivationStats(params?: {
    softwareId?: number
    startDate?: string
    endDate?: string
  }): Promise<ActivationStatsResponse | null> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.softwareId) queryParams.append('softwareId', params.softwareId.toString())
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)

      const response = await AuthUtils.authenticatedFetch(
        `${this.config.apiBaseUrl}/api/user-behavior/activations?${queryParams}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('获取激活统计失败:', error)
      return null
    }
  }

  /**
   * 获取设备连接统计
   */
  async getDeviceConnectionStats(params?: {
    softwareId?: number
    startDate?: string
    endDate?: string
  }): Promise<DeviceConnectionStatsResponse | null> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.softwareId) queryParams.append('softwareId', params.softwareId.toString())
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)

      const response = await AuthUtils.authenticatedFetch(
        `${this.config.apiBaseUrl}/api/user-behavior/device-connections?${queryParams}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('获取设备连接统计失败:', error)
      return null
    }
  }

  /**
   * 清理过期的离线缓存
   */
  cleanupExpiredCache(): void {
    try {
      const cacheKey = 'user_behavior_offline_cache'
      const existingCache = localStorage.getItem(cacheKey)
      if (!existingCache) return

      const cache: OfflineCacheItem[] = JSON.parse(existingCache)
      const now = Date.now()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天

      const validCache = cache.filter(item => now - item.timestamp < maxAge)
      
      localStorage.setItem(cacheKey, JSON.stringify(validCache))
      
      if (validCache.length < cache.length) {
        console.log(`清理了 ${cache.length - validCache.length} 条过期缓存`)
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error)
    }
  }

  /**
   * 获取当前设备指纹
   */
  getDeviceFingerprint(): string | null {
    return this.deviceFingerprint
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UserBehaviorConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// 创建单例实例
export const userBehaviorService = new UserBehaviorService()

// 导出类型和服务
export default UserBehaviorService
export { UserBehaviorService }
