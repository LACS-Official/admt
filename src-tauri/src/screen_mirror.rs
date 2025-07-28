use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// 投屏质量设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenMirrorQuality {
    pub resolution: String,
    pub bitrate: u32,
    pub framerate: u32,
    pub codec: String,
}

/// 投屏配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenMirrorConfig {
    pub quality: ScreenMirrorQuality,
    #[serde(rename = "showTouches")]
    pub show_touches: bool,
    #[serde(rename = "stayAwake")]
    pub stay_awake: bool,
    #[serde(rename = "turnScreenOff")]
    pub turn_screen_off: bool,
    #[serde(rename = "recordScreen")]
    pub record_screen: bool,
    #[serde(rename = "audioEnabled")]
    pub audio_enabled: bool,
    #[serde(rename = "controlEnabled")]
    pub control_enabled: bool,
}

/// 投屏状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ScreenMirrorStatus {
    Disconnected,
    Connecting,
    Connected,
    Streaming,
    Paused,
    Error,
}

/// 投屏会话信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenMirrorSession {
    pub id: String,
    pub device_serial: String,
    pub device_name: Option<String>,
    pub status: ScreenMirrorStatus,
    pub config: ScreenMirrorConfig,
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub error: Option<String>,
    pub process_id: Option<u32>,
    pub server_port: Option<u16>,
    pub video_socket: Option<u16>,
    pub control_socket: Option<u16>,
}

/// 投屏统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenMirrorStats {
    pub session_id: String,
    pub duration: u64,
    pub frames_received: u64,
    pub frames_dropped: u64,
    pub average_fps: f32,
    pub current_bitrate: f32,
    pub network_latency: u32,
}

/// 投屏控制事件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ScreenMirrorControlEvent {
    Touch(TouchEventData),
    Key(KeyEventData),
    Scroll(ScrollEventData),
}

/// 触摸事件数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TouchEventData {
    pub action: String, // "down", "up", "move"
    pub x: f32,
    pub y: f32,
    pub pointer_id: Option<u32>,
}

/// 按键事件数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyEventData {
    pub action: String, // "down", "up"
    pub key_code: u32,
    pub meta_state: Option<u32>,
}

/// 滚动事件数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollEventData {
    pub x: f32,
    pub y: f32,
    pub delta_x: f32,
    pub delta_y: f32,
}

/// 投屏设备信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenMirrorDevice {
    pub serial: String,
    pub name: Option<String>,
    pub model: Option<String>,
    pub resolution: Option<String>,
    pub density: Option<u32>,
    pub orientation: Option<String>,
    #[serde(rename = "isSupported")]
    pub is_supported: bool,
    #[serde(rename = "supportedCodecs")]
    pub supported_codecs: Vec<String>,
}

/// 投屏错误信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenMirrorError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub session_id: Option<String>,
}

impl Default for ScreenMirrorQuality {
    fn default() -> Self {
        Self {
            resolution: "1280x720".to_string(),
            bitrate: 2,
            framerate: 30,
            codec: "h264".to_string(),
        }
    }
}

impl Default for ScreenMirrorConfig {
    fn default() -> Self {
        Self {
            quality: ScreenMirrorQuality::default(),
            show_touches: false,
            stay_awake: true,
            turn_screen_off: false,
            record_screen: false,
            audio_enabled: true,
            control_enabled: true,
        }
    }
}

impl ScreenMirrorSession {
    pub fn new(device_serial: String, config: ScreenMirrorConfig) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            device_serial,
            device_name: None,
            status: ScreenMirrorStatus::Disconnected,
            config,
            start_time: None,
            end_time: None,
            error: None,
            process_id: None,
            server_port: None,
            video_socket: None,
            control_socket: None,
        }
    }

    pub fn start(&mut self) {
        self.status = ScreenMirrorStatus::Connecting;
        self.start_time = Some(Utc::now());
        self.error = None;
    }

    pub fn set_connected(&mut self, process_id: u32, server_port: u16) {
        self.status = ScreenMirrorStatus::Connected;
        self.process_id = Some(process_id);
        self.server_port = Some(server_port);
    }

    pub fn set_streaming(&mut self) {
        self.status = ScreenMirrorStatus::Streaming;
    }

    pub fn set_error(&mut self, error: String) {
        self.status = ScreenMirrorStatus::Error;
        self.error = Some(error);
        self.end_time = Some(Utc::now());
    }

    pub fn stop(&mut self) {
        self.status = ScreenMirrorStatus::Disconnected;
        self.end_time = Some(Utc::now());
        self.process_id = None;
        self.server_port = None;
        self.video_socket = None;
        self.control_socket = None;
    }
}

/// 预设的投屏质量配置
pub fn get_quality_presets() -> HashMap<String, ScreenMirrorQuality> {
    let mut presets = HashMap::new();
    
    presets.insert("ultra".to_string(), ScreenMirrorQuality {
        resolution: "auto".to_string(),
        bitrate: 8,
        framerate: 60,
        codec: "h264".to_string(),
    });
    
    presets.insert("high".to_string(), ScreenMirrorQuality {
        resolution: "1920x1080".to_string(),
        bitrate: 4,
        framerate: 30,
        codec: "h264".to_string(),
    });
    
    presets.insert("medium".to_string(), ScreenMirrorQuality {
        resolution: "1280x720".to_string(),
        bitrate: 2,
        framerate: 30,
        codec: "h264".to_string(),
    });
    
    presets.insert("low".to_string(), ScreenMirrorQuality {
        resolution: "854x480".to_string(),
        bitrate: 1,
        framerate: 15,
        codec: "h264".to_string(),
    });
    
    presets
}
