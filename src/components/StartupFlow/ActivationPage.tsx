/**
 * 第4页：激活码验证页面
 * 用户输入激活码并进行验证
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Title1,
  Body1,
  Card,
  Field,
  Button,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { useWelcomeStore, useAppConfigStore } from '../../stores/welcomeStore';
import { useStartupFlowStore } from '../../stores/startupFlowStore';
import { activationService } from '../../services/activationService';
import { ActivationStatus } from '../../types/welcome';

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
    padding: '16px', // 减少内边角距
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

  // 激活码输入框容器
  activationCodeContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    margin: '16px 0',
  },

  // 单个激活码输入框
  activationCodeInput: {
    width: '40px',
    height: '50px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    borderRadius: '8px',
    border: '2px solid var(--colorNeutralStroke2)',
    textTransform: 'uppercase',
    backgroundColor: 'var(--colorNeutralBackground1)',
    color: 'var(--colorNeutralForeground1)',
    '&:focus': {
      border: '2px solid var(--colorBrandStroke1)',
      outline: 'none',
    },
    '&::placeholder': {
      color: 'var(--colorNeutralForeground4)',
    }
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

}) => {
  const styles = useStyles();
  const {
    activationCode,
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
  
  // 控制弹窗显示的状态
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    details?: string;
  } | null>(null);

  // 清除自动保存的输入内容
  useEffect(() => {
    // 页面加载时清空所有激活码输入框
    const clearInputs = () => {
      for (let i = 0; i < 8; i++) {
        const input = document.getElementById(`activation-code-${i}`) as HTMLInputElement;
        if (input) {
          input.value = '';
          input.defaultValue = '';
        }
      }
    };

    // 立即清空
    clearInputs();

    // 清除可能的本地存储数据
    try {
      // 清除localStorage中可能的激活码相关数据
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('activation') || key.includes('code'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 清除sessionStorage中可能的激活码相关数据
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('activation') || key.includes('code'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      console.log('清除存储数据时出错:', e);
    }

    // 页面卸载时清理
    const handleBeforeUnload = () => {
      clearInputs();
      // 清空状态管理中的激活码
      setActivationCode('');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 组件卸载时清空激活码
      setActivationCode('');
    };
  }, [setActivationCode]);

  // 处理激活码输入
  const handleActivationCodeChange = (value: string, index?: number) => {
    // 清除输入框的自动保存属性
    if (index !== undefined) {
      const input = document.getElementById(`activation-code-${index}`) as HTMLInputElement;
      if (input) {
        // 重新设置随机name属性防止浏览器记忆
        input.name = `temp-activation-${index}-${Math.random().toString(36).substr(2, 9)}`;
        // 确保不会被自动保存
        input.setAttribute('autocomplete', 'new-password');
      }
    }

    // 如果是通过单个输入框输入
    if (index !== undefined) {
      const newCode = activationCode.split('');
      newCode[index] = value.toUpperCase();
      const formattedValue = newCode.join('').slice(0, 8);
      setActivationCode(formattedValue);
      
      // 自动聚焦到下一个输入框
      if (value && index < 7) {
        const nextInput = document.getElementById(`activation-code-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    } else {
      // 如果是通过粘贴或其他方式输入
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      setActivationCode(formattedValue);
      
      // 聚焦到最后一个非空输入框或第一个空输入框
      const length = formattedValue.length;
      if (length > 0 && length < 8) {
        const nextInput = document.getElementById(`activation-code-${length}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      } else if (length === 8) {
        const lastInput = document.getElementById(`activation-code-7`);
        if (lastInput) {
          (lastInput as HTMLInputElement).focus();
        }
      }
    }
    
    // 清除之前的验证结果
    if (validationResult) {
      setValidationResult(null);
    }
    
    // 清除错误状态
    if (error) {
      setError(null);
    }

    // 防止浏览器保存输入历史
    setTimeout(() => {
      // 清除所有输入框的可能缓存
      for (let i = 0; i < 8; i++) {
        const input = document.getElementById(`activation-code-${i}`) as HTMLInputElement;
        if (input) {
          input.setAttribute('autocomplete', 'new-password');
          input.name = `temp-activation-${i}-${Math.random().toString(36).substr(2, 9)}`;
        }
      }
    }, 100);
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, _index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    
    if (pastedData) {
      setActivationCode(pastedData);
      
      // 填充所有输入框
      for (let i = 0; i < Math.min(pastedData.length, 8); i++) {
        const input = document.getElementById(`activation-code-${i}`);
        if (input) {
          (input as HTMLInputElement).value = pastedData[i];
        }
      }
      
      // 聚焦到最后一个输入框或最后一个字符位置
      if (pastedData.length >= 8) {
        const lastInput = document.getElementById(`activation-code-7`);
        if (lastInput) {
          (lastInput as HTMLInputElement).focus();
        }
      } else {
        const nextInput = document.getElementById(`activation-code-${pastedData.length}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !activationCode[index] && index > 0) {
      const prevInput = document.getElementById(`activation-code-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  // 执行激活
  const handleActivate = async () => {
    if (!activationCode.trim()) {
      // 显示错误弹窗
      setDialogContent({
        title: "激活失败",
        message: "请输入激活码",
        type: "error",
        details: "请检查激活码是否正确，或检查网络连接后重试"
      });
      setShowResultDialog(true);
      return;
    }

    setLoading(true);
    setActivationStatus(ActivationStatus.ACTIVATING);

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

        // 显示成功弹窗
        setDialogContent({
          title: "激活成功",
          message: response.message || '激活成功！',
          type: "success",
          details: response.features ? `已激活功能: ${response.features.join(', ')}` : undefined
        });
        setShowResultDialog(true);

        // 调用成功回调
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
        setError(response.message || '激活失败，请检查激活码是否正确');

        // 显示失败弹窗
        setDialogContent({
          title: "激活失败",
          message: response.message || '激活失败',
          type: "error",
          details: "请检查激活码是否正确，或检查网络连接后重试"
        });
        setShowResultDialog(true);

        // 不调用错误回调，避免触发上层的错误处理导致页面跳转或应用退出
        // 错误信息已经在当前页面显示，用户可以重试
        console.log('❌ 激活失败，错误信息已在页面显示，用户可重试');
      }
    } catch (error) {
      console.error('激活过程中发生错误:', error);
      setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
      const errorMessage = error instanceof Error ? error.message : '网络错误，请稍后重试';
      setError(errorMessage);

      // 显示错误弹窗
      setDialogContent({
        title: "激活失败",
        message: "网络错误，请稍后重试",
        type: "error",
        details: error instanceof Error ? error.message : '未知错误'
      });
      setShowResultDialog(true);

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

  // 关闭弹窗
  const handleCloseDialog = () => {
    setShowResultDialog(false);
    setDialogContent(null);
  };

  // 处理弹窗中的重试操作
  const handleDialogRetry = () => {
    setShowResultDialog(false);
    setDialogContent(null);
    handleRetry();
  };

  // 处理弹窗中的重新验证操作
  const handleDialogRevalidate = () => {
    setShowResultDialog(false);
    setDialogContent(null);
    handleActivate();
  };

  return (
    <div className={styles.container}>
      {/* 上半部分 - 页面标题区域 */}
      <div className={styles.header}>
        <Title1 className={styles.title}>
          目前您还未激活/已过期，请按照步骤进行激活
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
              <div className={styles.activationCodeContainer}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <input
                    key={index}
                    id={`activation-code-${index}`}
                    className={styles.activationCodeInput}
                    value={activationCode[index] || ''}
                    onChange={(e) => handleActivationCodeChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={(e) => handlePaste(e, index)}
                    maxLength={1}
                    placeholder={index === 0 ? "A" : 
                               index === 1 ? "B" : 
                               index === 2 ? "C" : 
                               index === 3 ? "1" : 
                               index === 4 ? "2" : 
                               index === 5 ? "D" : 
                               index === 6 ? "3" : 
                               "4"}
                    // 防止浏览器自动保存和自动填充
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    name={`temp-activation-${index}-${Math.random().toString(36).substr(2, 9)}`}
                  />
                ))}
              </div>
            </Field>
            <Button
              className={styles.validateButton}
              onClick={handleActivate}
              disabled={isLoading}
              appearance="primary"
            >
              {isLoading ? <Spinner /> : '验证激活码'}
            </Button>
          </Card>
        </div>
      </div>

      {/* 结果弹窗 */}
      <Dialog open={showResultDialog} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {dialogContent?.type === 'success' ? (
                  <Checkmark24Regular style={{ color: 'var(--colorPaletteGreenForeground1)' }} />
                ) : (
                  <Dismiss24Regular style={{ color: 'var(--colorPaletteRedForeground1)' }} />
                )}
                {dialogContent?.title}
              </div>
            </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Text>{dialogContent?.message}</Text>
                {dialogContent?.details && (
                  <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                    {dialogContent.details}
                  </Text>
                )}
                {dialogContent?.type === 'error' && (
                  <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                    请检查激活码是否正确，或检查网络连接后重试
                  </Text>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              {dialogContent?.type === 'error' ? (
                <>
                  <Button
                    appearance="secondary"
                    onClick={handleDialogRetry}
                  >
                    清空重试
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={handleDialogRevalidate}
                    disabled={!activationCode.trim() || isLoading}
                  >
                    重新验证
                  </Button>
                </>
              ) : (
                <Button
                  appearance="primary"
                  onClick={handleCloseDialog}
                >
                  确定
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ActivationPage;