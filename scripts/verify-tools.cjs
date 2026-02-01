#!/usr/bin/env node

/**
 * 工具验证脚本
 * 验证外部工具和依赖是否可用
 */

const { execSync } = require('child_process');
const path = require('path');

class ToolsValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.tools = [
            {
                name: 'ADB',
                command: 'adb version',
                required: true,
                installHint: '请确保ADB工具在PATH中'
            },
            {
                name: 'Fastboot',
                command: 'fastboot --version',
                required: true,
                installHint: '请确保Fastboot工具在PATH中'
            },
            {
                name: 'Git',
                command: 'git --version',
                required: false,
                installHint: '可选，用于版本控制'
            },
            {
                name: 'Node.js',
                command: 'node --version',
                required: true,
                installHint: '请安装Node.js 16.x或更高版本'
            },
            {
                name: 'npm',
                command: 'npm --version',
                required: true,
                installHint: 'npm通常随Node.js一起安装'
            },
            {
                name: 'Cargo',
                command: 'cargo --version',
                required: true,
                installHint: '请安装Rust和Cargo'
            },
            {
                name: 'Tauri CLI',
                command: 'tauri --version',
                required: true,
                installHint: '请运行: npm install -g @tauri-apps/cli'
            }
        ];
    }

    // 检查工具
    checkTool(tool) {
        try {
            const output = execSync(tool.command, { encoding: 'utf8' }).trim();
            console.log(`✅ ${tool.name}: ${output.split('\n')[0]}`);
            return true;
        } catch (error) {
            if (tool.required) {
                this.errors.push(`${tool.name}: ${tool.installHint}`);
                console.log(`❌ ${tool.name}: 未找到或不可用`);
            } else {
                this.warnings.push(`${tool.name}: ${tool.installHint}`);
                console.log(`⚠️ ${tool.name}: 未找到 (可选)`);
            }
            return false;
        }
    }

    // 检查Tauri工具目录
    checkTauriTools() {
        const toolsDir = path.join(__dirname, '..', 'src-tauri', 'tools');

        if (require('fs').existsSync(toolsDir)) {
            const adbDir = path.join(toolsDir, 'adb');
            const scrcpyDir = path.join(toolsDir, 'scrcpy-win32-v3.3.1');

            if (require('fs').existsSync(adbDir)) {
                console.log('✅ ADB工具目录存在');
            } else {
                this.warnings.push('ADB工具目录不存在');
            }

            if (require('fs').existsSync(scrcpyDir)) {
                console.log('✅ Scrcpy工具目录存在');
            } else {
                this.warnings.push('Scrcpy工具目录不存在');
            }
        } else {
            this.warnings.push('Tauri tools目录不存在');
        }
    }

    // 执行所有检查
    async validate() {
        console.log('🔧 开始工具验证...\n');

        // 检查每个工具
        this.tools.forEach(tool => this.checkTool(tool));

        // 检查Tauri工具目录
        this.checkTauriTools();

        // 输出结果
        console.log('\n📊 验证结果:');

        if (this.errors.length > 0) {
            console.log('\n❌ 必需工具缺失:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ 可选工具或资源缺失:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('\n✅ 所有工具验证通过!');
        } else if (this.errors.length === 0) {
            console.log('\n⚠️ 工具验证完成，但有警告');
        } else {
            console.log('\n❌ 工具验证失败，请安装必需工具');
            process.exit(1);
        }
    }
}

// 运行
if (require.main === module) {
    const validator = new ToolsValidator();
    validator.validate();
}

module.exports = ToolsValidator;