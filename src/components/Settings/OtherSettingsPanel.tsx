import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Select,
  Slider,
  Button,
  Checkbox,
} from "@fluentui/react-components";
import {
  Options24Regular,
  WeatherMoon24Regular,
  Globe24Regular,
  Speaker224Regular,
  Eye24Regular,
  Save24Regular,
  ArrowReset24Regular,
  Accessibility24Regular,
} from "@fluentui/react-icons";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    height: "100%",
    overflow: "auto",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  card: {
    height: "fit-content",
  },
  cardContent: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  settingInfo: {
    flex: 1,
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderValue: {
    textAlign: "center",
    fontWeight: "600",
    color: "var(--colorBrandForeground1)",
  },
});

const OtherSettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { config, updateConfig } = useAppStore();
  
  // 界面设置状态
  const [fontSize, setFontSize] = useState(14);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableSounds, setEnableSounds] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [startWithSystem, setStartWithSystem] = useState(false);

  const handleThemeChange = () => {
    toggleTheme();
    updateConfig({ theme: isDarkMode ? "light" : "dark" });
  };

  const handleLanguageChange = (value: string) => {
    updateConfig({ language: value as "zh-CN" | "en-US" });
  };

  const handleSaveSettings = () => {
    // TODO: 保存所有设置到配置文件
    console.log("保存设置");
  };

  const handleResetSettings = () => {
    // TODO: 重置所有设置到默认值
    console.log("重置设置");
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* 语言和地区 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Globe24Regular />}
            header={<Text weight="semibold">语言和地区</Text>}
            description={<Text size={200}>语言、时区和本地化设置</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="界面语言:">
              <Select
                value={config.language}
                onChange={(_, data) => handleLanguageChange(data.value)}
              >
                <option value="zh-CN">简体中文</option>
                <option value="zh-CN">Chinese</option>
              </Select>
            </Field>

            <Field label="日期格式:">
              <Select defaultValue="yyyy-mm-dd">
                <option value="yyyy-mm-dd">2024-01-01</option>
              </Select>
            </Field>

            <Field label="时间格式:">
              <Select defaultValue="24h">
                <option value="24h">24小时制</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* 通知和声音
        <Card className={styles.card}>
          <CardHeader
            image={<Speaker224Regular />}
            header={<Text weight="semibold">通知和声音</Text>}
            description={<Text size={200}>提醒和音效设置</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">启用声音效果</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  操作完成时播放提示音
                </Text>
              </div>
              <Switch
                checked={enableSounds}
                onChange={(_, data) => setEnableSounds(data.checked === true)}
              />
            </div>


            <Field label="通知类型:">
              <div className={styles.checkboxGroup}>
                <Checkbox label="操作完成通知" defaultChecked />
                <Checkbox label="错误警告通知" defaultChecked />
                <Checkbox label="设备连接通知" defaultChecked />
                <Checkbox label="更新提醒通知" />
              </div>
            </Field>
          </div>
        </Card> */}

        {/* 行为设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Accessibility24Regular />}
            header={<Text weight="semibold">行为设置</Text>}
            description={<Text size={200}>应用行为和启动选项</Text>}
          />

          <div className={styles.cardContent}>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">最小化到系统托盘</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  关闭窗口时最小化到托盘
                </Text>
              </div>
              <Switch
                checked={minimizeToTray}
                onChange={(_, data) => setMinimizeToTray(data.checked === true)}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">开机自启动</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  系统启动时自动运行应用
                </Text>
              </div>
              <Switch
                checked={startWithSystem}
                onChange={(_, data) => setStartWithSystem(data.checked === true)}
              />
            </div>
          </div>
        </Card>


      </div>
    </div>
  );
};

export default OtherSettingsPanel;
