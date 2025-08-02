/**
 * API expiresAt字段集成测试
 * 验证所有组件正确使用API响应中的expiresAt字段
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Body1,
  Button,
  MessageBar,
  Divider,
} from '@fluentui/react-components';
import { formatActivationExpiryDate } from '../utils/dateFormatter';
import { activationService } from '../services/activationService';

const useStyles = makeStyles({
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    marginBottom: '16px',
  },
  testSection: {
    marginBottom: '16px',
  },
  testItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e1e5e9',
  },
  label: {
    fontWeight: 'semibold',
    minWidth: '200px',
  },
  value: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  button: {
    marginRight: '8px',
  },
});

const ApiExpiresAtIntegrationTest: React.FC = () => {
  const styles = useStyles();
  const [testResults, setTestResults] = useState<{
    activationServiceData: any;
    formattedTimes: any;
    apiConsistency: any;
  } | null>(null);

  // 模拟API响应数据
  const mockApiResponse = {
    success: true,
    data: {
      id: "5f6adbdb-d24d-40d8-a3e8-f8fe329d9bb1",
      code: "MDT058NI-4IL6RC-158DD220",
      createdAt: "2025-08-01T15:52:24.100Z",
      expiresAt: "2025-08-03T15:52:24.079Z",
      isUsed: true,
      usedAt: "2025-08-01T15:52:29.593Z",
      isExpired: false,
      productInfo: {
        name: "玩机管家",
        version: "1.0.0",
        features: ["basic"]
      },
      metadata: {
        licenseType: "standard"
      }
    }
  };

  const runTests = () => {
    console.log('开始API expiresAt字段集成测试...');

    // 测试1: 检查activationService如何处理API数据
    const activationData = activationService.loadActivationData();
    
    // 测试2: 验证时间格式化一致性
    const apiExpiresAt = mockApiResponse.data.expiresAt;
    const formattedApiTime = formatActivationExpiryDate(apiExpiresAt);
    
    // 测试3: 检查时区转换
    const utcDate = new Date(apiExpiresAt);
    const expectedChinaTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    
    // 测试4: 验证API一致性
    const apiConsistencyTest = {
      originalUtc: apiExpiresAt,
      parsedDate: utcDate.toISOString(),
      formattedDisplay: formattedApiTime,
      expectedChinaHour: expectedChinaTime.getHours(),
      actualDisplayHour: formattedApiTime.includes('23:52') ? 23 : 'unknown'
    };

    setTestResults({
      activationServiceData: {
        hasLocalData: !!activationData,
        localExpiryDate: activationData?.expiryDate,
        apiValidationData: activationData?.apiValidation,
        apiExpiresAt: activationData?.apiValidation?.expiresAt,
      },
      formattedTimes: {
        apiExpiresAt,
        formattedDisplay: formattedApiTime,
        utcTime: utcDate.toISOString(),
        localTime: utcDate.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      },
      apiConsistency: apiConsistencyTest
    });

    console.log('测试结果:', {
      activationServiceData: activationData,
      formattedTimes: {
        apiExpiresAt,
        formattedDisplay: formattedApiTime,
      },
      apiConsistency: apiConsistencyTest
    });
  };

  const clearTestData = () => {
    // 清除本地激活数据以便重新测试
    activationService.clearActivationData();
    setTestResults(null);
    console.log('已清除测试数据');
  };

  const simulateApiActivation = async () => {
    try {
      // 模拟API激活响应
      const mockActivationResponse = {
        success: true,
        status: 'activated' as const,
        message: '激活成功',
        expiryDate: mockApiResponse.data.expiresAt,
        features: ['basic', 'advanced'],
        apiValidation: {
          expiresAt: mockApiResponse.data.expiresAt,
          remainingTime: 172800, // 48小时
          message: '激活有效'
        }
      };

      // 保存模拟的激活数据
      await activationService.saveActivationData({
        activationCode: mockApiResponse.data.code,
        expiryDate: new Date(mockApiResponse.data.expiresAt),
        features: ['basic', 'advanced'],
        userConfig: {
          username: 'Test User',
          language: 'zh-CN',
          theme: 'light'
        },
        apiValidation: mockActivationResponse.apiValidation
      });

      console.log('已模拟API激活并保存数据');
      runTests(); // 自动运行测试
    } catch (error) {
      console.error('模拟激活失败:', error);
    }
  };

  return (
    <div className={styles.container}>
      <Title3>API expiresAt字段集成测试</Title3>
      <Body1>验证所有组件正确使用API响应中的expiresAt字段</Body1>

      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">测试控制</Text>}
          description="运行测试以验证API数据处理"
        />
        <CardPreview>
          <div className={styles.testSection}>
            <Button
              appearance="primary"
              className={styles.button}
              onClick={runTests}
            >
              运行测试
            </Button>
            <Button
              appearance="secondary"
              className={styles.button}
              onClick={simulateApiActivation}
            >
              模拟API激活
            </Button>
            <Button
              appearance="subtle"
              onClick={clearTestData}
            >
              清除测试数据
            </Button>
          </div>
        </CardPreview>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Text weight="semibold">模拟API响应数据</Text>}
          description="用于测试的API响应格式"
        />
        <CardPreview>
          <div className={styles.testSection}>
            <div className={styles.testItem}>
              <Text className={styles.label}>API expiresAt:</Text>
              <Text className={styles.value}>{mockApiResponse.data.expiresAt}</Text>
            </div>
            <div className={styles.testItem}>
              <Text className={styles.label}>激活码:</Text>
              <Text className={styles.value}>{mockApiResponse.data.code}</Text>
            </div>
            <div className={styles.testItem}>
              <Text className={styles.label}>创建时间:</Text>
              <Text className={styles.value}>{mockApiResponse.data.createdAt}</Text>
            </div>
            <div className={styles.testItem}>
              <Text className={styles.label}>使用时间:</Text>
              <Text className={styles.value}>{mockApiResponse.data.usedAt}</Text>
            </div>
          </div>
        </CardPreview>
      </Card>

      {testResults && (
        <>
          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">ActivationService数据检查</Text>}
              description="验证本地存储的激活数据"
            />
            <CardPreview>
              <div className={styles.testSection}>
                <div className={styles.testItem}>
                  <Text className={styles.label}>有本地数据:</Text>
                  <Text className={styles.value}>
                    {testResults.activationServiceData.hasLocalData ? '是' : '否'}
                  </Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>本地过期时间:</Text>
                  <Text className={styles.value}>
                    {testResults.activationServiceData.localExpiryDate || '无'}
                  </Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>API验证数据:</Text>
                  <Text className={styles.value}>
                    {testResults.activationServiceData.apiValidationData ? '有' : '无'}
                  </Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>API expiresAt:</Text>
                  <Text className={styles.value}>
                    {testResults.activationServiceData.apiExpiresAt || '无'}
                  </Text>
                </div>
              </div>
            </CardPreview>
          </Card>

          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">时间格式化测试</Text>}
              description="验证时间格式化的一致性"
            />
            <CardPreview>
              <div className={styles.testSection}>
                <div className={styles.testItem}>
                  <Text className={styles.label}>原始API时间:</Text>
                  <Text className={styles.value}>{testResults.formattedTimes.apiExpiresAt}</Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>格式化显示:</Text>
                  <Text className={styles.value}>{testResults.formattedTimes.formattedDisplay}</Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>UTC时间:</Text>
                  <Text className={styles.value}>{testResults.formattedTimes.utcTime}</Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>本地时间:</Text>
                  <Text className={styles.value}>{testResults.formattedTimes.localTime}</Text>
                </div>
              </div>
            </CardPreview>
          </Card>

          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">API一致性验证</Text>}
              description="验证时区转换和格式一致性"
            />
            <CardPreview>
              <div className={styles.testSection}>
                <div className={styles.testItem}>
                  <Text className={styles.label}>时区转换正确:</Text>
                  <Text className={styles.value}>
                    {testResults.apiConsistency.expectedChinaHour === testResults.apiConsistency.actualDisplayHour ? '是' : '否'}
                  </Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>期望中国时间小时:</Text>
                  <Text className={styles.value}>{testResults.apiConsistency.expectedChinaHour}</Text>
                </div>
                <div className={styles.testItem}>
                  <Text className={styles.label}>实际显示小时:</Text>
                  <Text className={styles.value}>{testResults.apiConsistency.actualDisplayHour}</Text>
                </div>
              </div>
              
              {testResults.apiConsistency.expectedChinaHour === testResults.apiConsistency.actualDisplayHour ? (
                <MessageBar intent="success">
                  ✅ 时区转换正确！UTC时间正确转换为中国时区时间。
                </MessageBar>
              ) : (
                <MessageBar intent="error">
                  ❌ 时区转换错误！请检查时间格式化逻辑。
                </MessageBar>
              )}
            </CardPreview>
          </Card>
        </>
      )}
    </div>
  );
};

export default ApiExpiresAtIntegrationTest;
