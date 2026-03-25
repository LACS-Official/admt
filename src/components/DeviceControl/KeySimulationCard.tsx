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
import { useConfigStore } from "../../stores/configStore";

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
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
  },
  pinnedButton: {
    height: "42px",
    display: "flex",
    flexDirection: "row",
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

// Icon mapping for command IDs
const ICON_MAP: Record<string, React.ReactNode> = {
  screenshot: <Screenshot24Regular />,
  home: <Home24Regular />,
  back: <ArrowLeft24Regular />,
  recent_apps: <Apps24Regular />,
  volume_up: <Speaker224Regular />,
  volume_down: <Speaker124Regular />,
  volume_mute: <SpeakerMute24Regular />,
  media_play_pause: <Play24Regular />,
  media_next: <Next24Regular />,
  media_previous: <Previous24Regular />,
  menu: <LineHorizontal324Regular />,
  search: <Search24Regular />,
  power_button: <Power24Regular />,
  split_screen: <PanelLeft24Regular />,
  brightness_max: <WeatherSunny24Regular />,
  brightness_low: <WeatherSunny24Regular />,
  developer_options: <WrenchScrewdriver24Regular />,
  wifi_on: <Wifi124Regular />,
  wifi_off: <Wifi124Regular />,
  data_on: <Cellular4GRegular />,
  data_off: <Cellular4GRegular />,
  airplane_mode_on: <Airplane24Regular />,
  airplane_mode_off: <Airplane24Regular />,
  flashlight_on: <Flashlight24Regular />,
  flashlight_off: <Flashlight24Regular />,
  auto_rotate_on: <ArrowCounterclockwise24Regular />,
  auto_rotate_off: <ArrowCounterclockwise24Regular />,
};

interface KeySimulationCardProps {
  device: DeviceInfo | null;
  onAdbRequired: () => void;
}

const KeySimulationCard: React.FC<KeySimulationCardProps> = ({ device, onAdbRequired }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { deviceService } = useDeviceService();
  const { adbCommands } = useConfigStore();
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
    timer = setInterval(fetchStatus, 5000); 
    return () => clearInterval(timer);
  }, [device, deviceService]);

  const executeCommand = async (commandId: string, description: string) => {
    if (!device) {
      setStatusBarMessage({ type: "warning", message: t('unlock.select_device_first') });
      return;
    }
    if (!device.connected) {
      setStatusBarMessage({ type: "error", message: t('device_control.msg_check_connection') });
      return;
    }

    if (device.mode !== "sys" && device.mode !== "rec") {
      onAdbRequired();
      return;
    }

    // Handle Toggles
    let finalCommandId = commandId;
    if (commandId === "wifi_toggle") finalCommandId = wifiEnabled ? "wifi_off" : "wifi_on";
    else if (commandId === "mobile_data_toggle") finalCommandId = mobileDataEnabled ? "data_off" : "data_on";
    else if (commandId === "airplane_toggle") finalCommandId = airplaneModeEnabled ? "airplane_mode_off" : "airplane_mode_on";
    else if (commandId === "flashlight_toggle") finalCommandId = flashlightEnabled ? "flashlight_off" : "flashlight_on";
    else if (commandId === "auto_rotate_toggle") finalCommandId = autoRotateEnabled ? "auto_rotate_off" : "auto_rotate_on";

    setExecutingCommand(commandId);
    try {
      const result = await controlService.executeCommand(device.serial, finalCommandId);
      
      if (result.success) {
        setStatusBarMessage({ type: "success", message: description });
        // Optimistic UI updates are handled by polling, but we can do them here too for snappiness
      } else {
        setStatusBarMessage({ type: "error", message: (result as any).error || t('device_control.msg_unknown_error') });
      }
    } catch (error) {
      setStatusBarMessage({ type: "error", message: String(error) });
    } finally {
      setExecutingCommand(null);
    }
  };

  const allCommands = useMemo(() => {
    if (!adbCommands) return [];

    // Derive commands from key_simulation and quick_settings categories
    const categories = adbCommands.categories.filter(c => 
      c.id === "key_simulation" || c.id === "quick_settings"
    );

    const commands = categories.flatMap(cat => cat.commands.map(cmd => ({
      ...cmd,
      icon: ICON_MAP[cmd.id] || <Settings24Regular />,
      description: cmd.description || "",
      pinned: ["screenshot", "home", "back", "recent_apps"].includes(cmd.id),
      // Map status for toggles
      status: cmd.id.startsWith("wifi") ? wifiEnabled :
              cmd.id.startsWith("data_") ? mobileDataEnabled :
              cmd.id.startsWith("airplane") ? airplaneModeEnabled :
              cmd.id.startsWith("flashlight") ? flashlightEnabled :
              cmd.id.startsWith("auto_rotate") ? autoRotateEnabled : undefined,
      ssid: cmd.id.startsWith("wifi") ? wifiSsid : undefined
    })));

    // For the UI, we still want the "Toggle" entries which are virtual
    const toggles = [
      { id: "wifi_toggle", label: t('device_control.wifi_toggle_on'), icon: <Wifi124Regular />, description: t('device_control.desc_wifi_on'), status: wifiEnabled, ssid: wifiSsid },
      { id: "mobile_data_toggle", label: t('device_control.mobile_data_on'), icon: <Cellular4GRegular />, description: t('device_control.desc_mobile_data_on'), status: mobileDataEnabled },
      { id: "airplane_toggle", label: t('device_control.airplane_mode_on'), icon: <Airplane24Regular />, description: t('device_control.desc_airplane_mode_on'), status: airplaneModeEnabled },
      { id: "flashlight_toggle", label: t('device_control.flashlight'), icon: <Flashlight24Regular />, description: t('device_control.desc_flashlight'), status: flashlightEnabled },
      { id: "auto_rotate_toggle", label: t('device_control.auto_rotate'), icon: <ArrowCounterclockwise24Regular />, description: t('device_control.desc_auto_rotate'), status: autoRotateEnabled },
    ];

    // Remove the individual on/off commands from the main grid if we use toggles
    const filteredCommands = commands.filter(c => 
      !["wifi_on", "wifi_off", "data_on", "data_off", "airplane_mode_on", "airplane_mode_off", "flashlight_on", "flashlight_off", "auto_rotate_on", "auto_rotate_off"].includes(c.id)
    );

    return [...filteredCommands, ...toggles];
  }, [adbCommands, wifiEnabled, wifiSsid, mobileDataEnabled, airplaneModeEnabled, flashlightEnabled, autoRotateEnabled, t]);

  const pinnedItems = useMemo(() => allCommands.filter(c => (c as any).pinned), [allCommands]);
  const otherItems = useMemo(() => allCommands.filter(c => !(c as any).pinned), [allCommands]);

  const isDeviceAvailable = device?.connected && device?.mode === "sys";

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
          onClick={() => executeCommand(cmd.id, cmd.description)}
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
        {/* All Commands grid */}
        <div>
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
