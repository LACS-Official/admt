import React from 'react';
import {
  Card,
  CardHeader,
  Text,
  Switch,
  makeStyles,
  tokens,
  Badge,
  Divider
} from '@fluentui/react-components';
import { Shield24Regular, ShieldCheckmark24Regular, Warning24Regular } from '@fluentui/react-icons';
import { useSecurityContext } from './SecurityProvider';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
  },
  card: {
    width: '100%',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
  },
  settingLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  settingTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  settingDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  statusBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  warningSection: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  warningIcon: {
    color: tokens.colorPaletteYellowForeground1,
  },
  warningText: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
  },
});

export const SecuritySettings: React.FC = () => {
  const styles = useStyles();
  const {
    isProtectionEnabled,
    setProtectionEnabled,
    isDevToolsDetected,
    isRefreshProtectionEnabled,
    setRefreshProtectionEnabled
  } = useSecurityContext();

  const securityFeatures = [
    {
      title: '禁用右键菜单',
      description: '防止通过右键菜单访问开发者工具',
      enabled: isProtectionEnabled,
    },
    {
      title: '禁用快捷键',
      description: '禁用 F12、Ctrl+Shift+I 等开发者工具快捷键',
      enabled: isProtectionEnabled,
    },
    {
      title: '开发者工具检测',
      description: '实时检测开发者工具是否打开',
      enabled: isProtectionEnabled,
    },
    {
      title: '禁用文本选择',
      description: '防止选择和复制页面内容',
      enabled: isProtectionEnabled,
    },
    {
      title: '防止拖拽操作',
      description: '禁用页面元素的拖拽功能',
      enabled: isProtectionEnabled,
    },
    {
      title: '禁用页面刷新',
      description: '禁用 F5 和 Ctrl+R 刷新快捷键',
      enabled: isRefreshProtectionEnabled,
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <div className={styles.cardHeader}>
              {isProtectionEnabled ? (
                <ShieldCheckmark24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
              ) : (
                <Shield24Regular style={{ color: tokens.colorNeutralForeground2 }} />
              )}
              <Text weight="semibold" size={400}>
                安全防护设置
              </Text>
              <Badge 
                appearance={isProtectionEnabled ? 'filled' : 'outline'}
                color={isProtectionEnabled ? 'success' : 'subtle'}
                className={styles.statusBadge}
              >
                {isProtectionEnabled ? '已启用' : '已禁用'}
              </Badge>
            </div>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <Text className={styles.settingTitle}>启用安全防护</Text>
              <Text className={styles.settingDescription}>
                开启后将启用所有安全防护功能，保护应用免受调试和逆向工程
              </Text>
            </div>
            <Switch
              checked={isProtectionEnabled}
              onChange={(_, data) => setProtectionEnabled(data.checked)}
            />
          </div>

          <Divider />

          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>
              <Text className={styles.settingTitle}>禁用页面刷新</Text>
              <Text className={styles.settingDescription}>
                禁用 F5 和 Ctrl+R 等刷新快捷键，防止意外刷新页面
              </Text>
            </div>
            <Switch
              checked={isRefreshProtectionEnabled}
              onChange={(_, data) => setRefreshProtectionEnabled(data.checked)}
            />
          </div>

          {isDevToolsDetected && (
            <>
              <Divider />
              <div className={styles.warningSection}>
                <Warning24Regular className={styles.warningIcon} />
                <Text className={styles.warningText}>
                  检测到开发者工具已打开！安全防护已激活。
                </Text>
              </div>
            </>
          )}

          <Divider />
          
          <Text weight="semibold" size={300}>
            防护功能详情
          </Text>
          
          {securityFeatures.map((feature, index) => (
            <div key={index} className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <Text className={styles.settingTitle}>{feature.title}</Text>
                <Text className={styles.settingDescription}>{feature.description}</Text>
              </div>
              <Badge 
                appearance={feature.enabled ? 'filled' : 'outline'}
                color={feature.enabled ? 'success' : 'subtle'}
              >
                {feature.enabled ? '启用' : '禁用'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
