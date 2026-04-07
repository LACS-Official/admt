import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  Tab,
  TabList,
  SelectTabEvent,
  SelectTabData,
} from "@fluentui/react-components";
import {
  Info24Regular,
  Options24Regular,
  Shield24Regular,
  DeviceEq24Regular,
  Desktop24Regular,
  Bot24Regular,
} from "@fluentui/react-icons";
import { SettingsView } from "../../types/app";
import AboutPanel from "./AboutPanel";
import DeviceSettingsPanel from "./DeviceSettingsPanel";
import DisplaySettingsPanel from "./DisplaySettingsPanel";
import OtherSettingsPanel from "./OtherSettingsPanel";
import PrivacyManagementPanel from "./PrivacyManagementPanel";
import AISettingsPanel from "./AISettingsPanel";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    gap: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "5px",
  },
  tabContainer: {
    marginBottom: "0px",
  },
  tabList: {
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
  headerTabList: {
    flex: "1 1 auto",
    maxHeight: "45px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "8px",
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
      border: "1px solid var(--colorNeutralStroke2)",
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
  tab: {
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
      color: "var(--colorNeutralForeground1)",
      transform: "translateY(-1px)",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
  },
});

const tabs = [
  {
    id: "about" as SettingsView,
    label: "settings.tabs.about",
    icon: <Info24Regular />,
  },
  {
    id: "devices-settings" as SettingsView,
    label: "settings.tabs.device_settings",
    icon: <DeviceEq24Regular />,
  },
  {
    id: "other-settings" as SettingsView,
    label: "settings.tabs.basic_settings",
    icon: <Options24Regular />,
  },
  {
    id: "display-settings" as SettingsView,
    label: "settings.tabs.display_settings",
    icon: <Desktop24Regular />,
  },
  {
    id: "privacy" as SettingsView,
    label: "settings.tabs.privacy",
    icon: <Shield24Regular />,
  },
  {
    id: "ai-settings" as SettingsView,
    label: "settings.tabs.ai_settings",
    icon: <Bot24Regular />,
  },
];

const SettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
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
      case "ai-settings":
        return <AISettingsPanel />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.tabContainer}>
        <TabList
          id="tour-settings-tabs"
          selectedValue={currentView}
          onTabSelect={handleTabSelect}
          className={styles.headerTabList}
        >
          {tabs.map((tab) => (
            <Tab key={tab.id} value={tab.id} icon={tab.icon}>
              {t(tab.label)}
            </Tab>
          ))}
        </TabList>
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default SettingsPanel;
