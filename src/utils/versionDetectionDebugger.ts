/**
 * 版本检测调试工具
 * 用于分析开发版与发布版的差异
 */

export class VersionDetectionDebugger {
  private static instance: VersionDetectionDebugger;
  
  static getInstance(): VersionDetectionDebugger {
    if (!this.instance) {
      this.instance = new VersionDetectionDebugger();
    }
    return this.instance;
  }
  
  /**
   * 记录版本检测请求详情
   */
  logVersionCheckRequest(url: string, headers: Record<string, string>, body?: any) {
    const requestInfo = {
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      url,
      headers: this.sanitizeHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
      userAgent: navigator.userAgent
    };
    
    console.group('🌐 版本检测请求详情');
    console.log('📊 请求信息:', requestInfo);
    console.groupEnd();
    
    return requestInfo;
  }
  
  /**
   * 记录版本检测响应详情
   */
  logVersionCheckResponse(response: Response, data?: any) {
    const responseInfo = {
      timestamp: new Date().toISOString(),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data
    };
    
    console.group('📡 版本检测响应详情');
    console.log('📊 响应信息:', responseInfo);
    console.groupEnd();
    
    return responseInfo;
  }
  
  /**
   * 记录版本比较详情
   */
  logVersionComparison(current: string, latest: string, result: number) {
    const comparisonInfo = {
      timestamp: new Date().toISOString(),
      currentVersion: current,
      latestVersion: latest,
      comparisonResult: result,
      resultText: result > 0 ? '当前版本更新' : 
                 result < 0 ? '有新版本可用' : '版本相同'
    };
    
    console.group('🔢 版本比较详情');
    console.log('📊 比较信息:', comparisonInfo);
    console.groupEnd();
    
    return comparisonInfo;
  }
  
  /**
   * 记录错误详情
   */
  logError(error: any, context: string) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      stack: error.stack,
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV
    };
    
    console.group('❌ 版本检测错误详情');
    console.error('📊 错误信息:', errorInfo);
    console.groupEnd();
    
    return errorInfo;
  }
  
  /**
   * 清理敏感头信息
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    // 隐藏敏感信息
    if (sanitized['X-API-Key']) {
      sanitized['X-API-Key'] = '***HIDDEN***';
    }
    if (sanitized['X-Request-Signature']) {
      sanitized['X-Request-Signature'] = '***HIDDEN***';
    }
    
    return sanitized;
  }
  
  /**
   * 生成环境差异报告
   */
  generateEnvironmentDiffReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        mode: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        softwareId: import.meta.env.VITE_SOFTWARE_ID,
        appVersion: import.meta.env.VITE_APP_VERSION,
        enableSignature: import.meta.env.VITE_ENABLE_SIGNATURE,
        enableStrictUserAgent: import.meta.env.VITE_ENABLE_STRICT_USER_AGENT,
        enableDebug: import.meta.env.VITE_ENABLE_DEBUG
      },
      runtime: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };
    
    console.group('📋 环境差异报告');
    console.log('📊 报告内容:', report);
    console.groupEnd();
    
    return report;
  }
}

// 在开发环境下暴露调试工具
if (import.meta.env.DEV) {
  (window as any).versionDebugger = VersionDetectionDebugger.getInstance();
}

export default VersionDetectionDebugger;