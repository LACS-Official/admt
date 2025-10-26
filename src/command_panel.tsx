import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import CommandExecutePanel from './components/Others/CommandExecutePanel';
import { useThemeStore } from './stores/themeStore';
import TitleBar from './components/Bar/TitleBarMini';
import StatusBar from './components/Bar/StatusBarMini'; 


function AppWithTheme() {
  const { isDarkMode, subscribeToStorageChanges } = useThemeStore();

  // 在主题切换时更新HTML和body元素的类名
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (isDarkMode) {
      htmlElement.classList.add('dark-mode');
      bodyElement.classList.add('dark-mode');
    } else {
      htmlElement.classList.remove('dark-mode');
      bodyElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // 监听跨页面的主题变化
  useEffect(() => {
    const cleanup = subscribeToStorageChanges();
    return cleanup;
  }, [subscribeToStorageChanges]);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme} className="app-container">
      <TitleBar/>
      <CommandExecutePanel />
      <StatusBar />
    </FluentProvider>
  );
}

// 创建根元素并渲染应用
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);