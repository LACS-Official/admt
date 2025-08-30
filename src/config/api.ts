/**
 * API配置文件
 * 管理所有API相关的配置信息
 */

// 环境变量获取函数
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = import.meta.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
};

// API基础配置 - 支持环境变量
export const API_CONFIG = {
  // 基础URL - 从环境变量获取
  BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api-g.lacs.cc'),

  // 开发环境URL
  DEV_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api-g.lacs.cc'),

  // 软件ID - 从环境变量获取
  SOFTWARE_ID: getEnvNumber('VITE_SOFTWARE_ID', 1),

  // 应用版本 - 从环境变量获取
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),

  // 安全配置
  ENABLE_SIGNATURE: getEnvBoolean('VITE_ENABLE_SIGNATURE', true),
  ENABLE_STRICT_USER_AGENT: getEnvBoolean('VITE_ENABLE_STRICT_USER_AGENT', true),
  SIGNATURE_SECRET: getEnvVar('VITE_SIGNATURE_SECRET', ''),

  // 调试配置
  ENABLE_DEBUG: getEnvBoolean('VITE_ENABLE_DEBUG', false),
  ENABLE_CONSOLE_LOGS: getEnvBoolean('VITE_ENABLE_CONSOLE_LOGS', false),

  // 请求超时时间（毫秒）
  TIMEOUT: 15000,

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
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// 环境检测 - 支持Vite环境变量
export const isProduction = () => {
  return import.meta.env.MODE === 'production' || getEnvVar('VITE_APP_ENV') === 'production';
};

export const isDevelopment = () => {
  return import.meta.env.MODE === 'development' || getEnvVar('VITE_APP_ENV') === 'development';
};

// 获取当前环境的API基础URL
export const getApiBaseUrl = () => {
  // 在生产环境中直接使用BASE_URL，不区分开发和生产
  return API_CONFIG.BASE_URL;
};

// 获取当前环境信息
export const getEnvironmentInfo = () => {
  return {
    mode: import.meta.env.MODE,
    env: getEnvVar('VITE_APP_ENV', 'development'),
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    baseUrl: getApiBaseUrl(),
    enableDebug: API_CONFIG.ENABLE_DEBUG,
    enableLogs: API_CONFIG.ENABLE_CONSOLE_LOGS
  };
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