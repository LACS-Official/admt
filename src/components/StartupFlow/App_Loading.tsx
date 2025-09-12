/**
 * 统一的加载和版本检查组件
 * 在同一个页面中显示应用加载状态和版本检查结果
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

} from '@fluentui/react-icons';
import { useStartupFlowStore } from '../../stores/startupFlowStore';
import { SecurityConfigManager } from '../../config/securityConfig';
import { checkForUpdates, versionService, VersionCheckResult } from '../../services/versionServiceAdapter';
import { unifiedVersionService } from '../../services/unifiedVersionService';
import { SecureDataTransmissionService } from '../../services/secureDataTransmissionService';

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
      // 不需要更新，隐藏版本检查弹窗，自动进入应用
      setShowVersionChecker(false);
      setShowEnterButton(true);
      setStatusMessage('当前已是最新版本，正在进入应用...');
      
      addNotification({
        type: "success",
        title: "版本检查",
        message: "当前已是最新版本，正在进入应用",
        duration: 2000,
      });

      // 延迟0.5秒后自动进入应用
      setTimeout(() => {
        console.log('🚀 版本检查弹窗确认后自动进入应用');
        if (checkResult) {
          onComplete(checkResult);
        }
      }, 500);
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
    console.log('📋 用户选择离线使用，自动进入应用');
    setShowVersionChecker(false);
    setStatusMessage('离线模式，正在进入应用...');
    
    // 延迟0.5秒后自动进入应用
    setTimeout(() => {
      console.log('🚀 离线模式自动进入应用');
      if (checkResult) {
        onComplete(checkResult);
      }
    }, 500);
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

      // 执行版本检查
      setProgress(95);
      setStatusMessage('检查最新版本...');
      
      const versionResult = await checkLatestVersionUnified();

      setProgress(100);
      setStatusMessage('检查完成');
      setCheckResult(versionResult);
      setVersionCheckResult(versionResult);
      setVersionCheckCompleted(true);
      resetRetryCount();

      console.log('📋 版本检查结果:', versionResult);

      // 根据版本检查结果决定是否显示进入应用按钮
      if (!versionResult.needsUpdate) {
        console.log('✅ 当前是最新版本，自动进入应用');
        setShowEnterButton(true);
        setStatusMessage('当前已是最新版本，正在进入应用...');
        
        // 添加通知
        addNotification({
          type: "success",
          title: "版本检查",
          message: "当前已是最新版本，正在进入应用",
          duration: 2000,
        });

        // 在开发环境下显示版本检测详情
        if (import.meta.env.DEV) {
          console.log('🔧 版本检测服务状态:', unifiedVersionService.getStatus());
        }

        // 延迟1秒后自动进入应用，给用户看到成功状态的时间
        setTimeout(() => {
          console.log('🚀 自动进入应用');
          onComplete(versionResult);
        }, 1000);
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
      console.log('⚠️ 检查失败，采用降级处理，自动进入应用');
      setShowEnterButton(true);
      setStatusMessage('检查完成（网络连接异常），正在进入应用...');
      
      // 设置默认的版本检查结果
      const defaultResult: VersionCheckResult = {
        hasUpdate: false,
        needsUpdate: false,
        currentVersion: '1.0.0',
        localVersion: '1.0.0',
        latestVersion: '1.0.0',
        isForceUpdate: false,
        message: '网络连接异常，无法检查更新'
      };
      
      setCheckResult(defaultResult);
      setVersionCheckResult(defaultResult);
      setVersionCheckCompleted(true);
      resetRetryCount();

      // 延迟1.5秒后自动进入应用，给用户看到错误信息的时间
      setTimeout(() => {
        console.log('🚀 网络异常情况下自动进入应用');
        onComplete(defaultResult);
      }, 1500);
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

  // 统一的版本检查方法 - 使用统一版本检测服务
  const checkLatestVersionUnified = async (): Promise<VersionCheckResult> => {
    try {
      console.log('🔍 开始统一版本检查...');
      
      // 首先检查版本同步状态
      const syncStatus = await unifiedVersionService.checkVersionSync();
      if (!syncStatus.isSync) {
        console.warn('⚠️ 版本同步问题:', syncStatus.issues);
        console.log('📋 版本源状态:', syncStatus.sources);
        
        // 添加版本同步问题通知
        addNotification({
          type: "warning",
          title: "版本同步警告",
          message: `检测到版本不一致问题: ${syncStatus.issues.slice(0, 2).join(', ')}`,
          duration: 8000,
        });
      }
      
      // 执行版本检查
      const result = await unifiedVersionService.checkForUpdates();
      
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
        localVersion: currentVersion,
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
        localVersion: currentVersion,
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
        localVersion: currentVersion,
        latestVersion: latestVersionNumber,
        isForceUpdate: !isLatest,
        message: !isLatest ? `发现新版本 ${latestVersionNumber}，需要强制更新后才能继续使用软件` : '目前已是最新版本',
        updateInfo: !isLatest ? {
          id: 1,
          downloadUrl: softwareInfo.latestDownloadUrl || 'https://admt.lacs.cc/download',
          version: latestVersionNumber,
          // releaseDate 字段已移除，使用其他字段,
          releaseNotes: softwareInfo.description || '发现新版本，需要更新后才能继续使用',
          downloadLinks: {
            official: softwareInfo.latestDownloadUrl || softwareInfo.officialWebsite || ''
          },
          // isStable 字段已移除,
          // versionType 字段已移除
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
    setShowEnterButton(false);
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





  const renderContent = () => {
    console.log('🎨 renderContent 调用:', {
      isLoading,
      isChecking,
      checkResult: !!checkResult,
      showEnterButton,
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


              {/* 下载按钮区域 */}
              <div className={styles.actionSection} style={{ marginTop: '16px' }}>
                {checkResult.updateInfo.downloadLinks?.official ? (
                  <Button
                    appearance="primary"
                    size="large"
                    icon={<ArrowDownload24Regular />}
                    onClick={handleDownload}
                  >
                    打开下载页面
                  </Button>
                ) : (
                  <MessageBar intent="info">
                    暂无可用的下载链接，请访问官方网站获取最新版本
                  </MessageBar>
                )}
              </div>
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