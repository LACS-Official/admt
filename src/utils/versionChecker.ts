import { invoke } from '@tauri-apps/api/core';
import { compare } from 'semver';

interface VersionInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
}

interface ApiResponse {
  success: boolean;
  data: VersionInfo;
  message?: string;
}

class VersionChecker {
  private static instance: VersionChecker;
  private cache: Map<string, { data: VersionInfo; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): VersionChecker {
    if (!VersionChecker.instance) {
      VersionChecker.instance = new VersionChecker();
    }
    return VersionChecker.instance;
  }

  private getApiConfig() {
    const isDev = import.meta.env.DEV;
    const baseUrl = isDev 
      ? 'http://localhost:3001/api' 
      : 'https://api.admt.app/v1';
    
    return {
      baseUrl,
      endpoints: {
        version: `${baseUrl}/version/check`,
        announcement: `${baseUrl}/announcement/latest`
      }
    };
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      // 从Tauri获取当前应用版本
      const version = await invoke<string>('get_app_version');
      return version;
    } catch (error) {
      console.error('获取当前版本失败:', error);
      // 降级到package.json版本
      return '1.0.0';
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
      return compare(current, latest);
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `ADMT/${await this.getCurrentVersion()}`
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

  async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    versionInfo?: VersionInfo;
    error?: string;
  }> {
    try {
      const config = this.getApiConfig();
      const cacheKey = this.getCacheKey('version');
      
      // 检查缓存
      if (this.isValidCache(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        const currentVersion = await this.getCurrentVersion();
        const comparison = this.compareVersions(currentVersion, cached.data.version);
        
        return {
          hasUpdate: comparison < 0,
          currentVersion,
          latestVersion: cached.data.version,
          versionInfo: cached.data
        };
      }

      // 获取当前版本
      const currentVersion = await this.getCurrentVersion();
      console.log(`当前版本: ${currentVersion}`);

      // 调用版本检查API
      const response = await this.fetchWithRetry(config.endpoints.version);
      const apiResponse: ApiResponse = await response.json();

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

      console.log(`版本比较结果: ${currentVersion} vs ${versionInfo.version} = ${comparison} (hasUpdate: ${hasUpdate})`);

      return {
        hasUpdate,
        currentVersion,
        latestVersion: versionInfo.version,
        versionInfo
      };

    } catch (error) {
      const currentVersion = await this.getCurrentVersion();
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      console.error('版本检查失败:', errorMessage);
      
      return {
        hasUpdate: false,
        currentVersion,
        error: errorMessage
      };
    }
  }

  async getAnnouncements(): Promise<any[]> {
    try {
      const config = this.getApiConfig();
      const cacheKey = this.getCacheKey('announcement');

      // 检查缓存
      if (this.isValidCache(cacheKey)) {
        return this.cache.get(cacheKey)!.data as any;
      }

      const response = await this.fetchWithRetry(config.endpoints.announcement);
      const apiResponse = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.message || '获取公告失败');
      }

      // 更新缓存
      this.cache.set(cacheKey, {
        data: apiResponse.data,
        timestamp: Date.now()
      });

      return apiResponse.data;
    } catch (error) {
      console.error('获取公告失败:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default VersionChecker.getInstance();