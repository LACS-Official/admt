# 构建脚本说明

本目录包含项目的构建脚本和自动化工具。

## 📋 脚本列表

### build.ps1
Windows PowerShell构建脚本
- 自动安装依赖
- 构建前端项目
- 构建Tauri应用
- 生成安装包

**使用方法:**
```powershell
.\scripts\build.ps1
```

### build.sh
Linux/macOS Bash构建脚本
- 自动安装依赖
- 构建前端项目
- 构建Tauri应用
- 生成安装包

**使用方法:**
```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

## 🔧 脚本功能

### 通用功能
1. **环境检查** - 检查Node.js、Rust、Tauri CLI等依赖
2. **依赖安装** - 自动安装npm依赖
3. **代码检查** - 运行ESLint检查代码质量
4. **前端构建** - 使用Vite构建前端项目
5. **后端构建** - 使用Tauri构建桌面应用
6. **打包生成** - 生成可分发的安装包

### 平台特定功能
- **Windows**: 生成MSI安装包
- **Linux**: 生成AppImage和deb包
- **macOS**: 生成dmg安装包

## 📝 使用说明

### 开发环境构建
```bash
# 开发模式运行
npm run tauri:dev

# 或使用脚本（包含完整检查）
./scripts/build.sh --dev
```

### 生产环境构建
```bash
# 使用npm脚本
npm run build:all

# 或使用构建脚本
./scripts/build.sh --release
```

## ⚠️ 注意事项

1. **权限要求**: 脚本可能需要管理员权限
2. **网络连接**: 首次运行需要下载依赖
3. **磁盘空间**: 确保有足够的磁盘空间用于构建
4. **环境变量**: 某些功能可能需要设置环境变量

## 🐛 故障排除

### 常见问题
1. **权限错误**: 使用管理员权限运行
2. **网络超时**: 检查网络连接或使用代理
3. **依赖冲突**: 清理node_modules后重新安装
4. **构建失败**: 检查Rust和Node.js版本

### 日志查看
构建日志会保存在项目根目录的`build.log`文件中。
