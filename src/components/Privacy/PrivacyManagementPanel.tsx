/**
 * 隐私政策管理面板组件
 * 用于设置页面，允许用户查看和管理隐私设置
 */

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Switch,
  Divider,
  MessageBar,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Shield24Regular,
  Warning24Regular,
  Info24Regular,
  Settings24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { usePrivacyConsentStore, DataCollectionTypes } from '../../stores/privacyConsentStore';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  statusLabel: {
    fontWeight: tokens.fontWeightSemibold,
  },
  statusValue: {
    color: tokens.colorNeutralForeground2,
  },
  dataCollectionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  dataCollectionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
  },
  dangerZone: {
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
  dangerButton: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorPaletteRedForeground3,
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
    },
  },
  timestampText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
});

const PrivacyManagementPanel: React.FC = () => {
  const styles = useStyles();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeType, setRevokeType] = useState<'all' | 'privacy' | 'agreement' | 'data'>('all');

  const {
    hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement,
    hasAcceptedDataCollection,
    dataCollectionTypes,
    privacyPolicyAcceptedAt,
    userAgreementAcceptedAt,
    dataCollectionAcceptedAt,
    privacyPolicyVersion,
    userAgreementVersion,
    updateDataCollectionTypes,
    revokePrivacyPolicy,
    revokeUserAgreement,
    revokeDataCollection,
    revokeAll,
    canCollectData,
  } = usePrivacyConsentStore();

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '未设置';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const handleDataCollectionToggle = (type: keyof DataCollectionTypes, enabled: boolean) => {
    if (!hasAcceptedDataCollection) {
      return;
    }
    updateDataCollectionTypes({ [type]: enabled });
  };

  const handleRevoke = async (type: 'all' | 'privacy' | 'agreement' | 'data') => {
    setRevokeType(type);
    setShowRevokeDialog(true);
  };

  const confirmRevoke = async () => {
    switch (revokeType) {
      case 'all':
        revokeAll();
        break;
      case 'privacy':
        revokePrivacyPolicy();
        break;
      case 'agreement':
        revokeUserAgreement();
        break;
      case 'data':
        revokeDataCollection();
        break;
    }
    
    setShowRevokeDialog(false);
    
    // 撤销后退出应用
    try {
      const { exit } = await import('@tauri-apps/api/app');
      await exit(0);
    } catch (error) {
      console.error('退出应用失败:', error);
      if (window.close) {
        window.close();
      }
    }
  };

  const getRevokeTypeText = (type: string) => {
    switch (type) {
      case 'all': return '所有同意';
      case 'privacy': return '隐私政策同意';
      case 'agreement': return '用户协议同意';
      case 'data': return '数据收集同意';
      default: return '同意';
    }
  };

  return (
    <div className={styles.container}>
      {/* 同意状态概览 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              <Shield24Regular /> 隐私同意状态
            </Text>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <div>
                <Text className={styles.statusLabel}>隐私政策</Text>
                <Text className={styles.timestampText}>
                  版本: {privacyPolicyVersion} | 同意时间: {formatTimestamp(privacyPolicyAcceptedAt)}
                </Text>
              </div>
              <Text className={styles.statusValue}>
                {hasAcceptedPrivacyPolicy ? '✅ 已同意' : '❌ 未同意'}
              </Text>
            </div>
            
            <div className={styles.statusItem}>
              <div>
                <Text className={styles.statusLabel}>用户协议</Text>
                <Text className={styles.timestampText}>
                  版本: {userAgreementVersion} | 同意时间: {formatTimestamp(userAgreementAcceptedAt)}
                </Text>
              </div>
              <Text className={styles.statusValue}>
                {hasAcceptedUserAgreement ? '✅ 已同意' : '❌ 未同意'}
              </Text>
            </div>
            
            <div className={styles.statusItem}>
              <div>
                <Text className={styles.statusLabel}>数据收集</Text>
                <Text className={styles.timestampText}>
                  同意时间: {formatTimestamp(dataCollectionAcceptedAt)}
                </Text>
              </div>
              <Text className={styles.statusValue}>
                {hasAcceptedDataCollection ? '✅ 已同意' : '❌ 未同意'}
              </Text>
            </div>
          </div>

          {!canCollectData() && (
            <MessageBar intent="warning">
              <Warning24Regular />
              当前隐私设置不允许数据收集。软件功能可能受限。
            </MessageBar>
          )}
        </div>
      </Card>

      {/* 数据收集详细设置 */}
      {hasAcceptedDataCollection && (
        <Card className={styles.card}>
          <CardHeader
            header={
              <Text weight="semibold" size={400}>
                <Settings24Regular /> 数据收集设置
              </Text>
            }
          />
          <div className={styles.cardContent}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
              您可以控制具体收集哪些类型的数据。请注意，禁用某些数据收集可能影响软件功能。
            </Text>
            
            <div className={styles.dataCollectionSection}>
              <div className={styles.dataCollectionItem}>
                <div>
                  <Text weight="semibold">设备信息数据</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    操作系统、硬件配置等基本设备信息
                  </Text>
                </div>
                <Switch
                  checked={dataCollectionTypes.deviceData}
                  onChange={(_, data) => handleDataCollectionToggle('deviceData', data.checked)}
                />
              </div>
              
              <div className={styles.dataCollectionItem}>
                <div>
                  <Text weight="semibold">用户行为数据</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    功能使用统计、操作路径等匿名化行为数据
                  </Text>
                </div>
                <Switch
                  checked={dataCollectionTypes.userBehavior}
                  onChange={(_, data) => handleDataCollectionToggle('userBehavior', data.checked)}
                />
              </div>
              
              <div className={styles.dataCollectionItem}>
                <div>
                  <Text weight="semibold">匿名分析数据</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    用于产品改进的匿名统计数据
                  </Text>
                </div>
                <Switch
                  checked={dataCollectionTypes.analytics}
                  onChange={(_, data) => handleDataCollectionToggle('analytics', data.checked)}
                />
              </div>
              
              <div className={styles.dataCollectionItem}>
                <div>
                  <Text weight="semibold">崩溃报告</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    应用崩溃时的错误信息，用于修复问题
                  </Text>
                </div>
                <Switch
                  checked={dataCollectionTypes.crashReporting}
                  onChange={(_, data) => handleDataCollectionToggle('crashReporting', data.checked)}
                />
              </div>
              
              <div className={styles.dataCollectionItem}>
                <div>
                  <Text weight="semibold">性能指标</Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                    应用性能数据，用于优化软件性能
                  </Text>
                </div>
                <Switch
                  checked={dataCollectionTypes.performanceMetrics}
                  onChange={(_, data) => handleDataCollectionToggle('performanceMetrics', data.checked)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 危险操作区域 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              <Warning24Regular /> 撤销同意
            </Text>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.dangerZone}>
            <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground3 }}>
              ⚠️ 危险操作
            </Text>
            <Text size={200} style={{ marginTop: tokens.spacingVerticalS }}>
              撤销同意将导致应用无法正常运行并自动退出。请谨慎操作。
            </Text>
            
            <div style={{ 
              display: 'flex', 
              gap: tokens.spacingHorizontalM, 
              marginTop: tokens.spacingVerticalM,
              flexWrap: 'wrap'
            }}>
              <Button
                size="small"
                className={styles.dangerButton}
                onClick={() => handleRevoke('privacy')}
                disabled={!hasAcceptedPrivacyPolicy}
              >
                撤销隐私政策同意
              </Button>
              <Button
                size="small"
                className={styles.dangerButton}
                onClick={() => handleRevoke('agreement')}
                disabled={!hasAcceptedUserAgreement}
              >
                撤销用户协议同意
              </Button>
              <Button
                size="small"
                className={styles.dangerButton}
                onClick={() => handleRevoke('data')}
                disabled={!hasAcceptedDataCollection}
              >
                撤销数据收集同意
              </Button>
              <Button
                size="small"
                className={styles.dangerButton}
                icon={<Delete24Regular />}
                onClick={() => handleRevoke('all')}
              >
                撤销所有同意
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 撤销确认对话框 */}
      <Dialog open={showRevokeDialog} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <Warning24Regular />
              确认撤销同意
            </DialogTitle>
            <DialogContent>
              <Text>
                您确定要撤销{getRevokeTypeText(revokeType)}吗？
              </Text>
              <Text style={{ marginTop: tokens.spacingVerticalS }}>
                撤销后，应用将无法正常运行并会自动退出。您需要重新启动应用并重新同意相关条款才能继续使用。
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowRevokeDialog(false)}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={confirmRevoke}
                className={styles.dangerButton}
              >
                确认撤销
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PrivacyManagementPanel;
