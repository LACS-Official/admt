import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
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
  Desktop24Regular,
  ArrowClockwise24Regular,
  Stop24Regular,
  Shield24Regular,
  Info24Regular,
} from "@fluentui/react-icons";

import { useAppStore } from "../../stores/appStore";
import { invoke } from "@tauri-apps/api/core";

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
    gridTemplateColumns: "1fr 1fr 1fr", // 改为3列布局
    gridTemplateRows: "1fr 1fr 1fr", // 保持3行布局
    gap: "4px", // 稍微增加间距
    padding: "0 8px 8px 8px",
  },
  functionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 2px", // 调整内边距以适应3x3网格
    borderRadius: "6px", // 稍微增加圆角
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "32px", // 增加最小高度以适应3x3网格
    textAlign: "center",
    position: "relative", // 添加相对定位以支持绝对定位的徽章
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
      transform: "translateY(-1px)", // 添加轻微的悬停效果
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
  functionIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "14px", // 增大图标以适应3x3网格
    marginBottom: "2px", // 添加底部间距
  },
  functionText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1px", // 减少间距
    width: "100%",
  },
  functionTitle: {
    fontSize: "8px", // 稍微增大字体以适应3x3网格
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: "center",
    lineHeight: "1.1",
    whiteSpace: "nowrap", // 防止换行
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%", // 占据全宽
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
    borderColor: tokens.colorNeutralStroke3,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3,
      borderColor: tokens.colorNeutralStroke3,
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
  icon: React.ReactElement;
  isRisky: boolean;
  isDisabled?: boolean; // 新增禁用状态
  action: () => Promise<void>;
}

const MiscellaneousCard: React.FC = () => {
  const styles = useStyles();
  const { addNotification } = useAppStore();

  const [executingFunction, setExecutingFunction] = useState<string | null>(null);

  // 对话框状态
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showStopAdbDialog, setShowStopAdbDialog] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [showUsbDialog, setShowUsbDialog] = useState(false);

  // 通用命令执行函数
  const executeCommand = async (
    commandId: string,
    command: () => Promise<any>,
    description: string,
    isRisky: boolean = false
  ) => {
    if (isRisky) {
      addNotification({
        type: "warning",
        title: "风险操作",
        message: `即将执行: ${description}，请确认操作`,
      });
    }

    setExecutingFunction(commandId);
    try {
      const result = await command();
      if (result.success) {
        addNotification({
          type: "success",
          title: "操作成功",
          message: `${description}成功`,
        });
      } else {
        addNotification({
          type: "error",
          title: "操作失败",
          message: result.error || `${description}失败`,
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "操作失败",
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

  const handleRestartApp = async () => {
    setShowRestartDialog(true);
  };

  const confirmRestartApp = async () => {
    setShowRestartDialog(false);
    await executeCommand(
      "restart-app",
      () => invoke("restart_application"),
      "重启应用",
      true
    );
  };

  const handleStopAdb = async () => {
    setShowStopAdbDialog(true);
  };

  const confirmStopAdb = async () => {
    setShowStopAdbDialog(false);
    await executeCommand(
      "stop-adb",
      () => invoke("stop_adb_process"),
      "停止ADB进程",
      true
    );
  };

  const handleRestartAdb = async () => {
    await executeCommand(
      "restart-adb",
      () => invoke("restart_adb_service"),
      "重启ADB服务"
    );
  };

  const handleInstallDriver = async () => {
    setShowDriverDialog(true);
  };

  const confirmInstallDriver = async () => {
    setShowDriverDialog(false);
    await executeCommand(
      "install-driver",
      () => invoke("install_device_driver"),
      "安装设备驱动",
      true
    );
  };

  const handleFixUsb3 = async () => {
    setShowUsbDialog(true);
  };

  const confirmFixUsb3 = async () => {
    setShowUsbDialog(false);
    await executeCommand(
      "fix-usb3",
      () => invoke("fix_usb3_connection"),
      "修复USB 3.0连接",
      true
    );
  };



  const miscFunctions: MiscFunction[] = [
    {
      id: "stop-adb",
      title: "停止ADB进程",
      description: "强制终止当前运行的ADB进程",
      icon: <Stop24Regular />,
      isRisky: true,
      action: handleStopAdb,
    },
    {
      id: "restart-adb",
      title: "重启ADB服务",
      description: "重新启动ADB服务以恢复连接",
      icon: <ArrowClockwise24Regular />,
      isRisky: false,
      action: handleRestartAdb,
    },
    {
      id: "install-driver",
      title: "安装设备驱动",
      description: "自动安装Android设备驱动程序",
      icon: <Shield24Regular />,
      isRisky: true,
      action: handleInstallDriver,
    },
    {
      id: "fix-usb3",
      title: "USB 3.0修复",
      description: "修复USB 3.0连接问题，确保设备正常识别",
      icon: <Wrench24Regular />,
      isRisky: true,
      action: handleFixUsb3,
    },
    {
      id: "open-device-manager",
      title: "打开设备管理器",
      description: "快速启动Windows设备管理器",
      icon: <Desktop24Regular />,
      isRisky: false,
      action: handleOpenDeviceManager,
    },
    {
      id: "restart-app",
      title: "重启应用",
      description: "重新启动HOUT应用程序",
      icon: <ArrowClockwise24Regular />,
      isRisky: true,
      action: handleRestartApp,
    },
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
        <CardHeader className={styles.cardHeader}>
          <Text className={styles.cardTitle}>
            <Wrench24Regular className={styles.titleIcon} />
            杂项控制
          </Text>
        </CardHeader>

        <div className={styles.cardContent}>
          {miscFunctions.map((func) => (
            <div
              key={func.id}
              className={getItemClassName(func)}
              onClick={() => handleFunctionClick(func)}
            >
              <div className={styles.functionInfo}>
                <div className={styles.functionIcon}>
                  {executingFunction === func.id ? (
                    <Spinner size="tiny" />
                  ) : (
                    func.icon
                  )}
                </div>
                <div className={styles.functionText}>
                  <Text className={styles.functionTitle}>{func.title}</Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 重启应用确认对话框 */}
      <Dialog open={showRestartDialog} onOpenChange={(_, data) => setShowRestartDialog(data.open)}>
        <DialogSurface className={styles.warningDialog}>
          <DialogTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Warning24Regular className={styles.warningDialogIcon} />
              确认重启应用
            </div>
          </DialogTitle>
          <DialogContent>
            <DialogBody>
              <div className={styles.warningContent}>
                <Text className={styles.warningText}>
                  您即将重启HOUT应用程序。
                </Text>
                <div className={styles.infoBox}>
                  <Text style={{ fontWeight: "500", marginBottom: "8px" }}>
                    <Info24Regular style={{ marginRight: "6px" }} />
                    注意事项：
                  </Text>
                  <Text className={styles.warningText}>
                    • 当前所有操作将被中断<br/>
                    • 未保存的设置可能丢失<br/>
                    • 设备连接将被重新建立
                  </Text>
                </div>
                <Text className={styles.warningText}>
                  是否确认重启？
                </Text>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => setShowRestartDialog(false)}
            >
              取消
            </Button>
            <Button
              appearance="primary"
              onClick={confirmRestartApp}
              style={{ backgroundColor: "var(--colorPaletteRedBackground1)" }}
            >
              确认重启
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

    </>
  );
};

export default MiscellaneousCard;
