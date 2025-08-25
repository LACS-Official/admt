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
import { Command } from "@tauri-apps/plugin-shell";

interface CommandRunnerDialogProps {
  open: boolean;
  title: string;
  program: string;
  args: string[];
  cwd?: string;
  onClose: () => void;
}

const CommandRunnerDialog: React.FC<CommandRunnerDialogProps> = ({
  open,
  title,
  program,
  args,
  cwd,
  onClose,
}) => {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commandRef = useRef<any>(null);

  useEffect(() => {
    if (!open) return;

    const runCommand = async () => {
      try {
        // 显示将要执行的命令
        const commandString = `${program} ${args.join(' ')}`;
        setOutput(`执行命令: ${commandString}\n`);
        setIsRunning(true);
        
        // 创建命令对象
        const cmd = Command.create(program, args, { cwd });
        commandRef.current = cmd;
        
        // 保存监听器引用以便后续移除
        const listeners = {
          stdout: (line: string) => setOutput(prev => prev + line),
          stderr: (line: string) => setOutput(prev => prev + line),
          close: (data: { code: number }) => {
            setOutput(prev => prev + `\n\n[进程退出] 退出码: ${data.code}\n`);
          }
        };
        
        // 添加监听器
        cmd.stdout.on("data", listeners.stdout);
        cmd.stderr.on("data", listeners.stderr);
        cmd.on("close", listeners.close);
        
        // 执行命令
        const child = await cmd.spawn();
        
        // 创建一个Promise来跟踪命令完成状态
        const commandComplete = new Promise<void>((resolve, reject) => {
          const closeListener = cmd.on("close", (data) => {
            // 如果命令异常退出，使用reject
            if (data.code !== 0) {
              reject(new Error(`命令异常退出，退出码: ${data.code}`));
            } else {
              resolve();
            }
          });
          
          // 添加错误处理
          cmd.stderr.on("data", (errorLine) => {
            // 如果检测到明显的错误输出，可以提前拒绝
            if (errorLine.toLowerCase().includes("error") || errorLine.toLowerCase().includes("exception")) {
              reject(new Error(`检测到错误输出: ${errorLine}`));
            }
          });
        });
        
        // 等待命令完成
        await commandComplete;
        
        // 移除监听器
        cmd.stdout.off("data", listeners.stdout);
        cmd.stderr.off("data", listeners.stderr);
        cmd.off("close", listeners.close);
      } catch (error: any) {
        setOutput(prev => prev + `\n[错误] ${(error as Error).message}\n`);
        console.error('命令执行失败:', error);
      } finally {
        setIsRunning(false);
        commandRef.current = null;
      }
    };

    runCommand();
    
    // 清理函数
    return () => {
      if (commandRef.current) {
        // 如果有正在运行的命令，尝试终止它
        commandRef.current.kill()
          .catch(err => console.error('终止命令失败:', err));
      }
    };
  }, [open, program, args, cwd]);

  useEffect(() => {
    // 滚动到底部（确保DOM更新后执行）
    if (textareaRef.current) {
      Promise.resolve().then(() => {
        textareaRef.current!.scrollTop = textareaRef.current!.scrollHeight;
      });
    }
  }, [output]);

  const handleClose = () => {
    // 如果命令仍在运行，可能需要确认是否关闭
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogBody>
            <Textarea
              ref={textareaRef}
              value={output}
              readOnly
              style={{
                minHeight: '300px',
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
              placeholder="命令输出将显示在这里..."
            />
          </DialogBody>
        </DialogContent>
        <DialogActions>
          <Button 
            appearance="primary" 
            onClick={handleClose}
            disabled={isRunning}
            icon={isRunning ? <Spinner size="tiny" /> : undefined}
          >
            {isRunning ? '执行中...' : '关闭'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default CommandRunnerDialog;