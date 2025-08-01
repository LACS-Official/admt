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
} from "@fluentui/react-components";
import {
  LockOpen24Regular,
  Shield24Regular,
  Warning24Regular,
  Search24Regular,
  Settings24Regular,
  Flash24Regular,
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
    overflow: "auto",
  },
  statusSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  warningSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "var(--colorPaletteYellowBackground1)",
    borderRadius: "8px",
    border: "1px solid var(--colorPaletteYellowBorder1)",
  },
  warningIcon: {
    color: "var(--colorPaletteYellowForeground1)",
    fontSize: "16px",
  },
  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  toolButton: {
    height: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
    textAlign: "left",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    transition: "all 0.2s ease",
  },
  xiaomiIcon: {
    fontSize: "24px",
    color: "var(--colorBrandForeground1)",
  },
});

interface XiaomiUnlockCardProps {
  device: DeviceInfo;
}

const XiaomiUnlockCard: React.FC<XiaomiUnlockCardProps> = ({ device }) => {
  const styles = useStyles();
  const deviceService = useDeviceService();
  const { addNotification } = useAppStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const xiaomiTools = [
    {
      id: "xiaomi_unlock_tool",
      label: "小米解锁工具",
      description: "启动小米官方解锁工具",
      icon: <LockOpen24Regular />,
      dangerous: false,
      available: true,
    },
    {
      id: "bypass_unlock",
      label: "Bypass解锁",
      description: "执行小米设备bypass解锁操作",
      icon: <Flash24Regular />,
      dangerous: true,
      available: device.properties?.brand?.toLowerCase().includes("xiaomi") || 
                device.properties?.manufacturer?.toLowerCase().includes("xiaomi"),
    },
    {
      id: "detect_unlock_method",
      label: "检测解锁方式",
      description: "检测当前小米设备支持的解锁方式",
      icon: <Search24Regular />,
      dangerous: false,
      available: device.properties?.brand?.toLowerCase().includes("xiaomi") || 
                device.properties?.manufacturer?.toLowerCase().includes("xiaomi"),
    },
    {
      id: "install_unlock_settings",
      label: "安装解锁专用设置",
      description: "安装解锁过程中需要的专用设置",
      icon: <Settings24Regular />,
      dangerous: false,
      available: device.mode === "sys",
    },
  ];

  const handleToolClick = (toolId: string) => {
    const tool = xiaomiTools.find(t => t.id === toolId);
    if (tool && tool.available) {
      if (tool.dangerous) {
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
        case "xiaomi_unlock_tool":
          // 启动小米官方解锁工具
          addNotification({
            type: "info",
            title: "小米解锁工具",
            message: "正在启动小米官方解锁工具...",
          });
          // TODO: 实现启动小米解锁工具的逻辑
          break;
        
        case "bypass_unlock":
          // 执行bypass解锁
          addNotification({
            type: "warning",
            title: "Bypass解锁",
            message: "正在执行bypass解锁操作，请耐心等待...",
          });
          // TODO: 实现bypass解锁逻辑
          break;
        
        case "detect_unlock_method":
          // 检测解锁方式
          result = await deviceService.executeAdbCommand(
            device.serial, 
            "shell", 
            ["getprop", "ro.secureboot.lockstate"], 
            10
          );
          if (result.success) {
            addNotification({
              type: "success",
              title: "解锁方式检测",
              message: `设备解锁状态: ${result.output.trim()}`,
            });
          }
          break;
        
        case "install_unlock_settings":
          // 安装解锁专用设置
          addNotification({
            type: "info",
            title: "安装解锁专用设置",
            message: "正在安装解锁专用设置应用...",
          });
          // TODO: 实现安装解锁设置的逻辑
          break;
        
        default:
          throw new Error("未知操作");
      }

      if (result && !result.success) {
        throw new Error(result.error || "操作失败");
      }

      addNotification({
        type: "success",
        title: "操作完成",
        message: `${xiaomiTools.find(t => t.id === actionId)?.label} 执行成功`,
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "操作失败",
        message: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsExecuting(false);
      setSelectedAction("");
    }
  };

  const isXiaomiDevice = device.properties?.brand?.toLowerCase().includes("xiaomi") || 
                        device.properties?.manufacturer?.toLowerCase().includes("xiaomi");

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<div className={styles.xiaomiIcon}>📱</div>}
          header={<Text weight="semibold">小米解锁工具</Text>}
          description={<Text size={200}>专为小米设备设计的解锁工具集</Text>}
        />
        
        <div className={styles.content}>
          {/* 设备品牌状态 */}
          <div className={styles.statusSection}>
            <Shield24Regular />
            <div style={{ flex: 1 }}>
              <Text size={300} weight="semibold">设备品牌</Text>
              <br />
              <Badge 
                appearance="filled"
                color={isXiaomiDevice ? "success" : "warning"}
              >
                {isXiaomiDevice ? "✅ 小米设备" : "⚠️ 非小米设备"}
              </Badge>
            </div>
          </div>

          {/* 非小米设备警告 */}
          {!isXiaomiDevice && (
            <div className={styles.warningSection}>
              <Warning24Regular className={styles.warningIcon} />
              <Text size={200}>
                当前设备不是小米设备，部分功能可能不可用
              </Text>
            </div>
          )}

          {/* 工具列表 */}
          <div className={styles.toolsGrid}>
            {xiaomiTools.map((tool) => (
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
              ⚠️ 解锁操作具有风险，可能导致设备变砖或保修失效，请谨慎操作
            </Text>
          </div>
        </div>
      </Card>

      {/* 确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={(_, data) => setConfirmDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>确认危险操作</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                您即将执行 "{xiaomiTools.find(t => t.id === selectedAction)?.label}" 操作。
                此操作具有风险，可能导致设备变砖或数据丢失。
              </Text>
              <br />
              <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                请确认您已了解风险并备份了重要数据。
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button 
              appearance="secondary" 
              onClick={() => setConfirmDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              appearance="primary" 
              onClick={() => executeAction(selectedAction)}
            >
              确认执行
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default XiaomiUnlockCard;
