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
  duration?: number; // 显示持续时间，毫秒（0 表示常驻，随页面生命周期清除）
  source?: string;   // 来源标识，例如 'home:demo' 或 'tools:image-flash'
}

// 全局下载状态
export interface GlobalDownloadStatus {
  taskId: string;
  fileName: string;
  progress: number; // 0 - 100
  status: 'downloading' | 'completed' | 'failed';
  speedText?: string;
  totalSizeText?: string;
}

interface AppStoreState extends AppState {
  notifications: NotificationMessage[];
  statusBarMessage: StatusBarMessage | null;
  globalDownload: GlobalDownloadStatus | null;
  navigationParams?: Record<string, any>; // 用于视图间传递参数
  setCurrentView: (view: AppView, params?: Record<string, any>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | undefined) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  addNotification: (notification: Omit<NotificationMessage, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setStatusBarMessage: (message: (Omit<StatusBarMessage, "id" | "timestamp"> & { source?: string }) | null) => void;
  clearStatusBarMessage: (source?: string) => void;
  setGlobalDownload: (status: GlobalDownloadStatus | null) => void;
  setNavigationParams: (params: Record<string, any> | undefined) => void;
  isWirelessDebuggingDialogOpen: boolean;
  setWirelessDebuggingDialogOpen: (open: boolean) => void;
  isCommandLineModalOpen: boolean;
  setCommandLineModalOpen: (open: boolean) => void;
  isLogsModalOpen: boolean;
  setLogsModalOpen: (open: boolean) => void;
  isDeviceSelectionModalOpen: boolean;
  setDeviceSelectionModalOpen: (open: boolean) => void;
  saveToDisk: () => Promise<boolean>;
  initialize: () => Promise<void>;
  subscribeToStorageChanges: () => () => void;
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
  monitorAutoCsvExport: true,
  cpuMonitorInterval: 1000,
  autoScreenMirror: false,
  overviewAutoRefresh: true,
  overviewRefreshInterval: 5000,
  ai: {
    enabled: false,
    provider: "openai",
    model: "",
    apiKey: "",
    endpoint: "https://api.openai.com/v1",
    temperature: 1.0,
  },
};

let isSyncingFromStorage = false;

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
      globalDownload: null,
      navigationParams: undefined,
      isWirelessDebuggingDialogOpen: false,
      isCommandLineModalOpen: false,
      isLogsModalOpen: false,
      isDeviceSelectionModalOpen: false,

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
        // 若外部显式传入 duration（如 0 表示常驻，随离开页面时清除），则优先生效。
        const defaultDurationByType: Record<StatusBarMessage['type'], number> = {
          info: 1500,
          success: 1500,
          warning: 5000,
          error: 5000,
        };

        const resolvedDuration =
          message.duration !== undefined ? message.duration : defaultDurationByType[message.type];

        const id = Date.now().toString();
        const newMessage: StatusBarMessage = {
          ...message,
          id,
          timestamp: new Date(),
          duration: resolvedDuration,
        };

        set({ statusBarMessage: newMessage });

        // 如果设置了持续时间且大于0，自动清除消息（如果是0，则常驻直到页面退出时清除）
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

      clearStatusBarMessage: (source?: string) => {
        set((state) => {
          if (!source) {
            return { statusBarMessage: null };
          }
          if (state.statusBarMessage?.source === source) {
            return { statusBarMessage: null };
          }
          return state;
        });
      },

      setGlobalDownload: (status: GlobalDownloadStatus | null) => set({ globalDownload: status }),

      setWirelessDebuggingDialogOpen: (open: boolean) => set({ isWirelessDebuggingDialogOpen: open }),
      setCommandLineModalOpen: (open: boolean) => {
        if (open) {
          set({ currentView: "command-line", isCommandLineModalOpen: false });
        } else {
          set({ isCommandLineModalOpen: false });
        }
      },
      setLogsModalOpen: (open: boolean) => {
        if (open) {
          set({ currentView: "logs", isLogsModalOpen: false });
        } else {
          set({ isLogsModalOpen: false });
        }
      },
      setDeviceSelectionModalOpen: (open: boolean) => set({ isDeviceSelectionModalOpen: open }),

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
            set((state) => {
              let aiConfig = userConfig.ai ? {
                ...state.config.ai,
                ...userConfig.ai
              } : state.config.ai;

              if (aiConfig.model === "gpt-3.5-turbo") {
                aiConfig = { ...aiConfig, model: "" };
              }

              return {
                config: {
                  ...state.config,
                  language: userConfig.language || state.config.language,
                  theme: userConfig.theme || state.config.theme,
                  autoStartEnabled: userConfig.autoStart ?? state.config.autoStartEnabled,
                  autoScreenMirror: userConfig.autoScreenMirror ?? state.config.autoScreenMirror,
                  ai: aiConfig
                }
              };
            });
          }
        } catch (error) {
          console.error("Failed to load config from disk:", error);
        }
        set({ isInitialized: true });
      },

      subscribeToStorageChanges: () => {
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === "hout-app-storage" && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              const currentState = get();
              const updates: Partial<AppStoreState> = {};
              
              if (JSON.stringify(newState.state.config) !== JSON.stringify(currentState.config)) {
                updates.config = newState.state.config;
              }
              if (newState.state.currentView !== currentState.currentView) {
                updates.currentView = newState.state.currentView;
              }
              
              if (Object.keys(updates).length > 0) {
                isSyncingFromStorage = true;
                set(updates);
                setTimeout(() => {
                  isSyncingFromStorage = false;
                }, 50);
                console.log('应用配置状态已从其他页面同步');
              }
            } catch (error) {
              console.error('Failed to parse app storage data:', error);
            }
          }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      },
    }),
    {
      name: "hout-app-storage",
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => {
          if (isSyncingFromStorage) {
            return;
          }
          localStorage.setItem(name, value);
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        config: state.config,
        currentView: state.currentView,
      }),
      merge: (persistedState: any, currentState) => {
        const aiConfig = {
          ...currentState.config.ai,
          ...(persistedState?.config?.ai || {}),
        };
        // 自动迁移已退役的 gpt-3.5-turbo 为空，由用户自定义选择
        if (aiConfig.model === "gpt-3.5-turbo") {
          aiConfig.model = "";
        }

        const mergedConfig = {
          ...currentState.config,
          ...(persistedState?.config || {}),
          ai: aiConfig,
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
