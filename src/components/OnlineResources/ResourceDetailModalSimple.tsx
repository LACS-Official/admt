import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Divider,
  Body1,
  Caption1,
  Subtitle1,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import { OnlineSoftware } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '400px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontWeight: '600',
    color: 'var(--colorNeutralForeground2)',
  },
  infoValue: {
    color: 'var(--colorNeutralForeground1)',
  },
  downloadButton: {
    minWidth: '120px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
});

interface ResourceDetailModalProps {
  software: OnlineSoftware;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (software: OnlineSoftware) => Promise<string>;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  software,
  isOpen,
  onClose,
  onDownload,
}) => {
  const styles = useStyles();
  const [detailData, setDetailData] = useState<OnlineSoftware | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{
    isDownloaded: boolean;
    filePath?: string;
    task?: any;
  }>({ isDownloaded: false });
  const [downloadLimitInfo, setDownloadLimitInfo] = useState<{
    canDownload: boolean;
    reason?: string;
    remainingTime?: number;
  }>({ canDownload: true });
  const [cooldownTimer, setCooldownTimer] = useState<NodeJS.Timeout | null>(null);

  // 获取软件详细信息
  const fetchSoftwareDetail = async () => {
    if (!software.id) return;

    setLoading(true);
    try {
      const detail = await onlineResourcesService.getSoftwareDetail(software.id);
      if (detail) {
        setDetailData(detail);
      }
    } catch (error) {
      console.error('获取软件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查下载状态
  const checkDownloadStatus = async () => {
    const currentData = detailData || software;
    try {
      const status = await onlineResourcesService.checkSoftwareDownloaded(currentData);
      setDownloadStatus(status);
    } catch (error) {
      console.error('检查下载状态失败:', error);
    }
  };

  // 检查下载限制
  const checkDownloadLimits = () => {
    const limitInfo = onlineResourcesService.canStartDownload();
    setDownloadLimitInfo(limitInfo);

    // 如果有冷却时间，启动倒计时
    if (!limitInfo.canDownload && limitInfo.remainingTime && limitInfo.remainingTime > 0) {
      startCooldownTimer(limitInfo.remainingTime);
    }
  };

  // 启动冷却倒计时
  const startCooldownTimer = (initialTime: number) => {
    if (cooldownTimer) {
      clearInterval(cooldownTimer);
    }

    let remainingTime = initialTime;
    const timer = setInterval(() => {
      remainingTime -= 1;

      if (remainingTime <= 0) {
        clearInterval(timer);
        setCooldownTimer(null);
        checkDownloadLimits(); // 重新检查限制
      } else {
        setDownloadLimitInfo(prev => ({
          ...prev,
          remainingTime,
          reason: `下载冷却中，请等待 ${remainingTime} 秒后再试`
        }));
      }
    }, 1000);

    setCooldownTimer(timer);
  };

  // 当弹窗打开时获取详细信息和下载状态
  useEffect(() => {
    if (isOpen && software.id) {
      fetchSoftwareDetail();
      checkDownloadStatus();
      checkDownloadLimits();
    }
  }, [isOpen, software.id]);

  // 当详细信息加载完成后重新检查下载状态
  useEffect(() => {
    if (detailData) {
      checkDownloadStatus();
    }
  }, [detailData]);

  // 定期检查下载限制（每5秒检查一次）
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(checkDownloadLimits, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  // 处理下载
  const handleDownload = async (_forceRedownload = false) => {
    const currentData = detailData || software;

    // 检查下载限制
    const limitCheck = onlineResourcesService.canStartDownload();
    if (!limitCheck.canDownload) {
      console.warn('下载被限制:', limitCheck.reason);
      return;
    }

    if (onDownload && currentData.latestDownloadUrl) {
      setIsDownloading(true);
      try {
        const taskId = await onDownload(currentData);

        // 显示下载成功消息
        console.log('✅ 下载任务已启动:', taskId);

        // 重新检查下载状态和限制
        setTimeout(() => {
          checkDownloadStatus();
          checkDownloadLimits();
        }, 1000);

      } catch (error) {
        console.error('❌ 下载失败:', error);
        // 可以在这里显示错误消息
      } finally {
        setIsDownloading(false);
      }
    }
  };

  // 打开文件夹
  const handleOpenFolder = async (path: string) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_folder', { path });
    } catch (error) {
      console.error('❌ 打开文件夹失败:', error);
    }
  };

  const currentData = detailData || software;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              aria-label="关闭"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }
        >
          {currentData.name}
        </DialogTitle>
        
        <DialogContent className={styles.dialogContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spinner label="正在加载详细信息..." />
            </div>
          ) : (
            <>
              {/* 基本信息 */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <Caption1 className={styles.infoLabel}>当前版本</Caption1>
                  <Text className={styles.infoValue}>v{currentData.currentVersion}</Text>
                </div>
                
                {currentData.category && (
                  <div className={styles.infoItem}>
                    <Caption1 className={styles.infoLabel}>软件分类</Caption1>
                    <Text className={styles.infoValue}>{currentData.category}</Text>
                  </div>
                )}
                
                {currentData.filetype && (
                  <div className={styles.infoItem}>
                    <Caption1 className={styles.infoLabel}>文件类型</Caption1>
                    <Text className={styles.infoValue}>{currentData.filetype.toUpperCase()}</Text>
                  </div>
                )}
                
                <div className={styles.infoItem}>
                  <Caption1 className={styles.infoLabel}>更新时间</Caption1>
                  <Text className={styles.infoValue}>
                    {new Date(currentData.updatedAt).toLocaleDateString('zh-CN')}
                  </Text>
                </div>
              </div>

              {/* 软件描述 */}
              {currentData.description && (
                <>
                  <Divider />
                  <div>
                    <Subtitle1 style={{ marginBottom: '8px' }}>软件描述</Subtitle1>
                    <Body1>{currentData.description}</Body1>
                  </div>
                </>
              )}

              {/* 系统要求 */}
              {currentData.systemRequirements && (
                <>
                  <Divider />
                  <div>
                    <Subtitle1 style={{ marginBottom: '8px' }}>系统要求</Subtitle1>
                    <div className={styles.infoGrid}>
                      {currentData.systemRequirements.os && (
                        <div className={styles.infoItem}>
                          <Caption1 className={styles.infoLabel}>操作系统</Caption1>
                          <Text className={styles.infoValue}>
                            {currentData.systemRequirements.os.join(', ')}
                          </Text>
                        </div>
                      )}
                      {currentData.systemRequirements.memory && (
                        <div className={styles.infoItem}>
                          <Caption1 className={styles.infoLabel}>内存要求</Caption1>
                          <Text className={styles.infoValue}>{currentData.systemRequirements.memory}</Text>
                        </div>
                      )}
                      {currentData.systemRequirements.storage && (
                        <div className={styles.infoItem}>
                          <Caption1 className={styles.infoLabel}>存储空间</Caption1>
                          <Text className={styles.infoValue}>{currentData.systemRequirements.storage}</Text>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* 启动信息 */}
              {currentData.openname && (
                <>
                  <Divider />
                  <div>
                    <Subtitle1 style={{ marginBottom: '8px' }}>启动信息</Subtitle1>
                    <div className={styles.infoItem}>
                      <Caption1 className={styles.infoLabel}>启动文件</Caption1>
                      <Text className={styles.infoValue}>{currentData.openname}</Text>
                    </div>
                    <Caption1 style={{ color: 'var(--colorNeutralForeground3)', marginTop: '4px' }}>
                      下载解压后，可通过此文件启动软件
                    </Caption1>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button appearance="secondary" onClick={onClose}>
            关闭
          </Button>

          {/* 下载限制提示 */}
          {!downloadLimitInfo.canDownload && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--colorPaletteRedForeground1)',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {downloadLimitInfo.reason}
            </div>
          )}

          {downloadStatus.isDownloaded ? (
            <>
              <Button
                appearance="outline"
                onClick={() => downloadStatus.filePath && handleOpenFolder(downloadStatus.filePath)}
                disabled={!downloadStatus.filePath}
              >
                打开文件位置
              </Button>
              <Button
                appearance="primary"
                icon={isDownloading ? <Spinner size="tiny" /> : <ArrowDownload24Regular />}
                onClick={() => handleDownload(true)}
                disabled={isDownloading || !currentData.latestDownloadUrl || !downloadLimitInfo.canDownload}
                className={styles.downloadButton}
              >
                {isDownloading ? '重新下载中...' : '重新下载'}
              </Button>
            </>
          ) : (
            <Button
              appearance="primary"
              icon={isDownloading ? <Spinner size="tiny" /> : <ArrowDownload24Regular />}
              onClick={() => handleDownload(false)}
              disabled={isDownloading || !currentData.latestDownloadUrl || !downloadLimitInfo.canDownload}
              className={styles.downloadButton}
            >
              {isDownloading ? '下载中...' : downloadLimitInfo.canDownload ? '下载软件' : `等待 ${downloadLimitInfo.remainingTime || 0}s`}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
