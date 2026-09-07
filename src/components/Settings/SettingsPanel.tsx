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
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "16px 24px",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  tabContainer: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
    flexShrink: 0,
    marginBottom: "4px",
  },
  content: {
    flex: "1 1 0",
    minHeight: 0,
    overflow: "auto",
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
    label: "settings.tabs.privacy_security",
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
  const { navigationParams } = useAppStore();
  const [currentView, setCurrentView] = useState<SettingsView>(
    (navigationParams?.tab as SettingsView) || (navigationParams?.subView as SettingsView) || "about"
  );

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
              {tab.id === "privacy" ? "隐私安全" : t(tab.label)}
            </Tab>
          ))}
        </TabList>
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default SettingsPanel;
