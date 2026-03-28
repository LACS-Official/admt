import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppState, AppView, AppConfig, NotificationMessage } from "../types/app";
import { invoke } from "@tauri-apps/api/core";

// 状态栏消息类型
export interface StatusBarMessage {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  icon?: React.ReactNode;
  timestamp: Date;
  duration?: number; // 显示持续时间，毫秒
}

interface AppStoreState extends AppState {
  notifications: NotificationMessage[];
  statusBarMessage: StatusBarMessage | null;
  navigationParams?: Record<string, any>; // 用于视图间传递参数
  setCurrentView: (view: AppView, params?: Record<string, any>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | undefined) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  addNotification: (notification: Omit<NotificationMessage, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setStatusBarMessage: (message: Omit<StatusBarMessage, "id" | "timestamp"> | null) => void;
  clearStatusBarMessage: () => void;
  setNavigationParams: (params: Record<string, any> | undefined) => void;
  isWirelessDebuggingDialogOpen: boolean;
  setWirelessDebuggingDialogOpen: (open: boolean) => void;
  saveToDisk: () => Promise<boolean>;
  initialize: () => Promise<void>;
}

const defaultConfig: AppConfig = {
  theme: "light",
  language: "zh-CN",
  autoDetectDevices: true,
  scanInterval: 2000,
  deviceDetectionInterval: 5000,
  logLevel: "info",
  systemTrayEnabled: true,
  autoStartEnabled: false,
  minimizeToTrayOnClose: true,
  startMinimizedToTray: false,
  soundEnabled: true,
  carouselInterval: 8000,
  globalSearchHotkey: 'Ctrl+K',
  monitorAutoStart: true,
  monitorAutoCsvExport: false,
  cpuMonitorInterval: 1000,
  autoScreenMirror: false,
  ai: {
    enabled: false,
    provider: "openai",
    model: "gpt-3.5-turbo",
    apiKey: "",
    endpoint: "https://api.openai.com/v1",
    temperature: 0.7,
  },
};

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      config: { ...defaultConfig },
      currentView: "home",
      isLoading: false,
      error: undefined,
      notifications: [],
      statusBarMessage: null,
      navigationParams: undefined,
      isWirelessDebuggingDialogOpen: false,

      setCurrentView: (view: AppView, params?: Record<string, any>) => set({ currentView: view, navigationParams: params }),
      setNavigationParams: (params: Record<string, any> | undefined) => set({ navigationParams: params }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | undefined) => set({ error }),

      updateConfig: (configUpdates: Partial<AppConfig>) =>
        set((state) => ({
          config: {
            ...defaultConfig,
            ...state.config,
            ...configUpdates
          },
        })),

      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification: NotificationMessage = {
          ...notification,
          id,
          timestamp: new Date(),
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // 注释掉自动移除逻辑，由StatusBar组件手动管理
        // if (notification.autoClose !== false) {
        //   const duration = notification.duration || 5000;
        //   setTimeout(() => {
        //     get().removeNotification(id);
        //   }, duration);
        // }
      },

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setStatusBarMessage: (message) => {
        if (message === null) {
          set({ statusBarMessage: null });
          return;
        }

        // 根据 type 自动匹配默认持续时间（毫秒）。
        // 若外部已显式传入 duration，则优先生效，不会被覆盖。
        const defaultDurationByType: Record<StatusBarMessage['type'], number> = {
          info: 1500,
          success: 1500,
          warning: 5000,
          error: 5000,
        };

        const resolvedDuration =
          message.duration ?? defaultDurationByType[message.type];

        const id = Date.now().toString();
        const newMessage: StatusBarMessage = {
          ...message,
          id,
          timestamp: new Date(),
          // 应用自动匹配的持续时间（可被外部传入覆盖）
          duration: resolvedDuration,
        };

        set({ statusBarMessage: newMessage });

        // 如果设置了持续时间，自动清除消息
        if (newMessage.duration && newMessage.duration > 0) {
          setTimeout(() => {
            set((state) => {
              // 只有当前消息ID匹配时才清除，避免清除新消息
              if (state.statusBarMessage?.id === id) {
                return { statusBarMessage: null };
              }
              return state;
            });
          }, newMessage.duration);
        }
      },

      clearStatusBarMessage: () => set({ statusBarMessage: null }),

      setWirelessDebuggingDialogOpen: (open: boolean) => set({ isWirelessDebuggingDialogOpen: open }),

      saveToDisk: async () => {
        const state = get();
        try {
          // 转换格式以匹配后端 AppConfig
          const backendConfig = {
            isActivated: false,
            activationStatus: "not_activated",
            userConfig: {
              username: "User",
              language: state.config.language,
              theme: state.config.theme,
              autoStart: state.config.autoStartEnabled,
              autoScreenMirror: state.config.autoScreenMirror,
              checkUpdates: true,
              enableTelemetry: true,
              ai: {
                enabled: state.config.ai.enabled,
                provider: state.config.ai.provider,
                model: state.config.ai.model,
                apiKey: state.config.ai.apiKey,
                endpoint: state.config.ai.endpoint,
                temperature: state.config.ai.temperature,
              }
            },
            version: "1.0.0",
            features: []
          };
          
          return await invoke<boolean>("save_app_config", { config: backendConfig });
        } catch (error) {
          console.error("Failed to save config to disk:", error);
          return false;
        }
      },

      initialize: async () => {
        try {
          // 从后端加载配置
          const savedConfig = await invoke<any>("get_app_config");
          if (savedConfig && savedConfig.userConfig) {
            const userConfig = savedConfig.userConfig;
            set((state) => ({
              config: {
                ...state.config,
                language: userConfig.language || state.config.language,
                theme: userConfig.theme || state.config.theme,
                autoStartEnabled: userConfig.autoStart ?? state.config.autoStartEnabled,
                autoScreenMirror: userConfig.autoScreenMirror ?? state.config.autoScreenMirror,
                ai: userConfig.ai ? {
                  ...state.config.ai,
                  ...userConfig.ai
                } : state.config.ai
              }
            }));
          }
        } catch (error) {
          console.error("Failed to load config from disk:", error);
        }
        set({ isInitialized: true });
      },
    }),
    {
      name: "hout-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        currentView: state.currentView,
      }),
      merge: (persistedState: any, currentState) => {
        const mergedConfig = {
          ...currentState.config,
          ...(persistedState?.config || {}),
          // 确保 AI 配置存在并合并
          ai: {
            ...currentState.config.ai,
            ...(persistedState?.config?.ai || {}),
          }
        };
        
        return {
          ...currentState,
          ...persistedState,
          config: mergedConfig,
        };
      },
    }
  )
);
