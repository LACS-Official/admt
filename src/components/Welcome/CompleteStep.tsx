import React from "react";
import {
  makeStyles,
  Text,
  Card,
  Badge,
} from "@fluentui/react-components";
import {
  Checkmark48Regular,
  Sparkle24Regular,
  Person24Regular,
  Shield24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useWelcomeStore } from "../../stores/welcomeStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "16px",
    textAlign: "center",
  },
  header: {
    marginBottom: "16px",
  },
  icon: {
    fontSize: "64px",
    color: "var(--colorPaletteGreenForeground1)",
    marginBottom: "16px",
  },
  title: {
    marginBottom: "8px",
  },
  subtitle: {
    color: "var(--colorNeutralForeground2)",
    maxWidth: "400px",
    margin: "0 auto",
    lineHeight: "1.5",
  },
  summaryCard: {
    padding: "20px",
    textAlign: "left",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    maxWidth: "400px",
    margin: "0 auto",
    width: "100%",
  },
  summaryTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid var(--colorNeutralStroke3)",
  },
  summaryItem_last: {
    borderBottom: "none",
  },
  summaryLabel: {
    color: "var(--colorNeutralForeground2)",
  },
  summaryValue: {
    fontWeight: "600",
  },
  featuresCard: {
    padding: "20px",
    backgroundColor: "var(--colorBrandBackground2)",
    border: "1px solid var(--colorBrandStroke1)",
    maxWidth: "400px",
    margin: "0 auto",
    width: "100%",
  },
  featuresTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    color: "var(--colorBrandForeground1)",
  },
  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  featureIcon: {
    fontSize: "16px",
    color: "var(--colorPaletteGreenForeground1)",
  },
  nextSteps: {
    marginTop: "16px",
  },
  nextStepsTitle: {
    marginBottom: "12px",
  },
  nextStepsList: {
    textAlign: "left",
    maxWidth: "400px",
    margin: "0 auto",
  },
  nextStepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "8px",
  },
  stepNumber: {
    minWidth: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "var(--colorBrandBackground)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "2px",
  },
});

const CompleteStep: React.FC = () => {
  const styles = useStyles();
  const { userConfig, activationCode } = useWelcomeStore();

  const getThemeText = (theme: string) => {
    switch (theme) {
      case 'light': return '浅色主题';
      case 'dark': return '深色主题';
      case 'auto': return '跟随系统';
      default: return theme;
    }
  };

  const getLanguageText = (language: string) => {
    switch (language) {
      case 'zh-CN': return '简体中文';
      case 'zh-TW': return '繁體中文';
      case 'en-US': return 'English';
      case 'ja-JP': return '日本語';
      case 'ko-KR': return '한국어';
      default: return language;
    }
  };

  const features = [
    "Android设备连接和管理",
    "高质量屏幕投屏功能",
    "文件传输和管理",
    "应用安装和卸载",
    "系统信息查看",
    "设备控制工具",
  ];

  const nextSteps = [
    "连接您的Android设备",
    "启用USB调试模式",
    "开始使用投屏功能",
    "探索更多工具功能",
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Checkmark48Regular className={styles.icon} />
        <Text size={700} weight="bold" className={styles.title}>
          设置完成！
        </Text>
        <Text size={400} className={styles.subtitle}>
          恭喜！您已成功激活HOUT工具箱。现在可以开始使用所有功能了。
        </Text>
      </div>

      {/* 配置摘要 */}
      <Card className={styles.summaryCard}>
        <div className={styles.summaryTitle}>
          <Settings24Regular style={{ color: "var(--colorBrandBackground)" }} />
          <Text size={400} weight="semibold">配置摘要</Text>
        </div>
        
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>用户名</Text>
          <Text className={styles.summaryValue}>{userConfig.username}</Text>
        </div>
        
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>语言</Text>
          <Text className={styles.summaryValue}>{getLanguageText(userConfig.language || 'zh-CN')}</Text>
        </div>
        
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>主题</Text>
          <Text className={styles.summaryValue}>{getThemeText(userConfig.theme || 'auto')}</Text>
        </div>
        
        <div className={styles.summaryItem}>
          <Text className={styles.summaryLabel}>开机自启</Text>
          <Badge appearance="filled" color={userConfig.autoStart ? "success" : "subtle"}>
            {userConfig.autoStart ? "已启用" : "已禁用"}
          </Badge>
        </div>
        
        <div className={`${styles.summaryItem} ${styles.summaryItem_last}`}>
          <Text className={styles.summaryLabel}>激活状态</Text>
          <Badge appearance="filled" color="success">
            已激活
          </Badge>
        </div>
      </Card>

      {/* 可用功能 */}
      <Card className={styles.featuresCard}>
        <div className={styles.featuresTitle}>
          <Sparkle24Regular />
          <Text size={400} weight="semibold">可用功能</Text>
        </div>
        
        <div className={styles.featuresList}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureItem}>
              <Checkmark48Regular className={styles.featureIcon} />
              <Text size={300}>{feature}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* 下一步操作 */}
      <div className={styles.nextSteps}>
        <Text size={500} weight="semibold" className={styles.nextStepsTitle}>
          接下来您可以：
        </Text>
        
        <div className={styles.nextStepsList}>
          {nextSteps.map((step, index) => (
            <div key={index} className={styles.nextStepItem}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <Text size={300}>{step}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompleteStep;
