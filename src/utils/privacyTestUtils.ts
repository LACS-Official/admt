/**
 * 隐私政策测试工具
 * 用于测试和验证隐私政策显示逻辑
 */

import { usePrivacyConsentStore, shouldShowPrivacyConsent } from '../stores/privacyConsentStore';

export interface PrivacyTestScenario {
  name: string;
  description: string;
  setup: () => void;
  expectedResult: boolean;
}

/**
 * 测试场景定义
 */
export const privacyTestScenarios: PrivacyTestScenario[] = [
  {
    name: '首次启动',
    description: '应用首次启动，所有状态为初始值',
    setup: () => {
      const store = usePrivacyConsentStore.getState();
      store.resetPrivacyConsent();
    },
    expectedResult: true
  },
  {
    name: '已完成隐私设置',
    description: '用户已同意所有政策并完成设置',
    setup: () => {
      const store = usePrivacyConsentStore.getState();
      store.resetPrivacyConsent();
      store.acceptPrivacyPolicy();
      store.acceptUserAgreement();
      store.acceptDataCollection();
      store.completePrivacySetup();
    },
    expectedResult: false
  },
  {
    name: '部分同意',
    description: '用户只同意了部分政策',
    setup: () => {
      const store = usePrivacyConsentStore.getState();
      store.resetPrivacyConsent();
      store.acceptPrivacyPolicy();
      store.acceptUserAgreement();
      // 未同意数据收集
    },
    expectedResult: true
  },
  {
    name: '撤销隐私政策',
    description: '用户撤销了隐私政策同意',
    setup: () => {
      const store = usePrivacyConsentStore.getState();
      store.resetPrivacyConsent();
      store.acceptPrivacyPolicy();
      store.acceptUserAgreement();
      store.acceptDataCollection();
      store.completePrivacySetup();
      store.revokePrivacyPolicy();
    },
    expectedResult: true
  },
  {
    name: '撤销用户协议',
    description: '用户撤销了用户协议同意',
    setup: () => {
      const store = usePrivacyConsentStore.getState();
      store.resetPrivacyConsent();
      store.acceptPrivacyPolicy();
      store.acceptUserAgreement();
      store.acceptDataCollection();
      store.completePrivacySetup();
      store.revokeUserAgreement();
    },
    expectedResult: true
  },
  {
    name: '撤销数据收集',
    description: '用户撤销了数据收集同意',
    setup: () => {
      const store = usePrivacyConsentStore.getState();
      store.resetPrivacyConsent();
      store.acceptPrivacyPolicy();
      store.acceptUserAgreement();
      store.acceptDataCollection();
      store.completePrivacySetup();
      store.revokeDataCollection();
    },
    expectedResult: true
  }
];

/**
 * 运行隐私政策测试
 */
export const runPrivacyTests = (): { passed: number; failed: number; results: Array<{ scenario: string; passed: boolean; expected: boolean; actual: boolean }> } => {
  console.log('🧪 开始运行隐私政策测试...');
  
  const results: Array<{ scenario: string; passed: boolean; expected: boolean; actual: boolean }> = [];
  let passed = 0;
  let failed = 0;

  for (const scenario of privacyTestScenarios) {
    console.log(`\n📋 测试场景: ${scenario.name}`);
    console.log(`📝 描述: ${scenario.description}`);
    
    try {
      // 设置测试场景
      scenario.setup();
      
      // 执行测试
      const actualResult = shouldShowPrivacyConsent();
      const testPassed = actualResult === scenario.expectedResult;
      
      if (testPassed) {
        console.log(`✅ 测试通过 - 期望: ${scenario.expectedResult}, 实际: ${actualResult}`);
        passed++;
      } else {
        console.log(`❌ 测试失败 - 期望: ${scenario.expectedResult}, 实际: ${actualResult}`);
        failed++;
      }
      
      results.push({
        scenario: scenario.name,
        passed: testPassed,
        expected: scenario.expectedResult,
        actual: actualResult
      });
      
    } catch (error) {
      console.error(`💥 测试场景 "${scenario.name}" 执行失败:`, error);
      failed++;
      results.push({
        scenario: scenario.name,
        passed: false,
        expected: scenario.expectedResult,
        actual: false
      });
    }
  }
  
  console.log(`\n📊 测试结果汇总:`);
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return { passed, failed, results };
};

/**
 * 获取当前隐私政策状态
 */
export const getCurrentPrivacyState = () => {
  const state = usePrivacyConsentStore.getState();
  return {
    isFirstLaunch: state.isFirstLaunch,
    hasCompletedPrivacySetup: state.hasCompletedPrivacySetup,
    hasAcceptedPrivacyPolicy: state.hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement: state.hasAcceptedUserAgreement,
    hasAcceptedDataCollection: state.hasAcceptedDataCollection,
    shouldShowConsent: shouldShowPrivacyConsent(),
    privacyPolicyVersion: state.privacyPolicyVersion,
    userAgreementVersion: state.userAgreementVersion,
  };
};

/**
 * 重置隐私政策状态（用于测试）
 */
export const resetPrivacyStateForTesting = () => {
  const store = usePrivacyConsentStore.getState();
  store.resetPrivacyConsent();
  console.log('🔄 隐私政策状态已重置为测试状态');
};

/**
 * 模拟完整的隐私政策同意流程
 */
export const simulatePrivacyConsentFlow = () => {
  console.log('🎭 模拟隐私政策同意流程...');
  
  const store = usePrivacyConsentStore.getState();
  
  console.log('1️⃣ 重置状态');
  store.resetPrivacyConsent();
  
  console.log('2️⃣ 检查初始状态 - 应该需要显示同意界面');
  console.log('需要显示:', shouldShowPrivacyConsent());
  
  console.log('3️⃣ 用户同意隐私政策');
  store.acceptPrivacyPolicy();
  console.log('需要显示:', shouldShowPrivacyConsent());
  
  console.log('4️⃣ 用户同意用户协议');
  store.acceptUserAgreement();
  console.log('需要显示:', shouldShowPrivacyConsent());
  
  console.log('5️⃣ 用户同意数据收集');
  store.acceptDataCollection();
  console.log('需要显示:', shouldShowPrivacyConsent());
  
  console.log('6️⃣ 完成隐私设置');
  store.completePrivacySetup();
  console.log('需要显示:', shouldShowPrivacyConsent());
  
  console.log('✅ 隐私政策同意流程模拟完成');
};

// 在开发环境下将测试函数暴露到全局
if (import.meta.env.DEV) {
  (window as any).privacyTestUtils = {
    runPrivacyTests,
    getCurrentPrivacyState,
    resetPrivacyStateForTesting,
    simulatePrivacyConsentFlow,
    privacyTestScenarios
  };
}
