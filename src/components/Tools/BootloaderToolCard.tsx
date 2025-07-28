import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner,
  Field,
  Input,
} from "@fluentui/react-components";
import {
  Key24Regular,
  Shield24Regular,
  Warning24Regular,
  Flash24Regular,
  LockClosed24Regular,
  LockOpen24Regular,
  FolderOpen24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { open } from "@tauri-apps/plugin-dialog";

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
  statusSection: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },
  toolButton: {
    height: "50px",
    justifyContent: "flex-start",
    gap: "12px",
  },
  warningSection: {
    padding: "12px",
    backgroundColor: "var(--colorPaletteRedBackground1)",
    borderRadius: "6px",
    border: "1px solid var(--colorPaletteRedBorder1)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  warningIcon: {
    color: "var(--colorPaletteRedForeground1)",
  },
});

interface BootloaderToolCardProps {
  device: DeviceInfo;
}

const BootloaderToolCard: React.FC<BootloaderToolCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [recoveryImagePath, setRecoveryImagePath] = useState("");

  const bootloaderTools = [
    {
      id: "unlock",
      label: "解锁Bootloader",
      description: "解锁设备Bootloader（需要厂商支持）",
      icon: <LockOpen24Regular />,
      dangerous: true,
      available: device.mode === "fastboot" || device.mode === "fastbootd",
    },
    {
      id: "lock",
      label: "锁定Bootloader",
      description: "重新锁定设备Bootloader",
      icon: <LockClosed24Regular />,
      dangerous: true,
      available: device.mode === "fastboot" || device.mode === "fastbootd",
    },
    {
      id: "oem_info",
      label: "OEM信息",
      description: "获取设备OEM解锁信息",
      icon: <Shield24Regular />,
      dangerous: false,
      available: device.mode === "fastboot" || device.mode === "fastbootd",
    },
    {
      id: "flash_recovery",
      label: "刷入Recovery",
      description: "刷入自定义Recovery（需要Recovery镜像）",
      icon: <Flash24Regular />,
      dangerous: true,
      available: device.mode === "fastboot" || device.mode === "fastbootd",
    },
  ];

  const handleToolClick = (toolId: string) => {
    const tool = bootloaderTools.find(t => t.id === toolId);
    if (tool && tool.available) {
      if (toolId === "flash_recovery") {
        setRecoveryDialogOpen(true);
      } else if (tool.dangerous) {
        setSelectedAction(toolId);
        setConfirmDialogOpen(true);
      } else {
        executeAction(toolId);
      }
    }
  };

  const executeAction = async (actionId: string) => {
    setIsExecuting(true);
    setConfirmDialogOpen(false);

    try {
      let result;
      switch (actionId) {
        case "unlock":
          // 注意：实际的解锁命令因厂商而异
          result = await deviceService.executeAdbCommand(device.serial, "fastboot", ["oem", "unlock"], 30);
          break;
        case "lock":
          result = await deviceService.executeAdbCommand(device.serial, "fastboot", ["oem", "lock"], 30);
          break;
        case "oem_info":
          result = await deviceService.executeAdbCommand(device.serial, "fastboot", ["oem", "device-info"], 10);
          break;
        case "flash_recovery":
          if (!recoveryImagePath) {
            addNotification({
              type: "warning",
              title: "刷入Recovery",
              message: "请先选择Recovery镜像文件",
            });
            return;
          }
          result = await deviceService.executeAdbCommand(
            device.serial,
            "fastboot",
            ["flash", "recovery", recoveryImagePath],
            60
          );
          break;
        default:
          throw new Error("未知操作");
      }

      if (result.success) {
        addNotification({
          type: "success",
          title: "操作成功",
          message: `${bootloaderTools.find(t => t.id === actionId)?.label} 执行成功`,
        });
      } else {
        addNotification({
          type: "error",
          title: "操作失败",
          message: result.error || "操作执行失败",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "操作失败",
        message: `操作失败: ${error}`,
      });
    } finally {
      setIsExecuting(false);
      setSelectedAction("");
    }
  };

  const handleBrowseRecoveryImage = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Recovery Images',
          extensions: ['img']
        }]
      });

      if (selected && typeof selected === 'string') {
        setRecoveryImagePath(selected);
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "文件选择失败",
        message: `无法选择文件: ${error}`,
      });
    }
  };

  const handleFlashRecovery = () => {
    if (!recoveryImagePath) {
      addNotification({
        type: "warning",
        title: "刷入Recovery",
        message: "请先选择Recovery镜像文件",
      });
      return;
    }
    setRecoveryDialogOpen(false);
    executeAction("flash_recovery");
  };

  const isBootloaderMode = device.mode === "fastboot" || device.mode === "fastbootd";
  const bootloaderStatus = device.properties?.bootloaderLocked;

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<Key24Regular />}
          header={<Text weight="semibold">Bootloader工具</Text>}
          description={<Text size={200}>Bootloader解锁和刷机工具</Text>}
        />
        
        <div className={styles.content}>
          {/* Bootloader状态 */}
          <div className={styles.statusSection}>
            <Shield24Regular />
            <div style={{ flex: 1 }}>
              <Text size={300} weight="semibold">Bootloader状态</Text>
              <br />
              <Badge 
                appearance="filled"
                color={bootloaderStatus ? "danger" : "success"}
              >
                {bootloaderStatus === undefined 
                  ? "未知" 
                  : bootloaderStatus 
                    ? "🔒 已锁定" 
                    : "🔓 已解锁"
                }
              </Badge>
            </div>
          </div>

          {/* 模式警告 */}
          {!isBootloaderMode && (
            <div className={styles.warningSection}>
              <Warning24Regular className={styles.warningIcon} />
              <Text size={200}>
                设备需要处于Fastboot模式才能使用Bootloader工具
              </Text>
            </div>
          )}

          {/* 工具列表 */}
          <div className={styles.toolsGrid}>
            {bootloaderTools.map((tool) => (
              <Button
                key={tool.id}
                appearance={tool.dangerous ? "primary" : "secondary"}
                className={styles.toolButton}
                onClick={() => handleToolClick(tool.id)}
                disabled={!tool.available || isExecuting}
              >
                {isExecuting && selectedAction === tool.id ? (
                  <Spinner size="small" />
                ) : (
                  tool.icon
                )}
                <div style={{ textAlign: "left" }}>
                  <Text weight="semibold">{tool.label}</Text>
                  <br />
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                    {tool.description}
                  </Text>
                </div>
              </Button>
            ))}
          </div>

          {/* 危险操作警告 */}
          <div className={styles.warningSection}>
            <Warning24Regular className={styles.warningIcon} />
            <Text size={200}>
              ⚠️ Bootloader操作具有风险，可能导致设备变砖，请谨慎操作
            </Text>
          </div>
        </div>
      </Card>

      <Dialog open={confirmDialogOpen} onOpenChange={(_, data) => setConfirmDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认危险操作</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Warning24Regular className={styles.warningIcon} />
                <Text weight="semibold">警告：此操作具有风险</Text>
              </div>
              <Text>
                您确定要执行 <strong>{bootloaderTools.find(t => t.id === selectedAction)?.label}</strong> 操作吗？
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {bootloaderTools.find(t => t.id === selectedAction)?.description}
              </Text>
              <br />
              <Text size={200} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                ⚠️ 此操作可能导致设备无法正常启动，请确保您了解相关风险
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={() => executeAction(selectedAction)}
            >
              我了解风险，继续执行
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Recovery刷入对话框 */}
      <Dialog open={recoveryDialogOpen} onOpenChange={(_, data) => setRecoveryDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>刷入Recovery镜像</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Flash24Regular />
                <Text weight="semibold">选择Recovery镜像文件</Text>
              </div>
              <Field label="Recovery镜像路径:">
                <div style={{ display: "flex", gap: "8px" }}>
                  <Input
                    value={recoveryImagePath}
                    onChange={(_, data) => setRecoveryImagePath(data.value)}
                    placeholder="选择.img格式的Recovery镜像文件"
                    style={{ flex: 1 }}
                  />
                  <Button
                    appearance="secondary"
                    icon={<FolderOpen24Regular />}
                    onClick={handleBrowseRecoveryImage}
                  >
                    浏览
                  </Button>
                </div>
              </Field>
              <Text size={200} style={{ color: "var(--colorPaletteRedForeground1)", marginTop: "12px" }}>
                ⚠️ 刷入错误的Recovery镜像可能导致设备无法启动，请确保镜像文件适用于您的设备型号
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleFlashRecovery}
              disabled={!recoveryImagePath}
            >
              开始刷入
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default BootloaderToolCard;
