import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Slider,
  Label,
} from "@fluentui/react-components";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import {
  Grid24Regular,
  WeatherMoon24Regular,
  Timer24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

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
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
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
  },  
  sliderContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "8px",
    width: "100%",
  },
});

const DisplaySettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { isDarkMode, followSystemTheme, toggleTheme, setFollowSystemTheme, updateThemeBasedOnSystem } = useThemeStore();
  const { config, updateConfig } = useAppStore();
  
  // 界面设置状态

  const [enableAnimations, setEnableAnimations] = useState(true);

  // 监听系统主题变化
  useEffect(() => {
    // 初始化时检查是否需要根据系统主题更新
    if (followSystemTheme) {
      updateThemeBasedOnSystem();
    }
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (followSystemTheme) {
        updateThemeBasedOnSystem();
        updateConfig({ 
          theme: mediaQuery.matches ? "dark" : "light" 
        });
      }
    };
    
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [followSystemTheme, updateThemeBasedOnSystem, updateConfig]);

  const handleThemeChange = () => {
    if (!followSystemTheme) {
      toggleTheme();
      updateConfig({ theme: isDarkMode ? "light" : "dark" });
    }
  };

  const handleFollowSystemChange = (_: React.ChangeEvent<HTMLInputElement>, data: { checked: boolean }) => {
    const follow = data.checked === true;
    setFollowSystemTheme(follow);
    
    if (follow) {
      // 如果启用跟随系统，则立即更新主题
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateThemeBasedOnSystem();
      updateConfig({ theme: systemPrefersDark ? "dark" : "light" });
    } else {
      // 如果禁用跟随系统，则保持当前主题设置
      updateConfig({ theme: isDarkMode ? "dark" : "light" });
    }
  };

  const handleCarouselIntervalChange = (_: React.ChangeEvent<HTMLInputElement>, data: { value: number }) => {
    updateConfig({ carouselInterval: data.value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* 外观设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<WeatherMoon24Regular />}
            header={<Text weight="semibold">{t('settings.appearance')}</Text>}
            description={<Text size={200}>{t('settings.appearance_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('settings.dark_mode')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('settings.dark_mode_desc')}
                </Text>
              </div>
              <Switch
                checked={isDarkMode}
                onChange={handleThemeChange}
                disabled={followSystemTheme}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('settings.follow_system')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('settings.follow_system_desc')}
                </Text>
              </div>
              <Switch
                checked={followSystemTheme}
                onChange={handleFollowSystemChange}
              />
            </div>
          </div>
        </Card>

        {/* 动画与交互设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Timer24Regular />}
            header={<Text weight="semibold">{t('settings.animations_interaction')}</Text>}
            description={<Text size={200}>{t('settings.animations_interaction_desc')}</Text>}
          />
          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('settings.enable_animations')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('settings.enable_animations_desc')}
                </Text>
              </div>
              <Switch
                checked={enableAnimations}
                onChange={(_, data) => setEnableAnimations(data.checked === true)}
              />
            </div>

            <div className={styles.sliderContainer}>
              <div className={styles.settingRow} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div className={styles.settingInfo}>
                  <Text weight="semibold">{t('settings.carousel_speed')}</Text>
                  <br />
                  <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                    {t('settings.carousel_speed_desc')}
                  </Text>
                </div>
                <Text className={styles.sliderValue}>
                  {config.carouselInterval ? config.carouselInterval / 1000 : 8} 秒
                </Text>
              </div>
              <Slider
                min={2000}
                max={15000}
                step={500}
                value={config.carouselInterval || 8000}
                onChange={handleCarouselIntervalChange}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: "var(--colorNeutralForeground3)", fontSize: "10px" }}>
                <span>{t('settings.fast')}</span>
                <span>{t('settings.slow')}</span>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default DisplaySettingsPanel;