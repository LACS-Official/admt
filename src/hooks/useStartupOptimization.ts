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
  getPerformanceMetrics: () => StartupOptimizationState['performanceMetrics'];
  isLowPerformanceDevice: boolean;
  optimizationMode: 'low' | 'high';
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

  const [isLowPerformance, setIsLowPerformance] = useState(false); // 添加低性能设备状态
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
      const deviceMemory = (navigator as any).deviceMemory;
      
      let isLowPerformance = false;
      let performanceScore = 100; // 默认性能分数
      
      // 检查网络连接 (最多扣30分)
      if (connection) {
        if (connection.effectiveType) {
          switch (connection.effectiveType) {
            case 'slow-2g': performanceScore -= 30; break;
            case '2g': performanceScore -= 25; break;
            case '3g': performanceScore -= 15; break;
            case '4g': performanceScore -= 5; break;
          }
        }
        
        if (connection.saveData) {
          performanceScore -= 20; // 省流模式
        }
      }
      
      // 检查内存使用情况 (最多扣30分)
      if (memory) {
        const memoryUsageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (memoryUsageRatio > 0.9) performanceScore -= 30;
        else if (memoryUsageRatio > 0.8) performanceScore -= 20;
        else if (memoryUsageRatio > 0.7) performanceScore -= 10;
      }
      
      // 检查设备内存 (最多扣20分)
      if (deviceMemory) {
        if (deviceMemory < 2) performanceScore -= 20;
        else if (deviceMemory < 4) performanceScore -= 10;
      }
      
      // 检查硬件并发数 (最多扣20分)
      if (navigator.hardwareConcurrency) {
        if (navigator.hardwareConcurrency < 2) performanceScore -= 20;
        else if (navigator.hardwareConcurrency < 4) performanceScore -= 10;
      }
      
      // 检查屏幕分辨率 (最多扣10分)
      const screenPixelRatio = window.devicePixelRatio || 1;
      const screenWidth = window.screen.width * screenPixelRatio;
      const screenHeight = window.screen.height * screenPixelRatio;
      const totalPixels = screenWidth * screenHeight;
      
      if (totalPixels > 3840 * 2160) { // 超过4K分辨率
        performanceScore -= 10;
      }
      
      // 性能分数低于60分被认为是低性能设备
      isLowPerformance = performanceScore < 60;

      if (isLowPerformance) {
        logService.info('检测到低性能设备，启用性能优化模式', 'useStartupOptimization', {
          performanceScore,
          factors: {
            connection: connection?.effectiveType,
            memoryUsage: memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) : 'unknown',
            deviceMemory,
            cpuCores: navigator.hardwareConcurrency,
            resolution: `${screenWidth}x${screenHeight}`
          }
        });
        
        // 设置性能优化标志
        document.documentElement.setAttribute('data-performance-mode', 'low');
        
        // 可以在这里设置其他性能优化标志
        document.documentElement.setAttribute('data-performance-score', performanceScore.toString());
        
        // 更新状态
        setIsLowPerformance(true);
        setState(prev => ({
          ...prev,
          startupPhase: 'low-performance'
        }));
      } else {
        // 高性能设备
        document.documentElement.setAttribute('data-performance-mode', 'high');
        document.documentElement.setAttribute('data-performance-score', performanceScore.toString());
        
        // 更新状态
        setIsLowPerformance(false);
        setState(prev => ({
          ...prev,
          startupPhase: 'high-performance'
        }));
      }
    };

    checkPerformance();
    
    // 监听网络变化
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', checkPerformance);
      return () => {
        connection.removeEventListener('change', checkPerformance);
      };
    }
  }, []);

  // 返回启动优化相关的状态和方法
  return {
    ...state,
    startPreload,
    startTransition,
    completeStartup,
    updatePhase,
    getMetrics,
    getPerformanceMetrics: getMetrics, // 添加别名以保持兼容性
    isLowPerformanceDevice: isLowPerformance, // 使用状态值
    optimizationMode: isLowPerformance ? 'low' : 'high' // 使用状态值
  };
};