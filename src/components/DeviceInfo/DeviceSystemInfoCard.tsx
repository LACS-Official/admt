import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  ProgressBar,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  System24Regular,
  ArrowClockwise24Regular,
  Battery024Regular,
  Storage24Regular,
  DesktopPulse24Regular,
  Wifi124Regular,
  Database24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "auto",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    minHeight: "40px",
  },
  infoIcon: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "16px",
  },
  infoContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  infoLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground2)",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: "13px",
    fontWeight: "600",
  },
  batterySection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  batteryBar: {
    width: "100%",
    height: "4px",
  },
  refreshButton: {
    alignSelf: "flex-start",
  },
  noData: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "20px",
    color: "var(--colorNeutralForeground3)",
    textAlign: "center",
  },
  statusBadge: {
    fontSize: "10px",
  },
});

interface DeviceSystemInfoCardProps {
  device: DeviceInfo;
}

const DeviceSystemInfoCard: React.FC<DeviceSystemInfoCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [systemInfo, setSystemInfo] = useState(device.properties);

  useEffect(() => {
    setSystemInfo(device.properties);
  }, [device.properties]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const properties = await deviceService.getDeviceProperties(device.serial);
      setSystemInfo(properties);
      addNotification({
        type: "success",
        title: "系统信息",
        message: "系统信息已更新",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "刷新失败",
        message: `获取系统信息失败: ${error}`,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return "subtle";
    if (level > 60) return "success";
    if (level > 30) return "warning";
    return "danger";
  };

  const getBatteryStatus = (level?: number) => {
    if (!level) return "未知";
    if (level > 80) return "充足";
    if (level > 50) return "良好";
    if (level > 20) return "偏低";
    return "低电量";
  };

  const formatMemory = (memory?: string) => {
    if (!memory) return "未知";
    return memory;
  };

  const formatStorage = (storage?: string) => {
    if (!storage) return "未知";
    return storage;
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<System24Regular />}
        header={<Text weight="semibold">系统状态</Text>}
        description={<Text size={200}>实时系统信息</Text>}
        action={
          <Button
            appearance="subtle"
            icon={isRefreshing ? <Spinner size="small" /> : <ArrowClockwise24Regular />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="small"
          />
        }
      />
      
      <div className={styles.content}>
        {systemInfo ? (
          <>
            {/* 电池信息 */}
            {systemInfo.batteryLevel !== undefined && (
              <div className={styles.infoRow}>
                <Battery024Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>电池电量</Text>
                  <div className={styles.batterySection}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Text className={styles.infoValue}>{systemInfo.batteryLevel}%</Text>
                      <Badge 
                        appearance="filled" 
                        color={getBatteryColor(systemInfo.batteryLevel)}
                        size="extra-small"
                        className={styles.statusBadge}
                      >
                        {getBatteryStatus(systemInfo.batteryLevel)}
                      </Badge>
                    </div>
                    <ProgressBar 
                      value={systemInfo.batteryLevel / 100} 
                      color={getBatteryColor(systemInfo.batteryLevel) as "error" | "success" | "warning" | "brand"}
                      className={styles.batteryBar}
                      thickness="medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 内存信息 */}
            {systemInfo.totalMemory && (
              <div className={styles.infoRow}>
                <Database24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>总内存</Text>
                  <Text className={styles.infoValue}>{formatMemory(systemInfo.totalMemory)}</Text>
                </div>
              </div>
            )}

            {/* 存储信息 */}
            {systemInfo.availableStorage && (
              <div className={styles.infoRow}>
                <Storage24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>可用存储</Text>
                  <Text className={styles.infoValue}>{formatStorage(systemInfo.availableStorage)}</Text>
                </div>
              </div>
            )}

            {/* CPU架构 */}
            {systemInfo.cpuAbi && (
              <div className={styles.infoRow}>
                <DesktopPulse24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>CPU架构</Text>
                  <Text className={styles.infoValue}>{systemInfo.cpuAbi}</Text>
                </div>
              </div>
            )}

            {/* 屏幕分辨率 */}
            {systemInfo.screenResolution && (
              <div className={styles.infoRow}>
                <Wifi124Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>屏幕分辨率</Text>
                  <Text className={styles.infoValue}>{systemInfo.screenResolution}</Text>
                </div>
              </div>
            )}

            {/* Android版本 */}
            {systemInfo.androidVersion && (
              <div className={styles.infoRow}>
                <System24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>Android版本</Text>
                  <Text className={styles.infoValue}>Android {systemInfo.androidVersion}</Text>
                </div>
              </div>
            )}

            {/* 安全补丁级别 */}
            {systemInfo.securityPatchLevel && (
              <div className={styles.infoRow}>
                <System24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>安全补丁</Text>
                  <Text className={styles.infoValue}>{systemInfo.securityPatchLevel}</Text>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noData}>
            <System24Regular style={{ fontSize: "24px" }} />
            <Text size={200}>暂无系统信息</Text>
            <Text size={100}>点击刷新按钮获取</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DeviceSystemInfoCard;
