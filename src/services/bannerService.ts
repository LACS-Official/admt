/**
 * 轮播图服务
 * 负责从 API 获取和管理轮播图数据
 */

import { Banner, BannerResponse } from '../types/app';
import { tauriHttpService } from './tauriHttpService';

export class BannerService {
  private static instance: BannerService;

  private constructor() {}

  public static getInstance(): BannerService {
    if (!BannerService.instance) {
      BannerService.instance = new BannerService();
    }
    return BannerService.instance;
  }

  /**
   * 获取轮播图列表
   * @param websiteId 网站 ID，默认为 2
   */
  public async getBanners(websiteId: number = 2): Promise<Banner[]> {
    try {
      console.log(`🎠 开始获取轮播图列表 (Website ID: ${websiteId})...`);

      // 使用用户指定的 API 路径
      const endpoint = `https://api-g.lacs.cc/api/websites/${websiteId}/banners`;

      const response = await tauriHttpService.get<any>(endpoint, {
        timeout: 10000,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || '获取轮播图失败');
      }

      // 解析响应数据
      let bannerData: any[] = [];
      
      // 这里的 response 是 tauriHttpService 返回的标准化响应 { success, data, timestamp }
      // response.data 是 API 返回的原始数据
      const apiResult = response.data;

      if (Array.isArray(apiResult)) {
        bannerData = apiResult;
      } else if (apiResult && apiResult.data && Array.isArray(apiResult.data.banners)) {
        // 匹配用户提供的结构: { success: true, data: { website: ..., banners: [...] } }
        bannerData = apiResult.data.banners;
      } else if (apiResult && Array.isArray(apiResult.banners)) {
        bannerData = apiResult.banners;
      } else if (apiResult && apiResult.data && Array.isArray(apiResult.data)) {
        bannerData = apiResult.data;
      }

      // 转换为应用内部的 Banner 类型，处理字段名差异
      const mappedBanners: Banner[] = bannerData.map(item => ({
        id: item.id,
        title: item.title || '',
        titleEn: item.titleEn || item.title,
        description: item.description || '',
        descriptionEn: item.descriptionEn || item.description,
        imgUrl: item.imageUrl || item.imgUrl || '', // 兼容 imageUrl 和 imgUrl
        linkUrl: item.linkUrl || '',
        backgroundColor: item.backgroundColor || '',
        displayOrder: item.sortOrder !== undefined ? item.sortOrder : (item.displayOrder || 0), // 兼容 sortOrder 和 displayOrder
        isActive: item.isActive !== false, // 默认为 true
        metadata: item.metadata || {}
      }));

      // 过滤未启用的并按顺序排序
      const activeBanners = mappedBanners
        .filter(banner => banner.isActive !== false)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      console.log(`✅ 成功获取 ${activeBanners.length} 个轮播图`);
      return activeBanners;

    } catch (error) {
      console.error('❌ 获取轮播图失败:', error);
      return [];
    }
  }
}

export const bannerService = BannerService.getInstance();
export default bannerService;
