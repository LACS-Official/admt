/**
 * 启动流程管理器组件
 * 协调整个应用启动流程的核心组件
 *
 * 启动流程序列：
 * 1. 版本检测和公告显示
 * 2. 首次使用检测
 * 3. 隐私政策和用户协议（仅首次使用）
 * 4. 激活码验证（仅首次使用且同意条款后）
 * 5. 进入主页面
 * 6. 数据收集
 */

import React, { useEffect, useState } from 'react';
import { makeStyles } from '@fluentui/react-components';
import { useStartupFlowStore } from '@/stores/startupFlowStore';
import { OptimizedUserBehaviorService } from '@/services/optimizedUserBehaviorService';
import { SecurityConfigManager } from '@/config/securityConfig';
import { activationService } from '@/services/activationService';
import { usePrivacyConsentStore, shouldShowPrivacyConsent, shouldExitApplication } from '@/stores/privacyConsentStore';

// 导入各个阶段的组件
import UnifiedLoadingVersionChecker from './App_Loading';
import ActivationPage from './ActivationPage';
import DebugPanel from '../Debug/DebugPanel';
import PrivacyDebugPanel from '../Debug/PrivacyDebugPanel';
import { devToolsManager, isDevelopment } from '../../utils/devtools';
import PrivacyConsentDialog from './PrivacyConsentDialog';

const useStyles = makeStyles({
  container: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
  },
});

interface StartupFlowManagerProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const StartupFlowManager: React.FC<StartupFlowManagerProps> = ({ onComplete, onError }) => {
  const styles = useStyles();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [showActivationValidator, setShowActivationValidator] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showPrivacyDebugPanel, setShowPrivacyDebugPanel] = useState(false);

  const {
    currentPhase,
    isFirstLaunch,
    versionCheckCompleted,
    firstLaunchDetected,
    privacyConsentCompleted,
    activationVerified,
    dataCollectionStarted,
    setCurrentPhase,
    setIsFirstLaunch,
    setError,
    resetRetryCount,
    setActivationStatus,
    updateUserSettings,
    setActivationVerified,
    setVersionCheckCompleted,
    setAnnouncementDisplayed,
    setFirstLaunchDetected,
    setPrivacyConsentCompleted,
    setMainAppEntered,
    setDataCollectionStarted,
  } = useStartupFlowStore();

  const privacyConsentStore = usePrivacyConsentStore();

  // 初始化启动流程
  useEffect(() => {
    initializeStartupFlow();
  }, []);

  // 监听阶段变化
  useEffect(() => {
    if (isInitialized) {
      handlePhaseChange();
    }
  }, [currentPhase, isInitialized]);

  // 监听键盘快捷键（开发模式）
  useEffect(() => {
    if (!isDevelopment()) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+P 显示隐私调试面板
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowPrivacyDebugPanel(prev => !prev);
      }
      // Ctrl+Shift+D 显示通用调试面板
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugPanel(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initializeStartupFlow = async () => {
    try {
      console.log('🚀 开始应用启动流程...');

      // 初始化开发者工具
      if (isDevelopment()) {
        console.log('🔧 开发模式：初始化开发者工具');
        devToolsManager.logEnvironmentInfo();
        devToolsManager.enableDebugMode();

        // 添加快捷键显示调试面板
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            event.preventDefault();
            setShowDebugPanel(prev => !prev);
            console.log('🔧 调试面板切换:', !showDebugPanel);
          }
        };

        document.addEventListener('keydown', handleKeyDown);
      }

      // 重置错误状态
      setError(null);
      resetRetryCount();

      // 初始化安全配置
      console.log('🔐 初始化安全配置...');
      const securityConfig = SecurityConfigManager.getInstance();
      await securityConfig.initialize();
      console.log('✅ 安全配置初始化完成');

      // 检查本地激活状态（不阻塞启动流程）
      console.log('🔍 检查本地激活状态...');
      await checkLocalActivationStatus();
      console.log('✅ 激活状态检查完成');

      // 开始启动流程：阶段1 - 版本检查和公告显示
      setCurrentPhase('version-check');
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ 启动流程初始化失败:', error);
      const errorMessage = error instanceof Error ? error.message : '初始化失败';
      setError(errorMessage);
      onError(errorMessage);
    }
  };

  const checkLocalActivationStatus = async (): Promise<void> => {
    try {
      // 从激活服务检查本地激活状态
      const activationInfo = activationService.checkActivationStatus();

      console.log('本地激活状态检查结果:', {
        isActivated: activationInfo.isActivated,
        isExpired: activationInfo.isExpired,
        needsActivation: activationInfo.needsActivation,
        expiryDate: activationInfo.expiryDate?.toISOString(),
      });

      if (activationInfo.isActivated && !activationInfo.isExpired) {
        // 激活有效，更新状态
        const remainingDays = activationInfo.expiryDate ?
          Math.ceil((activationInfo.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
          undefined;

        setActivationStatus({
          isValid: true,
          isActivated: true,
          expiresAt: activationInfo.expiryDate?.toISOString(),
          activatedAt: new Date().toISOString(),
          remainingDays,
        });

        // 标记为非首次启动
        updateUserSettings({ isFirstLaunch: false });
        setActivationVerified(true);

        console.log('✅ 检测到有效激活状态，已更新状态管理器');
      } else if (activationInfo.isExpired) {
        // 激活已过期
        setActivationStatus({
          isValid: false,
          isActivated: false,
          expiresAt: activationInfo.expiryDate?.toISOString(),
        });
        updateUserSettings({ isFirstLaunch: false });
        console.log('⚠️ 检测到过期激活状态');
      } else {
        // 未激活或无效
        console.log('ℹ️ 未检测到有效激活状态');
      }
    } catch (error) {
      console.warn('检查本地激活状态失败:', error);
      // 检查失败不应阻止启动流程
    }
  };

  /**
   * 处理启动流程阶段变化
   * 根据当前阶段执行相应的处理逻辑，协调整个应用的启动流程
   */
  const handlePhaseChange = () => {
    console.log(`🔄 进入启动阶段: ${currentPhase}`);

    switch (currentPhase) {
      case 'version-check':
        // 版本检查阶段由VersionChecker组件处理
        // 版本检查完成后会自动显示公告
        break;
      case 'first-launch-detection':
        handleFirstLaunchDetection();
        break;
      case 'privacy-consent':
        handlePrivacyConsentPhase();
        break;
      case 'activation-verification':
        handleActivationVerificationPhase();
        break;
      case 'main-app':
        handleMainAppPhase();
        break;
      case 'data-collection':
        handleDataCollectionPhase();
        break;
      case 'completed':
        handleStartupComplete();
        break;
    }
  };

  const handleFirstLaunchDetection = () => {
    console.log('🔍 开始首次使用检测...');

    // 检查隐私政策同意状态
    const needsPrivacyConsent = shouldShowPrivacyConsent();
    const isFirstTime = privacyConsentStore.isFirstLaunch || !privacyConsentStore.hasCompletedPrivacySetup;

    console.log('首次使用检测结果:', {
      isFirstLaunch: privacyConsentStore.isFirstLaunch,
      hasCompletedPrivacySetup: privacyConsentStore.hasCompletedPrivacySetup,
      hasAcceptedPrivacyPolicy: privacyConsentStore.hasAcceptedPrivacyPolicy,
      hasAcceptedUserAgreement: privacyConsentStore.hasAcceptedUserAgreement,
      hasAcceptedDataCollection: privacyConsentStore.hasAcceptedDataCollection,
      needsPrivacyConsent,
      isFirstTime,
    });

    setIsFirstLaunch(isFirstTime);
    setFirstLaunchDetected(true);

    // 无论是否首次使用，都要检查隐私政策同意状态
    if (needsPrivacyConsent) {
      console.log('📋 需要隐私政策同意，进入隐私政策同意阶段');
      console.log('📋 下一阶段: privacy-consent');
      setCurrentPhase('privacy-consent');
    } else {
      console.log('✅ 隐私政策已同意，直接进入激活验证阶段');
      console.log('📋 下一阶段: activation-verification');
      setPrivacyConsentCompleted(true);
      setCurrentPhase('activation-verification');
    }
  };

  const handlePrivacyConsentPhase = () => {
    console.log('📋 进入隐私政策和用户协议阶段');

    // 检查是否需要显示隐私政策同意界面
    const needsPrivacyConsent = shouldShowPrivacyConsent();
    const shouldExit = shouldExitApplication();

    if (shouldExit) {
      console.log('🚫 用户撤销了必要同意，应用将退出');
      handlePrivacyConsentReject();
      return;
    }

    if (needsPrivacyConsent) {
      console.log('📋 显示隐私政策同意界面');
      setShowPrivacyConsent(true);
    } else {
      console.log('✅ 隐私政策已同意，进入激活验证阶段');
      setPrivacyConsentCompleted(true);
      setCurrentPhase('activation-verification');
    }
  };

  const handleActivationVerificationPhase = () => {
    console.log('🔐 开始强制激活码检测和验证...');
    console.log('📋 当前阶段: activation-verification');
    console.log('👤 用户类型:', isFirstLaunch ? '首次使用' : '非首次使用');

    // 强制检查激活码状态，无论是否首次使用
    const activationInfo = activationService.checkActivationStatus();

    console.log('激活码状态检查结果:', {
      isActivated: activationInfo.isActivated,
      isExpired: activationInfo.isExpired,
      needsActivation: activationInfo.needsActivation,
      expiryDate: activationInfo.expiryDate?.toISOString(),
      expiredReason: activationInfo.expiredReason,
    });

    // 设置激活状态到store
    setActivationStatus({
      ...activationInfo,
      isValid: activationInfo.isActivated && !activationInfo.isExpired
    });

    if (activationInfo.needsActivation || !activationInfo.isActivated) {
      console.log('❌ 需要激活码验证 - 原因:', activationInfo.expiredReason || '未激活');
      console.log('🔧 显示激活码验证器界面');
      setShowActivationValidator(true);
    } else if (activationInfo.isExpired) {
      console.log('⏰ 激活码已过期 - 原因:', activationInfo.expiredReason);
      console.log('🔧 显示激活码验证器界面');
      setShowActivationValidator(true);
    } else {
      console.log('✅ 激活码有效，进入主应用');
      setActivationVerified(true);
      setCurrentPhase('main-app');
    }
  };

  const handleMainAppPhase = () => {
    console.log('🏠 进入主页面阶段');
    console.log('📊 当前状态检查:', {
      versionCheckCompleted,
      firstLaunchDetected,
      privacyConsentCompleted,
      activationVerified,
      dataCollectionStarted
    });

    // 标记主应用已进入
    setMainAppEntered(true);

    // 启动数据收集（在后台进行）
    console.log('📊 启动后台数据收集');
    setCurrentPhase('data-collection');
  };

  const handleDataCollectionPhase = async () => {
    console.log('📊 开始数据收集阶段');

    try {
      // 检查隐私政策同意状态
      if (!privacyConsentStore.canCollectData()) {
        console.log('🚫 用户未同意数据收集，跳过数据收集');
        setDataCollectionStarted(true);
        setCurrentPhase('completed');
        return;
      }

      // 初始化并启动用户行为服务
      const behaviorService = OptimizedUserBehaviorService.getInstance();
      await behaviorService.initialize();
      await behaviorService.recordAppLaunch();

      console.log('✅ 数据收集启动成功');
      setDataCollectionStarted(true);
      setCurrentPhase('completed');

    } catch (error) {
      console.warn('⚠️ 数据收集启动失败，但不影响应用正常使用:', error);
      setDataCollectionStarted(true);
      setCurrentPhase('completed');
    }
  };

  const handleVersionCheckComplete = async (result: any) => {
    console.log('✅ 版本检查完成，结果:', result);
    setVersionCheckCompleted(true);
    
    // 确保公告已标记为显示
    setAnnouncementDisplayed(true);
    
    // 在公告显示完成后，安全地进入下一阶段
    setTimeout(() => {
      proceedToNextPhase();
    }, 0);
  };

  const handleVersionCheckError = async (error: string) => {
    console.error('❌ 版本检查失败:', error);

    // 根据要求，版本检查失败就立刻提示用户并退出，不能重试
    setError(error);

    console.log('🚫 版本检查失败，应用将退出');

    // 调用错误回调，让上层组件处理
    onError(`版本检查失败: ${error}\n\n请检查网络连接后重新启动应用`);

    // 延迟退出应用
    setTimeout(async () => {
      try {
        const { exit } = await import('@tauri-apps/plugin-process');
        await exit(1);
      } catch (exitError) {
        console.error('退出应用失败:', exitError);
        // 如果 Tauri API 不可用，尝试关闭窗口
        window.close();
      }
    }, 3000);
  };


  const proceedToNextPhase = () => {
    // 版本检查和公告显示完成后，进入首次使用检测
    setCurrentPhase('first-launch-detection');
  };

  const handlePrivacyConsentAccept = () => {
    console.log('✅ 用户同意隐私政策和用户协议');
    setShowPrivacyConsent(false);
    setPrivacyConsentCompleted(true);

    // 首次使用且同意条款后，进入激活验证阶段
    setCurrentPhase('activation-verification');
  };

  const handlePrivacyConsentReject = async () => {
    console.log('🚫 用户拒绝隐私政策，应用将退出');
    setShowPrivacyConsent(false);

    try {
      // 使用动态导入获取 Tauri API
      const { exit } = await import('@tauri-apps/plugin-process');
      await exit(0);
    } catch (error) {
      console.error('退出应用失败:', error);
      // 如果 Tauri API 不可用，尝试关闭窗口
      window.close();
    }
  };


  const handleActivationSuccess = (newActivationStatus: any) => {
    console.log('✅ 激活成功:', newActivationStatus);
    console.log('📊 激活成功时的状态:', {
      currentPhase,
      versionCheckCompleted,
      firstLaunchDetected,
      privacyConsentCompleted,
      activationVerified,
      dataCollectionStarted
    });

    setActivationStatus(newActivationStatus);
    setShowActivationValidator(false);
    setActivationVerified(true);

    // 激活成功后直接进入主应用
    console.log('🏠 激活验证完成，准备进入主应用');
    console.log('🔄 设置当前阶段为 main-app');

    // 添加延迟以确保状态更新完成
    setTimeout(() => {
      console.log('🔄 执行阶段切换到 main-app');
      setCurrentPhase('main-app');
      console.log('✅ 阶段切换完成，当前阶段:', 'main-app');
    }, 100);
  };

  const handleActivationError = (error: string) => {
    console.error('❌ 激活验证失败:', error);
    setError(error);

    // 保持在激活页面，不退出应用
    console.log('⚠️ 激活验证失败，保持在激活页面允许重试');

    // 确保激活验证器保持显示状态
    setShowActivationValidator(true);

    // 不调用错误回调，避免上层组件处理错误导致页面跳转
    // onError 回调可能会导致应用退出或页面跳转，这里注释掉
    // onError(`激活验证失败: ${error}`);
  };

  const handleStartupComplete = () => {
    console.log('🎉 启动流程完成');
    onComplete();
  };

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 'version-check':
        return (
          <UnifiedLoadingVersionChecker
            onComplete={handleVersionCheckComplete}
            onError={handleVersionCheckError}
          />
        );

      case 'first-launch-detection':
        // 这个阶段在后台进行，不需要UI
        return null;

      case 'privacy-consent':
        // 隐私政策同意由对话框处理
        return null;

      case 'activation-verification':
        return renderActivationPhase();

      case 'main-app':
        // 这个阶段在后台进行，不需要UI
        return null;

      case 'data-collection':
        // 这个阶段在后台进行，不需要UI
        return null;

      case 'completed':
        // 启动完成，不需要UI
        return null;

      default:
        return null;
    }
  };

  const renderActivationPhase = () => {
    // 强制激活验证：无论什么情况都需要显示激活验证器
    if (showActivationValidator) {
      return (
        <ActivationPage
          onSuccess={handleActivationSuccess}
          onError={handleActivationError}
          onSkip={() => {
            // 强制激活验证模式下不允许跳过，直接退出应用
            console.log('🚫 强制激活验证模式下不允许跳过，应用将退出');
            handleActivationError('用户跳过激活验证');
          }}
        />
      );
    }

    // 如果不需要显示激活验证器，说明激活已通过，直接进入下一阶段
    return null;
  };

  return (
    <div className={styles.container}>
      {/* 主要启动流程界面 */}
      {renderCurrentPhase()}


      {/* 隐私政策同意对话框 */}
      <PrivacyConsentDialog
        open={showPrivacyConsent}
        onAccept={handlePrivacyConsentAccept}
        onReject={handlePrivacyConsentReject}
      />

      {/* 调试面板（仅开发模式） */}
      {isDevelopment() && showDebugPanel && (
        <DebugPanel onClose={() => setShowDebugPanel(false)} />
      )}

      {/* 隐私调试面板（仅开发模式） */}
      {isDevelopment() && showPrivacyDebugPanel && (
        <PrivacyDebugPanel onClose={() => setShowPrivacyDebugPanel(false)} />
      )}
    </div>
  );
};

export default StartupFlowManager;