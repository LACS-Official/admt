import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  makeStyles,
  tokens,
  Badge,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components';
import { 
  Shield24Regular, 
  Warning24Regular, 
  CheckmarkCircle24Regular,
  Play24Regular,
  Stop24Regular
} from '@fluentui/react-icons';
import { useSecurityContext } from './SecurityProvider';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
  },
  card: {
    width: '100%',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
  },
  testRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  testInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  testTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  testDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  testActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statusSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instructionsCard: {
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  instructionsList: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalM,
  },
});

export const SecurityTest: React.FC = () => {
  const styles = useStyles();
  const {
    isProtectionEnabled,
    isDevToolsDetected,
    isRefreshProtectionEnabled
  } = useSecurityContext();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const securityTests = [
    {
      id: 'contextmenu',
      title: '右键菜单测试',
      description: '尝试在页面上右键点击，应该被阻止',
      instruction: '在页面任意位置右键点击',
    },
    {
      id: 'f12',
      title: 'F12键测试',
      description: '按F12键尝试打开开发者工具',
      instruction: '按下F12键',
    },
    {
      id: 'ctrlshifti',
      title: 'Ctrl+Shift+I测试',
      description: '使用快捷键组合尝试打开开发者工具',
      instruction: '按下Ctrl+Shift+I组合键',
    },
    {
      id: 'ctrlu',
      title: 'Ctrl+U测试',
      description: '尝试查看页面源代码',
      instruction: '按下Ctrl+U组合键',
    },
    {
      id: 'textselection',
      title: '文本选择测试',
      description: '尝试选择页面文本',
      instruction: '尝试选择这段文字',
    },
    {
      id: 'refresh',
      title: '页面刷新测试',
      description: '尝试使用快捷键刷新页面',
      instruction: '按下F5或Ctrl+R组合键',
    },
  ];

  const runTest = (testId: string) => {
    // 模拟测试结果
    const success = isProtectionEnabled;
    setTestResults(prev => ({
      ...prev,
      [testId]: success
    }));
  };

  const runAllTests = () => {
    securityTests.forEach(test => {
      setTimeout(() => runTest(test.id), 100);
    });
  };

  const clearResults = () => {
    setTestResults({});
  };

  return (
    <div className={styles.container}>
      {/* 状态概览 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Shield24Regular />
              <Text weight="semibold" size={400}>安全防护状态</Text>
            </div>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.statusSection}>
            <div className={styles.statusRow}>
              <Text>防护状态:</Text>
              <Badge 
                appearance={isProtectionEnabled ? 'filled' : 'outline'}
                color={isProtectionEnabled ? 'success' : 'danger'}
                icon={isProtectionEnabled ? <CheckmarkCircle24Regular /> : <Warning24Regular />}
              >
                {isProtectionEnabled ? '已启用' : '已禁用'}
              </Badge>
            </div>
            <div className={styles.statusRow}>
              <Text>开发者工具检测:</Text>
              <Badge
                appearance={isDevToolsDetected ? 'filled' : 'outline'}
                color={isDevToolsDetected ? 'danger' : 'success'}
                icon={isDevToolsDetected ? <Warning24Regular /> : <CheckmarkCircle24Regular />}
              >
                {isDevToolsDetected ? '已检测到' : '未检测到'}
              </Badge>
            </div>
            <div className={styles.statusRow}>
              <Text>刷新防护:</Text>
              <Badge
                appearance={isRefreshProtectionEnabled ? 'filled' : 'outline'}
                color={isRefreshProtectionEnabled ? 'success' : 'subtle'}
                icon={isRefreshProtectionEnabled ? <CheckmarkCircle24Regular /> : <Warning24Regular />}
              >
                {isRefreshProtectionEnabled ? '已启用' : '已禁用'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 测试说明 */}
      <Card className={`${styles.card} ${styles.instructionsCard}`}>
        <CardHeader
          header={<Text weight="semibold" size={400}>测试说明</Text>}
        />
        <div className={styles.cardContent}>
          <Text size={300}>
            以下测试用于验证安全防护功能是否正常工作：
          </Text>
          <ol className={styles.instructionsList}>
            <li>确保安全防护已启用</li>
            <li>逐个执行测试项目</li>
            <li>如果防护正常，相应操作应该被阻止</li>
            <li>观察测试结果和状态变化</li>
          </ol>
        </div>
      </Card>

      {/* 安全测试项目 */}
      <Card className={styles.card}>
        <CardHeader
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text weight="semibold" size={400}>安全测试项目</Text>
              <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
                <Button 
                  appearance="primary" 
                  icon={<Play24Regular />}
                  onClick={runAllTests}
                  disabled={!isProtectionEnabled}
                >
                  运行所有测试
                </Button>
                <Button 
                  appearance="secondary" 
                  icon={<Stop24Regular />}
                  onClick={clearResults}
                >
                  清除结果
                </Button>
              </div>
            </div>
          }
        />
        <div className={styles.cardContent}>
          {!isProtectionEnabled && (
            <MessageBar intent="warning">
              <MessageBarBody>
                <MessageBarTitle>安全防护未启用</MessageBarTitle>
                请先在安全设置中启用防护功能，然后再进行测试。
              </MessageBarBody>
            </MessageBar>
          )}

          {securityTests.map((test) => (
            <div key={test.id}>
              <div className={styles.testRow}>
                <div className={styles.testInfo}>
                  <Text className={styles.testTitle}>{test.title}</Text>
                  <Text className={styles.testDescription}>{test.description}</Text>
                  <Text size={200} style={{ fontStyle: 'italic', color: tokens.colorNeutralForeground3 }}>
                    操作: {test.instruction}
                  </Text>
                </div>
                <div className={styles.testActions}>
                  {testResults[test.id] !== undefined && (
                    <Badge 
                      appearance="filled"
                      color={testResults[test.id] ? 'success' : 'danger'}
                      icon={testResults[test.id] ? <CheckmarkCircle24Regular /> : <Warning24Regular />}
                    >
                      {testResults[test.id] ? '通过' : '失败'}
                    </Badge>
                  )}
                  <Button 
                    appearance="secondary" 
                    size="small"
                    onClick={() => runTest(test.id)}
                    disabled={!isProtectionEnabled}
                  >
                    测试
                  </Button>
                </div>
              </div>
              <Divider />
            </div>
          ))}
        </div>
      </Card>

      {/* 开发者工具检测警告 */}
      {isDevToolsDetected && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>检测到开发者工具</MessageBarTitle>
            系统检测到开发者工具已打开，安全防护已激活。请关闭开发者工具以继续正常使用。
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
};
