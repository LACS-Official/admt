import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Spinner,
  Badge,
  Text,
  makeStyles,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Stop24Regular,
  Copy24Regular,
  Save24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { writeTextFile, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { logService } from "../../services/logService";
import { useTranslation } from "react-i18next";

// 简化的批处理执行参数接口
interface BatchExecuteParams {
  title: string;
  batchFileName: string;
  workingDirectory: string;
}

// 原有的组件 Props 接口（保持向后兼容）
interface BatchExecutorDialogProps {
  open: boolean;
  title: string;
  batchFileName: string;
  workingDirectory: string;
  onClose: () => void;
}

// 自定义 Hook 返回值接口
interface UseBatchExecutorReturn {
  executeBatch: (params: BatchExecuteParams) => void;
  BatchExecutorDialog: React.FC;
}

interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exit_code?: number;
}

interface StreamOutput {
  data: string;
  timestamp: string;
  type: 'stdout' | 'stderr' | 'info' | 'error';
}

const useStyles = makeStyles({
  dialogSurface: {
    minWidth: '1000px',
    height: '700px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'var(--colorNeutralBackground1)',
  },
  titleBar: {
    padding: '16px 24px',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--colorNeutralStroke1)',
    background: 'linear-gradient(135deg, var(--colorBrandBackground) 0%, var(--colorBrandBackground2) 100%)',
    borderRadius: '12px 12px 0 0',
  },
  statusBar: {
    padding: '12px 24px',
    flexShrink: 0,
    borderBottom: '1px solid var(--colorNeutralStroke1)',
    backgroundColor: 'var(--colorNeutralBackground2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outputContainer: {
    flex: 1,
    padding: '16px 24px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  outputArea: {
    fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
    fontSize: '13px',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    border: '1px solid var(--colorNeutralStroke1)',
    lineHeight: '1.6',
    padding: '16px',
    height: '100%',
    width: '100%',
    borderRadius: '8px',
    resize: 'none',
    outline: 'none',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#2d2d2d',
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#555',
      borderRadius: '4px',
      '&:hover': {
        background: '#777',
      },
    },
  },
  actionBar: {
    padding: '16px 24px',
    flexShrink: 0,
    borderTop: '1px solid var(--colorNeutralStroke1)',
    backgroundColor: 'var(--colorNeutralBackground1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '0 0 12px 12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  confirmDialog: {
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
});

const BatchExecutorDialog: React.FC<BatchExecutorDialogProps> = ({
  open,
  title,
  batchFileName,
  workingDirectory,
  onClose,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage, config, updateConfig } = useAppStore();
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [originalAutoDetect, setOriginalAutoDetect] = useState<boolean>(config.autoDetectDevices);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const logFileName = useRef<string>('');
  const unlistenRef = useRef<(() => void) | null>(null);

  // ANSI 颜色代码映射表
  const ansiColorMap: { [key: string]: string } = {
    '30': '#000000', // 黑色
    '31': '#ff6b6b', // 红色
    '32': '#51cf66', // 绿色
    '33': '#ffd43b', // 黄色
    '34': '#74c0fc', // 蓝色
    '35': '#da77f2', // 紫色
    '36': '#4ecdc4', // 青色
    '37': '#ffffff', // 白色
    '90': '#868e96', // 暗灰色
    '91': '#ff8787', // 亮红色
    '92': '#8ce99a', // 亮绿色
    '93': '#ffe066', // 亮黄色
    '94': '#91a7ff', // 亮蓝色
    '95': '#e599f7', // 亮紫色
    '96': '#66d9ef', // 亮青色
    '97': '#f8f9fa', // 亮白色
  };

  // 解析 ANSI 转义序列并生成富文本片段
  const parseAnsiToHtml = (text: string): React.ReactNode[] => {
    const ansiRegex = /\x1b\[(\d+)m/g;
    const fragments: React.ReactNode[] = [];
    let lastIndex = 0;
    let currentColor = '#d4d4d4'; // 默认颜色
    let match;
    let fragmentIndex = 0;

    while ((match = ansiRegex.exec(text)) !== null) {
      // 添加前面的文本片段
      if (match.index > lastIndex) {
        const textContent = text.slice(lastIndex, match.index);
        if (textContent) {
          fragments.push(
            <span key={fragmentIndex++} style={{ color: currentColor }}>
              {textContent}
            </span>
          );
        }
      }

      // 解析颜色代码
      const colorCode = match[1];
      if (colorCode === '0') {
        // 重置颜色
        currentColor = '#d4d4d4';
      } else if (ansiColorMap[colorCode]) {
        currentColor = ansiColorMap[colorCode];
      }

      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的文本
    if (lastIndex < text.length) {
      const textContent = text.slice(lastIndex);
      if (textContent) {
        fragments.push(
          <span key={fragmentIndex++} style={{ color: currentColor }}>
            {textContent}
          </span>
        );
      }
    }

    // 如果没有 ANSI 代码，返回原始文本
    if (fragments.length === 0) {
      fragments.push(
        <span key={0} style={{ color: '#d4d4d4' }}>
          {text}
        </span>
      );
    }

    return fragments;
  };

  // 智能颜色输出函数
  const getColoredOutput = (text: string, type: 'stdout' | 'stderr' | 'info' | 'error' = 'stdout'): string => {
    // 检测关键词并应用颜色
    let coloredText = text;
    
    // 根据内容智能着色
    if (text.toLowerCase().includes('sending')) {
      coloredText = `\x1b[94m${text}\x1b[0m`; // 亮蓝色
    } else if (text.toLowerCase().includes('warning')) {
      coloredText = `\x1b[93m${text}\x1b[0m`; // 亮黄色
    } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) {
      coloredText = `\x1b[91m${text}\x1b[0m`; // 亮红色
    } else if (text.toLowerCase().includes('okay') || text.toLowerCase().includes('finished') || text.toLowerCase().includes('done')) {
      coloredText = `\x1b[92m${text}\x1b[0m`; // 亮绿色
    } else if (text.toLowerCase().includes('fastboot') || text.toLowerCase().includes('adb')) {
      coloredText = `\x1b[96m${text}\x1b[0m`; // 亮青色
    } else {
      // 根据类型应用基础颜色
      switch (type) {
        case 'info':
          coloredText = `\x1b[36m${text}\x1b[0m`; // 青色
          break;
        case 'error':
          coloredText = `\x1b[31m${text}\x1b[0m`; // 红色
          break;
        case 'stderr':
          coloredText = `\x1b[33m${text}\x1b[0m`; // 黄色
          break;
        default:
          coloredText = `\x1b[37m${text}\x1b[0m`; // 白色
      }
    }
    
    return coloredText;
  };

  // 中文编码处理函数
  const decodeChineseText = (text: string): string => {
    try {
      // 检测是否包含可能的乱码字符
      if (text.includes('�') || /[\x80-\xFF]/.test(text)) {
        // 尝试修复常见的 GBK 到 UTF-8 的乱码问题
        // 这里使用一些启发式方法来修复常见的中文乱码
        let fixedText = text;
        
        // 修复一些常见的乱码模式
        const gbkToUtf8Map: { [key: string]: string } = {
          'ÐÞ¸´': '修复',
          'ÍêÉÏ': '完成',
          'Ê§°Ü': '失败',
          'ÕýÔÚ': '正在',
          'Ö´ÐÐ': '执行',
          'ÇëÒÔ': '请以',
          'ÄÚ´æ': '内存',
          'ÎÄ¼þ': '文件',
          'ÏµÍ³': '系统',
          'ÉèÖÃ': '设置',
          'Ó¦ÓÃ': '应用',
          'ÈÏÖ¤': '认证',
          'Á¬½Ó': '连接',
          'ÉÏ´«': '上传',
          'ÏÂÔØ': '下载',
          'ÆôÓÃ': '启用',
          'ÍêÕû': '完整',
          'Ö´ÐÐÍêÉÏ': '执行完成',
          'Ö´ÐÐÊ§°Ü': '执行失败',
          'ÕýÔÚÖ´ÐÐ': '正在执行',
          'ÇëÖØÆô': '请重启',
          'µçÄÔ': '电脑',
          'ÉúÐ§': '生效'
        };
        
        // 应用乱码修复映射
        for (const [garbled, correct] of Object.entries(gbkToUtf8Map)) {
          fixedText = fixedText.replace(new RegExp(garbled, 'g'), correct);
        }
        
        return fixedText;
      }
      
      // 如果没有检测到乱码，直接返回原文本
      return text;
    } catch (error) {
      console.warn('Failed to decode Chinese text:', error);
      return text;
    }
  };

  // 添加输出内容的函数
  const appendOutput = useCallback((newOutput: string, type: 'stdout' | 'stderr' | 'info' | 'error' = 'stdout') => {
    // 处理中文编码
    const decodedOutput = decodeChineseText(newOutput);
    
    const timestamp = new Date().toLocaleTimeString(t('common.locale_tag') || 'zh-CN', { hour12: false });
    const coloredOutput = getColoredOutput(decodedOutput, type);
    const formattedOutput = `[${timestamp}] ${coloredOutput}`;
    
    setOutput(prev => prev + formattedOutput);
    
    // 写入日志文件
    if (logFileName.current) {
      writeTextFile(logFileName.current, formattedOutput, {
        baseDir: BaseDirectory.AppData,
        append: true,
      }).catch(error => {
        console.error('Failed to write to log file:', error);
      });
    }
  }, []);

  // 自动执行批处理文件
  useEffect(() => {
    if (!open) {
      // 重置状态
      setOutput('');
      setIsRunning(false);
      setIsCompleted(false);
      setExitCode(null);
      setStartTime(null);
      setEndTime(null);
      return;
    }
    
    // 保存原始的自动检测状态，并关闭自动检测
    setOriginalAutoDetect(config.autoDetectDevices);
    if (config.autoDetectDevices) {
      updateConfig({ autoDetectDevices: false });
    }

    const executeBatchFile = async () => {
      try {
        // 生成日志文件名（以时间戳命名）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        logFileName.current = `logs/${timestamp}.log`;
        setStartTime(new Date());

        // 确保日志目录存在
        try {
          await mkdir('logs', { baseDir: BaseDirectory.AppData, recursive: true });
        } catch (e) {
          console.error('Failed to create logs directory:', e);
        }

        // 显示将要执行的命令
        const commandString = `${t('fastboot.executing')}: ${batchFileName}`;
        const initialOutput = `${commandString}\n${t('flash.directory')}: ${workingDirectory}\n${'='.repeat(80)}\n\n`;
        setOutput(initialOutput);

        await logService.info(`启动批处理脚本: ${batchFileName}`, '脚本执行服务', { workingDirectory });
        
        // 写入初始日志
        try {
          await writeTextFile(logFileName.current, initialOutput, { baseDir: BaseDirectory.AppData });
        } catch (e) {
          console.error('Failed to write initial log:', e);
        }

        // 如果是刷机相关的批处理文件，添加提示信息
        if (batchFileName.toLowerCase().includes('flash')) {
          const flashWarning = t('batch_executor.flash_notice');
          appendOutput(flashWarning, 'info');
          
          setStatusBarMessage({
            type: "warning",
            message: t('batch_executor.flash_warning_msg'),
          });
        }

        setIsRunning(true);
        
        // 设置实时输出监听器
        try {
          const unlisten = await listen('batch-output', (event: any) => {
            const payload = event.payload as StreamOutput;
            appendOutput(payload.data, payload.type);
          });
          unlistenRef.current = unlisten;
        } catch (e) {
          console.warn('Failed to setup real-time output listener:', e);
        }
        
        // 调用后端命令执行批处理文件（支持实时流输出）
        const result = await invoke<CommandResult>('execute_batch_file_stream', {
          batchFileName,
          workingDirectory
        }).catch(async (error) => {
          // 如果流式命令不存在，回退到原始命令
          console.warn('Stream command not available, falling back to regular execution');
          return await invoke<CommandResult>('execute_batch_file', {
            batchFileName,
            workingDirectory
          });
        });
        
        setEndTime(new Date());
        setExitCode(result.exit_code || 0);
        setIsCompleted(true);
        
        // 显示执行结果
        let resultOutput = '';
        if (result.success) {
          resultOutput = `\n${'='.repeat(80)}\n${t('batch_executor.exec_completed', { code: result.exit_code || 0 })}`;
          appendOutput(resultOutput, 'info');
          await logService.info(`批处理脚本执行成功: ${batchFileName}`, '脚本执行服务', { exitCode: result.exit_code || 0 });
        } else {
          resultOutput = `\n${'='.repeat(80)}\n${t('batch_executor.exec_failed', { error: result.error || t('common.unknown_error'), code: result.exit_code || 1 })}`;
          appendOutput(resultOutput, 'error');
          await logService.error(`批处理脚本执行失败: ${batchFileName}`, '脚本执行服务', { error: result.error, exitCode: result.exit_code || 1 });
        }
        
        // 如果有额外输出，也添加进去
        if (result.output && !result.output.includes('[执行完成]') && !result.output.includes('[执行失败]')) {
          appendOutput(result.output + '\n');
        }
        
      } catch (error: any) {
        setEndTime(new Date());
        setExitCode(1);
        setIsCompleted(true);
        const errorOutput = `\n${'='.repeat(80)}\n${t('batch_executor.exec_error', { error: error.message || error })}\n`;
        appendOutput(errorOutput, 'error');
        await logService.error(`批处理脚本执行异常: ${batchFileName}`, '脚本执行服务', { error: String(error) });
        console.error('批处理文件执行失败:', error);
      } finally {
        setIsRunning(false);
        // 清理监听器
        if (unlistenRef.current) {
          unlistenRef.current();
          unlistenRef.current = null;
        }
      }
    };

    executeBatchFile();
  }, [open, batchFileName, workingDirectory, setStatusBarMessage, appendOutput]);

  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        outputRef.current!.scrollTop = outputRef.current!.scrollHeight;
      });
    }
  }, [output]);

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时清理监听器
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    if (isRunning) {
      // 如果正在运行，显示确认对话框
      setShowConfirmDialog(true);
    } else {
      // 如果没有运行，直接关闭
      // 恢复原始的自动检测状态
      if (originalAutoDetect) {
        updateConfig({ autoDetectDevices: true });
      }
      setOutput('');
      onClose();
    }
  };

  const handleConfirmClose = () => {
    // 用户确认关闭，停止脚本运行
    setIsRunning(false);
    setShowConfirmDialog(false);
    
    // 清理监听器
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
    
    // 添加停止通知
    setStatusBarMessage({
      type: "warning",
      message: t('batch_executor.user_interrupted'),
    });
    
    // 恢复原始的自动检测状态
    if (originalAutoDetect) {
      updateConfig({ autoDetectDevices: true });
    }
    
    setOutput('');
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmDialog(false);
  };

  const handleCopyOutput = async () => {
    try {
      // 移除 ANSI 转义序列，只复制纯文本
      const plainText = output.replace(/\x1b\[\d+m/g, '');
      await navigator.clipboard.writeText(plainText);
      setStatusBarMessage({
        type: "success",
        message: t('batch_executor.copy_success'),
      });
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('batch_executor.copy_failed'),
      });
    }
  };

  const handleSaveLog = async () => {
    if (!logFileName.current) return;
    
    setStatusBarMessage({
      type: "info",
      message: t('batch_executor.log_saved', { path: logFileName.current }),
    });
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return <Badge appearance="filled" color="brand" icon={<Spinner size="tiny" />}>{t('batch_executor.status_running')}</Badge>;
    } else if (isCompleted) {
      if (exitCode === 0) {
        return <Badge appearance="filled" color="success" icon={<CheckmarkCircle24Regular />}>{t('batch_executor.status_success')}</Badge>;
      } else {
        return <Badge appearance="filled" color="danger" icon={<ErrorCircle24Regular />}>{t('batch_executor.status_failed')}</Badge>;
      }
    }
    return <Badge appearance="outline" color="subtle">{t('batch_executor.status_preparing')}</Badge>;
  };

  const getExecutionTime = () => {
    if (startTime && endTime) {
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
      return `${duration}${t('batch_executor.seconds_unit')}`;
    } else if (startTime && isRunning) {
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
      return `${duration}${t('batch_executor.seconds_unit')}`;
    }
    return '-';
  };

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(_, data) => !data.open && handleClose()}
      >
        <DialogSurface className={styles.dialogSurface}>
          {/* 标题栏 */}
          <div className={styles.titleBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Play24Regular style={{ color: 'white' }} />
              <Text weight="semibold" size={500} style={{ color: 'white' }}>{title}</Text>
            </div>
            <Button 
              size="small" 
              appearance="subtle"
              onClick={handleClose}
              icon={isRunning ? <Stop24Regular /> : <Dismiss24Regular />}
              style={{ 
                color: 'white',
                borderRadius: '6px'
              }}
            >
              {isRunning ? t('batch_executor.stop_exec') : t('common.close')}
            </Button>
          </div>

        {/* 状态栏 */}
        <div className={styles.statusBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {getStatusBadge()}
            <Text size={300}>{t('batch_executor.file_label')}{batchFileName}</Text>
            <Text size={300}>{t('batch_executor.exec_time_label')}{getExecutionTime()}</Text>
            {exitCode !== null && <Text size={300}>{t('batch_executor.exit_code_label')}{exitCode}</Text>}
          </div>
        </div>
        
        {/* 输出区域 */}
        <div className={styles.outputContainer}>
          <div
            ref={outputRef}
            className={styles.outputArea}
            style={{
              scrollbarColor: '#555 #2d2d2d',
              overflowY: 'auto',
              overflowX: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              userSelect: 'text',
              cursor: 'text',
            }}
          >
            {output ? (
              parseAnsiToHtml(output)
            ) : (
              <span style={{ color: '#666', fontStyle: 'italic' }}>
                {t('batch_executor.waiting_output')}
              </span>
            )}
          </div>
        </div>

        {/* 操作栏 */}
        <div className={styles.actionBar}>
          <div className={styles.buttonGroup}>
            <Button
              size="small"
              appearance="subtle"
              icon={<Copy24Regular />}
              onClick={handleCopyOutput}
              disabled={!output}
            >
              {t('batch_executor.copy_output')}
            </Button>
            <Button
              size="small"
              appearance="subtle"
              icon={<Save24Regular />}
              onClick={handleSaveLog}
              disabled={!logFileName.current}
            >
              {t('batch_executor.save_log')}
            </Button>
          </div>
          
          <div className={styles.buttonGroup}>
            <Button
              appearance="primary"
              onClick={handleClose}
              style={{ borderRadius: '6px' }}
            >
              {isRunning ? t('batch_executor.stop_exec') : t('batch_executor.finish')}
            </Button>
          </div>
        </div>
      </DialogSurface>
    </Dialog>

    {/* 二次确认关闭对话框 */}
    <Dialog open={showConfirmDialog} onOpenChange={(_, data) => !data.open && handleCancelClose()}>
      <DialogSurface className={styles.confirmDialog} style={{ maxWidth: '400px' }}>
        <DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warning24Regular style={{ color: 'var(--colorPaletteYellowForeground1)' }} />
            <Text weight="semibold">{t('batch_executor.confirm_stop_title')}</Text>
          </div>
        </DialogTitle>
        <DialogContent>
          <DialogBody>
            <Text style={{ whiteSpace: 'pre-wrap' }}>
              {t('batch_executor.confirm_stop_desc')}
            </Text>
          </DialogBody>
        </DialogContent>
        <DialogActions>
          <Button 
            appearance="secondary" 
            onClick={handleCancelClose}
            style={{ borderRadius: '6px' }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            appearance="primary" 
            onClick={handleConfirmClose}
            style={{ 
              backgroundColor: 'var(--colorPaletteRedBackground3)',
              borderColor: 'var(--colorPaletteRedBorder2)',
              borderRadius: '6px'
            }}
          >
            {t('batch_executor.confirm_stop_btn')}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  </>
  );
};

// 简化的自定义 Hook，提供一键调用 API
export const useBatchExecutor = (): UseBatchExecutorReturn => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    batchFileName: "",
    workingDirectory: ""
  });

  const executeBatch = useCallback((params: BatchExecuteParams) => {
    setDialogState({
      open: true,
      title: params.title,
      batchFileName: params.batchFileName,
      workingDirectory: params.workingDirectory
    });
  }, []);

  const handleClose = useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);

  const BatchExecutorDialogComponent = useCallback(() => (
    <BatchExecutorDialog
      open={dialogState.open}
      title={dialogState.title}
      batchFileName={dialogState.batchFileName}
      workingDirectory={dialogState.workingDirectory}
      onClose={handleClose}
    />
  ), [dialogState, handleClose]);

  return {
    executeBatch,
    BatchExecutorDialog: BatchExecutorDialogComponent
  };
};

export default BatchExecutorDialog;