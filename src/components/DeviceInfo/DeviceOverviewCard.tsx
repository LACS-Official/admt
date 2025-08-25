import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  mergeClasses,
  Card,
  Text,
  Button,
  ProgressBar,
  useToastController,
  Toast,
  ToastTitle,
  Toaster,
  Spinner,
  Tab,
  TabList,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Checkbox,
} from "@fluentui/react-components";
import {
  Battery024Regular,
  Storage24Regular,
  DesktopPulse24Regular,
  ArrowClockwise24Regular,
  Copy24Regular,
  Edit24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { deviceService } from "../../services/deviceService";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";

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
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    },
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
    gap: "12px",
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
    gap: "4px",
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
      border: "1px solid transparent",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      
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
  // 添加替换功能相关状态
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [, setCurrentReplaceItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({
    deviceName: true,
    brand: true,
    model: true,
    serial: true,
    androidVersion: true,
    sdkVersion: true,
    deviceCode: true,      // 设备代号
    buildTime: true,       // 编译时间
    boardId: true,        // 主板ID
  });

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

  // 处理打开替换对话框

  // 处理关闭替换对话框
  const handleCloseReplaceDialog = () => {
    setReplaceDialogOpen(false);
    setCurrentReplaceItem(null);
  };

  // 处理选择项变化
  const handleItemToggle = (itemId: string) => {
    useAppStore();
    setSelectedItems(prev => {
      // 计算当前选中的数量
      const currentSelectedCount = Object.values(prev).filter(Boolean).length;
      const isCurrentlySelected = prev[itemId];

      // 如果要取消选中，检查是否会低于最小值（1个）
      if (isCurrentlySelected && currentSelectedCount <= 1) {
        dispatchToast(
          <Toast>
            <ToastTitle>提示</ToastTitle>
            至少需要保留1个显示项
          </Toast>,
          { intent: "warning", timeout: 2000 }
        );
        return prev;
      }

      // 如果要选中，检查是否会超过最大值（9个）
      if (!isCurrentlySelected && currentSelectedCount >= 9) {
        dispatchToast(
          <Toast>
            <ToastTitle>提示</ToastTitle>
            最多只能选择9个显示项
          </Toast>,
          { intent: "warning", timeout: 2000 }
        );
        return prev;
      }

      // 更新选中状态
      return {
        ...prev,
        [itemId]: !prev[itemId]
      };
    });
  };

  // 处理确认替换
  const handleConfirmReplace = () => {
    // 保存当前选中状态并关闭弹窗
    onCustomize(); // 通知父组件保存更改
    setReplaceDialogOpen(false);
    setCurrentReplaceItem(null);
    
    // 显示保存成功提示
    dispatchToast(
      <Toast>
        <ToastTitle>保存成功</ToastTitle>
        信息面板已更新
      </Toast>,
      { intent: "success", timeout: 2000 }
    );
  };

  // 复制文本到剪贴板的函数
  const handleCopyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
        setStatusBarMessage({
          type: "info",
          message: `已复制 ${label} 到剪贴板`,
          icon: <Copy24Regular />,
          duration: 1000,
        });
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



  return (
    <>
      <Toaster />
      <Card className={styles.card}>
        {/* 卡片头部 */}
        <div className={mergeClasses(styles.header, styles.noSelect)}>
          {/* 左半部分：设备信息、标签页、刷新按钮 */}
          <div className={styles.headerLeft}>
            {/* 第一行：信息面板标题 */}
            <div className={styles.deviceInfoRow}>
              <div className={styles.title}>设备信息面板</div>
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
                {/* 自定义信息面板 */}
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Edit24Regular />}
                  onClick={() => setReplaceDialogOpen(true)}
                  title="自定义信息面板"
                  className={styles.headerRefreshButton}
                />
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
          </div>

          {/* 右半部分：进度条区域 */}
          <div className={styles.headerRight}>
            {/* 进度条区域 - 右上角两行布局 */}
            <div className={styles.progressSection}>
              {/* 第一行 */}
              <div className={styles.progressItem}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressLabel}>
                    <Battery024Regular />
                    <Text>电池</Text>
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
                    <DesktopPulse24Regular />
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
        </div>

        {/* 卡片内容 - 标签页内容 */}
        <div className={styles.content}>
          <div className={styles.tabPanel}>
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
          </div>
        </div>
      </Card>

      {/* 自定义替换弹窗 */}
      <Dialog open={replaceDialogOpen} onOpenChange={(_, data) => {
        if (!data.open) {
          handleCloseReplaceDialog();
        }
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>自定义信息面板显示项（正在开发中）</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={styles.noSelect}>
                <div style={{ marginBottom: '8px', color: 'var(--colorNeutralForeground2)' }}>
                  已选择 {Object.values(selectedItems).filter(Boolean).length}/9 项
                </div>
                <Checkbox
                  label="设备名称"
                  checked={selectedItems.deviceName}
                  onChange={() => handleItemToggle('deviceName')}
                />
                <Checkbox
                  label="品牌"
                  checked={selectedItems.brand}
                  onChange={() => handleItemToggle('brand')}
                />
                <Checkbox
                  label="型号"
                  checked={selectedItems.model}
                  onChange={() => handleItemToggle('model')}
                />
                <Checkbox
                  label="序列号"
                  checked={selectedItems.serial}
                  onChange={() => handleItemToggle('serial')}
                />
                <Checkbox
                  label="Android版本"
                  checked={selectedItems.androidVersion}
                  onChange={() => handleItemToggle('androidVersion')}
                />
                <Checkbox
                  label="API级别"
                  checked={selectedItems.sdkVersion}
                  onChange={() => handleItemToggle('sdkVersion')}
                />
                <Checkbox
                  label="设备代号"
                  checked={selectedItems.deviceCode}
                  onChange={() => handleItemToggle('deviceCode')}
                />
                <Checkbox
                  label="编译时间"
                  checked={selectedItems.buildTime}
                  onChange={() => handleItemToggle('buildTime')}
                />
                <Checkbox
                  label="主板ID"
                  checked={selectedItems.boardId}
                  onChange={() => handleItemToggle('boardId')}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCloseReplaceDialog}>取消</Button>
              <Button appearance="primary" onClick={handleConfirmReplace}>确定</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
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

  return (
  <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>设备名称</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.marketName || device.properties?.model || "未知", "设备名称")}
      >
        <Text>{device.properties?.marketName || device.properties?.model || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>品牌</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.brand || "未知", "品牌")}
      >
        <Text>{device.properties?.brand || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>型号</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.model || "未知", "型号")}
      >
        <Text>{device.properties?.model || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>序列号</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.serial, "序列号")}
      >
        <Text>{device.serial}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>Android版本</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(`Android ${device.properties?.androidVersion || "未知"}`, "Android版本")}
      >
        <Text>Android {device.properties?.androidVersion || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>API级别</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.sdkVersion || "未知", "API级别")}
      >
        <Text>{device.properties?.sdkVersion || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>设备代号</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.deviceName || "未知", "设备代号")}
      >
        <Text>{device.properties?.deviceName || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>编译时间</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.buildId || "未知", "编译时间")}
      >
        <Text>{device.properties?.buildId || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>主板ID</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(boardSerialNumber || "未知", "主板ID")}
      >
        <Text>{boardSerialNumber || "未知"}</Text>
      </div>
    </div>
  </div>
  );
};

// 硬件信息面板
const HardwareInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => (
  <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>CPU架构</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.cpuAbi || "arm64-v8a", "CPU架构")}
      >
        <Text>{device.properties?.cpuAbi || "arm64-v8a"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>CPU代号</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.hardware || "未知", "CPU代号")}
      >
        <Text>{device.properties?.hardware || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>SoC制造商</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.socManufacturer || "未知", "SoC制造商")}
      >
        <Text>{device.properties?.socManufacturer || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>SoC型号</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.socModel || "未知", "SoC型号")}
      >
        <Text>{device.properties?.socModel || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>分辨率</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.screenResolution || "未知", "分辨率")}
      >
        <Text>{device.properties?.screenResolution || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>显示密度</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.lcdDensity || "未知", "显示密度")}
      >
        <Text>{device.properties?.lcdDensity || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>硬件芯片</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.hardwareChipname || "未知", "硬件芯片")}
      >
        <Text>{device.properties?.hardwareChipname || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>主板平台</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.boardPlatform || "未知", "主板平台")}
      >
        <Text>{device.properties?.boardPlatform || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>产品主板</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.productBoard || "未知", "产品主板")}
      >
        <Text>{device.properties?.productBoard || "未知"}</Text>
      </div>
    </div>
  </div>
);

// 系统信息面板
const SystemInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => (
  <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>Bootloader锁</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(
          String(device.properties?.bootloaderLocked) === "false" ? "unlocked" :
          String(device.properties?.bootloaderLocked) === "true" ? "locked" : "未知",
          "Bootloader锁"
        )}
      >
        <Text>
          {String(device.properties?.bootloaderLocked) === "false" ? "unlocked" :
           String(device.properties?.bootloaderLocked) === "true" ? "locked" : "未知"}
        </Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>编译版本</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.buildDisplayId || device.properties?.buildId || "未知", "编译版本")}
      >
        <Text>{device.properties?.buildDisplayId || device.properties?.buildId || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>构建指纹</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.buildFingerprint || "未知", "构建指纹")}
      >
        <Text>{device.properties?.buildFingerprint || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>设备模式</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.mode, "设备模式")}
      >
        <Text>{device.mode}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>安全补丁</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue((device.properties as any)?.securityPatch || "未知", "安全补丁")}
      >
        <Text>{(device.properties as any)?.securityPatch || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>语言区域</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue((device.properties as any)?.locale || "未知", "语言区域")}
      >
        <Text>{(device.properties as any)?.locale || "未知"}</Text>
      </div>
    </div>
  </div>
);

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
const SecurityInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => (
  <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>Bootloader状态</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(
          String(device.properties?.bootloaderLocked) === "false" ? "已解锁" :
          String(device.properties?.bootloaderLocked) === "true" ? "已锁定" : "未知",
          "Bootloader状态"
        )}
      >
        <Text>
          {String(device.properties?.bootloaderLocked) === "false" ? "已解锁" :
           String(device.properties?.bootloaderLocked) === "true" ? "已锁定" : "未知"}
        </Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>验证启动</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.verifiedBootState || "未知", "验证启动")}
      >
        <Text>{device.properties?.verifiedBootState || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>完整性验证</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.verityMode || "未知", "完整性验证")}
      >
        <Text>{device.properties?.verityMode || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>调试模式</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(
          String(device.properties?.debuggable) === "true" ? "已启用" :
          String(device.properties?.debuggable) === "false" ? "已禁用" : "未知",
          "调试模式"
        )}
      >
        <Text>
          {String(device.properties?.debuggable) === "true" ? "已启用" :
           String(device.properties?.debuggable) === "false" ? "已禁用" : "未知"}
        </Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>安全模式</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(
          String(device.properties?.secure) === "true" ? "已启用" :
          String(device.properties?.secure) === "false" ? "已禁用" : "未知",
          "安全模式"
        )}
      >
        <Text>
          {String(device.properties?.secure) === "true" ? "已启用" :
           String(device.properties?.secure) === "false" ? "已禁用" : "未知"}
        </Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>ADB安全</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(
          String(device.properties?.adbSecure) === "true" ? "已启用" :
          String(device.properties?.adbSecure) === "false" ? "已禁用" : "未知",
          "ADB安全"
        )}
      >
        <Text>
          {String(device.properties?.adbSecure) === "true" ? "已启用" :
           String(device.properties?.adbSecure) === "false" ? "已禁用" : "未知"}
        </Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>安全补丁级别</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.securityPatchLevel || "未知", "安全补丁级别")}
      >
        <Text>{device.properties?.securityPatchLevel || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>构建用户</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.buildUser || "未知", "构建用户")}
      >
        <Text>{device.properties?.buildUser || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>构建主机</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.buildHost || "未知", "构建主机")}
      >
        <Text>{device.properties?.buildHost || "未知"}</Text>
      </div>
    </div>
  </div>
);

// 网络信息面板
const NetworkInfoPanel: React.FC<InfoPanelProps> = ({ device, onCopyValue, styles }) => (
  <div className={mergeClasses(styles.infoGrid, styles.noSelect)}>
    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>默认网络</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.defaultNetwork || "未知", "默认网络")}
      >
        <Text>{device.properties?.defaultNetwork || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>语言区域</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.locale || "未知", "语言区域")}
      >
        <Text>{device.properties?.locale || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>时区</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.timezone || "未知", "时区")}
      >
        <Text>{device.properties?.timezone || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>IMEI</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.imei || "未知", "IMEI")}
      >
        <Text>{device.properties?.imei || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>首次API级别</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.firstApiLevel || "未知", "首次API级别")}
      >
        <Text>{device.properties?.firstApiLevel || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>VNDK版本</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.vndkVersion || "未知", "VNDK版本")}
      >
        <Text>{device.properties?.vndkVersion || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>CPU架构列表</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.cpuAbiList || "未知", "CPU架构列表")}
      >
        <Text>{device.properties?.cpuAbiList || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>构建日期</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.buildDate || "未知", "构建日期")}
      >
        <Text>{device.properties?.buildDate || "未知"}</Text>
      </div>
    </div>

    <div className={styles.infoItem}>
      <Text className={styles.infoLabel}>系统版本</Text>
      <div
        className={styles.infoValue}
        onClick={() => onCopyValue(device.properties?.systemVersion || "未知", "系统版本")}
      >
        <Text>{device.properties?.systemVersion || "未知"}</Text>
      </div>
    </div>
  </div>
);

export default DeviceOverviewCard;
