import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Card,
  tokens,
  mergeClasses,
  Tooltip,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import { 
  Apps24Regular,
  Settings24Regular,
  Desktop24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import { DeviceInfo } from "../../types/device";
import KeySimulationCard from "../DeviceControl/KeySimulationCard";
import SystemControlCard from "../DeviceControl/SystemControlCard";
import { controlService } from "../../services/controlService";
import { useAppStore } from "../../stores/appStore";
import { useConfigStore } from "../../stores/configStore";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    gap: "12px",
  },
  sidebar: {
    width: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    padding: "12px",
    flexShrink: 0,
  },
  sidebarHeader: {
    padding: "0 8px 8px 8px",
    fontWeight: 600,
    fontSize: "14px",
    color: "var(--colorNeutralForeground2)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    marginBottom: "4px",
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  sidebarItemActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    fontWeight: 600,
    color: "var(--colorBrandForeground1)",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: 0,
    height: "100%",
    overflowY: "auto",
    padding: "12px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    marginTop: "8px",
    color: "var(--colorNeutralForeground1)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100px",
    color: "var(--colorNeutralForeground3)",
    fontSize: "12px",
    textAlign: "center",
    padding: "20px",
    border: "1px dashed var(--colorNeutralStroke2)",
    borderRadius: "8px",
  }
});

interface DeviceControlPanelProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({ device, onAdbRequired }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const navigationItems = [
    { id: 'key-simulation', label: 'device_control.key_simulation', icon: <Desktop24Regular /> },
    { id: 'system-control', label: 'device_control.system_control', icon: <Settings24Regular /> },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Apps24Regular />
          <Text>{t('common.navigation', "导航")}</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navigationItems.map(item => (
            <div 
              key={item.id} 
              className={styles.sidebarItem} 
              onClick={() => {
                const element = document.getElementById(`section-${item.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              {item.icon}
              <Text>{t(item.label)}</Text>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div id="section-key-simulation">
            <KeySimulationCard device={device} onAdbRequired={onAdbRequired} />
          </div>
          <div id="section-system-control">
            <SystemControlCard device={device} onAdbRequired={onAdbRequired} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControlPanel;
