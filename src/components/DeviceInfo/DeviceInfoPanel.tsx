import React, { useEffect } from "react";
import {
  makeStyles,

  Text,
  Button,
  Badge,
  Spinner,
  Field,
  Select,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  ArrowClockwise24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import DeviceInfoCard from "./DeviceInfoCard";
import DevicePropertiesCard from "./DevicePropertiesCard";
import DeviceActionsCard from "./DeviceActionsCard";
import DeviceSystemInfoCard from "./DeviceSystemInfoCard";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

const useStyles = makeStyles({
  container: {
    padding: "12px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    minHeight: "40px",
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gridAutoRows: "minmax(280px, auto)",
    gap: "12px",
    height: "calc(100% - 80px)",
    padding: "0 4px",
    overflow: "auto",
    scrollbarWidth: "thin",
  },
  contentLarge: {
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: "auto auto",
  },
  contentMedium: {
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto auto",
  },
  contentSmall: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "repeat(4, auto)",
  },
  deviceInfoCard: {
    // 在大屏幕上占据两行
  },
  deviceInfoCardLarge: {
    gridColumn: "1 / 2",
    gridRow: "1 / 3",
  },
  propertiesCard: {
    // 自动布局
  },
  propertiesCardLarge: {
    gridColumn: "2 / 3",
    gridRow: "1 / 2",
  },
  systemInfoCard: {
    // 自动布局
  },
  systemInfoCardLarge: {
    gridColumn: "3 / 4",
    gridRow: "1 / 2",
  },
  actionsCard: {
    // 自动布局
  },
  actionsCardLarge: {
    gridColumn: "2 / 4",
    gridRow: "2 / 3",
  },
  noDevice: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    height: "300px",
    textAlign: "center",
  },
  deviceSelector: {
    minWidth: "200px",
  },
});

const DeviceInfoPanel: React.FC = () => {
  const styles = useStyles();
  const {
    devices,
    selectedDevice,
    selectDevice,
    isScanning
  } = useDeviceStore();
  const { startScanning, stopScanning, refreshDeviceInfo } = useDeviceService();
  const { layoutSize } = useResponsiveLayout();

  useEffect(() => {
    startScanning();
    return () => stopScanning();
  }, [startScanning, stopScanning]);

  const connectedDevices = devices.filter(d => d.connected);

  const handleDeviceSelect = (serial: string) => {
    const device = devices.find(d => d.serial === serial);
    selectDevice(device);
  };

  const handleRefresh = async () => {
    if (selectedDevice) {
      await refreshDeviceInfo(selectedDevice.serial);
    }
  };



  const getDeviceModeText = (mode: string) => {
    switch (mode) {
      case "sys":
        return "系统";
      case "rec":
        return "Recovery";
      case "fastboot":
        return "Fastboot";
      case "fastbootd":
        return "Fastbootd";
      case "sideload":
        return "Sideload";
      case "unauthorized":
        return "未授权";
      default:
        return mode;
    }
  };

  // 响应式布局逻辑
  const getContentClassName = () => {
    const baseClass = styles.content;
    switch (layoutSize) {
      case 'xlarge':
      case 'large':
        return `${baseClass} ${styles.contentLarge}`;
      case 'medium':
        return `${baseClass} ${styles.contentMedium}`;
      default:
        return `${baseClass} ${styles.contentSmall}`;
    }
  };

  const getCardClassName = (cardType: string) => {
    const baseClass = (styles as any)[`${cardType}Card`];
    if (layoutSize === 'large' || layoutSize === 'xlarge') {
      return `${baseClass} ${(styles as any)[`${cardType}CardLarge`]}`;
    }
    return baseClass;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Phone24Regular />
          <Text size={500} weight="semibold">设备信息</Text>
          <Badge 
            appearance="filled" 
            color={connectedDevices.length > 0 ? "success" : "subtle"}
          >
            {connectedDevices.length} 台设备
          </Badge>
        </div>
        
        <div className={styles.headerRight}>
          {connectedDevices.length > 0 && (
            <Field label="选择设备:">
              <Select
                className={styles.deviceSelector}
                value={selectedDevice?.serial || ""}
                onChange={(_, data) => handleDeviceSelect(data.value)}
              >
                <option value="">请选择设备</option>
                {connectedDevices.map((device) => (
                  <option key={device.serial} value={device.serial}>
                    {device.serial} ({getDeviceModeText(device.mode)})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          
          <Button
            appearance="subtle"
            icon={isScanning ? <Spinner size="small" /> : <ArrowClockwise24Regular />}
            onClick={handleRefresh}
            disabled={!selectedDevice || isScanning}
          >
            刷新
          </Button>
        </div>
      </div>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Info24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>未检测到设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备已连接并启用USB调试
          </Text>
          {isScanning && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spinner size="small" />
              <Text size={300}>正在扫描设备...</Text>
            </div>
          )}
        </div>
      ) : selectedDevice ? (
        <div className={getContentClassName()}>
          <div className={getCardClassName('deviceInfo')}>
            <DeviceInfoCard device={selectedDevice} />
          </div>
          <div className={getCardClassName('properties')}>
            <DevicePropertiesCard device={selectedDevice} />
          </div>
          <div className={getCardClassName('systemInfo')}>
            <DeviceSystemInfoCard device={selectedDevice} />
          </div>
          <div className={getCardClassName('actions')}>
            <DeviceActionsCard device={selectedDevice} />
          </div>
        </div>
      ) : (
        <div className={styles.noDevice}>
          <Phone24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>请选择一个设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            从上方下拉菜单中选择要查看的设备
          </Text>
        </div>
      )}
    </div>
  );
};

export default DeviceInfoPanel;
