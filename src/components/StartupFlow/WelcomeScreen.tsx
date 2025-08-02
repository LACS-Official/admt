/**
 * 新用户欢迎界面组件
 * 为新用户展示应用介绍和功能亮点
 */

import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Image,
  Checkbox,
  Link,
  MessageBar,
} from '@fluentui/react-components';
import {
  Phone24Regular,
  Apps24Regular,
  Wrench24Regular,
  Shield24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { useWelcomeStore } from '../../stores/welcomeStore';
import ExitConfirmDialog from '../Common/ExitConfirmDialog';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    overflow: 'auto',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  logo: {
    width: '120px',
    height: '120px',
    marginBottom: '24px',
    borderRadius: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    margin: '0 auto',
  },
  subtitle: {
    marginTop: '16px',
    opacity: 0.9,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    width: '100%',
    marginBottom: '48px',
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '24px',
    color: '#323130',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
  },
  featureIcon: {
    fontSize: '32px',
    marginBottom: '16px',
    color: '#6264a7',
  },
  featureTitle: {
    marginBottom: '12px',
  },
  featureDescription: {
    flex: 1,
    opacity: 0.8,
  },
  agreementSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '24px',
    color: '#323130',
    width: '100%',
    maxWidth: '600px',
    marginBottom: '32px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  checkboxLabel: {
    flex: 1,
    lineHeight: '20px',
  },
  actionSection: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  startButton: {
    minWidth: '160px',
    height: '48px',
    fontSize: '16px',
  },
});

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSkip?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSkip }) => {
  const styles = useStyles();
  const {
    userAgreementAccepted,
    privacyPolicyAccepted,
    analyticsConsent,
    setUserAgreementAccepted,
    setPrivacyPolicyAccepted,
    setAnalyticsConsent,
  } = useWelcomeStore();

  const [showExitDialog, setShowExitDialog] = useState(false);

  const features = [
    {
      icon: <Phone24Regular />,
      title: '设备管理',
      description: '智能检测和管理Android设备，支持多设备同时连接，实时监控设备状态和系统信息。',
    },
    {
      icon: <Apps24Regular />,
      title: 'APK管理',
      description: '便捷的APK安装、卸载和管理功能，支持批量操作和应用信息查看。',
    },
    {
      icon: <Wrench24Regular />,
      title: '专业工具',
      description: '丰富的ADB工具集，包括文件传输、系统调试、性能优化等专业功能。',
    },
    {
      icon: <Shield24Regular />,
      title: '安全可靠',
      description: '采用多层安全架构，保护您的设备和数据安全，支持加密传输和权限管理。',
    },
  ];

  const canProceed = userAgreementAccepted && privacyPolicyAccepted && analyticsConsent;

  const handleGetStarted = () => {
    if (canProceed) {
      onGetStarted();
    } else {
      // 显示退出确认对话框
      setShowExitDialog(true);
    }
  };

  const getMissingConsents = (): string[] => {
    const missing: string[] = [];
    if (!userAgreementAccepted) missing.push('userAgreement');
    if (!privacyPolicyAccepted) missing.push('privacyPolicy');
    if (!analyticsConsent) missing.push('analyticsConsent');
    return missing;
  };

  const handleExitConfirm = () => {
    setShowExitDialog(false);
    // 这里可以添加额外的清理逻辑
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 头部区域 */}
        <div className={styles.header}>
          <div className={styles.logo}>
            📱
          </div>
          <Title1>欢迎使用玩机管家</Title1>
          <Body1 className={styles.subtitle}>
            专业的Android设备管理工具，让您的设备管理更加简单高效
          </Body1>
        </div>

        {/* 功能特性展示 */}
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} className={styles.featureCard}>
              <CardHeader
                header={
                  <div>
                    <div className={styles.featureIcon}>{feature.icon}</div>
                    <Title2 className={styles.featureTitle}>{feature.title}</Title2>
                  </div>
                }
              />
              <CardPreview>
                <Body1 className={styles.featureDescription}>
                  {feature.description}
                </Body1>
              </CardPreview>
            </Card>
          ))}
        </div>

        {/* 用户协议和隐私政策 */}
        <div className={styles.agreementSection}>
          <Title2>使用条款和隐私政策</Title2>
          <Body1 style={{ marginTop: '12px', opacity: 0.8 }}>
            在开始使用玩机管家之前，请仔细阅读并同意以下条款：
          </Body1>

          <div className={styles.checkboxGroup}>
            <div className={styles.checkboxItem}>
              <Checkbox
                checked={userAgreementAccepted}
                onChange={(_, data) => setUserAgreementAccepted(data.checked === true)}
              />
              <div className={styles.checkboxLabel}>
                <Caption1>
                  我已阅读并同意{' '}
                  <Link href="#" target="_blank">
                    用户协议
                  </Link>
                  {' '}和{' '}
                  <Link href="#" target="_blank">
                    服务条款
                  </Link>
                </Caption1>
              </div>
            </div>

            <div className={styles.checkboxItem}>
              <Checkbox
                checked={privacyPolicyAccepted}
                onChange={(_, data) => setPrivacyPolicyAccepted(data.checked === true)}
              />
              <div className={styles.checkboxLabel}>
                <Caption1>
                  我已阅读并同意{' '}
                  <Link href="#" target="_blank">
                    隐私政策
                  </Link>
                  ，了解应用如何收集和使用我的数据
                </Caption1>
              </div>
            </div>

            <div className={styles.checkboxItem}>
              <Checkbox
                checked={analyticsConsent}
                onChange={(_, data) => setAnalyticsConsent(data.checked === true)}
              />
              <div className={styles.checkboxLabel}>
                <Caption1>
                  我同意发送匿名使用统计数据以帮助改进产品（必需）
                </Caption1>
                <Caption1 style={{ color: 'var(--colorPaletteRedForeground1)', fontSize: '11px', marginTop: '2px' }}>
                  此项为软件正常运行所必需，不同意将无法使用软件
                </Caption1>
              </div>
            </div>
          </div>

          {!canProceed && (
            <MessageBar intent="warning" style={{ marginTop: '16px' }}>
              请先同意用户协议、隐私政策和匿名数据收集才能继续使用。不同意任何一项都将无法使用软件。
            </MessageBar>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={styles.actionSection}>
          {onSkip && (
            <Button appearance="secondary" onClick={onSkip}>
              跳过引导
            </Button>
          )}
          <Button
            appearance="primary"
            className={styles.startButton}
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            onClick={handleGetStarted}
          >
            {canProceed ? '开始使用' : '我不同意，退出应用'}
          </Button>
        </div>
      </div>

      {/* 退出确认对话框 */}
      <ExitConfirmDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirmExit={handleExitConfirm}
        missingConsents={getMissingConsents()}
      />
    </div>
  );
};

export default WelcomeScreen;
