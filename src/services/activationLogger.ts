/**
 * 激活系统日志记录服务
 * 提供详细的日志记录、错误跟踪和监控功能
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
  sessionId: string;
}

/**
 * 激活日志记录器
 */
export class ActivationLogger {
  private static instance: ActivationLogger;
  private logs: LogEntry[] = [];
  private sessionId: string;
  private maxLogs: number = 1000; // 最大保存日志数量
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.logLevel = this.getLogLevelFromStorage();
    console.log(`激活日志系统初始化，会话ID: ${this.sessionId}`);
  }

  public static getInstance(): ActivationLogger {
    if (!ActivationLogger.instance) {
      ActivationLogger.instance = new ActivationLogger();
    }
    return ActivationLogger.instance;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 从本地存储获取日志级别
   */
  private getLogLevelFromStorage(): LogLevel {
    try {
      const stored = localStorage.getItem('hout_log_level');
      if (stored) {
        const level = parseInt(stored, 10);
        if (level >= LogLevel.DEBUG && level <= LogLevel.ERROR) {
          return level;
        }
      }
    } catch (error) {
      // 忽略存储错误
    }
    return LogLevel.INFO;
  }

  /**
   * 设置日志级别
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    try {
      localStorage.setItem('hout_log_level', level.toString());
    } catch (error) {
      console.warn('无法保存日志级别设置:', error);
    }
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, category: string, message: string, data?: any, error?: Error): void {
    if (level < this.logLevel) {
      return; // 跳过低级别日志
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
      sessionId: this.sessionId,
    };

    // 添加到内存日志
    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 输出到控制台
    this.outputToConsole(entry);

    // 保存关键日志到本地存储
    if (level >= LogLevel.WARN) {
      this.saveToLocalStorage(entry);
    }
  }

  /**
   * 输出到控制台
   */
  private outputToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}][${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data, entry.error);
        break;
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToLocalStorage(entry: LogEntry): void {
    try {
      const key = `hout_log_${entry.level}_${Date.now()}`;
      const logData = {
        ...entry,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        } : undefined,
      };
      localStorage.setItem(key, JSON.stringify(logData));

      // 清理旧日志（保留最近100条错误/警告日志）
      this.cleanupOldLogs();
    } catch (error) {
      console.warn('无法保存日志到本地存储:', error);
    }
  }

  /**
   * 清理旧日志
   */
  private cleanupOldLogs(): void {
    try {
      const logKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('hout_log_'))
        .sort()
        .reverse();

      // 保留最近100条日志
      if (logKeys.length > 100) {
        const keysToRemove = logKeys.slice(100);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('清理旧日志失败:', error);
    }
  }

  // 公共日志方法
  public debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  public info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  public warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  public error(category: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data, error);
  }

  // 特定于激活系统的日志方法
  public logActivationAttempt(activationCode: string, userConfig: any): void {
    this.info('ACTIVATION', '开始激活尝试', {
      activationCode: activationCode.substring(0, 8) + '****',
      userConfig: {
        username: userConfig.username,
        language: userConfig.language,
      },
    });
  }

  public logActivationSuccess(response: any): void {
    this.info('ACTIVATION', '激活成功', {
      status: response.status,
      expiryDate: response.expiryDate,
      hasApiValidation: !!response.apiValidation,
    });
  }

  public logActivationFailure(error: any, activationCode?: string): void {
    this.error('ACTIVATION', '激活失败', error instanceof Error ? error : new Error(String(error)), {
      activationCode: activationCode ? activationCode.substring(0, 8) + '****' : undefined,
    });
  }

  public logExpirationCheck(result: any): void {
    this.info('EXPIRATION', '过期检查完成', {
      isExpired: result.isExpired,
      needsActivation: result.needsActivation,
      expiryDate: result.expiryDate?.toISOString(),
      expiredReason: result.expiredReason,
    });
  }

  public logExpirationHandling(action: string, details?: any): void {
    this.warn('EXPIRATION', `过期处理: ${action}`, details);
  }

  public logDataCorruption(details: any): void {
    this.error('DATA_INTEGRITY', '检测到数据损坏', new Error('激活数据校验失败'), details);
  }

  public logSecurityEvent(event: string, details: any): void {
    this.warn('SECURITY', `安全事件: ${event}`, details);
  }

  /**
   * 获取日志统计
   */
  public getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    sessionId: string;
    oldestLog?: string;
    newestLog?: string;
  } {
    const byLevel = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
    });

    return {
      total: this.logs.length,
      byLevel,
      sessionId: this.sessionId,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp,
    };
  }

  /**
   * 获取最近的日志
   */
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 按类别获取日志
   */
  public getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * 导出日志（用于调试）
   */
  public exportLogs(): string {
    const exportData = {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      stats: this.getLogStats(),
      logs: this.logs,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 清除所有日志
   */
  public clearLogs(): void {
    this.logs = [];
    this.info('SYSTEM', '日志已清除');
  }
}

// 导出单例实例
export const activationLogger = ActivationLogger.getInstance();
