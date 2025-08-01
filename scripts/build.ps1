# 玩机管家 Tauri 应用构建脚本
# PowerShell 脚本用于构建和打包应用

Write-Host "🚀 开始构建玩机管家..." -ForegroundColor Green

# 检查必要的工具
Write-Host "📋 检查构建环境..." -ForegroundColor Yellow

# 检查 Node.js
if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 npm
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: 未找到 npm，请先安装 npm" -ForegroundColor Red
    exit 1
}

# 检查 Rust
if (!(Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: 未找到 Rust/Cargo，请先安装 Rust" -ForegroundColor Red
    Write-Host "   安装地址: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# 检查 Tauri CLI
if (!(Get-Command "cargo" -ErrorAction SilentlyContinue) -or !(cargo tauri --version 2>$null)) {
    Write-Host "⚠️  警告: 未找到 Tauri CLI，正在安装..." -ForegroundColor Yellow
    cargo install tauri-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: Tauri CLI 安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 构建环境检查完成" -ForegroundColor Green

# 清理之前的构建
Write-Host "🧹 清理之前的构建文件..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}
if (Test-Path "src-tauri/target") {
    Remove-Item -Recurse -Force "src-tauri/target"
}

# 安装依赖
Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误: 前端依赖安装失败" -ForegroundColor Red
    exit 1
}

# 构建前端
Write-Host "🔨 构建前端应用..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误: 前端构建失败" -ForegroundColor Red
    exit 1
}

# 构建 Tauri 应用
Write-Host "🦀 构建 Tauri 应用..." -ForegroundColor Yellow
cargo tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 错误: Tauri 应用构建失败" -ForegroundColor Red
    exit 1
}

# 显示构建结果
Write-Host "🎉 构建完成！" -ForegroundColor Green
Write-Host "📁 构建文件位置:" -ForegroundColor Cyan

$bundlePath = "src-tauri/target/release/bundle"
if (Test-Path $bundlePath) {
    Write-Host "   Windows Installer (NSIS): $bundlePath/nsis/" -ForegroundColor White
    Write-Host "   Windows MSI: $bundlePath/msi/" -ForegroundColor White
    Write-Host "   可执行文件: src-tauri/target/release/hout-tauri.exe" -ForegroundColor White
    
    # 显示文件大小
    $exePath = "src-tauri/target/release/hout-tauri.exe"
    if (Test-Path $exePath) {
        $fileSize = (Get-Item $exePath).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        Write-Host "   文件大小: $fileSizeMB MB" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  警告: 未找到构建文件，请检查构建日志" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Cyan
Write-Host "   - 可执行文件可以直接运行，无需安装" -ForegroundColor White
Write-Host "   - NSIS 安装包提供完整的安装体验" -ForegroundColor White
Write-Host "   - MSI 安装包适用于企业环境部署" -ForegroundColor White

Write-Host ""
Write-Host "🛡️  安全防护功能已集成:" -ForegroundColor Green
Write-Host "   - 禁用开发者工具快捷键" -ForegroundColor White
Write-Host "   - 禁用右键菜单" -ForegroundColor White
Write-Host "   - 开发者工具检测" -ForegroundColor White
Write-Host "   - 文本选择防护" -ForegroundColor White

Write-Host ""
Write-Host "✨ 构建完成！感谢使用 HOUT 工具箱！" -ForegroundColor Green
