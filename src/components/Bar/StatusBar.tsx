import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import {
  Checkmark24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { useAppStore, StatusBarMessage } from "../../stores/appStore";
import { NotificationMessage } from "../../types/app";

const useStyles = makeStyles({
  statusBar: {
    height: "48px", // 与标题栏同高
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    paddingLeft: "16px",
    paddingRight: "16px",
    fontSize: "12px",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
  },
  // 默认内容样式
  defaultContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    opacity: "1",
    transform: "translateY(0)",
    transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
    zIndex: "1",
  },
  defaultContentHidden: {
    opacity: "0",
    transform: "translateY(-10px)",
    pointerEvents: "none",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: "1",
    minWidth: "0",
  },
  centerSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "2",
    minWidth: "0",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    // 响应式设计
    "@media (max-width: 1024px)": {
      fontSize: "11px",
    },
    "@media (max-width: 800px)": {
      display: "none", // 小屏幕时隐藏中间内容
    },
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "1",
    justifyContent: "flex-end",
    minWidth: "0",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  spinner: {
    width: "14px",
    height: "14px",
  },
  // 通知内容样式
  notificationContent: {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "12px",
    paddingLeft: "16px",
    paddingRight: "16px",
    opacity: "0",
    transform: "translateY(10px)",
    transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out, background-color 0.3s ease-in-out",
    zIndex: "20",
    borderRadius: "0",
    // 默认背景色，防止透明
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  notificationVisible: {
    opacity: "1",
    transform: "translateY(0)",
  },
  notificationIcon: {
    flexShrink: "0",
    width: "18px",
    height: "18px",
  },
  notificationText: {
    flex: "1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "12px",
    fontWeight: "500",
    // 响应式设计
    "@media (max-width: 1024px)": {
      fontSize: "11px",
    },
    "@media (max-width: 800px)": {
      fontSize: "10px",
    },
  },
  // 通知类型颜色
  notificationSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  notificationWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  notificationError: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  notificationInfo: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2,
  },
});

const StatusBar: React.FC = () => {
  const styles = useStyles();
  const { isLoading, notifications, removeNotification, statusBarMessage, clearStatusBarMessage } = useAppStore();



  const [currentNotification, setCurrentNotification] = useState<NotificationMessage | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);
  const [notificationTimer, setNotificationTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [progressTimer, setProgressTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // 手动关闭通知
  const handleCloseNotification = () => {
    if (currentNotification) {
      // 清理定时器
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        setNotificationTimer(null);
      }
      if (progressTimer) {
        clearInterval(progressTimer);
        setProgressTimer(null);
      }

      // 隐藏通知
      setIsNotificationVisible(false);
      setTimeout(() => {
        setCurrentNotification(null);
        removeNotification(currentNotification.id);
        setProgressWidth(100);
      }, 300);
    }
  };

  // 处理通知显示逻辑
  useEffect(() => {
    if (notifications.length > 0 && !currentNotification) {
      const latestNotification = notifications[notifications.length - 1];
      setCurrentNotification(latestNotification);
      setProgressWidth(100);

      // 延迟显示通知，确保DOM更新完成
      const showTimer = setTimeout(() => {
        setIsNotificationVisible(true);
      }, 50);

      // 3秒后自动隐藏通知
      const hideTimer = setTimeout(() => {
        setIsNotificationVisible(false);
        // 等待动画完成后清理状态
        setTimeout(() => {
          setCurrentNotification(null);
          removeNotification(latestNotification.id);
          setProgressWidth(100);
          setNotificationTimer(null);
          setProgressTimer(null);
        }, 300);
      }, 3000);
      setNotificationTimer(hideTimer);

      // 进度条动画 - 每100ms更新一次
      const progressInterval = setInterval(() => {
        setProgressWidth(prev => {
          const newWidth = prev - (100 / 30); // 3秒 = 3000ms, 每100ms减少3.33%
          return newWidth <= 0 ? 0 : newWidth;
        });
      }, 100);
      setProgressTimer(progressInterval);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        clearInterval(progressInterval);
        setNotificationTimer(null);
        setProgressTimer(null);
      };
    }
  }, [notifications, currentNotification, removeNotification]);

  // 清理已经不存在的通知
  useEffect(() => {
    if (currentNotification && !notifications.find(n => n.id === currentNotification.id)) {
      // 清理定时器
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        setNotificationTimer(null);
      }
      if (progressTimer) {
        clearInterval(progressTimer);
        setProgressTimer(null);
      }

      setCurrentNotification(null);
      setIsNotificationVisible(false);
      setProgressWidth(100);
    }
  }, [notifications, currentNotification]);

  // 获取通知图标
  const getNotificationIcon = (type: NotificationMessage['type']) => {
    switch (type) {
      case "success":
        return <Checkmark24Regular className={styles.notificationIcon} />;
      case "warning":
        return <Warning24Regular className={styles.notificationIcon} />;
      case "error":
        return <ErrorCircle24Regular className={styles.notificationIcon} />;
      case "info":
      default:
        return <Info24Regular className={styles.notificationIcon} />;
    }
  };



  // 获取状态栏消息的图标
  const getStatusBarMessageIcon = (type: StatusBarMessage['type']) => {
    switch (type) {
      case "success":
        return <Checkmark24Regular />;
      case "warning":
        return <Warning24Regular />;
      case "error":
        return <ErrorCircle24Regular />;
      case "info":
      default:
        return <Info24Regular />;
    }
  };

  // 获取状态栏消息的颜色
  const getStatusBarMessageColor = (type: StatusBarMessage['type']) => {
    switch (type) {
      case "success":
        return { backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb" };
      case "warning":
        return { backgroundColor: "#fff3cd", color: "#856404", border: "1px solid #ffeaa7" };
      case "error":
        return { backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb" };
      case "info":
      default:
        return { backgroundColor: "#d1ecf1", color: "#0c5460", border: "1px solid #bee5eb" };
    }
  };

  return (
    <div className={styles.statusBar}>
      {/* 默认内容 */}
      <div className={`${styles.defaultContent} ${(currentNotification && isNotificationVisible) || statusBarMessage ? styles.defaultContentHidden : ''}`}>
        {/* 左侧状态信息 */}
        <div className={styles.leftSection}>
          {isLoading && (
            <div className={styles.statusItem}>
              <Spinner size="extra-small" className={styles.spinner} />
              <Text size={200}>处理中...</Text>
            </div>
          )}
        </div>

        {/* 中间区域 - 默认显示信息 */}
        <div className={styles.centerSection}>
          <Text size={200}>官方网站: lacs.cc | 官方微信: lacs177 | 领创工作室全栈开发</Text>
        </div>

        {/* 右侧状态信息 */}
        <div className={styles.rightSection}>
          {/* 可以添加其他状态信息 */}
        </div>
      </div>

      {/* 状态栏消息 - 优先级高于通知 */}
      {statusBarMessage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            zIndex: 25, // 比通知更高的层级
            display: "flex",
            alignItems: "center",
            paddingLeft: "16px",
            paddingRight: "16px",
            gap: "12px",
            ...getStatusBarMessageColor(statusBarMessage.type),
            opacity: 1,
            transform: "translateY(0)",
            transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
          }}
        >
          {statusBarMessage.icon || getStatusBarMessageIcon(statusBarMessage.type)}
          <Text size={200} style={{ flex: 1, fontWeight: "500", color: "inherit" }}>
            {statusBarMessage.message}
          </Text>
          <button
            onClick={clearStatusBarMessage}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            <Dismiss24Regular style={{ fontSize: "16px" }} />
          </button>
        </div>
      )}

      {/* 通知内容 */}
      {currentNotification && !statusBarMessage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            paddingLeft: "16px",
            paddingRight: "16px",
            gap: "12px",
            backgroundColor: currentNotification.type === "success" ? "#d4edda" :
                           currentNotification.type === "error" ? "#f8d7da" :
                           currentNotification.type === "warning" ? "#fff3cd" : "#d1ecf1",
            color: currentNotification.type === "success" ? "#155724" :
                   currentNotification.type === "error" ? "#721c24" :
                   currentNotification.type === "warning" ? "#856404" : "#0c5460",
            opacity: isNotificationVisible ? 1 : 0,
            transform: isNotificationVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
          }}
        >
          {getNotificationIcon(currentNotification.type)}
          <Text style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {currentNotification.title}: {currentNotification.message}
          </Text>

          {/* 关闭按钮 */}
          <button
            onClick={handleCloseNotification}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "44px",
              minHeight: "44px",
              color: "inherit",
              transition: "background-color 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Dismiss24Regular />
          </button>

          {/* 进度条 */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: "3px",
            width: `${progressWidth}%`,
            backgroundColor: currentNotification.type === "success" ? "#28a745" :
                           currentNotification.type === "error" ? "#dc3545" :
                           currentNotification.type === "warning" ? "#ffc107" : "#007bff",
            transition: "width 0.1s linear",
            zIndex: 21,
          }} />
        </div>
      )}
    </div>
  );
};

export default StatusBar;
