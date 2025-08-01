# 构建脚本

本目录包含项目的构建脚本。

## 📋 脚本说明

### build.ps1
Windows PowerShell构建脚本

**使用方法:**
```powershell
.\scripts\build.ps1
```

### build.sh
Linux/macOS Bash构建脚本

**使用方法:**
```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

## 🔧 功能

- 自动安装依赖
- 构建前端项目
- 构建Tauri应用
- 生成安装包

## 📝 使用说明

### 开发模式
```bash
npm run tauri dev
```

### 生产构建
```bash
npm run build
npm run tauri build
```
