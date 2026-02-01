#!/usr/bin/env node

/**
 * 版本检测修复脚本
 * 自动检测和修复版本管理相关的问题
 */

const fs = require('fs');
const path = require('path');
const VersionManager = require('./version-manager.cjs');

class VersionDetectionFixer {
  constructor() {
    this.manager = new VersionManager();
    this.autoFix = process.argv.includes('--auto-fix');
    this.fixes = [];
    this.errors = [];
  }

  // 记录修复
  recordFix(description) {
    this.fixes.push(description);
    console.log(`🔧 ${description}`);
  }

  // 记录错误
  recordError(description) {
    this.errors.push(description);
    console.log(`❌ ${description}`);
  }

  // 修复版本不一致
  fixVersionInconsistency() {
    try {
      const isConsistent = this.manager.validateVersions();
      if (!isConsistent) {
        const config = this.manager.readConfig();
        this.recordFix(`同步版本到 ${config.version}`);
        this.manager.syncVersions(config.version);
      }
    } catch (error) {
      this.recordError(`版本同步失败: ${error.message}`);
    }
  }

  // 修复缺失的生成文件
  fixMissingGeneratedFiles() {
    try {
      const VersionInjector = require('./inject-version.cjs');
      const injector = new VersionInjector();
      
      this.recordFix('重新生成版本常量文件');
      injector.injectVersion();
    } catch (error) {
      this.recordError(`版本文件生成失败: ${error.message}`);
    }
  }

  // 修复权限问题
  fixPermissions() {
    const filesToCheck = [
      'version.config.json',
      'package.json',
      'src-tauri/Cargo.toml',
      'src-tauri/tauri.conf.json'
    ];

    filesToCheck.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        try {
          // 测试读写权限
          const stats = fs.statSync(filePath);
          fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
          console.log(`✅ ${file} 权限正常`);
        } catch (error) {
          this.recordError(`${file} 权限不足: ${error.message}`);
        }
      }
    });
  }

  // 修复配置文件格式
  fixConfigFormat() {
    try {
      const configPath = path.join(__dirname, '..', 'version.config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 检查必需字段
      const requiredFields = ['version', 'buildNumber', 'versionName', 'releaseDate'];
      let hasChanges = false;
      
      requiredFields.forEach(field => {
        if (!config[field]) {
          this.recordError(`配置文件缺少字段: ${field}`);
        }
      });

      // 修复字段类型
      if (typeof config.buildNumber !== 'number') {
        this.recordFix('修复 buildNumber 字段类型');
        config.buildNumber = parseInt(config.buildNumber) || 1;
        hasChanges = true;
      }

      // 写入修复后的配置
      if (hasChanges) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        this.recordFix('更新版本配置文件');
      }
    } catch (error) {
      this.recordError(`配置文件修复失败: ${error.message}`);
    }
  }

  // 验证修复结果
  validateFixes() {
    console.log('\n🔍 验证修复结果...');
    
    try {
      const isConsistent = this.manager.validateVersions();
      if (isConsistent) {
        console.log('✅ 版本一致性验证通过');
        return true;
      } else {
        this.recordError('修复后版本仍不一致');
        return false;
      }
    } catch (error) {
      this.recordError(`验证失败: ${error.message}`);
      return false;
    }
  }

  // 生成修复报告
  generateReport() {
    console.log('\n📊 版本检测修复报告:');

    if (this.fixes.length > 0) {
      console.log('\n🔧 已执行的修复:');
      this.fixes.forEach(fix => console.log(`  • ${fix}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 未能修复的问题:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.fixes.length === 0 && this.errors.length === 0) {
      console.log('✅ 未发现需要修复的问题');
      return true;
    }

    return this.errors.length === 0;
  }

  // 执行自动修复
  async performAutoFix() {
    console.log('🚀 开始自动修复版本检测问题...\n');

    this.fixVersionInconsistency();
    this.fixMissingGeneratedFiles();
    this.fixPermissions();
    this.fixConfigFormat();

    const success = this.validateFixes();
    const reportSuccess = this.generateReport();

    if (success && reportSuccess) {
      console.log('\n✅ 自动修复完成');
    } else {
      console.log('\n⚠️ 部分问题可能需要手动处理');
      if (!this.autoFix) {
        console.log('\n💡 提示: 使用 --auto-fix 参数尝试自动修复更多问题');
      }
    }

    return success && reportSuccess;
  }

  // 执行手动诊断
  performManualDiagnosis() {
    console.log('🔍 执行手动诊断...\n');

    try {
      console.log('1. 检查版本配置:');
      const config = this.manager.readConfig();
      console.log(`   当前版本: ${config.version}`);
      console.log(`   构建号: ${config.buildNumber}`);

      console.log('\n2. 检查版本一致性:');
      const isConsistent = this.manager.validateVersions();

      console.log('\n3. 检查关键文件:');
      const criticalFiles = [
        'version.config.json',
        'package.json',
        'src-tauri/Cargo.toml',
        'src-tauri/tauri.conf.json'
      ];

      criticalFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        const exists = fs.existsSync(filePath);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
      });

      if (!isConsistent) {
        console.log('\n💡 建议执行修复: npm run fix-version-detection:auto');
      }
    } catch (error) {
      console.error('❌ 诊断过程出错:', error.message);
    }
  }
}

// 运行
if (require.main === module) {
  const fixer = new VersionDetectionFixer();
  
  if (fixer.autoFix) {
    fixer.performAutoFix().then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    fixer.performManualDiagnosis();
  }
}

module.exports = VersionDetectionFixer;