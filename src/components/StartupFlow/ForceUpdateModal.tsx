/**
 * 强制更新弹窗组件
 * 当检测到新版本且需要强制更新时显示
 */

import React, { useEffect, useState }  from 'react';
import {
  makeStyles,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Body1,
  Caption1,
  Title2,
  Spinner,
  MessageBar,
  Badge,
} from '@fluentui/react-components';
import {
  Open24Regular,
  Warning24Filled,
  Checkmark24Regular,
  LinkSquare24Regular,
} from '@fluentui/react-icons';
import { VersionCheckResult } from '../../stores/startupFlowStore';
import { API_CONFIG, API_ENDPOINTS, getApiBaseUrl, getDefaultHeaders } from '../../config/api';
import { formatVersionReleaseDate } from '../../utils/dateFormatter';

// API版本信息接口
interface ApiVersionInfo {
  id: number;
  version: string;
  releaseDate: string;
  releaseNotes: string;
  downloadLinks: {
    official?: string;
    quark?: string;
    baidu?: string;
    github?: string;
  };
  fileSize?: string;
  fileSizeBytes?: number;
  isStable: boolean;
  versionType: string;
}

const useStyles = makeStyles({
  dialog: {
    maxWidth: '600px',
    width: '90vw',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  warningIcon: {
    color: '#d83b01',
    fontSize: '24px',
  },
  versionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f3f2f1',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  versionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  releaseNotes: {
    marginTop: '16px',
    marginBottom: '16px',
  },
  releaseNotesContent: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e1e5e9',
  },
  releaseInfo: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
  },
  fileInfo: {
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
  },
  notesList: {
    marginTop: '8px',
    paddingLeft: '0',
    listStyle: 'none',
  },
  noteItem: {
    marginBottom: '8px',
    paddingLeft: '20px',
    position: 'relative',
    '&::before': {
      content: '"•"',
      position: 'absolute',
      left: '0',
      color: '#605e5c',
      fontWeight: 'bold',
    },
  },
  downloadSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#fff4ce',
    borderRadius: '8px',
    border: '1px solid #ffb900',
  },
  downloadProgress: {
    marginTop: '12px',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  forceUpdateWarning: {
    marginBottom: '16px',
  },
  loadingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
  },
});

interface ForceUpdateModalProps {
  isOpen: boolean;
  versionCheckResult: VersionCheckResult;
  onUpdateStart: () => void;
  onUpdateComplete: () => void;
  onError: (error: string) => void;
}

const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({
  isOpen,
  versionCheckResult,
  onUpdateStart: _onUpdateStart,
  onUpdateComplete,
  onError: _onError,
}) => {
  const styles = useStyles();
  const [isCompleted, setIsCompleted] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState<ApiVersionInfo | null>(null);
  const [isLoadingVersionInfo, setIsLoadingVersionInfo] = useState(false);

  /**
   * 获取最新版本的详细信息
   */
  const fetchLatestVersionInfo = async (): Promise<ApiVersionInfo | null> => {
    try {
      setIsLoadingVersionInfo(true);

      const baseUrl = getApiBaseUrl();
      const endpoint = API_ENDPOINTS.VERSIONS.LIST(API_CONFIG.SOFTWARE_ID);
      const url = `${baseUrl}${endpoint}?limit=1&sortBy=releaseDate&sortOrder=desc&isStable=true`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getDefaultHeaders(),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error('无法获取版本信息');
      }

      const versionInfo = data.data[0] as ApiVersionInfo;
      setLatestVersionInfo(versionInfo);
      return versionInfo;
    } catch (error) {
      console.error('获取版本信息失败:', error);
      return null;
    } finally {
      setIsLoadingVersionInfo(false);
    }
  };

  // 在组件加载时获取最新版本信息
  useEffect(() => {
    if (isOpen && !latestVersionInfo) {
      fetchLatestVersionInfo();
    }
  }, [isOpen]);

  const { updateInfo } = versionCheckResult;

  const handleOpenDownloadPage = async () => {
    let downloadUrl = '';

    // 首先尝试从API获取最新版本信息
    let versionInfo = latestVersionInfo;
    if (!versionInfo) {
      versionInfo = await fetchLatestVersionInfo();
    }

    // 优先使用API返回的下载链接
    if (versionInfo?.downloadLinks?.official) {
      downloadUrl = versionInfo.downloadLinks.official;
    } else if (versionInfo?.downloadLinks?.github) {
      downloadUrl = versionInfo.downloadLinks.github;
    } else if (versionInfo?.downloadLinks?.quark) {
      downloadUrl = versionInfo.downloadLinks.quark;
    } else if (versionInfo?.downloadLinks?.baidu) {
      downloadUrl = versionInfo.downloadLinks.baidu;
    } else if (versionCheckResult?.updateInfo?.downloadUrl) {
      // 降级到启动流程中的下载链接（startupFlowStore 中的数据结构）
      downloadUrl = versionCheckResult.updateInfo.downloadUrl;
    } else if (updateInfo?.downloadUrl) {
      downloadUrl = updateInfo.downloadUrl;
    }

    if (!downloadUrl) {
      // 如果没有下载链接，提供一个默认的下载页面
      downloadUrl = 'https://admt.lacs.cc/download';
      console.warn('没有可用的下载链接，使用默认下载页面');
    }

    // 使用 Tauri 的 shell API 在 Windows 默认浏览器中打开链接
    import('@tauri-apps/plugin-shell').then(({ open }) => {
      // 使用 Tauri shell API 打开默认浏览器
      open(downloadUrl).then(() => {
        console.log('成功在默认浏览器中打开下载链接:', downloadUrl);
        // 成功打开浏览器后，标记为完成
        setIsCompleted(true);
        onUpdateComplete();
      }).catch((error) => {
        console.error('Tauri shell API 打开浏览器失败:', error);
        // 降级到 window.open（在 Tauri 环境中可能不工作）
        try {
          window.open(downloadUrl, '_blank');
          console.log('降级使用 window.open 打开链接');
          setIsCompleted(true);
          onUpdateComplete();
        } catch (fallbackError) {
          console.error('window.open 也失败了:', fallbackError);
          // 如果都失败了，至少标记为完成，让用户知道需要手动打开
          setIsCompleted(true);
          onUpdateComplete();
        }
      });
    }).catch((shellError) => {
      console.error('无法加载 Tauri shell 插件:', shellError);
      // 如果 Tauri shell 插件不可用，尝试使用 window.open
      try {
        window.open(downloadUrl, '_blank');
        console.log('使用 window.open 作为备选方案');
        setIsCompleted(true);
        onUpdateComplete();
      } catch (windowError) {
        console.error('window.open 备选方案也失败:', windowError);
        setIsCompleted(true);
        onUpdateComplete();
      }
    });
  };



  const handleManualDownload = async () => {
    let downloadUrl = '';

    // 首先尝试从API获取最新版本信息
    let versionInfo = latestVersionInfo;
    if (!versionInfo) {
      versionInfo = await fetchLatestVersionInfo();
    }

    // 优先使用API返回的下载链接
    if (versionInfo?.downloadLinks?.official) {
      downloadUrl = versionInfo.downloadLinks.official;
    } else if (versionInfo?.downloadLinks?.github) {
      downloadUrl = versionInfo.downloadLinks.github;
    } else if (versionInfo?.downloadLinks?.quark) {
      downloadUrl = versionInfo.downloadLinks.quark;
    } else if (versionInfo?.downloadLinks?.baidu) {
      downloadUrl = versionInfo.downloadLinks.baidu;
    } else if (versionCheckResult?.updateInfo?.downloadUrl) {
      // 降级到启动流程中的下载链接（startupFlowStore 中的数据结构）
      downloadUrl = versionCheckResult.updateInfo.downloadUrl;
    } else if (updateInfo?.downloadUrl) {
      downloadUrl = updateInfo.downloadUrl;
    }

    if (!downloadUrl) {
      // 如果没有下载链接，提供一个默认的下载页面
      downloadUrl = 'https://admt.lacs.cc/download';
    }

    // 使用 Tauri 的 shell API 在 Windows 默认浏览器中打开链接
    import('@tauri-apps/plugin-shell').then(({ open }) => {
      // 使用 Tauri shell API 打开默认浏览器
      open(downloadUrl).then(() => {
        console.log('成功在默认浏览器中打开下载链接:', downloadUrl);
      }).catch((error) => {
        console.error('Tauri shell API 打开浏览器失败:', error);
        // 降级到 window.open（在 Tauri 环境中可能不工作）
        try {
          window.open(downloadUrl, '_blank');
          console.log('降级使用 window.open 打开链接');
        } catch (fallbackError) {
          console.error('window.open 也失败了:', fallbackError);
        }
      });
    }).catch((shellError) => {
      console.error('无法加载 Tauri shell 插件:', shellError);
      // 如果 Tauri shell 插件不可用，尝试使用 window.open
      try {
        window.open(downloadUrl, '_blank');
        console.log('使用 window.open 作为备选方案');
      } catch (windowError) {
        console.error('window.open 备选方案也失败:', windowError);
      }
    });
  };

  const renderContent = () => {
    if (isCompleted) {
      return (
        <>
          <div className={styles.header}>
            <Checkmark24Regular style={{ color: '#107c10', fontSize: '24px' }} />
            <Title2>下载完成</Title2>
          </div>
          
          <Body1>
            新版本已下载完成，请安装后重新启动应用。
          </Body1>
          
          <MessageBar intent="success" style={{ marginTop: '16px' }}>
            安装完成后，应用将自动重启并应用新版本。
          </MessageBar>
        </>
      );
    }

    return (
      <>
        <div className={styles.header}>
          <Warning24Filled className={styles.warningIcon} />
          <Title2>需要更新</Title2>
        </div>

        {updateInfo?.isForced && (
          <MessageBar intent="warning" className={styles.forceUpdateWarning}>
            此更新为强制更新，必须安装后才能继续使用应用。
          </MessageBar>
        )}

        <div className={styles.versionInfo}>
          <div>
            <Text weight="semibold">当前版本</Text>
            <div className={styles.versionBadge}>
              <Badge appearance="outline">{versionCheckResult.currentVersion}</Badge>
            </div>
          </div>
          <div>
            <Text weight="semibold">最新版本</Text>
            <div className={styles.versionBadge}>
              <Badge appearance="filled" color="brand">
                {latestVersionInfo?.version || versionCheckResult.latestVersion}
              </Badge>
            </div>
          </div>
        </div>

        <Body1>{updateInfo?.description}</Body1>

        {/* 显示更新内容 - 优先使用API数据 */}
        {(latestVersionInfo?.releaseNotes || versionCheckResult?.updateInfo?.releaseNotes) && (
          <div className={styles.releaseNotes}>
            <Text weight="semibold">更新内容:</Text>
            <div className={styles.releaseNotesContent}>
              <Caption1>
                {latestVersionInfo?.releaseNotes || versionCheckResult?.updateInfo?.releaseNotes}
              </Caption1>
            </div>
          </div>
        )}

        {/* 显示版本发布时间 - 优先使用API数据 */}
        {(latestVersionInfo?.releaseDate || versionCheckResult?.updateInfo?.releaseDate) && (
          <div className={styles.releaseInfo}>
            <Caption1>
              发布时间: {formatVersionReleaseDate(
                latestVersionInfo?.releaseDate || versionCheckResult?.updateInfo?.releaseDate
              )}
            </Caption1>
          </div>
        )}

        {/* 显示文件大小信息 */}
        {latestVersionInfo?.fileSize && (
          <div className={styles.releaseInfo}>
            <Caption1>
              文件大小: {latestVersionInfo.fileSize}
            </Caption1>
          </div>
        )}

        {/* 显示加载状态 */}
        {isLoadingVersionInfo && (
          <div className={styles.loadingInfo}>
            <Spinner size="tiny" />
            <Caption1>正在获取版本信息...</Caption1>
          </div>
        )}

        {/* 显示文件大小 */}
        {versionCheckResult?.updateInfo?.fileSize && (
          <div className={styles.fileInfo}>
            <Caption1>
              文件大小: {versionCheckResult.updateInfo.fileSize}
            </Caption1>
          </div>
        )}


      </>
    );
  };

  const renderActions = () => {
    if (isCompleted) {
      return (
        <Button appearance="primary" onClick={onUpdateComplete}>
          完成
        </Button>
      );
    }

    return (
      <div className={styles.actions}>
        {!updateInfo?.isForced && (
          <Button appearance="secondary" onClick={handleManualDownload}>
            <LinkSquare24Regular />
            手动下载
          </Button>
        )}
        <Button
          appearance="primary"
          icon={<Open24Regular />}
          onClick={handleOpenDownloadPage}
        >
          前往下载
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} modalType="modal">
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>{updateInfo?.title || '版本更新'}</DialogTitle>
          <DialogContent>
            {renderContent()}
          </DialogContent>
          <DialogActions>
            {renderActions()}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ForceUpdateModal;
