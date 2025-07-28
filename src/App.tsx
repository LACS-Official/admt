
import React, { useEffect, useState } from "react";
import { makeStyles, Spinner, Text, MessageBar, Button } from "@fluentui/react-components";
import TitleBar from "./components/TitleBar/TitleBar";
import MainContent from "./components/MainContent/MainContent";
import StatusBar from "./components/StatusBar/StatusBar";
import WelcomePage from "./components/Welcome/WelcomePage";
import { useAppConfigStore } from "./stores/welcomeStore";
import { activationService } from "./services/activationService";
import ActivationStatusManager from "./components/Common/ActivationStatusManager";
import ExpirationHandler from "./components/Common/ExpirationHandler";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import ActivationTest from "./components/Test/ActivationTest";
import ExpirationTest from "./components/Test/ExpirationTest";

const useStyles = makeStyles({
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loading: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
});

function App() {
  const styles = useStyles();
  const { isActivated, needsActivation } = useAppConfigStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // 检查是否是测试模式（通过URL参数）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test');
    if (testMode === 'activation' || testMode === 'expiration') {
      setShowTest(true);
      setIsLoading(false);
      return;
    }
  }, []);

  // 检查激活状态（增强版，支持过期检查和自动清理）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkActivationStatus = async () => {
      try {
        console.log('开始检查激活状态...');

        // 设置超时机制，防止无限加载
        timeoutId = setTimeout(() => {
          console.warn('激活状态检查超时，使用默认设置');
          setLoadingError('激活状态检查超时，将使用默认设置');
          setShowWelcome(true);
          setIsLoading(false);
        }, 10000); // 10秒超时

        // 首先处理过期激活码的清理
        const expiredResult = activationService.handleExpiredActivation();
        console.log('过期处理结果:', expiredResult);

        // 获取当前激活状态
        const activationStatus = activationService.checkActivationStatus();
        console.log('当前激活状态:', activationStatus);

        // 获取详细信息用于调试
        const detailedInfo = activationService.getDetailedActivationInfo();
        console.log('详细激活信息:', detailedInfo);

        // 同时检查Zustand存储的状态（向后兼容）
        const activated = isActivated();
        const needsActivationCheck = needsActivation();
        const expired = useAppConfigStore.getState().isExpired();

        console.log('Zustand存储状态:', {
          activated,
          needsActivationCheck,
          expired,
          config: useAppConfigStore.getState().config
        });

        // 判断是否需要显示激活界面
        const shouldShowWelcome = activationStatus.needsActivation ||
                                 activationStatus.isExpired ||
                                 (!activationStatus.isActivated);

        if (shouldShowWelcome) {
          console.log('需要激活，显示欢迎页面');

          // 如果是因为过期而需要激活，更新Zustand状态
          if (expiredResult.wasExpired) {
            const { setActivated, setConfig } = useAppConfigStore.getState();
            setActivated(false);
            setConfig({
              isActivated: false,
              activationStatus: 'expired' as any,
              expiryDate: activationStatus.expiryDate,
              features: [],
              // 保留用户配置以便重新激活时使用
              userConfig: expiredResult.userConfig || {
                username: 'HOUT用户',
                language: 'zh-CN',
                theme: 'light',
                autoStart: false,
                checkUpdates: true,
                enableTelemetry: false,
              }
            });

            console.log('激活码已过期，已清理数据并保留用户配置:', expiredResult.userConfig);
          }

          setShowWelcome(true);
        } else {
          console.log('应用已激活且有效，显示主应用');

          // 同步状态到Zustand存储
          if (!activated || expired) {
            const { setActivated, setConfig } = useAppConfigStore.getState();
            setActivated(true);
            setConfig({
              isActivated: true,
              activationStatus: 'activated' as any,
              expiryDate: activationStatus.expiryDate,
              features: activationStatus.features || [],
              apiValidation: activationStatus.apiValidation
            });
            console.log('已同步激活状态到Zustand存储');
          }

          setShowWelcome(false);
        }

        // 检查是否需要重新验证（临近过期）
        if (activationService.shouldRevalidateActivation()) {
          console.log('激活码临近过期，建议尽快重新验证');
        }

      } catch (error) {
        console.error('检查激活状态失败:', error);
        setLoadingError(`激活状态检查失败: ${error}`);
        // 出错时默认显示欢迎页面
        setShowWelcome(true);
      } finally {
        // 清除超时定时器
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setIsLoading(false);
      }
    };

    checkActivationStatus();

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isActivated, needsActivation]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <Text size={400}>正在加载 HOUT 工具箱...</Text>
        {loadingError && (
          <MessageBar intent="warning" style={{ marginTop: '16px', maxWidth: '400px' }}>
            {loadingError}
          </MessageBar>
        )}
      </div>
    );
  }

  // 显示测试页面
  if (showTest) {
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test');

    return (
      <ErrorBoundary>
        {testMode === 'expiration' ? <ExpirationTest /> : <ActivationTest />}
      </ErrorBoundary>
    );
  }

  // 显示欢迎页面
  if (showWelcome) {
    return (
      <ErrorBoundary>
        <WelcomePage />
      </ErrorBoundary>
    );
  }

  // 处理过期激活码
  const handleExpiredActivation = () => {
    console.log('过期激活码已处理，重新检查状态');
    setShowWelcome(true);
    setIsLoading(false);
  };

  // 处理重新激活请求
  const handleReactivateRequest = () => {
    console.log('用户请求重新激活');
    setShowWelcome(true);
    setIsLoading(false);
  };

  // 显示主应用
  return (
    <ErrorBoundary>
      <ActivationStatusManager>
        <ExpirationHandler
          onExpired={handleExpiredActivation}
          onReactivateRequested={handleReactivateRequest}
          checkInterval={30000} // 30秒检查一次
        />
        <div className={styles.app}>
          <TitleBar />
          <div className={styles.content}>
            <MainContent />
            <StatusBar />
          </div>
        </div>
      </ActivationStatusManager>
    </ErrorBoundary>
  );
}

export default App;
