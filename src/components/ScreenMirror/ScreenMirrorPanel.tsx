import React, { useEffect, useRef, useState }  from 'react';
import {
  makeStyles,
  Text,
  Badge,
  Button,
  Spinner,
} from "@fluentui/react-components";
import {
  Desktop24Regular,
  Stop24Regular,
  Phone24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { ScreenMirrorDevice } from "../../types/screenMirror";
import ScreenMirrorService from "../../services/screenMirrorService";
import DeviceSelectionCard from "./DeviceSelectionCard";
import MirrorDisplayCard from "./MirrorDisplayCard";
import SettingsCard from "./SettingsCard";

const useStyles = makeStyles({
  container: {
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
    gridTemplateColumns: "300px 1fr",
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
  statusBadge: {
    textTransform: "capitalize",
  },
});

const ScreenMirrorPanel: React.FC = () => {
  const styles = useStyles();
  const { devices } = useDeviceStore();
  const {
    currentSession,
    selectedDevice: mirrorDevice,
    config,
    isLoading,
    error,
    showSettings,
    setLoading,
    setError,
    selectDevice,
    setCurrentSession,
    toggleSettings,
    getCurrentStatus,
    canStartMirroring,
    isStreaming,
  } = useScreenMirrorStore();

  const [supportedDevices, setSupportedDevices] = useState<ScreenMirrorDevice[]>([]);
  const lastCheckedDevicesRef = useRef<string>('');
  const isCheckingRef = useRef<boolean>(false);

  const connectedDevices = devices.filter(d => d.connected);

  // 检查设备投屏支持
  useEffect(() => {
    const deviceSerialsKey = connectedDevices.map(d => d.serial).sort().join(',');

    // 防止重复调用
    if (deviceSerialsKey === lastCheckedDevicesRef.current || isCheckingRef.current) {
      return;
    }

    const checkDeviceSupport = async () => {
      if (connectedDevices.length === 0) {
        setSupportedDevices([]);
        lastCheckedDevicesRef.current = '';
        return;
      }

      isCheckingRef.current = true;
      setLoading(true);

      try {
        const deviceSerials = connectedDevices.map(d => d.serial);
        const supported = await ScreenMirrorService.checkMultipleDevicesSupport(deviceSerials);
        setSupportedDevices(supported);
        lastCheckedDevicesRef.current = deviceSerialsKey;

        // 如果当前选中的设备不支持投屏，清除选择
        if (mirrorDevice && !supported.find(d => d.serial === mirrorDevice.serial)) {
          selectDevice(null);
        }
      } catch (error) {
        console.error("Failed to check device support:", error);
        setError("检查设备支持时出错");
      } finally {
        setLoading(false);
        isCheckingRef.current = false;
      }
    };

    checkDeviceSupport();
  }, [connectedDevices.length]); // 只依赖设备数量

  const handleStartMirror = async (device: ScreenMirrorDevice) => {
    if (!device || !canStartMirroring()) return;

    setLoading(true);
    setError(null);

    try {
      const session = await ScreenMirrorService.startMirror(device.serial, config);
      setCurrentSession(session);
      console.log("Screen mirror started:", session);
    } catch (error) {
      console.error("Failed to start screen mirror:", error);
      setError(`启动投屏失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理设备选择，自动开始投屏
  const handleDeviceSelect = async (device: ScreenMirrorDevice | null) => {
    selectDevice(device);
    
    // 如果选择了设备且当前没有投屏会话，自动开始投屏
    if (device && !currentSession) {
      await handleStartMirror(device);
    }
  };

  const handleStopMirror = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      await ScreenMirrorService.stopMirror(currentSession.id);
      setCurrentSession(null);
      console.log("Screen mirror stopped");
    } catch (error) {
      console.error("Failed to stop screen mirror:", error);
      setError(`停止投屏失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "disconnected": return "未连接";
      case "connecting": return "连接中";
      case "connected": return "已连接";
      case "streaming": return "投屏中";
      case "paused": return "已暂停";
      case "error": return "错误";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "streaming": return "success";
      case "connected": return "important";
      case "connecting": return "warning";
      case "error": return "danger";
      default: return "subtle";
    }
  };

  const currentStatus = getCurrentStatus();

  return (
    <div className={styles.container}>
      <div className={styles.header}>

        
        <div className={styles.headerRight}>
          
          {isStreaming() && (
            <Button
              appearance="primary"
              icon={isLoading ? <Spinner size="tiny" /> : <Stop24Regular />}
              onClick={handleStopMirror}
              disabled={isLoading}
            >
              停止投屏
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "16px" }}>
          <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>
            {error}
          </Text>
        </div>
      )}

      {connectedDevices.length === 0 ? (
        <div className={styles.noDevice}>
          <Phone24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
          <Text size={400}>未检测到设备</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            请确保设备已连接并启用USB调试
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.leftPanel}>
            <DeviceSelectionCard 
              devices={supportedDevices}
              selectedDevice={mirrorDevice}
              onSelectDevice={handleDeviceSelect}
              isLoading={isLoading}
            />
          </div>
          
          <div className={styles.rightPanel}>
            <SettingsCard />
            
            {isStreaming() && (
              <>
                <MirrorDisplayCard session={currentSession!} />
              </>
            )}
            

          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenMirrorPanel;
