#!/usr/bin/env node

/**
 * 统一版本管理工具
 * 从 version.config.json 生成所有其他配置文件
 */

const fs = require('fs');
const path = require('path');

class UnifiedVersionManager {
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
   * 生成 package.json
   */
  generatePackageJson(config) {
    try {
      const { version, frontend } = config;
      
      // 读取现有的 package.json 以保留其他配置
      let packageJson = {};
      if (fs.existsSync(this.packageJsonPath)) {
        const content = fs.readFileSync(this.packageJsonPath, 'utf8');
        packageJson = JSON.parse(content);
      }
      
      // 更新版本相关字段
      packageJson.version = version;
      packageJson.name = frontend.appName;
      packageJson.type = frontend.packageType;
      
      // 更新依赖
      if (frontend.dependencies) {
        if (!packageJson.dependencies) packageJson.dependencies = {};
        Object.assign(packageJson.dependencies, frontend.dependencies);
      }
      
      // 确保有 scripts 字段
      if (!packageJson.scripts) packageJson.scripts = {};
      
      // 添加版本管理相关脚本
      if (config.build && config.build.scripts) {
        Object.assign(packageJson.scripts, config.build.scripts);
      }
      
      fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✅ 已生成 package.json: ${version}`);
    } catch (error) {
      console.error('❌ 生成 package.json 失败:', error.message);
    }
  }

  /**
   * 生成 Cargo.toml
   */
  generateCargoToml(config) {
    try {
      const { version, backend } = config;
      
      let content = `[package]\n`;
      content += `name = "${backend.appName}"\n`;
      content += `version = "${version}"\n`;
      content += `edition = "2021"\n\n`;
      
      content += `[lib]\n`;
      content += `name = "${backend.appName}_lib"\n`;
      content += `crate-type = ["staticlib", "cdylib", "rlib"]\n\n`;
      
      content += `[build-dependencies]\n`;
      content += `tauri-build = { version = "^2.0.0", features = [] }\n\n`;
      
      content += `[dependencies]\n`;
      
      // 添加依赖
      for (const [name, dep] of Object.entries(backend.dependencies)) {
        if (typeof dep === 'string') {
          content += `${name} = "${dep}"\n`;
        } else {
          const features = dep.features ? `, features = [${dep.features.map(f => `"${f}"`).join(', ')}]` : '';
          content += `${name} = { version = "${dep.version}"${features} }\n`;
        }
      }
      
      content += `\n[profile.dev]\n`;
      content += `incremental = true\n\n`;
      
      content += `[profile.release]\n`;
      content += `codegen-units = 1\n`;
      content += `lto = true\n`;
      content += `opt-level = "s"\n`;
      content += `strip = true\n`;
      
      fs.writeFileSync(this.cargoTomlPath, content);
      console.log(`✅ 已生成 Cargo.toml: ${version}`);
    } catch (error) {
      console.error('❌ 生成 Cargo.toml 失败:', error.message);
    }
  }

  /**
   * 生成 tauri.conf.json
   */
  generateTauriConf(config) {
    try {
      const { version, tauri, backend } = config;
      
      const tauriConf = {
        build: backend.build,
        package: {
          version,
          productName: "ADMT",
          identifier: tauri.bundle.identifier
        },
        tauri: {
          allowlist: {
            all: true,
            shell: {
              all: true,
              open: true
            }
          },
          bundle: tauri.bundle,
          security: tauri.security,
          windows: tauri.windows
        }
      };
      
      fs.writeFileSync(this.tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
      console.log(`✅ 已生成 tauri.conf.json: ${version}`);
    } catch (error) {
      console.error('❌ 生成 tauri.conf.json 失败:', error.message);
    }
  }

  /**
   * 生成环境变量文件
   */
  generateEnvFiles(config) {
    const { version, buildNumber, versionName, releaseDate } = config;
    
    for (const envFile of this.envFiles) {
      try {
        let content = '';
        
        // 根据文件类型设置不同的环境变量
        if (envFile.includes('.env.production')) {
          content = `VITE_APP_VERSION=${version}\n`;
          content += `VITE_BUILD_NUMBER=${buildNumber}\n`;
          content += `VITE_VERSION_NAME=${versionName}\n`;
          content += `VITE_RELEASE_DATE=${releaseDate}\n`;
          content += `NODE_ENV=production\n`;
        } else if (envFile.includes('.env.local')) {
          content = `VITE_APP_VERSION=${version}\n`;
          content += `VITE_BUILD_NUMBER=${buildNumber}\n`;
          content += `VITE_VERSION_NAME=${versionName}\n`;
          content += `VITE_RELEASE_DATE=${releaseDate}\n`;
          content += `NODE_ENV=development\n`;
        } else {
          content = `VITE_APP_VERSION=${version}\n`;
          content += `VITE_BUILD_NUMBER=${buildNumber}\n`;
          content += `VITE_VERSION_NAME=${versionName}\n`;
          content += `VITE_RELEASE_DATE=${releaseDate}\n`;
        }
        
        fs.writeFileSync(envFile, content);
        console.log(`✅ 已生成环境文件: ${path.basename(envFile)}`);
      } catch (error) {
        console.error(`❌ 生成环境文件失败 ${path.basename(envFile)}:`, error.message);
      }
    }
  }

  /**
   * 生成所有配置文件
   */
  generateAll() {
    console.log('🔄 开始生成所有配置文件...\n');
    
    const config = this.readVersionConfig();
    const { version } = config;
    
    console.log(`📋 基础版本: ${version}`);
    console.log(`📋 构建号: ${config.buildNumber}`);
    console.log(`📋 版本名称: ${config.versionName}`);
    console.log(`📋 发布日期: ${config.releaseDate}\n`);
    
    // 生成各个配置文件
    this.generatePackageJson(config);
    this.generateCargoToml(config);
    this.generateTauriConf(config);
    this.generateEnvFiles(config);
    
    console.log('\n✅ 所有配置文件生成完成！');
  }

  /**
   * 验证所有配置文件的版本一致性
   */
  validateVersions() {
    console.log('🔍 验证版本一致性...\n');
    
    const config = this.readVersionConfig();
    const expectedVersion = config.version;
    
    const filesToCheck = [
      { path: this.packageJsonPath, name: 'package.json', extractor: (content) => JSON.parse(content).version },
      { path: this.cargoTomlPath, name: 'Cargo.toml', extractor: (content) => {
          const match = content.match(/^version\s*=\s*"([^"]+)"/m);
          return match ? match[1] : null;
        }
      },
      { path: this.tauriConfPath, name: 'tauri.conf.json', extractor: (content) => JSON.parse(content).package.version }
    ];
    
    let allValid = true;
    
    for (const { path, name, extractor } of filesToCheck) {
      try {
        if (!fs.existsSync(path)) {
          console.warn(`⚠️  ${name} 不存在，跳过验证`);
          continue;
        }
        
        const content = fs.readFileSync(path, 'utf8');
        const version = extractor(content);
        
        if (version === expectedVersion) {
          console.log(`✅ ${name}: ${version}`);
        } else {
          console.log(`❌ ${name}: ${version} (期望: ${expectedVersion})`);
          allValid = false;
        }
      } catch (error) {
        console.error(`❌ 验证 ${name} 失败:`, error.message);
        allValid = false;
      }
    }
    
    if (allValid) {
      console.log('\n✅ 所有配置文件版本一致！');
    } else {
      console.log('\n❌ 发现版本不一致，请运行生成命令修复！');
      process.exit(1);
    }
  }
}

// 命令行接口
function main() {
  const manager = new UnifiedVersionManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'generate':
      manager.generateAll();
      break;
    case 'validate':
      manager.validateVersions();
      break;
    default:
      console.log(`
统一版本管理工具

使用方法:
  node scripts/unified-version-manager.cjs generate  # 生成所有配置文件
  node scripts/unified-version-manager.cjs validate  # 验证版本一致性
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = UnifiedVersionManager;