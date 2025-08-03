/**
 * 分页式欢迎界面组件
 * 4页分页结构：软件介绍 -> 用户协议 -> 基础设置 -> 激活验证
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  ProgressBar,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { useWelcomeStore, useAppConfigStore } from '../../stores/welcomeStore';
import { WelcomeStep } from '../../types/welcome';

// 导入各页面组件
import IntroductionPage from './pages/IntroductionPage';
import AgreementPage from './pages/AgreementPage';
import SettingsPage from './pages/SettingsPage';
import ActivationPage from './pages/ActivationPage';
import AppIcon from '../Common/AppIcon';

const useStyles = makeStyles({
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--colorNeutralBackground1)',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 32px 16px',
    borderBottom: '1px solid var(--colorNeutralStroke2)',
    backgroundColor: 'var(--colorNeutralBackground1)',
    flexShrink: 0,
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  appIcon: {
    fontSize: '32px',
    color: 'var(--colorBrandBackground)',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--colorNeutralForeground2)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  pageContainer: {
    flex: 1,
    padding: '24px 32px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  footer: {
    padding: '16px 32px 24px',
    borderTop: '1px solid var(--colorNeutralStroke2)',
    backgroundColor: 'var(--colorNeutralBackground1)',
    flexShrink: 0,
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

interface PaginatedWelcomePageProps {
  onComplete: () => void;
}

const PaginatedWelcomePage: React.FC<PaginatedWelcomePageProps> = ({ onComplete }) => {
  const styles = useStyles();
  const {
    currentStep,
    isLoading,
    error,
    userAgreementAccepted,
    privacyPolicyAccepted,
    analyticsConsent,
    activationStatus,
    setCurrentStep,
    nextStep,
    previousStep,
    canProceedToNext,
  } = useWelcomeStore();
  
  const { setActivated } = useAppConfigStore();

  // 页面配置
  const pages = [
    {
      step: WelcomeStep.INTRODUCTION,
      title: '软件介绍',
      description: '了解玩机管家的功能特色',
    },
    {
      step: WelcomeStep.AGREEMENT,
      title: '用户协议',
      description: '阅读并同意使用条款',
    },
    {
      step: WelcomeStep.SETTINGS,
      title: '基础设置',
      description: '配置个人偏好设置',
    },
    {
      step: WelcomeStep.ACTIVATION,
      title: '激活验证',
      description: '输入激活码完成激活',
    },
  ];

  const currentPageIndex = pages.findIndex(page => page.step === currentStep);
  const currentPage = pages[currentPageIndex];
  const progress = ((currentPageIndex + 1) / pages.length) * 100;

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && canProceedToNext()) {
        handleNext();
      } else if (event.key === 'Escape' && currentPageIndex > 0) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, canProceedToNext]);

  // 处理下一页
  const handleNext = async () => {
    if (currentStep === WelcomeStep.ACTIVATION && activationStatus === 'activated') {
      // 激活完成，进入主应用
      setActivated(true);
      onComplete();
      return;
    }
    
    nextStep();
  };

  // 处理上一页
  const handlePrevious = () => {
    previousStep();
  };

  // 渲染页面内容
  const renderPageContent = () => {
    switch (currentStep) {
      case WelcomeStep.INTRODUCTION:
        return <IntroductionPage />;
      case WelcomeStep.AGREEMENT:
        return <AgreementPage />;
      case WelcomeStep.SETTINGS:
        return <SettingsPage />;
      case WelcomeStep.ACTIVATION:
        return <ActivationPage />;
      default:
        return null;
    }
  };

  // 获取下一步按钮文本
  const getNextButtonText = () => {
    if (currentStep === WelcomeStep.ACTIVATION) {
      if (activationStatus === 'activated') {
        return '进入主页';
      } else {
        return '下一页';
      }
    }
    return currentPageIndex === pages.length - 1 ? '完成' : '下一页';
  };

  // 检查是否可以进入下一页
  const canGoNext = () => {
    switch (currentStep) {
      case WelcomeStep.AGREEMENT:
        return userAgreementAccepted && privacyPolicyAccepted;
      case WelcomeStep.ACTIVATION:
        return activationStatus === 'activated';
      default:
        return true;
    }
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <AppIcon className={styles.appIcon} />
          <Title1>玩机管家</Title1>
        </div>
        
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            <Text size={400} weight="semibold">
              {currentPage?.title}
            </Text>
            <div className={styles.pageIndicator}>
              <Text size={300}>
                第 {currentPageIndex + 1} 页，共 {pages.length} 页
              </Text>
            </div>
          </div>
          <ProgressBar value={progress} max={100} />
        </div>
      </div>

      {/* 主要内容 */}
      <div className={styles.content}>
        <div className={styles.pageContainer}>
          {renderPageContent()}
        </div>
      </div>

      {/* 底部导航 */}
      <div className={styles.footer}>
        <div className={styles.navigationButtons}>
          <div>
            {currentPageIndex > 0 && (
              <Button
                appearance="subtle"
                icon={<ArrowLeft24Regular />}
                onClick={handlePrevious}
                disabled={isLoading}
              >
                上一页
              </Button>
            )}
          </div>

          <div className={styles.buttonGroup}>
            {error && (
              <Text size={300} style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                {error}
              </Text>
            )}
            
            <Button
              appearance="primary"
              iconPosition="after"
              icon={isLoading ? <Spinner size="tiny" /> : 
                    currentStep === WelcomeStep.ACTIVATION && activationStatus === 'activated' ? 
                    <Checkmark24Regular /> : <ArrowRight24Regular />}
              onClick={handleNext}
              disabled={!canGoNext() || isLoading}
            >
              {isLoading ? '处理中...' : getNextButtonText()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaginatedWelcomePage;
