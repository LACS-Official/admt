#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 确保构建时必要的环境变量已正确配置
 */

const fs = require('fs');
const path = require('path');

// 必需的环境变量
const requiredEnvVars = [
  'VITE_API_BASE_URL',
  'VITE_SOFTWARE_ID',
  'VITE_APP_VERSION',
  'VITE_BUILD_NUMBER',
  'VITE_VERSION_NAME',
  'VITE_RELEASE_DATE'
];

// 可选但建议配置的环境变量
const recommendedEnvVars = [
  'VITE_ENABLE_SIGNATURE',
  'VITE_SIGNATURE_SECRET',
  'VITE_APP_ENV',
  'VITE_VERSION_CONFIG_FILE'
];

console.log('🔍 开始验证环境变量配置...\n');

// 检查必需的环境变量
let hasErrors = false;
let hasWarnings = false;

console.log('📋 检查必需的环境变量:');
for (const envVar of requiredEnvVars) {
  const value = process.env[envVar];
  if (!value) {
    console.error(`❌ 缺少必需的环境变量: ${envVar}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${envVar}: ${value}`);
    
    // 特殊验证
    if (envVar === 'VITE_API_BASE_URL' && value.includes('example.com')) {
      console.error(`❌ ${envVar} 使用了示例域名，请配置正确的API地址`);
      hasErrors = true;
    }
    
    if (envVar === 'VITE_SOFTWARE_ID' && (isNaN(parseInt(value)) || parseInt(value) <= 0)) {
      console.error(`❌ ${envVar} 必须是大于0的数字`);
      hasErrors = true;
    }
    
    if (envVar === 'VITE_APP_VERSION' && !/^\d+\.\d+\.\d+/.test(value)) {
      console.error(`❌ ${envVar} 版本格式无效，应为 x.y.z 格式`);
      hasErrors = true;
    }
    
    if (envVar === 'VITE_BUILD_NUMBER' && (isNaN(parseInt(value)) || parseInt(value) <= 0)) {
      console.error(`❌ ${envVar} 必须是大于0的数字`);
      hasErrors = true;
    }
    
    if (envVar === 'VITE_VERSION_NAME' && !/^\d+\.\d+\.\d+/.test(value)) {
      console.error(`❌ ${envVar} 版本名称格式无效，应为 x.y.z 格式`);
      hasErrors = true;
    }
    
    if (envVar === 'VITE_RELEASE_DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      console.error(`❌ ${envVar} 日期格式无效，应为 YYYY-MM-DD 格式`);
      hasErrors = true;
    }
  }
}

console.log('\n📋 检查推荐的环境变量:');
for (const envVar of recommendedEnvVars) {
  const value = process.env[envVar];
  if (!value) {
    console.warn(`⚠️  建议配置环境变量: ${envVar}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${envVar}: ${value}`);
  }
}

// 检查环境文件是否存在
console.log('\n📋 检查环境配置文件:');
const envFiles = ['.env', '.env.production', '.env.local'];
for (const envFile of envFiles) {
  const filePath = path.join(process.cwd(), envFile);
  if (fs.existsSync(filePath)) {
    console.log(`✅ 找到环境文件: ${envFile}`);
  } else {
    console.log(`ℹ️  环境文件不存在: ${envFile}`);
  }
}

// 检查构建模式
console.log('\n📋 检查构建模式:');
const nodeEnv = process.env.NODE_ENV || 'development';
const viteMode = process.env.VITE_MODE || process.env.MODE || 'development';
console.log(`NODE_ENV: ${nodeEnv}`);
console.log(`VITE_MODE: ${viteMode}`);

if (nodeEnv === 'production' && !process.env.VITE_API_BASE_URL) {
  console.error('❌ 生产环境构建必须配置 VITE_API_BASE_URL');
  hasErrors = true;
}

// 输出结果
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ 环境变量验证失败！请修复上述错误后重试。');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  环境变量验证通过，但有警告信息。');
  console.log('✅ 继续构建...');
} else {
  console.log('✅ 环境变量验证完全通过！');
}

console.log('='.repeat(50) + '\n');