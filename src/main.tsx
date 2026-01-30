import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme, webDarkTheme, Theme } from "@fluentui/react-components";
import App from "./App";
import { useThemeStore } from "./stores/themeStore";
import { activationService } from "./services/activationService";
import { useStartupFlowStore } from "./stores/startupFlowStore";
import { usePrivacyConsentStore, shouldShowPrivacyConsent } from "./stores/privacyConsentStore";
import { useAppStore } from "./stores/appStore";
import { useTranslation } from "react-i18next";
import "./styles/global.css";
import "./styles/startup-animations.css";
import "./i18n/config";

// 导入安全保护模块，确保在应用启动时加载
import "./utils/securityProtection";
import "./utils/devtools";
import { convertFileSrc } from '@tauri-apps/api/core';

// 简单的品牌色生成器 (简化版，仅覆盖关键色值)
const adjustBrightness = (hex: string, percent: number): string => {
  // 简单的 HEX 颜色亮度调整
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
};

const createCustomTheme = (
  baseTheme: Theme, 
  accentColor: string,
  cornerRadius: 'small' | 'medium' | 'large',
  contentDensity: 'comfortable' | 'compact'
): Theme => {
  let theme = { ...baseTheme };
  
  // 1. 应用强调色 (覆写关键品牌色 Token)
  if (accentColor) {
    // 简单的 Hover/Pressed 变暗处理
    const hoverColor = adjustBrightness(accentColor, -10);
    const pressedColor = adjustBrightness(accentColor, -20);
    
    // 覆盖主要的品牌色 Token
    theme.colorBrandBackground = accentColor;
    theme.colorBrandBackgroundHover = hoverColor;
    theme.colorBrandBackgroundPressed = pressedColor;
    theme.colorBrandBackgroundSelected = accentColor;
    
    theme.colorCompoundBrandBackground = accentColor;
    theme.colorCompoundBrandBackgroundHover = hoverColor;
    theme.colorCompoundBrandBackgroundPressed = pressedColor;
    
    theme.colorBrandForeground1 = accentColor;
    theme.colorBrandForeground2 = accentColor;
    theme.colorBrandForegroundLink = accentColor;
    theme.colorBrandForegroundLinkHover = hoverColor;
    theme.colorBrandForegroundLinkPressed = pressedColor;
    theme.colorBrandForegroundLinkSelected = accentColor;
    
    theme.colorBrandStroke1 = accentColor;
    theme.colorBrandStroke2 = accentColor;
    theme.colorBrandStroke2Hover = hoverColor;
    theme.colorBrandStroke2Pressed = pressedColor;
  }
  
  // 2. 应用圆角设置
  if (cornerRadius === 'small') {
     theme.borderRadiusSmall = '0px';
     theme.borderRadiusMedium = '2px';
     theme.borderRadiusLarge = '4px';
     theme.borderRadiusXLarge = '6px';
  } else if (cornerRadius === 'large') {
     theme.borderRadiusSmall = '4px';
     theme.borderRadiusMedium = '8px';
     theme.borderRadiusLarge = '12px';
     theme.borderRadiusXLarge = '16px';
  }
  // medium is default
  
  // 3. 应用密度设置 (简单的 spacing 调整)
  if (contentDensity === 'compact') {
     // 减少间距
     theme.spacingHorizontalS = '4px';
     theme.spacingHorizontalM = '8px';
     theme.spacingHorizontalL = '12px';
     theme.spacingVerticalS = '4px';
     theme.spacingVerticalM = '8px';
     theme.spacingVerticalL = '12px';
  }

  return theme;
};
// 在应用启动时清除 localStorage 中的 token
localStorage.removeItem('rom-download-storage');
console.log('已清除 localStorage 中的 rom-download-storage');

console.log('已清除 localStorage 中的 rom-download-storage');

function AppWithTheme() {
  const { isDarkMode, followSystemTheme, updateThemeBasedOnSystem, subscribeToStorageChanges, accentColor, contentDensity, cornerRadius } = useThemeStore();
  const { config } = useAppStore();
  const { i18n } = useTranslation();
  const [isActivationValid, setIsActivationValid] = useState(true);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true);
  const { setCurrentPhase } = useStartupFlowStore();
  const { hasCompletedPrivacySetup, hasAcceptedPrivacyPolicy, hasAcceptedUserAgreement } = usePrivacyConsentStore();

  // 同步配置中的语言设置到 i18n
  useEffect(() => {
    if (config.language && i18n.language !== config.language) {
       i18n.changeLanguage(config.language);
    }
  }, [config.language, i18n]);

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

  // 监听跨页面的主题变化
  useEffect(() => {
    const cleanup = subscribeToStorageChanges();
    return cleanup;
  }, [subscribeToStorageChanges]);

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

  // 检查用户是否同意政策条款
  useEffect(() => {
    const checkTermsAcceptance = () => {
      try {
        // 检查是否需要显示隐私政策同意界面
        const needsToShowConsent = shouldShowPrivacyConsent();
        
        // 或者直接检查是否已完成隐私设置且已同意所有必要条款
        const hasAcceptedAllTerms = hasCompletedPrivacySetup && 
                                  hasAcceptedPrivacyPolicy && 
                                  hasAcceptedUserAgreement;
        
        console.log('检查政策条款同意状态:', {
          needsToShowConsent,
          hasCompletedPrivacySetup,
          hasAcceptedPrivacyPolicy,
          hasAcceptedUserAgreement,
          hasAcceptedAllTerms
        });
        
        if (needsToShowConsent || !hasAcceptedAllTerms) {
          if (hasAcceptedTerms !== false) { // 只有状态发生变化时才更新并记录日志
            console.log('状态更新: 用户未同意政策条款，显示政策条款页面');
            setHasAcceptedTerms(false);
          }
          // 设置启动流程状态为隐私政策同意阶段
          setCurrentPhase('privacy-consent');
        } else {
          if (hasAcceptedTerms !== true) { // 只有状态发生变化时才更新并记录日志
            console.log('状态更新: 用户已同意政策条款，显示主应用界面');
            setHasAcceptedTerms(true);
          }
        }
      } catch (error) {
        console.error('检查政策条款同意状态失败:', error);
        // 如果检查失败，默认认为用户未同意
        if (hasAcceptedTerms !== false) {
          console.log('状态更新: 检查失败，默认用户未同意政策条款');
          setHasAcceptedTerms(false);
        }
        setCurrentPhase('privacy-consent');
      }
    };

    // 立即执行一次检查
    checkTermsAcceptance();

    // 由于隐私政策同意状态通常在用户交互后才会改变，这里不设置定时器
    // 但会依赖相关状态的变化来重新检查
  }, [setCurrentPhase, hasCompletedPrivacySetup, hasAcceptedPrivacyPolicy, hasAcceptedUserAgreement, hasAcceptedTerms]);

  // 监听相关状态
  useEffect(() => {
    // 这里可以处理其他副作用
  }, []);

  // 生成自定义主题
  const theme = React.useMemo(() => {
    return createCustomTheme(
      isDarkMode ? webDarkTheme : webLightTheme,
      accentColor,
      cornerRadius,
      contentDensity
    );
  }, [isDarkMode, accentColor, cornerRadius, contentDensity]);

  // 如果激活码无效，显示激活页面
  if (!isActivationValid) {
    // 通过修改全局状态来控制显示激活页面
    // 这里我们仍然渲染App组件，但通过useStartupFlowStore来控制显示激活页面
    return (
      <FluentProvider 
        theme={theme}
      >
        <App />
      </FluentProvider>
    );
  }
  
  // 如果用户未同意政策条款，则显示政策条款页面
  if (!hasAcceptedTerms) {
    // 通过修改全局状态来控制显示政策条款页面
    // 这里我们仍然渲染App组件，但通过useStartupFlowStore来控制显示政策条款页面
    return (
      <FluentProvider 
        theme={theme}
      >
        <App />
      </FluentProvider>
    );
  }

  return (
    <FluentProvider 
      theme={theme}
    >
      <App />
    </FluentProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);