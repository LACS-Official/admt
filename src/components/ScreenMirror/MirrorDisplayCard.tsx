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
} from "@fluentui/react-icons";
import { ScreenMirrorSession } from "../../types/screenMirror";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";

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
}

const MirrorDisplayCard: React.FC<MirrorDisplayCardProps> = ({ session }) => {
  const styles = useStyles();
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
    alert('请在任务栏或桌面上查找scrcpy投屏窗口');
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
            <Text size={500} weight="semibold">投屏已启动</Text>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
              投屏窗口已在独立窗口中打开
            </Text>

            <div className={styles.infoCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text size={300} weight="semibold">设备信息</Text>
                <Badge appearance="filled" color="success">已连接</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>设备名称:</Text>
                  <Text size={200}>{session.deviceName || "未知设备"}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>设备序列号:</Text>
                  <Text size={200}>{session.deviceSerial}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>投屏时长:</Text>
                  <Text size={200}>{formatDuration(session.startTime)}</Text>
                </div>
                {session.config.quality && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>分辨率:</Text>
                      <Text size={200}>{session.config.quality.resolution}</Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>帧率:</Text>
                      <Text size={200}>{session.config.quality.framerate}fps</Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>码率:</Text>
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
                查找投屏窗口
              </Button>
              <Button
                appearance="subtle"
                icon={<Screenshot24Regular />}
                onClick={handleTakeScreenshot}
                size="small"
              >
                截图
              </Button>
              <Button
                appearance="subtle"
                icon={isRecording ? <RecordStop24Regular /> : <Record24Regular />}
                onClick={handleToggleRecording}
                size="small"
              >
                {isRecording ? '停止录制' : '录制'}
              </Button>
              <Button
                appearance="subtle"
                icon={<Info24Regular />}
                onClick={() => setShowDetails(!showDetails)}
                size="small"
              >
                {showDetails ? '隐藏详情' : '显示详情'}
              </Button>
            </div>

            {showDetails && (
              <div className={styles.detailsCard}>
                <Text size={300} weight="semibold" style={{ marginBottom: "8px" }}>投屏配置</Text>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>显示触摸:</Text>
                    <Text size={200}>{session.config.showTouches ? '开启' : '关闭'}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>保持唤醒:</Text>
                    <Text size={200}>{session.config.stayAwake ? '开启' : '关闭'}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>音频传输:</Text>
                    <Text size={200}>{session.config.audioEnabled ? '开启' : '关闭'}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>触摸控制:</Text>
                    <Text size={200}>{session.config.controlEnabled ? '开启' : '关闭'}</Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.mirrorPlaceholder}>
            <Spinner size="medium" />
            <Text size={400}>正在连接设备...</Text>
            <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
              请稍候，正在建立投屏连接
            </Text>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlsLeft}>
          <div className={styles.statusInfo}>
            <Badge appearance="filled" color="success">
              {session.status === 'streaming' ? '投屏中' : '连接中'}
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
            {isRecording ? '停止录制' : '开始录制'}
          </Button>
          
          {!isFullscreen && (
            <Button
              appearance="subtle"
              icon={<FullScreenMaximize24Regular />}
              onClick={toggleFullscreen}
            >
              全屏
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
