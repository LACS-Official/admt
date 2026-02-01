#!/usr/bin/env node

/**
 * 环境验证脚本
 * 检查构建环境和依赖是否正确
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnvironmentValidator {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.errors = [];
        this.warnings = [];
    }

    // 记录错误
    addError(message) {
        this.errors.push(message);
    }

    // 记录警告
    addWarning(message) {
        this.warnings.push(message);
    }

    // 检查Node.js版本
    checkNodeVersion() {
        try {
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

            if (majorVersion < 16) {
                this.addError(`Node.js版本过低: ${nodeVersion}，建议使用16.x或更高版本`);
            } else {
                console.log(`✅ Node.js版本: ${nodeVersion}`);
            }
        } catch (error) {
            this.addError('无法检测Node.js版本');
        }
    }

    // 检查npm版本
    checkNpmVersion() {
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            const majorVersion = parseInt(npmVersion.split('.')[0]);

            if (majorVersion < 7) {
                this.addWarning(`npm版本较低: ${npmVersion}，建议使用7.x或更高版本`);
            } else {
                console.log(`✅ npm版本: ${npmVersion}`);
            }
        } catch (error) {
            this.addError('无法检测npm版本');
        }
    }

    // 检查Rust环境
    checkRustEnvironment() {
        try {
            const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
            console.log(`✅ Rust版本: ${rustVersion}`);
        } catch (error) {
            this.addError('Rust未安装或不在PATH中');
        }

        try {
            const cargoVersion = execSync('cargo --version', { encoding: 'utf8' }).trim();
            console.log(`✅ Cargo版本: ${cargoVersion}`);
        } catch (error) {
            this.addError('Cargo未安装或不在PATH中');
        }
    }

    // 检查Tauri CLI
    checkTauriCli() {
        try {
            const tauriVersion = execSync('tauri --version', { encoding: 'utf8' }).trim();
            console.log(`✅ Tauri CLI版本: ${tauriVersion}`);
        } catch (error) {
            this.addError('Tauri CLI未安装，请运行: npm install -g @tauri-apps/cli');
        }
    }

    // 检查关键文件
    checkCriticalFiles() {
        const criticalFiles = [
            'package.json',
            'version.config.json',
            'src-tauri/Cargo.toml',
            'src-tauri/tauri.conf.json',
            'vite.config.ts'
        ];

        criticalFiles.forEach(file => {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ ${file} 存在`);
            } else {
                this.addError(`关键文件缺失: ${file}`);
            }
        });
    }

    // 检查node_modules
    checkNodeModules() {
        const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            const packageJsonPath = path.join(nodeModulesPath, '@tauri-apps', 'api');
            if (fs.existsSync(packageJsonPath)) {
                console.log('✅ node_modules 依赖已安装');
            } else {
                this.addError('依赖未完整安装，请运行: npm install');
            }
        } else {
            this.addError('node_modules目录不存在，请先运行: npm install');
        }
    }

    // 检查Tauri依赖
    checkTauriDependencies() {
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            const requiredDeps = [
                '@tauri-apps/api',
                '@tauri-apps/cli'
            ];

            requiredDeps.forEach(dep => {
                if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
                    console.log(`✅ ${dep} 已安装`);
                } else {
                    this.addError(`缺少必需依赖: ${dep}`);
                }
            });
        } catch (error) {
            this.addError('无法读取package.json');
        }
    }

    // 执行所有检查
    async validate() {
        console.log('🔍 开始环境验证...\n');

        this.checkNodeVersion();
        this.checkNpmVersion();
        this.checkRustEnvironment();
        this.checkTauriCli();
        this.checkCriticalFiles();
        this.checkNodeModules();
        this.checkTauriDependencies();

        // 输出结果
        console.log('\n📊 验证结果:');

        if (this.errors.length > 0) {
            console.log('\n❌ 发现错误:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ 警告:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('\n✅ 环境验证通过，可以开始构建!');
        } else if (this.errors.length === 0) {
            console.log('\n⚠️ 环境验证通过，但有警告');
        } else {
            console.log('\n❌ 环境验证失败，请修复错误后重试');
            process.exit(1);
        }
    }
}

// 运行
if (require.main === module) {
    const validator = new EnvironmentValidator();
    validator.validate();
}

module.exports = EnvironmentValidator;