# ADMT 更新日志 —— v1.3.1 → 当前版本

> 分析范围：提交 `e226c60` (v1.3.1, 2026-02-03) → `HEAD`  
> 版本演进：v1.3.1 → v1.3.2 → v1.3.3 → v1.4.0

---

## 🚀 新增功能

### 🖥️ 核心架构：迁移至 Tauri 桌面应用
- **项目转型**：从纯 Web 应用升级为基于 **Tauri** 的原生桌面应用
- 新增 Rust 后端（`src-tauri/`），承接所有系统级命令执行
- 新增 `src-tauri/src/commands/` 模块化命令目录，按功能拆分：
  - `adb_fastboot.rs` — ADB/Fastboot 命令
  - `app.rs` — 应用管理
  - `config.rs` — 配置读写
  - `device.rs` — 设备操作
  - `download.rs` — 下载管理
  - `fs.rs` — 文件系统
  - `system.rs` — 系统功能

### 📱 屏幕镜像（全新模块）
- 新增 `ScreenMirrorPanel.tsx`（AdbTools 区域）：集成 **scrcpy** 的完整镜像控制界面
- 升级 scrcpy 工具包：`scrcpy-win32-v3.3.1` → **scrcpy-win64 v3.3.3**（64位，文件更新）
- 新增 `AutoMirrorManager.tsx`：设备连接后自动启动镜像管理器
- Rust 侧新增 `src-tauri/src/adb/scrcpy/` 后端模块，管理 scrcpy 进程生命周期

### 🌐 无线调试（全新面板）
- 新增 `WirelessDebuggingPanel.tsx`，支持四种无线调试方式：
  - **USB 转无线**：一键切换 TCP/IP 模式，自动检测设备 IP
  - **独立连接**：输入 IP:Port 直接连接/断开
  - **配对码连接**：Android 11+ 配对码无线配对
  - **二维码配对**：扫码快速配对（含 QR 码生成显示）
- 新增 `wirelessService.ts` 服务层，封装所有无线 ADB 操作
- Rust 侧新增 `src-tauri/src/adb/pairing.rs` 实现底层配对逻辑

### 🤖 AI 聊天助手（全新模块）
- 新增 `AIChatPanel.tsx`：内置 AI 对话面板，支持上下文管理
- 新增 `AIChatWindow.tsx`：浮动 AI 聊天悬浮窗
- 新增 `aiService.ts`：AI 接口服务层，对接大模型 API
- 新增 `aiChatStore.ts`：对话历史状态管理
- 新增 `AISettingsPanel.tsx`：AI 功能配置面板（模型选择、API Key 等）

### 🔍 全局搜索
- 新增 `SearchModal.tsx`：全局快捷搜索弹窗
- 支持功能索引、快速跳转到对应功能面板

### 🌱 Root 专区功能增强
- 新增 `AdvancedSettingsPanel.tsx`：Root 高级设置面板
- 新增 `ModulePanel.tsx`：Magisk/KernelSU 模块管理面板
- 新增 `PatchImagePanel.tsx`：Boot 镜像 Patch 功能（集成 Magisk Patch 流程）
- Rust 侧新增 `src-tauri/src/root/` 模块（`mod.rs` + `patch.rs`）

### 🩺 APK 安全审计
- 新增 `APKAuditorPanel.tsx`：APK 安全审计面板，分析应用权限与风险

### 🖥️ 设备监控
- 新增 `DeviceMonitorCard.tsx`：实时设备性能监控卡片（CPU/内存/温度等）

### 💡 新控制台体系
- 新增 `ConsoleTitleBar.tsx`：控制台专属标题栏
- 新增 `CommandLineWindow.tsx` / `LogsWindow.tsx`：独立窗口化控制台/日志

### 💰 捐赠支持
- 新增 `DonationPanel.tsx`：赞助/捐赠页面

### 🔧 服务层新增
- `controlService.ts`：设备控制命令服务
- `windowService.ts`：多窗口管理服务
- `configStore.ts`：全局配置状态管理

---

## ⚡ 优化改进

### 🔄 架构重构
- **命令中心拆分**：原 `commands.rs` 单文件拆分为 `commands/` 模块目录，结构更清晰
- **设备选择窗口化**：`DeviceSelectionDialog.tsx` 重构为独立弹出窗口 `DeviceSelectionWindow.tsx`
- `MainContent.tsx` 大幅重构，侧边栏导航、页面路由更加清晰
- `appStore.ts` / `deviceStore.ts` 状态管理全面重构，职责更明确

### 🌍 跨平台支持
- ADB 工具目录重组：
  - 旧：`tools/adb/`（仅 Windows）
  - 新：`tools/adb-bin/`（Windows）+ `tools/adb/linux/`（Linux）
- 新增 `scripts/prepare-platform-tools.cjs`：构建时自动选择平台对应工具链
- 新增 Linux 版 scrcpy 压缩包 `scrcpy-linux-x86_64-v3.3.3.tar.gz`

### 🎨 UI / 交互优化
- `TitleBar.tsx`、`AnnouncementBar.tsx`、`StatusBar.tsx` 全面优化样式与交互
- `NoDevicePrompt.tsx` 重设计——无设备时提示引导更友好
- `AppTour.tsx` 新手引导流程优化
- `PrivacyConsentDialog.tsx` 隐私同意对话框布局和交互大幅重构
- `KeySimulationCard.tsx`、`SystemControlCard.tsx` 功能扩展并重新布局
- `DeviceOverviewCard.tsx` / `DevicePropertiesCard.tsx` 信息展示更完善

### 📦 应用管理增强
- `AppManagerPanel.tsx` 重写（+2482 行净增），新增批量操作、排序、过滤等功能
- `AppInstallPanel.tsx` 优化，支持更多安装参数

### 📁 文件管理增强
- `FileManagerPanel.tsx` 大幅扩展（约 +678 行），文件浏览、传输功能更完善

### 🔑 小米解锁优化
- `UnlockService.ts` / `constants.ts` 逻辑重构，兼容性提升

### 🌐 国际化扩展
- `zh-CN.json` 新增约 **793** 行翻译条目
- `en-US.json` 新增约 **1611** 行翻译条目
- `zh-TW.json` 新增约 **459** 行翻译条目
- 全面覆盖新功能（无线调试、AI 聊天、Root 模块等）

### ⚙️ 设置面板完善
- `DisplaySettingsPanel.tsx`、`OtherSettingsPanel.tsx` 选项大幅扩充
- `AboutPanel.tsx` 关于页面重新设计
- `PrivacyManagementPanel.tsx` 隐私管理细化

### 🛠️ 诊断与安全
- `AdbDiagnosticPanel.tsx` 诊断项更新
- `securityConfig.ts` 安全配置项优化

---

## 🗑️ 精简/移除内容

### 组件移除
| 已删除组件 | 说明 |
|---|---|
| `ScreenMirror/MirrorControlCard.tsx` | 合并进 AdbTools 的 `ScreenMirrorPanel` |
| `ScreenMirror/MirrorDisplayCard.tsx` | 同上 |
| `ScreenMirror/ScreenMirrorPanel.tsx` | 原独立屏幕镜像面板已废弃 |
| `OnlineResources/RomDownloadPanel.tsx` | ROM 下载面板移除（约 830 行） |
| `MainContent/DeviceSelectionDialog.tsx` | 替换为 `DeviceSelectionWindow.tsx` |

### 文件/资源移除
| 已删除文件 | 说明 |
|---|---|
| `src-tauri/src/commands.rs` | 拆分为 `commands/` 目录 |
| `src/services/logServiceTest.ts` | 测试文件清理 |
| `test/package/an_11.txt` / `an_16.txt` | 测试数据清理 |
| `test/格式参考.md` | 临时参考文档清理 |
| `public/jhm.webp` | 废弃图片资源 |
| `update.bat` | Windows 批处理升级脚本移除 |
| `.trae/rules/project_rules.md` | 项目规则文档移除 |
| `docs/1.txt` / `docs/2.txt` | 旧文档清理 |
| `scrcpy-win32-v3.3.1/` 目录下各 DLL | 旧版 32 位 scrcpy 组件全部移除 |

### 工具精简
- 移除 32 位 scrcpy 工具（`scrcpy-win32-v3.3.1`），统一使用 64 位版本

---

## 📊 变更统计

| 项目 | 数量 |
|---|---|
| 涉及提交数 | 19 个 |
| 变更文件数 | 191 个 |
| 新增代码行 | ~25,629 行 |
| 删除代码行 | ~17,488 行 |
| 新增组件/文件 | 30+ 个 |
| 删除组件/文件 | 15+ 个 |

---

*生成时间：2026-04-09 | 基于 git diff `e226c60..HEAD`*
