import React, { useState, useCallback, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Badge,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Spinner,
  Checkbox,
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
  Radio,
  RadioGroup,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  ArrowClockwise24Regular,
  Delete24Regular,
  Info24Regular,
  Search24Regular,
  MoreHorizontal24Regular,
} from "@fluentui/react-icons";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { InstalledApp, BatchOperation } from "../../types/device";
import ErrorDialog from "../Common/ErrorDialog";
import { ErrorInfo } from "../../utils/errorHandler";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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
    maxHeight: "400px",
    overflow: "auto",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    "&::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--colorNeutralStroke2)",
      borderRadius: "4px",
      "&:hover": {
        backgroundColor: "var(--colorNeutralStroke1)",
      },
    },
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
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  compactTableRow: {
    height: "40px",
  },
  truncatedText: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    "&:hover": {
      overflow: "visible",
      whiteSpace: "normal",
      wordBreak: "break-all",
      backgroundColor: "var(--colorNeutralBackground1)",
      padding: "4px",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      position: "relative",
    },
  },
  packageNameText: {
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: "12px",
    "&:hover": {
      overflow: "visible",
      whiteSpace: "normal",
      wordBreak: "break-all",
      backgroundColor: "var(--colorNeutralBackground1)",
      padding: "4px",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 1000,
      position: "relative",
    },
  },
  compactCell: {
    padding: "4px 8px",
    verticalAlign: "middle",
  },
  appNameContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
  },
  appNameText: {
    minWidth: 0,
    flex: 1,
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  radioGroup: {
    //横向排列
    display: "flex",
    gap: "8px",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
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
  const { setStatusBarMessage } = useAppStore();

  // 无需状态管理，已移除标签页相关状态
  const [errorInfo] = useState<ErrorInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // 应用管理相关状态
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<InstalledApp[]>([]);
  const [viewSource, setViewSource] = useState<"apps" | "frozen" | "current" | null>(null);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [confirmUninstallDialogOpen, setConfirmUninstallDialogOpen] = useState(false);
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(null);
  const [batchOperationUninstall, setBatchOperationUninstall] = useState<BatchOperation | null>(null);
  const [batchUninstallDialogOpen, setBatchUninstallDialogOpen] = useState(false);
  const [appCache, setAppCache] = useState<Map<string, {apps: InstalledApp[], timestamp: number, includeSystem: boolean}>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
  const [loadingProgress, setLoadingProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  const [performanceStats, setPerformanceStats] = useState<{loadTime: number, appCount: number, isOptimized: boolean}>({loadTime: 0, appCount: 0, isOptimized: false});
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [frozenAppsWithVersion, setFrozenAppsWithVersion] = useState<InstalledApp[]>([]);
  
  // 默认加载当前应用
  useEffect(() => {
    if (selectedDevice && !viewSource) {
      loadCurrentApp();
    }
  }, [selectedDevice]);

  // 应用管理相关函数（超级优化版本）
  const loadApps = useCallback(async (forceRefresh = false) => {
    if (!selectedDevice) return;

    // 检查缓存（方案3：缓存机制优化）
    const cacheKey = `${selectedDevice.serial}_${includeSystemApps}`;
    const cached = appCache.get(cacheKey);
    const now = Date.now();

    // 如果有有效缓存且不是强制刷新，则使用缓存
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setApps(cached.apps);
      setViewSource("apps");
      setStatusBarMessage({
        type: "success",
        message: `已获取 ${cached.apps.length} 个已安装应用（缓存）`,
      });
      return;
    }

    setIsLoadingApps(true);
    setLoadingProgress({current: 0, total: 0}); // 重置进度
    const startTime = Date.now();
    
    try {
      // 使用超级优化的后端批量获取命令
      const { invoke } = await import('@tauri-apps/api/core');
      const installedApps = await invoke<InstalledApp[]>('get_installed_apps', {
        serial: selectedDevice.serial,
        includeSystem: includeSystemApps
      });

      const loadTime = Date.now() - startTime;
      
      // 调试输出：查看返回的应用数据结构
      console.log('📱 获取到的应用数据样本:', installedApps.slice(0, 3));
      console.log('📱 第一个应用的详细信息:', installedApps[0]);
      
      // 转换字段名格式（从snake_case到camelCase）并创建应用对象数组
       const appsWithVersion: InstalledApp[] = installedApps.map((app: any) => ({
         packageName: app.package_name || app.packageName || '',
         versionName: app.version_name || app.versionName || '未知',
         versionCode: app.version_code || app.versionCode || '',
         isSystemApp: app.is_system_app || app.isSystemApp || false,
         isEnabled: app.is_enabled !== undefined ? app.is_enabled : (app.isEnabled !== undefined ? app.isEnabled : true),
         // 保留其他可能存在的字段
         installLocation: app.installLocation || '',
         apkPath: app.apkPath || '',
         installTime: app.installTime || '',
         updateTime: app.updateTime || '',
         permissions: app.permissions || []
       }));
      
      setApps(appsWithVersion);
      setViewSource("apps");

      // 更新性能统计
      setPerformanceStats({
        loadTime,
        appCount: appsWithVersion.length,
        isOptimized: loadTime < 2000 // 2秒内完成认为是优化效果
      });

      // 更新缓存
      setAppCache(prev => new Map(prev.set(cacheKey, {
        apps: appsWithVersion,
        timestamp: now,
        includeSystem: includeSystemApps
      })));

      setStatusBarMessage({
        type: "success",
        message: `成功获取 ${appsWithVersion.length} 个已安装应用（耗时 ${loadTime}ms）`,
      });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `无法获取已安装应用列表: ${error}`,
      });
      setApps([]);
      
      // 显示友好的错误提示，提供重试选项
      console.error('获取应用列表失败:', error);
    } finally {
      setIsLoadingApps(false);
      setLoadingProgress({current: 0, total: 0}); // 清除进度
    }
  }, [selectedDevice, includeSystemApps, deviceService, setStatusBarMessage, appCache, CACHE_DURATION]);

  // 分批加载应用列表（每10个应用显示一次）
  const loadAppsBatch = useCallback(async (forceRefresh = false) => {
    if (!selectedDevice) return;

    // 检查缓存（方案3：缓存机制优化）
    const cacheKey = `${selectedDevice.serial}_${includeSystemApps}`;
    const cached = appCache.get(cacheKey);
    const now = Date.now();

    // 如果有有效缓存且不是强制刷新，则使用缓存
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setApps(cached.apps);
      setViewSource("apps");
      setStatusBarMessage({
        type: "success",
        message: `已获取 ${cached.apps.length} 个已安装应用（缓存）`,
      });
      return;
    }

    setIsLoadingApps(true);
    setLoadingProgress({current: 0, total: 0}); // 重置进度
    setApps([]); // 清空当前应用列表，准备分批加载
    const startTime = Date.now();
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const BATCH_SIZE = 10; // 每批加载10个应用
      let batchIndex = 0;
      let allApps: InstalledApp[] = [];
      let totalApps = 0;
      
      // 开始分批加载
      while (true) {
        const result = await invoke<[InstalledApp[], number]>('get_installed_apps_batch', {
          serial: selectedDevice.serial,
          includeSystem: includeSystemApps,
          batchSize: BATCH_SIZE,
          batchIndex: batchIndex
        });
        
        const [batchApps, totalCount] = result;
        totalApps = totalCount;
        
        // 转换字段名格式（从snake_case到camelCase）并创建应用对象数组
        const appsWithVersion: InstalledApp[] = batchApps.map((app: any) => ({
          packageName: app.package_name || app.packageName || '',
          versionName: app.version_name || app.versionName || '未知',
          versionCode: app.version_code || app.versionCode || '',
          isSystemApp: app.is_system_app || app.isSystemApp || false,
          isEnabled: app.is_enabled !== undefined ? app.is_enabled : (app.isEnabled !== undefined ? app.isEnabled : true),
          // 保留其他可能存在的字段
          installLocation: app.installLocation || '',
          apkPath: app.apkPath || '',
          installTime: app.installTime || '',
          updateTime: app.updateTime || '',
          permissions: app.permissions || []
        }));
        
        // 调试信息：打印当前批次加载的应用
        console.log(`📦 加载第 ${batchIndex + 1} 批应用，数量: ${appsWithVersion.length}`, appsWithVersion.map(app => app.packageName));
        
        // 将新加载的应用添加到总列表中
        allApps = [...allApps, ...appsWithVersion];
        
        // 立即更新UI显示，确保用户能看到每批新加载的应用
        setApps([...allApps]); // 使用展开运算符创建新数组，强制React重新渲染
        setViewSource("apps");
        
        // 更新进度
        setLoadingProgress({
          current: allApps.length,
          total: totalApps
        });
        
        // 调试信息：打印当前进度
        console.log(`📊 当前进度: ${allApps.length}/${totalApps}`);
        
        // 让UI先更新完成，再添加延迟
        await new Promise(resolve => setTimeout(resolve, 100)); // 给UI一点时间更新
        
        // 添加较长的延迟，让用户能清楚地看到每批应用的加载效果
        await new Promise(resolve => setTimeout(resolve, 600)); // 增加延迟时间到600ms
        
        // 如果已经加载完所有应用，退出循环
        if (allApps.length >= totalApps) {
          break;
        }
        
        batchIndex++;
        
        // 添加短暂延迟，让UI有时间更新
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const loadTime = Date.now() - startTime;
      
      // 更新性能统计
      setPerformanceStats({
        loadTime,
        appCount: allApps.length,
        isOptimized: loadTime < 2000 // 2秒内完成认为是优化效果
      });

      // 更新缓存
      setAppCache(prev => new Map(prev.set(cacheKey, {
        apps: allApps,
        timestamp: now,
        includeSystem: includeSystemApps
      })));

      setStatusBarMessage({
        type: "success",
        message: `成功获取 ${allApps.length} 个已安装应用（耗时 ${loadTime}ms）`,
      });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `无法获取已安装应用列表: ${error}`,
      });
      setApps([]);
      
      // 显示友好的错误提示，提供重试选项
      console.error('获取应用列表失败:', error);
    } finally {
      setIsLoadingApps(false);
      setLoadingProgress({current: 0, total: 0}); // 清除进度
    }
  }, [selectedDevice, includeSystemApps, deviceService, setStatusBarMessage, appCache, CACHE_DURATION]);



  useEffect(() => {
    const query = (searchQuery || "").toLowerCase();
    let source: InstalledApp[] = [];

    if (viewSource === "apps") {
      source = apps;
    } else if (viewSource === "frozen") {
      // 使用带有版本信息的已冻结应用列表
      source = frozenAppsWithVersion;
      
      // 如果还没有获取版本信息，触发loadFrozenApps来获取版本信息
      if (frozenAppsWithVersion.length === 0) {
        setTimeout(() => {
          loadFrozenApps();
        }, 0);
      }
    } else if (viewSource === "current") {
      if (currentApp) {
        const found = apps.find(a => a.packageName === currentApp);
        if (found) {
          // 如果找到了应用且有版本信息，直接使用
          source = [found];
        } else {
          // 如果没有找到应用或者应用没有版本信息，创建一个带有版本信息的占位对象
          // 这里的版本信息会在loadCurrentApp函数中获取并更新
          source = [{
            packageName: currentApp,
            versionName: "正在获取版本信息...",
            isEnabled: true,
            isSystemApp: false,
          } as unknown as InstalledApp];
          
          // 如果当前应用不在apps数组中，触发loadCurrentApp来获取版本信息
          // 使用setTimeout避免在渲染过程中直接调用函数
          if (!found) {
            setTimeout(() => {
              loadCurrentApp();
            }, 0);
          }
        }
      } else {
        source = [];
      }
    } else {
      source = [];
    }

    const filtered = query
      ? source.filter(app => app.packageName?.toLowerCase().includes(query))
      : source;

    setFilteredApps(filtered);
  }, [apps, frozenAppsWithVersion, currentApp, searchQuery, viewSource]);

  const handleUninstallClick = (app: InstalledApp) => {
    setAppToUninstall(app);
    setConfirmUninstallDialogOpen(true);
  };

  const confirmUninstall = async () => {
    if (!selectedDevice || !appToUninstall) return;

    setConfirmUninstallDialogOpen(false);
    try {
      // 使用 adb shell pm uninstall 命令卸载应用
      const result = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        "shell",
        [`pm uninstall ${appToUninstall.packageName}`]
      );

      if (result.success) {
        // 检查输出是否包含成功信息
        if (result.output && (result.output.includes('Success') || result.output.includes('成功'))) {
          setStatusBarMessage({
            type: "success",
            message: `${appToUninstall.packageName} 已成功卸载`,
          });
          loadAppsBatch(); // 重新加载应用列表
        } else {
          setStatusBarMessage({
            type: "error",
            message: result.output || result.error || "应用卸载失败",
          });
        }
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "应用卸载失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
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

  // 批量卸载应用
  const handleBatchUninstall = async () => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: `开始卸载 ${packageNames.length} 个应用...`,
      });

      // 逐个卸载应用
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(
            selectedDevice.serial,
            "shell",
            [`pm uninstall ${packageName}`]
          );

          if (result.success && result.output && 
              (result.output.includes('Success') || result.output.includes('成功'))) {
            successCount++;
            results.push(`✓ ${packageName}: 卸载成功`);
          } else {
            failCount++;
            results.push(`✗ ${packageName}: ${result.output || result.error || '卸载失败'}`);
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量卸载结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `成功: ${successCount}个, 失败: ${failCount}个`,
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: 'uninstall',
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: 'completed',
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith('✓') ? 'success' : 'failed',
          message: result,
        })),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

      // 重新加载应用列表
      loadAppsBatch();

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量卸载操作失败: ${error}`,
      });
    }
  };

  // 批量冻结/解冻应用
  const handleBatchFreezeToggle = async (freeze: boolean) => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: `开始${freeze ? '冻结' : '解冻'} ${packageNames.length} 个应用...`,
      });

      // 逐个冻结/解冻应用
      for (const packageName of packageNames) {
        try {
          const cmd = freeze ? `pm disable-user ${packageName}` : `pm enable ${packageName}`;
          const result = await deviceService.executeAdbCommand(selectedDevice.serial, "shell", [cmd]);
          
          if (result.success) {
            successCount++;
            results.push(`✓ ${packageName}: ${freeze ? '冻结' : '解冻'}成功`);
            
            // 更新apps数组中的应用状态
            setApps(prev => 
              prev.map(app => 
                app.packageName === packageName 
                  ? { ...app, isEnabled: !freeze } 
                  : app
              )
            );
          } else {
            failCount++;
            results.push(`✗ ${packageName}: ${result.output || result.error || '操作失败'}`);
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `成功: ${successCount}个, 失败: ${failCount}个`,
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: freeze ? 'freeze' : 'unfreeze',
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: 'completed',
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith('✓') ? 'success' : 'failed',
          message: result,
        })),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

      // 重新获取已冻结应用列表（如果当前视图是已冻结应用）
      if (viewSource === "frozen") {
        try {
          const frozenApps = await deviceService.getFrozenApps(selectedDevice.serial);
          if (frozenApps) {
            const frozenAppsWithVersion: InstalledApp[] = frozenApps.map((app: any) => ({
              packageName: app.package_name || '',
              versionName: app.version_name || '',
              versionCode: app.version_code || '',
              isSystemApp: app.is_system_app || false,
              isEnabled: app.is_enabled || false,
              installLocation: app.install_location || '',
              apkPath: app.apk_path || '',
              installTime: app.install_time || '',
              updateTime: app.update_time || '',
              permissions: app.permissions || [],
            }));
            setFrozenAppsWithVersion(frozenAppsWithVersion);
          }
        } catch (error) {
          console.error('重新获取已冻结应用列表失败:', error);
        }
      }

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量${freeze ? '冻结' : '解冻'}操作失败: ${error}`,
      });
    }
  };

  // 批量强制停止应用
  const handleBatchForceStop = async () => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: `开始强制停止 ${packageNames.length} 个应用...`,
      });

      // 逐个强制停止应用
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(
            selectedDevice.serial,
            "shell",
            [`am force-stop ${packageName}`]
          );

          if (result.success) {
            successCount++;
            results.push(`✓ ${packageName}: 强制停止成功`);
          } else {
            failCount++;
            results.push(`✗ ${packageName}: ${result.output || result.error || '强制停止失败'}`);
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `成功: ${successCount}个, 失败: ${failCount}个`,
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: 'forceStop',
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: 'completed',
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith('✓') ? 'success' : 'failed',
          message: result,
        })),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量强制停止操作失败: ${error}`,
      });
    }
  };

  // 批量提取安装包
  const handleBatchExportApk = async () => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      // 选择保存目录
      const targetDir = await openDialog({ directory: true, multiple: false });
      if (!targetDir || typeof targetDir !== "string") {
        setStatusBarMessage({ type: "info", message: "已取消批量导出" });
        return;
      }

      setStatusBarMessage({
        type: "info",
        message: `开始导出 ${packageNames.length} 个应用的安装包...`,
      });

      // 逐个导出应用安装包
      for (const packageName of packageNames) {
        try {
          // 获取APK路径
          const pathResult = await deviceService.executeAdbCommand(selectedDevice.serial, "shell", [`pm path ${packageName}`]);
          if (!pathResult.success || !pathResult.output) {
            failCount++;
            results.push(`✗ ${packageName}: 无法获取APK路径`);
            continue;
          }
          
          const apkLine = pathResult.output.split(/\r?\n/).find(l => l.startsWith("package:"));
          if (!apkLine) {
            failCount++;
            results.push(`✗ ${packageName}: 未找到APK路径`);
            continue;
          }
          
          const remotePath = apkLine.replace("package:", "").trim();
          const localPath = `${targetDir}/${packageName}.apk`;

          // 执行 pull
          const pullResult = await deviceService.executeAdbCommand(selectedDevice.serial, "pull", [remotePath, localPath]);
          if (pullResult.success) {
            successCount++;
            results.push(`✓ ${packageName}: APK 已导出到：${localPath}`);
          } else {
            failCount++;
            results.push(`✗ ${packageName}: ${pullResult.output || pullResult.error || '导出失败'}`);
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `成功: ${successCount}个, 失败: ${failCount}个`,
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: 'exportApk',
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: 'completed',
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith('✓') ? 'success' : 'failed',
          message: result,
        })),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量导出安装包操作失败: ${error}`,
      });
    }
  };

  // 批量清除应用数据
  const handleBatchClearData = async () => {
    if (!selectedDevice || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: `开始清除 ${packageNames.length} 个应用的数据...`,
      });

      // 逐个清除应用数据
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(selectedDevice.serial, "shell", [`pm clear ${packageName}`]);
          
          if (result.success && result.output && /Success|成功/.test(result.output)) {
            successCount++;
            results.push(`✓ ${packageName}: 数据清除成功`);
          } else {
            failCount++;
            results.push(`✗ ${packageName}: ${result.output || result.error || '清除数据失败'}`);
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: `成功: ${successCount}个, 失败: ${failCount}个`,
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: 'clearData',
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: 'completed',
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith('✓') ? 'success' : 'failed',
          message: result,
        })),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      setBatchOperationUninstall(operation);
      setBatchUninstallDialogOpen(true);

      // 清空选择
      setSelectedApps(new Set());

    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `批量清除数据操作失败: ${error}`,
      });
    }
  };

  // 获取当前前台应用包名和版本信息
  const loadCurrentApp = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      // 获取当前前台应用包名
      const activityResult = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        "shell",
        ["dumpsys activity activities"]
      );
      
      if (!activityResult.success || !activityResult.output) {
        setStatusBarMessage({ type: "error", message: activityResult.error || "获取当前应用失败" });
        return;
      }

      const lines = activityResult.output.split(/\r?\n/);
      // 查找包含 ResumedActivity 的行
      const resumed = lines.find(l => /ResumedActivity|mResumedActivity/.test(l));
      
      if (!resumed) {
        setStatusBarMessage({ type: "info", message: "未解析到当前前台应用" });
        return;
      }

      // 解析形如 com.example/.MainActivity 或 com.example/com.example.MainActivity
      const match = resumed.match(/ ([a-zA-Z0-9_.]+)\/[a-zA-Z0-9_.]+/);
      if (!match || !match[1]) {
        setStatusBarMessage({ type: "info", message: "未解析到当前前台应用包名" });
        return;
      }

      const packageName = match[1];
      setCurrentApp(packageName);
      
      // 获取应用版本信息
      try {
        const packageResult = await deviceService.executeAdbCommand(
          selectedDevice.serial,
          "shell",
          [`dumpsys package ${packageName} | grep -E "versionName|versionCode"`]
        );
        
        let versionName = "";
        let versionCode = "";
        
        if (packageResult.success && packageResult.output) {
          // 解析版本信息
          const versionLines = packageResult.output.split(/\r?\n/);
          for (const line of versionLines) {
            const versionNameMatch = line.match(/versionName=([^\s]+)/);
            if (versionNameMatch && versionNameMatch[1]) {
              versionName = versionNameMatch[1];
            }
            
            const versionCodeMatch = line.match(/versionCode=([^\s]+)/);
            if (versionCodeMatch && versionCodeMatch[1]) {
              versionCode = versionCodeMatch[1];
            }
          }
        }
        
        // 使用函数式更新来避免直接依赖apps
        setApps(prev => {
          const found = prev.find(a => a.packageName === packageName);
          
          if (!found) {
            // 如果不在apps数组中，创建一个新的应用对象并添加到apps数组
            const newApp: InstalledApp = {
              packageName,
              versionName,
              versionCode,
              isSystemApp: false, // 默认为非系统应用，后续可以通过其他命令获取
              isEnabled: true,    // 当前运行的应用肯定是启用的
              permissions: [],     // 可以通过其他命令获取权限列表
            };
            
            // 返回更新后的数组
            return [...prev, newApp];
          } else if (!found.versionName && versionName) {
            // 如果在apps数组中但没有版本信息，更新版本信息
            return prev.map(app => 
              app.packageName === packageName 
                ? { ...app, versionName, versionCode } 
                : app
            );
          }
          
          // 如果不需要更新，返回原数组
          return prev;
        });
        
        setViewSource("current");
        setStatusBarMessage({ 
          type: "success", 
          message: `当前前台应用：${packageName}${versionName ? ` (版本: ${versionName})` : ''}` 
        });
      } catch (versionError) {
        console.error('获取应用版本信息失败:', versionError);
        // 即使获取版本信息失败，也显示应用包名
        setViewSource("current");
        setStatusBarMessage({ type: "success", message: `当前前台应用：${packageName}` });
      }
    } catch (e) {
      setStatusBarMessage({ type: "error", message: `获取当前应用失败：${e}` });
    }
  }, [selectedDevice, deviceService, setStatusBarMessage]);

  // 获取已冻结（被禁用）的应用列表
  const loadFrozenApps = useCallback(async () => {
    if (!selectedDevice) return;
    try {
      // 使用deviceService的getFrozenApps方法调用后端API
      const frozenApps = await deviceService.getFrozenApps(selectedDevice.serial);
      
      if (frozenApps && frozenApps.length > 0) {
        // 转换为前端需要的格式
        const frozenAppsWithVersion: InstalledApp[] = frozenApps.map((app: any) => ({
          packageName: app.package_name || '',
          versionName: app.version_name || '',
          versionCode: app.version_code || '',
          isSystemApp: app.is_system_app || false,
          isEnabled: app.is_enabled || false,
          installLocation: app.install_location || '',
          apkPath: app.apk_path || '',
          installTime: app.install_time || '',
          updateTime: app.update_time || '',
          permissions: app.permissions || [],
        }));
        
        // 更新frozenAppsWithVersion状态
        setFrozenAppsWithVersion(frozenAppsWithVersion);
        setViewSource("frozen");
        setStatusBarMessage({ type: "success", message: `已冻结应用：${frozenApps.length} 个` });
      } else {
        setFrozenAppsWithVersion([]);
        setViewSource("frozen");
        setStatusBarMessage({ type: "info", message: "没有找到已冻结的应用" });
      }
    } catch (e) {
      console.error('获取冻结应用失败:', e);
      setStatusBarMessage({ type: "error", message: `获取冻结应用失败：${e}` });
    }
  }, [selectedDevice, deviceService, setStatusBarMessage]);

  // 冻结/解冻应用
  const handleFreezeToggle = useCallback(async (pkg: string, isEnabled: boolean) => {
    if (!selectedDevice) return;
    try {
      const cmd = isEnabled ? `pm disable-user ${pkg}` : `pm enable ${pkg}`;
      const result = await deviceService.executeAdbCommand(selectedDevice.serial, "shell", [cmd]);
      if (result.success) {
        setStatusBarMessage({ type: "success", message: `${isEnabled ? "已冻结" : "已解冻"} ${pkg}` });
        
        // 更新apps数组中的应用状态
        setApps(prev => 
          prev.map(app => 
            app.packageName === pkg 
              ? { ...app, isEnabled: !isEnabled } 
              : app
          )
        );
        
        // 重新获取已冻结应用列表
        try {
          const frozenApps = await deviceService.getFrozenApps(selectedDevice.serial);
          if (frozenApps) {
            const frozenAppsWithVersion: InstalledApp[] = frozenApps.map((app: any) => ({
              packageName: app.package_name || '',
              versionName: app.version_name || '',
              versionCode: app.version_code || '',
              isSystemApp: app.is_system_app || false,
              isEnabled: app.is_enabled || false,
              installLocation: app.install_location || '',
              apkPath: app.apk_path || '',
              installTime: app.install_time || '',
              updateTime: app.update_time || '',
              permissions: app.permissions || [],
            }));
            setFrozenAppsWithVersion(frozenAppsWithVersion);
          }
        } catch (error) {
          console.error('重新获取已冻结应用列表失败:', error);
          // 如果重新获取失败，至少清空当前列表
          setFrozenAppsWithVersion([]);
        }
      } else {
        setStatusBarMessage({ type: "error", message: result.output || result.error || "操作失败" });
      }
    } catch (e) {
      setStatusBarMessage({ type: "error", message: `操作失败：${e}` });
    }
  }, [selectedDevice, deviceService, setStatusBarMessage]);

  // 清除应用数据
  const handleClearData = async (pkg: string) => {
    if (!selectedDevice) return;
    try {
      const result = await deviceService.executeAdbCommand(selectedDevice.serial, "shell", [`pm clear ${pkg}`]);
      if (result.success && result.output && /Success|成功/.test(result.output)) {
        setStatusBarMessage({ type: "success", message: `已清除数据：${pkg}` });
      } else {
        setStatusBarMessage({ type: "error", message: result.output || result.error || "清除数据失败" });
      }
    } catch (e) {
      setStatusBarMessage({ type: "error", message: `清除数据失败：${e}` });
    }
  };

  // 导出APK：pm path 获取路径，再 adb pull
  const handleExportApk = async (pkg: string) => {
    if (!selectedDevice) return;
    try {
      const targetDir = await openDialog({ directory: true, multiple: false });
      if (!targetDir || typeof targetDir !== "string") {
        setStatusBarMessage({ type: "info", message: "已取消导出" });
        return;
      }

      // 获取APK路径
      const pathResult = await deviceService.executeAdbCommand(selectedDevice.serial, "shell", [`pm path ${pkg}`]);
      if (!pathResult.success || !pathResult.output) {
        setStatusBarMessage({ type: "error", message: pathResult.error || "无法获取APK路径" });
        return;
      }
      const apkLine = pathResult.output.split(/\r?\n/).find(l => l.startsWith("package:"));
      if (!apkLine) {
        setStatusBarMessage({ type: "error", message: "未找到APK路径" });
        return;
      }
      const remotePath = apkLine.replace("package:", "").trim();
      const localPath = `${targetDir}/${pkg}.apk`;

      // 执行 pull
      const pullResult = await deviceService.executeAdbCommand(selectedDevice.serial, "pull", [remotePath, localPath]);
      if (pullResult.success) {
        setStatusBarMessage({ type: "success", message: `APK 已导出到：${localPath}` });
      } else {
        setStatusBarMessage({ type: "error", message: pullResult.output || pullResult.error || "导出失败" });
      }
    } catch (e) {
      setStatusBarMessage({ type: "error", message: `导出失败：${e}` });
    }
  };

  const renderContent = () => {
    return (
      <div className={styles.threeColumnLayout}>


        {/* 已安装应用卡片 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Apps24Regular />}
            action={
              <div className={styles.toolbar}>
                {/* 进度条信息 - 移动到搜索框前 */}
                {isLoadingApps && (
                  <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                    <Spinner size="small" />
                    <div style={{ marginLeft: '8px', minWidth: '120px' }}>
                      <Text size={200}>{loadingProgress.current}/{loadingProgress.total}</Text>
                      <progress 
                        value={loadingProgress.current} 
                        max={loadingProgress.total}
                        style={{ width: '100%', height: '4px' }}
                      />
                    </div>
                  </div>
                )}
                
                <Field className={styles.searchField}>
                  <Input
                    contentBefore={<Search24Regular />}
                    placeholder="搜索应用名称或包名..."
                    value={searchQuery}
                    onChange={(_, data) => setSearchQuery(data.value)}
                  />
                </Field>
                
                {/* 添加多选单选选择框 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text>类型:</Text>
                  <div className={styles.buttonGroup}>
                    <Button
                      appearance={viewSource === "apps" && !includeSystemApps ? "primary" : "secondary"}
                      size="small"
                      onClick={() => {
                        setIncludeSystemApps(false);
                        setViewSource("apps");
                        loadAppsBatch();
                      }}
                      disabled={isLoadingApps}
                    >
                      三方
                    </Button>
                    <Button
                      appearance={viewSource === "apps" && includeSystemApps ? "primary" : "secondary"}
                      size="small"
                      onClick={() => {
                        setIncludeSystemApps(true);
                        setViewSource("apps");
                        loadAppsBatch();
                      }}
                      disabled={isLoadingApps}
                    >
                      系统
                    </Button>
                    <Button
                      appearance={viewSource === "current" ? "primary" : "secondary"}
                      size="small"
                      onClick={loadCurrentApp}
                      disabled={isLoadingApps}
                    >
                      当前
                    </Button>
                    <Button
                      appearance={viewSource === "frozen" ? "primary" : "secondary"}
                      size="small"
                      onClick={loadFrozenApps}
                      disabled={isLoadingApps}
                    >
                      已冻结
                    </Button>
                  </div>
                </div>
              </div>
            }
          />
          
          {/* 批量操作按钮 - 移到CardHeader下方 */}
          <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              appearance="primary"
              icon={<Delete24Regular />}
              onClick={handleBatchUninstall}
              disabled={isLoadingApps || selectedApps.size === 0}
            >
            卸载 {selectedApps.size > 0 && `(${selectedApps.size})`}
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleBatchFreezeToggle(true)}
              disabled={isLoadingApps || selectedApps.size === 0}
            >
              冻结 {selectedApps.size > 0 && `(${selectedApps.size})`}
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleBatchFreezeToggle(false)}
              disabled={isLoadingApps || selectedApps.size === 0}
            >
              解冻 {selectedApps.size > 0 && `(${selectedApps.size})`}
            </Button>
            <Button
              appearance="primary"
              onClick={handleBatchForceStop}
              disabled={isLoadingApps || selectedApps.size === 0}
            >
              强制停止 {selectedApps.size > 0 && `(${selectedApps.size})`}
            </Button>
            <Button
              appearance="primary"
              onClick={handleBatchExportApk}
              disabled={isLoadingApps || selectedApps.size === 0}
            >
              提取安装包 {selectedApps.size > 0 && `(${selectedApps.size})`}
            </Button>
            <Button
              appearance="primary"
              onClick={handleBatchClearData}
              disabled={isLoadingApps || selectedApps.size === 0}
            >
              清除数据 {selectedApps.size > 0 && `(${selectedApps.size})`}
            </Button>
          </div>
          <div className={styles.content}>

            {isLoadingApps ? (
              <div className={styles.loadingContainer}>
                <Spinner size="large" label="正在加载应用列表..." />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className={styles.emptyState}>
                <Apps24Regular style={{ fontSize: "48px" }} />
                <Text>未找到应用</Text>
                <Text size={200}>尝试调整搜索条件或刷新列表</Text>

              </div>
            ) : (
              <div className={styles.tableContainer}>
                <Table arial-label="已安装应用列表" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    {/* 选择框列：固定较小宽度 */}
                    <col style={{ width: 48 }} />
                    {/* 应用列：双倍宽度，占余下空间的40% */}
                    <col style={{ width: '40%' }} />
                    {/* 其他列：各占20% */}
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>
                        <Checkbox
                          checked={selectedApps.size === filteredApps.length && filteredApps.length > 0}
                          onChange={(_, data) => handleSelectAll(data.checked === true)}
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>应用</TableHeaderCell>
                      <TableHeaderCell>版本</TableHeaderCell>
                      <TableHeaderCell>状态</TableHeaderCell>
                      <TableHeaderCell>更多</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app) => (
                      <TableRow key={app.packageName} className={styles.compactTableRow}>
                        <TableCell className={styles.compactCell}>
                          <Checkbox
                            checked={selectedApps.has(app.packageName)}
                            onChange={(_, data) => handleSelectApp(app.packageName, data.checked === true)}
                          />
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Text size={300} weight="semibold" className={styles.packageNameText} title={app.packageName}>
                              {app.packageName}
                            </Text>
                          </div>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Text size={200}>{app.versionName || "未知"}</Text>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Badge appearance={app.isEnabled ? "filled" : "outline"} color={app.isEnabled ? "success" : "warning"} size="small">
                            {app.isEnabled ? "已启用" : "已禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
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
                                {!app.isSystemApp && [
                                  <MenuItem
                                    key={`uninstall-${app.packageName}`}
                                    icon={<Delete24Regular />}
                                    onClick={() => handleUninstallClick(app)}
                                  >
                                    卸载应用
                                  </MenuItem>,
                                  <MenuItem
                                    key={`freeze-${app.packageName}`}
                                    onClick={() => handleFreezeToggle(app.packageName, app.isEnabled)}
                                  >
                                    {app.isEnabled ? "冻结（禁用）" : "解冻（启用）"}
                                  </MenuItem>,
                                  <MenuItem
                                    key={`clear-${app.packageName}`}
                                    onClick={() => handleClearData(app.packageName)}
                                  >
                                    清除应用数据
                                  </MenuItem>,
                                  <MenuItem
                                    key={`export-${app.packageName}`}
                                    onClick={() => handleExportApk(app.packageName)}
                                  >
                                    导出 APK
                                  </MenuItem>
                                ]}
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


      {/* 应用卸载确认对话框 */}
      <Dialog open={confirmUninstallDialogOpen} onOpenChange={(_, data) => setConfirmUninstallDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认卸载应用</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                确定要卸载应用 <strong>{appToUninstall?.packageName}</strong> 吗？
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


    </div>
  );
};

export default AppManagerPanel;