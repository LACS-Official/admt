<div align="center">

# 📱 玩机管家 (ADMT - Android Device Management Tool)

**基于 Tauri v2 + React 打造的高性能、现代、跨平台 Android 设备全能管理神器**

🌐 **官方网站**: [https://admt.lacs.cc](https://admt.lacs.cc)

[English](./README.en.md) | 简体中文

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC107.svg?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-000000.svg?logo=rust)](https://www.rust-lang.org/)

<br />

<p align="center">
  <img src="./public/github/bg.png" alt="玩机管家 ADMT 界面与架构背景图" width="100%" />
</p>

</div>

---

## 💡 关于项目与开源宣言

> 💬 **开发者寄语**：
> 过去一年里，玩机管家由 **领创工作室 (LACS Studio)** 团队免费维护与持续打磨，伴随数千名玩机玩家度过了无数个刷机与调试的夜晚。今天，为了感谢所有用户的陪伴，也为了让项目焕发更蓬勃的生命力，我们决定 **将玩机管家 (ADMT) 正式完全开源**！
> 我们坚信“开源不仅是代码的分享，更是美好信念的传递”。希望玩机管家能成为所有 Android 开发者、刷机爱好者与极客们手头最趁手的武器，也诚邀全球开发者与我们一同构建更强大、优雅的玩机生态！

**玩机管家 (ADMT - Android Device Management Tool)** 是一款专为 Android 极客、应用开发者、刷机爱好者及普通机主设计的桌面端全能设备管理平台。项目底层采用 **Rust + Tauri v2** 现代化原生轻量化架构，相比传统 Electron 框架应用，**内存占用降低 80% 以上**，启动速度提升数倍，安装包体积仅 **15MB - 25MB** 左右。

无论是无线 ADB 免线连接、Scrcpy 低延迟高帧率投屏反控、免 Root 系统预装应用卸载冻结，还是 Fastboot 镜像一键烧录、Boot 镜像智能修补 (Magisk/KernelSU/APatch)、在线固件与资源下载，亦或是内置的大模型 AI 智能设备诊断助手，玩机管家都为你提供了一站式、可视化的全方位桌面级解决方案。

---

## 🏗️ 架构全景与技术选型

玩机管家采用了模块化、组件化的响应式架构设计，前端使用 **React 18 + Fluent UI** 打造现代桌面级交互，原生通信层通过 **Rust / Tauri v2 IPC Command** 与系统底层 API、ADB 及 Scrcpy 原生二进制组件紧密配合。

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 玩机管家 (ADMT) 交互层                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ 首页设备监控 │ │  ADB工具箱   │ │  系统调控    │ │ Fastboot刷机 │ │ Root修补中心 │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ 极客拓展工具 │ │ 在线资源中心 │ │ AI诊断控制台 │ │ 全局偏好设置 │ │ 导航与状态栏 │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                Zustand 状态管理 & i18n 多语言                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                             Tauri v2 IPC / Bridge (Rust 核心)                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│        ADB Daemon / Fastboot CLI        │          Scrcpy Engine          │   Local Storage   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 全量组件与功能点深度百科大辞典

本章对玩机管家中包含的所有 UI 组件及业务功能模块进行逐一拆解介绍，涵盖每个组件的核心职责、操作路径与底层交互逻辑，并配有对应的实际功能截图。

---

### 1. 首页概览模块 (`Home` & `DeviceInfo` Components)

首页模块是系统的控制中枢与设备仪表盘，负责设备状态呈现、实时资源监控与常用快捷控制。

#### 1.1 `HomePage.tsx` (首页主容器组件)
- **文件路径**：`src/components/Home/HomePage.tsx`
- **核心职责**：整合设备信息卡片、监控折线图、电源控制与离线提示。
- **功能点详解**：
  - **动态视图调度**：根据 `useDeviceStore` 监听到的设备连接状态，自动在“已连接设备仪表盘”与“无设备引导界面 (`NoDevicePrompt`)”之间平滑切换。
  - **多设备状态轮询**：定时触发设备属性与硬件监控数据的刷新逻辑。

#### 1.2 `DeviceOverviewCard.tsx` (设备总览卡片)
- **文件路径**：`src/components/DeviceInfo/DeviceOverviewCard.tsx`
- **核心职责**：展现连接设备的系统标识、品牌型号与基础硬件属性。
- **功能点详解**：
  - **商业名称识别**：解析 `ro.product.marketname` 或 `ro.product.model`，精准识别如 "Xiaomi 14 Pro"、"Samsung Galaxy S24" 等市场名称。
  - **工程代号显示**：提取 `ro.product.device`（如 `shennong`、`taro`），方便刷机玩家确认 ROM 适配代号。
  - **Android 版本与 SDK API 映射**：实时输出 Android 系统大版本（如 Android 14）及对应的 API Level（如 API 34）。
  - **构建版本号 (Build ID)**：显示当前刷入固件的具体 Compile Build 编号。

![设备基本信息](./public/github/homepage/device_info_basic.png)

#### 1.3 `DeviceMonitorCard.tsx` (硬件资源实时监控卡片)
- **文件路径**：`src/components/DeviceInfo/DeviceMonitorCard.tsx`
- **核心职责**：毫秒级图形化监控设备 CPU、内存、存储与网络。
- **功能点详解**：
  - **CPU 多核使用率折线图**：绘制 CPU 整体负荷曲线，支持调整采样周期（0.5 秒 - 5 秒）。
  - **RAM 动态内存分配图**：可视化展示 Total RAM、Used RAM、Free RAM 与 Cached 缓存区。
  - **实时网络吞吐速率**：监测当前 Wi-Fi/蜂窝网络的实时上传/下载速度。

![硬件实时监控](./public/github/homepage/hardware_cpu_monitor.png)

#### 1.4 `DeviceRebootCard.tsx` (电源与重启管理卡片)
- **文件路径**：`src/components/Home/DeviceRebootCard.tsx`
- **核心职责**：提供各种 Boot 模式间的一键快捷重启切换与基础服务辅助。
- **功能点详解**：
  - **重启模式支持**：一键重启系统 (`System`)、引导模式 (`Bootloader`)、恢复模式 (`Recovery`)、Fastboot 及高通深刷 `9008`。
  - **辅助快捷指令**：重启 ADB 服务、结束 ADB 服务、安装设备驱动、USB 3.0 修复与设备管理器快捷打开。

![设备重启模式与辅助功能](./public/github/homepage/device_reboot_and_tools.png)

#### 1.5 `NoDevicePrompt.tsx` (无设备连接引导组件)
- **文件路径**：`src/components/Home/NoDevicePrompt.tsx`
- **核心职责**：设备未连接时提供驱动诊断与排查步骤。
- **功能点详解**：
  - **连接状态感知**：未接入设备时展示轮询扫描状态、无线调试连接入口、文档中心及视频教程引导。

![无设备连接引导界面](./public/github/homepage/no_device_prompt.png)

---

### 2. 全能 ADB 工具箱模块 (`AdbTools` Components)

ADB 工具箱包含应用管理、安装审计、屏幕投屏、无线调试与文件管理等核心功能。

#### 2.1 `AppManagerPanel.tsx` (应用集中管理面板)
- **文件路径**：`src/components/AdbTools/AppManagerPanel.tsx`
- **核心职责**：全方位查看、过滤、冻结、卸载与管理 Android 手机应用。
- **功能点详解**：
  - **多维度分类**：支持查看所有应用、系统应用、用户应用及已冻结应用。
  - **免 Root 冻结/停用 (`pm disable-user`)**：一键冻结系统预装广告应用与后台服务。
  - **批量操作支持**：批量卸载、冻结、解冻、强行停止及导出 APK 包。

![应用集中管理面板](./public/github/syspage/app_manager_panel.png)

#### 2.2 `AppInstallPanel.tsx` (应用安装控制面板)
- **文件路径**：`src/components/AdbTools/AppInstallPanel.tsx`
- **核心职责**：处理单文件或批量 APK/APKS/XAPK 的安装部署与历史记录查看。
- **功能点详解**：
  - **拖拽与历史记录**：支持拖拽文件直接安装、覆盖已有应用、历史安装记录展示与失败问题分析。

![应用安装与历史记录](./public/github/syspage/app_installer_panel.png)

#### 2.3 `ScreenMirrorPanel.tsx` (Scrcpy 高清屏幕镜像控制台)
- **文件路径**：`src/components/AdbTools/ScreenMirrorPanel.tsx`
- **核心职责**：提供低延迟高帧率投屏与电脑反控手机能力。
- **功能点详解**：
  - **投屏参数配置**：支持分辨率、h264/h265 编码、8Mbps~64Mbps 码率及 60fps 帧率设定，支持音频传输与息屏操控。

![Scrcpy 投屏设置](./public/github/syspage/screen_mirror_settings.png)

  - **投屏画面独立窗口**：一键启动 Scrcpy 独立原生投屏控制窗口。

![Scrcpy 实时投屏独立画质窗口](./public/github/syspage/scrcpy_screen_mirror_window.png)

#### 2.4 `FileManagerPanel.tsx` (可视化文件管理器)
- **文件路径**：`src/components/AdbTools/FileManagerPanel.tsx`
- **核心职责**：双栏/树形浏览手机文件系统并提供双向文件传输。
- **功能点详解**：
  - **文件传输与路径切换**：内部存储 (`/sdcard`) 与 Root 根目录切换、快捷目录导航（DCIM, Download, Pictures）、双向拖拽传输。

![可视化文件管理器](./public/github/syspage/file_manager_panel.png)

---

### 3. 系统调控与物理按键模拟模块 (`DeviceControl` Components)

#### 3.1 `KeySimulationCard.tsx` & `SystemControlCard.tsx` (按键与显示参数控制组件)
- **文件路径**：`src/components/DeviceControl/KeySimulationCard.tsx` & `SystemControlCard.tsx`
- **核心职责**：向手机发送音量/电源/菜单等物理按键事件，调节系统 DPI 与显示分辨率。
- **功能点详解**：
  - **物理按键快捷模拟**：上一曲/下一曲、音量+/-、静音、电源键、菜单、旋转方向及快捷开关。
  - **显示参数调节**：屏幕分辨率调整 (1080x2400)、显示密度 (DPI: 440) 与动画速度倍率修改。

![设备控制与显示参数调控](./public/github/syspage/device_control_and_display.png)

---

### 4. Fastboot 与刷机专区模块 (`FlashZone` & `Tools` Components)

针对 Bootloader 解锁、镜像烧录、线刷及分区管理的专业刷机专区。

#### 4.1 `ImageFlashCard.tsx` (镜像分区烧录组件)
- **文件路径**：`src/components/Tools/ImageFlashCard.tsx`
- **核心职责**：选择 Boot/Recovery/VBMeta 分区镜像一键向设备烧录。
- **功能点详解**：
  - **AB 分区模式选择**：支持同时烧录 A/B 分区、仅 A 分区、仅 B 分区或直接烧录当前选择分区。

![镜像烧录面板](./public/github/flashpage/image_flash_panel.png)

#### 4.2 `RomManagerCard.tsx` & `XiaomiFlashCard.tsx` (ROM 包线刷与解包管理组件)
- **文件路径**：`src/components/FlashZone/RomManagerCard.tsx` & `src/components/Tools/XiaomiFlashCard.tsx`
- **核心职责**：调度官方线刷包脚本与提取 `payload.bin`。
- **功能点详解**：
  - **线刷脚本调度**：选择包含 `flash_all*.bat` 的目录，支持线刷清数据、线刷保留数据及线刷并回锁。

![线刷包刷机工具](./public/github/flashpage/fastboot_rom_flasher.png)

  - **Payload.bin 固件解包**：一键提取 OTA/ROM 固件包中的 `boot.img` 或 `init_boot.img`。

![Payload.bin 固件解包提取工具](./public/github/flashpage/payload_dumper_panel.png)

#### 4.3 `XiaomiUnlockCard.tsx` (解锁工具组件)
- **文件路径**：`src/components/Tools/XiaomiUnlockCard.tsx`
- **核心职责**：启动品牌解锁工具及检测设备 BL 锁定方式。

![解锁工具面板](./public/github/flashpage/unlock_tools_panel.png)

---

### 7. 在线资源与下载中心模块 (`OnlineResources` Components)

提供常用玩机工具链、驱动与固件资源的云端检索与下载。

#### 7.1 `OnlineResourcesPanel.tsx` & `ResourceDetailModalSimple.tsx` (软件工具云端市场)
- **文件路径**：`src/components/OnlineResources/OnlineResourcesPanel.tsx`
- **核心职责**：在线展示与下载各种驱动、解包脚本、Root 工具及框架。
- **功能点详解**：
  - **软件商店主页**：按分类检索包含 miflash_unlock、小米堆叠后台、安卓驱动、MiBypass 等资源。

![软件云端工具商店](./public/github/onlinepage/online_software_store_panel.png)

  - **资源详情与下载**：弹窗展示资源版本、支持系统、运行入口与直接下载按钮。

![资源详情与下载弹窗](./public/github/onlinepage/online_resource_detail_modal.png)

---

### 8. AI 诊断助手与高级控制台模块 (`Console` & `Debug` Components)

结合大模型 AI 诊断与全功能终端控制台，解决调试与刷机报错问题。

#### 8.1 `AIChatPanel.tsx` (AI 智能设备诊断助手)
- **文件路径**：`src/components/Console/AIChatPanel.tsx`
- **核心职责**：利用大模型分析设备报错并提供排查指南。
- **功能点详解**：
  - **诊断场景选择**：Logcat 崩溃诊断、ANR 无响应分析、管家运行诊断与刷机日志排查，智能代理自动生成修补指令。

![AI 智能设备诊断助手窗口](./public/github/others/ai_diagnostic_assistant_window.png)

#### 8.2 `CommandExecutePanel.tsx` (交互式终端控制台)
- **文件路径**：`src/components/Others/CommandExecutePanel.tsx`
- **核心职责**：直接执行 ADB/Fastboot 原生指令。
- **功能点详解**：
  - **命令行独立窗口**：选择目标设备、输入 ADB/Fastboot 指令并查看实时终端回显。

![命令行控制台独立窗口](./public/github/others/command_line_window.png)

  - **预设常用命令宏**：一键选择 Scene 激活、`getprop` 属性拉取及 `dumpsys battery` 电池查看指令。

![预设常用命令宏选择弹窗](./public/github/others/preset_command_macros_modal.png)

#### 8.3 `LogsPanel.tsx` (应用与系统日志查看器)
- **文件路径**：`src/components/Others/LogsPanel.tsx`
- **核心职责**：分类查看应用内部日志及 Logcat 数据。

![应用实时日志查看器](./public/github/others/app_logs_viewer_window.png)

---

### 9. 偏好设置与自定义模块 (`Settings` Components)

配置系统路径、主题外观、AI 接口与系统行为。

#### 9.1 `DeviceSettingsPanel.tsx` (设备与监控设置)
- **文件路径**：`src/components/Settings/DeviceSettingsPanel.tsx`
- **核心职责**：配置设备扫描周期 (2000ms)、连接后自动开启投屏以及硬件监控抓取频率 (1000ms)。

![设备连接与硬件监控参数设置](./public/github/setpage/device_settings_panel.png)

#### 9.2 `DisplaySettingsPanel.tsx` (显示与主题配置)
- **文件路径**：`src/components/Settings/DisplaySettingsPanel.tsx`
- **核心职责**：选择浅色/深色主题、Fluent UI Accent 强调色调、内容密度及轮播图速度。

![显示与主题配置](./public/github/setpage/display_settings_panel.png)

#### 9.3 `AISettingsPanel.tsx` (AI 大模型接口配置)
- **文件路径**：`src/components/Settings/AISettingsPanel.tsx`
- **核心职责**：选择大模型 Provider（OpenAI/DeepSeek/Gemini 等）、填写 API Key 与 Base URL，测试 API 连通性。

![AI 大模型助手设置](./public/github/setpage/ai_settings_panel.png)

#### 9.4 `BasicSettingsPanel.tsx` & `AboutPanel.tsx` (基础与关于设置)
- **文件路径**：`src/components/Settings/OtherSettingsPanel.tsx` & `AboutPanel.tsx`
- **核心职责**：界面语言选择 (简体中文)、系统托盘与开机自启开关、版本号查看与检查在线更新。

![基础设置](./public/github/setpage/basic_settings_panel.png)

![关于页面与更新检测](./public/github/setpage/about_settings_panel.png)

---

### 10. 全局导航与启动流模块 (`Bar` & `StartupFlow` Components)

#### 10.1 全局快捷搜索弹窗 (`Ctrl + K`)
- **核心职责**：通过全局快捷键快速搜索功能或视图板块。

![全局快捷搜索弹窗 (Ctrl+K)](./public/github/others/global_search_modal.png)

#### 10.2 首次启动隐私合规弹窗 (`StartupFlow`)
- **核心职责**：首次进入应用时的隐私政策声明与引导。

![首次启动隐私合规与协议签署弹窗](./public/github/others/startup_privacy_consent_dialog.png)

---

## 📖 玩机管家核心组件与文件对照百科字典表

以下是前端组件文件与后端底层命令的对应全景索引表：

| 组件相对路径 | 对应 UI 功能视图 | 主要功能点描述 | 底层命令/调用 Bridge API |
| :--- | :--- | :--- | :--- |
| `src/components/Home/HomePage.tsx` | 首页仪表盘 | 连接状态轮询、视图容器控制 | `useDeviceStore`, `useAppStore` |
| `src/components/Home/DeviceOverviewCard.tsx` | 设备概览卡片 | 品牌型号、Android 版本、Build ID | `getprop ro.product.marketname` |
| `src/components/Home/DeviceMonitorCard.tsx` | 实时监控卡片 | CPU/RAM/存储/网络实时绘图 | `dumpsys cpuinfo`, `cat /proc/meminfo` |
| `src/components/Home/DeviceRebootCard.tsx` | 电源管理卡片 | 重启 Bootloader/Recovery/EDL | `adb reboot [mode]` |
| `src/components/AdbTools/AppManagerPanel.tsx` | 应用管理面板 | 应用分类、免 Root 冻结、卸载、提取 APK | `pm list packages`, `pm disable-user` |
| `src/components/AdbTools/AppInstallPanel.tsx` | 应用安装面板 | 拖拽安装、 Flag 参数配置 (`-r`, `-d`, `-g`) | `adb install [flags] [path]` |
| `src/components/AdbTools/APKAuditorPanel.tsx` | APK 安全审计 | V1/V2/V3 签名校验、风险权限扫描 | `tauri::command parse_apk` |
| `src/components/AdbTools/ScreenMirrorPanel.tsx` | Scrcpy 屏幕投屏 | 画质/码率/帧率控制、控制映射、息屏投屏 | `scrcpy [cli_args]` |
| `src/components/AdbTools/WirelessDebuggingPanel.tsx` | 无线 ADB 面板 | 配对码配对、扫码配对、mDNS 发现 | `adb pair [ip:port] [code]` |
| `src/components/AdbTools/FileManagerPanel.tsx` | 目录文件管理器 | 双向拖拽传输、Root 目录浏览、chmod 编辑 | `adb shell ls`, `adb push`, `adb pull` |
| `src/components/DeviceControl/KeySimulationCard.tsx` | 按键模拟卡片 | 发送音量/电源/Home/Back 按键事件 | `input keyevent [keycode]` |
| `src/components/DeviceControl/SystemControlCard.tsx` | 系统调控卡片 | DPI 调节、沉浸模式、动画速度修改 | `wm density`, `wm size`, `settings put` |
| `src/components/FlashZone/ImageFlashCard.tsx` | 镜像烧录卡片 | 烧录 Boot/Recovery/VBMeta 分区 | `fastboot flash [partition] [file]` |
| `src/components/FlashZone/RomManagerCard.tsx` | ROM 包管理卡片 | Payload.bin 解包、自动化线刷脚本调度 | `fastboot flashall`, `payload-dumper` |
| `src/components/Root/PatchImagePanel.tsx` | Boot 镜像修补 | Magisk/KernelSU/APatch 镜像自动修补 | `boot_patch.sh` |
| `src/components/Root/ModulePanel.tsx` | Root 模块管理 | 模块启用/禁用/删除、ZIP 模块刷入 | `magisk --install-module` |
| `src/components/OnlineResources/DownloadManagerPanel.tsx` | 下载管理器 | 多线程断点续传、下载后自动解压与安装 | `tauri::command download_file` |
| `src/components/Console/AIChatPanel.tsx` | AI 智能诊断 | 捕获报错与 Logcat，调用 LLM 提供诊断 | OpenAI/Claude/Gemini/DeepSeek APIs |
| `src/components/Console/CommandExecutePanel.tsx` | 命令行控制台 | 原生 ADB/Fastboot 命令直接敲击与宏 | `execute_adb_command` |
| `src/components/Console/LogsPanel.tsx` | 实时 Logcat 抓取 | 实时日志分级、正则匹配与文本导出 | `adb logcat [filters]` |
| `src/components/Settings/AISettingsPanel.tsx` | AI 参数配置 | API Key 加密存储、Endpoint 修改 | `configStore.saveAiConfig` |

---

## ⚡ Rust 原生 Backend 命令与 IPC 映射表

Tauri 原生层使用 Rust 实现了高效的 IPC 通信指令，下表列出了核心 Rust 后端 Command 与前端 API 的映射关系：

| Rust 命令名称 (Tauri Command) | 前端调用 Service 函数 | 核心功能与参数说明 |
| :--- | :--- | :--- |
| `get_devices` | `deviceService.getDevices()` | 获取当前通过 USB 或无线连接的所有 ADB 设备列表 |
| `get_device_info` | `deviceService.getDeviceInfo(serial)` | 抓取指定设备的品牌、型号、Android 版本及 SDK API 级别 |
| `execute_adb_command` | `adbService.execute(args)` | 执行任意自定义 ADB 指令并返回 stdout/stderr 输出 |
| `execute_fastboot_command` | `fastbootService.execute(args)` | 执行 Fastboot 刷机指令 |
| `start_scrcpy` | `scrcpyService.startMirror(config)` | 启动 Scrcpy 进程并传入画质、帧率、编码及音频参数 |
| `stop_scrcpy` | `scrcpyService.stopMirror()` | 终止当前正在运行的 Scrcpy 屏幕镜像进程 |
| `list_packages` | `appService.listPackages(filter)` | 拉取设备应用列表（用户应用/系统应用/冻结应用） |
| `install_apk` | `appService.installApk(path, flags)` | 传入本地 APK 路径与安装标志 (`-r`, `-d`, `-g`) 部署应用 |
| `uninstall_package` | `appService.uninstall(package, keepData)` | 卸载指定包名的应用 |
| `freeze_package` | `appService.setPackageEnabled(package, false)` | 免 Root 冻结指定系统或第三方应用 |
| `pull_file` | `fileService.pullFile(remotePath, localPath)` | 从手机下载文件/目录至电脑本地 |
| `push_file` | `fileService.pushFile(localPath, remotePath)` | 从电脑上传文件/目录至手机指定位置 |
| `patch_boot_image` | `rootService.patchBoot(bootPath, tool)` | 自动将 Boot 镜像推送到手机调用 Magisk/KSU 修补并拉回 |
| `flash_partition` | `fastbootService.flashPartition(part, image)` | 在 Fastboot 模式下烧录指定分区镜像 |
| `toggle_thermal` | `geekService.setThermalService(enabled)` | 免 Root 开关系统温控服务 |
| `fetch_online_resources` | `resourceService.fetchIndex()` | 请求云端最新工具链与 ROM 资源索引清单 |

---

## 🛠️ 深度进阶刷机与救砖排查指南

#### 1. Boot 镜像提取与 Root 修补全流程
1. 使用玩机管家的“在线资源中心”下载与手机当前版本匹配的官方线刷包或全量卡刷包。
2. 在“Fastboot 刷机专区 -> ROM 包管理”中选择下载好的 ZIP/Payload 固件，提取 `boot.img`（Android 13+ 选 `init_boot.img`）。
3. 切换至“Root 权限专区 -> Boot 修补”，选择解包出来的 Boot 镜像文件及对应的 Root 框架（Magisk 或 KernelSU）。
4. 点击“一键修补”，待提示成功后，点击“在 Fastboot 模式下刷入当前修补镜像”。
5. 手机自动重启进入系统后安装 Root 管理 App 即可获取完整 Root 权限。

#### 2. Fastboot 常见错误代码及解决方案
- **`FAILED (remote: 'Partition doesn't exist')`**：
  - 原因：当前设备不支持直接烧录该名称的分区（例如某些设备没有单独的 `recovery` 分区，而是集成在 `boot` 分区中）。
  - 解决：核对刷入分区类型，确认是否需要刷入 `boot` 或 `init_boot` 分区。
- **`FAILED (remote: 'is verification disabled?')`**：
  - 原因：刷入第三方 Boot 或 ROM 时，系统校验保护未被禁用。
  - 解决：使用玩机管家的 `ImageFlashCard` 烧录 `vbmeta.img`，并确保勾选“禁用防变动校验 (--disable-verity --disable-verification)”。

---

## ⚖️ 性能优势与横向对比

| 评估维度 / 指标     | 传统 Electron 刷机软件 | 纯命令行工具 (ADB CLI) | **玩机管家 (ADMT - Tauri v2)**   |
| :------------------ | :--------------------- | :--------------------- | :------------------------------- |
| **内存占用 (RAM)**  | 约 300MB - 800MB       | 约 10MB                | **约 40MB - 90MB** ⚡            |
| **安装包体积**      | 约 120MB - 250MB       | 约 5MB - 10MB          | **约 15MB - 25MB** 📦            |
| **冷启动速度**      | 3 ~ 8 秒               | 即时                   | **< 0.8 秒** 🚀                  |
| **GUI 可视化**      | ✅ 有                  | ❌ 无 (纯 CLI)         | **✅ 现代 Fluent UI 极光界面**   |
| **无线 ADB / 投屏** | 复杂配置或收费软件     | 手动敲复杂命令         | **✅ 一键自动连接/低延迟高帧率** |
| **AI 错误诊断**     | ❌ 无                  | ❌ 无                  | **✅ 内置 10+ 大模型智能 AI 助手** |
| **跨平台支持**      | Windows / macOS        | Windows / Mac / Linux  | **✅ Windows / macOS / Linux**   |

---

## 🛠️ 技术栈全景

- **前端交互层**：
  - **UI 框架**：React 18, TypeScript 5.6
  - **组件库**：Microsoft Fluent UI React Components v9
  - **动画引擎**：Framer Motion (流畅平滑卡片过渡与弹窗动画)
  - **状态管理**：Zustand (轻量响应式全局状态树)
  - **国际化 (i18n)**：i18next (支持 简体中文、繁体中文、English)
  - **构建构建工具**：Vite 5
- **后端原生层**：
  - **原生核心**：Rust 1.75+
  - **桌面应用框架**：Tauri v2 (利用系统原生 WebView2 / WebKit 渲染 Engine)
  - **进程间通信 (IPC)**：Tauri Command, State & Event Emitter
  - **系统级集成**：原生系统托盘 (Tray Menu)、全局快捷键 (Global Shortcut)、文件系统对话框
- **嵌入原生二进制工具链**：
  - **ADB Platform Tools** (Google 官方最新 Android Debug Bridge)
  - **Scrcpy Engine** (Genymobile 开源高清低延迟屏幕镜像核心)
  - **Fastboot CLI** (Android Bootloader 刷机通信工具)

---

## 🚀 开发者编译与运行指南

### 1. 准备开发环境

在开始编译构建玩机管家之前，请确保您的开发机器中已就绪以下基础环境：

1. **Node.js**：v18.0.0 或更高版本（推荐 LTS 版本）
2. **Rust 环境**：安装 `rustc` 及 `cargo`（推荐使用 `rustup` 更新至最新稳定版）
3. **C++ 编译工具链**：
   - **Windows**：安装 Visual Studio 2022 并勾选 "使用 C++ 的桌面开发" 负载。
   - **macOS**：安装 Xcode Command Line Tools (`xcode-select --install`)。
   - **Linux**：安装 `build-essential`、`webkit2gtk` 等 Tauri v2 必需依赖。

### 2. 获取代码与安装依赖

```bash
# 1. 克隆官方 GitHub 仓库
git clone https://github.com/LACS-Official/admt.git

# 2. 进入项目根目录
cd admt

# 3. 安装前端依赖包
npm install
```

### 3. 配置环境变量（可选）

复制项目根目录下的 `.env.example` 为 `.env` 文件，并根据需要修改本地 API 或调试参数：

```bash
cp .env.example .env
```

### 4. 启动开发模式

运行以下命令，启动 Vite 开发服务器并由 Tauri 自动拉起 Rust 原生桌面窗口：

```bash
npm run tauri:dev
```

在开发模式下，前端代码支持 HMR 热更新，修改 `src/` 中的 React 代码可实时在桌面窗口中刷新。

### 5. 构建生产发布包

如需构建对应操作系统平台的生产可执行安装包（如 Windows `.msi` / `.exe`，macOS `.dmg` / `.app`），请运行：

```bash
npm run tauri:build
```

构建完成后，可执行安装包产物将自动生成并存放在：
`src-tauri/target/release/bundle/` 目录中。

---

## 📁 项目文件目录结构说明

```text
admt/
├── .github/                # GitHub Issue 模板与 CONTRIBUTING 贡献指南
├── public/                 # 静态资源文件 (图标、宣传背景图等)
├── src/                    # React 前端代码主目录
│   ├── assets/             # 前端图标、音频与样式资源
│   ├── components/         # 业务组件库 (按功能维度拆分)
│   │   ├── AdbTools/       # ADB 工具箱面板 (应用管理、投屏、无线ADB、文件管理)
│   │   ├── Bar/            # 顶部标题栏、底部状态栏与公告栏组件
│   │   ├── Common/         # 全局通用组件 (版本检查器、自动化投屏等)
│   │   ├── Console/        # AI 对话窗口、命令行终端与 Logcat 窗口
│   │   ├── Debug/          # 内部调试与诊断面板
│   │   ├── DeviceControl/  # 物理按键模拟与系统调控卡片
│   │   ├── DeviceInfo/     # 首页设备概览、监控与安全卡片
│   │   ├── ExtendedFeatures/# 拓展极客工具箱组件
│   │   ├── FlashZone/      # Fastboot 刷机与镜像烧录面板
│   │   ├── Home/           # 首页总览页面与离线引导卡片
│   │   ├── MainContent/    # 主导航侧边栏与页面调度容器
│   │   ├── OnlineResources/# 在线资源中心与多线程下载管理器
│   │   ├── Others/         # 命令执行与系统日志面板
│   │   ├── Root/           # Boot 镜像修补与模块管理面板
│   │   ├── Security/       # 安全警告与隐私保护组件
│   │   ├── Settings/       # 偏好设置面板 (外观、AI、硬件路径、关于)
│   │   ├── StartupFlow/    # 启动协议与过渡动画组件
│   │   ├── Tools/          # 小米线刷/解锁专项工具组件
│   │   └── UnlockZone/     # 解锁专区面板
│   ├── config/             # 系统与 API 接口配置文件
│   ├── i18n/               # 多语言国际化翻译字典 (zh-CN, zh-TW, en-US)
│   ├── services/           # 原生 Tauri Command 封装与 Bridge 通信服务
│   ├── stores/             # Zustand 响应式全局状态树
│   ├── styles/             # 全局 CSS / HSL 样式与主题变量
│   ├── types/              # TypeScript 全局接口类型定义
│   ├── utils/              # 通用工具函数库
│   ├── App.tsx             # 应用入口根组件
│   └── main.tsx            # Vite 渲染进程入口
├── src-tauri/              # Rust / Tauri 原生后端目录
│   ├── src/                # Rust 源代码 (ADB 原生通信、Scrcpy 调度、系统 API)
│   ├── tools/              # 嵌入的平台二进制工具链 (ADB, Scrcpy, Fastboot 等)
│   ├── Cargo.toml          # Rust 依赖包管理文件
│   └── tauri.conf.json     # Tauri v2 应用配置文件 (权限、窗口配置、打包元数据)
├── .env.example            # 环境变量示例文件
├── eslint.config.js        # ESLint 代码规范配置文件
├── package.json            # Node.js 项目配置文件及 NPM 脚本
├── tsconfig.json           # TypeScript 编译选项配置文件
├── vite.config.ts          # Vite 打包工具配置文件
├── LICENSE                 # 开源许可证文件 (Apache 2.0)
├── README.md               # 简体中文官方说明文档
└── README.en.md            # 英文官方说明文档
```

---

## ❓ 常见问题与故障排查 (FAQ)

#### Q1: 插入手机后，玩机管家显示“未连接设备”怎么办？
1. 请确认手机已开启“开发者选项”，并打开了“USB 调试”开关。
2. 检查手机屏幕上是否弹出了“允许这台电脑进行 USB 调试”的授权提示框，请勾选“始终允许”并点击确认。
3. 请更换一条数据线或插到电脑后置 USB 接口。若为 Windows 系统，可使用玩机管家内置的 **USB 驱动修复助手** 重新安装通用 ADB 驱动。

#### Q2: 开启 Scrcpy 屏幕镜像投屏时黑屏或提示连接失败？
1. 部分手机品牌（如小米/红米/vivo）需要在开发者选项中额外开启 **“USB 调试（安全设置）- 允许通过 USB 模拟点击/输入”** 选项。
2. 确保没有其他占用 ADB 端口或投屏端口的软件（如其他手机助手、安卓模拟器）在后台运行。
3. 可尝试在“设置 - 界面设置”中将 Scrcpy 编码格式切换为 `H.264`，并降低投屏码率。

#### Q3: 如何向内置的 AI 诊断助手配置大模型 Key？
1. 进入玩机管家左侧导航栏的 **“设置” -> “AI 设置”**。
2. 选择你习惯使用的 Provider（如 OpenAI、DeepSeek、Zhipu 等）。
3. 填入你的 API Key，若使用中转代理可修改 Endpoint 地址。
4. 点击“测试连通性”，提示成功后即可在 AI 对话框中进行智能问答与报错诊断。

---

## 🤝 参与贡献与社区

我们极其欢迎全球开发者、刷机极客与设计爱好者加入玩机管家 (ADMT) 的开源建设！

您可以以各种形式参与项目贡献：
- 🐛 **提交 Bug 报告**：在 GitHub Issues 中详细描述您遇到的故障与设备型号。
- 💡 **提出新功能提案 (Feature Request)**：告诉我们您希望在下一个版本中加入哪些趁手的功能。
- 📝 **完善文档与翻译**：帮助补充更完善的组件说明、翻译更多语言版本。
- 🔀 **提交 Pull Request**：直接克隆仓库，修补 Bug 或实现新的功能组件后提交 PR。

提交代码前，请参阅 [.github/CONTRIBUTING.md](./.github/CONTRIBUTING.md) 了解详细的贡献规范与代码风格要求。

---

## 📄 开源许可证与声明

本项目基于 [Apache License 2.0](./LICENSE) 协议开源。

- 您可以自由地使用、修改、分发本项目代码，但须保留原作者的版权与开源协议声明。
- 版权所有 © 2020-2026 **领创工作室 (LACS Studio)** 及玩机管家项目全体贡献者。

---

<div align="center">

**如果玩机管家 (ADMT) 对你的刷机、开发或设备管理有所帮助，欢迎在 GitHub 上为我们点一个 ⭐️ Star！**

**感谢所有极客与开发者的支持与认可！**

</div>
