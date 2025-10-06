/**
 * 统一版本检测服务
 * 解决开发板和发布版版本检测不一致问题
 */

import { invoke } from '@tauri-apps/api/core';
import { API_CONFIG, getApiBaseUrl, getSoftwareId } from '../config/api';
import { tauriHttpService } from './tauriHttpService';

export interface VersionInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
  publishedAt: string;
}

export interface VersionCheckResult {
  hasUpdate: boolean;
  needsUpdate: boolean;
  isForceUpdate: boolean;
  currentVersion: string;
  localVersion: string;
  latestVersion?: string;
  versionInfo?: VersionInfo;
  error?: string;
  message: string;
}

export interface VersionSyncStatus {
  isSync: boolean;
  issues: string[];
  sources: {
    tauri?: string;
    env?: string;
    config?: string;
  };
}

export interface ApiVersionResponse {
  success: boolean;
  data: Array<{
    id: number;
    version: string;
    releaseDate: string;
    releaseNotes: string;
    downloadLinks: {
      official: string;
    };
    isStable: boolean;
    versionType: string;
  }>;
  meta: {
    software: {
      currentVersion: string;
      officialWebsite: string;
    };
  };
  message?: string;
}

/**
 * 版本检测监控类
 */
class VersionCheckMonitor {
  private static logs: Array<{
    timestamp: string;
    event: string;
    data: any;
    environment: string;
  }> = [];

  static log(event: string, data: any) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      event,
      data,
      environment: import.meta.env.MODE
    });

    // 开发环境输出详细日志
    if (import.meta.env.DEV) {
      console.log(`📊 版本检测监控 [${event}]:`, data);
    }

    // 保持最近100条记录
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  static getLogs() {
    return this.logs;
  }

  static exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  static clear() {
    this.logs = [];
  }
}

/**
 * 统一版本检测服务类
 */
class UnifiedVersionService {
  private static instance: UnifiedVersionService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): UnifiedVersionService {
    if (!UnifiedVersionService.instance) {
      UnifiedVersionService.instance = new UnifiedVersionService();
    }
    return UnifiedVersionService.instance;
  }

  /**
   * 验证版本格式
   */
  private isValidVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  /**
   * 统一版本获取逻辑 - 解决版本不一致问题
   */
  async getCurrentVersion(): Promise<string> {
    VersionCheckMonitor.log('getCurrentVersion_start', {
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV
    });

    const sources = [
      {
        name: 'tauri',
        getter: async () => {
          try {
            const version = await invoke<string>('get_app_version');
            VersionCheckMonitor.log('tauri_version_success', { version });
            return version;
          } catch (error) {
            VersionCheckMonitor.log('tauri_version_error', { error: error instanceof Error ? error.message : error });
            throw error;
          }
        }
      },
      {
        name: 'config',
        getter: async () => {
          const version = API_CONFIG.APP_VERSION;
          VersionCheckMonitor.log('config_version_fallback', { version });
          return version;
        }
      }
    ];

    for (const source of sources) {
      try {
        const version = await source.getter();
        if (this.isValidVersion(version)) {
          VersionCheckMonitor.log('version_source_selected', {
            source: source.name,
            version
          });
          return version;
        } else {
          VersionCheckMonitor.log('version_format_invalid', {
            source: source.name,
            version
          });
        }
      } catch (error) {
        VersionCheckMonitor.log('version_source_failed', {
          source: source.name,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    throw new Error('无法获取有效版本号');
  }

  /**
   * 检查版本同步状态
   */
  async checkVersionSync(): Promise<VersionSyncStatus> {
    const issues: string[] = [];
    const sources: VersionSyncStatus['sources'] = {};

    try {
      // 获取Tauri版本
      try {
        sources.tauri = await invoke<string>('get_app_version');
      } catch (error) {
        issues.push(`Tauri版本获取失败: ${error instanceof Error ? error.message : error}`);
      }

      // 获取环境变量版本
      const envVersion = import.meta.env.VITE_APP_VERSION;
      if (envVersion && envVersion !== 'undefined') {
        sources.env = envVersion;
      } else {
        issues.push('环境变量VITE_APP_VERSION未定义或为空');
      }

      // 获取配置版本
      sources.config = API_CONFIG.APP_VERSION;

      // 检查版本一致性
      const validVersions = Object.values(sources).filter(v => v && this.isValidVersion(v));
      const uniqueVersions = new Set(validVersions);

      if (uniqueVersions.size > 1) {
        issues.push(`版本不一致: ${JSON.stringify(sources)}`);
      }

      // 检查版本格式
      for (const [sourceName, version] of Object.entries(sources)) {
        if (version && !this.isValidVersion(version)) {
          issues.push(`${sourceName} 版本格式无效: ${version}`);
        }
      }

      VersionCheckMonitor.log('version_sync_check', {
        sources,
        issues,
        isSync: issues.length === 0
      });

      return {
        isSync: issues.length === 0,
        issues,
        sources
      };
    } catch (error) {
      const errorMsg = `版本同步检查失败: ${error instanceof Error ? error.message : error}`;
      issues.push(errorMsg);
      VersionCheckMonitor.log('version_sync_check_error', { error: errorMsg });
      
      return { isSync: false, issues, sources };
    }
  }

  /**
   * 版本比较
   */
  private compareVersions(current: string, latest: string): number {
    try {
      if (!this.isValidVersion(current) || !this.isValidVersion(latest)) {
        throw new Error(`无效的版本格式: current=${current}, latest=${latest}`);
      }

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
      VersionCheckMonitor.log('version_compare_error', { current, latest, error });
      return 0; // 相等，避免误报更新
    }
  }

  /**
   * 增强的API请求方法 - 使用tauriHttpService
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<any> {
    const isDev = import.meta.env.DEV;
    
    for (let i = 0; i < retries; i++) {
      try {
        const currentVersion = await this.getCurrentVersion();
        
        const timeout = isDev ? 15000 : 10000; // 开发环境更长超时
        
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': `ADMT/${currentVersion}`
        };

        // 生产环境添加签名（如果配置了）
        if (!isDev && API_CONFIG.ENABLE_SIGNATURE && API_CONFIG.SIGNATURE_SECRET) {
          // 这里可以添加签名逻辑
          headers['X-Signature'] = 'signature_placeholder';
        }

        VersionCheckMonitor.log('api_request_start', {
          url,
          attempt: i + 1,
          timeout,
          headers: Object.keys(headers)
        });
        
        // 使用 tauriHttpService 替代原生 fetch
        const response = await tauriHttpService.get<ApiVersionResponse>(url, {
          timeout,
          headers
        });
        
        VersionCheckMonitor.log('api_request_success', {
          url,
          success: response.success,
          attempt: i + 1
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'API请求失败');
        }

        return response.data;
      } catch (error) {
        const isLastRetry = i === retries - 1;
        VersionCheckMonitor.log('api_request_failed', {
          url,
          attempt: i + 1,
          error: error instanceof Error ? error.message : error,
          isLastRetry
        });
        
        if (isLastRetry) throw error;
        
        // 指数退避，但生产环境退避时间更短
        const backoffTime = Math.pow(2, i) * (isDev ? 1000 : 500);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    throw new Error('所有重试均失败');
  }

  /**
   * 统一版本检查方法
   */
  async checkForUpdates(): Promise<VersionCheckResult> {
    VersionCheckMonitor.log('check_for_updates_start', {
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV
    });

    try {
      // 首先检查版本同步状态
      const syncStatus = await this.checkVersionSync();
      if (!syncStatus.isSync) {
        VersionCheckMonitor.log('version_sync_issues', syncStatus);
        // 继续执行，但记录问题
      }

      // 获取API配置
      const baseUrl = getApiBaseUrl();
      const softwareId = getSoftwareId();
      
      if (!baseUrl || baseUrl.includes('example.com')) {
        throw new Error('Invalid API base URL configuration');
      }
      
      if (softwareId <= 0) {
        throw new Error('Invalid software ID configuration');
      }

      const apiUrl = `${baseUrl}/app/software/id/${softwareId}/versions`;
      
      VersionCheckMonitor.log('api_config', {
        baseUrl,
        softwareId,
        apiUrl
      });

      // 获取当前版本
      const currentVersion = await this.getCurrentVersion();
      VersionCheckMonitor.log('current_version_obtained', { currentVersion });

      // 调用版本检查API
      const apiResponse: ApiVersionResponse = await this.fetchWithRetry(apiUrl);

      VersionCheckMonitor.log('api_response_received', {
        success: apiResponse.success,
        dataLength: apiResponse.data?.length || 0,
        hasMetaSoftware: !!apiResponse.meta?.software
      });

      if (!apiResponse.success || !apiResponse.data || !Array.isArray(apiResponse.data)) {
        throw new Error(apiResponse.message || 'API响应格式错误');
      }

      const { data: versions, meta } = apiResponse;
      
      // 处理版本数据
      let latestVersion: string;
      let versionInfo: VersionInfo;

      if (versions.length === 0) {
        // 使用meta中的版本信息
        latestVersion = meta?.software?.currentVersion;
        if (!latestVersion) {
          throw new Error('API未返回版本信息');
        }
        
        versionInfo = {
          version: latestVersion,
          downloadUrl: meta.software.officialWebsite || '',
          releaseNotes: '当前版本',
          forceUpdate: false,
          publishedAt: new Date().toISOString()
        };
      } else {
        // 使用最新版本数据
        const latestVersionData = versions[0];
        latestVersion = latestVersionData.version;
        
        versionInfo = {
          version: latestVersion,
          downloadUrl: latestVersionData.downloadLinks?.official || meta?.software?.officialWebsite || '',
          releaseNotes: latestVersionData.releaseNotes || '',
          forceUpdate: !latestVersionData.isStable,
          publishedAt: latestVersionData.releaseDate
        };
      }

      // 验证版本格式
      if (!this.isValidVersion(latestVersion)) {
        throw new Error(`API返回的版本格式无效: ${latestVersion}`);
      }

      // 版本比较
      const comparison = this.compareVersions(currentVersion, latestVersion);
      const hasUpdate = comparison < 0;

      VersionCheckMonitor.log('version_comparison', {
        currentVersion,
        latestVersion,
        comparison,
        hasUpdate
      });

      const result: VersionCheckResult = {
        hasUpdate,
        needsUpdate: hasUpdate,
        isForceUpdate: versionInfo.forceUpdate,
        currentVersion,
        localVersion: currentVersion,
        latestVersion,
        versionInfo,
        message: hasUpdate ? `发现新版本 ${latestVersion}` : '当前已是最新版本'
      };

      VersionCheckMonitor.log('check_for_updates_success', result);
      return result;

    } catch (error) {
      const currentVersion = await this.getCurrentVersion().catch(() => '1.0.0');
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      VersionCheckMonitor.log('check_for_updates_error', {
        error: errorMessage,
        currentVersion
      });

      // 改进的错误处理策略
      const isRecoverableError = [
        'timeout', 'network', 'fetch', 'abort', 'connection'
      ].some(keyword => errorMessage.toLowerCase().includes(keyword));

      const result: VersionCheckResult = {
        hasUpdate: false,
        needsUpdate: false,
        isForceUpdate: false,
        currentVersion,
        localVersion: currentVersion,
        error: errorMessage,
        message: isRecoverableError 
          ? '网络异常，使用离线模式' 
          : `版本检查失败: ${errorMessage}`
      };

      return result;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    VersionCheckMonitor.log('cache_cleared', {});
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      cacheSize: this.cache.size,
      environment: {
        isDev: import.meta.env.DEV,
        mode: import.meta.env.MODE,
        baseUrl: getApiBaseUrl(),
        softwareId: getSoftwareId()
      },
      logs: VersionCheckMonitor.getLogs().slice(-10) // 最近10条日志
    };
  }

  /**
   * 导出监控日志
   */
  exportMonitorLogs() {
    return VersionCheckMonitor.exportLogs();
  }

  /**
   * 清除监控日志
   */
  clearMonitorLogs() {
    VersionCheckMonitor.clear();
  }
}

export const unifiedVersionService = UnifiedVersionService.getInstance();

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).unifiedVersionService = unifiedVersionService;
  (window as any).VersionCheckMonitor = VersionCheckMonitor;
}