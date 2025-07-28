# 🚀 HOUT 构建指南

本文档介绍如何将 HOUT - 澎湃解锁工具箱构建为可执行文件。

## 📋 构建环境要求

### 必需工具

1. **Node.js** (版本 18 或更高)
   - 下载地址: https://nodejs.org/
   - 验证安装: `node --version`

2. **Rust** (最新稳定版)
   - 下载地址: https://rustup.rs/
   - 验证安装: `cargo --version`

3. **Tauri CLI**
   - 安装命令: `cargo install tauri-cli`
   - 验证安装: `cargo tauri --version`

### Windows 额外要求

1. **Microsoft C++ Build Tools**
   - Visual Studio Installer 中安装 "C++ build tools"
   - 或安装完整的 Visual Studio

2. **WebView2** (通常已预装在 Windows 10/11)
   - 如果缺失，会在首次运行时自动下载

### Linux 额外要求

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Fedora
sudo dnf groupinstall "C Development Tools and Libraries"
sudo dnf install webkit2gtk3-devel openssl-devel curl wget libappindicator-gtk3-devel librsvg2-devel

# Arch Linux
sudo pacman -S --needed webkit2gtk base-devel curl wget openssl appmenu-gtk-module gtk3 libappindicator-gtk3 librsvg libvips
```

### macOS 额外要求

```bash
# 安装 Xcode Command Line Tools
xcode-select --install
```

## 🔨 构建步骤

### 方法一：使用构建脚本（推荐）

#### Windows (PowerShell)
```powershell
# 在项目根目录执行
.\build.ps1
```

#### Linux/macOS (Bash)
```bash
# 在项目根目录执行
./build.sh
```

### 方法二：使用 npm 脚本

```bash
# 安装依赖
npm install

# 构建前端 + Tauri 应用
npm run build:all

# 或者分步构建
npm run build        # 构建前端
npm run tauri:build  # 构建 Tauri 应用
```

### 方法三：手动构建

```bash
# 1. 安装前端依赖
npm install

# 2. 构建前端
npm run build

# 3. 构建 Tauri 应用
cargo tauri build
```

## 📁 构建输出

构建完成后，文件将位于以下位置：

### Windows
- **可执行文件**: `src-tauri/target/release/hout-tauri.exe`
- **NSIS 安装包**: `src-tauri/target/release/bundle/nsis/`
- **MSI 安装包**: `src-tauri/target/release/bundle/msi/`

### Linux
- **可执行文件**: `src-tauri/target/release/hout-tauri`
- **AppImage**: `src-tauri/target/release/bundle/appimage/`
- **DEB 包**: `src-tauri/target/release/bundle/deb/`
- **RPM 包**: `src-tauri/target/release/bundle/rpm/`

### macOS
- **可执行文件**: `src-tauri/target/release/hout-tauri`
- **App Bundle**: `src-tauri/target/release/bundle/macos/`
- **DMG 镜像**: `src-tauri/target/release/bundle/dmg/`

## 🛠️ 构建选项

### 调试构建
```bash
# 构建调试版本（更快，但文件更大）
npm run tauri:build:debug
```

### 清理构建文件
```bash
# 清理所有构建文件
npm run clean
```

### 开发模式
```bash
# 启动开发服务器
npm run tauri:dev
```

## 🔧 自定义构建

### 修改应用信息

编辑 `src-tauri/tauri.conf.json`:

```json
{
  "productName": "您的应用名称",
  "version": "1.0.0",
  "identifier": "com.yourcompany.yourapp"
}
```

### 修改图标

替换 `src-tauri/icons/` 目录中的图标文件：
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `*.png` (Linux 和通用)

### 修改安装包设置

在 `src-tauri/tauri.conf.json` 的 `bundle` 部分：

```json
{
  "bundle": {
    "category": "Utility",
    "shortDescription": "应用简短描述",
    "longDescription": "应用详细描述",
    "windows": {
      "nsis": {
        "languages": ["SimpChinese"],
        "installMode": "perMachine"
      }
    }
  }
}
```

## 🚨 常见问题

### 1. 构建失败：找不到 Rust
```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 2. Windows 构建失败：缺少 C++ 工具
- 安装 Visual Studio Build Tools
- 或安装完整的 Visual Studio Community

### 3. Linux 构建失败：缺少系统依赖
```bash
# 确保安装了所有必需的系统库
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev
```

### 4. 构建文件过大
- 使用 `cargo tauri build --release` 确保是发布版本
- 检查是否包含了不必要的依赖

### 5. 安全防护功能不工作
- 确保在生产构建中启用了安全防护
- 检查浏览器控制台是否有错误信息

## 📦 分发建议

### Windows
- **便携版**: 直接分发 `.exe` 文件
- **安装版**: 使用 NSIS 安装包 (`.exe`)
- **企业版**: 使用 MSI 安装包

### Linux
- **通用**: AppImage 文件，无需安装
- **Debian/Ubuntu**: DEB 包
- **RedHat/Fedora**: RPM 包

### macOS
- **App Store**: 需要额外的代码签名和公证
- **直接分发**: DMG 镜像文件

## 🛡️ 安全注意事项

1. **代码签名**: 生产环境建议对可执行文件进行代码签名
2. **安全扫描**: 构建后进行病毒扫描
3. **完整性验证**: 提供文件哈希值供用户验证

## 📞 获取帮助

如果遇到构建问题：

1. 检查 [Tauri 官方文档](https://tauri.app/v1/guides/building/)
2. 查看项目的 GitHub Issues
3. 确保所有依赖都是最新版本

---

**构建愉快！** 🎉
