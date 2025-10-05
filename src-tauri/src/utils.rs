use crate::cache::{get_cached_adb_path, get_cached_fastboot_path, record_path_cache_hit};
use crate::error::{AdmtError, Result};
use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command as TokioCommand;
use tokio::time::timeout;

/// 获取ADB可执行文件路径（已弃用，请使用缓存版本）
#[deprecated(note = "Use get_cached_adb_path() for better performance")]
#[allow(dead_code)]
pub fn get_adb_path() -> PathBuf {
    // 1. 优先尝试从应用工具目录获取（生产模式）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let adb_path = parent.join("tools").join("adb").join("adb.exe");
            if adb_path.exists() {
                log::info!("Found ADB at app tools: {}", adb_path.display());
                return adb_path;
            }
        }
    }

    // 2. 尝试从当前工作目录的tools/adb获取（开发模式）
    let current_dir_tools = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("tools")
        .join("adb")
        .join("adb.exe");
    if current_dir_tools.exists() {
        log::info!(
            "Found ADB at current dir tools: {}",
            current_dir_tools.display()
        );
        return current_dir_tools;
    }

    // 3. 尝试从相对路径获取（开发模式备选）
    let relative_path = PathBuf::from("src-tauri/tools/adb/adb.exe");
    if relative_path.exists() {
        log::info!("Found ADB at relative path: {}", relative_path.display());
        return relative_path;
    }

    // 如果所有路径都找不到，记录错误并返回默认名称
    if let Ok(cwd) = std::env::current_dir() {
        log::error!("Current working directory: {}", cwd.display());
    }
    log::error!("ADB executable not found in any expected location, this may cause device detection to fail");
    log::error!("Please ensure adb.exe is present in src-tauri/tools/adb/ directory");
    PathBuf::from("adb.exe")
}

/// 获取Fastboot可执行文件路径（已弃用，请使用缓存版本）
#[deprecated(note = "Use get_cached_fastboot_path() for better performance")]
#[allow(dead_code)]
pub fn get_fastboot_path() -> PathBuf {
    // 1. 优先尝试从应用工具目录获取（生产模式）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let fastboot_path = parent.join("tools").join("adb").join("fastboot.exe");
            if fastboot_path.exists() {
                log::info!("Found Fastboot at app tools: {}", fastboot_path.display());
                return fastboot_path;
            }
        }
    }

    // 2. 尝试从当前工作目录的tools/adb获取（开发模式）
    let current_dir_tools = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("tools")
        .join("adb")
        .join("fastboot.exe");
    if current_dir_tools.exists() {
        log::info!(
            "Found Fastboot at current dir tools: {}",
            current_dir_tools.display()
        );
        return current_dir_tools;
    }

    // 3. 尝试从相对路径获取（开发模式备选）
    let relative_path = PathBuf::from("src-tauri/tools/adb/fastboot.exe");
    if relative_path.exists() {
        log::info!(
            "Found Fastboot at relative path: {}",
            relative_path.display()
        );
        return relative_path;
    }

    // 如果所有路径都找不到，记录错误并返回默认名称
    if let Ok(cwd) = std::env::current_dir() {
        log::error!("Current working directory: {}", cwd.display());
    }
    log::error!("Fastboot executable not found in any expected location, this may cause device detection to fail");
    log::error!("Please ensure fastboot.exe is present in src-tauri/tools/adb/ directory");
    PathBuf::from("fastboot.exe")
}

/// 执行ADB命令（使用缓存路径）
pub async fn execute_adb_command(
    args: &[&str],
    timeout_secs: Option<u64>,
) -> Result<crate::device::CommandResult> {
    let adb_path = get_cached_adb_path();
    record_path_cache_hit().await;
    execute_command(adb_path, args, timeout_secs).await
}

/// 执行Fastboot命令（使用缓存路径）
pub async fn execute_fastboot_command(
    args: &[&str],
    timeout_secs: Option<u64>,
) -> Result<crate::device::CommandResult> {
    let fastboot_path = get_cached_fastboot_path();
    log::info!("[utils] execute_fastboot_command called with args: {:?}, timeout: {:?}, fastboot_path: {}", args, timeout_secs, fastboot_path.display());
    record_path_cache_hit().await;
    let result = execute_command(fastboot_path, args, timeout_secs).await;
    
    // 特殊处理fastboot命令的输出 - fastboot通常将输出放在stderr中
    let result = match result {
        Ok(mut cmd_result) => {
            // 如果stdout为空但stderr有内容，且命令成功执行，则将stderr内容作为输出
            if cmd_result.success && cmd_result.output.is_empty() {
                if let Some(stderr_content) = &cmd_result.error {
                    cmd_result.output = stderr_content.clone();
                    cmd_result.error = None;
                    log::info!("[utils] Fastboot output moved from stderr to stdout: {}", cmd_result.output);
                }
            }
            log::info!("[utils] execute_fastboot_command final result: success={}, output_len={}, error={:?}, exit_code={:?}", 
                      cmd_result.success,
                      cmd_result.output.len(),
                      cmd_result.error,
                      cmd_result.exit_code);
            Ok(cmd_result)
        }
        Err(e) => {
            log::error!("[utils] execute_fastboot_command error: {}", e);
            Err(e)
        }
    };
    
    result
}

/// 执行通用命令
pub async fn execute_command(
    program: &PathBuf,
    args: &[&str],
    timeout_secs: Option<u64>,
) -> Result<crate::device::CommandResult> {
    // 检查程序路径是否有效
    let program_str = program.to_string_lossy();
    if program_str.contains("INVALID_") {
        let tool_name = if program_str.contains("ADB") {
            "ADB"
        } else {
            "Fastboot"
        };
        return Err(AdmtError::IoError {
            message: format!(
                "{} executable not found in tools directory. Please ensure {}.exe is placed in src-tauri/tools/adb/",
                tool_name,
                tool_name.to_lowercase()
            ),
        });
    }

    // 检查程序文件是否存在
    if !program.exists() {
        return Err(AdmtError::IoError {
            message: format!(
                "Program not found: {}. Please ensure the executable is placed in src-tauri/tools/adb/",
                program.display()
            ),
        });
    }

    let mut cmd = TokioCommand::new(program);
    cmd.args(args).stdout(Stdio::piped()).stderr(Stdio::piped());

    // 在发布版中隐藏命令行窗口，在调试版中保持可见
    #[cfg(all(windows, not(debug_assertions)))]
    {
        #[allow(unused_imports)]
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        log::debug!("设置隐藏窗口标志 (发布版): {}", program.display());
    }

    // 在调试版中保持窗口可见以便调试
    #[cfg(all(windows, debug_assertions))]
    {
        log::debug!("保持窗口可见 (调试版): {}", program.display());
    }

    // 非Windows平台的处理
    #[cfg(not(windows))]
    {
        log::debug!("非Windows平台，使用默认设置: {}", program.display());
    }

    let timeout_duration = Duration::from_secs(timeout_secs.unwrap_or(30));

    match timeout(timeout_duration, cmd.output()).await {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            let result = crate::device::CommandResult {
                success: output.status.success(),
                output: stdout,
                error: if stderr.is_empty() {
                    None
                } else {
                    Some(stderr)
                },
                exit_code: output.status.code(),
            };

            if result.success {
                log::debug!("命令执行成功: {} {}", program.display(), args.join(" "));
            } else {
                log::warn!(
                    "命令执行失败: {} {}, 错误: {:?}",
                    program.display(),
                    args.join(" "),
                    result.error
                );
            }

            Ok(result)
        }
        Ok(Err(e)) => {
            // 提供更详细的错误信息
            let error_msg = if e.kind() == std::io::ErrorKind::NotFound {
                format!(
                    "Program not found: {}. Please ensure the executable is available in src-tauri/tools/adb/",
                    program.display()
                )
            } else {
                format!("Failed to execute command: {}", e)
            };

            log::error!("命令执行IO错误: {}", error_msg);
            Err(AdmtError::IoError { message: error_msg })
        }
        Err(_) => {
            let timeout_error = format!("命令执行超时: {} {}", program.display(), args.join(" "));
            log::error!("{}", timeout_error);
            Err(AdmtError::CommandTimeout {
                command: format!("{} {}", program.display(), args.join(" ")),
            })
        }
    }
}

/// 解析ADB设备列表输出
pub fn parse_adb_device_list(output: &str) -> Vec<(String, String)> {
    output
        .lines()
        .skip(1) // 跳过"List of devices attached"行
        .filter_map(|line| {
            let parts: Vec<&str> = line.trim().split_whitespace().collect();
            if parts.len() >= 2 {
                Some((parts[0].to_string(), parts[1].to_string()))
            } else {
                None
            }
        })
        .collect()
}

/// 解析Fastboot设备列表输出
pub fn parse_fastboot_device_list(output: &str) -> Vec<(String, String)> {
    output
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() {
                return None;
            }
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                Some((parts[0].to_string(), parts[1].to_string()))
            } else {
                None
            }
        })
        .collect()
}

/// 格式化文件大小
#[allow(dead_code)]
pub fn format_file_size(size: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = size as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", size as u64, UNITS[unit_index])
    } else {
        format!("{:.1} {}", size, UNITS[unit_index])
    }
}

/// 验证设备序列号格式
#[allow(dead_code)]
pub fn is_valid_serial(serial: &str) -> bool {
    !serial.is_empty()
        && serial
            .chars()
            .all(|c| c.is_alphanumeric() || c == ':' || c == '.')
}
