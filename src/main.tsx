import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import App from "./App";
import { useThemeStore } from "./stores/themeStore";
import { activationService } from "./services/activationService";
import { useStartupFlowStore } from "./stores/startupFlowStore";
import "./styles/global.css";
import "./styles/startup-animations.css";

function AppWithTheme() {
  const { isDarkMode, followSystemTheme, updateThemeBasedOnSystem } = useThemeStore();
  const [isActivationValid, setIsActivationValid] = useState(true);
  const { setCurrentPhase } = useStartupFlowStore();

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

  // 每隔1秒检测激活码是否过期
  useEffect(() => {
    const checkActivationStatus = () => {
      try {
        const activationStatus = activationService.checkActivationStatus();
        
        // 如果激活码过期或需要激活，则跳转到激活页面
        if (activationStatus.isExpired || activationStatus.needsActivation) {
          console.log('检测到激活码过期或需要激活:', activationStatus.expiredReason || '需要激活');
          setIsActivationValid(false);
          
          // 设置启动流程状态为激活验证阶段
          setCurrentPhase('activation-verification');
          
          // 如果是过期状态，清除过期数据
          if (activationStatus.isExpired) {
            activationService.handleExpiredActivation();
          }
        } else {
          setIsActivationValid(true);
        }
      } catch (error) {
        console.error('检查激活状态失败:', error);
        // 如果检查失败，默认认为激活无效
        setIsActivationValid(false);
        setCurrentPhase('activation-verification');
      }
    };

    // 立即执行一次检查
    checkActivationStatus();

    // 设置定时器，每隔1秒检查一次
    const intervalId = setInterval(checkActivationStatus, 1000);

    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [setCurrentPhase]);

  // 如果激活码无效，显示激活页面
  if (!isActivationValid) {
    // 通过修改全局状态来控制显示激活页面
    // 这里我们仍然渲染App组件，但通过useStartupFlowStore来控制显示激活页面
    return (
      <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
        <App />
      </FluentProvider>
    );
  }

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