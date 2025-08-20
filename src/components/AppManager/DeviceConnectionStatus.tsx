import React, { useCallback, useEffect, useState } from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Badge,
  Spinner,
  ProgressBar,
} from "@fluentui/react-components";
import {
  Wifi124Regular,
  UsbStick24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
  ArrowClockwise24Regular,
  Phone24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  card: {
    width: "100%",
    height: "fit-content",
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  connectionInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "4px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
});

interface ConnectionInfo {
  serial: string;
  state: string;
  connected: boolean;
  adb_version?: string;
  usb_connection: boolean;
  wifi_connection: boolean;
  connection_type: string;
}

const DeviceConnectionStatus: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();

  const [isChecking, setIsChecking] = useState(false);
  const [adbAvailable, setAdbAvailable] = useState<boolean | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      // 检查ADB可用性
      const adbResult = await deviceService.checkAdbAvailability();
      setAdbAvailable(adbResult.success);

      // 如果有选中的设备，检查设备连接
      if (selectedDevice) {
        const deviceInfo = await deviceService.getDeviceConnectionInfo(selectedDevice.serial);
        setConnectionInfo(deviceInfo as unknown as ConnectionInfo);
      } else {
        setConnectionInfo(null);
      }

      setLastCheckTime(new Date());
    } catch (error) {
      addNotification({
        type: "error",
        title: "状态检查失败",
        message: `无法检查连接状态: ${error}`,
      });
      setAdbAvailable(false);
      setConnectionInfo(null);
    } finally {
      setIsChecking(false);
    }
  }, [selectedDevice, addNotification]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const getAdbStatusIcon = () => {
    if (isChecking) return <Spinner size="small" />;
    if (adbAvailable === null) return <Warning24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
    return adbAvailable ? 
      <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} /> :
      <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
  };

  const getAdbStatusBadge = () => {
    if (adbAvailable === null) return <Badge appearance="outline">未知</Badge>;
    return adbAvailable ? 
      <Badge appearance="filled" color="success">可用</Badge> :
      <Badge appearance="filled" color="danger">不可用</Badge>;
  };

  const getDeviceStatusIcon = () => {
    if (!connectionInfo) return <Warning24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
    return connectionInfo.connected ? 
      <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} /> :
      <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
  };

  const getDeviceStatusBadge = () => {
    if (!connectionInfo) return <Badge appearance="outline">未选择</Badge>;
    return connectionInfo.connected ? 
      <Badge appearance="filled" color="success">已连接</Badge> :
      <Badge appearance="filled" color="danger">未连接</Badge>;
  };

  const getConnectionTypeIcon = () => {
    if (!connectionInfo) return null;
    return connectionInfo.wifi_connection ?
      <Wifi124Regular style={{ color: "var(--colorBrandForeground1)" }} /> :
      <UsbStick24Regular style={{ color: "var(--colorBrandForeground1)" }} />;
  };

  const formatLastCheckTime = () => {
    if (!lastCheckTime) return "从未检查";
    return `最后检查: ${lastCheckTime.toLocaleTimeString()}`;
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Phone24Regular />}
        header={<Text weight="semibold">连接状态</Text>}
        description={<Text size={200}>ADB和设备连接状态监控</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.statusSection}>
          {/* ADB状态 */}
          <div className={styles.statusItem}>
            <div className={styles.statusLeft}>
              {getAdbStatusIcon()}
              <div className={styles.statusDetails}>
                <Text weight="semibold">ADB服务</Text>
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  Android Debug Bridge
                </Text>
              </div>
            </div>
            {getAdbStatusBadge()}
          </div>

          {/* 设备连接状态 */}
          <div className={styles.statusItem}>
            <div className={styles.statusLeft}>
              {getDeviceStatusIcon()}
              <div className={styles.statusDetails}>
                <Text weight="semibold">设备连接</Text>
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {selectedDevice ? selectedDevice.serial : "未选择设备"}
                </Text>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {getConnectionTypeIcon()}
              {getDeviceStatusBadge()}
            </div>
          </div>
        </div>

        {/* 连接详细信息 */}
        {connectionInfo && (
          <div className={styles.connectionInfo}>
            <div className={styles.infoItem}>
              <Text weight="semibold" size={200}>连接类型</Text>
              <Text size={200}>
                {connectionInfo.wifi_connection ? "Wi-Fi" : "USB"}
              </Text>
            </div>
            <div className={styles.infoItem}>
              <Text weight="semibold" size={200}>设备状态</Text>
              <Text size={200}>{connectionInfo.state}</Text>
            </div>
            {connectionInfo.adb_version && (
              <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
                <Text weight="semibold" size={200}>ADB版本</Text>
                <Text size={200}>{connectionInfo.adb_version}</Text>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={checkStatus}
            disabled={isChecking}
          >
            {isChecking ? "检查中..." : "刷新状态"}
          </Button>
          
          <Text size={200} style={{ 
            color: "var(--colorNeutralForeground2)", 
            alignSelf: "center",
            marginLeft: "auto"
          }}>
            {formatLastCheckTime()}
          </Text>
        </div>

        {/* 状态指示器 */}
        {isChecking && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ProgressBar />
            <Text size={200}>正在检查连接状态...</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DeviceConnectionStatus;
