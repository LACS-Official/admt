/**
 * 统一的加载和版本检查组件
 * 在同一个页面中显示应用加载状态和版本检查结果
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedStartupLoader from './EnhancedStartupLoader';
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
import { apiErrorHandler } from '../../services/errorHandlerService';

import StartupVersionChecker from '../Common/StartupVersionChecker';
import { useAppStore } from '../../stores/appStore';

const useStyles = makeStyles({
  rootContainer: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '32px',
    backgroundColor: '#ffffff',
    color: '#323130',
    zIndex: 1,
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
  const { setStatusBarMessage } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('正在加载应用...');
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);

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
    // 设置错误处理服务的倒计时回调
    apiErrorHandler.setCountdownCallback((seconds: number) => {
      setExitCountdown(seconds);
      if (seconds > 0) {
        setIsExiting(true);
        setStatusMessage(`版本检测失败，应用将在 ${seconds} 秒后退出`);
      }
    });
    
    // 立即开始加载动画
    setIsLoading(true);
    setProgress(20);
    setStatusMessage('正在初始化应用...');

    // 异步执行版本检查和ADB初始化
    const initTasks = async () => {
      try {
        // 并行执行ADB初始化和版本检查
        await Promise.all([
          startLoadingAndVersionCheck(),
          // 模拟ADB初始化耗时
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
      } catch (error) {
        console.error('初始化任务失败:', error);
      }
    };

    initTasks();
    
    // 组件卸载时取消计划的退出
    return () => {
      apiErrorHandler.cancelScheduledExit();
    };
  }, []);

  const startLoadingAndVersionCheck = async () => {
    try {
      // 阶段1：应用加载 (减少等待时间)
      setProgress(30);
      setStatusMessage('初始化应用组件...');
      await new Promise(resolve => setTimeout(resolve, 200));

      setProgress(50);
      setStatusMessage('加载配置文件...');
      await new Promise(resolve => setTimeout(resolve, 100));

      setProgress(70);
      setStatusMessage('准备版本检查...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // 阶段2：版本检查 (后台执行)
      setProgress(90);
      setStatusMessage('正在检查版本更新...');
      setIsLoading(false);
      setIsChecking(true);
      
      // 不等待版本检查完成，直接进入应用
      performChecks().catch(error => {
        console.error('版本检查失败:', error);
      });

      // 模拟快速进入应用
      setTimeout(() => {
        if (!checkResult) {
          const defaultResult: VersionCheckResult = {
            hasUpdate: false,
            needsUpdate: false,
            currentVersion: '1.0.0',
            localVersion: '1.0.0',
            latestVersion: '1.0.0',
            isForceUpdate: false,
            message: '版本检查中...'
          };
          onComplete(defaultResult);
        }
      }, 1000);

    } catch (error) {
      console.error('加载失败:', error);
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
      
      setStatusBarMessage({
        type: "success",
        message: "当前已是最新版本，正在进入应用",
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
      
      await performVersionCheckWithRetry();

    } catch (error) {
      console.error('❗ 检查失败:', error);
      await handleVersionCheckError(error);
    }
  };

  // 带重试机制的版本检查
  const performVersionCheckWithRetry = async (): Promise<void> => {
    try {
      const versionResult = await checkLatestVersionUnified();
      
      // 重置重试计数器
      apiErrorHandler.resetRetryCounters();
      setRetryCount(0);
      setIsAutoRetrying(false);
      
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
        setStatusBarMessage({
          type: "success",
          message: "当前已是最新版本，正在进入应用",
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
        setStatusBarMessage({
          type: "warning",
          message: "发现新版本，请立即更新",
        });
      }

    } catch (error) {
      throw error; // 重新抛出错误，由上层处理
    }
  };

  // 处理版本检查错误
  const handleVersionCheckError = async (error: Error): Promise<void> => {
    try {
      const handlingResult = await apiErrorHandler.handleVersionCheckError(error);
      
      setRetryCount(apiErrorHandler.getRetryStatus().versionCheckCount);
      setStatusMessage(handlingResult.userMessage);
      
      if (handlingResult.shouldExit) {
        setIsExiting(true);
        setIsChecking(false);
        setIsLoading(false);
        return;
      }
      
      if (handlingResult.shouldRetry) {
        setIsAutoRetrying(true);
        setStatusMessage(`${handlingResult.userMessage}，${handlingResult.retryDelay / 1000}秒后重试...`);
        
        setTimeout(async () => {
          try {
            await performVersionCheckWithRetry();
          } catch (retryError) {
            await handleVersionCheckError(retryError);
          }
        }, handlingResult.retryDelay);
        
        return;
      }
      
      // 不可重试的错误，已由 apiErrorHandler 安排退出
      setIsChecking(false);
      setIsLoading(false);
      
    } catch (handlerError) {
      console.error('错误处理器失败:', handlerError);
      
      // 降级处理策略
      setError('版本检查失败，请重试或检查网络连接');
      setIsChecking(false);
      setIsLoading(false);
      
      // 添加错误通知
      setStatusBarMessage({
        type: "error",
        message: "版本检查失败，请重试或检查网络连接",
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
      hasUpdateInfo: !!checkResult?.updateInfo,
      isExiting,
      exitCountdown,
      retryCount,
      isAutoRetrying
    });

    // 退出倒计时状态
    if (isExiting && exitCountdown > 0) {
      return (
        <>
          <div className={styles.header}>
            <Warning24Filled style={{ color: '#d83b01', fontSize: '48px' }} />
            <Title3>版本检查失败</Title3>
          </div>

          <div className={styles.progressSection}>
            <Text className={styles.progressText} style={{ color: '#d83b01', fontWeight: 'bold' }}>
              应用将在 {exitCountdown} 秒后退出
            </Text>
            <ProgressBar 
              value={(5 - exitCountdown) / 5} 
              color="error"
            />
          </div>
          
          <div className={styles.statusSection}>
            <MessageBar intent="error">
              版本检查多次失败，请检查网络连接后重试
            </MessageBar>
          </div>
        </>
      );
    }

    // 使用EnhancedStartupLoader处理加载状态
    if (isLoading || isChecking) {
      return null;
    }

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
            
            {/* 显示重试信息 */}
            {retryCount > 0 && (
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <Badge 
                  appearance="ghost" 
                  color={isAutoRetrying ? "warning" : "important"}
                  size="small"
                >
                  {isAutoRetrying ? `正在重试... (${retryCount}/3)` : `已重试 ${retryCount} 次`}
                </Badge>
              </div>
            )}
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
    <div className={styles.rootContainer}>
      <EnhancedStartupLoader
        phase={isLoading ? 'version-check' : isChecking ? 'activation-verification' : 'main-app'}
        progress={progress}
        statusMessage={statusMessage}
        isVisible={isLoading || isChecking}
        onPreloadComplete={() => console.log('预加载完成')}
      />
      
      <AnimatePresence>
        {(!isLoading && !isChecking) && (
          <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedLoadingVersionChecker;