import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Input,
  Dropdown,
  Option,
  Badge,
  Spinner,
  ProgressBar,

  MessageBar,
  MessageBarBody,
  Switch,
  Tooltip,
} from "@fluentui/react-components";
import {
  StoreMicrosoft24Regular,
  Search24Regular,
  ArrowDownload24Regular,
  Play24Regular,
  Pause24Regular,
  ArrowClockwise24Regular,
  Dismiss24Regular,
  CloudArrowDown24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Add24Regular,
} from "@fluentui/react-icons";
import { useApkMarketStore } from "../../stores/apkMarketStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { deviceService } from "../../services/deviceService";
import { ApkItem, ApkDownloadItem } from "../../types/device";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  content: {
    flex: 1,
    display: "flex",
    gap: "16px",
    minHeight: 0,
  },
  apkList: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto",
    maxHeight: "100%",
  },
  downloadPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "300px",
  },
  apkItem: {
    padding: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  apkInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  apkActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  downloadItem: {
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
  },
  downloadHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  downloadInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  downloadActions: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  downloadProgress: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  progressInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "40px",
    textAlign: "center",
    color: "var(--colorNeutralForeground2)",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "40px",
  },
  categoryBadge: {
    fontSize: "11px",
  },
  statusIcon: {
    fontSize: "16px",
  },
});

const ApkMarketCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { addNotification } = useAppStore();
  
  const {
    categories,
    filteredApps,
    downloads,
    isLoading,
    error,
    searchQuery,
    selectedCategory,
    fetchMarketData,
    refreshMarketData,
    forceRefreshData,
    clearCache,
    setSearchQuery,
    setSelectedCategory,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    clearCompletedDownloads,
  } = useApkMarketStore();

  const [autoInstall, setAutoInstall] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // 监听下载完成，自动安装APK
  useEffect(() => {
    if (!autoInstall || !selectedDevice) return;

    const completedDownloads = downloads.filter(
      download => download.status === 'completed' && download.filePath
    );

    completedDownloads.forEach(async (download) => {
      if (download.filePath) {
        try {
          addNotification({
            type: "info",
            title: "开始安装",
            message: `正在安装 ${download.name}`,
          });

          await deviceService.installApk(selectedDevice.serial, download.filePath, false);

          addNotification({
            type: "success",
            title: "安装成功",
            message: `${download.name} 安装完成`,
          });
        } catch (error) {
          addNotification({
            type: "error",
            title: "安装失败",
            message: `${download.name} 安装失败: ${error instanceof Error ? error.message : '未知错误'}`,
          });
        }
      }
    });
  }, [downloads, autoInstall, selectedDevice, addNotification]);

  const handleDownload = async (apkItem: ApkItem, category: string) => {
    if (!selectedDevice) {
      addNotification({
        type: "error",
        title: "设备未连接",
        message: "请先连接设备后再下载APK",
      });
      return;
    }

    try {
      await startDownload(apkItem, category);
      addNotification({
        type: "info",
        title: "开始下载",
        message: `正在下载 ${apkItem.name}`,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "下载失败",
        message: error instanceof Error ? error.message : "下载启动失败",
      });
    }
  };

  const handleDownloadAction = (download: ApkDownloadItem, action: string) => {
    switch (action) {
      case 'pause':
        pauseDownload(download.id);
        break;
      case 'resume':
        resumeDownload(download.id);
        break;
      case 'cancel':
        cancelDownload(download.id);
        break;
      case 'retry':
        retryDownload(download.id);
        break;
    }
  };

  const handleInstallApk = async (download: ApkDownloadItem) => {
    if (!selectedDevice || !download.filePath) {
      addNotification({
        type: "error",
        title: "安装失败",
        message: "设备未连接或文件路径无效",
      });
      return;
    }

    try {
      addNotification({
        type: "info",
        title: "开始安装",
        message: `正在安装 ${download.name}`,
      });

      await deviceService.installApk(selectedDevice.serial, download.filePath, false);

      addNotification({
        type: "success",
        title: "安装成功",
        message: `${download.name} 安装完成`,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "安装失败",
        message: `${download.name} 安装失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
        return <Spinner size="tiny" />;
      case 'completed':
        return <CheckmarkCircle24Regular className={styles.statusIcon} style={{ color: 'var(--colorPaletteGreenForeground1)' }} />;
      case 'failed':
        return <ErrorCircle24Regular className={styles.statusIcon} style={{ color: 'var(--colorPaletteRedForeground1)' }} />;
      case 'paused':
        return <Pause24Regular className={styles.statusIcon} style={{ color: 'var(--colorPaletteYellowForeground1)' }} />;
      default:
        return <CloudArrowDown24Regular className={styles.statusIcon} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderApkList = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingState}>
          <Spinner size="large" />
          <Text>正在加载APK市场数据...</Text>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <ErrorCircle24Regular style={{ fontSize: "48px", color: "var(--colorPaletteRedForeground1)" }} />
          <Text size={400} weight="semibold">加载失败</Text>
          <Text size={300}>{error}</Text>
          <Button appearance="primary" onClick={refreshMarketData}>
            重试
          </Button>
        </div>
      );
    }

    if (filteredApps.length === 0) {
      return (
        <div className={styles.emptyState}>
          <StoreMicrosoft24Regular style={{ fontSize: "48px" }} />
          <Text size={400} weight="semibold">暂无应用</Text>
          <Text size={300}>
            {searchQuery ? "没有找到匹配的应用" : "当前分类下暂无应用"}
          </Text>
        </div>
      );
    }

    return filteredApps.map((apk, index) => {
      const category = categories.find(cat => cat.apps.includes(apk))?.category || "未知";
      const isDownloading = downloads.some(d => d.name === apk.name && ['pending', 'downloading'].includes(d.status));
      
      return (
        <Card key={`${apk.name}-${index}`} className={styles.apkItem}>
          <div className={styles.apkInfo}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text size={400} weight="semibold">{apk.name}</Text>
              <Badge className={styles.categoryBadge} appearance="outline">
                {category}
              </Badge>
              {!apk.download_link.is_direct && (
                <Badge className={styles.categoryBadge} appearance="filled" color="warning">
                  重定向
                </Badge>
              )}
            </div>
            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
              {apk.download_link.url}
            </Text>
          </div>
          <div className={styles.apkActions}>
            <Button
              appearance="primary"
              icon={<ArrowDownload24Regular />}
              disabled={!selectedDevice || isDownloading}
              onClick={() => handleDownload(apk, category)}
            >
              {isDownloading ? "下载中" : "下载"}
            </Button>
          </div>
        </Card>
      );
    });
  };

  const renderDownloadPanel = () => {
    return (
      <Card>
        <CardHeader
          header={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <Text size={400} weight="semibold">下载管理</Text>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Tooltip content="下载完成后自动安装APK" relationship="label">
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Switch
                      checked={autoInstall}
                      onChange={(_, data) => setAutoInstall(data.checked)}
                    />
                    <Text size={200}>自动安装</Text>
                  </div>
                </Tooltip>
                <Button
                  size="small"
                  appearance="subtle"
                  onClick={clearCompletedDownloads}
                  disabled={downloads.filter(d => ['completed', 'failed', 'cancelled'].includes(d.status)).length === 0}
                >
                  清理已完成
                </Button>
              </div>
            </div>
          }
        />
        
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
          {downloads.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "20px" }}>
              <CloudArrowDown24Regular style={{ fontSize: "32px" }} />
              <Text size={300}>暂无下载任务</Text>
            </div>
          ) : (
            downloads.map((download) => (
              <div key={download.id} className={styles.downloadItem}>
                <div className={styles.downloadHeader}>
                  <div className={styles.downloadInfo}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {getStatusIcon(download.status)}
                      <Text size={300} weight="semibold">{download.name}</Text>
                      <Badge className={styles.categoryBadge} appearance="outline">
                        {download.category}
                      </Badge>
                    </div>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                      {download.status === 'downloading' ? '下载中' : 
                       download.status === 'completed' ? '已完成' :
                       download.status === 'failed' ? '下载失败' :
                       download.status === 'paused' ? '已暂停' :
                       download.status === 'cancelled' ? '已取消' : '等待中'}
                    </Text>
                  </div>
                  <div className={styles.downloadActions}>
                    {download.status === 'completed' && download.filePath && (
                      <Tooltip content="手动安装APK" relationship="label">
                        <Button
                          size="small"
                          appearance="primary"
                          icon={<Add24Regular />}
                          onClick={() => handleInstallApk(download)}
                          disabled={!selectedDevice}
                        />
                      </Tooltip>
                    )}
                    {download.status === 'downloading' && (
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Pause24Regular />}
                        onClick={() => handleDownloadAction(download, 'pause')}
                      />
                    )}
                    {download.status === 'paused' && (
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Play24Regular />}
                        onClick={() => handleDownloadAction(download, 'resume')}
                      />
                    )}
                    {download.status === 'failed' && (
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<ArrowClockwise24Regular />}
                        onClick={() => handleDownloadAction(download, 'retry')}
                      />
                    )}
                    {!['completed'].includes(download.status) && (
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Dismiss24Regular />}
                        onClick={() => handleDownloadAction(download, 'cancel')}
                      />
                    )}
                  </div>
                </div>
                
                {download.status === 'downloading' && (
                  <div className={styles.downloadProgress}>
                    <ProgressBar value={download.progress / 100} />
                    <div className={styles.progressInfo}>
                      <span>{download.progress.toFixed(1)}%</span>
                      <span>
                        {formatFileSize(download.downloadedSize)} / {formatFileSize(download.totalSize)}
                      </span>
                    </div>
                  </div>
                )}
                
                {download.error && (
                  <MessageBar intent="error">
                    <MessageBarBody>{download.error}</MessageBarBody>
                  </MessageBar>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Input
            placeholder="搜索APK..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            contentBefore={<Search24Regular />}
          />
        </div>
        <div className={styles.controls}>
          <Dropdown
            placeholder="选择分类"
            value={selectedCategory || "全部分类"}
            onOptionSelect={(_, data) => setSelectedCategory(data.optionValue === "all" ? "" : data.optionValue || "")}
          >
            <Option value="all">全部分类</Option>
            {categories.map((category) => (
              <Option key={category.category} value={category.category} text={`${category.category} (${category.apps.length})`}>
                {category.category} ({category.apps.length})
              </Option>
            ))}
          </Dropdown>
          <Button
            appearance="subtle"
            icon={<ArrowClockwise24Regular />}
            onClick={refreshMarketData}
            disabled={isLoading}
          >
            刷新
          </Button>
          <Button
            appearance="outline"
            onClick={async () => {
              try {
                await forceRefreshData();
                addNotification({
                  type: "success",
                  title: "强制刷新成功",
                  message: "已获取最新的APK市场数据",
                });
              } catch (error) {
                addNotification({
                  type: "error",
                  title: "强制刷新失败",
                  message: `刷新失败: ${error instanceof Error ? error.message : '未知错误'}`,
                });
              }
            }}
            disabled={isLoading}
          >
            强制刷新
          </Button>
          <Button
            appearance="outline"
            onClick={() => {
              clearCache();
              addNotification({
                type: "success",
                title: "缓存已清除",
                message: "APK市场缓存已清除，下次访问将获取最新数据",
              });
            }}
          >
            清除缓存
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.apkList}>
          {renderApkList()}
        </div>
        <div className={styles.downloadPanel}>
          {renderDownloadPanel()}
        </div>
      </div>
    </div>
  );
};

export default ApkMarketCard;
