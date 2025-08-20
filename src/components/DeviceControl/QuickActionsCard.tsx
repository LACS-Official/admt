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
  Flash24Regular,
  Screenshot24Regular,
  Apps24Regular,
  Settings24Regular,
  Wifi124Regular,
  Speaker224Regular,
  Home24Regular,
  ArrowLeft24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  card: {
    display: "flex",
    flexDirection: "column",
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
  },
  actionButton: {
    height: "80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  buttonIcon: {
    fontSize: "24px",
  },
  sectionTitle: {
    marginTop: "8px",
    marginBottom: "4px",
  },
  systemActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "8px",
  },
  systemButton: {
    height: "60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
});

interface QuickActionsCardProps {
  device: DeviceInfo;
}

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  const executeCommand = async (actionId: string, command: string, args: string[] = []) => {
    setExecutingAction(actionId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, command, args, 10);
      
      if (result.success) {
        addNotification({
          type: "success",
          title: "操作成功",
          message: `${actionId} 执行成功`,
        });
      } else {
        addNotification({
          type: "error",
          title: "操作失败",
          message: result.error || `${actionId} 执行失败`,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "操作失败",
        message: `${actionId} 执行失败: ${error}`,
      });
    } finally {
      setExecutingAction(null);
    }
  };

  const quickActions = [
    {
      id: "screenshot",
      label: "截屏",
      icon: <Screenshot24Regular />,
      command: "shell",
      args: ["screencap", "-p", "/sdcard/screenshot.png"],
      description: "截取屏幕并保存到设备"
    },
    {
      id: "apps",
      label: "应用列表",
      icon: <Apps24Regular />,
      command: "shell",
      args: ["pm", "list", "packages"],
      description: "获取已安装应用列表"
    },
    {
      id: "settings",
      label: "打开设置",
      icon: <Settings24Regular />,
      command: "shell",
      args: ["am", "start", "-a", "android.settings.SETTINGS"],
      description: "打开系统设置应用"
    },
    {
      id: "wifi",
      label: "WiFi设置",
      icon: <Wifi124Regular />,
      command: "shell",
      args: ["am", "start", "-a", "android.settings.WIFI_SETTINGS"],
      description: "打开WiFi设置页面"
    },
  ];

  const systemActions = [
    {
      id: "home",
      label: "Home",
      icon: <Home24Regular />,
      command: "shell",
      args: ["input", "keyevent", "KEYCODE_HOME"],
    },
    {
      id: "back",
      label: "返回",
      icon: <ArrowLeft24Regular />,
      command: "shell",
      args: ["input", "keyevent", "KEYCODE_BACK"],
    },
    {
      id: "menu",
      label: "菜单",
      icon: <Apps24Regular />,
      command: "shell",
      args: ["input", "keyevent", "KEYCODE_MENU"],
    },
    {
      id: "volume_up",
      label: "音量+",
      icon: <Speaker224Regular />,
      command: "shell",
      args: ["input", "keyevent", "KEYCODE_VOLUME_UP"],
    },
    {
      id: "power",
      label: "电源",
      icon: <Flash24Regular />,
      command: "shell",
      args: ["input", "keyevent", "KEYCODE_POWER"],
    },
  ];

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Flash24Regular />}
        header={<Text weight="semibold">快捷操作</Text>}
        description={<Text size={200}>常用设备操作和系统命令</Text>}
      />
      
      <div className={styles.content}>
        {!isDeviceAvailable && (
          <Text size={200} style={{ color: "var(--colorPaletteYellowForeground1)" }}>
            ⚠️ 设备需要处于系统模式才能使用快捷操作
          </Text>
        )}

        <div>
          <Text className={styles.sectionTitle} weight="semibold">应用操作</Text>
          <div className={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Button
                key={action.id}
                appearance="secondary"
                className={styles.actionButton}
                onClick={() => executeCommand(action.label, action.command, action.args)}
                disabled={!isDeviceAvailable || executingAction === action.id}
                title={action.description}
              >
                {executingAction === action.id ? (
                  <Spinner size="small" />
                ) : (
                  <span className={styles.buttonIcon}>{action.icon}</span>
                )}
                <Text size={200} weight="semibold">{action.label}</Text>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Text className={styles.sectionTitle} weight="semibold">系统按键</Text>
          <div className={styles.systemActionsGrid}>
            {systemActions.map((action) => (
              <Button
                key={action.id}
                appearance="outline"
                className={styles.systemButton}
                onClick={() => executeCommand(action.label, action.command, action.args)}
                disabled={!isDeviceAvailable || executingAction === action.id}
              >
                {executingAction === action.id ? (
                  <Spinner size="extra-small" />
                ) : (
                  action.icon
                )}
                <Text size={100}>{action.label}</Text>
              </Button>
            ))}
          </div>
        </div>

        <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
          💡 提示：这些操作会直接在设备上执行，请确保设备屏幕已解锁
        </Text>
      </div>
    </Card>
  );
};

export default QuickActionsCard;
