import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  followSystemTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setFollowSystemTheme: (follow: boolean) => void;
  updateThemeBasedOnSystem: () => void;
  subscribeToStorageChanges: () => () => void; // 返回清理函数
}

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
      subscribeToStorageChanges: () => {
        // 监听storage变化事件，实现跨页面主题同步
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === "hout-theme-storage" && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              const currentState = get();
              
              // 只有当主题状态确实发生变化时才更新
              if (newState.state.isDarkMode !== currentState.isDarkMode) {
                set({ isDarkMode: newState.state.isDarkMode });
                console.log('主题状态已从其他页面同步:', newState.state.isDarkMode ? '暗黑模式' : '亮色模式');
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);
