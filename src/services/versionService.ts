/**
 * 版本检查服务
 * 负责检查软件版本更新，与版本管理API交互
 */

import { VersionCheckResult, VersionCheckResponse, SoftwareInfo } from '../types/app';
import { API_CONFIG, API_ENDPOINTS, getApiBaseUrl, getDefaultHeaders } from '../config/api';
import { getVersion } from '@tauri-apps/api/app';
import { SecurityConfigManager } from '../config/securityConfig';

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

  private constructor() {}

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
    let lastError: Error | null = null;
    
    // 重试机制
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_COUNT; attempt++) {
      try {
        console.log(`正在检查软件版本，软件ID: ${API_CONFIG.SOFTWARE_ID} (尝试 ${attempt}/${API_CONFIG.RETRY_COUNT})`);

        const baseUrl = getApiBaseUrl();
        // 使用软件基本信息API而不是版本历史API
        const url = `${baseUrl}/app/software/id/${API_CONFIG.SOFTWARE_ID}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: getDefaultHeaders(),
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(`API返回错误: ${data.error || '未知错误'}`);
        }

        console.log('成功获取软件信息:', data);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`版本检查尝试 ${attempt} 失败:`, lastError.message);
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < API_CONFIG.RETRY_COUNT) {
          console.log(`等待 ${API_CONFIG.RETRY_DELAY}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        }
      }
    }
    
    // 所有重试都失败了，抛出最后一个错误
    console.error('所有版本检查尝试都失败了');
    throw lastError || new Error('网络连接失败，请检查网络连接');
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
      
      if (!apiResponse.data) {
        return {
          needsUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
          isForceUpdate: false,
          message: '无法获取最新版本信息'
        };
      }

      // 使用新的API响应格式（data 中包含 software 与 versions）
      const softwareInfo = apiResponse.data.software;
      const latestVersionNumber = softwareInfo.currentVersion || currentVersion;
      
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
        id: softwareInfo.id,
        version: latestVersionNumber,
        releaseNotes: softwareInfo.description || '发现新版本，请立即更新',
        releaseDate: softwareInfo.updatedAt || new Date().toISOString(),
        downloadLinks: {
          // SoftwareInfo 不包含 latestDownloadUrl，使用官网地址作为下载链接
          official: softwareInfo.officialWebsite
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
      const baseUrl = getApiBaseUrl();
      const endpoint = API_ENDPOINTS.SOFTWARE.BY_ID(API_CONFIG.SOFTWARE_ID);
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getDefaultHeaders(),
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data?.software) {
        throw new Error(`API返回错误: ${data.error || '未找到软件信息'}`);
      }

      return data.data.software;
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
