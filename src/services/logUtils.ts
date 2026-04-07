import { StructuredLogEntry, LogFilter, LogStats, LogLevel, LogCategory } from './logTypes';

export class LogUtils {
  static filterLogs(logs: StructuredLogEntry[], filter?: LogFilter): StructuredLogEntry[] {
    if (!filter) return logs;

    return logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.category && log.category !== filter.category) return false;
      if (filter.source && !log.source.toLowerCase().includes(filter.source.toLowerCase())) return false;
      if (filter.deviceId && log.context.deviceId !== filter.deviceId) return false;
      if (filter.operationId && log.context.operationId !== filter.operationId) return false;
      
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const searchableText = `${log.message} ${log.source} ${JSON.stringify(log.context)}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) return false;
      }

      if (filter.startTime && new Date(log.timestamp) < filter.startTime) return false;
      if (filter.endTime && new Date(log.timestamp) > filter.endTime) return false;

      return true;
    });
  }

  static exportLogsAsJson(logs: StructuredLogEntry[]): string {
    return JSON.stringify(logs, null, 2);
  }

  static exportLogsAsText(logs: StructuredLogEntry[]): string {
    return logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const context = Object.keys(log.context).length > 0 ? 
        ` | Context: ${JSON.stringify(log.context)}` : '';
      
      return `[${timestamp}] [${log.level.toUpperCase()}] [${log.category}] [${log.source}] ${log.message}${context}`;
    }).join('\n');
  }

  static calculateLogStats(logs: StructuredLogEntry[]): LogStats {
    const stats: LogStats = {
      fatal: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
      total: logs.length,
      byCategory: {
        device: 0,
        firmware: 0,
        system: 0,
        user: 0,
        network: 0,
        security: 0,
        ai: 0
      },
      recentErrors: 0
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    logs.forEach(log => {
      stats[log.level]++;
      stats.byCategory[log.category]++;
      
      if ((log.level === 'error' || log.level === 'fatal') && 
          new Date(log.timestamp) > oneHourAgo) {
        stats.recentErrors++;
      }
    });

    return stats;
  }

  static formatLogForDisplay(log: StructuredLogEntry): string {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const level = log.level.toUpperCase().padEnd(7);
    const category = log.category.toUpperCase().padEnd(8);
    const source = log.source.padEnd(15);
    
    return `[${timestamp}] [${level}] [${category}] [${source}] ${log.message}`;
  }

  static getLevelColor(level: LogLevel): string {
    const colors = {
      fatal: '#8B0000',    // 深红色
      error: '#DC143C',    // 红色
      warning: '#FF8C00',  // 橙色
      info: '#4169E1',     // 蓝色
      debug: '#808080'     // 灰色
    };
    return colors[level] || colors.debug;
  }

  static getCategoryIcon(category: LogCategory): string {
    const icons = {
      device: '📱',
      firmware: '💾',
      system: '⚙️',
      user: '👤',
      network: '🌐',
      security: '🔒',
      ai: '🤖'
    };
    return icons[category] || '📝';
  }

  static isRecentLog(timestamp: string, minutes: number = 5): boolean {
    const logTime = new Date(timestamp);
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return logTime > cutoff;
  }

  static groupLogsByTimeRange(logs: StructuredLogEntry[], rangeMinutes: number = 60): Map<string, StructuredLogEntry[]> {
    const groups = new Map<string, StructuredLogEntry[]>();
    
    logs.forEach(log => {
      const logTime = new Date(log.timestamp);
      const rangeStart = new Date(Math.floor(logTime.getTime() / (rangeMinutes * 60 * 1000)) * rangeMinutes * 60 * 1000);
      const rangeKey = rangeStart.toISOString();
      
      if (!groups.has(rangeKey)) {
        groups.set(rangeKey, []);
      }
      groups.get(rangeKey)!.push(log);
    });
    
    return groups;
  }

  static findErrorPatterns(logs: StructuredLogEntry[]): Array<{ pattern: string; count: number; lastOccurrence: string }> {
    const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'fatal');
    const patterns = new Map<string, { count: number; lastOccurrence: string }>();
    
    errorLogs.forEach(log => {
      // 简化错误消息以识别模式
      const pattern = log.message.replace(/\d+/g, 'N').replace(/[a-f0-9]{8,}/gi, 'HASH');
      
      if (patterns.has(pattern)) {
        const existing = patterns.get(pattern)!;
        existing.count++;
        if (new Date(log.timestamp) > new Date(existing.lastOccurrence)) {
          existing.lastOccurrence = log.timestamp;
        }
      } else {
        patterns.set(pattern, { count: 1, lastOccurrence: log.timestamp });
      }
    });
    
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count);
  }
}