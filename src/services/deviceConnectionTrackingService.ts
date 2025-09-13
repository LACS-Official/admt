/**
 * 设备连接追踪服务
 * 根据API使用指南实现设备连接统计功能
 * 无需API Key认证，实现IP级别频率限制
 */

import { invoke } from '@tauri-apps/api/core';
import { usePrivacyConsentStore } from '../stores/privacyConsentStore';
import { SecurityConfigManager } from '../config/securityConfig';
import { tauriHttpService } from './tauriHttpService';

// 设备连接数据接口
interface DeviceConnectionData {
  deviceSerial: string;
  softwareId: number;
  userDeviceFingerprint: string;
  deviceBrand?: string;
  deviceModel?: string;
  osVersion?: string;
}

// API响应接口
interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// 设备指纹接口
interface DetailedDeviceFingerprint {
  fingerprint: string;
  os: string;
  arch: string;
  hostname: string;
  timestamp: number;
}

/**
 * 设备连接追踪服务类
 */
export class DeviceConnectionTrackingService {
  private static instance: DeviceConnectionTrackingService | null = null;
  private isInitialized = false;
  private deviceFingerprint: string | null = null;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_INTERVAL = 10000; // 10秒频率限制

  private constructor() {}

  /**
   * 获取服务实例（单例模式）
   */
  public static getInstance(): DeviceConnectionTrackingService {
    if (!DeviceConnectionTrackingService.instance) {
      DeviceConnectionTrackingService.instance = new DeviceConnectionTrackingService();
    }
    return DeviceConnectionTrackingService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔧 初始化设备连接追踪服务...');
      
      // 生成设备指纹
      await this.generateDeviceFingerprint();
      
      this.isInitialized = true;
      console.log('✅ 设备连接追踪服务初始化完成');
    } catch (error) {
      console.error('❌ 设备连接追踪服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 记录设备连接
   */
  public async recordDeviceConnection(connectionData: Omit<DeviceConnectionData, 'userDeviceFingerprint' | 'softwareId'>): Promise<void> {
    try {
      // 检查是否已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 检查用户是否同意隐私政策
      if (!this.canCollectData()) {
        console.log('🚫 用户未同意数据收集，跳过设备连接记录');
        return;
      }

      // 检查频率限制
      if (!this.checkRateLimit()) {
        console.log('⏰ 频率限制：距离上次请求不足10秒，跳过设备连接记录');
        return;
      }

      console.log('📊 开始记录设备连接...', connectionData.deviceSerial);

      // 获取安全配置
      const securityConfig = SecurityConfigManager.getInstance();
      const config = securityConfig.getConfig();

      // 准备连接数据
      const fullConnectionData: DeviceConnectionData = {
        ...connectionData,
        softwareId: config.software_id,
        userDeviceFingerprint: this.deviceFingerprint!,
      };

      // 发送数据到API
      const success = await this.sendConnectionData(fullConnectionData);

      if (success) {
        this.lastRequestTime = Date.now();
        console.log('✅ 设备连接记录发送成功');
      } else {
        console.warn('⚠️ 设备连接记录发送失败，但不影响应用正常使用');
      }

    } catch (error) {
      console.error('❌ 记录设备连接失败:', error);
      // 不抛出错误，避免影响应用正常功能
    }
  }

  /**
   * 检查是否可以收集数据
   */
  private canCollectData(): boolean {
    const privacyStore = usePrivacyConsentStore.getState();
    
    // 检查用户是否已完成隐私设置并同意数据收集
    const hasConsent = privacyStore.hasCompletedPrivacySetup &&
                      privacyStore.hasAcceptedPrivacyPolicy &&
                      privacyStore.hasAcceptedUserAgreement &&
                      privacyStore.hasAcceptedDataCollection;

    // 检查是否允许收集设备数据
    const canCollectDevice = privacyStore.canCollectDeviceData();

    console.log('🔍 设备连接数据收集权限检查:', {
      hasConsent,
      canCollectDevice,
      canCollect: hasConsent && canCollectDevice
    });

    return hasConsent && canCollectDevice;
  }

  /**
   * 检查频率限制
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    console.log('⏰ 频率限制检查:', {
      timeSinceLastRequest,
      rateLimit: this.RATE_LIMIT_INTERVAL,
      canSend: timeSinceLastRequest >= this.RATE_LIMIT_INTERVAL
    });

    return timeSinceLastRequest >= this.RATE_LIMIT_INTERVAL;
  }

  /**
   * 发送连接数据到API
   */
  private async sendConnectionData(data: DeviceConnectionData): Promise<boolean> {
    try {
      const endpoint = '/api/user-behavior/device-connections';
      
      // 环境检测和调试信息
      const isDev = import.meta.env.DEV;
      const environment = isDev ? 'development' : 'production';
      
      console.log(`🚀 [设备连接统计] 环境: ${environment}, 请求: POST ${endpoint}`);

      // 根据API文档，只发送必需的字段
      const apiData = {
        deviceSerial: data.deviceSerial,
        softwareId: data.softwareId,
        userDeviceFingerprint: data.userDeviceFingerprint
      };

      console.log('📤 发送设备连接数据到端点:', endpoint);
      console.log('📊 连接数据:', {
        deviceSerial: apiData.deviceSerial,
        softwareId: apiData.softwareId,
        userDeviceFingerprint: apiData.userDeviceFingerprint.substring(0, 8) + '...'
      });

      // 准备请求头
      const extraHeaders: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-App-Environment': environment,
      };
      
      // 在生产环境中添加额外的头部
      if (!isDev) {
        extraHeaders['X-Build-Type'] = 'production';
      }
      
      // 使用tauriHttpService发送POST请求到设备连接统计API
      const response = await tauriHttpService.post<ApiResponse>(endpoint, apiData, {
        timeout: 10000,
        headers: extraHeaders
      });

      if (!response.success) {
        if (response.error?.includes('429')) {
          // 处理频率限制错误
          console.warn(`⏰ 服务器频率限制，建议等待10秒后重试`);
        }
        throw new Error(response.error || '服务器返回错误');
      }

      console.log(`✅ [设备连接统计] 请求成功`);
      console.log('✅ 设备连接数据发送成功:', response.data?.message || '成功');
      return true;

    } catch (error) {
      console.error('❌ 发送设备连接数据失败:', error);
      return false;
    }
  }

  /**
   * 生成设备指纹
   */
  private async generateDeviceFingerprint(): Promise<void> {
    try {
      // 调用Tauri命令获取设备指纹
      const fingerprint: DetailedDeviceFingerprint = await invoke('get_detailed_device_fingerprint');
      this.deviceFingerprint = fingerprint.fingerprint;
      
      console.log('🔑 设备指纹生成成功:', this.deviceFingerprint.substring(0, 8) + '...');
    } catch (error) {
      console.error('❌ 生成设备指纹失败:', error);
      // 使用备用方案生成简单指纹
      this.deviceFingerprint = this.generateFallbackFingerprint();
      console.log('🔑 使用备用设备指纹:', this.deviceFingerprint.substring(0, 8) + '...');
    }
  }

  /**
   * 生成备用设备指纹
   */
  private generateFallbackFingerprint(): string {
    const userAgent = navigator.userAgent;
    const platform = (navigator as any).userAgentData?.platform || 'unknown';
    const language = navigator.language;
    const timestamp = Date.now();
    
    const data = `${userAgent}-${platform}-${language}-${timestamp}`;
    return this.simpleHash(data);
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取服务状态
   */
  public getServiceInfo() {
    return {
      isInitialized: this.isInitialized,
      hasDeviceFingerprint: !!this.deviceFingerprint,
      lastRequestTime: this.lastRequestTime,
      canCollectData: this.canCollectData(),
      rateLimitRemaining: Math.max(0, this.RATE_LIMIT_INTERVAL - (Date.now() - this.lastRequestTime))
    };
  }

  /**
   * 重置频率限制（用于测试）
   */
  public resetRateLimit(): void {
    this.lastRequestTime = 0;
    console.log('🔄 频率限制已重置');
  }
}

// 导出服务实例
export const deviceConnectionTrackingService = DeviceConnectionTrackingService.getInstance();
