import React, { useState } from "react";

import {
  makeStyles,
  Text,
  TabList,
  Tab,
  Button,
  tokens,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Settings24Regular,
  Play24Regular,
  Apps24Regular,
  Folder24Regular,
  Wifi124Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import ScreenMirrorPanel from "./ScreenMirrorPanel";
import AppManagerPanel from "./AppManagerPanel";
import AppInstallPanel from "./AppInstallPanel";
import FileManagerPanel from "./FileManagerPanel";
import DeviceControlPanel from "./DeviceControlPanel";
import { useTranslation } from "react-i18next";

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
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
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
  headerTabList: {
    flexShrink: 0,
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
  overlayText: {
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  overlayActions: {
    marginTop: tokens.spacingVerticalL,
    display: "flex",
    justifyContent: "center",
  },
});

type AdbZoneView =
  | "device-control"
  | "screen-mirror"
  | "app_install"
  | "app-manager"
  | "file-manager";

const AdbZonePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<AdbZoneView>("device-control");
  const [showOverlay, setShowOverlay] = useState(false);

  const connectedDevices = devices.filter((d) => d.connected);

  const triggerOverlay = () => {
    setShowOverlay(true);
  };

  const tabs = [
    {
      id: "device-control" as AdbZoneView,
      label: t("adb.device_control"),
      icon: <Play24Regular />,
    },
    {
      id: "screen-mirror" as AdbZoneView,
      label: t("adb.screen_mirror"),
      icon: <Settings24Regular />,
    },
    {
      id: "app_install" as AdbZoneView,
      label: t("adb.app_install"),
      icon: <Apps24Regular />,
    },
    {
      id: "app-manager" as AdbZoneView,
      label: t("adb.app_manager"),
      icon: <Settings24Regular />,
    },
    {
      id: "file-manager" as AdbZoneView,
      label: t("adb.file_manager"),
      icon: <Folder24Regular />,
    },
  ];

  /* Updated renderContent to handle new views */
  const renderContent = () => {
    const device = selectedDevice;

    switch (currentView) {
      case "device-control":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <DeviceControlPanel
              device={selectedDevice}
              onAdbRequired={triggerOverlay}
            />
          </div>
        );
      case "screen-mirror":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <ScreenMirrorPanel device={device} onAdbRequired={triggerOverlay} />
          </div>
        );
      case "app-manager":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <AppManagerPanel device={device} onAdbRequired={triggerOverlay} />
          </div>
        );
      case "app_install":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <AppInstallPanel device={device} onAdbRequired={triggerOverlay} />
          </div>
        );
      case "file-manager":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <FileManagerPanel device={device} onAdbRequired={triggerOverlay} />
          </div>
        );
      default:
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <DeviceControlPanel
              device={selectedDevice}
              onAdbRequired={triggerOverlay}
            />
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.tabContainer}>
          <TabList
            id="tour-adb-tabs"
            selectedValue={currentView}
            onTabSelect={(_, data) => setCurrentView(data.value as AdbZoneView)}
            className={styles.headerTabList}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                icon={tab.icon}
                className={styles.tab}
              >
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
                    {t("adb.adb_mode_required_title")}
                  </Text>
                  <Text
                    size={300}
                    style={{ color: "var(--colorNeutralForeground2)" }}
                  >
                    {t("adb.adb_mode_required_desc")}
                  </Text>
                  <div className={styles.overlayActions}>
                    <Button
                      appearance="primary"
                      onClick={() => setShowOverlay(false)}
                    >
                      {t("common.close")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdbZonePanel;
