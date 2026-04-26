/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  FluentProvider,
  createLightTheme,
  createDarkTheme,
  BrandVariants,
  Theme,
} from "@fluentui/react-components";
import App from "./App";
import { useAppStore } from "./stores/appStore";
import { useThemeStore } from "./stores/themeStore";
import { activationService } from "./services/activationService";
import { useStartupFlowStore } from "./stores/startupFlowStore";
import {
  usePrivacyConsentStore,
  shouldShowPrivacyConsent,
} from "./stores/privacyConsentStore";
import "./styles/global.css";
import "./styles/startup-animations.css";

// 导入安全保护模块，确保在应用启动时加载
import "./utils/securityProtection";
import "./utils/devtools";
import i18n from "./i18n/config";

// 在应用启动时清除 localStorage 中的 token
localStorage.removeItem("rom-download-storage");

import CommandLineWindow from "./components/Console/CommandLineWindow";
import LogsWindow from "./components/Console/LogsWindow";
import AIChatWindow from "./components/Console/AIChatWindow";
import DeviceSelectionWindow from "./components/MainContent/DeviceSelectionWindow";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useDeviceStore } from "./stores/deviceStore";
import { useAIChatStore } from "./stores/aiChatStore";

// 辅助函数：根据十六进制颜色生成品牌色阶 (BrandVariants)
const generateBrandVariants = (hex: string): BrandVariants => {
  // 十六进制转 HSL
  const hexToHsl = (hexStr: string) => {
    const r = parseInt(hexStr.slice(1, 3), 16) / 255;
    const g = parseInt(hexStr.slice(3, 5), 16) / 255;
    const b = parseInt(hexStr.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else if (max === b) h = (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  };

  // HSL 转 十六进制
  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const [h, s, bl] = hexToHsl(hex);
  
  // 修正后的 Fluent UI v9 标准：10 是最深，160 是最浅
  const lightnessLevels = {
    10: 10, 20: 15, 30: 23, 40: 29, 50: 35, 60: 41, 70: 47, 80: 53, 
    90: 62, 100: bl, // 100 为主色
    110: 75, 120: 82, 130: 88, 140: 92, 150: 96, 160: 98.5
  };

  const variants: Record<string, string> = {};
  Object.entries(lightnessLevels).forEach(([key, l]) => {
    let targetS = s;
    
    // 极浅或极深时适当降低饱和度
    if (l > 85 || l < 20) {
      targetS = s * 0.7;
    }

    variants[key] = hslToHex(h, targetS, l);
  });

  return variants as BrandVariants;
};

// 统一的主题包装组件，确保所有窗口共享相同的主题逻辑
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isDarkMode,
    accentColor,
    contentDensity,
    cornerRadius,
  } = useThemeStore();

  const theme = React.useMemo(() => {
    const brand = generateBrandVariants(accentColor || "#0078d4");
    const baseTheme = isDarkMode ? createDarkTheme(brand) : createLightTheme(brand);
    
    // 应用圆角设置
    const radiusMap = {
      small: "2px",
      medium: "4px",
      large: "8px"
    };
    const borderRadius = radiusMap[cornerRadius] || "4px";

    const finalTheme: Theme = {
      ...baseTheme,
      borderRadiusNone: "0",
      borderRadiusSmall: cornerRadius === 'small' ? "1px" : "2px",
      borderRadiusMedium: borderRadius,
      borderRadiusLarge: cornerRadius === 'large' ? "12px" : "8px",
      borderRadiusXLarge: cornerRadius === 'large' ? "16px" : "12px",
      borderRadiusCircular: "10000px",
    };

    // 应用内容密度 (间距) 设置
    if (contentDensity === 'compact') {
      finalTheme.spacingHorizontalXS = "2px";
      finalTheme.spacingHorizontalS = "4px";
      finalTheme.spacingHorizontalM = "8px";
      finalTheme.spacingHorizontalL = "12px";
      finalTheme.spacingHorizontalXL = "16px";
      
      finalTheme.spacingVerticalXS = "2px";
      finalTheme.spacingVerticalS = "4px";
      finalTheme.spacingVerticalM = "8px";
      finalTheme.spacingVerticalL = "12px";
      finalTheme.spacingVerticalXL = "16px";

      // 额外对一些组件常用的间距进行微调
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (finalTheme as any).spacingHorizontalXXL = "24px";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (finalTheme as any).spacingVerticalXXL = "24px";
    }

    return finalTheme;
  }, [isDarkMode, accentColor, cornerRadius, contentDensity]);

  const densityClassName = contentDensity === 'compact' ? 'fui-FluentProvider--compact' : '';
  const themeClassName = `${densityClassName} ${isDarkMode ? 'fui-FluentProvider--dark' : 'fui-FluentProvider--light'}`;

  return (
    <FluentProvider theme={theme} className={themeClassName}>
      {children}
    </FluentProvider>
  );
};

function AppWithTheme() {
  const {
    followSystemTheme,
    updateThemeBasedOnSystem,
  } = useThemeStore();
  const [, setIsActivationValid] = useState(true);
  const [, setHasAcceptedTerms] = useState(true);
  const { setCurrentPhase } = useStartupFlowStore();
  const {
    hasCompletedPrivacySetup,
    hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement,
  } = usePrivacyConsentStore();
  const { config } = useAppStore();

  // 监听系统主题变化
  useEffect(() => {
    if (followSystemTheme) {
      updateThemeBasedOnSystem();
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => updateThemeBasedOnSystem();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [followSystemTheme, updateThemeBasedOnSystem]);
  
  useEffect(() => {
    if (config.language && i18n.language !== config.language) {
      i18n.changeLanguage(config.language);
    }
  }, [config.language]);

  useEffect(() => {
    const checkActivationStatus = () => {
      try {
        const activationStatus = activationService.checkActivationStatus();
        if (activationStatus.isExpired || activationStatus.needsActivation) {
          setIsActivationValid(false);
          setCurrentPhase("activation-verification");
          if (activationStatus.isExpired) {
            activationService.handleExpiredActivation();
          }
        } else {
          setIsActivationValid(true);
        }
      } catch (_error) {
        setIsActivationValid(false);
        setCurrentPhase("activation-verification");
      }
    };
    checkActivationStatus();
    const intervalId = setInterval(checkActivationStatus, 5000); // 降低频率以优化性能
    return () => clearInterval(intervalId);
  }, [setCurrentPhase]);

  useEffect(() => {
    const checkTermsAcceptance = () => {
      try {
        const needsToShowConsent = shouldShowPrivacyConsent();
        const hasAcceptedAllTerms = hasCompletedPrivacySetup && hasAcceptedPrivacyPolicy && hasAcceptedUserAgreement;
        if (needsToShowConsent || !hasAcceptedAllTerms) {
          setHasAcceptedTerms(false);
          setCurrentPhase("privacy-consent");
        } else {
          setHasAcceptedTerms(true);
        }
      } catch (_error) {
        setHasAcceptedTerms(false);
        setCurrentPhase("privacy-consent");
      }
    };
    checkTermsAcceptance();
  }, [setCurrentPhase, hasCompletedPrivacySetup, hasAcceptedPrivacyPolicy, hasAcceptedUserAgreement]);

  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

function CommandLineWindowWithTheme() {
  return <ThemeProvider><CommandLineWindow /></ThemeProvider>;
}

function LogsWindowWithTheme() {
  return <ThemeProvider><LogsWindow /></ThemeProvider>;
}

function AIChatWindowWithTheme() {
  return <ThemeProvider><AIChatWindow /></ThemeProvider>;
}

function DeviceSelectionWindowWithTheme() {
  return <ThemeProvider><DeviceSelectionWindow /></ThemeProvider>;
}

function Root() {
  const [label, setLabel] = useState<string | null>(null);

  // Subscribe to across-window state changes so that ANY window gets them.
  const { subscribeToStorageChanges: themeStorageChanges } = useThemeStore();
  const { subscribeToStorageChanges: deviceStorageChanges } = useDeviceStore();
  const { subscribeToStorageChanges: aiChatStorageChanges } = useAIChatStore();

  useEffect(() => {
    const themeCleanup = themeStorageChanges();
    const deviceCleanup = deviceStorageChanges();
    const aiChatCleanup = aiChatStorageChanges();
    return () => {
      themeCleanup();
      deviceCleanup();
      aiChatCleanup();
    };
  }, [themeStorageChanges, deviceStorageChanges, aiChatStorageChanges]);

  useEffect(() => {
    setLabel(getCurrentWebviewWindow().label);
  }, []);

  if (!label) return null;

  if (label === "command-line") return <CommandLineWindowWithTheme />;
  if (label === "logs") return <LogsWindowWithTheme />;
  if (label === "ai-chat") return <AIChatWindowWithTheme />;
  if (label === "device-selection") return <DeviceSelectionWindowWithTheme />;

  return <AppWithTheme />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
