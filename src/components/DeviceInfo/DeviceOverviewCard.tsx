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
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
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
    padding: "12px 16px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    gap: "16px", // 左右两部分的间距
    "@media (max-width: 768px)": {
      flexDirection: "column", // 移动端垂直排列
      gap: "12px",
    },
  },
  // 左半部分：设备信息、标签页、刷新按钮
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: "1 1 65%", // 占据65%的宽度
    minWidth: 0,
  },
  // 左半部分第一行：设备基本信息
  deviceInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },
  // fastboot 模式下的设备信息行，确保标题、刷新按钮和标签页在同一行
  fastbootDeviceInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    flexWrap: "nowrap", // 防止换行
    justifyContent: "space-between", // 元素之间均匀分布
  },
  // 左半部分第二行：标签页和刷新按钮
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    justifyContent: "space-between",
    "@media (max-width: 768px)": {
      flexDirection: "column", // 移动端垂直排列
      alignItems: "flex-start",
      gap: "8px",
    },
  },
  // 右半部分：进度条区域
  headerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 35%", // 占据35%的宽度，不伸缩
    minWidth: "240px", // 最小宽度确保进度条正常显示
    borderLeft: "1px solid var(--colorNeutralStroke2)",
    
    "@media (max-width: 768px)": {
      flex: "1 1 100%", // 移动端占据全宽
      minWidth: "auto",
      justifyContent: "flex-start",
    },
  },
  deviceName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",
    flexShrink: 1,
  },
  deviceSubtitle: {
    fontSize: "10px",
    color: "var(--colorNeutralForeground2)",
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "3px 6px",
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
    gap: "8px",
    minWidth: "240px",
    maxWidth: "280px",
    padding: "10px",
    
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
    fontSize: "10px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    gap: "3px",
    lineHeight: "1.2",
  },
  progressValue: {
    fontSize: "10px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "0.02em",
    lineHeight: "1.2",
  },
  content: {
    padding: "12px",
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
      padding: "6px 12px",
      minHeight: "28px",
      borderRadius: "6px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      border: "1px solid var(--colorNeutralStroke2)",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 4px",
      
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
    marginBottom: "12px",
    display: "none", // 隐藏内容区域的标签页
  },
  tabPanel: {
    flex: 1,
    overflow: "auto",
    paddingTop: "12px", // 添加顶部内边距以与头部分离
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
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
    gap: "4px",
    padding: "8px",
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
  },
});

interface DeviceOverviewCardProps {
  device: DeviceInfo;
  onShowDetails: () => void;
  onCopyInfo: () => void;
  onCustomize: () => void; // 添加自定义按钮回调
}


export const DeviceOverviewCard: React.FC<DeviceOverviewCardProps> = ({ device, onCustomize }) => {
  const styles = useStyles();
  const { t } = useTranslation();
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
          message: t('device_overview.copy_success', { label: label }),
          duration: 1000,
        });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('device_overview.copy_failed', { label: label }),
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
                <div className={styles.title}>{t('device_overview.panel_title')}</div>
                <Text style={{ fontSize: '12px', color: 'var(--colorBrandForeground2)' }}>{t('device_overview.click_to_copy')}</Text>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {/* 刷新按钮 */}
                  {device.connected && (
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={isLoadingMemoryStorage ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                      onClick={fetchMemoryStorageInfo}
                      disabled={isLoadingMemoryStorage}
                      title={t('device_overview.refresh_info')}
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
                  <Tab value="basic">{t('device_overview.tab_basic')}</Tab>
                  <Tab value="fastboot-security">{t('device_overview.tab_fb_security')}</Tab>
                  <Tab value="fastboot-partition">{t('device_overview.tab_fb_partition')}</Tab>
                  <Tab value="fastboot-hardware">{t('device_overview.tab_fb_hardware')}</Tab>
                  <Tab value="fastboot-storage">{t('device_overview.tab_fb_storage')}</Tab>

                </TabList>
              </div>
              </div>
            ) : (
              <>
                {/* 第一行：信息面板标题 */}
                <div className={styles.deviceInfoRow}>
                  <div className={styles.title}>{t('device_overview.panel_title')}</div>
                    <Text style={{ fontSize: '12px', color: 'var(--colorBrandForeground2)' }}>{t('device_overview.click_to_copy')}</Text>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* 刷新按钮 */}
                    {device.connected && (
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={isLoadingMemoryStorage ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                        onClick={fetchMemoryStorageInfo}
                        disabled={isLoadingMemoryStorage}
                        title={t('device_overview.refresh_info')}
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
                    <Tab value="basic">{t('device_overview.tab_basic')}</Tab>
                    <Tab value="hardware">{t('device_overview.tab_hardware')}</Tab>
                    <Tab value="system">{t('device_overview.tab_system')}</Tab>
                    <Tab value="security">{t('device_overview.tab_security')}</Tab>
                    <Tab value="network">{t('device_overview.tab_network')}</Tab>
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
                      <Text>{t('device_overview.battery')}</Text>
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
                      <Text>{t('device_overview.temperature')}</Text>
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
                      <Text>{t('device_overview.storage')}</Text>
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
                      <Text>{t('device_overview.memory')}</Text>
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
  const { t } = useTranslation();
  const displayValue = String(value) === "false" ? falseText : 
                       String(value) === "true" ? trueText : t('device_overview.unknown');
  const copyValue = String(value) === "false" ? falseText : 
                   String(value) === "true" ? trueText : t('device_overview.unknown');

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
  const { t } = useTranslation();
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
      label: t('device_overview.device_name'),
      value: device.properties?.marketName || device.properties?.model || t('device_overview.unknown'),
      copyLabel: t('device_overview.device_name'),
    },
    {
      label: t('device_overview.brand'),
      value: device.properties?.brand || t('device_overview.unknown'),
      copyLabel: t('device_overview.brand'),
    },
    {
      label: t('device_overview.model'),
      value: device.properties?.model || t('device_overview.unknown'),
      copyLabel: t('device_overview.model'),
    },
    {
      label: t('device_overview.serial_number'),
      value: device.serial,
      copyLabel: t('device_overview.serial_number'),
    },
    {
      label: t('device_overview.android_version'),
      value: `Android ${device.properties?.androidVersion || t('device_overview.unknown')}`,
      copyLabel: t('device_overview.android_version'),
    },
    {
      label: t('device_overview.sdk_version'),
      value: device.properties?.sdkVersion || t('device_overview.unknown'),
      copyLabel: t('device_overview.sdk_version'),
    },
    {
      label: t('device_overview.device_code'),
      value: device.properties?.deviceName || t('device_overview.unknown'),
      copyLabel: t('device_overview.device_code'),
    },
    {
      label: t('device_overview.build_time'),
      value: device.properties?.buildId || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_time'),
    },
    {
      label: t('device_overview.board_id'),
      value: boardSerialNumber || t('device_overview.unknown'),
      copyLabel: t('device_overview.board_id'),
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
  const { t } = useTranslation();
  const hardwareInfoItems = [
    {
      label: t('device_overview.cpu_arch'),
      value: device.properties?.cpuAbi || "arm64-v8a",
      copyLabel: t('device_overview.cpu_arch'),
    },
    {
      label: t('device_overview.cpu_code'),
      value: device.properties?.hardware || t('device_overview.unknown'),
      copyLabel: t('device_overview.cpu_code'),
    },
    {
      label: t('device_overview.soc_manufacturer'),
      value: device.properties?.socManufacturer || t('device_overview.unknown'),
      copyLabel: t('device_overview.soc_manufacturer'),
    },
    {
      label: t('device_overview.soc_model'),
      value: device.properties?.socModel || t('device_overview.unknown'),
      copyLabel: t('device_overview.soc_model'),
    },
    {
      label: t('device_overview.resolution'),
      value: device.properties?.screenResolution || t('device_overview.unknown'),
      copyLabel: t('device_overview.resolution'),
    },
    {
      label: t('device_overview.lcd_density'),
      value: device.properties?.lcdDensity || t('device_overview.unknown'),
      copyLabel: t('device_overview.lcd_density'),
    },
    {
      label: t('device_overview.hardware_chip'),
      value: device.properties?.hardwareChipname || t('device_overview.unknown'),
      copyLabel: t('device_overview.hardware_chip'),
    },
    {
      label: t('device_overview.board_platform'),
      value: device.properties?.boardPlatform || t('device_overview.unknown'),
      copyLabel: t('device_overview.board_platform'),
    },
    {
      label: t('device_overview.product_board'),
      value: device.properties?.productBoard || t('device_overview.unknown'),
      copyLabel: t('device_overview.product_board'),
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
  const { t } = useTranslation();
  const systemInfoItems = [
    {
      label: t('device_overview.android_version'),
      value: device.properties?.androidVersion || t('device_overview.unknown'),
      copyLabel: t('device_overview.android_version'),
    },
    {
      label: "Android SDK",
      value: device.properties?.sdkVersion || t('device_overview.unknown'),
      copyLabel: "Android SDK",
    },
    {
      label: t('device_overview.security_patch'),
      value: device.properties?.securityPatchLevel || t('device_overview.unknown'),
      copyLabel: t('device_overview.security_patch'),
    },
    {
      label: t('device_overview.build_id'),
      value: device.properties?.buildId || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_id'),
    },
    {
      label: t('device_overview.build_date'),
      value: device.properties?.buildDate || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_date'),
    },
    {
      label: t('device_overview.build_user'),
      value: device.properties?.buildUser || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_user'),
    },
    {
      label: t('device_overview.build_host'),
      value: device.properties?.buildHost || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_host'),
    },
    {
      label: t('device_overview.build_display_id'),
      value: device.properties?.buildDisplayId || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_display_id'),
    },
    {
      label: t('device_overview.system_version'),
      value: device.properties?.systemVersion || t('device_overview.unknown'),
      copyLabel: t('device_overview.system_version'),
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
          status: "正常", // This status is not visually shown when temperature is available
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
    status: "...", // Simplified status
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
    text: "...",
    usedGB: "unknown",
    totalGB: "unknown",
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
    usedGB: "...",
    totalGB: "...",
  };
};

// 安全信息面板
const SecurityInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const { t } = useTranslation();
  const securityInfoItems = [
    {
      label: t('device_overview.bootloader_status'),
      value: String(device.properties?.bootloaderLocked) === "false" ? t('device_info.unlocked') :
             String(device.properties?.bootloaderLocked) === "true" ? t('device_info.locked') : t('device_overview.unknown'),
      copyLabel: t('device_overview.bootloader_status'),
    },
    {
      label: t('device_overview.verified_boot'),
      value: device.properties?.verifiedBootState || t('device_overview.unknown'),
      copyLabel: t('device_overview.verified_boot'),
    },
    {
      label: t('device_overview.integrity_verity'),
      value: device.properties?.verityMode || t('device_overview.unknown'),
      copyLabel: t('device_overview.integrity_verity'),
    },
    {
      label: t('device_overview.debug_mode'),
      value: String(device.properties?.debuggable) === "true" ? t('device_overview.enabled') :
             String(device.properties?.debuggable) === "false" ? t('device_overview.disabled') : t('device_overview.unknown'),
      copyLabel: t('device_overview.debug_mode'),
    },
    {
      label: t('device_overview.secure_mode'),
      value: String(device.properties?.secure) === "true" ? t('device_overview.enabled') :
             String(device.properties?.secure) === "false" ? t('device_overview.disabled') : t('device_overview.unknown'),
      copyLabel: t('device_overview.secure_mode'),
    },
    {
      label: t('device_overview.adb_secure'),
      value: String(device.properties?.adbSecure) === "true" ? t('device_overview.enabled') :
             String(device.properties?.adbSecure) === "false" ? t('device_overview.disabled') : t('device_overview.unknown'),
      copyLabel: t('device_overview.adb_secure'),
    },
    {
      label: t('device_overview.security_patch'),
      value: device.properties?.securityPatchLevel || t('device_overview.unknown'),
      copyLabel: t('device_overview.security_patch'),
    },
    {
      label: t('device_overview.build_user'),
      value: device.properties?.buildUser || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_user'),
    },
    {
      label: t('device_overview.build_host'),
      value: device.properties?.buildHost || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_host'),
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
  const { t } = useTranslation();
  const networkInfoItems = [
    {
      label: t('device_overview.imei'),
      value: device.properties?.imei || t('device_overview.unknown'),
      copyLabel: t('device_overview.imei'),
    },
    {
      label: t('device_overview.default_network'),
      value: device.properties?.defaultNetwork || t('device_overview.unknown'),
      copyLabel: t('device_overview.default_network'),
    },
    {
      label: t('device_overview.locale'),
      value: device.properties?.locale || t('device_overview.unknown'),
      copyLabel: t('device_overview.locale'),
    },
    {
      label: t('device_overview.timezone'),
      value: device.properties?.timezone || t('device_overview.unknown'),
      copyLabel: t('device_overview.timezone'),
    },
    {
      label: t('device_overview.first_api'),
      value: device.properties?.firstApiLevel || t('device_overview.unknown'),
      copyLabel: t('device_overview.first_api'),
    },
    {
      label: t('device_overview.vndk_version'),
      value: device.properties?.vndkVersion || t('device_overview.unknown'),
      copyLabel: t('device_overview.vndk_version'),
    },
    {
      label: t('device_overview.cpu_arch_list'),
      value: device.properties?.cpuAbiList || t('device_overview.unknown'),
      copyLabel: t('device_overview.cpu_arch_list'),
    },
    {
      label: t('device_overview.build_date'),
      value: device.properties?.buildDate || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_date'),
    },
    {
      label: t('device_overview.build_user'),
      value: device.properties?.buildUser || t('device_overview.unknown'),
      copyLabel: t('device_overview.build_user'),
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
  const { t } = useTranslation();
  // Fastboot 模式下的基础信息
  const fastbootBasicInfoItems = [
    {
      label: t('device_overview.product_code'),
      value: device.properties?.productName || t('device_overview.unknown'),
      copyLabel: t('device_overview.product_code'),
      description: t('device_overview.product_code_desc')
    },
    {
      label: t('device_overview.serial_number_fb'),
      value: device.serial || t('device_overview.unknown'),
      copyLabel: t('device_overview.serial_number_fb'),
      description: t('device_overview.serial_number_fb_desc')
    },
    {
      label: t('device_overview.boot_method'),
      value: device.properties?.hardware || t('device_overview.unknown'),
      copyLabel: t('device_overview.boot_method'),
      description: t('device_overview.boot_method_desc')
    },
    {
      label: t('device_overview.max_download_size'),
      value: device.properties?.totalMemory || t('device_overview.unknown'),
      copyLabel: t('device_overview.max_download_size'),
      description: t('device_overview.max_download_size_desc')
    },
    {
      label: t('device_overview.parallel_flash'),
      value: device.properties?.parallelDownloadFlash ? t('device_overview.yes') : t('device_overview.no'),
      copyLabel: t('device_overview.parallel_flash'),
      description: t('device_overview.parallel_flash_desc')
    },
    {
      label: t('device_overview.off_mode_charge'),
      value: device.properties?.offModeCharge ? t('device_overview.on') : t('device_overview.off'),
      copyLabel: t('device_overview.off_mode_charge'),
      description: t('device_overview.off_mode_charge_desc')
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
  const { t } = useTranslation();
  // Fastboot 模式下的安全状态信息
  const fastbootSecurityInfoItems = [
    {
      label: t('device_overview.fb_unlock_status'),
      value: device.properties?.bootloaderLocked ? t('device_info.unlocked') : t('device_info.locked'),
      copyLabel: t('device_overview.fb_unlock_status'),
      description: t('device_overview.fb_unlock_status_desc'),
    },
    {
      label: t('device_overview.fb_secure_boot'),
      value: device.properties?.secure ? t('device_overview.enabled') : t('device_overview.disabled'),
      copyLabel: t('device_overview.fb_secure_boot'),
      description: t('device_overview.fb_secure_boot_desc'),
    },
    {
      label: t('device_overview.fb_anti_rollback'),
      value: device.properties?.antiRollback ? t('device_overview.enabled') : t('device_overview.disabled'),
      copyLabel: t('device_overview.fb_anti_rollback'),
      description: t('device_overview.fb_anti_rollback_desc'),
    },
    {
      label: t('device_overview.fb_current_mode'),
      value: device.properties?.verityMode === "enforcing" ? t('device_overview.fb_verity_mode_user') : t('device_overview.fb_verity_mode_bl'),
      copyLabel: t('device_overview.fb_current_mode'),
      description: t('device_overview.fb_current_mode_desc'),
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
  const { t } = useTranslation();
  const fastbootPartitionInfoItems = [
    {
      label: t('device_overview.fb_slot_count'),
      value: isLoading ? t('device_overview.loading') : (slotCount || t('device_overview.unknown')),
      copyLabel: t('device_overview.fb_slot_count'),
      description: t('device_overview.fb_slot_count_desc'),
    },
    {
      label: t('device_overview.fb_active_slot'),
      value: isLoading ? t('device_overview.loading') : (currentSlot || t('device_overview.unknown')),
      copyLabel: t('device_overview.fb_active_slot'),
      description: t('device_overview.fb_active_slot_desc'),
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
            <Text className="text-sm font-medium">{t('device_overview.fb_switch_partition')}</Text>
          </div>
          <div className="flex space-x-2 justify-center items-center mt-2"> 
            <Button
              onClick={() => handleSwitchPartition('a')}
              disabled={isSwitching || currentSlot === 'A'}
              appearance={currentSlot === 'A' ? 'primary' : 'secondary'}
              size="small"
              style={{ minWidth: '80px' }}
            >
              {t('device_overview.fb_partition_a')}
            </Button>
            <Button
              onClick={() => handleSwitchPartition('b')}
              disabled={isSwitching || currentSlot === 'B'}
              appearance={currentSlot === 'B' ? 'primary' : 'secondary'}
              size="small"
              style={{ minWidth: '80px' }}
            >
              {t('device_overview.fb_partition_b')}
            </Button>
          </div>
          {isSwitching && (
            <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('device_overview.fb_switching_wait')}
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

// Fastboot 模式硬件状态面板
const FastbootHardwareInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => {
  const { t } = useTranslation();
  // Fastboot 模式下的硬件状态信息
  const fastbootHardwareInfoItems = [
    {
      label: t('device_overview.fb_hw_version'),
      value: device.properties?.socManufacturer || t('device_overview.unknown'),
      copyLabel: t('device_overview.fb_hw_version'),
      description: t('device_overview.fb_hw_version_desc'),
    },
    {
      label: t('device_overview.fb_battery_voltage'),
      value: device.properties?.batteryLevel ? `${device.properties.batteryLevel}%` : t('device_overview.unknown'),
      copyLabel: t('device_overview.fb_battery_voltage'),
      description: t('device_overview.fb_battery_voltage_desc'),
    },
    {
      label: t('device_overview.fb_battery_status'),
      value: device.properties?.batteryLevel && device.properties.batteryLevel > 20 ? t('device_overview.fb_battery_full') : t('device_overview.fb_battery_low'),
      copyLabel: t('device_overview.fb_battery_status'),
      description: t('device_overview.fb_battery_status_desc'),
    },
    {
      label: t('device_overview.fb_cpuid'),
      value: device.properties?.cpuid || t('device_overview.unknown'),
      copyLabel: t('device_overview.fb_cpuid'),
      description: t('device_overview.fb_cpuid_desc'),
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
