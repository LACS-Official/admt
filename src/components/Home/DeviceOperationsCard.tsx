import React, { useState } from "react";
import {
  Card,
  CardHeader,
  Text,
  makeStyles,
  tokens,
  Button,
} from "@fluentui/react-components";
import {
  Screenshot24Regular,
  Video24Regular,
  FolderOpen24Regular,
  Share24Regular,
  DocumentCopy24Regular,
  ArrowDownload24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { deviceService } from "../../services/deviceService";

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
  header: {
    paddingBottom: "8px",
  },
  title: {
    fontSize: "14px",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  cardContent: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr", // 3列布局
    gridTemplateRows: "1fr 1fr", // 2行布局
    gap: "4px", // 减少间距适配紧凑布局
    padding: "0 8px 8px 8px", // 减少内边距
  },
  operationItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px", // 减少内边距
    borderRadius: "4px", // 减少圆角
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
    transition: "all 0.2s ease",
    cursor: "pointer",
    minHeight: "36px", // 减少最小高度
    textAlign: "center",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
    ":disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  operationInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1px", // 减少间距
    flex: 1,
  },
  operationIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: "14px", // 减少图标大小
  },
  operationTitle: {
    fontSize: "8px", // 减少文字大小
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    textAlign: "center",
    lineHeight: "1.0", // 更紧凑的行高
  },
  operationPending: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
  },
});

interface DeviceOperation {
  id: string;
  title: string;
  icon: React.ReactElement;
  action: () => Promise<void>;
  description: string;
}

export const DeviceOperationsCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice } = useDeviceStore();
  const { addNotification } = useAppStore();
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const handleOperation = async (operation: DeviceOperation) => {
    if (!selectedDevice) {
      addNotification({
        type: "warning",
        title: "操作失败",
        message: "请先选择一个设备"
      });
      return;
    }

    if (pendingOperations.has(operation.id)) {
      return; // 防止重复点击
    }

    setPendingOperations(prev => new Set(prev).add(operation.id));

    try {
      await operation.action();
      addNotification({
        type: "success",
        title: "操作成功",
        message: `${operation.title}操作已完成`
      });
    } catch (error) {
      console.error(`${operation.title}操作失败:`, error);
      addNotification({
        type: "error",
        title: "操作失败",
        message: `${operation.title}操作失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operation.id);
        return newSet;
      });
    }
  };

  const operations: DeviceOperation[] = [
    {
      id: "screenshot",
      title: "截屏",
      icon: <Screenshot24Regular className={styles.operationIcon} />,
      description: "截取设备当前屏幕",
      action: async () => {
        if (!selectedDevice) throw new Error("未选择设备");
        await deviceService.takeScreenshot(selectedDevice.serial);
      }
    },
    {
      id: "record",
      title: "录屏",
      icon: <Video24Regular className={styles.operationIcon} />,
      description: "录制设备屏幕视频",
      action: async () => {
        if (!selectedDevice) throw new Error("未选择设备");
        await deviceService.startScreenRecord(selectedDevice.serial);
      }
    },
    {
      id: "files",
      title: "文件管理",
      icon: <FolderOpen24Regular className={styles.operationIcon} />,
      description: "打开设备文件管理器",
      action: async () => {
        if (!selectedDevice) throw new Error("未选择设备");
        await deviceService.openFileManager(selectedDevice.serial);
      }
    },
    {
      id: "share",
      title: "文件传输",
      icon: <Share24Regular className={styles.operationIcon} />,
      description: "在设备和电脑间传输文件",
      action: async () => {
        if (!selectedDevice) throw new Error("未选择设备");
        await deviceService.openFileTransfer(selectedDevice.serial);
      }
    },
    {
      id: "backup",
      title: "应用备份",
      icon: <DocumentCopy24Regular className={styles.operationIcon} />,
      description: "备份设备应用和数据",
      action: async () => {
        if (!selectedDevice) throw new Error("未选择设备");
        await deviceService.backupApps(selectedDevice.serial);
      }
    },
    {
      id: "install",
      title: "应用安装",
      icon: <ArrowDownload24Regular className={styles.operationIcon} />,
      description: "安装APK应用到设备",
      action: async () => {
        if (!selectedDevice) throw new Error("未选择设备");
        await deviceService.installApp(selectedDevice.serial);
      }
    },
  ];

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <Text className={styles.title}>设备操作</Text>
      </CardHeader>
      
      <div className={styles.cardContent}>
        {operations.map((operation) => {
          const isPending = pendingOperations.has(operation.id);
          const isDisabled = !selectedDevice || isPending;
          
          return (
            <div
              key={operation.id}
              className={`${styles.operationItem} ${isPending ? styles.operationPending : ''}`}
              onClick={() => !isDisabled && handleOperation(operation)}
              style={{
                opacity: isDisabled ? 0.6 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer"
              }}
              title={operation.description}
            >
              <div className={styles.operationInfo}>
                {operation.icon}
                <Text className={styles.operationTitle}>
                  {operation.title}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
