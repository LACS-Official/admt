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
  Badge,
} from '@fluentui/react-components';
import {
  ArrowDownload20Regular,
  Apps20Regular,
  Info20Regular,
  Play20Regular,
  FolderOpen20Regular,
  Open20Regular,
} from '@fluentui/react-icons';
import { 
    shorthands,
} from '@fluentui/react-components';
import { OnlineSoftware } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';
import { logService } from '../../services/logService';
import { useAppStore } from '../../stores/appStore';
import {
  detectNetdiskLink,
  extractHttpUrl,
  isNetdiskRedirectError,
  openInBrowser,
} from '../../utils/netdiskLink';

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
    ...shorthands.borderRadius('12px'),
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
    minWidth: '130px',
  },
  launchButton: {
    minWidth: '130px',
  },
  pillButton: {
    borderRadius: '9999px',
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
    maxWidth: '580px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.borderRadius('14px'),
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    ...shorthands.padding('12px', '14px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'var(--colorPaletteRedBorder1)'),
    backgroundColor: 'var(--colorPaletteRedBackground1)',
  },
  errorText: {
    flex: 1,
    fontSize: '12px',
    lineHeight: '18px',
    color: 'var(--colorNeutralForeground1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
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
    ...shorthands.borderRadius('12px'), 
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
  },
  executableCard: {
    backgroundColor: 'var(--colorNeutralBackground3)',
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('12px'),
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  executableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});

// 打开链接的通用函数（统一走网盘工具里的 URL 提取与多重浏览器回退）
const openUrl = (url: string) => {
  void openInBrowser(url).then((ok) => {
    if (!ok) {
      logService.error(`打开外部链接失败: ${url}`, '在线资源UI');
    }
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
  const { setStatusBarMessage, globalDownload } = useAppStore();
  const [detailData, setDetailData] = useState<OnlineSoftware | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
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
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
        checkDownloadLimits();
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

  useEffect(() => {
    if (isOpen && software.id) {
      setDownloadError(null);
      fetchSoftwareDetail();
      checkDownloadStatus();
      checkDownloadLimits();
    }
  }, [isOpen, software.id]);

  useEffect(() => {
    if (detailData) {
      checkDownloadStatus();
    }
  }, [detailData]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        checkDownloadLimits();
        checkDownloadStatus();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

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

    // 网盘分享页不是文件直链：任何入口都不应把它送进后端写盘
    const netdisk = detectNetdiskLink(currentData.latestDownloadUrl);
    if (netdisk) {
      setDownloadError(null);
      openUrl(netdisk.url);
      return;
    }

    const limitCheck = onlineResourcesService.canStartDownload();
    if (!limitCheck.canDownload) {
      logService.warning(`下载受限: ${limitCheck.reason}`, '在线资源UI');
      return;
    }

    if (onDownload && currentData.latestDownloadUrl) {
      setIsDownloading(true);
      setDownloadError(null);
      try {
        const taskId = await onDownload(currentData);
        console.log(' 下载任务已启动:', taskId);

        setTimeout(() => {
          checkDownloadStatus();
          checkDownloadLimits();
        }, 1000);
      } catch (error) {
        // service 层已打开浏览器并通过状态栏提示，这里不再显示「下载失败」
        if (!isNetdiskRedirectError(error)) {
          setDownloadError(error instanceof Error ? error.message : String(error));
        }
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

  // 运行启动程序
  const handleLaunchExecutable = async () => {
    if (!downloadStatus.filePath) {
      setStatusBarMessage({
        type: "warning",
        message: "尚未找到已下载文件，请先下载此资源",
      });
      return;
    }

    setIsLaunching(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res = await invoke<string>('launch_software_resource', {
        path: downloadStatus.filePath,
        openname: currentData.openname || null,
      });

      setStatusBarMessage({
        type: "success",
        message: res || `已成功启动 ${currentData.openname || currentData.name}`,
      });
      await logService.info(`已在弹窗内成功启动程序: ${currentData.name}`, '在线资源UI', {
        path: downloadStatus.filePath,
        openname: currentData.openname,
      });
    } catch (error: any) {
      const errStr = error?.message || String(error);
      setStatusBarMessage({
        type: "error",
        message: `启动失败: ${errStr}`,
      });
      await logService.error(`启动程序异常: ${currentData.name}`, '在线资源UI', { error: errStr });
    } finally {
      setIsLaunching(false);
    }
  };

  // 使用appfun下载
  const OpenWithAppfun = () => {
    const url = `https://appfun.lacs.cc/software/${currentData.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setStatusBarMessage({
        type: "success",
        message: "链接已复制到剪贴板！正在尝试打开浏览器，若未成功打开请手动粘贴访问。"
      });
    }).catch((err) => {
      console.error("复制到剪贴板失败:", err);
    });
    openUrl(url);
  };

  const currentData = detailData || software;
  const hasDownloadUrl = !!currentData.latestDownloadUrl;
  const netdisk = detectNetdiskLink(currentData.latestDownloadUrl);
  const isNetdisk = !!netdisk;
  // 已在打开弹窗时识别出网盘，就不必等一次注定失败的下载来判定落地页
  const isWebPage =
    !isNetdisk &&
    !!downloadError &&
    (downloadError.includes('DOWNLOAD_PAGE_REQUIRED') || downloadError.includes('网页下载页'));
  const shouldOpenBrowser = isNetdisk || isWebPage;

  // 统一取出可打开的 URL：网盘文本可能夹带「提取码: xxxx」等说明
  const openExternal = () => {
    const url = netdisk?.url || extractHttpUrl(currentData.latestDownloadUrl || '');
    if (url) openUrl(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle>
          <div className={styles.modalHeader}>
            <div className={styles.iconWrapper}>
              {currentData.iconUrl ? (
                <img src={currentData.iconUrl} className={styles.iconImage} alt={currentData.name} />
              ) : (
                <Apps20Regular />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text size={400} weight="semibold">资源：{currentData.name}</Text>
                {downloadStatus.isDownloaded && (
                  <Badge color="success" appearance="tint" size="small">
                    已就绪
                  </Badge>
                )}
              </div>
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
              {isNetdisk && (
                <div className={styles.warningBox} style={{ marginTop: 0 }}>
                  <Info20Regular style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div className={styles.warningText}>
                    该资源由{netdisk?.label}分享，不是文件直链。点击底部按钮跳转浏览器后，请在网页中完成提取码与下载操作。
                  </div>
                </div>
              )}

              {downloadError && !isNetdisk && (
                <div className={styles.errorBox}>
                  <Info20Regular style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div className={styles.errorText}>
                    {isWebPage
                      ? '该资源提供的是网页下载页（网盘或跳转页），应用无法直接取得文件。请在浏览器中完成下载。'
                      : `下载失败：${downloadError}`}
                  </div>
                  {isWebPage && hasDownloadUrl && (
                    <Button
                      appearance="outline"
                      size="small"
                      icon={<Open20Regular />}
                      onClick={openExternal}
                    >
                      打开下载页
                    </Button>
                  )}
                </div>
              )}

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

              {/* 启动信息与快速启动卡片 */}
              {currentData.openname && (
                <>
                  <Divider />
                  <div>
                    <Subtitle1 style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>
                      启动程序 / 执行入口
                    </Subtitle1>
                    <div className={styles.executableCard}>
                      <div className={styles.executableHeader}>
                        <div className={styles.infoItem}>
                          <Caption1 className={styles.infoLabel}>执行文件名</Caption1>
                          <Text className={styles.infoValue} weight="semibold">{currentData.openname}</Text>
                        </div>
                        {downloadStatus.isDownloaded ? (
                          <Button
                            appearance="primary"
                            size="small"
                            icon={isLaunching ? <Spinner size="tiny" /> : <Play20Regular />}
                            onClick={handleLaunchExecutable}
                            disabled={isLaunching || !downloadStatus.filePath}
                          >
                            {isLaunching ? "正在启动..." : "直接运行"}
                          </Button>
                        ) : (
                          <Badge color="warning" appearance="tint">
                            未下载
                          </Badge>
                        )}
                      </div>
                      <Caption1 style={{ color: 'var(--colorNeutralForeground3)' }}>
                         提示：下载解压后，可在此弹窗或下载管理中直接一键启动该程序。
                      </Caption1>
                    </div>
                  </div>
                </>
              )}

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

              {/* 底部警告框 */}
              <div className={styles.warningBox}>
                <Info20Regular style={{ color: 'var(--colorNeutralForeground3)', marginTop: '2px' }} />
                <div className={styles.warningText}>
                  若由于网络原因下载资源频繁失败或文件校验错误，请尝试使用“Appfun”外部渠道进行手动获取。
                </div>
              </div>
            </>
          )}
        </DialogContent>
        
        {/* 动态下载进度与微动效条 */}
        {(isDownloading || (globalDownload && globalDownload.status === 'downloading')) && (
          <div style={{ padding: '0 24px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--colorBrandForeground1)', fontWeight: 500 }}>
                <Spinner size="extra-tiny" />
                正在下载资源中...
              </span>
              <span style={{ fontWeight: 600, color: 'var(--colorBrandForeground1)' }}>
                {globalDownload?.progress || 15}%
                {globalDownload?.speedText && (
                  <span style={{ fontSize: '11px', color: 'var(--colorNeutralForeground3)', marginLeft: '6px', fontWeight: 400 }}>
                    {globalDownload.speedText}
                  </span>
                )}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: 'var(--colorNeutralStroke2)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.max(6, Math.min(100, globalDownload?.progress || 15))}%`,
                height: '100%',
                borderRadius: '9999px',
                backgroundColor: 'var(--colorBrandBackground)',
                transition: 'width 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
              }} />
            </div>
          </div>
        )}

        <DialogActions>
          <Button appearance="secondary" className={styles.pillButton} onClick={onClose}>
            关闭
          </Button>
          <Button appearance="secondary" className={styles.pillButton} onClick={OpenWithAppfun}>
            Appfun 渠道
          </Button>

          {/* 下载限制提示 */}
          {!downloadLimitInfo.canDownload && !shouldOpenBrowser && (
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
                className={styles.pillButton}
                icon={<FolderOpen20Regular />}
                onClick={() => downloadStatus.filePath && handleOpenFolder(downloadStatus.filePath)}
                disabled={!downloadStatus.filePath}
              >
                打开位置
              </Button>
              <Button
                appearance="subtle"
                className={styles.pillButton}
                icon={shouldOpenBrowser ? <Open20Regular /> : isDownloading ? <Spinner size="tiny" /> : <ArrowDownload20Regular />}
                onClick={() => (shouldOpenBrowser ? openExternal() : handleDownload(true))}
                disabled={isDownloading || !hasDownloadUrl || (!shouldOpenBrowser && !downloadLimitInfo.canDownload)}
              >
                {isNetdisk
                  ? `在浏览器打开${netdisk?.label}`
                  : isWebPage
                  ? '打开下载页'
                  : '重新下载'}
              </Button>
              <Button
                appearance="primary"
                icon={isLaunching ? <Spinner size="tiny" /> : <Play20Regular />}
                onClick={handleLaunchExecutable}
                disabled={isLaunching || !downloadStatus.filePath}
                className={`${styles.launchButton} ${styles.pillButton}`}
              >
                {isLaunching ? '正在启动...' : `运行程序${currentData.openname ? ` (${currentData.openname})` : ''}`}
              </Button>
            </>
          ) : (
            <Button
              appearance="primary"
              className={`${styles.downloadButton} ${styles.pillButton}`}
              icon={shouldOpenBrowser ? <Open20Regular /> : isDownloading ? <Spinner size="tiny" /> : <ArrowDownload20Regular />}
              onClick={() => (shouldOpenBrowser ? openExternal() : handleDownload(false))}
              disabled={isDownloading || !hasDownloadUrl || (!shouldOpenBrowser && !downloadLimitInfo.canDownload)}
            >
              {isDownloading
                ? '下载中...'
                : isNetdisk
                ? `在浏览器打开${netdisk?.label}`
                : isWebPage
                ? '在浏览器打开下载页'
                : !hasDownloadUrl
                ? '暂无下载链接'
                : downloadLimitInfo.canDownload
                ? '下载资源'
                : `等待 ${downloadLimitInfo.remainingTime || 0}s`}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
