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
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  // 预定义分区描述和分类
  const getPartitionInfo = useCallback((name: string): { category: string; description: string } => {
    // 转换为小写以便匹配
    const lowerName = name.toLowerCase();
    
    // 启动与引导类分区
    if (lowerName.startsWith("xbl_config")) return { category: "boot", description: t('partition_desc.xbl_config') };
    if (lowerName.startsWith("xbl")) return { category: "boot", description: t('partition_desc.xbl') };
    if (lowerName.startsWith("abl")) return { category: "boot", description: t('partition_desc.abl') };
    if (lowerName.startsWith("boot")) return { category: "boot", description: t('partition_desc.boot') };
    if (lowerName.startsWith("dtbo")) return { category: "boot", description: t('partition_desc.dtbo') };
    if (lowerName.startsWith("vendor_boot")) return { category: "boot", description: t('partition_desc.vendor_boot') };
    if (lowerName.startsWith("imagefv")) return { category: "boot", description: t('partition_desc.imagefv') };
    if (lowerName.startsWith("uefisecapp")) return { category: "boot", description: t('partition_desc.uefisecapp') };
    if (lowerName.startsWith("vbmeta_system")) return { category: "boot", description: t('partition_desc.vbmeta_system') };
    if (lowerName.startsWith("vbmeta")) return { category: "boot", description: t('partition_desc.vbmeta') };

    // 通信与基带类分区
    if (lowerName.startsWith("modemst")) return { category: "communication", description: t('partition_desc.modemst') };
    if (lowerName.startsWith("modem")) return { category: "communication", description: t('partition_desc.modem') };
    if (lowerName === "fsg") return { category: "communication", description: t('partition_desc.fsg') };
    if (lowerName === "fsc") return { category: "communication", description: t('partition_desc.fsc') };
    if (lowerName.startsWith("bluetooth")) return { category: "communication", description: t('partition_desc.bluetooth') };

    // 系统与用户数据类分区
    if (lowerName === "super") return { category: "system", description: t('partition_desc.super') };
    if (lowerName === "userdata") return { category: "system", description: t('partition_desc.userdata') };
    if (lowerName === "cust") return { category: "system", description: t('partition_desc.cust') };
    if (lowerName === "logo") return { category: "system", description: t('partition_desc.logo') };
    if (lowerName === "splash") return { category: "system", description: t('partition_desc.splash') };

    // 安全与配置类分区
    if (lowerName.startsWith("keymaster")) return { category: "security", description: t('partition_desc.keymaster') };
    if (lowerName === "vm-keystore") return { category: "security", description: t('partition_desc.vm-keystore') };
    if (lowerName === "secdata") return { category: "security", description: t('partition_desc.secdata') };
    if (lowerName === "storsec") return { category: "security", description: t('partition_desc.storsec') };
    if (lowerName === "frp") return { category: "security", description: t('partition_desc.frp') };
    if (lowerName === "devinfo") return { category: "security", description: t('partition_desc.devinfo') };
    if (lowerName.startsWith("persistbak")) return { category: "security", description: t('partition_desc.persistbak') };
    if (lowerName.startsWith("persist")) return { category: "security", description: t('partition_desc.persist') };

    // 调试与日志类分区
    if (lowerName === "logdump") return { category: "debug", description: t('partition_desc.logdump') };
    if (lowerName === "minidump") return { category: "debug", description: t('partition_desc.minidump') };
    if (lowerName === "rawdump") return { category: "debug", description: t('partition_desc.rawdump') };
    if (lowerName === "oops") return { category: "debug", description: t('partition_desc.oops') };
    if (lowerName === "dbg") return { category: "debug", description: t('partition_desc.dbg') };

    // 备份与恢复类分区
    if (lowerName === "rescue") return { category: "recovery", description: t('partition_desc.rescue') };
    if (lowerName === "ffu") return { category: "recovery", description: t('partition_desc.ffu') };
    if (lowerName === "msadp" || lowerName === "apdp") return { category: "recovery", description: t('partition_desc.apdp') };

    // 硬件与芯片专属分区
    if (lowerName.startsWith("aop")) return { category: "hardware", description: t('partition_desc.aop') };
    if (lowerName.startsWith("tz")) return { category: "hardware", description: t('partition_desc.tz') };
    if (lowerName.startsWith("hyp")) return { category: "hardware", description: t('partition_desc.hyp') };
    if (lowerName.startsWith("cmnlib")) return { category: "hardware", description: t('partition_desc.cmnlib') };
    if (lowerName.startsWith("devcfg")) return { category: "hardware", description: t('partition_desc.devcfg') };
    if (lowerName.startsWith("qupfw")) return { category: "hardware", description: t('partition_desc.qupfw') };
    if (lowerName.startsWith("dsp")) return { category: "hardware", description: t('partition_desc.dsp') };
    if (lowerName === "ddr") return { category: "hardware", description: t('partition_desc.ddr') };
    if (lowerName === "mdmddr") return { category: "hardware", description: t('partition_desc.mdmddr') };
    if (lowerName === "cdt") return { category: "hardware", description: t('partition_desc.cdt') };

    // 厂商自定义分区
    if (lowerName.startsWith("bk41")) return { category: "vendor", description: t('partition_desc.bk41') };
    if (lowerName.startsWith("bk42") || lowerName.startsWith("bk43") || lowerName.startsWith("bk44") || lowerName.startsWith("bk51")) return { category: "vendor", description: t('partition_desc.bk42') };
    if (lowerName.startsWith("bk")) return { category: "vendor", description: t('partition_desc.bk') };
    if (lowerName === "countrycode") return { category: "vendor", description: t('partition_desc.countrycode') };
    if (lowerName.startsWith("featenabler")) return { category: "vendor", description: t('partition_desc.featenabler') };
    if (lowerName.startsWith("limits")) return { category: "vendor", description: t('partition_desc.limits') };
    if (lowerName === "misc") return { category: "vendor", description: t('partition_desc.misc') };
    if (lowerName.startsWith("multiimgqti")) return { category: "vendor", description: t('partition_desc.multiimgqti') };
    if (lowerName.startsWith("multiimgoem")) return { category: "vendor", description: t('partition_desc.multiimgoem') };
    if (lowerName === "oem_misc1") return { category: "vendor", description: t('partition_desc.oem_misc1') };
    if (lowerName === "ssd") return { category: "vendor", description: t('partition_desc.ssd') };
    if (lowerName === "spunvm") return { category: "vendor", description: t('partition_desc.spunvm') };
    if (lowerName === "switch") return { category: "vendor", description: t('partition_desc.switch') };
    if (lowerName === "uefivarstore") return { category: "vendor", description: t('partition_desc.uefivarstore') };
    if (lowerName === "vm-data") return { category: "vendor", description: t('partition_desc.vm-data') };
    if (lowerName.startsWith("mdm1m9kefs")) return { category: "vendor", description: t('partition_desc.mdm1m9kefs') };

    // 默认归类为其他分区
    return { category: "other", description: t('fastboot_storage.unknown_partition') };
  }, [t]);

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
      setError(t('fastboot_storage.no_device_mode'));
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
            name: t('fastboot_storage.category_boot'),
            description: t('fastboot_storage.category_boot_desc'),
            partitions: categories.boot,
          },
          {
            id: "communication",
            name: t('fastboot_storage.category_communication'),
            description: t('fastboot_storage.category_communication_desc'),
            partitions: categories.communication,
          },
          {
            id: "system",
            name: t('fastboot_storage.category_system'),
            description: t('fastboot_storage.category_system_desc'),
            partitions: categories.system,
          },
          {
            id: "security",
            name: t('fastboot_storage.category_security'),
            description: t('fastboot_storage.category_security_desc'),
            partitions: categories.security,
          },
          {
            id: "debug",
            name: t('fastboot_storage.category_debug'),
            description: t('fastboot_storage.category_debug_desc'),
            partitions: categories.debug,
          },
          {
            id: "recovery",
            name: t('fastboot_storage.category_recovery'),
            description: t('fastboot_storage.category_recovery_desc'),
            partitions: categories.recovery,
          },
          {
            id: "hardware",
            name: t('fastboot_storage.category_hardware'),
            description: t('fastboot_storage.category_hardware_desc'),
            partitions: categories.hardware,
          },
          {
            id: "vendor",
            name: t('fastboot_storage.category_vendor'),
            description: t('fastboot_storage.category_vendor_desc'),
            partitions: categories.vendor,
          },
          {
            id: "other",
            name: t('fastboot_storage.category_other'),
            description: t('fastboot_storage.category_other_desc'),
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
      setError(t('fastboot_storage.get_info_failed', { error: err instanceof Error ? err.message : t('common.unknown_error') }));
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
        message: t('fastboot_storage.copied_to_clipboard', { label }),
      });
    }).catch(err => {
      console.error("复制失败:", err);
      setStatusBarMessage({
        type: "error",
        message: t('fastboot_storage.copy_failed', { label }),
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
          {t('fastboot_storage.total_info', {
            count: partitionCategories.reduce((acc, category) => acc + category.partitions.length, 0),
            size: (() => {
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
              return (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
            })()
          })}
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
            <option value="all">{t('fastboot_storage.all_types')}</option>
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
          <option value="name">{t('fastboot_storage.sort_name_az')}</option>
          <option value="name-reverse">{t('fastboot_storage.sort_name_za')}</option>
          <option value="size">{t('fastboot_storage.sort_size')}</option>
          <option value="size-reverse">{t('fastboot_storage.sort_size_desc')}</option>
          
        </select>

        {/* 搜索框 */}
        <Input
            placeholder={t('fastboot_storage.search_placeholder')}
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
          <Text style={{ marginLeft: '10px' }}>{t('fastboot_storage.fetching_info')}</Text>
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
                    <TableHeaderCell style={{ width: '5%' }}>{t('fastboot_storage.ordinal')}</TableHeaderCell>
                    <TableHeaderCell style={{ width: '20%' }}>{t('fastboot_storage.partition_name')}</TableHeaderCell>
                    <TableHeaderCell style={{ width: '15%' }}>{t('fastboot_storage.partition_type')}</TableHeaderCell>
                    <TableHeaderCell style={{ width: '15%' }}>{t('fastboot_storage.partition_size')}</TableHeaderCell>
                    <TableHeaderCell style={{ width: '40%' }}>{t('fastboot_storage.partition_description')}</TableHeaderCell>
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
                                aria-label={t('fastboot_storage.detail_info')}
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