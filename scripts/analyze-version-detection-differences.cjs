#!/usr/bin/env node

/**
 * 开发版与发布版版本检测差异分析脚本
 * 深入分析启动流程、API请求、网络配置和错误处理机制
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开发版与发布版版本检测差异分析');
console.log('=' .repeat(60));

/**
 * 分析环境配置差异
 */
function analyzeEnvironmentDifferences() {
  console.log('\n📋 1. 环境配置差异分析');
  console.log('-'.repeat(40));
  
  try {
    // 读取开发环境配置
    const devEnv = fs.readFileSync('.env', 'utf8');
    const prodEnv = fs.readFileSync('.env.production', 'utf8');
    
    console.log('🔧 开发环境配置:');
    const devConfig = parseEnvFile(devEnv);
    Object.entries(devConfig).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n🏭 生产环境配置:');
    const prodConfig = parseEnvFile(prodEnv);
    Object.entries(prodConfig).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n⚠️  关键差异:');
    const criticalDiffs = [
      'VITE_ENABLE_SIGNATURE',
      'VITE_ENABLE_STRICT_USER_AGENT', 
      'VITE_SIGNATURE_SECRET',
      'VITE_ENABLE_DEBUG',
      'VITE_ENABLE_CONSOLE_LOGS'
    ];
    
    criticalDiffs.forEach(key => {
      const devVal = devConfig[key] || '未设置';
      const prodVal = prodConfig[key] || '未设置';
      if (devVal !== prodVal) {
        console.log(`  🔴 ${key}: 开发版(${devVal}) vs 生产版(${prodVal})`);
      }
    });
    
  } catch (error) {
    console.error('❌ 环境配置分析失败:', error.message);
  }
}

/**
 * 解析环境变量文件
 */
function parseEnvFile(content) {
  const config = {};
  const lines = content.split('\n');
  
  lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return config;
}

/**
 * 分析启动流程调用链路
 */
function analyzeStartupFlow() {
  console.log('\n🚀 2. 启动流程调用链路分析');
  console.log('-'.repeat(40));
  
  const startupFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/components/StartupFlow/StartupFlowManager.tsx',
    'src/components/StartupFlow/App_Loading.tsx',
    'src/components/Common/StartupVersionChecker.tsx'
  ];
  
  startupFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - 存在`);
      analyzeFileForVersionChecking(file);
    } else {
      console.log(`❌ ${file} - 不存在`);
    }
  });
}

/**
 * 分析文件中的版本检测相关代码
 */
function analyzeFileForVersionChecking(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查版本检测相关的导入和调用
    const patterns = [
      /import.*VersionChecker/g,
      /import.*versionService/g,
      /checkVersion/g,
      /performVersionCheck/g,
      /StartupVersionChecker/g,
      /import\.meta\.env/g
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`    🔍 发现 ${pattern.source}: ${matches.length} 处`);
      }
    });
    
  } catch (error) {
    console.log(`    ❌ 分析失败: ${error.message}`);
  }
}

/**
 * 分析API请求参数差异
 */
function analyzeApiRequestDifferences() {
  console.log('\n🌐 3. API请求参数差异分析');
  console.log('-'.repeat(40));
  
  try {
    // 分析版本服务
    const versionServicePath = 'src/services/versionService.ts';
    if (fs.existsSync(versionServicePath)) {
      const content = fs.readFileSync(versionServicePath, 'utf8');
      
      console.log('📡 版本检测API请求分析:');
      
      // 检查请求头设置
      const headerMatches = content.match(/'User-Agent':\s*[^,}]+/g);
      if (headerMatches) {
        console.log('  🏷️  User-Agent 设置:');
        headerMatches.forEach(match => {
          console.log(`    ${match}`);
        });
      }
      
      // 检查签名相关代码
      const signatureMatches = content.match(/signature|SIGNATURE/gi);
      if (signatureMatches) {
        console.log(`  🔐 签名相关代码: ${signatureMatches.length} 处`);
      }
      
      // 检查环境判断逻辑
      const envMatches = content.match(/import\.meta\.env\.[A-Z_]+/g);
      if (envMatches) {
        console.log('  🔧 环境变量使用:');
        [...new Set(envMatches)].forEach(match => {
          console.log(`    ${match}`);
        });
      }
    }
    
    // 分析API配置
    const apiConfigPath = 'src/config/api.ts';
    if (fs.existsSync(apiConfigPath)) {
      const content = fs.readFileSync(apiConfigPath, 'utf8');
      
      console.log('\n⚙️  API配置分析:');
      
      // 检查环境检测函数
      const envFunctions = ['isProduction', 'isDevelopment', 'getApiBaseUrl'];
      envFunctions.forEach(func => {
        if (content.includes(func)) {
          console.log(`  ✅ ${func} 函数存在`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ API请求分析失败:', error.message);
  }
}

/**
 * 分析错误处理机制
 */
function analyzeErrorHandling() {
  console.log('\n🚨 4. 错误处理机制分析');
  console.log('-'.repeat(40));
  
  try {
    const versionCheckerPath = 'src/components/Common/StartupVersionChecker.tsx';
    if (fs.existsSync(versionCheckerPath)) {
      const content = fs.readFileSync(versionCheckerPath, 'utf8');
      
      console.log('🔍 启动版本检查器错误处理:');
      
      // 检查错误状态处理
      const errorPatterns = [
        /catch\s*\([^)]*\)\s*{[^}]*}/g,
        /error\s*&&/g,
        /handleError/g,
        /强制退出|forceExit|process\.exit/g,
        /已是最新版|latest.*version/gi
      ];
      
      errorPatterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`  🔍 错误处理模式 ${index + 1}: ${matches.length} 处`);
          if (index === 3) { // 强制退出相关
            matches.forEach(match => {
              console.log(`    📝 ${match.substring(0, 50)}...`);
            });
          }
        }
      });
      
      // 检查默认返回逻辑
      if (content.includes('已是最新版')) {
        console.log('  ⚠️  发现"已是最新版"默认返回逻辑');
      }
    }
    
  } catch (error) {
    console.error('❌ 错误处理分析失败:', error.message);
  }
}

/**
 * 分析版本比较逻辑
 */
function analyzeVersionComparison() {
  console.log('\n🔢 5. 版本比较逻辑分析');
  console.log('-'.repeat(40));
  
  try {
    const versionServicePath = 'src/services/versionService.ts';
    if (fs.existsSync(versionServicePath)) {
      const content = fs.readFileSync(versionServicePath, 'utf8');
      
      console.log('📊 版本比较函数分析:');
      
      // 检查版本比较函数
      const versionFunctions = [
        'compareVersions',
        'isNewerVersion', 
        'parseVersion',
        'normalizeVersion'
      ];
      
      versionFunctions.forEach(func => {
        if (content.includes(func)) {
          console.log(`  ✅ ${func} 函数存在`);
          
          // 提取函数实现
          const funcRegex = new RegExp(`${func}[^{]*{[^}]*}`, 'g');
          const funcMatch = content.match(funcRegex);
          if (funcMatch) {
            console.log(`    📝 实现预览: ${funcMatch[0].substring(0, 100)}...`);
          }
        }
      });
      
      // 测试版本比较逻辑
      console.log('\n🧪 版本比较测试:');
      testVersionComparison();
    }
    
  } catch (error) {
    console.error('❌ 版本比较分析失败:', error.message);
  }
}

/**
 * 测试版本比较逻辑
 */
function testVersionComparison() {
  // 模拟版本比较函数
  function compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }
  
  const testCases = [
    ['1.0.0', '1.0.1'],
    ['1.0.1', '1.0.0'],
    ['1.0.1', '1.0.1'],
    ['1.0', '1.0.0'],
    ['2.0.0', '1.9.9']
  ];
  
  testCases.forEach(([v1, v2]) => {
    const result = compareVersions(v1, v2);
    const resultText = result > 0 ? `${v1} > ${v2}` : 
                     result < 0 ? `${v1} < ${v2}` : 
                     `${v1} = ${v2}`;
    console.log(`    ${resultText}`);
  });
}

/**
 * 分析网络环境配置
 */
function analyzeNetworkConfiguration() {
  console.log('\n🌍 6. 网络环境配置分析');
  console.log('-'.repeat(40));
  
  try {
    // 检查Tauri配置
    const tauriConfigPath = 'src-tauri/tauri.conf.json';
    if (fs.existsSync(tauriConfigPath)) {
      const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
      
      console.log('🔧 Tauri网络配置:');
      
      if (tauriConfig.app) {
        console.log(`  📱 应用版本: ${tauriConfig.app.version}`);
      }
      
      if (tauriConfig.bundle) {
        console.log(`  📦 Bundle标识符: ${tauriConfig.bundle.identifier}`);
      }
      
      // 检查安全配置
      if (tauriConfig.security) {
        console.log('  🔒 安全配置:');
        Object.entries(tauriConfig.security).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      }
      
      // 检查HTTP配置
      if (tauriConfig.http) {
        console.log('  🌐 HTTP配置:');
        Object.entries(tauriConfig.http).forEach(([key, value]) => {
          console.log(`    ${key}: ${JSON.stringify(value)}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 网络配置分析失败:', error.message);
  }
}

/**
 * 生成问题诊断报告
 */
function generateDiagnosticReport() {
  console.log('\n📋 7. 问题诊断报告');
  console.log('-'.repeat(40));
  
  console.log('🔍 可能的问题原因:');
  
  console.log('\n1️⃣  签名验证差异:');
  console.log('   - 开发版: VITE_ENABLE_SIGNATURE=false');
  console.log('   - 生产版: VITE_ENABLE_SIGNATURE=true');
  console.log('   - 影响: 生产版可能因签名验证失败导致API请求被拒绝');
  
  console.log('\n2️⃣  User-Agent检查差异:');
  console.log('   - 开发版: VITE_ENABLE_STRICT_USER_AGENT=false');
  console.log('   - 生产版: VITE_ENABLE_STRICT_USER_AGENT=true');
  console.log('   - 影响: 生产版可能因User-Agent不匹配被服务器拒绝');
  
  console.log('\n3️⃣  错误处理逻辑问题:');
  console.log('   - 生产版可能有默认"已是最新版"的降级逻辑');
  console.log('   - 网络错误时未正确抛出异常，而是返回成功状态');
  
  console.log('\n4️⃣  环境变量配置问题:');
  console.log('   - 生产版的VITE_SIGNATURE_SECRET可能未正确配置');
  console.log('   - API基础URL在不同环境下可能有差异');
  
  console.log('\n5️⃣  版本比较逻辑问题:');
  console.log('   - 1.0.1 vs 1.0.0 的比较可能存在逻辑错误');
  console.log('   - 字符串比较而非数值比较导致的问题');
  
  console.log('\n💡 建议的修复方案:');
  console.log('1. 统一开发版和生产版的签名验证逻辑');
  console.log('2. 修复版本比较算法，确保数值比较的准确性');
  console.log('3. 完善错误处理机制，确保API失败时正确抛出异常');
  console.log('4. 添加详细的日志记录，便于问题排查');
  console.log('5. 实现强制退出机制，当版本检测失败时终止应用');
}

/**
 * 主函数
 */
function main() {
  try {
    analyzeEnvironmentDifferences();
    analyzeStartupFlow();
    analyzeApiRequestDifferences();
    analyzeErrorHandling();
    analyzeVersionComparison();
    analyzeNetworkConfiguration();
    generateDiagnosticReport();
    
    console.log('\n✅ 分析完成!');
    console.log('📄 详细报告已生成，请查看上述输出内容');
    
  } catch (error) {
    console.error('❌ 分析过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行分析
main();