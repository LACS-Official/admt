/**
 * 版本检查组件
 * 在应用启动时检查版本更新，显示更新提示
 */

import React, { useEffect, useState } from 'react';
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
  tokens
} from '@fluentui/react-components';
import {
  Open24Regular,
  Info24Regular,
  Warning24Regular,
  Checkmark24Regular,
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
});

interface VersionCheckerProps {
  onUpdateRequired?: () => void;
  onUpdateAvailable?: (updateInfo: VersionCheckResult) => void;
  onCheckComplete?: (result: VersionCheckResult) => void;
  autoCheck?: boolean;
  showDialog?: boolean;
}

const VersionChecker: React.FC<VersionCheckerProps> = ({
  onUpdateRequired,
  onUpdateAvailable,
  onCheckComplete,
  autoCheck = true,
  showDialog = true
}) => {
  const styles = useStyles();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 执行版本检查
   */
  const performVersionCheck = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      console.log('开始检查版本更新...');
      const result = await versionService.checkForUpdates();
      
      console.log('版本检查结果:', result);
      setCheckResult(result);
      
      // 调用回调函数
      onCheckComplete?.(result);
      
      if (result.needsUpdate) {
        if (result.isForceUpdate) {
          onUpdateRequired?.();
        } else {
          onUpdateAvailable?.(result);
        }
        
        // 显示更新对话框
        if (showDialog) {
          setIsDialogOpen(true);
        }
      } else if (showDialog) {
        // 即使没有更新也显示对话框（用于手动检查时）
        setIsDialogOpen(true);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '版本检查失败';
      console.error('版本检查失败:', error);
      setError(errorMessage);
      
      if (showDialog) {
        setIsDialogOpen(true);
      }
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * 处理立即更新 - 跳转到浏览器打开下载页面
   */
  const handleUpdateNow = () => {
    let downloadUrl = '';

    // 优先使用官方下载链接
    if (checkResult?.updateInfo?.downloadLinks?.official) {
      downloadUrl = checkResult.updateInfo.downloadLinks.official;
    } else {
      // 默认使用 app.lacs.cc
      downloadUrl = 'https://app.lacs.cc';
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
    } else {
      // 如果没有下载链接，跳转到官网或显示提示
      console.warn('没有可用的下载链接');
      // 可以跳转到官网或项目页面
      const fallbackUrl = 'https://app.lacs.cc/'; // 替换为实际的项目地址
      window.open(fallbackUrl, '_blank');
    }
    setIsDialogOpen(false);
  };

  /**
   * 处理关闭对话框
   */
  const handleCloseDialog = () => {
    if (checkResult?.isForceUpdate) {
      // 强制更新时不允许关闭对话框
      return;
    }
    setIsDialogOpen(false);
  };

  /**
   * 获取消息栏的意图类型
   */
  const getMessageIntent = () => {
    if (error) return 'error';
    if (!checkResult) return 'info';
    if (checkResult.isForceUpdate) return 'error';
    if (checkResult.needsUpdate) return 'warning';
    return 'success';
  };

  /**
   * 获取消息栏的图标
   */
  const getMessageIcon = () => {
    if (error) return <Warning24Regular />;
    if (!checkResult) return <Info24Regular />;
    if (checkResult.needsUpdate) return <ArrowDownload24Regular />;
    return <Checkmark24Regular />;
  };

  // 自动检查版本
  useEffect(() => {
    if (autoCheck) {
      performVersionCheck();
    }
  }, [autoCheck]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={(_, data) => {
      if (!checkResult?.isForceUpdate) {
        setIsDialogOpen(data.open);
      }
    }}>
      <DialogSurface className={styles.dialog}>
        <DialogTitle>版本检查</DialogTitle>
        <DialogBody>
          <div className={styles.content}>
            {isChecking ? (
              <div className={styles.loadingContainer}>
                <Spinner size="small" />
                <Text>正在检查版本更新...</Text>
              </div>
            ) : (
              <>
                {error ? (
                  <MessageBar intent="error">
                    <MessageBarBody>
                      {getMessageIcon()}
                      {error}
                    </MessageBarBody>
                  </MessageBar>
                ) : checkResult ? (
                  <>
                    <MessageBar intent={getMessageIntent()}>
                      <MessageBarBody>
                        {getMessageIcon()}
                        {checkResult.message}
                      </MessageBarBody>
                    </MessageBar>
                    
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
              </>
            )}
          </div>
        </DialogBody>
        <DialogActions className={styles.actions}>
          {checkResult?.needsUpdate ? (
            <>
              <Button
                appearance="primary"
                onClick={handleUpdateNow}
                icon={<Open24Regular />}
              >
                前往下载
              </Button>
              {/* 强制更新时不显示"稍后更新"按钮 */}
            </>
          ) : (
            <Button
              appearance="primary"
              onClick={handleCloseDialog}
            >
              确定
            </Button>
          )}
          {!checkResult?.isForceUpdate && (
            <Button
              appearance="secondary"
              onClick={() => performVersionCheck()}
              disabled={isChecking}
            >
              重新检查
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default VersionChecker;
