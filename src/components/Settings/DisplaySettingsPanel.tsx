import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  TabList,
  Tab,
  Button,
  Divider,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
import {
  Color24Regular,
  ArrowReset24Regular,
  WeatherSunny20Regular,
  WeatherMoon20Regular,
  Desktop20Regular,
  Sparkle20Regular,
  Eye20Regular,
} from "@fluentui/react-icons";
import { ChromePicker } from 'react-color';
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";

const useStyles = makeStyles({
  container: {
    padding: "4px 8px 24px 8px",
    height: "100%",
    overflow: "auto",
    backgroundColor: "transparent",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    maxWidth: "1000px",
    margin: "0 auto",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  cardHeader: {
    padding: "16px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: "16px",
    padding: "4px 0",
  },
  rowInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  settingDescription: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.4",
  },
  segmentedPillContainer: {
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px",
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--colorNeutralStroke2)",
    flexShrink: 0,
    "& .fui-TabList": {
      minHeight: "28px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "4px 12px",
      minHeight: "28px",
      borderRadius: "9999px",
      transition: "all 0.15s ease",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 6px -1px rgba(0, 0, 0, 0.08)",
        fontWeight: 600,
      },
    },
  },
  // 强调色色盘
  colorPickerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "4px 0",
  },
  paletteWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  presetCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    ":hover": {
      transform: "scale(1.15)",
    },
  },
  presetCircleActive: {
    boxShadow: "0 0 0 2px var(--colorNeutralBackground1), 0 0 0 4px var(--colorBrandForeground1)",
    transform: "scale(1.1)",
  },
  customColorTrigger: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    border: "2px solid var(--colorNeutralStroke1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.18s ease",
    ":hover": {
      transform: "scale(1.1)",
    },
  },
  pickerPopover: {
    position: "absolute",
    right: 0,
    top: "38px",
    zIndex: 200,
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 16px 36px -4px rgba(0, 0, 0, 0.22)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  pickerBackdrop: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 199,
  },
  // 密度预览卡片
  densityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "8px",
  },
  densityTile: {
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    cursor: "pointer",
    borderRadius: "14px",
    border: "1.5px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      ...shorthands.borderColor("var(--colorNeutralStroke1)"),
    },
  },
  densityTileActive: {
    ...shorthands.borderColor("var(--colorBrandStroke1)"),
    backgroundColor: "var(--colorBrandBackground2)",
    boxShadow: "0 2px 10px -2px rgba(0, 113, 227, 0.15)",
  },
  densityPreviewMock: {
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  densityLine: {
    height: "4px",
    borderRadius: "9999px",
    backgroundColor: "var(--colorNeutralStroke1)",
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
    updateThemeBasedOnSystem,
    accentColor,
    setAccentColor,
    contentDensity,
    setContentDensity,
    cornerRadius,
    setCornerRadius,
    showConfetti,
    setShowConfetti,
    showTitleBarButtons,
    setShowTitleBarButtons,
  } = useThemeStore();
  const { updateConfig } = useAppStore();

  const [showColorPicker, setShowColorPicker] = useState(false);

  // 监听系统主题变化
  useEffect(() => {
    if (followSystemTheme) {
      updateThemeBasedOnSystem();
    }

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

  const handleThemeTabSelect = (val: string) => {
    if (val === 'system') {
      setFollowSystemTheme(true);
      updateThemeBasedOnSystem();
    } else {
      setFollowSystemTheme(false);
      const isDark = val === 'dark';
      setTheme(isDark);
      updateConfig({ theme: isDark ? "dark" : "light" });
    }
  };

  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      zIndex: 10000,
    });
  };

  // 预设高质感色系
  const colorPresets = [
    { name: '科技蓝', hex: '#0071e3' },
    { name: '极光青', hex: '#008272' },
    { name: '活力橙', hex: '#d83b01' },
    { name: '人文紫', hex: '#5c2d91' },
    { name: '深邃黑', hex: '#323130' },
    { name: '宝石红', hex: '#a4262c' },
    { name: '青柠绿', hex: '#107c10' },
    { name: '深海蓝', hex: '#004578' },
  ];

  const currentThemeTab = followSystemTheme ? 'system' : (isDarkMode ? 'dark' : 'light');

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 卡片 1: 外观模式与主题配色 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Color24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
            header={<Text weight="semibold" size={400}>{t('settings.personalization', '外观与主题配色')}</Text>}
            description={<Text size={200} className={styles.settingDescription}>定制软件视觉风格与强调色，打造个性化工作台</Text>}
          />

          <div className={styles.cardContent}>
            {/* 主题选择：分段胶囊选择器 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <Text weight="semibold">{t('settings.theme')}</Text>
              </div>

              <div className={styles.segmentedPillContainer}>
                <TabList
                  selectedValue={currentThemeTab}
                  onTabSelect={(_, d) => handleThemeTabSelect(d.value as string)}
                  appearance="subtle"
                >
                  <Tab value="light" icon={<WeatherSunny20Regular />}>
                    {t('settings.theme_light')}
                  </Tab>
                  <Tab value="dark" icon={<WeatherMoon20Regular />}>
                    {t('settings.theme_dark')}
                  </Tab>
                  <Tab value="system" icon={<Desktop20Regular />}>
                    {t('settings.theme_system')}
                  </Tab>
                </TabList>
              </div>
            </div>

            <Divider />

            {/* 强调色选择 */}
            <div className={styles.colorPickerSection}>
              <div className={styles.settingRow}>
                <div className={styles.rowInfo}>
                  <Text weight="semibold">{t('settings.accent_color')}</Text>
                  <Text className={styles.settingDescription}>{t('settings.accent_color_desc')}</Text>
                </div>

                {/* 重置强调色 */}
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<ArrowReset24Regular />}
                  onClick={() => setAccentColor("#0071e3")}
                  title={t('settings.reset_color')}
                >
                  {t('settings.reset_color', '重置默认')}
                </Button>
              </div>

              {/* 调色盘与预设色点 */}
              <div className={styles.paletteWrap}>
                {colorPresets.map(color => (
                  <div
                    key={color.hex}
                    className={mergeClasses(
                      styles.presetCircle,
                      accentColor.toLowerCase() === color.hex.toLowerCase() && styles.presetCircleActive
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    onClick={() => setAccentColor(color.hex)}
                  />
                ))}

                {/* 自定义颜色选择器 */}
                <div style={{ position: 'relative' }}>
                  <div
                    className={styles.customColorTrigger}
                    style={{ backgroundColor: accentColor }}
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="自定义拾色器"
                  />
                  {showColorPicker && (
                    <>
                      <div
                        className={styles.pickerBackdrop}
                        onClick={() => setShowColorPicker(false)}
                      />
                      <div className={styles.pickerPopover}>
                        <ChromePicker
                          color={accentColor}
                          onChange={(color) => setAccentColor(color.hex)}
                          disableAlpha={true}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 卡片 2: 界面布局与辅助显示 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Eye20Regular style={{ color: "var(--colorBrandForeground1)" }} />}
            header={<Text weight="semibold" size={400}>界面布局与辅助显示</Text>}
            description={<Text size={200} className={styles.settingDescription}>调节圆角、信息密度及交互动效</Text>}
          />

          <div className={styles.cardContent}>
            {/* 圆角风格切换 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <Text weight="semibold">{t('settings.corner_radius')}</Text>
              </div>

              <div className={styles.segmentedPillContainer}>
                <TabList
                  selectedValue={cornerRadius}
                  onTabSelect={(_, d) => setCornerRadius(d.value as 'small' | 'medium' | 'large')}
                  appearance="subtle"
                >
                  <Tab value="small">{t('settings.radius_small', '紧凑 8px')}</Tab>
                  <Tab value="medium">{t('settings.radius_medium', '标准 14px')}</Tab>
                  <Tab value="large">{t('settings.radius_large', '人文 20px')}</Tab>
                </TabList>
              </div>
            </div>

            <Divider />

            {/* 界面内容密度 */}
            <div>
              <div className={styles.rowInfo}>
                <Text weight="semibold">{t('settings.content_density')}</Text>
                <Text className={styles.settingDescription}>{t('settings.content_density_desc')}</Text>
              </div>

              <div className={styles.densityGrid}>
                <div
                  className={mergeClasses(styles.densityTile, contentDensity === 'comfortable' && styles.densityTileActive)}
                  onClick={() => setContentDensity('comfortable')}
                >
                  <div className={styles.densityPreviewMock} style={{ gap: "6px" }}>
                    <div className={styles.densityLine} style={{ width: '80%' }} />
                    <div className={styles.densityLine} style={{ backgroundColor: accentColor, width: '45%' }} />
                    <div className={styles.densityLine} style={{ width: '65%' }} />
                  </div>
                  <div>
                    <Text size={200} weight="semibold" style={{ display: 'block' }}>
                      {t('settings.comfortable', '宽适模式 (Comfortable)')}
                    </Text>
                    <Text size={100} style={{ color: "var(--colorNeutralForeground3)" }}>
                      舒缓的留白呼吸感，适合桌面大屏
                    </Text>
                  </div>
                </div>

                <div
                  className={mergeClasses(styles.densityTile, contentDensity === 'compact' && styles.densityTileActive)}
                  onClick={() => setContentDensity('compact')}
                >
                  <div className={styles.densityPreviewMock} style={{ gap: "3px" }}>
                    <div className={styles.densityLine} style={{ width: '80%' }} />
                    <div className={styles.densityLine} style={{ backgroundColor: accentColor, width: '45%' }} />
                    <div className={styles.densityLine} style={{ width: '65%' }} />
                  </div>
                  <div>
                    <Text size={200} weight="semibold" style={{ display: 'block' }}>
                      {t('settings.compact', '紧凑模式 (Compact)')}
                    </Text>
                    <Text size={100} style={{ color: "var(--colorNeutralForeground3)" }}>
                      高密度信息展示，操控视野更大
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* 标题栏按钮响应式修复 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <Text weight="semibold">{t('settings.show_title_bar_buttons')}</Text>
              </div>
              <Switch
                checked={showTitleBarButtons}
                onChange={(_, data) => setShowTitleBarButtons(data.checked === true)}
              />
            </div>


          </div>
        </Card>
      </div>
    </div>
  );
};

export default DisplaySettingsPanel;