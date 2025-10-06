#!/usr/bin/env node

/**
 * 构建时版本注入脚本
 * 在构建过程中动态注入版本号到各个配置文件
 */

const fs = require('fs');
const path = require('path');

class VersionInjector {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.versionConfigPath = path.join(this.rootDir, 'version.config.json');
  }

  /**
   * 读取版本配置
   */
  readVersionConfig() {
    try {
      if (!fs.existsSync(this.versionConfigPath)) {
        throw new Error(`版本配置文件不存在: ${this.versionConfigPath}`);
      }
      
      const content = fs.readFileSync(this.versionConfigPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ 读取版本配置失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 注入版本号到package.json
   */
  injectPackageJson(config) {
    const packageJsonPath = path.join(this.rootDir, 'package.json');
    
    try {
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);
      
      // 注入版本号
      packageJson.version = config.version;
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✅ 已注入版本号到package.json: ${config.version}`);
    } catch (error) {
      console.error('❌ 注入package.json失败:', error.message);
    }
  }

  /**
   * 注入版本号到Cargo.toml
   */
  injectCargoToml(config) {
    const cargoTomlPath = path.join(this.rootDir, 'src-tauri', 'Cargo.toml');
    
    try {
      let content = fs.readFileSync(cargoTomlPath, 'utf8');
      
      // 更精确地匹配package部分的版本号
      const packageVersionRegex = /(\[package\]\s*\n(?:[^\[]*\n)*?)version\s*=\s*"[^"]*"/;
      
      if (packageVersionRegex.test(content)) {
        // 替换package部分的版本号
        content = content.replace(packageVersionRegex, `$1version = "${config.version}"`);
      } else {
        // 在package部分添加版本号
        content = content.replace(/(\[package\])/, `$1\nversion = "${config.version}"`);
      }
      
      fs.writeFileSync(cargoTomlPath, content);
      console.log(`✅ 已注入版本号到Cargo.toml: ${config.version}`);
    } catch (error) {
      console.error('❌ 注入Cargo.toml失败:', error.message);
    }
  }

  /**
   * 注入版本号到tauri.conf.json
   */
  injectTauriConf(config) {
    const tauriConfPath = path.join(this.rootDir, 'src-tauri', 'tauri.conf.json');
    
    try {
      const content = fs.readFileSync(tauriConfPath, 'utf8');
      const tauriConf = JSON.parse(content);
      
      // 注入版本号
      tauriConf.version = config.version;
      
      fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
      console.log(`✅ 已注入版本号到tauri.conf.json: ${config.version}`);
    } catch (error) {
      console.error('❌ 注入tauri.conf.json失败:', error.message);
    }
  }

  /**
   * 执行版本注入
   */
  inject() {
    console.log('🔄 开始注入版本号...\n');
    
    const config = this.readVersionConfig();
    console.log(`📋 目标版本: ${config.version}`);
    console.log(`📋 构建号: ${config.buildNumber}`);
    console.log(`📋 发布日期: ${config.releaseDate}\n`);
    
    // 注入各个配置文件
    this.injectPackageJson(config);
    this.injectCargoToml(config);
    this.injectTauriConf(config);
    
    console.log('\n✅ 版本注入完成！');
  }
}

// 执行注入
const injector = new VersionInjector();
injector.inject();