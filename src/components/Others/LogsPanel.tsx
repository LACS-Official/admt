import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
  Button,
  Select,
  Input,
  Tooltip,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  ArrowDownload24Regular,
  ArrowClockwise24Regular,
  Warning20Regular,
  ErrorCircle20Regular,
  Info20Regular,
  Bug20Regular,
  Copy20Regular,
  Checkmark20Regular,
  Search20Regular,
  Dismiss20Regular,
  Pin20Regular,
  PinOff20Regular,
  ChevronRight16Regular,
  ChevronDown16Regular,
  DocumentBulletList24Regular,
  TextAlignLeft20Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { StructuredLogEntry, LogLevel, LogCategory, LogFilter } from "../../services/logTypes";
import logService from "../../services/logService";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    padding: "16px 20px",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  // Top Header Area
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: "12px",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.01em",
  },
  liveIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 8px",
    borderRadius: "9999px",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    fontSize: "11px",
    fontWeight: "500",
    color: "#059669",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.25)",
  },
  countBadge: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    padding: "2px 8px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground3)",
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actionBtn: {
    minWidth: "32px",
    height: "32px",
    padding: "0 8px",
    borderRadius: "8px",
    color: "var(--colorNeutralForeground2)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  actionBtnActive: {
    backgroundColor: "rgba(0, 113, 227, 0.12)",
    color: "#0071e3",
    "&:hover": {
      backgroundColor: "rgba(0, 113, 227, 0.18)",
      color: "#0071e3",
    },
  },

  // Control & Filter Bar
  filterCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  levelTabs: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "3px",
    borderRadius: "8px",
  },
  levelTabItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    userSelect: "none",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.15s ease",
    "&:hover": {
      color: "var(--colorNeutralForeground1)",
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  levelTabItemActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  },
  levelTabCount: {
    fontSize: "11px",
    opacity: 0.75,
    padding: "0 4px",
    borderRadius: "4px",
  },
  levelTabCountAlert: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    color: "#dc2626",
    fontWeight: "600",
    opacity: 1,
  },
  levelTabCountWarn: {
    backgroundColor: "rgba(217, 119, 6, 0.15)",
    color: "#d97706",
    fontWeight: "600",
    opacity: 1,
  },
  filterInputs: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: "260px",
    justifyContent: "flex-end",
  },
  searchInput: {
    flex: "1 1 200px",
    maxWidth: "320px",
    height: "30px",
    fontSize: "12px",
    borderRadius: "8px",
  },
  categorySelect: {
    height: "30px",
    fontSize: "12px",
    minWidth: "110px",
    borderRadius: "8px",
  },
  deviceInput: {
    width: "120px",
    height: "30px",
    fontSize: "12px",
    borderRadius: "8px",
  },

  // Log Stream Container
  streamBox: {
    flex: "1 1 0",
    minHeight: 0,
    overflowY: "auto",
    overflowX: "auto",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    padding: "8px",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Cascadia Code', monospace",
    fontSize: "12px",
    lineHeight: "1.5",
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: "100%",
  },
  logRow: {
    display: "flex",
    flexDirection: "column",
    padding: "4px 8px",
    borderRadius: "6px",
    transition: "background-color 0.1s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  logRowMain: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    minWidth: "100%",
  },
  logTime: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "11px",
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
    userSelect: "text",
    lineHeight: "20px",
  },
  levelPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "0.02em",
    flexShrink: 0,
    lineHeight: "16px",
    textTransform: "uppercase",
  },
  levelPillFatal: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    color: "#dc2626",
    border: "1px solid rgba(220, 38, 38, 0.3)",
  },
  levelPillError: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
  },
  levelPillWarning: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    color: "#d97706",
  },
  levelPillInfo: {
    backgroundColor: "rgba(0, 113, 227, 0.1)",
    color: "#0071e3",
  },
  levelPillDebug: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    color: "#8b5cf6",
  },
  sourceTag: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "11px",
    fontWeight: "600",
    flexShrink: 0,
    userSelect: "text",
    lineHeight: "20px",
  },
  messageText: {
    flex: "1 1 auto",
    wordBreak: "break-word",
    color: "var(--colorNeutralForeground1)",
    userSelect: "text",
    lineHeight: "20px",
  },
  messageNoWrap: {
    whiteSpace: "pre",
    wordBreak: "normal",
  },
  highlight: {
    backgroundColor: "rgba(234, 179, 8, 0.35)",
    color: "inherit",
    borderRadius: "2px",
    padding: "0 2px",
  },
  rowActions: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginLeft: "auto",
    opacity: 0.15,
    flexShrink: 0,
    transition: "opacity 0.15s ease",
    ".logRow:hover &": {
      opacity: 1,
    },
  },
  rowCopyBtn: {
    padding: "2px 4px",
    height: "20px",
    minWidth: "20px",
    borderRadius: "4px",
    fontSize: "11px",
    cursor: "pointer",
    color: "var(--colorNeutralForeground3)",
    "&:hover": {
      color: "var(--colorNeutralForeground1)",
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  contextToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: "1px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground2)",
    cursor: "pointer",
    border: "1px solid var(--colorNeutralStroke3)",
    lineHeight: "16px",
    marginTop: "2px",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  contextBox: {
    marginTop: "4px",
    marginLeft: "24px",
    padding: "8px 12px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke3)",
    fontSize: "11px",
    color: "var(--colorNeutralForeground2)",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },

  // Empty state
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    minHeight: "260px",
    gap: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  emptyIcon: {
    fontSize: "40px",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
  },
  emptySubtitle: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
});

export interface LogsPanelProps {
  onClose?: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ onClose }) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [deviceFilter, setDeviceFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});
  const [isCopiedAll, setIsCopiedAll] = useState<boolean>(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  const logContentRef = useRef<HTMLDivElement>(null);

  // Subscribe to log service
  useEffect(() => {
    const unsubscribe = logService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    logService.info('LogsPanel 视图已加载', 'LogsPanel', { category: 'system' });

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute log counts by level for segmented pills
  const counts = useMemo(() => {
    const res = {
      all: logs.length,
      info: 0,
      warning: 0,
      error: 0,
      fatal: 0,
      debug: 0,
    };
    for (const log of logs) {
      if (log.level in res) {
        res[log.level as keyof typeof res]++;
      }
    }
    return res;
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    const searchLower = searchFilter.trim().toLowerCase();
    const deviceLower = deviceFilter.trim().toLowerCase();

    return logs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) return false;
      if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
      if (deviceLower && (!log.context?.deviceId || !String(log.context.deviceId).toLowerCase().includes(deviceLower))) {
        return false;
      }
      if (searchLower) {
        const msgMatch = log.message.toLowerCase().includes(searchLower);
        const srcMatch = log.source.toLowerCase().includes(searchLower);
        const catMatch = log.category.toLowerCase().includes(searchLower);
        const ctxMatch = log.context ? JSON.stringify(log.context).toLowerCase().includes(searchLower) : false;
        if (!msgMatch && !srcMatch && !catMatch && !ctxMatch) return false;
      }
      return true;
    });
  }, [logs, levelFilter, categoryFilter, searchFilter, deviceFilter]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // Actions
  const handleClearLogs = useCallback(() => {
    logService.clearLogs();
  }, []);

  const handleExportLogs = useCallback(() => {
    try {
      const filter: LogFilter = {
        level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
        category: categoryFilter !== "all" ? (categoryFilter as LogCategory) : undefined,
        search: searchFilter || undefined,
        deviceId: deviceFilter || undefined,
      };

      const logContent = logService.exportLogs(filter);
      const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admt-log-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.log`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("导出日志失败:", error);
    }
  }, [levelFilter, categoryFilter, searchFilter, deviceFilter]);

  const handleCopyAll = useCallback(async () => {
    if (filteredLogs.length === 0) return;
    const content = filteredLogs.map((log) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const ctx = log.context && Object.keys(log.context).length > 0 ? ` ${JSON.stringify(log.context)}` : "";
      return `[${time}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${ctx}`;
    }).join('\n');

    try {
      await navigator.clipboard.writeText(content);
      setIsCopiedAll(true);
      setTimeout(() => setIsCopiedAll(false), 2000);
    } catch (e) {
      console.error("复制日志失败:", e);
    }
  }, [filteredLogs]);

  const handleCopyRow = useCallback(async (log: StructuredLogEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const time = new Date(log.timestamp).toLocaleTimeString();
    const ctx = log.context && Object.keys(log.context).length > 0 ? ` ${JSON.stringify(log.context)}` : "";
    const text = `[${time}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${ctx}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedRowId(log.id);
      setTimeout(() => setCopiedRowId(null), 1500);
    } catch (err) {
      console.error("复制行失败:", err);
    }
  }, []);

  const toggleContext = useCallback((id: string) => {
    setExpandedContexts((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Highlight search keywords
  const renderHighlightedMessage = (text: string) => {
    if (!searchFilter.trim()) return text;
    const query = searchFilter.trim();
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className={styles.highlight}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getLevelPillClass = (level: LogLevel) => {
    switch (level) {
      case "fatal":
        return styles.levelPillFatal;
      case "error":
        return styles.levelPillError;
      case "warning":
        return styles.levelPillWarning;
      case "info":
        return styles.levelPillInfo;
      case "debug":
        return styles.levelPillDebug;
      default:
        return styles.levelPillInfo;
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部标题栏与快捷工具 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>{t('logs_panel.title', '运行日志')}</Text>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span>实时监听</span>
          </div>
          <span className={styles.countBadge}>
            {filteredLogs.length === logs.length
              ? `共 ${logs.length} 条`
              : `筛选 ${filteredLogs.length} / 共 ${logs.length} 条`}
          </span>
        </div>

        <div className={styles.toolbarActions}>
          <Tooltip content={autoScroll ? "已启用自动滚动" : "已暂停自动滚动"} relationship="label">
            <Button
              appearance="subtle"
              icon={autoScroll ? <Pin20Regular /> : <PinOff20Regular />}
              className={mergeClasses(styles.actionBtn, autoScroll && styles.actionBtnActive)}
              onClick={() => setAutoScroll(!autoScroll)}
            />
          </Tooltip>

          <Tooltip content={wrapLines ? "已开启自动换行" : "已开启单行横向滚动"} relationship="label">
            <Button
              appearance="subtle"
              icon={<TextAlignLeft20Regular />}
              className={mergeClasses(styles.actionBtn, wrapLines && styles.actionBtnActive)}
              onClick={() => setWrapLines(!wrapLines)}
            />
          </Tooltip>

          <Tooltip content={isCopiedAll ? "已复制所有日志" : "复制当前筛选日志"} relationship="label">
            <Button
              appearance="subtle"
              icon={isCopiedAll ? <Checkmark20Regular style={{ color: "#10b981" }} /> : <Copy20Regular />}
              className={styles.actionBtn}
              onClick={handleCopyAll}
              disabled={filteredLogs.length === 0}
            />
          </Tooltip>

          <Tooltip content="导出日志为文件" relationship="label">
            <Button
              appearance="subtle"
              icon={<ArrowDownload24Regular />}
              className={styles.actionBtn}
              onClick={handleExportLogs}
              disabled={filteredLogs.length === 0}
            />
          </Tooltip>

          <Tooltip content="清空当前日志" relationship="label">
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              className={styles.actionBtn}
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            />
          </Tooltip>

          {onClose && (
            <Tooltip content="关闭日志" relationship="label">
              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                className={styles.actionBtn}
                onClick={onClose}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* 过滤与搜索控制卡片 */}
      <div className={styles.filterCard}>
        {/* 日志级别分段选择 */}
        <div className={styles.levelTabs}>
          <div
            className={mergeClasses(styles.levelTabItem, levelFilter === "all" && styles.levelTabItemActive)}
            onClick={() => setLevelFilter("all")}
          >
            <span>全部</span>
            <span className={styles.levelTabCount}>{counts.all}</span>
          </div>

          <div
            className={mergeClasses(styles.levelTabItem, levelFilter === "info" && styles.levelTabItemActive)}
            onClick={() => setLevelFilter("info")}
          >
            <span>信息</span>
            <span className={styles.levelTabCount}>{counts.info}</span>
          </div>

          <div
            className={mergeClasses(styles.levelTabItem, levelFilter === "warning" && styles.levelTabItemActive)}
            onClick={() => setLevelFilter("warning")}
          >
            <span>警告</span>
            <span className={mergeClasses(styles.levelTabCount, counts.warning > 0 && styles.levelTabCountWarn)}>
              {counts.warning}
            </span>
          </div>

          <div
            className={mergeClasses(styles.levelTabItem, levelFilter === "error" && styles.levelTabItemActive)}
            onClick={() => setLevelFilter("error")}
          >
            <span>错误</span>
            <span className={mergeClasses(styles.levelTabCount, counts.error > 0 && styles.levelTabCountAlert)}>
              {counts.error}
            </span>
          </div>

          <div
            className={mergeClasses(styles.levelTabItem, levelFilter === "debug" && styles.levelTabItemActive)}
            onClick={() => setLevelFilter("debug")}
          >
            <span>调试</span>
            <span className={styles.levelTabCount}>{counts.debug}</span>
          </div>
        </div>

        {/* 筛选输入区 */}
        <div className={styles.filterInputs}>
          <Input
            placeholder="搜索日志内容 / 来源..."
            value={searchFilter}
            onChange={(_, data) => setSearchFilter(data.value)}
            contentBefore={<Search20Regular />}
            contentAfter={
              searchFilter ? (
                <Button
                  appearance="transparent"
                  size="small"
                  icon={<Dismiss20Regular />}
                  onClick={() => setSearchFilter("")}
                  style={{ minWidth: "20px", padding: 0 }}
                />
              ) : undefined
            }
            className={styles.searchInput}
          />

          <Select
            value={categoryFilter}
            onChange={(_, data) => setCategoryFilter(data.value)}
            className={styles.categorySelect}
          >
            <option value="all">全部分类</option>
            <option value="system">系统</option>
            <option value="device">设备</option>
            <option value="firmware">固件</option>
            <option value="user">用户</option>
            <option value="network">网络</option>
            <option value="security">安全</option>
            <option value="ai">AI</option>
          </Select>

          <Input
            placeholder="设备筛选..."
            value={deviceFilter}
            onChange={(_, data) => setDeviceFilter(data.value)}
            className={styles.deviceInput}
          />
        </div>
      </div>

      {/* 日志流主区域 */}
      <div className={styles.streamBox} ref={logContentRef}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyContainer}>
            <DocumentBulletList24Regular className={styles.emptyIcon} />
            <span className={styles.emptyTitle}>暂无日志记录</span>
            <span className={styles.emptySubtitle}>
              {logs.length === 0 ? "系统运行事件将实时输出至此" : "没有符合当前筛选条件的日志项"}
            </span>
          </div>
        ) : (
          <div className={styles.logList}>
            {filteredLogs.map((log) => {
              const hasContext = log.context && Object.keys(log.context).length > 0;
              const isExpanded = !!expandedContexts[log.id];
              const isRowCopied = copiedRowId === log.id;

              return (
                <div key={log.id} className={mergeClasses(styles.logRow, "logRow")}>
                  <div className={styles.logRowMain}>
                    <span className={styles.logTime}>
                      {new Date(log.timestamp).toLocaleTimeString("zh-CN", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>

                    <span className={mergeClasses(styles.levelPill, getLevelPillClass(log.level))}>
                      {log.level}
                    </span>

                    <span className={styles.sourceTag}>[{log.source}]</span>

                    <span className={mergeClasses(styles.messageText, !wrapLines && styles.messageNoWrap)}>
                      {renderHighlightedMessage(log.message)}
                    </span>

                    {hasContext && (
                      <button
                        type="button"
                        className={styles.contextToggleBtn}
                        onClick={() => toggleContext(log.id)}
                        title="查看详细上下文数据"
                      >
                        {isExpanded ? <ChevronDown16Regular /> : <ChevronRight16Regular />}
                        <span>JSON</span>
                      </button>
                    )}

                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.rowCopyBtn}
                        onClick={(e) => handleCopyRow(log, e)}
                        title="复制单行"
                      >
                        {isRowCopied ? <Checkmark20Regular style={{ color: "#10b981" }} /> : <Copy20Regular />}
                      </button>
                    </div>
                  </div>

                  {hasContext && isExpanded && (
                    <div className={styles.contextBox}>
                      {JSON.stringify(log.context, null, 2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
