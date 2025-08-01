import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Badge,
  Select,
  Field,
  Input,
  Switch,
  Textarea,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import {
  Document24Regular,
  Delete24Regular,
  ArrowDownload24Regular,
  Filter24Regular,
  ArrowClockwise24Regular,
  Settings24Regular,
  Info24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { logService, LogEntry, LogLevel } from "../../services/logService";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    height: "100%",
    overflow: "auto",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  card: {
    height: "fit-content",
  },
  cardContent: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  settingInfo: {
    flex: 1,
  },
  logViewer: {
    gridColumn: "1 / -1",
    height: "400px",
  },
  logContent: {
    height: "300px",
    overflow: "auto",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    padding: "12px",
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  logEntry: {
    marginBottom: "4px",
    padding: "2px 0",
    borderBottom: "1px solid var(--colorNeutralStroke3)",
  },
  logTimestamp: {
    color: "var(--colorNeutralForeground3)",
    marginRight: "8px",
  },
  logLevel: {
    marginRight: "8px",
    fontWeight: "bold",
  },
  logError: {
    color: "var(--colorPaletteRedForeground1)",
  },
  logWarning: {
    color: "var(--colorPaletteYellowForeground1)",
  },
  logInfo: {
    color: "var(--colorPaletteBlueForeground1)",
  },
  logDebug: {
    color: "var(--colorNeutralForeground2)",
  },
  filterRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    marginBottom: "16px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
});



const LogsPanel: React.FC = () => {
  const styles = useStyles();
  const { config, updateConfig } = useAppStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [maxLogEntries, setMaxLogEntries] = useState<number>(1000);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [logStats, setLogStats] = useState(logService.getLogStats());

  // 订阅真实日志数据
  useEffect(() => {
    const unsubscribe = logService.subscribe((newLogs) => {
      setLogs(newLogs);
      setLogStats(logService.getLogStats());
    });

    // 设置最大日志条数
    logService.setMaxLogs(maxLogEntries);

    return unsubscribe;
  }, [maxLogEntries]);

  // 过滤日志
  useEffect(() => {
    const filter = {
      level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
      search: searchFilter || undefined,
    };

    const filtered = logService.getLogs(filter);
    setFilteredLogs(filtered);
  }, [logs, levelFilter, searchFilter]);

  const handleClearLogs = () => {
    logService.clearLogs();
  };

  const handleExportLogs = () => {
    const filter = {
      level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
      search: searchFilter || undefined,
    };

    const logText = logService.exportLogs(filter);
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hout-logs-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefreshLogs = () => {
    // 强制刷新日志显示
    logService.info("手动刷新日志", "LogsPanel");
  };

  const handleMaxLogEntriesChange = (value: number) => {
    setMaxLogEntries(value);
    logService.setMaxLogs(value);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <ErrorCircle24Regular className={styles.logError} />;
      case "warning":
        return <Warning24Regular className={styles.logWarning} />;
      case "info":
        return <Info24Regular className={styles.logInfo} />;
      case "debug":
        return <CheckmarkCircle24Regular className={styles.logDebug} />;
      default:
        return null;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      error: "danger" as const,
      warning: "warning" as const,
      info: "brand" as const,
      debug: "subtle" as const,
    };
    return (
      <Badge 
        appearance="filled" 
        color={colors[level as keyof typeof colors] || "subtle"}
        size="small"
      >
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 日志查看器 */}
        <Card className={`${styles.card} ${styles.logViewer}`}>
          <CardHeader
            image={<Document24Regular />}
            header={<Text weight="semibold">应用日志</Text>}
            description={<Text size={200}>实时查看应用运行日志</Text>}
            action={
              <div className={styles.actionButtons}>
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<ArrowClockwise24Regular />}
                  onClick={handleRefreshLogs}
                >
                  刷新
                </Button>
                <Button 
                  appearance="secondary" 
                  size="small"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleExportLogs}
                >
                  导出
                </Button>
                <Button 
                  appearance="secondary" 
                  size="small"
                  icon={<Delete24Regular />}
                  onClick={handleClearLogs}
                >
                  清空
                </Button>
              </div>
            }
          />

          <div className={styles.cardContent}>
            {/* 过滤器 */}
            <div className={styles.filterRow}>
              <Field label="日志级别:">
                <Select
                  value={levelFilter}
                  onChange={(_, data) => setLevelFilter(data.value)}
                >
                  <option value="all">全部</option>
                  <option value="error">错误</option>
                  <option value="warning">警告</option>
                  <option value="info">信息</option>
                  <option value="debug">调试</option>
                </Select>
              </Field>

              <Field label="搜索:">
                <Input
                  placeholder="搜索日志内容..."
                  value={searchFilter}
                  onChange={(_, data) => setSearchFilter(data.value)}
                />
              </Field>
            </div>

            {/* 日志内容 */}
            <div className={styles.logContent}>
              {filteredLogs.length === 0 ? (
                <Text style={{ color: "var(--colorNeutralForeground3)" }}>
                  暂无日志记录
                </Text>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className={styles.logEntry}>
                    <span className={styles.logTimestamp}>
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={styles.logLevel}>
                      {getLevelBadge(log.level)}
                    </span>
                    {log.source && (
                      <span style={{ color: "var(--colorNeutralForeground2)", marginRight: "8px" }}>
                        [{log.source}]
                      </span>
                    )}
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>

            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
              显示 {filteredLogs.length} / {logs.length} 条日志记录
            </Text>
          </div>
        </Card>

        {/* 日志设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Settings24Regular />}
            header={<Text weight="semibold">日志设置</Text>}
            description={<Text size={200}>配置日志记录选项</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="日志级别:">
              <Select
                value={config.logLevel}
                onChange={(_, data) => updateConfig({ logLevel: data.value as "debug" | "info" | "warn" | "error" })}
              >
                <option value="error">错误 (Error)</option>
                <option value="warn">警告 (Warning)</option>
                <option value="info">信息 (Info)</option>
                <option value="debug">调试 (Debug)</option>
              </Select>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                调试级别会显示更多详细信息，但可能影响性能
              </Text>
            </Field>

            <Field label="最大日志条数:">
              <Input
                type="number"
                value={maxLogEntries.toString()}
                onChange={(_, data) => handleMaxLogEntriesChange(parseInt(data.value) || 1000)}
                min={100}
                max={10000}
                step={100}
              />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                超过此数量的旧日志将被自动删除
              </Text>
            </Field>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">自动滚动</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  新日志出现时自动滚动到底部
                </Text>
              </div>
              <Switch
                checked={autoScroll}
                onChange={(_, data) => setAutoScroll(data.checked === true)}
              />
            </div>
          </div>
        </Card>

        {/* 日志统计 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Filter24Regular />}
            header={<Text weight="semibold">日志统计</Text>}
            description={<Text size={200}>当前日志记录统计信息</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <Text>错误日志:</Text>
              <Badge appearance="filled" color="danger">
                {logStats.error}
              </Badge>
            </div>

            <div className={styles.settingRow}>
              <Text>警告日志:</Text>
              <Badge appearance="filled" color="warning">
                {logStats.warning}
              </Badge>
            </div>

            <div className={styles.settingRow}>
              <Text>信息日志:</Text>
              <Badge appearance="filled" color="brand">
                {logStats.info}
              </Badge>
            </div>

            <div className={styles.settingRow}>
              <Text>调试日志:</Text>
              <Badge appearance="outline" color="subtle">
                {logStats.debug}
              </Badge>
            </div>

            <div className={styles.settingRow}>
              <Text weight="semibold">总计:</Text>
              <Badge appearance="filled" color="brand">
                {logStats.total}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LogsPanel;
