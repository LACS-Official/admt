import React, { useState, useEffect } from "react";
import {
  makeStyles,
  mergeClasses,
  Text,
  tokens,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from "@fluentui/react-components";
import {
  DeviceEq24Regular,
  Link24Regular,
  Pulse24Regular,
  Power24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";

import DeviceOverviewCard from "../DeviceInfo/DeviceOverviewCard";
import DeviceRebootCard from "./DeviceRebootCard";
import MiscellaneousCard from "./MiscellaneousCard";
import DeviceMonitorCard from "./DeviceMonitorCard";
import NoDevicePrompt from "./NoDevicePrompt";

const useStyles = makeStyles({
  container: {
    padding: "16px 20px",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
  },
  tabContainer: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    flexShrink: 0,
    zIndex: 1,
    marginBottom: "2px",
  },
  tabArea: {
    alignSelf: "flex-start",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "4px",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "36px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
    "& .fui-TabList": {
      minHeight: "30px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "13px",
      padding: "6px 16px",
      minHeight: "30px",
      borderRadius: "9999px",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 2px",

      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },

      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        fontWeight: 600,
      },
    },

    "@media (max-width: 768px)": {
      "& .fui-Tab": {
        fontSize: "12px",
        padding: "4px 10px",
      },
    },
  },
  mainContent: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  tabPanel: {
    height: "100%",
    width: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    paddingRight: tokens.spacingHorizontalXS,
    "&::-webkit-scrollbar": {
      width: "5px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--colorNeutralStroke1)",
      borderRadius: "10px",
    },
  },
  deviceSection: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  deviceOverviewSection: {
    display: "flex",
    flexDirection: "column",
  },
  deviceActionsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "16px",
    alignItems: "stretch",
  },
  rebootCard: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  miscCard: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  demoInfoBar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
    backgroundColor: "var(--colorBrandBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorBrandStroke2)",
    marginBottom: tokens.spacingVerticalS,
    color: "var(--colorBrandForeground2)",
  },
  demoBadge: {
    backgroundColor: "var(--colorBrandBackgroundStatic)",
    color: "white",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
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
  },
};

const HomePage: React.FC = () => {
  const styles = useStyles();
  const { devices, selectedDevice, isScanning } = useDeviceStore();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();

  const connectedDevices = devices.filter((d) => d.connected);

  // 标签页状态：info | monitor | actions | connect
  const [activeTab, setActiveTab] = useState<string>("connect");

  // 监听设备连接状态，自动切换标签页
  useEffect(() => {
    if (connectedDevices.length === 0) {
      setActiveTab("connect");
    } else if (activeTab === "connect") {
      setActiveTab("info");
    }
  }, [connectedDevices.length]);

  const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
  };

  const handleManualRefresh = () => {
    setStatusBarMessage({
      type: "info",
      message: t("status.refreshing_device_list"),
    });
  };

  // 连接设备面板
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

  // 设备概览面板
  const renderOverviewTab = () => {
    const isDemo = !selectedDevice;
    const displayDevice = selectedDevice || mockDevice;

    return (
      <div className={styles.tabPanel}>
        <div className={styles.deviceSection}>
          {isDemo && (
            <motion.div
              className={styles.demoInfoBar}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.demoBadge}>{t("home.demo_mode_title")}</div>
              <Text size={300}>{t("home.demo_mode_desc")}</Text>
            </motion.div>
          )}

          <div
            className={mergeClasses(styles.deviceOverviewSection, "card-enter")}
            id="tour-home-overview"
          >
            <DeviceOverviewCard
              device={displayDevice}
              onShowDetails={() => {}}
              onCopyInfo={() => {
                setStatusBarMessage({
                  type: "success",
                  message: t("status.info_copied"),
                });
              }}
              onCustomize={() => {}}
            />
          </div>
        </div>
      </div>
    );
  };

  // 实时监控面板 (独立 Tab)
  const renderMonitorTab = () => {
    const displayDevice = selectedDevice || mockDevice;

    return (
      <div className={styles.tabPanel}>
        <div className="card-enter" style={{ height: "100%" }} id="tour-home-monitor">
          <DeviceMonitorCard device={displayDevice} />
        </div>
      </div>
    );
  };

  // 重启与辅助控制面板 (独立 Tab)
  const renderActionsTab = () => {
    const displayDevice = selectedDevice || mockDevice;

    return (
      <div className={styles.tabPanel}>
        <div className={mergeClasses(styles.deviceActionsSection, "card-enter")}>
          <div className={styles.rebootCard} id="tour-home-reboot">
            <DeviceRebootCard device={displayDevice} />
          </div>

          <div className={styles.miscCard}>
            <MiscellaneousCard device={displayDevice} />
          </div>
        </div>
      </div>
    );
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case "connect":
        return renderConnectTab();
      case "info":
        return renderOverviewTab();
      case "monitor":
        return renderMonitorTab();
      case "actions":
        return renderActionsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className={`${styles.container} startup-optimized`}>
      {/* 居左对齐的顶部主页分段胶囊选择器 */}
      <div className={styles.tabContainer}>
        <div className={styles.tabArea}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={onTabSelect}
            appearance="subtle"
          >
            <Tab value="connect" icon={<Link24Regular />}>
              {t("home.tab_connect")}
            </Tab>
            <Tab value="info" icon={<DeviceEq24Regular />}>
              {t("home.tab_info")}
            </Tab>
            <Tab value="monitor" icon={<Pulse24Regular />}>
              {t("home.tab_monitor")}
            </Tab>
            <Tab value="actions" icon={<Power24Regular />}>
              {t("home.tab_actions")}
            </Tab>
          </TabList>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={styles.mainContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            style={{ height: "100%", width: "100%" }}
          >
            {renderActiveContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HomePage;
