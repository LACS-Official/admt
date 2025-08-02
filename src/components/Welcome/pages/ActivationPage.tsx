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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '600px',
    margin: '0 auto',
    height: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
    color: 'var(--colorBrandBackground)',
    marginBottom: '16px',
  },
  title: {
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--colorNeutralForeground2)',
    maxWidth: '500px',
    margin: '0 auto',
  },
  activationForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputCard: {
    padding: '32px',
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
    padding: '20px',
    textAlign: 'center',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  statusSuccess: {
    borderColor: 'var(--colorPaletteGreenBorder1)',
    backgroundColor: 'var(--colorPaletteGreenBackground1)',
  },
  statusError: {
    borderColor: 'var(--colorPaletteRedBorder1)',
    backgroundColor: 'var(--colorPaletteRedBackground1)',
  },
  statusIcon: {
    fontSize: '20px',
    marginRight: '8px',
  },
  helpSection: {
    padding: '20px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  helpList: {
    paddingLeft: '20px',
    margin: '12px 0',
    '& li': {
      margin: '8px 0',
      color: 'var(--colorNeutralForeground2)',
    },
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
    setActivationStatus('activating');
    setValidationResult({
      isValid: true,
      message: '正在验证激活码，请稍候...',
    });

    try {
      // 使用激活服务
      const response = await activationService.activateApplication({
        activationCode: activationCode.trim(),
        userConfig: {
          username: 'HOUT用户',
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
        setActivationStatus('activated');
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
            username: 'HOUT用户',
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
        setActivationStatus('activation_failed');
        setValidationResult({
          isValid: false,
          message: response.message || '激活失败',
        });
        setError(response.message || '激活失败，请检查激活码是否正确');

        // 调用错误回调
        if (onError) {
          onError(response.message || '激活失败，请检查激活码是否正确');
        }
      }
    } catch (error) {
      console.error('激活过程中发生错误:', error);
      setActivationStatus('activation_failed');
      setValidationResult({
        isValid: false,
        message: '激活失败',
      });
      const errorMessage = error instanceof Error ? error.message : '网络错误，请稍后重试';
      setError(errorMessage);

      // 调用错误回调
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理重试
  const handleRetry = () => {
    setActivationStatus('not_activated');
    setValidationResult(null);
    setError(null);
    setActivationCode('');
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <Key24Regular className={styles.icon} />
        <Title1 className={styles.title}>
          激活玩机管家
        </Title1>
        <Body1 className={styles.subtitle}>
          请输入您的激活码以解锁完整功能。激活码通常由数字、字母和连字符组成。
        </Body1>
      </div>

      {/* 激活表单 */}
      <div className={styles.activationForm}>
        <Card className={styles.inputCard}>
          <Field
            label="激活码"
            hint="格式示例：ABC123-DEF456-GHI789"
            validationMessage={error || undefined}
            validationState={error ? 'error' : 'none'}
          >
            <Input
              className={styles.activationInput}
              value={activationCode}
              onChange={(_, data) => handleActivationCodeChange(data.value)}
              placeholder="请输入激活码"
              disabled={isLoading || activationStatus === 'activated'}
              size="large"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
            />
          </Field>

          {/* 验证结果 */}
          {validationResult && (
            <Card className={`${styles.statusCard} ${validationResult.isValid ? styles.statusSuccess : styles.statusError}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {validationResult.isValid ? (
                  <Checkmark24Regular className={styles.statusIcon} style={{ color: 'var(--colorPaletteGreenForeground1)' }} />
                ) : (
                  <Dismiss24Regular className={styles.statusIcon} style={{ color: 'var(--colorPaletteRedForeground1)' }} />
                )}
                <div style={{ textAlign: 'center' }}>
                  <Text size={400} weight="semibold">
                    {validationResult.message}
                  </Text>
                  {validationResult.details && (
                    <Text size={300} style={{ color: 'var(--colorNeutralForeground2)', marginTop: '4px', display: 'block' }}>
                      {validationResult.details}
                    </Text>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 激活中状态 */}
          {activationStatus === 'activating' && (
            <Card className={styles.statusCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Spinner size="medium" />
                <Text size={400}>
                  正在激活，请稍候...
                </Text>
              </div>
            </Card>
          )}

          {/* 激活按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            {activationStatus === 'activated' ? (
              <Button
                appearance="primary"
                className={styles.validateButton}
                icon={<Checkmark24Regular />}
                disabled
              >
                已激活
              </Button>
            ) : activationStatus === 'activation_failed' ? (
              <>
                <Button
                  appearance="secondary"
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  重新输入
                </Button>
                <Button
                  appearance="primary"
                  className={styles.validateButton}
                  onClick={handleActivate}
                  disabled={!activationCode.trim() || isLoading}
                  icon={isLoading ? <Spinner size="tiny" /> : <Shield24Regular />}
                >
                  重试激活
                </Button>
              </>
            ) : (
              <>
                <Button
                  appearance="secondary"
                  onClick={onSkip}
                  disabled={isLoading}
                >
                  退出应用
                </Button>
                <Button
                  appearance="primary"
                  className={styles.validateButton}
                  onClick={handleActivate}
                  disabled={!activationCode.trim() || isLoading}
                  icon={isLoading ? <Spinner size="tiny" /> : <Shield24Regular />}
                >
                  {isLoading ? '激活中...' : '激活'}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* 帮助信息 */}
        <div className={styles.helpSection}>
          <Title2 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info24Regular style={{ fontSize: '20px' }} />
            激活帮助
          </Title2>
          <Body1 style={{ marginBottom: '12px' }}>
            如果您在激活过程中遇到问题，请检查以下事项：
          </Body1>
          <ul className={styles.helpList}>
            <li>确保激活码输入正确，注意大小写和连字符</li>
            <li>检查网络连接是否正常</li>
            <li>确认激活码未过期且未被使用</li>
            <li>如果问题持续存在，请联系技术支持</li>
          </ul>
          <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
            激活码格式通常为：字母数字-字母数字-字母数字，例如：ABC123-DEF456-GHI789
          </Caption1>
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;
