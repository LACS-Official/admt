import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Badge,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Play24Regular,
  Delete24Regular,
  Copy24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  cardContent: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  commandSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  commandInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  outputSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  output: {
    flex: 1,
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    padding: "8px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  quickCommands: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  quickCommandButton: {
    justifyContent: "flex-start",
  },
});

const AdbToolsPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const quickCommands = [
    { label: "获取设备信息", command: "shell getprop" },
    { label: "查看已安装应用", command: "shell pm list packages" },
    { label: "查看运行进程", command: "shell ps" },
    { label: "查看系统日志", command: "logcat -d" },
    { label: "查看电池信息", command: "shell dumpsys battery" },
    { label: "查看内存信息", command: "shell cat /proc/meminfo" },
    { label: "查看存储信息", command: "shell df" },
    { label: "重启到Recovery", command: "reboot recovery" },
    { label: "重启到Fastboot", command: "reboot bootloader" },
    { label: "重启到系统", command: "reboot" },
  ];

  const executeCommand = async () => {
    if (!selectedDevice || !command.trim()) return;

    setIsExecuting(true);
    try {
      const parts = command.trim().split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      const result = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        cmd,
        args,
        30
      );

      const timestamp = new Date().toLocaleTimeString();
      const newOutput = `[${timestamp}] $ adb -s ${selectedDevice.serial} ${command}\n`;
      
      if (result.success) {
        setOutput(prev => prev + newOutput + result.output + "\n\n");
      } else {
        setOutput(prev => prev + newOutput + `错误: ${result.error || "命令执行失败"}\n\n`);
      }
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      setOutput(prev => prev + `[${timestamp}] 错误: ${error}\n\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeQuickCommand = async (cmd: string) => {
    setCommand(cmd);
    if (!selectedDevice) return;

    setIsExecuting(true);
    try {
      const parts = cmd.trim().split(" ");
      const command = parts[0];
      const args = parts.slice(1);

      const result = await deviceService.executeAdbCommand(
        selectedDevice.serial,
        command,
        args,
        30
      );

      const timestamp = new Date().toLocaleTimeString();
      const newOutput = `[${timestamp}] $ adb -s ${selectedDevice.serial} ${cmd}\n`;
      
      if (result.success) {
        setOutput(prev => prev + newOutput + result.output + "\n\n");
      } else {
        setOutput(prev => prev + newOutput + `错误: ${result.error || "命令执行失败"}\n\n`);
      }
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      setOutput(prev => prev + `[${timestamp}] 错误: ${error}\n\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  const clearOutput = () => {
    setOutput("");
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Code24Regular />
          <Text size={500} weight="semibold">ADB工具</Text>
          {selectedDevice && (
            <Badge appearance="filled" color="success">
              {selectedDevice.serial}
            </Badge>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <Card className={styles.card}>
          <CardHeader
            image={<Code24Regular />}
            header={<Text weight="semibold">命令执行</Text>}
            description={<Text size={200}>执行自定义ADB命令</Text>}
          />
          
          <div className={styles.cardContent}>
            <div className={styles.commandSection}>
              <div className={styles.commandInput}>
                <Field label="ADB命令:" style={{ flex: 1 }}>
                  <Input
                    value={command}
                    onChange={(_, data) => setCommand(data.value)}
                    placeholder="例如: shell getprop"
                    disabled={!selectedDevice || isExecuting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        executeCommand();
                      }
                    }}
                  />
                </Field>
                
                <Button
                  appearance="primary"
                  icon={<Play24Regular />}
                  onClick={executeCommand}
                  disabled={!selectedDevice || !command.trim() || isExecuting}
                >
                  {isExecuting ? "执行中..." : "执行"}
                </Button>
              </div>
            </div>

            <div className={styles.outputSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text weight="semibold">输出结果:</Text>
                <div className={styles.actions}>
                  <Button
                    appearance="subtle"
                    icon={<Copy24Regular />}
                    size="small"
                    onClick={copyOutput}
                    disabled={!output}
                  >
                    复制
                  </Button>
                  <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    size="small"
                    onClick={clearOutput}
                    disabled={!output}
                  >
                    清空
                  </Button>
                </div>
              </div>
              
              <div className={styles.output}>
                {output || "命令输出将显示在这里..."}
              </div>
            </div>
          </div>
        </Card>

        <Card className={styles.card}>
          <CardHeader
            image={<Play24Regular />}
            header={<Text weight="semibold">快捷命令</Text>}
            description={<Text size={200}>常用ADB命令快捷执行</Text>}
          />
          
          <div className={styles.cardContent}>
            <div className={styles.quickCommands}>
              {quickCommands.map((cmd, index) => (
                <Button
                  key={index}
                  appearance="subtle"
                  className={styles.quickCommandButton}
                  onClick={() => executeQuickCommand(cmd.command)}
                  disabled={!selectedDevice || isExecuting}
                >
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdbToolsPanel;
