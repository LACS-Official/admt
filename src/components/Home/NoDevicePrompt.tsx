import React from 'react';
import cx from 'classnames';
import {
  makeStyles,
  mergeClasses,
  Text,
  Spinner,
  tokens,
  Card,
  Button,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Open24Regular,
  PresenceUnknown24Regular,
  PlugDisconnected24Regular,
  ArrowClockwise24Regular,
  DocumentText24Regular,
  Video24Regular,
  Phone24Regular,
  Shield24Regular,
  DeveloperBoard24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import MiscellaneousCard from './MiscellaneousCard';
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";


const useStyles = makeStyles({
  container: {
    display: "flex",
    borderRadius: "12px",
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
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    padding: "16px 24px",
    backgroundColor: "var(--colorNeutralBackground2)",
    boxSizing: 'border-box',
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

  // 统一卡片样式
  unifiedCard: {
    display: "flex",
    flexDirection: "column",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "box-shadow 0.2s ease",
    width: "60%",
    maxHeight: "200px",
  },

  // 设备状态卡片样式
  statusCard: {
    width: "100%",
    padding: "24px",
    marginBottom: "16px",
  },

  // 连接指南卡片样式
  guideCard: {
    height: "200px",
    width: "60%",
    padding: "16px",
  },

  // 杂项卡片样式
  miscCard: {
    width: "50%",
    padding: "16px",
  },

  // 连接指南卡片内部网格样式
  linkGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "8px",
    padding: "8px 0 0 0",
  },

  // 卡片标题样式
  cardHeader: {
    marginBottom: "2px",
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

  // 连接链接样式
  modeLink: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 8px",
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
  },

  // 链接文本样式
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

  // 链接图标样式
  linkIcon: {
    fontSize: "20px",
    color: tokens.colorNeutralForeground2,
    marginBottom: "4px",
  },
  
  // 背景装饰样式
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
  
  // 内容区域样式
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
  
  // 图标容器样式
  iconContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    padding: "0",
    width: "100%",
    flexWrap: "wrap",
  },
  
  // 主图标样式
  mainIcon: {
    fontSize: "64px",
    color: tokens.colorBrandForeground1,
    filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
  },
  
  // 连接图标样式
  connectionIcon: {
    fontSize: "32px",
    color: tokens.colorNeutralForeground3,
    marginBottom: "0",
  },
  
  // 标题样式
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: tokens.colorNeutralForeground1,
    lineHeight: "1.3",
  },
  
  // 副标题样式
  subtitle: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
    lineHeight: "1.5",
  },
  
  // 扫描指示器样式
  scanningIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "12px 20px",
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: "20px",
    border: `1px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow4,
    marginTop: "0",
    width: "fit-content",
  },
  
  // 扫描文本样式
  scanningText: {
    fontSize: "16px",
    color: tokens.colorBrandForeground1,
    fontWeight: "600",
  },
  
  // 刷新按钮样式
  refreshButton: {
    marginTop: "0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  
  // 刷新按钮文本样式
  refreshButtonText: {
    fontSize: "14px",
    fontWeight: "500",
  },
  
  wirelessSection: {
    width: "100%",
    maxWidth: "1200px",
    marginTop: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
  const { t } = useTranslation();


  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.backgroundDecoration}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      ></motion.div>
      
      <div className={styles.content}>
        {/* 上部分容器 */}
        <motion.div 
          className={styles.upperSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
            <div className={styles.iconContainer}>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                  <PlugDisconnected24Regular className={styles.connectionIcon} />
              </motion.div>
              <Text className={styles.title}>
                {t('main.no_device_title')}， {t('main.no_device_desc')}
              </Text>
              
              {/* 扫描状态指示器 */}
              {isScanning && (
                <div className={styles.scanningIndicator}>
                  <Spinner size="extra-small" />
                  <Text className={styles.scanningText}>
                    {t('status.scanning')}
                  </Text>
                </div>
              )}
              
              {/* 刷新按钮 */}
              {!isScanning && onRefresh && (
                <motion.div 
                  className={styles.refreshButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    appearance="primary" 
                    icon={<ArrowClockwise24Regular />}
                    onClick={onRefresh}
                  >
                    {t('common.refresh_manual')}
                  </Button>
                </motion.div>
              )}
            </div>
        </motion.div>
        
        {/* 下部分容器 */}
        <motion.div 
          className={styles.lowerSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* 连接指南卡片 */}
          <Card className={mergeClasses(styles.unifiedCard, styles.guideCard)}>
            <div className={styles.cardHeader}>

              <Settings24Regular className={styles.titleIcon} />
              <Text className={styles.cardTitle}>{t('guide.title')}</Text>
            </div>
            <div className={styles.linkGrid}>
              {[
                { href: "https://admt.lacs.cc/docs", text: t('guide.docs') },
                { href: "https://space.bilibili.com/1779662818/lists/4978116?type=series", text: t('guide.video') },
                { href: "https://admt.lacs.cc/docs/device/linksys", text: t('guide.sys') },
                { href: "https://admt.lacs.cc/docs/device/linkrec", text: t('guide.rec') },
                { href: "https://admt.lacs.cc/docs/device/linkfb", text: t('guide.fb') },
                { href: "https://admt.lacs.cc/docs/device/linkedl", text: t('guide.edl') },
              ].map((link, index) => (
                <motion.a 
                  key={index}
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.modeLink}
                  whileHover={{ scale: 1.05, backgroundColor: "var(--colorNeutralBackground2Hover)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Text className={styles.linkText}>{link.text}</Text>
                </motion.a>
              ))}
            </div>
          </Card>

          <MiscellaneousCard />
        </motion.div>
      </div>
    </div>
  );
};

export default NoDevicePrompt;