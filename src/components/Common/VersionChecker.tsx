import React, { useState, useEffect } from 'react';
import { checkForUpdates, VersionCheckResult } from '../../services/versionService';
import { useAppStore } from "../../stores/appStore";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  MessageBar,
  MessageBarBody,
  Text,
  Button,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  ArrowUpload24Regular,
} from "@fluentui/react-icons";

interface VersionCheckerProps {
  onCheckUpdate?: () => void;
  onUpdateFound?: (result: VersionCheckResult) => void;
  onNoUpdate?: (currentVersion: string) => void;
  onError?: (error: string) => void;
  downloadUrl?: string;
  showStatusMessage?: boolean;
  autoCheck?: boolean; // 是否自动检查更新
  triggerCheck?: boolean; // 外部触发检查更新
}

const VersionChecker: React.FC<VersionCheckerProps> = ({
  onCheckUpdate,
  onUpdateFound,
  onNoUpdate,
  onError,
  downloadUrl = "https://admt.lacs.cc/download",
  showStatusMessage = true,
  autoCheck = false,
  triggerCheck = false,
}) => {
  const { setStatusBarMessage } = useAppStore();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 组件挂载时自动检查更新
  useEffect(() => {
    if (autoCheck) {
      handleCheckUpdate();
    }
  }, [autoCheck]);

  // 外部触发检查更新
  useEffect(() => {
    if (triggerCheck) {
      handleCheckUpdate();
    }
  }, [triggerCheck]);

  // 打开链接的通用函数
  const openUrl = (url: string) => {
    import('@tauri-apps/plugin-shell').then(({ open }) => {
      open(url).catch((error) => {
        console.error('Failed to open URL:', error);
        // 如果 Tauri shell 插件不可用，使用 window.open
        window.open(url, '_blank');
      });
    }).catch(() => {
      // 如果 Tauri shell 插件不可用，使用 window.open
      window.open(url, '_blank');
    });
  };

  const handleCheckUpdate = async () => {
    if (isCheckingUpdate) return; // 防止重复点击
    
    if (onCheckUpdate) {
      onCheckUpdate();
    }
    
    try {
      setIsCheckingUpdate(true);
      setUpdateMessage(null);
      
      // 调用版本检查服务
      const result = await checkForUpdates();
      
      if (result.hasUpdate) {
        // 显示更新对话框
        setUpdateInfo(result);
        setUpdateDialogOpen(true);
        
        if (onUpdateFound) {
          onUpdateFound(result);
        }
      } else {
        // 显示已是最新版本提示
        if (showStatusMessage) {
          setStatusBarMessage({
            type: "success",
            message: "当前版本是最新版",
          });
        }
        
        if (onNoUpdate) {
          onNoUpdate(result.currentVersion);
        }
        
        // 3秒后自动清除提示
        setTimeout(() => setUpdateMessage(null), 3000);
      }
    } catch (error) {
      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : '版本检查失败，请稍后重试';
      
      // 检查是否是 429 错误
      if (errorMessage.includes('429 Too Many Requests')) {
        // 显示 429 错误提示
        if (showStatusMessage) {
          setStatusBarMessage({
            type: "error",
            message: "版本检查请求过于频繁，请稍后再试",
          });
        }
        
        // 显示错误对话框
        setUpdateMessage({
          type: 'error',
          message: '版本检查请求过于频繁，请稍后再试'
        });
        
        // 3秒后退出应用
        setTimeout(() => {
          // 使用 Tauri 的退出功能
          import('@tauri-apps/plugin-process').then(({ exit }) => {
            exit(0);
          }).catch(() => {
            // 如果 Tauri API 不可用，使用 window.close
            window.close();
          });
        }, 3000);
      } else {
        // 其他错误处理
        if (showStatusMessage) {
          setUpdateMessage({
            type: 'error',
            message: errorMessage
          });
        }
        
        if (onError) {
          onError(errorMessage);
        }
        
        // 5秒后自动清除错误提示
        setTimeout(() => setUpdateMessage(null), 5000);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadUpdate = () => {
    // 标记正在下载更新
    setIsDownloading(true);
    
    if (updateInfo?.updateInfo?.downloadUrl) {
      openUrl(updateInfo.updateInfo.downloadUrl);
    } else {
      openUrl(downloadUrl); // 降级到默认下载页面
    }
    
    // 关闭对话框
    setUpdateDialogOpen(false);
    
    // 延迟1秒后退出应用，给用户时间看到下载页面已打开
    setTimeout(() => {
      // 使用 Tauri 的退出功能
      import('@tauri-apps/plugin-process').then(({ exit }) => {
        exit(0);
      }).catch(() => {
        // 如果 Tauri API 不可用，使用 window.close
        window.close();
      });
    }, 1000);
  };

  // 如果有更新对话框需要显示，则始终显示对话框，不返回null
  if (updateDialogOpen) {
    return (
      <>
        {/* 更新对话框 */}
        <Dialog open={updateDialogOpen} onOpenChange={(_e, data) => {
          // 如果正在下载更新，允许关闭对话框
          if (isDownloading) {
            setUpdateDialogOpen(data.open);
            return;
          }
          
          // 只有在点击下载按钮后才能关闭对话框，防止用户通过其他方式关闭
          if (!data.open && updateInfo) {
            // 如果用户尝试通过其他方式关闭，重新打开对话框
            setTimeout(() => setUpdateDialogOpen(true), 0);
          } else {
            setUpdateDialogOpen(data.open);
          }
        }}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>重要更新可用</DialogTitle>
              <DialogContent>
                {updateInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text weight="semibold">当前版本：</Text>
                      <Text>{updateInfo.localVersion}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text weight="semibold">最新版本：</Text>
                      <Text color="brand">{updateInfo.currentVersion}</Text>
                    </div>
                    <div style={{ 
                      backgroundColor: 'var(--colorNeutralBackground2)', 
                      padding: '12px', 
                      borderRadius: '8px',
                      marginTop: '8px'
                    }}>
                      <Text size={300} style={{ color: 'var(--colorNeutralForeground2)' }}>
                        {updateInfo.updateInfo?.updateLog || '请在下载页面查看相关内容'}
                      </Text>
                    </div>
                    <Text size={300} style={{ color: 'var(--colorNeutralForeground2)', textAlign: 'center' }}>
                      此更新包含重要修复和改进，点击"立即更新"后将自动打开下载页面并退出应用。
                    </Text>
                  </div>
                )}
              </DialogContent>
              <DialogActions>
                <Button 
                  appearance="primary" 
                  onClick={handleDownloadUpdate}
                  icon={<ArrowUpload24Regular />}
                >
                  立即更新
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {/* 显示更新检查结果信息 */}
      {updateMessage && showStatusMessage && (
        <MessageBar 
          intent={updateMessage.type === 'error' ? 'error' : updateMessage.type === 'success' ? 'success' : 'info'}
          style={{ marginTop: '16px' }}
        >
          <MessageBarBody>
            {updateMessage.type === 'success' && <CheckmarkCircle24Regular style={{ marginRight: '8px' }} />}
            {updateMessage.type === 'error' && <ErrorCircle24Regular style={{ marginRight: '8px' }} />}
            {updateMessage.message}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* 更新对话框 */}
      <Dialog open={updateDialogOpen} onOpenChange={(_e, data) => {
        // 如果正在下载更新，允许关闭对话框
        if (isDownloading) {
          setUpdateDialogOpen(data.open);
          return;
        }
        
        // 只有在点击下载按钮后才能关闭对话框，防止用户通过其他方式关闭
        if (!data.open && updateInfo) {
          // 如果用户尝试通过其他方式关闭，重新打开对话框
          setTimeout(() => setUpdateDialogOpen(true), 0);
        } else {
          setUpdateDialogOpen(data.open);
        }
      }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>重要更新可用</DialogTitle>
            <DialogContent>
              {updateInfo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text weight="semibold">当前版本：</Text>
                    <Text>{updateInfo.localVersion}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text weight="semibold">最新版本：</Text>
                    <Text color="brand">{updateInfo.currentVersion}</Text>
                  </div>
                  <div style={{ 
                    backgroundColor: 'var(--colorNeutralBackground2)', 
                    padding: '12px', 
                    borderRadius: '8px',
                    marginTop: '8px'
                  }}>
                    <Text size={300} style={{ color: 'var(--colorNeutralForeground2)' }}>
                      {updateInfo.updateInfo?.updateLog || '请在下载页面查看相关内容'}
                    </Text>
                  </div>
                  <Text size={300} style={{ color: 'var(--colorNeutralForeground2)', textAlign: 'center' }}>
                    此更新包含重要修复和改进，点击"立即更新"后将自动打开下载页面并退出应用。
                  </Text>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                appearance="primary" 
                onClick={handleDownloadUpdate}
                icon={<ArrowUpload24Regular />}
              >
                立即更新
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default VersionChecker;