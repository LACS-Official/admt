/**
 * 隐私政策调试面板
 * 用于开发和测试隐私政策显示逻辑
 */

import React, { useEffect, useState }  from 'react';
import {
  Card,
  CardHeader,
  Text,
  Button,
  Switch,
  makeStyles,
  tokens,
  Divider,
  Badge,
} from '@fluentui/react-components';
import {
  Bug24Regular,
  Play24Regular,
  ArrowReset24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';
import { runPrivacyTests, getCurrentPrivacyState, resetPrivacyStateForTesting, simulatePrivacyConsentFlow } from '../../utils/privacyTestUtils';
import { runCompleteVerification } from '../../utils/testPrivacyFix';

const useStyles = makeStyles({
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px solid ${tokens.colorBrandBackground}`,
    borderRadius: tokens.borderRadiusMedium,
    zIndex: 9999,
    boxShadow: tokens.shadow16,
  },
  header: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  content: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  stateItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  testResult: {
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
  },
});

interface PrivacyDebugPanelProps {
  onClose: () => void;
}

const PrivacyDebugPanel: React.FC<PrivacyDebugPanelProps> = ({ onClose }) => {
  const styles = useStyles();
  const [currentState, setCurrentState] = useState(getCurrentPrivacyState());
  const [testResults, setTestResults] = useState<string>('');

  const privacyStore = usePrivacyConsentStore();

  // 定期更新状态
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState(getCurrentPrivacyState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRunTests = () => {
    console.log('🧪 运行隐私政策测试...');
    const results = runPrivacyTests();
    setTestResults(`测试完成: ${results.passed}通过, ${results.failed}失败`);
  };

  const handleRunVerification = () => {
    console.log('🔧 运行修复验证...');
    const results = runCompleteVerification();
    setTestResults(`修复验证: ${results.allPassed ? '✅ 成功' : '❌ 失败'}`);
  };

  const handleResetState = () => {
    resetPrivacyStateForTesting();
    setCurrentState(getCurrentPrivacyState());
    setTestResults('状态已重置');
  };

  const handleSimulateFlow = () => {
    simulatePrivacyConsentFlow();
    setCurrentState(getCurrentPrivacyState());
    setTestResults('同意流程模拟完成');
  };

  const handleTogglePrivacyPolicy = () => {
    if (currentState.hasAcceptedPrivacyPolicy) {
      privacyStore.revokePrivacyPolicy();
    } else {
      privacyStore.acceptPrivacyPolicy();
    }
    setCurrentState(getCurrentPrivacyState());
  };

  const handleToggleUserAgreement = () => {
    if (currentState.hasAcceptedUserAgreement) {
      privacyStore.revokeUserAgreement();
    } else {
      privacyStore.acceptUserAgreement();
    }
    setCurrentState(getCurrentPrivacyState());
  };

  const handleToggleDataCollection = () => {
    if (currentState.hasAcceptedDataCollection) {
      privacyStore.revokeDataCollection();
    } else {
      privacyStore.acceptDataCollection();
    }
    setCurrentState(getCurrentPrivacyState());
  };

  const handleCompleteSetup = () => {
    privacyStore.completePrivacySetup();
    setCurrentState(getCurrentPrivacyState());
  };

  const getBadgeAppearance = (value: boolean) => {
    return value ? 'filled' : 'outline';
  };

  const getBadgeColor = (value: boolean): 'success' | 'danger' => {
    return value ? 'success' : 'danger';
  };

  return (
    <Card className={styles.container}>
      <CardHeader className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <Bug24Regular />
            <Text weight="semibold">隐私政策调试面板</Text>
          </div>
          <Button appearance="subtle" onClick={onClose}>×</Button>
        </div>
      </CardHeader>

      <div className={styles.content}>
        {/* 当前状态 */}
        <div className={styles.section}>
          <Text weight="semibold">
            <Info24Regular /> 当前状态
          </Text>
          
          <div className={styles.stateItem}>
            <Text>是否首次启动:</Text>
            <Badge 
              appearance={getBadgeAppearance(currentState.isFirstLaunch)}
              color={getBadgeColor(currentState.isFirstLaunch)}
            >
              {currentState.isFirstLaunch ? '是' : '否'}
            </Badge>
          </div>

          <div className={styles.stateItem}>
            <Text>隐私设置完成:</Text>
            <Badge 
              appearance={getBadgeAppearance(currentState.hasCompletedPrivacySetup)}
              color={getBadgeColor(currentState.hasCompletedPrivacySetup)}
            >
              {currentState.hasCompletedPrivacySetup ? '是' : '否'}
            </Badge>
          </div>

          <div className={styles.stateItem}>
            <Text>隐私政策同意:</Text>
            <Badge 
              appearance={getBadgeAppearance(currentState.hasAcceptedPrivacyPolicy)}
              color={getBadgeColor(currentState.hasAcceptedPrivacyPolicy)}
            >
              {currentState.hasAcceptedPrivacyPolicy ? '已同意' : '未同意'}
            </Badge>
          </div>

          <div className={styles.stateItem}>
            <Text>用户协议同意:</Text>
            <Badge 
              appearance={getBadgeAppearance(currentState.hasAcceptedUserAgreement)}
              color={getBadgeColor(currentState.hasAcceptedUserAgreement)}
            >
              {currentState.hasAcceptedUserAgreement ? '已同意' : '未同意'}
            </Badge>
          </div>

          <div className={styles.stateItem}>
            <Text>数据收集同意:</Text>
            <Badge 
              appearance={getBadgeAppearance(currentState.hasAcceptedDataCollection)}
              color={getBadgeColor(currentState.hasAcceptedDataCollection)}
            >
              {currentState.hasAcceptedDataCollection ? '已同意' : '未同意'}
            </Badge>
          </div>

          <Divider />

          <div className={styles.stateItem}>
            <Text weight="semibold">需要显示同意界面:</Text>
            <Badge 
              appearance={getBadgeAppearance(currentState.shouldShowConsent)}
              color={currentState.shouldShowConsent ? 'danger' : 'success'}
            >
              {currentState.shouldShowConsent ? '是' : '否'}
            </Badge>
          </div>
        </div>

        <Divider />

        {/* 手动控制 */}
        <div className={styles.section}>
          <Text weight="semibold">手动控制</Text>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size={200}>隐私政策:</Text>
            <Switch 
              checked={currentState.hasAcceptedPrivacyPolicy}
              onChange={handleTogglePrivacyPolicy}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size={200}>用户协议:</Text>
            <Switch 
              checked={currentState.hasAcceptedUserAgreement}
              onChange={handleToggleUserAgreement}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size={200}>数据收集:</Text>
            <Switch 
              checked={currentState.hasAcceptedDataCollection}
              onChange={handleToggleDataCollection}
            />
          </div>

          <Button 
            appearance="outline" 
            onClick={handleCompleteSetup}
            disabled={currentState.hasCompletedPrivacySetup}
          >
            完成隐私设置
          </Button>
        </div>

        <Divider />

        {/* 测试操作 */}
        <div className={styles.section}>
          <Text weight="semibold">测试操作</Text>
          
          <div className={styles.buttonGroup}>
            <Button 
              appearance="primary" 
              icon={<Play24Regular />}
              onClick={handleRunTests}
              size="small"
            >
              运行测试
            </Button>
            
            <Button 
              appearance="secondary" 
              icon={<ArrowReset24Regular />}
              onClick={handleResetState}
              size="small"
            >
              重置状态
            </Button>
            
            <Button
              appearance="outline"
              onClick={handleSimulateFlow}
              size="small"
            >
              模拟流程
            </Button>

            <Button
              appearance="primary"
              onClick={handleRunVerification}
              size="small"
            >
              验证修复
            </Button>
          </div>

          {testResults && (
            <div className={styles.testResult}>
              <Text size={200}>{testResults}</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PrivacyDebugPanel;
