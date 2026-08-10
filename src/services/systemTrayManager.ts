import { systemTrayService } from './systemTrayService';
import { logService } from './logService';
import { SystemTrayConfig, ISystemTrayManager, SystemTrayStatus } from '../types/systemTray';

/**
 * 系统托盘管理器 - 单例模式
 * 负责管理系统托盘的初始化、配置更新和清理
 */
class SystemTrayManager implements ISystemTrayManager {
  private static instance: SystemTrayManager | null = null;
  private status: SystemTrayStatus = SystemTrayStatus.NOT_INITIALIZED;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): SystemTrayManager {
    if (!SystemTrayManager.instance) {
      SystemTrayManager.instance = new SystemTrayManager();
    }
    return SystemTrayManager.instance;
  }

  /**
   * 初始化系统托盘
   */
  public async initialize(config: SystemTrayConfig): Promise<void> {
    // 防止重复初始化
    if (this.status === SystemTrayStatus.READY || this.status === SystemTrayStatus.INITIALIZING) {
      logService.info('系统托盘已初始化或正在初始化中，跳过重复初始化', 'SystemTrayManager');
      return;
    }

    this.status = SystemTrayStatus.INITIALIZING;

    try {
      logService.info('开始初始化系统托盘管理器...', 'SystemTrayManager');
      
      // 检查系统托盘支持
      const traySupported = await systemTrayService().isSystemTraySupported();
      logService.info(`系统托盘支持状态: ${traySupported}`, 'SystemTrayManager');
      
      if (traySupported && config.systemTrayEnabled) {
        logService.info('初始化系统托盘服务...', 'SystemTrayManager');
        await systemTrayService().initialize();
        
        // 设置关闭时的行为
        await systemTrayService().setupWindowCloseHandler(config.minimizeToTrayOnClose);
        
        this.status = SystemTrayStatus.READY;
        logService.info('系统托盘管理器初始化完成', 'SystemTrayManager');
      } else {
        this.status = SystemTrayStatus.NOT_SUPPORTED;
        logService.info('系统托盘未启用或不支持，跳过初始化', 'SystemTrayManager');
      }
    } catch (error) {
      this.status = SystemTrayStatus.FAILED;
      logService.error('系统托盘管理器初始化失败', 'SystemTrayManager', error);
      throw error;
    }
  }

  /**
   * 更新系统托盘配置
   */
  public async updateConfig(config: SystemTrayConfig): Promise<void> {
    try {
      const traySupported = await systemTrayService().isSystemTraySupported();
      
      if (traySupported) {
        if (config.systemTrayEnabled && !systemTrayService().isReady() && this.status !== SystemTrayStatus.INITIALIZING) {
          // 如果启用了系统托盘但未初始化，则初始化
          logService.info('配置变化触发托盘初始化', 'SystemTrayManager');
          this.status = SystemTrayStatus.INITIALIZING;
          await systemTrayService().initialize();
          await systemTrayService().setupWindowCloseHandler(config.minimizeToTrayOnClose);
          this.status = SystemTrayStatus.READY;
        } else if (!config.systemTrayEnabled && systemTrayService().isReady()) {
          // 如果禁用了系统托盘但已初始化，则清理
          logService.info('配置变化触发托盘清理', 'SystemTrayManager');
          await systemTrayService().cleanup();
          this.status = SystemTrayStatus.NOT_INITIALIZED;
        } else if (config.systemTrayEnabled && systemTrayService().isReady()) {
          // 更新关闭行为设置（仅在托盘启用时）
          await systemTrayService().setupWindowCloseHandler(config.minimizeToTrayOnClose);
        }
      }
    } catch (error) {
      logService.error('更新系统托盘配置失败', 'SystemTrayManager', error);
      throw error;
    }
  }

  /**
   * 清理系统托盘
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.status === SystemTrayStatus.READY && systemTrayService().isReady()) {
        logService.info('清理系统托盘管理器...', 'SystemTrayManager');
        await systemTrayService().cleanup();
        this.status = SystemTrayStatus.NOT_INITIALIZED;
        logService.info('系统托盘管理器清理完成', 'SystemTrayManager');
      }
    } catch (error) {
      logService.error('系统托盘管理器清理失败', 'SystemTrayManager', error);
    }
  }

  /**
   * 检查是否已初始化
   */
  public isReady(): boolean {
    return this.status === SystemTrayStatus.READY && systemTrayService().isReady();
  }

  /**
   * 检查是否正在初始化
   */
  public isInitializingNow(): boolean {
    return this.status === SystemTrayStatus.INITIALIZING;
  }

  /**
   * 获取当前状态
   */
  public getStatus(): SystemTrayStatus {
    return this.status;
  }

  /**
   * 重置单例实例（主要用于测试）
   */
  public static resetInstance(): void {
    SystemTrayManager.instance = null;
  }
}

// 导出单例实例
export const systemTrayManager = SystemTrayManager.getInstance();