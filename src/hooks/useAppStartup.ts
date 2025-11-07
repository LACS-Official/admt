import { useEffect, useState, useCallback, useRef } from "react";
import { useAppStore } from "../stores/appStore";
import { useStartupFlowStore } from "../stores/startupFlowStore";
import { usePrivacyConsentStore } from "../stores/privacyConsentStore";
import { useStartupOptimization } from "./useStartupOptimization";
import { logService } from "../services/logService";
import { adbToolsManager } from "../services/adbToolsManager";
import { activationService } from "../services/activationService";
import { preloadService } from "../services/preloadService";
import { SecurityConfigManager } from "../config/securityConfig";
import { unifiedVersionService } from "../services/unifiedVersionService";

export const useAppStartup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartupFlow, setShowStartupFlow] = useState(true);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionStage, setTransitionStage] = useState<'start' | 'progress' | 'complete'>('start');

  const { initialize, config, setStatusBarMessage } = useAppStore();
  const { 
    currentPhase, 
    setCurrentPhase, 
    versionCheckResult,
    setVersionCheckResult, 
    setVersionCheckCompleted,
    markPrivacyConsentCompleted,
    markActivationCompleted
  } = useStartupFlowStore();
  const { 
    hasCompletedPrivacySetup, 
    shouldExitApp
  } = usePrivacyConsentStore();
  
  const {
    startPreload,
    completeStartup,
    getPerformanceMetrics
  } = useStartupOptimization();
  
  const initializationRef = useRef(false);
  const versionCheckRef = useRef(false);
  const preloadRef = useRef(false);
  const securityConfigRef = useRef(false);
  const activationCheckRef = useRef(false);
  const adbInitRef = useRef(false);

  // 禁用F5刷新功能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 禁用F5刷新和Ctrl+R刷新
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || 
          (event.ctrlKey && event.shiftKey && event.key === 'R')) {
        event.preventDefault();
        event.stopPropagation();
        logService.info('用户尝试刷新页面，已被拦截', 'App');
        return;
      }
      
      // 禁用F3和F7以及其他功能键
      if (event.key.startsWith('F') && event.key.length >= 2 && event.key.length <= 3) {
        const fKeyNum = parseInt(event.key.substring(1));
        // 禁用F1-F12所有功能键（除了F5，因为上面已经处理）
        if (fKeyNum >= 1 && fKeyNum <= 12 && fKeyNum !== 5) {
          // 特别处理F3和F7
          if (fKeyNum === 3 || fKeyNum === 7) {
            event.preventDefault();
            event.stopPropagation();
            logService.info(`用户尝试使用F${fKeyNum}快捷键，已被拦截`, 'App');
            return;
          }
          
          // 其他F键也在这里统一处理
          event.preventDefault();
          event.stopPropagation();
          logService.info(`用户尝试使用F${fKeyNum}快捷键，已被拦截`, 'App');
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // 监听启动流程状态变化
  useEffect(() => {
    if (currentPhase === 'activation-verification' && !showStartupFlow) {
      console.log('🔄 检测到需要激活验证，重新显示启动流程');
      setShowStartupFlow(true);
    }
  }, [currentPhase, showStartupFlow]);

  // 监听应用退出状态
  useEffect(() => {
    if (shouldExitApp) {
      console.log('⚠️ 用户拒绝同意必要条款，应用将退出');
      handleStartupFlowError('用户拒绝同意必要条款，应用将退出');
    }
  }, [shouldExitApp]);

  // 监听过渡动画状态
  useEffect(() => {
    if (showTransition) {
      const timer = setTimeout(() => {
        setTransitionStage('progress');
        
        setTimeout(() => {
          setTransitionStage('complete');
          setTimeout(() => {
              setShowTransition(false);
              // 检查是否有版本检查结果，如果没有更新则允许进入主页面
              const hasUpdate = versionCheckResult?.hasUpdate;
              if (currentPhase !== 'version-check' || !hasUpdate) {
                console.log('✅ 允许进入主页面');
                setShowStartupFlow(false);
                completeStartup();
              } else {
                console.log('⚠️ 检测到新版本，停留在版本检查阶段，不进入主页面');
                // 保持在版本检查阶段，不隐藏启动流程
              }
            }, 500);
        }, 1000);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showTransition, completeStartup, currentPhase, versionCheckResult]);

  // 启动流程初始化
  const initializeStartupFlow = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;
    
    try {
      console.log('🚀 初始化启动流程...');
      startPreload();
      
      // 并行执行初始化任务
      const initTasks = [
        // 预加载资源
        (async () => {
          try {
            console.log('📦 预加载资源...');
            await preloadService.preloadEssentialResources();
            preloadRef.current = true;
            console.log('✅ 资源预加载完成');
          } catch (error) {
            console.error('❌ 资源预加载失败:', error);
          }
        })(),
        
        // 安全配置初始化
        (async () => {
          try {
            console.log('🔒 初始化安全配置...');
            await SecurityConfigManager.initialize();
            securityConfigRef.current = true;
            console.log('✅ 安全配置初始化完成');
          } catch (error) {
            console.error('❌ 安全配置初始化失败:', error);
            throw new Error('安全配置初始化失败，无法继续启动');
          }
        })(),
        
        // 版本检查
        (async () => {
          try {
            console.log('🔍 检查应用版本...');
            await unifiedVersionService.checkVersionSync();
            versionCheckRef.current = true;
            console.log('✅ 版本检查完成');
          } catch (error) {
            console.error('❌ 版本检查失败:', error);
          }
        })(),

        // 激活状态检查
        (async () => {
          try {
            console.log('🔑 检查激活状态...');
            const isActivated = activationService.isActivated;
            activationCheckRef.current = true;
            
            if (isActivated) {
              console.log('✅ 应用已激活');
              markActivationCompleted();
            } else {
              console.log('⚠️ 应用未激活，需要激活验证');
              setStatusBarMessage({
                message: '应用未激活，需要激活验证',
                type: 'warning'
              });
              setCurrentPhase('activation-verification');
            }
          } catch (error) {
            console.error('❌ 激活状态检查失败:', error);
          }
        })(),
        
        // ADB工具初始化
        (async () => {
          try {
            console.log('🔧 初始化ADB工具...');
            await adbToolsManager.initialize();
            adbInitRef.current = true;
            console.log('✅ ADB工具初始化完成');
          } catch (error) {
            console.error('❌ ADB工具初始化失败:', error);
          }
        })()
      ];
      
      await Promise.all(initTasks);
      
      if (!securityConfigRef.current) {
        throw new Error('安全配置初始化失败，无法继续启动');
      }
      
      console.log('🎯 启动流程初始化完成');
      
      // 根据当前状态决定进入哪个阶段
      if (!hasCompletedPrivacySetup) {
        console.log('📋 需要完成隐私政策设置，进入隐私政策同意阶段');
        setCurrentPhase('privacy-consent');
      } else if (!activationCheckRef.current || !activationService.isActivated) {
        console.log('🔑 需要激活验证，进入激活验证阶段');
        setCurrentPhase('activation-verification');
      } else {
        // 检查版本是否最新
        console.log('🔄 检查版本是否最新...');
        try {
          const versionCheckResult = await unifiedVersionService.checkForUpdates();
          setVersionCheckResult(versionCheckResult);
          setVersionCheckCompleted(true);
          
          if (!versionCheckResult.hasUpdate) {
            console.log('✅ 版本已是最新，所有检查通过，进入主应用');
            handleStartupFlowComplete();
          } else {
            console.log('⚠️ 检测到新版本，进入版本检查阶段');
            setCurrentPhase('version-check');
            // 不再继续执行后续流程，用户必须处理更新
            // 确保不会调用 handleStartupFlowComplete
            //不允许进入主页面‘’
            
            return;
          }
        } catch (error) {
          console.error('❌ 版本检查失败:', error);
          console.log('⚠️ 版本检查失败，进入版本检查阶段');
          setCurrentPhase('version-check');
          // 不再继续执行后续流程，用户必须处理版本检查问题
          // 确保不会调用 handleStartupFlowComplete
          return;
        }
      }
    } catch (error) {
      console.error('❌ 启动流程初始化失败:', error);
      handleStartupFlowError(`启动流程初始化失败: ${error}`);
    }
  }, [
    startPreload,
    markActivationCompleted,
    setCurrentPhase,
    setVersionCheckResult,
    setVersionCheckCompleted,
    hasCompletedPrivacySetup,
    setStatusBarMessage
  ]);

  const handleStartupFlowComplete = useCallback(() => {
    logService.info('启动流程完成', 'App');
    
    const metrics = getPerformanceMetrics();
    logService.info('启动流程性能指标', 'App', metrics);
    
    setShowTransition(true);
  }, [getPerformanceMetrics]);

  const handleStartupFlowError = useCallback(async (error: string) => {
    logService.error('启动流程失败', 'App', error);
    setError(error);
    
    setIsLoading(false);
    setShowErrorNotification(true);
    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(async () => {
            try {
              const { exit } = await import('@tauri-apps/plugin-process');
              await exit(1);
            } catch (exitError) {
              console.error('退出应用失败:', exitError);
              window.close();
            }
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // 处理隐私政策同意
  const handlePrivacyConsent = useCallback(() => {
    console.log('隐私政策已同意');
    markPrivacyConsentCompleted();
    setCurrentPhase('activation-verification');
  }, [setCurrentPhase, markPrivacyConsentCompleted]);

  // 处理激活验证成功
  const handleActivationSuccess = useCallback((activationStatus: any) => {
    console.log('激活验证成功:', activationStatus);
    
    console.log('🔄 激活成功后检查版本是否最新...');
    unifiedVersionService.checkForUpdates()
      .then((versionCheckResult) => {
        setVersionCheckResult(versionCheckResult);
        setVersionCheckCompleted(true);
        
        if (!versionCheckResult.hasUpdate) {
          console.log('✅ 版本已是最新，进入数据收集同意阶段');
          setCurrentPhase('data-collection');
        } else {
          console.log('⚠️ 检测到新版本，进入版本检查阶段');
          setCurrentPhase('version-check');
          // 不再继续执行后续流程，用户必须处理更新
          // 这里不需要return，因为已经设置了phase，后续流程会被阻止
        }
      })
      .catch((error) => {
        console.error('❌ 版本检查失败:', error);
        console.log('⚠️ 版本检查失败，进入版本检查阶段');
        setCurrentPhase('version-check');
        // 不再继续执行后续流程，用户必须处理版本检查问题
        // 这里不需要return，因为已经设置了phase，后续流程会被阻止
      });
      
    // 重要：在异步操作开始后立即返回，确保不会继续执行后续同步代码
    return;
  }, [setCurrentPhase, setVersionCheckResult, setVersionCheckCompleted]);

  // 处理数据收集同意
  const handleDataCollectionConsent = useCallback((consent: boolean) => {
    console.log(`📊 用户数据收集同意: ${consent ? '同意' : '拒绝'}`);
    
    unifiedVersionService.checkForUpdates()
      .then((versionCheckResult) => {
        setVersionCheckResult(versionCheckResult);
        setVersionCheckCompleted(true);
        
        if (!versionCheckResult.hasUpdate) {
          console.log('✅ 版本已是最新，所有检查通过，进入主应用');
          handleStartupFlowComplete();
        } else {
          console.log('⚠️ 检测到新版本，进入版本检查阶段');
          setCurrentPhase('version-check');
          // 不再继续执行后续流程，用户必须处理更新
          // 这里不需要return，因为已经设置了phase，后续流程会被阻止
        }
      })
      .catch((error) => {
        console.error('❌ 版本检查失败:', error);
        console.log('⚠️ 版本检查失败，进入版本检查阶段');
        setCurrentPhase('version-check');
        // 不再继续执行后续流程，用户必须处理版本检查问题
        // 这里不需要return，因为已经设置了phase，后续流程会被阻止
      });
      
    // 重要：在异步操作开始后立即返回，确保不会继续执行后续同步代码
    return;
  }, [setCurrentPhase, setVersionCheckResult, setVersionCheckCompleted, handleStartupFlowComplete]);

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logService.info('开始初始化ADMT应用...', 'App');

        // 1. 执行React错误检查和修复
        logService.info('执行React错误检查和修复...', 'App');
        try {
          const { ReactErrorFixer } = await import("../utils/reactErrorFix");
          const checkResults = await ReactErrorFixer.performAllChecks();
          if (!checkResults.success) {
            logService.warning('发现React错误问题，尝试自动修复', 'App', { issues: checkResults.issues });
            await ReactErrorFixer.autoFix();
            logService.info('React错误自动修复完成', 'App');
          } else {
            logService.info('React错误检查通过', 'App');
          }
        } catch (fixError) {
          logService.warning('React错误修复失败，继续启动', 'App', fixError);
        }

        // 2. 初始化应用状态
        initialize();

        // 3. 记录设备检测配置状态
        logService.info(`设备检测配置 - 自动检测: ${config.autoDetectDevices}, 扫描间隔: ${config.scanInterval}ms`, 'App');

        // 4. 快速初始化过程
        await new Promise(resolve => setTimeout(resolve, 200));

        logService.info('ADMT 应用初始化完成', 'App');
        setIsLoading(false);
        
        // 5. 初始化启动流程
        await initializeStartupFlow();
      } catch (err) {
        logService.error('应用初始化失败', 'App', err);
        setError('应用初始化失败，请重试');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [initialize, initializeStartupFlow, config.autoDetectDevices, config.scanInterval]);

  return {
    isLoading,
    error,
    showStartupFlow,
    showErrorNotification,
    countdown,
    showTransition,
    currentPhase,
    handlePrivacyConsent,
    handleActivationSuccess,
    handleDataCollectionConsent,
    handleStartupFlowError,
    handleStartupFlowComplete
  };
};