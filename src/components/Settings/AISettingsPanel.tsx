import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Input,
  Select,
  Slider,
  Button,
  Spinner,
  Divider,
  Badge,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  Bot24Regular,
  Wand24Regular,
  Save24Regular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  Delete24Regular,
  Add24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Server24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { fetch } from "@tauri-apps/plugin-http";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../../stores/appStore";
import { useAIChatStore } from "../../stores/aiChatStore";
import { useMcpStore } from "../../stores/mcpStore";
import { useTranslation } from "react-i18next";
import logService from "../../services/logService";

const useStyles = makeStyles({
  container: {
    padding: "16px 20px 24px 20px",
    height: "100%",
    overflow: "auto",
    backgroundColor: "transparent",
    boxSizing: "border-box",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "1120px",
    margin: "0 auto",
  },
  headerSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 0",
  },
  titleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleText: {
    fontWeight: "600",
    fontSize: "18px",
    color: "var(--colorNeutralForeground1)",
  },
  subtitleText: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    gap: "16px",
    alignItems: "stretch",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    justifyContent: "space-between",
  },
  primaryCard: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    padding: "16px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    flex: 1,
    justifyContent: "space-between",
  },
  gridTwoCols: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  actionCard: {
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "10px",
    flex: 1,
    boxSizing: "border-box",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
      transform: "translateY(-1px)",
    },
  },
  actionCardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  actionCardIcon: {
    padding: "8px",
    borderRadius: "10px",
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    fontSize: "20px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pillButton: {
    borderRadius: "9999px",
    fontWeight: 500,
  },
  input: {
    width: "100%",
  },
  codeBox: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "12px",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    maxHeight: "160px",
  },
});

const AISettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { config, updateConfig, saveToDisk, setStatusBarMessage } = useAppStore();
  const {
    aiPresets,
    activePresetId,
    savePreset,
    deletePreset,
    applyPreset,
    importPresets,
  } = useAIChatStore();
  const {
    config: mcpConfig,
    status: mcpStatus,
    updateConfig: updateMcpConfig,
    startServer: startMcpServer,
    stopServer: stopMcpServer,
  } = useMcpStore();

  // 弹窗状态管理（将非主要/过多设置改为弹窗）
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);

  // 核心输入与临时状态
  const [newPresetName, setNewPresetName] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [selectedMcpClient, setSelectedMcpClient] = useState<"cursor" | "claudeDesktop" | "antigravity" | "windsurf">("cursor");
  const [isCopiedMcp, setIsCopiedMcp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const handleToggleMcpServer = async (checked: boolean) => {
    if (checked) {
      const ok = await startMcpServer();
      if (ok) {
        setStatusBarMessage({
          type: "success",
          message: `ADMT MCP 本地服务已启动 (端口 ${mcpConfig.port})`,
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: "ADMT MCP 本地服务启动失败",
        });
      }
    } else {
      await stopMcpServer();
      setStatusBarMessage({
        type: "info",
        message: "ADMT MCP 本地服务已停止",
      });
    }
  };

  const getMcpClientSnippet = () => {
    const port = mcpConfig.port || 39860;
    const host = mcpConfig.host || "127.0.0.1";
    const sseUrl = `http://${host}:${port}/sse`;

    switch (selectedMcpClient) {
      case "cursor":
        return JSON.stringify(
          {
            mcpServers: {
              "admt-manager": {
                url: sseUrl,
              },
            },
          },
          null,
          2
        );
      case "claudeDesktop":
        return JSON.stringify(
          {
            mcpServers: {
              "admt-manager": {
                url: sseUrl,
              },
            },
          },
          null,
          2
        );
      case "antigravity":
        return JSON.stringify(
          {
            mcpServers: {
              "admt-manager": {
                url: sseUrl,
              },
            },
          },
          null,
          2
        );
      case "windsurf":
        return JSON.stringify(
          {
            mcpServers: {
              "admt-manager": {
                serverUrl: sseUrl,
              },
            },
          },
          null,
          2
        );
    }
  };

  const handleCopyMcpConfig = async () => {
    try {
      await navigator.clipboard.writeText(getMcpClientSnippet());
      setIsCopiedMcp(true);
      setTimeout(() => setIsCopiedMcp(false), 2000);
      setStatusBarMessage({
        type: "success",
        message: "MCP 客户端配置代码已复制到剪贴板",
      });
    } catch {
      setStatusBarMessage({
        type: "error",
        message: "复制失败，请手动选择复制",
      });
    }
  };

  const fetchAvailableModels = async () => {
    const { provider, apiKey, endpoint } = config.ai || {};
    if (!apiKey && provider !== "local") {
      setStatusBarMessage({
        type: "error",
        message: "获取模型前请先填写 API Key",
      });
      return;
    }

    setIsFetchingModels(true);
    try {
      let url = "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const baseEndpoint = endpoint?.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

      if (provider === "google") {
        url = `${endpoint}/v1beta/models?key=${apiKey}`;
      } else if (provider === "anthropic") {
        const staticAnthropic = [
          "claude-3-5-sonnet-20240620",
          "claude-3-haiku-20240307",
          "claude-3-opus-20240229"
        ];
        setAvailableModels(staticAnthropic);
        setStatusBarMessage({
          type: "success",
          message: "已加载 Anthropic 推荐模型列表",
        });
        return;
      } else {
        url = `${baseEndpoint}/models`;
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 获取失败`);
      }

      const resData = await response.json();
      let modelIds: string[] = [];

      if (provider === "google") {
        if (resData && Array.isArray(resData.models)) {
          modelIds = resData.models
            .map((m: any) => (m.name ? m.name.replace(/^models\//, "") : ""))
            .filter((name: string) => name && name.includes("gemini"));
        }
      } else {
        if (resData && Array.isArray(resData.data)) {
          modelIds = resData.data.map((m: any) => m.id).filter(Boolean);
        }
      }

      if (modelIds.length > 0) {
        const uniqueModels = Array.from(new Set(modelIds)).sort();
        setAvailableModels(uniqueModels);
        setStatusBarMessage({
          type: "success",
          message: `成功获取并加载了 ${uniqueModels.length} 个可用模型`,
        });
        logService.info(`成功获取模型列表: ${provider}`, "AISettings", { count: uniqueModels.length, models: uniqueModels, category: "network" });
      } else {
        throw new Error("接口返回的模型数据为空");
      }
    } catch (err: any) {
      logService.error(`获取模型列表失败: ${provider}`, "AISettings", {
        error: err.message,
        category: "network"
      });
      setStatusBarMessage({
        type: "warning",
        message: `获取模型列表失败: ${err.message}。您可以继续手动输入。`,
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleExportPresets = async () => {
    if (aiPresets.length === 0) {
      setStatusBarMessage({
        type: "warning",
        message: "当前没有任何可导出的 AI 方案",
      });
      return;
    }
    try {
      const filePath = await save({
        filters: [{ name: "JSON", extensions: ["json"] }],
        defaultPath: "ai_presets.json",
      });
      if (filePath) {
        await writeTextFile(filePath, JSON.stringify(aiPresets, null, 2));
        setStatusBarMessage({
          type: "success",
          message: "方案导出成功",
        });
      }
    } catch (error: any) {
      logService.error("导出方案失败", "AISettings", { error: error.message, category: "ai" });
      setStatusBarMessage({
        type: "error",
        message: `导出方案失败: ${error.message}`,
      });
    }
  };

  const handleImportPresets = async () => {
    try {
      const filePath = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (filePath && typeof filePath === "string") {
        const content = await readTextFile(filePath);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const isValid = parsed.every(p =>
            p && typeof p === "object" && "name" in p && "provider" in p && "apiKey" in p
          );
          if (isValid) {
            importPresets(parsed);
            setStatusBarMessage({
              type: "success",
              message: `成功导入 ${parsed.length} 个方案`,
            });
          } else {
            throw new Error("文件格式不正确，缺少必要的方案字段");
          }
        } else {
          throw new Error("导入的文件必须是方案数组");
        }
      }
    } catch (error: any) {
      logService.error("导入方案失败", "AISettings", { error: error.message, category: "ai" });
      setStatusBarMessage({
        type: "error",
        message: `导入方案失败: ${error.message}`,
      });
    }
  };

  const handleSaveAsPreset = () => {
    if (!newPresetName.trim()) {
      setStatusBarMessage({
        type: "error",
        message: "请输入方案名称",
      });
      return;
    }
    const { provider, apiKey, endpoint, temperature } = config.ai || {};
    const newId = savePreset({
      name: newPresetName.trim(),
      provider: provider || "openai",
      model: config.ai?.model || "",
      apiKey: apiKey || "",
      endpoint: endpoint || "",
      temperature: temperature ?? 0.7,
    });
    setNewPresetName("");
    setStatusBarMessage({
      type: "success",
      message: `方案「${newPresetName.trim()}」保存成功并已应用`,
    });
    applyPreset(newId);
  };

  const handleAIUpdate = (updates: Partial<typeof config.ai>) => {
    updateConfig({
      ai: {
        ...config.ai,
        ...(updates as any),
      },
    });
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const success = await saveToDisk();
      if (success) {
        setStatusBarMessage({
          type: "success",
          message: t("settings.ai_save_success"),
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: t("settings.ai_save_failed", { error: "Unknown error" }),
        });
      }
    } catch (error: any) {
      setStatusBarMessage({
        type: "error",
        message: t("settings.ai_save_failed", { error: error.message || error }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus({ type: "loading" });
    const { provider, apiKey, endpoint } = config.ai || {};
    const safeEndpoint = endpoint ? endpoint.replace(/key=[^&]+/g, "key=******") : "";
    logService.info(`开始测试 AI 连接: ${provider}`, "AISettings", { endpoint: safeEndpoint, category: "network" });

    try {
      if (!apiKey && provider !== "local") {
        throw new Error("API Key 不能为空");
      }

      let url = "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const baseEndpoint = endpoint?.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
      const isOpenAICompatiblePost = ["zhipu", "deepseek", "groq", "qwen", "siliconflow"].includes(provider);

      if (provider === "openai" || provider === "local") {
        url = `${baseEndpoint}/models`;
        headers["Authorization"] = `Bearer ${apiKey}`;
      } else if (provider === "anthropic") {
        url = `${baseEndpoint}/messages`;
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      } else if (provider === "google") {
        url = `${endpoint}/v1beta/models?key=${apiKey}`;
      } else if (isOpenAICompatiblePost) {
        url = `${baseEndpoint}/chat/completions`;
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, {
        method: provider === "anthropic" || isOpenAICompatiblePost ? "POST" : "GET",
        headers,
        body: provider === "anthropic" ? JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        }) : isOpenAICompatiblePost ? JSON.stringify({
          model: provider === "zhipu" ? "glm-4" :
            provider === "deepseek" ? "deepseek-chat" :
              provider === "groq" ? "llama3-8b-8192" :
                provider === "qwen" ? "qwen-turbo" :
                  provider === "siliconflow" ? "deepseek-ai/DeepSeek-V3" : "gpt-3.5-turbo",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        }) : undefined,
      });

      if (response.ok) {
        setTestStatus({ type: "idle" });
        setStatusBarMessage({
          type: "success",
          message: t("settings.ai_test_success"),
        });
        logService.info(`AI 连接测试成功: ${provider} (状态码: ${response.status})`, "AISettings", { category: "network" });
        setTimeout(() => fetchAvailableModels(), 300);
      } else {
        const errorData = await response.text();
        let errorMsg = `HTTP ${response.status} (${response.statusText || "Error"})`;
        try {
          const json = JSON.parse(errorData);
          errorMsg = json.error?.message || json.message || errorMsg;
        } catch {
          errorMsg = `${errorMsg} (解析响应失败)`;
        }
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      let errorMsg = error instanceof Error ? error.message : String(error);
      if (endpoint && endpoint.includes("nvidia.com") && !endpoint.endsWith("/v1") && !endpoint.endsWith("/v1/")) {
        errorMsg = `${errorMsg} (请检查 api 链接末尾是否包含 /v1)`;
      }
      setTestStatus({ type: "idle" });
      setStatusBarMessage({
        type: "error",
        message: t("settings.ai_test_failed", { error: errorMsg }),
      });
      logService.error(`AI 连接测试异常: ${provider}`, "AISettings", {
        error: errorMsg,
        endpoint: safeEndpoint,
        category: "network"
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 标题栏 */}
        <div className={styles.headerSection}>
          <div className={styles.titleWrapper}>
            <Bot24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "24px" }} />
            <div>
              <div className={styles.titleText}>{t("settings.ai_settings")}</div>
              <div className={styles.subtitleText}>
                配置人工智能玩机助手的服务通道、模型与 API 密钥。方案切换与更多设置已聚合至 AI 助手。
              </div>
            </div>
          </div>
        </div>

        {/* 双列布局：左侧核心基础服务配置，右侧三个高级扩展设置 */}
        <div className={styles.mainGrid}>
          {/* 1. 核心主要设置卡片 */}
          <Card className={styles.primaryCard}>
            <CardHeader
              className={styles.cardHeader}
              header={<Text weight="semibold" size={400}>基础服务配置</Text>}
              description={
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  选择大语言模型提供商并输入对应鉴权密钥。
                </Text>
              }
            />

            <div className={styles.cardContent}>
              {/* 供应商与当前生效方案 */}
              <div className={styles.gridTwoCols}>
                <Field label={t("settings.ai_provider")}>
                  <Select
                    value={config.ai?.provider ?? "openai"}
                    onChange={(_, data) =>
                      handleAIUpdate({
                        provider: data.value as any,
                        endpoint:
                          data.value === "openai"
                            ? "https://api.openai.com/v1"
                            : data.value === "anthropic"
                              ? "https://api.anthropic.com/v1"
                              : data.value === "google"
                                ? "https://generativelanguage.googleapis.com"
                                : data.value === "zhipu"
                                  ? "https://open.bigmodel.cn/api/paas/v4"
                                  : data.value === "deepseek"
                                    ? "https://api.deepseek.com/v1"
                                    : data.value === "groq"
                                      ? "https://api.groq.com/openai/v1"
                                      : data.value === "qwen"
                                        ? "https://dashscope.aliyuncs.com/compatible-mode/v1"
                                        : data.value === "siliconflow"
                                          ? "https://api.siliconflow.cn/v1"
                                          : data.value === "nvidia"
                                            ? "https://integrate.api.nvidia.com/v1"
                                            : config.ai?.endpoint ?? "",
                      })
                    }
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
                </Field>

                <Field label="当前激活方案">
                  <Select
                    value={activePresetId || ""}
                    onChange={(_, data) => {
                      if (data.value) {
                        applyPreset(data.value);
                        const name = aiPresets.find(p => p.id === data.value)?.name;
                        setStatusBarMessage({
                          type: "success",
                          message: `已切换至方案: ${name}`,
                        });
                      } else {
                        applyPreset("");
                      }
                    }}
                  >
                    <option value="">-- 自定义配置--</option>
                    {aiPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} ({preset.provider})
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* 模型名称 */}
              <Field
                label={t("settings.ai_model")}
                validationMessage={availableModels.length > 0 ? `已获取并加载 ${availableModels.length} 个可用模型建议` : undefined}
                validationState={availableModels.length > 0 ? "success" : "none"}
              >
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <Input
                    className={styles.input}
                    value={config.ai?.model ?? ""}
                    onChange={(_, data) => handleAIUpdate({ model: data.value })}
                    placeholder="例如：deepseek-chat, gpt-4o, claude-3-5-sonnet..."
                    list="ai-models-list-main"
                    style={{ flex: 1 }}
                  />
                  <Button
                    className={styles.pillButton}
                    onClick={fetchAvailableModels}
                    disabled={isFetchingModels}
                    icon={isFetchingModels ? <Spinner size="tiny" /> : undefined}
                  >
                    {isFetchingModels ? "正在获取..." : "获取可用模型"}
                  </Button>
                </div>
                <datalist id="ai-models-list-main">
                  {availableModels.map(m => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </Field>

              {/* API Key */}
              <Field label={t("settings.ai_api_key")}>
                <Input
                  type={showApiKey ? "text" : "password"}
                  className={styles.input}
                  value={config.ai?.apiKey ?? ""}
                  onChange={(_, data) => handleAIUpdate({ apiKey: data.value })}
                  placeholder="sk-..."
                  contentAfter={
                    <Button
                      appearance="subtle"
                      icon={showApiKey ? <EyeOff24Regular /> : <Eye24Regular />}
                      onClick={() => setShowApiKey(!showApiKey)}
                    />
                  }
                />
              </Field>

              <Divider style={{ margin: "4px 0" }} />

              {/* 主操作栏 */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Button
                  appearance="secondary"
                  className={styles.pillButton}
                  onClick={handleTestConnection}
                  disabled={testStatus.type === "loading"}
                  icon={testStatus.type === "loading" ? <Spinner size="tiny" /> : undefined}
                  style={{ flex: 1 }}
                >
                  {testStatus.type === "loading" ? t("settings.ai_testing") : t("settings.ai_test_connection")}
                </Button>

                <Button
                  appearance="primary"
                  className={styles.pillButton}
                  onClick={handleSaveConfig}
                  disabled={isSaving || testStatus.type === "loading"}
                  icon={isSaving ? <Spinner size="tiny" /> : <Save24Regular />}
                  style={{ flex: 1 }}
                >
                  {isSaving ? t("settings.ai_saving") : t("settings.ai_save_config")}
                </Button>
              </div>
            </div>
          </Card>

          {/* 2. 右侧三个高级扩展设置 */}
          <div className={styles.sideColumn}>
            {/* 卡片 1: 高级网络与模型参数 */}
            <div className={styles.actionCard}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionCardIcon}>
                  <Settings24Regular />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text weight="semibold" size={300} style={{ display: "block", marginBottom: "2px" }}>
                    高级参数与端点
                  </Text>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.4" }}>
                    自定义代理 Endpoint、Temperature 温度采样。
                  </Text>
                </div>
              </div>
              <Button
                className={styles.pillButton}
                appearance="secondary"
                onClick={() => setIsAdvancedModalOpen(true)}
              >
                配置参数
              </Button>
            </div>

            {/* 卡片 2: AI 方案导入与管理 */}
            <div className={styles.actionCard}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionCardIcon} style={{ backgroundColor: "rgba(147, 51, 234, 0.1)", color: "rgb(147, 51, 234)" }}>
                  <Wand24Regular />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <Text weight="semibold" size={300}>方案管理与备份</Text>
                    {aiPresets.length > 0 && (
                      <Badge size="small" appearance="tint" color="brand">{aiPresets.length} 套</Badge>
                    )}
                  </div>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.4" }}>
                    多配置方案管理、另存当前配置，支持 JSON 格式导入与导出。
                  </Text>
                </div>
              </div>
              <Button
                className={styles.pillButton}
                appearance="secondary"
                onClick={() => setIsPresetModalOpen(true)}
              >
                管理方案
              </Button>
            </div>

            {/* 卡片 3: 外部 MCP 本地联动 */}
            <div className={styles.actionCard}>
              <div className={styles.actionCardTop}>
                <div className={styles.actionCardIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "rgb(16, 185, 129)" }}>
                  <Server24Regular />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <Text weight="semibold" size={300}>外部 MCP 本地联动</Text>
                    <Badge size="small" appearance="tint" color={mcpStatus.isRunning ? "success" : "subtle"}>
                      {mcpStatus.isRunning ? "运行中" : "未启动"}
                    </Badge>
                  </div>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.4" }}>
                    供 Cursor、Claude、Antigravity 等外部 AI 编辑器连接控制设备。
                  </Text>
                </div>
              </div>
              <Button
                className={styles.pillButton}
                appearance="secondary"
                onClick={() => setIsMcpModalOpen(true)}
              >
                联动配置
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 弹窗 1: 高级网络与模型参数 */}
      <Dialog open={isAdvancedModalOpen} onOpenChange={(_, data) => !data.open && setIsAdvancedModalOpen(false)}>
        <DialogSurface style={{ maxWidth: "560px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsAdvancedModalOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>高级参数与端点设置</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              {/* Endpoint */}
              <Field label={t("settings.ai_endpoint")} hint="支持自建反向代理地址或本地服务 (如 Ollama: http://127.0.0.1:11434/v1)">
                <Input
                  className={styles.input}
                  value={config.ai?.endpoint ?? ""}
                  onChange={(_, data) => handleAIUpdate({ endpoint: data.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </Field>

              {/* Temperature */}
              <Field
                label={`生成温度 (Temperature): ${config.ai?.temperature ?? 0.7}`}
                hint="较低值更严谨精确，较高值更具创造性（建议 0.5 ~ 0.8）"
              >
                <Slider
                  min={0}
                  max={2}
                  step={0.1}
                  value={config.ai?.temperature ?? 0.7}
                  onChange={(_, data) => handleAIUpdate({ temperature: data.value })}
                />
              </Field>
            </DialogContent>

            <DialogActions>
              <Button appearance="primary" onClick={() => {
                handleSaveConfig();
                setIsAdvancedModalOpen(false);
              }}>
                保存参数
              </Button>
              <Button appearance="secondary" onClick={() => setIsAdvancedModalOpen(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 弹窗 2: AI 方案管理与备份导入导出 */}
      <Dialog open={isPresetModalOpen} onOpenChange={(_, data) => !data.open && setIsPresetModalOpen(false)}>
        <DialogSurface style={{ maxWidth: "620px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsPresetModalOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wand24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>AI 方案管理与备份</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              {/* 另存为新方案 */}
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
                <div style={{ display: "flex", gap: "10px" }}>
                  <Input
                    value={newPresetName}
                    onChange={(_, data) => setNewPresetName(data.value)}
                    placeholder="输入新方案名称（例如：DeepSeek-V3 生产环境）"
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon={<Add24Regular />}
                    appearance="primary"
                    className={styles.pillButton}
                    onClick={handleSaveAsPreset}
                    disabled={!newPresetName.trim()}
                  >
                    保存方案
                  </Button>
                </div>
              </div>

              {/* 方案列表 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  已保存的方案列表：
                </Text>
                {aiPresets.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--colorNeutralForeground4)", fontSize: "13px" }}>
                    暂无保存的方案，请在上方另存或从 JSON 导入。
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
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Text weight={isActive ? "semibold" : "medium"} size={300}>{preset.name}</Text>
                            {isActive && <Badge size="small" appearance="filled" color="brand">当前使用</Badge>}
                          </div>
                          <Text size={100} style={{ color: "var(--colorNeutralForeground3)" }}>
                            通道: {preset.provider} | 模型: {preset.model || "默认"}
                          </Text>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
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

              <Divider />

              {/* 导入与导出 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  icon={<ArrowUpload24Regular />}
                  className={styles.pillButton}
                  onClick={handleImportPresets}
                  style={{ flex: 1 }}
                >
                  导入方案 (JSON)
                </Button>
                <Button
                  icon={<ArrowDownload24Regular />}
                  className={styles.pillButton}
                  onClick={handleExportPresets}
                  style={{ flex: 1 }}
                  disabled={aiPresets.length === 0}
                >
                  导出方案 (JSON)
                </Button>
              </div>
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsPresetModalOpen(false)}>
                完成
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 弹窗 3: 外部 MCP 本地联动配置 */}
      <Dialog open={isMcpModalOpen} onOpenChange={(_, data) => !data.open && setIsMcpModalOpen(false)}>
        <DialogSurface style={{ maxWidth: "620px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsMcpModalOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Server24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>ADMT 本地 MCP 服务端与客户端联动</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              {/* 服务端主开关 */}
              <div style={{
                padding: "12px 14px",
                borderRadius: "12px",
                backgroundColor: "var(--colorNeutralBackground2)",
                border: "1px solid var(--colorNeutralStroke2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text weight="semibold" size={300}>本地 MCP SSE 服务端</Text>
                    <Badge size="small" appearance="tint" color={mcpStatus.isRunning ? "success" : "subtle"}>
                      {mcpStatus.isRunning ? "运行中" : "未启动"}
                    </Badge>
                  </div>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
                    {mcpStatus.isRunning
                      ? `已监听: http://${mcpConfig.host}:${mcpConfig.port}/sse (挂载 8 项玩机工具)`
                      : "开启后外部 AI 可通过 Model Context Protocol 直接控制 ADB 设备"}
                  </Text>
                </div>
                <Switch
                  checked={mcpStatus.isRunning}
                  onChange={(_, data) => handleToggleMcpServer(data.checked)}
                />
              </div>

              {/* 端口与安全权限 */}
              <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Text size={200}>监听端口:</Text>
                  <Input
                    type="number"
                    size="small"
                    value={String(mcpConfig.port || 39860)}
                    onChange={(_, data) => updateMcpConfig({ port: parseInt(data.value, 10) || 39860 })}
                    disabled={mcpStatus.isRunning}
                    style={{ width: "90px" }}
                  />
                </div>

                <Switch
                  size="small"
                  label="允许 ADB 指令执行"
                  checked={mcpConfig.allowDeviceCommands}
                  onChange={(_, data) => updateMcpConfig({ allowDeviceCommands: data.checked })}
                />

                <Switch
                  size="small"
                  label="允许文件读写操作"
                  checked={mcpConfig.allowFileOperations}
                  onChange={(_, data) => updateMcpConfig({ allowFileOperations: data.checked })}
                />
              </div>

              <Divider />

              {/* 外部客户端配置代码生成与复制 */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text weight="semibold" size={200}>外部客户端快速配置代码：</Text>
                    <Select
                      size="small"
                      value={selectedMcpClient}
                      onChange={(_, data) => setSelectedMcpClient(data.value as any)}
                      style={{ width: "130px" }}
                    >
                      <option value="cursor">Cursor</option>
                      <option value="claudeDesktop">Claude Desktop</option>
                      <option value="antigravity">Antigravity</option>
                      <option value="windsurf">Windsurf</option>
                    </Select>
                  </div>

                  <Button
                    size="small"
                    className={styles.pillButton}
                    appearance="primary"
                    icon={isCopiedMcp ? <Checkmark24Regular /> : <Copy24Regular />}
                    onClick={handleCopyMcpConfig}
                  >
                    {isCopiedMcp ? "已复制到剪贴板" : "复制配置代码"}
                  </Button>
                </div>

                <pre className={styles.codeBox}>
                  {getMcpClientSnippet()}
                </pre>
              </div>
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsMcpModalOpen(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default AISettingsPanel;
