import React, { useState, useCallback, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Field,
  Spinner,
  Checkbox,
  mergeClasses,
  Textarea,
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
  Play24Regular,
  ArrowUpload24Regular,
  FolderOpen24Regular,
  History24Regular,
  Sparkle24Regular,
} from "@fluentui/react-icons";
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
    gap: "16px",
    overflow: "hidden",
  },
  splitLayout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "16px",
    height: "100%",
    minHeight: 0,
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  rightPanel: {
    display: "grid",
    gridTemplateRows: "1fr 1fr",
    gap: "16px",
    minWidth: 0,
    height: "100%",
    minHeight: 0,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "10px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  headerTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--colorNeutralForeground1)",
  },
  segmentedControls: {
    display: "flex",
    padding: "3px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    gap: "4px",
  },
  segmentedButton: {
    flex: 1,
    padding: "6px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 500,
    textAlign: "center",
    cursor: "pointer",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.15s ease",
    "&:hover": {
      color: "var(--colorNeutralForeground1)",
    },
  },
  segmentedButtonActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "#0071e3",
    fontWeight: 600,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
  },
  card: {
    width: "100%",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
    minHeight: 0,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
  },
  cardHeader: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dropzoneCard: {
    padding: "20px 16px",
    borderRadius: "12px",
    border: "1.5px dashed var(--colorNeutralStroke1)",
    backgroundColor: "var(--colorNeutralBackground1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    textAlign: "center",
    transition: "all 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      ...shorthands.borderColor("#0071e3"),
      backgroundColor: "rgba(0, 113, 227, 0.03)",
    },
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "10px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.18s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
    }
  },
  historyItemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  historyItemName: {
    fontWeight: "600",
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  historyItemMessage: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  apkList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  apkListItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "10px",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      ...shorthands.borderColor("var(--colorNeutralStroke1Hover)"),
      transform: "translateY(-1px)",
    },
  },
  apkListItemInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
    marginRight: "12px",
  },
  apkListItemName: {
    fontWeight: "600",
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  apkListItemPath: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: "ui-monospace, Consolas, monospace",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    textAlign: "center",
    color: "var(--colorNeutralForeground3)",
    gap: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "10px",
    border: "1px dashed var(--colorNeutralStroke2)",
    height: "100%",
    boxSizing: "border-box",
  },
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
          name: t('app_install.apk_files'),
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
              setStatusBarMessage({ type: "info", message: t('app_install.scanning_folder') });
              
              try {
                  const entries = await readDir(selectedDir);
                  const apkEntries = entries.filter(entry => 
                      entry.isFile && entry.name.toLowerCase().endsWith('.apk')
                  );

                  if (apkEntries.length === 0) {
                      setStatusBarMessage({ type: "warning", message: t('app_install.no_apk_in_folder') });
                      return;
                  }

                  const newFiles: BatchFileItem[] = apkEntries.map(entry => {
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
    }
  }, [t]);

  // 安装本地APK文件 (桥接到当前模式)
  const handleInstallLocalApk = useCallback(async (path: string) => {
    if (installMode === 'single') {
        setApkPath(path);
    } else {
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

  useEffect(() => {
    loadLocalApkFiles();
  }, [loadLocalApkFiles]);

  const handleSingleInstallClick = async () => {
    if (!checkMode()) return;
    if (!apkPath) {
      setStatusBarMessage({ type: "warning", message: t('app_install.select_apk_first') });
      return;
    }

    try {
      setIsInstalling(true);
      const fileName = apkPath.split(/[/\\]/).pop() || t('app_install.unknown_file');
      
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

      const result = await deviceService.installApk(device!.serial, apkPath, replaceExisting);
      
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
        const fileName = apkPath.split(/[/\\]/).pop() || t('app_install.unknown_file');
        setInstallHistory(prev => prev.map((item, index) => 
            index === 0 ? { ...item, status: "failed", message: String(error) } : item
        ));
      setStatusBarMessage({ type: "error", message: t('app_install.failed', { fileName, error: String(error) }) });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleBatchInstallClick = async () => {
      if (!checkMode()) return;
      
      const pendingFiles = batchFiles.filter(f => f.status === 'pending' || f.status === 'failed');
      if (pendingFiles.length === 0) {
           setStatusBarMessage({ type: "warning", message: t('app_install.no_pending_files') });
           return;
      }

      setIsInstalling(true);

      for (let i = 0; i < pendingFiles.length; i++) {
            const file = pendingFiles[i];
            
            setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'installing', message: t('app_install.installing') } : f));

            try {
                const result = await deviceService.installApk(device!.serial, file.path, replaceExisting);
                
                if (result.success) {
                    setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'success', message: t('app_install.install_success') } : f));
                } else {
                    setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'failed', message: result.error || 'Unknown error' } : f));
                }
            } catch (error) {
                setBatchFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'failed', message: String(error) } : f));
            }
      }

      setIsInstalling(false);
      setStatusBarMessage({ type: "success", message: t('app_install.batch_completed') });
  };

  const renderStatusIcon = (status: string) => {
      switch (status) {
          case 'success': return <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />;
          case 'failed': return <DismissCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
          case 'installing': return <Spinner size="tiny" />;
          default: return <Clock24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
      }
  };

  return (
    <div className={styles.container}>
      <div className={styles.splitLayout}>
        {/* 左侧控制配置面板 */}
        <div className={styles.leftPanel}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitleWrap}>
              <Apps24Regular />
              <Text weight="semibold" size={300}>{t('app_install.card_title')}</Text>
            </div>
          </div>

          {/* 分段模式选择 */}
          <div className={styles.segmentedControls}>
            <button
              className={mergeClasses(styles.segmentedButton, installMode === 'single' && styles.segmentedButtonActive)}
              onClick={() => setInstallMode('single')}
              disabled={isInstalling}
            >
              {t('app_install.mode_single')}
            </button>
            <button
              className={mergeClasses(styles.segmentedButton, installMode === 'batch' && styles.segmentedButtonActive)}
              onClick={() => setInstallMode('batch')}
              disabled={isInstalling}
            >
              {t('app_install.mode_batch')}
            </button>
          </div>

          {/* 单个安装模式 */}
          {installMode === 'single' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={styles.dropzoneCard} onClick={handleFileSelect}>
                <ArrowUpload24Regular style={{ fontSize: '28px', color: '#0071e3' }} />
                <div>
                  <Text size={200} weight="semibold" block>{t('app_install.select_package')}</Text>
                  <Text size={100} color="neutralSecondary" block>{t('app_install.apk_files')}</Text>
                </div>
              </div>

              {apkPath && (
                <Field label={t('app_install.path_label')} size="small">
                  <Textarea
                    value={apkPath}
                    onChange={(_, data) => setApkPath(data.value)}
                    placeholder={t('app_install.path_placeholder')}
                    disabled={isInstalling}
                    rows={2}
                    resize="none"
                  />
                </Field>
              )}
            </div>
          )}

          {/* 批量安装模式 */}
          {installMode === 'batch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button 
                appearance="secondary" 
                shape="circular"
                icon={<DocumentAdd24Regular />} 
                onClick={handleFileSelect}
                disabled={isInstalling}
              >
                {t('app_install.add_files')}
              </Button>
              <Button 
                appearance="secondary" 
                shape="circular"
                icon={<FolderOpen24Regular />} 
                onClick={handleFolderSelect}
                disabled={isInstalling}
              >
                {t('app_install.add_folder')}
              </Button>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Checkbox
              label={t('app_install.replace_existing')}
              checked={replaceExisting}
              onChange={(_, data) => setReplaceExisting(data.checked === true)}
              disabled={isInstalling}
            />

            <Button
              appearance="primary"
              size="large"
              shape="circular"
              icon={isInstalling ? <Spinner size="small" /> : (installMode === 'single' ? <Apps24Regular /> : <Play24Regular />)}
              onClick={installMode === 'single' ? handleSingleInstallClick : handleBatchInstallClick}
              disabled={!device || isInstalling || (installMode === 'single' && !apkPath) || (installMode === 'batch' && batchFiles.length === 0)}
            >
              {isInstalling ? t('app_install.installing') : (installMode === 'single' ? t('app_install.start_install_single') : t('app_install.start_batch_install'))}
            </Button>
          </div>
        </div>

        {/* 右侧列表区域 */}
        <div className={styles.rightPanel}>
          {/* 上半区：当前任务/历史 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History24Regular />
                <Text weight="semibold" size={300}>{installMode === 'batch' ? t('app_install.install_queue') : t('app_install.history')}</Text>
                {installMode === 'batch' && <Badge color="brand" appearance="tint">{batchFiles.length}</Badge>}
              </div>
              {installMode === 'batch' && batchFiles.length > 0 && (
                <Button appearance="subtle" size="small" shape="circular" icon={<Delete24Regular />} onClick={clearBatchFiles} disabled={isInstalling}>
                  {t('app_install.clear_all')}
                </Button>
              )}
            </div>
            
            <div className={styles.scrollArea}>
              {installMode === 'batch' ? (
                batchFiles.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Text size={200}>{t('app_install.no_files_selected')}</Text>
                  </div>
                ) : (
                  <div className={styles.apkList}>
                    {batchFiles.map(file => (
                      <div key={file.id} className={styles.apkListItem}>
                        <div className={styles.apkListItemInfo}>
                          <Text className={styles.apkListItemName}>{file.name}</Text>
                          <Text className={styles.apkListItemPath}>{file.path}</Text>
                          {file.message && <Text size={100} style={{ color: file.status === 'failed' ? 'var(--colorPaletteRedForeground1)' : 'var(--colorNeutralForeground2)' }}>{file.message}</Text>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {renderStatusIcon(file.status)}
                          <Button appearance="transparent" shape="circular" icon={<DismissCircle24Regular />} onClick={() => removeBatchFile(file.id)} disabled={isInstalling} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                installHistory.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Text size={200}>{t('app_install.no_history')}</Text>
                  </div>
                ) : (
                  <div className={styles.apkList}>
                    {installHistory.map((item, index) => (
                      <div key={index} className={styles.historyItem}>
                        {renderStatusIcon(item.status)}
                        <div className={styles.historyItemContent}>
                          <Text className={styles.historyItemName}>{item.fileName}</Text>
                          <Text className={styles.historyItemMessage}>{item.message || t(`app_install.status_${item.status}`)}</Text>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* 下半区：本地预置与快速提取 APK */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Folder24Regular />
                <Text weight="semibold" size={300}>{t('app_install.local_apks')}</Text>
                <Badge appearance="tint">{localApkFiles.length}</Badge>
              </div>
            </div>
            
            <div className={styles.scrollArea}>
              {localApkFiles.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text size={200}>{t('app_install.no_apks_found')}</Text>
                </div>
              ) : (
                <div className={styles.apkList}>
                  {localApkFiles.map((apk, index) => (
                    <div key={index} className={styles.apkListItem}>
                      <div className={styles.apkListItemInfo}>
                        <Text className={styles.apkListItemName}>{apk.name}</Text>
                        <Text className={styles.apkListItemPath}>{apk.path}</Text>
                      </div>
                      <Button
                        appearance="secondary"
                        size="small"
                        shape="circular"
                        onClick={() => handleInstallLocalApk(apk.path)}
                        disabled={isInstalling}
                      >
                        {installMode === 'single' ? t('app_install.select') : t('app_install.add')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ErrorDialog
        open={errorDialogOpen}
        errorInfo={errorInfo}
        onClose={() => setErrorDialogOpen(false)}
      />
    </div>
  );
};

export default AppInstallPanel;