/**
 * 版本检查组件
 * 调用后端API检查当前版本是否为最新版本
 */

import React, { useEffect, useState }  from 'react';
import {
  makeStyles,
  Spinner,
  Text,
  ProgressBar,
  Button,
  Card,
  Body1,
  Caption1,
  Title3,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Warning24Filled,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import { useStartupFlowStore, VersionCheckResult } from '../../stores/startupFlowStore';
import { SecurityConfigManager } from '../../config/securityConfig';


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
});

interface VersionCheckerProps {
  onComplete: (result: VersionCheckResult) => void;
  onError: (error: string) => void;
}

const VersionChecker: React.FC<VersionCheckerProps> = ({ onComplete, onError }) => {
  const styles = useStyles();
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('准备检查版本...');
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
    startVersionCheck();
  }, []);

  const startVersionCheck = async () => {
    setIsChecking(true);
    setProgress(0);
    setStatusMessage('正在连接服务器...');
    setError(null);

    try {
      // 步骤1：初始化安全配置
      setProgress(20);
      setStatusMessage('初始化安全配置...');
      const configManager = SecurityConfigManager.getInstance();
      await configManager.initialize();

      // 步骤2：获取当前版本信息
      setProgress(40);
      setStatusMessage('获取当前版本信息...');
      const currentVersion = await getCurrentVersion();

      // 步骤3：调用版本检查API
      setProgress(60);
      setStatusMessage('检查最新版本...');
      const result = await checkLatestVersion(currentVersion);

      // 步骤4：处理检查结果
      setProgress(80);
      setStatusMessage('处理检查结果...');
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟处理时间

      setProgress(100);
      setStatusMessage('版本检查完成');
      setCheckResult(result);
      setVersionCheckResult(result);
      setVersionCheckCompleted(true);
      resetRetryCount();

      // 延迟调用完成回调，让用户看到完成状态
      setTimeout(() => {
        onComplete(result);
      }, 1000);

    } catch (error) {
      console.error('版本检查失败:', error);
      const errorMessage = error instanceof Error ? error.message : '版本检查失败';
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        incrementRetryCount();
        setStatusMessage(`检查失败，正在重试 (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => startVersionCheck(), 2000);
      } else {
        setError(errorMessage);
        onError(errorMessage);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const getCurrentVersion = async (): Promise<string> => {
    // 从package.json或应用配置中获取当前版本
    // 这里使用模拟版本，实际应用中应该从构建配置中获取
    return '1.0.0';
  };

  const checkLatestVersion = async (currentVersion: string): Promise<VersionCheckResult> => {
    const configManager = SecurityConfigManager.getInstance();
    const config = configManager.getConfig();
    
    // 在开发环境使用代理，生产环境使用直接API地址
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isDevelopment ? '' : config.api_base_url;

    // 使用软件名称获取版本信息，如果失败则尝试ID方式
    const softwareName = encodeURIComponent('玩机管家');
    const apiUrl = `${baseUrl}/app/software/${softwareName}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.api_key,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 如果API返回错误，降级处理：认为当前版本是最新的
      console.warn(`版本检查API返回错误 ${response.status}: ${response.statusText}`);
      return {
        isLatest: true,
        currentVersion,
        latestVersion: currentVersion,
      };
    }

    const result = await response.json();

    if (!result.success) {
      // API返回业务错误，降级处理
      console.warn(`版本检查API业务错误: ${result.error || '未知错误'}`);
      return {
        isLatest: true,
        currentVersion,
        latestVersion: currentVersion,
      };
    }

    // 解析软件信息结果
    const softwareInfo = result.data;

    if (!softwareInfo) {
      // 没有找到软件信息，认为是最新版本
      return {
        isLatest: true,
        currentVersion,
        latestVersion: currentVersion,
      };
    }

    const latestVersionNumber = softwareInfo.currentVersion || softwareInfo.latestVersion;

    // 简单的版本比较（可以后续优化为语义化版本比较）
    const isLatest = currentVersion === latestVersionNumber;

    return {
      isLatest,
      currentVersion,
      latestVersion: latestVersionNumber,
      updateInfo: !isLatest ? {
        version: latestVersionNumber,
        releaseNotes: softwareInfo.description || '新版本更新',
        releaseNotesEn: softwareInfo.description_en || '',
        releaseDate: new Date().toISOString(),
        downloadLinks: { 
          official: softwareInfo.officialWebsite || '',
        },
        isForced: true, // 根据需求设置是否强制更新
        // 添加新的必需字段
        id: softwareInfo.id || 1,
        versionType: "release",
      } : undefined,
    };
  };

  const handleRetry = () => {
    setRetryCount(0);
    resetRetryCount();
    startVersionCheck();
  };

  const renderContent = () => {
    if (isChecking) {
      return (
        <>
          <div className={styles.header}>
            <Spinner size="extra-large" />
            <Title3>检查版本更新</Title3>
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
              {checkResult.isLatest ? '已是最新版本' : '发现新版本'}
            </Title3>
          </div>

          <div className={styles.statusSection}>
            <Body1>
              当前版本: {checkResult.currentVersion}
            </Body1>
            {!checkResult.isLatest && checkResult.latestVersion && (
              <Body1>
                最新版本: {checkResult.latestVersion}
              </Body1>
            )}
          </div>

          {checkResult.updateInfo && (
            <div className={styles.updateInfo}>
              <Text weight="semibold">{checkResult.updateInfo.title}</Text>
              <Body1 style={{ marginTop: '8px' }}>
                {checkResult.updateInfo.description}
              </Body1>
              
              {checkResult.updateInfo.releaseNotes && (
                <div className={styles.releaseNotes}>
                  <Caption1>更新内容:</Caption1>
                  <div className={styles.noteItem}>
                    <Caption1>{checkResult.updateInfo.releaseNotes}</Caption1>
                  </div>
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
        
        {!isChecking && !checkResult && (
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

export default VersionChecker;
