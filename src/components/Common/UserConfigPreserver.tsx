/**
 * 用户配置保留组件
 * 在激活码过期时保留用户配置，提供无缝的重新激活体验
 */

import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  MessageBar,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Checkmark24Regular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import { useAppConfigStore } from '../../stores/welcomeStore';
import { activationService } from '../../services/activationService';

const useStyles = makeStyles({
  container: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto 16px auto',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  configItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  configLabel: {
    fontWeight: tokens.fontWeightSemibold,
  },
  configValue: {
    color: tokens.colorNeutralForeground2,
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '8px',
  },
});

interface UserConfigPreserverProps {
  onReactivateClick?: () => void;
  onConfigRestored?: (config: any) => void;
}

export const UserConfigPreserver: React.FC<UserConfigPreserverProps> = ({
  onReactivateClick,
}) => {
  const styles = useStyles();
  const { config } = useAppConfigStore();
  const [preservedConfig, setPreservedConfig] = useState<any>(null);
  const [showPreservedConfig, setShowPreservedConfig] = useState(false);

  // 检查是否有保留的用户配置
  useEffect(() => {
    const checkPreservedConfig = () => {
      // 从激活服务获取保留的配置
      const activationStatus = activationService.checkActivationStatus();
      
      // 如果当前配置中有用户配置且应用未激活，说明是过期后保留的配置
      if (config.userConfig && (!activationStatus.isActivated || activationStatus.isExpired)) {
        setPreservedConfig(config.userConfig);
        setShowPreservedConfig(true);
      }
      
      // 也检查本地存储中是否有过期处理时保留的配置
      try {
        const preserved = localStorage.getItem('hout_preserved_user_config');
        if (preserved) {
          const parsedConfig = JSON.parse(preserved);
          setPreservedConfig(parsedConfig);
          setShowPreservedConfig(true);
        }
      } catch (error) {
        console.warn('无法加载保留的用户配置:', error);
      }
    };

    checkPreservedConfig();
  }, [config]);

  // 恢复用户配置

  // 清除保留的配置
  const handleClearPreservedConfig = () => {
    try {
      localStorage.removeItem('hout_preserved_user_config');
      setPreservedConfig(null);
      setShowPreservedConfig(false);
    } catch (error) {
      console.warn('清除保留配置失败:', error);
    }
  };

  // 格式化配置值显示
  const formatConfigValue = (key: string, value: any): string => {
    switch (key) {
      case 'language':
        return value === 'zh-CN' ? '简体中文' : value === 'en-US' ? 'English' : value;
      case 'theme':
        return value === 'light' ? '浅色主题' : value === 'dark' ? '深色主题' : value;
      case 'autoStart':
        return value ? '是' : '否';
      case 'checkUpdates':
        return value ? '启用' : '禁用';
      case 'enableTelemetry':
        return value ? '启用' : '禁用';
      default:
        return String(value);
    }
  };

  // 获取配置项的中文标签
  const getConfigLabel = (key: string): string => {
    const labels: Record<string, string> = {
      username: '用户名',
      language: '语言',
      theme: '主题',
      autoStart: '开机自启',
      checkUpdates: '检查更新',
      enableTelemetry: '遥测数据',
    };
    return labels[key] || key;
  };

  if (!showPreservedConfig || !preservedConfig) {
    return null;
  }

  return (
    <Card className={styles.container}>
      <CardHeader
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings24Regular />
            <Text weight="semibold">保留的用户配置</Text>
            <Badge appearance="outline" color="success">
              <Checkmark24Regular style={{ fontSize: '12px' }} />
              已保留
            </Badge>
          </div>
        }
      />
      
      <CardPreview>
        <div className={styles.content}>
          <MessageBar intent="info">
            您的个人设置已安全保留，重新激活后将自动恢复。
          </MessageBar>

          {/* 显示保留的配置项 */}
          {Object.entries(preservedConfig).map(([key, value]) => (
            <div key={key} className={styles.configItem}>
              <Text className={styles.configLabel}>
                {getConfigLabel(key)}:
              </Text>
              <Text className={styles.configValue}>
                {formatConfigValue(key, value)}
              </Text>
            </div>
          ))}

          <div className={styles.actionButtons}>
            <Button
              appearance="primary"
              icon={<ArrowClockwise24Regular />}
              onClick={onReactivateClick}
            >
              使用此配置重新激活
            </Button>
            
            <Button
              appearance="secondary"
              onClick={handleClearPreservedConfig}
            >
              清除保留配置
            </Button>
          </div>
        </div>
      </CardPreview>
    </Card>
  );
};

/**
 * 保留用户配置到本地存储
 */
export const preserveUserConfig = (userConfig: any): void => {
  try {
    if (userConfig && typeof userConfig === 'object') {
      localStorage.setItem('hout_preserved_user_config', JSON.stringify(userConfig));
      console.log('用户配置已保留:', userConfig);
    }
  } catch (error) {
    console.warn('保留用户配置失败:', error);
  }
};

/**
 * 获取保留的用户配置
 */
export const getPreservedUserConfig = (): any | null => {
  try {
    const preserved = localStorage.getItem('hout_preserved_user_config');
    if (preserved) {
      return JSON.parse(preserved);
    }
  } catch (error) {
    console.warn('获取保留的用户配置失败:', error);
  }
  return null;
};

/**
 * 清除保留的用户配置
 */
export const clearPreservedUserConfig = (): void => {
  try {
    localStorage.removeItem('hout_preserved_user_config');
    console.log('已清除保留的用户配置');
  } catch (error) {
    console.warn('清除保留的用户配置失败:', error);
  }
};

export default UserConfigPreserver;
