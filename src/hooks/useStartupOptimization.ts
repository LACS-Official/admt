/**
 * 启动优化 Hook
 * 提供启动流程优化相关的状态管理和方法
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { preloadService } from '../services/preloadService';
import { logService } from '../services/logService';

interface StartupOptimizationState {
  isPreloading: boolean;
  preloadProgress: number;
  preloadStatus: string;
  isTransitioning: boolean;
  startupPhase: string;
  performanceMetrics: {
    startTime: number;
    preloadTime?: number;
    transitionTime?: number;
    totalTime?: number;
  };
}

interface UseStartupOptimizationReturn extends StartupOptimizationState {
  startPreload: () => Promise<void>;
  startTransition: () => Promise<void>;
  completeStartup: () => void;
  updatePhase: (phase: string) => void;
  getMetrics: () => StartupOptimizationState['performanceMetrics'];
}

export const useStartupOptimization = (): UseStartupOptimizationReturn => {
  const [state, setState] = useState<StartupOptimizationState>({
    isPreloading: false,
    preloadProgress: 0,
    preloadStatus: '准备中',
    isTransitioning: false,
    startupPhase: 'initializing',
    performanceMetrics: {
      startTime: Date.now(),
    },
  });

  const metricsRef = useRef(state.performanceMetrics);

  // 更新性能指标
  const updateMetrics = useCallback((updates: Partial<StartupOptimizationState['performanceMetrics']>) => {
    metricsRef.current = { ...metricsRef.current, ...updates };
    setState(prev => ({
      ...prev,
      performanceMetrics: metricsRef.current,
    }));
  }, []);

  // 开始预加载
  const startPreload = useCallback(async () => {
    logService.info('开始启动优化预加载', 'useStartupOptimization');
    
    setState(prev => ({
      ...prev,
      isPreloading: true,
      preloadProgress: 0,
      preloadStatus: '初始化预加载',
    }));

    const preloadStartTime = Date.now();

    try {
      await preloadService.startPreload((progress, status) => {
        setState(prev => ({
          ...prev,
          preloadProgress: Math.min(progress, 100),
          preloadStatus: status,
        }));
      });

      const preloadTime = Date.now() - preloadStartTime;
      updateMetrics({ preloadTime });

      setState(prev => ({
        ...prev,
        isPreloading: false,
        preloadProgress: 100,
        preloadStatus: '预加载完成',
      }));

      logService.info(`预加载完成，耗时: ${preloadTime}ms`, 'useStartupOptimization');
    } catch (error) {
      logService.error('预加载失败', 'useStartupOptimization', error);
      
      setState(prev => ({
        ...prev,
        isPreloading: false,
        preloadStatus: '预加载失败，继续启动',
      }));
    }
  }, [updateMetrics]);

  // 开始过渡动画
  const startTransition = useCallback(async () => {
    logService.info('开始启动过渡动画', 'useStartupOptimization');
    
    const transitionStartTime = Date.now();
    
    setState(prev => ({
      ...prev,
      isTransitioning: true,
    }));

    // 等待过渡动画完成
    await new Promise(resolve => setTimeout(resolve, 800));

    const transitionTime = Date.now() - transitionStartTime;
    updateMetrics({ transitionTime });

    setState(prev => ({
      ...prev,
      isTransitioning: false,
    }));

    logService.info(`过渡动画完成，耗时: ${transitionTime}ms`, 'useStartupOptimization');
  }, [updateMetrics]);

  // 完成启动流程
  const completeStartup = useCallback(() => {
    const totalTime = Date.now() - metricsRef.current.startTime;
    updateMetrics({ totalTime });

    logService.info('启动流程完成', 'useStartupOptimization', {
      totalTime,
      preloadTime: metricsRef.current.preloadTime,
      transitionTime: metricsRef.current.transitionTime,
    });

    // 记录性能指标
    if (totalTime > 5000) {
      logService.warning('启动时间较长', 'useStartupOptimization', {
        totalTime,
        metrics: metricsRef.current,
      });
    }
  }, [updateMetrics]);

  // 更新启动阶段
  const updatePhase = useCallback((phase: string) => {
    setState(prev => ({
      ...prev,
      startupPhase: phase,
    }));
    
    logService.debug(`启动阶段更新: ${phase}`, 'useStartupOptimization');
  }, []);

  // 获取性能指标
  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  // 监听设备性能，在低性能设备上调整动画
  useEffect(() => {
    const checkPerformance = () => {
      // 检查设备性能指标
      const connection = (navigator as any).connection;
      const memory = (performance as any).memory;
      
      let isLowPerformance = false;
      
      // 检查网络连接
      if (connection && connection.effectiveType && 
          ['slow-2g', '2g'].includes(connection.effectiveType)) {
        isLowPerformance = true;
      }
      
      // 检查内存使用情况
      if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        isLowPerformance = true;
      }
      
      // 检查硬件并发数
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        isLowPerformance = true;
      }

      if (isLowPerformance) {
        logService.info('检测到低性能设备，启用性能优化模式', 'useStartupOptimization');
        
        // 可以在这里设置性能优化标志
        document.documentElement.setAttribute('data-performance-mode', 'low');
      }
    };

    checkPerformance();
  }, []);

  return {
    ...state,
    startPreload,
    startTransition,
    completeStartup,
    updatePhase,
    getMetrics,
  };
};