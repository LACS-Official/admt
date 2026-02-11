/**
 * 公告服务
 * 负责获取和管理应用公告
 */

import { SecurityConfigManager } from '../config/securityConfig';
import { Announcement, AnnouncementResponse } from '../types/app';
import { tauriHttpService } from './tauriHttpService';
import { getSoftwareId } from '../config/api';

export interface AnnouncementQueryParams {
  page?: number;
  limit?: number;
  type?: 'all' | 'general' | 'update' | 'security' | 'maintenance';
  priority?: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  isPublished?: boolean;
  sortBy?: 'publishedAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class AnnouncementService {
  private static instance: AnnouncementService;
  private configManager: SecurityConfigManager;
  private cache: Map<string, { data: AnnouncementResponse; timestamp: number }> = new Map();
  private pendingRequests: Map<string, Promise<AnnouncementResponse>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {
    this.configManager = SecurityConfigManager.getInstance();
  }

  public static getInstance(): AnnouncementService {
    if (!AnnouncementService.instance) {
      AnnouncementService.instance = new AnnouncementService();
    }
    return AnnouncementService.instance;
  }

  /**
   * 获取公告列表
   */
  public async getAnnouncements(params: AnnouncementQueryParams = {}): Promise<AnnouncementResponse> {
    const cacheKey = JSON.stringify(params);

    // 1. 检查是否有正在进行的相同请求
    if (this.pendingRequests.has(cacheKey)) {
      console.log('📢 公告请求已在进行中，合并请求:', cacheKey);
      return this.pendingRequests.get(cacheKey)!;
    }

    // 2. 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log('📢 使用缓存的公告数据');
      return cached.data;
    }

    // 3. 执行新请求
    const requestPromise = (async () => {
      try {
        console.log('📢 开始获取公告列表...', params);

        await this.configManager.initialize();

        const queryParams = new URLSearchParams({
          page: (params.page || 1).toString(),
          limit: (params.limit || 10).toString(),
          type: params.type || 'all',
          priority: params.priority || 'all',
          isPublished: (params.isPublished !== undefined ? params.isPublished : true).toString(),
          sortBy: params.sortBy || 'publishedAt',
          sortOrder: params.sortOrder || 'desc',
        });

        let softwareId;
        try {
          softwareId = getSoftwareId();
        } catch (error) {
          softwareId = this.configManager.getSoftwareId();
        }
        
        const endpoint = `/app/software/id/${softwareId}/announcements?${queryParams.toString()}`;
        console.log('📢 请求公告API:', endpoint);

        const response = await tauriHttpService.get<AnnouncementResponse>(endpoint, {
          timeout: 10000,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || '获取公告失败');
        }

        const data = response.data;
        if (!data.success) {
          throw new Error(`公告API返回错误: ${data.error || '未知错误'}`);
        }

        console.log('✅ 公告获取成功');
        
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;

      } catch (error) {
        console.error('❌ 获取公告失败:', error);
        return {
          success: true,
          data: {
            software: { id: this.configManager.getSoftwareId(), name: '玩机管家' },
            announcements: [],
            pagination: { page: params.page || 1, limit: params.limit || 10, total: 0, totalPages: 0 }
          },
          error: error instanceof Error ? error.message : '获取公告失败'
        };
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * 获取重要公告（高优先级和紧急公告）
   */
  public async getImportantAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await this.getAnnouncements({
        priority: 'high',
        limit: 5,
        sortBy: 'priority',
        sortOrder: 'desc',
      });

      if (response.success) {
        // 过滤出高优先级和紧急公告
        return response.data.announcements.filter(
          announcement => announcement.priority === 'high' || announcement.priority === 'urgent'
        );
      }

      return [];
    } catch (error) {
      console.error('❌ 获取重要公告失败:', error);
      return [];
    }
  }

  /**
   * 获取最新公告
   */
  public async getLatestAnnouncements(limit: number = 3): Promise<Announcement[]> {
    try {
      const response = await this.getAnnouncements({
        limit,
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      });

      if (response.success) {
        return response.data.announcements;
      }

      return [];
    } catch (error) {
      console.error('❌ 获取最新公告失败:', error);
      return [];
    }
  }

  /**
   * 检查是否有未过期的重要公告
   */
  public async hasImportantAnnouncements(): Promise<boolean> {
    try {
      const announcements = await this.getImportantAnnouncements();
      
      // 检查是否有未过期的重要公告
      const now = new Date();
      const validAnnouncements = announcements.filter(announcement => {
        if (!announcement.expiresAt) {
          return true; // 没有过期时间的公告始终有效
        }
        return new Date(announcement.expiresAt) > now;
      });

      return validAnnouncements.length > 0;
    } catch (error) {
      console.error('❌ 检查重要公告失败:', error);
      return false;
    }
  }

  /**
   * 格式化公告内容（支持多语言）
   */
  public formatAnnouncement(announcement: Announcement, language: string = 'zh-CN'): {
    title: string;
    content: string;
  } {
    const isEnglish = language.startsWith('en');
    
    return {
      title: (isEnglish && announcement.titleEn) ? announcement.titleEn : announcement.title,
      content: (isEnglish && announcement.contentEn) ? announcement.contentEn : announcement.content,
    };
  }

  /**
   * 获取公告优先级的显示文本
   */
  public getPriorityText(priority: string): string {
    const priorityMap: Record<string, string> = {
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '紧急',
    };
    return priorityMap[priority] || priority;
  }

  /**
   * 获取公告类型的显示文本
   */
  public getTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      general: '一般',
      update: '更新',
      security: '安全',
      maintenance: '维护',
      feature: '功能',
      bugfix: '修复',
    };
    return typeMap[type] || type;
  }
}

// 导出单例实例
export const announcementService = AnnouncementService.getInstance();
