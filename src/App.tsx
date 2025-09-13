import { useEffect, useState } from "react";
import { makeStyles, Spinner, Text, MessageBar } from "@fluentui/react-components";
import TitleBar from "./components/Bar/TitleBar";
import MainContent from "./components/MainContent/MainContent";
import StatusBar from "./components/Bar/StatusBar";

import StartupFlowManager from "./components/StartupFlow/StartupFlowManager";

import { useAppStore } from "./stores/appStore";
import { useStartupFlowStore } from "./stores/startupFlowStore";
import { logService } from "./services/logService";
import { ReactErrorFixer } from "./utils/reactErrorFix";
import { adbToolsManager } from "./services/adbToolsManager";

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
  },
  errorNotification: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
    background: "linear-gradient(135deg, var(--colorNeutralBackground1) 0%, var(--colorNeutralBackground2) 100%)",
  },
  errorHeader: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 32px 24px",
  },
  errorHeaderContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  errorTitle: {
    fontSize: "28px",
    fontWeight: "600",
    color: "var(--colorPaletteRedForeground1)",
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: "16px",
    color: "var(--colorNeutralForeground2)",
    textAlign: "center",
  },
  errorBody: {
    flex: "1 1 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 32px",
  },
  errorContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
    padding: "48px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "20px",
    boxShadow: "0 16px 64px rgba(0, 0, 0, 0.15)",
    border: "1px solid var(--colorNeutralStroke2)",
    maxWidth: "800px",
    width: "100%",
    minHeight: "300px",
  },
  errorMessage: {
    width: "100%",
    fontSize: "16px",
  },
  errorDetails: {
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "20px",
    borderRadius: "12px",
    width: "100%",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  errorDetailsText: {
    fontSize: "14px",
    color: "var(--colorNeutralForeground2)",
    lineHeight: "1.5",
    textAlign: "center",
  },
  errorFooter: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 32px 48px",
  },
  countdownContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "24px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  countdownText: {
    color: "var(--colorNeutralForeground1)",
    fontSize: "16px",
    fontWeight: "500",
    textAlign: "center",
  },
  countdownNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "var(--colorPaletteRedForeground1)",
    textAlign: "center",
    minWidth: "50px",
  }
});

function App() {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartupFlow, setShowStartupFlow] = useState(true); // 启用启动流程
  const [isMainContentLoading, setIsMainContentLoading] = useState(false); // 主内容加载状态
  const [showErrorNotification, setShowErrorNotification] = useState(false); // 错误通知显示状态
  const [countdown, setCountdown] = useState(5); // 倒计时状态


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
        logService.info('开始初始化ADMT应用...', 'App');

        // 1. 执行React错误检查和修复
        logService.info('执行React错误检查和修复...', 'App');
        try {
          const checkResults = await ReactErrorFixer.performAllChecks();
          if (!checkResults.success) {
            logService.warning('发现React错误问题，尝试自动修复', 'App', { issues: checkResults.issues });
            await ReactErrorFixer.autoFix();
            logService.info('React错误自动修复完成', 'App');
          } else {
            logService.info('React错误检查通过', 'App');
          }
        } catch (fixError) {
          logService.warning('React错误修复失败，继续启动', 'App', fixError);
        }

        // 2. 初始化应用状态
        initialize();

        // 3. 初始化ADB工具
        logService.info('初始化ADB工具...', 'App');
        try {
          await adbToolsManager.initialize();
          const adbInfo = adbToolsManager.getAdbInfo();
          
          if (adbInfo.isAvailable) {
            logService.info(`ADB工具初始化成功: ${adbInfo.adbPath}`, 'App');
            if (adbInfo.version) {
              logService.info(`ADB版本: ${adbInfo.version}`, 'App');
            }
          } else {
            logService.warning('ADB工具初始化失败，某些功能可能受限', 'App', {
              error: adbInfo.error,
              adbPath: adbInfo.adbPath,
              fastbootPath: adbInfo.fastbootPath
            });
          }
        } catch (adbError) {
          const errorMsg = adbError instanceof Error ? adbError.message : '未知错误';
          logService.error('ADB工具初始化异常', 'App', adbError);
          // ADB工具初始化失败不阻止应用启动，只是功能受限
          console.warn('ADB工具初始化失败，某些设备功能可能受限:', errorMsg);
        }

        // 4. 记录设备检测配置状态
        logService.info(`设备检测配置 - 自动检测: ${config.autoDetectDevices}, 扫描间隔: ${config.scanInterval}ms`, 'App');

        // 4. 初始化过程
        await new Promise(resolve => setTimeout(resolve, 800));

        logService.info('ADMT 应用初始化完成', 'App');
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

  const handleStartupFlowError = async (error: string) => {
    logService.error('启动流程失败', 'App', error);
    setError(error);
    
    // 显示错误通知并开始倒计时
    setShowStartupFlow(false);
    setIsMainContentLoading(false);
    setShowErrorNotification(true);
    setCountdown(5);
    
    // 倒计时逻辑
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // 倒计时结束，退出应用
          setTimeout(async () => {
            try {
              const { exit } = await import('@tauri-apps/plugin-process');
              await exit(1);
            } catch (exitError) {
              console.error('退出应用失败:', exitError);
              // 如果 Tauri API 不可用，尝试关闭窗口
              window.close();
            }
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

  // 显示错误通知
  if (showErrorNotification && error) {
    return (
      <div className={styles.errorNotification}>
        {/* 顶部标题区域 */}
        <div className={styles.errorHeader}>
          <div className={styles.errorHeaderContent}>
            <Text className={styles.errorTitle}>⚠️ 启动失败</Text>
            <Text className={styles.errorSubtitle}>应用程序在启动过程中遇到了问题</Text>
          </div>
        </div>

        {/* 中间内容区域 */}
        <div className={styles.errorBody}>
          <div className={styles.errorContent}>
            <MessageBar intent="error" className={styles.errorMessage}>
              <Text weight="semibold">错误详情</Text>
            </MessageBar>
            
            <div className={styles.errorDetails}>
              <Text className={styles.errorDetailsText}>
                {error}
              </Text>
            </div>

            <div className={styles.errorDetails}>
              <Text className={styles.errorDetailsText}>
                这通常是由于网络连接问题、系统权限不足或必要组件缺失导致的。
                请检查网络连接后重新启动应用程序。
              </Text>
            </div>
          </div>
        </div>

        {/* 底部倒计时区域 */}
        <div className={styles.errorFooter}>
          <div className={styles.countdownContainer}>
            <Text className={styles.countdownText}>应用将自动退出</Text>
            <Text className={styles.countdownNumber}>{countdown}</Text>
            <Text className={styles.countdownText}>秒</Text>
          </div>
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