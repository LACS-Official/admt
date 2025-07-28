import React from "react";
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
        return "系统模式";
      case "rec":
        return "Recovery模式";
      case "fastboot":
        return "Fastboot模式";
      case "fastbootd":
        return "Fastbootd模式";
      case "sideload":
        return "Sideload模式";
      case "unauthorized":
        return "未授权";
      default:
        return mode;
    }
  };

  const formatLastSeen = (lastSeen?: string | Date) => {
    if (!lastSeen) return "未知";

    const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return "刚刚";
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}分钟前`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}小时前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Phone24Regular />}
        header={<Text weight="semibold">设备状态</Text>}
        action={
          <Badge 
            appearance="filled" 
            color={device.connected ? "success" : "danger"}
          >
            {device.connected ? "已连接" : "已断开"}
          </Badge>
        }
      />
      
      <div className={styles.content}>
        <div className={styles.infoRow}>
          <Text className={styles.label}>设备序列号</Text>
          <Text className={styles.value}>{device.serial}</Text>
        </div>
        
        <div className={styles.infoRow}>
          <Text className={styles.label}>设备模式</Text>
          <Badge 
            appearance="filled" 
            color={getDeviceModeColor(device.mode)}
          >
            {getDeviceModeText(device.mode)}
          </Badge>
        </div>
        
        <div className={styles.infoRow}>
          <Text className={styles.label}>最后检测</Text>
          <Text className={styles.value}>{formatLastSeen(device.lastSeen)}</Text>
        </div>
        
        {device.properties && (
          <>
            <div className={styles.infoRow}>
              <Text className={styles.label}>设备品牌</Text>
              <Text className={styles.value}>
                {device.properties.brand || "未知"}
              </Text>
            </div>
            
            <div className={styles.infoRow}>
              <Text className={styles.label}>设备型号</Text>
              <Text className={styles.value}>
                {device.properties.marketName || device.properties.model || "未知"}
              </Text>
            </div>
            
            <div className={styles.infoRow}>
              <Text className={styles.label}>Android版本</Text>
              <Text className={styles.value}>
                {device.properties.androidVersion || "未知"}
              </Text>
            </div>

            {device.properties.securityPatchLevel && (
              <div className={styles.infoRow}>
                <Text className={styles.label}>安全补丁</Text>
                <Text className={styles.value}>
                  {device.properties.securityPatchLevel}
                </Text>
              </div>
            )}

            <div className={styles.statusSection}>
              {device.properties.batteryLevel !== undefined && (
                <div className={styles.statusRow}>
                  <Battery024Regular />
                  <Text>电池电量: {device.properties.batteryLevel}%</Text>
                </div>
              )}

              {device.properties.bootloaderLocked !== undefined && (
                <div className={styles.statusRow}>
                  <Shield24Regular />
                  <Text>
                    Bootloader: {device.properties.bootloaderLocked ? "已锁定" : "已解锁"}
                  </Text>
                </div>
              )}

              {device.properties.screenResolution && (
                <div className={styles.statusRow}>
                  <Wifi124Regular />
                  <Text>屏幕分辨率: {device.properties.screenResolution}</Text>
                </div>
              )}

              {device.properties.cpuAbi && (
                <div className={styles.statusRow}>
                  <DesktopPulse24Regular />
                  <Text>CPU架构: {device.properties.cpuAbi}</Text>
                </div>
              )}

              {device.properties.totalMemory && (
                <div className={styles.statusRow}>
                  <Storage24Regular />
                  <Text>总内存: {device.properties.totalMemory}</Text>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className={styles.actions}>
          <Tooltip content="查看详细信息" relationship="label">
            <Button
              appearance="secondary"
              icon={<Info24Regular />}
              size="small"
            >
              详细信息
            </Button>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
};

export default DeviceInfoCard;
