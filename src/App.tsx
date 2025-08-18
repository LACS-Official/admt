import { useEffect, useState } from "react";
import { makeStyles, Spinner, Text } from "@fluentui/react-components";
import TitleBar from "./components/Bar/TitleBar";
import MainContent from "./components/MainContent/MainContent";
import StatusBar from "./components/Bar/StatusBar";

import StartupFlowManager from "./components/StartupFlow/StartupFlowManager";

import { useAppStore } from "./stores/appStore";
import { useStartupFlowStore } from "./stores/startupFlowStore";
import { logService } from "./services/logService";

const useStyles = makeStyles({
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
    // 添加现代化的渐变背景
    background: "linear-gradient(135deg, var(--colorNeutralBackground1) 0%, var(--colorNeutralBackground2) 100%)",
  },
  loading: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px", // 增加间距
    backgroundColor: "var(--colorNeutralBackground1)",
    // 添加现代化的加载背景
    background: "linear-gradient(135deg, var(--colorNeutralBackground1) 0%, var(--colorNeutralBackground2) 100%)",
  },
  loadingContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "32px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  loadingText: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "16px",
    fontWeight: "500",
  },
  spinner: {
    width: "40px",
    height: "40px",
  }
});

function App() {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [showStartupFlow, setShowStartupFlow] = useState(true); // 启用启动流程
  const [isMainContentLoading, setIsMainContentLoading] = useState(false); // 主内容加载状态


  const { initialize, config } = useAppStore();
  const { currentPhase } = useStartupFlowStore();

  // 监听启动流程状态变化，确保删除激活码后能重新显示启动流程
  useEffect(() => {
    if (currentPhase === 'activation-verification' && !showStartupFlow) {
      console.log('🔄 检测到需要激活验证，重新显示启动流程');
      setShowStartupFlow(true);
    }
  }, [currentPhase, showStartupFlow]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        logService.info('开始初始化 HOUT 应用...', 'App');

        // 初始化应用状态
        initialize();

        // 记录设备检测配置状态
        logService.info(`设备检测配置 - 自动检测: ${config.autoDetectDevices}, 扫描间隔: ${config.scanInterval}ms`, 'App');

        // 初始化过程
        await new Promise(resolve => setTimeout(resolve, 800));

        logService.info('HOUT 应用初始化完成', 'App');
        setIsLoading(false);
        // 初始化完成后，启动流程会自动开始
      } catch (err) {
        logService.error('应用初始化失败', 'App', err);
        setError('应用初始化失败，请重试');
        setIsLoading(false);
        setShowStartupFlow(false); // 初始化失败时跳过启动流程
      }
    };

    initializeApp();
  }, [initialize]);

  const handleStartupFlowComplete = () => {
    logService.info('启动流程完成', 'App');
    // 在启动流程完成后，显示加载动画，避免白屏
    setIsMainContentLoading(true);
    // 给一个短暂的延迟，确保UI更新
    setTimeout(() => {
      setShowStartupFlow(false);
      setIsMainContentLoading(false);
    }, 300);
  };

  const handleStartupFlowError = (error: string) => {
    logService.error('启动流程失败', 'App', error);
    setError(error);
    // 即使启动流程失败，也允许用户继续使用应用
    setShowStartupFlow(false);
  };

  // 加载中状态 - 现在直接进入启动流程，不显示单独的加载页面
  if (isLoading) {
    // 加载完成后会自动显示启动流程
    return null;
  }

  // 显示启动流程完成后的加载动画
  if (isMainContentLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <Spinner className={styles.spinner} />
          <Text className={styles.loadingText}>正在加载主界面...</Text>
        </div>
      </div>
    );
  }

  // 显示启动流程
  if (showStartupFlow) {
    return (
      <StartupFlowManager
        onComplete={handleStartupFlowComplete}
        onError={handleStartupFlowError}
      />
    );
  }

  // 显示主应用界面
  return (
    <div className={styles.app}>
      <TitleBar />
      <MainContent />
      <StatusBar />
    </div>
  );
}

export default App;