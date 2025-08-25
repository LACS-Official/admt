import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  mergeClasses,
  Card,
  CardHeader,
  Text,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import { ScreenMirrorDevice } from "../../types/screenMirror";

const useStyles = makeStyles({
  card: {
    height: "fit-content",
  },
  deviceList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
  },
  deviceItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  selectedDevice: {
    backgroundColor: "var(--colorBrandBackground2)",
    "&:hover": {
      backgroundColor: "var(--colorBrandBackground2Hover)",
    },
  },
  deviceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  deviceDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  deviceName: {
    fontWeight: "600",
  },
  deviceMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  supportBadge: {
    fontSize: "11px",
  },
  noDevices: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 16px",
    textAlign: "center",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px",
  },
});

interface DeviceSelectionCardProps {
  devices: ScreenMirrorDevice[];
  selectedDevice: ScreenMirrorDevice | null;
  onSelectDevice: (device: ScreenMirrorDevice | null) => void;
  isLoading: boolean;
}

const DeviceSelectionCard: React.FC<DeviceSelectionCardProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  isLoading,
}) => {
  const styles = useStyles();

  const handleDeviceClick = (device: ScreenMirrorDevice) => {
    if (device.isSupported) {
      onSelectDevice(selectedDevice?.serial === device.serial ? null : device);
    }
  };

  const formatResolution = (resolution?: string) => {
    if (!resolution) return "";
    return resolution;
  };

  const formatDensity = (density?: number) => {
    if (!density) return "";
    return `${density}dpi`;
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Text weight="semibold">设备选择</Text>}
        description={`${devices.length} 台设备可用`}
      />
      
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="small" />
          <Text size={300}>检查设备支持...</Text>
        </div>
      ) : devices.length === 0 ? (
        <div className={styles.noDevices}>
          <Phone24Regular style={{ fontSize: "32px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={300}>没有支持投屏的设备</Text>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备运行 Android 5.0 或更高版本
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
              onClick={() => handleDeviceClick(device)}
              style={{
                opacity: device.isSupported ? 1 : 0.6,
                cursor: device.isSupported ? "pointer" : "not-allowed",
              }}
            >
              <div className={styles.deviceInfo}>
                <Phone24Regular />
                <div className={styles.deviceDetails}>
                  <Text className={styles.deviceName} size={300}>
                    {device.name || device.model || device.serial}
                  </Text>
                  <div className={styles.deviceMeta}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                      {device.serial}
                    </Text>
                    {device.resolution && (
                      <Badge size="small" appearance="outline">
                        {formatResolution(device.resolution)}
                      </Badge>
                    )}
                    {device.density && (
                      <Badge size="small" appearance="outline">
                        {formatDensity(device.density)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {device.isSupported ? (
                  <>
                    <Badge 
                      appearance="filled" 
                      color="success" 
                      size="small"
                      className={styles.supportBadge}
                    >
                      支持
                    </Badge>
                    {selectedDevice?.serial === device.serial && (
                      <CheckmarkCircle24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                    )}
                  </>
                ) : (
                  <Badge 
                    appearance="filled" 
                    color="danger" 
                    size="small"
                    className={styles.supportBadge}
                  >
                    不支持
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default DeviceSelectionCard;
