import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  ScreenMirrorSession, 
  ScreenMirrorConfig, 
  ScreenMirrorDevice, 
  ScreenMirrorStats,
  ScreenMirrorStatus,
  DEFAULT_SCREEN_MIRROR_CONFIG,
  SCREEN_MIRROR_QUALITY_PRESETS
} from '../types/screenMirror';

interface ScreenMirrorState {
  // 所有活动的投屏会话（支持多设备同时投屏）
  activeSessions: ScreenMirrorSession[];
  
  // 所有投屏会话历史
  sessions: ScreenMirrorSession[];
  
  // 支持投屏的设备列表
  supportedDevices: ScreenMirrorDevice[];
  
  // 当前选中的设备（用于UI显示）
  selectedDevice: ScreenMirrorDevice | null;
  
  // 投屏配置
  config: ScreenMirrorConfig;
  
  // 投屏统计信息
  stats: ScreenMirrorStats | null;
  
  // 是否正在加载
  isLoading: boolean;
  
  // 错误信息
  error: string | null;
  
  // 是否显示设置面板
  showSettings: boolean;
  
  // 是否全屏显示
  isFullscreen: boolean;
}

interface ScreenMirrorActions {
  // 添加活动会话
  addActiveSession: (session: ScreenMirrorSession) => void;
  
  // 移除活动会话
  removeActiveSession: (sessionId: string) => void;
  
  // 更新活动会话
  updateActiveSession: (sessionId: string, updates: Partial<ScreenMirrorSession>) => void;
  
  // 获取指定设备的活动会话
  getActiveSessionByDevice: (deviceSerial: string) => ScreenMirrorSession | null;
  
  // 添加会话到历史
  addSession: (session: ScreenMirrorSession) => void;
  
  // 更新会话状态
  updateSession: (sessionId: string, updates: Partial<ScreenMirrorSession>) => void;
  
  // 设置支持的设备列表
  setSupportedDevices: (devices: ScreenMirrorDevice[]) => void;
  
  // 选择设备
  selectDevice: (device: ScreenMirrorDevice | null) => void;
  
  // 更新配置
  updateConfig: (config: Partial<ScreenMirrorConfig>) => void;
  
  // 重置配置为默认值
  resetConfig: () => void;
  
  // 应用质量预设
  applyQualityPreset: (presetName: string) => void;
  
  // 设置统计信息
  setStats: (stats: ScreenMirrorStats | null) => void;
  
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  
  // 设置错误信息
  setError: (error: string | null) => void;
  
  // 切换设置面板显示
  toggleSettings: () => void;
  
  // 切换全屏模式
  toggleFullscreen: () => void;
  
  // 清理会话历史
  clearSessionHistory: () => void;
  
  // 获取指定设备的状态
  getDeviceStatus: (deviceSerial: string) => ScreenMirrorStatus;
  
  // 检查设备是否可以开始投屏
  canStartMirroring: (deviceSerial: string) => boolean;
  
  // 检查设备是否正在投屏
  isDeviceStreaming: (deviceSerial: string) => boolean;
  
  // 检查是否有任何设备正在投屏
  isAnyDeviceStreaming: () => boolean;
  
  // 处理投屏进程终止
  handleProcessTerminated: (sessionId: string) => void;
}

export const useScreenMirrorStore = create<ScreenMirrorState & ScreenMirrorActions>()(
  persist(
    (set, get) => ({
      // 初始状态
      activeSessions: [],
      sessions: [],
      supportedDevices: [],
      selectedDevice: null,
      config: DEFAULT_SCREEN_MIRROR_CONFIG,
      stats: null,
      isLoading: false,
      error: null,
      showSettings: false,
      isFullscreen: false,

      // Actions
      addActiveSession: (session) => set((state) => ({
        activeSessions: [...state.activeSessions, session]
      })),

      removeActiveSession: (sessionId) => set((state) => ({
        activeSessions: state.activeSessions.filter(session => session.id !== sessionId)
      })),

      updateActiveSession: (sessionId, updates) => set((state) => ({
        activeSessions: state.activeSessions.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      })),

      getActiveSessionByDevice: (deviceSerial) => {
        const { activeSessions } = get();
        return activeSessions.find(session => session.deviceSerial === deviceSerial) || null;
      },

      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session]
      })),

      updateSession: (sessionId, updates) => set((state) => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      })),

      setSupportedDevices: (devices) => set({ supportedDevices: devices }),

      selectDevice: (device) => set({ selectedDevice: device }),

      updateConfig: (configUpdates) => set((state) => ({
        config: { ...state.config, ...configUpdates }
      })),

      resetConfig: () => set({ config: DEFAULT_SCREEN_MIRROR_CONFIG }),

      applyQualityPreset: (presetName) => set((state) => {
        const preset = SCREEN_MIRROR_QUALITY_PRESETS[presetName];
        if (preset) {
          return {
            config: {
              ...state.config,
              quality: preset
            }
          };
        }
        return state;
      }),

      setStats: (stats) => set({ stats }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

      clearSessionHistory: () => set({ sessions: [] }),

      getDeviceStatus: (deviceSerial) => {
        const session = get().getActiveSessionByDevice(deviceSerial);
        return session?.status || 'disconnected';
      },

      canStartMirroring: (deviceSerial) => {
        const { activeSessions } = get();
        // 检查设备是否已经有正在投屏的会话
        const existingSession = activeSessions.find(session => session.deviceSerial === deviceSerial && session.status === 'streaming');
        return !existingSession;
      },

      isDeviceStreaming: (deviceSerial) => {
        const status = get().getDeviceStatus(deviceSerial);
        return status === 'streaming';
      },

      isAnyDeviceStreaming: () => {
        const { activeSessions } = get();
        return activeSessions.some(session => session.status === 'streaming');
      },

      handleProcessTerminated: (sessionId) => set((state) => {
        // 更新会话状态为已断开
        const updatedSessions = state.activeSessions.map(session =>
          session.id === sessionId ? { ...session, status: 'disconnected' as const } : session
        );
        
        // 从活动会话中移除
        const filteredSessions = updatedSessions.filter(session => session.id !== sessionId);
        
        return {
          activeSessions: filteredSessions
        };
      })
    }),
    {
      name: "hout-screen-mirror-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        showSettings: state.showSettings,
      }),
    }
  )
);
