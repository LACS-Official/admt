import React, { useState } from "react";
import {
  makeStyles,
  mergeClasses,
  Card,
  Text,
  Spinner,
  Badge,
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
  WifiSettingsRegular,
  ArrowClockwise24Regular,
  Dismiss24Regular,
  Desktop24Regular,
  PlugDisconnected24Regular,
  AppsListDetail24Regular,
} from "@fluentui/react-icons";

import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { invoke } from "@tauri-apps/api/core";
import { useBatchExecutor } from "../Common/BatchExecutorDialog";

const useStyles = makeStyles({
  card: {
    padding: "20px 24px",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  cardContent: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    flex: 1,
  },
  functionItem: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "12px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    cursor: "pointer",
    minHeight: "88px",
    boxSizing: "border-box",
    position: "relative",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    },
    ":active": {
      transform: "translateY(0)",
    },
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },
  functionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.3",
  },
  functionDescription: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.4",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  disabledItem: {
    opacity: 0.5,
    cursor: "not-allowed",
    ":hover": {
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
  description: string;
  isRisky: boolean;
  isDisabled?: boolean;
  action: () => Promise<void>;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

interface MiscellaneousCardProps {
  className?: string;
  device?: any;
}

const MiscellaneousCard: React.FC<MiscellaneousCardProps> = ({ className, device: propDevice }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { selectedDevice: storeDevice } = useDeviceStore();
  const selectedDevice = propDevice || storeDevice;
  const { setStatusBarMessage, setWirelessDebuggingDialogOpen } = useAppStore();
  const { BatchExecutorDialog } = useBatchExecutor();

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
    if (selectedDevice?.serial === "DEMO-ADB-001") {
      setStatusBarMessage({
        type: "warning",
        message: t('adb.demo_mode'),
        duration: 3000,
      });
      return;
    }

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
      description: "重启 ADB 守护进程",
      isRisky: false,
      action: handleRestartAdb,
      icon: <ArrowClockwise24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "常用",
    },
    {
      id: "finish-adb",
      title: t('misc.finish_adb'),
      description: "终止全部 ADB 进程",
      isRisky: false,
      action: handleFinishAdb,
      icon: <Dismiss24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
    },
    {
      id: "install-driver",
      title: t('misc.install_driver'),
      description: "修复驱动缺失与异常",
      isRisky: true,
      action: handleInstallDriver,
      icon: <Wrench24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "驱动",
    },
    {
      id: "fix-usb3",
      title: t('misc.fix_usb3'),
      description: "解决 USB 3.0 掉线",
      isRisky: true,
      action: handleFixUsb3,
      icon: <PlugDisconnected24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "修复",
    },
    {
      id: "open-device-manager",
      title: t('misc.open_device_manager'),
      description: "打开系统设备管理器",
      isRisky: false,
      action: handleOpenDeviceManager,
      icon: <Desktop24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "系统",
    },
    {
      id: "open-task-manager",
      title: t('misc.open_task_manager'),
      description: "打开系统任务管理器",
      isRisky: true,
      action: handleOpenTaskManager,
      icon: <AppsListDetail24Regular />,
      iconBg: "var(--colorBrandBackground2)",
      iconColor: "var(--colorBrandForeground1)",
      badge: "系统",
    },
  ];

  const handleFunctionClick = async (func: MiscFunction) => {
    if (executingFunction || func.isDisabled) return;
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
          <div className={styles.titleSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Wrench24Regular style={{ color: "var(--colorBrandForeground1)" }} />
              <Text weight="semibold" size={400}>{t('misc.title')}</Text>
            </div>
          </div>
        </div>

        <div className={styles.cardContent}>
          {miscFunctions.map((func) => {
            const isExecuting = executingFunction === func.id;
            return (
              <div
                key={func.id}
                className={getItemClassName(func)}
                onClick={() => handleFunctionClick(func)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: "8px" }}>
                  <div
                    className={styles.iconBox}
                    style={{
                      backgroundColor: func.iconBg || "var(--colorNeutralBackground3)",
                      color: func.iconColor || "var(--colorBrandForeground1)",
                    }}
                  >
                    {func.icon}
                  </div>
                </div>

                <div>
                  <Text className={styles.functionTitle}>
                    {func.title}
                  </Text>
                  <div className={styles.functionDescription}>
                    {isExecuting ? (
                      <span style={{ color: "var(--colorBrandForeground1)", fontWeight: 600 }}>正在执行...</span>
                    ) : (
                      func.description
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
