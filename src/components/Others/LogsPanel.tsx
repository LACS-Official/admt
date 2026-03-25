import React, { useState, useEffect, useRef } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
  Card,
  Button,
  Badge,
  Select,
  Field,
  Input,
  Switch,
  ProgressBar,
} from "@fluentui/react-components";
import {
  Document24Regular,
  Delete24Regular,
  ArrowDownload24Regular,
  ArrowClockwise24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Bug24Regular,
  Sparkle24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { emit } from "@tauri-apps/api/event";
import { windowService } from "../../services/windowService";
import { useAppStore } from "../../stores/appStore";
import { StructuredLogEntry, LogLevel, LogCategory, LogFilter } from "../../services/logTypes";

import logService from "../../services/logService";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  controls: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  logContent: {
    height: "400px",
    overflow: "auto",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    padding: "12px",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  logEntry: {
    marginBottom: "6px",
    padding: "8px",
    borderRadius: "4px",
    borderLeft: "3px solid transparent",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  logEntryFatal: {
    backgroundColor: "rgba(139, 0, 0, 0.05)",
  },
  logEntryError: {
    backgroundColor: "rgba(220, 20, 60, 0.05)",
  },
  logEntryWarning: {
    backgroundColor: "rgba(255, 140, 0, 0.05)",
  },
  logEntryInfo: {
    backgroundColor: "rgba(65, 105, 225, 0.05)",
  },
  logEntryDebug: {
    backgroundColor: "rgba(128, 128, 128, 0.05)",
  },
  logHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  logTimestamp: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "11px",
    minWidth: "80px",
  },
  logLevel: {
    minWidth: "60px",
  },
  logSource: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "11px",
    minWidth: "100px",
    fontWeight: "500",
  },
  logMessage: {
    flex: 1,
    wordBreak: "break-word",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "var(--colorNeutralForeground3)",
  },
});



const LogsPanel: React.FC = () => {
  const styles = useStyles();
  // 保持状态定义用于UI展示
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<StructuredLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [deviceFilter, setDeviceFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const logContentRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { config } = useAppStore();

  // 订阅日志服务
  useEffect(() => {
    // 订阅日志更新
    const unsubscribe = logService.subscribe((updatedLogs) => {
        // 由于日志量可能很大，这里可以做一些优化，比如只取最后N条
        // logService已经在内部限制了maxLogs，所以这里直接设置即可
        setLogs(updatedLogs);
    });

    logService.info('LogsPanel组件已挂载', 'LogsPanel', { category: 'system' });
    
    return () => {
      unsubscribe();
      // 不要在卸载时记录日志，因为可能导致更新已卸载的组件（如果logService同步回调）
    };
  }, []);

  // 过滤日志 - 当logs或过滤条件变化时执行
  useEffect(() => {
    const applyFilters = () => {
      setIsLoading(true);
      try {
        const filter: LogFilter = {
          level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
          category: categoryFilter !== "all" ? (categoryFilter as LogCategory) : undefined,
          search: searchFilter || undefined,
          deviceId: deviceFilter || undefined,
        };

        // 使用 logService 的过滤逻辑或本地过滤
        // 这里使用本地过滤，因为 logs 已经是内存中的全量数据
        const filtered = logs.filter(log => {
          // 级别过滤
          if (filter.level && log.level !== filter.level) return false;
          
          // 分类过滤
          if (filter.category && log.category !== filter.category) return false;
          
          // 设备过滤
          if (filter.deviceId && log.context?.deviceId !== filter.deviceId) return false;
          
          // 搜索过滤
          if (filter.search) {
            const searchLower = filter.search!.toLowerCase();
            const messageMatch = log.message.toLowerCase().includes(searchLower);
            const sourceMatch = log.source.toLowerCase().includes(searchLower);
            const contextMatch = JSON.stringify(log.context).toLowerCase().includes(searchLower);
            
            if (!messageMatch && !sourceMatch && !contextMatch) return false;
          }
          
          return true;
        });
        
        setFilteredLogs(filtered);
      } catch (error) {
        console.error("过滤日志失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 使用 debounce 或 requestAnimationFrame 优化性能
    const timer = setTimeout(applyFilters, 100);
    return () => clearTimeout(timer);

  }, [logs, levelFilter, categoryFilter, searchFilter, deviceFilter]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleClearLogs = async () => {
    try {
      logService.clearLogs();
      // logs状态会在subscribe回调中更新
    } catch (error) {
      console.error("清空日志失败:", error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const filter: LogFilter = {
        level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
        category: categoryFilter !== "all" ? (categoryFilter as LogCategory) : undefined,
        search: searchFilter || undefined,
        deviceId: deviceFilter || undefined,
      };

      const logContent = logService.exportLogs(filter);
      
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admt-logs-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logService.info("导出日志", "LogsPanel", { category: 'user', filter });
    } catch (error) {
      logService.error("导出日志失败", "LogsPanel", { error: String(error) });
    }
  };
  const handleRefreshLogs = async () => {
     logService.info("手动刷新日志视图", "LogsPanel", { category: 'user' });
  };

  const handleAIExplainLogs = async () => {
    if (filteredLogs.length === 0) return;

    // 格式化最近的日志条目
    const recentLogs = filteredLogs.slice(-20).map(log => {
      return `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`;
    }).join('\n');

    const prompt = `请分析并解释以下系统日志：\n\n\`\`\`\n${recentLogs}\n\`\`\``;
    
    // 发送同步事件
    await emit("ai-prompt-sync", { prompt });
    
    // 打开并聚焦 AI 窗口
    await windowService.openAIChatWindow(config.theme === 'dark');
  };


  const getLevelBadge = (level: LogLevel) => {
    const config = {
      fatal: { color: "danger" as const, icon: <ErrorCircle24Regular /> },
      error: { color: "danger" as const, icon: <ErrorCircle24Regular /> },
      warning: { color: "warning" as const, icon: <Warning24Regular /> },
      info: { color: "brand" as const, icon: <Info24Regular /> },
      debug: { color: "subtle" as const, icon: <Bug24Regular /> },
    };
    
    const levelConfig = config[level] || config.debug;
    
    return (
      <Badge 
        appearance="filled" 
        color={levelConfig.color}
        size="small"
        icon={levelConfig.icon}
      >
        {level.toUpperCase()}
      </Badge>
    );
  };

  const renderLogEntry = (log: StructuredLogEntry) => {
    const entryClass = `logEntry${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`;
    
    return (
      <div 
        key={log.id} 
        className={mergeClasses(styles.logEntry, styles[entryClass as keyof typeof styles])}
      >
        <div className={styles.logHeader}>
          <span className={styles.logTimestamp}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className={styles.logLevel}>
            {getLevelBadge(log.level)}
          </span>
          <span className={styles.logSource}>
            [{log.source}]
          </span>
          <span className={styles.logMessage}>
            {log.message}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 头部控制栏 */}
      <div className={styles.header}>
        <Text size={400} weight="semibold">{t('logs_panel.title')}</Text>
        <div className={styles.controls}>
          <Button
            appearance="subtle"
            icon={<Sparkle24Regular />}
            onClick={handleAIExplainLogs}
            disabled={filteredLogs.length === 0}
            title={t('logs_panel.ai_explain_tooltip')}
          >
            {t('logs_panel.ai_explain')}
          </Button>
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            显示 {filteredLogs.length} / {logs.length} 条日志
          </Text>
        </div>
      </div>

      {/* 过滤器 */}
      <div className={styles.filterRow}>
        <Field label="日志级别:">
          <Select
            value={levelFilter}
            onChange={(_, data) => setLevelFilter(data.value)}
          >
            <option value="all">全部级别</option>
            <option value="fatal">致命错误</option>
            <option value="error">错误</option>
            <option value="warning">警告</option>
            <option value="info">信息</option>
            <option value="debug">调试</option>
          </Select>
        </Field>

        <Field label="日志分类:">
          <Select
            value={categoryFilter}
            onChange={(_, data) => setCategoryFilter(data.value)}
          >
            <option value="all">全部分类</option>
            <option value="device">设备</option>
            <option value="firmware">固件</option>
            <option value="system">系统</option>
            <option value="user">用户</option>
            <option value="network">网络</option>
            <option value="security">安全</option>
          </Select>
        </Field>

        <Field label="设备筛选:">
          <Input
            placeholder="设备ID或型号..."
            value={deviceFilter}
            onChange={(_, data) => setDeviceFilter(data.value)}
          />
        </Field>

        <Field label="内容搜索:">
          <Input
            placeholder="搜索日志内容..."
            value={searchFilter}
            onChange={(_, data) => setSearchFilter(data.value)}
          />
        </Field>
      </div>

      {/* 加载指示器 */}
      {isLoading && <ProgressBar />}

      {/* 日志内容 */}
      <Card>
        <div className={styles.logContent} ref={logContentRef}>
          {filteredLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <Document24Regular style={{ fontSize: "48px", marginBottom: "16px" }} />
              <Text>暂无符合条件的日志记录</Text>
            </div>
          ) : (
            filteredLogs.map(renderLogEntry)
          )}
        </div>
      </Card>
    </div>
  );
};

export default LogsPanel;
