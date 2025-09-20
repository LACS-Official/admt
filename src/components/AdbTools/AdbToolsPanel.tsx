/*
AdbToolsPanel.tsx
这是 ADB 工具面板组件
*/
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  makeStyles,
  shorthands,
  mergeClasses,
  Text,
  Card,
  CardHeader,
  Field,
  Input,
  Button,
  Spinner,
  Checkbox,
  Select,
  Option,
  Divider,
  Tag,
  TagGroup,
  TagGroupProps,
  TagProps,
  Tooltip,
  Overflow,
  OverflowItem,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Play24Regular,
  Delete24Regular,
  Copy24Regular,
  Search24Regular,
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
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  leftPanel: {
    flex: "0 0 40%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: '500px',
  },
  rightPanel: {
    flex: "0 0 50%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: 'hidden',
    minHeight:"450px",
    borderRadius: "4px",
    boxShadow: "0 0 4px rgba(0, 0, 0, 0.1)",
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: 'hidden',
    minHeight:"450px"
  },
  cardContent: {
    flex: 1,
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  commandSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
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
    minHeight: "200px",
    maxHeight: "500px",
    resize: "vertical",
    position: "relative",
  },
  outputContent: {
    flex: 1,
    overflow: "auto",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    '& pre': {
      margin: 0,
      fontFamily: '"Cascadia Code", Consolas, monospace',
      fontSize: '13px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }
  },
  outputHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  outputContentCollapsed: {
    maxHeight: "60px",
  },
  highlightedText: {
    backgroundColor: "yellow",
    color: "black",
  },
  commandInputContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  commandInputField: {
    flex: 1,
  },
  quickCommandsContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  quickCommandsList: {
    flex: 1,
    overflowY: 'auto',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '4px',
    padding: '8px',
    backgroundColor: "var(--colorNeutralBackground1)",
    /*支持下拉 */
    position:'relative',
    maxHeight:'250px'
  },
  quickCommandItem: {
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '4px',
    marginBottom: '4px',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground2)',
    },
  },
  selectedCommand: {
    backgroundColor: 'var(--colorNeutralBackground2)',
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

  const outputRef = useRef<HTMLPreElement>(null);

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
    // Clear output immediately when starting new command
    setOutput("");
    
    if (!command.trim() || !selectedDevice) return;

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
    // Clear output immediately when starting new command
    setOutput("");
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

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
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
        <div className={styles.leftPanel}>
          <Card className={styles.card}>

            <div className={styles.cardContent}>
              <div className={styles.commandSection}>
                <Field label="自定义ADB命令:">
                  <div className={styles.commandInputContainer}>
                    <div className={styles.commandInputField}>
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
                    </div>
                    <Button
                      appearance="primary"
                      icon={<Play24Regular />}
                      onClick={executeCommand}
                      disabled={!selectedDevice || isExecuting || !command.trim()}
                    >
                      {isExecuting ? '执行中...' : '执行'}
                    </Button>
                  </div>
                </Field>
              </div>

              <div className={styles.quickCommandsContainer}>
                <Field label="快捷命令:">
                  <div className={styles.quickCommandsList}>
                    {quickCommands.map((cmd, index) => (
                      <div 
                        key={index} 
                        className={mergeClasses(
                          styles.quickCommandItem, 
                          selectedQuickCommand === cmd.label && styles.selectedCommand
                        )}
                        onClick={() => {
                          setSelectedQuickCommand(cmd.label);
                          executeQuickCommand(cmd.command);
                        }}
                      >
                        <Text size={200}>{cmd.label}</Text>
                      </div>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.rightPanel}>
          <Card className={styles.card}>
            <CardHeader
              header={
                <div className={styles.header}>
                  <Text weight="semibold">命令输出</Text>
                  <div>
                    <Button
                      appearance="subtle"
                      icon={<Copy24Regular />}
                      onClick={copyOutput}
                      disabled={!output}
                      title="复制输出"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      onClick={clearOutput}
                      disabled={!output}
                      title="清空输出"
                    />
                  </div>
                </div>
              }
            />
            <div className={styles.cardContent}>
              <div className={styles.outputSection}>
                <div className={styles.searchSection}>
                  <Input
                    placeholder="搜索输出..."
                    value={searchTerm}
                    onChange={(_, data) => setSearchTerm(data.value)}
                    contentBefore={<Search24Regular />}
                    disabled={!output}
                    style={{ marginBottom: '12px' }}
                  />
                  {searchTerm && searchMatches.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Text size={200}>
                        找到 {searchMatches.length} 个匹配项
                      </Text>
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={navigateToMatch}
                        disabled={!searchTerm || searchMatches.length === 0}
                      >
                        下一个匹配项
                      </Button>
                    </div>
                  )}
                </div>

                <div className={styles.outputContainer}>
                  <div className={styles.outputContent}>
                    <pre
                      ref={outputRef}
                      dangerouslySetInnerHTML={{
                        __html: highlightedOutput || '<span style="color: #888">命令输出将显示在这里...</span>'
                      }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdbToolsPanel;
