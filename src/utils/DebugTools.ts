import React from 'react';
import { logService } from '../services/logService';
import { SecurityConfigService } from '../services/SecurityConfigService';
import { SecureDataTransferService } from '../services/SecureDataTransferService';
import { UserBehaviorService } from '../services/userBehaviorService';

export class DebugTools {
  static checkReactVersion(): void {
    const reactVersion = React.version;
    const reactDomVersion = (window as any).ReactDOM?.version || reactVersion; // 如果获取不到，使用React版本
    
    logService.info('React版本检查', 'DebugTools', {
      react: reactVersion,
      reactDom: reactDomVersion,
      match: reactVersion === reactDomVersion
    });

    if (reactVersion !== reactDomVersion && reactDomVersion !== reactVersion) {
      logService.warning('React版本不匹配', 'DebugTools', {
        react: reactVersion,
        reactDom: reactDomVersion,
        recommendation: '请确保React和ReactDOM版本一致'
      });
    } else {
      logService.info('React版本匹配', 'DebugTools', {
        version: reactVersion,
        status: '正常'
      });
    }
  }

  static checkHookRules(): void {
    const checks = {
      inComponent: typeof React.useState === 'function',
      hasReact: typeof React !== 'undefined',
      hasHooks: typeof React.useState === 'function' && typeof React.useEffect === 'function'
    };

    logService.info('Hook规则检查', 'DebugTools', checks);

    if (!checks.hasHooks) {
      logService.error('Hook不可用', 'DebugTools', {
        suggestion: '请检查React版本是否支持Hooks (>=16.8.0)'
      });
    }
  }

  static async checkServiceStatus(): Promise<void> {
    const status = {
      security: SecurityConfigService.getInstance().isInitialized(),
      dataTransfer: SecureDataTransferService.getInstance().isInitialized(),
      userBehavior: UserBehaviorService.getInstance().isInitialized(),
      logging: true // logService 总是可用的
    };

    logService.info('服务状态检查', 'DebugTools', status);

    const failedServices = Object.entries(status)
      .filter(([, initialized]) => !initialized)
      .map(([service]) => service);

    if (failedServices.length > 0) {
      logService.warning('部分服务未初始化', 'DebugTools', {
        failed: failedServices,
        recommendation: '请检查服务初始化顺序和依赖关系'
      });
    }
  }

  static generateDiagnosticReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      react: {
        version: React.version,
        reactDomVersion: (window as any).ReactDOM?.version
      },
      services: {
        security: SecurityConfigService.getInstance().isInitialized(),
        dataTransfer: SecureDataTransferService.getInstance().isInitialized(),
        userBehavior: UserBehaviorService.getInstance().isInitialized(),
        logging: true // logService 总是可用的
      },
      logs: logService.getLogs().slice(-10), // 最近10条日志
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    };

    logService.info('诊断报告生成', 'DebugTools', report);
    return report;
  }

  static async runFullDiagnostic(): Promise<void> {
    logService.info('开始完整诊断', 'DebugTools');
    
    this.checkReactVersion();
    this.checkHookRules();
    await this.checkServiceStatus();
    
    const report = this.generateDiagnosticReport();
    
    logService.info('诊断完成', 'DebugTools', {
      summary: {
        reactVersionMatch: report.react.version === report.react.reactDomVersion,
        allServicesInitialized: Object.values(report.services).every(Boolean),
        totalLogs: report.logs.length
      }
    });
  }
}

// 将调试工具暴露到全局，方便开发时使用
if (typeof window !== 'undefined') {
  (window as any).DebugTools = DebugTools;
}