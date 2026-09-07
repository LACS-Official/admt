import React, { useState } from "react";
import { makeStyles, Text,
  TabList,
  Tab,
  Button,
} from "@fluentui/react-components";
import {
  CloudArrowUp24Regular,
  Settings24Regular,
  LockOpen24Regular,
  Flash24Regular,
  Code24Regular,
  Archive24Regular,
  Layer24Regular,
  ArrowDownload24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import XiaomiUnlockCard from "../Tools/XiaomiUnlockCard";
import UnifiedFlashCard from "../Tools/UnifiedFlashCard";
import { RomManagerCard } from "./RomManagerCard";
import { FastbootPartitionManagerCard } from "./FastbootPartitionManagerCard";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "16px 20px",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  headerTabList: {
    flexShrink: 0,
    alignSelf: "flex-start",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "4px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minHeight: "36px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "13px",
      padding: "6px 14px",
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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "hidden",
  },
  tabContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  tabContent: {
    flex: "1 1 0",
    minHeight: 0,
    overflow: "auto",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    gap: "20px",
    textAlign: "center",
    padding: "20px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  overlayIcon: {
    fontSize: "64px",
    color: "var(--colorBrandForeground1)",
    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))",
    marginBottom: "8px",
  },
  overlayText: {
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  overlayActions: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
  },
  warningCard: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    border: "1px solid var(--colorPaletteRedBorder1)",
  },
  warningContent: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  warningText: {
    flex: 1,
  },
  noDevice: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
    color: "var(--colorNeutralForeground2)",
  },
});

type FlashZoneView =
  | "partition-manager"
  | "rom-manager"
  | "unified-flash"
  | "unlock-tools";

const FlashZonePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<FlashZoneView>("partition-manager");
  const [showOverlay, setShowOverlay] = useState(false);
  const connectedDevices = devices.filter((d) => d.connected);

  // 检查设备是否处于 Fastboot 或 Fastbootd 模式
  const isFastbootMode =
    selectedDevice?.mode === "fastboot" || selectedDevice?.mode === "fastbootd";
  
  const triggerOverlay = () => {
    setShowOverlay(true);
  };

  // Navigation Params Handling
  const navigationParams = useAppStore((state) => state.navigationParams);
  const setNavigationParams = useAppStore((state) => state.setNavigationParams);

  React.useEffect(() => {
    if (navigationParams?.flashTab) {
      let targetTab = navigationParams.flashTab as string;
      if (targetTab === "image-flash" || targetTab === "xiaomi-flash") {
        targetTab = "unified-flash";
      }
      setCurrentView(targetTab as FlashZoneView);
      setNavigationParams(undefined);
    }
  }, [navigationParams, setNavigationParams]);

  const tabs = [
    {
      id: "partition-manager" as FlashZoneView,
      label: t("flash.tab_partition_manager", "分区管理"),
      icon: <Layer24Regular />,
    },
    {
      id: "rom-manager" as FlashZoneView,
      label: t("flash.tab_rom_manager", "ROM 管理"),
      icon: <Archive24Regular />,
    },
    {
      id: "unified-flash" as FlashZoneView,
      label: t("flash.tab_unified_flash", "刷写工具 (镜像/线刷包)"),
      icon: <Flash24Regular />,
    },
    {
      id: "unlock-tools" as FlashZoneView,
      label: t("flash.tab_unlock", "解锁工具"),
      icon: <LockOpen24Regular />,
    },
  ];

  const renderContent = () => {
    // 优先匹配处于 Fastboot 模式的设备，其次使用已选设备或首个连接设备
    const deviceToUse =
      connectedDevices.find((d) => d.mode === "fastboot" || d.mode === "fastbootd") ||
      selectedDevice ||
      connectedDevices[0] ||
      null;

    switch (currentView) {
      case "partition-manager":
        return <FastbootPartitionManagerCard device={deviceToUse} />;
      case "rom-manager":
        return <RomManagerCard />;
      case "unified-flash":
        return <UnifiedFlashCard device={deviceToUse} />;
      case "unlock-tools":
        return <XiaomiUnlockCard device={deviceToUse} />;
      default:
        return <FastbootPartitionManagerCard device={deviceToUse} />;
    }
  };

  return (
    <div className={styles.container}>
      {false ? (
        <div className={styles.noDevice}>
          <Code24Regular
            style={{
              fontSize: "48px",
              color: "var(--colorNeutralForeground3)",
            }}
          />
          <Text size={400}>{t("flash.no_device_title")}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t("flash.no_device_hint")}
          </Text>
        </div>
      ) : false ? (
        <div className={styles.noDevice}>
          <Settings24Regular
            style={{
              fontSize: "48px",
              color: "var(--colorNeutralForeground3)",
            }}
          />
          <Text size={400}>{t("flash.select_device_title")}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t("flash.select_device_hint")}
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.tabContainer}>
            <TabList
              id="tour-flash-tabs"
              selectedValue={currentView}
              onTabSelect={(_, data) =>
                setCurrentView(data.value as FlashZoneView)
              }
              className={styles.headerTabList}
            >
              {tabs.map((tab) => (
                <Tab key={tab.id} value={tab.id} icon={tab.icon}>
                  {tab.label}
                </Tab>
              ))}
            </TabList>

            <div className={styles.tabContent}>
              {renderContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashZonePanel;
