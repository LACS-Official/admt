/**
 * 启动时版本检查组件
 * 在应用启动时执行版本检查，根据结果显示相应的UI
 */

import React, { useEffect, useState, useCallback } from 'react';
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
  ToastIntent
} from '@fluentui/react-components';
import {
  Open24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  ArrowClockwise24Regular
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
    padding: tokens.spacingVerticalM,
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
});

interface StartupVersionCheckerProps {
  onCheckComplete: (needsUpdate: boolean, result?: VersionCheckResult) => void;
  onAllowOfflineUse?: () => void;
}

const StartupVersionChecker: React.FC<StartupVersionCheckerProps> = ({
  onCheckComplete,
  onAllowOfflineUse
}) => {
  const styles = useStyles();
  const { dispatchToast } = useToastController();
  
  const [isChecking, setIsChecking] = useState(true);
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
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
    
    // 设置10秒超时
    const timeoutId = setTimeout(() => {
      setTimeoutReached(true);
      setIsChecking(false);
      setError('版本检查超时，请检查网络连接');
    }, 10000);

    try {
      console.log('开始启动时版本检查...');
      const result = await versionService.checkForUpdates();

      // 清除超时定时器
      clearTimeout(timeoutId);

      if (timeoutReached) {
        return; // 如果已经超时，忽略结果
      }

      console.log('版本检查结果:', result);
      setCheckResult(result);
      
      if (result.needsUpdate && result.isForceUpdate) {
        // 需要强制更新
        setShowDialog(true);
        onCheckComplete(true, result);
      } else {
        // 不需要更新，显示成功提示
        showSuccessToast();
        onCheckComplete(false, result);
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (timeoutReached) {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : '版本检查失败';
      console.error('版本检查失败:', error);
      setError(errorMessage);
      setShowDialog(true);
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
    let downloadUrl = '';

    // 优先使用官方下载链接
    if (checkResult?.updateInfo?.downloadLinks?.official) {
      downloadUrl = checkResult.updateInfo.downloadLinks.official;
    } else if (checkResult?.updateInfo?.downloadLinks?.github) {
      downloadUrl = checkResult.updateInfo.downloadLinks.github;
    } else if (checkResult?.updateInfo?.downloadUrl) {
      downloadUrl = checkResult.updateInfo.downloadUrl;
    }

    if (downloadUrl) {
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
    } else {
      // 如果没有下载链接，显示提示
      dispatchToast(
        <Toast>
          <ToastTitle media={<Warning24Regular />}>
            暂无下载链接
          </ToastTitle>
          <ToastBody>
            请联系开发者获取最新版本
          </ToastBody>
        </Toast>,
        { intent: 'warning' as ToastIntent }
      );
    }
  }, [checkResult, dispatchToast]);

  /**
   * 处理重试
   */
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setShowDialog(false);
    performVersionCheck();
  }, [performVersionCheck]);

  /**
   * 处理离线使用
   */
  const handleOfflineUse = useCallback(() => {
    setShowDialog(false);
    onAllowOfflineUse?.();
    onCheckComplete(false);
  }, [onAllowOfflineUse, onCheckComplete]);

  // 组件挂载时开始版本检查
  useEffect(() => {
    performVersionCheck();
  }, [performVersionCheck]);

  // 如果正在检查且没有显示对话框，显示加载状态
  if (isChecking && !showDialog) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="small" />
        <Text>正在检查版本更新...</Text>
      </div>
    );
  }

  // 如果不需要显示对话框，返回空
  if (!showDialog) {
    return <Toaster />;
  }

  return (
    <>
      <Toaster />
      <Dialog 
        open={showDialog} 
        onOpenChange={() => {
          // 强制更新时不允许关闭对话框
          if (!checkResult?.isForceUpdate && error) {
            setShowDialog(false);
          }
        }}
        modalType="modal"
      >
        <DialogSurface className={styles.dialog}>
          <DialogTitle>
            {error ? '版本检查失败' : '发现新版本'}
          </DialogTitle>
          <DialogBody>
            <div className={styles.content}>
              {error ? (
                // 错误状态
                <>
                  <MessageBar intent="error">
                    <MessageBarBody>
                      <Warning24Regular />
                      {error}
                    </MessageBarBody>
                  </MessageBar>
                  
                  <Text size={300}>
                    无法连接到更新服务器，您可以选择重试或继续离线使用。
                  </Text>
                  
                  {retryCount > 0 && (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      已重试 {retryCount} 次
                    </Text>
                  )}
                </>
              ) : checkResult ? (
                // 强制更新状态
                <>
                  <div className={styles.forceUpdateContainer}>
                    <Warning24Regular className={styles.warningIcon} />
                    <Text size={600} weight="semibold" block style={{ marginBottom: '16px' }}>
                      需要更新到最新版本
                    </Text>
                    <Text size={400} style={{ color: tokens.colorNeutralForeground2 }}>
                      检测到新版本，请更新后继续使用
                    </Text>
                  </div>
                  
                  <div className={styles.versionInfo}>
                    <div className={styles.versionRow}>
                      <Text weight="semibold">当前版本:</Text>
                      <Text>{checkResult.currentVersion}</Text>
                    </div>
                    <div className={styles.versionRow}>
                      <Text weight="semibold">最新版本:</Text>
                      <Text>{checkResult.latestVersion}</Text>
                    </div>
                  </div>
                  
                  {checkResult.updateInfo && (
                    <div className={styles.releaseNotes}>
                      <Text weight="semibold" block style={{ marginBottom: '8px' }}>
                        更新说明:
                      </Text>
                      <Text size={300}>
                        {checkResult.updateInfo.releaseNotes || '暂无更新说明'}
                      </Text>
                      {checkResult.updateInfo.fileSize && (
                        <Text size={200} style={{ marginTop: '8px', color: tokens.colorNeutralForeground3 }}>
                          文件大小: {checkResult.updateInfo.fileSize}
                        </Text>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </DialogBody>
          <DialogActions>
            {error ? (
              // 错误状态的按钮
              <div className={styles.errorActions}>
                <Button 
                  appearance="secondary" 
                  onClick={handleOfflineUse}
                  icon={<Dismiss24Regular />}
                >
                  离线使用
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handleRetry}
                  icon={<ArrowClockwise24Regular />}
                >
                  重试
                </Button>
              </div>
            ) : (
              // 强制更新状态的按钮
              <div className={styles.actions}>
                <Button
                  appearance="primary"
                  onClick={handleUpdateNow}
                  icon={<Open24Regular />}
                >
                  前往下载
                </Button>
              </div>
            )}
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default StartupVersionChecker;
