/**
 * 激活状态显示卡片组件
 * 显示当前激活状态、剩余天数、功能列表等信息
 */

import React from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  tokens,
  Body1,
  Caption1,
  Subtitle2,
  ProgressBar,
} from '@fluentui/react-components';
import {
  ShieldCheckmark24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
  Clock24Regular,
  Star24Regular,
} from '@fluentui/react-icons';
import { ActivationStatus } from '../../types/welcome';
import { activationService } from '../../services/activationService';
import { formatActivationExpiryDate } from '../../utils/dateFormatter';

const useStyles = makeStyles({
  card: {
    width: '100%',
    maxWidth: '500px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusIcon: {
    fontSize: '24px',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuresList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  expiryWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorCard: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
  },
  successCard: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
  },
  warningCard: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
  },
});

interface ActivationStatusCardProps {
  status: ActivationStatus;
  expiryDate?: Date;
  features?: string[];
  className?: string;
}

export const ActivationStatusCard: React.FC<ActivationStatusCardProps> = ({
  status,
  expiryDate,
  features = [],
  className,
}) => {
  const styles = useStyles();

  // 获取激活状态信息
  const activationInfo = activationService.checkActivationStatus();
  const daysRemaining = activationService.getActivationDaysRemaining();

  // 根据状态确定样式和图标
  const getStatusInfo = () => {
    switch (status) {
      case ActivationStatus.ACTIVATED:
        return {
          icon: <ShieldCheckmark24Regular className={styles.statusIcon} />,
          title: '激活成功',
          description: '应用已成功激活，所有功能可正常使用',
          cardStyle: styles.successCard,
          badgeAppearance: 'filled' as const,
          badgeColor: 'success' as const,
        };
      case ActivationStatus.EXPIRED:
        return {
          icon: <ErrorCircle24Regular className={styles.statusIcon} />,
          title: '激活已过期',
          description: '激活码已过期，请重新激活以继续使用',
          cardStyle: styles.errorCard,
          badgeAppearance: 'filled' as const,
          badgeColor: 'danger' as const,
        };
      case ActivationStatus.ACTIVATION_FAILED:
        return {
          icon: <ErrorCircle24Regular className={styles.statusIcon} />,
          title: '激活失败',
          description: '激活过程中出现错误，请检查激活码或网络连接',
          cardStyle: styles.errorCard,
          badgeAppearance: 'filled' as const,
          badgeColor: 'danger' as const,
        };
      case ActivationStatus.ACTIVATING:
        return {
          icon: <Clock24Regular className={styles.statusIcon} />,
          title: '激活中',
          description: '正在验证激活码，请稍候...',
          cardStyle: '',
          badgeAppearance: 'filled' as const,
          badgeColor: 'warning' as const,
        };
      default:
        return {
          icon: <Warning24Regular className={styles.statusIcon} />,
          title: '未激活',
          description: '应用尚未激活，请输入有效的激活码',
          cardStyle: styles.warningCard,
          badgeAppearance: 'outline' as const,
          badgeColor: 'warning' as const,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // 计算过期进度（用于显示剩余时间）
  const getExpiryProgress = () => {
    if (!expiryDate || !daysRemaining) return null;

    const totalDays = 365; // 假设总有效期为365天
    const progress = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
    
    return {
      progress,
      isNearExpiry: daysRemaining <= 30,
      isVeryNearExpiry: daysRemaining <= 7,
    };
  };

  const expiryProgress = getExpiryProgress();

  return (
    <Card className={`${styles.card} ${statusInfo.cardStyle} ${className || ''}`}>
      <CardHeader
        header={
          <div className={styles.header}>
            {statusInfo.icon}
            <div>
              <Subtitle2>{statusInfo.title}</Subtitle2>
              <Caption1>{statusInfo.description}</Caption1>
            </div>
          </div>
        }
        action={
          <Badge
            appearance={statusInfo.badgeAppearance}
            color={statusInfo.badgeColor}
          >
            {status === ActivationStatus.ACTIVATED ? '已激活' : 
             status === ActivationStatus.EXPIRED ? '已过期' :
             status === ActivationStatus.ACTIVATION_FAILED ? '失败' :
             status === ActivationStatus.ACTIVATING ? '激活中' : '未激活'}
          </Badge>
        }
      />
      
      <CardPreview>
        <div className={styles.content}>
          {/* 过期时间信息 */}
          {expiryDate && status === ActivationStatus.ACTIVATED && (
            <div className={styles.statusRow}>
              <Body1>过期时间:</Body1>
              <Text>{formatActivationExpiryDate(expiryDate)}</Text>
            </div>
          )}

          {/* 剩余天数和进度条 */}
          {daysRemaining !== null && status === ActivationStatus.ACTIVATED && (
            <div className={styles.progressSection}>
              <div className={styles.statusRow}>
                <Body1>剩余天数:</Body1>
                <Text weight="semibold">
                  {daysRemaining} 天
                </Text>
              </div>
              
              {expiryProgress && (
                <ProgressBar
                  value={expiryProgress.progress}
                  max={100}
                  color={expiryProgress.isVeryNearExpiry ? 'error' : 
                         expiryProgress.isNearExpiry ? 'warning' : 'success'}
                />
              )}
            </div>
          )}

          {/* 过期警告 */}
          {expiryProgress?.isNearExpiry && status === ActivationStatus.ACTIVATED && (
            <div className={styles.expiryWarning}>
              <Warning24Regular />
              <Text size={300}>
                {expiryProgress.isVeryNearExpiry 
                  ? '激活即将过期，请及时续期' 
                  : '激活将在30天内过期，建议提前续期'}
              </Text>
            </div>
          )}

          {/* 功能列表 */}
          {features.length > 0 && (
            <div>
              <Body1>已激活功能:</Body1>
              <div className={styles.featuresList}>
                {features.map((feature, index) => (
                  <Badge
                    key={index}
                    appearance="outline"
                    color="brand"
                    icon={<Star24Regular />}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardPreview>
    </Card>
  );
};

export default ActivationStatusCard;
