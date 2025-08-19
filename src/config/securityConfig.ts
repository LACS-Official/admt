/**
 * Tauri应用安全配置管理
 * 负责管理API密钥、JWT密钥等敏感信息的安全存储和访问
 */

import { invoke } from '@tauri-apps/api/core'

/**
 * 安全配置接口（匹配Rust结构体字段名）
 */
export interface SecurityConfig {
  api_base_url: string
  api_key: string
  app_id: string
  app_secret: string
  signature_secret: string
  enable_signature: boolean
  enable_strict_user_agent: boolean
  app_version: string
  software_id: number
}

/**
 * 安全配置管理类
 */
export class SecurityConfigManager {
  private static instance: SecurityConfigManager
  private config: SecurityConfig | null = null
  private isInitialized = false

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager()
    }
    return SecurityConfigManager.instance
  }

  /**
   * 初始化安全配置
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // 从Tauri后端获取安全配置
      const config = await invoke<SecurityConfig>('get_security_config')
      
      // 验证配置完整性
      this.validateConfig(config)
      
      this.config = config
      this.isInitialized = true
      
      console.log('✅ 安全配置初始化成功')
    } catch (error) {
      console.error('❌ 安全配置初始化失败:', error)
      throw new Error('Failed to initialize security configuration')
    }
  }

  /**
   * 验证配置完整性
   */
  private validateConfig(config: SecurityConfig): void {
    const requiredFields = ['api_base_url', 'api_key', 'app_id', 'app_secret', 'app_version']

    for (const field of requiredFields) {
      if (!config[field as keyof SecurityConfig]) {
        throw new Error(`Missing required security config field: ${field}`)
      }
    }

    // 验证API密钥强度
    if (config.api_key.length < 32) {
      throw new Error('API key is too weak (minimum 32 characters required)')
    }

    // 验证应用密钥强度
    if (config.app_secret.length < 16) {
      throw new Error('App secret is too weak (minimum 16 characters required)')
    }

    // 验证版本号格式
    if (!/^\d+\.\d+\.\d+/.test(config.app_version)) {
      throw new Error('Invalid app version format (expected: x.y.z)')
    }

    // 验证软件ID
    if (!config.software_id || config.software_id <= 0) {
      throw new Error('Invalid software ID')
    }
  }

  /**
   * 获取安全配置
   */
  getConfig(): SecurityConfig {
    if (!this.isInitialized || !this.config) {
      throw new Error('Security configuration not initialized')
    }
    return { ...this.config } // 返回副本，防止外部修改
  }

  /**
   * 获取API基础URL
   */
  getApiBaseUrl(): string {
    return this.getConfig().api_base_url
  }

  /**
   * 获取API密钥
   */
  getApiKey(): string {
    return this.getConfig().api_key
  }

  /**
   * 获取应用ID
   */
  getAppId(): string {
    return this.getConfig().app_id
  }

  /**
   * 获取应用密钥
   */
  getAppSecret(): string {
    return this.getConfig().app_secret
  }

  /**
   * 获取签名密钥
   */
  getSignatureSecret(): string {
    return this.getConfig().signature_secret
  }

  /**
   * 是否启用请求签名
   */
  isSignatureEnabled(): boolean {
    return this.getConfig().enable_signature
  }

  /**
   * 是否启用严格User-Agent检查
   */
  isStrictUserAgentEnabled(): boolean {
    return this.getConfig().enable_strict_user_agent
  }

  /**
   * 获取应用版本号
   */
  getAppVersion(): string {
    return this.getConfig().app_version
  }

  /**
   * 获取软件ID
   */
  getSoftwareId(): number {
    return this.getConfig().software_id
  }

  /**
   * 检查是否已初始化
   */
  isConfigInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * 重置配置（用于测试或重新初始化）
   */
  reset(): void {
    this.config = null
    this.isInitialized = false
  }
}

export default SecurityConfigManager
