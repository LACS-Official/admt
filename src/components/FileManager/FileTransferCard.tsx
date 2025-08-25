import React, { useState }  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Field,
  Input,
  ProgressBar,
  Badge,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  FolderOpen24Regular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  Document24Regular,
  Delete24Regular,
  Folder24Regular,
  ArrowLeft24Regular,
  Home24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { DeviceFile } from "../../types/device";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pathSection: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  transferList: {
    flex: 1,
    minHeight: "200px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    gap: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  statusBadge: {
    fontSize: "11px",
  },
});

interface TransferItem {
  id: string;
  fileName: string;
  type: "upload" | "download";
  progress: number;
  status: "pending" | "running" | "completed" | "failed";
  size?: string;
}

const FileTransferCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();

  const [currentPath, setCurrentPath] = useState("/sdcard/");
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [browseDialogOpen, setBrowseDialogOpen] = useState(false);
  const [deviceFiles, setDeviceFiles] = useState<DeviceFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [browsePath, setBrowsePath] = useState("/sdcard/");
  const [previousPaths, setPreviousPaths] = useState<string[]>([]);

  const columns: TableColumnDefinition<TransferItem>[] = [
    createTableColumn<TransferItem>({
      columnId: "fileName",
      compare: (a, b) => a.fileName.localeCompare(b.fileName),
      renderHeaderCell: () => "文件名",
      renderCell: (item) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Document24Regular />
          <Text size={300}>{item.fileName}</Text>
        </div>
      ),
    }),
    createTableColumn<TransferItem>({
      columnId: "type",
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => "类型",
      renderCell: (item) => (
        <Badge 
          appearance="outline" 
          color={item.type === "upload" ? "brand" : "success"}
          className={styles.statusBadge}
        >
          {item.type === "upload" ? "上传" : "下载"}
        </Badge>
      ),
    }),
    createTableColumn<TransferItem>({
      columnId: "progress",
      compare: (a, b) => a.progress - b.progress,
      renderHeaderCell: () => "进度",
      renderCell: (item) => (
        <div style={{ width: "100px" }}>
          <ProgressBar value={item.progress / 100} />
          <Text size={200}>{item.progress}%</Text>
        </div>
      ),
    }),
    createTableColumn<TransferItem>({
      columnId: "status",
      compare: (a, b) => a.status.localeCompare(b.status),
      renderHeaderCell: () => "状态",
      renderCell: (item) => (
        <Badge 
          appearance="filled"
          color={
            item.status === "completed" ? "success" :
            item.status === "failed" ? "danger" :
            item.status === "running" ? "warning" : "subtle"
          }
          className={styles.statusBadge}
        >
          {
            item.status === "completed" ? "已完成" :
            item.status === "failed" ? "失败" :
            item.status === "running" ? "进行中" : "等待中"
          }
        </Badge>
      ),
    }),
  ];

  const handleBrowseFiles = () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "文件浏览",
        message: "请先选择一个设备",
      });
      return;
    }
    
    // Reset to default path if current path is empty
    const initialPath = currentPath || "/sdcard/";
    setBrowsePath(initialPath);
    setBrowseDialogOpen(true);
    loadDeviceFiles(initialPath);
  };

  const loadDeviceFiles = async (path: string) => {
    if (!selectedDevice) return;

    setIsLoadingFiles(true);
    try {
      // Ensure path ends with a slash
      const normalizedPath = path.endsWith('/') ? path : `${path}/`;
      const files = await deviceService.listDeviceFiles(selectedDevice.serial, normalizedPath);
      
      // Sort directories first, then files, both alphabetically
      const sortedFiles = [...files].sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
      
      setDeviceFiles(sortedFiles);
      
      // Update the path in state to ensure consistency
      setBrowsePath(normalizedPath);
      
      // Add to previous paths for navigation
      setPreviousPaths(prev => {
        // Don't add duplicate consecutive paths
        if (prev.length === 0 || prev[prev.length - 1] !== normalizedPath) {
          return [...prev, normalizedPath];
        }
        return prev;
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "文件列表加载失败",
        message: `无法加载文件列表: ${error}`,
      });
      setDeviceFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleNavigateToPath = (path: string) => {
    if (!path) return;
    
    // Normalize the path to always end with a slash for directories
    let normalizedPath = path;
    if (!path.endsWith('/') && path !== '/') {
      normalizedPath = `${path}/`;
    }
    
    setBrowsePath(normalizedPath);
    loadDeviceFiles(normalizedPath);
  };

  const handleSelectPath = () => {
    setCurrentPath(browsePath);
    setBrowseDialogOpen(false);
  };

  const handleGoBack = () => {
    if (browsePath === '/' || browsePath === '') {
      return; // Already at root
    }
    
    // Get parent directory
    const pathParts = browsePath.split('/').filter(Boolean);
    pathParts.pop(); // Remove last part to get parent
    const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}/` : '/';
    
    handleNavigateToPath(parentPath);
  };

  const handleFileDoubleClick = (file: DeviceFile) => {
    if (file.isDirectory) {
      handleNavigateToPath(file.path);
    } else {
      // Handle file selection for transfer
      setCurrentPath(file.path);
      addNotification({
        type: "success",
        title: "文件已选择",
        message: `已选择文件: ${file.name}`,
      });
    }
  };

  const handleClearCompleted = () => {
    setTransfers(prev => prev.filter(t => t.status !== "completed"));
  };

  const addMockTransfer = (type: "upload" | "download") => {
    const newTransfer: TransferItem = {
      id: Date.now().toString(),
      fileName: type === "upload" ? "example.apk" : "screenshot.png",
      type,
      progress: Math.floor(Math.random() * 100),
      status: ["pending", "running", "completed"][Math.floor(Math.random() * 3)] as "pending" | "running" | "completed",
      size: "2.5 MB",
    };
    setTransfers(prev => [...prev, newTransfer]);
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleUploadFile = async () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "设备未选择",
        message: "请先选择一个设备",
      });
      return;
    }

    // TODO: Implement actual file upload functionality
    addNotification({
      type: "info",
      title: "功能开发中",
      message: "文件上传功能正在开发中",
    });
  };

  const handleDownloadFile = async () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "设备未选择",
        message: "请先选择一个设备",
      });
      return;
    }

    if (!currentPath || currentPath.endsWith('/')) {
      addNotification({
        type: "warning",
        title: "文件未选择",
        message: "请先选择要下载的文件",
      });
      return;
    }

    // TODO: Implement actual file download functionality
    addNotification({
      type: "info",
      title: "功能开发中",
      message: "文件下载功能正在开发中",
    });
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<FolderOpen24Regular />}
        header={<Text weight="semibold">文件传输</Text>}
        description={<Text size={200}>管理设备和本地文件传输</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.pathSection}>
          <Field label="当前路径:" style={{ flex: 1 }}>
            <Input
              value={currentPath}
              onChange={(_, data) => setCurrentPath(data.value)}
              placeholder="/sdcard/"
            />
          </Field>
          <Button
            appearance="secondary"
            icon={<FolderOpen24Regular />}
            onClick={handleBrowseFiles}
          >
            浏览
          </Button>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Text weight="semibold">传输队列</Text>
          <Badge appearance="filled" color="subtle">
            {transfers.length} 个任务
          </Badge>
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <Button
              appearance="primary"
              size="small"
              icon={<ArrowUpload24Regular />}
              onClick={handleUploadFile}
            >
              上传文件
            </Button>
            <Button
              appearance="secondary"
              size="small"
              icon={<ArrowDownload24Regular />}
              onClick={handleDownloadFile}
            >
              下载文件
            </Button>
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowUpload24Regular />}
              onClick={() => addMockTransfer("upload")}
              title="添加模拟上传任务用于测试"
            >
              模拟上传
            </Button>
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload24Regular />}
              onClick={() => addMockTransfer("download")}
              title="添加模拟下载任务用于测试"
            >
              模拟下载
            </Button>
            <Button
              appearance="subtle"
              size="small"
              icon={<Delete24Regular />}
              onClick={handleClearCompleted}
              disabled={!transfers.some(t => t.status === "completed")}
            >
              清除已完成
            </Button>
          </div>
        </div>

        <div className={styles.transferList}>
          {transfers.length > 0 ? (
            <DataGrid
              items={transfers}
              columns={columns}
              sortable
              getRowId={(item) => item.id}
              size="small"
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<TransferItem>>
                {({ item, rowId }) => (
                  <DataGridRow<TransferItem> key={rowId}>
                    {({ renderCell }) => (
                      <DataGridCell>{renderCell(item)}</DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          ) : (
            <div className={styles.emptyState}>
              <FolderOpen24Regular style={{ fontSize: "32px" }} />
              <Text size={300}>暂无传输任务</Text>
              <Text size={200}>使用上方按钮开始文件传输</Text>
            </div>
          )}
        </div>
      </div>

      {/* 文件浏览对话框 */}
      <Dialog open={browseDialogOpen} onOpenChange={(_, data) => setBrowseDialogOpen(data.open)}>
        <DialogSurface style={{ minWidth: "600px", minHeight: "500px" }}>
          <DialogTitle>浏览设备文件</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* 路径导航 */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowLeft24Regular />}
                    onClick={handleGoBack}
                    disabled={browsePath === "/" || !browsePath || isLoadingFiles}
                    title="返回上级目录"
                  >
                    上级
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={<Home24Regular />}
                    onClick={() => handleNavigateToPath('/sdcard/')}
                    disabled={browsePath === '/sdcard/' || isLoadingFiles}
                    title="返回主目录"
                  >
                    主目录
                  </Button>
                  <Field label="当前路径:" style={{ flex: 1 }}>
                    <Input
                      value={browsePath}
                      onChange={(_, data) => setBrowsePath(data.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadDeviceFiles(data.value);
                        }
                      }}
                      placeholder="/sdcard/"
                    />
                  </Field>
                  <Button 
                    appearance="primary" 
                    icon={<ArrowClockwise24Regular />}
                    onClick={() => loadDeviceFiles(browsePath)}
                    disabled={isLoadingFiles}
                    title="刷新当前目录"
                  >
                    刷新
                  </Button>
                </div>
                
                {/* 面包屑导航 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                  <Button 
                    appearance="subtle" 
                    size="small" 
                    onClick={() => handleNavigateToPath('/')}
                    disabled={browsePath === '/'}
                  >
                    根目录
                  </Button>
                  <Text>/</Text>
                  {browsePath && browsePath !== '/' && browsePath.split('/')
                    .filter(Boolean)
                    .map((part, index, parts) => {
                      const path = '/' + parts.slice(0, index + 1).join('/') + '/';
                      return (
                        <React.Fragment key={path}>
                          <Button 
                            appearance="subtle" 
                            size="small" 
                            onClick={() => handleNavigateToPath(path)}
                            disabled={path === browsePath}
                          >
                            {part}
                          </Button>
                          {index < parts.length - 1 && <Text>/</Text>}
                        </React.Fragment>
                      );
                    })}
                </div>

                {/* 文件列表 */}
                <div style={{ height: "300px", overflow: "auto", border: "1px solid var(--colorNeutralStroke2)", borderRadius: "4px" }}>
                  {isLoadingFiles ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <Spinner label="加载文件列表..." />
                    </div>
                  ) : (
                    <div style={{ padding: "8px" }}>
                      {deviceFiles.length === 0 ? (
                        <Text>此目录为空或无法访问</Text>
                      ) : (
                        deviceFiles.map((file) => (
                          <div
                            key={file.path}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              border: "1px solid transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--colorNeutralBackground1Hover)';
                              e.currentTarget.style.borderColor = 'var(--colorNeutralStroke2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                            }}
                            onClick={() => {
                              if (file.isDirectory) {
                                handleNavigateToPath(file.path);
                              } else {
                                // Single click selects file
                                setCurrentPath(file.path);
                                addNotification({
                                  type: "info",
                                  title: "文件已选择",
                                  message: `已选择: ${file.name}`,
                                });
                              }
                            }}
                            onDoubleClick={() => handleFileDoubleClick(file)}
                          >
                            {file.isDirectory ? (
                              <Folder24Regular style={{ color: "var(--colorPaletteBlueForeground1)", fontSize: "20px" }} />
                            ) : (
                              <Document24Regular style={{ color: "var(--colorNeutralForeground2)", fontSize: "20px" }} />
                            )}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Text weight={file.isDirectory ? "semibold" : "regular"} size={300}>
                                  {file.name}
                                </Text>
                                {file.isDirectory && (
                                  <Badge appearance="outline" size="small" color="brand">
                                    文件夹
                                  </Badge>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {!file.isDirectory && file.size && (
                                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                                    {formatFileSize(file.size)}
                                  </Text>
                                )}
                                {file.permissions && (
                                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                    {file.permissions}
                                  </Text>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSelectPath}
            >
              选择此路径
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </Card>
  );
};

export default FileTransferCard;
