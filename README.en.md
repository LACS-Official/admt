<div align="center">

# 📱 Android Device Management Tool (ADMT / 玩机管家)

**A High-Performance, Modern, Cross-Platform Android Device Management Suite Built with Tauri v2 + React**

🌐 **Official Website**: [https://admt.lacs.cc](https://admt.lacs.cc)

English | [简体中文](./README.md)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC107.svg?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-000000.svg?logo=rust)](https://www.rust-lang.org/)

<br />

<p align="center">
  <img src="./public/github/bg.png" alt="ADMT Project Interface and Architecture Preview" width="100%" />
</p>

</div>

---

## 💡 About & Open Source Statement

> 💬 **A Message from the Developers**:
> Over the past year, ADMT has been fully maintained and continuously crafted for free by the **LACS Studio** team, empowering thousands of Android power users, developers, and enthusiasts through countless nights of flashing and debugging. Today, to express our deepest gratitude to our user community and to give this project even greater vitality, we are thrilled to announce that **ADMT (Android Device Management Tool) is officially 100% open source**!
> We firmly believe that "Open source is not just code sharing, but passing along a shared passion." We hope ADMT serves as the ultimate desktop toolkit for all Android power users, developers, and enthusiasts worldwide!

**ADMT (Android Device Management Tool)** is a modern desktop management suite engineered for Android power users, app developers, ROM flashers, and everyday device owners. Built on the **Rust + Tauri v2** native lightweight architecture, ADMT uses **over 80% less memory** than traditional Electron apps, launches in sub-seconds, and maintains an installer footprint of only **~15MB - 25MB**.

Whether you need wireless ADB debugging without cables, Scrcpy low-latency high-FPS screen mirroring and reverse control, bloatware uninstallation and freezing without Root, Fastboot image flashing, smart Boot patching (Magisk/KernelSU/APatch), online firmware resources, or integrated Large-Language-Model (LLM) AI diagnostics, ADMT provides a comprehensive, visual, desktop-grade solution.

---

## 🏗️ Architecture & Component Overview

ADMT adopts a modular, componentized responsive frontend architecture powered by **React 18 + Fluent UI** for modern desktop ergonomics, interacting with native APIs, ADB daemons, and Scrcpy binaries via **Rust / Tauri v2 IPC Commands**.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                ADMT Interactive App Layer                                │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Home Monitor │ │ ADB Toolkit  │ │ System Ctrl  │ │ FastbootZone │ │ Root Patching│ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ Geek Tools   │ │ Online Hub   │ │ AI Diagnostic│ │ Preferences  │ │ Status/NavBar│ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                           Zustand State Management & i18n                                │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                        Tauri v2 IPC / Bridge (Rust Native Core)                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│        ADB Daemon / Fastboot CLI        │          Scrcpy Engine          │   Local Storage   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Comprehensive Component & Feature Breakdown

This section provides an in-depth breakdown of every UI component and feature module within ADMT, detailing core responsibilities, operational paths, and underlying logic alongside feature screenshots.

---

### 1. Home & Device Monitoring Module (`Home` & `DeviceInfo` Components)

The Home module serves as the central data hub and real-time dashboard, responsible for device status presentation, telemetry, and power controls.

#### 1.1 `HomePage.tsx` (Home Dashboard Container)
- **File Path**: `src/components/Home/HomePage.tsx`
- **Core Responsibility**: Integrates device cards, telemetry charts, reboot controls, and fallback prompts.

#### 1.2 `DeviceOverviewCard.tsx` (Device Overview Card)
- **File Path**: `src/components/DeviceInfo/DeviceOverviewCard.tsx`
- **Core Responsibility**: Displays system identification, brand model, and basic hardware parameters.

![Device Basic Information](./public/github/homepage/device_info_basic.png)

#### 1.3 `DeviceMonitorCard.tsx` (Real-Time Hardware Telemetry Card)
- **File Path**: `src/components/DeviceInfo/DeviceMonitorCard.tsx`
- **Core Responsibility**: High-frequency chart monitoring of CPU, RAM, Storage, and Network I/O.

![Hardware Telemetry](./public/github/homepage/hardware_cpu_monitor.png)

#### 1.4 `DeviceRebootCard.tsx` (Power & Reboot Management Card)
- **File Path**: `src/components/Home/DeviceRebootCard.tsx`
- **Core Responsibility**: Provides one-click reboot shortcuts into various boot modes.

![Device Reboot Modes](./public/github/homepage/device_reboot_and_tools.png)

#### 1.5 `NoDevicePrompt.tsx` (Offline Connection Guidance)
- **File Path**: `src/components/Home/NoDevicePrompt.tsx`
- **Core Responsibility**: Provides driver diagnostics and connection setup steps when no device is detected.

![No Device Connection Prompt](./public/github/homepage/no_device_prompt.png)

---

### 2. Ultimate ADB Toolkit Module (`AdbTools` Components)

The ADB Toolkit contains application management, installation auditing, screen mirroring, wireless debugging, and visual file management.

#### 2.1 `AppManagerPanel.tsx` (Application Manager Panel)
- **File Path**: `src/components/AdbTools/AppManagerPanel.tsx`
- **Core Responsibility**: Full-featured viewing, filtering, freezing, uninstallation, and permission inspection.

![App Manager Panel](./public/github/syspage/app_manager_panel.png)

#### 2.2 `AppInstallPanel.tsx` (Application Installer Panel)
- **File Path**: `src/components/AdbTools/AppInstallPanel.tsx`
- **Core Responsibility**: Single or batch deployment of APK, APKS, and XAPK files.

![App Installer & History](./public/github/syspage/app_installer_panel.png)

#### 2.3 `ScreenMirrorPanel.tsx` (Scrcpy Screen Mirroring Console)
- **File Path**: `src/components/AdbTools/ScreenMirrorPanel.tsx`
- **Core Responsibility**: High-frame-rate low-latency screen mirroring and reverse control.

![Scrcpy Mirroring Settings](./public/github/syspage/screen_mirror_settings.png)

![Scrcpy Mirroring Standalone Window](./public/github/syspage/scrcpy_screen_mirror_window.png)

#### 2.4 `FileManagerPanel.tsx` (Visual File Manager)
- **File Path**: `src/components/AdbTools/FileManagerPanel.tsx`
- **Core Responsibility**: Dual-pane file system explorer with bidirectional transfers.

![Visual File Manager](./public/github/syspage/file_manager_panel.png)

---

### 3. System Control & Key Simulation Module (`DeviceControl` Components)

#### 3.1 `KeySimulationCard.tsx` & `SystemControlCard.tsx` (Hardware Key & Display Controls)
- **File Path**: `src/components/DeviceControl/KeySimulationCard.tsx` & `SystemControlCard.tsx`
- **Core Responsibility**: Dispatches key events and modifies display DPI/resolution.

![Device Control & Display Tuning](./public/github/syspage/device_control_and_display.png)

---

### 4. Fastboot & Flashing Zone Module (`FlashZone` & `Tools` Components)

Dedicated panel for Bootloader unlocking, partition image flashing, vendor tools, and A/B slot management.

#### 4.1 `ImageFlashCard.tsx` (Image Flashing Panel)
- **File Path**: `src/components/Tools/ImageFlashCard.tsx`
- **Core Responsibility**: Selects Boot/Recovery/VBMeta partition images to flash to device.

![Image Flashing Panel](./public/github/flashpage/image_flash_panel.png)

#### 4.2 `RomManagerCard.tsx` & `XiaomiFlashCard.tsx` (ROM Flasher & Payload Dumper)
- **File Path**: `src/components/FlashZone/RomManagerCard.tsx` & `src/components/Tools/XiaomiFlashCard.tsx`
- **Core Responsibility**: Fastboot ROM flashing scripts runner and payload.bin extractor.

![Fastboot ROM Flasher](./public/github/flashpage/fastboot_rom_flasher.png)

![Payload.bin Extractor](./public/github/flashpage/payload_dumper_panel.png)

#### 4.3 `XiaomiUnlockCard.tsx` (Vendor Unlock Assistant)
- **File Path**: `src/components/Tools/XiaomiUnlockCard.tsx`
- **Core Responsibility**: Launches vendor unlock binaries and verifies BL lock status.

![Unlock Tools Panel](./public/github/flashpage/unlock_tools_panel.png)

---

### 7. Online Resources & Download Center Module (`OnlineResources` Components)

#### 7.1 `OnlineResourcesPanel.tsx` & `ResourceDetailModalSimple.tsx` (Cloud Tool Hub)
- **File Path**: `src/components/OnlineResources/OnlineResourcesPanel.tsx`
- **Core Responsibility**: Displays online tools, drivers, and recovery binaries.

![Online Software Store](./public/github/onlinepage/online_software_store_panel.png)

![Resource Detail Modal](./public/github/onlinepage/online_resource_detail_modal.png)

---

### 8. AI Diagnostic Assistant & Console Module (`Console` & `Debug` Components)

#### 8.1 `AIChatPanel.tsx` (AI Smart Diagnostic Assistant)
- **File Path**: `src/components/Console/AIChatPanel.tsx`
- **Core Responsibility**: Analyzes device errors and provides guided troubleshooting steps using LLMs.

![AI Diagnostic Assistant Window](./public/github/others/ai_diagnostic_assistant_window.png)

#### 8.2 `CommandExecutePanel.tsx` (Interactive Terminal Console)
- **File Path**: `src/components/Others/CommandExecutePanel.tsx`
- **Core Responsibility**: Direct execution of native ADB/Fastboot commands.

![Command Line Console Window](./public/github/others/command_line_window.png)

![Preset Command Macros Modal](./public/github/others/preset_command_macros_modal.png)

#### 8.3 `LogsPanel.tsx` (App & Logcat Log Viewer)
- **File Path**: `src/components/Others/LogsPanel.tsx`
- **Core Responsibility**: Filters and displays app logs and Logcat streams.

![App Logs Viewer Window](./public/github/others/app_logs_viewer_window.png)

---

### 9. Preferences & Global Settings Module (`Settings` Components)

#### 9.1 `DeviceSettingsPanel.tsx` (Hardware & Communication)
- **File Path**: `src/components/Settings/DeviceSettingsPanel.tsx`
- **Core Responsibility**: Configures device scanning interval (2000ms), auto-mirroring, and polling rates.

![Device & Telemetry Settings](./public/github/setpage/device_settings_panel.png)

#### 9.2 `DisplaySettingsPanel.tsx` (Appearance & Themes)
- **File Path**: `src/components/Settings/DisplaySettingsPanel.tsx`
- **Core Responsibility**: Theme selection (Light/Dark/System), accent palette, and carousel speeds.

![Display & Theme Settings](./public/github/setpage/display_settings_panel.png)

#### 9.3 `AISettingsPanel.tsx` (AI Provider Configuration)
- **File Path**: `src/components/Settings/AISettingsPanel.tsx`
- **Core Responsibility**: Configures LLM Providers (OpenAI/DeepSeek/Gemini), API Keys, Base URLs, and connection testing.

![AI Settings Panel](./public/github/setpage/ai_settings_panel.png)

#### 9.4 `BasicSettingsPanel.tsx` & `AboutPanel.tsx` (Basic & About Settings)
- **File Path**: `src/components/Settings/OtherSettingsPanel.tsx` & `AboutPanel.tsx`
- **Core Responsibility**: Language selection, system tray toggles, auto-start, and version update checks.

![Basic Settings](./public/github/setpage/basic_settings_panel.png)

![About Settings & Update Check](./public/github/setpage/about_settings_panel.png)

---

### 10. Navigation & Status Bar Module (`Bar` & `StartupFlow` Components)

#### 10.1 Global Quick Search Modal (`Ctrl + K`)
- **Core Responsibility**: Global shortcut for quick navigation across views.

![Global Search Modal (Ctrl+K)](./public/github/others/global_search_modal.png)

#### 10.2 First-Launch Privacy Onboarding (`StartupFlow`)
- **Core Responsibility**: Displays privacy onboarding and service agreement on first launch.

![Startup Privacy Consent Dialog](./public/github/others/startup_privacy_consent_dialog.png)

---

## 📖 Component File Dictionary & Index Table

The following table provides a complete index of frontend component files mapped to backend bridge APIs:

| Relative Component Path | UI View Target | Core Feature Summary | Bridge API / Native Commands |
| :--- | :--- | :--- | :--- |
| `src/components/Home/HomePage.tsx` | Home Dashboard | Connection status polling, view scheduler | `useDeviceStore`, `useAppStore` |
| `src/components/Home/DeviceOverviewCard.tsx` | Device Overview Card | Commercial model, Android version, Build ID | `getprop ro.product.marketname` |
| `src/components/Home/DeviceMonitorCard.tsx` | Real-time Telemetry | CPU/RAM/Storage/Network charting | `dumpsys cpuinfo`, `cat /proc/meminfo` |
| `src/components/Home/DeviceRebootCard.tsx` | Power Controls | Reboot to Bootloader/Recovery/EDL | `adb reboot [mode]` |
| `src/components/AdbTools/AppManagerPanel.tsx` | App Manager | App categories, bloatware freeze, pull APK | `pm list packages`, `pm disable-user` |
| `src/components/AdbTools/AppInstallPanel.tsx` | App Installer | Drag & drop, install flags (`-r`, `-d`, `-g`) | `adb install [flags] [path]` |
| `src/components/AdbTools/APKAuditorPanel.tsx` | APK Safety Audit | V1/V2/V3 cert check, risk permissions scan | `tauri::command parse_apk` |
| `src/components/AdbTools/ScreenMirrorPanel.tsx` | Scrcpy Mirroring | Resolution/bitrate/FPS control, input mapping | `scrcpy [cli_args]` |
| `src/components/AdbTools/WirelessDebuggingPanel.tsx` | Wireless ADB | Pairing code, QR code, mDNS discovery | `adb pair [ip:port] [code]` |
| `src/components/AdbTools/FileManagerPanel.tsx` | Visual File Manager | Bidirectional transfers, Root access, chmod | `adb shell ls`, `adb push`, `adb pull` |
| `src/components/DeviceControl/KeySimulationCard.tsx` | Key Simulation | Send Volume/Power/Home/Back events | `input keyevent [keycode]` |
| `src/components/DeviceControl/SystemControlCard.tsx` | System Tuning | DPI adjustment, immersive mode, animations | `wm density`, `wm size`, `settings put` |
| `src/components/FlashZone/ImageFlashCard.tsx` | Image Flashing | Flash Boot/Recovery/VBMeta partitions | `fastboot flash [partition] [file]` |
| `src/components/FlashZone/RomManagerCard.tsx` | ROM Manager | Payload.bin extraction, flashing script runner | `fastboot flashall`, `payload-dumper` |
| `src/components/Root/PatchImagePanel.tsx` | Boot Patching | Magisk/KernelSU/APatch boot image patching | `boot_patch.sh` |
| `src/components/Root/ModulePanel.tsx` | Root Module Manager | Enable/disable/remove modules, zip install | `magisk --install-module` |
| `src/components/OnlineResources/DownloadManagerPanel.tsx` | Download Manager | Multi-threaded downloads, auto extract/install | `tauri::command download_file` |
| `src/components/Console/AIChatPanel.tsx` | AI Diagnostics | Captures error logs, queries LLMs | OpenAI/Claude/Gemini/DeepSeek APIs |
| `src/components/Console/CommandExecutePanel.tsx` | Terminal Console | Direct execution of native ADB/Fastboot commands | `execute_adb_command` |
| `src/components/Console/LogsPanel.tsx` | Logcat Viewer | Log level filtering, regex search, log export | `adb logcat [filters]` |
| `src/components/Settings/AISettingsPanel.tsx` | AI Configuration | Encrypted key storage, custom endpoints | `configStore.saveAiConfig` |

---

## ⚡ Native Rust Backend Commands & IPC Mapping

The native Rust backend implements high-performance IPC commands. The table below maps core Rust Commands to Frontend Service calls:

| Rust Command (`tauri::command`) | Frontend Service Method | Functional Description & Parameters |
| :--- | :--- | :--- |
| `get_devices` | `deviceService.getDevices()` | Fetches connected ADB devices via USB or wireless TCP/IP. |
| `get_device_info` | `deviceService.getDeviceInfo(serial)` | Retrieves manufacturer, model, Android version, and SDK level for target serial. |
| `execute_adb_command` | `adbService.execute(args)` | Executes custom ADB commands and returns stdout/stderr. |
| `execute_fastboot_command` | `fastbootService.execute(args)` | Executes Fastboot commands during bootloader mode. |
| `start_scrcpy` | `scrcpyService.startMirror(config)` | Launches native Scrcpy process with bitrate, FPS, codec, and audio configurations. |
| `stop_scrcpy` | `scrcpyService.stopMirror()` | Terminates currently running Scrcpy process. |
| `list_packages` | `appService.listPackages(filter)` | Fetches installed packages (User apps, System apps, Frozen apps). |
| `install_apk` | `appService.installApk(path, flags)` | Deploys APK packages with specified flags (`-r`, `-d`, `-g`). |
| `uninstall_package` | `appService.uninstall(package, keepData)` | Uninstalls package by name. |
| `freeze_package` | `appService.setPackageEnabled(pkg, false)` | Rootless freeze of target application. |
| `pull_file` | `fileService.pullFile(remotePath, localPath)` | Downloads remote device file/directory to local PC path. |
| `push_file` | `fileService.pushFile(localPath, remotePath)` | Uploads local PC file/directory to target device path. |
| `patch_boot_image` | `rootService.patchBoot(bootPath, tool)` | Pushes boot image to device, invokes Magisk/KSU patcher, and pulls result back. |
| `flash_partition` | `fastbootService.flashPartition(part, image)` | Flashes target partition image in Fastboot mode. |
| `toggle_thermal` | `geekService.setThermalService(enabled)` | Rootless toggle of system thermal throttling service. |
| `fetch_online_resources` | `resourceService.fetchIndex()` | Fetches cloud toolchain and ROM index manifest. |

---

## 🛠️ Advanced Flashing & Troubleshooting Guide

#### 1. Boot Image Extraction & Root Patching
1. Use the "Online Resource Center" to download official fastboot ROM or OTA packages matching your device firmware.
2. Under "Fastboot Zone -> ROM Manager", select the downloaded ZIP/Payload package to extract `boot.img` (or `init_boot.img` on Android 13+).
3. Switch to "Root Zone -> Boot Patching", select the extracted boot image, and choose your Root framework (Magisk or KernelSU).
4. Click "Patch Image". Once completed, click "Flash Patched Image in Fastboot Mode".
5. Device reboots into system; install the manager APK to gain full Root permissions.

#### 2. Common Fastboot Errors & Resolutions
- **`FAILED (remote: 'Partition doesn't exist')`**:
  - Cause: Target device does not have a standalone partition with that name (e.g., recovery integrated inside boot partition).
  - Solution: Verify partition target; flash to `boot` or `init_boot` partition instead.
- **`FAILED (remote: 'is verification disabled?')`**:
  - Cause: Verification protection is active when attempting to flash custom boot or system images.
  - Solution: Use `ImageFlashCard` to flash `vbmeta.img` with "Disable Verity/Verification (--disable-verity --disable-verification)" enabled.

---

## ⚖️ Performance Benchmarks & Comparison

| Metric / Feature | Traditional Electron Apps | ADB CLI | **ADMT (Tauri v2 + Rust)** |
| :--- | :--- | :--- | :--- |
| **RAM Usage** | ~300MB - 800MB | ~10MB | **~40MB - 90MB** ⚡ |
| **Package Installer Size** | ~120MB - 250MB | ~5MB - 10MB | **~15MB - 25MB** 📦 |
| **Cold Launch Time** | 3 - 8 Seconds | Instant | **< 0.8 Seconds** 🚀 |
| **GUI Interface** | ✅ Yes | ❌ No (CLI only) | **✅ Modern Fluent UI** |
| **Wireless ADB / Mirroring**| Paid or Complex Setup | Manual Commands | **✅ One-Click Auto Connect** |
| **AI Error Diagnostics** | ❌ No | ❌ No | **✅ Built-in Multi-LLM AI Assistant** |
| **Cross-Platform Support**| Windows / macOS | Windows / Mac / Linux | **✅ Windows / macOS / Linux** |

---

## 🛠️ Tech Stack & Architecture

- **Frontend Interface**:
  - **UI Framework**: React 18, TypeScript 5.6
  - **Component Library**: Microsoft Fluent UI React Components v9
  - **Animation Engine**: Framer Motion
  - **State Management**: Zustand
  - **Localization (i18n)**: i18next (Simplified Chinese, Traditional Chinese, English)
  - **Build Tool**: Vite 5
- **Backend Native Layer**:
  - **Native Language**: Rust 1.75+
  - **Desktop Application Framework**: Tauri v2
  - **IPC Communication**: Tauri Command, State & Event Emitter
  - **System Integration**: Native System Tray Menu, Global Shortcuts, Native File Dialogs
- **Embedded Binary Toolchain**:
  - **ADB Platform Tools** (Google Android Debug Bridge)
  - **Scrcpy Engine** (Genymobile open-source screen mirroring binary)
  - **Fastboot CLI** (Android Bootloader flashing tool)

---

## 🚀 Developer Guide & Build Steps

### 1. Prerequisites

Ensure your development workstation has the following installed:

1. **Node.js**: v18.0.0+ (LTS version recommended)
2. **Rust Environment**: `rustc` and `cargo` via `rustup`
3. **C++ Toolchain**:
   - **Windows**: Visual Studio 2022 with "Desktop development with C++" workload.
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`).
   - **Linux**: `build-essential`, `webkit2gtk`, and Tauri v2 prerequisites.

### 2. Clone Repository & Install Dependencies

```bash
# 1. Clone official repository
git clone https://github.com/LACS-Official/admt.git

# 2. Enter project directory
cd admt

# 3. Install NPM packages
npm install
```

### 3. Environment Setup (Optional)

Copy `.env.example` to `.env` to configure optional local API endpoints or debug variables:

```bash
cp .env.example .env
```

### 4. Run Development Mode

Starts Vite dev server and launches the Tauri desktop window with HMR support:

```bash
npm run tauri:dev
```

### 5. Build Production Installer

Generates platform-specific production installer packages (e.g., Windows `.msi` / `.exe`, macOS `.dmg` / `.app`):

```bash
npm run tauri:build
```

Installers are generated in `src-tauri/target/release/bundle/`.

---

## 📁 Directory Structure Map

```text
admt/
├── .github/                # Issue templates and CONTRIBUTING guidelines
├── public/                 # Static asset files (icons, background graphics)
├── src/                    # React Frontend Core Source
│   ├── assets/             # Icons, audio, and global styling assets
│   ├── components/         # Feature-specific component libraries
│   │   ├── AdbTools/       # ADB panel (App Manager, Scrcpy, Wireless ADB, File Manager)
│   │   ├── Bar/            # TitleBar, StatusBar, and AnnouncementBar
│   │   ├── Common/         # Utility components (Version Checker, Auto Mirror)
│   │   ├── Console/        # AI Chat Panel, Command Line, and Logcat Windows
│   │   ├── Debug/          # Internal Diagnostics & Privacy Debug
│   │   ├── DeviceControl/  # Hardware Key Simulation & System Control
│   │   ├── DeviceInfo/     # Overview, Monitoring, and Battery Cards
│   │   ├── ExtendedFeatures/# Geek Tool Suite Components
│   │   ├── FlashZone/      # Fastboot Flashing & Partition Management
│   │   ├── Home/           # Home Dashboard & No-Device Prompt
│   │   ├── MainContent/    # Sidebar Navigation & Page Switcher
│   │   ├── OnlineResources/# Cloud Resource Hub & Download Manager
│   │   ├── Others/         # Command Execution & Log Panels
│   │   ├── Root/           # Boot Image Patching & Root Module Panel
│   │   ├── Security/       # Security Warnings & Consent Components
│   │   ├── Settings/       # Settings Panels (Display, AI, Hardware, About)
│   │   ├── StartupFlow/    # Startup Privacy Dialog & Animations
│   │   ├── Tools/          # Xiaomi Flashing/Unlocking Tools
│   │   └── UnlockZone/     # Unlock Zone Panel
│   ├── config/             # Configuration & API Endpoint Settings
│   ├── i18n/               # Multi-language dictionaries (zh-CN, zh-TW, en-US)
│   ├── services/           # Tauri Command wrapper & Bridge Communication Services
│   ├── stores/             # Zustand Reactive State Trees
│   ├── styles/             # Global CSS / HSL Tokens & Theme Styles
│   ├── types/              # TypeScript Type Declarations
│   ├── utils/              # Helper utility functions
│   ├── App.tsx             # Root Application Component
│   └── main.tsx            # Vite Renderer Entrypoint
├── src-tauri/              # Rust / Tauri Native Backend Core
│   ├── src/                # Rust Source Code (ADB Protocol, Scrcpy Manager, System API)
│   ├── tools/              # Embedded Binaries (ADB, Scrcpy, Fastboot, etc.)
│   ├── Cargo.toml          # Rust Package Manifest
│   └── tauri.conf.json     # Tauri v2 Application Configuration
├── .env.example            # Environment variables example file
├── eslint.config.js        # ESLint Configuration
├── package.json            # NPM Scripts and Package Manifest
├── tsconfig.json           # TypeScript Compiler Configuration
├── vite.config.ts          # Vite Bundler Configuration
├── LICENSE                 # Apache License 2.0
├── README.md               # Simplified Chinese Documentation
└── README.en.md            # English Documentation
```

---

## ❓ FAQ & Troubleshooting

#### Q1: ADMT shows "No Device Connected" after plugging in my phone via USB?
1. Ensure "Developer Options" and "USB Debugging" are turned ON in Android settings.
2. Check your phone screen for the "Allow USB Debugging?" authorization prompt. Select "Always allow" and tap Accept.
3. Try a different USB cable or a rear USB port on your PC. On Windows, use the built-in **USB Driver Fixer** to reinstall universal ADB drivers.

#### Q2: Scrcpy Screen Mirroring shows a black screen or connection error?
1. Some device brands (e.g., Xiaomi/Redmi/vivo) require enabling **"USB Debugging (Security Settings) - Allow simulating touch/input via USB"** in Developer Options.
2. Ensure no competing ADB processes or emulator software are running in the background.
3. Switch Scrcpy video codec to `H.264` and lower the bitrate under "Settings -> Display Settings".

#### Q3: How do I configure API Keys for the built-in AI Diagnostic Assistant?
1. Navigate to **Settings -> AI Settings** from the sidebar.
2. Select your preferred Provider (OpenAI, DeepSeek, Zhipu, etc.).
3. Input your API Key and custom Endpoint proxy URL if applicable.
4. Click "Test API Connectivity" to confirm setup.

---

## 🤝 Community & Contributing

We warmly welcome developers, power users, and designers to join the ADMT open-source community!

Ways to contribute:
- 🐛 **Submit Bug Reports**: Describe issues and device models in GitHub Issues.
- 💡 **Propose Feature Requests**: Tell us what tools or workflows you'd like to see.
- 📝 **Improve Documentation & Translations**: Help refine component guides or translate ADMT into more languages.
- 🔀 **Submit Pull Requests**: Clone the repo, implement fixes/features, and open a PR.

Please refer to [.github/CONTRIBUTING.md](./.github/CONTRIBUTING.md) for contribution guidelines before submitting code.

---

## 📄 License & Attribution

This project is open-source under the [Apache License 2.0](./LICENSE).

- You are free to use, modify, and distribute this software, provided original copyright notices and license texts are retained.
- Copyright © 2020-2026 **LACS Studio** and ADMT Project Contributors.

---

<div align="center">

**If ADMT helps you with Android device management, flashing, or development, please consider giving us a ⭐️ Star on GitHub!**

**Thank you to all developers and enthusiasts for your support!**

</div>
