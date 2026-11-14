//! Scrcpy 投屏按键映射系统
//! 提供 Windows 端全局/窗口按键监听、坐标换算、高频连点、WASD方向轮盘、滑动映射
//! 支持 Window 消息极速直连模式（<1ms延迟）与 ADB 后台持久化会话双通道注入

use crate::error::{AdmtError, Result};
use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;
#[cfg(windows)]
use std::time::Instant;
use tauri::State;

#[cfg(windows)]
use winapi::shared::minwindef::{BOOL, LPARAM, LRESULT, WPARAM};
#[cfg(windows)]
use winapi::shared::windef::{HWND, RECT};
#[cfg(windows)]
use winapi::um::winuser::*;

/// 按键映射动作类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum KeyActionType {
    /// 普通点击（按下down，抬起up）
    Click,
    /// 高频极速连点（按住时按设定频率持续点击）
    Burst,
    /// 方向摇杆/轮盘（WASD，具有中心坐标与滑动半径）
    Joystick,
    /// 定向划屏（从起点到终点滑动指定时长）
    Swipe,
}

impl Default for KeyActionType {
    fn default() -> Self {
        KeyActionType::Click
    }
}

/// 注入模式
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum InjectionMode {
    /// 投屏窗口极速直连（通过 scrcpy SDL2 窗口消息分发，延迟 < 1ms，极适合游戏）
    DirectWindow,
    /// ADB 管道持久输入（通过后台持久 sh 进程流式发送）
    AdbStream,
    /// 自动模式（检测到窗口激活时直连，否则回退到 ADB）
    Auto,
}

impl Default for InjectionMode {
    fn default() -> Self {
        InjectionMode::Auto
    }
}

/// 单个按键映射项
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyMappingItem {
    pub id: String,
    pub name: String,
    /// 绑定的主按键（例如 "J", "Space", "F", "W"）
    pub key: String,
    pub action_type: KeyActionType,
    /// 标准化 X 坐标（0.0 ~ 1.0）
    pub x: f32,
    /// 标准化 Y 坐标（0.0 ~ 1.0）
    pub y: f32,
    /// 连点频率（次/秒，例如 5 ~ 30）
    pub burst_rate: Option<u32>,
    /// 摇杆移动半径（0.05 ~ 0.30）
    pub radius: Option<f32>,
    /// 摇杆按键配置
    pub key_up: Option<String>,
    pub key_down: Option<String>,
    pub key_left: Option<String>,
    pub key_right: Option<String>,
    /// 滑动终点坐标
    pub end_x: Option<f32>,
    pub end_y: Option<f32>,
    /// 滑动耗时（毫秒）
    pub duration_ms: Option<u32>,
}

/// 按键映射预设配置档案
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyMappingProfile {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub orientation: Option<String>, // "landscape" 或 "portrait"
    pub items: Vec<KeyMappingItem>,
}

/// 运行时配置
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct KeyMappingConfig {
    pub device_serial: String,
    pub window_title: Option<String>,
    pub injection_mode: InjectionMode,
    /// 仅在投屏窗口获得焦点时生效
    pub active_window_only: bool,
    pub profile: KeyMappingProfile,
}

/// 设备屏幕尺寸与 ADB 输入能力
///
/// 之前版本把分辨率硬编码成 1080x2400，在 720p / 2K / 平板 / 折叠屏上
/// 所有归一化坐标都会算错，且 `input motionevent` 在不少 ROM 上并不存在，
/// 这两点是按键映射"启动了却没反应"的主要原因。
#[derive(Debug, Clone, Copy)]
struct ScreenMetrics {
    /// 物理短边
    short_side: u32,
    /// 物理长边
    long_side: u32,
    /// 设备是否支持 `input motionevent DOWN/UP/MOVE`
    supports_motion_event: bool,
}

impl Default for ScreenMetrics {
    fn default() -> Self {
        Self {
            short_side: 1080,
            long_side: 2400,
            supports_motion_event: false,
        }
    }
}

impl ScreenMetrics {
    /// 返回当前方向下 `input` 命令使用的坐标系宽高
    fn base_size(&self, landscape: bool) -> (i32, i32) {
        if landscape {
            (self.long_side as i32, self.short_side as i32)
        } else {
            (self.short_side as i32, self.long_side as i32)
        }
    }
}

/// 归一化坐标 -> 设备像素坐标
fn to_pixels(metrics: &ScreenMetrics, config: &KeyMappingConfig, x: f32, y: f32) -> (i32, i32) {
    let landscape = config.profile.orientation.as_deref() == Some("landscape");
    let (w, h) = metrics.base_size(landscape);
    (
        (x.clamp(0.0, 1.0) * w as f32) as i32,
        (y.clamp(0.0, 1.0) * h as f32) as i32,
    )
}

/// Windows 下隐藏 adb 子进程的控制台窗口
#[cfg(windows)]
fn hide_console(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn hide_console(_cmd: &mut Command) {}

/// 读取 `wm size`，返回 (短边, 长边)；读取失败时回退到 1080x2400
fn query_screen_size(adb_path: &PathBuf, serial: &str) -> (u32, u32) {
    let mut result = (1080u32, 2400u32);
    let mut size_cmd = Command::new(adb_path);
    size_cmd.args(["-s", serial, "shell", "wm", "size"]);
    hide_console(&mut size_cmd);
    if let Ok(out) = size_cmd.output() {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines() {
            if let Some(token) = line.split_whitespace().last() {
                if let Some((w, h)) = token.split_once('x') {
                    if let (Ok(w), Ok(h)) = (w.parse::<u32>(), h.parse::<u32>()) {
                        if w > 0 && h > 0 {
                            result = (w.min(h), w.max(h));
                        }
                    }
                }
            }
        }
    }
    result
}

/// 读取设备真实分辨率并探测 `input motionevent` 能力
fn query_screen_metrics(adb_path: &PathBuf, serial: &str) -> ScreenMetrics {
    let mut metrics = ScreenMetrics::default();

    // 1) wm size，形如 "Physical size: 1080x2400" / "Override size: 1080x2400"
    let (short_side, long_side) = query_screen_size(adb_path, serial);
    metrics.short_side = short_side;
    metrics.long_side = long_side;

    // 2) 用一组无害的 DOWN/UP 探测能力，避免依赖各 ROM 的 help 输出格式
    let mut probe = Command::new(adb_path);
    probe.args([
        "-s",
        serial,
        "shell",
        "input",
        "motionevent",
        "DOWN",
        "1",
        "1",
    ]);
    hide_console(&mut probe);
    if let Ok(out) = probe.output() {
        let combined = format!(
            "{}{}",
            String::from_utf8_lossy(&out.stdout),
            String::from_utf8_lossy(&out.stderr)
        )
        .to_lowercase();
        let supported = out.status.success()
            && !combined.contains("unknown")
            && !combined.contains("error")
            && !combined.contains("not found")
            && !combined.contains("usage:")
            && !combined.contains("invalid");
        metrics.supports_motion_event = supported;
        if supported {
            // 必须立刻抬起，否则会在屏幕上留下一个按下的触点
            let mut up = Command::new(adb_path);
            up.args([
                "-s",
                serial,
                "shell",
                "input",
                "motionevent",
                "UP",
                "1",
                "1",
            ]);
            hide_console(&mut up);
            let _ = up.output();
        }
    }

    log::info!(
        "KeyMapping screen metrics: {}x{}, motionevent={}",
        metrics.short_side,
        metrics.long_side,
        metrics.supports_motion_event
    );
    metrics
}

/// 持久化 ADB Shell 会话
struct AdbTouchSession {
    child: Child,
    stdin: ChildStdin,
    metrics: ScreenMetrics,
}

impl AdbTouchSession {
    pub fn new(serial: &str) -> Result<Self> {
        let adb_path = crate::cache::get_cached_adb_path();

        // 设备不在线时明确失败，避免"UI 显示已启动、实际一条命令都发不出去"
        let mut state_cmd = Command::new(&adb_path);
        state_cmd.args(["-s", serial, "get-state"]);
        hide_console(&mut state_cmd);
        let state = state_cmd
            .output()
            .map_err(|e| AdmtError::AdbCommandFailed {
                message: format!("无法执行 adb get-state: {}", e),
            })?;
        let state_text = String::from_utf8_lossy(&state.stdout).trim().to_string();
        if !state.status.success() || state_text != "device" {
            return Err(AdmtError::DeviceNotReady {
                serial: serial.to_string(),
                state: if state_text.is_empty() {
                    "no device".to_string()
                } else {
                    state_text
                },
            });
        }

        let metrics = query_screen_metrics(&adb_path, serial);

        let mut cmd = Command::new(adb_path);
        cmd.args(["-s", serial, "shell"])
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        hide_console(&mut cmd);

        let mut child = cmd
            .spawn()
            .map_err(|e| AdmtError::Process(format!("启动 ADB 触控守护会话失败: {}", e)))?;
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| AdmtError::Process("无法获取 ADB 标准输入通道".to_string()))?;

        Ok(Self {
            child,
            stdin,
            metrics,
        })
    }

    pub fn send_command(&mut self, cmd: &str) {
        let _ = writeln!(self.stdin, "{}", cmd);
        let _ = self.stdin.flush();
    }

    fn tap(&mut self, px: i32, py: i32) {
        self.send_command(&format!("input tap {} {}", px, py));
    }

    fn motion(&mut self, action: &str, px: i32, py: i32) {
        self.send_command(&format!("input motionevent {} {} {}", action, px, py));
    }

    fn swipe(&mut self, sx: i32, sy: i32, ex: i32, ey: i32, duration_ms: u32) {
        self.send_command(&format!(
            "input swipe {} {} {} {} {}",
            sx, sy, ex, ey, duration_ms
        ));
    }
}

impl Drop for AdbTouchSession {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// 串行化后的按键事件，保证 down/up 顺序不被线程调度打乱
struct KeyEvent {
    key: String,
    is_down: bool,
    config: KeyMappingConfig,
}

/// 全局按键映射状态管理器
pub struct KeyMappingManager {
    is_running: Arc<AtomicBool>,
    config: Arc<Mutex<Option<KeyMappingConfig>>>,
    adb_session: Arc<Mutex<Option<AdbTouchSession>>>,
    /// 连点器取消标记列表 (mapping_id -> cancel_flag)
    burst_tasks: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    /// 当前按下的按键集合
    pressed_keys: Arc<Mutex<HashSet<String>>>,
    /// 摇杆当前激活的方向状态
    joystick_state: Arc<Mutex<JoystickState>>,
    /// 按键事件串行队列（hook 回调与前端桥接共用）
    event_tx: Arc<Mutex<Option<mpsc::Sender<KeyEvent>>>>,
    #[cfg(windows)]
    hook_handle: Arc<Mutex<Option<usize>>>,
    #[cfg(windows)]
    hook_thread_id: Arc<Mutex<Option<u32>>>,
}

#[derive(Default)]
struct JoystickState {
    is_active: bool,
    center_x: f32,
    center_y: f32,
    radius: f32,
    up: bool,
    down: bool,
    left: bool,
    right: bool,
    /// 无 motionevent 能力时，用于避免同一方向重复发送 swipe
    last_dir: Option<(i8, i8)>,
}

impl KeyMappingManager {
    pub fn new() -> Self {
        Self {
            is_running: Arc::new(AtomicBool::new(false)),
            config: Arc::new(Mutex::new(None)),
            adb_session: Arc::new(Mutex::new(None)),
            burst_tasks: Arc::new(Mutex::new(HashMap::new())),
            pressed_keys: Arc::new(Mutex::new(HashSet::new())),
            joystick_state: Arc::new(Mutex::new(JoystickState::default())),
            event_tx: Arc::new(Mutex::new(None)),
            #[cfg(windows)]
            hook_handle: Arc::new(Mutex::new(None)),
            #[cfg(windows)]
            hook_thread_id: Arc::new(Mutex::new(None)),
        }
    }
}

// 全局静态单例引用，供 Windows 低阶 Hook 回调与前端键盘桥接安全访问
static GLOBAL_MANAGER: OnceCell<Arc<KeyMappingManagerInternal>> = OnceCell::new();

struct KeyMappingManagerInternal {
    is_running: Arc<AtomicBool>,
    config: Arc<Mutex<Option<KeyMappingConfig>>>,
    adb_session: Arc<Mutex<Option<AdbTouchSession>>>,
    burst_tasks: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    pressed_keys: Arc<Mutex<HashSet<String>>>,
    joystick_state: Arc<Mutex<JoystickState>>,
    event_tx: Arc<Mutex<Option<mpsc::Sender<KeyEvent>>>>,
}

// ---------------- Windows 原生底层键盘 Hook 与注入 ----------------

#[cfg(windows)]
unsafe extern "system" fn low_level_keyboard_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if n_code >= 0 && (w_param == WM_KEYDOWN as usize || w_param == WM_KEYUP as usize || w_param == WM_SYSKEYDOWN as usize || w_param == WM_SYSKEYUP as usize) {
        if let Some(manager) = GLOBAL_MANAGER.get() {
            if manager.is_running.load(Ordering::SeqCst) {
                let kbd_struct = *(l_param as *const KBDLLHOOKSTRUCT);
                let vk_code = kbd_struct.vkCode;
                let is_down = w_param == WM_KEYDOWN as usize || w_param == WM_SYSKEYDOWN as usize;

                let key_name = vk_to_key_name(vk_code);

                // 检查前台窗口
                let config_guard = manager.config.lock().unwrap();
                if let Some(config) = config_guard.as_ref() {
                    let should_process = if config.active_window_only {
                        is_target_window_active(config.window_title.as_deref())
                    } else {
                        true
                    };

                    if should_process && !key_name.is_empty() {
                        let config_clone = config.clone();
                        drop(config_guard);

                        // 统一投递到串行 worker：既避免在 Hook 回调里阻塞系统输入队列，
                        // 也保证 down/up 不会因多线程并发而乱序（乱序会导致点击丢失、摇杆卡死）。
                        let tx = manager.event_tx.lock().unwrap().as_ref().cloned();
                        if let Some(tx) = tx {
                            let _ = tx.send(KeyEvent {
                                key: key_name,
                                is_down,
                                config: config_clone,
                            });
                        }
                    }
                }
            }
        }
    }

    CallNextHookEx(std::ptr::null_mut(), n_code, w_param, l_param)
}

impl KeyMappingManagerInternal {
    fn handle_key_event(&self, key: &str, is_down: bool, config: &KeyMappingConfig) {
        if !self.is_running.load(Ordering::SeqCst) {
            return;
        }

        let key_upper = key.to_uppercase();

        // 维护按下按键状态集合，避免操作系统按键重复连发（Key Repeat）干扰。
        // up 也做去重：Windows 全局 Hook 与应用内键盘桥接可能同时上报同一次抬起，
        // 若重复处理，降级为 input tap 的点击会变成双击。
        {
            let mut pressed = self.pressed_keys.lock().unwrap();
            if is_down {
                if !pressed.insert(key_upper.clone()) {
                    return;
                }
            } else if !pressed.remove(&key_upper) {
                return;
            }
        }

        // 查找映射项
        for item in &config.profile.items {
            match item.action_type {
                KeyActionType::Click => {
                    if item.key.eq_ignore_ascii_case(&key_upper) {
                        self.execute_click(item, is_down, config);
                    }
                }
                KeyActionType::Burst => {
                    if item.key.eq_ignore_ascii_case(&key_upper) {
                        self.execute_burst(item, is_down, config);
                    }
                }
                KeyActionType::Joystick => {
                    let up_k = item.key_up.as_deref().unwrap_or("W");
                    let down_k = item.key_down.as_deref().unwrap_or("S");
                    let left_k = item.key_left.as_deref().unwrap_or("A");
                    let right_k = item.key_right.as_deref().unwrap_or("D");

                    if up_k.eq_ignore_ascii_case(&key_upper)
                        || down_k.eq_ignore_ascii_case(&key_upper)
                        || left_k.eq_ignore_ascii_case(&key_upper)
                        || right_k.eq_ignore_ascii_case(&key_upper)
                    {
                        self.execute_joystick(item, &key_upper, is_down, config);
                    }
                }
                KeyActionType::Swipe => {
                    if item.key.eq_ignore_ascii_case(&key_upper) && is_down {
                        self.execute_swipe(item, config);
                    }
                }
            }
        }
    }

    /// 执行普通单点（按下/松开）
    fn execute_click(&self, item: &KeyMappingItem, is_down: bool, config: &KeyMappingConfig) {
        log::debug!(
            "KeyMapping: Click key={} down={} at ({}, {})",
            item.key,
            is_down,
            item.x,
            item.y
        );

        inject_touch(config, &self.adb_session, item.x, item.y, is_down, true);
    }

    /// 执行高频连点
    fn execute_burst(&self, item: &KeyMappingItem, is_down: bool, config: &KeyMappingConfig) {
        let item_id = item.id.clone();
        let mut burst_tasks = self.burst_tasks.lock().unwrap();

        if is_down {
            // 如果已有在运行的连点任务，先终止
            if let Some(cancel) = burst_tasks.get(&item_id) {
                cancel.store(true, Ordering::SeqCst);
            }

            let cancel_token = Arc::new(AtomicBool::new(false));
            burst_tasks.insert(item_id, cancel_token.clone());

            let rate = item.burst_rate.unwrap_or(12).clamp(1, 40);
            let period_ms = (1000 / rate).max(15);
            let click_down_ms = (period_ms / 3).clamp(5, 25);
            let rest_ms = period_ms.saturating_sub(click_down_ms);

            let item_clone = item.clone();
            let config_clone = config.clone();
            let adb_session_arc = self.adb_session.clone();

            std::thread::spawn(move || {
                log::info!("KeyMapping: Burst started for key={}", item_clone.key);
                while !cancel_token.load(Ordering::SeqCst) {
                    // Down
                    inject_touch(
                        &config_clone,
                        &adb_session_arc,
                        item_clone.x,
                        item_clone.y,
                        true,
                        true,
                    );
                    std::thread::sleep(std::time::Duration::from_millis(click_down_ms as u64));

                    // Up
                    inject_touch(
                        &config_clone,
                        &adb_session_arc,
                        item_clone.x,
                        item_clone.y,
                        false,
                        true,
                    );
                    std::thread::sleep(std::time::Duration::from_millis(rest_ms as u64));
                }

                // 退出时确保松开
                inject_touch(
                    &config_clone,
                    &adb_session_arc,
                    item_clone.x,
                    item_clone.y,
                    false,
                    false,
                );
                log::info!("KeyMapping: Burst stopped for key={}", item_clone.key);
            });
        } else {
            // 抬起按键，停止连点
            if let Some(cancel) = burst_tasks.remove(&item_id) {
                cancel.store(true, Ordering::SeqCst);
            }
        }
    }

    /// 执行方向轮盘/摇杆
    fn execute_joystick(
        &self,
        item: &KeyMappingItem,
        key: &str,
        is_down: bool,
        config: &KeyMappingConfig,
    ) {
        let mut state = self.joystick_state.lock().unwrap();

        let up_k = item.key_up.as_deref().unwrap_or("W");
        let down_k = item.key_down.as_deref().unwrap_or("S");
        let left_k = item.key_left.as_deref().unwrap_or("A");
        let right_k = item.key_right.as_deref().unwrap_or("D");

        if up_k.eq_ignore_ascii_case(key) {
            state.up = is_down;
        } else if down_k.eq_ignore_ascii_case(key) {
            state.down = is_down;
        } else if left_k.eq_ignore_ascii_case(key) {
            state.left = is_down;
        } else if right_k.eq_ignore_ascii_case(key) {
            state.right = is_down;
        }

        state.center_x = item.x;
        state.center_y = item.y;
        state.radius = item.radius.unwrap_or(0.12).clamp(0.03, 0.35);

        let mut dx: f32 = 0.0;
        let mut dy: f32 = 0.0;

        if state.up {
            dy -= 1.0;
        }
        if state.down {
            dy += 1.0;
        }
        if state.left {
            dx -= 1.0;
        }
        if state.right {
            dx += 1.0;
        }

        let is_any_pressed = state.up || state.down || state.left || state.right;

        // 归一化方向向量
        let len = (dx * dx + dy * dy).sqrt();
        if len > 0.001 {
            dx /= len;
            dy /= len;
        }
        let target_x = (state.center_x + dx * state.radius).clamp(0.01, 0.99);
        let target_y = (state.center_y + dy * state.radius).clamp(0.01, 0.99);

        let supports_motion = self
            .adb_session
            .lock()
            .unwrap()
            .as_ref()
            .map(|s| s.metrics.supports_motion_event)
            .unwrap_or(false);

        if !supports_motion {
            // 设备没有 input motionevent：用「中心 -> 目标」短滑动近似摇杆，
            // 且只在方向变化时发一次，避免大量 swipe 堵住设备输入队列。
            let dir = (dx as i8, dy as i8);
            if is_any_pressed {
                if state.last_dir != Some(dir) {
                    state.last_dir = Some(dir);
                    inject_swipe_fallback(
                        config,
                        &self.adb_session,
                        state.center_x,
                        state.center_y,
                        target_x,
                        target_y,
                    );
                }
                state.is_active = true;
            } else {
                state.last_dir = None;
                state.is_active = false;
            }
            return;
        }

        if is_any_pressed {
            if !state.is_active {
                // 首次激活，先按下中心，再滑动到指定方向
                state.is_active = true;
                inject_touch(
                    config,
                    &self.adb_session,
                    state.center_x,
                    state.center_y,
                    true,
                    false,
                );
                std::thread::sleep(Duration::from_millis(8));
            }

            // 移动到目标坐标
            inject_move(config, &self.adb_session, target_x, target_y);
        } else if state.is_active {
            // 全部释放，抬起手指（摇杆不能走 tap 降级，否则会在中心多点一下）
            state.is_active = false;
            inject_touch(
                config,
                &self.adb_session,
                state.center_x,
                state.center_y,
                false,
                false,
            );
        }
    }

    /// 执行滑动
    fn execute_swipe(&self, item: &KeyMappingItem, config: &KeyMappingConfig) {
        let start_x = item.x;
        let start_y = item.y;
        let end_x = item.end_x.unwrap_or(item.x);
        let end_y = item.end_y.unwrap_or((item.y - 0.25).max(0.05));
        let duration_ms = item.duration_ms.unwrap_or(150).clamp(40, 1500);

        let config_clone = config.clone();
        let adb_session_arc = self.adb_session.clone();

        std::thread::spawn(move || {
            // 只有明确选择「窗口直连」才用 PostMessage。默认 auto 一律走 ADB，
            // 否则模糊匹配可能把鼠标消息投给标题含 ADMT 的应用主窗口。
            #[cfg(windows)]
            {
                if config_clone.injection_mode == InjectionMode::DirectWindow {
                    if let Some(hwnd) = find_scrcpy_window(config_clone.window_title.as_deref()) {
                        post_mouse_event_to_window(hwnd, start_x, start_y, true);
                        let steps = (duration_ms / 15).max(4);
                        for step in 1..=steps {
                            let t = step as f32 / steps as f32;
                            let cur_x = start_x + (end_x - start_x) * t;
                            let cur_y = start_y + (end_y - start_y) * t;
                            post_mouse_move_to_window(hwnd, cur_x, cur_y);
                            std::thread::sleep(Duration::from_millis(15));
                        }
                        post_mouse_event_to_window(hwnd, end_x, end_y, false);
                        return;
                    }
                }
            }

            let mut session_guard = adb_session_arc.lock().unwrap();
            if let Some(session) = session_guard.as_mut() {
                let (sx, sy) = to_pixels(&session.metrics, &config_clone, start_x, start_y);
                let (ex, ey) = to_pixels(&session.metrics, &config_clone, end_x, end_y);
                session.swipe(sx, sy, ex, ey, duration_ms);
            }
        });
    }
}

/// 统一触控下发函数
///
/// `tap_fallback` 为 true 时，若设备不支持 `input motionevent`，
/// 会在抬起时用标准 `input tap` 完成一次完整点击（Click / Burst）。
/// 摇杆必须传 false，否则松开摇杆会在中心点多出一次点击。
fn inject_touch(
    config: &KeyMappingConfig,
    adb_session: &Arc<Mutex<Option<AdbTouchSession>>>,
    x: f32,
    y: f32,
    is_down: bool,
    tap_fallback: bool,
) {
    #[cfg(windows)]
    {
        if config.injection_mode == InjectionMode::DirectWindow {
            if let Some(hwnd) = find_scrcpy_window(config.window_title.as_deref()) {
                post_mouse_event_to_window(hwnd, x, y, is_down);
                return;
            }
        }
    }

    let mut session_guard = adb_session.lock().unwrap();
    if let Some(session) = session_guard.as_mut() {
        let (px, py) = to_pixels(&session.metrics, config, x, y);
        if session.metrics.supports_motion_event {
            session.motion(if is_down { "DOWN" } else { "UP" }, px, py);
        } else if tap_fallback && !is_down {
            session.tap(px, py);
        }
    }
}

/// 统一移动下发函数（仅 motionevent 可用时有效）
fn inject_move(
    config: &KeyMappingConfig,
    adb_session: &Arc<Mutex<Option<AdbTouchSession>>>,
    x: f32,
    y: f32,
) {
    #[cfg(windows)]
    {
        if config.injection_mode == InjectionMode::DirectWindow {
            if let Some(hwnd) = find_scrcpy_window(config.window_title.as_deref()) {
                post_mouse_move_to_window(hwnd, x, y);
                return;
            }
        }
    }

    let mut session_guard = adb_session.lock().unwrap();
    if let Some(session) = session_guard.as_mut() {
        if session.metrics.supports_motion_event {
            let (px, py) = to_pixels(&session.metrics, config, x, y);
            session.motion("MOVE", px, py);
        }
    }
}

/// 无 motionevent 能力时的摇杆降级：用短滑动近似方向位移
fn inject_swipe_fallback(
    config: &KeyMappingConfig,
    adb_session: &Arc<Mutex<Option<AdbTouchSession>>>,
    sx: f32,
    sy: f32,
    ex: f32,
    ey: f32,
) {
    let mut session_guard = adb_session.lock().unwrap();
    if let Some(session) = session_guard.as_mut() {
        let (x1, y1) = to_pixels(&session.metrics, config, sx, sy);
        let (x2, y2) = to_pixels(&session.metrics, config, ex, ey);
        session.swipe(x1, y1, x2, y2, 120);
    }
}

// ---------------- Windows 窗口消息及前台检测辅助函数 ----------------

#[cfg(windows)]
fn find_scrcpy_window(custom_title: Option<&str>) -> Option<HWND> {
    struct SearchContext {
        target_title: Option<String>,
        found_hwnd: Option<HWND>,
    }

    let mut ctx = SearchContext {
        target_title: custom_title.map(|s| s.to_string()),
        found_hwnd: None,
    };

    unsafe extern "system" fn enum_windows_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam as *mut SearchContext);
        let mut title_buf = [0u16; 512];
        let len = GetWindowTextW(hwnd, title_buf.as_mut_ptr(), 512);
        if len > 0 {
            let title = String::from_utf16_lossy(&title_buf[..len as usize]);
            let matches = if let Some(target) = ctx.target_title.as_ref() {
                title.contains(target)
            } else {
                title.contains("scrcpy")
            };

            if matches && IsWindowVisible(hwnd) != 0 {
                ctx.found_hwnd = Some(hwnd);
                return 0; // 找到即终止枚举
            }
        }
        1
    }

    unsafe {
        EnumWindows(
            Some(enum_windows_callback),
            &mut ctx as *mut SearchContext as LPARAM,
        );
    }

    ctx.found_hwnd
}

#[cfg(windows)]
fn is_target_window_active(custom_title: Option<&str>) -> bool {
    unsafe {
        let fg = GetForegroundWindow();
        if fg.is_null() {
            return false;
        }

        let mut title_buf = [0u16; 512];
        let len = GetWindowTextW(fg, title_buf.as_mut_ptr(), 512);
        if len <= 0 {
            return false;
        }

        let title = String::from_utf16_lossy(&title_buf[..len as usize]);
        if let Some(target) = custom_title {
            if title.contains(target) {
                return true;
            }
        }

        // 只认精确标题或独立 scrcpy 窗口。应用主窗口的按键交给前端键盘桥接，
        // 避免模糊包含「ADMT / 玩机管家」把主窗口当成投屏窗口。
        title.contains("scrcpy")
    }
}

#[cfg(windows)]
fn post_mouse_event_to_window(hwnd: HWND, norm_x: f32, norm_y: f32, is_down: bool) {
    unsafe {
        let mut rect: RECT = std::mem::zeroed();
        GetClientRect(hwnd, &mut rect);

        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        if width <= 0 || height <= 0 {
            return;
        }

        let px = (norm_x * width as f32) as i32;
        let py = (norm_y * height as f32) as i32;

        let l_param = ((py as u32) << 16) | ((px as u32) & 0xFFFF);

        PostMessageW(hwnd, WM_MOUSEMOVE, 0, l_param as isize);
        if is_down {
            PostMessageW(hwnd, WM_LBUTTONDOWN, MK_LBUTTON, l_param as isize);
        } else {
            PostMessageW(hwnd, WM_LBUTTONUP, 0, l_param as isize);
        }
    }
}

#[cfg(windows)]
fn post_mouse_move_to_window(hwnd: HWND, norm_x: f32, norm_y: f32) {
    unsafe {
        let mut rect: RECT = std::mem::zeroed();
        GetClientRect(hwnd, &mut rect);

        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;

        if width <= 0 || height <= 0 {
            return;
        }

        let px = (norm_x * width as f32) as i32;
        let py = (norm_y * height as f32) as i32;
        let l_param = ((py as u32) << 16) | ((px as u32) & 0xFFFF);

        PostMessageW(hwnd, WM_MOUSEMOVE, MK_LBUTTON, l_param as isize);
    }
}

/// 键码映射到友好键名
fn vk_to_key_name(vk: u32) -> String {
    match vk {
        0x41..=0x5A => {
            // A - Z
            let ch = char::from_u32(vk).unwrap_or('?');
            ch.to_string()
        }
        0x30..=0x39 => {
            // 0 - 9
            let ch = char::from_u32(vk).unwrap_or('?');
            ch.to_string()
        }
        0x60..=0x69 => format!("Num{}", vk - 0x60),
        0x20 => "Space".to_string(),
        0x0D => "Enter".to_string(),
        0x1B => "Escape".to_string(),
        0x09 => "Tab".to_string(),
        0x10 | 0xA0 | 0xA1 => "Shift".to_string(),
        0x11 | 0xA2 | 0xA3 => "Control".to_string(),
        0x12 | 0xA4 | 0xA5 => "Alt".to_string(),
        0x14 => "CapsLock".to_string(),
        0x25 => "ArrowLeft".to_string(),
        0x26 => "ArrowUp".to_string(),
        0x27 => "ArrowRight".to_string(),
        0x28 => "ArrowDown".to_string(),
        0x70..=0x7B => format!("F{}", vk - 0x6F),
        0xC0 => "`".to_string(),
        0xBD => "-".to_string(),
        0xBB => "=".to_string(),
        0xDB => "[".to_string(),
        0xDD => "]".to_string(),
        0xDC => "\\".to_string(),
        0xBA => ";".to_string(),
        0xDE => "'".to_string(),
        0xBC => ",".to_string(),
        0xBE => ".".to_string(),
        0xBF => "/".to_string(),
        _ => String::new(),
    }
}

// ---------------- 预设档案配置文件存储路径 ----------------

fn get_profiles_file_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.lacs.admt");
    if !config_dir.exists() {
        let _ = fs::create_dir_all(&config_dir);
    }
    config_dir.join("key_mapping_profiles.json")
}

/// 默认内置预设
fn get_builtin_profiles() -> Vec<KeyMappingProfile> {
    vec![
        KeyMappingProfile {
            id: "preset_moba".to_string(),
            name: "MOBA 竞技 (王者/英雄联盟手游)".to_string(),
            description: Some("WASD 移动摇杆、J 普攻、K/L/U 技能组、B 回城".to_string()),
            orientation: Some("landscape".to_string()),
            items: vec![
                KeyMappingItem {
                    id: "moba_stick".to_string(),
                    name: "移动摇杆".to_string(),
                    key: "WASD".to_string(),
                    action_type: KeyActionType::Joystick,
                    x: 0.18,
                    y: 0.72,
                    radius: Some(0.12),
                    key_up: Some("W".to_string()),
                    key_down: Some("S".to_string()),
                    key_left: Some("A".to_string()),
                    key_right: Some("D".to_string()),
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "moba_attack".to_string(),
                    name: "普通攻击".to_string(),
                    key: "J".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.88,
                    y: 0.80,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "moba_skill1".to_string(),
                    name: "一技能".to_string(),
                    key: "K".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.78,
                    y: 0.85,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "moba_skill2".to_string(),
                    name: "二技能".to_string(),
                    key: "L".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.80,
                    y: 0.68,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "moba_skill3".to_string(),
                    name: "三技能 (大招)".to_string(),
                    key: "U".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.88,
                    y: 0.58,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "moba_recall".to_string(),
                    name: "回城".to_string(),
                    key: "B".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.60,
                    y: 0.90,
                    ..Default::default()
                },
            ],
        },
        KeyMappingProfile {
            id: "preset_fps".to_string(),
            name: "FPS 射击/吃鸡".to_string(),
            description: Some("WASD 移动摇杆、Space 跳跃、C 蹲下、R 换弹、J 开火".to_string()),
            orientation: Some("landscape".to_string()),
            items: vec![
                KeyMappingItem {
                    id: "fps_stick".to_string(),
                    name: "移动摇杆".to_string(),
                    key: "WASD".to_string(),
                    action_type: KeyActionType::Joystick,
                    x: 0.18,
                    y: 0.72,
                    radius: Some(0.12),
                    key_up: Some("W".to_string()),
                    key_down: Some("S".to_string()),
                    key_left: Some("A".to_string()),
                    key_right: Some("D".to_string()),
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "fps_fire".to_string(),
                    name: "射击开火".to_string(),
                    key: "J".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.88,
                    y: 0.75,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "fps_jump".to_string(),
                    name: "跳跃".to_string(),
                    key: "Space".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.92,
                    y: 0.60,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "fps_crouch".to_string(),
                    name: "下蹲".to_string(),
                    key: "C".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.82,
                    y: 0.88,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "fps_reload".to_string(),
                    name: "换弹".to_string(),
                    key: "R".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.75,
                    y: 0.75,
                    ..Default::default()
                },
            ],
        },
        KeyMappingProfile {
            id: "preset_action".to_string(),
            name: "动作 / RPG (原神 / 崩铁 / 绝区零)".to_string(),
            description: Some("WASD 移动摇杆、J 普攻、Space 冲刺/闪避、E 战技、Q 爆发大招、F 交互拾取".to_string()),
            orientation: Some("landscape".to_string()),
            items: vec![
                KeyMappingItem {
                    id: "act_stick".to_string(),
                    name: "移动摇杆".to_string(),
                    key: "WASD".to_string(),
                    action_type: KeyActionType::Joystick,
                    x: 0.18,
                    y: 0.72,
                    radius: Some(0.12),
                    key_up: Some("W".to_string()),
                    key_down: Some("S".to_string()),
                    key_left: Some("A".to_string()),
                    key_right: Some("D".to_string()),
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "act_attack".to_string(),
                    name: "普通攻击".to_string(),
                    key: "J".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.88,
                    y: 0.80,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "act_dash".to_string(),
                    name: "冲刺 / 闪避".to_string(),
                    key: "Space".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.92,
                    y: 0.64,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "act_skill_e".to_string(),
                    name: "元素战技 (E)".to_string(),
                    key: "E".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.78,
                    y: 0.82,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "act_burst_q".to_string(),
                    name: "元素爆发 (Q)".to_string(),
                    key: "Q".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.82,
                    y: 0.65,
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "act_interact_f".to_string(),
                    name: "交互 / 拾取 (F)".to_string(),
                    key: "F".to_string(),
                    action_type: KeyActionType::Click,
                    x: 0.68,
                    y: 0.60,
                    ..Default::default()
                },
            ],
        },
        KeyMappingProfile {
            id: "preset_burst".to_string(),
            name: "高频连点".to_string(),
            description: Some("按住 J 或 Space 触发连点动作".to_string()),
            orientation: Some("portrait".to_string()),
            items: vec![
                KeyMappingItem {
                    id: "burst_attack".to_string(),
                    name: "连点 A".to_string(),
                    key: "J".to_string(),
                    action_type: KeyActionType::Burst,
                    x: 0.50,
                    y: 0.75,
                    burst_rate: Some(20),
                    ..Default::default()
                },
                KeyMappingItem {
                    id: "burst_space".to_string(),
                    name: "连点 B".to_string(),
                    key: "Space".to_string(),
                    action_type: KeyActionType::Burst,
                    x: 0.50,
                    y: 0.85,
                    burst_rate: Some(15),
                    ..Default::default()
                },
            ],
        },
    ]
}

// ---------------- Tauri 命令接口 ----------------

/// 启动按键映射服务
#[tauri::command]
pub async fn start_key_mapping(
    config: KeyMappingConfig,
    state: State<'_, KeyMappingManager>,
) -> Result<bool> {
    log::info!(
        "Starting key mapping for device: {}, mode: {:?}",
        config.device_serial,
        config.injection_mode
    );

    // 1. 初始化 ADB 持久化会话。失败要如实报错，不能像旧版那样 .ok() 后
    //    仍然返回 true，造成「UI 显示已启动、实际一条命令都发不出去」。
    let adb_session = AdbTouchSession::new(&config.device_serial)?;

    // 2. 存储配置与会话
    {
        let mut cfg = state.config.lock().unwrap();
        *cfg = Some(config.clone());
    }
    {
        let mut session = state.adb_session.lock().unwrap();
        *session = Some(adb_session);
    }

    // 3. 注册全局单例 + 串行按键 worker（Hook 与前端桥接共用同一条队列）
    let _ = GLOBAL_MANAGER.get_or_init(|| {
        let (tx, rx) = mpsc::channel::<KeyEvent>();
        *state.event_tx.lock().unwrap() = Some(tx.clone());
        let internal = Arc::new(KeyMappingManagerInternal {
            is_running: state.is_running.clone(),
            config: state.config.clone(),
            adb_session: state.adb_session.clone(),
            burst_tasks: state.burst_tasks.clone(),
            pressed_keys: state.pressed_keys.clone(),
            joystick_state: state.joystick_state.clone(),
            event_tx: Arc::new(Mutex::new(Some(tx))),
        });
        let worker = Arc::clone(&internal);
        std::thread::spawn(move || {
            while let Ok(evt) = rx.recv() {
                worker.handle_key_event(&evt.key, evt.is_down, &evt.config);
            }
        });
        internal
    });

    state.is_running.store(true, Ordering::SeqCst);

    // 4. 启动 Windows 原生底层键盘 Hook 线程（仅用于独立投屏窗口）
    #[cfg(windows)]
    {
        let hook_handle_arc = state.hook_handle.clone();
        let hook_thread_id_arc = state.hook_thread_id.clone();

        // 若已有 hook 先请求退出，并等待它真正卸载，避免热重载时累积多个钩子
        stop_windows_hook(&hook_thread_id_arc);
        if wait_hook_exit(&hook_thread_id_arc, Duration::from_millis(600)) {
            std::thread::spawn(move || unsafe {
                let h_instance = winapi::um::libloaderapi::GetModuleHandleW(std::ptr::null());
                let hook = SetWindowsHookExW(
                    WH_KEYBOARD_LL,
                    Some(low_level_keyboard_proc),
                    h_instance,
                    0,
                );

                if hook.is_null() {
                    log::error!("Failed to install WH_KEYBOARD_LL hook");
                    return;
                }

                let thread_id = winapi::um::processthreadsapi::GetCurrentThreadId();
                *hook_handle_arc.lock().unwrap() = Some(hook as usize);

                let mut msg: MSG = std::mem::zeroed();
                // 预热消息队列：否则启动瞬间的 PostThreadMessage(WM_QUIT) 会丢失
                PeekMessageW(&mut msg, std::ptr::null_mut(), 0, 0, PM_NOREMOVE);
                *hook_thread_id_arc.lock().unwrap() = Some(thread_id);

                log::info!(
                    "Windows Low-Level Keyboard Hook installed (Thread ID: {})",
                    thread_id
                );

                while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
                    TranslateMessage(&msg);
                    DispatchMessageW(&msg);
                }

                // 只由拥有 hook 的线程卸载，避免旧实现里的双重 UnhookWindowsHookEx
                UnhookWindowsHookEx(hook);
                *hook_handle_arc.lock().unwrap() = None;
                *hook_thread_id_arc.lock().unwrap() = None;
                log::info!("Windows Low-Level Keyboard Hook uninstalled");
            });
        } else {
            log::warn!("KeyMapping: previous hook thread did not exit in time, keep the old one");
        }
    }

    Ok(true)
}

/// 停止按键映射服务
#[tauri::command]
pub async fn stop_key_mapping(state: State<'_, KeyMappingManager>) -> Result<bool> {
    log::info!("Stopping key mapping service");
    state.is_running.store(false, Ordering::SeqCst);

    // 终止所有连点任务
    {
        let mut burst_tasks = state.burst_tasks.lock().unwrap();
        for (_, cancel) in burst_tasks.drain() {
            cancel.store(true, Ordering::SeqCst);
        }
    }

    // 重置按键状态与摇杆
    {
        let mut pressed = state.pressed_keys.lock().unwrap();
        pressed.clear();
    }
    {
        let mut joystick = state.joystick_state.lock().unwrap();
        *joystick = JoystickState::default();
    }

    // 关闭 ADB 会话
    {
        let mut session = state.adb_session.lock().unwrap();
        *session = None;
    }

    #[cfg(windows)]
    stop_windows_hook(&state.hook_thread_id);

    Ok(true)
}

#[cfg(windows)]
fn stop_windows_hook(hook_thread_id: &Arc<Mutex<Option<u32>>>) {
    if let Some(thread_id) = hook_thread_id.lock().unwrap().as_ref().copied() {
        unsafe {
            PostThreadMessageW(thread_id, WM_QUIT, 0, 0);
        }
    }
}

#[cfg(windows)]
fn wait_hook_exit(hook_thread_id: &Arc<Mutex<Option<u32>>>, timeout: Duration) -> bool {
    let start = Instant::now();
    while start.elapsed() < timeout {
        if hook_thread_id.lock().unwrap().is_none() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    false
}

/// 前端键盘桥接：应用窗口聚焦时把 DOM 键盘事件交给同一个映射引擎。
/// 这样即使全局 Hook 安装失败（权限 / 完整性级别 / 非 Windows 平台），
/// 在应用内按键依然可用；两条通道通过 pressed_keys 去重，不会重复注入。
#[tauri::command]
pub async fn inject_key_mapping_event(key: String, is_down: bool) -> Result<bool> {
    if let Some(manager) = GLOBAL_MANAGER.get() {
        if !manager.is_running.load(Ordering::SeqCst) {
            return Ok(false);
        }

        // 窗口失焦时 Webview 收不到 keyup，逐一补发抬起，避免摇杆/连点卡死
        if key == "__release_all__" {
            let pressed: Vec<String> = manager
                .pressed_keys
                .lock()
                .unwrap()
                .iter()
                .cloned()
                .collect();
            let config = manager.config.lock().unwrap().clone();
            let tx = manager.event_tx.lock().unwrap().as_ref().cloned();
            if let (Some(config), Some(tx)) = (config, tx) {
                for k in pressed {
                    let _ = tx.send(KeyEvent {
                        key: k,
                        is_down: false,
                        config: config.clone(),
                    });
                }
            }
            return Ok(true);
        }

        let config = manager.config.lock().unwrap().clone();
        let tx = manager.event_tx.lock().unwrap().as_ref().cloned();
        if let (Some(config), Some(tx)) = (config, tx) {
            let _ = tx.send(KeyEvent { key, is_down, config });
            return Ok(true);
        }
    }
    Ok(false)
}

/// 返回按键映射运行时诊断，供 UI 显示真实状态而不是「已启动」三个字
#[tauri::command]
pub async fn get_key_mapping_diagnostics(
    state: State<'_, KeyMappingManager>,
) -> Result<serde_json::Value> {
    let running = state.is_running.load(Ordering::SeqCst);
    let (screen_width, screen_height, motion_supported, adb_session) = {
        let guard = state.adb_session.lock().unwrap();
        match guard.as_ref() {
            Some(s) => (
                s.metrics.short_side,
                s.metrics.long_side,
                s.metrics.supports_motion_event,
                true,
            ),
            None => (0, 0, false, false),
        }
    };

    #[cfg(windows)]
    let hook_installed = state.hook_thread_id.lock().unwrap().is_some();
    #[cfg(not(windows))]
    let hook_installed = false;
    let event_queue_ready = state.event_tx.lock().unwrap().is_some();

    let cfg = state.config.lock().unwrap().clone();
    let (injection_mode, active_window_only, profile_name, item_count) = match cfg.as_ref() {
        Some(c) => (
            format!("{:?}", c.injection_mode),
            c.active_window_only,
            c.profile.name.clone(),
            c.profile.items.len(),
        ),
        None => ("Auto".to_string(), false, String::new(), 0),
    };

    let mut issues: Vec<String> = Vec::new();
    if running && !adb_session {
        issues.push("ADB 会话未建立，触控命令无法下发".to_string());
    }
    if running && !motion_supported {
        issues.push("设备不支持 input motionevent：点击已降级为 input tap，摇杆使用滑动近似".to_string());
    }
    #[cfg(windows)]
    if running && !hook_installed {
        issues.push("全局键盘钩子未安装，独立投屏窗口内按键不会生效（应用窗口内仍可用）".to_string());
    }
    #[cfg(not(windows))]
    if running {
        issues.push("当前平台无全局键盘钩子，请在应用窗口内按键".to_string());
    }

    Ok(serde_json::json!({
        "running": running,
        "adbSession": adb_session,
        "hookInstalled": hook_installed,
        "eventQueueReady": event_queue_ready,
        "screenWidth": screen_width,
        "screenHeight": screen_height,
        "motionEventSupported": motion_supported,
        "injectionMode": injection_mode,
        "activeWindowOnly": active_window_only,
        "profileName": profile_name,
        "itemCount": item_count,
        "issues": issues,
    }))
}

/// 查询按键映射运行状态
#[tauri::command]
pub async fn is_key_mapping_active(state: State<'_, KeyMappingManager>) -> Result<bool> {
    Ok(state.is_running.load(Ordering::SeqCst))
}

/// 获取按键映射配置预设列表
#[tauri::command]
pub async fn get_key_mapping_profiles() -> Result<Vec<KeyMappingProfile>> {
    let file_path = get_profiles_file_path();
    if file_path.exists() {
        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(profiles) = serde_json::from_str::<Vec<KeyMappingProfile>>(&content) {
                if !profiles.is_empty() {
                    return Ok(profiles);
                }
            }
        }
    }

    // 文件不存在或为空，生成内置预设并写入
    let builtins = get_builtin_profiles();
    let _ = fs::write(&file_path, serde_json::to_string_pretty(&builtins).unwrap_or_default());
    Ok(builtins)
}

/// 保存或更新按键映射预设
#[tauri::command]
pub async fn save_key_mapping_profile(profile: KeyMappingProfile) -> Result<bool> {
    let mut profiles = get_key_mapping_profiles().await?;
    if let Some(pos) = profiles.iter().position(|p| p.id == profile.id) {
        profiles[pos] = profile;
    } else {
        profiles.push(profile);
    }

    let file_path = get_profiles_file_path();
    let json_str = serde_json::to_string_pretty(&profiles)
        .map_err(|e| AdmtError::Io(format!("序列化按键映射预设失败: {}", e)))?;
    fs::write(&file_path, json_str)
        .map_err(|e| AdmtError::Io(format!("保存按键映射预设失败: {}", e)))?;

    Ok(true)
}

/// 删除按键映射预设
#[tauri::command]
pub async fn delete_key_mapping_profile(id: String) -> Result<bool> {
    let mut profiles = get_key_mapping_profiles().await?;
    profiles.retain(|p| p.id != id);

    let file_path = get_profiles_file_path();
    let json_str = serde_json::to_string_pretty(&profiles)
        .map_err(|e| AdmtError::Io(format!("序列化按键映射预设失败: {}", e)))?;
    fs::write(&file_path, json_str)
        .map_err(|e| AdmtError::Io(format!("保存按键映射预设失败: {}", e)))?;

    Ok(true)
}

/// 单次测试触发触控
#[tauri::command]
pub async fn simulate_key_mapping_touch(
    device_serial: String,
    action: String,
    x: f32,
    y: f32,
    end_x: Option<f32>,
    end_y: Option<f32>,
    duration_ms: Option<u32>,
    orientation: Option<String>,
) -> Result<bool> {
    let adb_path = crate::cache::get_cached_adb_path();

    let mut cmd = Command::new(&adb_path);
    cmd.arg("-s").arg(&device_serial).arg("shell");

    // 与映射引擎共用同一份真实分辨率，避免 Studio 里点得准、实际映射却偏移
    let (short_side, long_side) = query_screen_size(&adb_path, &device_serial);
    let metrics = ScreenMetrics {
        short_side,
        long_side,
        supports_motion_event: false,
    };
    let is_landscape = orientation.as_deref() == Some("landscape");
    let (base_w, base_h) = metrics.base_size(is_landscape);

    let px = (x.clamp(0.0, 1.0) * base_w as f32) as i32;
    let py = (y.clamp(0.0, 1.0) * base_h as f32) as i32;

    match action.as_str() {
        "tap" => {
            cmd.arg("input").arg("tap").arg(px.to_string()).arg(py.to_string());
        }
        "swipe" => {
            let ex = (end_x.unwrap_or(x).clamp(0.0, 1.0) * base_w as f32) as i32;
            let ey = (end_y.unwrap_or(y - 0.2).clamp(0.0, 1.0) * base_h as f32) as i32;
            let dur = duration_ms.unwrap_or(150);
            cmd.arg("input")
                .arg("swipe")
                .arg(px.to_string())
                .arg(py.to_string())
                .arg(ex.to_string())
                .arg(ey.to_string())
                .arg(dur.to_string());
        }
        _ => return Ok(false),
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let _ = cmd.output().map_err(|e| AdmtError::Process(format!("执行测试触控失败: {}", e)))?;
    Ok(true)
}

/// 捕获设备屏幕实时帧（返回 Base64 编码的图片数据）
#[tauri::command]
pub async fn capture_device_screen(device_serial: String) -> Result<String> {
    let adb_path = crate::cache::get_cached_adb_path();
    let mut cmd = Command::new(adb_path);
    cmd.args(["-s", &device_serial, "exec-out", "screencap", "-p"]);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd
        .output()
        .map_err(|e| AdmtError::Process(format!("捕获屏幕失败: {}", e)))?;

    if !output.status.success() || output.stdout.is_empty() {
        return Err(AdmtError::Process("截屏输出为空或失败".to_string()));
    }

    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&output.stdout);
    Ok(format!("data:image/png;base64,{}", b64))
}
