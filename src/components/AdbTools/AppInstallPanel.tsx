import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
  Badge,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Spinner,
  Checkbox,
} from "@fluentui/react-components";
import {
  DocumentAdd24Regular,
  Apps24Regular,
  CloudArrowUp24Regular,
  FolderOpen24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { open } from "@tauri-apps/plugin-dialog";
import ErrorDialog from "../Common/ErrorDialog";
import { ErrorInfo } from "../../utils/errorHandler";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 4px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  gridLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  threeColumnLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  fullLayout: {
    height: "100%",
  },
  card: {
    width: "100%",
    height: "fit-content",
    /* 支持下拉*/
    "--scrollbarWidth": "8px",
    "scrollbar-width": "8px",
    
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  toolbar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchField: {
    flex: 1,
    minWidth: "200px",
  },
  tableContainer: {
    flex: 1,
    overflow: "auto",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
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
  appIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pathInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  permissionsList: {
    maxHeight: "200px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  permissionItem: {
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    fontSize: "12px",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
  },
  statusLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  connectionInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  infoItemDetail: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "4px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  installSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  installButton: {
    alignSelf: "flex-start",
  },
  statusItemHistory: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
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

const AppInstallPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();

  // 无需状态管理，已移除标签页相关状态
  const [errorInfo] = useState<ErrorInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // APK安装相关状态
  const [apkPath, setApkPath] = useState("");
  const [apkPaths, setApkPaths] = useState<string[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installHistory, setInstallHistory] = useState<InstallStatus[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // APK安装相关函数
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
      setStatusBarMessage({
        type: "error",
        message: `无法选择文件: ${error}`,
      });
    }
  }, [setStatusBarMessage]);

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
      // 在Tauri中，拖拽的 File 可能包含本地路径: (apkFile as any).path
      const anyFile = apkFile as unknown as { path?: string };
      const fullPath = anyFile?.path || "";
      if (fullPath) {
        setApkPath(fullPath);
        setApkPaths([fullPath]);
      } else {
        // 回退：无法获取路径时，使用文件选择器确保拿到真实路径
        // 注意：异步调用不会阻塞此事件处理
        void handleBrowseApk();
      }
    } else {
      setStatusBarMessage({
        type: "warning",
        message: "请拖拽APK文件",
      });
    }
  }, [setStatusBarMessage, handleBrowseApk]);

  const handleInstallClick = () => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "warning",
        message: "请先选择一个设备",
      });
      return;
    }

    if (!apkPath && apkPaths.length === 0) {
      setStatusBarMessage({
        type: "warning",
        message: "请选择要安装的APK文件",
      });
      return;
    }

    const pathsToInstall = apkPaths.length > 0 ? apkPaths : [apkPath];

    if (pathsToInstall.length > 1) {
      // 批量安装，直接执行
      handleBatchInstall(pathsToInstall);
    } else {
      // 单个安装，直接执行而不显示确认对话框
      confirmInstall();
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

      // 这里应该有批量操作的处理逻辑，但为了简化只保留状态更新
      setStatusBarMessage({
        type: "success",
        message: `开始批量安装 ${paths.length} 个APK文件`,
      });

      // 清空路径
      setApkPath("");
      setApkPaths([]);

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量安装操作失败: ${error}`,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const confirmInstall = async () => {
    if (!selectedDevice || !apkPath) return;

    setIsInstalling(true);

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
        
        setStatusBarMessage({
          type: "success",
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
        
        setStatusBarMessage({
          type: "error",
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
      
      setStatusBarMessage({
        type: "error",
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

  const renderContent = () => {
    return (
      <div className={styles.threeColumnLayout}>
        {/* APK安装卡片 */}
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
                className={mergeClasses(styles.dropZone, isDragOver && styles.dropZoneActive)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CloudArrowUp24Regular style={{ fontSize: "32px", color: "var(--colorBrandForeground1)" }} />
                <Text weight="semibold">拖拽APK文件到此处</Text>

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
                  选择文件
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
                disabled={!selectedDevice || (apkPaths.length === 0 && !apkPath) || isInstalling}
                className={styles.installButton}
              >
                {isInstalling ? "安装中..." : "开始安装"}
              </Button>
            </div>

          </div>
        </Card>

      </div>
    );
  };

  return (
    <div className={styles.container}>
      {renderContent()}

      <ErrorDialog
        open={errorDialogOpen}
        errorInfo={errorInfo}
        onClose={() => setErrorDialogOpen(false)}
        onRetry={() => {
          // 实现重试逻辑
          setErrorDialogOpen(false);
        }}
        showDetails={true}
      />


    </div>
  );
};

export default AppInstallPanel;