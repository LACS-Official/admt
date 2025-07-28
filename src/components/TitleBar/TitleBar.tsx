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
} from "@fluentui/react-icons";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import { getCurrentWindow } from "@tauri-apps/api/window";

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
    borderRadius: "4px",
    backgroundColor: "var(--colorBrandBackground)",
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

  const handleMinimize = async () => {
    const window = getCurrentWindow();
    await window.minimize();
  };

  const handleClose = async () => {
    const window = getCurrentWindow();
    await window.close();
  };

  const handleSettings = () => {
    setCurrentView("settings");
  };

  return (
    <div className={`${styles.titleBar} drag-region`}>
      <div className={styles.leftSection}>
        <div className={styles.logo} />
        <Text className={styles.title}>HOUT - 澎湃解锁工具箱</Text>
      </div>
      
      <div className={`${styles.rightSection} no-drag`}>
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
            onClick={handleMinimize}
          />
        </Tooltip>
        
        <Tooltip content="关闭" relationship="label">
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            className={`${styles.titleBarButton} ${styles.closeButton}`}
            onClick={handleClose}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default TitleBar;
