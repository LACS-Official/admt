import { StructuredLogEntry, LogLevel, LogCategory, LogFilter as StructuredLogFilter } from "./logTypes";

// 保持旧的接口定义用于兼容性，但在内部映射到新类型
export type { LogLevel };
export interface SimpleLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string;
  details?: any;
}

export type LogFilter = StructuredLogFilter;

class LogService {
  private logs: StructuredLogEntry[] = [];
  private maxLogs: number = 1000;
  private listeners: ((logs: StructuredLogEntry[]) => void)[] = [];

  constructor() {
    // 初始化时添加启动日志
    this.log("info", "日志系统初始化完成", "LogService", { category: "system" });
  }

  log(level: LogLevel | string, message: string, source?: string, details?: any): void {
    // 确定日志级别，默认为 info
    let validLevel: LogLevel = "info";
    if (["fatal", "error", "warning", "info", "debug"].includes(level as string)) {
        validLevel = level as LogLevel;
    }

    // 处理 details，提取 category
    let category: LogCategory = "system";
    let context: any = {};
    
    if (details) {
        if (details.category && ["device", "firmware", "system", "user", "network", "security"].includes(details.category)) {
            category = details.category;
            // 从 details 中移除 category，剩余的作为 context
            const { category: _, ...rest } = details;
            context = rest;
        } else {
            context = details;
        }
    }

    // 默认源
    const validSource = source || "App";

    const entry: StructuredLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: validLevel,
      category,
      message,
      source: validSource,
      context,
      metadata: {
        version: "1.0.0",
        platform: navigator.platform || "unknown"
      }
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 通知监听器
    this.notifyListeners();

    // 同时输出到控制台
    this.logToConsole(entry);
  }

  private logToConsole(entry: StructuredLogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]${entry.source ? ` [${entry.source}]` : ""}`;
    
    switch (entry.level) {
      case "fatal":
      case "error":
        console.error(prefix, entry.message, entry.context || "");
        break;
      case "warning":
        console.warn(prefix, entry.message, entry.context || "");
        break;
      case "info":
        console.info(prefix, entry.message, entry.context || "");
        break;
      case "debug":
        console.debug(prefix, entry.message, entry.context || "");
        break;
    }
  }

  error(message: string, source?: string, details?: any): void {
    this.log("error", message, source, details);
  }

  warning(message: string, source?: string, details?: any): void {
    this.log("warning", message, source, details);
  }

  info(message: string, source?: string, details?: any): void {
    this.log("info", message, source, details);
  }

  debug(message: string, source?: string, details?: any): void {
    this.log("debug", message, source, details);
  }

  getLogs(filter?: StructuredLogFilter): StructuredLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
        if (filter.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filter.level);
        }

        if (filter.category) {
            filteredLogs = filteredLogs.filter(log => log.category === filter.category);
        }

        if (filter.source) {
            filteredLogs = filteredLogs.filter(log => 
                log.source.toLowerCase().includes(filter.source!.toLowerCase())
            );
        }
        
        if (filter.deviceId) {
             filteredLogs = filteredLogs.filter(log => 
                log.context?.deviceId === filter.deviceId
            );
        }

        if (filter.search) {
            const searchTerm = filter.search.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(searchTerm) ||
                log.source.toLowerCase().includes(searchTerm) ||
                (log.context && JSON.stringify(log.context).toLowerCase().includes(searchTerm))
            );
        }
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
    this.log("info", "日志已清空", "LogService", { category: "system" });
    // notifyListeners 会在 log 内部被调用
  }

  exportLogs(filter?: StructuredLogFilter): string {
    const logs = this.getLogs(filter);
    return logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] [${log.source}] ${log.message} ${JSON.stringify(log.context)}`
    ).join("\n");
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
      this.notifyListeners();
    }
  }

  subscribe(listener: (logs: StructuredLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    // 立即发送当前日志
    const currentLogs = [...this.logs];
    // 使用 setTimeout 避免在渲染周期内同步更新状态导致 React 警告
    setTimeout(() => listener(currentLogs), 0);
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const currentLogs = [...this.logs];
    this.listeners.forEach(listener => listener(currentLogs));
  }

  getLogStats(): { [key in LogLevel]: number } & { total: number } {
    const stats: any = {
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
      total: this.logs.length,
    };

    this.logs.forEach(log => {
      if (stats[log.level] !== undefined) {
        stats[log.level]++;
      }
    });

    return stats;
  }
}

// 创建全局日志服务实例
export const logService = new LogService();

// 全局错误处理
window.addEventListener('error', (event) => {
  logService.error(
    `未捕获的错误: ${event.message}`,
    'GlobalErrorHandler',
    {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack
    }
  );
});

window.addEventListener('unhandledrejection', (event) => {
  logService.error(
    `未处理的Promise拒绝: ${event.reason}`,
    'GlobalErrorHandler',
    { reason: event.reason }
  );
});

export default logService;
