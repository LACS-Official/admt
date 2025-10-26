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
} from "@fluentui/react-icons";
import { StructuredLogEntry, LogLevel, LogCategory, LogFilter } from "../../services/logTypes";

// 创建与console.xx一样的日志记录方法
const consoleLogger = {
  // 信息日志
  info: (message: string, ...args: any[]) => {
    console.info(message, ...args);
    // 这里可以添加额外的日志记录逻辑
  },
  
  // 错误日志
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
    // 这里可以添加额外的日志记录逻辑
  },
  
  // 警告日志
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
    // 这里可以添加额外的日志记录逻辑
  },
  
  // 调试日志
  debug: (message: string, ...args: any[]) => {
    console.debug(message, ...args);
    // 这里可以添加额外的日志记录逻辑
  },
  
  // 日志
  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
    // 这里可以添加额外的日志记录逻辑
  }
};

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
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [fileLogs, setFileLogs] = useState<StructuredLogEntry[]>([]);
  const [combinedLogs, setCombinedLogs] = useState<StructuredLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<StructuredLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [deviceFilter, setDeviceFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logSource, setLogSource] = useState<string>("combined"); // combined, memory, file
  const logContentRef = useRef<HTMLDivElement>(null);

  // 订阅日志数据（内存日志）
  useEffect(() => {
    // 由于我们使用console.xx风格的日志记录，这里暂时不订阅
    // 可以添加其他日志收集逻辑
    consoleLogger.info('LogsPanel组件已挂载');
    
    return () => {
      consoleLogger.info('LogsPanel组件已卸载');
    };
  }, []);

  // 加载文件日志
  useEffect(() => {
    const loadFileLogs = async () => {
      try {
        setIsLoading(true);
        consoleLogger.info('开始加载文件日志');
        
        // 由于使用console.xx风格的日志记录，这里暂时模拟文件日志加载
        // 在实际应用中，可以从文件系统或其他存储中加载日志
        const mockFileLogs: StructuredLogEntry[] = [
          {
            id: 'file-log-1',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            level: 'info' as LogLevel,
            category: 'system' as LogCategory,
            message: '系统启动完成',
            source: 'System',
            context: { sessionId: 'mock-session' },
            metadata: { version: '1.0.0', platform: 'windows' }
          }
        ];
        
        setFileLogs(mockFileLogs);
        consoleLogger.info('文件日志加载完成', { count: mockFileLogs.length });
        
      } catch (error) {
        consoleLogger.error("加载文件日志失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFileLogs();
    
    // 设置定时器定期刷新文件日志
    const interval = setInterval(loadFileLogs, 30000); // 每30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);

  // 合并内存日志和文件日志
  useEffect(() => {
    const mergeLogs = () => {
      let mergedLogs: StructuredLogEntry[] = [];
      
      switch (logSource) {
        case "memory":
          mergedLogs = [...logs];
          break;
        case "file":
          mergedLogs = [...fileLogs];
          break;
        case "combined":
        default:
          // 合并并去重（基于ID）
          const allLogs = [...logs, ...fileLogs];
          const uniqueLogs = allLogs.reduce((acc, log) => {
            if (!acc.find(l => l.id === log.id)) {
              acc.push(log);
            }
            return acc;
          }, [] as StructuredLogEntry[]);
          mergedLogs = uniqueLogs;
          break;
      }
      
      // 按时间戳排序
      mergedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setCombinedLogs(mergedLogs);
    };

    mergeLogs();
  }, [logs, fileLogs, logSource]);

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

        // 使用本地过滤而不是调用服务
        const filtered = combinedLogs.filter(log => {
          // 级别过滤
          if (filter.level && log.level !== filter.level) return false;
          
          // 分类过滤
          if (filter.category && log.category !== filter.category) return false;
          
          // 设备过滤
          if (filter.deviceId && log.context?.deviceId !== filter.deviceId) return false;
          
          // 搜索过滤
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
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

    applyFilters();
  }, [combinedLogs, levelFilter, categoryFilter, searchFilter, deviceFilter]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleClearLogs = async () => {
    try {
      // 由于使用console.xx风格的日志记录，这里清除本地状态
      setLogs([]);
      consoleLogger.info("清空日志", "LogsPanel");
    } catch (error) {
      consoleLogger.error("清空日志失败:", error);
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

      // 由于使用console.xx风格的日志记录，这里手动生成日志内容
      const logContent = filteredLogs.map(log => 
        `${new Date(log.timestamp).toISOString()} [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admt-logs-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      consoleLogger.info("导出日志", "LogsPanel", { filter });
    } catch (error) {
      consoleLogger.error("导出日志失败:", error);
    }
  };

  const handleRefreshLogs = async () => {
    try {
      setIsLoading(true);
      
      // 由于使用console.xx风格的日志记录，这里模拟刷新文件日志
      const mockFileLogs: StructuredLogEntry[] = [
        {
          id: 'file-log-1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          level: 'info' as LogLevel,
          category: 'system' as LogCategory,
          message: '系统启动完成',
          source: 'System',
          context: { sessionId: 'mock-session' },
          metadata: { version: '1.0.0', platform: 'windows' }
        },
        {
          id: 'file-log-2',
          timestamp: new Date().toISOString(),
          level: 'info' as LogLevel,
          category: 'system' as LogCategory,
          message: '日志刷新完成',
          source: 'LogsPanel',
          context: { action: 'refresh' },
          metadata: { version: '1.0.0', platform: 'windows' }
        }
      ];
      
      setFileLogs(mockFileLogs);
      
      // 记录用户操作
      consoleLogger.info("refresh_logs", "LogsPanel", {
        logSource,
        fileLogsCount: mockFileLogs.length,
        memoryLogsCount: logs.length
      });
      
    } catch (error) {
      consoleLogger.error("刷新日志失败:", error);
      consoleLogger.error("刷新日志失败", "LogsPanel", { 
        error: error instanceof Error ? error.message : String(error),
        logSource 
      });
    } finally {
      setIsLoading(false);
    }
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
        <Text size={400} weight="semibold">日志查看器</Text>
        <div className={styles.controls}>
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            显示 {filteredLogs.length} / {combinedLogs.length} 条日志
            (内存: {logs.length}, 文件: {fileLogs.length})
          </Text>
          <Field label="日志源:" style={{ minWidth: "120px" }}>
            <Select
              value={logSource}
              onChange={(_, data) => setLogSource(data.value)}
              size="small"
            >
              <option value="combined">合并显示</option>
              <option value="memory">仅内存日志</option>
              <option value="file">仅文件日志</option>
            </Select>
          </Field>
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
