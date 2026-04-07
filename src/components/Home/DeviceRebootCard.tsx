import React, { useState }  from 'react';
import {
  makeStyles,
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
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    height: "200px",
    minWidth: "200px",
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
    padding: "8px",
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
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "6px",
    flex: 1,
    alignItems: "stretch",
  },
  rebootOption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 4px",
    border: "1px solid var(--colorNeutralStroke3)",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "40px",
    textAlign: "center",
    minWidth: 0,
    position: "relative",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },
  rebootOptionPending: {
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    border: "1px solid var(--colorPaletteYellowBorder1)",
  },
  rebootOptionContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px",
    justifyContent: "flex-start",
    height: "100%",
    position: "relative",
  },
  rebootOptionTitle: {
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
  rebootOptionBadge: {
    fontSize: "8px",
    minHeight: "14px",
    flexShrink: 0,
    position: "absolute",
    top: "2px",
    right: "2px",
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
      description: t('reboot.system_desc'),
      command: "system", 
    },
    {
      id: "recovery",
      label: t('reboot.recovery'),
      description: t('reboot.recovery_desc'),
      command: "recovery", 
      warning: true,
    },
    {
      id: "bootloader",
      label: t('reboot.bootloader'),
      description: t('reboot.bootloader_desc'),
      command: "bootloader", 
      warning: true,
    },
    {
      id: "fastboot",
      label: t('reboot.fastboot'),
      description: t('reboot.fastboot_desc'),
      command: "fastboot", 
      warning: true,  
    },
    {
      id: "edl",
      label: t('reboot.edl'),
      description: t('reboot.edl_desc'),
      command: "edl", 
      warning: true,
    },
    {
      id: "poweroff",
      label: t('reboot.poweroff'),
      description: t('reboot.poweroff_desc'),
      command: "poweroff",
      warning: true,
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
      <CardHeader
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowClockwise24Regular />
            <Text weight="semibold">{t('reboot.title')}</Text>
          </div>
        }
      />

      <div className={styles.content}>
        {/* 重启选项列表 */}
        <div className={styles.rebootOptions}>
          {getAvailableRebootOptions().map((option) => (
            <div
              key={option.id}
              className={mergeClasses(
                styles.rebootOption,
                pendingRebootOption?.id === option.id && styles.rebootOptionPending
              )}
              onClick={() => handleReboot(option)}
            >
              <div className={styles.rebootOptionContent}>
                <Text className={styles.rebootOptionTitle}>
                  {option.label}
                </Text>
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
