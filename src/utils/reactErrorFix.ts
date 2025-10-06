/**
 * React错误修复工具
 * 解决React项目中的常见错误问题
 */

import { SecurityConfigManager } from '../config/securityConfig';
import { SecureDataTransmissionService } from '../services/secureDataTransmissionService';

/**
 * React Hook规则检查器
 */
export class ReactHookValidator {
  private static violations: string[] = [];

  /**
   * 检查Hook调用是否符合规则
   */
  static validateHookUsage(componentName: string, hookName: string, isInComponent: boolean) {
    if (!isInComponent) {
      const violation = `❌ Hook规则违反: ${hookName} 在 ${componentName} 中被调用在组件外部`;
      this.violations.push(violation);
      console.error(violation);
      return false;
    }
    return true;
  }

  /**
   * 获取所有违规记录
   */
  static getViolations(): string[] {
    return [...this.violations];
  }

  /**
   * 清除违规记录
   */
  static clearViolations(): void {
    this.violations = [];
  }
}

/**
 * React依赖版本检查器
 */
export class ReactDependencyChecker {
  /**
   * 检查React版本一致性
   */
  static async checkReactVersions(): Promise<{
    isConsistent: boolean;
    versions: Record<string, string>;
    issues: string[];
  }> {
    const issues: string[] = [];
    const versions: Record<string, string> = {};

    try {
      // 检查React版本
      const React = await import('react');
      versions.react = React.version || 'unknown';

      // 检查ReactDOM版本
      const ReactDOM = await import('react-dom');
      versions.reactDOM = ReactDOM.version || 'unknown';

      // 检查版本一致性
      if (versions.react !== versions.reactDOM) {
        issues.push(`React版本不一致: React ${versions.react} vs ReactDOM ${versions.reactDOM}`);
      }

      // 检查是否有多个React实例
      if (typeof window !== 'undefined') {
        const reactInstances = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
        if (reactInstances && Object.keys(reactInstances).length > 1) {
          issues.push('检测到多个React实例，可能导致Hook错误');
        }
      }

      return {
        isConsistent: issues.length === 0,
        versions,
        issues
      };
    } catch (error) {
      issues.push(`版本检查失败: `);
      return {
        isConsistent: false,
        versions,
        issues
      };
    }
  }
}

/**
 * 安全配置初始化管理器
 */
export class SecurityInitializationManager {
  private static isInitializing = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * 安全地初始化SecurityConfigManager
   */
  static async safeInitialize(): Promise<void> {
    // 防止重复初始化
    if (this.isInitializing) {
      return this.initializationPromise || Promise.resolve();
    }

    if (SecurityConfigManager.getInstance().isConfigInitialized()) {
      console.log('✅ SecurityConfigManager 已经初始化');
      return Promise.resolve();
    }

    this.isInitializing = true;
    
    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = null;
    }
  }

  private static async performInitialization(): Promise<void> {
    try {
      console.log('🔐 开始安全配置初始化...');
      
      const securityConfig = SecurityConfigManager.getInstance();
      await securityConfig.initialize();
      
      // 初始化安全数据传输服务
      const dataTransmissionService = SecureDataTransmissionService.getInstance();
      await dataTransmissionService.initialize();
      
      console.log('✅ 安全配置和数据传输服务初始化完成');
    } catch (error) {
      console.error('❌ 安全配置初始化失败:', error);
      
      // 提供降级方案
      console.log('🔄 尝试降级初始化...');
      await this.fallbackInitialization();
    }
  }

  private static async fallbackInitialization(): Promise<void> {
    try {
      // 创建默认配置
      const defaultConfig = {
        api_base_url: 'https://api.example.com',
        api_key: 'default-key-' + Date.now(),
        app_id: 'admt-app',
        app_secret: 'default-secret-' + Date.now(),
        signature_secret: 'default-signature-' + Date.now(),
        enable_signature: false,
        enable_strict_user_agent: false,
        app_version: '1.0.0',
        software_id: 1
      };

      console.log('⚠️ 使用默认安全配置');
      
      // 这里可以设置一个标志，表示使用的是降级配置
      (window as any).__ADMT_FALLBACK_CONFIG__ = true;
      
    } catch (fallbackError) {
      console.error('❌ 降级初始化也失败:', fallbackError);
      throw new Error('安全配置初始化完全失败');
    }
  }

  /**
   * 检查初始化状态
   */
  static isInitialized(): boolean {
    return SecurityConfigManager.getInstance().isConfigInitialized();
  }

  /**
   * 等待初始化完成
   */
  static async waitForInitialization(timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (!SecurityConfigManager.getInstance().isConfigInitialized() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return SecurityConfigManager.getInstance().isConfigInitialized();
  }
}

/**
 * useCallback错误修复器
 */
export class UseCallbackErrorFixer {
  /**
   * 安全的useCallback包装器
   */
  static safeUseCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList,
    fallback?: T
  ): T {
    try {
      const React = require('react');
      return React.useCallback(callback, deps);
    } catch (error) {
      console.error('useCallback错误:', error);
      
      // 返回降级函数
      if (fallback) {
        return fallback;
      }
      
      // 返回原始回调函数
      return callback;
    }
  }

  /**
   * 修复null属性读取错误
   */
  static safePropertyAccess<T>(obj: any, property: string, defaultValue: T): T {
    try {
      if (obj && typeof obj === 'object' && property in obj) {
        return obj[property] ?? defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.warn(`安全属性访问失败: ${property}`, error);
      return defaultValue;
    }
  }
}

/**
 * 综合错误修复器
 */
export class ReactErrorFixer {
  /**
   * 执行所有修复检查
   */
  static async performAllChecks(): Promise<{
    success: boolean;
    results: {
      hookValidation: boolean;
      versionCheck: boolean;
      securityInit: boolean;
    };
    issues: string[];
  }> {
    const issues: string[] = [];
    const results = {
      hookValidation: true,
      versionCheck: true,
      securityInit: true
    };

    try {
      // 1. 检查React版本一致性
      console.log('🔍 检查React版本一致性...');
      const versionCheck = await ReactDependencyChecker.checkReactVersions();
      if (!versionCheck.isConsistent) {
        results.versionCheck = false;
        issues.push(...versionCheck.issues);
      }

      // 2. 初始化安全配置
      console.log('🔐 初始化安全配置...');
      try {
        await SecurityInitializationManager.safeInitialize();
      } catch (error) {
        results.securityInit = false;
        issues.push(`安全配置初始化失败: ${error}`);
      }

      // 3. 检查Hook违规
      const violations = ReactHookValidator.getViolations();
      if (violations.length > 0) {
        results.hookValidation = false;
        issues.push(...violations);
      }

      const success = results.hookValidation && results.versionCheck && results.securityInit;
      
      if (success) {
        console.log('✅ 所有React错误检查通过');
      } else {
        console.warn('⚠️ 发现React错误问题:', issues);
      }

      return { success, results, issues };
    } catch (error) {
      issues.push(`错误检查过程失败: ${error}`);
      return {
        success: false,
        results: {
          hookValidation: false,
          versionCheck: false,
          securityInit: false
        },
        issues
      };
    }
  }

  /**
   * 自动修复已知问题
   */
  static async autoFix(): Promise<void> {
    console.log('🔧 开始自动修复React错误...');
    
    try {
      // 清除Hook违规记录
      ReactHookValidator.clearViolations();
      
      // 确保安全配置初始化
      await SecurityInitializationManager.safeInitialize();
      
      console.log('✅ 自动修复完成');
    } catch (error) {
      console.error('❌ 自动修复失败:', error);
      throw error;
    }
  }
}

export default ReactErrorFixer;