import React  from 'react';
import {
  makeStyles,
  Text,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Open24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  Bigcontainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "20px 20px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "20px 20px",
    background: `linear-gradient(135deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    position: "relative",
    overflow: "hidden",
  },

  // 修改水平排列容器的样式
  horizontalContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "24px",
    width: "100%",
    maxWidth: "100%",
    marginBottom: "24px",
    "@media screen and (max-width: 768px)": {
      flexDirection: "column",
      gap: "16px",
    },
  },

  modeCard: {
    padding: "16px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: "16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow16,
    width: "100%",
    flex: 1,
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: tokens.shadow28,
    },
  },

  modeTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground1,
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  modeLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: tokens.colorNeutralBackground2,
    textDecoration: "none",
    color: tokens.colorNeutralForeground1,
    transition: "all 0.2s ease",
    marginBottom: "6px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
      border: `1px solid ${tokens.colorBrandStroke1}`,
      color: tokens.colorBrandForeground1,
    },
    "&:last-child": {
      marginBottom: "0",
    }
  },

  linkText: {
    fontSize: "14px",
    fontWeight: "500",
  },

  linkIcon: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
  },

  troubleshooting: {
    padding: "16px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: "16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow16,
    width: "100%",
    flex: 1,
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: tokens.shadow28,
    },
  },

  troubleshootingTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground1,
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  troubleshootingItem: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
    padding: "8px 12px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "10px",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    "&::before": {
      content: "'•'",
      color: tokens.colorBrandForeground1,
      fontSize: "18px",
    },
    "&:last-child": {
      marginBottom: "0",
    }
  },
  
  backgroundDecoration: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background: `radial-gradient(circle, ${tokens.colorBrandBackground2}25 0%, transparent 70%)`,
    borderRadius: "50%",
    pointerEvents: "none",
  },
  
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    maxWidth: "600px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "12px",
  },
  
  mainIcon: {
    fontSize: "72px",
    color: tokens.colorBrandForeground1,
    filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))",
  },
  
  connectionIcon: {
    fontSize: "28px",
    color: tokens.colorNeutralForeground2,
    animation: "pulse 2s infinite",
  },
  
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: tokens.colorNeutralForeground1,
    marginBottom: "12px",
  },
  
  subtitle: {
    fontSize: "17px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  
  stepsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
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
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: "14px",
    fontWeight: "600",
    flexShrink: 0,
  },
  
  stepText: {
    fontSize: "15px",
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.5",
    fontWeight: "500",
  },
  
  scanningIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 24px",
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: "24px",
    border: `1px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow4,
  },
  
  scanningText: {
    fontSize: "16px",
    color: tokens.colorBrandForeground1,
    fontWeight: "600",
  },
  
  refreshButton: {
    marginTop: "12px",
  },
  
  "@keyframes pulse": {
    "&0%": { opacity: 1 },
    "&50%": { opacity: 0.4 },
    "&100%": { opacity: 1 },
  },
  
  "@keyframes float": {
    "&0%": { transform: "translateY(0px)" },
    "&50%": { transform: "translateY(-10px)" },
    "&100%": { transform: "translateY(0px)" },
  },
  
  floatingIcon: {
    animation: "float 4s ease-in-out infinite",
  }
});

interface NoDevicePromptProps {
  isScanning?: boolean;
  onRefresh?: () => void;
}

const NoDevicePrompt: React.FC<NoDevicePromptProps> = ({ 
  isScanning = false}) => {
  const styles = useStyles();


  return (
    <div className={styles.container}>
      {/* 背景装饰 */}
      <div className={styles.backgroundDecoration} />
      
      <div className={styles.content}>
        
        {/* 主标题 */}
        <Text className={styles.title}>
          未检测到设备，请确保设备已正确连接，对应的驱动已安装
        </Text>
        {/* 扫描状态指示器 */}
        {isScanning && (
        <div className={styles.scanningIndicator}>
          <Spinner size="extra-small" />
          <Text className={styles.scanningText}>
            正在扫描设备...
          </Text>
        </div>
        )}
        
        {/* 水平排列容器 */}
        <div className={styles.horizontalContainer}>
          {/* 连接模式卡片 */}
          <div className={styles.modeCard}>
            <Text className={styles.modeTitle}>
              <Settings24Regular /> 连接模式指南
            </Text>
            <div className={styles.stepsContainer}>
              <a href="https://admt.lacs.cc/docs/device/linksys" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>系统模式</Text>
                <Open24Regular className={styles.linkIcon} />
              </a>
              <a href="https://admt.lacs.cc/docs/device/linkrec" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>恢复模式</Text>
                <Open24Regular className={styles.linkIcon} />
              </a>
              <a href="https://admt.lacs.cc/docs/device/linkfb" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>引导模式</Text>
                <Open24Regular className={styles.linkIcon} />
              </a>
              <a href="https://admt.lacs.cc/docs/device/linkedl" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>EDL模式</Text>
                <Open24Regular className={styles.linkIcon} />
              </a>
            </div>
          </div>

          {/* 问题排查提示 */}
          <div className={styles.troubleshooting}>
            <Text className={styles.troubleshootingTitle}>
              <Settings24Regular /> 连接设备后仍然检测不到？
            </Text>
            <Text className={styles.troubleshootingItem}>检查USB接口是否正常工作</Text>
            <Text className={styles.troubleshootingItem}>检查设备尾插是否有损坏</Text>
            <Text className={styles.troubleshootingItem}>确保已安装正确的USB驱动</Text>
            <Text className={styles.troubleshootingItem}>检查自动检测设备开关是否开启</Text>
          </div>

          {/* 驱动安装指示器 */}
          <div className={styles.troubleshooting}> 
            <Text className={styles.troubleshootingTitle}>
              <Settings24Regular /> 如何安装对应的驱动？
            </Text>
            <Text className={styles.troubleshootingItem}>点击在线资源标签页</Text>
            <Text className={styles.troubleshootingItem}>选择驱动分类点击搜索</Text>
            <Text className={styles.troubleshootingItem}>选择对应的驱动并安装</Text>
            <Text className={styles.troubleshootingItem}>尝试重新连接</Text>
          </div>
        </div>


      
      </div>
    </div>
  );
};

export default NoDevicePrompt;