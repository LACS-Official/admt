import React, { useEffect, useRef, useState } from 'react';
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
  const [isRunning, setIsRunning] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;

    const runCommand = async () => {
      try {
        setOutput(`执行命令: ${program} ${args.join(' ')}\n`);
        setIsRunning(true);
        
        // 这里应该调用Tauri命令来执行实际的命令
        // 暂时使用模拟输出
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOutput(prev => prev + '命令执行完成\n');
        
      } catch (error) {
        setOutput(prev => prev + `错误: ${(error as Error).message}\n`);
        console.error('命令执行失败:', error);
      } finally {
        setIsRunning(false);
      }
    };

    runCommand();
  }, [open, program, args, cwd]);

  useEffect(() => {
    // 滚动到底部（确保DOM更新后执行）
    if (textareaRef.current) {
      Promise.resolve().then(() => {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      });
    }
  }, [output]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
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
            onClick={onClose}
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