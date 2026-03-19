import React from 'react';
import { makeStyles, Text, Badge, Button, mergeClasses } from "@fluentui/react-components";
import { Phone24Regular, CheckmarkCircle24Regular } from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import ConsoleTitleBar from "../Console/ConsoleTitleBar";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  deviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    padding: '4px',
  },
  deviceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'var(--colorNeutralBackground1)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
  },
  selectedDevice: {
    backgroundColor: 'var(--colorBrandBackground2)',
    border: '1px solid var(--colorBrandStroke1)',
    '&:hover': {
      backgroundColor: 'var(--colorBrandBackground2Hover)',
    },
  },
  deviceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  statusIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusOnline: { backgroundColor: 'var(--colorPaletteGreenForeground1)' },
  statusFastboot: { backgroundColor: 'var(--colorPaletteBlueForeground1)' },
  statusRecovery: { backgroundColor: 'var(--colorPaletteOrangeForeground1)' },
  statusUnauthorized: { backgroundColor: 'var(--colorPaletteRedForeground1)' },
  
  deviceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  deviceName: {
    fontWeight: '600',
    fontSize: '15px',
  },
  deviceMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  noDevices: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flex: 1,
    color: 'var(--colorNeutralForeground3)',
  },
});

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const DeviceSelectionWindow: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { devices, selectedDevice, selectDevice } = useDeviceStore();

  const getDeviceStatusColor = (mode: string) => {
    switch (mode) {
      case 'sys': return styles.statusOnline;
      case 'fastboot':
      case 'fastbootd': return styles.statusFastboot;
      case 'rec': return styles.statusRecovery;
      case 'unauthorized': return styles.statusUnauthorized;
      default: return styles.statusOnline;
    }
  };

  const getDeviceDisplayName = (device: any) => {
    const marketName = device.properties?.marketName;
    const deviceName = device.properties?.deviceName;
    if (marketName && deviceName) return `${marketName} (${deviceName})`;
    return marketName || deviceName || device.name || device.model || device.serial;
  };

  const handleDeviceSelect = async (device: any) => {
    selectDevice(device);
    // 选择后关闭窗口
    await getCurrentWebviewWindow().hide();
  };

  return (
    <div className={styles.container}>
      <ConsoleTitleBar />
      <div className={styles.content}>
        <Text size={500} weight="semibold" style={{ marginBottom: '16px' }}>
          {t('device_selection.title')}
        </Text>
        
        {devices.length === 0 ? (
          <div className={styles.noDevices}>
            <Phone24Regular style={{ fontSize: '48px' }} />
            <div style={{ textAlign: 'center' }}>
              <Text block size={400}>{t('device_selection.no_devices')}</Text>
              <Text block size={200}>{t('device_selection.no_devices_hint')}</Text>
            </div>
          </div>
        ) : (
          <motion.div 
            className={styles.deviceList}
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {devices.map((device) => (
                <motion.div
                  key={device.serial}
                  variants={itemVariants}
                  layout
                  className={mergeClasses(
                    styles.deviceItem,
                    selectedDevice?.serial === device.serial && styles.selectedDevice
                  )}
                  onClick={() => handleDeviceSelect(device)}
                >
                  <div className={styles.deviceInfo}>
                    <div className={mergeClasses(styles.statusIndicator, getDeviceStatusColor(device.mode))} />
                    <div className={styles.deviceDetails}>
                      <Text className={styles.deviceName}>{getDeviceDisplayName(device)}</Text>
                      <div className={styles.deviceMeta}>
                        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)', fontFamily: 'monospace' }}>
                          {device.serial}
                        </Text>
                        <Badge appearance="tint" color="brand" size="small">
                          {device.mode.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selectedDevice?.serial === device.serial && (
                    <CheckmarkCircle24Regular style={{ color: 'var(--colorBrandForeground1)' }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DeviceSelectionWindow;
