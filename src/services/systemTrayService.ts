/**
 * 系统托盘服务
 * 提供最小化到系统托盘的功能，包括托盘图标、右键菜单等
 */

import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';

// 扩展 Window 接口以包含 Tauri 全局对象
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export interface TrayMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  checked?: boolean;
}

export interface TrayConfig {
  tooltip?: string;
  icon?: string;
  menuItems?: TrayMenuItem[];
}

/**
 * 系统托盘管理类
 */
export class SystemTrayService {
  private static instance: SystemTrayService;
  private isInitialized = false;
  private currentWindow: any = null;
  private closeToTrayEnabled = false;
  private closeEventUnlisten?: () => void;
  private windowInitialized = false;

  private constructor() {
    // 不在构造函数中初始化窗口，延迟到需要时再初始化
  }

  private async ensureWindowInitialized() {
    if (!this.windowInitialized) {
      try {
        this.currentWindow = getCurrentWindow();
        this.windowInitialized = true;
      } catch (error) {
        console.warn('无法获取当前窗口:', error);
        this.windowInitialized = true; // 即使失败也标记为已尝试，避免重复尝试
      }
    }
  }

  /**
   * 清理可能存在的子进程/后台任务（容错动态导入）
   */
  private async cleanupChildProcesses(): Promise<void> {
    // 尽量在退出前停止可能的外部工具与后台任务，所有错误均吞掉
    try {
      // 尝试停止屏幕镜像
      try {
        const mod = await import('../services/screenMirrorService');
        const svc = (mod as any).screenMirrorService || (mod as any).default || mod;
        if (svc?.stop && typeof svc.stop === 'function') {
          await svc.stop();
          console.log('🧹 已停止屏幕镜像服务');
        }
      } catch (_) {}

      // 尝试停止 ADB/工具管理器
      try {
        const mod = await import('../services/adbToolsManager');
        const mgr = (mod as any).adbToolsManager || (mod as any).default || mod;
        // 尝试常见的停止方法名
        const stopFns = ['stopAll', 'dispose', 'shutdown', 'stop'];
        for (const fn of stopFns) {
          if (mgr && typeof mgr[fn] === 'function') {
            await mgr[fn]();
            console.log(`🧹 已执行 adbToolsManager.${fn}()`);
            break;
          }
        }
      } catch (_) {}

      // 可在此处按需加入更多需要停止的服务（如日志流、设备监控等）
      // try { const mod = await import('../services/deviceService'); await mod.deviceService?.shutdown?.(); } catch (_) {}

    } catch (err) {
      console.warn('⚠️ 清理子进程时出现问题（已忽略）：', err);
    }
  }

  /**
   * 统一的优雅退出流程：销毁托盘 → 清理子进程 → 退出（插件优先，后端兜底）
   */
  private async performGracefulExit(exitCode: number = 0): Promise<void> {
    console.log('🔄 执行优雅退出流程...');
    // 1) 销毁托盘与事件
    try {
      await this.cleanup();
    } catch (e) {
      console.warn('⚠️ 清理托盘时出现问题（已忽略）：', e);
    }

    // 2) 清理子进程/后台任务
    await this.cleanupChildProcesses();

    // 3) 优先使用插件退出
    try {
      await exit(exitCode);
      return;
    } catch (pluginErr) {
      console.warn('⚠️ 插件退出失败，尝试后端兜底：', pluginErr);
    }

    // 4) 后端兜底：force_exit 优先，其次兼容 exit_app，如均不可用则最终 window.close()
    try {
      try {
        await invoke('force_exit', { exitCode });
        return;
      } catch (_) {
        // 兼容旧命令名
        await invoke('exit_app', { exitCode });
        return;
      }
    } catch (backendErr) {
      console.error('❌ 后端兜底退出失败：', backendErr);
      if (typeof window !== 'undefined') {
        window.close();
      }
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SystemTrayService {
    if (!SystemTrayService.instance) {
      SystemTrayService.instance = new SystemTrayService();
    }
    return SystemTrayService.instance;
  }

  /**
   * 初始化系统托盘
   */
  async initialize(config: TrayConfig = {}): Promise<void> {
    try {
      // 如果已经初始化，先清理旧的托盘
      if (this.isInitialized) {
        console.log('🔄 检测到托盘已存在，先清理旧托盘...');
        await this.cleanup();
        
        // 添加延迟确保清理完成
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const defaultConfig: TrayConfig = {
        tooltip: '玩机管家',
        icon: 'icons/tray-icon.png',
        menuItems: [
          { id: 'show', label: '显示窗口', enabled: true },
          { id: 'separator1', label: '-' },
          { id: 'exit', label: '退出应用', enabled: true }
        ]
      };

      const finalConfig = { ...defaultConfig, ...config };

      // 调用 Tauri 后端创建系统托盘
      await invoke('create_system_tray', {
        tooltip: finalConfig.tooltip,
        icon: finalConfig.icon,
        menuItems: finalConfig.menuItems
      });

      // 监听托盘菜单点击事件
      await this.setupTrayEventListeners();

      this.isInitialized = true;
      console.log('✅ 系统托盘初始化成功');
    } catch (error) {
      console.error('❌ 系统托盘初始化失败:', error);
      throw new Error(`Failed to initialize system tray: ${error}`);
    }
  }

  /**
   * 设置托盘事件监听器
   */
  private async setupTrayEventListeners(): Promise<void> {
    try {
      // 监听托盘菜单点击事件
      await invoke('setup_tray_event_listener');
      
      // 注册事件处理器
      const { listen } = await import('@tauri-apps/api/event');
      
      await listen('tray-menu-click', (event) => {
        this.handleTrayMenuClick(event.payload as string);
      });

      await listen('tray-icon-click', () => {
        this.handleTrayIconClick();
      });

    } catch (error) {
      console.error('❌ 设置托盘事件监听器失败:', error);
      throw error;
    }
  }

  /**
   * 处理托盘菜单点击
   */
  private async handleTrayMenuClick(menuId: string): Promise<void> {
    try {
      switch (menuId) {
        case 'show':
          await this.showWindow();
          break;
        case 'hide':
          await this.hideWindow();
          break;
        case 'exit':
          await this.performGracefulExit(0);
          break;
        default: {
          // 兼容后端 custom-* 菜单ID（某些环境下“退出应用”会被映射为 custom-xxxx）
          const id = String(menuId || '');
          if (
            id === 'custom-退出应用' ||
            id === '退出应用' ||
            id.toLowerCase() === 'exit' ||
            id.startsWith('custom-')
          ) {
            await this.performGracefulExit(0);
          } else {
            console.log(`未处理的托盘菜单点击: ${menuId}`);
          }
          break;
        }
      }
    } catch (error) {
      console.error('❌ 处理托盘菜单点击失败:', error);
    }
  }

  /**
   * 处理托盘图标点击
   */
  private async handleTrayIconClick(): Promise<void> {
    try {
      await this.ensureWindowInitialized();
      if (!this.currentWindow) {
        console.warn('无法获取窗口对象，跳过托盘图标点击处理');
        return;
      }
      
      const isVisible = await this.currentWindow.isVisible();
      if (isVisible) {
        await this.hideWindow();
      } else {
        await this.showWindow();
      }
    } catch (error) {
      console.error('❌ 处理托盘图标点击失败:', error);
    }
  }

  /**
   * 显示窗口
   */
  async showWindow(): Promise<void> {
    try {
      await this.ensureWindowInitialized();
      if (!this.currentWindow) {
        throw new Error('无法获取窗口对象');
      }
      
      await this.currentWindow.show();
      await this.currentWindow.setFocus();
      await this.currentWindow.unminimize();
      console.log('✅ 窗口已显示');
    } catch (error) {
      console.error('❌ 显示窗口失败:', error);
      throw error;
    }
  }

  /**
   * 隐藏窗口
   */
  async hideWindow(): Promise<void> {
    try {
      await this.ensureWindowInitialized();
      if (!this.currentWindow) {
        throw new Error('无法获取窗口对象');
      }
      
      await this.currentWindow.hide();
      console.log('✅ 窗口已隐藏到托盘');
    } catch (error) {
      console.error('❌ 隐藏窗口失败:', error);
      throw error;
    }
  }

  /**
   * 最小化到托盘
   */
  async minimizeToTray(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      await this.hideWindow();
    } catch (error) {
      console.error('❌ 最小化到托盘失败:', error);
      throw error;
    }
  }

  /**
   * 退出应用
   */
  async exitApplication(): Promise<void> {
    await this.performGracefulExit(0);
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('🧹 开始清理系统托盘资源...');
        
        // 移除事件监听器
        if (this.closeEventUnlisten) {
          this.closeEventUnlisten();
          this.closeEventUnlisten = undefined;
        }
        
        // 销毁托盘
        try {
          await invoke('destroy_system_tray');
        } catch (destroyError) {
          console.warn('⚠️ 销毁托盘时出现警告:', destroyError);
        }
        
        this.isInitialized = false;
        this.closeToTrayEnabled = false;
        console.log('✅ 系统托盘已清理');
      }
    } catch (error) {
      console.error('❌ 清理系统托盘失败:', error);
      // 即使清理失败，也要重置状态
      this.isInitialized = false;
      this.closeToTrayEnabled = false;
    }
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 检查系统是否支持托盘功能
   */
  async isSystemTraySupported(): Promise<boolean> {
    try {
      // 检查是否在 Tauri 环境中
      if (typeof window === 'undefined' || !window.__TAURI__) {
        return false;
      }
      
      // 在 Tauri 中，系统托盘通常是支持的
      return true;
    } catch (error) {
      console.error('检查系统托盘支持时出错:', error);
      return false;
    }
  }

  /**
   * 设置窗口关闭时的处理行为
   */
  async setupWindowCloseHandler(enabled: boolean): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('系统托盘服务未初始化');
      }

      this.closeToTrayEnabled = enabled;
      
      // 移除之前的监听器
      if (this.closeEventUnlisten) {
        this.closeEventUnlisten();
        this.closeEventUnlisten = undefined;
      }

      if (enabled) {
        // 设置窗口关闭事件监听
        const { listen } = await import('@tauri-apps/api/event');
        this.closeEventUnlisten = await listen('tauri://close-requested', async (event) => {
          if (this.closeToTrayEnabled && this.isInitialized) {
            // 阻止默认关闭行为
            // 在 Tauri 中，需要通过 API 来阻止窗口关闭
            await this.minimizeToTray();
          }
        });
      }

      // 通知后端更新关闭行为
      await invoke('set_window_close_behavior', { 
        minimizeToTray: enabled 
      });

      console.log(`✅ 窗口关闭处理器已设置: ${enabled ? '最小化到托盘' : '直接退出'}`);
    } catch (error) {
      console.error('❌ 设置窗口关闭处理器失败:', error);
      throw error;
    }
  }

  /**
   * 更新托盘菜单
   */
  async updateTrayMenu(menuItems: TrayMenuItem[]): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('系统托盘服务未初始化');
      }

      await invoke('update_tray_menu', { menuItems });
      console.log('✅ 托盘菜单已更新');
    } catch (error) {
      console.error('❌ 更新托盘菜单失败:', error);
      throw error;
    }
  }

  /**
   * 更新托盘提示文本
   */
  async updateTrayTooltip(tooltip: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        throw new Error('系统托盘服务未初始化');
      }

      await invoke('update_tray_tooltip', { tooltip });
      console.log('✅ 托盘提示已更新');
    } catch (error) {
      console.error('❌ 更新托盘提示失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
let systemTrayServiceInstance: SystemTrayService | null = null;

export const systemTrayService = (): SystemTrayService => {
  if (!systemTrayServiceInstance) {
    systemTrayServiceInstance = SystemTrayService.getInstance();
  }
  return systemTrayServiceInstance;
};