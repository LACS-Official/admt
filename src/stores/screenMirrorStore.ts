import { create } from 'zustand';
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
  // 当前活动的投屏会话
  currentSession: ScreenMirrorSession | null;
  
  // 所有投屏会话历史
  sessions: ScreenMirrorSession[];
  
  // 支持投屏的设备列表
  supportedDevices: ScreenMirrorDevice[];
  
  // 当前选中的设备
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
  // 设置当前会话
  setCurrentSession: (session: ScreenMirrorSession | null) => void;
  
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
  
  // 获取当前会话状态
  getCurrentStatus: () => ScreenMirrorStatus;
  
  // 检查是否可以开始投屏
  canStartMirroring: () => boolean;
  
  // 检查是否正在投屏
  isStreaming: () => boolean;
}

export const useScreenMirrorStore = create<ScreenMirrorState & ScreenMirrorActions>((set, get) => ({
  // 初始状态
  currentSession: null,
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
  setCurrentSession: (session) => set({ currentSession: session }),

  addSession: (session) => set((state) => ({
    sessions: [...state.sessions, session]
  })),

  updateSession: (sessionId, updates) => set((state) => ({
    currentSession: state.currentSession?.id === sessionId 
      ? { ...state.currentSession, ...updates }
      : state.currentSession,
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

  getCurrentStatus: () => {
    const { currentSession } = get();
    return currentSession?.status || 'disconnected';
  },

  canStartMirroring: () => {
    const { selectedDevice, currentSession } = get();
    return selectedDevice !== null && 
           selectedDevice.isSupported && 
           (!currentSession || currentSession.status === 'disconnected');
  },

  isStreaming: () => {
    const { currentSession } = get();
    return currentSession?.status === 'streaming';
  }
}));
