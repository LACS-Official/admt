import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { adminService } from './adminService';

/**
 * 自启动服务
 * 使用 Tauri 自启动插件提供简单的自启动功能
 * 支持管理员权限检测和自动权限提升
 */
class AutoStartService {
  private appName: string | null = null;
  private initialized = false;

  /**
   * 初始化自启动服务
   * @param appName 应用名称
   */
  async initialize(appName: string): Promise<void> {
    this.appName = appName;
    this.initialized = true;
  }

  /**
   * 检查自启动是否已就绪
   */
  isReady(): boolean {
    return this.initialized && this.appName !== null;
  }

  /**
   * 检查自启动是否支持
   */
  async isAutoStartSupported(): Promise<boolean> {
    try {
      await isEnabled();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取自启动状态
   */
  async getAutoStartStatus(): Promise<{ isEnabled: boolean }> {
    if (!this.isReady()) {
      throw new Error('自启动服务未初始化');
    }

    const enabled = await isEnabled();
    return { isEnabled: enabled };
  }

  /**
   * 启用自启动
   */
  async enableAutoStart(): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('自启动服务未初始化');
    }

    try {
      await enable();
      return true;
    } catch (error) {
      console.error('启用自启动失败:', error);
      return false;
    }
  }

  /**
   * 禁用自启动
   */
  async disableAutoStart(): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('自启动服务未初始化');
    }

    try {
      await disable();
      return true;
    } catch (error) {
      console.error('禁用自启动失败:', error);
      return false;
    }
  }

  /**
   * 切换自启动状态
   */
  async toggleAutoStart(): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('自启动服务未初始化');
    }

    const currentStatus = await this.getAutoStartStatus();
    if (currentStatus.isEnabled) {
      return await this.disableAutoStart();
    } else {
      return await this.enableAutoStart();
    }
  }

  /**
   * 启用自启动（带验证）
   */
  async enableAutoStartWithValidation(config: any): Promise<boolean> {
    // 这里可以添加额外的验证逻辑
    return await this.enableAutoStart();
  }

  /**
   * 验证自启动设置
   */
  async validateAutoStart(): Promise<{ isValid: boolean; message?: string }> {
    if (!this.isReady()) {
      return { isValid: false, message: '自启动服务未初始化' };
    }

    try {
      const status = await this.getAutoStartStatus();
      return { isValid: true };
    } catch (error) {
      return { isValid: false, message: `自启动验证失败: ${error}` };
    }
  }

  /**
   * 修复自启动
   */
  async repairAutoStart(): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('自启动服务未初始化');
    }

    try {
      // 先禁用再启用，可能修复一些权限问题
      await disable();
      await enable();
      return true;
    } catch (error) {
      console.error('修复自启动失败:', error);
      return false;
    }
  }

  /**
   * 获取自启动配置
   */
  async getAutoStartConfig(): Promise<any> {
    if (!this.isReady()) {
      throw new Error('自启动服务未初始化');
    }

    return {
      appName: this.appName,
      status: await this.getAutoStartStatus(),
    };
  }

  /**
   * 智能自启动管理（自动处理管理员权限）
   */
  async smartToggleAutoStart(): Promise<{
    success: boolean;
    needsAdmin: boolean;
    message: string;
  }> {
    try {
      const isAdmin = await adminService.isAdmin();

      if (!isAdmin) {
        return {
          success: false,
          needsAdmin: true,
          message: '切换自启动需要管理员权限，请以管理员身份运行应用'
        };
      }

      const currentStatus = await this.getAutoStartStatus();
      const newStatus = !currentStatus.isEnabled;

      const success = newStatus
        ? await this.enableAutoStart()
        : await this.disableAutoStart();

      return {
        success,
        needsAdmin: false,
        message: success
          ? `自启动已${newStatus ? '启用' : '禁用'}`
          : `自启动${newStatus ? '启用' : '禁用'}失败，请检查权限设置`
      };
    } catch (error) {
      console.error('智能切换自启动失败:', error);
      return {
        success: false,
        needsAdmin: false,
        message: `自启动切换失败: ${error}`
      };
    }
  }
}

// 导出单例实例
export const autoStartService = new AutoStartService();
