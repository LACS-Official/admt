/**
 * 隐私政策修复验证脚本
 * 用于验证隐私政策显示逻辑修复是否有效
 */

import { usePrivacyConsentStore, shouldShowPrivacyConsent } from '../stores/privacyConsentStore';

export interface TestResult {
  testName: string;
  passed: boolean;
  expected: boolean;
  actual: boolean;
  description: string;
}

/**
 * 运行隐私政策修复验证测试
 */
export const runPrivacyFixVerification = (): TestResult[] => {
  console.log('🔧 开始验证隐私政策显示逻辑修复...');
  
  const results: TestResult[] = [];
  const store = usePrivacyConsentStore.getState();

  // 测试1：首次启动应该显示隐私政策
  console.log('\n📋 测试1: 首次启动场景');
  store.resetPrivacyConsent();
  const test1Result = shouldShowPrivacyConsent();
  results.push({
    testName: '首次启动',
    passed: test1Result === true,
    expected: true,
    actual: test1Result,
    description: '首次启动时应该显示隐私政策弹窗'
  });

  // 测试2：完成所有同意后不应该显示
  console.log('\n📋 测试2: 完成所有同意场景');
  store.resetPrivacyConsent();
  store.acceptPrivacyPolicy();
  store.acceptUserAgreement();
  store.acceptDataCollection();
  store.completePrivacySetup();
  const test2Result = shouldShowPrivacyConsent();
  results.push({
    testName: '完成所有同意',
    passed: test2Result === false,
    expected: false,
    actual: test2Result,
    description: '完成所有同意后不应该显示隐私政策弹窗'
  });

  // 测试3：部分同意应该显示
  console.log('\n📋 测试3: 部分同意场景');
  store.resetPrivacyConsent();
  store.acceptPrivacyPolicy();
  store.acceptUserAgreement();
  // 未同意数据收集
  const test3Result = shouldShowPrivacyConsent();
  results.push({
    testName: '部分同意',
    passed: test3Result === true,
    expected: true,
    actual: test3Result,
    description: '部分同意时应该显示隐私政策弹窗'
  });

  // 测试4：撤销隐私政策后应该显示
  console.log('\n📋 测试4: 撤销隐私政策场景');
  store.resetPrivacyConsent();
  store.acceptPrivacyPolicy();
  store.acceptUserAgreement();
  store.acceptDataCollection();
  store.completePrivacySetup();
  store.revokePrivacyPolicy();
  const test4Result = shouldShowPrivacyConsent();
  results.push({
    testName: '撤销隐私政策',
    passed: test4Result === true,
    expected: true,
    actual: test4Result,
    description: '撤销隐私政策后应该显示隐私政策弹窗'
  });

  // 测试5：撤销用户协议后应该显示
  console.log('\n📋 测试5: 撤销用户协议场景');
  store.resetPrivacyConsent();
  store.acceptPrivacyPolicy();
  store.acceptUserAgreement();
  store.acceptDataCollection();
  store.completePrivacySetup();
  store.revokeUserAgreement();
  const test5Result = shouldShowPrivacyConsent();
  results.push({
    testName: '撤销用户协议',
    passed: test5Result === true,
    expected: true,
    actual: test5Result,
    description: '撤销用户协议后应该显示隐私政策弹窗'
  });

  // 测试6：撤销数据收集后应该显示
  console.log('\n📋 测试6: 撤销数据收集场景');
  store.resetPrivacyConsent();
  store.acceptPrivacyPolicy();
  store.acceptUserAgreement();
  store.acceptDataCollection();
  store.completePrivacySetup();
  store.revokeDataCollection();
  const test6Result = shouldShowPrivacyConsent();
  results.push({
    testName: '撤销数据收集',
    passed: test6Result === true,
    expected: true,
    actual: test6Result,
    description: '撤销数据收集后应该显示隐私政策弹窗'
  });

  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}: 期望 ${result.expected}, 实际 ${result.actual}`);
  });
  
  console.log(`\n🎯 总体结果: ${passedTests}/${totalTests} 通过 (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！隐私政策显示逻辑修复成功！');
  } else {
    console.log('⚠️ 部分测试失败，需要进一步检查修复逻辑');
  }

  return results;
};

/**
 * 验证状态持久化
 */
export const verifyStatePersistence = (): boolean => {
  console.log('💾 验证状态持久化...');
  
  const store = usePrivacyConsentStore.getState();
  
  // 重置并设置状态
  store.resetPrivacyConsent();
  store.acceptPrivacyPolicy();
  store.acceptUserAgreement();
  store.acceptDataCollection();
  store.completePrivacySetup();
  
  // 检查状态是否正确
  const currentState = store;
  const isValid = currentState.hasAcceptedPrivacyPolicy &&
                  currentState.hasAcceptedUserAgreement &&
                  currentState.hasAcceptedDataCollection &&
                  currentState.hasCompletedPrivacySetup &&
                  !currentState.isFirstLaunch;
  
  console.log('状态持久化验证:', isValid ? '✅ 通过' : '❌ 失败');
  console.log('当前状态:', {
    hasAcceptedPrivacyPolicy: currentState.hasAcceptedPrivacyPolicy,
    hasAcceptedUserAgreement: currentState.hasAcceptedUserAgreement,
    hasAcceptedDataCollection: currentState.hasAcceptedDataCollection,
    hasCompletedPrivacySetup: currentState.hasCompletedPrivacySetup,
    isFirstLaunch: currentState.isFirstLaunch,
  });
  
  return isValid;
};

/**
 * 完整的修复验证
 */
export const runCompleteVerification = () => {
  console.log('🚀 开始完整的隐私政策修复验证...');
  
  // 运行逻辑测试
  const logicResults = runPrivacyFixVerification();
  
  // 验证状态持久化
  const persistenceResult = verifyStatePersistence();
  
  // 汇总结果
  const logicPassed = logicResults.every(r => r.passed);
  const allPassed = logicPassed && persistenceResult;
  
  console.log('\n🏁 完整验证结果:');
  console.log(`📋 逻辑测试: ${logicPassed ? '✅ 通过' : '❌ 失败'}`);
  console.log(`💾 持久化测试: ${persistenceResult ? '✅ 通过' : '❌ 失败'}`);
  console.log(`🎯 总体结果: ${allPassed ? '✅ 修复成功' : '❌ 需要进一步修复'}`);
  
  return {
    logicResults,
    persistenceResult,
    allPassed
  };
};

// 在开发环境下暴露到全局
if (import.meta.env.DEV) {
  (window as any).privacyFixVerification = {
    runPrivacyFixVerification,
    verifyStatePersistence,
    runCompleteVerification
  };
}
