/**
 * 优化后的用户行为统计服务
 * 专为存储空间限制优化，简化数据结构
 */

import { invoke } from '@tauri-apps/api/core';
import { DeviceStatsRequest, DeviceStatsResponse } from '../types/optimizedDeviceStats';
import { usePrivacyConsentStore } from '../stores/privacyConsentStore';

export interface OptimizedUserBehaviorConfig {
  apiBaseUrl: string;
  apiKey: string;
  enableEncryption: boolean;
  enableOfflineCache: boolean;
  maxRetryCount: number;
}

export interface DeviceInfo {
  fingerprint: string;
  osVersion: string;
  arch: string;
}

export class OptimizedUserBehaviorService {
  private static instance: OptimizedUserBehaviorService | null = null;
  private config: OptimizedUserBehaviorConfig;
  private deviceInfo: DeviceInfo | null = null;
  private isInitialized = false;

  constructor(config: OptimizedUserBehaviorConfig) {
    this.config = config;
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: OptimizedUserBehaviorConfig): OptimizedUserBehaviorService {
    if (!OptimizedUserBehaviorService.instance) {
      OptimizedUserBehaviorService.instance = new OptimizedUserBehaviorService(
        config || DEFAULT_OPTIMIZED_CONFIG
      );
    }
    return OptimizedUserBehaviorService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 获取设备信息
      this.deviceInfo = await this.getDeviceInfo();
      this.isInitialized = true;
      
      console.log('优化用户行为服务初始化成功');
    } catch (error) {
      console.error('优化用户行为服务初始化失败:', error);
      throw error;
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

    if (!privacyStore.canCollectUserBehavior()) {
      console.log('🚫 用户未同意用户行为数据收集，跳过行为数据上传');
      return false;
    }

    return true;
  }

  /**
   * 记录应用启动
   */
  async recordAppLaunch(): Promise<void> {
    // 首先检查隐私政策同意状态
    if (!this.checkPrivacyConsent()) {
      console.log('🚫 隐私政策检查失败，跳过应用启动记录');
      return;
    }

    if (!this.isInitialized || !this.deviceInfo) {
      console.warn('服务未初始化，跳过应用启动记录');
      return;
    }

    try {
      const request: DeviceStatsRequest = {
        deviceFingerprint: this.deviceInfo.fingerprint,
        osVersion: this.deviceInfo.osVersion,
        arch: this.deviceInfo.arch,
      };

      // 修复 API 端点和请求方法
      const response = await this.sendRequest('/api/user-behavior/device-stats', 'POST', request);

      if (response.success) {
        console.log(`✅ 应用启动记录成功 - 安装排名: #${response.installRank}, 运行次数: ${response.runCount}`);

        if (response.isNewDevice) {
          console.log('🎉 新设备首次启动！');
        }
      }
    } catch (error) {
      console.warn('⚠️ 记录应用启动失败，但不影响应用正常使用:', error);
    }
  }

  /**
   * 获取设备信息
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      // 从Tauri后端获取设备指纹
      const fingerprint = await invoke<string>('get_device_fingerprint');
      
      // 获取系统信息
      const osInfo = await this.getOSInfo();
      const archInfo = await this.getArchInfo();

      return {
        fingerprint,
        osVersion: osInfo,
        arch: archInfo,
      };
    } catch (error) {
      console.error('获取设备信息失败:', error);
      throw new Error('无法获取设备信息');
    }
  }

  /**
   * 获取操作系统信息
   */
  private async getOSInfo(): Promise<string> {
    try {
      // 可以通过Tauri API获取系统信息
      const platform = await invoke<string>('get_platform_info');
      return platform || 'unknown';
    } catch (error) {
      console.error('获取操作系统信息失败:', error);
      return 'unknown';
    }
  }

  /**
   * 获取系统架构信息
   */
  private async getArchInfo(): Promise<string> {
    try {
      const arch = await invoke<string>('get_system_arch');
      return arch || 'unknown';
    } catch (error) {
      console.error('获取系统架构信息失败:', error);
      return 'unknown';
    }
  }

  /**
   * 发送HTTP请求
   */
  private async sendRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'POST',
    data?: any
  ): Promise<any> {
    // 始终使用配置的后端 API，避免在开发环境将请求发到前端 dev server 导致 405
    const baseUrl = this.config.apiBaseUrl?.replace(/\/$/, '') || '';
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${path}`;
    
    // 环境检测和调试信息
    const isDev = import.meta.env.DEV;
    const environment = isDev ? 'development' : 'production';
    
    console.log(`🚀 [用户行为统计] 环境: ${environment}, 请求: ${method} ${url}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'User-Agent': 'WanjiGuanjia-Desktop/1.0.0',
      'X-App-Environment': environment,
    };
    
    // 在生产环境中添加额外的安全头
    if (!isDev) {
      headers['X-Build-Type'] = 'production';
      if (this.config.enableEncryption) {
        headers['X-Signature-Required'] = 'true';
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      ...(data && { body: JSON.stringify(data) }),
    };

    let lastError: Error | null = null;
    
    // 重试机制
    for (let attempt = 1; attempt <= this.config.maxRetryCount; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        console.log(`🚀 [用户行为统计] 响应: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ [用户行为统计] 请求成功: ${method} ${url}`);
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [用户行为统计] 请求失败 (第${attempt}次尝试): ${error}`);
        
        // 只在最后一次尝试时输出错误日志，减少控制台噪音
        if (attempt === this.config.maxRetryCount) {
          console.error(`❌ [用户行为统计] 用户行为统计请求失败 (已尝试 ${this.config.maxRetryCount} 次):`, error);
        }

        if (attempt < this.config.maxRetryCount) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError || new Error('请求失败');
  }

  /**
   * 获取统计概览
   */
  async getStatsOverview(): Promise<any> {
    try {
      const response = await this.sendRequest('/api/user-behavior/stats/overview', 'GET');
      return response.data;
    } catch (error) {
      console.error('获取统计概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取国家统计
   */
  async getCountryStats(limit: number = 10): Promise<any> {
    try {
      const response = await this.sendRequest(`/api/user-behavior/stats/countries?limit=${limit}`, 'GET');
      return response.data;
    } catch (error) {
      console.error('获取国家统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取活动趋势
   */
  async getActivityTrends(days: number = 30): Promise<any> {
    try {
      const response = await this.sendRequest(`/api/user-behavior/stats/trends?days=${days}`, 'GET');
      return response.data;
    } catch (error) {
      console.error('获取活动趋势失败:', error);
      throw error;
    }
  }

  /**
   * 检查服务状态
   */
  isServiceReady(): boolean {
    return this.isInitialized && this.deviceInfo !== null;
  }

  /**
   * 获取设备指纹
   */
  getDeviceFingerprint(): string | null {
    return this.deviceInfo?.fingerprint || null;
  }

  /**
   * 获取配置信息
   */
  getConfig(): OptimizedUserBehaviorConfig {
    return { ...this.config };
  }
}

// 创建默认实例
export const createOptimizedUserBehaviorService = (config: OptimizedUserBehaviorConfig) => {
  return new OptimizedUserBehaviorService(config);
};

// 默认配置
export const DEFAULT_OPTIMIZED_CONFIG: OptimizedUserBehaviorConfig = {
  apiBaseUrl: 'https://api-g.lacs.cc',
  apiKey: import.meta.env.VITE_API_KEY || 'your-api-key',
  enableEncryption: import.meta.env.VITE_ENABLE_SIGNATURE === 'true',
  enableOfflineCache: false,
  maxRetryCount: 3,
};
