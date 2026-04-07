/**
 * 小米解锁工具常量定义
 * 重构点：将常量和配置提取到独立文件，便于维护和修改
 */

import React from 'react';
import {
  LockOpen24Regular,
  Search24Regular,
  Settings24Regular,
  Flash24Regular,
} from "@fluentui/react-icons";
import { XiaomiTool, ToolConfig } from './types';

/**
 * 工具配置映射
 * 重构点：将工具配置集中管理，避免硬编码
 */
export const TOOL_CONFIGS: Record<string, ToolConfig> = {
  bypass_unlock: {
    name: 'Bypass解锁',
    folder: 'MiBypass',
    configFile: 'lacs_config.json',
    downloadTag: '小米解锁'
  },
  xiaomi_unlock_tool: {
    name: '小米解锁工具',
    folder: 'miflash_unlock',
    configFile: 'lacs_config.json',
    downloadTag: '小米解锁'
  }
};

/**
 * 可能的工具路径
 * 重构点：将路径配置提取为常量，便于维护
 */
export const POSSIBLE_TOOL_PATHS = [
  'downloads',
  'resources/downloads',
  '../downloads',
  './downloads',
  'src-tauri/target/debug/downloads',
  'target/debug/downloads'
];

/**
 * CPU 检测正则表达式
 * 重构点：将正则表达式提取为常量，提高可读性
 */
export const CPU_PATTERNS = {
  QUALCOMM: /qualcomm|qcom|msm|sdm|sm\d|lahaina|kona/,
  MEDIATEK: /mediatek|mt\d{3,}/
};

/**
 * 系统属性查询配置
 * 重构点：将系统属性查询参数提取为常量
 */
export const SYSTEM_PROPS = {
  ANDROID_VERSION: ['getprop', 'ro.build.version.release'],
  MIUI_VERSION: ['getprop', 'ro.miui.ui.version.name'],
  HYPER_VERSION: ['getprop', 'ro.mi.os.version.name'],
  CPU_PROPS: [
    ['getprop', 'ro.soc.manufacturer'],
    ['getprop', 'ro.hardware'],
    ['getprop', 'ro.board.platform'],
    ['getprop', 'ro.product.board'],
  ]
};

/**
 * 创建小米工具列表的工厂函数
 * 重构点：将工具列表创建逻辑提取为函数，支持动态生成，并支持国际化
 */
export const createXiaomiTools = (device: any, t: any): XiaomiTool[] => {

  const isXiaomiDevice = (device?.properties?.brand?.toLowerCase()?.includes("xiaomi") ?? false) || 
                        (device?.properties?.manufacturer?.toLowerCase()?.includes("xiaomi") ?? false);
  const isSysMode = device?.mode === "sys";

  return [
    {
      id: "xiaomi_unlock_tool",
      label: t("unlock.xiaomi_unlock_tool"),
      description: t("unlock.xiaomi_unlock_tool_desc"),
      icon: React.createElement(LockOpen24Regular),
      dangerous: false,
      available: true,
    },
    {
      id: "bypass_unlock",
      label: t("unlock.bypass_unlock"),
      description: t("unlock.bypass_unlock_desc"),
      icon: React.createElement(Flash24Regular),
      dangerous: true,
      available: isXiaomiDevice,
    },
    {
      id: "detect_unlock_method",
      label: t("unlock.detect_unlock_method"),
      description: t("unlock.detect_unlock_method_desc"),
      icon: React.createElement(Search24Regular),
      dangerous: false,
      available: isXiaomiDevice,
    },
    {
      id: "install_unlock_settings",
      label: t("unlock.install_unlock_settings"),
      description: t("unlock.install_unlock_settings_desc"),
      icon: React.createElement(Settings24Regular),
      dangerous: false,
      available: isSysMode,
    },
  ];
};