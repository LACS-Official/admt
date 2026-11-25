import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

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

// 更新下载进度
export interface UpdateDownloadProgress {
  downloadedBytes: number;
  totalBytes: number | null; // null = 服务器未返回总长
  percent: number | null;
}

/**
 * 应用内更新：检查 → 下载（带进度）→ 安装 → 重启
 * 走 tauri-plugin-updater，签名包来自 GitHub Releases latest.json。
 * 返回 false 表示上游无可用更新包（如 latest.json 未产出），调用方应回退到官网下载。
 */
export async function downloadAndInstallUpdate(
  onProgress?: (p: UpdateDownloadProgress) => void
): Promise<boolean> {
  const update = await check();
  if (!update) {
    console.log('[更新] 上游未返回可用更新包，回退官网下载');
    return false;
  }

  console.log(`[更新] 发现更新包 ${update.version}，开始下载`);
  let downloaded = 0;
  let total: number | null = null;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        total = event.data.contentLength ?? null;
        onProgress?.({ downloadedBytes: 0, totalBytes: total, percent: total ? 0 : null });
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        onProgress?.({
          downloadedBytes: downloaded,
          totalBytes: total,
          percent: total ? Math.min(100, Math.round((downloaded / total) * 1000) / 10) : null,
        });
        break;
      case 'Finished':
        onProgress?.({ downloadedBytes: downloaded, totalBytes: total, percent: 100 });
        break;
    }
  });

  console.log('[更新] 下载并安装完成，即将重启应用');
  await relaunch();
  return true;
}
