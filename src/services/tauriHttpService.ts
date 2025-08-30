/**
 * Tauri HTTP 服务
 * 使用 @tauri-apps/plugin-http 绕过 WebView CORS 限制
 * 专门处理 api-g.lacs.cc 的 API 请求
 */

import { fetch } from '@tauri-apps/plugin-http';
import { API_CONFIG, getDefaultHeaders, ApiResponse, ErrorResponse } from '../config/api';

// 类型定义
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface TauriHttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

export class TauriHttpService {
  private static instance: TauriHttpService;
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetryCount: number;
  private defaultRetryDelay: number;

  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
    this.defaultRetryCount = API_CONFIG.RETRY_COUNT;
    this.defaultRetryDelay = API_CONFIG.RETRY_DELAY;
  }

  public static getInstance(): TauriHttpService {
    if (!TauriHttpService.instance) {
      TauriHttpService.instance = new TauriHttpService();
    }
    return TauriHttpService.instance;
  }

  /**
   * 发起 HTTP 请求
   */
  public async request<T = any>(
    endpoint: string,
    options: TauriHttpRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retryCount = this.defaultRetryCount,
      retryDelay = this.defaultRetryDelay,
    } = options;

    // 构建完整 URL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    // 合并默认请求头
    const requestHeaders = {
      ...getDefaultHeaders(),
      ...headers,
    };

    // 构建请求配置
    const requestConfig: any = {
      method,
      headers: requestHeaders,
    };

    // 添加请求体
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      if (typeof body === 'object') {
        requestConfig.body = JSON.stringify(body);
      } else if (typeof body === 'string') {
        requestConfig.body = body;
      }
    }

    // 执行请求（带重试）
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        console.log(`🔄 发起 HTTP 请求: ${method} ${url} (尝试 ${attempt + 1}/${retryCount + 1})`);

        const response = await fetch(url, requestConfig);
        
        // 检查响应状态
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // 解析响应数据
        const responseText = await response.text();
        let data: any;
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          // 如果不是 JSON，返回原始文本
          data = responseText;
        }

        console.log(`✅ HTTP 请求成功: ${method} ${url} (status: ${response.status}, dataType: ${typeof data})`);

        // 返回标准化响应
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };

      } catch (error) {
        lastError = error as Error;
        
        console.warn(`⚠️ HTTP 请求失败 (尝试 ${attempt + 1}/${retryCount + 1}): ${method} ${url} - ${lastError.message}, willRetry: ${attempt < retryCount}`);

        // 如果不是最后一次尝试，等待后重试
        if (attempt < retryCount) {
          await this.sleep(retryDelay);
        }
      }
    }

    // 所有重试都失败了
    const errorMessage = lastError?.message || '未知网络错误';
    
    console.error(`❌ HTTP 请求最终失败: ${method} ${url} - ${errorMessage}, totalAttempts: ${retryCount + 1}`);

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    } as ErrorResponse;
  }

  /**
   * GET 请求
   */
  public async get<T = any>(
    endpoint: string,
    options: Omit<TauriHttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST 请求
   */
  public async post<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<TauriHttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT 请求
   */
  public async put<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<TauriHttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE 请求
   */
  public async delete<T = any>(
    endpoint: string,
    options: Omit<TauriHttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH 请求
   */
  public async patch<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<TauriHttpRequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * 检查服务是否可用
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/api/health', { 
        timeout: 5000,
        retryCount: 1 
      });
      return response.success;
    } catch (error) {
      console.warn('⚠️ 健康检查失败:', (error as Error).message);
      return false;
    }
  }

  /**
   * 设置基础 URL
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    console.log('🔧 更新 HTTP 服务基础 URL:', baseUrl);
  }

  /**
   * 获取当前基础 URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测试网络连接
   */
  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔍 开始测试网络连接...');
      
      // 测试基本的网络连接
      const testUrl = `${this.baseUrl}/app/software/id/1`;
      console.log('🌐 测试URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: getDefaultHeaders()
      });
      
      console.log('📡 响应状态:', response.status, response.statusText);
      console.log('📋 响应头:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.text();
        console.log('✅ 网络连接测试成功');
        return {
          success: true,
          message: '网络连接正常',
          details: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            dataLength: data.length
          }
        };
      } else {
        console.warn('⚠️ 服务器返回错误状态:', response.status);
        return {
          success: false,
          message: `服务器返回错误: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error) {
      console.error('❌ 网络连接测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 分析错误类型
      let detailedMessage = '网络连接失败';
      if (errorMessage.includes('fetch')) {
        detailedMessage = '无法发起网络请求，可能是网络权限问题';
      } else if (errorMessage.includes('timeout')) {
        detailedMessage = '网络请求超时，请检查网络连接';
      } else if (errorMessage.includes('CORS')) {
        detailedMessage = 'CORS跨域问题，请检查服务器配置';
      }
      
      return {
        success: false,
        message: detailedMessage,
        details: { error: errorMessage }
      };
    }
  }
}

// 导出单例实例
export const tauriHttpService = TauriHttpService.getInstance();
export default tauriHttpService;
