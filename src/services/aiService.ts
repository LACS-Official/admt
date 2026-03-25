import { useAppStore } from "../stores/appStore";
import { fetch } from "@tauri-apps/plugin-http";
import { logService } from "./logService";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

class AIService {
  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    try {
      const { config } = useAppStore.getState();
      const aiConfig = config.ai;

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

      // Prepare payload based on provider
      let body: any;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (provider === "openai" || provider === "local") {
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          model: model || "gpt-3.5-turbo",
          messages: messages,
          temperature: 0.7,
        };
      } else if (provider === "anthropic") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        body = {
          model: model || "claude-3-haiku-20240307",
          messages: messages.filter(m => m.role !== 'system'), // Basic filter for system message
          max_tokens: 2048,
        };
        // If there's a system message, add it as a top-level field if supported or handle appropriately
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) {
          body.system = systemMsg.content;
        }
      } else if (provider === "google") {
        // Simplified Google Gemini logic
        body = {
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        };
      }

      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const fullUrl = baseUrl + (provider === "openai" || provider === "local" ? "/chat/completions" : "");

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

      return { content: responseText };
    } catch (error: any) {
      logService.error("AI 请求失败", "AIService", { error: error.message });
      return { 
        content: "", 
        error: error.message 
      };
    }
  }
}

export const aiService = new AIService();
