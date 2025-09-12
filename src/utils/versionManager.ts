/**
 * 前端版本管理工具
 * 统一管理和显示版本信息
 */

import React from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface VersionInfo {
  version: string;
  buildNumber: number;
  versionName: string;
  releaseDate: string;
  buildDate?: string;
  commitHash?: string;
  environment: 'development' | 'production';
}

export interface VersionCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  error?: string;
}

class VersionManager {
  private static instance: VersionManager;
  private versionInfo: VersionInfo | null = null;
  private lastCheckTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  static getInstance(): VersionManager {
    if (!VersionManager.instance) {
      VersionManager.instance = new VersionManager();
    }
    return VersionManager.instance;
  }

  /**
   * 获取当前版本信息
   */
  async getCurrentVersionInfo(): Promise<VersionInfo> {
    // 如果有缓存且未过期，直接返回
    if (this.versionInfo && (Date.now() - this.lastCheckTime) < this.CACHE_DURATION) {
      return this.versionInfo;
    }

    try {
      // 从环境变量获取前端版本信息
      const frontendVersion: VersionInfo = {
        version: this.getEnvVar('VITE_APP_VERSION', '1.0.0'),
        buildNumber: parseInt(this.getEnvVar('VITE_BUILD_NUMBER', '1')),
        versionName: this.getEnvVar('VITE_VERSION_NAME', '1.0.0'),
        releaseDate: this.getEnvVar('VITE_RELEASE_DATE', '2025-01-11'),
        environment: this.isProduction() ? 'production' : 'development'
      };

      // 尝试从后端获取更详细的版本信息
      try {
        const backendVersionInfo = await invoke<{
          version: string;
          build_date: string;
          commit_hash?: string;
        }>('get_app_info');

        // 合并前后端版本信息
        this.versionInfo = {
          ...frontendVersion,
          buildDate: backendVersionInfo.build_date,
          commitHash: backendVersionInfo.commit_hash,
          // 使用后端版本作为主版本号（如果可用）
          version: backendVersionInfo.version || frontendVersion.version
        };
      } catch (backendError) {
        console.warn('无法获取后端版本信息，使用前端版本:', backendError);
        this.versionInfo = frontendVersion;
      }

      this.lastCheckTime = Date.now();
      return this.versionInfo;
    } catch (error) {
      console.error('获取版本信息失败:', error);
      
      // 返回默认版本信息
      const defaultVersion: VersionInfo = {
        version: '1.0.0',
        buildNumber: 1,
        versionName: '1.0.0',
        releaseDate: '2025-01-11',
        environment: 'development'
      };
      
      this.versionInfo = defaultVersion;
      return defaultVersion;
    }
  }

  /**
   * 获取简化的版本字符串
   */
  async getVersionString(): Promise<string> {
    const versionInfo = await this.getCurrentVersionInfo();
    return versionInfo.version;
  }

  /**
   * 获取完整的版本显示字符串
   */
  async getFullVersionString(): Promise<string> {
    const versionInfo = await this.getCurrentVersionInfo();
    const parts = [
      `v${versionInfo.version}`,
      `Build ${versionInfo.buildNumber}`
    ];

    if (versionInfo.commitHash) {
      parts.push(`(${versionInfo.commitHash})`);
    }

    if (versionInfo.environment === 'development') {
      parts.push('[开发版]');
    }

    return parts.join(' ');
  }

  /**
   * 获取版本详细信息用于显示
   */
  async getVersionDetails(): Promise<{
    version: string;
    buildNumber: string;
    releaseDate: string;
    buildDate?: string;
    environment: string;
    commitHash?: string;
  }> {
    const versionInfo = await this.getCurrentVersionInfo();
    
    return {
      version: versionInfo.version,
      buildNumber: versionInfo.buildNumber.toString(),
      releaseDate: this.formatDate(versionInfo.releaseDate),
      buildDate: versionInfo.buildDate ? this.formatDate(versionInfo.buildDate) : undefined,
      environment: versionInfo.environment === 'production' ? '生产环境' : '开发环境',
      commitHash: versionInfo.commitHash
    };
  }

  /**
   * 检查版本更新
   */
  async checkForUpdates(): Promise<VersionCheckResult> {
    try {
      const currentVersion = await this.getVersionString();
      
      // 调用后端版本检查API
      const result = await invoke<{
        has_update: boolean;
        current_version: string;
        latest_version?: string;
        download_url?: string;
        release_notes?: string;
        error?: string;
      }>('check_for_updates');

      return {
        hasUpdate: result.has_update,
        currentVersion: result.current_version,
        latestVersion: result.latest_version,
        downloadUrl: result.download_url,
        releaseNotes: result.release_notes,
        error: result.error
      };
    } catch (error) {
      console.error('版本检查失败:', error);
      
      const currentVersion = await this.getVersionString();
      return {
        hasUpdate: false,
        currentVersion,
        error: error instanceof Error ? error.message : '版本检查失败'
      };
    }
  }

  /**
   * 验证版本号格式
   */
  validateVersionFormat(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  /**
   * 比较版本号
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(n => parseInt(n, 10));
    const v2Parts = version2.split('.').map(n => parseInt(n, 10));
    
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
   * 清除版本信息缓存
   */
  clearCache(): void {
    this.versionInfo = null;
    this.lastCheckTime = 0;
  }

  /**
   * 获取环境变量
   */
  private getEnvVar(key: string, defaultValue: string = ''): string {
    return import.meta.env[key] || defaultValue;
  }

  /**
   * 判断是否为生产环境
   */
  private isProduction(): boolean {
    return import.meta.env.MODE === 'production' || 
           import.meta.env.VITE_APP_ENV === 'production';
  }

  /**
   * 格式化日期
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}

// 导出单例实例
export const versionManager = VersionManager.getInstance();

// 导出类型和工具函数
export default versionManager;

/**
 * React Hook: 使用版本信息
 */
export function useVersionInfo() {
  const [versionInfo, setVersionInfo] = React.useState<VersionInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadVersionInfo = async () => {
      try {
        setLoading(true);
        const info = await versionManager.getCurrentVersionInfo();
        if (mounted) {
          setVersionInfo(info);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : '获取版本信息失败');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadVersionInfo();

    return () => {
      mounted = false;
    };
  }, []);

  return { versionInfo, loading, error, refresh: () => versionManager.clearCache() };
}

/**
 * React Hook: 版本检查
 */
export function useVersionCheck() {
  const [checkResult, setCheckResult] = React.useState<VersionCheckResult | null>(null);
  const [checking, setChecking] = React.useState(false);

  const checkForUpdates = React.useCallback(async () => {
    setChecking(true);
    try {
      const result = await versionManager.checkForUpdates();
      setCheckResult(result);
      return result;
    } catch (error) {
      const errorResult: VersionCheckResult = {
        hasUpdate: false,
        currentVersion: '未知',
        error: error instanceof Error ? error.message : '检查失败'
      };
      setCheckResult(errorResult);
      return errorResult;
    } finally {
      setChecking(false);
    }
  }, []);

  return { checkResult, checking, checkForUpdates };
}