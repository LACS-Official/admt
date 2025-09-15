/**
 * 统一API错误处理服务
 * 提供网络错误分类、重试机制和自动退出功能
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * API错误类型
 */
export enum APIErrorType {
  NETWORK = 'network',        // 网络连接失败
  SERVER = 'server',          // 服务器错误 (5xx)
  CLIENT = 'client',          // 客户端错误 (4xx)
  TIMEOUT = 'timeout',        // 请求超时
  RATE_LIMIT = 'rate_limit',  // 频率限制 (429)
  UNKNOWN = 'unknown'         // 未知错误
}

/**
 * API错误详情
 */
export interface APIError {
  type: APIErrorType;
  statusCode?: number;
  message: string;
  details?: string;
  retryable: boolean;
  originalError?: Error;
}

/**
 * 错误处理结果
 */
export interface ErrorHandlingResult {
  shouldRetry: boolean;
  retryDelay: number;
  userMessage: string;
  shouldExit: boolean;
}

/**
 * 重试计数器接口
 */
export interface RetryCounter {
  versionCheckCount: number;
  activationCount: number;
  
  incrementVersionCheck(): number;
  incrementActivation(): number;
  resetVersionCheck(): void;
  resetActivation(): void;
  hasExceededLimit(type: 'version' | 'activation'): boolean;
}

/**
 * 退出管理器接口
 */
export interface ExitManager {
  scheduleExit(reason: string, delay: number): Promise<void>;
  cancelScheduledExit(): void;
  forceExit(exitCode: number): Promise<void>;
  showExitCountdown(seconds: number): Promise<void>;
}

/**
 * 重试计数器实现
 */
class RetryCounterImpl implements RetryCounter {
  private readonly maxRetries = 3;
  public versionCheckCount = 0;
  public activationCount = 0;

  incrementVersionCheck(): number {
    return ++this.versionCheckCount;
  }

  incrementActivation(): number {
    return ++this.activationCount;
  }

  resetVersionCheck(): void {
    this.versionCheckCount = 0;
  }

  resetActivation(): void {
    this.activationCount = 0;
  }

  hasExceededLimit(type: 'version' | 'activation'): boolean {
    const count = type === 'version' ? this.versionCheckCount : this.activationCount;
    return count >= this.maxRetries;
  }
}

/**
 * 退出管理器实现
 */
class ExitManagerImpl implements ExitManager {
  private exitTimeoutId: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private onCountdownUpdate?: (seconds: number) => void;

  setCountdownCallback(callback: (seconds: number) => void) {
    this.onCountdownUpdate = callback;
  }

  async scheduleExit(reason: string, delay: number): Promise<void> {
    console.log(`⚠️ 应用将在 ${delay / 1000} 秒后退出: ${reason}`);
    
    // 取消之前的退出计划
    this.cancelScheduledExit();
    
    // 显示倒计时
    await this.showExitCountdown(delay / 1000);
    
    // 设置退出定时器
    this.exitTimeoutId = setTimeout(async () => {
      await this.forceExit(1);
    }, delay);
  }

  cancelScheduledExit(): void {
    if (this.exitTimeoutId) {
      clearTimeout(this.exitTimeoutId);
      this.exitTimeoutId = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  async forceExit(exitCode: number): Promise<void> {
    console.log(`🚪 强制退出应用，退出码: ${exitCode}`);
    try {
      // 尝试使用 Tauri 的退出功能
      await invoke('exit_app', { exitCode });
    } catch (error) {
      console.error('Tauri 退出失败，使用 window.close():', error);
      // 降级到浏览器关闭
      window.close();
      
      // 如果 window.close() 不起作用，强制重定向
      setTimeout(() => {
        location.href = 'about:blank';
      }, 1000);
    }
  }

  async showExitCountdown(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let remainingSeconds = Math.floor(seconds);
      
      // 立即显示初始倒计时
      if (this.onCountdownUpdate) {
        this.onCountdownUpdate(remainingSeconds);
      }
      
      // 设置倒计时间隔
      this.countdownInterval = setInterval(() => {
        remainingSeconds--;
        
        if (this.onCountdownUpdate) {
          this.onCountdownUpdate(remainingSeconds);
        }
        
        if (remainingSeconds <= 0) {
          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
          }
          resolve();
        }
      }, 1000);
    });
  }
}

/**
 * API错误处理服务
 */
export class APIErrorHandlerService {
  private static instance: APIErrorHandlerService;
  private retryCounter: RetryCounter;
  private exitManager: ExitManager;
  
  readonly maxRetries = 3;
  readonly exitDelay = 5000; // 5秒

  private constructor() {
    this.retryCounter = new RetryCounterImpl();
    this.exitManager = new ExitManagerImpl();
  }

  static getInstance(): APIErrorHandlerService {
    if (!APIErrorHandlerService.instance) {
      APIErrorHandlerService.instance = new APIErrorHandlerService();
    }
    return APIErrorHandlerService.instance;
  }

  /**
   * 设置倒计时回调函数
   */
  setCountdownCallback(callback: (seconds: number) => void) {
    if (this.exitManager instanceof ExitManagerImpl) {
      this.exitManager.setCountdownCallback(callback);
    }
  }

  /**
   * 分类API错误
   */
  classifyAPIError(error: Error | any): APIError {
    const errorMessage = error?.message || error?.toString() || '未知错误';
    const statusCode = error?.status || error?.statusCode;
    
    // 网络连接错误
    if (
      error instanceof TypeError && errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('网络连接失败') ||
      errorMessage.includes('Connection') ||
      errorMessage.includes('NETWORK_ERROR') ||
      errorMessage.includes('DNS') ||
      !navigator.onLine
    ) {
      return {
        type: APIErrorType.NETWORK,
        statusCode,
        message: '网络连接失败，请检查网络设置',
        details: errorMessage,
        retryable: true,
        originalError: error
      };
    }

    // HTTP状态码错误
    if (statusCode) {
      if (statusCode === 429) {
        return {
          type: APIErrorType.RATE_LIMIT,
          statusCode,
          message: '请求过于频繁，请稍后重试',
          details: errorMessage,
          retryable: true,
          originalError: error
        };
      }
      
      if (statusCode >= 500) {
        return {
          type: APIErrorType.SERVER,
          statusCode,
          message: '服务器暂时不可用，正在重试...',
          details: errorMessage,
          retryable: true,
          originalError: error
        };
      }
      
      if (statusCode >= 400) {
        return {
          type: APIErrorType.CLIENT,
          statusCode,
          message: '请求参数错误，请联系技术支持',
          details: errorMessage,
          retryable: false,
          originalError: error
        };
      }
    }

    // 超时错误
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('Timeout') ||
      errorMessage.includes('超时') ||
      error?.name === 'TimeoutError'
    ) {
      return {
        type: APIErrorType.TIMEOUT,
        statusCode,
        message: '请求超时，正在重试...',
        details: errorMessage,
        retryable: true,
        originalError: error
      };
    }

    // 默认未知错误
    return {
      type: APIErrorType.UNKNOWN,
      statusCode,
      message: `未知错误: ${errorMessage}`,
      details: errorMessage,
      retryable: false,
      originalError: error
    };
  }

  /**
   * 计算重试延迟时间（指数退避 + 抖动）
   */
  calculateRetryDelay(retryCount: number, errorType: APIErrorType): number {
    const baseDelay = errorType === APIErrorType.RATE_LIMIT ? 2000 : 1000;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 500; // 0-500ms 随机抖动
    
    return Math.min(exponentialDelay + jitter, 10000); // 最大10秒
  }

  /**
   * 检查是否应该重试
   */
  shouldRetry(retryCount: number, error: APIError): boolean {
    if (retryCount >= this.maxRetries) {
      return false;
    }
    
    return error.retryable;
  }

  /**
   * 处理版本检测错误
   */
  async handleVersionCheckError(error: Error | any): Promise<ErrorHandlingResult> {
    const apiError = this.classifyAPIError(error);
    const retryCount = this.retryCounter.incrementVersionCheck();
    
    console.log(`🔍 版本检测错误处理 - 第 ${retryCount} 次:`, {
      type: apiError.type,
      message: apiError.message,
      retryable: apiError.retryable,
      statusCode: apiError.statusCode
    });

    if (this.retryCounter.hasExceededLimit('version')) {
      // 超过最大重试次数，安排退出
      const exitReason = `版本检测失败: ${apiError.message}`;
      await this.exitManager.scheduleExit(exitReason, this.exitDelay);
      
      return {
        shouldRetry: false,
        retryDelay: 0,
        userMessage: `${apiError.message}，应用将在 ${this.exitDelay / 1000} 秒后退出`,
        shouldExit: true
      };
    }

    if (this.shouldRetry(retryCount - 1, apiError)) {
      const delay = this.calculateRetryDelay(retryCount - 1, apiError.type);
      
      return {
        shouldRetry: true,
        retryDelay: delay,
        userMessage: `${apiError.message} (${retryCount}/${this.maxRetries})`,
        shouldExit: false
      };
    } else {
      // 不可重试的错误，直接退出
      const exitReason = `版本检测失败: ${apiError.message}`;
      await this.exitManager.scheduleExit(exitReason, this.exitDelay);
      
      return {
        shouldRetry: false,
        retryDelay: 0,
        userMessage: `${apiError.message}，应用将在 ${this.exitDelay / 1000} 秒后退出`,
        shouldExit: true
      };
    }
  }

  /**
   * 处理激活验证错误
   */
  async handleActivationError(error: Error | any): Promise<ErrorHandlingResult> {
    const apiError = this.classifyAPIError(error);
    const retryCount = this.retryCounter.incrementActivation();
    
    console.log(`🔑 激活验证错误处理 - 第 ${retryCount} 次:`, {
      type: apiError.type,
      message: apiError.message,
      retryable: apiError.retryable,
      statusCode: apiError.statusCode
    });

    if (this.retryCounter.hasExceededLimit('activation')) {
      // 超过最大重试次数，安排退出
      const exitReason = `激活验证失败: ${apiError.message}`;
      await this.exitManager.scheduleExit(exitReason, this.exitDelay);
      
      return {
        shouldRetry: false,
        retryDelay: 0,
        userMessage: `${apiError.message}，应用将在 ${this.exitDelay / 1000} 秒后退出`,
        shouldExit: true
      };
    }

    if (this.shouldRetry(retryCount - 1, apiError)) {
      const delay = this.calculateRetryDelay(retryCount - 1, apiError.type);
      
      return {
        shouldRetry: true,
        retryDelay: delay,
        userMessage: `${apiError.message} (${retryCount}/${this.maxRetries})`,
        shouldExit: false
      };
    } else {
      // 不可重试的错误，直接退出
      const exitReason = `激活验证失败: ${apiError.message}`;
      await this.exitManager.scheduleExit(exitReason, this.exitDelay);
      
      return {
        shouldRetry: false,
        retryDelay: 0,
        userMessage: `${apiError.message}，应用将在 ${this.exitDelay / 1000} 秒后退出`,
        shouldExit: true
      };
    }
  }

  /**
   * 重置重试计数器
   */
  resetRetryCounters(): void {
    this.retryCounter.resetVersionCheck();
    this.retryCounter.resetActivation();
  }

  /**
   * 取消计划的退出
   */
  cancelScheduledExit(): void {
    this.exitManager.cancelScheduledExit();
  }

  /**
   * 获取当前重试状态
   */
  getRetryStatus() {
    return {
      versionCheckCount: this.retryCounter.versionCheckCount,
      activationCount: this.retryCounter.activationCount,
      maxRetries: this.maxRetries
    };
  }

  /**
   * 强制退出应用
   */
  async forceExit(exitCode: number = 1): Promise<void> {
    await this.exitManager.forceExit(exitCode);
  }
}

// 导出单例实例
export const apiErrorHandler = APIErrorHandlerService.getInstance();

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).apiErrorHandler = apiErrorHandler;
}