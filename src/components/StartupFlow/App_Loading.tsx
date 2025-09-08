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
  Title3,
  Badge,
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
import { versionService } from '../../services/versionService';
import { SecureDataTransmissionService } from '../../services/secureDataTransmissionService';
import { announcementService } from '../../services/announcementService';
import { Announcement } from '../../types/app';
import StartupVersionChecker from '../Common/StartupVersionChecker';
import { useAppStore } from '../../stores/appStore';

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
    maxWidth: '800px',
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
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #edebe9',
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
  const { addNotification } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('正在加载应用...');
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [showVersionChecker, setShowVersionChecker] = useState(false);
  const [] = useState<ReturnType<typeof setTimeout> | null>(null);

  const {
    setVersionCheckResult,
    setVersionCheckCompleted,
    setError,
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

  // 处理进入应用按钮点击
  const handleEnterApp = () => {
    if (checkResult) {
      console.log('用户点击进入应用');
      onComplete(checkResult);
    }
  };

  // 处理版本检查完成
  const handleVersionCheckComplete = (needsUpdate: boolean, result?: any) => {
    console.log('📋 版本检查完成:', { needsUpdate, result });
    if (!needsUpdate) {
      // 不需要更新，隐藏版本检查弹窗，允许进入应用
      setShowVersionChecker(false);
      setShowEnterButton(true);
      setStatusMessage('当前已是最新版本');
      
      addNotification({
        type: "success",
        title: "版本检查",
        message: "当前已是最新版本",
        duration: 3000,
      });
    } else {
      // 需要更新，保持弹窗显示，不允许进入应用
      console.log('⚠️ 需要更新，保持弹窗显示，禁止进入应用');
      setShowEnterButton(false);
      setStatusMessage('发现新版本，必须更新后才能继续使用');
      // 注意：不要再次设置 setShowVersionChecker(true)，因为弹窗已经在显示了
    }
  };

  // 处理离线使用（版本检查失败时的降级选项）
  const handleAllowOfflineUse = () => {
    console.log('📋 用户选择离线使用');
    setShowVersionChecker(false);
    // 继续正常流程
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
        checkLatestVersionUnified(),
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

      // 如果有公告，显示公告
      if (announcementResult.length > 0) {
        console.log('📢 有公告，显示公告内容');
        setShowAnnouncements(true);
        setStatusMessage('检查完成，请查看最新公告');
        
        // 添加通知
        addNotification({
          type: "info",
          title: "系统公告",
          message: `您有 ${announcementResult.length} 条新公告，请查看`,
          duration: 5000,
        });
      } else {
        console.log('📢 没有公告');
        setStatusMessage('检查完成');
      }

      // 根据版本检查结果决定是否显示进入应用按钮
      if (!versionResult.needsUpdate) {
        console.log('✅ 当前是最新版本，显示进入应用按钮');
        setShowEnterButton(true);
        setStatusMessage(announcementResult.length > 0 ? '检查完成，请查看最新公告' : '当前已是最新版本');
        
        // 添加通知
        if (announcementResult.length === 0) {
          addNotification({
            type: "success",
            title: "版本检查",
            message: "当前已是最新版本",
            duration: 3000,
          });
        }
      } else {
        console.log('⚠️ 发现新版本，需要强制更新，不显示进入应用按钮');
        console.log('📋 更新信息:', versionResult.updateInfo);
        setShowEnterButton(false);
        setStatusMessage('发现新版本，请立即更新');
        
        // 显示版本检查弹窗
        setShowVersionChecker(true);
        
        // 添加通知
        addNotification({
          type: "warning",
          title: "版本更新",
          message: "发现新版本，请立即更新",
          duration: 5000,
        });
      }

    } catch (error) {
      console.error('❌ 检查失败:', error);
      const errorMessage = error instanceof Error ? error.message : '检查失败';
      
      // 检查是否是网络频率限制错误
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('Too Many Requests');
      
      if (isRateLimitError) {
        console.log('⚠️ 遇到API频率限制，显示版本检查弹窗让用户选择');
        
        // 对于频率限制错误，显示版本检查弹窗让用户选择
        setShowVersionChecker(true);
        setError(null); // 清除错误状态
        setIsChecking(false);
        
        // 添加警告通知
        addNotification({
          type: "warning",
          title: "网络请求受限",
          message: "检测到网络请求频率限制，请稍后重试",
          duration: 5000,
        });
        
        return; // 不退出应用，让用户选择
      }
      
      // 对于其他网络错误，采用降级处理，允许用户继续使用
      setError(errorMessage);
      setIsChecking(false);

      // 添加错误通知
      addNotification({
        type: "error",
        title: "检查失败",
        message: errorMessage,
        duration: 5000,
      });

      // 采用降级处理，允许用户继续使用应用
      console.log('⚠️ 检查失败，采用降级处理，允许用户继续使用');
      setShowEnterButton(true);
      setStatusMessage('检查完成（网络连接异常）');
      
      // 设置默认的版本检查结果
      const defaultResult: VersionCheckResult = {
        hasUpdate: false,
        needsUpdate: false,
        currentVersion: '1.0.0',
        latestVersion: '1.0.0',
        isForceUpdate: false,
        message: '网络连接异常，无法检查更新'
      };
      
      setCheckResult(defaultResult);
      setVersionCheckResult(defaultResult);
      setVersionCheckCompleted(true);
      resetRetryCount();
    }
  };

  // 获取当前版本号 - 统一使用versionService的逻辑
  const getCurrentVersion = async (): Promise<string> => {
    try {
      // 使用versionService统一的版本获取逻辑
      const version = await versionService.getCurrentAppVersion();
      console.log('📋 统一获取当前版本号:', version);
      return version;
    } catch (error) {
      console.warn('无法获取版本号，使用默认版本号:', error);
      return '1.0.0';
    }
  };

  // 统一的版本检查方法 - 使用versionService
  const checkLatestVersionUnified = async (): Promise<VersionCheckResult> => {
    try {
      console.log('🔍 开始统一版本检查...');
      const result = await versionService.checkForUpdates();
      
      console.log('📋 统一版本检查结果:', result);
      
      // 如果需要更新，显示版本检查弹窗
      if (result.hasUpdate) {
        console.log('⚠️ 发现新版本，显示版本检查弹窗');
        setShowVersionChecker(true);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 统一版本检查失败:', error);
      
      // 返回默认结果
      const currentVersion = await getCurrentVersion();
      return {
        hasUpdate: false,
        needsUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        isForceUpdate: false,
        message: '版本检查失败，请检查网络连接'
      };
    }
  };

  // 检查最新版本 - 保留原有逻辑作为备用
  const checkLatestVersion = async (currentVersion: string): Promise<VersionCheckResult> => {
    try {
      // 初始化安全数据传输服务
      const transmissionService = SecureDataTransmissionService.getInstance();
      await transmissionService.initialize();

      // 从配置获取软件ID
      const configManager = SecurityConfigManager.getInstance();
      const softwareId = configManager.getSoftwareId();
      console.log('🔍 检查软件ID:', softwareId, '的版本信息');

      // 获取软件基本信息
      const softwareResponse = await transmissionService.sendSecureRequest(`/app/software/id/${softwareId}`);
      if (!softwareResponse.success || !softwareResponse.data) {
        throw new Error(softwareResponse.error || '获取软件信息失败');
      }

      const softwareInfo = softwareResponse.data;
      const latestVersionNumber = softwareInfo.currentVersion || currentVersion;
      const isLatest = compareVersions(currentVersion, latestVersionNumber) >= 0;

      console.log('📋 版本比较结果:', {
        currentVersion,
        latestVersion: latestVersionNumber,
        isLatest,
        compareResult: compareVersions(currentVersion, latestVersionNumber),
        softwareInfo
      });

      // 如果需要更新，显示版本检查弹窗
      if (!isLatest) {
        console.log('⚠️ 发现新版本，显示版本检查弹窗');
        setShowVersionChecker(true);
      }

      return {
        hasUpdate: !isLatest,
        needsUpdate: !isLatest,
        currentVersion,
        latestVersion: latestVersionNumber,
        isForceUpdate: !isLatest,
        message: !isLatest ? `发现新版本 ${latestVersionNumber}，需要强制更新后才能继续使用软件` : '目前已是最新版本',
        updateInfo: !isLatest ? {
          id: 0,
          version: latestVersionNumber,
          releaseDate: new Date().toISOString(),
          releaseNotes: softwareInfo.description || '发现新版本，需要更新后才能继续使用',
          downloadLinks: {
            official: softwareInfo.latestDownloadUrl || softwareInfo.officialWebsite || ''
          },
          isStable: true,
          versionType: "release" as const
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
    resetRetryCount();
    setCheckResult(null);
    setAnnouncements([]);
    setShowEnterButton(false);
    setShowAnnouncements(false);
    setIsLoading(true);
    setIsChecking(false);
    setProgress(0);
    startLoadingAndVersionCheck();
  };

  const handleDownload = () => {
    // 固定跳转到指定的下载页面
    const downloadUrl = 'https://admt.lacs.cc/download';
    
    console.log('🔗 打开下载链接:', downloadUrl);

    // 使用 Tauri 的 shell API 打开浏览器
    import('@tauri-apps/plugin-shell').then(({ open }) => {
      open(downloadUrl).catch((error) => {
        console.error('无法使用Tauri打开浏览器:', error);
        // 降级到 window.open
        window.open(downloadUrl, '_blank');
      });
    }).catch(() => {
      // 如果 Tauri shell 插件不可用，使用 window.open
      console.log('Tauri shell插件不可用，使用window.open');
      window.open(downloadUrl, '_blank');
    });
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
    console.log('🎨 renderContent 调用:', {
      isLoading,
      isChecking,
      checkResult: !!checkResult,
      showEnterButton,
      showAnnouncements,
      hasUpdateInfo: !!checkResult?.updateInfo
    });

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

          {/* 公告内容 */}
          <div className={styles.progressSection}>
            {renderAnnouncements()}
          </div>

          {/* 在检查完成后显示进入应用按钮 */}
          {showEnterButton && (
            <div className={styles.actionSection} style={{ marginTop: '24px' }}>
              <Button
                appearance="primary"
                size="large"
                onClick={handleEnterApp}
              >
                进入应用
              </Button>
            </div>
          )}
        </>
      );
    }

    if (checkResult) {
      return (
        <>
          <div className={styles.header}>
            <div className={styles.icon}>
              {!checkResult.needsUpdate ? (
                <CheckmarkCircle24Filled style={{ color: '#107c10' }} />
              ) : (
                <Warning24Filled style={{ color: '#d83b01' }} />
              )}
            </div>
            <Title3>
              {!checkResult.needsUpdate ? '当前已是最新版本' : '需要更新到最新版本'}
            </Title3>
          </div>

          <div className={styles.statusSection}>
            <div className={styles.currentVersionInfo}>
              <Body1>
                当前版本: {checkResult.currentVersion}
              </Body1>
              {checkResult.needsUpdate && checkResult.latestVersion && (
                <Body1 style={{ marginTop: '8px' }}>
                  最新版本: {checkResult.latestVersion}
                </Body1>
              )}
            </div>
          </div>

          {checkResult.updateInfo && (
            <div className={styles.updateInfo}>
              <Text weight="semibold">版本 {checkResult.updateInfo.version}</Text>
              <Body1 style={{ marginTop: '8px' }}>
                {checkResult.updateInfo.releaseNotes}
              </Body1>

              {/* 显示文件大小信息 */}
              {checkResult.updateInfo.fileSize && (
                <Body1 style={{ marginTop: '4px', color: '#605e5c' }}>
                  文件大小: {checkResult.updateInfo.fileSize}
                </Body1>
              )}

              {checkResult.isForceUpdate && (
                <MessageBar intent="warning" style={{ marginTop: '12px' }}>
                  此更新为强制更新，必须更新到最新版本才能继续使用应用
                </MessageBar>
              )}

              {/* 下载按钮区域 */}
              <div className={styles.actionSection} style={{ marginTop: '16px' }}>
                {checkResult.updateInfo.downloadLinks?.official ? (
                  <Button
                    appearance="primary"
                    size="large"
                    icon={<ArrowDownload24Regular />}
                    onClick={handleDownload}
                  >
                    立即下载更新
                  </Button>
                ) : (
                  <MessageBar intent="info">
                    暂无可用的下载链接，请访问官方网站获取最新版本
                  </MessageBar>
                )}
              </div>
            </div>
          )}

          {/* 显示公告 - 在版本检查完成后显示 */}
          {showAnnouncements && renderAnnouncements()}

          {/* 进入应用按钮 */}
          {showEnterButton && (
            <div className={styles.actionSection} style={{ marginTop: '24px' }}>
              <Button
                appearance="primary"
                size="large"
                onClick={handleEnterApp}
              >
                进入应用
              </Button>
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

      {/* 版本检查弹窗 */}
      {showVersionChecker && checkResult && (
        <StartupVersionChecker
          checkResult={checkResult}
          onCheckComplete={handleVersionCheckComplete}
          onAllowOfflineUse={handleAllowOfflineUse}
        />
      )}
    </div>
  );
};

export default UnifiedLoadingVersionChecker;