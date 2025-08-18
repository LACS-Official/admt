/**
 * 隐私政策同意状态管理
 * 管理用户对隐私政策、用户协议和数据收集的同意状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 隐私政策版本
export const PRIVACY_POLICY_VERSION = '1.0.0';
export const USER_AGREEMENT_VERSION = '1.0.0';

// 数据收集类型定义
export interface DataCollectionTypes {
  deviceData: boolean;        // 设备信息数据
  userBehavior: boolean;      // 用户行为数据
  analytics: boolean;         // 匿名分析数据
  crashReporting: boolean;    // 崩溃报告
  performanceMetrics: boolean; // 性能指标
}

// 隐私政策同意状态
export interface PrivacyConsentState {
  // 基本同意状态
  hasAcceptedPrivacyPolicy: boolean;
  hasAcceptedUserAgreement: boolean;
  hasAcceptedDataCollection: boolean;
  
  // 详细数据收集权限
  dataCollectionTypes: DataCollectionTypes;
  
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
  
  // 首次启动和设置完成标识
  isFirstLaunch: boolean;
  hasCompletedPrivacySetup: boolean;
  
  // 强制退出标识
  shouldExitApp: boolean;
}

// 隐私政策操作
export interface PrivacyConsentActions {
  // 基本同意操作
  acceptPrivacyPolicy: () => void;
  acceptUserAgreement: () => void;
  acceptDataCollection: () => void;
  
  // 撤销操作
  revokePrivacyPolicy: () => void;
  revokeUserAgreement: () => void;
  revokeDataCollection: () => void;
  
  // 数据收集类型控制
  updateDataCollectionTypes: (types: Partial<DataCollectionTypes>) => void;
  
  // 批量操作
  acceptAll: () => void;
  revokeAll: () => void;
  
  // 状态检查
  canCollectData: () => boolean;
  canCollectDeviceData: () => boolean;
  canCollectUserBehavior: () => boolean;
  canCollectAnalytics: () => boolean;
  
  // 设置操作
  completePrivacySetup: () => void;
  setFirstLaunch: (isFirst: boolean) => void;
  setShouldExitApp: (shouldExit: boolean) => void;
  
  // 重置操作
  resetPrivacyConsent: () => void;
  
  // 版本更新检查
  checkVersionUpdates: () => boolean;
  updateToLatestVersions: () => void;
}

// 默认数据收集类型设置
const defaultDataCollectionTypes: DataCollectionTypes = {
  deviceData: false,
  userBehavior: false,
  analytics: false,
  crashReporting: false,
  performanceMetrics: false,
};

// 初始状态
const initialState: PrivacyConsentState = {
  hasAcceptedPrivacyPolicy: false,
  hasAcceptedUserAgreement: false,
  hasAcceptedDataCollection: false,
  
  dataCollectionTypes: { ...defaultDataCollectionTypes },
  
  privacyPolicyVersion: PRIVACY_POLICY_VERSION,
  userAgreementVersion: USER_AGREEMENT_VERSION,
  
  isFirstLaunch: true,
  hasCompletedPrivacySetup: false,
  shouldExitApp: false,
};

export const usePrivacyConsentStore = create<PrivacyConsentState & PrivacyConsentActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 基本同意操作
      acceptPrivacyPolicy: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedPrivacyPolicy: true,
          privacyPolicyAcceptedAt: now,
          privacyPolicyRevokedAt: undefined,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        });
        console.log('✅ 用户已同意隐私政策');
      },

      acceptUserAgreement: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedUserAgreement: true,
          userAgreementAcceptedAt: now,
          userAgreementRevokedAt: undefined,
          userAgreementVersion: USER_AGREEMENT_VERSION,
        });
        console.log('✅ 用户已同意用户协议');
      },

      acceptDataCollection: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedDataCollection: true,
          dataCollectionAcceptedAt: now,
          dataCollectionRevokedAt: undefined,
          // 默认启用基本的数据收集
          dataCollectionTypes: {
            deviceData: true,
            userBehavior: true,
            analytics: true,
            crashReporting: true,
            performanceMetrics: false,
          },
        });
        console.log('✅ 用户已同意数据收集');
      },

      // 撤销操作
      revokePrivacyPolicy: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedPrivacyPolicy: false,
          privacyPolicyRevokedAt: now,
          shouldExitApp: true,
        });
        console.log('❌ 用户已撤销隐私政策同意');
      },

      revokeUserAgreement: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedUserAgreement: false,
          userAgreementRevokedAt: now,
          shouldExitApp: true,
        });
        console.log('❌ 用户已撤销用户协议同意');
      },

      revokeDataCollection: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedDataCollection: false,
          dataCollectionRevokedAt: now,
          dataCollectionTypes: { ...defaultDataCollectionTypes },
          shouldExitApp: true,
        });
        console.log('❌ 用户已撤销数据收集同意');
      },

      // 数据收集类型控制
      updateDataCollectionTypes: (types: Partial<DataCollectionTypes>) => {
        const currentState = get();
        if (!currentState.hasAcceptedDataCollection) {
          console.warn('⚠️ 用户未同意数据收集，无法更新数据收集类型');
          return;
        }
        
        set((state) => ({
          dataCollectionTypes: { ...state.dataCollectionTypes, ...types }
        }));
        console.log('🔄 数据收集类型已更新:', types);
      },

      // 批量操作
      acceptAll: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedPrivacyPolicy: true,
          hasAcceptedUserAgreement: true,
          hasAcceptedDataCollection: true,
          privacyPolicyAcceptedAt: now,
          userAgreementAcceptedAt: now,
          dataCollectionAcceptedAt: now,
          privacyPolicyRevokedAt: undefined,
          userAgreementRevokedAt: undefined,
          dataCollectionRevokedAt: undefined,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          userAgreementVersion: USER_AGREEMENT_VERSION,
          dataCollectionTypes: {
            deviceData: true,
            userBehavior: true,
            analytics: true,
            crashReporting: true,
            performanceMetrics: false,
          },
          shouldExitApp: false,
        });
        console.log('✅ 用户已同意所有条款');
      },

      revokeAll: () => {
        const now = new Date().toISOString();
        set({
          hasAcceptedPrivacyPolicy: false,
          hasAcceptedUserAgreement: false,
          hasAcceptedDataCollection: false,
          privacyPolicyRevokedAt: now,
          userAgreementRevokedAt: now,
          dataCollectionRevokedAt: now,
          dataCollectionTypes: { ...defaultDataCollectionTypes },
          shouldExitApp: true,
        });
        console.log('❌ 用户已撤销所有同意');
      },

      // 状态检查
      canCollectData: () => {
        const state = get();
        return state.hasAcceptedPrivacyPolicy && 
               state.hasAcceptedUserAgreement && 
               state.hasAcceptedDataCollection;
      },

      canCollectDeviceData: () => {
        const state = get();
        return state.canCollectData() && state.dataCollectionTypes.deviceData;
      },

      canCollectUserBehavior: () => {
        const state = get();
        return state.canCollectData() && state.dataCollectionTypes.userBehavior;
      },

      canCollectAnalytics: () => {
        const state = get();
        return state.canCollectData() && state.dataCollectionTypes.analytics;
      },

      // 设置操作
      completePrivacySetup: () => {
        set({
          hasCompletedPrivacySetup: true,
          isFirstLaunch: false,
        });
        console.log('✅ 隐私设置已完成');
      },

      setFirstLaunch: (isFirst: boolean) => {
        set({ isFirstLaunch: isFirst });
      },

      setShouldExitApp: (shouldExit: boolean) => {
        set({ shouldExitApp: shouldExit });
      },

      // 重置操作
      resetPrivacyConsent: () => {
        set({ ...initialState });
        console.log('🔄 隐私同意状态已重置');
      },

      // 版本更新检查
      checkVersionUpdates: () => {
        const state = get();
        return state.privacyPolicyVersion !== PRIVACY_POLICY_VERSION ||
               state.userAgreementVersion !== USER_AGREEMENT_VERSION;
      },

      updateToLatestVersions: () => {
        set({
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          userAgreementVersion: USER_AGREEMENT_VERSION,
          // 版本更新时需要重新同意
          hasAcceptedPrivacyPolicy: false,
          hasAcceptedUserAgreement: false,
          hasCompletedPrivacySetup: false,
        });
        console.log('🔄 隐私政策版本已更新，需要重新同意');
      },
    }),
    {
      name: 'hout-privacy-consent-storage',
      storage: createJSONStorage(() => localStorage),
      // 持久化所有状态
      partialize: (state) => ({
        hasAcceptedPrivacyPolicy: state.hasAcceptedPrivacyPolicy,
        hasAcceptedUserAgreement: state.hasAcceptedUserAgreement,
        hasAcceptedDataCollection: state.hasAcceptedDataCollection,
        dataCollectionTypes: state.dataCollectionTypes,
        privacyPolicyAcceptedAt: state.privacyPolicyAcceptedAt,
        userAgreementAcceptedAt: state.userAgreementAcceptedAt,
        dataCollectionAcceptedAt: state.dataCollectionAcceptedAt,
        privacyPolicyRevokedAt: state.privacyPolicyRevokedAt,
        userAgreementRevokedAt: state.userAgreementRevokedAt,
        dataCollectionRevokedAt: state.dataCollectionRevokedAt,
        privacyPolicyVersion: state.privacyPolicyVersion,
        userAgreementVersion: state.userAgreementVersion,
        isFirstLaunch: state.isFirstLaunch,
        hasCompletedPrivacySetup: state.hasCompletedPrivacySetup,
      }),
    }
  )
);

// 辅助函数：检查是否需要显示隐私政策同意界面
export const shouldShowPrivacyConsent = (): boolean => {
  const state = usePrivacyConsentStore.getState();

  console.log('🔍 检查是否需要显示隐私政策同意界面:', {
    isFirstLaunch: state.isFirstLaunch,
    hasCompletedPrivacySetup: state.hasCompletedPrivacySetup,
    hasAcceptedPrivacyPolicy: state.hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement: state.hasAcceptedUserAgreement,
    hasAcceptedDataCollection: state.hasAcceptedDataCollection,
    privacyPolicyVersion: state.privacyPolicyVersion,
    userAgreementVersion: state.userAgreementVersion,
  });

  // 检查版本更新
  const hasVersionUpdates = state.checkVersionUpdates();
  if (hasVersionUpdates) {
    console.log('📋 检测到版本更新，需要重新同意隐私政策');
    return true;
  }

  // 检查是否所有必需的同意都已完成
  const allAccepted = state.hasAcceptedPrivacyPolicy &&
                     state.hasAcceptedUserAgreement &&
                     state.hasAcceptedDataCollection;

  // 如果未完成隐私设置或任何一项未同意，需要显示
  const needsConsent = !state.hasCompletedPrivacySetup || !allAccepted;

  console.log('🔍 隐私政策检查结果:', {
    hasVersionUpdates,
    allAccepted,
    needsConsent,
    shouldShow: needsConsent
  });

  return needsConsent;
};

// 辅助函数：检查是否应该退出应用
export const shouldExitApplication = (): boolean => {
  const state = usePrivacyConsentStore.getState();
  return state.shouldExitApp;
};
