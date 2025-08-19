import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Field,
  Input,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Play24Regular,
  Delete24Regular,
  Copy24Regular,
  ChevronDown24Regular,
  Search24Regular,
  ChevronUp24Regular,
  ChevronDown24Filled,
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
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    minHeight:"500px"
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
  searchSection: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    marginBottom: "8px",
  },
  searchControls: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  searchInfo: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    whiteSpace: "nowrap",
  },
  quickCommandSection: {
    marginBottom: "16px",
  },
  outputContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  outputHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  outputContent: {
    flex: 1,
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "8px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    maxHeight: "300px",
  },
  outputContentCollapsed: {
    maxHeight: "60px",
  },
  highlightedText: {
    backgroundColor: "yellow",
    color: "black",
  },
});

// 添加全局样式来支持高亮显示
const globalStyles = `
  .highlighted-text {
    background-color: #ffff00;
    color: #000000;
    font-weight: bold;
  }
  .current-match {
    background-color: #ff6b35;
    color: #ffffff;
    font-weight: bold;
    box-shadow: 0 0 4px rgba(255, 107, 53, 0.5);
  }
`;

// 注入全局样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = globalStyles;
  if (!document.head.querySelector('style[data-highlight-styles]')) {
    styleElement.setAttribute('data-highlight-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

const AdbToolsPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [selectedQuickCommand, setSelectedQuickCommand] = useState("");

  const outputRef = useRef<HTMLDivElement>(null);

  // 计算匹配项数量和位置
  const searchMatches = useMemo(() => {
    if (!searchTerm.trim() || !output) {
      return [];
    }
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(output)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        length: match[0].length
      });
    }
    return matches;
  }, [output, searchTerm]);

  // 处理搜索高亮显示
  const highlightedOutput = useMemo(() => {
    if (!searchTerm.trim() || !output || searchMatches.length === 0) {
      return output;
    }

    let result = output;
    let offset = 0;

    searchMatches.forEach((match, index) => {
      const isCurrentMatch = index === currentMatchIndex;
      const className = isCurrentMatch ? 'current-match' : 'highlighted-text';
      const id = isCurrentMatch ? 'current-search-match' : `search-match-${index}`;

      const before = result.substring(0, match.index + offset);
      const matchText = result.substring(match.index + offset, match.index + offset + match.length);
      const after = result.substring(match.index + offset + match.length);

      const replacement = `<mark class="${className}" id="${id}">${matchText}</mark>`;
      result = before + replacement + after;

      offset += replacement.length - match.length;
    });

    return result;
  }, [output, searchTerm, searchMatches, currentMatchIndex]);

  // 搜索导航功能
  const navigateToMatch = useCallback(() => {
    if (searchMatches.length === 0) return;

    // 循环导航到下一个匹配项
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);

    // 滚动到当前匹配项
    setTimeout(() => {
      const currentElement = document.getElementById('current-search-match');
      if (currentElement && outputRef.current) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  }, [searchMatches.length, currentMatchIndex]);

  // 重置搜索状态
  const resetSearch = useCallback(() => {
    setCurrentMatchIndex(0);
  }, []);

  // 当搜索词改变时重置索引
  React.useEffect(() => {
    resetSearch();
  }, [searchTerm, resetSearch]);

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

  // 处理快捷命令选择
  const handleQuickCommandSelect = (value: string) => {
    setSelectedQuickCommand(value);
    const selectedCmd = quickCommands.find(cmd => cmd.label === value);
    if (selectedCmd) {
      executeQuickCommand(selectedCmd.command);
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
      <div className={styles.content}>
        <Card className={styles.card}>
          <CardHeader
            image={<Code24Regular />}
            header={<Text weight="semibold">ADB命令执行</Text>}
            description={<Text size={200}>执行自定义ADB命令和快捷操作</Text>}
          />

          <div className={styles.cardContent}>
            {/* 快捷命令选择器 */}
            <div className={styles.quickCommandSection}>
              <Field label="快捷命令:">
                <Dropdown
                  placeholder="选择常用命令快速执行"
                  value={selectedQuickCommand}
                  onOptionSelect={(_, data) => handleQuickCommandSelect(data.optionText || "")}
                  disabled={!selectedDevice || isExecuting}
                >
                  {quickCommands.map((cmd, index) => (
                    <Option key={index} text={cmd.label} value={cmd.label}>
                      {cmd.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            <div className={styles.commandSection}>
              <div className={styles.commandInput}>
                <Field label="自定义ADB命令:" style={{ flex: 1 }}>
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
              {/* 搜索区域 */}
              <div className={styles.searchSection}>
                <Field label="搜索输出内容:" style={{ flex: 1 }}>
                  <Input
                    value={searchTerm}
                    onChange={(_, data) => setSearchTerm(data.value)}
                    placeholder="输入关键词搜索..."
                    disabled={!output}
                  />
                </Field>
                <div className={styles.searchControls}>
                  <Button
                    appearance="subtle"
                    icon={<Search24Regular />}
                    size="small"
                    onClick={navigateToMatch}
                    disabled={!output || !searchTerm.trim() || searchMatches.length === 0}
                  >
                    导航
                  </Button>
                  {searchMatches.length > 0 && (
                    <Text className={styles.searchInfo}>
                      第{currentMatchIndex + 1}个，共{searchMatches.length}个匹配
                    </Text>
                  )}
                </div>
              </div>

              {/* 输出容器 */}
              <div className={styles.outputContainer}>
                <div className={styles.outputHeader}>
                  <Text weight="semibold">输出结果</Text>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

                <div
                  ref={outputRef}
                  className={`${styles.outputContent} ${isOutputCollapsed ? styles.outputContentCollapsed : ""}`}
                  dangerouslySetInnerHTML={{
                    __html: highlightedOutput || "命令输出将显示在这里..."
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdbToolsPanel;
