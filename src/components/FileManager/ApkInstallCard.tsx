import React, { useState, useCallback } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Field,
  Input,
  Checkbox,
  ProgressBar,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner,
} from "@fluentui/react-components";
import {
  DocumentAdd24Regular,
  Apps24Regular,
  FolderOpen24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  CloudArrowUp24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { BatchOperation } from "../../types/device";
import { open } from "@tauri-apps/plugin-dialog";
import BatchOperationDialog from "../AppManager/BatchOperationDialog";

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
  installSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  pathInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  installButton: {
    alignSelf: "flex-start",
  },
  statusSection: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "150px",
    gap: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  dropZone: {
    border: "2px dashed var(--colorNeutralStroke2)",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  dropZoneActive: {
    backgroundColor: "var(--colorBrandBackground2)",
  },
  historySection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
  },
  historyItemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  historyItemName: {
    fontWeight: "600",
  },
  historyItemMessage: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
});

interface InstallStatus {
  fileName: string;
  status: "installing" | "success" | "failed";
  progress: number;
  message?: string;
}

const ApkInstallCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  
  const [apkPath, setApkPath] = useState("");
  const [apkPaths, setApkPaths] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installHistory, setInstallHistory] = useState<InstallStatus[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [batchOperation, setBatchOperation] = useState<BatchOperation | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  const handleBrowseApk = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'APK Files',
          extensions: ['apk']
        }]
      });

      if (selected) {
        if (Array.isArray(selected)) {
          setApkPaths(selected);
          setApkPath(selected.length > 0 ? selected[0] : "");
        } else {
          setApkPath(selected);
          setApkPaths([selected]);
        }
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "文件选择失败",
        message: `无法选择文件: ${error}`,
      });
    }
  }, [addNotification]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const apkFile = files.find(file => file.name.toLowerCase().endsWith('.apk'));

    if (apkFile) {
      // 在Tauri中，我们需要使用文件路径而不是File对象
      // 这里我们假设拖拽的文件已经在本地文件系统中
      setApkPath(apkFile.name); // 这需要根据实际情况调整
    } else {
      addNotification({
        type: "warning",
        title: "文件类型错误",
        message: "请拖拽APK文件",
      });
    }
  }, [addNotification]);

  const handleInstallClick = () => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "APK安装",
        message: "请先选择一个设备",
      });
      return;
    }

    if (!apkPath && apkPaths.length === 0) {
      addNotification({
        type: "warning",
        title: "APK安装",
        message: "请选择要安装的APK文件",
      });
      return;
    }

    const pathsToInstall = apkPaths.length > 0 ? apkPaths : [apkPath];

    if (pathsToInstall.length > 1) {
      // 批量安装，直接执行
      handleBatchInstall(pathsToInstall);
    } else {
      // 单个安装，显示确认对话框
      setConfirmDialogOpen(true);
    }
  };

  const handleBatchInstall = async (paths: string[]) => {
    if (!selectedDevice) return;

    setIsInstalling(true);
    try {
      const operation = await deviceService.batchInstallApks(
        selectedDevice.serial,
        paths,
        replaceExisting
      );

      setBatchOperation(operation);
      setBatchDialogOpen(true);

      // 清空路径
      setApkPath("");
      setApkPaths([]);

    } catch (error) {
      addNotification({
        type: "error",
        title: "批量安装失败",
        message: `批量安装操作失败: ${error}`,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const confirmInstall = async () => {
    if (!selectedDevice || !apkPath) return;

    setIsInstalling(true);
    setConfirmDialogOpen(false);

    const fileName = apkPath.split(/[/\\]/).pop() || "unknown.apk";
    const newStatus: InstallStatus = {
      fileName,
      status: "installing",
      progress: 0,
    };

    setInstallHistory(prev => [newStatus, ...prev]);

    try {
      // 模拟安装进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setInstallHistory(prev => 
          prev.map((item, index) => 
            index === 0 ? { ...item, progress: i } : item
          )
        );
      }

      const result = await deviceService.installApk(selectedDevice.serial, apkPath, replaceExisting);
      
      if (result.success) {
        setInstallHistory(prev => 
          prev.map((item, index) => 
            index === 0 ? { 
              ...item, 
              status: "success", 
              progress: 100,
              message: "安装成功"
            } : item
          )
        );
        
        addNotification({
          type: "success",
          title: "APK安装",
          message: `${fileName} 安装成功`,
        });
      } else {
        setInstallHistory(prev => 
          prev.map((item, index) => 
            index === 0 ? { 
              ...item, 
              status: "failed", 
              message: result.error || "安装失败"
            } : item
          )
        );
        
        addNotification({
          type: "error",
          title: "安装失败",
          message: result.error || "APK安装失败",
        });
      }
    } catch (error) {
      setInstallHistory(prev => 
        prev.map((item, index) => 
          index === 0 ? { 
            ...item, 
            status: "failed", 
            message: `安装失败: ${error}`
          } : item
        )
      );
      
      addNotification({
        type: "error",
        title: "安装失败",
        message: `APK安装失败: ${error}`,
      });
    } finally {
      setIsInstalling(false);
      setApkPath("");
      setReplaceExisting(false);
    }
  };

  const getStatusIcon = (status: InstallStatus["status"]) => {
    switch (status) {
      case "installing":
        return <Spinner size="small" />;
      case "success":
        return <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />;
      case "failed":
        return <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
    }
  };

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<DocumentAdd24Regular />}
          header={<Text weight="semibold">APK安装</Text>}
          description={<Text size={200}>安装Android应用程序包</Text>}
        />
        
        <div className={styles.content}>
          <div className={styles.installSection}>
            {/* 拖拽区域 */}
            <div
              className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseApk}
            >
              <CloudArrowUp24Regular style={{ fontSize: "32px", color: "var(--colorBrandForeground1)" }} />
              <Text weight="semibold">拖拽APK文件到此处或点击选择</Text>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                支持 .apk 格式文件
              </Text>
            </div>

            <div className={styles.pathInput}>
              <Field label="APK文件路径:" style={{ flex: 1 }}>
                <Input
                  value={apkPath}
                  onChange={(_, data) => setApkPath(data.value)}
                  placeholder="选择要安装的APK文件"
                  disabled={isInstalling}
                />
              </Field>
              <Button
                appearance="secondary"
                icon={<FolderOpen24Regular />}
                onClick={handleBrowseApk}
                disabled={isInstalling}
              >
                浏览
              </Button>
            </div>

            <Checkbox
              label="替换已存在的应用"
              checked={replaceExisting}
              onChange={(_, data) => setReplaceExisting(data.checked === true)}
              disabled={isInstalling}
            />

            <Button
              appearance="primary"
              icon={isInstalling ? <Spinner size="small" /> : <Apps24Regular />}
              onClick={handleInstallClick}
              disabled={!selectedDevice || !apkPath || isInstalling}
              className={styles.installButton}
            >
              {isInstalling ? "安装中..." : "开始安装"}
            </Button>
          </div>

          <div>
            <Text weight="semibold">安装历史</Text>
            {installHistory.length > 0 ? (
              <div className={styles.statusSection}>
                {installHistory.slice(0, 5).map((item, index) => (
                  <div key={index} className={styles.statusItem}>
                    {getStatusIcon(item.status)}
                    <div style={{ flex: 1 }}>
                      <Text size={300} weight="semibold">{item.fileName}</Text>
                      {item.status === "installing" && (
                        <ProgressBar value={item.progress / 100} />
                      )}
                      {item.message && (
                        <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                          {item.message}
                        </Text>
                      )}
                    </div>
                    <Badge 
                      appearance="filled"
                      color={
                        item.status === "success" ? "success" :
                        item.status === "failed" ? "danger" : "warning"
                      }
                    >
                      {
                        item.status === "success" ? "成功" :
                        item.status === "failed" ? "失败" : "安装中"
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Apps24Regular style={{ fontSize: "32px" }} />
                <Text size={300}>暂无安装记录</Text>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={(_, data) => setConfirmDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认安装APK</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                确定要在设备 <strong>{selectedDevice?.serial}</strong> 上安装以下APK吗？
              </Text>
              <br />
              <Text weight="semibold">{apkPath.split(/[/\\]/).pop()}</Text>
              <br />
              {replaceExisting && (
                <Text size={200} style={{ color: "var(--colorPaletteYellowForeground1)" }}>
                  ⚠️ 将替换已存在的应用
                </Text>
              )}
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={confirmInstall}>
              确认安装
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      <BatchOperationDialog
        open={batchDialogOpen}
        operation={batchOperation}
        onClose={() => setBatchDialogOpen(false)}
        onRetry={() => {
          // TODO: 实现重试失败项功能
          setBatchDialogOpen(false);
        }}
      />
    </>
  );
};

export default ApkInstallCard;
