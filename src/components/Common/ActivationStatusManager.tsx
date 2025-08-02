/**
 * 激活状态管理组件
 * 负责监控激活状态、处理过期提醒、管理重新激活流程
 */

import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Button,
  Text,
  MessageBar,
  tokens,
} from '@fluentui/react-components';
import {
  Warning24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { useAppConfigStore } from '../../stores/welcomeStore';
import { activationService } from '../../services/activationService';
import { ActivationStatus } from '../../types/welcome';
import { formatActivationExpiryDate } from '../../utils/dateFormatter';

const useStyles = makeStyles({
  messageBar: {
    marginBottom: '16px',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: '400px',
  },
  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningIcon: {
    color: tokens.colorPaletteYellowForeground1,
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  infoIcon: {
    color: tokens.colorBrandForeground1,
  },
});

interface ActivationStatusManagerProps {
  children?: React.ReactNode;
}

export const ActivationStatusManager: React.FC<ActivationStatusManagerProps> = ({ children }) => {
  const styles = useStyles();
  const { config, setConfig } = useAppConfigStore();
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);

  // 检查激活状态和过期情况
  useEffect(() => {
    const checkActivationStatus = () => {
      const activationInfo = activationService.checkActivationStatus();
      const daysRemaining = activationService.getActivationDaysRemaining();

      // 如果已过期，显示过期对话框
      if (activationInfo.isExpired && config.isActivated) {
        setShowExpiryDialog(true);
        return;
      }

      // 如果临近过期（7天内），显示警告
      if (daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && !dismissedWarning) {
        setShowExpiryWarning(true);
      } else {
        setShowExpiryWarning(false);
      }
    };

    // 立即检查一次
    checkActivationStatus();

    // 每小时检查一次
    const interval = setInterval(checkActivationStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [config.isActivated, dismissedWarning]);

  // 处理过期对话框关闭
  const handleExpiryDialogClose = () => {
    setShowExpiryDialog(false);
    // 更新配置状态为过期
    setConfig({
      activationStatus: ActivationStatus.EXPIRED,
      isActivated: false,
    });
  };

  // 处理重新激活
  const handleReactivate = () => {
    setShowExpiryDialog(false);
    // 清除本地激活数据
    activationService.clearActivationData();
    // 更新配置状态
    setConfig({
      activationStatus: ActivationStatus.NOT_ACTIVATED,
      isActivated: false,
    });
    // 重新加载页面以显示激活界面
    window.location.reload();
  };

  // 处理警告消息关闭
  const handleWarningDismiss = () => {
    setShowExpiryWarning(false);
    setDismissedWarning(true);
    // 24小时后重新显示警告
    setTimeout(() => setDismissedWarning(false), 24 * 60 * 60 * 1000);
  };

  // 获取剩余天数
  const daysRemaining = activationService.getActivationDaysRemaining();

  return (
    <>
      {children}
      
      {/* 过期警告消息条 */}
      {showExpiryWarning && daysRemaining !== null && (
        <MessageBar
          className={styles.messageBar}
          intent="warning"
          actions={
            <Button
              appearance="transparent"
              icon={<Dismiss24Regular />}
              onClick={handleWarningDismiss}
              aria-label="关闭警告"
            />
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warning24Regular className={styles.warningIcon} />
            <Text>
              您的激活码将在 {daysRemaining} 天后过期，请及时续期以避免功能受限。
            </Text>
          </div>
        </MessageBar>
      )}

      {/* 过期对话框 */}
      <Dialog open={showExpiryDialog} onOpenChange={(_, data) => !data.open && handleExpiryDialogClose()}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ErrorCircle24Regular className={styles.errorIcon} />
                激活码已过期
              </div>
            </DialogTitle>
            <DialogContent>
              <div className={styles.dialogContent}>
                <Text>
                  您的激活码已于 {formatActivationExpiryDate(config.expiryDate)} 过期。
                  为了继续使用HOUT工具箱的完整功能，请重新激活应用。
                </Text>

                <div className={styles.statusInfo}>
                  <div className={styles.statusRow}>
                    <Text weight="semibold">当前状态:</Text>
                    <Text style={{ color: tokens.colorPaletteRedForeground1 }}>已过期</Text>
                  </div>
                  <div className={styles.statusRow}>
                    <Text weight="semibold">过期时间:</Text>
                    <Text>{formatActivationExpiryDate(config.expiryDate)}</Text>
                  </div>
                  <div className={styles.statusRow}>
                    <Text weight="semibold">已激活功能:</Text>
                    <Text>{config.features.length > 0 ? config.features.join(', ') : '无'}</Text>
                  </div>
                </div>

                <MessageBar intent="info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info24Regular className={styles.infoIcon} />
                    <Text size={300}>
                      过期后您仍可以使用基础功能，但高级功能将被限制。重新激活后可恢复所有功能。
                    </Text>
                  </div>
                </MessageBar>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleExpiryDialogClose}>
                稍后处理
              </Button>
              <Button appearance="primary" onClick={handleReactivate}>
                立即重新激活
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

// 激活状态监控Hook
export const useActivationMonitor = () => {
  const { config } = useAppConfigStore();
  const [activationInfo, setActivationInfo] = useState(() => 
    activationService.checkActivationStatus()
  );

  useEffect(() => {
    const updateActivationInfo = () => {
      const info = activationService.checkActivationStatus();
      setActivationInfo(info);
    };

    // 每分钟更新一次激活信息
    const interval = setInterval(updateActivationInfo, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...activationInfo,
    daysRemaining: activationService.getActivationDaysRemaining(),
    shouldRevalidate: activationService.shouldRevalidateActivation(),
  };
};

export default ActivationStatusManager;
