/**
 * 版本检测问题综合诊断脚本
 * 模拟完整的版本检查流程，找出问题所在
 */

const fs = require('fs');
const path = require('path');

// 模拟环境变量
const mockEnv = {
  VITE_API_BASE_URL: 'https://api-g.lacs.cc',
  VITE_SOFTWARE_ID: '1',
  VITE_APP_VERSION: '1.0.0',
  DEV: false,
  MODE: 'production'
};

// 模拟API响应
const mockApiResponse = {
  success: true,
  data: {
    version: '1.0.1',
    downloadUrl: 'https://example.com/download/v1.0.1',
    releaseNotes: '修复了一些问题，提升了性能',
    forceUpdate: false,
    publishedAt: '2024-01-15T10:30:00Z'
  },
  message: '获取版本信息成功'
};

// 版本比较逻辑（从测试中复制）
function compareVersions(current, latest) {
  try {
    console.log(`🔄 版本比较: "${current}" vs "${latest}"`);

    const parseVersion = (version) => {
      const cleanVersion = version.trim();
      const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
      if (!match) {
        throw new Error(`版本解析失败: ${version}`);
      }
      
      return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        prerelease: match[4] || null,
        build: match[5] || null
      };
    };

    const currentVer = parseVersion(current);
    const latestVer = parseVersion(latest);

    let result = 0;
    let reason = '';

    if (currentVer.major !== latestVer.major) {
      result = currentVer.major < latestVer.major ? -1 : 1;
      reason = `主版本不同: ${currentVer.major} vs ${latestVer.major}`;
    }
    else if (currentVer.minor !== latestVer.minor) {
      result = currentVer.minor < latestVer.minor ? -1 : 1;
      reason = `次版本不同: ${currentVer.minor} vs ${latestVer.minor}`;
    }
    else if (currentVer.patch !== latestVer.patch) {
      result = currentVer.patch < latestVer.patch ? -1 : 1;
      reason = `修订版本不同: ${currentVer.patch} vs ${latestVer.patch}`;
    }
    else if (currentVer.prerelease && !latestVer.prerelease) {
      result = -1;
      reason = `预发布版本 < 正式版本`;
    }
    else if (!currentVer.prerelease && latestVer.prerelease) {
      result = 1;
      reason = `正式版本 > 预发布版本`;
    }
    else if (currentVer.prerelease && latestVer.prerelease) {
      result = currentVer.prerelease < latestVer.prerelease ? -1 : 
               currentVer.prerelease > latestVer.prerelease ? 1 : 0;
      reason = `预发布版本比较`;
    }
    else {
      result = 0;
      reason = '版本完全相同';
    }

    const hasUpdate = result < 0;
    
    console.log(`✅ 版本比较结果: ${result} (${reason}) -> hasUpdate: ${hasUpdate}`);
    
    return { result, hasUpdate, reason };

  } catch (error) {
    console.error('❌ 版本比较失败:', error.message);
    return { result: 0, hasUpdate: false, reason: `错误: ${error.message}` };
  }
}

// 模拟版本检查结果构建
function buildVersionCheckResult(currentVersion, versionInfo) {
  console.log(`🏗️ 构建版本检查结果...`);
  console.log(`📱 当前版本: "${currentVersion}"`);
  console.log(`☁️ 最新版本: "${versionInfo.version}"`);
  console.log(`🔒 强制更新: ${versionInfo.forceUpdate}`);

  const comparison = compareVersions(currentVersion, versionInfo.version);
  const hasUpdate = comparison.hasUpdate;
  const isForceUpdate = versionInfo.forceUpdate || false;
  
  console.log(`📊 最终结果:`, {
    currentVersion,
    latestVersion: versionInfo.version,
    comparisonResult: comparison.result,
    hasUpdate,
    isForceUpdate,
    reason: comparison.reason
  });

  let message;
  if (!hasUpdate) {
    message = `当前版本 ${currentVersion} 已是最新版本`;
  } else if (isForceUpdate) {
    message = `发现强制更新版本 ${versionInfo.version}，必须更新后才能继续使用`;
  } else {
    message = `发现新版本 ${versionInfo.version}，建议更新以获得最佳体验`;
  }

  const result = {
    hasUpdate,
    needsUpdate: hasUpdate,
    isForceUpdate,
    currentVersion,
    latestVersion: versionInfo.version,
    versionInfo,
    message
  };

  console.log(`✅ 版本检查结果:`, result);
  
  return result;
}

// 检查环境变量配置
function checkEnvironmentConfig() {
  console.log('🔧 检查环境变量配置...\n');
  
  const envFiles = ['.env', '.env.production'];
  const results = {};
  
  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    
    if (!fs.existsSync(envPath)) {
      console.log(`⚠️  ${envFile} 文件不存在`);
      results[envFile] = { exists: false };
      return;
    }

    console.log(`📄 检查 ${envFile}:`);
    const content = fs.readFileSync(envPath, 'utf-8');
    
    const config = {};
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        config[key] = value;
      }
    });
    
    console.log(`  VITE_APP_VERSION: ${config.VITE_APP_VERSION || '未设置'}`);
    console.log(`  VITE_API_BASE_URL: ${config.VITE_API_BASE_URL || '未设置'}`);
    console.log(`  VITE_SOFTWARE_ID: ${config.VITE_SOFTWARE_ID || '未设置'}`);
    
    results[envFile] = { exists: true, config };
    console.log('');
  });
  
  return results;
}

// 检查package.json版本
function checkPackageVersion() {
  console.log('📦 检查package.json版本...\n');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json 文件不存在');
    return null;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const version = packageJson.version;
    
    console.log(`📦 package.json版本: ${version}`);
    return version;
  } catch (error) {
    console.log(`❌ 读取package.json失败: ${error.message}`);
    return null;
  }
}

// 模拟缓存问题
function simulateCacheIssue() {
  console.log('💾 模拟缓存问题...\n');
  
  // 模拟缓存中有旧数据
  const cachedData = {
    version: '1.0.0', // 缓存中的版本与当前版本相同
    downloadUrl: 'https://example.com/download/v1.0.0',
    releaseNotes: '旧版本说明',
    forceUpdate: false,
    publishedAt: '2024-01-01T10:30:00Z'
  };
  
  console.log('💾 模拟缓存数据:', cachedData);
  
  const currentVersion = '1.0.0';
  const result = buildVersionCheckResult(currentVersion, cachedData);
  
  console.log('🔍 缓存问题分析:');
  if (!result.hasUpdate) {
    console.log('❌ 问题发现：缓存中的版本与当前版本相同，导致误判为最新版本！');
    console.log('💡 解决方案：确保缓存失效或强制刷新');
  } else {
    console.log('✅ 缓存数据正常');
  }
  
  return result;
}

// 模拟正确的API响应
function simulateCorrectApiResponse() {
  console.log('\n🌐 模拟正确的API响应...\n');
  
  console.log('📡 API响应数据:', mockApiResponse);
  
  const currentVersion = '1.0.0';
  const result = buildVersionCheckResult(currentVersion, mockApiResponse.data);
  
  console.log('🔍 API响应分析:');
  if (result.hasUpdate) {
    console.log('✅ API响应正确：能够识别需要更新');
  } else {
    console.log('❌ API响应问题：未能识别需要更新');
  }
  
  return result;
}

// 诊断可能的问题
function diagnosePossibleIssues() {
  console.log('\n🔍 诊断可能的问题...\n');
  
  const issues = [];
  
  // 1. 版本获取问题
  console.log('1️⃣ 检查版本获取问题:');
  const envConfig = checkEnvironmentConfig();
  const packageVersion = checkPackageVersion();
  
  // 检查版本不一致
  const envVersion = envConfig['.env']?.config?.VITE_APP_VERSION;
  const prodEnvVersion = envConfig['.env.production']?.config?.VITE_APP_VERSION;
  
  if (envVersion !== packageVersion) {
    issues.push(`环境变量版本(${envVersion})与package.json版本(${packageVersion})不一致`);
  }
  
  if (prodEnvVersion !== packageVersion) {
    issues.push(`生产环境变量版本(${prodEnvVersion})与package.json版本(${packageVersion})不一致`);
  }
  
  // 2. 缓存问题
  console.log('\n2️⃣ 检查缓存问题:');
  const cacheResult = simulateCacheIssue();
  
  // 3. API响应问题
  console.log('\n3️⃣ 检查API响应问题:');
  const apiResult = simulateCorrectApiResponse();
  
  // 4. 总结问题
  console.log('\n📋 问题总结:');
  if (issues.length > 0) {
    console.log('❌ 发现以下问题:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  } else {
    console.log('✅ 未发现明显的配置问题');
  }
  
  return {
    configIssues: issues,
    cacheResult,
    apiResult
  };
}

// 提供解决方案
function provideSolutions() {
  console.log('\n💡 解决方案建议:\n');
  
  console.log('1️⃣ 立即解决方案:');
  console.log('   - 在版本检查时使用 forceRefresh: true 参数');
  console.log('   - 清除版本检查缓存');
  console.log('   - 检查API返回的实际数据');
  
  console.log('\n2️⃣ 配置检查:');
  console.log('   - 确保所有环境变量文件中的版本号一致');
  console.log('   - 验证API配置是否正确');
  console.log('   - 检查网络连接和API可用性');
  
  console.log('\n3️⃣ 调试方法:');
  console.log('   - 使用调试版本服务查看详细日志');
  console.log('   - 在浏览器控制台查看版本检查过程');
  console.log('   - 手动调用API验证响应数据');
  
  console.log('\n4️⃣ 代码修复:');
  console.log('   - 在版本检查失败时添加更详细的错误日志');
  console.log('   - 确保版本比较逻辑正确处理所有情况');
  console.log('   - 添加版本检查结果的验证机制');
}

// 主诊断函数
function runDiagnosis() {
  console.log('🚀 版本检测问题综合诊断\n');
  console.log('=' .repeat(80));
  
  console.log('📋 问题描述:');
  console.log('   本地应用版本: 1.0.0');
  console.log('   云端API版本: 1.0.1');
  console.log('   问题现象: 应用错误检测本地版本为最新版\n');
  
  // 运行诊断
  const diagnosis = diagnosePossibleIssues();
  
  // 提供解决方案
  provideSolutions();
  
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 关键发现:');
  
  if (!diagnosis.cacheResult.hasUpdate) {
    console.log('❌ 缓存问题：当缓存中的版本与当前版本相同时，会误判为最新版本');
    console.log('💡 这很可能是导致问题的主要原因！');
  }
  
  if (diagnosis.apiResult.hasUpdate) {
    console.log('✅ API响应正常：能够正确识别版本更新');
  }
  
  console.log('\n🔧 建议的修复步骤:');
  console.log('1. 清除版本检查缓存');
  console.log('2. 使用强制刷新模式进行版本检查');
  console.log('3. 检查实际的API响应数据');
  console.log('4. 验证版本获取的优先级逻辑');
}

// 运行诊断
if (require.main === module) {
  runDiagnosis();
}

module.exports = {
  runDiagnosis,
  compareVersions,
  buildVersionCheckResult,
  diagnosePossibleIssues
};