import React, { useState, useRef, useEffect } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Textarea,
  Text,
  Avatar,
  Divider,
  mergeClasses,
  Tooltip,
  Spinner,
  Switch,
  Checkbox,
  Select,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import {
  Send24Regular,
  Add24Regular,
  Delete24Regular,
  History24Regular,
  Chat24Regular,
  Bot24Regular,
  Person24Regular,
  Copy24Regular,
  Copy16Regular,
  Play24Regular,
  PanelLeft24Regular,
  PanelRight24Regular,
  ArrowDownload24Regular,
  Sparkle24Regular,
  Sparkle20Regular,
  DocumentAdd24Regular,
  DismissCircle24Regular,
  Wrench24Regular,
  Server24Regular,
  Checkmark24Regular,
  Open24Regular,
  Dismiss24Regular,
  Search24Regular,
  Settings24Regular,
  Edit24Regular,
  Wand24Regular,
  RecordStop20Regular,
  Camera24Regular,
  ShieldCheckmark24Regular,
  ShieldDismiss24Regular,
  ShieldError24Regular,
  Play16Regular,
  Checkmark16Regular,
  ChevronDown16Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "../../stores/aiChatStore";
import { useAppStore } from "../../stores/appStore";
import { logService } from "../../services/logService";
import { aiService, ChatToolCall } from "../../services/aiService";
import { useMcpStore, ADMT_BUILTIN_MCP_TOOLS, PRESET_AI_SKILLS, AISkillResource, McpToolDefinition } from "../../stores/mcpStore";
import { executeMcpTool } from "../../services/mcpExecutor";
import { listen, emit } from "@tauri-apps/api/event";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  container: {
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  historyItemTitle: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "13px",
  },
  diagnoseCard: {
    padding: "16px",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    gap: "6px",
    transition: "all 0.18s ease",
    ":hover": {
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  chatHeader: {
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "var(--colorNeutralBackground1)",
    minHeight: "48px",
    height: "48px",
    maxHeight: "48px",
    flexShrink: 0,
    flexWrap: "nowrap",
    overflow: "hidden",
    whiteSpace: "nowrap",
    gap: "10px",
    boxSizing: "border-box",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    scrollBehavior: "smooth",
    minHeight: 0,
  },
  messageGroup: {
    display: "flex",
    gap: "12px",
    maxWidth: "860px",
    width: "100%",
    margin: "0 auto",
    position: "relative",
    ":hover .bubble-actions": {
      opacity: 1,
    },
  },
  bubbleContainer: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "82%",
    minWidth: 0,
  },
  userBubbleContainer: {
    alignItems: "flex-end",
  },
  botBubbleContainer: {
    alignItems: "flex-start",
  },
  bubbleActions: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",
    opacity: 0,
    transition: "opacity 0.2s ease-in-out",
  },
  bubbleActionsVisible: {
    opacity: 1,
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  messageContent: {
    padding: "12px 18px",
    borderRadius: "14px",
    fontSize: "13.5px",
    lineHeight: "1.6",
    whiteSpace: "normal",
    wordBreak: "break-word",
    maxWidth: "100%",
    maxHeight: "65vh",
    overflowY: "auto",
    overflowX: "hidden",
  },
  userContent: {
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    border: `1px solid var(--colorBrandStroke2)`,
    borderRadius: "14px 4px 14px 14px",
  },
  botContent: {
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground1)",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "4px 14px 14px 14px",
  },
  inputArea: {
    padding: "6px 20px 10px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "var(--colorNeutralBackground1)",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: "8px",
    maxWidth: "880px",
    margin: "0 auto",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "14px",
    padding: "4px 6px 4px 12px",
    minHeight: "38px",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    ":focus-within": {
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
    },
  },
  input: {
    flex: 1,
    minHeight: "26px",
    maxHeight: "120px",
    ...shorthands.border("none"),
    backgroundColor: "transparent",
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.4",
    boxShadow: "none",
    ":after": {
      display: "none",
    },
  },
  inputToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
    marginBottom: "1px",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    maxWidth: "860px",
    width: "100%",
    margin: "0 auto",
    color: tokens.colorNeutralForeground4,
  },
  footer: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground4,
  },
  markdownWrapper: {
    "& table": {
      display: "block",
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "16px",
      fontSize: "13px",
      overflowX: "auto",
    },
    "& th, & td": {
      border: `1px solid ${tokens.colorNeutralStroke2}`,
      padding: "6px 8px",
      textAlign: "left",
      minWidth: "80px",
      fontSize: "12px",
    },
    "& th": {
      backgroundColor: tokens.colorNeutralBackground2,
      fontWeight: "bold",
    },
    "& h1, & h2, & h3, & h4": {
      margin: "16px 0 8px 0",
      lineHeight: "1.3",
    },
    "& p": {
      margin: "0 0 8px 0",
    },
    "& ul, & ol": {
      margin: "8px 0",
      paddingLeft: "24px",
    },
    "& code": {
      backgroundColor: tokens.colorNeutralBackground4,
      padding: "2px 4px",
      borderRadius: "4px",
      fontFamily: "var(--fontFamilyMonospace)",
    },
    "& pre": {
      backgroundColor: tokens.colorNeutralBackground4,
      padding: "12px",
      borderRadius: "8px",
      overflowX: "auto",
      margin: "12px 0",
      "& code": {
        padding: 0,
        backgroundColor: "transparent",
      }
    },
    "& blockquote": {
    borderLeft: `4px solid ${tokens.colorBrandForeground1}`,
      margin: "12px 0",
      paddingLeft: "16px",
      color: tokens.colorNeutralForeground2,
    }
  }
});

const AGENT_SYSTEM_PROMPT = `你是一个专业的 Android 玩机管家（ADMT）智能助手与操作代理。
你的能力范围涵盖：
1. Android 玩机、ADB/Fastboot 调试、Root (Magisk/KernelSU)、分区刷写、应用管理与救砖排障。
2. 宿主电脑系统运维与诊断：拥有在本地电脑直接运行 CMD 或 PowerShell 命令的能力（通过 admt_execute_host_command 工具）。当用户询问电脑 IP、端口占用 (如 5037 ADB 端口)、网络连通性 (ping/tracert)、环境变量或系统状态时，直接调用该工具执行对应命令（如 ipconfig, netstat -ano, ping 等）并结合输出直接回答。
3. 全网实时权威技术资料与玩机方案检索。
4. Windows 宿主环境排查：排查本地开发工具版本（Java/Python/Git）时，注意部分 Windows 系统上的 Oracle javapath (shimconsole.exe) 会因目标不存在而静默退出且无输出。若 java -version 输出为空，可进一步查询 where.exe java 或检索 C:\Program Files\Java\ 目录。排查完成后请基于所得信息给出完整的 Markdown 最终回答。

【回答准则】
- 始终以友好、专业、务实自然的人类中文回答（严禁说教、严禁生硬拒绝关于电脑或网络的合理询问）。
- 当需要读取连接设备、主机网络 IP、截屏或全网搜索时，请直接调用对应工具获取权威真实数据。
- 对于普通问答、原理说明、网络 IP 咨询或日常交流，直接以结构清晰的 Markdown 格式回答用户。
- 仅当用户的输入明确需要执行一连串具体的 ADB/Fastboot 或终端操作命令时，才在回答中给出结构化操作指导。`;

const CHAT_SYSTEM_PROMPT = `你是一个资深的 Android 系统专家和玩机助手。你可以为用户解答关于 Android 系统特性、ADB 调试、刷机教程、Magisk/KernelSU root 权限管理等各类问题。请用友好、专业的中文回答。`;

interface AgentAction {
  type: "adb_shell" | "adb_command" | "fastboot";
  command: string;
  description: string;
}

interface AgentResponse {
  thought: string;
  danger_level: "low" | "medium" | "high";
  risk_warning: string;
  actions: AgentAction[];
}

const parseAgentResponse = (content: string): AgentResponse | null => {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && "thought" in parsed && Array.isArray(parsed.actions)) {
      return parsed as AgentResponse;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
};

interface AttachedFile {
  name: string;
  path: string;
  content: string;
}

const SAFE_AUTO_EXECUTE_TOOLS = new Set([
  "yuanbao_web_search",
  "admt_get_devices",
  "admt_get_host_info",
  "admt_execute_host_command",
  "admt_get_device_info",
  "admt_take_screenshot",
  "admt_list_packages",
]);

const PROVIDER_LABELS: Record<string, string> = {
  deepseek: "DeepSeek",
  openai: "OpenAI",
  qwen: "通义千问",
  zhipu: "智谱 GLM",
  siliconflow: "硅基流动",
  anthropic: "Claude",
  google: "Gemini",
  groq: "Groq",
  nvidia: "NVIDIA",
  local: "本地私有模型",
};

const AIChatPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [executingToolInfo, setExecutingToolInfo] = useState<{ name: string; args: any } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean[]>>({});
  const [executingMsgId, setExecutingMsgId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<Record<string, string>>({});

  // 行内命令分步执行与状态反馈
  const [inlineCmdOutputs, setInlineCmdOutputs] = useState<Record<string, { status: "running" | "success" | "error"; output: string; expanded?: boolean }>>({});
  
  // 气泡与代码块复制状态反馈
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);

  const getMessageCopyText = (msg: any): string => {
    if (msg.role === "tool") {
      if (msg.toolResult) {
        if (typeof msg.toolResult === "string") return msg.toolResult;
        if (typeof msg.toolResult === "object") {
          if (msg.toolResult.output) return msg.toolResult.output;
          if (msg.toolResult.message) return msg.toolResult.message;
          try {
            return JSON.stringify(msg.toolResult, null, 2);
          } catch {
            return String(msg.toolResult);
          }
        }
        return String(msg.toolResult);
      }
      return msg.content || "";
    }

    if (msg.content) {
      return msg.content;
    }

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      try {
        return JSON.stringify(msg.tool_calls, null, 2);
      } catch {
        return "";
      }
    }

    return "";
  };

  const handleCopyMessage = async (msg: any) => {
    const textToCopy = getMessageCopyText(msg);
    if (!textToCopy) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedMsgId(msg.id);
      setTimeout(() => {
        setCopiedMsgId((curr) => (curr === msg.id ? null : curr));
      }, 2000);
    } catch (e) {
      console.warn("复制对话气泡失败:", e);
    }
  };

  const handleCopyCode = async (code: string, key: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedCodeKey(key);
      setTimeout(() => {
        setCopiedCodeKey((curr) => (curr === key ? null : curr));
      }, 2000);
    } catch (e) {
      console.warn("复制代码失败:", e);
    }
  };
  
  // 斜杠快捷指令状态
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  const SLASH_COMMANDS = [
    { cmd: "/check", label: "整机环境与 BL/Root 一键体检", prompt: "请执行整机体检诊断，自动获取设备型号、Codename、Android 版本、Bootloader 解锁状态、Root 授权环境（Magisk/KernelSU/APatch）、SELinux 模式及电池健康状态，并输出完整诊断卡片。" },
    { cmd: "/net", label: "宿主电脑网络 IP 与端口占用诊断", prompt: "请获取当前电脑的局域网 IP 地址、主机名、网络连通性以及 ADB 5037 端口占用状态。" },
    { cmd: "/screenshot", label: "截取当前手机屏幕并分析诊断", prompt: "__ACTION_SCREENSHOT__" },
    { cmd: "/clean", label: "清空当前会话消息记录", prompt: "__ACTION_CLEAN__" },
    { cmd: "/search", label: "腾讯云元宝搜索全网玩机资料", prompt: "请针对当前手机机型，通过腾讯云元宝搜索检索全网最新官方固件、救砖方法与 TWRP 方案。" },
  ];
  
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Skills 与 MCP 统一弹窗状态
  const [isSkillsMcpModalOpen, setIsSkillsMcpModalOpen] = useState(false);
  const [skillsMcpTab, setSkillsMcpTab] = useState<"skills" | "mcp">("skills");

  // 历史记录独立弹窗状态
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");

  // AI 方案与快速配置弹窗状态
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [newPresetNameInput, setNewPresetNameInput] = useState("");
  const [quickApiKey, setQuickApiKey] = useState("");
  const [quickModel, setQuickModel] = useState("");
  const [quickProvider, setQuickProvider] = useState<string>("openai");
  const [isSavingQuickConfig, setIsSavingQuickConfig] = useState(false);
  const [presetModalTab, setPresetModalTab] = useState<"presets" | "quickConfig">("presets");

  const [isAutoMcpEnabled, setIsAutoMcpEnabled] = useState(true);
  const [activeSkillPrompt, setActiveSkillPrompt] = useState<string | null>(null);

  const [selectedMcpTool, setSelectedMcpTool] = useState<McpToolDefinition>(ADMT_BUILTIN_MCP_TOOLS[0]);
  const [mcpParamInputs, setMcpParamInputs] = useState<Record<string, string>>({
    command: "getprop ro.product.model",
    target: "system",
    query: "Android Magisk Root 教程",
    url: "https://github.com",
    filter: "all",
  });
  const [mcpTestResult, setMcpTestResult] = useState<any>(null);
  const [isTestingMcp, setIsTestingMcp] = useState(false);

  const handleApplySkill = (skill: AISkillResource, mode: "system" | "input") => {
    if (mode === "system") {
      setActiveSkillPrompt(skill.systemPrompt);
      setStatusBarMessage({
        type: "success",
        message: `已将【${skill.title}】注入为当前会话专属 System 专家设定`,
      });
      setIsSkillsMcpModalOpen(false);
    } else {
      setInputValue((prev) => (prev ? `${prev}\n\n${skill.systemPrompt}` : skill.systemPrompt));
      setIsSkillsMcpModalOpen(false);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handleRunManualMcpTool = async () => {
    if (!selectedMcpTool) return;
    setIsTestingMcp(true);
    try {
      const args: Record<string, any> = { ...mcpParamInputs };
      const res = await executeMcpTool(selectedMcpTool.name, args);
      setMcpTestResult(res);
      setStatusBarMessage({
        type: res.success ? "success" : "warning",
        message: res.success ? `MCP 工具【${selectedMcpTool.name}】执行成功` : `MCP 工具执行报错: ${res.error}`,
      });
    } catch (e: any) {
      setMcpTestResult({ success: false, error: e.message || String(e) });
    } finally {
      setIsTestingMcp(false);
    }
  };

  const handleInsertMcpResultToChat = () => {
    if (!mcpTestResult || !selectedMcpTool) return;
    const resultSnippet = `【手动调用 MCP 工具结果】\n工具名: \`${selectedMcpTool.name}\`\n输出内容:\n\`\`\`json\n${JSON.stringify(mcpTestResult, null, 2)}\n\`\`\``;
    setInputValue((prev) => (prev ? `${prev}\n\n${resultSnippet}` : resultSnippet));
    setIsSkillsMcpModalOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleUploadFile = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: "文本文件",
          extensions: ["txt", "log", "json", "xml", "prop", "cfg", "config", "ini", "sh", "bat", "yaml", "yml", "md"]
        }]
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        const loadedFiles: AttachedFile[] = [];

        for (const path of paths) {
          try {
            const content = await invoke<string>("read_chat_text_file", { path });
            const name = path.split(/[/\\]/).pop() || "未命名文件";
            
            if (attachedFiles.some(f => f.path === path) || loadedFiles.some(f => f.path === path)) {
              continue;
            }
            
            loadedFiles.push({ name, path, content });
          } catch (err: any) {
            setStatusBarMessage({
              type: "error",
              message: `读取文件失败: ${err || "未知错误"}`
            });
          }
        }

        if (loadedFiles.length > 0) {
          setAttachedFiles(prev => [...prev, ...loadedFiles]);
          setStatusBarMessage({
            type: "success",
            message: `成功添加 ${loadedFiles.length} 个文件附件`
          });
        }
      }
    } catch (e: any) {
      setStatusBarMessage({
        type: "error",
        message: `选择文件失败: ${e.message || String(e)}`
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { 
    conversations, 
    currentConversationId, 
    addMessage, 
    setCurrentConversation,
    createNewConversation,
    deleteConversation,
    clearHistory,
    isAgentMode,
    setAgentMode,
    isAutoExecute,
    setAutoExecute,
    aiPresets,
    activePresetId,
    applyPreset,
    savePreset,
    deletePreset,
    updateConversationTitle,
    clearConversationMessages,
  } = useAIChatStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [runningCmdIdx, setRunningCmdIdx] = useState<string | null>(null);
  const [cmdOutputs, setCmdOutputs] = useState<Record<string, { stdout: string; stderr: string; exitCode?: number }>>({});
  const { setStatusBarMessage, config, updateConfig, saveToDisk, setCurrentView } = useAppStore();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();

  const handleOpenPresetModal = () => {
    setQuickProvider(config.ai?.provider || "openai");
    setQuickModel(config.ai?.model || "");
    setQuickApiKey(config.ai?.apiKey || "");
    setIsPresetModalOpen(true);
  };

  const handleSaveAsPreset = () => {
    if (!newPresetNameInput.trim()) {
      setStatusBarMessage({ type: "error", message: "请输入方案名称" });
      return;
    }
    const newId = savePreset({
      name: newPresetNameInput.trim(),
      provider: (config.ai?.provider as any) || "openai",
      model: config.ai?.model || "",
      apiKey: config.ai?.apiKey || "",
      endpoint: config.ai?.endpoint || "",
      temperature: config.ai?.temperature ?? 0.7,
    });
    applyPreset(newId);
    setNewPresetNameInput("");
    setStatusBarMessage({ type: "success", message: `方案「${newPresetNameInput.trim()}」已保存并应用` });
  };

  const handleSaveQuickConfig = async () => {
    setIsSavingQuickConfig(true);
    try {
      updateConfig({
        ai: {
          ...config.ai,
          provider: quickProvider as any,
          model: quickModel,
          apiKey: quickApiKey,
        }
      });
      await saveToDisk();
      setStatusBarMessage({ type: "success", message: "AI 基础配置已保存并生效" });
    } catch (e: any) {
      setStatusBarMessage({ type: "error", message: `保存配置失败: ${e.message || String(e)}` });
    } finally {
      setIsSavingQuickConfig(false);
    }
  };
  
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = React.useMemo(() => currentConversation?.messages || [], [currentConversation?.messages]);

  const filteredConversations = React.useMemo(() => {
    if (!historySearchQuery.trim()) return conversations;
    const q = historySearchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, historySearchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unlisten = listen<{ prompt: string }>("ai-prompt-sync", (event) => {
      console.log("收到内容同步:", event.payload);
      setInputValue(event.payload.prompt);
    });
    
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "26px";
      const scrollHeight = textareaRef.current.scrollHeight;
      const targetHeight = Math.min(Math.max(scrollHeight, 26), 120);
      textareaRef.current.style.height = `${targetHeight}px`;
      
      if (scrollHeight > 120) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
      textareaRef.current.style.overflowX = "hidden";
    }
  }, [inputValue]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingText("");
    setExecutingToolInfo(null);
  };

  const runFollowupAssistantStream = async (convId: string, controller: AbortController, depth = 0) => {
    try {
      const conv = useAIChatStore.getState().conversations.find((c) => c.id === convId);
      if (!conv) return;

      const chatHistory = conv.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
        tool_calls: msg.tool_calls,
      }));

      let systemMessage = activeSkillPrompt || (isAgentMode ? AGENT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT);
      if (selectedDevice) {
        systemMessage += `\n\n【目标设备状态】\n序列号: ${selectedDevice.serial}\n型号: ${selectedDevice.properties?.model || "Android"}`;
      }

      // 确保每一个 assistant 的 tool_call 都有对应的 tool 回复，避免 OpenAI 协议抛出 400 校验错误
      const sanitizedMessages: any[] = [];
      const toolCallIdsWithResponse = new Set(
        chatHistory.filter((m) => m.role === "tool" && m.tool_call_id).map((m) => m.tool_call_id)
      );

      for (let i = 0; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        sanitizedMessages.push(msg);
        if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
          for (const tc of msg.tool_calls) {
            if (!toolCallIdsWithResponse.has(tc.id)) {
              sanitizedMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: JSON.stringify({ message: "未执行此工具调用或已由其他检索合并" }),
              });
              toolCallIdsWithResponse.add(tc.id);
            }
          }
        }
      }

      const finalMessages = [
        { role: "system" as const, content: systemMessage },
        ...sanitizedMessages,
      ];

      let followupText = "";
      setStreamingText("");
      let followupToolCalls: ChatToolCall[] = [];

      const response = await aiService.chatStream({
        messages: finalMessages,
        tools: isAutoMcpEnabled ? ADMT_BUILTIN_MCP_TOOLS : undefined,
        signal: controller.signal,
        onChunk: (chunk) => {
          followupText += chunk;
          setStreamingText(followupText);
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        },
        onToolCalls: (calls) => {
          followupToolCalls = calls;
        },
      });

      setStreamingText("");
      const finalContent = response.content || followupText;
      const effectiveToolCalls = (response.toolCalls && response.toolCalls.length > 0) ? response.toolCalls : followupToolCalls;

      // 如果模型自我纠错发起了多轮工具调用（最多允许连续 3 轮自主调用）
      if (effectiveToolCalls && effectiveToolCalls.length > 0 && depth < 3) {
        addMessage(convId, {
          role: "assistant",
          content: finalContent,
          tool_calls: effectiveToolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
          }))
        });

        const canAutoExecute = isAutoExecute || (isAutoMcpEnabled && effectiveToolCalls.every(tc => SAFE_AUTO_EXECUTE_TOOLS.has(tc.name)));
        if (canAutoExecute) {
          for (const tc of effectiveToolCalls) {
            setExecutingToolInfo({ name: tc.name, args: tc.arguments });
            const execRes = await executeMcpTool(tc.name, tc.arguments);
            addMessage(convId, {
              role: "tool",
              tool_call_id: tc.id,
              toolName: tc.name,
              toolResult: execRes.result,
              content: JSON.stringify(execRes.result ?? execRes.error ?? "执行完成"),
            });
          }
          setExecutingToolInfo(null);
          await runFollowupAssistantStream(convId, controller, depth + 1);
          return;
        }
      }

      if (finalContent) {
        addMessage(convId, {
          role: "assistant",
          content: finalContent,
        });
      } else {
        // 关键保护：若达到多轮上限(depth >= 3)或上一轮纯工具调用未产出文本，强制发起最后一轮纯文字总结流式生成，坚决杜绝静默卡死
        setExecutingToolInfo(null);
        let summaryText = "";
        setStreamingText("");

        const convLatest = useAIChatStore.getState().conversations.find((c) => c.id === convId);
        const latestHistory = (convLatest ? convLatest.messages : []).map((msg) => ({
          role: msg.role,
          content: msg.content,
          tool_call_id: msg.tool_call_id,
          tool_calls: msg.tool_calls,
        }));

        try {
          const finalSummaryRes = await aiService.chatStream({
            messages: [
              {
                role: "system" as const,
                content: systemMessage + "\n\n【注意】所有工具排查已完成。请根据此前所有工具执行结果与输出内容，直接向用户给出完整、结构化的最终解答与分析表格，严禁再次发起工具调用。"
              },
              ...latestHistory,
            ],
            tools: undefined,
            signal: controller.signal,
            onChunk: (chunk) => {
              summaryText += chunk;
              setStreamingText(summaryText);
              if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
              }
            },
          });
          setStreamingText("");
          const resolvedText = finalSummaryRes.content || summaryText;
          if (resolvedText) {
            addMessage(convId, {
              role: "assistant",
              content: resolvedText,
            });
          }
        } catch (summaryErr: any) {
          logService.error("最终文本总结生成异常", "AIChat", { error: summaryErr?.message });
        }
      }
    } catch (err: any) {
      logService.error("Tool Calling 后续总结请求失败", "AIChat", { error: err.message, category: "ai" });
    }
  };

  const handleManualExecuteToolCall = async (convId: string, toolCall: any) => {
    if (!convId || isLoading) return;
    setIsLoading(true);

    try {
      const conv = useAIChatStore.getState().conversations.find((c) => c.id === convId);
      const parentAssistantMsg = conv?.messages.find((m) => m.tool_calls?.some((tc: any) => tc.id === toolCall.id));
      const allToolCalls = parentAssistantMsg?.tool_calls || [toolCall];

      const existingToolCallIds = new Set(
        conv?.messages.filter((m) => m.role === "tool" && m.tool_call_id).map((m) => m.tool_call_id)
      );

      for (const tc of allToolCalls) {
        if (!existingToolCallIds.has(tc.id)) {
          let parsedArgs: any = {};
          try {
            parsedArgs = typeof tc.function?.arguments === "string"
              ? JSON.parse(tc.function.arguments || "{}")
              : (tc.arguments || {});
          } catch {
            parsedArgs = {};
          }

          setExecutingToolInfo({ name: tc.function?.name || tc.name, args: parsedArgs });
          const execRes = await executeMcpTool(tc.function?.name || tc.name, parsedArgs);

          addMessage(convId, {
            role: "tool",
            tool_call_id: tc.id,
            toolName: tc.function?.name || tc.name,
            toolResult: execRes.result,
            content: JSON.stringify(execRes.result ?? { message: execRes.error || "执行完成" }),
          });
        }
      }

      setExecutingToolInfo(null);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      await runFollowupAssistantStream(convId, controller);
    } catch (e: any) {
      logService.error("手动执行工具调用失败", "AIChat", { error: e.message, category: "ai" });
    } finally {
      setIsLoading(false);
      setExecutingToolInfo(null);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    let userContent = inputValue.trim();
    if (attachedFiles.length > 0) {
      const filesContext = attachedFiles.map(file => {
        return `【上传的附件上下文】\n文件名: ${file.name}\n路径: ${file.path}\n内容:\n\`\`\`\n${file.content}\n\`\`\``;
      }).join("\n\n");
      userContent = `${filesContext}\n\n${userContent}`;
    }

    setInputValue("");
    setAttachedFiles([]);
    
    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    addMessage(convId, { role: "user", content: userContent });
    setIsLoading(true);
    setStreamingText("");
    setExecutingToolInfo(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const conv = useAIChatStore.getState().conversations.find((c) => c.id === convId);
      const chatHistory = (conv ? conv.messages : []).map(msg => ({
        role: msg.role,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
        tool_calls: msg.tool_calls,
      }));

      // 动态注入 System 设定与当前已连接物理设备上下文
      let systemMessage = activeSkillPrompt || (isAgentMode ? AGENT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT);
      if (selectedDevice) {
        systemMessage += `\n\n【当前目标 Android 设备上下文】\n序列号: ${selectedDevice.serial}\n型号: ${selectedDevice.properties?.model || "Android Device"}\n系统版本: Android ${selectedDevice.properties?.androidVersion || "未知"}\n模式: ${selectedDevice.mode}\n连接状态: ${selectedDevice.connected ? "已连接" : "离线"}`;
      }

      // 确保每一个 assistant 的 tool_call 都有对应的 tool 回复，避免 OpenAI 协议抛出 400 校验错误
      const sanitizedHistory: any[] = [];
      const historyToolCallIds = new Set(
        chatHistory.filter((m) => m.role === "tool" && m.tool_call_id).map((m) => m.tool_call_id)
      );

      for (let i = 0; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        sanitizedHistory.push(msg);
        if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
          for (const tc of msg.tool_calls) {
            if (!historyToolCallIds.has(tc.id)) {
              sanitizedHistory.push({
                role: "tool",
                tool_call_id: tc.id,
                content: JSON.stringify({ message: "未执行此工具调用或已由新消息跳过" }),
              });
              historyToolCallIds.add(tc.id);
            }
          }
        }
      }

      // 限制最近 20 条消息上下文，避免长对话超出模型最大 Token 窗口，且安全对齐避免切断 tool 消息
      let sliceStart = Math.max(0, sanitizedHistory.length - 20);
      while (sliceStart < sanitizedHistory.length && sanitizedHistory[sliceStart].role === "tool") {
        sliceStart++;
      }
      const recentHistory = sanitizedHistory.slice(sliceStart);
      const finalMessages = [
        { role: "system" as const, content: systemMessage },
        ...recentHistory,
      ];

      let accumulated = "";
      let toolCallsReceived: ChatToolCall[] = [];

      const response = await aiService.chatStream({
        messages: finalMessages,
        tools: isAutoMcpEnabled ? ADMT_BUILTIN_MCP_TOOLS : undefined,
        signal: controller.signal,
        onChunk: (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        },
        onToolCalls: (calls) => {
          toolCallsReceived = calls;
        },
      });

      setStreamingText("");

      if (response.error && response.error !== "用户已中止生成") {
        throw new Error(response.error);
      }

      if (response.error === "用户已中止生成") {
        if (accumulated) {
          addMessage(convId, { role: "assistant", content: `${accumulated}\n\n*(已中止生成)*` });
        }
        return;
      }
      
      const assistantMsgId = addMessage(convId, {
        role: "assistant",
        content: response.content || accumulated,
        tool_calls: toolCallsReceived.length > 0 ? toolCallsReceived.map(tc => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
        })) : undefined
      });

      // 原生 Tool Calling (Function Calling) 闭环回路
      if (toolCallsReceived.length > 0) {
        const canAutoExecute = isAutoExecute || (isAutoMcpEnabled && toolCallsReceived.every(tc => SAFE_AUTO_EXECUTE_TOOLS.has(tc.name)));
        if (canAutoExecute) {
          for (const tc of toolCallsReceived) {
            setExecutingToolInfo({ name: tc.name, args: tc.arguments });
            const execRes = await executeMcpTool(tc.name, tc.arguments);
            addMessage(convId, {
              role: "tool",
              tool_call_id: tc.id,
              toolName: tc.name,
              toolResult: execRes.result,
              content: JSON.stringify(execRes.result ?? execRes.error ?? "执行完成"),
            });
          }
          setExecutingToolInfo(null);
          await runFollowupAssistantStream(convId, controller);
        }
      }
      // 向下兼容旧版 Prompt JSON Agent
      else if (isAgentMode && isAutoExecute) {
        const agentData = parseAgentResponse(response.content || accumulated);
        if (agentData && agentData.actions && agentData.actions.length > 0) {
          setCheckedActions(prev => ({
            ...prev,
            [assistantMsgId]: agentData.actions.map(() => true)
          }));
          setTimeout(() => {
            handleRunAgentCommands(assistantMsgId, agentData);
          }, 100);
        }
      }

    } catch (error: any) {
      if (controller.signal.aborted) return;
      logService.error("AI 聊天界面请求失败", "AIChat", { 
        error: error.message, 
        stack: error.stack,
        isAgentMode,
        conversationId: convId,
        category: "ai" 
      });
      addMessage(convId || "", { 
        role: "assistant", 
        content: `请求失败: ${error.message}\n\n建议排查：\n1. 网络连接与代理服务是否畅通\n2. 设置中的 API Key 与 Endpoint 是否正确有效\n3. 如果是本地 Ollama / LM Studio 模型，确认后台服务已就绪` 
      });
    } finally {
      setIsLoading(false);
      setStreamingText("");
      setExecutingToolInfo(null);
      abortControllerRef.current = null;
    }
  };

  const handleRunAgentCommands = async (msgId: string, agentData: AgentResponse) => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "error",
        message: "未选中设备：请先在主界面或连接管理中选中一台 Android 设备"
      });
      setExecutionLogs(prev => ({
        ...prev,
        [msgId]: " 执行失败: 未检测到已选中的 Android 设备，请连接并选择设备后重试。\n"
      }));
      return;
    }

    const currentChecked = checkedActions[msgId] || agentData.actions.map(() => true);
    const actionsToRun = agentData.actions.filter((_, idx) => currentChecked[idx] !== false);

    if (actionsToRun.length === 0) return;

    setExecutingMsgId(msgId);
    setExecutionLogs(prev => ({
      ...prev,
      [msgId]: `开始在设备 [${selectedDevice.serial}] 上执行指令...\n`
    }));

    try {
      for (const action of actionsToRun) {
        // 1. 打印当前步骤
        setExecutionLogs(prev => ({
          ...prev,
          [msgId]: (prev[msgId] || "") + ` [安全校验] 正在校验: ${action.command} ...\n`
        }));

        // 2. 调用 Rust 后端进行安全检查
        const safetyResult = await invoke<{ isSafe: boolean; dangerLevel: string; message: string }>(
          "verify_command_safety",
          { command: action.command }
        );

        if (!safetyResult.isSafe || safetyResult.dangerLevel === "blocked") {
          setExecutionLogs(prev => ({
            ...prev,
            [msgId]: (prev[msgId] || "") + ` [被拦截] 该命令为高危指令: ${action.command}\n原因: ${safetyResult.message}\n停止执行后续指令。\n`
          }));
          setStatusBarMessage({
            type: "error",
            message: `指令已被安全过滤器拦截: ${safetyResult.message}`
          });
          break;
        }

        if (safetyResult.dangerLevel === "warn") {
          setExecutionLogs(prev => ({
            ...prev,
            [msgId]: (prev[msgId] || "") + ` [安全警告] ${safetyResult.message}\n`
          }));
        }

        // 3. 执行指令
        setExecutionLogs(prev => ({
          ...prev,
          [msgId]: (prev[msgId] || "") + `▶ [正在执行] ${action.command} ...\n`
        }));

        const parts = action.command.trim().split(/\s+/);
        const cmdName = parts[0];
        const cmdArgs = parts.slice(1);
        
        let result;
        if (action.type === "fastboot") {
          result = await deviceService.executeFastbootCommand(
            selectedDevice.serial,
            cmdName,
            cmdArgs,
            30
          );
        } else if (action.type === "adb_shell") {
          if (cmdName === "shell") {
            result = await deviceService.executeAdbCommand(
              selectedDevice.serial,
              "shell",
              cmdArgs,
              30
            );
          } else {
            result = await deviceService.executeAdbCommand(
              selectedDevice.serial,
              "shell",
              parts,
              30
            );
          }
        } else {
          result = await deviceService.executeAdbCommand(
            selectedDevice.serial,
            cmdName,
            cmdArgs,
            30
          );
        }

        // 4. 输出命令结果
        if (result.success) {
          setExecutionLogs(prev => ({
            ...prev,
            [msgId]: (prev[msgId] || "") + ` [执行成功]\n${result.output || "(无输出)"}\n`
          }));
        } else {
          setExecutionLogs(prev => ({
            ...prev,
            [msgId]: (prev[msgId] || "") + ` [执行失败]\n错误信息: ${result.error || "未知错误"}\n停止后续指令的执行。\n`
          }));
          setStatusBarMessage({
            type: "error",
            message: `执行指令失败: ${result.error || "未知错误"}`
          });

          // 如果开启了智能代理模式，自动启动自我纠错诊断与修复
          if (isAgentMode) {
            setExecutionLogs(prev => ({
              ...prev,
              [msgId]: (prev[msgId] || "") + ` [自我纠错] 正在将错误报告自动反馈给 AI 助手进行诊断与修复方案生成...\n`
            }));
            const currentAction = action;
            const currentError = result.error || "未知错误";
            setTimeout(() => {
              handleAutoDiagnoseAndFix(currentAction, currentError);
            }, 500);
          }

          break;
        }
      }
    } catch (e: any) {
      setExecutionLogs(prev => ({
        ...prev,
        [msgId]: (prev[msgId] || "") + ` [异常崩溃] 执行过程中遇到意外错误: ${e.message || String(e)}\n`
      }));
    } finally {
      setExecutingMsgId(null);
    }
  };

  const handleAutoDiagnoseAndFix = async (failedAction: AgentAction, errorMsg: string) => {
    const convId = useAIChatStore.getState().currentConversationId;
    if (!convId) return;

    setIsLoading(true);

    const feedbackContent = ` [系统自动反馈] 指令执行失败！\n失败的指令: \`${failedAction.command}\`\n执行类型: \`${failedAction.type}\`\n错误信息: \`${errorMsg}\`\n\n请自我解析此错误，分析原因，并提供下一步的修复方案或可用的替代指令（如果有的话）。`;
    
    // 1. 将这条系统自动反馈的“错误信息”作为 user 消息添加到会话中
    addMessage(convId, { role: "user", content: feedbackContent });

    try {
      // 2. 获取当前会话最新的完整历史
      const targetConv = useAIChatStore.getState().conversations.find(c => c.id === convId);
      const messageList = targetConv?.messages || [];
      
      const chatHistory = messageList.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      }));

      // 3. 构建发送给 AI 的消息
      const systemMessage = isAgentMode ? AGENT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT;
      const finalMessages = [
        { role: "system" as const, content: systemMessage },
        ...chatHistory
      ];

      // 4. 调用 AI
      const response = await aiService.chat(finalMessages);

      if (response.error) {
        throw new Error(response.error);
      }

      // 5. 将 AI 的诊断和纠错方案输出
      const assistantMsgId = addMessage(convId, { role: "assistant", content: response.content });

      // 6. 如果是 Agent 模式且是全自动执行，检测到新指令则触发自动执行！
      if (isAgentMode && isAutoExecute) {
        const agentData = parseAgentResponse(response.content);
        if (agentData && agentData.actions && agentData.actions.length > 0) {
          setCheckedActions(prev => ({
            ...prev,
            [assistantMsgId]: agentData.actions.map(() => true)
          }));
          setTimeout(() => {
            handleRunAgentCommands(assistantMsgId, agentData);
          }, 100);
        }
      }
    } catch (e: any) {
      logService.error("自动诊断与修复请求失败", "AIChat", { error: e.message, category: "ai" });
      addMessage(convId, {
        role: "assistant",
        content: ` 自动错误反馈与诊断请求失败: ${e.message || String(e)}。建议您手动修改或执行替代指令。`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogcatDiagnose = async () => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "error",
        message: "未选中设备：请先在主界面或连接管理中选中一台 Android 设备"
      });
      return;
    }

    setIsLoading(true);
    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    addMessage(convId, { role: "user", content: " 正在从手机抓取 Logcat 崩溃日志并进行诊断..." });

    try {
      logService.info("开始获取 Logcat 崩溃日志进行诊断", "AIChat", { category: "ai", device: selectedDevice.serial });
      
      const result = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        "logcat",
        ["-d", "-v", "threadtime", "*:E"]
      );

      if (!result.success) {
        throw new Error(result.error || "获取 logcat 失败");
      }

      let logcatOutput = result.output.trim();
      
      if (!logcatOutput) {
        const fallbackResult = await deviceService.executeAdbCommand(
          selectedDevice.serial,
          "logcat",
          ["-d", "-t", "100", "-v", "threadtime"]
        );
        if (fallbackResult.success) {
          logcatOutput = fallbackResult.output.trim();
        }
      }

      if (!logcatOutput) {
        addMessage(convId, {
          role: "assistant",
          content: "ℹ 未在设备中检测到最近的 Crash 堆栈或错误日志 (Logcat 为空)。请确保手机中已发生过崩溃，或重新连接设备重试。"
        });
        setIsLoading(false);
        return;
      }

      const slicedLogs = logcatOutput.length > 8000 
        ? "..." + logcatOutput.substring(logcatOutput.length - 8000)
        : logcatOutput;

      const prompt = `你是一个资深的 Android 系统调试专家。下面是来自选定设备 (${selectedDevice.properties?.brand || ""} ${selectedDevice.properties?.model || selectedDevice.serial}) 的最近 Logcat 错误日志。
请分析并诊断该日志，定位任何潜在的闪退 (Crash)、内存泄漏 (Memory Leak)、系统挂死 (ANR) 或异常报错的原因，并给出针对性的排查和修复建议。
如果日志中没有包含崩溃，请说明该日志体现的系统状态。

---
Logcat 错误日志:
\`\`\`
${slicedLogs}
\`\`\``;

      const controller = new AbortController();
      abortControllerRef.current = controller;
      let logcatAccumulated = "";
      setStreamingText("");

      const response = await aiService.chatStream({
        messages: [
          { role: "system", content: "你是一个资深的 Android 崩溃日志诊断专家。请仔细阅读 Logcat 日志，找出崩溃根源并给出修复方案。" },
          { role: "user", content: prompt }
        ],
        signal: controller.signal,
        onChunk: (chunk) => {
          logcatAccumulated += chunk;
          setStreamingText(logcatAccumulated);
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        },
      });

      setStreamingText("");
      if (response.error && response.error !== "用户已中止生成") {
        throw new Error(response.error);
      }

      if (response.content || logcatAccumulated) {
        addMessage(convId, { role: "assistant", content: response.content || logcatAccumulated });
      }

    } catch (error: any) {
      logService.error("Logcat 诊断失败", "AIChat", { error: error.message, category: "ai" });
      addMessage(convId, {
        role: "assistant",
        content: ` Logcat 诊断请求失败: ${error.message}\n\n建议检查设备连接是否正常，或在设置中切换模型通道。`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessagesForExport = (msgList: any[]): string => {
    const sections: string[] = [];
    for (const msg of msgList) {
      const time = new Date(msg.timestamp).toLocaleString();
      if (msg.role === "user") {
        sections.push(`### 用户 (${time})\n\n${msg.content}\n\n---`);
      } else if (msg.role === "tool") {
        let toolBody = msg.content;
        try {
          const parsed = JSON.parse(msg.content);
          toolBody = "```json\n" + JSON.stringify(parsed, null, 2) + "\n```";
        } catch {}
        sections.push(`> **🛠️ 工具执行反馈: ${msg.toolName || "本地工具"}** (${time})\n\n${toolBody}\n\n---`);
      } else if (msg.role === "assistant") {
        if (!msg.content && msg.tool_calls && msg.tool_calls.length > 0) {
          const callsSummary = msg.tool_calls.map((tc: any) => `- 请求调用工具: \`${tc.function?.name || tc.name}\``).join("\n");
          sections.push(`> **🤖 发起工具调用** (${time})\n\n${callsSummary}\n\n---`);
          continue;
        }

        const agentData = parseAgentResponse(msg.content);
        if (agentData) {
          let md = `### AI 助手 (${time})\n\n`;
          if (agentData.thought) {
            md += `**分析与说明**:\n${agentData.thought}\n\n`;
          }
          if (agentData.risk_warning) {
            md += `> ⚠️ **安全风险提示**: ${agentData.risk_warning}\n\n`;
          }
          if (agentData.actions && agentData.actions.length > 0) {
            md += `**建议执行指令**:\n`;
            for (const act of agentData.actions) {
              md += `- ${act.description}\n  \`\`\`bash\n  ${act.command}\n  \`\`\`\n`;
            }
          }
          md += `\n---`;
          sections.push(md);
        } else if (msg.content) {
          sections.push(`### AI 助手 (${time})\n\n${msg.content}\n\n---`);
        }
      }
    }
    return sections.join("\n\n");
  };

  const handleExportMarkdown = async () => {
    if (!currentConversation || messages.length === 0) return;

    try {
      const markdown = formatMessagesForExport(messages);
      const title = currentConversation.title.replace(/[\\/:*?"<>|]/g, "_");
      const filePath = await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
        defaultPath: `${title}.md`,
      });

      if (filePath) {
        await writeTextFile(filePath, `# ${currentConversation.title}\n\n导出时间: ${new Date().toLocaleString()}\n\n${markdown}`);
        setStatusBarMessage({
          type: "success",
          message: t("settings.ai_export_success"),
        });
      }
    } catch (error: any) {
      logService.error("导出对话失败", "AIChat", { error: error.message, category: "ai" });
      setStatusBarMessage({
        type: "error",
        message: t("settings.ai_export_failed", { error: error.message }),
      });
    }
  };

  const handleExportAllConversations = async () => {
    if (conversations.length === 0) return;
    try {
      const markdown = conversations.map(conv => {
        const header = `# 对话: ${conv.title}\n创建时间: ${new Date(conv.createdAt).toLocaleString()}\n\n`;
        const body = formatMessagesForExport(conv.messages);
        return header + body;
      }).join("\n\n========================================\n\n");

      const filePath = await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
        defaultPath: `ADMT_AI_对话历史备份_${new Date().toLocaleDateString().replace(/[/:]/g, "-")}.md`,
      });

      if (filePath) {
        await writeTextFile(filePath, `# ADMT AI 助手完整对话备份\n备份时间: ${new Date().toLocaleString()}\n\n${markdown}`);
        setStatusBarMessage({
          type: "success",
          message: "所有对话已成功合并导出",
        });
      }
    } catch (error: any) {
      logService.error("批量导出对话失败", "AIChat", { error: error.message, category: "ai" });
      setStatusBarMessage({
        type: "error",
        message: `合并导出失败: ${error.message}`,
      });
    }
  };

    const handleScreenDiagnose = async () => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "error",
        message: "未连接设备：请先连接并选中一台 Android 设备进行屏幕截取",
      });
      return;
    }

    try {
      setStatusBarMessage({
        type: "info",
        message: `正在截取设备 ${selectedDevice.properties?.model || selectedDevice.serial} 屏幕...`,
      });

      const shotRes = await executeMcpTool("admt_take_screenshot", {
        serial: selectedDevice.serial,
      });

      if (!shotRes.success) {
        throw new Error(shotRes.error || "截屏操作失败");
      }

      setStatusBarMessage({
        type: "success",
        message: "已成功截取屏幕，正在提交 AI 诊断分析...",
      });

      const shotPath = shotRes.result?.filePath || "屏幕截图";
      const promptText = `【手机屏幕实时排错诊断】\n已成功捕获设备「${selectedDevice.properties?.model || "Android"}」当前屏幕（临时路径: ${shotPath}）。\n请分析当前屏幕显示的状态（如处于 Fastboot / Recovery / 开机向导 / 报错弹窗 / 冻屏等），并给出针对性的排错及玩机解决建议。`;

      setInputValue("");
      let convId = currentConversationId;
      if (!convId) {
        convId = createNewConversation();
      }
      addMessage(convId, { role: "user", content: promptText });
      setTimeout(() => {
        triggerStreamForMessage(convId!, promptText);
      }, 50);
    } catch (e: any) {
      setStatusBarMessage({
        type: "error",
        message: `截屏诊断失败: ${e.message || String(e)}`,
      });
    }
  };

  const handleExecuteLineCommand = async (lineCmd: string, lineKey: string) => {
    const trimmed = lineCmd.trim();
    if (!trimmed) return;

    setInlineCmdOutputs(prev => ({
      ...prev,
      [lineKey]: { status: "running", output: "正在执行...", expanded: true }
    }));

    try {
      let outputText = "";
      if (trimmed.startsWith("adb ")) {
        const sub = trimmed.replace(/^adb\s+/, "");
        const res = await executeMcpTool("admt_execute_adb", { command: sub, serial: selectedDevice?.serial });
        outputText = typeof res.result === "string" ? res.result : JSON.stringify(res.result ?? res.error ?? "执行完毕", null, 2);
      } else if (trimmed.startsWith("fastboot ")) {
        const sub = trimmed.replace(/^fastboot\s+/, "");
        const res = await executeMcpTool("admt_execute_fastboot", { command: sub });
        outputText = typeof res.result === "string" ? res.result : JSON.stringify(res.result ?? res.error ?? "执行完毕", null, 2);
      } else {
        const res = await executeMcpTool("admt_execute_host_command", { command: trimmed });
        outputText = typeof res.result === "string" ? res.result : JSON.stringify(res.result ?? res.error ?? "执行完毕", null, 2);
      }

      setInlineCmdOutputs(prev => ({
        ...prev,
        [lineKey]: { status: "success", output: outputText, expanded: true }
      }));
    } catch (err: any) {
      setInlineCmdOutputs(prev => ({
        ...prev,
        [lineKey]: { status: "error", output: err?.message || String(err), expanded: true }
      }));
    }
  };

  const triggerStreamForMessage = async (convId: string, text: string) => {
    setIsLoading(true);
    setStreamingText("");
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const conv = useAIChatStore.getState().conversations.find((c) => c.id === convId);
      const chatHistory = (conv ? conv.messages : []).map(msg => ({
        role: msg.role,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
        tool_calls: msg.tool_calls,
      }));

      let systemMessage = activeSkillPrompt || (isAgentMode ? AGENT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT);
      if (selectedDevice) {
        systemMessage += `\n\n【当前目标 Android 设备上下文】\n序列号: ${selectedDevice.serial}\n型号: ${selectedDevice.properties?.model || "Android Device"}\n系统版本: Android ${selectedDevice.properties?.androidVersion || "未知"}\n模式: ${selectedDevice.mode}\n连接状态: ${selectedDevice.connected ? "已连接" : "离线"}`;
      }

      let accumulated = "";
      let toolCallsReceived: ChatToolCall[] = [];

      const response = await aiService.chatStream({
        messages: [
          { role: "system" as const, content: systemMessage },
          ...chatHistory,
        ],
        tools: isAutoMcpEnabled ? ADMT_BUILTIN_MCP_TOOLS : undefined,
        signal: controller.signal,
        onChunk: (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        },
        onToolCalls: (calls) => {
          toolCallsReceived = calls;
        },
      });

      setStreamingText("");
      const assistantContent = response.content || accumulated;

      addMessage(convId, {
        role: "assistant",
        content: assistantContent,
        tool_calls: toolCallsReceived.length > 0 ? toolCallsReceived.map(tc => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
        })) : undefined
      });

      if (conv && (conv.title.startsWith("新会话") || conv.title === "AI 玩机助手" || conv.messages.length <= 2)) {
        const derived = text.replace(/【.*?】/g, "").trim().slice(0, 16);
        if (derived) {
          updateConversationTitle(convId, derived);
        }
      }

      if (toolCallsReceived.length > 0) {
        const canAutoExecute = isAutoExecute || (isAutoMcpEnabled && toolCallsReceived.every(tc => SAFE_AUTO_EXECUTE_TOOLS.has(tc.name)));
        if (canAutoExecute) {
          for (const tc of toolCallsReceived) {
            setExecutingToolInfo({ name: tc.name, args: tc.arguments });
            const execRes = await executeMcpTool(tc.name, tc.arguments);
            addMessage(convId, {
              role: "tool",
              tool_call_id: tc.id,
              toolName: tc.name,
              toolResult: execRes.result,
              content: JSON.stringify(execRes.result ?? execRes.error ?? "执行完成"),
            });
          }
          setExecutingToolInfo(null);
          await runFollowupAssistantStream(convId, controller);
        }
      }
    } catch (e: any) {
      logService.error("自动触发诊断对话失败", "AIChat", { error: e.message });
    } finally {
      setIsLoading(false);
      setStreamingText("");
      setExecutingToolInfo(null);
      abortControllerRef.current = null;
    }
  };

  const filteredSlashCommands = inputValue.startsWith("/")
    ? SLASH_COMMANDS.filter(c => c.cmd.toLowerCase().startsWith(inputValue.trim().toLowerCase()) || c.label.includes(inputValue.slice(1).trim()))
    : [];

  const executeSlashCommand = (item: typeof SLASH_COMMANDS[0]) => {
    setInputValue("");
    if (item.prompt === "__ACTION_SCREENSHOT__") {
      handleScreenDiagnose();
      return;
    }
    if (item.prompt === "__ACTION_CLEAN__") {
      if (currentConversationId) {
        clearConversationMessages(currentConversationId);
        setStatusBarMessage({ type: "success", message: "已清空当前会话消息" });
      }
      return;
    }
    let convId = currentConversationId;
    if (!convId) convId = createNewConversation();
    addMessage(convId, { role: "user", content: item.prompt });
    setTimeout(() => {
      triggerStreamForMessage(convId!, item.prompt);
    }, 50);
  };

  const handleDiagnoseCardClick = async (type: "logcat" | "anr" | "admt" | "flash") => {
    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    if (type === "logcat") {
      if (!selectedDevice) {
        setStatusBarMessage({
          type: "warning",
          message: "未检测到已连接手机，已为您预设 Logcat 崩溃诊断排查提示词"
        });
        setInputValue("请帮我诊断手机应用闪退或系统崩溃故障。如何通过 adb logcat 抓取 FATAL EXCEPTION、Crash 堆栈，并定位具体报错根因？");
        if (textareaRef.current) textareaRef.current.focus();
        return;
      }
      handleLogcatDiagnose();
    } else if (type === "anr") {
      const devHint = selectedDevice ? `当前设备型号为 ${selectedDevice.properties?.model || "Android"}，` : "";
      setInputValue(`${devHint}请帮我诊断和分析手机中的 ANR (程序无响应) 故障。请列出如何获取 /data/anr/ 下的 traces.txt 日志，以及如何定位导致主线程被阻塞的具体原因与解决方案。`);
      if (textareaRef.current) textareaRef.current.focus();
    } else if (type === "admt") {
      setInputValue("我遇到了玩机管家 (ADMT) 的报错或异常。请帮我分析该如何排查：\n1. ADB/Fastboot 驱动或可执行文件初始化失败；\n2. 设备连接不稳定或无法识别；\n3. 本地环境与权限连通性。");
      if (textareaRef.current) textareaRef.current.focus();
    } else if (type === "flash") {
      setInputValue("请帮我分析刷机/Root/刷写分区时遇到的失败日志。例如 Fastboot 报错、Magisk/KernelSU 补丁刷入失败、AB 分区切换后无法开机等情况，应该如何排障与急救？");
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExecuteCodeBlock = async (cmdId: string, rawCmd: string) => {
    setRunningCmdIdx(cmdId);
    try {
      const cleanCmd = rawCmd.trim();
      let res: any = null;
      if (cleanCmd.startsWith("adb shell ") || cleanCmd.startsWith("adb ")) {
        const sub = cleanCmd.startsWith("adb shell ") ? cleanCmd.replace(/^adb\s+shell\s+/, "") : cleanCmd.replace(/^adb\s+/, "");
        res = await executeMcpTool("admt_execute_adb", { command: sub });
      } else if (cleanCmd.startsWith("fastboot ")) {
        const sub = cleanCmd.replace(/^fastboot\s+/, "");
        res = await executeMcpTool("admt_execute_fastboot", { command: sub });
      } else {
        res = await executeMcpTool("admt_execute_adb", { command: cleanCmd });
      }

      const stdout = res?.result?.stdout || (res?.success ? (typeof res.result === "string" ? res.result : JSON.stringify(res.result, null, 2)) : "");
      const stderr = res?.error || res?.result?.stderr || "";

      setCmdOutputs((prev) => ({
        ...prev,
        [cmdId]: {
          stdout: stdout || (res?.success ? "执行成功 (无额外输出)" : ""),
          stderr,
          exitCode: res?.result?.exitCode ?? (res?.success ? 0 : 1),
        },
      }));

      emit("execute-command-from-ai", { command: cleanCmd });
      setStatusBarMessage({
        type: res?.success ? "success" : "warning",
        message: res?.success ? "指令执行完毕并已回显" : `指令执行报错: ${res?.error || "请检查设备状态"}`,
      });
    } catch (e: any) {
      setCmdOutputs((prev) => ({
        ...prev,
        [cmdId]: { stdout: "", stderr: e.message || String(e), exitCode: -1 },
      }));
    } finally {
      setRunningCmdIdx(null);
    }
  };

  const handleRunCommand = async (cmd: string) => {
    const cmdWindow = await WebviewWindow.getByLabel("command-line");
    if (cmdWindow) {
      await cmdWindow.show();
      await cmdWindow.setFocus();
    } else {
      const currentWindow = await WebviewWindow.getCurrent();
      await currentWindow.setFocus(); 
    }
    
    emit("execute-command-from-ai", { command: cmd.trim() });
    setStatusBarMessage({
      type: "success",
      message: "已发送指令至命令行执行"
    });
  };

  return (
    <div className={styles.container}>
      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        <div className={styles.chatHeader}>
          {/* 左侧：集合了会话标题、新建与历史对话的统一标题卡片 */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "2px 6px 2px 8px",
            borderRadius: "10px",
            backgroundColor: "var(--colorNeutralBackground2)",
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            flexShrink: 1,
            minWidth: 0,
            overflow: "hidden",
            height: "32px",
            boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flexShrink: 1 }}>
              <Bot24Regular style={{ fontSize: "16px", color: "var(--colorBrandForeground1)", flexShrink: 0 }} />
              <Text weight="semibold" className={styles.historyItemTitle} style={{ fontSize: "13px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentConversation?.title || "AI 玩机助手"}
              </Text>
            </div>

            <div style={{ width: "1px", height: "14px", backgroundColor: tokens.colorNeutralStroke2, margin: "0 2px", flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
              <Tooltip content="新建对话" relationship="label">
                <Button
                  icon={<Add24Regular />}
                  appearance="subtle"
                  size="small"
                  onClick={() => createNewConversation()}
                  style={{ borderRadius: "6px", height: "24px", padding: "0 6px", fontSize: "12px" }}
                >
                  新建
                </Button>
              </Tooltip>

              <Tooltip content="打开历史会话记录" relationship="label">
                <Button
                  icon={<History24Regular />}
                  appearance="subtle"
                  size="small"
                  onClick={() => setIsHistoryModalOpen(true)}
                  style={{ borderRadius: "6px", height: "24px", padding: "0 6px", fontSize: "12px" }}
                >
                  历史 {conversations.length > 0 ? `(${conversations.length})` : ""}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* 右侧：运行控制模式组、AI 方案配置选择器及导出按钮 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "nowrap" }}>
            {/* 运行模式切换胶囊与菜单 */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "9999px",
                    backgroundColor: isAgentMode ? "rgba(0, 113, 227, 0.08)" : "var(--colorNeutralBackground2)",
                    border: isAgentMode ? "1px solid var(--colorBrandStroke2)" : `1px solid ${tokens.colorNeutralStroke2}`,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: isAgentMode ? "var(--colorBrandForeground1)" : "var(--colorNeutralForeground2)",
                    height: "30px",
                    boxSizing: "border-box",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                  title="点击切换运行模式与自动执行策略"
                >
                  <Sparkle20Regular style={{ fontSize: "14px", color: isAgentMode ? "var(--colorBrandForeground1)" : "var(--colorNeutralForeground3)" }} />
                  <span>{isAgentMode ? (isAutoExecute ? "智能代理 · 自动" : "智能代理 · 审核") : "常规问答"}</span>
                  <ChevronDown16Regular style={{ fontSize: "12px", opacity: 0.7 }} />
                </div>
              </MenuTrigger>
              <MenuPopover style={{ borderRadius: "14px", minWidth: "210px", padding: "6px" }}>
                <MenuList>
                  <div style={{ padding: "4px 8px", fontSize: "11px", color: "var(--colorNeutralForeground4)", fontWeight: "600" }}>
                    运行与执行策略
                  </div>
                  <MenuItem
                    icon={isAgentMode ? <Checkmark16Regular style={{ color: "var(--colorBrandForeground1)" }} /> : <span style={{ width: "16px" }} />}
                    onClick={() => setAgentMode(true)}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, fontSize: "12px" }}>智能代理模式</span>
                      <span style={{ fontSize: "10px", color: "var(--colorNeutralForeground4)" }}>解析并调用 ADB/Fastboot 等管家工具</span>
                    </div>
                  </MenuItem>
                  <MenuItem
                    icon={!isAgentMode ? <Checkmark16Regular style={{ color: "var(--colorBrandForeground1)" }} /> : <span style={{ width: "16px" }} />}
                    onClick={() => setAgentMode(false)}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600, fontSize: "12px" }}>常规问答模式</span>
                      <span style={{ fontSize: "10px", color: "var(--colorNeutralForeground4)" }}>纯文本建议交流，不调用系统命令</span>
                    </div>
                  </MenuItem>

                  {isAgentMode && (
                    <>
                      <Divider style={{ margin: "4px 0" }} />
                      <MenuItem
                        icon={isAutoExecute ? <Checkmark16Regular style={{ color: "var(--colorBrandForeground1)" }} /> : <span style={{ width: "16px" }} />}
                        onClick={() => setAutoExecute(!isAutoExecute)}
                      >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, fontSize: "12px" }}>自动执行工具命令</span>
                          <span style={{ fontSize: "10px", color: "var(--colorNeutralForeground4)" }}>
                            {isAutoExecute ? "已开启 (工具将自动运行)" : "已关闭 (需手动点击运行)"}
                          </span>
                        </div>
                      </MenuItem>
                    </>
                  )}
                </MenuList>
              </MenuPopover>
            </Menu>

            {/* AI 模型与服务商运行状态胶囊 */}
            {(() => {
              const aiConfig = config.ai;
              const hasApiKey = Boolean(aiConfig?.apiKey?.trim() || aiConfig?.provider === "local");
              const currentModel = aiConfig?.model?.trim() || "";
              const providerLabel = PROVIDER_LABELS[aiConfig?.provider || "openai"] || (aiConfig?.provider || "AI").toUpperCase();
              
              return (
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        backgroundColor: hasApiKey && currentModel ? "var(--colorNeutralBackground2)" : "rgba(245, 158, 11, 0.12)",
                        border: hasApiKey && currentModel ? `1px solid ${tokens.colorNeutralStroke2}` : "1px solid rgba(245, 158, 11, 0.4)",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "all 0.18s ease",
                        userSelect: "none",
                        height: "30px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: hasApiKey && currentModel ? "var(--colorPaletteGreenForeground1)" : "var(--colorPaletteYellowForeground1)",
                      }} />
                      <span style={{
                        fontWeight: 600,
                        color: hasApiKey && currentModel ? "var(--colorNeutralForeground1)" : "var(--colorPaletteYellowForeground1)",
                        maxWidth: "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {hasApiKey && currentModel ? `${providerLabel} · ${currentModel}` : "未配置模型 Key"}
                      </span>
                      <ChevronDown16Regular style={{ fontSize: "12px", color: "var(--colorNeutralForeground4)" }} />
                    </div>
                  </MenuTrigger>
                  <MenuPopover style={{ borderRadius: "14px", minWidth: "220px", padding: "6px" }}>
                    <MenuList>
                      <div style={{ padding: "4px 8px", fontSize: "11px", color: "var(--colorNeutralForeground4)", fontWeight: "600" }}>
                        快速切换 AI 模型预设
                      </div>
                      {aiPresets.map(preset => (
                        <MenuItem
                          key={preset.id}
                          icon={activePresetId === preset.id ? <Checkmark16Regular style={{ color: "var(--colorBrandForeground1)" }} /> : <span style={{ width: "16px" }} />}
                          onClick={() => {
                            applyPreset(preset.id);
                            setStatusBarMessage({ type: "success", message: `已切换至模型预设: ${preset.name}` });
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, fontSize: "12px" }}>{preset.name}</span>
                            <span style={{ fontSize: "10px", color: "var(--colorNeutralForeground4)" }}>{preset.provider.toUpperCase()} · ${preset.model}</span>
                          </div>
                        </MenuItem>
                      ))}
                      <Divider style={{ margin: "4px 0" }} />
                      <MenuItem
                        icon={<Settings24Regular style={{ fontSize: "16px" }} />}
                        onClick={handleOpenPresetModal}
                      >
                        管理模型配置与 API Key...
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              );
            })()}

            {/* 导出当前对话 */}
            <Tooltip content="导出当前对话为 Markdown 格式" relationship="label">
              <Button 
                icon={<ArrowDownload24Regular />} 
                appearance="subtle"
                size="small"
                onClick={handleExportMarkdown}
                disabled={!currentConversationId || messages.length === 0}
              />
            </Tooltip>
          </div>
        </div>

      {currentConversationId ? (
        <>
          <div className={styles.messageList}>
              {messages.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: "32px 16px", maxWidth: "680px", margin: "auto" }}>
                  <Bot24Regular style={{ fontSize: '56px', color: tokens.colorBrandForeground1, marginBottom: "8px" }} />
                  <Text size={500} weight="semibold">有什么可以帮您的？</Text>
                  <Text align="center" style={{ color: tokens.colorNeutralForeground3, maxWidth: "420px", marginTop: "4px" }}>
                    您可以询问关于 Android 调试、系统刷机、或者下方列出的快捷管家诊断。
                  </Text>
                  
                  {/* 2x2 快捷诊断卡片组 (Squircle 14px 规范) */}
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "14px", 
                    marginTop: "28px", 
                    width: "100%", 
                    boxSizing: "border-box"
                  }}>
                    {/* 卡片 1: Logcat 崩溃 */}
                    <div 
                      className={styles.diagnoseCard}
                      onClick={() => handleDiagnoseCardClick("logcat")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkle24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                        <Text weight="semibold">Logcat 崩溃诊断</Text>
                      </div>
                      <Text size={100} style={{ color: "var(--colorNeutralForeground4)", lineHeight: "1.4" }}>
                        自动抓取连接手机的最新 FATAL/Crash 错误日志并进行根因排查。
                      </Text>
                    </div>

                    {/* 卡片 2: ANR 分析 */}
                    <div 
                      className={styles.diagnoseCard}
                      onClick={() => handleDiagnoseCardClick("anr")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <History24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                        <Text weight="semibold">ANR 无响应分析</Text>
                      </div>
                      <Text size={100} style={{ color: "var(--colorNeutralForeground4)", lineHeight: "1.4" }}>
                        排查界面冻结、无响应故障，定位主线程卡死堆栈与解决思路。
                      </Text>
                    </div>

                    {/* 卡片 3: 管家运行诊断 */}
                    <div 
                      className={styles.diagnoseCard}
                      onClick={() => handleDiagnoseCardClick("admt")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Bot24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                        <Text weight="semibold">管家运行诊断</Text>
                      </div>
                      <Text size={100} style={{ color: "var(--colorNeutralForeground4)", lineHeight: "1.4" }}>
                        排查 ADB/Fastboot 驱动初始化失败、设备离线或激活连通性问题。
                      </Text>
                    </div>

                    {/* 卡片 4: 刷机日志排查 */}
                    <div 
                      className={styles.diagnoseCard}
                      onClick={() => handleDiagnoseCardClick("flash")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Play24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                        <Text weight="semibold">刷机日志排查</Text>
                      </div>
                      <Text size={100} style={{ color: "var(--colorNeutralForeground4)", lineHeight: "1.4" }}>
                        针对 Fastboot 分区写入失败、Magisk/KernelSU 补丁报错等排障。
                      </Text>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={mergeClasses(
                      styles.messageGroup,
                      msg.role === "user" ? styles.userMessage : styles.botMessage
                    )}
                  >
                    <Avatar 
                      icon={msg.role === "user" ? <Person24Regular /> : <Bot24Regular />} 
                      color={msg.role === "user" ? "brand" : "colorful"}
                    />
                    <div 
                      className={mergeClasses(
                        styles.bubbleContainer,
                        msg.role === "user" ? styles.userBubbleContainer : styles.botBubbleContainer
                      )}
                    >
                      <div 
                        className={mergeClasses(
                          styles.messageContent,
                          msg.role === "user" ? styles.userContent : styles.botContent,
                          styles.markdownWrapper
                        )}
                      >
                      {(() => {
                        // 1. 原生 Tool 执行结果卡片
                        if (msg.role === "tool") {
                          return (
                            <div style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              width: "100%",
                              minWidth: "260px",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              backgroundColor: "var(--colorNeutralBackground3)",
                              border: "1px solid var(--colorNeutralStroke2)",
                              fontSize: "12px",
                              fontFamily: "var(--fontFamilyMonospace)",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", color: "var(--colorNeutralForeground1)" }}>
                                  <Wrench24Regular style={{ fontSize: "16px", color: "var(--colorBrandForeground1)" }} />
                                  <span>工具执行结果: {msg.toolName || "本地工具"}</span>
                                </div>
                                <Badge appearance="tint" color="brand" size="small">已完成</Badge>
                              </div>
                              {msg.toolResult?.imageBase64 ? (
                                <div style={{ marginTop: "4px" }}>
                                  <img
                                    src={msg.toolResult.imageBase64}
                                    alt="Screen Preview"
                                    style={{ maxWidth: "260px", maxHeight: "360px", borderRadius: "8px", border: "1px solid var(--colorNeutralStroke1)" }}
                                  />
                                </div>
                              ) : msg.toolResult?.sources && msg.toolResult.sources.length > 0 ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "6px 2px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--colorBrandForeground1)", fontWeight: "600" }}>
                                    已检索到 {msg.toolResult.sources.length} 条权威信源
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {msg.toolResult.sources.slice(0, 3).map((s: any, idx: number) => (
                                      <div key={idx} style={{ fontSize: "12px", color: "var(--colorNeutralForeground2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        [{s.index}] {s.title}
                                      </div>
                                    ))}
                                    {msg.toolResult.sources.length > 3 && (
                                      <div style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                                        ... 以及另外 {msg.toolResult.sources.length - 3} 条网页信源
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : msg.toolResult?.message ? (
                                <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground2)", lineHeight: "1.5", padding: "4px 2px" }}>
                                  {msg.toolResult.message}
                                </div>
                              ) : (
                                <pre style={{
                                  margin: 0,
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  backgroundColor: "var(--colorNeutralBackground1)",
                                  overflowX: "auto",
                                  maxHeight: "160px",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-all",
                                  color: "var(--colorNeutralForeground2)",
                                }}>
                                  {msg.toolResult !== null && typeof msg.toolResult === "object"
                                    ? JSON.stringify(msg.toolResult, null, 2)
                                    : (msg.content || (msg.toolResult ? String(msg.toolResult) : "执行完成"))}
                                </pre>
                              )}
                            </div>
                          );
                        }

                        // 2. 旧版基于 Prompt 的 Agent 解析向下兼容
                        if (msg.role !== "user") {
                          const agentData = parseAgentResponse(msg.content);
                          if (agentData) {
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", minWidth: "280px" }}>
                                <div style={{ marginBottom: "4px" }}>
                                  <Text weight="semibold"> AI 的思考:</Text>
                                  <div style={{ marginTop: "4px", color: tokens.colorNeutralForeground2, whiteSpace: "pre-wrap" }}>
                                    {agentData.thought}
                                  </div>
                                </div>
                                
                                {agentData.risk_warning && (
                                  <div style={{
                                    padding: "10px 14px",
                                    borderRadius: "6px",
                                    backgroundColor: agentData.danger_level === "high" ? "#FDF2F2" : "#FFFBEB",
                                    borderLeft: `4px solid ${agentData.danger_level === "high" ? "#EF4444" : "#F59E0B"}`,
                                    color: agentData.danger_level === "high" ? "#9B1C1C" : "#92400E",
                                    fontSize: "13px"
                                  }}>
                                    <Text weight="semibold">{agentData.danger_level === "high" ? " 高危风险警告: " : " 安全提示: "}</Text>
                                    {agentData.risk_warning}
                                  </div>
                                )}

                                {agentData.actions.length > 0 && (
                                  <div style={{
                                    border: `1px solid ${tokens.colorNeutralStroke2}`,
                                    borderRadius: "8px",
                                    backgroundColor: tokens.colorNeutralBackground2,
                                    padding: "12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px"
                                  }}>
                                    <Text weight="semibold" style={{ marginBottom: "4px" }}>拟执行操作指令清单:</Text>
                                    {agentData.actions.map((action, actionIdx) => {
                                      const isChecked = checkedActions[msg.id]?.[actionIdx] !== false;
                                      return (
                                        <div key={actionIdx} style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          padding: "8px",
                                          border: `1px solid ${tokens.colorNeutralStroke1}`,
                                          borderRadius: "6px",
                                          backgroundColor: tokens.colorNeutralBackground1,
                                          gap: "4px"
                                        }}>
                                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Checkbox
                                              label={action.description}
                                              checked={isChecked}
                                              onChange={(e, data) => {
                                                const currentChecked = checkedActions[msg.id] || agentData.actions.map(() => true);
                                                const nextChecked = [...currentChecked];
                                                nextChecked[actionIdx] = !!data.checked;
                                                setCheckedActions({
                                                  ...checkedActions,
                                                  [msg.id]: nextChecked
                                                });
                                              }}
                                            />
                                            <span style={{
                                              fontSize: "11px",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              backgroundColor: action.type === "fastboot" ? "#E0F2FE" : "#F3F4F6",
                                              color: action.type === "fastboot" ? "#0369A1" : "#374151"
                                            }}>{action.type}</span>
                                          </div>
                                          <code style={{
                                            display: "block",
                                            padding: "4px 8px",
                                            backgroundColor: tokens.colorNeutralBackground4,
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontFamily: "monospace",
                                            marginTop: "4px",
                                            wordBreak: "break-all"
                                          }}>{action.command}</code>
                                        </div>
                                      );
                                    })}

                                    <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center" }}>
                                      <Button
                                        appearance="primary"
                                        icon={executingMsgId === msg.id ? <Spinner size="tiny" /> : <Play24Regular />}
                                        onClick={() => handleRunAgentCommands(msg.id, agentData)}
                                        disabled={executingMsgId !== null || agentData.actions.filter((_, idx) => checkedActions[msg.id]?.[idx] !== false).length === 0}
                                      >
                                        {executingMsgId === msg.id ? "正在执行..." : "一键执行选中指令"}
                                      </Button>
                                    </div>

                                    {executionLogs[msg.id] && (
                                      <div style={{
                                        marginTop: "8px",
                                        padding: "8px 12px",
                                        backgroundColor: "#1E293B",
                                        color: "#F8FAFC",
                                        borderRadius: "6px",
                                        fontFamily: "monospace",
                                        fontSize: "12px",
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                        whiteSpace: "pre-wrap"
                                      }}>
                                        <div style={{ borderBottom: "1px solid #475569", paddingBottom: "4px", marginBottom: "4px", color: "#94A3B8", fontWeight: "bold" }}>
                                          执行控制台日志:
                                        </div>
                                        {executionLogs[msg.id]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          }
                        }
                        
                        return (
                          <>
                            {msg.content && (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    const rawCode = String(children).replace(/\n$/, "");
                                    
                                    if (!inline && rawCode.length > 0) {
                                      const isCommand = (match && ["bash", "sh", "batch", "powershell"].includes(match[1])) || rawCode.startsWith("adb ") || rawCode.startsWith("fastboot ");
                                      
                                      // 安全防御评级
                                      const isBlocked = /rm\s+-rf\s+\/|erase\s+(bootloader|partition|system|vendor)|of=\/dev\/block/i.test(rawCode);
                                      const isWarn = /erase\s+|format\s+|pm\s+(uninstall|disable)|reboot\s+edl/i.test(rawCode);
                                      const safetyLevel = isBlocked ? "blocked" : isWarn ? "warn" : "safe";

                                      const lines = isCommand ? rawCode.split('\n').filter(l => l.trim().length > 0) : [];
                                      const isMultiLine = lines.length > 1;

                                      return (
                                        <div style={{ 
                                          border: `1px solid ${safetyLevel === "blocked" ? "var(--colorPaletteRedBorder2)" : tokens.colorNeutralStroke2}`, 
                                          borderRadius: "10px", 
                                          overflow: "hidden", 
                                          margin: "10px 0",
                                          backgroundColor: "var(--colorNeutralBackground2)",
                                        }}>
                                          <div style={{ 
                                            display: "flex", 
                                            justifyContent: "space-between", 
                                            alignItems: "center", 
                                            padding: "6px 10px", 
                                            backgroundColor: "var(--colorNeutralBackground3)",
                                            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
                                          }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                              <Text size={200} style={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                {match ? match[1] : "code"}
                                              </Text>
                                              {isCommand && (
                                                safetyLevel === "blocked" ? (
                                                  <Badge appearance="tint" color="danger" size="small" icon={<ShieldDismiss24Regular />}>
                                                    高危拦截
                                                  </Badge>
                                                ) : safetyLevel === "warn" ? (
                                                  <Badge appearance="tint" color="warning" size="small" icon={<ShieldError24Regular />}>
                                                    敏感变更
                                                  </Badge>
                                                ) : (
                                                  <Badge appearance="tint" color="success" size="small" icon={<ShieldCheckmark24Regular />}>
                                                    安全指令
                                                  </Badge>
                                                )
                                              )}
                                            </div>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                              {(() => {
                                                const codeBlockKey = `${msg.id}_code_${rawCode.slice(0, 16)}`;
                                                const isCopied = copiedCodeKey === codeBlockKey;
                                                return (
                                                  <Tooltip content={isCopied ? "已复制到剪贴板" : "复制完整代码"} relationship="label">
                                                    <Button 
                                                      size="small" 
                                                      appearance="subtle" 
                                                      icon={
                                                        isCopied ? (
                                                          <Checkmark16Regular style={{ fontSize: "14px", color: "var(--colorPaletteGreenForeground1)" }} />
                                                        ) : (
                                                          <Copy16Regular style={{ fontSize: "14px" }} />
                                                        )
                                                      } 
                                                      onClick={() => handleCopyCode(rawCode, codeBlockKey)}
                                                    />
                                                  </Tooltip>
                                                );
                                              })()}
                                              {isCommand && (
                                                <Tooltip content={isBlocked ? "包含高危擦除指令，已阻止全局运行" : "在命令行工具中运行完整代码"} relationship="label">
                                                  <Button 
                                                    size="small" 
                                                    appearance={safetyLevel === "blocked" ? "subtle" : "primary"} 
                                                    icon={<Play24Regular style={{ fontSize: "15px" }} />} 
                                                    onClick={() => !isBlocked && handleRunCommand(rawCode)}
                                                    disabled={isBlocked}
                                                  />
                                                </Tooltip>
                                              )}
                                            </div>
                                          </div>

                                          {/* 逐行分步执行与代码展示 */}
                                          <div style={{ padding: "8px 10px", overflowX: "auto" }}>
                                            {isCommand && isMultiLine ? (
                                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                {lines.map((line, lIdx) => {
                                                  const lineKey = `${msg.id}_line_${lIdx}`;
                                                  const outputState = inlineCmdOutputs[lineKey];
                                                  const isLineComment = line.trim().startsWith("#") || line.trim().startsWith("//");
                                                  return (
                                                    <div key={lIdx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                                        <code style={{ fontFamily: "var(--fontFamilyMonospace)", fontSize: "12px", color: isLineComment ? "var(--colorNeutralForeground4)" : "var(--colorNeutralForeground1)", flex: 1, wordBreak: "break-all" }}>
                                                          {line}
                                                        </code>
                                                        {!isLineComment && (
                                                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                            {outputState && (
                                                              <span style={{ fontSize: "11px", color: outputState.status === "success" ? "var(--colorPaletteGreenForeground1)" : outputState.status === "error" ? "var(--colorPaletteRedForeground1)" : "var(--colorBrandForeground1)" }}>
                                                                {outputState.status === "running" ? "运行中..." : outputState.status === "success" ? "完成" : "错误"}
                                                              </span>
                                                            )}
                                                            <Button
                                                              size="small"
                                                              appearance="subtle"
                                                              icon={<Play16Regular style={{ fontSize: "13px" }} />}
                                                              onClick={() => handleExecuteLineCommand(line, lineKey)}
                                                              title="单独运行此行指令"
                                                              style={{ minWidth: "22px", height: "22px", padding: 0 }}
                                                            />
                                                          </div>
                                                        )}
                                                      </div>
                                                      {outputState && outputState.output && (
                                                        <pre style={{
                                                          margin: "2px 0 6px 12px",
                                                          padding: "4px 8px",
                                                          borderRadius: "6px",
                                                          backgroundColor: "var(--colorNeutralBackground1)",
                                                          fontSize: "11px",
                                                          fontFamily: "var(--fontFamilyMonospace)",
                                                          color: outputState.status === "error" ? "var(--colorPaletteRedForeground1)" : "var(--colorNeutralForeground2)",
                                                          maxHeight: "80px",
                                                          overflowY: "auto",
                                                        }}>
                                                          {outputState.output}
                                                        </pre>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <pre className={className} style={{ margin: 0, padding: 0 }}>
                                                <code className={className} {...props}>
                                                  {children}
                                                </code>
                                              </pre>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return <code className={className} {...props}>{children}</code>;
                                  }
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            )}

                            {/* 3. 原生 Tool Calling 调用卡片（手动确认模式下提供即时执行入口） */}
                            {msg.tool_calls && msg.tool_calls.length > 0 && (() => {
                              const unexecutedCount = msg.tool_calls.filter(tc => !messages.some(m => m.role === "tool" && m.tool_call_id === tc.id)).length;
                              return (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: msg.content ? "8px" : 0 }}>
                                  {msg.tool_calls.length > 1 && !isAutoExecute && unexecutedCount > 0 && (
                                    <div style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "8px 12px",
                                      borderRadius: "10px",
                                      backgroundColor: "var(--colorNeutralBackground2)",
                                      border: "1px solid var(--colorNeutralStroke2)",
                                    }}>
                                      <span style={{ fontSize: "12px", color: "var(--colorNeutralForeground2)" }}>
                                        共 {msg.tool_calls.length} 个工具调用（待执行 {unexecutedCount} 项）
                                      </span>
                                      <Button
                                        size="small"
                                        appearance="primary"
                                        icon={<Play24Regular />}
                                        onClick={() => handleManualExecuteToolCall(currentConversationId || "", msg.tool_calls![0])}
                                        disabled={isLoading}
                                      >
                                        全部执行并反馈
                                      </Button>
                                    </div>
                                  )}
                                  {msg.tool_calls.map((tc, tcIdx) => {
                                  let argsObj: any = {};
                                  try {
                                    argsObj = JSON.parse(tc.function?.arguments || "{}");
                                  } catch {
                                    argsObj = tc.function?.arguments;
                                  }
                                  return (
                                    <div key={tcIdx} style={{
                                      padding: "10px 12px",
                                      borderRadius: "10px",
                                      backgroundColor: "var(--colorNeutralBackground3)",
                                      border: "1px solid var(--colorNeutralStroke2)",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "6px"
                                    }}>
                                      {(() => {
                                        const isExecuted = messages.some((m) => m.role === "tool" && m.tool_call_id === tc.id);
                                        return (
                                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", fontSize: "12px" }}>
                                              <Wrench24Regular style={{ fontSize: "16px", color: "var(--colorBrandForeground1)" }} />
                                              <span>请求调用工具: <code>{tc.function?.name}</code></span>
                                            </div>
                                            {isExecuted ? (
                                              <Badge appearance="tint" color="brand" size="small">已执行</Badge>
                                            ) : !isAutoExecute ? (
                                              <Button
                                                size="small"
                                                appearance="primary"
                                                icon={<Play24Regular />}
                                                onClick={() => handleManualExecuteToolCall(currentConversationId || "", tc)}
                                                disabled={isLoading}
                                              >
                                                执行并反馈
                                              </Button>
                                            ) : (
                                              <Badge appearance="tint" color="informative" size="small">等待执行</Badge>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <pre style={{
                                        margin: 0,
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        backgroundColor: "var(--colorNeutralBackground1)",
                                        fontSize: "11px",
                                        fontFamily: "var(--fontFamilyMonospace)",
                                        maxHeight: "100px",
                                        overflowX: "auto"
                                      }}>
                                        {JSON.stringify(argsObj, null, 2)}
                                      </pre>
                                    </div>
                                  );
                                })}
                              </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                    
                      {/* 气泡底部操作栏：每个对话气泡均可独立一键复制 */}
                      <div className={mergeClasses(
                        "bubble-actions",
                        styles.bubbleActions,
                        copiedMsgId === msg.id && styles.bubbleActionsVisible
                      )}>
                        <Tooltip 
                          content={copiedMsgId === msg.id ? "已复制到剪贴板" : "复制此条内容"} 
                          relationship="label"
                        >
                          <Button 
                            size="small" 
                            appearance="subtle" 
                            icon={
                              copiedMsgId === msg.id ? (
                                <Checkmark16Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />
                              ) : (
                                <Copy16Regular style={{ fontSize: "14px" }} />
                              )
                            } 
                            onClick={() => handleCopyMessage(msg)}
                            style={{
                              height: "24px",
                              padding: "0 6px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              color: copiedMsgId === msg.id ? "var(--colorPaletteGreenForeground1)" : "var(--colorNeutralForeground3)",
                            }}
                          >
                            {copiedMsgId === msg.id ? "已复制" : "复制"}
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className={mergeClasses(styles.messageGroup, styles.botMessage)}>
                  <Avatar icon={<Bot24Regular />} color="colorful" />
                  <div className={mergeClasses(styles.bubbleContainer, styles.botBubbleContainer)}>
                    <div className={mergeClasses(styles.messageContent, styles.botContent, styles.markdownWrapper)}>
                    {executingToolInfo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                        <Spinner size="tiny" />
                        <Text size={200} style={{ color: "var(--colorBrandForeground1)", fontFamily: "var(--fontFamilyMonospace)" }}>
                          正在执行玩机工具: <code>{executingToolInfo.name}</code>...
                        </Text>
                      </div>
                    ) : streamingText ? (
                      <div>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingText}
                        </ReactMarkdown>
                        <span style={{
                          display: "inline-block",
                          width: "6px",
                          height: "14px",
                          backgroundColor: "var(--colorBrandForeground1)",
                          marginLeft: "4px",
                          verticalAlign: "middle",
                        }} />
                      </div>
                    ) : (
                      <Spinner size="tiny" label="正在思考..." />
                    )}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              {attachedFiles.length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "8px",
                  maxWidth: "860px",
                  margin: "0 auto 8px",
                }}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 8px",
                      backgroundColor: "var(--colorNeutralBackground3)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      border: `1px solid var(--colorNeutralStroke2)`,
                    }}>
                      <span style={{
                        maxWidth: "180px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }} title={file.path}>
                        {file.name}
                      </span>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<DismissCircle24Regular style={{ fontSize: "14px" }} />}
                        onClick={() => handleRemoveFile(idx)}
                        style={{ minWidth: "20px", height: "20px", padding: 0 }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 快捷诊断 Prompt 药丸栏 */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                overflowX: "auto",
                marginBottom: "8px",
                paddingBottom: "2px",
                scrollbarWidth: "none",
              }}>
                <div
                  onClick={() => executeSlashCommand(SLASH_COMMANDS[0])}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 500,
                    backgroundColor: "var(--colorNeutralBackground3)",
                    border: "1px solid var(--colorNeutralStroke2)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: "var(--colorNeutralForeground2)",
                    transition: "all 0.15s ease",
                  }}
                >
                  🩺 整机状态体检
                </div>
                <div
                  onClick={() => executeSlashCommand(SLASH_COMMANDS[1])}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 500,
                    backgroundColor: "var(--colorNeutralBackground3)",
                    border: "1px solid var(--colorNeutralStroke2)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: "var(--colorNeutralForeground2)",
                    transition: "all 0.15s ease",
                  }}
                >
                  ⚡ 提取前台应用
                </div>
                <div
                  onClick={() => executeSlashCommand(SLASH_COMMANDS.find(c => c.cmd === "/search") || SLASH_COMMANDS[0])}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 500,
                    backgroundColor: "var(--colorNeutralBackground3)",
                    border: "1px solid var(--colorNeutralStroke2)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: "var(--colorNeutralForeground2)",
                    transition: "all 0.15s ease",
                  }}
                >
                  🌐 检索救砖固件
                </div>
                {selectedDevice && (
                  <div
                    onClick={handleScreenDiagnose}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: 500,
                      backgroundColor: "var(--colorNeutralBackground3)",
                      border: "1px solid var(--colorNeutralStroke2)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      color: "var(--colorNeutralForeground2)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    📷 屏幕截取诊断
                  </div>
                )}
              </div>

              {/* 斜杠指令浮动菜单 */}
              {filteredSlashCommands.length > 0 && (
                <div style={{
                  marginBottom: "8px",
                  backgroundColor: "var(--colorNeutralBackground1)",
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  borderRadius: "14px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                  padding: "6px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}>
                  <div style={{ padding: "4px 8px", fontSize: "11px", color: "var(--colorNeutralForeground4)", fontWeight: "600" }}>
                    快捷指令（↑↓ 键切换，Enter 确认）
                  </div>
                  {filteredSlashCommands.map((item, idx) => (
                    <div
                      key={item.cmd}
                      onClick={() => executeSlashCommand(item)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        backgroundColor: idx === slashMenuIndex ? "var(--colorBrandBackground2)" : "transparent",
                        cursor: "pointer",
                        fontSize: "12px",
                        transition: "background-color 0.1s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <code style={{ color: "var(--colorBrandForeground1)", fontWeight: "600", fontFamily: "var(--fontFamilyMonospace)" }}>
                          {item.cmd}
                        </code>
                        <span style={{ color: "var(--colorNeutralForeground1)" }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--colorNeutralForeground4)" }}>回车运行</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.inputWrapper}>
                <Textarea
                  ref={textareaRef}
                  className={styles.input}
                  placeholder="输入问题或需求，支持自动生成并执行 ADB/Fastboot 指令..."
                  value={inputValue}
                  onChange={(e, data) => setInputValue(data.value)}
                  onKeyDown={handleKeyPress}
                  size="small"
                  resize="none"
                  textarea={{
                    style: {
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      padding: "3px 0",
                      fontSize: "13px",
                      lineHeight: "20px",
                      minHeight: "22px",
                    }
                  }}
                />

                <div className={styles.inputToolbar}>
                  {/* MCP 协同开关 */}
                  <Tooltip content="启用后，AI 可智能协同调用本地 ADB 工具与元宝搜索等执行诊断、查询与操作" relationship="label">
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor: isAutoMcpEnabled ? "var(--colorBrandBackground2)" : "var(--colorNeutralBackground3)",
                      border: isAutoMcpEnabled ? "1px solid var(--colorBrandStroke2)" : `1px solid var(--colorNeutralStroke2)`,
                      transition: "all 0.18s ease",
                      cursor: "pointer",
                      flexShrink: 0,
                      height: "28px",
                      boxSizing: "border-box",
                    }}>
                      <Switch
                        size="small"
                        label={
                          <Text size={200} weight={isAutoMcpEnabled ? "semibold" : "regular"} style={{ color: isAutoMcpEnabled ? "var(--colorBrandForeground1)" : "var(--colorNeutralForeground2)", fontSize: "12px", userSelect: "none" }}>
                            MCP 协同
                          </Text>
                        }
                        checked={isAutoMcpEnabled}
                        onChange={(_, data) => setIsAutoMcpEnabled(data.checked)}
                        style={{ margin: 0 }}
                      />
                    </div>
                  </Tooltip>

                  {selectedDevice && (
                    <Tooltip content="一键截取手机屏幕并诊断分析" relationship="label">
                      <Button
                        icon={<Camera24Regular style={{ fontSize: "16px" }} />}
                        appearance="subtle"
                        size="small"
                        onClick={handleScreenDiagnose}
                        disabled={isLoading}
                        style={{ minWidth: "28px", width: "28px", height: "28px", padding: 0, borderRadius: "9999px" }}
                      />
                    </Tooltip>
                  )}

                  {selectedDevice && (
                    <Tooltip content="抓取 Logcat 并自动诊断" relationship="label">
                      <Button
                        icon={<Sparkle24Regular style={{ fontSize: "15px" }} />}
                        appearance="subtle"
                        size="small"
                        onClick={handleLogcatDiagnose}
                        disabled={isLoading}
                        style={{ minWidth: "auto", padding: "0 8px", height: "28px", borderRadius: "9999px", fontSize: "12px" }}
                      >
                        Logcat
                      </Button>
                    </Tooltip>
                  )}

                  <Tooltip content="添加文件附件 (日志/脚本/文本)" relationship="label">
                    <Button
                      icon={<DocumentAdd24Regular style={{ fontSize: "16px" }} />}
                      appearance="subtle"
                      size="small"
                      onClick={handleUploadFile}
                      disabled={isLoading}
                      style={{ minWidth: "28px", width: "28px", height: "28px", padding: 0, borderRadius: "9999px" }}
                    />
                  </Tooltip>

                  {isLoading ? (
                    <Tooltip content="停止生成" relationship="label">
                      <Button 
                        icon={<RecordStop20Regular style={{ color: "var(--colorPaletteRedForeground1)", fontSize: "15px" }} />} 
                        appearance="secondary" 
                        size="small"
                        onClick={handleStopGeneration}
                        style={{ borderRadius: "9999px", height: "28px", padding: "0 10px", minWidth: "auto", fontSize: "12px" }}
                      >
                        停止
                      </Button>
                    </Tooltip>
                  ) : (
                    <Tooltip content="发送 (Enter) / 换行 (Shift+Enter)" relationship="label">
                      <Button 
                        icon={<Send24Regular style={{ fontSize: "15px" }} />} 
                        appearance="primary" 
                        size="small"
                        onClick={handleSendMessage}
                        disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
                        style={{ borderRadius: "9999px", height: "28px", padding: "0 12px", minWidth: "auto", fontSize: "12px" }}
                      >
                        发送
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <Chat24Regular style={{ fontSize: '64px' }} />
            <Text size={600} weight="semibold">欢迎使用 AI 助手</Text>
            <Text>点击左侧“新对话”开始交流</Text>
            <Button 
              appearance="primary" 
              style={{ marginTop: '16px' }}
              onClick={() => createNewConversation()}
            >
              发起新对话
            </Button>
          </div>
        )}
      </div>

      {/* 历史记录独立弹窗 */}
      <Dialog open={isHistoryModalOpen} onOpenChange={(_, data) => !data.open && setIsHistoryModalOpen(false)}>
        <DialogSurface style={{ maxWidth: "700px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsHistoryModalOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>会话历史记录</span>
                <Badge size="small" appearance="tint" color="brand">
                  {conversations.length} 个会话
                </Badge>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
              {/* 操作工具条 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <Input
                  contentBefore={<Search24Regular style={{ fontSize: "16px" }} />}
                  placeholder="搜索历史会话标题或内容..."
                  value={historySearchQuery}
                  onChange={(_, data) => setHistorySearchQuery(data.value)}
                  style={{ flex: 1, minWidth: "220px" }}
                  size="small"
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    size="small"
                    appearance="primary"
                    icon={<Add24Regular />}
                    onClick={() => {
                      createNewConversation();
                      setIsHistoryModalOpen(false);
                    }}
                  >
                    新建会话
                  </Button>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowDownload24Regular />}
                    onClick={handleExportAllConversations}
                    disabled={conversations.length === 0}
                  >
                    批量导出
                  </Button>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Delete24Regular style={{ color: conversations.length > 0 ? tokens.colorPaletteRedForeground1 : undefined }} />}
                    onClick={clearHistory}
                    disabled={conversations.length === 0}
                    style={{ color: conversations.length > 0 ? tokens.colorPaletteRedForeground1 : undefined }}
                  >
                    清除所有
                  </Button>
                </div>
              </div>

              {/* 历史记录列表 */}
              <div style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                {filteredConversations.length === 0 ? (
                  <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--colorNeutralForeground4)" }}>
                    <Chat24Regular style={{ fontSize: "40px", marginBottom: "8px", opacity: 0.5 }} />
                    <div>{historySearchQuery ? "未检索到匹配的历史会话" : "暂无历史会话记录"}</div>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isCurrent = conv.id === currentConversationId;
                    const lastMsg = conv.messages[conv.messages.length - 1];
                    return (
                      <div
                        key={conv.id}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: isCurrent ? "1px solid var(--colorBrandStroke1)" : "1px solid var(--colorNeutralStroke2)",
                          backgroundColor: isCurrent ? "var(--colorBrandBackground2)" : "var(--colorNeutralBackground2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                        }}
                        onClick={() => {
                          setCurrentConversation(conv.id);
                          setIsHistoryModalOpen(false);
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: 0, paddingRight: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Text weight={isCurrent ? "semibold" : "medium"} size={300} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {conv.title}
                            </Text>
                            {isCurrent && (
                              <Badge size="small" appearance="filled" color="brand">当前</Badge>
                            )}
                            <span style={{ fontSize: "11px", color: "var(--colorNeutralForeground4)", flexShrink: 0 }}>
                              {conv.messages.length} 条消息
                            </span>
                          </div>
                          {lastMsg && (
                            <Text size={200} style={{ color: "var(--colorNeutralForeground3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {lastMsg.content.slice(0, 75)}
                            </Text>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <Tooltip content="删除此会话" relationship="label">
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Delete24Regular style={{ fontSize: "14px" }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsHistoryModalOpen(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Skills 与 MCP 工具箱统一独立弹窗 */}
      <Dialog open={isSkillsMcpModalOpen} onOpenChange={(_, data) => !data.open && setIsSkillsMcpModalOpen(false)}>
        <DialogSurface style={{ maxWidth: "780px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsSkillsMcpModalOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wrench24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>AI Skills 专家库与 MCP 工具箱</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "6px" }}>
              {/* 顶部胶囊分段 Tab 切换 */}
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 10px" }}>
                <div style={{
                  display: "inline-flex",
                  padding: "3px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--colorNeutralBackground3)",
                  border: "1px solid var(--colorNeutralStroke2)",
                  gap: "4px"
                }}>
                  <button
                    type="button"
                    style={{
                      padding: "6px 20px",
                      borderRadius: "9999px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: skillsMcpTab === "skills" ? "600" : "500",
                      cursor: "pointer",
                      backgroundColor: skillsMcpTab === "skills" ? "var(--colorBrandBackground2)" : "transparent",
                      color: skillsMcpTab === "skills" ? "var(--colorBrandForeground1)" : "var(--colorNeutralForeground2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.18s ease"
                    }}
                    onClick={() => setSkillsMcpTab("skills")}
                  >
                    <Sparkle24Regular style={{ fontSize: "16px" }} />
                    <span>Skills 专家提示词库 ({PRESET_AI_SKILLS.length})</span>
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "6px 20px",
                      borderRadius: "9999px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: skillsMcpTab === "mcp" ? "600" : "500",
                      cursor: "pointer",
                      backgroundColor: skillsMcpTab === "mcp" ? "var(--colorBrandBackground2)" : "transparent",
                      color: skillsMcpTab === "mcp" ? "var(--colorBrandForeground1)" : "var(--colorNeutralForeground2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.18s ease"
                    }}
                    onClick={() => setSkillsMcpTab("mcp")}
                  >
                    <Server24Regular style={{ fontSize: "16px" }} />
                    <span>MCP 本地与协议工具箱 ({ADMT_BUILTIN_MCP_TOOLS.length})</span>
                  </button>
                </div>
              </div>

              {skillsMcpTab === "skills" ? (
                /* Tab 1: Skills 专家库 */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                    选择专业领域的 System Prompt 预设，深度增强 AI 在救砖、模块开发、逆向分析等复杂场景的解答专业度：
                  </Text>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                    {PRESET_AI_SKILLS.map((skill) => (
                      <div
                        key={skill.id}
                        style={{
                          padding: "14px",
                          borderRadius: "10px",
                          border: "1px solid var(--colorNeutralStroke2)",
                          backgroundColor: "var(--colorNeutralBackground2)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Text weight="bold" size={300}>
                            {skill.title}
                          </Text>
                          <Badge size="small" appearance="tint" color="brand">
                            {skill.category}
                          </Badge>
                        </div>
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.4" }}>
                          {skill.description}
                        </Text>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {skill.tags.map((t, idx) => (
                            <span key={idx} style={{ fontSize: "11px", padding: "1px 6px", background: "var(--colorNeutralBackground3)", borderRadius: "4px" }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "6px" }}>
                          <Button size="small" appearance="primary" onClick={() => handleApplySkill(skill, "system")}>
                            注入为系统设定
                          </Button>
                          <Button size="small" appearance="secondary" onClick={() => handleApplySkill(skill, "input")}>
                            插入输入框
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Tab 2: MCP 工具箱 */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "460px", overflowY: "auto", paddingRight: "4px" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                    支持在无需 AI 触发的情况下，手动选择已注册的 MCP 工具并传参执行，实时验证返回数据或直接带入对话：
                  </Text>

                  {/* 工具选择 */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {ADMT_BUILTIN_MCP_TOOLS.map((t) => (
                      <Button
                        key={t.name}
                        size="small"
                        appearance={selectedMcpTool?.name === t.name ? "primary" : "secondary"}
                        onClick={() => {
                          setSelectedMcpTool(t);
                          setMcpTestResult(null);
                        }}
                      >
                        {t.name}
                      </Button>
                    ))}
                  </div>

                  {selectedMcpTool && (
                    <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)", display: "flex", flexDirection: "column", gap: "10px", border: "1px solid var(--colorNeutralStroke2)" }}>
                      <div>
                        <strong>工具说明：</strong> {selectedMcpTool.description}
                      </div>

                      {selectedMcpTool.name === "admt_execute_adb" && (
                        <div>
                          <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>ADB Shell 指令 (无需输入 adb)：</label>
                          <Input
                            value={mcpParamInputs.command || ""}
                            onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, command: d.value }))}
                            placeholder="例如 getprop ro.product.model 或 pm list packages"
                            style={{ width: "100%" }}
                          />
                        </div>
                      )}

                      {selectedMcpTool.name === "admt_reboot_device" && (
                        <div>
                          <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>重启目标模式 (Target)：</label>
                          <Select
                            value={mcpParamInputs.target || "system"}
                            onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, target: d.value }))}
                          >
                            <option value="system">重启至系统 (System)</option>
                            <option value="recovery">重启至 Recovery</option>
                            <option value="bootloader">重启至 Bootloader (Fastboot)</option>
                            <option value="edl">重启至 9008 (EDL)</option>
                          </Select>
                        </div>
                      )}

                      {selectedMcpTool.name === "admt_list_packages" && (
                        <div>
                          <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>过滤分类：</label>
                          <Select
                            value={mcpParamInputs.filter || "all"}
                            onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, filter: d.value }))}
                          >
                            <option value="all">所有应用 (All)</option>
                            <option value="third_party">第三方用户应用 (3rd-party)</option>
                            <option value="system">系统内置应用 (System)</option>
                          </Select>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          appearance="primary"
                          disabled={isTestingMcp}
                          icon={isTestingMcp ? <Spinner size="tiny" /> : <Play24Regular />}
                          onClick={handleRunManualMcpTool}
                        >
                          {isTestingMcp ? "正在执行..." : "立即测试执行"}
                        </Button>
                        {mcpTestResult && (
                          <Button appearance="secondary" onClick={handleInsertMcpResultToChat}>
                            将输出结果带入对话
                          </Button>
                        )}
                      </div>

                      {mcpTestResult && (
                        <div
                          style={{
                            padding: "10px",
                            borderRadius: "6px",
                            backgroundColor: "#1e293b",
                            color: "#f8fafc",
                            fontFamily: "Consolas, monospace",
                            fontSize: "12px",
                            whiteSpace: "pre-wrap",
                            maxHeight: "180px",
                            overflowY: "auto",
                          }}
                        >
                          {JSON.stringify(mcpTestResult, null, 2)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsSkillsMcpModalOpen(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* AI 方案与快速配置弹窗 */}
      <Dialog open={isPresetModalOpen} onOpenChange={(_, data) => !data.open && setIsPresetModalOpen(false)}>
        <DialogSurface style={{ maxWidth: "620px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsPresetModalOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkle24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>AI 配置方案管理</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              {/* 分段标签切换 */}
              <div style={{
                display: "flex",
                gap: "6px",
                padding: "3px",
                borderRadius: "9999px",
                backgroundColor: "var(--colorNeutralBackground3)",
                width: "fit-content"
              }}>
                <Button
                  size="small"
                  appearance={presetModalTab === "presets" ? "primary" : "subtle"}
                  onClick={() => setPresetModalTab("presets")}
                  style={{ borderRadius: "9999px", fontSize: "12px", height: "26px" }}
                >
                  多方案选择与切换 ({aiPresets.length})
                </Button>
                <Button
                  size="small"
                  appearance={presetModalTab === "quickConfig" ? "primary" : "subtle"}
                  onClick={() => setPresetModalTab("quickConfig")}
                  style={{ borderRadius: "9999px", fontSize: "12px", height: "26px" }}
                >
                  快捷通道与密钥配置
                </Button>
              </div>

              {presetModalTab === "presets" ? (
                /* Tab 1: 方案列表与保存 */
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* 保存当前为新方案 */}
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    backgroundColor: "var(--colorNeutralBackground2)",
                    border: "1px solid var(--colorNeutralStroke2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    <Text size={200} weight="semibold">将当前参数保存为新方案</Text>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Input
                        value={newPresetNameInput}
                        onChange={(_, d) => setNewPresetNameInput(d.value)}
                        placeholder="例如：DeepSeek 极速版 或 GPT-4o 工作版"
                        style={{ flex: 1 }}
                        size="small"
                      />
                      <Button
                        appearance="primary"
                        icon={<Add24Regular />}
                        size="small"
                        onClick={handleSaveAsPreset}
                        disabled={!newPresetNameInput.trim()}
                      >
                        保存方案
                      </Button>
                    </div>
                  </div>

                  {/* 方案列表 */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                      已保存的方案列表（点击可立即切换）：
                    </Text>
                    {aiPresets.length === 0 ? (
                      <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--colorNeutralForeground4)", fontSize: "13px" }}>
                        暂未保存任何方案，您可以将当前的 API 配置保存为方案以便随时切换。
                      </div>
                    ) : (
                      aiPresets.map(preset => {
                        const isActive = activePresetId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "10px",
                              border: isActive ? "1px solid var(--colorBrandStroke1)" : "1px solid var(--colorNeutralStroke2)",
                              backgroundColor: isActive ? "var(--colorBrandBackground2)" : "var(--colorNeutralBackground2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Text weight={isActive ? "semibold" : "medium"} size={300}>
                                  {preset.name}
                                </Text>
                                {isActive && (
                                  <Badge size="small" appearance="filled" color="brand">当前生效</Badge>
                                )}
                              </div>
                              <Text size={100} style={{ color: "var(--colorNeutralForeground3)" }}>
                                通道: {preset.provider} | 模型: {preset.model || "默认"}
                              </Text>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {!isActive && (
                                <Button
                                  size="small"
                                  appearance="secondary"
                                  onClick={() => {
                                    applyPreset(preset.id);
                                    setStatusBarMessage({
                                      type: "success",
                                      message: `已切换至方案: ${preset.name}`,
                                    });
                                  }}
                                >
                                  应用
                                </Button>
                              )}
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<Delete24Regular />}
                                onClick={() => {
                                  deletePreset(preset.id);
                                  setStatusBarMessage({
                                    type: "info",
                                    message: `已删除方案: ${preset.name}`,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Tab 2: 快捷参数配置 */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Text size={200}>AI 供应商通道：</Text>
                    <Select
                      value={quickProvider}
                      onChange={(_, d) => setQuickProvider(d.value)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="google">Google (Gemini)</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="qwen">阿里通义千问 (Qwen)</option>
                      <option value="zhipu">智谱AI (GLM)</option>
                      <option value="siliconflow">硅基流动 (SiliconFlow)</option>
                      <option value="groq">Groq</option>
                      <option value="nvidia">英伟达 (Nvidia)</option>
                      <option value="local">Local 本地模型 (Ollama)</option>
                    </Select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Text size={200}>模型名称 (Model)：</Text>
                    <Input
                      value={quickModel}
                      onChange={(_, d) => setQuickModel(d.value)}
                      placeholder="例如：deepseek-chat, gpt-4o, qwen-turbo..."
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <Text size={200}>API Key (密钥)：</Text>
                    <Input
                      type="password"
                      value={quickApiKey}
                      onChange={(_, d) => setQuickApiKey(d.value)}
                      placeholder="sk-..."
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <Button
                      appearance="subtle"
                      onClick={() => {
                        setIsPresetModalOpen(false);
                        setCurrentView("settings", { tab: "ai-settings" });
                      }}
                      style={{ fontSize: "12px", color: "var(--colorBrandForeground1)" }}
                    >
                      打开完整 AI 设置面板 ↗
                    </Button>

                    <Button
                      appearance="primary"
                      onClick={handleSaveQuickConfig}
                      disabled={isSavingQuickConfig}
                      icon={isSavingQuickConfig ? <Spinner size="tiny" /> : undefined}
                    >
                      {isSavingQuickConfig ? "正在保存..." : "保存并应用当前配置"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsPresetModalOpen(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default AIChatPanel;

