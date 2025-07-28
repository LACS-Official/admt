import React from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Badge,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  Home24Regular,
  Apps24Regular,
  Speaker224Regular,
  SpeakerMute24Regular,
  Power24Regular,
  Screenshot24Regular,
} from "@fluentui/react-icons";
import { ScreenMirrorSession } from "../../types/screenMirror";
import ScreenMirrorService from "../../services/screenMirrorService";

const useStyles = makeStyles({
  card: {
    height: "fit-content",
  },
  content: {
    padding: "16px",
  },
  controlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  },
  controlButton: {
    height: "48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  buttonText: {
    fontSize: "11px",
  },
  quickActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionButton: {
    flex: "1",
    minWidth: "120px",
  },
  statsSection: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    marginTop: "8px",
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

interface ControlPanelCardProps {
  session: ScreenMirrorSession;
}

const ControlPanelCard: React.FC<ControlPanelCardProps> = ({ session }) => {
  const styles = useStyles();



  const handleKeyPress = async (key: keyof typeof ScreenMirrorService.KeyCodes) => {
    if (!isControlEnabled) return;

    try {
      await ScreenMirrorService.sendCommonKey(session.id, key);
      console.log(`Key press sent: ${key}`);
    } catch (error) {
      console.error(`Failed to send key press:`, error);
    }
  };

  const handleScreenshot = async () => {
    try {
      const result = await ScreenMirrorService.takeScreenshot(session.id);
      if (result) {
        console.log("Screenshot taken:", result);
        // TODO: 处理截图结果，比如保存或显示
      } else {
        console.log("Screenshot feature not implemented yet");
      }
    } catch (error) {
      console.error(`Failed to take screenshot:`, error);
    }
  };

  const isControlEnabled = session.config.controlEnabled && session.status === 'streaming';

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Text weight="semibold">设备控制</Text>}
        description={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Text size={200}>
              {isControlEnabled ? "控制已启用" : "控制已禁用"}
            </Text>
            <Badge 
              appearance="filled" 
              color={isControlEnabled ? "success" : "subtle"}
              size="small"
            >
              {isControlEnabled ? "可控制" : "只读"}
            </Badge>
          </div>
        }
      />
      
      <div className={styles.content}>
        {/* 导航控制 */}
        <div className={styles.controlGrid}>
          <Button
            className={styles.controlButton}
            appearance="outline"
            onClick={() => handleKeyPress("BACK")}
            disabled={!isControlEnabled}
          >
            <ArrowLeft24Regular />
            <Text className={styles.buttonText}>返回</Text>
          </Button>

          <Button
            className={styles.controlButton}
            appearance="outline"
            onClick={() => handleKeyPress("HOME")}
            disabled={!isControlEnabled}
          >
            <Home24Regular />
            <Text className={styles.buttonText}>主页</Text>
          </Button>

          <Button
            className={styles.controlButton}
            appearance="outline"
            onClick={() => handleKeyPress("APP_SWITCH")}
            disabled={!isControlEnabled}
          >
            <Apps24Regular />
            <Text className={styles.buttonText}>多任务</Text>
          </Button>

          <Button
            className={styles.controlButton}
            appearance="outline"
            onClick={() => handleKeyPress("VOLUME_UP")}
            disabled={!isControlEnabled}
          >
            <Speaker224Regular />
            <Text className={styles.buttonText}>音量+</Text>
          </Button>

          <Button
            className={styles.controlButton}
            appearance="outline"
            onClick={() => handleKeyPress("VOLUME_DOWN")}
            disabled={!isControlEnabled}
          >
            <SpeakerMute24Regular />
            <Text className={styles.buttonText}>音量-</Text>
          </Button>

          <Button
            className={styles.controlButton}
            appearance="outline"
            onClick={() => handleKeyPress("POWER")}
            disabled={!isControlEnabled}
          >
            <Power24Regular />
            <Text className={styles.buttonText}>电源</Text>
          </Button>
        </div>

        {/* 快捷操作 */}
        <div className={styles.quickActions}>
          <Button
            className={styles.actionButton}
            appearance="subtle"
            icon={<Screenshot24Regular />}
            onClick={handleScreenshot}
          >
            截图
          </Button>
        </div>

        {/* 连接统计 */}
        <div className={styles.statsSection}>
          <Text size={300} weight="semibold">连接信息</Text>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <Text size={200}>状态:</Text>
              <Badge 
                appearance="filled" 
                color={session.status === 'streaming' ? 'success' : 'warning'}
                size="small"
              >
                {session.status === 'streaming' ? '投屏中' : '连接中'}
              </Badge>
            </div>
            
            <div className={styles.statItem}>
              <Text size={200}>分辨率:</Text>
              <Text size={200}>{session.config.quality.resolution}</Text>
            </div>
            
            <div className={styles.statItem}>
              <Text size={200}>帧率:</Text>
              <Text size={200}>{session.config.quality.framerate} fps</Text>
            </div>
            
            <div className={styles.statItem}>
              <Text size={200}>比特率:</Text>
              <Text size={200}>{session.config.quality.bitrate} Mbps</Text>
            </div>
            
            {session.processId && (
              <div className={styles.statItem}>
                <Text size={200}>进程ID:</Text>
                <Text size={200}>{session.processId}</Text>
              </div>
            )}
            
            {session.serverPort && (
              <div className={styles.statItem}>
                <Text size={200}>端口:</Text>
                <Text size={200}>{session.serverPort}</Text>
              </div>
            )}
          </div>
        </div>

        {/* 配置信息 */}
        <div className={styles.statsSection}>
          <Text size={300} weight="semibold">当前配置</Text>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <Text size={200}>显示触摸:</Text>
              <Badge 
                appearance="outline" 
                color={session.config.showTouches ? 'success' : 'subtle'}
                size="small"
              >
                {session.config.showTouches ? '开启' : '关闭'}
              </Badge>
            </div>
            
            <div className={styles.statItem}>
              <Text size={200}>保持唤醒:</Text>
              <Badge 
                appearance="outline" 
                color={session.config.stayAwake ? 'success' : 'subtle'}
                size="small"
              >
                {session.config.stayAwake ? '开启' : '关闭'}
              </Badge>
            </div>
            
            <div className={styles.statItem}>
              <Text size={200}>音频传输:</Text>
              <Badge 
                appearance="outline" 
                color={session.config.audioEnabled ? 'success' : 'subtle'}
                size="small"
              >
                {session.config.audioEnabled ? '开启' : '关闭'}
              </Badge>
            </div>
            
            <div className={styles.statItem}>
              <Text size={200}>关闭屏幕:</Text>
              <Badge 
                appearance="outline" 
                color={session.config.turnScreenOff ? 'warning' : 'subtle'}
                size="small"
              >
                {session.config.turnScreenOff ? '开启' : '关闭'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ControlPanelCard;
