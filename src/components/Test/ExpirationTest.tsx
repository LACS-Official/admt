/**
 * 过期检查功能测试组件
 * 用于测试激活码过期检查、处理和自动跳转功能
 */

import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Card,
  CardHeader,
  CardPreview,
  tokens,
  MessageBar,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from '@fluentui/react-components';
import {
  Play24Regular,
  Stop24Regular,
  ArrowClockwise24Regular,
  Bug24Regular,
  Clock24Regular,
} from '@fluentui/react-icons';
import { activationService } from '../../services/activationService';
import { activationLogger } from '../../services/activationLogger';

const useStyles = makeStyles({
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    width: '100%',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  result: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'pre-wrap',
    maxHeight: '300px',
    overflow: 'auto',
  },
  testSection: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    marginBottom: '16px',
  },
});

export const ExpirationTest: React.FC = () => {
  const styles = useStyles();
  const [testResult, setTestResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setIsRunning(true);
      setTestResult(prev => prev + `\n🧪 开始测试: ${testName}\n`);
      
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTestResult(prev => prev + `✅ 测试通过: ${testName} (${duration}ms)\n结果: ${JSON.stringify(result, null, 2)}\n\n`);
    } catch (error) {
      setTestResult(prev => prev + `❌ 测试失败: ${testName}\n错误: ${error}\n\n`);
    } finally {
      setIsRunning(false);
    }
  };

  // 测试基本过期检查
  const testBasicExpirationCheck = async () => {
    const status = activationService.checkActivationStatus();
    const detailedInfo = activationService.getDetailedActivationInfo();
    const daysRemaining = activationService.getActivationDaysRemaining();
    
    return {
      status,
      detailedInfo,
      daysRemaining,
      shouldRevalidate: activationService.shouldRevalidateActivation(),
    };
  };

  // 测试过期处理流程
  const testExpirationHandling = async () => {
    const beforeStatus = activationService.checkActivationStatus();
    const handleResult = activationService.handleExpiredActivation();
    const afterStatus = activationService.checkActivationStatus();
    
    return {
      beforeStatus,
      handleResult,
      afterStatus,
    };
  };

  // 测试模拟过期激活码
  const testSimulateExpiredActivation = async () => {
    // 创建一个过期的测试激活数据
    const expiredData = {
      isActivated: true,
      activationCode: 'TEST1234-EXPIRED-TESTCODE',
      activationDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400天前
      expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10天前过期
      features: ['测试功能'],
      userConfig: {
        username: '测试用户',
        language: 'zh-CN',
      },
      apiValidation: {
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        message: '测试过期激活码',
      },
    };

    // 手动保存过期数据进行测试
    const service = activationService as any;
    const checksum = service.generateChecksum(expiredData);
    const finalData = { ...expiredData, checksum };
    const encrypted = service.encrypt(JSON.stringify(finalData));
    localStorage.setItem('hout_activation_data', encrypted);

    // 检查过期状态
    const status = activationService.checkActivationStatus();
    
    return {
      simulatedData: expiredData,
      detectedStatus: status,
      isExpiredCorrectly: status.isExpired,
    };
  };

  // 测试日期解析功能
  const testDateParsing = async () => {
    const service = activationService as any;
    const testDates = [
      '2025-01-01T12:00:00.000Z',
      '2024-12-31T23:59:59.999Z',
      '2025-06-15T08:30:00.000Z',
      'invalid-date',
      '',
    ];

    const results = testDates.map(dateStr => ({
      input: dateStr,
      parsed: service.parseApiExpiryDate(dateStr),
      isValid: service.parseApiExpiryDate(dateStr) !== undefined,
    }));

    return { testDates: results };
  };

  // 测试日志记录功能
  const testLogging = async () => {
    // 生成一些测试日志
    activationLogger.info('TEST', '测试信息日志');
    activationLogger.warn('TEST', '测试警告日志', { testData: 'warning' });
    activationLogger.error('TEST', '测试错误日志', new Error('测试错误'), { testData: 'error' });
    
    const stats = activationLogger.getLogStats();
    const recentLogs = activationLogger.getRecentLogs(10);
    const testLogs = activationLogger.getLogsByCategory('TEST');
    
    return {
      stats,
      recentLogsCount: recentLogs.length,
      testLogsCount: testLogs.length,
    };
  };

  // 测试边界情况
  const testEdgeCases = async () => {
    const service = activationService as any;
    
    // 测试空数据
    activationService.clearActivationData();
    const emptyStatus = activationService.checkActivationStatus();
    
    // 测试损坏的数据
    localStorage.setItem('hout_activation_data', 'invalid-encrypted-data');
    const corruptedStatus = activationService.checkActivationStatus();
    
    // 测试临近过期（1小时内）
    const nearExpiryData = {
      isActivated: true,
      activationCode: 'TEST1234-NEAREXP-TESTCODE',
      activationDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1小时后过期
      features: ['测试功能'],
      userConfig: { username: '测试用户' },
    };
    
    const checksum = service.generateChecksum(nearExpiryData);
    const finalData = { ...nearExpiryData, checksum };
    const encrypted = service.encrypt(JSON.stringify(finalData));
    localStorage.setItem('hout_activation_data', encrypted);
    
    const nearExpiryStatus = activationService.checkActivationStatus();
    const shouldRevalidate = activationService.shouldRevalidateActivation();
    
    return {
      emptyDataStatus: emptyStatus,
      corruptedDataStatus: corruptedStatus,
      nearExpiryStatus: nearExpiryStatus,
      shouldRevalidateNearExpiry: shouldRevalidate,
    };
  };

  // 清除测试数据
  const clearTestData = () => {
    activationService.clearActivationData();
    activationLogger.clearLogs();
    setTestResult('测试数据已清除\n');
  };

  // 导出日志
  const exportLogs = () => {
    const logs = activationLogger.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activation-logs-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTestResult(prev => prev + '日志已导出\n');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Text size={500} weight="bold">过期检查功能测试</Text>}
        />
        <CardPreview>
          <div className={styles.content}>
            <Text>这个测试页面用于验证激活码过期检查、处理和自动跳转功能。</Text>
            
            <Accordion multiple collapsible>
              <AccordionItem value="basic-tests">
                <AccordionHeader>基础功能测试</AccordionHeader>
                <AccordionPanel>
                  <div className={styles.buttonGroup}>
                    <Button 
                      appearance="primary" 
                      icon={<Play24Regular />}
                      onClick={() => runTest('基本过期检查', testBasicExpirationCheck)}
                      disabled={isRunning}
                    >
                      测试过期检查
                    </Button>
                    
                    <Button 
                      appearance="primary" 
                      icon={<Clock24Regular />}
                      onClick={() => runTest('过期处理流程', testExpirationHandling)}
                      disabled={isRunning}
                    >
                      测试过期处理
                    </Button>
                    
                    <Button 
                      appearance="primary" 
                      icon={<Bug24Regular />}
                      onClick={() => runTest('日期解析功能', testDateParsing)}
                      disabled={isRunning}
                    >
                      测试日期解析
                    </Button>
                  </div>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="simulation-tests">
                <AccordionHeader>模拟测试</AccordionHeader>
                <AccordionPanel>
                  <div className={styles.buttonGroup}>
                    <Button 
                      appearance="secondary" 
                      onClick={() => runTest('模拟过期激活码', testSimulateExpiredActivation)}
                      disabled={isRunning}
                    >
                      模拟过期激活码
                    </Button>
                    
                    <Button 
                      appearance="secondary" 
                      onClick={() => runTest('边界情况测试', testEdgeCases)}
                      disabled={isRunning}
                    >
                      测试边界情况
                    </Button>
                  </div>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="logging-tests">
                <AccordionHeader>日志和监控</AccordionHeader>
                <AccordionPanel>
                  <div className={styles.buttonGroup}>
                    <Button 
                      appearance="outline" 
                      onClick={() => runTest('日志记录功能', testLogging)}
                      disabled={isRunning}
                    >
                      测试日志记录
                    </Button>
                    
                    <Button 
                      appearance="outline" 
                      onClick={exportLogs}
                    >
                      导出日志
                    </Button>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            <div className={styles.buttonGroup}>
              <Button 
                appearance="secondary" 
                icon={<Stop24Regular />}
                onClick={clearTestData}
              >
                清除测试数据
              </Button>
              
              <Button
                appearance="secondary"
                icon={<ArrowClockwise24Regular />}
                onClick={() => setTestResult('')}
              >
                清除结果
              </Button>
            </div>

            {testResult && (
              <div>
                <Text weight="semibold">测试结果:</Text>
                <div className={styles.result}>
                  {testResult}
                </div>
              </div>
            )}

            {isRunning && (
              <MessageBar intent="info">
                测试正在运行中，请稍候...
              </MessageBar>
            )}
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default ExpirationTest;
