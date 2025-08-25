/**
 * 用户信息弹窗组件
 * 显示激活码信息、过期时间，并提供删除本地激活数据的功能
 */

import React, { useEffect, useState }  from 'react';
import {
  makeStyles,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  Button,
  Text,
  Title3,
  Body1,
  Caption1,
  Divider,
  MessageBar,
  MessageBarBody,
  Spinner,
} from '@fluentui/react-components';
import {
  Person24Regular,
  Key24Regular,
  Calendar24Regular,
  Delete24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { activationService } from '../../services/activationService';
import { useAppConfigStore, useWelcomeStore } from '../../stores/welcomeStore';
import { useStartupFlowStore } from '../../stores/startupFlowStore';
import { WelcomeStep } from '../../types/welcome';
import { formatActivationExpiryDate } from '../../utils/dateFormatter';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: '400px',
    maxWidth: '500px',
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  infoIcon: {
    color: 'var(--colorBrandForeground1)',
    flexShrink: 0,
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  infoLabel: {
    fontWeight: '600',
    color: 'var(--colorNeutralForeground1)',
  },
  infoValue: {
    color: 'var(--colorNeutralForeground2)',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  dangerZone: {
    padding: '16px',
    backgroundColor: 'var(--colorPaletteRedBackground1)',
    borderRadius: '8px',
    border: '1px solid var(--colorPaletteRedBorder1)',
  },
  dangerTitle: {
    color: 'var(--colorPaletteRedForeground1)',
    fontWeight: '600',
    marginBottom: '8px',
  },
  dangerDescription: {
    color: 'var(--colorNeutralForeground2)',
    marginBottom: '12px',
  },
  deleteButton: {
    backgroundColor: 'var(--colorPaletteRedBackground2)',
    color: 'var(--colorPaletteRedForeground2)',
    ':hover': {
      backgroundColor: 'var(--colorPaletteRedBackground3)',
    },
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '24px',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    textAlign: 'center',
  },
});

interface UserInfoModalProps {
  children: React.ReactElement;
}

interface ActivationInfo {
  activationCode: string;
  expiryDate: Date;
  activationDate: Date;
  features: string[];
  isExpired: boolean;
  remainingDays: number;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ children }) => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [activationInfo, setActivationInfo] = useState<ActivationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const { setActivated, setConfig } = useAppConfigStore();
  const { setCurrentStep, resetWelcome } = useWelcomeStore();
  const { setUserType, setCurrentPhase, updateUserSettings } = useStartupFlowStore();

  // 加载激活信息
  const loadActivationInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = activationService.loadActivationData();
      
      if (!data || !data.isActivated) {
        setActivationInfo(null);
        return;
      }

      // 优先使用API验证的过期时间（expiresAt字段）
      let expiryDate: Date;
      if (data.apiValidation?.expiresAt) {
        expiryDate = new Date(data.apiValidation.expiresAt);
        console.log('UserInfoModal: 使用API验证过期时间:', data.apiValidation.expiresAt);
      } else {
        expiryDate = new Date(data.expiryDate);
        console.log('UserInfoModal: 使用本地存储过期时间:', data.expiryDate);
      }

      const activationDate = new Date(data.activationDate);
      const now = new Date();
      const remainingDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = remainingDays <= 0;

      setActivationInfo({
        activationCode: data.activationCode,
        expiryDate,
        activationDate,
        features: data.features || [],
        isExpired,
        remainingDays: Math.max(0, remainingDays),
      });

    } catch (err) {
      console.error('加载激活信息失败:', err);
      setError('加载激活信息失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化激活码显示（遮挡中间部分）
  const formatActivationCode = (code: string): string => {
    if (!code || code.length < 8) return code;
    
    // 假设激活码格式为 XXXXXXXX-XXXXXX-XXXXXXXX
    const parts = code.split('-');
    if (parts.length === 3) {
      const first = parts[0];
      const last = parts[2];
      return `${first}-****-${last}`;
    }
    
    // 如果不是标准格式，显示前4位和后4位
    const first4 = code.substring(0, 4);
    const last4 = code.substring(code.length - 4);
    return `${first4}****${last4}`;
  };

  // 格式化日期显示
  const formatDateTime = (date: Date): string => {
    return formatActivationExpiryDate(date);
  };

  // 删除本地激活数据
  const handleDeleteActivation = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      console.log('🗑️ 开始删除本地激活数据...');

      // 清除本地激活数据
      activationService.clearActivationData();

      // 更新应用状态
      setActivated(false);
      setConfig({
        isActivated: false,
        activationStatus: 'NOT_ACTIVATED' as any,
        activationDate: undefined,
        expiryDate: undefined,
        features: [],
      });

      // 重置欢迎页面状态
      resetWelcome();

      // 设置用户类型为需要激活
      setUserType('new');

      // 更新用户设置，标记为首次启动以触发欢迎流程
      updateUserSettings({ isFirstLaunch: true });

      // 重置启动流程状态，强制重新检查
      setCurrentPhase('first-launch-detection');

      console.log('✅ 本地激活数据已清除，正在重新检查激活状态...');

      // 短暂延迟后跳转到激活页面，确保状态更新完成
      setTimeout(() => {
        setCurrentStep(WelcomeStep.ACTIVATION);
        setCurrentPhase('activation-verification');

        // 关闭弹窗和重置状态
        setIsOpen(false);
        setShowDeleteConfirm(false);
        setDeleteSuccess(false);
        setActivationInfo(null);

        console.log('🔄 已跳转到激活页面');
      }, 100);

    } catch (err) {
      console.error('删除激活数据失败:', err);
      setError('删除激活数据失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };

  // 弹窗打开时加载数据
  useEffect(() => {
    if (isOpen) {
      loadActivationInfo();
    }
  }, [isOpen]);

  // 当未找到激活信息时，自动跳转到激活页面
  useEffect(() => {
    if (isOpen && !isLoading && !error && !activationInfo) {
      // 延迟1秒后自动跳转，给用户看到提示信息的时间
      const timer = setTimeout(() => {
        handleAutoRedirectToActivation();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isLoading, error, activationInfo]);

  // 自动跳转到激活页面
  const handleAutoRedirectToActivation = () => {
    // 重置欢迎页面状态
    resetWelcome();

    // 设置用户类型为需要激活
    setUserType('new');

    // 更新用户设置，标记为首次启动以触发欢迎流程
    updateUserSettings({ isFirstLaunch: true });

    // 设置欢迎页面当前步骤为激活页面
    setCurrentStep(WelcomeStep.ACTIVATION);

    // 设置启动流程阶段为激活验证
    setCurrentPhase('activation-verification');

    // 关闭弹窗
    setIsOpen(false);

    console.log('🔄 未找到激活信息，自动跳转到激活页面');
  };

  // 渲染激活信息内容
  const renderActivationInfo = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <Spinner size="medium" />
          <Text>正在加载激活信息...</Text>
        </div>
      );
    }

    if (error) {
      return (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      );
    }

    if (!activationInfo) {
      return (
        <div className={styles.noDataContainer}>
          <Warning24Regular style={{ fontSize: '48px', color: 'var(--colorNeutralForeground3)' }} />
          <Title3>未找到激活信息</Title3>
          <Body1>当前应用未激活或激活数据已损坏</Body1>
          <Body1 style={{ color: 'var(--colorBrandForeground1)', marginTop: '12px' }}>
            正在跳转到激活页面...
          </Body1>
          <Spinner size="medium" style={{ marginTop: '16px' }} />
        </div>
      );
    }

    return (
      <>
        <div className={styles.infoSection}>
          <div className={styles.infoItem}>
            <Key24Regular className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <Text className={styles.infoLabel}>激活码</Text>
              <Text className={styles.infoValue}>{formatActivationCode(activationInfo.activationCode)}</Text>
            </div>
          </div>

          <Divider />

          <div className={styles.infoItem}>
            <Calendar24Regular className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <Text className={styles.infoLabel}>激活时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(activationInfo.activationDate)}</Text>
            </div>
          </div>

          <div className={styles.infoItem}>
            <Calendar24Regular className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <Text className={styles.infoLabel}>过期时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(activationInfo.expiryDate)}</Text>
              {activationInfo.isExpired ? (
                <Caption1 style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                  已过期
                </Caption1>
              ) : (
                <Caption1 style={{ color: 'var(--colorPaletteGreenForeground1)' }}>
                  剩余 {activationInfo.remainingDays} 天
                </Caption1>
              )}
            </div>
          </div>

          {activationInfo.features.length > 0 && (
            <>
              <Divider />
              <div className={styles.infoItem}>
                <Checkmark24Regular className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <Text className={styles.infoLabel}>已激活功能</Text>
                  <Text className={styles.infoValue}>{activationInfo.features.join(', ')}</Text>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.dangerZone}>
          <Text className={styles.dangerTitle}>危险操作</Text>
          <Text className={styles.dangerDescription}>
            删除本地激活数据将清除所有激活信息，您需要重新输入激活码才能继续使用应用。
          </Text>
          
          {!showDeleteConfirm ? (
            <Button
              appearance="outline"
              icon={<Delete24Regular />}
              className={styles.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
            >
              删除本地激活码
            </Button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                appearance="primary"
                icon={isDeleting ? <Spinner size="tiny" /> : <Delete24Regular />}
                className={styles.deleteButton}
                onClick={handleDeleteActivation}
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </Button>
              <Button
                appearance="secondary"
                icon={<Dismiss24Regular />}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                取消
              </Button>
            </div>
          )}
        </div>

        {deleteSuccess && (
          <MessageBar intent="success">
            <MessageBarBody>
              激活数据已成功删除！应用将在2秒后自动跳转到激活页面，您可以重新输入激活码。
            </MessageBarBody>
          </MessageBar>
        )}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(event, data) => setIsOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        {children}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Person24Regular />
              我的信息
            </div>
          </DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {renderActivationInfo()}
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              关闭
            </Button>
            {activationInfo && !deleteSuccess && (
              <Button
                appearance="primary"
                onClick={loadActivationInfo}
                disabled={isLoading || isDeleting}
              >
                刷新信息
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default UserInfoModal;
