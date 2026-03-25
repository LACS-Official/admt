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
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import XiaomiUnlockCard from "../Tools/XiaomiUnlockCard";
import ImageFlashCard from "../Tools/ImageFlashCard";
import XiaomiFlashCard from "../Tools/XiaomiFlashCard";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    gap: "24px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  headerTabList: {
    flex: "1 1 auto",
    maxHeight: "45px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "6px",
    padding: "4px 8px",
    //居中显示
    display: "flex",
    alignItems: "center",
    "& .fui-TabList": {
      minHeight: "32px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "6px 12px",
      minHeight: "28px",
      borderRadius: "8px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 4px",
      border: "1px solid var(--colorNeutralStroke2)",

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
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "16px",
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
    gap: "16px",
    flex: 1,
    overflow: "hidden",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  tabContent: {
    flex: 1,
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
  | "unlock-tools"
  | "image-flash"
  | "xiaomi-flash";

const FlashZonePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<FlashZoneView>("unlock-tools");
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
      setCurrentView(navigationParams.flashTab as FlashZoneView);
      setNavigationParams(undefined);
    }
  }, [navigationParams, setNavigationParams]);

  const tabs = [
    {
      id: "unlock-tools" as FlashZoneView,
      label: t("flash.tab_unlock"),
      icon: <LockOpen24Regular />,
    },
    {
      id: "image-flash" as FlashZoneView,
      label: t("flash.tab_image"),
      icon: <CloudArrowUp24Regular />,
    },
    {
      id: "xiaomi-flash" as FlashZoneView,
      label: t("flash.tab_rom"),
      icon: <Flash24Regular />,
    },
  ];

  const renderContent = () => {
    // 即使没有选中设备也显示默认内容，以支持刷机过程中设备断开的情况
    const deviceToUse = selectedDevice || connectedDevices[0] || null;

    switch (currentView) {
      case "unlock-tools":
        return deviceToUse ? (
          <XiaomiUnlockCard device={deviceToUse} />
        ) : (
          <XiaomiUnlockCard device={null} />
        );
      case "image-flash":
        return deviceToUse ? (
          <ImageFlashCard device={deviceToUse} onFastbootRequired={triggerOverlay} />
        ) : (
          <ImageFlashCard device={null as any} onFastbootRequired={triggerOverlay} />
        );
      case "xiaomi-flash":
        return deviceToUse ? (
          <XiaomiFlashCard device={deviceToUse} onFastbootRequired={triggerOverlay} />
        ) : (
          <XiaomiFlashCard device={null as any} onFastbootRequired={triggerOverlay} />
        );
      default:
        return deviceToUse ? (
          <XiaomiUnlockCard device={deviceToUse} />
        ) : (
          <XiaomiUnlockCard device={null} />
        );
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
            {showOverlay && (
              <div className={styles.overlay}>
                <div className={styles.overlayText}>
                  <Text size={600} weight="bold">
                    {t('flash.fastboot_mode_required_title')}
                  </Text>
                  <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                    {t('flash.fastboot_mode_required_desc')}
                  </Text>
                  <div className={styles.overlayActions}>
                    <Button appearance="primary" onClick={() => setShowOverlay(false)}>
                      {t('common.close')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashZonePanel;
