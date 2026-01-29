import React, { useState } from "react";
import {
  makeStyles,
  Card,
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

import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";
import { invoke } from "@tauri-apps/api/core";
import { useBatchExecutor } from "../Common/BatchExecutorDialog";

const useStyles = makeStyles({
  card: {
    height: "200px",
    minWidth: "200px",
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
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  titleIcon: {
    color: "var(--colorBrandForeground1)",
    fontSize: "24px",
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

interface MiscellaneousCardProps {
  className?: string;
}

const MiscellaneousCard: React.FC<MiscellaneousCardProps> = ({ className }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();
  const {BatchExecutorDialog } = useBatchExecutor();

  const [executingFunction, setExecutingFunction] = useState<string | null>(null);

  // 对话框状态
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
        message: t('misc.risky_confirm', { label: description }),
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
          message: t('misc.success', { description }),
        });
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || t('misc.fail', { description }),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: t('misc.fail_with_error', { description, error }),
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
      t('misc.open_device_manager')
    );
  };


  


  const handleRestartAdb = async () => {
    setStatusBarMessage({
      type: "info",
      message: t('misc.usb_fix_running'),
      });
    await executeCommand(
      "restart-adb",
      () => invoke("restart_adb_service"),
      t('misc.restart_adb')
    );
  };

  const handleInstallDriver = async () => {
      setStatusBarMessage({
      type: "info",
      message: t('misc.driver_tip'),
      });
  };


  const handleFixUsb3 = async () => {
    setShowUsbFixDialog(true);
  };

  // USB修复对话框处理函数
  const handleUsbFixStart = async () => {
    setShowUsbFixDialog(false);
    setUsbFixStatus('running');
    setUsbFixOutput(t('misc.usb_fix_running') + '\n');
    
    try {
      const result = await invoke("fix_usb3_connection") as any;
      setUsbFixOutput(prev => prev + t('misc.usb_fix_result', { output: result.output }) + '\n');
      
      if (result.success) {
        setUsbFixStatus('success');
        setStatusBarMessage({
          type: "success",
          message: t('misc.usb_fix_success'),
        });
      } else {
        setUsbFixStatus('error');
        setUsbFixOutput(prev => prev + `${t('common.fail')}: ${result.error || t('common.unknown_error')}\n`);
        setStatusBarMessage({
          type: "error",
          message: t('misc.usb_fix_error'),
        });
      }
    } catch (error) {
      setUsbFixStatus('error');
      setUsbFixOutput(prev => prev + `${t('common.fail')}: ${error}\n`);
      setStatusBarMessage({
        type: "error",
        message: t('misc.usb_fix_error') + `: ${error}`,
      });
    }
    
    // 重新打开对话框以显示结果
    setShowUsbFixDialog(true);
  };

  const handleUsbUnFixStart = async () => {
    setShowUsbFixDialog(false);
    setUsbFixStatus('running');
    setUsbFixOutput(t('misc.usb_unfix_running') + '\n');
    
    try {
      const result = await invoke("unfix_usb3_connection") as any;
      setUsbFixOutput(prev => prev + t('misc.usb_fix_result', { output: result.output }) + '\n');
      
      if (result.success) {
        setUsbFixStatus('success');
        setStatusBarMessage({
          type: "success",
          message: t('misc.usb_unfix_success'),
        });
      } else {
        setUsbFixStatus('error');
        setUsbFixOutput(prev => prev + `${t('common.fail')}: ${result.error || t('common.unknown_error')}\n`);
        setStatusBarMessage({
          type: "error",
          message: t('misc.usb_unfix_error'),
        });
      }
    } catch (error) {
      setUsbFixStatus('error');
      setUsbFixOutput(prev => prev + `${t('common.fail')}: ${error}\n`);
      setStatusBarMessage({
        type: "error",
        message: t('misc.usb_unfix_error') + `: ${error}`,
      });
    }
    
    // 重新打开对话框以显示结果
    setShowUsbFixDialog(true);
  };


  const handleUsbFixClose = () => {
    setShowUsbFixDialog(false);
    setUsbFixStatus('idle');
    setUsbFixOutput('');
  };



  const handleFinishAdb = async () => {
    setStatusBarMessage({
      type: "info",
      message: t('misc.finish_adb') + "...",
      });
    await executeCommand(
      "finish-adb",
      () => invoke("finish_adb_service"),
      t('misc.finish_adb')
    );
  };

  const handleOpenTaskManager = async () => {
    await executeCommand(
      "open-task-manager",
      () => invoke("open_task_manager"),
      t('misc.open_task_manager')
    );
  };


  const miscFunctions: MiscFunction[] = [
    {
      id: "restart-adb",
      title: t('misc.restart_adb'),
      isRisky: false,
      action: handleRestartAdb,
    },
    {
      id:"finish-adb",
      title: t('misc.finish_adb'),
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
      title: t('misc.install_driver'),
      isRisky: true,
      action: handleInstallDriver,
    },
    {
      id: "fix-usb3",
      title: t('misc.fix_usb3'),
      isRisky: true,
      action: handleFixUsb3,
    },
    {
      id: "open-device-manager",
      title: t('misc.open_device_manager'),
      isRisky: false,
      action: handleOpenDeviceManager,
    },{
      id: "open-task-manager",
      title: t('misc.open_task_manager'),
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
      <Card className={`${styles.card} ${className || ''}`}>
        <div className={styles.cardHeader}>
          <Info24Regular className={styles.titleIcon} />
          <Text className={styles.cardTitle}>{t('misc.title')}</Text>
        </div>


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
          <DialogTitle>{t('misc.usb_fix_title')}</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ marginBottom: '16px' }}>
                <Text>{t('misc.usb_fix_desc')}</Text>
              </div>
              
              {usbFixStatus === 'idle' && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--colorNeutralBackground2)',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <Text weight="semibold" style={{ color: 'var(--colorPaletteYellowForeground1)' }}>
                    {t('misc.usb_fix_notice')}
                  </Text>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>{t('misc.usb_fix_item1')}</li>
                    <li>{t('misc.usb_fix_item2')}</li>
                    <li>{t('misc.usb_fix_item3')}</li>
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
                      <Text size={200}>{t('misc.executing')}</Text>
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
                  {t('misc.cancel')}
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handleUsbFixStart}
                  icon={<Wrench24Regular />}
                >
                  {t('misc.start_fix')}
                </Button>
                <Button 
                  appearance="primary" 
                  onClick={handleUsbUnFixStart}
                  icon={<Wrench24Regular />}
                >
                  {t('misc.rollback_fix')}
                </Button>
              </>
            )}
            
            {usbFixStatus === 'running' && (
              <Button 
                appearance="secondary" 
                disabled
                icon={<Spinner size="tiny" />}
              >
                {t('misc.executing')}
              </Button>
            )}
            
            {(usbFixStatus === 'success' || usbFixStatus === 'error') && (
              <>
                <Button 
                  appearance="secondary" 
                  onClick={handleUsbFixClose}
                >
                  {t('misc.close')}
                </Button>
              </>
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
