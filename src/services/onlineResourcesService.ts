import { OnlineSoftware, OnlineSoftwareResponse, DownloadTask } from '../types/app';
import { tauriHttpService } from './tauriHttpService';
import { logService } from './logService';

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
  private downloadTasks: Map<string, DownloadTask> = new Map();
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'download_tasks';
  private lastDownloadTime: number = 0;
  private readonly DOWNLOAD_COOLDOWN = 60 * 1000; // 1分钟冷却时间
  private activeDownloads: Map<string, number> = new Map(); // 跟踪活跃下载任务的时间戳
  private readonly MAX_ACTIVE_DOWNLOADS = 2; // 最大活跃下载数
  private readonly ACTIVE_DOWNLOAD_WINDOW = 60 * 1000; // 1分钟窗口内

  constructor() {
    this.config = {
      apiBaseUrl: 'https://api-g.lacs.cc',
      timeout: 30000,
      retryCount: 3,
    };
    // 直接标记为已初始化，因为不再依赖 SecureDataTransmissionService
    this.isInitialized = true;
    this.loadPersistedTasks();
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    // 使用 tauriHttpService，无需额外初始化
    if (!this.isInitialized) {
      this.isInitialized = true;
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

      const response = await tauriHttpService.get(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取软件列表失败');
      }



      // 转换数据格式 - 处理嵌套的 data 结构
      let softwareList: OnlineSoftware[] = [];
      let pagination: any = undefined;

      if (Array.isArray(response.data)) {
        // 如果 response.data 直接是数组
        softwareList = response.data;
      } else if (response.data && response.data.data) {
        // 如果是嵌套结构 response.data.data.software
        softwareList = response.data.data.software || [];
        pagination = response.data.data.pagination;
      } else if (response.data && response.data.software) {
        // 如果是 response.data.software
        softwareList = response.data.software;
        pagination = response.data.pagination;
      }

      const result: OnlineSoftwareResponse = {
        success: true,
        data: softwareList,
        pagination: pagination,
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
      tags: tags.join(',')
    });
  }

  async getSoftwareByCategories(): Promise<Record<string, OnlineSoftware[]>> {
    try {
      await this.ensureInitialized();
      
      // 首先获取所有ADMT标签的软件
      const admtResponse = await this.getSoftwareByTags(['admt']);
      const admtSoftware = admtResponse.data || [];
      
      // 获取其他分类的软件
      const categories = ['脚本', '驱动', '设置文件', '小米解锁','RootApp', '其它'];
      const result: Record<string, OnlineSoftware[]> = {
        'ADMT': admtSoftware
      };

      // 并行获取其他分类
      await Promise.all(categories.map(async category => {
        const response = await this.getSoftwareByTags([category]);
        result[category] = response.data || [];
      }));

      return result;
    } catch (error) {
      console.error('Failed to get software by categories:', error);
      return {
        'ADMT': [],
        '脚本': [],
        '驱动': [],
        '设置文件': [],
        '小米解锁': [],
        'RootApp': [],
        '其它': []
      };
    }
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

      const response = await tauriHttpService.get(endpoint);

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取软件详情失败');
      }

      // 处理可能的嵌套数据结构
      let softwareData: any = null;
      if (response.data && response.data.data) {
        // 如果是嵌套结构 response.data.data
        softwareData = response.data.data;
      } else {
        // 如果是直接结构 response.data
        softwareData = response.data;
      }

      await logService.info(`获取软件详情成功: ${softwareData?.name}`, '在线资源服务');
      return softwareData as OnlineSoftware;

    } catch (error) {
      logService.error('获取软件详情失败', '在线资源服务', { error: String(error) });
      return null;
    }
  }

  /**
   * 检查是否可以开始新的下载
   */
  canStartDownload(): { canDownload: boolean; reason?: string; remainingTime?: number } {
    // 清理过期的活跃下载记录
    const now = Date.now();
    for (const [taskId, timestamp] of this.activeDownloads.entries()) {
      if (now - timestamp > this.ACTIVE_DOWNLOAD_WINDOW) {
        this.activeDownloads.delete(taskId);
      }
    }

    // 检查活跃下载数量
    if (this.activeDownloads.size >= this.MAX_ACTIVE_DOWNLOADS) {
      return {
        canDownload: false,
        reason: `1分钟内最多只能同时下载 ${this.MAX_ACTIVE_DOWNLOADS} 个文件，请等待正在下载的任务完成`
      };
    }

    return { canDownload: true };
  }

  /**
   * 获取下载冷却剩余时间（秒）
   */
  getDownloadCooldownRemaining(): number {
    if (this.lastDownloadTime === 0) return 0;

    const now = Date.now();
    const timeSinceLastDownload = now - this.lastDownloadTime;

    if (timeSinceLastDownload >= this.DOWNLOAD_COOLDOWN) return 0;

    return Math.ceil((this.DOWNLOAD_COOLDOWN - timeSinceLastDownload) / 1000);
  }

  /**
   * 开始下载软件（新版本：支持自动解压和配置文件生成）
   */
  async downloadSoftware(software: OnlineSoftware): Promise<string> {
    let taskId: string = '';
    try {
      // 检查下载限制
      const downloadCheck = this.canStartDownload();
      if (!downloadCheck.canDownload) {
        throw new Error(downloadCheck.reason || '无法开始下载');
      }

      if (!software.latestDownloadUrl) {
        throw new Error('没有可用的下载链接');
      }

      taskId = `download_${software.id}_${Date.now()}`;
      
      // 记录活跃下载
      this.activeDownloads.set(taskId, Date.now());

      // 获取默认下载目录
      const { invoke } = await import('@tauri-apps/api/core');
      const downloadDir = await invoke('get_default_download_directory') as string;
      await logService.info(`开始准备下载任务，使用目录: ${downloadDir}`, '在线资源服务', { softwareName: software.name });

      // 从URL中提取文件扩展名
      const fileExtension = this.extractFileExtension(software.latestDownloadUrl, software.filetype);

      const downloadRequest = {
        id: taskId,
        url: software.latestDownloadUrl,
        software_name: software.name, // 使用软件名称作为文件名（不包含版本号）
        openname: software.openname || null,
        file_extension: fileExtension,
        download_dir: downloadDir,
      };

      const downloadTask: DownloadTask = {
        id: taskId,
        softwareId: software.id,
        softwareName: software.name,
        fileName: `${software.name}.${fileExtension}`,
        downloadUrl: software.latestDownloadUrl,
        iconUrl: software.iconUrl,
        progress: 0,
        status: 'pending',
        startTime: new Date(),
      };

      this.downloadTasks.set(taskId, downloadTask);
      this.persistTasks();

      logService.info(`🚀 开始下载并解析在线资源: ${software.name}`, '在线资源服务');

      // 监听下载进度事件
      await this.setupDownloadProgressListener(taskId);

      // 调用新的下载和解压命令
      const resultPath = await invoke('download_and_extract_software', { request: downloadRequest }) as string;

      // 更新任务状态为完成（只有在进度监听器没有设置为完成时才更新）
      const currentTask = this.downloadTasks.get(taskId);
      if (currentTask && currentTask.status !== 'completed') {
        currentTask.status = 'completed';
        currentTask.endTime = new Date();
        currentTask.extractedPath = resultPath;
        currentTask.filePath = resultPath; // 设置文件路径用于状态检测
        this.downloadTasks.set(taskId, currentTask);
        this.persistTasks();

        // 记录下载完成时间，但不再用于冷却计算
        this.lastDownloadTime = Date.now();
      }

      logService.info(`✅ 资源下载并解压完成: ${software.name}`, '在线资源服务');
      return taskId;

    } catch (error) {
      logService.error(`❌ 下载资源失败: ${software.name}`, '在线资源服务', { error: error instanceof Error ? error.message : String(error) });

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
      this.persistTasks();

      let lastDownloadedSize = 0;
      let lastUpdateTime = Date.now();

      // 监听下载进度事件
      const progressUnlisten = await listen('download-progress', (event: any) => {
        const { taskId, progress, downloadedSize, totalSize } = event.payload;
        if (taskId === task.id) {
          const now = Date.now();
          const timeDiff = (now - lastUpdateTime) / 1000; // 秒
          const sizeDiff = downloadedSize - lastDownloadedSize;

          // 计算下载速度
          if (timeDiff > 0) {
            task.downloadSpeed = sizeDiff / timeDiff;
          }

          // 计算剩余时间
          if (task.downloadSpeed && task.downloadSpeed > 0) {
            const remainingBytes = totalSize - downloadedSize;
            task.remainingTime = remainingBytes / task.downloadSpeed;
          }

          task.progress = progress;
          task.downloadedSize = downloadedSize;
          task.fileSize = totalSize;

          lastDownloadedSize = downloadedSize;
          lastUpdateTime = now;

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
      }) as string;

      task.status = 'completed';
      task.endTime = new Date();
      task.progress = 100;
      task.filePath = result;
      this.downloadTasks.set(task.id, task);
      this.persistTasks();

      // 清理事件监听器
      progressUnlisten();
      cancelUnlisten();

      logService.info(`✅ 下载完成: ${task.fileName}`, '在线资源服务');

    } catch (error) {
      // 下载失败
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : '下载失败';
      task.endTime = new Date();
      this.downloadTasks.set(task.id, task);
      this.persistTasks();

      logService.error(`❌ 下载失败: ${task.fileName}`, '在线资源服务', { error: task.error });
      throw error;
    }
  }



  /**
   * 从URL或filetype中提取文件扩展名
   */
  private extractFileExtension(url: string, filetype?: string): string {
    if (filetype) {
      return filetype;
    }

    // 从URL中提取扩展名
    const urlPath = new URL(url).pathname;
    const extension = urlPath.split('.').pop();

    if (extension && ['exe', 'zip', '7z', 'rar', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'apk'].includes(extension.toLowerCase())) {
      return extension.toLowerCase();
    }

    // 默认返回zip
    return 'zip';
  }

  /**
   * 设置下载进度监听器
   */
  private async setupDownloadProgressListener(taskId: string): Promise<void> {
    const { listen } = await import('@tauri-apps/api/event');

    // 监听下载进度事件
    await listen('download-progress', (event: any) => {
      const progressData = event.payload;
      if (progressData.id === taskId) {
        const task = this.downloadTasks.get(taskId);
        if (task) {
          task.progress = progressData.percentage;
          task.downloadedSize = progressData.downloaded;
          task.fileSize = progressData.total_size;
          task.downloadSpeed = progressData.speed;

          // 更新状态
          switch (progressData.status) {
            case 'Downloading':
              task.status = 'downloading';
              break;
            case 'Completed':
              task.status = 'downloaded';
              // 如果有文件路径信息，设置到任务中
              if (progressData.file_path) {
                task.filePath = progressData.file_path;
              }
              break;
            case 'Extracting':
              task.status = 'extracting';
              break;
            case 'ExtractCompleted':
              task.status = 'completed';
              // 如果有解压路径信息，设置到任务中
              if (progressData.extract_path) {
                task.extractedPath = progressData.extract_path;
                task.filePath = progressData.extract_path;
              }
              break;
            case 'Failed':
              task.status = 'failed';
              if (progressData.error) {
                task.error = progressData.error;
              }
              break;
          }

          // 仅在关键状态切换时记录日志
          const prevTask = this.downloadTasks.get(taskId);
          if (prevTask && prevTask.status !== task.status) {
            logService.info(`📦 资源状态变更 [${task.softwareName}]: ${this.getStatusText(task.status)}`, '在线资源服务');
          }

          this.downloadTasks.set(taskId, task);
          this.persistTasks();
        }
      }
    });
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '等待中',
      'downloading': '下载中',
      'downloaded': '已下载',
      'extracting': '解压中',
      'completed': '已完成',
      'failed': '失败',
      'cancelled': '已取消',
      'paused': '已暂停'
    };
    return statusMap[status] || status;
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
   * 暂停下载
   */
  async pauseDownload(taskId: string): Promise<void> {
    const task = this.downloadTasks.get(taskId);
    if (task && task.status === 'downloading') {
      task.status = 'paused';
      this.downloadTasks.set(taskId, task);
      logService.info(`⏸️ 下载已暂停: ${task.fileName}`, '在线资源服务');
    }
  }

  /**
   * 恢复下载
   */
  async resumeDownload(taskId: string): Promise<void> {
    const task = this.downloadTasks.get(taskId);
    if (task && task.status === 'paused') {
      task.status = 'downloading';
      this.downloadTasks.set(taskId, task);
      logService.info(`▶️ 下载已恢复: ${task.fileName}`, '在线资源服务');
    }
  }

  /**
   * 取消下载
   */
  async cancelDownload(taskId: string): Promise<void> {
    const task = this.downloadTasks.get(taskId);
    if (task && (task.status === 'downloading' || task.status === 'paused' || task.status === 'extracting')) {
      try {
        // 调用Tauri后端取消下载或解压
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('cancel_download_or_extract', { taskId });
        logService.info(`❌ 下载/解压已取消: ${task.fileName}`, '在线资源服务');
      } catch (error) {
        logService.error(`调用取消命令失败: ${task.fileName}`, '在线资源服务', { error });
      }
      
      // 更新任务状态
      task.status = 'cancelled';
      task.endTime = new Date();
      this.downloadTasks.set(task.id, task);
      this.persistTasks();
      
      // 从活跃下载中移除
      this.activeDownloads.delete(taskId);
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

  /**
   * 获取下载统计信息
   */
  getDownloadStats() {
    const tasks = Array.from(this.downloadTasks.values());
    return {
      total: tasks.length,
      downloading: tasks.filter(t => t.status === 'downloading').length,
      extracting: tasks.filter(t => t.status === 'extracting').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      paused: tasks.filter(t => t.status === 'paused').length,
    };
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化下载速度
   */
  formatDownloadSpeed(bytesPerSecond: number): string {
    return this.formatFileSize(bytesPerSecond) + '/s';
  }

  /**
   * 格式化剩余时间
   */
  formatRemainingTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`;
    return `${Math.round(seconds / 3600)}小时`;
  }

  /**
   * 获取下载目录
   */
  async getDownloadsDirectory(): Promise<string> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('get_downloads_directory');
    } catch (error) {
      console.error('❌ 获取下载目录失败:', error);
      return '';
    }
  }

  /**
   * 清理下载文件
   */
  async cleanupDownloads(olderThanDays: number = 30): Promise<number> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('cleanup_downloads', { olderThanDays });
    } catch (error) {
      console.error('❌ 清理下载文件失败:', error);
      return 0;
    }
  }

  // 加载持久化的下载任务
  private loadPersistedTasks(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const tasks: DownloadTask[] = JSON.parse(stored);
        tasks.forEach(task => {
          // 恢复日期对象
          if (task.startTime) {
            task.startTime = new Date(task.startTime);
          }
          if (task.endTime) {
            task.endTime = new Date(task.endTime);
          }

          // 重置进行中的任务状态
          if (task.status === 'downloading' || task.status === 'paused') {
            task.status = 'failed';
            task.error = '应用程序重启，下载已中断';
          }

          this.downloadTasks.set(task.id, task);
        });
      }
    } catch (error) {
      console.error('加载持久化下载任务失败:', error);
    }
  }

  // 保存下载任务到本地存储
  private persistTasks(): void {
    try {
      const tasks = Array.from(this.downloadTasks.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('保存下载任务失败:', error);
    }
  }

  // 更新任务并持久化
  private updateTaskAndPersist(taskId: string, updates: Partial<DownloadTask>): void {
    const task = this.downloadTasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.downloadTasks.set(taskId, task);
      this.persistTasks();
    }
  }

  // 清除已完成的下载任务
  clearCompletedTasks(): void {
    const completedTasks = Array.from(this.downloadTasks.entries())
      .filter(([_, task]) => task.status === 'completed')
      .map(([id, _]) => id);

    completedTasks.forEach(id => this.downloadTasks.delete(id));
    this.persistTasks();
  }

  // 清除失败的下载任务
  clearFailedTasks(): void {
    const failedTasks = Array.from(this.downloadTasks.entries())
      .filter(([_, task]) => task.status === 'failed')
      .map(([id, _]) => id);

    failedTasks.forEach(id => this.downloadTasks.delete(id));
    this.persistTasks();
  }

  // 清除所有下载任务
  clearAllTasks(): void {
    this.downloadTasks.clear();
    this.persistTasks();
  }

  // 删除特定下载任务
  deleteTask(taskId: string): void {
    this.downloadTasks.delete(taskId);
    this.persistTasks();
  }

  // 移除下载任务（别名方法）
  removeDownloadTask(taskId: string): void {
    this.deleteTask(taskId);
  }

  /**
   * 检查软件是否已下载
   */
  async checkSoftwareDownloaded(software: OnlineSoftware): Promise<{
    isDownloaded: boolean;
    filePath?: string;
    task?: DownloadTask;
  }> {
    try {
      // 1. 检查是否有已完成的下载任务
      const completedTask = Array.from(this.downloadTasks.values()).find(
        task => task.softwareId === software.id && task.status === 'completed' && task.filePath
      );

      if (completedTask && completedTask.filePath) {
        // 2. 验证文件是否仍然存在
        const { invoke } = await import('@tauri-apps/api/core');
        const fileExists = await invoke('check_file_exists', { path: completedTask.filePath }) as boolean;

        if (fileExists) {
          return {
            isDownloaded: true,
            filePath: completedTask.filePath,
            task: completedTask
          };
        } else {
          // 文件不存在，更新任务状态
          this.updateTaskAndPersist(completedTask.id, {
            status: 'failed',
            error: '文件已被删除或移动'
          });
        }
      }

      // 3. 检查默认下载目录中是否存在文件
      const downloadDir = await this.getDownloadsDirectory();
      if (downloadDir && software.latestDownloadUrl) {
        // 从URL中提取文件扩展名
        const fileExtension = this.extractFileExtension(software.latestDownloadUrl, software.filetype);
        const fileName = this.generateFileName(software);
        
        // 根据文件扩展名确定检查的目录
        let filePath: string;
        if (fileExtension === 'apk') {
          // APK文件检查 downloads/apk/ 目录
          filePath = `${downloadDir}/apk/${fileName}`;
        } else {
          // 其他文件检查默认下载目录
          filePath = `${downloadDir}/${fileName}`;
        }

        const { invoke } = await import('@tauri-apps/api/core');
        const fileExists = await invoke('check_file_exists', { path: filePath }) as boolean;

        if (fileExists) {
          return {
            isDownloaded: true,
            filePath: filePath
          };
        }
      }

      return { isDownloaded: false };
    } catch (error) {
      logService.error('检查软件下载状态失败', '在线资源服务', { error: String(error) });
      return { isDownloaded: false };
    }
  }

  /**
   * 生成下载文件名
   */
  private generateFileName(software: OnlineSoftware): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeName = software.name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
    const extension = software.filetype || 'zip';
    return `${safeName}_v${software.currentVersion}_${timestamp}.${extension}`;
  }
}

export const onlineResourcesService = new OnlineResourcesService();
export default onlineResourcesService;
