import React, { useState }  from 'react';
import {
  makeStyles,
  Text,
  Badge,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  Folder24Regular,
  Desktop24Regular,
  Settings24Regular,
  Apps24Regular,
  Code24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import FileManagerPanel from "../FileManager/FileManagerPanel";
import ScreenMirrorPanel from "../ScreenMirror/ScreenMirrorPanel";
import AppManagerPanel from "../AppManager/AppManagerPanel";
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

type DeviceManagementView = "file-manager" | "screen-mirror" | "app-manager";

const DeviceManagementPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<DeviceManagementView>("file-manager");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "file-manager" as DeviceManagementView,
      label: "文件管理",
      icon: <Folder24Regular />,
    },
    {
      id: "screen-mirror" as DeviceManagementView,
      label: "屏幕镜像",
      icon: <Desktop24Regular />,
    },
    {
      id: "app-manager" as DeviceManagementView,
      label: "应用管理",
      icon: <Apps24Regular />,
    },
  ];

  const renderContent = () => {
    if (!selectedDevice) return null;

    switch (currentView) {
      case "file-manager":
        return <FileManagerPanel />;
      case "screen-mirror":
        return <ScreenMirrorPanel />;
      case "app-manager":
        return <AppManagerPanel />;
      default:
        return <FileManagerPanel />;
    }
  };

  return (
    <div className={styles.container}>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Phone24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
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
        <div className={styles.tabContainer}>
          <TabList
            selectedValue={currentView}
            onTabSelect={(_, data) => setCurrentView(data.value as DeviceManagementView)}
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
      )}
    </div>
  );
};

export default DeviceManagementPanel;
