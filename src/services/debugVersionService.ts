/**
 * 调试版本的版本检查服务
 * 用于诊断版本检测问题
 */

import { invoke } from '@tauri-apps/api/core';
import { API_CONFIG, getApiBaseUrl, getSoftwareId } from '../config/api';
import { tauriHttpService } from './tauriHttpService';

export interface DebugVersionResult {
  // 版本获取调试信息
  versionSources: {
    tauri: { success: boolean; version?: string; error?: string };
    vite: { success: boolean; version?: string; error?: string };
    env: { success: boolean; version?: string; error?: string };
    config: { success: boolean; version?: string; error?: string };
  };
  finalCurrentVersion: string;
  
  // API调试信息
  apiConfig: {
    baseUrl: string;
    softwareId: number;
    endpoint: string;
  };
  apiResponse?: any;
  apiError?: string;
  
  // 版本比较调试信息
  versionComparison: {
    current: string;
    latest: string;
    currentParsed?: any;
    latestParsed?: any;
    comparisonResult: number;
    hasUpdate: boolean;
    error?: string;
  };
  
  // 缓存调试信息
  cacheInfo: {
    cacheKey: string;
    hasCachedData: boolean;
    cacheTimestamp?: number;
    cacheAge?: number;
    isValidCache: boolean;
  };
}

class DebugVersionService {
  private static instance: DebugVersionService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): DebugVersionService {
    if (!DebugVersionService.instance) {
      DebugVersionService.instance = new DebugVersionService();
    }
    return DebugVersionService.instance;
  }

  /**
   * 调试版本获取 - 测试所有版本源
   */
  private async debugGetCurrentVersion(): Promise<{
    sources: any;
    finalVersion: string;
  }> {
    const sources = {
      tauri: { success: false, version: undefined, error: undefined },
      vite: { success: false, version: undefined, error: undefined },
      env: { success: false, version: undefined, error: undefined },
      config: { success: false, version: undefined, error: undefined }
    };

    // 1. 测试Tauri版本获取
    try {
      const tauriVersion = await invoke<string>('get_app_version');
      if (tauriVersion && this.isValidVersion(tauriVersion)) {
        sources.tauri = { success: true, version: tauriVersion, error: undefined };
      } else {
        sources.tauri = { success: false, version: tauriVersion, error: '版本格式无效' };
      }
    } catch (error) {
      sources.tauri = { 
        success: false, 
        version: undefined, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }

    // 2. 测试Vite构建版本
    try {
      const viteVersion = (globalThis as any).__APP_VERSION__;
      if (viteVersion && this.isValidVersion(viteVersion)) {
        sources.vite = { success: true, version: viteVersion, error: undefined };
      } else {
        sources.vite = { success: false, version: viteVersion, error: '版本未定义或格式无效' };
      }
    } catch (error) {
      sources.vite = { 
        success: false, 
        version: undefined, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }

    // 3. 测试环境变量版本
    try {
      const envVersion = import.meta.env.VITE_APP_VERSION;
      if (envVersion && envVersion !== 'undefined' && this.isValidVersion(envVersion)) {
        sources.env = { success: true, version: envVersion, error: undefined };
      } else {
        sources.env = { success: false, version: envVersion, error: '环境变量未定义或格式无效' };
      }
    } catch (error) {
      sources.env = { 
        success: false, 
        version: undefined, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }

    // 4. 测试配置版本
    try {
      const configVersion = API_CONFIG.APP_VERSION;
      if (configVersion && this.isValidVersion(configVersion)) {
        sources.config = { success: true, version: configVersion, error: undefined };
      } else {
        sources.config = { success: false, version: configVersion, error: '配置版本格式无效' };
      }
    } catch (error) {
      sources.config = { 
        success: false, 
        version: undefined, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }

    // 确定最终版本（按优先级）
    let finalVersion = '1.0.0'; // 默认降级版本
    
    if (sources.tauri.success) {
      finalVersion = sources.tauri.version!;
    } else if (sources.vite.success) {
      finalVersion = sources.vite.version!;
    } else if (sources.env.success) {
      finalVersion = sources.env.version!;
    } else if (sources.config.success) {
      finalVersion = sources.config.version!;
    }

    return { sources, finalVersion };
  }

  /**
   * 调试版本比较
   */
  private debugCompareVersions(current: string, latest: string): {
    current: string;
    latest: string;
    currentParsed?: any;
    latestParsed?: any;
    comparisonResult: number;
    hasUpdate: boolean;
    error?: string;
  } {
    try {
      console.log(`🔍 开始调试版本比较: ${current} vs ${latest}`);

      if (!this.isValidVersion(current)) {
        throw new Error(`当前版本格式无效: ${current}`);
      }
      if (!this.isValidVersion(latest)) {
        throw new Error(`最新版本格式无效: ${latest}`);
      }

      // 解析版本号
      const parseVersion = (version: string) => {
        const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
        if (!match) throw new Error(`版本解析失败: ${version}`);
        
        return {
          major: parseInt(match[1], 10),
          minor: parseInt(match[2], 10),
          patch: parseInt(match[3], 10),
          prerelease: match[4] || null,
          build: match[5] || null
        };
      };

      const currentParsed = parseVersion(current);
      const latestParsed = parseVersion(latest);

      console.log('📊 版本解析结果:', {
        current: currentParsed,
        latest: latestParsed
      });

      // 逐步比较
      let comparisonResult = 0;
      let comparisonStep = '';

      // 比较主版本号
      if (currentParsed.major !== latestParsed.major) {
        comparisonResult = currentParsed.major < latestParsed.major ? -1 : 1;
        comparisonStep = `主版本: ${currentParsed.major} vs ${latestParsed.major}`;
      }
      // 比较次版本号
      else if (currentParsed.minor !== latestParsed.minor) {
        comparisonResult = currentParsed.minor < latestParsed.minor ? -1 : 1;
        comparisonStep = `次版本: ${currentParsed.minor} vs ${latestParsed.minor}`;
      }
      // 比较修订版本号
      else if (currentParsed.patch !== latestParsed.patch) {
        comparisonResult = currentParsed.patch < latestParsed.patch ? -1 : 1;
        comparisonStep = `修订版本: ${currentParsed.patch} vs ${latestParsed.patch}`;
      }
      // 处理预发布版本
      else if (currentParsed.prerelease && !latestParsed.prerelease) {
        comparisonResult = -1;
        comparisonStep = '预发布版本 < 正式版本';
      }
      else if (!currentParsed.prerelease && latestParsed.prerelease) {
        comparisonResult = 1;
        comparisonStep = '正式版本 > 预发布版本';
      }
      else if (currentParsed.prerelease && latestParsed.prerelease) {
        comparisonResult = currentParsed.prerelease < latestParsed.prerelease ? -1 : 
                          currentParsed.prerelease > latestParsed.prerelease ? 1 : 0;
        comparisonStep = `预发布版本: ${currentParsed.prerelease} vs ${latestParsed.prerelease}`;
      }
      else {
        comparisonResult = 0;
        comparisonStep = '版本完全相同';
      }

      const hasUpdate = comparisonResult < 0;

      console.log(`🔄 版本比较详情:`, {
        step: comparisonStep,
        result: comparisonResult,
        hasUpdate,
        meaning: comparisonResult < 0 ? '需要更新' : comparisonResult > 0 ? '当前版本更新' : '版本相同'
      });

      return {
        current,
        latest,
        currentParsed,
        latestParsed,
        comparisonResult,
        hasUpdate
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      console.error('❌ 版本比较失败:', errorMsg);
      
      return {
        current,
        latest,
        comparisonResult: 0,
        hasUpdate: false,
        error: errorMsg
      };
    }
  }

  private isValidVersion(version: string): boolean {
    if (!version || typeof version !== 'string') {
      return false;
    }
    
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    
    return semverRegex.test(version.trim());
  }

  private getCacheKey(endpoint: string): string {
    const env = import.meta.env.DEV ? 'dev' : 'prod';
    return `${env}_${endpoint}`;
  }

  private getCacheInfo(cacheKey: string) {
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    if (!cached) {
      return {
        cacheKey,
        hasCachedData: false,
        isValidCache: false
      };
    }

    const cacheAge = now - cached.timestamp;
    const isValidCache = cacheAge < this.CACHE_DURATION;

    return {
      cacheKey,
      hasCachedData: true,
      cacheTimestamp: cached.timestamp,
      cacheAge,
      isValidCache
    };
  }

  /**
   * 完整的调试版本检查
   */
  async debugCheckForUpdates(): Promise<DebugVersionResult> {
    console.log('🚀 开始调试版本检查...');

    // 1. 调试版本获取
    const { sources, finalVersion } = await this.debugGetCurrentVersion();
    console.log('📱 版本获取调试结果:', { sources, finalVersion });

    // 2. 调试API配置
    let apiConfig;
    try {
      const baseUrl = getApiBaseUrl();
      const softwareId = getSoftwareId();
      const endpoint = `${baseUrl}/app/software/id/${softwareId}/versions`;
      
      apiConfig = { baseUrl, softwareId, endpoint };
      console.log('🔧 API配置:', apiConfig);
    } catch (error) {
      throw new Error(`API配置错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    // 3. 调试缓存
    const cacheKey = this.getCacheKey('version');
    const cacheInfo = this.getCacheInfo(cacheKey);
    console.log('💾 缓存信息:', cacheInfo);

    // 4. 如果有有效缓存，使用缓存数据进行调试
    if (cacheInfo.isValidCache) {
      const cached = this.cache.get(cacheKey)!;
      const versionComparison = this.debugCompareVersions(finalVersion, cached.data.version);
      
      return {
        versionSources: sources,
        finalCurrentVersion: finalVersion,
        apiConfig,
        cacheInfo,
        versionComparison
      };
    }

    // 5. 调用API获取最新版本
    let apiResponse;
    let apiError;
    
    try {
      console.log(`🌐 调用API: ${apiConfig.endpoint}`);
      
      const response = await tauriHttpService.get(apiConfig.endpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': `ADMT/${finalVersion}`,
          'Accept': 'application/json'
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'tauriHttpService请求失败');
      }

      apiResponse = response.data;
      console.log('📥 API响应:', apiResponse);

      // 更新缓存
      if (apiResponse && apiResponse.success && apiResponse.data) {
        this.cache.set(cacheKey, {
          data: apiResponse.data,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      apiError = error instanceof Error ? error.message : '未知API错误';
      console.error('❌ API调用失败:', apiError);
    }

    // 6. 调试版本比较
    let versionComparison;
    if (apiResponse && apiResponse.success && apiResponse.data) {
      versionComparison = this.debugCompareVersions(finalVersion, apiResponse.data.version);
    } else {
      // API失败时的降级比较
      versionComparison = {
        current: finalVersion,
        latest: 'unknown',
        comparisonResult: 0,
        hasUpdate: false,
        error: '无法获取最新版本信息'
      };
    }

    return {
      versionSources: sources,
      finalCurrentVersion: finalVersion,
      apiConfig,
      apiResponse,
      apiError,
      cacheInfo,
      versionComparison
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 调试版本检查缓存已清空');
  }
}

export const debugVersionService = DebugVersionService.getInstance();

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).debugVersionService = debugVersionService;
}