/**
 * 用户使用数据追踪服务
 * 根据API使用指南实现用户行为统计功能
 * 仅在用户同意隐私政策后发送数据
 */

import { invoke } from '@tauri-apps/api/core';
import { usePrivacyConsentStore } from '../stores/privacyConsentStore';
import { SecurityConfigManager } from '../config/securityConfig';
import { tauriHttpService } from './tauriHttpService';

// 使用数据接口
interface UsageData {
  softwareId: number;
  softwareName?: string;
  softwareVersion?: string;
  deviceFingerprint: string;
  used: number;
}

// API响应接口
interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// 设备指纹生成接口
interface DetailedDeviceFingerprint {
  fingerprint: string;
  os: string;
  arch: string;
  hostname: string;
  timestamp: number;
}

/**
 * 用户使用数据追踪服务类
 */
export class UsageTrackingService {
  private static instance: UsageTrackingService | null = null;
  private isInitialized = false;
  private sessionId: string;
  private hasTrackedThisSession = false;
  private isTrackingInProgress = false; // 新向：平衡并发请求
  private deviceFingerprint: string | null = null;
  private lastRequestTimes: Map<string, number> = new Map(); // IP级别频率限制

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * 获取服务实例（单例模式）
   */
  public static getInstance(): UsageTrackingService {
    if (!UsageTrackingService.instance) {
      UsageTrackingService.instance = new UsageTrackingService();
    }
    return UsageTrackingService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await this.generateDeviceFingerprint();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
    }
  }

  /**
   * 追踪用户进入工具主页面
   * 每个会话只发送一次
   */
  public async trackMainPageEntry(): Promise<void> {
    try {
      // 检查当前窗口是否为主窗口，避免二次上传
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      const label = getCurrentWebviewWindow().label;
      if (label !== 'main') {
        console.log(`🚫 非主窗口 (${label})，跳过数据统计上传`);
        return;
      }

      console.log('🚀 trackMainPageEntry 方法被调用');

      // 检查是否已初始化
      if (!this.isInitialized) {
        console.log('🔧 服务未初始化，开始初始化...');
        await this.initialize();
      } else {
        console.log('✅ 服务已初始化');
      }

      // 检查本会话是否已经发送过数据
      if (this.hasTrackedThisSession || this.isTrackingInProgress) {
        console.log('📊 数据发送已完成或正在进行中，跳过本次请求');
        return;
      }

      // 检查用户是否同意隐私政策
      const canCollect = this.canCollectData();
      if (!canCollect) {
        console.log('🚫 用户未同意数据收集，跳过使用数据发送');
        return;
      } else {
        console.log('✅ 用户已同意数据收集，继续发送...');
      }

      console.log('📊 开始发送用户使用数据...');

      // 获取安全配置
      const securityConfig = SecurityConfigManager.getInstance();

      // 确保安全配置已初始化
      try {
        await securityConfig.initialize();
        console.log('✅ 安全配置初始化成功');
      } catch (error) {
        console.error('❌ 安全配置初始化失败:', error);
        throw error;
      }

      const config = securityConfig.getConfig();
      console.log('📋 获取到安全配置:', {
        api_base_url: config.api_base_url,
        software_id: config.software_id,
        app_version: config.app_version
      });

      // 准备使用数据
      const usageData: UsageData = {
        softwareId: config.software_id,
        softwareName: '玩机管家',
        softwareVersion: config.app_version,
        deviceFingerprint: this.deviceFingerprint!,
        used: 1
      };

      // 发送数据到API
      console.log('📤 准备发送使用数据:', {
        softwareId: usageData.softwareId,
        softwareName: usageData.softwareName,
        softwareVersion: usageData.softwareVersion,
        deviceFingerprint: usageData.deviceFingerprint.substring(0, 8) + '...',
        used: usageData.used
      });

      this.isTrackingInProgress = true;
      try {
        const success = await this.sendUsageData(usageData);

        if (success) {
          this.hasTrackedThisSession = true;
          console.log('✅ 用户使用数据发送成功，会话状态已更新');
        } else {
          console.warn('⚠️ 用户使用数据发送失败，但不影响应用正常使用');
        }
      } finally {
        this.isTrackingInProgress = false;
      }

    } catch (error) {
      console.error('❌ 追踪主页面进入失败:', error);
      // 不抛出错误，避免影响应用正常功能
    }
  }

  /**
   * 检查是否可以收集数据
   */
  private canCollectData(): boolean {
    const privacyStore = usePrivacyConsentStore.getState();

    // 详细检查每个隐私政策状态
    const privacyStatus = {
      hasCompletedPrivacySetup: privacyStore.hasCompletedPrivacySetup,
      hasAcceptedPrivacyPolicy: privacyStore.hasAcceptedPrivacyPolicy,
      hasAcceptedUserAgreement: privacyStore.hasAcceptedUserAgreement,
      hasAcceptedDataCollection: privacyStore.hasAcceptedDataCollection,
      dataCollectionTypes: privacyStore.dataCollectionTypes,
    };

    // 检查用户是否已完成隐私设置并同意数据收集
    const hasConsent = privacyStore.hasCompletedPrivacySetup &&
                      privacyStore.hasAcceptedPrivacyPolicy &&
                      privacyStore.hasAcceptedUserAgreement &&
                      privacyStore.hasAcceptedDataCollection;

    // 检查是否允许收集用户行为数据
    const canCollectBehavior = privacyStore.canCollectUserBehavior();

    console.log('🔍 详细的数据收集权限检查:', {
      privacyStatus,
      hasConsent,
      canCollectBehavior,
      finalResult: hasConsent && canCollectBehavior
    });

    return hasConsent && canCollectBehavior;
  }

  /**
   * 发送使用数据到API
   */
  private async sendUsageData(data: UsageData): Promise<boolean> {
    try {
      const endpoint = '/api/user-behavior/usage';

      console.log('📤 发送使用数据到端点:', endpoint);
      console.log('📊 使用数据:', {
        softwareId: data.softwareId,
        softwareName: data.softwareName,
        softwareVersion: data.softwareVersion,
        deviceFingerprint: data.deviceFingerprint.substring(0, 8) + '...',
        used: data.used
      });

      // 检查IP级别频率限制（10秒内只能发送一次）
      if (!this.canSendRequest('usage')) {
        console.log('⏰ IP频率限制：10秒内已发送过使用数据请求，跳过本次发送');
        return true; // 返回true避免重复尝试
      }

      // 使用tauriHttpService发送POST请求到用户行为统计API
      const response = await tauriHttpService.post<ApiResponse>(endpoint, data, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.success) {
        throw new Error(response.error || '服务器返回错误');
      }

      console.log('✅ 使用数据发送成功:', response.data?.message || '成功');

      // 记录请求时间用于频率限制
      this.recordRequestTime('usage');

      return true;

    } catch (error) {
      console.error('❌ 发送使用数据失败:', error);
      return false;
    }
  }

  /**
   * 生成设备指纹
   */
  private async generateDeviceFingerprint(): Promise<void> {
    try {
      console.log('🔑 开始生成设备指纹...');
      // 调用Tauri命令获取设备指纹
      const fingerprint: DetailedDeviceFingerprint = await invoke('get_detailed_device_fingerprint');
      this.deviceFingerprint = fingerprint.fingerprint;

      console.log('🔑 设备指纹生成成功:', this.deviceFingerprint.substring(0, 8) + '...');
      console.log('🔑 设备指纹详细信息:', {
        os: fingerprint.os,
        arch: fingerprint.arch,
        hostname: fingerprint.hostname,
        timestamp: fingerprint.timestamp
      });
    } catch (error) {
      console.error('❌ 生成设备指纹失败:', error);
      console.log('🔄 尝试使用备用方案生成设备指纹...');
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
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }



  /**
   * 重置会话状态（用于测试或重新启动）
   */
  public resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.hasTrackedThisSession = false;
    console.log('🔄 会话状态已重置');
  }

  /**
   * 获取当前会话状态
   */
  public getSessionInfo() {
    return {
      sessionId: this.sessionId,
      hasTrackedThisSession: this.hasTrackedThisSession,
      isInitialized: this.isInitialized,
      canCollectData: this.canCollectData()
    };
  }

  /**
   * 检查是否可以发送请求（IP级别频率限制）
   * @param endpoint API端点标识符
   * @returns 是否可以发送请求
   */
  private canSendRequest(endpoint: string): boolean {
    const now = Date.now();
    const lastRequestTime = this.lastRequestTimes.get(endpoint);

    if (!lastRequestTime) {
      return true; // 首次请求
    }

    const timeDiff = now - lastRequestTime;
    const rateLimitMs = 10 * 1000; // 10秒

    return timeDiff >= rateLimitMs;
  }

  /**
   * 记录请求时间
   * @param endpoint API端点标识符
   */
  private recordRequestTime(endpoint: string): void {
    this.lastRequestTimes.set(endpoint, Date.now());
  }
}

// 导出服务实例
export const usageTrackingService = UsageTrackingService.getInstance();
