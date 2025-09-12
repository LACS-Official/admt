/**
 * 版本检测诊断工具
 * 用于快速识别和解决开发板与发布版版本检测不一致问题
 */

import { invoke } from '@tauri-apps/api/core';
import { API_CONFIG, getApiBaseUrl, getSoftwareId } from '../config/api';
import { unifiedVersionService } from '../services/unifiedVersionService';

export interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  details?: any;
  solution?: string;
}

export interface VersionDiagnosticReport {
  timestamp: string;
  environment: string;
  overallStatus: 'healthy' | 'issues' | 'critical';
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    errors: number;
  };
  results: DiagnosticResult[];
  recommendations: string[];
}

class VersionDiagnostic {
  private static instance: VersionDiagnostic;
  
  static getInstance(): VersionDiagnostic {
    if (!VersionDiagnostic.instance) {
      VersionDiagnostic.instance = new VersionDiagnostic();
    }
    return VersionDiagnostic.instance;
  }

  /**
   * 执行完整的版本检测诊断
   */
  async runFullDiagnostic(): Promise<VersionDiagnosticReport> {
    const results: DiagnosticResult[] = [];
    const timestamp = new Date().toISOString();
    const environment = import.meta.env.MODE;

    console.log('🔍 开始版本检测诊断...');

    // 1. 检查环境配置
    results.push(...await this.checkEnvironmentConfig());

    // 2. 检查版本源
    results.push(...await this.checkVersionSources());

    // 3. 检查API连接
    results.push(...await this.checkApiConnectivity());

    // 4. 检查版本同步状态
    results.push(...await this.checkVersionSync());

    // 5. 检查Tauri命令
    results.push(...await this.checkTauriCommands());

    // 6. 检查缓存状态
    results.push(...await this.checkCacheStatus());

    // 统计结果
    const summary = {
      totalChecks: results.length,
      passed: results.filter(r => r.status === 'success').length,
      warnings: results.filter(r => r.status === 'warning').length,
      errors: results.filter(r => r.status === 'error').length
    };

    // 确定整体状态
    let overallStatus: 'healthy' | 'issues' | 'critical' = 'healthy';
    if (summary.errors > 0) {
      overallStatus = 'critical';
    } else if (summary.warnings > 0) {
      overallStatus = 'issues';
    }

    // 生成建议
    const recommendations = this.generateRecommendations(results);

    const report: VersionDiagnosticReport = {
      timestamp,
      environment,
      overallStatus,
      summary,
      results,
      recommendations
    };

    console.log('📊 版本检测诊断完成:', report);
    return report;
  }

  /**
   * 检查环境配置
   */
  private async checkEnvironmentConfig(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 检查环境变量
    const envVars = {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_SOFTWARE_ID: import.meta.env.VITE_SOFTWARE_ID,
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
      VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
      VITE_ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS
    };

    // 检查必需的环境变量
    if (!envVars.VITE_API_BASE_URL || envVars.VITE_API_BASE_URL.includes('example.com')) {
      results.push({
        status: 'error',
        category: '环境配置',
        title: 'API基础URL配置错误',
        message: `VITE_API_BASE_URL未正确配置: ${envVars.VITE_API_BASE_URL}`,
        details: envVars,
        solution: '请在.env文件中设置正确的VITE_API_BASE_URL'
      });
    } else {
      results.push({
        status: 'success',
        category: '环境配置',
        title: 'API基础URL配置正确',
        message: `API地址: ${envVars.VITE_API_BASE_URL}`
      });
    }

    // 检查软件ID
    const softwareId = parseInt(envVars.VITE_SOFTWARE_ID || '0');
    if (softwareId <= 0) {
      results.push({
        status: 'error',
        category: '环境配置',
        title: '软件ID配置错误',
        message: `VITE_SOFTWARE_ID未正确配置: ${envVars.VITE_SOFTWARE_ID}`,
        solution: '请在.env文件中设置正确的VITE_SOFTWARE_ID'
      });
    } else {
      results.push({
        status: 'success',
        category: '环境配置',
        title: '软件ID配置正确',
        message: `软件ID: ${softwareId}`
      });
    }

    // 检查版本号
    if (!envVars.VITE_APP_VERSION || envVars.VITE_APP_VERSION === 'undefined') {
      results.push({
        status: 'warning',
        category: '环境配置',
        title: '应用版本号未配置',
        message: 'VITE_APP_VERSION未设置，将使用默认版本',
        solution: '建议在.env文件中设置VITE_APP_VERSION'
      });
    } else {
      results.push({
        status: 'success',
        category: '环境配置',
        title: '应用版本号配置正确',
        message: `版本号: ${envVars.VITE_APP_VERSION}`
      });
    }

    // 检查调试配置
    const isDev = import.meta.env.DEV;
    const debugEnabled = envVars.VITE_ENABLE_DEBUG === 'true';
    const logsEnabled = envVars.VITE_ENABLE_CONSOLE_LOGS === 'true';

    results.push({
      status: 'success',
      category: '环境配置',
      title: '调试配置状态',
      message: `开发模式: ${isDev}, 调试: ${debugEnabled}, 日志: ${logsEnabled}`,
      details: { isDev, debugEnabled, logsEnabled }
    });

    return results;
  }

  /**
   * 检查版本源
   */
  private async checkVersionSources(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const sources: { [key: string]: string | null } = {};

    // 检查Tauri版本
    try {
      const tauriVersion = await invoke<string>('get_app_version');
      sources.tauri = tauriVersion;
      results.push({
        status: 'success',
        category: '版本源',
        title: 'Tauri版本获取成功',
        message: `Tauri版本: ${tauriVersion}`
      });
    } catch (error) {
      sources.tauri = null;
      results.push({
        status: 'error',
        category: '版本源',
        title: 'Tauri版本获取失败',
        message: `错误: ${error instanceof Error ? error.message : error}`,
        solution: '检查Tauri后端是否正确注册了get_app_version命令'
      });
    }

    // 检查环境变量版本
    const envVersion = import.meta.env.VITE_APP_VERSION;
    if (envVersion && envVersion !== 'undefined') {
      sources.env = envVersion;
      results.push({
        status: 'success',
        category: '版本源',
        title: '环境变量版本可用',
        message: `环境变量版本: ${envVersion}`
      });
    } else {
      sources.env = null;
      results.push({
        status: 'warning',
        category: '版本源',
        title: '环境变量版本不可用',
        message: 'VITE_APP_VERSION未设置或为空',
        solution: '在.env文件中设置VITE_APP_VERSION'
      });
    }

    // 检查配置版本
    const configVersion = API_CONFIG.APP_VERSION;
    sources.config = configVersion;
    results.push({
      status: 'success',
      category: '版本源',
      title: '配置版本可用',
      message: `配置版本: ${configVersion}`
    });

    // 检查版本一致性
    const validVersions = Object.values(sources).filter(v => v !== null);
    const uniqueVersions = new Set(validVersions);

    if (uniqueVersions.size > 1) {
      results.push({
        status: 'warning',
        category: '版本源',
        title: '版本不一致',
        message: `发现${uniqueVersions.size}个不同版本: ${Array.from(uniqueVersions).join(', ')}`,
        details: sources,
        solution: '统一所有版本源的版本号'
      });
    } else if (uniqueVersions.size === 1) {
      results.push({
        status: 'success',
        category: '版本源',
        title: '版本一致',
        message: `所有版本源版本一致: ${Array.from(uniqueVersions)[0]}`
      });
    }

    return results;
  }

  /**
   * 检查API连接
   */
  private async checkApiConnectivity(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const baseUrl = getApiBaseUrl();
      const softwareId = getSoftwareId();
      const apiUrl = `${baseUrl}/app/software/id/${softwareId}/versions`;

      // 测试API连接
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ADMT-Diagnostic/1.0.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        results.push({
          status: 'success',
          category: 'API连接',
          title: 'API连接正常',
          message: `成功连接到 ${apiUrl}`,
          details: {
            status: response.status,
            dataLength: data.data?.length || 0
          }
        });
      } else {
        results.push({
          status: 'error',
          category: 'API连接',
          title: 'API响应错误',
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: { url: apiUrl, status: response.status },
          solution: '检查API服务器状态和网络连接'
        });
      }
    } catch (error) {
      results.push({
        status: 'error',
        category: 'API连接',
        title: 'API连接失败',
        message: `连接错误: ${error instanceof Error ? error.message : error}`,
        solution: '检查网络连接和API配置'
      });
    }

    return results;
  }

  /**
   * 检查版本同步状态
   */
  private async checkVersionSync(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const syncStatus = await unifiedVersionService.checkVersionSync();
      
      if (syncStatus.isSync) {
        results.push({
          status: 'success',
          category: '版本同步',
          title: '版本同步正常',
          message: '所有版本源同步一致',
          details: syncStatus.sources
        });
      } else {
        results.push({
          status: 'warning',
          category: '版本同步',
          title: '版本同步问题',
          message: `发现${syncStatus.issues.length}个同步问题`,
          details: {
            issues: syncStatus.issues,
            sources: syncStatus.sources
          },
          solution: '统一所有版本源的版本号配置'
        });
      }
    } catch (error) {
      results.push({
        status: 'error',
        category: '版本同步',
        title: '版本同步检查失败',
        message: `检查错误: ${error instanceof Error ? error.message : error}`,
        solution: '检查统一版本服务配置'
      });
    }

    return results;
  }

  /**
   * 检查Tauri命令
   */
  private async checkTauriCommands(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 测试get_app_version命令
    try {
      const version = await invoke<string>('get_app_version');
      results.push({
        status: 'success',
        category: 'Tauri命令',
        title: 'get_app_version命令正常',
        message: `返回版本: ${version}`
      });
    } catch (error) {
      results.push({
        status: 'error',
        category: 'Tauri命令',
        title: 'get_app_version命令失败',
        message: `调用错误: ${error instanceof Error ? error.message : error}`,
        solution: '检查Tauri后端命令注册和编译状态'
      });
    }

    // 测试get_app_info命令
    try {
      const info = await invoke('get_app_info');
      results.push({
        status: 'success',
        category: 'Tauri命令',
        title: 'get_app_info命令正常',
        message: '应用信息获取成功',
        details: info
      });
    } catch (error) {
      results.push({
        status: 'warning',
        category: 'Tauri命令',
        title: 'get_app_info命令失败',
        message: `调用错误: ${error instanceof Error ? error.message : error}`,
        solution: '检查Tauri后端get_app_info命令实现'
      });
    }

    return results;
  }

  /**
   * 检查缓存状态
   */
  private async checkCacheStatus(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    try {
      const status = unifiedVersionService.getStatus();
      
      results.push({
        status: 'success',
        category: '缓存状态',
        title: '版本服务状态正常',
        message: `缓存大小: ${status.cacheSize}`,
        details: status
      });

      // 检查缓存是否过多
      if (status.cacheSize > 50) {
        results.push({
          status: 'warning',
          category: '缓存状态',
          title: '缓存过多',
          message: `缓存条目: ${status.cacheSize}`,
          solution: '考虑清理版本检查缓存'
        });
      }
    } catch (error) {
      results.push({
        status: 'error',
        category: '缓存状态',
        title: '缓存状态检查失败',
        message: `检查错误: ${error instanceof Error ? error.message : error}`
      });
    }

    return results;
  }

  /**
   * 生成修复建议
   */
  private generateRecommendations(results: DiagnosticResult[]): string[] {
    const recommendations: string[] = [];
    const errors = results.filter(r => r.status === 'error');
    const warnings = results.filter(r => r.status === 'warning');

    if (errors.length === 0 && warnings.length === 0) {
      recommendations.push('✅ 版本检测系统运行正常，无需额外操作');
      return recommendations;
    }

    // 针对错误的建议
    if (errors.some(e => e.category === '环境配置')) {
      recommendations.push('🔧 检查并修复.env和.env.production文件中的环境变量配置');
    }

    if (errors.some(e => e.category === 'Tauri命令')) {
      recommendations.push('🔨 重新编译Tauri应用，确保后端命令正确注册');
    }

    if (errors.some(e => e.category === 'API连接')) {
      recommendations.push('🌐 检查网络连接和API服务器状态');
    }

    // 针对警告的建议
    if (warnings.some(w => w.category === '版本同步' || w.category === '版本源')) {
      recommendations.push('📝 统一所有版本源的版本号配置，确保一致性');
    }

    if (warnings.some(w => w.category === '缓存状态')) {
      recommendations.push('🗑️ 清理版本检查缓存，避免使用过期数据');
    }

    // 通用建议
    if (import.meta.env.DEV) {
      recommendations.push('🔍 在开发环境中启用详细日志，便于问题排查');
    } else {
      recommendations.push('📊 在生产环境中定期运行版本检测诊断');
    }

    return recommendations;
  }

  /**
   * 导出诊断报告
   */
  exportReport(report: VersionDiagnosticReport): string {
    const lines: string[] = [];
    
    lines.push('# 版本检测诊断报告');
    lines.push(`生成时间: ${report.timestamp}`);
    lines.push(`环境: ${report.environment}`);
    lines.push(`整体状态: ${report.overallStatus}`);
    lines.push('');
    
    lines.push('## 检查摘要');
    lines.push(`- 总检查项: ${report.summary.totalChecks}`);
    lines.push(`- 通过: ${report.summary.passed}`);
    lines.push(`- 警告: ${report.summary.warnings}`);
    lines.push(`- 错误: ${report.summary.errors}`);
    lines.push('');
    
    lines.push('## 详细结果');
    for (const result of report.results) {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      lines.push(`${statusIcon} **${result.category}** - ${result.title}`);
      lines.push(`   ${result.message}`);
      if (result.solution) {
        lines.push(`   💡 解决方案: ${result.solution}`);
      }
      lines.push('');
    }
    
    lines.push('## 修复建议');
    for (const recommendation of report.recommendations) {
      lines.push(`- ${recommendation}`);
    }
    
    return lines.join('\n');
  }
}

export const versionDiagnostic = VersionDiagnostic.getInstance();

// 开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).versionDiagnostic = versionDiagnostic;
}