import React from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
  Tooltip,
} from "@fluentui/react-components";
import {
  Shield24Regular,
  ShieldCheckmark24Regular,
  ShieldError24Regular,
  LockClosed24Regular,
  LockOpen24Regular,
  Bug24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  securityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr",
      gap: "8px",
    },
  },
  securityItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  securityItemSafe: {
    borderColor: "var(--colorPaletteGreenBorder1)",
    backgroundColor: "var(--colorPaletteGreenBackground1)",
  },
  securityItemWarning: {
    borderColor: "var(--colorPaletteYellowBorder1)",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
  },
  securityItemDanger: {
    borderColor: "var(--colorPaletteRedBorder1)",
    backgroundColor: "var(--colorPaletteRedBackground1)",
  },
  securityHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  securityIcon: {
    fontSize: "16px",
  },
  securityIconSafe: {
    color: "var(--colorPaletteGreenForeground1)",
  },
  securityIconWarning: {
    color: "var(--colorPaletteYellowForeground1)",
  },
  securityIconDanger: {
    color: "var(--colorPaletteRedForeground1)",
  },
  securityLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
  },
  securityValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  overallStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    borderRadius: "6px",
    border: "2px solid",
    marginTop: "auto",
  },
  overallStatusSafe: {
    borderColor: "var(--colorPaletteGreenBorder1)",
    backgroundColor: "var(--colorPaletteGreenBackground1)",
    color: "var(--colorPaletteGreenForeground1)",
  },
  overallStatusWarning: {
    borderColor: "var(--colorPaletteYellowBorder1)",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    color: "var(--colorPaletteYellowForeground1)",
  },
  overallStatusDanger: {
    borderColor: "var(--colorPaletteRedBorder1)",
    backgroundColor: "var(--colorPaletteRedBackground1)",
    color: "var(--colorPaletteRedForeground1)",
  },
});

interface SecurityStatusCardProps {
  device: DeviceInfo;
}

const SecurityStatusCard: React.FC<SecurityStatusCardProps> = ({ device }) => {
  const styles = useStyles();

  const getSecurityLevel = () => {
    if (!device.properties) return "unknown";
    
    let riskCount = 0;
    let warningCount = 0;
    
    // 检查Bootloader状态
    if (device.properties.bootloaderLocked === false) riskCount++;
    
    // 检查调试模式
    if (device.properties.debuggable === true) warningCount++;
    
    // 检查ADB安全
    if (device.properties.adbSecure === false) warningCount++;
    
    // 检查安全模式
    if (device.properties.secure === false) riskCount++;
    
    if (riskCount > 0) return "danger";
    if (warningCount > 0) return "warning";
    return "safe";
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case "safe": return <ShieldCheckmark24Regular className={styles.securityIconSafe} />;
      case "warning": return <Warning24Regular className={styles.securityIconWarning} />;
      case "danger": return <ShieldError24Regular className={styles.securityIconDanger} />;
      default: return <Shield24Regular />;
    }
  };

  const getSecurityText = (level: string) => {
    switch (level) {
      case "safe": return "设备安全";
      case "warning": return "存在风险";
      case "danger": return "高风险";
      default: return "未知状态";
    }
  };

  const getBootloaderStatus = () => {
    if (device.properties?.bootloaderLocked === undefined) {
      return { icon: <LockClosed24Regular />, text: "未知", level: "unknown" };
    }
    if (device.properties.bootloaderLocked) {
      return { 
        icon: <LockClosed24Regular className={styles.securityIconSafe} />, 
        text: "已锁定", 
        level: "safe" 
      };
    }
    return { 
      icon: <LockOpen24Regular className={styles.securityIconDanger} />, 
      text: "已解锁", 
      level: "danger" 
    };
  };

  const getDebuggableStatus = () => {
    if (device.properties?.debuggable === undefined) {
      return { icon: <Bug24Regular />, text: "未知", level: "unknown" };
    }
    if (device.properties.debuggable) {
      return { 
        icon: <Bug24Regular className={styles.securityIconWarning} />, 
        text: "已启用", 
        level: "warning" 
      };
    }
    return { 
      icon: <CheckmarkCircle24Regular className={styles.securityIconSafe} />, 
      text: "已禁用", 
      level: "safe" 
    };
  };

  const getSecureStatus = () => {
    if (device.properties?.secure === undefined) {
      return { icon: <Shield24Regular />, text: "未知", level: "unknown" };
    }
    if (device.properties.secure) {
      return { 
        icon: <ShieldCheckmark24Regular className={styles.securityIconSafe} />, 
        text: "已启用", 
        level: "safe" 
      };
    }
    return { 
      icon: <ShieldError24Regular className={styles.securityIconDanger} />, 
      text: "已禁用", 
      level: "danger" 
    };
  };

  const getAdbSecureStatus = () => {
    if (device.properties?.adbSecure === undefined) {
      return { icon: <Shield24Regular />, text: "未知", level: "unknown" };
    }
    if (device.properties.adbSecure) {
      return { 
        icon: <ShieldCheckmark24Regular className={styles.securityIconSafe} />, 
        text: "已启用", 
        level: "safe" 
      };
    }
    return { 
      icon: <Warning24Regular className={styles.securityIconWarning} />, 
      text: "已禁用", 
      level: "warning" 
    };
  };

  const securityLevel = getSecurityLevel();
  const bootloaderStatus = getBootloaderStatus();
  const debuggableStatus = getDebuggableStatus();
  const secureStatus = getSecureStatus();
  const adbSecureStatus = getAdbSecureStatus();

  const getItemClassName = (level: string) => {
    switch (level) {
      case "safe": return `${styles.securityItem} ${styles.securityItemSafe}`;
      case "warning": return `${styles.securityItem} ${styles.securityItemWarning}`;
      case "danger": return `${styles.securityItem} ${styles.securityItemDanger}`;
      default: return styles.securityItem;
    }
  };

  const getOverallClassName = () => {
    switch (securityLevel) {
      case "safe": return `${styles.overallStatus} ${styles.overallStatusSafe}`;
      case "warning": return `${styles.overallStatus} ${styles.overallStatusWarning}`;
      case "danger": return `${styles.overallStatus} ${styles.overallStatusDanger}`;
      default: return styles.overallStatus;
    }
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Shield24Regular />}
        header={<Text weight="semibold">安全状态</Text>}
        action={
          <Badge 
            appearance="filled" 
            color={securityLevel === "safe" ? "success" : 
                   securityLevel === "warning" ? "warning" : "danger"}
          >
            {getSecurityText(securityLevel)}
          </Badge>
        }
      />
      
      <div className={styles.content}>
        <div className={styles.securityGrid}>
          <Tooltip content="Bootloader锁定状态影响系统安全性" relationship="label">
            <div className={getItemClassName(bootloaderStatus.level)}>
              <div className={styles.securityHeader}>
                {bootloaderStatus.icon}
                <Text className={styles.securityLabel}>Bootloader</Text>
              </div>
              <Text className={styles.securityValue}>{bootloaderStatus.text}</Text>
            </div>
          </Tooltip>

          <Tooltip content="调试模式可能带来安全风险" relationship="label">
            <div className={getItemClassName(debuggableStatus.level)}>
              <div className={styles.securityHeader}>
                {debuggableStatus.icon}
                <Text className={styles.securityLabel}>调试模式</Text>
              </div>
              <Text className={styles.securityValue}>{debuggableStatus.text}</Text>
            </div>
          </Tooltip>

          <Tooltip content="系统安全模式状态" relationship="label">
            <div className={getItemClassName(secureStatus.level)}>
              <div className={styles.securityHeader}>
                {secureStatus.icon}
                <Text className={styles.securityLabel}>安全模式</Text>
              </div>
              <Text className={styles.securityValue}>{secureStatus.text}</Text>
            </div>
          </Tooltip>

          <Tooltip content="ADB安全认证状态" relationship="label">
            <div className={getItemClassName(adbSecureStatus.level)}>
              <div className={styles.securityHeader}>
                {adbSecureStatus.icon}
                <Text className={styles.securityLabel}>ADB安全</Text>
              </div>
              <Text className={styles.securityValue}>{adbSecureStatus.text}</Text>
            </div>
          </Tooltip>
        </div>

        <div className={getOverallClassName()}>
          {getSecurityIcon(securityLevel)}
          <Text weight="semibold">{getSecurityText(securityLevel)}</Text>
        </div>
      </div>
    </Card>
  );
};

export default SecurityStatusCard;
