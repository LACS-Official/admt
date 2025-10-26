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

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "8px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  commandButton: {
    height: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "8px",
  },
  commandIcon: {
    fontSize: "24px",
  },
  commandLabel: {
    fontSize: "12px",
    textAlign: "center",
    lineHeight: "1.2",
  },
});

interface KeySimulationCardProps {
  device: DeviceInfo;
}

const KeySimulationCard: React.FC<KeySimulationCardProps> = ({ device }) => {
  const styles = useStyles();
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
        message: "请确保设备已连接并启用USB调试",
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
        actualDescription = wifiEnabled ? "关闭WiFi" : "开启WiFi";
      } else if (commandId === "mobile_data_toggle") {
        const dataState = mobileDataEnabled ? "disable" : "enable";
        actualCommand = ["shell", "svc", "data", dataState];
        actualDescription = mobileDataEnabled ? "关闭移动数据" : "开启移动数据";
      } else if (commandId === "airplane_mode") {
        const airplaneState = airplaneModeEnabled ? "0" : "1";
        actualCommand = ["shell", "settings", "put", "global", "airplane_mode_on", airplaneState];
        actualDescription = airplaneModeEnabled ? "关闭飞行模式" : "开启飞行模式";
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
                message: `执行${description}失败：需要设备USB调试安全设置权限或无障碍服务权限`,
              });
            } else if (isSettingsCommand && result.error?.includes('WRITE_SECURE_SETTINGS')) {
              setStatusBarMessage({
                type: "error",
                message: `执行${description}失败：需要设备WRITE_SECURE_SETTINGS权限（通常需要root权限）`,
              });
            } else {
              setStatusBarMessage({
                type: "error",
                message: `执行${description}失败：需要设备特殊权限`,
              });
            }
          } else {
            setStatusBarMessage({
              type: "error",
              message: result.error || "未知错误",
            });
          }
        }
      } catch (error) {
        // 捕获执行过程中的其他错误
        setStatusBarMessage({
          type: "error",
          message: `${description}失败: ${error}`,
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `${description}失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  const systemCommands = [
    {
      id: "screenshot",
      label: "截屏",
      icon: <Screenshot24Regular />,
      command: ["shell", "screencap", "/sdcard/screenshot.png"],
      description: "截取屏幕截图",
    },
    {
      id: "lock_screen",
      label: "锁屏",
      icon: <LockClosed24Regular />,
      command: ["shell", "input", "keyevent", "26"],
      description: "锁定屏幕",
    },
    {
      id: "home",
      label: "返回主屏",
      icon: <Home24Regular />,
      command: ["shell", "input", "keyevent", "3"],
      description: "返回主屏幕",
    },
    {
      id: "back",
      label: "返回",
      icon: <ArrowLeft24Regular />,
      command: ["shell", "input", "keyevent", "4"],
      description: "模拟返回键",
    },
    {
      id: "recent_apps",
      label: "最近应用",
      icon: <Apps24Regular />,
      command: ["shell", "input", "keyevent", "187"],
      description: "打开最近应用",
    },
    {
      id: "wake_up",
      label: "唤醒屏幕",
      icon: <Power24Regular />,
      command: ["shell", "input", "keyevent", "224"],
      description: "唤醒设备屏幕",
    },
    {
      id: "brightness_up",
      label: "增加亮度",
      icon: <WeatherSunny24Regular />,
      command: ["shell", "settings", "put", "system", "screen_brightness", "255"],
      description: "增加屏幕亮度",
    },
    {
      id: "brightness_down",
      label: "降低亮度",
      icon: <WeatherSunny24Regular />,
      command: ["shell", "settings", "put", "system", "screen_brightness", "50"],
      description: "降低屏幕亮度",
    },
    {
      id: "wifi_toggle",
      label: wifiEnabled ? "关闭WiFi" : "开启WiFi",
      icon: <Wifi124Regular />,
      command: ["shell", "svc", "wifi", "disable"],
      description: wifiEnabled ? "关闭WiFi" : "开启WiFi",
    },
    {
      id: "mobile_data_toggle",
      label: mobileDataEnabled ? "关闭数据" : "开启数据",
      icon: <Cellular4GRegular />,
      command: ["shell", "svc", "data", "disable"],
      description: mobileDataEnabled ? "关闭移动数据" : "开启移动数据",
    },
    {
      id: "airplane_mode",
      label: airplaneModeEnabled ? "关闭飞行" : "开启飞行",
      icon: <Airplane24Regular />,
      command: ["shell", "settings", "put", "global", "airplane_mode_on", "1"],
      description: airplaneModeEnabled ? "关闭飞行模式" : "开启飞行模式",
    },
    {
      id: "developer_options",
      label: "开发者选项",
      icon: <WrenchScrewdriver24Regular />,
      command: ["shell", "am", "start", "-a", "android.settings.APPLICATION_DEVELOPMENT_SETTINGS"],
      description: "打开开发者选项",
    },
  ];

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Settings24Regular />}
        header={<Text weight="semibold">按键模拟</Text>}
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
                <Spinner size="small" />
              ) : (
                <div className={styles.commandIcon}>{cmd.icon}</div>
              )}
              <Text className={styles.commandLabel}>{cmd.label}</Text>
            </Button>
          ))}
        </div>

        {!isDeviceAvailable && (
          <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
            设备未连接或不在系统模式
          </Text>
        )}
      </div>
    </Card>
  );
};

export default KeySimulationCard;