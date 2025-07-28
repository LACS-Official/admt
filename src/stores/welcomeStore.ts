import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  WelcomeState,
  WelcomeStep,
  ActivationStatus,
  UserConfiguration,
  AppConfig,
  DEFAULT_USER_CONFIG,
  DEFAULT_APP_CONFIG,
} from '../types/welcome';

interface WelcomeStore extends WelcomeState {
  // 状态更新方法
  setCurrentStep: (step: WelcomeStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUserConfig: (config: Partial<UserConfiguration>) => void;
  setActivationCode: (code: string) => void;
  setActivationStatus: (status: ActivationStatus) => void;
  
  // 业务方法
  nextStep: () => void;
  previousStep: () => void;
  resetWelcome: () => void;
  updateUserConfig: (key: keyof UserConfiguration, value: string | boolean) => void;
  
  // 验证方法
  validateCurrentStep: () => boolean;
  canProceedToNext: () => boolean;
}

interface AppConfigStore {
  config: AppConfig;
  
  // 配置管理方法
  setConfig: (config: Partial<AppConfig>) => void;
  setActivated: (activated: boolean) => void;
  setUserConfig: (userConfig: UserConfiguration) => void;
  updateActivationStatus: (status: ActivationStatus) => void;
  
  // 查询方法
  isActivated: () => boolean;
  needsActivation: () => boolean;
  isExpired: () => boolean;
  
  // 重置方法
  resetConfig: () => void;
}

// 欢迎页面状态管理
export const useWelcomeStore = create<WelcomeStore>((set, get) => ({
  // 初始状态
  currentStep: WelcomeStep.WELCOME,
  isLoading: false,
  error: null,
  userConfig: { ...DEFAULT_USER_CONFIG },
  activationCode: '',
  activationStatus: ActivationStatus.NOT_ACTIVATED,

  // 状态更新方法
  setCurrentStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUserConfig: (config) => set((state) => ({
    userConfig: { ...state.userConfig, ...config }
  })),
  setActivationCode: (code) => set({ activationCode: code }),
  setActivationStatus: (status) => set({ activationStatus: status }),

  // 业务方法
  nextStep: () => {
    const { currentStep, canProceedToNext } = get();
    if (!canProceedToNext()) return;

    const stepOrder = [
      WelcomeStep.WELCOME,
      WelcomeStep.ACTIVATION,
      WelcomeStep.COMPLETE
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1] });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    const stepOrder = [
      WelcomeStep.WELCOME,
      WelcomeStep.ACTIVATION,
      WelcomeStep.COMPLETE
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1] });
    }
  },

  resetWelcome: () => set({
    currentStep: WelcomeStep.WELCOME,
    isLoading: false,
    error: null,
    userConfig: { ...DEFAULT_USER_CONFIG },
    activationCode: '',
    activationStatus: ActivationStatus.NOT_ACTIVATED,
  }),

  updateUserConfig: (key, value) => set((state) => ({
    userConfig: { ...state.userConfig, [key]: value }
  })),

  // 验证方法
  validateCurrentStep: () => {
    const { currentStep, activationCode, activationStatus } = get();

    switch (currentStep) {
      case WelcomeStep.WELCOME:
        return true; // 欢迎页面无需验证
      case WelcomeStep.CONFIGURATION:
        return true; // 配置页面无需验证，直接跳过
      case WelcomeStep.ACTIVATION:
        return activationStatus === ActivationStatus.ACTIVATED ||
               !!(activationCode && activationCode.trim().length > 0);
      case WelcomeStep.COMPLETE:
        return true;
      default:
        return false;
    }
  },

  canProceedToNext: () => {
    const { validateCurrentStep } = get();
    return validateCurrentStep();
  },
}));

// 应用配置状态管理（持久化）
export const useAppConfigStore = create<AppConfigStore>()(
  persist(
    (set, get) => ({
      config: { ...DEFAULT_APP_CONFIG },

      // 配置管理方法
      setConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),

      setActivated: (activated) => set((state) => ({
        config: {
          ...state.config,
          isActivated: activated,
          activationStatus: activated ? ActivationStatus.ACTIVATED : ActivationStatus.NOT_ACTIVATED,
          activationDate: activated ? new Date() : undefined,
        }
      })),

      setUserConfig: (userConfig) => set((state) => ({
        config: { ...state.config, userConfig }
      })),

      updateActivationStatus: (status) => set((state) => ({
        config: { ...state.config, activationStatus: status }
      })),

      // 查询方法
      isActivated: () => {
        const { config } = get();
        const { isExpired } = get();

        // 检查基本激活状态
        if (!config.isActivated || config.activationStatus !== ActivationStatus.ACTIVATED) {
          return false;
        }

        // 检查是否过期
        if (isExpired()) {
          console.log('Activation has expired');
          return false;
        }

        return true;
      },

      needsActivation: () => {
        const { config } = get();
        const { isExpired } = get();

        // 如果没有激活或激活状态不正确，需要激活
        if (!config.isActivated || config.activationStatus !== ActivationStatus.ACTIVATED) {
          return true;
        }

        // 如果已过期，需要重新激活
        if (isExpired()) {
          console.log('Activation expired, needs reactivation');
          return true;
        }

        return false;
      },

      isExpired: () => {
        const { config } = get();
        if (!config.expiryDate) return false;
        return new Date() > new Date(config.expiryDate);
      },

      // 重置方法
      resetConfig: () => set({ config: { ...DEFAULT_APP_CONFIG } }),
    }),
    {
      name: 'hout-app-config', // 存储键名
      version: 1,
    }
  )
);
