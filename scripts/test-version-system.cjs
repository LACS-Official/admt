#!/usr/bin/env node

/**
 * 版本管理系统测试脚本
 * 验证整个版本管理系统是否正常工作
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 开始测试版本管理系统...\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    console.log(`🔍 测试: ${testName}`);
    testFn();
    console.log(`✅ 通过: ${testName}\n`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ 失败: ${testName}`);
    console.error(`   错误: ${error.message}\n`);
    testsFailed++;
  }
}

// 测试1: 版本配置文件存在且格式正确
runTest('版本配置文件存在且格式正确', () => {
  const configPath = path.join(__dirname, '..', 'version.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('版本配置文件不存在');
  }
  
  const content = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(content);
  
  if (!config.version) {
    throw new Error('版本配置缺少version字段');
  }
  
  if (!/^\d+\.\d+\.\d+/.test(config.version)) {
    throw new Error('版本号格式无效');
  }
  
  console.log(`   版本号: ${config.version}`);
});

// 测试2: 环境变量文件存在
runTest('环境变量文件存在', () => {
  const envFiles = ['.env', '.env.production'];
  const rootDir = path.join(__dirname, '..');
  
  for (const envFile of envFiles) {
    const filePath = path.join(rootDir, envFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`环境文件不存在: ${envFile}`);
    }
    console.log(`   找到: ${envFile}`);
  }
});

// 测试3: 版本管理脚本可执行
runTest('版本管理脚本可执行', () => {
  try {
    const output = execSync('node scripts/version-manager.cjs validate', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    if (!output.includes('所有版本号一致')) {
      throw new Error('版本一致性验证失败');
    }
    
    console.log('   版本一致性验证通过');
  } catch (error) {
    throw new Error(`脚本执行失败: ${error.message}`);
  }
});

// 测试4: 环境变量验证脚本可执行
runTest('环境变量验证脚本可执行', () => {
  try {
    const output = execSync('node scripts/validate-env.cjs', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    if (!output.includes('环境变量验证完全通过') && !output.includes('环境变量验证通过')) {
      throw new Error('环境变量验证失败');
    }
    
    console.log('   环境变量验证通过');
  } catch (error) {
    throw new Error(`环境变量验证失败: ${error.message}`);
  }
});

// 测试5: package.json版本同步
runTest('package.json版本同步', () => {
  const configPath = path.join(__dirname, '..', 'version.config.json');
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (config.version !== packageJson.version) {
    throw new Error(`版本不一致: config=${config.version}, package=${packageJson.version}`);
  }
  
  console.log(`   版本一致: ${config.version}`);
});

// 测试6: Cargo.toml版本同步
runTest('Cargo.toml版本同步', () => {
  const configPath = path.join(__dirname, '..', 'version.config.json');
  const cargoPath = path.join(__dirname, '..', 'src-tauri', 'Cargo.toml');
  
  if (!fs.existsSync(cargoPath)) {
    throw new Error('Cargo.toml文件不存在');
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const cargoContent = fs.readFileSync(cargoPath, 'utf8');
  
  const versionMatch = cargoContent.match(/^version\s*=\s*"([^"]*)"/m);
  if (!versionMatch) {
    throw new Error('Cargo.toml中未找到版本信息');
  }
  
  const cargoVersion = versionMatch[1];
  if (config.version !== cargoVersion) {
    throw new Error(`版本不一致: config=${config.version}, cargo=${cargoVersion}`);
  }
  
  console.log(`   版本一致: ${config.version}`);
});

// 测试7: tauri.conf.json版本同步
runTest('tauri.conf.json版本同步', () => {
  const configPath = path.join(__dirname, '..', 'version.config.json');
  const tauriPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
  
  if (!fs.existsSync(tauriPath)) {
    throw new Error('tauri.conf.json文件不存在');
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const tauriConf = JSON.parse(fs.readFileSync(tauriPath, 'utf8'));
  
  if (config.version !== tauriConf.version) {
    throw new Error(`版本不一致: config=${config.version}, tauri=${tauriConf.version}`);
  }
  
  console.log(`   版本一致: ${config.version}`);
});

// 测试8: 前端版本管理工具文件存在
runTest('前端版本管理工具文件存在', () => {
  const versionManagerPath = path.join(__dirname, '..', 'src', 'utils', 'versionManager.ts');
  
  if (!fs.existsSync(versionManagerPath)) {
    throw new Error('前端版本管理工具文件不存在');
  }
  
  const content = fs.readFileSync(versionManagerPath, 'utf8');
  
  if (!content.includes('class VersionManager')) {
    throw new Error('版本管理类不存在');
  }
  
  if (!content.includes('export const versionManager')) {
    throw new Error('版本管理实例导出不存在');
  }
  
  console.log('   前端版本管理工具完整');
});

// 测试9: 版本显示组件存在
runTest('版本显示组件存在', () => {
  const componentPath = path.join(__dirname, '..', 'src', 'components', 'Common', 'VersionDisplay.tsx');
  
  if (!fs.existsSync(componentPath)) {
    throw new Error('版本显示组件不存在');
  }
  
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (!content.includes('export const VersionDisplay')) {
    throw new Error('版本显示组件导出不存在');
  }
  
  console.log('   版本显示组件完整');
});

// 测试10: 后端版本管理代码存在
runTest('后端版本管理代码存在', () => {
  const versionRsPath = path.join(__dirname, '..', 'src-tauri', 'src', 'version.rs');
  
  if (!fs.existsSync(versionRsPath)) {
    throw new Error('后端版本管理文件不存在');
  }
  
  const content = fs.readFileSync(versionRsPath, 'utf8');
  
  if (!content.includes('fn get_unified_version()')) {
    throw new Error('统一版本获取函数不存在');
  }
  
  if (!content.includes('fn read_version_config()')) {
    throw new Error('版本配置读取函数不存在');
  }
  
  console.log('   后端版本管理代码完整');
});

// 输出测试结果
console.log('='.repeat(50));
console.log(`📊 测试结果:`);
console.log(`✅ 通过: ${testsPassed} 个测试`);
console.log(`❌ 失败: ${testsFailed} 个测试`);
console.log(`📈 成功率: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 所有测试通过！版本管理系统工作正常。');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败，请检查上述错误信息。');
  process.exit(1);
}