import React, { useState }  from 'react';
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
  Folder24Regular,
  DocumentArrowDown24Regular,
  Delete24Regular,
  FolderAdd24Regular,
  Copy24Regular,
  Rename24Regular,
  Storage24Regular,
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

interface FileOperationCardProps {
  device: DeviceInfo;
}

const FileOperationCard: React.FC<FileOperationCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [filePath, setFilePath] = useState("");
  const [targetPath, setTargetPath] = useState("");
  const [showPathDialog, setShowPathDialog] = useState(false);
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
      const result = await deviceService.executeAdbCommand(device.serial, command[0], command.slice(1));
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

  const handlePathAction = () => {
    if (!filePath.trim()) {
      addNotification({
        type: "error",
        title: "参数错误",
        message: "请输入文件路径",
      });
      return;
    }

    let command: string[] = [];
    let description = "";

    switch (currentAction) {
      case "list":
        command = ["shell", "ls", "-la", filePath];
        description = `列出目录内容 ${filePath}`;
        break;
      case "delete":
        command = ["shell", "rm", "-rf", filePath];
        description = `删除文件/目录 ${filePath}`;
        break;
      case "mkdir":
        command = ["shell", "mkdir", "-p", filePath];
        description = `创建目录 ${filePath}`;
        break;
      case "copy":
        if (!targetPath.trim()) {
          addNotification({
            type: "error",
            title: "参数错误",
            message: "请输入目标路径",
          });
          return;
        }
        command = ["shell", "cp", "-r", filePath, targetPath];
        description = `复制 ${filePath} 到 ${targetPath}`;
        break;
      case "move":
        if (!targetPath.trim()) {
          addNotification({
            type: "error",
            title: "参数错误",
            message: "请输入目标路径",
          });
          return;
        }
        command = ["shell", "mv", filePath, targetPath];
        description = `移动 ${filePath} 到 ${targetPath}`;
        break;
      default:
        return;
    }

    executeCommand(currentAction, command, description);
    setShowPathDialog(false);
    setFilePath("");
    setTargetPath("");
  };

  const openPathDialog = (action: string) => {
    setCurrentAction(action);
    setShowPathDialog(true);
  };

  const fileCommands = [
    {
      id: "storage_info",
      label: "存储信息",
      icon: <Storage24Regular />,
      command: ["shell", "df", "-h"],
      description: "查看存储空间信息",
    },
    {
      id: "sdcard_list",
      label: "SD卡内容",
      icon: <Folder24Regular />,
      command: ["shell", "ls", "-la", "/sdcard/"],
      description: "列出SD卡根目录内容",
    },
    {
      id: "download_list",
      label: "下载目录",
      icon: <DocumentArrowDown24Regular />,
      command: ["shell", "ls", "-la", "/sdcard/Download/"],
      description: "列出下载目录内容",
    },
  ];

  const pathCommands = [
    { id: "list", label: "列出目录", icon: <Folder24Regular />, needsTarget: false },
    { id: "delete", label: "删除文件", icon: <Delete24Regular />, needsTarget: false },
    { id: "mkdir", label: "创建目录", icon: <FolderAdd24Regular />, needsTarget: false },
    { id: "copy", label: "复制文件", icon: <Copy24Regular />, needsTarget: true },
    { id: "move", label: "移动文件", icon: <Rename24Regular />, needsTarget: true },
  ];

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Folder24Regular />}
        header={<Text weight="semibold">文件操作</Text>}
        description={<Text size={200}>文件和目录管理命令</Text>}
      />
      
      <div className={styles.content}>
        <div className={styles.commandGrid}>
          {/* 通用文件命令 */}
          {fileCommands.map((cmd) => (
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

          {/* 需要路径的命令 */}
          {pathCommands.map((cmd) => (
            <Button
              key={cmd.id}
              appearance="outline"
              className={styles.commandButton}
              disabled={!isDeviceAvailable}
              onClick={() => openPathDialog(cmd.id)}
            >
              <div className={styles.commandIcon}>{cmd.icon}</div>
              <Text className={styles.commandLabel}>{cmd.label}</Text>
            </Button>
          ))}
        </div>

        {/* 路径输入对话框 */}
        <Dialog open={showPathDialog} onOpenChange={(_, data) => setShowPathDialog(data.open)}>
          <DialogSurface>
            <DialogTitle>
              {currentAction === "list" && "列出目录内容"}
              {currentAction === "delete" && "删除文件/目录"}
              {currentAction === "mkdir" && "创建目录"}
              {currentAction === "copy" && "复制文件/目录"}
              {currentAction === "move" && "移动文件/目录"}
            </DialogTitle>
            <DialogContent>
              <DialogBody>
                <Field label="文件/目录路径" className={styles.inputField}>
                  <Input
                    value={filePath}
                    onChange={(_, data) => setFilePath(data.value)}
                    placeholder="例如: /sdcard/Download/file.txt"
                  />
                </Field>
                
                {(currentAction === "copy" || currentAction === "move") && (
                  <Field label="目标路径" className={styles.inputField}>
                    <Input
                      value={targetPath}
                      onChange={(_, data) => setTargetPath(data.value)}
                      placeholder="例如: /sdcard/backup/"
                    />
                  </Field>
                )}
                
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                  提示：常用路径 /sdcard/ (内部存储), /system/ (系统目录), /data/ (应用数据)
                </Text>
              </DialogBody>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setShowPathDialog(false)}>
                  取消
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handlePathAction}
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

export default FileOperationCard;
