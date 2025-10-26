import React, { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import {
  makeStyles,
  mergeClasses,
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
  Copy24Regular,
  Checkmark24Filled,
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
    backgroundColor: "var(--colorSuccessBackground2)",
    color: "var(--colorSuccessForeground2)",
  },
  notificationWarning: {
    backgroundColor: "var(--colorWarningBackground2)",
    color: "var(--colorWarningForeground2)",
  },
  notificationError: {
    backgroundColor: "var(--colorErrorBackground2)",
    color: "var(--colorErrorForeground2)",
  },
  notificationInfo: {
    backgroundColor: "var(--colorInformationBackground2)",
    color: "var(--colorInformationForeground2)",
  },
});

const StatusBar: React.FC = () => {
  const styles = useStyles();
  const { isLoading, notifications, removeNotification, statusBarMessage, clearStatusBarMessage, config } = useAppStore();

  // 音效文件路径映射
  const soundFiles = {
    info: 'notification-010-352755.mp3',
    warning: 'warning-notification-call-184996.mp3',
    error: 'error-08-206492.mp3',
    success: 'sucess_01.mp3'
  };

  // 播放音效函数
  const playSound = async (type: 'info' | 'warning' | 'error' | 'success') => {
    if (!config.soundEnabled) return;
    
    try {
      // 直接使用Tauri的read_resource_file命令读取文件内容并创建Blob URL
      const soundFile = soundFiles[type];
      
      try {
        // 使用invoke调用后端命令读取文件
        const rawData = await invoke('read_resource_file', {
          path: `music/${soundFile}`
        });
        
        
        // 确保数据存在
        if (!rawData) {
          console.error(`获取${type}音效文件数据为空`);
          return;
        }
        
        // 将数据转换为ArrayBuffer
        let arrayBuffer: ArrayBuffer;
        
        // 处理不同类型的数据返回
        if (Array.isArray(rawData)) {
          // 如果是普通数组，创建Uint8Array并转换为ArrayBuffer
          const uint8Array = new Uint8Array(rawData);
          arrayBuffer = uint8Array.buffer;
        } else if (rawData instanceof ArrayBuffer) {
          // 如果已经是ArrayBuffer，直接使用
          arrayBuffer = rawData;
        } else {
          // 尝试其他转换方式
          console.error(`无法识别的${type}音效数据类型`);
          return;
        }
        
        
        // 创建Blob对象和Blob URL
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        
        // 创建并播放音频
        const audio = new Audio(blobUrl);
        audio.volume = 0.5;
        
        // 设置事件监听器
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(blobUrl); // 清理资源
        });
        
        audio.addEventListener('error', (error) => {
          console.error(`${type}音效播放出错:`, error);
          URL.revokeObjectURL(blobUrl); // 清理资源
        });
        
        // 尝试播放
        await audio.play();
        console.log(`成功开始播放${type}音效`);
      } catch (error) {
        console.error(`读取或播放${type}音效失败:`, error);
        
        // 添加更多的错误处理和日志记录
        try {
          // 尝试获取资源路径作为备选方案
          const resourcePath = await invoke('get_resource_path', {
            path: `music/${soundFile}`
          }) as string;
          console.log(`备选路径: ${resourcePath}`);
        } catch (pathError) {
          console.error(`获取${type}音效资源路径失败:`, pathError);
        }
      }
    } catch (error) {
      console.error(`创建${type}音效失败:`, error);
    }
  };



  const [currentNotification, setCurrentNotification] = useState<NotificationMessage | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);
  const [notificationTimer, setNotificationTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [progressTimer, setProgressTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [copiedNotificationId, setCopiedNotificationId] = useState<string | null>(null);
  const [isStatusBarMessageCopied, setIsStatusBarMessageCopied] = useState(false);

  // 监听状态栏消息变化，播放对应音效
  useEffect(() => {
    if (statusBarMessage && config.soundEnabled) {
      (async () => {
        await playSound(statusBarMessage.type as 'info' | 'warning' | 'error' | 'success');
      })();
    }
  }, [statusBarMessage, config.soundEnabled])

  // 复制状态栏消息内容
  const handleCopyStatusBarMessage = async () => {
    try {
      await navigator.clipboard.writeText(statusBarMessage?.message || '');
      setIsStatusBarMessageCopied(true);
      
      // 1秒后重置按钮状态
      setTimeout(() => {
        setIsStatusBarMessageCopied(false);
      }, 1000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 复制通知内容
  const handleCopyNotification = async (notification: NotificationMessage) => {
    try {
      const textToCopy = `${notification.title}: ${notification.message}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedNotificationId(notification.id);
      
      // 1秒后重置按钮状态
      setTimeout(() => {
        setCopiedNotificationId(null);
      }, 1000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

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
      
      // 播放通知音效
      playSound(latestNotification.type);

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
      <div className={mergeClasses(
        styles.defaultContent, 
        ((currentNotification && isNotificationVisible) || statusBarMessage) && styles.defaultContentHidden
      )}>
        {/* 左侧状态信息 */}
        <div className={styles.leftSection}>
          {isLoading && (
            <div className={styles.statusItem}>
              <Spinner size="extra-small" className={styles.spinner} />
              <span className="text-200">处理中...</span>
            </div>
          )}
        </div>

        {/* 中间区域 - 默认显示信息 */}
        <div className={styles.centerSection}>
          <span className="text-200">领创工作室全栈开发</span>
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
          {/* 复制按钮 */}
          <button
            onClick={handleCopyStatusBarMessage}
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
              marginRight: "4px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            title="复制消息内容"
          >
            {isStatusBarMessageCopied ? (
              <Checkmark24Filled style={{ fontSize: "16px" }} />
            ) : (
              <Copy24Regular style={{ fontSize: "16px" }} />
            )}
          </button>
          
          {/* 关闭按钮 */}
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
          <span style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "12px",
            fontWeight: "500"
          }}>
            {currentNotification.title}: {currentNotification.message}
          </span>

          {/* 复制按钮 */}
          <button
            onClick={() => handleCopyNotification(currentNotification)}
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
            title="复制通知内容"
          >
            {copiedNotificationId === currentNotification.id ? (
              <Checkmark24Filled />
            ) : (
              <Copy24Regular />
            )}
          </button>
          
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
