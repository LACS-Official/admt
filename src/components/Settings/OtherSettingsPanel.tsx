import React, { useState, useEffect, useMemo } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Select,
  Button,
  Spinner,
} from "@fluentui/react-components";
import {
  Globe24Regular,
  Globe20Regular,
  ArrowMinimize24Regular,
  ArrowMinimize20Regular,
  Play24Regular,
  Play20Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  Settings24Regular,
  ArrowCounterclockwise24Regular,
  Speaker220Regular,
  Clock20Regular,
  CalendarLtr20Regular,
  Keyboard20Regular,
} from "@fluentui/react-icons";
import { 
    TabList, 
    Tab, 
    mergeClasses,
    shorthands 
} from "@fluentui/react-components";
import { useAppStore } from '../../stores/appStore';
import { systemTrayService } from '../../services/systemTrayService';
import { systemTrayManager } from '../../services/systemTrayManager';
import { autoStartService } from '../../services/autoStartService';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
// when using `"withGlobalTauri": true`, you may use
// const { enable, isEnabled, disable } = window.__TAURI__.autostart;
import { useTranslation } from "react-i18next";

// 状态提示组件
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
      marginTop: '8px',
      padding: '8px',
      backgroundColor: 'var(--colorNeutralBackground2)',
      borderRadius: '4px'
    }}>
      {getIcon()}
      <Text size={100}>{status.message}</Text>
      {status.action && (
        <Button size="small" onClick={status.action}>
          {t('settings.retry')}
        </Button>
      )}
    </div>
  );
};

// 防抖函数
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
    gap: "18px",
    maxWidth: "1000px",
    margin: "0 auto",
    "@media (max-width: 800px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    height: "fit-content",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  cardHeader: {
    padding: "18px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  settingTile: {
    padding: "14px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
    },
  },
  rowContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  titleWithIcon: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  description: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  previewText: {
    color: "var(--colorBrandForeground1)",
    fontSize: "12px",
    fontWeight: "600",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    marginTop: "2px",
  },
  segmentedContainer: {
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "2px",
    borderRadius: "9999px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      borderRadius: "9999px",
      fontSize: "11px",
      padding: "2px 8px",
      minHeight: "24px",
    },
  },
  restoreBar: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "center",
    marginTop: "12px",
    padding: "12px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  restoreButton: {
    borderRadius: "9999px",
    fontWeight: 500,
    padding: "0 16px",
  },
});

const OtherSettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { config, updateConfig } = useAppStore();
  const { setStatusBarMessage } = useAppStore();
  
  // 从配置中读取状态
  const [minimizeToTray, setMinimizeToTray] = useState(config.systemTrayEnabled);
  const [startWithSystem, setStartWithSystem] = useState(config.autoStartEnabled);
  const [startMinimizedToTray, setStartMinimizedToTray] = useState(config.startMinimizedToTray);
  const [minimizeToTrayOnClose, setMinimizeToTrayOnClose] = useState(config.minimizeToTrayOnClose);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const [globalSearchHotkey, setGlobalSearchHotkey] = useState(config.globalSearchHotkey || 'Ctrl+K');
  const [traySupported, setTraySupported] = useState(false);
  const [autoStartSupported, setAutoStartSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trayStatus, setTrayStatus] = useState<SystemFeatureStatus | null>(null);
  const [autoStartStatus, setAutoStartStatus] = useState<SystemFeatureStatus | null>(null);
  
  // 防抖检查系统功能，避免重复调用
  const checkSystemFeatures = useMemo(() => 
    debounce(async () => {
      try {
        const [traySupported, autoStartSupported] = await Promise.all([
          systemTrayService().isSystemTraySupported(),
          isEnabled().then(() => true).catch(() => false), // 检查自启动支持
        ]);
        
        setTraySupported(traySupported);
        setAutoStartSupported(autoStartSupported);
      } catch (error) {
        console.error(' 系统功能检查失败:', error);
      }
    }, 1000), []
  );

  // 初始化时同步状态
  useEffect(() => {
    const syncStates = async () => {
      try {
        setLoading(true);
        
        // 检查系统支持
        await checkSystemFeatures();
        
        // 同步托盘状态（不重复初始化）
        const trayStatus = await systemTrayService().isReady();
        if (trayStatus !== config.systemTrayEnabled) {
          console.log(` 同步托盘状态: ${trayStatus ? '已启用' : '未启用'}`);
          updateConfig({ systemTrayEnabled: trayStatus });
          setMinimizeToTray(trayStatus);
        }

        // 同步自启动状态
        if (autoStartSupported) {
          await autoStartService.initialize('玩机管家');
          const autoStartStatus = await autoStartService.getAutoStartStatus();
          if (autoStartStatus.isEnabled !== config.autoStartEnabled) {
            console.log(` 同步自启动状态: ${autoStartStatus.isEnabled ? '已启用' : '未启用'}`);
            updateConfig({ autoStartEnabled: autoStartStatus.isEnabled });
            setStartWithSystem(autoStartStatus.isEnabled);
          }
        }
      } catch (error) {
        console.error(' 状态同步失败:', error);
      } finally {
        setLoading(false);
      }
    };

    syncStates();
  }, []);

  useEffect(() => {
    setMinimizeToTray(config.systemTrayEnabled);
    setStartWithSystem(config.autoStartEnabled);
    setStartMinimizedToTray(config.startMinimizedToTray);
    setSoundEnabled(config.soundEnabled);
    setGlobalSearchHotkey(config.globalSearchHotkey || 'Ctrl+K');
  }, [config.systemTrayEnabled, config.autoStartEnabled, config.startMinimizedToTray, config.soundEnabled, config.globalSearchHotkey]);

  // 优化的托盘切换处理
  const handleMinimizeToTrayChange = async (checked: boolean) => {
    try {
      setLoading(true);
      setMinimizeToTray(checked);
      setTrayStatus(null);

      if (checked) {
        // 启用系统托盘 - 使用 SystemTrayManager 确保单例模式
        await systemTrayManager.initialize({
          systemTrayEnabled: true,
          minimizeToTrayOnClose: true
        });
        
      } else {
        // 禁用系统托盘 - 使用 SystemTrayManager 确保一致性
        await systemTrayManager.updateConfig({
          systemTrayEnabled: false,
          minimizeToTrayOnClose: false
        });
        
      }

      // 保存到配置
      updateConfig({ 
        systemTrayEnabled: checked,
        minimizeToTrayOnClose: checked 
      });

      console.log(` 系统托盘已${checked ? '启用' : '禁用'}`);
    } catch (error) {
      console.error(' 系统托盘设置失败:', error);
      // 回滚状态
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

  function handleStartWithSystemChange(checked: boolean): void {
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
          if (success) {
          } else {
            throw new Error(t('settings.auto_start_enable_failed'));
          }
        } else {
          const success = await autoStartService.disableAutoStart();
          if (success) {
          } else {
            setStatusBarMessage({
              type: 'error',
              message: t('settings.auto_start_disable_failed')
            });
          
          }
        }
        
        // 更新配置
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
  }

  const handleRestoreDefaults = () => {
    // 简单的恢复默认逻辑
    const defaultSettings = {
      language: "zh-CN" as "zh-CN",
      systemTrayEnabled: false,
      autoStartEnabled: false,
      soundEnabled: true,
    };
    updateConfig(defaultSettings);
    setStatusBarMessage({
      type: 'success',
      message: t('settings.settings_restored')
    });
  };

  // 生成实时预览
  const now = new Date();
  const datePreview = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const timePreview = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 语言和地区 (常规设置) */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Globe24Regular />}
            header={<Text weight="semibold" size={400}>{t('settings.language_region')}</Text>}
            description={<Text size={200} className={styles.description}>{t('settings.language_region_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 界面语言 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <Globe20Regular />
                  <Text weight="semibold">{t('settings.interface_language')}</Text>
                </div>
                <Select
                  value={config.language}
                  onChange={(_, data) => handleLanguageChange(data.value)}
                  size="small"
                >
                  <option value="zh-CN">{t('settings.simplified_chinese')}</option>
                  <option value="zh-TW">{t('settings.traditional_chinese')}</option>
                  <option value="en-US">{t('settings.english')}</option>
                </Select>
              </div>
            </div>

            {/* 日期格式 - 分段选择器预览 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <CalendarLtr20Regular />
                  <Text weight="semibold">{t('settings.date_format')}</Text>
                </div>
                <div className={styles.segmentedContainer}>
                  <TabList size="small" selectedValue="ymd" appearance="subtle">
                    <Tab value="ymd">YYYY-MM-DD</Tab>
                    <Tab value="mdy" disabled>MM/DD/YYYY</Tab>
                  </TabList>
                </div>
              </div>
              <Text className={styles.previewText}>{t('settings.current_preview')}{datePreview}</Text>
            </div>

            {/* 时间格式 - 分段选择器预览 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <Clock20Regular />
                  <Text weight="semibold">{t('settings.time_format')}</Text>
                </div>
                <div className={styles.segmentedContainer}>
                  <TabList size="small" selectedValue="24h" appearance="subtle">
                    <Tab value="24h">{t('settings.hour_24')}</Tab>
                    <Tab value="12h" disabled>{t('settings.hour_12')}</Tab>
                  </TabList>
                </div>
              </div>
              <Text className={styles.previewText}>{t('settings.current_preview')}{timePreview}</Text>
            </div>
          </div>
        </Card>

        {/* 系统行为设置 (常规设置) */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Settings24Regular />}
            header={<Text weight="semibold" size={400}>{t('settings.general_settings')}</Text>}
            description={<Text size={200} className={styles.description}>{t('settings.general_settings_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 加载指示器 */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Spinner size="tiny" />
                <Text size={200} className={styles.description}>{t('settings.syncing_status')}</Text>
              </div>
            )}

            {/* 系统托盘设置 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <ArrowMinimize20Regular />
                  <Text weight="semibold">{t('settings.enable_tray')}</Text>
                </div>
                <Switch
                  checked={minimizeToTray}
                  disabled={!traySupported || loading}
                  onChange={(_, data) => handleMinimizeToTrayChange(data.checked === true)}
                />
              </div>
              <Text className={styles.description}>
                {traySupported 
                  ? t('settings.tray_desc') 
                  : t('settings.tray_not_supported')}
              </Text>
              <StatusIndicator status={trayStatus} />
            </div>

            {/* 开机自启动设置 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <Play20Regular />
                  <Text weight="semibold">{t('settings.auto_start')}</Text>
                </div>
                <Switch
                  checked={startWithSystem}
                  disabled={!autoStartSupported || loading}
                  onChange={(_, data) => handleStartWithSystemChange(data.checked === true)}
                />
              </div>
              <Text className={styles.description}>
                {autoStartSupported 
                  ? t('settings.auto_start_desc') 
                  : t('settings.auto_start_not_supported')}
              </Text>
              <StatusIndicator status={autoStartStatus} />
            </div>
            
            {/* 通知音效设置 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <Speaker220Regular />
                  <Text weight="semibold">{t('settings.notification_sound')}</Text>
                </div>
                <Switch
                  checked={soundEnabled}
                  disabled={loading}
                  onChange={(_, data) => {
                    const checked = data.checked === true;
                    setSoundEnabled(checked);
                    updateConfig({ soundEnabled: checked });
                  }}
                />
              </div>
              <Text className={styles.description}>
                {t('settings.notification_sound_desc')}
              </Text>
            </div>

            {/* 搜索快捷键设置 */}
            <div className={styles.settingTile}>
              <div className={styles.rowContent}>
                <div className={styles.titleWithIcon}>
                  <Keyboard20Regular />
                  <Text weight="semibold">{t('settings.search_hotkey')}</Text>
                </div>
                <Select
                  value={globalSearchHotkey}
                  onChange={(_, data) => {
                    setGlobalSearchHotkey(data.value);
                    updateConfig({ globalSearchHotkey: data.value });
                  }}
                  size="small"
                >
                  <option value="Ctrl+K">Ctrl + K</option>
                  <option value="Ctrl+F">Ctrl + F</option>
                  <option value="Alt+S">Alt + S</option>
                  <option value="Alt+F">Alt + F</option>
                </Select>
              </div>
              <Text className={styles.description}>
                {t('settings.search_hotkey_desc')}
              </Text>
            </div>
          </div>
        </Card>

        {/* 恢复默认设置 */}
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
