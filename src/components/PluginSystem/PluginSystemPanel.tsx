import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  TabList,
  Tab,
  CounterBadge,
  Text,
  Button,
} from "@fluentui/react-components";
import {
  AppsAddIn24Regular,
  ArrowUpload24Regular,
  BookOpen24Regular,
  DocumentSparkle24Regular,
  BuildingShop24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { usePluginStore } from "../../stores/pluginStore";
import { useAppStore } from "../../stores/appStore";
import InstalledPluginsTab from "./InstalledPluginsTab";
import ImportPluginTab from "./ImportPluginTab";
import PluginDevDocsTab from "./PluginDevDocsTab";
import PluginPublishDocsTab from "./PluginPublishDocsTab";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  headerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("10px"),
    ...shorthands.padding("6px 12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  headerTabList: {
    "& .fui-TabList": {
      minHeight: "32px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "6px 14px",
      minHeight: "28px",
      borderRadius: "8px",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      border: "1px solid var(--colorNeutralStroke2)",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 3px",

      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground2)",
        color: "var(--colorNeutralForeground1)",
        transform: "translateY(-1px)",
      },

      "&[aria-selected='true']": {
        backgroundColor: "var(--colorBrandBackground2)",
        color: "var(--colorBrandForeground1)",
        border: "1px solid var(--colorBrandStroke2)",
        fontWeight: 600,
      },
    },
  },
  contentArea: {
    flex: 1,
    overflow: "hidden",
  },
});

type PluginSubView = "installed" | "import_install" | "dev_docs" | "publish_docs";

const PluginSystemPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PluginSubView>("installed");

  const installedPlugins = usePluginStore((state) => state.installedPlugins);
  const setCurrentView = useAppStore((state) => state.setCurrentView);

  const tabs = [
    {
      id: "installed" as PluginSubView,
      label: t("plugin_system.tabs.installed", "已安装插件"),
      icon: <AppsAddIn24Regular />,
      count: installedPlugins.length,
    },
    {
      id: "import_install" as PluginSubView,
      label: t("plugin_system.tabs.import_install", "导入与安装"),
      icon: <ArrowUpload24Regular />,
    },
    {
      id: "dev_docs" as PluginSubView,
      label: t("plugin_system.tabs.dev_docs", "开发文档"),
      icon: <BookOpen24Regular />,
    },
    {
      id: "publish_docs" as PluginSubView,
      label: t("plugin_system.tabs.publish_docs", "上架与发布"),
      icon: <DocumentSparkle24Regular />,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "installed":
        return (
          <InstalledPluginsTab
            onGoToStore={() => setCurrentView("online-resources")}
            onGoToImport={() => setActiveTab("import_install")}
          />
        );
      case "import_install":
        return <ImportPluginTab onInstallSuccess={() => setActiveTab("installed")} />;
      case "dev_docs":
        return <PluginDevDocsTab />;
      case "publish_docs":
        return <PluginPublishDocsTab />;
      default:
        return <InstalledPluginsTab />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerBar}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as PluginSubView)}
          className={styles.headerTabList}
        >
          {tabs.map((tab) => (
            <Tab key={tab.id} value={tab.id} icon={tab.icon}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <CounterBadge
                  count={tab.count}
                  color="brand"
                  size="small"
                  style={{ marginLeft: "6px" }}
                />
              )}
            </Tab>
          ))}
        </TabList>

        <Button
          size="small"
          appearance="subtle"
          icon={<BuildingShop24Regular />}
          onClick={() => setCurrentView("online-resources")}
        >
          前往插件商店
        </Button>
      </div>

      <div className={styles.contentArea}>{renderTabContent()}</div>
    </div>
  );
};

export default PluginSystemPanel;
