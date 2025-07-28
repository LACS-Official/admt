/**
 * 欢迎页面和激活相关的类型定义
 */

// 激活状态枚举
export enum ActivationStatus {
  NOT_ACTIVATED = 'not_activated',
  ACTIVATING = 'activating',
  ACTIVATED = 'activated',
  ACTIVATION_FAILED = 'activation_failed',
  EXPIRED = 'expired'
}

// 欢迎页面步骤
export enum WelcomeStep {
  WELCOME = 'welcome',
  CONFIGURATION = 'configuration',
  ACTIVATION = 'activation',
  COMPLETE = 'complete'
}

// 用户配置接口
export interface UserConfiguration {
  username: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  autoStart: boolean;
  checkUpdates: boolean;
  enableTelemetry: boolean;
}

// 激活码信息（根据API文档更新）
export interface ActivationCode {
  id: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  metadata?: any;
  productInfo?: ProductInfo;
}

// 产品信息
export interface ProductInfo {
  name: string;
  version: string;
  features: string[];
}

// API验证请求
export interface VerifyRequest {
  code: string;
}

// API验证响应
export interface VerifyResponse {
  success: boolean;
  data?: ActivationCode;
  error?: string;
  usedAt?: Date;
  expiresAt?: Date;
}

// 激活请求
export interface ActivationRequest {
  activationCode: string;
  userConfig: UserConfiguration;
  deviceInfo?: {
    platform: string;
    version: string;
    deviceId: string;
  };
}

// 激活响应（API返回的原始格式）
export interface ActivationResponse {
  success: boolean;
  status: ActivationStatus;
  message: string;
  expiryDate?: string | Date; // API返回字符串，前端可能转换为Date
  features?: string[];
  token?: string;
  apiValidation?: {
    expiresAt: string; // ISO 8601格式的UTC时间字符串
    remainingTime?: number; // 剩余秒数
    message?: string; // 过期信息描述
  };
}

// 应用配置
export interface AppConfig {
  isActivated: boolean;
  activationStatus: ActivationStatus;
  userConfig: UserConfiguration;
  activationDate?: Date;
  expiryDate?: Date;
  features: string[];
  version: string;
}

// 欢迎页面状态
export interface WelcomeState {
  currentStep: WelcomeStep;
  isLoading: boolean;
  error: string | null;
  userConfig: Partial<UserConfiguration>;
  activationCode: string;
  activationStatus: ActivationStatus;
}

// 默认用户配置
export const DEFAULT_USER_CONFIG: UserConfiguration = {
  username: 'HOUT用户',
  language: 'zh-CN',
  theme: 'light',
  autoStart: false,
  checkUpdates: true,
  enableTelemetry: false,
};

// 默认应用配置
export const DEFAULT_APP_CONFIG: AppConfig = {
  isActivated: false,
  activationStatus: ActivationStatus.NOT_ACTIVATED,
  userConfig: DEFAULT_USER_CONFIG,
  features: [],
  version: '1.0.0',
};

// 语言选项
export const LANGUAGE_OPTIONS = [
  { key: 'zh-CN', text: '简体中文' },
  { key: 'zh-TW', text: '繁體中文' },
  { key: 'en-US', text: 'English' },
  { key: 'ja-JP', text: '日本語' },
  { key: 'ko-KR', text: '한국어' },
];

// 主题选项
export const THEME_OPTIONS = [
  { key: 'light', text: '浅色主题' },
  { key: 'dark', text: '深色主题' },
  { key: 'auto', text: '跟随系统' },
];
