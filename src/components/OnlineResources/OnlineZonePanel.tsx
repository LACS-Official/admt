import React, { useState, useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import {
  makeStyles,
  TabList,
  Tab,
  Button,
  CounterBadge,
  mergeClasses,
} from "@fluentui/react-components";
import {
  CloudArrowUp24Regular,
  Apps24Regular,
  Brain24Regular,
  ArrowDownload24Regular,
  Sparkle24Regular,
} from "@fluentui/react-icons";
import { DownloadManagerPanel } from "./DownloadManagerPanel";
import OnlineResourcesPanel from "./OnlineResourcesPanel";
import PluginStorePanel from "./PluginStorePanel";
import SkillsMcpPanel from "./SkillsMcpPanel";
import { RomDownloadCenterCard } from "../FlashZone/RomDownloadCenterCard";
import { onlineResourcesService } from '../../services/onlineResourcesService';
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "16px 20px",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  topHeaderBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexShrink: 0,
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
  downloadBtn: {
    borderRadius: "9999px",
    fontSize: "13px",
    padding: "6px 16px",
    minHeight: "36px",
    fontWeight: 500,
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground2)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  downloadBtnActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
    boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    border: "1px solid var(--colorNeutralStroke1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorBrandForeground1)",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
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
    gap: "12px",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  tabContent: {
    flex: "1 1 0",
    minHeight: 0,
    overflow: "auto",
  },
  warningCard: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    border: "1px solid var(--colorPaletteRedBorder1)",
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

type FlashZoneView = "online-resources" | "rom-download" | "plugin-store" | "skills-mcp" | "download-manager";

const OnlineZonePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<FlashZoneView>("online-resources");
  const navigationParams = useAppStore((state) => state.navigationParams);
  const setNavigationParams = useAppStore((state) => state.setNavigationParams);

  useEffect(() => {
    if (navigationParams?.onlineTab) {
      const tab = navigationParams.onlineTab;
      if (tab === "skills-resources" || tab === "mcp-resources") {
        setCurrentView("skills-mcp");
      } else {
        setCurrentView(tab as FlashZoneView);
      }
      setNavigationParams(undefined);
    }
  }, [navigationParams, setNavigationParams]);

  const [downloadStats, setDownloadStats] = useState({
    total: 0,
    downloading: 0,
    extracting: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    paused: 0,
  });

  // 更新下载统计信息
  useEffect(() => {
    const updateDownloadStats = () => {
      const stats = onlineResourcesService.getDownloadStats();
      setDownloadStats(stats);
    };

    // 初始加载
    updateDownloadStats();

    // 设置定时更新
    const interval = setInterval(updateDownloadStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    {
      id: "online-resources" as FlashZoneView,
      label: t('online_resources.tabs.software_store', '软件商店'),
      icon: <CloudArrowUp24Regular />,
    },
    {
      id: "rom-download" as FlashZoneView,
      label: "Rom 下载",
      icon: <ArrowDownload24Regular />,
    },
    {
      id: "plugin-store" as FlashZoneView,
      label: t('online_resources.tabs.plugin_store', '插件商店'),
      icon: <Apps24Regular />,
    },
    {
      id: "skills-mcp" as FlashZoneView,
      label: "Skills & MCP",
      icon: <Sparkle24Regular />,
    },
  ];

  const renderContent = () => {
    switch (currentView) {
      case "online-resources":
        return <OnlineResourcesPanel />;
      case "rom-download":
        return <RomDownloadCenterCard />;
      case "plugin-store":
        return <PluginStorePanel />;
      case "skills-mcp":
        return <SkillsMcpPanel />;
      case "download-manager":
        return <DownloadManagerPanel onBack={() => setCurrentView("online-resources")}/>;
      default:
        return <OnlineResourcesPanel />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.tabContainer}>
          <div className={styles.topHeaderBar}>
            <TabList
              id="tour-online-tabs"
              selectedValue={currentView === "download-manager" ? "" : currentView}
              onTabSelect={(_, data) => setCurrentView(data.value as FlashZoneView)}
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

            <Button
              shape="circular"
              icon={<ArrowDownload24Regular />}
              onClick={() => setCurrentView(currentView === "download-manager" ? "online-resources" : "download-manager")}
              className={mergeClasses(
                styles.downloadBtn,
                currentView === "download-manager" && styles.downloadBtnActive
              )}
            >
              {t('online_resources.tabs.download_manager', '下载管理')}
              {downloadStats.total > 0 && (
                <CounterBadge
                  count={downloadStats.total}
                  color={currentView === "download-manager" ? "brand" : "brand"}
                  size="small"
                  style={{ marginLeft: '6px' }}
                />
              )}
            </Button>
          </div>

          <div className={styles.tabContent}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineZonePanel;