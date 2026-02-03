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
  RadioGroup,
  Radio,
  ProgressBar,
  Badge,
} from "@fluentui/react-components";
import {
  DocumentAdd24Regular,
  Apps24Regular,
  Folder24Regular,
  Delete24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  Clock24Regular,
  Play24Regular
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { open } from "@tauri-apps/plugin-dialog";
import { DeviceInfo } from "../../types/device";
import { readDir } from "@tauri-apps/plugin-fs";

import ErrorDialog from "../Common/ErrorDialog";
import { ErrorInfo } from "../../utils/errorHandler";
import { useTranslation } from "react-i18next";

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
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
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
    overflow: "hidden",
  },
  apkListItemName: {
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  apkListItemPath: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    wordBreak: "break-all",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  apkListItemActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
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
  modeSelection: {
    marginBottom: "8px",
  },
  batchActions: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  folderInput: {
      display: "none"
  }
});

interface InstallStatus {
  fileName: string;
  status: "pending" | "installing" | "success" | "failed";
  progress: number;
  message?: string;
}

interface BatchFileItem {
  id: string;
  path: string;
  name: string;
  status: "pending" | "installing" | "success" | "failed";
  message?: string;
}

interface ApkFile {
  path: string;
  name: string;
}

interface AppInstallPanelProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const AppInstallPanel: React.FC<AppInstallPanelProps> = ({ device, onAdbRequired }) => {
  const styles = useStyles();
  const { devices } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();
  const { t } = useTranslation();

  const checkMode = useCallback(() => {
    if (!device) {
       setStatusBarMessage({ type: "warning", message: t('unlock.select_device_first') });
       return false;
    }
    if (device.connected && device.mode !== 'sys' && device.mode !== 'rec') {
      onAdbRequired();
      return false;
    }
    return true;
  }, [device, onAdbRequired, t, setStatusBarMessage]);



  // 无需状态管理，已移除标签页相关状态
  const [errorInfo] = useState<ErrorInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // 安装模式：单个 vs 批量
  const [installMode, setInstallMode] = useState<'single' | 'batch'>('single');

  // APK安装相关状态
  const [apkPath, setApkPath] = useState("");
  // 批量安装文件列表
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  // 单个安装的历史记录/状态
  const [installHistory, setInstallHistory] = useState<InstallStatus[]>([]);
  
  // 本地APK文件列表相关状态
  const [localApkFiles, setLocalApkFiles] = useState<ApkFile[]>([]);
  const [isLoadingLocalApks, setIsLoadingLocalApks] = useState(false);

  // 批量安装进度
  const [batchProgress, setBatchProgress] = useState({ total: 0, current: 0 });

  // 切换模式时清理状态
  useEffect(() => {
    if (installMode === 'single') {
        setBatchFiles([]);
    } else {
        setApkPath("");
    }
  }, [installMode]);

  // 使用文件选择器获取完整路径 (单个/批量文件)
  const handleFileSelect = useCallback(async () => {
    try {
      const selected = await open({
        multiple: installMode === 'batch',
        filters: [{
          name: t('app_install.apk_files', 'APK Files'),
          extensions: ['apk']
        }]
      });

      if (selected) {
        if (installMode === 'single') {
            const path = Array.isArray(selected) ? selected[0] : selected;
             setApkPath(path);
             setStatusBarMessage({
                type: "info",
                message: t('app_install.selected_file', { path }),
             });
        } else {
            // 批量模式：添加到列表
            const paths = Array.isArray(selected) ? selected : [selected];
            const newFiles: BatchFileItem[] = paths.map(path => ({
                id: Math.random().toString(36).substr(2, 9),
                path,
                name: path.split(/[/\\]/).pop() || 'unknown.apk',
                status: 'pending' as const
            }));
            
            setBatchFiles(prev => {
                // 去重
                const existingPaths = new Set(prev.map(f => f.path));
                const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
                return [...prev, ...uniqueNewFiles];
            });

            setStatusBarMessage({
                type: "info",
                message: t('app_install.added_files', { count: paths.length }),
            });
        }
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('app_install.select_file_fail', { error }),
      });
    }
  }, [setStatusBarMessage, installMode, t]);

  // 选择文件夹并扫描APK
  const handleFolderSelect = useCallback(async () => {
      try {
          const selectedDir = await open({
              directory: true,
              multiple: false,
          });

          if (selectedDir && typeof selectedDir === 'string') {
              setStatusBarMessage({ type: "info", message: t('app_install.scanning_folder', 'Scanning folder...') });
              
              // 读取文件夹内容
              try {
                  const entries = await readDir(selectedDir);
                  // 过滤出 .apk 文件
                  const apkEntries = entries.filter(entry => 
                      entry.isFile && entry.name.toLowerCase().endsWith('.apk')
                  );

                  if (apkEntries.length === 0) {
                      setStatusBarMessage({ type: "warning", message: t('app_install.no_apk_in_folder', 'No APK files found in selected folder.') });
                      return;
                  }

                  const newFiles: BatchFileItem[] = apkEntries.map(entry => {
                      // 构造完整路径需要注意系统分隔符，这里简单拼接，如果 readDir 返回的不包含 fullPath
                      // 此处假设 entries 主要包含 name。需要结合 selectedDir 拼接。
                      // Tauri v2 fs.readDir usually returns name.
                      const separator = navigator.userAgent.includes("Windows") ? "\\" : "/";
                      const fullPath = `${selectedDir}${separator}${entry.name}`;
                      
                        return {
                          id: Math.random().toString(36).substr(2, 9),
                          path: fullPath,
                          name: entry.name,
                          status: 'pending' as const
                        };
                  });

                  setBatchFiles(prev => {
                      const existingPaths = new Set(prev.map(f => f.path));
                      const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
                      return [...prev, ...uniqueNewFiles];
                  });

                  setStatusBarMessage({
                      type: "success",
                      message: t('app_install.added_from_folder', { count: apkEntries.length }),
                  });

              } catch (fsError) {
                   console.error("Failed to read dir", fsError);
                   setStatusBarMessage({ type: "error", message: t('app_install.read_dir_fail', { error: String(fsError) }) });
              }
          }
      } catch (error) {
          setStatusBarMessage({ type: "error", message: t('app_install.select_folder_fail', { error }) });
      }
  }, [setStatusBarMessage, t]);

  const removeBatchFile = (id: string) => {
      setBatchFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const clearBatchFiles = () => {
      setBatchFiles([]);
  };

  // 加载本地APK文件列表
  const loadLocalApkFiles = useCallback(async () => {
    setIsLoadingLocalApks(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const apkPaths: string[] = await invoke('get_apk_files');
      
      const apkFiles: ApkFile[] = apkPaths.map(path => ({
        path,
        name: path.split(/[/\\]/).pop() || t('app_install.unknown_file')
      }));
      
      setLocalApkFiles(apkFiles);
    } catch (error) {
      console.error('加载本地APK文件列表失败:', error);
      setStatusBarMessage({
        type: "error",
        message: t('app_install.load_local_fail', { error }),
      });
    } finally {
      setIsLoadingLocalApks(false);
    }
  }, [setStatusBarMessage, t]);

  // 安装本地APK文件 (桥接到当前模式)
  const handleInstallLocalApk = useCallback(async (path: string) => {
    if (installMode === 'single') {
        setApkPath(path);
        // 如果是单击"安装"，可以自动填充路径，或者直接触发安装？
        // 这里仅填充路径
    } else {
        // 添加到批量列表
        const name = path.split(/[/\\]/).pop() || 'unknown.apk';
         setBatchFiles(prev => {
            if (prev.some(f => f.path === path)) return prev;
            return [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                path,
                name,
                status: 'pending'
            }];
        });
    }
  }, [installMode]);

  // 组件加载时获取本地APK文件列表
  useEffect(() => {
    loadLocalApkFiles();
  }, [loadLocalApkFiles]);

  // 单个安装原有逻辑
  const handleSingleInstallClick = async () => {
    if (!checkMode()) return;
    if (!device) {
      setStatusBarMessage({ type: "warning", message: t('app_install.select_device_first') });
      return;
    }
    if (!apkPath) {
      setStatusBarMessage({ type: "warning", message: t('app_install.select_apk_first') });
      return;
    }

    try {
      setIsInstalling(true);
      const fileName = apkPath.split(/[/\\]/).pop() || "unknown.apk";
      
      setStatusBarMessage({
        type: "info",
        message: t('app_install.start_install_info', { count: 1, info: fileName }),
      });

      const newStatus: InstallStatus = {
        fileName,
        status: "installing",
        progress: 0,
      };

      setInstallHistory(prev => [newStatus, ...prev]);

      // 模拟一点进度，提升UX
      const result = await deviceService.installApk(device.serial, apkPath, replaceExisting);
      
      if (result.success) {
        setInstallHistory(prev => prev.map((item, index) => 
            index === 0 ? { ...item, status: "success", progress: 100, message: t('app_install.install_success') } : item
        ));
        setStatusBarMessage({ type: "success", message: t('app_install.success', { fileName }) });
      } else {
        setInstallHistory(prev => prev.map((item, index) => 
            index === 0 ? { ...item, status: "failed", message: result.error || t('common.fail') } : item
        ));
        setStatusBarMessage({ type: "error", message: result.error || t('app_install.failed', { fileName, error: t('common.fail') }) });
      }
    } catch (error) {
        const fileName = apkPath.split(/[/\\]/).pop() || "unknown.apk";
        setInstallHistory(prev => prev.map((item, index) => 
            index === 0 ? { ...item, status: "failed", message: String(error) } : item
        ));
      setStatusBarMessage({ type: "error", message: t('app_install.failed', { fileName, error: String(error) }) });
    } finally {
      setIsInstalling(false);
    }
  };

  // 批量安装逻辑
  const handleBatchInstallClick = async () => {
      if (!checkMode()) return;
      if (!device) {
          setStatusBarMessage({ type: "warning", message: t('app_install.select_device_first') });
          return;
      }
      
      const pendingFiles = batchFiles.filter(f => f.status === 'pending' || f.status === 'failed');
      if (pendingFiles.length === 0) {
           setStatusBarMessage({ type: "warning", message: t('app_install.no_pending_files', 'No pending files to install.') });
           return;
      }

      setIsInstalling(true);
      setBatchProgress({ total: pendingFiles.length, current: 0 });

      // 逐个安装
      for (let i = 0; i < pendingFiles.length; i++) {
            const file = pendingFiles[i];
            
            // 更新当前文件状态为安装中
            setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'installing', message: t('app_install.installing') } : f));
            setBatchProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                const result = await deviceService.installApk(device.serial, file.path, replaceExisting);
                
                if (result.success) {
                    setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'success', message: t('app_install.install_success') } : f));
                } else {
                    // 失败，但继续
                    setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'failed', message: result.error || 'Unknown error' } : f));
                }
            } catch (error) {
                // 异常，但继续
                setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'failed', message: String(error) } : f));
            }
      }

      setIsInstalling(false);
      setStatusBarMessage({ type: "success", message: t('app_install.batch_completed', 'Batch installation completed.') });
  };

  const renderStatusIcon = (status: string) => {
      switch (status) {
          case 'success': return <CheckmarkCircle24Regular color="var(--colorPaletteGreenForeground1)" />;
          case 'failed': return <DismissCircle24Regular color="var(--colorPaletteRedForeground1)" />;
          case 'installing': return <Spinner size="tiny" />;
          default: return <Clock24Regular color="var(--colorNeutralForeground3)" />;
      }
  };

  const renderContent = () => {
    return (
      <div className={styles.threeColumnLayout}>
        {/* APK安装卡片 */}
        <Card className={styles.card}>
          <CardHeader
            image={<DocumentAdd24Regular />}
            header={<Text weight="semibold">{t('app_install.card_title')}</Text>}
            description={
                <div className={styles.modeSelection}>
                     <RadioGroup 
                        layout="horizontal" 
                        value={installMode} 
                        onChange={(_, data) => setInstallMode(data.value as 'single' | 'batch')}
                        disabled={isInstalling}
                     >
                        <Radio value="single" label={t('app_install.mode_single', '单个安装')} />
                        <Radio value="batch" label={t('app_install.mode_batch', '批量安装')} />
                     </RadioGroup>
                </div>
            }
          />
          
          <div className={styles.content}>
            <div className={styles.installSection}>
              
              {installMode === 'single' ? (
                  // 单个安装 UI
                  <div className={styles.pathInput}>
                    <Field label={t('app_install.path_label')} style={{ flex: 1 }}>
                      <Input
                        value={apkPath}
                        onChange={(_, data) => setApkPath(data.value)}
                        placeholder={t('app_install.path_placeholder')}
                        disabled={isInstalling}
                      />
                    </Field>
                    <Button
                      appearance="secondary"
                      onClick={handleFileSelect}
                      disabled={isInstalling}
                      className={styles.selectButton}
                    >
                      {t('app_install.select_file')}
                    </Button>
                  </div>
              ) : (
                  // 批量安装 UI - 按钮区
                  <div className={styles.batchActions}>
                      <Button 
                        appearance="secondary" 
                        icon={<DocumentAdd24Regular />} 
                        onClick={handleFileSelect}
                        disabled={isInstalling}
                      >
                          {t('app_install.add_files', '添加文件')}
                      </Button>
                      <Button 
                        appearance="secondary" 
                        icon={<Folder24Regular />} 
                        onClick={handleFolderSelect}
                        disabled={isInstalling}
                      >
                          {t('app_install.add_folder', '添加文件夹')}
                      </Button>
                      <Button 
                        appearance="subtle" 
                        icon={<Delete24Regular />} 
                        onClick={clearBatchFiles}
                        disabled={isInstalling || batchFiles.length === 0}
                      >
                          {t('app_install.clear_all', '清空')}
                      </Button>
                  </div>
              )}

              <Checkbox
                label={t('app_install.replace_existing')}
                checked={replaceExisting}
                onChange={(_, data) => setReplaceExisting(data.checked === true)}
                disabled={isInstalling}
              />

              {installMode === 'single' ? (
                  <Button
                    appearance="primary"
                    icon={isInstalling ? <Spinner size="small" /> : <Apps24Regular />}
                    onClick={handleSingleInstallClick}
                    disabled={!device || !apkPath || isInstalling}
                    className={styles.installButton}
                  >
                    {isInstalling ? t('app_install.installing') : t('app_install.start_install_single', '开始安装')}
                  </Button>
              ) : (
                   <Button
                    appearance="primary"
                    icon={isInstalling ? <Spinner size="small" /> : <Play24Regular />}
                    onClick={handleBatchInstallClick}
                    disabled={!device || batchFiles.filter(f => f.status !== 'success').length === 0 || isInstalling}
                    className={styles.installButton}
                  >
                    {isInstalling 
                        ? t('app_install.installing_batch', { current: batchProgress.current, total: batchProgress.total, defaultValue: `正在安装 (${batchProgress.current}/${batchProgress.total})` }) 
                        : t('app_install.start_batch_install', { count: batchFiles.filter(f => f.status !== 'success').length, defaultValue: `开始批量安装 (${batchFiles.filter(f => f.status !== 'success').length})` })}
                  </Button>
              )}
            </div>

            {/* 批量文件列表 */}
            {installMode === 'batch' && (
                <div className={styles.apkList} style={{ flex: 1, maxHeight: '300px' }}>
                    {batchFiles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Text className={styles.emptyStateText}>{t('app_install.no_files_selected', '请选择APK文件或文件夹')}</Text>
                        </div>
                    ) : (
                        batchFiles.map(file => (
                            <div key={file.id} className={styles.apkListItem}>
                                <div className={styles.apkListItemInfo}>
                                    <Text className={styles.apkListItemName}>{file.name}</Text>
                                    <Text className={styles.apkListItemPath}>{file.path}</Text>
                                    {file.message && <Text size={100} style={{ color: file.status === 'failed' ? 'var(--colorPaletteRedForeground1)' : 'var(--colorNeutralForeground2)' }}>{file.message}</Text>}
                                </div>
                                <div className={styles.apkListItemActions}>
                                    {renderStatusIcon(file.status)}
                                    <Button
                                        appearance="transparent"
                                        icon={<Delete24Regular />}
                                        onClick={() => removeBatchFile(file.id)}
                                        disabled={isInstalling}
                                        aria-label="Remove"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 单个模式的历史记录 */}
            {installMode === 'single' && installHistory.length > 0 && (
                 <div className={styles.historySection}>
                    <Text weight="semibold">{t('app_install.history')}</Text>
                    {installHistory.map((item, index) => (
                        <div key={index} className={styles.historyItem}>
                             <div className={styles.statusBadge}>
                                {item.status === 'success' && <CheckmarkCircle24Regular color="var(--colorPaletteGreenForeground1)" />}
                                {item.status === 'failed' && <DismissCircle24Regular color="var(--colorPaletteRedForeground1)" />}
                                {item.status === 'installing' && <Spinner size="tiny" />}
                             </div>
                             <div className={styles.historyItemContent}>
                                 <Text className={styles.historyItemName}>{item.fileName}</Text>
                                 <Text className={styles.historyItemMessage}>{item.message || t(`app_install.status_${item.status}`)}</Text>
                             </div>
                        </div>
                    ))}
                 </div>
            )}
            
          </div>
        </Card>
        <Card className={styles.card}>
                      {/* 本地APK文件列表 */}
          <div className={styles.apkListSection}>
            <div className={styles.apkListHeader}>
              <div className={styles.apkListTitle}>
                <Folder24Regular />
                <Text weight="semibold">{t('app_install.local_apks')}</Text>
              </div>
              <Button
                appearance="secondary"
                size="small"
                onClick={loadLocalApkFiles}
                disabled={isLoadingLocalApks}
                className={styles.refreshButton}
              >
                {isLoadingLocalApks ? <Spinner size="tiny" /> : null}
                {t('app_install.refresh')}
              </Button>
            </div>

            {isLoadingLocalApks ? (
              <div className={styles.apkList}>
                <div className={styles.emptyState}>
                  <Spinner size="medium" />
                  <Text className={styles.emptyStateText}>{t('app_install.loading')}</Text>
                </div>
              </div>
            ) : localApkFiles.length === 0 ? (
              <div className={styles.apkList}>
                <div className={styles.emptyState}>
                  <Folder24Regular />
                  <Text className={styles.emptyStateText}>{t('app_install.no_apks_found')}</Text>
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
                        disabled={!device || isInstalling}
                      >
                        {installMode === 'single' ? t('app_install.select') : t('app_install.add')}
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