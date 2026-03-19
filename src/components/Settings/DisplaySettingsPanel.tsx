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
  Play20Regular,
  Sparkle20Regular,
  Flash20Regular,
  TextLineSpacing20Regular,
  TextGrammarSettings20Regular,
} from "@fluentui/react-icons";
import { 
    Button, 
    shorthands,
    mergeClasses,
    TabList,
    Tab,
    Divider,
    Badge
} from "@fluentui/react-components";
import { ChromePicker } from 'react-color';
import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

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
  settingTile: {
    ...shorthands.padding("12px", "16px"),
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("12px"),
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "background-color 0.2s ease",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  rowInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
  },
  settingDescription: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground4)",
  },
  // 颜色预设
  presetGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "8px",
      marginTop: "8px",
  },
  presetCircle: {
      width: "24px",
      height: "24px",
      ...shorthands.borderRadius("50%"),
      cursor: "pointer",
      ...shorthands.border("2px", "solid", "transparent"),
      transition: "transform 0.2s, border-color 0.2s",
      ":hover": {
          transform: "scale(1.1)",
      },
  },
  presetCircleActive: {
      ...shorthands.border("2px", "solid", "var(--colorNeutralForeground1)"),
  },
  // 密度磁贴
  densityGrid: {
      display: "flex",
      gap: "12px",
      marginTop: "4px",
  },
  densityTile: {
      flex: 1,
      ...shorthands.padding("12px"),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      ...shorthands.borderRadius("12px"),
      ...shorthands.border("2px", "solid", "var(--colorNeutralStroke1)"),
      transition: "all 0.2s ease",
      ":hover": {
          backgroundColor: "var(--colorNeutralBackground1Hover)",
      }
  },
  densityTileActive: {
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
      backgroundColor: "var(--colorBrandBackground2)",
  },
  densityVisual: {
      width: "40px",
      height: "30px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "4px",
  },
  densityLine: {
      height: "3px",
      backgroundColor: "var(--colorNeutralForeground4)",
      ...shorthands.borderRadius("2px"),
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

  // 预设颜色
  const colorPresets = [
    { name: '商务蓝', hex: '#0078d4' },
    { name: '极客绿', hex: '#107c10' },
    { name: '活力橙', hex: '#d83b01' },
    { name: '皇家紫', hex: '#5c2d91' },
    { name: '磨砂黑', hex: '#323130' },
    { name: '薄荷绿', hex: '#008272' },
    { name: '宝石红', hex: '#a4262c' },
    { name: '深海蓝', hex: '#004578' },
  ];

  const handleTestAnimations = () => {
    // 触发一个简单的状态变化来演示动画
    setEnableAnimations(prev => !prev);
    setTimeout(() => setEnableAnimations(prev => !prev), 500);
  };

  const handleTestConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 10000,
    });
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
                description={<Text size={200} className={styles.settingDescription}>{t('settings.personalization_desc', '自定义应用的主题颜色和背景')}</Text>}
            />
            <div className={styles.cardContent}>
                {/* 主题选择 */}
                <div className={styles.settingTile}>
                  <div className={styles.settingRow}>
                    <div className={styles.rowInfo}>
                        <Text weight="semibold">{t('settings.theme', '主题')}</Text>
                        <Text className={styles.settingDescription}>{t('settings.theme_desc', '选择应用的主题')}</Text>
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
                </div>
                
                {/* 强调色选择 */}
                <div className={styles.settingTile}>
                    <div className={styles.settingRow}>
                        <div className={styles.rowInfo}>
                            <Text weight="semibold">{t('settings.accent_color', '强调色')}</Text>
                            <Text className={styles.settingDescription}>{t('settings.accent_color_desc', '选择应用的主要强调颜色')}</Text>
                        </div>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div 
                                style={{ 
                                    width: '32px', 
                                    height: '32px', 
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
                                size="small"
                                icon={<ArrowReset24Regular />}
                                onClick={() => setAccentColor("#0078d4")}
                                title={t('settings.reset_color', '恢复默认')}
                            />
                            {showColorPicker && (
                                <div style={{ position: 'absolute', right: 0, top: '40px', zIndex: 100 }}>
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
                    <div className={styles.presetGrid}>
                        {colorPresets.map(color => (
                            <div 
                                key={color.hex}
                                className={mergeClasses(
                                    styles.presetCircle,
                                    accentColor === color.hex && styles.presetCircleActive
                                )}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                                onClick={() => setAccentColor(color.hex)}
                            />
                        ))}
                    </div>
                </div>

                {/* 内容密度 */}
                <div className={styles.settingTile}>
                    <div className={styles.rowInfo}>
                        <Text weight="semibold">{t('settings.content_density', '内容密度')}</Text>
                        <Text className={styles.settingDescription}>{t('settings.content_density_desc', '调整界面元素的间距')}</Text>
                    </div>
                    <div className={styles.densityGrid}>
                        <div 
                            className={mergeClasses(styles.densityTile, contentDensity === 'comfortable' && styles.densityTileActive)}
                            onClick={() => setContentDensity('comfortable')}
                        >
                            <div className={styles.densityVisual}>
                                <div className={styles.densityLine} style={{ width: '80%' }} />
                                <div className={styles.densityLine} style={{ backgroundColor: accentColor, marginTop: '4px' }} />
                                <div className={styles.densityLine} style={{ width: '60%', marginTop: '4px' }} />
                            </div>
                            <Text size={100} weight={contentDensity === 'comfortable' ? 'semibold' : 'regular'}>舒适</Text>
                        </div>
                        <div 
                            className={mergeClasses(styles.densityTile, contentDensity === 'compact' && styles.densityTileActive)}
                            onClick={() => setContentDensity('compact')}
                        >
                            <div className={styles.densityVisual} style={{ gap: '2px' }}>
                                <div className={styles.densityLine} style={{ width: '80%' }} />
                                <div className={styles.densityLine} style={{ backgroundColor: accentColor }} />
                                <div className={styles.densityLine} style={{ width: '60%' }} />
                            </div>
                            <Text size={100} weight={contentDensity === 'compact' ? 'semibold' : 'regular'}>紧凑</Text>
                        </div>
                    </div>
                </div>

                {/* 圆角大小 */}
                <div className={styles.settingTile}>
                    <div className={styles.settingRow}>
                        <div className={styles.rowInfo}>
                            <Text weight="semibold">{t('settings.corner_radius', '圆角大小')}</Text>
                            <Text className={styles.settingDescription}>{t('settings.corner_radius_desc', '调整界面元素的圆角弧度')}</Text>
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
            </div>
        </Card>

        {/* 动画与交互设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Timer24Regular />}
            header={<Text weight="semibold">{t('settings.animations_interaction')}</Text>}
            description={<Text size={200} className={styles.settingDescription}>{t('settings.animations_interaction_desc')}</Text>}
          />
          <div className={styles.cardContent}>
            {/* 动画设置行：合并启用动画和轮播速度 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* 启用动画 */}
                <div className={styles.settingTile} style={{ height: '100%', justifyContent: 'center' }}>
                    <div className={styles.settingRow}>
                      <div className={styles.rowInfo}>
                        <Text weight="semibold">{t('settings.enable_animations')}</Text>
                        <Text className={styles.settingDescription}>{t('settings.enable_animations_desc')}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button 
                            size="small" 
                            appearance="subtle" 
                            icon={<Flash20Regular />} 
                            onClick={handleTestAnimations}
                        >测试</Button>
                        <Switch
                            checked={enableAnimations}
                            onChange={(_, data) => setEnableAnimations(data.checked === true)}
                        />
                      </div>
                    </div>
                </div>

                {/* 轮播速度 */}
                <div className={styles.settingTile}>
                    <div className={styles.settingRow}>
                        <div className={styles.rowInfo}>
                          <Text weight="semibold">{t('settings.carousel_speed')}</Text>
                        </div>
                        <Badge appearance="tint" color="brand">
                            {config.carouselInterval ? (config.carouselInterval / 1000).toFixed(1) : "8.0"}s
                        </Badge>
                    </div>
                    <div style={{ padding: '0 8px' }}>
                        <Slider
                            min={2000}
                            max={15000}
                            step={500}
                            value={config.carouselInterval || 8000}
                            onChange={handleCarouselIntervalChange}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: "var(--colorNeutralForeground4)", fontSize: "10px", marginTop: '4px' }}>
                            <span>最快</span>
                            <span>最慢</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 首页彩带 */}
            <div className={styles.settingTile}>
                <div className={styles.settingRow}>
                  <div className={styles.rowInfo}>
                    <Text weight="semibold">{t('settings.confetti_entrance')}</Text>
                    <Text className={styles.settingDescription}>{t('settings.confetti_entrance_desc')}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button 
                        size="small" 
                        appearance="subtle" 
                        icon={<Sparkle20Regular />} 
                        onClick={handleTestConfetti}
                    >测试</Button>
                    <Switch
                        checked={showConfetti}
                        onChange={(_, data) => setShowConfetti(data.checked === true)}
                    />
                  </div>
                </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default DisplaySettingsPanel;