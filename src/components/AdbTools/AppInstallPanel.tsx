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
  mergeClasses,
  Textarea,
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
    overflow: "hidden",
  },
  splitLayout: {
    display: "flex",
    gap: "16px",
    height: "100%",
    minHeight: 0,
  },
  leftPanel: {
    width: "200px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "20px",
    borderRadius: "12px",
    overflowY: "auto",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: 0,
    height: "100%",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  card: {
    width: "100%",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "4px",
    "&::-webkit-scrollbar": { width: "6px" },
    "&::-webkit-scrollbar-thumb": { 
      backgroundColor: "var(--colorNeutralStroke2)",
      borderRadius: "10px"
    },
  },
  optionsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "4px 0",
  },
  historySection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s ease",
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
    padding: "12px 16px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      transform: "translateX(4px)",
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
    fontFamily: "monospace",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--colorNeutralForeground3)",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    border: "1px dashed var(--colorNeutralStroke2)",
  },
  modeRadio: {
    marginBottom: "8px",
  },
  fullHeightCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
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
              setStatusBarMessage({ type: "info", message: t('app_install.scanning_folder') });
              
              // 读取文件夹内容
              try {
                  const entries = await readDir(selectedDir);
                  // 过滤出 .apk 文件
                  const apkEntries = entries.filter(entry => 
                      entry.isFile && entry.name.toLowerCase().endsWith('.apk')
                  );

                  if (apkEntries.length === 0) {
                      setStatusBarMessage({ type: "warning", message: t('app_install.no_apk_in_folder') });
                      return;
                  }

                  const newFiles: BatchFileItem[] = apkEntries.map(entry => {
                      // 构造完整路径需要注意系统分隔符，这里简单拼接，如果 readDir 返回的不包含 fullPath
                      // 此处假设 entries 主要包含 name. Tauri v2 fs.readDir usually returns name.
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

      // 模拟一点进度，提升UX
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

  // 批量安装逻辑
  const handleBatchInstallClick = async () => {
      if (!checkMode()) return;
      
      const pendingFiles = batchFiles.filter(f => f.status === 'pending' || f.status === 'failed');
      if (pendingFiles.length === 0) {
           setStatusBarMessage({ type: "warning", message: t('app_install.no_pending_files') });
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
                const result = await deviceService.installApk(device!.serial, file.path, replaceExisting);
                
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
      setStatusBarMessage({ type: "success", message: t('app_install.batch_completed') });
  };

  const renderStatusIcon = (status: string) => {
      switch (status) {
          case 'success': return <CheckmarkCircle24Regular color="var(--colorPaletteGreenForeground1)" />;
          case 'failed': return <DismissCircle24Regular color="var(--colorPaletteRedForeground1)" />;
          case 'installing': return <Spinner size="tiny" />;
          default: return <Clock24Regular color="var(--colorNeutralForeground3)" />;
      }
  };

  return (
    <div className={styles.container}>
      <div className={styles.splitLayout}>
        {/* 左侧控制区 */}
        <div className={styles.leftPanel}>
          <div className={styles.sectionTitle}>
            <Apps24Regular />
            <Text weight="semibold" size={400}>{t('app_install.card_title')}</Text>
          </div>

          <div className={styles.optionsSection}>
             <Field label={t('app_install.install_mode')}>
                <RadioGroup 
                  value={installMode} 
                  onChange={(_, data) => setInstallMode(data.value as 'single' | 'batch')}
                  disabled={isInstalling}
                  style={{ display: 'flex', gap: '4px',border: '1px solid var(--colorNeutralStroke2)',borderRadius: '8px' }}
                >
                  <Radio value="single" label={t('app_install.mode_single')} />
                  <Radio value="batch" label={t('app_install.mode_batch')} />
                </RadioGroup>
             </Field>

             {installMode === 'single' && (
                <Field label={t('app_install.path_label')} style={{marginTop:"4px"}}>
                  <div style={{ display: 'flex', gap: '8px',border: '1px solid var(--colorNeutralStroke2)',borderRadius: '8px',width: '90%' }}>
                    <Textarea
                      style={{ flex: 1 ,width:'100%', minHeight: '60px' }}
                      value={apkPath}
                      onChange={(_, data) => setApkPath(data.value)}
                      placeholder={t('app_install.path_placeholder')}
                      disabled={isInstalling}
                      resize="vertical"
                    />
                  </div>
                  <Button
                    appearance="outline"
                    onClick={handleFileSelect}
                    disabled={isInstalling}
                    icon={<DocumentAdd24Regular />}
                    style={{width:'90%',gap:"4px",marginTop:"4px"}}
                  >{t('app_install.select_package')}</Button>
                </Field>
             )}

             {installMode === 'batch' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button 
                    appearance="secondary" 
                    icon={<DocumentAdd24Regular />} 
                    onClick={handleFileSelect}
                    disabled={isInstalling}
                  >
                    {t('app_install.add_files')}
                  </Button>
                  <Button 
                    appearance="secondary" 
                    icon={<Folder24Regular />} 
                    onClick={handleFolderSelect}
                    disabled={isInstalling}
                  >
                    {t('app_install.add_folder')}
                  </Button>
                </div>
             )}

             <Checkbox
               label={t('app_install.replace_existing')}
               checked={replaceExisting}
               onChange={(_, data) => setReplaceExisting(data.checked === true)}
               disabled={isInstalling}
             />

             <Button
               appearance="primary"
               size="large"
               icon={isInstalling ? <Spinner size="small" /> : (installMode === 'single' ? <Apps24Regular /> : <Play24Regular />)}
               onClick={installMode === 'single' ? handleSingleInstallClick : handleBatchInstallClick}
               disabled={!device || isInstalling || (installMode === 'single' && !apkPath) || (installMode === 'batch' && batchFiles.length === 0)}
             >
               {isInstalling ? t('app_install.installing') : (installMode === 'single' ? t('app_install.start_install_single') : t('app_install.start_batch_install'))}
             </Button>
          </div>
        </div>

        {/* 右侧列表区 */}
        <div className={styles.rightPanel}>
          {/* 队列/历史记录 */}
          <div className={mergeClasses(styles.card, styles.fullHeightCard)} style={{ flex: 1.2 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--colorNeutralStroke2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text weight="semibold">{installMode === 'batch' ? t('app_install.install_queue') : t('app_install.history')}</Text>
               {installMode === 'batch' && batchFiles.length > 0 && (
                 <Button appearance="subtle" size="small" icon={<Delete24Regular />} onClick={clearBatchFiles} disabled={isInstalling}>
                   {t('app_install.clear_all')}
                 </Button>
               )}
            </div>
            
            <div className={styles.scrollArea}>
              {installMode === 'batch' ? (
                batchFiles.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Text>{t('app_install.no_files_selected')}</Text>
                  </div>
                ) : (
                  <div className={styles.apkList} style={{ padding: '12px' }}>
                    {batchFiles.map(file => (
                      <div key={file.id} className={styles.apkListItem}>
                        <div className={styles.apkListItemInfo}>
                          <Text className={styles.apkListItemName}>{file.name}</Text>
                          <Text className={styles.apkListItemPath}>{file.path}</Text>
                          {file.message && <Text size={100} style={{ color: file.status === 'failed' ? 'var(--colorPaletteRedForeground1)' : 'var(--colorNeutralForeground2)' }}>{file.message}</Text>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {renderStatusIcon(file.status)}
                          <Button appearance="transparent" icon={<DismissCircle24Regular />} onClick={() => removeBatchFile(file.id)} disabled={isInstalling} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                installHistory.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Text>{t('app_install.no_history')}</Text>
                  </div>
                ) : (
                  <div className={styles.historySection} style={{ padding: '12px' }}>
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
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--colorNeutralStroke2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Folder24Regular />
                 <Text weight="semibold">{t('app_install.local_apks')}</Text>
               </div>
            </div>
            
            <div className={styles.scrollArea}>
              {localApkFiles.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text>{t('app_install.no_apks_found')}</Text>
                </div>
              ) : (
                <div className={styles.apkList} style={{ padding: '12px' }}>
                  {localApkFiles.map((apk, index) => (
                    <div key={index} className={styles.apkListItem}>
                      <div className={styles.apkListItemInfo}>
                        <Text className={styles.apkListItemName}>{apk.name}</Text>
                        <Text className={styles.apkListItemPath}>{apk.path}</Text>
                      </div>
                      <Button
                        appearance="primary"
                        size="small"
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