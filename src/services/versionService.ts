import { getVersion } from '@tauri-apps/api/app';

// API响应数据结构
interface VersionResponse {
  success: boolean;
  data: {
    version: {
      currentVersion: string;
      updateLog?: string;
      downloadUrl?: string;
    };
  };
  message?: string;
}

// 版本检查结果
export interface VersionCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  localVersion: string;
  updateInfo?: {
    updateLog?: string;
    downloadUrl: string;
  };
}

/**
 * 比较版本号 - 优化版本比较逻辑
 * @param remoteVersion 远程版本（API返回的currentVersion）
 * @param localVersion 本地版本
 * @returns true: 远程版本大于本地版本（需要更新）, false: 不需要更新
 */
function isUpdateRequired(remoteVersion: string, localVersion: string): boolean {
  // 清理版本号，移除可能的前缀（如 'v'）和后缀
  const cleanRemote = remoteVersion.replace(/^v/, '').trim();
  const cleanLocal = localVersion.replace(/^v/, '').trim();
  
  // 分割版本号并转换为数字数组
  const remoteParts = cleanRemote.split('.').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
  
  const localParts = cleanLocal.split('.').map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
  
  // 确保两个版本号长度一致，不足的部分补0
  const maxLength = Math.max(remoteParts.length, localParts.length);
  while (remoteParts.length < maxLength) remoteParts.push(0);
  while (localParts.length < maxLength) localParts.push(0);
  
  // 逐位比较版本号
  for (let i = 0; i < maxLength; i++) {
    if (remoteParts[i] > localParts[i]) {
      return true; // 远程版本更高，需要更新
    } else if (remoteParts[i] < localParts[i]) {
      return false; // 本地版本更高，不需要更新
    }
    // 如果相等，继续比较下一位
  }
  
  return false; // 版本完全相同，不需要更新
}

/**
 * 检查版本更新 - 优化后的版本检测逻辑
 * 仅通过GET请求访问API，当currentVersion大于本地版本时触发更新
 * @returns Promise<VersionCheckResult>
 */
export async function checkForUpdates(): Promise<VersionCheckResult> {
  try {
    // 获取本地应用版本
    const localVersion = await getVersion();
    
    // 发送GET请求到版本检查API
    const response = await fetch('https://api-g.lacs.cc/app/software/id/1', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ADMT-App'
      },
      // 设置超时时间
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
    
    // 检查HTTP响应状态
    if (!response.ok) {
      throw new Error(`API请求失败: HTTP ${response.status} - ${response.statusText}`);
    }
    
    // 解析JSON响应
    let data: VersionResponse;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }
    
    // 验证API响应结构和必要字段
    if (!data || typeof data !== 'object') {
      throw new Error('API响应格式无效: 响应不是有效的对象');
    }
    
    if (!data.success) {
      throw new Error(`API返回错误: ${data.message || '未知错误'}`);
    }
    
    if (!data.data || !data.data.version || !data.data.version.currentVersion) {
      throw new Error('API响应格式无效: 缺少必要的版本信息字段');
    }
    
    const currentVersion = data.data.version.currentVersion;
    
    // 验证版本号格式
    if (typeof currentVersion !== 'string' || !currentVersion.trim()) {
      throw new Error('API返回的版本号格式无效');
    }
    
    // 检查是否需要更新（currentVersion > localVersion）
    const hasUpdate = isUpdateRequired(currentVersion, localVersion);
    
    // 构建返回结果 - 不解析API的updateLog和downloadUrl，使用固定值
    const result: VersionCheckResult = {
      hasUpdate,
      currentVersion: currentVersion.trim(),
      localVersion: localVersion.trim(),
      updateInfo: hasUpdate ? {
        updateLog: '请在下载页面查看相关内容', // 固定提示信息
        downloadUrl: 'https://admt.lacs.cc/download' // 固定下载链接
      } : undefined
    };
    
    // 记录版本检查结果
    console.log('版本检查完成:', {
      本地版本: result.localVersion,
      远程版本: result.currentVersion,
      需要更新: result.hasUpdate
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
 * @param url 下载链接，默认使用官方下载页面
 */
export async function openDownloadLink(url: string = 'https://admt.lacs.cc/download'): Promise<void> {
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
    downloadUrl: 'https://admt.lacs.cc/download' // 固定使用默认下载链接
  };
}