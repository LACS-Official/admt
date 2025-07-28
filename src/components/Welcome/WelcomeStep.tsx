import React from "react";
import {
  makeStyles,
  Text,
  Card,
} from "@fluentui/react-components";
import {
  Sparkle48Regular,
  Phone24Regular,
  Desktop24Regular,
  Settings24Regular,
  Shield24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { useAppConfigStore } from "../../stores/welcomeStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "32px",
    padding: "24px",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  icon: {
    fontSize: "64px",
    color: "var(--colorBrandBackground)",
  },
  title: {
    marginBottom: "8px",
  },
  subtitle: {
    color: "var(--colorNeutralForeground2)",
    maxWidth: "400px",
    lineHeight: "1.5",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    width: "100%",
    maxWidth: "500px",
  },
  featureCard: {
    padding: "16px",
    textAlign: "center",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  featureIcon: {
    fontSize: "24px",
    color: "var(--colorBrandBackground)",
    marginBottom: "8px",
  },
  featureTitle: {
    marginBottom: "4px",
  },
  featureDescription: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "12px",
  },
  version: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "12px",
    marginTop: "16px",
  },
  expiredNotice: {
    padding: "16px",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    border: "1px solid var(--colorPaletteYellowBorder1)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    maxWidth: "500px",
  },
  expiredIcon: {
    fontSize: "24px",
    color: "var(--colorPaletteYellowForeground1)",
  },
});

const WelcomeStep: React.FC = () => {
  const styles = useStyles();
  const { isExpired, config } = useAppConfigStore();

  const features = [
    {
      icon: <Phone24Regular className={styles.featureIcon} />,
      title: "设备管理",
      description: "连接和管理Android设备",
    },
    {
      icon: <Desktop24Regular className={styles.featureIcon} />,
      title: "屏幕投屏",
      description: "高质量屏幕镜像功能",
    },
    {
      icon: <Settings24Regular className={styles.featureIcon} />,
      title: "系统工具",
      description: "丰富的系统管理工具",
    },
    {
      icon: <Shield24Regular className={styles.featureIcon} />,
      title: "安全可靠",
      description: "安全的设备操作环境",
    },
  ];

  // 检查是否有过期的激活码
  const hasExpiredActivation = config.isActivated && isExpired();

  return (
    <div className={styles.container}>
      {/* 过期提示 */}
      {hasExpiredActivation && (
        <Card className={styles.expiredNotice}>
          <Warning24Regular className={styles.expiredIcon} />
          <div>
            <Text size={300} weight="semibold" style={{ color: "var(--colorPaletteYellowForeground1)" }}>
              激活码已过期
            </Text>
            <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px", display: "block" }}>
              您的激活码已于 {config.expiryDate ? new Date(config.expiryDate).toLocaleDateString('zh-CN') : '未知日期'} 过期，请重新输入有效的激活码。
            </Text>
          </div>
        </Card>
      )}

      <div className={styles.hero}>
        <Sparkle48Regular className={styles.icon} />
        <div>
          <Text size={700} weight="bold" className={styles.title}>
            {hasExpiredActivation ? '重新激活 HOUT 工具箱' : '欢迎使用 HOUT 工具箱'}
          </Text>
          <Text size={400} className={styles.subtitle}>
            {hasExpiredActivation
              ? '您的激活码已过期，请重新输入有效的激活码以继续使用所有功能。'
              : '专业的Android设备管理工具，提供屏幕投屏、文件管理、应用安装等丰富功能。让您轻松管理和控制Android设备。'
            }
          </Text>
        </div>
      </div>

      <div className={styles.features}>
        {features.map((feature, index) => (
          <Card key={index} className={styles.featureCard}>
            {feature.icon}
            <Text size={300} weight="semibold" className={styles.featureTitle}>
              {feature.title}
            </Text>
            <Text size={200} className={styles.featureDescription}>
              {feature.description}
            </Text>
          </Card>
        ))}
      </div>

      <Text className={styles.version}>
        版本 1.0.0 | 由 HOUT 团队开发
      </Text>
    </div>
  );
};

export default WelcomeStep;
