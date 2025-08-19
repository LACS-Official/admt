/**
 * 用户行为追踪设置组件
 * 用于测试和管理用户行为追踪功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Text,
  Button,
  Badge,
  Divider,
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  Field,
  Switch,
  Spinner,
} from '@fluentui/react-components';
import {
  DataUsage24Regular,
  Shield24Regular,
  Info24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Dismiss24Regular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import { usageTrackingService } from '../../services/usageTrackingService';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';

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
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  statusLabel: {
    fontWeight: tokens.fontWeightSemibold,
  },
  actionSection: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  infoSection: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

const UsageTrackingSettings: React.FC = () => {
  const styles = useStyles();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  const {
    hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement,
    hasAcceptedDataCollection,
    hasCompletedPrivacySetup,
    canCollectUserBehavior,
    dataCollectionTypes,
  } = usePrivacyConsentStore();

  // 获取会话信息
  const refreshSessionInfo = () => {
    const info = usageTrackingService.getSessionInfo();
    setSessionInfo(info);
  };

  useEffect(() => {
    refreshSessionInfo();
  }, []);

  // 测试发送使用数据
  const handleTestTracking = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      await usageTrackingService.trackMainPageEntry();
      setMessage({ type: 'success', text: '使用数据发送成功！' });
      refreshSessionInfo();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `发送失败: ${error instanceof Error ? error.message : '未知错误'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 重置会话
  const handleResetSession = () => {
    usageTrackingService.resetSession();
    refreshSessionInfo();
    setMessage({ type: 'info', text: '会话已重置' });
  };

  // 获取状态徽章
  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge color="success" icon={<CheckmarkCircle24Regular />}>已启用</Badge>
    ) : (
      <Badge color="danger" icon={<Dismiss24Regular />}>未启用</Badge>
    );
  };

  return (
    <div className={styles.container}>
      {/* 标题 */}
      <Text size={600} weight="semibold">
        <DataUsage24Regular /> 用户行为追踪设置
      </Text>

      {/* 隐私政策状态卡片 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold">
              <Shield24Regular /> 隐私政策同意状态
            </Text>
          }
        />
        <CardPreview>
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>隐私政策</Text>
              {getStatusBadge(hasAcceptedPrivacyPolicy)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>用户协议</Text>
              {getStatusBadge(hasAcceptedUserAgreement)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>数据收集</Text>
              {getStatusBadge(hasAcceptedDataCollection)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>隐私设置完成</Text>
              {getStatusBadge(hasCompletedPrivacySetup)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>可收集用户行为</Text>
              {getStatusBadge(canCollectUserBehavior())}
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* 数据收集类型 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold">
              <Info24Regular /> 数据收集类型
            </Text>
          }
        />
        <CardPreview>
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>设备数据</Text>
              {getStatusBadge(dataCollectionTypes.deviceData)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>用户行为</Text>
              {getStatusBadge(dataCollectionTypes.userBehavior)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>匿名分析</Text>
              {getStatusBadge(dataCollectionTypes.analytics)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>崩溃报告</Text>
              {getStatusBadge(dataCollectionTypes.crashReporting)}
            </div>
            <div className={styles.statusItem}>
              <Text className={styles.statusLabel}>性能指标</Text>
              {getStatusBadge(dataCollectionTypes.performanceMetrics)}
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* 会话信息 */}
      {sessionInfo && (
        <Card className={styles.card}>
          <CardHeader
            header={
              <Text weight="semibold">
                <DataUsage24Regular /> 当前会话信息
              </Text>
            }
          />
          <CardPreview>
            <div className={styles.statusSection}>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>会话ID</Text>
                <Text>{sessionInfo.sessionId}</Text>
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>已发送数据</Text>
                {getStatusBadge(sessionInfo.hasTrackedThisSession)}
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>服务已初始化</Text>
                {getStatusBadge(sessionInfo.isInitialized)}
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>可收集数据</Text>
                {getStatusBadge(sessionInfo.canCollectData)}
              </div>
            </div>
          </CardPreview>
        </Card>
      )}

      {/* 操作按钮 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold">测试操作</Text>
          }
        />
        <CardFooter>
          <div className={styles.actionSection}>
            <Button
              appearance="primary"
              icon={<DataUsage24Regular />}
              onClick={handleTestTracking}
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="extra-small" /> : null}
              测试发送使用数据
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={handleResetSession}
            >
              重置会话
            </Button>
            <Button
              appearance="subtle"
              icon={<ArrowClockwise24Regular />}
              onClick={refreshSessionInfo}
            >
              刷新状态
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* 消息提示 */}
      {message && (
        <MessageBar intent={message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}>
          <MessageBarBody>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* 说明信息 */}
      <div className={styles.infoSection}>
        <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
          <Info24Regular /> 
          此页面用于测试和管理用户行为追踪功能。只有在用户同意隐私政策并启用数据收集后，
          使用数据才会被发送到后端API。每个会话只会发送一次数据。
        </Text>
      </div>
    </div>
  );
};

export default UsageTrackingSettings;
