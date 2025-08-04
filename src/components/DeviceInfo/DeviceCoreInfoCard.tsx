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
    borderRadius: "16px", // 更大的圆角，更现代
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)", // 更柔和的阴影
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", // 更流畅的动画
    position: "relative",
    overflow: "hidden",
  },
  content: {
    padding: "16px", // 增加内边距，更舒适
    paddingTop: "14px", // 为顶部装饰条留出空间
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px", // 增加间距
  },
  // 设备名称和进度条的顶部区域
  deviceTopSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "16px",
    padding: "10px",
    marginBottom: "10px",
    "@media (max-width: 480px)": {
      flexDirection: "column", // 超小屏幕改为垂直布局
      gap: "12px",
    },
  },
  // 左侧设备名称区域
  deviceNameSection: {
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    minWidth: 0, // 防止文字溢出
  },
  deviceHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // 设备名称和按钮分布在两端
    gap: "12px",
    marginBottom: "6px",
  },
  deviceNameText: {
    flex: "1 1 auto",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  deviceName: {
    fontSize: "20px", // 增大字体
    fontWeight: "700", // 更粗的字体
    color: "var(--colorBrandForeground1)", // 使用品牌色
    lineHeight: "1.2",
    wordBreak: "break-word",
    marginBottom: "4px",
  },
  deviceSubtitle: {
    fontSize: "13px", // 稍微增大
    color: "var(--colorNeutralForeground3)",
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
    marginTop: "2px",
    wordBreak: "break-word",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "inline-block",
  },
  // 设备名称区域的查看详情按钮
  deviceDetailsButton: {
    marginLeft: "5px",
    minWidth: "80px",
    height: "24px",
    fontSize: "12px",
  },
  // 标题栏提示文字
  headerHint: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)", // 较淡的颜色
    fontWeight: "400",
    marginLeft: "8px",
    fontStyle: "italic", // 斜体强调
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
    gridTemplateColumns: "1fr 1fr 1fr 1fr", // 改为四列布局
    gap: "12px",
    "@media (max-width: 1200px)": {
      gridTemplateColumns: "1fr 1fr 1fr", // 中等屏幕改为三列
      gap: "10px",
    },
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 1fr", // 小屏幕改为两列
      gap: "8px",
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr", // 超小屏幕改为单列
      gap: "6px",
    },
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px", // 减少间距
  },
  infoLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#000000", // 标题为黑色
    textTransform: "none",
    letterSpacing: "0px",
    marginBottom: "4px",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--colorBrandForeground1)", // 内容为主色调蓝色
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer", // 鼠标指针样式
    padding: "2px 4px", // 增加点击区域
    borderRadius: "3px", // 圆角
    transition: "all 0.2s ease", // 平滑过渡效果
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)", // 悬停背景色
      textDecoration: "underline", // 悬停下划线
    },
    ":active": {
      backgroundColor: "var(--colorNeutralBackground2Pressed)", // 点击时背景色
    },
  },
  progressItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: "11px", // 恢复原来的字体大小
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  progressValue: {
    fontSize: "11px", // 恢复原来的字体大小
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
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
          image={<Phone24Regular />}
          header={
            <div style={{ display: "flex", alignItems: "center" }}>
              <Text weight="semibold">设备概览</Text>
                <Button
                appearance="primary"
                icon={<ChevronRight24Regular />}
                iconPosition="after"
                onClick={onShowDetails}
                className={styles.deviceDetailsButton}
                size="small"
              >
                查看全部参数
              </Button>
              <Text className={styles.headerHint}>点击对应的值即可复制</Text>
            </div>
            
          }
          action={
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {device.connected && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={isLoadingMemoryStorage ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                  onClick={fetchMemoryStorageInfo}
                  disabled={isLoadingMemoryStorage}
                  title="刷新内存和存储信息"
                />
              )}
              <Badge
                appearance="filled"
                color={device.connected ? "success" : "danger"}
              >
                {device.connected ? "已连接" : "已断开"}
              </Badge>
            </div>
          }
        />
      
      <div className={styles.content}>
        {/* 设备名称和进度条的顶部区域 */}
        <div className={styles.deviceTopSection}>
          {/* 左侧：设备名称区域 */}
          <div className={styles.deviceNameSection}>
            <div className={styles.deviceHeader}>
              <div className={styles.deviceNameText}>
                <Text className={styles.deviceName}>{getDeviceName()}</Text>
                <Text className={styles.deviceSubtitle}>{getDeviceSubtitle()}</Text>
              </div>

            </div>
          </div>

          {/* 右侧：进度条区域 - 两列四个进度条 */}
          <div className={styles.progressSection}>
            {/* 左列：电池信息 */}
            <div className={styles.progressColumn}>
              {/* 电池电量 */}
              {device.properties?.batteryLevel !== undefined && (
                <div className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressLabel}>
                      {getBatteryIcon(device.properties.batteryLevel)}
                      <Text>电池电量</Text>
                    </div>
                    <Text className={styles.progressValue}>
                      {device.properties.batteryLevel}%
                    </Text>
                  </div>
                  <ProgressBar
                    value={device.properties.batteryLevel / 100}
                    color={getBatteryColor(device.properties.batteryLevel)}
                  />
                </div>
              )}

              {/* 设备温度 - 显示电池温度 */}
              <div className={styles.progressItem}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressLabel}>
                    <DesktopPulse24Regular />
                    <Text>设备温度</Text>
                  </div>
                  <Text className={styles.progressValue}>
                    {temperatureInfo.temperature !== null
                      ? `${temperatureInfo.temperature.toFixed(1)}°C`
                      : temperatureInfo.status
                    }
                  </Text>
                </div>
                {temperatureInfo.temperaturePercent !== null ? (
                  <ProgressBar
                    value={temperatureInfo.temperaturePercent / 100} // 0-100°C 范围
                    color={getTemperatureColor(temperatureInfo.temperature!)}
                  />
                ) : (
                  <ProgressBar
                    value={0}
                    color="success"
                    style={{ opacity: 0.3 }}
                  />
                )}

              </div>
            </div>

            {/* 右列：存储和内存信息 */}
            <div className={styles.progressColumn}>
              {/* 内部存储 */}
              <div className={styles.progressItem}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressLabel}>
                    <Storage24Regular />
                    <Text>内部存储</Text>
                  </div>
                  <Text className={styles.progressValue}>
                    {storageInfo.used}% 已使用
                  </Text>
                </div>
                <ProgressBar
                  value={storageInfo.used / 100}
                  color={getStorageColor(storageInfo.used)}
                />
              </div>

              {/* 运行内存 */}
              <div className={styles.progressItem}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressLabel}>
                    <DesktopPulse24Regular />
                    <Text>运行内存</Text>
                  </div>
                  <Text className={styles.progressValue}>
                    {memoryUsage.used}% 已使用
                  </Text>
                </div>
                <ProgressBar
                  value={memoryUsage.used / 100}
                  color={getMemoryColor(memoryUsage.used)}
                />
              </div>
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
