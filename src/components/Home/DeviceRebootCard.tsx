import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  Power24Regular,
  Warning24Regular,
  ArrowClockwise24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  card: {
    height: "150px",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "box-shadow 0.2s ease",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
    },
  },
  content: {
    flex: 1,
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  deviceStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
  },
  rebootOptions: {
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    flex: 1,
    alignItems: "stretch",
  },
  rebootOption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px 4px",
    border: "1px solid var(--colorNeutralStroke3)",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "28px",
    textAlign: "center",
    flex: 1,
    minWidth: 0,
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
    },
  },
  rebootOptionPending: {
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    border: "1px solid var(--colorPaletteYellowBorder1)",
  },
  rebootOptionContent: {
    display: "flex",
    flexDirection: "row", // 改为水平排版：左边图标右边文字
    alignItems: "center",
    gap: "4px", // 增加图标和文字之间的间距
    justifyContent: "flex-start", // 左对齐
  },
  rebootOptionIcon: {
    fontSize: "12px", // 稍微增大图标以适配水平布局
    color: "var(--colorBrandForeground1)",
    flexShrink: 0, // 防止图标被压缩
  },
  rebootOptionTitle: {
    fontSize: "8px", // 稍微增大文字以适配水平布局
    fontWeight: "600",
    textAlign: "left", // 改为左对齐
    lineHeight: "1.0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1, // 文字占据剩余空间
  },
  rebootOptionBadge: {
    fontSize: "7px",
    padding: "1px 3px",
    minHeight: "12px",
    flexShrink: 0, // 防止徽章被压缩
    marginLeft: "auto", // 推到右边
  },
  rebootButton: {
    width: "100%",
    justifyContent: "flex-start",
  },
  warningText: {
    color: "var(--colorPaletteRedForeground1)",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
});

interface RebootOption {
  id: string;
  label: string;
  description: string;
  command: string;
  warning?: boolean;
}

const DeviceRebootCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { setStatusBarMessage } = useAppStore();
  const [isRebooting, setIsRebooting] = useState(false);
  const [pendingRebootOption, setPendingRebootOption] = useState<RebootOption | null>(null);
  const [confirmationTimeout, setConfirmationTimeout] = useState<number | null>(null);
  const [_rebootCountdown, setRebootCountdown] = useState<number | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);

  const rebootOptions: RebootOption[] = [
    {
      id: "normal",
      label: "正常重启",
      description: "重启到Android系统",
      command: "system", // 后端期望的参数
    },
    {
      id: "recovery",
      label: "重启到Recovery",
      description: "进入恢复模式",
      command: "recovery", // 后端期望的参数
      warning: true,
    },
    {
      id: "bootloader",
      label: "重启到Bootloader",
      description: "进入引导加载程序模式",
      command: "bootloader", // 后端期望的参数
      warning: true,
    },
    {
      id: "fastboot",
      label: "重启到Fastboot",
      description: "进入快速启动模式",
      command: "fastboot", // 后端期望的参数
      warning: true,
    },
  ];

  // 清理确认状态的函数
  const clearPendingReboot = () => {
    setPendingRebootOption(null);
    if (confirmationTimeout) {
      clearTimeout(confirmationTimeout);
      setConfirmationTimeout(null);
    }
  };

  // 清理倒计时的函数
  const clearCountdown = () => {
    setRebootCountdown(null);
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      setCountdownTimer(null);
    }
  };

  // 处理重启按钮点击 - 双击确认机制
  const handleReboot = async (option: RebootOption) => {
    if (!selectedDevice) {
      setStatusBarMessage({
        type: "error",
        message: "请先连接一个设备",
        duration: 3000,
      });
      return;
    }

    if (!selectedDevice.connected) {
      setStatusBarMessage({
        type: "error",
        message: "设备未连接，无法执行重启操作",
        duration: 3000,
      });
      return;
    }

    if (isRebooting) return;

    // 如果当前有待确认的重启选项且是同一个选项，执行重启
    if (pendingRebootOption && pendingRebootOption.id === option.id) {
      await executeReboot(option);
      return;
    }

    // 第一次点击：设置待确认状态
    setPendingRebootOption(option);

    // 清除之前的超时
    if (confirmationTimeout) {
      clearTimeout(confirmationTimeout);
    }

    // 设置5秒后自动清除确认状态
    const timeout = setTimeout(() => {
      setPendingRebootOption(null);
      setConfirmationTimeout(null);
    }, 5000);

    setConfirmationTimeout(timeout);

    // 在状态栏显示确认提示
    setStatusBarMessage({
      type: "warning",
      message: `请再次点击 ${option.label} 确认执行重启操作`,
      icon: <Warning24Regular />,
      duration: 5000,
    });
  };

  // 执行实际的重启操作
  const executeReboot = async (option: RebootOption) => {
    if (!selectedDevice) return;

    setIsRebooting(true);
    clearPendingReboot();

    // 开始2秒倒计时
    setRebootCountdown(2);
    setStatusBarMessage({
      type: "warning",
      message: `正在重启到 ${option.label}... (2秒)`,
      icon: <Power24Regular />,
    });

    // 倒计时逻辑
    let countdown = 2;
    const countdownInterval = setInterval(() => {
      countdown--;
      setRebootCountdown(countdown);

      if (countdown > 0) {
        setStatusBarMessage({
          type: "warning",
          message: `正在重启到 ${option.label}... (${countdown}秒)`,
          icon: <Power24Regular />,
        });
      } else {
        clearInterval(countdownInterval);
        setCountdownTimer(null);
        performReboot(option);
      }
    }, 1000);

    setCountdownTimer(countdownInterval);
  };

  // 执行重启命令
  const performReboot = async (option: RebootOption) => {
    if (!selectedDevice) return;

    try {
      setStatusBarMessage({
        type: "info",
        message: `正在发送重启命令...`,
        icon: <Power24Regular />,
      });

      await invoke("reboot_device", {
        serial: selectedDevice.serial,
        mode: option.command,
      });

      setStatusBarMessage({
        type: "success",
        message: `重启命令已发送，设备正在${option.label}`,
        duration: 3000,
      });
    } catch (error) {
      let errorMessage = "重启失败：未知错误";

      if (error instanceof Error) {
        errorMessage = `重启失败：${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `重启失败：${error}`;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `重启失败：${(error as { message: string }).message}`;
      }

      setStatusBarMessage({
        type: "error",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsRebooting(false);
      clearCountdown();
    }
  };



  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      if (confirmationTimeout) {
        clearTimeout(confirmationTimeout);
      }
      if (countdownTimer) {
        clearTimeout(countdownTimer);
      }
    };
  }, [confirmationTimeout, countdownTimer]);

  return (
    <Card className={styles.card}>
      <CardHeader
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Power24Regular />
            <Text weight="semibold">设备重启</Text>
          </div>
        }
      />

      <div className={styles.content}>
        {/* 重启选项列表 */}
        <div className={styles.rebootOptions}>
          {rebootOptions.map((option) => (
            <div
              key={option.id}
              className={`${styles.rebootOption} ${
                pendingRebootOption?.id === option.id ? styles.rebootOptionPending : ""
              }`}
              onClick={() => handleReboot(option)}
            >
              <div className={styles.rebootOptionContent}>
                <div className={styles.rebootOptionIcon}>
                  {option.id === "normal" ? <ArrowClockwise24Regular /> : <Power24Regular />}
                </div>
                <Text className={styles.rebootOptionTitle}>
                  {option.label}
                </Text>
                {pendingRebootOption?.id === option.id && (
                  <Badge appearance="filled" color="warning" className={styles.rebootOptionBadge}>
                    待确认
                  </Badge>
                )}
                {isRebooting && pendingRebootOption?.id === option.id && (
                  <Spinner size="tiny" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>


    </Card>
  );
};

export default DeviceRebootCard;
