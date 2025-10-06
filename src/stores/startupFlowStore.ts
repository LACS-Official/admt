/**
 * 启动流程状态管理
 * 管理应用启动时的各个阶段和状态
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { VersionCheckResult, VersionInfo } from '../types/app';

// 启动流程阶段
export type StartupPhase =
  | 'version-check'           // 阶段1：版本检查
  | 'first-launch-detection'  // 阶段2：首次使用检测
  | 'privacy-consent'         // 阶段3：隐私政策和用户协议（仅首次使用）
  | 'activation-verification' // 阶段4：激活码验证（仅首次使用且同意条款后）
  | 'main-app'                // 阶段5：进入主页面
  | 'data-collection'         // 阶段6：数据收集
  | 'completed';              // 完成

// 用户类型
export type UserType = 'new' | 'existing' | 'expired' | 'unknown';

// 版本检查结果
// 使用统一的 VersionCheckResult 类型定义
export type { VersionCheckResult, VersionInfo } from '../types/app';

// 激活状态（符合API响应格式）
export interface ActivationStatus {
  isValid: boolean;
  isActivated: boolean;
  code?: string;
  expiresAt?: string;
  activatedAt?: string;
  remainingDays?: number;
  gracePeriodDays?: number;
  metadata?: any;
  // 新增字段，符合API文档
  id?: string;
  createdAt?: string;
  isUsed?: boolean;
  usedAt?: string;
  isExpired?: boolean;
  productInfo?: {
    name: string;
    version: string;
    features: string[];
  };
  apiValidation?: {
    expiresAt: string;
    remainingTime?: number;
    message?: string;
  };
}

// 用户设置
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  privacyConsent: boolean;
  dataCollectionConsent: boolean;
  analyticsConsent: boolean;
  isFirstLaunch: boolean;
}

// 隐私政策同意状态
export interface PrivacyConsentState {
  // 基本同意状态
  hasAcceptedPrivacyPolicy: boolean;
  hasAcceptedUserAgreement: boolean;
  hasAcceptedDataCollection: boolean;

  // 详细数据收集权限
  allowDeviceDataCollection: boolean;
  allowUserBehaviorCollection: boolean;
  allowAnonymousAnalytics: boolean;
  allowCrashReporting: boolean;

  // 同意时间戳
  privacyPolicyAcceptedAt?: string;
  userAgreementAcceptedAt?: string;
  dataCollectionAcceptedAt?: string;

  // 撤销时间戳
  privacyPolicyRevokedAt?: string;
  userAgreementRevokedAt?: string;
  dataCollectionRevokedAt?: string;

  // 版本信息
  privacyPolicyVersion: string;
  userAgreementVersion: string;

  // 首次启动标识
  isFirstLaunch: boolean;
  hasCompletedPrivacySetup: boolean;
}

// 启动流程状态
export interface StartupFlowState {
  // 当前阶段
  currentPhase: StartupPhase;

  // 各阶段状态
  versionCheckCompleted: boolean;
  firstLaunchDetected: boolean;
  privacyConsentCompleted: boolean;
  activationVerified: boolean;
  mainAppEntered: boolean;
  dataCollectionStarted: boolean;
  
  // 用户信息
  userType: UserType;
  isFirstLaunch: boolean;
  
  // 版本信息
  versionCheckResult: VersionCheckResult | null;
  
  // 激活信息
  activationStatus: ActivationStatus | null;
  
  // 用户设置
  userSettings: UserSettings;
  
  // 错误状态
  error: string | null;
  isLoading: boolean;
  
  // 重试计数
  retryCount: number;
  maxRetries: number;
}

// 启动流程操作
export interface StartupFlowActions {
  // 阶段控制
  setCurrentPhase: (phase: StartupPhase) => void;
  nextPhase: () => void;
  
  // 版本检查
  setVersionCheckResult: (result: VersionCheckResult) => void;
  setVersionCheckCompleted: (completed: boolean) => void;

  // 首次启动检测
  setFirstLaunchDetected: (detected: boolean) => void;

  // 隐私政策同意
  setPrivacyConsentCompleted: (completed: boolean) => void;

  // 用户类型
  setUserType: (type: UserType) => void;
  setIsFirstLaunch: (isFirst: boolean) => void;

  // 激活状态
  setActivationStatus: (status: ActivationStatus) => void;
  setActivationVerified: (verified: boolean) => void;

  // 主应用和数据收集
  setMainAppEntered: (entered: boolean) => void;
  setDataCollectionStarted: (started: boolean) => void;
  
  // 用户设置
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  
  // 错误处理
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // 重试机制
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  
  // 重置状态
  resetStartupFlow: () => void;
  
  // 完成启动流程
  completeStartupFlow: () => void;
  
  // 阶段完成状态
  completePhase: (phase: StartupPhase) => void;
  isPhaseCompleted: (phase: StartupPhase) => boolean;
  getPhaseProgress: (phase: StartupPhase) => number;
  getPhaseDisplayName: (phase: StartupPhase) => string;
  canProceedToNextPhase: (phase: StartupPhase) => boolean;
  
  // 标记阶段完成
  markPrivacyConsentCompleted: () => void;
  markActivationCompleted: () => void;
  markFirstLaunchCompleted: () => void;
  markDataCollectionCompleted: () => void;
}

// 默认用户设置
const defaultUserSettings: UserSettings = {
  theme: 'auto',
  language: 'zh-CN',
  privacyConsent: false,
  dataCollectionConsent: false,
  analyticsConsent: false,
  isFirstLaunch: true,
};

// 初始状态
const initialState: StartupFlowState = {
  currentPhase: 'version-check',
  versionCheckCompleted: false,
  firstLaunchDetected: false,
  privacyConsentCompleted: false,
  activationVerified: false,
  mainAppEntered: false,
  dataCollectionStarted: false,
  userType: 'unknown',
  isFirstLaunch: false,
  versionCheckResult: null,
  activationStatus: null,
  userSettings: { ...defaultUserSettings },
  error: null,
  isLoading: false,
  retryCount: 0,
  maxRetries: 3,
};

// 阶段顺序映射
const phaseOrder: StartupPhase[] = [
  'version-check',
  'first-launch-detection',
  'privacy-consent',
  'activation-verification',
  'main-app',
  'data-collection',
  'completed'
];

export const useStartupFlowStore = create<StartupFlowState & StartupFlowActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 阶段控制
      setCurrentPhase: (phase: StartupPhase) => set({ currentPhase: phase }),
      
      nextPhase: () => {
        const currentPhase = get().currentPhase;
        const currentIndex = phaseOrder.indexOf(currentPhase);
        if (currentIndex < phaseOrder.length - 1) {
          const nextPhase = phaseOrder[currentIndex + 1];
          set({ currentPhase: nextPhase });
        }
      },

      // 版本检查
      setVersionCheckResult: (result: VersionCheckResult) =>
        set({ versionCheckResult: result }),

      setVersionCheckCompleted: (completed: boolean) =>
        set({ versionCheckCompleted: completed }),

      // 首次启动检测
      setFirstLaunchDetected: (detected: boolean) =>
        set({ firstLaunchDetected: detected }),

      // 隐私政策同意
      setPrivacyConsentCompleted: (completed: boolean) =>
        set({ privacyConsentCompleted: completed }),

      // 用户类型
      setUserType: (type: UserType) => set({ userType: type }),
      setIsFirstLaunch: (isFirst: boolean) => set({ isFirstLaunch: isFirst }),

      // 激活状态
      setActivationStatus: (status: ActivationStatus) =>
        set({ activationStatus: status }),

      setActivationVerified: (verified: boolean) =>
        set({ activationVerified: verified }),

      // 主应用和数据收集
      setMainAppEntered: (entered: boolean) =>
        set({ mainAppEntered: entered }),

      setDataCollectionStarted: (started: boolean) =>
        set({ dataCollectionStarted: started }),

      // 用户设置
      updateUserSettings: (settings: Partial<UserSettings>) =>
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings }
        })),

      // 错误处理
      setError: (error: string | null) => set({ error }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // 重试机制
      incrementRetryCount: () => 
        set((state) => ({ retryCount: state.retryCount + 1 })),
      
      resetRetryCount: () => set({ retryCount: 0 }),

      // 重置状态
      resetStartupFlow: () => set({ ...initialState }),

      // 完成启动流程
      completeStartupFlow: () => 
        set({ 
          currentPhase: 'completed',
          error: null,
          isLoading: false 
        }),
      
      // 阶段完成状态
      completePhase: (phase: StartupPhase) => 
        set((state) => {
          const updates: Partial<StartupFlowState> = {};
          
          switch (phase) {
            case 'version-check':
              updates.versionCheckCompleted = true;
              break;
            case 'first-launch-detection':
              updates.firstLaunchDetected = true;
              break;
            case 'privacy-consent':
              updates.privacyConsentCompleted = true;
              break;
            case 'activation-verification':
              updates.activationVerified = true;
              break;
            case 'main-app':
              updates.mainAppEntered = true;
              break;
            case 'data-collection':
              updates.dataCollectionStarted = true;
              break;
          }
          
          return updates;
        }),
      
      isPhaseCompleted: (phase: StartupPhase) => {
        const state = get();
        switch (phase) {
          case 'version-check':
            return state.versionCheckCompleted;
          case 'first-launch-detection':
            return state.firstLaunchDetected;
          case 'privacy-consent':
            return state.privacyConsentCompleted;
          case 'activation-verification':
            return state.activationVerified;
          case 'main-app':
            return state.mainAppEntered;
          case 'data-collection':
            return state.dataCollectionStarted;
          case 'completed':
            return state.currentPhase === 'completed';
          default:
            return false;
        }
      },
      
      getPhaseProgress: (phase: StartupPhase) => {
        const index = phaseOrder.indexOf(phase);
        return ((index + 1) / phaseOrder.length) * 100;
      },
      
      getPhaseDisplayName: (phase: StartupPhase) => {
        switch (phase) {
          case 'version-check':
            return '版本检查';
          case 'first-launch-detection':
            return '首次使用检测';
          case 'privacy-consent':
            return '隐私政策和用户协议';
          case 'activation-verification':
            return '激活码验证';
          case 'main-app':
            return '进入主页面';
          case 'data-collection':
            return '数据收集';
          case 'completed':
            return '启动完成';
          default:
            return '未知阶段';
        }
      },
      
      canProceedToNextPhase: (phase: StartupPhase) => {
        const state = get();
        switch (phase) {
          case 'version-check':
            return state.versionCheckCompleted;
          case 'first-launch-detection':
            return state.firstLaunchDetected;
          case 'privacy-consent':
            return state.privacyConsentCompleted;
          case 'activation-verification':
            return state.activationVerified;
          case 'main-app':
            return state.mainAppEntered;
          case 'data-collection':
            return state.dataCollectionStarted;
          case 'completed':
            return true;
          default:
            return false;
        }
      },
      
      // 标记阶段完成
      markPrivacyConsentCompleted: () => 
        set({ privacyConsentCompleted: true }),
      
      markActivationCompleted: () => 
        set({ activationVerified: true }),
      
      markFirstLaunchCompleted: () => 
        set({ firstLaunchDetected: true }),
      
      markDataCollectionCompleted: () => 
        set({ dataCollectionStarted: true }),
    }),
    {
      name: 'hout-startup-flow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userType: state.userType,
        isFirstLaunch: state.isFirstLaunch,
        userSettings: state.userSettings,
        activationStatus: state.activationStatus,
      }),
    }
  )
);

// 辅助函数：检查是否可以进入下一阶段
export const canProceedToNextPhase = (phase: StartupPhase, state: StartupFlowState): boolean => {
  switch (phase) {
    case 'version-check':
      return state.versionCheckCompleted;
    case 'first-launch-detection':
      return state.firstLaunchDetected;
    case 'privacy-consent':
      return state.privacyConsentCompleted;
    case 'activation-verification':
      return state.activationVerified;
    case 'main-app':
      return state.mainAppEntered;
    case 'data-collection':
      return state.dataCollectionStarted;
    case 'completed':
      return true;
    default:
      return false;
  }
};

// 辅助函数：获取阶段显示名称
export const getPhaseDisplayName = (phase: StartupPhase): string => {
  switch (phase) {
    case 'version-check':
      return '版本检查';
    case 'first-launch-detection':
      return '首次使用检测';
    case 'privacy-consent':
      return '隐私政策和用户协议';
    case 'activation-verification':
      return '激活码验证';
    case 'main-app':
      return '进入主页面';
    case 'data-collection':
      return '数据收集';
    case 'completed':
      return '启动完成';
    default:
      return '未知阶段';
  }
};

// 辅助函数：获取阶段进度百分比
export const getPhaseProgress = (phase: StartupPhase): number => {
  const index = phaseOrder.indexOf(phase);
  return ((index + 1) / phaseOrder.length) * 100;
};
