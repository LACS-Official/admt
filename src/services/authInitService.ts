/**
 * Tauri应用认证系统初始化服务
 * 负责在应用启动时初始化认证系统，包括设备指纹生成、JWT令牌获取等
 */

import { invoke } from '@tauri-apps/api/core'
import { SecurityConfigManager } from '../config/securityConfig'
import { AuthUtils } from '../utils/authUtils'

/**
 * 认证初始化状态
 */
export interface AuthInitStatus {
  isInitialized: boolean
  hasDeviceFingerprint: boolean
  hasJwtToken: boolean
  hasValidConfig: boolean
  error?: string
}

/**
 * 认证系统初始化服务
 */
export class AuthInitService {
  private static instance: AuthInitService
  private initStatus: AuthInitStatus = {
    isInitialized: false,
    hasDeviceFingerprint: false,
    hasJwtToken: false,
    hasValidConfig: false
  }

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): AuthInitService {
    if (!AuthInitService.instance) {
      AuthInitService.instance = new AuthInitService()
    }
    return AuthInitService.instance
  }

  /**
   * 初始化认证系统
   */
  async initialize(): Promise<AuthInitStatus> {
    console.log('🔐 开始初始化认证系统...')

    try {
      // 1. 初始化安全配置
      await this.initializeSecurityConfig()

      // 2. 生成设备指纹
      await this.initializeDeviceFingerprint()

      // 3. 初始化认证工具
      await this.initializeAuthUtils()

      // 4. 获取JWT令牌
      await this.initializeJwtToken()

      this.initStatus.isInitialized = true
      console.log('✅ 认证系统初始化成功')

      return this.initStatus
    } catch (error) {
      console.error('❌ 认证系统初始化失败:', error)
      this.initStatus.error = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  /**
   * 初始化安全配置
   */
  private async initializeSecurityConfig(): Promise<void> {
    console.log('📋 初始化安全配置...')

    try {
      const configManager = SecurityConfigManager.getInstance()
      await configManager.initialize()

      // 验证配置
      const isValid = await invoke<boolean>('validate_security_config')
      if (!isValid) {
        throw new Error('Security configuration validation failed')
      }

      this.initStatus.hasValidConfig = true
      console.log('✅ 安全配置初始化成功')
    } catch (error) {
      console.error('❌ 安全配置初始化失败:', error)
      throw new Error(`Failed to initialize security config: ${error}`)
    }
  }

  /**
   * 初始化设备指纹
   */
  private async initializeDeviceFingerprint(): Promise<void> {
    console.log('🔍 生成设备指纹...')

    try {
      const fingerprint = await invoke<string>('get_device_fingerprint')
      if (!fingerprint) {
        throw new Error('Failed to generate device fingerprint')
      }

      this.initStatus.hasDeviceFingerprint = true
      console.log('✅ 设备指纹生成成功:', fingerprint.substring(0, 16) + '...')
    } catch (error) {
      console.error('❌ 设备指纹生成失败:', error)
      throw new Error(`Failed to generate device fingerprint: ${error}`)
    }
  }

  /**
   * 初始化认证工具
   */
  private async initializeAuthUtils(): Promise<void> {
    console.log('🛠️ 初始化认证工具...')

    try {
      const authUtils = AuthUtils.getInstance()
      await authUtils.initialize()

      console.log('✅ 认证工具初始化成功')
    } catch (error) {
      console.error('❌ 认证工具初始化失败:', error)
      throw new Error(`Failed to initialize auth utils: ${error}`)
    }
  }

  /**
   * 初始化JWT令牌
   */
  private async initializeJwtToken(): Promise<void> {
    console.log('🎫 获取JWT令牌...')

    try {
      const authUtils = AuthUtils.getInstance()
      const token = await authUtils.getValidToken()

      if (!token) {
        throw new Error('Failed to obtain JWT token')
      }

      this.initStatus.hasJwtToken = true
      console.log('✅ JWT令牌获取成功')
    } catch (error) {
      console.error('❌ JWT令牌获取失败:', error)
      throw new Error(`Failed to obtain JWT token: ${error}`)
    }
  }

  /**
   * 获取初始化状态
   */
  getInitStatus(): AuthInitStatus {
    return { ...this.initStatus }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initStatus.isInitialized
  }

  /**
   * 重置初始化状态（用于测试或重新初始化）
   */
  reset(): void {
    this.initStatus = {
      isInitialized: false,
      hasDeviceFingerprint: false,
      hasJwtToken: false,
      hasValidConfig: false
    }
  }

  /**
   * 验证认证系统状态
   */
  async validateAuthSystem(): Promise<boolean> {
    try {
      if (!this.isInitialized()) {
        return false
      }

      // 验证JWT令牌是否仍然有效
      const authUtils = AuthUtils.getInstance()
      const token = await authUtils.getValidToken()

      return !!token
    } catch (error) {
      console.error('认证系统验证失败:', error)
      return false
    }
  }

  /**
   * 刷新认证状态
   */
  async refreshAuth(): Promise<void> {
    console.log('🔄 刷新认证状态...')

    try {
      const authUtils = AuthUtils.getInstance()
      await authUtils.refreshToken()

      console.log('✅ 认证状态刷新成功')
    } catch (error) {
      console.error('❌ 认证状态刷新失败:', error)
      throw error
    }
  }
}

export default AuthInitService
