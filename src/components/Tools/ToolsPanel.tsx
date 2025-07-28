import React from "react";
import {
  makeStyles,
  Text,
  Badge,
} from "@fluentui/react-components";
import {
  Wrench24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import BootloaderToolCard from "./BootloaderToolCard";
import SystemToolCard from "./SystemToolCard";
import DeveloperToolCard from "./DeveloperToolCard";

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
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    height: "calc(100% - 80px)",
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

const ToolsPanel: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();


  const connectedDevices = devices.filter(d => d.connected);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Wrench24Regular />
          <Text size={500} weight="semibold">工具箱</Text>
          {selectedDevice && (
            <Badge appearance="filled" color="success">
              {selectedDevice.serial}
            </Badge>
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
          <Wrench24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
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
            从设备信息页面选择要操作的设备
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <BootloaderToolCard device={selectedDevice} />
          <SystemToolCard device={selectedDevice} />
          <DeveloperToolCard device={selectedDevice} />
        </div>
      )}
    </div>
  );
};

export default ToolsPanel;
