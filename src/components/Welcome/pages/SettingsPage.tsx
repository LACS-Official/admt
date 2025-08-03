/**
 * 第3页：基础设置页面
 * 提供简单的初始配置选项（如语言、主题等）
 */

import React from 'react';
import {
  makeStyles,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  Field,
  Dropdown,
  Option,
  Switch,
  Divider,
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Globe24Regular,
  WeatherMoon24Regular,
  Rocket24Regular,
  ArrowSync24Regular,
  Eye24Regular,
  Phone24Regular,
} from '@fluentui/react-icons';
import { useWelcomeStore } from '../../../stores/welcomeStore';
import { useAppStore } from '../../../stores/appStore';
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from '../../../types/welcome';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '700px',
    margin: '0 auto',
    height: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
    color: 'var(--colorBrandBackground)',
    marginBottom: '16px',
  },
  title: {
    marginBottom: '8px',
  },
  subtitle: {
    color: 'var(--colorNeutralForeground2)',
    maxWidth: '500px',
    margin: '0 auto',
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  settingCard: {
    padding: '24px',
  },
  settingGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid var(--colorNeutralStroke3)',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  settingInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  settingIcon: {
    fontSize: '20px',
    color: 'var(--colorBrandBackground)',
    marginRight: '12px',
  },
  settingControl: {
    minWidth: '200px',
  },
  previewSection: {
    padding: '20px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
    textAlign: 'center',
  },
});

const SettingsPage: React.FC = () => {
  const styles = useStyles();
  const {
    userConfig,
    updateUserConfig,
  } = useWelcomeStore();
  const { config, updateConfig } = useAppStore();

  const handleLanguageChange = (value: string) => {
    updateUserConfig('language', value);
  };

  const handleThemeChange = (value: string) => {
    updateUserConfig('theme', value as 'light' | 'dark' | 'auto');
  };

  const handleAutoStartChange = (checked: boolean) => {
    updateUserConfig('autoStart', checked);
  };

  const handleCheckUpdatesChange = (checked: boolean) => {
    updateUserConfig('checkUpdates', checked);
  };

  const handleTelemetryChange = (checked: boolean) => {
    updateUserConfig('enableTelemetry', checked);
  };

  const handleAutoDetectChange = (checked: boolean) => {
    updateConfig({ autoDetectDevices: checked });
  };

  const handleScanIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval >= 1000) {
      updateConfig({ scanInterval: interval });
    }
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <Settings24Regular className={styles.icon} />
        <Title1 className={styles.title}>
          基础设置
        </Title1>
        <Body1 className={styles.subtitle}>
          配置您的个人偏好设置，这些设置可以在稍后的使用过程中随时修改。
        </Body1>
      </div>

      {/* 设置选项 */}
      <div className={styles.settingsSection}>
        {/* 界面设置 */}
        <Card className={styles.settingCard}>
          <Title2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe24Regular style={{ fontSize: '24px' }} />
            界面设置
          </Title2>
          
          <div className={styles.settingGroup}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  显示语言
                </Text>
                <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
                  选择软件界面的显示语言
                </Caption1>
              </div>
              <div className={styles.settingControl}>
                <Field>
                  <Dropdown
                    value={LANGUAGE_OPTIONS.find(opt => opt.key === userConfig.language)?.text || '简体中文'}
                    onOptionSelect={(_, data) => handleLanguageChange(data.optionValue || 'zh-CN')}
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <Option key={option.key} value={option.key}>
                        {option.text}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  主题外观
                </Text>
                <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
                  选择您喜欢的界面主题
                </Caption1>
              </div>
              <div className={styles.settingControl}>
                <Field>
                  <Dropdown
                    value={THEME_OPTIONS.find(opt => opt.key === userConfig.theme)?.text || '浅色主题'}
                    onOptionSelect={(_, data) => handleThemeChange(data.optionValue || 'light')}
                  >
                    {THEME_OPTIONS.map((option) => (
                      <Option key={option.key} value={option.key}>
                        {option.text}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>
            </div>
          </div>
        </Card>

        <Divider />

        {/* 应用行为 */}
        <Card className={styles.settingCard}>
          <Title2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket24Regular style={{ fontSize: '24px' }} />
            应用行为
          </Title2>
          
          <div className={styles.settingGroup}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  开机自启动
                </Text>
                <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
                  系统启动时自动运行玩机管家
                </Caption1>
              </div>
              <Switch
                checked={userConfig.autoStart || false}
                onChange={(_, data) => handleAutoStartChange(data.checked)}
              />
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  自动检查更新
                </Text>
                <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
                  定期检查并提醒软件更新
                </Caption1>
              </div>
              <Switch
                checked={userConfig.checkUpdates !== false}
                onChange={(_, data) => handleCheckUpdatesChange(data.checked)}
              />
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  发送使用统计
                </Text>
                <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
                  帮助我们改进软件质量（匿名数据）
                </Caption1>
              </div>
              <Switch
                checked={userConfig.enableTelemetry || false}
                onChange={(_, data) => handleTelemetryChange(data.checked)}
              />
            </div>
          </div>
        </Card>

        <Divider />

        {/* 设备检测设置 */}
        <Card className={styles.settingCard}>
          <Title2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone24Regular style={{ fontSize: '24px' }} />
            设备检测设置
          </Title2>

          <div className={styles.settingGroup}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  自动检测设备
                </Text>
                <Caption1 style={{ color: 'var(--colorNeutralForeground2)' }}>
                  自动扫描和检测连接的Android设备
                </Caption1>
              </div>
              <Switch
                checked={config.autoDetectDevices}
                onChange={(_, data) => handleAutoDetectChange(data.checked)}
              />
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <Text size={400} weight="semibold">
                  扫描间隔
                </Text>
                <Caption1 style={{
                  color: config.autoDetectDevices
                    ? 'var(--colorNeutralForeground2)'
                    : 'var(--colorNeutralForeground3)'
                }}>
                  设备扫描的时间间隔（毫秒）
                </Caption1>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                <Dropdown
                  value={config.scanInterval.toString()}
                  onOptionSelect={(_, data) => handleScanIntervalChange(data.optionValue || '2000')}
                  disabled={!config.autoDetectDevices}
                >
                  <Option value="1000">1秒</Option>
                  <Option value="2000">2秒</Option>
                  <Option value="3000">3秒</Option>
                  <Option value="5000">5秒</Option>
                  <Option value="10000">10秒</Option>
                </Dropdown>
                <Text size={200} style={{
                  color: config.autoDetectDevices
                    ? 'var(--colorNeutralForeground3)'
                    : 'var(--colorNeutralForeground4)',
                  textAlign: 'center'
                }}>
                  {config.autoDetectDevices ? '推荐: 2-5秒' : '需要启用自动检测'}
                </Text>
              </div>
            </div>
          </div>
        </Card>

        {/* 设置预览 */}
        <div className={styles.previewSection}>
          <Title2 style={{ marginBottom: '16px' }}>
            当前配置预览
          </Title2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', textAlign: 'left' }}>
            <div>
              <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>
                显示语言
              </Text>
              <Caption1>
                {LANGUAGE_OPTIONS.find(opt => opt.key === userConfig.language)?.text || '简体中文'}
              </Caption1>
            </div>
            <div>
              <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>
                界面主题
              </Text>
              <Caption1>
                {THEME_OPTIONS.find(opt => opt.key === userConfig.theme)?.text || '浅色主题'}
              </Caption1>
            </div>
            <div>
              <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>
                开机启动
              </Text>
              <Caption1>
                {userConfig.autoStart ? '已启用' : '已禁用'}
              </Caption1>
            </div>
            <div>
              <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>
                自动更新
              </Text>
              <Caption1>
                {userConfig.checkUpdates !== false ? '已启用' : '已禁用'}
              </Caption1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
