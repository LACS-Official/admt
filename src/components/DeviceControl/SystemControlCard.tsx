import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Dropdown,
  Option,
  Tooltip,
  Switch,
  Divider,
} from "@fluentui/react-components";
import {
  Desktop24Regular,
  Timer24Regular,
  Battery2Regular,
  ArrowClockwise24Regular,
  Save24Regular,
  QuestionCircle24Regular,
  ArrowReset24Regular,
  BatteryCharge24Regular,
  BatteryWarning24Regular,
  PlugDisconnected24Regular,
  UsbPlug24Regular,
  Checkmark24Regular,
  ErrorCircle24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", 
  },
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "8px",
    overflow: "hidden", 
  },
  scrollableContent: {
    flex: 1,
    overflowY: "auto",
    padding: "0", 
  },
  section: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    color: "var(--colorBrandForeground1)",
  },
  controlRow: {
    display: "grid",
    gridTemplateColumns: "140px 1fr auto", // Label, Control, Action
    alignItems: "center",
    gap: "16px",
  },
  controlLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  controlInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  inputSmall: {
    width: "100px",
  },
  inputMedium: {
    width: "180px",
  },
  unitLabel: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  divider: {
    margin: "0", 
  },
  statusMessage: {
    fontSize: "13px",
    padding: "8px 12px",
    borderRadius: "6px",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  successMessage: {
    backgroundColor: "var(--colorSuccessBackground1)",
    color: "var(--colorSuccessForeground1)",
    border: "1px solid var(--colorSuccessStroke)",
  },
  errorMessage: {
    backgroundColor: "var(--colorDangerBackground1)",
    color: "var(--colorDangerForeground1)",
    border: "1px solid var(--colorDangerStroke)",
  },
  infoMessage: {
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground3)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  helpButton: {
    color: "var(--colorNeutralForeground3)",
    "&:hover": {
        color: "var(--colorNeutralForeground2)",
    }
  },
   simulationSection: {
    marginTop: "12px",
    padding: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  simulationHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "8px",
  },
    controlValue: {
    padding: "4px 8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "4px",
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
});

interface SystemControlCardProps {
  device: DeviceInfo;
}

const SystemControlCard: React.FC<SystemControlCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { deviceService } = useDeviceService();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const { setStatusBarMessage } = useAppStore();
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' });

  // --- Display Settings State ---
  const [customInputs, setCustomInputs] = useState({
    resolutionWidth: '',
    resolutionHeight: '',
    density: '',
    fontScale: '',
  });

  // --- Animation Settings State ---
  const [animationSettings, setAnimationSettings] = useState({
    windowAnimationScale: 0,
    transitionAnimationScale: 0,
    animatorDurationScale: 0,
  });

  // --- Power Settings State ---
  const [powerSettings, setPowerSettings] = useState({
    screenTimeout: 0,
    stayOnWhilePluggedIn: 0,
  });
  
  const [batterySimulation, setBatterySimulation] = useState({
    level: 50,
    temperature: 25,
    isCharging: false,
    chargingMode: "none",
    isSimulationEnabled: false,
  });

  const [realBatteryStatus, setRealBatteryStatus] = useState({
     level: 50, temperature: 25, isCharging: false, chargingMode: "none"
  });


  // --- Options ---
   const animationScaleOptions = [
    { value: "0", label: t('device_control.anim_off') },
    { value: "0.5", label: t('device_control.anim_speed', { scale: '.5' }) },
    { value: "1", label: t('device_control.anim_speed_default') },
    { value: "1.5", label: t('device_control.anim_speed', { scale: '1.5' }) },
    { value: "2", label: t('device_control.anim_speed', { scale: '2' }) },
    { value: "5", label: t('device_control.anim_speed', { scale: '5' }) },
    { value: "10", label: t('device_control.anim_speed', { scale: '10' }) },
  ];

  const screenTimeoutOptions = [
    { value: "15000", label: t('device_control.seconds', { count: 15 }) },
    { value: "30000", label: t('device_control.seconds', { count: 30 }) },
    { value: "60000", label: t('device_control.minutes', { count: 1 }) },
    { value: "120000", label: t('device_control.minutes', { count: 2 }) },
    { value: "300000", label: t('device_control.minutes', { count: 5 }) },
    { value: "600000", label: t('device_control.minutes', { count: 10 }) },
    { value: "1800000", label: t('device_control.minutes', { count: 30 }) },
    { value: "-1", label: t('device_control.never') },
  ];

   const stayOnWhilePluggedInOptions = [
    { value: "0", label: t('device_control.off') },
    { value: "1", label: t('device_control.stay_on_charging') },
    { value: "2", label: t('device_control.stay_on_usb') },
    { value: "7", label: t('device_control.stay_on_wireless') },
  ];
   
  const chargingModeOptions = [
    { value: "none", label: t('device_control.mode_none') },
    { value: "usb", label: t('device_control.mode_usb') },
    { value: "ac", label: t('device_control.mode_ac') },
    { value: "wireless", label: t('device_control.mode_wireless') },
  ];


  // --- Fetch Data ---
  const fetchAllSettings = async () => {
      if (!device.connected) return;

      // Display
      try {
           const wmSize = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size"]);
           if (wmSize.success) {
                const match = wmSize.output.match(/Physical size: (\d+)x(\d+)/);
                if (match) setCustomInputs(p => ({ ...p, resolutionWidth: match[1], resolutionHeight: match[2] }));
           }
           const wmDensity = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density"]);
           if (wmDensity.success) {
                const match = wmDensity.output.match(/Physical density: (\d+)/);
                if (match) setCustomInputs(p => ({ ...p, density: match[1] }));
           }
           const fontScale = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "font_scale"]);
           if (fontScale.success && fontScale.output) setCustomInputs(p => ({ ...p, fontScale: parseFloat(fontScale.output).toString() }));
      } catch (e) { console.error("Fetch Display Error", e); }

      // Animation
      try {
           const getGlobal = async (key: string) => {
               const res = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", key]);
               return res.success && res.output ? parseFloat(res.output) : 0; // Default 0 or 1? usually 1 but let's be safe
           };
           const winScale = await getGlobal("window_animation_scale");
           const transScale = await getGlobal("transition_animation_scale");
           const durScale = await getGlobal("animator_duration_scale");
           setAnimationSettings({
               windowAnimationScale: isNaN(winScale) ? 1 : winScale,
               transitionAnimationScale: isNaN(transScale) ? 1 : transScale,
               animatorDurationScale: isNaN(durScale) ? 1 : durScale,
           });
      } catch (e) { console.error("Fetch Animation Error", e); }

      // Power
       try {
          const timeoutRes = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "screen_off_timeout"]);
          if (timeoutRes.success && timeoutRes.output) setPowerSettings(p => ({...p, screenTimeout: parseInt(timeoutRes.output)}));

          const stayOnRes = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "stay_on_while_plugged_in"]);
          if (stayOnRes.success && stayOnRes.output) setPowerSettings(p => ({...p, stayOnWhilePluggedIn: parseInt(stayOnRes.output)}));
          
          fetchRealBatteryStatus();
       } catch (e) { console.error("Fetch Power Error", e); }
  };

  const fetchRealBatteryStatus = async () => {
       try {
          const batteryResult = await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery"]);
          if (batteryResult.success && batteryResult.output) {
               const output = batteryResult.output;
               const levelMatch = output.match(/level: (\d+)/);
               const tempMatch = output.match(/temperature: (\d+)/);
               const statusMatch = output.match(/status: (\d+)/); 
               const healthMatch = output.match(/health: (\d+)/);

               let isCharging = false;
               if (statusMatch) {
                   const status = parseInt(statusMatch[1]);
                   isCharging = status === 2 || status === 5;
               }

               let chargingMode = "none";
               if (healthMatch) {
                   const health = parseInt(healthMatch[1]);
                   if (health === 2) chargingMode = "ac";
                   else if (health === 3) chargingMode = "usb";
                   else if (health === 4) chargingMode = "wireless";
               }

               const status = {
                    level: levelMatch ? parseInt(levelMatch[1]) : 50,
                    temperature: tempMatch ? parseInt(tempMatch[1]) / 10 : 25,
                    isCharging,
                    chargingMode,
               };
               setRealBatteryStatus(status);
               
               if (!batterySimulation.isSimulationEnabled) {
                   setBatterySimulation(p => ({ ...p, ...status }));
               }
          }
       } catch (e) { console.error(e); }
  }


  useEffect(() => {
    if (device.connected && device.mode === "sys") {
      fetchAllSettings();
    }
  }, [device.connected, device.mode]);


  // --- Display Handlers ---
  const handleApplyDisplay = async () => {
      setExecutingCommand("display");
      const width = parseInt(customInputs.resolutionWidth);
      const height = parseInt(customInputs.resolutionHeight);
      const density = parseInt(customInputs.density);
      const fontScale = parseFloat(customInputs.fontScale);

      let errors: string[] = [];
      
      try {
          if (width > 0 && height > 0) await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", `${width}x${height}`]);
          if (density > 0) await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", density.toString()]);
          if (!isNaN(fontScale)) await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", fontScale.toString()]);
          
          setStatusBarMessage({ type: 'success', message: t('common.success') });
          setTimeout(fetchAllSettings, 500);
      } catch (e) {
          errors.push(String(e));
          setStatusBarMessage({ type: 'error', message: String(e) });
      }
      setExecutingCommand(null);
  };
  
   const handleRestoreDisplay = async () => {
      if(!confirm(t('device_control.restore_default') + "?")) return;
      setExecutingCommand("restore_display");
      try {
           await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", "reset"]);
           await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", "reset"]);
           await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", "1.0"]);
           setStatusBarMessage({ type: 'success', message: t('common.success') });
           setTimeout(fetchAllSettings, 500);
      } catch (e) { setStatusBarMessage({ type: 'error', message: String(e) }); }
      setExecutingCommand(null);
   };


  // --- Animation Handlers ---
  const applyAnimScale = async (key: string, value: number, stateKey: string) => {
      setExecutingCommand(stateKey);
      try {
          await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", key, value.toString()]);
          setAnimationSettings(p => ({...p, [stateKey]: value}));
          setStatusBarMessage({ type: 'success', message: t('common.success') });
      } catch (error) { setStatusBarMessage({ type: 'error', message: String(error) }); }
      setExecutingCommand(null);
  };

  const resetAnim = (key: string, stateKey: string) => applyAnimScale(key, 1.0, stateKey);


  // --- Power Handlers ---
  const applyPowerSetting = async (key: string, value: string, namespace: string = "system") => {
      const dbKey = key === "screenTimeout" ? "screen_off_timeout" : "stay_on_while_plugged_in"; // mapping
      setExecutingCommand(key);
      try {
          await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", namespace, key === "screenTimeout" ? "screen_off_timeout" : "stay_on_while_plugged_in", value]);
           setStatusBarMessage({ type: 'success', message: t('common.success') });
           setTimeout(fetchAllSettings, 500);
      } catch(e) { setStatusBarMessage({ type: 'error', message: String(e) }); }
      setExecutingCommand(null);
  }
  
  // Handlers for Battery Simulation (simplified)
  const applyBatterySim = async () => {
     if(!batterySimulation.isSimulationEnabled) return;
     setExecutingCommand("battery_sim");
     try {
         await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "level", batterySimulation.level.toString()]);
         await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "temp", (batterySimulation.temperature * 10).toString()]);
         await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "status", batterySimulation.isCharging ? "2" : "1"]);
         // health/mode logic omitted for brevity but can be added if needed deeply
         let health = "1";
         if(batterySimulation.chargingMode === "ac") health = "2";
         else if(batterySimulation.chargingMode === "usb") health = "3";
         else if(batterySimulation.chargingMode === "wireless") health = "4";
         await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "set", "health", health]);
         
         setStatusBarMessage({ type: 'success', message: t('common.success') });
     } catch (e) { setStatusBarMessage({ type: 'error', message: String(e) }); }
     setExecutingCommand(null);
  };
  
  const restoreBattery = async () => {
       setExecutingCommand("restore_battery");
       try {
           await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery", "reset"]);
           setStatusBarMessage({ type: 'success', message: t('common.success') });
           setBatterySimulation(p => ({...p, isSimulationEnabled: false, ...realBatteryStatus}));
           setTimeout(fetchRealBatteryStatus, 500);
       } catch (e) { setStatusBarMessage({ type: 'error', message: String(e) }); }
       setExecutingCommand(null);
  };


  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <div className={styles.container}>
     <Card className={styles.card}>
        <div className={styles.scrollableContent}>
       
       {/* ================= DISPLAY SECTION ================= */}
       <div className={styles.section}>
          <div className={styles.sectionHeader}>
             <Desktop24Regular />
             <Text weight="semibold" size={400}>{t('device_control.display_control')}</Text>
          </div>
          
          {/* Resolution */}
          <div className={styles.controlRow}>
             <div className={styles.controlLabel}>
                {t('device_control.resolution_settings')}
                <Tooltip content={t('device_control.tooltip_resolution')} relationship="label">
                   <Button size="small" appearance="subtle" icon={<QuestionCircle24Regular />} className={styles.helpButton} />
                </Tooltip>
             </div>
             <div className={styles.controlInputGroup}>
                <Input className={styles.inputSmall} type="number" placeholder={t('device_control.width')} value={customInputs.resolutionWidth} onChange={(e) => setCustomInputs(p=>({...p, resolutionWidth: e.target.value}))} disabled={!isDeviceAvailable} />
                <Text>×</Text>
                <Input className={styles.inputSmall} type="number" placeholder={t('device_control.height')} value={customInputs.resolutionHeight} onChange={(e) => setCustomInputs(p=>({...p, resolutionHeight: e.target.value}))} disabled={!isDeviceAvailable} />
                <Text className={styles.unitLabel}>px</Text>
             </div>
             <Button appearance="subtle" icon={<Save24Regular />} onClick={handleApplyDisplay} disabled={!isDeviceAvailable || executingCommand !== null} />
          </div>

           {/* Density */}
          <div className={styles.controlRow}>
             <div className={styles.controlLabel}>
                {t('device_control.density_settings')}
                  <Tooltip content={t('device_control.tooltip_density')} relationship="label">
                   <Button size="small" appearance="subtle" icon={<QuestionCircle24Regular />} className={styles.helpButton} />
                </Tooltip>
             </div>
             <div className={styles.controlInputGroup}>
                <Input className={styles.inputSmall} type="number" placeholder="DPI" value={customInputs.density} onChange={(e) => setCustomInputs(p=>({...p, density: e.target.value}))} disabled={!isDeviceAvailable} />
                <Text className={styles.unitLabel}>dpi</Text>
             </div>
              {/* Shared Apply Button for simplicty in UI, or individual? logic uses shared 'handleApplyDisplay' which applies all currently set inputs */}
          </div>

           {/* Font Scale */}
          <div className={styles.controlRow}>
             <div className={styles.controlLabel}>
                {t('device_control.font_scale_settings')}
                 <Tooltip content={t('device_control.tooltip_font_scale')} relationship="label">
                   <Button size="small" appearance="subtle" icon={<QuestionCircle24Regular />} className={styles.helpButton} />
                </Tooltip>
             </div>
             <div className={styles.controlInputGroup}>
                <Input className={styles.inputSmall} type="number" placeholder="1.0" step="0.05" value={customInputs.fontScale} onChange={(e) => setCustomInputs(p=>({...p, fontScale: e.target.value}))} disabled={!isDeviceAvailable} />
                <Text className={styles.unitLabel}>x</Text>
             </div>
          </div>
          
           <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px'}}>
               <Button size="small" appearance="secondary" icon={<ArrowClockwise24Regular />} onClick={handleRestoreDisplay} disabled={!isDeviceAvailable}>{t('device_control.restore_default')}</Button>
               <Button size="small" appearance="primary" icon={<Save24Regular />} onClick={handleApplyDisplay} disabled={!isDeviceAvailable}>{t('device_control.apply')}</Button>
           </div>
       </div>

       <Divider className={styles.divider} />

        {/* ================= ANIMATION SECTION ================= */}
       <div className={styles.section}>
          <div className={styles.sectionHeader}>
             <Timer24Regular />
             <Text weight="semibold" size={400}>{t('device_control.animation_speed')}</Text>
          </div>

           {/* Window Animation */}
           <div className={styles.controlRow}>
              <Text className={styles.controlLabel}>{t('device_control.window_animation')}</Text>
              <Dropdown className={styles.inputMedium} value={animationSettings.windowAnimationScale.toString()} onOptionSelect={(_,d) => applyAnimScale("window_animation_scale", parseFloat(d.optionValue||"1"), "windowAnimationScale")} disabled={!isDeviceAvailable}>
                 {animationScaleOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Dropdown>
              <Button size="small" appearance="subtle" icon={<ArrowReset24Regular />} onClick={() => resetAnim("window_animation_scale", "windowAnimationScale")} disabled={!isDeviceAvailable} />
           </div>

            {/* Transition Animation */}
           <div className={styles.controlRow}>
              <Text className={styles.controlLabel}>{t('device_control.transition_animation')}</Text>
               <Dropdown className={styles.inputMedium} value={animationSettings.transitionAnimationScale.toString()} onOptionSelect={(_,d) => applyAnimScale("transition_animation_scale", parseFloat(d.optionValue||"1"), "transitionAnimationScale")} disabled={!isDeviceAvailable}>
                 {animationScaleOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Dropdown>
              <Button size="small" appearance="subtle" icon={<ArrowReset24Regular />} onClick={() => resetAnim("transition_animation_scale", "transitionAnimationScale")} disabled={!isDeviceAvailable} />
           </div>

            {/* Animator Duration */}
           <div className={styles.controlRow}>
              <Text className={styles.controlLabel}>{t('device_control.animator_duration')}</Text>
               <Dropdown className={styles.inputMedium} value={animationSettings.animatorDurationScale.toString()} onOptionSelect={(_,d) => applyAnimScale("animator_duration_scale", parseFloat(d.optionValue||"1"), "animatorDurationScale")} disabled={!isDeviceAvailable}>
                 {animationScaleOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
              </Dropdown>
              <Button size="small" appearance="subtle" icon={<ArrowReset24Regular />} onClick={() => resetAnim("animator_duration_scale", "animatorDurationScale")} disabled={!isDeviceAvailable} />
           </div>
       </div>

       <Divider className={styles.divider} />

        {/* ================= POWER SECTION ================= */}
       <div className={styles.section}>
          <div className={styles.sectionHeader}>
             <Battery2Regular />
             <Text weight="semibold" size={400}>{t('device_control.power_management')}</Text>
          </div>

          <div className={styles.controlRow}>
             <Text className={styles.controlLabel}>{t('device_control.screen_timeout')}</Text>
             <Dropdown className={styles.inputMedium} value={powerSettings.screenTimeout.toString()} onOptionSelect={(_,d) => applyPowerSetting("screenTimeout", d.optionValue||"60000", "system")} disabled={!isDeviceAvailable}>
                 {screenTimeoutOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
             </Dropdown>
          </div>
          
           <div className={styles.controlRow}>
             <Text className={styles.controlLabel}>{t('device_control.stay_on')}</Text>
             <Dropdown className={styles.inputMedium} value={powerSettings.stayOnWhilePluggedIn.toString()} onOptionSelect={(_,d) => applyPowerSetting("stayOnWhilePluggedIn", d.optionValue||"0", "global")} disabled={!isDeviceAvailable}>
                 {stayOnWhilePluggedInOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
             </Dropdown>
          </div>

          {/* Battery Simulation */}
          <div className={styles.simulationSection}>
               <div className={styles.simulationHeader}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                       <BatteryCharge24Regular />
                       <Text weight="medium">{t('device_control.battery_simulation')}</Text>
                   </div>
                   <Switch checked={batterySimulation.isSimulationEnabled} onChange={(_, d) => {
                       setBatterySimulation(p => ({...p, isSimulationEnabled: d.checked}));
                       if(!d.checked) restoreBattery();
                       else applyBatterySim(); // apply current internal state initially
                   }} disabled={!isDeviceAvailable} />
               </div>
               
               {batterySimulation.isSimulationEnabled && (
                <>
                  <div className={styles.controlRow}>
                      <Text className={styles.controlLabel}>{t('device_control.battery_level')}</Text>
                      <div className={styles.controlInputGroup}>
                         <Input className={styles.inputSmall} type="number" min="0" max="100" value={batterySimulation.level.toString()} onChange={(_,d) => setBatterySimulation(p => ({...p, level: parseInt(d.value)}))} />
                         <Button size="small" appearance="subtle" onClick={applyBatterySim}>{t('device_control.apply')}</Button>
                      </div>
                  </div>

                  <div className={styles.controlRow}>
                      <Text className={styles.controlLabel}>{t('device_control.charging_status')}</Text>
                       <Switch checked={batterySimulation.isCharging} onChange={(_,d) => {
                           setBatterySimulation(p => ({...p, isCharging: d.checked}));
                           // we need to trigger effect or apply ? 
                           // For now user has to click apply or we auto apply?
                           // Let's add Apply button to header or just rely on individual Apply clicks?
                           // The user code had apply buttons next to inputs. Ideally auto-apply or explicit.
                           // I'll add a 'Sync' effect or just let user manually re-apply via controls if I separate them.
                           // Actually the user code had distinct "Apply" buttons.
                           // The simplest UX here is auto-apply on change? No that's spammy.
                           // I will leave logic as state update -> user actions trigger apply.
                       }} />
                       <Text>{batterySimulation.isCharging ? t('device_control.charging') : t('device_control.not_charging')}</Text>
                  </div>

                   <div className={styles.controlRow}>
                      <Text className={styles.controlLabel}>{t('device_control.charging_mode')}</Text>
                      <Dropdown className={styles.inputMedium} value={batterySimulation.chargingMode} onOptionSelect={(_,d) => setBatterySimulation(p=> ({...p, chargingMode: d.optionValue||"none"}))}>
                          {chargingModeOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                      </Dropdown>
                       <Button size="small" appearance="subtle" onClick={applyBatterySim}>{t('device_control.apply')}</Button>
                  </div>
                </>
               )}
          </div>

       </div>
       
       </div>
     </Card>
    </div>
  );
};

export default SystemControlCard;