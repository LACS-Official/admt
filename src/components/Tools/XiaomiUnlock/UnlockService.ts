/**
 * 小米解锁工具服务类
 * 重构点：将复杂的工具执行逻辑提取为服务类，提高代码组织性和可测试性
 */

import { invoke } from '@tauri-apps/api/core';
import { DeviceInfo } from '../../../types/device';
import { TOOL_CONFIGS, POSSIBLE_TOOL_PATHS } from './constants';
import { checkFileExists } from './utils';

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
    onStatusUpdate: (status: StatusMessage) => void
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
      message: '成功'
    });

    try {
      // 查找工具路径
      const toolPath = await this.findToolPath(toolConfig.folder);
      if (!toolPath) {
        onStatusUpdate({
          type: 'error',
          message: `找不到${toolConfig.folder}文件夹，请前往在线资源下载<${toolConfig.name}>`
        });
        return;
      }

      // 验证配置文件
      const configPath = `${toolPath}/${toolConfig.configFile}`;
      const configExists = await checkFileExists(configPath);
      if (!configExists) {
        onStatusUpdate({
          type: 'error',
          message: '找不到配置文件，请重新下载文件'
        });
        return;
      }

      // 读取配置文件
      const configData = await this.readConfigFile(configPath);
      if (!configData) {
        onStatusUpdate({
          type: 'error',
          message: '读取配置文件失败'
        });
        return;
      }

      // 获取可执行文件名
      const executableName = this.getExecutableName(toolId, configData);
      if (!executableName) {
        onStatusUpdate({
          type: 'error',
          message: `找不到 ${executableName}`
        });
        return;
      }

      // 验证可执行文件
      const executablePath = `${toolPath}/${executableName}`;
      const executableExists = await checkFileExists(executablePath);
      if (!executableExists) {
        onStatusUpdate({
          type: 'error',
          message: `找不到 ${executableName}`
        });
        return;
      }

      // 执行程序
      await this.executeProgram(executablePath);
      
      onStatusUpdate({
        type: 'success',
        message: '打开成功'
      });

    } catch (error) {
      onStatusUpdate({
        type: 'error',
        message: '找不到'
      });
      throw error;
    }
  }

  /**
   * 查找工具路径
   * 重构点：将路径查找逻辑提取为独立方法
   */
  private static async findToolPath(folderName: string): Promise<string | null> {
    for (const basePath of POSSIBLE_TOOL_PATHS) {
      const fullPath = `${basePath}/${folderName}`;
      try {
        const exists = await checkFileExists(fullPath);
        if (exists) {
          return fullPath;
        }
      } catch (error) {
        console.warn(`检查路径失败: ${fullPath}`, error);
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
      console.error(`读取配置文件失败: ${configPath}`, error);
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
    } catch (error) {
      console.error(`程序执行失败: ${executablePath}`, error);
      throw error;
    }
  }
}