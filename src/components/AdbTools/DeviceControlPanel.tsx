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
  Star24Regular,
  Star24Filled,
  Apps24Regular,
  Play24Regular,
  Settings24Regular,
  Desktop24Regular,
  Timer24Regular,
  BatteryCharge24Regular,
  Screenshot24Regular,
  Home24Regular,
  ArrowLeft24Regular,
  Power24Regular,
  LockClosed24Regular,
  ChevronRight24Regular,
  ShieldCheckmark24Regular,
  Save24Regular,
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
  const { controlFavorites } = useDeviceStore();
  const { setStatusBarMessage } = useAppStore();

  const navigationItems = [
    { id: 'key-simulation', label: 'device_control.key_simulation', icon: <Desktop24Regular /> },
    { id: 'system-control', label: 'device_control.system_control', icon: <Settings24Regular /> },
  ];

  const handleFavoriteClick = async (id: string | null) => {
    if (!id) return;

    const { adbCommands } = useConfigStore.getState();
    let foundCommand = null;
    
    if (adbCommands) {
      for (const cat of adbCommands.categories) {
        const cmd = cat.commands.find(c => c.id === id);
        if (cmd) {
          foundCommand = cmd;
          break;
        }
      }
    }

    // Special cases for toggles (virtual IDs)
    if (id.endsWith('_toggle')) {
        scrollTo(id);
        return;
    }

    // Special cases for cards/sections
    if (id === 'display_control' || id === 'animation_speed' || id === 'power_management') {
      scrollTo(id);
      return;
    }

    // 如果没有可执行命令，或者只是一个区段 ID，则滚动
    if (!foundCommand || !foundCommand.command || foundCommand.command.trim().length === 0) {
      scrollTo(id);
      return;
    }

    if (!device || !device.connected) {
      setStatusBarMessage({ type: 'warning', message: t('unlock.select_device_first') });
      return;
    }

    try {
      const result = await controlService.executeCommand(device.serial, id);
      if (result.success) {
        setStatusBarMessage({ type: 'success', message: t(foundCommand.label || 'common.success') });
      } else {
        setStatusBarMessage({ type: 'error', message: result.error || t('common.error') });
      }
    } catch (e) {
      setStatusBarMessage({ type: 'error', message: String(e) });
    }
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(`control-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect if possible?
      element.style.backgroundColor = 'var(--colorNeutralBackground1Hover)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 1000);
    }
  };

  // 映射 ID 到名称
  const getFavoriteLabel = (id: string) => {
    const { adbCommands } = useConfigStore.getState();
    if (adbCommands) {
      for (const cat of adbCommands.categories) {
        const cmd = cat.commands.find(c => c.id === id);
        if (cmd) return t(cmd.label || cmd.id);
      }
    }

    const labels: Record<string, string> = {
      'display_control': t('device_control.display_control', "显示控制"),
      'animation_speed': t('device_control.animation_speed', "动画速度"),
      'power_management': t('device_control.power_management', "电源管理"),
      'wifi_toggle': t('device_control.wifi_toggle_on', "WiFi"),
      'mobile_data_toggle': t('device_control.mobile_data_on', "移动数据"),
      'airplane_toggle': t('device_control.airplane_mode_on', "飞行模式"),
      'flashlight_toggle': t('device_control.flashlight', "手电筒"),
      'auto_rotate_toggle': t('device_control.auto_rotate', "自动旋转"),
    };
    return labels[id] || id;
  };

  const renderFavorites = () => {
    if (!controlFavorites || controlFavorites.length === 0) {
      return (
        <div className={styles.emptyState}>
          <Text>{t('common.no_favorites', "暂无收藏")}</Text>
          <Text size={200} style={{ marginTop: '4px' }}>{t('common.add_favorite_hint', "点击右侧功能的星号进行收藏")}</Text>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {controlFavorites.map(id => (
          <div key={id} className={styles.sidebarItem} onClick={() => handleFavoriteClick(id)}>
             <Text>{getFavoriteLabel(id)}</Text>
             <ChevronRight24Regular style={{ fontSize: '14px', color: 'var(--colorNeutralForeground3)' }} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Star24Regular />
          <Text>{t('common.favorites', "收藏")}</Text>
        </div>
        {renderFavorites()}

        <div className={styles.sidebarHeader} style={{ marginTop: '16px' }}>
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
