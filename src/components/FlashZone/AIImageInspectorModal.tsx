import React, { useState, useEffect, useRef } from "react";
import {
  makeStyles,
  tokens,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Badge,
  Text,
  Spinner,
  Input,
  Tooltip,
  Divider,
} from "@fluentui/react-components";
import {
  BrainCircuit24Regular,
  ShieldCheckmark24Regular,
  ShieldDismiss24Regular,
  Dismiss24Regular,
  Send24Regular,
  DocumentBulletList24Regular,
  ArrowReset24Regular,
  Copy24Regular,
  Checkmark24Regular,
  Info24Regular,
  Code24Regular,
  Flash24Regular,
} from "@fluentui/react-icons";
import { PartitionImageInspection } from "../../types/fastbootPartition";
import { aiService } from "../../services/aiService";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  surface: {
    maxWidth: "960px",
    width: "90vw",
    maxHeight: "88vh",
    height: "88vh",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    borderRadius: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.28)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerBadges: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  body: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr",
    gap: "16px",
    padding: "16px 0",
    overflow: "hidden",
    minHeight: 0,
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
    paddingRight: "8px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    padding: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    minHeight: 0,
    overflow: "hidden",
  },
  sectionCard: {
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "10px",
    padding: "12px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
  },
  gridTwoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    fontSize: "12px",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  metaLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  metaValue: {
    fontSize: "12px",
    fontWeight: 500,
    fontFamily: "monospace",
    color: "var(--colorNeutralForeground1)",
    wordBreak: "break-all",
  },
  rootBadgeGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  rootItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 10px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke3)",
  },
  cmdlineBox: {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "11px",
    backgroundColor: "var(--colorNeutralBackground1)",
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke3)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    maxHeight: "90px",
    overflowY: "auto",
    lineHeight: "1.4",
  },
  aiHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatHistory: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "4px",
    minHeight: 0,
  },
  aiMessageBubble: {
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "10px",
    padding: "12px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    fontSize: "13px",
    lineHeight: "1.6",
    color: "var(--colorNeutralForeground1)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    "& h1, & h2, & h3, & strong": {
      color: "var(--colorBrandForeground1)",
    },
  },
  userMessageBubble: {
    alignSelf: "flex-end",
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    border: "1px solid var(--colorBrandStroke2)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    maxWidth: "85%",
    wordBreak: "break-word",
  },
  inputArea: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    marginTop: "auto",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "12px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
});

interface AIImageInspectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: PartitionImageInspection | null;
  onFlashToPartition?: (partition: string) => void;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const AIImageInspectorModal: React.FC<AIImageInspectorModalProps> = ({
  open,
  onOpenChange,
  inspection,
  onFlashToPartition,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 当传入新的解包数据时，自动构建上下文并启动 AI 分析
  useEffect(() => {
    if (open && inspection) {
      runInitialAIAnalysis(inspection);
    } else {
      setMessages([]);
    }
  }, [open, inspection?.fileName, inspection?.fileSizeBytes]);

  const runInitialAIAnalysis = async (data: PartitionImageInspection) => {
    setIsLoading(true);

    const rootInfo = data.rootDetections.length > 0
      ? data.rootDetections.map((r) => `${r.name}: ${r.details}`).join("\n")
      : "未检测到已知的 Root 补丁指纹 (可能为官方原生镜像)";

    const prompt = `你是一位世界顶级的 Android 系统底层与固件逆向分析专家。
以下是我们通过对镜像文件进行真实二进制解包与头部探测提取出的结构化元数据：

【镜像文件概况】
- 文件名: ${data.fileName}
- 文件大小: ${data.fileSizeFormatted} (${data.fileSizeBytes} 字节)
- 镜像类型: ${data.imageType} (Magic: ${data.magic})
- Boot Header 版本: ${data.headerVersion !== undefined ? "v" + data.headerVersion : "无/未知"}
- OS 系统版本 (解包探测): ${data.osVersion || "未指定/无"}
- 安全补丁级别 (解包探测): ${data.osPatchLevel || "未指定/无"}
- 内核体积: ${data.kernelSize ? (data.kernelSize / 1024 / 1024).toFixed(2) + " MB" : "未知"}
- Ramdisk 体积: ${data.ramdiskSize ? (data.ramdiskSize / 1024 / 1024).toFixed(2) + " MB" : "0 / 无"}
- DTB 体积: ${data.dtbSize ? (data.dtbSize / 1024).toFixed(2) + " KB" : "无"}
- Page Size: ${data.pageSize || 4096} 字节
- 板级名称 (Board Name): ${data.boardName || "未标明"}

【Root 修补与安全指纹探测】
${rootInfo}

【AVB / Vbmeta 验证信息】
- AVB 版本: ${data.avbVersion || "无"}
- 防回滚 Rollback Index: ${data.rollbackIndex !== undefined ? data.rollbackIndex : "无"}
- DM-Verity 状态: ${data.isVerityDisabled ? "已禁用" : "已启用/默认"}
- AVB 签名验证: ${data.isVerificationDisabled ? "已禁用" : "已启用/默认"}

【内核启动参数 (cmdline)】
${data.cmdline || "（无额外内核 cmdline 参数）"}

【从 Ramdisk 提取的系统属性】
${
  Object.keys(data.extractedProperties).length > 0
    ? Object.entries(data.extractedProperties)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")
    : "（无嵌入的 build.prop 属性）"
}

请根据以上真实的解包与逆向探测数据，输出一份清晰专业的【AI 镜像深度诊断报告】：
1.  **镜像画像与类型定位**：说明该镜像属于什么分区、适配的大致安卓版本和用途。
2.  **Root 与修补状态**：明确指出是否包含 Magisk/KernelSU/APatch 补丁及依据。
3.  **内核参数与安全分析**：分析 cmdline 和 AVB 校验是否存在特殊配置（如是否会触发 DM-Verity 校验卡米）。
4.  **刷入风险与建议**：给出用户刷入该镜像时的注意事项与防翻车指引。

请使用精炼、专业且层次分明的中文 Markdown 格式回答。`;

    try {
      const response = await aiService.chat([
        {
          role: "system",
          content:
            "你是一个 Android 底层架构、Boot 镜像逆向与玩机救砖专家，基于真实解包数据为用户提供权威客观的诊断与解答。",
        },
        { role: "user", content: prompt },
      ]);

      if (response.error) {
        setMessages([
          {
            role: "assistant",
            content: ` AI 诊断请求失败: ${response.error}\n\n请在软件设置中检查 AI API Key 或端点配置。左侧已展示完整的真实解包元数据。`,
          },
        ]);
      } else {
        setMessages([{ role: "assistant", content: response.content }]);
      }
    } catch (e: any) {
      setMessages([
        {
          role: "assistant",
          content: ` AI 诊断出错: ${e?.message || e}\n\n左侧已提供完整的底层解包数据供您查阅。`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText("");

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await aiService.chat([
        {
          role: "system",
          content: `你是一个 Android 底层与固件镜像分析专家。当前用户正在分析镜像文件: ${inspection?.fileName} (${inspection?.summaryText})。请根据镜像解包出的真实属性解答用户的疑问。`,
        },
        ...newMessages,
      ]);

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: ` 请求失败: ${response.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.content },
        ]);
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: ` 发生错误: ${e?.message || e}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    const lastAssistant = messages.filter((m) => m.role === "assistant").pop();
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (!inspection) return null;

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface className={styles.surface}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <BrainCircuit24Regular style={{ color: "var(--colorBrandForeground1)" }} />
            <div>
              <Text size={400} weight="bold">
                AI 深度解包与分区镜像解析
              </Text>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)", display: "block" }}>
                基于底层二进制解析引擎与真实 Ramdisk 探测
              </Text>
            </div>
          </div>
          <div className={styles.headerBadges}>
            <Badge appearance="filled" color="brand">
              {inspection.imageType.toUpperCase()}
            </Badge>
            {inspection.headerVersion !== undefined && (
              <Badge appearance="outline">Header v{inspection.headerVersion}</Badge>
            )}
            <Badge appearance="tint">{inspection.fileSizeFormatted}</Badge>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Left: 真实解包元数据 */}
          <div className={styles.leftColumn}>
            {/* 核心规格 */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <DocumentBulletList24Regular />
                <span>镜像文件底层规格 (Header Spec)</span>
              </div>
              <div className={styles.gridTwoCol}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>文件名</span>
                  <span className={styles.metaValue}>{inspection.fileName}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>识别 Magic</span>
                  <span className={styles.metaValue}>{inspection.magic || "Raw Data"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>解包系统版本 (OS Ver)</span>
                  <span className={styles.metaValue}>
                    {inspection.osVersion ? (
                      <Badge color="informative" appearance="tint">
                        {inspection.osVersion}
                      </Badge>
                    ) : (
                      "未知 / 无"
                    )}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>安全补丁级别 (Patch Level)</span>
                  <span className={styles.metaValue}>
                    {inspection.osPatchLevel || "未知 / 无"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>内核大小 (Kernel Size)</span>
                  <span className={styles.metaValue}>
                    {inspection.kernelSize
                      ? (inspection.kernelSize / 1024 / 1024).toFixed(2) + " MB"
                      : "无 / 0"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Ramdisk 大小</span>
                  <span className={styles.metaValue}>
                    {inspection.ramdiskSize
                      ? (inspection.ramdiskSize / 1024 / 1024).toFixed(2) + " MB"
                      : "无 / 0"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Page Size 页面大小</span>
                  <span className={styles.metaValue}>{inspection.pageSize || 4096} B</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>DTB 设备树大小</span>
                  <span className={styles.metaValue}>
                    {inspection.dtbSize
                      ? (inspection.dtbSize / 1024).toFixed(1) + " KB"
                      : "无"}
                  </span>
                </div>
              </div>
            </div>

            {/* Root 补丁指纹探测 */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <ShieldCheckmark24Regular />
                <span>Root 修补与安全性探测</span>
              </div>
              <div className={styles.rootBadgeGroup}>
                {inspection.rootDetections.length > 0 ? (
                  inspection.rootDetections.map((r, idx) => (
                    <div key={idx} className={styles.rootItem}>
                      <div>
                        <Text weight="semibold" size={200}>
                          {r.name}
                        </Text>
                        <Text
                          size={100}
                          style={{
                            color: "var(--colorNeutralForeground3)",
                            display: "block",
                          }}
                        >
                          {r.details}
                        </Text>
                      </div>
                      <Badge color="success" appearance="filled">
                        已检测到
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className={styles.rootItem}>
                    <div>
                      <Text size={200}>Root 补丁指纹</Text>
                      <Text
                        size={100}
                        style={{ color: "var(--colorNeutralForeground3)", display: "block" }}
                      >
                        Ramdisk 中未检索到 Magisk / KSU / APatch 标识，推测为纯净原生镜像
                      </Text>
                    </div>
                    <Badge color="informative" appearance="outline">
                      原生未修补
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* AVB / Vbmeta 验证信息 */}
            {inspection.imageType === "vbmeta" || inspection.avbVersion ? (
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                  <ShieldDismiss24Regular />
                  <span>AVB 2.0 / Vbmeta 校验状态</span>
                </div>
                <div className={styles.gridTwoCol}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>DM-Verity 状态</span>
                    <span className={styles.metaValue}>
                      {inspection.isVerityDisabled ? (
                        <Badge color="warning" appearance="tint">
                          已禁用 (Disabled)
                        </Badge>
                      ) : (
                        <Badge color="success" appearance="tint">
                          已启用 (Enabled)
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>AVB 签名验证</span>
                    <span className={styles.metaValue}>
                      {inspection.isVerificationDisabled ? (
                        <Badge color="warning" appearance="tint">
                          已禁用 (Disabled)
                        </Badge>
                      ) : (
                        <Badge color="success" appearance="tint">
                          已启用 (Enabled)
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Rollback Index 防回滚</span>
                    <span className={styles.metaValue}>{inspection.rollbackIndex ?? 0}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>AVB 版本</span>
                    <span className={styles.metaValue}>{inspection.avbVersion || "2.0"}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* CMDLINE 启动参数 */}
            {inspection.cmdline && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionTitle}>
                  <Code24Regular />
                  <span>内核 CMDLINE 启动参数</span>
                </div>
                <div className={styles.cmdlineBox}>{inspection.cmdline}</div>
              </div>
            )}
          </div>

          {/* Right: AI 专家诊断与互动问答 */}
          <div className={styles.rightColumn}>
            <div className={styles.aiHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <BrainCircuit24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <Text weight="bold" size={300}>
                  AI 智能镜像画像与专家分析
                </Text>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <Tooltip content="复制诊断报告" relationship="label">
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={isCopied ? <Checkmark24Regular /> : <Copy24Regular />}
                    onClick={handleCopyReport}
                  />
                </Tooltip>
                <Tooltip content="重新进行 AI 分析" relationship="label">
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowReset24Regular />}
                    onClick={() => runInitialAIAnalysis(inspection)}
                  />
                </Tooltip>
              </div>
            </div>

            {/* 消息对话流 */}
            <div className={styles.chatHistory}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user" ? styles.userMessageBubble : styles.aiMessageBubble
                  }
                >
                  {m.content}
                </div>
              ))}
              {isLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px" }}>
                  <Spinner size="tiny" />
                  <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                    AI 专家正在深度审阅解包数据与启动配置...
                  </Text>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 追问输入框 */}
            <div className={styles.inputArea}>
              <Input
                style={{ flex: 1 }}
                placeholder="对该镜像的内容/兼容性有疑问？在此向 AI 提问..."
                value={inputText}
                onChange={(_, d) => setInputText(d.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                appearance="primary"
                icon={<Send24Regular />}
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            已完成 {inspection.fileName} 的二进制逆向解包与签名校验
          </Text>
          <div style={{ display: "flex", gap: "8px" }}>
            {onFlashToPartition && (
              <Button
                appearance="primary"
                icon={<Flash24Regular />}
                onClick={() => {
                  onOpenChange(false);
                  const target = inspection.imageType === "boot"
                    ? "boot"
                    : inspection.imageType === "vbmeta"
                    ? "vbmeta"
                    : inspection.imageType === "vendor_boot"
                    ? "vendor_boot"
                    : "boot";
                  onFlashToPartition(target);
                }}
              >
                直接准备刷入此镜像
              </Button>
            )}
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </div>
      </DialogSurface>
    </Dialog>
  );
};
