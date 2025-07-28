/**
 * 激活功能测试组件
 * 用于测试激活码保存和加载功能
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
} from '@fluentui/react-components';
import { activationService } from '../../services/activationService';

const useStyles = makeStyles({
  container: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '600px',
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
    maxHeight: '200px',
    overflow: 'auto',
  },
});

export const ActivationTest: React.FC = () => {
  const styles = useStyles();
  const [testResult, setTestResult] = useState<string>('');

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setTestResult(`正在运行测试: ${testName}...\n`);
      const result = await testFn();
      setTestResult(prev => prev + `✅ 测试通过: ${testName}\n结果: ${JSON.stringify(result, null, 2)}\n\n`);
    } catch (error) {
      setTestResult(prev => prev + `❌ 测试失败: ${testName}\n错误: ${error}\n\n`);
    }
  };

  const testEncryption = async () => {
    const testData = {
      isActivated: true,
      activationCode: 'TEST1234-ABCD56-EFGH7890',
      activationDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      features: ['基础功能', '高级功能', '专业功能'],
      userConfig: {
        username: 'HOUT用户',
        language: 'zh-CN',
        theme: 'light',
      },
      checksum: 'test-checksum'
    };

    // 测试加密和解密
    const service = activationService as any;
    const encrypted = service.encrypt(JSON.stringify(testData));
    const decrypted = service.decrypt(encrypted);
    const parsedData = JSON.parse(decrypted);

    if (JSON.stringify(testData) === JSON.stringify(parsedData)) {
      return { success: true, message: '加密解密测试通过', encrypted: encrypted.substring(0, 50) + '...' };
    } else {
      throw new Error('加密解密数据不匹配');
    }
  };

  const testSaveLoad = async () => {
    const testData = {
      activationCode: 'TEST1234-ABCD56-EFGH7890',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      features: ['基础功能', '高级功能'],
      userConfig: {
        username: 'HOUT用户',
        language: 'zh-CN',
      }
    };

    // 清除现有数据
    activationService.clearActivationData();

    // 保存测试数据
    const service = activationService as any;
    await service.saveActivationData(testData);

    // 加载数据
    const loadedData = activationService.loadActivationData();

    if (loadedData && loadedData.isActivated && loadedData.activationCode === testData.activationCode) {
      return { success: true, message: '保存加载测试通过', loadedData };
    } else {
      throw new Error('保存加载数据不匹配');
    }
  };

  const testActivationStatus = async () => {
    const status = activationService.checkActivationStatus();
    const daysRemaining = activationService.getActivationDaysRemaining();
    const shouldRevalidate = activationService.shouldRevalidateActivation();

    return {
      status,
      daysRemaining,
      shouldRevalidate,
    };
  };

  const testUnicodeHandling = async () => {
    const unicodeData = {
      chinese: '中文测试数据',
      emoji: '🎉🚀✅❌',
      special: '特殊字符: ©®™€£¥',
      mixed: 'Mixed 混合 データ 🌟',
    };

    const service = activationService as any;
    const encrypted = service.encrypt(JSON.stringify(unicodeData));
    const decrypted = service.decrypt(encrypted);
    const parsedData = JSON.parse(decrypted);

    if (JSON.stringify(unicodeData) === JSON.stringify(parsedData)) {
      return { success: true, message: 'Unicode处理测试通过', data: parsedData };
    } else {
      throw new Error('Unicode数据处理失败');
    }
  };

  const clearTestData = () => {
    activationService.clearActivationData();
    setTestResult('测试数据已清除\n');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Text size={500} weight="bold">激活功能测试</Text>}
        />
        <CardPreview>
          <div className={styles.content}>
            <Text>这个测试页面用于验证激活码保存和加载功能是否正常工作。</Text>
            
            <div className={styles.buttonGroup}>
              <Button 
                appearance="primary" 
                onClick={() => runTest('加密解密功能', testEncryption)}
              >
                测试加密解密
              </Button>
              
              <Button 
                appearance="primary" 
                onClick={() => runTest('保存加载功能', testSaveLoad)}
              >
                测试保存加载
              </Button>
              
              <Button 
                appearance="primary" 
                onClick={() => runTest('激活状态检查', testActivationStatus)}
              >
                测试状态检查
              </Button>
              
              <Button 
                appearance="primary" 
                onClick={() => runTest('Unicode处理', testUnicodeHandling)}
              >
                测试Unicode
              </Button>
              
              <Button 
                appearance="secondary" 
                onClick={clearTestData}
              >
                清除测试数据
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
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default ActivationTest;
