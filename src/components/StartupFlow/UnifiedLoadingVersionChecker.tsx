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
  Caption1,
  Title3,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Warning24Filled,
  ArrowDownload24Regular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import { useStartupFlowStore, VersionCheckResult } from '../../stores/startupFlowStore';
import { SecurityConfigManager } from '../../config/securityConfig';
import { SecureDataTransmissionService } from '../../services/secureDataTransmissionService';

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
      
      await performVersionCheck();

    } catch (error) {
      console.error('加载或版本检查失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      setError(errorMessage);
      onError(errorMessage);
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  const performVersionCheck = async () => {
    try {
      setProgress(85);
      setStatusMessage('初始化安全配置...');
      const configManager = SecurityConfigManager.getInstance();
      await configManager.initialize();

      setProgress(90);
      setStatusMessage('获取当前版本信息...');
      const currentVersion = await getCurrentVersion();

      setProgress(95);
      setStatusMessage('检查最新版本...');
      const result = await checkLatestVersion(currentVersion);

      setProgress(100);
      setStatusMessage('版本检查完成');
      setCheckResult(result);
      setVersionCheckResult(result);
      setVersionCheckCompleted(true);
      resetRetryCount();

      // 延迟调用完成回调，让用户看到完成状态
      // 如果是最新版本，较快完成；如果有更新，显示更长时间
      const delay = result.isLatest ? 2000 : 4000;
      setTimeout(() => {
        onComplete(result);
      }, delay);

    } catch (error) {
      console.error('❌ 版本检查失败:', error);
      const errorMessage = error instanceof Error ? error.message : '版本检查失败';
      setError(errorMessage);
      setIsChecking(false);

      // 根据要求，版本检查失败或没联网就立刻提示用户并退出，不能重试
      console.log('🚫 版本检查失败，应用将退出');

      // 显示错误信息一段时间后退出应用
      setTimeout(async () => {
        try {
          const { exit } = await import('@tauri-apps/api/app');
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
          title: `新版本 ${latestVersionNumber} 可用`,
          description: softwareInfo.description || '发现新版本，建议更新',
          downloadUrl: softwareInfo.latestDownloadUrl || softwareInfo.officialWebsite || '',
          isForced: false, // 根据实际需求设置
          releaseNotes: [softwareInfo.description || '新版本更新'],
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
    setRetryCount(0);
    resetRetryCount();
    setCheckResult(null);
    setIsLoading(true);
    setIsChecking(false);
    setProgress(0);
    startLoadingAndVersionCheck();
  };

  const handleDownload = () => {
    if (checkResult?.updateInfo?.downloadUrl) {
      // 使用 Tauri 的 shell API 打开浏览器
      import('@tauri-apps/plugin-shell').then(({ open }) => {
        open(checkResult.updateInfo!.downloadUrl).catch((error) => {
          console.error('无法打开浏览器:', error);
          // 降级到 window.open
          window.open(checkResult.updateInfo!.downloadUrl, '_blank');
        });
      }).catch(() => {
        // 如果 Tauri shell 插件不可用，使用 window.open
        window.open(checkResult.updateInfo!.downloadUrl, '_blank');
      });
    }
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

              {checkResult.updateInfo.releaseNotes.length > 0 && (
                <div className={styles.releaseNotes}>
                  <Caption1 weight="semibold">更新内容:</Caption1>
                  {checkResult.updateInfo.releaseNotes.map((note, index) => (
                    <div key={index} className={styles.noteItem}>
                      <Caption1>{note}</Caption1>
                    </div>
                  ))}
                </div>
              )}

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
