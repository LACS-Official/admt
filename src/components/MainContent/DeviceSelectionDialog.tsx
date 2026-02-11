import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Badge,
  makeStyles,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  CheckmarkCircle24Regular,
  Wifi2Regular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  dialogSurface: {
    minWidth: '400px',
    maxWidth: '500px',
  },
  deviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '8px 4px', // Add horizontal padding for shadow/outline visibility
  },
  deviceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: 'var(--colorNeutralBackground1)', // Ensure background for animation
    // transition: 'all 0.2s ease', // Handled by motion
    flexWrap: 'wrap',
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
    flex: 2,
    minWidth: '250px',
  },
  deviceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  deviceName: {
    fontWeight: '600',
    fontSize: '14px',
  },
  deviceMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  deviceModelInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  deviceSerial: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground3)',
    fontFamily: 'monospace',
  },
  noDevices: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '32px 16px',
    textAlign: 'center',
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusOnline: {
    backgroundColor: 'var(--colorPaletteGreenForeground1)',
  },
  statusFastboot: {
    backgroundColor: 'var(--colorPaletteBlueForeground1)',
  },
  statusRecovery: {
    backgroundColor: 'var(--colorPaletteOrangeForeground1)',
  },
  statusUnauthorized: {
    backgroundColor: 'var(--colorPaletteRedForeground1)',
  },
  wirelessDebuggingControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    justifyContent: 'flex-end',
  },
  wirelessDebuggingButton: {
    fontSize: '12px',
    padding: '4px 8px',
    minHeight: '24px',
  },
  wirelessDebuggingLabel: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
});

interface Device {
  serial: string;
  name?: string;
  model?: string;
  mode: string;
  connected: boolean;
  wirelessDebugging?: boolean; // 添加无线调试状态
  properties?: {
    marketName?: string;
    deviceName?: string;
    productName?: string;
    model?: string;
  };
}

interface DeviceSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  selectedDevice: Device | null;
  onDeviceSelect: (device: Device) => void;
  onToggleWirelessDebugging?: (deviceSerial: string, enabled: boolean) => void; // 添加无线调试切换回调
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },

};

const DeviceSelectionDialog: React.FC<DeviceSelectionDialogProps> = ({
  open,
  onOpenChange,
  devices,
  selectedDevice,
  onDeviceSelect,
  onToggleWirelessDebugging,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [wirelessDebuggingStates, setWirelessDebuggingStates] = useState<Record<string, boolean>>({});

  // 切换无线调试状态
  const toggleWirelessDebugging = (deviceSerial: string, currentState: boolean | undefined) => {
    const newState = !currentState;
    setWirelessDebuggingStates(prev => ({
      ...prev,
      [deviceSerial]: newState
    }));
    
    // 调用父组件传递的回调函数
    if (onToggleWirelessDebugging) {
      onToggleWirelessDebugging(deviceSerial, newState);
    }
    
    console.log(`切换设备 ${deviceSerial} 的无线调试状态为: ${newState ? '开启' : '关闭'}`);
  };

  const getDeviceStatusColor = (device: Device) => {
    switch (device.mode) {
      case 'sys': return styles.statusOnline;
      case 'fastboot': return styles.statusFastboot;
      case 'fastbootd': return styles.statusFastboot;
      case 'rec': return styles.statusRecovery;
      case 'unauthorized': return styles.statusUnauthorized;
      default: return styles.statusOnline;
    }
  };

  const getDeviceModeText = (mode: string) => {
    switch (mode) {
      case 'sys': return t('device_mode.system');
      case 'rec': return t('device_mode.recovery');
      case 'fastboot': return t('device_mode.fastboot');
      case 'fastbootd': return t('device_mode.fastbootd');
      case 'sideload': return t('device_mode.sideload');
      case 'edl': return t('device_mode.edl');
      case 'unauthorized': return t('device_mode.unauthorized');
      case 'offline': return t('device_mode.offline');
      default: return t('device_mode.unknown');
    }
  };

  const getDeviceDisplayName = (device: Device) => {
    // 显示设备市场名称和代号
    const marketName = device.properties?.marketName;
    const deviceName = device.properties?.deviceName;
    
    if (marketName && deviceName) {
      return `${marketName} (${deviceName})`;
    } else if (marketName) {
      return marketName;
    } else if (deviceName) {
      return deviceName;
    }
    
    // 如果没有市场名称和代号，回退到原有逻辑
    return device.name || device.model || device.serial;
  };

  const handleOpenChange = (event: any, data: { open: boolean }) => {
    onOpenChange(data.open);
  };

      // 获取设备名称，对于fastboot模式，使用fastboot getvar product命令获取
    const getDeviceName = (device: Device) => { // Fixed: pass device as arg
      // 对于fastboot模式，优先使用product_name
      if (device.mode === "fastboot" || device.mode === "fastbootd") {
        return device.properties?.productName || device.serial;
      }
      // 对于其他模式，使用原有的逻辑
      return device.properties?.marketName ||
             device.properties?.model ||
             device.serial;
    };

    const getDeviceCodeName = (device: Device) => {
      if (device.mode === "fastboot" || device.mode === "fastbootd") {
        // 对于fastboot模式，使用product_name作为设备代号
        return device.properties?.productName || device.serial;
      }
      return device.properties?.deviceName || "";
    };

    const getDeviceConnectionType = (device: Device) => {
      const isWireless = device.serial.includes(':') || device.serial.includes('.');
      return isWireless ? t('device_connection.wireless') : t('device_connection.wired');
    };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle>{t('device_selection.title')}</DialogTitle>
        <DialogBody>
          <DialogContent>
            {devices.length === 0 ? (
              <div className={styles.noDevices}>
                <Phone24Regular style={{ fontSize: '32px', color: 'var(--colorNeutralForeground3)' }} />
                <Text size={300}>{t('device_selection.no_devices')}</Text>
                <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                  {t('device_selection.no_devices_hint')}
                </Text>
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
                    layout
                    key={device.serial}
                    variants={itemVariants}

                    className={mergeClasses(
                      styles.deviceItem,
                      selectedDevice?.serial === device.serial && styles.selectedDevice
                    )}
                    onClick={() => {
                      onDeviceSelect(device);
                      onOpenChange(false);
                    }}
                  >
                    <div className={styles.deviceInfo}>
                      <div 
                        className={mergeClasses(styles.statusIndicator, getDeviceStatusColor(device))}
                      />
                      <div className={styles.deviceDetails}>
                        <Text className={styles.deviceName}>
                          {t('device_selection.device_item_title', { mode: getDeviceModeText(device.mode), name: getDeviceDisplayName(device) })}
                        </Text>
                        <div className={styles.deviceModelInfo}>
                          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                            {t('device_selection.model_name', { name: getDeviceName(device) })}
                          </Text>
                          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                            {t('device_selection.codename', { codename: getDeviceCodeName(device) })}
                          </Text>
                          <Badge
                            appearance="tint"
                            color="important"
                            size="small"
                          >
                            {getDeviceConnectionType(device)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {/* <div className={styles.wirelessDebuggingControl}>
                      <Button
                        size="small"
                        appearance={wirelessDebuggingStates[device.serial] ?? device.wirelessDebugging ? "primary" : "outline"}
                        className={styles.wirelessDebuggingButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWirelessDebugging(device.serial, wirelessDebuggingStates[device.serial] ?? device.wirelessDebugging);
                        }}
                      >
                        <Wifi2Regular />
                        <Text style={{ marginLeft: '4px' }}>
                          {wirelessDebuggingStates[device.serial] ?? device.wirelessDebugging ? "关闭无线" : "开启无线"}
                        </Text>
                      </Button>
                    </div> */}
                    {selectedDevice?.serial === device.serial && (
                      <CheckmarkCircle24Regular style={{ color: 'var(--colorBrandForeground1)' }} />
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
              </motion.div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DeviceSelectionDialog;