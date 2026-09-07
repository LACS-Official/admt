import React, { useState, useEffect, useRef } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Field,
  Input,
  RadioGroup,
  Radio,
  Dropdown,
  Option,
  Checkbox,
  ProgressBar,
  Badge,
  Divider,
  Spinner,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Folder24Regular,
  ArrowSync24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ArrowDownload24Regular,
  Document24Regular,
  ChevronDown24Regular,
  ChevronUp24Regular,
} from "@fluentui/react-icons";
import { open } from "@tauri-apps/plugin-dialog";
import { DeviceInfo } from "../../types/device";
import {
  oneClickRootService,
  PatchEngineType,
  WorkflowProgressState,
} from "../../services/oneClickRootService";
import {
  isXiaomiDevice,
  extractXiaomiDeviceCode,
  extractXiaomiRomVersion,
  formatXiaomiVersionFriendly,
  queryXiaomiOfficialRom,
} from "../../services/xiaomiRomService";
import {
  ROOT_TOOL_VERSIONS,
  rootToolsService,
  ToolVersionInfo,
} from "../../services/rootToolsService";
import { deviceService } from "../../services/deviceService";
import { verifySecurityAction } from "../Common/SecurityVerificationDialog";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: tokens.spacingHorizontalM,
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  layoutBoth: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "14px",
    flex: 1,
    minHeight: 0,
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  layoutSingle: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
    minHeight: 0,
  },
  panelCard: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    padding: tokens.spacingHorizontalL,
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  collapsedBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      borderTopColor: "var(--colorBrandStroke1)",
      borderRightColor: "var(--colorBrandStroke1)",
      borderBottomColor: "var(--colorBrandStroke1)",
      borderLeftColor: "var(--colorBrandStroke1)",
    },
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceSummary: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke3)",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  summaryLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  summaryValue: {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--colorNeutralForeground1)",
    fontFamily: tokens.fontFamilyMonospace,
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  inputRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    alignItems: "flex-end",
  },
  stepContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  stepActive: {
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
  },
  terminalBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    padding: tokens.spacingHorizontalM,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: "11px",
    color: "var(--colorNeutralForeground1)",
    overflowY: "auto",
    minHeight: "180px",
    lineHeight: "1.6",
  },
  terminalLine: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  actionBar: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: tokens.spacingVerticalM,
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
});

interface OneClickRootPanelProps {
  device: DeviceInfo | null;
}

export const OneClickRootPanel: React.FC<OneClickRootPanelProps> = ({ device }) => {
  const styles = useStyles();

  // 选项状态
  const [sourceType, setSourceType] = useState<"auto_xiaomi" | "online_url" | "local_rom" | "local_image">("auto_xiaomi");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [localRomPath, setLocalRomPath] = useState("");
  const [localImagePath, setLocalImagePath] = useState("");
  const [patchType, setPatchType] = useState<PatchEngineType>("KernelSU");
  const [availableVersions, setAvailableVersions] = useState<ToolVersionInfo[]>(
    rootToolsService.getAvailableVersions(patchType)
  );
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    rootToolsService.getAvailableVersions(patchType)[0]?.id || "ksu_v3.3.0"
  );
  const [isFetchingVersions, setIsFetchingVersions] = useState<boolean>(false);
  const [useMirror, setUseMirror] = useState<boolean>(true);
  const [targetPartition, setTargetPartition] = useState<"auto" | "boot" | "init_boot">("auto");
  const [autoFlash, setAutoFlash] = useState(true);
  const [autoReboot, setAutoReboot] = useState(true);

  // 下载工具包状态
  const [isDownloadingTool, setIsDownloadingTool] = useState(false);
  const [toolDownloadStatus, setToolDownloadStatus] = useState("");

  // 运行状态
  const [isQueryingRom, setIsQueryingRom] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowProgressState>({
    currentStep: "idle",
    progressPercent: 0,
    statusMessage: "等待配置",
    logs: [],
  });

  // 设备 Root 状态与卡片折叠/展开联动状态
  const [isDeviceRooted, setIsDeviceRooted] = useState<boolean | null>(null);
  // 在未 root 时执行状态卡片折叠，参数配置展开
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(true);
  const [isStatusExpanded, setIsStatusExpanded] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const isXiaomi = isXiaomiDevice(device);
  const deviceCode = device ? extractXiaomiDeviceCode(device) : "";
  const romVersion = device ? extractXiaomiRomVersion(device) : "";
  const isUnlocked = String(device?.properties?.bootloaderLocked) === "false";

  // 检测设备当前是否已取得 Root
  useEffect(() => {
    if (!device?.serial) {
      setIsDeviceRooted(null);
      return;
    }

    deviceService
      .executeAdbCommand(device.serial, "shell", ["su", "-c", "id"])
      .then((res) => {
        const rooted = !!(res.success && res.output && res.output.includes("uid=0"));
        setIsDeviceRooted(rooted);

        // 未 root 时执行状态卡片折叠，参数配置卡片展开
        if (!rooted && !isExecuting && workflowState.currentStep === "idle") {
          setIsStatusExpanded(false);
          setIsConfigExpanded(true);
        }
      })
      .catch(() => {
        setIsDeviceRooted(false);
        if (!isExecuting && workflowState.currentStep === "idle") {
          setIsStatusExpanded(false);
          setIsConfigExpanded(true);
        }
      });
  }, [device?.serial]);

  // 当切换 patchType 时，更新默认选中的版本并拉取真实版本
  useEffect(() => {
    const versions = rootToolsService.getAvailableVersions(patchType);
    setAvailableVersions(versions);
    if (versions && versions.length > 0) {
      setSelectedVersionId(versions[0].id);
    }
    // 异步拉取最新真实发布信息
    rootToolsService.fetchRealToolVersions(patchType, false, useMirror).then((list) => {
      if (list && list.length > 0) {
        setAvailableVersions(list);
      }
    });
  }, [patchType, useMirror]);

  const currentToolVersion =
    availableVersions.find((v) => v.id === selectedVersionId) ||
    availableVersions[0];
  const isToolDownloaded = currentToolVersion
    ? rootToolsService.isToolDownloaded(currentToolVersion.id)
    : true;

  // 手动获取最新真实发布版本
  const handleFetchLatestVersions = async (force = true) => {
    setIsFetchingVersions(true);
    setToolDownloadStatus(`正在从官方源检索 ${patchType} 真实最新发布版本...`);
    try {
      const list = await rootToolsService.fetchRealToolVersions(patchType, force, useMirror);
      setAvailableVersions(list);
      if (list && list.length > 0) {
        setSelectedVersionId(list[0].id);
        setToolDownloadStatus(`成功获取到 ${list.length} 个 ${patchType} 官方发布版本`);
      }
    } catch (e: any) {
      setToolDownloadStatus(`检索最新版本失败: ${e.message || String(e)}`);
    } finally {
      setIsFetchingVersions(false);
    }
  };

  // 当连接小米设备时，自动探测固件直链
  useEffect(() => {
    if (device && isXiaomi && sourceType === "auto_xiaomi") {
      fetchOfficialXiaomiRom();
    }
  }, [device?.serial, sourceType]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [workflowState.logs]);

  const fetchOfficialXiaomiRom = async () => {
    if (!device) return;
    setIsQueryingRom(true);
    try {
      const romInfo = await queryXiaomiOfficialRom(device);
      if (romInfo.downloadUrl) {
        setOnlineUrl(romInfo.downloadUrl);
      }
    } catch (_e) {
      // 保持空输入供手动输入
    } finally {
      setIsQueryingRom(false);
    }
  };

  const handleSelectFile = async (target: "rom" | "image") => {
    const filters = target === "rom"
      ? [{ name: "固件包", extensions: ["zip", "bin"] }]
      : [{ name: "镜像文件", extensions: ["img"] }];

    const selected = await open({
      multiple: false,
      filters,
    });

    if (typeof selected === "string") {
      if (target === "rom") {
        setLocalRomPath(selected);
      } else {
        setLocalImagePath(selected);
      }
    }
  };

  const handleDownloadTool = async () => {
    if (!currentToolVersion) return;
    setIsDownloadingTool(true);
    setToolDownloadStatus("正在连接官方节点下载工具包...");
    try {
      const res = await rootToolsService.downloadTool(currentToolVersion, useMirror, (percent, status) => {
        setToolDownloadStatus(`[${percent}%] ${status}`);
      });
      if (!res.success) {
        setToolDownloadStatus(`下载异常: ${res.message}`);
      }
    } catch (e: any) {
      setToolDownloadStatus(`下载失败: ${e.message || String(e)}`);
    } finally {
      setIsDownloadingTool(false);
    }
  };

  // 一键开始执行 Root 流程
  const handleStartWorkflow = async () => {
    if (!device) return;

    // 执行时：展开执行状态卡片，并折叠参数配置卡片
    setIsStatusExpanded(true);
    setIsConfigExpanded(false);

    // 关键操作安全密码鉴权
    if (autoFlash) {
      const passed = await verifySecurityAction("rootFlash", "一键 Root 镜像修补与 Fastboot 烧录");
      if (!passed) {
        setWorkflowState((prev) => ({
          ...prev,
          logs: [
            ...prev.logs,
            `[${new Date().toLocaleTimeString()}] 操作已中断: 安全密码验证未通过或已取消。`,
          ],
        }));
        return;
      }
    }

    setIsExecuting(true);
    try {
      await oneClickRootService.executeWorkflow(
        {
          device,
          sourceType,
          onlineUrl: onlineUrl.trim(),
          localRomPath: localRomPath.trim(),
          localImagePath: localImagePath.trim(),
          patchType,
          targetPartition,
          autoFlash,
          autoReboot,
        },
        (state) => {
          setWorkflowState(state);
        }
      );
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsExecuting(false);
    }
  };

  // 决定当前整体布局结构
  const isBothExpanded = isConfigExpanded && isStatusExpanded;

  return (
    <div className={styles.container}>
      <div className={isBothExpanded ? styles.layoutBoth : styles.layoutSingle}>
        {/* 1. 参数配置卡片：展开态 vs 折叠态 */}
        {isConfigExpanded ? (
          <div className={styles.panelCard}>
            <div className={styles.cardTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>工作流参数配置</span>
                {device && (
                  <Badge appearance="tint" color={isUnlocked ? "success" : "warning"}>
                    {isUnlocked ? "BL 已解锁" : "BL 未解锁"}
                  </Badge>
                )}
                {isDeviceRooted && (
                  <Badge appearance="tint" color="brand">
                    设备已 Root (可重修补)
                  </Badge>
                )}
              </div>
              <Button
                size="small"
                appearance="subtle"
                icon={<ChevronUp24Regular />}
                onClick={() => setIsConfigExpanded(false)}
              >
                折叠配置
              </Button>
            </div>

            {/* 设备信息摘要卡片 */}
            <div className={styles.deviceSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>设备型号 / 代号</span>
                <span className={styles.summaryValue}>
                  {device?.properties?.marketName || device?.properties?.model || "未连接"} {deviceCode ? `(${deviceCode})` : ""}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>系统固件版本</span>
                <span className={styles.summaryValue}>
                  {isXiaomi ? formatXiaomiVersionFriendly(romVersion) : (romVersion || device?.properties?.systemVersion || "未知")}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Android / SDK 版本</span>
                <span className={styles.summaryValue}>
                  Android {device?.properties?.androidVersion || "-"} (API {device?.properties?.sdkVersion || "-"})
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>厂商识别</span>
                <span className={styles.summaryValue}>
                  {device?.properties?.brand || "-"} {isXiaomi ? "[小米生态]" : ""}
                </span>
              </div>
            </div>

            <Divider />

            {/* 固件来源配置 */}
            <div className={styles.formSection}>
              <Text weight="semibold" size={300}>1. 目标固件与镜像来源</Text>
              
              <RadioGroup
                value={sourceType}
                onChange={(_, data) => setSourceType(data.value as any)}
              >
                <Radio
                  value="auto_xiaomi"
                  label="自动检索小米官方 ROM 直链（通过 HTTP Range 流式提取）"
                  disabled={!isXiaomi}
                />
                <Radio
                  value="online_url"
                  label="自定义在线 ROM 下载直链（支持 payload.bin / Recovery 包）"
                />
                <Radio
                  value="local_rom"
                  label="从本地 ROM 压缩包或 payload.bin 提取"
                />
                <Radio
                  value="local_image"
                  label="直接选择本地已有的 boot.img / init_boot.img"
                />
              </RadioGroup>

              {sourceType === "auto_xiaomi" && (
                <div className={styles.inputRow}>
                  <Field
                    label="官方固件直链"
                    style={{ flex: 1 }}
                    validationMessage={isQueryingRom ? "正在检索官方源..." : undefined}
                  >
                    <Input
                      value={onlineUrl}
                      onChange={(_, d) => setOnlineUrl(d.value)}
                      placeholder="https://ultimate-ota.d.miui.com/..."
                    />
                  </Field>
                  <Button
                    icon={<ArrowSync24Regular />}
                    onClick={fetchOfficialXiaomiRom}
                    disabled={isQueryingRom || !device}
                  >
                    重新检索
                  </Button>
                </div>
              )}

              {sourceType === "online_url" && (
                <Field label="ROM 下载直链 (URL)">
                  <Input
                    value={onlineUrl}
                    onChange={(_, d) => setOnlineUrl(d.value)}
                    placeholder="https://..."
                  />
                </Field>
              )}

              {sourceType === "local_rom" && (
                <div className={styles.inputRow}>
                  <Field label="本地固件包路径" style={{ flex: 1 }}>
                    <Input
                      value={localRomPath}
                      onChange={(_, d) => setLocalRomPath(d.value)}
                      placeholder="选择 .zip 或 payload.bin 文件"
                    />
                  </Field>
                  <Button
                    icon={<Folder24Regular />}
                    onClick={() => handleSelectFile("rom")}
                  >
                    浏览
                  </Button>
                </div>
              )}

              {sourceType === "local_image" && (
                <div className={styles.inputRow}>
                  <Field label="本地镜像文件路径" style={{ flex: 1 }}>
                    <Input
                      value={localImagePath}
                      onChange={(_, d) => setLocalImagePath(d.value)}
                      placeholder="选择 boot.img 或 init_boot.img"
                    />
                  </Field>
                  <Button
                    icon={<Document24Regular />}
                    onClick={() => handleSelectFile("image")}
                  >
                    浏览
                  </Button>
                </div>
              )}
            </div>

            <Divider />

            {/* 修补与烧录策略 */}
            <div className={styles.formSection}>
              <Text weight="semibold" size={300}>2. 修补引擎与版本配置</Text>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.spacingHorizontalM }}>
                <Field label="Root 修补引擎">
                  <Dropdown
                    value={patchType}
                    selectedOptions={[patchType]}
                    onOptionSelect={(_, d) => setPatchType(d.optionValue as PatchEngineType)}
                  >
                    <Option value="KernelSU">KernelSU (官方 GKI)</Option>
                    <Option value="SukiSU Ultra">SukiSU Ultra (强化内核)</Option>
                    <Option value="Magisk">Magisk (通用 Ramdisk)</Option>
                    <Option value="APatch">APatch (KernelPatch)</Option>
                  </Dropdown>
                </Field>

                <Field label="目标刷入分区">
                  <Dropdown
                    value={targetPartition === "auto" ? "自动判断 (推荐)" : targetPartition}
                    selectedOptions={[targetPartition]}
                    onOptionSelect={(_, d) => setTargetPartition(d.optionValue as any)}
                  >
                    <Option value="auto">自动判断 (推荐)</Option>
                    <Option value="init_boot">init_boot (Android 13+)</Option>
                    <Option value="boot">boot (标准内核分区)</Option>
                  </Dropdown>
                </Field>
              </div>

              {/* 版本选择与下载 */}
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: tokens.spacingHorizontalM, alignItems: "flex-end" }}>
                <Field
                  label={
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span>引擎目标版本</span>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={isFetchingVersions ? <Spinner size="extra-tiny" /> : <ArrowSync24Regular />}
                        onClick={() => handleFetchLatestVersions(true)}
                        disabled={isFetchingVersions}
                        style={{ height: "22px", padding: "0 6px", fontSize: "11px" }}
                      >
                        {isFetchingVersions ? "获取中..." : "在线获取最新"}
                      </Button>
                    </div>
                  }
                  style={{ flex: 1 }}
                >
                  <Dropdown
                    value={currentToolVersion?.label}
                    selectedOptions={[selectedVersionId]}
                    onOptionSelect={(_, d) => setSelectedVersionId(d.optionValue as string)}
                  >
                    {availableVersions.map((item) => (
                      <Option key={item.id} value={item.id}>
                        {item.label}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>

                <div style={{ display: "flex", gap: tokens.spacingHorizontalS, alignItems: "center" }}>
                  <Button
                    icon={<ArrowDownload24Regular />}
                    size="medium"
                    disabled={isDownloadingTool}
                    onClick={handleDownloadTool}
                  >
                    {isDownloadingTool ? "下载中..." : isToolDownloaded ? "已下载 (点击重下)" : "下载工具文件"}
                  </Button>
                  <Badge appearance="tint" color={isToolDownloaded ? "success" : "warning"}>
                    {isToolDownloaded ? "已就绪" : "待下载"}
                  </Badge>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "2px" }}>
                <Text size={100} style={{ color: "var(--colorNeutralForeground3)", fontFamily: tokens.fontFamilyMonospace, flex: 1 }}>
                  {toolDownloadStatus || (currentToolVersion?.description || "")}
                </Text>
                <Checkbox
                  size="medium"
                  label="国内镜像加速"
                  checked={useMirror}
                  onChange={(_, d) => setUseMirror(!!d.checked)}
                />
              </div>

              <div style={{ display: "flex", gap: tokens.spacingHorizontalL, marginTop: tokens.spacingVerticalS }}>
                <Checkbox
                  checked={autoFlash}
                  onChange={(_, d) => setAutoFlash(!!d.checked)}
                  label="修补完成后自动重启至 Fastboot 烧录"
                />
                <Checkbox
                  checked={autoReboot}
                  onChange={(_, d) => setAutoReboot(!!d.checked)}
                  label="烧录后自动重启开机"
                  disabled={!autoFlash}
                />
              </div>
            </div>

            <div className={styles.actionBar}>
              <Button
                appearance="primary"
                icon={<Play24Regular />}
                size="medium"
                disabled={isExecuting || !device}
                onClick={handleStartWorkflow}
              >
                {isExecuting ? "流水线执行中..." : "一键开始执行 Root 流程"}
              </Button>
            </div>
          </div>
        ) : (
          /* 折叠态轻量摘要卡片 */
          <div className={styles.collapsedBar} onClick={() => setIsConfigExpanded(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <Text weight="semibold" size={300}>已选 Root 参数</Text>
              <Badge appearance="outline" color="brand">{patchType}</Badge>
              <Badge appearance="outline">{targetPartition === "auto" ? "自动判断分区" : targetPartition}</Badge>
              {autoFlash && <Badge appearance="tint" color="informative">自动烧录</Badge>}
              {autoReboot && <Badge appearance="tint" color="success">自动重启</Badge>}
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)", marginLeft: "4px" }}>
                来源: {sourceType === "auto_xiaomi" ? "小米官方源" : sourceType === "local_image" ? "本地镜像" : sourceType === "local_rom" ? "本地固件" : "在线链接"}
              </Text>
            </div>
            <Button
              size="small"
              appearance="subtle"
              icon={<ChevronDown24Regular />}
              onClick={(e) => {
                e.stopPropagation();
                setIsConfigExpanded(true);
              }}
            >
              展开配置
            </Button>
          </div>
        )}

        {/* 2. 流水线执行状态卡片：展开态 vs 折叠态 */}
        {isStatusExpanded ? (
          <div className={styles.panelCard}>
            <div className={styles.cardTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>流水线执行状态</span>
                <Badge
                  appearance="filled"
                  color={
                    workflowState.currentStep === "completed"
                      ? "success"
                      : workflowState.currentStep === "failed"
                      ? "danger"
                      : isExecuting
                      ? "brand"
                      : "informative"
                  }
                >
                  {workflowState.statusMessage}
                </Badge>
              </div>
              <Button
                size="small"
                appearance="subtle"
                icon={<ChevronUp24Regular />}
                onClick={() => setIsStatusExpanded(false)}
              >
                折叠状态
              </Button>
            </div>

            <ProgressBar value={workflowState.progressPercent / 100} />

            {/* 线性步骤状态 */}
            <div className={styles.stepContainer}>
              <div className={`${styles.stepItem} ${workflowState.currentStep === "check_device" ? styles.stepActive : ""}`}>
                <span>[步骤 1] 设备环境与 Bootloader 校验</span>
              </div>
              <div className={`${styles.stepItem} ${workflowState.currentStep === "acquire_image" ? styles.stepActive : ""}`}>
                <span>[步骤 2] 固件解析与分区镜像流式提取</span>
              </div>
              <div className={`${styles.stepItem} ${workflowState.currentStep === "patch_image" ? styles.stepActive : ""}`}>
                <span>[步骤 3] {patchType} 内核及 Ramdisk 修补</span>
              </div>
              <div className={`${styles.stepItem} ${["reboot_fastboot", "flash_fastboot"].includes(workflowState.currentStep) ? styles.stepActive : ""}`}>
                <span>[步骤 4] Fastboot 分区烧录</span>
              </div>
              <div className={`${styles.stepItem} ${workflowState.currentStep === "reboot_system" ? styles.stepActive : ""}`}>
                <span>[步骤 5] 重启进入系统</span>
              </div>
            </div>

            <Divider />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text weight="semibold" size={200}>控制台实时日志输出</Text>
              {workflowState.logs.length > 0 && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Dismiss24Regular />}
                  onClick={() => setWorkflowState(prev => ({ ...prev, logs: [] }))}
                >
                  清空
                </Button>
              )}
            </div>

            <div className={styles.terminalBox}>
              {workflowState.logs.length === 0 ? (
                <span style={{ color: "var(--colorNeutralForeground4)" }}>暂无任务日志。点击开始执行按钮自动启动流水线。</span>
              ) : (
                workflowState.logs.map((log, idx) => (
                  <div key={idx} className={styles.terminalLine}>{log}</div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        ) : (
          /* 未执行或未 Root 时折叠展示的状态条 */
          <div className={styles.collapsedBar} onClick={() => setIsStatusExpanded(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Text weight="semibold" size={300}>流水线执行状态</Text>
              <Badge appearance="tint" color={isExecuting ? "brand" : "subtle"}>
                {workflowState.statusMessage}
              </Badge>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                {isExecuting ? "流水线正在运行，点击展开查看实时日志" : "未执行时已折叠 · 点击下方【开始执行】将自动展开实时日志"}
              </Text>
            </div>
            <Button
              size="small"
              appearance="subtle"
              icon={<ChevronDown24Regular />}
              onClick={(e) => {
                e.stopPropagation();
                setIsStatusExpanded(true);
              }}
            >
              展开状态
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneClickRootPanel;
