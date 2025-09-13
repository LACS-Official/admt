#!/usr/bin/env node

/**
 * 构建前环境检查和配置脚本
 * 确保开发版和发布版都有正确的环境配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkEnvironmentFiles() {
  console.log('🔍 检查环境配置文件...');
  
  const requiredFiles = [
    { file: '.env', description: '开发环境配置' },
    { file: '.env.production', description: '生产环境配置' }
  ];
  
  let allExists = true;
  
  for (const { file, description } of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${description}: ${file} 存在`);
      
      // 检查关键配置
      const content = fs.readFileSync(file, 'utf8');
      const requiredVars = [
        'VITE_API_BASE_URL',
        'VITE_SOFTWARE_ID',
        'VITE_APP_VERSION'
      ];
      
      for (const varName of requiredVars) {
        if (!content.includes(varName)) {
          console.error(`❌ ${file} 缺少必需变量: ${varName}`);
          allExists = false;
        }
      }
    } else {
      console.error(`❌ ${description}: ${file} 不存在`);
      allExists = false;
    }
  }
  
  return allExists;
}

function validateTauriConfig() {
  console.log('🔧 检查 Tauri 配置...');
  
  const configPath = 'src-tauri/tauri.conf.json';
  if (!fs.existsSync(configPath)) {
    console.error('❌ Tauri 配置文件不存在');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // 检查 CSP 配置
    const csp = config.app?.security?.csp;
    if (!csp || !csp.includes('api-g.lacs.cc')) {
      console.error('❌ CSP 配置可能不包含 API 域名');
      return false;
    }
    
    console.log('✅ Tauri 配置检查通过');
    return true;
  } catch (error) {
    console.error('❌ Tauri 配置文件格式错误:', error.message);
    return false;
  }
}

function validateCapabilities() {
  console.log('🔐 检查权限配置...');
  
  const capabilitiesPath = 'src-tauri/capabilities/default.json';
  if (!fs.existsSync(capabilitiesPath)) {
    console.error('❌ 权限配置文件不存在');
    return false;
  }
  
  try {
    const capabilities = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf8'));
    
    // 检查 HTTP 权限
    const hasHttpPermission = capabilities.permissions?.some(p => 
      typeof p === 'object' && 
      p.identifier === 'http:default' && 
      p.allow?.some(a => a.url && a.url.includes('api-g.lacs.cc'))
    );
    
    if (!hasHttpPermission) {
      console.error('❌ HTTP 权限配置可能有问题');
      return false;
    }
    
    console.log('✅ 权限配置检查通过');
    return true;
  } catch (error) {
    console.error('❌ 权限配置文件格式错误:', error.message);
    return false;
  }
}

function main() {
  console.log('🚀 开始构建前检查...\n');
  
  const checks = [
    checkEnvironmentFiles,
    validateTauriConfig, 
    validateCapabilities
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      if (!check()) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ 检查过程中出现错误:`, error.message);
      allPassed = false;
    }
    console.log(''); // 空行分隔
  }
  
  if (allPassed) {
    console.log('✅ 所有检查通过，可以开始构建！');
    process.exit(0);
  } else {
    console.error('❌ 检查失败，请修复上述问题后重新构建');
    console.log('\n📖 修复建议:');
    console.log('1. 确保 .env 和 .env.production 文件存在且包含所有必需变量');
    console.log('2. 检查 tauri.conf.json 中的 CSP 配置');
    console.log('3. 检查 capabilities/default.json 中的 HTTP 权限配置');
    process.exit(1);
  }
}

// 主函数执行检查
main();

// 导出模块 (ES6 语法)
export {
  checkEnvironmentFiles,
  validateTauriConfig,
  validateCapabilities
};