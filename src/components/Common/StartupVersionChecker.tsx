/**
 * 启动时版本检查组件 - 极简风格
 * 在应用启动时执行版本检查，根据结果显示相应的UI
 */
import React, { useCallback, useEffect, useState, useMemo }  from 'react';
import {
  Button,
  Text,
  Spinner,
  makeStyles,
  tokens,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  ToastIntent,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
} from '@fluentui/react-components';
import {
  Open24Regular,
  Checkmark24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';

import { checkForUpdates, versionService, VersionCheckResult } from '../../services/versionServiceAdapter';
import { openDownloadLink } from '../../services/versionService';

const useStyles = makeStyles({
  // 主容器 - 极简设计
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  
  // 内容卡片 - 简洁边框
  card: {
    maxWidth: '480px',
    width: '100%',
    padding: '48px 32px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    textAlign: 'center',
  },

  // 强制更新对话框样式
  forceUpdateDialog: {
    maxWidth: '800px',
    width: '90vw',
  },

  forceUpdateSurface: {
    padding: '32px',
    borderRadius: '12px',
    border: `3px solid ${tokens.colorPaletteRedBorder2}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    backgroundColor: tokens.colorNeutralBackground1,
  },

  forceUpdateTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    color: tokens.colorPaletteRedForeground1,
    fontSize: '20px',
    fontWeight: '700',
  },

  forceUpdateIcon: {
    fontSize: '28px',
    color: tokens.colorPaletteRedForeground1,
  },

  forceUpdateContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    textAlign: 'center',
  },

  forceUpdateMessage: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
  },

  forceUpdateVersionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    border: `2px solid ${tokens.colorPaletteRedBorder1}`,
  },

  forceUpdateVersionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  forceUpdateVersionLabel: {
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
  },

  forceUpdateVersionValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontWeight: '600',
  },

  forceUpdateCurrentVersion: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
  },

  forceUpdateLatestVersion: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground1,
  },

  forceUpdateReleaseNotes: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    textAlign: 'left',
    maxHeight: '180px',
    overflowY: 'auto',
    lineHeight: '1.6',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  forceUpdateReleaseNotesTitle: {
    fontWeight: '600',
    marginBottom: '12px',
    color: tokens.colorNeutralForeground1,
  },

  forceUpdateReleaseNotesContent: {
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap',
  },

  forceUpdateActions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '24px',
  },

  forceUpdateButton: {
    minWidth: '200px',
    height: '48px',
    fontSize: '16px',
    fontWeight: '700',
    borderRadius: '8px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    border: 'none',
    boxShadow: '0 4px 16px rgba(220, 53, 69, 0.4)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ':hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(220, 53, 69, 0.5)',
    },
    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 4px 16px rgba(220, 53, 69, 0.4)',
    },
  },

  // 警告提示文字
  forceUpdateWarning: {
    padding: '16px',
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `2px solid ${tokens.colorPaletteYellowBorder2}`,
    borderRadius: '8px',
    color: tokens.colorPaletteYellowForeground2,
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '16px',
  },
  
  // 标题区域
  title: {
    marginBottom: '32px',
    color: tokens.colorNeutralForeground1,
  },
  
  // 加载状态
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  
  // 版本信息区域 - 简化设计
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '4px',
  },
  
  versionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  versionLabel: {
    color: tokens.colorNeutralForeground2,
  },
  
  versionValue: {
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '4px 8px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '4px',
  },
  
  currentVersion: {
    color: tokens.colorNeutralForeground1,
  },
  
  latestVersion: {
    color: tokens.colorPaletteBlueForeground2,
    backgroundColor: tokens.colorPaletteBlueBackground2,
  },
  
  // 更新说明 - 简化样式
  releaseNotes: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '4px',
    textAlign: 'left',
    maxHeight: '200px',
    overflowY: 'auto',
    lineHeight: '1.6',
  },
  
  releaseNotesTitle: {
    marginBottom: '12px',
    color: tokens.colorNeutralForeground1,
  },
  
  releaseNotesContent: {
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap',
  },
  
  // 按钮区域 - 极简设计
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '32px',
  },
  
  primaryButton: {
    minWidth: '120px',
    height: '40px',
    borderRadius: '4px',
  },
  
  secondaryButton: {
    minWidth: '120px',
    height: '40px',
    borderRadius: '4px',
  },
  
  // 成功状态
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  
  successIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteGreenForeground1,
    marginBottom: '8px',
  },
  
  // 错误状态
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    textAlign: 'center',
    lineHeight: '1.5',
  },
  
  // 响应式设计 - 优化移动端体验
  '@media (max-width: 768px)': {
    card: {
      padding: '32px 24px',
    },
    versionInfo: {
      padding: '16px',
    },
    actions: {
      flexDirection: 'column',
      gap: '12px',
    },
    primaryButton: {
      width: '100%',
      height: '44px',
    },
    secondaryButton: {
      width: '100%',
      height: '44px',
    },
  },
  
  '@media (max-width: 480px)': {
    card: {
      padding: '24px 16px',
    },
    title: {
      marginBottom: '24px',
    },
    versionRow: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '8px',
    },
    versionValue: {
      alignSelf: 'flex-end',
    },
  },
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
  const [showDialog, setShowDialog] = useState(!propCheckResult || !propCheckResult.hasUpdate); // 如果传入需要更新的结果，隐藏普通对话框
  const [showForceUpdateDialog, setShowForceUpdateDialog] = useState(propCheckResult?.hasUpdate || false); // 如果传入需要更新的结果，直接显示强制更新对话框
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
      const result = await checkForUpdates();

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
        hasUpdate: result.hasUpdate,
        needsUpdate: result.hasUpdate,
        currentVersion: result.currentVersion,
        localVersion: result.localVersion,
        latestVersion: result.latestVersion || result.currentVersion,
        isForceUpdate: result.isForceUpdate,
        message: result.message || '',
        error: result.error,
        versionInfo: result.versionInfo
      };
      
      setCheckResult(normalizedResult);

      if (normalizedResult.hasUpdate) {
        // 有更新时显示强制更新对话框
        console.log('🆕 发现新版本，需要强制更新:', normalizedResult.latestVersion);
        setShowForceUpdateDialog(true);
        setShowDialog(false); // 隐藏普通对话框
        onCheckComplete(true, normalizedResult);
      } else {
        // 不需要更新，显示成功提示
        console.log('✅ 当前已是最新版本:', normalizedResult.currentVersion);
        showSuccessToast();
        setShowDialog(false); // 隐藏对话框
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

  // 如果没有传入 checkResult，则自动执行版本检查
  useEffect(() => {
    if (!propCheckResult) {
      performVersionCheck();
    }
  }, [propCheckResult, performVersionCheck]);

  // 监听外部传入的checkResult变化
  useEffect(() => {
    if (propCheckResult) {
      console.log('📋 接收到外部传入的版本检查结果:', propCheckResult);
      setCheckResult(propCheckResult);
      
      if (propCheckResult.hasUpdate) {
        console.log('🆕 外部传入结果显示需要更新，显示强制更新对话框');
        setShowForceUpdateDialog(true);
        setShowDialog(false);
      } else {
        console.log('✅ 外部传入结果显示已是最新版本');
        setShowForceUpdateDialog(false);
        setShowDialog(true);
      }
    }
  }, [propCheckResult]);



  /**
   * 处理立即更新 - 跳转到浏览器打开下载页面（强制更新模式）
   */
  const handleUpdateNow = useCallback(() => {
    // 固定使用默认下载页面，不解析API返回的downloadUrl
    const downloadUrl = 'https://admt.lacs.cc/download';
    
    console.log('🔗 准备打开下载链接:', downloadUrl);

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
          新版本 {checkResult?.latestVersion} 下载页面已在浏览器中打开，请完成更新后重启应用
        </ToastBody>
      </Toast>,
      { intent: 'success' as ToastIntent, timeout: 8000 }
    );

    // 注意：强制更新模式下不关闭对话框，用户必须完成更新
    // setShowForceUpdateDialog(false); // 保持对话框打开
  }, [dispatchToast, checkResult]);

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

  // 组件渲染 - 包含强制更新对话框
  return (
    <>
      {/* 普通版本检查界面 */}
      {showDialog && (
        <div className={styles.container}>
          <div className={styles.card}>
            <Text size={500} weight="semibold" className={styles.title}>
              版本检查
            </Text>
            
            {isChecking ? (
              // 加载状态 - 简洁设计
              <div className={styles.loadingContainer}>
                <Spinner size="medium" />
                <Text>正在检查版本更新...</Text>
              </div>
            ) : error ? (
              // 错误状态 - 清晰展示
              <div className={styles.errorContainer}>
                <Text className={styles.errorText}>{error}</Text>
                <div className={styles.actions}>
                  {isCriticalError ? (
                    <Button
                      appearance="primary"
                      onClick={handleForceExit}
                      className={styles.primaryButton}
                    >
                      退出应用
                    </Button>
                  ) : (
                    <>
                      <Button
                        appearance="primary"
                        onClick={performVersionCheck}
                        disabled={isChecking}
                        className={styles.primaryButton}
                      >
                        重试
                      </Button>
                      <Button
                        appearance="secondary"
                        onClick={handleOfflineUse}
                        className={styles.secondaryButton}
                      >
                        离线使用
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : checkResult && !checkResult.hasUpdate ? (
              // 当前已是最新版本 - 简洁确认
              <div className={styles.successContainer}>
                <CheckmarkCircle24Filled className={styles.successIcon} />
                <Text size={400} weight="semibold">
                  已是最新版本
                </Text>
                <Text className={`${styles.versionValue} ${styles.currentVersion}`}>
                  {checkResult.currentVersion}
                </Text>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 强制更新对话框 */}
      <Dialog 
        open={showForceUpdateDialog}
        modalType="modal"
      >
        <DialogSurface className={`${styles.forceUpdateDialog} ${styles.forceUpdateSurface}`}>
          <DialogTitle className={styles.forceUpdateTitle}>
            <Warning24Filled className={styles.forceUpdateIcon} />
            必须更新应用
          </DialogTitle>
          <div className={styles.forceUpdateContent}>
              <Text className={styles.forceUpdateMessage}>
                检测到新版本可用，为了确保应用的安全性和稳定性，您必须更新到最新版本才能继续使用。
              </Text>

              {checkResult && (
                <div className={styles.forceUpdateVersionInfo}>
                  <div className={styles.forceUpdateVersionRow}>
                    <Text className={styles.forceUpdateVersionLabel}>当前版本</Text>
                    <Text className={`${styles.forceUpdateVersionValue} ${styles.forceUpdateCurrentVersion}`}>
                      {checkResult.currentVersion}
                    </Text>
                  </div>
                  <div className={styles.forceUpdateVersionRow}>
                    <Text className={styles.forceUpdateVersionLabel}>最新版本</Text>
                    <Text className={`${styles.forceUpdateVersionValue} ${styles.forceUpdateLatestVersion}`}>
                      {checkResult.latestVersion}
                    </Text>
                  </div>
                </div>
              )}

              {checkResult?.versionInfo?.releaseNotes && (
                <div className={styles.forceUpdateReleaseNotes}>
                  <Text weight="semibold" className={styles.forceUpdateReleaseNotesTitle}>
                    🔄 更新内容
                  </Text>
                  <Text className={styles.forceUpdateReleaseNotesContent}>
                    请前往下载页面查看更新日志。
                  </Text>
                </div>
              )}
            </div>

          <DialogActions className={styles.forceUpdateActions}>
            <Button
              appearance="primary"
              size="large"
              icon={<ArrowDownload24Regular />}
              onClick={handleUpdateNow}
              className={styles.forceUpdateButton}
            >
              打开下载页面
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default StartupVersionChecker;

function showSuccessToast() {
  throw new Error('Function not implemented.');
}
