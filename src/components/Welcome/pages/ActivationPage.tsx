/**
 * 第4页：激活码验证页面
 * 用户输入激活码并进行验证
 */

import React, { useState } from 'react';
import {
  makeStyles,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  Field,
  Input,
  Button,
  Spinner,
  MessageBar,
} from '@fluentui/react-components';
import {
  Key24Regular,
  Shield24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { useWelcomeStore, useAppConfigStore } from '../../../stores/welcomeStore';
import { useStartupFlowStore } from '../../../stores/startupFlowStore';
import { activationService } from '../../../services/activationService';
import { ActivationStatus } from '../../../types/welcome';

const useStyles = makeStyles({
  Image: { 
    width: '400px',
    height: '90%',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '680px', // 固定高度，适合1024x720窗口（减去标题栏等）
    maxWidth: '1000px', // 稍微减小最大宽度
    margin: '0 auto',
    padding: '16px', // 减少内边距
    gap: '16px', // 减少间距
    overflow: 'hidden', // 防止内容溢出
  },

  // 上半部分 - 标题区域
  header: {
    textAlign: 'center',
    padding: '12px 0', // 减少内边距
    borderBottom: '1px solid var(--colorNeutralStroke2)',
    flexShrink: 0, // 防止压缩
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    fontSize: '36px', // 减小图标尺寸
    color: 'var(--colorBrandBackground)',
    marginBottom: '8px', // 减少间距
  },
  title: {
    marginBottom: '4px', // 减少间距
    color: 'var(--colorNeutralForeground1)',
    fontSize: '24px', // 稍微减小标题字体
    fontWeight: 'bold',
    textAlign: 'center',
    flexGrow: 1,
    
  },
  subtitle: {
    color: 'var(--colorNeutralForeground2)',
    maxWidth: '600px',
    margin: '0 auto',
    fontSize: '20px', // 减小字体
    lineHeight: '1.4', // 减少行高
    textAlign: 'center',
    padding: '16px 16px',
    
  },

  // 下半部分 - 上下两部分布局
  mainContent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '20px', // 减少间距
    minHeight: '0',
    overflow: 'hidden',
  },

  // 上部分 - 激活方法说明
  topSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px', // 减少间距
    overflow: 'auto', // 允许滚动
  },

  // 下部分 - 激活功能区域
  bottomSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px', // 减少间距
  },

  // 左侧卡片样式
  infoCard: {
    padding: '8px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },

  qrCodeSection: {
    textAlign: 'center',
    padding: '8px',
  },

  qrCodeImage: {
    width: '200px', // 减小二维码尺寸
    height: '200px',
    borderRadius: '8px', // 减小圆角
    border: '1px solid var(--colorNeutralStroke2)', // 减小边框
    marginBottom: '8px', // 减少间距
  },

  stepsList: {
    paddingLeft: '0',
    listStyle: 'none',
    margin: '6px 0',
    '& li': {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px', // 减少间距
      margin: '6px 0', // 减少间距
      padding: '8px', // 减少内边距
      backgroundColor: 'var(--colorNeutralBackground2)',
      borderRadius: '6px', // 减小圆角
      border: '1px solid var(--colorNeutralStroke3)',
    },
  },

  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px', // 减小尺寸
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'var(--colorBrandBackground)',
    color: 'white',
    fontSize: '11px', // 减小字体
    fontWeight: '600',
    flexShrink: 0,
  },

  stepText: {
    flex: 1,
    color: 'var(--colorNeutralForeground1)',
    lineHeight: '1.3', // 减少行高
    fontSize: '16px', // 减小字体
    maxWidth: '80%',
  },

  helpList: {
    paddingLeft: '0',
    listStyle: 'none',
    margin: '8px 0', // 减少间距
    '& li': {
      display: 'flex',
      alignItems: 'center',
      gap: '6px', // 减少间距
      margin: '4px 0', // 减少间距
      color: 'var(--colorNeutralForeground2)',
      fontSize: '13px', // 减小字体
      '&::before': {
        content: '"•"',
        color: 'var(--colorBrandBackground)',
        fontWeight: 'bold',
        fontSize: '14px', // 减小字体
      },
    },
  },

  // 右侧激活区域样式
  activationCard: {
    padding: '20px', // 减少内边距
    backgroundColor: 'var(--colorNeutralBackground1)',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px', // 减小圆角
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)', // 减小阴影
  },

  activationInput: {
    fontFamily: 'monospace',
    fontSize: '16px',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  validateButton: {
    alignSelf: 'center',
    minWidth: '120px',
  },

  statusCard: {
    padding: '12px', // 减少内边距
    textAlign: 'center',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '6px', // 减小圆角
    marginTop: '12px', // 减少间距
  },

  statusSuccess: {
    borderTopColor: 'var(--colorPaletteGreenBorder2)',
    borderRightColor: 'var(--colorPaletteGreenBorder2)',
    borderBottomColor: 'var(--colorPaletteGreenBorder2)',
    borderLeftColor: 'var(--colorPaletteGreenBorder2)',
    backgroundColor: 'var(--colorPaletteGreenBackground2)',
  },

  statusError: {
    borderTopColor: 'var(--colorPaletteRedBorder2)',
    borderRightColor: 'var(--colorPaletteRedBorder2)',
    borderBottomColor: 'var(--colorPaletteRedBorder2)',
    borderLeftColor: 'var(--colorPaletteRedBorder2)',
    backgroundColor: 'var(--colorPaletteRedBackground2)',
  },

  statusIcon: {
    fontSize: '20px',
    marginRight: '8px',
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px', // 减少间距
    marginBottom: '10px', // 减少间距
    color: 'var(--colorNeutralForeground1)',
    fontSize: '16px', // 减小字体
  },

  sectionIcon: {
    fontSize: '16px', // 减小图标尺寸
    color: 'var(--colorBrandBackground)',
  },
});

interface ActivationPageProps {
  onSuccess?: (activationStatus: any) => void;
  onError?: (error: string) => void;
  onSkip?: () => void;
}

const ActivationPage: React.FC<ActivationPageProps> = ({
  onSuccess,
  onError,
  onSkip
}) => {
  const styles = useStyles();
  const {
    activationCode,
    activationStatus,
    isLoading,
    error,
    setActivationCode,
    setActivationStatus,
    setLoading,
    setError,
  } = useWelcomeStore();

  // 添加其他状态管理
  const { setActivated, setConfig } = useAppConfigStore();
  const {
    updateUserSettings,
    setActivationStatus: setStartupActivationStatus,
    setActivationVerified
  } = useStartupFlowStore();

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // 处理激活码输入
  const handleActivationCodeChange = (value: string) => {
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setActivationCode(formattedValue);
    
    // 清除之前的验证结果
    if (validationResult) {
      setValidationResult(null);
    }
    
    // 清除错误状态
    if (error) {
      setError(null);
    }
  };

  // 执行激活
  const handleActivate = async () => {
    if (!activationCode.trim()) {
      setError('请输入激活码');
      return;
    }

    setLoading(true);
    setActivationStatus(ActivationStatus.ACTIVATING);
    setValidationResult({
      isValid: true,
      message: '正在验证激活码，请稍候...',
    });

    try {
      // 使用激活服务
      const response = await activationService.activateApplication({
        activationCode: activationCode.trim(),
        userConfig: {
          username: 'ADMT用户',
          language: 'zh-CN',
          theme: 'light',
          autoStart: false,
          checkUpdates: true,
          enableTelemetry: false,
        },
        deviceInfo: {
          platform: 'Windows',
          version: '1.0.0',
          deviceId: 'device-' + Date.now(),
        },
      });

      if (response.success) {
        // 更新欢迎页面状态
        setActivationStatus(ActivationStatus.ACTIVATED);
        setValidationResult({
          isValid: true,
          message: response.message || '激活成功！',
          details: response.features ? `已激活功能: ${response.features.join(', ')}` : undefined,
        });
        setError(null);

        // 更新应用配置状态，优先使用API验证的过期时间
        let expiryDate: Date | undefined;
        if (response.apiValidation?.expiresAt) {
          expiryDate = new Date(response.apiValidation.expiresAt);
          console.log('ActivationPage: 使用API验证过期时间:', response.apiValidation.expiresAt);
        } else if (response.expiryDate) {
          expiryDate = new Date(response.expiryDate);
          console.log('ActivationPage: 使用响应过期时间:', response.expiryDate);
        }

        setActivated(true);
        setConfig({
          isActivated: true,
          activationStatus: ActivationStatus.ACTIVATED,
          activationDate: new Date(),
          expiryDate,
          features: response.features || [],
          userConfig: {
            username: 'ADMT用户',
            language: 'zh-CN',
            theme: 'light',
            autoStart: false,
            checkUpdates: true,
            enableTelemetry: false,
          },
        });

        // 更新启动流程状态
        updateUserSettings({ isFirstLaunch: false });
        setStartupActivationStatus({
          isValid: true,
          isActivated: true,
          code: activationCode.trim(),
          expiresAt: response.expiryDate ? new Date(response.expiryDate).toISOString() : undefined,
          activatedAt: new Date().toISOString(),
          remainingDays: response.expiryDate ?
            Math.ceil((new Date(response.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
            undefined,
        });
        setActivationVerified(true);

        console.log('✅ 激活状态已同步到所有状态管理器');

        // 调用成功回调
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
        setValidationResult({
          isValid: false,
          message: response.message || '激活失败',
        });
        setError(response.message || '激活失败，请检查激活码是否正确');

        // 不调用错误回调，避免触发上层的错误处理导致页面跳转或应用退出
        // 错误信息已经在当前页面显示，用户可以重试
        console.log('❌ 激活失败，错误信息已在页面显示，用户可重试');
      }
    } catch (error) {
      console.error('激活过程中发生错误:', error);
      setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
      setValidationResult({
        isValid: false,
        message: '激活失败',
        details: error instanceof Error ? error.message : '未知错误'
      });
      const errorMessage = error instanceof Error ? error.message : '网络错误，请稍后重试';
      setError(errorMessage);

      // 不调用错误回调，避免触发上层的错误处理导致页面跳转或应用退出
      // 错误信息已经在当前页面显示，用户可以重试
      console.log('❌ 激活过程中发生错误，错误信息已在页面显示，用户可重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理重试
  const handleRetry = () => {
    setActivationStatus(ActivationStatus.NOT_ACTIVATED);
    setValidationResult(null);
    setError(null);
    setActivationCode('');
  };

  return (
    <div className={styles.container}>
      {/* 上半部分 - 页面标题区域 */}
      <div className={styles.header}>
        <Title1 className={styles.title}>
          激活玩机管家 -目前您还未激活/已过期，请按照步骤进行激活
        </Title1>

      </div>

      {/* 下半部分 - 上下两部分布局 */}
      <div className={styles.mainContent}>
        {/* 上部分 - 激活方法说明和帮助信息 */}
        <div className={styles.topSection}>
          {/* 激活步骤说明 */}
          <Card className={styles.infoCard}>
          <Body1 className={styles.subtitle}>
        为了更好的维护和开发,也为了防范泛滥的盗卖，我们使用激活码来控制使用，激活码获取方式完全免费
      </Body1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img
                src="/wxgzh-qr.jpg"
                alt="公众号二维码"
                className={styles.qrCodeImage}
              />
                <img
                src="/wxgzh-step2.jpg"
                alt="公众号二维码2"
                className={styles.Image}
              />
              <div style={{ flex: 1 }}>
                <ol className={styles.stepsList}>
                  <li>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepText}>
                      扫描二维码关注公众号
                    </div>
                  </li>
                  <li>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepText}>
                      点击菜单的"领创账号"，再点击"ADMT激活码"
                    </div>
                  </li>
                  <li>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepText}>
                      根据提示获取激活码并在下方输入
                    </div>
                  </li>
                </ol>
                </div>
              </div>

            </div>
          </Card>

        </div>

        {/* 下部分 - 激活功能区域 */}
        <div className={styles.bottomSection}>
          <Card className={styles.activationCard}>
            <Field label="激活码" validationMessage={error}>
              <Input
                className={styles.activationInput}
                value={activationCode}
                onChange={(e) => handleActivationCodeChange(e.target.value)}
                placeholder="请输入激活码"
              />
            </Field>
            <Button
              className={styles.validateButton}
              onClick={handleActivate}
              disabled={isLoading}
              appearance="primary"
            >
              {isLoading ? <Spinner /> : '验证激活码'}
            </Button>
            {validationResult && (
              <Card
                className={styles.statusCard}
                style={{
                  backgroundColor: validationResult.isValid
                    ? 'var(--colorPaletteGreenBackground2)'
                    : 'var(--colorPaletteRedBackground2)',
                  borderColor: validationResult.isValid
                    ? 'var(--colorPaletteGreenBorder2)'
                    : 'var(--colorPaletteRedBorder2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {validationResult.isValid ? (
                    <Checkmark24Regular className={styles.statusIcon} />
                  ) : (
                    <Dismiss24Regular className={styles.statusIcon} />
                  )}
                  <div>{validationResult.message}</div>
                </div>
                {validationResult.details && (
                  <Caption1>{validationResult.details}</Caption1>
                )}
              </Card>
            )}
            {error && (
              <div style={{ marginTop: '16px' }}>
                <MessageBar intent="error" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>激活失败</div>
                    <div>{error}</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      请检查激活码是否正确，或检查网络连接后重试
                    </div>
                  </div>
                </MessageBar>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button
                    className={styles.validateButton}
                    onClick={handleRetry}
                    appearance="primary"
                    style={{ flex: 1 }}
                  >
                    清空重试
                  </Button>
                  <Button
                    className={styles.validateButton}
                    onClick={handleActivate}
                    appearance="secondary"
                    disabled={!activationCode.trim() || isLoading}
                    style={{ flex: 1 }}
                  >
                    重新验证
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;
