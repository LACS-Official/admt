#!/usr/bin/env node

/**
 * 版本注入脚本
 * 在构建前将版本信息注入到前端代码中
 */

const fs = require('fs');
const path = require('path');

class VersionInjector {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'version.config.json');
    this.srcPath = path.join(this.projectRoot, 'src');
  }

  // 读取版本配置
  readConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ 读取版本配置失败:', error.message);
      process.exit(1);
    }
  }

  // 生成版本常量
  generateVersionConstants(config) {
    const now = new Date().toISOString();
    return `// 自动生成的版本常量文件
// 生成时间: ${now}

export const VERSION_INFO = {
  version: '${config.version}',
  buildNumber: ${config.buildNumber},
  versionName: '${config.versionName}',
  releaseDate: '${config.releaseDate}',
  buildDate: '${now}',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
};

export const APP_CONFIG = {
  name: '玩机管家',
  identifier: 'com.lacs.admt',
  ...VERSION_INFO
};
`;
  }

  // 注入版本信息
  injectVersion() {
    console.log('🔄 注入版本信息...');
    
    const config = this.readConfig();
    const constantsContent = this.generateVersionConstants(config);
    
    // 确保目录存在
    const outputDir = path.join(this.srcPath, 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 写入版本常量文件
    const outputPath = path.join(outputDir, 'version.ts');
    fs.writeFileSync(outputPath, constantsContent, 'utf8');
    
    console.log('✅ 版本信息已注入到:', outputPath);
  }
}

// 运行
if (require.main === module) {
  const injector = new VersionInjector();
  injector.injectVersion();
}

module.exports = VersionInjector;