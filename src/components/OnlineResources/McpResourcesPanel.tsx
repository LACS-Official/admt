import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  TabList,
  Tab,
  Text,
  Badge,
  tokens,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Select,
  Spinner,
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
  Sparkle24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useMcpStore, ADMT_BUILTIN_MCP_TOOLS, PRESET_MCP_RESOURCES, McpToolDefinition } from "../../stores/mcpStore";
import { McpServerResource } from "../../types/mcp";
import { useAppStore } from "../../stores/appStore";
import { executeMcpTool } from "../../services/mcpExecutor";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: "16px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.padding("14px", "18px"),
    ...shorthands.borderRadius("10px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--colorNeutralForeground1)",
  },
  subtitleText: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  subTabList: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    paddingRight: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
      ...shorthands.borderColor("var(--colorBrandStroke2)"),
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.3",
  },
  cardDesc: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.45",
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "auto",
    paddingTop: "10px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  codeBlock: {
    backgroundColor: "var(--colorNeutralBackground3)",
    ...shorthands.borderRadius("8px"),
    ...shorthands.padding("12px"),
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: "12px",
    color: "var(--colorNeutralForeground1)",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    maxHeight: "260px",
    overflowY: "auto",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke3)"),
  },
});

export const McpResourcesPanel: React.FC = () => {
  const styles = useStyles();
  const { setStatusBarMessage } = useAppStore();

  const mcpResources = useMcpStore((state) => state.mcpResources);

  const [activeSubTab, setActiveSubTab] = useState<"tools" | "servers">("tools");
  const [detailMcpServer, setDetailMcpServer] = useState<McpServerResource | null>(null);
  const [detailTool, setDetailTool] = useState<McpToolDefinition | null>(null);
  const [selectedClient, setSelectedClient] = useState<"cursor" | "claudeDesktop" | "antigravity" | "windsurf">("cursor");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 工具手动测试状态
  const [mcpParamInputs, setMcpParamInputs] = useState<Record<string, string>>({
    command: "getprop ro.product.model",
    target: "system",
    query: "Android Magisk Root 教程",
    url: "https://github.com",
    filter: "all",
  });
  const [mcpTestResult, setMcpTestResult] = useState<any>(null);
  const [isTestingMcp, setIsTestingMcp] = useState(false);

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

  return (
    <div className={styles.container}>
      {/* 顶部 Header 与二级 Tab 切换 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <Server24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "24px" }} />
            <div>
              <div className={styles.titleText}>MCP 协议生态与工具能力中心</div>
              <div className={styles.subtitleText}>
                基于标准 Model Context Protocol (MCP)，提供 ADMT 核心玩机工具链及主流开源免费服务商接入
              </div>
            </div>
          </div>
        </div>

        <TabList
          selectedValue={activeSubTab}
          onTabSelect={(_, data) => setActiveSubTab(data.value as any)}
          className={styles.subTabList}
        >
          <Tab value="tools" icon={<Wrench24Regular />}>
            🛠️ ADMT 核心 MCP 工具能力 (8 项工具)
          </Tab>
          <Tab value="servers" icon={<Globe24Regular />}>
            🌐 主流开源 MCP 服务商 (8 个服务生态)
          </Tab>
        </TabList>
      </div>

      {/* 主展示区 (一行 2 个卡片) */}
      <div className={styles.content}>
        {activeSubTab === "tools" ? (
          /* 1. MCP 工具列表 */
          <div className={styles.grid}>
            {ADMT_BUILTIN_MCP_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className={styles.card}
                onClick={() => {
                  setDetailTool(tool);
                  setMcpTestResult(null);
                }}
              >
                <div className={styles.cardTop}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Wrench24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "18px" }} />
                    <Text weight="bold" size={300}>
                      {tool.name}
                    </Text>
                  </div>
                  <Badge appearance="tint" color="brand">
                    MCP TOOL
                  </Badge>
                </div>

                <div className={styles.cardDesc}>{tool.description}</div>

                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    appearance="primary"
                    icon={<Play24Regular />}
                    onClick={() => {
                      setDetailTool(tool);
                      setMcpTestResult(null);
                    }}
                  >
                    调试与执行测试
                  </Button>
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={copiedId === tool.name ? <Checkmark24Regular /> : <Copy24Regular />}
                    onClick={() => copyToClipboard(JSON.stringify(tool, null, 2), tool.name)}
                  >
                    {copiedId === tool.name ? "已复制" : "复制 Schema"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 2. MCP 服务端列表 */
          <div className={styles.grid}>
            {mcpResources.map((res) => {
              const configCode =
                selectedClient === "cursor"
                  ? res.configSnippets.cursor
                  : selectedClient === "claudeDesktop"
                  ? res.configSnippets.claudeDesktop
                  : selectedClient === "antigravity"
                  ? res.configSnippets.antigravity
                  : res.configSnippets.windsurf;

              return (
                <div
                  key={res.id}
                  className={styles.card}
                  onClick={() => setDetailMcpServer(res)}
                >
                  <div className={styles.cardTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Server24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "18px" }} />
                      <Text weight="bold" size={300}>
                        {res.name}
                      </Text>
                    </div>
                    <Badge appearance="tint" color="brand">
                      {res.transport.toUpperCase()}
                    </Badge>
                  </div>

                  <div className={styles.cardDesc}>{res.description}</div>

                  <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      appearance="primary"
                      icon={<Open24Regular />}
                      onClick={() => setDetailMcpServer(res)}
                    >
                      接入配置与详情
                    </Button>
                    <Button
                      size="small"
                      appearance="secondary"
                      icon={copiedId === res.id ? <Checkmark24Regular /> : <Copy24Regular />}
                      onClick={() => copyToClipboard(configCode, res.id)}
                    >
                      {copiedId === res.id ? "已复制" : "复制配置"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. MCP 工具调试弹窗 */}
      <Dialog open={!!detailTool} onOpenChange={(_, data) => !data.open && setDetailTool(null)}>
        <DialogSurface style={{ maxWidth: "760px", width: "90vw" }}>
          {detailTool && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailTool(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Wrench24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>{detailTool.name} - MCP 工具调试与运行</span>
                </div>
              </DialogTitle>

              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  {detailTool.description}
                </Text>

                {/* 参数输入 */}
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--colorNeutralBackground2)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {detailTool.name === "admt_execute_adb" && (
                    <div>
                      <label style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                        ADB Shell 指令 (无需加 'adb ')：
                      </label>
                      <Input
                        value={mcpParamInputs.command || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, command: d.value }))}
                        placeholder="例如 getprop ro.product.model 或 pm list packages"
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}

                  {detailTool.name === "admt_reboot_device" && (
                    <div>
                      <label style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                        重启目标模式 (Target)：
                      </label>
                      <Select
                        value={mcpParamInputs.target || "system"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, target: d.value }))}
                      >
                        <option value="system">重启至系统 (System)</option>
                        <option value="recovery">重启至 Recovery</option>
                        <option value="bootloader">重启至 Bootloader (Fastboot)</option>
                        <option value="edl">重启至 9008 (EDL)</option>
                      </Select>
                    </div>
                  )}

                  {detailTool.name === "admt_list_packages" && (
                    <div>
                      <label style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                        过滤分类：
                      </label>
                      <Select
                        value={mcpParamInputs.filter || "all"}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, filter: d.value }))}
                      >
                        <option value="all">所有应用 (All)</option>
                        <option value="third_party">第三方用户应用 (3rd-party)</option>
                        <option value="system">系统内置应用 (System)</option>
                      </Select>
                    </div>
                  )}

                  {detailTool.name === "brave_web_search" && (
                    <div>
                      <label style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                        搜索关键词：
                      </label>
                      <Input
                        value={mcpParamInputs.query || ""}
                        onChange={(_, d) => setMcpParamInputs((prev) => ({ ...prev, query: d.value }))}
                        placeholder="输入搜索关键词..."
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      appearance="primary"
                      disabled={isTestingMcp}
                      icon={isTestingMcp ? <Spinner size="tiny" /> : <Play24Regular />}
                      onClick={() => handleRunTool(detailTool)}
                    >
                      {isTestingMcp ? "正在执行..." : "立即运行测试"}
                    </Button>
                    <Button
                      appearance="secondary"
                      onClick={() => copyToClipboard(JSON.stringify(mcpTestResult || detailTool, null, 2), "tool-result")}
                    >
                      复制结果 JSON
                    </Button>
                  </div>

                  {mcpTestResult && (
                    <div className={styles.codeBlock}>
                      {JSON.stringify(mcpTestResult, null, 2)}
                    </div>
                  )}
                </div>
              </DialogContent>

              <DialogActions>
                <Button appearance="secondary" onClick={() => setDetailTool(null)}>
                  关闭
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>

      {/* 2. MCP 服务端接入弹窗 */}
      <Dialog open={!!detailMcpServer} onOpenChange={(_, data) => !data.open && setDetailMcpServer(null)}>
        <DialogSurface style={{ maxWidth: "760px", width: "90vw" }}>
          {detailMcpServer && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailMcpServer(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>{detailMcpServer.name} - MCP 客户端接入配置</span>
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
                <Button appearance="secondary" onClick={() => setDetailMcpServer(null)}>
                  关闭
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default McpResourcesPanel;
