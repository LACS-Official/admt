import React, { useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Power24Regular,
  UsbStick24Regular,
  Wrench24Regular,
  Shield24Regular,
  Search24Regular,
  Warning24Regular,
  Checkmark24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  card: {
    height: "100%",
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
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr 1fr", // 3行布局，每行固定高度
    gap: "3px",
    padding: "0 8px 8px 8px",
  },
  functionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3px",
    borderRadius: "4px",
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "30px", // 进一步减少高度
    textAlign: "center",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
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
    fontSize: "10px", // 减少图标大小
  },
  functionText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  functionTitle: {
    fontSize: "7px", // 进一步减少字体大小
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: "center",
    lineHeight: "1.0",
    whiteSpace: "nowrap", // 防止换行
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  functionDescription: {
    display: "none", // 隐藏描述以节省空间
  },
  actionButton: {
    minWidth: "60px",
  },
  warningItem: {
    borderColor: tokens.colorPaletteYellowBorder2,
    backgroundColor: tokens.colorPaletteYellowBackground1,
    ":hover": {
      backgroundColor: tokens.colorPaletteYellowBackground2,
      borderColor: tokens.colorPaletteYellowBorder1,
    },
  },
  pendingItem: {
    borderColor: tokens.colorPaletteYellowBorder1,
    backgroundColor: tokens.colorPaletteYellowBackground2,
  },
});

interface MiscFunction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  isRisky: boolean;
  action: () => Promise<void>;
}

const MiscellaneousCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { deviceService } = useDeviceService();
  const { addNotification } = useAppStore();
  
  const [executingFunction, setExecutingFunction] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [confirmationTimeout, setConfirmationTimeout] = useState<number | null>(null);

  const miscFunctions: MiscFunction[] = [
    {
      id: "stop-adb",
      title: "停止ADB进程",
      description: "终止当前运行的ADB服务进程",
      icon: <Power24Regular />,
      isRisky: true,
      action: async () => {
        const result = await deviceService.stopAdbServer();
        if (result.success) {
          addNotification({
            type: "success",
            title: "ADB进程已停止",
            message: "ADB服务进程已成功终止",
          });
        } else {
          throw new Error(result.error || "停止ADB进程失败");
        }
      },
    },
    {
      id: "install-driver",
      title: "安装设备驱动",
      description: "自动检测并安装Android设备驱动程序",
      icon: <UsbStick24Regular />,
      isRisky: false,
      action: async () => {
        const result = await deviceService.installDeviceDriver();
        if (result.success) {
          addNotification({
            type: "success",
            title: "驱动安装完成",
            message: "Android设备驱动程序已成功安装",
          });
        } else {
          throw new Error(result.error || "安装设备驱动失败");
        }
      },
    },
    {
      id: "usb3-fix",
      title: "USB 3.0修复",
      description: "修复USB 3.0连接问题，优化设备连接稳定性",
      icon: <Wrench24Regular />,
      isRisky: false,
      action: async () => {
        const result = await deviceService.fixUsb3Connection();
        if (result.success) {
          addNotification({
            type: "success",
            title: "USB连接已优化",
            message: "USB 3.0连接问题已修复",
          });
        } else {
          throw new Error(result.error || "USB 3.0修复失败");
        }
      },
    },
    {
      id: "restart-adb",
      title: "重启ADB服务",
      description: "重新启动ADB服务以解决连接问题",
      icon: <Settings24Regular />,
      isRisky: false,
      action: async () => {
        const result = await deviceService.restartAdbServer();
        if (result.success) {
          addNotification({
            type: "success",
            title: "ADB服务已重启",
            message: "ADB服务已成功重新启动",
          });
        } else {
          throw new Error(result.error || "重启ADB服务失败");
        }
      },
    },
    {
      id: "clear-auth",
      title: "清除ADB授权",
      description: "清除设备上的ADB调试授权记录",
      icon: <Shield24Regular />,
      isRisky: true,
      action: async () => {
        if (!selectedDevice) {
          throw new Error("请先选择一个设备");
        }
        const result = await deviceService.clearAdbAuthorization(selectedDevice.serial);
        if (result.success) {
          addNotification({
            type: "success",
            title: "授权记录已清除",
            message: "设备ADB调试授权记录已清除",
          });
        } else {
          throw new Error(result.error || "清除ADB授权失败");
        }
      },
    },
    {
      id: "connection-diagnosis",
      title: "设备连接诊断",
      description: "检测和诊断设备连接状态",
      icon: <Search24Regular />,
      isRisky: false,
      action: async () => {
        if (!selectedDevice) {
          throw new Error("请先选择一个设备");
        }
        const result = await deviceService.diagnoseDeviceConnection(selectedDevice.serial);
        if (result.success) {
          addNotification({
            type: "info",
            title: "诊断完成",
            message: result.output || "设备连接状态检测完成，连接正常",
          });
        } else {
          throw new Error(result.error || "设备连接诊断失败");
        }
      },
    },
  ];

  const handleFunctionClick = async (func: MiscFunction) => {
    if (executingFunction) return;

    // 如果是有风险的操作且需要确认
    if (func.isRisky) {
      // 如果当前有待确认的操作且是同一个操作，执行操作
      if (pendingConfirmation && pendingConfirmation === func.id) {
        await executeFunction(func);
        return;
      }

      // 第一次点击：设置待确认状态
      setPendingConfirmation(func.id);

      // 清除之前的超时
      if (confirmationTimeout) {
        clearTimeout(confirmationTimeout);
      }

      // 设置5秒后自动清除确认状态
      const timeout = setTimeout(() => {
        setPendingConfirmation(null);
        setConfirmationTimeout(null);
      }, 5000);

      setConfirmationTimeout(timeout);

      addNotification({
        type: "warning",
        title: "确认操作",
        message: `请再次点击"${func.title}"确认执行操作`,
        duration: 5000,
      });
    } else {
      // 非风险操作直接执行
      await executeFunction(func);
    }
  };

  const executeFunction = async (func: MiscFunction) => {
    setExecutingFunction(func.id);
    setPendingConfirmation(null);
    
    if (confirmationTimeout) {
      clearTimeout(confirmationTimeout);
      setConfirmationTimeout(null);
    }

    try {
      await func.action();
    } catch (error) {
      addNotification({
        type: "error",
        title: "操作失败",
        message: `${func.title}执行失败: ${error}`,
      });
    } finally {
      setExecutingFunction(null);
    }
  };

  const getItemClassName = (func: MiscFunction) => {
    let className = styles.functionItem;
    if (func.isRisky && func.id === "clear-auth" && !selectedDevice) {
      className += ` ${styles.warningItem}`;
    }
    if (pendingConfirmation === func.id) {
      className += ` ${styles.pendingItem}`;
    }
    return className;
  };



  return (
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <Text className={styles.cardTitle}>
          <Wrench24Regular className={styles.titleIcon} />
          杂项功能
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
                ) : pendingConfirmation === func.id ? (
                  <Warning24Regular />
                ) : (
                  func.icon
                )}
              </div>
              <div className={styles.functionText}>
                <Text className={styles.functionTitle}>{func.title}</Text>
              </div>
              {pendingConfirmation === func.id && (
                <Badge appearance="filled" color="warning" size="small">
                  待确认
                </Badge>
              )}
              {func.isRisky && pendingConfirmation !== func.id && (
                <Badge appearance="outline" color="warning" size="small">
                  风险
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MiscellaneousCard;
