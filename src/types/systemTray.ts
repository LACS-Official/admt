/**
 * 系统托盘配置接口
 */
export interface SystemTrayConfig {
  /** 是否启用系统托盘 */
  systemTrayEnabled: boolean;
  /** 关闭窗口时是否最小化到托盘 */
  minimizeToTrayOnClose: boolean;
}

/**
 * 系统托盘管理器接口
 */
export interface ISystemTrayManager {
  /** 初始化系统托盘 */
  initialize(config: SystemTrayConfig): Promise<void>;
  
  /** 更新系统托盘配置 */
  updateConfig(config: SystemTrayConfig): Promise<void>;
  
  /** 清理系统托盘 */
  cleanup(): Promise<void>;
  
  /** 检查是否已初始化 */
  isReady(): boolean;
  
  /** 检查是否正在初始化 */
  isInitializingNow(): boolean;
}

/**
 * 系统托盘状态枚举
 */
export enum SystemTrayStatus {
  /** 未初始化 */
  NOT_INITIALIZED = 'not_initialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 已初始化 */
  READY = 'ready',
  /** 初始化失败 */
  FAILED = 'failed',
  /** 不支持 */
  NOT_SUPPORTED = 'not_supported'
}