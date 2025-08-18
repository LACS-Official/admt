/**
 * 统一的加载和版本检查和公告显示组件
 * 在同一个页面中显示应用加载状态和版本和公告检查结果
 */

import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Spinner,
  Text,
  ProgressBar,
  MessageBar,
  Button,
  Card,
  Body1,
  Caption1,
  Title3,
  Badge,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Warning24Filled,
  ArrowDownload24Regular,
  ArrowClockwise24Regular,
  Megaphone24Regular,
  Info24Regular,
  Shield24Regular,
  Wrench24Regular,
} from '@fluentui/react-icons';
import { useStartupFlowStore, VersionCheckResult } from '../../stores/startupFlowStore';
import { SecurityConfigManager } from '../../config/securityConfig';
import { SecureDataTransmissionService } from '../../services/secureDataTransmissionService';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types/app';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px',
    backgroundColor: '#ffffff',
    color: '#323130',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '32px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e1dfdd',
    color: '#323130',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  progressSection: {
    marginBottom: '24px',
  },
  progressText: {
    marginBottom: '8px',
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: '24px',
  },
  actionSection: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  updateInfo: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f3f2f1',
    borderRadius: '8px',
  },
  releaseNotes: {
    marginTop: '12px',
  },
  noteItem: {
    marginBottom: '4px',
    paddingLeft: '16px',
    position: 'relative',
    '&::before': {
      content: '"•"',
      position: 'absolute',
      left: '0',
      color: '#605e5c',
    },
  },
  currentVersionInfo: {
    textAlign: 'center',
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #0078d4',
  },
  announcementSection: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f3f2f1',
    borderRadius: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  announcementItem: {
    marginBottom: '12px',
    padding: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #edebe9',
  },
  announcementHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  announcementTitle: {
    fontWeight: '600',
    fontSize: '14px',
  },
  announcementContent: {
    fontSize: '13px',
    color: '#605e5c',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  announcementMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

interface UnifiedLoadingVersionCheckerProps {
  onComplete: (result: VersionCheckResult) => void;
  onError: (error: string) => void;
}

const UnifiedLoadingVersionChecker: React.FC<UnifiedLoadingVersionCheckerProps> = ({ 
  onComplete, 
  onError 
}) => {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('正在加载应用...');
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [announcementCountdown, setAnnouncementCountdown] = useState(3);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const {
    setVersionCheckResult,
    setVersionCheckCompleted,
    setError,
    incrementRetryCount,
    resetRetryCount,
  } = useStartupFlowStore();

  useEffect(() => {
    startLoadingAndVersionCheck();
  }, []);

  const startLoadingAndVersionCheck = async () => {
    try {
      // 阶段1：应用加载
      setProgress(20);
      setStatusMessage('初始化应用组件...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(40);
      setStatusMessage('加载配置文件...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(60);
      setStatusMessage('准备版本检查...');
      await new Promise(resolve => setTimeout(resolve, 200));

      // 阶段2：版本检查
      setProgress(80);
      setStatusMessage('正在检查版本更新...');
      setIsLoading(false);
      setIsChecking(true);
      
      await performChecks();

    } catch (error) {
      console.error('加载或版本检查失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      setError(errorMessage);
      onError(errorMessage);
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  // 开始公告倒计时
  const startAnnouncementCountdown = (versionResult: VersionCheckResult) => {
    console.log('📢 开始公告倒计时');
    let countdown = 3;
    setAnnouncementCountdown(countdown);

    const countdownInterval = setInterval(() => {
      countdown--;
      console.log(`📢 倒计时: ${countdown}秒`);
      setAnnouncementCountdown(countdown);
      setStatusMessage(`正在显示最新公告... (${countdown}秒后自动跳转)`);

      if (countdown <= 0) {
        console.log('📢 倒计时结束，跳转到下一步');
        clearInterval(countdownInterval);
        setShowAnnouncements(false);
        onComplete(versionResult);
      }
    }, 1000);
  };

  const performChecks = async () => {
    try {
      setProgress(85);
      setStatusMessage('初始化安全配置...');
      const configManager = SecurityConfigManager.getInstance();
      await configManager.initialize();

      setProgress(90);
      setStatusMessage('获取当前版本信息...');
      const currentVersion = await getCurrentVersion();

      // 并行执行版本检查和公告检查
      setProgress(95);
      setStatusMessage('检查最新版本和公告...');
      
      const [versionResult, announcementResult] = await Promise.all([
        checkLatestVersion(currentVersion),
        loadAnnouncements()
      ]);

      setProgress(100);
      setStatusMessage('检查完成');
      setCheckResult(versionResult);
      setAnnouncements(announcementResult);
      setVersionCheckResult(versionResult);
      setVersionCheckCompleted(true);
      resetRetryCount();

      console.log('📢 公告检查结果:', {
        announcementCount: announcementResult.length,
        announcements: announcementResult,
        versionResult
      });

      // 如果有公告，显示公告并开始倒计时
      if (announcementResult.length > 0) {
        console.log('📢 有公告，开始显示公告和倒计时');
        setShowAnnouncements(true);
        setStatusMessage('正在显示最新公告...');
        startAnnouncementCountdown(versionResult);
      } else {
        console.log('📢 没有公告，直接跳转到下一个页面');
        // 没有公告，直接进入下一个页面
        setTimeout(() => {
          onComplete(versionResult);
        }, 1000);
      }

    } catch (error) {
      console.error('❌ 检查失败:', error);
      const errorMessage = error instanceof Error ? error.message : '检查失败';
      setError(errorMessage);
      setIsChecking(false);

      // 根据要求，检查失败或没联网就立刻提示用户并退出，不能重试
      console.log('🚫 检查失败，应用将退出');

      // 显示错误信息一段时间后退出应用
      setTimeout(async () => {
        try {
          const { exit } = await import('@tauri-apps/plugin-process');
          await exit(1);
        } catch (exitError) {
          console.error('退出应用失败:', exitError);
          // 如果 Tauri API 不可用，尝试关闭窗口
          window.close();
        }
      }, 3000);

      // 立即调用错误回调
      onError(`${errorMessage}\n\n应用将在3秒后退出`);
    }
  };

  // 获取当前版本号
  const getCurrentVersion = async (): Promise<string> => {
    try {
      const { getVersion } = await import('@tauri-apps/api/app');
      return await getVersion();
    } catch (error) {
      console.warn('无法获取Tauri版本，使用默认版本号');
      return '1.0.0';
    }
  };

  // 检查最新版本
  const checkLatestVersion = async (currentVersion: string): Promise<VersionCheckResult> => {
    try {
      // 初始化安全数据传输服务
      const transmissionService = SecureDataTransmissionService.getInstance();
      await transmissionService.initialize();

      // 根据API文档，使用正确的端点获取软件详情
      // 假设HOUT应用的ID为1，实际应用中应该从配置获取
      const softwareId = 1;
      const response = await transmissionService.sendSecureRequest(`/app/software/id/${softwareId}`);

      if (!response.success || !response.data) {
        throw new Error(response.error || '版本检查失败：无效的响应数据');
      }

      const softwareInfo = response.data;
      const latestVersionNumber = softwareInfo.currentVersion || currentVersion;
      const isLatest = compareVersions(currentVersion, latestVersionNumber) >= 0;

      return {
        isLatest,
        currentVersion,
        latestVersion: latestVersionNumber,
        updateInfo: !isLatest ? {
          version: latestVersionNumber,
          releaseDate: new Date().toISOString(),
          description: softwareInfo.description || '发现新版本，建议更新',
          downloadUrl: softwareInfo.latestDownloadUrl || softwareInfo.officialWebsite || '',
          isForced: false, // 根据实际需求设置
          title: `新版本 ${latestVersionNumber} 可用`,
        } : undefined,
      };
    } catch (error) {
      console.error('❌ 版本检查失败:', error);

      // 检查是否是网络连接问题
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接');
      }

      throw new Error(`版本检查失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 获取公告
  const loadAnnouncements = async () => {
    try {
      console.log('📢 开始获取公告...');
      setAnnouncementError(null);

      // 获取软件ID为1的公告
      const response = await announcementService.getAnnouncements({
        limit: 5,
        isPublished: true,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      });

      console.log('📢 公告API响应:', response);

      if (response.success) {
        console.log('📢 公告获取成功:', {
          count: response.data.announcements.length,
          announcements: response.data.announcements
        });
        return response.data.announcements;
      } else {
        console.error('📢 公告API返回错误:', response.error);
        throw new Error(response.error || '获取公告失败');
      }
    } catch (error) {
      console.error('❌ 加载公告失败:', error);
      setAnnouncementError(error instanceof Error ? error.message : '加载公告失败');
      return [];
    }
  };

  // 版本比较函数
  const compareVersions = (version1: string, version2: string): number => {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  };

  const handleRetry = () => {
    setRetryCount(0);
    resetRetryCount();
    setCheckResult(null);
    setAnnouncements([]);
    setIsLoading(true);
    setIsChecking(false);
    setProgress(0);
    startLoadingAndVersionCheck();
  };

  const handleDownload = () => {
    if (checkResult?.updateInfo?.downloadUrl) {
      // 使用 Tauri 的 shell API 打开浏览器
      import('@tauri-apps/plugin-shell').then(({ open }) => {
        open(checkResult.updateInfo!.downloadUrl!).catch((error) => {
          console.error('无法打开浏览器:', error);
          // 降级到 window.open
          window.open(checkResult.updateInfo!.downloadUrl!, '_blank');
        });
      }).catch(() => {
        // 如果 Tauri shell 插件不可用，使用 window.open
        window.open(checkResult.updateInfo!.downloadUrl!, '_blank');
      });
    }
  };

  const getAnnouncementIcon = (type: string, priority: string) => {
    if (priority === 'urgent') {
      return <Warning24Filled style={{ color: '#d83b01' }} />;
    }
    
    switch (type) {
      case 'update':
        return <Info24Regular style={{ color: '#0078d4' }} />;
      case 'security':
        return <Shield24Regular style={{ color: '#d83b01' }} />;
      case 'maintenance':
        return <Wrench24Regular style={{ color: '#ca5010' }} />;
      default:
        return <Megaphone24Regular style={{ color: '#107c10' }} />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'danger';
      case 'high':
        return 'severe';
      case 'normal':
        return 'informative';
      case 'low':
        return 'subtle';
      default:
        return 'informative';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAnnouncements = () => {
    console.log('📢 renderAnnouncements 被调用:', {
      announcementError,
      announcementsLength: announcements.length,
      announcements,
      showAnnouncements
    });

    if (announcementError) {
      console.log('📢 显示公告错误信息:', announcementError);
      return (
        <MessageBar intent="warning">
          公告加载失败: {announcementError}
        </MessageBar>
      );
    }

    if (announcements.length === 0) {
      console.log('📢 没有公告数据，返回null');
      return null;
    }

    console.log('📢 开始渲染公告内容');

    return (
      <div className={styles.announcementSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Megaphone24Regular style={{ color: '#0078d4' }} />
          <Text weight="semibold">系统公告</Text>
        </div>
        {announcements.map((announcement) => {
          const formattedAnnouncement = announcementService.formatAnnouncement(announcement);
          
          return (
            <div key={announcement.id} className={styles.announcementItem}>
              <div className={styles.announcementHeader}>
                {getAnnouncementIcon(announcement.type, announcement.priority)}
                <Text className={styles.announcementTitle}>
                  {formattedAnnouncement.title}
                </Text>
              </div>
              <Text className={styles.announcementContent}>
                {formattedAnnouncement.content.length > 100
                  ? `${formattedAnnouncement.content.substring(0, 100)}...`
                  : formattedAnnouncement.content
                }
              </Text>
              <div className={styles.announcementMeta}>
                <Badge
                  appearance="filled"
                  color={getPriorityBadgeColor(announcement.priority)}
                  size="small"
                >
                  {announcementService.getPriorityText(announcement.priority)}
                </Badge>
                <Text size={200}>
                  {announcementService.getTypeText(announcement.type)}
                </Text>
                <Text size={200}>
                  {formatDate(announcement.publishedAt)}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading || isChecking) {
      return (
        <>
          <div className={styles.header}>
            <Spinner size="extra-large" />
            <Title3>{isLoading ? '正在加载玩机管家' : '检查版本更新'}</Title3>
          </div>

          <div className={styles.progressSection}>
            <Text className={styles.progressText}>{statusMessage}</Text>
            <ProgressBar value={progress / 100} />
          </div>
        </>
      );
    }

    if (checkResult) {
      return (
        <>
          <div className={styles.header}>
            <div className={styles.icon}>
              {checkResult.isLatest ? (
                <CheckmarkCircle24Filled style={{ color: '#107c10' }} />
              ) : (
                <Warning24Filled style={{ color: '#d83b01' }} />
              )}
            </div>
            <Title3>
              {checkResult.isLatest ? '当前已是最新版本' : '发现新版本'}
            </Title3>
          </div>

          <div className={styles.statusSection}>
            <div className={styles.currentVersionInfo}>
              <Body1>
                当前版本: {checkResult.currentVersion}
              </Body1>
              {!checkResult.isLatest && checkResult.latestVersion && (
                <Body1 style={{ marginTop: '8px' }}>
                  最新版本: {checkResult.latestVersion}
                </Body1>
              )}
            </div>
          </div>

          {checkResult.updateInfo && (
            <div className={styles.updateInfo}>
              <Text weight="semibold">{checkResult.updateInfo.title}</Text>
              <Body1 style={{ marginTop: '8px' }}>
                {checkResult.updateInfo.description}
              </Body1>

              {checkResult.updateInfo.downloadUrl && (
                <div className={styles.actionSection} style={{ marginTop: '16px' }}>
                  <Button
                    appearance="primary"
                    icon={<ArrowDownload24Regular />}
                    onClick={handleDownload}
                  >
                    立即下载更新
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 显示公告 - 在版本检查完成后显示 */}
          {showAnnouncements && renderAnnouncements()}

          {/* 倒计时提示 */}
          {showAnnouncements && announcementCountdown > 0 && (
            <div style={{
              marginTop: '16px',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: tokens.colorNeutralBackground2,
              borderRadius: tokens.borderRadiusSmall
            }}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {announcementCountdown}秒后自动跳转到下一步
              </Text>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {renderContent()}
        
        {!isLoading && !isChecking && !checkResult && (
          <div className={styles.actionSection}>
            <Button
              appearance="primary"
              icon={<ArrowClockwise24Regular />}
              onClick={handleRetry}
            >
              重试检查
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UnifiedLoadingVersionChecker;