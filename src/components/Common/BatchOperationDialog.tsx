import React, { useEffect, useState } from "react";
import {
  makeStyles,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  ProgressBar,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Clock24Regular,
  ArrowClockwise24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";
import { BatchOperation, InstallStatus } from "../../types/device";
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minWidth: "500px",
    maxWidth: "600px",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsList: {
    maxHeight: "300px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    padding: "12px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
  },
  itemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  itemName: {
    fontWeight: "600",
  },
  itemMessage: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  scriptOutput: {
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    padding: "12px",
    fontFamily: "monospace",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    maxHeight: "200px",
    overflow: "auto",
    color: "var(--colorNeutralForeground1)",
  },
  confirmDialog: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    alignItems: "center",
    textAlign: "center",
  },
});

interface ScriptExecutionConfig {
  scriptPath: string;
  scriptName: string;
  autoStart?: boolean;
  confirmClose?: boolean;
}

interface BatchOperationDialogProps {
  open: boolean;
  operation?: BatchOperation;
  scriptConfig?: ScriptExecutionConfig;
  onClose: () => void;
  onRetry?: () => void;
}

const BatchOperationDialog: React.FC<BatchOperationDialogProps> = ({
  open,
  operation,
  scriptConfig,
  onClose,
  onRetry,
}) => {
  const styles = useStyles();
  
  // Script execution states
  const [scriptStatus, setScriptStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [scriptOutput, setScriptOutput] = useState<string>('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  
  // Auto-start script when dialog opens with script config
  useEffect(() => {
    if (open && scriptConfig && scriptConfig.autoStart && scriptStatus === 'idle') {
      handleScriptStart();
    }
  }, [open, scriptConfig]);
  
  const handleScriptStart = async () => {
    if (!scriptConfig) return;
    
    setScriptStatus('running');
    setScriptOutput(`正在启动${scriptConfig.scriptName}...\n`);
    
    try {
      // Call Tauri backend to execute script
      const result = await invoke('run_usb_fix_script') as { success: boolean; output?: string; error?: string };
      
      if (result.success) {
        setScriptStatus('success');
        setScriptOutput(prev => prev + '\n执行完成！\n' + (result.output || ''));
      } else {
        setScriptStatus('error');
        setScriptOutput(prev => prev + '\n执行失败：' + (result.error || '未知错误'));
      }
    } catch (error) {
      setScriptStatus('error');
      setScriptOutput(prev => prev + '\n执行失败：' + String(error));
    }
  };
  
  const handleCloseClick = () => {
    if (scriptConfig?.confirmClose && scriptStatus === 'running') {
      setShowConfirmClose(true);
    } else {
      handleConfirmClose();
    }
  };
  
  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    setScriptStatus('idle');
    setScriptOutput('');
    onClose();
  };
  
  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  const getStatusIcon = (status: InstallStatus) => {
    switch (status) {
      case "success":
        return <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />;
      case "failed":
        return <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />;
      case "installing":
        return <Spinner size="small" />;
      case "pending":
        return <Clock24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
      case "cancelled":
        return <ErrorCircle24Regular style={{ color: "var(--colorNeutralForeground3)" }} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: InstallStatus) => {
    switch (status) {
      case "success":
        return <Badge appearance="filled" color="success">成功</Badge>;
      case "failed":
        return <Badge appearance="filled" color="danger">失败</Badge>;
      case "installing":
        return <Badge appearance="filled" color="brand">处理中</Badge>;
      case "pending":
        return <Badge appearance="outline">等待中</Badge>;
      case "cancelled":
        return <Badge appearance="outline">已取消</Badge>;
      default:
        return null;
    }
  };

  const getOperationTitle = () => {
    if (scriptConfig) {
      return scriptConfig.scriptName;
    }
    if (!operation) return "";
    return operation.operationType === "install" ? "批量安装APK" : "批量卸载应用";
  };

  const getProgressPercentage = () => {
    if (!operation || operation.totalItems === 0) return 0;
    return ((operation.completedItems + operation.failedItems) / operation.totalItems) * 100;
  };

  const isCompleted = () => {
    return operation?.status === "completed" || operation?.status === "failed";
  };

  const hasFailures = () => {
    return operation && operation.failedItems > 0;
  };

  if (!operation && !scriptConfig) return null;
  
  // Render confirmation dialog for closing during script execution
  if (showConfirmClose) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogSurface>
          <DialogTitle>确认关闭</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div className={styles.confirmDialog}>
                <Warning24Regular style={{ fontSize: "48px", color: "var(--colorPaletteYellowForeground1)" }} />
                <Text weight="semibold">脚本正在运行中</Text>
                <Text>确定要关闭对话框吗？脚本将继续在后台运行。</Text>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleCancelClose}>
              取消
            </Button>
            <Button appearance="primary" onClick={handleConfirmClose}>
              确认关闭
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && handleCloseClick()}>
      <DialogSurface>
        <DialogTitle>{getOperationTitle()}</DialogTitle>
        <DialogContent>
          <DialogBody>
            <div className={styles.content}>
              {/* Script execution content */}
              {scriptConfig && (
                <>
                  <div className={styles.progressSection}>
                    <div className={styles.progressStats}>
                      <Text weight="semibold">
                        状态: {scriptStatus === 'idle' ? '准备中' : 
                               scriptStatus === 'running' ? '运行中' :
                               scriptStatus === 'success' ? '执行成功' : '执行失败'}
                      </Text>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {scriptStatus === 'running' && <Spinner size="small" />}
                        {scriptStatus === 'success' && (
                          <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />
                        )}
                        {scriptStatus === 'error' && (
                          <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                        )}
                      </div>
                    </div>
                    {scriptStatus === 'running' && (
                      <ProgressBar color="brand" />
                    )}
                  </div>
                  
                  {scriptOutput && (
                    <div className={styles.scriptOutput}>
                      {scriptOutput}
                      {scriptStatus === 'running' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                          <Spinner size="tiny" />
                          <Text size={200}>执行中...</Text>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(scriptStatus === 'success' || scriptStatus === 'error') && (
                    <div style={{ textAlign: "center", padding: "16px" }}>
                      {scriptStatus === 'success' ? (
                        <Text style={{ color: "var(--colorPaletteGreenForeground1)" }}>
                          脚本执行成功完成！
                        </Text>
                      ) : (
                        <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>
                          脚本执行失败，请查看输出信息
                        </Text>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* Batch operation content */}
              {operation && (
                <>
                  <div className={styles.progressSection}>
                    <div className={styles.progressStats}>
                      <Text weight="semibold">
                        进度: {operation.completedItems + operation.failedItems} / {operation.totalItems}
                      </Text>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {operation.completedItems > 0 && (
                          <Badge appearance="filled" color="success">
                            成功: {operation.completedItems}
                          </Badge>
                        )}
                        {operation.failedItems > 0 && (
                          <Badge appearance="filled" color="danger">
                            失败: {operation.failedItems}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ProgressBar
                      value={getProgressPercentage()}
                      color={hasFailures() ? "error" : "success"}
                    />
                  </div>

                  <div className={styles.itemsList}>
                    {operation.items.map((item) => (
                      <div key={item.id} className={styles.item}>
                        {getStatusIcon(item.status)}
                        <div className={styles.itemContent}>
                          <div className={styles.itemName}>{item.name}</div>
                          {item.message && (
                            <div className={styles.itemMessage}>{item.message}</div>
                          )}
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                  </div>

                  {isCompleted() && (
                    <div style={{ textAlign: "center", padding: "16px" }}>
                      {hasFailures() ? (
                        <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>
                          操作完成，但有 {operation.failedItems} 个项目失败
                        </Text>
                      ) : (
                        <Text style={{ color: "var(--colorPaletteGreenForeground1)" }}>
                          所有操作已成功完成！
                        </Text>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogBody>
        </DialogContent>
        <DialogActions>
          {scriptConfig ? (
            <>
              {scriptStatus === 'idle' && (
                <>
                  <Button appearance="secondary" onClick={handleCloseClick}>
                    取消
                  </Button>
                  <Button appearance="primary" onClick={handleScriptStart}>
                    开始执行
                  </Button>
                </>
              )}
              {scriptStatus === 'running' && (
                <Button appearance="secondary" onClick={handleCloseClick}>
                  后台运行
                </Button>
              )}
              {(scriptStatus === 'success' || scriptStatus === 'error') && (
                <Button appearance="primary" onClick={handleCloseClick}>
                  关闭
                </Button>
              )}
            </>
          ) : (
            // Original batch operation actions
            isCompleted() ? (
              <>
                {hasFailures() && onRetry && (
                  <Button
                    appearance="secondary"
                    icon={<ArrowClockwise24Regular />}
                    onClick={onRetry}
                  >
                    重试失败项
                  </Button>
                )}
                <Button appearance="primary" onClick={onClose}>
                  关闭
                </Button>
              </>
            ) : (
              <Button appearance="secondary" onClick={onClose}>
                后台运行
              </Button>
            )
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default BatchOperationDialog;
