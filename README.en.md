<div align="center">

# 📱 Android Device Management Tools (ADMT)

**A high-performance, cross-platform Android device management tool built with Tauri v2 + React.**

English | [简体中文](./README.md)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC107.svg?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 💡 About

**ADMT (Android Device Management Tools)** is a modern desktop management suite for Android devices. Powered by **Rust + Tauri v2**, ADMT uses 80% less memory than traditional Electron apps and launches instantly. Designed for Android power users, developers, enthusiasts, and everyday users alike.

---

## ✨ Features

- ⚡ **Lightweight & Cross-Platform**: Minimal RAM footprint powered by Tauri v2. Supports Windows, macOS, and Linux.
- 🖥️ **Scrcpy Screen Mirroring**: High-definition, low-latency screen mirroring with keyboard/mouse control and clipboard sync.
- 🔌 **Comprehensive ADB Toolkit**:
  - Auto-detection for USB devices and Wireless ADB (Wi-Fi debugging).
  - App uninstaller & bloatware freezer (Uninstall pre-installed system apps without Root).
  - Built-in Shell terminal and real-time Logcat viewer.
- 📂 **Visual File Manager**: Browse, drag-and-drop transfer, and manage Android files directly from your desktop.
- 🤖 **AI Diagnostic Assistant**: Integrated AI assistant to help troubleshoot flashing issues, ADB errors, and device glitches.
- 🛠️ **Built-in Utility Suite**: Platform tools, USB driver fixers, and flashing helpers included.

---

## ⚖️ Performance Comparison

| Feature / Metric | Traditional Electron Apps | ADB CLI | **ADMT (Tauri v2)** |
| :--- | :--- | :--- | :--- |
| **RAM Usage** | ~300MB - 800MB | ~10MB | **~40MB - 90MB** ⚡ |
| **Package Size** | ~120MB+ | ~5MB | **~15MB - 25MB** 📦 |
| **GUI Interface** | ✅ Yes | ❌ No (CLI only) | **✅ Modern Fluent UI** |
| **Wireless ADB / Mirroring**| Paid or Manual | Complex Commands | **✅ One-click Auto Connect** |
| **AI Error Diagnostics** | ❌ No | ❌ No | **✅ Built-in AI Assistant** |

---

## 🗺️ Roadmap

- [x] **v1.4**: Upgraded to Tauri v2 with Scrcpy integration & AI diagnostics
- [ ] **v1.5**: Automatic Wi-Fi ADB LAN discovery & pairing
- [ ] **v1.6**: Multi-device parallel management & batch APK distribution
- [ ] **v2.0**: Basic iOS protocol support & backup utilities

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Fluent UI, Framer Motion, Zustand, Vite
- **Backend / Native**: Rust, Tauri v2
- **Embedded Tools**: ADB Platform Tools, Scrcpy, Custom Toolchain

---

## 🚀 Quick Start

### Prerequisites

Ensure you have installed:
1. **Node.js** (v18+ recommended) and **npm**
2. **Rust** Toolchain (`rustc` and `cargo`)
3. Platform-specific prerequisites for Tauri (refer to [Tauri Setup Guide](https://tauri.app/v1/guides/getting-started/prerequisites))

### Installation & Build

1. **Clone the Repository**
   ```bash
   git clone https://github.com/LACS-Official/admt.git
   cd admt
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup (Optional)**
   ```bash
   cp .env.example .env
   ```

4. **Run Development Server**
   ```bash
   npm run tauri:dev
   ```

5. **Build for Production**
   ```bash
   npm run tauri:build
   ```
   Find installer packages in `src-tauri/target/release/bundle/`.

---

## 📄 License

This project is licensed under the [Apache License 2.0](./LICENSE).
Copyright © 2020-2026 LACS Studio and Project Contributors.
