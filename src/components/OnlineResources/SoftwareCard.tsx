/*
在线资源 - 软件卡片
卡片只承载信息展示，点击整卡进入详情弹窗，下载与运行统一在弹窗内完成。
*/
import React, { useEffect, useState, useCallback } from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Badge,
  Caption1,
  ProgressBar,
} from '@fluentui/react-components';
import {
  Apps20Regular,
  ChevronRight20Regular,
  CheckmarkCircle20Regular,
  ArrowDownload20Regular,
} from '@fluentui/react-icons';
import { OnlineSoftware, DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';

const useStyles = makeStyles({
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '150px',
    padding: '16px 18px',
    borderRadius: '14px',
    border: '1px solid var(--colorNeutralStroke2)',
    backgroundColor: 'var(--colorNeutralBackground2)',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'border-color 0.16s ease, background-color 0.16s ease',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground2Hover)',
      ...shorthands.borderColor('var(--colorBrandStroke1)'),
    },
    '&:focus-visible': {
      outline: '2px solid var(--colorBrandStroke1)',
      outlineOffset: '2px',
    },
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  iconBox: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    backgroundColor: 'var(--colorNeutralBackground3)',
    color: 'var(--colorNeutralForeground3)',
    ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke2)'),
  },
  iconImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '10px',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  titleLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    color: 'var(--colorNeutralForeground1)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryBadge: {
    flexShrink: 0,
    fontSize: '11px',
    borderRadius: '9999px',
  },
  metaLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    color: 'var(--colorNeutralForeground3)',
  },
  description: {
    fontSize: '12px',
    lineHeight: '18px',
    color: 'var(--colorNeutralForeground2)',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    minHeight: '36px',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '10px',
    borderTop: '1px solid var(--colorNeutralStroke2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  statusBadge: {
    fontSize: '11px',
    borderRadius: '9999px',
  },
  actionHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    flexShrink: 0,
    fontSize: '12px',
    color: 'var(--colorNeutralForeground3)',
  },
  progressBar: {
    position: 'absolute',
    bottom: '0',
    left: '14px',
    right: '14px',
    height: '2px',
  },
});

interface SoftwareCardProps {
  software: OnlineSoftware;
  onClick: () => void;
  className?: string;
}

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const SoftwareCard: React.FC<SoftwareCardProps> = ({ software, onClick, className }) => {
  const styles = useStyles();
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [activeTask, setActiveTask] = useState<DownloadTask | null>(null);
  const [iconBroken, setIconBroken] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await onlineResourcesService.checkSoftwareDownloaded(software);
      setIsDownloaded(status.isDownloaded);
    } catch {
      setIsDownloaded(false);
    }
  }, [software]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // 卡片只展示进度，不提供下载/运行等操作
  useEffect(() => {
    const syncTasks = () => {
      const task = onlineResourcesService
        .getAllDownloadTasks()
        .find((t) => t.softwareId === software.id);
      if (!task) {
        setActiveTask(null);
        return;
      }
      if (task.status === 'completed') {
        setActiveTask(null);
        setIsDownloaded(true);
      } else if (task.status === 'downloading' || task.status === 'extracting' || task.status === 'pending') {
        setActiveTask(task);
      } else {
        setActiveTask(null);
      }
    };

    syncTasks();
    const timer = setInterval(syncTasks, 1000);
    return () => clearInterval(timer);
  }, [software.id]);

  const isBusy = !!activeTask;
  const statusLabel = isBusy
    ? activeTask?.status === 'extracting'
      ? '正在解压'
      : '下载中'
    : isDownloaded
    ? '已就绪'
    : '';

  return (
    <div
      className={className ? `${styles.card} ${className}` : styles.card}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${software.name} 详情`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.headerRow}>
        <div className={styles.iconBox}>
          {software.iconUrl && !iconBroken ? (
            <img
              src={software.iconUrl}
              className={styles.iconImage}
              alt=""
              onError={() => setIconBroken(true)}
            />
          ) : (
            <Apps20Regular />
          )}
        </div>
        <div className={styles.titleBlock}>
          <div className={styles.titleLine}>
            <Text className={styles.title}>{software.name}</Text>
            {software.category && (
              <Badge className={styles.categoryBadge} appearance="outline" size="small">
                {software.category}
              </Badge>
            )}
          </div>
          <div className={styles.metaLine}>
            <Caption1>v{software.currentVersion}</Caption1>
            {software.fileSize ? <Caption1>· {formatSize(software.fileSize)}</Caption1> : null}
            {software.metadata?.platform && Array.isArray(software.metadata.platform) && (
              <Caption1>· {software.metadata.platform[0]}</Caption1>
            )}
          </div>
        </div>
      </div>

      <Text className={styles.description}>{software.description}</Text>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {statusLabel && (
            <Badge
              className={styles.statusBadge}
              appearance="outline"
              size="small"
              icon={isDownloaded ? <CheckmarkCircle20Regular /> : <ArrowDownload20Regular />}
            >
              {statusLabel}
              {isBusy && typeof activeTask?.progress === 'number'
                ? ` ${Math.round(activeTask.progress)}%`
                : ''}
            </Badge>
          )}
          {software.updatedAt && (
            <Caption1 style={{ color: 'var(--colorNeutralForeground4)' }}>
              {new Date(software.updatedAt).toLocaleDateString('zh-CN')}
            </Caption1>
          )}
        </div>
        <span className={styles.actionHint}>
          查看详情 <ChevronRight20Regular />
        </span>
      </div>

      {isBusy && (
        <ProgressBar
          className={styles.progressBar}
          value={Math.min(1, (activeTask?.progress ?? 0) / 100)}
        />
      )}
    </div>
  );
};

export default SoftwareCard;
