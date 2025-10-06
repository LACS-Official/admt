/**
 * 版本服务适配器 - 提供向后兼容性
 * 将新的 VersionCheckResult 接口适配为旧的接口格式
 */
import { checkForUpdates as newCheckForUpdates, openDownloadLink, getUpdateMessage, VersionCheckResult as NewVersionCheckResult } from './versionService';

// 旧的接口格式（保持向后兼容）
export interface LegacyVersionCheckResult {
  hasUpdate: boolean;
  needsUpdate: boolean;
  currentVersion: string;
  localVersion: string;
  latestVersion?: string;
  isForceUpdate: boolean;
  message: string;
  error?: string;
  updateInfo?: {
    updateLog?: string;
    downloadUrl: string;
    version?: string;
    releaseNotes?: string;
    fileSize?: string;
    downloadLinks?: {
      official?: string;
    };
    id?: number;
    updatedAt?: string;
  };
  versionInfo?: {
    version: string;
    downloadUrl: string;
    releaseNotes?: string;
    forceUpdate: boolean;
    publishedAt: string;
  };
}

/**
 * 将新接口转换为旧接口格式
 */
function adaptVersionResult(newResult: NewVersionCheckResult): LegacyVersionCheckResult {
  return {
    hasUpdate: newResult.hasUpdate,
    needsUpdate: newResult.hasUpdate,
    currentVersion: newResult.currentVersion,
    localVersion: newResult.localVersion,
    latestVersion: newResult.currentVersion,
    isForceUpdate: newResult.hasUpdate,
    message: newResult.hasUpdate ? `发现新版本 ${newResult.currentVersion}` : '当前已是最新版本',
    updateInfo: newResult.updateInfo ? {
      ...newResult.updateInfo,
      version: newResult.currentVersion,
      releaseNotes: newResult.updateInfo.updateLog,
      fileSize: '未知',
      downloadLinks: {
        official: newResult.updateInfo.downloadUrl
      },
      id: 0,
      updatedAt: newResult.updateInfo.updatedAt
    } : undefined,
    versionInfo: newResult.updateInfo ? {
      version: newResult.currentVersion,
      downloadUrl: newResult.updateInfo.downloadUrl,
      releaseNotes: newResult.updateInfo.updateLog,
      forceUpdate: newResult.hasUpdate,
      publishedAt: newResult.updateInfo.updatedAt || new Date().toISOString()
    } : undefined
  };
}

/**
 * 兼容性版本检查函数
 * 现在使用后端版本比较逻辑
 */
export async function checkForUpdates(): Promise<LegacyVersionCheckResult> {
  try {
    console.log('🔄 开始版本检查（使用后端比较逻辑）');
    const newResult = await newCheckForUpdates();
    console.log('✅ 版本检查完成，结果:', newResult);
    return adaptVersionResult(newResult);
  } catch (error) {
    console.error('❌ 版本检查失败:', error);
    return {
      hasUpdate: false,
      needsUpdate: false,
      currentVersion: '未知',
      localVersion: '未知',
      latestVersion: '未知',
      isForceUpdate: false,
      message: '版本检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 兼容性版本服务对象
 */
export const versionService = {
  checkForUpdates,
  openDownloadLink,
  clearCache: () => {
    console.log('版本服务缓存已清理（兼容性方法）');
  },
  getCurrentAppVersion: async () => {
    const { getVersion } = await import('@tauri-apps/api/app');
    return await getVersion();
  }
};

export type VersionCheckResult = LegacyVersionCheckResult;