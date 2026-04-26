/*
AdbToolsPanel.tsx
这是 ADB 工具面板组件
*/
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  makeStyles,
  Text,
  Card,
  Field,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogSurface,
  DialogActions,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Delete24Regular,
  Copy24Regular,
  Search24Regular,
  ChevronDown24Regular,
  Edit24Regular,
  Add24Regular,
  Save24Regular,
  Bot24Regular,
  Sparkle24Regular,
} from "@fluentui/react-icons";
import { emit, listen } from "@tauri-apps/api/event";
import { windowService } from "../../services/windowService";
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
  flattenCommands,
  filterCommandsBySearchTerm,
} from "../../utils/configLoader";
import { useAppStore } from "../../stores/appStore";
import {
  loadFastbootCommandsConfig,
  saveFastbootCommandsConfig,
  watchFastbootConfigFile,
} from "../../utils/configLoader";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    height: "100%",
    overflow: "hidden", // 修改为hidden，防止整个页面滚动
  },
  mainCard: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: "16px",
  },
  controlsSection: {
    height: "30%",
    minHeight: "100px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    padding: "8px",
  },
  topControlsRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  commandInputContainer: {
    flex: 1,
    display: "flex",
    gap: "8px",
  },
  commandInputField: {
    flex: 1,
  },
  quickCommandButton: {
    whiteSpace: "nowrap",
  },
  searchAndActionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  searchContainer: {
    flex: 1,
    width: "400px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  outputSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "380px",
    height: "380px",
    maxHeight: "380px",
  },
  outputContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    overflow: "hidden",
    height: "100%", // 确保容器占满整个输出区域
  },
  outputContent: {
    flex: 1,
    overflow: "auto", // 保持滚动功能
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    height: "100%", // 确保内容区域占满容器
    "& pre": {
      margin: 0,
      fontFamily: '"Cascadia Code", Consolas, monospace',
      fontSize: "13px",
      lineHeight: "1.5",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
  },
  dialogBody: {
    maxHeight: "60vh",
    overflowY: "auto",
  },
  categoryHeader: {
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "8px",
    borderRadius: "4px",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "8px",
    padding: "8px 0",
  },
  commandItem: {
    padding: "10px 12px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
  },
  selectedCommandItem: {
    backgroundColor: "var(--colorBrandBackground)",
  },
  searchMatchesInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  commandLabel: {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commandText: {
    fontFamily: '"Cascadia Code", Consolas, monospace',
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commandDescription: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    marginBottom: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commandButtons: {
    display: "flex",
    gap: "4px",
    marginTop: "auto",
  },
  executeButton: {
    flex: 1,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  deviceAndButtonsRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "16px",
    marginBottom: "12px",
    borderRadius: "8px",
  },
  buttonsContainer: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  commandInputRow: {
    width: "100%",
  },
  deviceSelectorContainer: {
    width: "400px",
    position: "relative",
  },
  deviceSelector: {
    position: "relative",
    width: "100%",
  },
  deviceDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: 1000,
    maxHeight: "400px",
    overflowY: "auto",
    marginTop: "4px",
  },
  deviceDropdownItem: {
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderBottom: "1px solid var(--colorNeutralStroke1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
});

// 添加全局样式来支持高亮显示
const globalStyles = `
  .highlighted-text {
    background-color: #ffff00;
    color: #000000;
    font-weight: bold;
  }
  .current-match {
    background-color: #ff6b35;
    color: #ffffff;
    font-weight: bold;
    box-shadow: 0 0 4px rgba(255, 107, 53, 0.5);
  }
`;

// 注入全局样式
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = globalStyles;
  if (!document.head.querySelector("style[data-highlight-styles]")) {
    styleElement.setAttribute("data-highlight-styles", "true");
    document.head.appendChild(styleElement);
  }
}

const CommandExecutePanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { devices, selectedDevice, selectDevice } = useDeviceStore();
  const { deviceService, startScanning } = useDeviceService();
  const { setStatusBarMessage, config } = useAppStore();

  // 获取设备显示名称
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const getDeviceDisplayName = (device: DeviceInfo) => {
    if (!device) return t("command_panel.device_unknown");

    const { properties, mode, serial } = device;

    // 优先使用品牌+型号，其次使用设备代号，最后使用序列号

    return serial;
  };

  // 获取设备模式显示文本
  const getDeviceModeText = (mode: DeviceMode) => {
    switch (mode) {
      case "sys":
        return t("command_panel.mode_sys");
      case "rec":
        return t("command_panel.mode_rec");
      case "fastboot":
        return t("command_panel.mode_fastboot");
      case "fastbootd":
        return t("command_panel.mode_fastbootd");
      case "sideload":
        return t("command_panel.mode_sideload");
      case "edl":
        return t("command_panel.mode_edl");
      case "unauthorized":
        return t("command_panel.mode_unauthorized");
      case "offline":
        return t("command_panel.mode_offline");
      default:
        return t("command_panel.mode_unknown");
    }
  };

  // 获取设备状态颜色
  const getDeviceStatusColor = (device: DeviceInfo) => {
    if (!device.connected) return "#999";

    switch (device.mode) {
      case "sys":
        return "#4CAF50"; // 绿色
      case "rec":
        return "#FF9800"; // 橙色
      case "fastboot":
      case "fastbootd":
        return "#2196F3"; // 蓝色
      case "sideload":
        return "#9C27B0"; // 紫色
      case "edl":
        return "#F44336"; // 红色
      case "unauthorized":
        return "#FF5722"; // 深橙色
      case "offline":
        return "#607D8B"; // 蓝灰色
      default:
        return "#9E9E9E"; // 灰色
    }
  };

  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isQuickCommandDialogOpen, setIsQuickCommandDialogOpen] =
    useState(false);
  const [dialogSearchTerm, setDialogSearchTerm] = useState("");
  const [commandsConfig, setCommandsConfig] =
    useState<AdbCommandsConfig | null>(null);
  const [, setConfigLoading] = useState(true);

  // 统一面板相关状态
  const [isUnifiedPanelOpen, setIsUnifiedPanelOpen] = useState(false);
  const [unifiedPanelSearchTerm, setUnifiedPanelSearchTerm] = useState("");

  // 编辑相关状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<AdbCommand | null>(null);
  const [editingCategory, setEditingCategory] =
    useState<CommandCategory | null>(null);
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const outputRef = useRef<HTMLPreElement>(null);

  // 加载配置文件 - 根据设备模式决定加载哪个配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        // 根据当前选中的设备模式决定加载哪个配置
        const isFastbootMode =
          selectedDevice?.mode === "fastboot" ||
          selectedDevice?.mode === "fastbootd";

        let config;
        if (isFastbootMode) {
          config = await loadFastbootCommandsConfig();
        } else {
          config = await loadAdbCommandsConfig();
        }

        setCommandsConfig(config);
      } catch (error) {
        console.error("加载命令配置失败:", error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();

    // 启动文件监听
    let stopWatching: (() => void) | undefined;

    const startWatching = async () => {
      try {
        // 根据当前选中的设备模式决定监听哪个配置文件
        const isFastbootMode =
          selectedDevice?.mode === "fastboot" ||
          selectedDevice?.mode === "fastbootd";

        if (isFastbootMode) {
          stopWatching = await watchFastbootConfigFile((newConfig) => {
            console.log("Fastboot配置文件已更新，重新加载配置");
            setCommandsConfig(newConfig);
            setStatusBarMessage({
              type: "info",
              message: t("command_panel.config_updated", { type: "Fastboot" }),
            });
          });
        } else {
          stopWatching = await watchConfigFile((newConfig) => {
            console.log("ADB配置文件已更新，重新加载配置");
            setCommandsConfig(newConfig);
            setStatusBarMessage({
              type: "info",
              message: t("command_panel.config_updated", { type: "ADB" }),
            });
          });
        }
      } catch (error) {
        console.error("启动文件监听失败:", error);
      }
    };

    startWatching();

    // 清理函数
    return () => {
      if (stopWatching) {
        stopWatching();
      }
    };
  }, [setStatusBarMessage, selectedDevice?.mode]);

  // 新增：监听从AI助手发过来的代码运行请求
  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen<{ command: string }>("execute-command-from-ai", (event) => {
        if (event.payload && event.payload.command) {
          let aiCmd = event.payload.command.trim();
          
          // 如果命令以 adb 或 fastboot 开头，去掉它（因为 executeCommand 会自动补充并添加设备号）
          if (aiCmd.startsWith("adb ")) {
            aiCmd = aiCmd.substring(4).trim();
          } else if (aiCmd.startsWith("fastboot ")) {
            aiCmd = aiCmd.substring(9).trim();
          }

          // 进一步清理 AI 可能包含的 -s <serial> 
          aiCmd = aiCmd.replace(/^-s\s+(?:"[^"]*"|\S+)\s+/, "");

          executeCommand(aiCmd);
        }
      });
      return unlisten;
    };
    
    let unlistenFn: (() => void) | undefined;
    setupListener().then(fn => unlistenFn = fn);

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [selectedDevice]); 

  // 加载配置文件
  useEffect(() => {
    loadAdbCommandsConfig();
  }, []);

  // 监听设备状态变化，确保设备列表为空时清除选中设备
  useEffect(() => {
    if (devices.length === 0 && selectedDevice) {
      // 设备列表为空，清除选中的设备
      selectDevice(null);
      setStatusBarMessage({
        type: "warning",
        message: t("command_panel.device_disconnected"),
      });
    } else if (devices.length > 0 && !selectedDevice) {
      // 有设备但没有选中
      if (devices.length === 1) {
        // 只有一个设备，自动选择
        selectDevice(devices[0]);
        setStatusBarMessage({
          type: "success",
          message: t("command_panel.device_auto_selected", {
            name: getDeviceDisplayName(devices[0]),
          }),
        });
      } else {
        // 多个设备，提示用户选择
        setStatusBarMessage({
          type: "info",
          message: t("command_panel.device_select_prompt", {
            count: devices.length,
          }),
        });
      }
    }
  }, [devices, selectedDevice, selectDevice, setStatusBarMessage]);

  // 处理对话框打开状态变化的函数
  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsQuickCommandDialogOpen(isOpen);
  };

  // 计算匹配项数量和位置
  const searchMatches = useMemo<
    Array<{ index: number; text: string; length: number }>
  >(() => {
    if (!searchTerm.trim() || !output) {
      return [];
    }
    const regex = new RegExp(
      searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi",
    );
    const matches = [];
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

  // 获取扁平化的命令列表
  const allCommands = useMemo(() => {
    if (!commandsConfig) return [];
    return flattenCommands(commandsConfig.categories);
  }, [commandsConfig]);

  // 获取过滤后的命令分类
  const filteredCommands = useMemo(() => {
    if (!commandsConfig) return [];
    return filterCommandsBySearchTerm(
      commandsConfig.categories,
      dialogSearchTerm,
    );
  }, [commandsConfig, dialogSearchTerm]);

  // 获取统一面板过滤后的命令分类
  const unifiedPanelFilteredCommands = useMemo(() => {
    if (!commandsConfig) return [];
    return filterCommandsBySearchTerm(
      commandsConfig.categories,
      unifiedPanelSearchTerm,
    );
  }, [commandsConfig, unifiedPanelSearchTerm]);

  // 处理搜索高亮显示
  const highlightedOutput = useMemo(() => {
    if (!searchTerm.trim() || !output || searchMatches.length === 0) {
      return output;
    }

    let result = output;
    let offset = 0;

    searchMatches.forEach((match, index) => {
      const isCurrentMatch = index === currentMatchIndex;
      const className = isCurrentMatch ? "current-match" : "highlighted-text";
      const id = isCurrentMatch
        ? "current-search-match"
        : `search-match-${index}`;

      const before = result.substring(0, match.index + offset);
      const matchText = result.substring(
        match.index + offset,
        match.index + offset + match.length,
      );
      const after = result.substring(match.index + offset + match.length);

      const replacement = `<mark class="${className}" id="${id}">${matchText}</mark>`;
      result = before + replacement + after;

      offset += replacement.length - match.length;
    });

    return result;
  }, [output, searchTerm, searchMatches, currentMatchIndex]);

  // 搜索导航功能
  const navigateToMatch = useCallback(() => {
    if (searchMatches.length === 0) return;

    // 循环导航到下一个匹配项
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);

    // 滚动到当前匹配项
    setTimeout(() => {
      const currentElement = document.getElementById("current-search-match");
      if (currentElement && outputRef.current) {
        currentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    }, 100);
  }, [searchMatches.length, currentMatchIndex]);

  // 重置搜索状态
  const resetSearch = useCallback(() => {
    setCurrentMatchIndex(0);
  }, []);

  // 当搜索词改变时重置索引
  useEffect(() => {
    resetSearch();
  }, [searchTerm, resetSearch]);

  // 执行命令的通用函数
  const executeCommand = async (cmd: string) => {
    // Clear output immediately when starting new command
    setOutput("");
    setCommand(cmd);

    // 检查命令是否为空
    if (!cmd.trim()) {
      setStatusBarMessage({
        type: "error",
        message: t("command_panel.command_empty"),
      });
      return;
    }

    // 检查是否有选中的设备
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "error",
        message: t("command_panel.select_device_first"),
      });
      setOutput(`Error: ${t("command_panel.select_device_first")}\n`);
      return;
    }

    setIsExecuting(true);

    // 根据设备模式决定执行哪种命令
    const isFastbootMode =
      selectedDevice.mode === "fastboot" || selectedDevice.mode === "fastbootd";
    const commandType = isFastbootMode ? "Fastboot" : "ADB";

    setStatusBarMessage({
      type: "info",
      message: t("command_panel.executing_command", {
        type: commandType,
        device: getDeviceDisplayName(selectedDevice),
      }),
    });

    try {
      const parts = cmd.trim().split(" ");
      const commandName = parts[0];
      const args = parts.slice(1);

      console.log(`执行${commandType}命令:`, {
        command: commandName,
        args,
        device: selectedDevice.serial,
      });

      let result;

      if (isFastbootMode) {
        // 使用 fastboot 命令执行
        result = await deviceService.executeFastbootCommand(
          selectedDevice.serial,
          commandName,
          args,
          30,
        );
      } else {
        // 使用 ADB 命令执行
        result = await deviceService.executeAdbCommand(
          selectedDevice.serial,
          commandName,
          args,
          30,
        );
      }

      const timestamp = new Date().toLocaleTimeString();
      const deviceInfo = `[${getDeviceDisplayName(selectedDevice)}]`;
      const commandPrefix = isFastbootMode ? "fastboot" : "adb";
      const newOutput = `[${timestamp}] ${deviceInfo} $ ${commandPrefix} -s ${selectedDevice.serial} ${cmd}\n`;

      if (result.success) {
        setOutput((prev) => prev + newOutput + result.output + "\n\n");
        // 显示命令执行成功提示
        const truncatedCmd =
          cmd.length > 30 ? cmd.substring(0, 30) + "..." : cmd;
        setStatusBarMessage({
          type: "success",
          message: t("command_panel.command_executed", {
            cmd: truncatedCmd,
            device: getDeviceDisplayName(selectedDevice),
          }),
        });
      } else {
        setOutput(
          (prev) =>
            prev + newOutput + `错误: ${result.error || "命令执行失败"}\n\n`,
        );
        // 显示命令执行失败提示
        setStatusBarMessage({
          type: "error",
          message: result.error || t("command_panel.exec_failed"),
        });
      }
    } catch (error) {
      console.error("执行命令出错:", error);
      const timestamp = new Date().toLocaleTimeString();
      const deviceInfo = `[${getDeviceDisplayName(selectedDevice)}]`;
      const errorMsg = error instanceof Error ? error.message : String(error);
      setOutput(
        (prev) => prev + `[${timestamp}] ${deviceInfo} 错误: ${errorMsg}\n\n`,
      );
      // 显示命令执行失败提示
      setStatusBarMessage({
        type: "error",
        message: errorMsg,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // 统一面板相关函数
  const openUnifiedPanel = () => {
    setIsUnifiedPanelOpen(true);
    setUnifiedPanelSearchTerm("");
  };

  const closeUnifiedPanel = () => {
    setIsUnifiedPanelOpen(false);
    setUnifiedPanelSearchTerm("");
  };

  // 处理命令执行
  const handleExecuteCommand = (command: AdbCommand) => {
    closeUnifiedPanel();
    executeCommand(command.command);
  };

  // 处理命令编辑
  const handleEditCommand = (
    command: AdbCommand,
    category: CommandCategory,
  ) => {
    setEditingCommand(command);
    setEditingCategory(category);
    setEditForm({
      id: command.id,
      label: command.label,
      command: command.command,
      description: command.description,
    });
    setIsAddingNewCommand(false);
    setIsEditDialogOpen(true);
  };

  // 处理命令删除
  const handleDeleteCommand = async (
    command: AdbCommand,
    category: CommandCategory,
  ) => {
    await deleteCommand(command, category);
  };

  const clearOutput = () => {
    setOutput("");
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  // AI 助手执行
  const handleAIChatCommand = async () => {
    const prompt = `我需要你帮我执行 ADB 命令。我会输入自然语言，请将其转换为正确的 ADB 命令并解释。\n当前选中的设备序列号是: ${selectedDevice?.serial || "未知"}\n请在回答中直接给出命令，方便我复制，并在其后提供简单的功能说明。`;

    // 发送同步事件
    await emit("ai-prompt-sync", { prompt });

    // 打开并聚焦 AI 窗口
    await windowService.openAIChatWindow(config.theme === "dark");
  };

  // AI 解释输出
  const handleAIExplain = async () => {
    if (!output.trim()) return;

    const prompt = `请解释以下终端输出内容：\n\n\`\`\`\n${output}\n\`\`\``;

    // 发送同步事件
    await emit("ai-prompt-sync", { prompt });

    // 打开并聚焦 AI 窗口
    await windowService.openAIChatWindow(config.theme === "dark");
  };

  // 根据搜索词过滤快捷命令
  const getFilteredCommands = () => {
    return filteredCommands;
  };

  // 编辑命令相关函数
  const openEditCommandDialog = (
    command: AdbCommand,
    category: CommandCategory,
  ) => {
    setEditingCommand(command);
    setEditingCategory(category);
    setEditForm({
      id: command.id,
      label: command.label,
      command: command.command,
      description: command.description,
    });
    setIsAddingNewCommand(false);
    setIsEditDialogOpen(true);
  };

  const openAddCommandDialog = (category: CommandCategory) => {
    setEditingCategory(category);
    setEditForm({
      id: "",
      label: "",
      command: "",
      description: "",
    });
    setIsAddingNewCommand(true);
    setIsEditDialogOpen(true);
  };

  const openAddCategoryDialog = () => {
    setCategoryForm({
      id: "",
      name: "",
      description: "",
    });
    setIsAddingNewCategory(true);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingCommand(null);
    setEditingCategory(null);
    setIsAddingNewCommand(false);
    setIsAddingNewCategory(false);
  };

  const saveCommand = async () => {
    if (!commandsConfig || !editingCategory) return;

    try {
      const updatedConfig = { ...commandsConfig };
      const categoryIndex = updatedConfig.categories.findIndex(
        (cat) => cat.id === editingCategory.id,
      );

      if (categoryIndex === -1) return;

      if (isAddingNewCommand) {
        // 添加新命令
        const newCommand: AdbCommand = {
          id: editForm.id || `cmd_${Date.now()}`,
          label: editForm.label,
          command: editForm.command,
          description: editForm.description,
        };
        updatedConfig.categories[categoryIndex].commands.push(newCommand);
      } else {
        // 更新现有命令
        const commandIndex = updatedConfig.categories[
          categoryIndex
        ].commands.findIndex((cmd) => cmd.id === editingCommand?.id);

        if (commandIndex !== -1) {
          updatedConfig.categories[categoryIndex].commands[commandIndex] = {
            ...updatedConfig.categories[categoryIndex].commands[commandIndex],
            ...editForm,
          };
        }
      }

      // 根据当前设备模式决定保存到哪个配置文件
      const isFastbootMode =
        selectedDevice?.mode === "fastboot" ||
        selectedDevice?.mode === "fastbootd";
      let saveSuccess;

      if (isFastbootMode) {
        saveSuccess = await saveFastbootCommandsConfig(updatedConfig);
      } else {
        saveSuccess = await saveAdbCommandsConfig(updatedConfig);
      }

      if (saveSuccess) {
        setCommandsConfig(updatedConfig);
        closeEditDialog();
        // 显示保存成功提示
        setStatusBarMessage({
          type: "success",
          message: isAddingNewCommand ? "命令已添加" : "命令已更新",
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: "请重试",
        });
      }
    } catch (error) {
      console.error("保存命令失败:", error);
      setStatusBarMessage({
        type: "error",
        message: "请重试",
      });
    }
  };

  const deleteCommand = async (
    command: AdbCommand,
    category: CommandCategory,
  ) => {
    if (!commandsConfig) return;

    if (confirm(`确定要删除命令"${command.label}"吗？`)) {
      try {
        const updatedConfig = { ...commandsConfig };
        const categoryIndex = updatedConfig.categories.findIndex(
          (cat) => cat.id === category.id,
        );

        if (categoryIndex === -1) return;

        updatedConfig.categories[categoryIndex].commands =
          updatedConfig.categories[categoryIndex].commands.filter(
            (cmd) => cmd.id !== command.id,
          );

        // 根据当前设备模式决定保存到哪个配置文件
        const isFastbootMode =
          selectedDevice?.mode === "fastboot" ||
          selectedDevice?.mode === "fastbootd";
        let saveSuccess;

        if (isFastbootMode) {
          saveSuccess = await saveFastbootCommandsConfig(updatedConfig);
        } else {
          saveSuccess = await saveAdbCommandsConfig(updatedConfig);
        }

        if (saveSuccess) {
          setCommandsConfig(updatedConfig);
          // 显示删除成功提示
          setStatusBarMessage({
            type: "success",
            message: `命令"${command.label}"已删除`,
          });
        } else {
          setStatusBarMessage({
            type: "error",
            message: "请重试",
          });
        }
      } catch (error) {
        console.error("删除命令失败:", error);
        setStatusBarMessage({
          type: "error",
          message: "请重试",
        });
      }
    }
  };

  const saveCategory = async () => {
    if (!commandsConfig) return;

    try {
      const updatedConfig = { ...commandsConfig };

      if (isAddingNewCategory) {
        // 添加新分类
        const newCategory: CommandCategory = {
          id: categoryForm.id || `cat_${Date.now()}`,
          name: categoryForm.name,
          description: categoryForm.description,
          commands: [],
        };
        updatedConfig.categories.push(newCategory);
      }

      // 根据当前设备模式决定保存到哪个配置文件
      const isFastbootMode =
        selectedDevice?.mode === "fastboot" ||
        selectedDevice?.mode === "fastbootd";
      let saveSuccess;

      if (isFastbootMode) {
        saveSuccess = await saveFastbootCommandsConfig(updatedConfig);
      } else {
        saveSuccess = await saveAdbCommandsConfig(updatedConfig);
      }

      if (saveSuccess) {
        setCommandsConfig(updatedConfig);
        closeEditDialog();
        // 显示保存成功提示
        setStatusBarMessage({
          type: "success",
          message: isAddingNewCategory ? "分类已添加" : "分类已更新",
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: "请重试",
        });
      }
    } catch (error) {
      console.error("保存分类失败:", error);
      setStatusBarMessage({
        type: "error",
        message: "请重试",
      });
    }
  };

  const deleteCategory = async (category: CommandCategory) => {
    if (!commandsConfig) return;

    if (confirm(`确定要删除分类"${category.name}"及其所有命令吗？`)) {
      try {
        const updatedConfig = { ...commandsConfig };
        updatedConfig.categories = updatedConfig.categories.filter(
          (cat) => cat.id !== category.id,
        );

        // 根据当前设备模式决定保存到哪个配置文件
        const isFastbootMode =
          selectedDevice?.mode === "fastboot" ||
          selectedDevice?.mode === "fastbootd";
        let saveSuccess;

        if (isFastbootMode) {
          saveSuccess = await saveFastbootCommandsConfig(updatedConfig);
        } else {
          saveSuccess = await saveAdbCommandsConfig(updatedConfig);
        }

        if (saveSuccess) {
          setCommandsConfig(updatedConfig);
          // 显示删除成功提示
          setStatusBarMessage({
            type: "success",
            message: `分类"${category.name}"及其所有命令已删除`,
          });
        } else {
          setStatusBarMessage({
            type: "error",
            message: "请重试",
          });
        }
      } catch (error) {
        console.error("删除分类失败:", error);
        setStatusBarMessage({
          type: "error",
          message: "请重试",
        });
      }
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.mainCard}>
        <div className={styles.cardContent}>
          {/* 上部分：控制区域 */}
          <div className={styles.controlsSection}>
            {/* 第一行：设备选择器、执行按钮和快捷命令按钮 */}
            <div className={styles.deviceAndButtonsRow}>
              {/* 设备选择器 */}
              <Field
                style={{ marginBottom: 0, width: "400px", borderRadius: "8px" }}
              >
                <div className={styles.deviceSelector}>
                  <Button
                    appearance="outline"
                    onClick={() =>
                      setIsDeviceDropdownOpen(!isDeviceDropdownOpen)
                    }
                    disabled={devices.length === 0}
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      backgroundColor:
                        selectedDevice?.mode === "fastboot" ||
                        selectedDevice?.mode === "fastbootd"
                          ? "var(--colorNeutralBackground1)"
                          : "var(--colorNeutralBackground2)",
                    }}
                  >
                    {selectedDevice ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          borderRadius: "8px",
                          maxWidth: "200px",
                          maxHeight: "32px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            minWidth: "80px",
                          }}
                        >
                          选择设备：
                        </span>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                              getDeviceStatusColor(selectedDevice),
                            minWidth: "8px",
                            minHeight: "8px",
                          }}
                        />
                        <span
                          style={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            minWidth: "150px",
                          }}
                        >
                          {getDeviceDisplayName(selectedDevice)}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--colorNeutralForeground3)",
                            minWidth: "50px",
                          }}
                        >
                          [{getDeviceModeText(selectedDevice.mode)}]
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>
                        {devices.length === 0 ? "无设备" : "请选择设备"}
                      </span>
                    )}
                    <ChevronDown24Regular
                      style={{
                        transform: isDeviceDropdownOpen
                          ? "rotate(180deg)"
                          : "rotate(0)",
                        transition: "transform 0.2s",
                      }}
                    />
                  </Button>

                  {isDeviceDropdownOpen && (
                    <div className={styles.deviceDropdown}>
                      {devices.length === 0 ? (
                        <div className={styles.deviceDropdownItem}>
                          <Text
                            size={200}
                            style={{ color: "var(--colorNeutralForeground3)" }}
                          >
                            无可用设备
                          </Text>
                        </div>
                      ) : (
                        devices.map((device) => (
                          <div
                            key={device.serial}
                            className={styles.deviceDropdownItem}
                            onClick={() => {
                              selectDevice(device);
                              setIsDeviceDropdownOpen(false);
                              setStatusBarMessage({
                                type: "info",
                                message: `已选择设备: ${getDeviceDisplayName(device)}`,
                              });
                            }}
                            style={{
                              backgroundColor:
                                selectedDevice?.serial === device.serial
                                  ? "var(--colorNeutralBackground1Selected)"
                                  : "transparent",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: getDeviceStatusColor(device),
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    size={200}
                                    weight="semibold"
                                    style={{
                                      textOverflow: "ellipsis",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                      maxWidth: "180px",
                                    }}
                                  >
                                    {getDeviceDisplayName(device)}
                                  </Text>
                                  <Text
                                    size={200}
                                    style={{
                                      color: "var(--colorNeutralForeground3)",
                                    }}
                                  >
                                    [{getDeviceModeText(device.mode)}]
                                  </Text>
                                </div>
                                <Text
                                  size={200}
                                  style={{
                                    color: "var(--colorNeutralForeground3)",
                                  }}
                                >
                                  {device.serial}
                                </Text>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Field>

              {/* 执行按钮和快捷命令按钮 */}
              <div className={styles.buttonsContainer}>
                <Button
                  icon={<Bot24Regular />}
                  appearance="subtle"
                  onClick={handleAIChatCommand}
                  disabled={isExecuting}
                  style={{ marginRight: "8px" }}
                >
                  AI 助手执行
                </Button>
                <Button
                  appearance="primary"
                  icon={<Play24Regular />}
                  onClick={() => executeCommand(command)}
                  disabled={isExecuting || !command.trim() || !selectedDevice}
                  style={{ marginRight: "8px" }}
                >
                  {isExecuting ? "执行中..." : "执行"}
                </Button>
                <Button
                  className={styles.quickCommandButton}
                  icon={<ChevronDown24Regular />}
                  onClick={openUnifiedPanel}
                  disabled={isExecuting}
                >
                  快捷命令
                </Button>
              </div>
            </div>

            {/* 设备选择和命令输入 */}
            <div className={styles.topControlsRow}>
              {/* 第二行：命令输入 */}
              <div className={styles.commandInputRow}>
                <Field style={{ marginBottom: 0, width: "100%" }}>
                  <Field
                    label={
                      selectedDevice &&
                      (selectedDevice.mode === "fastboot" ||
                        selectedDevice.mode === "fastbootd")
                        ? "Fastboot命令（注意：输入命令请谨慎，因输入错误命令导致的问题我们概不负责）"
                        : "ADB命令（注意：输入命令请谨慎，因输入错误命令导致的问题我们概不负责）"
                    }
                  >
                    <Input
                      value={command}
                      onChange={(_, data) => setCommand(data.value)}
                      placeholder={
                        selectedDevice &&
                        (selectedDevice.mode === "fastboot" ||
                          selectedDevice.mode === "fastbootd")
                          ? "例如: devices"
                          : "例如: shell getprop ro.product.model"
                      }
                      disabled={isExecuting || !selectedDevice}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          executeCommand(command);
                        }
                      }}
                    />
                  </Field>
                </Field>
              </div>
            </div>

            {/* 搜索框和操作按钮 */}
            <div className={styles.searchAndActionsRow}>
              <div className={styles.searchContainer}>
                <Input
                  placeholder="搜索输出..."
                  value={searchTerm}
                  onChange={(_, data) => setSearchTerm(data.value)}
                  contentBefore={<Search24Regular />}
                  disabled={!output}
                />
              </div>
              <div className={styles.actionButtons}>
                {searchTerm && searchMatches.length > 0 && (
                  <div className={styles.searchMatchesInfo}>
                    <Text size={200}>
                      {t("command_panel.matches_found", {
                        count: searchMatches.length,
                      })}
                    </Text>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={navigateToMatch}
                      disabled={!searchTerm || searchMatches.length === 0}
                    >
                      {t("command_panel.next_match")}
                    </Button>
                  </div>
                )}
                <Button
                  appearance="subtle"
                  icon={<Sparkle24Regular />}
                  onClick={handleAIExplain}
                  disabled={!output}
                  title={t("command_panel.ai_explain_tooltip")}
                />
                <Button
                  appearance="subtle"
                  icon={<Copy24Regular />}
                  onClick={copyOutput}
                  disabled={!output}
                  title={t("command_panel.copy_output")}
                />
                <Button
                  appearance="subtle"
                  icon={<Delete24Regular />}
                  onClick={clearOutput}
                  disabled={!output}
                  title={t("command_panel.clear_output")}
                />
              </div>
            </div>
          </div>

          {/* 下部分：输出区域 */}
          <div className={styles.outputSection}>
            <div className={styles.outputContainer}>
              <div className={styles.outputContent}>
                <pre
                  ref={outputRef}
                  dangerouslySetInnerHTML={{
                    __html:
                      highlightedOutput ||
                      `<span style="color: #888">${t("command_panel.output_placeholder")}</span>`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 统一快捷命令面板 */}
      <Dialog
        open={isUnifiedPanelOpen}
        onOpenChange={(event, data) => {
          if (!data.open) closeUnifiedPanel();
        }}
        modalType="modal"
      >
        <DialogSurface style={{ width: "900px", maxWidth: "90vw" }}>
          <DialogBody>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <DialogTitle>{t("command_panel.quick_commands")}</DialogTitle>
            </div>

            <DialogContent className={styles.dialogBody}>
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <Input
                  placeholder={t("command_panel.search_commands")}
                  value={unifiedPanelSearchTerm}
                  onChange={(_, data) => setUnifiedPanelSearchTerm(data.value)}
                  contentBefore={<Search24Regular />}
                  style={{ flex: 1 }}
                />
                <Button
                  appearance="primary"
                  size="small"
                  icon={<Add24Regular />}
                  onClick={openAddCategoryDialog}
                >
                  {t("command_panel.add_category")}
                </Button>
              </div>

              {unifiedPanelFilteredCommands.map((category, categoryIndex) => (
                <div key={categoryIndex} style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div className={styles.categoryHeader}>{category.name}</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Add24Regular />}
                        onClick={() => openAddCommandDialog(category)}
                      >
                        {t("command_panel.add_command")}
                      </Button>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Delete24Regular />}
                        onClick={() => deleteCategory(category)}
                        disabled={category.commands.length > 0}
                        title={
                          category.commands.length > 0
                            ? t("command_panel.delete_category_hint")
                            : t("command_panel.delete_category")
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.commandGrid}>
                    {category.commands.map((cmd, cmdIndex) => (
                      <div key={cmdIndex} className={styles.commandItem}>
                        <div style={{ paddingRight: "8px" }}>
                          <div
                            className={styles.commandLabel}
                            title={cmd.label}
                          >
                            {cmd.label}
                          </div>
                          <div
                            className={styles.commandText}
                            title={cmd.command}
                          >
                            {cmd.command}
                          </div>
                          {cmd.description && (
                            <div
                              className={styles.commandDescription}
                              title={cmd.description}
                            >
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        <div className={styles.commandButtons}>
                          <Button
                            appearance="primary"
                            size="small"
                            icon={<Play24Regular />}
                            onClick={() => handleExecuteCommand(cmd)}
                            className={styles.executeButton}
                          >
                            {t("command_panel.execute")}
                          </Button>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Edit24Regular />}
                            onClick={() => handleEditCommand(cmd, category)}
                            className={styles.editButton}
                          >
                            {t("command_panel.edit")}
                          </Button>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Delete24Regular />}
                            onClick={() => handleDeleteCommand(cmd, category)}
                            className={styles.deleteButton}
                            title={t("command_panel.delete_command")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {unifiedPanelFilteredCommands.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--colorNeutralForeground3)",
                  }}
                >
                  {unifiedPanelSearchTerm
                    ? t("command_panel.no_matches")
                    : t("command_panel.no_commands")}
                </div>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={closeUnifiedPanel}>
                {t("command_panel.close")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 编辑命令对话框 */}
      <Dialog
        open={
          isEditDialogOpen &&
          (isAddingNewCommand || isAddingNewCategory || !!editingCommand)
        }
        onOpenChange={(event, data) => {
          if (!data.open) closeEditDialog();
        }}
        modalType="modal"
      >
        <DialogSurface>
          <DialogBody>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <DialogTitle>
                {isAddingNewCategory
                  ? t("command_panel.add_new_category")
                  : isAddingNewCommand
                    ? t("command_panel.add_new_command")
                    : t("command_panel.edit_command")}
              </DialogTitle>
            </div>

            <DialogContent className={styles.dialogBody}>
              {isAddingNewCategory ? (
                // 添加新分类表单
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <Field label={t("command_panel.category_id")}>
                    <Input
                      value={categoryForm.id}
                      onChange={(_, data) =>
                        setCategoryForm({ ...categoryForm, id: data.value })
                      }
                      placeholder={t("command_panel.placeholder_category_id")}
                    />
                  </Field>
                  <Field label={t("command_panel.category_name")}>
                    <Input
                      value={categoryForm.name}
                      onChange={(_, data) =>
                        setCategoryForm({ ...categoryForm, name: data.value })
                      }
                      placeholder={t("command_panel.placeholder_category_name")}
                    />
                  </Field>
                  <Field label={t("command_panel.category_desc")}>
                    <Input
                      value={categoryForm.description}
                      onChange={(_, data) =>
                        setCategoryForm({
                          ...categoryForm,
                          description: data.value,
                        })
                      }
                      placeholder={t("command_panel.placeholder_category_desc")}
                    />
                  </Field>
                </div>
              ) : (
                // 编辑命令或添加新命令表单
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {!isAddingNewCommand && (
                    <Field label={t("command_panel.select_category")}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        {commandsConfig?.categories.map((cat) => (
                          <Button
                            key={cat.id}
                            appearance={
                              editingCategory?.id === cat.id
                                ? "primary"
                                : "subtle"
                            }
                            size="small"
                            onClick={() => setEditingCategory(cat)}
                          >
                            {cat.name}
                          </Button>
                        ))}
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Add24Regular />}
                          onClick={openAddCategoryDialog}
                        >
                          {t("command_panel.add_category")}
                        </Button>
                      </div>
                    </Field>
                  )}

                  <Field label={t("command_panel.command_id")}>
                    <Input
                      value={editForm.id}
                      onChange={(_, data) =>
                        setEditForm({ ...editForm, id: data.value })
                      }
                      placeholder={t("command_panel.placeholder_command_id")}
                      disabled={!isAddingNewCommand}
                    />
                  </Field>
                  <Field label={t("command_panel.command_name")}>
                    <Input
                      value={editForm.label}
                      onChange={(_, data) =>
                        setEditForm({ ...editForm, label: data.value })
                      }
                      placeholder={t("command_panel.placeholder_command_name")}
                    />
                  </Field>
                  <Field label={t("command_panel.adb_command")}>
                    <Input
                      value={editForm.command}
                      onChange={(_, data) =>
                        setEditForm({ ...editForm, command: data.value })
                      }
                      placeholder={t("command_panel.placeholder_command")}
                    />
                  </Field>
                  <Field label={t("command_panel.command_desc")}>
                    <Input
                      value={editForm.description}
                      onChange={(_, data) =>
                        setEditForm({ ...editForm, description: data.value })
                      }
                      placeholder={t("command_panel.placeholder_command_desc")}
                    />
                  </Field>
                </div>
              )}
            </DialogContent>

            <DialogActions>
              <Button appearance="subtle" onClick={closeEditDialog}>
                {t("command_panel.cancel")}
              </Button>
              <Button
                appearance="primary"
                icon={<Save24Regular />}
                onClick={isAddingNewCategory ? saveCategory : saveCommand}
                disabled={
                  isAddingNewCategory
                    ? !categoryForm.name.trim()
                    : !editForm.label.trim() || !editForm.command.trim()
                }
              >
                {t("command_panel.save")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default CommandExecutePanel;
