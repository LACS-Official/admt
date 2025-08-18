import React, { useState } from "react";
import {
  makeStyles,
  Tab,
  TabList,
  SelectTabEvent,
  SelectTabData,
} from "@fluentui/react-components";
import {
  Info24Regular,
  Wrench24Regular,
  Options24Regular,
  Document24Regular,
  Shield24Regular,
  DeviceEq24Regular,
  Desktop24Regular,
} from "@fluentui/react-icons";
import { SettingsView } from "../../types/app";
import AboutPanel from "./AboutPanel";
import DeviceSettingsPanel from "./DeviceSettingsPanel";
import DisplaySettingsPanel from "./DisplaySettingsPanel";
import OtherSettingsPanel from "./OtherSettingsPanel";
import LogsPanel from "./LogsPanel";
import PrivacyManagementPanel from "../Privacy/PrivacyManagementPanel";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  tabContainer: {
    marginBottom: "20px",
  },
  tabList: {
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
});

const tabs = [
  {
    id: "about" as SettingsView,
    label: "关于",
    icon: <Info24Regular />,
  },
  {
    id: "devices-settings" as SettingsView,
    label: "设备检测设置",
    icon: <DeviceEq24Regular />,
  },
    {
    id: "other-settings" as SettingsView,
    label: "基础设置",
    icon: <Options24Regular />,
  },
  {
    id: "display-settings" as SettingsView,
    label: "显示设置",
    icon: <Desktop24Regular />,
  },

  {
    id: "privacy" as SettingsView,
    label: "隐私政策",
    icon: <Shield24Regular />,
  },
  {
    id: "logs" as SettingsView,
    label: "日志",
    icon: <Document24Regular />,
  },
];

const SettingsPanel: React.FC = () => {
  const styles = useStyles();
  const [currentView, setCurrentView] = useState<SettingsView>("about");

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setCurrentView(data.value as SettingsView);
  };

  const renderContent = () => {
    switch (currentView) {
      case "about":
        return <AboutPanel />;
      case "devices-settings":
        return <DeviceSettingsPanel />;
      case "display-settings":
        return <DisplaySettingsPanel />;
      case "other-settings":
        return <OtherSettingsPanel />;
      case "privacy":
        return <PrivacyManagementPanel />;
      case "logs":
        return <LogsPanel />;
    }
  };



  return (
    <div className={styles.container}>

      <div className={styles.tabContainer}>
        <TabList
          selectedValue={currentView}
          onTabSelect={handleTabSelect}
          className={styles.tabList}
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
      </div>

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsPanel;
