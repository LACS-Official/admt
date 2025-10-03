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
import { admtLogo64 } from "../../assets/icons";
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
    // 确保整个标题栏可拖拽
    position: "relative",
    zIndex: 1,
    // 添加拖拽样式
    cursor: "default",
    userSelect: "none",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    // 左侧区域允许拖拽
    userSelect: "none",
    cursor: "default",
  },
  logo: {
    width: "32px",
    height: "32px",
    userSelect: "none",
    cursor: "default",
  },
  title: {
    fontWeight: "600",
    fontSize: "18px",
    color: "var(--colorNeutralForeground1)",
    userSelect: "none",
    cursor: "default",
  },
  centerSection: {
    display: "flex",
    alignItems: "center",
    flex: "1",
    justifyContent: "flex-start",
    paddingLeft: "16px",
    paddingRight: "16px",
    // 中间区域允许拖拽，但子元素可能需要交互
    position: "relative",
    userSelect: "none",
    cursor: "default",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    // 右侧按钮区域禁止拖拽
    position: "relative",
    zIndex: 2,
  },
  titleBarButton: {
    minWidth: "32px",
    height: "32px",
    borderRadius: "4px",
    // 确保按钮可交互，禁止拖拽
    cursor: "pointer",
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
  const [isUpdating, setIsUpdating] = React.useState(false);

  // 检查窗口状态
  React.useEffect(() => {
    const checkWindowState = async () => {
      try {
        const window = getCurrentWindow();
        
        // 并行检查多个状态
        const [maximized, alwaysOnTop] = await Promise.all([
          window.isMaximized(),
          window.isAlwaysOnTop()
        ]);
        
        setIsMaximized(maximized);
        setIsAlwaysOnTop(alwaysOnTop);
      } catch (error) {
        console.error('检查窗口状态失败:', error);
      }
    };

    checkWindowState();

    // 监听窗口状态变化
    const unlistenResize = getCurrentWindow().onResized(() => {
      checkWindowState();
    });

    // 监听窗口焦点变化，用于重新检查置顶状态
    const unlistenFocus = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
      if (focused) {
        // 窗口获得焦点时重新检查状态
        setTimeout(checkWindowState, 50); // 小延迟确保状态稳定
      }
    });

    return () => {
      unlistenResize.then((fn) => fn());
      unlistenFocus.then((fn) => fn());
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
      const currentState = await getCurrentWindow().isMaximized();
      
      if (currentState) {
        await getCurrentWindow().unmaximize();
      } else {
        await getCurrentWindow().maximize();
      }
      
      // 等待状态变更完成
      setTimeout(async () => {
        try {
          const newState = await getCurrentWindow().isMaximized();
          setIsMaximized(newState);
        } catch (error) {
          console.error('检查最大化状态失败:', error);
        }
      }, 100);
    } catch (error) {
      console.error('最大化/还原窗口失败:', error);
    }
  };

  const handleClose = async () => {
    try {
      // 检查是否启用了系统托盘和关闭时最小化到托盘
      const { config } = useAppStore.getState();
      
      if (config.systemTrayEnabled && config.minimizeToTrayOnClose) {
        // 最小化到托盘
        const { systemTrayService } = await import("../../services/systemTrayService");
        await systemTrayService.minimizeToTray();
      } else {
        // 直接关闭应用
        await getCurrentWindow().close();
      }
    } catch (error) {
      console.error("关闭窗口失败:", error);
    }
  };

  const handleToggleAlwaysOnTop = async () => {
    if (isUpdating) return; // 防止重复操作
    
    setIsUpdating(true);
    
    try {
      const currentState = await getCurrentWindow().isAlwaysOnTop();
      const newState = !currentState;
      
      // 先尝试使用后端命令（更可靠）
      try {
        await invoke('set_window_always_on_top', { alwaysOnTop: newState });
      } catch (invokeError) {
        console.warn('后端命令失败，使用前端API:', invokeError);
        // 后备方案：使用前端API
        await getCurrentWindow().setAlwaysOnTop(newState);
      }
      
      // 等待一小段时间确保状态变更完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 验证状态变更
      const actualState = await getCurrentWindow().isAlwaysOnTop();
      setIsAlwaysOnTop(actualState);
      
      if (actualState !== newState) {
        console.warn(`窗口置顶状态同步异常: 期望 ${newState}, 实际 ${actualState}`);
      } else {
        console.log(`窗口置顶状态已更新: ${actualState}`);
      }
      
    } catch (error) {
      console.error('切换置顶状态失败:', error);
      // 发生错误时，重新获取当前状态
      try {
        const currentState = await getCurrentWindow().isAlwaysOnTop();
        setIsAlwaysOnTop(currentState);
      } catch (checkError) {
        console.error('获取置顶状态失败:', checkError);
      }
    } finally {
      setIsUpdating(false);
    }
  };



  const handleSettingsClick = () => {
    setCurrentView("settings");
  };

  return (
    <>
      <div className={mergeClasses(styles.titleBar)} data-tauri-drag-region>
        {/* 左侧区域 - Logo和应用名称 - 支持拖拽 */}
        <div className={styles.leftSection} data-tauri-drag-region>
          <img src={admtLogo64} alt="Logo" className={styles.logo} />
        </div>

        {/* 中间区域 - 公告展示条 - 支持拖拽 */}
        <div className={styles.centerSection} data-tauri-drag-region>
          <AnnouncementBar />
        </div>

        {/* 右侧区域 - 控制按钮 - 不支持拖拽 */}
        <div className={styles.rightSection} data-tauri-drag-region="false">
          <Tooltip content="用户信息" relationship="label">
            <UserInfoModal>
              <Button
                appearance="subtle"
                icon={<Person24Regular />}
                className={styles.titleBarButton}
              />
            </UserInfoModal>
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
              disabled={isUpdating}
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