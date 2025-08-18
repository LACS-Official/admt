use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command as TokioCommand;
use tokio::time::timeout;
use crate::error::{HoutError, Result};
use crate::cache::{get_cached_adb_path, get_cached_fastboot_path, record_path_cache_hit};



/// 获取ADB可执行文件路径（已弃用，请使用缓存版本）
#[deprecated(note = "Use get_cached_adb_path() for better performance")]
#[allow(dead_code)]
pub fn get_adb_path() -> PathBuf {
    // 1. 优先尝试从应用资源目录获取（生产模式）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let adb_path = parent.join("resources").join("adb.exe");
            if adb_path.exists() {
                log::info!("Found ADB at app resources: {}", adb_path.display());
                return adb_path;
            }
        }
    }

    // 2. 尝试从当前工作目录的resources获取（开发模式）
    let current_dir_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("resources")
        .join("adb.exe");
    if current_dir_resources.exists() {
        log::info!("Found ADB at current dir resources: {}", current_dir_resources.display());
        return current_dir_resources;
    }

    // 3. 尝试从相对路径获取（开发模式备选）
    let relative_path = PathBuf::from("src-tauri/resources/adb.exe");
    if relative_path.exists() {
        log::info!("Found ADB at relative path: {}", relative_path.display());
        return relative_path;
    }

    // 4. 尝试从上级目录获取（特殊项目结构）
    let parent_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .parent()
        .map(|p| p.join("Res").join("adb.exe"));
    if let Some(path) = parent_resources {
        if path.exists() {
            log::info!("Found ADB at parent Res directory: {}", path.display());
            return path;
        }
    }

    // 5. 尝试绝对路径（基于项目结构）
    let absolute_path = PathBuf::from(r"D:\kaifa\HOUT\Res\adb.exe");
    if absolute_path.exists() {
        log::info!("Found ADB at absolute path: {}", absolute_path.display());
        return absolute_path;
    }

    // 如果所有路径都找不到，记录错误并返回默认名称
    if let Ok(cwd) = std::env::current_dir() {
        log::error!("Current working directory: {}", cwd.display());
    }
    log::error!("ADB executable not found in any expected location, this may cause device detection to fail");
    log::error!("Please ensure adb.exe is present in src-tauri/resources/ directory");
    PathBuf::from("adb.exe")
}

/// 获取Fastboot可执行文件路径（已弃用，请使用缓存版本）
#[deprecated(note = "Use get_cached_fastboot_path() for better performance")]
#[allow(dead_code)]
pub fn get_fastboot_path() -> PathBuf {
    // 1. 优先尝试从应用资源目录获取（生产模式）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let fastboot_path = parent.join("resources").join("fastboot.exe");
            if fastboot_path.exists() {
                log::info!("Found Fastboot at app resources: {}", fastboot_path.display());
                return fastboot_path;
            }
        }
    }

    // 2. 尝试从当前工作目录的resources获取（开发模式）
    let current_dir_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("resources")
        .join("fastboot.exe");
    if current_dir_resources.exists() {
        log::info!("Found Fastboot at current dir resources: {}", current_dir_resources.display());
        return current_dir_resources;
    }

    // 3. 尝试从相对路径获取（开发模式备选）
    let relative_path = PathBuf::from("src-tauri/resources/fastboot.exe");
    if relative_path.exists() {
        log::info!("Found Fastboot at relative path: {}", relative_path.display());
        return relative_path;
    }

    // 4. 尝试从上级目录获取（特殊项目结构）
    let parent_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .parent()
        .map(|p| p.join("Res").join("fastboot.exe"));
    if let Some(path) = parent_resources {
        if path.exists() {
            log::info!("Found Fastboot at parent Res directory: {}", path.display());
            return path;
        }
    }

    // 5. 尝试绝对路径（基于项目结构）
    let absolute_path = PathBuf::from(r"D:\kaifa\HOUT\Res\fastboot.exe");
    if absolute_path.exists() {
        log::info!("Found Fastboot at absolute path: {}", absolute_path.display());
        return absolute_path;
    }

    // 如果所有路径都找不到，记录错误并返回默认名称
    if let Ok(cwd) = std::env::current_dir() {
        log::error!("Current working directory: {}", cwd.display());
    }
    log::error!("Fastboot executable not found in any expected location, this may cause device detection to fail");
    log::error!("Please ensure fastboot.exe is present in src-tauri/resources/ directory");
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
    record_path_cache_hit().await;
    execute_command(fastboot_path, args, timeout_secs).await
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
        let tool_name = if program_str.contains("ADB") { "ADB" } else { "Fastboot" };
        return Err(HoutError::IoError {
            message: format!(
                "{} executable not found in resources directory. Please ensure {}.exe is placed in src-tauri/resources/",
                tool_name,
                tool_name.to_lowercase()
            ),
        });
    }

    // 检查程序文件是否存在
    if !program.exists() {
        return Err(HoutError::IoError {
            message: format!(
                "Program not found: {}. Please ensure the executable is placed in src-tauri/resources/",
                program.display()
            ),
        });
    }

    let mut cmd = TokioCommand::new(program);
    cmd.args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // 在Windows上隐藏命令行窗口
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let timeout_duration = Duration::from_secs(timeout_secs.unwrap_or(30));

    match timeout(timeout_duration, cmd.output()).await {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            Ok(crate::device::CommandResult {
                success: output.status.success(),
                output: stdout,
                error: if stderr.is_empty() { None } else { Some(stderr) },
                exit_code: output.status.code(),
            })
        }
        Ok(Err(e)) => {
            // 提供更详细的错误信息
            let error_msg = if e.kind() == std::io::ErrorKind::NotFound {
                format!(
                    "Program not found: {}. Please ensure the executable is available in src-tauri/resources/",
                    program.display()
                )
            } else {
                format!("Failed to execute command: {}", e)
            };

            Err(HoutError::IoError {
                message: error_msg,
            })
        }
        Err(_) => Err(HoutError::CommandTimeout {
            command: format!("{} {}", program.display(), args.join(" ")),
        }),
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
    !serial.is_empty() && serial.chars().all(|c| c.is_alphanumeric() || c == ':' || c == '.')
}
