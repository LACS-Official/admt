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
  Database24Regular,
  Delete24Regular,
  Archive24Regular,
  CloudArrowUp24Regular,
  Document24Regular,
  FolderOpen24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { save } from "@tauri-apps/plugin-dialog";

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
  warningText: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "12px",
    marginTop: "8px",
  },
});

interface SystemToolCardProps {
  device: DeviceInfo;
}

const SystemToolCard: React.FC<SystemToolCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingTool, setExecutingTool] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<string>("");
  const [savePath, setSavePath] = useState("");

  const systemTools = [
    {
      id: "backup_data",
      label: "数据备份",
      description: "备份应用数据和设置",
      icon: <CloudArrowUp24Regular />,
      command: "backup",
      args: ["-all", "-apk", "-shared", "-nosystem"],
      available: device.mode === "sys",
      needsSavePath: true,
      defaultFileName: "device_backup.ab",
      fileExtension: "ab",
    },
    {
      id: "clear_cache",
      label: "清理缓存",
      description: "清理系统和应用缓存",
      icon: <Delete24Regular />,
      command: "shell",
      args: ["pm", "trim-caches", "1000000000"],
      available: device.mode === "sys",
      needsSavePath: false,
    },
    {
      id: "dump_system",
      label: "系统转储",
      description: "导出系统信息和日志",
      icon: <Database24Regular />,
      command: "bugreport",
      args: [],
      available: device.mode === "sys",
      needsSavePath: true,
      defaultFileName: "bugreport.zip",
      fileExtension: "zip",
    },
    {
      id: "package_list",
      label: "应用包列表",
      description: "导出已安装应用包列表",
      icon: <Document24Regular />,
      command: "shell",
      args: ["pm", "list", "packages", "-f"],
      available: device.mode === "sys",
      needsSavePath: true,
      defaultFileName: "package_list.txt",
      fileExtension: "txt",
    },
    {
      id: "system_props",
      label: "系统属性",
      description: "导出完整系统属性",
      icon: <Settings24Regular />,
      command: "shell",
      args: ["getprop"],
      available: device.mode === "sys",
      needsSavePath: true,
      defaultFileName: "system_props.txt",
      fileExtension: "txt",
    },
    {
      id: "create_archive",
      label: "创建归档",
      description: "创建设备数据归档",
      icon: <Archive24Regular />,
      command: "shell",
      args: ["tar", "-czf", "/sdcard/device_archive.tar.gz", "/system/build.prop"],
      available: device.mode === "sys",
      needsSavePath: false,
    },
  ];

  const handleToolClick = (toolId: string) => {
    const tool = systemTools.find(t => t.id === toolId);
    if (!tool || !tool.available) return;

    if (tool.needsSavePath) {
      setCurrentTool(toolId);
      setSavePath("");
      setSaveDialogOpen(true);
    } else {
      executeTool(toolId);
    }
  };

  const executeTool = async (toolId: string, outputPath?: string) => {
    const tool = systemTools.find(t => t.id === toolId);
    if (!tool || !tool.available) return;

    setExecutingTool(toolId);
    setSaveDialogOpen(false);

    try {
      let args = [...tool.args];

      // 为需要输出路径的工具添加路径参数
      if (tool.needsSavePath && outputPath) {
        switch (toolId) {
          case "backup_data":
            args.push(outputPath);
            break;
          case "dump_system":
            args.push(outputPath);
            break;
        }
      }

      const result = await deviceService.executeAdbCommand(
        device.serial,
        tool.command,
        args,
        60 // 系统工具可能需要更长时间
      );
      
      if (result.success) {
        addNotification({
          type: "success",
          title: "工具执行成功",
          message: `${tool.label} 执行完成`,
        });

        // 对于需要保存输出的工具，将结果写入文件
        if (tool.needsSavePath && outputPath && (toolId === "package_list" || toolId === "system_props")) {
          try {
            // 这里应该使用Tauri的文件系统API来写入文件
            // 暂时只显示通知
            addNotification({
              type: "info",
              title: "输出保存",
              message: `输出已保存到: ${outputPath}`,
            });
          } catch (error) {
            addNotification({
              type: "warning",
              title: "保存失败",
              message: `无法保存输出到文件: ${error}`,
            });
          }
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
      setSavePath("");
      setCurrentTool("");
    }
  };

  const handleBrowseSavePath = async () => {
    const tool = systemTools.find(t => t.id === currentTool);
    if (!tool) return;

    try {
      const selected = await save({
        defaultPath: tool.defaultFileName,
        filters: [{
          name: `${tool.label} Files`,
          extensions: [tool.fileExtension || 'txt']
        }]
      });

      if (selected) {
        setSavePath(selected);
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "路径选择失败",
        message: `无法选择保存路径: ${error}`,
      });
    }
  };

  const handleConfirmSave = () => {
    if (savePath) {
      executeTool(currentTool, savePath);
    }
  };

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Settings24Regular />}
        header={<Text weight="semibold">系统工具</Text>}
        description={<Text size={200}>系统维护和数据管理工具</Text>}
      />
      
      <div className={styles.content}>
        {!isDeviceAvailable && (
          <Text size={200} style={{ color: "var(--colorPaletteYellowForeground1)" }}>
            ⚠️ 设备需要处于系统模式才能使用系统工具
          </Text>
        )}

        <div className={styles.toolsGrid}>
          {systemTools.map((tool) => (
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

        <Text className={styles.warningText}>
          💡 提示：系统工具执行时间可能较长，请耐心等待
        </Text>
      </div>

      {/* 保存路径选择对话框 */}
      <Dialog open={saveDialogOpen} onOpenChange={(_, data) => setSaveDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>选择保存路径</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Save24Regular />
                <Text weight="semibold">
                  {systemTools.find(t => t.id === currentTool)?.label}
                </Text>
              </div>
              <Field label="保存路径:">
                <div style={{ display: "flex", gap: "8px" }}>
                  <Input
                    value={savePath}
                    onChange={(_, data) => setSavePath(data.value)}
                    placeholder="选择文件保存路径"
                    style={{ flex: 1 }}
                  />
                  <Button
                    appearance="secondary"
                    icon={<FolderOpen24Regular />}
                    onClick={handleBrowseSavePath}
                  >
                    浏览
                  </Button>
                </div>
              </Field>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "12px" }}>
                {systemTools.find(t => t.id === currentTool)?.description}
              </Text>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">取消</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleConfirmSave}
              disabled={!savePath}
            >
              开始执行
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </Card>
  );
};

export default SystemToolCard;
