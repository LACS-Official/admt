/**
 * 第4页：激活码验证页面
 * 用户输入激活码并进行验证
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Badge,
  MessageBar,
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  Warning24Filled,
} from '@fluentui/react-icons';
import { useWelcomeStore, useAppConfigStore } from '../../stores/welcomeStore';
import { useStartupFlowStore } from '../../stores/startupFlowStore';
import { activationService } from '../../services/activationService';
import { apiErrorHandler } from '../../services/errorHandlerService';
import { ActivationStatus } from '../../types/welcome';

const useStyles = makeStyles({
  Image: { 
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '8px',
    maxHeight: '500px',
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
    minWidth: '500px',
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
    fontSize: '28px', // 稍微减小标题字体
    fontWeight: 'bold',
    textAlign: 'center',
    flexGrow: 1,
    letterSpacing: '5px', // 增加每个字的横向间距
  },
  subtitle: {
    color: 'var(--colorNeutralForeground2)',
    maxWidth: '900px',
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
    alignItems: 'center',
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
    minWidth: '880px',
    maxHeight: '150px',
  },

  activationInput: {
    fontFamily: 'monospace',
    fontSize: '20px',
    textAlign: 'center',
  },

  // 激活码输入框容器
  activationCodeContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    margin: '16px 0',
    flexWrap: 'wrap',
    minWidth: '400px',
  },

  // 单个激活码输入框
  activationCodeInput: {
    width: '50px',
    height: '60px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    borderRadius: '8px',
    border: '2px solid var(--colorNeutralStroke2)',
    backgroundColor: 'var(--colorNeutralBackground1)',
    color: 'var(--colorNeutralForeground1)',
    '&:focus': {
      border: '2px solid var(--colorBrandStroke1)',
      outline: 'none',
    },
    '&::placeholder': {
      color: 'var(--colorNeutralForeground4)',
    },
    '@media (max-width: 768px)': {
      width: '35px',
      height: '45px',
      fontSize: '18px',
    },
  },

  validateButton: {
    alignSelf: 'center',
    minWidth: '120px',
    minHeight:'60px',
    whiteSpace: 'nowrap',
    borderRadius: '8px',
    //居右显示
    justifyContent: 'flex-end',
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
  
  // 错误处理状态
  const [retryCount, setRetryCount] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

  // 防抖和重复输入控制
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInputValueRef = useRef<string[]>(new Array(8).fill(''));
  const isProcessingInputRef = useRef(false);

  // 清除自动保存的输入内容
  useEffect(() => {
    // 设置错误处理服务的倒计时回调
    apiErrorHandler.setCountdownCallback((seconds: number) => {
      setExitCountdown(seconds);
      if (seconds > 0) {
        setIsExiting(true);
        setDialogContent({
          title: "激活失败",
          message: `激活验证失败，应用将在 ${seconds} 秒后退出`,
          type: "error",
          details: "多次尝试失败，请检查激活码或网络连接"
        });
        setShowResultDialog(true);
      }
    });
    
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
      // 取消计划的退出
      apiErrorHandler.cancelScheduledExit();
      // 清理防抖定时器
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
      // 重置处理标志
      isProcessingInputRef.current = false;
    };
  }, [setActivationCode]);

  // 处理激活码输入 - 优化版本
  const handleActivationCodeChange = useCallback((value: string, index: number) => {
    // 防止并发处理
    if (isProcessingInputRef.current) {
      return;
    }
    
    isProcessingInputRef.current = true;
    
    try {
      // 过滤非字母数字字符，并将小写字母转换为大写
      const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      
      // 如果没有有效字符，直接返回
      if (!sanitizedValue) {
        isProcessingInputRef.current = false;
        return;
      }
      
      // 获取第一个字符（我们只处理一个字符的输入）
      const char = sanitizedValue[0];
      
      // 更新激活码状态
      const newCode = activationCode.split('');
      newCode[index] = char;
      const formattedValue = newCode.join('');
      
      setActivationCode(formattedValue);
      
      // 自动聚焦到下一个输入框
      if (index < 7) {
        setTimeout(() => {
          const nextInput = document.getElementById(`activation-code-${index + 1}`);
          if (nextInput) {
            (nextInput as HTMLInputElement).focus();
          }
        }, 10);
      }
      
      // 清除之前的验证结果和错误
      if (validationResult) {
        setValidationResult(null);
      }
      if (error) {
        setError(null);
      }
    } finally {
      // 重置处理标志
      setTimeout(() => {
        isProcessingInputRef.current = false;
      }, 50);
    }
  }, [activationCode, validationResult, error, setActivationCode, setValidationResult, setError]);

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    
    if (pastedData) {
      setActivationCode(pastedData.padEnd(8, ' ').slice(0, 8));
      
      // 填充所有输入框
      for (let i = 0; i < 8; i++) {
        const input = document.getElementById(`activation-code-${i}`);
        if (input) {
          (input as HTMLInputElement).value = i < pastedData.length ? pastedData[i] : '';
        }
      }
      
      // 聚焦到最后一个输入框
      setTimeout(() => {
        const focusIndex = Math.min(pastedData.length, 7);
        const nextInput = document.getElementById(`activation-code-${focusIndex}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }, 10);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // 允许的按键：字母、数字、退格、删除、Tab、方向键等
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    
    // 检查是否是字母或数字
    const isAlphaNumeric = /^[A-Za-z0-9]$/.test(e.key);
    
    // 如果不是允许的按键且不是字母数字，阻止输入
    if (!allowedKeys.includes(e.key) && !isAlphaNumeric) {
      e.preventDefault();
      return;
    }
    
    // 处理退格键逻辑
    if (e.key === 'Backspace') {
      e.preventDefault();
      // 如果当前输入框有内容，清空当前输入框
      if (activationCode[index]) {
        const newCode = activationCode.split('');
        newCode[index] = '';
        setActivationCode(newCode.join(''));
      } 
      // 如果当前输入框为空且不是第一个输入框，聚焦到前一个输入框
      else if (index > 0) {
        const prevInput = document.getElementById(`activation-code-${index - 1}`);
        if (prevInput) {
          (prevInput as HTMLInputElement).focus();
          // 清空前一个输入框的内容
          const newCode = activationCode.split('');
          newCode[index - 1] = '';
          setActivationCode(newCode.join(''));
        }
      }
    }
    
    // 处理删除键逻辑
    if (e.key === 'Delete') {
      e.preventDefault();
      // 清除当前及后续位置的字符
      const newCode = activationCode.split('');
      for (let i = index; i < 8; i++) {
        newCode[i] = '';
      }
      setActivationCode(newCode.join(''));
    }
  };

  // 处理输入框点击事件，自动选中内容
  const handleInputClick = (index: number) => {
    const input = document.getElementById(`activation-code-${index}`) as HTMLInputElement;
    if (input) {
      input.select();
    }
  };

  // 执行激活
  const handleActivate = async (currentRetryCount: number = 0) => {
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
    setRetryCount(currentRetryCount);

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
        // 重置重试计数器
        apiErrorHandler.resetRetryCounters();
        setRetryCount(0);
        setIsAutoRetrying(false);
        
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
          features: [],
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
          details: undefined
        });
        setShowResultDialog(true);

        // 调用成功回调
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        // 激活失败，使用错误处理服务
        const error = new Error(response.message || '激活失败');
        await handleActivationError(error, currentRetryCount);
      }
    } catch (error) {
      console.error('激活过程中发生错误:', error);
      await handleActivationError(error as Error, currentRetryCount);
    } finally {
      setLoading(false);
    }
  };
  
  // 按钮点击处理器
  const handleActivateClick = () => {
    handleActivate(0);
  };
  
  // 处理激活错误
  const handleActivationError = async (error: Error, currentRetryCount: number): Promise<void> => {
    try {
      const handlingResult = await apiErrorHandler.handleActivationError(error);
      
      setRetryCount(apiErrorHandler.getRetryStatus().activationCount);
      setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
      setError(handlingResult.userMessage);
      
      if (handlingResult.shouldExit) {
        setIsExiting(true);
        // 已由 apiErrorHandler 安排退出，对话框将通过倒计时回调显示
        return;
      }
      
      if (handlingResult.shouldRetry) {
        setIsAutoRetrying(true);
        setError(`${handlingResult.userMessage}，${handlingResult.retryDelay / 1000}秒后重试...`);
        
        setTimeout(async () => {
          try {
            await handleActivate(apiErrorHandler.getRetryStatus().activationCount);
          } catch (retryError) {
            await handleActivationError(retryError as Error, apiErrorHandler.getRetryStatus().activationCount);
          }
        }, handlingResult.retryDelay);
        
        return;
      }
      
      // 不可重试的错误，显示错误弹窗
      setDialogContent({
        title: "激活失败",
        message: handlingResult.userMessage,
        type: "error",
        details: "请检查激活码是否正确，或检查网络连接后重试"
      });
      setShowResultDialog(true);
      
    } catch (handlerError) {
      console.error('错误处理器失败:', handlerError);
      
      // 降级处理
      setActivationStatus(ActivationStatus.ACTIVATION_FAILED);
      const errorMessage = error?.message || '网络错误，请稍后重试';
      setError(errorMessage);

      // 显示错误弹窗
      setDialogContent({
        title: "激活失败",
        message: "网络错误，请稍后重试",
        type: "error",
        details: errorMessage
      });
      setShowResultDialog(true);
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
    handleActivate(0);
  };

  return (
    <div className={styles.container}>
      {/* 下半部分 - 上下两部分布局 */}
      <div className={styles.mainContent}>
        {/* 上部分 - 激活方法说明和帮助信息 */}
        <div className={styles.topSection}>
          {/* 激活步骤说明 */}
            <img
                src="/jhm.webp"
                alt="激活码获取方式"
                className={styles.Image}
              />

        </div>

        {/* 下部分 - 激活功能区域 */}
        <div className={styles.bottomSection}>
          <Card className={styles.activationCard}>
            <Field  validationMessage={error}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center',borderRadius: '8px' }}>
                <div className={styles.activationCodeContainer}>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <input
                      key={index}
                      id={`activation-code-${index}`}
                      className={styles.activationCodeInput}
                      value={activationCode[index] || ''}
                      onChange={(e) => {
                        handleActivationCodeChange(e.target.value, index);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={(e) => handlePaste(e, index)}
                      onClick={() => handleInputClick(index)}
                      onFocus={(e) => {
                        // 聚焦时选中所有内容，便于替换
                        e.target.select();
                      }}
                      maxLength={1}
                      placeholder={index === 0 ? "请" : 
                                 index === 1 ? "在" : 
                                 index === 2 ? "此" : 
                                 index === 3 ? "输" : 
                                 index === 4 ? "入" : 
                                 index === 5 ? "激" : 
                                 index === 6 ? "活" : 
                                 "码"}
                      // 防止浏览器自动保存和自动填充
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      inputMode="text"
                      pattern="[A-Z0-9]*"
                      data-form-type="other"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      name={`temp-activation-${index}-${Math.random().toString(36).substr(2, 9)}`}
                    />
                  ))}
                </div>
                <Button
                  className={styles.validateButton}
                  onClick={handleActivateClick}
                  disabled={isLoading || isAutoRetrying || isExiting}
                  appearance="primary"
                  size='large'
                  style={{ flexShrink: 0 }}
                >
                  {isLoading ? (
                    <>
                      <Spinner size="tiny" style={{ marginRight: '4px' }} /> 
                      验证中...
                    </>
                  ) : isAutoRetrying ? (
                    <>
                      <Spinner size="tiny" style={{ marginRight: '4px' }} /> 
                      自动重试中...
                    </>
                  ) : isExiting ? (
                    '正在退出...'
                  ) : (
                    '验证激活码'
                  )}
                </Button>
              </div>
            </Field>
            
            {/* 重试状态显示 */}
            {(retryCount > 0 || isAutoRetrying) && (
              <MessageBar
                intent={isAutoRetrying ? "info" : "warning"}
                style={{ marginTop: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAutoRetrying && <Spinner size="tiny" />}
                  <Text size={200}>
                    {isAutoRetrying 
                      ? `正在自动重试激活验证... (${retryCount}/3)` 
                      : `激活验证已重试 ${retryCount} 次`
                    }
                  </Text>
                </div>
              </MessageBar>
            )}
            
            {/* 退出倒计时显示 */}
            {isExiting && exitCountdown > 0 && (
              <MessageBar
                intent="error"                                              
                style={{ marginTop: '12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Warning24Filled style={{ color: 'var(--colorPaletteRedForeground1)' }} />
                  <Text size={200}>
                    激活验证失败，应用将在 {exitCountdown} 秒后自动退出
                  </Text>
                </div>
              </MessageBar>
            )}
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
                  {!isExiting ? (
                    <>
                      <Button
                        appearance="secondary"
                        onClick={handleDialogRetry}
                        disabled={isAutoRetrying}
                      >
                        清空重试
                      </Button>
                      <Button
                        appearance="primary"
                        onClick={handleDialogRevalidate}
                        disabled={!activationCode.trim() || isLoading || isAutoRetrying}
                      >
                        {isAutoRetrying ? (
                          <>
                            <Spinner size="tiny" style={{ marginRight: '4px' }} />
                            自动重试中...
                          </>
                        ) : (
                          '重新验证'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      appearance="primary"
                      disabled
                    >
                      {exitCountdown > 0 ? `${exitCountdown}秒后退出` : '正在退出...'}
                    </Button>
                  )}
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