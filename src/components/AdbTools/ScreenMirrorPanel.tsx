import React, { useEffect, useRef, useState } from 'react';
import {
    makeStyles,
    shorthands,
    Text,
    Badge,
    Spinner,
    Button,
    Dropdown,
    Option,
    Switch,
    Slider,
    Field,
    mergeClasses,
    Menu,
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
} from "@fluentui/react-components";
import {
    Phone24Regular,
    Settings24Regular,
    ArrowReset24Regular,
    Play24Regular,
    Stop24Regular,
    FullScreenMaximize24Regular,
    Record24Regular,
    RecordStop24Regular,
    Screenshot24Regular,
    MoreHorizontal24Regular,
    Options24Regular,
    Sparkle24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { useAppStore } from "../../stores/appStore";
import { 
    ScreenMirrorDevice, 
    SCREEN_MIRROR_QUALITY_PRESETS,
    ScreenMirrorSession,
    ScreenMirrorConfig
} from "../../types/screenMirror";
import ScreenMirrorService from "../../services/screenMirrorService";
import { DeviceInfo } from "../../types/device";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
    container: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        overflow: "hidden",
    },
    mainLayout: {
        display: "grid",
        gridTemplateColumns: "310px 1fr",
        gap: "16px",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
    },
    leftPane: {
        padding: "16px",
        borderRadius: "14px",
        border: "1px solid var(--colorNeutralStroke2)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        backgroundColor: "var(--colorNeutralBackground2)",
        transition: "all 0.2s ease",
    },
    rightPane: {
        padding: "20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        backgroundColor: "var(--colorNeutralBackground1)",
        borderRadius: "14px",
        border: "1px solid var(--colorNeutralStroke2)",
        height: "100%",
        boxSizing: "border-box",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: "10px",
        borderBottom: "1px solid var(--colorNeutralStroke2)",
        color: "var(--colorNeutralForeground1)",
    },
    headerTitleWrap: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    deviceList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    deviceItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        border: "1px solid var(--colorNeutralStroke2)",
        borderRadius: "10px",
        cursor: "pointer",
        transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: "var(--colorNeutralBackground1)",
        "&:hover": {
            backgroundColor: "var(--colorNeutralBackground1Hover)",
            ...shorthands.borderColor("var(--colorNeutralStroke1Hover)"),
            transform: "translateY(-1px)",
        },
    },
    selectedDevice: {
        backgroundColor: "rgba(0, 113, 227, 0.08)",
        ...shorthands.borderColor("var(--colorBrandStroke1)"),
        "&:hover": {
            backgroundColor: "rgba(0, 113, 227, 0.12)",
        },
    },
    streamingDevice: {
        border: "1px solid var(--colorPaletteRedBorder1)",
        backgroundColor: "var(--colorPaletteRedBackground1)",
        "&:hover": {
            backgroundColor: "var(--colorPaletteRedBackground2)",
        },
    },
    deviceInfo: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flex: 1,
        minWidth: 0,
    },
    deviceIconWrap: {
        width: "36px",
        height: "36px",
        borderRadius: "9999px",
        backgroundColor: "var(--colorNeutralBackground3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "var(--colorNeutralForeground2)",
    },
    deviceDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: 0,
    },
    deviceName: {
        fontWeight: "600",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    deviceMeta: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    loadingContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "24px",
    },
    settingsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        minWidth: 0,
    },
    bentoCard: {
        backgroundColor: "var(--colorNeutralBackground2)",
        borderRadius: "14px",
        padding: "18px",
        border: "1px solid var(--colorNeutralStroke2)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        fontWeight: "600",
        color: "var(--colorNeutralForeground1)",
    },
    sliderRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    sliderLabel: {
        minWidth: "70px",
        fontSize: "12px",
        color: "var(--colorNeutralForeground2)",
    },
    sliderValue: {
        minWidth: "50px",
        textAlign: "right",
        fontSize: "12px",
        fontWeight: "600",
        color: "var(--colorBrandForeground1)",
    },
    switchGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "10px",
    },
    switchTile: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: "10px",
        backgroundColor: "var(--colorNeutralBackground1)",
        border: "1px solid var(--colorNeutralStroke2)",
        transition: "all 0.15s ease",
        "&:hover": {
            ...shorthands.borderColor("var(--colorNeutralStroke1Hover)"),
        },
    },
    switchLabel: {
        fontSize: "12px",
        fontWeight: "500",
        color: "var(--colorNeutralForeground1)",
    },
    deviceActions: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexShrink: 0,
    },
});

// --- Internal MirrorControlCard Component ---
interface MirrorControlCardProps {
    devices: ScreenMirrorDevice[];
    selectedDevice: ScreenMirrorDevice | null;
    onSelectDevice: (device: ScreenMirrorDevice | null) => void;
    onDeviceAction: (device: ScreenMirrorDevice) => void;
    isLoading: boolean;
    streamingDevices: string[];
    activeSessions: ScreenMirrorSession[];
    onStopMirror: (sessionId: string) => void;
}

const MirrorControlCard: React.FC<MirrorControlCardProps> = ({
    devices,
    selectedDevice,
    onSelectDevice,
    onDeviceAction,
    isLoading,
    streamingDevices,
    activeSessions,
    onStopMirror,
}) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const { config, updateConfig, resetConfig, applyQualityPreset, isFullscreen, toggleFullscreen } = useScreenMirrorStore();
    const { setStatusBarMessage } = useAppStore();
    const [recordingSerials, setRecordingSerials] = useState<Record<string, boolean>>({});

    const handleDeviceClick = (device: ScreenMirrorDevice) => {
        if (selectedDevice?.serial === device.serial) {
            onSelectDevice(null);
        } else {
            onSelectDevice(device);
        }
    };

    const isDeviceStreaming = (serial: string) => streamingDevices.includes(serial);

    const handleToggleRecording = (serial: string) => {
        const isNowRecording = !recordingSerials[serial];
        setRecordingSerials(prev => ({ ...prev, [serial]: isNowRecording }));
        setStatusBarMessage({
            type: "info",
            message: isNowRecording ? t('mirror.recording_started', '已开始录屏') : t('mirror.recording_stopped', '已停止录屏'),
            duration: 3000,
        });
    };

    const handleTakeScreenshot = (_serial: string) => {
        setStatusBarMessage({
            type: "info",
            message: t('mirror.screenshot_taken', '已发送截屏指令'),
            duration: 3000,
        });
    };

    const handleQualityPresetChange = (preset: string) => applyQualityPreset(preset);
    const handleResolutionChange = (resolution: string) => updateConfig({ quality: { ...config.quality, resolution } });
    const handleBitrateChange = (bitrate: number) => updateConfig({ quality: { ...config.quality, bitrate } });
    const handleFramerateChange = (framerate: number) => updateConfig({ quality: { ...config.quality, framerate } });
    const handleCodecChange = (codec: "h264" | "h265") => updateConfig({ quality: { ...config.quality, codec } });
    const handleSwitchChange = (field: keyof ScreenMirrorConfig, checked: boolean) => updateConfig({ [field]: checked });

    const currentPreset = React.useMemo(() => {
        return Object.keys(SCREEN_MIRROR_QUALITY_PRESETS).find(key => {
            const preset = SCREEN_MIRROR_QUALITY_PRESETS[key];
            return preset.resolution === config.quality.resolution &&
                   preset.bitrate === config.quality.bitrate &&
                   preset.framerate === config.quality.framerate &&
                   preset.codec === config.quality.codec;
        }) || "custom";
    }, [config.quality]);

    const resolutionOptions = [
        { value: "auto", label: t('mirror.auto') },
        { value: "1920x1080", label: "1920x1080 (FHD)" },
        { value: "1280x720", label: "1280x720 (HD)" },
        { value: "854x480", label: "854x480 (WVGA)" },
        { value: "640x360", label: "640x360 (nHD)" },
    ];
    const codecOptions = [
        { value: "h264", label: "H.264" },
        { value: "h265", label: "H.265 (HEVC)" },
    ];
    const qualityPresetOptions = Object.keys(SCREEN_MIRROR_QUALITY_PRESETS).map(key => ({
        value: key,
        label: t(`mirror.quality_${key}`),
    }));

    return (
        <div className={styles.mainLayout}>
            {/* 左侧设备管理 */}
            <div className={styles.leftPane}>
                <div className={styles.sectionHeader}>
                    <div className={styles.headerTitleWrap}>
                        <Phone24Regular />
                        <Text weight="semibold" size={300}>{t('mirror.device_management_title', '设备管理')}</Text>
                    </div>
                    <Badge appearance="tint" color="brand">
                        {devices.length}
                    </Badge>
                </div>

                {isLoading ? (
                    <div className={styles.loadingContainer}>
                        <Spinner size="small" />
                        <Text size={200}>{t('mirror.checking_support')}</Text>
                    </div>
                ) : devices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--colorNeutralForeground3)' }}>
                        <Text size={200}>{t('mirror.no_devices')}</Text>
                    </div>
                ) : (
                    <div className={styles.deviceList}>
                        {devices.map((device) => {
                            const isSelected = selectedDevice?.serial === device.serial;
                            const isStreaming = isDeviceStreaming(device.serial);
                            const session = activeSessions.find(s => s.deviceSerial === device.serial);
                            const isRecording = !!recordingSerials[device.serial];

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
                                        <div className={styles.deviceIconWrap}>
                                            <Phone24Regular />
                                        </div>
                                        <div className={styles.deviceDetails}>
                                            <Text className={styles.deviceName} size={300}>
                                                {device.name || device.model || device.serial}
                                            </Text>
                                            <div className={styles.deviceMeta}>
                                                {device.resolution && <Badge size="small" appearance="outline">{device.resolution}</Badge>}
                                                {isStreaming && <Badge size="small" color="danger" appearance="filled">{t('mirror.mirroring', '投屏中')}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.deviceActions} onClick={(e) => e.stopPropagation()}>
                                        {isStreaming ? (
                                            <>
                                                <Button
                                                    appearance="subtle"
                                                    size="small"
                                                    shape="circular"
                                                    icon={<Stop24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />}
                                                    onClick={() => {
                                                        if (session) {
                                                            onStopMirror(session.id);
                                                        } else {
                                                            onDeviceAction(device);
                                                        }
                                                    }}
                                                    title={t('mirror.stop_mirror', '停止投屏')}
                                                />
                                                <Menu>
                                                    <MenuTrigger disableButtonEnhancement>
                                                        <Button
                                                            appearance="subtle"
                                                            size="small"
                                                            shape="circular"
                                                            icon={<MoreHorizontal24Regular />}
                                                            title={t('mirror.more_actions', '投屏控制')}
                                                        />
                                                    </MenuTrigger>
                                                    <MenuPopover>
                                                        <MenuList>
                                                            <MenuItem
                                                                icon={<Screenshot24Regular />}
                                                                onClick={() => handleTakeScreenshot(device.serial)}
                                                            >
                                                                {t('mirror.screenshot', '屏幕截图')}
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={isRecording ? <RecordStop24Regular style={{ color: 'var(--colorPaletteRedForeground1)' }} /> : <Record24Regular />}
                                                                onClick={() => handleToggleRecording(device.serial)}
                                                            >
                                                                {isRecording ? t('mirror.stop_record', '停止录屏') : t('mirror.start_record', '开始录屏')}
                                                            </MenuItem>
                                                            <MenuItem
                                                                icon={<FullScreenMaximize24Regular />}
                                                                onClick={toggleFullscreen}
                                                            >
                                                                {isFullscreen ? t('common.close', '退出全屏') : t('mirror.fullscreen', '全屏显示')}
                                                            </MenuItem>
                                                        </MenuList>
                                                    </MenuPopover>
                                                </Menu>
                                            </>
                                        ) : (
                                            <Button
                                                appearance={isSelected ? "primary" : "subtle"}
                                                size="small"
                                                shape="circular"
                                                icon={<Play24Regular />}
                                                onClick={() => onDeviceAction(device)}
                                                title={t('mirror.start_mirror', '开始投屏')}
                                            >
                                                {t('mirror.start_mirror', '投屏')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 右侧设置区域 */}
            <div className={styles.rightPane}>
                <div className={styles.sectionHeader}>
                    <div className={styles.headerTitleWrap}>
                        <Settings24Regular />
                        <Text weight="semibold" size={400}>{t('mirror.settings_title')}</Text>
                    </div>
                    <Button size="small" appearance="subtle" icon={<ArrowReset24Regular />} onClick={resetConfig}>
                        {t('mirror.reset_to_default')}
                    </Button>
                </div>

                <div className={styles.settingsGrid}>
                    {/* 视频与画质卡片 */}
                    <div className={styles.bentoCard}>
                        <div className={styles.cardHeader}>
                            <Sparkle24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                            <span>{t('mirror.video_quality')}</span>
                        </div>
                        
                        <Field label={t('mirror.quality_preset')} size="small" style={{ minWidth: 0 }}>
                            <Dropdown
                                style={{ minWidth: "100%", width: "100%" }}
                                value={currentPreset === "custom" ? t('mirror.custom') : t(`mirror.quality_${currentPreset}`)}
                                placeholder={t('mirror.select_quality_placeholder')}
                                onOptionSelect={(_, d) => handleQualityPresetChange(d.optionValue as string)}
                            >
                                {qualityPresetOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                                <Option value="custom" disabled>{t('mirror.custom')}</Option>
                            </Dropdown>
                        </Field>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                            <Field label={t('mirror.resolution')} size="small" style={{ minWidth: 0 }}>
                                <Dropdown
                                    style={{ minWidth: "100%", width: "100%" }}
                                    value={config.quality.resolution}
                                    onOptionSelect={(_, d) => handleResolutionChange(d.optionValue as string)}
                                >
                                    {resolutionOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                                </Dropdown>
                            </Field>
                            <Field label={t('mirror.codec')} size="small" style={{ minWidth: 0 }}>
                                <Dropdown
                                    style={{ minWidth: "100%", width: "100%" }}
                                    value={config.quality.codec}
                                    onOptionSelect={(_, d) => handleCodecChange(d.optionValue as "h264" | "h265")}
                                >
                                    {codecOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                                </Dropdown>
                            </Field>
                        </div>

                        <div className={styles.sliderRow}>
                            <Text className={styles.sliderLabel}>{t('mirror.bitrate')}</Text>
                            <Slider min={1} max={20} step={1} value={config.quality.bitrate} onChange={(_, d) => handleBitrateChange(d.value)} style={{ flex: 1 }} />
                            <Text className={styles.sliderValue}>{config.quality.bitrate} {t('mirror.bitrate_unit')}</Text>
                        </div>
                        <div className={styles.sliderRow}>
                            <Text className={styles.sliderLabel}>{t('mirror.framerate')}</Text>
                            <Slider min={15} max={60} step={5} value={config.quality.framerate} onChange={(_, d) => handleFramerateChange(d.value)} style={{ flex: 1 }} />
                            <Text className={styles.sliderValue}>{config.quality.framerate} {t('mirror.framerate_unit')}</Text>
                        </div>
                    </div>

                    {/* 行为控制选项 */}
                    <div className={styles.bentoCard}>
                        <div className={styles.cardHeader}>
                            <Options24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                            <span>{t('mirror.behavior_options')}</span>
                        </div>

                        <div className={styles.switchGrid}>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.show_touches')}</Text>
                                <Switch checked={config.showTouches} onChange={(_, d) => handleSwitchChange('showTouches', d.checked)} />
                            </div>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.stay_awake')}</Text>
                                <Switch checked={config.stayAwake} onChange={(_, d) => handleSwitchChange('stayAwake', d.checked)} />
                            </div>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.turn_screen_off')}</Text>
                                <Switch checked={config.turnScreenOff} onChange={(_, d) => handleSwitchChange('turnScreenOff', d.checked)} />
                            </div>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.power_off_on_close')}</Text>
                                <Switch checked={config.powerOffOnClose} onChange={(_, d) => handleSwitchChange('powerOffOnClose', d.checked)} />
                            </div>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.audio_enabled')}</Text>
                                <Switch checked={config.audioEnabled} onChange={(_, d) => handleSwitchChange('audioEnabled', d.checked)} />
                            </div>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.always_on_top')}</Text>
                                <Switch checked={config.alwaysOnTop} onChange={(_, d) => handleSwitchChange('alwaysOnTop', d.checked)} />
                            </div>
                            <div className={styles.switchTile}>
                                <Text className={styles.switchLabel}>{t('mirror.control_enabled')}</Text>
                                <Switch checked={config.controlEnabled} onChange={(_, d) => handleSwitchChange('controlEnabled', d.checked)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main ScreenMirrorPanel Component ---
interface ScreenMirrorPanelProps {
    device: DeviceInfo | null;
    onAdbRequired: () => void;
}

const ScreenMirrorPanel: React.FC<ScreenMirrorPanelProps> = ({ device, onAdbRequired }) => {
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
        setActiveSessions,
        addActiveSession,
        removeActiveSession,
        canStartMirroring,
        isDeviceStreaming,
        handleProcessTerminated,
    } = useScreenMirrorStore();

    const [supportedDevices, setSupportedDevices] = useState<ScreenMirrorDevice[]>([]);
    const lastCheckedDevicesRef = useRef<string>('');
    const isCheckingRef = useRef<boolean>(false);

    const connectedDevices = devices.filter(d => d.connected);

    useEffect(() => {
        const syncSessions = async () => {
            try {
                const backendSessions = await ScreenMirrorService.getActiveSessions();
                if (backendSessions.length > 0) setActiveSessions(backendSessions);
            } catch (err) {
                console.error("Failed to sync screen mirror sessions:", err);
            }
        };
        syncSessions();
    }, [setActiveSessions]);

    const streamingDevices = activeSessions
        .filter(session => isDeviceStreaming(session.deviceSerial))
        .map(session => session.deviceSerial);

    useEffect(() => {
        const deviceSerialsKey = connectedDevices.map(d => d.serial).sort().join(',');
        if (deviceSerialsKey === lastCheckedDevicesRef.current || isCheckingRef.current) return;

        const prepareDevicesForMirroring = async () => {
            if (connectedDevices.length === 0) {
                setSupportedDevices([]);
                lastCheckedDevicesRef.current = '';
                setLoading(false);
                return;
            }
            isCheckingRef.current = true;
            setLoading(true);
            try {
                const supported = connectedDevices.map(device => ({
                    serial: device.serial,
                    name: device.properties?.marketName || device.properties?.productName || t('mirror.default_dev_name', { serial: device.serial.substring(0, 8) }),
                    model: device.properties?.model || t('mirror.unknown_model'),
                    resolution: "1920x1080",
                    density: 480,
                    orientation: "portrait",
                    isSupported: true,
                    supportedCodecs: ["h264", "h265"]
                }));
                setSupportedDevices(supported as ScreenMirrorDevice[]);
                lastCheckedDevicesRef.current = deviceSerialsKey;
                if (mirrorDevice && !supported.find(d => d.serial === mirrorDevice.serial)) selectDevice(null);
            } catch (error) {
                console.error("Failed to prepare devices for mirroring:", error);
                setError(t('mirror.error_preparing'));
            } finally {
                setLoading(false);
                isCheckingRef.current = false;
            }
        };
        prepareDevicesForMirroring();
    }, [connectedDevices.length]);

    const handleStartMirror = async (device: ScreenMirrorDevice) => {
        if (!device || !canStartMirroring(device.serial)) return;
        const realDevice = connectedDevices.find(d => d.serial === device.serial);
        if (realDevice && realDevice.mode !== 'sys' && realDevice.mode !== 'rec') {
            onAdbRequired();
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const session = await ScreenMirrorService.startMirror(device.serial, config, (sessionId) => {
                handleProcessTerminated(sessionId);
                ScreenMirrorService.stopMirror(device.serial).catch(console.error);
            });
            addActiveSession(session);
        } catch (error: any) {
            console.error("Failed to start screen mirror:", error);
            setError(t('mirror.start_failed', { error: String(error) }));
        } finally {
            setLoading(false);
        }
    };

    const handleDeviceSelect = async (device: ScreenMirrorDevice | null) => {
        if (device && isDeviceStreaming(device.serial)) return;
        selectDevice(device);
        if (device && !isDeviceStreaming(device.serial)) await handleStartMirror(device);
    };

    const handleDeviceAction = async (device: ScreenMirrorDevice) => {
        if (isDeviceStreaming(device.serial)) {
            const session = activeSessions.find(s => s.deviceSerial === device.serial);
            if (session) await handleStopMirror(session.id);
        } else {
            await handleStartMirror(device);
        }
    };

    const handleStopMirror = async (sessionId: string) => {
        const session = activeSessions.find(s => s.id === sessionId);
        if (!session) return;
        setLoading(true);
        try {
            await ScreenMirrorService.stopMirror(session.deviceSerial);
            removeActiveSession(session.id);
        } catch (error: any) {
            console.error("Failed to stop screen mirror:", error);
            setError(t('mirror.stop_failed', { error: String(error) }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {error && (
                <div style={{ padding: "8px 12px", borderRadius: "8px", backgroundColor: "var(--colorPaletteRedBackground1)", border: "1px solid var(--colorPaletteRedBorder1)" }}>
                    <Text style={{ color: "var(--colorPaletteRedForeground1)", fontSize: "13px" }}>{error}</Text>
                </div>
            )}
            <div style={{ flex: 1, minHeight: 0 }}>
                <MirrorControlCard
                    devices={supportedDevices}
                    selectedDevice={mirrorDevice}
                    onSelectDevice={handleDeviceSelect}
                    onDeviceAction={handleDeviceAction}
                    isLoading={isLoading}
                    streamingDevices={streamingDevices}
                    activeSessions={activeSessions}
                    onStopMirror={handleStopMirror}
                />
            </div>
        </div>
    );
};

export default ScreenMirrorPanel;
