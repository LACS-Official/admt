
import React, { useState, useEffect }  from 'react';

import {makeStyles, TabList, Tab} from "@fluentui/react-components";
import {Code24Regular, Settings24Regular, Play24Regular, Apps24Regular, Key24Regular} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import PatchImagePanel from './PatchImagePanel';
import ModulePanel from './ModulePanel';
import AdvancedSettingsPanel from './AdvancedSettingsPanel';
import OneClickRootPanel from './OneClickRootPanel';
import SuAppPanel from './SuAppPanel';
import { DeviceInfo } from '../../types/device';

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
    borderRadius: "var(--admt-radius-card)",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  overlayIcon: {
    fontSize: "48px",
    color: "var(--colorBrandForeground1)",
  },
  headerTabList: {
    flexShrink: 1,
    alignSelf: "flex-start",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "var(--admt-radius-pill)",
    padding: "4px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "none",
    minHeight: "36px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "13px",
      padding: "6px 14px",
      minHeight: "30px",
      borderRadius: "var(--admt-radius-pill)",
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

type AdbZoneView = "one-click-root" | "patch-image" | "module-management" | "advanced-settings" | "su-management";

// 一键 Root 流程尚未通过真机刷写验证，先不开放入口。
// 实现代码完整保留，验证通过后把此开关改回 true 即可恢复。
const ENABLE_ONE_CLICK_ROOT = false;

const RootPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice, devices } = useDeviceStore();
  const [currentView, setCurrentView] = useState<AdbZoneView>(
    ENABLE_ONE_CLICK_ROOT ? "one-click-root" : "patch-image",
  );
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
    ...(ENABLE_ONE_CLICK_ROOT
      ? [
          {
            id: "one-click-root" as AdbZoneView,
            label: t('root.tab_one_click', '一键 Root'),
            icon: <Play24Regular />,
          },
        ]
      : []),
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
    {
      id: "su-management" as AdbZoneView,
      label: t('root.tab_su', '授权管理'),
      icon: <Key24Regular />,
    },
  ];

  const renderContent = (device: DeviceInfo | null) => {
    switch (currentView) {
      case "one-click-root":
        return ENABLE_ONE_CLICK_ROOT ? (
          <OneClickRootPanel device={device} />
        ) : (
          <PatchImagePanel device={device} />
        );
      case "patch-image":
        return <PatchImagePanel device={device} />;
      case "module-management":
        return <ModulePanel device={device} />;
      case "advanced-settings":
        return <AdvancedSettingsPanel device={device} />;
      case "su-management":
        return <SuAppPanel device={device} />;
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

          <div className={styles.tabContent}>
            {renderContent(selectedDevice || null)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootPanel;
