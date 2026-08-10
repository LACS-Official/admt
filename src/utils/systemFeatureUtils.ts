/**
 * 系统功能工具模块
 * 提供系统托盘和开机自启动功能的工具函数和错误处理
 */

import { systemTrayService } from '../services/systemTrayService';
import { autoStartService } from '../services/autoStartService';

export interface SystemFeatureError {
  type: 'permission' | 'unsupported' | 'config' | 'unknown';
  message: string;
  code?: string;
  suggestions?: string[];
}

export interface SystemFeatureResult<T = any> {
  success: boolean;
  data?: T;
  error?: SystemFeatureError;
}

/**
 * 错误类型分析器
 */
export class SystemFeatureErrorAnalyzer {
  /**
   * 分析错误并返回用户友好的错误信息
   */
  static analyzeError(error: any): SystemFeatureError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerMessage = errorMessage.toLowerCase();

    // 权限相关错误
    if (lowerMessage.includes('permission') || 
        lowerMessage.includes('access denied') || 
        lowerMessage.includes('管理员') ||
        lowerMessage.includes('权限')) {
      return {
        type: 'permission',
        message: '操作需要管理员权限',
        suggestions: [
          '请以管理员身份运行应用',
          '检查系统安全设置',
          '确保应用具有相应权限'
        ]
      };
    }

    // 系统不支持错误
    if (lowerMessage.includes('not supported') || 
        lowerMessage.includes('unsupported') ||
        lowerMessage.includes('不支持')) {
      return {
        type: 'unsupported',
        message: '当前系统不支持此功能',
        suggestions: [
          '检查操作系统版本',
          '确认系统环境兼容性'
        ]
      };
    }

    // 配置相关错误
    if (lowerMessage.includes('config') || 
        lowerMessage.includes('registry') ||
        lowerMessage.includes('path') ||
        lowerMessage.includes('注册表') ||
        lowerMessage.includes('路径')) {
      return {
        type: 'config',
        message: '系统配置异常',
        suggestions: [
          '尝试重新配置',
          '检查系统注册表',
          '重启应用后重试'
        ]
      };
    }

    // 未知错误
    return {
      type: 'unknown',
      message: errorMessage || '发生未知错误',
      suggestions: [
        '重试操作',
        '重启应用',
        '联系技术支持'
      ]
    };
  }

  /**
   * 生成用户友好的错误提示
   */
  static generateUserMessage(error: SystemFeatureError): string {
    const baseMessage = error.message;
    
    if (error.suggestions && error.suggestions.length > 0) {
      const suggestions = error.suggestions.map(s => `• ${s}`).join('\n');
      return `${baseMessage}\n\n建议解决方案：\n${suggestions}`;
    }
    
    return baseMessage;
  }
}

/**
 * 系统托盘功能包装器
 */
export class SystemTrayHelper {
  /**
   * 安全启用系统托盘
   */
  static async enable(config?: any): Promise<SystemFeatureResult> {
    try {
      await systemTrayService().initialize(config);
      await systemTrayService().setupWindowCloseHandler(true);
      
      return {
        success: true,
        data: { message: '系统托盘已成功启用' }
      };
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }

  /**
   * 安全禁用系统托盘
   */
  static async disable(): Promise<SystemFeatureResult> {
    try {
      await systemTrayService().setupWindowCloseHandler(false);
      await systemTrayService().cleanup();
      
      return {
        success: true,
        data: { message: '系统托盘已成功禁用' }
      };
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }

  /**
   * 检查系统托盘支持状态
   */
  static async checkSupport(): Promise<SystemFeatureResult<boolean>> {
    try {
      const supported = await systemTrayService().isSystemTraySupported();
      return {
        success: true,
        data: supported
      };
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }
}

/**
 * 开机自启动功能包装器
 */
export class AutoStartHelper {
  /**
   * 安全启用开机自启动
   */
  static async enable(config?: any): Promise<SystemFeatureResult> {
    try {
      const success = await autoStartService.enableAutoStartWithValidation(config);
      
      if (success) {
        return {
          success: true,
          data: { message: '开机自启动已成功启用' }
        };
      } else {
        return {
          success: false,
          error: {
            type: 'config',
            message: '开机自启动启用失败',
            suggestions: ['检查管理员权限', '重试操作']
          }
        };
      }
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }

  /**
   * 安全禁用开机自启动
   */
  static async disable(): Promise<SystemFeatureResult> {
    try {
      const success = await autoStartService.disableAutoStart();
      
      if (success) {
        return {
          success: true,
          data: { message: '开机自启动已成功禁用' }
        };
      } else {
        return {
          success: false,
          error: {
            type: 'config',
            message: '开机自启动禁用失败',
            suggestions: ['检查管理员权限', '重试操作']
          }
        };
      }
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }

  /**
   * 检查开机自启动支持状态
   */
  static async checkSupport(): Promise<SystemFeatureResult<boolean>> {
    try {
      await autoStartService.initialize('玩机管家');
      const supported = await autoStartService.isAutoStartSupported();
      return {
        success: true,
        data: supported
      };
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }

  /**
   * 获取当前状态
   */
  static async getStatus(): Promise<SystemFeatureResult<any>> {
    try {
      const status = await autoStartService.getAutoStartStatus();
      return {
        success: true,
        data: status
      };
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }
}

/**
 * 故障恢复机制
 */
export class SystemFeatureRecovery {
  /**
   * 尝试修复系统托盘问题
   */
  static async repairSystemTray(): Promise<SystemFeatureResult> {
    try {
      console.log('🔧 正在修复系统托盘...');
      
      // 先清理现有状态
      await systemTrayService().cleanup();
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新初始化
      await systemTrayService().initialize({
        tooltip: '玩机管家',
        menuItems: [
          { id: 'show', label: '显示窗口' },
          { id: 'separator1', label: '-' },
          { id: 'exit', label: '退出应用' }
        ]
      });

      return {
        success: true,
        data: { message: '系统托盘修复成功' }
      };
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }

  /**
   * 尝试修复开机自启动问题
   */
  static async repairAutoStart(): Promise<SystemFeatureResult> {
    try {
      console.log('🔧 正在修复开机自启动...');
      
      const success = await autoStartService.repairAutoStart();
      
      if (success) {
        return {
          success: true,
          data: { message: '开机自启动修复成功' }
        };
      } else {
        return {
          success: false,
          error: {
            type: 'config',
            message: '开机自启动修复失败',
            suggestions: ['以管理员身份重试', '检查系统权限']
          }
        };
      }
    } catch (error) {
      const analyzedError = SystemFeatureErrorAnalyzer.analyzeError(error);
      return {
        success: false,
        error: analyzedError
      };
    }
  }
}

/**
 * 批量状态检查工具
 */
export class SystemFeatureStatusChecker {
  /**
   * 检查所有系统功能状态
   */
  static async checkAllFeatures(): Promise<{
    tray: SystemFeatureResult<boolean>;
    autoStart: SystemFeatureResult<any>;
  }> {
    const [trayResult, autoStartResult] = await Promise.all([
      SystemTrayHelper.checkSupport(),
      AutoStartHelper.getStatus()
    ]);

    return {
      tray: trayResult,
      autoStart: autoStartResult
    };
  }

  /**
   * 生成功能状态报告
   */
  static async generateStatusReport(): Promise<string> {
    const status = await this.checkAllFeatures();
    
    let report = '=== 系统功能状态报告 ===\n\n';
    
    // 系统托盘状态
    if (status.tray.success) {
      report += `✅ 系统托盘: ${status.tray.data ? '支持' : '不支持'}\n`;
    } else {
      report += `❌ 系统托盘: 检查失败 - ${status.tray.error?.message}\n`;
    }
    
    // 开机自启动状态
    if (status.autoStart.success) {
      const autoStartData = status.autoStart.data;
      report += `✅ 开机自启动: ${autoStartData?.isEnabled ? '已启用' : '未启用'} (${autoStartData?.method || 'unknown'})\n`;
    } else {
      report += `❌ 开机自启动: 检查失败 - ${status.autoStart.error?.message}\n`;
    }
    
    report += '\n报告生成时间: ' + new Date().toLocaleString();
    
    return report;
  }
}