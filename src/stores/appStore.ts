import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppState, AppView, AppConfig, NotificationMessage } from "../types/app";

interface AppStoreState extends AppState {
  notifications: NotificationMessage[];
  setCurrentView: (view: AppView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | undefined) => void;
  updateConfig: (config: Partial<AppConfig>) => void;
  addNotification: (notification: Omit<NotificationMessage, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  initialize: () => void;
}

const defaultConfig: AppConfig = {
  theme: "light",
  language: "zh-CN",
  autoDetectDevices: true,
  scanInterval: 2000,
  logLevel: "info",
};

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      config: defaultConfig,
      currentView: "device-info",
      isLoading: false,
      error: undefined,
      notifications: [],

      setCurrentView: (view: AppView) => set({ currentView: view }),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | undefined) => set({ error }),

      updateConfig: (configUpdates: Partial<AppConfig>) =>
        set((state) => ({
          config: { ...state.config, ...configUpdates },
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

        // 自动移除通知
        if (notification.autoClose !== false) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

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
