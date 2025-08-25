import React, { useState, useCallback, useEffect } from 'react';
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
  ProgressBar,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Overflow,
  OverflowItem,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  DocumentAdd24Regular,
  Info24Regular,
  History24Regular,
  StoreMicrosoft24Regular,
  FolderOpen24Regular,
  Shield24Regular,
  Settings24Regular,
  Document24Regular,
  Search24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  ArrowClockwise24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  CloudArrowUp24Regular,
  Wifi124Regular,
  UsbStick24Regular,
  Warning24Regular,
  Phone24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { open } from "@tauri-apps/plugin-dialog";
import { InstalledApp, BatchOperation, ApkInfo } from "../../types/device";
import ErrorDialog from "../Common/ErrorDialog";
import { ErrorInfo } from "../../utils/errorHandler";
import BatchOperationDialog from "./BatchOperationDialog";

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

interface ConnectionInfo {
  serial: string;
  state: string;
  connected: boolean;
  adb_version?: string;
  usb_connection: boolean;
  wifi_connection: boolean;
  connection_type: string;
}

const AppManagerPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  
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
  const [batchOperation, setBatchOperation] = useState<BatchOperation | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  // 应用管理相关状态
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<InstalledApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [confirmUninstallDialogOpen, setConfirmUninstallDialogOpen] = useState(false);
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(null);
  const [batchOperationUninstall, setBatchOperationUninstall] = useState<BatchOperation | null>(null);
  const [batchUninstallDialogOpen, setBatchUninstallDialogOpen] = useState(false);

  // APK信息相关状态
  const [apkInfoPath, setApkInfoPath] = useState("");
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
  const [isLoadingApkInfo, setIsLoadingApkInfo] = useState(false);

  // 连接状态相关状态
  const [isChecking, setIsChecking] = useState(false);
  const [adbAvailable, setAdbAvailable] = useState<boolean | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

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
      addNotification({
        type: "warning",
        title: "文件类型错误",
        message: "请拖拽APK文件",
      });
    }
  }, [addNotification, handleBrowseApk]);

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

  // 应用管理相关函数
  const loadApps = useCallback(async () => {
    if (!selectedDevice) return;

    setIsLoadingApps(true);
    try {
      const installedApps = await deviceService.getInstalledApps(
        selectedDevice.serial,
        includeSystemApps
      );
      setApps(installedApps);
    } catch (error) {
      addNotification({
        type: "error",
        title: "获取应用列表失败",
        message: `无法获取已安装应用列表: ${error}`,
      });
    } finally {
      setIsLoadingApps(false);
    }
  }, [selectedDevice, includeSystemApps, deviceService, addNotification]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredApps(apps);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = apps.filter(app => {
      const nameMatch = app.appName?.toLowerCase().includes(query) || false;
      const packageMatch = app.packageName?.toLowerCase().includes(query) || false;
      return nameMatch || packageMatch;
    });
    setFilteredApps(filtered);
  }, [apps, searchQuery]);

  const handleUninstallClick = (app: InstalledApp) => {
    setAppToUninstall(app);
    setConfirmUninstallDialogOpen(true);
  };

  const confirmUninstall = async () => {
    if (!selectedDevice || !appToUninstall) return;

    setConfirmUninstallDialogOpen(false);
    try {
      const result = await deviceService.uninstallApp(
        selectedDevice.serial,
        appToUninstall.packageName
      );

      if (result.success) {
        addNotification({
          type: "success",
          title: "卸载成功",
          message: `${appToUninstall.appName || appToUninstall.packageName} 已成功卸载`,
        });
        loadApps(); // 重新加载应用列表
      } else {
        addNotification({
          type: "error",
          title: "卸载失败",
          message: result.error || "应用卸载失败",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "卸载失败",
        message: `应用卸载失败: ${error}`,
      });
    }
    setAppToUninstall(null);
  };

  const handleSelectApp = (packageName: string, checked: boolean) => {
    const newSelected = new Set(selectedApps);
    if (checked) {
      newSelected.add(packageName);
    } else {
      newSelected.delete(packageName);
    }
    setSelectedApps(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApps(new Set(filteredApps.map(app => app.packageName)));
    } else {
      setSelectedApps(new Set());
    }
  };

  const handleBatchUninstall = async () => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);

    try {
      const operation = await deviceService.batchUninstallApps(
        selectedDevice.serial,
        packageNames,
        false // 不保留数据
      );

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

      // 重新加载应用列表
      loadApps();

    } catch (error) {
      addNotification({
        type: "error",
        title: "批量卸载失败",
        message: `批量卸载操作失败: ${error}`,
      });
    }
  };

  // APK信息相关函数
  const handleBrowseApkInfo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'APK Files',
          extensions: ['apk']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        setApkInfoPath(selected);
        loadApkInfo(selected);
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "文件选择失败",
        message: `无法选择文件: ${error}`,
      });
    }
  };

  const loadApkInfo = async (path: string) => {
    if (!path) return;

    setIsLoadingApkInfo(true);
    try {
      const info = await deviceService.getApkInfo(path);
      setApkInfo(info);
    } catch (error) {
      addNotification({
        type: "error",
        title: "APK信息获取失败",
        message: `无法解析APK文件: ${error}`,
      });
      setApkInfo(null);
    } finally {
      setIsLoadingApkInfo(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPermissionCategory = (permission: string): string => {
    if (permission.includes('CAMERA')) return '相机';
    if (permission.includes('LOCATION')) return '位置';
    if (permission.includes('MICROPHONE') || permission.includes('RECORD_AUDIO')) return '麦克风';
    if (permission.includes('STORAGE') || permission.includes('EXTERNAL_STORAGE')) return '存储';
    if (permission.includes('PHONE') || permission.includes('CALL')) return '电话';
    if (permission.includes('SMS') || permission.includes('MESSAGE')) return '短信';
    if (permission.includes('CONTACTS')) return '联系人';
    if (permission.includes('CALENDAR')) return '日历';
    if (permission.includes('INTERNET') || permission.includes('NETWORK')) return '网络';
    return '其他';
  };

  // 连接状态相关函数
  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      // 检查ADB可用性
      const adbResult = await deviceService.checkAdbAvailability();
      setAdbAvailable(adbResult.success);

      // 如果有选中的设备，检查设备连接
      if (selectedDevice) {
        const deviceInfo = await deviceService.getDeviceConnectionInfo(selectedDevice.serial);
        setConnectionInfo(deviceInfo as unknown as ConnectionInfo);
      } else {
        setConnectionInfo(null);
      }

      setLastCheckTime(new Date());
    } catch (error) {
      addNotification({
        type: "error",
        title: "状态检查失败",
        message: `无法检查连接状态: ${error}`,
      });
      setAdbAvailable(false);
      setConnectionInfo(null);
    } finally {
      setIsChecking(false);
    }
  }, [selectedDevice, addNotification]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const getAdbStatusIcon = () => {
    if (isChecking) return <Spinner size="small" />;
    if (adbAvailable === null) return <Warning24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
    return adbAvailable ? 
      <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} /> :
      <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
  };

  const getAdbStatusBadge = () => {
    if (adbAvailable === null) return <Badge appearance="outline">未知</Badge>;
    return adbAvailable ? 
      <Badge appearance="filled" color="success">可用</Badge> :
      <Badge appearance="filled" color="danger">不可用</Badge>;
  };

  const getDeviceStatusIcon = () => {
    if (!connectionInfo) return <Warning24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
    return connectionInfo.connected ? 
      <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} /> :
      <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
  };

  const getDeviceStatusBadge = () => {
    if (!connectionInfo) return <Badge appearance="outline">未选择</Badge>;
    return connectionInfo.connected ? 
      <Badge appearance="filled" color="success">已连接</Badge> :
      <Badge appearance="filled" color="danger">未连接</Badge>;
  };

  const getConnectionTypeIcon = () => {
    if (!connectionInfo) return null;
    return connectionInfo.wifi_connection ?
      <Wifi124Regular style={{ color: "var(--colorBrandForeground1)" }} /> :
      <UsbStick24Regular style={{ color: "var(--colorBrandForeground1)" }} />;
  };

  const formatLastCheckTime = () => {
    if (!lastCheckTime) return "从未检查";
    return `最后检查: ${lastCheckTime.toLocaleTimeString()}`;
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

            <div>
              <Text weight="semibold">安装历史</Text>
              {installHistory.length > 0 ? (
                <div className={styles.statusSection}>
                  {installHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className={styles.statusItemHistory}>
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


        {/* 已安装应用卡片 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Apps24Regular />}
            header={<Text weight="semibold">已安装应用</Text>}
            description={<Text size={200}>管理设备上的应用程序</Text>}
            action={
              <Button
                appearance="subtle"
                icon={isLoadingApps ? <Spinner size="tiny" /> : <ArrowClockwise24Regular />}
                onClick={loadApps}
                disabled={isLoadingApps}
                title="刷新应用列表"
              />
            }
          />
          
          <div className={styles.content}>
            <div className={styles.toolbar}>
              <Field className={styles.searchField}>
                <Input
                  contentBefore={<Search24Regular />}
                  placeholder="搜索应用名称或包名..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                />
              </Field>
              
              <Checkbox
                label="包含系统应用"
                checked={includeSystemApps}
                onChange={(_, data) => setIncludeSystemApps(data.checked === true)}
              />
              
              {selectedApps.size > 0 && (
                <Button
                  appearance="primary"
                  icon={<Delete24Regular />}
                  onClick={handleBatchUninstall}
                  disabled={isLoadingApps}
                >
                  批量卸载 ({selectedApps.size})
                </Button>
              )}
            </div>

            {isLoadingApps ? (
              <div className={styles.loadingContainer}>
                <Spinner size="large" label="正在加载应用列表..." />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className={styles.emptyState}>
                <Apps24Regular style={{ fontSize: "48px" }} />
                <Text>未找到应用</Text>
                <Text size={200}>尝试调整搜索条件或刷新列表</Text>
                <Button 
                  appearance="primary" 
                  icon={<ArrowClockwise24Regular />} 
                  onClick={loadApps}
                >
                  刷新应用列表
                </Button>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <Table arial-label="已安装应用列表">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>
                        <Checkbox
                          checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
                          onChange={(_, data) => handleSelectAll(data.checked === true)}
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>应用</TableHeaderCell>
                      <TableHeaderCell>包名</TableHeaderCell>
                      <TableHeaderCell>版本</TableHeaderCell>
                      <TableHeaderCell>类型</TableHeaderCell>
                      <TableHeaderCell>状态</TableHeaderCell>
                      <TableHeaderCell>操作</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app) => (
                      <TableRow key={app.packageName}>
                        <TableCell>
                          <Checkbox
                            checked={selectedApps.has(app.packageName)}
                            onChange={(_, data) => handleSelectApp(app.packageName, data.checked === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div className={styles.appIcon}>
                              <Apps24Regular />
                            </div>
                            <div>
                              <Text weight="semibold">{app.appName || app.packageName}</Text>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Text size={200}>{app.packageName}</Text>
                        </TableCell>
                        <TableCell>
                          <Text size={200}>{app.versionName || "未知"}</Text>
                        </TableCell>
                        <TableCell>
                          <Badge appearance={app.isSystemApp ? "filled" : "outline"}>
                            {app.isSystemApp ? "系统" : "用户"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge appearance={app.isEnabled ? "filled" : "outline"} color={app.isEnabled ? "success" : "warning"}>
                            {app.isEnabled ? "启用" : "禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                appearance="subtle"
                                icon={<MoreHorizontal24Regular />}
                                size="small"
                              />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<Info24Regular />}
                                  onClick={() => {
                                    // 可以在这里显示应用详细信息对话框
                                  }}
                                >
                                  查看详情
                                </MenuItem>
                                {!app.isSystemApp && (
                                  <MenuItem
                                    icon={<Delete24Regular />}
                                    onClick={() => handleUninstallClick(app)}
                                  >
                                    卸载应用
                                  </MenuItem>
                                )}
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
        onRetry={() => {
          // 实现重试逻辑
          setErrorDialogOpen(false);
        }}
        showDetails={true}
      />

      {/* 批量安装对话框 */}
      <BatchOperationDialog
        open={batchDialogOpen}
        operation={batchOperation}
        onClose={() => setBatchDialogOpen(false)}
        onRetry={() => {
          // TODO: 实现重试失败项功能
          setBatchDialogOpen(false);
        }}
      />

      {/* 应用卸载确认对话框 */}
      <Dialog open={confirmUninstallDialogOpen} onOpenChange={(_, data) => setConfirmUninstallDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认卸载应用</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                确定要卸载应用 <strong>{appToUninstall?.appName || appToUninstall?.packageName}</strong> 吗？
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                ⚠️ 此操作将删除应用及其数据，无法撤销
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={confirmUninstall}>
              确认卸载
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* 批量卸载对话框 */}
      <BatchOperationDialog
        open={batchUninstallDialogOpen}
        operation={batchOperationUninstall}
        onClose={() => setBatchUninstallDialogOpen(false)}
        onRetry={() => {
          // TODO: 实现重试失败项功能
          setBatchUninstallDialogOpen(false);
        }}
      />
    </div>
  );
};

export default AppManagerPanel;