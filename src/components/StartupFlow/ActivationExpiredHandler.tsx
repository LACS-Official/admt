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
  tokens,
} from '@fluentui/react-components';
import {
  Warning24Filled,
  Clock24Regular,
  Key24Regular,
  StoreMicrosoft24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { ActivationStatus } from '../../stores/startupFlowStore';
import { motion, AnimatePresence } from 'framer-motion';

import { formatActivationExpiryDate } from '../../utils/dateFormatter';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--colorNeutralBackground1) 100%)',
    color: 'var(--colorNeutralForeground1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
  },
  card: {
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '560px',
    width: '100%',
    color: 'var(--colorNeutralForeground1)',
    border: '1px solid var(--colorNeutralStroke2)',
    boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.16)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  warningIcon: {
    fontSize: '44px',
    marginBottom: '12px',
    color: 'var(--colorPaletteRedForeground1)',
  },
  statusSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderRadius: '14px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  statusDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
    marginTop: '14px',
  },
  statusItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  gracePeriodSection: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: '14px',
    border: '1px solid rgba(245, 158, 11, 0.25)',
  },
  gracePeriodHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  countdownSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    marginTop: '10px',
  },
  countdownItem: {
    textAlign: 'center',
    padding: '8px 12px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '10px',
    border: '1px solid var(--colorNeutralStroke2)',
    minWidth: '60px',
  },
  optionsSection: {
    marginBottom: '20px',
  },
  optionCard: {
    padding: '16px',
    border: '1px solid var(--colorNeutralStroke2)',
    borderRadius: '14px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
      borderColor: 'var(--colorBrandStroke1)',
      backgroundColor: 'var(--colorNeutralBackground1Hover)',
      transform: 'translateY(-1px)',
    },
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  optionIcon: {
    fontSize: '20px',
    color: 'var(--colorBrandForeground1)',
  },
  actionSection: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    minWidth: '140px',
    borderRadius: '9999px',
    fontWeight: 500,
  },
  secondaryButton: {
    minWidth: '120px',
    borderRadius: '9999px',
    fontWeight: 500,
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
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
        style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'center' }}
      >
        <Card className={styles.card}>
          <div className={styles.header}>
            <motion.div 
              className={styles.warningIcon}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <Warning24Filled />
            </motion.div>
            <Title1>激活已过期</Title1>
            <Body1>您的激活码已过期，需要重新激活才能继续使用完整功能</Body1>
          </div>

          {/* 激活状态详情 */}
          <motion.div 
            className={styles.statusSection}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
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
          </motion.div>

          {/* 宽限期倒计时 */}
          <AnimatePresence>
            {isInGracePeriod && timeRemaining && (
              <motion.div 
                className={styles.gracePeriodSection}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* 解决方案选项 */}
          <motion.div 
            className={styles.optionsSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Title2 style={{ marginBottom: '16px' }}>解决方案</Title2>
            
            <motion.div 
              className={styles.optionCard} 
              onClick={handleNewActivationCode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={styles.optionHeader}>
                <Key24Regular className={styles.optionIcon} />
                <Text weight="semibold">输入新的激活码</Text>
              </div>
              <Caption1>
                如果您有新的激活码，请点击此处输入以重新激活
              </Caption1>
            </motion.div>

            {onPurchase && (
              <motion.div 
                className={styles.optionCard} 
                onClick={onPurchase}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.optionHeader}>
                  <StoreMicrosoft24Regular className={styles.optionIcon} />
                  <Text weight="semibold">购买新的激活码</Text>
                </div>
                <Caption1>
                  前往官方网站购买新的激活码以继续使用完整功能
                </Caption1>
              </motion.div>
            )}
          </motion.div>

          {/* 操作按钮 */}
          <motion.div 
            className={styles.actionSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
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
          </motion.div>

          {!isInGracePeriod && (
            <MessageBar intent="error" style={{ marginTop: '16px' }}>
              宽限期已结束，部分功能将受到限制。请尽快重新激活以恢复完整功能。
            </MessageBar>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ActivationExpiredHandler;
