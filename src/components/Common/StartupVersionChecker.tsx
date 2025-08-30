/**
 * 启动时版本检查组件
 * 在应用启动时执行版本检查，根据结果显示相应的UI
 */
import React, { useCallback, useEffect, useState }  from 'react';
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

      if (result.needsUpdate) {
        // 有更新时统一按强制更新处理
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
   * 处理离线使用
   */
  const handleOfflineUse = useCallback(() => {
    setShowDialog(false);
    onAllowOfflineUse?.();
    onCheckComplete(false);
  }, [onAllowOfflineUse, onCheckComplete]);



  // 组件挂载时开始版本检查（仅在没有传入checkResult时）
  useEffect(() => {
    if (!propCheckResult) {
      performVersionCheck();
    } else {
      // 如果传入了checkResult，直接调用回调
      console.log('📋 使用传入的版本检查结果:', propCheckResult);
      onCheckComplete(propCheckResult.needsUpdate, propCheckResult);
    }
  }, [propCheckResult, performVersionCheck, onCheckComplete]);

  // 如果正在检查且没有显示对话框，显示加载状态
  if (isChecking && !showDialog) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="small" />
        <Text>正在检查版本更新...</Text>
      </div>
    );
  }

  // 如果不需要显示对话框且没有错误，显示成功卡片
  if (!showDialog && !error && checkResult && !checkResult.needsUpdate) {
    return (
      <>
        <Toaster />
        <Card className={styles.successCard}>
          <CardHeader
            header={
              <Text weight="semibold" className={styles.successHeader}>
                版本检查完成
              </Text>
            }
            description="您的应用程序已是最新版本"
            image={<CheckmarkCircle24Filled className={styles.successIcon} />}
          />
          <CardPreview>
            <div style={{ padding: tokens.spacingVerticalS }}>
              <Text size={300} align="center">
                当前版本: {checkResult.currentVersion}
              </Text>
            </div>
          </CardPreview>
          <CardFooter>
            <Button appearance="primary" onClick={() => onCheckComplete(false, checkResult)}>
              继续使用
            </Button>
          </CardFooter>
        </Card>
      </>
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
        onOpenChange={(_event, data) => {
          // 有更新时不允许关闭对话框，只有错误状态时才允许关闭
          if (error && !checkResult?.needsUpdate) {
            setShowDialog(data.open);
          }
          // 有更新时强制阻止关闭对话框
        }}
        modalType="modal"
      >
        <DialogSurface className={styles.dialog}>
          <DialogTitle>
            {error ? '版本检查失败' : checkResult?.needsUpdate ? '发现新版本' : '版本检查完成'}
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
              ) : checkResult && checkResult.needsUpdate ? (
                // 有更新状态 - 统一按强制更新处理
                <Card className={styles.updateCard}>
                  <CardHeader
                    header={
                      <Text weight="semibold">
                        需要强制更新
                      </Text>
                    }
                    description={
                      <Text size={200}>
                        检测到新版本，必须更新后才能继续使用应用
                      </Text>
                    }
                    image={<Warning24Regular />}
                  />
                  
                  <div className={styles.updateBody}>
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
                      <>
                        <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />
                        
                        <Text weight="semibold" block>
                          更新说明:
                        </Text>
                        <div className={styles.releaseNotes}>
                          <Text size={300}>
                            {checkResult.updateInfo.releaseNotes || '暂无更新说明'}
                          </Text>
                          {checkResult.updateInfo.fileSize && (
                            <Text size={200} style={{ marginTop: '8px', color: tokens.colorNeutralForeground3 }}>
                              文件大小: {checkResult.updateInfo.fileSize}
                            </Text>
                          )}
                        </div>

                      </>
                    )}
                  </div>
                  
                  <CardFooter className={styles.updateFooter}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      此更新包含重要修复，必须更新后才能继续使用
                    </Text>
                  </CardFooter>
                </Card>
              ) : checkResult ? (
                // 无更新状态（在对话框中显示）
                <Card className={styles.updateCard}>
                  <CardHeader
                    header={
                      <Text weight="semibold">
                        当前是最新版本
                      </Text>
                    }
                    description="您的应用程序已是最新版本"
                    image={<CheckmarkCircle24Filled className={styles.successIcon} />}
                  />
                  <CardPreview>
                    <div style={{ padding: tokens.spacingVerticalS }}>
                      <Text size={300} align="center">
                        当前版本: {checkResult.currentVersion}
                      </Text>
                    </div>
                  </CardPreview>
                </Card>
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
            ) : checkResult?.needsUpdate ? (
              // 有更新时统一显示立即更新按钮
              <div className={styles.actions}>
                <Button
                  appearance="primary"
                  onClick={handleUpdateNow}
                  icon={<ArrowDownload24Regular />}
                  size='large'
                >
                  立即更新
                </Button>
              </div>
            ) : (
              // 无更新状态的按钮
              <div className={styles.actions}>
                <Button
                  appearance="primary"
                  onClick={() => {
                    setShowDialog(false);
                    onCheckComplete(false, checkResult || undefined);
                  }}
                >
                  继续使用
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