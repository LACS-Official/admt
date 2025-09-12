/**
 * 版本检测诊断服务
 * 专门分析开发版和发布版在版本检测功能上的差异
 */

import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

export interface VersionDetectionDiagnostic {
  environment: 'development' | 'production';
  issues: DiagnosticIssue[];
  recommendations: string[];
  networkTests: NetworkTestResult[];
  permissionTests: PermissionTestResult[];
  configurationTests: ConfigTestResult[];
  summary: {
    criticalIssues: number;
    warningIssues: number;
    totalTests: number;
    passedTests: number;
  };
}

export interface DiagnosticIssue {
  category: 'critical' | 'warning' | 'info';
  component: string;
  issue: string;
  impact: string;
  solution: string;
}

export interface NetworkTestResult {
  testName: string;
  url: string;
  method: string;
  success: boolean;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  headers?: Record<string, string>;
}

export interface PermissionTestResult {
  permission: string;
  granted: boolean;
  required: boolean;
  impact: string;
}

export interface ConfigTestResult {
  configKey: string;
  expectedValue: any;
  actualValue: any;
  isValid: boolean;
  environment: string;
}

/**
 * 版本检测诊断类
 */
class VersionDetectionDiagnosticService {
  private issues: DiagnosticIssue[] = [];
  private networkTests: NetworkTestResult[] = [];
  private permissionTests: PermissionTestResult[] = [];
  private configTests: ConfigTestResult[] = [];

  /**
   * 执行完整的版本检测诊断
   */
  async runFullDiagnostic(): Promise<VersionDetectionDiagnostic> {
    console.log('🔍 开始版本检测诊断...');
    
    // 重置状态
    this.issues = [];
    this.networkTests = [];
    this.permissionTests = [];
    this.configTests = [];

    const environment = import.meta.env.MODE === 'production' ? 'production' : 'development';
    
    // 1. 环境配置检测
    await this.testEnvironmentConfiguration();
    
    // 2. 网络连接测试
    await this.testNetworkConnectivity();
    
    // 3. Tauri权限测试
    await this.testTauriPermissions();
    
    // 4. API端点测试
    await this.testApiEndpoints();
    
    // 5. 版本获取测试
    await this.testVersionRetrieval();
    
    // 6. CSP策略检测
    await this.testCSPPolicy();
    
    // 7. 生成建议
    const recommendations = this.generateRecommendations();
    
    const summary = this.generateSummary();
    
    console.log('✅ 版本检测诊断完成');
    
    return {
      environment,
      issues: this.issues,
      recommendations,
      networkTests: this.networkTests,
      permissionTests: this.permissionTests,
      configurationTests: this.configTests,
      summary
    };
  }

  /**
   * 测试环境配置
   */
  private async testEnvironmentConfiguration() {
    console.log('🔧 测试环境配置...');
    
    // 检查环境变量
    const envTests = [
      { key: 'VITE_API_BASE_URL', expected: 'https://api-g.lacs.cc' },
      { key: 'VITE_SOFTWARE_ID', expected: '1' },
      { key: 'VITE_APP_VERSION', expected: /^\d+\.\d+\.\d+/ }
    ];
    
    for (const test of envTests) {
      const actualValue = import.meta.env[test.key];
      const isValid = typeof test.expected === 'string' 
        ? actualValue === test.expected
        : test.expected.test(actualValue || '');
      
      this.configTests.push({
        configKey: test.key,
        expectedValue: test.expected,
        actualValue,
        isValid,
        environment: import.meta.env.MODE
      });
      
      if (!isValid) {
        this.issues.push({
          category: 'critical',
          component: 'Environment Configuration',
          issue: `环境变量 ${test.key} 配置错误`,
          impact: '版本检测API调用可能失败',
          solution: `检查 .env 和 .env.production 文件中的 ${test.key} 配置`
        });
      }
    }
    
    // 检查生产环境特有配置
    if (import.meta.env.MODE === 'production') {
      const prodSignature = import.meta.env.VITE_SIGNATURE_SECRET;
      if (!prodSignature || prodSignature === 'dev_signature_secret') {
        this.issues.push({
          category: 'critical',
          component: 'Production Security',
          issue: '生产环境缺少有效的签名密钥',
          impact: 'API请求可能被服务器拒绝',
          solution: '在 .env.production 中配置有效的 VITE_SIGNATURE_SECRET'
        });
      }
    }
  }

  /**
   * 测试网络连接
   */
  private async testNetworkConnectivity() {
    console.log('🌐 测试网络连接...');
    
    const testUrls = [
      'https://api-g.lacs.cc',
      'https://api-g.lacs.cc/app/software/id/1',
      'https://admt.lacs.cc/download'
    ];
    
    for (const url of testUrls) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ADMT-Diagnostic'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        const responseTime = Date.now() - startTime;
        
        this.networkTests.push({
          testName: `网络连接测试 - ${url}`,
          url,
          method: 'GET',
          success: response.ok,
          responseTime,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (!response.ok) {
          this.issues.push({
            category: response.status >= 500 ? 'critical' : 'warning',
            component: 'Network Connectivity',
            issue: `API端点 ${url} 返回错误状态码 ${response.status}`,
            impact: '版本检测功能可能无法正常工作',
            solution: '检查网络连接和API服务器状态'
          });
        }
        
      } catch (error) {
        this.networkTests.push({
          testName: `网络连接测试 - ${url}`,
          url,
          method: 'GET',
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
        
        this.issues.push({
          category: 'critical',
          component: 'Network Connectivity',
          issue: `无法连接到 ${url}`,
          impact: '版本检测功能完全无法工作',
          solution: '检查网络连接、防火墙设置和DNS解析'
        });
      }
    }
  }

  /**
   * 测试Tauri权限
   */
  private async testTauriPermissions() {
    console.log('🔐 测试Tauri权限...');
    
    const permissions = [
      {
        name: 'HTTP请求权限',
        test: async () => {
          try {
            await fetch('https://httpbin.org/get', { method: 'GET' });
            return true;
          } catch {
            return false;
          }
        },
        required: true,
        impact: '无法进行版本检测API调用'
      },
      {
        name: 'Shell打开权限',
        test: async () => {
          try {
            const { open } = await import('@tauri-apps/plugin-shell');
            // 不实际打开，只测试导入
            return typeof open === 'function';
          } catch {
            return false;
          }
        },
        required: true,
        impact: '无法打开下载链接'
      },
      {
        name: '应用版本获取权限',
        test: async () => {
          try {
            await getVersion();
            return true;
          } catch {
            return false;
          }
        },
        required: true,
        impact: '无法获取本地应用版本进行比较'
      }
    ];
    
    for (const permission of permissions) {
      try {
        const granted = await permission.test();
        
        this.permissionTests.push({
          permission: permission.name,
          granted,
          required: permission.required,
          impact: permission.impact
        });
        
        if (!granted && permission.required) {
          this.issues.push({
            category: 'critical',
            component: 'Tauri Permissions',
            issue: `缺少必需的权限: ${permission.name}`,
            impact: permission.impact,
            solution: '检查 tauri.conf.json 中的权限配置和 capabilities 设置'
          });
        }
      } catch (error) {
        this.permissionTests.push({
          permission: permission.name,
          granted: false,
          required: permission.required,
          impact: permission.impact
        });
        
        this.issues.push({
          category: 'critical',
          component: 'Tauri Permissions',
          issue: `权限测试失败: ${permission.name}`,
          impact: permission.impact,
          solution: '检查Tauri配置和插件安装'
        });
      }
    }
  }

  /**
   * 测试API端点
   */
  private async testApiEndpoints() {
    console.log('🔌 测试API端点...');
    
    const apiUrl = 'https://api-g.lacs.cc/app/software/id/1';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ADMT-App'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        try {
          const data = await response.json();
          
          // 验证响应结构
          if (!data.success) {
            this.issues.push({
              category: 'warning',
              component: 'API Response',
              issue: 'API返回success=false',
              impact: '版本检测可能无法获取正确的版本信息',
              solution: '检查API服务器状态和软件ID配置'
            });
          }
          
          if (!data.data?.version?.currentVersion) {
            this.issues.push({
              category: 'critical',
              component: 'API Response',
              issue: 'API响应缺少必要的版本信息字段',
              impact: '无法进行版本比较',
              solution: '联系API服务提供商检查响应格式'
            });
          }
          
        } catch (parseError) {
          this.issues.push({
            category: 'critical',
            component: 'API Response',
            issue: 'API响应JSON解析失败',
            impact: '无法处理版本信息',
            solution: '检查API响应格式和内容类型'
          });
        }
      }
      
    } catch (error) {
      this.issues.push({
        category: 'critical',
        component: 'API Endpoint',
        issue: `API端点测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        impact: '版本检测功能完全无法工作',
        solution: '检查网络连接和API服务器状态'
      });
    }
  }

  /**
   * 测试版本获取
   */
  private async testVersionRetrieval() {
    console.log('📋 测试版本获取...');
    
    const versionSources = [
      {
        name: 'Tauri API',
        getter: async () => await getVersion()
      },
      {
        name: 'Tauri Command',
        getter: async () => await invoke<string>('get_app_version')
      },
      {
        name: 'Environment Variable',
        getter: async () => import.meta.env.VITE_APP_VERSION
      }
    ];
    
    const versions: Record<string, string> = {};
    
    for (const source of versionSources) {
      try {
        const version = await source.getter();
        versions[source.name] = version;
        
        if (!version || version === 'undefined') {
          this.issues.push({
            category: 'warning',
            component: 'Version Retrieval',
            issue: `${source.name} 返回无效版本号`,
            impact: '版本比较可能不准确',
            solution: `检查 ${source.name} 的配置和实现`
          });
        }
      } catch (error) {
        this.issues.push({
          category: 'warning',
          component: 'Version Retrieval',
          issue: `${source.name} 获取版本失败`,
          impact: '可能影响版本检测的可靠性',
          solution: `检查 ${source.name} 的可用性和权限`
        });
      }
    }
    
    // 检查版本一致性
    const uniqueVersions = new Set(Object.values(versions).filter(v => v && v !== 'undefined'));
    if (uniqueVersions.size > 1) {
      this.issues.push({
        category: 'warning',
        component: 'Version Consistency',
        issue: '不同来源的版本号不一致',
        impact: '可能导致版本检测结果不准确',
        solution: '统一所有版本号配置源'
      });
    }
  }

  /**
   * 测试CSP策略
   */
  private async testCSPPolicy() {
    console.log('🛡️ 测试CSP策略...');
    
    // 检查是否能够进行外部请求
    try {
      await fetch('https://api-g.lacs.cc', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('CSP')) {
        this.issues.push({
          category: 'critical',
          component: 'CSP Policy',
          issue: 'CSP策略阻止了对API的请求',
          impact: '版本检测API调用被阻止',
          solution: '在 tauri.conf.json 的 CSP 配置中添加 api-g.lacs.cc 域名'
        });
      }
    }
  }

  /**
   * 生成修复建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = this.issues.filter(i => i.category === 'critical');
    const warningIssues = this.issues.filter(i => i.category === 'warning');
    
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 立即修复关键问题以恢复版本检测功能');
      recommendations.push('📋 按优先级处理以下关键问题：');
      criticalIssues.forEach((issue, index) => {
        recommendations.push(`   ${index + 1}. ${issue.component}: ${issue.solution}`);
      });
    }
    
    if (warningIssues.length > 0) {
      recommendations.push('⚠️ 建议修复以下警告问题以提高稳定性：');
      warningIssues.forEach((issue, index) => {
        recommendations.push(`   ${index + 1}. ${issue.component}: ${issue.solution}`);
      });
    }
    
    // 环境特定建议
    if (import.meta.env.MODE === 'production') {
      recommendations.push('🏭 生产环境特别建议：');
      recommendations.push('   • 确保所有环境变量在 .env.production 中正确配置');
      recommendations.push('   • 验证签名密钥和安全配置');
      recommendations.push('   • 检查网络防火墙和代理设置');
    } else {
      recommendations.push('🔧 开发环境建议：');
      recommendations.push('   • 使用 npm run diagnose-version 定期检查版本检测状态');
      recommendations.push('   • 确保开发环境网络可以访问 api-g.lacs.cc');
    }
    
    return recommendations;
  }

  /**
   * 生成诊断摘要
   */
  private generateSummary() {
    const criticalIssues = this.issues.filter(i => i.category === 'critical').length;
    const warningIssues = this.issues.filter(i => i.category === 'warning').length;
    const totalTests = this.networkTests.length + this.permissionTests.length + this.configTests.length;
    const passedTests = 
      this.networkTests.filter(t => t.success).length +
      this.permissionTests.filter(t => t.granted).length +
      this.configTests.filter(t => t.isValid).length;
    
    return {
      criticalIssues,
      warningIssues,
      totalTests,
      passedTests
    };
  }

  /**
   * 导出诊断报告
   */
  exportDiagnosticReport(diagnostic: VersionDetectionDiagnostic): string {
    const report = {
      timestamp: new Date().toISOString(),
      environment: diagnostic.environment,
      summary: diagnostic.summary,
      issues: diagnostic.issues,
      networkTests: diagnostic.networkTests,
      permissionTests: diagnostic.permissionTests,
      configurationTests: diagnostic.configurationTests,
      recommendations: diagnostic.recommendations
    };
    
    return JSON.stringify(report, null, 2);
  }
}

export const versionDetectionDiagnostic = new VersionDetectionDiagnosticService();

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).versionDetectionDiagnostic = versionDetectionDiagnostic;
}