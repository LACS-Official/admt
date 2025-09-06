/**
 * 小米解锁工具通用工具函数
 * 重构点：提取重复的设备检测、系统信息获取等逻辑为可复用函数
 */

import { invoke } from '@tauri-apps/api/core';
import { DeviceInfo } from '../../../types/device';
import { SystemInfo, DetectionResult, CommandOutput } from './types';

/**
 * 检查设备是否为小米设备
 * 重构点：提取设备品牌检测逻辑，避免重复代码
 */
export const isXiaomiDevice = (device: DeviceInfo | null): boolean => {
  if (!device) return false;
  
  const brand = device.properties?.brand?.toLowerCase() || '';
  const manufacturer = device.properties?.manufacturer?.toLowerCase() || '';
  
  return brand.includes('xiaomi') || manufacturer.includes('xiaomi');
};

/**
 * 获取系统信息
 * 重构点：将系统信息获取逻辑提取为独立函数，减少代码重复
 */
export const getSystemInfo = async (
  deviceService: any,
  deviceSerial: string,
  addCommandOutput: (command: string, output: string, success: boolean) => void
): Promise<SystemInfo> => {
  // 获取 Android 版本
  const androidRes = await deviceService.deviceService.executeAdbCommand(
    deviceSerial,
    'shell',
    ['getprop', 'ro.build.version.release'],
    10
  );
  const androidVersion = (androidRes.output || '').trim();
  const androidMajor = parseInt(androidVersion.split('.')[0] || '', 10);
  addCommandOutput('adb shell getprop ro.build.version.release', androidRes.output || androidRes.error || '无输出', androidRes.success);

  // 获取 MIUI/HyperOS 版本
  let miuiName = '';
  const miuiNameRes = await deviceService.deviceService.executeAdbCommand(
    deviceSerial,
    'shell',
    ['getprop', 'ro.miui.ui.version.name'],
    10
  );
  miuiName = (miuiNameRes.output || '').trim();
  
  if (!miuiName) {
    const hyperNameRes = await deviceService.deviceService.executeAdbCommand(
      deviceSerial,
      'shell',
      ['getprop', 'ro.mi.os.version.name'],
      10
    );
    miuiName = (hyperNameRes.output || '').trim();
  }
  addCommandOutput('adb shell getprop ro.miui.ui.version.name | ro.mi.os.version.name', miuiName || '无输出', true);

  // 获取 CPU/SoC 信息
  const propsToQuery = [
    ['getprop', 'ro.soc.manufacturer'],
    ['getprop', 'ro.hardware'],
    ['getprop', 'ro.board.platform'],
    ['getprop', 'ro.product.board'],
  ];
  
  const cpuInfoParts: string[] = [];
  for (const args of propsToQuery) {
    const res = await deviceService.deviceService.executeAdbCommand(
      deviceSerial,
      'shell',
      args as string[],
      10
    );
    const value = (res.output || '').trim();
    if (value) cpuInfoParts.push(value);
    addCommandOutput(`adb shell ${args.join(' ')}`, res.output || res.error || '无输出', res.success);
  }
  
  const cpuInfo = cpuInfoParts.join(' ').toLowerCase();
  const isQualcomm = /qualcomm|qcom|msm|sdm|sm\d|lahaina|kona/.test(cpuInfo);
  const isMediatek = /mediatek|mt\d{3,}/.test(cpuInfo);

  return {
    androidVersion,
    androidMajor,
    miuiName,
    cpuInfo: cpuInfoParts.join(' / ') || '未知',
    isQualcomm,
    isMediatek
  };
};

/**
 * 检测解锁方式
 * 重构点：将解锁方式检测逻辑提取为独立函数
 */
export const detectUnlockMethod = async (
  device: DeviceInfo,
  deviceService: any
): Promise<DetectionResult> => {
  const isXiaomi = isXiaomiDevice(device);
  
  // 获取系统信息（不需要命令输出记录）
  const dummyAddOutput = () => {};
  const systemInfo = await getSystemInfo(deviceService, device.serial, dummyAddOutput);
  
  let guidance = '';
  if (!isNaN(systemInfo.androidMajor) && systemInfo.androidMajor >= 15) {
    guidance = '检测到 Android 15 或更高版本。建议前往小米社区参与答题以获取解锁权限，常规解锁方式目前不可用。';
  } else {
    const isV816 = /816/i.test(systemInfo.miuiName);
    if (isV816 && (!isNaN(systemInfo.androidMajor) && systemInfo.androidMajor < 15)) {
      guidance = '检测到 MIUI/HyperOS V816 且 Android 版本 < 15，建议使用 Bypass 解锁。部分版本安卓设置仍可能报错，除非降级到更低版本，否则通过售后刷机会被标记，无法解锁。';
    } else {
      guidance = '当前 MIUI 版本非 V816。请前往申请解锁绑定。注意：小米对老机型限制较多，能否解锁具有一定概率性。';
    }
  }

  return {
    androidVersion: systemInfo.androidVersion || '未知',
    systemVersion: systemInfo.miuiName || '未知',
    cpuInfo: systemInfo.cpuInfo,
    isXiaomiDevice: isXiaomi,
    guidance
  };
};

/**
 * 生成安装建议
 * 重构点：将安装建议生成逻辑提取为独立函数
 */
export const generateInstallAdvice = (systemInfo: SystemInfo): string[] => {
  const lines: string[] = [];
  lines.push(`• Android 版本: ${systemInfo.androidVersion}`);
  lines.push(`• 系统版本: ${systemInfo.miuiName}`);
  lines.push(`• 处理器信息: ${systemInfo.cpuInfo}`);

  if (!isNaN(systemInfo.androidMajor) && systemInfo.androidMajor >= 15) {
    lines.push('\n检测到 Android 15 或更高版本。');
    lines.push('当前无法通过 Bypass 方式解锁，请前往小米社区参与答题以获取解锁权限。');
    return lines;
  }

  const isV816 = /816/i.test(systemInfo.miuiName);
  if (!isV816) {
    lines.push('\n当前系统版本非 V816，无需安装解锁设置。');
    return lines;
  }

  // V816 情况下根据 SoC 和 Android 版本给出建议
  if (systemInfo.isQualcomm) {
    if (systemInfo.androidMajor === 14) {
      lines.push('\n建议：安装【高通 - Android 14】版本的解锁设置。');
    } else if (systemInfo.androidMajor === 13) {
      lines.push('\n建议：安装【高通 - Android 13】版本的解锁设置。');
    } else {
      lines.push('\n建议：检测到高通平台，但 Android 版本非 13/14，请优先尝试对应版本的解锁设置或参考官方方法。');
    }
  } else if (systemInfo.isMediatek) {
    lines.push('\n建议：安装【联发科机型】版本的解锁设置。');
  } else {
    lines.push('\n提示：未能明确识别处理器平台，请根据机型自行选择（高通/联发科）。');
  }

  return lines;
};

/**
 * 检查文件是否存在
 * 重构点：提取文件检查逻辑，统一错误处理
 */
export const checkFileExists = async (path: string): Promise<boolean> => {
  try {
    return await invoke<boolean>('check_file_exists', { path });
  } catch (error) {
    console.warn(`检查文件失败: ${path}`, error);
    return false;
  }
};

/**
 * 创建命令输出记录
 * 重构点：提取命令输出创建逻辑
 */
export const createCommandOutput = (command: string, output: string, success: boolean): CommandOutput => {
  return {
    id: Date.now().toString(),
    command,
    output,
    timestamp: new Date(),
    success
  };
};