#!/usr/bin/env node

/**
 * 统一版本管理器
 * 负责前端、后端版本的统一管理和同步
 */

const fs = require('fs');
const path = require('path');
const semver = require('semver');

class VersionManager {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.configPath = path.join(this.projectRoot, 'version.config.json');
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.cargoTomlPath = path.join(this.projectRoot, 'src-tauri', 'Cargo.toml');
    this.tauriConfigPath = path.join(this.projectRoot, 'src-tauri', 'tauri.conf.json');
  }

  // 读取版本配置
  readConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('❌ 读取版本配置文件失败:', error.message);
      process.exit(1);
    }
  }

  // 写入版本配置
  writeConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      console.log('✅ 版本配置已更新');
    } catch (error) {
      console.error('❌ 写入版本配置文件失败:', error.message);
      process.exit(1);
    }
  }

  // 更新package.json版本
  updatePackageJson(version) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      packageJson.version = version;
      fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
      console.log('✅ package.json 版本已更新');
    } catch (error) {
      console.error('❌ 更新package.json失败:', error.message);
    }
  }

  // 更新Cargo.toml版本
  updateCargoToml(version) {
    try {
      let cargoContent = fs.readFileSync(this.cargoTomlPath, 'utf8');
      cargoContent = cargoContent.replace(/version\s*=\s*"[^"]*"/, `version = "${version}"`);
      fs.writeFileSync(this.cargoTomlPath, cargoContent, 'utf8');
      console.log('✅ Cargo.toml 版本已更新');
    } catch (error) {
      console.error('❌ 更新Cargo.toml失败:', error.message);
    }
  }

  // 更新tauri.conf.json版本
  updateTauriConfig(version) {
    try {
      const tauriConfig = JSON.parse(fs.readFileSync(this.tauriConfigPath, 'utf8'));
      tauriConfig.version = version;
      fs.writeFileSync(this.tauriConfigPath, JSON.stringify(tauriConfig, null, 2), 'utf8');
      console.log('✅ tauri.conf.json 版本已更新');
    } catch (error) {
      console.error('❌ 更新tauri.conf.json失败:', error.message);
    }
  }

  // 同步所有版本
  syncVersions(version) {
    console.log(`🔄 同步版本到 ${version}...`);
    
    // 更新配置文件
    const config = this.readConfig();
    config.version = version;
    config.versionName = version;
    this.writeConfig(config);

    this.updatePackageJson(version);
    this.updateCargoToml(version);
    this.updateTauriConfig(version);
    
    console.log('🎉 版本同步完成');
  }

  // 验证版本一致性
  validateVersions() {
    console.log('🔍 验证版本一致性...');
    
    const config = this.readConfig();
    const configVersion = config.version;
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      const cargoContent = fs.readFileSync(this.cargoTomlPath, 'utf8');
      const tauriConfig = JSON.parse(fs.readFileSync(this.tauriConfigPath, 'utf8'));
      
      const cargoVersion = cargoContent.match(/version\s*=\s*"([^"]*)"/)?.[1];
      const tauriVersion = tauriConfig.version;
      
      const versions = [
        { name: 'config.json', version: configVersion },
        { name: 'package.json', version: packageJson.version },
        { name: 'Cargo.toml', version: cargoVersion },
        { name: 'tauri.conf.json', version: tauriVersion }
      ];
      
      console.log('\n📊 版本状态:');
      versions.forEach(({ name, version }) => {
        const status = version === configVersion ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${version || '未设置'}`);
      });
      
      const allConsistent = versions.every(v => v.version === configVersion);
      
      if (allConsistent) {
        console.log('\n✅ 所有版本保持一致');
        return true;
      } else {
        console.log('\n❌ 版本不一致，需要同步');
        return false;
      }
    } catch (error) {
      console.error('❌ 验证失败:', error.message);
      return false;
    }
  }

  // 主函数
  async main() {
    const command = process.argv[2];
    const version = process.argv[3];

    switch (command) {
      case 'sync':
        if (!version) {
          console.error('❌ 请提供版本号: node version-manager.js sync <version>');
          process.exit(1);
        }
        if (!semver.valid(version)) {
          console.error('❌ 无效的版本号，请使用语义化版本格式');
          process.exit(1);
        }
        this.syncVersions(version);
        break;
        
      case 'validate':
        this.validateVersions();
        break;
        
      case 'current':
        const config = this.readConfig();
        console.log(`📦 当前版本: ${config.version}`);
        break;
        
      default:
        console.log(`
🔧 版本管理器用法:

  node version-manager.js sync <version>    - 同步所有文件到指定版本
  node version-manager.js validate           - 验证版本一致性
  node version-manager.js current            - 显示当前版本

示例:
  node version-manager.js sync 1.2.1
  node version-manager.js validate
  node version-manager.js current
        `);
    }
  }
}

// 运行
if (require.main === module) {
  const manager = new VersionManager();
  manager.main().catch(console.error);
}

module.exports = VersionManager;