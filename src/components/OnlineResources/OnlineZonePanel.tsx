/*
在线资源-在线资源区域卡片页面
*/  
import React, { useState, useEffect} from 'react';
import { useTranslation } from "react-i18next";
import {
  makeStyles,
  TabList,
  Tab,
  CounterBadge,
} from "@fluentui/react-components";
import {
  CloudArrowUp24Regular,
} from "@fluentui/react-icons";
import { DownloadManagerPanel } from "./DownloadManagerPanel";
import OnlineResourcesPanel from "./OnlineResourcesPanel";
import RomDownloadPanel from './RomDownloadPanel';
import { onlineResourcesService } from '../../services/onlineResourcesService';



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

type FlashZoneView =  "online-resources" | "rom-download" | "download-manager";

const OnlineZonePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<FlashZoneView>("online-resources");
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
      label: t('online.app_store'),
      icon: <CloudArrowUp24Regular />,
    },
    {
      id: "rom-download" as FlashZoneView,
      label: t('online.rom_store'),
      icon: <CloudArrowUp24Regular />,
    },
    {
      id: "download-manager" as FlashZoneView,
      label: t('online.download_manager'),
      icon: <CloudArrowUp24Regular />,
    },
  ];

  const renderContent = () => {

    switch (currentView) {
      case "online-resources":
        return <OnlineResourcesPanel />;
      case "download-manager":
        return <DownloadManagerPanel onBack={() => {}}/>;
      case "rom-download":
        return <RomDownloadPanel/>;
      default:
       return <OnlineResourcesPanel />;
    }
  };

  return (
        <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.tabContainer}>
          <TabList
            selectedValue={currentView}
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
                {tab.id === "download-manager" && downloadStats.total > 0 && (
                  <CounterBadge
                    count={downloadStats.total}
                    color="brand"
                    size="small"
                    style={{ marginLeft: '4px' }}
                  />
                )}
              </Tab>
            ))}
          </TabList>

          <div className={styles.tabContent}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineZonePanel;