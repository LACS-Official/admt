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
} from '@fluentui/react-icons';
import { OnlineSoftware } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';

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
    marginTop: '8px',
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

  // 检查下载状态
  const checkDownloadStatus = async () => {
    try {
      const status = await onlineResourcesService.checkSoftwareDownloaded(software);
      setDownloadStatus(status);
    } catch (error) {
      console.error('检查下载状态失败:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkDownloadStatus();
  }, [software.id]);



  // 打开文件位置
  const handleOpenFolder = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止卡片点击事件
    
    if (!downloadStatus.filePath) return;
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_folder', { path: downloadStatus.filePath });
    } catch (error) {
      console.error('打开文件夹失败:', error);
    }
  };

  return (
    <Card className={styles.softwareCard} onClick={onClick}>
      <div className={styles.cardContent}>
        <Text className={styles.softwareTitle}>{software.name}</Text>

        <Text className={styles.softwareDescription}>
          {software.description}
        </Text>

        <div className={styles.softwareInfo}>
          <Badge className={styles.versionBadge} appearance="outline">
            v{software.currentVersion}
          </Badge>

          {software.category && (
            <Badge className={styles.versionBadge} appearance="tint">
              {software.category}
            </Badge>
          )}

          {/* 下载状态指示器 */}
          {isCheckingStatus ? (
            <Badge appearance="outline">
              <Spinner size="tiny" style={{ marginRight: '4px' }} />
              检查中...
            </Badge>
          ) : downloadStatus.isDownloaded ? (
            <Badge className={styles.downloadedBadge} appearance="filled">
              <CheckmarkCircle24Filled style={{ marginRight: '4px' }} />
              已下载
            </Badge>
          ) : null}
        </div>

        {software.updatedAt && (
          <div className={styles.softwareInfo}>
            <Caption1 style={{ color: 'var(--colorNeutralForeground3)' }}>
              更新于 {new Date(software.updatedAt).toLocaleDateString('zh-CN')}
            </Caption1>
          </div>
        )}

        {software.filetype && (
          <div className={styles.softwareInfo}>
            <Badge appearance="outline" size="small">
              {software.filetype.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* 下载状态指示 */}
        {!isCheckingStatus && downloadStatus.isDownloaded && (
          <div className={styles.actionButtons}>
            <Button
              size="small"
              appearance="outline"
              icon={<FolderOpen24Regular />}
              onClick={handleOpenFolder}
              disabled={!downloadStatus.filePath}
            >
              打开位置
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SoftwareCard;
