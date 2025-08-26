/**
 * 设备识别和指纹生成工具
 * 用于生成唯一的设备标识符
 */

import { invoke } from '@tauri-apps/api/core'
import { DeviceInfo, DeviceProperties } from '../types/device'

/**
 * 设备指纹信息
 */
export interface DeviceIdentification {
  // 主设备指纹（用于软件激活）
  deviceFingerprint: string
  
  // 设备唯一ID（用于设备连接统计）
  deviceUniqueId: string
  
  // 系统信息
  systemInfo: {
    os: string
    arch: string
    platform: string
  }
  
  // 生成时间
  generatedAt: number
}

/**
 * 设备指纹管理器
 */
class DeviceIdentificationManager {
  private static instance: DeviceIdentificationManager
  private cachedIdentification: DeviceIdentification | null = null
  private readonly CACHE_KEY = 'device_identification'
  private readonly CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30天

  private constructor() {}

  static getInstance(): DeviceIdentificationManager {
    if (!DeviceIdentificationManager.instance) {
      DeviceIdentificationManager.instance = new DeviceIdentificationManager()
    }
    return DeviceIdentificationManager.instance
  }

  /**
   * 获取设备识别信息
   */
  async getDeviceIdentification(): Promise<DeviceIdentification> {
    // 尝试从缓存获取
    if (this.cachedIdentification) {
      return this.cachedIdentification
    }

    // 尝试从本地存储获取
    const cached = this.loadFromStorage()
    if (cached && !this.isExpired(cached)) {
      this.cachedIdentification = cached
      return cached
    }

    // 生成新的设备识别信息
    const identification = await this.generateDeviceIdentification()
    this.saveToStorage(identification)
    this.cachedIdentification = identification
    
    return identification
  }

  /**
   * 生成设备识别信息
   */
  private async generateDeviceIdentification(): Promise<DeviceIdentification> {
    try {
      // 获取系统级设备指纹（用于软件激活）
      const deviceFingerprint = await this.generateSystemFingerprint()
      
      // 获取系统信息
      const systemInfo = await this.getSystemInfo()
      
      const identification: DeviceIdentification = {
        deviceFingerprint,
        deviceUniqueId: '', // 设备连接时动态生成
        systemInfo,
        generatedAt: Date.now()
      }

      console.log('设备识别信息已生成:', {
        fingerprint: deviceFingerprint.substring(0, 8) + '...',
        system: systemInfo
      })

      return identification
    } catch (error) {
      console.error('生成设备识别信息失败:', error)
      return this.generateFallbackIdentification()
    }
  }

  /**
   * 生成系统级设备指纹
   */
  private async generateSystemFingerprint(): Promise<string> {
    try {
      // 优先使用Tauri提供的设备指纹
      const tauriFingerprint = await invoke<string>('get_device_fingerprint')
      if (tauriFingerprint && tauriFingerprint.length > 10) {
        return tauriFingerprint
      }
    } catch (error) {
      console.warn('Tauri设备指纹生成失败，使用备用方案:', error)
    }

    // 备用方案：基于浏览器和系统信息生成
    return this.generateBrowserBasedFingerprint()
  }

  /**
   * 基于浏览器信息生成指纹
   */
  private generateBrowserBasedFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      screen.colorDepth.toString(),
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || '0',
    ]

    // 添加一些随机性以确保唯一性
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 15)
    
    const combined = components.join('|') + '|' + timestamp + '|' + random
    
    // 简单哈希函数
    return this.simpleHash(combined)
  }

  /**
   * 生成设备唯一ID（基于设备序列号和主板信息）
   */
  generateDeviceUniqueId(deviceSerial: string, deviceBoardId?: string): string {
    const combined = deviceBoardId 
      ? `${deviceSerial}_${deviceBoardId}` 
      : deviceSerial
    
    return this.simpleHash(combined).substring(0, 32)
  }

  /**
   * 从设备属性生成设备唯一ID
   */
  generateDeviceUniqueIdFromProperties(properties: DeviceProperties): string {
    const serial = properties.serialNumber || 'unknown'
    const boardId = properties.productBoard || properties.boardPlatform

    return this.generateDeviceUniqueId(serial, boardId)
  }

  /**
   * 获取系统信息
   */
  private async getSystemInfo(): Promise<{ os: string; arch: string; platform: string }> {
    try {
      // 可以通过Tauri API获取更准确的系统信息
      return {
        os: navigator.platform || 'Unknown',
        arch: navigator.userAgent.includes('x64') ? 'x64' : 
              navigator.userAgent.includes('ARM') ? 'arm64' : 'x86',
        platform: this.detectPlatform()
      }
    } catch (error) {
      return {
        os: 'Unknown',
        arch: 'Unknown',
        platform: 'Unknown'
      }
    }
  }

  /**
   * 检测平台类型
   */
  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('windows')) return 'Windows'
    if (userAgent.includes('mac')) return 'macOS'
    if (userAgent.includes('linux')) return 'Linux'
    if (userAgent.includes('android')) return 'Android'
    if (userAgent.includes('ios')) return 'iOS'
    
    return navigator.platform || 'Unknown'
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    // 转换为十六进制并确保长度
    const hex = Math.abs(hash).toString(16)
    return 'device_' + hex.padStart(8, '0') + '_' + Date.now().toString(36)
  }

  /**
   * 生成备用识别信息
   */
  private generateFallbackIdentification(): DeviceIdentification {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    
    return {
      deviceFingerprint: `fallback_${timestamp}_${random}`,
      deviceUniqueId: '',
      systemInfo: {
        os: navigator.platform || 'Unknown',
        arch: 'Unknown',
        platform: 'Unknown'
      },
      generatedAt: timestamp
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): DeviceIdentification | null {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载设备识别信息失败:', error)
    }
    return null
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(identification: DeviceIdentification): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(identification))
    } catch (error) {
      console.error('保存设备识别信息失败:', error)
    }
  }

  /**
   * 检查是否过期
   */
  private isExpired(identification: DeviceIdentification): boolean {
    return Date.now() - identification.generatedAt > this.CACHE_EXPIRY
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedIdentification = null
    localStorage.removeItem(this.CACHE_KEY)
  }

  /**
   * 强制重新生成
   */
  async regenerate(): Promise<DeviceIdentification> {
    this.clearCache()
    return this.getDeviceIdentification()
  }

  /**
   * 获取设备指纹（仅返回指纹字符串）
   */
  async getDeviceFingerprint(): Promise<string> {
    const identification = await this.getDeviceIdentification()
    return identification.deviceFingerprint
  }

  /**
   * 验证设备指纹格式
   */
  isValidFingerprint(fingerprint: string): boolean {
    // 基本格式验证
    return fingerprint && 
           fingerprint.length >= 10 && 
           fingerprint.length <= 100 &&
           /^[a-zA-Z0-9_-]+$/.test(fingerprint)
  }
}

// 导出单例实例
export const deviceIdentificationManager = DeviceIdentificationManager.getInstance()

// 导出便捷函数
export async function getDeviceFingerprint(): Promise<string> {
  return deviceIdentificationManager.getDeviceFingerprint()
}

export function generateDeviceUniqueId(deviceSerial: string, deviceBoardId?: string): string {
  return deviceIdentificationManager.generateDeviceUniqueId(deviceSerial, deviceBoardId)
}

export function generateDeviceUniqueIdFromProperties(properties: DeviceProperties): string {
  return deviceIdentificationManager.generateDeviceUniqueIdFromProperties(properties)
}

export default DeviceIdentificationManager
