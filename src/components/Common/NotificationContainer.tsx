import React from "react";
import {
  makeStyles,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  ToastIntent,
} from "@fluentui/react-components";
import {
  Checkmark24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  toaster: {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 10000,
  },
});

const NotificationContainer: React.FC = () => {
  const styles = useStyles();
  const { notifications, removeNotification } = useAppStore();
  const { dispatchToast } = useToastController();

  // 监听通知变化并显示Toast
  React.useEffect(() => {
    notifications.forEach((notification) => {
      const getIcon = () => {
        switch (notification.type) {
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

      const getIntent = (): ToastIntent => {
        switch (notification.type) {
          case "success":
            return "success";
          case "warning":
            return "warning";
          case "error":
            return "error";
          case "info":
          default:
            return "info";
        }
      };

      dispatchToast(
        <Toast>
          <ToastTitle media={getIcon()}>
            {notification.title}
          </ToastTitle>
          <ToastBody>
            {notification.message}
          </ToastBody>
        </Toast>,
        {
          intent: getIntent(),
          timeout: notification.duration || 5000,
          onStatusChange: (e, data) => {
            if (data.status === "dismissed") {
              removeNotification(notification.id);
            }
          },
        }
      );
    });
  }, [notifications, dispatchToast, removeNotification]);

  return <Toaster className={styles.toaster} />;
};

export default NotificationContainer;
