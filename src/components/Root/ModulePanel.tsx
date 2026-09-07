import React, { useState, useEffect, useMemo } from "react";
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Badge,
  Input,
  Spinner,
  Switch,
  Checkbox,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  ArrowSync24Regular,
  Delete24Regular,
  Search24Regular,
  Add24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Info24Regular,
  Apps24Regular,
  Box24Regular,
  ArrowDownload24Regular,
  Sparkle24Regular,
  Link24Regular,
  Copy24Regular,
  Open24Regular,
} from "@fluentui/react-icons";
import { open } from "@tauri-apps/plugin-dialog";
import { DeviceInfo } from "../../types/device";
import {
  rootModuleService,
  UnifiedRootModule,
  RootEnvironmentInfo,
  RootModuleType,
  OnlineCoreModuleInfo,
  DEFAULT_ONLINE_CORE_MODULES,
} from "../../services/rootModuleService";
import { useAppStore } from "../../stores/appStore";

const openUrl = (url: string) => {
  import("@tauri-apps/plugin-shell")
    .then(({ open }) => {
      open(url).catch((error) => {
        console.error("Failed to open URL:", error);
        window.open(url, "_blank");
      });
    })
    .catch(() => {
      window.open(url, "_blank");
    });
};

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    boxSizing: "border-box",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  topBarRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  tabSegment: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "4px",
    borderRadius: "9999px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  tabSegmentItem: {
    fontSize: "12px",
    padding: "5px 14px",
    borderRadius: "9999px",
    cursor: "pointer",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.15s ease",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 500,
    "&:hover": {
      color: "var(--colorBrandForeground1)",
    },
  },
  tabSegmentItemActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
  },
  envStatusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    padding: "10px 14px",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    flexShrink: 0,
  },
  envItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  filterPills: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  filterPill: {
    fontSize: "12px",
    padding: "4px 12px",
    borderRadius: "9999px",
    backgroundColor: "var(--colorNeutralBackground3)",
    cursor: "pointer",
    border: "1px solid transparent",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.15s ease",
    userSelect: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
      color: "var(--colorBrandForeground1)",
    },
  },
  filterPillActive: {
    backgroundColor: "rgba(0, 113, 227, 0.12)",
    ...shorthands.borderColor("var(--colorBrandStroke1)"),
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: "4px",
  },
  moduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  moduleCard: {
    padding: "14px 16px",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "10px",
    transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
    "&:hover": {
      borderTopColor: "var(--colorBrandStroke1)",
      borderRightColor: "var(--colorBrandStroke1)",
      borderBottomColor: "var(--colorBrandStroke1)",
      borderLeftColor: "var(--colorBrandStroke1)",
      boxShadow: "0 3px 12px rgba(0, 0, 0, 0.05)",
    },
  },
  moduleCardDisabled: {
    opacity: 0.7,
    backgroundColor: "var(--colorNeutralBackground3)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
  },
  cardIdText: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardDesc: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.4",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "8px",
    borderTop: "1px solid var(--colorNeutralStroke3)",
    flexWrap: "wrap",
    gap: "8px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "48px 24px",
    color: "var(--colorNeutralForeground3)",
    textAlign: "center",
  },
});

interface ModulePanelProps {
  device: DeviceInfo | null;
}

export const ModulePanel: React.FC<ModulePanelProps> = ({ device }) => {
  const styles = useStyles();
  const { setStatusBarMessage } = useAppStore();

  const [activeTab, setActiveTab] = useState<"installed" | "online">("installed");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [environment, setEnvironment] = useState<RootEnvironmentInfo | null>(null);
  const [modules, setModules] = useState<UnifiedRootModule[]>([]);
  const [filterType, setFilterType] = useState<"all" | RootModuleType>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const [isCheckingUpdates, setIsCheckingUpdates] = useState<boolean>(false);
  const [updatesMap, setUpdatesMap] = useState<
    Map<string, { latestVersion: string; moduleInfo: OnlineCoreModuleInfo }>
  >(new Map());

  const [moduleToDelete, setModuleToDelete] = useState<UnifiedRootModule | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  const [isUrlInstallOpen, setIsUrlInstallOpen] = useState<boolean>(false);
  const [directUrl, setDirectUrl] = useState<string>("");
  const [isDirectInstalling, setIsDirectInstalling] = useState<boolean>(false);
  const [directInstallStatus, setDirectInstallStatus] = useState<string>("");

  const [onlineModules, setOnlineModules] = useState<OnlineCoreModuleInfo[]>(DEFAULT_ONLINE_CORE_MODULES);
  const [isOnlineLoading, setIsOnlineLoading] = useState<boolean>(false);
  const [onlineFilterCategory, setOnlineFilterCategory] = useState<
    "all" | "framework" | "hide" | "fix" | "custom"
  >("all");
  const [onlineSearch, setOnlineSearch] = useState<string>("");
  const [useMirror, setUseMirror] = useState<boolean>(true);
  const [installingOnlineId, setInstallingOnlineId] = useState<string | null>(null);

  const loadModules = async () => {
    if (!device?.serial) return;

    setIsLoading(true);
    try {
      const data = await rootModuleService.scanAllModules(device.serial);
      setEnvironment(data.environment);
      setModules(data.modules);
    } catch (err: any) {
      console.error(err);
      setStatusBarMessage({
        type: "error",
        message: `扫描模块失败: ${err.message || String(err)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOnlineModules = async (forceRefresh = false) => {
    setIsOnlineLoading(true);
    try {
      const list = await rootModuleService.fetchOnlineCoreModules(forceRefresh, useMirror);
      setOnlineModules(list);
    } catch (err: any) {
      console.warn("加载在线模块库失败:", err);
    } finally {
      setIsOnlineLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
    loadOnlineModules(false);
  }, [device?.serial]);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    setStatusBarMessage({ type: "info", message: "正在检索核心模块最新版本并比对更新..." });
    try {
      const onlineList = await rootModuleService.fetchOnlineCoreModules(true, useMirror);
      setOnlineModules(onlineList);

      const detected = rootModuleService.checkInstalledModulesUpdates(modules, onlineList);
      setUpdatesMap(detected);

      if (detected.size > 0) {
        setStatusBarMessage({
          type: "success",
          message: `检查完毕：发现 ${detected.size} 个模块有新版本可用！`,
        });
      } else {
        setStatusBarMessage({
          type: "info",
          message: "检查完毕：已安装模块均已是官方最新版本或无可用匹配更新。",
        });
      }
    } catch (e: any) {
      setStatusBarMessage({ type: "error", message: `检查更新失败: ${e.message || String(e)}` });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleToggleModule = async (mod: UnifiedRootModule, newStatus: boolean) => {
    if (!device?.serial) return;

    try {
      const success = await rootModuleService.toggleModule(device.serial, mod, newStatus);
      if (success) {
        setModules((prev) =>
          prev.map((m) => (m.id === mod.id ? { ...m, enabled: newStatus } : m))
        );
        setStatusBarMessage({
          type: "success",
          message: `${mod.name} 已${newStatus ? "启用" : "禁用"}${mod.type !== "lsposed" ? "，重启设备后生效" : ""}`,
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: `更改模块状态失败，请确认 Root 提权是否正常`,
        });
      }
    } catch (e: any) {
      setStatusBarMessage({
        type: "error",
        message: `操作异常: ${e.message || String(e)}`,
      });
    }
  };

  const handleConfirmUninstall = async () => {
    if (!device?.serial || !moduleToDelete) return;

    setIsDeleting(true);
    try {
      const result = await rootModuleService.uninstallModule(device.serial, moduleToDelete);
      if (result.success) {
        setModules((prev) => prev.filter((m) => m.id !== moduleToDelete.id));
        setStatusBarMessage({
          type: "success",
          message: result.message,
        });
        setModuleToDelete(null);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.message,
        });
      }
    } catch (e: any) {
      setStatusBarMessage({
        type: "error",
        message: `卸载失败: ${e.message || String(e)}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInstallLocalModule = async () => {
    if (!device?.serial) {
      setStatusBarMessage({ type: "warning", message: "请先连接设备" });
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "模块安装包", extensions: ["zip", "apk"] },
          { name: "Magisk/KernelSU 模块 (.zip)", extensions: ["zip"] },
          { name: "LSPosed 模块应用 (.apk)", extensions: ["apk"] },
        ],
      });

      if (typeof selected === "string") {
        setIsInstalling(true);
        setStatusBarMessage({
          type: "info",
          message: `正在将模块写入设备并刷入: ${selected.split("\\").pop()?.split("/").pop()}`,
        });

        const res = await rootModuleService.installModuleFile(device.serial, selected);
        if (res.success) {
          setStatusBarMessage({ type: "success", message: res.message });
          await loadModules();
        } else {
          setStatusBarMessage({ type: "error", message: res.message });
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusBarMessage({ type: "error", message: `安装中断: ${err.message || String(err)}` });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallOnlineModule = async (mod: OnlineCoreModuleInfo) => {
    if (!device?.serial) {
      setStatusBarMessage({ type: "warning", message: "请先连接设备" });
      return;
    }

    setInstallingOnlineId(mod.id);
    try {
      const res = await rootModuleService.downloadAndInstallOnlineModule(
        device.serial,
        mod,
        useMirror,
        (_pct, status) => {
          setStatusBarMessage({ type: "info", message: status });
        }
      );

      if (res.success) {
        setStatusBarMessage({ type: "success", message: `${mod.name}: ${res.message}` });
        await loadModules();
      } else {
        setStatusBarMessage({ type: "error", message: `${mod.name} 安装失败: ${res.message}` });
      }
    } catch (err: any) {
      setStatusBarMessage({ type: "error", message: `安装异常: ${err.message || String(err)}` });
    } finally {
      setInstallingOnlineId(null);
    }
  };

  const handleConfirmUrlInstall = async () => {
    if (!device?.serial || !directUrl.trim()) return;

    setIsDirectInstalling(true);
    setDirectInstallStatus("正在建立连接并下载...");
    try {
      const res = await rootModuleService.installModuleFromUrl(
        device.serial,
        directUrl.trim(),
        useMirror,
        (_pct, status) => {
          setDirectInstallStatus(status);
        }
      );

      if (res.success) {
        setStatusBarMessage({ type: "success", message: res.message });
        setIsUrlInstallOpen(false);
        setDirectUrl("");
        await loadModules();
      } else {
        setDirectInstallStatus(`刷入失败: ${res.message}`);
      }
    } catch (e: any) {
      setDirectInstallStatus(`操作异常: ${e.message || String(e)}`);
    } finally {
      setIsDirectInstalling(false);
    }
  };

  const counts = useMemo(() => {
    return {
      all: modules.length,
      magisk: modules.filter((m) => m.type === "magisk").length,
      ksu: modules.filter((m) => m.type === "ksu").length,
      lsposed: modules.filter((m) => m.type === "lsposed").length,
    };
  }, [modules]);

  const displayedModules = useMemo(() => {
    return modules.filter((mod) => {
      if (filterType !== "all" && mod.type !== filterType) {
        return false;
      }
      if (searchKeyword.trim()) {
        const q = searchKeyword.trim().toLowerCase();
        const matches =
          mod.name.toLowerCase().includes(q) ||
          mod.id.toLowerCase().includes(q) ||
          mod.author.toLowerCase().includes(q) ||
          mod.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [modules, filterType, searchKeyword]);

  const displayedOnlineModules = useMemo(() => {
    return onlineModules.filter((mod) => {
      if (onlineFilterCategory !== "all" && mod.category !== onlineFilterCategory) {
        return false;
      }
      if (onlineSearch.trim()) {
        const q = onlineSearch.trim().toLowerCase();
        const matches =
          mod.name.toLowerCase().includes(q) ||
          mod.id.toLowerCase().includes(q) ||
          mod.author.toLowerCase().includes(q) ||
          mod.description.toLowerCase().includes(q) ||
          mod.targetEnv.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [onlineModules, onlineFilterCategory, onlineSearch]);

  return (
    <div className={styles.container}>
      <div className={styles.topBarRow}>
        <div className={styles.tabSegment}>
          <div
            className={`${styles.tabSegmentItem} ${activeTab === "installed" ? styles.tabSegmentItemActive : ""}`}
            onClick={() => setActiveTab("installed")}
          >
            <Box24Regular style={{ fontSize: "16px" }} />
            <span>已安装模块 ({modules.length})</span>
          </div>
          <div
            className={`${styles.tabSegmentItem} ${activeTab === "online" ? styles.tabSegmentItemActive : ""}`}
            onClick={() => setActiveTab("online")}
          >
            <Sparkle24Regular style={{ fontSize: "16px" }} />
            <span>在线核心模块库 (官方精选)</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {activeTab === "installed" ? (
            <>
              <Button
                size="small"
                icon={isCheckingUpdates ? <Spinner size="extra-tiny" /> : <ArrowSync24Regular />}
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdates}
              >
                {isCheckingUpdates ? "检测更新中..." : "检查更新"}
              </Button>
              <Button
                size="small"
                icon={<Link24Regular />}
                onClick={() => setIsUrlInstallOpen(true)}
              >
                在线直链刷入
              </Button>
              <Button
                size="small"
                appearance="primary"
                icon={<Add24Regular />}
                onClick={handleInstallLocalModule}
                disabled={isInstalling || !device}
              >
                {isInstalling ? "安装中..." : "安装本地模块"}
              </Button>
            </>
          ) : (
            <>
              <Checkbox
                label="国内镜像加速"
                checked={useMirror}
                onChange={(_, d) => setUseMirror(!!d.checked)}
              />
              <Button
                size="small"
                icon={isOnlineLoading ? <Spinner size="extra-tiny" /> : <ArrowSync24Regular />}
                onClick={() => loadOnlineModules(true)}
                disabled={isOnlineLoading}
              >
                {isOnlineLoading ? "获取中..." : "获取最新版本"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.envStatusBar}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div className={styles.envItem}>
            <span style={{ color: "var(--colorNeutralForeground3)" }}>Root 提权:</span>
            {environment?.hasRoot ? (
              <Badge appearance="tint" color="success">
                已授权 (uid=0)
              </Badge>
            ) : (
              <Badge appearance="tint" color="warning">
                未授权 / 无提权
              </Badge>
            )}
          </div>
          <div className={styles.envItem}>
            <span style={{ color: "var(--colorNeutralForeground3)" }}>Magisk:</span>
            {environment?.magiskVersion ? (
              <Badge appearance="tint" color="brand">
                {environment.magiskVersion}
              </Badge>
            ) : (
              <Badge appearance="outline">未安装</Badge>
            )}
          </div>
          <div className={styles.envItem}>
            <span style={{ color: "var(--colorNeutralForeground3)" }}>KernelSU:</span>
            {environment?.ksuVersion ? (
              <Badge appearance="tint" color="success">
                {environment.ksuVersion}
              </Badge>
            ) : (
              <Badge appearance="outline">未检测到</Badge>
            )}
          </div>
          <div className={styles.envItem}>
            <span style={{ color: "var(--colorNeutralForeground3)" }}>LSPosed 框架:</span>
            {environment?.lsposedInstalled ? (
              <Badge appearance="tint" color="informative">
                {environment.lsposedVersion || "框架已就绪"}
              </Badge>
            ) : (
              <Badge appearance="outline">未激活</Badge>
            )}
          </div>
        </div>

        <Button
          size="small"
          appearance="subtle"
          icon={<ArrowSync24Regular />}
          onClick={loadModules}
          disabled={isLoading}
        >
          {isLoading ? "扫描中..." : "刷新状态"}
        </Button>
      </div>

      {activeTab === "installed" && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filterPills}>
              <div
                className={`${styles.filterPill} ${filterType === "all" ? styles.filterPillActive : ""}`}
                onClick={() => setFilterType("all")}
              >
                <Box24Regular style={{ fontSize: "14px" }} />
                <span>全部模块</span>
                <Badge size="small" appearance="tint">
                  {counts.all}
                </Badge>
              </div>

              <div
                className={`${styles.filterPill} ${filterType === "magisk" ? styles.filterPillActive : ""}`}
                onClick={() => setFilterType("magisk")}
              >
                <span>Magisk 模块</span>
                <Badge size="small" appearance="tint" color="brand">
                  {counts.magisk}
                </Badge>
              </div>

              <div
                className={`${styles.filterPill} ${filterType === "ksu" ? styles.filterPillActive : ""}`}
                onClick={() => setFilterType("ksu")}
              >
                <span>KernelSU 模块</span>
                <Badge size="small" appearance="tint" color="success">
                  {counts.ksu}
                </Badge>
              </div>

              <div
                className={`${styles.filterPill} ${filterType === "lsposed" ? styles.filterPillActive : ""}`}
                onClick={() => setFilterType("lsposed")}
              >
                <span>LSPosed 模块应用</span>
                <Badge size="small" appearance="tint" color="informative">
                  {counts.lsposed}
                </Badge>
              </div>
            </div>

            <Input
              placeholder="搜索已安装模块..."
              contentBefore={<Search24Regular />}
              value={searchKeyword}
              onChange={(_, d) => setSearchKeyword(d.value)}
              style={{ width: "220px" }}
            />
          </div>

          <div className={styles.contentArea}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <Spinner label="正在读取设备模块列表与挂载状态..." />
              </div>
            ) : displayedModules.length === 0 ? (
              <div className={styles.emptyState}>
                <Box24Regular style={{ fontSize: "40px" }} />
                <Text weight="semibold">
                  {modules.length === 0 ? "未在设备上检测到任何已安装的模块" : "未找到匹配的模块"}
                </Text>
                <Text size={200} style={{ maxWidth: "420px" }}>
                  {modules.length === 0
                    ? "可切换至上方【在线核心模块库】，一键下载并刷入 LSPosed、Zygisk Next 等核心模块；或点击【安装本地模块】载入文件。"
                    : "可尝试清空搜索输入框或切换分类选项卡。"}
                </Text>
                {modules.length === 0 && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button appearance="primary" icon={<Sparkle24Regular />} onClick={() => setActiveTab("online")}>
                      前往在线模块库
                    </Button>
                    <Button appearance="secondary" icon={<Add24Regular />} onClick={handleInstallLocalModule}>
                      安装本地文件
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.moduleGrid}>
                {displayedModules.map((mod) => {
                  const isLsp = mod.type === "lsposed";
                  const isKsu = mod.type === "ksu";
                  const isMagisk = mod.type === "magisk";
                  const updateInfo = updatesMap.get(mod.id);

                  return (
                    <div
                      key={`${mod.type}-${mod.id}`}
                      className={`${styles.moduleCard} ${!mod.enabled ? styles.moduleCardDisabled : ""}`}
                    >
                      <div className={styles.cardHeader}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <Text weight="semibold" size={300} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {mod.name}
                            </Text>
                            <Badge
                              size="small"
                              appearance="tint"
                              color={isKsu ? "success" : isMagisk ? "brand" : "informative"}
                            >
                              {isKsu ? "KernelSU 模块" : isMagisk ? "Magisk 模块" : "LSPosed 模块"}
                            </Badge>
                            {updateInfo && (
                              <Badge size="small" appearance="filled" color="important">
                                可更新至 {updateInfo.latestVersion}
                              </Badge>
                            )}
                            {mod.pendingRemove && (
                              <Badge size="small" appearance="tint" color="danger">
                                待重启移除
                              </Badge>
                            )}
                          </div>
                          <div className={styles.cardIdText}>{mod.id}</div>
                        </div>
                      </div>

                      <div className={styles.cardDesc}>{mod.description}</div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                        <span>当前版本: {mod.version}</span>
                        <span>·</span>
                        <span>作者: {mod.author}</span>
                      </div>

                      <div className={styles.cardFooter}>
                        <Switch
                          checked={mod.enabled}
                          onChange={(_, d) => handleToggleModule(mod, d.checked)}
                          label={mod.enabled ? "已启用" : "已禁用"}
                        />

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {updateInfo && (
                            <Button
                              size="small"
                              appearance="primary"
                              icon={<ArrowDownload24Regular />}
                              onClick={() => handleInstallOnlineModule(updateInfo.moduleInfo)}
                            >
                              更新
                            </Button>
                          )}
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete24Regular />}
                            onClick={() => setModuleToDelete(mod)}
                          >
                            卸载
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "online" && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filterPills}>
              <div
                className={`${styles.filterPill} ${onlineFilterCategory === "all" ? styles.filterPillActive : ""}`}
                onClick={() => setOnlineFilterCategory("all")}
              >
                <span>全部分类 ({onlineModules.length})</span>
              </div>
              <div
                className={`${styles.filterPill} ${onlineFilterCategory === "framework" ? styles.filterPillActive : ""}`}
                onClick={() => setOnlineFilterCategory("framework")}
              >
                <span>核心框架</span>
              </div>
              <div
                className={`${styles.filterPill} ${onlineFilterCategory === "hide" ? styles.filterPillActive : ""}`}
                onClick={() => setOnlineFilterCategory("hide")}
              >
                <span>深度隐藏</span>
              </div>
              <div
                className={`${styles.filterPill} ${onlineFilterCategory === "fix" ? styles.filterPillActive : ""}`}
                onClick={() => setOnlineFilterCategory("fix")}
              >
                <span>环境修复</span>
              </div>
              <div
                className={`${styles.filterPill} ${onlineFilterCategory === "custom" ? styles.filterPillActive : ""}`}
                onClick={() => setOnlineFilterCategory("custom")}
              >
                <span>系统定制</span>
              </div>
            </div>

            <Input
              placeholder="检索在线核心模块..."
              contentBefore={<Search24Regular />}
              value={onlineSearch}
              onChange={(_, d) => setOnlineSearch(d.value)}
              style={{ width: "240px" }}
            />
          </div>

          <div className={styles.contentArea}>
            <div className={styles.moduleGrid}>
              {displayedOnlineModules.map((mod) => {
                const isInstalled = modules.some(
                  (m) =>
                    m.id.toLowerCase().includes(mod.id) ||
                    m.name.toLowerCase().includes(mod.name.toLowerCase()) ||
                    (mod.id === "hyperceiler" && m.packageName === "com.sevtinge.hyperceiler")
                );

                return (
                  <div key={mod.id} className={styles.moduleCard}>
                    <div className={styles.cardHeader}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <Text weight="semibold" size={300}>{mod.name}</Text>
                          <Badge
                            size="small"
                            appearance="tint"
                            color={mod.category === "framework" ? "brand" : mod.category === "hide" ? "important" : "success"}
                          >
                            {mod.category === "framework" ? "核心框架" : mod.category === "hide" ? "深度隐藏" : mod.category === "fix" ? "环境修复" : "系统魔改"}
                          </Badge>
                          {isInstalled && (
                            <Badge size="small" appearance="tint" color="success">
                              已安装
                            </Badge>
                          )}
                        </div>
                        <div className={styles.cardIdText}>
                          {mod.repo} · 目标环境: {mod.targetEnv}
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardDesc}>{mod.description}</div>

                    {mod.notes && (
                      <div style={{ fontSize: "11px", color: "var(--colorBrandForeground1)", backgroundColor: "rgba(0, 113, 227, 0.06)", padding: "4px 8px", borderRadius: "6px" }}>
                        提示: {mod.notes}
                      </div>
                    )}

                    <div className={styles.cardFooter}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <Badge appearance="filled" color="brand" size="small">
                          {mod.version}
                        </Badge>
                        {mod.fileSize && (
                          <span style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                            {mod.fileSize}
                          </span>
                        )}
                        {mod.releaseDate && (
                          <span style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                            {mod.releaseDate}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Copy24Regular />}
                          title="复制下载直链"
                          onClick={() => {
                            const url = useMirror && mod.downloadUrl.includes("github.com")
                              ? `https://ghproxy.net/${mod.downloadUrl}`
                              : mod.downloadUrl;
                            navigator.clipboard.writeText(url);
                            setStatusBarMessage({ type: "success", message: `已复制 ${mod.name} 下载直链到剪贴板` });
                          }}
                        />
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Open24Regular />}
                          title="在浏览器中查看 GitHub Release"
                          onClick={() => openUrl(`https://github.com/${mod.repo}/releases`)}
                        />
                        <Button
                          size="small"
                          appearance="primary"
                          icon={installingOnlineId === mod.id ? <Spinner size="extra-tiny" /> : <ArrowDownload24Regular />}
                          disabled={installingOnlineId !== null || !device}
                          onClick={() => handleInstallOnlineModule(mod)}
                        >
                          {installingOnlineId === mod.id ? "刷入中..." : "一键下载并刷入"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Dialog open={isUrlInstallOpen} onOpenChange={(_, d) => setIsUrlInstallOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>在线直链安装模块</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                请输入 Magisk / KernelSU 内核模块 (.zip) 或 LSPosed 模块应用 (.apk) 的直链下载地址，系统将自动拉取并写入设备：
              </Text>
              <Input
                placeholder="https://github.com/.../release.zip 或 https://..."
                value={directUrl}
                onChange={(_, d) => setDirectUrl(d.value)}
                disabled={isDirectInstalling}
              />
              <Checkbox
                label="启用国内高速镜像代理加速 (ghproxy.net)"
                checked={useMirror}
                onChange={(_, d) => setUseMirror(!!d.checked)}
                disabled={isDirectInstalling}
              />
              {directInstallStatus && (
                <Text size={100} style={{ color: "var(--colorBrandForeground1)", fontFamily: "ui-monospace, monospace" }}>
                  {directInstallStatus}
                </Text>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="subtle"
                onClick={() => setIsUrlInstallOpen(false)}
                disabled={isDirectInstalling}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                icon={isDirectInstalling ? <Spinner size="extra-tiny" /> : <ArrowDownload24Regular />}
                onClick={handleConfirmUrlInstall}
                disabled={isDirectInstalling || !directUrl.trim()}
              >
                {isDirectInstalling ? "正在下载并刷入..." : "开始下载并刷入"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={!!moduleToDelete}
        onOpenChange={(_, d) => !d.open && setModuleToDelete(null)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>确认卸载模块</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Text>
                  您确定要从设备中卸载 <strong>{moduleToDelete?.name}</strong> 吗？
                </Text>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  {moduleToDelete?.type === "lsposed"
                    ? "卸载后该插件应用的 APK 将从系统中完全移除。"
                    : "内核模块移除后可能需要重启手机才能完全恢复原貌。"}
                </Text>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={isDeleting}
                onClick={() => setModuleToDelete(null)}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                disabled={isDeleting}
                onClick={handleConfirmUninstall}
              >
                {isDeleting ? "正在卸载..." : "确认卸载"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ModulePanel;
