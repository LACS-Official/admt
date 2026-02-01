#!/usr/bin/env node

/**
 * 版本检测测试脚本
 * 测试版本检测功能是否正常工作
 */

const VersionManager = require('./version-manager.cjs');

class VersionDetectionTester {
  constructor() {
    this.manager = new VersionManager();
    this.tests = [];
  }

  // 添加测试
  addTest(name, testFunc) {
    this.tests.push({ name, testFunc });
  }

  // 运行单个测试
  async runTest(test) {
    try {
      console.log(`\n🧪 运行测试: ${test.name}`);
      await test.testFunc();
      console.log(`✅ 测试通过: ${test.name}`);
      return true;
    } catch (error) {
      console.log(`❌ 测试失败: ${test.name}`);
      console.log(`   错误: ${error.message}`);
      return false;
    }
  }

  // 测试版本读取
  testVersionReading() {
    const config = this.manager.readConfig();
    if (!config.version) {
      throw new Error('版本配置中缺少version字段');
    }
    if (!config.buildNumber) {
      throw new Error('版本配置中缺少buildNumber字段');
    }
  }

  // 测试版本格式验证
  testVersionFormat() {
    const config = this.manager.readConfig();
    const semver = require('semver');
    
    if (!semver.valid(config.version)) {
      throw new Error(`无效的版本格式: ${config.version}`);
    }
  }

  // 测试版本一致性检查
  testVersionConsistency() {
    const isConsistent = this.manager.validateVersions();
    if (!isConsistent) {
      throw new Error('版本不一致检测失败');
    }
  }

  // 测试版本注入
  testVersionInjection() {
    const VersionInjector = require('./inject-version.cjs');
    const injector = new VersionInjector();
    
    // 这应该不会抛出异常
    injector.injectVersion();
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始版本检测系统测试...\n');

    // 添加测试
    this.addTest('版本读取功能', () => this.testVersionReading());
    this.addTest('版本格式验证', () => this.testVersionFormat());
    this.addTest('版本一致性检查', () => this.testVersionConsistency());
    this.addTest('版本注入功能', () => this.testVersionInjection());

    // 运行测试
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      const result = await this.runTest(test);
      if (result) {
        passed++;
      } else {
        failed++;
      }
    }

    // 输出结果
    console.log('\n📊 测试结果:');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 所有测试通过! 版本检测系统工作正常');
      return true;
    } else {
      console.log('\n⚠️ 部分测试失败，请检查系统配置');
      return false;
    }
  }
}

// 运行
if (require.main === module) {
  const tester = new VersionDetectionTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = VersionDetectionTester;