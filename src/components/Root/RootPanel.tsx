
import React, { useState, useEffect }  from 'react';

import {
  makeStyles,
  Text,
  TabList,
  Tab,
  Button,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Settings24Regular,
  Play24Regular,
  Apps24Regular,
  Folder24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import PatchImagePanel from './PatchImagePanel';
import ModulePanel from './ModulePanel';
import AdvancedSettingsPanel from './AdvancedSettingsPanel';
import OneClickRootPanel from './OneClickRootPanel';
import { DeviceInfo } from '../../types/device';
import UnderDevelopmentOverlay from '../Common/UnderDevelopmentOverlay';

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
    position: "relative",
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(4px)",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  overlayIcon: {
    fontSize: "48px",
    color: "var(--colorBrandForeground1)",
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

type AdbZoneView = "one-click-root" | "patch-image" | "module-management" | "advanced-settings";

const RootPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<AdbZoneView>("one-click-root");
  const [showOverlay, setShowOverlay] = useState(false);
  
  const isNoDevice = !selectedDevice || devices.filter(d => d.connected).length === 0;

  useEffect(() => {
    if (!isNoDevice) {
      setShowOverlay(false);
    }
  }, [isNoDevice]);

  const handleContentClick = (_e: React.MouseEvent) => {
    if (isNoDevice && !showOverlay) {
      setShowOverlay(true);
    }
  };

  const tabs = [
    {
      id: "one-click-root" as AdbZoneView,
      label: "一键 Root",
      icon: <Play24Regular />,
    },
    {
      id: "patch-image" as AdbZoneView,
      label: t('root.tab_patch', '镜像修补'),
      icon: <Code24Regular />,
    },
    {
      id: "module-management" as AdbZoneView,
      label: t('root.tab_module', '模块管理'),
      icon: <Apps24Regular />,
    },
    {
      id: "advanced-settings" as AdbZoneView,
      label: t('root.tab_settings', '高级设置'),
      icon: <Settings24Regular />,
    },
  ];

  const renderContent = (device: DeviceInfo | null) => {
    switch (currentView) {
      case "one-click-root":
        return <OneClickRootPanel device={device} />;
      case "patch-image":
        return <PatchImagePanel device={device} />;
      case "module-management":
        return <ModulePanel device={device} />;
      case "advanced-settings":
        return <AdvancedSettingsPanel device={device} />;
      default:
        return <OneClickRootPanel device={device} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.tabContainer}>
          <TabList
            id="tour-root-tabs"
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

          <div 
            className={styles.tabContent} 
            style={{ position: 'relative' }}
          >
            <div style={{ 
              opacity: 0.4, 
              pointerEvents: 'none',
              filter: 'blur(3px)',
              transition: 'all 0.3s ease',
              height: '100%',
              overflow: 'hidden',
            }}>
              {renderContent(selectedDevice || null)}
            </div>
            
            <UnderDevelopmentOverlay
              featureKey="root_zone"
              title={t("root.under_dev_title", "Root 专区深度开发中...")}
              description={t("root.under_dev_desc", "一键 Root、Magisk/KernelSU 镜像自动修补与模块管理引擎正在加紧攻关测试。")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootPanel;
