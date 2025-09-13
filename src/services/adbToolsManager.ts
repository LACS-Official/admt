import { invoke } from "@tauri-apps/api/core";
import { logService } from "./logService";

export interface AdbToolsInfo {
  adbPath: string | null;
  fastbootPath: string | null;
  isAvailable: boolean;
  version?: string;
  error?: string;
}

export class AdbToolsManager {
  private static instance: AdbToolsManager | null = null;
  private adbInfo: AdbToolsInfo = {
    adbPath: null,
    fastbootPath: null,
    isAvailable: false
  };
  private initialized = false;

  private constructor() {}

  static getInstance(): AdbToolsManager {
    if (!AdbToolsManager.instance) {
      AdbToolsManager.instance = new AdbToolsManager();
    }
    return AdbToolsManager.instance;
  }

  /**
   * 初始化ADB工具路径
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await logService.info('正在初始化ADB工具...', '系统');
      
      // 通过Rust后端获取打包后的ADB工具路径
      const adbInfo = await invoke<AdbToolsInfo>('get_adb_tools_info');
      
      this.adbInfo = adbInfo;
      this.initialized = true;

      if (this.adbInfo.isAvailable) {
        await logService.info(`ADB工具初始化成功: ${this.adbInfo.adbPath}`, '系统');
        
        // 验证ADB版本
        if (this.adbInfo.version) {
          await logService.info(`ADB版本: ${this.adbInfo.version}`, '系统');
        }
      } else {
        const errorMsg = this.adbInfo.error || '未知错误';
        await logService.error(`ADB工具初始化失败: ${errorMsg}`, '系统');
        throw new Error(`ADB工具初始化失败: ${errorMsg}`);
      }
    } catch (error) {
      this.initialized = false;
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      await logService.error(`ADB工具初始化异常: ${errorMsg}`, '系统');
      throw new Error(`ADB工具初始化失败: ${errorMsg}`);
    }
  }

  /**
   * 检查ADB工具是否可用
   */
  async checkAvailability(): Promise<boolean> {
    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error) {
        return false;
      }
    }
    return this.adbInfo.isAvailable;
  }

  /**
   * 获取ADB工具信息
   */
  getAdbInfo(): AdbToolsInfo {
    return { ...this.adbInfo };
  }

  /**
   * 获取ADB可执行文件路径
   */
  getAdbPath(): string | null {
    return this.adbInfo.adbPath;
  }

  /**
   * 获取Fastboot可执行文件路径
   */
  getFastbootPath(): string | null {
    return this.adbInfo.fastbootPath;
  }

  /**
   * 执行需要ADB工具的操作，带降级处理
   */
  async executeWithFallback<T>(operation: () => Promise<T>): Promise<T> {
    if (!await this.checkAvailability()) {
      throw new Error('ADB工具不可用，请检查安装包完整性');
    }

    try {
      return await operation();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      
      // 记录错误并提供用户友好的错误信息
      await logService.error(`ADB操作失败: ${errorMsg}`, '设备');
      
      // 检查是否是设备连接问题
      if (errorMsg.includes('device not found') || errorMsg.includes('no devices/emulators found')) {
        throw new Error('未找到设备，请确保设备已连接并启用USB调试');
      }
      
      // 检查是否是权限问题
      if (errorMsg.includes('permission denied') || errorMsg.includes('unauthorized')) {
        throw new Error('设备未授权，请在设备上确认USB调试授权');
      }
      
      // 其他错误
      throw new Error(`设备操作失败: ${errorMsg}`);
    }
  }

  /**
   * 重新初始化ADB工具
   */
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.adbInfo = {
      adbPath: null,
      fastbootPath: null,
      isAvailable: false
    };
    await this.initialize();
  }

  /**
   * 验证ADB工具文件完整性
   */
  async verifyIntegrity(): Promise<{ success: boolean; missing: string[] }> {
    try {
      const result = await invoke<{ success: boolean; missing: string[] }>('verify_adb_tools_integrity');
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      await logService.error(`ADB工具完整性验证失败: ${errorMsg}`, '系统');
      return {
        success: false,
        missing: ['验证失败']
      };
    }
  }

  /**
   * 获取ADB工具状态报告
   */
  async getStatusReport(): Promise<{
    initialized: boolean;
    available: boolean;
    adbPath: string | null;
    fastbootPath: string | null;
    version: string | null;
    integrity: { success: boolean; missing: string[] };
    error: string | null;
  }> {
    const integrity = await this.verifyIntegrity();
    
    return {
      initialized: this.initialized,
      available: this.adbInfo.isAvailable,
      adbPath: this.adbInfo.adbPath,
      fastbootPath: this.adbInfo.fastbootPath,
      version: this.adbInfo.version || null,
      integrity,
      error: this.adbInfo.error || null
    };
  }
}

// 导出单例实例
export const adbToolsManager = AdbToolsManager.getInstance();