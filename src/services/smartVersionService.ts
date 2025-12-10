/**
 * 智能版本检测服务
 * 根据环境自动选择合适的版本通道和检测策略
 */

import { invoke } from '@tauri-apps/api/core';
import { API_CONFIG, getApiBaseUrl, getSoftwareId } from '../config/api';
import { tauriHttpService } from './tauriHttpService';

// 版本通道类型
export type VersionChannel = 'stable' | 'beta' | 'dev' | 'all';

// 环境类型
export type EnvironmentType = 'production' | 'development' | 'testing';

// 用户类型
export type UserType = 'endUser' | 'betaTester' | 'developer';

// 版本信息接口
export interface SmartVersionInfo {
  version: string;
  channel: VersionChannel;
  isStable: boolean;
  isPrerelease: boolean;
  isDevelopment: boolean;
  downloadUrl: string;
  releaseNotes: string;
  releaseDate: string;
  forceUpdate: boolean;
  versionType: 'release' | 'beta' | 'alpha' | 'dev';
}

// 版本检测配置
export interface VersionDetectionConfig {
  channel: VersionChannel;
  includePrerelease: boolean;
  includeDevelopment: boolean;
  onlyStable: boolean;
  apiEndpoint: string;
  userType: UserType;
}

// 环境检测结果
export interface EnvironmentInfo {
  type: EnvironmentType;
  isDevelopment: boolean;
  isProduction: boolean;
  buildMode: string;
  versionChannel: string;
  apiBaseUrl: string;
}

class SmartVersionService {
  private static instance: SmartVersionService;
  private cache: Map<string, { data: SmartVersionInfo; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): SmartVersionService {
    if (!SmartVersionService.instance) {
      SmartVersionService.instance = new SmartVersionService();
    }
    return SmartVersionService.instance;
  }

  /**
   * 检测当前运行环境
   */
  detectEnvironment(): EnvironmentInfo {
    const isDev = import.meta.env.DEV;
    const mode = import.meta.env.MODE;
    const buildType = import.meta.env.VITE_BUILD_TYPE;
    const versionChannel = import.meta.env.VITE_VERSION_CHANNEL;
    
    let environmentType: EnvironmentType;
    
    if (isDev || mode === 'development') {
      environmentType = 'development';
    } else if (mode === 'testing' || buildType === 'test') {
      environmentType = 'testing';
    } else {
      environmentType = 'production';
    }

    const envInfo: EnvironmentInfo = {
      type: environmentType,
      isDevelopment: isDev,
      isProduction: !isDev && mode === 'production',
      buildMode: mode,
      versionChannel: versionChannel || 'stable',
      apiBaseUrl: getApiBaseUrl()
    };

    console.log('🔍 环境检测结果:', envInfo);
    return envInfo;
  }

  /**
   * 根据环境和用户类型获取版本检测配置
   */
  getVersionDetectionConfig(userType?: UserType): VersionDetectionConfig {
    const env = this.detectEnvironment();
    
    // 如果没有指定用户类型，根据环境自动推断
    if (!userType) {
      if (env.type === 'development') {
        userType = 'developer';
      } else if (env.versionChannel === 'beta') {
        userType = 'betaTester';
      } else {
        userType = 'endUser';
      }
    }

    // 根据用户类型和环境确定配置
    const configs: Record<UserType, Partial<VersionDetectionConfig>> = {
      endUser: {
        channel: 'stable',
        includePrerelease: false,
        includeDevelopment: false,
        onlyStable: true
      },
      betaTester: {
        channel: 'beta',
        includePrerelease: true,
        includeDevelopment: false,
        onlyStable: false
      },
      developer: {
        channel: env.type === 'development' ? 'dev' : 'all',
        includePrerelease: true,
        includeDevelopment: true,
        onlyStable: false
      }
    };

    const baseConfig = configs[userType];
    
    // 构建API端点
    const apiEndpoint = this.buildApiEndpoint(baseConfig.channel!);

    const config: VersionDetectionConfig = {
      ...baseConfig,
      apiEndpoint,
      userType
    } as VersionDetectionConfig;

    console.log('⚙️ 版本检测配置:', config);
    return config;
  }

  /**
   * 构建API端点
   */
  private buildApiEndpoint(channel: VersionChannel): string {
    const baseUrl = getApiBaseUrl();
    const softwareId = getSoftwareId();
    
    const endpoints = {
      stable: `${baseUrl}/app/software/id/${softwareId}/versions/stable`,
      beta: `${baseUrl}/app/software/id/${softwareId}/versions/beta`,
      dev: `${baseUrl}/app/software/id/${softwareId}/versions/dev`,
      all: `${baseUrl}/app/software/id/${softwareId}/versions`
    };

    return endpoints[channel] || endpoints.all;
  }

  /**
   * 智能版本检测
   */
  async smartVersionCheck(userType?: UserType): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: SmartVersionInfo;
    config: VersionDetectionConfig;
    environment: EnvironmentInfo;
    message: string;
  }> {
    console.log('🚀 开始智能版本检测...');
    
    try {
      // 1. 获取当前版本
      const currentVersion = await this.getCurrentVersion();
      console.log(`📱 当前版本: ${currentVersion}`);

      // 2. 获取检测配置
      const config = this.getVersionDetectionConfig(userType);
      const environment = this.detectEnvironment();

      // 3. 检查缓存
      const cacheKey = `smart_version_${config.channel}_${config.userType}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('💾 使用缓存的版本信息');
        return this.buildSmartResult(currentVersion, cached.data, config, environment);
      }

      // 4. 调用API获取版本信息
      console.log(`🌐 调用API: ${config.apiEndpoint}`);
      const response = await tauriHttpService.get(config.apiEndpoint, {
        timeout: 10000
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'API响应无效');
      }

      const apiData = response.data;

      // 5. 处理版本数据
      const latestVersion = this.processVersionData(apiData.data, config);
      
      // 6. 更新缓存
      this.cache.set(cacheKey, {
        data: latestVersion,
        timestamp: Date.now()
      });

      // 7. 构建结果
      return this.buildSmartResult(currentVersion, latestVersion, config, environment);

    } catch (error) {
      console.error('❌ 智能版本检测失败:', error);
      
      const environment = this.detectEnvironment();
      const config = this.getVersionDetectionConfig(userType);
      const currentVersion = await this.getCurrentVersion();

      return {
        hasUpdate: false,
        currentVersion,
        config,
        environment,
        message: `版本检测失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 处理版本数据
   */
  private processVersionData(data: any[], config: VersionDetectionConfig): SmartVersionInfo {
    console.log(`📦 处理版本数据，共 ${data.length} 个版本`);
    
    // 根据配置过滤版本
    const filteredVersions = data.filter(version => {
      // 基本验证
      if (!version.version) return false;
      
      // 稳定性过滤
      if (config.onlyStable && !version.isStable) return false;
      
      // 预发布版本过滤
      if (!config.includePrerelease && version.isPrerelease) return false;
      
      // 开发版本过滤
      if (!config.includeDevelopment && version.versionType === 'dev') return false;
      
      return true;
    });

    if (filteredVersions.length === 0) {
      throw new Error('没有找到符合条件的版本');
    }

    // 按发布日期排序，最新的在前面
    filteredVersions.sort((a, b) => 
      new Date(b.releaseDate || b.createdAt).getTime() - 
      new Date(a.releaseDate || a.createdAt).getTime()
    );

    const latestVersionData = filteredVersions[0];
    console.log(`📦 选择的最新版本:`, latestVersionData);

    // 转换为标准格式
    const smartVersionInfo: SmartVersionInfo = {
      version: latestVersionData.version,
      channel: this.detectVersionChannel(latestVersionData),
      isStable: latestVersionData.isStable || false,
      isPrerelease: latestVersionData.isPrerelease || false,
      isDevelopment: latestVersionData.versionType === 'dev',
      downloadUrl: latestVersionData.downloadLinks?.official || 'https://admt.lacs.cc/',
      releaseNotes: latestVersionData.releaseNotes || '版本更新',
      releaseDate: latestVersionData.releaseDate || latestVersionData.createdAt,
      forceUpdate: latestVersionData.forceUpdate || false,
      versionType: latestVersionData.versionType || 'release'
    };

    return smartVersionInfo;
  }

  /**
   * 检测版本通道
   */
  private detectVersionChannel(versionData: any): VersionChannel {
    if (versionData.versionType === 'dev') return 'dev';
    if (versionData.isPrerelease || versionData.versionType === 'beta') return 'beta';
    if (versionData.isStable) return 'stable';
    return 'stable'; // 默认
  }

  /**
   * 构建智能检测结果
   */
  private buildSmartResult(
    currentVersion: string,
    latestVersion: SmartVersionInfo,
    config: VersionDetectionConfig,
    environment: EnvironmentInfo
  ) {
    const comparison = this.compareVersions(currentVersion, latestVersion.version);
    const hasUpdate = comparison < 0;

    let message: string;
    if (!hasUpdate) {
      message = `当前版本 ${currentVersion} 已是 ${config.channel} 通道的最新版本`;
    } else {
      const channelName = {
        stable: '稳定版',
        beta: '测试版',
        dev: '开发版',
        all: '全部'
      }[config.channel];
      
      message = `发现 ${channelName} 新版本 ${latestVersion.version}`;
      
      if (latestVersion.forceUpdate) {
        message += '（强制更新）';
      }
    }

    const result = {
      hasUpdate,
      currentVersion,
      latestVersion: hasUpdate ? latestVersion : undefined,
      config,
      environment,
      message
    };

    console.log('✅ 智能版本检测完成:', result);
    return result;
  }

  /**
   * 获取当前版本
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      // 优先从Tauri获取
      const tauriVersion = await invoke<string>('get_app_version');
      if (tauriVersion) {
        return tauriVersion;
      }
    } catch (error) {
      console.warn('⚠️ 无法从Tauri获取版本，尝试其他方式');
    }

    // 从环境变量获取
    const envVersion = import.meta.env.VITE_APP_VERSION;
    if (envVersion) {
      return envVersion;
    }

    // 默认版本
    return '1.0.0';
  }

  /**
   * 版本比较
   */
  private compareVersions(current: string, latest: string): number {
    const parseVersion = (version: string) => {
      const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
      if (!match) throw new Error(`版本格式无效: ${version}`);
      
      return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4] || null
      };
    };

    const currentVer = parseVersion(current);
    const latestVer = parseVersion(latest);

    // 比较主版本号
    if (currentVer.major !== latestVer.major) {
      return currentVer.major < latestVer.major ? -1 : 1;
    }
    
    // 比较次版本号
    if (currentVer.minor !== latestVer.minor) {
      return currentVer.minor < latestVer.minor ? -1 : 1;
    }
    
    // 比较修订版本号
    if (currentVer.patch !== latestVer.patch) {
      return currentVer.patch < latestVer.patch ? -1 : 1;
    }

    // 处理预发布版本
    if (currentVer.prerelease && !latestVer.prerelease) {
      return -1; // 当前是预发布，最新是正式版
    }
    if (!currentVer.prerelease && latestVer.prerelease) {
      return 1; // 当前是正式版，最新是预发布
    }

    return 0; // 版本相同
  }

  /**
   * 获取版本检测状态
   */
  getStatus() {
    const environment = this.detectEnvironment();
    const config = this.getVersionDetectionConfig();
    
    return {
      environment,
      config,
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        version: value.data.version,
        channel: value.data.channel,
        timestamp: new Date(value.timestamp).toISOString(),
        age: Math.round((Date.now() - value.timestamp) / 1000)
      }))
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 智能版本检测缓存已清空');
  }
}

// 导出单例实例
export const smartVersionService = SmartVersionService.getInstance();