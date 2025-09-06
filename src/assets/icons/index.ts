// 设备图标导入
import anzIcon from "./devices/anz.webp";
import androidIcon from "./devices/anz.webp";
import fastbootIcon from "./devices/anz.webp";
import fastbootdIcon from "./devices/anz.webp";
import sideloadIcon from "./devices/anz.webp";
import twrpIcon from "./devices/anz.webp";
import UnlinkIcon from "./devices/Unlink.gif";
//关于页面导入
import admtbgIcon from "./admt/admt-bg.webp";
import lacsbgIcon from "./admt/lacs-maxbg-all-icons.webp";
//Logo 
import admtLogo64 from "./admt/64x64.png";
import admtLogo128 from "./admt/128x128.png";
import admtLogo256 from "./admt/256x256.png";
import admtLogo512 from "./admt/512x512.png";
// 设备图标映射
export const deviceIcons = {
  sys: anzIcon,        // 系统模式
  rec: twrpIcon,       // Recovery模式
  fastboot: fastbootIcon,   // Fastboot模式
  fastbootd: fastbootdIcon, // Fastbootd模式
  sideload: sideloadIcon,   // Sideload模式
  edl: androidIcon,         // EDL模式 (使用通用图标)
  unauthorized: androidIcon, // 未授权 (使用通用图标)
  offline: androidIcon,     // 离线 (使用通用图标)
  unknown: androidIcon,     // 未知 
  unlink: UnlinkIcon,       // 解除链接 
} as const;

// 导出单个图标
export {
  anzIcon,
  androidIcon,
  fastbootIcon,
  fastbootdIcon,
  sideloadIcon,
  twrpIcon,
  admtbgIcon,
  lacsbgIcon,
  admtLogo64,
  admtLogo128,
  admtLogo256,
  admtLogo512
};

// 根据设备模式获取图标
export const getDeviceIcon = (mode: string): string => {
  return deviceIcons[mode as keyof typeof deviceIcons] || androidIcon;
};
