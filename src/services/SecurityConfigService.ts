import { logService } from './logService';

export interface SecurityConfig {
  encryptionKey: string;
  apiEndpoint: string;
  timeout: number;
  maxRetries: number;
  enableLogging: boolean;
}

export class SecurityConfigService {
  private static instance: SecurityConfigService | null = null;
  private config: SecurityConfig | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): SecurityConfigService {
    if (!SecurityConfigService.instance) {
      SecurityConfigService.instance = new SecurityConfigService();
    }
    return SecurityConfigService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // 默认配置
      const defaultConfig: SecurityConfig = {
        encryptionKey: this.generateEncryptionKey(),
        apiEndpoint: 'https://api.example.com',
        timeout: 30000,
        maxRetries: 3,
        enableLogging: true
      };

      // 尝试从本地存储加载配置
      const savedConfig = localStorage.getItem('security_config');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          this.config = { ...defaultConfig, ...parsedConfig };
        } catch (error) {
          logService.warning('解析保存的安全配置失败，使用默认配置', 'SecurityConfigService', error);
          this.config = defaultConfig;
        }
      } else {
        this.config = defaultConfig;
        // 保存默认配置到本地存储
        localStorage.setItem('security_config', JSON.stringify(this.config));
      }

      this.initialized = true;
      logService.info('安全配置服务初始化成功', 'SecurityConfigService');
    } catch (error) {
      logService.error('安全配置服务初始化失败', 'SecurityConfigService', error);
      throw error;
    }
  }

  private generateEncryptionKey(): string {
    // 生成一个基于时间戳和随机数的加密密钥
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}_${random}`;
  }

  getConfig(): SecurityConfig {
    if (!this.initialized || !this.config) {
      throw new Error('安全配置服务未初始化');
    }
    return { ...this.config };
  }

  updateConfig(updates: Partial<SecurityConfig>): void {
    if (!this.initialized || !this.config) {
      throw new Error('安全配置服务未初始化');
    }

    this.config = { ...this.config, ...updates };
    
    // 保存到本地存储
    try {
      localStorage.setItem('security_config', JSON.stringify(this.config));
      logService.info('安全配置已更新', 'SecurityConfigService', updates);
    } catch (error) {
      logService.error('保存安全配置失败', 'SecurityConfigService', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.config = null;
    this.initialized = false;
    localStorage.removeItem('security_config');
    logService.info('安全配置已重置', 'SecurityConfigService');
  }
}