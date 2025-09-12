/**
 * 启动时版本检查组件
 * 在应用启动时执行版本检查，根据结果显示相应的UI
 */
import React, { useCallback, useEffect, useState, useMemo }  from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  ToastIntent,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Divider
} from '@fluentui/react-components';
import {
  Open24Regular,
  Warning24Regular,
  Checkmark24Regular,
  ArrowClockwise24Regular,
  CheckmarkCircle24Filled,
  ArrowDownload24Regular
} from '@fluentui/react-icons';
import { versionService } from '../../services/versionService';
import { VersionCheckResult } from '../../types/app';

const useStyles = makeStyles({
  dialog: {
    maxWidth: '500px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  versionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  releaseNotes: {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
  errorActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'space-between',
    width: '100%',
  },
  forceUpdateContainer: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXL,
  },
  warningIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteRedForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  successCard: {
    maxWidth: '400px',
    margin: '0 auto',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  successHeader: {
    textAlign: 'center',
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '32px',
  },
  updateCard: {
    margin: `${tokens.spacingVerticalM} 0`,
  },
  updateHeader: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
  },
  updateBody: {
    padding: `0 ${tokens.spacingHorizontalM}`,
  },
  updateFooter: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacingVerticalXL,
  },
  card: {
    maxWidth: '400px',
    width: '100%',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    padding: tokens.spacingVerticalM,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXL,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    textAlign: 'center',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXL,
  },
  downloadLink: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  }
});

interface StartupVersionCheckerProps {
  checkResult?: VersionCheckResult;  // 可选：如果传入则直接使用，不传入则自己执行检查
  onCheckComplete: (needsUpdate: boolean, result?: VersionCheckResult) => void;
  onAllowOfflineUse?: () => void;
}

const StartupVersionChecker: React.FC<StartupVersionCheckerProps> = ({
  checkResult: propCheckResult,
  onCheckComplete,
  onAllowOfflineUse
}) => {
  const styles = useStyles();
  const { dispatchToast } = useToastController();
  
  const [isChecking, setIsChecking] = useState(!propCheckResult);
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(propCheckResult || null);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(!!propCheckResult?.needsUpdate);
  const [retryCount, setRetryCount] = useState(0);

  // 判断是否为关键错误（需要强制退出）
  const isCriticalError = useMemo(() => {
    if (!error) return false;
    
    const criticalErrorPatterns = [
      '无法获取版本信息',
      '签名验证失败',
      '权限不足',
      '服务器内部错误',
      '网络连接失败',
      '系统将自动退出'
    ];
    
    return criticalErrorPatterns.some(pattern => 
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }, [error]);
  const [timeoutReached, setTimeoutReached] = useState(false);

  /**
   * 显示成功提示Toast
   */
  const showSuccessToast = useCallback(() => {
    dispatchToast(
      <Toast>
        <ToastTitle media={<Checkmark24Regular />}>
          当前是最新版本
        </ToastTitle>
        <ToastBody>
          您使用的是最新版本，无需更新
        </ToastBody>
      </Toast>,
      { intent: 'success' as ToastIntent, timeout: 3000 }
    );
  }, [dispatchToast]);

  /**
   * 执行版本检查
   */
  const performVersionCheck = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    setTimeoutReached(false);

    // 设置15秒超时（增加超时时间以适应网络延迟）
    const timeoutId = setTimeout(() => {
      setTimeoutReached(true);
      setIsChecking(false);
      setError('版本检查超时，无法获取版本信息');
    }, 15000);

    try {
      console.log('🚀 开始启动时版本检查...');
      const result = await versionService.forceCheckForUpdates();

      // 清除超时定时器
      clearTimeout(timeoutId);

      if (timeoutReached) {
        return; // 如果已经超时，忽略结果
      }

      console.log('📋 版本检查结果:', result);
      
      // 🚨 检查是否有关键错误（API访问失败等）
      if (result.error && (
        result.error.includes('配置错误') || 
        result.error.includes('无法获取版本信息') ||
        result.error.includes('API响应格式错误') ||
        result.error.includes('网络请求失败')
      )) {
        console.error('🚨 检测到关键错误，版本检查失败:', result.error);
        setError(result.error);
        setShowDialog(true);
        // 不调用 onCheckComplete，让用户看到错误信息
        return;
      }
      
      // 确保结果符合VersionCheckResult接口
      const normalizedResult: VersionCheckResult = {
        hasUpdate: result.hasUpdate || result.needsUpdate,
        needsUpdate: result.needsUpdate,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion || result.currentVersion,
        isForceUpdate: result.isForceUpdate,
        message: result.message || '',
        error: result.error,
        versionInfo: result.versionInfo
      };
      
      setCheckResult(normalizedResult);

      if (normalizedResult.needsUpdate) {
        // 有更新时统一按强制更新处理
        console.log('🆕 发现新版本，需要更新:', normalizedResult.latestVersion);
        setShowDialog(true);
        onCheckComplete(true, normalizedResult);
      } else {
        // 不需要更新，显示成功提示
        console.log('✅ 当前已是最新版本:', normalizedResult.currentVersion);
        showSuccessToast();
        onCheckComplete(false, normalizedResult);
      }

    } catch (error) {
      clearTimeout(timeoutId);

      if (timeoutReached) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '版本检查失败';
      console.error('❌ 版本检查异常:', error);
      
      // 🚨 所有异常都视为关键错误
      const criticalError = `无法获取版本信息: ${errorMessage}`;
      setError(criticalError);
      setShowDialog(true);
      
      // 不调用 onCheckComplete，让用户看到错误信息
    } finally {
      if (!timeoutReached) {
        setIsChecking(false);
      }
    }
  }, [onCheckComplete, showSuccessToast, timeoutReached]);

  /**
   * 处理立即更新 - 跳转到浏览器打开下载页面
   */
  const handleUpdateNow = useCallback(() => {
    // 固定使用指定的下载页面
    const downloadUrl = 'https://admt.lacs.cc/download';

    // 使用 Tauri 的 shell API 打开浏览器
    import('@tauri-apps/plugin-shell').then(({ open }) => {
      open(downloadUrl).catch((error) => {
        console.error('无法打开浏览器:', error);
        // 降级到 window.open
        window.open(downloadUrl, '_blank');
      });
    }).catch(() => {
      // 如果 Tauri shell 插件不可用，使用 window.open
      window.open(downloadUrl, '_blank');
    });

    // 显示成功提示
    dispatchToast(
      <Toast>
        <ToastTitle media={<Open24Regular />}>
          正在打开下载页面
        </ToastTitle>
        <ToastBody>
          请在浏览器中完成下载和安装
        </ToastBody>
      </Toast>,
      { intent: 'success' as ToastIntent }
    );
  }, [dispatchToast]);

  /**
   * 处理重试
   */
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setShowDialog(false);
    performVersionCheck();
  }, [performVersionCheck]);

  /**
   * 处理离线使用 - 在关键错误时不允许离线使用
   */
  const handleOfflineUse = useCallback(() => {
    // 检查是否是关键错误
    if (error && (
      error.includes('无法获取版本信息') ||
      error.includes('配置错误') ||
      error.includes('API响应格式错误')
    )) {
      // 关键错误时强制退出，不允许离线使用
      handleForceExit();
      return;
    }
    
    setShowDialog(false);
    onAllowOfflineUse?.();
    onCheckComplete(false);
  }, [error, onAllowOfflineUse, onCheckComplete]);

  /**
   * 强制退出应用程序
   */
  const handleForceExit = async () => {
    try {
      console.log('🚨 用户选择强制退出应用');
      
      // 记录退出原因
      const exitReason = {
        reason: '版本检测失败',
        error: error,
        timestamp: new Date().toISOString(),
        environment: import.meta.env.MODE
      };
      
      console.log('📝 退出原因记录:', exitReason);
      
      // 显示退出提示
      setError('系统即将退出，感谢您的使用！');
      
      // 延迟退出，让用户看到提示信息
      setTimeout(async () => {
        try {
          // 尝试使用Tauri API退出
          const { exit } = await import('@tauri-apps/plugin-process');
          await exit(1);
        } catch (tauriError) {
          console.error('Tauri退出失败，使用备用方案:', tauriError);
          
          // 备用退出方案
          if (typeof window !== 'undefined' && window.close) {
            window.close();
          } else {
            // 最后的备用方案：刷新页面并显示错误
            window.location.href = 'about:blank';
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ 强制退出失败:', error);
      // 即使退出失败，也要尝试关闭窗口
      if (typeof window !== 'undefined') {
        window.close();
      }
    }
  };

  // 组件渲染
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader className={styles.header}>
          <Text size={600} weight="semibold">版本检查</Text>
        </CardHeader>
        
        <div className={styles.content}>
          {isChecking ? (
            <div className={styles.loadingContainer}>
              <Spinner size="medium" />
              <Text>正在检查版本更新...</Text>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <Text className={styles.errorText}>{error}</Text>
              <div className="error-actions">
                {isCriticalError ? (
                  // 关键错误：只显示强制退出按钮
                  <Button
                    appearance="primary"
                    onClick={handleForceExit}
                    className="exit-button"
                  >
                    强制退出应用
                  </Button>
                ) : (
                  // 非关键错误：显示重试和离线使用选项
                  <>
                    <Button
                      appearance="primary"
                      onClick={performVersionCheck}
                      disabled={isChecking}
                    >
                      重试检查
                    </Button>
                    <Button
                      appearance="secondary"
                      onClick={handleOfflineUse}
                    >
                      离线使用
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : checkResult ? (
            <div className={styles.successContainer}>
              <Text>版本检查完成</Text>
              {checkResult.needsUpdate ? (
                <Text>发现新版本: {checkResult.latestVersion}</Text>
              ) : (
                <Text>当前已是最新版本</Text>
              )}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default StartupVersionChecker;