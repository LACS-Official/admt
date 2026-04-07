
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
import { DeviceInfo } from '../../types/device';

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
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  overlayIcon: {
    fontSize: "48px",
    color: "var(--colorBrandForeground1)",
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

type AdbZoneView = "patch-image" | "module-management" | "advanced-settings";

const RootPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<AdbZoneView>("patch-image");
  const [showOverlay, setShowOverlay] = useState(false);
  
  const isNoDevice = !selectedDevice || devices.filter(d => d.connected).length === 0;

  useEffect(() => {
    if (!isNoDevice) {
      setShowOverlay(false);
    }
  }, [isNoDevice]);

  const handleContentClick = (e: React.MouseEvent) => {
    if (isNoDevice && !showOverlay) {
      setShowOverlay(true);
    }
  };

  const tabs = [
    {
      id: "patch-image" as AdbZoneView,
      label: t('root.tab_patch'),
      icon: <Code24Regular />,
    },
    {
      id: "module-management" as AdbZoneView,
      label: t('root.tab_module'),
      icon: <Apps24Regular />,
    },
    {
      id: "advanced-settings" as AdbZoneView,
      label: t('root.tab_settings'),
      icon: <Settings24Regular />,
    },
  ];

  const renderContent = (device: DeviceInfo | null) => {
    switch (currentView) {
      case "patch-image":
        return <PatchImagePanel device={device} />;
      case "module-management":
        return <ModulePanel device={device} />;
      case "advanced-settings":
        return <AdvancedSettingsPanel device={device} />;
      default:
        return <PatchImagePanel device={device} />;
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
            onClick={handleContentClick}
          >
            <div style={{ 
              opacity: isNoDevice ? 0.6 : 1, 
              pointerEvents: isNoDevice ? 'none' : 'auto',
              transition: 'opacity 0.3s ease'
            }}>
              {renderContent(selectedDevice || null)}
            </div>
            
            {isNoDevice && showOverlay && (
              <div className={styles.overlay}>
                <Button 
                  appearance="subtle" 
                  icon={<Dismiss24Regular />} 
                  onClick={(e) => { e.stopPropagation(); setShowOverlay(false); }}
                  style={{ position: 'absolute', top: '8px', right: '8px' }}
                />
                <div className={styles.overlayIcon}>
                  {devices.filter(d => d.connected).length === 0 ? <Code24Regular /> : <Settings24Regular />}
                </div>
                <Text size={500} weight="semibold">
                  {devices.filter(d => d.connected).length === 0 ? t('common.no_device') : t('common.select_device')}
                </Text>
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {devices.filter(d => d.connected).length === 0 ? t('common.no_device_hint') : t('common.select_device_hint')}
                </Text>
                <Button 
                   appearance="primary" 
                   size="small" 
                   style={{ marginTop: '8px' }}
                   onClick={() => window.location.hash = '#/'}
                >
                   {devices.filter(d => d.connected).length === 0 ? t('common.wireless_connection') : t('common.refresh')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootPanel;
