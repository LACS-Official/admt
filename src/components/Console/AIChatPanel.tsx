import React, { useState, useRef, useEffect } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Button,
  Input,
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
} from "@fluentui/react-icons";
import { useAIChatStore, Message } from "../../stores/aiChatStore";
import { useAppStore } from "../../stores/appStore";
import { fetch } from "@tauri-apps/plugin-http";
import { logService } from "../../services/logService";

const useStyles = makeStyles({
  container: {
    display: "flex",
    height: "100%",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  sidebar: {
    width: "260px",
    display: "flex",
    flexDirection: "column",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: "var(--colorNeutralBackground2)",
    "@media (max-width: 600px)": {
      display: "none",
    },
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
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    scrollBehavior: "smooth",
  },
  messageGroup: {
    display: "flex",
    gap: "12px",
    maxWidth: "85%",
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
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
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
    padding: "16px 20px",
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: "var(--colorNeutralBackground1)",
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
    padding: "8px",
    display: "flex",
    justifyContent: "center",
    fontSize: "11px",
    color: tokens.colorNeutralForeground4,
  }
});

const AIChatPanel: React.FC = () => {
  const styles = useStyles();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    conversations, 
    currentConversationId, 
    createNewConversation, 
    addMessage, 
    setCurrentConversation,
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
      const { config } = useAppStore.getState();
      const aiConfig = config.ai;
      
      console.log("当前 AI 配置:", aiConfig);
      
      if (!aiConfig?.enabled) {
        throw new Error("AI服务未启用，请前往设置开启。");
      }

      const provider = aiConfig.provider;
      const endpoint = aiConfig.endpoint;
      const apiKey = aiConfig.apiKey;
      const model = aiConfig.model;

      if (!apiKey) {
        throw new Error(`请先在设置中配置 ${provider.toUpperCase()} 的 API Key。`);
      }

      logService.info(`正在发送 AI 请求 (${provider})`, "AIChat", { model, endpoint });

      // Prepare payload based on provider
      let body: any;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      if (provider === "openai" || provider === "local") {
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          model: model || "gpt-3.5-turbo",
          messages: [...chatHistory, { role: "user", content: userContent }],
          temperature: 0.7,
        };
      } else if (provider === "anthropic") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        body = {
          model: model || "claude-3-haiku-20240307",
          messages: [...chatHistory, { role: "user", content: userContent }],
          max_tokens: 1024,
        };
        // Anthropic requires specific structure, this is simplified
      } else if (provider === "google") {
        // Google Gemini uses a different endpoint structure
        // This is a simplified fallback
        body = { contents: [{ parts: [{ text: userContent }] }] };
      }

      const startTime = Date.now();
      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const fullUrl = baseUrl + (provider === "openai" || provider === "local" ? "/chat/completions" : "");
      
      console.log("即将在发送请求:", { url: fullUrl, provider, model });

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        connectTimeout: 30000,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || "请求失败"}`);
      }

      const result = await response.json();
      let responseText = "";

      if (provider === "openai" || provider === "local") {
        responseText = result.choices?.[0]?.message?.content || "无回复内容";
      } else if (provider === "anthropic") {
        responseText = result.content?.[0]?.text || "无回复内容";
      } else if (provider === "google") {
        responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "无回复内容";
      }

      const duration = Date.now() - startTime;
      logService.info("AI 请求成功", "AIChat", { duration: `${duration}ms` });
      
      addMessage(convId, { role: "assistant", content: responseText });

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
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <History24Regular />
            <Text>对话历史</Text>
          </div>
          <Button 
            icon={<Add24Regular />} 
            appearance="primary"
            onClick={() => createNewConversation()}
          >
            新对话
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
            >
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
          <Button 
            icon={<Delete24Regular />} 
            appearance="subtle" 
            style={{ width: '100%' }}
            onClick={clearHistory}
          >
            清除所有记录
          </Button>
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
                        msg.role === "user" ? styles.userContent : styles.botContent
                      )}
                    >
                      {msg.content}
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
                <Input
                  className={styles.input}
                  placeholder="输入消息，Shift+Enter 换行"
                  value={inputValue}
                  onChange={(e, data) => setInputValue(data.value)}
                  onKeyDown={handleKeyPress}
                  size="large"
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
