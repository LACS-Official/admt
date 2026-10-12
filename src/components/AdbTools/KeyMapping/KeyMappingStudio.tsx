import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Dropdown,
  Option,
  Switch,
  Slider,
  Field,
  Input,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  TabList,
  Tab,
  Badge,
  Spinner,
  Textarea,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Delete24Regular,
  Edit24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular,
  Play24Regular,
  Stop24Regular,
  Keyboard24Regular,
  CursorClick24Regular,
  Flash24Regular,
  Navigation24Regular,
  SwipeRight24Regular,
  Phone24Regular,
  PhoneLaptop24Regular,
  ArrowSync24Regular,
  Eye24Regular,
  EyeOff24Regular,
  ShareScreenPerson24Regular,
  Copy24Regular,
} from "@fluentui/react-icons";
import {
  KeyActionType,
  KeyMappingItem,
  InjectionMode,
} from "../../../types/keyMapping";
import { useKeyMappingStore } from "../../../stores/keyMappingStore";
import { useAppStore } from "../../../stores/appStore";
import { useDeviceStore } from "../../../stores/deviceStore";
import { DeviceInfo } from "../../../types/device";
import KeyMappingService from "../../../services/keyMappingService";
import ScreenMirrorService from "../../../services/screenMirrorService";
import { DEFAULT_SCREEN_MIRROR_CONFIG } from "../../../types/screenMirror";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("14px"),
    height: "100%",
    minHeight: 0,
    ...shorthands.overflow("hidden"),
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("10px", "16px"),
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("14px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    flexWrap: "wrap",
    ...shorthands.gap("12px"),
  },
  topBarGroup: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
    flexWrap: "wrap",
  },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "330px 1fr",
    ...shorthands.gap("14px"),
    flex: 1,
    minHeight: 0,
    ...shorthands.overflow("hidden"),
  },
  leftCard: {
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("14px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
    ...shorthands.overflow("hidden"),
  },
  rightCard: {
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("14px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("14px", "16px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.overflow("hidden"),
    position: "relative",
    gap: "10px",
  },
  canvasControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    ...shorthands.padding("4px", "8px"),
    flexWrap: "wrap",
    gap: "8px",
  },
  canvasControlsGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("6px"),
  },
  itemList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    paddingRight: "4px",
  },
  itemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("8px", "12px"),
    ...shorthands.borderRadius("10px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    backgroundColor: "var(--colorNeutralBackground1)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      ...shorthands.borderColor("var(--colorNeutralStroke1Hover)"),
    },
  },
  itemRowSelected: {
    ...shorthands.borderColor("var(--colorBrandStroke1)"),
    backgroundColor: "rgba(0, 113, 227, 0.08)",
  },
  itemBadgeWrap: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    minWidth: 0,
  },
  keyBadge: {
    minWidth: "32px",
    height: "26px",
    ...shorthands.padding("0px", "8px"),
    ...shorthands.borderRadius("6px"),
    backgroundColor: "var(--colorNeutralBackground4)",
    color: "var(--colorNeutralForeground1)",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke1)"),
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    fontFamily:
      'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace',
  },
  itemDetails: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("2px"),
    minWidth: 0,
  },
  itemCoords: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("4px"),
  },
  screenContainer: {
    position: "relative",
    backgroundColor: "#000000",
    ...shorthands.borderRadius("18px"),
    ...shorthands.border("2px", "solid", "rgba(255, 255, 255, 0.12)"),
    boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
    ...shorthands.overflow("hidden"),
    userSelect: "none",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    flexShrink: 0,
  },
  liveStreamImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "fill",
    userSelect: "none",
    pointerEvents: "none",
    display: "block",
  },
  liveSyncPulse: {
    width: "8px",
    height: "8px",
    ...shorthands.borderRadius("9999px"),
    backgroundColor: "#30d158",
    boxShadow: "0 0 8px #30d158",
    display: "inline-block",
  },
  canvasElement: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    cursor: "grab",
    zIndex: 10,
    transition: "box-shadow 0.15s ease",
    "&:active": {
      cursor: "grabbing",
    },
  },
  canvasKeyNode: {
    width: "38px",
    height: "38px",
    ...shorthands.borderRadius("9999px"),
    backgroundColor: "rgba(20, 20, 22, 0.85)",
    backdropFilter: "blur(10px)",
    ...shorthands.border("1.5px", "solid", "rgba(255, 255, 255, 0.45)"),
    boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    fontFamily:
      'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace',
  },
  canvasKeyNodeSelected: {
    ...shorthands.borderColor("#2997ff"),
    boxShadow: "0 0 0 2px rgba(41, 151, 255, 0.5), 0 4px 18px rgba(0,0,0,0.6)",
    backgroundColor: "rgba(41, 151, 255, 0.35)",
  },
  canvasBurstTag: {
    position: "absolute",
    bottom: "-6px",
    right: "-6px",
    ...shorthands.padding("1px", "4px"),
    ...shorthands.borderRadius("9999px"),
    backgroundColor: "#e03e3e",
    color: "#ffffff",
    fontSize: "9px",
    fontWeight: "bold",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  },
  canvasJoystickRing: {
    position: "absolute",
    ...shorthands.borderRadius("9999px"),
    ...shorthands.border("2px", "dashed", "rgba(41, 151, 255, 0.7)"),
    backgroundColor: "rgba(41, 151, 255, 0.12)",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  keyRecordBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "56px",
    ...shorthands.borderRadius("10px"),
    ...shorthands.border("2px", "dashed", "var(--colorBrandStroke1)"),
    backgroundColor: "rgba(0, 113, 227, 0.06)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorBrandForeground1)",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "rgba(0, 113, 227, 0.12)",
    },
  },
});

interface KeyMappingStudioProps {
  device: DeviceInfo | null;
}

export const KeyMappingStudio: React.FC<KeyMappingStudioProps> = ({ device: propDevice }) => {
  const styles = useStyles();
  const { setStatusBarMessage } = useAppStore();
  const { devices, selectedDevice: storeSelectedDevice } = useDeviceStore();

  const currentDevice =
    propDevice ||
    storeSelectedDevice ||
    devices.find((d) => d.connected) ||
    null;

  const {
    profiles,
    activeProfileId,
    isRunning,
    injectionMode,
    activeWindowOnly,
    orientation,
    selectedItemId,
    loadProfiles,
    selectProfile,
    createProfile,
    deleteProfile,
    duplicateProfile,
    importProfile,
    exportProfile,
    addItem,
    updateItem,
    deleteItem,
    setOrientation,
    setInjectionMode,
    setActiveWindowOnly,
    setSelectedItemId,
    startMapping,
    stopMapping,
  } = useKeyMappingStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [isNewProfileOpen, setIsNewProfileOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KeyMappingItem | null>(null);
  const [isRecordingKey, setIsRecordingKey] = useState(false);

  // 真实投屏相关状态
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [studioMode, setStudioMode] = useState<"edit" | "control">("edit");
  const [showKeys, setShowKeys] = useState(true);
  const [keyOpacity, setKeyOpacity] = useState(0.85);
  const [deviceAspect, setDeviceAspect] = useState<number>(16 / 9);

  const screenRef = useRef<HTMLDivElement>(null);
  const draggingItemRef = useRef<string | null>(null);
  const isFetchingFrameRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // 初始化加载预设列表
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // 按键映射处于 Beta 阶段的状态栏轻量提示（退出时自动清理）
  useEffect(() => {
    setStatusBarMessage({
      type: "info",
      message: "按键映射当前为 Beta 测试功能，建议配合独立投屏窗口使用",
      duration: 0,
      source: "tools:key-mapping",
    });

    return () => {
      useAppStore.getState().clearStatusBarMessage("tools:key-mapping");
    };
  }, [setStatusBarMessage]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const selectedItem = activeProfile?.items.find((i) => i.id === selectedItemId);

  // 单帧截取并更新真实画面
  const captureFrame = useCallback(async () => {
    if (!currentDevice?.serial || isFetchingFrameRef.current) return;
    isFetchingFrameRef.current = true;
    setIsCapturing(true);
    try {
      const dataUrl = await KeyMappingService.captureDeviceScreen(currentDevice.serial);
      if (dataUrl) {
        setScreenImage(dataUrl);
      }
    } catch (err) {
      console.warn("Capture screen frame warning:", err);
    } finally {
      isFetchingFrameRef.current = false;
      setIsCapturing(false);
    }
  }, [currentDevice?.serial]);

  // 首次挂载立即拉取真实设备画面
  useEffect(() => {
    if (currentDevice?.serial) {
      captureFrame();
    }
  }, [currentDevice?.serial, captureFrame]);

  // 真实画面轮询同步计时器 (当开启 isLiveSyncing 时持续同步)
  useEffect(() => {
    if (!currentDevice?.serial || !isLiveSyncing) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      if (isMounted && !isFetchingFrameRef.current) {
        await captureFrame();
      }
    }, 450);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentDevice?.serial, isLiveSyncing, captureFrame]);

  // 运行/停止按键映射
  const handleToggleRunning = async () => {
    if (isRunning) {
      await stopMapping();
      setStatusBarMessage({
        type: "info",
        message: "按键映射已停止",
        duration: 2500,
      });
    } else {
      if (!currentDevice?.serial) {
        setStatusBarMessage({
          type: "warning",
          message: "未检测到已连接的设备，请在左侧选择目标设备",
          duration: 3000,
        });
        return;
      }
      try {
        await startMapping(currentDevice.serial);
        setStatusBarMessage({
          type: "success",
          message: `按键映射已启动 [${activeProfile?.name || "当前配置"}]`,
          duration: 3000,
        });
      } catch (err: any) {
        setStatusBarMessage({
          type: "error",
          message: `启动按键映射失败: ${err.message || err}`,
          duration: 4000,
        });
      }
    }
  };

  // 画布拖拽坐标换算 (键位编辑模式)
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (studioMode !== "edit") return;
    e.stopPropagation();
    draggingItemRef.current = id;
    setSelectedItemId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (studioMode !== "edit") return;
    if (!draggingItemRef.current || !screenRef.current) return;
    const rect = screenRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const normX = Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width));
    const normY = Math.max(0.02, Math.min(0.98, (clientY - rect.top) / rect.height));

    updateItem(draggingItemRef.current, {
      x: parseFloat(normX.toFixed(3)),
      y: parseFloat(normY.toFixed(3)),
    });
  };

  const handlePointerUp = () => {
    if (draggingItemRef.current) {
      draggingItemRef.current = null;
    }
  };

  // 触控实操模式：直接在真实投屏画面上点击或滑动
  const handleScreenTouchStart = (e: React.PointerEvent) => {
    if (studioMode !== "control" || !screenRef.current || !currentDevice?.serial) return;
    const rect = screenRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    touchStartRef.current = { x: nx, y: ny, time: Date.now() };
  };

  const handleScreenTouchEnd = async (e: React.PointerEvent) => {
    if (studioMode !== "control" || !screenRef.current || !currentDevice?.serial || !touchStartRef.current)
      return;
    const rect = screenRef.current.getBoundingClientRect();
    const endX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const endY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const startX = touchStartRef.current.x;
    const startY = touchStartRef.current.y;
    const dist = Math.hypot(endX - startX, endY - startY);

    if (dist < 0.03) {
      // 单击
      await KeyMappingService.simulateTouch(currentDevice.serial, "tap", endX, endY, undefined, undefined, undefined, orientation);
    } else {
      // 滑动
      const dur = Math.min(300, Math.max(80, Date.now() - touchStartRef.current.time));
      await KeyMappingService.simulateTouch(currentDevice.serial, "swipe", startX, startY, endX, endY, dur, orientation);
    }

    touchStartRef.current = null;
    // 稍后立即刷新画面呈现操作结果
    setTimeout(() => captureFrame(), 120);
  };

  // 启动原生硬件加速 60FPS 投屏
  const handleStartNativeMirror = async () => {
    if (!currentDevice?.serial) return;
    try {
      await ScreenMirrorService.startMirror(currentDevice.serial, DEFAULT_SCREEN_MIRROR_CONFIG);
      setStatusBarMessage({
        type: "success",
        message: `已启动原生超清 60FPS 投屏 [${currentDevice.serial}]`,
        duration: 3000,
      });
    } catch (err: any) {
      setStatusBarMessage({
        type: "error",
        message: `启动原生投屏失败: ${err.message || err}`,
        duration: 4000,
      });
    }
  };

  // 键盘录入监听
  const handleKeyDownRecord = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecordingKey) return;
      e.preventDefault();
      e.stopPropagation();

      let keyName = e.key;
      if (keyName === " ") keyName = "Space";
      if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (editingItem) {
        setEditingItem({ ...editingItem, key: keyName });
      }
      setIsRecordingKey(false);
    },
    [isRecordingKey, editingItem]
  );

  useEffect(() => {
    if (isRecordingKey) {
      window.addEventListener("keydown", handleKeyDownRecord);
      return () => window.removeEventListener("keydown", handleKeyDownRecord);
    }
  }, [isRecordingKey, handleKeyDownRecord]);

  // 打开编辑对话框
  const handleOpenEdit = (item: KeyMappingItem) => {
    setEditingItem({ ...item });
    setIsRecordingKey(false);
    setIsEditModalOpen(true);
  };

  // 保存单个映射项
  const handleSaveEdit = () => {
    if (editingItem) {
      updateItem(editingItem.id, editingItem);
      setIsEditModalOpen(false);
      setEditingItem(null);
    }
  };

  // 导出为本地 JSON 文件
  const handleExportFile = () => {
    if (!activeProfile) return;
    const jsonStr = exportProfile(activeProfile);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = activeProfile.name.replace(/[^\w\u4e00-\u9fa5_-]/g, "_");
    a.download = `${safeName}_keymapping.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusBarMessage({
      type: "success",
      message: `已导出配置文件 [${activeProfile.name}.json]`,
      duration: 3000,
    });
  };

  // 复制配置到剪贴板
  const handleExportClipboard = async () => {
    if (!activeProfile) return;
    const jsonStr = exportProfile(activeProfile);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setStatusBarMessage({
        type: "success",
        message: `已复制配置 [${activeProfile.name}] 到剪贴板`,
        duration: 3000,
      });
    } catch {
      setStatusBarMessage({
        type: "error",
        message: "写入剪贴板失败，请检查浏览器权限",
        duration: 3000,
      });
    }
  };

  // 本地文件选择读取
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;
      try {
        await importProfile(content);
        setStatusBarMessage({
          type: "success",
          message: `已成功导入配置文件: ${file.name}`,
          duration: 3000,
        });
        setIsImportModalOpen(false);
      } catch (err: any) {
        setStatusBarMessage({
          type: "error",
          message: `导入文件失败: ${err.message || err}`,
          duration: 4000,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 从输入文本/剪贴板文本导入
  const handleImportTextSubmit = async () => {
    if (!importJsonText.trim()) return;
    try {
      await importProfile(importJsonText.trim());
      setStatusBarMessage({
        type: "success",
        message: "配置已成功导入",
        duration: 3000,
      });
      setIsImportModalOpen(false);
      setImportJsonText("");
    } catch (err: any) {
      setStatusBarMessage({
        type: "error",
        message: `导入失败: ${err.message || err}`,
        duration: 3500,
      });
    }
  };

  // 从剪贴板粘贴到输入框
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setImportJsonText(text);
      } else {
        setStatusBarMessage({
          type: "warning",
          message: "剪贴板无内容",
          duration: 2500,
        });
      }
    } catch {
      setStatusBarMessage({
        type: "error",
        message: "读取剪贴板失败，请手动在下方文本框中粘贴",
        duration: 3000,
      });
    }
  };

  // 克隆当前配置
  const handleDuplicate = async () => {
    if (!activeProfile) return;
    try {
      const cloned = await duplicateProfile(activeProfile.id);
      setStatusBarMessage({
        type: "success",
        message: `已克隆配置为 [${cloned.name}]`,
        duration: 3000,
      });
    } catch (err: any) {
      setStatusBarMessage({
        type: "error",
        message: `克隆失败: ${err.message || err}`,
        duration: 3000,
      });
    }
  };

  // 画布尺寸计算 (横屏依据宽高比自适应 / 竖屏 9:16 自适应)
  const isLandscape = orientation === "landscape";
  const canvasHeight = isLandscape ? 336 : 540;
  const canvasWidth = isLandscape
    ? Math.min(740, Math.round(336 * (deviceAspect >= 1 ? deviceAspect : 16 / 9)))
    : Math.round(540 * (deviceAspect < 1 ? deviceAspect : 9 / 16));

  return (
    <div className={styles.container}>
      {/* 隐藏的文件输入组件 */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {/* 顶部控制栏 */}
      <div className={styles.topBar}>
        <div className={styles.topBarGroup}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginRight: "6px" }}>
            <Text weight="semibold" size={300}>
              按键映射
            </Text>
            <Badge appearance="tint" color="informative" size="small">
              Beta
            </Badge>
          </div>
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            配置:
          </Text>
          <Dropdown
            size="small"
            style={{ minWidth: "210px" }}
            value={activeProfile?.name || "选择预设"}
            onOptionSelect={(_, d) => selectProfile(d.optionValue as string)}
          >
            {profiles.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Dropdown>

          <Button
            size="small"
            appearance="subtle"
            icon={<Add24Regular />}
            onClick={() => setIsNewProfileOpen(true)}
            title="新建按键配置"
          >
            新建
          </Button>

          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                size="small"
                appearance="subtle"
                icon={<ArrowDownload24Regular />}
                title="导出当前配置"
              >
                导出
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<ArrowDownload24Regular />}
                  onClick={handleExportFile}
                >
                  导出为 JSON 文件 (.json)
                </MenuItem>
                <MenuItem
                  icon={<Copy24Regular />}
                  onClick={handleExportClipboard}
                >
                  复制 JSON 到剪贴板
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>

          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                size="small"
                appearance="subtle"
                icon={<ArrowUpload24Regular />}
                title="导入配置文件"
              >
                导入
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<ArrowUpload24Regular />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  从本地文件导入 (.json)
                </MenuItem>
                <MenuItem
                  icon={<Edit24Regular />}
                  onClick={() => setIsImportModalOpen(true)}
                >
                  粘贴代码或剪贴板导入
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>

          <Button
            size="small"
            appearance="subtle"
            icon={<Copy24Regular />}
            onClick={handleDuplicate}
            title="克隆当前配置为副本"
          >
            克隆
          </Button>

          {profiles.length > 1 && (
            <Button
              size="small"
              appearance="subtle"
              icon={<Delete24Regular />}
              onClick={() => activeProfile && deleteProfile(activeProfile.id)}
              title="删除当前配置"
            />
          )}
        </div>

        <div className={styles.topBarGroup}>
          {/* 当前设备指示标签 */}
          {currentDevice && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "9999px",
                backgroundColor: "var(--colorNeutralBackground3)",
                fontSize: "12px",
                color: "var(--colorNeutralForeground2)",
              }}
              title={`当前投屏设备: ${currentDevice.serial}`}
            >
              <Phone24Regular style={{ fontSize: "14px" }} />
              <span>{currentDevice.properties?.marketName || currentDevice.properties?.model || currentDevice.serial}</span>
            </div>
          )}

          {/* 横竖屏切换 */}
          <Button
            size="small"
            appearance="subtle"
            icon={<PhoneLaptop24Regular />}
            onClick={() =>
              setOrientation(isLandscape ? "portrait" : "landscape")
            }
          >
            {isLandscape ? "横屏 (游戏)" : "竖屏 (应用)"}
          </Button>

          {/* 运行主开关 */}
          <Button
            appearance={isRunning ? "primary" : "secondary"}
            size="medium"
            shape="circular"
            icon={isRunning ? <Stop24Regular /> : <Play24Regular />}
            onClick={handleToggleRunning}
            style={{
              backgroundColor: isRunning ? "var(--colorPaletteRedBackground3)" : undefined,
              color: isRunning ? "#ffffff" : undefined,
              fontWeight: "600",
            }}
          >
            {isRunning ? "按键映射运行中 (点击停止)" : "启动按键映射"}
          </Button>
        </div>
      </div>

      {/* 主体两栏布局 */}
      <div className={styles.mainLayout}>
        {/* 左侧卡片：按键规则列表 */}
        <div className={styles.leftCard}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className={styles.sectionTitle}>
              <Keyboard24Regular style={{ color: "var(--colorBrandForeground1)" }} />
              <span>按键规则 ({activeProfile?.items.length || 0})</span>
            </div>
            <Button
              size="small"
              appearance="primary"
              shape="circular"
              icon={<Add24Regular />}
              onClick={() =>
                addItem({
                  name: `按键 ${String.fromCharCode(65 + (activeProfile?.items.length || 0))}`,
                  key: "J",
                  actionType: "click",
                  x: 0.8,
                  y: 0.8,
                })
              }
            >
              添加按键
            </Button>
          </div>

          {/* 注入模式与前台焦点设置 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "10px",
              backgroundColor: "var(--colorNeutralBackground1)",
              borderRadius: "10px",
              border: "1px solid var(--colorNeutralStroke2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text size={200} weight="semibold">
                注入模式
              </Text>
              <Dropdown
                size="small"
                style={{ width: "150px" }}
                value={
                  injectionMode === "directWindow"
                    ? "窗口消息直连"
                    : injectionMode === "adbStream"
                    ? "ADB 输入流"
                    : "自动选择"
                }
                onOptionSelect={(_, d) =>
                  setInjectionMode(d.optionValue as InjectionMode)
                }
              >
                <Option value="auto">自动选择</Option>
                <Option value="directWindow">窗口消息直连</Option>
                <Option value="adbStream">ADB 输入流</Option>
              </Dropdown>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text size={200}>仅投屏窗口激活时触发</Text>
              <Switch
                checked={activeWindowOnly}
                onChange={(_, d) => setActiveWindowOnly(d.checked)}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text size={200}>按键浮层透明度 ({Math.round(keyOpacity * 100)}%)</Text>
              <Slider
                min={0.2}
                max={1.0}
                step={0.05}
                value={keyOpacity}
                onChange={(_, d) => setKeyOpacity(d.value)}
                style={{ width: "120px" }}
              />
            </div>
          </div>

          {/* 按键列表项 */}
          <div className={styles.itemList}>
            {activeProfile?.items.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 10px",
                  color: "var(--colorNeutralForeground3)",
                  fontSize: "13px",
                }}
              >
                暂无映射按键，点击上方“添加按键”
              </div>
            ) : (
              activeProfile?.items.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`${styles.itemRow} ${
                      isSelected ? styles.itemRowSelected : ""
                    }`}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <div className={styles.itemBadgeWrap}>
                      <div className={styles.keyBadge}>
                        {item.actionType === "joystick"
                          ? "WASD"
                          : item.key || "?"}
                      </div>
                      <div className={styles.itemDetails}>
                        <Text size={200} weight="semibold">
                          {item.name}
                        </Text>
                        <Text className={styles.itemCoords}>
                          {item.actionType === "click" && "普通单点"}
                          {item.actionType === "burst" &&
                            `连点 (${item.burstRate || 15} 次/秒)`}
                          {item.actionType === "joystick" &&
                            `方向轮盘 (半径 ${Math.round((item.radius || 0.12) * 100)}%)`}
                          {item.actionType === "swipe" && "划屏手势"}
                          {" · "}
                          {Math.round(item.x * 100)}%, {Math.round(item.y * 100)}%
                        </Text>
                      </div>
                    </div>
                    <div
                      className={styles.itemActions}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Edit24Regular />}
                        onClick={() => handleOpenEdit(item)}
                        title="编辑映射参数"
                      />
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        onClick={() => deleteItem(item.id)}
                        title="删除"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧卡片：内置真实设备投屏与按键映射层 */}
        <div className={styles.rightCard}>
          {/* 画布上方交互工具条 */}
          <div className={styles.canvasControls}>
            <div className={styles.canvasControlsGroup}>
              {/* 模式切换胶囊 */}
              <TabList
                selectedValue={studioMode}
                onTabSelect={(_, d) => setStudioMode(d.value as any)}
                style={{
                  backgroundColor: "var(--colorNeutralBackground3)",
                  padding: "2px",
                  borderRadius: "9999px",
                }}
              >
                <Tab value="edit" icon={<CursorClick24Regular />}>
                  键位布局
                </Tab>
                <Tab value="control" icon={<Keyboard24Regular />}>
                  触控实操
                </Tab>
              </TabList>

              <Button
                size="small"
                appearance="subtle"
                icon={showKeys ? <Eye24Regular /> : <EyeOff24Regular />}
                onClick={() => setShowKeys(!showKeys)}
                title={showKeys ? "隐藏按键提示" : "显示按键提示"}
              >
                {showKeys ? "按键可见" : "按键隐藏"}
              </Button>
            </div>

            <div className={styles.canvasControlsGroup}>
              {/* 画面同步状态与开关 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "var(--colorNeutralForeground2)",
                }}
              >
                {isLiveSyncing && <span className={styles.liveSyncPulse} />}
                <span>实时画面</span>
                <Switch
                  checked={isLiveSyncing}
                  onChange={(_, d) => setIsLiveSyncing(d.checked)}
                />
              </div>

              <Button
                size="small"
                appearance="subtle"
                icon={<ArrowSync24Regular />}
                onClick={captureFrame}
                disabled={isCapturing}
                title="立即刷新手机屏幕当前帧"
              >
                刷新画面
              </Button>

              <Button
                size="small"
                appearance="subtle"
                icon={<ShareScreenPerson24Regular />}
                onClick={handleStartNativeMirror}
                title="打开 Scrcpy 独立投屏窗口"
              >
                独立投屏窗口
              </Button>
            </div>
          </div>

          {/* 手机真实屏幕容器 */}
          <div
            ref={screenRef}
            className={styles.screenContainer}
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              cursor: studioMode === "control" ? "crosshair" : "default",
            }}
            onPointerDown={handleScreenTouchStart}
            onPointerUp={handleScreenTouchEnd}
            onPointerMove={handlePointerMove}
          >
            {/* 真实设备屏幕画面背景 */}
            {screenImage ? (
              <img
                src={screenImage}
                alt="Device Realtime Screen"
                className={styles.liveStreamImage}
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    const ratio = img.naturalWidth / img.naturalHeight;
                    setDeviceAspect(ratio);
                    if (ratio > 1.15 && orientation !== "landscape") {
                      setOrientation("landscape");
                    } else if (ratio < 0.85 && orientation !== "portrait") {
                      setOrientation("portrait");
                    }
                  }
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "10px",
                }}
              >
                <Spinner size="medium" />
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  正在同步设备真实屏幕画面...
                </Text>
              </div>
            )}

            {/* 渲染所有映射项 (仅在 showKeys 开启时显示) */}
            {showKeys &&
              activeProfile?.items.map((item) => {
                const isSelected = selectedItemId === item.id;
                const leftPx = item.x * canvasWidth;
                const topPx = item.y * canvasHeight;

                if (item.actionType === "joystick") {
                  const radiusPx =
                    (item.radius || 0.12) * Math.min(canvasWidth, canvasHeight);
                  return (
                    <React.Fragment key={item.id}>
                      {/* 摇杆感应光环 */}
                      <div
                        className={styles.canvasJoystickRing}
                        style={{
                          left: `${leftPx}px`,
                          top: `${topPx}px`,
                          width: `${radiusPx * 2}px`,
                          height: `${radiusPx * 2}px`,
                          opacity: keyOpacity,
                        }}
                      />
                      {/* 摇杆中心按键 */}
                      <div
                        className={styles.canvasElement}
                        style={{
                          left: `${leftPx}px`,
                          top: `${topPx}px`,
                          opacity: keyOpacity,
                        }}
                        onPointerDown={(e) => handlePointerDown(item.id, e)}
                        onDoubleClick={() => handleOpenEdit(item)}
                      >
                        <div
                          className={`${styles.canvasKeyNode} ${
                            isSelected ? styles.canvasKeyNodeSelected : ""
                          }`}
                          title="WASD 方向摇杆 (双击编辑)"
                        >
                          <Navigation24Regular style={{ fontSize: "16px" }} />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={styles.canvasElement}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      opacity: keyOpacity,
                    }}
                    onPointerDown={(e) => handlePointerDown(item.id, e)}
                    onDoubleClick={() => handleOpenEdit(item)}
                  >
                    <div
                      className={`${styles.canvasKeyNode} ${
                        isSelected ? styles.canvasKeyNodeSelected : ""
                      }`}
                      title={`${item.name} [${item.key}] (双击编辑)`}
                    >
                      {item.key}
                      {item.actionType === "burst" && (
                        <span className={styles.canvasBurstTag}>
                          {item.burstRate || 15}/s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "var(--colorNeutralForeground3)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span>
              当前处于:{" "}
              <b style={{ color: "var(--colorBrandForeground1)" }}>
                {studioMode === "edit" ? "键位布局模式" : "触控实操模式"}
              </b>
            </span>
            <span>·</span>
            <span>
              {studioMode === "edit"
                ? "拖动按键图标直接对准手机游戏技能/按键"
                : "在画面上点击或滑动直接操控手机，按下键盘触发按键"}
            </span>
          </div>
        </div>
      </div>

      {/* 新建配置对话框 */}
      <Dialog
        open={isNewProfileOpen}
        onOpenChange={(_, d) => setIsNewProfileOpen(d.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>新建映射配置</DialogTitle>
            <DialogContent
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                paddingTop: "10px",
              }}
            >
              <Field label="配置名称">
                <Input
                  value={newProfileName}
                  onChange={(_, d) => setNewProfileName(d.value)}
                  placeholder="例如：原神 / 崩坏：星穹铁道 / 极速刷图"
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsNewProfileOpen(false)}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={async () => {
                  if (newProfileName.trim()) {
                    await createProfile(newProfileName.trim(), orientation);
                    setIsNewProfileOpen(false);
                    setNewProfileName("");
                  }
                }}
              >
                创建
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 导入配置对话框 */}
      <Dialog
        open={isImportModalOpen}
        onOpenChange={(_, d) => setIsImportModalOpen(d.open)}
      >
        <DialogSurface style={{ maxWidth: "520px" }}>
          <DialogBody>
            <DialogTitle>导入按键映射配置</DialogTitle>
            <DialogContent
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                paddingTop: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Button
                  appearance="secondary"
                  icon={<ArrowUpload24Regular />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  选择本地 .json 文件
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Copy24Regular />}
                  onClick={handlePasteFromClipboard}
                >
                  从剪贴板读取并粘贴
                </Button>
              </div>

              <Field label="或直接在下方粘贴配置 JSON 内容:">
                <Textarea
                  value={importJsonText}
                  onChange={(_, d) => setImportJsonText(d.value)}
                  placeholder='{"name": "游戏配置", "orientation": "landscape", "items": [...]}'
                  rows={8}
                  style={{
                    fontFamily:
                      'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                    fontSize: "12px",
                  }}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsImportModalOpen(false)}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                disabled={!importJsonText.trim()}
                onClick={handleImportTextSubmit}
              >
                确认导入
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 按键参数编辑模态框 */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(_, d) => setIsEditModalOpen(d.open)}
      >
        <DialogSurface style={{ maxWidth: "480px" }}>
          <DialogBody>
            <DialogTitle>编辑按键映射</DialogTitle>
            <DialogContent
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                paddingTop: "12px",
              }}
            >
              {editingItem && (
                <>
                  <Field label="名称">
                    <Input
                      value={editingItem.name}
                      onChange={(_, d) =>
                        setEditingItem({ ...editingItem, name: d.value })
                      }
                    />
                  </Field>

                  {/* 按键录入器 */}
                  {editingItem.actionType !== "joystick" && (
                    <Field label="绑定键盘按键">
                      <div
                        className={styles.keyRecordBox}
                        onClick={() => setIsRecordingKey(true)}
                      >
                        {isRecordingKey ? (
                          <Text style={{ animation: "pulse 1s infinite" }}>
                            请在键盘上按下目标按键...
                          </Text>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Keyboard24Regular />
                            <span>当前绑定: [{editingItem.key}] (点击重新录入)</span>
                          </div>
                        )}
                      </div>
                    </Field>
                  )}

                  {/* 动作类型选择 */}
                  <Field label="映射动作类型">
                    <TabList
                      selectedValue={editingItem.actionType}
                      onTabSelect={(_, d) =>
                        setEditingItem({
                          ...editingItem,
                          actionType: d.value as KeyActionType,
                        })
                      }
                    >
                      <Tab value="click" icon={<CursorClick24Regular />}>
                        单点
                      </Tab>
                      <Tab value="burst" icon={<Flash24Regular />}>
                        连续点击
                      </Tab>
                      <Tab value="joystick" icon={<Navigation24Regular />}>
                        方向轮盘
                      </Tab>
                      <Tab value="swipe" icon={<SwipeRight24Regular />}>
                        滑动
                      </Tab>
                    </TabList>
                  </Field>

                  {/* 连点器特有参数 */}
                  {editingItem.actionType === "burst" && (
                    <Field label={`连点频率: ${editingItem.burstRate || 15} 次/秒`}>
                      <Slider
                        min={5}
                        max={30}
                        step={1}
                        value={editingItem.burstRate || 15}
                        onChange={(_, d) =>
                          setEditingItem({ ...editingItem, burstRate: d.value })
                        }
                      />
                    </Field>
                  )}

                  {/* 摇杆特有参数 */}
                  {editingItem.actionType === "joystick" && (
                    <Field
                      label={`移动判定半径: ${Math.round(
                        (editingItem.radius || 0.12) * 100
                      )}% 屏幕比例`}
                    >
                      <Slider
                        min={0.05}
                        max={0.25}
                        step={0.01}
                        value={editingItem.radius || 0.12}
                        onChange={(_, d) =>
                          setEditingItem({ ...editingItem, radius: d.value })
                        }
                      />
                    </Field>
                  )}

                  {/* 滑动特有参数 */}
                  {editingItem.actionType === "swipe" && (
                    <Field
                      label={`滑动持续耗时: ${editingItem.durationMs || 150} 毫秒`}
                    >
                      <Slider
                        min={50}
                        max={600}
                        step={25}
                        value={editingItem.durationMs || 150}
                        onChange={(_, d) =>
                          setEditingItem({
                            ...editingItem,
                            durationMs: d.value,
                          })
                        }
                      />
                    </Field>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                取消
              </Button>
              <Button appearance="primary" onClick={handleSaveEdit}>
                保存设置
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default KeyMappingStudio;
