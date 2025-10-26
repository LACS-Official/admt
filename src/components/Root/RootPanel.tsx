
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
  Apps24Regular,
  Folder24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import AdbToolsPanel from "../Others/CommandExecutePanel";
import SystemControlCard from "../DeviceControl/SystemControlCard";
import ScreenMirrorPanel from '../ScreenMirror/ScreenMirrorPanel';

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
    overflow: "auto"
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
      borderRadius: "6px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      border: "1px solid transparent",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 4px",
      
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
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
      },
    },
    
    "@media (max-width: 768px)": {
      "& .fui-Tab": {
        fontSize: "11px",
        padding: "4px 8px",
      },
    },
  },
});

type AdbZoneView = "adb-tools" | "device-control" | "app_install" | "file-manager" | "screen-mirror" | "app-manager" ;

const RootPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<AdbZoneView>("adb-tools");

  const connectedDevices = devices.filter(d => d.connected);

  const tabs = [
    {
      id: "adb-tools" as AdbZoneView,
      label: "SU环境",
      icon: <Code24Regular />,
    },
    {
      id: "device-control" as AdbZoneView,
      label: "设备控制",
      icon: <Play24Regular />,
    },
    {
      id: "screen-mirror" as AdbZoneView,
      label: "设备投屏",
      icon: <Settings24Regular />,
    },
    {
      id: "app_install" as AdbZoneView,
      label: "应用安装",
      icon: <Apps24Regular />,
    },
    {
      id: "app-manager" as AdbZoneView,
      label: "应用管理",
      icon: <Settings24Regular />,
    },
    {
      id: "file-manager" as AdbZoneView,
      label: "文件管理",
      icon: <Folder24Regular />,
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
      case "screen-mirror":
        return (
          <div style={{ height: "100%", overflow: "hidden" }}>
            <ScreenMirrorPanel />
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
              className={styles.headerTabList}
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

export default RootPanel;
