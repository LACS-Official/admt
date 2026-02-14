
/*
在线资源-资源详情弹窗页面
*/
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
  ArrowDownload24Regular,
  Apps24Regular,
  Info20Regular,
} from '@fluentui/react-icons';
import { 
    mergeClasses,
    shorthands,
    ProgressBar 
} from '@fluentui/react-components';
import { OnlineSoftware, DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';
import { logService } from '../../services/logService';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '400px',
    maxHeight: '70vh',
    overflowY: 'auto',
    margin: '16px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--colorNeutralForeground3)',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: '13px',
    color: 'var(--colorNeutralForeground1)',
    fontWeight: '500',
  },
  downloadButton: {
    minWidth: '140px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  descriptionContainer: {
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    color: 'var(--colorNeutralForeground2)',
    lineHeight: '1.6',
  },
  dialogSurface: {
    maxWidth: '560px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'var(--colorNeutralBackground3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke3)'),
  },
  iconImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  warningBox: {
    backgroundColor: 'var(--colorNeutralBackground4)', 
    ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke2)'), 
    ...shorthands.borderRadius('8px'), 
    ...shorthands.padding('12px'), 
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '16px'
  },
  warningText: {
    color: 'var(--colorNeutralForeground3)', 
    fontSize: '13px',
    lineHeight: '1.4',
  }
});

// 打开链接的通用函数
const openUrl = (url: string) => {
  import('@tauri-apps/plugin-shell').then(({ open }) => {
    open(url).catch((error) => {
      logService.error(`打开外部链接失败: ${url}`, '在线资源UI', { error: String(error) });
      // 如果 Tauri shell 插件不可用，使用 window.open
      window.open(url, '_blank');
    });
  }).catch((err) => {
    logService.error('加载 shell 插件失败', '在线资源UI', { error: String(err) });
    // 如果 Tauri shell 插件不可用，使用 window.open
    window.open(url, '_blank');
  });
};

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
      logService.error(`获取资源详情失败: ${software.name}`, '在线资源UI', { error: String(error) });
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
      logService.warning(`下载受限: ${limitCheck.reason}`, '在线资源UI');
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
      await logService.info(`已通过详情页打开文件夹: ${path}`, '在线资源UI', { softwareName: currentData.name });
    } catch (error) {
      logService.error(`打开文件夹失败: ${currentData.name}`, '在线资源UI', { error: String(error) });
    }
  };

  //使用appfun下载
  const OpenWithAppfun = () => {
    openUrl(`https://www.appfun.fun/software/${currentData.id}`);
  };

  const currentData = detailData || software;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle>
          <div className={styles.modalHeader}>
            <div className={styles.iconWrapper}>
              {currentData.iconUrl ? (
                <img src={currentData.iconUrl} className={styles.iconImage} alt={currentData.name} />
              ) : (
                <Apps24Regular />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text size={400} weight="semibold">资源：{currentData.name}</Text>
              <Caption1 style={{ color: 'var(--colorNeutralForeground3)' }}>
                {currentData.category || '软件资源'} • v{currentData.currentVersion}
              </Caption1>
            </div>
          </div>
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
                    <Subtitle1 style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>详细说明</Subtitle1>
                    <Body1 className={styles.descriptionContainer}>{currentData.description}</Body1>
                  </div>
                </>
              )}

              {/* 系统要求 - 条件隐藏 */}
              {currentData.systemRequirements && 
               (currentData.systemRequirements.os || currentData.systemRequirements.memory || currentData.systemRequirements.storage) && (
                <>
                  <Divider />
                  <div>
                    <Subtitle1 style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>运行环境</Subtitle1>
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

              {/* 启动信息 - 条件隐藏 */}
              {currentData.openname && (
                <>
                  <Divider />
                  <div>
                    <Subtitle1 style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>开发者备注 / 启动项</Subtitle1>
                    <div style={{ backgroundColor: 'var(--colorNeutralBackground3)', padding: '12px', borderRadius: '8px' }}>
                      <div className={styles.infoItem}>
                        <Caption1 className={styles.infoLabel}>执行入口</Caption1>
                        <Text className={styles.infoValue}>{currentData.openname}</Text>
                      </div>
                      <Caption1 style={{ color: 'var(--colorNeutralForeground3)', marginTop: '8px', display: 'block' }}>
                        💡 提示：下载并自动解压后，该文件通常位于软件根目录下。
                      </Caption1>
                    </div>
                  </div>
                </>
              )}

              {/* 底部警告框 - 降噪移位 */}
              <div className={styles.warningBox}>
                <Info20Regular style={{ color: 'var(--colorNeutralForeground3)', marginTop: '2px' }} />
                <div className={styles.warningText}>
                  若由于网络原因下载资源频繁失败或文件校验错误，请尝试使用“Appfun”外部渠道进行手动获取。
                </div>
              </div>
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button appearance="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button appearance="secondary" onClick={OpenWithAppfun}>
            使用Appfun下载
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
              {isDownloading ? '下载中...' : downloadLimitInfo.canDownload ? '下载资源' : `等待 ${downloadLimitInfo.remainingTime || 0}s`}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
