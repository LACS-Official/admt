/**
 * 小米解锁工具服务类
 * 重构点：将复杂的工具执行逻辑提取为服务类，提高代码组织性和可测试性
 */

import { invoke } from '@tauri-apps/api/core';
import { DeviceInfo } from '../../../types/device';
import { TOOL_CONFIGS, POSSIBLE_TOOL_PATHS } from './constants';
import { checkFileExists } from './utils';
import { logService } from '../../../services/logService';

export interface StatusMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export class UnlockService {
  /**
   * 执行解锁工具
   * 重构点：将解锁工具执行逻辑封装为类方法，便于维护和测试
   */
  static async executeUnlockTool(
    toolId: string,
    device: DeviceInfo,
    onStatusUpdate: (status: StatusMessage) => void,
    appStore?: any // 传入 store 以便切换视图
  ): Promise<void> {
    if (!device) {
      onStatusUpdate({
        type: 'warning',
        message: '请先选择或连接设备后再执行该操作'
      });
      return;
    }

    const toolConfig = TOOL_CONFIGS[toolId];
    if (!toolConfig) {
      onStatusUpdate({
        type: 'error',
        message: '未知的工具类型'
      });
      return;
    }

    onStatusUpdate({
      type: 'success',
      message: '正在检测工具路径...'
    });

    try {
      // 查找工具路径
      const toolPath = await this.findToolPath(toolConfig.folder);
      if (!toolPath) {
        await logService.error(`找不到工具目录: ${toolConfig.folder}`, '解锁工具服务', { toolId, toolName: toolConfig.name });
        onStatusUpdate({
          type: 'error',
          message: `找不到${toolConfig.folder}文件夹，3秒后将为您跳转到在线资源下载<${toolConfig.name}>`
        });

        // 3秒后跳转
        if (appStore) {
          setTimeout(() => {
            appStore.setCurrentView('online-resources');
          }, 3000);
        }
        return;
      }

      await logService.info(`检测到工具目录: ${toolPath}`, '解锁工具服务', { toolId, toolName: toolConfig.name });

      // 验证配置文件
      const configPath = `${toolPath}/${toolConfig.configFile}`;
      const configExists = await checkFileExists(configPath);
      if (!configExists) {
        await logService.error(`配置文件缺失: ${configPath}`, '解锁工具服务', { toolId });
        onStatusUpdate({
          type: 'error',
          message: `在 ${toolConfig.folder} 中找不到配置文件 ${toolConfig.configFile}，请确保工具已通过在线资源完整下载并解压`
        });
        return;
      }
      await logService.info(`配置文件验证通过: ${configPath}`, '解锁工具服务');

      // 读取配置文件
      const configData = await this.readConfigFile(configPath);
      if (!configData) {
        onStatusUpdate({
          type: 'error',
          message: '读取配置文件失败，JSON 格式可能不正确'
        });
        return;
      }

      // 获取可执行文件名
      const executableName = this.getExecutableName(toolId, configData);
      if (!executableName) {
        onStatusUpdate({
          type: 'error',
          message: `配置文件中未定义可执行文件名`
        });
        return;
      }

      // 验证可执行文件
      const executablePath = `${toolPath}/${executableName}`;
      const executableExists = await checkFileExists(executablePath);
      if (!executableExists) {
        await logService.error(`可执行文件缺失: ${executablePath}`, '解锁工具服务', { toolId });
        onStatusUpdate({
          type: 'error',
          message: `找不到可执行文件: ${executableName}，请检查文件夹内容`
        });
        return;
      }
      await logService.info(`准备执行程序: ${executablePath}`, '解锁工具服务');

      // 执行程序
      await this.executeProgram(executablePath);
      
      onStatusUpdate({
        type: 'success',
        message: '工具已成功启动'
      });

    } catch (error) {
      onStatusUpdate({
        type: 'error',
        message: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
      throw error;
    }
  }

  /**
   * 查找工具路径
   * 重构点：将路径查找逻辑提取为独立方法
   */
  private static async findToolPath(folderName: string): Promise<string | null> {
    const { invoke } = await import('@tauri-apps/api/core');
    
    // 1. 首先尝试从后端获取统一的下载目录
    try {
      const downloadDir = await invoke('get_default_download_directory') as string;
      if (downloadDir) {
        const fullPath = `${downloadDir}/${folderName}`;
        const exists = await checkFileExists(fullPath);
        if (exists) return fullPath;
      }
    } catch (e) {
      logService.warning('获取默认下载目录失败', '解锁工具服务', { error: String(e) });
    }

    // 2. 遍历可能的相对路径
    for (const basePath of POSSIBLE_TOOL_PATHS) {
      const fullPath = `${basePath}/${folderName}`;
      try {
        const exists = await checkFileExists(fullPath);
        if (exists) {
          return fullPath;
        }
      } catch (error) {
        logService.warning(`检查路径失败: ${fullPath}`, '解锁工具服务', { error: String(error) });
      }
    }
    return null;
  }

  /**
   * 读取配置文件
   * 重构点：将配置文件读取逻辑提取为独立方法
   */
  private static async readConfigFile(configPath: string): Promise<any | null> {
    try {
      return await invoke<any>('read_json_file', { path: configPath });
    } catch (error) {
      logService.error(`读取配置文件失败: ${configPath}`, '解锁工具服务', { error: String(error) });
      return null;
    }
  }

  /**
   * 获取可执行文件名
   * 重构点：将可执行文件名获取逻辑提取为独立方法
   */
  private static getExecutableName(toolId: string, configData: any): string | null {
    if (toolId === 'bypass_unlock') {
      return configData.openname;
    } else {
      return configData.executable || configData.openname;
    }
  }

  /**
   * 执行程序
   * 重构点：将程序执行逻辑提取为独立方法
   */
  private static async executeProgram(executablePath: string): Promise<void> {
    try {
      const result = await invoke<any>('execute_script_in_new_window', {
        scriptPath: executablePath
      });

      if (!result.success) {
        throw new Error(result.error || '程序启动失败');
      }
      await logService.info(`程序启动成功: ${executablePath}`, '解锁工具服务');
    } catch (error) {
      await logService.error(`程序执行失败: ${executablePath}`, '解锁工具服务', { error: String(error) });
      throw error;
    }
  }
}