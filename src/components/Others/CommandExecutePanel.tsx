import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  makeStyles,
  mergeClasses,
  Text,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogSurface,
  DialogActions,
  Field,
  Tooltip,
} from "@fluentui/react-components";
import {
  Play20Regular,
  Delete20Regular,
  Copy20Regular,
  Checkmark20Regular,
  Search20Regular,
  ChevronDown16Regular,
  Edit20Regular,
  Add20Regular,
  Save20Regular,
  Dismiss20Regular,
  Apps20Regular,
} from "@fluentui/react-icons";
import { listen } from "@tauri-apps/api/event";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { DeviceInfo, DeviceMode } from "../../types/device";
import {
  loadAdbCommandsConfig,
  saveAdbCommandsConfig,
  watchConfigFile,
  AdbCommandsConfig,
  AdbCommand,
  CommandCategory,
  filterCommandsBySearchTerm,
  loadFastbootCommandsConfig,
  saveFastbootCommandsConfig,
  watchFastbootConfigFile,
} from "../../utils/configLoader";
import { useAppStore } from "../../stores/appStore";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    padding: "16px 20px",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  // Top Header / Toolbar
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: "12px",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.01em",
  },
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.02em",
  },
  modeBadgeAdb: {
    backgroundColor: "rgba(0, 113, 227, 0.1)",
    color: "#0071e3",
    border: "1px solid rgba(0, 113, 227, 0.2)",
  },
  modeBadgeFastboot: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    color: "#8b5cf6",
    border: "1px solid rgba(139, 92, 246, 0.2)",
  },
  // Device Selector Dropdown Button
  deviceSelectorWrapper: {
    position: "relative",
  },
  deviceSelectorBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    height: "32px",
    padding: "0 12px",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    fontSize: "12px",
    color: "var(--colorNeutralForeground1)",
    cursor: "pointer",
    userSelect: "none",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      borderColor: "var(--colorNeutralStroke1)",
    },
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  deviceDropdownMenu: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    minWidth: "260px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    zIndex: 1000,
    maxHeight: "300px",
    overflowY: "auto",
    padding: "4px",
  },
  deviceDropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "background-color 0.12s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
  },
  deviceDropdownItemSelected: {
    backgroundColor: "var(--colorNeutralBackground3)",
    fontWeight: "600",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actionBtn: {
    minWidth: "32px",
    height: "32px",
    padding: "0 8px",
    borderRadius: "8px",
    color: "var(--colorNeutralForeground2)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  actionBtnActive: {
    backgroundColor: "rgba(0, 113, 227, 0.12)",
    color: "#0071e3",
  },

  // Terminal Window Container
  terminalCard: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 0",
    minHeight: 0,
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    overflow: "hidden",
  },
  // Inline Search Bar inside Terminal
  searchToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    gap: "8px",
  },
  searchInput: {
    flex: 1,
    maxWidth: "320px",
    height: "28px",
    fontSize: "12px",
  },
  searchMatchesText: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },

  // Terminal Screen (Log & Output Stream)
  terminalScreen: {
    flex: "1 1 0",
    minHeight: 0,
    overflowY: "auto",
    overflowX: "auto",
    padding: "12px 14px",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Cascadia Code', monospace",
    fontSize: "12.5px",
    lineHeight: "1.55",
    color: "var(--colorNeutralForeground1)",
    userSelect: "text",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  terminalIntro: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "var(--colorNeutralForeground3)",
    padding: "20px 8px",
    fontSize: "12px",
  },
  terminalIntroTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground2)",
  },

  // Bottom Command Prompt Input Bar
  promptBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  promptPrefix: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground3)",
    userSelect: "none",
    flexShrink: 0,
  },
  promptPrefixTarget: {
    color: "#0071e3",
  },
  commandInput: {
    flex: 1,
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "12.5px",
  },
  runButton: {
    height: "32px",
    padding: "0 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
  },

  // Quick Command Modal Grid & Cards
  dialogBody: {
    maxHeight: "65vh",
    overflowY: "auto",
    padding: "8px 0",
  },
  categorySection: {
    marginBottom: "18px",
  },
  categoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "8px",
    marginBottom: "8px",
  },
  categoryTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "8px",
  },
  commandCard: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "10px",
    transition: "all 0.15s ease",
    "&:hover": {
      borderColor: "var(--colorNeutralStroke1)",
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  commandCardLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commandCardCode: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "11px",
    color: "#0071e3",
    backgroundColor: "rgba(0, 113, 227, 0.06)",
    padding: "2px 6px",
    borderRadius: "4px",
    marginBottom: "6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commandCardDesc: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    marginBottom: "8px",
    lineHeight: "1.4",
  },
  commandCardFooter: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "auto",
  },
});

export const CommandExecutePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { devices, selectedDevice, selectDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();

  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Command history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Quick commands modal & config
  const [isQuickCommandDialogOpen, setIsQuickCommandDialogOpen] = useState(false);
  const [quickCmdSearch, setQuickCmdSearch] = useState("");
  const [commandsConfig, setCommandsConfig] = useState<AdbCommandsConfig | null>(null);

  // Edit / Add command dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<AdbCommand | null>(null);
  const [editingCategory, setEditingCategory] = useState<CommandCategory | null>(null);
  const [isAddingNewCommand, setIsAddingNewCommand] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    label: "",
    command: "",
    description: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    description: "",
  });

  const [isCopiedOutput, setIsCopiedOutput] = useState(false);
  const outputScreenRef = useRef<HTMLDivElement>(null);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);

  // Device mode & status helpers
  const isFastbootMode =
    selectedDevice?.mode === "fastboot" || selectedDevice?.mode === "fastbootd";

  const getDeviceDisplayName = (device: DeviceInfo | null) => {
    if (!device) return t("command_panel.device_unknown", "未知设备");
    return device.properties?.model || device.serial;
  };

  const getDeviceModeLabel = (mode?: DeviceMode) => {
    switch (mode) {
      case "sys":
        return "系统模式";
      case "rec":
        return "Recovery";
      case "fastboot":
        return "Fastboot";
      case "fastbootd":
        return "Fastbootd";
      case "sideload":
        return "Sideload";
      case "edl":
        return "EDL";
      case "unauthorized":
        return "未授权";
      case "offline":
        return "离线";
      default:
        return "未知状态";
    }
  };

  const getDeviceStatusColor = (device?: DeviceInfo | null) => {
    if (!device || !device.connected) return "#9ca3af";
    switch (device.mode) {
      case "sys":
        return "#10b981"; // green
      case "rec":
        return "#f59e0b"; // amber
      case "fastboot":
      case "fastbootd":
        return "#8b5cf6"; // purple
      case "sideload":
        return "#06b6d4"; // cyan
      case "edl":
      case "unauthorized":
        return "#ef4444"; // red
      default:
        return "#6b7280";
    }
  };

  // Close device dropdown on outer click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        deviceDropdownRef.current &&
        !deviceDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDeviceDropdownOpen(false);
      }
    };
    if (isDeviceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDeviceDropdownOpen]);

  // Load config & watch changes
  useEffect(() => {
    let stopWatching: (() => void) | undefined;

    const loadConfig = async () => {
      try {
        let conf;
        if (isFastbootMode) {
          conf = await loadFastbootCommandsConfig();
          stopWatching = await watchFastbootConfigFile((newConf) => {
            setCommandsConfig(newConf);
          });
        } else {
          conf = await loadAdbCommandsConfig();
          stopWatching = await watchConfigFile((newConf) => {
            setCommandsConfig(newConf);
          });
        }
        setCommandsConfig(conf);
      } catch (err) {
        console.error("加载命令配置失败:", err);
      }
    };

    loadConfig();

    return () => {
      if (stopWatching) stopWatching();
    };
  }, [isFastbootMode]);

  // Listen for AI assistant command triggers
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen<{ command: string }>(
        "execute-command-from-ai",
        (event) => {
          if (event.payload && event.payload.command) {
            let aiCmd = event.payload.command.trim();
            if (aiCmd.startsWith("adb ")) aiCmd = aiCmd.substring(4).trim();
            else if (aiCmd.startsWith("fastboot ")) aiCmd = aiCmd.substring(9).trim();
            aiCmd = aiCmd.replace(/^-s\s+(?:"[^"]*"|\S+)\s+/, "");
            executeCommand(aiCmd);
          }
        }
      );
      return unlisten;
    };

    let unlistenFn: (() => void) | undefined;
    setupListener().then((fn) => (unlistenFn = fn));

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [selectedDevice]);

  // Sync selected device automatically if list changes
  useEffect(() => {
    if (devices.length === 0 && selectedDevice) {
      selectDevice(null);
    } else if (devices.length > 0 && !selectedDevice) {
      selectDevice(devices[0]);
    }
  }, [devices, selectedDevice, selectDevice]);

  // Auto scroll output screen to bottom
  useEffect(() => {
    if (outputScreenRef.current) {
      outputScreenRef.current.scrollTop = outputScreenRef.current.scrollHeight;
    }
  }, [output]);

  // Search match calculations
  const searchMatches = useMemo(() => {
    if (!searchTerm.trim() || !output) return [];
    const regex = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    const matches: Array<{ index: number; text: string; length: number }> = [];
    let match;
    while ((match = regex.exec(output)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        length: match[0].length,
      });
    }
    return matches;
  }, [output, searchTerm]);

  // Filtered quick commands
  const filteredCategories = useMemo(() => {
    if (!commandsConfig) return [];
    return filterCommandsBySearchTerm(commandsConfig.categories, quickCmdSearch);
  }, [commandsConfig, quickCmdSearch]);

  // Execute Command
  const executeCommand = async (cmdToRun?: string) => {
    const rawCmd = (cmdToRun !== undefined ? cmdToRun : command).trim();

    if (!rawCmd) {
      setStatusBarMessage({
        type: "error",
        message: t("command_panel.command_empty", "命令不能为空"),
      });
      return;
    }

    if (!selectedDevice) {
      setStatusBarMessage({
        type: "error",
        message: t("command_panel.select_device_first", "请先选择一个设备"),
      });
      setOutput((prev) => prev + `[!] 错误: 请先连接或选择目标设备\n\n`);
      return;
    }

    // Save to history
    setHistory((prev) => [rawCmd, ...prev.filter((c) => c !== rawCmd)].slice(0, 50));
    setHistoryIndex(-1);
    setCommand("");
    setIsExecuting(true);

    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const cmdPrefix = isFastbootMode ? "fastboot" : "adb";
    const promptHeader = `\n[${time}] $ ${cmdPrefix} -s ${selectedDevice.serial} ${rawCmd}\n`;

    setOutput((prev) => prev + promptHeader);

    try {
      const parts = rawCmd.split(" ");
      const commandName = parts[0];
      const args = parts.slice(1);

      let result;
      if (isFastbootMode) {
        result = await deviceService.executeFastbootCommand(
          selectedDevice.serial,
          commandName,
          args,
          30
        );
      } else {
        result = await deviceService.executeAdbCommand(
          selectedDevice.serial,
          commandName,
          args,
          30
        );
      }

      if (result.success) {
        setOutput((prev) => prev + (result.output ? result.output.trim() + "\n" : "[执行成功，无返回内容]\n"));
        setStatusBarMessage({
          type: "success",
          message: `已执行: ${rawCmd}`,
        });
      } else {
        const errorText = result.error || "命令执行失败";
        setOutput((prev) => prev + `[ERROR] ${errorText}\n`);
        setStatusBarMessage({
          type: "error",
          message: errorText,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setOutput((prev) => prev + `[ERROR] ${errorMsg}\n`);
      setStatusBarMessage({
        type: "error",
        message: errorMsg,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard navigation for history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setCommand(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setCommand("");
      } else {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    }
  };

  // Copy output
  const handleCopyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setIsCopiedOutput(true);
      setTimeout(() => setIsCopiedOutput(false), 2000);
    } catch (e) {
      console.error("复制输出失败:", e);
    }
  }, [output]);

  // Clear output
  const handleClearOutput = useCallback(() => {
    setOutput("");
  }, []);

  // Quick Command Action Handlers
  const handleRunQuickCommand = (cmd: AdbCommand) => {
    setIsQuickCommandDialogOpen(false);
    executeCommand(cmd.command);
  };

  const handleEditQuickCommand = (cmd: AdbCommand, cat: CommandCategory) => {
    setEditingCommand(cmd);
    setEditingCategory(cat);
    setEditForm({
      id: cmd.id,
      label: cmd.label,
      command: cmd.command,
      description: cmd.description || "",
    });
    setIsAddingNewCommand(false);
    setIsAddingNewCategory(false);
    setIsEditDialogOpen(true);
  };

  const handleOpenAddCommand = (cat: CommandCategory) => {
    setEditingCategory(cat);
    setEditForm({
      id: `cmd_${Date.now()}`,
      label: "",
      command: "",
      description: "",
    });
    setIsAddingNewCommand(true);
    setIsAddingNewCategory(false);
    setIsEditDialogOpen(true);
  };

  const handleOpenAddCategory = () => {
    setCategoryForm({
      id: `cat_${Date.now()}`,
      name: "",
      description: "",
    });
    setIsAddingNewCategory(true);
    setIsAddingNewCommand(false);
    setIsEditDialogOpen(true);
  };

  const handleSaveCommandOrCategory = async () => {
    if (!commandsConfig) return;

    try {
      const updatedConfig = { ...commandsConfig };

      if (isAddingNewCategory) {
        const newCat: CommandCategory = {
          id: categoryForm.id || `cat_${Date.now()}`,
          name: categoryForm.name,
          description: categoryForm.description,
          commands: [],
        };
        updatedConfig.categories.push(newCat);
      } else if (isAddingNewCommand && editingCategory) {
        const catIdx = updatedConfig.categories.findIndex((c) => c.id === editingCategory.id);
        if (catIdx !== -1) {
          updatedConfig.categories[catIdx].commands.push({
            id: editForm.id || `cmd_${Date.now()}`,
            label: editForm.label,
            command: editForm.command,
            description: editForm.description,
          });
        }
      } else if (editingCommand && editingCategory) {
        const catIdx = updatedConfig.categories.findIndex((c) => c.id === editingCategory.id);
        if (catIdx !== -1) {
          const cmdIdx = updatedConfig.categories[catIdx].commands.findIndex((c) => c.id === editingCommand.id);
          if (cmdIdx !== -1) {
            updatedConfig.categories[catIdx].commands[cmdIdx] = {
              ...updatedConfig.categories[catIdx].commands[cmdIdx],
              ...editForm,
            };
          }
        }
      }

      const saveFn = isFastbootMode ? saveFastbootCommandsConfig : saveAdbCommandsConfig;
      const success = await saveFn(updatedConfig);

      if (success) {
        setCommandsConfig(updatedConfig);
        setIsEditDialogOpen(false);
        setStatusBarMessage({
          type: "success",
          message: "配置已保存",
        });
      }
    } catch (err) {
      console.error("保存命令配置失败:", err);
    }
  };

  const handleDeleteQuickCommand = async (cmd: AdbCommand, cat: CommandCategory) => {
    if (!commandsConfig) return;
    if (!window.confirm(`确定要删除快捷命令 "${cmd.label}" 吗？`)) return;

    try {
      const updatedConfig = { ...commandsConfig };
      const catIdx = updatedConfig.categories.findIndex((c) => c.id === cat.id);
      if (catIdx !== -1) {
        updatedConfig.categories[catIdx].commands = updatedConfig.categories[catIdx].commands.filter(
          (c) => c.id !== cmd.id
        );
        const saveFn = isFastbootMode ? saveFastbootCommandsConfig : saveAdbCommandsConfig;
        await saveFn(updatedConfig);
        setCommandsConfig(updatedConfig);
      }
    } catch (err) {
      console.error("删除命令失败:", err);
    }
  };

  const handleDeleteCategory = async (cat: CommandCategory) => {
    if (!commandsConfig) return;
    if (cat.commands.length > 0) {
      alert("请先删除该分类下的所有命令");
      return;
    }
    if (!window.confirm(`确定要删除分类 "${cat.name}" 吗？`)) return;

    try {
      const updatedConfig = { ...commandsConfig };
      updatedConfig.categories = updatedConfig.categories.filter((c) => c.id !== cat.id);
      const saveFn = isFastbootMode ? saveFastbootCommandsConfig : saveAdbCommandsConfig;
      await saveFn(updatedConfig);
      setCommandsConfig(updatedConfig);
    } catch (err) {
      console.error("删除分类失败:", err);
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部控制与设备栏 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>{t("main.command_line", "终端命令行")}</Text>

          {/* 设备选择器 */}
          <div className={styles.deviceSelectorWrapper} ref={deviceDropdownRef}>
            <div
              className={styles.deviceSelectorBtn}
              onClick={() => setIsDeviceDropdownOpen(!isDeviceDropdownOpen)}
            >
              <span
                className={styles.statusDot}
                style={{ backgroundColor: getDeviceStatusColor(selectedDevice) }}
              />
              <span>
                {selectedDevice
                  ? `${getDeviceDisplayName(selectedDevice)} (${selectedDevice.serial})`
                  : "未连接设备"}
              </span>
              <ChevronDown16Regular />
            </div>

            {isDeviceDropdownOpen && (
              <div className={styles.deviceDropdownMenu}>
                {devices.length === 0 ? (
                  <div className={styles.deviceDropdownItem} style={{ color: "var(--colorNeutralForeground3)" }}>
                    未发现可用设备
                  </div>
                ) : (
                  devices.map((d) => (
                    <div
                      key={d.serial}
                      className={mergeClasses(
                        styles.deviceDropdownItem,
                        selectedDevice?.serial === d.serial && styles.deviceDropdownItemSelected
                      )}
                      onClick={() => {
                        selectDevice(d);
                        setIsDeviceDropdownOpen(false);
                      }}
                    >
                      <span
                        className={styles.statusDot}
                        style={{ backgroundColor: getDeviceStatusColor(d) }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div>{getDeviceDisplayName(d)}</div>
                        <div style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                          {d.serial} · {getDeviceModeLabel(d.mode)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 模式标签 */}
          <div
            className={mergeClasses(
              styles.modeBadge,
              isFastbootMode ? styles.modeBadgeFastboot : styles.modeBadgeAdb
            )}
          >
            {isFastbootMode ? "FASTBOOT" : "ADB"}
          </div>
        </div>

        {/* 顶部快捷操作 */}
        <div className={styles.headerRight}>
          <Tooltip content="快捷命令库" relationship="label">
            <Button
              appearance="subtle"
              icon={<Apps20Regular />}
              className={styles.actionBtn}
              onClick={() => setIsQuickCommandDialogOpen(true)}
            >
              快捷命令
            </Button>
          </Tooltip>

          <Tooltip content={showSearch ? "收起搜索" : "在输出中搜索"} relationship="label">
            <Button
              appearance="subtle"
              icon={<Search20Regular />}
              className={mergeClasses(styles.actionBtn, showSearch && styles.actionBtnActive)}
              onClick={() => setShowSearch(!showSearch)}
            />
          </Tooltip>

          <Tooltip content={isCopiedOutput ? "已复制输出内容" : "复制全部输出"} relationship="label">
            <Button
              appearance="subtle"
              icon={isCopiedOutput ? <Checkmark20Regular style={{ color: "#10b981" }} /> : <Copy20Regular />}
              className={styles.actionBtn}
              onClick={handleCopyOutput}
              disabled={!output}
            />
          </Tooltip>

          <Tooltip content="清空终端屏幕" relationship="label">
            <Button
              appearance="subtle"
              icon={<Delete20Regular />}
              className={styles.actionBtn}
              onClick={handleClearOutput}
              disabled={!output}
            />
          </Tooltip>
        </div>
      </div>

      {/* 终端主体卡片 */}
      <div className={styles.terminalCard}>
        {/* 搜索工具条（按需展开） */}
        {showSearch && (
          <div className={styles.searchToolbar}>
            <Input
              placeholder="搜索终端输出内容..."
              value={searchTerm}
              onChange={(_, data) => setSearchTerm(data.value)}
              contentBefore={<Search20Regular />}
              contentAfter={
                searchTerm ? (
                  <Button
                    appearance="transparent"
                    size="small"
                    icon={<Dismiss20Regular />}
                    onClick={() => setSearchTerm("")}
                    style={{ minWidth: "20px", padding: 0 }}
                  />
                ) : undefined
              }
              className={styles.searchInput}
            />

            {searchTerm && (
              <span className={styles.searchMatchesText}>
                找到 {searchMatches.length} 个匹配项
              </span>
            )}
          </div>
        )}

        {/* 终端日志流展示 */}
        <div className={styles.terminalScreen} ref={outputScreenRef}>
          {!output ? (
            <div className={styles.terminalIntro}>
              <span className={styles.terminalIntroTitle}>ADMT Terminal Console</span>
              <span>• 当前设备: {selectedDevice ? `${getDeviceDisplayName(selectedDevice)} (${selectedDevice.serial})` : "未连接"}</span>
              <span>• 运行模式: {isFastbootMode ? "Fastboot Protocol" : "Android Debug Bridge (ADB)"}</span>
              <span>• 快捷键支持: 按 [Enter] 立即执行命令，按 [↑ / ↓] 键快速切换历史命令</span>
            </div>
          ) : (
            output
          )}
        </div>

        {/* 底部命令行输入栏 */}
        <div className={styles.promptBar}>
          <div className={styles.promptPrefix}>
            <span>$</span>
            <span className={styles.promptPrefixTarget}>{isFastbootMode ? "fastboot" : "adb"}</span>
          </div>

          <Input
            value={command}
            onChange={(_, data) => setCommand(data.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isFastbootMode
                ? "输入 Fastboot 命令 (如 devices, oem unlock, getvar all)..."
                : "输入 ADB 命令 (如 shell getprop ro.product.model, logcat -d, devices)..."
            }
            disabled={isExecuting || !selectedDevice}
            className={styles.commandInput}
          />

          <Button
            appearance="primary"
            icon={<Play20Regular />}
            onClick={() => executeCommand()}
            disabled={isExecuting || !command.trim() || !selectedDevice}
            className={styles.runButton}
          >
            {isExecuting ? "执行中..." : "执行"}
          </Button>
        </div>
      </div>

      {/* 快捷命令对话框 */}
      <Dialog
        open={isQuickCommandDialogOpen}
        onOpenChange={(_, data) => setIsQuickCommandDialogOpen(data.open)}
        modalType="modal"
      >
        <DialogSurface style={{ width: "880px", maxWidth: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <DialogTitle>快捷命令库 ({isFastbootMode ? "Fastboot" : "ADB"})</DialogTitle>
            </div>

            <DialogContent className={styles.dialogBody}>
              {/* 搜索与添加分类 */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
                <Input
                  placeholder="搜索快捷命令名称、指令或描述..."
                  value={quickCmdSearch}
                  onChange={(_, data) => setQuickCmdSearch(data.value)}
                  contentBefore={<Search20Regular />}
                  style={{ flex: 1 }}
                />
                <Button appearance="primary" icon={<Add20Regular />} onClick={handleOpenAddCategory}>
                  添加分类
                </Button>
              </div>

              {filteredCategories.map((category) => (
                <div key={category.id} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <span className={styles.categoryTitle}>{category.name}</span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Add20Regular />}
                        onClick={() => handleOpenAddCommand(category)}
                      >
                        添加命令
                      </Button>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Delete20Regular />}
                        onClick={() => handleDeleteCategory(category)}
                        disabled={category.commands.length > 0}
                        title={category.commands.length > 0 ? "请先删除分类下的命令" : "删除分类"}
                      />
                    </div>
                  </div>

                  <div className={styles.commandGrid}>
                    {category.commands.map((cmd) => (
                      <div key={cmd.id} className={styles.commandCard}>
                        <div className={styles.commandCardLabel} title={cmd.label}>
                          {cmd.label}
                        </div>
                        <div className={styles.commandCardCode} title={cmd.command}>
                          {cmd.command}
                        </div>
                        {cmd.description && (
                          <div className={styles.commandCardDesc} title={cmd.description}>
                            {cmd.description}
                          </div>
                        )}

                        <div className={styles.commandCardFooter}>
                          <Button
                            appearance="primary"
                            size="small"
                            icon={<Play20Regular />}
                            onClick={() => handleRunQuickCommand(cmd)}
                            style={{ flex: 1 }}
                          >
                            运行
                          </Button>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Edit20Regular />}
                            onClick={() => handleEditQuickCommand(cmd, category)}
                          />
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Delete20Regular />}
                            onClick={() => handleDeleteQuickCommand(cmd, category)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--colorNeutralForeground3)" }}>
                  没有找到匹配的快捷命令
                </div>
              )}
            </DialogContent>

            <DialogActions>
              <Button appearance="subtle" onClick={() => setIsQuickCommandDialogOpen(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 新增/编辑命令或分类对话框 */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(_, data) => {
          if (!data.open) setIsEditDialogOpen(false);
        }}
        modalType="modal"
      >
        <DialogSurface style={{ borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle>
              {isAddingNewCategory
                ? "添加新分类"
                : isAddingNewCommand
                ? "添加新快捷命令"
                : "编辑快捷命令"}
            </DialogTitle>

            <DialogContent className={styles.dialogBody}>
              {isAddingNewCategory ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Field label="分类名称:">
                    <Input
                      value={categoryForm.name}
                      onChange={(_, data) => setCategoryForm({ ...categoryForm, name: data.value })}
                      placeholder="如: 系统调试、分区操作"
                    />
                  </Field>
                  <Field label="分类描述 (可选):">
                    <Input
                      value={categoryForm.description}
                      onChange={(_, data) => setCategoryForm({ ...categoryForm, description: data.value })}
                      placeholder="简短说明分类用途"
                    />
                  </Field>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Field label="命令名称:">
                    <Input
                      value={editForm.label}
                      onChange={(_, data) => setEditForm({ ...editForm, label: data.value })}
                      placeholder="如: 获取设备型号"
                    />
                  </Field>
                  <Field label="执行指令 (无需带 adb / fastboot 前缀):">
                    <Input
                      value={editForm.command}
                      onChange={(_, data) => setEditForm({ ...editForm, command: data.value })}
                      placeholder="如: shell getprop ro.product.model"
                    />
                  </Field>
                  <Field label="功能描述 (可选):">
                    <Input
                      value={editForm.description}
                      onChange={(_, data) => setEditForm({ ...editForm, description: data.value })}
                      placeholder="简要说明指令的作用"
                    />
                  </Field>
                </div>
              )}
            </DialogContent>

            <DialogActions>
              <Button appearance="subtle" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button
                appearance="primary"
                icon={<Save20Regular />}
                onClick={handleSaveCommandOrCategory}
                disabled={
                  isAddingNewCategory
                    ? !categoryForm.name.trim()
                    : !editForm.label.trim() || !editForm.command.trim()
                }
              >
                保存
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default CommandExecutePanel;
