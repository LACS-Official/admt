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

const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (urlObj.searchParams.has("key")) {
      urlObj.searchParams.set("key", "******");
    }
    return urlObj.toString();
  } catch (e) {
    return url.replace(/key=[^&]+/g, "key=******");
  }
};

class AIService {
  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    const { config } = useAppStore.getState();
    const aiConfig = config.ai;
    const provider = aiConfig?.provider || "openai";
    const endpoint = aiConfig?.endpoint || "";
    const apiKey = aiConfig?.apiKey || "";
    const model = aiConfig?.model || "";
    let fullUrl = "";

    try {
      if (!apiKey) {
        throw new Error(`请先在设置中配置 ${provider.toUpperCase()} 的 API Key。`);
      }

      // Prepare payload based on provider
      let body: any;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const isOpenAICompatible = ["openai", "local", "zhipu", "deepseek", "groq", "qwen", "siliconflow", "nvidia"].includes(provider);

      if (isOpenAICompatible) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        body = {
          model: model || (
            provider === "zhipu" ? "glm-4" : 
            provider === "deepseek" ? "deepseek-chat" :
            provider === "groq" ? "llama3-8b-8192" :
            provider === "qwen" ? "qwen-turbo" :
            provider === "siliconflow" ? "deepseek-ai/DeepSeek-V3" :
            provider === "nvidia" ? "meta/llama-3.1-405b-instruct" :
            "gpt-3.5-turbo"
          ),
          messages: messages,
          temperature: aiConfig?.temperature ?? 0.7,
        };
      } else if (provider === "anthropic") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        body = {
          model: model || "claude-3-haiku-20240307",
          messages: messages.filter(m => m.role !== 'system'),
          max_tokens: 2048,
        };
        const systemMsg = messages.find(m => m.role === 'system');
        if (systemMsg) {
          body.system = systemMsg.content;
        }
      } else if (provider === "google") {
        const systemMsg = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');
        body = {
          contents: chatMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        };
        if (systemMsg) {
          body.systemInstruction = {
            parts: [{ text: systemMsg.content }]
          };
        }
      }

      const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      if (isOpenAICompatible) {
        fullUrl = `${baseUrl}/chat/completions`;
      } else if (provider === "anthropic") {
        fullUrl = `${baseUrl}/messages`;
      } else if (provider === "google") {
        const geminiModel = model || "gemini-1.5-flash";
        fullUrl = `${baseUrl}/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      } else {
        fullUrl = baseUrl;
      }

      logService.info("发送 AI 聊天请求", "AIService", { 
        provider, 
        model: body?.model || model, 
        url: sanitizeUrl(fullUrl), 
        messageCount: messages.length,
        category: "ai" 
      });

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        connectTimeout: 30000,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logService.error("AI 请求响应错误", "AIService", {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText,
          url: sanitizeUrl(fullUrl),
          provider,
          category: "ai"
        });
        throw new Error(`HTTP ${response.status} (${response.statusText || "Error"}): ${errorText || "请求失败"}`);
      }

      const result = await response.json();
      let responseText = "";

      if (isOpenAICompatible) {
        responseText = result.choices?.[0]?.message?.content || "无回复内容";
      } else if (provider === "anthropic") {
        responseText = result.content?.[0]?.text || "无回复内容";
      } else if (provider === "google") {
        responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "无回复内容";
      }
      
      if (responseText === "无回复内容") {
        logService.warning("AI 返回了空内容", "AIService", { 
          category: "ai", 
          provider, 
          model: body?.model || model,
          rawResponse: JSON.stringify(result)
        });
      } else {
        logService.info("AI 请求成功", "AIService", { 
          category: "ai", 
          provider, 
          model: body?.model || model, 
          responseLength: responseText.length 
        });
      }

      return { content: responseText };
    } catch (error: any) {
      logService.error("AI 请求发生异常", "AIService", { 
        error: error.message, 
        stack: error.stack,
        url: sanitizeUrl(fullUrl),
        provider,
        model,
        category: "ai" 
      });
      return {
        content: "",
        error: error.message
      };
    }
  }
}

export const aiService = new AIService();
