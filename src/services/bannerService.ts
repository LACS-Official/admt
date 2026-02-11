/**
 * 轮播图服务
 * 负责从 API 获取和管理轮播图数据
 */

import { Banner, BannerResponse } from '../types/app';
import { tauriHttpService } from './tauriHttpService';

export class BannerService {
  private static instance: BannerService;

  private cache: { data: Banner[]; timestamp: number } | null = null;
  private pendingRequest: Promise<Banner[]> | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10分钟轮播缓存

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
    // 1. 检查合并请求
    if (this.pendingRequest) {
      console.log('🎠 轮播图请求已在进行中，合并请求');
      return this.pendingRequest;
    }

    // 2. 检查缓存
    if (this.cache && (Date.now() - this.cache.timestamp < this.CACHE_TTL)) {
      console.log('🎠 使用缓存的轮播图数据');
      return this.cache.data;
    }

    // 3. 执行请求
    this.pendingRequest = (async () => {
      try {
        console.log(`🎠 开始获取轮播图列表 (Website ID: ${websiteId})...`);

        const endpoint = `https://api-g.lacs.cc/api/websites/${websiteId}/banners`;

        const response = await tauriHttpService.get<any>(endpoint, {
          timeout: 10000,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || '获取轮播图失败');
        }

        const apiResult = response.data;
        let bannerData: any[] = [];
        
        if (Array.isArray(apiResult)) {
          bannerData = apiResult;
        } else if (apiResult && apiResult.data && Array.isArray(apiResult.data.banners)) {
          bannerData = apiResult.data.banners;
        } else if (apiResult && Array.isArray(apiResult.banners)) {
          bannerData = apiResult.banners;
        } else if (apiResult && apiResult.data && Array.isArray(apiResult.data)) {
          bannerData = apiResult.data;
        }

        const mappedBanners: Banner[] = bannerData.map(item => ({
          id: item.id,
          title: item.title || '',
          titleEn: item.titleEn || item.title,
          description: item.description || '',
          descriptionEn: item.descriptionEn || item.description,
          imgUrl: item.imageUrl || item.imgUrl || '',
          linkUrl: item.linkUrl || '',
          backgroundColor: item.backgroundColor || '',
          displayOrder: item.sortOrder !== undefined ? item.sortOrder : (item.displayOrder || 0),
          isActive: item.isActive !== false,
          metadata: item.metadata || {}
        }));

        const activeBanners = mappedBanners
          .filter(banner => banner.isActive !== false)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        console.log(`✅ 成功获取 ${activeBanners.length} 个轮播图`);
        
        // 存入缓存
        this.cache = { data: activeBanners, timestamp: Date.now() };
        return activeBanners;

      } catch (error) {
        console.error('❌ 获取轮播图失败:', error);
        return [];
      } finally {
        this.pendingRequest = null;
      }
    })();

    return this.pendingRequest;
  }
}

export const bannerService = BannerService.getInstance();
export default bannerService;
