import React from "react";
import {
  makeStyles,
  Text,
  Button,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import {
  UsbStick24Regular,
  Phone24Regular,
  Settings24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "40px 20px",
    background: `linear-gradient(135deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    position: "relative",
    overflow: "hidden",
  },
  
  backgroundDecoration: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    height: "400px",
    background: `radial-gradient(circle, ${tokens.colorBrandBackground2}15 0%, transparent 70%)`,
    borderRadius: "50%",
    pointerEvents: "none",
  },
  
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    maxWidth: "500px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "8px",
  },
  
  mainIcon: {
    fontSize: "64px",
    color: tokens.colorBrandForeground1,
    filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
  },
  
  connectionIcon: {
    fontSize: "24px",
    color: tokens.colorNeutralForeground2,
    animation: "pulse 2s infinite",
  },
  
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground1,
    marginBottom: "8px",
  },
  
  subtitle: {
    fontSize: "16px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
    marginBottom: "16px",
  },
  
  stepsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "400px",
  },
  
  step: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  
  stepNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: "12px",
    fontWeight: "600",
    flexShrink: 0,
  },
  
  stepText: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.4",
  },
  
  scanningIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: "20px",
    border: `1px solid ${tokens.colorBrandStroke1}`,
  },
  
  scanningText: {
    fontSize: "14px",
    color: tokens.colorBrandForeground1,
    fontWeight: "500",
  },
  
  refreshButton: {
    marginTop: "8px",
  },
  
  "@keyframes pulse": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.5 },
    "100%": { opacity: 1 },
  },
});

interface NoDevicePromptProps {
  isScanning?: boolean;
  onRefresh?: () => void;
}

const NoDevicePrompt: React.FC<NoDevicePromptProps> = ({ 
  isScanning = false, 
  onRefresh 
}) => {
  const styles = useStyles();

  const connectionSteps = [
    "使用USB数据线连接Android设备到电脑",
    "在设备上启用开发者选项",
    "开启USB调试功能",
    "允许电脑的USB调试授权"
  ];

  return (
    <div className={styles.container}>
      {/* 背景装饰 */}
      <div className={styles.backgroundDecoration} />
      
      <div className={styles.content}>
        {/* 图标区域 */}
        <div className={styles.iconContainer}>
          <Phone24Regular className={styles.mainIcon} />
          <UsbStick24Regular className={styles.connectionIcon} />
        </div>
        
        {/* 主标题 */}
        <Text className={styles.title}>
          未检测到设备
        </Text>
        
        {/* 副标题 */}
        <Text className={styles.subtitle}>
          请连接Android设备并启用USB调试功能
        </Text>
        
        {/* 连接步骤 */}
        <div className={styles.stepsContainer}>
          {connectionSteps.map((step, index) => (
            <div key={index} className={styles.step}>
              <div className={styles.stepNumber}>
                {index + 1}
              </div>
              <Text className={styles.stepText}>
                {step}
              </Text>
            </div>
          ))}
        </div>
        
        {/* 扫描状态指示器 */}
        {isScanning && (
          <div className={styles.scanningIndicator}>
            <Spinner size="extra-small" />
            <Text className={styles.scanningText}>
              正在扫描设备...
            </Text>
          </div>
        )}
        
        {/* 刷新按钮 */}
        {onRefresh && (
          <Button
            appearance="primary"
            icon={<ArrowClockwise24Regular />}
            onClick={onRefresh}
            className={styles.refreshButton}
          >
            手动刷新
          </Button>
        )}
      </div>
    </div>
  );
};

export default NoDevicePrompt;
