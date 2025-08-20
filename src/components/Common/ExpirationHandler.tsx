/**
 * 过期处理组件
 * 负责处理激活码过期的检查、清理和用户提示
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
  ProgressBar,
} from '@fluentui/react-components';
import {
  Warning24Regular,
  ErrorCircle24Regular,
  Clock24Regular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import { activationService } from '../../services/activationService';
import { formatActivationExpiryDate } from '../../utils/dateFormatter';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: '450px',
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
  clockIcon: {
    color: tokens.colorBrandForeground1,
  },
  countdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteRedForeground1,
  },
});

interface ExpirationHandlerProps {
  onExpired?: () => void;
  onReactivateRequested?: () => void;
  checkInterval?: number; // 检查间隔（毫秒），默认60秒
}

export const ExpirationHandler: React.FC<ExpirationHandlerProps> = ({
  onExpired,
  onReactivateRequested,
  checkInterval = 60000, // 默认60秒检查一次
}) => {
  const styles = useStyles();
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);
  const [expirationInfo, setExpirationInfo] = useState<{
    isExpired: boolean;
    expiryDate?: Date;
    expiredReason?: string;
    remainingMinutes?: number;
  } | null>(null);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  // 检查过期状态
  const checkExpirationStatus = () => {
    try {
      const activationStatus = activationService.checkActivationStatus();
      const daysRemaining = activationService.getActivationDaysRemaining();
      
      if (activationStatus.isExpired) {
        console.log('检测到激活码已过期:', activationStatus.expiredReason);
        
        setExpirationInfo({
          isExpired: true,
          expiryDate: activationStatus.expiryDate,
          expiredReason: activationStatus.expiredReason,
        });
        
        setShowExpirationDialog(true);
        
        // 启动自动关闭倒计时（30秒后自动处理）
        setAutoCloseCountdown(30);
        
        return true; // 已过期
      } else if (daysRemaining !== null && daysRemaining <= 1) {
        // 24小时内过期，显示紧急提醒
        const remainingMinutes = Math.max(0, Math.floor(daysRemaining * 24 * 60));
        
        setExpirationInfo({
          isExpired: false,
          expiryDate: activationStatus.expiryDate,
          remainingMinutes,
        });
        
        setShowExpirationDialog(true);
        return false; // 未过期但临近
      }
      
      return false; // 正常状态
    } catch (error) {
      console.error('检查过期状态失败:', error);
      return false;
    }
  };

  // 处理过期激活码
  const handleExpiredActivation = () => {
    try {
      console.log('开始处理过期激活码...');
      
      const result = activationService.handleExpiredActivation();
      console.log('过期处理结果:', result);
      
      setShowExpirationDialog(false);
      setAutoCloseCountdown(null);
      
      // 通知父组件
      if (onExpired) {
        onExpired();
      }
    } catch (error) {
      console.error('处理过期激活码失败:', error);
    }
  };

  // 请求重新激活
  const handleReactivateRequest = () => {
    setShowExpirationDialog(false);
    setAutoCloseCountdown(null);
    
    if (onReactivateRequested) {
      onReactivateRequested();
    }
  };

  // 自动关闭倒计时
  useEffect(() => {
    if (autoCloseCountdown === null) return;
    
    if (autoCloseCountdown <= 0) {
      handleExpiredActivation();
      return;
    }
    
    const timer = setTimeout(() => {
      setAutoCloseCountdown(autoCloseCountdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [autoCloseCountdown]);

  // 定期检查过期状态
  useEffect(() => {
    // 立即检查一次
    checkExpirationStatus();
    
    // 设置定期检查
    const interval = setInterval(checkExpirationStatus, checkInterval);
    
    return () => clearInterval(interval);
  }, [checkInterval]);

  // 格式化剩余时间显示
  const formatRemainingTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} 分钟`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} 小时 ${remainingMinutes} 分钟`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return `${days} 天 ${remainingHours} 小时`;
    }
  };

  if (!expirationInfo) return null;

  return (
    <Dialog open={showExpirationDialog} onOpenChange={(_, data) => !data.open && setShowExpirationDialog(false)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {expirationInfo.isExpired ? (
                <ErrorCircle24Regular className={styles.errorIcon} />
              ) : (
                <Warning24Regular className={styles.warningIcon} />
              )}
              {expirationInfo.isExpired ? '激活码已过期' : '激活码即将过期'}
            </div>
          </DialogTitle>
          
          <DialogContent>
            <div className={styles.dialogContent}>
              {expirationInfo.isExpired ? (
                <>
                  <Text>
                    您的激活码已过期，无法继续使用HOUT工具箱的完整功能。
                    {expirationInfo.expiredReason && ` (${expirationInfo.expiredReason})`}
                  </Text>
                  
                  <div className={styles.statusInfo}>
                    <div className={styles.statusRow}>
                      <Text weight="semibold">过期时间:</Text>
                      <Text>{formatActivationExpiryDate(expirationInfo.expiryDate)}</Text>
                    </div>
                    <div className={styles.statusRow}>
                      <Text weight="semibold">当前状态:</Text>
                      <Text style={{ color: tokens.colorPaletteRedForeground1 }}>已过期</Text>
                    </div>
                  </div>

                  {autoCloseCountdown !== null && (
                    <div className={styles.countdown}>
                      <Text size={300}>
                        <Clock24Regular className={styles.clockIcon} />
                        {` ${autoCloseCountdown} 秒后自动清理过期数据`}
                      </Text>
                      <ProgressBar 
                        value={30 - autoCloseCountdown} 
                        max={30} 
                        color="warning"
                      />
                    </div>
                  )}

                  <MessageBar intent="warning">
                    过期后您仍可以使用基础功能，但高级功能将被限制。重新激活后可恢复所有功能。
                  </MessageBar>
                </>
              ) : (
                <>
                  <Text>
                    您的激活码即将过期，建议尽快重新激活以避免功能受限。
                  </Text>
                  
                  <div className={styles.statusInfo}>
                    <div className={styles.statusRow}>
                      <Text weight="semibold">过期时间:</Text>
                      <Text>{formatActivationExpiryDate(expirationInfo.expiryDate)}</Text>
                    </div>
                    <div className={styles.statusRow}>
                      <Text weight="semibold">剩余时间:</Text>
                      <Text className={styles.timeDisplay}>
                        {expirationInfo.remainingMinutes !== undefined
                          ? formatRemainingTime(expirationInfo.remainingMinutes)
                          : '未知'}
                      </Text>
                    </div>
                  </div>

                  <MessageBar intent="info">
                    建议在过期前完成重新激活，以确保不会影响您的工作。
                  </MessageBar>
                </>
              )}
            </div>
          </DialogContent>
          
          <DialogActions>
            {expirationInfo.isExpired ? (
              <>
                <Button appearance="secondary" onClick={handleExpiredActivation}>
                  确认清理
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowClockwise24Regular />}
                  onClick={handleReactivateRequest}
                >
                  立即重新激活
                </Button>
              </>
            ) : (
              <>
                <Button appearance="secondary" onClick={() => setShowExpirationDialog(false)}>
                  稍后提醒
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowClockwise24Regular />}
                  onClick={handleReactivateRequest}
                >
                  立即重新激活
                </Button>
              </>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ExpirationHandler;
