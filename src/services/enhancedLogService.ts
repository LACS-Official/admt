import {
  LogLevel,
  LogCategory,
  StructuredLogEntry,
  DeviceEvent,
  FirmwareFlashEvent,
  LogFilter,
  LogRetentionPolicy,
  LogStats
} from './logTypes';
import { LogUtils } from './logUtils';

// 导入后端模拟服务
import { logBackendMock } from './logBackendMock';

// Tauri API 包装器
const invoke = async (cmd: string, args?: any): Promise<any> => {
  try {
    // 尝试使用真实的Tauri API
    if (typeof window !== 'undefined' && (window as any).__TAURI__?.invoke) {
      return await (window as any).__TAURI__.invoke(cmd, args);
    }
    
    // 降级到模拟后端
    switch (cmd) {
      case 'persist_log':
        if (args?.logEntry) {
          const logEntry = JSON.parse(args.logEntry);
          await logBackendMock.persistLog(logEntry);
          return 'OK';
        }
        throw new Error('Missing logEntry parameter');
        
      case 'get_logs':
        const logs = await logBackendMock.getLogs(args?.filter);
        return JSON.stringify(logs);
        
      case 'clear_logs':
        await logBackendMock.clearLogs();
        return 'OK';
        
      case 'cleanup_expired_logs':
        await logBackendMock.cleanupExpiredLogs(
          args?.basicCutoff,
          args?.errorCutoff
        );
        return 'OK';
        
      default:
        console.warn(`未知的日志命令: ${cmd}`, args);
        return Promise.resolve('{}');
    }
  } catch (error) {
    console.error(`日志命令执行失败: ${cmd}`, error);
    throw error;
  }
};

class EnhancedLogService {
  private memoryLogs: StructuredLogEntry[] = [];
  private listeners: ((logs: StructuredLogEntry[]) => void)[] = [];
  private sessionId: string;
  private retentionPolicy: LogRetentionPolicy = {
    basicLogs: 30,
    errorLogs: 180,
    maxMemoryLogs: 2000
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeService();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUniqueId(): string {
    // 使用更强的唯一性算法：时间戳 + 递增计数器 + 随机字符串
    const timestamp = Date.now();
    const counter = this.getAndIncrementCounter();
    const random = Math.random().toString(36).substring(2, 11);
    return `${timestamp}_${counter}_${random}`;
  }

  private static idCounter = 0;
  private getAndIncrementCounter(): number {
    return ++EnhancedLogService.idCounter;
  }

  private async initializeService(): Promise<void> {
    try {
      // 初始化日志目录，包含降级处理
      const logDirectory = await this.initializeLogDirectoryWithFallback();
      
      // 清理过期日志
      await this.cleanupExpiredLogs();
      
      this.logStructured({
        level: "info",
        category: "system",
        message: "增强日志服务已启动 - 使用新日志格式",
        source: "EnhancedLogService",
        context: {
          sessionId: this.sessionId,
          retentionPolicy: this.retentionPolicy,
          logFormat: "admt_log_YYYYMMDD.log",
          logLocation: logDirectory || "{软件运行目录}/logs/"
        }
      });
    } catch (error) {
      console.error("日志服务初始化失败:", error);
    }
  }
  
  private async initializeLogDirectoryWithFallback(): Promise<string | null> {
    try {
      // 尝试初始化日志目录
      const logDirectory = await invoke('initialize_log_directory');
      return logDirectory as string;
    } catch (error) {
      console.warn("初始化日志目录失败，使用降级处理:", error);
      
      // 降级处理：仅使用内存日志
      this.logWarning(
        "日志目录初始化失败，将仅使用内存日志",
        "EnhancedLogService",
        { error: error instanceof Error ? error.message : String(error) }
      );
      
      return null;
    }
  }

  private async cleanupExpiredLogs(): Promise<void> {
    try {
      const now = new Date();
      const basicCutoff = new Date(now.getTime() - this.retentionPolicy.basicLogs * 24 * 60 * 60 * 1000);
      const errorCutoff = new Date(now.getTime() - this.retentionPolicy.errorLogs * 24 * 60 * 60 * 1000);

      await invoke('cleanup_expired_logs', {
        basicCutoff: basicCutoff.toISOString(),
        errorCutoff: errorCutoff.toISOString()
      });
    } catch (error) {
      console.warn("清理过期日志失败:", error);
    }
  }

  private logStructured(params: {
    level: LogLevel;
    category: LogCategory;
    message: string;
    source: string;
    context?: any;
    errorCode?: string;
    stackTrace?: string;
  }): void {
    const entry: StructuredLogEntry = {
      id: this.generateUniqueId(),
      timestamp: new Date().toISOString(),
      level: params.level,
      category: params.category,
      message: params.message,
      source: params.source,
      context: {
        sessionId: this.sessionId,
        errorCode: params.errorCode,
        stackTrace: params.stackTrace,
        ...params.context
      },
      metadata: {
        version: "1.0.0",
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
        buildId: import.meta.env?.VITE_BUILD_ID || "unknown"
      }
    };

    this.memoryLogs.push(entry);

    if (this.memoryLogs.length > this.retentionPolicy.maxMemoryLogs) {
      this.memoryLogs = this.memoryLogs.slice(-this.retentionPolicy.maxMemoryLogs);
    }

    this.persistLog(entry);
    this.notifyListeners();
    this.logToConsole(entry);
  }

  private async persistLog(entry: StructuredLogEntry): Promise<void> {
    try {
      // 同时调用原有的和新的持久化方法
      await Promise.all([
        // 原有的内存持久化（向后兼容）
        invoke('persist_log', { logEntry: JSON.stringify(entry) }).catch(error => {
          console.warn("内存持久化失败:", error);
        }),
        // 新的文件持久化
        invoke('persist_log_to_file', JSON.stringify(entry)).catch(error => {
          console.warn("文件持久化失败:", error);
        })
      ]);
    } catch (error) {
      console.error("持久化日志失败:", error);
      // 降级处理：如果持久化失败，仅保持在内存中
      // 这里不再抛出错误，保证系统运行稳定性
    }
  }

  private logToConsole(entry: StructuredLogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] [${entry.source}]`;
    
    const logData = {
      message: entry.message,
      context: entry.context,
      metadata: entry.metadata
    };

    switch (entry.level) {
      case "fatal":
      case "error":
        console.error(prefix, logData);
        break;
      case "warning":
        console.warn(prefix, logData);
        break;
      case "info":
        console.info(prefix, logData);
        break;
      case "debug":
        console.debug(prefix, logData);
        break;
    }
  }

  // 设备状态事件记录
  logDeviceEvent(event: DeviceEvent): void {
    let message = "";
    let level: LogLevel = "info";

    switch (event.type) {
      case "connected":
        message = `设备已连接: ${event.deviceModel || event.deviceId}`;
        level = "info";
        break;
      case "disconnected":
        message = `设备已断开: ${event.deviceModel || event.deviceId}`;
        level = "warning";
        break;
      case "mode_changed":
        message = `设备模式变更: ${event.previousMode} -> ${event.currentMode}`;
        level = "info";
        break;
      case "error":
        message = `设备错误: ${event.deviceModel || event.deviceId}`;
        level = "error";
        break;
    }

    this.logStructured({
      level,
      category: "device",
      message,
      source: "DeviceManager",
      context: {
        deviceId: event.deviceId,
        deviceModel: event.deviceModel,
        eventType: event.type,
        previousMode: event.previousMode,
        currentMode: event.currentMode,
        eventDetails: event.details
      }
    });
  }

  // 固件刷写流程记录
  logFirmwareFlashEvent(event: FirmwareFlashEvent): void {
    let message = "";
    let level: LogLevel = "info";

    switch (event.type) {
      case "started":
        message = `固件刷写开始: ${event.firmwareFile}`;
        level = "info";
        break;
      case "progress":
        message = `固件刷写进度: ${event.progress}% - ${event.stage}`;
        level = "debug";
        break;
      case "verification":
        message = `固件验证中: ${event.stage}`;
        level = "info";
        break;
      case "completed":
        message = `固件刷写完成: ${event.firmwareFile}`;
        level = "info";
        break;
      case "failed":
        message = `固件刷写失败: ${event.errorMessage}`;
        level = "error";
        break;
    }

    this.logStructured({
      level,
      category: "firmware",
      message,
      source: "FirmwareFlasher",
      context: {
        operationId: event.operationId,
        deviceId: event.deviceId,
        firmwareFile: event.firmwareFile,
        progress: event.progress,
        stage: event.stage,
        eventType: event.type
      },
      errorCode: event.errorCode
    });
  }

  // 分级错误记录方法
  logError(message: string, source: string, context?: any, errorCode?: string, error?: Error): void {
    this.logStructured({
      level: "error",
      category: "system",
      message,
      source,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message
      },
      errorCode,
      stackTrace: error?.stack
    });
  }

  logWarning(message: string, source: string, context?: any): void {
    this.logStructured({
      level: "warning",
      category: "system",
      message,
      source,
      context
    });
  }

  logInfo(message: string, source: string, context?: any): void {
    this.logStructured({
      level: "info",
      category: "system",
      message,
      source,
      context
    });
  }

  logDebug(message: string, source: string, context?: any): void {
    this.logStructured({
      level: "debug",
      category: "system",
      message,
      source,
      context
    });
  }

  logFatal(message: string, source: string, context?: any, error?: Error): void {
    this.logStructured({
      level: "fatal",
      category: "system",
      message,
      source,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message
      },
      stackTrace: error?.stack
    });
  }

  // 用户操作记录
  logUserAction(action: string, source: string, context?: any): void {
    this.logStructured({
      level: "info",
      category: "user",
      message: `用户操作: ${action}`,
      source,
      context
    });
  }

  // 网络请求记录
  logNetworkRequest(url: string, method: string, status: number, source: string, context?: any): void {
    const level: LogLevel = status >= 400 ? "error" : status >= 300 ? "warning" : "info";
    
    this.logStructured({
      level,
      category: "network",
      message: `网络请求: ${method} ${url} - ${status}`,
      source,
      context: {
        url,
        method,
        status,
        ...context
      }
    });
  }

  // 安全事件记录
  logSecurityEvent(event: string, source: string, context?: any): void {
    this.logStructured({
      level: "warning",
      category: "security",
      message: `安全事件: ${event}`,
      source,
      context
    });
  }

  // 从后端刷新日志数据
  async refreshFromBackend(): Promise<void> {
    try {
      // 从后端获取最新的持久化日志
      const persistedLogs = await invoke('get_logs', {});
      const logs: string[] = JSON.parse(persistedLogs);
      
      console.log("从后端获取到日志数量:", logs.length);
      
      // 这里可以添加更复杂的日志解析逻辑
      // 目前简化处理，只作为刷新触发器
      
      this.logInfo("日志已从后端刷新", "EnhancedLogService", { count: logs.length });
    } catch (error) {
      console.error("从后端刷新日志失败:", error);
      throw error;
    }
  }
  subscribe(listener: (logs: StructuredLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.memoryLogs]);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.memoryLogs]));
  }

  // 获取日志
  async getLogs(filter?: LogFilter): Promise<StructuredLogEntry[]> {
    try {
      // 从后端获取持久化日志
      const persistedLogs = await invoke('get_logs', { filter });
      const logs: StructuredLogEntry[] = JSON.parse(persistedLogs);
      
      // 合并内存日志
      const allLogs = [...logs, ...this.memoryLogs];
      
      return LogUtils.filterLogs(allLogs, filter);
    } catch (error) {
      console.error("获取日志失败:", error);
      // 降级到仅返回内存日志
      return LogUtils.filterLogs(this.memoryLogs, filter);
    }
  }

  // 导出日志
  async exportLogs(filter?: LogFilter, format: 'json' | 'text' = 'json'): Promise<string> {
    const logs = await this.getLogs(filter);
    
    if (format === 'json') {
      return LogUtils.exportLogsAsJson(logs);
    } else {
      return LogUtils.exportLogsAsText(logs);
    }
  }

  // 清空日志
  async clearLogs(): Promise<void> {
    try {
      // 同时清空内存和文件持久化的日志
      await invoke('clear_logs');
      
      // 清空内存日志
      this.memoryLogs = [];
      
      // 记录清空操作（在清空后）
      this.logInfo("所有日志已清空", "EnhancedLogService");
      
      // 通知监听器
      this.notifyListeners();
    } catch (error) {
      console.error("清空日志失败:", error);
      throw error;
    }
  }

  // 获取日志统计
  async getLogStats(): Promise<LogStats> {
    const logs = await this.getLogs();
    return LogUtils.calculateLogStats(logs);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setRetentionPolicy(policy: Partial<LogRetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy };
    // 避免在初始化时产生循环调用，使用简单的控制台输出
    if (this.memoryLogs.length > 0) {
      this.logInfo("日志保留策略已更新", "EnhancedLogService", { policy: this.retentionPolicy });
    } else {
      console.log("[EnhancedLogService] 日志保留策略已初始化", this.retentionPolicy);
    }
  }
}

// 创建全局增强日志服务实例
export const enhancedLogService = new EnhancedLogService();

// 延迟初始化全局错误处理，避免循环调用
setTimeout(() => {
  // 全局错误处理
  window.addEventListener('error', (event) => {
    try {
      enhancedLogService.logError(
        `未捕获的错误: ${event.message}`,
        'GlobalErrorHandler',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        'UNCAUGHT_ERROR',
        event.error
      );
    } catch (err) {
      console.error('[EnhancedLogService] 记录全局错误时发生异常:', err);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      enhancedLogService.logError(
        `未处理的Promise拒绝: ${event.reason}`,
        'GlobalErrorHandler',
        { reason: event.reason },
        'UNHANDLED_REJECTION',
        event.reason
      );
    } catch (err) {
      console.error('[EnhancedLogService] 记录Promise拒绝时发生异常:', err);
    }
  });
}, 100); // 延迟100ms初始化

export default enhancedLogService;