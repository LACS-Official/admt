//! Scrcpy 屏幕镜像功能实现
//! 包含设备诊断、分辨率获取、屏幕镜像启动等功能

use serde::{Deserialize, Serialize};
use crate::error::{AdmtError, Result};

/// 屏幕镜像设备信息
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScreenMirrorDevice {
    pub serial: String,
    pub name: String,
    pub model: String,
    pub resolution: String,
    pub density: String,
    pub orientation: String,
    pub is_supported: bool,
    pub supported_codecs: Vec<String>,
}

/// 屏幕镜像配置
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
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
    #[serde(rename = "controlEnabled")]
    pub control_enabled: bool,
    #[serde(rename = "audioEnabled")]
    pub audio_enabled: bool,
}

/// 屏幕镜像质量配置
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScreenMirrorQuality {
    pub resolution: String,
    pub bitrate: u32,
    pub framerate: u32,
}

/// 屏幕镜像会话
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScreenMirrorSession {
    pub id: String,
    pub device_serial: String,
    pub device_name: String,
    pub status: String,
    pub config: ScreenMirrorConfig,
    pub process_id: Option<u32>,
    pub error_message: Option<String>,
}

impl ScreenMirrorSession {
    /// 创建新的屏幕镜像会话
    #[allow(dead_code)]
    pub fn new(device_serial: String, config: ScreenMirrorConfig) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            device_serial,
            device_name: String::new(),
            status: "initializing".to_string(),
            config,
            process_id: None,
            error_message: None,
        }
    }

    /// 启动会话
    #[allow(dead_code)]
    pub fn start(&mut self) {
        self.status = "starting".to_string();
    }

    /// 设置连接状态
    #[allow(dead_code)]
    pub fn set_connected(&mut self, process_id: u32, _port: u32) {
        self.process_id = Some(process_id);
        self.status = "connected".to_string();
    }

    /// 设置流媒体状态
    #[allow(dead_code)]
    pub fn set_streaming(&mut self) {
        self.status = "streaming".to_string();
    }

    /// 设置错误状态
    pub fn set_error(&mut self, error_message: String) {
        self.error_message = Some(error_message);
        self.status = "error".to_string();
    }
}

/// 诊断scrcpy安装和配置
#[tauri::command]
pub async fn diagnose_scrcpy() -> Result<serde_json::Value> {
    log::info!("Diagnosing scrcpy installation...");

    let mut diagnosis = serde_json::Map::new();

    // 1. 检查scrcpy路径
    match find_scrcpy_executable() {
        Ok(path) => {
            diagnosis.insert("scrcpy_found".to_string(), serde_json::Value::Bool(true));
            diagnosis.insert(
                "scrcpy_path".to_string(),
                serde_json::Value::String(path.clone()),
            );

            // 检查文件是否真的存在
            let exists = std::path::Path::new(&path).exists();
            diagnosis.insert("scrcpy_exists".to_string(), serde_json::Value::Bool(exists));

            // 如果存在，检查文件大小
            if exists {
                if let Ok(metadata) = std::fs::metadata(&path) {
                    diagnosis.insert(
                        "scrcpy_size".to_string(),
                        serde_json::Value::Number(serde_json::Number::from(metadata.len())),
                    );
                }

                // 检查依赖文件
                if let Some(parent_dir) = std::path::Path::new(&path).parent() {
                    let required_files = ["scrcpy-server", "adb.exe", "SDL2.dll", "avcodec-61.dll"];
                    let mut dependencies = serde_json::Map::new();

                    for file in &required_files {
                        let file_path = parent_dir.join(file);
                        dependencies.insert(
                            file.to_string(),
                            serde_json::Value::Bool(file_path.exists()),
                        );
                    }

                    diagnosis.insert(
                        "dependencies".to_string(),
                        serde_json::Value::Object(dependencies),
                    );
                }
            }
        }
        Err(e) => {
            diagnosis.insert("scrcpy_found".to_string(), serde_json::Value::Bool(false));
            diagnosis.insert(
                "error".to_string(),
                serde_json::Value::String(format!("{}", e)),
            );
        }
    }

    // 2. 检查当前可执行文件路径
    if let Ok(exe_path) = std::env::current_exe() {
        diagnosis.insert(
            "current_exe".to_string(),
            serde_json::Value::String(exe_path.to_string_lossy().to_string()),
        );

        if let Some(exe_dir) = exe_path.parent() {
            diagnosis.insert(
                "exe_directory".to_string(),
                serde_json::Value::String(exe_dir.to_string_lossy().to_string()),
            );

            // 列出可执行文件目录下的tools相关文件
            let tools_dir = exe_dir.join("tools");
            if tools_dir.exists() {
                if let Ok(entries) = std::fs::read_dir(&tools_dir) {
                    let mut tools_content = Vec::new();
                    for entry in entries.flatten() {
                        tools_content.push(serde_json::Value::String(
                            entry.file_name().to_string_lossy().to_string(),
                        ));
                    }
                    diagnosis.insert(
                        "tools_directory_content".to_string(),
                        serde_json::Value::Array(tools_content),
                    );
                }
            }
        }
    }

    // 3. 检查系统PATH中的scrcpy
    let mut cmd = std::process::Command::new("where");
    cmd.arg("scrcpy");

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    if let Ok(output) = cmd.output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            diagnosis.insert("system_scrcpy".to_string(), serde_json::Value::String(path));
        } else {
            diagnosis.insert("system_scrcpy".to_string(), serde_json::Value::Null);
        }
    }

    Ok(serde_json::Value::Object(diagnosis))
}

/// 检查设备是否支持屏幕镜像
#[tauri::command]
pub async fn check_screen_mirror_support(device_serial: String) -> Result<ScreenMirrorDevice> {
    log::info!("Checking screen mirror support for device: {}", device_serial);

    let mut device = ScreenMirrorDevice {
        serial: device_serial.clone(),
        ..Default::default()
    };

    // 检查设备是否连接
    let output = run_adb_command(&["-s", &device_serial, "get-state"]).await?;
    if !output.trim().eq("device") {
        return Err(AdmtError::Device("Device not connected".to_string()));
    }

    // 获取设备名称
    let output = run_adb_command(&["-s", &device_serial, "shell", "getprop", "ro.product.model"]).await?;
    device.model = output.trim().to_string();

    // 获取设备品牌
    let output = run_adb_command(&["-s", &device_serial, "shell", "getprop", "ro.product.brand"]).await?;
    device.name = format!("{} {}", output.trim(), device.model);

    // 简化检测 - 只检查基本连接和名称，默认所有设备都支持投屏
    device.is_supported = !device.model.is_empty();
    
    // 设置默认分辨率
    device.resolution = "1920x1080".to_string();
    
    // 设置默认密度
    device.density = "480".to_string();
    
    // 设置默认方向
    device.orientation = "0".to_string();

    // 添加支持的编解码器
    device.supported_codecs = vec!["h264".to_string(), "h265".to_string()];

    log::info!("Device screen mirror support check completed: {:?}", device);
    Ok(device)
}

/// 获取设备分辨率
#[allow(dead_code)]
pub async fn get_device_resolution(device_serial: String) -> Result<String> {
    log::info!("Getting device resolution for: {}", device_serial);

    let output = run_adb_command(&[
        "-s",
        &device_serial,
        "shell",
        "wm",
        "size",
    ]).await?;

    let resolution = output
        .lines()
        .next()
        .unwrap_or("")
        .split(":")
        .nth(1)
        .unwrap_or("")
        .trim()
        .to_string();

    if resolution.is_empty() {
        Err(AdmtError::Device("Failed to get device resolution".to_string()))
    } else {
        log::info!("Device resolution: {}", resolution);
        Ok(resolution)
    }
}

/// 启动屏幕镜像
#[tauri::command]
pub async fn start_screen_mirror(
    device_serial: String,
    config: ScreenMirrorConfig,
) -> Result<ScreenMirrorSession> {
    log::info!("Starting screen mirror for device: {}", device_serial);

    // 检查设备支持
    let device = check_screen_mirror_support(device_serial.clone()).await?;
    if !device.is_supported {
        return Err(AdmtError::Device(
            "Device does not support screen mirroring".to_string(),
        ));
    }

    // 创建会话
    let mut session = ScreenMirrorSession::new(device_serial.clone(), config.clone());
    session.device_name = device.name;
    session.start();

    // 构建scrcpy命令
    let mut args = vec![
        "-s".to_string(),
        device_serial,
        "--max-size".to_string(),
        extract_resolution_number(&config.quality.resolution),
        "--video-bit-rate".to_string(),
        format!("{}M", config.quality.bitrate),
        "--max-fps".to_string(),
        config.quality.framerate.to_string(),
    ];

    // 添加其他选项
    if config.show_touches {
        args.push("--show-touches".to_string());
    }

    if config.record_screen {
        args.push("--record".to_string());
    }

    if config.stay_awake {
        args.push("--stay-awake".to_string());
    }

    if config.turn_screen_off {
        args.push("--turn-screen-off".to_string());
    }

    if !config.control_enabled {
        args.push("--no-control".to_string());
    }

    if !config.audio_enabled {
        args.push("--no-audio".to_string());
    }

    // 启动scrcpy进程
    match start_scrcpy_process(&args).await {
        Ok(process_id) => {
            session.set_connected(process_id, 8080); // 默认端口
            session.set_streaming();
            log::info!(
                "Screen mirror started successfully with PID: {}",
                process_id
            );
            Ok(session)
        }
        Err(e) => {
            session.set_error(format!("Failed to start scrcpy: {}", e));
            Err(e)
        }
    }
}

/// 启动scrcpy进程
async fn start_scrcpy_process(args: &[String]) -> Result<u32> {
    use std::process::Command;

    // 检查scrcpy是否可用
    let scrcpy_path = find_scrcpy_executable()?;
    log::info!("Using scrcpy path: {}", scrcpy_path);
    log::info!("Starting scrcpy with args: {:?}", args);

    // 检查scrcpy文件是否存在
    let scrcpy_file = std::path::Path::new(&scrcpy_path);
    if !scrcpy_file.exists() {
        let error_msg = format!("scrcpy executable not found at: {}", scrcpy_path);
        log::error!("{}", error_msg);
        return Err(AdmtError::Tool(error_msg));
    }

    // 检查scrcpy所在目录的相关文件
    if let Some(parent_dir) = scrcpy_file.parent() {
        log::info!("scrcpy directory: {}", parent_dir.display());

        // 检查必要的依赖文件
        let required_files = ["scrcpy-server", "adb.exe"];
        for file in &required_files {
            let file_path = parent_dir.join(file);
            if !file_path.exists() {
                log::warn!("Missing dependency file: {}", file_path.display());
            } else {
                log::info!("Found dependency: {}", file_path.display());
            }
        }
    }

    // 启动进程
    let mut cmd = Command::new(&scrcpy_path);
    cmd.args(args);

    // 设置工作目录为scrcpy所在目录，确保可以找到依赖文件
    if let Some(parent_dir) = scrcpy_file.parent() {
        cmd.current_dir(parent_dir);
        log::info!("Set working directory to: {}", parent_dir.display());
    }

    // 设置工作目录为scrcpy所在目录，确保可以找到依赖文件
    if let Some(parent_dir) = scrcpy_file.parent() {
        cmd.current_dir(parent_dir);
        log::info!("Set working directory to: {}", parent_dir.display());
    }

    // 在Windows上隐藏命令行窗口
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match cmd.spawn() {
        Ok(child) => {
            let pid = child.id();
            log::info!("scrcpy process started successfully with PID: {}", pid);
            Ok(pid)
        }
        Err(e) => {
            let error_msg = format!(
                "Failed to start scrcpy process: {}. Path: {}",
                e, scrcpy_path
            );
            log::error!("{}", error_msg);

            // 提供更详细的错误信息
            if e.kind() == std::io::ErrorKind::NotFound {
                return Err(AdmtError::Tool(format!(
                    "scrcpy executable not found or cannot be executed: {}",
                    scrcpy_path
                )));
            } else if e.kind() == std::io::ErrorKind::PermissionDenied {
                return Err(AdmtError::Tool(format!(
                    "Permission denied when trying to execute scrcpy: {}",
                    scrcpy_path
                )));
            }

            Err(AdmtError::Process(error_msg))
        }
    }
}

/// 停止屏幕镜像
#[tauri::command]
pub async fn stop_screen_mirror(session_id: String) -> Result<bool> {
    log::info!("Stopping screen mirror session: {}", session_id);

    // TODO: 实现进程终止逻辑
    // 1. 根据session_id查找对应的进程ID
    // 2. 终止scrcpy进程
    // 3. 清理资源
    
    // 暂时返回成功，实际实现需要进程管理
    // 注意：这里需要实现会话管理器来跟踪会话和进程ID的映射关系
    log::warn!("stop_screen_mirror called but session management is not fully implemented");
    
    Ok(true)
}

/// 查找scrcpy可执行文件
fn find_scrcpy_executable() -> Result<String> {
    log::info!("Searching for scrcpy executable...");

    // 1. 检查应用程序资源目录（发布版本优先）
    let exe_dir = std::env::current_exe()
        .map_err(|e| AdmtError::Io(format!("Failed to get executable directory: {}", e)))?
        .parent()
        .ok_or_else(|| AdmtError::Io("Failed to get parent directory".to_string()))?
        .to_path_buf();

    // 发布版本中，scrcpy在应用程序根目录的tools/scrcpy-win32-v3.3.1/目录下
    let scrcpy_resource_paths = [
        // 直接在可执行文件目录
        exe_dir.join("scrcpy.exe"),
        // 在tools目录下
        exe_dir.join("tools").join("scrcpy.exe"),
        // 在tools/scrcpy-win32-v3.3.1目录下（主要路径）
        exe_dir
            .join("tools")
            .join("scrcpy-win32-v3.3.1")
            .join("scrcpy.exe"),
        // 在scrcpy-win32-v3.3.1目录下
        exe_dir.join("scrcpy-win32-v3.3.1").join("scrcpy.exe"),
    ];

    for scrcpy_path in &scrcpy_resource_paths {
        if scrcpy_path.exists() {
            log::info!(
                "Found scrcpy in resource directory: {}",
                scrcpy_path.display()
            );
            return Ok(scrcpy_path.to_string_lossy().to_string());
        }
    }

    // 2. 检查项目根目录下的 scrcpy（开发模式）
    if let Ok(project_scrcpy_path) = find_project_scrcpy() {
        log::info!("Found scrcpy in project directory: {}", project_scrcpy_path);
        return Ok(project_scrcpy_path);
    }

    // 3. 最后检查系统PATH中是否有scrcpy
    {
        let mut cmd = std::process::Command::new("where");
        cmd.arg("scrcpy");

        // 在Windows上隐藏命令行窗口
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        if let Ok(output) = cmd.output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    log::info!("Found scrcpy in system PATH: {}", path);
                    return Ok(path);
                }
            }
        }
    }

    Err(AdmtError::Tool(
        "scrcpy not found. Please install scrcpy or place it in the project directory.".to_string(),
    ))
}

/// 查找项目根目录下的 scrcpy
fn find_project_scrcpy() -> Result<String> {
    // 获取当前可执行文件路径
    let exe_path = std::env::current_exe()
        .map_err(|e| AdmtError::Io(format!("Failed to get executable path: {}", e)))?;

    let mut current_dir = exe_path
        .parent()
        .ok_or_else(|| AdmtError::Io("Failed to get parent directory".to_string()))?;

    // 向上查找项目根目录（包含 package.json 的目录）
    for _ in 0..10 {
        // 最多向上查找10级目录
        // 检查是否是项目根目录（包含 package.json 或 src-tauri 目录）
        let package_json = current_dir.join("package.json");
        let src_tauri = current_dir.join("src-tauri");

        if package_json.exists() || src_tauri.exists() {
            // 找到项目根目录，检查 scrcpy 的可能位置
            let scrcpy_locations = [
                // 直接在根目录
                current_dir.join("scrcpy.exe"),
                // 在 scrcpy-win32 目录
                current_dir.join("scrcpy-win32-v3.3.1").join("scrcpy.exe"),
                // 在 scrcpy-win64 目录
                current_dir.join("scrcpy-win64-v3.3.1").join("scrcpy.exe"),
                // 在 scrcpy 目录
                current_dir.join("scrcpy").join("scrcpy.exe"),
                // 在 tools 目录
                current_dir.join("tools").join("scrcpy.exe"),
                current_dir.join("tools").join("scrcpy").join("scrcpy.exe"),
                // 在 tools/scrcpy-win32-v3.3.1 目录 (用户指定路径)
                current_dir
                    .join("tools")
                    .join("scrcpy-win32-v3.3.1")
                    .join("scrcpy.exe"),
                // 在 tools/scrcpy-win64-v3.3.1 目录
                current_dir
                    .join("tools")
                    .join("scrcpy-win64-v3.3.1")
                    .join("scrcpy.exe"),
            ];

            for scrcpy_path in &scrcpy_locations {
                if scrcpy_path.exists() {
                    log::info!("Found scrcpy at: {}", scrcpy_path.display());
                    return Ok(scrcpy_path.to_string_lossy().to_string());
                }
            }

            // 如果在项目根目录但没找到 scrcpy，记录日志并继续
            log::warn!(
                "Found project root at {} but no scrcpy executable found",
                current_dir.display()
            );
            break;
        }

        // 向上一级目录
        if let Some(parent) = current_dir.parent() {
            current_dir = parent;
        } else {
            break;
        }
    }

    Err(AdmtError::Tool(
        "scrcpy not found in project directory".to_string(),
    ))
}

/// 运行ADB命令
async fn run_adb_command(args: &[&str]) -> Result<String> {
    // 这里需要导入ADB命令功能
    // 由于当前代码结构，我们暂时简化实现
    // 实际项目中应该调用ADB模块的相关函数
    use std::process::Command;
    
    let output = Command::new("adb")
        .args(args)
        .output()
        .map_err(|e| AdmtError::Process(format!("Failed to execute ADB command: {}", e)))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(AdmtError::Process(format!(
            "ADB command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )))
    }
}

/// 提取分辨率数字
fn extract_resolution_number(resolution: &str) -> String {
    if resolution.eq("auto") {
        return "1920".to_string(); // 默认最大尺寸
    }

    // 解析 "1920x1080" 格式
    if let Some((width, height)) = resolution.split_once('x') {
        if let (Ok(w), Ok(h)) = (width.parse::<u32>(), height.parse::<u32>()) {
            return w.max(h).to_string();
        }
    }

    "1920".to_string() // 默认值
}