// 投屏质量设置
export interface ScreenMirrorQuality {
  resolution: string; // 分辨率，如 "1920x1080", "1280x720", "auto"
  bitrate: number; // 比特率，单位 Mbps
  framerate: number; // 帧率，单位 fps
  codec: "h264" | "h265"; // 编码格式
}

// 投屏配置
export interface ScreenMirrorConfig {
  quality: ScreenMirrorQuality;
  showTouches: boolean; // 显示触摸点
  stayAwake: boolean; // 保持屏幕常亮
  turnScreenOff: boolean; // 投屏时关闭设备屏幕
  powerOffOnClose: boolean; // 关闭时关机
  noPowerOn: boolean; // 启动时不开机
  recordScreen: boolean; // 是否录制屏幕
  audioEnabled: boolean; // 是否传输音频
  controlEnabled: boolean; // 是否启用控制功能
  alwaysOnTop: boolean; // 投屏窗口始终置顶
  fullscreen: boolean; // 全屏模式
  windowTitle: string; // 窗口标题
  crop: string; // 屏幕裁剪，格式为"width:height:x:y"
  maxFps: number; // 最大帧率限制
  lockVideoOrientation: "unlocked" | "initial" | "portrait" | "landscape"; // 锁定视频方向
  rotation: number; // 屏幕旋转角度 (0, 1, 2, 3)
}

// 投屏状态
export type ScreenMirrorStatus = 
  | "disconnected" // 未连接
  | "connecting" // 连接中
  | "connected" // 已连接
  | "streaming" // 投屏中
  | "paused" // 暂停
  | "error"; // 错误状态

// 投屏会话信息
export interface ScreenMirrorSession {
  id: string;
  deviceSerial: string;
  deviceName?: string;
  status: ScreenMirrorStatus;
  config: ScreenMirrorConfig;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  processId?: number; // scrcpy 进程ID
  serverPort?: number; // 服务器端口
  videoSocket?: number; // 视频流端口
  controlSocket?: number; // 控制端口
}

// 投屏统计信息
export interface ScreenMirrorStats {
  sessionId: string;
  duration: number; // 投屏时长（秒）
  framesReceived: number; // 接收帧数
  framesDropped: number; // 丢帧数
  averageFps: number; // 平均帧率
  currentBitrate: number; // 当前比特率
  networkLatency: number; // 网络延迟（毫秒）
}

// 投屏控制事件
export interface ScreenMirrorControlEvent {
  type: "touch" | "key" | "scroll" | "gesture";
  timestamp: number;
  data: any; // 具体的控制数据
}

// 触摸事件数据
export interface TouchEventData {
  action: "down" | "up" | "move";
  x: number;
  y: number;
  pointerId?: number;
}

// 按键事件数据
export interface KeyEventData {
  action: "down" | "up";
  keyCode: number;
  metaState?: number;
}

// 滚动事件数据
export interface ScrollEventData {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
}

// 投屏设备信息
export interface ScreenMirrorDevice {
  serial: string;
  name?: string;
  model?: string;
  resolution?: string;
  density?: number;
  orientation?: "portrait" | "landscape";
  isSupported: boolean; // 是否支持投屏
  supportedCodecs: string[]; // 支持的编码格式
}

// 投屏错误类型
export interface ScreenMirrorError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  sessionId?: string;
}

// 预设的投屏质量配置
export const SCREEN_MIRROR_QUALITY_PRESETS: Record<string, ScreenMirrorQuality> = {
  "ultra": {
    resolution: "auto",
    bitrate: 12,
    framerate: 60,
    codec: "h264"
  },
  "high": {
    resolution: "1920x1080",
    bitrate: 8,
    framerate: 60,
    codec: "h264"
  },
  "balanced": {
    resolution: "1920x1080",
    bitrate: 4,
    framerate: 30,
    codec: "h264"
  },
  "medium": {
    resolution: "1280x720",
    bitrate: 2,
    framerate: 30,
    codec: "h264"
  },
  "low": {
    resolution: "854x480",
    bitrate: 1,
    framerate: 15,
    codec: "h264"
  },
  "gaming": {
    resolution: "1920x1080",
    bitrate: 10,
    framerate: 60,
    codec: "h264"
  },
  "powerSaving": {
    resolution: "1280x720",
    bitrate: 1,
    framerate: 15,
    codec: "h264"
  },
  "h265High": {
    resolution: "1920x1080",
    bitrate: 6,
    framerate: 60,
    codec: "h265"
  },
  "h265Balanced": {
    resolution: "1920x1080",
    bitrate: 3,
    framerate: 30,
    codec: "h265"
  }
};

// 默认投屏配置
export const DEFAULT_SCREEN_MIRROR_CONFIG: ScreenMirrorConfig = {
  quality: SCREEN_MIRROR_QUALITY_PRESETS.high,
  showTouches: false,
  stayAwake: true,
  turnScreenOff: false,
  powerOffOnClose: false,
  noPowerOn: false,
  recordScreen: false,
  audioEnabled: true,
  controlEnabled: true,
  alwaysOnTop: false,
  fullscreen: false,
  windowTitle: "HOUT投屏",
  crop: "",
  maxFps: 60,
  lockVideoOrientation: "unlocked",
  rotation: 0
};
