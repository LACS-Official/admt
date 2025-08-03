import React from "react";
import {
  makeStyles,
  Button,
  Text,
  Tooltip,
} from "@fluentui/react-components";
import {
  WeatherMoon24Regular,
  WeatherSunny24Regular,
  Settings24Regular,
  Subtract24Regular,
  Dismiss24Regular,
  Maximize24Regular,
  SquareMultiple24Regular,
  Person24Regular,
} from "@fluentui/react-icons";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import { useAppConfigStore } from "../../stores/welcomeStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import UserInfoModal from "../UserInfo/UserInfoModal";
import AppIcon from "../Common/AppIcon";

const useStyles = makeStyles({
  titleBar: {
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    paddingLeft: "16px",
    paddingRight: "8px",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "24px",
    height: "24px",
  },
  title: {
    fontWeight: "600",
    fontSize: "14px",
    color: "var(--colorNeutralForeground1)",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  titleBarButton: {
    minWidth: "32px",
    height: "32px",
    borderRadius: "4px",
  },
  closeButton: {
    ":hover": {
      backgroundColor: "#E81123 !important",
      color: "white !important",
    },
  },
});

const TitleBar: React.FC = () => {
  const styles = useStyles();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { setCurrentView } = useAppStore();
  const { config } = useAppConfigStore();
  const [isMaximized, setIsMaximized] = React.useState(false);

  // 检查窗口状态
  React.useEffect(() => {
    const checkWindowState = async () => {
      try {
        const window = getCurrentWindow();
        const maximized = await window.isMaximized();
        console.log("窗口状态检查:", maximized);
        setIsMaximized(maximized);
      } catch (error) {
        console.error("检查窗口状态失败:", error);
      }
    };

    checkWindowState();

    // 监听窗口状态变化
    let unlistenPromise: Promise<() => void> | null = null;

    const setupListener = async () => {
      try {
        const window = getCurrentWindow();
        unlistenPromise = window.onResized(() => {
          checkWindowState();
        });
      } catch (error) {
        console.error("设置窗口监听器失败:", error);
      }
    };

    setupListener();

    return () => {
      if (unlistenPromise) {
        unlistenPromise.then(fn => fn()).catch(console.error);
      }
    };
  }, []);

  const handleMinimize = async () => {
    try {
      console.log("🔧 执行窗口最小化...");
      const window = getCurrentWindow();
      await window.minimize();
      console.log("✅ 窗口最小化成功");
    } catch (error) {
      console.error("❌ 最小化失败:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      if (isMaximized) {
        console.log("🔧 执行窗口还原...");
        await window.unmaximize();
        console.log("✅ 窗口还原成功");
      } else {
        console.log("🔧 执行窗口最大化...");
        await window.maximize();
        console.log("✅ 窗口最大化成功");
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error("❌ 最大化/还原失败:", error);
    }
  };

  const handleClose = async () => {
    try {
      console.log("🔧 执行窗口关闭...");
      const window = getCurrentWindow();
      await window.close();
      console.log("✅ 窗口关闭成功");
    } catch (error) {
      console.error("❌ 关闭失败:", error);
    }
  };

  const handleSettings = () => {
    setCurrentView("settings");
  };

  return (
    <div className={`${styles.titleBar} drag-region`}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <AppIcon size="medium"/>
        </div>
        <Text className={styles.title}>玩机管家-Android Device Management Tool</Text>
      </div>
      
      <div className={`${styles.rightSection} no-drag`}>
        {/* 用户信息按钮 - 始终显示 */}
        <UserInfoModal>
          <Tooltip content="我的信息" relationship="label">
            <Button
              appearance="subtle"
              icon={<Person24Regular />}
              className={styles.titleBarButton}
            />
          </Tooltip>
        </UserInfoModal>

        <Tooltip content="切换主题" relationship="label">
          <Button
            appearance="subtle"
            icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
            className={styles.titleBarButton}
            onClick={toggleTheme}
          />
        </Tooltip>

        <Tooltip content="设置" relationship="label">
          <Button
            appearance="subtle"
            icon={<Settings24Regular />}
            className={styles.titleBarButton}
            onClick={handleSettings}
          />
        </Tooltip>
        
        <Tooltip content="最小化" relationship="label">
          <Button
            appearance="subtle"
            icon={<Subtract24Regular />}
            className={styles.titleBarButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMinimize();
            }}
          />
        </Tooltip>

        <Tooltip content={isMaximized ? "还原" : "最大化"} relationship="label">
          <Button
            appearance="subtle"
            icon={isMaximized ? <SquareMultiple24Regular /> : <Maximize24Regular />}
            className={styles.titleBarButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleMaximize();
            }}
          />
        </Tooltip>

        <Tooltip content="关闭" relationship="label">
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            className={`${styles.titleBarButton} ${styles.closeButton}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default TitleBar;
