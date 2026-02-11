/*
在线资源-下载管理卡片页面
*/
import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Button,
  Card,
  Badge,
  ProgressBar,
  Body1,
  Caption1,
  SearchBox,
  Dropdown,
  Option,
  Spinner,
  Tooltip,
} from '@fluentui/react-components';
import {
  Delete24Regular,
  FolderOpen24Regular,
  Pause24Regular,
  Play24Regular,
  Dismiss24Regular,
  ArrowDownload24Regular,
  Folder24Regular,
} from '@fluentui/react-icons';
import { DownloadTask } from '../../types/app';
import { onlineResourcesService } from '../../services/onlineResourcesService';
import { logService } from '../../services/logService';

const useStyles = makeStyles({
  infoText: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
  },
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
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    minHeight: '80px',
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
    flex: 1,
    overflowY: 'auto',
    maxHeight: '65vh', // 增加最大高度
    minHeight: '400px', // 增加最小高度
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '8px',
    backgroundColor: 'var(--colorNeutralBackground1)',

  },
  taskListHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 120px 140px 100px',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--colorNeutralStroke2)',
    backgroundColor: 'var(--colorNeutralBackground2)',
    fontWeight: '600',
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  taskRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 120px 140px 100px',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--colorNeutralStroke3)',
    alignItems: 'center',
    minHeight: '60px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  taskMainInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0, // 允许内容收缩
  },
  taskName: {
    fontWeight: '600',
    fontSize: '14px',
    color: 'var(--colorNeutralForeground1)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  taskFileName: {
    fontSize: '12px',
    color: 'var(--colorNeutralForeground2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  taskProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  taskProgressBar: {
    width: '100%',
  },
  taskProgressText: {
    fontSize: '11px',
    color: 'var(--colorNeutralForeground2)',
    textAlign: 'center',
  },
  taskStatus: {
    display: 'flex',
    justifyContent: 'center',
  },
  taskTime: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '11px',
    color: 'var(--colorNeutralForeground2)',
  },
  taskActions: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'center',
    alignItems: 'center',
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

export const DownloadManagerPanel: React.FC<DownloadManagerPanelProps> = ({ }) => {
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

  // 设置实时进度更新监听器
  const setupProgressListener = async () => {
    try {
      const { listen } = await import('@tauri-apps/api/event');

      // 监听下载进度事件
      const unlisten = await listen('download-progress', (event: any) => {
        const progressData = event.payload;
        console.log('📊 收到下载进度更新:', progressData);

        // 重新加载任务列表以获取最新进度
        const updatedTasks = onlineResourcesService.getAllDownloadTasks();
        setTasks(updatedTasks);
      });

      console.log('✅ 下载进度监听器设置成功');

      // 返回清理函数
      return unlisten;
    } catch (error) {
      console.error('❌ 设置下载进度监听器失败:', error);
      return () => { }; // 返回空的清理函数
    }
  };

  // 获取下载目录
  const loadDownloadDirectory = async () => {
    const dir = await onlineResourcesService.getDownloadsDirectory();
    setDownloadDirectory(dir);
  };

  useEffect(() => {
    loadTasks();
    loadDownloadDirectory();

    let unlistenProgress: (() => void) | null = null;

    // 设置进度监听器
    setupProgressListener().then((unlisten) => {
      unlistenProgress = unlisten;
    });

    // 定期刷新任务状态（作为备用机制）
    const interval = setInterval(loadTasks, 5000); // 减少到5秒，因为有事件监听器

    return () => {
      clearInterval(interval);
      if (unlistenProgress) {
        unlistenProgress();
      }
    };
  }, []);

  // 过滤和排序任务
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

    // 按下载时间排序（最新的在前）
    filtered = filtered.sort((a, b) => {
      const timeA = a.endTime || a.startTime;
      const timeB = b.endTime || b.startTime;
      return timeB.getTime() - timeA.getTime();
    });

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchQuery]);

  // 获取统计信息
  const getStats = () => {
    return onlineResourcesService.getDownloadStats();
  };

  // 获取状态徽章属性

  // 获取状态文本

  // 格式化时间

  const stats = getStats();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* 提示*/}
      <div style={{
        backgroundColor: '#FFF9C4',
        border: '1px solid #FFD600',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ color: '#F57F17', fontWeight: '600' }}>💡 提示：</span>
        <span style={{ color: '#5D4037', fontSize: '14px' }}>若下载资源失败或错误，请在指定资源详情弹窗内点击“使用Appfun下载”进行资源获取</span>
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
            <div className={styles.statNumber}>{stats.extracting}</div>
            <div className={styles.statLabel}>提取中</div>
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
          <Option value="extracting">提取中</Option>
          <Option value="paused">已暂停</Option>
          <Option value="completed">已完成</Option>
          <Option value="failed">失败</Option>
          <Option value="cancelled">已取消</Option>
        </Dropdown>
        <Button
          appearance="subtle"
          icon={<FolderOpen24Regular />}
          onClick={async () => {
            if (downloadDirectory) {
              try {
                const { invoke } = await import('@tauri-apps/api/core');

                // 检查是否有APK文件，如果有则优先打开APK目录
                const hasApkFiles = tasks.some(task => {
                  return task.fileName && task.fileName.toLowerCase().endsWith('.apk');
                });

                // 如果有APK文件，则打开APK目录，否则打开默认下载目录
                const targetDir = hasApkFiles
                  ? `${downloadDirectory}/apk`
                  : downloadDirectory;

                await invoke('open_folder', { path: targetDir });
              } catch (error) {
                console.error('❌ 打开下载目录失败:', error);
              }
            }
          }}

        >
          打开资源下载目录
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
          <>
            {/* 表头 */}
            <div className={styles.taskListHeader}>
              <div>软件名称 / 文件名</div>
              <div>进度</div>
              <div>状态</div>
              <div>时间</div>
              <div>操作</div>
            </div>
            {/* 任务列表 */}
            {filteredTasks.map(task => (
              <TaskRow key={task.id} task={task} styles={styles} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// 任务行组件
interface TaskRowProps {
  task: DownloadTask;
  styles: any;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, styles }) => {
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
      await logService.info(`已删除下载任务: ${task.softwareName}`, '下载管理', { taskId: task.id, filePath: task.filePath });
    } catch (error) {
      await logService.error(`删除任务失败: ${task.softwareName}`, '下载管理', { error: String(error) });
    }
  };

  // 打开文件位置
  const handleOpenFileLocation = async () => {
    try {
      if (task.filePath) {
        const { invoke } = await import('@tauri-apps/api/core');
        // 提取文件所在目录路径
        const filePath = task.filePath;
        const dirPath = filePath.substring(0, filePath.lastIndexOf('\\'));
        await invoke('open_folder', { path: dirPath });
        await logService.info(`已打开文件位置: ${dirPath}`, '下载管理', { softwareName: task.softwareName });
      }
    } catch (error) {
      logService.error('打开文件位置失败', '下载管理', { error: String(error) });
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


  const formatShortTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.taskRow}>
      {/* 软件名称和文件名 */}
      <div className={styles.taskMainInfo}>
        <div className={styles.taskName} title={task.softwareName}>
          {task.softwareName}
        </div>
        <div className={styles.taskFileName} title={task.fileName}>
          {task.fileName}
        </div>
      </div>

      {/* 进度信息 */}
      <div className={styles.taskProgress}>
        {(task.status === 'downloading' || task.status === 'paused' || task.status === 'extracting') ? (
          <>
            <ProgressBar
              value={task.progress / 100}
              className={styles.taskProgressBar}
            />
            <div className={styles.taskProgressText}>
              {Math.round(task.progress)}%
              {task.downloadSpeed && task.status === 'downloading' && (
                <> • {onlineResourcesService.formatDownloadSpeed(task.downloadSpeed)}</>
              )}
            </div>
          </>
        ) : task.status === 'completed' ? (
          <div className={styles.taskProgressText}>
            {task.downloadedSize && onlineResourcesService.formatFileSize(task.downloadedSize)}
          </div>
        ) : (
          <div className={styles.taskProgressText}>-</div>
        )}
      </div>

      {/* 状态 */}
      <div className={styles.taskStatus}>
        <Badge {...getStatusBadgeProps(task.status)}>
          {getStatusText(task.status)}
        </Badge>
      </div>

      {/* 时间信息 */}
      <div className={styles.taskTime}>
        <div title={`开始时间: ${task.startTime.toLocaleString('zh-CN')}`}>
          开始: {formatShortTime(task.startTime)}
        </div>
        {task.endTime && (
          <div title={`完成时间: ${task.endTime.toLocaleString('zh-CN')}`}>
            完成: {formatShortTime(task.endTime)}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.taskActions}>
        {task.status === 'downloading' && (
          <Button size="small" appearance="subtle" icon={<Pause24Regular />} onClick={handlePause} />
        )}

        {task.status === 'paused' && (
          <Button size="small" appearance="subtle" icon={<Play24Regular />} onClick={handleResume} />
        )}

        {(task.status === 'downloading' || task.status === 'paused' || task.status === 'extracting') && (
          <Button size="small" appearance="subtle" icon={<Dismiss24Regular />} onClick={handleCancel} />
        )}

        {task.status === 'completed' && (
          <>
            <Tooltip content="打开文件位置" relationship="label">
              <Button size="small" appearance="subtle" icon={<Folder24Regular />} onClick={handleOpenFileLocation} />
            </Tooltip>
            <Button size="small" appearance="subtle" icon={<Delete24Regular />} onClick={handleDelete} />
          </>
        )}

        {(task.status === 'failed' || task.status === 'cancelled') && (
          <Button size="small" appearance="subtle" icon={<Delete24Regular />} onClick={handleDelete} />
        )}
      </div>
    </div>
  );
};
