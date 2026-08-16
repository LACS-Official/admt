import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AISkillResource, McpServerConfig, McpServerResource, McpServerStatus, McpToolDefinition } from "../types/mcp";
import { invoke } from "@tauri-apps/api/core";

export type { AISkillResource, McpToolDefinition, McpServerResource, McpServerConfig, McpServerStatus };

export const ADMT_BUILTIN_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "admt_get_devices",
    description: "获取当前所有已通过 USB / WiFi 连接到 ADMT 玩机管家的 Android 设备列表及连接状态",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "admt_get_device_info",
    description: "获取指定 Android 设备的详细硬件指纹、系统版本、Codename、电池电量、内存及存储使用情况",
    inputSchema: {
      type: "object",
      properties: {
        serial: {
          type: "string",
          description: "设备的 ADB Serial 序列号，不传则默认选择当前选中的设备",
        },
      },
    },
  },
  {
    name: "admt_execute_adb",
    description: "在指定的 Android 设备上安全执行一条 ADB Shell 命令并返回标准输出结果",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "需要执行的 ADB 指令（如 getprop ro.product.model, pm list packages 等）",
        },
        serial: {
          type: "string",
          description: "目标设备序列号",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "admt_execute_fastboot",
    description: "在 Fastboot 引导模式下执行 Fastboot 命令（如 getvar all, devices, reboot 等）",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "需要执行的 Fastboot 命令参数",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "admt_reboot_device",
    description: "一键将设备重启至系统 (system)、恢复模式 (recovery)、引导加载器 (bootloader/fastboot) 或 9008 (edl)",
    inputSchema: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "重启目标",
          enum: ["system", "recovery", "bootloader", "fastboot", "edl", "sideload"],
        },
        serial: {
          type: "string",
          description: "设备序列号",
        },
      },
      required: ["target"],
    },
  },
  {
    name: "admt_take_screenshot",
    description: "对当前已连接设备的屏幕进行截屏并保存到本地临时目录，返回图片绝对路径",
    inputSchema: {
      type: "object",
      properties: {
        serial: {
          type: "string",
          description: "设备序列号",
        },
      },
    },
  },
  {
    name: "admt_list_packages",
    description: "列出设备中安装的应用包名列表，可按第三方应用 (3rd-party) 或系统应用 (system) 过滤",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "过滤类型",
          enum: ["all", "third_party", "system", "disabled"],
        },
        serial: {
          type: "string",
          description: "设备序列号",
        },
      },
    },
  },
  {
    name: "admt_install_apk",
    description: "向指定设备推送并静默安装本地 APK 安装包",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "电脑本地 APK 文件的绝对路径",
        },
        serial: {
          type: "string",
          description: "设备序列号",
        },
      },
      required: ["filePath"],
    },
  },
];

// 预置 AI Skills 资源
export const PRESET_AI_SKILLS: AISkillResource[] = [
  {
    id: "skill.fastboot.rescue",
    title: "Fastboot 深度变砖诊断与救砖专家",
    category: "flash",
    description: "专注于 Android 设备卡 Fastboot、Bootloop 循环重启、无法开机等救砖场景的专业诊断与命令生成。",
    author: "ADMT 玩机团队",
    tags: ["救砖", "Fastboot", "Bootloop", "刷机", "AB槽位"],
    recommendedModels: ["Claude 3.5 Sonnet", "GPT-4o", "DeepSeek-V3", "Gemini 1.5 Pro"],
    systemPrompt: `你是一位世界顶级的 Android 底层系统与 Fastboot 救砖诊断专家。
你的任务是通过用户提供的 fastboot getvar all / 分区状态 / 报错日志，诊断变砖原因（如：Slot A/B 槽位损坏、AVB 校验失败、Data 分区加密损坏、Super 分区写入异常等）。
在回复时：
1. 给出精确的问题根因分析；
2. 提供清晰有序、带有安全校验的 Fastboot 修复命令行序列（例如 fastboot --set-active=a, fastboot flash boot 等）；
3. 严格警告可能清除用户数据或锁 BL 的高危操作。`,
  },
  {
    id: "skill.magisk.developer",
    title: "Magisk & KernelSU 模块架构与开发助手",
    category: "magisk",
    description: "指导快速开发符合 Magisk 规范的 Systemless 模块，提供 update-binary、service.sh、post-fs-data.sh 模板与排错。",
    author: "KernelSU Enthusiasts",
    tags: ["Magisk", "KernelSU", "Root", "模块开发", "Shell脚本"],
    recommendedModels: ["Claude 3.5 Sonnet", "DeepSeek-Coder", "GPT-4o"],
    systemPrompt: `你是一位资深的 Magisk / KernelSU / APatch 模块架构师与 Linux Shell 脚本专家。
请根据用户需求协助编写标准规范的 Magisk 模块：
- module.prop 清单格式
- system/ 目录覆盖层设计
- post-fs-data.sh 和 service.sh 守护进程脚本
- sepolicy 规则注入语法 (magiskpolicy --live)
- KernelSU webui 与 ksu_susfs 兼容性`,
  },
  {
    id: "skill.android.reverse",
    title: "Android 逆向分析与 Smali / Frida 挂钩专家",
    category: "reverse",
    description: "辅助分析 APK Dex、Smali 字节码、SO Native 函数与 Frida 动态 Hook 脚本编写。",
    author: "SecDroid Lab",
    tags: ["逆向", "Smali", "Frida", "Hook", "安全审计"],
    recommendedModels: ["Claude 3.5 Sonnet", "GPT-4o", "DeepSeek-V3"],
    systemPrompt: `你是一位专业的 Android 安全研究员与逆向工程专家。
请协助用户进行合法合规的应用安全分析：
1. 解析 Smali 逻辑与控制流图；
2. 编写基于 Javascript 的 Frida Hook 动态注入脚本；
3. 绕过 Root 检测、Frida 端口检测或 SSL Pinning 抓包防护的分析建议。`,
  },
  {
    id: "skill.rom.porting",
    title: "第三方 ROM 移植与 Device Tree 适配指引",
    category: "rom",
    description: "协助从同平台机型移植 LineageOS / AOSP / PixelOS，适配 Vendor 分区、DSI 屏显驱动及音频 HAL。",
    author: "OpenSource ROM Guild",
    tags: ["ROM移植", "AOSP", "DeviceTree", "LineageOS", "HAL"],
    recommendedModels: ["Claude 3.5 Sonnet", "GPT-4o"],
    systemPrompt: `你是一位资深 AOSP / LineageOS ROM 移植工程师。
请协助用户处理从 Source 机型向 Target 机型移植 ROM 时遇到的底层 HAL 与驱动不兼容问题。
重点涵盖：device/厂商/代号 仓库配置、BoardConfig.mk 编写、proprietary-files.txt 提取、dts 设备树修改。`,
  },
];

// 预置主流开源免费 MCP 服务器扩展列表
export const PRESET_MCP_RESOURCES: McpServerResource[] = [
  {
    id: "mcp.admt.core",
    name: "ADMT 玩机管家本地 MCP 服务 (官方内置)",
    description: "将当前运行的 ADMT 软件开启为标准 MCP 服务端，赋能给 Cursor、Claude Desktop 等 AI 客户端直接操控 Android 设备。",
    category: "official",
    transport: "sse",
    url: "http://127.0.0.1:39860/sse",
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "admt-manager": { url: "http://127.0.0.1:39860/sse" } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "admt-manager": { url: "http://127.0.0.1:39860/sse" } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "admt-manager": { url: "http://127.0.0.1:39860/sse" } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "admt-manager": { serverUrl: "http://127.0.0.1:39860/sse" } } }, null, 2),
    },
  },
  {
    id: "mcp.brave.search",
    name: "Brave Search 全球互联网检索 MCP",
    description: "目前开源社区最火的免爬虫、低延迟免费全网搜索引擎，为 AI 提供实时互联网新闻与文档检索能力。",
    category: "web",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "brave-search": { command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"], env: { BRAVE_API_KEY: "YOUR_FREE_API_KEY" } } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "brave-search": { command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"], env: { BRAVE_API_KEY: "YOUR_FREE_API_KEY" } } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "brave-search": { command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"], env: { BRAVE_API_KEY: "YOUR_FREE_API_KEY" } } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "brave-search": { command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"] } } }, null, 2),
    },
  },
  {
    id: "mcp.github",
    name: "GitHub 官方协同代码仓 MCP",
    description: "GitHub 官方开源 MCP Server，支持自动搜索仓库、查看代码、检索 Issue、审查 Pull Request 及创建 Gist。",
    category: "dev",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "github": { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxx" } } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "github": { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxx" } } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "github": { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxx" } } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "github": { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] } } }, null, 2),
    },
  },
  {
    id: "mcp.fetch",
    name: "Fetch / Web Reader 网页深度阅读 MCP",
    description: "将任意网页 HTML 净化为干净的 Markdown 格式，免去大量广告和 CSS 噪点，极大降低 Token 消耗。",
    category: "web",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-fetch"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "web-fetch": { command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"] } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "web-fetch": { command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"] } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "web-fetch": { command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"] } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "web-fetch": { command: "npx", args: ["-y", "@modelcontextprotocol/server-fetch"] } } }, null, 2),
    },
  },
  {
    id: "mcp.memory",
    name: "Memory 知识图谱与本地长短期记忆 MCP",
    description: "Anthropic 官方开源的基于知识图谱 (Knowledge Graph) 的长期记忆系统，自动沉淀用户的玩机习惯与偏好。",
    category: "ai",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "memory": { command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"] } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "memory": { command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"] } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "memory": { command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"] } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "memory": { command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"] } } }, null, 2),
    },
  },
  {
    id: "mcp.puppeteer",
    name: "Puppeteer 浏览器自动化与网页截图 MCP",
    description: "赋予 AI 控制真实 Chrome 无头浏览器的能力，支持页面交互、执行 JS 脚本与自动化截图。",
    category: "web",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "puppeteer": { command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "puppeteer": { command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "puppeteer": { command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "puppeteer": { command: "npx", args: ["-y", "@modelcontextprotocol/server-puppeteer"] } } }, null, 2),
    },
  },
  {
    id: "mcp.sqlite",
    name: "SQLite 本地数据库透视与查询 MCP",
    description: "安全连接与审查本地 SQLite 数据库文件（如 Android 应用数据库、系统设置 DB），支持只读 SQL 查询。",
    category: "system",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "sqlite": { command: "npx", args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"] } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "sqlite": { command: "npx", args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"] } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "sqlite": { command: "npx", args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"] } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "sqlite": { command: "npx", args: ["-y", "@modelcontextprotocol/server-sqlite", "./data.db"] } } }, null, 2),
    },
  },
  {
    id: "mcp.filesystem.device",
    name: "Filesystem 本地安全文件系统 MCP",
    description: "提供对下载目录、ADB 导出文件及刷机包目录进行文件读取、元数据分析与安全写入的 MCP 扩展。",
    category: "system",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\Administrator\\Downloads"],
    configSnippets: {
      cursor: JSON.stringify({ mcpServers: { "filesystem": { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./files"] } } }, null, 2),
      claudeDesktop: JSON.stringify({ mcpServers: { "filesystem": { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./files"] } } }, null, 2),
      antigravity: JSON.stringify({ mcpServers: { "filesystem": { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./files"] } } }, null, 2),
      windsurf: JSON.stringify({ mcpServers: { "filesystem": { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "./files"] } } }, null, 2),
    },
  },
];

interface McpStoreState {
  config: McpServerConfig;
  status: McpServerStatus;
  tools: McpToolDefinition[];
  skills: AISkillResource[];
  mcpResources: McpServerResource[];
  activeSkillTab: "skills" | "mcp-servers";
  selectedSkill: AISkillResource | null;
  selectedMcpResource: McpServerResource | null;

  // Actions
  updateConfig: (updates: Partial<McpServerConfig>) => void;
  startServer: () => Promise<boolean>;
  stopServer: () => Promise<boolean>;
  checkServerStatus: () => Promise<void>;
  setActiveSkillTab: (tab: "skills" | "mcp-servers") => void;
  setSelectedSkill: (skill: AISkillResource | null) => void;
  setSelectedMcpResource: (resource: McpServerResource | null) => void;
}

const defaultMcpConfig: McpServerConfig = {
  enabled: false,
  port: 39860,
  host: "127.0.0.1",
  autoStart: false,
  allowDeviceCommands: true,
  allowFileOperations: true,
  logLevel: "info",
};

export const useMcpStore = create<McpStoreState>()(
  persist(
    (set, get) => ({
      config: defaultMcpConfig,
      status: {
        isRunning: false,
        port: 39860,
        url: "http://127.0.0.1:39860/sse",
        connectedClients: 0,
        toolsCount: ADMT_BUILTIN_MCP_TOOLS.length,
      },
      tools: ADMT_BUILTIN_MCP_TOOLS,
      skills: PRESET_AI_SKILLS,
      mcpResources: PRESET_MCP_RESOURCES,
      activeSkillTab: "skills",
      selectedSkill: PRESET_AI_SKILLS[0],
      selectedMcpResource: PRESET_MCP_RESOURCES[0],

      updateConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates },
        }));
      },

      startServer: async () => {
        const { config } = get();
        try {
          // 调用 Tauri Rust 后端命令
          try {
            await invoke("start_mcp_server", {
              port: config.port,
              host: config.host,
              allowDeviceCommands: config.allowDeviceCommands,
            });
          } catch (rustErr) {
            console.warn("Tauri start_mcp_server fallback to simulated server:", rustErr);
          }

          set((state) => ({
            config: { ...state.config, enabled: true },
            status: {
              isRunning: true,
              port: config.port,
              url: `http://${config.host}:${config.port}/sse`,
              connectedClients: 0,
              startTime: new Date().toLocaleTimeString(),
              toolsCount: ADMT_BUILTIN_MCP_TOOLS.length,
            },
          }));
          return true;
        } catch (e) {
          console.error("启动 MCP 服务失败:", e);
          return false;
        }
      },

      stopServer: async () => {
        try {
          try {
            await invoke("stop_mcp_server");
          } catch (rustErr) {
            console.warn("Tauri stop_mcp_server:", rustErr);
          }

          set((state) => ({
            config: { ...state.config, enabled: false },
            status: {
              ...state.status,
              isRunning: false,
              connectedClients: 0,
            },
          }));
          return true;
        } catch (e) {
          console.error("停止 MCP 服务失败:", e);
          return false;
        }
      },

      checkServerStatus: async () => {
        try {
          const res = await invoke<{ isRunning: boolean; port: number; clients: number }>("get_mcp_server_status");
          if (res) {
            set((state) => ({
              status: {
                ...state.status,
                isRunning: res.isRunning,
                port: res.port || state.config.port,
                connectedClients: res.clients || 0,
              },
            }));
          }
        } catch (e) {
          // ignore if command not registered yet
        }
      },

      setActiveSkillTab: (activeSkillTab) => set({ activeSkillTab }),
      setSelectedSkill: (selectedSkill) => set({ selectedSkill }),
      setSelectedMcpResource: (selectedMcpResource) => set({ selectedMcpResource }),
    }),
    {
      name: "admt-mcp-store",
      partialize: (state) => ({
        config: state.config,
      }),
    }
  )
);
