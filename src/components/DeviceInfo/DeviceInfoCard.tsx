import React  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
  Button,
  Tooltip,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  Battery024Regular,
  Shield24Regular,
  Info24Regular,
  Wifi124Regular,
  Storage24Regular,
  DesktopPulse24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "6px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    minHeight: "24px",
  },
  label: {
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
  },
  value: {
    fontWeight: "600",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "6px",
    marginTop: "auto",
    paddingTop: "12px",
  },
});

interface DeviceInfoCardProps {
  device: DeviceInfo;
}

const DeviceInfoCard: React.FC<DeviceInfoCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const getDeviceModeColor = (mode: string) => {
    switch (mode) {
      case "sys":
        return "success";
      case "rec":
        return "warning";
      case "fastboot":
      case "fastbootd":
        return "important";
      case "unauthorized":
        return "danger";
      default:
        return "subtle";
    }
  };

  const getDeviceModeText = (mode: string) => {
    switch (mode) {
      case "sys":
        return t('device_info.mode_sys');
      case "rec":
        return t('device_info.mode_rec');
      case "fastboot":
        return t('device_info.mode_fastboot');
      case "fastbootd":
        return t('device_info.mode_fastbootd');
      case "sideload":
        return t('device_info.mode_sideload');
      case "unauthorized":
        return t('device_info.mode_unauthorized');
      default:
        return mode;
    }
  };

  const formatLastSeen = (lastSeen?: string | Date) => {
    if (!lastSeen) return t('device_info.unknown');

    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return t('device_info.just_now');
    if (diffSecs < 3600) return t('device_info.minutes_ago', { count: Math.floor(diffSecs / 60) });
    if (diffSecs < 86400) return t('device_info.hours_ago', { count: Math.floor(diffSecs / 3600) });
    return date.toLocaleDateString();
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Phone24Regular />}
        header={<Text weight="semibold">{t('device_info.device_status')}</Text>}
        action={
          <Badge 
            appearance="filled" 
            color={device.connected ? "success" : "danger"}
          >
            {device.connected ? t('device_info.connected') : t('device_info.disconnected')}
          </Badge>
        }
      />
      
      <div className={styles.content}>
        <div className={styles.infoRow}>
          <Text className={styles.label}>{t('device_info.serial_number')}</Text>
          <Text className={styles.value}>{device.serial}</Text>
        </div>
        
        <div className={styles.infoRow}>
          <Text className={styles.label}>{t('device_info.device_mode')}</Text>
          <Badge 
            appearance="filled" 
            color={getDeviceModeColor(device.mode)}
          >
            {getDeviceModeText(device.mode)}
          </Badge>
        </div>
        
        <div className={styles.infoRow}>
          <Text className={styles.label}>{t('device_info.last_seen')}</Text>
          <Text className={styles.value}>{formatLastSeen(device.lastSeen)}</Text>
        </div>
        
        {device.properties && (
          <>
            <div className={styles.infoRow}>
              <Text className={styles.label}>{t('device_info.brand')}</Text>
              <Text className={styles.value}>
                {device.properties.brand || t('device_info.unknown')}
              </Text>
            </div>
            
            <div className={styles.infoRow}>
              <Text className={styles.label}>{t('device_info.model')}</Text>
              <Text className={styles.value}>
                {device.properties.marketName || device.properties.model || t('device_info.unknown')}
              </Text>
            </div>
            
            <div className={styles.infoRow}>
              <Text className={styles.label}>{t('device_info.android_version')}</Text>
              <Text className={styles.value}>
                {device.properties.androidVersion || t('device_info.unknown')}
              </Text>
            </div>

            {device.properties.securityPatchLevel && (
              <div className={styles.infoRow}>
                <Text className={styles.label}>{t('device_info.security_patch')}</Text>
                <Text className={styles.value}>
                  {device.properties.securityPatchLevel}
                </Text>
              </div>
            )}

            <div className={styles.statusSection}>
              {device.properties.batteryLevel !== undefined && (
                <div className={styles.statusRow}>
                  <Battery024Regular />
                  <Text>{t('device_info.battery_level', { level: device.properties.batteryLevel })}</Text>
                </div>
              )}

              {device.properties.bootloaderLocked !== undefined && (
                <div className={styles.statusRow}>
                  <Shield24Regular />
                  <Text>
                    {t('device_info.bootloader')}: {device.properties.bootloaderLocked ? t('device_info.locked') : t('device_info.unlocked')}
                  </Text>
                </div>
              )}

              {device.properties.screenResolution && (
                <div className={styles.statusRow}>
                  <Wifi124Regular />
                  <Text>{t('device_info.screen_resolution', { resolution: device.properties.screenResolution })}</Text>
                </div>
              )}

              {device.properties.cpuAbi && (
                <div className={styles.statusRow}>
                  <DesktopPulse24Regular />
                  <Text>{t('device_info.cpu_architecture', { arch: device.properties.cpuAbi })}</Text>
                </div>
              )}

              {device.properties.totalMemory && (
                <div className={styles.statusRow}>
                  <Storage24Regular />
                  <Text>{t('device_info.total_memory', { memory: device.properties.totalMemory })}</Text>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className={styles.actions}>
          <Tooltip content={t('device_info.view_details')} relationship="label">
            <Button
              appearance="secondary"
              icon={<Info24Regular />}
              size="small"
            >
              {t('device_info.details')}
            </Button>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
};

export default DeviceInfoCard;
