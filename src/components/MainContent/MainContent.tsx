import React from "react";
import {
  makeStyles,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  Folder24Regular,
  Code24Regular,
  Settings24Regular,
  Wrench24Regular,
  Power24Regular,
  Apps24Regular,
  Desktop24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { AppView } from "../../types/app";
import DeviceInfoPanel from "../DeviceInfo/DeviceInfoPanel";
import FileManagerPanel from "../FileManager/FileManagerPanel";
import AdbToolsPanel from "../AdbTools/AdbToolsPanel";
import DeviceControlPanel from "../DeviceControl/DeviceControlPanel";
import AppManagerPanel from "../AppManager/AppManagerPanel";
import ScreenMirrorPanel from "../ScreenMirror/ScreenMirrorPanel";
import ToolsPanel from "../Tools/ToolsPanel";
import SettingsPanel from "../Settings/SettingsPanel";

const useStyles = makeStyles({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabList: {
    backgroundColor: "var(--colorNeutralBackground1)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    paddingLeft: "12px",
    minHeight: "40px",
  },
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
});

const tabs = [
  {
    id: "device-info" as AppView,
    label: "设备信息",
    icon: <Phone24Regular />,
  },
  {
    id: "file-manager" as AppView,
    label: "文件管理",
    icon: <Folder24Regular />,
  },
  {
    id: "adb-tools" as AppView,
    label: "ADB工具",
    icon: <Code24Regular />,
  },
  {
    id: "device-control" as AppView,
    label: "设备控制",
    icon: <Power24Regular />,
  },
  {
    id: "app-manager" as AppView,
    label: "APK管理",
    icon: <Apps24Regular />,
  },
  {
    id: "screen-mirror" as AppView,
    label: "安卓投屏",
    icon: <Desktop24Regular />,
  },
  {
    id: "tools" as AppView,
    label: "工具箱",
    icon: <Wrench24Regular />,
  },
  {
    id: "settings" as AppView,
    label: "设置",
    icon: <Settings24Regular />,
  },
];

const MainContent: React.FC = () => {
  const styles = useStyles();
  const { currentView, setCurrentView } = useAppStore();

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setCurrentView(data.value as AppView);
  };

  const renderContent = () => {
    switch (currentView) {
      case "device-info":
        return <DeviceInfoPanel />;
      case "file-manager":
        return <FileManagerPanel />;
      case "adb-tools":
        return <AdbToolsPanel />;
      case "device-control":
        return <DeviceControlPanel />;
      case "app-manager":
        return <AppManagerPanel />;
      case "screen-mirror":
        return <ScreenMirrorPanel />;
      case "tools":
        return <ToolsPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <DeviceInfoPanel />;
    }
  };

  return (
    <div className={styles.container}>
      <TabList
        selectedValue={currentView}
        onTabSelect={handleTabSelect}
        className={styles.tabList}
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} icon={tab.icon}>
            {tab.label}
          </Tab>
        ))}
      </TabList>
      
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;
