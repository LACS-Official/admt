/*
FastbootCommandCard.tsx
这是 Fastboot 命令面板组件
*/
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  makeStyles,
  Text,
  Card,
  Field,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogSurface,
  DialogActions,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Delete24Regular,
  Copy24Regular,
  Search24Regular,
  ChevronDown24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";

const useStyles = makeStyles({
  container: {
    height: "100%",
    overflow: "auto",
  },
  mainCard: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: 'hidden',
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: "16px",
  },
  controlsSection: {
    height: "20%",
    minHeight: "100px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  topControlsRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  commandInputContainer: {
    flex: 1,
    display: "flex",
    gap: "8px",
  },
  commandInputField: {
    flex: 1,
  },
  quickCommandButton: {
    whiteSpace: "nowrap",
  },
  searchAndActionsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  searchContainer: {
    flex: 1,
    maxWidth: "400px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  outputSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "300px",
  },
  outputContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)", 
    borderRadius: "4px",
    overflow: "hidden",
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
  dialogBody: {
    maxHeight: "60vh",
    overflowY: "auto",
  },
  categoryHeader: {
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "8px",
    borderRadius: "4px",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "8px",
    padding: "8px 0",
  },
  commandItem: {
    padding: "10px 12px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    cursor: "pointer",
    '&:hover': {
      backgroundColor: "var(--colorNeutralBackground2)",
    },
  },
  searchMatchesInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
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

// 分类的快捷命令
const categorizedQuickCommands = [
  {
    category: "设备信息",
    commands: [
      { label: "获取设备列表", command: "devices" },
      { label: "获取所有变量", command: "getvar all" },
      { label: "获取设备锁状态", command: "oem device-info" },
      { label: "查看基带版本", command: "getvar version-baseband" },
    ]
  },
  {
    category: "刷机操作",
    commands: [
      { label: "擦除数据分区", command: "erase userdata" },
      { label: "擦除缓存分区", command: "erase cache" },
      { label: "格式化数据分区", command: "format userdata" },
    ]
  },
  {
    category: "解锁与引导",
    commands: [
      { label: "解锁Bootloader", command: "oem unlock" },
      { label: "重新锁定Bootloader", command: "oem lock" },
    ]
  }
];

// 扁平化所有命令以便搜索
const getAllCommands = () => {
  return categorizedQuickCommands.flatMap(category => 
    category.commands.map(cmd => ({ ...cmd, category: category.category }))
  );
};

const FastbootCommandCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isQuickCommandDialogOpen, setIsQuickCommandDialogOpen] = useState(false);
  const [dialogSearchTerm, setDialogSearchTerm] = useState("");

  const outputRef = useRef<HTMLPreElement>(null);

  // 处理对话框打开状态变化的函数
  const handleDialogOpenChange = (isOpen: boolean) => {
    setIsQuickCommandDialogOpen(isOpen);
  };

  // 计算匹配项数量和位置
  const searchMatches = useMemo<Array<{index: number, text: string, length: number}>>(() => {
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
  useEffect(() => {
    resetSearch();
  }, [searchTerm, resetSearch]);

  // 执行命令的通用函数
  const executeCommand = async (cmd: string) => {
    // Clear output immediately when starting new command
    setOutput("");
    setCommand(cmd);
    
    if (!cmd.trim() || !selectedDevice) return;

    setIsExecuting(true);

    try {
      console.log(`[FastbootCommandCard] 执行命令: ${cmd}`);
      console.log(`[FastbootCommandCard] 设备序列号: ${selectedDevice.serial}`);
      
      const parts = cmd.trim().split(" ");
      const commandName = parts[0];
      const args = parts.slice(1);

      console.log(`[FastbootCommandCard] 解析命令 - 名称: ${commandName}, 参数:`, args);

      const result = await deviceService.executeFastbootCommand(
        selectedDevice.serial,
        commandName,
        args,
        30
      );

      console.log(`[FastbootCommandCard] 命令执行结果:`, result);

      const timestamp = new Date().toLocaleTimeString();
      const newOutput = `[${timestamp}] $ fastboot -s ${selectedDevice.serial} ${cmd}\n`;
      
      if (result.success) {
        const outputText = newOutput + result.output + "\n\n";
        console.log(`[FastbootCommandCard] 设置输出:`, outputText);
        setOutput(outputText);
      } else {
        const errorText = newOutput + `错误: ${result.error || "命令执行失败"}\n\n`;
        console.log(`[FastbootCommandCard] 设置错误输出:`, errorText);
        setOutput(errorText);
      }
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString();
      const errorText = `[${timestamp}] 错误: ${error}\n\n`;
      console.error(`[FastbootCommandCard] 捕获异常:`, error);
      console.error(`[FastbootCommandCard] 设置错误输出:`, errorText);
      setOutput(errorText);
    } finally {
      setIsExecuting(false);
    }
  };

  // 处理快捷命令选择
  const handleQuickCommandSelect = (cmd: string) => {
    setIsQuickCommandDialogOpen(false);
    executeCommand(cmd);
  };

  const clearOutput = () => {
    setOutput("");
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
  };

  // 根据搜索词过滤快捷命令
  const getFilteredCommands = () => {
    if (!dialogSearchTerm.trim()) {
      return categorizedQuickCommands;
    }
    
    const lowerSearch = dialogSearchTerm.toLowerCase();
    const filteredCategories = [];
    
    for (const category of categorizedQuickCommands) {
      const filteredCommands = category.commands.filter(cmd => 
        cmd.label.toLowerCase().includes(lowerSearch) || 
        cmd.command.toLowerCase().includes(lowerSearch)
      );
      
      if (filteredCommands.length > 0) {
        filteredCategories.push({
          ...category,
          commands: filteredCommands
        });
      }
    }
    
    return filteredCategories;
  };

  return (
    <div className={styles.container}>
      <Card className={styles.mainCard}>
        <div className={styles.cardContent}>
          {/* 上部分：控制区域 */}
          <div className={styles.controlsSection}>
            {/* 命令输入和快捷命令按钮 */}
            <div className={styles.topControlsRow}>
              <div className={styles.commandInputContainer}>
                <div className={styles.commandInputField}>
                  <Field  style={{ marginBottom: 0 }}>
                    <Input
                      value={command}
                      onChange={(_, data) => setCommand(data.value)}
                      placeholder="例如: flash recovery recovery.img"
                      disabled={!selectedDevice || isExecuting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          executeCommand(command);
                        }
                      }}
                    />
                  </Field>
                </div>
                <Button
                  appearance="primary"
                  icon={<Play24Regular />}
                  onClick={() => executeCommand(command)}
                  disabled={!selectedDevice || isExecuting || !command.trim()}
                  style={{ alignSelf: "flex-end", marginBottom: "8px" }}
                >
                  {isExecuting ? '执行中...' : '执行'}
                </Button>
              </div>
              <Button
                className={styles.quickCommandButton}
                icon={<ChevronDown24Regular />}
                onClick={() => setIsQuickCommandDialogOpen(true)}
                disabled={!selectedDevice || isExecuting}
                style={{ alignSelf: "flex-end", marginBottom: "8px" }}
              >
                快捷命令
              </Button>
            </div>

            {/* 搜索框和操作按钮 */}
            <div className={styles.searchAndActionsRow}>
              <div className={styles.searchContainer}>
                <Input
                  placeholder="搜索输出..."
                  value={searchTerm}
                  onChange={(_, data) => setSearchTerm(data.value)}
                  contentBefore={<Search24Regular />}
                  disabled={!output}
                />
              </div>
              <div className={styles.actionButtons}>
                {searchTerm && searchMatches.length > 0 && (
                  <div className={styles.searchMatchesInfo}>
                    <Text size={200}>
                      找到 {searchMatches.length} 个匹配项
                    </Text>
                    <Button
                      appearance="subtle"
                      size="small"
                      onClick={navigateToMatch}
                      disabled={!searchTerm || searchMatches.length === 0}
                    >
                      下一个
                    </Button>
                  </div>
                )}
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
          </div>

          {/* 下部分：输出区域 */}
          <div className={styles.outputSection}>
            <div className={styles.outputContainer}>
              <div className={styles.outputContent}>
                <pre
                  ref={outputRef}
                  dangerouslySetInnerHTML={{
                    __html: highlightedOutput || '<span style="color: #888">Fastboot命令输出将显示在这里...</span>'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 快捷命令选择对话框 */}
      <Dialog
        open={isQuickCommandDialogOpen}
        onOpenChange={(event, data) => handleDialogOpenChange(data.open)}
        modalType="modal"
      >
        <DialogSurface>
          <DialogBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <DialogTitle>选择快捷命令</DialogTitle>
              <Button 
                appearance="subtle" 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQuickCommandDialogOpen(false);
                }}
              >
                ×
              </Button>
            </div>
            
            <DialogContent className={styles.dialogBody}>
              <Input
                placeholder="搜索命令..."
                value={dialogSearchTerm}
                onChange={(_, data) => setDialogSearchTerm(data.value)}
                contentBefore={<Search24Regular />}
                style={{ marginBottom: "16px" }}
              />
              {getFilteredCommands().map((category, categoryIndex) => (
                <div key={categoryIndex} style={{ marginBottom: "20px" }}>
                  <div className={styles.categoryHeader}>{category.category}</div>
                  <div className={styles.commandGrid}>
                    {category.commands.map((cmd, cmdIndex) => (
                      <div
                        key={cmdIndex}
                        className={styles.commandItem}
                        onClick={() => handleQuickCommandSelect(cmd.command)}
                      >
                        <Text weight="medium" style={{ marginBottom: "4px" }}>{cmd.label}</Text>
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                          {cmd.command}
                        </Text>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setIsQuickCommandDialogOpen(false)}>关闭</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default FastbootCommandCard;
