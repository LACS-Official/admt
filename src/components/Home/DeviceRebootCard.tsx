import React, { useState } from 'react';
import {
  makeStyles,
  shorthands,
  mergeClasses,
  Card,
  CardHeader,
  Text,
  Badge,
  Spinner,
  Button,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  Power24Regular,
  Warning24Regular,
  ArrowClockwise24Regular,
  Wrench24Regular,
  DeveloperBoard24Regular,
  Flash24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    padding: "20px 24px",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  rebootOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    flex: 1,
  },
  rebootOption: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "12px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    cursor: "pointer",
    minHeight: "88px",
    boxSizing: "border-box",
    position: "relative",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    },
    ":active": {
      transform: "translateY(0)",
    },
  },
  rebootOptionPending: {
    border: "1px solid var(--colorBrandStroke1)",
    backgroundColor: "rgba(0, 113, 227, 0.08)",
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },
  rebootOptionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.3",
  },
  rebootOptionDesc: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.4",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
});

interface RebootOption {
  id: string;
  label: string;
  description: string;
  command: string;
  warning?: boolean;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
}

interface DeviceRebootCardProps {
  device?: any;
}

const DeviceRebootCard: React.FC<DeviceRebootCardProps> = ({ device: propDevice }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice: storeDevice } = useDeviceStore();
  const selectedDevice = propDevice || storeDevice;
  const { setStatusBarMessage } = useAppStore();
  const [isRebooting, setIsRebooting] = useState(false);
  const [pendingRebootOption, setPendingRebootOption] = useState<RebootOption | null>(null);
  const [confirmationTimeout, setConfirmationTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [_rebootCountdown, setRebootCountdown] = useState<number | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  const rebootOptions: RebootOption[] = [
    {
      id: "normal",
      label: t('reboot.system'),
      description: "重启至 Android 系统",
      command: "system",
      icon: <ArrowClockwise24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
    },
    {
      id: "recovery",
      label: t('reboot.recovery'),
      description: "升级包刷入与双清恢复",
      command: "recovery",
      warning: true,
      icon: <Wrench24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "引导",
    },
    {
      id: "bootloader",
      label: t('reboot.bootloader'),
      description: "引导加载程序模式",
      command: "bootloader",
      warning: true,
      icon: <DeveloperBoard24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "引导",
    },
    {
      id: "fastboot",
      label: t('reboot.fastboot'),
      description: "底层分区与固件线刷",
      command: "fastboot",
      warning: true,
      icon: <Flash24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "常用",
    },
    {
      id: "edl",
      label: t('reboot.edl'),
      description: "高通 9008 深度救砖",
      command: "edl",
      warning: true,
      icon: <Warning24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "底层",
    },
    {
      id: "poweroff",
      label: t('reboot.poweroff'),
      description: "安全切断电源并关机",
      command: "poweroff",
      warning: true,
      icon: <Power24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
    },
  ];

  // 判断设备是否处于fastboot模式
  const isDeviceInFastbootMode = () => {
    return selectedDevice?.mode === "fastboot" || selectedDevice?.mode === "fastbootd";
  };

  // 获取可用的重启选项列表
  const getAvailableRebootOptions = () => {
    if (isDeviceInFastbootMode()) {
      // 在fastboot模式下，过滤掉关机模式
      return rebootOptions.filter(option => option.id !== "poweroff");
    }
    return rebootOptions;
  };

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
        message: t('error.no_device'),
        duration: 3000,
      });
      return;
    }

    if (selectedDevice?.serial === "DEMO-ADB-001") {
      setStatusBarMessage({
        type: "warning",
        message: t('reboot.demo_mode'),
        duration: 3000,
      });
      return;
    }

    if (!selectedDevice.connected) {
      setStatusBarMessage({
        type: "error",
        message: t('error.device_not_connected'),
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
      message: t('reboot.confirm_click', { label: option.label }),
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
      message: t('reboot.rebooting_countdown', { label: option.label, seconds: 2 }),
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
          message: t('reboot.rebooting_countdown', { label: option.label, seconds: countdown }),
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
        message: t('reboot.sending_command'),
        icon: <Power24Regular />,
      });

      await invoke("reboot_device", {
        serial: selectedDevice.serial,
        mode: option.command,
      });

      setStatusBarMessage({
        type: "success",
        message: t('reboot.command_sent', { label: option.label }),
        duration: 3000,
      });
    } catch (error) {
      let errorMessage = t('reboot.failed_unknown');

      if (error instanceof Error) {
        errorMessage = t('reboot.failed_message', { message: error.message });
      } else if (typeof error === 'string') {
        errorMessage = t('reboot.failed_message', { message: error });
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = t('reboot.failed_message', { message: (error as { message: string }).message });
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
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowClockwise24Regular style={{ color: "var(--colorBrandForeground1)" }} />
            <Text weight="semibold" size={400}>{t('reboot.title')}</Text>
          </div>
        </div>
      </div>

      <div className={styles.rebootOptions}>
        {getAvailableRebootOptions().map((option) => {
          const isPending = pendingRebootOption?.id === option.id;
          return (
            <div
              key={option.id}
              className={mergeClasses(
                styles.rebootOption,
                isPending && styles.rebootOptionPending
              )}
              onClick={() => handleReboot(option)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: "8px" }}>
                <div
                  className={styles.iconBox}
                  style={{
                    backgroundColor: option.iconBg || "var(--colorNeutralBackground3)",
                    color: option.iconColor || "var(--colorBrandForeground1)",
                  }}
                >
                  {option.icon || <ArrowClockwise24Regular />}
                </div>
              </div>

              <div>
                <Text className={styles.rebootOptionTitle}>
                  {option.label}
                </Text>
                <div className={styles.rebootOptionDesc}>
                  {isPending ? (
                    <span style={{ color: "var(--colorBrandForeground1)", fontWeight: 600 }}>再次点击确认执行</span>
                  ) : (
                    option.description
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DeviceRebootCard;
