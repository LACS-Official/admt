import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

// API响应数据结构 - 根据实际API返回的结构
interface VersionResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    currentVersion: string;
    officialWebsite?: string;
    latestDownloadUrl?: string;
    [key: string]: any; // 其他字段
  };
  message?: string;
}

// Rust后端返回的版本检查结果
interface RustUpdateCheckResult {
  has_update: boolean;
  current_version: string;
  latest_version?: string;
  download_url?: string;
  release_notes?: string;
  updated_at?: string;
  error?: string;
}

// 版本检查结果
export interface VersionCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  localVersion: string;
  updateInfo?: {
    updateLog?: string;
    downloadUrl: string;
    updatedAt?: string;
  };
}

/**
 * 检查版本更新 - 使用Rust后端的版本检测逻辑
 * 调用后端check_for_updates命令，由后端完成版本比较
 * @returns Promise<VersionCheckResult>
 */
export async function checkForUpdates(): Promise<VersionCheckResult> {
  try {
    // 获取本地应用版本
    const localVersion = await getVersion();
    
    // 调用Rust后端的版本检查命令
    const rustResult = await invoke<RustUpdateCheckResult>('check_for_updates');
    
    // 检查后端返回结果
    if (rustResult.error) {
      throw new Error(rustResult.error);
    }
    
    // 构建返回结果
    const result: VersionCheckResult = {
      hasUpdate: rustResult.has_update,
      currentVersion: rustResult.latest_version || rustResult.current_version,
      localVersion: localVersion.trim(),
      updateInfo: rustResult.has_update ? {
        updateLog: rustResult.release_notes || '请在下载页面查看相关内容',
        downloadUrl: rustResult.download_url || 'https://admt.lacs.cc',
        updatedAt: rustResult.updated_at
      } : undefined
    };
    
    // 记录版本检查结果
    console.log('版本检查完成 (后端比较):', {
      本地版本: result.localVersion,
      远程版本: result.currentVersion,
      需要更新: result.hasUpdate,
      更新时间: result.updateInfo?.updatedAt
    });
    
    return result;
    
  } catch (error) {
    // 详细的错误日志
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('版本检查失败:', {
      错误信息: errorMessage,
      错误对象: error,
      时间戳: new Date().toISOString()
    });
    
    // 重新抛出错误，让调用方处理
    throw new Error(`版本检查失败: ${errorMessage}`);
  }
}

/**
 * 打开下载链接 - 在默认浏览器中打开下载页面
 * @param url 下载链接，默认使用官方网站
 */
export async function openDownloadLink(url: string = 'https://admt.lacs.cc'): Promise<void> {
  try {
    // 优先使用Tauri的shell插件打开链接
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(url);
    console.log('已在默认浏览器中打开下载链接:', url);
  } catch (error) {
    console.warn('Tauri shell插件打开链接失败，尝试降级方案:', error);
    
    try {
      // 降级方案：使用window.open
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        throw new Error('浏览器阻止了弹窗');
      }
      console.log('已通过window.open打开下载链接:', url);
    } catch (fallbackError) {
      console.error('所有打开链接的方法都失败了:', fallbackError);
      throw new Error(`无法打开下载链接: ${url}`);
    }
  }
}

/**
 * 获取更新提示信息 - 为强制更新弹窗提供标准化的提示内容
 * @param versionInfo 版本检查结果
 * @returns 格式化的更新提示信息
 */
export function getUpdateMessage(versionInfo: VersionCheckResult): {
  title: string;
  message: string;
  downloadUrl: string;
} {
  return {
    title: '发现新版本',
    message: `检测到新版本 ${versionInfo.currentVersion}（当前版本：${versionInfo.localVersion}）

请在下载页面查看相关内容。

点击"打开下载页面"将在浏览器中打开下载页面。`,
    downloadUrl: 'https://admt.lacs.cc' // 固定使用官方网站
  };
}