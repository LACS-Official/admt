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
  Info24Regular,
  ArrowClockwise24Regular,
  Battery024Regular,
  Storage24Regular,
  DesktopPulse24Regular,
  Wifi124Regular,
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
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
  },
  infoIcon: {
    color: "var(--colorNeutralForeground2)",
  },
  infoContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  infoLabel: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "600",
  },
  batterySection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  batteryBar: {
    width: "100%",
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
  },
});

interface SystemInfoCardProps {
  device: DeviceInfo;
}

const SystemInfoCard: React.FC<SystemInfoCardProps> = ({ device }) => {
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
    // 简单的内存格式化，实际可能需要更复杂的解析
    return memory;
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Info24Regular />}
        header={<Text weight="semibold">系统信息</Text>}
        description={<Text size={200}>实时系统状态和硬件信息</Text>}
        action={
          <Button
            appearance="subtle"
            icon={isRefreshing ? <Spinner size="small" /> : <ArrowClockwise24Regular />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={styles.refreshButton}
          >
            刷新
          </Button>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Text className={styles.infoValue}>{systemInfo.batteryLevel}%</Text>
                      <Badge 
                        appearance="filled" 
                        color={getBatteryColor(systemInfo.batteryLevel)}
                        size="small"
                      >
                        {getBatteryStatus(systemInfo.batteryLevel)}
                      </Badge>
                    </div>
                    <ProgressBar 
                      value={systemInfo.batteryLevel / 100} 
                      color={getBatteryColor(systemInfo.batteryLevel) as "error" | "success" | "warning" | "brand"}
                      className={styles.batteryBar}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 存储信息 */}
            {systemInfo.totalMemory && (
              <div className={styles.infoRow}>
                <Storage24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>内存</Text>
                  <Text className={styles.infoValue}>{formatMemory(systemInfo.totalMemory)}</Text>
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
                <Info24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>Android版本</Text>
                  <Text className={styles.infoValue}>Android {systemInfo.androidVersion}</Text>
                </div>
              </div>
            )}

            {/* 安全补丁级别 */}
            {systemInfo.securityPatchLevel && (
              <div className={styles.infoRow}>
                <Info24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>安全补丁</Text>
                  <Text className={styles.infoValue}>{systemInfo.securityPatchLevel}</Text>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noData}>
            <Info24Regular style={{ fontSize: "32px" }} />
            <Text size={300}>暂无系统信息</Text>
            <Text size={200}>点击刷新按钮获取设备信息</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SystemInfoCard;
