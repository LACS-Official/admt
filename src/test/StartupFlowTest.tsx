/**
 * 启动流程测试组件
 * 用于测试和验证启动流程的各个阶段
 */

import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Title1,
  Body1,
  Card,
  RadioGroup,
  Radio,
  MessageBar,
  Badge,
} from '@fluentui/react-components';
import {
  Play24Regular,
  Stop24Regular,
  ArrowReset24Regular,
} from '@fluentui/react-icons';
import StartupFlowManager from '../components/StartupFlow/StartupFlowManager';
import { useStartupFlowStore } from '../stores/startupFlowStore';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  testCard: {
    padding: '24px',
    marginBottom: '24px',
  },
  controlSection: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  statusSection: {
    marginBottom: '24px',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  statusItem: {
    padding: '12px',
    backgroundColor: '#f8f7ff',
    borderRadius: '8px',
    border: '1px solid #e1dfdd',
  },
  scenarioSection: {
    marginBottom: '24px',
  },
  flowContainer: {
    border: '2px solid #e1dfdd',
    borderRadius: '8px',
    overflow: 'hidden',
    marginTop: '24px',
  },
});

const StartupFlowTest: React.FC = () => {
  const styles = useStyles();
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testScenario, setTestScenario] = useState('normal');
  const [testResult, setTestResult] = useState<string | null>(null);

  const {
    currentPhase,
    userType,
    versionCheckResult,
    activationStatus,
    error,
    retryCount,
    resetStartupFlow,
  } = useStartupFlowStore();

  const testScenarios = [
    {
      value: 'normal',
      label: '正常流程',
      description: '模拟正常的启动流程，新用户首次使用',
    },
    {
      value: 'existing-user',
      label: '现有用户',
      description: '模拟现有用户启动，已有激活码',
    },
    {
      value: 'expired-activation',
      label: '激活过期',
      description: '模拟激活码过期的情况',
    },
    {
      value: 'force-update',
      label: '强制更新',
      description: '模拟需要强制更新的情况',
    },
    {
      value: 'network-error',
      label: '网络错误',
      description: '模拟网络连接失败的情况',
    },
  ];

  const handleStartTest = () => {
    setIsTestRunning(true);
    setTestResult(null);

    // 根据测试场景设置初始状态
    resetStartupFlow();
    setupTestScenario(testScenario);
  };

  const handleStopTest = () => {
    setIsTestRunning(false);
    setTestResult('测试已停止');
  };

  const handleResetTest = () => {
    setIsTestRunning(false);
    setTestResult(null);
    resetStartupFlow();
  };

  const setupTestScenario = (scenario: string) => {
    const store = useStartupFlowStore.getState();
    
    switch (scenario) {
      case 'existing-user':
        store.updateUserSettings({
          ...store.userSettings,
          isFirstLaunch: false,
        });
        store.setActivationStatus({
          isValid: true,
          isActivated: true,
          code: 'TEST-1234-5678-9ABC',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          activatedAt: new Date().toISOString(),
          remainingDays: 30,
        });
        break;
        
      case 'expired-activation':
        store.updateUserSettings({
          ...store.userSettings,
          isFirstLaunch: false,
        });
        store.setActivationStatus({
          isValid: false,
          isActivated: true,
          code: 'TEST-1234-5678-9ABC',
          expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          activatedAt: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
          remainingDays: 0,
          gracePeriodDays: 7,
        });
        break;
        
      case 'force-update':
        // 这个场景会在版本检查时触发
        break;
        
      case 'network-error':
        // 这个场景会在API调用时触发
        break;
        
      default:
        // 正常流程，保持默认设置
        break;
    }
  };

  const handleTestComplete = () => {
    setIsTestRunning(false);
    setTestResult('启动流程测试完成');
  };

  const handleTestError = (error: string) => {
    setIsTestRunning(false);
    setTestResult(`测试失败: ${error}`);
  };

  const getPhaseDisplayName = (phase: string) => {
    const phaseNames: Record<string, string> = {
      'user-behavior-upload': '用户行为统计上传',
      'version-check': '版本检查',
      'user-type-detection': '用户类型检测',
      'activation-verification': '激活验证',
      'completed': '完成',
    };
    return phaseNames[phase] || phase;
  };

  const getUserTypeDisplayName = (type: string) => {
    const typeNames: Record<string, string> = {
      'new': '新用户',
      'existing': '现有用户',
      'expired': '过期用户',
      'unknown': '未知',
    };
    return typeNames[type] || type;
  };

  return (
    <div className={styles.container}>
      <Title1>启动流程测试</Title1>
      
      {/* 控制面板 */}
      <Card className={styles.testCard}>
        <Text weight="semibold" size={500}>测试控制</Text>
        
        <div className={styles.scenarioSection}>
          <Body1>选择测试场景:</Body1>
          <RadioGroup
            value={testScenario}
            onChange={(_, data) => setTestScenario(data.value)}
            disabled={isTestRunning}
          >
            {testScenarios.map((scenario) => (
              <Radio
                key={scenario.value}
                value={scenario.value}
                label={
                  <div>
                    <Text weight="semibold">{scenario.label}</Text>
                    <br />
                    <Text size={200}>{scenario.description}</Text>
                  </div>
                }
              />
            ))}
          </RadioGroup>
        </div>

        <div className={styles.controlSection}>
          <Button
            appearance="primary"
            icon={<Play24Regular />}
            onClick={handleStartTest}
            disabled={isTestRunning}
          >
            开始测试
          </Button>
          <Button
            appearance="secondary"
            icon={<Stop24Regular />}
            onClick={handleStopTest}
            disabled={!isTestRunning}
          >
            停止测试
          </Button>
          <Button
            appearance="subtle"
            icon={<ArrowReset24Regular />}
            onClick={handleResetTest}
          >
            重置
          </Button>
        </div>

        {testResult && (
          <MessageBar
            intent={testResult.includes('失败') ? 'error' : 'success'}
            style={{ marginTop: '16px' }}
          >
            {testResult}
          </MessageBar>
        )}
      </Card>

      {/* 状态监控 */}
      <Card className={styles.testCard}>
        <Text weight="semibold" size={500}>流程状态</Text>
        
        <div className={styles.statusGrid}>
          <div className={styles.statusItem}>
            <Text weight="semibold">当前阶段</Text>
            <br />
            <Badge appearance="filled" color="brand">
              {getPhaseDisplayName(currentPhase)}
            </Badge>
          </div>
          
          <div className={styles.statusItem}>
            <Text weight="semibold">用户类型</Text>
            <br />
            <Badge appearance="outline">
              {getUserTypeDisplayName(userType)}
            </Badge>
          </div>
          
          <div className={styles.statusItem}>
            <Text weight="semibold">重试次数</Text>
            <br />
            <Text>{retryCount}</Text>
          </div>
          
          <div className={styles.statusItem}>
            <Text weight="semibold">错误状态</Text>
            <br />
            {error ? (
              <Badge appearance="filled" color="danger">有错误</Badge>
            ) : (
              <Badge appearance="filled" color="success">正常</Badge>
            )}
          </div>
        </div>

        {error && (
          <MessageBar intent="error" style={{ marginTop: '16px' }}>
            错误信息: {error}
          </MessageBar>
        )}
      </Card>

      {/* 启动流程容器 */}
      {isTestRunning && (
        <div className={styles.flowContainer}>
          <StartupFlowManager
            onComplete={handleTestComplete}
            onError={handleTestError}
          />
        </div>
      )}
    </div>
  );
};

export default StartupFlowTest;
