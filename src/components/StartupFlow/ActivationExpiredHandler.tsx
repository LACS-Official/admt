/**
 * 激活过期处理组件
 * 处理激活码过期的情况，提供重新激活选项
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Title1,
  Title2,
  Body1,
  Caption1,
  Card,
  MessageBar,
  Badge,
} from '@fluentui/react-components';
import {
  Warning24Filled,
  Clock24Regular,
  Key24Regular,
  StoreMicrosoft24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { ActivationStatus } from '../../stores/startupFlowStore';

import { formatActivationExpiryDate } from '../../utils/dateFormatter';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #d83b01 0%, #f7630c 100%)',
    color: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    color: '#323130',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  warningIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    color: '#d83b01',
  },
  statusSection: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#fed9cc',
    borderRadius: '12px',
    border: '2px solid #d83b01',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  statusDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '16px',
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  gracePeriodSection: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fff4ce',
    borderRadius: '8px',
    border: '1px solid #ffb900',
  },
  gracePeriodHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  countdownSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '12px',
  },
  countdownItem: {
    textAlign: 'center',
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    minWidth: '60px',
  },
  optionsSection: {
    marginBottom: '24px',
  },
  optionCard: {
    padding: '16px',
    border: '2px solid #e1dfdd',
    borderRadius: '8px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      border: '2px solid #6264a7',
      backgroundColor: '#f8f7ff',
    },
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  optionIcon: {
    fontSize: '20px',
    color: '#6264a7',
  },
  actionSection: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    minWidth: '140px',
  },
  secondaryButton: {
    minWidth: '120px',
  },
});

interface ActivationExpiredHandlerProps {
  activationStatus: ActivationStatus;
  onReactivate: (newStatus: ActivationStatus) => void;
  onContinueWithLimitations?: () => void;
  onPurchase?: () => void;
}

const ActivationExpiredHandler: React.FC<ActivationExpiredHandlerProps> = ({
  activationStatus,
  onReactivate,
  onContinueWithLimitations,
  onPurchase,
}) => {
  const styles = useStyles();
  const [showActivationInput, setShowActivationInput] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // 计算剩余宽限期时间
  useEffect(() => {
    if (!activationStatus.expiresAt || !activationStatus.gracePeriodDays) {
      return;
    }

    const updateCountdown = () => {
      const expiredDate = new Date(activationStatus.expiresAt!);
      const gracePeriodEnd = new Date(expiredDate.getTime() + (activationStatus.gracePeriodDays! * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diff = gracePeriodEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activationStatus]);

  const formatDate = (dateString: string): string => {
    return formatActivationExpiryDate(dateString);
  };

  const handleNewActivationCode = () => {
    setShowActivationInput(true);
  };



  // TODO: 添加激活码验证器组件
  if (showActivationInput) {
    return null;
  }

  const isInGracePeriod = timeRemaining !== null;

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.warningIcon}>
            <Warning24Filled />
          </div>
          <Title1>激活已过期</Title1>
          <Body1>您的激活码已过期，需要重新激活才能继续使用完整功能</Body1>
        </div>

        {/* 激活状态详情 */}
        <div className={styles.statusSection}>
          <div className={styles.statusHeader}>
            <Clock24Regular style={{ fontSize: '20px', color: '#d83b01' }} />
            <Text weight="semibold">激活状态详情</Text>
          </div>
          
          <div className={styles.statusDetails}>
            <div className={styles.statusItem}>
              <Caption1>激活码</Caption1>
              <Text weight="semibold">{activationStatus.code || '未知'}</Text>
            </div>
            <div className={styles.statusItem}>
              <Caption1>过期时间</Caption1>
              <Text weight="semibold">
                {activationStatus.expiresAt ? formatDate(activationStatus.expiresAt) : '未知'}
              </Text>
            </div>
            <div className={styles.statusItem}>
              <Caption1>激活时间</Caption1>
              <Text weight="semibold">
                {activationStatus.activatedAt ? formatDate(activationStatus.activatedAt) : '未知'}
              </Text>
            </div>
            <div className={styles.statusItem}>
              <Caption1>状态</Caption1>
              <Badge appearance="filled" color="danger">已过期</Badge>
            </div>
          </div>
        </div>

        {/* 宽限期倒计时 */}
        {isInGracePeriod && timeRemaining && (
          <div className={styles.gracePeriodSection}>
            <div className={styles.gracePeriodHeader}>
              <Info24Regular style={{ fontSize: '16px', color: '#ffb900' }} />
              <Text weight="semibold">宽限期剩余时间</Text>
            </div>
            <Body1>
              在宽限期内，您仍可以使用基本功能。宽限期结束后，功能将受到限制。
            </Body1>
            
            <div className={styles.countdownSection}>
              <div className={styles.countdownItem}>
                <Text weight="bold" size={500}>{timeRemaining.days}</Text>
                <Caption1>天</Caption1>
              </div>
              <div className={styles.countdownItem}>
                <Text weight="bold" size={500}>{timeRemaining.hours}</Text>
                <Caption1>时</Caption1>
              </div>
              <div className={styles.countdownItem}>
                <Text weight="bold" size={500}>{timeRemaining.minutes}</Text>
                <Caption1>分</Caption1>
              </div>
              <div className={styles.countdownItem}>
                <Text weight="bold" size={500}>{timeRemaining.seconds}</Text>
                <Caption1>秒</Caption1>
              </div>
            </div>
          </div>
        )}

        {/* 解决方案选项 */}
        <div className={styles.optionsSection}>
          <Title2 style={{ marginBottom: '16px' }}>解决方案</Title2>
          
          <div className={styles.optionCard} onClick={handleNewActivationCode}>
            <div className={styles.optionHeader}>
              <Key24Regular className={styles.optionIcon} />
              <Text weight="semibold">输入新的激活码</Text>
            </div>
            <Caption1>
              如果您有新的激活码，请点击此处输入以重新激活
            </Caption1>
          </div>

          {onPurchase && (
            <div className={styles.optionCard} onClick={onPurchase}>
              <div className={styles.optionHeader}>
                <StoreMicrosoft24Regular className={styles.optionIcon} />
                <Text weight="semibold">购买新的激活码</Text>
              </div>
              <Caption1>
                前往官方网站购买新的激活码以继续使用完整功能
              </Caption1>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={styles.actionSection}>
          <Button
            appearance="primary"
            className={styles.primaryButton}
            icon={<Key24Regular />}
            onClick={handleNewActivationCode}
          >
            重新激活
          </Button>
          
          {onPurchase && (
            <Button
              appearance="secondary"
              className={styles.secondaryButton}
              icon={<StoreMicrosoft24Regular />}
              onClick={onPurchase}
            >
              购买激活码
            </Button>
          )}
          
          {onContinueWithLimitations && isInGracePeriod && (
            <Button
              appearance="subtle"
              className={styles.secondaryButton}
              onClick={onContinueWithLimitations}
            >
              继续使用
            </Button>
          )}
        </div>

        {!isInGracePeriod && (
          <MessageBar intent="error" style={{ marginTop: '16px' }}>
            宽限期已结束，部分功能将受到限制。请尽快重新激活以恢复完整功能。
          </MessageBar>
        )}
      </Card>
    </div>
  );
};

export default ActivationExpiredHandler;
