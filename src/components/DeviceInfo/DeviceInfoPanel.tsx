import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Button,
  Badge,
  Spinner,
  Field,
  Select,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  ArrowClockwise24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import DeviceCoreInfoCard from "./DeviceCoreInfoCard";
import SecurityStatusCard from "./SecurityStatusCard";
import DeviceDetailsModal from "./DeviceDetailsModal";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

const useStyles = makeStyles({
  container: {
    padding: "12px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    minHeight: "40px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "16px",
    height: "calc(100% - 80px)",
    padding: "0 4px",
    overflow: "auto",
    scrollbarWidth: "thin",
  },
  contentMedium: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto auto",
    gap: "12px",
  },
  contentSmall: {
    gridTemplateColumns: "1fr",
    gridTemplateRows: "auto auto",
    gap: "12px",
  },
  coreInfoCard: {
    // 核心信息卡片
  },
  securityCard: {
    // 安全状态卡片
  },
  noDevice: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    height: "300px",
    textAlign: "center",
  },
  deviceSelector: {
    minWidth: "200px",
  },
});

const DeviceInfoPanel: React.FC = () => {
  const styles = useStyles();
  const {
    devices,
    selectedDevice,
    selectDevice,
    isScanning
  } = useDeviceStore();
  const { refreshDeviceInfo } = useDeviceService();
  const { addNotification } = useAppStore();
  const { layoutSize } = useResponsiveLayout();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 注意：设备扫描现在在MainContent中全局启动，这里不再需要重复启动

  const connectedDevices = devices.filter(d => d.connected);

  const handleDeviceSelect = (serial: string) => {
    const device = devices.find(d => d.serial === serial);
    selectDevice(device);
  };

  const handleRefresh = async () => {
    if (selectedDevice) {
      await refreshDeviceInfo(selectedDevice.serial);
    }
  };

  const handleShowDetails = () => {
    setShowDetailsModal(true);
  };

  const handleCopyInfo = async () => {
    if (!selectedDevice) return;

    try {
      const deviceInfo = [
        `设备名称: ${selectedDevice.properties?.marketName || selectedDevice.properties?.model || '未知'}`,
        `品牌: ${selectedDevice.properties?.brand || '未知'}`,
        `型号: ${selectedDevice.properties?.model || '未知'}`,
        `序列号: ${selectedDevice.serial}`,
        `Android版本: ${selectedDevice.properties?.androidVersion || '未知'}`,
        `设备模式: ${selectedDevice.mode}`,
      ];

      if (selectedDevice.properties?.batteryLevel !== undefined) {
        deviceInfo.push(`电池电量: ${selectedDevice.properties.batteryLevel}%`);
      }

      await navigator.clipboard.writeText(deviceInfo.join('\n'));
      addNotification({
        type: "success",
        title: "复制成功",
        message: "设备信息已复制到剪贴板",
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "复制失败",
        message: "无法访问剪贴板",
      });
    }
  };



  const getDeviceModeText = (mode: string) => {
    switch (mode) {
      case "sys":
        return "系统";
      case "rec":
        return "Recovery";
      case "fastboot":
        return "Fastboot";
      case "fastbootd":
        return "Fastbootd";
      case "sideload":
        return "Sideload";
      case "unauthorized":
        return "未授权";
      default:
        return mode;
    }
  };

  // 响应式布局逻辑
  const getContentClassName = () => {
    switch (layoutSize) {
      case 'large':
      case 'xlarge':
        return styles.content;
      case 'medium':
        return `${styles.content} ${styles.contentMedium}`;
      case 'small':
      case 'xsmall':
        return `${styles.content} ${styles.contentSmall}`;
      default:
        return styles.content;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Phone24Regular />
          <Text size={500} weight="semibold">设备信息</Text>
          <Badge 
            appearance="filled" 
            color={connectedDevices.length > 0 ? "success" : "subtle"}
          >
            {connectedDevices.length} 台设备
          </Badge>
        </div>
        
        <div className={styles.headerRight}>
          {connectedDevices.length > 0 && (
            <Field label="选择设备:">
              <Select
                className={styles.deviceSelector}
                value={selectedDevice?.serial || ""}
                onChange={(_, data) => handleDeviceSelect(data.value)}
              >
                <option value="">请选择设备</option>
                {connectedDevices.map((device) => (
                  <option key={device.serial} value={device.serial}>
                    {device.serial} ({getDeviceModeText(device.mode)})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          
          <Button
            appearance="subtle"
            icon={isScanning ? <Spinner size="small" /> : <ArrowClockwise24Regular />}
            onClick={handleRefresh}
            disabled={!selectedDevice || isScanning}
          >
            刷新
          </Button>
        </div>
      </div>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Info24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>未检测到设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备已连接并启用USB调试
          </Text>
          {isScanning && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spinner size="small" />
              <Text size={300}>正在扫描设备...</Text>
            </div>
          )}
        </div>
      ) : selectedDevice ? (
        <>
          <div className={getContentClassName()}>
            <div className={styles.coreInfoCard}>
              <DeviceCoreInfoCard
                device={selectedDevice}
                onShowDetails={handleShowDetails}
                onCopyInfo={handleCopyInfo}
              />
            </div>
            <div className={styles.securityCard}>
              <SecurityStatusCard device={selectedDevice} />
            </div>
          </div>

          {/* 详细信息模态框 */}
          <DeviceDetailsModal
            device={selectedDevice}
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
          />
        </>
      ) : (
        <div className={styles.noDevice}>
          <Phone24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>请选择一个设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            从上方下拉菜单中选择要查看的设备
          </Text>
        </div>
      )}
    </div>
  );
};

export default DeviceInfoPanel;
