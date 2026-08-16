/*
在线资源-软件卡片页面
*/
import React, { useEffect, useState }  from 'react';
import {
  makeStyles,
  Text,
  Badge,
  Caption1,
  Card,
  Button,
  Spinner,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  FolderOpen24Regular,
  ArrowDownload24Regular,
  Apps24Regular,
  Navigation24Regular,
} from '@fluentui/react-icons';
import { ProgressBar } from '@fluentui/react-components';
import { OnlineSoftware, DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';
import { logService } from '../../services/logService';

const useStyles = makeStyles({
  softwareCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke2)',
    margin: '2px',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
  },
  softwareTitle: {
    fontWeight: '600',
    fontSize: '16px',
    lineHeight: '22px',
    color: 'var(--colorNeutralForeground1)',
  },
  softwareDescription: {
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--colorNeutralForeground2)',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  softwareInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  versionBadge: {
    fontSize: '12px',
  },
  downloadStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '4px',
  },
  downloadedBadge: {
    backgroundColor: 'var(--colorPaletteGreenBackground1)',
    color: 'var(--colorPaletteGreenForeground1)',
    border: '1px solid var(--colorPaletteGreenBorder1)',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
    justifyContent: 'flex-end',
    paddingTop: '8px',
  },
  cardHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'var(--colorNeutralBackground3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    border: '1px solid var(--colorNeutralStroke3)',
  },
  iconImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
    color: 'var(--colorNeutralForeground3)',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
  }
});


interface SoftwareCardProps {
  software: OnlineSoftware;
  onClick: () => void;
  className?: string;
}

export const SoftwareCard: React.FC<SoftwareCardProps> = ({
  software,
  onClick,
  className,
}) => {
  const styles = useStyles();
  const [downloadStatus, setDownloadStatus] = useState<{
    isDownloaded: boolean;
    filePath?: string;
    task?: any;
  }>({ isDownloaded: false });

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [activeTask, setActiveTask] = useState<DownloadTask | null>(null);

  // 检查下载状态并监听任务进度
  const checkDownloadStatus = async () => {
    try {
      const status = await onlineResourcesService.checkSoftwareDownloaded(software);
      setDownloadStatus(status);
      
      // 如果没有下载完成，检查是否有正在进行的任务
      if (!status.isDownloaded) {
        const tasks = onlineResourcesService.getAllDownloadTasks();
        const ongoingTask = tasks.find(t => t.softwareId === software.id && (t.status === 'downloading' || t.status === 'extracting' || t.status === 'pending'));
        if (ongoingTask) {
          setActiveTask(ongoingTask);
        }
      }
    } catch (error) {
      console.error('检查下载状态失败:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkDownloadStatus();

    // 轮询活跃任务进度
    let intervalId: any;
    if (!downloadStatus.isDownloaded) {
      intervalId = setInterval(() => {
        const tasks = onlineResourcesService.getAllDownloadTasks();
        const ongoingTask = tasks.find(t => t.softwareId === software.id);
        if (ongoingTask) {
          setActiveTask(ongoingTask);
          if (ongoingTask.status === 'completed') {
            setDownloadStatus({ isDownloaded: true, filePath: ongoingTask.filePath });
            setActiveTask(null);
            clearInterval(intervalId);
          }
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [software.id, downloadStatus.isDownloaded]);



  // 打开文件位置
  const handleOpenFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!downloadStatus.filePath) return;
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_folder', { path: downloadStatus.filePath });
      await logService.info(`已通过卡片打开文件夹: ${downloadStatus.filePath}`, '在线资源UI', { softwareName: software.name });
    } catch (error) {
      logService.error(`打开文件夹失败: ${software.name}`, '在线资源UI', { error: String(error) });
    }
  };

  // 开始下载
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const taskId = await onlineResourcesService.downloadSoftware(software);
      const task = onlineResourcesService.getDownloadTask(taskId);
      if (task) setActiveTask(task);
    } catch (error) {
      logService.error(`下载失败: ${software.name}`, '在线资源UI', { error: String(error) });
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={styles.softwareCard} onClick={onClick}>
      <div className={styles.cardContent}>
        {/* 顶部标题与图标 */}
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            {software.iconUrl ? (
              <img src={software.iconUrl} className={styles.iconImage} alt={software.name} />
            ) : (
              <Apps24Regular style={{ color: 'var(--colorNeutralForeground3)' }} />
            )}
          </div>
          <div className={styles.headerText}>
            <Text className={styles.softwareTitle}>{software.name}</Text>
            <div className={styles.metaInfo}>
              <Caption1>{formatSize(software.fileSize)}</Caption1>
              {software.fileSize && <Caption1>• {software.fileSize}</Caption1>}
              <Caption1>• v{software.currentVersion}</Caption1>
            </div>
          </div>
        </div>

        <Text className={styles.softwareDescription}>
          {software.description}
        </Text>

        <div className={styles.softwareInfo}>
          {software.category && (
            <Badge className={styles.versionBadge} appearance="tint">
              {software.category}
            </Badge>
          )}
          {software.metadata?.platform && Array.isArray(software.metadata.platform) && (
            <Badge className={styles.versionBadge} appearance="outline">
              {software.metadata.platform[0]}
            </Badge>
          )}
          
          {software.updatedAt && (
             <Caption1 style={{ color: 'var(--colorNeutralForeground4)', marginLeft: 'auto' }}>
               {new Date(software.updatedAt).toLocaleDateString('zh-CN')}
             </Caption1>
          )}
        </div>

        {/* 操作按钮区 */}
        <div className={styles.actionButtons}>
          {isCheckingStatus ? (
            <Button size="small" disabled icon={<Spinner size="tiny" />}>
              检查中
            </Button>
          ) : downloadStatus.isDownloaded ? (
            <Button
              size="small"
              appearance="outline"
              icon={<CheckmarkCircle24Filled />}
              onClick={handleOpenFolder}
            >
              打开位置
            </Button>
          ) : activeTask ? (
            <Button
              size="small"
              appearance="subtle"
              icon={<Spinner size="tiny" />}
              disabled
            >
              {activeTask.status === 'extracting' ? '正在解压' : '正在下载'}
            </Button>
          ) : (
            <Button
              size="small"
              appearance="primary"
              icon={<ArrowDownload24Regular />}
              onClick={handleDownload}
            >
              获取资源
            </Button>
          )}
        </div>
      </div>

      {/* 底部进度条 */}
      {activeTask && (activeTask.status === 'downloading' || activeTask.status === 'extracting') && (
        <ProgressBar
          className={styles.progressBar}
          value={activeTask.progress / 100}
          color={activeTask.status === 'extracting' ? 'warning' : 'brand'}
        />
      )}
    </Card>
  );
};

export default SoftwareCard;
