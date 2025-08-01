import React from "react";
import {
  makeStyles,
  Text,
} from "@fluentui/react-components";
import {
  Power24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    height: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
    color: "var(--colorNeutralForeground2)",
    maxWidth: "400px",
  },
  icon: {
    fontSize: "64px",
    color: "var(--colorNeutralForeground3)",
    opacity: 0.6,
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  description: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "var(--colorNeutralForeground2)",
  },
});

const DeviceControlPanel: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.placeholder}>
        <Power24Regular className={styles.icon} />
        <Text className={styles.title}>设备控制</Text>
        <Text className={styles.description}>
          此功能正在开发中，敬请期待...
          <br />
          您可以在主页中使用设备重启和基础操作功能。
        </Text>
      </div>
    </div>
  );
};

export default DeviceControlPanel;
