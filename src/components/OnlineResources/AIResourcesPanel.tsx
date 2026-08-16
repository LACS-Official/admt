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
} from "@fluentui/react-components";
import {
  Brain24Regular,
  Copy24Regular,
  Checkmark24Regular,
  ArrowDownload24Regular,
  Sparkle24Regular,
  Server24Regular,
  Tag24Regular,
  Code24Regular,
  DocumentText24Regular,
  Lightbulb24Regular,
  Bot24Regular,
  WindowDevTools24Regular,
  Dismiss24Regular,
  Open24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useMcpStore, PRESET_AI_SKILLS, PRESET_MCP_RESOURCES } from "../../stores/mcpStore";
import { AISkillResource, McpServerResource } from "../../types/mcp";
import { useAppStore } from "../../stores/appStore";

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
  skillsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  },
  skillCard: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
      ...shorthands.borderColor("var(--colorBrandStroke2)"),
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skillTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.3",
  },
  skillDesc: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.45",
    display: "-webkit-box",
    "-webkit-line-clamp": "3",
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "auto",
  },
  tagChip: {
    fontSize: "11px",
    padding: "2px 8px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "4px",
    color: "var(--colorNeutralForeground2)",
  },
  cardActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    paddingTop: "10px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  mcpGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "16px",
  },
  mcpCard: {
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
  promptBox: {
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("8px"),
    ...shorthands.padding("14px"),
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: "12px",
    lineHeight: "1.55",
    color: "var(--colorNeutralForeground1)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: "360px",
    overflowY: "auto",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke3)"),
  },
});

const AIResourcesPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();

  const skills = useMcpStore((state) => state.skills);
  const mcpResources = useMcpStore((state) => state.mcpResources);
  const activeTab = useMcpStore((state) => state.activeSkillTab);
  const setActiveTab = useMcpStore((state) => state.setActiveSkillTab);

  // 弹窗状态
  const [detailSkill, setDetailSkill] = useState<AISkillResource | null>(null);
  const [detailMcp, setDetailMcp] = useState<McpServerResource | null>(null);
  const [selectedClient, setSelectedClient] = useState<"cursor" | "claudeDesktop" | "antigravity" | "windsurf">("cursor");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setStatusBarMessage({
      type: "success",
      message: t("online_resources.ai_resources.copied", "已复制到剪贴板"),
    });
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const exportPromptToFile = (skill: AISkillResource) => {
    const blob = new Blob([skill.systemPrompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skill.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusBarMessage({
      type: "success",
      message: `已导出 ${skill.id}.md 文件`,
    });
  };

  return (
    <div className={styles.container}>
      {/* 顶部标题与子 Tab 切换 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <Brain24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "24px" }} />
            <div>
              <div className={styles.titleText}>
                {t("online_resources.ai_resources.title", "AI 技能库与 MCP 扩展中心")}
              </div>
              <div className={styles.subtitleText}>
                {t(
                  "online_resources.ai_resources.subtitle",
                  "专为 Android 玩机、底层逆向、救砖调优打造的 Prompt Skills 与 MCP 连接协议"
                )}
              </div>
            </div>
          </div>
        </div>

        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as any)}
          className={styles.subTabList}
        >
          <Tab value="skills" icon={<Sparkle24Regular />}>
            {t("online_resources.ai_resources.tab_skills", "AI 技能模板 (Skills)")}
          </Tab>
          <Tab value="mcp-servers" icon={<Server24Regular />}>
            {t("online_resources.ai_resources.tab_mcp", "MCP 协议扩展 (MCP Servers)")}
          </Tab>
        </TabList>
      </div>

      {/* 主展示区 */}
      <div className={styles.content}>
        {activeTab === "skills" ? (
          /* Skills 卡片列表 */
          <div className={styles.skillsGrid}>
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={styles.skillCard}
                onClick={() => setDetailSkill(skill)}
              >
                <div className={styles.cardTop}>
                  <Badge appearance="tint" color="brand" size="small">
                    {skill.category.toUpperCase()}
                  </Badge>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                    {skill.author}
                  </Text>
                </div>

                <div className={styles.skillTitle}>{skill.title}</div>
                <div className={styles.skillDesc}>{skill.description}</div>

                <div className={styles.tagList}>
                  {skill.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tagChip}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    appearance="primary"
                    icon={<Open24Regular />}
                    onClick={() => setDetailSkill(skill)}
                  >
                    查看详情与 Prompt
                  </Button>
                  <Button
                    size="small"
                    appearance="secondary"
                    icon={copiedId === skill.id ? <Checkmark24Regular /> : <Copy24Regular />}
                    onClick={() => copyToClipboard(skill.systemPrompt, skill.id)}
                  >
                    {copiedId === skill.id ? "已复制" : "复制"}
                  </Button>
                  <Tooltip content="导出为 Markdown 文本" relationship="label">
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<ArrowDownload24Regular />}
                      onClick={() => exportPromptToFile(skill)}
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* MCP 服务器资源列表 */
          <div className={styles.mcpGrid}>
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
                  className={styles.mcpCard}
                  onClick={() => setDetailMcp(res)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Server24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "20px" }} />
                      <Text weight="bold" size={300}>
                        {res.name}
                      </Text>
                    </div>
                    <Badge appearance="tint" color="brand">
                      {res.transport.toUpperCase()}
                    </Badge>
                  </div>

                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.4" }}>
                    {res.description}
                  </Text>

                  <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      appearance="primary"
                      icon={<Open24Regular />}
                      onClick={() => setDetailMcp(res)}
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

      {/* 1. Skills 详情弹窗 (二级弹窗) */}
      <Dialog open={!!detailSkill} onOpenChange={(_, data) => !data.open && setDetailSkill(null)}>
        <DialogSurface style={{ maxWidth: "760px", width: "90vw" }}>
          {detailSkill && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailSkill(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkle24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>{detailSkill.title}</span>
                </div>
              </DialogTitle>

              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                <div>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                    {detailSkill.description}
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                    <Badge size="small" appearance="tint" color="brand">
                      分类: {detailSkill.category.toUpperCase()}
                    </Badge>
                    <Badge size="small" appearance="outline">
                      作者: {detailSkill.author}
                    </Badge>
                    {detailSkill.recommendedModels.map((m, idx) => (
                      <Badge key={idx} size="small" appearance="outline" color="important">
                        推荐模型: {m}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <Text weight="bold" size={300}>
                      System Prompt 专家指令预览：
                    </Text>
                  </div>
                  <div className={styles.promptBox}>{detailSkill.systemPrompt}</div>
                </div>
              </DialogContent>

              <DialogActions>
                <Button appearance="subtle" onClick={() => exportPromptToFile(detailSkill)}>
                  导出为 .md 文件
                </Button>
                <Button
                  appearance="primary"
                  icon={copiedId === detailSkill.id ? <Checkmark24Regular /> : <Copy24Regular />}
                  onClick={() => copyToClipboard(detailSkill.systemPrompt, detailSkill.id)}
                >
                  {copiedId === detailSkill.id ? "已复制到剪贴板" : "复制完整 Prompt"}
                </Button>
                <Button appearance="secondary" onClick={() => setDetailSkill(null)}>
                  关闭
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>

      {/* 2. MCP 协议详情弹窗 (二级弹窗) */}
      <Dialog open={!!detailMcp} onOpenChange={(_, data) => !data.open && setDetailMcp(null)}>
        <DialogSurface style={{ maxWidth: "760px", width: "90vw" }}>
          {detailMcp && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailMcp(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Server24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>{detailMcp.name} - MCP 服务接入配置</span>
                </div>
              </DialogTitle>

              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)", lineHeight: "1.5" }}>
                  {detailMcp.description}
                </Text>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Badge appearance="tint" color="brand">
                    传输协议: {detailMcp.transport.toUpperCase()}
                  </Badge>
                  {detailMcp.url && (
                    <Badge appearance="outline">
                      服务地址: {detailMcp.url}
                    </Badge>
                  )}
                  {detailMcp.command && (
                    <Badge appearance="outline">
                      CLI 启动程序: {detailMcp.command}
                    </Badge>
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <Text weight="bold" size={300}>
                      目标 AI 客户端配置模板：
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
                      ? detailMcp.configSnippets.cursor
                      : selectedClient === "claudeDesktop"
                      ? detailMcp.configSnippets.claudeDesktop
                      : selectedClient === "antigravity"
                      ? detailMcp.configSnippets.antigravity
                      : detailMcp.configSnippets.windsurf}
                  </div>
                </div>
              </DialogContent>

              <DialogActions>
                <Button
                  appearance="primary"
                  icon={copiedId === detailMcp.id ? <Checkmark24Regular /> : <Copy24Regular />}
                  onClick={() => {
                    const code =
                      selectedClient === "cursor"
                        ? detailMcp.configSnippets.cursor
                        : selectedClient === "claudeDesktop"
                        ? detailMcp.configSnippets.claudeDesktop
                        : selectedClient === "antigravity"
                        ? detailMcp.configSnippets.antigravity
                        : detailMcp.configSnippets.windsurf;
                    copyToClipboard(code, detailMcp.id);
                  }}
                >
                  {copiedId === detailMcp.id ? "已复制配置" : "复制客户端 JSON 配置"}
                </Button>
                <Button appearance="secondary" onClick={() => setDetailMcp(null)}>
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

export default AIResourcesPanel;
