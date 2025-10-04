import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Input,
  Checkbox,
} from "@fluentui/react-components";
import {
  InfoRegular,
  ArrowClockwiseRegular,
  CopyRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { deviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
// 定义信息面板组件的props类型
interface InfoPanelProps {
  device: any;
  onCopyValue: (value: string, label: string) => void;
  styles: any;
}

// 定义分区信息类型
interface PartitionInfo {
  name: string;
  type: string;
  size: string;
  category: string;
  description: string;
}

// 定义分区分类类型
interface PartitionCategory {
  id: string;
  name: string;
  description: string;
  partitions: PartitionInfo[];
}

// Fastboot 模式存储分区信息面板
export const FastbootStorageInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const [partitionCategories, setPartitionCategories] = useState<PartitionCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("name");
  const [selectedPartitions, setSelectedPartitions] = useState<Set<string>>(new Set());
  const { setStatusBarMessage } = useAppStore();

  // 预定义分区描述和分类
  const getPartitionInfo = useCallback((name: string): { category: string; description: string } => {
    // 转换为小写以便匹配
    const lowerName = name.toLowerCase();
    
    // 启动与引导类分区
    const bootPartitions: Record<string, string> = {
      "xbl_a": "高通底层引导，初始化硬件并加载后续程序（高通设备专属）",
      "xbl_b": "高通底层引导，初始化硬件并加载后续程序（高通设备专属）",
      "xbl_config_a": "存储 xbl 硬件适配参数，确保 xbl 适配设备",
      "xbl_config_b": "存储 xbl 硬件适配参数，确保 xbl 适配设备",
      "abl_a": "安卓 Boot Loader，加载 boot 内核，决定启动 A/B 槽",
      "abl_b": "安卓 Boot Loader，加载 boot 内核，决定启动 A/B 槽",
      "boot_a": "存安卓内核 + ramdisk，刷 Magisk 修补版可获 Root",
      "boot_b": "存安卓内核 + ramdisk，刷 Magisk 修补版可获 Root",
      "dtbo_a": "补充硬件配置，支持动态修改参数（第三方 ROM/Recovery 需适配）",
      "dtbo_b": "补充硬件配置，支持动态修改参数（第三方 ROM/Recovery 需适配）",
      "vendor_boot_a": "存厂商定制启动资源，补充 boot 功能（安卓 11+ 常见）",
      "vendor_boot_b": "存厂商定制启动资源，补充 boot 功能（安卓 11+ 常见）",
      "imagefv_a": "UEFI 镜像验证，保障启动安全（防篡改）",
      "imagefv_b": "UEFI 镜像验证，保障启动安全（防篡改）",
      "uefisecapp_a": "运行 UEFI 安全程序（如 Secure Boot 验证）",
      "uefisecapp_b": "运行 UEFI 安全程序（如 Secure Boot 验证）",
      "vbmeta_a": "存分区签名，AVB 验证用，刷第三方需加 --disable-verity",
      "vbmeta_b": "存分区签名，AVB 验证用，刷第三方需加 --disable-verity",
      "vbmeta_system_a": "专门验证 system 分区完整性",
      "vbmeta_system_b": "专门验证 system 分区完整性",
    };
    
    // 通信与基带类分区
    const communicationPartitions: Record<string, string> = {
      "modem_a": "存基带固件，控 5G/4G / 蓝牙 / WiFi，需匹配地区固件",
      "modem_b": "存基带固件，控 5G/4G / 蓝牙 / WiFi，需匹配地区固件",
      "modemst1": "存基带动态配置，清除后重启可恢复",
      "modemst2": "存基带动态配置，清除后重启可恢复",
      "fsg": "存基带安全策略，需与 modem 版本匹配",
      "fsc": "存 fsg 加密证书，验证 fsg 完整性",
      "bluetooth_a": "存蓝牙固件，控蓝牙连接（此设备单独分区）",
      "bluetooth_b": "存蓝牙固件，控蓝牙连接（此设备单独分区）",
    };
    
    // 系统与用户数据类分区
    const systemPartitions: Record<string, string> = {
      "super": "含 system/vendor/product 等子分区，刷系统需先刷此分区",
      "userdata": "存个人数据，fastboot erase userdata 即恢复出厂",
      "cust": "存厂商地区 / 运营商定制内容（如国行 MIUI 功能）",
      "logo": "存开机 Logo / 动画，可刷自定义文件替换",
      "splash": "存开机过渡画面，可含简单动画（区别于静态 logo）",
    };
    
    // 安全与配置类分区
    const securityPartitions: Record<string, string> = {
      "keymaster_a": "运行 Keymaster 模块，存系统密钥（硬件级加密）",
      "keymaster_b": "运行 Keymaster 模块，存系统密钥（硬件级加密）",
      "vm-keystore": "为安卓虚拟机提供密钥存储 / 签名验证",
      "secdata": "存轻量安全配置（如 Secure Boot 状态、防回滚号）",
      "storsec": "控存储访问权限，防数据物理提取",
      "frp": "存谷歌锁数据，刷机前 fastboot erase frp 可跳过激活",
      "devinfo": "存设备硬件参数，系统启动时确认设备身份",
      "persist": "存硬件校准数据（如传感器 / 相机参数），擦除致硬件异常且难恢复",
      "persistbak": "备份 persist 数据，可恢复损坏的 persist",
    };
    
    // 调试与日志类分区
    const debugPartitions: Record<string, string> = {
      "logdump": "存系统日志，设备异常时定位故障",
      "minidump": "存系统崩溃精简内存快照，便于分析",
      "rawdump": "存完整崩溃内存快照，供复杂故障排查",
      "oops": "存内核错误日志，快速定位内核故障",
      "dbg": "存调试模式配置（如 USB 调试权限）",
    };
    
    // 备份与恢复类分区
    const recoveryPartitions: Record<string, string> = {
      "rescue": "存紧急救援系统，主系统故障时修复 / 备份",
      "ffu": "存厂商快速修复固件，用 QPST 刷写修复底层故障",
      "msadp": "存基带 / 应用处理器紧急修复程序",
      "apdp": "存基带 / 应用处理器紧急修复程序",
    };
    
    // 硬件与芯片专属分区
    const hardwarePartitions: Record<string, string> = {
      "aop_a": "存音频编解码固件，控音频硬件（高通专属）",
      "aop_b": "存音频编解码固件，控音频硬件（高通专属）",
      "tz_a": "运行 TEE 系统，提供硬件级安全隔离（如指纹 / 支付加密）",
      "tz_b": "运行 TEE 系统，提供硬件级安全隔离（如指纹 / 支付加密）",
      "hyp_a": "管理 CPU 虚拟化资源，支持安卓虚拟化功能",
      "hyp_b": "管理 CPU 虚拟化资源，支持安卓虚拟化功能",
      "cmnlib_a": "为 TEE 提供安全接口，64 位版（cmnlib64）适配 64 位 TEE",
      "cmnlib_b": "为 TEE 提供安全接口，64 位版（cmnlib64）适配 64 位 TEE",
      "devcfg_a": "存高通芯片硬件配置，确保识别外部硬件",
      "devcfg_b": "存高通芯片硬件配置，确保识别外部硬件",
      "qupfw_a": "控电源管理（如充电电流 / 休眠功耗），保电源稳定",
      "qupfw_b": "控电源管理（如充电电流 / 休眠功耗），保电源稳定",
      "dsp_a": "存 DSP 固件，处理音视频信号（提升多媒体效率）",
      "dsp_b": "存 DSP 固件，处理音视频信号（提升多媒体效率）",
      "ddr": "存内存初始化参数，防内存识别失败",
      "mdmddr": "存基带内存初始化参数，防内存识别失败",
      "cdt": "存高通芯片硬件信息，开机时确认芯片规格",
    };
    
    // 厂商自定义分区
    const vendorPartitions: Record<string, string> = {
      "bk01": "存厂商小体积配置备份（如校准参数、MIUI 开关）",
      "bk02": "存厂商小体积配置备份（如校准参数、MIUI 开关）",
      "bk03": "存厂商小体积配置备份（如校准参数、MIUI 开关）",
      "bk04": "存厂商小体积配置备份（如校准参数、MIUI 开关）",
      "bk06": "存相机算法、屏幕参数、充电策略等功能配置",
      "bk08": "存相机算法、屏幕参数、充电策略等功能配置",
      "bk09": "存相机算法、屏幕参数、充电策略等功能配置",
      "bk010": "存相机算法、屏幕参数、充电策略等功能配置",
      "bk41_a": "备份 A/B 槽配置，防槽位切换失败",
      "bk41_b": "备份 A/B 槽配置，防槽位切换失败",
      "bk42": "存传感器备份、蓝牙 / WiFi 配置、射频参数等",
      "bk43": "存传感器备份、蓝牙 / WiFi 配置、射频参数等",
      "bk44": "存传感器备份、蓝牙 / WiFi 配置、射频参数等",
      "bk51": "存传感器备份、蓝牙 / WiFi 配置、射频参数等",
      "countrycode": "存销售地区代码，系统加载对应地区功能",
      "featenabler_a": "控小米特色功能开关（如 MIUI 隐私保护、快充）",
      "featenabler_b": "控小米特色功能开关（如 MIUI 隐私保护、快充）",
      "limits": "限制系统资源使用，防硬件过载",
      "limits-cdsp": "限制 DSP 资源使用，防硬件过载",
      "misc": "存临时配置（如重启模式、OTA 状态）",
      "multiimgqti_a": "存高通 QTI 多镜像加载参数，保组件协同",
      "multiimgqti_b": "存高通 QTI 多镜像加载参数，保组件协同",
      "multiimgoem_a": "存小米定制多镜像参数，适配第三方硬件",
      "multiimgoem_b": "存小米定制多镜像参数，适配第三方硬件",
      "oem_misc1": "存小米 OEM 临时数据（如测试日志、保修信息）",
      "ssd": "记录 UFS 闪存健康状态，优化存储性能",
      "spunvm": "存小米安全虚拟机镜像，提供隐私隔离",
      "switch": "存设备模式标记，开机时决定启动模式",
      "uefivarstore": "存 UEFI 动态变量，保启动参数一致",
      "vm-data": "存安卓虚拟机运行数据，提升启动效率",
      "mdm1m9kefsc": "存基带 EFS 数据（如 IMEI），损坏致无信号且难恢复",
      "mdm1m9kefs1": "存基带 EFS 数据（如 IMEI），损坏致无信号且难恢复",
      "mdm1m9kefs2": "存基带 EFS 数据（如 IMEI），损坏致无信号且难恢复",
      "mdm1m9kefs3": "存基带 EFS 数据（如 IMEI），损坏致无信号且难恢复",
    };
    
    // 检查分区是否属于启动与引导类
    if (bootPartitions[lowerName]) {
      return { category: "boot", description: bootPartitions[lowerName] };
    }
    
    // 检查分区是否属于通信与基带类
    if (communicationPartitions[lowerName]) {
      return { category: "communication", description: communicationPartitions[lowerName] };
    }
    
    // 检查分区是否属于系统与用户数据类
    if (systemPartitions[lowerName]) {
      return { category: "system", description: systemPartitions[lowerName] };
    }
    
    // 检查分区是否属于安全与配置类
    if (securityPartitions[lowerName]) {
      return { category: "security", description: securityPartitions[lowerName] };
    }
    
    // 检查分区是否属于调试与日志类
    if (debugPartitions[lowerName]) {
      return { category: "debug", description: debugPartitions[lowerName] };
    }
    
    // 检查分区是否属于备份与恢复类
    if (recoveryPartitions[lowerName]) {
      return { category: "recovery", description: recoveryPartitions[lowerName] };
    }
    
    // 检查分区是否属于硬件与芯片专属分区
    if (hardwarePartitions[lowerName]) {
      return { category: "hardware", description: hardwarePartitions[lowerName] };
    }
    
    // 检查分区是否属于厂商自定义分区
    if (vendorPartitions[lowerName]) {
      return { category: "vendor", description: vendorPartitions[lowerName] };
    }
    
    // 默认归类为其他分区
    return { category: "other", description: "未知分区" };
  }, []);

  // 格式化大小
  const formatSize = useCallback((sizeHex: string): string => {
    const sizeBytes = parseInt(sizeHex, 16);
    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    } else if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(2)} KB`;
    } else if (sizeBytes < 1024 * 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }, []);

  // 解析分区信息
  const parsePartitionInfo = useCallback((output: string): PartitionInfo[] => {
    console.log("[FastbootStorageInfoPanel] 开始解析分区信息，原始输出长度:", output.length);
    const partitions: PartitionInfo[] = [];
    let lines = output.split('\n');
    console.log("[FastbootStorageInfoPanel] 分割后的行数:", lines.length);
    
    // 预处理：删除每行中的多余空格和制表符
    lines = lines.map(line => {
      // 删除行首和行尾的空格和制表符
      let trimmedLine = line.trim();
      // 将制表符替换为空格
      trimmedLine = trimmedLine.replace(/\t+/g, ' ');
      // 删除"(bootloader)"后的多余空格，保留一个空格
      trimmedLine = trimmedLine.replace(/^\(bootloader\)\s+/, '(bootloader) ');
      // 删除冒号后的多余空格，保留一个空格
      trimmedLine = trimmedLine.replace(/:\s+/g, ': ');
      return trimmedLine;
    });
    
    // 首先收集所有分区名称
    const partitionNames = new Set<string>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      console.log(`[FastbootStorageInfoPanel] 处理第${i}行:`, line);
      
      // 尝试匹配不同格式的分区信息
      // 格式1: "(bootloader) partition-size:countrycode: 100000"
      const match1 = line.match(/\(bootloader\) partition-size:([^:]+):\s+([0-9A-Fa-fx]+)/);
      if (match1) {
        const [, name, size] = match1;
        console.log(`[FastbootStorageInfoPanel] 找到分区大小: ${name} = ${size}`);
        partitionNames.add(name.trim());
        continue;
      }
      
      // 格式2: "(bootloader) partition-type:countrycode: raw"
      const match2 = line.match(/\(bootloader\) partition-type:([^:]+):\s*(\w+)/);
      if (match2) {
        const [, name, type] = match2;
        console.log(`[FastbootStorageInfoPanel] 找到分区类型: ${name} = ${type}`);
        partitionNames.add(name.trim());
        continue;
      }
      
      // 格式3: 处理可能有空格的分区名称，如 "(bootloader) partition-size:vbmeta_vendor a: 800000"
      const match3 = line.match(/\(bootloader\) partition-size:([^:]+):\s+([0-9A-Fa-fx]+)/);
      if (match3) {
        const [, name, size] = match3;
        // 删除分区名称中的空格
        const cleanName = name.replace(/\s+/g, '');
        console.log(`[FastbootStorageInfoPanel] 找到带空格的分区大小: ${name} -> ${cleanName} = ${size}`);
        partitionNames.add(cleanName);
        continue;
      }
      
      // 格式4: 处理可能有空格的分区类型，如 "(bootloader) partition-type:vbmeta_vendor a: raw"
      const match4 = line.match(/\(bootloader\) partition-type:([^:]+):\s*(\w+)/);
      if (match4) {
        const [, name, type] = match4;
        // 删除分区名称中的空格
        const cleanName = name.replace(/\s+/g, '');
        console.log(`[FastbootStorageInfoPanel] 找到带空格的分区类型: ${name} -> ${cleanName} = ${type}`);
        partitionNames.add(cleanName);
        continue;
      }
    }
    
    console.log("[FastbootStorageInfoPanel] 收集到的分区名称:", Array.from(partitionNames));
    
    // 为每个分区创建信息对象
    partitionNames.forEach(name => {
      const partitionInfo = getPartitionInfo(name);
      partitions.push({
        name,
        type: "raw", // 默认类型，后面会更新
        size: "未知", // 默认大小，后面会更新
        category: partitionInfo.category,
        description: partitionInfo.description,
      });
    });
    
    console.log("[FastbootStorageInfoPanel] 创建的分区信息对象数量:", partitions.length);
    
    // 第二遍扫描，更新分区的大小和类型信息
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 更新分区大小
      const sizeMatch = line.match(/\(bootloader\) partition-size:([^:]+):\s+([0-9A-Fa-fx]+)/);
      if (sizeMatch) {
        const [, name, size] = sizeMatch;
        const cleanName = name.trim();
        const partition = partitions.find(p => p.name === cleanName);
        if (partition) {
          partition.size = formatSize(size);
          console.log(`[FastbootStorageInfoPanel] 更新分区大小: ${cleanName} = ${partition.size}`);
        }
        continue;
      }
      
      // 更新分区类型
      const typeMatch = line.match(/\(bootloader\) partition-type:([^:]+):\s*(\w+)/);
      if (typeMatch) {
        const [, name, type] = typeMatch;
        const cleanName = name.trim();
        const partition = partitions.find(p => p.name === cleanName);
        if (partition) {
          partition.type = type;
          console.log(`[FastbootStorageInfoPanel] 更新分区类型: ${cleanName} = ${type}`);
        }
        continue;
      }
      
      // 处理可能有空格的分区大小更新
      const sizeMatchWithSpace = line.match(/\(bootloader\) partition-size:([^:]+):\s+([0-9A-Fa-fx]+)/);
      if (sizeMatchWithSpace) {
        const [, name, size] = sizeMatchWithSpace;
        // 删除分区名称中的空格
        const cleanName = name.replace(/\s+/g, '');
        const partition = partitions.find(p => p.name === cleanName);
        if (partition) {
          partition.size = formatSize(size);
          console.log(`[FastbootStorageInfoPanel] 更新带空格的分区大小: ${name} -> ${cleanName} = ${partition.size}`);
        }
        continue;
      }
      
      // 处理可能有空格的分区类型更新
      const typeMatchWithSpace = line.match(/\(bootloader\) partition-type:([^:]+):\s*(\w+)/);
      if (typeMatchWithSpace) {
        const [, name, type] = typeMatchWithSpace;
        // 删除分区名称中的空格
        const cleanName = name.replace(/\s+/g, '');
        const partition = partitions.find(p => p.name === cleanName);
        if (partition) {
          partition.type = type;
          console.log(`[FastbootStorageInfoPanel] 更新带空格的分区类型: ${name} -> ${cleanName} = ${type}`);
        }
        continue;
      }
    }
    
    console.log("[FastbootStorageInfoPanel] 最终解析结果:", partitions);
    return partitions;
  }, [getPartitionInfo, formatSize]);

  // 获取分区信息
  const fetchPartitionInfo = useCallback(async () => {
    if (!device.serial || device.mode !== 'fastboot') {
      setError("设备未连接或不在 fastboot 模式");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[FastbootStorageInfoPanel] 开始获取分区信息...");
      // 获取分区大小信息
      const sizeResult = await deviceService.getFastbootVariables(device.serial);
      console.log("[FastbootStorageInfoPanel] 获取分区信息结果:", sizeResult);
      
      if (sizeResult.success) {
        console.log("[FastbootStorageInfoPanel] 开始解析分区信息...");
        console.log("[FastbootStorageInfoPanel] 原始输出:", sizeResult.output);
        const parsedPartitions = parsePartitionInfo(sizeResult.output);
        console.log("[FastbootStorageInfoPanel] 解析后的分区信息:", parsedPartitions);
        
        // 按分类分组
        const categories: Record<string, PartitionInfo[]> = {
          boot: [],
          communication: [],
          system: [],
          security: [],
          debug: [],
          recovery: [],
          hardware: [],
          vendor: [],
          other: [],
        };
        
        parsedPartitions.forEach(partition => {
          if (categories[partition.category]) {
            categories[partition.category].push(partition);
          } else {
            categories.other.push(partition);
          }
        });
        
        // 创建分类数组
        const categoryArray: PartitionCategory[] = [
          {
            id: "boot",
            name: "启动与引导",
            description: "设备开机核心，损坏致无法开机",
            partitions: categories.boot,
          },
          {
            id: "communication",
            name: "通信与基带",
            description: "控网络，损坏致无信号 / 无法通话",
            partitions: categories.communication,
          },
          {
            id: "system",
            name: "系统与用户数据",
            description: "存系统 / 个人数据",
            partitions: categories.system,
          },
          {
            id: "security",
            name: "安全与配置",
            description: "保安全 / 硬件适配，损坏致功能异常",
            partitions: categories.security,
          },
          {
            id: "debug",
            name: "调试与日志",
            description: "排故障，供开发者 / 维修用",
            partitions: categories.debug,
          },
          {
            id: "recovery",
            name: "备份与恢复",
            description: "系统故障时紧急修复",
            partitions: categories.recovery,
          },
          {
            id: "hardware",
            name: "硬件与芯片",
            description: "高通 / 厂商适配，保硬件协同",
            partitions: categories.hardware,
          },
          {
            id: "vendor",
            name: "厂商自定义",
            description: "小米专属，保特色功能",
            partitions: categories.vendor,
          },
          {
            id: "other",
            name: "其他分区",
            description: "未分类分区",
            partitions: categories.other,
          },
        ];
        
        console.log("[FastbootStorageInfoPanel] 分区分类结果:", categoryArray);
        setPartitionCategories(categoryArray);
      } else {
        console.error("[FastbootStorageInfoPanel] 获取分区信息失败:", sizeResult.error);
        setError("无法获取分区信息: " + (sizeResult.error || "未知错误"));
      }
    } catch (err) {
      console.error("[FastbootStorageInfoPanel] 获取分区信息异常:", err);
      setError("获取分区信息失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  }, [device.serial, device.mode, parsePartitionInfo]);

  // 初始化时获取分区信息
  useEffect(() => {
    fetchPartitionInfo();
  }, [fetchPartitionInfo]);



  // 复制到剪贴板
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setStatusBarMessage({
        type: "success",
        message: `已复制 ${label} 到剪贴板`,
      });
    }).catch(err => {
      console.error("复制失败:", err);
      setStatusBarMessage({
        type: "error",
        message: `无法复制 ${label} 到剪贴板`,
      });
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchPartitionInfo();
  };

  // 处理分区选择
  const handlePartitionSelect = (partitionName: string, checked: boolean) => {
    setSelectedPartitions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(partitionName);
      } else {
        newSet.delete(partitionName);
      }
      return newSet;
    });
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPartitionNames = getFilteredPartitions().map(p => p.name);
      setSelectedPartitions(new Set(allPartitionNames));
    } else {
      setSelectedPartitions(new Set());
    }
  };

  // 获取过滤后的分区列表
  const getFilteredPartitions = useCallback(() => {
    let partitions: PartitionInfo[] = [];
    
    // 根据选择的分类获取分区
    if (selectedCategory === "all") {
      // 获取所有分类的分区
      partitionCategories.forEach(category => {
        partitions = [...partitions, ...category.partitions];
      });
    } else {
      // 获取特定分类的分区
      const category = partitionCategories.find(c => c.id === selectedCategory);
      if (category) {
        partitions = [...category.partitions];
      }
    }
    
    // 根据搜索词过滤
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      partitions = partitions.filter(partition => 
        partition.name.toLowerCase().includes(term) || 
        partition.description.toLowerCase().includes(term)
      );
    }
    
    // 根据选择的排序方式排序
    if (sortOrder === "name") {
      partitions.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "size") {
      partitions.sort((a, b) => {
        // 尝试将分区大小转换为数字进行比较
        const getSizeInBytes = (sizeStr: string): number => {
          const numStr = sizeStr.replace(/[^0-9.]/g, '');
          const num = parseFloat(numStr);
          if (isNaN(num)) return 0;
          
          if (sizeStr.includes('KB')) return num * 1024;
          if (sizeStr.includes('MB')) return num * 1024 * 1024;
          if (sizeStr.includes('GB')) return num * 1024 * 1024 * 1024;
          if (sizeStr.includes('B')) return num;
          return num;
        };
        
        return getSizeInBytes(b.size) - getSizeInBytes(a.size);
      });
    }
    
    return partitions;
  }, [partitionCategories, selectedCategory, searchTerm, sortOrder]);

  return (
    <div className={styles.noSelect}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {/* 统计信息 */}
        <Text size={400} style={{ marginLeft: '10px' }}>
          共 {partitionCategories.reduce((acc, category) => acc + category.partitions.length, 0)} 个分区，共
          {(() => {
            const totalBytes = partitionCategories.reduce((acc, category) => {
              return acc + category.partitions.reduce((sum, p) => {
                // 尝试将分区大小转换为数字，若无法转换则视为 0
                const sizeStr = p.size.replace(/[^0-9.]/g, '');
                const sizeNum = parseFloat(sizeStr);
                if (isNaN(sizeNum)) {
                  return sum;
                }
                // 根据单位调整大小值为字节
                if (p.size.includes('KB')) {
                  return sum + sizeNum * 1024;
                } else if (p.size.includes('MB')) {
                  return sum + sizeNum * 1024 * 1024;
                } else if (p.size.includes('GB')) {
                  return sum + sizeNum * 1024 * 1024 * 1024;
                } else if (p.size.includes('B')) {
                  return sum + sizeNum;
                }
                return sum;
              }, 0);
            }, 0);
            // 将总字节数转换为GB并保留两位小数
            return (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
          })()} GB
        </Text>

                  {/* 分类选择器 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              fontSize: '14px',
              fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
              color: '#242424',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color 0.2s',
              maxWidth: '100px',
            }}
            onFocus={(e) => e.target.style.borderColor = '#0078d4'}
            onBlur={(e) => e.target.style.borderColor = '#ccc'}
          >
            <option value="all">全部类型</option>
            {partitionCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        {/*排序*/}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            fontSize: '14px',
            fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
            color: '#242424',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.2s',
            maxWidth: '150px',
          }}
          onFocus={(e) => e.target.style.borderColor = '#0078d4'}
          onBlur={(e) => e.target.style.borderColor = '#ccc'}
        >
          <option value="name">按名称A-Z排序</option>
          <option value="name-reverse">按名称Z-A排序</option>
          <option value="size">按大小排序</option>
          <option value="size-reverse">按大小排序（倒序）</option>
          
        </select>

        {/* 搜索框 */}
        <Input
            placeholder="搜索分区名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            contentBefore={<SearchRegular />}
          />


        {/* 刷新按钮 */}
        <Button
          icon={<ArrowClockwiseRegular />}
          appearance="primary"
          onClick={handleRefresh}
          disabled={loading}
        >
        </Button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <Spinner size="medium" />
          <Text style={{ marginLeft: '10px' }}>正在获取分区信息...</Text>
        </div>
      )}

      {error && (
        <Card style={{ marginBottom: '16px', backgroundColor: '#fee', borderColor: '#fcc' }}>
          <Text color="red">{error}</Text>
        </Card>
      )}

      {!loading && !error && (
        <>
          {getFilteredPartitions().length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table aria-label="分区信息表格">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell style={{ width: '5%' }}>
                      <Checkbox
                        checked={selectedPartitions.size > 0 && selectedPartitions.size === getFilteredPartitions().length}
                        onChange={(_, data) => handleSelectAll(!!data.checked)}
                      />
                    </TableHeaderCell>
                    <TableHeaderCell style={{ width: '5%' }}>序号</TableHeaderCell>
                    <TableHeaderCell style={{ width: '20%' }}>分区名称</TableHeaderCell>
                    <TableHeaderCell style={{ width: '15%' }}>类型</TableHeaderCell>
                    <TableHeaderCell style={{ width: '15%' }}>大小</TableHeaderCell>
                    <TableHeaderCell style={{ width: '40%' }}>核心作用</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredPartitions().map((partition, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPartitions.has(partition.name)}
                          onChange={(_, data) => handlePartitionSelect(partition.name, !!data.checked)}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TableCellLayout>
                          {partition.name}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>{partition.type}</TableCell>
                      <TableCell>{partition.size}</TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Text style={{ flex: 1 }}>{partition.description}</Text>
                          <Dialog>
                            <DialogTrigger disableButtonEnhancement>
                              <Button
                                icon={<InfoRegular />}
                                appearance="subtle"
                                size="small"
                                aria-label="详细信息"
                              />
                            </DialogTrigger>
                            <DialogSurface>
                              <DialogBody>
                                <DialogTitle>{partition.name} 分区详情</DialogTitle>
                                <DialogContent>
                                  <div style={{ marginBottom: '10px' }}>
                                    <Text weight="bold">分区名称：</Text>
                                    <Text>{partition.name}</Text>
                                  </div>
                                  <div style={{ marginBottom: '10px' }}>
                                    <Text weight="bold">类型：</Text>
                                    <Text>{partition.type}</Text>
                                  </div>
                                  <div style={{ marginBottom: '10px' }}>
                                    <Text weight="bold">大小：</Text>
                                    <Text>{partition.size}</Text>
                                  </div>
                                  <div>
                                    <Text weight="bold">核心作用：</Text>
                                    <Text>{partition.description}</Text>
                                  </div>
                                </DialogContent>
                                <DialogActions>
                                  <Button
                                    icon={<CopyRegular />}
                                    onClick={() => handleCopy(partition.name, "分区名称")}
                                  >
                                    复制名称
                                  </Button>
                                  <Button
                                    icon={<CopyRegular />}
                                    onClick={() => handleCopy(partition.size, "分区大小")}
                                  >
                                    复制大小
                                  </Button>
                                  <DialogTrigger disableButtonEnhancement>
                                    <Button appearance="primary">关闭</Button>
                                  </DialogTrigger>
                                </DialogActions>
                              </DialogBody>
                            </DialogSurface>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Card style={{ textAlign: 'center', padding: '20px' }}>
              <Text>没有找到匹配的分区信息</Text>
            </Card>
          )}
        </>
      )}

      {!loading && !error && partitionCategories.length > 0 && partitionCategories.every(category => category.partitions.length === 0) && (
        <Card style={{ textAlign: 'center', padding: '20px' }}>
          <Text>未获取到分区信息</Text>
          <Button
            icon={<ArrowClockwiseRegular />}
            appearance="primary"
            onClick={handleRefresh}
            style={{ marginTop: '10px' }}
          >
            重试
          </Button>
        </Card>
      )}
    </div>
  );
};