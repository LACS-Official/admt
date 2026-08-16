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
  shorthands,
  Button,
  Spinner,
  Divider,
  Badge,
  Tooltip,
} from "@fluentui/react-components";
import {
  Bot24Regular,
  Key24Regular,
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
  Play24Regular,
  Stop24Regular,
  ShieldCheckmark24Regular,
} from "@fluentui/react-icons";
import { fetch } from "@tauri-apps/plugin-http";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../../stores/appStore";
import { useAIChatStore } from "../../stores/aiChatStore";
import { useMcpStore, ADMT_BUILTIN_MCP_TOOLS } from "../../stores/mcpStore";
import { useTranslation } from "react-i18next";
import logService from "../../services/logService";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    height: "100%",
    overflow: "auto",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: "20px",
    maxWidth: "1100px",
    margin: "0 auto",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    height: "fit-content",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  cardContent: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  settingTile: {
    ...shorthands.padding("12px", "16px"),
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("12px"),
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
    },
  },
  rowContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  titleWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  description: {
    color: "var(--colorNeutralForeground4)",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  input: {
    width: "100%",
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

  const [newPresetName, setNewPresetName] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [selectedMcpClient, setSelectedMcpClient] = useState<"cursor" | "claudeDesktop" | "antigravity" | "windsurf">("cursor");
  const [isCopiedMcp, setIsCopiedMcp] = useState(false);

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
      let headers: Record<string, string> = {
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
            .map((m: any) => m.name ? m.name.replace(/^models\//, "") : "")
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

  const [testStatus, setTestStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
    details?: { url: string; status?: number };
  }>({ type: "idle" });

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

  const [isSaving, setIsSaving] = useState(false);
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
      let headers: Record<string, string> = {
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

      const safeUrl = url.replace(/key=[^&]+/g, "key=******");

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
        // 自动拉取该渠道当前支持的所有模型列表
        setTimeout(() => fetchAvailableModels(), 300);
      } else {
        const errorData = await response.text();
        let errorMsg = `HTTP ${response.status} (${response.statusText || "Error"})`;
        try {
          const json = JSON.parse(errorData);
          errorMsg = json.error?.message || json.message || errorMsg;
        } catch (e) {
          errorMsg = `${errorMsg} (解析响应失败: ${e instanceof Error ? e.message : String(e)})`;
        }
        logService.error(`AI 连接测试失败: ${provider}`, "AISettings", {
          error: errorMsg,
          status: response.status,
          statusText: response.statusText,
          url: safeUrl,
          responseBody: errorData,
          category: "network"
        });
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Test connection failed:", error);
      let errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      const safeEndpoint = endpoint ? endpoint.replace(/key=[^&]+/g, "key=******") : "";

      // 针对 NVIDIA Endpoint 缺失 /v1 给予友好提示
      if (endpoint && endpoint.includes("nvidia.com") && !endpoint.endsWith("/v1") && !endpoint.endsWith("/v1/")) {
        errorMsg = `${errorMsg} (请检查api链接和apikey是否完全正确)`;
      }

      setTestStatus({ type: "idle" });
      setStatusBarMessage({
        type: "error",
        message: t("settings.ai_test_failed", { error: errorMsg }),
      });
      logService.error(`AI 连接测试异常: ${provider}`, "AISettings", {
        error: errorMsg,
        stack,
        endpoint: safeEndpoint,
        category: "network"
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 左侧列：AI 服务基本设置 + MCP 服务小卡片 */}
        <div className={styles.leftColumn}>
          {/* 1. AI 服务基本设置 */}
          <Card className={styles.card}>
            <CardHeader
              image={<Bot24Regular />}
              header={<Text weight="semibold">{t("settings.ai_settings")}</Text>}
              description={
                <Text size={200} className={styles.description}>
                  配置人工智能玩机助手的服务通道、模型与 API 密钥。
                </Text>
              }
            />

            <div className={styles.cardContent}>
              {/* 提供商 */}
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
                  <option value="local">Local (Ollama/LM Studio)</option>
                  <option value="zhipu">智谱AI (GLM)</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="groq">Groq</option>
                  <option value="qwen">阿里通义千问 (Qwen)</option>
                  <option value="siliconflow">硅基流动 (SiliconFlow)</option>
                  <option value="nvidia">英伟达(Nvidia)</option>
                </Select>
              </Field>

              {/* 模型名称 */}
              <Field 
                label={t("settings.ai_model")}
                validationMessage={availableModels.length > 0 ? `已成功获取并加载 ${availableModels.length} 个可用模型联想词` : undefined}
                validationState={availableModels.length > 0 ? "success" : "none"}
              >
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <Input
                    className={styles.input}
                    value={config.ai?.model ?? ""}
                    onChange={(_, data) => handleAIUpdate({ model: data.value })}
                    placeholder="gpt-3.5-turbo, claude-3-sonnet..."
                    list="ai-models-list"
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={fetchAvailableModels}
                    disabled={isFetchingModels}
                    icon={isFetchingModels ? <Spinner size="tiny" /> : undefined}
                  >
                    {isFetchingModels ? "正在加载..." : "获取可用模型"}
                  </Button>
                </div>
                <datalist id="ai-models-list">
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

              {/* Endpoint */}
              <Field label={t("settings.ai_endpoint")}>
                <Input
                  className={styles.input}
                  value={config.ai?.endpoint ?? ""}
                  onChange={(_, data) => handleAIUpdate({ endpoint: data.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </Field>

              {/* 测试连接 & 保存配置 */}
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <Button
                  appearance="primary"
                  onClick={handleTestConnection}
                  disabled={testStatus.type === "loading"}
                  icon={testStatus.type === "loading" ? <Spinner size="tiny" /> : undefined}
                  style={{ flex: 1 }}
                >
                  {testStatus.type === "loading" ? t("settings.ai_testing") : t("settings.ai_test_connection")}
                </Button>

                <Button
                  appearance="primary"
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

          {/* 2. ADMT 本地 MCP 服务小卡片 (紧凑样式) */}
          <Card className={styles.card} style={{ padding: "14px 18px", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Server24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "20px" }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text weight="semibold" size={300}>
                      ADMT 本地 MCP 服务端
                    </Text>
                    <Badge size="small" appearance="tint" color={mcpStatus.isRunning ? "success" : "subtle"}>
                      {mcpStatus.isRunning ? "运行中 (SSE)" : "未启动"}
                    </Badge>
                  </div>
                  <Text size={100} style={{ color: "var(--colorNeutralForeground3)" }}>
                    {mcpStatus.isRunning
                      ? `已挂载 8 项工具，正在监听: http://${mcpConfig.host}:${mcpConfig.port}/sse`
                      : "开启后外部 AI (Cursor / Claude / Antigravity) 可直接调用本软件控制设备"}
                  </Text>
                </div>
              </div>

              <Switch
                checked={mcpStatus.isRunning}
                onChange={(_, data) => handleToggleMcpServer(data.checked)}
              />
            </div>

            <Divider style={{ margin: "2px 0" }} />

            {/* 紧凑参数与权限行 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>端口:</Text>
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
                  label="允许 ADB 指令"
                  checked={mcpConfig.allowDeviceCommands}
                  onChange={(_, data) => updateMcpConfig({ allowDeviceCommands: data.checked })}
                />

                <Switch
                  size="small"
                  label="允许文件传输"
                  checked={mcpConfig.allowFileOperations}
                  onChange={(_, data) => updateMcpConfig({ allowFileOperations: data.checked })}
                />
              </div>

              {/* 快速复制客户端配置 */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Select
                  size="small"
                  value={selectedMcpClient}
                  onChange={(_, data) => setSelectedMcpClient(data.value as any)}
                  style={{ width: "120px" }}
                >
                  <option value="cursor">Cursor</option>
                  <option value="claudeDesktop">Claude Desktop</option>
                  <option value="antigravity">Antigravity</option>
                  <option value="windsurf">Windsurf</option>
                </Select>
                <Button
                  size="small"
                  appearance="secondary"
                  icon={isCopiedMcp ? <Checkmark24Regular /> : <Copy24Regular />}
                  onClick={handleCopyMcpConfig}
                >
                  {isCopiedMcp ? "已复制" : "复制 MCP 配置"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧列：AI 方案配置管理 */}
        <div className={styles.rightColumn}>
          {/* 3. AI 方案配置管理 */}
          <Card className={styles.card}>
            <CardHeader
              image={<Wand24Regular />}
              header={<Text weight="semibold">AI 方案配置管理</Text>}
              description={
                <Text size={200} className={styles.description}>
                  管理、导入、导出多套大模型配置方案，方便快捷切换。
                </Text>
              }
            />

            <div className={styles.cardContent}>
              {/* 加载/选择方案 */}
              <Field label="当前生效方案">
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <Select
                    value={activePresetId || ""}
                    onChange={(_, data) => {
                      if (data.value) {
                        applyPreset(data.value);
                        setStatusBarMessage({
                          type: "success",
                          message: `已切换至方案: ${aiPresets.find(p => p.id === data.value)?.name}`,
                        });
                      }
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">-- 未使用方案 (自定义配置) --</option>
                    {aiPresets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} ({preset.provider})
                      </option>
                    ))}
                  </Select>
                  {activePresetId && (
                    <Button
                      icon={<Delete24Regular />}
                      appearance="subtle"
                      onClick={() => {
                        const name = aiPresets.find(p => p.id === activePresetId)?.name;
                        deletePreset(activePresetId);
                        setStatusBarMessage({
                          type: "info",
                          message: `已删除方案: ${name}`,
                        });
                      }}
                    />
                  )}
                </div>
              </Field>

              {/* 另存为新方案 */}
              <Field label="将当前参数另存为新方案">
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <Input
                    value={newPresetName}
                    onChange={(_, data) => setNewPresetName(data.value)}
                    placeholder="输入新方案名称（例如：ChatGPT-4o白嫖版）"
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon={<Add24Regular />}
                    onClick={handleSaveAsPreset}
                    disabled={!newPresetName.trim()}
                  >
                    保存方案
                  </Button>
                </div>
              </Field>

              <Divider />

              {/* 导入与导出 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <Button
                  icon={<ArrowUpload24Regular />}
                  onClick={handleImportPresets}
                  style={{ flex: 1 }}
                >
                  导入方案 (JSON)
                </Button>
                <Button
                  icon={<ArrowDownload24Regular />}
                  onClick={handleExportPresets}
                  style={{ flex: 1 }}
                  disabled={aiPresets.length === 0}
                >
                  导出方案 (JSON)
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AISettingsPanel;
