import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,

  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner,
} from "@fluentui/react-components";
import {
  Power24Regular,
  Warning24Regular,
  Screenshot24Regular,
  Home24Regular,
  ArrowLeft24Regular,
  Apps24Regular,
  Speaker224Regular,
  Settings24Regular,
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
  actionSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "8px",
  },
  actionButton: {
    height: "60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  quickActionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
    gap: "6px",
  },
  quickActionButton: {
    height: "50px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
  },
  warningIcon: {
    color: "var(--colorPaletteRedForeground1)",
  },
});

interface DeviceActionsCardProps {
  device: DeviceInfo;
}

const DeviceActionsCard: React.FC<DeviceActionsCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false);
  const [selectedRebootMode, setSelectedRebootMode] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingAction, setExecutingAction] = useState<string>("");

  const rebootModes = [
    {
      id: "system",
      label: "系统",
      description: "正常重启设备",
      icon: "🔄",
      primary: true
    },
    {
      id: "recovery",
      label: "Recovery",
      description: "进入Recovery模式",
      icon: "🛠️",
      primary: false
    },
    {
      id: "bootloader",
      label: "Fastboot",
      description: "进入Fastboot模式",
      icon: "⚡",
      primary: false
    },
    {
      id: "sideload",
      label: "Sideload",
      description: "进入ADB Sideload模式",
      icon: "📦",
      primary: false
    },
  ];

  const quickActions = [
    { id: "screenshot", label: "截屏", icon: <Screenshot24Regular />, command: "shell", args: ["screencap", "-p", "/sdcard/screenshot.png"] },
    { id: "home", label: "Home", icon: <Home24Regular />, command: "shell", args: ["input", "keyevent", "KEYCODE_HOME"] },
    { id: "back", label: "返回", icon: <ArrowLeft24Regular />, command: "shell", args: ["input", "keyevent", "KEYCODE_BACK"] },
    { id: "menu", label: "菜单", icon: <Apps24Regular />, command: "shell", args: ["input", "keyevent", "KEYCODE_MENU"] },
    { id: "volume_up", label: "音量+", icon: <Speaker224Regular />, command: "shell", args: ["input", "keyevent", "KEYCODE_VOLUME_UP"] },
    { id: "settings", label: "设置", icon: <Settings24Regular />, command: "shell", args: ["am", "start", "-a", "android.settings.SETTINGS"] },
  ];

  const handleRebootClick = (mode: string) => {
    const modeInfo = rebootModes.find(m => m.id === mode);
    if (modeInfo) {
      setSelectedRebootMode(mode);
      setRebootDialogOpen(true);
    }
  };

  const confirmReboot = async () => {
    if (!selectedRebootMode) return;

    setIsRebooting(true);
    setRebootDialogOpen(false);

    try {
      const result = await deviceService.rebootDevice(device.serial, selectedRebootMode);
      
      if (result.success) {
        const modeInfo = rebootModes.find(m => m.id === selectedRebootMode);
        addNotification({
          type: "success",
          title: "设备重启",
          message: `设备正在${modeInfo?.label}...`,
        });
      } else {
        addNotification({
          type: "error",
          title: "重启失败",
          message: result.error || "设备重启失败",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "重启失败",
        message: `重启失败: ${error}`,
      });
    } finally {
      setIsRebooting(false);
      setSelectedRebootMode("");
    }
  };

  const executeQuickAction = async (action: { id: string; label: string; icon: React.ReactElement; command: string; args: string[] }) => {
    setIsExecuting(true);
    setExecutingAction(action.id);

    try {
      const result = await deviceService.executeAdbCommand(
        device.serial,
        action.command,
        action.args,
        10
      );

      if (result.success) {
        addNotification({
          type: "success",
          title: "操作成功",
          message: `${action.label} 执行成功`,
        });
      } else {
        addNotification({
          type: "error",
          title: "操作失败",
          message: result.error || `${action.label} 执行失败`,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "操作失败",
        message: `${action.label} 执行失败: ${error}`,
      });
    } finally {
      setIsExecuting(false);
      setExecutingAction("");
    }
  };

  const isDeviceAvailable = device.connected && device.mode !== "unauthorized";

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<Power24Regular />}
          header={<Text weight="semibold">设备操作</Text>}
          description={<Text size={200}>设备控制和管理操作</Text>}
        />
        
        <div className={styles.content}>
          {/* 重启控制 */}
          <div className={styles.actionSection}>
            <Text className={styles.sectionTitle}>设备重启</Text>
            <div className={styles.actionGrid}>
              {rebootModes.map((mode) => (
                <Button
                  key={mode.id}
                  appearance={mode.primary ? "primary" : "secondary"}
                  className={styles.actionButton}
                  onClick={() => handleRebootClick(mode.id)}
                  disabled={!isDeviceAvailable || isRebooting}
                >
                  {isRebooting && selectedRebootMode === mode.id ? (
                    <Spinner size="small" />
                  ) : (
                    <span style={{ fontSize: "16px" }}>{mode.icon}</span>
                  )}
                  <Text size={200} weight="semibold">{mode.label}</Text>
                </Button>
              ))}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className={styles.actionSection}>
            <Text className={styles.sectionTitle}>快捷操作</Text>
            <div className={styles.quickActionGrid}>
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  appearance="outline"
                  className={styles.quickActionButton}
                  onClick={() => executeQuickAction(action)}
                  disabled={!isDeviceAvailable || isExecuting}
                  size="small"
                >
                  {isExecuting && executingAction === action.id ? (
                    <Spinner size="extra-small" />
                  ) : (
                    action.icon
                  )}
                  <Text size={100}>{action.label}</Text>
                </Button>
              ))}
            </div>
          </div>

          {/* 状态提示 */}
          {!isDeviceAvailable && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", backgroundColor: "var(--colorPaletteYellowBackground1)", borderRadius: "4px" }}>
              <Warning24Regular className={styles.warningIcon} />
              <Text size={200}>
                {!device.connected
                  ? "设备未连接"
                  : device.mode === "unauthorized"
                    ? "设备未授权，请在设备上允许USB调试"
                    : "设备不可用"
                }
              </Text>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={rebootDialogOpen} onOpenChange={(_, data) => setRebootDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认设备重启</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Warning24Regular className={styles.warningIcon} />
                <Text weight="semibold">警告：此操作将重启您的设备</Text>
              </div>
              <Text>
                您确定要将设备 <strong>{device.serial}</strong> 重启到{" "}
                <strong>{rebootModes.find(m => m.id === selectedRebootMode)?.label}</strong> 吗？
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {rebootModes.find(m => m.id === selectedRebootMode)?.description}
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button appearance="primary" onClick={confirmReboot}>
              确认重启
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default DeviceActionsCard;
