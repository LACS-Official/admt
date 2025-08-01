# 玩机管家

一个基于 Tauri 2.0 构建的现代化 Android 设备管理工具，提供设备信息查看、文件管理、ADB 工具、应用管理等功能。

## ✨ 主要特性

### 🔧 核心功能
- **设备管理**: 自动检测和管理连接的 Android 设备
- **文件管理**: 浏览、上传、下载设备文件
- **应用管理**: 安装、卸载、管理 APK 应用
- **ADB 工具**: 集成常用 ADB 命令和工具
- **设备控制**: 重启、关机、进入各种模式
- **屏幕镜像**: 实时查看设备屏幕（基于 scrcpy）
- **专业工具**: 提供各种 Android 开发和调试工具

### 🎨 用户体验
- **现代化界面**: 基于 Fluent UI 的美观界面
- **主题支持**: 支持明暗主题切换
- **响应式设计**: 适配不同屏幕尺寸
- **多语言支持**: 支持中文界面
- **实时状态**: 实时显示设备连接状态

### 🔒 安全特性
- **激活系统**: 完整的软件激活和授权管理
- **版本检查**: 自动检查软件更新
- **安全保护**: 防止逆向工程和调试
- **数据加密**: 本地数据加密存储

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0 或更高版本
- **Rust**: 1.77 或更高版本
- **Tauri CLI**: 2.0 或更高版本
- **ADB**: Android Debug Bridge（自动检测）

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装 Tauri CLI（如果未安装）
npm install -g @tauri-apps/cli@next
```

### 开发模式

```bash
# 启动开发服务器
npm run tauri dev
```

### 构建应用

```bash
# 构建前端
npm run build

# 构建 Tauri 应用
npm run tauri build
```

## 📁 项目结构

```
wanjiguanjia-tauri/
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   ├── services/          # 服务层
│   ├── stores/            # 状态管理
│   ├── types/             # TypeScript类型定义
│   ├── styles/            # 全局样式
│   ├── hooks/             # 自定义React Hooks
│   ├── utils/             # 工具函数
│   └── config/            # 配置文件
├── src-tauri/             # Tauri后端代码
│   ├── src/               # Rust源代码
│   ├── icons/             # 应用图标
│   ├── capabilities/      # Tauri权限配置
│   └── tauri.conf.json    # Tauri配置文件
├── docs/                  # 项目文档
├── scripts/               # 构建脚本
└── tools/                 # 外部工具
```

## 🛠️ 技术栈

### 前端技术
- **React 18**: 用户界面框架
- **TypeScript**: 类型安全的JavaScript
- **Fluent UI**: Microsoft设计系统
- **Zustand**: 轻量级状态管理
- **Vite**: 快速构建工具

### 后端技术
- **Tauri 2.0**: 跨平台应用框架
- **Rust**: 系统级编程语言
- **Tokio**: 异步运行时
- **Serde**: 序列化框架

## 📖 功能说明

### 设备信息
- 显示设备基本信息（型号、版本、序列号等）
- 实时监控设备状态
- 显示设备属性和系统信息

### 文件管理
- 浏览设备文件系统
- 上传文件到设备
- 从设备下载文件
- 文件操作（删除、重命名等）

### 应用管理
- 查看已安装应用列表
- 安装新的APK应用
- 卸载应用
- 批量操作支持

### ADB工具
- 常用ADB命令快捷执行
- 自定义命令执行
- 命令历史记录
- 输出结果显示

### 设备控制
- 设备重启（正常/恢复/引导加载程序）
- 设备关机
- 屏幕截图
- 设备信息刷新

### 屏幕镜像
- 基于scrcpy的实时屏幕镜像
- 支持触摸控制
- 录屏功能
- 质量设置

## 🔧 配置说明

### ADB配置
应用会自动检测系统中的ADB工具，也可以使用内置的ADB工具。

### 设备连接
- 支持USB连接的Android设备
- 需要开启开发者选项和USB调试
- 支持多设备同时连接

### 权限要求
- 文件系统访问权限
- 网络访问权限（用于更新检查）
- 系统命令执行权限

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台应用框架
- [React](https://reactjs.org/) - 用户界面库
- [Fluent UI](https://developer.microsoft.com/en-us/fluentui) - 设计系统
- [scrcpy](https://github.com/Genymobile/scrcpy) - 屏幕镜像工具

---

**HOUT** - 让Android设备管理更简单、更高效！
