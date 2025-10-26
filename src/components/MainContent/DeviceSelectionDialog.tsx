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
    padding: '8px 0',
  },
  deviceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
    },
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

const DeviceSelectionDialog: React.FC<DeviceSelectionDialogProps> = ({
  open,
  onOpenChange,
  devices,
  selectedDevice,
  onDeviceSelect,
  onToggleWirelessDebugging,
}) => {
  const styles = useStyles();
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
      case 'sys': return '系统模式';
      case 'rec': return 'Recovery';
      case 'fastboot': return 'Fastboot';
      case 'fastbootd': return 'Fastbootd';
      case 'sideload': return 'Sideload';
      case 'edl': return 'EDL模式';
      case 'unauthorized': return '未授权';
      case 'offline': return '离线';
      default: return '未知模式';
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
    const getDeviceName = () => {
      // 对于fastboot模式，优先使用product_name
      if (selectedDevice.mode === "fastboot" || selectedDevice.mode === "fastbootd") {
        return selectedDevice.properties?.productName || selectedDevice.serial;
      }
      // 对于其他模式，使用原有的逻辑
      return selectedDevice.properties?.marketName ||
             selectedDevice.properties?.model ||
             selectedDevice.serial;
    };

    const getDeviceOptionText = (device: any) => {
      // 直接返回设备序列号
      return device.serial;
    };
    
    const getDeviceCodeName = () => {
      if (selectedDevice.mode === "fastboot" || selectedDevice.mode === "fastbootd") {
        // 对于fastboot模式，使用product_name作为设备代号
        return selectedDevice.properties?.productName || selectedDevice.serial;
      }
      return selectedDevice.properties?.deviceName || "";
    };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle>选择设备</DialogTitle>
        <DialogBody>
          <DialogContent>
            {devices.length === 0 ? (
              <div className={styles.noDevices}>
                <Phone24Regular style={{ fontSize: '32px', color: 'var(--colorNeutralForeground3)' }} />
                <Text size={300}>没有可用的设备</Text>
                <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                  请确保设备已连接并启用 USB 调试模式
                </Text>
              </div>
            ) : (
              <div className={styles.deviceList}>
                {devices.map((device) => (
                  <div
                    key={device.serial}
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
                          {getDeviceModeText(device.mode)}的设备：{getDeviceDisplayName(device)}
                        </Text>
                        <div className={styles.deviceModelInfo}>
                          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                            机型名称：{getDeviceName()}
                          </Text>
                          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                            代号：{getDeviceCodeName()}
                          </Text>
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
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DeviceSelectionDialog;