import React, { useState, useEffect, useCallback } from "react";
import {
  makeStyles,
  mergeClasses,
  Text,
  Button,
  Input,
  Switch,
} from "@fluentui/react-components";
import {
  Desktop20Regular,
  Settings20Regular,
  Phone20Regular,
  BatteryCharge20Regular,
  Timer20Regular,
  ArrowReset20Regular,
  WeatherSunny20Regular,
  Wifi120Regular,
  Cellular4G20Regular,
  Airplane20Regular,
  ArrowCounterclockwise20Regular,
  WrenchScrewdriver20Regular,
  Speaker220Regular,
  Speaker120Regular,
  SpeakerMute20Regular,
  Play20Regular,
  Next20Regular,
  Previous20Regular,
  Power20Regular,
  LockClosed20Regular,
  Home20Regular,
  ArrowLeft20Regular,
  Apps20Regular,
  LineHorizontal320Regular,
  Info20Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { controlService } from "../../services/controlService";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    padding: "16px 20px",
    gap: "14px",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
  },
  // Top Header & Segmented Tabs
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    flexShrink: 0,
  },
  titleArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.01em",
  },
  segmentedTabs: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "3px",
    borderRadius: "10px",
    gap: "2px",
  },
  tabItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    userSelect: "none",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.15s ease",
    "&:hover": {
      color: "var(--colorNeutralForeground1)",
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  tabItemActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "#0071e3",
    fontWeight: "600",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  },

  // Main Scrollable Body
  scrollBody: {
    flex: "1 1 0",
    minHeight: 0,
    overflowY: "auto",
    paddingRight: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  // Bento Card Style
  bentoCard: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    padding: "16px 18px",
    gap: "14px",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    "&:hover": {
      borderColor: "var(--colorNeutralStroke1)",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  cardTitle: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  cardSubtitle: {
    fontSize: "11.5px",
    color: "var(--colorNeutralForeground3)",
  },

  // Key Simulation Grid
  keyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))",
    gap: "8px",
  },
  keyButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 6px",
    borderRadius: "10px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    gap: "6px",
    position: "relative",
    userSelect: "none",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      borderColor: "var(--colorNeutralStroke1)",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },
  keyButtonActive: {
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    borderColor: "rgba(0, 113, 227, 0.3)",
    color: "#0071e3",
  },
  keyIcon: {
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  keyLabel: {
    fontSize: "11px",
    fontWeight: "500",
    textAlign: "center",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
  },
  keySubLabel: {
    fontSize: "9px",
    color: "#0071e3",
    fontWeight: "600",
    marginTop: "-2px",
  },

  // Media Bar Container
  mediaBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "10px",
    gap: "6px",
    flexWrap: "wrap",
  },
  mediaBtn: {
    flex: "1 1 70px",
    height: "32px",
    borderRadius: "8px",
    fontSize: "12px",
  },

  // Form Controls & Sliders
  formRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 0",
    gap: "16px",
    borderBottom: "1px solid var(--colorNeutralStroke3)",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  formLabelArea: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: "140px",
  },
  formLabel: {
    fontSize: "12.5px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground1)",
  },
  formDesc: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  formInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  inputMini: {
    width: "80px",
    height: "30px",
    fontSize: "12px",
    borderRadius: "8px",
  },
  chipList: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
  },
  chip: {
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    cursor: "pointer",
    userSelect: "none",
    transition: "all 0.12s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      borderColor: "var(--colorNeutralStroke1)",
    },
  },
  chipActive: {
    backgroundColor: "#0071e3",
    borderColor: "#0071e3",
    color: "#ffffff",
    "&:hover": {
      backgroundColor: "#0077ed",
      color: "#ffffff",
    },
  },

  // Battery Telemetry
  batteryStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px",
  },
  batteryStatBox: {
    display: "flex",
    flexDirection: "column",
    padding: "10px 12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke2)",
    gap: "4px",
  },
  statLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  statValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--colorNeutralForeground1)",
  },

  // Empty banner
  emptyBanner: {
    padding: "16px",
    borderRadius: "10px",
    backgroundColor: "rgba(234, 179, 8, 0.08)",
    border: "1px solid rgba(234, 179, 8, 0.25)",
    color: "#d97706",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
});

interface DeviceControlPanelProps {
  device: DeviceInfo | null;
  onAdbRequired?: () => void;
}

export const DeviceControlPanel: React.FC<DeviceControlPanelProps> = ({
  device,
  onAdbRequired,
}) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { setStatusBarMessage } = useAppStore();

  const [activeTab, setActiveTab] = useState<"keys" | "display" | "system" | "battery">("keys");
  const [, setExecutingCmd] = useState<string | null>(null);

  // Hardware Status State
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [wifiSsid, setWifiSsid] = useState<string | null>(null);
  const [mobileDataEnabled, setMobileDataEnabled] = useState(false);
  const [airplaneModeEnabled, setAirplaneModeEnabled] = useState(false);
  const [flashlightEnabled, setFlashlightEnabled] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState(false);

  // Display Settings State
  const [resolutionWidth, setResolutionWidth] = useState("");
  const [resolutionHeight, setResolutionHeight] = useState("");
  const [density, setDensity] = useState("");
  const [fontScale, setFontScale] = useState("1.0");

  // Animation Settings State
  const [winScale, setWinScale] = useState(1);
  const [transScale, setTransScale] = useState(1);
  const [durScale, setDurScale] = useState(1);

  // Power & Battery State
  const [screenTimeout, setScreenTimeout] = useState("60000");
  const [stayOnWhilePluggedIn, setStayOnWhilePluggedIn] = useState("0");
  const [batterySimEnabled, setBatterySimEnabled] = useState(false);
  const [simLevel, setSimLevel] = useState(80);
  const [simCharging, setSimCharging] = useState(true);
  const [simMode, setSimMode] = useState("ac");

  const [realBattery, setRealBattery] = useState({
    level: 0,
    temperature: 0,
    isCharging: false,
    chargingMode: "none",
  });

  const isDeviceAvailable = !!device?.connected && device?.mode === "sys";

  // Polling hardware & network state
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const fetchStatus = async () => {
      if (isDeviceAvailable && device) {
        try {
          const status = await deviceService.getNetworkStatus(device.serial);
          setWifiEnabled(status.wifiEnabled);
          setWifiSsid(status.wifiSsid);
          setMobileDataEnabled(status.mobileDataEnabled);
          setAirplaneModeEnabled(status.airplaneModeEnabled);

          const rot = await deviceService.executeAdbCommand(device.serial, "shell", [
            "settings",
            "get",
            "system",
            "accelerometer_rotation",
          ]);
          setAutoRotateEnabled(rot.output.trim() === "1");
        } catch (e) {
          // silent ignore polling errors
        }
      }
    };

    fetchStatus();
    timer = setInterval(fetchStatus, 6000);
    return () => clearInterval(timer);
  }, [isDeviceAvailable, device, deviceService]);

  // Fetch display & power metrics
  const fetchAllSettings = useCallback(async () => {
    if (!isDeviceAvailable || !device) return;

    try {
      // WM Size
      const sizeRes = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size"]);
      if (sizeRes.success) {
        const m = sizeRes.output.match(/Physical size: (\d+)x(\d+)/);
        if (m) {
          setResolutionWidth(m[1]);
          setResolutionHeight(m[2]);
        }
      }

      // WM Density
      const densRes = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density"]);
      if (densRes.success) {
        const m = densRes.output.match(/Physical density: (\d+)/);
        if (m) setDensity(m[1]);
      }

      // Font Scale
      const fontRes = await deviceService.executeAdbCommand(device.serial, "shell", [
        "settings",
        "get",
        "system",
        "font_scale",
      ]);
      if (fontRes.success && fontRes.output.trim()) {
        setFontScale(parseFloat(fontRes.output.trim()).toString());
      }

      // Animations
      const getGlobal = async (k: string) => {
        const r = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", k]);
        return r.success && r.output ? parseFloat(r.output) : 1;
      };
      const ws = await getGlobal("window_animation_scale");
      const ts = await getGlobal("transition_animation_scale");
      const ds = await getGlobal("animator_duration_scale");
      setWinScale(isNaN(ws) ? 1 : ws);
      setTransScale(isNaN(ts) ? 1 : ts);
      setDurScale(isNaN(ds) ? 1 : ds);

      // Timeout & Stay on
      const toRes = await deviceService.executeAdbCommand(device.serial, "shell", [
        "settings",
        "get",
        "system",
        "screen_off_timeout",
      ]);
      if (toRes.success && toRes.output.trim()) setScreenTimeout(toRes.output.trim());

      const stayRes = await deviceService.executeAdbCommand(device.serial, "shell", [
        "settings",
        "get",
        "global",
        "stay_on_while_plugged_in",
      ]);
      if (stayRes.success && stayRes.output.trim()) setStayOnWhilePluggedIn(stayRes.output.trim());

      // Battery Dumpsys
      const batRes = await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery"]);
      if (batRes.success && batRes.output) {
        const levelMatch = batRes.output.match(/level: (\d+)/);
        const tempMatch = batRes.output.match(/temperature: (\d+)/);
        const statusMatch = batRes.output.match(/status: (\d+)/);
        const healthMatch = batRes.output.match(/health: (\d+)/);

        let isCharging = false;
        if (statusMatch) {
          const s = parseInt(statusMatch[1]);
          isCharging = s === 2 || s === 5;
        }

        let chargingMode = "none";
        if (healthMatch) {
          const h = parseInt(healthMatch[1]);
          if (h === 2) chargingMode = "ac";
          else if (h === 3) chargingMode = "usb";
          else if (h === 4) chargingMode = "wireless";
        }

        setRealBattery({
          level: levelMatch ? parseInt(levelMatch[1]) : 50,
          temperature: tempMatch ? parseInt(tempMatch[1]) / 10 : 25,
          isCharging,
          chargingMode,
        });
      }
    } catch (e) {
      console.error("加载设置失败:", e);
    }
  }, [isDeviceAvailable, device, deviceService]);

  useEffect(() => {
    if (isDeviceAvailable) {
      fetchAllSettings();
    }
  }, [isDeviceAvailable, fetchAllSettings]);

  // Execute Key / Control Command
  const runControlCommand = async (cmdId: string, desc: string) => {
    if (!device) {
      setStatusBarMessage({ type: "warning", message: "请先连接并选择设备" });
      return;
    }
    if (!isDeviceAvailable) {
      if (onAdbRequired) onAdbRequired();
      return;
    }

    let finalId = cmdId;
    if (cmdId === "wifi_toggle") finalId = wifiEnabled ? "wifi_off" : "wifi_on";
    else if (cmdId === "mobile_data_toggle") finalId = mobileDataEnabled ? "data_off" : "data_on";
    else if (cmdId === "airplane_toggle") finalId = airplaneModeEnabled ? "airplane_mode_off" : "airplane_mode_on";
    else if (cmdId === "flashlight_toggle") finalId = flashlightEnabled ? "flashlight_off" : "flashlight_on";
    else if (cmdId === "auto_rotate_toggle") finalId = autoRotateEnabled ? "auto_rotate_off" : "auto_rotate_on";

    setExecutingCmd(cmdId);
    try {
      const res = await controlService.executeCommand(device.serial, finalId);
      if (res.success) {
        setStatusBarMessage({ type: "success", message: `已触发: ${desc}` });
      } else {
        setStatusBarMessage({ type: "error", message: res.error || "执行失败" });
      }
    } catch (err) {
      setStatusBarMessage({ type: "error", message: String(err) });
    } finally {
      setExecutingCmd(null);
    }
  };

  // Apply Display Resolution & Density
  const handleApplyDisplay = async () => {
    if (!isDeviceAvailable || !device) return;
    try {
      const w = parseInt(resolutionWidth);
      const h = parseInt(resolutionHeight);
      const d = parseInt(density);
      const fs = parseFloat(fontScale);

      if (w > 0 && h > 0) {
        await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", `${w}x${h}`]);
      }
      if (d > 0) {
        await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", d.toString()]);
      }
      if (!isNaN(fs)) {
        await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", fs.toString()]);
      }

      setStatusBarMessage({ type: "success", message: "显示参数已应用" });
      setTimeout(fetchAllSettings, 500);
    } catch (e) {
      setStatusBarMessage({ type: "error", message: String(e) });
    }
  };

  const handleResetDisplay = async () => {
    if (!isDeviceAvailable || !device) return;
    if (!window.confirm("确定要恢复设备原生分辨率和 DPI 吗？")) return;
    try {
      await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", "reset"]);
      await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", "reset"]);
      await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", "1.0"]);
      setStatusBarMessage({ type: "success", message: "已恢复默认显示参数" });
      setTimeout(fetchAllSettings, 500);
    } catch (e) {
      setStatusBarMessage({ type: "error", message: String(e) });
    }
  };

  // Apply Animation Scale
  const handleSetAnimation = async (key: "win" | "trans" | "dur", val: number) => {
    if (!isDeviceAvailable || !device) return;
    const globalKey =
      key === "win"
        ? "window_animation_scale"
        : key === "trans"
        ? "transition_animation_scale"
        : "animator_duration_scale";

    try {
      await deviceService.executeAdbCommand(device.serial, "shell", [
        "settings",
        "put",
        "global",
        globalKey,
        val.toString(),
      ]);
      if (key === "win") setWinScale(val);
      if (key === "trans") setTransScale(val);
      if (key === "dur") setDurScale(val);
      setStatusBarMessage({ type: "success", message: "动画倍率已生效" });
    } catch (e) {
      setStatusBarMessage({ type: "error", message: String(e) });
    }
  };

  // Apply Power & Stay On
  const handleSetTimeout = async (ms: string) => {
    if (!isDeviceAvailable || !device) return;
    setScreenTimeout(ms);
    try {
      await deviceService.executeAdbCommand(device.serial, "shell", [
        "settings",
        "put",
        "system",
        "screen_off_timeout",
        ms,
      ]);
      setStatusBarMessage({ type: "success", message: "自动锁屏时间已更新" });
    } catch (e) {
      setStatusBarMessage({ type: "error", message: String(e) });
    }
  };

  const handleSetStayOn = async (val: string) => {
    if (!isDeviceAvailable || !device) return;
    setStayOnWhilePluggedIn(val);
    try {
      await deviceService.executeAdbCommand(device.serial, "shell", [
        "settings",
        "put",
        "global",
        "stay_on_while_plugged_in",
        val,
      ]);
      setStatusBarMessage({ type: "success", message: "充电常亮设置已更新" });
    } catch (e) {
      setStatusBarMessage({ type: "error", message: String(e) });
    }
  };

  // Battery Simulation
  const handleApplyBatterySim = async (enabled: boolean, level = simLevel, charging = simCharging, mode = simMode) => {
    if (!isDeviceAvailable || !device) return;
    try {
      if (!enabled) {
        await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "reset"]);
        setBatterySimEnabled(false);
        setStatusBarMessage({ type: "success", message: "已恢复真实电池状态" });
        setTimeout(fetchAllSettings, 400);
      } else {
        await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "level", level.toString()]);
        await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "status", charging ? "2" : "1"]);
        let health = "1";
        if (mode === "ac") health = "2";
        else if (mode === "usb") health = "3";
        else if (mode === "wireless") health = "4";
        await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "health", health]);
        setBatterySimEnabled(true);
        setStatusBarMessage({ type: "success", message: "电池模拟已应用" });
      }
    } catch (e) {
      setStatusBarMessage({ type: "error", message: String(e) });
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部标题与分段控制 */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <Text className={styles.title}>设备控制中心</Text>
        </div>

        <div className={styles.segmentedTabs}>
          <div
            className={mergeClasses(styles.tabItem, activeTab === "keys" && styles.tabItemActive)}
            onClick={() => setActiveTab("keys")}
          >
            <Desktop20Regular />
            <span>按键与开关</span>
          </div>

          <div
            className={mergeClasses(styles.tabItem, activeTab === "display" && styles.tabItemActive)}
            onClick={() => setActiveTab("display")}
          >
            <Phone20Regular />
            <span>屏幕与显示</span>
          </div>

          <div
            className={mergeClasses(styles.tabItem, activeTab === "system" && styles.tabItemActive)}
            onClick={() => setActiveTab("system")}
          >
            <Timer20Regular />
            <span>动画与电源</span>
          </div>

          <div
            className={mergeClasses(styles.tabItem, activeTab === "battery" && styles.tabItemActive)}
            onClick={() => setActiveTab("battery")}
          >
            <BatteryCharge20Regular />
            <span>电池与模拟</span>
          </div>
        </div>
      </div>

      {!isDeviceAvailable && (
        <div className={styles.emptyBanner}>
          <Info20Regular />
          <span>设备未连接或当前未处于系统正常开机模式 (sys)，部分 ADB 系统级指令可能暂不可用。</span>
        </div>
      )}

      {/* 主体滚动区域 */}
      <div className={styles.scrollBody}>
        {/* ================= TAB 1: 按键与硬件开关 ================= */}
        {activeTab === "keys" && (
          <>
            {/* 常用导航与核心按键 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Desktop20Regular />
                  <span className={styles.cardTitle}>基础导航与系统按键</span>
                </div>
                <span className={styles.cardSubtitle}>即点即触发，响应敏捷</span>
              </div>

              <div className={styles.keyGrid}>
                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("back", "返回键")}
                >
                  <div className={styles.keyIcon}><ArrowLeft20Regular /></div>
                  <span className={styles.keyLabel}>返回 (Back)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("home", "主页键")}
                >
                  <div className={styles.keyIcon}><Home20Regular /></div>
                  <span className={styles.keyLabel}>主屏 (Home)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("recent_apps", "多任务")}
                >
                  <div className={styles.keyIcon}><Apps20Regular /></div>
                  <span className={styles.keyLabel}>多任务 (Recents)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("power_button", "电源键")}
                >
                  <div className={styles.keyIcon}><Power20Regular /></div>
                  <span className={styles.keyLabel}>电源 (Power)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("lock_screen", "锁定屏幕")}
                >
                  <div className={styles.keyIcon}><LockClosed20Regular /></div>
                  <span className={styles.keyLabel}>锁屏 (Lock)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("wake_up", "唤醒屏幕")}
                >
                  <div className={styles.keyIcon}><WeatherSunny20Regular /></div>
                  <span className={styles.keyLabel}>唤醒 (Wake)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("menu", "菜单键")}
                >
                  <div className={styles.keyIcon}><LineHorizontal320Regular /></div>
                  <span className={styles.keyLabel}>菜单 (Menu)</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("developer_options", "开发者选项")}
                >
                  <div className={styles.keyIcon}><WrenchScrewdriver20Regular /></div>
                  <span className={styles.keyLabel}>开发者选项</span>
                </div>
              </div>
            </div>

            {/* 多媒体与音量控制 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Speaker220Regular />
                  <span className={styles.cardTitle}>媒体与音量控制</span>
                </div>
              </div>

              <div className={styles.mediaBar}>
                <Button
                  appearance="subtle"
                  icon={<Speaker220Regular />}
                  className={styles.mediaBtn}
                  onClick={() => runControlCommand("volume_up", "音量 +")}
                >
                  音量 +
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Speaker120Regular />}
                  className={styles.mediaBtn}
                  onClick={() => runControlCommand("volume_down", "音量 -")}
                >
                  音量 -
                </Button>
                <Button
                  appearance="subtle"
                  icon={<SpeakerMute20Regular />}
                  className={styles.mediaBtn}
                  onClick={() => runControlCommand("volume_mute", "静音切换")}
                >
                  静音
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Previous20Regular />}
                  className={styles.mediaBtn}
                  onClick={() => runControlCommand("media_previous", "上一曲")}
                >
                  上一首
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Play20Regular />}
                  className={styles.mediaBtn}
                  onClick={() => runControlCommand("media_play_pause", "播放/暂停")}
                >
                  播放/暂停
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Next20Regular />}
                  className={styles.mediaBtn}
                  onClick={() => runControlCommand("media_next", "下一曲")}
                >
                  下一首
                </Button>
              </div>
            </div>

            {/* 硬件与网络状态快捷开关 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Wifi120Regular />
                  <span className={styles.cardTitle}>网络与硬件状态开关</span>
                </div>
                <span className={styles.cardSubtitle}>实时感知并切换设备开关</span>
              </div>

              <div className={styles.keyGrid}>
                <div
                  className={mergeClasses(styles.keyButton, wifiEnabled && styles.keyButtonActive)}
                  onClick={() => runControlCommand("wifi_toggle", "Wi-Fi 切换")}
                >
                  <div className={styles.keyIcon}><Wifi120Regular /></div>
                  <span className={styles.keyLabel}>Wi-Fi {wifiEnabled ? "开启" : "关闭"}</span>
                  {wifiSsid && <span className={styles.keySubLabel}>{wifiSsid}</span>}
                </div>

                <div
                  className={mergeClasses(styles.keyButton, mobileDataEnabled && styles.keyButtonActive)}
                  onClick={() => runControlCommand("mobile_data_toggle", "移动数据切换")}
                >
                  <div className={styles.keyIcon}><Cellular4G20Regular /></div>
                  <span className={styles.keyLabel}>移动数据 {mobileDataEnabled ? "开启" : "关闭"}</span>
                </div>

                <div
                  className={mergeClasses(styles.keyButton, airplaneModeEnabled && styles.keyButtonActive)}
                  onClick={() => runControlCommand("airplane_toggle", "飞行模式切换")}
                >
                  <div className={styles.keyIcon}><Airplane20Regular /></div>
                  <span className={styles.keyLabel}>飞行模式 {airplaneModeEnabled ? "开启" : "关闭"}</span>
                </div>

                <div
                  className={mergeClasses(styles.keyButton, autoRotateEnabled && styles.keyButtonActive)}
                  onClick={() => runControlCommand("auto_rotate_toggle", "自动旋转切换")}
                >
                  <div className={styles.keyIcon}><ArrowCounterclockwise20Regular /></div>
                  <span className={styles.keyLabel}>自动旋转 {autoRotateEnabled ? "开启" : "关闭"}</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("brightness_max", "设为最高亮度")}
                >
                  <div className={styles.keyIcon}><WeatherSunny20Regular /></div>
                  <span className={styles.keyLabel}>最高亮度 100%</span>
                </div>

                <div
                  className={styles.keyButton}
                  onClick={() => runControlCommand("brightness_low", "设为最低亮度")}
                >
                  <div className={styles.keyIcon}><WeatherSunny20Regular /></div>
                  <span className={styles.keyLabel}>最低亮度 10%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 2: 屏幕与显示 ================= */}
        {activeTab === "display" && (
          <div className={styles.bentoCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <Phone20Regular />
                <span className={styles.cardTitle}>屏幕尺寸、DPI 与字体缩放</span>
              </div>
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowReset20Regular />}
                onClick={handleResetDisplay}
              >
                恢复原生默认
              </Button>
            </div>

            {/* 分辨率调整 */}
            <div className={styles.formRow}>
              <div className={styles.formLabelArea}>
                <span className={styles.formLabel}>分辨率 (WM Size)</span>
                <span className={styles.formDesc}>修改屏幕渲染视口像素</span>
              </div>

              <div className={styles.formInputGroup}>
                <div className={styles.chipList}>
                  <span
                    className={styles.chip}
                    onClick={() => {
                      setResolutionWidth("1080");
                      setResolutionHeight("2400");
                    }}
                  >
                    1080×2400
                  </span>
                  <span
                    className={styles.chip}
                    onClick={() => {
                      setResolutionWidth("1440");
                      setResolutionHeight("3200");
                    }}
                  >
                    2K (1440×3200)
                  </span>
                  <span
                    className={styles.chip}
                    onClick={() => {
                      setResolutionWidth("720");
                      setResolutionHeight("1600");
                    }}
                  >
                    720P
                  </span>
                </div>

                <Input
                  className={styles.inputMini}
                  type="number"
                  placeholder="宽"
                  value={resolutionWidth}
                  onChange={(_, d) => setResolutionWidth(d.value)}
                />
                <Text>×</Text>
                <Input
                  className={styles.inputMini}
                  type="number"
                  placeholder="高"
                  value={resolutionHeight}
                  onChange={(_, d) => setResolutionHeight(d.value)}
                />
                <Text style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>px</Text>
              </div>
            </div>

            {/* DPI 调整 */}
            <div className={styles.formRow}>
              <div className={styles.formLabelArea}>
                <span className={styles.formLabel}>屏幕密度 (DPI)</span>
                <span className={styles.formDesc}>调整 UI 缩放与元素物理显示大小</span>
              </div>

              <div className={styles.formInputGroup}>
                <div className={styles.chipList}>
                  {[320, 360, 400, 440, 480].map((d) => (
                    <span
                      key={d}
                      className={mergeClasses(styles.chip, density === d.toString() && styles.chipActive)}
                      onClick={() => setDensity(d.toString())}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <Input
                  className={styles.inputMini}
                  type="number"
                  placeholder="DPI"
                  value={density}
                  onChange={(_, d) => setDensity(d.value)}
                />
                <Text style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>dpi</Text>
              </div>
            </div>

            {/* 字体缩放比例 */}
            <div className={styles.formRow}>
              <div className={styles.formLabelArea}>
                <span className={styles.formLabel}>全局字体缩放倍率</span>
                <span className={styles.formDesc}>系统文字全局大小比例</span>
              </div>

              <div className={styles.formInputGroup}>
                <div className={styles.chipList}>
                  {["0.85", "1.0", "1.15", "1.3"].map((scale) => (
                    <span
                      key={scale}
                      className={mergeClasses(styles.chip, fontScale === scale && styles.chipActive)}
                      onClick={() => setFontScale(scale)}
                    >
                      {scale}x
                    </span>
                  ))}
                </div>

                <Input
                  className={styles.inputMini}
                  type="number"
                  step="0.05"
                  value={fontScale}
                  onChange={(_, d) => setFontScale(d.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button appearance="primary" onClick={handleApplyDisplay}>
                应用显示设置
              </Button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: 动画与电源 ================= */}
        {activeTab === "system" && (
          <>
            {/* 系统动画倍率 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Timer20Regular />
                  <span className={styles.cardTitle}>窗口与过渡动画倍率</span>
                </div>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<ArrowReset20Regular />}
                  onClick={() => {
                    handleSetAnimation("win", 1);
                    handleSetAnimation("trans", 1);
                    handleSetAnimation("dur", 1);
                  }}
                >
                  全部恢复 1.0x
                </Button>
              </div>

              {/* Window Animation Scale */}
              <div className={styles.formRow}>
                <div className={styles.formLabelArea}>
                  <span className={styles.formLabel}>窗口动画缩放 (Window)</span>
                </div>

                <div className={styles.chipList}>
                  {[0, 0.5, 1, 1.5, 2, 5].map((val) => (
                    <span
                      key={val}
                      className={mergeClasses(styles.chip, winScale === val && styles.chipActive)}
                      onClick={() => handleSetAnimation("win", val)}
                    >
                      {val === 0 ? "关闭" : `${val}x`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Transition Animation Scale */}
              <div className={styles.formRow}>
                <div className={styles.formLabelArea}>
                  <span className={styles.formLabel}>过渡动画缩放 (Transition)</span>
                </div>

                <div className={styles.chipList}>
                  {[0, 0.5, 1, 1.5, 2, 5].map((val) => (
                    <span
                      key={val}
                      className={mergeClasses(styles.chip, transScale === val && styles.chipActive)}
                      onClick={() => handleSetAnimation("trans", val)}
                    >
                      {val === 0 ? "关闭" : `${val}x`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Animator Duration Scale */}
              <div className={styles.formRow}>
                <div className={styles.formLabelArea}>
                  <span className={styles.formLabel}>动画程序时长缩放 (Animator)</span>
                </div>

                <div className={styles.chipList}>
                  {[0, 0.5, 1, 1.5, 2, 5].map((val) => (
                    <span
                      key={val}
                      className={mergeClasses(styles.chip, durScale === val && styles.chipActive)}
                      onClick={() => handleSetAnimation("dur", val)}
                    >
                      {val === 0 ? "关闭" : `${val}x`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 锁屏与充电唤醒 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Settings20Regular />
                  <span className={styles.cardTitle}>休眠与充电保持唤醒</span>
                </div>
              </div>

              {/* Screen Timeout */}
              <div className={styles.formRow}>
                <div className={styles.formLabelArea}>
                  <span className={styles.formLabel}>无操作自动休眠时间</span>
                </div>

                <div className={styles.chipList}>
                  {[
                    { label: "15秒", val: "15000" },
                    { label: "30秒", val: "30000" },
                    { label: "1分钟", val: "60000" },
                    { label: "2分钟", val: "120000" },
                    { label: "5分钟", val: "300000" },
                    { label: "10分钟", val: "600000" },
                    { label: "30分钟", val: "1800000" },
                    { label: "永不休眠", val: "-1" },
                  ].map((item) => (
                    <span
                      key={item.val}
                      className={mergeClasses(styles.chip, screenTimeout === item.val && styles.chipActive)}
                      onClick={() => handleSetTimeout(item.val)}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stay On Plugged In */}
              <div className={styles.formRow}>
                <div className={styles.formLabelArea}>
                  <span className={styles.formLabel}>连接供电时屏幕常亮</span>
                </div>

                <div className={styles.chipList}>
                  {[
                    { label: "关闭", val: "0" },
                    { label: "充电时常亮", val: "1" },
                    { label: "USB连接时常亮", val: "2" },
                    { label: "无线充电常亮", val: "7" },
                  ].map((item) => (
                    <span
                      key={item.val}
                      className={mergeClasses(styles.chip, stayOnWhilePluggedIn === item.val && styles.chipActive)}
                      onClick={() => handleSetStayOn(item.val)}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB 4: 电池状态与模拟 ================= */}
        {activeTab === "battery" && (
          <>
            {/* 真实电池信息 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <BatteryCharge20Regular />
                  <span className={styles.cardTitle}>电池实时状态</span>
                </div>
                <Button appearance="subtle" size="small" icon={<ArrowReset20Regular />} onClick={fetchAllSettings}>
                  刷新数据
                </Button>
              </div>

              <div className={styles.batteryStatsGrid}>
                <div className={styles.batteryStatBox}>
                  <span className={styles.statLabel}>剩余电量</span>
                  <span className={styles.statValue}>{realBattery.level}%</span>
                </div>

                <div className={styles.batteryStatBox}>
                  <span className={styles.statLabel}>电池温度</span>
                  <span className={styles.statValue}>{realBattery.temperature}°C</span>
                </div>

                <div className={styles.batteryStatBox}>
                  <span className={styles.statLabel}>供电模式</span>
                  <span className={styles.statValue}>
                    {realBattery.chargingMode === "ac"
                      ? "直流充电"
                      : realBattery.chargingMode === "usb"
                      ? "USB 充电"
                      : realBattery.chargingMode === "wireless"
                      ? "无线供电"
                      : "放电中"}
                  </span>
                </div>

                <div className={styles.batteryStatBox}>
                  <span className={styles.statLabel}>充电状态</span>
                  <span className={styles.statValue}>{realBattery.isCharging ? "充电中" : "未在充电"}</span>
                </div>
              </div>
            </div>

            {/* 电池状态调试与模拟 */}
            <div className={styles.bentoCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <Settings20Regular />
                  <span className={styles.cardTitle}>电池状态调试与模拟 (Dumpsys)</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Switch
                    checked={batterySimEnabled}
                    onChange={(_, d) => {
                      if (!d.checked) {
                        handleApplyBatterySim(false);
                      } else {
                        handleApplyBatterySim(true);
                      }
                    }}
                  />
                  <Text size={200} weight="semibold">
                    {batterySimEnabled ? "模拟已开启" : "模拟已关闭"}
                  </Text>
                </div>
              </div>

              {batterySimEnabled && (
                <>
                  <div className={styles.formRow}>
                    <div className={styles.formLabelArea}>
                      <span className={styles.formLabel}>模拟电量百分比</span>
                      <span className={styles.formDesc}>测试不同电量状态下的系统行为</span>
                    </div>

                    <div className={styles.formInputGroup}>
                      <div className={styles.chipList}>
                        {[5, 20, 50, 80, 100].map((lvl) => (
                          <span
                            key={lvl}
                            className={mergeClasses(styles.chip, simLevel === lvl && styles.chipActive)}
                            onClick={() => {
                              setSimLevel(lvl);
                              handleApplyBatterySim(true, lvl, simCharging, simMode);
                            }}
                          >
                            {lvl}%
                          </span>
                        ))}
                      </div>

                      <Input
                        className={styles.inputMini}
                        type="number"
                        min="0"
                        max="100"
                        value={simLevel.toString()}
                        onChange={(_, d) => {
                          const num = Math.min(100, Math.max(0, parseInt(d.value) || 0));
                          setSimLevel(num);
                        }}
                        onBlur={() => handleApplyBatterySim(true, simLevel, simCharging, simMode)}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formLabelArea}>
                      <span className={styles.formLabel}>模拟供电状态</span>
                    </div>

                    <div className={styles.formInputGroup}>
                      <div className={styles.chipList}>
                        <span
                          className={mergeClasses(styles.chip, simCharging && styles.chipActive)}
                          onClick={() => {
                            setSimCharging(true);
                            handleApplyBatterySim(true, simLevel, true, simMode);
                          }}
                        >
                          充电状态
                        </span>
                        <span
                          className={mergeClasses(styles.chip, !simCharging && styles.chipActive)}
                          onClick={() => {
                            setSimCharging(false);
                            handleApplyBatterySim(true, simLevel, false, simMode);
                          }}
                        >
                          放电状态
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formLabelArea}>
                      <span className={styles.formLabel}>模拟充电电源类型</span>
                    </div>

                    <div className={styles.formInputGroup}>
                      <div className={styles.chipList}>
                        {[
                          { label: "AC 直流充电", val: "ac" },
                          { label: "USB 充电", val: "usb" },
                          { label: "无线充电", val: "wireless" },
                        ].map((m) => (
                          <span
                            key={m.val}
                            className={mergeClasses(styles.chip, simMode === m.val && styles.chipActive)}
                            onClick={() => {
                              setSimMode(m.val);
                              handleApplyBatterySim(true, simLevel, simCharging, m.val);
                            }}
                          >
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <Button
                      appearance="subtle"
                      icon={<ArrowReset20Regular />}
                      onClick={() => handleApplyBatterySim(false)}
                    >
                      恢复设备真实电池状态
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeviceControlPanel;
