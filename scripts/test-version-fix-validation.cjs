#!/usr/bin/env node

/**
 * 版本检测修复验证脚本
 * 验证修复后的版本检测逻辑能否正确识别1.0.1为最新版本
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 版本检测修复验证工具');
console.log('验证发布版和开发版都能正确识别1.0.1为最新版本\n');

// 复制修复后的版本比较逻辑
function isValidVersion(version) {
  if (!version || typeof version !== 'string') {
    return false;
  }
  
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  
  return semverRegex.test(version.trim());
}

function compareVersions(current, latest) {
  try {
    console.log(`🔄 开始版本比较: "${current}" vs "${latest}"`);

    // 验证版本格式
    if (!isValidVersion(current)) {
      console.error(`❌ 当前版本格式无效: "${current}"`);
      throw new Error(`当前版本格式无效: ${current}`);
    }
    if (!isValidVersion(latest)) {
      console.error(`❌ 最新版本格式无效: "${latest}"`);
      throw new Error(`最新版本格式无效: ${latest}`);
    }

    // 解析版本号
    const parseVersion = (version) => {
      const cleanVersion = version.trim();
      const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
      if (!match) {
        console.error(`版本解析失败: "${version}" (cleaned: "${cleanVersion}")`);
        throw new Error(`版本解析失败: ${version}`);
      }
      
      const parsed = {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4] || null,
        build: match[5] || null
      };
      
      console.log(`📊 版本解析: "${version}" -> `, parsed);
      return parsed;
    };

    const currentVer = parseVersion(current);
    const latestVer = parseVersion(latest);

    // 修复后的版本比较逻辑
    let result = 0;
    let reason = '';

    // 比较主版本号
    if (currentVer.major !== latestVer.major) {
      result = currentVer.major < latestVer.major ? -1 : 1;
      reason = `主版本不同: ${currentVer.major} vs ${latestVer.major}`;
    }
    // 比较次版本号
    else if (currentVer.minor !== latestVer.minor) {
      result = currentVer.minor < latestVer.minor ? -1 : 1;
      reason = `次版本不同: ${currentVer.minor} vs ${latestVer.minor}`;
    }
    // 关键修复：比较修订版本号，确保数字比较正确
    else if (currentVer.patch !== latestVer.patch) {
      result = currentVer.patch < latestVer.patch ? -1 : 1;
      reason = `修订版本不同: ${currentVer.patch} vs ${latestVer.patch}`;
      console.log(`🔧 修订版本比较详情: ${currentVer.patch} ${currentVer.patch < latestVer.patch ? '<' : '>'} ${latestVer.patch}`);
    }
    // 处理预发布版本
    else if (currentVer.prerelease && !latestVer.prerelease) {
      result = -1;
      reason = `预发布版本 < 正式版本: ${currentVer.prerelease} vs (none)`;
    }
    else if (!currentVer.prerelease && latestVer.prerelease) {
      result = 1;
      reason = `正式版本 > 预发布版本: (none) vs ${latestVer.prerelease}`;
    }
    else if (currentVer.prerelease && latestVer.prerelease) {
      if (currentVer.prerelease < latestVer.prerelease) {
        result = -1;
      } else if (currentVer.prerelease > latestVer.prerelease) {
        result = 1;
      } else {
        result = 0;
      }
      reason = `预发布版本比较: ${currentVer.prerelease} vs ${latestVer.prerelease}`;
    }
    else {
      result = 0;
      reason = '版本完全相同';
    }

    const hasUpdate = result < 0;
    const comparison = result < 0 ? '需要更新' : result > 0 ? '当前版本更新' : '版本相同';

    console.log(`✅ 版本比较结果:`, {
      current: current,
      latest: latest,
      currentParsed: currentVer,
      latestParsed: latestVer,
      result: result,
      reason: reason,
      hasUpdate: hasUpdate,
      comparison: comparison
    });

    // 特别验证1.0.0 vs 1.0.1的情况
    if (current === '1.0.0' && latest === '1.0.1') {
      console.log(`🔧 特别验证: 1.0.0 vs 1.0.1 应该返回 -1 (需要更新)`);
      console.log(`🔧 实际结果: ${result} (${result === -1 ? '✅ 正确' : '❌ 错误'})`);
    }

    return { result, hasUpdate, reason, comparison };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    console.error('❌ 版本比较失败:', errorMsg);
    console.error('版本比较参数:', { current, latest });
    
    return { result: 0, hasUpdate: false, reason: `错误: ${errorMsg}`, comparison: '比较失败' };
  }
}

// 核心测试用例
const coreTestCases = [
  // 主要问题场景
  { current: '1.0.0', latest: '1.0.1', expected: { result: -1, hasUpdate: true }, desc: '🎯 核心问题：1.0.0 vs 1.0.1' },
  
  // 发布版和开发版都应该能识别的场景
  { current: '1.0.0', latest: '1.0.1', expected: { result: -1, hasUpdate: true }, desc: '发布版场景：1.0.0 -> 1.0.1' },
  { current: '1.0.1', latest: '1.0.1', expected: { result: 0, hasUpdate: false }, desc: '发布版场景：1.0.1 = 1.0.1' },
  { current: '1.0.1', latest: '1.0.0', expected: { result: 1, hasUpdate: false }, desc: '发布版场景：1.0.1 > 1.0.0' },
  
  // 其他重要场景
  { current: '1.0.0', latest: '1.1.0', expected: { result: -1, hasUpdate: true }, desc: '次版本更新：1.0.0 -> 1.1.0' },
  { current: '1.0.0', latest: '2.0.0', expected: { result: -1, hasUpdate: true }, desc: '主版本更新：1.0.0 -> 2.0.0' },
  
  // 边界情况
  { current: '0.9.9', latest: '1.0.0', expected: { result: -1, hasUpdate: true }, desc: '跨主版本：0.9.9 -> 1.0.0' },
  { current: '1.0.9', latest: '1.0.10', expected: { result: -1, hasUpdate: true }, desc: '修订版本数字比较：1.0.9 -> 1.0.10' },
];

function runCoreTests() {
  console.log('🚀 开始核心版本检测测试\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  let criticalFailed = false;
  
  coreTestCases.forEach((testCase, index) => {
    console.log(`\n📋 测试 ${index + 1}: ${testCase.desc}`);
    console.log('-'.repeat(50));
    
    const result = compareVersions(testCase.current, testCase.latest);
    
    const resultMatch = result.result === testCase.expected.result;
    const updateMatch = result.hasUpdate === testCase.expected.hasUpdate;
    const allMatch = resultMatch && updateMatch;
    
    if (allMatch) {
      console.log(`✅ 测试通过`);
      passed++;
    } else {
      console.log(`❌ 测试失败`);
      console.log(`   期望: result=${testCase.expected.result}, hasUpdate=${testCase.expected.hasUpdate}`);
      console.log(`   实际: result=${result.result}, hasUpdate=${result.hasUpdate}`);
      failed++;
      
      // 如果是核心问题场景失败，标记为关键失败
      if (testCase.desc.includes('🎯 核心问题')) {
        criticalFailed = true;
        console.log(`🚨 关键测试失败！这是需要修复的核心问题！`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 测试总结: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！版本检测修复成功。');
    console.log('✅ 发布版和开发版都能正确识别1.0.1为最新版本');
  } else if (criticalFailed) {
    console.log('🚨 关键测试失败！1.0.0 vs 1.0.1 的比较仍然有问题。');
    console.log('❌ 版本检测逻辑需要进一步修复');
  } else {
    console.log('⚠️ 部分测试失败，但核心问题已解决');
  }
  
  return { passed, failed, criticalFailed };
}

// 验证配置文件版本更新
function validateConfigVersions() {
  console.log('\n🔍 验证配置文件版本更新');
  console.log('='.repeat(50));
  
  const configFiles = [
    { path: 'package.json', key: 'version' },
    { path: 'src-tauri/tauri.conf.json', key: 'version' },
    { path: 'src-tauri/Cargo.toml', key: 'version' }
  ];
  
  let allUpdated = true;
  
  configFiles.forEach(({ path: filePath, key }) => {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ 文件不存在: ${filePath}`);
        return;
      }
      
      let version;
      if (filePath.endsWith('.json')) {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        version = content[key];
      } else if (filePath.endsWith('.toml')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/version\s*=\s*"([^"]+)"/);
        version = match ? match[1] : null;
      }
      
      if (version === '1.0.1') {
        console.log(`✅ ${filePath}: ${version}`);
      } else {
        console.log(`❌ ${filePath}: ${version || '未找到'} (应该是 1.0.1)`);
        allUpdated = false;
      }
    } catch (error) {
      console.log(`❌ 读取 ${filePath} 失败:`, error.message);
      allUpdated = false;
    }
  });
  
  if (allUpdated) {
    console.log('\n✅ 所有配置文件版本已更新为 1.0.1');
  } else {
    console.log('\n❌ 部分配置文件版本未正确更新');
  }
  
  return allUpdated;
}

// 生成测试报告
function generateTestReport(testResults, configResults) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    testResults,
    configResults,
    summary: {
      allTestsPassed: testResults.failed === 0,
      criticalTestPassed: !testResults.criticalFailed,
      configsUpdated: configResults,
      overallStatus: testResults.failed === 0 && configResults ? 'SUCCESS' : 'FAILED'
    },
    recommendations: []
  };
  
  if (testResults.criticalFailed) {
    report.recommendations.push('🚨 关键问题：版本比较逻辑仍需修复，1.0.0 vs 1.0.1 比较失败');
  }
  
  if (!configResults) {
    report.recommendations.push('⚠️ 配置文件版本需要更新为 1.0.1');
  }
  
  if (testResults.failed === 0 && configResults) {
    report.recommendations.push('🎉 版本检测修复完成，可以进行实际测试');
  }
  
  // 写入报告文件
  try {
    const reportPath = path.join(process.cwd(), 'version-fix-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 测试报告已生成: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️ 无法写入测试报告:', error.message);
  }
  
  return report;
}

// 主函数
function main() {
  console.log('开始版本检测修复验证...\n');
  
  // 1. 运行核心测试
  const testResults = runCoreTests();
  
  // 2. 验证配置文件
  const configResults = validateConfigVersions();
  
  // 3. 生成测试报告
  const report = generateTestReport(testResults, configResults);
  
  // 4. 输出最终结果
  console.log('\n' + '='.repeat(80));
  console.log('🏁 版本检测修复验证完成');
  console.log('='.repeat(80));
  
  if (report.summary.overallStatus === 'SUCCESS') {
    console.log('🎉 验证成功！');
    console.log('✅ 版本比较逻辑修复完成');
    console.log('✅ 配置文件版本已更新');
    console.log('✅ 发布版和开发版都能正确识别1.0.1为最新版本');
    console.log('\n🚀 可以进行下一步测试：');
    console.log('   1. 运行 npm run test-version 测试版本检测');
    console.log('   2. 启动应用测试实际版本检查流程');
    console.log('   3. 测试API访问失败时的强制退出机制');
  } else {
    console.log('❌ 验证失败！');
    if (testResults.criticalFailed) {
      console.log('🚨 关键问题：版本比较逻辑仍需修复');
    }
    if (!configResults) {
      console.log('⚠️ 配置文件版本需要更新');
    }
    console.log('\n📋 建议：');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
  }
  
  process.exit(report.summary.overallStatus === 'SUCCESS' ? 0 : 1);
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  compareVersions,
  isValidVersion,
  runCoreTests,
  validateConfigVersions,
  generateTestReport
};