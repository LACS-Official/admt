import React from 'react';
import {
  makeStyles,
  Text,
  Spinner,
  Card,
  Button,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Open24Regular,
  PlugDisconnected24Regular,
  ArrowClockwise24Regular,
  DocumentText24Regular,
  Video24Regular,
  Phone24Regular,
  DeveloperBoard24Regular,
  WifiSettingsRegular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "16px 16px 32px 16px",
    boxSizing: "border-box",
  },
  guideCard: {
    width: "100%",
    padding: "24px 28px",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
  },
  guideHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    color: "var(--colorBrandForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  guideStepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  stepTile: {
    display: "flex",
    flexDirection: "column",
    padding: "16px 18px",
    borderRadius: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    gap: "10px",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    position: "relative",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.05)",
    },
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBadge: {
    fontSize: "11px",
    fontWeight: 700,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    color: "var(--colorBrandForeground1)",
    backgroundColor: "rgba(0, 113, 227, 0.1)",
    padding: "2px 7px",
    borderRadius: "9999px",
  },
  stepIconWrap: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  stepContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  stepTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--colorNeutralForeground1)",
  },
  stepText: {
    fontSize: "12px",
    lineHeight: "1.5",
    color: "var(--colorNeutralForeground3)",
  },
  resourcesSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "6px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  resourcesTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--colorNeutralForeground2)",
  },
  linkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px",
  },
  linkBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "9px 14px",
    borderRadius: "9999px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    color: "var(--colorNeutralForeground1)",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 500,
    transition: "all 0.15s ease",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      color: "var(--colorBrandForeground1)",
      transform: "translateY(-1px)",
    },
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
  const { setWirelessDebuggingDialogOpen } = useAppStore();

  const connectionSteps = [
    {
      num: "01",
      title: "开启开发者选项",
      desc: "打开手机「设置 > 关于手机」，连续点击「版本号」7 次直至提示已处于开发者模式。",
      icon: <DeveloperBoard24Regular />,
      iconBg: "rgba(0, 113, 227, 0.1)",
      iconColor: "#0071e3",
    },
    {
      num: "02",
      title: "启用 USB 调试",
      desc: "进入「系统与更新 > 开发者选项」，开启「USB 调试」总开关（部分机型需开启安全权限）。",
      icon: <Settings24Regular />,
      iconBg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
    },
    {
      num: "03",
      title: "连接并信任授权",
      desc: "使用原装/数据线连接电脑，手机屏幕弹出授权弹窗时，勾选「始终允许调试」并确定。",
      icon: <Phone24Regular />,
      iconBg: "rgba(16, 185, 129, 0.1)",
      iconColor: "#10b981",
    },
  ];

  const resourceLinks = [
    { href: "https://admt.lacs.cc/docs", text: t('guide.docs', '官方文档'), icon: <DocumentText24Regular /> },
    { href: "https://space.bilibili.com/1779662818/lists/4978116?type=series", text: t('guide.video', '视频教程'), icon: <Video24Regular /> },
    { href: "https://admt.lacs.cc/docs/device/linksys", text: t('guide.sys', '系统模式指南'), icon: <Open24Regular /> },
    { href: "https://admt.lacs.cc/docs/device/linkrec", text: t('guide.rec', 'Recovery 模式'), icon: <Open24Regular /> },
    { href: "https://admt.lacs.cc/docs/device/linkfb", text: t('guide.fb', 'Fastboot 刷机'), icon: <Open24Regular /> },
    { href: "https://admt.lacs.cc/docs/device/linkedl", text: t('guide.edl', '9008 救砖'), icon: <Open24Regular /> },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.guideCard}>
        {/* 卡片头部：连接指南标题 + 快捷操作栏 */}
        <div className={styles.guideHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.iconBox}>
              <PlugDisconnected24Regular />
            </div>
            <div>
              <Text weight="semibold" size={400} style={{ display: "block" }}>
                {t('guide.title', '设备连接指南')}
              </Text>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                请按以下 3 步开启手机 USB 调试并连接电脑，或使用无线调试配对
              </Text>
            </div>
          </div>

          <div className={styles.headerActions}>
            {isScanning ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px" }}>
                <Spinner size="tiny" />
                <Text size={200} style={{ color: "var(--colorBrandForeground1)", fontWeight: 500 }}>
                  {t('status.scanning', '检索设备中...')}
                </Text>
              </div>
            ) : (
              onRefresh && (
                <Button
                  appearance="primary"
                  size="small"
                  icon={<ArrowClockwise24Regular />}
                  onClick={onRefresh}
                  style={{ borderRadius: "9999px" }}
                >
                  {t('common.refresh_manual', '刷新设备')}
                </Button>
              )
            )}
            <Button
              appearance="secondary"
              size="small"
              icon={<WifiSettingsRegular />}
              onClick={() => setWirelessDebuggingDialogOpen(true)}
              style={{ borderRadius: "9999px" }}
            >
              {t('common.wireless_connection', '无线调试')}
            </Button>
          </div>
        </div>

        {/* 3 步骤连接指南网格 */}
        <div className={styles.guideStepsGrid}>
          {connectionSteps.map((step) => (
            <div key={step.num} className={styles.stepTile}>
              <div className={styles.stepHeader}>
                <span className={styles.stepBadge}>STEP {step.num}</span>
                <div
                  className={styles.stepIconWrap}
                  style={{
                    backgroundColor: step.iconBg,
                    color: step.iconColor,
                  }}
                >
                  {step.icon}
                </div>
              </div>
              <div className={styles.stepContent}>
                <Text className={styles.stepTitle}>{step.title}</Text>
                <Text className={styles.stepText}>{step.desc}</Text>
              </div>
            </div>
          ))}
        </div>

        {/* 官方文档与知识库入口 */}
        <div className={styles.resourcesSection}>
          <Text className={styles.resourcesTitle}>
            官方文档与进阶模式指南
          </Text>
          <div className={styles.linkGrid}>
            {resourceLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkBtn}
              >
                {link.icon}
                <span>{link.text}</span>
              </a>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NoDevicePrompt;