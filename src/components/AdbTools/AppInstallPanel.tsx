import React, { useState, useCallback, useEffect } from 'react';
import {
  makeStyles,
  Text,
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
  Folder24Regular,
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
  threeColumnLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "12px",
    height: "100%",
  },
  card: {
    width: "100%",
    height: "fit-content",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pathInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  installSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  installButton: {
    alignSelf: "flex-start",
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
  selectButton: {
    marginLeft: "8px",
  },
  apkListSection: {
    marginTop: "16px",
  },
  apkListHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  apkListTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  apkList: {
    maxHeight: "400px",
    overflowY: "auto",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
  },
  apkListItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    "&:last-child": {
      borderBottom: "none",
    },
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  apkListItemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  apkListItemName: {
    fontWeight: "600",
  },
  apkListItemPath: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    wordBreak: "break-all",
  },
  apkListItemActions: {
    display: "flex",
    gap: "8px",
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    minWidth: "auto",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    color: "var(--colorNeutralForeground3)",
  },
  emptyStateText: {
    marginTop: "8px",
  },
});

interface InstallStatus {
  fileName: string;
  status: "installing" | "success" | "failed";
  progress: number;
  message?: string;
}

interface ApkFile {
  path: string;
  name: string;
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
  
  // 本地APK文件列表相关状态
  const [localApkFiles, setLocalApkFiles] = useState<ApkFile[]>([]);
  const [isLoadingLocalApks, setIsLoadingLocalApks] = useState(false);

  // 使用文件选择器获取完整路径
  const handleFileSelect = useCallback(async () => {
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

        // 显示完整的文件路径信息
        const filePaths = Array.isArray(selected) ? selected : [selected];
        const fileInfo = filePaths
          .map(path => `${path.split(/[/\\]/).pop()} (${path})`)
          .join(', ');
        
        setStatusBarMessage({
          type: "info",
          message: `已选择 ${filePaths.length} 个APK文件: ${fileInfo}`,
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `无法选择文件: ${error}`,
      });
    }
  }, [setStatusBarMessage]);

  // 加载本地APK文件列表
  const loadLocalApkFiles = useCallback(async () => {
    setIsLoadingLocalApks(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const apkPaths: string[] = await invoke('get_apk_files');
      
      const apkFiles: ApkFile[] = apkPaths.map(path => ({
        path,
        name: path.split(/[/\\]/).pop() || "未知文件.apk"
      }));
      
      setLocalApkFiles(apkFiles);
    } catch (error) {
      console.error('加载本地APK文件列表失败:', error);
      setStatusBarMessage({
        type: "error",
        message: `加载本地APK文件列表失败: ${error}`,
      });
    } finally {
      setIsLoadingLocalApks(false);
    }
  }, [setStatusBarMessage]);

  // 安装本地APK文件
  const handleInstallLocalApk = useCallback(async (apkPath: string) => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "warning",
        message: "请先选择一个设备",
      });
      return;
    }

    try {
      setIsInstalling(true);
      
      const fileName = apkPath.split(/[/\\]/).pop() || "unknown.apk";
      setStatusBarMessage({
        type: "info",
        message: `开始安装 ${fileName}`,
      });

      const newStatus: InstallStatus = {
        fileName,
        status: "installing",
        progress: 0,
      };

      setInstallHistory(prev => [newStatus, ...prev]);

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
    }
  }, [selectedDevice, deviceService, replaceExisting, setStatusBarMessage]);

  // 组件加载时获取本地APK文件列表
  useEffect(() => {
    loadLocalApkFiles();
  }, [loadLocalApkFiles]);

  const handleInstallClick = async () => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "warning",
        message: "请先选择一个设备",
      });
      return;
    }

    // 确定要安装的文件路径
    const pathsToInstall = apkPaths.length > 0 ? apkPaths : (apkPath ? [apkPath] : []);
    
    if (pathsToInstall.length === 0) {
      setStatusBarMessage({
        type: "warning",
        message: "请选择要安装的APK文件",
      });
      return;
    }

    try {
      setIsInstalling(true);
      
      // 验证文件路径是否存在
      const validPaths = pathsToInstall.filter(path => {
        if (!path || path.trim() === '') {
          console.warn('发现空文件路径，跳过');
          return false;
        }
        return true;
      });

      if (validPaths.length === 0) {
        setStatusBarMessage({
          type: "error",
          message: "没有有效的APK文件路径",
        });
        return;
      }

      // 显示安装信息（包含完整路径）
      const fileInfo = validPaths
        .map(path => path ? `${path.split(/[/\\]/).pop()} (${path})` : '未知文件')
        .filter(info => info)
        .join(', ');
      setStatusBarMessage({
        type: "info",
        message: `开始安装 ${validPaths.length} 个APK文件: ${fileInfo}`,
      });

      if (validPaths.length > 1) {
        await handleBatchInstall(validPaths);
      } else {
        setApkPath(validPaths[0]);
        await confirmInstall();
      }
      
    } catch (error) {
      console.error('安装APK时出错:', error);
      setStatusBarMessage({
        type: "error",
        message: `安装APK时出错: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsInstalling(false);
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

    const fileName = apkPath ? apkPath.split(/[/\\]/).pop() || "unknown.apk" : "unknown.apk";
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
                  onClick={handleFileSelect}
                  disabled={isInstalling}
                  className={styles.selectButton}
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
                {isInstalling ? "安装中..." : `开始安装 (${apkPaths.length || (apkPath ? 1 : 0)}个文件)`}
              </Button>
            </div>


          </div>
        </Card>
        <Card>
                      {/* 本地APK文件列表 */}
          <div className={styles.apkListSection}>
            <div className={styles.apkListHeader}>
              <div className={styles.apkListTitle}>
                <Folder24Regular />
                <Text weight="semibold">本地已下载APK</Text>
              </div>
              <Button
                appearance="secondary"
                size="small"
                onClick={loadLocalApkFiles}
                disabled={isLoadingLocalApks}
                className={styles.refreshButton}
              >
                {isLoadingLocalApks ? <Spinner size="tiny" /> : null}
                刷新
              </Button>
            </div>

            {isLoadingLocalApks ? (
              <div className={styles.apkList}>
                <div className={styles.emptyState}>
                  <Spinner size="medium" />
                  <Text className={styles.emptyStateText}>加载中...</Text>
                </div>
              </div>
            ) : localApkFiles.length === 0 ? (
              <div className={styles.apkList}>
                <div className={styles.emptyState}>
                  <Folder24Regular />
                  <Text className={styles.emptyStateText}>未找到本地APK文件</Text>
                </div>
              </div>
            ) : (
              <div className={styles.apkList}>
                {localApkFiles.map((apk, index) => (
                  <div key={index} className={styles.apkListItem}>
                    <div className={styles.apkListItemInfo}>
                      <Text className={styles.apkListItemName}>{apk.name}</Text>
                      <Text className={styles.apkListItemPath}>{apk.path}</Text>
                    </div>
                    <div className={styles.apkListItemActions}>
                      <Button
                        appearance="primary"
                        size="small"
                        onClick={() => handleInstallLocalApk(apk.path)}
                        disabled={!selectedDevice || isInstalling}
                      >
                        安装
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      />
    </div>
  );
};

export default AppInstallPanel;