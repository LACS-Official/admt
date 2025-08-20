import React, { useState }  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  Field,
  Input,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Bug24Regular,
  DocumentBulletList24Regular,
  DeveloperBoard24Regular,
  NetworkCheck24Regular,
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
    gap: "12px",
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
  inputDialog: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

interface DeveloperToolCardProps {
  device: DeviceInfo;
}

const DeveloperToolCard: React.FC<DeveloperToolCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<string>("");
  const [inputValue, setInputValue] = useState("");

  const developerTools = [
    {
      id: "enable_debug",
      label: "启用调试模式",
      description: "启用开发者选项和USB调试",
      icon: <Bug24Regular />,
      command: "shell",
      args: ["settings", "put", "global", "development_settings_enabled", "1"],
      available: device.mode === "sys",
      needsInput: false,
    },
    {
      id: "network_test",
      label: "网络连接测试",
      description: "测试设备网络连接状态",
      icon: <NetworkCheck24Regular />,
      command: "shell",
      args: ["ping", "-c", "4", "8.8.8.8"],
      available: device.mode === "sys",
      needsInput: false,
    },
    {
      id: "monkey_test",
      label: "Monkey压力测试",
      description: "运行应用压力测试",
      icon: <DocumentBulletList24Regular />,
      command: "shell",
      args: ["monkey", "-p", "", "-v", "100"],
      available: device.mode === "sys",
      needsInput: true,
      inputLabel: "应用包名:",
      inputPlaceholder: "com.example.app",
    },
    {
      id: "logcat_filter",
      label: "过滤日志",
      description: "按标签过滤系统日志",
      icon: <Code24Regular />,
      command: "logcat",
      args: ["-s", ""],
      available: device.mode === "sys",
      needsInput: true,
      inputLabel: "日志标签:",
      inputPlaceholder: "ActivityManager",
    },
    {
      id: "cpu_info",
      label: "CPU信息",
      description: "获取详细CPU信息",
      icon: <DeveloperBoard24Regular />,
      command: "shell",
      args: ["cat", "/proc/cpuinfo"],
      available: device.mode === "sys",
      needsInput: false,
    },
    {
      id: "memory_info",
      label: "内存信息",
      description: "获取详细内存使用信息",
      icon: <DeveloperBoard24Regular />,
      command: "shell",
      args: ["cat", "/proc/meminfo"],
      available: device.mode === "sys",
      needsInput: false,
    },
  ];

  const handleToolClick = (toolId: string) => {
    const tool = developerTools.find(t => t.id === toolId);
    if (!tool || !tool.available) return;

    if (tool.needsInput) {
      setCurrentTool(toolId);
      setInputValue("");
      setDialogOpen(true);
    } else {
      executeTool(toolId);
    }
  };

  const executeTool = async (toolId: string, inputParam?: string) => {
    const tool = developerTools.find(t => t.id === toolId);
    if (!tool || !tool.available) return;

    setExecutingTool(toolId);
    setDialogOpen(false);

    try {
      const args = [...tool.args];
      
      // 处理需要输入参数的工具
      if (tool.needsInput && inputParam) {
        switch (toolId) {
          case "monkey_test":
            args[1] = inputParam; // 替换包名
            break;
          case "logcat_filter":
            args[1] = inputParam; // 替换标签
            break;
        }
      }

      const result = await deviceService.executeAdbCommand(
        device.serial, 
        tool.command, 
        args, 
        30
      );
      
      if (result.success) {
        addNotification({
          type: "success",
          title: "工具执行成功",
          message: `${tool.label} 执行完成`,
        });

        // 对于信息查询类工具，可以显示部分输出
        if (toolId === "cpu_info" || toolId === "memory_info" || toolId === "network_test") {
          // console.log(`${tool.label} 输出:`, result.output.substring(0, 500));
        }
      } else {
        addNotification({
          type: "error",
          title: "工具执行失败",
          message: result.error || `${tool.label} 执行失败`,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "工具执行失败",
        message: `${tool.label} 执行失败: ${error}`,
      });
    } finally {
      setExecutingTool(null);
      setInputValue("");
      setCurrentTool("");
    }
  };

  const handleConfirmInput = () => {
    if (inputValue.trim()) {
      executeTool(currentTool, inputValue.trim());
    }
  };

  const isDeviceAvailable = device.connected && device.mode === "sys";
  const currentToolInfo = developerTools.find(t => t.id === currentTool);

  return (
    <>
      <Card className={styles.card}>
        <CardHeader
          image={<Code24Regular />}
          header={<Text weight="semibold">开发者工具</Text>}
          description={<Text size={200}>开发调试和测试工具</Text>}
        />
        
        <div className={styles.content}>
          {!isDeviceAvailable && (
            <Text size={200} style={{ color: "var(--colorPaletteYellowForeground1)" }}>
              ⚠️ 设备需要处于系统模式才能使用开发者工具
            </Text>
          )}

          <div className={styles.toolsGrid}>
            {developerTools.map((tool) => (
              <Button
                key={tool.id}
                appearance="secondary"
                className={styles.toolButton}
                onClick={() => handleToolClick(tool.id)}
                disabled={!tool.available || executingTool === tool.id}
              >
                {executingTool === tool.id ? (
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

          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            🔧 开发者工具适用于应用调试和系统分析
          </Text>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>{currentToolInfo?.label}</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div className={styles.inputDialog}>
                <Text>{currentToolInfo?.description}</Text>
                <Field label={currentToolInfo?.inputLabel}>
                  <Input
                    value={inputValue}
                    onChange={(_, data) => setInputValue(data.value)}
                    placeholder={currentToolInfo?.inputPlaceholder}
                  />
                </Field>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button 
              appearance="primary" 
              onClick={handleConfirmInput}
              disabled={!inputValue.trim()}
            >
              执行
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default DeveloperToolCard;
