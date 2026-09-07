/*
在线资源-软件卡片页面
*/
import React, { useEffect, useState }  from 'react';
import {
  makeStyles,
  shorthands,
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
  Play24Regular,
} from '@fluentui/react-icons';
import { ProgressBar } from '@fluentui/react-components';
import { OnlineSoftware, DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';
import { logService } from '../../services/logService';

const useStyles = makeStyles({
  softwareCard: {
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
    borderRadius: '14px',
    border: '1px solid var(--colorNeutralStroke2)',
    backgroundColor: 'var(--colorNeutralBackground1)',
    margin: '2px',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
      ...shorthands.borderColor('var(--colorBrandStroke1)'),
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
    },
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    height: '100%',
    boxSizing: 'border-box',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  softwareTitle: {
    fontWeight: '600',
    fontSize: '15px',
    lineHeight: '20px',
    color: 'var(--colorNeutralForeground1)',
  },
  metaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--colorNeutralForeground3)',
  },
  softwareDescription: {
    fontSize: '13px',
    lineHeight: '18px',
    color: 'var(--colorNeutralForeground2)',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  versionBadge: {
    fontSize: '11px',
    padding: '1px 6px',
  },
  cardBottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '8px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
  },
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



  // 运行程序
  const handleLaunch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!downloadStatus.filePath) return;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('launch_software_resource', {
        path: downloadStatus.filePath,
        openname: software.openname || null,
      });
      await logService.info(`已通过卡片启动程序: ${software.name}`, '在线资源UI', {
        path: downloadStatus.filePath,
        openname: software.openname,
      });
    } catch (error) {
      logService.error(`启动程序失败: ${software.name}`, '在线资源UI', { error: String(error) });
    }
  };

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
        {/* 顶部标题与分类 */}
        <div className={styles.cardHeader}>
          <div className={styles.headerTop}>
            <Text className={styles.softwareTitle}>{software.name}</Text>
            {software.category && (
              <Badge className={styles.versionBadge} appearance="tint">
                {software.category}
              </Badge>
            )}
          </div>
          <div className={styles.metaInfo}>
            <Caption1>v{software.currentVersion}</Caption1>
            {software.fileSize ? <Caption1>• {formatSize(software.fileSize)}</Caption1> : null}
            {software.metadata?.platform && Array.isArray(software.metadata.platform) && (
              <Caption1>• {software.metadata.platform[0]}</Caption1>
            )}
          </div>
        </div>

        <Text className={styles.softwareDescription}>
          {software.description}
        </Text>

        {/* 底部信息与操作按钮区 */}
        <div className={styles.cardBottomRow}>
          {software.updatedAt ? (
            <Caption1 style={{ color: 'var(--colorNeutralForeground4)' }}>
              {new Date(software.updatedAt).toLocaleDateString('zh-CN')}
            </Caption1>
          ) : <div />}

          <div className={styles.actionButtons}>
            {isCheckingStatus ? (
              <Button size="small" disabled icon={<Spinner size="tiny" />}>
                检查中
              </Button>
            ) : downloadStatus.isDownloaded ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<FolderOpen24Regular />}
                  onClick={handleOpenFolder}
                  title="打开文件位置"
                />
                <Button
                  size="small"
                  appearance="primary"
                  icon={<Play24Regular />}
                  onClick={handleLaunch}
                >
                  运行
                </Button>
              </div>
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
