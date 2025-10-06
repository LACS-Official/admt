import { Text, MessageBar } from "@fluentui/react-components";
import { useAppStyles } from "../../styles/appStyles";

interface ErrorNotificationProps {
  error: string;
  countdown: number;
}

export const ErrorNotification = ({ error, countdown }: ErrorNotificationProps) => {
  const styles = useAppStyles();

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
};