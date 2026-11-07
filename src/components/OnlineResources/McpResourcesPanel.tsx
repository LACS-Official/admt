import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  TabList,
  Tab,
  Text,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Select,
  Spinner,
  Field,
} from "@fluentui/react-components";
import {
  Server24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Wrench24Regular,
  Globe24Regular,
  Play24Regular,
  Dismiss24Regular,
  Open24Regular,
  Settings24Regular,
  Search24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Save24Regular,
  Phone24Regular,
  Code24Regular,
  ArrowSync24Regular,
  Apps24Regular,
  ArrowDownload24Regular,
  Camera24Regular,
  DocumentText24Regular,
  Desktop24Regular,
  Folder24Regular,
  Database24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useMcpStore, ADMT_BUILTIN_MCP_TOOLS, McpToolDefinition } from "../../stores/mcpStore";
import { McpServerResource } from "../../types/mcp";
import { useAppStore } from "../../stores/appStore";
import { executeMcpTool } from "../../services/mcpExecutor";
import { yuanbaoSearchService } from "../../services/yuanbaoSearchService";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: "12px",
    minHeight: 0,
    overflow: "hidden",
  },
  headerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    padding: "2px 6px 0 2px",
    flexShrink: 0,
  },
  subTabList: {
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px 4px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minHeight: "32px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "4px 14px",
      minHeight: "26px",
      borderRadius: "9999px",
      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 2px",
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },
      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 6px -1px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)",
        fontWeight: 600,
      },
    },
  },
  headerHint: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 8px 24px 4px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: 0,
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("14px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px", "18px"),
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "144px",
    boxSizing: "border-box",
    cursor: "pointer",
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 2px 6px -1px rgba(0, 0, 0, 0.03)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      ...shorthands.borderColor("var(--colorNeutralStroke1Hover)"),
      transform: "translateY(-1px)",
      boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.06)",
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
  },
  cardTopLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    flex: 1,
  },
  cardIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "rgba(0, 113, 227, 0.07)",
    border: "1px solid rgba(0, 113, 227, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0071e3",
    flexShrink: 0,
    fontSize: "18px",
  },
  cardTitleBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    minWidth: 0,
    flex: 1,
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardSubtitle: {
    fontSize: "11px",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    color: "var(--colorNeutralForeground3)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardBadge: {
    borderRadius: "9999px",
    fontSize: "11px",
    padding: "2px 8px",
    flexShrink: 0,
  },
  cardDesc: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    lineHeight: "1.55",
    margin: "10px 0 12px 0",
    display: "-webkit-box",
    "-webkit-line-clamp": "2",
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
  },
  cardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "10px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    gap: "8px",
    marginTop: "auto",
  },
  protocolTag: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#28cd41",
    display: "inline-block",
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actionButton: {
    borderRadius: "9999px",
    fontSize: "12px",
    height: "28px",
    padding: "0 12px",
    fontWeight: 500,
    transition: "all 0.15s ease",
  },
  codeBlock: {
    backgroundColor: "var(--colorNeutralBackground3)",
    ...shorthands.borderRadius("10px"),
    ...shorthands.padding("14px"),
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Cascadia Code", monospace',
    fontSize: "12px",
    color: "var(--colorNeutralForeground1)",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    maxHeight: "260px",
    overflowY: "auto",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke3)"),
  },
  sourceCard: {
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
  },
});

export const McpResourcesPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { config, updateConfig, saveToDisk, setStatusBarMessage } = useAppStore();
  const mcpResources = useMcpStore((state) => state.mcpResources);
  const mcpStatus = useMcpStore((state) => state.status);
  const startMcpServer = useMcpStore((state) => state.startServer);
  const stopMcpServer = useMcpStore((state) => state.stopServer);

  const [activeSubTab, setActiveSubTab] = useState<"tools" | "servers">("tools");
  const [detailMcpServer, setDetailMcpServer] = useState<McpServerResource | null>(null);
  const [detailTool, setDetailTool] = useState<McpToolDefinition | null>(null);
  const [selectedClient, setSelectedClient] = useState<"cursor" | "claudeDesktop" | "antigravity" | "windsurf">("cursor");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 元宝搜索独立配置弹窗（仅由卡片上「配置」触发）
  const [isYuanbaoConfigOpen, setIsYuanbaoConfigOpen] = useState(false);
  const [yuanbaoApiKey, setYuanbaoApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [yuanbaoFreshness, setYuanbaoFreshness] = useState<"noLimit" | "oneDay" | "oneWeek" | "oneMonth" | "oneYear">("noLimit");
  const [yuanbaoResultCount, setYuanbaoResultCount] = useState(10);
  const [yuanbaoEndpoint, setYuanbaoEndpoint] = useState("https://api.wsa.cloud.tencent.com");
  const [isTestingYuanbao, setIsTestingYuanbao] = useState(false);
  const [yuanbaoTestStatus, setYuanbaoTestStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  // 工具手动测试状态
  const [mcpParamInputs, setMcpParamInputs] = useState<Record<string, string>>({
    command: "getprop ro.product.model",
    fastbootCommand: "getvar all",
    hostCommand: "ipconfig",
    shell: "powershell",
    target: "system",
    query: "小米14 HyperOS 解锁 Bootloader 社区方案",
    url: "https://github.com",
    filter: "all",
    freshness: "noLimit",
    filePath: "",
    serial: "",
  });
  const [mcpTestResult, setMcpTestResult] = useState<any>(null);
  const [isTestingMcp, setIsTestingMcp] = useState(false);

  const openYuanbaoModal = () => {
    const current = config.ai?.yuanbaoSearch;
    setYuanbaoApiKey(current?.apiKey || "");
    setYuanbaoFreshness(current?.freshness || "noLimit");
    setYuanbaoResultCount(current?.resultCount || 10);
    setYuanbaoEndpoint(current?.endpoint || "https://api.wsa.cloud.tencent.com");
    setYuanbaoTestStatus({ type: "idle", message: "" });
    setShowApiKey(false);
    setIsYuanbaoConfigOpen(true);
  };

  const handleTestYuanbao = async () => {
    if (!yuanbaoApiKey.trim()) {
      setYuanbaoTestStatus({ type: "error", message: "请输入有效的 API Key" });
      return;
    }
    setIsTestingYuanbao(true);
    setYuanbaoTestStatus({ type: "idle", message: "" });
    try {
      const res = await yuanbaoSearchService.testConnection(yuanbaoApiKey.trim());
      if (res.success) {
        setYuanbaoTestStatus({ type: "success", message: res.message });
      } else {
        setYuanbaoTestStatus({ type: "error", message: res.message });
      }
    } catch (e: any) {
      setYuanbaoTestStatus({ type: "error", message: `连接异常: ${e.message || String(e)}` });
    } finally {
      setIsTestingYuanbao(false);
    }
  };

  const handleSaveYuanbaoConfig = async () => {
    try {
      updateConfig({
        ai: {
          ...config.ai,
          yuanbaoSearch: {
            enabled: true,
            apiKey: yuanbaoApiKey.trim(),
            endpoint: yuanbaoEndpoint.trim() || "https://api.wsa.cloud.tencent.com",
            searchMode: 0,
            freshness: yuanbaoFreshness,
            resultCount: Number(yuanbaoResultCount),
          },
        },
      });
      await saveToDisk();
      setStatusBarMessage({
        type: "success",
        message: "元宝搜索参数配置已保存",
      });
      setIsYuanbaoConfigOpen(false);
    } catch (e: any) {
      setStatusBarMessage({
        type: "error",
        message: `保存失败: ${e.message || String(e)}`,
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setStatusBarMessage({
      type: "success",
      message: "已复制到剪贴板",
    });
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleRunTool = async (tool: McpToolDefinition) => {
    setIsTestingMcp(true);
    try {
      const args: Record<string, any> = { ...mcpParamInputs };
      if (tool.name === "admt_execute_fastboot") {
        args.command = mcpParamInputs.fastbootCommand || mcpParamInputs.command || "getvar all";
      } else if (tool.name === "admt_execute_host_command") {
        args.command = mcpParamInputs.hostCommand || mcpParamInputs.command || "ipconfig";
        args.shell = mcpParamInputs.shell || "powershell";
      } else if (tool.name === "admt_install_apk") {
        args.filePath = mcpParamInputs.filePath;
      }
      if (mcpParamInputs.serial && mcpParamInputs.serial.trim()) {
        args.serial = mcpParamInputs.serial.trim();
      }
      const res = await executeMcpTool(tool.name, args);
      setMcpTestResult(res);
      setStatusBarMessage({
        type: res.success ? "success" : "warning",
        message: res.success ? `MCP 工具【${tool.name}】执行成功` : `MCP 工具执行报错: ${res.error}`,
      });
    } catch (e: any) {
      setMcpTestResult({ success: false, error: e.message || String(e) });
    } finally {
      setIsTestingMcp(false);
    }
  };

  const getToolMeta = (name: string) => {
    switch (name) {
      case "yuanbao_web_search":
        return {
          title: "腾讯云元宝搜索",
          icon: <Globe24Regular />,
          badgeText: "实时检索",
          isPrimary: true,
          protocol: "实时联网",
        };
      case "admt_get_devices":
        return {
          title: "获取连接设备",
          icon: <Phone24Regular />,
          badgeText: "设备管理",
          protocol: "内置工具",
        };
      case "admt_get_device_info":
        return {
          title: "提取硬件参数",
          icon: <Code24Regular />,
          badgeText: "状态查询",
          protocol: "内置工具",
        };
      case "admt_execute_adb":
        return {
          title: "执行 ADB 指令",
          icon: <Code24Regular />,
          badgeText: "底层交互",
          protocol: "内置工具",
        };
      case "admt_execute_fastboot":
        return {
          title: "执行 Fastboot 指令",
          icon: <Wrench24Regular />,
          badgeText: "BL 刷机",
          protocol: "内置工具",
        };
      case "admt_reboot_device":
        return {
          title: "设备多模式重启",
          icon: <ArrowSync24Regular />,
          badgeText: "电源模式",
          protocol: "内置工具",
        };
      case "admt_list_packages":
        return {
          title: "应用包名检索",
          icon: <Apps24Regular />,
          badgeText: "包管理器",
          protocol: "内置工具",
        };
      case "admt_install_apk":
        return {
          title: "本地 APK 安装",
          icon: <ArrowDownload24Regular />,
          badgeText: "应用安装",
          protocol: "内置工具",
        };
      case "admt_take_screenshot":
      case "admt_capture_screen":
        return {
          title: "采集屏幕快照",
          icon: <Camera24Regular />,
          badgeText: "视觉感知",
          protocol: "内置工具",
        };
      case "admt_execute_host_command":
        return {
          title: "宿主电脑命令执行",
          icon: <Desktop24Regular />,
          badgeText: "系统终端",
          protocol: "内置工具",
        };
      case "admt_get_host_info":
        return {
          title: "宿主电脑环境查询",
          icon: <Desktop24Regular />,
          badgeText: "网络环境",
          protocol: "内置工具",
        };
      case "fetch_web_content":
        return {
          title: "网页内容提取",
          icon: <DocumentText24Regular />,
          badgeText: "文档解析",
          protocol: "网络工具",
        };
      case "brave_web_search":
        return {
          title: "Brave 全网搜索",
          icon: <Search24Regular />,
          badgeText: "全球搜索",
          protocol: "外部检索",
        };
      default:
        return {
          title: name,
          icon: <Wrench24Regular />,
          badgeText: "工具",
          protocol: "内置工具",
        };
    }
  };

  const getServerMeta = (id: string, name: string) => {
    switch (id) {
      case "mcp.admt.core":
        return {
          title: "ADMT 本地服务",
          icon: <Desktop24Regular />,
          badgeText: "官方内置",
          isPrimary: true,
          protocol: "SSE 协议",
        };
      case "mcp.yuanbao.search":
        return {
          title: "腾讯云元宝搜索",
          icon: <Globe24Regular />,
          badgeText: "官方服务",
          isPrimary: true,
          protocol: "HTTP SSE",
        };
      case "mcp.brave.search":
        return {
          title: "Brave 全网搜索",
          icon: <Search24Regular />,
          badgeText: "主流开源",
          protocol: "STDIO",
        };
      case "mcp.github":
        return {
          title: "GitHub 代码仓",
          icon: <Code24Regular />,
          badgeText: "代码生态",
          protocol: "STDIO",
        };
      case "mcp.filesystem":
        return {
          title: "本地文件系统",
          icon: <Folder24Regular />,
          badgeText: "基础系统",
          protocol: "STDIO",
        };
      case "mcp.sqlite":
        return {
          title: "SQLite 数据库",
          icon: <Database24Regular />,
          badgeText: "本地存储",
          protocol: "STDIO",
        };
      case "mcp.puppeteer":
        return {
          title: "Puppeteer 渲染",
          icon: <Globe24Regular />,
          badgeText: "浏览器",
          protocol: "STDIO",
        };
      case "mcp.postgres":
        return {
          title: "PostgreSQL 服务",
          icon: <Database24Regular />,
          badgeText: "数据服务",
          protocol: "STDIO",
        };
      default:
        return {
          title: name.replace(/\s*\(.*?\)/g, ""),
          icon: <Server24Regular />,
          badgeText: "服务",
          protocol: "MCP 协议",
        };
    }
  };

  return (
    <div className={styles.container}>
      {/* 极简顶部栏：包含分段控制器与服务端状态快捷控制 */}
      <div className={styles.headerBar}>
        <TabList
          selectedValue={activeSubTab}
          onTabSelect={(_, data) => setActiveSubTab(data.value as any)}
          className={styles.subTabList}
        >
          <Tab value="tools" icon={<Wrench24Regular />}>
            ADMT 核心工具 ({ADMT_BUILTIN_MCP_TOOLS.length})
          </Tab>
          <Tab value="servers" icon={<Globe24Regular />}>
            开源服务生态 ({mcpResources.length})
          </Tab>
        </TabList>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--colorNeutralForeground2)" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: mcpStatus.isRunning ? "#107c41" : "var(--colorNeutralStroke1)",
                display: "inline-block",
              }}
            />
            <span>
              {mcpStatus.isRunning
                ? `本地服务已启动 (:39860)`
                : `本地服务未运行`}
            </span>
          </div>

          <Button
            size="small"
            appearance={mcpStatus.isRunning ? "secondary" : "primary"}
            className={styles.actionButton}
            onClick={async () => {
              if (mcpStatus.isRunning) {
                await stopMcpServer();
                setStatusBarMessage({ type: "info", message: "ADMT MCP 本地服务端已停止" });
              } else {
                const ok = await startMcpServer();
                if (ok) {
                  setStatusBarMessage({ type: "success", message: "ADMT MCP 本地服务端已启动 (端口 39860)" });
                } else {
                  setStatusBarMessage({ type: "error", message: "启动 MCP 服务失败" });
                }
              }
            }}
          >
            {mcpStatus.isRunning ? "停止服务" : "一键启动服务"}
          </Button>
        </div>
      </div>

      {/* 主展示区：充足内边距与呼吸感 */}
      <div className={styles.content}>
        {activeSubTab === "tools" ? (
          /* 1. MCP 工具列表 */
          <div className={styles.grid}>
            {ADMT_BUILTIN_MCP_TOOLS.map((tool) => {
              const isYuanbao = tool.name === "yuanbao_web_search";
              const meta = getToolMeta(tool.name);
              return (
                <div
                  key={tool.name}
                  className={styles.card}
                  onClick={() => {
                    setMcpTestResult(null);
                    setDetailTool(tool);
                  }}
                >
                  <div>
                    <div className={styles.cardTop}>
                      <div className={styles.cardTopLeft}>
                        <div className={styles.cardIcon}>
                          {meta.icon}
                        </div>
                        <div className={styles.cardTitleBlock}>
                          <div className={styles.cardTitle}>{meta.title}</div>
                          <div className={styles.cardSubtitle}>{tool.name}</div>
                        </div>
                      </div>
                      <Badge
                        appearance={meta.isPrimary ? "filled" : "tint"}
                        color="brand"
                        className={styles.cardBadge}
                      >
                        {meta.badgeText}
                      </Badge>
                    </div>

                    <div className={styles.cardDesc}>{tool.description}</div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.protocolTag}>
                      <span className={styles.statusDot} />
                      <span>{meta.protocol}</span>
                    </div>

                    <div className={styles.cardActions}>
                      <Button
                        size="small"
                        appearance="secondary"
                        className={styles.actionButton}
                        icon={<Play24Regular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMcpTestResult(null);
                          setDetailTool(tool);
                        }}
                      >
                        调试运行
                      </Button>
                      {isYuanbao && (
                        <Button
                          size="small"
                          appearance="primary"
                          className={styles.actionButton}
                          icon={<Settings24Regular />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openYuanbaoModal();
                          }}
                        >
                          配置
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 2. MCP 服务端列表 */
          <div className={styles.grid}>
            {mcpResources.map((res) => {
              const isYuanbao = res.id === "mcp.yuanbao.search";
              const meta = getServerMeta(res.id, res.name);
              return (
                <div
                  key={res.id}
                  className={styles.card}
                  onClick={() => setDetailMcpServer(res)}
                >
                  <div>
                    <div className={styles.cardTop}>
                      <div className={styles.cardTopLeft}>
                        <div className={styles.cardIcon}>
                          {meta.icon}
                        </div>
                        <div className={styles.cardTitleBlock}>
                          <div className={styles.cardTitle}>{meta.title}</div>
                          <div className={styles.cardSubtitle}>{res.id}</div>
                        </div>
                      </div>
                      <Badge
                        appearance={meta.isPrimary ? "filled" : "tint"}
                        color="brand"
                        className={styles.cardBadge}
                      >
                        {meta.badgeText}
                      </Badge>
                    </div>

                    <div className={styles.cardDesc}>{res.description}</div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.protocolTag}>
                      <span className={styles.statusDot} />
                      <span>{meta.protocol}</span>
                    </div>

                    <div className={styles.cardActions}>
                      <Button
                        size="small"
                        appearance="secondary"
                        className={styles.actionButton}
                        icon={<Copy24Regular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailMcpServer(res);
                        }}
                      >
                        接入配置
                      </Button>
                      {isYuanbao && (
                        <Button
                          size="small"
                          appearance="primary"
                          className={styles.actionButton}
                          icon={<Settings24Regular />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openYuanbaoModal();
                          }}
                        >
                          配置
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. MCP 工具调试弹窗 */}
      <Dialog open={!!detailTool} onOpenChange={(_, data) => !data.open && setDetailTool(null)}>
        <DialogSurface style={{ maxWidth: "740px", width: "90vw", borderRadius: "16px" }}>
          {detailTool && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailTool(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Wrench24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>{detailTool.name} - 工具调试与运行</span>
                </div>
              </DialogTitle>

              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.5" }}>
                  {detailTool.description}
                </Text>

                {/* 元宝搜索特异化调试与输入 */}
                {detailTool.name === "yuanbao_web_search" && (
                  <div style={{
                    padding: "14px",
                    borderRadius: "12px",
                    backgroundColor: "var(--colorNeutralBackground2)",
                    border: "1px solid var(--colorNeutralStroke2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}>
                    {!config.ai?.yuanbaoSearch?.apiKey && (
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(235, 87, 87, 0.08)",
                        border: "1px solid rgba(235, 87, 87, 0.2)",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "var(--colorNeutralForeground1)",
                      }}>
                        <span>尚未配置元宝搜索 API Key</span>
                        <Button
                          size="small"
                          appearance="primary"
                          className={styles.actionButton}
                          onClick={() => {
                            setDetailTool(null);
                            openYuanbaoModal();
                          }}
                        >
                          立即配置
                        </Button>
                      </div>
                    )}

                    <Field label="搜索关键词 (Query)" required>
                      <Input
                        value={mcpParamInputs.query || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, query: d.value }))}
                        placeholder="输入玩机搜索关键词，例如：Redmi K70 获取 root 权限方案..."
                        style={{ width: "100%" }}
                      />
                    </Field>

                    <Field label="搜索时效性范围 (Freshness)">
                      <Select
                        value={mcpParamInputs.freshness || "noLimit"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, freshness: d.value }))}
                      >
                        <option value="noLimit">不限时效 (全部历史信源)</option>
                        <option value="oneDay">24小时内最新</option>
                        <option value="oneWeek">过去一周</option>
                        <option value="oneMonth">过去一月</option>
                        <option value="oneYear">过去一年</option>
                      </Select>
                    </Field>
                  </div>
                )}

                {/* 其他常见 MCP 工具参数 */}
                {detailTool.name === "admt_execute_adb" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="ADB Shell 指令 (无需加 'adb')">
                      <Input
                        value={mcpParamInputs.command || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, command: d.value }))}
                        placeholder="例如 getprop ro.product.model 或 pm list packages"
                        style={{ width: "100%" }}
                      />
                    </Field>
                  </div>
                )}

                {detailTool.name === "admt_reboot_device" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="重启目标模式 (Target)">
                      <Select
                        value={mcpParamInputs.target || "system"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, target: d.value }))}
                      >
                        <option value="system">重启至系统 (System)</option>
                        <option value="recovery">重启至 Recovery</option>
                        <option value="bootloader">重启至 Bootloader (Fastboot)</option>
                        <option value="edl">重启至 9008 (EDL)</option>
                      </Select>
                    </Field>
                  </div>
                )}

                {detailTool.name === "admt_list_packages" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="过滤分类">
                      <Select
                        value={mcpParamInputs.filter || "all"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, filter: d.value }))}
                      >
                        <option value="all">所有应用 (All)</option>
                        <option value="third_party">第三方用户应用 (3rd-party)</option>
                        <option value="system">系统内置应用 (System)</option>
                      </Select>
                    </Field>
                  </div>
                )}

                {detailTool.name === "admt_execute_fastboot" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="Fastboot 命令参数 (无需加 'fastboot')">
                      <Input
                        value={mcpParamInputs.fastbootCommand || "getvar all"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, fastbootCommand: d.value, command: d.value }))}
                        placeholder="例如 getvar all 或 devices 或 oem device-info"
                        style={{ width: "100%" }}
                      />
                    </Field>
                  </div>
                )}

                {detailTool.name === "admt_execute_host_command" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Field label="宿主命令行指令">
                      <Input
                        value={mcpParamInputs.hostCommand || "ipconfig"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, hostCommand: d.value, command: d.value }))}
                        placeholder="例如 ipconfig 或 ping -n 2 127.0.0.1 或 netstat -ano"
                        style={{ width: "100%" }}
                      />
                    </Field>
                    <Field label="终端 Shell 类型">
                      <Select
                        value={mcpParamInputs.shell || "powershell"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, shell: d.value }))}
                      >
                        <option value="powershell">PowerShell</option>
                        <option value="cmd">CMD (命令提示符)</option>
                      </Select>
                    </Field>
                  </div>
                )}

                {detailTool.name === "admt_install_apk" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="电脑本地 APK 文件绝对路径" required>
                      <Input
                        value={mcpParamInputs.filePath || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, filePath: d.value }))}
                        placeholder="例如 D:\Downloads\magisk.apk 或 C:\Users\Administrator\Downloads\app.apk"
                        style={{ width: "100%" }}
                      />
                    </Field>
                  </div>
                )}

                {(detailTool.name === "admt_get_device_info" || detailTool.name === "admt_take_screenshot" || detailTool.name === "admt_capture_screen") && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="指定设备序列号 (可选，留空则自动选择已连接设备)">
                      <Input
                        value={mcpParamInputs.serial || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, serial: d.value }))}
                        placeholder="留空自动识别"
                        style={{ width: "100%" }}
                      />
                    </Field>
                  </div>
                )}

                {detailTool.name === "admt_get_devices" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                      该工具无需参数，点击「立即运行测试」将实时扫描并通过底层接口获取当前所有已连接的 Android / Fastboot 设备。
                    </Text>
                  </div>
                )}

                {detailTool.name === "admt_get_host_info" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                      该工具无需参数，点击「立即运行测试」将自动采集当前运行 ADMT 宿主电脑的主机名、操作系统平台与局域网 IPv4 地址。
                    </Text>
                  </div>
                )}

                {detailTool.name === "fetch_web_content" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="网页目标 URL">
                      <Input
                        value={mcpParamInputs.url || "https://github.com"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, url: d.value }))}
                        placeholder="https://..."
                        style={{ width: "100%" }}
                      />
                    </Field>
                  </div>
                )}

                {detailTool.name === "brave_web_search" && (
                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "var(--colorNeutralBackground2)" }}>
                    <Field label="搜索关键词">
                      <Input
                        value={mcpParamInputs.query || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, query: d.value }))}
                        placeholder="输入搜索关键词..."
                        style={{ width: "100%" }}
                      />
                    </Field>
                  </div>
                )}

                {/* 运行测试与结果展示 */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Button
                    appearance="primary"
                    className={styles.actionButton}
                    disabled={isTestingMcp}
                    icon={isTestingMcp ? <Spinner size="tiny" /> : <Play24Regular />}
                    onClick={() => handleRunTool(detailTool)}
                  >
                    {isTestingMcp ? "正在执行..." : "立即运行测试"}
                  </Button>
                  <Button
                    appearance="secondary"
                    className={styles.actionButton}
                    onClick={() => copyToClipboard(JSON.stringify(mcpTestResult || detailTool, null, 2), "tool-result")}
                  >
                    复制结果 JSON
                  </Button>
                </div>

                {/* 元宝搜索信源格式化展示 */}
                {detailTool.name === "yuanbao_web_search" && mcpTestResult?.result?.sources && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                    <Text weight="bold" size={200}>
                      已检索到权威信源 ({mcpTestResult.result.sources.length} 条)：
                    </Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                      {mcpTestResult.result.sources.map((src: any) => (
                        <div key={src.index} className={styles.sourceCard}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "var(--colorBrandForeground1)",
                                textDecoration: "none",
                                fontWeight: "600",
                                fontSize: "13px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>[{src.index}] {src.title || "网页信源"}</span>
                              <Open24Regular style={{ fontSize: "14px" }} />
                            </a>
                            {src.site && (
                              <Badge size="small" appearance="outline">
                                {src.site}
                              </Badge>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground2)", lineHeight: "1.45" }}>
                            {src.snippet}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 截图成功图片预览 */}
                {mcpTestResult?.result?.imageBase64 && (
                  <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <Text weight="bold" size={200}>屏幕快照预览：</Text>
                    <div style={{ textAlign: "center", backgroundColor: "var(--colorNeutralBackground1)", padding: "10px", borderRadius: "12px", border: "1px solid var(--colorNeutralStroke2)" }}>
                      <img
                        src={mcpTestResult.result.imageBase64.startsWith("data:") ? mcpTestResult.result.imageBase64 : `data:image/png;base64,${mcpTestResult.result.imageBase64}`}
                        alt="Screen Capture"
                        style={{ maxHeight: "260px", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }}
                      />
                    </div>
                  </div>
                )}

                {/* 原始结果输出 */}
                {mcpTestResult && (
                  <div className={styles.codeBlock}>
                    {JSON.stringify(mcpTestResult, null, 2)}
                  </div>
                )}
              </DialogContent>

              <DialogActions>
                <Button appearance="secondary" className={styles.actionButton} onClick={() => setDetailTool(null)}>
                  关闭
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>

      {/* 2. MCP 服务端接入弹窗 */}
      <Dialog open={!!detailMcpServer} onOpenChange={(_, data) => !data.open && setDetailMcpServer(null)}>
        <DialogSurface style={{ maxWidth: "740px", width: "90vw", borderRadius: "16px" }}>
          {detailMcpServer && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailMcpServer(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>{detailMcpServer.name} - 客户端接入配置</span>
                </div>
              </DialogTitle>

              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.5" }}>
                  {detailMcpServer.description}
                </Text>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Badge appearance="tint" color="brand">
                    传输协议: {detailMcpServer.transport.toUpperCase()}
                  </Badge>
                  {detailMcpServer.url && (
                    <Badge appearance="outline">
                      服务地址: {detailMcpServer.url}
                    </Badge>
                  )}
                  {detailMcpServer.command && (
                    <Badge appearance="outline">
                      CLI 程序: {detailMcpServer.command}
                    </Badge>
                  )}
                </div>

                {detailMcpServer.id === "mcp.admt.core" && (
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    backgroundColor: "var(--colorNeutralBackground2)",
                    border: "1px solid var(--colorNeutralStroke2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: mcpStatus.isRunning ? "#107c41" : "var(--colorNeutralStroke1)",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--colorNeutralForeground1)" }}>
                          {mcpStatus.isRunning ? `ADMT 本地 MCP 服务端已启动 (端口 ${mcpStatus.port || 39860})` : "ADMT 本地 MCP 服务端未启动"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                          {mcpStatus.isRunning
                            ? `已连接 ${mcpStatus.connectedClients || 0} 个外部客户端 · 支持全部 11 项核心玩机与宿主工具`
                            : "Cursor / Claude Desktop 等客户端连接前，请先点击右侧启动服务端"}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="small"
                      appearance={mcpStatus.isRunning ? "secondary" : "primary"}
                      className={styles.actionButton}
                      onClick={async () => {
                        if (mcpStatus.isRunning) {
                          await stopMcpServer();
                          setStatusBarMessage({ type: "info", message: "ADMT MCP 本地服务端已停止" });
                        } else {
                          const ok = await startMcpServer();
                          if (ok) {
                            setStatusBarMessage({ type: "success", message: "ADMT MCP 本地服务端已启动 (端口 39860)" });
                          } else {
                            setStatusBarMessage({ type: "error", message: "启动 MCP 服务失败" });
                          }
                        }
                      }}
                    >
                      {mcpStatus.isRunning ? "停止服务" : "立即启动"}
                    </Button>
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <Text weight="bold" size={300}>
                      客户端 JSON 配置文件生成：
                    </Text>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {(["cursor", "claudeDesktop", "antigravity", "windsurf"] as const).map((clientKey) => (
                        <Button
                          key={clientKey}
                          size="small"
                          className={styles.actionButton}
                          appearance={selectedClient === clientKey ? "primary" : "secondary"}
                          onClick={() => setSelectedClient(clientKey)}
                        >
                          {clientKey === "cursor"
                            ? "Cursor"
                            : clientKey === "claudeDesktop"
                              ? "Claude Desktop"
                              : clientKey === "antigravity"
                                ? "Antigravity"
                                : "Windsurf"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.codeBlock}>
                    {selectedClient === "cursor"
                      ? detailMcpServer.configSnippets.cursor
                      : selectedClient === "claudeDesktop"
                        ? detailMcpServer.configSnippets.claudeDesktop
                        : selectedClient === "antigravity"
                          ? detailMcpServer.configSnippets.antigravity
                          : detailMcpServer.configSnippets.windsurf}
                  </div>
                </div>
              </DialogContent>

              <DialogActions>
                <Button
                  appearance="primary"
                  className={styles.actionButton}
                  icon={copiedId === detailMcpServer.id ? <Checkmark24Regular /> : <Copy24Regular />}
                  onClick={() => {
                    const code =
                      selectedClient === "cursor"
                        ? detailMcpServer.configSnippets.cursor
                        : selectedClient === "claudeDesktop"
                          ? detailMcpServer.configSnippets.claudeDesktop
                          : selectedClient === "antigravity"
                            ? detailMcpServer.configSnippets.antigravity
                            : detailMcpServer.configSnippets.windsurf;
                    copyToClipboard(code, detailMcpServer.id);
                  }}
                >
                  {copiedId === detailMcpServer.id ? "已复制配置" : "复制客户端配置"}
                </Button>
                {detailMcpServer.id === "mcp.yuanbao.search" && (
                  <Button
                    appearance="secondary"
                    className={styles.actionButton}
                    icon={<Settings24Regular />}
                    onClick={() => {
                      setDetailMcpServer(null);
                      openYuanbaoModal();
                    }}
                  >
                    配置服务参数
                  </Button>
                )}
                <Button appearance="secondary" className={styles.actionButton} onClick={() => setDetailMcpServer(null)}>
                  关闭
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>

      {/* 3. 元宝搜索专属参数配置弹窗（仅由对应卡片内部触发） */}
      <Dialog open={isYuanbaoConfigOpen} onOpenChange={(_, data) => !data.open && setIsYuanbaoConfigOpen(false)}>
        <DialogSurface style={{ maxWidth: "540px", width: "90vw", borderRadius: "16px" }}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsYuanbaoConfigOpen(false)} />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>腾讯云元宝搜索参数配置</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.5" }}>
                配置腾讯云元宝搜索 (SearchPro / WSA) 凭证与默认检索策略，为 MCP 工具与 Agent 赋予全网实时检索权威信源的能力。
              </Text>

              {/* API Key 填入区 */}
              <Field label="API 密钥 (API Key / Bearer Token)" required>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={yuanbaoApiKey}
                    onChange={(_, d) => setYuanbaoApiKey(d.value)}
                    placeholder="输入腾讯云元宝搜索 API Key..."
                    style={{ flex: 1 }}
                  />
                  <Button
                    appearance="subtle"
                    icon={showApiKey ? <EyeOff24Regular /> : <Eye24Regular />}
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? "隐藏密钥" : "显示密钥"}
                  />
                </div>
              </Field>

              {/* 搜索参数配置 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label="默认时效性过滤 (Freshness)">
                  <Select
                    value={yuanbaoFreshness}
                    onChange={(_, d) => setYuanbaoFreshness(d.value as any)}
                  >
                    <option value="noLimit">不限时效 (全部历史)</option>
                    <option value="oneDay">24小时内最新</option>
                    <option value="oneWeek">过去一周</option>
                    <option value="oneMonth">过去一月</option>
                    <option value="oneYear">过去一年</option>
                  </Select>
                </Field>

                <Field label="单次检索结果数 (Result Count)">
                  <Select
                    value={String(yuanbaoResultCount)}
                    onChange={(_, d) => setYuanbaoResultCount(parseInt(d.value, 10))}
                  >
                    <option value="0">自动 / 极速版兼容 (推荐)</option>
                    <option value="10">10 条 (标准版推荐)</option>
                    <option value="20">20 条 (深度检索)</option>
                    <option value="30">30 条 (海量信源)</option>
                    <option value="40">40 条 (大范围覆盖)</option>
                    <option value="50">50 条 (全网穷尽)</option>
                  </Select>
                </Field>
              </div>

              <Field label="API 接口端点 (Endpoint)">
                <Input
                  value={yuanbaoEndpoint}
                  onChange={(_, d) => setYuanbaoEndpoint(d.value)}
                  placeholder="https://api.wsa.cloud.tencent.com"
                  style={{ width: "100%" }}
                />
              </Field>

              {/* 连通性测试状态反馈 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Button
                    appearance="secondary"
                    className={styles.actionButton}
                    icon={isTestingYuanbao ? <Spinner size="tiny" /> : <Search24Regular />}
                    onClick={handleTestYuanbao}
                    disabled={isTestingYuanbao || !yuanbaoApiKey.trim()}
                  >
                    {isTestingYuanbao ? "正在测试服务..." : "测试服务连通性"}
                  </Button>
                </div>

                {yuanbaoTestStatus.type !== "idle" && (
                  <div style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: yuanbaoTestStatus.type === "success" ? "rgba(39, 174, 96, 0.1)" : "rgba(235, 87, 87, 0.1)",
                    color: yuanbaoTestStatus.type === "success" ? "#27ae60" : "#eb5757",
                    border: `1px solid ${yuanbaoTestStatus.type === "success" ? "rgba(39, 174, 96, 0.3)" : "rgba(235, 87, 87, 0.3)"}`,
                  }}>
                    {yuanbaoTestStatus.type === "success" ? <Checkmark24Regular /> : <Dismiss24Regular />}
                    <span>{yuanbaoTestStatus.message}</span>
                  </div>
                )}
              </div>
            </DialogContent>

            <DialogActions>
              <Button
                appearance="primary"
                className={styles.actionButton}
                icon={<Save24Regular />}
                onClick={handleSaveYuanbaoConfig}
              >
                保存配置
              </Button>
              <Button
                appearance="secondary"
                className={styles.actionButton}
                onClick={() => setIsYuanbaoConfigOpen(false)}
              >
                取消
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default McpResourcesPanel;
