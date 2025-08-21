
import React, { useState }  from 'react';

import {
  makeStyles,
  Text,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Settings24Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import AdbToolsPanel from "../AdbTools/AdbToolsPanel";
import SystemControlCard from "../DeviceControl/SystemControlCard";

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
    overflow: "hidden",
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

type AdbZoneView = "adb-tools" | "device-control";

const AdbZonePanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<AdbZoneView>("adb-tools");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "adb-tools" as AdbZoneView,
      label: "ADB命令",
      icon: <Code24Regular />,
    },
    {
      id: "device-control" as AdbZoneView,
      label: "设备控制",
      icon: <Play24Regular />,
    },
  ];

  const renderContent = () => {
    if (!selectedDevice) return null;

    switch (currentView) {
      case "adb-tools":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <AdbToolsPanel />
          </div>
        );
      case "device-control":
        return (
          <div style={{
            height: "100%",
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            padding: "16px"
          }}>
            <SystemControlCard device={selectedDevice} />
          </div>
        );
      default:
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <AdbToolsPanel />
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Code24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
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
          <div className={styles.tabContainer}>
            <TabList
              selectedValue={currentView}
              onTabSelect={(_, data) => setCurrentView(data.value as AdbZoneView)}
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

export default AdbZonePanel;
