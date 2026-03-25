import React, { useState, useRef, useEffect } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Input,
  Textarea,
  Text,
  Avatar,
  Divider,
  mergeClasses,
  Tooltip,
  Spinner,
} from "@fluentui/react-components";
import {
  Send24Regular,
  Add24Regular,
  Delete24Regular,
  History24Regular,
  Chat24Regular,
  Bot24Regular,
  Person24Regular,
  ArrowSync24Regular,
  MoreHorizontal24Regular,
  Copy24Regular,
  PanelLeft24Regular,
  PanelRight24Regular,
} from "@fluentui/react-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAIChatStore, Message } from "../../stores/aiChatStore";
import { useAppStore } from "../../stores/appStore";
import { fetch } from "@tauri-apps/plugin-http";
import { logService } from "../../services/logService";
import { aiService } from "../../services/aiService";
import { listen } from "@tauri-apps/api/event";

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

const AIChatPanel: React.FC = () => {
  const styles = useStyles();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const { 
    conversations, 
    currentConversationId, 
    addMessage, 
    setCurrentConversation,
    createNewConversation,
    deleteConversation,
    clearHistory
  } = useAIChatStore();
  
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

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
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), 150)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userContent = inputValue.trim();
    setInputValue("");
    
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

      const response = await aiService.chat([...chatHistory, { role: "user", content: userContent }]);

      if (response.error) {
        throw new Error(response.error);
      }
      
      addMessage(convId, { role: "assistant", content: response.content });

    } catch (error: any) {
      logService.error("AI 请求失败", "AIChat", { error: error.message });
      addMessage(convId || "", { 
        role: "assistant", 
        content: `❌ 请求失败: ${error.message}\n\n建议检查：\n1. 网络连接是否正常\n2. API Key 及 Endpoint 是否正确\n3. 如果是本地模型，确保服务已开启` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar - History */}
      <div className={mergeClasses(styles.sidebar, isSidebarCollapsed && styles.sidebarCollapsed)}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <Tooltip content={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"} relationship="label">
              <Button 
                icon={isSidebarCollapsed ? <PanelRight24Regular /> : <PanelLeft24Regular />} 
                appearance="subtle"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              />
            </Tooltip>
            {!isSidebarCollapsed && <Text>对话历史</Text>}
          </div>
          <Button 
            icon={<Add24Regular />} 
            appearance="primary"
            onClick={() => createNewConversation()}
            style={{ minWidth: isSidebarCollapsed ? "40px" : "auto" }}
          >
            {!isSidebarCollapsed && "新对话"}
          </Button>
        </div>
        <Divider />
        <div className={styles.historyList}>
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              className={mergeClasses(
                styles.historyItem,
                currentConversationId === conv.id && styles.historyItemActive
              )}
              onClick={() => setCurrentConversation(conv.id)}
              style={{ justifyContent: isSidebarCollapsed ? "center" : "space-between" }}
            >
              {isSidebarCollapsed ? (
                <Tooltip content={conv.title} relationship="label">
                   <Chat24Regular />
                </Tooltip>
              ) : (
                <>
                  <div className={styles.historyItemTitle}>{conv.title}</div>
                  <Tooltip content="删除" relationship="label">
                    <Button 
                      size="small" 
                      appearance="subtle" 
                      icon={<Delete24Regular />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    />
                  </Tooltip>
                </>
              )}
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground4 }}>
              暂无历史记录
            </div>
          )}
        </div>
        <Divider />
        <div style={{ padding: '8px' }}>
          <Tooltip content={isSidebarCollapsed ? "清除对话历史" : ""} relationship="label">
            <Button 
              icon={<Delete24Regular />} 
              appearance="subtle" 
              style={{ width: '100%', minWidth: isSidebarCollapsed ? "40px" : "auto" }}
              onClick={clearHistory}
            >
              {!isSidebarCollapsed && "清除所有记录"}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {currentConversationId ? (
          <>
            <div className={styles.messageList}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <Bot24Regular style={{ fontSize: '48px' }} />
                  <Text size={500}>有什么可以帮您的？</Text>
                  <Text align="center">您可以询问关于 Android 调试、刷机或者是 ADMT 工具的使用方法。</Text>
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
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
              <div className={styles.inputWrapper}>
                <Textarea
                  ref={textareaRef}
                  className={styles.input}
                  placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                  value={inputValue}
                  onChange={(e, data) => setInputValue(data.value)}
                  onKeyDown={handleKeyPress}
                  size="large"
                  resize="none"
                  style={{ minHeight: '40px', overflowY: 'auto' }}
                />
                <Button 
                  icon={<Send24Regular />} 
                  appearance="primary" 
                  size="large"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                />
              </div>
              <div className={styles.footer}>
                AI 助手是由大语言模型驱动的，可能会产生错误。
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
