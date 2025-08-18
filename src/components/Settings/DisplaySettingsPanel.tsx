import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Select,
  Option,
  Slider,
  Label,
  Field,
} from "@fluentui/react-components";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import {
  Grid24Regular,
  Eye24Regular,
  WeatherMoon24Regular,
} from "@fluentui/react-icons";

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
  fullWidthCard: {
    gridColumn: "1 / -1",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  settingLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  settingDescription: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  sliderGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderValue: {
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  settingInfo: {
    flex: 1,
  },  sliderContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
});

const DisplaySettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { updateConfig } = useAppStore();
  
  // 界面设置状态
  const [fontSize, setFontSize] = useState(14);
  const [enableAnimations, setEnableAnimations] = useState(true);

  const handleThemeChange = () => {
    toggleTheme();
    updateConfig({ theme: isDarkMode ? "light" : "dark" });
  };



  return (
    <div className={styles.container}>
      <div className={styles.content}>

            {/* 外观设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<WeatherMoon24Regular />}
            header={<Text weight="semibold">外观</Text>}
            description={<Text size={200}>主题和界面外观设置</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">深色主题</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  切换应用主题外观
                </Text>
              </div>
              <Switch
                checked={isDarkMode}
                onChange={handleThemeChange}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">启用动画效果</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  界面切换和交互动画
                </Text>
              </div>
              <Switch
                checked={enableAnimations}
                onChange={(_, data) => setEnableAnimations(data.checked === true)}
              />
            </div>
          </div>
        </Card>

        {/* 布局设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Grid24Regular />}
            header={<Text weight="semibold">布局设置</Text>}
          />
          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <Label>紧凑模式</Label>
                <Text className={styles.settingDescription}>减少界面元素间距，显示更多内容</Text>
              </div>
              <Switch checked={false} onChange={() => {}} />
            </div>
            
            <div className={styles.inputGroup}>
              <Label>侧边栏位置</Label>
              <Select>
                <Option value="left">左侧</Option>
                <Option value="right">右侧</Option>
                <Option value="top">顶部</Option>
                <Option value="bottom">底部</Option>
              </Select>
            </div>
            
            <div className={styles.inputGroup}>
              <Label>主内容区域宽度</Label>
              <Select>
                <Option value="narrow">窄</Option>
                <Option value="normal">正常</Option>
                <Option value="wide">宽</Option>
                <Option value="full">全宽</Option>
              </Select>
            </div>
          </div>
        </Card>



      </div>
    </div>
  );
};

export default DisplaySettingsPanel;