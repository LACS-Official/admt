import React, { useState } from "react";
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
    setBrowsePath(currentPath);
    setBrowseDialogOpen(true);
    loadDeviceFiles(currentPath);
  };

  const loadDeviceFiles = async (path: string) => {
    if (!selectedDevice) return;

    setIsLoadingFiles(true);
    try {
      const files = await deviceService.listDeviceFiles(selectedDevice.serial, path);
      setDeviceFiles(files);
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
    setBrowsePath(path);
    loadDeviceFiles(path);
  };

  const handleSelectPath = () => {
    setCurrentPath(browsePath);
    setBrowseDialogOpen(false);
  };

  const handleGoBack = () => {
    const parentPath = browsePath.split('/').slice(0, -1).join('/') || '/';
    handleNavigateToPath(parentPath);
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
              appearance="subtle"
              size="small"
              icon={<ArrowUpload24Regular />}
              onClick={() => addMockTransfer("upload")}
            >
              模拟上传
            </Button>
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownload24Regular />}
              onClick={() => addMockTransfer("download")}
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
                    disabled={browsePath === "/" || isLoadingFiles}
                  >
                    返回上级
                  </Button>
                  <Field label="当前路径:" style={{ flex: 1 }}>
                    <Input
                      value={browsePath}
                      onChange={(_, data) => setBrowsePath(data.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadDeviceFiles(browsePath);
                        }
                      }}
                    />
                  </Field>
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
                              padding: "8px",
                              borderRadius: "4px",
                              cursor: file.isDirectory ? "pointer" : "default"
                            }}
                            onClick={() => {
                              if (file.isDirectory) {
                                handleNavigateToPath(file.path);
                              }
                            }}
                          >
                            {file.isDirectory ? <Folder24Regular /> : <Document24Regular />}
                            <div style={{ flex: 1 }}>
                              <Text weight={file.isDirectory ? "semibold" : "regular"}>
                                {file.name}
                              </Text>
                              {!file.isDirectory && file.size && (
                                <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginLeft: "8px" }}>
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </Text>
                              )}
                            </div>
                            {file.permissions && (
                              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                                {file.permissions}
                              </Text>
                            )}
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
