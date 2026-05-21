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
} from "@fluentui/react-components";
import {
  Bot24Regular,
  Key24Regular,
  Wand24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import { fetch } from "@tauri-apps/plugin-http";
import { useAppStore } from "../../stores/appStore";
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
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
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
  const [testStatus, setTestStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message?: string;
    details?: { url: string; status?: number };
  }>({ type: "idle" });

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
    logService.info(`开始测试 AI 连接: ${provider}`, "AISettings", { endpoint, category: "network" });

    try {
      if (!apiKey && provider !== "local") {
        throw new Error("API Key 不能为空");
      }

      let url = "";
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const baseEndpoint = endpoint?.endsWith("/") ? endpoint.slice(0, -1) : endpoint;

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
      } else if (provider === "zhipu") {
        url = `${baseEndpoint}/chat/completions`;
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, {
        method: provider === "anthropic" || provider === "zhipu" ? "POST" : "GET",
        headers,
        body: provider === "anthropic" ? JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        }) : provider === "zhipu" ? JSON.stringify({
          model: "glm-4",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        }) : undefined,
      });

      if (response.ok) {
        setTestStatus({ type: "success" });
        logService.info(`AI 连接测试成功: ${provider}`, "AISettings", { category: "network" });
      } else {
        const errorData = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(errorData);
          errorMsg = json.error?.message || json.message || errorMsg;
        } catch (e) {
          errorMsg = `${errorMsg} (解析响应失败: ${e instanceof Error ? e.message : String(e)})`;
        }
        logService.error(`AI 连接测试失败: ${provider}`, "AISettings", { error: errorMsg, status: response.status, url, category: "network" });
        setTestStatus({ type: "error", message: errorMsg, details: { url, status: response.status } });
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Test connection failed:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      // 注意：如果是 catch 住的错误，可能没有 URL，除非是上面的 throw
      setTestStatus(prev => ({
        type: "error",
        message: errorMsg,
        details: prev.type === "loading" ? undefined : prev.details
      }));
      logService.error(`AI 连接测试异常: ${provider}`, "AISettings", {
        error: errorMsg,
        stack,
        endpoint,
        category: "network"
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 常规 AI 设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Bot24Regular />}
            header={<Text weight="semibold">{t("settings.ai_settings")}</Text>}
            description={
              <Text size={200} className={styles.description}>
                {t("settings.ai_settings_desc")}
              </Text>
            }
          />

          <div className={styles.cardContent}>
            {/* 启用 AI */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <Wand24Regular />
                  <Text weight="semibold">{t("settings.ai_enabled")}</Text>
                </div>
                <Switch
                  checked={config.ai?.enabled ?? false}
                  onChange={(_, data) => handleAIUpdate({ enabled: data.checked })}
                />
              </div>
              <Text className={styles.description}>
                {t("settings.ai_enabled_desc")}
              </Text>
            </div>

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
                              : config.ai?.endpoint ?? "",
                  })
                }
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="local">Local (Ollama/LM Studio)</option>
                <option value="zhipu">智谱AI (GLM)</option>
              </Select>
            </Field>

            {/* 模型名称 */}
            <Field label={t("settings.ai_model")}>
              <Input
                className={styles.input}
                value={config.ai?.model ?? ""}
                onChange={(_, data) => handleAIUpdate({ model: data.value })}
                placeholder="gpt-3.5-turbo, claude-3-sonnet..."
              />
            </Field>
          </div>
        </Card>

        {/* API 配置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Key24Regular />}
            header={<Text weight="semibold">{t("settings.ai_api_config")}</Text>}
            description={
              <Text size={200} className={styles.description}>
                {t("settings.ai_api_config_desc")}
              </Text>
            }
          />

          <div className={styles.cardContent}>
            {/* API Key */}
            <Field label={t("settings.ai_api_key")}>
              <Input
                type="password"
                className={styles.input}
                value={config.ai?.apiKey ?? ""}
                onChange={(_, data) => handleAIUpdate({ apiKey: data.value })}
                placeholder="sk-..."
              />
            </Field>

            {/* Endpoint */}
            <Field
              label={t("settings.ai_endpoint")}
            >
              <Input
                className={styles.input}
                value={config.ai?.endpoint ?? ""}
                onChange={(_, data) => handleAIUpdate({ endpoint: data.value })}
                placeholder="https://api.openai.com/v1"
              />
            </Field>

            {/* Temperature */}
            <Field
              label={`${t("settings.ai_temperature")}: ${config.ai?.temperature ?? 0.7}`}
              hint={t("settings.ai_temperature_desc")}
            >
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={config.ai?.temperature ?? 0.7}
                onChange={(_, data) => handleAIUpdate({ temperature: data.value })}
              />
            </Field>

            {/* 测试连接 */}
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
              <Button
                appearance="primary"
                onClick={handleTestConnection}
                disabled={testStatus.type === "loading"}
                icon={testStatus.type === "loading" ? <Spinner size="tiny" /> : undefined}
              >
                {testStatus.type === "loading" ? t("settings.ai_testing") : t("settings.ai_test_connection")}
              </Button>

              <Button
                appearance="primary"
                onClick={handleSaveConfig}
                disabled={isSaving || testStatus.type === "loading"}
                icon={isSaving ? <Spinner size="tiny" /> : <Save24Regular />}
              >
                {isSaving ? t("settings.ai_saving") : t("settings.ai_save_config")}
              </Button>

              {testStatus.type === "success" && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--colorStatusSuccessForeground1)" }}>
                  <CheckmarkCircle24Regular fontSize={20} />
                  <Text size={200}>{t("settings.ai_test_success")}</Text>
                </div>
              )}

              {testStatus.type === "error" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", color: "var(--colorStatusDangerForeground1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <ErrorCircle24Regular fontSize={20} />
                    <Text size={200} weight="semibold">{t("settings.ai_test_failed", { error: testStatus.message })}</Text>
                  </div>
                  {testStatus.details?.url && (
                    <Text size={100} style={{ marginLeft: "24px", opacity: 0.8 }}>
                      URL: {testStatus.details.url}
                    </Text>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AISettingsPanel;
