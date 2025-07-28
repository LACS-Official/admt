/**
 * 激活码验证和本地存储服务
 * 提供安全的激活码管理、验证和存储功能
 */

import { invoke } from '@tauri-apps/api/core';
import { ActivationStatus, ActivationRequest, ActivationResponse, AppConfig } from '../types/welcome';
import { activationLogger } from './activationLogger';

// 激活码存储的加密密钥（实际应用中应该使用更安全的方式）
const STORAGE_KEY = 'hout_activation_data';
const ENCRYPTION_KEY = 'hout_secure_key_2024';

/**
 * 激活码验证结果
 */
export interface ActivationValidationResult {
  isValid: boolean;
  message: string;
  type: 'format' | 'network' | 'api' | 'expired' | 'used';
  details?: string;
}

/**
 * 本地存储的激活数据
 */
interface StoredActivationData {
  isActivated: boolean;
  activationCode: string;
  activationDate: string;
  expiryDate: string;
  features: string[];
  userConfig: any;
  apiValidation?: {
    expiresAt: string;
    remainingTime?: number;
    message?: string;
  };
  checksum: string; // 用于验证数据完整性
}

/**
 * 激活服务类
 */
export class ActivationService {
  private static instance: ActivationService;

  private constructor() {}

  public static getInstance(): ActivationService {
    if (!ActivationService.instance) {
      ActivationService.instance = new ActivationService();
    }
    return ActivationService.instance;
  }

  /**
   * 简单的字符串加密（支持Unicode字符）
   */
  private encrypt(text: string): string {
    try {
      // 先将Unicode字符串转换为UTF-8字节
      const utf8Bytes = new TextEncoder().encode(text);

      // 对字节进行XOR加密
      const encryptedBytes = new Uint8Array(utf8Bytes.length);
      for (let i = 0; i < utf8Bytes.length; i++) {
        encryptedBytes[i] = utf8Bytes[i] ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      }

      // 将加密后的字节转换为base64
      return this.arrayBufferToBase64(encryptedBytes.buffer);
    } catch (error) {
      console.error('加密失败:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 简单的字符串解密（支持Unicode字符）
   */
  private decrypt(encryptedText: string): string {
    try {
      // 将base64转换为字节数组
      const encryptedBytes = new Uint8Array(this.base64ToArrayBuffer(encryptedText));

      // 对字节进行XOR解密
      const decryptedBytes = new Uint8Array(encryptedBytes.length);
      for (let i = 0; i < encryptedBytes.length; i++) {
        decryptedBytes[i] = encryptedBytes[i] ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      }

      // 将UTF-8字节转换回Unicode字符串
      return new TextDecoder().decode(decryptedBytes);
    } catch (error) {
      console.error('解密失败:', error);
      return '';
    }
  }

  /**
   * 将ArrayBuffer转换为Base64字符串
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * 将Base64字符串转换为ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * 生成数据校验和
   */
  private generateChecksum(data: Omit<StoredActivationData, 'checksum'>): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }

  /**
   * 解析API返回的过期时间字符串
   * 支持ISO 8601格式的UTC时间字符串
   */
  private parseApiExpiryDate(expiryDateString: string): Date | undefined {
    try {
      // API返回的格式：2025-01-01T12:00:00.000Z
      const date = new Date(expiryDateString);

      // 验证日期是否有效
      if (isNaN(date.getTime())) {
        console.error('无效的过期时间格式:', expiryDateString);
        return undefined;
      }

      console.log('成功解析过期时间:', {
        original: expiryDateString,
        parsed: date.toISOString(),
        localTime: date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      });

      return date;
    } catch (error) {
      console.error('解析过期时间失败:', error, '原始值:', expiryDateString);
      return undefined;
    }
  }

  /**
   * 检查激活码是否已过期（精确到秒）
   */
  private isActivationExpired(expiryDate: Date): boolean {
    const now = new Date();
    const isExpired = now > expiryDate;

    if (isExpired) {
      const expiredMinutes = Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60));
      console.log('激活码已过期:', {
        expiryDate: expiryDate.toISOString(),
        currentTime: now.toISOString(),
        expiredMinutes: expiredMinutes
      });
    } else {
      const remainingMinutes = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60));
      console.log('激活码仍有效:', {
        expiryDate: expiryDate.toISOString(),
        currentTime: now.toISOString(),
        remainingMinutes: remainingMinutes
      });
    }

    return isExpired;
  }

  /**
   * 验证激活码格式
   */
  public async validateActivationCodeFormat(code: string): Promise<ActivationValidationResult> {
    try {
      const isValid = await invoke<boolean>('validate_activation_code_format', {
        activationCode: code.trim().toUpperCase(),
      });

      return {
        isValid,
        message: isValid ? "激活码格式正确" : "激活码格式不正确，请检查格式是否为：XXXXXXXX-XXXXXX-XXXXXXXX",
        type: 'format',
        details: isValid ? undefined : "激活码应包含3个部分，用短横线分隔，格式如：1K2L3M4N-ABC123-DEF45678"
      };
    } catch (error) {
      return {
        isValid: false,
        message: "格式验证失败",
        type: 'network',
        details: `验证过程中出现错误: ${error}`
      };
    }
  }

  /**
   * 执行激活码验证和激活
   */
  public async activateApplication(request: ActivationRequest): Promise<ActivationResponse> {
    try {
      activationLogger.logActivationAttempt(request.activationCode, request.userConfig);

      const response = await invoke<ActivationResponse>('activate_application', {
        request
      });

      activationLogger.debug('ACTIVATION', '收到激活响应', {
        success: response.success,
        status: response.status,
        hasApiValidation: !!response.apiValidation
      });

      // 如果激活成功，保存到本地存储
      if (response.success && response.status === ActivationStatus.ACTIVATED) {
        // 从API响应中提取过期时间
        let expiryDate: Date | undefined;

        // 优先使用apiValidation.expiresAt字段（API文档标准格式）
        if (response.apiValidation?.expiresAt) {
          expiryDate = this.parseApiExpiryDate(response.apiValidation.expiresAt);
          activationLogger.debug('ACTIVATION', '从apiValidation.expiresAt解析过期时间', {
            original: response.apiValidation.expiresAt,
            parsed: expiryDate?.toISOString()
          });
        }
        // 备用：使用response.expiryDate字段
        else if (response.expiryDate) {
          if (typeof response.expiryDate === 'string') {
            expiryDate = this.parseApiExpiryDate(response.expiryDate);
          } else {
            expiryDate = response.expiryDate;
          }
          activationLogger.debug('ACTIVATION', '从response.expiryDate解析过期时间', {
            original: response.expiryDate,
            parsed: expiryDate?.toISOString()
          });
        }

        await this.saveActivationData({
          activationCode: request.activationCode,
          expiryDate: expiryDate,
          features: response.features || [],
          userConfig: request.userConfig,
          apiValidation: response.apiValidation // 保存完整的API验证信息
        });

        activationLogger.logActivationSuccess(response);
      }

      return response;
    } catch (error) {
      activationLogger.logActivationFailure(error, request.activationCode);
      return {
        success: false,
        status: ActivationStatus.ACTIVATION_FAILED,
        message: `激活过程中出现错误: ${error}`,
        expiryDate: undefined,
        features: undefined,
        token: undefined
      };
    }
  }

  /**
   * 保存激活数据到本地存储
   */
  private async saveActivationData(data: {
    activationCode: string;
    expiryDate?: Date;
    features: string[];
    userConfig: any;
    apiValidation?: {
      expiresAt: string;
      remainingTime?: number;
      message?: string;
    };
  }): Promise<void> {
    try {
      console.log('开始保存激活数据:', {
        activationCode: data.activationCode.substring(0, 8) + '****',
        expiryDate: data.expiryDate,
        features: data.features,
        userConfig: data.userConfig
      });

      const now = new Date();

      // 确保expiryDate是有效的Date对象
      let expiryDateString: string;
      if (data.expiryDate && data.expiryDate instanceof Date && !isNaN(data.expiryDate.getTime())) {
        expiryDateString = data.expiryDate.toISOString();
      } else {
        // 如果没有有效的过期日期，设置为1年后
        expiryDateString = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        console.warn('使用默认过期时间（1年后）:', expiryDateString);
      }

      const activationData: Omit<StoredActivationData, 'checksum'> = {
        isActivated: true,
        activationCode: data.activationCode,
        activationDate: now.toISOString(),
        expiryDate: expiryDateString,
        features: data.features || [],
        userConfig: data.userConfig || {},
        apiValidation: data.apiValidation
      };

      console.log('准备保存的激活数据:', {
        ...activationData,
        activationCode: activationData.activationCode.substring(0, 8) + '****'
      });

      const checksum = this.generateChecksum(activationData);
      const finalData: StoredActivationData = { ...activationData, checksum };

      const encryptedData = this.encrypt(JSON.stringify(finalData));

      // 检查localStorage是否可用
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage不可用');
      }

      localStorage.setItem(STORAGE_KEY, encryptedData);

      console.log('激活数据已成功保存到本地存储');
    } catch (error) {
      console.error('保存激活数据失败:', error);
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`保存激活数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从本地存储加载激活数据
   */
  public loadActivationData(): StoredActivationData | null {
    try {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) {
        console.log('未找到本地激活数据');
        return null;
      }

      const decryptedData = this.decrypt(encryptedData);
      if (!decryptedData) {
        console.error('解密激活数据失败');
        this.clearActivationData();
        return null;
      }

      const data: StoredActivationData = JSON.parse(decryptedData);
      
      // 验证数据完整性
      const expectedChecksum = this.generateChecksum({
        isActivated: data.isActivated,
        activationCode: data.activationCode,
        activationDate: data.activationDate,
        expiryDate: data.expiryDate,
        features: data.features,
        userConfig: data.userConfig
      });

      if (data.checksum !== expectedChecksum) {
        activationLogger.logDataCorruption({
          expectedChecksum,
          actualChecksum: data.checksum,
          dataSize: decryptedData.length
        });
        this.clearActivationData();
        return null;
      }

      console.log('成功加载本地激活数据');
      return data;
    } catch (error) {
      console.error('加载激活数据失败:', error);
      this.clearActivationData();
      return null;
    }
  }

  /**
   * 检查激活状态（增强版，支持精确的过期检查）
   */
  public checkActivationStatus(): {
    isActivated: boolean;
    isExpired: boolean;
    needsActivation: boolean;
    expiryDate?: Date;
    features?: string[];
    apiValidation?: {
      expiresAt: string;
      remainingTime?: number;
      message?: string;
    };
    expiredReason?: string;
  } {
    activationLogger.debug('STATUS_CHECK', '开始检查激活状态');

    const data = this.loadActivationData();

    if (!data || !data.isActivated) {
      const reason = data ? '应用未激活' : '未找到激活数据';
      activationLogger.info('STATUS_CHECK', reason);
      return {
        isActivated: false,
        isExpired: false,
        needsActivation: true,
        expiredReason: reason
      };
    }

    // 优先使用apiValidation.expiresAt进行过期检查
    let expiryDate: Date;
    let expiredReason: string | undefined;

    if (data.apiValidation?.expiresAt) {
      const apiExpiryDate = this.parseApiExpiryDate(data.apiValidation.expiresAt);
      if (apiExpiryDate) {
        expiryDate = apiExpiryDate;
        console.log('使用API验证过期时间:', data.apiValidation.expiresAt);
      } else {
        expiryDate = new Date(data.expiryDate);
        expiredReason = 'API过期时间解析失败，使用备用时间';
        console.warn(expiredReason);
      }
    } else {
      expiryDate = new Date(data.expiryDate);
      console.log('使用本地存储过期时间:', data.expiryDate);
    }

    const isExpired = this.isActivationExpired(expiryDate);

    if (isExpired && !expiredReason) {
      const now = new Date();
      const expiredHours = Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60));
      expiredReason = `激活码已过期 ${expiredHours} 小时`;
    }

    const result = {
      isActivated: data.isActivated && !isExpired,
      isExpired,
      needsActivation: !data.isActivated || isExpired,
      expiryDate,
      features: data.features,
      apiValidation: data.apiValidation,
      expiredReason
    };

    activationLogger.logExpirationCheck(result);
    return result;
  }

  /**
   * 清除本地激活数据
   */
  public clearActivationData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('已清除本地激活数据');
    } catch (error) {
      console.error('清除激活数据失败:', error);
    }
  }

  /**
   * 获取激活剩余天数
   */
  public getActivationDaysRemaining(): number | null {
    const data = this.loadActivationData();
    if (!data || !data.isActivated) {
      return null;
    }

    const now = new Date();
    const expiryDate = new Date(data.expiryDate);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * 验证激活码是否需要重新验证
   */
  public shouldRevalidateActivation(): boolean {
    const data = this.loadActivationData();
    if (!data) return true;

    // 检查是否临近过期（7天内）
    const daysRemaining = this.getActivationDaysRemaining();
    if (daysRemaining !== null && daysRemaining <= 7) {
      return true;
    }

    return false;
  }

  /**
   * 处理过期激活码的清理和状态重置
   */
  public handleExpiredActivation(): {
    wasExpired: boolean;
    userConfig?: any;
    expiredReason?: string;
  } {
    activationLogger.info('EXPIRATION', '开始处理过期激活码');

    const activationStatus = this.checkActivationStatus();

    if (!activationStatus.isExpired) {
      activationLogger.debug('EXPIRATION', '激活码未过期，无需处理');
      return { wasExpired: false };
    }

    // 保存用户配置以便重新激活时使用
    const data = this.loadActivationData();
    const userConfig = data?.userConfig;

    // 将用户配置保存到独立的存储中
    if (userConfig) {
      try {
        localStorage.setItem('hout_preserved_user_config', JSON.stringify(userConfig));
        activationLogger.info('EXPIRATION', '用户配置已保留', {
          username: userConfig.username,
          language: userConfig.language
        });
      } catch (error) {
        activationLogger.warn('EXPIRATION', '保留用户配置失败', { error: error.message });
      }
    }

    activationLogger.logExpirationHandling('清理过期数据', {
      expiredReason: activationStatus.expiredReason,
      expiryDate: activationStatus.expiryDate?.toISOString(),
      preservedUserConfig: userConfig ? {
        username: userConfig.username,
        language: userConfig.language
      } : null
    });

    // 清除过期的激活数据
    this.clearActivationData();

    return {
      wasExpired: true,
      userConfig,
      expiredReason: activationStatus.expiredReason
    };
  }

  /**
   * 获取详细的激活状态信息（用于调试和监控）
   */
  public getDetailedActivationInfo(): {
    hasLocalData: boolean;
    localExpiryDate?: string;
    apiExpiryDate?: string;
    currentTime: string;
    isExpiredByLocal: boolean;
    isExpiredByApi: boolean;
    timeDifference?: number;
  } {
    const data = this.loadActivationData();
    const now = new Date();

    if (!data) {
      return {
        hasLocalData: false,
        currentTime: now.toISOString(),
        isExpiredByLocal: false,
        isExpiredByApi: false
      };
    }

    const localExpiryDate = new Date(data.expiryDate);
    const apiExpiryDate = data.apiValidation?.expiresAt ?
      this.parseApiExpiryDate(data.apiValidation.expiresAt) : undefined;

    return {
      hasLocalData: true,
      localExpiryDate: data.expiryDate,
      apiExpiryDate: data.apiValidation?.expiresAt,
      currentTime: now.toISOString(),
      isExpiredByLocal: now > localExpiryDate,
      isExpiredByApi: apiExpiryDate ? now > apiExpiryDate : false,
      timeDifference: apiExpiryDate ?
        apiExpiryDate.getTime() - localExpiryDate.getTime() : undefined
    };
  }
}

// 导出单例实例
export const activationService = ActivationService.getInstance();
