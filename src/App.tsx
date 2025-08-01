
import { useEffect, useState } from "react";
import { makeStyles, Spinner, Text, MessageBar } from "@fluentui/react-components";
import TitleBar from "./components/TitleBar/TitleBar";
import MainContent from "./components/MainContent/MainContent";
import StatusBar from "./components/StatusBar/StatusBar";
import NotificationContainer from "./components/Common/NotificationContainer";
import { useAppStore } from "./stores/appStore";
import { logService } from "./services/logService";

const useStyles = makeStyles({
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground1)",
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initialize } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        logService.info('开始初始化 HOUT 应用...', 'App');

        // 初始化应用状态
        initialize();

        // 初始化过程
        await new Promise(resolve => setTimeout(resolve, 800));

        logService.info('HOUT 应用初始化完成', 'App');
        setIsLoading(false);
      } catch (err) {
        logService.error('应用初始化失败', 'App', err);
        setError('应用初始化失败，请重试');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [initialize]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <Text size={400}>正在加载玩机管家...</Text>
        {error && (
          <MessageBar intent="error" style={{ marginTop: '16px', maxWidth: '400px' }}>
            {error}
          </MessageBar>
        )}
      </div>
    );
  }

  // 显示主应用界面
  return (
    <div className={styles.app}>
      <TitleBar />
      <MainContent />
      <StatusBar />
      <NotificationContainer />
    </div>
  );
}

export default App;
