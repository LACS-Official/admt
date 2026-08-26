import React, { useState, useEffect, useMemo, useCallback } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
  makeStyles,
  Text,
  Button,
  Input,
  Badge,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Checkbox,
  Tooltip,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  Search24Regular,
  ArrowReset24Regular,
  BrainCircuit24Regular,
  ArrowDownload24Regular,
  Delete24Regular,
  Warning24Regular,
  Play24Regular,
  Layer24Regular,
  Flash24Regular,
  ArrowSwap24Regular,
  Info24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Power24Regular,
  Dismiss24Regular,
  Wrench24Regular,
  Box24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import {
  FastbootPartitionItem,
  PartitionImageInspection,
} from "../../types/fastbootPartition";
import { fastbootPartitionService } from "../../services/fastbootPartitionService";
import { useDeviceStore } from "../../stores/deviceStore";
import { AIImageInspectorModal } from "./AIImageInspectorModal";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  topHeaderCard: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  },
  headerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  modeBanner: {
    padding: "10px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    border: "1px solid var(--colorPaletteYellowBorder1)",
    borderRadius: "8px",
    fontSize: "13px",
  },
  mainLayout: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1.15fr 1.05fr",
    gap: "12px",
    minHeight: 0,
    overflow: "hidden",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke2)",
    padding: "14px",
    minHeight: 0,
    overflow: "hidden",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke2)",
    padding: "14px",
    minHeight: 0,
    overflowY: "auto",
  },
  filterBar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  categoryChips: {
    display: "flex",
    gap: "6px",
    overflowX: "auto",
    paddingBottom: "4px",
  },
  categoryChip: {
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "14px",
    cursor: "pointer",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  categoryChipActive: {
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    borderColor: "var(--colorBrandStroke2)",
    fontWeight: 600,
  },
  selectionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke3)",
    fontSize: "12px",
  },
  partitionListContainer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingRight: "4px",
  },
  partitionRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke3)",
    transition: "all 0.15s ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      borderColor: "var(--colorBrandStroke2)",
    },
  },
  partitionRowActive: {
    backgroundColor: "var(--colorBrandBackground2)",
    borderColor: "var(--colorBrandStroke1)",
  },
  partitionRowChecked: {
    borderLeft: "3px solid var(--colorBrandForeground1)",
  },
  partitionMainInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  },
  partitionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  partitionActions: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  sectionCard: {
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    padding: "12px",
    border: "1px solid var(--colorNeutralStroke3)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  activePartitionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--colorNeutralStroke3)",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    fontSize: "13px",
  },
  filePickRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  batchChipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxHeight: "120px",
    overflowY: "auto",
    padding: "4px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke3)",
  },
  logBox: {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "11px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "6px",
    padding: "10px",
    border: "1px solid var(--colorNeutralStroke3)",
    maxHeight: "110px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    lineHeight: "1.4",
  },
});

interface FastbootPartitionManagerCardProps {
  device: DeviceInfo | null;
  onFastbootRequired?: () => void;
}

export const FastbootPartitionManagerCard: React.FC<
  FastbootPartitionManagerCardProps
> = ({ device, onFastbootRequired }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { refreshDevices } = useDeviceStore();

  const [isLoading, setIsLoading] = useState(false);
  const [partitions, setPartitions] = useState<FastbootPartitionItem[]>([]);
  const [currentSlot, setCurrentSlot] = useState<string | undefined>(undefined);
  const [isAbDevice, setIsAbDevice] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 多选与当前激活分区
  const [selectedPartitionNames, setSelectedPartitionNames] = useState<Set<string>>(new Set());
  const [activePartition, setActivePartition] = useState<FastbootPartitionItem | null>(null);
  const [copiedPartitionName, setCopiedPartitionName] = useState<string | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);

  // 待刷入镜像路径
  const [flashImagePath, setFlashImagePath] = useState<string>("");

  // 待解包/解析的镜像路径 (可自动关联提取的镜像或本地自选镜像)
  const [localInspectPath, setLocalInspectPath] = useState<string>("");
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isUnpacking, setIsUnpacking] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<PartitionImageInspection | null>(null);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);

  // 刷写选项
  const [targetSlot, setTargetSlot] = useState<string>("current");
  const [disableVerity, setDisableVerity] = useState<boolean>(false);
  const [disableVerification, setDisableVerification] = useState<boolean>(false);

  // 执行状态与日志
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string>("");
  const [eraseDialogOpen, setEraseDialogOpen] = useState<boolean>(false);
  const [partitionToErase, setPartitionToErase] = useState<FastbootPartitionItem | null>(null);
  const [batchEraseDialogOpen, setBatchEraseDialogOpen] = useState<boolean>(false);

  // 检查设备连接与模式
  const isFastbootMode = device?.mode === "fastboot" || device?.mode === "fastbootd";
  const isAdbMode = device?.mode === "sys" || device?.mode === "rec";
  const deviceSerial = device?.serial || "";
  const deviceDisplayName =
    device?.properties?.marketName ||
    device?.properties?.model ||
    device?.properties?.productName ||
    device?.properties?.deviceName ||
    deviceSerial ||
    "未连接设备";

  const appendLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setExecutionLogs((prev) => `${prev ? prev + "\n" : ""}[${time}] ${msg}`);
  }, []);

  // 加载分区列表
  const loadPartitions = useCallback(async () => {
    setIsLoading(true);
    appendLog(` 正在探测设备分区表 (Serial: ${deviceSerial || "默认设备"})...`);

    try {
      const res = await fastbootPartitionService.getFastbootPartitions(deviceSerial);
      setPartitions(res.partitions);
      setCurrentSlot(res.currentSlot);
      setIsAbDevice(res.isAbDevice);
      appendLog(` 成功获取 ${res.partitions.length} 个分区定义。`);

      if (res.partitions.length > 0) {
        setActivePartition((prev) => {
          if (prev && res.partitions.some((p) => p.name === prev.name)) {
            return res.partitions.find((p) => p.name === prev.name) || prev;
          }
          return res.partitions[0];
        });
      }
    } catch (e: any) {
      appendLog(` 获取分区列表失败: ${e?.message || e}`);
    } finally {
      setIsLoading(false);
    }
  }, [deviceSerial, appendLog]);

  useEffect(() => {
    loadPartitions();
  }, [device?.serial, device?.mode, loadPartitions]);

  // 当激活分区改变时，自动适配参数
  useEffect(() => {
    if (activePartition) {
      const name = activePartition.name.toLowerCase();
      if (name.includes("vbmeta")) {
        setDisableVerity(true);
        setDisableVerification(true);
      }
    }
  }, [activePartition?.name]);

  // 一键重启进入 Fastboot 模式
  const handleRebootToFastboot = async () => {
    if (!device?.serial) return;
    setIsRebooting(true);
    appendLog(` 正在发送重启指令进入 Bootloader / Fastboot 模式...`);
    try {
      await invoke("reboot_device", { serial: device.serial, mode: "bootloader" });
      appendLog(` 重启命令已下发，请稍候设备进入 Fastboot 模式并自动重连...`);
      setTimeout(() => {
        refreshDevices();
        setIsRebooting(false);
      }, 4000);
    } catch (e: any) {
      appendLog(` 重启失败: ${e?.message || e}`);
      setIsRebooting(false);
    }
  };

  // 切换单项多选勾选状态
  const togglePartitionSelection = (name: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPartitionNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // 全选/反选当前过滤出的分区
  const toggleSelectAllFiltered = () => {
    const allFilteredNames = filteredPartitions.map((p) => p.name);
    const isAllSelected = allFilteredNames.every((name) => selectedPartitionNames.has(name));

    setSelectedPartitionNames((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        allFilteredNames.forEach((n) => next.delete(n));
      } else {
        allFilteredNames.forEach((n) => next.add(n));
      }
      return next;
    });
  };

  // 选择刷入镜像文件
  const handleSelectFlashImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Android 镜像文件 (*.img;*.bin;*.raw)", extensions: ["img", "bin", "raw"] },
          { name: "所有文件 (*.*)", extensions: ["*"] },
        ],
      });
      if (selected && typeof selected === "string") {
        setFlashImagePath(selected);
        appendLog(` 已选择刷入镜像文件: ${selected} (目标分区: ${activePartition?.name || "未指定"})`);
      }
    } catch (e: any) {
      appendLog(` 选择文件失败: ${e?.message || e}`);
    }
  };

  // 获取目标分区镜像文件路径 (如果未选择本地镜像，则自动从设备提取或提示保存)
  const ensurePartitionImage = async (partName: string): Promise<string | null> => {
    if (localInspectPath) return localInspectPath;
    if (flashImagePath && flashImagePath.toLowerCase().includes(partName.toLowerCase())) {
      return flashImagePath;
    }

    if (!isFastbootMode) {
      appendLog(" 设备不在 Fastboot 模式，且未指定本地镜像文件");
      onFastbootRequired?.();
      return null;
    }

    try {
      appendLog(` 正在自动从设备提取 [${partName}] 分区镜像...`);
      const savePath = await save({
        defaultPath: `${partName}_extracted.img`,
        filters: [{ name: "镜像文件 (*.img)", extensions: ["img"] }],
        title: `保存提取出的 [${partName}] 分区镜像`,
      });

      if (!savePath) {
        appendLog(" 已取消提取");
        return null;
      }

      setIsExecuting(true);
      const res = await fastbootPartitionService.fetchPartition(deviceSerial, partName, savePath);
      setIsExecuting(false);

      if (res.success) {
        appendLog(` 分区 [${partName}] 提取成功: ${savePath}`);
        setLocalInspectPath(savePath);
        return savePath;
      } else {
        appendLog(` 分区提取失败: ${res.error || "未知错误"}`);
        return null;
      }
    } catch (e: any) {
      setIsExecuting(false);
      appendLog(` 提取异常: ${e?.message || e}`);
      return null;
    }
  };

  // 一键解包选中的分区 (独立按钮)
  const handleAutoUnpackSelected = async () => {
    if (!activePartition) return;
    const part = activePartition.name;
    setIsUnpacking(true);

    try {
      // 1. 确保已有分区镜像
      const imgPath = await ensurePartitionImage(part);
      if (!imgPath) {
        setIsUnpacking(false);
        return;
      }

      // 2. 选择解包输出目录
      const outputDir = await open({
        directory: true,
        multiple: false,
        title: `选择解包 [${part}] 产物保存目录`,
      });

      if (!outputDir || typeof outputDir !== "string") {
        setIsUnpacking(false);
        return;
      }

      const targetOut = `${outputDir}/${part}_unpacked`;
      appendLog(` 正在深度解包 [${part}] 镜像组件到: ${targetOut}...`);

      const res = await fastbootPartitionService.unpackPartitionImage(imgPath, targetOut);
      if (res.success) {
        appendLog(` 分区 [${part}] 解包成功！提取组件: ${res.extractedFiles?.join(", ") || "全部组件"}`);
        appendLog(` 解包产物目录: ${targetOut}`);
      } else {
        appendLog(` 解包失败: ${res.error || "未知错误"}`);
      }
    } catch (e: any) {
      appendLog(` 解包异常: ${e?.message || e}`);
    } finally {
      setIsUnpacking(false);
    }
  };

  // 一键解析选中的分区 (独立按钮)
  const handleAutoInspectSelected = async () => {
    if (!activePartition) return;
    const part = activePartition.name;
    setIsInspecting(true);

    try {
      // 1. 确保已有分区镜像
      const imgPath = await ensurePartitionImage(part);
      if (!imgPath) {
        setIsInspecting(false);
        return;
      }

      appendLog(` 正在对分区 [${part}] 镜像进行深度二进制逆向分析与指纹提取...`);
      const result = await fastbootPartitionService.inspectPartitionImage(imgPath);
      setInspectionResult(result);
      setShowAIModal(true);
      appendLog(
        ` 解析完成: 识别为 ${result.imageType} (OS: ${result.osVersion || "未知"}), Patch: ${result.osPatchLevel || "未知"
        }`
      );
    } catch (e: any) {
      appendLog(` 解析镜像失败: ${e?.message || e}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // 刷入当前激活分区
  const handleFlashActive = async () => {
    if (!device?.serial && !isFastbootMode) {
      appendLog(" 设备未连接或不在 Fastboot 模式");
      onFastbootRequired?.();
      return;
    }
    if (!flashImagePath) {
      appendLog(" 请先选择要刷入的镜像文件 (*.img)");
      return;
    }
    const part = activePartition?.name;
    if (!part) {
      appendLog(" 请先选择目标分区");
      return;
    }

    setIsExecuting(true);
    appendLog(` 开始向分区 [${part}] 刷入镜像: ${flashImagePath}...`);

    try {
      const slotParam = targetSlot === "current" ? undefined : targetSlot;
      const res = await fastbootPartitionService.flashPartition(
        deviceSerial,
        part,
        flashImagePath,
        slotParam,
        disableVerity,
        disableVerification
      );

      if (res.success) {
        appendLog(` 分区 [${part}] 刷入成功！`);
        if (res.output) appendLog(res.output);
      } else {
        appendLog(` 刷入失败: ${res.error || "未知错误"}`);
        if (res.output) appendLog(res.output);
      }
    } catch (e: any) {
      appendLog(` 刷入过程发生异常: ${e?.message || e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 单纯从设备提取备份单个分区 (fastboot fetch)
  const handleFetchSingle = async (partItem: FastbootPartitionItem) => {
    if (!isFastbootMode) {
      onFastbootRequired?.();
      return;
    }

    try {
      const savePath = await save({
        defaultPath: `${partItem.name}_backup.img`,
        filters: [{ name: "镜像文件 (*.img)", extensions: ["img"] }],
      });

      if (!savePath) return;

      setIsExecuting(true);
      appendLog(` 正在从设备提取分区 [${partItem.name}] 到: ${savePath}...`);

      const res = await fastbootPartitionService.fetchPartition(
        deviceSerial,
        partItem.name,
        savePath
      );

      if (res.success) {
        appendLog(` 分区 [${partItem.name}] 提取成功并已保存！`);
        setLocalInspectPath(savePath);
      } else {
        appendLog(` 分区提取失败: ${res.error || "未知错误"}`);
      }
    } catch (e: any) {
      appendLog(` 提取异常: ${e?.message || e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 批量备份勾选的分区
  const handleBatchFetch = async () => {
    if (selectedPartitionNames.size === 0 || !isFastbootMode) {
      onFastbootRequired?.();
      return;
    }

    try {
      const selectedDir = await open({
        directory: true,
        multiple: false,
        title: "选择批量提取保存目录",
      });

      if (!selectedDir || typeof selectedDir !== "string") return;

      setIsExecuting(true);
      const list = Array.from(selectedPartitionNames);
      appendLog(` 开始批量提取 ${list.length} 个分区到目录: ${selectedDir}...`);

      let successCount = 0;
      for (const name of list) {
        const outPath = `${selectedDir}/${name}.img`;
        appendLog(`⏳ [${successCount + 1}/${list.length}] 正在提取 ${name}...`);
        const res = await fastbootPartitionService.fetchPartition(deviceSerial, name, outPath);
        if (res.success) {
          successCount++;
          appendLog(` ${name} 提取成功`);
        } else {
          appendLog(` ${name} 提取失败: ${res.error || "未知错误"}`);
        }
      }

      appendLog(` 批量提取完成: 成功 ${successCount} 个，失败 ${list.length - successCount} 个。`);
    } catch (e: any) {
      appendLog(` 批量提取异常: ${e?.message || e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 批量擦除确认
  const handleBatchEraseConfirm = async () => {
    setBatchEraseDialogOpen(false);
    if (selectedPartitionNames.size === 0) return;

    setIsExecuting(true);
    const list = Array.from(selectedPartitionNames);
    appendLog(` 开始批量擦除 ${list.length} 个分区...`);

    let successCount = 0;
    for (const name of list) {
      appendLog(`⏳ 正在擦除 ${name}...`);
      const res = await fastbootPartitionService.erasePartition(deviceSerial, name);
      if (res.success) {
        successCount++;
        appendLog(` 分区 ${name} 擦除成功`);
      } else {
        appendLog(` 分区 ${name} 擦除失败: ${res.error || "未知错误"}`);
      }
    }

    appendLog(` 批量擦除完成: 成功 ${successCount} 个，失败 ${list.length - successCount} 个。`);
    setIsExecuting(false);
  };

  // 单个擦除确认
  const handleEraseConfirm = async () => {
    if (!partitionToErase) return;
    setEraseDialogOpen(false);
    setIsExecuting(true);
    appendLog(` 正在擦除分区 [${partitionToErase.name}]...`);

    try {
      const res = await fastbootPartitionService.erasePartition(
        deviceSerial,
        partitionToErase.name
      );
      if (res.success) {
        appendLog(` 分区 [${partitionToErase.name}] 擦除成功！`);
      } else {
        appendLog(` 擦除失败: ${res.error || "未知错误"}`);
      }
    } catch (e: any) {
      appendLog(` 擦除异常: ${e?.message || e}`);
    } finally {
      setIsExecuting(false);
      setPartitionToErase(null);
    }
  };

  // 切换 A/B 槽位
  const handleSwitchSlot = async (slot: string) => {
    setIsExecuting(true);
    appendLog(` 正在将活动槽位切换为 Slot ${slot.toUpperCase()}...`);
    try {
      const res = await fastbootPartitionService.switchActiveSlot(deviceSerial, slot);
      if (res.success) {
        appendLog(` 成功切换活动槽位为 Slot ${slot.toUpperCase()}！`);
        await loadPartitions();
      } else {
        appendLog(` 槽位切换失败: ${res.error || res.output}`);
      }
    } catch (e: any) {
      appendLog(` 切换异常: ${e?.message || e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 复制分区名称
  const handleCopyPartitionName = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopiedPartitionName(name);
    setTimeout(() => setCopiedPartitionName(null), 1500);
  };

  // 过滤分区
  const filteredPartitions = useMemo(() => {
    return partitions.filter((p) => {
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (selectedCategory === "all") return true;
      return p.category === selectedCategory;
    });
  }, [partitions, searchQuery, selectedCategory]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredPartitions.length === 0) return false;
    return filteredPartitions.every((p) => selectedPartitionNames.has(p.name));
  }, [filteredPartitions, selectedPartitionNames]);

  return (
    <div className={styles.container}>

      {/* 当设备在系统模式时显示一键引导 Banner */}
      {isAdbMode && (
        <div className={styles.modeBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Warning24Regular style={{ color: "var(--colorPaletteYellowForeground1)" }} />
            <span>
              检测到当前设备处于<strong>开机系统 (ADB) 模式</strong>。如需执行 Fastboot 分区读写，请一键重启进入引导模式。
            </span>
          </div>
          <Button
            size="small"
            appearance="primary"
            icon={<Power24Regular />}
            onClick={handleRebootToFastboot}
            disabled={isRebooting}
          >
            {isRebooting ? "正在重启中..." : "一键重启至 Fastboot 模式"}
          </Button>
        </div>
      )}

      {/* 主工作区 */}
      <div className={styles.mainLayout}>
        {/* 左侧：分区列表区 (内置多选框) */}
        <div className={styles.leftPanel}>
          {/* 搜索与分类栏 */}
          <div className={styles.filterBar}>
            <Input
              style={{ flex: 1 }}
              placeholder="搜索分区 (如 boot, vbmeta, super, modem...)"
              contentBefore={<Search24Regular />}
              value={searchQuery}
              onChange={(_, d) => setSearchQuery(d.value)}
            />
          </div>

          <div className={styles.categoryChips}>
            {[
              { id: "all", label: "全部" },
              { id: "boot", label: "启动引导 (Boot)" },
              { id: "system", label: "系统数据 (System)" },
              { id: "security", label: "安全与AVB (Security)" },
              { id: "communication", label: "通信基带 (Modem)" },
              { id: "hardware", label: "芯片底层 (Hardware)" },
              { id: "debug", label: "调试日志 (Debug)" },
              { id: "recovery", label: "备份恢复 (Recovery)" },
              { id: "other", label: "其他分区" },
            ].map((cat) => (
              <div
                key={cat.id}
                className={`${styles.categoryChip} ${selectedCategory === cat.id ? styles.categoryChipActive : ""
                  }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </div>
            ))}
          </div>

          {/* 多选控制与统计栏 */}
          <div className={styles.selectionBar}>
            <Checkbox
              checked={isAllFilteredSelected ? true : selectedPartitionNames.size > 0 ? "mixed" : false}
              onChange={toggleSelectAllFiltered}
              label={`全选当前分类 (${filteredPartitions.length})`}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Badge appearance="filled" color={selectedPartitionNames.size > 0 ? "brand" : "informative"}>
                已勾选 {selectedPartitionNames.size} 项
              </Badge>
              {selectedPartitionNames.size > 0 && (
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  onClick={() => setSelectedPartitionNames(new Set())}
                >
                  清空
                </Button>
              )}
            </div>
          </div>

          {/* 分区列表 */}
          <div className={styles.partitionListContainer}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Spinner label="正在获取设备分区列表..." />
              </div>
            ) : filteredPartitions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "var(--colorNeutralForeground3)",
                }}
              >
                未找到匹配的分区
              </div>
            ) : (
              filteredPartitions.map((p) => {
                const isActive = activePartition?.name === p.name;
                const isChecked = selectedPartitionNames.has(p.name);
                const isCopied = copiedPartitionName === p.name;

                return (
                  <div
                    key={p.name}
                    className={`${styles.partitionRow} ${isActive ? styles.partitionRowActive : ""
                      } ${isChecked ? styles.partitionRowChecked : ""}`}
                    onClick={() => {
                      setActivePartition(p);
                      if (selectedPartitionNames.size === 0) {
                        setSelectedPartitionNames(new Set([p.name]));
                      }
                    }}
                  >
                    {/* 多选框 */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => togglePartitionSelection(p.name)}
                      />
                    </div>

                    <div className={styles.partitionMainInfo}>
                      <div className={styles.partitionTitleRow}>
                        <Text weight="semibold" size={300}>
                          {p.name}
                        </Text>
                        {p.slot && (
                          <Badge appearance="outline" size="small">
                            Slot {p.slot.toUpperCase()}
                          </Badge>
                        )}
                        {p.sizeFormatted && (
                          <Badge appearance="tint" size="small">
                            {p.sizeFormatted}
                          </Badge>
                        )}
                        {p.isCritical && (
                          <Badge color="warning" appearance="tint" size="small">
                            关键
                          </Badge>
                        )}
                      </div>
                      <Text
                        size={100}
                        style={{ color: "var(--colorNeutralForeground3)", marginTop: "2px" }}
                      >
                        {p.description}
                      </Text>
                    </div>

                    <div className={styles.partitionActions} onClick={(e) => e.stopPropagation()}>
                      <Tooltip content="复制分区名称" relationship="label">
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={isCopied ? <Checkmark24Regular /> : <Copy24Regular />}
                          onClick={(e) => handleCopyPartitionName(p.name, e)}
                        />
                      </Tooltip>
                      <Tooltip content="从设备提取备份该分区 (Fetch)" relationship="label">
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<ArrowDownload24Regular />}
                          onClick={() => handleFetchSingle(p)}
                          disabled={isExecuting || !isFastbootMode}
                        />
                      </Tooltip>
                      <Tooltip content="擦除该分区数据 (危险)" relationship="label">
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Delete24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />}
                          onClick={() => {
                            setPartitionToErase(p);
                            setEraseDialogOpen(true);
                          }}
                          disabled={isExecuting || !isFastbootMode}
                        />
                      </Tooltip>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧：功能操作区 */}
        <div className={styles.rightPanel}>
          {/* 模式 A：多选批量操作模式 */}
          {selectedPartitionNames.size > 1 ? (
            <div className={styles.sectionCard}>
              <div className={styles.activePartitionHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Wrench24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <div>
                    <Text weight="bold" size={300}>
                      批量提取与维护
                    </Text>
                    <Text size={100} style={{ color: "var(--colorNeutralForeground3)", display: "block" }}>
                      已勾选 {selectedPartitionNames.size} 个分区
                    </Text>
                  </div>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  onClick={() => {
                    if (activePartition) {
                      setSelectedPartitionNames(new Set([activePartition.name]));
                    }
                  }}
                >
                  切回单分区
                </Button>
              </div>

              {/* 已选分区标签列表 */}
              <div className={styles.batchChipsContainer}>
                {Array.from(selectedPartitionNames).map((name) => (
                  <Badge
                    key={name}
                    appearance="tint"
                    color="brand"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      const found = partitions.find((p) => p.name === name);
                      if (found) setActivePartition(found);
                    }}
                  >
                    {name}
                  </Badge>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                <Button
                  appearance="primary"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleBatchFetch}
                  disabled={isExecuting || !isFastbootMode}
                >
                  批量提取备份勾选的 {selectedPartitionNames.size} 个分区到文件夹
                </Button>

                <Button
                  appearance="secondary"
                  icon={<Delete24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />}
                  onClick={() => setBatchEraseDialogOpen(true)}
                  disabled={isExecuting || !isFastbootMode}
                >
                  批量擦除勾选的 {selectedPartitionNames.size} 个分区
                </Button>
              </div>
            </div>
          ) : (
            /* 模式 B：单分区精细操作 (解包与解析独立两按钮自动操作) */
            <>
              {/* 模块 1：分区提取、解包与维护 */}
              <div className={styles.sectionCard}>
                <div className={styles.activePartitionHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Wrench24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                    <div>
                      <Text weight="bold" size={300}>
                        分区提取与维护: [{activePartition?.name || "未选择"}]
                      </Text>
                      <Text size={100} style={{ color: "var(--colorNeutralForeground3)", display: "block" }}>
                        {activePartition?.description || "点击左侧分区列表即可直接绑定"}
                      </Text>
                    </div>
                  </div>
                  {activePartition?.sizeFormatted && (
                    <Badge color="informative" appearance="tint">
                      {activePartition.sizeFormatted}
                    </Badge>
                  )}
                </div>

                {/* 核心功能按钮区：解包与解析独立双按钮 */}
                <div className={styles.actionGrid}>
                  <Tooltip content="自动提取并深度解包 Kernel/Ramdisk/DTB 组件" relationship="label">
                    <Button
                      appearance="primary"
                      icon={<Box24Regular />}
                      onClick={handleAutoUnpackSelected}
                      disabled={isUnpacking || isExecuting || !activePartition}
                    >
                      {isUnpacking ? "正在解包中..." : `一键解包 [${activePartition?.name || "此分区"}]`}
                    </Button>
                  </Tooltip>

                  <Tooltip content="自动提取并逆向解析 OS/Root补丁/AVB签名" relationship="label">
                    <Button
                      appearance="primary"
                      icon={<BrainCircuit24Regular />}
                      onClick={handleAutoInspectSelected}
                      disabled={isInspecting || isExecuting || !activePartition}
                    >
                      {isInspecting ? "正在解析中..." : `一键解析 [${activePartition?.name || "此分区"}]`}
                    </Button>
                  </Tooltip>
                </div>

                {/* 辅助维护与擦除按钮 */}
                <div className={styles.actionGrid}>
                  <Button
                    appearance="secondary"
                    icon={<ArrowDownload24Regular />}
                    onClick={() => activePartition && handleFetchSingle(activePartition)}
                    disabled={isExecuting || !isFastbootMode || !activePartition}
                  >
                    提取备份到文件 (Fetch)
                  </Button>
                  <Button
                    appearance="secondary"
                    icon={<Delete24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />}
                    onClick={() => {
                      if (activePartition) {
                        setPartitionToErase(activePartition);
                        setEraseDialogOpen(true);
                      }
                    }}
                    disabled={isExecuting || !isFastbootMode || !activePartition}
                  >
                    擦除此分区 (Erase)
                  </Button>
                </div>

                {/* 可选：本地自选镜像路径覆盖 */}
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                  <Input
                    size="small"
                    style={{ flex: 1 }}
                    placeholder="可选：使用本地镜像覆盖自动提取..."
                    value={localInspectPath}
                    onChange={(_, d) => setLocalInspectPath(d.value)}
                  />
                  <Button
                    size="small"
                    appearance="subtle"
                    onClick={async () => {
                      const res = await open({
                        multiple: false,
                        filters: [{ name: "镜像文件 (*.img;*.bin)", extensions: ["img", "bin", "raw"] }],
                      });
                      if (res && typeof res === "string") setLocalInspectPath(res);
                    }}
                  >
                    自选镜像
                  </Button>
                </div>
              </div>

              {/* 模块 2：镜像刷入 */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                  <Flash24Regular />
                  <span>刷入镜像到 [{activePartition?.name || "当前分区"}]</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className={styles.filePickRow}>
                    <Input
                      style={{ flex: 1 }}
                      placeholder={`请选择要刷入到 [${activePartition?.name || "此分区"}] 的镜像文件...`}
                      value={flashImagePath}
                      onChange={(_, d) => setFlashImagePath(d.value)}
                    />
                    <Button appearance="secondary" onClick={handleSelectFlashImage}>
                      浏览...
                    </Button>
                  </div>

                  {isAbDevice && (
                    <div>
                      <Text size={200} style={{ display: "block", marginBottom: "4px" }}>
                        目标 Slot 槽位
                      </Text>
                      <Dropdown
                        value={
                          targetSlot === "current"
                            ? "当前活动槽位"
                            : targetSlot === "a"
                              ? "Slot A"
                              : "Slot B"
                        }
                        onOptionSelect={(_, d) => setTargetSlot(d.optionValue as string)}
                      >
                        <Option value="current">当前活动槽位</Option>
                        <Option value="a">Slot A</Option>
                        <Option value="b">Slot B</Option>
                      </Dropdown>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Checkbox
                      checked={disableVerity}
                      onChange={(_, d) => setDisableVerity(!!d.checked)}
                      label="禁用 DM-Verity 校验 (--disable-verity)"
                    />
                    <Checkbox
                      checked={disableVerification}
                      onChange={(_, d) => setDisableVerification(!!d.checked)}
                      label="禁用 AVB 签名验证 (--disable-verification)"
                    />
                  </div>

                  <Button
                    appearance="primary"
                    icon={<Play24Regular />}
                    size="large"
                    onClick={handleFlashActive}
                    disabled={isExecuting || !flashImagePath || !activePartition?.name}
                    style={{ marginTop: "4px" }}
                  >
                    {isExecuting
                      ? "正在刷入中..."
                      : `立即刷入镜像到 [${activePartition?.name || "未指定"}] 分区`}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* 终端执行日志 */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <Info24Regular />
              <span>操作执行日志</span>
            </div>
            <div className={styles.logBox}>
              {executionLogs || "等待执行指令..."}
            </div>
          </div>
        </div>
      </div>

      {/* 深度解包弹窗 */}
      <AIImageInspectorModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        inspection={inspectionResult}
        onFlashToPartition={(part) => {
          const found = partitions.find((p) => p.name === part);
          if (found) setActivePartition(found);
          appendLog(` 已自动为您将目标刷写分区锁定为 [${part}]`);
        }}
      />

      {/* 单分区擦除危险二次确认对话框 */}
      <Dialog open={eraseDialogOpen} onOpenChange={(_, d) => setEraseDialogOpen(d.open)}>
        <DialogSurface>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--colorPaletteRedForeground1)" }}>
              <Warning24Regular />
              <span>高危操作：确认擦除分区？</span>
            </div>
          </DialogTitle>
          <DialogBody>
            <Text size={300}>
              您即将擦除分区 <strong>[{partitionToErase?.name}]</strong>。
              <br />
              <br />
              擦除关键系统分区可能导致设备无法开机甚至变砖，请确保您清楚此操作的后果！
            </Text>
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setEraseDialogOpen(false)}>
              取消
            </Button>
            <Button
              appearance="primary"
              style={{ backgroundColor: "var(--colorPaletteRedBackground1)", color: "white" }}
              onClick={handleEraseConfirm}
            >
              确认擦除
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* 批量擦除危险二次确认对话框 */}
      <Dialog open={batchEraseDialogOpen} onOpenChange={(_, d) => setBatchEraseDialogOpen(d.open)}>
        <DialogSurface>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--colorPaletteRedForeground1)" }}>
              <Warning24Regular />
              <span>高危操作：批量擦除多个分区？</span>
            </div>
          </DialogTitle>
          <DialogBody>
            <Text size={300}>
              您即将批量擦除以下 <strong>{selectedPartitionNames.size}</strong> 个分区：
              <br />
              <br />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "8px 0" }}>
                {Array.from(selectedPartitionNames).map((n) => (
                  <Badge key={n} color="danger" appearance="tint">
                    {n}
                  </Badge>
                ))}
              </div>
              此操作不可逆，请务必确认已做好完整备份！
            </Text>
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setBatchEraseDialogOpen(false)}>
              取消
            </Button>
            <Button
              appearance="primary"
              style={{ backgroundColor: "var(--colorPaletteRedBackground1)", color: "white" }}
              onClick={handleBatchEraseConfirm}
            >
              确认批量擦除
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
