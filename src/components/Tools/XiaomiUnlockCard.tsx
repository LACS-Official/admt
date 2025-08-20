import React, { useState }  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  Dialog,
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
import { invoke } from "@tauri-apps/api/core";

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
  const [, setCommandOutputs] = useState<Array<{
    id: string;
    command: string;
    output: string;
    timestamp: Date;
    success: boolean;
  }>>([]);
  const [] = useState("");

  // 添加命令输出到历史记录
  const addCommandOutput = (command: string, output: string, success: boolean) => {
    const newOutput = {
      id: Date.now().toString(),
      command,
      output,
      timestamp: new Date(),
      success
    };
    setCommandOutputs(prev => [newOutput, ...prev]);
  };

  // 过滤命令输出

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
      if (tool.dangerous && toolId !== "bypass_unlock" && toolId !== "xiaomi_unlock_tool") {
        setSelectedAction(toolId);
        setConfirmDialogOpen(true);
      } else if (toolId === "bypass_unlock" || toolId === "xiaomi_unlock_tool") {
        // bypass解锁和小米解锁工具跳过确认弹窗，直接执行
        executeUnlockTool(toolId);
      } else {
        executeAction(toolId);
      }
    }
  };

  /**
   * 通用解锁工具执行方法
   * @param toolId 工具ID ("bypass_unlock" 或 "xiaomi_unlock_tool")
   */
  const executeUnlockTool = async (toolId: string) => {
    setIsExecuting(true);
    setSelectedAction(toolId);

    try {
      // 根据工具ID设置提示信息
      const toolInfo = toolId === "bypass_unlock" 
        ? { name: "Bypass解锁", folder: "MiBypass", configFile: "config.json" }
        : { name: "小米解锁工具", folder: "miflash_unlock", configFile: "config.json" };

      addNotification({
        type: "info",
        title: toolInfo.name,
        message: `正在检测${toolInfo.name}...`,
      });

      // 尝试多个可能的路径
      const possiblePaths = [
        `downloads/${toolInfo.folder}`,
        `src-tauri/target/debug/downloads/${toolInfo.folder}`,
        `target/debug/downloads/${toolInfo.folder}`
      ];

      let toolPath = "";
      let folderExists = false;

      // 检查工具文件夹是否存在
      for (const path of possiblePaths) {
        try {
          const exists = await invoke<boolean>("check_file_exists", {
            path: path
          });
          if (exists) {
            toolPath = path;
            folderExists = true;
            break;
          }
        } catch (error) {
          console.warn(`检查路径失败: ${path}`, error);
          // 继续检查下一个路径
        }
      }

      if (!folderExists) {
        addNotification({
          type: "error",
          title: "工具未下载",
          message: "该工具还未下载，请前往资源中心下载",
          duration: 5000,
        });
        setIsExecuting(false);
        setSelectedAction("");
        return;
      }

      const configPath = `${toolPath}/${toolInfo.configFile}`;

      // 检查配置文件是否存在
      let configExists = false;
      try {
        configExists = await invoke<boolean>("check_file_exists", {
          path: configPath
        });
      } catch (error) {
        console.warn(`检查配置文件失败: ${configPath}`, error);
      }

      if (!configExists) {
        addNotification({
          type: "error",
          title: "配置文件缺失",
          message: `找不到${toolInfo.configFile}文件，请重新下载${toolInfo.name}工具`,
        });
        setIsExecuting(false);
        setSelectedAction("");
        return;
      }

      // 读取配置文件
      let configData: any;
      try {
        configData = await invoke<any>("read_json_file", {
          path: configPath
        });
      } catch (error) {
        addNotification({
          type: "error",
          title: "配置文件读取失败",
          message: `无法读取配置文件: ${error instanceof Error ? error.message : '未知错误'}`,
        });
        setIsExecuting(false);
        setSelectedAction("");
        return;
      }

      // 获取启动程序名称
      const executableName = toolId === "bypass_unlock" 
        ? configData.openname 
        : (configData.executable || configData.openname);

      if (!executableName) {
        addNotification({
          type: "error",
          title: "配置错误",
          message: toolId === "bypass_unlock" 
            ? "config.json文件中缺少openname字段"
            : "config.json文件中缺少启动程序配置",
        });
        setIsExecuting(false);
        setSelectedAction("");
        return;
      }

      // 检查启动程序是否存在
      const executablePath = `${toolPath}/${executableName}`;
      let executableExists = false;
      try {
        executableExists = await invoke<boolean>("check_file_exists", {
          path: executablePath
        });
      } catch (error) {
        console.warn(`检查启动程序失败: ${executablePath}`, error);
      }

      if (!executableExists) {
        addNotification({
          type: "error",
          title: "启动程序缺失",
          message: `找不到启动程序: ${executableName}`,
        });
        setIsExecuting(false);
        setSelectedAction("");
        return;
      }

      addNotification({
        type: "info",
        title: toolInfo.name,
        message: `正在启动${toolInfo.name}...`,
      });

      // 在新窗口中执行程序
      let result: any;
      try {
        result = await invoke<any>("execute_script_in_new_window", {
          scriptPath: executablePath
        });
      } catch (error) {
        addNotification({
          type: "error",
          title: `${toolInfo.name}启动失败`,
          message: `无法启动程序: ${error instanceof Error ? error.message : '未知错误'}`,
        });
        setIsExecuting(false);
        setSelectedAction("");
        return;
      }

      if (result.success) {
        addNotification({
          type: "success",
          title: toolInfo.name,
          message: toolId === "bypass_unlock"
            ? "bypass解锁脚本已成功启动，请按照脚本提示操作"
            : "小米解锁工具已成功启动，请按照程序提示操作",
        });
      } else {
        throw new Error(result.error || "程序启动失败");
      }

    } catch (error) {
      const toolName = toolId === "bypass_unlock" ? "Bypass解锁" : "小米解锁工具";
      addNotification({
        type: "error",
        title: `${toolName}失败`,
        message: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsExecuting(false);
      setSelectedAction("");
    }
  };

  const executeAction = async (actionId: string) => {
    setIsExecuting(true);
    setConfirmDialogOpen(false);

    try {
      let result;
      switch (actionId) {
        case "xiaomi_unlock_tool":
          // 这个case现在不会被执行，因为小米解锁工具直接调用executeUnlockTool
          // 保留这里是为了代码完整性
          await executeUnlockTool("xiaomi_unlock_tool");
          break;
        
        case "bypass_unlock":
          // 执行bypass解锁 - 调用executeUnlockTool方法
          await executeUnlockTool("bypass_unlock");
          break;
        
        case "detect_unlock_method": {
          // 检测解锁方式
          const command = "adb shell getprop ro.secureboot.lockstate";
          result = await deviceService.deviceService.executeAdbCommand(
            device.serial,
            "shell",
            ["getprop", "ro.secureboot.lockstate"],
            10
          );

          // 添加命令输出到历史记录
          addCommandOutput(command, result.output || result.error || "无输出", result.success);

          if (result.success) {
            addNotification({
              type: "success",
              title: "解锁方式检测",
              message: `设备解锁状态: ${result.output.trim()}`,
            });
          }
          break;
        }
        
        case "install_unlock_settings": {
          // 安装解锁专用设置
          addNotification({
            type: "info",
            title: "安装解锁专用设置",
            message: "正在检查设备信息...",
          });

          // 获取设备信息
          const deviceInfoCommand = "adb shell getprop ro.product.model";
          const deviceInfoResult = await deviceService.deviceService.executeAdbCommand(
            device.serial,
            "shell",
            ["getprop", "ro.product.model"],
            10
          );

          // 添加命令输出到历史记录
          addCommandOutput(deviceInfoCommand, deviceInfoResult.output || deviceInfoResult.error || "无输出", deviceInfoResult.success);

          if (deviceInfoResult.success) {
            // 获取Android版本
            const androidVersionCommand = "adb shell getprop ro.build.version.release";
            const androidVersionResult = await deviceService.deviceService.executeAdbCommand(
              device.serial,
              "shell",
              ["getprop", "ro.build.version.release"],
              10
            );

            // 添加命令输出到历史记录
            addCommandOutput(androidVersionCommand, androidVersionResult.output || androidVersionResult.error || "无输出", androidVersionResult.success);

            addNotification({
              type: "success",
              title: "设备信息获取完成",
              message: `设备型号: ${deviceInfoResult.output.trim()}, Android版本: ${androidVersionResult.output.trim()}`,
            });
          }
          break;
        }
        
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
