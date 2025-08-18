/**
 * 诊断服务
 * 提供系统诊断和问题排查功能
 */

import { invoke } from '@tauri-apps/api/core';

export interface DiagnosticResult {
  current_working_directory: string;
  executable_directory: string;
  path_environment: string;
  cached_adb_path: string;
  adb_exists: boolean;
  cached_fastboot_path: string;
  fastboot_exists: boolean;
  resource_directories: Array<{
    path: string;
    exists: boolean;
    type: string;
  }>;
  adb_command_test: {
    success: boolean;
    result: any;
  };
  fastboot_command_test: {
    success: boolean;
    result: any;
  };
}

export class DiagnosticService {
  /**
   * 诊断 ADB 和 Fastboot 路径配置
   */
  async diagnoseAdbFastbootPaths(): Promise<DiagnosticResult> {
    try {
      const result = await invoke<DiagnosticResult>('diagnose_adb_fastboot_paths');
      console.log('ADB/Fastboot 诊断结果:', result);
      return result;
    } catch (error) {
      console.error('ADB/Fastboot 诊断失败:', error);
      throw new Error(`诊断失败: ${error}`);
    }
  }

  /**
   * 检查 ADB 可用性
   */
  async checkAdbAvailability(): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string; error?: string }>('check_adb_availability');
      return result;
    } catch (error) {
      console.error('ADB 可用性检查失败:', error);
      throw new Error(`ADB 检查失败: ${error}`);
    }
  }

  /**
   * 检查 Fastboot 可用性
   */
  async checkFastbootAvailability(): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const result = await invoke<{ success: boolean; output: string; error?: string }>('check_fastboot_availability');
      return result;
    } catch (error) {
      console.error('Fastboot 可用性检查失败:', error);
      throw new Error(`Fastboot 检查失败: ${error}`);
    }
  }

  /**
   * 生成诊断报告
   */
  async generateDiagnosticReport(): Promise<string> {
    try {
      const adbFastbootDiag = await this.diagnoseAdbFastbootPaths();
      const adbAvailability = await this.checkAdbAvailability();
      const fastbootAvailability = await this.checkFastbootAvailability();

      const report = `
# ADB/Fastboot 诊断报告
生成时间: ${new Date().toLocaleString()}

## 环境信息
- 当前工作目录: ${adbFastbootDiag.current_working_directory}
- 可执行文件目录: ${adbFastbootDiag.executable_directory}
- PATH 环境变量: ${adbFastbootDiag.path_environment.substring(0, 200)}...

## ADB 状态
- 缓存路径: ${adbFastbootDiag.cached_adb_path}
- 文件存在: ${adbFastbootDiag.adb_exists ? '是' : '否'}
- 命令测试: ${adbFastbootDiag.adb_command_test.success ? '成功' : '失败'}
- 可用性检查: ${adbAvailability.success ? '可用' : '不可用'}

## Fastboot 状态
- 缓存路径: ${adbFastbootDiag.cached_fastboot_path}
- 文件存在: ${adbFastbootDiag.fastboot_exists ? '是' : '否'}
- 命令测试: ${adbFastbootDiag.fastboot_command_test.success ? '成功' : '失败'}
- 可用性检查: ${fastbootAvailability.success ? '可用' : '不可用'}

## 资源目录
${adbFastbootDiag.resource_directories.map(dir => 
  `- ${dir.type}: ${dir.path} (存在: ${dir.exists ? '是' : '否'})`
).join('\n')}

## 建议
${this.generateRecommendations(adbFastbootDiag)}
      `;

      return report.trim();
    } catch (error) {
      console.error('生成诊断报告失败:', error);
      throw new Error(`生成报告失败: ${error}`);
    }
  }

  /**
   * 生成修复建议
   */
  private generateRecommendations(diagnostic: DiagnosticResult): string {
    const recommendations: string[] = [];

    if (!diagnostic.adb_exists) {
      recommendations.push('❌ ADB 文件不存在，请确保 adb.exe 位于 src-tauri/resources/ 目录或系统 PATH 中');
    }

    if (!diagnostic.fastboot_exists) {
      recommendations.push('❌ Fastboot 文件不存在，请确保 fastboot.exe 位于 src-tauri/resources/ 目录或系统 PATH 中');
    }

    if (!diagnostic.adb_command_test.success) {
      recommendations.push('❌ ADB 命令测试失败，请检查文件权限和路径配置');
    }

    if (!diagnostic.fastboot_command_test.success) {
      recommendations.push('❌ Fastboot 命令测试失败，请检查文件权限和路径配置');
    }

    const hasValidResourceDir = diagnostic.resource_directories.some(dir => dir.exists);
    if (!hasValidResourceDir) {
      recommendations.push('❌ 未找到有效的资源目录，请确保项目结构正确');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 所有检查都通过，ADB 和 Fastboot 配置正常');
    }

    return recommendations.join('\n');
  }

  /**
   * 导出诊断报告到文件
   */
  async exportDiagnosticReport(): Promise<void> {
    try {
      const report = await this.generateDiagnosticReport();
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `adb-fastboot-diagnostic-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('诊断报告已导出');
    } catch (error) {
      console.error('导出诊断报告失败:', error);
      throw new Error(`导出失败: ${error}`);
    }
  }
}

// 导出单例实例
export const diagnosticService = new DiagnosticService();
