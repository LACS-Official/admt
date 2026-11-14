/**
 * 系统托盘服务
 * 提供最小化到系统托盘的功能，包括托盘图标、右键菜单等
 */

import { invoke, isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { exit } from '@tauri-apps/plugin-process';
import { useDeviceStore } from '../stores/deviceStore';

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
  private trayEventUnlistens: Array<() => void> = [];
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
          console.log(' 已停止屏幕镜像服务');
        }
      } catch (_) {
        // ignore screen mirror stop errors
      }

      // 尝试停止 ADB/工具管理器
      try {
        const mod = await import('../services/adbToolsManager');
        const mgr = (mod as any).adbToolsManager || (mod as any).default || mod;
        // 尝试常见的停止方法名
        const stopFns = ['stopAll', 'dispose', 'shutdown', 'stop'];
        for (const fn of stopFns) {
          if (mgr && typeof mgr[fn] === 'function') {
            await mgr[fn]();
            console.log(` 已执行 adbToolsManager.${fn}()`);
            break;
          }
        }
      } catch (_) {
        // ignore adb tools stop errors
      }

      // 可在此处按需加入更多需要停止的服务（如日志流、设备监控等）
      // try { const mod = await import('../services/deviceService'); await mod.deviceService?.shutdown?.(); } catch (_) {}

    } catch (err) {
      console.warn(' 清理子进程时出现问题（已忽略）：', err);
    }
  }

  /**
   * 统一的优雅退出流程：销毁托盘 → 清理子进程 → 退出（插件优先，后端兜底）
   */
  private async performGracefulExit(exitCode: number = 0): Promise<void> {
    console.log(' 执行优雅退出流程...');
    // 1) 销毁托盘与事件
    try {
      await this.cleanup();
    } catch (e) {
      console.warn(' 清理托盘时出现问题（已忽略）：', e);
    }

    // 2) 清理子进程/后台任务
    await this.cleanupChildProcesses();

    // 3) 优先使用插件退出
    try {
      await exit(exitCode);
      return;
    } catch (pluginErr) {
      console.warn(' 插件退出失败，尝试后端兜底：', pluginErr);
    }

    // 4) 后端兜底：exit_app；不可用则最终 window.close()
    try {
      await invoke('exit_app', { exitCode });
      return;
    } catch (backendErr) {
      console.error(' 后端兜底退出失败：', backendErr);
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
        console.log(' 检测到托盘已存在，先清理旧托盘...');
        await this.cleanup();
        
        // 添加延迟确保清理完成
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const defaultConfig: TrayConfig = {
        tooltip: '玩机管家 (ADMT)',
        icon: 'icons/tray-icon.png',
        menuItems: [
          { id: 'show', label: '显示主页面', enabled: true },
          { id: 'separator1', label: '-' },
          { id: 'exit', label: '退出程序', enabled: true }
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
      console.log(' 系统托盘初始化成功');
    } catch (error) {
      console.error(' 系统托盘初始化失败:', error);
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
      
      // 注册事件处理器（保存 unlisten，避免反复开关托盘后累积重复监听）
      const { listen } = await import('@tauri-apps/api/event');

      this.clearTrayEventListeners();
      this.trayEventUnlistens.push(
        await listen('tray-menu-click', (event) => {
          this.handleTrayMenuClick(event.payload as string);
        }),
        await listen('tray-icon-click', () => {
          this.handleTrayIconClick();
        }),
      );

    } catch (error) {
      console.error(' 设置托盘事件监听器失败:', error);
      throw error;
    }
  }

  /** 移除托盘事件监听（幂等） */
  private clearTrayEventListeners(): void {
    for (const unlisten of this.trayEventUnlistens.splice(0)) {
      try {
        unlisten();
      } catch (err) {
        console.warn('移除托盘事件监听失败:', err);
      }
    }
  }

  /**
   * 重启当前选中设备
   * 后端 reboot_device 的签名是 (serial: String, mode: String)，
   * 托盘菜单只携带目标模式，序列号需从设备状态中取，否则反序列化会失败。
   */
  private async rebootActiveDevice(mode: 'system' | 'bootloader' | 'recovery'): Promise<void> {
    const serial = useDeviceStore.getState().selectedDevice?.serial;
    if (!serial) {
      console.warn(`托盘重启失败：当前没有选中设备 (mode=${mode})`);
      return;
    }
    try {
      await invoke('reboot_device', { serial, mode });
    } catch (e) {
      console.error(`托盘重启设备失败 (mode=${mode}):`, e);
    }
  }

  /**
   * 处理托盘菜单点击
   */
  private async handleTrayMenuClick(menuId: string): Promise<void> {
    try {
      console.log(` 托盘菜单点击事件: ${menuId}`);
      
      switch (menuId) {
        case 'show':
        case 'custom-show':
        case '显示主页面':
        case '显示主界面':
        case '显示窗口':
          await this.showWindow();
          break;
        case 'hide':
        case 'custom-hide':
          await this.hideWindow();
          break;
        case 'reboot_sys':
        case 'custom-reboot_sys':
          await this.rebootActiveDevice('system');
          break;
        case 'reboot_bootloader':
        case 'custom-reboot_bootloader':
          await this.rebootActiveDevice('bootloader');
          break;
        case 'reboot_recovery':
        case 'custom-reboot_recovery':
          await this.rebootActiveDevice('recovery');
          break;
        case 'exit':
        case 'custom-exit':
        case '退出程序':
        case '退出应用':
        case '退出玩机管家':
          await this.performGracefulExit(0);
          break;
        default: {
          const id = String(menuId || '');
          if (id.includes('退出') || id.includes('exit')) {
            await this.performGracefulExit(0);
          } else if (id.includes('显示') || id.includes('show')) {
            await this.showWindow();
          } else {
            console.warn(`未识别的托盘菜单ID: ${menuId}`);
          }
          break;
        }
      }
    } catch (error) {
      console.error(' 处理托盘菜单点击失败:', error);
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
      console.error(' 处理托盘图标点击失败:', error);
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
      console.log(' 窗口已显示');
    } catch (error) {
      console.error(' 显示窗口失败:', error);
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
      console.log(' 窗口已隐藏到托盘');
    } catch (error) {
      console.error(' 隐藏窗口失败:', error);
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
      console.error(' 最小化到托盘失败:', error);
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
        console.log(' 开始清理系统托盘资源...');
        
        // 移除事件监听器
        if (this.closeEventUnlisten) {
          this.closeEventUnlisten();
          this.closeEventUnlisten = undefined;
        }
        this.clearTrayEventListeners();
        
        // 销毁托盘
        try {
          await invoke('destroy_system_tray');
        } catch (destroyError) {
          console.warn(' 销毁托盘时出现警告:', destroyError);
        }
        
        this.isInitialized = false;
        this.closeToTrayEnabled = false;
        console.log(' 系统托盘已清理');
      }
    } catch (error) {
      console.error(' 清理系统托盘失败:', error);
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
   *
   * 注意：Tauri 2 默认不会注入 `window.__TAURI__`（那是 Tauri 1 开启
   * withGlobalTauri 后才有的全局对象），这里必须用官方的 isTauri() 判定，
   * 再向后端确认平台能力，避免把正常的桌面环境误判为「不支持托盘」。
   */
  async isSystemTraySupported(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !isTauri()) {
        return false;
      }

      try {
        return await invoke<boolean>('is_system_tray_supported');
      } catch (err) {
        // 旧版本后端没有该命令时，退化为「在 Tauri 桌面环境内即视为支持」
        console.warn('后端托盘能力探测失败，回退到环境判定:', err);
        return true;
      }
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
        // 设置窗口特定关闭事件监听，只影响调用此服务的窗口（通常是主窗口）
        await this.ensureWindowInitialized();
        if (this.currentWindow) {
          this.closeEventUnlisten = await this.currentWindow.onCloseRequested(async (event) => {
            if (this.closeToTrayEnabled && this.isInitialized) {
              // 阻止默认关闭行为
              event.preventDefault();
              // 执行最小化到托盘
              await this.minimizeToTray();
            }
          });
        }
      }

      // 通知后端更新关闭行为
      await invoke('set_window_close_behavior', { 
        minimizeToTray: enabled 
      });

      console.log(` 窗口关闭处理器已设置: ${enabled ? '最小化到托盘' : '直接退出'}`);
    } catch (error) {
      console.error(' 设置窗口关闭处理器失败:', error);
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
      console.log(' 托盘菜单已更新');
    } catch (error) {
      console.error(' 更新托盘菜单失败:', error);
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
      console.log(' 托盘提示已更新');
    } catch (error) {
      console.error(' 更新托盘提示失败:', error);
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