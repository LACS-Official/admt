/**
 * 隐私政策管理面板组件
 * 用于设置页面，允许用户查看和管理隐私设置
 */

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
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
import { useTranslation } from 'react-i18next';
import {
  Shield24Regular,
  Warning24Regular,
  ArrowReset24Regular,
  DismissCircle24Regular,
} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';
import { clearPreservedUserConfig } from '../Common/UserConfigPreserver';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  card: {
    width: '100%',
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    
    
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
    color: tokens.colorPaletteRedForeground1,
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
  const { t } = useTranslation();
  const [showFirstConfirmDialog, setShowFirstConfirmDialog] = useState(false);
  const [showSecondConfirmDialog, setShowSecondConfirmDialog] = useState(false);

  const {
    hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement,
    hasAcceptedDataCollection,
    privacyPolicyAcceptedAt,
    userAgreementAcceptedAt,
    dataCollectionAcceptedAt,
    privacyPolicyVersion,
    userAgreementVersion,
    revokeAll,
    canCollectData,
  } = usePrivacyConsentStore();

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return t('privacy.not_set');
    return new Date(timestamp).toLocaleString(t('common.locale_tag'));
  };


  // 第一次点击重置按钮，显示第一个确认弹窗
  const handleResetApp = async () => {
    setShowFirstConfirmDialog(true);
  };

  // 第一个确认弹窗中点击"确认重置"，显示第二个确认弹窗
  const handleFirstConfirm = () => {
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(true);
  };

  // 第二个确认弹窗中点击"重置"，执行实际的重置操作
  const handleFinalReset = async () => {
    try {
      console.log('🗑️ 开始执行应用数据重置...');

      // 1. 撤销所有隐私同意
      revokeAll();

      // 2. 清除保留的用户配置
      clearPreservedUserConfig();

      // 4. 清除所有localStorage数据
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`清除localStorage项目失败: ${key}`, error);
        }
      });

      console.log('✅ 应用数据重置完成，准备退出应用...');

      setShowSecondConfirmDialog(false);

      // 5. 重置后退出应用，下次启动将显示欢迎页面
      try {
        // 使用 Tauri v2 的 process 插件重启应用
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      } catch (error) {
        console.error('重启应用失败:', error);
        // 如果重启失败，尝试退出应用
        try {
          const { exit } = await import('@tauri-apps/plugin-process');
          await exit(0);
        } catch (exitError) {
          console.error('退出应用失败:', exitError);
          // 如果 Tauri API 失败，尝试其他方法
          if (window.close) {
            window.close();
          }
        }
      }
    } catch (error) {
      console.error('重置应用数据失败:', error);
      // 即使出错也要关闭弹窗
      setShowSecondConfirmDialog(false);
    }
  };

  // 取消重置操作
  const handleCancelReset = () => {
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(false);
  };

  return (
    <div className={styles.container}>
      {/* 同意状态概览 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              <Shield24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
              {t('privacy.panel_title')}
            </Text>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.statusSection}>
            <div className={styles.statusItem}>
              <div>
                <Text className={styles.statusLabel}>{t('privacy.policy')}</Text>
                <Text className={styles.timestampText}>
                  {t('privacy.accepted_at', { time: formatTimestamp(privacyPolicyAcceptedAt) })}
                </Text>
              </div>
              <Text className={styles.statusValue}>
                {hasAcceptedPrivacyPolicy ? t('privacy.accepted') : t('privacy.not_accepted')}
              </Text>
            </div>
            
            <div className={styles.statusItem}>
              <div>
                <Text className={styles.statusLabel}>{t('privacy.agreement')}</Text>
                <Text className={styles.timestampText}>
                  {t('privacy.accepted_at', { time: formatTimestamp(userAgreementAcceptedAt) })}
                </Text>
              </div>
              <Text className={styles.statusValue}>
                {hasAcceptedUserAgreement ? t('privacy.accepted') : t('privacy.not_accepted')}
              </Text>
            </div>
            
            <div className={styles.statusItem}>
              <div>
                <Text className={styles.statusLabel}>{t('privacy.data_collection')}</Text>
                <Text className={styles.timestampText}>
                  {t('privacy.accepted_at', { time: formatTimestamp(dataCollectionAcceptedAt) })}
                </Text>
              </div>
              <Text className={styles.statusValue}>
                {hasAcceptedDataCollection ? t('privacy.accepted') : t('privacy.not_accepted')}
              </Text>
            </div>
          </div>

          {!canCollectData() && (
            <MessageBar intent="warning">
              <Warning24Regular />
              {t('privacy.collection_warning')}
            </MessageBar>
          )}
        </div>
      </Card>


      {/* 危险操作区域 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              <Warning24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
              {t('privacy.reset_title')}
            </Text>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.dangerZone}>
            <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground3 }}>
              {t('privacy.danger_zone')}
            </Text>
            <Text size={200} style={{ marginTop: tokens.spacingVerticalS }}>
              {t('privacy.reset_desc')}
            </Text>

            <div style={{
              display: 'flex',
              gap: tokens.spacingHorizontalM,
              marginTop: tokens.spacingVerticalM,
              flexWrap: 'wrap'
            }}>
              <Button
                size="medium"
                icon={<ArrowReset24Regular />}
                onClick={handleResetApp}
              >
                {t('privacy.reset_title')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 第一个确认对话框 */}
      <Dialog open={showFirstConfirmDialog} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle style={{ color: tokens.colorPaletteRedForeground3 }}>
              <Warning24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
              {t('privacy.confirm_reset_title')}
            </DialogTitle>
            <DialogContent>
              <Text>
                {t('privacy.confirm_reset_desc')}
              </Text>
              <div style={{ marginTop: tokens.spacingVerticalS, marginLeft: tokens.spacingHorizontalM }}>
                <Text>{t('privacy.reset_item1')}</Text><br />
                <Text>{t('privacy.reset_item2')}</Text><br />
                <Text>{t('privacy.reset_item3')}</Text><br />
                <Text>{t('privacy.reset_item4')}</Text>
              </div>
              <Text style={{ marginTop: tokens.spacingVerticalS, fontWeight: tokens.fontWeightSemibold }}>
                {t('privacy.irreversible_notice')}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={handleCancelReset}
              >
                {t('common.cancel')}
              </Button>
              <Button
                appearance="primary"
                onClick={handleFirstConfirm}
              >
                {t('common.confirm_reset')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 第二个确认对话框 */}
      <Dialog open={showSecondConfirmDialog} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <DismissCircle24Regular style={{ marginRight: tokens.spacingHorizontalS }} />
              {t('privacy.final_confirm_title')}
            </DialogTitle>
            <DialogContent>
              <Text style={{
                fontSize: tokens.fontSizeBase300,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorPaletteRedForeground3
              }}>
                {t('privacy.last_chance')}
              </Text>
              <Text style={{ marginTop: tokens.spacingVerticalM }}>
                {t('privacy.will_perform')}
              </Text>
              <div style={{
                marginTop: tokens.spacingVerticalS,
                marginLeft: tokens.spacingHorizontalM,
                backgroundColor: tokens.colorPaletteRedBackground1,
                padding: tokens.spacingVerticalS,
                borderRadius: tokens.borderRadiusSmall,
                border: `1px solid ${tokens.colorPaletteRedBorder1}`
              }}>
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>{t('privacy.final_item1')}</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>{t('privacy.final_item2')}</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>{t('privacy.final_item3')}</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>{t('privacy.final_item4')}</Text>
              </div>
              <Text style={{
                marginTop: tokens.spacingVerticalM,
                fontWeight: tokens.fontWeightBold,
                color: tokens.colorPaletteRedForeground3
              }}>
                {t('privacy.final_notice')}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={handleCancelReset}
              >
                {t('common.cancel')}
              </Button>
              <Button
                appearance="primary"
                onClick={handleFinalReset}
                style={{
                  backgroundColor: tokens.colorPaletteRedBackground3,
                  borderColor: tokens.colorPaletteRedBorder2
                }}
              >
                {t('common.reset')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PrivacyManagementPanel;
