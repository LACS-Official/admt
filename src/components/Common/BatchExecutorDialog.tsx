import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Spinner,
  Textarea,
} from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import { writeTextFile, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";
import * as path from "@tauri-apps/api/path";
import { useAppStore } from "../../stores/appStore";

interface BatchExecutorDialogProps {
  open: boolean;
  title: string;
  batchFileName: string;
  workingDirectory: string;
  onClose: () => void;
}

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exit_code?: number;
}

const BatchExecutorDialog: React.FC<BatchExecutorDialogProps> = ({
  open,
  title,
  batchFileName,
  workingDirectory,
  onClose,
}) => {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logFileName = useRef('');
  const { addNotification } = useAppStore();

  // 自动执行批处理文件
  useEffect(() => {
    if (!open) return;

    const executeBatchFile = async () => {
      try {
        // 生成日志文件名（以时间戳命名）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        logFileName.current = `logs/${timestamp}.log`;

        // 确保日志目录存在
        try {
          await mkdir('logs', { baseDir: BaseDirectory.AppData, recursive: true });
        } catch (e) {
          console.error('Failed to create logs directory:', e);
        }

        // 显示将要执行的命令
        const commandString = `执行批处理文件: ${batchFileName}`;
        const initialOutput = `${commandString}\n工作目录: ${workingDirectory}\n\n`;
        setOutput(initialOutput);
        
        // 写入初始日志
        try {
          await writeTextFile(logFileName.current, initialOutput, { baseDir: BaseDirectory.AppData });
        } catch (e) {
          console.error('Failed to write initial log:', e);
        }

        // 如果是刷机相关的批处理文件，添加提示信息
        if (batchFileName.toLowerCase().includes('flash')) {
          const flashWarning = '[提示] 检测到刷机操作，设备将在执行过程中断开连接，这是正常现象。刷机完成后请等待设备重启并重新连接。\n\n';
          setOutput(prev => prev + flashWarning);
          
          try {
            await writeTextFile(logFileName.current, flashWarning, { baseDir: BaseDirectory.AppData, append: true });
          } catch (e) {
            console.error('Failed to write flash warning log:', e);
          }
          
          addNotification({
            type: "warning",
            title: "刷机提示",
            message: "检测到刷机操作，设备将在执行过程中断开连接，这是正常现象。请耐心等待刷机完成并重新连接设备。",
            duration: 10000
          });
        }

        setIsRunning(true);
        
        // 调用后端命令执行批处理文件
        const result = await invoke<CommandResult>('execute_batch_file', {
          batchFileName,
          workingDirectory
        });
        
        // 显示执行结果
        let resultOutput = '';
        if (result.success) {
          resultOutput = result.output + '\n\n[执行完成] 批处理文件执行成功\n';
        } else {
          resultOutput = (result.output || '') + '\n\n[执行失败] ' + (result.error || '未知错误') + '\n';
          if (result.exit_code !== undefined) {
            resultOutput += `退出码: ${result.exit_code}\n`;
          }
        }
        
        setOutput(prev => prev + resultOutput);
        
        // 追加写入结果日志
        try {
          await writeTextFile(logFileName.current, resultOutput, { baseDir: BaseDirectory.AppData, append: true });
        } catch (e) {
          console.error('Failed to write result log:', e);
        }
      } catch (error: any) {
        const errorOutput = `\n[错误] ${error.message || error}\n`;
        setOutput(prev => prev + errorOutput);
        console.error('批处理文件执行失败:', error);
        
        // 追加写入错误日志
        try {
          await writeTextFile(logFileName.current, errorOutput, { baseDir: BaseDirectory.AppData, append: true });
        } catch (e) {
          console.error('Failed to write error log:', e);
        }
      } finally {
        setIsRunning(false);
      }
    };

    executeBatchFile();
  }, [open, batchFileName, workingDirectory, addNotification]);

  // 自动滚动到底部
  useEffect(() => {
    if (textareaRef.current) {
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        textareaRef.current!.scrollTop = textareaRef.current!.scrollHeight;
      });
    }
  }, [output]);

  const handleClose = () => {
    if (!isRunning) {
      setOutput('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(_, data) => !data.open && handleClose()}
    >
      {/* 总高度固定为600px */}
      <DialogSurface style={{ minWidth: '900px', height: '650px', display: 'flex', flexDirection: 'column' }}>
        {/* 标题栏包含标题和关闭按钮 */}
        <DialogTitle style={{ 
          padding: '16px 24px', 
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--colorNeutralStroke1)'
        }}>
          <span>{title}</span>
          <Button 
            size="small" 
            onClick={handleClose}
            disabled={isRunning}
            style={{ padding: '4px' }}
          >
            关闭
          </Button>
        </DialogTitle>
        
        {/* 内容区域占80%高度（加高输出区域） */}
        <DialogContent style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <DialogBody style={{ 
            height: '100%', 
            margin: 0, 
            padding: '24px',
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <Textarea
              ref={textareaRef}
              value={output}
              readOnly
              resize="none"
              style={{
                fontFamily: 'Consolas, "Courier New", monospace',
                fontSize: '14px',
                backgroundColor: 'var(--colorNeutralBackground1)',
                color: 'var(--colorNeutralForeground1)',
                border: '1px solid var(--colorNeutralStroke1)',
                lineHeight: '1.5',
                padding: '12px',
                height: '100%',
                width: '100%',
                borderRadius: '4px',
              }}
              placeholder="等待执行输出..."
            />
          </DialogBody>
        </DialogContent>
      </DialogSurface>
    </Dialog>
  );
};

export default BatchExecutorDialog;