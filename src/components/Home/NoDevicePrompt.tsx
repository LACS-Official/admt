import React from 'react';
import cx from 'classnames';
import {
  makeStyles,
  Text,
  Spinner,
  tokens,
  Card,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Open24Regular,
  PresenceUnknown24Regular,
  PlugDisconnected24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import MiscellaneousCard from './MiscellaneousCard';


const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
  },

  // 水平排列容器的样式
  horizontalContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "24px",
    width: "90%",
    maxWidth: "1200px",
    marginBottom: "24px",
    "@media screen and (max-width: 968px)": {
      flexDirection: "column",
      gap: "16px",
    },
  },

  // 上部分容器样式
  upperSection: {
    height: "30%",
    width: "90%",
    maxWidth: "1200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },

  // 下部分容器样式
  lowerSection: {
    width: "90%",
    maxWidth: "1200px",
    display: "flex",
    flexDirection: "row",
    gap: "24px",
    "@media screen and (max-width: 968px)": {
      flexDirection: "column",
      gap: "16px",
    },
  },

  modeCard: {
    height: "200px",
    width: "60%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "box-shadow 0.2s ease",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
    },
  },

  // 连接指南卡片内部网格样式
  linkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "4px",
    padding: "0 8px 8px 8px",
  },

  // 卡片标题样式
  cardHeader: {
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // 卡片标题文本样式
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  // 标题图标样式
  titleIcon: {
    color: "var(--colorBrandForeground1)",
    fontSize: "24px",
  },

  modeLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 4px",
    margin: "4px 0",
    border: "1px solid var(--colorNeutralStroke3)",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "60px",
    textAlign: "center",
    minWidth: 0,
    position: "relative",
    textDecoration: "none",
    color: tokens.colorNeutralForeground1,
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },

  linkText: {
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },

  linkIcon: {
    fontSize: "16px",
    color: tokens.colorNeutralForeground2,
  },
  
  backgroundDecoration: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "800px",
    height: "800px",
    background: `radial-gradient(circle, ${tokens.colorBrandBackground2}15 0%, transparent 70%)`,
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
  },
  
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    maxWidth: "800px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "16px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: "12px 10px",
    borderRadius: "12px",
    minWidth: "100%",
  },
  
  mainIcon: {
    fontSize: "64px",
    color: tokens.colorBrandForeground1,
    filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
  },
  
  connectionIcon: {
    fontSize: "32px",
    color: tokens.colorNeutralForeground3,
    animation: "pulse 2s infinite",
  },
  
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: tokens.colorNeutralForeground1,
    marginBottom: "8px",
    lineHeight: "1.3",
  },
  
  subtitle: {
    fontSize: "16px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
    marginBottom: "24px",
  },
  
  scanningIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 20px",
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: "20px",
    border: `1px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow4,
    marginBottom: "24px",
  },
  
  scanningText: {
    fontSize: "16px",
    color: tokens.colorBrandForeground1,
    fontWeight: "600",
  },
  
  refreshButton: {
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "6px",
    color: tokens.colorNeutralForeground1,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
    "&:focus-visible": {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: "2px",
    }
  },
  
  refreshButtonText: {
    fontSize: "14px",
    fontWeight: "500",
  },
  
  "@keyframes pulse": {
    "0%": { opacity: "1" },
    "50%": { opacity: "0.4" },
    "100%": { opacity: "1" },
  },
  
  "@keyframes float": {
    "0%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-6px)" },
    "100%": { transform: "translateY(0px)" },
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
  isScanning = false,
  onRefresh
}) => {
  const styles = useStyles();


  return (
    <div className={styles.container}>
      <div className={styles.backgroundDecoration}></div>
      
      <div className={styles.content}>
        {/* 上部分容器 */}
        <div className={styles.upperSection}>
          {/* 主标题 */}
          <Card className={styles.iconContainer}>
            <PlugDisconnected24Regular className={styles.connectionIcon} />
            <Text className={styles.title}>
              暂未检测到设备连接
              请检查设备是否正常连接，对应驱动是否安装
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
          </Card>
          
          

          {!isScanning && onRefresh && (
            <div>
              <Text className={styles.subtitle}>
                自动刷新未开启，请开启自动刷新功能
              </Text>
            </div>
          )}
        </div>
        
        {/* 下部分容器 */}
        <div className={styles.lowerSection}>
          {/* 连接模式卡片 */}
          <Card className={styles.modeCard}>
            <div className={styles.cardHeader}>
              <Settings24Regular className={styles.titleIcon} />
              <Text className={styles.cardTitle}>连接指南</Text>
            </div>
            <div className={styles.linkGrid}>
                            <a href="https://admt.lacs.cc/docs" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>文档中心</Text>

              </a>
                            <a href="https://space.bilibili.com/1779662818/lists/4978116?type=series" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>视频教程</Text>

              </a>
              <a href="https://admt.lacs.cc/docs/device/linksys" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>系统模式</Text>

              </a>
              <a href="https://admt.lacs.cc/docs/device/linkrec" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>恢复模式</Text>

              </a>
              <a href="https://admt.lacs.cc/docs/device/linkfb" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>引导模式</Text>

              </a>
              <a href="https://admt.lacs.cc/docs/device/linkedl" target="_blank" rel="noopener noreferrer" className={styles.modeLink}>
                <Text className={styles.linkText}>EDL模式</Text>

              </a>


            </div>
          </Card>

          <MiscellaneousCard />
        </div>
      </div>
    </div>
  );
};

export default NoDevicePrompt;