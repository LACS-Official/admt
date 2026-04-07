import React, { useState, useCallback, useEffect } from "react";
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
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import {
  Apps24Regular,
  Delete24Regular,
  Info24Regular,
  Search24Regular,
  MoreHorizontal24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  LockClosed24Regular,
  LockOpen24Regular,
  Save24Regular,
  Eraser24Regular,
  ShieldLock24Regular,
  Open24Regular,
  Copy24Regular,
  AppsListDetail24Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { InstalledApp, BatchOperation, DeviceInfo } from "../../types/device";
import ErrorDialog from "../Common/ErrorDialog";
import APKAuditorPanel from "./APKAuditorPanel";
import { aiService } from "../../services/aiService";

import { ErrorInfo } from "../../utils/errorHandler";
// 移除Node.js path模块导入，避免浏览器环境中的兼容性问题

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
  splitLayout: {
    display: "flex",
    gap: "16px",
    height: "100%",
    minHeight: 0,
  },
  leftPanel: {
    width: "280px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "16px",
    borderRadius: "8px",
    overflowY: "auto",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: 0,
    height: "100%",
  },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
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
  toolbar: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "stretch",
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
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "8px 16px",
    padding: "8px 0",
  },
  detailsLabel: {
    fontWeight: "bold",
    color: "var(--colorNeutralForeground2)",
  },
  detailsValue: {
    wordBreak: "break-all",
    fontFamily: "monospace",
  },
  // New styles for enhanced UI
  appIconLarge: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "20px",
  },
  appNamePrimary: {
    fontWeight: "600",
    fontSize: "14px",
    color: "var(--colorNeutralForeground1)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  appNameSecondary: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  filterBadge: {
    marginLeft: "4px",
    fontSize: "10px",
    height: "16px",
    minWidth: "16px",
    padding: "0 4px",
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

interface AppManagerPanelProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const AppManagerPanel: React.FC<AppManagerPanelProps> = ({
  device,
  onAdbRequired,
}) => {
  const styles = useStyles();
  const { devices } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();
  const { t } = useTranslation();

  const checkMode = useCallback(() => {
    if (!device) {
      setStatusBarMessage({
        type: "warning",
        message: t("unlock.select_device_first"),
      });
      return false;
    }
    if (device.connected && device.mode !== "sys" && device.mode !== "rec") {
      onAdbRequired();
      return false;
    }
    return true;
  }, [device, onAdbRequired, t, setStatusBarMessage]);

  // 无需状态管理，已移除标签页相关状态
  const [errorInfo] = useState<ErrorInfo | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // 应用管理相关状态
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<InstalledApp[]>([]);
  const [viewSource, setViewSource] = useState<
    "apps" | "frozen" | "current" | null
  >(null);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [confirmUninstallDialogOpen, setConfirmUninstallDialogOpen] =
    useState(false);
  const [appToUninstall, setAppToUninstall] = useState<InstalledApp | null>(
    null,
  );
  const [batchOperationUninstall, setBatchOperationUninstall] =
    useState<BatchOperation | null>(null);
  const [batchUninstallDialogOpen, setBatchUninstallDialogOpen] =
    useState(false);
  const [useBatchLoading, setUseBatchLoading] = useState(true); // 是否使用分批加载
  const [appCache, setAppCache] = useState<
    Map<
      string,
      { apps: InstalledApp[]; timestamp: number; includeSystem: boolean }
    >
  >(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
  const [loadingProgress, setLoadingProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 0, total: 0 });
  const [performanceStats, setPerformanceStats] = useState<{
    loadTime: number;
    appCount: number;
    isOptimized: boolean;
  }>({ loadTime: 0, appCount: 0, isOptimized: false });
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [lastDetectedApp, setLastDetectedApp] = useState<string | null>(null);
  const currentAppRef = React.useRef<string | null>(null);
  const lastDetectedAppRef = React.useRef<string | null>(null);
  const appsRef = React.useRef<InstalledApp[]>(apps);
  const [frozenAppsWithVersion, setFrozenAppsWithVersion] = useState<
    InstalledApp[]
  >([]);
  const [selectedAppForDetails, setSelectedAppForDetails] =
    useState<InstalledApp | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // State for Context Menu
  const [contextMenuLocation, setContextMenuLocation] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [contextMenuTarget, setContextMenuTarget] =
    useState<HTMLElement | null>(null);
  const [contextMenuApp, setContextMenuApp] = useState<InstalledApp | null>(
    null,
  );

  // State for Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State for AI Auditor
  const [isAuditorOpen, setIsAuditorOpen] = useState(false);
  const [appToAudit, setAppToAudit] = useState<InstalledApp | null>(null);

  // 规范化版本信息，处理各种格式问题
  const normalizeVersionInfo = useCallback((versionInfo: string): string => {
    if (!versionInfo || versionInfo.trim() === "") {
      return "";
    }
    let normalized = versionInfo.trim();
    normalized = normalized.replace(/^["']|["']$/g, "");
    normalized = normalized.replace(/[\r\n\t]/g, "");
    normalized = normalized.replace(/\s+/g, " ").trim();
    return normalized;
  }, []);

  // 格式化版本名称，处理各种格式问题
  const formatVersionName = useCallback(
    (versionName: string): string => {
      if (!versionName || versionName.trim() === "") {
        return t("common.unknown");
      }
      let formatted = versionName.trim();
      formatted = formatted.replace(/^["']|["']$/g, "");
      formatted = formatted.replace(/[\r\n\t]/g, "");
      if (formatted.length > 20) {
        formatted = formatted.substring(0, 20) + "...";
      }
      const versionRegex = /^[\d.]+$/;
      if (!versionRegex.test(formatted)) {
        const versionMatch = formatted.match(/(\d+(?:\.\d+)*)/);
        if (versionMatch) {
          formatted = versionMatch[1];
        }
      }
      return formatted;
    },
    [t],
  );

  // 获取当前前台应用包名和版本信息
  const loadCurrentApp = useCallback(async () => {
    if (!device) return;
    try {
      const activityResult = await deviceService.executeAdbCommand(
        device.serial,

        "shell",
        ["dumpsys activity activities"],
      );

      if (!activityResult.success || !activityResult.output) {
        currentAppRef.current = null;
        return;
      }

      const lines = activityResult.output.split(/\r?\n/);
      const resumed = lines.find((l) =>
        /ResumedActivity|mResumedActivity/.test(l),
      );

      if (!resumed) {
        currentAppRef.current = null;
        return;
      }

      const match = resumed.match(/ ([a-zA-Z0-9_.]+)\/[a-zA-Z0-9_.]+/);
      if (!match || !match[1]) {
        currentAppRef.current = null;
        return;
      }

      const packageName = match[1];
      const cachedApp = appsRef.current.find(
        (a) =>
          a.packageName === packageName && (a.versionName || a.versionCode),
      );
      if (packageName === currentAppRef.current && cachedApp) {
        return;
      }

      currentAppRef.current = packageName;
      setCurrentApp(packageName);

      try {
        const packageResult = await deviceService.executeAdbCommand(
          device.serial,
          "shell",
          [
            `dumpsys package ${packageName} | grep -E "versionName|versionCode"`,
          ],
        );

        let versionName = "";
        let versionCode = "";

        if (packageResult.success && packageResult.output) {
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

        setApps((prev) => {
          const found = prev.find((a) => a.packageName === packageName);
          if (!found) {
            const newApp: InstalledApp = {
              packageName,
              versionName,
              versionCode,
              isSystemApp: false,
              isEnabled: true,
              permissions: [],
            };
            return [...prev, newApp];
          } else if (!found.versionName && versionName) {
            return prev.map((app) =>
              app.packageName === packageName
                ? { ...app, versionName, versionCode }
                : app,
            );
          }
          return prev;
        });

        setViewSource("current");

        if (packageName !== lastDetectedAppRef.current) {
          setStatusBarMessage({
            type: "success",
            message: t("app_manager.msg_current_app", { packageName }),
          });
          lastDetectedAppRef.current = packageName;
          setLastDetectedApp(packageName);
        }
      } catch (versionError) {
        console.error("获取应用版本信息失败:", versionError);
        setViewSource("current");
        if (packageName !== lastDetectedAppRef.current) {
          setStatusBarMessage({
            type: "success",
            message: t("app_manager.msg_current_app", { packageName }),
          });
          lastDetectedAppRef.current = packageName;
          setLastDetectedApp(packageName);
        }
      }
    } catch (e) {
      console.debug("获取当前应用轮询中:", e);
    }
  }, [device, deviceService, setStatusBarMessage, t]);

  // 获取已冻结（被禁用）的应用列表
  const loadFrozenApps = useCallback(async () => {
    if (!checkMode()) return;
    if (!device) return;
    try {
      const frozenApps = await deviceService.getFrozenApps(device.serial);

      if (frozenApps && frozenApps.length > 0) {
        const frozenAppsWithVersion: InstalledApp[] = frozenApps.map(
          (app: any) => ({
            packageName: app.package_name || "",
            versionName: normalizeVersionInfo(app.version_name || ""),
            versionCode: normalizeVersionInfo(app.version_code || ""),
            isSystemApp: app.is_system_app || false,
            isEnabled: app.is_enabled || false,
            installLocation: app.install_location || "",
            apkPath: app.apk_path || "",
            installTime: app.install_time || "",
            updateTime: app.update_time || "",
            permissions: app.permissions || [],
          }),
        );
        setFrozenAppsWithVersion(frozenAppsWithVersion);
        setViewSource("frozen");
        setStatusBarMessage({
          type: "success",
          message: t("app_manager.msg_frozen_apps", {
            count: frozenApps.length,
          }),
        });
      } else {
        setFrozenAppsWithVersion([]);
        setViewSource("frozen");
        setStatusBarMessage({
          type: "info",
          message: t("app_manager.no_apps_found"),
        });
      }
    } catch (e) {
      console.error("获取冻结应用失败:", e);
      setStatusBarMessage({
        type: "error",
        message: t("app_manager.fail_get_apps", { error: e }),
      });
    }
  }, [device, deviceService, setStatusBarMessage, normalizeVersionInfo, t]);

  // 同步 apps 到 ref
  useEffect(() => {
    appsRef.current = apps;
  }, [apps]);

  // 默认加载当前应用
  useEffect(() => {
    if (!device) return;
    if (!viewSource) {
      loadCurrentApp();
    }
  }, [device, viewSource, loadCurrentApp]);

  // 应用管理相关函数（超级优化版本）
  const loadApps = useCallback(
    async (forceRefresh = false) => {
      if (!checkMode()) return;
      if (!device) return;

      // 检查缓存（方案3：缓存机制优化）
      const cacheKey = `${device.serial}_${includeSystemApps}`;

      const cached = appCache.get(cacheKey);
      const now = Date.now();

      // 如果有有效缓存且不是强制刷新，则使用缓存
      if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
        setApps(cached.apps);
        setViewSource("apps");
        setStatusBarMessage({
          type: "success",
          message: t("app_manager.success_get_apps", {
            count: cached.apps.length,
          }),
        });
        return;
      }

      setIsLoadingApps(true);
      setLoadingProgress({ current: 0, total: 0 }); // 重置进度
      const startTime = Date.now();

      try {
        // 使用超级优化的后端批量获取命令
        const { invoke } = await import("@tauri-apps/api/core");
        const installedApps = await invoke<InstalledApp[]>(
          "get_installed_apps",
          {
            serial: device.serial,
            includeSystem: includeSystemApps,
          },
        );

        const loadTime = Date.now() - startTime;

        // 调试输出：查看返回的应用数据结构
        console.log("📱 获取到的应用数据样本:", installedApps.slice(0, 3));
        console.log("📱 第一个应用的详细信息:", installedApps[0]);

        // 转换字段名格式（从snake_case到camelCase）并创建应用对象数组
        const appsWithVersion: InstalledApp[] = installedApps.map(
          (app: any) => ({
            packageName: app.package_name || app.packageName || "",
            versionName: normalizeVersionInfo(
              app.version_name || app.versionName || "",
            ),
            versionCode: normalizeVersionInfo(
              app.version_code || app.versionCode || "",
            ),
            isSystemApp: app.is_system_app || app.isSystemApp || false,
            isEnabled:
              app.is_enabled !== undefined
                ? app.is_enabled
                : app.isEnabled !== undefined
                  ? app.isEnabled
                  : true,
            // 保留其他可能存在的字段
            installLocation: app.installLocation || "",
            apkPath: app.apkPath || "",
            installTime: app.installTime || "",
            updateTime: app.updateTime || "",
            permissions: app.permissions || [],
          }),
        );

        setApps(appsWithVersion);
        setViewSource("apps");

        // 更新性能统计
        setPerformanceStats({
          loadTime,
          appCount: appsWithVersion.length,
          isOptimized: loadTime < 2000, // 2秒内完成认为是优化效果
        });

        // 更新缓存
        setAppCache(
          (prev) =>
            new Map(
              prev.set(cacheKey, {
                apps: appsWithVersion,
                timestamp: now,
                includeSystem: includeSystemApps,
              }),
            ),
        );

        setStatusBarMessage({
          type: "success",
          message: t("app_manager.success_get_apps_time", {
            count: appsWithVersion.length,
            time: loadTime,
          }),
        });
      } catch (error) {
        setStatusBarMessage({
          type: "error",
          message: t("app_manager.fail_get_apps", { error }),
        });
        setApps([]);

        // 显示友好的错误提示，提供重试选项
        console.error("获取应用列表失败:", error);
      } finally {
        setIsLoadingApps(false);
        setLoadingProgress({ current: 0, total: 0 }); // 清除进度
      }
    },
    [
      device,
      includeSystemApps,
      deviceService,
      setStatusBarMessage,
      appCache,
      CACHE_DURATION,
      normalizeVersionInfo,
      t,
    ],
  );

  // 分批加载应用列表（每10个应用显示一次）- 优化版本
  const loadAppsBatch = useCallback(
    async (forceRefresh = false) => {
      if (!checkMode()) return;
      if (!device) return;

      // 检查缓存（方案3：缓存机制优化）
      const cacheKey = `${device.serial}_${includeSystemApps}`;

      const cached = appCache.get(cacheKey);
      const now = Date.now();

      // 如果有有效缓存且不是强制刷新，则使用缓存
      if (!forceRefresh && cached && now - cached.timestamp < CACHE_DURATION) {
        setApps(cached.apps);
        setViewSource("apps");
        setStatusBarMessage({
          type: "success",
          message: t("app_manager.success_get_apps", {
            count: cached.apps.length,
          }),
        });
        return;
      }

      setIsLoadingApps(true);
      setLoadingProgress({ current: 0, total: 0 }); // 重置进度
      setApps([]); // 清空当前应用列表，准备分批加载
      const startTime = Date.now();

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const BATCH_SIZE = 10; // 每批加载10个应用
        let batchIndex = 0;
        let allApps: InstalledApp[] = [];
        let totalApps = 0;

        // 开始分批加载
        while (true) {
          const result = await invoke<[InstalledApp[], number]>(
            "get_installed_apps_batch",
            {
              serial: device.serial,
              includeSystem: includeSystemApps,
              batchSize: BATCH_SIZE,
              batchIndex: batchIndex,
            },
          );

          const [batchApps, totalCount] = result;
          totalApps = totalCount;

          // 转换字段名格式（从snake_case到camelCase）并创建应用对象数组
          const appsWithVersion: InstalledApp[] = batchApps.map((app: any) => ({
            packageName: app.package_name || app.packageName || "",
            versionName: normalizeVersionInfo(
              app.version_name || app.versionName || "",
            ),
            versionCode: normalizeVersionInfo(
              app.version_code || app.versionCode || "",
            ),
            isSystemApp: app.is_system_app || app.isSystemApp || false,
            isEnabled:
              app.is_enabled !== undefined
                ? app.is_enabled
                : app.isEnabled !== undefined
                  ? app.isEnabled
                  : true,
            // 保留其他可能存在的字段
            installLocation: app.installLocation || "",
            apkPath: app.apkPath || "",
            installTime: app.installTime || "",
            updateTime: app.updateTime || "",
            permissions: app.permissions || [],
          }));

          // 调试信息：打印当前批次加载的应用
          console.log(
            `📦 加载第 ${batchIndex + 1} 批应用，数量: ${appsWithVersion.length}`,
            appsWithVersion.map((app) => app.packageName),
          );

          // 将新加载的应用添加到总列表中
          allApps = [...allApps, ...appsWithVersion];

          // 立即更新UI显示，确保用户能看到每批新加载的应用
          setApps([...allApps]); // 使用展开运算符创建新数组，强制React重新渲染
          setViewSource("apps");

          // 更新进度
          setLoadingProgress({
            current: allApps.length,
            total: totalApps,
          });

          // 调试信息：打印当前进度
          console.log(`📊 当前进度: ${allApps.length}/${totalApps}`);

          // 优化：减少延迟时间，提高响应速度
          // 只在需要时添加延迟，第一批立即显示，后续批次适当延迟
          if (batchIndex > 0) {
            // 根据批次动态调整延迟时间：第一批0ms，第二批50ms，后续批次100ms
            const delay = batchIndex === 1 ? 50 : 100;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          // 如果已经加载完所有应用，退出循环
          if (allApps.length >= totalApps) {
            break;
          }

          batchIndex++;
        }

        const loadTime = Date.now() - startTime;

        // 更新性能统计
        setPerformanceStats({
          loadTime,
          appCount: allApps.length,
          isOptimized: loadTime < 2000, // 2秒内完成认为是优化效果
        });

        // 更新缓存
        setAppCache(
          (prev) =>
            new Map(
              prev.set(cacheKey, {
                apps: allApps,
                timestamp: now,
                includeSystem: includeSystemApps,
              }),
            ),
        );

        setStatusBarMessage({
          type: "success",
          message: t("app_manager.success_get_apps_time", {
            count: allApps.length,
            time: loadTime,
          }),
        });
      } catch (error) {
        setStatusBarMessage({
          type: "error",
          message: t("app_manager.fail_get_apps", { error }),
        });
        setApps([]);

        // 显示友好的错误提示，提供重试选项
        console.error("获取应用列表失败:", error);
      } finally {
        setIsLoadingApps(false);
        setLoadingProgress({ current: 0, total: 0 }); // 清除进度
      }
    },
    [
      device,
      includeSystemApps,
      appCache,
      CACHE_DURATION,
      normalizeVersionInfo,
      setStatusBarMessage,
      t,
    ],
  );

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
        const found = apps.find((a) => a.packageName === currentApp);
        if (found) {
          // 如果找到了应用且有版本信息，直接使用
          source = [found];
        } else {
          // 如果没有找到应用或者应用没有版本信息，创建一个带有版本信息的占位对象
          // 这里的版本信息会在loadCurrentApp函数中获取并更新
          source = [
            {
              packageName: currentApp,
              versionName: t("app_manager.getting_version"),
              isEnabled: true,
              isSystemApp: false,
            } as unknown as InstalledApp,
          ];

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

    // Smart Filter: Filter by Name OR Package Name
    const filtered = source.filter((app) => {
      // If we had a label field, we would search it too.
      // For now we assume app.label might exist or we search package/version
      const matchPackage = app.packageName?.toLowerCase().includes(query);
      const matchName =
        (app as any).label?.toLowerCase().includes(query) || false; // Future proofing
      return matchPackage || matchName;
    });

    setFilteredApps(filtered);
  }, [
    apps,
    frozenAppsWithVersion,
    currentApp,
    searchQuery,
    viewSource,
    loadFrozenApps,
    loadCurrentApp,
    t,
  ]);

  const handleUninstallClick = (app: InstalledApp) => {
    setAppToUninstall(app);
    setConfirmUninstallDialogOpen(true);
  };

  const confirmUninstall = async () => {
    if (!checkMode()) return;
    if (!device || !appToUninstall) return;

    setConfirmUninstallDialogOpen(false);
    try {
      // 使用 adb shell pm uninstall 命令卸载应用
      const result = await deviceService.executeAdbCommand(
        device.serial,

        "shell",
        [`pm uninstall ${appToUninstall.packageName}`],
      );

      if (result.success) {
        // 检查输出是否包含成功信息
        if (
          result.output &&
          (result.output.includes("Success") || result.output.includes("成功"))
        ) {
          setStatusBarMessage({
            type: "success",
            message: t("app_manager.uninstall_success", {
              packageName: appToUninstall.packageName,
            }),
          });
          if (useBatchLoading) {
            loadAppsBatch(); // 重新加载应用列表
          } else {
            loadApps();
          }
        } else {
          setStatusBarMessage({
            type: "error",
            message:
              result.output || result.error || t("app_manager.uninstall_fail"),
          });
        }
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || t("app_manager.uninstall_fail"),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t("app_manager.uninstall_fail") + `: ${error}`,
      });
    }
    setAppToUninstall(null);
  };

  const handleShowDetails = (app: InstalledApp) => {
    setSelectedAppForDetails(app);
    setIsDrawerOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, app: InstalledApp) => {
    e.preventDefault();
    setContextMenuLocation({ left: e.clientX, top: e.clientY });
    setContextMenuTarget(e.target as HTMLElement);
    setContextMenuApp(app);
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
      setSelectedApps(new Set(filteredApps.map((app) => app.packageName)));
    } else {
      setSelectedApps(new Set());
    }
  };

  // 批量卸载应用
  const handleBatchUninstall = async () => {
    if (!checkMode()) return;
    if (!device || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: t("app_manager.batch_start_uninstall", {
          count: packageNames.length,
        }),
      });

      // 逐个卸载应用
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(
            device.serial,
            "shell",
            [`pm uninstall ${packageName}`],
          );

          if (
            result.success &&
            result.output &&
            (result.output.includes("Success") ||
              result.output.includes("成功"))
          ) {
            successCount++;
            results.push(
              t("app_manager.uninstall_success_item", { packageName }),
            );
          } else {
            failCount++;
            results.push(
              t("app_manager.uninstall_fail_item", {
                packageName,
                error:
                  result.output ||
                  result.error ||
                  t("app_manager.uninstall_fail"),
              }),
            );
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量卸载结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: t("app_manager.batch_result", {
          success: successCount,
          fail: failCount,
        }),
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: "uninstall",
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: "completed",
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith("✓") ? "success" : "failed",
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
      if (useBatchLoading) {
        loadAppsBatch();
      } else {
        loadApps();
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t("common.fail") + `: ${error}`,
      });
    }
  };

  // 批量冻结/解冻应用
  const handleBatchFreezeToggle = async (freeze: boolean) => {
    if (!checkMode()) return;
    if (!device || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: freeze
          ? t("app_manager.batch_start_freeze", { count: packageNames.length })
          : t("app_manager.batch_start_unfreeze", {
              count: packageNames.length,
            }),
      });

      // 逐个冻结/解冻应用
      for (const packageName of packageNames) {
        try {
          const cmd = freeze
            ? `pm disable-user ${packageName}`
            : `pm enable ${packageName}`;
          const result = await deviceService.executeAdbCommand(
            device.serial,
            "shell",
            [cmd],
          );
          if (result.success) {
            successCount++;
            results.push(
              t(
                freeze
                  ? "app_manager.freeze_success_item"
                  : "app_manager.unfreeze_success_item",
                { packageName },
              ),
            );

            // 更新apps数组中的应用状态
            setApps((prev) =>
              prev.map((app) =>
                app.packageName === packageName
                  ? { ...app, isEnabled: !freeze }
                  : app,
              ),
            );
          } else {
            failCount++;
            results.push(
              `✗ ${packageName}: ${result.output || result.error || t("app_manager.operation_fail")}`,
            );
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: t("app_manager.batch_result", {
          success: successCount,
          fail: failCount,
        }),
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: freeze ? "freeze" : "unfreeze",
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: "completed",
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith("✓") ? "success" : "failed",
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
          const frozenApps = await deviceService.getFrozenApps(device.serial);
          if (frozenApps) {
            const frozenAppsWithVersion: InstalledApp[] = frozenApps.map(
              (app: any) => ({
                packageName: app.package_name || "",
                versionName: normalizeVersionInfo(app.version_name || ""),
                versionCode: normalizeVersionInfo(app.version_code || ""),
                isSystemApp: app.is_system_app || false,
                isEnabled: app.is_enabled || false,
                installLocation: app.install_location || "",
                apkPath: app.apk_path || "",
                installTime: app.install_time || "",
                updateTime: app.update_time || "",
                permissions: app.permissions || [],
              }),
            );
            setFrozenAppsWithVersion(frozenAppsWithVersion);
          }
        } catch (e) {
          console.error("刷新冻结应用列表失败:", e);
          // 如果重新获取失败，至少清空当前列表
          setFrozenAppsWithVersion([]);
        }
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t("common.fail") + `: ${error}`,
      });
    }
  };

  // 批量强制停止应用
  const handleBatchForceStop = async () => {
    if (!checkMode()) return;
    if (!device || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: t("app_manager.batch_start_stop", {
          count: packageNames.length,
        }),
      });

      // 逐个强制停止应用
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(
            device.serial,
            "shell",
            [`am force-stop ${packageName}`],
          );
          if (result.success) {
            successCount++;
            results.push(t("app_manager.stop_success_item", { packageName }));
          } else {
            failCount++;
            results.push(
              `✗ ${packageName}: ${result.output || result.error || t("app_manager.stop_fail")}`,
            );
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: t("app_manager.batch_result", {
          success: successCount,
          fail: failCount,
        }),
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: "forceStop",
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: "completed",
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith("✓") ? "success" : "failed",
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
        message: `${t("app_manager.batch_stop_failed")}: ${error}`,
      });
    }
  };

  // 批量提取安装包
  const handleBatchExportApk = async () => {
    if (!checkMode()) return;
    if (!device || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      // 获取用户路径
      const { documentDir, join } = await import("@tauri-apps/api/path");
      const docDir = await documentDir();
      const exportDir = await join(docDir, "ADMT", "apk_export");

      // 检查并创建目录
      const { exists, mkdir } = await import("@tauri-apps/plugin-fs");
      if (!(await exists(exportDir))) {
        await mkdir(exportDir, { recursive: true });
      }

      setStatusBarMessage({
        type: "info",
        message: t("app_manager.batch_start_export", {
          count: packageNames.length,
        }),
      });

      // 逐个导出应用安装包
      for (const packageName of packageNames) {
        try {
          await deviceService.exportApk(device.serial, packageName, exportDir);
          successCount++;
          results.push(
            t("app_manager.export_apk_result", {
              name: packageName,
              path: `${exportDir}/${packageName}.apk`,
            }),
          );
        } catch (error: any) {
          failCount++;
          results.push(
            `✗ ${packageName}: ${error.message || t("app_manager.operation_fail")}`,
          );
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: t("app_manager.batch_result", {
          success: successCount,
          fail: failCount,
        }),
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: "exportApk",
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: "completed",
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith("✓") ? "success" : "failed",
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

  // 导出选中的应用列表为文件
  const handleExportAppList = async () => {
    if (!checkMode()) return;
    if (selectedApps.size === 0) return;

    try {
      // 获取选中应用的详细信息
      const selectedAppDetails = apps.filter((app) =>
        selectedApps.has(app.packageName),
      );

      // 准备导出数据
      const exportData = {
        exportTime: new Date().toISOString(),
        deviceInfo: device,
        appCount: selectedAppDetails.length,
        apps: selectedAppDetails,
      };

      // 生成固定格式的文件名：admt_applist_时间戳_随机字符串.json
      const timestamp = Date.now();
      // 生成6位随机字符串
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `admt_applist_${timestamp}_${randomStr}.json`;

      // 打开对话框让用户选择保存目录（但不选择文件名）
      const directory = await openDialog({
        title: t("app_manager.select_save_dir"),
        directory: true,
        multiple: false,
      });

      if (!directory || typeof directory !== "string") {
        setStatusBarMessage({
          type: "info",
          message: t("app_manager.export_cancelled"),
        });
        return;
      }

      // 组合完整路径，手动处理路径分隔符
      const targetPath = `${directory}${directory.endsWith("/") || directory.endsWith("\\") ? "" : "/"}${fileName}`;

      // 写入文件
      await writeTextFile(targetPath, JSON.stringify(exportData, null, 2));
      setStatusBarMessage({
        type: "success",
        message: t("app_manager.export_success", { path: targetPath }),
      });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t("app_manager.export_fail", { error }),
      });
    }
  };

  // 从文件导入应用列表
  const handleImportAppList = async () => {
    if (!checkMode()) return;
    try {
      // 选择文件
      const filePath = await openDialog({
        title: t("app_manager.select_import_file"),
        multiple: false,
        filters: [
          { name: t("common.json_files"), extensions: ["json"] },
          { name: t("common.all_files"), extensions: ["*"] },
        ],
      });

      if (!filePath || typeof filePath !== "string") {
        setStatusBarMessage({
          type: "info",
          message: t("app_manager.import_cancelled"),
        });
        return;
      }

      // 读取文件内容
      const fileContent = await readTextFile(filePath);
      const importData = JSON.parse(fileContent);

      // 验证文件格式
      if (!importData.apps || !Array.isArray(importData.apps)) {
        throw new Error(t("app_manager.error_parse_list"));
      }

      // 设置选中的应用
      const importedPackageNames = new Set<string>(
        importData.apps.map((app: any) => app.packageName).filter(Boolean),
      );
      setSelectedApps(importedPackageNames);

      setStatusBarMessage({
        type: "success",
        message: t("app_manager.import_success", {
          count: importedPackageNames.size,
        }),
      });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t("app_manager.import_fail", { error }),
      });
    }
  };

  // 批量清除应用数据
  const handleBatchClearData = async () => {
    if (!checkMode()) return;
    if (!device || selectedApps.size === 0) return;

    const packageNames = Array.from(selectedApps);
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    try {
      setStatusBarMessage({
        type: "info",
        message: t("app_manager.batch_start_clear", {
          count: packageNames.length,
        }),
      });

      // 逐个清除应用数据
      for (const packageName of packageNames) {
        try {
          const result = await deviceService.executeAdbCommand(
            device.serial,
            "shell",
            [`pm clear ${packageName}`],
          );
          if (
            result.success &&
            result.output &&
            /Success|成功/.test(result.output)
          ) {
            successCount++;
            results.push(
              t("app_manager.clear_data_success_item", { packageName }),
            );
          } else {
            failCount++;
            results.push(
              `✗ ${packageName}: ${result.output || result.error || t("app_manager.clear_data_fail")}`,
            );
          }
        } catch (error) {
          failCount++;
          results.push(`✗ ${packageName}: ${error}`);
        }
      }

      // 显示批量操作结果
      setStatusBarMessage({
        type: successCount > 0 ? "success" : "error",
        message: t("app_manager.batch_result", {
          success: successCount,
          fail: failCount,
        }),
      });

      // 创建批量操作结果对象
      const operation: BatchOperation = {
        id: Date.now().toString(),
        operationType: "clearData",
        totalItems: packageNames.length,
        completedItems: successCount + failCount,
        failedItems: failCount,
        status: "completed",
        items: results.map((result, index) => ({
          id: `${Date.now()}_${index}`,
          name: packageNames[index],
          status: result.startsWith("✓") ? "success" : "failed",
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
        message: t("app_manager.batch_fail", { error }),
      });
    }
  };

  // Placeholder for reordered functions
  // The implementation has been moved up.

  // 冻结/解冻应用
  const handleFreezeToggle = useCallback(
    async (pkg: string, isEnabled: boolean) => {
      if (!checkMode()) return;
      if (!device) return;
      try {
        const cmd = isEnabled ? `pm disable-user ${pkg}` : `pm enable ${pkg}`;
        const result = await deviceService.executeAdbCommand(
          device.serial,
          "shell",
          [cmd],
        );
        if (result.success) {
          setStatusBarMessage({
            type: "success",
            message: t(
              isEnabled ? "app_manager.msg_frozen" : "app_manager.msg_unfrozen",
              { packageName: pkg },
            ),
          });

          // 更新apps数组中的应用状态
          setApps((prev) =>
            prev.map((app) =>
              app.packageName === pkg ? { ...app, isEnabled: !isEnabled } : app,
            ),
          );

          // 重新获取已冻结应用列表
          try {
            const frozenApps = await deviceService.getFrozenApps(device.serial);
            if (frozenApps) {
              const frozenAppsWithVersion: InstalledApp[] = frozenApps.map(
                (app: any) => ({
                  packageName: app.package_name || "",
                  versionName: app.version_name || "",
                  versionCode: app.version_code || "",
                  isSystemApp: app.is_system_app || false,
                  isEnabled: app.is_enabled || false,
                  installLocation: app.install_location || "",
                  apkPath: app.apk_path || "",
                  installTime: app.install_time || "",
                  updateTime: app.update_time || "",
                  permissions: app.permissions || [],
                }),
              );
              setFrozenAppsWithVersion(frozenAppsWithVersion);
            }
          } catch (error) {
            console.error("重新获取已冻结应用列表失败:", error);
            // 如果重新获取失败，至少清空当前列表
            setFrozenAppsWithVersion([]);
          }
        } else {
          setStatusBarMessage({
            type: "error",
            message: result.output || result.error || "操作失败",
          });
        }
      } catch (e) {
        setStatusBarMessage({ type: "error", message: `操作失败：${e}` });
      }
    },
    [device, deviceService, setStatusBarMessage, t],
  );

  // 清除应用数据
  const handleClearData = useCallback(
    async (pkg: string) => {
      if (!checkMode()) return;
      if (!device) return;
      try {
        const result = await deviceService.executeAdbCommand(
          device.serial,
          "shell",
          [`pm clear ${pkg}`],
        );
        if (
          result.success &&
          result.output &&
          /Success|成功/.test(result.output)
        ) {
          setStatusBarMessage({
            type: "success",
            message: t("app_manager.clear_data_success", { packageName: pkg }),
          });
        } else {
          setStatusBarMessage({
            type: "error",
            message:
              result.output || result.error || t("app_manager.clear_data_fail"),
          });
        }
      } catch (e) {
        setStatusBarMessage({
          type: "error",
          message: t("app_manager.clear_data_fail") + `: ${e}`,
        });
      }
    },
    [device, deviceService, setStatusBarMessage, t],
  );

  // 导出APK：pm path 获取路径，再 adb pull
  const handleExportApk = useCallback(
    async (pkg: string) => {
      if (!checkMode()) return;
      if (!device) return;
      try {
        // 获取用户路径
        const { documentDir, join } = await import("@tauri-apps/api/path");
        const docDir = await documentDir();
        const exportDir = await join(docDir, "ADMT", "apk_export");

        // 检查并创建目录
        const { exists, mkdir } = await import("@tauri-apps/plugin-fs");
        if (!(await exists(exportDir))) {
          await mkdir(exportDir, { recursive: true });
        }

        await deviceService.exportApk(device.serial, pkg, exportDir);
        setStatusBarMessage({
          type: "success",
          message: t("app_manager.export_apk_success", { path: exportDir }),
        });
      } catch (e) {
        setStatusBarMessage({
          type: "error",
          message: t("common.fail") + `: ${e}`,
        });
      }
    },
    [device, deviceService, setStatusBarMessage, t, checkMode],
  );

  // 在设置中打开
  const handleOpenSettings = useCallback(
    async (pkg: string) => {
      if (!checkMode()) return;
      if (!device) return;
      try {
        await deviceService.executeAdbCommand(device.serial, "shell", [
          "am",
          "start",
          "-a",
          "android.settings.APPLICATION_DETAILS_SETTINGS",
          "-d",
          `package:${pkg}`,
        ]);
        setStatusBarMessage({
          type: "success",
          message: t("app_manager.open_settings_success"),
        });
      } catch (e) {
        setStatusBarMessage({
          type: "error",
          message: t("common.fail") + `: ${e}`,
        });
      }
    },
    [device, deviceService, setStatusBarMessage, t, checkMode],
  );

  // 启动应用
  const handleLaunchApp = useCallback(
    async (pkg: string) => {
      if (!checkMode()) return;
      if (!device) return;
      try {
        // 使用 monkey 启动应用，简单有效
        await deviceService.executeAdbCommand(device.serial, "shell", [
          "monkey",
          "-p",
          pkg,
          "-c",
          "android.intent.category.LAUNCHER",
          "1",
        ]);
        setStatusBarMessage({
          type: "success",
          message: t("app_manager.launch_success"),
        });
      } catch (e) {
        setStatusBarMessage({
          type: "error",
          message: t("common.fail") + `: ${e}`,
        });
      }
    },
    [device, deviceService, setStatusBarMessage, t, checkMode],
  );

  // 打开 AI 审计
  const handleOpenAuditor = useCallback((app: InstalledApp) => {
    setAppToAudit(app);
    setIsAuditorOpen(true);
  }, []);

  const renderContent = () => {
    return (
      <div className={styles.splitLayout}>
        {/* 左侧功能操作区 */}
        <div className={styles.leftPanel}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <Apps24Regular />
            <Text weight="semibold" size={400}>
              {t("app_manager.tab_apps")}
            </Text>
          </div>

          <div className={styles.toolbar}>
            {/* 搜索框 */}
            <Field>
              <Input
                contentBefore={<Search24Regular />}
                placeholder={t("app_manager.search_placeholder")}
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
                style={{ width: "100%" }}
              />
            </Field>

            {/* 加载进度 */}
            {isLoadingApps && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Spinner size="tiny" />
                  <Text size={100}>
                    {loadingProgress.current}/{loadingProgress.total}
                  </Text>
                </div>
                <progress
                  value={loadingProgress.current}
                  max={loadingProgress.total}
                  style={{ width: "100%", height: "4px" }}
                />
              </div>
            )}

            {/* 视图切换按钮组 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginTop: "12px",
              }}
            >
              <Text
                weight="semibold"
                size={200}
                style={{
                  color: "var(--colorNeutralForeground3)",
                  marginBottom: "4px",
                }}
              >
                {t("common.info")} / {t("app_manager.status")}
              </Text>
              <Button
                appearance={useBatchLoading ? "primary" : "secondary"}
                size="small"
                onClick={() => setUseBatchLoading(!useBatchLoading)}
                disabled={isLoadingApps}
                style={{ justifyContent: "flex-start" }}
              >
                {useBatchLoading
                  ? t("app_manager.batch_loading")
                  : t("app_manager.traditional_loading")}
              </Button>
              <Button
                appearance={
                  viewSource === "apps" && !includeSystemApps
                    ? "primary"
                    : "secondary"
                }
                size="small"
                onClick={() => {
                  setIncludeSystemApps(false);
                  setViewSource("apps");
                  if (useBatchLoading) loadAppsBatch();
                  else loadApps();
                }}
                disabled={isLoadingApps}
                style={{ justifyContent: "flex-start" }}
              >
                {t("app_manager.tab_apps")}
              </Button>
              <Button
                appearance={
                  viewSource === "apps" && includeSystemApps
                    ? "primary"
                    : "secondary"
                }
                size="small"
                onClick={() => {
                  setIncludeSystemApps(true);
                  setViewSource("apps");
                  if (useBatchLoading) loadAppsBatch();
                  else loadApps();
                }}
                disabled={isLoadingApps}
                style={{ justifyContent: "flex-start" }}
              >
                {t("app_manager.system_app")}
                {includeSystemApps && (
                  <Badge
                    size="tiny"
                    appearance="filled"
                    style={{ marginLeft: "auto" }}
                  >
                    {filteredApps.filter((a) => a.isSystemApp).length}
                  </Badge>
                )}
              </Button>
              <Button
                appearance={viewSource === "current" ? "primary" : "secondary"}
                size="small"
                onClick={loadCurrentApp}
                disabled={isLoadingApps}
                style={{ justifyContent: "flex-start" }}
              >
                {t("app_manager.tab_current")}
              </Button>
              <Button
                appearance={viewSource === "frozen" ? "primary" : "secondary"}
                size="small"
                onClick={loadFrozenApps}
                disabled={isLoadingApps}
                style={{ justifyContent: "flex-start" }}
              >
                {t("app_manager.tab_frozen")}
                {viewSource === "frozen" && (
                  <Badge
                    size="tiny"
                    appearance="filled"
                    style={{ marginLeft: "auto" }}
                  >
                    {filteredApps.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* 批量操作按钮组 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginTop: "12px",
              }}
            >
              <Text
                weight="semibold"
                size={200}
                style={{
                  color: "var(--colorNeutralForeground3)",
                  marginBottom: "4px",
                }}
              >
                {t("app_manager.batch_ops")}{" "}
                {selectedApps.size > 0 && `(${selectedApps.size})`}
              </Text>
              <Button
                appearance="primary"
                icon={<Delete24Regular />}
                onClick={handleBatchUninstall}
                disabled={isLoadingApps || selectedApps.size === 0}
                style={
                  selectedApps.size > 0
                    ? {
                        backgroundColor: "var(--colorPaletteRedBackground3)",
                        color: "white",
                      }
                    : {}
                }
              >
                {t("app_manager.uninstall")}
              </Button>
              <Button
                appearance="secondary"
                icon={<LockClosed24Regular />}
                onClick={() => handleBatchFreezeToggle(true)}
                disabled={isLoadingApps || selectedApps.size === 0}
              >
                {t("app_manager.freeze")}
              </Button>
              <Button
                appearance="secondary"
                icon={<LockOpen24Regular />}
                onClick={() => handleBatchFreezeToggle(false)}
                disabled={isLoadingApps || selectedApps.size === 0}
              >
                {t("app_manager.unfreeze")}
              </Button>
              <Button
                appearance="secondary"
                icon={<ShieldLock24Regular />}
                onClick={handleBatchForceStop}
                disabled={isLoadingApps || selectedApps.size === 0}
              >
                {t("app_manager.force_stop")}
              </Button>
              <Button
                appearance="secondary"
                icon={<Save24Regular />}
                onClick={handleBatchExportApk}
                disabled={isLoadingApps || selectedApps.size === 0}
              >
                {t("app_manager.export_apk")}
              </Button>
              <Button
                appearance="secondary"
                icon={<Eraser24Regular />}
                onClick={handleBatchClearData}
                disabled={isLoadingApps || selectedApps.size === 0}
              >
                {t("app_manager.clear_data")}
              </Button>
              <div style={{ display: "flex", gap: "4px" }}>
                <Button
                  appearance="subtle"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleExportAppList}
                  disabled={isLoadingApps || selectedApps.size === 0}
                  style={{ flex: 1 }}
                  size="small"
                >
                  {t("common.export")}
                </Button>
                <Button
                  appearance="subtle"
                  icon={<ArrowUpload24Regular />}
                  onClick={handleImportAppList}
                  disabled={isLoadingApps}
                  style={{ flex: 1 }}
                  size="small"
                >
                  {t("common.import")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧应用列表区 */}
        <div className={styles.rightPanel}>
          <Card className={styles.card}>
            <div
              className={styles.content}
              style={{
                padding: "8px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {isLoadingApps && filteredApps.length === 0 ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="large" label={t("app_manager.loading")} />
                </div>
              ) : filteredApps.length === 0 ? (
                <div className={styles.emptyState}>
                  <Apps24Regular style={{ fontSize: "48px" }} />
                  <Text>{t("app_manager.no_apps_found")}</Text>
                  <Text size={200}>{t("unlock.select_device_hint")}</Text>
                </div>
              ) : (
                <Table
                  arial-label={t("app_manager.card_title")}
                  style={{ tableLayout: "fixed", width: "100%" }}
                >
                  <colgroup>
                    <col style={{ width: 44 }} />
                    <col />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "100px" }} />
                    <col style={{ width: "64px" }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>
                        <Checkbox
                          checked={
                            selectedApps.size === filteredApps.length &&
                            filteredApps.length > 0
                          }
                          onChange={(_, data) =>
                            handleSelectAll(data.checked === true)
                          }
                        />
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {t("app_manager.app_name_package")}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {t("app_manager.version")}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {t("app_manager.status")}
                      </TableHeaderCell>
                      <TableHeaderCell>
                        {t("app_manager.actions")}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app) => (
                      <TableRow
                        key={app.packageName}
                        className={styles.compactTableRow}
                        onContextMenu={(e) => handleContextMenu(e, app)}
                      >
                        <TableCell className={styles.compactCell}>
                          <Checkbox
                            checked={selectedApps.has(app.packageName)}
                            onChange={(_, data) =>
                              handleSelectApp(
                                app.packageName,
                                data.checked === true,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              minWidth: 0,
                            }}
                          >
                            <div
                              className={styles.appIconLarge}
                              style={{
                                width: "28px",
                                height: "28px",
                                fontSize: "14px",
                              }}
                            >
                              <Text weight="semibold">
                                {(app as any).label
                                  ? (app as any).label.charAt(0).toUpperCase()
                                  : app.packageName
                                      .split(".")
                                      .pop()
                                      ?.charAt(0)
                                      .toUpperCase() || "?"}
                              </Text>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 0,
                              }}
                            >
                              <Text
                                className={styles.appNamePrimary}
                                style={{ fontSize: "13px" }}
                                title={(app as any).label || app.packageName}
                              >
                                {(app as any).label || app.packageName}
                              </Text>
                              <Text
                                className={styles.appNameSecondary}
                                style={{ fontSize: "11px" }}
                                title={app.packageName}
                              >
                                {app.packageName}
                              </Text>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Text size={200} title={app.versionName || ""}>
                            {app.versionName
                              ? formatVersionName(app.versionName)
                              : "-"}
                          </Text>
                        </TableCell>
                        <TableCell className={styles.compactCell}>
                          <Badge
                            appearance={app.isEnabled ? "filled" : "ghost"}
                            color={app.isEnabled ? "success" : "danger"}
                            size="small"
                          >
                            {app.isEnabled
                              ? t("app_manager.enabled")
                              : t("app_manager.disabled")}
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
                                  onClick={() => handleShowDetails(app)}
                                >
                                  {t("app_properties.detail_info")}
                                </MenuItem>
                                {!app.isSystemApp && (
                                  <>
                                    <MenuItem
                                      icon={<Delete24Regular />}
                                      onClick={() => handleUninstallClick(app)}
                                    >
                                      {t("app_manager.uninstall")}
                                    </MenuItem>
                                    <MenuItem
                                      icon={
                                        app.isEnabled ? (
                                          <LockClosed24Regular />
                                        ) : (
                                          <LockOpen24Regular />
                                        )
                                      }
                                      onClick={() =>
                                        handleFreezeToggle(
                                          app.packageName,
                                          app.isEnabled,
                                        )
                                      }
                                    >
                                      {app.isEnabled
                                        ? t("app_manager.freeze")
                                        : t("app_manager.unfreeze")}
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Eraser24Regular />}
                                      onClick={() =>
                                        handleClearData(app.packageName)
                                      }
                                    >
                                      {t("app_manager.clear_data")}
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Save24Regular />}
                                      onClick={() =>
                                        handleExportApk(app.packageName)
                                      }
                                    >
                                      {t("app_manager.export_apk")}
                                    </MenuItem>
                                  </>
                                )}
                                <MenuItem
                                  icon={<ShieldLock24Regular />}
                                  onClick={() => handleOpenAuditor(app)}
                                >
                                  {t("app_manager.ai_auditor_beta")}
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
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
      <Dialog
        open={confirmUninstallDialogOpen}
        onOpenChange={(_, data) => setConfirmUninstallDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogTitle>{t("app_manager.uninstall_confirm_title")}</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                {t("app_manager.uninstall_confirm_desc", {
                  packageName: appToUninstall?.packageName,
                })}
              </Text>
              <br />
              <Text
                size={200}
                style={{ color: "var(--colorPaletteRedForeground1)" }}
              >
                ⚠️ {t("app_manager.uninstall_warning")}
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">{t("common.cancel")}</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={confirmUninstall}>
              {t("app_manager.confirm")}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Application Details Drawer */}
      <OverlayDrawer
        position="end"
        open={isDrawerOpen}
        onOpenChange={(_, { open }) => setIsDrawerOpen(open)}
        style={{ width: "400px" }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Delete24Regular />} // Using Delete icon as close for now, or use specialized Close icon if available
                onClick={() => setIsDrawerOpen(false)}
              />
            }
          >
            {t("app_properties.detail_info")}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className={styles.detailsGrid}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                className={styles.appIconLarge}
                style={{ width: "64px", height: "64px", fontSize: "24px" }}
              >
                <Text
                  weight="semibold"
                  size={600}
                  style={{ color: "var(--colorNeutralForeground3)" }}
                >
                  {(selectedAppForDetails as any)?.label
                    ? (selectedAppForDetails as any).label
                        .charAt(0)
                        .toUpperCase()
                    : selectedAppForDetails?.packageName
                        .split(".")
                        .pop()
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                </Text>
              </div>
              <div>
                <Text size={500} weight="bold">
                  {(selectedAppForDetails as any)?.label ||
                    selectedAppForDetails?.packageName}
                </Text>
                <br />
                <Text
                  size={300}
                  style={{ color: "var(--colorNeutralForeground3)" }}
                >
                  {selectedAppForDetails?.packageName}
                </Text>
              </div>
            </div>

            <div className={styles.detailsLabel}>
              {t("app_manager.version_name")}:
            </div>
            <div className={styles.detailsValue}>
              {selectedAppForDetails?.versionName || t("common.unknown")}
            </div>

            <div className={styles.detailsLabel}>
              {t("app_manager.version_code")}:
            </div>
            <div className={styles.detailsValue}>
              {selectedAppForDetails?.versionCode || t("common.unknown")}
            </div>

            <div className={styles.detailsLabel}>
              {t("app_manager.status")}:
            </div>
            <div className={styles.detailsValue}>
              <Badge
                appearance={
                  selectedAppForDetails?.isEnabled ? "filled" : "ghost"
                }
                color={selectedAppForDetails?.isEnabled ? "success" : "danger"}
              >
                {selectedAppForDetails?.isEnabled
                  ? t("app_manager.enabled")
                  : t("app_manager.disabled")}
              </Badge>
            </div>

            <div className={styles.detailsLabel}>
              {t("app_properties.is_system_app")}:
            </div>
            <div className={styles.detailsValue}>
              {selectedAppForDetails?.isSystemApp
                ? t("common.yes")
                : t("common.no")}
            </div>

            {selectedAppForDetails?.apkPath && (
              <>
                <div className={styles.detailsLabel}>
                  {t("app_properties.apk_path")}:
                </div>
                <div
                  className={styles.detailsValue}
                  style={{ wordBreak: "break-all" }}
                >
                  {selectedAppForDetails.apkPath}
                </div>
              </>
            )}

            {selectedAppForDetails?.installTime && (
              <>
                <div className={styles.detailsLabel}>
                  {t("app_properties.install_time")}:
                </div>
                <div className={styles.detailsValue}>
                  {selectedAppForDetails.installTime}
                </div>
              </>
            )}

            {selectedAppForDetails?.updateTime && (
              <>
                <div className={styles.detailsLabel}>
                  {t("app_properties.update_time")}:
                </div>
                <div className={styles.detailsValue}>
                  {selectedAppForDetails.updateTime}
                </div>
              </>
            )}

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <Button
                icon={<Open24Regular />}
                onClick={() =>
                  selectedAppForDetails &&
                  handleOpenSettings(selectedAppForDetails.packageName)
                }
              >
                {t("app_manager.open_in_settings") || "Open Settings"}
              </Button>
              <Button
                icon={<Play24Regular />}
                appearance="primary"
                onClick={() =>
                  selectedAppForDetails &&
                  handleLaunchApp(selectedAppForDetails.packageName)
                }
              >
                {t("app_manager.launch") || "Launch App"}
              </Button>
              <Button
                icon={<ShieldLock24Regular />}
                onClick={() =>
                  selectedAppForDetails &&
                  handleOpenAuditor(selectedAppForDetails)
                }
              >
                {t("app_manager.ai_auditor_beta")}
              </Button>
              <Button
                icon={<Copy24Regular />}
                onClick={() => {
                  if (selectedAppForDetails?.packageName) {
                    navigator.clipboard.writeText(
                      selectedAppForDetails.packageName,
                    );
                  }
                }}
              >
                {t("common.copy_package") || "Copy Package Name"}
              </Button>
            </div>
          </div>
        </DrawerBody>
      </OverlayDrawer>

      {/* Context Menu */}
      {contextMenuLocation && (
        <Menu
          open={true}
          onOpenChange={(e, data) => {
            if (!data.open) {
              setContextMenuLocation(null);
              setContextMenuApp(null);
            }
          }}
          positioning={{
            target: {
              getBoundingClientRect: () =>
                ({
                  top: contextMenuLocation.top,
                  left: contextMenuLocation.left,
                  width: 0,
                  height: 0,
                  right: contextMenuLocation.left,
                  bottom: contextMenuLocation.top,
                }) as DOMRect,
            },
          }}
        >
          <MenuPopover>
            <MenuList>
              <MenuItem
                icon={<Info24Regular />}
                onClick={() =>
                  contextMenuApp && handleShowDetails(contextMenuApp)
                }
              >
                {t("app_properties.detail_info")}
              </MenuItem>
              <MenuItem
                icon={<Copy24Regular />}
                onClick={() => {
                  if (contextMenuApp?.packageName) {
                    navigator.clipboard.writeText(contextMenuApp.packageName);
                    setContextMenuLocation(null);
                  }
                }}
              >
                {t("common.copy_package") || "Copy Package Name"}
              </MenuItem>
              {contextMenuApp && !contextMenuApp.isSystemApp && (
                <>
                  <MenuItem
                    icon={<Delete24Regular />}
                    onClick={() => {
                      if (contextMenuApp) handleUninstallClick(contextMenuApp);
                      setContextMenuLocation(null);
                    }}
                  >
                    {t("app_manager.uninstall")}
                  </MenuItem>
                  <MenuItem
                    icon={
                      contextMenuApp.isEnabled ? (
                        <LockClosed24Regular />
                      ) : (
                        <LockOpen24Regular />
                      )
                    }
                    onClick={() => {
                      if (contextMenuApp)
                        handleFreezeToggle(
                          contextMenuApp.packageName,
                          contextMenuApp.isEnabled,
                        );
                      setContextMenuLocation(null);
                    }}
                  >
                    {contextMenuApp.isEnabled
                      ? t("app_manager.freeze")
                      : t("app_manager.unfreeze")}
                  </MenuItem>
                </>
              )}
              <MenuItem
                icon={<ShieldLock24Regular />}
                onClick={() => {
                  if (contextMenuApp) handleOpenAuditor(contextMenuApp);
                  setContextMenuLocation(null);
                }}
              >
                {t("app_manager.ai_auditor_beta")}
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )}

      {/* AI Auditor Drawer */}
      <OverlayDrawer
        position="end"
        open={isAuditorOpen}
        onOpenChange={(_, { open }) => setIsAuditorOpen(open)}
        style={{ width: "450px" }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Delete24Regular />}
                onClick={() => setIsAuditorOpen(false)}
              />
            }
          >
            AI 安全审计(Beta)
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          {appToAudit && (
            <APKAuditorPanel
              app={appToAudit}
              onClose={() => setIsAuditorOpen(false)}
            />
          )}
        </DrawerBody>
      </OverlayDrawer>
    </div>
  );
};

export default AppManagerPanel;
