import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Slider,
  Label,
  RadioGroup,
  Radio,
} from "@fluentui/react-components";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import {
  Grid24Regular,
  WeatherMoon24Regular,
  Timer24Regular,
  Color24Regular,
  ArrowReset24Regular,
  TextFontSize24Regular,
  ShapeOrganic24Regular,
} from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";
import { ChromePicker } from 'react-color';
import { open } from '@tauri-apps/plugin-dialog';
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
  const { 
    isDarkMode, 
    followSystemTheme, 
    setTheme,
    setFollowSystemTheme, 
    updateThemeBasedOnSystem 
  } = useThemeStore();
  const { 
    config, 
    updateConfig 
  } = useAppStore();
  const {
      accentColor, 
      setAccentColor, 
      contentDensity,
      setContentDensity,
      cornerRadius,
      setCornerRadius,
      showConfetti,
      setShowConfetti
  } = useThemeStore();
  
  const [showColorPicker, setShowColorPicker] = useState(false);


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

  const handleThemeRadioChange = (_: unknown, data: { value: string }) => {
    if (data.value === 'system') {
      setFollowSystemTheme(true);
      updateThemeBasedOnSystem();
    } else {
      setFollowSystemTheme(false);
      const isDark = data.value === 'dark';
      setTheme(isDark);
      updateConfig({ theme: isDark ? "dark" : "light" });
    }
  };

  const handleCarouselIntervalChange = (_: React.ChangeEvent<HTMLInputElement>, data: { value: number }) => {
    updateConfig({ carouselInterval: data.value });
  };

  // 计算当前选中的主题值
  const currentThemeValue = followSystemTheme ? 'system' : (isDarkMode ? 'dark' : 'light');

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* 个性化设置 */}
        <Card className={styles.card}>
            <CardHeader
                image={<Color24Regular />}
                header={<Text weight="semibold">{t('settings.personalization', '个性化')}</Text>}
                description={<Text size={200}>{t('settings.personalization_desc', '自定义应用的主题颜色和背景')}</Text>}
            />
            <div className={styles.cardContent}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <Text weight="semibold">{t('settings.theme', '主题')}</Text>
                    <br />
                    <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                      {t('settings.theme_desc', '选择应用的主题')}
                    </Text>
                  </div>
                  <RadioGroup
                    layout="horizontal"
                    value={currentThemeValue}
                    onChange={handleThemeRadioChange as any}
                  >
                    <Radio value="light" label={t('settings.theme_light', '浅色')} />
                    <Radio value="dark" label={t('settings.theme_dark', '深色')} />
                    <Radio value="system" label={t('settings.theme_system', '系统')} />
                  </RadioGroup>
                </div>
                
                <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                        <Text weight="semibold">{t('settings.accent_color', '强调色')}</Text>
                        <br />
                        <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                            {t('settings.accent_color_desc', '选择应用的主要强调颜色')}
                        </Text>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div 
                            style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '50%', 
                                backgroundColor: accentColor, 
                                cursor: 'pointer',
                                border: '2px solid var(--colorNeutralStroke1)',
                                flexShrink: 0
                            }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                        />
                        <Button 
                            appearance="subtle"
                            icon={<ArrowReset24Regular />}
                            onClick={() => setAccentColor("#0078d4")}
                            title={t('settings.reset_color', '恢复默认')}
                        />
                        {showColorPicker && (
                            <div style={{ position: 'absolute', right: 0, top: '45px', zIndex: 100 }}>
                                <div 
                                    style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }} 
                                    onClick={() => setShowColorPicker(false)}
                                />
                                <ChromePicker 
                                    color={accentColor} 
                                    onChange={(color) => setAccentColor(color.hex)}
                                    disableAlpha={true}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                        <Text weight="semibold">{t('settings.content_density', '内容密度')}</Text>
                        <br />
                        <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                            {t('settings.content_density_desc', '调整界面元素的间距')}</Text>
                    </div>
                    <RadioGroup 
                        layout="horizontal" 
                        value={contentDensity} 
                        onChange={(_, data) => setContentDensity(data.value as 'comfortable' | 'compact')}
                    >
                        <Radio value="comfortable" label={t('settings.density_comfortable', '舒适')} />
                        <Radio value="compact" label={t('settings.density_compact', '紧凑')} />
                    </RadioGroup>
                </div>

                <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                        <Text weight="semibold">{t('settings.corner_radius', '圆角大小')}</Text>
                        <br />
                        <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                            {t('settings.corner_radius_desc', '调整界面元素的圆角弧度')}</Text>
                    </div>
                    <RadioGroup 
                        layout="horizontal" 
                        value={cornerRadius} 
                        onChange={(_, data) => setCornerRadius(data.value as 'small' | 'medium' | 'large')}
                    >
                        <Radio value="small" label={t('settings.radius_small', '较小')} />
                        <Radio value="medium" label={t('settings.radius_medium', '适中')} />
                        <Radio value="large" label={t('settings.radius_large', '较大')} />
                    </RadioGroup>
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

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('settings.confetti_entrance')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('settings.confetti_entrance_desc')}
                </Text>
              </div>
              <Switch
                checked={showConfetti}
                onChange={(_, data) => setShowConfetti(data.checked === true)}
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