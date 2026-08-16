import React, { useState, useMemo } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  SearchBox,
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
  Sparkle24Regular,
  Copy24Regular,
  Checkmark24Regular,
  ArrowDownload24Regular,
  Tag24Regular,
  Code24Regular,
  DocumentText24Regular,
  Lightbulb24Regular,
  Dismiss24Regular,
  Open24Regular,
  Apps24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { useMcpStore, PRESET_AI_SKILLS } from "../../stores/mcpStore";
import { AISkillResource } from "../../types/mcp";
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
    gap: "12px",
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
    flexWrap: "wrap",
    gap: "12px",
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
  searchBox: {
    minWidth: "260px",
    maxWidth: "340px",
  },
  categoryRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "2px",
    "::-webkit-scrollbar": {
      display: "none",
    },
  },
  categoryChip: {
    ...shorthands.padding("5px", "12px"),
    ...shorthands.borderRadius("16px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke1)"),
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground2)",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      color: "var(--colorNeutralForeground1)",
      transform: "translateY(-1px)",
    },
  },
  categoryChipActive: {
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    ...shorthands.borderColor("var(--colorBrandStroke2)"),
    fontWeight: "600",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.06)",
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
  skillCard: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    gap: "10px",
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
    maxHeight: "380px",
    overflowY: "auto",
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke3)"),
  },
});

export const SkillsResourcesPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();

  const skills = useMcpStore((state) => state.skills);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [detailSkill, setDetailSkill] = useState<AISkillResource | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "全部技能" },
    { id: "flash", label: "⚡ 救砖与刷机" },
    { id: "magisk", label: "🛡️ Magisk/Root" },
    { id: "reverse", label: "🔍 逆向工程" },
    { id: "rom", label: "📱 ROM 定制" },
    { id: "kernel", label: "⚙️ 内核调优" },
    { id: "tuning", label: "🚀 性能调优" },
  ];

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchCat = selectedCategory === "all" || s.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.author.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [skills, selectedCategory, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setStatusBarMessage({
      type: "success",
      message: "Prompt 专家指令已复制到剪贴板",
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
      {/* 顶部搜索与分类 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <Sparkle24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "24px" }} />
            <div>
              <div className={styles.titleText}>AI Skills 玩机专家技能库</div>
              <div className={styles.subtitleText}>
                针对 Android 救砖调优、底包逆向、Magisk 模块架构与 ROM 移植深度优化的 Prompt 提示词技能生态
              </div>
            </div>
          </div>

          <SearchBox
            className={styles.searchBox}
            placeholder="搜索技能名称、分类、标签或作者..."
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
          />
        </div>

        {/* 分类过滤 Chip */}
        <div className={styles.categoryRow}>
          {categories.map((c) => (
            <div
              key={c.id}
              className={`${styles.categoryChip} ${selectedCategory === c.id ? styles.categoryChipActive : ""}`}
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* 技能卡片列表 (一行 2 个) */}
      <div className={styles.content}>
        <div className={styles.grid}>
          {filteredSkills.map((skill) => (
            <div key={skill.id} className={styles.skillCard} onClick={() => setDetailSkill(skill)}>
              <div className={styles.cardTop}>
                <Badge appearance="tint" color="brand" size="small">
                  {skill.category.toUpperCase()}
                </Badge>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  作者: {skill.author}
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
                <Tooltip content="导出为 Markdown 格式" relationship="label">
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
      </div>

      {/* Skills 详情弹窗 (二级弹窗) */}
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
                      System Prompt 专家指令详情：
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
    </div>
  );
};

export default SkillsResourcesPanel;
