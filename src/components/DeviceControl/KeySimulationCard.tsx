import React, { useState, useEffect, useMemo } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Spinner,
  mergeClasses,
  Badge,
  Tooltip,
  tokens,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  Power24Regular,
  Screenshot24Regular,
  LockClosed24Regular,
  Home24Regular,
  ArrowLeft24Regular,
  Apps24Regular,
  WrenchScrewdriver24Regular,
  WeatherSunny24Regular,
  Wifi124Regular,
  Cellular4GRegular,
  Airplane24Regular,
  Star24Regular,
  Star24Filled,
  Speaker224Regular,
  Speaker124Regular,
  SpeakerMute24Regular,
  Play24Regular,
  Next24Regular,
  Previous24Regular,
  Search24Regular,
  PanelLeft24Regular,
  Flashlight24Regular,
  ArrowCounterclockwise24Regular,
  LineHorizontal324Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from "react-i18next";
import { controlService } from "../../services/controlService";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  cardHeader: {
    padding: "8px 16px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  content: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
    color: "var(--colorNeutralForeground3)",
  },
  pinnedGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)", // Denser grid
    gap: "8px",
  },
  pinnedButton: {
    height: "42px",
    display: "flex",
    flexDirection: "row", // Horizontal for pinned to save space
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "10px",
    padding: "0 12px",
    borderRadius: "8px",
  },
  commandButton: {
    height: "auto",
    minHeight: "56px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "6px 2px",
    borderRadius: "6px",
    position: "relative",
  },
  activeButton: {
    backgroundColor: "var(--colorBrandBackground2)",
    border: "1px solid var(--colorBrandStroke2)",
    color: "var(--colorBrandForeground2)",
  } as any,
  commandIcon: {
    fontSize: "18px",
  },
  commandLabel: {
    fontSize: "10px",
    textAlign: "center",
    lineHeight: "1.2",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    minWidth: "16px",
    height: "16px",
    padding: "0 4px",
    fontSize: "9px",
  },
  ssidLabel: {
    fontSize: "9px",
    color: "var(--colorBrandForeground1)",
    marginTop: "1px",
    fontWeight: "600",
    maxWidth: "50px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }
});

interface KeySimulationCardProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const KeySimulationCard: React.FC<KeySimulationCardProps> = ({ device, onAdbRequired }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { deviceService } = useDeviceService();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [wifiEnabled, setWifiEnabled] = useState<boolean>(false);
  const [wifiSsid, setWifiSsid] = useState<string | null>(null);
  const [mobileDataEnabled, setMobileDataEnabled] = useState<boolean>(false);
  const [airplaneModeEnabled, setAirplaneModeEnabled] = useState<boolean>(false);
  const [flashlightEnabled, setFlashlightEnabled] = useState<boolean>(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(false);
  const { setStatusBarMessage } = useAppStore();
  const { controlFavorites, toggleControlFavorite } = useDeviceStore();

  // Polling for network status
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const fetchStatus = async () => {
      if (device?.connected && device.mode === "sys") {
        try {
          const status = await deviceService.getNetworkStatus(device.serial);
          setWifiEnabled(status.wifiEnabled);
          setWifiSsid(status.wifiSsid);
          setMobileDataEnabled(status.mobileDataEnabled);
          setAirplaneModeEnabled(status.airplaneModeEnabled);
          
          // These might need custom logic in deviceService if not already there
          // For now, let's assume they might be added or we'll fetch them manually
          const flashlightRes = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "flashlight_enabled"]);
          setFlashlightEnabled(flashlightRes.output.trim() === "1" || flashlightRes.output.includes("1"));
          
          const rotateRes = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "accelerometer_rotation"]);
          setAutoRotateEnabled(rotateRes.output.trim() === "1");
        } catch (e) {
          // Silent fail for polling
        }
      }
    };

    fetchStatus();
    timer = setInterval(fetchStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(timer);
  }, [device, deviceService]);

  const executeCommand = async (commandId: string, command: string[], description: string) => {
    if (!device) {
      setStatusBarMessage({
        type: "warning",
        message: t('unlock.select_device_first'),
      });
      return;
    }
    if (!device.connected) {
      setStatusBarMessage({
        type: "error",
        message: t('device_control.msg_check_connection'),
      });
      return;
    }

    if (device.mode !== "sys" && device.mode !== "rec") {
      onAdbRequired();
      return;
    }

    setExecutingCommand(commandId);
    try {
      let result;
      
      // Handle special toggles first
      if (commandId === "wifi_toggle") {
        const wifiState = wifiEnabled ? "disable" : "enable";
        result = await deviceService.executeAdbCommand(device.serial, "shell", ["svc", "wifi", wifiState]);
      } else if (commandId === "mobile_data_toggle") {
        const dataState = mobileDataEnabled ? "disable" : "enable";
        result = await deviceService.executeAdbCommand(device.serial, "shell", ["svc", "data", dataState]);
      } else if (commandId === "airplane_mode") {
        const airplaneState = airplaneModeEnabled ? "0" : "1";
        result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "airplane_mode_on", airplaneState]);
      } else if (commandId === "flashlight") {
        const flashState = flashlightEnabled ? "0" : "1";
        // Try multiple methods for flashlight
        result = await deviceService.executeAdbCommand(device.serial, "shell", ["cmd", "flashlight", "set-on", flashState === "1" ? "true" : "false"]);
        if (!result.success) {
           // Fallback for some devices
           result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "flashlight_enabled", flashState]);
        }
      } else if (commandId === "auto_rotate") {
        const rotateState = autoRotateEnabled ? "0" : "1";
        result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "accelerometer_rotation", rotateState]);
      } else {
        // Use controlService for standard commands
        result = await controlService.executeCommand(device.serial, commandId);
      }
      
      if (result.success) {
        setStatusBarMessage({ type: "success", message: description });
        // Optimistic UI update
        if (commandId === "wifi_toggle") setWifiEnabled(!wifiEnabled);
        else if (commandId === "mobile_data_toggle") setMobileDataEnabled(!mobileDataEnabled);
        else if (commandId === "airplane_mode") setAirplaneModeEnabled(!airplaneModeEnabled);
        else if (commandId === "flashlight") setFlashlightEnabled(!flashlightEnabled);
        else if (commandId === "auto_rotate") setAutoRotateEnabled(!autoRotateEnabled);
      } else {
        setStatusBarMessage({ type: "error", message: (result as any).error || t('device_control.msg_unknown_error') });
      }
    } catch (error) {
      setStatusBarMessage({ type: "error", message: String(error) });
    } finally {
      setExecutingCommand(null);
    }
  };

  const allCommands = [
    { id: "screenshot", label: t('device_control.screenshot'), icon: <Screenshot24Regular />, command: [], description: t('device_control.desc_screenshot'), pinned: true },
    { id: "home", label: t('device_control.home'), icon: <Home24Regular />, command: [], description: t('device_control.desc_home'), pinned: true },
    { id: "back", label: t('device_control.back'), icon: <ArrowLeft24Regular />, command: [], description: t('device_control.desc_back'), pinned: true },
    { id: "recent_apps", label: t('device_control.recent_apps'), icon: <Apps24Regular />, command: [], description: t('device_control.desc_recent_apps'), pinned: true },
    { id: "lock_screen", label: t('device_control.lock_screen'), icon: <LockClosed24Regular />, command: [], description: t('device_control.desc_lock_screen') },
    { id: "wake_up", label: t('device_control.wake_up'), icon: <Power24Regular />, command: [], description: t('device_control.desc_wake_up') },
    { id: "volume_up", label: t('device_control.volume_up'), icon: <Speaker224Regular />, command: [], description: t('device_control.desc_volume_up') },
    { id: "volume_down", label: t('device_control.volume_down'), icon: <Speaker124Regular />, command: [], description: t('device_control.desc_volume_down') },
    { id: "volume_mute", label: t('device_control.volume_mute'), icon: <SpeakerMute24Regular />, command: [], description: t('device_control.desc_volume_mute') },
    { id: "media_play_pause", label: t('device_control.media_play_pause'), icon: <Play24Regular />, command: [], description: t('device_control.desc_media_play_pause') },
    { id: "media_next", label: t('device_control.media_next'), icon: <Next24Regular />, command: [], description: t('device_control.desc_media_next') },
    { id: "media_previous", label: t('device_control.media_previous'), icon: <Previous24Regular />, command: [], description: t('device_control.desc_media_previous') },
    { id: "brightness_up", label: t('device_control.brightness_up'), icon: <WeatherSunny24Regular />, command: ["shell", "settings", "put", "system", "screen_brightness", "255"], description: t('device_control.desc_brightness_up') },
    { id: "brightness_down", label: t('device_control.brightness_down'), icon: <WeatherSunny24Regular />, command: ["shell", "settings", "put", "system", "screen_brightness", "50"], description: t('device_control.desc_brightness_down') },
    { id: "wifi_toggle", label: t('device_control.wifi_toggle_on'), icon: <Wifi124Regular />, command: [], description: t('device_control.desc_wifi_on'), status: wifiEnabled, ssid: wifiSsid },
    { id: "mobile_data_toggle", label: t('device_control.mobile_data_on'), icon: <Cellular4GRegular />, command: [], description: t('device_control.desc_mobile_data_on'), status: mobileDataEnabled },
    { id: "airplane_mode", label: t('device_control.airplane_mode_on'), icon: <Airplane24Regular />, command: [], description: t('device_control.desc_airplane_mode_on'), status: airplaneModeEnabled },
    { id: "flashlight", label: t('device_control.flashlight'), icon: <Flashlight24Regular />, command: [], description: t('device_control.desc_flashlight'), status: flashlightEnabled },
    { id: "auto_rotate", label: t('device_control.auto_rotate'), icon: <ArrowCounterclockwise24Regular />, command: [], description: t('device_control.desc_auto_rotate'), status: autoRotateEnabled },
    { id: "menu_key", label: t('device_control.menu_key'), icon: <LineHorizontal324Regular />, command: [], description: t('device_control.desc_menu_key') },
    { id: "search_key", label: t('device_control.search_key'), icon: <Search24Regular />, command: [], description: t('device_control.desc_search_key') },
    { id: "power_button", label: t('device_control.power_button'), icon: <Power24Regular />, command: [], description: t('device_control.desc_power_button') },
    { id: "split_screen", label: t('device_control.split_screen'), icon: <PanelLeft24Regular />, command: [], description: t('device_control.desc_split_screen') },
    { id: "developer_options", label: t('device_control.developer_options'), icon: <WrenchScrewdriver24Regular />, command: ["shell", "am", "start", "-a", "android.settings.APPLICATION_DEVELOPMENT_SETTINGS"], description: t('device_control.desc_developer_options') },
  ];

  const pinnedItems = useMemo(() => allCommands.filter(c => c.pinned), [allCommands]);
  const otherItems = useMemo(() => allCommands.filter(c => !c.pinned), [allCommands]);

  const isDeviceAvailable = device?.connected && device?.mode === "sys";

  const renderButton = (cmd: any, isPinned = false) => (
    <Button
      key={cmd.id}
      appearance={isPinned ? "subtle" : "outline"}
      className={mergeClasses(
        isPinned ? styles.pinnedButton : styles.commandButton,
        cmd.status && styles.activeButton
      )}
      disabled={executingCommand === cmd.id}
      onClick={() => executeCommand(cmd.id, cmd.command, cmd.description)}
    >
      {executingCommand === cmd.id ? (
        <Spinner size="tiny" />
      ) : (
        <div className={styles.commandIcon}>{cmd.icon}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isPinned ? 'flex-start' : 'center', minWidth: 0, flex: 1 }}>
        <Text className={styles.commandLabel} title={cmd.label}>{cmd.label}</Text>
        {cmd.ssid && <Text className={styles.ssidLabel} title={cmd.ssid}>{cmd.ssid}</Text>}
      </div>
      {cmd.status !== undefined && (
        <Badge 
          className={styles.statusBadge} 
          appearance="filled" 
          color={cmd.status ? "success" : "subtle"}
        />
      )}
    </Button>
  );

  const renderButtonWithFavorite = (cmd: any, isPinned = false) => {
    const isFavorited = controlFavorites?.includes(cmd.id);
    
    return (
      <div key={cmd.id} style={{ position: 'relative' }} id={`control-${cmd.id}`}>
        <Button
          appearance={isPinned ? "subtle" : "outline"}
          className={mergeClasses(
            isPinned ? styles.pinnedButton : styles.commandButton,
            cmd.status && styles.activeButton
          )}
          style={{ width: '100%' }}
          disabled={executingCommand === cmd.id}
          onClick={() => executeCommand(cmd.id, cmd.command, cmd.description)}
        >
          {executingCommand === cmd.id ? (
            <Spinner size="tiny" />
          ) : (
            <div className={styles.commandIcon}>{cmd.icon}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isPinned ? 'flex-start' : 'center', minWidth: 0, flex: 1 }}>
            <Text className={styles.commandLabel} title={cmd.label}>{cmd.label}</Text>
            {cmd.ssid && <Text className={styles.ssidLabel} title={cmd.ssid}>{cmd.ssid}</Text>}
          </div>
          {cmd.status !== undefined && (
            <Badge 
              className={styles.statusBadge} 
              appearance="filled" 
              color={cmd.status ? "success" : "subtle"}
            />
          )}
        </Button>
        <Button
          size="small"
          appearance="subtle"
          icon={isFavorited ? <Star24Filled style={{ color: tokens.colorPaletteYellowForeground1, fontSize: '14px' }} /> : <Star24Regular style={{ fontSize: '14px' }} />}
          style={{ position: 'absolute', top: 2, right: 2, minWidth: '24px', height: '24px', padding: 0, zIndex: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleControlFavorite(cmd.id);
          }}
        />
      </div>
    );
  };

  return (
    <Card className={styles.card}>
      <CardHeader
        className={styles.cardHeader}
        image={<Settings24Regular />}
        header={<Text weight="semibold" size={300}>{t('device_control.key_simulation')}</Text>}
      />
      
      <div className={styles.content}>
        {/* Pinned section */}
        <div>
          <div className={styles.sectionTitle}>
            <Star24Regular fontSize={14} />
            <Text size={200} weight="semibold">{t('common.frequent', "常用项目")}</Text>
          </div>
          <div className={styles.pinnedGrid}>
            {pinnedItems.map(cmd => renderButtonWithFavorite(cmd, true))}
          </div>
        </div>

        {/* All Commands grid */}
        <div>
          <div className={styles.sectionTitle}>
            <Apps24Regular fontSize={14} />
            <Text size={200} weight="semibold">{t('common.all_functions', "所有功能")}</Text>
          </div>
          <div className={styles.commandGrid}>
            {otherItems.map(cmd => renderButtonWithFavorite(cmd))}
          </div>
        </div>

        {!isDeviceAvailable && (
          <div style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--colorNeutralForeground3)', padding: '8px' }}>
            <Text size={200}>{t('device_control.device_unavailable')}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KeySimulationCard;