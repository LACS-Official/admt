/**
 * enhancedLogService 兼容层
 * 统一代理至系统单一真相源 logService，消除前后端日志服务割裂
 */
import { logService, LogService } from "./logService";

export * from "./logTypes";
export { LogService as EnhancedLogService };
export const enhancedLogService = logService;
export default logService;