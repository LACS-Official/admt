/**
 * 版本检查功能测试组件
 * 用于测试版本检查服务和UI组件
 */

import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Spinner,
  MessageBar,
  MessageBarBody,
  Divider,
  tokens
} from '@fluentui/react-components';
import {
  Play24Regular,
  ArrowClockwise24Regular,
  Info24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ErrorCircle24Regular
} from '@fluentui/react-icons';
import { versionService, VersionComparator } from '../../services/versionService';
import { VersionCheckResult, SoftwareInfo } from '../../types/app';
import VersionChecker from '../Common/VersionChecker';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalXL,
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  card: {
    padding: tokens.spacingVerticalL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  versionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testResult: {
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

const VersionCheckTest: React.FC = () => {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [versionCheckResult, setVersionCheckResult] = useState<VersionCheckResult | null>(null);
  const [softwareInfo, setSoftwareInfo] = useState<SoftwareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ name: string; result: string; success: boolean }>>([]);

  /**
   * 执行版本检查测试
   */
  const runVersionCheck = async () => {
    setIsLoading(true);
    setError(null);
    setVersionCheckResult(null);
    
    try {
      console.log('开始版本检查测试...');
      const result = await versionService.checkForUpdates();
      setVersionCheckResult(result);
      console.log('版本检查结果:', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '版本检查失败';
      setError(errorMessage);
      console.error('版本检查失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取软件信息测试
   */
  const fetchSoftwareInfo = async () => {
    setIsLoading(true);
    setError(null);
    setSoftwareInfo(null);
    
    try {
      console.log('开始获取软件信息...');
      const info = await versionService.getSoftwareInfo();
      setSoftwareInfo(info);
      console.log('软件信息:', info);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取软件信息失败';
      setError(errorMessage);
      console.error('获取软件信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 版本比较测试
   */
  const runVersionComparisonTests = () => {
    const tests = [
      { v1: '1.0.0', v2: '1.0.1', expected: -1, description: '1.0.0 < 1.0.1' },
      { v1: '1.0.1', v2: '1.0.0', expected: 1, description: '1.0.1 > 1.0.0' },
      { v1: '1.0.0', v2: '1.0.0', expected: 0, description: '1.0.0 = 1.0.0' },
      { v1: '1.0.0', v2: '2.0.0', expected: -1, description: '1.0.0 < 2.0.0' },
      { v1: '2.0.0', v2: '1.9.9', expected: 1, description: '2.0.0 > 1.9.9' },
      { v1: '1.0.0-beta', v2: '1.0.0', expected: 0, description: '1.0.0-beta = 1.0.0 (忽略预发布标识)' },
      { v1: '1.0.0+build.1', v2: '1.0.0', expected: 0, description: '1.0.0+build.1 = 1.0.0 (忽略构建元数据)' },
    ];

    const results = tests.map(test => {
      const actual = VersionComparator.compare(test.v1, test.v2);
      const success = actual === test.expected;
      return {
        name: test.description,
        result: `实际: ${actual}, 期望: ${test.expected}`,
        success
      };
    });

    setTestResults(results);
    console.log('版本比较测试结果:', results);
  };

  /**
   * 显示版本检查对话框
   */
  const showVersionCheckDialog = () => {
    setShowVersionDialog(true);
  };

  /**
   * 获取消息栏的意图类型
   */
  const getMessageIntent = () => {
    if (error) return 'error';
    if (versionCheckResult?.isForceUpdate) return 'error';
    if (versionCheckResult?.needsUpdate) return 'warning';
    if (versionCheckResult) return 'success';
    return 'info';
  };

  /**
   * 获取消息栏的图标
   */
  const getMessageIcon = () => {
    if (error) return <ErrorCircle24Regular />;
    if (versionCheckResult?.needsUpdate) return <Warning24Regular />;
    if (versionCheckResult) return <CheckmarkCircle24Regular />;
    return <Info24Regular />;
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Text size={600} weight="semibold">版本检查功能测试</Text>}
          description="测试版本检查服务的各项功能"
        />
        <CardPreview>
          <div className={styles.section}>
            <Text size={400}>
              此测试页面用于验证版本检查功能是否正常工作，包括API调用、版本比较逻辑和UI组件。
            </Text>
            
            <div className={styles.buttonGroup}>
              <Button
                appearance="primary"
                icon={<Play24Regular />}
                onClick={runVersionCheck}
                disabled={isLoading}
              >
                检查版本更新
              </Button>
              
              <Button
                appearance="secondary"
                icon={<Info24Regular />}
                onClick={fetchSoftwareInfo}
                disabled={isLoading}
              >
                获取软件信息
              </Button>
              
              <Button
                appearance="secondary"
                icon={<ArrowClockwise24Regular />}
                onClick={runVersionComparisonTests}
              >
                测试版本比较
              </Button>
              
              <Button
                appearance="outline"
                onClick={showVersionCheckDialog}
              >
                显示版本对话框
              </Button>
            </div>

            {isLoading && (
              <div className={styles.loadingContainer}>
                <Spinner size="small" />
                <Text>正在执行测试...</Text>
              </div>
            )}
          </div>
        </CardPreview>
      </Card>

      {/* 测试结果显示 */}
      {(error || versionCheckResult) && (
        <Card className={styles.card}>
          <CardHeader header={<Text size={500} weight="semibold">版本检查结果</Text>} />
          <CardPreview>
            <div className={styles.section}>
              <MessageBar intent={getMessageIntent()}>
                <MessageBarBody>
                  {getMessageIcon()}
                  {error || versionCheckResult?.message}
                </MessageBarBody>
              </MessageBar>
              
              {versionCheckResult && (
                <div className={styles.resultContainer}>
                  <div className={styles.versionRow}>
                    <Text weight="semibold">当前版本:</Text>
                    <Text>{versionCheckResult.currentVersion}</Text>
                  </div>
                  <div className={styles.versionRow}>
                    <Text weight="semibold">最新版本:</Text>
                    <Text>{versionCheckResult.latestVersion}</Text>
                  </div>
                  <div className={styles.versionRow}>
                    <Text weight="semibold">需要更新:</Text>
                    <Text>{versionCheckResult.needsUpdate ? '是' : '否'}</Text>
                  </div>
                  <div className={styles.versionRow}>
                    <Text weight="semibold">强制更新:</Text>
                    <Text>{versionCheckResult.isForceUpdate ? '是' : '否'}</Text>
                  </div>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>
      )}

      {/* 软件信息显示 */}
      {softwareInfo && (
        <Card className={styles.card}>
          <CardHeader header={<Text size={500} weight="semibold">软件信息</Text>} />
          <CardPreview>
            <div className={styles.resultContainer}>
              <div className={styles.versionRow}>
                <Text weight="semibold">软件名称:</Text>
                <Text>{softwareInfo.name}</Text>
              </div>
              <div className={styles.versionRow}>
                <Text weight="semibold">当前版本:</Text>
                <Text>{softwareInfo.currentVersion}</Text>
              </div>
              <div className={styles.versionRow}>
                <Text weight="semibold">描述:</Text>
                <Text>{softwareInfo.description}</Text>
              </div>
              {softwareInfo.officialWebsite && (
                <div className={styles.versionRow}>
                  <Text weight="semibold">官网:</Text>
                  <Text>{softwareInfo.officialWebsite}</Text>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>
      )}

      {/* 版本比较测试结果 */}
      {testResults.length > 0 && (
        <Card className={styles.card}>
          <CardHeader header={<Text size={500} weight="semibold">版本比较测试结果</Text>} />
          <CardPreview>
            <div className={styles.section}>
              {testResults.map((test, index) => (
                <div key={index} className={styles.testResult}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {test.success ? (
                      <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                    ) : (
                      <ErrorCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                    )}
                    <Text weight="semibold">{test.name}</Text>
                  </div>
                  <Text size={300} style={{ marginLeft: '32px' }}>{test.result}</Text>
                </div>
              ))}
            </div>
          </CardPreview>
        </Card>
      )}

      {/* 版本检查对话框 */}
      <VersionChecker
        autoCheck={false}
        showDialog={showVersionDialog}
        onCheckComplete={(result) => {
          console.log('对话框版本检查完成:', result);
          setShowVersionDialog(false);
        }}
        onUpdateRequired={() => {
          console.log('需要强制更新');
        }}
        onUpdateAvailable={(updateInfo) => {
          console.log('发现可选更新:', updateInfo);
        }}
      />
    </div>
  );
};

export default VersionCheckTest;
