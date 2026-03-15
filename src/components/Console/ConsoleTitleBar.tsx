import React, { useState, useEffect } from "react";
import {
  makeStyles,
  mergeClasses,
  Text,
  Button,
} from "@fluentui/react-components";
import {
  Subtract24Regular,
  Dismiss24Regular,
  Maximize24Regular,
  SquareMultiple24Regular,
  Pin24Regular,
  PinOff24Regular,
} from "@fluentui/react-icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { admtLogo64 } from "../../assets/icons";

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
    position: "relative",
    zIndex: 100,
    cursor: "default",
    userSelect: "none",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    userSelect: "none",
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
  centerSection: {
    flex: 1,
    height: "100%",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    zIndex: 101,
  },
  titleBarButton: {
    minWidth: "32px",
    height: "32px",
    borderRadius: "4px",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  closeButton: {
    ":hover": {
      backgroundColor: "#E81123 !important",
      color: "white !important",
    },
  },
});

const ConsoleTitleBar: React.FC = () => {
  const styles = useStyles();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [windowTitle, setWindowTitle] = useState("玩机管家");

  useEffect(() => {
    const window = getCurrentWindow();
    
    const updateState = async () => {
      const [max, top, title] = await Promise.all([
        window.isMaximized(),
        window.isAlwaysOnTop(),
        window.title(),
      ]);
      setIsMaximized(max);
      setIsAlwaysOnTop(top);
      setWindowTitle(title);
    };

    updateState();

    const unlisten = window.onResized(() => {
      updateState();
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const onAlwaysOnTop = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const window = getCurrentWindow();
    const current = await window.isAlwaysOnTop();
    await window.setAlwaysOnTop(!current);
    setIsAlwaysOnTop(!current);
  };

  const onMinimize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await getCurrentWindow().minimize();
  };

  const onMaximize = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const window = getCurrentWindow();
    if (await window.isMaximized()) {
      await window.unmaximize();
    } else {
      await window.maximize();
    }
  };

  const onClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 强制关闭当前子窗口，不受主应用关闭逻辑影响
    const window = getCurrentWindow();
    await window.close();
  };

  return (
    <div className={styles.titleBar} data-tauri-drag-region>
      <div className={styles.leftSection} data-tauri-drag-region>
        <img src={admtLogo64} alt="Logo" className={styles.logo} data-tauri-drag-region />
        <Text className={styles.title} data-tauri-drag-region>
          {windowTitle}
        </Text>
      </div>

      <div className={styles.centerSection} data-tauri-drag-region />

      <div className={styles.rightSection}>
        <Button
          appearance="subtle"
          className={styles.titleBarButton}
          icon={isAlwaysOnTop ? <PinOff24Regular /> : <Pin24Regular />}
          onClick={onAlwaysOnTop}
          title={isAlwaysOnTop ? "取消置顶" : "置顶"}
        />
        <Button
          appearance="subtle"
          className={styles.titleBarButton}
          icon={<Subtract24Regular />}
          onClick={onMinimize}
          title="最小化"
        />
        <Button
          appearance="subtle"
          className={styles.titleBarButton}
          icon={isMaximized ? <SquareMultiple24Regular /> : <Maximize24Regular />}
          onClick={onMaximize}
          title={isMaximized ? "还原" : "最大化"}
        />
        <Button
          appearance="subtle"
          className={mergeClasses(styles.titleBarButton, styles.closeButton)}
          icon={<Dismiss24Regular />}
          onClick={onClose}
          title="关闭"
        />
      </div>
    </div>
  );
};

export default ConsoleTitleBar;
