/**
 * Console Logger - 将系统级别的日志记录与日志管理系统集成
 * 
 * 这个工具提供了对console.log、console.error、console.warn、console.info和console.debug的增强，
 * 使它们同时输出到控制台和我们的日志管理系统。
 * 
 * 使用方法：
 * 1. 直接替换原有的console调用
 *    console.log('消息') -> consoleLogger.log('消息')
 * 2. 或者使用包装器
 *    consoleLogger.withContext('ComponentName').log('消息')
 */

import { enhancedLogService } from '@/services/enhancedLogService';

// 定义日志级别类型
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 定义上下文接口
interface LogContext {
  source?: string;
  category?: string;
  additionalData?: Record<string, any>;
}

// 定义日志选项接口
interface LogOptions {
  includeConsole?: boolean;  // 是否同时输出到控制台，默认为true
  includeSystem?: boolean;   // 是否同时输出到系统日志，默认为true
  context?: LogContext;      // 日志上下文
}

/**
 * ConsoleLogger类 - 提供增强的日志记录功能
 */
class ConsoleLogger {
  private defaultSource: string = 'Unknown';
  private defaultCategory: string = 'system';
  
  /**
   * 创建带有指定上下文的日志记录器
   * @param source 日志来源（通常是组件名或文件名）
   * @param category 日志分类
   * @returns 带有预设上下文的日志记录器
   */
  withContext(source: string, category?: string): ConsoleLogger {
    const logger = new ConsoleLogger();
    logger.defaultSource = source;
    logger.defaultCategory = category || this.defaultCategory;
    return logger;
  }
  
  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param data 附加数据
   * @param options 日志选项
   */
  debug(message: string, data?: any, options: LogOptions = {}): void {
    this.log('debug', message, data, options);
  }
  
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param data 附加数据
   * @param options 日志选项
   */
  info(message: string, data?: any, options: LogOptions = {}): void {
    this.log('info', message, data, options);
  }
  
  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param data 附加数据
   * @param options 日志选项
   */
  warn(message: string, data?: any, options: LogOptions = {}): void {
    this.log('warn', message, data, options);
  }
  
  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param error 错误对象
   * @param options 日志选项
   */
  error(message: string, error?: any, options: LogOptions = {}): void {
    this.log('error', message, error, options);
  }
  
  /**
   * 记录用户操作日志
   * @param action 用户操作描述
   * @param data 附加数据
   * @param source 操作来源（可选，默认为defaultSource）
   */
  userAction(action: string, data?: any, source?: string): void {
    const finalSource = source || this.defaultSource;
    enhancedLogService.logUserAction(action, finalSource, data);
    
    // 同时输出到控制台
    console.log(`[用户操作] [${finalSource}] ${action}`, data || '');
  }
  
  /**
   * 内部日志记录方法
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   * @param options 日志选项
   */
  private log(level: LogLevel, message: string, data?: any, options: LogOptions = {}): void {
    const {
      includeConsole = true,
      includeSystem = true,
      context = {}
    } = options;
    
    const source = context.source || this.defaultSource;
    const category = context.category || this.defaultCategory;
    const additionalData = context.additionalData || {};
    
    // 合并数据
    const finalData = {
      ...additionalData,
      ...(data !== undefined ? { data } : {})
    };
    
    // 输出到控制台
    if (includeConsole) {
      this.logToConsole(level, message, finalData, source);
    }
    
    // 输出到系统日志
    if (includeSystem) {
      this.logToSystem(level, message, finalData, source, category);
    }
  }
  
  /**
   * 输出到控制台
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   * @param source 日志来源
   */
  private logToConsole(level: LogLevel, message: string, data: any, source: string): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${source}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data);
        break;
      case 'info':
        console.info(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }
  
  /**
   * 输出到系统日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据
   * @param source 日志来源
   * @param category 日志分类
   */
  private logToSystem(level: LogLevel, message: string, data: any, source: string, category: string): void {
    // 将日志级别映射到系统日志级别
    const systemLevel = this.mapLogLevel(level);
    
    // 使用enhancedLogService记录日志
    switch (systemLevel) {
      case 'debug':
        enhancedLogService.logDebug(message, source, data);
        break;
      case 'info':
        enhancedLogService.logInfo(message, source, data);
        break;
      case 'warning':
        enhancedLogService.logWarning(message, source, data);
        break;
      case 'error':
        enhancedLogService.logError(message, source, data);
        break;
    }
  }
  
  /**
   * 将日志级别映射到系统日志级别
   * @param level 日志级别
   * @returns 系统日志级别
   */
  private mapLogLevel(level: LogLevel): 'debug' | 'info' | 'warning' | 'error' {
    switch (level) {
      case 'debug':
        return 'debug';
      case 'info':
        return 'info';
      case 'warn':
        return 'warning';
      case 'error':
        return 'error';
    }
  }
}

// 创建全局实例
export const consoleLogger = new ConsoleLogger();

// 导出类，以便创建自定义实例
export { ConsoleLogger };

/**
 * 全局console包装器 - 替换原生console方法
 * 
 * 使用方法：
 * 在应用入口文件（如main.tsx）中调用installConsoleWrapper()，
 * 然后就可以继续使用console.log等方法，它们会自动同时输出到控制台和系统日志。
 */

// 保存原始console方法
const originalConsole = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error
};

/**
 * 安装console包装器
 * @param defaultSource 默认日志来源
 * @param defaultCategory 默认日志分类
 */
export function installConsoleWrapper(defaultSource: string = 'Global', defaultCategory: string = 'system'): void {
  const logger = consoleLogger.withContext(defaultSource, defaultCategory);
  
  // 替换console方法
  console.log = function(message?: any, ...optionalParams: any[]) {
    // 调用原始方法
    originalConsole.log.apply(console, [message, ...optionalParams]);
    
    // 记录到系统日志
    if (message !== undefined) {
      const data = optionalParams.length > 0 ? optionalParams : undefined;
      logger.info(String(message), data, { includeConsole: false });
    }
  };
  
  console.debug = function(message?: any, ...optionalParams: any[]) {
    originalConsole.debug.apply(console, [message, ...optionalParams]);
    
    if (message !== undefined) {
      const data = optionalParams.length > 0 ? optionalParams : undefined;
      logger.debug(String(message), data, { includeConsole: false });
    }
  };
  
  console.info = function(message?: any, ...optionalParams: any[]) {
    originalConsole.info.apply(console, [message, ...optionalParams]);
    
    if (message !== undefined) {
      const data = optionalParams.length > 0 ? optionalParams : undefined;
      logger.info(String(message), data, { includeConsole: false });
    }
  };
  
  console.warn = function(message?: any, ...optionalParams: any[]) {
    originalConsole.warn.apply(console, [message, ...optionalParams]);
    
    if (message !== undefined) {
      const data = optionalParams.length > 0 ? optionalParams : undefined;
      logger.warn(String(message), data, { includeConsole: false });
    }
  };
  
  console.error = function(message?: any, ...optionalParams: any[]) {
    originalConsole.error.apply(console, [message, ...optionalParams]);
    
    if (message !== undefined) {
      const data = optionalParams.length > 0 ? optionalParams : undefined;
      logger.error(String(message), data, { includeConsole: false });
    }
  };
}

/**
 * 恢复原始console方法
 */
export function restoreConsole(): void {
  console.log = originalConsole.log;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
}