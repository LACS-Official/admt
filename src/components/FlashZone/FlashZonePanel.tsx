import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Badge,
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
    borderColor: "var(--colorPaletteRedBorder1)",
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
      label: "小米线刷",
      icon: <Flash24Regular />,
    },
    {
      id: "system-backup" as FlashZoneView,
      label: "系统备份",
      icon: <Database24Regular />,
    },
  ];

  const renderContent = () => {
    if (!selectedDevice) return null;

    switch (currentView) {
      case "unlock-tools":
        return <XiaomiUnlockCard device={selectedDevice} />;
      case "image-flash":
        return <ImageFlashCard device={selectedDevice} />;
      case "xiaomi-flash":
        return <XiaomiFlashCard device={selectedDevice} />;
      case "system-backup":
        return <SystemToolCard device={selectedDevice} />;
      default:
        return <XiaomiUnlockCard device={selectedDevice} />;
    }
  };

  return (
    <div className={styles.container}>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <CloudArrowUp24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>未检测到设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备已连接并启用USB调试
          </Text>
        </div>
      ) : !selectedDevice ? (
        <div className={styles.noDevice}>
          <Settings24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>请选择一个设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            从设备信息页面选择要操作的设备
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <Card className={styles.warningCard}>
            <CardHeader>
              <div className={styles.warningContent}>
                <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                <div className={styles.warningText}>
                  <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                    ⚠️ 刷机风险警告
                  </Text>
                  <Text size={300} style={{ color: "var(--colorPaletteRedForeground2)" }}>
                    刷机操作具有极高风险，可能导致设备永久损坏（变砖）、保修失效或数据完全丢失。请确保您完全了解操作风险，已备份所有重要数据，并准备好相应的救砖工具。
                  </Text>
                </div>
              </div>
            </CardHeader>
          </Card>

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
      )}
    </div>
  );
};

export default FlashZonePanel;
