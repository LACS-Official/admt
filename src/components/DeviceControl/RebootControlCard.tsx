import React, { useState }  from 'react';
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
  rebootGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  rebootButton: {
    height: "60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  buttonIcon: {
    fontSize: "20px",
  },
  warningSection: {
    padding: "12px",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    borderRadius: "6px",
    border: "1px solid var(--colorPaletteYellowBorder1)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  warningIcon: {
    color: "var(--colorPaletteYellowForeground1)",
  },
});

interface RebootControlCardProps {
  device: DeviceInfo;
}

const RebootControlCard: React.FC<RebootControlCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false);
  const [selectedRebootMode, setSelectedRebootMode] = useState<string>("");

  const rebootModes = [
    { 
      id: "system", 
      label: "系统", 
      description: "正常重启到Android系统",
      icon: "🔄",
      available: true
    },
    { 
      id: "recovery", 
      label: "Recovery", 
      description: "重启到Recovery模式",
      icon: "🛠️",
      available: device.mode === "sys"
    },
    { 
      id: "bootloader", 
      label: "Fastboot", 
      description: "重启到Fastboot模式",
      icon: "⚡",
      available: device.mode === "sys"
    },
    { 
      id: "sideload", 
      label: "Sideload", 
      description: "重启到ADB Sideload模式",
      icon: "📦",
      available: device.mode === "sys"
    },
  ];

  const handleRebootClick = (mode: string) => {
    const modeInfo = rebootModes.find(m => m.id === mode);
    if (modeInfo && modeInfo.available) {
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
          message: `设备正在重启到${modeInfo?.label}模式...`,
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

  const isDeviceAvailable = device.connected && device.mode !== "unauthorized";

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<Power24Regular />}
          header={<Text weight="semibold">重启控制</Text>}
          description={<Text size={200}>设备重启和模式切换</Text>}
        />
        
        <div className={styles.content}>
          {!isDeviceAvailable && (
            <div className={styles.warningSection}>
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

          <div className={styles.rebootGrid}>
            {rebootModes.map((mode) => (
              <Button
                key={mode.id}
                appearance={mode.id === "system" ? "primary" : "secondary"}
                className={styles.rebootButton}
                onClick={() => handleRebootClick(mode.id)}
                disabled={!isDeviceAvailable || !mode.available || isRebooting}
              >
                {isRebooting && selectedRebootMode === mode.id ? (
                  <Spinner size="small" />
                ) : (
                  <span className={styles.buttonIcon}>{mode.icon}</span>
                )}
                <Text size={300} weight="semibold">{mode.label}</Text>
              </Button>
            ))}
          </div>

          {device.mode !== "sys" && (
            <div className={styles.warningSection}>
              <Warning24Regular className={styles.warningIcon} />
              <Text size={200}>
                当前设备处于 {device.mode} 模式，部分重启选项不可用
              </Text>
            </div>
          )}

          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            💡 提示：重启操作会断开设备连接，请等待设备重新启动后重新连接
          </Text>
        </div>
      </Card>

      <Dialog open={rebootDialogOpen} onOpenChange={(_, data) => setRebootDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认设备重启</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                <Text weight="semibold">警告：此操作将重启您的设备</Text>
              </div>
              <Text>
                您确定要将设备 <strong>{device.serial}</strong> 重启到{" "}
                <strong>{rebootModes.find(m => m.id === selectedRebootMode)?.label}</strong> 模式吗？
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {rebootModes.find(m => m.id === selectedRebootMode)?.description}
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorPaletteYellowForeground1)" }}>
                ⚠️ 重启后设备将暂时断开连接，请等待设备完全启动后重新连接
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

export default RebootControlCard;
