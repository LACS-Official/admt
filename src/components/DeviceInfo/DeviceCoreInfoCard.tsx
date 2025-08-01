import React from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  ProgressBar,
  Tooltip,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  Battery024Regular,
  Storage24Regular,
  Info24Regular,
  DesktopPulse24Regular,
  Copy24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
      borderColor: "var(--colorNeutralStroke1)",
    },
  },
  content: {
    padding: "12px", // 减少内边距适配紧凑布局
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px", // 减少间距
  },
  deviceHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px", // 减少间距
    marginBottom: "6px", // 减少底部间距
  },
  deviceName: {
    fontSize: "16px", // 减少字体大小
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.2", // 更紧凑的行高
  },
  deviceSubtitle: {
    fontSize: "12px", // 减少字体大小
    color: "var(--colorNeutralForeground2)",
    marginTop: "2px", // 减少顶部间距
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px", // 减少间距适配紧凑布局
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: "8px", // 移动端进一步减少间距
    },
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px", // 减少间距
  },
  infoLabel: {
    fontSize: "10px", // 减少字体大小
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    textTransform: "uppercase",
    letterSpacing: "0.3px", // 减少字母间距
  },
  infoValue: {
    fontSize: "12px", // 减少字体大小
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    gap: "6px", // 减少间距
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  progressItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  progressValue: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  batteryIcon: {
    color: "var(--colorPaletteGreenForeground1)",
  },
  batteryIconLow: {
    color: "var(--colorPaletteRedForeground1)",
  },
  batteryIconMedium: {
    color: "var(--colorPaletteYellowForeground1)",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  copyButton: {
    flex: 1,
  },
  detailsButton: {
    flex: 1,
  },
});

interface DeviceCoreInfoCardProps {
  device: DeviceInfo;
  onShowDetails: () => void;
  onCopyInfo: () => void;
}

const DeviceCoreInfoCard: React.FC<DeviceCoreInfoCardProps> = ({
  device,
  onShowDetails,
  onCopyInfo,
}) => {
  const styles = useStyles();

  const getDeviceName = () => {
    if (device.properties?.marketName) {
      return device.properties.marketName;
    }
    if (device.properties?.brand && device.properties?.model) {
      return `${device.properties.brand} ${device.properties.model}`;
    }
    if (device.properties?.model) {
      return device.properties.model;
    }
    return "未知设备";
  };

  const getDeviceSubtitle = () => {
    const parts = [];
    if (device.properties?.brand) parts.push(device.properties.brand);
    if (device.properties?.model) parts.push(device.properties.model);
    if (device.properties?.deviceName) parts.push(`(${device.properties.deviceName})`);
    return parts.length > 0 ? parts.join(" ") : device.serial;
  };

  const getBatteryIcon = (level?: number) => {
    if (level === undefined) return <Battery024Regular />;
    if (level <= 20) return <Battery024Regular className={styles.batteryIconLow} />;
    if (level <= 50) return <Battery024Regular className={styles.batteryIconMedium} />;
    return <Battery024Regular className={styles.batteryIcon} />;
  };

  const getBatteryColor = (level?: number) => {
    if (level === undefined) return undefined;
    if (level <= 20) return "danger";
    if (level <= 50) return "warning";
    return "success";
  };

  const formatStorage = (storage?: string) => {
    if (!storage) return { used: 0, total: 100, text: "未知" };
    // 这里需要解析存储信息，暂时返回模拟数据
    return { used: 65, total: 100, text: storage };
  };

  const storageInfo = formatStorage(device.properties?.availableStorage);

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Phone24Regular />}
        header={<Text weight="semibold">设备概览</Text>}
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
        {/* 设备名称区域 */}
        <div>
          <div className={styles.deviceHeader}>
            <Text className={styles.deviceName}>{getDeviceName()}</Text>
          </div>
          <Text className={styles.deviceSubtitle}>{getDeviceSubtitle()}</Text>
        </div>

        {/* 核心信息网格 */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>Android版本</Text>
            <div className={styles.infoValue}>
              <DesktopPulse24Regular />
              <Text>{device.properties?.androidVersion || "未知"}</Text>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>设备模式</Text>
            <div className={styles.infoValue}>
              <Badge appearance="outline">
                {device.mode === "sys" ? "系统模式" :
                 device.mode === "rec" ? "恢复模式" :
                 device.mode === "fastboot" ? "Fastboot模式" : "未知模式"}
              </Badge>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>API级别</Text>
            <div className={styles.infoValue}>
              <Text>{device.properties?.apiLevel || "未知"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>CPU架构</Text>
            <div className={styles.infoValue}>
              <Text>{device.properties?.cpuAbi || device.properties?.abi || "未知"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>RAM容量</Text>
            <div className={styles.infoValue}>
              <Text>{device.properties?.totalMemory || "未知"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>屏幕分辨率</Text>
            <div className={styles.infoValue}>
              <Text>{device.properties?.screenResolution || device.properties?.displaySize || "未知"}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Text className={styles.infoLabel}>系统版本号</Text>
            <div className={styles.infoValue}>
              <Text>{device.properties?.buildNumber || device.properties?.buildId || "未知"}</Text>
            </div>
          </div>
        </div>

        {/* 进度条区域 */}
        <div className={styles.progressSection}>
          {/* 电池电量 */}
          {device.properties?.batteryLevel !== undefined && (
            <div className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <div className={styles.progressLabel}>
                  {getBatteryIcon(device.properties.batteryLevel)}
                  <Text>电池电量</Text>
                </div>
                <Text className={styles.progressValue}>
                  {device.properties.batteryLevel}%
                </Text>
              </div>
              <ProgressBar 
                value={device.properties.batteryLevel / 100}
                color={getBatteryColor(device.properties.batteryLevel)}
              />
            </div>
          )}

          {/* 存储空间 */}
          <div className={styles.progressItem}>
            <div className={styles.progressHeader}>
              <div className={styles.progressLabel}>
                <Storage24Regular />
                <Text>存储空间</Text>
              </div>
              <Text className={styles.progressValue}>
                {storageInfo.used}% 已使用
              </Text>
            </div>
            <ProgressBar 
              value={storageInfo.used / 100}
              color={storageInfo.used > 80 ? "danger" : storageInfo.used > 60 ? "warning" : "success"}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Tooltip content="复制设备信息到剪贴板" relationship="label">
            <Button
              appearance="subtle"
              icon={<Copy24Regular />}
              onClick={onCopyInfo}
              className={styles.copyButton}
            >
              复制信息
            </Button>
          </Tooltip>
          
          <Button
            appearance="primary"
            icon={<ChevronRight24Regular />}
            iconPosition="after"
            onClick={onShowDetails}
            className={styles.detailsButton}
          >
            查看详情
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DeviceCoreInfoCard;
