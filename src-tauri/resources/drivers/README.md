# Android USB 驱动程序

本目录包含HOUT工具所需的Android设备USB驱动程序。

## 文件说明

### 核心驱动文件
- `android_winusb.inf` - Windows USB驱动配置文件
- `WinUSBCoInstaller2.dll` - USB协同安装程序
- `WinUSBCoInstaller.dll` - 备用协同安装程序
- `dpinst.exe` - 驱动程序安装工具

### 支持的设备
- 大部分Android手机和平板设备
- 支持ADB调试模式
- 支持Fastboot刷机模式
- 兼容USB 2.0/3.0接口

## 安装方式

### 自动安装（推荐）
通过HOUT工具的"安装设备驱动"功能自动安装。

### 手动安装
1. 右键点击`android_winusb.inf`
2. 选择"安装"
3. 按照向导完成安装

## 兼容性

### 支持的Windows版本
- Windows 10 (1903及以上)
- Windows 11 (所有版本)
- Windows Server 2019/2022

### 支持的架构
- x64 (64位)
- ARM64 (部分支持)

## 许可证
本驱动程序基于开源许可证分发，详见各文件头部说明。
