import React, { useState }  from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  CloudArrowUp24Regular,
  Settings24Regular,
  Warning24Regular,
  LockOpen24Regular,
  Database24Regular,
  Flash24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import SystemToolCard from "../Tools/SystemToolCard";
import XiaomiUnlockCard from "../Tools/XiaomiUnlockCard";
import ImageFlashCard from "../Tools/ImageFlashCard";
import XiaomiFlashCard from "../Tools/XiaomiFlashCard";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "24px",
    gap: "24px",
    backgroundColor: "var(--colorNeutralBackground2)",
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
  },
  tabContent: {
    flex: 1,
    overflow: "auto",
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

type FlashZoneView = "unlock-tools" | "image-flash" | "xiaomi-flash" | "system-backup";

const FlashZonePanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<FlashZoneView>("unlock-tools");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "unlock-tools" as FlashZoneView,
      label: "解锁工具",
      icon: <LockOpen24Regular />,
    },
    {
      id: "image-flash" as FlashZoneView,
      label: "镜像刷入",
      icon: <CloudArrowUp24Regular />,
    },
    {
      id: "xiaomi-flash" as FlashZoneView,
      label: "线刷工具",
      icon: <Flash24Regular />,
    },
  ];

  const renderContent = () => {
    // 即使没有选中设备也显示默认内容，以支持刷机过程中设备断开的情况
    const deviceToUse = selectedDevice || connectedDevices[0] || null;

    switch (currentView) {
      case "unlock-tools":
        return deviceToUse ? <XiaomiUnlockCard device={deviceToUse} /> : <XiaomiUnlockCard device={null} />;
      case "image-flash":
        return deviceToUse ? <ImageFlashCard device={deviceToUse} /> : <ImageFlashCard device={null} />;
      case "xiaomi-flash":
        return deviceToUse ? <XiaomiFlashCard device={deviceToUse} /> : <XiaomiFlashCard device={null} />;
      case "system-backup":
        return deviceToUse ? <SystemToolCard device={deviceToUse} /> : <SystemToolCard device={null} />;
      default:
        return deviceToUse ? <XiaomiUnlockCard device={deviceToUse} /> : <XiaomiUnlockCard device={null} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.tabContainer}>
          <TabList
            selectedValue={currentView}
            onTabSelect={(_, data) => setCurrentView(data.value as FlashZoneView)}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                icon={tab.icon}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>

          <div className={styles.tabContent}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashZonePanel;
