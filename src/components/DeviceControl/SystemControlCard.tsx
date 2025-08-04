import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Input,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  BrightnessHigh24Regular,
  Speaker224Regular,
  Power24Regular,
  Screenshot24Regular,
  LockClosed24Regular,
  Home24Regular,
  ArrowLeft24Regular,
  Apps24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  commandButton: {
    height: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px",
  },
  commandIcon: {
    fontSize: "24px",
  },
  commandLabel: {
    fontSize: "12px",
    textAlign: "center",
    lineHeight: "1.2",
  },
  inputField: {
    marginBottom: "12px",
  },
});

interface SystemControlCardProps {
  device: DeviceInfo;
}

const SystemControlCard: React.FC<SystemControlCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [brightnessValue, setBrightnessValue] = useState("128");
  const [volumeValue, setVolumeValue] = useState("50");
  const [showBrightnessDialog, setShowBrightnessDialog] = useState(false);
  const [showVolumeDialog, setShowVolumeDialog] = useState(false);

  const executeCommand = async (commandId: string, command: string[], description: string) => {
    if (!device.connected) {
      addNotification({
        type: "error",
        title: "设备未连接",
        message: "请确保设备已连接并启用USB调试",
      });
      return;
    }

    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, command);
      if (result.success) {
        addNotification({
          type: "success",
          title: "命令执行成功",
          message: description,
        });
      } else {
        addNotification({
          type: "error",
          title: "命令执行失败",
          message: result.error || "未知错误",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "执行失败",
        message: `${description}失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  const handleBrightnessChange = () => {
    const brightness = parseInt(brightnessValue);
    if (brightness >= 0 && brightness <= 255) {
      executeCommand(
        "brightness",
        ["shell", "settings", "put", "system", "screen_brightness", brightnessValue],
        `设置屏幕亮度为 ${brightness}`
      );
      setShowBrightnessDialog(false);
    } else {
      addNotification({
        type: "error",
        title: "参数错误",
        message: "亮度值必须在0-255之间",
      });
    }
  };

  const handleVolumeChange = () => {
    const volume = parseInt(volumeValue);
    if (volume >= 0 && volume <= 100) {
      executeCommand(
        "volume",
        ["shell", "media", "volume", "--set", volume.toString()],
        `设置音量为 ${volume}%`
      );
      setShowVolumeDialog(false);
    } else {
      addNotification({
        type: "error",
        title: "参数错误",
        message: "音量值必须在0-100之间",
      });
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
  ];

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Settings24Regular />}
        header={<Text weight="semibold">系统控制</Text>}
        description={<Text size={200}>常用系统控制命令</Text>}
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
          
          {/* 亮度控制按钮 */}
          <Dialog open={showBrightnessDialog} onOpenChange={(_, data) => setShowBrightnessDialog(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button
                appearance="outline"
                className={styles.commandButton}
                disabled={!isDeviceAvailable}
              >
                <BrightnessHigh24Regular className={styles.commandIcon} />
                <Text className={styles.commandLabel}>屏幕亮度</Text>
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogTitle>设置屏幕亮度</DialogTitle>
              <DialogContent>
                <DialogBody>
                  <Field label="亮度值 (0-255)" className={styles.inputField}>
                    <Input
                      value={brightnessValue}
                      onChange={(_, data) => setBrightnessValue(data.value)}
                      placeholder="输入亮度值"
                    />
                  </Field>
                </DialogBody>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setShowBrightnessDialog(false)}>
                    取消
                  </Button>
                  <Button appearance="primary" onClick={handleBrightnessChange}>
                    设置
                  </Button>
                </DialogActions>
              </DialogContent>
            </DialogSurface>
          </Dialog>

          {/* 音量控制按钮 */}
          <Dialog open={showVolumeDialog} onOpenChange={(_, data) => setShowVolumeDialog(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button
                appearance="outline"
                className={styles.commandButton}
                disabled={!isDeviceAvailable}
              >
                <Speaker224Regular className={styles.commandIcon} />
                <Text className={styles.commandLabel}>音量控制</Text>
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogTitle>设置音量</DialogTitle>
              <DialogContent>
                <DialogBody>
                  <Field label="音量值 (0-100)" className={styles.inputField}>
                    <Input
                      value={volumeValue}
                      onChange={(_, data) => setVolumeValue(data.value)}
                      placeholder="输入音量值"
                    />
                  </Field>
                </DialogBody>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setShowVolumeDialog(false)}>
                    取消
                  </Button>
                  <Button appearance="primary" onClick={handleVolumeChange}>
                    设置
                  </Button>
                </DialogActions>
              </DialogContent>
            </DialogSurface>
          </Dialog>
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

export default SystemControlCard;
