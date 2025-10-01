import { invoke } from '@tauri-apps/api/core';

/**
 * 管理员权限管理服务
 * 处理应用程序的管理员权限检测、请求和自启动管理
 */
class AdminService {
  private static instance: AdminService;

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * 检查当前进程是否以管理员权限运行
   */
  async isAdmin(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_admin');
    } catch (error) {
      console.error('检查管理员权限失败:', error);
      return false;
    }
  }

  /**
   * 以管理员权限重新启动应用程序
   */
  async restartAsAdmin(): Promise<boolean> {
    try {
      return await invoke<boolean>('restart_as_admin');
    } catch (error) {
      console.error('重新启动管理员权限失败:', error);
      throw error;
    }
  }

  /**
   * 获取自启动配置信息
   */
  async getAutostartConfig(): Promise<{
    enabled: boolean;
    path: string;
    registry_path: string;
  }> {
    try {
      const config = await invoke<any>('get_autostart_config');
      return {
        enabled: config.enabled,
        path: config.path,
        registry_path: config.registry_path || ''
      };
    } catch (error) {
      console.error('获取自启动配置失败:', error);
      return {
        enabled: false,
        path: '',
        registry_path: ''
      };
    }
  }

  /**
   * 设置自启动状态（需要管理员权限）
   */
  async setAutostartEnabled(enabled: boolean): Promise<boolean> {
    try {
      return await invoke<boolean>('set_autostart_enabled', { enabled });
    } catch (error) {
      console.error('设置自启动失败:', error);
      throw error;
    }
  }

  /**
   * 检查系统兼容性
   */
  async checkSystemCompatibility(): Promise<{
    platform: string;
    arch: string;
    tauri_version: string;
    is_admin: boolean;
    exe_path: string;
    admin_required_features: string[];
  }> {
    try {
      return await invoke<any>('check_system_compatibility');
    } catch (error) {
      console.error('检查系统兼容性失败:', error);
      return {
        platform: 'unknown',
        arch: 'unknown',
        tauri_version: 'unknown',
        is_admin: false,
        exe_path: '',
        admin_required_features: []
      };
    }
  }

  /**
   * 请求管理员权限并重新启动（用户友好的方法）
   */
  async requestAdminPrivileges(): Promise<void> {
    const isAdmin = await this.isAdmin();

    if (isAdmin) {
      console.log('应用已在管理员权限下运行');
      return;
    }

    const confirmed = window.confirm(
      '某些功能需要管理员权限才能正常工作。\n\n' +
      '点击确定将以管理员权限重新启动应用。\n' +
      '如果取消，某些功能可能无法正常使用。'
    );

    if (confirmed) {
      try {
        await this.restartAsAdmin();
      } catch (error) {
        console.error('请求管理员权限失败:', error);
        throw new Error('无法获取管理员权限，请手动以管理员身份运行应用');
      }
    } else {
      throw new Error('用户取消了管理员权限请求');
    }
  }

  /**
   * 智能设置自启动（自动处理权限问题）
   */
  async smartSetAutostart(enabled: boolean): Promise<{
    success: boolean;
    needs_admin: boolean;
    message: string;
  }> {
    try {
      const isAdmin = await this.isAdmin();

      if (!isAdmin) {
        return {
          success: false,
          needs_admin: true,
          message: '设置自启动需要管理员权限，请先以管理员身份运行应用'
        };
      }

      const success = await this.setAutostartEnabled(enabled);

      return {
        success,
        needs_admin: false,
        message: success
          ? `自启动已${enabled ? '启用' : '禁用'}`
          : `自启动${enabled ? '启用' : '禁用'}失败，请检查权限设置`
      };
    } catch (error) {
      console.error('智能设置自启动失败:', error);
      return {
        success: false,
        needs_admin: false,
        message: `自启动设置失败: ${error}`
      };
    }
  }
}

// 导出单例实例
export const adminService = AdminService.getInstance();
