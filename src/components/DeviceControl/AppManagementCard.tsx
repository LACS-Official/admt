import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Field,
  Input,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  Play24Regular,
  Stop24Regular,
  Delete24Regular,
  Archive24Regular,
  Info24Regular,
  DataUsage24Regular,
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

interface AppManagementCardProps {
  device: DeviceInfo;
}

/**
 * A component to manage the apps on the device, including installing, uninstalling, 
 * starting, stopping and clearing the data of an app.
 * 
 * @param {DeviceInfo} device - The device to manage apps on.
 */
const AppManagementCard: React.FC<AppManagementCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [packageName, setPackageName] = useState("");
  const [showPackageDialog, setShowPackageDialog] = useState(false);
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
      const result = await deviceService.executeAdbCommand(
        device.serial,
        command[0],
        command.slice(1)
      );
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

  const handlePackageAction = () => {
    if (!packageName.trim()) {
      addNotification({
        type: "error",
        title: "参数错误",
        message: "请输入应用包名",
      });
      return;
    }

    let command: string[] = [];
    let description = "";

    switch (currentAction) {
      case "start":
        command = ["shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"];
        description = `启动应用 ${packageName}`;
        break;
      case "stop":
        command = ["shell", "am", "force-stop", packageName];
        description = `停止应用 ${packageName}`;
        break;
      case "clear":
        command = ["shell", "pm", "clear", packageName];
        description = `清除应用数据 ${packageName}`;
        break;
      case "info":
        command = ["shell", "dumpsys", "package", packageName];
        description = `获取应用信息 ${packageName}`;
        break;
      case "uninstall":
        command = ["uninstall", packageName];
        description = `卸载应用 ${packageName}`;
        break;
      default:
        return;
    }

    executeCommand(currentAction, command, description);
    setShowPackageDialog(false);
    setPackageName("");
  };

  const openPackageDialog = (action: string) => {
    setCurrentAction(action);
    setShowPackageDialog(true);
  };

  const appCommands = [
    {
      id: "list_packages",
      label: "应用列表",
      icon: <Apps24Regular />,
      command: ["shell", "pm", "list", "packages"],
      description: "获取已安装应用列表",
    },
    {
      id: "list_running",
      label: "运行中应用",
      icon: <DataUsage24Regular />,
      command: ["shell", "ps"],
      description: "查看运行中的进程",
    },
    {
      id: "clear_cache",
      label: "清理缓存",
      icon: <Archive24Regular />,
      command: ["shell", "pm", "trim-caches", "1000000000"],
      description: "清理系统缓存",
    },
  ];

  const packageCommands = [
    { id: "start", label: "启动应用", icon: <Play24Regular /> },
    { id: "stop", label: "停止应用", icon: <Stop24Regular /> },
    { id: "clear", label: "清除数据", icon: <Delete24Regular /> },
    { id: "info", label: "应用信息", icon: <Info24Regular /> },
    { id: "uninstall", label: "卸载应用", icon: <Delete24Regular /> },
  ];

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Apps24Regular />}
        header={<Text weight="semibold">应用管理</Text>}
        description={<Text size={200}>应用安装、卸载和管理命令</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.commandGrid}>
          {/* 通用应用命令 */}
          {appCommands.map((cmd) => (
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

          {/* 需要包名的命令 */}
          {packageCommands.map((cmd) => (
            <Button
              key={cmd.id}
              appearance="outline"
              className={styles.commandButton}
              disabled={!isDeviceAvailable}
              onClick={() => openPackageDialog(cmd.id)}
            >
              <div className={styles.commandIcon}>{cmd.icon}</div>
              <Text className={styles.commandLabel}>{cmd.label}</Text>
            </Button>
          ))}
        </div>

        {/* 包名输入对话框 */}
        <Dialog open={showPackageDialog} onOpenChange={(_, data) => setShowPackageDialog(data.open)}>
          <DialogSurface>
            <DialogTitle>
              {currentAction === "start" && "启动应用"}
              {currentAction === "stop" && "停止应用"}
              {currentAction === "clear" && "清除应用数据"}
              {currentAction === "info" && "获取应用信息"}
              {currentAction === "uninstall" && "卸载应用"}
            </DialogTitle>
            <DialogContent>
              <DialogBody>
                <Field label="应用包名" className={styles.inputField}>
                  <Input
                    value={packageName}
                    onChange={(_, data) => setPackageName(data.value)}
                    placeholder="例如: com.android.settings"
                  />
                </Field>
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  提示：可以先使用"应用列表"命令查看已安装的应用包名
                </Text>
              </DialogBody>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setShowPackageDialog(false)}>
                  取消
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handlePackageAction}
                  disabled={executingCommand === currentAction}
                >
                  {executingCommand === currentAction ? <Spinner size="small" /> : "执行"}
                </Button>
              </DialogActions>
            </DialogContent>
          </DialogSurface>
        </Dialog>

        {!isDeviceAvailable && (
          <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
            设备未连接或不在系统模式
          </Text>
        )}
      </div>
    </Card>
  );
};

export default AppManagementCard;
