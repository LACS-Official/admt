/**
 * 激活码验证和本地存储服务 (Stubbed for Permanent Activation)
 * 仅保留公共接口以维持兼容性，所有检查均返回已激活状态。
 */

import { ActivationStatus, ActivationRequest, ActivationResponse } from '../types/welcome';

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
 * 激活服务类 - Stubbed
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
   * 验证激活码格式 - 总是返回有效
   */
  public async validateActivationCodeFormat(_code: string): Promise<ActivationValidationResult> {
    return {
      isValid: true,
      message: "激活码格式正确",
      type: 'format'
    };
  }

  /**
   * 执行激活码验证和激活 - 总是成功
   */
  public async activateApplication(request: ActivationRequest): Promise<ActivationResponse> {
    console.log('[ActivationService] 模拟激活成功 (由重构逻辑接管)');
    return {
      success: true,
      status: ActivationStatus.ACTIVATED,
      message: "激活成功",
      expiryDate: "2099-12-31T23:59:59Z",
      features: ["all"]
    };
  }

  /**
   * 检查激活状态 - 总是返回永久激活
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
    return {
      isActivated: true,
      isExpired: false,
      needsActivation: false,
      expiryDate: new Date("2099-12-31"),
      features: ["all"],
      apiValidation: {
        expiresAt: "2099-12-31T23:59:59Z",
        remainingTime: 999999999,
        message: "永久激活"
      }
    };
  }

  public clearActivationData(): void {
    // No-op
  }

  public getActivationDaysRemaining(): number | null {
    return 9999;
  }

  public shouldRevalidateActivation(): boolean {
    return false;
  }

  public handleExpiredActivation(): {
    wasExpired: boolean;
    userConfig?: any;
    expiredReason?: string;
  } {
    return { wasExpired: false };
  }

  public get isActivated(): boolean {
    return true;
  }

  public getDetailedActivationInfo(): {
    hasLocalData: boolean;
    localExpiryDate?: string;
    apiExpiryDate?: string;
    currentTime: string;
    isExpiredByLocal: boolean;
    isExpiredByApi: boolean;
    timeDifference?: number;
  } {
    return {
      hasLocalData: true,
      localExpiryDate: "2099-12-31T23:59:59Z",
      apiExpiryDate: "2099-12-31T23:59:59Z",
      currentTime: new Date().toISOString(),
      isExpiredByLocal: false,
      isExpiredByApi: false,
      timeDifference: 0
    };
  }

  /**
   * 加载激活数据 (兼容原有接口)
   */
  public loadActivationData(): any {
    return {
      isActivated: true,
      activationCode: "PERMANENT-ACTV-CODE",
      activationDate: "2024-01-01T00:00:00Z",
      expiryDate: "2099-12-31T23:59:59Z",
      apiValidation: {
        expiresAt: "2099-12-31T23:59:59Z",
        remainingTime: 999999,
        message: "永久激活"
      }
    };
  }
}

// 导出单例实例
export const activationService = ActivationService.getInstance();
