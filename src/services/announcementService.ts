/**
 * 公告服务
 * 负责获取和管理应用公告
 */

import { SecurityConfigManager } from '../config/securityConfig';
import { Announcement, AnnouncementResponse } from '../types/app';

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
    try {
      console.log('📢 开始获取公告列表...', params);

      // 确保安全配置已初始化
      await this.configManager.initialize();
      const config = this.configManager.getConfig();

      // 构建查询参数
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        limit: (params.limit || 10).toString(),
        type: params.type || 'all',
        priority: params.priority || 'all',
        isPublished: (params.isPublished !== undefined ? params.isPublished : true).toString(),
        sortBy: params.sortBy || 'publishedAt',
        sortOrder: params.sortOrder || 'desc',
      });

      // 在开发环境使用代理，生产环境使用直接API地址
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isDevelopment ? '' : config.api_base_url;

      // 使用软件ID获取公告
      const softwareId = config.software_id || 1; // 默认使用ID 1
      const apiUrl = `${baseUrl}/app/software/id/${softwareId}/announcements?${queryParams.toString()}`;

      console.log('📢 请求公告API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.api_key,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      if (!response.ok) {
        throw new Error(`公告API请求失败: ${response.status} ${response.statusText}`);
      }

      const data: AnnouncementResponse = await response.json();

      if (!data.success) {
        throw new Error(`公告API返回错误: ${data.error || '未知错误'}`);
      }

      console.log('✅ 公告获取成功:', {
        count: data.data.announcements.length,
        software: data.data.software.name,
      });

      return data;

    } catch (error) {
      console.error('❌ 获取公告失败:', error);
      
      // 返回空的公告响应，不阻止应用启动
      return {
        success: false,
        data: {
          software: { id: 1, name: '玩机管家' },
          announcements: [],
        },
        error: error instanceof Error ? error.message : '获取公告失败',
      };
    }
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
    return priorityMap[priority] || '未知';
  }

  /**
   * 获取公告类型的显示文本
   */
  public getTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      general: '一般公告',
      update: '更新通知',
      security: '安全提醒',
      maintenance: '维护通知',
    };
    return typeMap[type] || '未知类型';
  }
}

// 导出单例实例
export const announcementService = AnnouncementService.getInstance();
