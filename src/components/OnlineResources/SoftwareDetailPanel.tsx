import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Card,
  Badge,
  Spinner,
  ProgressBar,
  Divider,
  Body1,
  Caption1,
  Title2,
  Title3,
  Link,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowDownload24Regular,
  Globe24Regular,
  Person24Regular,
  Calendar24Regular,
  Tag24Regular,
  Info24Regular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { OnlineSoftware, DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
    gap: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  backButton: {
    minWidth: 'auto',
    padding: '8px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  mainCard: {
    padding: '24px',
  },
  softwareHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  versionBadge: {
    fontSize: '12px',
  },
  metaInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '8px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--colorNeutralForeground2)',
  },
  description: {
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  infoSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    marginBottom: '12px',
    fontWeight: '600',
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
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '13px',
  },
  tagContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: '11px',
    padding: '2px 8px',
  },
  downloadSection: {
    padding: '20px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  downloadHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  downloadButton: {
    minWidth: '120px',
  },
  downloadProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
    gap: '12px',
  },
  errorMessage: {
    color: 'var(--colorPaletteRedForeground1)',
    fontSize: '14px',
    textAlign: 'center',
    padding: '16px',
    backgroundColor: 'var(--colorPaletteRedBackground1)',
    borderRadius: '4px',
    border: '1px solid var(--colorPaletteRedBorder1)',
  },
});

interface SoftwareDetailPanelProps {
  softwareId: number;
  onBack: () => void;
}

const SoftwareDetailPanel: React.FC<SoftwareDetailPanelProps> = ({ softwareId, onBack }) => {
  const styles = useStyles();
  const [software, setSoftware] = useState<OnlineSoftware | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadTask, setDownloadTask] = useState<DownloadTask | null>(null);

  // 加载软件详情
  const loadSoftwareDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await onlineResourcesService.getSoftwareDetail(softwareId);
      
      if (result) {
        setSoftware(result);
      } else {
        setError('软件详情不存在或已被删除');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取软件详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 下载软件
  const handleDownload = async () => {
    if (!software) return;

    try {
      const taskId = await onlineResourcesService.downloadSoftware(software);
      const task = onlineResourcesService.getDownloadTask(taskId);
      
      if (task) {
        setDownloadTask(task);
        
        // 监听下载进度
        const progressInterval = setInterval(() => {
          const updatedTask = onlineResourcesService.getDownloadTask(taskId);
          if (updatedTask) {
            setDownloadTask(updatedTask);
            
            if (updatedTask.status === 'completed' || updatedTask.status === 'failed' || updatedTask.status === 'cancelled') {
              clearInterval(progressInterval);
            }
          }
        }, 1000);
      }
    } catch (err) {
      console.error('下载失败:', err);
      setError(err instanceof Error ? err.message : '下载失败');
    }
  };

  // 取消下载
  const handleCancelDownload = async () => {
    if (downloadTask) {
      await onlineResourcesService.cancelDownload(downloadTask.id);
      setDownloadTask(null);
    }
  };

  // 获取下载按钮属性
  const getDownloadButtonProps = () => {
    if (!downloadTask) {
      return {
        children: '下载软件',
        icon: <ArrowDownload24Regular />,
        onClick: handleDownload,
        disabled: !software?.latestDownloadUrl,
        appearance: 'primary' as const,
      };
    }

    switch (downloadTask.status) {
      case 'downloading':
        return {
          children: '取消下载',
          icon: <Dismiss24Regular />,
          onClick: handleCancelDownload,
          appearance: 'secondary' as const,
        };
      case 'completed':
        return {
          children: '下载完成',
          icon: <CheckmarkCircle24Filled />,
          disabled: true,
          appearance: 'primary' as const,
        };
      case 'failed':
        return {
          children: '重新下载',
          icon: <ArrowDownload24Regular />,
          onClick: handleDownload,
          appearance: 'secondary' as const,
        };
      default:
        return {
          children: '下载软件',
          icon: <ArrowDownload24Regular />,
          onClick: handleDownload,
          disabled: !software?.latestDownloadUrl,
          appearance: 'primary' as const,
        };
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '未知大小';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // 初始化加载
  useEffect(() => {
    loadSoftwareDetail();
  }, [softwareId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button
            className={styles.backButton}
            icon={<ArrowLeft24Regular />}
            onClick={onBack}
            appearance="subtle"
          />
          <Title2>软件详情</Title2>
        </div>
        <div className={styles.loadingContainer}>
          <Spinner label="正在加载软件详情..." />
        </div>
      </div>
    );
  }

  if (error || !software) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button
            className={styles.backButton}
            icon={<ArrowLeft24Regular />}
            onClick={onBack}
            appearance="subtle"
          />
          <Title2>软件详情</Title2>
        </div>
        <div className={styles.errorContainer}>
          <ErrorCircle24Filled style={{ fontSize: '48px', color: 'var(--colorPaletteRedForeground1)' }} />
          <Body1>加载失败</Body1>
          <div className={styles.errorMessage}>
            {error || '软件详情不存在'}
          </div>
          <Button onClick={loadSoftwareDetail}>重试</Button>
        </div>
      </div>
    );
  }

  const buttonProps = getDownloadButtonProps();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          className={styles.backButton}
          icon={<ArrowLeft24Regular />}
          onClick={onBack}
          appearance="subtle"
        />
        <Title2>软件详情</Title2>
      </div>

      <div className={styles.content}>
        <Card className={styles.mainCard}>
          <div className={styles.softwareHeader}>
            <div className={styles.titleRow}>
              <Title3>{software.name}</Title3>
              <Badge className={styles.versionBadge} appearance="outline">
                v{software.currentVersion}
              </Badge>
            </div>

            <div className={styles.metaInfo}>
              {software.metadata?.developer && (
                <div className={styles.metaItem}>
                  <Person24Regular />
                  <span>{software.metadata.developer}</span>
                </div>
              )}
              <div className={styles.metaItem}>
                <Calendar24Regular />
                <span>更新于 {formatDate(software.updatedAt)}</span>
              </div>
              {software.category && (
                <div className={styles.metaItem}>
                  <Tag24Regular />
                  <span>{software.category}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.description}>
            <Body1>{software.description}</Body1>
          </div>

          {software.tags && software.tags.length > 0 && (
            <div className={styles.infoSection}>
              <Text className={styles.sectionTitle}>标签</Text>
              <div className={styles.tagContainer}>
                {software.tags.map((tag, index) => (
                  <Badge key={index} className={styles.tag} appearance="tint">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Divider />

          <div className={styles.infoSection}>
            <Text className={styles.sectionTitle}>软件信息</Text>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Caption1 className={styles.infoLabel}>当前版本</Caption1>
                <Text className={styles.infoValue}>{software.currentVersion}</Text>
              </div>
              
              {software.metadata?.license && (
                <div className={styles.infoItem}>
                  <Caption1 className={styles.infoLabel}>许可证</Caption1>
                  <Text className={styles.infoValue}>{software.metadata.license}</Text>
                </div>
              )}
              
              {software.metadata?.platform && (
                <div className={styles.infoItem}>
                  <Caption1 className={styles.infoLabel}>支持平台</Caption1>
                  <Text className={styles.infoValue}>{software.metadata.platform.join(', ')}</Text>
                </div>
              )}
              
              {software.filetype && (
                <div className={styles.infoItem}>
                  <Caption1 className={styles.infoLabel}>文件类型</Caption1>
                  <Text className={styles.infoValue}>{software.filetype.toUpperCase()}</Text>
                </div>
              )}

              <div className={styles.infoItem}>
                <Caption1 className={styles.infoLabel}>创建时间</Caption1>
                <Text className={styles.infoValue}>{formatDate(software.createdAt)}</Text>
              </div>

              <div className={styles.infoItem}>
                <Caption1 className={styles.infoLabel}>更新时间</Caption1>
                <Text className={styles.infoValue}>{formatDate(software.updatedAt)}</Text>
              </div>
            </div>
          </div>

          {software.officialWebsite && (
            <>
              <Divider />
              <div className={styles.infoSection}>
                <Text className={styles.sectionTitle}>相关链接</Text>
                <div className={styles.metaItem}>
                  <Globe24Regular />
                  <Link href={software.officialWebsite} target="_blank">
                    官方网站
                  </Link>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card className={styles.downloadSection}>
          <div className={styles.downloadHeader}>
            <Title3>下载软件</Title3>
            <Button
              {...buttonProps}
              className={styles.downloadButton}
            />
          </div>

          {downloadTask && downloadTask.status === 'downloading' && (
            <div className={styles.downloadProgress}>
              <ProgressBar value={downloadTask.progress / 100} />
              <div className={styles.progressInfo}>
                <span>{Math.round(downloadTask.progress)}%</span>
                <span>
                  {formatFileSize(downloadTask.downloadedSize)} / {formatFileSize(downloadTask.fileSize)}
                </span>
              </div>
            </div>
          )}

          {downloadTask && downloadTask.status === 'failed' && downloadTask.error && (
            <div className={styles.errorMessage}>
              下载失败：{downloadTask.error}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SoftwareDetailPanel;
