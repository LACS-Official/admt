import React from "react";
import {
  makeStyles,
  Text,
  Badge,
} from "@fluentui/react-components";
import {
  Power24Regular,
  Phone24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import RebootControlCard from "./RebootControlCard";
import SystemInfoCard from "./SystemInfoCard";
import QuickActionsCard from "./QuickActionsCard";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
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
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto auto",
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  fullWidth: {
    gridColumn: "1 / -1",
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
});

const DeviceControlPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();


  const connectedDevices = devices.filter(d => d.connected);

  const getDeviceModeText = (mode: string) => {
    switch (mode) {
      case "sys":
        return "系统模式";
      case "rec":
        return "Recovery模式";
      case "fastboot":
        return "Fastboot模式";
      case "fastbootd":
        return "Fastbootd模式";
      case "sideload":
        return "Sideload模式";
      case "unauthorized":
        return "未授权";
      default:
        return mode;
    }
  };

  const getDeviceModeColor = (mode: string) => {
    switch (mode) {
      case "sys":
        return "success";
      case "rec":
        return "warning";
      case "fastboot":
      case "fastbootd":
        return "important";
      case "unauthorized":
        return "danger";
      default:
        return "subtle";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Power24Regular />
          <Text size={500} weight="semibold">设备控制</Text>
          {selectedDevice && (
            <>
              <Badge appearance="filled" color="success">
                {selectedDevice.serial}
              </Badge>
              <Badge 
                appearance="filled" 
                color={getDeviceModeColor(selectedDevice.mode)}
              >
                {getDeviceModeText(selectedDevice.mode)}
              </Badge>
            </>
          )}
        </div>
        
        <div className={styles.headerRight}>
          <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
            {connectedDevices.length} 台设备已连接
          </Text>
        </div>
      </div>

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Phone24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>未检测到设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备已连接并启用USB调试
          </Text>
        </div>
      ) : !selectedDevice ? (
        <div className={styles.noDevice}>
          <Settings24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>请选择一个设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            从设备信息页面选择要控制的设备
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <RebootControlCard device={selectedDevice} />
          <SystemInfoCard device={selectedDevice} />
          <div className={styles.fullWidth}>
            <QuickActionsCard device={selectedDevice} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceControlPanel;
