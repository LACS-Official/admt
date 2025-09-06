import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
  Card,
  CardHeader,
  Button,
  Badge,
  Select,
  Field,
  Input,
  Switch,
  Dropdown,
  Option,
  Divider,
  ProgressBar,
  Tooltip,
} from "@fluentui/react-components";
import {
  Document24Regular,
  Delete24Regular,
  ArrowDownload24Regular,
  Filter24Regular,
  ArrowClockwise24Regular,
  Settings24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Bug24Regular,
  Calendar24Regular,
  DataHistogram24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { enhancedLogService } from "../../services/enhancedLogService";
import { StructuredLogEntry, LogLevel, LogCategory, LogFilter, LogStats } from "../../services/logTypes";
import { LogUtils } from "../../services/logUtils";

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
    maxWidth: "1400px",
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
    height: "500px",
  },
  logContent: {
    height: "350px",
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
    padding: "4px 8px",
    borderRadius: "4px",
    borderLeft: "3px solid transparent",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
    },
  },
  logEntryFatal: {
    borderLeftColor: "#8B0000",
    backgroundColor: "rgba(139, 0, 0, 0.05)",
  },
  logEntryError: {
    borderLeftColor: "#DC143C",
    backgroundColor: "rgba(220, 20, 60, 0.05)",
  },
  logEntryWarning: {
    borderLeftColor: "#FF8C00",
    backgroundColor: "rgba(255, 140, 0, 0.05)",
  },
  logEntryInfo: {
    borderLeftColor: "#4169E1",
    backgroundColor: "rgba(65, 105, 225, 0.05)",
  },
  logEntryDebug: {
    borderLeftColor: "#808080",
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
  logCategory: {
    fontSize: "10px",
    minWidth: "50px",
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
  logContext: {
    fontSize: "10px",
    color: "var(--colorNeutralForeground3)",
    marginTop: "2px",
    paddingLeft: "16px",
    fontStyle: "italic",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "12px",
    alignItems: "flex-end",
    marginBottom: "16px",
  },
  filterRowWide: {
    gridColumn: "1 / -1",
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
  },
  statCard: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    textAlign: "center",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  recentIndicator: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--colorPaletteGreenBackground3)",
    marginRight: "6px",
    animation: "pulse 2s infinite",
  },
  errorPattern: {
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    marginBottom: "8px",
    fontSize: "11px",
  },
  patternCount: {
    fontWeight: "bold",
    color: "var(--colorPaletteRedForeground1)",
  },
});



const LogsPanel: React.FC = () => {
  const styles = useStyles();
  const { config, updateConfig } = useAppStore();
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<StructuredLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [deviceFilter, setDeviceFilter] = useState<string>("");
  const [maxLogEntries, setMaxLogEntries] = useState<number>(2000);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [logStats, setLogStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorPatterns, setErrorPatterns] = useState<Array<{ pattern: string; count: number; lastOccurrence: string }>>([]);
  const logContentRef = useRef<HTMLDivElement>(null);

  // 订阅增强日志数据
  useEffect(() => {
    const unsubscribe = enhancedLogService.subscribe((newLogs) => {
      setLogs(newLogs);
      updateStats();
    });

    // 延迟设置保留策略，避免初始化时的循环调用
    setTimeout(() => {
      enhancedLogService.setRetentionPolicy({
        maxMemoryLogs: maxLogEntries
      });
    }, 50);

    return unsubscribe;
  }, [maxLogEntries]);

  // 更新统计信息
  const updateStats = useCallback(async () => {
    try {
      const stats = await enhancedLogService.getLogStats();
      setLogStats(stats);
      
      const allLogs = await enhancedLogService.getLogs();
      const patterns = LogUtils.findErrorPatterns(allLogs);
      setErrorPatterns(patterns.slice(0, 5)); // 只显示前5个模式
    } catch (error) {
      console.error("更新日志统计失败:", error);
    }
  }, []);

  // 过滤日志
  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true);
      try {
        const filter: LogFilter = {
          level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
          category: categoryFilter !== "all" ? (categoryFilter as LogCategory) : undefined,
          search: searchFilter || undefined,
          deviceId: deviceFilter || undefined,
        };

        const filtered = await enhancedLogService.getLogs(filter);
        setFilteredLogs(filtered);
      } catch (error) {
        console.error("过滤日志失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    applyFilters();
  }, [logs, levelFilter, categoryFilter, searchFilter, deviceFilter]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleClearLogs = async () => {
    try {
      await enhancedLogService.clearLogs();
      enhancedLogService.logUserAction("清空日志", "LogsPanel");
    } catch (error) {
      console.error("清空日志失败:", error);
    }
  };

  const handleExportLogs = async (format: 'json' | 'text' = 'text') => {
    try {
      const filter: LogFilter = {
        level: levelFilter !== "all" ? (levelFilter as LogLevel) : undefined,
        category: categoryFilter !== "all" ? (categoryFilter as LogCategory) : undefined,
        search: searchFilter || undefined,
        deviceId: deviceFilter || undefined,
      };

      const logContent = await enhancedLogService.exportLogs(filter, format);
      const mimeType = format === 'json' ? 'application/json' : 'text/plain';
      const extension = format === 'json' ? 'json' : 'txt';
      
      const blob = new Blob([logContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admt-logs-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      enhancedLogService.logUserAction(`导出日志 (${format})`, "LogsPanel", { filter });
    } catch (error) {
      console.error("导出日志失败:", error);
    }
  };

  const handleRefreshLogs = () => {
    updateStats();
    enhancedLogService.logUserAction("刷新日志", "LogsPanel");
  };

  const handleMaxLogEntriesChange = (value: number) => {
    setMaxLogEntries(value);
    enhancedLogService.setRetentionPolicy({ maxMemoryLogs: value });
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

  const getCategoryBadge = (category: LogCategory) => {
    const colors = {
      device: "success" as const,
      firmware: "important" as const,
      system: "brand" as const,
      user: "informative" as const,
      network: "warning" as const,
      security: "danger" as const,
    };
    
    return (
      <Badge 
        appearance="outline" 
        color={colors[category] || "subtle"}
        size="small"
      >
        {LogUtils.getCategoryIcon(category)} {category.toUpperCase()}
      </Badge>
    );
  };

  const renderLogEntry = (log: StructuredLogEntry) => {
    const isRecent = LogUtils.isRecentLog(log.timestamp, 5);
    const entryClass = `logEntry${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`;
    
    return (
      <div key={log.id} className={mergeClasses(styles.logEntry, styles[entryClass as keyof typeof styles])}>
        <div className={styles.logHeader}>
          {isRecent && <span className={styles.recentIndicator} />}
          <span className={styles.logTimestamp}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className={styles.logLevel}>
            {getLevelBadge(log.level)}
          </span>
          <span className={styles.logCategory}>
            {getCategoryBadge(log.category)}
          </span>
          <span className={styles.logSource}>
            [{log.source}]
          </span>
          <span className={styles.logMessage}>
            {log.message}
          </span>
        </div>
        {Object.keys(log.context).length > 1 && ( // 排除sessionId
          <div className={styles.logContext}>
            {Object.entries(log.context)
              .filter(([key]) => key !== 'sessionId')
              .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
              .join(' | ')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 日志查看器 */}
        <Card className={mergeClasses(styles.card, styles.logViewer)}>
          <CardHeader
            image={<Document24Regular />}
            header={<Text weight="semibold">日志系统</Text>}
            description={<Text size={200}>实时查看结构化应用日志，支持设备状态和固件刷写追踪</Text>}
            action={
              <div className={styles.actionButtons}>
                <Button
                  appearance="secondary"
                  size="small"
                  icon={<ArrowClockwise24Regular />}
                  onClick={handleRefreshLogs}
                  disabled={isLoading}
                >
                  刷新
                </Button>
                <Button 
                  appearance="secondary" 
                  size="small"
                  icon={<ArrowDownload24Regular />}
                  onClick={() => handleExportLogs('text')}
                >
                  导出文本
                </Button>
                <Button 
                  appearance="secondary" 
                  size="small"
                  icon={<ArrowDownload24Regular />}
                  onClick={() => handleExportLogs('json')}
                >
                  导出JSON
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
            {/* 高级过滤器 */}
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
                  <option value="device">📱 设备</option>
                  <option value="firmware">💾 固件</option>
                  <option value="system">⚙️ 系统</option>
                  <option value="user">👤 用户</option>
                  <option value="network">🌐 网络</option>
                  <option value="security">🔒 安全</option>
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
            {isLoading && (
              <ProgressBar />
            )}

            {/* 日志内容 */}
            <div className={styles.logContent} ref={logContentRef}>
              {filteredLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--colorNeutralForeground3)" }}>
                  <Document24Regular style={{ fontSize: "48px", marginBottom: "16px" }} />
                  <Text>暂无符合条件的日志记录</Text>
                </div>
              ) : (
                filteredLogs.map(renderLogEntry)
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                显示 {filteredLogs.length} / {logs.length} 条日志记录
              </Text>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text size={200}>自动滚动:</Text>
                <Switch
                  checked={autoScroll}
                  onChange={(_, data) => setAutoScroll(data.checked === true)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 增强统计面板 */}
        <Card className={styles.card}>
          <CardHeader
            image={<DataHistogram24Regular />}
            header={<Text weight="semibold">日志统计</Text>}
            description={<Text size={200}>实时日志统计和错误模式分析</Text>}
          />

          <div className={styles.cardContent}>
            {logStats ? (
              <>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: "#8B0000" }}>
                      {logStats.fatal}
                    </div>
                    <div className={styles.statLabel}>致命错误</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: "#DC143C" }}>
                      {logStats.error}
                    </div>
                    <div className={styles.statLabel}>错误</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: "#FF8C00" }}>
                      {logStats.warning}
                    </div>
                    <div className={styles.statLabel}>警告</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: "#4169E1" }}>
                      {logStats.info}
                    </div>
                    <div className={styles.statLabel}>信息</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: "#808080" }}>
                      {logStats.debug}
                    </div>
                    <div className={styles.statLabel}>调试</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: "var(--colorBrandForeground1)" }}>
                      {logStats.total}
                    </div>
                    <div className={styles.statLabel}>总计</div>
                  </div>
                </div>

                <Divider />

                <Text weight="semibold" style={{ marginBottom: "8px" }}>分类统计</Text>
                <div className={styles.statsGrid}>
                  {Object.entries(logStats.byCategory).map(([category, count]) => (
                    <div key={category} className={styles.settingRow}>
                      <Text>{LogUtils.getCategoryIcon(category as LogCategory)} {category}:</Text>
                      <Badge appearance="outline" color="brand">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>

                {logStats.recentErrors > 0 && (
                  <>
                    <Divider />
                    <div className={styles.settingRow}>
                      <Text weight="semibold" style={{ color: "#DC143C" }}>
                        ⚠️ 近1小时错误:
                      </Text>
                      <Badge appearance="filled" color="danger">
                        {logStats.recentErrors}
                      </Badge>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Text>加载统计信息中...</Text>
            )}
          </div>
        </Card>

        {/* 错误模式分析 */}
        {errorPatterns.length > 0 && (
          <Card className={styles.card}>
            <CardHeader
              image={<Warning24Regular />}
              header={<Text weight="semibold">错误模式分析</Text>}
              description={<Text size={200}>常见错误模式和发生频率</Text>}
            />

            <div className={styles.cardContent}>
              {errorPatterns.map((pattern, index) => (
                <div key={index} className={styles.errorPattern}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text size={200} style={{ flex: 1, wordBreak: "break-word" }}>
                      {pattern.pattern}
                    </Text>
                    <Badge appearance="filled" color="danger" className={styles.patternCount}>
                      {pattern.count}次
                    </Badge>
                  </div>
                  <Text size={100} style={{ color: "var(--colorNeutralForeground3)", marginTop: "4px" }}>
                    最后发生: {new Date(pattern.lastOccurrence).toLocaleString()}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 日志设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Settings24Regular />}
            header={<Text weight="semibold">日志配置</Text>}
            description={<Text size={200}>配置日志记录和保留策略</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="系统日志级别:">
              <Select
                value={config.logLevel || "info"}
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

            <Field label="内存中最大日志条数:">
              <Input
                type="number"
                value={maxLogEntries.toString()}
                onChange={(_, data) => handleMaxLogEntriesChange(parseInt(data.value) || 2000)}
                min={500}
                max={10000}
                step={500}
              />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                超过此数量的旧日志将从内存中移除，但仍保存在磁盘上
              </Text>
            </Field>

            <Divider />


            <Divider />

            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
              会话ID: {enhancedLogService.getSessionId()}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LogsPanel;
