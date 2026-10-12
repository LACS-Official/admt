import { useAppStore } from "../stores/appStore";
import { fetch } from "@tauri-apps/plugin-http";
import { logService } from "./logService";

export interface ChatToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  rawArguments?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface AIResponse {
  content: string;
  toolCalls?: ChatToolCall[];
  error?: string;
}

export interface ChatStreamParams {
  messages: ChatMessage[];
  tools?: any[];
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
  onToolCalls?: (calls: ChatToolCall[]) => void;
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
  /**
   * SSE 流式对话与原生 Tool Calling 统一管线
   */
  async chatStream({
    messages,
    tools,
    signal,
    onChunk,
    onToolCalls,
  }: ChatStreamParams): Promise<AIResponse> {
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
      if (!model) {
        throw new Error("请先在设置中配置或输入 AI 模型名称。");
      }

      let body: any;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const isOpenAICompatible = [
        "openai",
        "local",
        "zhipu",
        "deepseek",
        "groq",
        "qwen",
        "siliconflow",
        "nvidia",
      ].includes(provider);

      // 格式化消息为兼容结构
      if (isOpenAICompatible) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        
        const formattedMessages = messages.map((m) => {
          if (m.role === "tool") {
            return {
              role: "tool",
              tool_call_id: m.tool_call_id || "call_default",
              content: m.content,
            };
          }
          if (m.role === "assistant" && m.tool_calls) {
            return {
              role: "assistant",
              content: m.content || "",
              tool_calls: m.tool_calls,
            };
          }
          return {
            role: m.role,
            content: m.content,
          };
        });

        body = {
          model,
          messages: formattedMessages,
          temperature: aiConfig?.temperature ?? 1.0,
          stream: true,
        };

        if (/^gpt-5/i.test(body.model)) {
          delete body.temperature;
        }

        // 原生 Function Calling 工具注册
        if (tools && tools.length > 0) {
          body.tools = tools.map((t: any) => ({
            type: "function",
            function: {
              name: t.name,
              description: t.description,
              parameters: t.inputSchema || t.parameters || { type: "object", properties: {} },
            },
          }));
          body.tool_choice = "auto";
        }
      } else if (provider === "anthropic") {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";

        const systemMsg = messages.find((m) => m.role === "system");
        const formatted = messages
          .filter((m) => m.role !== "system")
          .map((m) => {
            if (m.role === "tool") {
              return {
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: m.tool_call_id || "tool_result",
                    content: m.content,
                  },
                ],
              };
            }
            return {
              role: m.role === "assistant" ? "assistant" : "user",
              content: m.content,
            };
          });

        body = {
          model,
          messages: formatted,
          max_tokens: 4096,
          stream: true,
        };

        if (systemMsg) {
          body.system = systemMsg.content;
        }

        if (tools && tools.length > 0) {
          body.tools = tools.map((t: any) => ({
            name: t.name,
            description: t.description,
            input_schema: t.inputSchema || t.parameters || { type: "object", properties: {} },
          }));
        }
      } else if (provider === "google") {
        const systemMsg = messages.find((m) => m.role === "system");
        const chatMessages = messages.filter((m) => m.role !== "system");

        body = {
          contents: chatMessages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        };

        if (systemMsg) {
          body.systemInstruction = {
            parts: [{ text: systemMsg.content }],
          };
        }

        if (tools && tools.length > 0) {
          body.tools = [
            {
              functionDeclarations: tools.map((t: any) => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema || t.parameters || { type: "object", properties: {} },
              })),
            },
          ];
        }
      }

      const baseUrl = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
      if (isOpenAICompatible) {
        fullUrl = `${baseUrl}/chat/completions`;
      } else if (provider === "anthropic") {
        fullUrl = `${baseUrl}/messages`;
      } else if (provider === "google") {
        fullUrl = `${baseUrl}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      } else {
        fullUrl = baseUrl;
      }

      logService.info("发送 AI 流式请求", "AIService", {
        provider,
        model,
        url: sanitizeUrl(fullUrl),
        messageCount: messages.length,
        hasTools: Boolean(tools && tools.length > 0),
        category: "ai",
      });

      let response: Response;
      const requestOptions = {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal,
        connectTimeout: 30000,
      };

      try {
        response = await fetch(fullUrl, requestOptions);
      } catch (fetchErr: any) {
        if (
          typeof window !== "undefined" &&
          window.fetch &&
          (fetchErr?.message?.includes("not allowed on the configured scope") ||
            fetchErr?.message?.includes("scope"))
        ) {
          logService.warn("Tauri http 插件权限拦截，已自动回退到原生 Fetch", "AIService", {
            error: fetchErr.message,
            url: sanitizeUrl(fullUrl),
          });
          response = await window.fetch(fullUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal,
          });
        } else {
          throw fetchErr;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        logService.error("AI 流式请求响应错误", "AIService", {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText,
          url: sanitizeUrl(fullUrl),
          provider,
          category: "ai",
        });
        throw new Error(`HTTP ${response.status} (${response.statusText || "Error"}): ${errorText || "请求失败"}`);
      }

      if (!response.body) {
        throw new Error("响应流为空，无法读取流式内容");
      }

      // 读取 SSE 流
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let buffer = "";

      // 累积 OpenAI 格式的工具调用片段
      const partialToolCalls: Record<number, { id: string; name: string; argumentsStr: string }> = {};

      while (true) {
        if (signal?.aborted) {
          reader.cancel().catch(() => {});
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // 处理 OpenAI 兼容 SSE (data: {...})
          if (isOpenAICompatible) {
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              // 文本块流式抛出
              if (delta.content) {
                fullContent += delta.content;
                onChunk?.(delta.content);
              }

              // 工具调用流式拼接
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!partialToolCalls[idx]) {
                    partialToolCalls[idx] = {
                      id: tc.id || `call_${Date.now()}_${idx}`,
                      name: tc.function?.name || "",
                      argumentsStr: tc.function?.arguments || "",
                    };
                  } else {
                    if (tc.id) partialToolCalls[idx].id = tc.id;
                    if (tc.function?.name) partialToolCalls[idx].name += tc.function.name;
                    if (tc.function?.arguments) partialToolCalls[idx].argumentsStr += tc.function.arguments;
                  }
                }
              }
            } catch (e) {
              // 忽略解析中间块异常
            }
          }
          // 处理 Anthropic SSE
          else if (provider === "anthropic") {
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullContent += parsed.delta.text;
                onChunk?.(parsed.delta.text);
              }
              if (parsed.type === "content_block_start" && parsed.content_block?.type === "tool_use") {
                const idx = parsed.index ?? 0;
                partialToolCalls[idx] = {
                  id: parsed.content_block.id || `call_${Date.now()}_${idx}`,
                  name: parsed.content_block.name || "",
                  argumentsStr: "",
                };
              }
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "input_json_delta") {
                const idx = parsed.index ?? 0;
                if (partialToolCalls[idx]) {
                  partialToolCalls[idx].argumentsStr += parsed.delta.partial_json || "";
                }
              }
            } catch (e) {}
          }
          // 处理 Google SSE
          else if (provider === "google") {
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              const part = parsed.candidates?.[0]?.content?.parts?.[0];
              if (part?.text) {
                fullContent += part.text;
                onChunk?.(part.text);
              }
              if (part?.functionCall) {
                const idx = 0;
                partialToolCalls[idx] = {
                  id: `call_${Date.now()}_0`,
                  name: part.functionCall.name || "",
                  argumentsStr: JSON.stringify(part.functionCall.args || {}),
                };
              }
            } catch (e) {}
          }
        }
      }

      // 处理组装最终工具调用参数
      const toolCalls: ChatToolCall[] = Object.values(partialToolCalls).map((tc) => {
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(tc.argumentsStr || "{}");
        } catch {
          parsedArgs = { raw: tc.argumentsStr };
        }
        return {
          id: tc.id,
          name: tc.name,
          arguments: parsedArgs,
          rawArguments: tc.argumentsStr,
        };
      });

      if (toolCalls.length > 0) {
        logService.info("AI 触发原生 Tool Calling", "AIService", {
          toolCount: toolCalls.length,
          tools: toolCalls.map((t) => t.name),
          category: "ai",
        });
        onToolCalls?.(toolCalls);
      }

      return {
        content: fullContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (error: any) {
      if (signal?.aborted) {
        logService.info("AI 请求已被用户主动中止", "AIService", { category: "ai" });
        return { content: "", error: "用户已中止生成" };
      }

      logService.error("AI 流式请求发生异常", "AIService", {
        error: error.message,
        stack: error.stack,
        url: sanitizeUrl(fullUrl),
        provider,
        model,
        category: "ai",
      });
      return {
        content: "",
        error: error.message,
      };
    }
  }

  /**
   * 普通非流式对话（向前兼容）
   */
  async chat(messages: ChatMessage[], tools?: any[]): Promise<AIResponse> {
    return this.chatStream({
      messages,
      tools,
    });
  }
}

export const aiService = new AIService();
export default aiService;
