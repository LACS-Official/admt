import { invoke } from '@tauri-apps/api/core';
import { RomListResponse, RomDownloadResponse } from '../types/rom';
import { logService } from './logService';

export class RomDownloadService {
  private static instance: RomDownloadService;
  
  private constructor() {}
  
  public static getInstance(): RomDownloadService {
    if (!RomDownloadService.instance) {
      RomDownloadService.instance = new RomDownloadService();
    }
    return RomDownloadService.instance;
  }

  /**
   * 获取ROM列表
   */
  async getRomList(deviceCode: string, token?: string): Promise<RomListResponse> {
    try {
      await logService.info(`正在获取设备 ${deviceCode} 的ROM列表`, 'ROM下载服务');
      const response = await invoke<RomListResponse>('fetch_rom_list', { deviceCode, token });
      
      if (response.status === '200') {
        await logService.info(`成功获取到 ${response.count} 个ROM版本`, 'ROM下载服务');
      } else {
        await logService.error(`获取ROM列表失败: 状态码 ${response.status}`, 'ROM下载服务');
      }
      
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      await logService.error(`获取ROM列表异常: ${errorMsg}`, 'ROM下载服务');
      throw error;
    }
  }

  /**
   * 获取ROM下载链接
   */
  async getRomDownloadUrl(
    deviceCode: string,
    version: string,
    fileType: string,
    token?: string
  ): Promise<RomDownloadResponse> {
    try {
      await logService.info(`正在获取ROM下载链接: ${deviceCode} ${version} (${fileType})`, 'ROM下载服务');
      const response = await invoke<RomDownloadResponse>('get_rom_download_url', { 
        deviceCode, 
        version, 
        fileType, 
        token 
      });
      
      if (response.status === '200') {
        await logService.info(`成功获取ROM下载链接`, 'ROM下载服务');
      } else {
        await logService.error(`获取ROM下载链接失败: 状态码 ${response.status}`, 'ROM下载服务');
      }
      
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      await logService.error(`获取ROM下载链接异常: ${errorMsg}`, 'ROM下载服务');
      throw error;
    }
  }

  /**
   * 下载ROM
   */
  async downloadRom(
    deviceCode: string,
    version: string,
    fileType: string,
    token?: string,
    onProgress?: (progress: number) => void
  ): Promise<RomDownloadResponse> {
    try {
      await logService.info(`正在下载ROM: ${deviceCode} ${version} (${fileType})`, 'ROM下载服务');
      
      // 模拟进度更新
      if (onProgress) {
        onProgress(10);
      }
      
      const response = await invoke<RomDownloadResponse>('download_rom', { 
        deviceCode, 
        version, 
        fileType, 
        token 
      });
      
      if (onProgress) {
        onProgress(100);
      }
      
      if (response.status === '200') {
        await logService.info(`ROM下载成功: ${response.device_code} ${response.version}`, 'ROM下载服务');
      } else {
        await logService.error(`ROM下载失败: 状态码 ${response.status}`, 'ROM下载服务');
      }
      
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      await logService.error(`下载ROM异常: ${errorMsg}`, 'ROM下载服务');
      throw error;
    }
  }

}

// 导出单例实例
export const romDownloadService = RomDownloadService.getInstance();