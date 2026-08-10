import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RomInfo, RomDownloadState } from '../types/rom';
import { romDownloadService } from '../services/romDownloadService';
import { logService } from '../services/logService';

interface RomDownloadStore extends RomDownloadState {
  // Actions
  setDeviceCode: (deviceCode: string) => void;
  setManualInput: (isManual: boolean) => void;
  setRomList: (romList: RomInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDownloading: (downloading: boolean) => void;
  setDownloadProgress: (progress: number) => void;
  setCurrentDownload: (fileName: string | null) => void;
  setToken: (token: string) => void;
  setManualDeviceInfo: (info: { deviceName: string }) => void;
  setIsManualDeviceMode: (isManual: boolean) => void;
  
  // Methods
  fetchRomList: (deviceCode: string, token?: string) => Promise<void>;
  downloadRom: (rom: RomInfo, token?: string) => Promise<boolean>;
  reset: () => void;
}

const initialState: RomDownloadState & {
  token: string;
  manualDeviceInfo: { deviceName: string };
  isManualDeviceMode: boolean;
} = {
  deviceCode: '',
  isManualInput: false,
  romList: [],
  loading: false,
  error: null,
  downloading: false,
  downloadProgress: 0,
  currentDownload: null,
  token: import.meta.env.VITE_ROM_TOKEN || '',
  manualDeviceInfo: { deviceName: '' },
  isManualDeviceMode: false,
};

export const useRomDownloadStore = create<RomDownloadStore>()(
  persist(
    (set, _get) => ({
      ...initialState,
      
      // Setters
      setDeviceCode: (deviceCode: string) => set({ deviceCode }),
      setManualInput: (isManual: boolean) => set({ isManualInput: isManual }),
      setRomList: (romList: RomInfo[]) => set({ romList }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      setDownloading: (downloading: boolean) => set({ downloading }),
      setDownloadProgress: (progress: number) => set({ downloadProgress: progress }),
      setCurrentDownload: (fileName: string | null) => set({ currentDownload: fileName }),
      setToken: (token: string) => set({ token }),
      setManualDeviceInfo: (info: { deviceName: string }) => set({ manualDeviceInfo: info }),
      setIsManualDeviceMode: (isManual: boolean) => set({ isManualDeviceMode: isManual }),
      
      // Methods
      fetchRomList: async (deviceCode: string, token?: string) => {
        if (!deviceCode.trim()) {
          set({ error: '请输入设备代号', romList: [] });
          return;
        }
        
        set({ loading: true, error: null, romList: [] });
        
        try {
          const response = await romDownloadService.getRomList(deviceCode.trim(), token);
          
          if (response.status === '200') {
            // 将HashMap数据转换为RomInfo数组
            const romList: RomInfo[] = [];
            
            // 遍历data对象，提取ROM信息
            Object.entries(response.data).forEach(([key, value]) => {
              // API返回的数据格式是 "01": "OS1.0.6.0.TKHCNXM"
              // 所以value是版本号，key是序号
              const version = value;
              
              // 查找相关信息（假设API可能返回这些额外信息）
              const size = response.data[`size_${key}`] || '';
              const date = response.data[`date_${key}`] || '';
              const type = response.data[`type_${key}`] || '';
              
              romList.push({
                id: key,
                version,
                codename: deviceCode,
                size,
                rom_type: type || 'zip', // 默认为zip类型
                date,
                url: '',
                device_code: deviceCode
              });
            });
            
            set({ romList, loading: false });
            await logService.info(`成功获取到 ${response.count} 个ROM版本`, 'ROM下载');
          } else {
            set({ error: `获取ROM列表失败，状态码: ${response.status}`, loading: false });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          set({ error: errorMsg, loading: false });
          await logService.error(`获取ROM列表失败: ${errorMsg}`, 'ROM下载');
        }
      },
      
      downloadRom: async (rom: RomInfo, token?: string) => {
        set({ 
          downloading: true, 
          downloadProgress: 0, 
          currentDownload: `${rom.version} (${rom.rom_type})`,
          error: null 
        });
        
        try {
          const response = await romDownloadService.downloadRom(
            rom.device_code || '',
            rom.version,
            rom.rom_type,
            token,
            (progress) => set({ downloadProgress: progress })
          );
          
          if (response.status === '200') {
            await logService.info(`ROM下载成功: ${rom.version}`, 'ROM下载');
            set({ 
              downloading: false, 
              downloadProgress: 100, 
              currentDownload: null 
            });
            return true;
          } else {
            await logService.error(`ROM下载失败: 状态码 ${response.status}`, 'ROM下载');
            set({ 
              downloading: false, 
              downloadProgress: 0, 
              currentDownload: null,
              error: `下载失败，状态码: ${response.status}`
            });
            return false;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          set({ 
            downloading: false, 
            downloadProgress: 0, 
            currentDownload: null,
            error: errorMsg
          });
          await logService.error(`下载ROM失败: ${errorMsg}`, 'ROM下载');
          return false;
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'rom-download-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        manualDeviceInfo: state.manualDeviceInfo,
        isManualDeviceMode: state.isManualDeviceMode,
        deviceCode: state.deviceCode,
        isManualInput: state.isManualInput,
      }),
    }
  )
);