import React  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Dropdown,
  Option,
  Switch,
  Slider,
  Button,
  Field,
} from "@fluentui/react-components";
import {
  ArrowReset24Regular,
} from "@fluentui/react-icons";
import { useScreenMirrorStore } from "../../stores/screenMirrorStore";
import { SCREEN_MIRROR_QUALITY_PRESETS } from "../../types/screenMirror";

const useStyles = makeStyles({
  card: {
    height: "fit-content",
  },
  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: "4px",
  },
  fieldRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  fieldLabel: {
    flex: 1,
  },
  fieldControl: {
    minWidth: "120px",
  },
  sliderContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  sliderLabel: {
    minWidth: "80px",
    fontSize: "14px",
  },
  sliderValue: {
    minWidth: "60px",
    textAlign: "right",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  actions: {
    display: "flex",
    gap: "8px",
    paddingTop: "8px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
});

const SettingsCard: React.FC = () => {
  const styles = useStyles();
  const { config, updateConfig, resetConfig, applyQualityPreset } = useScreenMirrorStore();

  const handleQualityPresetChange = (preset: string) => {
    applyQualityPreset(preset);
  };

  const handleResolutionChange = (resolution: string) => {
    updateConfig({
      quality: {
        ...config.quality,
        resolution,
      },
    });
  };

  const handleBitrateChange = (bitrate: number) => {
    updateConfig({
      quality: {
        ...config.quality,
        bitrate,
      },
    });
  };

  const handleFramerateChange = (framerate: number) => {
    updateConfig({
      quality: {
        ...config.quality,
        framerate,
      },
    });
  };

  const handleCodecChange = (codec: "h264" | "h265") => {
    updateConfig({
      quality: {
        ...config.quality,
        codec,
      },
    });
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    updateConfig({
      [field]: checked,
    });
  };

  const handleTextChange = (field: string, value: string) => {
    updateConfig({
      [field]: value,
    });
  };

  const handleNumberChange = (field: string, value: number) => {
    updateConfig({
      [field]: value,
    });
  };

  const handleOrientationChange = (orientation: "unlocked" | "initial" | "portrait" | "landscape") => {
    updateConfig({
      lockVideoOrientation: orientation,
    });
  };

  const resolutionOptions = [
    { value: "auto", label: "自动" },
    { value: "1920x1080", label: "1920x1080 (FHD)" },
    { value: "1280x720", label: "1280x720 (HD)" },
    { value: "854x480", label: "854x480 (WVGA)" },
    { value: "640x360", label: "640x360 (nHD)" },
  ];

  const codecOptions = [
    { value: "h264", label: "H.264" },
    { value: "h265", label: "H.265" },
  ];

  const orientationOptions = [
    { value: "unlocked", label: "不锁定" },
    { value: "initial", label: "初始方向" },
    { value: "portrait", label: "竖屏" },
    { value: "landscape", label: "横屏" },
  ];

  const rotationOptions = [
    { value: 0, label: "0°" },
    { value: 1, label: "90°" },
    { value: 2, label: "180°" },
    { value: 3, label: "270°" },
  ];

  const qualityPresetOptions = Object.keys(SCREEN_MIRROR_QUALITY_PRESETS).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }));

  return (
    <Card className={styles.card}>
      <CardHeader
        header={<Text weight="semibold">投屏设置</Text>}
        description="调整投屏质量和行为选项"
      />
      
      <div className={styles.content}>
        {/* 质量预设 */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>质量预设</Text>
          <Field label="选择预设">
            <Dropdown
              placeholder="选择质量预设"
              value="high"
              onOptionSelect={(_, data) => handleQualityPresetChange(data.optionValue as string)}
            >
              {qualityPresetOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </div>

        {/* 视频质量 */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>视频质量</Text>
          
          <Field label="分辨率">
            <Dropdown
              value={config.quality.resolution}
              onOptionSelect={(_, data) => handleResolutionChange(data.optionValue as string)}
            >
              {resolutionOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>

          <div className={styles.sliderContainer}>
            <div className={styles.sliderRow}>
              <Text className={styles.sliderLabel}>比特率:</Text>
              <Slider
                min={1}
                max={20}
                step={1}
                value={config.quality.bitrate}
                onChange={(_, data) => handleBitrateChange(data.value)}
                style={{ flex: 1 }}
              />
              <Text className={styles.sliderValue}>{config.quality.bitrate} Mbps</Text>
            </div>

            <div className={styles.sliderRow}>
              <Text className={styles.sliderLabel}>帧率:</Text>
              <Slider
                min={15}
                max={60}
                step={5}
                value={config.quality.framerate}
                onChange={(_, data) => handleFramerateChange(data.value)}
                style={{ flex: 1 }}
              />
              <Text className={styles.sliderValue}>{config.quality.framerate} fps</Text>
            </div>
          </div>

          <Field label="编码格式">
            <Dropdown
              value={config.quality.codec}
              onOptionSelect={(_, data) => handleCodecChange(data.optionValue as "h264" | "h265")}
            >
              {codecOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </div>

        {/* 行为选项 */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>行为选项</Text>
          
          <div className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>显示触摸点</Text>
            <Switch
              checked={config.showTouches}
              onChange={(_, data) => handleSwitchChange('showTouches', data.checked)}
            />
          </div>

          <div className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>保持屏幕常亮</Text>
            <Switch
              checked={config.stayAwake}
              onChange={(_, data) => handleSwitchChange('stayAwake', data.checked)}
            />
          </div>

          <div className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>投屏时关闭设备屏幕</Text>
            <Switch
              checked={config.turnScreenOff}
              onChange={(_, data) => handleSwitchChange('turnScreenOff', data.checked)}
            />
          </div>

          <div className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>关闭时关机</Text>
            <Switch
              checked={config.powerOffOnClose}
              onChange={(_, data) => handleSwitchChange('powerOffOnClose', data.checked)}
            />
          </div>

          <div className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>启动时不开机</Text>
            <Switch
              checked={config.noPowerOn}
              onChange={(_, data) => handleSwitchChange('noPowerOn', data.checked)}
            />
          </div>


          <div className={styles.fieldRow}>
            <Text className={styles.fieldLabel}>全屏模式</Text>
            <Switch
              checked={config.fullscreen}
              onChange={(_, data) => handleSwitchChange('fullscreen', data.checked)}
            />
          </div>
        </div>


        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            appearance="subtle"
            icon={<ArrowReset24Regular />}
            onClick={resetConfig}
          >
            重置为默认
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SettingsCard;
