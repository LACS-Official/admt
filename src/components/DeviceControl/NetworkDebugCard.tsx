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
  Wifi124Regular,
  Globe24Regular,
  Router24Regular,
  DataUsage24Regular,
  Shield24Regular,
  PlugConnected24Regular,
  WifiWarning24Regular,
  CloudArrowUp24Regular,
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

interface NetworkDebugCardProps {
  device: DeviceInfo;
}

const NetworkDebugCard: React.FC<NetworkDebugCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [localPort, setLocalPort] = useState("8080");
  const [remotePort, setRemotePort] = useState("8080");
  const [showPortDialog, setShowPortDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

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

  const handlePortForward = () => {
    const local = parseInt(localPort);
    const remote = parseInt(remotePort);
    
    if (isNaN(local) || isNaN(remote) || local < 1 || local > 65535 || remote < 1 || remote > 65535) {
      addNotification({
        type: "error",
        title: "参数错误",
        message: "端口号必须在1-65535之间",
      });
      return;
    }

    let command: string[] = [];
    let description = "";

    if (currentAction === "forward") {
      command = ["forward", `tcp:${local}`, `tcp:${remote}`];
      description = `端口转发 ${local} -> ${remote}`;
    } else if (currentAction === "reverse") {
      command = ["reverse", `tcp:${remote}`, `tcp:${local}`];
      description = `反向端口转发 ${remote} -> ${local}`;
    }

    executeCommand(currentAction, command, description);
    setShowPortDialog(false);
  };

  const openPortDialog = (action: string) => {
    setCurrentAction(action);
    setShowPortDialog(true);
  };

  const networkCommands = [
    {
      id: "wifi_info",
      label: "WiFi信息",
      icon: <Wifi124Regular />,
      command: ["shell", "dumpsys", "wifi"],
      description: "获取WiFi连接信息",
    },
    {
      id: "network_info",
      label: "网络状态",
      icon: <Globe24Regular />,
      command: ["shell", "dumpsys", "connectivity"],
      description: "查看网络连接状态",
    },
    {
      id: "ip_config",
      label: "IP配置",
      icon: <Router24Regular />,
      command: ["shell", "ip", "addr", "show"],
      description: "显示网络接口配置",
    },
    {
      id: "ping_test",
      label: "网络测试",
      icon: <WifiWarning24Regular />,
      command: ["shell", "ping", "-c", "4", "8.8.8.8"],
      description: "测试网络连通性",
    },
    {
      id: "netstat",
      label: "网络连接",
      icon: <DataUsage24Regular />,
      command: ["shell", "netstat", "-an"],
      description: "显示网络连接状态",
    },
    {
      id: "list_forwards",
      label: "端口转发列表",
      icon: <PlugConnected24Regular />,
      command: ["forward", "--list"],
      description: "列出当前端口转发",
    },
    {
      id: "remove_forwards",
      label: "清除端口转发",
      icon: <Shield24Regular />,
      command: ["forward", "--remove-all"],
      description: "移除所有端口转发",
    },
    {
      id: "tcpip_mode",
      label: "TCP/IP模式",
      icon: <CloudArrowUp24Regular />,
      command: ["tcpip", "5555"],
      description: "切换到TCP/IP连接模式",
    },
  ];

  const portCommands = [
    { id: "forward", label: "端口转发", icon: <PlugConnected24Regular /> },
    { id: "reverse", label: "反向转发", icon: <Router24Regular /> },
  ];

  const isDeviceAvailable = device.connected;

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Wifi124Regular />}
        header={<Text weight="semibold">网络调试</Text>}
        description={<Text size={200}>网络连接和调试命令</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.commandGrid}>
          {/* 网络信息命令 */}
          {networkCommands.map((cmd) => (
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

          {/* 端口转发命令 */}
          {portCommands.map((cmd) => (
            <Button
              key={cmd.id}
              appearance="outline"
              className={styles.commandButton}
              disabled={!isDeviceAvailable}
              onClick={() => openPortDialog(cmd.id)}
            >
              <div className={styles.commandIcon}>{cmd.icon}</div>
              <Text className={styles.commandLabel}>{cmd.label}</Text>
            </Button>
          ))}
        </div>

        {/* 端口转发对话框 */}
        <Dialog open={showPortDialog} onOpenChange={(_, data) => setShowPortDialog(data.open)}>
          <DialogSurface>
            <DialogTitle>
              {currentAction === "forward" && "设置端口转发"}
              {currentAction === "reverse" && "设置反向端口转发"}
            </DialogTitle>
            <DialogContent>
              <DialogBody>
                <Field label="本地端口" className={styles.inputField}>
                  <Input
                    value={localPort}
                    onChange={(_, data) => setLocalPort(data.value)}
                    placeholder="例如: 8080"
                  />
                </Field>
                
                <Field label="设备端口" className={styles.inputField}>
                  <Input
                    value={remotePort}
                    onChange={(_, data) => setRemotePort(data.value)}
                    placeholder="例如: 8080"
                  />
                </Field>
                
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  {currentAction === "forward" 
                    ? "将本地端口的流量转发到设备端口"
                    : "将设备端口的流量转发到本地端口"
                  }
                </Text>
              </DialogBody>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setShowPortDialog(false)}>
                  取消
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handlePortForward}
                  disabled={executingCommand === currentAction}
                >
                  {executingCommand === currentAction ? <Spinner size="small" /> : "设置"}
                </Button>
              </DialogActions>
            </DialogContent>
          </DialogSurface>
        </Dialog>

        {!isDeviceAvailable && (
          <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
            设备未连接
          </Text>
        )}
      </div>
    </Card>
  );
};

export default NetworkDebugCard;
