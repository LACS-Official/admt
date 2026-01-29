import React from 'react';
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
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
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
  streamingDevice: {
    border: "1px solid var(--colorPaletteRedBorder1)",
    "&:hover": {
      backgroundColor: "var(--colorPaletteRedBackground1)",
      border: "1px solid var(--colorPaletteRedBorder2)",
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
  streamingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "var(--colorPaletteRedForeground1)",
  },
});

interface DeviceSelectionCardProps {
  devices: ScreenMirrorDevice[];
  selectedDevice: ScreenMirrorDevice | null;
  onSelectDevice: (device: ScreenMirrorDevice | null) => void;
  onDeviceAction: (device: ScreenMirrorDevice) => void;
  isLoading: boolean;
  streamingDevices: string[]; // 设备序列号数组
}

const DeviceSelectionCard: React.FC<DeviceSelectionCardProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onDeviceAction,
  isLoading,
  streamingDevices,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const handleDeviceClick = (device: ScreenMirrorDevice) => {
    // 如果设备正在投屏，则停止投屏
    if (isDeviceStreaming(device.serial)) {
      onDeviceAction(device);
      return;
    }
    
    // 否则选择设备
    onSelectDevice(selectedDevice?.serial === device.serial ? null : device);
  };


  const formatResolution = (resolution?: string) => {
    if (!resolution) return "";
    return resolution;
  };

  const formatDensity = (density?: number) => {
    if (!density) return "";
    return `${density}dpi`;
  };

  const isDeviceStreaming = (deviceSerial: string) => {
    return streamingDevices.includes(deviceSerial);
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Text weight="semibold">{t('mirror.device_selection_title')}</Text>}
        description={t('mirror.devices_available', { count: devices.length })}
      />
      
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="small" />
          <Text size={300}>{t('mirror.checking_support')}</Text>
        </div>
      ) : devices.length === 0 ? (
        <div className={styles.noDevices}>
          <Phone24Regular style={{ fontSize: "32px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={300}>{t('mirror.no_devices')}</Text>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t('mirror.no_devices_hint')}
          </Text>
        </div>
      ) : (
        <div className={styles.deviceList}>
          {devices.map((device) => (
            <div
              key={device.serial}
              className={mergeClasses(
                styles.deviceItem,
              )}
              onClick={() => {
                  handleDeviceClick(device);
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
              
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default DeviceSelectionCard;
