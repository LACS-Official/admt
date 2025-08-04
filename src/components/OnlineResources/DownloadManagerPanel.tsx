import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Card,
  Badge,
  ProgressBar,
  Divider,
  Body1,
  Caption1,
  Title2,
  Title3,
  SearchBox,
  Dropdown,
  Option,
  Spinner,
} from '@fluentui/react-components';
import {
  Delete24Regular,
  FolderOpen24Regular,
  Pause24Regular,
  Play24Regular,
  Dismiss24Regular,
  ArrowDownload24Regular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
  Warning24Filled,
  Broom24Regular,
  FolderZip24Regular,
} from '@fluentui/react-icons';
import { DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '20px',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  controls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  searchBox: {
    minWidth: '200px',
  },
  filterDropdown: {
    minWidth: '120px',
  },
  statsCard: {
    padding: '16px',
    marginBottom: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
  },
  statItem: {
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'var(--colorBrandForeground1)',
  },
  statLabel: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    marginTop: '4px',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    overflowY: 'auto',
  },
  taskCard: {
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
    },
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  taskInfo: {
    flex: 1,
    marginRight: '12px',
  },
  taskName: {
    fontWeight: '600',
    marginBottom: '4px',
  },
  taskMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    marginBottom: '8px',
  },
  taskActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  progressSection: {
    marginTop: '8px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  progressDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--colorNeutralForeground2)',
    marginTop: '4px',
  },
  statusBadge: {
    fontSize: '11px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
    color: 'var(--colorNeutralForeground2)',
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.5,
  },
  cleanupSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '6px',
  },
});

interface DownloadManagerPanelProps {
  onBack: () => void;
}

export const DownloadManagerPanel: React.FC<DownloadManagerPanelProps> = ({ onBack }) => {
  const styles = useStyles();
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<DownloadTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadDirectory, setDownloadDirectory] = useState('');

  // 加载下载任务
  const loadTasks = () => {
    const allTasks = onlineResourcesService.getAllDownloadTasks();
    setTasks(allTasks);
    setIsLoading(false);
  };

  // 获取下载目录
  const loadDownloadDirectory = async () => {
    const dir = await onlineResourcesService.getDownloadsDirectory();
    setDownloadDirectory(dir);
  };

  useEffect(() => {
    loadTasks();
    loadDownloadDirectory();
    
    // 定期刷新任务状态
    const interval = setInterval(loadTasks, 1000);
    return () => clearInterval(interval);
  }, []);

  // 过滤任务
  useEffect(() => {
    let filtered = tasks;

    // 按状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.softwareName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchQuery]);

  // 获取统计信息
  const getStats = () => {
    return onlineResourcesService.getDownloadStats();
  };

  // 获取状态徽章属性
  const getStatusBadgeProps = (status: DownloadTask['status']) => {
    switch (status) {
      case 'downloading':
        return { appearance: 'filled' as const, color: 'brand' as const, icon: <ArrowDownload24Regular /> };
      case 'extracting':
        return { appearance: 'filled' as const, color: 'warning' as const, icon: <FolderZip24Regular /> };
      case 'paused':
        return { appearance: 'filled' as const, color: 'warning' as const, icon: <Pause24Regular /> };
      case 'completed':
        return { appearance: 'filled' as const, color: 'success' as const, icon: <CheckmarkCircle24Filled /> };
      case 'failed':
        return { appearance: 'filled' as const, color: 'danger' as const, icon: <ErrorCircle24Filled /> };
      case 'cancelled':
        return { appearance: 'outline' as const, color: 'subtle' as const, icon: <Dismiss24Regular /> };
      default:
        return { appearance: 'outline' as const, color: 'subtle' as const };
    }
  };

  // 获取状态文本
  const getStatusText = (status: DownloadTask['status']) => {
    switch (status) {
      case 'downloading': return '下载中';
      case 'extracting': return '正在解压';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN');
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title2>下载管理</Title2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title2>下载管理</Title2>
        <Button
          appearance="subtle"
          icon={<FolderOpen24Regular />}
          onClick={async () => {
            if (downloadDirectory) {
              try {
                const { invoke } = await import('@tauri-apps/api/core');
                await invoke('open_folder', { path: downloadDirectory });
              } catch (error) {
                console.error('❌ 打开下载目录失败:', error);
              }
            }
          }}
        >
          打开下载目录
        </Button>
      </div>

      {/* 统计信息 */}
      <Card className={styles.statsCard}>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>总任务</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{stats.downloading}</div>
            <div className={styles.statLabel}>下载中</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{stats.completed}</div>
            <div className={styles.statLabel}>已完成</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{stats.failed}</div>
            <div className={styles.statLabel}>失败</div>
          </div>
        </div>
      </Card>

      {/* 控制栏 */}
      <div className={styles.controls}>
        <SearchBox
          className={styles.searchBox}
          placeholder="搜索下载任务..."
          value={searchQuery}
          onChange={(_, data) => setSearchQuery(data.value)}
        />
        <Dropdown
          className={styles.filterDropdown}
          placeholder="状态筛选"
          value={statusFilter}
          onOptionSelect={(_, data) => setStatusFilter(data.optionValue || 'all')}
        >
          <Option value="all">全部</Option>
          <Option value="downloading">下载中</Option>
          <Option value="paused">已暂停</Option>
          <Option value="completed">已完成</Option>
          <Option value="failed">失败</Option>
          <Option value="cancelled">已取消</Option>
        </Dropdown>
        <Button
          appearance="outline"
          icon={<Broom24Regular />}
          onClick={() => onlineResourcesService.clearCompletedTasks()}
        >
          清理已完成
        </Button>
      </div>

      {/* 任务列表 */}
      <div className={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <ArrowDownload24Regular className={styles.emptyIcon} />
            <Body1>暂无下载任务</Body1>
            <Caption1>开始下载软件后，任务将显示在这里</Caption1>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} styles={styles} />
          ))
        )}
      </div>
    </div>
  );
};

// 任务卡片组件
interface TaskCardProps {
  task: DownloadTask;
  styles: any;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, styles }) => {
  // 暂停下载
  const handlePause = async () => {
    await onlineResourcesService.pauseDownload(task.id);
  };

  // 恢复下载
  const handleResume = async () => {
    await onlineResourcesService.resumeDownload(task.id);
  };

  // 取消下载
  const handleCancel = async () => {
    await onlineResourcesService.cancelDownload(task.id);
  };

  // 删除任务
  const handleDelete = async () => {
    try {
      // 如果任务已完成且有文件路径，删除本地文件
      if (task.status === 'completed' && task.filePath) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_file', { path: task.filePath });
        console.log('✅ 已删除文件:', task.filePath);
      }

      // 从下载管理器中移除任务
      onlineResourcesService.removeDownloadTask(task.id);
      console.log('✅ 已删除下载任务:', task.id);
    } catch (error) {
      console.error('❌ 删除任务失败:', error);
    }
  };

  const getStatusBadgeProps = (status: DownloadTask['status']) => {
    switch (status) {
      case 'downloading':
        return { appearance: 'filled' as const, color: 'brand' as const };
      case 'extracting':
        return { appearance: 'filled' as const, color: 'warning' as const };
      case 'paused':
        return { appearance: 'filled' as const, color: 'warning' as const };
      case 'completed':
        return { appearance: 'filled' as const, color: 'success' as const };
      case 'failed':
        return { appearance: 'filled' as const, color: 'danger' as const };
      case 'cancelled':
        return { appearance: 'outline' as const, color: 'subtle' as const };
      default:
        return { appearance: 'outline' as const, color: 'subtle' as const };
    }
  };

  const getStatusText = (status: DownloadTask['status']) => {
    switch (status) {
      case 'downloading': return '下载中';
      case 'extracting': return '正在解压';
      case 'paused': return '已暂停';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN');
  };

  return (
    <Card className={styles.taskCard}>
      <div className={styles.taskHeader}>
        <div className={styles.taskInfo}>
          <div className={styles.taskName}>{task.softwareName}</div>
          <div className={styles.taskMeta}>
            <span>{task.fileName}</span>
            <span>开始时间: {formatTime(task.startTime)}</span>
            {task.endTime && <span>完成时间: {formatTime(task.endTime)}</span>}
          </div>
        </div>
        <div className={styles.taskActions}>
          <Badge {...getStatusBadgeProps(task.status)} className={styles.statusBadge}>
            {getStatusText(task.status)}
          </Badge>
          
          {task.status === 'downloading' && (
            <Button size="small" appearance="subtle" icon={<Pause24Regular />} onClick={handlePause} />
          )}
          
          {task.status === 'paused' && (
            <Button size="small" appearance="subtle" icon={<Play24Regular />} onClick={handleResume} />
          )}
          
          {(task.status === 'downloading' || task.status === 'paused') && (
            <Button size="small" appearance="subtle" icon={<Dismiss24Regular />} onClick={handleCancel} />
          )}
          
          {(task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') && (
            <Button size="small" appearance="subtle" icon={<Delete24Regular />} onClick={handleDelete} />
          )}
        </div>
      </div>

      {/* 进度条 */}
      {(task.status === 'downloading' || task.status === 'paused') && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>{Math.round(task.progress)}%</span>
            {task.downloadSpeed && task.status === 'downloading' && (
              <span>{onlineResourcesService.formatDownloadSpeed(task.downloadSpeed)}</span>
            )}
          </div>
          <ProgressBar value={task.progress / 100} />
          <div className={styles.progressDetails}>
            {task.downloadedSize && task.fileSize && (
              <span>
                {onlineResourcesService.formatFileSize(task.downloadedSize)} / {onlineResourcesService.formatFileSize(task.fileSize)}
              </span>
            )}
            {task.remainingTime && task.status === 'downloading' && (
              <span>剩余 {onlineResourcesService.formatRemainingTime(task.remainingTime)}</span>
            )}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {task.status === 'failed' && task.error && (
        <div style={{ marginTop: '8px', color: 'var(--colorPaletteRedForeground1)', fontSize: '12px' }}>
          错误: {task.error}
        </div>
      )}
    </Card>
  );
};
