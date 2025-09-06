#!/usr/bin/env node

/**
 * 版本检测功能测试脚本
 * 用于验证开发版和发行版的版本检测功能是否正常
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 版本检测功能测试\n');

// 模拟不同环境的配置
const environments = {
  development: {
    DEV: true,
    MODE: 'development',
    VITE_API_BASE_URL: 'https://api-g.lacs.cc',
    VITE_SOFTWARE_ID: '1',
    VITE_APP_VERSION: '1.0.0',
    VITE_ENABLE_DEBUG: 'true'
  },
  production: {
    DEV: false,
    MODE: 'production',
    VITE_API_BASE_URL: 'https://api-g.lacs.cc',
    VITE_SOFTWARE_ID: '1',
    VITE_APP_VERSION: '1.0.0',
    VITE_ENABLE_DEBUG: 'false'
  }
};

// 模拟API配置函数
function simulateApiConfig(env) {
  const getEnvVar = (key, defaultValue = '') => env[key] || defaultValue;
  const getEnvNumber = (key, defaultValue) => {
    const value = env[key];
    return value ? parseInt(value, 10) : defaultValue;
  };

  const API_CONFIG = {
    BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api-g.lacs.cc'),
    DEV_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api-g.lacs.cc'),
    SOFTWARE_ID: getEnvNumber('VITE_SOFTWARE_ID', 1),
    APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  };

  // 模拟 getApiBaseUrl
  const getApiBaseUrl = () => {
    const isDev = env.DEV;
    const envBaseUrl = getEnvVar('VITE_API_BASE_URL');
    
    if (envBaseUrl && envBaseUrl !== 'https://api.example.com') {
      return envBaseUrl;
    }
    
    return isDev ? API_CONFIG.DEV_BASE_URL : API_CONFIG.BASE_URL;
  };

  // 模拟 getSoftwareId
  const getSoftwareId = () => {
    const envSoftwareId = getEnvNumber('VITE_SOFTWARE_ID', 0);
    
    if (envSoftwareId > 0) {
      return envSoftwareId;
    }
    
    if (!env.DEV && API_CONFIG.SOFTWARE_ID <= 0) {
      throw new Error('Production build requires valid VITE_SOFTWARE_ID');
    }
    
    return API_CONFIG.SOFTWARE_ID;
  };

  return {
    baseUrl: getApiBaseUrl(),
    softwareId: getSoftwareId(),
    appVersion: API_CONFIG.APP_VERSION,
    isDev: env.DEV,
    mode: env.MODE
  };
}

// 测试不同环境
console.log('📋 测试不同环境的配置:\n');

for (const [envName, envVars] of Object.entries(environments)) {
  console.log(`🔧 ${envName.toUpperCase()} 环境:`);
  
  try {
    const config = simulateApiConfig(envVars);
    
    console.log(`  ✅ API基础URL: ${config.baseUrl}`);
    console.log(`  ✅ 软件ID: ${config.softwareId}`);
    console.log(`  ✅ 应用版本: ${config.appVersion}`);
    console.log(`  ✅ 开发模式: ${config.isDev}`);
    console.log(`  ✅ 构建模式: ${config.mode}`);
    
    // 生成API端点
    const versionEndpoint = `${config.baseUrl}/app/software/id/${config.softwareId}/versions/latest`;
    const announcementEndpoint = `${config.baseUrl}/app/software/id/${config.softwareId}/announcements`;
    
    console.log(`  📡 版本检查端点: ${versionEndpoint}`);
    console.log(`  📡 公告获取端点: ${announcementEndpoint}`);
    
    // 验证端点有效性
    if (config.baseUrl.includes('example.com')) {
      console.error(`  ❌ 警告: 使用了示例域名`);
    }
    
    if (config.softwareId <= 0) {
      console.error(`  ❌ 错误: 软件ID无效`);
    }
    
  } catch (error) {
    console.error(`  ❌ 配置错误: ${error.message}`);
  }
  
  console.log('');
}

// 检查配置文件
console.log('📋 检查配置文件:\n');

const configFiles = [
  { path: '.env', name: '开发环境配置' },
  { path: '.env.production', name: '生产环境配置' },
  { path: 'src/config/api.ts', name: 'API配置文件' },
  { path: 'src/services/versionService.ts', name: '版本服务文件' }
];

for (const file of configFiles) {
  const filePath = path.join(process.cwd(), file.path);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file.name}: ${file.path}`);
    
    // 检查关键配置
    if (file.path.endsWith('.env') || file.path.endsWith('.env.production')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasApiUrl = content.includes('VITE_API_BASE_URL');
      const hasSoftwareId = content.includes('VITE_SOFTWARE_ID');
      const hasVersion = content.includes('VITE_APP_VERSION');
      
      console.log(`  - API URL配置: ${hasApiUrl ? '✅' : '❌'}`);
      console.log(`  - 软件ID配置: ${hasSoftwareId ? '✅' : '❌'}`);
      console.log(`  - 版本配置: ${hasVersion ? '✅' : '❌'}`);
    }
  } else {
    console.error(`❌ ${file.name}: ${file.path} (文件不存在)`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('🎯 测试总结:');
console.log('1. 确保 .env 和 .env.production 文件包含正确的配置');
console.log('2. 验证 API_CONFIG 使用新的 getSoftwareId() 函数');
console.log('3. 检查版本服务是否正确处理配置错误');
console.log('4. 测试开发版和发行版是否使用相同的配置逻辑');
console.log('='.repeat(60));

console.log('\n🚀 下一步操作:');
console.log('1. 运行 npm run validate-env 验证环境变量');
console.log('2. 运行 npm run dev 测试开发环境');
console.log('3. 运行 npm run build:prod 测试生产构建');
console.log('4. 运行 npm run tauri:build:prod 测试发行版构建');