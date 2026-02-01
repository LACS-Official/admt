#!/usr/bin/env node

/**
 * 预构建检查脚本
 * 在构建前执行必要的检查和准备工作
 */

const path = require('path');
const VersionManager = require('./version-manager.cjs');
const EnvironmentValidator = require('./validate-env.cjs');
const ToolsValidator = require('./verify-tools.cjs');
const VersionDetectionTester = require('./test-version-detection.cjs');

class PrebuildChecker {
    constructor() {
        this.manager = new VersionManager();
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

    // 检查版本一致性
    checkVersionConsistency() {
        console.log('🔍 检查版本一致性...');

        try {
            const isConsistent = this.manager.validateVersions();
            if (isConsistent) {
                console.log('✅ 版本一致性检查通过');
            } else {
                this.addError('版本不一致，请运行 "npm run sync-version" 同步版本');
            }
        } catch (error) {
            this.addError(`版本一致性检查失败: ${error.message}`);
        }
    }

    // 检查环境配置
    checkEnvironment() {
        console.log('🔧 检查环境配置...');

        try {
            const validator = new EnvironmentValidator();

            // 模拟验证过程但不实际退出
            const originalExit = process.exit;
            process.exit = () => { };

            validator.validate();

            // 恢复exit函数
            process.exit = originalExit;

            if (validator.errors.length > 0) {
                validator.errors.forEach(error => this.addError(error));
            }
            if (validator.warnings.length > 0) {
                validator.warnings.forEach(warning => this.addWarning(warning));
            }

            if (validator.errors.length === 0) {
                console.log('✅ 环境配置检查通过');
            }
        } catch (error) {
            this.addError(`环境配置检查失败: ${error.message}`);
        }
    }

    // 检查工具可用性
    checkToolsAvailability() {
        console.log('🛠️ 检查工具可用性...');

        try {
            const validator = new ToolsValidator();

            // 检查必需工具
            const requiredTools = validator.tools.filter(tool => tool.required);
            const unavailableTools = requiredTools.filter(tool => {
                try {
                    require('child_process').execSync(tool.command, { stdio: 'ignore' });
                    return false; // 工具可用
                } catch {
                    return true; // 工具不可用
                }
            });

            if (unavailableTools.length > 0) {
                unavailableTools.forEach(tool => {
                    this.addError(`必需工具不可用: ${tool.name} - ${tool.installHint}`);
                });
            } else {
                console.log('✅ 必需工具检查通过');
            }
        } catch (error) {
            this.addError(`工具可用性检查失败: ${error.message}`);
        }
    }

    // 检查源代码完整性
    checkSourceCodeIntegrity() {
        console.log('📁 检查源代码完整性...');

        const fs = require('fs');
        const criticalFiles = [
            'src/App.tsx',
            'src/main.tsx',
            'src-tauri/src/main.rs',
            'src-tauri/src/lib.rs',
            'vite.config.ts',
            'tsconfig.json'
        ];

        criticalFiles.forEach(file => {
            const filePath = path.join(__dirname, '..', file);
            if (!fs.existsSync(filePath)) {
                this.addError(`关键源代码文件缺失: ${file}`);
            }
        });

        if (this.errors.filter(e => e.includes('关键源代码文件')).length === 0) {
            console.log('✅ 源代码完整性检查通过');
        }
    }

    // 检查依赖完整性
    checkDependencies() {
        console.log('📦 检查依赖完整性...');

        const fs = require('fs');
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

        if (!fs.existsSync(nodeModulesPath)) {
            this.addError('node_modules目录不存在，请运行 "npm install"');
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            let missingDeps = 0;
            Object.keys(allDeps).forEach(dep => {
                const depPath = path.join(nodeModulesPath, dep);
                if (!fs.existsSync(depPath)) {
                    missingDeps++;
                }
            });

            if (missingDeps > 0) {
                this.addError(`${missingDeps}个依赖包缺失，请运行 "npm install"`);
            } else {
                console.log('✅ 依赖完整性检查通过');
            }
        } catch (error) {
            this.addError(`依赖检查失败: ${error.message}`);
        }
    }

    // 执行版本注入
    performVersionInjection() {
        console.log('💉 执行版本注入...');

        try {
            const VersionInjector = require('./inject-version.cjs');
            const injector = new VersionInjector();
            injector.injectVersion();
            console.log('✅ 版本注入完成');
        } catch (error) {
            this.addError(`版本注入失败: ${error.message}`);
        }
    }

    // 生成报告
    generateReport() {
        console.log('\n📊 预构建检查报告:');

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 预构建检查全部通过! 可以安全进行构建');
            return true;
        }

        if (this.errors.length > 0) {
            console.log('\n❌ 发现错误 (必须修复):');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ 警告 (建议修复):');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        return this.errors.length === 0;
    }

    // 执行完整检查
    async performFullCheck() {
        console.log('🚀 开始预构建检查...\n');

        this.checkVersionConsistency();
        this.checkEnvironment();
        this.checkToolsAvailability();
        this.checkSourceCodeIntegrity();
        this.checkDependencies();
        this.performVersionInjection();

        const success = this.generateReport();

        if (!success) {
            console.log('\n❌ 预构建检查失败，请修复错误后重试');
            process.exit(1);
        } else {
            console.log('\n✅ 预构建检查完成，可以开始构建');
        }
    }
}

// 运行
if (require.main === module) {
    const checker = new PrebuildChecker();
    checker.performFullCheck();
}

module.exports = PrebuildChecker;