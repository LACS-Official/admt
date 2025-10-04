import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Spinner,
  tokens,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
} from "@fluentui/react-components";
import {
  Wrench24Regular,
  Warning24Regular,
  Info24Regular,
} from "@fluentui/react-icons";

import { useAppStore } from "../../stores/appStore";
import { invoke } from "@tauri-apps/api/core";
import { useBatchExecutor } from "../Common/BatchExecutorDialog";

const useStyles = makeStyles({
  card: {
    height: "200px",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "box-shadow 0.2s ease",
    ":hover": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
    },
  },
  cardHeader: {
    paddingBottom: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",

  },
  cardTitle: {
    fontSize: "12px", // 减少标题字体大小
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: "flex",
    alignItems: "center",
    gap: "6px", // 减少间距
  },
  titleIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "16px", // 减少图标大小
  },
  cardContent: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 改为2列布局
    gridTemplateRows: "1fr 1fr", // 改为2行布局
    gap: "4px",
    padding: "0 8px 8px 8px",
  },
  functionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 4px",
    border: "1px solid var(--colorNeutralStroke3)",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "40px",
    textAlign: "center",
    minWidth: 0,
    position: "relative",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },
  functionInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1px", // 减少间距
    flex: 1,
  },
  functionText: {
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
  functionTitle: {
    fontSize: "12px",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
  functionDescription: {
    display: "none", // 隐藏描述以节省空间
  },
  actionButton: {
    minWidth: "60px",
  },
  disabledItem: {
    opacity: 0.5,
    cursor: "not-allowed",
    backgroundColor: tokens.colorNeutralBackground3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,

      transform: "none",
      boxShadow: "none",
    },
  },
  warningDialog: {
    maxWidth: "450px",
  },
  warningContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  warningDialogIcon: {
    color: "var(--colorPaletteRedForeground1)",
    fontSize: "24px",
  },
  warningText: {
    lineHeight: "1.5",
  },
  infoBox: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
});

interface MiscFunction {
  id: string;
  title: string;
  isRisky: boolean;
  isDisabled?: boolean; // 新增禁用状态
  action: () => Promise<void>;
}

const MiscellaneousCard: React.FC = () => {
  const styles = useStyles();
  const { setStatusBarMessage } = useAppStore();
  const { executeBatch, BatchExecutorDialog } = useBatchExecutor();

  const [executingFunction, setExecutingFunction] = useState<string | null>(null);

  // 对话框状态
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showUsbFixDialog, setShowUsbFixDialog] = useState(false);
  const [usbFixStatus, setUsbFixStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [usbFixOutput, setUsbFixOutput] = useState<string>('');

  // 通用命令执行函数
  const executeCommand = async (
    commandId: string,
    command: () => Promise<any>,
    description: string,
    isRisky: boolean = false
  ) => {
    if (isRisky) {
      setStatusBarMessage({
        type: "warning",
        message: `请再次点击 确认执行重启操作`,
        icon: <Warning24Regular />,
        duration: 5000,
      });
    }

    setExecutingFunction(commandId);
    try {
      const result = await command();
      if (result.success) {
        setStatusBarMessage({
          type: "success",
          message: `${description}成功`,
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || `${description}失败`,
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `${description}失败: ${error}`,
      });
    } finally {
      setExecutingFunction(null);
    }
  };

  // 各种处理函数
  const handleOpenDeviceManager = async () => {
    await executeCommand(
      "open-device-manager",
      () => invoke("open_device_manager"),
      "打开设备管理器"
    );
  };

  const handleFinishAdb5037 = async () => {
    setStatusBarMessage({
      type: "info",
      message: "正在结束ADB-5037端口...",
      });
    await executeCommand(
      "finish-adb5037",
      () => invoke("finish_adb5037"),
      "结束ADB-5037端口"
    );
  };

  


  const handleRestartAdb = async () => {
    setStatusBarMessage({
      type: "info",
      message: "正在重启ADB服务...",
      });
    await executeCommand(
      "restart-adb",
      () => invoke("restart_adb_service"),
      "重启ADB服务"
    );
  };

  const handleInstallDriver = async () => {
      setStatusBarMessage({
      type: "info",
      message: "请前往在线资源板块下载并安装",
      });
  };


  const handleFixUsb3 = async () => {
    setShowUsbFixDialog(true);
  };

  // USB修复对话框处理函数
  const handleUsbFixStart = async () => {
    // 关闭当前对话框
    setShowUsbFixDialog(false);
    
    // 使用 BatchExecutorDialog 执行 USB 修复脚本
    executeBatch({
      title: "USB 3.0 修复工具",
      batchFileName: "Usb_fix.bat",
      workingDirectory: "tools/lacs"
    });
  };

  const handleUsbUnFixStart = async () => {
    // 关闭当前对话框
    setShowUsbFixDialog(false);
    
    // 使用 BatchExecutorDialog 执行 USB 修复脚本
    executeBatch({
      title: "USB 3.0 修复工具",
      batchFileName: "Usb_Unfix.bat",
      workingDirectory: "tools/lacs"
    });
  };


  const handleUsbFixClose = () => {
    setShowUsbFixDialog(false);
    setUsbFixStatus('idle');
    setUsbFixOutput('');
  };


  const handleFinishAdb = async () => {
    setStatusBarMessage({
      type: "info",
      message: "正在结束ADB服务...",
      });
    await executeCommand(
      "finish-adb",
      () => invoke("finish_adb_service"),
      "结束ADB服务"
    );
  };

  const handleOpenTaskManager = async () => {
    await executeCommand(
      "open-task-manager",
      () => invoke("open_task_manager"),
      "打开任务管理器"
    );
  };


  const miscFunctions: MiscFunction[] = [
    {
      id: "restart-adb",
      title: "重启ADB服务",
      isRisky: false,
      action: handleRestartAdb,
    },
    {
      id:"finish-adb",
      title: "结束ADB服务",
      isRisky: false,
      action: handleFinishAdb,
    },
    // {
    //   id: "finish-adb5037",
    //   title: "结束ADB-5037端口",
    //   isRisky: true,
    //   action: handleFinishAdb5037,
    // },
    {
      id: "install-driver",
      title: "安装设备驱动",
      isRisky: true,
      action: handleInstallDriver,
    },
    {
      id: "fix-usb3",
      title: "USB 3.0修复",
      isRisky: true,
      action: handleFixUsb3,
    },
    {
      id: "open-device-manager",
      title: "打开设备管理器",
      isRisky: false,
      action: handleOpenDeviceManager,
    },{
      id: "open-task-manager",
      title: "打开任务管理器",
      isRisky: true,
      action: handleOpenTaskManager,
    }
    
  ];

  const handleFunctionClick = async (func: MiscFunction) => {
    if (executingFunction || func.isDisabled) return;

    // 直接调用对应的处理函数
    await func.action();
  };



  const getItemClassName = (func: MiscFunction) => {
    let className = styles.functionItem;
    if (func.isDisabled) {
      className += ` ${styles.disabledItem}`;
    }
    return className;
  };



  return (
    <>
      <Card className={styles.card}>
        <CardHeader
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Info24Regular className={styles.titleIcon} />
            <Text weight="semibold">辅助功能</Text>
          </div>
        }
      />


        <div className={styles.cardContent}>
          {miscFunctions.map((func) => (
            <div
              key={func.id}
              className={getItemClassName(func)}
              onClick={() => handleFunctionClick(func)}
            >
              <div className={styles.functionText}>
                <Text className={styles.functionTitle}>{func.title}</Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* USB修复对话框 */}
      <Dialog 
        open={showUsbFixDialog} 
        onOpenChange={(event, data) => {
          if (!data.open && usbFixStatus !== 'running') {
            handleUsbFixClose();
          }
        }}
        modalType="modal"
      >
        <DialogSurface style={{ minWidth: '500px', maxWidth: '600px' }}>
          <DialogTitle>USB 3.0 修复工具</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ marginBottom: '16px' }}>
                <Text>此工具将修复USB 3.0连接问题，确保Android设备能够正常识别。</Text>
              </div>
              
              {usbFixStatus === 'idle' && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--colorNeutralBackground2)',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <Text weight="semibold" style={{ color: 'var(--colorPaletteYellowForeground1)' }}>
                    ⚠️ 注意事项：
                  </Text>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>此操作需要管理员权限</li>
                    <li>将修改系统注册表以修复USB 3.0问题</li>
                    <li>建议在执行前关闭其他USB调试工具</li>
                  </ul>
                </div>
              )}
              
              {(usbFixStatus === 'running' || usbFixStatus === 'success' || usbFixStatus === 'error') && (
                <div style={{
                  backgroundColor: 'var(--colorNeutralBackground6)',
                  border: '1px solid var(--colorNeutralStroke2)',
                  borderRadius: '4px',
                  padding: '12px',
                  fontFamily: 'Consolas, "Courier New", monospace',
                  fontSize: '12px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '16px'
                }}>
                  {usbFixOutput}
                  {usbFixStatus === 'running' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Spinner size="tiny" />
                      <Text size={200}>正在执行...</Text>
                    </div>
                  )}
                </div>
              )}
            </DialogBody>
          </DialogContent>
          <DialogActions>
            {usbFixStatus === 'idle' && (
              <>
                <Button 
                  appearance="secondary" 
                  onClick={handleUsbFixClose}
                >
                  取消
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handleUsbFixStart}
                  icon={<Wrench24Regular />}
                >
                  开始修复
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handleUsbUnFixStart}
                  icon={<Wrench24Regular />}
                >
                  撤销修复
                </Button>
              </>
            )}
            
            {usbFixStatus === 'running' && (
              <Button 
                appearance="secondary" 
                disabled
                icon={<Spinner size="tiny" />}
              >
                正在执行...
              </Button>
            )}
            
            {(usbFixStatus === 'success' || usbFixStatus === 'error') && (
              <Button 
                appearance="primary" 
                onClick={handleUsbFixClose}
              >
                完成
              </Button>
            )}
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* BatchExecutorDialog 组件 */}
      <BatchExecutorDialog />
    </>
  );
};

export default MiscellaneousCard;
