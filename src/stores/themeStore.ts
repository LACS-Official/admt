import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeState {
  isDarkMode: boolean;
  followSystemTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setFollowSystemTheme: (follow: boolean) => void;
  updateThemeBasedOnSystem: () => void;
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
      }
    }),
    {
      name: "hout-theme-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
