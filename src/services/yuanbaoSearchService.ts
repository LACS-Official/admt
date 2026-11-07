import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { useAppStore } from "../stores/appStore";
import { logService } from "./logService";

export interface YuanbaoSearchPage {
  title: string;
  url: string;
  passage: string;
  date?: string;
  site?: string;
  score?: number;
}

export interface YuanbaoSearchResponse {
  success: boolean;
  query: string;
  pages: YuanbaoSearchPage[];
  error?: string;
  requestId?: string;
}

export interface YuanbaoSearchOptions {
  apiKey?: string;
  cnt?: number;
  mode?: number;
  freshness?: "noLimit" | "oneDay" | "oneWeek" | "oneMonth" | "oneYear" | string;
}

export function normalizeYuanbaoFreshness(freshness?: string): "noLimit" | "oneDay" | "oneWeek" | "oneMonth" | "oneYear" {
  if (!freshness) return "noLimit";
  const f = freshness.toLowerCase().trim();
  if (f === "oneday" || f === "day" || f === "24h") return "oneDay";
  if (f === "oneweek" || f === "week" || f === "7d") return "oneWeek";
  if (f === "onemonth" || f === "month" || f === "30d") return "oneMonth";
  if (f === "oneyear" || f === "year" || f === "365d") return "oneYear";
  return "noLimit";
}

class YuanbaoSearchService {
  /**
   * 针对 Android 玩机场景优化检索词（消除模糊词，补充机型/代号/报错特征）
   */
  optimizeAndroidQuery(rawQuery: string, deviceContext?: { model?: string; brand?: string }): string {
    let q = rawQuery.trim();
    if (!q) return q;

    // 如果未包含品牌/机型，且上下文有当前设备，自动补齐
    if (deviceContext?.model && !q.includes(deviceContext.model)) {
      // 匹配是否属于玩机排错或找包语境
      if (/救砖|成砖|线刷|卡刷|rom|bootloader|fastboot|rec|twrp|magisk|root|ksu|变砖/i.test(q)) {
        q = `${deviceContext.model} ${q}`;
      }
    }

    return q;
  }

  /**
   * 执行腾讯云元宝搜索 (SearchPro)
   */
  async search(query: string, options: YuanbaoSearchOptions = {}): Promise<YuanbaoSearchResponse> {
    const { config } = useAppStore.getState();
    const yuanbaoCfg = config.ai?.yuanbaoSearch;
    const apiKey = (options.apiKey || yuanbaoCfg?.apiKey || config.ai?.apiKey || "").trim();
    const targetCnt = options.cnt !== undefined ? options.cnt : (yuanbaoCfg?.resultCount ?? 0);
    const apiCnt = targetCnt <= 0 ? 0 : targetCnt <= 10 ? 10 : targetCnt <= 20 ? 20 : targetCnt <= 30 ? 30 : targetCnt <= 40 ? 40 : 50;
    const mode = options.mode ?? yuanbaoCfg?.searchMode ?? 0;
    const freshness = normalizeYuanbaoFreshness(options.freshness || yuanbaoCfg?.freshness);

    if (!apiKey) {
      logService.warn("未配置元宝搜索 API Key", "YuanbaoSearch");
      return {
        success: false,
        query,
        pages: [],
        error: "未配置腾讯云元宝搜索 API Key，请在「在线资源 -> Skills & MCP」中配置",
      };
    }

    logService.info("准备发起元宝搜索", "YuanbaoSearch", {
      query,
      targetCnt,
      apiCnt,
      mode,
      freshness,
      category: "ai",
    });

    // 1. 优先调用 Rust 原生后端（性能最好、无跨域、连接复用、自带 Lite 极速版降级）
    try {
      const res = await invoke<YuanbaoSearchResponse>("yuanbao_search", {
        query,
        apiKey,
        cnt: targetCnt,
        mode,
        freshness: freshness === "noLimit" ? null : freshness,
      });

      logService.info("Rust 原生元宝搜索调用完成", "YuanbaoSearch", {
        success: res.success,
        hitCount: res.pages.length,
        requestId: res.requestId,
        category: "ai",
      });

      return res;
    } catch (invokeErr: any) {
      logService.warn("Rust 原生搜索通道异常，尝试 HTTP 插件回退", "YuanbaoSearch", {
        error: invokeErr?.message || String(invokeErr),
      });
    }

    // 2. 回退到 Tauri HTTP 插件 / 原生 Fetch
    try {
      const buildBody = (withCnt: boolean) => ({
        Query: query,
        ...(withCnt && apiCnt > 0 ? { Cnt: apiCnt } : {}),
        ...(withCnt && mode > 0 ? { Mode: mode } : {}),
        ...(freshness !== "noLimit" ? { Freshness: freshness } : {}),
      });

      const url = "https://api.wsa.cloud.tencent.com/SearchPro";
      const doRequest = async (payload: any) => {
        try {
          return await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            connectTimeout: 20000,
          });
        } catch (fetchErr: any) {
          if (typeof window !== "undefined" && window.fetch) {
            return await window.fetch(url, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });
          }
          throw fetchErr;
        }
      };

      let response = await doRequest(buildBody(apiCnt > 0));
      let resText = await response.text();

      // 如果因 Cnt 或 Mode 被极速版拒收 (illegal Cnt / illegal Mode)，自动降级无 Cnt 重试
      if (resText.includes("illegal Cnt") || resText.includes("illegal Mode")) {
        logService.warn("元宝搜索接口提示参数限制 (如极速版不支持 Cnt/Mode)，自动降级重试...", "YuanbaoSearch");
        response = await doRequest(buildBody(false));
        resText = await response.text();
      }

      if (!response.ok) {
        return {
          success: false,
          query,
          pages: [],
          error: `HTTP ${response.status}: ${resText}`,
        };
      }

      let jsonVal: any = {};
      try {
        jsonVal = JSON.parse(resText);
      } catch {
        return {
          success: false,
          query,
          pages: [],
          error: `响应 JSON 解析失败: ${resText.slice(0, 100)}`,
        };
      }
      const requestId = jsonVal.Response?.RequestId || jsonVal.RequestId;
      const errorNode = jsonVal.Response?.Error || jsonVal.Error;

      if (errorNode) {
        return {
          success: false,
          query,
          pages: [],
          error: `${errorNode.Code || "Error"}: ${errorNode.Message || "元宝搜索服务报错"}`,
          requestId,
        };
      }

      const rawPages = jsonVal.Response?.Pages || jsonVal.Pages || [];
      const pages: YuanbaoSearchPage[] = [];

      for (const item of rawPages) {
        let obj = item;
        if (typeof item === "string") {
          try {
            obj = JSON.parse(item);
          } catch {
            continue;
          }
        }
        if (obj && typeof obj === "object") {
          pages.push({
            title: obj.title || "",
            url: obj.url || obj.href || "",
            passage: obj.passage || obj.snippet || obj.content || "",
            date: obj.date,
            site: obj.site,
            score: obj.score,
          });
        }
      }

      return {
        success: true,
        query,
        pages,
        requestId,
      };
    } catch (err: any) {
      logService.error("元宝搜索请求发生未捕获异常", "YuanbaoSearch", {
        error: err.message,
        category: "ai",
      });
      return {
        success: false,
        query,
        pages: [],
        error: err.message || "元宝搜索异常",
      };
    }
  }

  /**
   * 测试元宝搜索连通性
   */
  async testConnection(apiKey: string): Promise<{ success: boolean; message: string; sampleCount?: number }> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "请输入有效的元宝搜索 API Key" };
    }

    try {
      // 默认使用 cnt: 0 自动降级自适应测试，保证极速版与标准版均能通过测试
      const res = await this.search("Android Fastboot 玩机救砖", {
        apiKey: apiKey.trim(),
        cnt: 0,
      });

      if (res.success && res.pages.length > 0) {
        return {
          success: true,
          message: `连通成功！已成功检索到 ${res.pages.length} 条全网信源（耗时正常，RequestId: ${res.requestId || "OK"}）`,
          sampleCount: res.pages.length,
        };
      }

      return {
        success: false,
        message: res.error || "未检索到结果，请确认 API Key 正确且有可用配额",
      };
    } catch (e: any) {
      return {
        success: false,
        message: `测试异常: ${e.message || String(e)}`,
      };
    }
  }
}

export const yuanbaoSearchService = new YuanbaoSearchService();
export default yuanbaoSearchService;
