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
import {
  Shield24Regular,
  Warning24Regular,
  ArrowReset24Regular,
  DismissCircle24Regular,
} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';
import { ActivationService } from '../../services/activationService';
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
    if (!timestamp) return '未设置';
    return new Date(timestamp).toLocaleString('zh-CN');
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

      // 2. 清除激活码数据
      const activationService = ActivationService.getInstance();
      activationService.clearActivationData();

      // 3. 清除保留的用户配置
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


      {/* 危险操作区域 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <Text weight="semibold" size={400}>
              <Warning24Regular /> 重置应用数据
            </Text>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.dangerZone}>
            <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground3 }}>
              ⚠️ 危险操作
            </Text>
            <Text size={200} style={{ marginTop: tokens.spacingVerticalS }}>
              重置应用数据将完全清除所有用户数据和设置，撤销所有已同意的条款，并将应用恢复到首次安装时的初始状态。此操作不可逆转，请谨慎操作。
            </Text>

            <div style={{
              display: 'flex',
              gap: tokens.spacingHorizontalM,
              marginTop: tokens.spacingVerticalM,
              flexWrap: 'wrap'
            }}>
              <Button
                size="medium"
                className={styles.dangerButton}
                icon={<ArrowReset24Regular />}
                onClick={handleResetApp}
              >
                重置应用数据
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 第一个确认对话框 */}
      <Dialog open={showFirstConfirmDialog} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <Warning24Regular />
              确认重置应用数据
            </DialogTitle>
            <DialogContent>
              <Text>
                您确定要重置应用数据吗？此操作将：
              </Text>
              <div style={{ marginTop: tokens.spacingVerticalS, marginLeft: tokens.spacingHorizontalM }}>
                <Text>• 清除所有用户数据和设置</Text><br />
                <Text>• 撤销所有已同意的条款和政策</Text><br />
                <Text>• 将应用恢复到首次安装时的状态</Text><br />
                <Text>• 删除本地激活码数据并不再支持使用本地储存的激活码</Text><br />
                <Text>• 下次启动时显示欢迎页面和首次使用流程</Text>
              </div>
              <Text style={{ marginTop: tokens.spacingVerticalS, fontWeight: tokens.fontWeightSemibold }}>
                此操作不可逆转，请谨慎操作！
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={handleCancelReset}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={handleFirstConfirm}
                className={styles.dangerButton}
              >
                确认重置
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
              <DismissCircle24Regular />
              最终确认重置
            </DialogTitle>
            <DialogContent>
              <Text style={{
                fontSize: tokens.fontSizeBase300,
                fontWeight: tokens.fontWeightSemibold,
                color: tokens.colorPaletteRedForeground3
              }}>
                ⚠️ 这是最后一次确认机会！
              </Text>
              <Text style={{ marginTop: tokens.spacingVerticalM }}>
                重置操作即将执行，这将：
              </Text>
              <div style={{
                marginTop: tokens.spacingVerticalS,
                marginLeft: tokens.spacingHorizontalM,
                backgroundColor: tokens.colorPaletteRedBackground1,
                padding: tokens.spacingVerticalS,
                borderRadius: tokens.borderRadiusSmall,
                border: `1px solid ${tokens.colorPaletteRedBorder1}`
              }}>
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>• 永久删除所有应用数据</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>• 清除所有用户设置和偏好</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>• 撤销所有隐私政策同意</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>• 删除激活码和许可证信息</Text><br />
                <Text style={{ fontWeight: tokens.fontWeightSemibold }}>• 应用将自动退出并重启</Text>
              </div>
              <Text style={{
                marginTop: tokens.spacingVerticalM,
                fontWeight: tokens.fontWeightBold,
                color: tokens.colorPaletteRedForeground3
              }}>
                此操作无法撤销！确定要继续吗？
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={handleCancelReset}
              >
                取消
              </Button>
              <Button
                appearance="primary"
                onClick={handleFinalReset}
                className={styles.dangerButton}
                style={{
                  backgroundColor: tokens.colorPaletteRedBackground3,
                  borderColor: tokens.colorPaletteRedBorder2
                }}
              >
                重置
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PrivacyManagementPanel;
