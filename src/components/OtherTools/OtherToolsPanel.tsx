import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Badge,
  TabList,
  Tab,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  Folder24Regular,
  Desktop24Regular,
  Code24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import FileManagerPanel from "../FileManager/FileManagerPanel";
import AppManagerPanel from "../AppManager/AppManagerPanel";
import ScreenMirrorPanel from "../ScreenMirror/ScreenMirrorPanel";
import DeveloperToolCard from "../Tools/DeveloperToolCard";

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

type OtherToolsView = "file-manager" | "app-manager" | "screen-mirror" | "developer-tools";

const OtherToolsPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<OtherToolsView>("file-manager");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "file-manager" as OtherToolsView,
      label: "文件管理",
      icon: <Folder24Regular />,
    },
    {
      id: "app-manager" as OtherToolsView,
      label: "应用管理",
      icon: <Apps24Regular />,
    },
    {
      id: "screen-mirror" as OtherToolsView,
      label: "屏幕镜像",
      icon: <Desktop24Regular />,
    },
    {
      id: "developer-tools" as OtherToolsView,
      label: "开发工具",
      icon: <Code24Regular />,
    },
  ];

  const renderContent = () => {
    if (!selectedDevice) return null;

    switch (currentView) {
      case "file-manager":
        return <FileManagerPanel />;
      case "app-manager":
        return <AppManagerPanel />;
      case "screen-mirror":
        return <ScreenMirrorPanel />;
      case "developer-tools":
        return <DeveloperToolCard device={selectedDevice} />;
      default:
        return <FileManagerPanel />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Apps24Regular />
          <Text size={500} weight="semibold">其他功能</Text>
          {selectedDevice && (
            <Badge appearance="filled" color="success">
              {selectedDevice.serial}
            </Badge>
          )}
        </div>
        
        <div className={styles.headerRight}>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            {connectedDevices.length} 台设备已连接
          </Text>
        </div>
      </div>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Apps24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
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
            onTabSelect={(_, data) => setCurrentView(data.value as OtherToolsView)}
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

export default OtherToolsPanel;
