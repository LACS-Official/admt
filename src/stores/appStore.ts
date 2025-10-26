import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppState, AppView, AppConfig, NotificationMessage } from "../types/app";

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
  setCurrentView: (view: AppView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | undefined) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  addNotification: (notification: Omit<NotificationMessage, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setStatusBarMessage: (message: Omit<StatusBarMessage, "id" | "timestamp"> | null) => void;
  clearStatusBarMessage: () => void;
  initialize: () => void;
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

      setCurrentView: (view: AppView) => set({ currentView: view }),

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

      initialize: () => set({ isInitialized: true }),
    }),
    {
      name: "hout-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        currentView: state.currentView,
      }),
    }
  )
);
