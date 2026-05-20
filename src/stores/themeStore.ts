import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  followSystemTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setFollowSystemTheme: (follow: boolean) => void;
  updateThemeBasedOnSystem: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  contentDensity: 'comfortable' | 'compact';
  setContentDensity: (density: 'comfortable' | 'compact') => void;
  cornerRadius: 'small' | 'medium' | 'large';
  setCornerRadius: (radius: 'small' | 'medium' | 'large') => void;
  showConfetti: boolean;
  setShowConfetti: (show: boolean) => void;
  showTitleBarButtons: boolean;
  setShowTitleBarButtons: (show: boolean) => void;
  subscribeToStorageChanges: () => () => void; // 返回清理函数
}

let isSyncingFromStorage = false;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      followSystemTheme: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (isDark: boolean) => set({ isDarkMode: isDark }),
      setFollowSystemTheme: (follow: boolean) => set({ followSystemTheme: follow }),
      updateThemeBasedOnSystem: () => {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        set({ isDarkMode: systemPrefersDark });
      },
      accentColor: "#0078d4",
      setAccentColor: (color: string) => set({ accentColor: color }),
      contentDensity: 'comfortable',
      setContentDensity: (density: 'comfortable' | 'compact') => set({ contentDensity: density }),
      cornerRadius: 'medium',
      setCornerRadius: (radius: 'small' | 'medium' | 'large') => set({ cornerRadius: radius }),
      showConfetti: true,
      setShowConfetti: (show: boolean) => set({ showConfetti: show }),
      showTitleBarButtons: true,
      setShowTitleBarButtons: (show: boolean) => set({ showTitleBarButtons: show }),
      subscribeToStorageChanges: () => {
        // 监听storage变化事件，实现跨页面主题同步
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === "hout-theme-storage" && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              const currentState = get();
              const updates: Partial<ThemeState> = {};
              
              // 只有当主题状态确实发生变化时才更新
              if (newState.state.isDarkMode !== currentState.isDarkMode) {
                updates.isDarkMode = newState.state.isDarkMode;
              }
              if (newState.state.accentColor !== currentState.accentColor) {
                updates.accentColor = newState.state.accentColor;
              }
              if (newState.state.contentDensity !== currentState.contentDensity) {
                updates.contentDensity = newState.state.contentDensity;
              }
              if (newState.state.cornerRadius !== currentState.cornerRadius) {
                updates.cornerRadius = newState.state.cornerRadius;
              }
              if (newState.state.showConfetti !== currentState.showConfetti) {
                updates.showConfetti = newState.state.showConfetti;
              }
              if (newState.state.showTitleBarButtons !== currentState.showTitleBarButtons) {
                updates.showTitleBarButtons = newState.state.showTitleBarButtons;
              }

              if (Object.keys(updates).length > 0) {
                isSyncingFromStorage = true;
                set(updates);
                setTimeout(() => {
                  isSyncingFromStorage = false;
                }, 50);
              }
            } catch (error) {
              console.error('解析主题存储数据失败:', error);
            }
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // 返回清理函数
        return () => {
          window.removeEventListener('storage', handleStorageChange);
        };
      }
    }),
    {
      name: "hout-theme-storage",
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
    }
  )
);
