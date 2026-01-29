import React, { useState }  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Power24Regular,
  Screenshot24Regular,
  LockClosed24Regular,
  Home24Regular,
  ArrowLeft24Regular,
  Apps24Regular,
  WrenchScrewdriver24Regular,
  WeatherSunny24Regular,
  Wifi124Regular,
  Cellular4GRegular,
  Airplane24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  cardHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  content: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  commandButton: {
    height: "auto",
    minHeight: "64px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    padding: "8px 4px",
    borderRadius: "6px",
  },
  commandIcon: {
    fontSize: "20px",
  },
  commandLabel: {
    fontSize: "11px",
    textAlign: "center",
    lineHeight: "1.2",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
  },
});

interface KeySimulationCardProps {
  device: DeviceInfo;
}

const KeySimulationCard: React.FC<KeySimulationCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { deviceService } = useDeviceService();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(false);
  const [mobileDataEnabled, setMobileDataEnabled] = useState<boolean>(false);
  const [airplaneModeEnabled, setAirplaneModeEnabled] = useState<boolean>(false);
  const { setStatusBarMessage } = useAppStore();

  const executeCommand = async (commandId: string, command: string[], description: string) => {
    if (!device.connected) {
      setStatusBarMessage({
        type: "error",
        message: t('device_control.msg_check_connection'),
      });
      return;
    }

    setExecutingCommand(commandId);
    try {
      let actualCommand = [...command];
      let actualDescription = description;
      
      // 处理切换功能
      if (commandId === "wifi_toggle") {
        const wifiState = wifiEnabled ? "disable" : "enable";
        actualCommand = ["shell", "svc", "wifi", wifiState];
        actualDescription = wifiEnabled ? t('device_control.desc_wifi_off') : t('device_control.desc_wifi_on');
      } else if (commandId === "mobile_data_toggle") {
        const dataState = mobileDataEnabled ? "disable" : "enable";
        actualCommand = ["shell", "svc", "data", dataState];
        actualDescription = mobileDataEnabled ? t('device_control.desc_mobile_data_off') : t('device_control.desc_mobile_data_on');
      } else if (commandId === "airplane_mode") {
        const airplaneState = airplaneModeEnabled ? "0" : "1";
        actualCommand = ["shell", "settings", "put", "global", "airplane_mode_on", airplaneState];
        actualDescription = airplaneModeEnabled ? t('device_control.desc_airplane_mode_off') : t('device_control.desc_airplane_mode_on');
      }
      
      // 检查是否为需要特殊权限的命令
      const isKeyEventCommand = actualCommand.includes('input') && actualCommand.includes('keyevent');
      const isSettingsCommand = actualCommand.includes('settings');
      
      let result;
      try {
        // 首先尝试普通方式执行命令
        result = await deviceService.executeAdbCommand(device.serial, actualCommand[0], actualCommand.slice(1));
        
        if (result.success) {
          setStatusBarMessage({
            type: "success",
            message: actualDescription,
          });
          
          // 更新状态
          if (commandId === "wifi_toggle") {
            setWifiEnabled(!wifiEnabled);
          } else if (commandId === "mobile_data_toggle") {
            setMobileDataEnabled(!mobileDataEnabled);
          } else if (commandId === "airplane_mode") {
            setAirplaneModeEnabled(!airplaneModeEnabled);
          }
        } else {
          // 针对不同类型的权限错误提供不同的错误提示
            if (result.error?.includes('SecurityException')) {
            if (isKeyEventCommand) {
              setStatusBarMessage({
                type: "error",
                message: t('device_control.msg_exec_failed_perm', { desc: description }),
              });
            } else if (isSettingsCommand && result.error?.includes('WRITE_SECURE_SETTINGS')) {
              setStatusBarMessage({
                type: "error",
                message: t('device_control.msg_exec_failed_root', { desc: description }),
              });
            } else {
              setStatusBarMessage({
                type: "error",
                message: t('device_control.msg_exec_failed_special', { desc: description }),
              });
            }
          } else {
            setStatusBarMessage({
              type: "error",
              message: result.error || t('device_control.msg_unknown_error'),
            });
          }
        }
      } catch (error) {
        // 捕获执行过程中的其他错误
        setStatusBarMessage({
          type: "error",
          message: t('device_control.msg_exec_failed', { desc: description, error: error }),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('device_control.msg_exec_failed', { desc: description, error: error }),
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  const systemCommands = [
    {
      id: "screenshot",
      label: t('device_control.screenshot'),
      icon: <Screenshot24Regular />,
      command: ["shell", "screencap", "/sdcard/screenshot.png"],
      description: t('device_control.desc_screenshot'),
    },
    {
      id: "lock_screen",
      label: t('device_control.lock_screen'),
      icon: <LockClosed24Regular />,
      command: ["shell", "input", "keyevent", "26"],
      description: t('device_control.desc_lock_screen'),
    },
    {
      id: "home",
      label: t('device_control.home'),
      icon: <Home24Regular />,
      command: ["shell", "input", "keyevent", "3"],
      description: t('device_control.desc_home'),
    },
    {
      id: "back",
      label: t('device_control.back'),
      icon: <ArrowLeft24Regular />,
      command: ["shell", "input", "keyevent", "4"],
      description: t('device_control.desc_back'),
    },
    {
      id: "recent_apps",
      label: t('device_control.recent_apps'),
      icon: <Apps24Regular />,
      command: ["shell", "input", "keyevent", "187"],
      description: t('device_control.desc_recent_apps'),
    },
    {
      id: "wake_up",
      label: t('device_control.wake_up'),
      icon: <Power24Regular />,
      command: ["shell", "input", "keyevent", "224"],
      description: t('device_control.desc_wake_up'),
    },
    {
      id: "brightness_up",
      label: t('device_control.brightness_up'),
      icon: <WeatherSunny24Regular />,
      command: ["shell", "settings", "put", "system", "screen_brightness", "255"],
      description: t('device_control.desc_brightness_up'),
    },
    {
      id: "brightness_down",
      label: t('device_control.brightness_down'),
      icon: <WeatherSunny24Regular />,
      command: ["shell", "settings", "put", "system", "screen_brightness", "50"],
      description: t('device_control.desc_brightness_down'),
    },
    {
      id: "wifi_toggle",
      label: wifiEnabled ? t('device_control.wifi_toggle_off') : t('device_control.wifi_toggle_on'),
      icon: <Wifi124Regular />,
      command: ["shell", "svc", "wifi", "disable"],
      description: wifiEnabled ? t('device_control.desc_wifi_off') : t('device_control.desc_wifi_on'),
    },
    {
      id: "mobile_data_toggle",
      label: mobileDataEnabled ? t('device_control.mobile_data_off') : t('device_control.mobile_data_on'),
      icon: <Cellular4GRegular />,
      command: ["shell", "svc", "data", "disable"],
      description: mobileDataEnabled ? t('device_control.desc_mobile_data_off') : t('device_control.desc_mobile_data_on'),
    },
    {
      id: "airplane_mode",
      label: airplaneModeEnabled ? t('device_control.airplane_mode_off') : t('device_control.airplane_mode_on'),
      icon: <Airplane24Regular />,
      command: ["shell", "settings", "put", "global", "airplane_mode_on", "1"],
      description: airplaneModeEnabled ? t('device_control.desc_airplane_mode_off') : t('device_control.desc_airplane_mode_on'),
    },
    {
      id: "developer_options",
      label: t('device_control.developer_options'),
      icon: <WrenchScrewdriver24Regular />,
      command: ["shell", "am", "start", "-a", "android.settings.APPLICATION_DEVELOPMENT_SETTINGS"],
      description: t('device_control.desc_developer_options'),
    },
  ];

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        className={styles.cardHeader}
        image={<Settings24Regular />}
        header={<Text weight="semibold" size={300}>{t('device_control.key_simulation')}</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.commandGrid}>
          {systemCommands.map((cmd) => (
            <Button
              key={cmd.id}
              appearance="outline"
              className={styles.commandButton}
              disabled={!isDeviceAvailable || executingCommand === cmd.id}
              onClick={() => executeCommand(cmd.id, cmd.command, cmd.description)}
            >
              {executingCommand === cmd.id ? (
                <Spinner size="tiny" />
              ) : (
                <div className={styles.commandIcon}>{cmd.icon}</div>
              )}
              <Text className={styles.commandLabel} title={cmd.label}>{cmd.label}</Text>
            </Button>
          ))}
        </div>

        {!isDeviceAvailable && (
          <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--colorNeutralForeground3)' }}>
            <Text size={200}>
              {t('device_control.device_unavailable')}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KeySimulationCard;