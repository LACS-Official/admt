import { invoke } from '@tauri-apps/api/core';
import { API_CONFIG, getApiBaseUrl, getSoftwareId } from '../config/api';

export interface VersionInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  publishedAt: string;
}

export interface VersionCheckResult {
  hasUpdate: boolean;
  needsUpdate: boolean; // 兼容现有接口
  isForceUpdate: boolean; // 兼容现有接口
  currentVersion: string;
  latestVersion?: string;
  versionInfo?: VersionInfo;
  error?: string;
  message: string; // 必需字段，与types/app.ts保持一致
}

export interface ApiVersionResponse {
  success: boolean;
  data: {
    version: string;
    downloadUrl: string;
    releaseNotes: string;
    forceUpdate: boolean;
    publishedAt: string;
  };
  message?: string;
}

class VersionService {
  private static instance: VersionService;
  private cache: Map<string, { data: VersionInfo; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService();
    }
    return VersionService.instance;
  }

  private getApiConfig() {
    const isDev = import.meta.env.DEV;
    const baseUrl = getApiBaseUrl();
    const softwareId = getSoftwareId();
    
    // 验证配置完整性
    if (!baseUrl || baseUrl.includes('example.com')) {
      throw new Error('Invalid API base URL configuration');
    }
    
    if (softwareId <= 0) {
      throw new Error('Invalid software ID configuration');
    }
    
    console.log(`🔧 版本检查API配置:`, {
      isDev,
      baseUrl,
      mode: import.meta.env.MODE,
      softwareId,
      envVars: {
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'undefined',
        VITE_SOFTWARE_ID: import.meta.env.VITE_SOFTWARE_ID || 'undefined'
      }
    });
    
    return {
      baseUrl,
      softwareId,
      endpoints: {
        version: `${baseUrl}/app/software/id/${softwareId}/versions/latest`,
        announcement: `${baseUrl}/app/software/id/${softwareId}/announcements`
      }
    };
  }

  /**
   * 获取当前应用版本号 - 公共方法
   * 统一的版本获取逻辑，供所有组件使用
   */
  async getCurrentAppVersion(): Promise<string> {
    return this.getCurrentVersion();
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      // 统一版本获取逻辑：开发版和发行版都优先从Tauri获取
      const version = await invoke<string>('get_app_version');
      console.log(`📱 从Tauri获取当前版本: ${version}`);
      return version;
    } catch (error) {
      console.warn('从Tauri获取版本失败，尝试环境变量:', error);
      
      // 第二优先级：从环境变量获取
      const envVersion = import.meta.env.VITE_APP_VERSION;
      if (envVersion && envVersion !== 'undefined') {
        console.log(`📱 从环境变量获取版本: ${envVersion}`);
        return envVersion;
      }
      
      // 最后降级到配置版本
      console.warn('使用默认配置版本:', API_CONFIG.APP_VERSION);
      return API_CONFIG.APP_VERSION;
    }
  }

  private isValidVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  private compareVersions(current: string, latest: string): number {
    try {
      if (!this.isValidVersion(current) || !this.isValidVersion(latest)) {
        throw new Error(`无效的版本格式: current=${current}, latest=${latest}`);
      }

      // 简单的版本比较实现
      const currentParts = current.split('.').map(Number);
      const latestParts = latest.split('.').map(Number);

      for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (currentPart < latestPart) return -1;
        if (currentPart > latestPart) return 1;
      }

      return 0;
    } catch (error) {
      console.error('版本比较失败:', error);
      return 0; // 相等，避免误报更新
    }
  }

  private getCacheKey(endpoint: string): string {
    const env = import.meta.env.DEV ? 'dev' : 'prod';
    return `${env}_${endpoint}`;
  }

  private isValidCache(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.CACHE_DURATION;
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const currentVersion = await this.getCurrentVersion();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `ADMT/${currentVersion}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        console.warn(`API请求失败 (尝试 ${i + 1}/${retries}):`, error);
        if (i === retries - 1) throw error;
        
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    throw new Error('所有重试均失败');
  }

  async checkForUpdates(): Promise<VersionCheckResult> {
    try {
      // 首先验证配置
      let config;
      try {
        config = this.getApiConfig();
      } catch (configError) {
        console.error('❌ 版本检查配置验证失败:', configError);
        const currentVersion = await this.getCurrentVersion();
        return {
          hasUpdate: false,
          needsUpdate: false,
          isForceUpdate: false,
          currentVersion,
          error: `配置错误: ${configError instanceof Error ? configError.message : '未知配置错误'}`,
          message: '版本检查配置无效，请检查环境变量设置'
        };
      }
      
      const cacheKey = this.getCacheKey('version');
      
      console.log(`🔍 开始版本检查...`);
      console.log(`📡 API端点: ${config.endpoints.version}`);
      console.log(`🆔 软件ID: ${config.softwareId}`);
      
      // 检查缓存
      if (this.isValidCache(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        const currentVersion = await this.getCurrentVersion();
        const comparison = this.compareVersions(currentVersion, cached.data.version);
        
        console.log(`💾 使用缓存数据: ${currentVersion} vs ${cached.data.version} = ${comparison}`);
        
        const hasUpdate = comparison < 0;
        return {
          hasUpdate,
          needsUpdate: hasUpdate,
          isForceUpdate: cached.data.forceUpdate || false,
          currentVersion,
          latestVersion: cached.data.version,
          versionInfo: cached.data,
          message: hasUpdate ? `发现新版本 ${cached.data.version}` : '当前已是最新版本'
        };
      }

      // 获取当前版本
      const currentVersion = await this.getCurrentVersion();
      console.log(`📱 当前版本: ${currentVersion}`);

      // 调用版本检查API
      console.log(`🌐 调用版本检查API...`);
      const response = await this.fetchWithRetry(config.endpoints.version);
      const apiResponse: ApiVersionResponse = await response.json();

      console.log(`📥 API响应:`, apiResponse);

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.message || 'API响应格式错误');
      }

      const { data: versionInfo } = apiResponse;
      
      // 验证版本格式
      if (!this.isValidVersion(versionInfo.version)) {
        throw new Error(`API返回的版本格式无效: ${versionInfo.version}`);
      }

      // 更新缓存
      this.cache.set(cacheKey, {
        data: versionInfo,
        timestamp: Date.now()
      });

      // 版本比较
      const comparison = this.compareVersions(currentVersion, versionInfo.version);
      const hasUpdate = comparison < 0;

      console.log(`🔄 版本比较结果: ${currentVersion} vs ${versionInfo.version} = ${comparison} (hasUpdate: ${hasUpdate})`);

      return {
        hasUpdate,
        needsUpdate: hasUpdate,
        isForceUpdate: versionInfo.forceUpdate || false,
        currentVersion,
        latestVersion: versionInfo.version,
        versionInfo,
        message: hasUpdate ? `发现新版本 ${versionInfo.version}` : '当前已是最新版本'
      };

    } catch (error) {
      const currentVersion = await this.getCurrentVersion();
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      console.error('❌ 版本检查失败:', errorMessage);
      
      return {
        hasUpdate: false,
        needsUpdate: false,
        isForceUpdate: false,
        currentVersion,
        error: errorMessage,
        message: `版本检查失败: ${errorMessage}`
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 版本检查缓存已清空');
  }

  // 获取版本检查状态信息
  getStatus() {
    return {
      cacheSize: this.cache.size,
      apiConfig: this.getApiConfig(),
      environment: {
        isDev: import.meta.env.DEV,
        mode: import.meta.env.MODE,
        baseUrl: getApiBaseUrl()
      }
    };
  }
}

export const versionService = VersionService.getInstance();

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).versionService = versionService;
}