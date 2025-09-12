#!/usr/bin/env node

/**
 * 版本检测问题一键修复脚本
 * 自动检查和修复版本检测相关的配置问题
 */

const fs = require('fs');
const path = require('path');

class VersionDetectionFixer {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.rootDir = process.cwd();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * 检查文件是否存在
   */
  fileExists(filePath) {
    return fs.existsSync(path.join(this.rootDir, filePath));
  }

  /**
   * 读取JSON文件
   */
  readJsonFile(filePath) {
    try {
      const fullPath = path.join(this.rootDir, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * 写入JSON文件
   */
  writeJsonFile(filePath, data) {
    try {
      const fullPath = path.join(this.rootDir, filePath);
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
      return true;
    } catch (error) {
      this.log(`写入文件失败 ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 读取环境变量文件
   */
  readEnvFile(filePath) {
    try {
      const fullPath = path.join(this.rootDir, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const env = {};
      
      content.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      
      return env;
    } catch (error) {
      return null;
    }
  }

  /**
   * 写入环境变量文件
   */
  writeEnvFile(filePath, env, comments = {}) {
    try {
      const fullPath = path.join(this.rootDir, filePath);
      let content = '';
      
      // 添加文件头注释
      if (filePath.includes('production')) {
        content += '# 生产环境配置\n';
      } else {
        content += '# 开发环境配置\n';
      }
      
      // 按类别组织环境变量
      const categories = {
        'API配置': ['VITE_API_BASE_URL', 'VITE_SOFTWARE_ID', 'VITE_APP_VERSION'],
        '版本管理配置': ['VITE_VERSION_CONFIG_FILE', 'VITE_BUILD_NUMBER', 'VITE_VERSION_NAME', 'VITE_RELEASE_DATE'],
        '安全配置': ['VITE_ENABLE_SIGNATURE', 'VITE_ENABLE_STRICT_USER_AGENT', 'VITE_SIGNATURE_SECRET'],
        '调试配置': ['VITE_ENABLE_DEBUG', 'VITE_ENABLE_CONSOLE_LOGS', 'VITE_DEBUG_MODE'],
        '应用环境标识': ['VITE_APP_ENV', 'VITE_NODE_ENV']
      };

      Object.entries(categories).forEach(([category, keys]) => {
        const categoryVars = keys.filter(key => env[key] !== undefined);
        if (categoryVars.length > 0) {
          content += `\n# ${category}\n`;
          categoryVars.forEach(key => {
            if (comments[key]) {
              content += `# ${comments[key]}\n`;
            }
            content += `${key}=${env[key]}\n`;
          });
        }
      });

      fs.writeFileSync(fullPath, content);
      return true;
    } catch (error) {
      this.log(`写入环境文件失败 ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 检查版本号格式
   */
  isValidVersion(version) {
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  /**
   * 检查环境变量配置
   */
  checkEnvironmentConfig() {
    this.log('检查环境变量配置...', 'info');

    const envFiles = ['.env', '.env.production'];
    const requiredVars = ['VITE_API_BASE_URL', 'VITE_SOFTWARE_ID', 'VITE_APP_VERSION'];

    envFiles.forEach(envFile => {
      if (!this.fileExists(envFile)) {
        this.issues.push(`缺少环境文件: ${envFile}`);
        this.fixes.push(() => this.createDefaultEnvFile(envFile));
        return;
      }

      const env = this.readEnvFile(envFile);
      if (!env) {
        this.issues.push(`无法读取环境文件: ${envFile}`);
        return;
      }

      // 检查必需变量
      requiredVars.forEach(varName => {
        if (!env[varName] || env[varName] === 'undefined') {
          this.issues.push(`${envFile} 缺少必需变量: ${varName}`);
          this.fixes.push(() => this.fixEnvVariable(envFile, varName));
        }
      });

      // 检查API URL
      if (env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.includes('example.com')) {
        this.issues.push(`${envFile} API URL配置错误: ${env.VITE_API_BASE_URL}`);
        this.fixes.push(() => this.fixApiUrl(envFile));
      }

      // 检查软件ID
      const softwareId = parseInt(env.VITE_SOFTWARE_ID || '0');
      if (softwareId <= 0) {
        this.issues.push(`${envFile} 软件ID配置错误: ${env.VITE_SOFTWARE_ID}`);
        this.fixes.push(() => this.fixSoftwareId(envFile));
      }

      // 检查版本号格式
      if (env.VITE_APP_VERSION && !this.isValidVersion(env.VITE_APP_VERSION)) {
        this.issues.push(`${envFile} 版本号格式错误: ${env.VITE_APP_VERSION}`);
        this.fixes.push(() => this.fixVersionFormat(envFile));
      }
    });
  }

  /**
   * 检查版本同步
   */
  checkVersionSync() {
    this.log('检查版本同步状态...', 'info');

    const versionSources = {};

    // 检查 package.json
    const packageJson = this.readJsonFile('package.json');
    if (packageJson && packageJson.version) {
      versionSources.package = packageJson.version;
    }

    // 检查 tauri.conf.json
    const tauriConf = this.readJsonFile('src-tauri/tauri.conf.json');
    if (tauriConf && tauriConf.version) {
      versionSources.tauri = tauriConf.version;
    }

    // 检查 version.config.json
    const versionConfig = this.readJsonFile('version.config.json');
    if (versionConfig && versionConfig.version) {
      versionSources.config = versionConfig.version;
    }

    // 检查环境变量
    const env = this.readEnvFile('.env');
    if (env && env.VITE_APP_VERSION) {
      versionSources.env = env.VITE_APP_VERSION;
    }

    const envProd = this.readEnvFile('.env.production');
    if (envProd && envProd.VITE_APP_VERSION) {
      versionSources.envProd = envProd.VITE_APP_VERSION;
    }

    // 检查版本一致性
    const versions = Object.values(versionSources).filter(v => v);
    const uniqueVersions = [...new Set(versions)];

    if (uniqueVersions.length > 1) {
      this.issues.push(`版本不一致: ${JSON.stringify(versionSources)}`);
      this.fixes.push(() => this.syncVersions(versionSources));
    } else if (uniqueVersions.length === 1) {
      this.log(`版本同步正常: ${uniqueVersions[0]}`, 'success');
    } else {
      this.issues.push('未找到任何版本配置');
      this.fixes.push(() => this.createDefaultVersionConfig());
    }
  }

  /**
   * 检查Tauri配置
   */
  checkTauriConfig() {
    this.log('检查Tauri配置...', 'info');

    if (!this.fileExists('src-tauri/tauri.conf.json')) {
      this.issues.push('缺少Tauri配置文件');
      return;
    }

    const tauriConf = this.readJsonFile('src-tauri/tauri.conf.json');
    if (!tauriConf) {
      this.issues.push('无法读取Tauri配置文件');
      return;
    }

    // 检查必需字段
    const requiredFields = ['productName', 'version', 'identifier'];
    requiredFields.forEach(field => {
      if (!tauriConf[field]) {
        this.issues.push(`Tauri配置缺少字段: ${field}`);
        this.fixes.push(() => this.fixTauriConfig(field));
      }
    });

    // 检查版本格式
    if (tauriConf.version && !this.isValidVersion(tauriConf.version)) {
      this.issues.push(`Tauri版本格式错误: ${tauriConf.version}`);
      this.fixes.push(() => this.fixTauriVersion());
    }
  }

  /**
   * 创建默认环境文件
   */
  createDefaultEnvFile(envFile) {
    this.log(`创建默认环境文件: ${envFile}`, 'fix');

    const isProduction = envFile.includes('production');
    const defaultEnv = {
      VITE_API_BASE_URL: 'https://api-g.lacs.cc',
      VITE_SOFTWARE_ID: '1',
      VITE_APP_VERSION: '1.0.0',
      VITE_VERSION_CONFIG_FILE: 'version.config.json',
      VITE_BUILD_NUMBER: '1',
      VITE_VERSION_NAME: '1.0.0',
      VITE_RELEASE_DATE: new Date().toISOString().split('T')[0],
      VITE_ENABLE_SIGNATURE: isProduction ? 'true' : 'false',
      VITE_ENABLE_STRICT_USER_AGENT: isProduction ? 'true' : 'false',
      VITE_ENABLE_DEBUG: isProduction ? 'false' : 'true',
      VITE_ENABLE_CONSOLE_LOGS: isProduction ? 'false' : 'true',
      VITE_APP_ENV: isProduction ? 'production' : 'development'
    };

    if (isProduction) {
      defaultEnv.VITE_SIGNATURE_SECRET = 'prod_signature_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } else {
      defaultEnv.VITE_SIGNATURE_SECRET = 'dev_signature_secret';
      defaultEnv.VITE_DEBUG_MODE = 'true';
      defaultEnv.VITE_NODE_ENV = 'development';
    }

    return this.writeEnvFile(envFile, defaultEnv);
  }

  /**
   * 修复环境变量
   */
  fixEnvVariable(envFile, varName) {
    this.log(`修复环境变量: ${envFile} -> ${varName}`, 'fix');

    const env = this.readEnvFile(envFile) || {};
    const defaults = {
      VITE_API_BASE_URL: 'https://api-g.lacs.cc',
      VITE_SOFTWARE_ID: '1',
      VITE_APP_VERSION: '1.0.0'
    };

    if (defaults[varName]) {
      env[varName] = defaults[varName];
      return this.writeEnvFile(envFile, env);
    }

    return false;
  }

  /**
   * 修复API URL
   */
  fixApiUrl(envFile) {
    this.log(`修复API URL: ${envFile}`, 'fix');

    const env = this.readEnvFile(envFile) || {};
    env.VITE_API_BASE_URL = 'https://api-g.lacs.cc';
    return this.writeEnvFile(envFile, env);
  }

  /**
   * 修复软件ID
   */
  fixSoftwareId(envFile) {
    this.log(`修复软件ID: ${envFile}`, 'fix');

    const env = this.readEnvFile(envFile) || {};
    env.VITE_SOFTWARE_ID = '1';
    return this.writeEnvFile(envFile, env);
  }

  /**
   * 修复版本格式
   */
  fixVersionFormat(envFile) {
    this.log(`修复版本格式: ${envFile}`, 'fix');

    const env = this.readEnvFile(envFile) || {};
    env.VITE_APP_VERSION = '1.0.0';
    return this.writeEnvFile(envFile, env);
  }

  /**
   * 同步版本号
   */
  syncVersions(versionSources) {
    this.log('同步版本号...', 'fix');

    // 选择最新的版本号作为标准
    const versions = Object.values(versionSources).filter(v => v && this.isValidVersion(v));
    if (versions.length === 0) {
      this.log('没有找到有效版本号，使用默认版本 1.0.0', 'warning');
      const targetVersion = '1.0.0';
    } else {
      // 简单选择第一个有效版本
      const targetVersion = versions[0];
    }

    const targetVersion = versions.length > 0 ? versions[0] : '1.0.0';
    this.log(`目标版本: ${targetVersion}`, 'info');

    let success = true;

    // 更新 package.json
    const packageJson = this.readJsonFile('package.json');
    if (packageJson) {
      packageJson.version = targetVersion;
      if (!this.writeJsonFile('package.json', packageJson)) {
        success = false;
      }
    }

    // 更新 tauri.conf.json
    const tauriConf = this.readJsonFile('src-tauri/tauri.conf.json');
    if (tauriConf) {
      tauriConf.version = targetVersion;
      if (!this.writeJsonFile('src-tauri/tauri.conf.json', tauriConf)) {
        success = false;
      }
    }

    // 更新 version.config.json
    const versionConfig = this.readJsonFile('version.config.json');
    if (versionConfig) {
      versionConfig.version = targetVersion;
      versionConfig.versionName = targetVersion;
      if (!this.writeJsonFile('version.config.json', versionConfig)) {
        success = false;
      }
    }

    // 更新环境变量文件
    ['.env', '.env.production'].forEach(envFile => {
      if (this.fileExists(envFile)) {
        const env = this.readEnvFile(envFile);
        if (env) {
          env.VITE_APP_VERSION = targetVersion;
          env.VITE_VERSION_NAME = targetVersion;
          if (!this.writeEnvFile(envFile, env)) {
            success = false;
          }
        }
      }
    });

    return success;
  }

  /**
   * 创建默认版本配置
   */
  createDefaultVersionConfig() {
    this.log('创建默认版本配置...', 'fix');

    const defaultConfig = {
      version: '1.0.0',
      buildNumber: 1,
      versionName: '1.0.0',
      releaseDate: new Date().toISOString().split('T')[0],
      description: '统一版本管理配置文件',
      changelog: [
        '实现统一版本管理系统',
        '支持环境变量集中配置',
        '前后端版本号自动同步',
        '版本号校验机制'
      ],
      environments: {
        development: {
          version: '1.0.0-dev',
          enableDebug: true
        },
        production: {
          version: '1.0.0',
          enableDebug: false
        }
      },
      validation: {
        semverPattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?(\\+[a-zA-Z0-9.-]+)?$',
        requiredFields: ['version', 'buildNumber', 'versionName', 'releaseDate']
      }
    };

    return this.writeJsonFile('version.config.json', defaultConfig);
  }

  /**
   * 修复Tauri配置
   */
  fixTauriConfig(field) {
    this.log(`修复Tauri配置字段: ${field}`, 'fix');

    const tauriConf = this.readJsonFile('src-tauri/tauri.conf.json') || {};
    const defaults = {
      productName: '玩机管家',
      version: '1.0.0',
      identifier: 'com.lacs.admt'
    };

    if (defaults[field]) {
      tauriConf[field] = defaults[field];
      return this.writeJsonFile('src-tauri/tauri.conf.json', tauriConf);
    }

    return false;
  }

  /**
   * 修复Tauri版本
   */
  fixTauriVersion() {
    this.log('修复Tauri版本格式', 'fix');

    const tauriConf = this.readJsonFile('src-tauri/tauri.conf.json');
    if (tauriConf) {
      tauriConf.version = '1.0.0';
      return this.writeJsonFile('src-tauri/tauri.conf.json', tauriConf);
    }

    return false;
  }

  /**
   * 运行所有检查
   */
  runAllChecks() {
    this.log('开始版本检测问题诊断...', 'info');

    this.checkEnvironmentConfig();
    this.checkVersionSync();
    this.checkTauriConfig();

    this.log(`发现 ${this.issues.length} 个问题`, this.issues.length > 0 ? 'warning' : 'success');
    
    if (this.issues.length > 0) {
      this.log('问题列表:', 'warning');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
  }

  /**
   * 应用所有修复
   */
  applyAllFixes() {
    if (this.fixes.length === 0) {
      this.log('没有需要修复的问题', 'success');
      return true;
    }

    this.log(`开始应用 ${this.fixes.length} 个修复...`, 'fix');

    let successCount = 0;
    this.fixes.forEach((fix, index) => {
      try {
        if (fix()) {
          successCount++;
        }
      } catch (error) {
        this.log(`修复 ${index + 1} 失败: ${error.message}`, 'error');
      }
    });

    this.log(`修复完成: ${successCount}/${this.fixes.length} 成功`, 'success');
    return successCount === this.fixes.length;
  }

  /**
   * 运行完整修复流程
   */
  run() {
    console.log('🔧 版本检测问题一键修复工具');
    console.log('=====================================');

    this.runAllChecks();

    if (this.issues.length === 0) {
      this.log('恭喜！没有发现版本检测问题', 'success');
      return true;
    }

    console.log('\n是否要自动修复这些问题？(y/N)');
    
    // 在Node.js环境中，我们直接应用修复
    // 在实际使用中，可以添加交互式确认
    const shouldFix = process.argv.includes('--auto-fix') || process.argv.includes('-y');
    
    if (shouldFix) {
      console.log('');
      const success = this.applyAllFixes();
      
      if (success) {
        this.log('所有问题已修复！建议重新编译应用', 'success');
        console.log('\n建议执行以下命令：');
        console.log('  npm run tauri build');
        console.log('  npm run dev  # 测试开发环境');
      } else {
        this.log('部分问题修复失败，请手动检查', 'warning');
      }
      
      return success;
    } else {
      this.log('跳过自动修复。使用 --auto-fix 或 -y 参数自动修复', 'info');
      return false;
    }
  }
}

// 运行修复工具
if (require.main === module) {
  const fixer = new VersionDetectionFixer();
  const success = fixer.run();
  process.exit(success ? 0 : 1);
}

module.exports = VersionDetectionFixer;