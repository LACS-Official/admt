/**
 * 安全数据传输服务
 * 负责在数据传输过程中确保敏感信息的安全，包括数据加密、脱敏处理等
 */

import CryptoJS from 'crypto-js'
import { SecurityConfigManager } from '../config/securityConfig'

/**
 * 敏感数据类型
 */
export interface SensitiveData {
  deviceSerial?: string
  deviceFingerprint?: string
  userIdentifier?: string
  sessionId?: string
  [key: string]: any
}

/**
 * 数据脱敏配置
 */
export interface DataMaskingConfig {
  maskDeviceSerial: boolean
  maskFingerprint: boolean
  maskUserData: boolean
  preserveLength: boolean
}

/**
 * 加密数据结构
 */
export interface EncryptedData {
  data: string
  iv: string
  timestamp: number
  checksum: string
}

/**
 * 安全数据传输服务
 */
export class SecureDataTransmissionService {
  private static instance: SecureDataTransmissionService
  private encryptionKey: string | null = null
  private isInitialized = false

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): SecureDataTransmissionService {
    if (!SecureDataTransmissionService.instance) {
      SecureDataTransmissionService.instance = new SecureDataTransmissionService()
    }
    return SecureDataTransmissionService.instance
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const configManager = SecurityConfigManager.getInstance()
      const config = configManager.getConfig()
      
      // 使用签名密钥作为加密密钥的基础
      this.encryptionKey = this.deriveEncryptionKey(config.signature_secret)
      this.isInitialized = true

      console.log('✅ 安全数据传输服务初始化成功')
    } catch (error) {
      console.error('❌ 安全数据传输服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 派生加密密钥
   */
  private deriveEncryptionKey(secret: string): string {
    // 使用PBKDF2派生密钥
    const salt = 'wanjiguanjia-secure-transmission-2024'
    return CryptoJS.PBKDF2(secret, salt, {
      keySize: 256 / 32,
      iterations: 10000
    }).toString()
  }

  /**
   * 加密敏感数据
   */
  encryptSensitiveData(data: any): EncryptedData {
    if (!this.isInitialized || !this.encryptionKey) {
      throw new Error('Secure data transmission service not initialized')
    }

    try {
      const jsonData = JSON.stringify(data)
      const iv = CryptoJS.lib.WordArray.random(16)
      
      // 使用AES-256-CBC加密
      const encrypted = CryptoJS.AES.encrypt(jsonData, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })

      const encryptedData = encrypted.toString()
      const timestamp = Date.now()
      
      // 生成校验和
      const checksum = CryptoJS.HmacSHA256(
        encryptedData + iv.toString() + timestamp,
        this.encryptionKey
      ).toString()

      return {
        data: encryptedData,
        iv: iv.toString(),
        timestamp,
        checksum
      }
    } catch (error) {
      console.error('数据加密失败:', error)
      throw new Error('Failed to encrypt sensitive data')
    }
  }

  /**
   * 解密敏感数据
   */
  decryptSensitiveData(encryptedData: EncryptedData): any {
    if (!this.isInitialized || !this.encryptionKey) {
      throw new Error('Secure data transmission service not initialized')
    }

    try {
      // 验证校验和
      const expectedChecksum = CryptoJS.HmacSHA256(
        encryptedData.data + encryptedData.iv + encryptedData.timestamp,
        this.encryptionKey
      ).toString()

      if (expectedChecksum !== encryptedData.checksum) {
        throw new Error('Data integrity check failed')
      }

      // 检查时间戳（防止重放攻击）
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5分钟
      if (now - encryptedData.timestamp > maxAge) {
        throw new Error('Encrypted data has expired')
      }

      // 解密数据
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv)
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })

      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)
      return JSON.parse(decryptedText)
    } catch (error) {
      console.error('数据解密失败:', error)
      throw new Error('Failed to decrypt sensitive data')
    }
  }

  /**
   * 发送安全请求
   */
  async sendSecureRequest(endpoint: string, data?: any, options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
  }): Promise<any> {
    if (!this.isInitialized || !this.encryptionKey) {
      throw new Error('Secure data transmission service not initialized')
    }

    try {
      const configManager = SecurityConfigManager.getInstance()
      const config = configManager.getConfig()

      const method = options?.method || (data ? 'POST' : 'GET')
      const url = `${config.api_base_url}${endpoint}`

      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': config.api_key,
        'User-Agent': 'HOUT-Desktop/1.0.0',
        ...options?.headers
      }

      // 准备请求体
      let body: string | undefined
      if (data && (method === 'POST' || method === 'PUT')) {
        body = JSON.stringify(data)
      }

      console.log(`🌐 发送${method}请求到: ${url}`)

      const response = await fetch(url, {
        method,
        headers,
        body
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ 请求成功:', { endpoint, status: response.status })

      return result
    } catch (error) {
      console.error('❌ 安全请求失败:', error)
      throw error
    }
  }

  /**
   * 数据脱敏处理
   */
  maskSensitiveData(data: SensitiveData, config: DataMaskingConfig): SensitiveData {
    const maskedData = { ...data }

    if (config.maskDeviceSerial && maskedData.deviceSerial) {
      maskedData.deviceSerial = this.maskString(maskedData.deviceSerial, config.preserveLength)
    }

    if (config.maskFingerprint && maskedData.deviceFingerprint) {
      maskedData.deviceFingerprint = this.maskString(maskedData.deviceFingerprint, config.preserveLength)
    }

    if (config.maskUserData && maskedData.userIdentifier) {
      maskedData.userIdentifier = this.maskString(maskedData.userIdentifier, config.preserveLength)
    }

    return maskedData
  }

  /**
   * 字符串脱敏
   */
  private maskString(str: string, preserveLength: boolean = true): string {
    if (!str) return str

    if (preserveLength) {
      // 保留长度，用*替换中间部分
      if (str.length <= 4) {
        return '*'.repeat(str.length)
      }
      const start = str.substring(0, 2)
      const end = str.substring(str.length - 2)
      const middle = '*'.repeat(str.length - 4)
      return start + middle + end
    } else {
      // 固定长度脱敏
      return '***MASKED***'
    }
  }

  /**
   * 生成安全传输包
   */
  createSecurePacket(data: any, includeEncryption: boolean = true): any {
    try {
      if (includeEncryption) {
        // 加密敏感数据
        const encryptedData = this.encryptSensitiveData(data)
        return {
          encrypted: true,
          payload: encryptedData,
          timestamp: Date.now(),
          version: '1.0'
        }
      } else {
        // 仅进行数据脱敏
        const maskingConfig: DataMaskingConfig = {
          maskDeviceSerial: true,
          maskFingerprint: false, // 设备指纹通常需要完整传输
          maskUserData: true,
          preserveLength: true
        }

        const maskedData = this.maskSensitiveData(data, maskingConfig)
        return {
          encrypted: false,
          payload: maskedData,
          timestamp: Date.now(),
          version: '1.0'
        }
      }
    } catch (error) {
      console.error('创建安全传输包失败:', error)
      throw error
    }
  }

  /**
   * 解析安全传输包
   */
  parseSecurePacket(packet: any): any {
    try {
      if (!packet || typeof packet !== 'object') {
        throw new Error('Invalid secure packet format')
      }

      if (packet.encrypted) {
        // 解密数据
        return this.decryptSensitiveData(packet.payload)
      } else {
        // 直接返回载荷
        return packet.payload
      }
    } catch (error) {
      console.error('解析安全传输包失败:', error)
      throw error
    }
  }

  /**
   * 验证数据完整性
   */
  validateDataIntegrity(data: any, expectedChecksum: string): boolean {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available')
      }

      const dataString = JSON.stringify(data)
      const actualChecksum = CryptoJS.HmacSHA256(dataString, this.encryptionKey).toString()
      
      return actualChecksum === expectedChecksum
    } catch (error) {
      console.error('数据完整性验证失败:', error)
      return false
    }
  }

  /**
   * 生成数据校验和
   */
  generateChecksum(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available')
    }

    const dataString = JSON.stringify(data)
    return CryptoJS.HmacSHA256(dataString, this.encryptionKey).toString()
  }

  /**
   * 检查是否已初始化
   */
  isServiceInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * 重置服务状态
   */
  reset(): void {
    this.encryptionKey = null
    this.isInitialized = false
  }
}

export default SecureDataTransmissionService
