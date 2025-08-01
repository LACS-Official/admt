/**
 * API配置文件
 * 管理所有API相关的配置信息
 */

// API基础配置
export const API_CONFIG = {
  // 基础URL
  BASE_URL: 'https://api-g.lacs.cc',

  // 开发环境URL（与生产环境相同）
  DEV_BASE_URL: 'https://api-g.lacs.cc',

  // API密钥（实际使用时应该从环境变量或安全存储中获取）
  API_KEY: 'your-api-key',

  // 软件ID（当前软件在API系统中的唯一标识）
  SOFTWARE_ID: 1,

  // 请求超时时间（毫秒）
  TIMEOUT: 10000,

  // 重试次数
  RETRY_COUNT: 3,

  // 重试延迟（毫秒）
  RETRY_DELAY: 1000,
};

// API端点配置
export const API_ENDPOINTS = {
  // 软件管理
  SOFTWARE: {
    LIST: '/app/software',
    BY_ID: (id: number) => `/app/software/id/${id}`,
    BY_NAME: (name: string) => `/app/software/${name}`,
    CREATE: '/app/software',
    UPDATE: (id: number) => `/app/software/id/${id}`,
    DELETE: (id: number) => `/app/software/id/${id}`,
  },
  
  // 版本管理
  VERSIONS: {
    LIST: (softwareId: number) => `/app/software/id/${softwareId}/versions`,
    BY_ID: (softwareId: number, versionId: number) => `/app/software/id/${softwareId}/versions/${versionId}`,
    CREATE: (softwareId: number) => `/app/software/id/${softwareId}/versions`,
    UPDATE: (softwareId: number, versionId: number) => `/app/software/id/${softwareId}/versions/${versionId}`,
    DELETE: (softwareId: number, versionId: number) => `/app/software/id/${softwareId}/versions/${versionId}`,
  },
  
  // 公告管理
  ANNOUNCEMENTS: {
    LIST: (softwareId: number) => `/app/software/id/${softwareId}/announcements`,
    BY_ID: (softwareId: number, announcementId: number) => `/app/software/id/${softwareId}/announcements/${announcementId}`,
    CREATE: (softwareId: number) => `/app/software/id/${softwareId}/announcements`,
    UPDATE: (softwareId: number, announcementId: number) => `/app/software/id/${softwareId}/announcements/${announcementId}`,
    DELETE: (softwareId: number, announcementId: number) => `/app/software/id/${softwareId}/announcements/${announcementId}`,
  },
  
  // 激活码管理
  ACTIVATION: {
    GENERATE: '/api/activation-codes',
    VERIFY: '/api/activation-codes/verify',
    LIST: '/api/activation-codes',
    STATS: '/api/activation-codes/stats',
    CLEANUP: '/api/activation-codes/cleanup',
    CLEANUP_UNUSED: '/api/activation-codes/cleanup-unused',
  },
  
  // 健康检查
  HEALTH: '/api/health',
};

// 请求头配置
export const getDefaultHeaders = () => ({
  'X-API-Key': API_CONFIG.API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// 环境检测
export const isProduction = () => {
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
};

// 获取当前环境的API基础URL
export const getApiBaseUrl = () => {
  return isProduction() ? API_CONFIG.BASE_URL : API_CONFIG.DEV_BASE_URL;
};

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  path?: string;
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应类型
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: {
    field?: string;
    message?: string;
  };
  timestamp: string;
  path: string;
}

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// API错误代码
export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];
