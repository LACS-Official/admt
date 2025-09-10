import React from "react";
import {
  makeStyles,
  mergeClasses,
  Text,
  Button,
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
  Pin24Regular,
  PinOff24Regular,
} from "@fluentui/react-icons";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import { useAppConfigStore } from "../../stores/welcomeStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { admtbgIcon, admtLogo128, admtLogo64 } from "../../assets/icons";
import UserInfoModal from "../Settings/UserInfoModal";
import AnnouncementBar from "../Announcement/AnnouncementBar";

const useStyles = makeStyles({
  IconImage: {
    width: "100%",
    height: "100%",
    borderRadius: "4px",
  },
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
    width: "32px",
    height: "32px",
  },
  title: {
    fontWeight: "600",
    fontSize: "18px",
    color: "var(--colorNeutralForeground1)",
  },
  centerSection: {
    display: "flex",
    alignItems: "center",
    flex: "1",
    justifyContent: "flex-start",
    paddingLeft: "16px",
    paddingRight: "16px",
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
  useAppConfigStore();
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = React.useState(false);

  // 检查窗口状态
  React.useEffect(() => {
    const checkWindowState = async () => {
      try {
        const window = getCurrentWindow();
        const maximized = await window.isMaximized();
        console.log("窗口状态检查:", maximized);
        setIsMaximized(maximized);

        // 检查置顶状态
        const alwaysOnTop = await window.isAlwaysOnTop();
        setIsAlwaysOnTop(alwaysOnTop);
      } catch (error) {
        console.error("检查窗口状态失败:", error);
      }
    };

    checkWindowState();

    // 监听窗口状态变化
    const unlisten = getCurrentWindow().onResized(() => {
      checkWindowState();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (error) {
      console.error("最小化窗口失败:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      if (isMaximized) {
        await getCurrentWindow().unmaximize();
      } else {
        await getCurrentWindow().maximize();
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      console.error("最大化/还原窗口失败:", error);
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (error) {
      console.error("关闭窗口失败:", error);
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    try {
      const newState = !isAlwaysOnTop;
      await getCurrentWindow().setAlwaysOnTop(newState);
      setIsAlwaysOnTop(newState);
    } catch (error) {
      console.error("切换置顶状态失败:", error);
    }
  };



  const handleSettingsClick = () => {
    setCurrentView("settings");
  };

  return (
    <>
      <div className={mergeClasses(styles.titleBar)} data-tauri-drag-region>
        {/* 左侧区域 - Logo和应用名称 */}
        <div className={styles.leftSection}>
          <img src={admtLogo64} alt="Logo" className={styles.logo} />
          <Text className={styles.title}>玩机管家</Text>
        </div>

        {/* 中间区域 - 公告展示条 */}
        <div className={styles.centerSection}>
          <AnnouncementBar />
        </div>

        {/* 右侧区域 - 控制按钮 */}
        <div className={styles.rightSection}>
          <Tooltip content="用户信息" relationship="label">
            <UserInfoModal>
              <Button
                appearance="subtle"
                icon={<Person24Regular />}
                className={styles.titleBarButton}
              />
            </UserInfoModal>
          </Tooltip>

          <Tooltip content="设置" relationship="label">
            <Button
              appearance="subtle"
              icon={<Settings24Regular />}
              className={styles.titleBarButton}
              onClick={handleSettingsClick}
            />
          </Tooltip>

          <Tooltip
            content={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
            relationship="label"
          >
            <Button
              appearance="subtle"
              icon={
                isDarkMode ? (
                  <WeatherSunny24Regular />
                ) : (
                  <WeatherMoon24Regular />
                )
              }
              className={styles.titleBarButton}
              onClick={toggleTheme}
            />
          </Tooltip>

          <Tooltip
            content={isAlwaysOnTop ? "取消置顶" : "窗口置顶"}
            relationship="label"
          >
            <Button
              appearance="subtle"
              icon={
                isAlwaysOnTop ? <PinOff24Regular /> : <Pin24Regular />
              }
              className={styles.titleBarButton}
              onClick={handleToggleAlwaysOnTop}
            />
          </Tooltip>

          <Tooltip content="最小化" relationship="label">
            <Button
              appearance="subtle"
              icon={<Subtract24Regular />}
              className={styles.titleBarButton}
              onClick={(e) => {
                e.preventDefault();
                handleMinimize();
              }}
            />
          </Tooltip>

          <Tooltip
            content={isMaximized ? "还原" : "最大化"}
            relationship="label"
          >
            <Button
              appearance="subtle"
              icon={
                isMaximized ? (
                  <SquareMultiple24Regular />
                ) : (
                  <Maximize24Regular />
                )
              }
              className={styles.titleBarButton}
              onClick={(e) => {
                e.preventDefault();
                handleMaximize();
              }}
            />
          </Tooltip>

          <Tooltip content="关闭" relationship="label">
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              className={mergeClasses(
                styles.titleBarButton,
                styles.closeButton
              )}
              onClick={(e) => {
                e.preventDefault();
                handleClose();
              }}
            />
          </Tooltip>
        </div>
      </div>

    </>
  );
};

export default TitleBar;