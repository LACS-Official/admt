import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  mergeClasses,
  Card,
  Text,
  Button,
  ProgressBar,
  useToastController,
  Toaster,
  Spinner,
  Tab,
  TabList,
  tokens,
} from "@fluentui/react-components";
import {
  Battery024Regular,
  Storage24Regular,
  DesktopPulse24Regular,
  ArrowClockwise24Regular,
  Flash24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { deviceService } from "../../services/deviceService";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { useDeviceService } from "../../services/deviceService";
import { FastbootStorageInfoPanel } from "./FastbootStorageInfoPanel";
import { DeviceInfoItem } from "./DeviceInfoItem";

// 定义信息面板组件的props类型
interface InfoPanelProps {
  device: DeviceInfo;
  onCopyValue: (value: string, label: string) => void;
  styles: any;
}

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
  title: {
    selector: ".MuiCardContent-root",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.2",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    },
  },
  expandedCard: {
    height: "80vh", // 使用视口高度的90%
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start", // 顶部对齐
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    gap: tokens.spacingHorizontalL, // 左右两部分的间距
    "@media (max-width: 768px)": {
      flexDirection: "column", // 移动端垂直排列
      gap: tokens.spacingHorizontalM,
    },
  },
  // 左半部分：设备信息、标签页、刷新按钮
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    flex: "1 1 65%", // 占据65% the width
    minWidth: 0,
  },
  // 左半部分第一行：设备基本信息
  deviceInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  // fastboot 模式下的设备信息行，确保标题、刷新按钮和标签页在同一行
  fastbootDeviceInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
    flexWrap: "nowrap", // 防止换行
    justifyContent: "space-between", // 元素之间均匀分布
  },
  // 左半部分第二行：标签页和刷新按钮
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    justifyContent: "space-between",
    "@media (max-width: 768px)": {
      flexDirection: "column", // 移动端垂直排列
      alignItems: "flex-start",
      gap: tokens.spacingVerticalS,
    },
  },
  // 右半部分：进度条区域
  headerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 35%", // 占据35% the width，不伸缩
    minWidth: "240px", // 最小宽度确保进度条正常显示
    borderLeft: "1px solid var(--colorNeutralStroke2)",
    
    "@media (max-width: 768px)": {
      flex: "1 1 100%", // 移动端占据全宽
      minWidth: "auto",
      justifyContent: "flex-start",
    },
  },
  deviceName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",
    flexShrink: 1,
  },
  deviceSubtitle: {
    fontSize: tokens.fontSizeBase100,
    color: "var(--colorNeutralForeground2)",
    fontFamily: tokens.fontFamilyMonospace,
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalSNudge}`,
    borderRadius: "4px",
    border: "1px solid var(--colorNeutralStroke3)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
    flexShrink: 1,
    
  },
  // 进度条区域 - 右上角两行布局
  progressSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: tokens.spacingHorizontalS,
    minWidth: "240px",
    maxWidth: "280px",
    padding: tokens.spacingHorizontalS,
    
  },
  progressItem: {
    display: "flex",
    flexDirection: "column",

  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightMedium,
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    lineHeight: "1.2",
  },
  progressValue: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "0.02em",
    lineHeight: "1.2",
  },
  content: {
    padding: tokens.spacingHorizontalM,
    paddingTop: "0", // 移除顶部内边距，因为标签页已移到头部
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  // 头部中的标签页样式
  headerTabList: {
    flex: "1 1 auto",
    "& .fui-TabList": {
      minHeight: "32px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "12px",
      padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
      minHeight: "28px",
      borderRadius: "6px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      border: "1px solid var(--colorNeutralStroke2)",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: `0 ${tokens.spacingHorizontalXS}`,
      
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground1)",
        transform: "translateY(-1px)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      },
      
      "&[aria-selected='true']": {
        backgroundColor: "var(--colorBrandBackground2)",
        color: "var(--colorBrandForeground1)",
        border: "1px solid var(--colorBrandStroke2)",
        fontWeight: 600,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
      },
    },
    
    "@media (max-width: 768px)": {
      "& .fui-Tab": {
        fontSize: "11px",
        padding: "4px 8px",
      },
    },
  },
  // 头部刷新按钮样式
  headerRefreshButton: {
    flexShrink: 0, // 防止被压缩
    minWidth: "32px",
    height: "28px",
    "@media (max-width: 768px)": {
      alignSelf: "flex-start", // 移动端左对齐
    },
  },
  // 内容区域的标签页样式（已移除，但保留以防需要）
  tabList: {
    marginBottom: tokens.spacingVerticalM,
    display: "none", // 隐藏内容区域的标签页
  },
  tabPanel: {
    flex: 1,
    overflow: "auto",
    paddingTop: tokens.spacingVerticalM, // 添加顶部内边距以与头部分离
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalS,
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 1fr",
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
    },
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingHorizontalS,
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke3)",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      border: "1px solid var(--colorNeutralStroke2)",
    },
    position: "relative", // 添加相对定位以支持绝对定位的替换按钮
  },
  infoLabel: {
    fontSize: "10px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground2)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "1px",
    lineHeight: "1.2",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    padding: "3px 4px",
    borderRadius: "3px",
    transition: "all 0.2s ease",
    lineHeight: "1.3",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      color: "var(--colorBrandForeground1)",
    },
    ":active": {
      backgroundColor: "var(--colorNeutralBackground3Pressed)",
    },
  },
  // 添加替换按钮样式
  replaceButton: {
    position: "absolute",
    top: "4px",
    right: "4px",
    minWidth: "24px",
    width: "24px",
    height: "24px",
    padding: "0",
  },
  // 添加选项对话框中的选项样式
  optionItem: {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    cursor: "pointer",
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
    },
  },
  optionCheckbox: {
    marginRight: "8px",
  },
  optionText: {
    fontSize: "14px",
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
  noSelect: {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  },
});

interface DeviceOverviewCardProps {
  device: DeviceInfo;
  onShowDetails: () => void;
  onCopyInfo: () => void;
  onCustomize: () => void; // 添加自定义按钮回调
}


const DeviceOverviewCard: React.FC<DeviceOverviewCardProps> = ({ device, onCustomize }) => {
  const styles = useStyles();
  const { setStatusBarMessage } = useAppStore();
  const { dispatchToast } = useToastController();

  const [memoryStorageInfo, setMemoryStorageInfo] = useState<MemoryStorageInfo | null>(null);
  const [isLoadingMemoryStorage, setIsLoadingMemoryStorage] = useState(false);
  const [selectedTab, setSelectedTab] = useState("basic");
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 当设备模式切换到 fastboot 时，自动切换到基本信息标签页
  useEffect(() => {
    if (device.mode === "fastboot" && selectedTab !== "basic") {
      setSelectedTab("basic");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.mode]);

  // 监听标签页变化，在fastboot模式下选择分区信息tab时展开面板
  useEffect(() => {
    if (device.mode === "fastboot") {
      setIsExpanded(selectedTab === "fastboot-storage");
    } else {
      setIsExpanded(false);
    }
  }, [selectedTab, device.mode]);

  // 复制文本到剪贴板的函数
  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
        setStatusBarMessage({
          type: "info",
          message: `已复制 ${label} 到剪贴板`,
          duration: 1000,
        });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `复制 ${label} 失败`,
        duration: 2000,
      });
    }
  };



  return (
    <>
      <Toaster />
      <Card className={mergeClasses(styles.card, isExpanded && styles.expandedCard)}>
        {/* 卡片头部 */}
        <div className={mergeClasses(styles.header, styles.noSelect)}>
          {/* 左半部分：设备信息、标签页、刷新按钮 */}
          <div className={styles.headerLeft}>
            {/* fastboot 模式下，标题、刷新按钮和标签页在同一行 */}
            {device.mode === "fastboot" ? (
            
              <div className={styles.fastbootDeviceInfoRow}>
                <div className={styles.title}>设备信息面板</div>
                <Text style={{ fontSize: '12px', color: 'var(--colorBrandForeground2)' }}>点击值可以复制</Text>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* 刷新按钮 */}
                  {device.connected && (
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={isLoadingMemoryStorage ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                      onClick={fetchMemoryStorageInfo}
                      disabled={isLoadingMemoryStorage}
                      title="刷新内存和存储信息"
                      className={styles.headerRefreshButton}
                    />
                  )}
                </div>
                              <div className={styles.controlsRow}>
                                {/* fastboot 模式下的标签页 */}
                <TabList
                  selectedValue={selectedTab}
                  onTabSelect={(_, data) => setSelectedTab(data.value as string)}
                  className={styles.headerTabList}
                >
                  <Tab value="basic">基本信息</Tab>
                  <Tab value="fastboot-security">安全状态</Tab>
                  <Tab value="fastboot-partition">A/B分区</Tab>
                  <Tab value="fastboot-hardware">硬件状态</Tab>
                  <Tab value="fastboot-storage">分区信息</Tab>

                </TabList>
              </div>
              </div>
            ) : (
              <>
                {/* 第一行：信息面板标题 */}
                <div className={styles.deviceInfoRow}>
                  <div className={styles.title}>设备信息面板</div>
                    <Text style={{ fontSize: '12px', color: 'var(--colorBrandForeground2)' }}>点击值可以复制</Text>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* 刷新按钮 */}
                    {device.connected && (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={isLoadingMemoryStorage ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                        onClick={fetchMemoryStorageInfo}
                        disabled={isLoadingMemoryStorage}
                        title="刷新内存和存储信息"
                        className={styles.headerRefreshButton}
                      />
                    )}
                  </div>
                </div>

                {/* 第二行：标签页 */}
                <div className={styles.controlsRow}>
                  <TabList
                    selectedValue={selectedTab}
                    onTabSelect={(_, data) => setSelectedTab(data.value as string)}
                    className={styles.headerTabList}
                  >
                    <Tab value="basic">基本信息</Tab>
                    <Tab value="hardware">硬件信息</Tab>
                    <Tab value="system">系统信息</Tab>
                    <Tab value="security">安全信息</Tab>
                    <Tab value="network">网络信息</Tab>
                  </TabList>
                </div>
              </>
            )}
          </div>

          {/* 右半部分：进度条区域 - 非 fastboot 模式下显示 */}
          {device.mode !== "fastboot" && (
            <div className={styles.headerRight}>
              {/* 进度条区域 - 右上角两行布局 */}
              <div className={styles.progressSection}>
                {/* 第一行 */}
                <div className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressLabel}>
                      <Battery024Regular />
                      <Text>电量</Text>
                    </div>
                    <Text className={styles.progressValue}>{device.properties?.batteryLevel || 0}%</Text>
                  </div>
                  <ProgressBar 
                    value={(device.properties?.batteryLevel || 0) / 100} 
                    color={getBatteryColor(device.properties?.batteryLevel)}
                    thickness="medium"
                  />
                </div>
                
                <div className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressLabel}>
                      <DesktopPulse24Regular />
                      <Text>温度</Text>
                    </div>
                    <Text className={styles.progressValue}>
                      {getTemperatureInfo(memoryStorageInfo).temperature !== null ?
                        `${getTemperatureInfo(memoryStorageInfo).temperature?.toFixed(1)}°C` :
                        getTemperatureInfo(memoryStorageInfo).status}
                    </Text>
                  </div>
                  <ProgressBar
                    value={(getTemperatureInfo(memoryStorageInfo).temperaturePercent || 0) / 100}
                    color={getTemperatureInfo(memoryStorageInfo).temperature ?
                      getTemperatureColor(getTemperatureInfo(memoryStorageInfo).temperature!) : "success"}
                    thickness="medium"
                  />
                </div>

                {/* 第二行 */}
                <div className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressLabel}>
                      <Storage24Regular />
                      <Text>存储</Text>
                    </div>
                    <Text className={styles.progressValue}>{getStorageInfo(memoryStorageInfo).used}%</Text>
                  </div>
                  <ProgressBar
                    value={getStorageInfo(memoryStorageInfo).used / 100}
                    color={getStorageColor(getStorageInfo(memoryStorageInfo).used)}
                    thickness="medium"
                  />
                </div>

                <div className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <div className={styles.progressLabel}>
                      <Flash24Regular />
                      <Text>内存</Text>
                    </div>
                    <Text className={styles.progressValue}>{getMemoryUsage(memoryStorageInfo).used}%</Text>
                  </div>
                  <ProgressBar
                    value={getMemoryUsage(memoryStorageInfo).used / 100}
                    color={getMemoryColor(getMemoryUsage(memoryStorageInfo).used)}
                    thickness="medium"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 卡片内容 - 标签页内容 */}
        <div className={styles.content}>
          <div className={styles.tabPanel}>
            {/* 当设备为 fastboot 模式时，显示 fastboot 专用信息面板 */}
            {device.mode === "fastboot" ? (
              <>
                {selectedTab === "basic" && (
                  <FastbootBasicInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "fastboot-security" && (
                  <FastbootSecurityInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "fastboot-partition" && (
                  <FastbootPartitionInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "fastboot-storage" && (
                  <FastbootStorageInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "fastboot-hardware" && (
                  <FastbootHardwareInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
              </>
            ) : (
              <>
                {selectedTab === "basic" && (
                  <BasicInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "hardware" && (
                  <HardwareInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "system" && (
                  <SystemInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "security" && (
                  <SecurityInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
                {selectedTab === "network" && (
                  <NetworkInfoPanel 
                    device={device} 
                    onCopyValue={handleCopyValue} 
                    styles={styles} 
                  />
                )}
              </>
            )}
          </div>
        </div>
      </Card>

    </>
  );
};

// 设备信息项组件


// 设备信息项组件 - 支持自定义值渲染
interface DeviceInfoItemWithCustomValueProps {
  label: string;
  copyLabel: string;
  onCopyValue: (value: string, label: string) => void;
  styles: any;
  children: React.ReactNode;
}

const DeviceInfoItemWithCustomValue: React.FC<DeviceInfoItemWithCustomValueProps> = ({ 
  label, copyLabel, onCopyValue, styles, children 
}) => (
  <div className={styles.infoItem}>
    <Text className={styles.infoLabel}>{label}</Text>
    <div
      className={styles.infoValue}
      onClick={() => {
        // 从子元素中提取文本值进行复制
        const textContent = typeof children === 'string' ? children : 
          Array.isArray(children) ? children.join('') : '';
        onCopyValue(textContent, copyLabel);
      }}
    >
      {children}
    </div>
  </div>
);

// 布尔值转换组件
interface BooleanValueItemProps {
  label: string;
  value: boolean | string | undefined;
  trueText: string;
  falseText: string;
  copyLabel: string;
  onCopyValue: (value: string, label: string) => void;
  styles: any;
}

const BooleanValueItem: React.FC<BooleanValueItemProps> = ({ 
  label, value, trueText, falseText, copyLabel, onCopyValue, styles 
}) => {
  const displayValue = String(value) === "false" ? falseText : 
                       String(value) === "true" ? trueText : "未知";
  const copyValue = String(value) === "false" ? falseText : 
                   String(value) === "true" ? trueText : "未知";

  return (
    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>{label}</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(copyValue, copyLabel)}
      >
        <Text>{displayValue}</Text>
      </div>
    </div>
  );
};



// 基本信息面板
const BasicInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const [boardSerialNumber, setBoardSerialNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoardSerialNumber = async () => {
      if (device.connected && device.serial) {
        try {
          const number = await deviceService.getBoardSerialNumber(device.serial);
          if (number) {
            setBoardSerialNumber(number);
            // Update the device info with the board serial number
            useDeviceStore.getState().updateDevice(device.serial, { boardSerialNumber: number });
          }
        } catch (error) {
          console.error("Failed to fetch board serial number:", error);
        }
      }
    };

    fetchBoardSerialNumber();
  }, [device.serial, device.connected]);

  const basicInfoItems = [
    {
      label: "设备名称",
      value: device.properties?.marketName || device.properties?.model || "未知",
      copyLabel: "设备名称"
    },
    {
      label: "品牌",
      value: device.properties?.brand || "未知",
      copyLabel: "品牌"
    },
    {
      label: "型号",
      value: device.properties?.model || "未知",
      copyLabel: "型号"
    },
    {
      label: "序列号",
      value: device.serial,
      copyLabel: "序列号"
    },
    {
      label: "Android版本",
      value: `Android ${device.properties?.androidVersion || "未知"}`,
      copyLabel: "Android版本"
    },
    {
      label: "SDK版本",
      value: device.properties?.sdkVersion || "未知",
      copyLabel: "SDK版本"
    },
    {
      label: "设备代号",
      value: device.properties?.deviceName || "未知",
      copyLabel: "设备代号"
    },
    {
      label: "编译时间",
      value: device.properties?.buildId || "未知",
      copyLabel: "编译时间"
    },
    {
      label: "主板ID",
      value: boardSerialNumber || "未知",
      copyLabel: "主板ID"
    }
  ];

  return (
    <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
      {basicInfoItems.map((item, index) => (
        <DeviceInfoItem
          key={index}
          label={item.label}
          value={item.value}
          copyLabel={item.copyLabel}
          onCopyValue={onCopyValue}
          styles={styles}
        />
      ))}
    </div>
  );
};

// 硬件信息面板
const HardwareInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const hardwareInfoItems = [
    {
      label: "CPU架构",
      value: device.properties?.cpuAbi || "arm64-v8a",
      copyLabel: "CPU架构"
    },
    {
      label: "CPU代号",
      value: device.properties?.hardware || "未知",
      copyLabel: "CPU代号"
    },
    {
      label: "SoC制造商",
      value: device.properties?.socManufacturer || "未知",
      copyLabel: "SoC制造商"
    },
    {
      label: "SoC型号",
      value: device.properties?.socModel || "未知",
      copyLabel: "SoC型号"
    },
    {
      label: "分辨率",
      value: device.properties?.screenResolution || "未知",
      copyLabel: "分辨率"
    },
    {
      label: "显示密度",
      value: device.properties?.lcdDensity || "未知",
      copyLabel: "显示密度"
    },
    {
      label: "硬件芯片",
      value: device.properties?.hardwareChipname || "未知",
      copyLabel: "硬件芯片"
    },
    {
      label: "主板平台",
      value: device.properties?.boardPlatform || "未知",
      copyLabel: "主板平台"
    },
    {
      label: "产品主板",
      value: device.properties?.productBoard || "未知",
      copyLabel: "产品主板"
    }
  ];

  return (
    <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
      {hardwareInfoItems.map((item, index) => (
        <DeviceInfoItem
          key={index}
          label={item.label}
          value={item.value}
          copyLabel={item.copyLabel}
          onCopyValue={onCopyValue}
          styles={styles}
        />
      ))}
    </div>
  );
};

// 系统信息面板
const SystemInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const systemInfoItems = [
    {
      label: "Android版本",
      value: device.properties?.androidVersion || "未知",
      copyLabel: "Android版本"
    },
    {
      label: "Android SDK版本",
      value: device.properties?.sdkVersion || "未知",
      copyLabel: "Android SDK版本"
    },
    {
      label: "安全补丁级别",
      value: device.properties?.securityPatchLevel || "未知",
      copyLabel: "安全补丁级别"
    },
    {
      label: "构建ID",
      value: device.properties?.buildId || "未知",
      copyLabel: "构建ID"
    },
    {
      label: "构建日期",
      value: device.properties?.buildDate || "未知",
      copyLabel: "构建日期"
    },
    {
      label: "构建用户",
      value: device.properties?.buildUser || "未知",
      copyLabel: "构建用户"
    },
    {
      label: "构建主机",
      value: device.properties?.buildHost || "未知",
      copyLabel: "构建主机"
    },
    {
      label: "构建显示ID",
      value: device.properties?.buildDisplayId || "未知",
      copyLabel: "构建显示ID"
    },
    {
      label: "系统版本",
      value: device.properties?.systemVersion || "未知",
      copyLabel: "系统版本"
    }
  ];

  return (
    <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
      {systemInfoItems.map((item, index) => (
        <DeviceInfoItem
          key={index}
          label={item.label}
          value={item.value}
          copyLabel={item.copyLabel}
          onCopyValue={onCopyValue}
          styles={styles}
        />
      ))}
    </div>
  );
};

// 辅助函数
const getBatteryColor = (level?: number): "success" | "warning" | "error" | undefined => {
  if (level === undefined) return undefined;
  if (level <= 20) return "error";
  if (level <= 50) return "warning";
  return "success";
};

// 获取设备温度信息
const getTemperatureInfo = (memoryStorageInfo: MemoryStorageInfo | null): {
  temperature: number | null;
  temperaturePercent: number | null;
  status: string;
} => {
  if (memoryStorageInfo?.battery) {
    const { battery_temperature } = memoryStorageInfo.battery;

    if (battery_temperature !== null && battery_temperature !== undefined) {
      if (battery_temperature >= -20 && battery_temperature <= 100) {
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

  return {
    temperature: null,
    temperaturePercent: null,
    status: "获取中...",
  };
};

// 获取温度颜色指示
const getTemperatureColor = (temperature: number): "success" | "warning" | "error" => {
  if (temperature < 45) return "success";
  if (temperature < 65) return "warning";
  return "error";
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

// 获取存储信息
const getStorageInfo = (memoryStorageInfo: MemoryStorageInfo | null) => {
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

  return {
    used: 0,
    total: 100,
    text: "获取中...",
    usedGB: "未知",
    totalGB: "未知",
  };
};

// 获取RAM使用情况
const getMemoryUsage = (memoryStorageInfo: MemoryStorageInfo | null) => {
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

  return {
    used: 0,
    usedGB: "获取中...",
    totalGB: "获取中...",
  };
};

// 安全信息面板
const SecurityInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const securityInfoItems = [
    {
      label: "Bootloader状态",
      value: String(device.properties?.bootloaderLocked) === "false" ? "已解锁" :
             String(device.properties?.bootloaderLocked) === "true" ? "已锁定" : "未知",
      copyLabel: "Bootloader状态"
    },
    {
      label: "验证启动",
      value: device.properties?.verifiedBootState || "未知",
      copyLabel: "验证启动"
    },
    {
      label: "完整性验证",
      value: device.properties?.verityMode || "未知",
      copyLabel: "完整性验证"
    },
    {
      label: "调试模式",
      value: String(device.properties?.debuggable) === "true" ? "已启用" :
             String(device.properties?.debuggable) === "false" ? "已禁用" : "未知",
      copyLabel: "调试模式"
    },
    {
      label: "安全模式",
      value: String(device.properties?.secure) === "true" ? "已启用" :
             String(device.properties?.secure) === "false" ? "已禁用" : "未知",
      copyLabel: "安全模式"
    },
    {
      label: "ADB安全",
      value: String(device.properties?.adbSecure) === "true" ? "已启用" :
             String(device.properties?.adbSecure) === "false" ? "已禁用" : "未知",
      copyLabel: "ADB安全"
    },
    {
      label: "安全补丁级别",
      value: device.properties?.securityPatchLevel || "未知",
      copyLabel: "安全补丁级别"
    },
    {
      label: "构建用户",
      value: device.properties?.buildUser || "未知",
      copyLabel: "构建用户"
    },
    {
      label: "构建主机",
      value: device.properties?.buildHost || "未知",
      copyLabel: "构建主机"
    }
  ];

  return (
    <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
      {securityInfoItems.map((item, index) => (
        <DeviceInfoItem
          key={index}
          label={item.label}
          value={item.value}
          copyLabel={item.copyLabel}
          onCopyValue={onCopyValue}
          styles={styles}
        />
      ))}
    </div>
  );
};

// 网络信息面板
const NetworkInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const networkInfoItems = [
    {
      label: "IMEI",
      value: device.properties?.imei || "未知",
      copyLabel: "IMEI"
    },
    {
      label: "默认网络",
      value: device.properties?.defaultNetwork || "未知",
      copyLabel: "默认网络"
    },
    {
      label: "语言区域",
      value: device.properties?.locale || "未知",
      copyLabel: "语言区域"
    },
    {
      label: "时区",
      value: device.properties?.timezone || "未知",
      copyLabel: "时区"
    },
    {
      label: "首次API级别",
      value: device.properties?.firstApiLevel || "未知",
      copyLabel: "首次API级别"
    },
    {
      label: "VNDK版本",
      value: device.properties?.vndkVersion || "未知",
      copyLabel: "VNDK版本"
    },
    {
      label: "CPU架构列表",
      value: device.properties?.cpuAbiList || "未知",
      copyLabel: "CPU架构列表"
    },
    {
      label: "构建日期",
      value: device.properties?.buildDate || "未知",
      copyLabel: "构建日期"
    },
    {
      label: "构建用户",
      value: device.properties?.buildUser || "未知",
      copyLabel: "构建用户"
    }
  ];

  return (
    <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
      {networkInfoItems.map((item, index) => (
        <DeviceInfoItem
          key={index}
          label={item.label}
          value={item.value}
          copyLabel={item.copyLabel}
          onCopyValue={onCopyValue}
          styles={styles}
        />
      ))}
    </div>
  );
};

// Fastboot 模式基础信息面板
const FastbootBasicInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  // Fastboot 模式下的基础信息
  const fastbootBasicInfoItems = [
    {
      label: "设备型号代码",
      value: device.properties?.productName || "未知",
      copyLabel: "设备型号代码",
      description: "设备型号代码（关键！）：可通过此确定设备具体机型。"
    },
    {
      label: "设备序列号",
      value: device.serial || "未知",
      copyLabel: "设备序列号",
      description: "设备唯一序列号：每台设备的专属标识，用于区分不同设备，类似 '设备身份证'。"
    },
    {
      label: "设备启动方式",
      value: device.properties?.hardware || "未知",
      copyLabel: "设备启动方式",
      description: "设备启动方式：采用 UEFI 启动（现代安卓设备主流方式，替代传统 BIOS），影响 bootloader 兼容性。"
    },
    {
      label: "最大下载大小",
      value: device.properties?.totalMemory || "未知",
      copyLabel: "最大下载大小",
      description: "fastboot 最大下载大小：单次通过 fastboot 刷入的镜像文件不能超过此大小（防止传输异常）。"
    },
    {
      label: "支持并行刷写",
      value: device.properties?.parallelDownloadFlash ? "是" : "否",
      copyLabel: "支持并行刷写",
      description: "支持并行刷写：表示可同时刷入多个分区镜像（如同时刷 boot、dtbo），提升刷机速度。"
    },
    {
      label: "关机充电模式",
      value: device.properties?.offModeCharge ? "开启" : "关闭",
      copyLabel: "关机充电模式",
      description: "关机充电模式：表示关闭 '关机充电时显示充电界面'（部分设备可自定义），1 则开启。"
    }
  ];

  return (
    <div className={styles.noSelect}>
      <div className={styles.infoGrid}>
        {fastbootBasicInfoItems.map((item, index) => (
          <DeviceInfoItem
            key={index}
            label={item.label}
            value={item.value}
            copyLabel={item.copyLabel}
            onCopyValue={onCopyValue}
            styles={styles}
          />
        ))}
      </div>
    </div>
  );
};

// Fastboot 模式安全状态面板
const FastbootSecurityInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  // Fastboot 模式下的安全状态信息
  const fastbootSecurityInfoItems = [
    {
      label: "Bootloader 解锁状态",
      value: device.properties?.bootloaderLocked ? "已解锁" : "已锁定",
      copyLabel: "Bootloader 解锁状态",
      description: "Bootloader 已解锁（核心！）：表示设备已解锁，支持刷入第三方 ROM、recovery 等；锁定状态则无法修改系统底层。"
    },
    {
      label: "安全启动",
      value: device.properties?.secure ? "启用" : "禁用",
      copyLabel: "安全启动",
      description: "启用安全启动：表示设备开启 Secure Boot（安全启动），仅允许验证通过的系统镜像（如官方 ROM）启动；若需刷第三方镜像，可能需关闭（部分设备支持）。"
    },
    {
      label: "防回滚保护",
      value: device.properties?.antiRollback ? "启用" : "禁用",
      copyLabel: "防回滚保护",
      description: "防回滚保护：表示启用防回滚（Anti-Rollback），禁止刷入版本号更低的 bootloader / 基带，避免降级漏洞。"
    },
    {
      label: "当前模式",
      value: device.properties?.verityMode === "enforcing" ? "用户空间模式" : "bootloader 底层模式",
      copyLabel: "当前模式",
      description: "当前模式：表示处于纯 bootloader 底层模式（未加载安卓用户空间），用户空间模式则少见。"
    }
  ];

  return (
    <div className={styles.noSelect}>
      <div className={styles.infoGrid}>
        {fastbootSecurityInfoItems.map((item, index) => (
          <DeviceInfoItem
            key={index}
            label={item.label}
            value={item.value}
            copyLabel={item.copyLabel}
            onCopyValue={onCopyValue}
            styles={styles}
          />
        ))}
      </div>
    </div>
  );
};

// Fastboot 模式 A/B 分区信息面板
const FastbootPartitionInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const { deviceService } = useDeviceService();
  const [currentSlot, setCurrentSlot] = useState<string>('');
  const [slotCount, setSlotCount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // 获取A/B分区信息
  useEffect(() => {
    const fetchPartitionInfo = async () => {
      if (!device || !device.serial) return;
      
      setIsLoading(true);
      try {
        // 获取当前活跃分区
        const currentSlotResult = await deviceService.getCurrentActiveSlot(device.serial);
        if (currentSlotResult.success && currentSlotResult.output) {
          // 解析输出，格式通常是 "current-slot: a" 或 "current-slot: b"
          const match = currentSlotResult.output.match(/current-slot:\s*([a-b])/i);
          if (match && match[1]) {
            setCurrentSlot(match[1].toUpperCase());
          }
        }
        
        // 获取分区数量
        const slotInfoResult = await deviceService.getSlotInfo(device.serial);
        if (slotInfoResult.success && slotInfoResult.output) {
          // 解析输出，格式通常是 "slot-count: 2"
          const match = slotInfoResult.output.match(/slot-count:\s*(\d+)/i);
          if (match && match[1]) {
            setSlotCount(match[1]);
          }
        }
      } catch (error) {
        console.error('获取分区信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartitionInfo();
  }, [device, deviceService]);

  // 切换A/B分区
  const handleSwitchPartition = async (targetSlot: string) => {
    if (!device || !device.serial || currentSlot === targetSlot) return;
    
    setIsSwitching(true);
    try {
      const result = await deviceService.switchABPartition(device.serial, targetSlot);
      if (result.success) {
        // 切换成功后更新当前分区
        setCurrentSlot(targetSlot.toUpperCase());
        // 可以添加成功提示
      } else {
        // 可以添加失败提示
        console.error('切换分区失败:', result.error);
      }
    } catch (error) {
      console.error('切换分区失败:', error);
      // 可以添加错误提示
    } finally {
      setIsSwitching(false);
    }
  };

  // Fastboot 模式下的 A/B 分区信息
  const fastbootPartitionInfoItems = [
    {
      label: "分区槽位数量",
      value: isLoading ? "加载中..." : (slotCount || "未知"),
      copyLabel: "分区槽位数量",
      description: "分区槽位数量：表示支持 A/B 双槽（A 槽：_a 后缀分区，B 槽：_b 后缀分区）。"
    },
    {
      label: "当前活跃槽位",
      value: isLoading ? "加载中..." : (currentSlot || "未知"),
      copyLabel: "当前活跃槽位",
      description: "当前活跃槽位：设备当前使用 A 槽（_a 分区）启动系统，若 A 槽故障，会自动切换到 B 槽。"
    },
  ];

  return (
    <div className={styles.noSelect}>
      <div className={styles.infoGrid}>
        {fastbootPartitionInfoItems.map((item, index) => (
          <DeviceInfoItem
            key={index}
            label={item.label}
            value={item.value}
            copyLabel={item.copyLabel}
            onCopyValue={onCopyValue}
            styles={styles}
          />
        ))}
      </div>
      
      {slotCount === "2" && currentSlot && (
        <div className="mt-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-sm font-medium">切换A/B分区:</Text>
          </div>
          <div className="flex space-x-2 justify-center items-center mt-2"> 
            <Button
              onClick={() => handleSwitchPartition('a')}
              disabled={isSwitching || currentSlot === 'A'}
              appearance={currentSlot === 'A' ? 'primary' : 'secondary'}
              size="small"
              style={{ minWidth: '80px' }}
            >
              A分区
            </Button>
            <Button
              onClick={() => handleSwitchPartition('b')}
              disabled={isSwitching || currentSlot === 'B'}
              appearance={currentSlot === 'B' ? 'primary' : 'secondary'}
              size="small"
              style={{ minWidth: '80px' }}
            >
              B分区
            </Button>
          </div>
          {isSwitching && (
            <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              正在切换分区，请稍候...
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

// Fastboot 模式硬件状态面板
const FastbootHardwareInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  // Fastboot 模式下的硬件状态信息
  const fastbootHardwareInfoItems = [
    {
      label: "硬件版本号",
      value: device.properties?.socManufacturer || "未知",
      copyLabel: "硬件版本号",
      description: "硬件版本号：区分设备的硬件批次（如不同工厂、不同配件版本），硬件版本不同可能影响 ROM 适配。"
    },
    {
      label: "当前电池电压",
      value: device.properties?.batteryLevel ? `${device.properties.batteryLevel}%` : "未知",
      copyLabel: "当前电池电压",
      description: "当前电池电压：单位为 mV（毫伏），属于正常电池电压范围（满电约 4.4-4.5V），说明电池当前供电正常。"
    },
    {
      label: "电池电量状态",
      value: device.properties?.batteryLevel && device.properties.batteryLevel > 20 ? "充足" : "不足",
      copyLabel: "电池电量状态",
      description: "电池电量状态：表示电池电量充足（通常 > 20%），满足刷机 / 操作需求；电量过低则无法执行底层操作。"
    },
    {
      label: "CPU 唯一 ID",
      value: device.properties?.cpuid || "未知",
      copyLabel: "CPU 唯一 ID",
      description: "CPU 唯一 ID：识别设备 CPU 芯片的专属标识，用于区分不同 CPU 批次（一般调试时用）。"
    }
  ];

  return (
    <div className={styles.noSelect}>
      <div className={styles.infoGrid}>
        {fastbootHardwareInfoItems.map((item, index) => (
          <DeviceInfoItem
            key={index}
            label={item.label}
            value={item.value}
            copyLabel={item.copyLabel}
            onCopyValue={onCopyValue}
            styles={styles}
          />
        ))}
      </div>
    </div>
  );
};









export default DeviceOverviewCard;
