import {
  StructuredLogEntry,
  LogLevel,
  LogCategory,
  DeviceEvent,
  FirmwareFlashEvent,
  LogFilter as StructuredLogFilter,
  LogRetentionPolicy,
  LogStats,
} from "./logTypes";
import { LogUtils } from "./logUtils";
import {
  info as pluginInfo,
  warn as pluginWarn,
  error as pluginError,
  debug as pluginDebug,
  attachLogger,
} from "@tauri-apps/plugin-log";

// 兼容性接口导出
export type { LogLevel, LogCategory, StructuredLogEntry, DeviceEvent, FirmwareFlashEvent, LogRetentionPolicy, LogStats };
export interface SimpleLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string;
  details?: any;
}
export type LogFilter = StructuredLogFilter;

export class LogService {
  private logs: StructuredLogEntry[] = [];
  private seenIds = new Set<string>();
  private maxLogs: number = 2000;
  private listeners: ((logs: StructuredLogEntry[]) => void)[] = [];
  private channel: BroadcastChannel | null = null;
  private sessionId: string;
  private unlistenPluginLog: (() => void) | null = null;
  private retentionPolicy: LogRetentionPolicy = {
    basicLogs: 30,
    errorLogs: 180,
    maxMemoryLogs: 2000,
  };

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 跨窗口广播通道初始化
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel("admt_logs_channel");
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === "LOG_ENTRY") {
            this.handleRemoteLog(event.data.entry);
          }
        };
      } catch (e) {
        console.warn("[LogService] BroadcastChannel 初始化失败:", e);
      }
    }

    // 激活后端 Rust 日志监听管线 (tauri-plugin-log)
    this.setupBackendLoggerListener();

    // 记录初始化完成日志
    this.logInfo("统一日志系统初始化完成", "LogService", {
      sessionId: this.sessionId,
      channelReady: !!this.channel,
    });
  }

  /**
   * 监听并捕获 Rust 后端通过 tauri-plugin-log 发送的所有日志
   */
  private async setupBackendLoggerListener(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      this.unlistenPluginLog = await attachLogger(({ level, message }) => {
        // 过滤前端自身上报的日志，避免回流重复
        if (message.startsWith("[FE]") || message.includes(" [FE] ")) {
          return;
        }

        let mappedLevel: LogLevel = "info";
        switch (level) {
          case 1: // Trace
          case 2: // Debug
            mappedLevel = "debug";
            break;
          case 3: // Info
            mappedLevel = "info";
            break;
          case 4: // Warn
            mappedLevel = "warning";
            break;
          case 5: // Error
            mappedLevel = "error";
            break;
          default:
            mappedLevel = "info";
        }

        let cleanMsg = message.trim();
        let source = "Rust";
        let category: LogCategory = "system";

        // 解析 [module] 前缀
        const match = cleanMsg.match(/^\[(.*?)\]\s*(.*)$/);
        if (match) {
          source = match[1];
          cleanMsg = match[2];
        }

        // 智能分类
        const lower = `${cleanMsg} ${source}`.toLowerCase();
        if (/adb|fastboot|scrcpy|device|usb|serial|edl|recovery/.test(lower)) {
          category = "device";
        } else if (/flash|firmware|rom|payload|partition|slot/.test(lower)) {
          category = "firmware";
        } else if (/network|http|tcp|wifi|download|url|socket/.test(lower)) {
          category = "network";
        } else if (/ai|openai|claude|chat|prompt|gpt/.test(lower)) {
          category = "ai";
        } else if (/security|permission|auth/.test(lower)) {
          category = "security";
        }

        this.ingestBackendLog({
          level: mappedLevel,
          category,
          source,
          message: cleanMsg,
        });
      });
    } catch (err) {
      // 在非 Tauri 或测试环境中静默忽略
      console.debug("[LogService] tauri-plugin-log attachLogger 未连接:", err);
    }
  }

  /**
   * 摄入后端 Rust 日志流并广播
   */
  private ingestBackendLog(params: {
    level: LogLevel;
    category: LogCategory;
    source: string;
    message: string;
  }): void {
    const id = `rust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const entry: StructuredLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      level: params.level,
      category: params.category,
      message: params.message,
      source: params.source,
      context: {},
      metadata: {
        version: "1.0.0",
        platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
      },
    };

    this.pushLogEntry(entry, false);
  }

  /**
   * 写入内部日志队列并通知订阅者与多窗口
   */
  private pushLogEntry(entry: StructuredLogEntry, broadcast: boolean = true): void {
    if (this.seenIds.has(entry.id)) return;
    this.seenIds.add(entry.id);

    this.logs.push(entry);

    // 控制内存容量
    if (this.logs.length > this.maxLogs) {
      const removed = this.logs.splice(0, this.logs.length - this.maxLogs);
      removed.forEach((item) => this.seenIds.delete(item.id));
    }

    this.notifyListeners();

    if (broadcast && this.channel) {
      this.channel.postMessage({ type: "LOG_ENTRY", entry });
    }
  }

  /**
   * 处理远端窗口通过 BroadcastChannel 广播过来的日志
   */
  private handleRemoteLog(entry: StructuredLogEntry): void {
    if (this.seenIds.has(entry.id)) return;
    this.seenIds.add(entry.id);

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      const removed = this.logs.splice(0, this.logs.length - this.maxLogs);
      removed.forEach((item) => this.seenIds.delete(item.id));
    }
    this.notifyListeners();
  }

  /**
   * 向 Tauri 日志插件异步写盘（后台无锁管线，非阻塞）
   */
  private sendToPluginLog(level: LogLevel, source: string, message: string): void {
    const formatted = `[FE] [${source}] ${message}`;
    switch (level) {
      case "fatal":
      case "error":
        pluginError(formatted).catch(() => {});
        break;
      case "warning":
        pluginWarn(formatted).catch(() => {});
        break;
      case "info":
        pluginInfo(formatted).catch(() => {});
        break;
      case "debug":
        pluginDebug(formatted).catch(() => {});
        break;
    }
  }

  /**
   * 核心结构化日志记录方法
   */
  logStructured(params: {
    level: LogLevel;
    category: LogCategory;
    message: string;
    source: string;
    context?: any;
    errorCode?: string;
    stackTrace?: string;
  }): void {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const entry: StructuredLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      level: params.level,
      category: params.category,
      message: params.message,
      source: params.source,
      context: {
        sessionId: this.sessionId,
        errorCode: params.errorCode,
        stackTrace: params.stackTrace,
        ...params.context,
      },
      metadata: {
        version: "1.0.0",
        platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
      },
    };

    this.pushLogEntry(entry, true);
    this.sendToPluginLog(params.level, params.source, params.message);
    this.logToConsole(entry);
  }

  /**
   * 通用简易记录方法（向前兼容）
   */
  log(level: LogLevel | string, message: string, source?: string, details?: any): void {
    let validLevel: LogLevel = "info";
    if (["fatal", "error", "warning", "info", "debug"].includes(level as string)) {
      validLevel = level as LogLevel;
    }

    let category: LogCategory = "system";
    let context: any = {};

    if (details) {
      if (details.category && ["device", "firmware", "system", "user", "network", "security", "ai"].includes(details.category)) {
        category = details.category;
        const { category: _, ...rest } = details;
        context = rest;
      } else {
        context = details;
      }
    }

    this.logStructured({
      level: validLevel,
      category,
      message,
      source: source || "App",
      context,
    });
  }

  // 基础分级日志快捷方法
  error(message: string, source?: string, details?: any): void {
    this.log("error", message, source, details);
  }

  warning(message: string, source?: string, details?: any): void {
    this.log("warning", message, source, details);
  }

  warn(message: string, source?: string, details?: any): void {
    this.log("warning", message, source, details);
  }

  info(message: string, source?: string, details?: any): void {
    this.log("info", message, source, details);
  }

  debug(message: string, source?: string, details?: any): void {
    this.log("debug", message, source, details);
  }

  // 增强 API 方法（合并自 EnhancedLogService）
  logError(message: string, source: string = "App", context?: any, errorCode?: string, error?: Error): void {
    this.logStructured({
      level: "error",
      category: "system",
      message,
      source,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      errorCode,
      stackTrace: error?.stack,
    });
  }

  logWarning(message: string, source: string = "App", context?: any): void {
    this.logStructured({
      level: "warning",
      category: "system",
      message,
      source,
      context,
    });
  }

  logInfo(message: string, source: string = "App", context?: any): void {
    this.logStructured({
      level: "info",
      category: "system",
      message,
      source,
      context,
    });
  }

  logDebug(message: string, source: string = "App", context?: any): void {
    this.logStructured({
      level: "debug",
      category: "system",
      message,
      source,
      context,
    });
  }

  logFatal(message: string, source: string = "App", context?: any, error?: Error): void {
    this.logStructured({
      level: "fatal",
      category: "system",
      message,
      source,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
      },
      stackTrace: error?.stack,
    });
  }

  // 业务事件专业记录器
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
        message = `设备异常: ${event.deviceModel || event.deviceId}`;
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
        eventDetails: event.details,
      },
    });
  }

  logFirmwareFlashEvent(event: FirmwareFlashEvent): void {
    let message = "";
    let level: LogLevel = "info";

    switch (event.type) {
      case "started":
        message = `固件刷写开始: ${event.firmwareFile || ""}`;
        level = "info";
        break;
      case "progress":
        message = `固件刷写进度: ${event.progress}% - ${event.stage || ""}`;
        level = "debug";
        break;
      case "verification":
        message = `固件验证中: ${event.stage || ""}`;
        level = "info";
        break;
      case "completed":
        message = `固件刷写完成: ${event.firmwareFile || ""}`;
        level = "info";
        break;
      case "failed":
        message = `固件刷写失败: ${event.errorMessage || ""}`;
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
        eventType: event.type,
      },
      errorCode: event.errorCode,
    });
  }

  logUserAction(action: string, source: string = "User", context?: any): void {
    this.logStructured({
      level: "info",
      category: "user",
      message: `用户操作: ${action}`,
      source,
      context,
    });
  }

  logNetworkRequest(url: string, method: string, status: number, source: string = "Network", context?: any): void {
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
        ...context,
      },
    });
  }

  logSecurityEvent(event: string, source: string = "Security", context?: any): void {
    this.logStructured({
      level: "warning",
      category: "security",
      message: `安全事件: ${event}`,
      source,
      context,
    });
  }

  logAppStartup(source: string = "App", context?: any): void {
    this.logStructured({
      level: "info",
      category: "system",
      message: "应用启动",
      source,
      context: {
        startupTime: new Date().toISOString(),
        ...context,
      },
    });
  }

  logAppShutdown(source: string = "App", context?: any): void {
    this.logStructured({
      level: "info",
      category: "system",
      message: "应用关闭",
      source,
      context: {
        shutdownTime: new Date().toISOString(),
        ...context,
      },
    });
  }

  logPageNavigation(page: string, source: string = "Navigation", context?: any): void {
    this.logStructured({
      level: "info",
      category: "user",
      message: `页面导航: ${page}`,
      source,
      context: {
        page,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  logDeviceConnection(deviceId: string, action: "connected" | "disconnected", source: string = "DeviceManager", context?: any): void {
    this.logStructured({
      level: action === "connected" ? "info" : "warning",
      category: "device",
      message: `设备${action === "connected" ? "连接" : "断开"}: ${deviceId}`,
      source,
      context: {
        deviceId,
        action,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  logFileOperation(operation: string, filePath: string, source: string = "FileOps", context?: any): void {
    this.logStructured({
      level: "info",
      category: "system",
      message: `文件操作: ${operation} - ${filePath}`,
      source,
      context: {
        operation,
        filePath,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  logSettingChange(setting: string, oldValue: any, newValue: any, source: string = "Settings", context?: any): void {
    this.logStructured({
      level: "info",
      category: "user",
      message: `设置变更: ${setting}`,
      source,
      context: {
        setting,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  logNetworkStatus(status: "online" | "offline", source: string = "Network", context?: any): void {
    this.logStructured({
      level: status === "online" ? "info" : "warning",
      category: "network",
      message: `网络状态: ${status === "online" ? "在线" : "离线"}`,
      source,
      context: {
        status,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  logPerformance(operation: string, duration: number, source: string = "Performance", context?: any): void {
    this.logStructured({
      level: duration > 1000 ? "warning" : "info",
      category: "system",
      message: `性能监控: ${operation} - ${duration}ms`,
      source,
      context: {
        operation,
        duration,
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  }

  logErrorBoundary(error: Error, component: string, source: string = "ErrorBoundary", context?: any): void {
    this.logStructured({
      level: "error",
      category: "system",
      message: `组件错误边界捕获: ${component}`,
      source,
      context: {
        errorName: error.name,
        errorMessage: error.message,
        component,
        stackTrace: error.stack,
        ...context,
      },
      stackTrace: error.stack,
    });
  }

  private logToConsole(entry: StructuredLogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] [${entry.source}]`;
    const details = Object.keys(entry.context).length > 0 ? entry.context : "";

    switch (entry.level) {
      case "fatal":
      case "error":
        console.error(prefix, entry.message, details);
        break;
      case "warning":
        console.warn(prefix, entry.message, details);
        break;
      case "info":
        console.info(prefix, entry.message, details);
        break;
      case "debug":
        console.debug(prefix, entry.message, details);
        break;
    }
  }

  // 查询与过滤
  getLogs(filter?: StructuredLogFilter): StructuredLogEntry[] {
    return LogUtils.filterLogs(this.logs, filter);
  }

  async getLogsAsync(filter?: StructuredLogFilter): Promise<StructuredLogEntry[]> {
    return this.getLogs(filter);
  }

  clearLogs(): void {
    this.logs = [];
    this.seenIds.clear();
    this.logInfo("日志已清空", "LogService");
  }

  exportLogs(filter?: StructuredLogFilter, format: "json" | "text" = "text"): string {
    const logs = this.getLogs(filter);
    return format === "json" ? LogUtils.exportLogsAsJson(logs) : LogUtils.exportLogsAsText(logs);
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    if (this.logs.length > maxLogs) {
      const removed = this.logs.splice(0, this.logs.length - maxLogs);
      removed.forEach((item) => this.seenIds.delete(item.id));
      this.notifyListeners();
    }
  }

  subscribe(listener: (logs: StructuredLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    // 异步推送当前日志，避免 React 渲染周期同步触发 setState 警告
    const current = [...this.logs];
    setTimeout(() => listener(current), 0);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const current = [...this.logs];
    this.listeners.forEach((listener) => listener(current));
  }

  getLogStats(): LogStats {
    return LogUtils.calculateLogStats(this.logs);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setRetentionPolicy(policy: Partial<LogRetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy };
    if (this.retentionPolicy.maxMemoryLogs) {
      this.setMaxLogs(this.retentionPolicy.maxMemoryLogs);
    }
  }

  async refreshFromBackend(): Promise<void> {
    this.logInfo("日志已与后端保持同步", "LogService", { count: this.logs.length });
  }

  dispose(): void {
    if (this.unlistenPluginLog) {
      this.unlistenPluginLog();
      this.unlistenPluginLog = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners = [];
  }
}

// 全局单例
export const logService = new LogService();

// 全局未捕获错误与 Promise 异常自动监听
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logService.error(
      `未捕获的错误: ${event.message}`,
      "GlobalErrorHandler",
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      }
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    logService.error(
      `未处理的Promise拒绝: ${event.reason}`,
      "GlobalErrorHandler",
      { reason: event.reason }
    );
  });
}

export default logService;
