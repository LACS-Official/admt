/**
 * 预加载服务
 * 在启动流程中预加载主页面的关键资源，减少白屏时间
 */

import { logService } from './logService';

interface PreloadResource {
  type: 'component' | 'image' | 'style' | 'data';
  path: string;
  priority: 'high' | 'medium' | 'low';
  preload?: () => Promise<any>;
}

class PreloadService {
  private static instance: PreloadService;
  private preloadedResources = new Map<string, any>();
  private preloadPromises = new Map<string, Promise<any>>();
  private isPreloading = false;

  static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService();
    }
    return PreloadService.instance;
  }

  private constructor() {}

  /**
   * 定义需要预加载的资源
   */
  private getPreloadResources(): PreloadResource[] {
    return [
      // 高优先级：主页面组件
      {
        type: 'component',
        path: 'MainContent',
        priority: 'high',
        preload: () => import('../components/MainContent/MainContent'),
      },
      {
        type: 'component',
        path: 'HomePage',
        priority: 'high',
        preload: () => import('../components/Home/HomePage'),
      },
      {
        type: 'component',
        path: 'DeviceOverviewCard',
        priority: 'high',
        preload: () => import('../components/DeviceInfo/DeviceOverviewCard'),
      },

      // 中优先级：常用组件
      {
        type: 'component',
        path: 'AdbZonePanel',
        priority: 'medium',
        preload: () => import('../components/AdbTools/AdbZonePanel'),
      },
      {
        type: 'component',
        path: 'SettingsPanel',
        priority: 'medium',
        preload: () => import('../components/Settings/SettingsPanel'),
      },

      // 图片资源
      {
        type: 'image',
        path: 'assets/icons/devices/',
        priority: 'medium',
        preload: () => this.preloadDeviceIcons(),
      },

      // 数据服务
      {
        type: 'data',
        path: 'deviceService',
        priority: 'high',
        preload: () => import('../services/deviceService'),
      },
      {
        type: 'data',
        path: 'adbToolsManager',
        priority: 'medium',
        preload: () => import('../services/adbToolsManager'),
      },
    ];
  }

  /**
   * 预加载必要资源（简化版）
   */
  async preloadEssentialResources(): Promise<void> {
    if (this.isPreloading) {
      logService.info('预加载已在进行中', 'PreloadService');
      return;
    }

    this.isPreloading = true;
    logService.info('开始预加载必要资源', 'PreloadService');

    const resources = this.getPreloadResources();
    const essentialResources = resources.filter(r => r.priority === 'high');

    try {
      // 只预加载高优先级资源
      logService.info(`预加载必要资源 (${essentialResources.length} 项)`, 'PreloadService');
      await this.preloadResourcesBatch(essentialResources);

      logService.info('必要资源预加载完成', 'PreloadService');
    } catch (error) {
      logService.error('预加载必要资源失败', 'PreloadService', error);
      throw error;
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 开始预加载资源
   */
  async startPreload(onProgress?: (progress: number, resource: string) => void): Promise<void> {
    if (this.isPreloading) {
      logService.info('预加载已在进行中', 'PreloadService');
      return;
    }

    this.isPreloading = true;
    logService.info('开始预加载关键资源', 'PreloadService');

    const resources = this.getPreloadResources();
    const highPriorityResources = resources.filter(r => r.priority === 'high');
    const mediumPriorityResources = resources.filter(r => r.priority === 'medium');
    const lowPriorityResources = resources.filter(r => r.priority === 'low');

    let completed = 0;
    const total = resources.length;

    try {
      // 第一阶段：预加载高优先级资源
      logService.info(`预加载高优先级资源 (${highPriorityResources.length} 项)`, 'PreloadService');
      await this.preloadResourcesBatch(highPriorityResources, (count) => {
        completed += count;
        const progress = (completed / total) * 100;
        onProgress?.(progress, '加载核心组件');
      });

      // 第二阶段：预加载中优先级资源
      logService.info(`预加载中优先级资源 (${mediumPriorityResources.length} 项)`, 'PreloadService');
      await this.preloadResourcesBatch(mediumPriorityResources, (count) => {
        completed += count;
        const progress = (completed / total) * 100;
        onProgress?.(progress, '加载扩展功能');
      });

      // 第三阶段：预加载低优先级资源（后台进行）
      if (lowPriorityResources.length > 0) {
        logService.info(`后台预加载低优先级资源 (${lowPriorityResources.length} 项)`, 'PreloadService');
        this.preloadResourcesBatch(lowPriorityResources, (count) => {
          completed += count;
          const progress = (completed / total) * 100;
          onProgress?.(progress, '优化用户体验');
        }).catch(error => {
          logService.warning('低优先级资源预加载失败', 'PreloadService', error);
        });
      }

      logService.info('关键资源预加载完成', 'PreloadService');
    } catch (error) {
      logService.error('预加载过程中发生错误', 'PreloadService', error);
      throw error;
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 批量预加载资源
   */
  private async preloadResourcesBatch(
    resources: PreloadResource[],
    onProgress?: (completedCount: number) => void
  ): Promise<void> {
    const promises = resources.map(async (resource) => {
      try {
        if (this.preloadedResources.has(resource.path)) {
          return this.preloadedResources.get(resource.path);
        }

        if (this.preloadPromises.has(resource.path)) {
          return await this.preloadPromises.get(resource.path);
        }

        if (resource.preload) {
          const promise = resource.preload();
          this.preloadPromises.set(resource.path, promise);
          
          const result = await promise;
          this.preloadedResources.set(resource.path, result);
          
          logService.debug(`预加载完成: `, 'PreloadService');
          return result;
        }
      } catch (error) {
        logService.warning(`预加载失败: `, 'PreloadService', error);
        // 预加载失败不应该阻止应用启动
        return null;
      }
    });

    // 使用 Promise.allSettled 确保即使部分资源失败也能继续
    const results = await Promise.allSettled(promises);
    const completedCount = results.filter(r => r.status === 'fulfilled').length;
    
    onProgress?.(completedCount);
  }

  /**
   * 预加载图片
   */
  private async preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * 预加载设备图标
   */
  private async preloadDeviceIcons(): Promise<void> {
    const iconPaths = [
      'assets/icons/devices/sys.gif',
      'assets/icons/devices/rec.gif',
      'assets/icons/devices/fastboot.gif',
      'assets/icons/devices/unauthorized.gif',
      'assets/icons/devices/offline.gif',
    ];

    const promises = iconPaths.map(path => 
      this.preloadImage(path).catch(() => null) // 忽略加载失败的图标
    );

    await Promise.allSettled(promises);
  }

  /**
   * 获取预加载的资源
   */
  getPreloadedResource<T = any>(path: string): T | null {
    return this.preloadedResources.get(path) || null;
  }

  /**
   * 检查资源是否已预加载
   */
  isResourcePreloaded(path: string): boolean {
    return this.preloadedResources.has(path);
  }

  /**
   * 清理预加载的资源
   */
  clearPreloadedResources(): void {
    this.preloadedResources.clear();
    this.preloadPromises.clear();
    logService.info('已清理预加载资源', 'PreloadService');
  }

  /**
   * 获取预加载状态
   */
  getPreloadStatus() {
    return {
      isPreloading: this.isPreloading,
      preloadedCount: this.preloadedResources.size,
      pendingCount: this.preloadPromises.size,
    };
  }
}

export const preloadService = PreloadService.getInstance();