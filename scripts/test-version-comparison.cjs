/**
 * 版本比较逻辑测试脚本
 * 专门测试1.0.0 vs 1.0.1的比较问题
 */

// 复制版本服务中的比较逻辑
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

    // 逐步比较并记录详细信息
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
    // 比较修订版本号
    else if (currentVer.patch !== latestVer.patch) {
      result = currentVer.patch < latestVer.patch ? -1 : 1;
      reason = `修订版本不同: ${currentVer.patch} vs ${latestVer.patch}`;
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
      result: result,
      reason: reason,
      hasUpdate: hasUpdate,
      comparison: comparison
    });

    return { result, hasUpdate, reason, comparison };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    console.error('❌ 版本比较失败:', errorMsg);
    console.error('版本比较参数:', { current, latest });
    
    return { result: 0, hasUpdate: false, reason: `错误: ${errorMsg}`, comparison: '比较失败' };
  }
}

// 测试用例
const testCases = [
  // 问题场景
  { current: '1.0.0', latest: '1.0.1', expected: { result: -1, hasUpdate: true }, desc: '问题场景：1.0.0 vs 1.0.1' },
  
  // 其他测试场景
  { current: '1.0.0', latest: '1.1.0', expected: { result: -1, hasUpdate: true }, desc: '次版本更新' },
  { current: '1.0.0', latest: '2.0.0', expected: { result: -1, hasUpdate: true }, desc: '主版本更新' },
  { current: '1.0.1', latest: '1.0.0', expected: { result: 1, hasUpdate: false }, desc: '当前版本更新' },
  { current: '1.0.0', latest: '1.0.0', expected: { result: 0, hasUpdate: false }, desc: '版本相同' },
  { current: '1.0.0-alpha.1', latest: '1.0.0', expected: { result: -1, hasUpdate: true }, desc: '预发布版本' },
  
  // 边界情况
  { current: '0.9.9', latest: '1.0.0', expected: { result: -1, hasUpdate: true }, desc: '跨主版本' },
  { current: '1.9.9', latest: '1.10.0', expected: { result: -1, hasUpdate: true }, desc: '次版本数字比较' },
  { current: '1.0.9', latest: '1.0.10', expected: { result: -1, hasUpdate: true }, desc: '修订版本数字比较' },
];

function runTests() {
  console.log('🚀 开始版本比较测试\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
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
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 测试总结: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('🎉 所有测试通过！版本比较逻辑正确。');
  } else {
    console.log('⚠️ 部分测试失败，需要检查版本比较逻辑。');
  }
  
  return failed === 0;
}

// 特别测试问题场景
function testProblemScenario() {
  console.log('\n🔍 特别测试问题场景: 1.0.0 vs 1.0.1');
  console.log('='.repeat(50));
  
  const result = compareVersions('1.0.0', '1.0.1');
  
  console.log('\n📋 详细分析:');
  console.log(`- 比较结果: ${result.result}`);
  console.log(`- 需要更新: ${result.hasUpdate}`);
  console.log(`- 原因: ${result.reason}`);
  console.log(`- 结论: ${result.comparison}`);
  
  if (result.result === -1 && result.hasUpdate === true) {
    console.log('\n✅ 问题场景测试通过！1.0.0 正确识别为需要更新到 1.0.1');
  } else {
    console.log('\n❌ 问题场景测试失败！1.0.0 未能正确识别需要更新到 1.0.1');
    console.log('这可能是导致版本检测错误的原因！');
  }
}

// 运行测试
if (require.main === module) {
  console.log('🧪 版本比较逻辑测试工具');
  console.log('专门诊断 1.0.0 vs 1.0.1 的比较问题\n');
  
  // 先测试问题场景
  testProblemScenario();
  
  // 再运行完整测试
  const allPassed = runTests();
  
  process.exit(allPassed ? 0 : 1);
}

module.exports = {
  compareVersions,
  isValidVersion,
  runTests,
  testProblemScenario
};