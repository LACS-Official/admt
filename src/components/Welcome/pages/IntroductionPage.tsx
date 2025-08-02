/**
 * 第1页：软件介绍页面
 * 展示"玩机管家"的主要功能、特色和用途
 */

import React from 'react';
import {
  makeStyles,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  Phone24Regular,
  Desktop24Regular,
  Apps24Regular,
  Wrench24Regular,
  Shield24Regular,
  Star24Regular,
  Sparkle48Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '800px',
    margin: '0 auto',
    height: '100%',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '24px',
    padding: '32px 0',
  },
  appIcon: {
    fontSize: '80px',
    color: 'var(--colorBrandBackground)',
    marginBottom: '16px',
  },
  title: {
    marginBottom: '16px',
  },
  subtitle: {
    maxWidth: '600px',
    lineHeight: '1.6',
    color: 'var(--colorNeutralForeground2)',
  },
  versionBadge: {
    marginTop: '16px',
  },
  featuresSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    padding: '24px',
    height: 'auto',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow8)',
    },
  },
  featureHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  featureIcon: {
    fontSize: '24px',
    color: 'var(--colorBrandBackground)',
  },
  featureTitle: {
    margin: 0,
  },
  featureDescription: {
    lineHeight: '1.5',
    color: 'var(--colorNeutralForeground2)',
  },
  highlightsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  highlightsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  highlightItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  highlightIcon: {
    fontSize: '16px',
    color: 'var(--colorPaletteGreenForeground1)',
  },
});

const IntroductionPage: React.FC = () => {
  const styles = useStyles();

  const features = [
    {
      icon: <Phone24Regular />,
      title: '设备管理',
      description: '智能检测和管理Android设备，支持多设备同时连接，实时监控设备状态和系统信息。',
    },
    {
      icon: <Desktop24Regular />,
      title: '屏幕投屏',
      description: '高质量屏幕镜像功能，支持实时控制，提供流畅的投屏体验，让您在电脑上操作手机。',
    },
    {
      icon: <Apps24Regular />,
      title: 'APK管理',
      description: '便捷的APK安装、卸载和管理功能，支持批量操作和应用信息查看，简化应用管理流程。',
    },
    {
      icon: <Wrench24Regular />,
      title: '专业工具',
      description: '丰富的ADB工具集，包括文件传输、系统调试、性能优化等专业功能，满足高级用户需求。',
    },
    {
      icon: <Shield24Regular />,
      title: '安全可靠',
      description: '采用多层安全架构，保护您的设备和数据安全，支持加密传输和权限管理。',
    },
  ];

  const highlights = [
    '支持Android 5.0+设备',
    '无需Root权限',
    '多设备同时管理',
    '实时屏幕投屏',
    '批量文件传输',
    '专业ADB工具',
    '安全加密传输',
    '定期功能更新',
  ];

  return (
    <div className={styles.container}>
      {/* 英雄区域 */}
      <div className={styles.heroSection}>
        <Sparkle48Regular className={styles.appIcon} />
        <div>
          <Title1 className={styles.title}>
            欢迎使用玩机管家
          </Title1>
          <Body1 className={styles.subtitle}>
            专业的Android设备管理工具，提供屏幕投屏、文件管理、应用安装等丰富功能。
            让您轻松管理和控制Android设备，提升工作效率，享受便捷的移动设备管理体验。
          </Body1>
          <Badge
            appearance="outline"
            color="brand"
            size="large"
            className={styles.versionBadge}
          >
            版本 1.0.0
          </Badge>
        </div>
      </div>

      <Divider />

      {/* 功能特性 */}
      <div className={styles.featuresSection}>
        <Title2 className={styles.sectionTitle}>
          核心功能
        </Title2>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} className={styles.featureCard}>
              <div className={styles.featureHeader}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <Text size={500} weight="semibold" className={styles.featureTitle}>
                  {feature.title}
                </Text>
              </div>
              <Body1 className={styles.featureDescription}>
                {feature.description}
              </Body1>
            </Card>
          ))}
        </div>
      </div>

      {/* 产品亮点 */}
      <div className={styles.highlightsSection}>
        <Title2 style={{ textAlign: 'center', marginBottom: '16px' }}>
          产品亮点
        </Title2>
        <div className={styles.highlightsList}>
          {highlights.map((highlight, index) => (
            <div key={index} className={styles.highlightItem}>
              <Star24Regular className={styles.highlightIcon} />
              <Text size={300}>{highlight}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;
