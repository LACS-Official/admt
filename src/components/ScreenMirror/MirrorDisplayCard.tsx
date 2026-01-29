import React, {  useState } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  FullScreenMaximize24Regular,
  Record24Regular,
  RecordStop24Regular,
  Desktop24Regular,
  Screenshot24Regular,
  PhoneDesktop24Regular,
  Info24Regular,
  Stop24Regular,
} from "@fluentui/react-icons";
import { ScreenMirrorSession } from "../../types/screenMirror";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
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
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
    padding: "32px",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "12px",
    padding: "8px 0",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  controlsLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  controlsRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  fullscreenOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenCanvas: {
    maxWidth: "100vw",
    maxHeight: "100vh",
    objectFit: "contain",
  },
  fullscreenControls: {
    position: "absolute",
    top: "16px",
    right: "16px",
    display: "flex",
    gap: "8px",
  },
});

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

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: 实现录制功能
  };

  const handleTakeScreenshot = async () => {
    try {
      // TODO: 实现截图功能
      console.log('Taking screenshot...');
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  const handleOpenScrcpyWindow = () => {
    // 提示用户查找scrcpy窗口
    alert(t('mirror.scrcpy_hint'));
  };

  const formatDuration = (startTime?: Date) => {
    if (!startTime) return "00:00";
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const displayContent = (
    <>
      <div className={styles.displayContainer}>
        {session.status === 'streaming' ? (
          <div className={styles.mirrorPlaceholder}>
            <Desktop24Regular style={{ fontSize: "48px", color: "var(--colorBrandBackground)" }} />
            <Text size={500} weight="semibold">{t('mirror.mirror_started')}</Text>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
              {t('mirror.mirror_new_window')}
            </Text>

            <div className={styles.infoCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size={300} weight="semibold">{t('mirror.device_info')}</Text>
                <Badge appearance="filled" color="success">{t('mirror.connected')}</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.device_name_label')}</Text>
                  <Text size={200}>{session.deviceName || t('mirror.unknown_device')}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.device_serial_label')}</Text>
                  <Text size={200}>{session.deviceSerial}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.duration_label')}</Text>
                  <Text size={200}>{formatDuration(session.startTime)}</Text>
                </div>
                {session.config.quality && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.resolution_label')}</Text>
                      <Text size={200}>{session.config.quality.resolution}</Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.framerate')}:</Text>
                      <Text size={200}>{session.config.quality.framerate}fps</Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.bitrate_label')}</Text>
                      <Text size={200}>{session.config.quality.bitrate}Mbps</Text>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <Button
                appearance="subtle"
                icon={<PhoneDesktop24Regular />}
                onClick={handleOpenScrcpyWindow}
                size="small"
              >
                {t('mirror.find_window')}
              </Button>
              <Button
                appearance="subtle"
                icon={<Screenshot24Regular />}
                onClick={handleTakeScreenshot}
                size="small"
              >
                {t('mirror.screenshot')}
              </Button>
              <Button
                appearance="subtle"
                icon={isRecording ? <RecordStop24Regular /> : <Record24Regular />}
                onClick={handleToggleRecording}
                size="small"
              >
                {isRecording ? t('mirror.stop_record') : t('mirror.record')}
              </Button>
              <Button
                appearance="subtle"
                icon={<Info24Regular />}
                onClick={() => setShowDetails(!showDetails)}
                size="small"
              >
                {showDetails ? t('mirror.hide_details') : t('mirror.show_details')}
              </Button>
            </div>

            {showDetails && (
              <div className={styles.detailsCard}>
                <Text size={300} weight="semibold" style={{ marginBottom: "8px" }}>{t('mirror.mirror_config')}</Text>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.show_touches_label')}</Text>
                    <Text size={200}>{session.config.showTouches ? t('common.on') : t('common.off')}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.stay_awake_label')}</Text>
                    <Text size={200}>{session.config.stayAwake ? t('common.on') : t('common.off')}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.audio_label')}</Text>
                    <Text size={200}>{session.config.audioEnabled ? t('common.on') : t('common.off')}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('mirror.control_label')}</Text>
                    <Text size={200}>{session.config.controlEnabled ? t('common.on') : t('common.off')}</Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.mirrorPlaceholder}>
            <Spinner size="medium" />
            <Text size={400}>{t('mirror.connecting_device')}</Text>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
              {t('mirror.connecting_hint')}
            </Text>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <div className={styles.statusInfo}>
            <Badge appearance="filled" color="success">
              {session.status === 'streaming' ? t('mirror.mirroring') : t('mirror.connecting')}
            </Badge>
            <Text size={200}>
              {formatDuration(session.startTime)}
            </Text>
            {session.config.quality && (
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {session.config.quality.resolution} • {session.config.quality.framerate}fps
              </Text>
            )}
          </div>
        </div>

        <div className={styles.controlsRight}>
            <Button
              appearance="subtle"
              icon={isRecording ? <RecordStop24Regular /> : <Record24Regular />}
              onClick={handleToggleRecording}
            >
              {isRecording ? t('mirror.stop_record') : t('mirror.start_record')}
            </Button>
            
            {onStopMirror && (
              <Button
                appearance="subtle"
                icon={<Stop24Regular />}
                onClick={onStopMirror}
              >
                {t('mirror.stop_mirror')}
              </Button>
            )}
            
            {!isFullscreen && (
              <Button
                appearance="subtle"
                icon={<FullScreenMaximize24Regular />}
                onClick={toggleFullscreen}
              >
                {t('mirror.fullscreen')}
              </Button>
            )}
        </div>
      </div>
    </>
  );

  if (isFullscreen) {
    return (
      <div className={styles.fullscreenOverlay}>
        {displayContent}
      </div>
    );
  }

};

export default MirrorDisplayCard;
