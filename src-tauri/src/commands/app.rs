use crate::error::{AdmtError, Result};
use tauri::Manager;

/// 退出应用
#[tauri::command]
pub async fn exit_app(exit_code: i32) -> Result<()> {
    log::info!("应用退出请求，退出码: {}", exit_code);

    // 给一些时间让前端接收到响应
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    // 退出应用
    std::process::exit(exit_code);
}

/// 获取平台信息
#[tauri::command]
pub async fn get_platform_info() -> Result<String> {
    Ok(std::env::consts::OS.to_string())
}

/// 获取系统架构信息
#[tauri::command]
pub async fn get_system_arch() -> Result<String> {
    Ok(std::env::consts::ARCH.to_string())
}

/// 打开开发者工具（仅在调试模式下可用）
#[tauri::command]
pub async fn open_devtools(_app: tauri::AppHandle) -> Result<()> {
    #[cfg(debug_assertions)]
    {
        if let Some(window) = _app.get_webview_window("main") {
            window.open_devtools();
            log::info!("开发者工具已打开");
            Ok(())
        } else {
            log::error!("无法找到主窗口");
            Err(AdmtError::FileOperationFailed {
                message: "无法找到主窗口".to_string(),
            })
        }
    }

    #[cfg(not(debug_assertions))]
    {
        log::warn!("开发者工具在生产模式下不可用");
        Err(AdmtError::FileOperationFailed {
            message: "开发者工具在生产模式下不可用".to_string(),
        })
    }
}

/// 检查是否为调试模式
#[tauri::command]
pub async fn is_debug_mode() -> Result<bool> {
    Ok(cfg!(debug_assertions))
}

/// 设置窗口置顶状态
#[tauri::command]
pub async fn set_window_always_on_top(window: tauri::Window, always_on_top: bool) -> Result<()> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| AdmtError::FileOperationFailed {
            message: format!("设置窗口置顶状态失败: {}", e),
        })?;
    log::info!(
        "窗口置顶状态已设置为: {}, 窗口标签: {}",
        always_on_top,
        window.label()
    );
    Ok(())
}

/// 获取窗口置顶状态
#[tauri::command]
pub async fn get_window_always_on_top(app: tauri::AppHandle) -> Result<bool> {
    if let Some(window) = app.get_webview_window("main") {
        let is_always_on_top =
            window
                .is_always_on_top()
                .map_err(|e| AdmtError::FileOperationFailed {
                    message: format!("获取窗口置顶状态失败: {}", e),
                })?;
        log::info!("窗口置顶状态: {}", is_always_on_top);
        Ok(is_always_on_top)
    } else {
        log::error!("无法找到主窗口");
        Err(AdmtError::FileOperationFailed {
            message: "无法找到主窗口".to_string(),
        })
    }
}

/// 获取应用环境信息
#[tauri::command]
pub async fn get_app_environment() -> Result<serde_json::Value> {
    let mut env_info = serde_json::Map::new();

    env_info.insert(
        "debug_mode".to_string(),
        serde_json::Value::Bool(cfg!(debug_assertions)),
    );
    env_info.insert(
        "platform".to_string(),
        serde_json::Value::String(std::env::consts::OS.to_string()),
    );
    env_info.insert(
        "arch".to_string(),
        serde_json::Value::String(std::env::consts::ARCH.to_string()),
    );
    env_info.insert(
        "family".to_string(),
        serde_json::Value::String(std::env::consts::FAMILY.to_string()),
    );

    // 添加版本信息
    if let Ok(version) = std::env::var("CARGO_PKG_VERSION") {
        env_info.insert("version".to_string(), serde_json::Value::String(version));
    }

    Ok(serde_json::Value::Object(env_info))
}

/// 在新窗口中执行脚本文件
#[tauri::command]
pub async fn execute_script_in_new_window(
    script_path: String,
) -> Result<crate::device::CommandResult> {
    use std::path::Path;
    use std::process::Command;

    // 转换为绝对路径
    let path = if Path::new(&script_path).is_absolute() {
        Path::new(&script_path).to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|e| AdmtError::Io(format!("Failed to get current directory: {}", e)))?
            .join(&script_path)
    };

    if !path.exists() {
        log::error!("Script file not found: {}", path.display());
        return Err(AdmtError::FileNotFound {
            path: path.to_string_lossy().to_string(),
        });
    }

    log::info!("Executing script in new window: {}", path.display());

    #[cfg(target_os = "windows")]
    {
        // 获取脚本的绝对路径
        let script_absolute_path = path
            .canonicalize()
            .map_err(|e| AdmtError::Io(format!("Failed to canonicalize path: {}", e)))?;

        // 设置工作目录为脚本所在目录
        let working_dir = script_absolute_path
            .parent()
            .ok_or_else(|| AdmtError::Io("Failed to get script parent directory".to_string()))?;

        log::info!("Script absolute path: {}", script_absolute_path.display());
        log::info!("Working directory: {}", working_dir.display());

        // 使用简单的start命令在新窗口中启动脚本
        let script_name = script_absolute_path
            .file_name()
            .and_then(|name: &std::ffi::OsStr| name.to_str())
            .unwrap_or("bypass.cmd");

        let mut cmd = Command::new("cmd");
        cmd.args(["/C", "start", script_name]);
        cmd.current_dir(working_dir);

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("Script started in new window with PID: {}", pid);

                Ok(crate::device::CommandResult {
                    success: true,
                    output: format!("脚本已在新窗口中启动 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                })
            }
            Err(e) => {
                log::error!("Failed to start script in new window: {}", e);
                Err(AdmtError::Process(format!(
                    "Failed to execute script: {}",
                    e
                )))
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // 对于非Windows系统，使用默认终端
        let script_absolute_path = path
            .canonicalize()
            .map_err(|e| AdmtError::Io(format!("Failed to canonicalize path: {}", e)))?;

        let script_str = script_absolute_path.to_string_lossy().to_string();

        // 设置工作目录为脚本所在目录
        let working_dir = script_absolute_path
            .parent()
            .ok_or_else(|| AdmtError::Io("Failed to get script parent directory".to_string()))?;

        log::info!("Script absolute path: {}", script_str);
        log::info!("Working directory: {}", working_dir.display());

        let mut cmd = Command::new("sh");
        cmd.args(&["-c", &script_str]);
        cmd.current_dir(working_dir);

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("Script started with PID: {}", pid);

                Ok(crate::device::CommandResult {
                    success: true,
                    output: format!("脚本已启动 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                })
            }
            Err(e) => {
                log::error!("Failed to start script: {}", e);
                Err(AdmtError::Process(format!(
                    "Failed to execute script: {}",
                    e
                )))
            }
        }
    }
}

/// 终止进程
#[tauri::command]
pub async fn terminate_process(process_id: u32) -> Result<bool> {
    log::info!("Terminating process with ID: {}", process_id);

    #[cfg(windows)]
    {
        use std::process::Command;

        let mut cmd = Command::new("taskkill");
        cmd.args(["/F", "/PID", &process_id.to_string()]);

        match cmd.output() {
            Ok(output) => {
                let success = output.status.success();
                if success {
                    log::info!("Successfully terminated process with ID: {}", process_id);
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    log::error!(
                        "Failed to terminate process with ID: {}: {}",
                        process_id,
                        stderr
                    );
                }
                Ok(success)
            }
            Err(e) => {
                log::error!(
                    "Failed to execute taskkill command for process ID {}: {}",
                    process_id,
                    e
                );
                Ok(false)
            }
        }
    }

    #[cfg(not(windows))]
    {
        use std::process::Command;

        let mut cmd = Command::new("kill");
        cmd.arg("-9");
        cmd.arg(process_id.to_string());

        match cmd.output() {
            Ok(output) => {
                let success = output.status.success();
                if success {
                    log::info!("Successfully terminated process with ID: {}", process_id);
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    log::error!(
                        "Failed to terminate process with ID: {}: {}",
                        process_id,
                        stderr
                    );
                }
                Ok(success)
            }
            Err(e) => {
                log::error!(
                    "Failed to execute kill command for process ID {}: {}",
                    process_id,
                    e
                );
                Ok(false)
            }
        }
    }
}

/// 检查进程是否存活
#[tauri::command]
pub async fn check_process_alive(process_id: u32) -> Result<bool> {
    log::debug!("Checking if process with ID: {} is alive", process_id);

    #[cfg(windows)]
    {
        use std::process::Command;

        let mut cmd = Command::new("tasklist");
        cmd.args([
            "/FI",
            &format!("PID eq {}", process_id),
            "/FO",
            "CSV",
            "/NH",
        ]);

        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let is_alive = stdout.contains(&process_id.to_string());
                log::debug!("Process with ID: {} is alive: {}", process_id, is_alive);
                Ok(is_alive)
            }
            Err(e) => {
                log::error!(
                    "Failed to check process status for ID {}: {}",
                    process_id,
                    e
                );
                Ok(false)
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;

        let mut cmd = Command::new("ps");
        cmd.arg("-p");
        cmd.arg(process_id.to_string());

        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let is_alive = stdout.contains(&process_id.to_string());
                log::debug!("Process with ID: {} is alive: {}", process_id, is_alive);
                Ok(is_alive)
            }
            Err(e) => {
                log::error!(
                    "Failed to check process status for ID {}: {}",
                    process_id,
                    e
                );
                Ok(false)
            }
        }
    }
}
