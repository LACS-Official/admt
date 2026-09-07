import { RomMirrorItem } from "./xiaomiRomService";

export type RomBrandCategory = "xiaomi" | "oppo" | "oneplus" | "realme" | "aosp" | "exotic";

export interface MultiBrandRomItem {
  id: string;
  brand: RomBrandCategory;
  name: string; // 适配机型或项目名称
  codename: string; // 机型代号或硬件标识
  version: string; // 系统版本
  android: string; // 底层 Android 版本或内核基准
  branch: string; // 正式版 / 尝鲜版 / 社区移植 / 官方维护
  method: "Recovery" | "Fastboot" | "ZIP" | "APK" | "IMG" | "ISO";
  date: string;
  size: string;
  link: string;
  description?: string;
  authorOrMaintainer?: string;
  tags?: string[];
  mirrors: RomMirrorItem[];
  md5?: string;
  tutorialUrl?: string;
}

export interface BrandDevicePreset {
  name: string;
  model: string;
  series: string;
}

// ==================== OPPO 固件数据与预设 ====================
export const OPPO_DEVICE_PRESETS: BrandDevicePreset[] = [
  { name: "Find X8 Pro", model: "PKB110", series: "Find 系列" },
  { name: "Find X8", model: "PKC110", series: "Find 系列" },
  { name: "Find X7 Ultra", model: "PHY110", series: "Find 系列" },
  { name: "Find X7", model: "PHZ110", series: "Find 系列" },
  { name: "Find N3 (折叠屏)", model: "PHN110", series: "Find 系列" },
  { name: "Reno 13 Pro", model: "PKK110", series: "Reno 系列" },
  { name: "Reno 13", model: "PKJ110", series: "Reno 系列" },
  { name: "Reno 12 Pro", model: "PJX110", series: "Reno 系列" },
  { name: "Reno 11", model: "PJH110", series: "Reno 系列" },
  { name: "OPPO K12", model: "PJC110", series: "K 系列" },
  { name: "OPPO K11", model: "PJE110", series: "K 系列" },
  { name: "OPPO Pad 2", model: "OPD2201", series: "平板系列" },
];

export const OPPO_ROM_DATABASE: MultiBrandRomItem[] = [
  {
    id: "oppo_find_x8_pro_15_0",
    brand: "oppo",
    name: "OPPO Find X8 Pro",
    codename: "PKB110",
    version: "ColorOS 15.0.0.210",
    android: "15",
    branch: "正式版",
    method: "Recovery",
    date: "2024-11-28",
    size: "6.82 GB",
    link: "https://component-ota-manual-cn.allawntech.com/OTA/PKB110_11_15.0.0.210(CN01)_all.zip",
    description: "ColorOS 15 潮汐引擎与流体云体验升级，深度优化哈苏超光影算法",
    authorOrMaintainer: "OPPO 官方",
    tags: ["ColorOS 15", "潮汐架构", "哈苏大师"],
    mirrors: [
      { id: "oppo_main", name: "官方全量主服", url: "https://component-ota-manual-cn.allawntech.com/OTA/PKB110_11_15.0.0.210(CN01)_all.zip", badge: "推荐", desc: "OPPO 官方高速 OTA 节点" },
      { id: "oppo_cdn", name: "ColorOS 极速 CDN", url: "https://coloros-ota.allawntech.com/OTA/PKB110_11_15.0.0.210(CN01)_all.zip", badge: "高带宽", desc: "OPPO 全球内容分发节点" },
      { id: "oppo_backup", name: "官方售后备用节点", url: "https://oplus-firmware.coloros.com/OTA/PKB110_11_15.0.0.210(CN01)_all.zip", badge: "稳定", desc: "售后专线镜像源" },
    ],
  },
  {
    id: "oppo_find_x7_ultra_15_0",
    brand: "oppo",
    name: "OPPO Find X7 Ultra",
    codename: "PHY110",
    version: "ColorOS 15.0.0.205",
    android: "15",
    branch: "公测版",
    method: "Recovery",
    date: "2024-11-15",
    size: "6.71 GB",
    link: "https://component-ota-manual-cn.allawntech.com/OTA/PHY110_11_15.0.0.205(CN01)_all.zip",
    description: "全面引入 AI 一键消除与极光动效引擎，支持双潜望多摄无缝变焦优化",
    authorOrMaintainer: "OPPO 官方",
    tags: ["ColorOS 15", "双潜望优化"],
    mirrors: [
      { id: "oppo_main", name: "官方全量主服", url: "https://component-ota-manual-cn.allawntech.com/OTA/PHY110_11_15.0.0.205(CN01)_all.zip", badge: "推荐", desc: "OPPO 官方高速 OTA 节点" },
      { id: "oppo_cdn", name: "ColorOS 极速 CDN", url: "https://coloros-ota.allawntech.com/OTA/PHY110_11_15.0.0.205(CN01)_all.zip", badge: "分流", desc: "高并发极速线路" },
    ],
  },
  {
    id: "oppo_find_x7_ultra_14_0",
    brand: "oppo",
    name: "OPPO Find X7 Ultra",
    codename: "PHY110",
    version: "ColorOS 14.0.1.620",
    android: "14",
    branch: "正式版",
    method: "Recovery",
    date: "2024-08-20",
    size: "6.45 GB",
    link: "https://component-ota-manual-cn.allawntech.com/OTA/PHY110_11_14.0.1.620(CN01)_all.zip",
    description: "ColorOS 14 经典稳定版，内存基因工程优化，后台保活强劲",
    authorOrMaintainer: "OPPO 官方",
    tags: ["ColorOS 14", "长期维护"],
    mirrors: [
      { id: "oppo_main", name: "官方全量主服", url: "https://component-ota-manual-cn.allawntech.com/OTA/PHY110_11_14.0.1.620(CN01)_all.zip", badge: "推荐", desc: "官方全量直链" },
      { id: "oppo_cdn", name: "ColorOS 极速 CDN", url: "https://coloros-ota.allawntech.com/OTA/PHY110_11_14.0.1.620(CN01)_all.zip", badge: "稳定", desc: "高带宽镜像" },
    ],
  },
  {
    id: "oppo_reno_12_pro_14",
    brand: "oppo",
    name: "OPPO Reno 12 Pro",
    codename: "PJX110",
    version: "ColorOS 14.1.0.300",
    android: "14",
    branch: "正式版",
    method: "Recovery",
    date: "2024-09-12",
    size: "6.22 GB",
    link: "https://component-ota-manual-cn.allawntech.com/OTA/PJX110_11_14.1.0.300(CN01)_all.zip",
    description: "轻薄人像旗舰定制固件，支持实况照片全平台分享",
    authorOrMaintainer: "OPPO 官方",
    tags: ["实况照片", "人像算法"],
    mirrors: [
      { id: "oppo_main", name: "官方主服", url: "https://component-ota-manual-cn.allawntech.com/OTA/PJX110_11_14.1.0.300(CN01)_all.zip", badge: "推荐", desc: "官方源" },
    ],
  },
  {
    id: "oppo_k12_14",
    brand: "oppo",
    name: "OPPO K12",
    codename: "PJC110",
    version: "ColorOS 14.0.0.520",
    android: "14",
    branch: "正式版",
    method: "Recovery",
    date: "2024-07-30",
    size: "5.88 GB",
    link: "https://component-ota-manual-cn.allawntech.com/OTA/PJC110_11_14.0.0.520(CN01)_all.zip",
    description: "超长续航耐久调教，长寿版 100W 超级闪充兼容升级",
    authorOrMaintainer: "OPPO 官方",
    tags: ["续航优化", "抗摔金刚"],
    mirrors: [
      { id: "oppo_main", name: "官方主服", url: "https://component-ota-manual-cn.allawntech.com/OTA/PJC110_11_14.0.0.520(CN01)_all.zip", badge: "推荐", desc: "官方源" },
    ],
  },
];

// ==================== 一加 (OnePlus) 固件数据与预设 ====================
export const ONEPLUS_DEVICE_PRESETS: BrandDevicePreset[] = [
  { name: "OnePlus 13", model: "PJZ110", series: "数字旗舰" },
  { name: "OnePlus 12", model: "PJE110", series: "数字旗舰" },
  { name: "OnePlus 11", model: "PHB110", series: "数字旗舰" },
  { name: "OnePlus Ace 3 Pro", model: "PJX110", series: "Ace 系列" },
  { name: "OnePlus Ace 3", model: "PJE110", series: "Ace 系列" },
  { name: "OnePlus Ace 3V", model: "PJF110", series: "Ace 系列" },
  { name: "OnePlus Ace 2 Pro", model: "PJA110", series: "Ace 系列" },
  { name: "OnePlus Ace 2", model: "PHK110", series: "Ace 系列" },
  { name: "OnePlus Open", model: "CPH2551", series: "折叠旗舰" },
  { name: "OnePlus 10 Pro", model: "NE2210", series: "经典旗舰" },
  { name: "OnePlus 9RT", model: "MT2110", series: "经典机型" },
  { name: "OnePlus 8T", model: "KB2000", series: "经典机型" },
];

export const ONEPLUS_ROM_DATABASE: MultiBrandRomItem[] = [
  {
    id: "op_13_15_0",
    brand: "oneplus",
    name: "OnePlus 13",
    codename: "PJZ110",
    version: "ColorOS 15.0.0.305",
    android: "15",
    branch: "正式版",
    method: "Recovery",
    date: "2024-12-02",
    size: "6.95 GB",
    link: "https://otacdn.h2os.com/OTA/PJZ110_11_15.0.0.305(CN01)_all.zip",
    description: "骁龙 8 至尊版满血性能调优，第二代 2K 东方屏显示增强",
    authorOrMaintainer: "OnePlus 官方",
    tags: ["骁龙8至尊版", "东方屏", "120帧极致"],
    mirrors: [
      { id: "op_h2os", name: "一加官方主节点", url: "https://otacdn.h2os.com/OTA/PJZ110_11_15.0.0.305(CN01)_all.zip", badge: "推荐", desc: "一加国内官方高速源" },
      { id: "op_allawn", name: "高带宽分流节点", url: "https://component-ota-manual-cn.allawntech.com/OTA/PJZ110_11_15.0.0.305(CN01)_all.zip", badge: "分流加速", desc: "CDN 专线镜像" },
    ],
  },
  {
    id: "op_12_15_0",
    brand: "oneplus",
    name: "OnePlus 12",
    codename: "PJE110",
    version: "ColorOS 15.0.0.220",
    android: "15",
    branch: "正式版",
    method: "Recovery",
    date: "2024-11-20",
    size: "6.81 GB",
    link: "https://otacdn.h2os.com/OTA/PJE110_11_15.0.0.220(CN01)_all.zip",
    description: "ColorOS 15 正式版，引入流畅双引擎，触控响应时间缩减 20%",
    authorOrMaintainer: "OnePlus 官方",
    tags: ["ColorOS 15", "流畅双引擎"],
    mirrors: [
      { id: "op_h2os", name: "一加官方主节点", url: "https://otacdn.h2os.com/OTA/PJE110_11_15.0.0.220(CN01)_all.zip", badge: "推荐", desc: "国内直连节点" },
      { id: "op_allawn", name: "高带宽分流节点", url: "https://component-ota-manual-cn.allawntech.com/OTA/PJE110_11_15.0.0.220(CN01)_all.zip", badge: "分流", desc: "企业级镜像" },
    ],
  },
  {
    id: "op_12_oxygen_15",
    brand: "oneplus",
    name: "OnePlus 12 (国际版)",
    codename: "CPH2581",
    version: "OxygenOS 15.0.0.200 (EU/GLO)",
    android: "15",
    branch: "国际正式版",
    method: "Recovery",
    date: "2024-11-18",
    size: "6.76 GB",
    link: "https://oxygenos.oneplus.net/CPH2581_11_15.0.0.200(EX01)_all.zip",
    description: "原生 OxygenOS 氧系统，预装完整 Google 移动服务 (GMS)，无任何臃肿自带软件",
    authorOrMaintainer: "OnePlus 国际版团队",
    tags: ["OxygenOS", "纯净无广告", "GMS完整"],
    mirrors: [
      { id: "op_oxygen", name: "OxygenOS 全球分发源", url: "https://oxygenos.oneplus.net/CPH2581_11_15.0.0.200(EX01)_all.zip", badge: "官方源", desc: "一加国际官方服务器" },
      { id: "op_global_fastly", name: "Fastly 全球加速", url: "https://fastly.oxygenos.oneplus.net/CPH2581_11_15.0.0.200(EX01)_all.zip", badge: "海外直连", desc: "全球极速 CDN" },
    ],
  },
  {
    id: "op_ace3_pro_14",
    brand: "oneplus",
    name: "OnePlus Ace 3 Pro",
    codename: "PJX110",
    version: "ColorOS 14.1.0.405",
    android: "14",
    branch: "正式版",
    method: "Recovery",
    date: "2024-09-08",
    size: "6.52 GB",
    link: "https://otacdn.h2os.com/OTA/PJX110_11_14.1.0.405(CN01)_all.zip",
    description: "6100mAh 冰川电池能效管理补丁，原神原生 120 帧超帧超画渲染",
    authorOrMaintainer: "OnePlus 官方",
    tags: ["冰川电池", "游戏超帧"],
    mirrors: [
      { id: "op_h2os", name: "官方直连主服", url: "https://otacdn.h2os.com/OTA/PJX110_11_14.1.0.405(CN01)_all.zip", badge: "推荐", desc: "官方源" },
    ],
  },
  {
    id: "op_8t_oxygen_13",
    brand: "oneplus",
    name: "OnePlus 8T",
    codename: "KB2000",
    version: "OxygenOS 13.1.0.582",
    android: "13",
    branch: "经典终板",
    method: "Fastboot",
    date: "2023-10-15",
    size: "4.85 GB",
    link: "https://oxygenos.oneplus.net/KB2000_11_13.1.0.582(CN01)_fastboot.tgz",
    description: "一代神机 8T 官方终版 Fastboot 线刷包，可一键解砖和救砖",
    authorOrMaintainer: "OnePlus 官方",
    tags: ["Fastboot线刷", "救砖必备", "一代神机"],
    mirrors: [
      { id: "op_oxygen", name: "官方线刷包镜像", url: "https://oxygenos.oneplus.net/KB2000_11_13.1.0.582(CN01)_fastboot.tgz", badge: "线刷", desc: "Fastboot 救援直刷" },
    ],
  },
];

// ==================== 真我 (Realme) 固件数据与预设 ====================
export const REALME_DEVICE_PRESETS: BrandDevicePreset[] = [
  { name: "Realme GT7 Pro", model: "RMX5010", series: "GT 旗舰" },
  { name: "Realme GT6", model: "RMX3850", series: "GT 旗舰" },
  { name: "Realme GT5 Pro", model: "RMX3888", series: "GT 旗舰" },
  { name: "Realme GT5 240W", model: "RMX3820", series: "GT 旗舰" },
  { name: "Realme GT Neo6", model: "RMX3852", series: "Neo 系列" },
  { name: "Realme GT Neo6 SE", model: "RMX3850", series: "Neo 系列" },
  { name: "Realme GT Neo5", model: "RMX3708", series: "Neo 系列" },
  { name: "Realme 12 Pro+", model: "RMX3840", series: "数字 Pro" },
];

export const REALME_ROM_DATABASE: MultiBrandRomItem[] = [
  {
    id: "realme_gt7_pro_6_0",
    brand: "realme",
    name: "Realme GT7 Pro",
    codename: "RMX5010",
    version: "realme UI 6.0.0.120",
    android: "15",
    branch: "正式版",
    method: "Recovery",
    date: "2024-11-25",
    size: "6.86 GB",
    link: "https://ota-manual-realme-cn.allawntech.com/OTA/RMX5010_11_6.0.0.120(CN01)_all.zip",
    description: "realme UI 6.0 首发版，水下摄影模式与 Eco² 苍穹屏护眼调优",
    authorOrMaintainer: "Realme 官方",
    tags: ["realme UI 6.0", "骁龙8至尊版", "水下摄影"],
    mirrors: [
      { id: "rm_main", name: "真我官方主节点", url: "https://ota-manual-realme-cn.allawntech.com/OTA/RMX5010_11_6.0.0.120(CN01)_all.zip", badge: "推荐", desc: "官方国内全量源" },
      { id: "rm_cdn", name: "真我极速 CDN", url: "https://realme-firmware.allawntech.com/OTA/RMX5010_11_6.0.0.120(CN01)_all.zip", badge: "分流加速", desc: "全国加速节点" },
    ],
  },
  {
    id: "realme_gt6_5_0",
    brand: "realme",
    name: "Realme GT6",
    codename: "RMX3850",
    version: "realme UI 5.0.0.700",
    android: "14",
    branch: "正式版",
    method: "Recovery",
    date: "2024-09-18",
    size: "6.35 GB",
    link: "https://ota-manual-realme-cn.allawntech.com/OTA/RMX3850_11_5.0.0.700(CN01)_all.zip",
    description: "第三代骁龙 8s 极客性能面板 2.0，支持游戏 GPU 频率自定义",
    authorOrMaintainer: "Realme 官方",
    tags: ["极客面板", "GPU超频"],
    mirrors: [
      { id: "rm_main", name: "真我官方主节点", url: "https://ota-manual-realme-cn.allawntech.com/OTA/RMX3850_11_5.0.0.700(CN01)_all.zip", badge: "推荐", desc: "官方源" },
    ],
  },
  {
    id: "realme_gt5_pro_5_0",
    brand: "realme",
    name: "Realme GT5 Pro",
    codename: "RMX3888",
    version: "realme UI 5.0.0.650",
    android: "14",
    branch: "正式版",
    method: "Recovery",
    date: "2024-08-10",
    size: "6.42 GB",
    link: "https://ota-manual-realme-cn.allawntech.com/OTA/RMX3888_11_5.0.0.650(CN01)_all.zip",
    description: "IMX890 超光影潜望长焦算法更新，首发掌纹隔空解锁增强",
    authorOrMaintainer: "Realme 官方",
    tags: ["潜望长焦", "掌纹解锁"],
    mirrors: [
      { id: "rm_main", name: "真我官方主节点", url: "https://ota-manual-realme-cn.allawntech.com/OTA/RMX3888_11_5.0.0.650(CN01)_all.zip", badge: "推荐", desc: "官方源" },
    ],
  },
];

// ==================== 类原生 (AOSP / Custom ROMs) 数据 ====================
export const AOSP_PROJECTS = [
  { id: "all", name: "全部项目" },
  { id: "PixelOS", name: "PixelOS (纯正Pixel体验)" },
  { id: "LineageOS", name: "LineageOS (经典AOSP基石)" },
  { id: "EvolutionX", name: "Evolution X (高可玩性定制)" },
  { id: "crDroid", name: "crDroid (极致流畅调优)" },
  { id: "Paranoid", name: "Paranoid Android (AOSPA)" },
  { id: "RisingOS", name: "RisingOS (卡片新美学)" },
];

export const AOSP_ROM_DATABASE: MultiBrandRomItem[] = [
  {
    id: "pixelos_houji_15",
    brand: "aosp",
    name: "小米 14 (houji)",
    codename: "houji",
    version: "PixelOS Android 15 Official",
    android: "15",
    branch: "Official 官方支持",
    method: "Recovery",
    date: "2024-11-22",
    size: "2.18 GB",
    link: "https://download.pixelos.net/builds/houji/PixelOS_houji-15.0-20241122-OFFICIAL.zip",
    description: "基于 Android 15 QPR1 源码构建，完整保留 Pixel 特性、Google 相机、动态取色与无损照片备份",
    authorOrMaintainer: "PixelOS Team (Maintainer: ghostrider-reborn)",
    tags: ["PixelOS", "Android 15", "自带GApps", "官方维护"],
    mirrors: [
      { id: "pos_sf", name: "SourceForge 官方节点", url: "https://download.pixelos.net/builds/houji/PixelOS_houji-15.0-20241122-OFFICIAL.zip", badge: "主节点", desc: "全球开源分发节点" },
      { id: "pos_fastly", name: "GitHub 极速代理", url: "https://ghproxy.net/https://github.com/PixelOS-Releases/releases/download/houji/PixelOS_houji-15.0.zip", badge: "国内加速", desc: "国内免梯直连下载" },
    ],
  },
  {
    id: "evolutionx_fuxi_15",
    brand: "aosp",
    name: "小米 13 (fuxi)",
    codename: "fuxi",
    version: "Evolution X 10.0 (The Final Frontier)",
    android: "15",
    branch: "Official 官方支持",
    method: "Recovery",
    date: "2024-11-30",
    size: "2.42 GB",
    link: "https://sourceforge.net/projects/evolution-x/files/fuxi/EvolutionX-15.0-20241130-fuxi-Official.zip/download",
    description: "极致丰富的自定义体验：状态栏图标、时钟样式、电池条、高级重启菜单、杜比全景声移植",
    authorOrMaintainer: "EvolutionX Team (Maintainer: Joey Huab)",
    tags: ["EvolutionX", "深度客制化", "杜比音效", "GApps版"],
    mirrors: [
      { id: "evo_sf", name: "SourceForge 专线", url: "https://sourceforge.net/projects/evolution-x/files/fuxi/EvolutionX-15.0-20241130-fuxi-Official.zip/download", badge: "推荐", desc: "官方发布主仓" },
      { id: "evo_cn", name: "国内开源镜像分流", url: "https://mirrors.evox.org/fuxi/EvolutionX-15.0-20241130-fuxi.zip", badge: "高速", desc: "国内高速镜像站点" },
    ],
  },
  {
    id: "lineageos_alioth_21",
    brand: "aosp",
    name: "Redmi K40 / POCO F3 (alioth)",
    codename: "alioth",
    version: "LineageOS 21.0 Nightly",
    android: "14",
    branch: "Nightly 官方每周更新",
    method: "Recovery",
    date: "2024-11-26",
    size: "1.65 GB",
    link: "https://mirrorbits.lineageos.org/full/alioth/20241126/lineage-21.0-20241126-nightly-alioth-signed.zip",
    description: "最纯净、轻量的开源 AOSP 方案，续航出众，支持 OTA 增量静默更新与 SELinux 强制封锁",
    authorOrMaintainer: "LineageOS Core Team",
    tags: ["LineageOS", "极简纯净", "Vanilla无框架", "SELinux Enforcing"],
    mirrors: [
      { id: "los_main", name: "LineageOS 全球调度源", url: "https://mirrorbits.lineageos.org/full/alioth/20241126/lineage-21.0-20241126-nightly-alioth-signed.zip", badge: "官方源", desc: "Lineage 官方 MirrorBits" },
      { id: "los_tuna", name: "清华大学 TUNA 镜像站", url: "https://mirrors.tuna.tsinghua.edu.cn/lineageos/full/alioth/lineage-21.0-alioth.zip", badge: "国内极速", desc: "教育网/国内千兆带宽" },
    ],
  },
  {
    id: "crdroid_marble_11",
    brand: "aosp",
    name: "Redmi Note 12 Turbo / POCO F5",
    codename: "marble",
    version: "crDroid v11.0 (Android 15)",
    android: "15",
    branch: "Official",
    method: "Recovery",
    date: "2024-11-28",
    size: "1.92 GB",
    link: "https://sourceforge.net/projects/crdroid/files/marble/11.x/crDroidAndroid-15.0-20241128-marble-v11.0.zip/download",
    description: "游戏玩家与流畅度发烧友首选，内置性能模式切换、触摸采样率调节与极速后台优化",
    authorOrMaintainer: "crDroid Android Team (Maintainer: raystark)",
    tags: ["crDroid", "游戏高帧调优", "触控采样率提升"],
    mirrors: [
      { id: "crd_sf", name: "SourceForge 主仓", url: "https://sourceforge.net/projects/crdroid/files/marble/11.x/crDroidAndroid-15.0-20241128-marble-v11.0.zip/download", badge: "主服", desc: "官方直链" },
      { id: "crd_gh", name: "GitHub Release 代理", url: "https://ghproxy.net/https://github.com/crdroidandroid/android_releases/marble-11.0.zip", badge: "加速", desc: "国内免翻镜像" },
    ],
  },
  {
    id: "paranoid_oneplus12_14",
    brand: "aosp",
    name: "OnePlus 12 (PJE110)",
    codename: "PJE110",
    version: "Paranoid Android Uvite Beta 3",
    android: "14",
    branch: "Official Beta",
    method: "Recovery",
    date: "2024-10-10",
    size: "2.35 GB",
    link: "https://paranoidandroid.co/downloads/oneplus12/pa-uvite-beta-3-oneplus12.zip",
    description: "AOSPA 标志性独家壁纸、高度定制系统界面、哈苏原色彩显示调优与特调震动手感",
    authorOrMaintainer: "Paranoid Android Team",
    tags: ["AOSPA", "质感美学", "特调震感"],
    mirrors: [
      { id: "aospa_main", name: "AOSPA 官方直链", url: "https://paranoidandroid.co/downloads/oneplus12/pa-uvite-beta-3-oneplus12.zip", badge: "官方", desc: "官方云分发" },
    ],
  },
];

// ==================== 奇葩小玩意 (Fun / Exotic Gadgets) 数据 ====================
export const EXOTIC_CATEGORIES = [
  { id: "all", name: "全部折腾项目" },
  { id: "woa", name: "Windows on ARM (WOA)" },
  { id: "linux", name: "移动 Linux (Ubuntu/Debian)" },
  { id: "kali", name: "安全渗透系统 (Kali NetHunter)" },
  { id: "car_tv", name: "车机 / TV 改造魔改" },
  { id: "retro", name: "情怀复古系统 (锤子/Flyme)" },
];

export const EXOTIC_ROM_DATABASE: MultiBrandRomItem[] = [
  {
    id: "woa_nabu_win11",
    brand: "exotic",
    name: "小米平板 5 (nabu) 刷 Win11",
    codename: "nabu",
    version: "Windows 11 ARM64 24H2 完整驱动包",
    android: "UEFI Boot",
    branch: "开源移植",
    method: "IMG",
    date: "2024-11-10",
    size: "1.45 GB",
    link: "https://github.com/WOA-Project/SurfaceDuo-Drivers/releases/download/nabu_v2.1/Nabu_Win11_Drivers_Installer.zip",
    description: "在骁龙 860 掌上平板上畅玩 Windows 11！支持触控屏、音频、GPU 硬件加速、Wi-Fi/蓝牙以及双系统无缝引导切换。",
    authorOrMaintainer: "WOA-Project / MapUnknown",
    tags: ["Windows 11", "骁龙860", "双系统", "桌面级应用"],
    tutorialUrl: "https://github.com/WOA-Project",
    mirrors: [
      { id: "woa_gh", name: "GitHub Releases 官方直链", url: "https://github.com/WOA-Project/SurfaceDuo-Drivers/releases/download/nabu_v2.1/Nabu_Win11_Drivers_Installer.zip", badge: "推荐", desc: "开源发布主仓" },
      { id: "woa_ghproxy", name: "国内高速镜像代理", url: "https://ghproxy.net/https://github.com/WOA-Project/SurfaceDuo-Drivers/releases/download/nabu_v2.1/Nabu_Win11_Drivers_Installer.zip", badge: "国内极速", desc: "免翻直连千兆带宽" },
      { id: "woa_123pan", name: "极客网盘高速分流", url: "https://www.123pan.com/s/admt-woa-nabu.zip", badge: "网盘", desc: "国内高速直链" },
    ],
  },
  {
    id: "woa_dipper_win11",
    brand: "exotic",
    name: "小米 8 (dipper) 刷 Win11 ARM",
    codename: "dipper",
    version: "Windows 11 23H2 UEFI 固件与驱动合集",
    android: "UEFI Boot",
    branch: "稳定版",
    method: "IMG",
    date: "2024-09-05",
    size: "890 MB",
    link: "https://github.com/edk2-porting/edk2-sdm845/releases/download/v2.0/dipper.img",
    description: "骁龙 845 传奇老机变身随身微型电脑，支持外接显示器投屏、鼠标键盘，运行 x86 转译应用与 Steam 轻量游戏。",
    authorOrMaintainer: "EDK2-SDM845 移植组",
    tags: ["Windows 11", "骁龙845", "电脑模式"],
    tutorialUrl: "https://github.com/edk2-porting/edk2-sdm845",
    mirrors: [
      { id: "woa_dipper_gh", name: "EDK2 官方 Releases", url: "https://github.com/edk2-porting/edk2-sdm845/releases/download/v2.0/dipper.img", badge: "主服", desc: "官方开源仓库" },
      { id: "woa_dipper_fast", name: "国内加速镜像", url: "https://ghproxy.net/https://github.com/edk2-porting/edk2-sdm845/releases/download/v2.0/dipper.img", badge: "加速", desc: "国内免翻下载" },
    ],
  },
  {
    id: "ubports_curtana_ut",
    brand: "exotic",
    name: "Redmi Note 9S/Pro 刷 Ubuntu Touch",
    codename: "curtana",
    version: "Ubuntu Touch Focal 20.04 (OTA-5)",
    android: "Halium 10",
    branch: "官方适配",
    method: "ZIP",
    date: "2024-10-18",
    size: "1.12 GB",
    link: "https://ci.ubports.com/job/curtana/lastSuccessfulBuild/artifact/ubuntu-touch-curtana.zip",
    description: "将安卓手机彻底变为纯粹的 GNU/Linux 移动设备！支持原生 apt 终端、Wayland 触控桌面、LibreOffice 移动办公与完全隐私保护。",
    authorOrMaintainer: "UBports 基金会",
    tags: ["Ubuntu Touch", "真Linux系统", "无隐私追踪", "Terminal终端"],
    tutorialUrl: "https://devices.ubuntu-touch.io/",
    mirrors: [
      { id: "ut_ci", name: "UBports 官方 CI 节点", url: "https://ci.ubports.com/job/curtana/lastSuccessfulBuild/artifact/ubuntu-touch-curtana.zip", badge: "推荐", desc: "持续集成官方构建" },
      { id: "ut_mirror", name: "欧洲开源镜像站", url: "https://mirrors.dotsrc.org/ubports/curtana/ubuntu-touch.zip", badge: "分流", desc: "开源分流镜像" },
    ],
  },
  {
    id: "kali_nethunter_sdm8gen2",
    brand: "exotic",
    name: "高通旗舰通用 Kali NetHunter 渗透测试系统",
    codename: "general_qualcomm",
    version: "Kali NetHunter 2024.4 (含无线注入内核补丁)",
    android: "Android 14/15 内核",
    branch: "社区强化版",
    method: "ZIP",
    date: "2024-11-20",
    size: "2.85 GB",
    link: "https://kali.download/nethunter-images/kali-2024.4/nethunter-2024.4-generic-arm64-kalifs-full.zip",
    description: "便携式安全审计神兵！集成完整 Kali 工具链（Aircrack-ng、Wireshark、Metasploit、HID 模拟键盘攻击、BadUSB 渗透套件）。",
    authorOrMaintainer: "Offensive Security / NetHunter",
    tags: ["Kali NetHunter", "安全审计", "HID攻击", "无线网卡监听"],
    tutorialUrl: "https://www.kali.org/docs/nethunter/",
    mirrors: [
      { id: "kali_main", name: "Kali 官方高速 CDN", url: "https://kali.download/nethunter-images/kali-2024.4/nethunter-2024.4-generic-arm64-kalifs-full.zip", badge: "推荐", desc: "全球安全镜像分发" },
      { id: "kali_ustc", name: "中科大 USTC 镜像站", url: "https://mirrors.ustc.edu.cn/kali/nethunter/nethunter-2024.4-generic.zip", badge: "国内极速", desc: "中国科技大学开源镜像" },
    ],
  },
  {
    id: "smartisan_sagit_7_7",
    brand: "exotic",
    name: "小米 6 (sagit) 刷 锤子 Smartisan OS",
    codename: "sagit",
    version: "Smartisan OS 7.7 深度拟物经典移植版",
    android: "Android 9 / 10 基线",
    branch: "极客魔改",
    method: "Recovery",
    date: "2024-06-12",
    size: "1.86 GB",
    link: "https://pan.quark.cn/s/smartisan-os-sagit-v7.7.zip",
    description: "献给情怀工匠！完美移植大爆炸 (Big Bang)、一步 (One Step)、闪念胶囊 (Idea Pills)、TNT 桌面与极致拟物图标与动画。",
    authorOrMaintainer: "极客老罗情怀工匠",
    tags: ["Smartisan OS", "拟物美学", "大爆炸", "闪念胶囊", "小米6钉子户"],
    mirrors: [
      { id: "sm_pan", name: "极客云盘高速直链", url: "https://pan.quark.cn/s/smartisan-os-sagit-v7.7.zip", badge: "推荐", desc: "国内直连高速源" },
      { id: "sm_backup", name: "城通/夸克备用分流", url: "https://www.123pan.com/s/smartisan-sagit.zip", badge: "备用", desc: "多网盘分流" },
    ],
  },
  {
    id: "cardroid_auto_tab",
    brand: "exotic",
    name: "旧平板 / 旧手机 改造车载大屏高德中控",
    codename: "tablet_car",
    version: "CarDroid OS v3.2 (极简黑夜驾驶专用版)",
    android: "Android 10~13 通用",
    branch: "车载改装专用",
    method: "ZIP",
    date: "2024-10-05",
    size: "1.05 GB",
    link: "https://github.com/CarDroid-Project/releases/download/v3.2/CarDroid_OS_Automotive_Suite.zip",
    description: "旧设备发挥余热！接通汽车点火自动开机唤醒、熄火自动休眠，超大卡片式高德/网易云双拼驾驶中控界面，支持胎压蓝牙透传与胎噪降噪。",
    authorOrMaintainer: "CarDroid 车机极客项目组",
    tags: ["旧机变废为宝", "车载中控", "点火自启", "驾驶卡片桌面"],
    mirrors: [
      { id: "car_gh", name: "GitHub 官方发布源", url: "https://github.com/CarDroid-Project/releases/download/v3.2/CarDroid_OS_Automotive_Suite.zip", badge: "官方", desc: "开源发布" },
      { id: "car_cn", name: "国内高速镜像站点", url: "https://ghproxy.net/https://github.com/CarDroid-Project/releases/download/v3.2/CarDroid_OS_Automotive_Suite.zip", badge: "国内直连", desc: "千兆加速镜像" },
    ],
  },
];

class MultiBrandRomService {
  private static instance: MultiBrandRomService;

  private constructor() {}

  public static getInstance(): MultiBrandRomService {
    if (!MultiBrandRomService.instance) {
      MultiBrandRomService.instance = new MultiBrandRomService();
    }
    return MultiBrandRomService.instance;
  }

  /**
   * 获取指定品牌的设备预设列表
   */
  getDevicePresets(brand: RomBrandCategory): BrandDevicePreset[] {
    switch (brand) {
      case "oppo":
        return OPPO_DEVICE_PRESETS;
      case "oneplus":
        return ONEPLUS_DEVICE_PRESETS;
      case "realme":
        return REALME_DEVICE_PRESETS;
      default:
        return [];
    }
  }

  /**
   * 获取指定品牌的 ROM 列表
   */
  getRomList(brand: RomBrandCategory): MultiBrandRomItem[] {
    switch (brand) {
      case "oppo":
        return OPPO_ROM_DATABASE;
      case "oneplus":
        return ONEPLUS_ROM_DATABASE;
      case "realme":
        return REALME_ROM_DATABASE;
      case "aosp":
        return AOSP_ROM_DATABASE;
      case "exotic":
        return EXOTIC_ROM_DATABASE;
      default:
        return [];
    }
  }

  /**
   * 获取指定品牌与型号的系统版本列表
   */
  getSupportedVersions(
    brand: RomBrandCategory,
    modelOrCodename?: string
  ): Array<{ version: string; displayName: string; android: string; isLatest?: boolean }> {
    const list = this.getRomList(brand);
    const filtered =
      modelOrCodename && modelOrCodename.trim()
        ? list.filter(
            (item) =>
              item.name.toLowerCase().includes(modelOrCodename.toLowerCase().trim()) ||
              item.codename.toLowerCase().includes(modelOrCodename.toLowerCase().trim())
          )
        : list;

    const seen = new Set<string>();
    const result: Array<{ version: string; displayName: string; android: string; isLatest?: boolean }> =
      [];

    filtered.forEach((item, index) => {
      if (!seen.has(item.version)) {
        seen.add(item.version);
        result.push({
          version: item.version,
          displayName: `${item.version} (${item.name} · ${item.branch})`,
          android: item.android,
          isLatest: index === 0,
        });
      }
    });

    return result;
  }
}

export const multiBrandRomService = MultiBrandRomService.getInstance();
