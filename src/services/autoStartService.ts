/**
 * 开机自启动服务
 * 提供检测、添加、删除开机自启动功能
 * 支持 Windows 注册表和启动文件夹两种方式
 */

import { invoke } from '@tauri-apps/api/core';

export interface AutoStartConfig {
  appName: string;
  appPath: string;
  args?: string[];
  enabled: boolean;
}

export interface AutoStartStatus {
  isEnabled: boolean;
  method: 'registry' | 'startup-folder' | 'none';
  path?: string;
  error?: string;
}

/**
 * 开机自启动管理类
 */
export class AutoStartService {
  private static instance: AutoStartService;
  private currentPlatform: string = '';
  private appName: string = '玩机管家';
  private isInitialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): AutoStartService {
    if (!AutoStartService.instance) {
      AutoStartService.instance = new AutoStartService();
    }
    return AutoStartService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(appName?: string): Promise<void> {
    try {
      // 使用简单的平台检测
      this.currentPlatform = this.detectPlatform();
      if (appName) {
        this.appName = appName;
      }
      this.isInitialized = true;
      console.log(`✅ 自启动服务初始化成功 (平台: ${this.currentPlatform})`);
    } catch (error) {
      console.error('❌ 自启动服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检测当前平台
   */
  private detectPlatform(): string {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) return 'windows';
      if (userAgent.includes('mac')) return 'macos';
      if (userAgent.includes('linux')) return 'linux';
    }
    return 'unknown';
  }

  /**
   * 检查当前自启动状态
   */
  async getAutoStartStatus(): Promise<AutoStartStatus> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const status = await invoke<AutoStartStatus>('get_auto_start_status', {
        appName: this.appName
      });

      console.log('📋 自启动状态:', status);
      return status;
    } catch (error) {
      console.error('❌ 获取自启动状态失败:', error);
      return {
        isEnabled: false,
        method: 'none',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 启用开机自启动
   */
  async enableAutoStart(config?: Partial<AutoStartConfig>): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const defaultConfig: AutoStartConfig = {
        appName: this.appName,
        appPath: await this.getCurrentAppPath(),
        args: [],
        enabled: true
      };

      const finalConfig = { ...defaultConfig, ...config };

      const success = await invoke<boolean>('enable_auto_start', finalConfig);

      if (success) {
        console.log('✅ 开机自启动已启用');
      } else {
        console.warn('⚠️ 开机自启动启用失败');
      }

      return success;
    } catch (error) {
      console.error('❌ 启用开机自启动失败:', error);
      throw error;
    }
  }

  /**
   * 禁用开机自启动
   */
  async disableAutoStart(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const success = await invoke<boolean>('disable_auto_start', {
        appName: this.appName
      });

      if (success) {
        console.log('✅ 开机自启动已禁用');
      } else {
        console.warn('⚠️ 开机自启动禁用失败');
      }

      return success;
    } catch (error) {
      console.error('❌ 禁用开机自启动失败:', error);
      throw error;
    }
  }

  /**
   * 切换自启动状态
   */
  async toggleAutoStart(): Promise<boolean> {
    try {
      const status = await this.getAutoStartStatus();
      
      if (status.isEnabled) {
        return await this.disableAutoStart();
      } else {
        return await this.enableAutoStart();
      }
    } catch (error) {
      console.error('❌ 切换自启动状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前应用路径
   */
  private async getCurrentAppPath(): Promise<string> {
    try {
      return await invoke<string>('get_current_app_path');
    } catch (error) {
      console.error('❌ 获取应用路径失败:', error);
      throw error;
    }
  }

  /**
   * 检查是否支持自启动功能
   */
  async isAutoStartSupported(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await invoke<boolean>('is_auto_start_supported');
    } catch (error) {
      console.error('❌ 检查自启动支持失败:', error);
      return false;
    }
  }

  /**
   * 获取自启动配置信息
   */
  async getAutoStartConfig(): Promise<AutoStartConfig | null> {
    try {
      const status = await this.getAutoStartStatus();
      
      if (!status.isEnabled) {
        return null;
      }

      return await invoke<AutoStartConfig>('get_auto_start_config', {
        appName: this.appName
      });
    } catch (error) {
      console.error('❌ 获取自启动配置失败:', error);
      return null;
    }
  }

  /**
   * 验证自启动设置
   */
  async validateAutoStart(): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      const result = await invoke<{ isValid: boolean; issues: string[] }>('validate_auto_start', {
        appName: this.appName
      });

      if (result.isValid) {
        console.log('✅ 自启动设置验证通过');
      } else {
        console.warn('⚠️ 自启动设置验证失败:', result.issues);
      }

      return result;
    } catch (error) {
      console.error('❌ 验证自启动设置失败:', error);
      return {
        isValid: false,
        issues: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * 修复自启动设置
   */
  async repairAutoStart(): Promise<boolean> {
    try {
      console.log('🔧 正在修复自启动设置...');
      
      // 先禁用现有设置
      await this.disableAutoStart();
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新启用
      const success = await this.enableAutoStart();
      
      if (success) {
        console.log('✅ 自启动设置修复成功');
      } else {
        console.error('❌ 自启动设置修复失败');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 修复自启动设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取平台信息
   */
  getPlatform(): string {
    return this.currentPlatform;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// 导出单例实例
export const autoStartService = AutoStartService.getInstance();