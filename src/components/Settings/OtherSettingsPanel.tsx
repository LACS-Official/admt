import React, { useState, useEffect, useMemo } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Select,
  Button,
  Spinner,
  Divider,
} from "@fluentui/react-components";
import {
  Globe24Regular,
  Globe20Regular,
  ArrowMinimize20Regular,
  Play20Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  Settings24Regular,
  ArrowCounterclockwise24Regular,
  Speaker220Regular,
  CalendarLtr20Regular,
  Keyboard20Regular,
} from "@fluentui/react-icons";
import { useAppStore } from '../../stores/appStore';
import { systemTrayService } from '../../services/systemTrayService';
import { systemTrayManager } from '../../services/systemTrayManager';
import { autoStartService } from '../../services/autoStartService';
import { isEnabled } from '@tauri-apps/plugin-autostart';
import { useTranslation } from "react-i18next";

interface SystemFeatureStatus {
  type: 'success' | 'error' | 'warning';
  message: string;
  action?: () => void;
}

const StatusIndicator: React.FC<{ status: SystemFeatureStatus | null }> = ({ status }) => {
  const { t } = useTranslation();
  if (!status) return null;
  
  const getIcon = () => {
    switch (status.type) {
      case 'success': return <CheckmarkCircle24Regular style={{ color: 'var(--colorStatusSuccessBackground)' }} />;
      case 'error': return <Warning24Regular style={{ color: 'var(--colorStatusDangerBackground)' }} />;
      case 'warning': return <Warning24Regular style={{ color: 'var(--colorStatusWarningBackground)' }} />;
      default: return null;
    }
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      marginTop: '6px',
      padding: '6px 10px',
      backgroundColor: 'var(--colorNeutralBackground2)',
      borderRadius: '8px',
      border: '1px solid var(--colorNeutralStroke2)'
    }}>
      {getIcon()}
      <Text size={200}>{status.message}</Text>
      {status.action && (
        <Button size="small" appearance="subtle" onClick={status.action}>
          {t('settings.retry', '重试')}
        </Button>
      )}
    </div>
  );
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
    "@media (max-width: 820px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    height: "fit-content",
  },
  cardHeader: {
    padding: "16px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "16px",
    padding: "6px 0",
  },
  titleWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  rowInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  description: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  restoreBar: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "center",
    marginTop: "8px",
    padding: "8px",
  },
  restoreButton: {
    borderRadius: "9999px",
    fontWeight: 500,
    padding: "0 20px",
  },
  selectControl: {
    minWidth: "140px",
  },
});

const OtherSettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { config, updateConfig, setStatusBarMessage } = useAppStore();
  
  const [minimizeToTray, setMinimizeToTray] = useState(config.systemTrayEnabled);
  const [startWithSystem, setStartWithSystem] = useState(config.autoStartEnabled);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const [globalSearchHotkey, setGlobalSearchHotkey] = useState(config.globalSearchHotkey || 'Ctrl+K');
  const [traySupported, setTraySupported] = useState(false);
  const [autoStartSupported, setAutoStartSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trayStatus, setTrayStatus] = useState<SystemFeatureStatus | null>(null);
  const [autoStartStatus, setAutoStartStatus] = useState<SystemFeatureStatus | null>(null);
  
  const checkSystemFeatures = useMemo(() => 
    debounce(async () => {
      try {
        const [isTraySupp, isAutoStartSupp] = await Promise.all([
          systemTrayService().isSystemTraySupported(),
          isEnabled().then(() => true).catch(() => false),
        ]);
        
        setTraySupported(isTraySupp);
        setAutoStartSupported(isAutoStartSupp);
      } catch (error) {
        console.error('系统功能检查失败:', error);
      }
    }, 1000), []
  );

  useEffect(() => {
    const syncStates = async () => {
      try {
        setLoading(true);
        await checkSystemFeatures();
        
        const trayReady = await systemTrayService().isReady();
        if (trayReady !== config.systemTrayEnabled) {
          updateConfig({ systemTrayEnabled: trayReady });
          setMinimizeToTray(trayReady);
        }

        if (autoStartSupported) {
          await autoStartService.initialize('玩机管家');
          const status = await autoStartService.getAutoStartStatus();
          if (status.isEnabled !== config.autoStartEnabled) {
            updateConfig({ autoStartEnabled: status.isEnabled });
            setStartWithSystem(status.isEnabled);
          }
        }
      } catch (error) {
        console.error('状态同步失败:', error);
      } finally {
        setLoading(false);
      }
    };

    syncStates();
  }, [autoStartSupported]);

  useEffect(() => {
    setMinimizeToTray(config.systemTrayEnabled);
    setStartWithSystem(config.autoStartEnabled);
    setSoundEnabled(config.soundEnabled);
    setGlobalSearchHotkey(config.globalSearchHotkey || 'Ctrl+K');
  }, [config.systemTrayEnabled, config.autoStartEnabled, config.soundEnabled, config.globalSearchHotkey]);

  const handleMinimizeToTrayChange = async (checked: boolean) => {
    try {
      setLoading(true);
      setMinimizeToTray(checked);
      setTrayStatus(null);

      if (checked) {
        await systemTrayManager.initialize({
          systemTrayEnabled: true,
          minimizeToTrayOnClose: true
        });
      } else {
        await systemTrayManager.updateConfig({
          systemTrayEnabled: false,
          minimizeToTrayOnClose: false
        });
      }

      updateConfig({ 
        systemTrayEnabled: checked,
        minimizeToTrayOnClose: checked 
      });
    } catch (error) {
      console.error('系统托盘设置失败:', error);
      setMinimizeToTray(!checked);
      setStatusBarMessage({
        type: 'error',
        message: t('settings.tray_fix_failed')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    updateConfig({ language: value as "zh-CN" | "zh-TW" | "en-US" });
  };

  const handleStartWithSystemChange = (checked: boolean) => {
    if (!autoStartSupported) {
      setAutoStartStatus({
        type: 'error',
        message: t('settings.auto_start_not_supported_err')
      });
      return;
    }
    
    (async () => {
      try {
        setLoading(true);
        setAutoStartStatus(null);
        
        if (checked) {
          const success = await autoStartService.enableAutoStart();
          if (!success) throw new Error(t('settings.auto_start_enable_failed'));
        } else {
          await autoStartService.disableAutoStart();
        }
        
        updateConfig({ autoStartEnabled: checked });
        setStartWithSystem(checked);
      } catch (error) {
        console.error('自启动设置失败:', error);
        setAutoStartStatus({
          type: 'error',
          message: t('settings.auto_start_fix_failed'),
          action: () => handleStartWithSystemChange(checked)
        });
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleRestoreDefaults = () => {
    const defaultSettings = {
      language: "zh-CN" as "zh-CN",
      systemTrayEnabled: false,
      autoStartEnabled: false,
      soundEnabled: true,
      globalSearchHotkey: 'Ctrl+K',
    };
    updateConfig(defaultSettings);
    setStatusBarMessage({
      type: 'success',
      message: t('settings.settings_restored')
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 卡片 1: 语言与常规交互偏好 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Globe24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
            header={<Text weight="semibold" size={400}>{t('settings.language_region')}</Text>}
            description={<Text size={200} className={styles.description}>{t('settings.language_region_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 界面语言 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <div className={styles.titleWithIcon}>
                  <Globe20Regular />
                  <Text weight="semibold">{t('settings.interface_language')}</Text>
                </div>
                <Text className={styles.description}>切换应用界面展示语言</Text>
              </div>
              <Select
                value={config.language}
                onChange={(_, data) => handleLanguageChange(data.value)}
                size="small"
                className={styles.selectControl}
              >
                <option value="zh-CN">{t('settings.simplified_chinese')}</option>
                <option value="zh-TW">{t('settings.traditional_chinese')}</option>
                <option value="en-US">{t('settings.english')}</option>
              </Select>
            </div>

            <Divider />

            {/* 全局搜索快捷键 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <div className={styles.titleWithIcon}>
                  <Keyboard20Regular />
                  <Text weight="semibold">{t('settings.search_hotkey')}</Text>
                </div>
                <Text className={styles.description}>{t('settings.search_hotkey_desc')}</Text>
              </div>
              <Select
                value={globalSearchHotkey}
                onChange={(_, data) => {
                  setGlobalSearchHotkey(data.value);
                  updateConfig({ globalSearchHotkey: data.value });
                }}
                size="small"
                className={styles.selectControl}
              >
                <option value="Ctrl+K">Ctrl + K</option>
                <option value="Ctrl+F">Ctrl + F</option>
                <option value="Alt+S">Alt + S</option>
                <option value="Alt+F">Alt + F</option>
              </Select>
            </div>

            <Divider />

            {/* 声音与提示音 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <div className={styles.titleWithIcon}>
                  <Speaker220Regular />
                  <Text weight="semibold">{t('settings.notification_sound')}</Text>
                </div>
                <Text className={styles.description}>{t('settings.notification_sound_desc')}</Text>
              </div>
              <Switch
                checked={soundEnabled}
                onChange={(_, data) => {
                  const val = data.checked === true;
                  setSoundEnabled(val);
                  updateConfig({ soundEnabled: val });
                }}
              />
            </div>
          </div>
        </Card>

        {/* 卡片 2: 系统集成与后台行为 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Settings24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
            header={<Text weight="semibold" size={400}>{t('settings.general_settings')}</Text>}
            description={<Text size={200} className={styles.description}>{t('settings.general_settings_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spinner size="tiny" />
                <Text size={200} className={styles.description}>{t('settings.syncing_status')}</Text>
              </div>
            )}

            {/* 系统托盘 */}
            <div>
              <div className={styles.settingRow}>
                <div className={styles.rowInfo}>
                  <div className={styles.titleWithIcon}>
                    <ArrowMinimize20Regular />
                    <Text weight="semibold">{t('settings.enable_tray')}</Text>
                  </div>
                  <Text className={styles.description}>
                    {traySupported ? t('settings.tray_desc') : t('settings.tray_not_supported')}
                  </Text>
                </div>
                <Switch
                  checked={minimizeToTray}
                  disabled={!traySupported || loading}
                  onChange={(_, data) => handleMinimizeToTrayChange(data.checked === true)}
                />
              </div>
              <StatusIndicator status={trayStatus} />
            </div>

            <Divider />

            {/* 开机自启动 */}
            <div>
              <div className={styles.settingRow}>
                <div className={styles.rowInfo}>
                  <div className={styles.titleWithIcon}>
                    <Play20Regular />
                    <Text weight="semibold">{t('settings.auto_start')}</Text>
                  </div>
                  <Text className={styles.description}>
                    {autoStartSupported ? t('settings.auto_start_desc') : t('settings.auto_start_not_supported')}
                  </Text>
                </div>
                <Switch
                  checked={startWithSystem}
                  disabled={!autoStartSupported || loading}
                  onChange={(_, data) => handleStartWithSystemChange(data.checked === true)}
                />
              </div>
              <StatusIndicator status={autoStartStatus} />
            </div>

            <Divider />

            {/* 日期与时间显示规范 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <div className={styles.titleWithIcon}>
                  <CalendarLtr20Regular />
                  <Text weight="semibold">日期与时间规范</Text>
                </div>
                <Text className={styles.description}>
                  标准 24 小时制 (ISO 8601 YYYY-MM-DD HH:mm:ss)
                </Text>
              </div>
              <Text size={200} weight="semibold" style={{ fontFamily: "ui-monospace, monospace", color: "var(--colorBrandForeground1)" }}>
                24h / 标准
              </Text>
            </div>
          </div>
        </Card>

        {/* 恢复默认按钮 */}
        <div className={styles.restoreBar}>
          <Button 
            appearance="subtle" 
            className={styles.restoreButton}
            icon={<ArrowCounterclockwise24Regular />}
            onClick={handleRestoreDefaults}
          >
            {t('settings.restore_defaults')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OtherSettingsPanel;
