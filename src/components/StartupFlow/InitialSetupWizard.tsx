/**
 * 初始设置向导组件
 * 引导新用户完成基本设置（主题、语言、隐私等）
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
  Checkbox,
  ProgressBar,
  MessageBar,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
  WeatherSunny24Regular,
  WeatherMoon24Regular,
  Globe24Regular,
  Shield24Regular,
} from '@fluentui/react-icons';
import { useStartupFlowStore, UserSettings } from '../../stores/startupFlowStore';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  },
  wizard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    color: '#323130',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  progressSection: {
    marginBottom: '32px',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  stepContent: {
    marginBottom: '32px',
    minHeight: '300px',
  },
  stepTitle: {
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepIcon: {
    fontSize: '24px',
    color: '#6264a7',
  },
  optionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  optionCard: {
    padding: '16px',
    border: '2px solid #e1dfdd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      border: '2px solid #6264a7',
      backgroundColor: '#f8f7ff',
    },
    '&[data-selected="true"]': {
      border: '2px solid #6264a7',
      backgroundColor: '#f8f7ff',
    },
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  optionIcon: {
    fontSize: '20px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8f7ff',
    borderRadius: '8px',
  },
  checkboxContent: {
    flex: 1,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationButtons: {
    display: 'flex',
    gap: '12px',
  },
});

interface InitialSetupWizardProps {
  onComplete: (settings: UserSettings) => void;
  onCancel?: () => void;
}

const InitialSetupWizard: React.FC<InitialSetupWizardProps> = ({ onComplete, onCancel }) => {
  const styles = useStyles();
  const [currentStep, setCurrentStep] = useState(0);
  const { userSettings, updateUserSettings } = useStartupFlowStore();
  
  const [localSettings, setLocalSettings] = useState<UserSettings>({
    ...userSettings,
  });

  const steps = [
    {
      id: 'theme',
      title: '选择主题',
      icon: <WeatherSunny24Regular />,
      description: '选择您喜欢的界面主题',
    },
    {
      id: 'language',
      title: '语言设置',
      icon: <Globe24Regular />,
      description: '选择您的首选语言',
    },
    {
      id: 'privacy',
      title: '隐私设置',
      icon: <Shield24Regular />,
      description: '配置数据收集和隐私选项',
    },
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成设置
      updateUserSettings(localSettings);
      onComplete(localSettings);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateLocalSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderThemeStep = () => {
    const themeOptions = [
      {
        value: 'light' as const,
        title: '浅色主题',
        description: '经典的浅色界面，适合白天使用',
        icon: <WeatherSunny24Regular />,
      },
      {
        value: 'dark' as const,
        title: '深色主题',
        description: '护眼的深色界面，适合夜间使用',
        icon: <WeatherMoon24Regular />,
      },
      {
        value: 'auto' as const,
        title: '自动切换',
        description: '根据系统设置自动切换主题',
        icon: <Globe24Regular />,
      },
    ];

    return (
      <div>
        <Body1>选择您喜欢的界面主题，您可以随时在设置中更改。</Body1>
        <div className={styles.optionGroup}>
          {themeOptions.map((option) => (
            <div
              key={option.value}
              className={styles.optionCard}
              data-selected={localSettings.theme === option.value}
              onClick={() => updateLocalSetting('theme', option.value)}
            >
              <div className={styles.optionHeader}>
                <div className={styles.optionIcon}>{option.icon}</div>
                <Text weight="semibold">{option.title}</Text>
              </div>
              <Caption1>{option.description}</Caption1>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLanguageStep = () => {
    const languageOptions = [
      {
        value: 'zh-CN' as const,
        title: '简体中文',
        description: '使用简体中文界面',
      },
      {
        value: 'en-US' as const,
        title: 'English',
        description: 'Use English interface',
      },
    ];

    return (
      <div>
        <Body1>选择您的首选语言，这将影响整个应用的界面语言。</Body1>
        <div className={styles.optionGroup}>
          {languageOptions.map((option) => (
            <div
              key={option.value}
              className={styles.optionCard}
              data-selected={localSettings.language === option.value}
              onClick={() => updateLocalSetting('language', option.value)}
            >
              <div className={styles.optionHeader}>
                <Text weight="semibold">{option.title}</Text>
              </div>
              <Caption1>{option.description}</Caption1>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPrivacyStep = () => {
    return (
      <div>
        <Body1>配置您的隐私和数据收集偏好设置。</Body1>
        <div className={styles.checkboxGroup}>
          <div className={styles.checkboxItem}>
            <Checkbox
              checked={localSettings.privacyConsent}
              onChange={(_, data) => updateLocalSetting('privacyConsent', data.checked === true)}
            />
            <div className={styles.checkboxContent}>
              <Text weight="semibold">隐私政策同意</Text>
              <Caption1>
                同意我们的隐私政策，了解我们如何处理您的数据
              </Caption1>
            </div>
          </div>

          <div className={styles.checkboxItem}>
            <Checkbox
              checked={localSettings.dataCollectionConsent}
              onChange={(_, data) => updateLocalSetting('dataCollectionConsent', data.checked === true)}
            />
            <div className={styles.checkboxContent}>
              <Text weight="semibold">匿名数据收集（必需）</Text>
              <Caption1>
                允许收集匿名使用数据以改进产品体验。此项为软件正常运行所必需。
              </Caption1>
            </div>
          </div>

          <div className={styles.checkboxItem}>
            <Checkbox
              checked={localSettings.analyticsConsent}
              onChange={(_, data) => updateLocalSetting('analyticsConsent', data.checked === true)}
            />
            <div className={styles.checkboxContent}>
              <Text weight="semibold">分析统计</Text>
              <Caption1>
                允许发送匿名使用统计以帮助我们改进产品
              </Caption1>
            </div>
          </div>
        </div>

        {!localSettings.privacyConsent && (
          <MessageBar intent="warning" style={{ marginTop: '16px' }}>
            必须同意隐私政策才能继续使用应用
          </MessageBar>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'theme':
        return renderThemeStep();
      case 'language':
        return renderLanguageStep();
      case 'privacy':
        return renderPrivacyStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (steps[currentStep].id === 'privacy') {
      return localSettings.privacyConsent;
    }
    return true;
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.wizard}>
          <div className={styles.header}>
            <Title1>初始设置</Title1>
            <Body1>让我们快速配置您的应用偏好设置</Body1>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressText}>
              <Caption1>步骤 {currentStep + 1} / {totalSteps}</Caption1>
              <Caption1>{Math.round(progress)}%</Caption1>
            </div>
            <ProgressBar value={progress / 100} />
          </div>

          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>
              <div className={styles.stepIcon}>{steps[currentStep].icon}</div>
              <Title2>{steps[currentStep].title}</Title2>
            </div>
            <Body1 style={{ marginBottom: '16px', opacity: 0.8 }}>
              {steps[currentStep].description}
            </Body1>
            {renderStepContent()}
          </div>

          <div className={styles.actions}>
            <div>
              {onCancel && (
                <Button appearance="subtle" onClick={onCancel}>
                  取消
                </Button>
              )}
            </div>
            
            <div className={styles.navigationButtons}>
              <Button
                appearance="secondary"
                icon={<ArrowLeft24Regular />}
                disabled={currentStep === 0}
                onClick={handlePrevious}
              >
                上一步
              </Button>
              <Button
                appearance="primary"
                icon={isLastStep ? <Checkmark24Regular /> : <ArrowRight24Regular />}
                iconPosition="after"
                disabled={!canProceed()}
                onClick={handleNext}
              >
                {isLastStep ? '完成设置' : '下一步'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialSetupWizard;
