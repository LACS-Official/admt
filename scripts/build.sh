#!/bin/bash

# 玩机管家 Tauri 应用构建脚本
# Bash 脚本用于构建和打包应用

echo "🚀 开始构建玩机管家..."

# 检查必要的工具
echo "📋 检查构建环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 检查 Rust
if ! command -v cargo &> /dev/null; then
    echo "❌ 错误: 未找到 Rust/Cargo，请先安装 Rust"
    echo "   安装地址: https://rustup.rs/"
    exit 1
fi

# 检查 Tauri CLI
if ! cargo tauri --version &> /dev/null; then
    echo "⚠️  警告: 未找到 Tauri CLI，正在安装..."
    cargo install tauri-cli
    if [ $? -ne 0 ]; then
        echo "❌ 错误: Tauri CLI 安装失败"
        exit 1
    fi
fi

echo "✅ 构建环境检查完成"

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf dist
rm -rf src-tauri/target

# 安装依赖
echo "📦 安装前端依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 错误: 前端依赖安装失败"
    exit 1
fi

# 构建前端
echo "🔨 构建前端应用..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 错误: 前端构建失败"
    exit 1
fi

# 构建 Tauri 应用
echo "🦀 构建 Tauri 应用..."
cargo tauri build
if [ $? -ne 0 ]; then
    echo "❌ 错误: Tauri 应用构建失败"
    exit 1
fi

# 显示构建结果
echo "🎉 构建完成！"
echo "📁 构建文件位置:"

BUNDLE_PATH="src-tauri/target/release/bundle"
if [ -d "$BUNDLE_PATH" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   macOS App Bundle: $BUNDLE_PATH/macos/"
        echo "   macOS DMG: $BUNDLE_PATH/dmg/"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "   Linux AppImage: $BUNDLE_PATH/appimage/"
        echo "   Linux DEB: $BUNDLE_PATH/deb/"
        echo "   Linux RPM: $BUNDLE_PATH/rpm/"
    fi
    
    # 显示可执行文件
    EXE_PATH="src-tauri/target/release/hout-tauri"
    if [ -f "$EXE_PATH" ]; then
        echo "   可执行文件: $EXE_PATH"
        
        # 显示文件大小
        if command -v stat &> /dev/null; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                FILE_SIZE=$(stat -f%z "$EXE_PATH")
            else
                FILE_SIZE=$(stat -c%s "$EXE_PATH")
            fi
            FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1024 / 1024" | bc)
            echo "   文件大小: ${FILE_SIZE_MB} MB"
        fi
    fi
else
    echo "⚠️  警告: 未找到构建文件，请检查构建日志"
fi

echo ""
echo "💡 提示:"
echo "   - 可执行文件可以直接运行，无需安装"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   - DMG 文件提供 macOS 标准安装体验"
    echo "   - App Bundle 可以直接拖拽到应用程序文件夹"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "   - AppImage 文件可以直接运行，无需安装"
    echo "   - DEB 包适用于 Debian/Ubuntu 系统"
    echo "   - RPM 包适用于 RedHat/CentOS/Fedora 系统"
fi

echo ""
echo "🛡️  安全防护功能已集成:"
echo "   - 禁用开发者工具快捷键"
echo "   - 禁用右键菜单"
echo "   - 开发者工具检测"
echo "   - 文本选择防护"

echo ""
echo "✨ 构建完成！感谢使用 HOUT 工具箱！"
