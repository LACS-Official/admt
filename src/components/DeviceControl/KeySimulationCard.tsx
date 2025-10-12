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
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from '@/stores/appStore';

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
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
    borderRadius: "6px",
  },
  commandIcon: {
    fontSize: "24px",
  },
  commandLabel: {
    fontSize: "14px",
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
      const result = await deviceService.executeAdbCommand(device.serial, command[0], command.slice(1));
      if (result.success) {
        setStatusBarMessage({
          type: "success",
          message: description,
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "未知错误",
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