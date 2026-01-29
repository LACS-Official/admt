import React, { useEffect, useRef, useState }  from 'react';
import {
  makeStyles,
  Text,
} from "@fluentui/react-components";
import {
  Phone24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { ScreenMirrorDevice } from "../../types/screenMirror";
import ScreenMirrorService from "../../services/screenMirrorService";
import MirrorDisplayCard from "./MirrorDisplayCard";
import MirrorControlCard from "./MirrorControlCard";
import { useTranslation } from "react-i18next";

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
  sessionsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  },
});

const ScreenMirrorPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { devices } = useDeviceStore();
  const {
    activeSessions,
    selectedDevice: mirrorDevice,
    config,
    isLoading,
    error,
    setLoading,
    setError,
    selectDevice,
    addActiveSession,
    removeActiveSession,
    canStartMirroring,
    isDeviceStreaming,
  } = useScreenMirrorStore();

  const [supportedDevices, setSupportedDevices] = useState<ScreenMirrorDevice[]>([]);
  const lastCheckedDevicesRef = useRef<string>('');
  const isCheckingRef = useRef<boolean>(false);

  const connectedDevices = devices.filter(d => d.connected);

  // 获取正在投屏的设备序列号列表
  const streamingDevices = activeSessions
    .filter(session => isDeviceStreaming(session.deviceSerial))
    .map(session => session.deviceSerial);

  // 简化设备检测 - 直接将所有连接的设备视为支持投屏
  useEffect(() => {
    const deviceSerialsKey = connectedDevices.map(d => d.serial).sort().join(',');

    // 防止重复调用
    if (deviceSerialsKey === lastCheckedDevicesRef.current || isCheckingRef.current) {
      return;
    }

    const prepareDevicesForMirroring = async () => {
      if (connectedDevices.length === 0) {
        setSupportedDevices([]);
        lastCheckedDevicesRef.current = '';
        return;
      }

      isCheckingRef.current = true;
      setLoading(true);

      try {
        // 简化处理：直接将所有连接的设备转换为支持投屏的设备
        const supported = connectedDevices.map(device => ({
          serial: device.serial,
          name: device.properties?.marketName || device.properties?.productName || t('mirror.default_dev_name', { serial: device.serial.substring(0, 8) }),
          model: device.properties?.model || t('mirror.unknown_model'),
          resolution: "1920x1080", // 默认分辨率
          density: 480, // 默认密度
          orientation: "portrait", // 默认方向
          isSupported: true, // 所有设备都支持投屏
          supportedCodecs: ["h264", "h265"] // 默认支持的编解码器
        }));
        
        setSupportedDevices(supported as ScreenMirrorDevice[]);
        lastCheckedDevicesRef.current = deviceSerialsKey;

        // 如果当前选中的设备不在支持列表中，清除选择
        if (mirrorDevice && !supported.find(d => d.serial === mirrorDevice.serial)) {
          selectDevice(null);
        }
      } catch (error) {
        console.error("Failed to prepare devices for mirroring:", error);
        setError(t('mirror.error_preparing'));
      } finally {
        setLoading(false);
        isCheckingRef.current = false;
      }
    };

    prepareDevicesForMirroring();
  }, [connectedDevices.length]); // 只依赖设备数量

  const handleStartMirror = async (device: ScreenMirrorDevice) => {
    if (!device || !canStartMirroring(device.serial)) return;

    // 检查设备是否已经有正在投屏的会话
    const existingSession = activeSessions.find(s => s.deviceSerial === device.serial && s.status === 'streaming');
    if (existingSession) {
      setError(t('mirror.device_already_mirroring', { name: device.name || device.serial }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await ScreenMirrorService.startMirror(device.serial, config);
      addActiveSession(session);
      console.log("Screen mirror started:", session);
    } catch (error) {
      console.error("Failed to start screen mirror:", error);
      setError(t('mirror.start_failed', { error }));
    } finally {
      setLoading(false);
    }
  };

  // 处理设备选择，自动开始投屏
  const handleDeviceSelect = async (device: ScreenMirrorDevice | null) => {
    // 如果设备正在投屏，则不执行任何操作
    if (device && isDeviceStreaming(device.serial)) {
      setError(t('mirror.device_already_mirroring', { name: device.name || device.serial }));
      return;
    }
    
    selectDevice(device);
    
    // 如果选择了设备且当前没有投屏会话，自动开始投屏
    if (device && !isDeviceStreaming(device.serial)) {
      await handleStartMirror(device);
    }
  };

  // 处理设备操作（开始或停止投屏）
  const handleDeviceAction = async (device: ScreenMirrorDevice) => {
    if (isDeviceStreaming(device.serial)) {
      // 如果设备正在投屏，则停止投屏
      const session = activeSessions.find(s => s.deviceSerial === device.serial);
      if (session) {
        await handleStopMirror(session.id);
      }
    } else {
      // 否则开始投屏
      // 检查设备是否已经有正在投屏的会话
      const existingSession = activeSessions.find(s => s.deviceSerial === device.serial && s.status === 'streaming');
      if (existingSession) {
        setError(t('mirror.device_already_mirroring', { name: device.name || device.serial }));
        return;
      }
      await handleStartMirror(device);
    }
  };

  const handleStopMirror = async (sessionId: string) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    setLoading(true);
    try {
      await ScreenMirrorService.stopMirror(session.id);
      removeActiveSession(session.id);
      console.log("Screen mirror stopped");
    } catch (error) {
      console.error("Failed to stop screen mirror:", error);
      setError(t('mirror.stop_failed', { error }));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        
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
          <Text size={400}>{t('mirror.no_device_title')}</Text>
          <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
            {t('mirror.no_device_hint')}
          </Text>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.fullWidth}>
             <MirrorControlCard
              devices={supportedDevices}
              selectedDevice={mirrorDevice}
              onSelectDevice={handleDeviceSelect}
              onDeviceAction={handleDeviceAction}
              isLoading={isLoading}
              streamingDevices={streamingDevices}
            />
          </div>
            
            {activeSessions.length > 0 && (
              <div className={styles.sessionsContainer}>
                {activeSessions.map(session => (
                  <MirrorDisplayCard 
                    key={session.id} 
                    session={session} 
                    onStopMirror={() => handleStopMirror(session.id)}
                  />
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ScreenMirrorPanel;
