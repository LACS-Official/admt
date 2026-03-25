import React, { useEffect, useRef, useState } from 'react';
import {
    makeStyles,
    Text,
    Card,
    Badge,
    Spinner,
    Button,
    Dropdown,
    Option,
    Switch,
    Slider,
    Field,
    Divider,
    mergeClasses,
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
    Desktop24Regular,
    Screenshot24Regular,
    PhoneDesktop24Regular,
    Info24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { 
    ScreenMirrorDevice, 
    SCREEN_MIRROR_QUALITY_PRESETS,
    ScreenMirrorSession 
} from "../../types/screenMirror";
import ScreenMirrorService from "../../services/screenMirrorService";
import { DeviceInfo } from "../../types/device";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
    container: {
        height: "100%",
        overflow: "auto",
    },
    content: {
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "16px",
        height: "calc(100% - 20px)",
    },
    fullWidth: {
        gridColumn: "1 / -1",
    },
    sessionsContainer: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px",
    },
    // MirrorControlCard Styles
    controlCard: {
        height: "100%",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
        backgroundColor: "var(--colorNeutralBackground2)",
    },
    rightPane: {
        padding: "16px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        backgroundColor: "var(--colorNeutralBackground1)",
        borderRadius: "8px",
        border: "1px solid var(--colorNeutralStroke2)",
        height: "100%",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px",
        color: "var(--colorNeutralForeground1)",
        fontWeight: "600",
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
        padding: "8px 12px",
        border: "1px solid var(--colorNeutralStroke2)",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backgroundColor: "var(--colorNeutralBackground1)",
        "&:hover": {
            backgroundColor: "var(--colorNeutralBackground1Hover)",
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
    loadingContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "16px",
    },
    settingsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
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
    // MirrorDisplayCard Styles
    displayCard: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
    },
    displayContainer: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--colorNeutralBackground1)",
        borderRadius: "8px",
        border: "1px solid var(--colorNeutralStroke2)",
        position: "relative",
        overflow: "hidden",
        minHeight: "400px",
    },
    mirrorPlaceholder: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "16px",
        textAlign: "center",
        padding: "24px",
        height: "100%",
        width: "100%",
        overflowY: "auto",
    },
    infoCard: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        backgroundColor: "var(--colorNeutralBackground2)",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "450px",
        border: "1px solid var(--colorNeutralStroke2)",
    },
    detailsCard: {
        padding: "12px",
        backgroundColor: "var(--colorNeutralBackground3)",
        borderRadius: "6px",
        width: "100%",
        maxWidth: "450px",
        border: "1px solid var(--colorNeutralStroke2)",
    },
    buttonGroup: {
        display: "flex",
        gap: "8px",
        marginTop: "16px",
        flexWrap: "wrap",
        justifyContent: "center",
    },
    controls: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "12px",
        padding: "8px 0",
        borderTop: "1px solid var(--colorNeutralStroke2)",
    },
    statusInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    controlsRight: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
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
        if (selectedDevice?.serial === device.serial) {
            onSelectDevice(null);
        } else {
            onSelectDevice(device);
        }
    };

    const isDeviceStreaming = (serial: string) => streamingDevices.includes(serial);

    const handleQualityPresetChange = (preset: string) => applyQualityPreset(preset);
    const handleResolutionChange = (resolution: string) => updateConfig({ quality: { ...config.quality, resolution } });
    const handleBitrateChange = (bitrate: number) => updateConfig({ quality: { ...config.quality, bitrate } });
    const handleFramerateChange = (framerate: number) => updateConfig({ quality: { ...config.quality, framerate } });
    const handleCodecChange = (codec: "h264" | "h265") => updateConfig({ quality: { ...config.quality, codec } });
    const handleSwitchChange = (field: string, checked: boolean) => updateConfig({ [field]: checked });

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
        /**  投屏设置**/
        <div className={styles.mainLayout}>
            <div className={styles.leftPane}>
                <div className={styles.sectionHeader}>
                    <Phone24Regular />
                    <Text weight="semibold" size={400}>{t('mirror.device_selection_title')}</Text>
                    <Badge appearance="tint" color="brand" style={{ marginLeft: 'auto' }}>
                        {t('mirror.devices_available', { count: devices.length })}
                    </Badge>
                </div>

                {isLoading ? (
                    <div className={styles.loadingContainer}>
                        <Spinner size="small" />
                        <Text size={300}>{t('mirror.checking_support')}</Text>
                    </div>
                ) : devices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--colorNeutralForeground3)' }}>
                        <Text size={300}>{t('mirror.no_devices')}</Text>
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
                                        <Button appearance="primary" size="small" icon={<Play24Regular />} onClick={(e) => { e.stopPropagation(); onDeviceAction(device); }}>
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

            <div className={styles.rightPane}>
                <div className={styles.sectionHeader}>
                    <Settings24Regular />
                    <Text weight="semibold" size={400}>{t('mirror.settings_title')}</Text>
                    <Button style={{ marginLeft: 'auto' }} size="small" appearance="subtle" icon={<ArrowReset24Regular />} onClick={resetConfig}>
                        {t('mirror.reset_to_default')}
                    </Button>
                </div>

                <div className={styles.settingsContainer}>
                    <div>
                        <Text className={styles.sectionTitle} style={{ marginBottom: '12px', display: 'block' }}>{t('mirror.video_quality')}</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Field label={t('mirror.quality_preset')} size="small">
                                <Dropdown
                                    value={qualityPresetOptions.find(p => p.value === 'high')?.label || "High"}
                                    placeholder={t('mirror.select_quality_placeholder')}
                                    onOptionSelect={(_, d) => handleQualityPresetChange(d.optionValue as string)}
                                >
                                    {qualityPresetOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                                </Dropdown>
                            </Field>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <Field label={t('mirror.resolution')} size="small" style={{ flex: 1 }}>
                                    <Dropdown
                                        value={config.quality.resolution}
                                        onOptionSelect={(_, d) => handleResolutionChange(d.optionValue as string)}
                                    >
                                        {resolutionOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                                    </Dropdown>
                                </Field>
                                <Field label={t('mirror.codec')} size="small" style={{ flex: 1 }}>
                                    <Dropdown
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
                                <Text className={styles.sliderValue}>{config.quality.bitrate} Mbps</Text>
                            </div>
                            <div className={styles.sliderRow}>
                                <Text className={styles.sliderLabel}>{t('mirror.framerate')}</Text>
                                <Slider min={15} max={60} step={5} value={config.quality.framerate} onChange={(_, d) => handleFramerateChange(d.value)} style={{ flex: 1 }} />
                                <Text className={styles.sliderValue}>{config.quality.framerate} fps</Text>
                            </div>
                        </div>
                    </div>
                    <Divider style={{ margin: '16px 0' }} />
                    <div>
                        <Text className={styles.sectionTitle} style={{ marginBottom: '12px', display: 'block' }}>{t('mirror.behavior_options')}</Text>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
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
    );
};

// --- Internal MirrorDisplayCard Component ---
interface MirrorDisplayCardProps {
    session: ScreenMirrorSession;
    onStopMirror?: () => void;
}

const MirrorDisplayCard: React.FC<MirrorDisplayCardProps> = ({ session, onStopMirror }) => {
    const styles = useStyles();
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const { isFullscreen, toggleFullscreen } = useScreenMirrorStore();

    const handleToggleRecording = () => setIsRecording(!isRecording);
    const handleTakeScreenshot = () => console.log('Taking screenshot...');
    const handleOpenScrcpyWindow = () => alert(t('mirror.scrcpy_hint'));

    const formatDuration = (startTime?: Date) => {
        if (!startTime) return "00:00";
        const now = new Date();
        const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
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
                <div style={{ marginBottom: "16px" }}>
                    <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>
                </div>
            )}
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
        </div>
    );
};

export default ScreenMirrorPanel;
