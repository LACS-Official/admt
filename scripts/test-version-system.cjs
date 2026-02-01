#!/usr/bin/env node

/**
 * 版本系统测试脚本
 * 全面测试版本管理系统的各个组件
 */

const VersionManager = require('./version-manager.cjs');
const EnvironmentValidator = require('./validate-env.cjs');
const ToolsValidator = require('./verify-tools.cjs');

class VersionSystemTester {
  constructor() {
    this.manager = new VersionManager();
    this.results = [];
  }

  // 记录测试结果
  recordResult(category, test, status, message) {
    this.results.push({ category, test, status, message });
    const icon = status === 'pass' ? '✅' : '❌';
    console.log(`${icon} [${category}] ${test}: ${message}`);
  }

  // 测试配置文件
  async testConfiguration() {
    console.log('\n📁 测试配置文件...');

    try {
      const config = this.manager.readConfig();
      
      // 检查必需字段
      const requiredFields = ['version', 'buildNumber', 'versionName', 'releaseDate'];
      for (const field of requiredFields) {
        if (!config[field]) {
          throw new Error(`缺少必需字段: ${field}`);
        }
      }

      this.recordResult('配置', '必需字段检查', 'pass', '所有必需字段存在');
    } catch (error) {
      this.recordResult('配置', '必需字段检查', 'fail', error.message);
    }

    // 测试写入权限
    try {
      const originalConfig = this.manager.readConfig();
      this.manager.writeConfig(originalConfig);
      this.recordResult('配置', '文件写入权限', 'pass', '具有文件写入权限');
    } catch (error) {
      this.recordResult('配置', '文件写入权限', 'fail', error.message);
    }
  }

  // 测试版本同步
  async testVersionSync() {
    console.log('\n🔄 测试版本同步...');

    try {
      // 备份当前版本
      const originalConfig = this.manager.readConfig();
      const testVersion = '1.2.0-test.' + Date.now();

      // 执行同步
      this.manager.syncVersions(testVersion);

      // 验证同步结果
      const isConsistent = this.manager.validateVersions();
      if (isConsistent) {
        this.recordResult('同步', '版本一致性', 'pass', '版本同步成功且一致');

        // 恢复原版本
        this.manager.syncVersions(originalConfig.version);
      } else {
        this.recordResult('同步', '版本一致性', 'fail', '版本同步后不一致');
      }
    } catch (error) {
      this.recordResult('同步', '版本一致性', 'fail', error.message);
    }
  }

  // 测试环境依赖
  async testEnvironmentDependencies() {
    console.log('\n🔧 测试环境依赖...');

    try {
      const validator = new EnvironmentValidator();
      
      // 模拟验证过程但不实际退出
      const originalExit = process.exit;
      process.exit = () => {};
      
      await validator.validate();
      
      // 恢复exit函数
      process.exit = originalExit;
      
      if (validator.errors.length === 0) {
        this.recordResult('环境', '依赖检查', 'pass', '环境依赖完整');
      } else {
        this.recordResult('环境', '依赖检查', 'fail', `发现${validator.errors.length}个错误`);
      }
    } catch (error) {
      this.recordResult('环境', '依赖检查', 'fail', error.message);
    }
  }

  // 测试工具可用性
  async testToolsAvailability() {
    console.log('\n🛠️ 测试工具可用性...');

    try {
      const validator = new ToolsValidator();
      
      // 检查必需工具
      const requiredTools = validator.tools.filter(tool => tool.required);
      const availableTools = requiredTools.filter(tool => {
        try {
          require('child_process').execSync(tool.command, { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      });

      if (availableTools.length === requiredTools.length) {
        this.recordResult('工具', '必需工具检查', 'pass', '所有必需工具可用');
      } else {
        this.recordResult('工具', '必需工具检查', 'fail', 
          `${availableTools.length}/${requiredTools.length}个工具可用`);
      }
    } catch (error) {
      this.recordResult('工具', '必需工具检查', 'fail', error.message);
    }
  }

  // 测试版本注入
  async testVersionInjection() {
    console.log('\n💉 测试版本注入...');

    try {
      const VersionInjector = require('./inject-version.cjs');
      const injector = new VersionInjector();
      
      injector.injectVersion();
      
      // 检查生成的版本文件
      const fs = require('fs');
      const path = require('path');
      const versionFile = path.join(__dirname, '..', 'src', 'generated', 'version.ts');
      
      if (fs.existsSync(versionFile)) {
        const content = fs.readFileSync(versionFile, 'utf8');
        if (content.includes('VERSION_INFO')) {
          this.recordResult('注入', '版本常量生成', 'pass', '版本常量文件生成成功');
        } else {
          this.recordResult('注入', '版本常量生成', 'fail', '版本常量文件格式异常');
        }
      } else {
        this.recordResult('注入', '版本常量生成', 'fail', '版本常量文件未生成');
      }
    } catch (error) {
      this.recordResult('注入', '版本常量生成', 'fail', error.message);
    }
  }

  // 运行完整测试套件
  async runFullTestSuite() {
    console.log('🧪 开始版本系统全面测试...\n');

    await this.testConfiguration();
    await this.testVersionSync();
    await this.testEnvironmentDependencies();
    await this.testToolsAvailability();
    await this.testVersionInjection();

    // 统计结果
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;
    const totalCount = this.results.length;

    console.log('\n📊 测试总结:');
    console.log(`✅ 通过: ${passCount}`);
    console.log(`❌ 失败: ${failCount}`);
    console.log(`📈 成功率: ${((passCount / totalCount) * 100).toFixed(1)}%`);

    if (failCount === 0) {
      console.log('\n🎉 版本系统测试全部通过!');
      return true;
    } else {
      console.log('\n⚠️ 部分测试失败，请查看详细日志');
      return false;
    }
  }
}

// 运行
if (require.main === module) {
  const tester = new VersionSystemTester();
  tester.runFullTestSuite().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = VersionSystemTester;