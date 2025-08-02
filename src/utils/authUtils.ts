/**
 * 前端认证工具
 * 用于生成和管理用户行为统计API的认证信息
 */

import CryptoJS from 'crypto-js'

/**
 * 认证配置接口
 */
export interface AuthConfig {
  apiKey: string
  appId: string
  appSecret: string
  jwtToken?: string
  enableSignature: boolean
}

/**
 * 请求签名信息接口
 */
export interface RequestSignature {
  signature: string
  timestamp: number
  nonce: string
}

/**
 * 认证工具类
 */
export class AuthUtils {
  private static config: AuthConfig = {
    // 用户行为统计专用API密钥
    apiKey: '7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e',
    appId: 'wanjiguanjia-desktop-v1.0.0',
    appSecret: 'wjgj_2024_secure_app_secret_key_for_user_behavior_stats',
    enableSignature: true
  }

  private static signatureSecret = 'signature_secret_2024_wanjiguanjia_user_behavior_api_protection'

  /**
   * 设置JWT令牌
   */
  static setJwtToken(token: string): void {
    this.config.jwtToken = token
  }

  /**
   * 获取JWT令牌
   */
  static getJwtToken(): string | undefined {
    return this.config.jwtToken
  }

  /**
   * 生成请求签名
   */
  static generateRequestSignature(
    method: string,
    path: string,
    body: string = '',
    timestamp?: number,
    nonce?: string
  ): RequestSignature {
    const ts = timestamp || Math.floor(Date.now() / 1000)
    const n = nonce || this.generateNonce()

    // 构建签名字符串
    const signatureString = [
      method.toUpperCase(),
      path,
      body,
      ts.toString(),
      n,
      this.signatureSecret
    ].join('|')

    // 生成 HMAC-SHA256 签名
    const signature = CryptoJS.HmacSHA256(signatureString, this.signatureSecret).toString()

    return {
      signature,
      timestamp: ts,
      nonce: n
    }
  }

  /**
   * 生成随机nonce
   */
  static generateNonce(): string {
    return CryptoJS.lib.WordArray.random(16).toString()
  }

  /**
   * 获取认证请求头
   */
  static getAuthHeaders(
    method: string,
    path: string,
    body?: string
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'User-Agent': `WanjiGuanjia/1.0.0 (Tauri; Desktop)`
    }

    // 添加JWT令牌
    if (this.config.jwtToken) {
      headers['Authorization'] = `Bearer ${this.config.jwtToken}`
    }

    // 添加请求签名（如果启用）
    if (this.config.enableSignature) {
      const signatureInfo = this.generateRequestSignature(method, path, body || '')
      headers['X-Request-Signature'] = signatureInfo.signature
      headers['X-Request-Timestamp'] = signatureInfo.timestamp.toString()
      headers['X-Request-Nonce'] = signatureInfo.nonce
    }

    return headers
  }

  /**
   * 创建认证的fetch请求
   */
  static async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search
    const method = options.method || 'GET'
    const body = options.body ? String(options.body) : undefined

    const authHeaders = this.getAuthHeaders(method, path, body)

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers
      }
    }

    return fetch(url, requestOptions)
  }

  /**
   * 请求JWT令牌（如果需要）
   */
  static async requestJwtToken(userDeviceFingerprint?: string): Promise<string> {
    try {
      // 这里可以实现向服务器请求JWT令牌的逻辑
      // 目前返回一个模拟的令牌，实际应用中需要从服务器获取
      const response = await fetch('/api/auth/jwt-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify({
          appId: this.config.appId,
          appSecret: this.config.appSecret,
          userDeviceFingerprint
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get JWT token')
      }

      const data = await response.json()
      const token = data.token

      this.setJwtToken(token)
      return token
    } catch (error) {
      console.error('Error requesting JWT token:', error)
      throw error
    }
  }

  /**
   * 初始化认证（获取JWT令牌）
   */
  static async initializeAuth(userDeviceFingerprint?: string): Promise<void> {
    try {
      await this.requestJwtToken(userDeviceFingerprint)
      console.log('✅ 用户行为统计API认证初始化成功')
    } catch (error) {
      console.error('❌ 用户行为统计API认证初始化失败:', error)
      // 在认证失败的情况下，可以选择禁用某些功能或使用降级方案
    }
  }

  /**
   * 检查认证状态
   */
  static isAuthenticated(): boolean {
    return !!this.config.jwtToken
  }

  /**
   * 清除认证信息
   */
  static clearAuth(): void {
    this.config.jwtToken = undefined
  }
}

export default AuthUtils
