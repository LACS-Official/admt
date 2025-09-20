import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import App from "./App";
import { useThemeStore } from "./stores/themeStore";
import "./styles/global.css";
import "./styles/startup-animations.css";

function AppWithTheme() {
  const { isDarkMode, followSystemTheme, updateThemeBasedOnSystem } = useThemeStore();

  // 监听系统主题变化
  useEffect(() => {
    if (followSystemTheme) {
      // 初始化时根据系统主题设置
      updateThemeBasedOnSystem();
      
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => updateThemeBasedOnSystem();
      
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [followSystemTheme, updateThemeBasedOnSystem]);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <App />
    </FluentProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);