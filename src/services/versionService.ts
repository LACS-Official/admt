/**
 * 版本检查服务
 * 负责检查软件版本更新，与版本管理API交互
 */

import { VersionCheckResult, VersionCheckResponse, SoftwareInfo } from '../types/app';
import { API_CONFIG, API_ENDPOINTS, getApiBaseUrl, getDefaultHeaders } from '../config/api';
import { getVersion } from '@tauri-apps/api/app';
import { SecurityConfigManager } from '../config/securityConfig';
import { tauriHttpService } from './tauriHttpService';

// 扩展Window接口以支持Tauri
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

/**
 * 版本比较工具类
 */
class VersionComparator {
  /**
   * 解析版本号为数字数组
   * 支持语义化版本号格式：major.minor.patch[-prerelease][+build]
   */
  private static parseVersion(version: string): number[] {
    // 移除预发布标识和构建元数据
    const cleanVersion = version.split('-')[0].split('+')[0];
    return cleanVersion.split('.').map(part => {
      const num = parseInt(part, 10);
      return isNaN(num) ? 0 : num;
    });
  }

  /**
   * 比较两个版本号
   * @param version1 版本1
   * @param version2 版本2
   * @returns 1: version1 > version2, 0: 相等, -1: version1 < version2
   */
  public static compare(version1: string, version2: string): number {
    const v1Parts = this.parseVersion(version1);
    const v2Parts = this.parseVersion(version2);
    
    // 确保两个版本号有相同的长度
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * 检查版本1是否大于版本2
   */
  public static isGreater(version1: string, version2: string): boolean {
    return this.compare(version1, version2) > 0;
  }

  /**
   * 检查版本1是否小于版本2
   */
  public static isLess(version1: string, version2: string): boolean {
    return this.compare(version1, version2) < 0;
  }

  /**
   * 检查版本1是否等于版本2
   */
  public static isEqual(version1: string, version2: string): boolean {
    return this.compare(version1, version2) === 0;
  }
}

/**
 * 版本检查服务类
 */
export class VersionService {
  private static instance: VersionService;
  private configManager: SecurityConfigManager;
  private pendingRequest: Promise<any> | null = null;
  private lastRequestTime: number = 0;
  private cachedResponse: any = null;
  private readonly CACHE_DURATION = 60000; // 60秒缓存，避免频繁请求

  private constructor() {
    this.configManager = SecurityConfigManager.getInstance();
  }

  public static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService();
    }
    return VersionService.instance;
  }

  /**
   * 获取当前软件版本
   */
  public async getCurrentVersion(): Promise<string> {
    try {
      // 优先从配置文件获取版本号
      const configManager = SecurityConfigManager.getInstance();
      if (configManager.isConfigInitialized()) {
        const configVersion = configManager.getAppVersion();
        console.log('从配置文件获取版本号:', configVersion);
        return configVersion;
      }

      // 在Tauri环境中，使用Tauri API获取版本
      if (typeof window !== 'undefined' && window.__TAURI__) {
        const version = await getVersion();
        console.log('从Tauri获取版本:', version);
        return version;
      }

      // 在开发环境或非Tauri环境中，使用默认版本
      console.log('使用默认版本: 1.0.0');
      return '1.0.0';
    } catch (error) {
      console.warn('获取版本失败，使用默认版本:', error);
      return '1.0.0';
    }
  }

  /**
   * 调用软件信息API获取最新版本信息
   */
  private async fetchLatestVersionFromAPI(): Promise<VersionCheckResponse> {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (this.cachedResponse && (now - this.lastRequestTime) < this.CACHE_DURATION) {
      console.log('✅ 使用缓存的版本信息，避免频繁请求');
      return this.cachedResponse;
    }
    
    // 检查是否有正在进行的请求，避免重复请求
    if (this.pendingRequest) {
      console.log('⏳ 等待正在进行的版本检查请求...');
      return await this.pendingRequest;
    }
    
    console.log('🔄 创建新的版本检查请求');
    // 创建新的请求
    this.pendingRequest = this.performVersionRequest();
    
    try {
      const result = await this.pendingRequest;
      this.cachedResponse = result;
      this.lastRequestTime = now;
      console.log('✅ 版本检查请求完成，已缓存结果');
      return result;
    } finally {
      this.pendingRequest = null;
    }
  }

  /**
   * 执行实际的版本检查请求
   */
  private async performVersionRequest(): Promise<VersionCheckResponse> {
    let lastError: Error | null = null;
    
    // 重试机制
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_COUNT; attempt++) {
      try {
        console.log(`版本检查尝试 ${attempt}/${API_CONFIG.RETRY_COUNT}`);
        
        // 使用 tauriHttpService 替代原生 fetch
        const endpoint = API_ENDPOINTS.SOFTWARE.BY_ID(API_CONFIG.SOFTWARE_ID);
        const response = await tauriHttpService.get(endpoint, {
          timeout: API_CONFIG.TIMEOUT
        });

        if (!response.success) {
          throw new Error(`API返回错误: ${response.error || '未知错误'}`);
        }

        console.log('版本检查成功:', response);
        return response;
        
      } catch (error) {
        lastError = error as Error;
        console.warn(`版本检查尝试 ${attempt} 失败:`, lastError.message);
        
        // 如果是 429 错误（频率限制），增加等待时间
        const isRateLimited = lastError.message.includes('429') || 
                             lastError.message.includes('rate limit') ||
                             lastError.message.includes('temporarily banned');
        
        if (attempt < API_CONFIG.RETRY_COUNT) {
          const delay = isRateLimited ? API_CONFIG.RETRY_DELAY * 2 : API_CONFIG.RETRY_DELAY;
          console.log(`等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试都失败了，返回一个默认的成功响应，避免应用退出
    console.error('所有版本检查尝试都失败了，使用默认响应');
    const currentVersion = await this.getCurrentVersion();
    return {
      success: true,
      data: {
        software: {
          id: API_CONFIG.SOFTWARE_ID,
          name: "玩机管家",
          currentVersion: currentVersion,
          description: "默认软件信息",
          officialWebsite: "https://app.lacs.cc",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        versions: []
      }
    };
  }

  /**
   * 检查软件版本更新
   */
  public async checkForUpdates(): Promise<VersionCheckResult> {
    try {
      const currentVersion = await this.getCurrentVersion();
      console.log(`当前版本: ${currentVersion}`);

      // 调用API获取最新版本信息
      const apiResponse = await this.fetchLatestVersionFromAPI();
      
      // 检查响应数据格式
      if (!apiResponse.data) {
        return {
          needsUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          isForceUpdate: false,
          message: '无法获取最新版本信息'
        };
      }

      console.log('🔍 调试信息 - apiResponse:', apiResponse);
    
      // API 响应结构：{ success: true, data: { currentVersion: "1.0.1", ... } }
      // 根据实际调试确认，版本信息直接在 apiResponse.data 中
      const responseData: any = apiResponse.data;
      
      console.log('🔍 调试信息 - responseData:', responseData);
      
      // 直接从 data 中提取版本信息，优先使用 currentVersion
      const latestVersionFromAPI = responseData?.currentVersion || 
                                   responseData?.version || 
                                   responseData?.latestVersion;
      
      console.log('🔍 调试信息 - 本地版本:', currentVersion);
      console.log('🔍 调试信息 - 云端最新版本:', latestVersionFromAPI);
      console.log('🔍 调试信息 - 版本字段存在?', !!latestVersionFromAPI);
      console.log('🔍 调试信息 - 版本字段类型:', typeof latestVersionFromAPI);
      console.log('🔍 调试信息 - 完整响应数据:', JSON.stringify(responseData, null, 2));
      
      // 检查是否能获取到云端版本信息
      if (!latestVersionFromAPI || typeof latestVersionFromAPI !== 'string' || latestVersionFromAPI.trim() === '') {
        console.warn('⚠️ 无法获取云端版本信息，使用本地版本作为回退');
        console.warn('🔍 可用字段:', Object.keys(responseData || {}));
        return {
          needsUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          isForceUpdate: false,
          message: '无法获取云端版本信息，请检查网络连接或联系技术支持'
        };
      }
      
      const latestVersionNumber: string = latestVersionFromAPI;
      
      console.log(`最新版本: ${latestVersionNumber}`);

      // 比较版本号
      const needsUpdate = VersionComparator.isLess(currentVersion, latestVersionNumber);

      let message: string;
      let isForceUpdate = false;

      if (needsUpdate) {
        // 根据您的需求：任何版本低于最新版本都需要强制更新
        isForceUpdate = true;
        message = `发现新版本 ${latestVersionNumber}，需要强制更新后才能继续使用软件`;
      } else if (VersionComparator.isEqual(currentVersion, latestVersionNumber)) {
        message = '目前已是最新版本';
      } else {
        // 当前版本高于最新版本（开发版本或测试版本）
        message = '目前已是最新版本';
      }

      // 构造更新信息
      const updateInfo = needsUpdate ? {
        id: responseData.id || 0,
        version: latestVersionNumber,
        releaseNotes: responseData.description || '发现新版本，请立即更新',
        releaseDate: responseData.updatedAt || new Date().toISOString(),
        downloadLinks: {
          // 使用官网地址作为下载链接
          official: responseData.officialWebsite || ''
        },
        isStable: true,
        versionType: "release" as const
      } : undefined;

      return {
        needsUpdate,
        currentVersion,
        latestVersion: latestVersionNumber,
        isForceUpdate,
        updateInfo,
        message
      };

    } catch (error) {
      console.error('版本检查失败:', error);

      const fallbackVersion = await this.getCurrentVersion();
      return {
        needsUpdate: false,
        currentVersion: fallbackVersion,
        latestVersion: fallbackVersion,
        isForceUpdate: false,
        message: `版本检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 获取软件详细信息
   */
  public async getSoftwareInfo(): Promise<SoftwareInfo | null> {
    try {
      // 复用版本检查的缓存机制，避免重复请求
      const versionResponse = await this.fetchLatestVersionFromAPI();
      
      if (!versionResponse.success || !versionResponse.data) {
        throw new Error(`API返回错误: ${versionResponse.error || '未找到软件信息'}`);
      }

      // API 响应结构：{ success: true, data: { software: SoftwareInfo, versions: VersionInfo[] } }
      // 返回 data.software 字段，它包含了 SoftwareInfo 的所有属性
      const responseData = versionResponse.data as { software: SoftwareInfo; versions: any[] };
      return responseData.software;
    } catch (error) {
      console.error('获取软件信息失败:', error);
      return null;
    }
  }
}

// 导出单例实例
export const versionService = VersionService.getInstance();

// 导出版本比较工具
export { VersionComparator };