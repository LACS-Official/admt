import { StructuredLogEntry, LogFilter } from './logTypes';

/**
 * 模拟后端日志持久化服务
 * 在实际应用中，这些功能应该在Rust后端实现
 */
export class LogBackendMock {
  private persistedLogs: StructuredLogEntry[] = [];
  private readonly MAX_PERSISTED_LOGS = 50000;

  /**
   * 持久化日志条目
   */
  async persistLog(logEntry: StructuredLogEntry): Promise<void> {
    try {
      // 模拟异步持久化操作
      await new Promise(resolve => setTimeout(resolve, 1));
      
      this.persistedLogs.push(logEntry);
      
      // 限制持久化日志数量
      if (this.persistedLogs.length > this.MAX_PERSISTED_LOGS) {
        this.persistedLogs = this.persistedLogs.slice(-this.MAX_PERSISTED_LOGS);
      }
      
      // 在实际应用中，这里应该写入文件系统或数据库
      console.debug(`[LogBackend] 持久化日志: ${logEntry.level} - ${logEntry.message}`);
    } catch (error) {
      console.error('持久化日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取持久化的日志
   */
  async getLogs(filter?: LogFilter): Promise<StructuredLogEntry[]> {
    try {
      // 模拟异步读取操作
      await new Promise(resolve => setTimeout(resolve, 10));
      
      let filteredLogs = [...this.persistedLogs];
      
      if (filter) {
        if (filter.level) {
          filteredLogs = filteredLogs.filter(log => log.level === filter.level);
        }
        
        if (filter.category) {
          filteredLogs = filteredLogs.filter(log => log.category === filter.category);
        }
        
        if (filter.source) {
          filteredLogs = filteredLogs.filter(log => 
            log.source.toLowerCase().includes(filter.source!.toLowerCase())
          );
        }
        
        if (filter.deviceId) {
          filteredLogs = filteredLogs.filter(log => 
            log.context.deviceId === filter.deviceId
          );
        }
        
        if (filter.operationId) {
          filteredLogs = filteredLogs.filter(log => 
            log.context.operationId === filter.operationId
          );
        }
        
        if (filter.search) {
          const searchTerm = filter.search.toLowerCase();
          filteredLogs = filteredLogs.filter(log => {
            const searchableText = `${log.message} ${log.source} ${JSON.stringify(log.context)}`.toLowerCase();
            return searchableText.includes(searchTerm);
          });
        }
        
        if (filter.startTime) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) >= filter.startTime!
          );
        }
        
        if (filter.endTime) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.timestamp) <= filter.endTime!
          );
        }
      }
      
      return filteredLogs.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('获取持久化日志失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有持久化日志
   */
  async clearLogs(): Promise<void> {
    try {
      // 模拟异步清理操作
      await new Promise(resolve => setTimeout(resolve, 50));
      
      this.persistedLogs = [];
      console.info('[LogBackend] 所有持久化日志已清空');
    } catch (error) {
      console.error('清空持久化日志失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期日志
   */
  async cleanupExpiredLogs(basicCutoff: string, errorCutoff: string): Promise<void> {
    try {
      // 模拟异步清理操作
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const basicCutoffDate = new Date(basicCutoff);
      const errorCutoffDate = new Date(errorCutoff);
      
      const initialCount = this.persistedLogs.length;
      
      this.persistedLogs = this.persistedLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        
        // 错误和致命错误日志保留更长时间
        if (log.level === 'error' || log.level === 'fatal') {
          return logDate > errorCutoffDate;
        }
        
        // 其他日志按基础保留期限处理
        return logDate > basicCutoffDate;
      });
      
      const removedCount = initialCount - this.persistedLogs.length;
      console.info(`[LogBackend] 清理过期日志完成，移除 ${removedCount} 条日志`);
    } catch (error) {
      console.error('清理过期日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取日志统计信息
   */
  async getLogStats(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    oldestLog?: string;
    newestLog?: string;
  }> {
    try {
      const stats = {
        total: this.persistedLogs.length,
        byLevel: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        oldestLog: undefined as string | undefined,
        newestLog: undefined as string | undefined
      };
      
      if (this.persistedLogs.length > 0) {
        // 按时间排序
        const sortedLogs = [...this.persistedLogs].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        stats.oldestLog = sortedLogs[0].timestamp;
        stats.newestLog = sortedLogs[sortedLogs.length - 1].timestamp;
        
        // 统计各级别和分类
        this.persistedLogs.forEach(log => {
          stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
          stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        });
      }
      
      return stats;
    } catch (error) {
      console.error('获取日志统计失败:', error);
      throw error;
    }
  }

  /**
   * 导出日志到文件
   */
  async exportLogsToFile(filter?: LogFilter, format: 'json' | 'text' = 'json'): Promise<string> {
    try {
      const logs = await this.getLogs(filter);
      
      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else {
        return logs.map(log => {
          const timestamp = new Date(log.timestamp).toLocaleString();
          const context = Object.keys(log.context).length > 1 ? // 排除sessionId
            ` | Context: ${JSON.stringify(log.context)}` : '';
          
          return `[${timestamp}] [${log.level.toUpperCase()}] [${log.category}] [${log.source}] ${log.message}${context}`;
        }).join('\n');
      }
    } catch (error) {
      console.error('导出日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前存储状态
   */
  getStorageInfo(): {
    persistedCount: number;
    maxCapacity: number;
    usagePercent: number;
    estimatedSizeKB: number;
  } {
    const estimatedSizeKB = Math.round(
      JSON.stringify(this.persistedLogs).length / 1024
    );
    
    return {
      persistedCount: this.persistedLogs.length,
      maxCapacity: this.MAX_PERSISTED_LOGS,
      usagePercent: Math.round((this.persistedLogs.length / this.MAX_PERSISTED_LOGS) * 100),
      estimatedSizeKB
    };
  }
}

// 创建全局模拟后端实例
export const logBackendMock = new LogBackendMock();

// 注册模拟的Tauri命令处理器
if (typeof window !== 'undefined') {
  // 模拟Tauri invoke函数的行为
  const originalInvoke = (window as any).__TAURI__?.invoke;
  
  if (!originalInvoke) {
    // 如果Tauri不可用，创建模拟invoke函数
    (window as any).__TAURI__ = {
      invoke: async (cmd: string, args?: any) => {
        switch (cmd) {
          case 'persist_log':
            if (args?.logEntry) {
              const logEntry = JSON.parse(args.logEntry);
              await logBackendMock.persistLog(logEntry);
              return 'OK';
            }
            throw new Error('Missing logEntry parameter');
            
          case 'get_logs':
            const logs = await logBackendMock.getLogs(args?.filter);
            return JSON.stringify(logs);
            
          case 'clear_logs':
            await logBackendMock.clearLogs();
            return 'OK';
            
          case 'cleanup_expired_logs':
            await logBackendMock.cleanupExpiredLogs(
              args?.basicCutoff,
              args?.errorCutoff
            );
            return 'OK';
            
          default:
            console.warn(`未知的模拟命令: ${cmd}`);
            return Promise.resolve('{}');
        }
      }
    };
  }
}