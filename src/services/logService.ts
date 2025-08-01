export type LogLevel = "error" | "warning" | "info" | "debug";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source?: string;
  details?: any;
}

export interface LogFilter {
  level?: LogLevel;
  source?: string;
  search?: string;
}

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    // 初始化时添加启动日志
    this.log("info", "日志系统初始化完成", "LogService");
  }

  log(level: LogLevel, message: string, source?: string, details?: any): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      source,
      details,
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

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ""}`;
    
    switch (entry.level) {
      case "error":
        console.error(prefix, entry.message, entry.details || "");
        break;
      case "warning":
        console.warn(prefix, entry.message, entry.details || "");
        break;
      case "info":
        console.info(prefix, entry.message, entry.details || "");
        break;
      case "debug":
        console.debug(prefix, entry.message, entry.details || "");
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

  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter?.source) {
      filteredLogs = filteredLogs.filter(log => 
        log.source?.toLowerCase().includes(filter.source!.toLowerCase())
      );
    }

    if (filter?.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.source && log.source.toLowerCase().includes(searchTerm))
      );
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
    this.log("info", "日志已清空", "LogService");
    this.notifyListeners();
  }

  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}]${log.source ? ` [${log.source}]` : ""} ${log.message}${log.details ? ` - ${JSON.stringify(log.details)}` : ""}`
    ).join("\n");
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
      this.notifyListeners();
    }
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    // 立即发送当前日志
    listener([...this.logs]);
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  getLogStats(): { [key in LogLevel]: number } & { total: number } {
    const stats = {
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
      total: this.logs.length,
    };

    this.logs.forEach(log => {
      stats[log.level]++;
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
