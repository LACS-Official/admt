#!/usr/bin/env node

/**
 * 版本管理工具
 * 统一管理项目中所有文件的版本号
 */

const fs = require('fs');
const path = require('path');

class VersionManager {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.versionConfigPath = path.join(this.rootDir, 'version.config.json');
    this.packageJsonPath = path.join(this.rootDir, 'package.json');
    this.cargoTomlPath = path.join(this.rootDir, 'src-tauri', 'Cargo.toml');
    this.tauriConfPath = path.join(this.rootDir, 'src-tauri', 'tauri.conf.json');
    this.envFiles = [
      path.join(this.rootDir, '.env'),
      path.join(this.rootDir, '.env.production'),
      path.join(this.rootDir, '.env.local')
    ];
  }

  /**
   * 读取版本配置文件
   */
  readVersionConfig() {
    try {
      if (!fs.existsSync(this.versionConfigPath)) {
        throw new Error(`版本配置文件不存在: ${this.versionConfigPath}`);
      }
      
      const content = fs.readFileSync(this.versionConfigPath, 'utf8');
      const config = JSON.parse(content);
      
      // 验证配置格式
      this.validateVersionConfig(config);
      
      return config;
    } catch (error) {
      console.error('❌ 读取版本配置失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 验证版本配置格式
   */
  validateVersionConfig(config) {
    const { validation } = config;
    
    if (!validation) {
      throw new Error('版本配置缺少validation字段');
    }

    // 检查必需字段
    for (const field of validation.requiredFields) {
      if (!config[field]) {
        throw new Error(`版本配置缺少必需字段: ${field}`);
      }
    }

    // 验证版本号格式
    const semverRegex = new RegExp(validation.semverPattern);
    if (!semverRegex.test(config.version)) {
      throw new Error(`版本号格式无效: ${config.version}`);
    }

    console.log('✅ 版本配置验证通过');
  }

  /**
   * 更新package.json版本
   */
  updatePackageJson(version) {
    try {
      if (!fs.existsSync(this.packageJsonPath)) {
        console.warn('⚠️  package.json不存在，跳过更新');
        return;
      }

      const content = fs.readFileSync(this.packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      
      packageJson.version = version;
      
      fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✅ 已更新package.json版本: ${version}`);
    } catch (error) {
      console.error('❌ 更新package.json失败:', error.message);
    }
  }

  /**
   * 更新Cargo.toml版本
   */
  updateCargoToml(version) {
    try {
      if (!fs.existsSync(this.cargoTomlPath)) {
        console.warn('⚠️  Cargo.toml不存在，跳过更新');
        return;
      }

      let content = fs.readFileSync(this.cargoTomlPath, 'utf8');
      
      // 使用正则表达式替换版本号
      content = content.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
      
      fs.writeFileSync(this.cargoTomlPath, content);
      console.log(`✅ 已更新Cargo.toml版本: ${version}`);
    } catch (error) {
      console.error('❌ 更新Cargo.toml失败:', error.message);
    }
  }

  /**
   * 更新tauri.conf.json版本
   */
  updateTauriConf(version) {
    try {
      if (!fs.existsSync(this.tauriConfPath)) {
        console.warn('⚠️  tauri.conf.json不存在，跳过更新');
        return;
      }

      const content = fs.readFileSync(this.tauriConfPath, 'utf8');
      const tauriConf = JSON.parse(content);
      
      tauriConf.version = version;
      
      fs.writeFileSync(this.tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
      console.log(`✅ 已更新tauri.conf.json版本: ${version}`);
    } catch (error) {
      console.error('❌ 更新tauri.conf.json失败:', error.message);
    }
  }

  /**
   * 更新环境变量文件
   */
  updateEnvFiles(config) {
    const { version, buildNumber, versionName, releaseDate } = config;
    
    for (const envFile of this.envFiles) {
      try {
        if (!fs.existsSync(envFile)) {
          console.log(`ℹ️  环境文件不存在，跳过: ${path.basename(envFile)}`);
          continue;
        }

        let content = fs.readFileSync(envFile, 'utf8');
        
        // 更新版本相关的环境变量
        content = this.updateEnvVar(content, 'VITE_APP_VERSION', version);
        content = this.updateEnvVar(content, 'VITE_BUILD_NUMBER', buildNumber.toString());
        content = this.updateEnvVar(content, 'VITE_VERSION_NAME', versionName);
        content = this.updateEnvVar(content, 'VITE_RELEASE_DATE', releaseDate);
        
        fs.writeFileSync(envFile, content);
        console.log(`✅ 已更新环境文件: ${path.basename(envFile)}`);
      } catch (error) {
        console.error(`❌ 更新环境文件失败 ${path.basename(envFile)}:`, error.message);
      }
    }
  }

  /**
   * 更新环境变量
   */
  updateEnvVar(content, key, value) {
    const regex = new RegExp(`^${key}\\s*=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (regex.test(content)) {
      return content.replace(regex, newLine);
    } else {
      // 如果变量不存在，添加到文件末尾
      return content.trim() + '\n' + newLine + '\n';
    }
  }

  /**
   * 同步所有版本号
   */
  syncVersions() {
    console.log('🔄 开始同步版本号...\n');
    
    const config = this.readVersionConfig();
    const { version } = config;
    
    console.log(`📋 目标版本: ${version}`);
    console.log(`📋 构建号: ${config.buildNumber}`);
    console.log(`📋 发布日期: ${config.releaseDate}\n`);
    
    // 更新各个配置文件
    this.updatePackageJson(version);
    this.updateCargoToml(version);
    this.updateTauriConf(version);
    this.updateEnvFiles(config);
    
    console.log('\n✅ 版本同步完成！');
  }

  /**
   * 验证版本一致性
   */
  validateVersionConsistency() {
    console.log('🔍 验证版本一致性...\n');
    
    const config = this.readVersionConfig();
    const targetVersion = config.version;
    const issues = [];
    
    // 检查package.json
    try {
      if (fs.existsSync(this.packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
        if (packageJson.version !== targetVersion) {
          issues.push(`package.json版本不一致: ${packageJson.version} != ${targetVersion}`);
        } else {
          console.log(`✅ package.json版本一致: ${packageJson.version}`);
        }
      }
    } catch (error) {
      issues.push(`package.json读取失败: ${error.message}`);
    }
    
    // 检查Cargo.toml
    try {
      if (fs.existsSync(this.cargoTomlPath)) {
        const cargoContent = fs.readFileSync(this.cargoTomlPath, 'utf8');
        const versionMatch = cargoContent.match(/^version\s*=\s*"([^"]*)"/m);
        if (versionMatch) {
          const cargoVersion = versionMatch[1];
          if (cargoVersion !== targetVersion) {
            issues.push(`Cargo.toml版本不一致: ${cargoVersion} != ${targetVersion}`);
          } else {
            console.log(`✅ Cargo.toml版本一致: ${cargoVersion}`);
          }
        } else {
          issues.push('Cargo.toml中未找到版本信息');
        }
      }
    } catch (error) {
      issues.push(`Cargo.toml读取失败: ${error.message}`);
    }
    
    // 检查tauri.conf.json
    try {
      if (fs.existsSync(this.tauriConfPath)) {
        const tauriConf = JSON.parse(fs.readFileSync(this.tauriConfPath, 'utf8'));
        if (tauriConf.version !== targetVersion) {
          issues.push(`tauri.conf.json版本不一致: ${tauriConf.version} != ${targetVersion}`);
        } else {
          console.log(`✅ tauri.conf.json版本一致: ${tauriConf.version}`);
        }
      }
    } catch (error) {
      issues.push(`tauri.conf.json读取失败: ${error.message}`);
    }
    
    // 检查环境变量文件
    for (const envFile of this.envFiles) {
      try {
        if (fs.existsSync(envFile)) {
          const content = fs.readFileSync(envFile, 'utf8');
          const versionMatch = content.match(/^VITE_APP_VERSION\s*=\s*(.*)$/m);
          if (versionMatch) {
            const envVersion = versionMatch[1].trim();
            if (envVersion !== targetVersion) {
              issues.push(`${path.basename(envFile)}版本不一致: ${envVersion} != ${targetVersion}`);
            } else {
              console.log(`✅ ${path.basename(envFile)}版本一致: ${envVersion}`);
            }
          }
        }
      } catch (error) {
        issues.push(`${path.basename(envFile)}读取失败: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    if (issues.length > 0) {
      console.error('❌ 发现版本不一致问题:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      console.log('\n💡 运行 "npm run sync-version" 来修复版本不一致问题');
      process.exit(1);
    } else {
      console.log('✅ 所有版本号一致！');
    }
    console.log('='.repeat(50));
  }

  /**
   * 更新版本号
   */
  updateVersion(newVersion, options = {}) {
    console.log(`🔄 更新版本号到: ${newVersion}\n`);
    
    // 验证新版本号格式
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    if (!semverRegex.test(newVersion)) {
      console.error('❌ 版本号格式无效，应为 x.y.z 格式');
      process.exit(1);
    }
    
    // 读取当前配置
    const config = this.readVersionConfig();
    
    // 更新配置
    config.version = newVersion;
    config.versionName = newVersion;
    
    if (options.buildNumber) {
      config.buildNumber = parseInt(options.buildNumber);
    } else {
      config.buildNumber += 1; // 自动递增构建号
    }
    
    if (options.releaseDate) {
      config.releaseDate = options.releaseDate;
    } else {
      config.releaseDate = new Date().toISOString().split('T')[0]; // 当前日期
    }
    
    // 保存配置
    fs.writeFileSync(this.versionConfigPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`✅ 已更新版本配置文件`);
    
    // 同步到所有文件
    this.syncVersions();
  }
}

// 命令行接口
function main() {
  const versionManager = new VersionManager();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'sync':
      versionManager.syncVersions();
      break;
      
    case 'validate':
      versionManager.validateVersionConsistency();
      break;
      
    case 'update':
      const newVersion = args[1];
      if (!newVersion) {
        console.error('❌ 请提供新版本号');
        console.log('用法: node version-manager.cjs update <version>');
        process.exit(1);
      }
      
      const options = {};
      for (let i = 2; i < args.length; i += 2) {
        const key = args[i]?.replace('--', '');
        const value = args[i + 1];
        if (key && value) {
          options[key] = value;
        }
      }
      
      versionManager.updateVersion(newVersion, options);
      break;
      
    default:
      console.log('版本管理工具');
      console.log('');
      console.log('用法:');
      console.log('  node version-manager.cjs sync              # 同步版本号到所有文件');
      console.log('  node version-manager.cjs validate         # 验证版本一致性');
      console.log('  node version-manager.cjs update <version> # 更新版本号');
      console.log('');
      console.log('示例:');
      console.log('  node version-manager.cjs update 1.0.1');
      console.log('  node version-manager.cjs update 1.1.0 --buildNumber 10 --releaseDate 2025-01-15');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = VersionManager;