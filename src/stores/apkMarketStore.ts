import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApkMarketData, ApkCategory, ApkItem, ApkDownloadItem, ApkDownloadStatus } from '../types/device';
import { deviceService } from '../services/deviceService';

interface ApkMarketState {
  // APK市场数据
  marketData: ApkMarketData | null;
  categories: ApkCategory[];
  isLoading: boolean;
  lastUpdated: string | null;
  error: string | null;

  // 下载管理
  downloads: ApkDownloadItem[];
  activeDownloads: number;
  maxConcurrentDownloads: number;

  // 搜索和筛选
  searchQuery: string;
  selectedCategory: string;
  filteredApps: ApkItem[];

  // 操作方法
  fetchMarketData: () => Promise<void>;
  refreshMarketData: () => Promise<void>;
  forceRefreshData: () => Promise<void>;
  clearCache: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  filterApps: () => void;

  // 下载管理方法
  startDownload: (apkItem: ApkItem, category: string) => Promise<string>;
  pauseDownload: (downloadId: string) => void;
  resumeDownload: (downloadId: string) => void;
  cancelDownload: (downloadId: string) => void;
  retryDownload: (downloadId: string) => void;
  clearCompletedDownloads: () => void;
  updateDownloadProgress: (downloadId: string, progress: number, downloadedSize: number, totalSize: number) => void;
  updateDownloadStatus: (downloadId: string, status: ApkDownloadStatus, error?: string) => void;
  setDownloadFilePath: (downloadId: string, filePath: string) => void;
}

const APK_MARKET_API = 'https://api.lacs.cc/apk.json';
const CACHE_DURATION = 0; // 取消缓存
// const FORCE_REFRESH_KEY = 'apk_market_force_refresh';

export const useApkMarketStore = create<ApkMarketState>()(
  persist(
    (set, get) => ({
      // 初始状态
      marketData: null,
      categories: [],
      isLoading: false,
      lastUpdated: null,
      error: null,

      downloads: [],
      activeDownloads: 0,
      maxConcurrentDownloads: 3,

      searchQuery: '',
      selectedCategory: '',
      filteredApps: [],

      // 获取市场数据
      fetchMarketData: async () => {
        const state = get();

        // 强制刷新检查 - 如果缓存时间为0，总是重新获取数据
        const shouldForceRefresh = CACHE_DURATION === 0;

        // 检查缓存是否有效（仅在非强制刷新模式下）
        if (!shouldForceRefresh && state.marketData && state.lastUpdated) {
          const cacheAge = Date.now() - new Date(state.lastUpdated).getTime();
          if (cacheAge < CACHE_DURATION) {
            state.filterApps();
            return;
          }
        }

        set({ isLoading: true, error: null });

        try {
          // 添加时间戳参数防止浏览器缓存
          const timestamp = Date.now();
          const apiUrl = `${APK_MARKET_API}?t=${timestamp}`;

          const response = await fetch(apiUrl, {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data: ApkMarketData = await response.json();

          set({
            marketData: data,
            categories: data.apk_list || [],
            isLoading: false,
            lastUpdated: new Date().toISOString(),
            error: null,
          });

          // 应用当前筛选
          get().filterApps();

          console.log('APK市场数据已更新:', {
            categories: data.apk_list?.length || 0,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('获取APK市场数据失败:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '获取APK市场数据失败',
          });
        }
      },

      // 刷新市场数据
      refreshMarketData: async () => {
        set({ lastUpdated: null, marketData: null });
        await get().fetchMarketData();
      },

      // 强制刷新数据（绕过所有缓存）
      forceRefreshData: async () => {
        console.log('开始强制刷新APK市场数据...');

        // 1. 清除所有相关的本地存储
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('apk') || key.includes('market'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          console.log('已清除本地存储:', keysToRemove);
        } catch (error) {
          console.warn('清除本地存储失败:', error);
        }

        // 2. 重置状态
        set({
          marketData: null,
          categories: [],
          lastUpdated: null,
          filteredApps: [],
          searchQuery: '',
          selectedCategory: '',
          isLoading: true,
          error: null,
        });

        // 3. 强制重新获取数据
        try {
          const timestamp = Date.now();
          const randomParam = Math.random().toString(36).substring(7);
          const apiUrl = `${APK_MARKET_API}?t=${timestamp}&r=${randomParam}&nocache=1`;

          console.log('请求URL:', apiUrl);

          const response = await fetch(apiUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'If-None-Match': '*',
              'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data: ApkMarketData = await response.json();
          console.log('获取到新数据:', {
            categories: data.apk_list?.length || 0,
            totalApps: data.apk_list?.reduce((sum, cat) => sum + (cat.apps?.length || 0), 0) || 0,
            timestamp: new Date().toISOString()
          });

          set({
            marketData: data,
            categories: data.apk_list || [],
            isLoading: false,
            lastUpdated: new Date().toISOString(),
            error: null,
          });

          // 应用当前筛选
          get().filterApps();

          console.log('强制刷新完成');
        } catch (error) {
          console.error('强制刷新失败:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '强制刷新失败',
          });
          throw error;
        }
      },

      // 清除缓存
      clearCache: () => {
        set({
          marketData: null,
          categories: [],
          lastUpdated: null,
          filteredApps: [],
          searchQuery: '',
          selectedCategory: '',
        });
        console.log('APK市场缓存已清除');
      },

      // 设置搜索查询
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().filterApps();
      },

      // 设置选中的分类
      setSelectedCategory: (category: string) => {
        set({ selectedCategory: category });
        get().filterApps();
      },

      // 筛选应用
      filterApps: () => {
        const { categories, searchQuery, selectedCategory } = get();
        let filteredApps: ApkItem[] = [];

        // 获取所有应用或指定分类的应用
        if (selectedCategory) {
          const category = categories.find(cat => cat.category === selectedCategory);
          filteredApps = category ? [...category.apps] : [];
        } else {
          filteredApps = categories.flatMap(cat => cat.apps);
        }

        // 应用搜索筛选
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filteredApps = filteredApps.filter(app =>
            app.name.toLowerCase().includes(query)
          );
        }

        set({ filteredApps });
      },

      // 开始下载
      startDownload: async (apkItem: ApkItem, category: string) => {
        const downloadId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 生成文件名
        const fileName = `${apkItem.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${Date.now()}.apk`;

        const downloadItem: ApkDownloadItem = {
          id: downloadId,
          name: apkItem.name,
          category,
          url: apkItem.download_link.url,
          isDirect: apkItem.download_link.is_direct,
          status: 'pending',
          progress: 0,
          downloadedSize: 0,
          totalSize: 0,
          startTime: new Date().toISOString(),
        };

        set(state => ({
          downloads: [...state.downloads, downloadItem],
          activeDownloads: state.activeDownloads + 1,
        }));

        // 开始实际下载
        try {
          get().updateDownloadStatus(downloadId, 'downloading');

          // 获取文件大小
          try {
            const totalSize = await deviceService.getDownloadSize(
              apkItem.download_link.url,
              apkItem.download_link.is_direct
            );
            get().updateDownloadProgress(downloadId, 0, 0, totalSize);
          } catch (error) {
            // 如果获取大小失败，继续下载但不显示进度
            console.warn('Failed to get download size:', error);
          }

          // 开始下载
          const filePath = await deviceService.downloadApk(
            apkItem.download_link.url,
            fileName,
            apkItem.download_link.is_direct
          );

          // 下载完成
          get().setDownloadFilePath(downloadId, filePath);
          get().updateDownloadStatus(downloadId, 'completed');
          get().updateDownloadProgress(downloadId, 100, downloadItem.totalSize, downloadItem.totalSize);

        } catch (error) {
          get().updateDownloadStatus(downloadId, 'failed', error instanceof Error ? error.message : '下载失败');
        }

        return downloadId;
      },

      // 暂停下载
      pauseDownload: (downloadId: string) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { ...download, status: 'paused' as ApkDownloadStatus }
              : download
          ),
          activeDownloads: Math.max(0, state.activeDownloads - 1),
        }));
      },

      // 恢复下载
      resumeDownload: (downloadId: string) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { ...download, status: 'downloading' as ApkDownloadStatus }
              : download
          ),
          activeDownloads: state.activeDownloads + 1,
        }));
      },

      // 取消下载
      cancelDownload: (downloadId: string) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { ...download, status: 'cancelled' as ApkDownloadStatus, endTime: new Date().toISOString() }
              : download
          ),
          activeDownloads: Math.max(0, state.activeDownloads - 1),
        }));
      },

      // 重试下载
      retryDownload: (downloadId: string) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { 
                  ...download, 
                  status: 'pending' as ApkDownloadStatus, 
                  progress: 0,
                  downloadedSize: 0,
                  error: undefined,
                  startTime: new Date().toISOString(),
                  endTime: undefined,
                }
              : download
          ),
        }));

        // 重新开始下载
        setTimeout(() => {
          get().updateDownloadStatus(downloadId, 'downloading');
        }, 100);
      },

      // 清理已完成的下载
      clearCompletedDownloads: () => {
        set(state => ({
          downloads: state.downloads.filter(download => 
            !['completed', 'failed', 'cancelled'].includes(download.status)
          ),
        }));
      },

      // 更新下载进度
      updateDownloadProgress: (downloadId: string, progress: number, downloadedSize: number, totalSize: number) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { ...download, progress, downloadedSize, totalSize }
              : download
          ),
        }));
      },

      // 更新下载状态
      updateDownloadStatus: (downloadId: string, status: ApkDownloadStatus, error?: string) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { 
                  ...download, 
                  status, 
                  error,
                  endTime: ['completed', 'failed', 'cancelled'].includes(status) 
                    ? new Date().toISOString() 
                    : download.endTime
                }
              : download
          ),
          activeDownloads: ['completed', 'failed', 'cancelled', 'paused'].includes(status)
            ? Math.max(0, state.activeDownloads - 1)
            : state.activeDownloads,
        }));
      },

      // 设置下载文件路径
      setDownloadFilePath: (downloadId: string, filePath: string) => {
        set(state => ({
          downloads: state.downloads.map(download =>
            download.id === downloadId
              ? { ...download, filePath }
              : download
          ),
        }));
      },
    }),
    {
      name: 'apk-market-storage',
      partialize: (state) => ({
        // 在缓存时间为0时，不持久化市场数据，只保存下载记录
        marketData: CACHE_DURATION > 0 ? state.marketData : null,
        lastUpdated: CACHE_DURATION > 0 ? state.lastUpdated : null,
        categories: CACHE_DURATION > 0 ? state.categories : [],
        downloads: state.downloads, // 始终保存下载记录
      }),
    }
  )
);
