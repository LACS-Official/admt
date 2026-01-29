import React, { useEffect, useState, useRef } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Badge,
  Spinner,
  Button,
  Dropdown,
  Option,
  Switch,
  Slider,
  Field,
  Divider,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  Settings24Regular,
  ArrowReset24Regular,
  Play24Regular,
  Stop24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { ScreenMirrorDevice, SCREEN_MIRROR_QUALITY_PRESETS } from "../../types/screenMirror";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { mergeClasses } from "@fluentui/react-components";

const useStyles = makeStyles({
  card: {
    height: "100%",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", 
  //  border: "1px solid var(--colorNeutralStroke2)", // Card has default border
  },
  mainLayout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    height: "100%",
    overflow: "hidden",
  },
  leftPane: {
    padding: "16px",
    borderRight: "1px solid var(--colorNeutralStroke2)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  rightPane: {
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  settingsContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
  },
  
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    color: "var(--colorBrandForeground1)",
  },
  
  // Device List Styles
  deviceList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  deviceItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      // borderColor causes TS issue in some versions if strict, using border shorthand or border-color
      border: "1px solid var(--colorNeutralStroke1Hover)", 
    },
  },
  selectedDevice: {
    backgroundColor: "var(--colorBrandBackground2)",
    border: "1px solid var(--colorBrandStroke2)",
    "&:hover": {
      backgroundColor: "var(--colorBrandBackground2Hover)",
    },
  },
  streamingDevice: {
    border: "1px solid var(--colorPaletteRedBorder1)",
    backgroundColor: "var(--colorPaletteRedBackground1)",
    "&:hover": {
       backgroundColor: "var(--colorPaletteRedBackground2)",
    },
    animationName: {
        "0%": { transform: "scale(1)" },
        "50%": { transform: "scale(1.02)" },
        "100%": { transform: "scale(1)" },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
  },
  deviceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
  },
  deviceDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  deviceName: {
    fontWeight: "600",
  },
  deviceMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  noDevices: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 16px",
    textAlign: "center",
    color: "var(--colorNeutralForeground3)",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px",
  },
  
  // Animations
  fadeInSlideIn: {
    animationName: {
      from: { opacity: 0, transform: 'translateX(10px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
    },
    animationDuration: '0.3s',
    animationFillMode: 'forwards',
    animationTimingFunction: 'cubic-bezier(0.33, 1, 0.68, 1)',
  },

  fieldRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
  },
  fieldLabel: {
    flex: 1,
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
  },
   sectionTitle: {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "4px",
    color: "var(--colorNeutralForeground1)",
  },
  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  sliderLabel: {
    minWidth: "70px",
    fontSize: "13px",
  },
  sliderValue: {
    minWidth: "50px",
    textAlign: "right",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  
  divider: {
      margin: "0",
  },
  startMirrorBtn: {
      marginTop: "16px",
      width: "100%", 
  }

});

interface MirrorControlCardProps {
  devices: ScreenMirrorDevice[];
  selectedDevice: ScreenMirrorDevice | null;
  onSelectDevice: (device: ScreenMirrorDevice | null) => void;
  onDeviceAction: (device: ScreenMirrorDevice) => void;
  isLoading: boolean;
  streamingDevices: string[];
}

const MirrorControlCard: React.FC<MirrorControlCardProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onDeviceAction,
  isLoading,
  streamingDevices,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { config, updateConfig, resetConfig, applyQualityPreset } = useScreenMirrorStore();

  const handleDeviceClick = (device: ScreenMirrorDevice) => {
    // Toggle selection
    if (selectedDevice?.serial === device.serial) {
        onSelectDevice(null);
    } else {
        onSelectDevice(device);
    }
  };

  const isDeviceStreaming = (serial: string) => streamingDevices.includes(serial);

  // Settings Handlers
  const handleQualityPresetChange = (preset: string) => applyQualityPreset(preset);
  const handleResolutionChange = (resolution: string) => updateConfig({ quality: { ...config.quality, resolution } });
  const handleBitrateChange = (bitrate: number) => updateConfig({ quality: { ...config.quality, bitrate } });
  const handleFramerateChange = (framerate: number) => updateConfig({ quality: { ...config.quality, framerate } });
  const handleCodecChange = (codec: "h264" | "h265") => updateConfig({ quality: { ...config.quality, codec } });
  const handleSwitchChange = (field: string, checked: boolean) => updateConfig({ [field]: checked });

  // Options
  const resolutionOptions = [
    { value: "auto", label: t('mirror.auto') },
    { value: "1920x1080", label: "1920x1080 (FHD)" },
    { value: "1280x720", label: "1280x720 (HD)" },
    { value: "854x480", label: "854x480 (WVGA)" },
    { value: "640x360", label: "640x360 (nHD)" },
  ];
  const codecOptions = [
    { value: "h264", label: "H.264" },
    { value: "h265", label: "H.265" },
  ];
  const qualityPresetOptions = Object.keys(SCREEN_MIRROR_QUALITY_PRESETS).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }));


  return (
    <Card className={styles.card}>
      <div className={styles.mainLayout}>
      
        {/* === LEFT PANE: DEVICE SELECTION === */}
        <div className={styles.leftPane}>
             <div className={styles.sectionHeader}>
                <Phone24Regular />
                <Text weight="semibold" size={400}>{t('mirror.device_selection_title')}</Text>
                <Badge appearance="tint" color="brand" style={{marginLeft: 'auto'}}>
                    {t('mirror.devices_available', { count: devices.length })}
                </Badge>
             </div>

             {isLoading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="small" />
                  <Text size={300}>{t('mirror.checking_support')}</Text>
                </div>
              ) : devices.length === 0 ? (
                <div className={styles.noDevices}>
                  <Text size={300}>{t('mirror.no_devices')}</Text>
                  <Text size={200}>{t('mirror.no_devices_hint')}</Text>
                </div>
              ) : (
                <div className={styles.deviceList}>
                  {devices.map((device) => {
                      const isSelected = selectedDevice?.serial === device.serial;
                      const isStreaming = isDeviceStreaming(device.serial);
                      return (
                        <div
                          key={device.serial}
                          className={mergeClasses(
                            styles.deviceItem,
                            isSelected && styles.selectedDevice,
                            isStreaming && styles.streamingDevice
                          )}
                          onClick={() => handleDeviceClick(device)}
                        >
                          <div className={styles.deviceInfo}>
                            <Phone24Regular />
                            <div className={styles.deviceDetails}>
                              <Text className={styles.deviceName} size={300}>
                                {device.name || device.model || device.serial}
                              </Text>
                              <div className={styles.deviceMeta}>
                                {device.resolution && <Badge size="small" appearance="outline">{device.resolution}</Badge>}
                                {isStreaming && <Badge size="small" color="danger" appearance="filled">{t('mirror.mirroring')}</Badge>}
                              </div>
                            </div>
                          </div>
                          
                           {isSelected && !isStreaming && (
                               <Button appearance="primary" size="small" icon={<Play24Regular />}  onClick={(e) => { e.stopPropagation(); onDeviceAction(device); }}>
                                   {t('mirror.start_mirror')}
                               </Button>
                           )}
                           {isStreaming && (
                               <Button appearance="outline" size="small" icon={<Stop24Regular />} onClick={(e) => { e.stopPropagation(); onDeviceAction(device); }}>
                                   {t('mirror.stop_mirror')}
                               </Button>
                           )}
                        </div>
                      );
                  })}
                </div>
              )}
        </div>

        {/* === RIGHT PANE: SETTINGS === */}
        <div className={styles.rightPane}>
            <div className={styles.sectionHeader}>
                <Settings24Regular />
                <Text weight="semibold" size={400}>{t('mirror.settings_title')}</Text>
                 <Button style={{marginLeft: 'auto'}} size="small" appearance="subtle" icon={<ArrowReset24Regular />} onClick={resetConfig}>
                    {t('mirror.reset_to_default')}
                 </Button>
            </div>
            
            <div className={`${styles.settingsContainer} ${styles.fadeInSlideIn}`}>
                {/* Quality Section */}
                <div>
                    <Text className={styles.sectionTitle} style={{marginBottom: '12px', display: 'block'}}>{t('mirror.video_quality')}</Text>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        <Field label={t('mirror.quality_preset')} size="small">
                             <Dropdown value={qualityPresetOptions.find(p=>p.value === 'high')?.label || "High"} placeholder={t('mirror.select_quality_placeholder')} onOptionSelect={(_, d) => handleQualityPresetChange(d.optionValue as string)}>
                                 {qualityPresetOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                            </Dropdown>
                        </Field>
                        
                        <Field label={t('mirror.resolution')} size="small" style={{width: '100px'}}>
                          <Dropdown value={config.quality.resolution} onOptionSelect={(_,d) => handleResolutionChange(d.optionValue as string)}>
                                {resolutionOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                          </Dropdown>
                        </Field>
                        <Field label={t('mirror.codec')} size="small" style={{width: '100px'}}>
                          <Dropdown value={config.quality.codec} onOptionSelect={(_,d) => handleCodecChange(d.optionValue as "h264" | "h265")}>
                                {codecOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                          </Dropdown>
                        </Field>
                         
                         <div className={styles.sliderRow}>
                             <Text className={styles.sliderLabel}>{t('mirror.bitrate')}</Text>
                             <Slider min={1} max={20} step={1} value={config.quality.bitrate} onChange={(_, d) => handleBitrateChange(d.value)} style={{flex: 1}}/>
                             <Text className={styles.sliderValue}>{config.quality.bitrate} Mbps</Text>
                         </div>
                         <div className={styles.sliderRow}>
                             <Text className={styles.sliderLabel}>{t('mirror.framerate')}</Text>
                             <Slider min={15} max={60} step={5} value={config.quality.framerate} onChange={(_, d) => handleFramerateChange(d.value)} style={{flex: 1}}/>
                             <Text className={styles.sliderValue}>{config.quality.framerate} fps</Text>
                         </div>
                    </div>
                </div>

                <Divider style={{margin: '16px 0'}} />

                {/* Behavior Section */}
                <div>
                     <Text className={styles.sectionTitle} style={{marginBottom: '12px', display: 'block'}}>{t('mirror.behavior_options')}</Text>
                     <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'x12px 24px'}}>
                         <div className={styles.fieldRow}>
                            <Text className={styles.fieldLabel}>{t('mirror.show_touches')}</Text>
                            <Switch checked={config.showTouches} onChange={(_, d) => handleSwitchChange('showTouches', d.checked)} />
                         </div>
                         <div className={styles.fieldRow}>
                            <Text className={styles.fieldLabel}>{t('mirror.stay_awake')}</Text>
                            <Switch checked={config.stayAwake} onChange={(_, d) => handleSwitchChange('stayAwake', d.checked)} />
                         </div>
                          <div className={styles.fieldRow}>
                            <Text className={styles.fieldLabel}>{t('mirror.turn_screen_off')}</Text>
                            <Switch checked={config.turnScreenOff} onChange={(_, d) => handleSwitchChange('turnScreenOff', d.checked)} />
                         </div>
                          <div className={styles.fieldRow}>
                            <Text className={styles.fieldLabel}>{t('mirror.power_off_on_close')}</Text>
                            <Switch checked={config.powerOffOnClose} onChange={(_, d) => handleSwitchChange('powerOffOnClose', d.checked)} />
                         </div>
                         <div className={styles.fieldRow}>
                            <Text className={styles.fieldLabel}>{t('mirror.no_power_on')}</Text>
                            <Switch checked={config.noPowerOn} onChange={(_, d) => handleSwitchChange('noPowerOn', d.checked)} />
                         </div>
                         <div className={styles.fieldRow}>
                            <Text className={styles.fieldLabel}>{t('mirror.fullscreen_mode')}</Text>
                            <Switch checked={config.fullscreen} onChange={(_, d) => handleSwitchChange('fullscreen', d.checked)} />
                         </div>
                     </div>
                </div>
            </div>
        </div>
      
      </div>
    </Card>
  );
};

export default MirrorControlCard;
