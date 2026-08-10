import React, { useState, useRef, useEffect } from "react";
import {
  makeStyles,
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
  Play24Regular,
  PanelLeft24Regular,
  PanelRight24Regular,
  ArrowDownload24Regular,
  Sparkle24Regular,
  DocumentAdd24Regular,
  DismissCircle24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { useAIChatStore } from "../../stores/aiChatStore";
import { useAppStore } from "../../stores/appStore";
import { logService } from "../../services/logService";
import { aiService } from "../../services/aiService";
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
    height: "100vh",
    width: "100vw",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  sidebar: {
    width: "260px",
    transition: "width 0.3s ease",
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: "var(--colorNeutralBackground2)",
    "@media (max-width: 480px)": {
      display: "none",
    },
  },
  sidebarCollapsed: {
    width: "64px",
  },
  sidebarHeader: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sidebarTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "bold",
    fontSize: "16px",
  },
  historyList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  historyItem: {
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "space-between",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  historyItemActive: {
    backgroundColor: tokens.colorNeutralBackground2Selected,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Selected,
    },
  },
  historyItemTitle: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontSize: "13px",
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
    padding: "8px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "var(--colorNeutralBackground1)",
    minHeight: "50px",
    height: "auto",
    flexShrink: 0,
    flexWrap: "wrap",
    rowGap: "8px",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    scrollBehavior: "smooth",
    minHeight: 0,
  },
  messageGroup: {
    display: "flex",
    gap: "12px",
    maxWidth: "70%",
    position: "relative",
    width: "fit-content",
    ":hover .message-actions": {
      opacity: 1,
    },
  },
  messageActions: {
    position: "absolute",
    display: "flex",
    gap: "4px",
    opacity: 0,
    transition: "opacity 0.2s",
    padding: "4px",
    zIndex: 1,
  },
  userActions: {
    right: "calc(100% + 4px)",
    top: 0,
  },
  botActions: {
    left: "calc(100% + 4px)",
    top: 0,
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  messageContent: {
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
    whiteSpace: "normal",
    wordBreak: "break-word",
    maxWidth: "100%",
    maxHeight: "60vh",
    overflowY: "auto",
    overflowX: "hidden",
  },
  userContent: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  botContent: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  inputArea: {
    padding: "12px 20px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: "var(--colorNeutralBackground1)",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  input: {
    flex: 1,
    minHeight: "40px",
    maxHeight: "150px",
    overflow: "hidden",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
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

const AGENT_SYSTEM_PROMPT = `你是一个Android系统智能操作代理。你的主要任务是根据用户的输入，转换成对应的ADB或Fastboot命令。
请检查设备状态，并在回答时，必须且只能输出严格的JSON格式，不要包含任何Markdown标记包裹（如 \`\`\`json ... \`\`\`），确保以下JSON结构完整：
{
  "thought": "对用户意图的理解和操作逻辑说明（中文）",
  "danger_level": "low" | "medium" | "high",
  "risk_warning": "针对此操作的安全风险提示，若无则为空字符串",
  "actions": [
    {
      "type": "adb_shell" | "adb_command" | "fastboot",
      "command": "具体执行的命令（去掉 'adb ' 或 'fastboot ' 前缀，例如 'shell pm list packages' 或 'reboot'，也不要加 '-s <serial>' 等序列号参数）",
      "description": "该步骤的具体说明（如 '列出所有第三方应用'）"
    }
  ]
}
如果用户的输入不包含操作意图，或者不是一条能够转换为指令的操作（例如只是日常闲聊），请回复以下格式：
{
  "thought": "非操作意图，进入日常闲聊",
  "danger_level": "low",
  "risk_warning": "",
  "actions": []
}
请确保你输出的仅仅是这段JSON，没有任何多余的Markdown标记或说明文字。`;

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

const AIChatPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean[]>>({});
  const [executingMsgId, setExecutingMsgId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<Record<string, string>>({});
  
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

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
  } = useAIChatStore();
  const { setStatusBarMessage } = useAppStore();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = React.useMemo(() => currentConversation?.messages || [], [currentConversation?.messages]);

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
      textareaRef.current.style.height = "40px";
      const scrollHeight = textareaRef.current.scrollHeight;
      const targetHeight = Math.min(Math.max(scrollHeight, 40), 150);
      textareaRef.current.style.height = `${targetHeight}px`;
      
      if (scrollHeight > 150) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
      textareaRef.current.style.overflowX = "hidden";
    }
  }, [inputValue]);

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

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content
      }));

      // Prepend dynamic system message
      const systemMessage = isAgentMode ? AGENT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT;
      const finalMessages = [
        { role: "system" as const, content: systemMessage },
        ...chatHistory,
        { role: "user" as const, content: userContent }
      ];

      const response = await aiService.chat(finalMessages);

      if (response.error) {
        throw new Error(response.error);
      }
      
      const assistantMsgId = addMessage(convId, { role: "assistant", content: response.content });

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

    } catch (error: any) {
      logService.error("AI 聊天界面请求失败", "AIChat", { 
        error: error.message, 
        stack: error.stack,
        isAgentMode,
        conversationId: convId,
        category: "ai" 
      });
      addMessage(convId || "", { 
        role: "assistant", 
        content: `❌ 请求失败: ${error.message}\n\n建议检查：\n1. 网络连接是否正常\n2. API Key 及 Endpoint 是否正确\n3. 如果是本地模型，确保服务已开启` 
      });
    } finally {
      setIsLoading(false);
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
        [msgId]: "❌ 执行失败: 未检测到已选中的 Android 设备，请连接并选择设备后重试。\n"
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
          [msgId]: (prev[msgId] || "") + `⚙️ [安全校验] 正在校验: ${action.command} ...\n`
        }));

        // 2. 调用 Rust 后端进行安全检查
        const safetyResult = await invoke<{ isSafe: boolean; dangerLevel: string; message: string }>(
          "verify_command_safety",
          { command: action.command }
        );

        if (!safetyResult.isSafe || safetyResult.dangerLevel === "blocked") {
          setExecutionLogs(prev => ({
            ...prev,
            [msgId]: (prev[msgId] || "") + `🚨 [被拦截] 该命令为高危指令: ${action.command}\n原因: ${safetyResult.message}\n停止执行后续指令。\n`
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
            [msgId]: (prev[msgId] || "") + `⚠️ [安全警告] ${safetyResult.message}\n`
          }));
        }

        // 3. 执行指令
        setExecutionLogs(prev => ({
          ...prev,
          [msgId]: (prev[msgId] || "") + `▶️ [正在执行] ${action.command} ...\n`
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
            [msgId]: (prev[msgId] || "") + `✅ [执行成功]\n${result.output || "(无输出)"}\n`
          }));
        } else {
          setExecutionLogs(prev => ({
            ...prev,
            [msgId]: (prev[msgId] || "") + `❌ [执行失败]\n错误信息: ${result.error || "未知错误"}\n停止后续指令的执行。\n`
          }));
          setStatusBarMessage({
            type: "error",
            message: `执行指令失败: ${result.error || "未知错误"}`
          });

          // 如果开启了智能代理模式，自动启动自我纠错诊断与修复
          if (isAgentMode) {
            setExecutionLogs(prev => ({
              ...prev,
              [msgId]: (prev[msgId] || "") + `🤖 [自我纠错] 正在将错误报告自动反馈给 AI 助手进行诊断与修复方案生成...\n`
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
        [msgId]: (prev[msgId] || "") + `❌ [异常崩溃] 执行过程中遇到意外错误: ${e.message || String(e)}\n`
      }));
    } finally {
      setExecutingMsgId(null);
    }
  };

  const handleAutoDiagnoseAndFix = async (failedAction: AgentAction, errorMsg: string) => {
    const convId = useAIChatStore.getState().currentConversationId;
    if (!convId) return;

    setIsLoading(true);

    const feedbackContent = `⚠️ [系统自动反馈] 指令执行失败！\n失败的指令: \`${failedAction.command}\`\n执行类型: \`${failedAction.type}\`\n错误信息: \`${errorMsg}\`\n\n请自我解析此错误，分析原因，并提供下一步的修复方案或可用的替代指令（如果有的话）。`;
    
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
        content: `❌ 自动错误反馈与诊断请求失败: ${e.message || String(e)}。建议您手动修改或执行替代指令。`
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

    addMessage(convId, { role: "user", content: "🔍 正在从手机抓取 Logcat 崩溃日志并进行诊断..." });

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
          content: "ℹ️ 未在设备中检测到最近的 Crash 堆栈或错误日志 (Logcat 为空)。请确保手机中已发生过崩溃，或重新连接设备重试。"
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

      const response = await aiService.chat([
        { role: "system", content: "你是一个资深的 Android 崩溃日志诊断专家。请仔细阅读 Logcat 日志，找出崩溃根源并给出修复方案。" },
        { role: "user", content: prompt }
      ]);

      if (response.error) {
        throw new Error(response.error);
      }

      addMessage(convId, { role: "assistant", content: response.content });

    } catch (error: any) {
      logService.error("Logcat 诊断失败", "AIChat", { error: error.message, category: "ai" });
      addMessage(convId, {
        role: "assistant",
        content: `❌ Logcat 诊断请求失败: ${error.message}\n\n建议检查设备连接是否正常，或在设置中切换模型通道。`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!currentConversation || messages.length === 0) return;

    try {
      const markdown = messages.map(msg => {
        const role = msg.role === "user" ? "用户" : "AI 助手";
        const time = new Date(msg.timestamp).toLocaleString();
        return `### ${role} (${time})\n\n${msg.content}\n\n---\n`;
      }).join("\n");

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
        const body = conv.messages.map(msg => {
          const role = msg.role === "user" ? "用户" : "AI 助手";
          const time = new Date(msg.timestamp).toLocaleString();
          return `### ${role} (${time})\n\n${msg.content}\n\n---\n`;
        }).join("\n");
        return header + body;
      }).join("\n\n========================================\n\n");

      const filePath = await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
        defaultPath: `ADMT_AI_对话历史备份_${new Date().toLocaleDateString().replace(/[\/:]/g, "-")}.md`,
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

  const handleDiagnoseCardClick = async (type: "logcat" | "anr" | "admt" | "flash") => {
    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    if (type === "logcat") {
      if (!selectedDevice) {
        setStatusBarMessage({
          type: "error",
          message: "未选中设备：请先在主界面或连接管理中选中一台 Android 设备"
        });
        return;
      }
      handleLogcatDiagnose();
    } else if (type === "anr") {
      setInputValue("🔍 请帮我诊断和分析手机中的 ANR (程序无响应) 故障。如果可以，请帮我列出如何获取 /data/anr/ 下的 Trace 文件，以及如何定位导致主线程卡死的具体原因。");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else if (type === "admt") {
      setInputValue("🔍 我遇到了玩机管家 (ADMT) 的报错或异常。请帮我分析该如何排查：\n1. ADB/Fastboot 驱动或可执行文件初始化失败；\n2. 设备连接不稳定或无法识别；\n3. 软件激活及网络接口问题。");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else if (type === "flash") {
      setInputValue("🔍 请帮我分析刷机/Root/刷写分区时遇到的失败日志。例如 Fastboot 报错、Magisk 补丁刷入失败、AB 分区切换后无法开机等情况，应该如何排查和恢复？");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRunCommand = async (cmd: string) => {
    // Check if the command line window is available
    const cmdWindow = await WebviewWindow.getByLabel("command-line");
    if (cmdWindow) {
      await cmdWindow.show();
      await cmdWindow.setFocus();
    } else {
      // If the unified layout doesn't use the separate window, maybe emit directly will show it in App.
      // E.g., user is in the main window
      const currentWindow = await WebviewWindow.getCurrent();
      await currentWindow.setFocus(); 
    }
    
    // Broadcast the event to command-line module
    emit("execute-command-from-ai", { command: cmd.trim() });
    setStatusBarMessage({
      type: "success",
      message: "已发送指令至命令行执行"
    });
  };

  return (
    <div className={styles.container}>
      {/* Sidebar - History */}
      <div className={mergeClasses(styles.sidebar, isSidebarCollapsed && styles.sidebarCollapsed)}>
        {isSidebarCollapsed ? (
          /* 折叠后的极简侧边栏 */
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: "20px", 
            padding: "16px 0", 
            height: "100%", 
            boxSizing: "border-box" 
          }}>
            {/* 1. 展开按钮 */}
            <Tooltip content="展开侧边栏" relationship="label">
              <Button 
                icon={<PanelRight24Regular />} 
                appearance="subtle"
                onClick={() => setIsSidebarCollapsed(false)}
              />
            </Tooltip>
            
            <Divider style={{ width: "60%" }} />

            {/* 2. 新建会话 */}
            <Tooltip content="新建会话" relationship="label">
              <Button 
                icon={<Add24Regular />} 
                appearance="primary"
                shape="circular"
                size="large"
                onClick={() => createNewConversation()}
              />
            </Tooltip>

            {/* 3. 对话历史 (点击可展开查看列表) */}
            <Tooltip content="查看对话历史列表" relationship="label">
              <Button 
                icon={<History24Regular />} 
                appearance="subtle"
                onClick={() => setIsSidebarCollapsed(false)}
              />
            </Tooltip>

            {/* 垂直弹性占位 */}
            <div style={{ flex: 1 }} />

            {/* 4. 批量操作 (纯图标) */}
            <Tooltip content="批量合并导出所有对话" relationship="label">
              <Button 
                icon={<ArrowDownload24Regular />} 
                appearance="subtle"
                onClick={handleExportAllConversations}
                disabled={conversations.length === 0}
              />
            </Tooltip>

            {/* 5. 一键清理 (纯图标) */}
            <Tooltip content="清除所有历史记录" relationship="label">
              <Button 
                icon={<Delete24Regular style={{ color: conversations.length > 0 ? tokens.colorPaletteRedForeground1 : undefined }} />} 
                appearance="subtle"
                onClick={clearHistory}
                disabled={conversations.length === 0}
              />
            </Tooltip>
          </div>
        ) : (
          /* 展开时的四区分组排版 */
          <>
            <div className={styles.sidebarHeader} style={{ paddingBottom: "8px" }}>
              <div className={styles.sidebarTitle}>
                <Tooltip content="收起侧边栏" relationship="label">
                  <Button 
                    icon={<PanelLeft24Regular />} 
                    appearance="subtle"
                    onClick={() => setIsSidebarCollapsed(true)}
                  />
                </Tooltip>
                <Text weight="bold">AI 助手</Text>
              </div>
            </div>
            <Divider />

            <div style={{ padding: "8px 8px 0 8px", display: "flex", flexDirection: "column", gap: "14px", flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {/* 1. 会话管理 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground4, paddingLeft: "8px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                  会话管理
                </Text>
                <Button 
                  icon={<Add24Regular />} 
                  appearance="primary"
                  onClick={() => createNewConversation()}
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  新建会话
                </Button>
              </div>

              {/* 2. 会话列表 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minHeight: 0 }}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground4, paddingLeft: "8px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                  最近会话
                </Text>
                <div className={styles.historyList} style={{ maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
                  {conversations.map((conv) => (
                    <div 
                      key={conv.id} 
                      className={mergeClasses(
                        styles.historyItem,
                        currentConversationId === conv.id && styles.historyItemActive
                      )}
                      onClick={() => setCurrentConversation(conv.id)}
                      style={{ justifyContent: "space-between", padding: "6px 8px" }}
                    >
                      <div className={styles.historyItemTitle} style={{ fontSize: "13px" }}>{conv.title}</div>
                      <Tooltip content="删除会话" relationship="label">
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
                  ))}
                  {conversations.length === 0 && (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: tokens.colorNeutralForeground4, fontSize: "12px" }}>
                      暂无历史记录
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 批量操作 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground4, paddingLeft: "8px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                  批量操作
                </Text>
                <Button 
                  icon={<ArrowDownload24Regular />} 
                  appearance="subtle"
                  onClick={handleExportAllConversations}
                  disabled={conversations.length === 0}
                  style={{ width: "100%", justifyContent: "flex-start", paddingLeft: "12px" }}
                >
                  批量导出对话
                </Button>
              </div>

              {/* 4. 系统清理 (回收站分区) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBottom: "12px" }}>
                <Text size={100} style={{ color: tokens.colorNeutralForeground4, paddingLeft: "8px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                  系统清理
                </Text>
                <Button 
                  icon={<Delete24Regular style={{ color: conversations.length > 0 ? tokens.colorPaletteRedForeground1 : undefined }} />} 
                  appearance="subtle"
                  onClick={clearHistory}
                  disabled={conversations.length === 0}
                  style={{ 
                    width: "100%", 
                    justifyContent: "flex-start", 
                    paddingLeft: "12px",
                    color: conversations.length > 0 ? tokens.colorPaletteRedForeground1 : undefined
                  }}
                >
                  清除所有记录
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
    <div className={styles.chatArea}>
      <div className={styles.chatHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0, flexWrap: "wrap", rowGap: "8px" }}>
          <Text weight="semibold" className={styles.historyItemTitle} style={{ flex: "none", maxWidth: "160px" }}>
            {currentConversation?.title || "AI 玩机助手"}
          </Text>
          
          {/* AI助手控制台控件组 */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            backgroundColor: tokens.colorNeutralBackground2, 
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            borderRadius: "6px",
            padding: "4px 8px",
            height: "32px",
            boxSizing: "border-box"
          }}>
            <Switch
              label={isAgentMode ? "智能代理" : "常规问答"}
              checked={isAgentMode}
              onChange={(e, data) => setAgentMode(data.checked)}
              style={{ margin: 0 }}
            />
            {isAgentMode && <div style={{ width: "1px", height: "16px", backgroundColor: tokens.colorNeutralStroke2 }} />}
            {isAgentMode && (
              <Switch
                label={isAutoExecute ? "自动执行" : "手动审核"}
                checked={isAutoExecute}
                onChange={(e, data) => setAutoExecute(data.checked)}
                style={{ margin: 0 }}
              />
            )}
            {aiPresets.length > 0 && <div style={{ width: "1px", height: "16px", backgroundColor: tokens.colorNeutralStroke2 }} />}
            {aiPresets.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Select
                  value={activePresetId || ""}
                  onChange={(_, data) => {
                    applyPreset(data.value);
                    const selectedName = aiPresets.find(p => p.id === data.value)?.name || "自定义配置";
                    setStatusBarMessage({
                      type: "success",
                      message: `当前 AI 方案已切换为: ${selectedName}`,
                    });
                  }}
                  size="small"
                  style={{ width: "115px", height: "24px", minWidth: "80px" }}
                >
                  <option value="">-- 自定义配置 --</option>
                  {aiPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>
        <Tooltip content="导出当前对话为 Markdown 格式" relationship="label">
          <Button 
            icon={<ArrowDownload24Regular />} 
            appearance="subtle"
            onClick={handleExportMarkdown}
            disabled={!currentConversationId || messages.length === 0}
          />
        </Tooltip>
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
                  
                  {/* 2x2 快捷诊断卡片组 */}
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
                      onClick={() => handleDiagnoseCardClick("logcat")}
                      style={{
                        padding: "16px",
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        borderRadius: "8px",
                        backgroundColor: tokens.colorNeutralBackground1,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        textAlign: "left",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorBrandStroke1;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1Hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorNeutralStroke2;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1;
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkle24Regular style={{ color: tokens.colorBrandForeground1 }} />
                        <Text weight="semibold">Logcat 崩溃诊断</Text>
                      </div>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground4, lineHeight: "1.4" }}>
                        自动抓取手机的最新错误和 Crash 日志，并由 AI 进行故障分析。
                      </Text>
                    </div>

                    {/* 卡片 2: ANR 分析 */}
                    <div 
                      onClick={() => handleDiagnoseCardClick("anr")}
                      style={{
                        padding: "16px",
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        borderRadius: "8px",
                        backgroundColor: tokens.colorNeutralBackground1,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        textAlign: "left",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorBrandStroke1;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1Hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorNeutralStroke2;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1;
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <History24Regular style={{ color: "#EAB308" }} />
                        <Text weight="semibold">ANR 无响应分析</Text>
                      </div>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground4, lineHeight: "1.4" }}>
                        排查手机界面冻结、无响应故障，获取 traces 日志定位分析。
                      </Text>
                    </div>

                    {/* 卡片 3: ADMT 报错解析 */}
                    <div 
                      onClick={() => handleDiagnoseCardClick("admt")}
                      style={{
                        padding: "16px",
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        borderRadius: "8px",
                        backgroundColor: tokens.colorNeutralBackground1,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        textAlign: "left",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorBrandStroke1;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1Hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorNeutralStroke2;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1;
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Bot24Regular style={{ color: "#3B82F6" }} />
                        <Text weight="semibold">管家运行诊断</Text>
                      </div>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground4, lineHeight: "1.4" }}>
                        排查管家驱动初始化异常、设备连接不畅或激活服务连通失败。
                      </Text>
                    </div>

                    {/* 卡片 4: 刷机日志排查 */}
                    <div 
                      onClick={() => handleDiagnoseCardClick("flash")}
                      style={{
                        padding: "16px",
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        borderRadius: "8px",
                        backgroundColor: tokens.colorNeutralBackground1,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        textAlign: "left",
                        gap: "6px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorBrandStroke1;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1Hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = tokens.colorNeutralStroke2;
                        e.currentTarget.style.backgroundColor = tokens.colorNeutralBackground1;
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Play24Regular style={{ color: "#10B981" }} />
                        <Text weight="semibold">刷机日志排查</Text>
                      </div>
                      <Text size={100} style={{ color: tokens.colorNeutralForeground4, lineHeight: "1.4" }}>
                        针对 Fastboot 分区写入报错、Rom 升级失效及开机环等进行排障。
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
                        styles.messageContent,
                        msg.role === "user" ? styles.userContent : styles.botContent,
                        styles.markdownWrapper
                      )}
                    >
                      {(() => {
                        if (msg.role !== "user") {
                          const agentData = parseAgentResponse(msg.content);
                          if (agentData) {
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", minWidth: "280px" }}>
                                <div style={{ marginBottom: "4px" }}>
                                  <Text weight="semibold">🤖 AI 的思考:</Text>
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
                                    <Text weight="semibold">{agentData.danger_level === "high" ? "🚨 高危风险警告: " : "⚠️ 安全提示: "}</Text>
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
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                const rawCode = String(children).replace(/\n$/, "");
                                
                                if (!inline && rawCode.length > 0) {
                                  const isCommand = match && ["bash", "sh", "batch", "powershell"].includes(match[1]) || rawCode.startsWith("adb ") || rawCode.startsWith("fastboot ");
                                  return (
                                    <div style={{ 
                                      border: `1px solid ${tokens.colorNeutralStroke2}`, 
                                      borderRadius: "6px", 
                                      overflow: "hidden", 
                                      margin: "8px 0" 
                                    }}>
                                      <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center", 
                                        padding: "4px 8px", 
                                        backgroundColor: tokens.colorNeutralBackground3,
                                        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
                                      }}>
                                        <Text size={200} style={{ fontFamily: "monospace" }}>
                                          {match ? match[1] : "code"}
                                        </Text>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                          <Tooltip content="复制完整代码" relationship="label">
                                            <Button 
                                              size="small" 
                                              appearance="subtle" 
                                              icon={<Copy24Regular style={{ fontSize: "16px" }} />} 
                                              onClick={() => navigator.clipboard.writeText(rawCode)}
                                            />
                                          </Tooltip>
                                          {isCommand && (
                                            <Tooltip content="在命令行工具中运行" relationship="label">
                                              <Button 
                                                size="small" 
                                                appearance="subtle" 
                                                icon={<Play24Regular style={{ fontSize: "16px" }} />} 
                                                onClick={() => handleRunCommand(rawCode)}
                                              />
                                            </Tooltip>
                                          )}
                                        </div>
                                      </div>
                                      <div style={{ padding: 0 }}>
                                        <pre className={className} style={{ margin: 0, padding: "8px", overflowX: "auto" }}>
                                          <code className={className} {...props}>
                                            {children}
                                          </code>
                                        </pre>
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
                        );
                      })()}
                    </div>
                    
                    {/* Copy Button */}
                    <div className={mergeClasses(
                      "message-actions",
                      styles.messageActions,
                      msg.role === "user" ? styles.userActions : styles.botActions
                    )}>
                      <Tooltip content="复制内容" relationship="label">
                        <Button 
                          size="small" 
                          appearance="subtle" 
                          icon={<Copy24Regular />} 
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className={styles.messageGroup + " " + styles.botMessage}>
                  <Avatar icon={<Bot24Regular />} color="colorful" />
                  <div className={styles.messageContent + " " + styles.botContent}>
                    <Spinner size="tiny" label="正在思考..." />
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
                  padding: "4px 0"
                }}>
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      backgroundColor: tokens.colorNeutralBackground3,
                      border: `1px solid ${tokens.colorNeutralStroke1}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}>
                      <span style={{
                        maxWidth: "180px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }} title={file.path}>
                        📎 {file.name}
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
              <div className={styles.inputWrapper}>
                {selectedDevice && (
                  <Tooltip content="抓取 Logcat 并诊断崩溃" relationship="label">
                    <Button
                      icon={<Sparkle24Regular />}
                      appearance="outline"
                      size="large"
                      onClick={handleLogcatDiagnose}
                      disabled={isLoading}
                    />
                  </Tooltip>
                )}
                <Tooltip content="添加文本/日志文件附件 (限制 2MB)" relationship="label">
                  <Button
                    icon={<DocumentAdd24Regular />}
                    appearance="outline"
                    size="large"
                    onClick={handleUploadFile}
                    disabled={isLoading}
                  />
                </Tooltip>
                <Textarea
                  ref={textareaRef}
                  className={styles.input}
                  placeholder="向 AI 玩机助手提问，或上传日志文件进行分析..."
                  value={inputValue}
                  onChange={(e, data) => setInputValue(data.value)}
                  onKeyDown={handleKeyPress}
                  size="large"
                  resize="none"
                  style={{ minHeight: '40px' }}
                  textarea={{
                    style: {
                      overflowX: "hidden",
                      overflowY: "hidden",
                    }
                  }}
                />
                <Button 
                  icon={<Send24Regular />} 
                  appearance="primary" 
                  size="large"
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
                />
              </div>
              <div className={styles.footer} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span>AI 助手是由大语言模型驱动的，可能会产生错误。</span>
                <span style={{ opacity: 0.8 }}>Enter 发送 / Shift + Enter 换行</span>
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
    </div>
  );
};

export default AIChatPanel;
