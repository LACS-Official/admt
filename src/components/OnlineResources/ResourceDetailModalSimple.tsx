import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Badge,
  Divider,
  Body1,
  Caption1,
  Title3,
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

  // 当弹窗打开时获取详细信息和下载状态
  useEffect(() => {
    if (isOpen && software.id) {
      fetchSoftwareDetail();
      checkDownloadStatus();
    }
  }, [isOpen, software.id]);

  // 当详细信息加载完成后重新检查下载状态
  useEffect(() => {
    if (detailData) {
      checkDownloadStatus();
    }
  }, [detailData]);

  // 处理下载
  const handleDownload = async (forceRedownload = false) => {
    const currentData = detailData || software;
    if (onDownload && currentData.latestDownloadUrl) {
      setIsDownloading(true);
      try {
        const taskId = await onDownload(currentData);

        // 显示下载成功消息
        console.log('✅ 下载任务已启动:', taskId);

        // 重新检查下载状态
        setTimeout(() => {
          checkDownloadStatus();
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
                disabled={isDownloading || !currentData.latestDownloadUrl}
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
              disabled={isDownloading || !currentData.latestDownloadUrl}
              className={styles.downloadButton}
            >
              {isDownloading ? '下载中...' : '下载软件'}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
