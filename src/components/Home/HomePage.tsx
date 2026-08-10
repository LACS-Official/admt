import React, { useState, useEffect } from "react";
import {
  makeStyles,
  mergeClasses,
  Text,
  tokens,
  Button,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from "@fluentui/react-components";
import {
  DeviceEq24Regular,
  Link24Regular,
  Info24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";

// 导入新的组件
import DeviceOverviewCard from "../DeviceInfo/DeviceOverviewCard";
import DeviceRebootCard from "./DeviceRebootCard";
import MiscellaneousCard from "./MiscellaneousCard";
import DeviceMonitorCard from "./DeviceMonitorCard";
import NoDevicePrompt from "./NoDevicePrompt";

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    height: "100%",
    overflow: "hidden", // 改为 hidden，内部滚动
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingHorizontalM,
    position: "relative",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  backgroundDecoration: {
    position: "absolute",
    top: "0",
    right: "0",
    width: "200px",
    height: "200px",
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, transparent 70%)`,
    borderRadius: "0 0 0 100%",
    opacity: 0.1,
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
    minHeight: "40px",
    zIndex: 1,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  tabArea: {
    flex: "0 0 auto",
    maxHeight: "45px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "8px",
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: "flex",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalL,
    zIndex: 1,
    "& .fui-TabList": {
      minHeight: "32px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "12px",
      padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
      minHeight: "28px",
      borderRadius: "8px",
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
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
      },
    },

    "@media (max-width: 768px)": {
      "& .fui-Tab": {
        fontSize: "11px",
        padding: "4px 8px",
      },
    },
  },
  tab: {
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
      color: "var(--colorNeutralForeground1)",
      transform: "translateY(-1px)",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
  },
  mainContent: {
    flex: 1,
    height: "100%",
    overflow: "hidden", // 内部动画容器处理滚动
    position: "relative",
  },
  tabPanel: {
    height: "100%",
    width: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    paddingRight: tokens.spacingHorizontalXS,
    // 自定义滚动条
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--colorNeutralStroke1)",
      borderRadius: "10px",
    },
  },
  
  // 设备功能区域 - 新的上下两行布局结构
  deviceSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingHorizontalL,
  },
  // 主要内容区域：上下两行布局
  mainContentGrid: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingHorizontalL,
    flex: 1,
    height: "100%",
  },
  // 第一行：设备概览信息区域
  deviceOverviewSection: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
  },
  deviceInfoCard: {
    height: "100%",
  },
  // 第二行：功能控制区域
  deviceActionsSection: {
    display: "flex",
    flexDirection: "row", // 水平排列两个卡片
    gap: tokens.spacingHorizontalL,
    flexWrap: "wrap",
    "@media (min-width: 800px)": {
      flexWrap: "nowrap",
    }
  },
  rebootCard: {
    flex: "1 1 300px",
    minHeight: "260px",
  },
  miscCard: {
    flex: "1 1 300px",
    minHeight: "260px",
  },
  noDevice: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalL,
    padding: `${tokens.spacingVerticalXXXL} ${tokens.spacingHorizontalXL}`,
    textAlign: "center",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "2px dashed var(--colorNeutralStroke2)",
    height: "100%",
    boxSizing: 'border-box',
  },
  demoInfoBar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    backgroundColor: "var(--colorBrandBackground2)",
    borderRadius: "8px",
    border: "1px solid var(--colorBrandStroke2)",
    marginBottom: tokens.spacingVerticalM,
    color: "var(--colorBrandForeground2)",
  },
  demoBadge: {
    backgroundColor: "var(--colorBrandBackgroundStatic)",
    color: "white",
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
  }
});

// 模拟设备数据
const mockDevice: any = {
  serial: "DEMO-ADB-001",
  mode: "sys",
  connected: true,
  properties: {
    marketName: "Xiaomi 14 Ultra (Demo)",
    brand: "Xiaomi",
    model: "24030PN60C",
    androidVersion: "14",
    sdkVersion: "34",
    cpuAbi: "arm64-v8a",
    batteryLevel: 85,
    screenResolution: "1440 x 3200",
    totalMemory: "16 GB",
    availableStorage: "256 GB / 512 GB",
    securityPatchLevel: "2024-03-01",
    manufacturer: "Xiaomi",
    productName: "aurora",
    deviceName: "aurora",
  }
};

const HomePage: React.FC = () => {
  const styles = useStyles();
  const {
    devices,
    selectedDevice,
    isScanning
  } = useDeviceStore();
  const { t } = useTranslation();
  const { setStatusBarMessage, setWirelessDebuggingDialogOpen } = useAppStore();

  const connectedDevices = devices.filter(d => d.connected);
  
  // 标签页状态
  const [activeTab, setActiveTab] = useState<string>("connect");

  // 监听设备连接状态，自动切换标签页
  useEffect(() => {
    if (connectedDevices.length === 0) {
      setActiveTab("connect");
    } else {
      setActiveTab("info");
    }
  }, [connectedDevices.length]);

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

  // 手动刷新设备扫描
  const handleManualRefresh = () => {
    setStatusBarMessage({
      type: "info",
      message: t('status.refreshing_device_list'),
    });
  };

  const renderConnectTab = () => (
    <div className={styles.tabPanel}>
      <div className="card-enter">
        <NoDevicePrompt
          isScanning={isScanning}
          onRefresh={handleManualRefresh}
        />
      </div>
    </div>
  );

  const renderInfoTab = () => {
    const isDemo = !selectedDevice;
    const displayDevice = selectedDevice || mockDevice;

    return (
      <div className={styles.tabPanel}>
        <div className={mergeClasses(styles.deviceSection)}>
          {/* 演示模式提示横幅 */}
          {isDemo && (
            <motion.div 
              className={styles.demoInfoBar}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.demoBadge}>{t('home.demo_mode_title')}</div>
              <Text size={300}>{t('home.demo_mode_desc')}</Text>
            </motion.div>
          )}

          <div className={mergeClasses(styles.mainContentGrid)}>
            {/* 第一行：详细设备概览信息 */}
            <div className={mergeClasses(styles.deviceOverviewSection, "card-enter")} id="tour-home-overview">
              <div className={styles.deviceInfoCard}>
                <DeviceOverviewCard
                  device={displayDevice}
                  onShowDetails={() => {}}
                  onCopyInfo={() => {
                    setStatusBarMessage({
                      type: "success",
                      message: t('status.info_copied'),
                    });
                  }}
                  onCustomize={() => {}}
                />
              </div>
            </div>

            {/* 硬件实时监控区域 */}
            <div className="card-enter-delayed" style={{ flex: '0 0 auto' }} id="tour-home-monitor">
              <DeviceMonitorCard device={displayDevice} />
            </div>

            {/* 第二行：功能控制区域 */}
            <div className={mergeClasses(styles.deviceActionsSection)}>
              <div className={mergeClasses(styles.rebootCard, "card-enter-delayed")} id="tour-home-reboot">
                <DeviceRebootCard device={displayDevice} />
              </div>

              <div className={mergeClasses(styles.miscCard, "card-enter-delayed")}>
                <MiscellaneousCard  device={displayDevice} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.container} startup-optimized`}>
      {/* 背景装饰 */}
      <div className={styles.backgroundDecoration} />



      {/* 标签页导航 */}
      <div className={styles.tabArea}>
        <TabList 
          selectedValue={activeTab} 
          onTabSelect={onTabSelect} 
          appearance="subtle"
        >
          <Tab 
            value="connect" 
            icon={<Link24Regular />}
            className={styles.tab}
          >
            {t('home.tab_connect')}
          </Tab>
          <Tab 
            value="info" 
            icon={<DeviceEq24Regular />}
            className={styles.tab}
          >
            {t('home.tab_info')}
          </Tab>
        </TabList>
      </div>

      {/* 主要内容区域 - 带有动画效果 */}
      <div className={styles.mainContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ height: '100%', width: '100%' }}
          >
            {activeTab === "connect" ? renderConnectTab() : renderInfoTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
