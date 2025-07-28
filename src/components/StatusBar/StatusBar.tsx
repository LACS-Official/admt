import React from "react";
import {
  makeStyles,
  Text,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  statusBar: {
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    paddingLeft: "12px",
    paddingRight: "12px",
    fontSize: "11px",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  spinner: {
    width: "12px",
    height: "12px",
  },
});

const StatusBar: React.FC = () => {
  const styles = useStyles();
  const { devices, selectedDevice, isScanning, lastUpdate } = useDeviceStore();
  const { isLoading } = useAppStore();

  const connectedDevices = devices.filter(d => d.connected);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={styles.statusBar}>
      <div className={styles.leftSection}>
        <div className={styles.statusItem}>
          <Text size={200}>设备:</Text>
          <Badge 
            appearance={connectedDevices.length > 0 ? "filled" : "outline"}
            color={connectedDevices.length > 0 ? "success" : "subtle"}
          >
            {connectedDevices.length}
          </Badge>
        </div>
        
        {selectedDevice && (
          <div className={styles.statusItem}>
            <Text size={200}>
              已选择: {selectedDevice.serial} ({selectedDevice.mode})
            </Text>
          </div>
        )}
        
        {isScanning && (
          <div className={styles.statusItem}>
            <Spinner size="extra-small" className={styles.spinner} />
            <Text size={200}>扫描设备中...</Text>
          </div>
        )}
      </div>
      
      <div className={styles.rightSection}>
        {isLoading && (
          <div className={styles.statusItem}>
            <Spinner size="extra-small" className={styles.spinner} />
            <Text size={200}>处理中...</Text>
          </div>
        )}
        
        <div className={styles.statusItem}>
          <Text size={200}>
            最后更新: {formatTime(lastUpdate)}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
