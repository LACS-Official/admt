import { OnlineSoftware, OnlineSoftwareResponse, DownloadTask } from '../types/app';
import { SecureDataTransmissionService } from './secureDataTransmissionService';

export interface OnlineResourcesConfig {
  apiBaseUrl: string;
  apiKey?: string;
  timeout: number;
  retryCount: number;
}

export interface SearchParams {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class OnlineResourcesService {
  private config: OnlineResourcesConfig;
  private transmissionService: SecureDataTransmissionService;
  private downloadTasks: Map<string, DownloadTask> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      apiBaseUrl: 'https://api-g.lacs.cc',
      timeout: 30000,
      retryCount: 3,
    };
    this.transmissionService = SecureDataTransmissionService.getInstance();
    this.initialize();
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    try {
      // 初始化安全数据传输服务
      await this.transmissionService.initialize();
      this.isInitialized = true;
      console.log('✅ 在线资源服务初始化成功');
    } catch (error) {
      console.error('❌ 在线资源服务初始化失败:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.isInitialized) {
      throw new Error('在线资源服务初始化失败，请检查网络连接和配置');
    }
  }

  /**
   * 获取软件列表
   */
  async getSoftwareList(params: SearchParams = {}): Promise<OnlineSoftwareResponse> {
    try {
      // 确保服务已初始化
      await this.ensureInitialized();

      const queryParams = new URLSearchParams();

      // 设置默认参数
      queryParams.append('page', (params.page || 1).toString());
      queryParams.append('limit', (params.limit || 20).toString());

      // 添加标签筛选 - 默认获取 admt 标签的软件
      queryParams.append('tags', params.tags || 'admt');

      // 添加其他筛选参数
      if (params.search) {
        queryParams.append('search', params.search);
      }
      if (params.category) {
        queryParams.append('category', params.category);
      }
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }

      const endpoint = `/app/software?${queryParams.toString()}`;
      console.log('🔍 获取在线软件列表:', endpoint);

      const response = await this.transmissionService.sendSecureRequest(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取软件列表失败');
      }

      // 转换数据格式
      const softwareList: OnlineSoftware[] = Array.isArray(response.data)
        ? response.data
        : response.data.software || [];

      const result: OnlineSoftwareResponse = {
        success: true,
        data: softwareList,
        pagination: response.pagination,
      };

      console.log('✅ 获取软件列表成功:', result.data.length, '个软件');
      return result;

    } catch (error) {
      console.error('❌ 获取软件列表失败:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : '获取软件列表失败',
      };
    }
  }

  /**
   * 搜索软件
   */
  async searchSoftware(keyword: string, params: Omit<SearchParams, 'search'> = {}): Promise<OnlineSoftwareResponse> {
    return this.getSoftwareList({
      ...params,
      search: keyword,
    });
  }

  /**
   * 根据标签获取软件
   */
  async getSoftwareByTags(tags: string[], params: Omit<SearchParams, 'tags'> = {}): Promise<OnlineSoftwareResponse> {
    return this.getSoftwareList({
      ...params,
      tags: tags.join(','),
    });
  }

  /**
   * 获取软件详情
   */
  async getSoftwareDetail(id: number): Promise<OnlineSoftware | null> {
    try {
      // 确保服务已初始化
      await this.ensureInitialized();

      const endpoint = `/app/software/id/${id}`;
      console.log('🔍 获取软件详情:', endpoint);

      const response = await this.transmissionService.sendSecureRequest(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取软件详情失败');
      }

      console.log('✅ 获取软件详情成功:', response.data.name);
      return response.data as OnlineSoftware;

    } catch (error) {
      console.error('❌ 获取软件详情失败:', error);
      return null;
    }
  }

  /**
   * 开始下载软件
   */
  async downloadSoftware(software: OnlineSoftware): Promise<string> {
    try {
      if (!software.latestDownloadUrl) {
        throw new Error('没有可用的下载链接');
      }

      const taskId = `download_${software.id}_${Date.now()}`;
      const fileName = this.generateFileName(software);

      const downloadTask: DownloadTask = {
        id: taskId,
        softwareId: software.id,
        softwareName: software.name,
        fileName,
        downloadUrl: software.latestDownloadUrl,
        progress: 0,
        status: 'pending',
        startTime: new Date(),
      };

      this.downloadTasks.set(taskId, downloadTask);

      console.log('🚀 开始下载软件:', software.name);

      // 使用 Tauri 的下载 API
      await this.startTauriDownload(downloadTask);

      return taskId;

    } catch (error) {
      console.error('❌ 下载软件失败:', error);
      throw error;
    }
  }

  /**
   * 使用 Tauri 下载文件
   */
  private async startTauriDownload(task: DownloadTask): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const { listen } = await import('@tauri-apps/api/event');

      // 更新任务状态
      task.status = 'downloading';
      this.downloadTasks.set(task.id, task);

      // 监听下载进度事件
      const progressUnlisten = await listen('download-progress', (event: any) => {
        const { taskId, progress, downloadedSize, totalSize } = event.payload;
        if (taskId === task.id) {
          task.progress = progress;
          task.downloadedSize = downloadedSize;
          task.fileSize = totalSize;
          this.downloadTasks.set(task.id, task);
        }
      });

      // 监听下载取消事件
      const cancelUnlisten = await listen('download-cancelled', (event: any) => {
        const { taskId } = event.payload;
        if (taskId === task.id) {
          task.status = 'cancelled';
          task.endTime = new Date();
          this.downloadTasks.set(task.id, task);
          progressUnlisten();
          cancelUnlisten();
        }
      });

      // 获取当前窗口
      const window = getCurrentWindow();

      // 调用 Tauri 后端下载
      const result = await invoke('download_file', {
        url: task.downloadUrl,
        fileName: task.fileName,
        taskId: task.id,
        window: window,
      });

      // 下载完成
      task.status = 'completed';
      task.endTime = new Date();
      task.progress = 100;
      this.downloadTasks.set(task.id, task);

      // 清理事件监听器
      progressUnlisten();
      cancelUnlisten();

      console.log('✅ 下载完成:', task.fileName);

    } catch (error) {
      // 下载失败
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : '下载失败';
      task.endTime = new Date();
      this.downloadTasks.set(task.id, task);

      console.error('❌ 下载失败:', error);
      throw error;
    }
  }

  /**
   * 生成文件名
   */
  private generateFileName(software: OnlineSoftware): string {
    const extension = software.filetype || 'zip';
    const safeName = software.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    return `${safeName}_v${software.currentVersion}.${extension}`;
  }

  /**
   * 获取下载任务
   */
  getDownloadTask(taskId: string): DownloadTask | undefined {
    return this.downloadTasks.get(taskId);
  }

  /**
   * 获取所有下载任务
   */
  getAllDownloadTasks(): DownloadTask[] {
    return Array.from(this.downloadTasks.values());
  }

  /**
   * 取消下载
   */
  async cancelDownload(taskId: string): Promise<void> {
    const task = this.downloadTasks.get(taskId);
    if (task && task.status === 'downloading') {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { getCurrentWindow } = await import('@tauri-apps/api/window');

        const window = getCurrentWindow();
        await invoke('cancel_download', { taskId, window });

        task.status = 'cancelled';
        task.endTime = new Date();
        this.downloadTasks.set(taskId, task);

        console.log('🚫 下载已取消:', task.fileName);
      } catch (error) {
        console.error('❌ 取消下载失败:', error);
      }
    }
  }

  /**
   * 清理已完成的下载任务
   */
  clearCompletedTasks(): void {
    for (const [taskId, task] of this.downloadTasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        this.downloadTasks.delete(taskId);
      }
    }
  }

  /**
   * 更新下载进度（由 Tauri 后端调用）
   */
  updateDownloadProgress(taskId: string, progress: number, downloadedSize?: number): void {
    const task = this.downloadTasks.get(taskId);
    if (task) {
      task.progress = progress;
      if (downloadedSize !== undefined) {
        task.downloadedSize = downloadedSize;
      }
      this.downloadTasks.set(taskId, task);
    }
  }
}

export const onlineResourcesService = new OnlineResourcesService();
export default onlineResourcesService;
