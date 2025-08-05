import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  ProgressBar,
  Tooltip,
  useToastController,
  Toast,
  ToastTitle,
  Toaster,
  Spinner,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  Battery024Regular,
  Storage24Regular,
  ChevronRight24Regular,

  DesktopPulse24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { DeviceService } from "../../services/deviceService";

// 格式化存储大小
const formatStorageSize = (sizeInMB: number): string => {
  if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  }
  return `${sizeInMB.toFixed(0)} MB`;
};

// 内存、存储和电池信息接口
interface MemoryStorageInfo {
  memory: {
    memory_total: number | null;
    memory_used: number | null;
    memory_available: number | null;
    memory_usage_percent: number | null;
  };
  storage: {
    storage_total: number | null;
    storage_used: number | null;
    storage_available: number | null;
    storage_usage_percent: number | null;
  };
  battery: {
    battery_health_percent: number | null;
    battery_actual_capacity: number | null;
    battery_design_capacity: number | null;
    battery_health_status: string | null;
    battery_level: number | null;
    battery_temperature: number | null;
    health_calculation_method: string | null;
    charge_counter_available: boolean;
  };
}

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px", // 适中的圆角，保持现代感
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)", // 更轻微的阴影，避免过于突出
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", // 更快的过渡动画
    position: "relative",
    overflow: "hidden",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)", // 悬停时轻微增强阴影
    },
  },
  content: {
    padding: "12px", // 减少内边距，使布局更紧凑
    paddingTop: "10px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px", // 减少间距，压缩垂直空间
  },
  // 设备名称和进度条的顶部区域
  deviceTopSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px", // 减少间距
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px", // 进一步减小圆角
    padding: "12px", // 减少内边距，使布局更紧凑
    marginBottom: "12px", // 减少底部间距
    backgroundColor: "var(--colorNeutralBackground2)", // 添加背景色区分
    transition: "all 0.2s ease", // 添加过渡动画
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)", // 悬停效果
    },
    "@media (max-width: 480px)": {
      flexDirection: "column", // 超小屏幕改为垂直布局
      gap: "8px", // 移动端进一步减少间距
      padding: "10px", // 移动端减少内边距
    },
  },
  // 左侧设备名称区域 - 单行布局优化
  deviceNameSection: {
    flex: "1 1 auto",
    display: "flex",
    alignItems: "center", // 改为水平对齐
    gap: "12px", // 设备名称和副标题之间的间距
    minWidth: 0, // 防止文字溢出
  },
  deviceHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px", // 减少间距
    marginBottom: "0", // 移除底部间距，实现单行布局
  },
  deviceNameText: {
    display: "flex",
    alignItems: "center", // 改为水平对齐
    gap: "10px", // 名称和副标题之间的间距
    minWidth: 0,
  },
  deviceName: {
    fontSize: "18px", // 减小字体以适应单行布局
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.2", // 减少行高以压缩垂直空间
    wordBreak: "break-word",
    marginBottom: "0", // 移除底部间距
    whiteSpace: "nowrap", // 防止换行
    overflow: "hidden",
    textOverflow: "ellipsis", // 文字过长时显示省略号
    maxWidth: "200px", // 限制最大宽度
    flexShrink: 1, // 允许压缩
    "@media (max-width: 768px)": {
      fontSize: "16px", // 移动端进一步减小字体
      maxWidth: "150px",
    },
    "@media (max-width: 480px)": {
      fontSize: "14px", // 超小屏幕更小字体
      maxWidth: "120px",
    },
  },
  deviceSubtitle: {
    fontSize: "10px", // 减小字体以适应单行布局
    color: "var(--colorNeutralForeground2)",
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
    marginTop: "0", // 移除顶部间距
    wordBreak: "break-word",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "3px 6px", // 减少内边距以压缩高度
    borderRadius: "4px", // 减小圆角
    border: "1px solid var(--colorNeutralStroke3)",
    display: "inline-block",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap", // 防止换行
    overflow: "hidden",
    textOverflow: "ellipsis", // 文字过长时显示省略号
    maxWidth: "180px", // 限制最大宽度
    flexShrink: 1, // 允许压缩
    "@media (max-width: 768px)": {
      fontSize: "9px", // 移动端进一步减小字体
      maxWidth: "140px",
      padding: "2px 4px", // 移动端减少内边距
    },
    "@media (max-width: 480px)": {
      fontSize: "8px", // 超小屏幕更小字体
      maxWidth: "100px",
      padding: "2px 4px",
    },
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3Hover)",
    },
  },
  // 设备名称区域的查看详情按钮 - 单行布局优化
  deviceDetailsButton: {
    marginLeft: "5px",
    minWidth: "70px", // 减少最小宽度
    height: "28px", // 稍微增加高度以保持可点击性
    fontSize: "11px", // 减小字体
    borderRadius: "6px", // 减小圆角
  },
  // 标题栏提示文字 - 单行布局优化
  headerHint: {
    fontSize: "10px", // 减小字体以适应单行布局
    color: "var(--colorNeutralForeground3)",
    fontWeight: "400",
    marginLeft: "auto", // 自动左边距，推到右侧
    marginRight: "12px", // 与按钮保持间距
    fontStyle: "italic",
    whiteSpace: "nowrap", // 防止换行
    flexShrink: 0, // 防止被压缩
    "@media (max-width: 768px)": {
      fontSize: "9px", // 移动端减小字体
      marginRight: "8px",
    },
    "@media (max-width: 480px)": {
      display: "none", // 超小屏幕隐藏提示文字以节省空间
    },
  },
  // 右侧进度条区域 - 两列布局
  progressSection: {
    flex: "0 0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 两列布局
    gap: "12px",
    minWidth: "280px", // 增加宽度以容纳两列
    maxWidth: "320px",
    "@media (max-width: 768px)": {
      minWidth: "240px", // 移动端减少最小宽度
      maxWidth: "280px",
      gap: "10px",
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr", // 超小屏幕改为单列
      minWidth: "180px",
      maxWidth: "220px",
      gap: "8px",
    },
  },
  // 进度条列容器
  progressColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr", // 保持四列布局
    gap: "10px", // 减少间距，使布局更紧凑
    "@media (max-width: 1200px)": {
      gridTemplateColumns: "1fr 1fr 1fr", // 中等屏幕改为三列
      gap: "10px", // 保持一致的间距
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 1fr", // 小屏幕改为两列
      gap: "8px", // 小屏幕减少间距
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr", // 超小屏幕改为单列
      gap: "8px", // 超小屏幕保持较小间距
    },
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px", // 减少间距，使布局更紧凑
    padding: "8px", // 减少内边距，压缩空间
    borderRadius: "6px", // 减小圆角
    backgroundColor: "var(--colorNeutralBackground2)", // 添加背景色
    border: "1px solid var(--colorNeutralStroke3)", // 添加边框
    transition: "all 0.2s ease", // 添加过渡动画
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)", // 悬停效果
      border: "1px solid var(--colorNeutralStroke2)", // 悬停时边框颜色
    },
  },
  infoLabel: {
    fontSize: "10px", // 进一步减小标签字体以适应紧凑布局
    fontWeight: "600",
    color: "var(--colorNeutralForeground2)", // 使用次要文本色，提升层次感
    textTransform: "uppercase", // 大写字母，增强标签感
    letterSpacing: "0.05em", // 增加字母间距
    marginBottom: "1px", // 减少底部间距
    lineHeight: "1.2", // 减少行高
  },
  infoValue: {
    fontSize: "13px", // 稍微减小内容字体以适应紧凑布局
    fontWeight: "500",
    color: "var(--colorNeutralForeground1)", // 使用主要文本色，提升可读性
    display: "flex",
    alignItems: "center",
    gap: "4px", // 减少间距
    cursor: "pointer", // 鼠标指针样式
    padding: "3px 4px", // 减少内边距
    borderRadius: "3px", // 减小圆角
    transition: "all 0.2s ease", // 平滑过渡效果
    lineHeight: "1.3", // 减少行高
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)", // 悬停背景色
      color: "var(--colorBrandForeground1)", // 悬停时使用品牌色
    },
    ":active": {
      backgroundColor: "var(--colorNeutralBackground3Pressed)", // 点击时背景色
    },
  },
  progressItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px", // 减少间距，使布局更紧凑
  },
  progressGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "12px", // 减少间距
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 1fr",
      gap: "10px", // 减少移动端间距
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
      gap: "8px", // 减少超小屏幕间距
    },
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: "11px", // 减小字体以适应紧凑布局
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    gap: "4px", // 减少图标和文字间距
    lineHeight: "1.2", // 减少行高
  },
  progressValue: {
    fontSize: "11px", // 减小字体以适应紧凑布局
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "0.02em", // 添加字母间距，提升数字可读性
    lineHeight: "1.2", // 减少行高
  },
  batteryIcon: {
    color: "var(--colorPaletteGreenForeground1)",
  },
  batteryIconLow: {
    color: "var(--colorPaletteRedForeground1)",
  },
  batteryIconMedium: {
    color: "var(--colorPaletteYellowForeground1)",
  },

});

interface DeviceCoreInfoCardProps {
  device: DeviceInfo;
  onShowDetails: () => void;
  onCopyInfo: () => void;
}

const DeviceCoreInfoCard: React.FC<DeviceCoreInfoCardProps> = ({
  device,
  onShowDetails,
  onCopyInfo,
}) => {
  const styles = useStyles();
  const { dispatchToast } = useToastController();
  const [deviceService] = useState(() => new DeviceService());
  const [memoryStorageInfo, setMemoryStorageInfo] = useState<MemoryStorageInfo | null>(null);
  const [isLoadingMemoryStorage, setIsLoadingMemoryStorage] = useState(false);

  // 获取内存和存储信息
  const fetchMemoryStorageInfo = async () => {
    if (!device.connected || !device.serial) {
      return;
    }

    setIsLoadingMemoryStorage(true);
    try {
      const info = await deviceService.getDeviceMemoryStorageInfo(device.serial);
      setMemoryStorageInfo(info);
    } catch (error) {
      console.error("Failed to fetch memory/storage info:", error);
      setMemoryStorageInfo(null);
    } finally {
      setIsLoadingMemoryStorage(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchMemoryStorageInfo();
  }, [device.serial, device.connected]);

  // 复制文本到剪贴板的函数
  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      dispatchToast(
        <Toast>
          <ToastTitle>复制成功</ToastTitle>
          已复制 "{label}": {value}
        </Toast>,
        { intent: "success", timeout: 2000 }
      );
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>复制失败</ToastTitle>
          无法访问剪贴板
        </Toast>,
        { intent: "error", timeout: 2000 }
      );
    }
  };

  const getDeviceName = () => {
    // 优先显示市场名称，如 "Redmi K40"
    if (device.properties?.marketName) {
      return device.properties.marketName;
    }
    // 如果没有市场名称，尝试组合品牌和型号
    if (device.properties?.brand && device.properties?.model) {
      // 如果型号已经包含品牌信息，直接返回型号
      if (device.properties.model.toLowerCase().includes(device.properties.brand.toLowerCase())) {
        return device.properties.model;
      }
      return `${device.properties.brand} ${device.properties.model}`;
    }
    if (device.properties?.model) {
      return device.properties.model;
    }
    return "未知设备";
  };

  const getDeviceSubtitle = () => {
    const parts = [];
    // 显示完整的型号信息，如 "Redmi M2012K11AC (alioth)"
    if (device.properties?.brand && device.properties?.model) {
      // 如果型号不包含品牌，则添加品牌前缀
      if (!device.properties.model.toLowerCase().includes(device.properties.brand.toLowerCase())) {
        parts.push(`${device.properties.brand} ${device.properties.model}`);
      } else {
        parts.push(device.properties.model);
      }
    } else if (device.properties?.model) {
      parts.push(device.properties.model);
    }

    // 添加设备代号
    if (device.properties?.deviceName) {
      parts.push(`${device.properties.deviceName}`);
    }

    return parts.length > 0 ? parts.join(" 代号: ") : device.serial;
  };

  const getBatteryIcon = (level?: number) => {
    if (level === undefined) return <Battery024Regular />;
    if (level <= 20) return <Battery024Regular className={styles.batteryIconLow} />;
    if (level <= 50) return <Battery024Regular className={styles.batteryIconMedium} />;
    return <Battery024Regular className={styles.batteryIcon} />;
  };

  const getBatteryColor = (level?: number): "success" | "warning" | "error" | undefined => {
    if (level === undefined) return undefined;
    if (level <= 20) return "error";
    if (level <= 50) return "warning";
    return "success";
  };



  // 获取内存使用率颜色
  const getMemoryColor = (usage: number): "success" | "warning" | "error" => {
    if (usage > 90) return "error";
    if (usage > 80) return "warning";
    return "success";
  };

  // 获取存储使用率颜色
  const getStorageColor = (usage: number): "success" | "warning" | "error" => {
    if (usage > 80) return "error";
    if (usage > 60) return "warning";
    return "success";
  };

  const getStorageInfo = () => {
    if (memoryStorageInfo?.storage) {
      const { storage_total, storage_used, storage_usage_percent } = memoryStorageInfo.storage;

      if (storage_total && storage_used && storage_usage_percent !== null) {
        return {
          used: storage_usage_percent,
          total: 100,
          text: `${formatStorageSize(storage_used)} / ${formatStorageSize(storage_total)}`,
          usedGB: formatStorageSize(storage_used),
          totalGB: formatStorageSize(storage_total),
        };
      }
    }

    // 降级显示：如果没有真实数据，显示未知状态
    return {
      used: 0,
      total: 100,
      text: "获取中...",
      usedGB: "未知",
      totalGB: "未知",
    };
  };

  // 获取设备温度信息
  const getDeviceTemperature = (): {
    temperature: number | null;
    temperaturePercent: number | null;
    status: string;
  } => {
    if (memoryStorageInfo?.battery) {
      const { battery_temperature } = memoryStorageInfo.battery;

      // 如果有电池温度数据
      if (battery_temperature !== null && battery_temperature !== undefined) {
        // 验证温度值的合理性（-20°C 到 100°C）
        if (battery_temperature >= -20 && battery_temperature <= 100) {
          // 计算温度进度条百分比（0°C - 100°C 范围）
          const tempPercent = Math.max(0, Math.min(100, battery_temperature));

          return {
            temperature: battery_temperature,
            temperaturePercent: tempPercent,
            status: "正常",
          };
        } else {
          return {
            temperature: battery_temperature,
            temperaturePercent: null,
            status: "温度异常",
          };
        }
      }
    }

    // 没有温度数据
    return {
      temperature: null,
      temperaturePercent: null,
      status: isLoadingMemoryStorage ? "获取中..." : "温度获取失败",
    };
  };

  // 获取温度颜色指示
  const getTemperatureColor = (temperature: number): "success" | "warning" | "error" => {
    if (temperature < 45) return "success";   // 绿色：正常温度 (<45°C)
    if (temperature < 65) return "warning";   // 黄色：温度偏高 (45-65°C)
    return "error";                           // 红色：温度过高 (>65°C)
  };

  // 获取RAM使用情况
  const getMemoryUsage = () => {
    if (memoryStorageInfo?.memory) {
      const { memory_total, memory_used, memory_usage_percent } = memoryStorageInfo.memory;

      if (memory_total && memory_used && memory_usage_percent !== null) {
        return {
          used: memory_usage_percent,
          usedGB: formatStorageSize(memory_used),
          totalGB: formatStorageSize(memory_total),
        };
      }
    }

    // 降级显示：如果没有真实数据，显示获取中状态
    return {
      used: 0,
      usedGB: "获取中...",
      totalGB: "获取中...",
    };
  };

  const storageInfo = getStorageInfo();
  const temperatureInfo = getDeviceTemperature(); // 获取温度信息
  const memoryUsage = getMemoryUsage();

  return (
    <>
      <Toaster />
      <Card className={styles.card}>
        <CardHeader
          header={
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              minHeight: "32px", // 设置最小高度以压缩垂直空间
              padding: "4px 0" // 减少垂直内边距
            }}>
              {/* 设备图标 */}
              <Phone24Regular style={{
                fontSize: "20px", // 减小图标尺寸
                color: "var(--colorBrandForeground1)",
                flexShrink: 0
              }} />

              {/* 设备名称 */}
              <Text className={styles.deviceName}>{getDeviceName()}</Text>

              {/* 设备副标题 */}
              <Text className={styles.deviceSubtitle}>{getDeviceSubtitle()}</Text>

              {/* 提示文字 */}
              <Text className={styles.headerHint}>点击信息即可复制</Text>
            </div>
          }
          action={
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px", // 减少按钮间距
              flexShrink: 0 // 防止按钮被压缩
            }}>
              {device.connected && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={isLoadingMemoryStorage ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                  onClick={fetchMemoryStorageInfo}
                  disabled={isLoadingMemoryStorage}
                  title="刷新内存和存储信息"
                  style={{
                    minWidth: "32px", // 设置最小宽度
                    height: "28px" // 与详情按钮保持一致的高度
                  }}
                />
              )}
              <Button
                appearance="primary"
                icon={<ChevronRight24Regular />}
                iconPosition="after"
                onClick={onShowDetails}
                className={styles.deviceDetailsButton}
                size="small"
              >
                查看详情
              </Button>
            </div>
          }
        />
        
      
      <div className={styles.content}>
        {/* 设备状态指标区域 */}
        <div className={styles.deviceTopSection}>
          <div className={styles.progressGrid}>
            {/* 电池电量 */}
            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <div className={styles.progressLabel}>
                  {getBatteryIcon(device.properties?.batteryLevel)}
                  <Text>电池电量</Text>
                </div>
                <Text className={styles.progressValue}>{device.properties?.batteryLevel || 0}%</Text>
              </div>
              <ProgressBar
                value={(device.properties?.batteryLevel || 0) / 100}
                color={getBatteryColor(device.properties?.batteryLevel)}
                thickness="medium"
              />
            </div>

            {/* 设备温度 */}
            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <div className={styles.progressLabel}>
                  <DesktopPulse24Regular />
                  <Text>设备温度</Text>
                </div>
                <Text className={styles.progressValue}>
                  {temperatureInfo.temperature !== null ? `${temperatureInfo.temperature.toFixed(1)}°C` : temperatureInfo.status}
                </Text>
              </div>
              <ProgressBar
                value={(temperatureInfo.temperaturePercent || 0) / 100}
                color={temperatureInfo.temperature ? getTemperatureColor(temperatureInfo.temperature) : "success"}
                thickness="medium"
              />
            </div>

            {/* 内部存储 */}
            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <div className={styles.progressLabel}>
                  <Storage24Regular />
                  <Text>内部存储</Text>
                </div>
                <Text className={styles.progressValue}>{storageInfo.used}% 已使用</Text>
              </div>
              <ProgressBar
                value={storageInfo.used / 100}
                color={getStorageColor(storageInfo.used)}
                thickness="medium"
              />
            </div>

            {/* 运行内存 */}
            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <div className={styles.progressLabel}>
                  <DesktopPulse24Regular />
                  <Text>运行内存</Text>
                </div>
                <Text className={styles.progressValue}>{memoryUsage.used}% 已使用</Text>
              </div>
              <ProgressBar
                value={memoryUsage.used / 100}
                color={getMemoryColor(memoryUsage.used)}
                thickness="medium"
              />
            </div>
          </div>
        </div>

        {/* 核心信息网格 */}
        <div className={styles.infoGrid}>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>Bootloader 锁</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(device.properties?.bootloaderLocked === "false" ? "unlocked" : device.properties?.bootloaderLocked === "true" ? "locked" : "unlocked", "Bootloader 锁")}
            >
              <Text>{device.properties?.bootloaderLocked === "false" ? "unlocked" : device.properties?.bootloaderLocked === "true" ? "locked" : "unlocked"}</Text>
            </div>
          </div>



          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>A/B槽位</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue("A槽位", "A/B槽位")}
            >
              <Text>A槽位</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>系统</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(`Android ${device.properties?.androidVersion || "15"}(${device.properties?.sdkVersion || "35"}) V`, "系统")}
            >
              <Text>Android {device.properties?.androidVersion || "15"}({device.properties?.sdkVersion || "35"}) V</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>CPU 架构</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(device.properties?.cpuAbi || "arm64-v8a", "CPU 架构")}
            >
              <Text>{device.properties?.cpuAbi || "arm64-v8a"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>CPU 代号</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(device.properties?.hardware || "kona", "CPU 代号")}
            >
              <Text>{device.properties?.hardware || "kona"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>分辨率</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(device.properties?.screenResolution || device.properties?.displaySize || "1080x2400", "分辨率")}
            >
              <Text>{device.properties?.screenResolution || device.properties?.displaySize || "1080x2400"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>显示密度</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(device.properties?.lcdDensity || "432", "显示密度")}
            >
              <Text>{device.properties?.lcdDensity || "432"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>闪存类型</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue("UFS", "闪存类型")}
            >
              <Text>UFS</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>主板 ID</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue("1560889028", "主板 ID")}
            >
              <Text>1560889028</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>平台</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(`${device.properties?.socManufacturer || "Qualcomm Technologies, Inc"} ${device.properties?.socModel || "SM8250"}`, "平台")}
            >
              <Text>{device.properties?.socManufacturer || "Qualcomm Technologies, Inc"} {device.properties?.socModel || "SM8250"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>编译版本</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue(device.properties?.buildDisplayId || device.properties?.buildId || "OS2.0.105.0.VOCCNXM", "编译版本")}
            >
              <Text>{device.properties?.buildDisplayId || device.properties?.buildId || "OS2.0.105.0.VOCCNXM"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>内核版本</Text>
            <div
              className={styles.infoValue}
              onClick={() => handleCopyValue("4.19.273VK-X-10868b24-miui-g53c7165d9aea", "内核版本")}
            >
              <Text>4.19.273VK-X-10868b24-miui-g53c7165d9aea</Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
    </>
  );
};

export default DeviceCoreInfoCard;
