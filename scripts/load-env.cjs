#!/usr/bin/env node

/**
 * 环境变量加载工具
 * 手动加载.env文件中的环境变量
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析.env文件内容
 */
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过空行和注释
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // 解析键值对
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      
      // 移除引号
      const cleanValue = value.replace(/^["']|["']$/g, '');
      env[key] = cleanValue;
    }
  }
  
  return env;
}

/**
 * 加载环境变量文件
 */
function loadEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return parseEnvFile(content);
  } catch (error) {
    console.error(`加载环境文件失败 ${filePath}:`, error.message);
    return {};
  }
}

/**
 * 加载所有环境变量
 */
function loadAllEnvVars() {
  const rootDir = path.resolve(__dirname, '..');
  const envFiles = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env.production')
  ];
  
  let allEnvVars = {};
  
  // 按优先级加载环境文件
  for (const envFile of envFiles) {
    const envVars = loadEnvFile(envFile);
    allEnvVars = { ...allEnvVars, ...envVars };
    
    if (Object.keys(envVars).length > 0) {
      console.log(`✅ 加载环境文件: ${path.basename(envFile)} (${Object.keys(envVars).length} 个变量)`);
    }
  }
  
  // 设置到process.env
  for (const [key, value] of Object.entries(allEnvVars)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  
  return allEnvVars;
}

module.exports = {
  loadAllEnvVars,
  loadEnvFile,
  parseEnvFile
};

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🔄 加载环境变量...\n');
  const envVars = loadAllEnvVars();
  
  console.log('\n📋 已加载的环境变量:');
  for (const [key, value] of Object.entries(envVars)) {
    if (key.startsWith('VITE_')) {
      console.log(`  ${key}=${value}`);
    }
  }
  
  console.log(`\n✅ 总共加载了 ${Object.keys(envVars).length} 个环境变量`);
}