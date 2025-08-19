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
  DeviceEq24Regular,
} from '@fluentui/react-icons';
import { usageTrackingService } from '../../services/usageTrackingService';
import { deviceConnectionTrackingService } from '../../services/deviceConnectionTrackingService';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';
import { useAppStore } from '../../stores/appStore';

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
  const [deviceConnectionInfo, setDeviceConnectionInfo] = useState<any>(null);
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

    const deviceInfo = deviceConnectionTrackingService.getServiceInfo();
    setDeviceConnectionInfo(deviceInfo);
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

  // 测试设备连接记录
  const handleTestDeviceConnection = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // 模拟设备连接数据
      const mockConnectionData = {
        deviceSerial: `test-device-${Date.now()}`,
        deviceBrand: 'Samsung',
        deviceModel: 'Galaxy S21',
        osVersion: 'Android 11'
      };

      await deviceConnectionTrackingService.recordDeviceConnection(mockConnectionData);
      setMessage({ type: 'success', text: '设备连接记录发送成功！' });
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

  // 重置设备连接频率限制
  const handleResetDeviceRateLimit = () => {
    deviceConnectionTrackingService.resetRateLimit();
    refreshSessionInfo();
    setMessage({ type: 'info', text: '设备连接频率限制已重置' });
  };

  // 调试隐私政策状态
  const handleDebugPrivacyStatus = () => {
    const privacyStore = usePrivacyConsentStore.getState();
    console.log('🔍 完整的隐私政策状态调试:', {
      hasCompletedPrivacySetup: privacyStore.hasCompletedPrivacySetup,
      hasAcceptedPrivacyPolicy: privacyStore.hasAcceptedPrivacyPolicy,
      hasAcceptedUserAgreement: privacyStore.hasAcceptedUserAgreement,
      hasAcceptedDataCollection: privacyStore.hasAcceptedDataCollection,
      dataCollectionTypes: privacyStore.dataCollectionTypes,
      canCollectData: privacyStore.canCollectData(),
      canCollectUserBehavior: privacyStore.canCollectUserBehavior(),
      isFirstLaunch: privacyStore.isFirstLaunch,
      shouldExitApp: privacyStore.shouldExitApp
    });
    setMessage({ type: 'info', text: '隐私政策状态已输出到控制台' });
  };

  // 强制触发主页面追踪
  const handleForceTrackMainPage = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // 重置会话状态以允许重新发送
      usageTrackingService.resetSession();
      console.log('🔄 会话已重置，开始强制追踪主页面进入...');

      await usageTrackingService.trackMainPageEntry();
      setMessage({ type: 'success', text: '强制主页面追踪完成！' });
      refreshSessionInfo();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `强制追踪失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 检查应用状态
  const handleCheckAppStatus = () => {
    console.log('🔍 应用状态检查:');
    console.log('📍 当前位置: 设置页面 > 使用数据追踪');
    console.log('🕐 当前时间:', new Date().toISOString());

    // 检查DOM中是否存在HomePage组件
    const homePageElements = document.querySelectorAll('[data-testid="home-page"], .home-page');
    console.log('🏠 HomePage组件DOM元素数量:', homePageElements.length);

    // 检查当前URL或路由状态
    console.log('🌐 当前URL:', window.location.href);
    console.log('🌐 当前路径:', window.location.pathname);

    // 检查React组件状态
    const appStore = useAppStore.getState();
    console.log('📱 应用状态:', {
      currentView: appStore.currentView,
      isInitialized: appStore.isInitialized,
      isLoading: appStore.isLoading,
      error: appStore.error
    });

    setMessage({ type: 'info', text: '应用状态已输出到控制台，请查看详细信息' });
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
                <DataUsage24Regular /> 软件使用追踪会话信息
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

      {/* 设备连接追踪信息 */}
      {deviceConnectionInfo && (
        <Card className={styles.card}>
          <CardHeader
            header={
              <Text weight="semibold">
                <DeviceEq24Regular /> 设备连接追踪信息
              </Text>
            }
          />
          <CardPreview>
            <div className={styles.statusSection}>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>服务已初始化</Text>
                {getStatusBadge(deviceConnectionInfo.isInitialized)}
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>设备指纹已生成</Text>
                {getStatusBadge(deviceConnectionInfo.hasDeviceFingerprint)}
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>可收集数据</Text>
                {getStatusBadge(deviceConnectionInfo.canCollectData)}
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>上次请求时间</Text>
                <Text>
                  {deviceConnectionInfo.lastRequestTime > 0
                    ? new Date(deviceConnectionInfo.lastRequestTime).toLocaleString()
                    : '从未发送'
                  }
                </Text>
              </div>
              <div className={styles.statusItem}>
                <Text className={styles.statusLabel}>频率限制剩余</Text>
                <Text>
                  {deviceConnectionInfo.rateLimitRemaining > 0
                    ? `${Math.ceil(deviceConnectionInfo.rateLimitRemaining / 1000)}秒`
                    : '可发送'
                  }
                </Text>
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
              appearance="primary"
              icon={<DeviceEq24Regular />}
              onClick={handleTestDeviceConnection}
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="extra-small" /> : null}
              测试设备连接记录
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={handleResetSession}
            >
              重置会话
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowClockwise24Regular />}
              onClick={handleResetDeviceRateLimit}
            >
              重置设备频率限制
            </Button>
            <Button
              appearance="subtle"
              icon={<ArrowClockwise24Regular />}
              onClick={refreshSessionInfo}
            >
              刷新状态
            </Button>
            <Button
              appearance="secondary"
              icon={<Info24Regular />}
              onClick={handleDebugPrivacyStatus}
            >
              调试隐私状态
            </Button>
            <Button
              appearance="primary"
              icon={<DataUsage24Regular />}
              onClick={handleForceTrackMainPage}
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="extra-small" /> : null}
              强制主页追踪
            </Button>
            <Button
              appearance="outline"
              icon={<Info24Regular />}
              onClick={handleCheckAppStatus}
            >
              检查应用状态
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
          此页面用于测试和管理用户行为追踪功能。包括：
          <br />• 软件使用记录：每个会话只发送一次，无需API Key认证
          <br />• 设备连接记录：检测到新设备连接时发送，10秒频率限制，无需API Key认证
          <br />• 只有在用户同意隐私政策并启用相应数据收集后，数据才会被发送到后端API
        </Text>
      </div>
    </div>
  );
};

export default UsageTrackingSettings;
