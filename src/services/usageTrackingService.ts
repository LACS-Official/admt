/**
 * 用户使用数据追踪服务
 * 根据API使用指南实现用户行为统计功能
 * 仅在用户同意隐私政策后发送数据
 */

import { invoke } from '@tauri-apps/api/core';
import { usePrivacyConsentStore } from '../stores/privacyConsentStore';
import { SecurityConfigManager } from '../config/securityConfig';

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
  private deviceFingerprint: string | null = null;

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
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🔧 初始化用户使用数据追踪服务...');
      
      // 生成设备指纹
      await this.generateDeviceFingerprint();
      
      this.isInitialized = true;
      console.log('✅ 用户使用数据追踪服务初始化完成');
    } catch (error) {
      console.error('❌ 用户使用数据追踪服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 追踪用户进入工具主页面
   * 每个会话只发送一次
   */
  public async trackMainPageEntry(): Promise<void> {
    try {
      // 检查是否已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 检查本会话是否已经发送过数据
      if (this.hasTrackedThisSession) {
        console.log('📊 本会话已发送过使用数据，跳过重复发送');
        return;
      }

      // 检查用户是否同意隐私政策
      if (!this.canCollectData()) {
        console.log('🚫 用户未同意数据收集，跳过使用数据发送');
        return;
      }

      console.log('📊 开始发送用户使用数据...');

      // 获取安全配置
      const securityConfig = SecurityConfigManager.getInstance();
      const config = securityConfig.getConfig();

      // 准备使用数据
      const usageData: UsageData = {
        softwareId: config.software_id,
        softwareName: '玩机管家',
        softwareVersion: config.app_version,
        deviceFingerprint: this.deviceFingerprint!,
        used: 1
      };

      // 发送数据到API
      const success = await this.sendUsageData(usageData);

      if (success) {
        this.hasTrackedThisSession = true;
        console.log('✅ 用户使用数据发送成功');
      } else {
        console.warn('⚠️ 用户使用数据发送失败，但不影响应用正常使用');
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
    
    // 检查用户是否已完成隐私设置并同意数据收集
    const hasConsent = privacyStore.hasCompletedPrivacySetup &&
                      privacyStore.hasAcceptedPrivacyPolicy &&
                      privacyStore.hasAcceptedUserAgreement &&
                      privacyStore.hasAcceptedDataCollection;

    // 检查是否允许收集用户行为数据
    const canCollectBehavior = privacyStore.canCollectUserBehavior();

    console.log('🔍 数据收集权限检查:', {
      hasConsent,
      canCollectBehavior,
      canCollect: hasConsent && canCollectBehavior
    });

    return hasConsent && canCollectBehavior;
  }

  /**
   * 发送使用数据到API
   */
  private async sendUsageData(data: UsageData): Promise<boolean> {
    try {
      const securityConfig = SecurityConfigManager.getInstance();
      const config = securityConfig.getConfig();

      const endpoint = '/api/user-behavior/usage';
      const url = `${config.api_base_url}${endpoint}`;

      console.log('📤 发送使用数据到:', url);
      console.log('📊 使用数据:', {
        softwareId: data.softwareId,
        softwareName: data.softwareName,
        softwareVersion: data.softwareVersion,
        deviceFingerprint: data.deviceFingerprint.substring(0, 8) + '...',
        used: data.used
      });

      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': config.api_key,
      };

      // 如果启用严格用户代理验证，添加标准用户代理
      if (config.enable_strict_user_agent) {
        headers['User-Agent'] = `${config.app_id}/${config.app_version}`;
      }

      // 如果启用签名验证，生成请求签名
      if (config.enable_signature) {
        const timestamp = Date.now().toString();
        const signature = await this.generateRequestSignature(data, timestamp, config);
        headers['X-Timestamp'] = timestamp;
        headers['X-Signature'] = signature;
        headers['X-App-ID'] = config.app_id;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000) // 10秒超时
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || '服务器返回错误');
      }

      console.log('✅ 使用数据发送成功:', result.message);
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
    const platform = navigator.platform;
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
   * 生成请求签名
   */
  private async generateRequestSignature(
    data: UsageData,
    timestamp: string,
    config: any
  ): Promise<string> {
    try {
      // 构建签名字符串
      const signatureData = {
        method: 'POST',
        endpoint: '/api/user-behavior/usage',
        timestamp,
        app_id: config.app_id,
        data: JSON.stringify(data)
      };

      // 按字母顺序排序并构建签名字符串
      const sortedKeys = Object.keys(signatureData).sort();
      const signatureString = sortedKeys
        .map(key => `${key}=${signatureData[key as keyof typeof signatureData]}`)
        .join('&');

      // 添加签名密钥
      const stringToSign = `${signatureString}&secret=${config.signature_secret}`;

      console.log('🔐 生成签名字符串:', stringToSign.substring(0, 100) + '...');

      // 使用简单哈希算法生成签名（生产环境应使用 HMAC-SHA256）
      const signature = this.simpleHash(stringToSign);

      console.log('🔐 生成签名:', signature.substring(0, 16) + '...');
      return signature;

    } catch (error) {
      console.error('❌ 生成请求签名失败:', error);
      // 返回一个默认签名，避免请求失败
      return this.simpleHash(`${timestamp}_${config.app_id}_fallback`);
    }
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
}

// 导出服务实例
export const usageTrackingService = UsageTrackingService.getInstance();
