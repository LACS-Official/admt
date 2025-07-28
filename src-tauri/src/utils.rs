use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command as TokioCommand;
use tokio::time::timeout;
use crate::error::{HoutError, Result};



/// 获取ADB可执行文件路径
pub fn get_adb_path() -> PathBuf {
    // 首先尝试从环境变量获取
    if let Ok(path) = std::env::var("ADB_PATH") {
        println!("Using ADB_PATH environment variable: {}", path);
        return PathBuf::from(path);
    }

    // 尝试从应用资源目录获取
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let adb_path = parent.join("resources").join("adb.exe");
            if adb_path.exists() {
                return adb_path;
            }
        }
    }

    // 尝试从当前工作目录的resources获取
    let current_dir_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("resources")
        .join("adb.exe");
    if current_dir_resources.exists() {
        return current_dir_resources;
    }

    // 尝试从相对路径获取（开发模式）
    let relative_path = PathBuf::from("src-tauri/resources/adb.exe");
    if relative_path.exists() {
        return relative_path;
    }

    // 尝试从上级目录获取
    let parent_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .parent()
        .map(|p| p.join("Res").join("adb.exe"));
    if let Some(path) = parent_resources {
        if path.exists() {
            println!("Found ADB at parent Res directory: {}", path.display());
            return path;
        }
    }

    // 尝试绝对路径（基于您的项目结构）
    let absolute_path = PathBuf::from(r"D:\kaifa\HOUT\Res\adb.exe");
    if absolute_path.exists() {
        println!("Found ADB at absolute path: {}", absolute_path.display());
        return absolute_path;
    }

    // 打印当前工作目录用于调试
    if let Ok(cwd) = std::env::current_dir() {
        println!("Current working directory: {}", cwd.display());
    }

    // 默认使用系统PATH中的adb
    println!("Falling back to system PATH for adb");
    PathBuf::from("adb")
}

/// 获取Fastboot可执行文件路径
pub fn get_fastboot_path() -> PathBuf {
    // 首先尝试从环境变量获取
    if let Ok(path) = std::env::var("FASTBOOT_PATH") {
        return PathBuf::from(path);
    }

    // 尝试从应用资源目录获取
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let fastboot_path = parent.join("resources").join("fastboot.exe");
            if fastboot_path.exists() {
                return fastboot_path;
            }
        }
    }

    // 尝试从当前工作目录的resources获取
    let current_dir_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("resources")
        .join("fastboot.exe");
    if current_dir_resources.exists() {
        return current_dir_resources;
    }

    // 尝试从相对路径获取（开发模式）
    let relative_path = PathBuf::from("src-tauri/resources/fastboot.exe");
    if relative_path.exists() {
        return relative_path;
    }

    // 尝试从上级目录获取
    let parent_resources = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .parent()
        .map(|p| p.join("Res").join("fastboot.exe"));
    if let Some(path) = parent_resources {
        if path.exists() {
            println!("Found Fastboot at parent Res directory: {}", path.display());
            return path;
        }
    }

    // 尝试绝对路径（基于您的项目结构）
    let absolute_path = PathBuf::from(r"D:\kaifa\HOUT\Res\fastboot.exe");
    if absolute_path.exists() {
        println!("Found Fastboot at absolute path: {}", absolute_path.display());
        return absolute_path;
    }

    // 默认使用系统PATH中的fastboot
    PathBuf::from("fastboot")
}

/// 执行ADB命令
pub async fn execute_adb_command(
    args: &[&str],
    timeout_secs: Option<u64>,
) -> Result<crate::device::CommandResult> {
    let adb_path = get_adb_path();
    execute_command(&adb_path, args, timeout_secs).await
}

/// 执行Fastboot命令
pub async fn execute_fastboot_command(
    args: &[&str],
    timeout_secs: Option<u64>,
) -> Result<crate::device::CommandResult> {
    let fastboot_path = get_fastboot_path();
    execute_command(&fastboot_path, args, timeout_secs).await
}

/// 执行通用命令
pub async fn execute_command(
    program: &PathBuf,
    args: &[&str],
    timeout_secs: Option<u64>,
) -> Result<crate::device::CommandResult> {
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
        Ok(Err(e)) => Err(HoutError::IoError {
            message: format!("Failed to execute command: {}", e),
        }),
        Err(_) => Err(HoutError::CommandTimeout {
            command: format!("{} {}", program.display(), args.join(" ")),
        }),
    }
}

/// 解析设备列表输出
pub fn parse_device_list(output: &str) -> Vec<(String, String)> {
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

/// 解析设备属性输出
pub fn parse_device_properties(output: &str) -> std::collections::HashMap<String, String> {
    let mut properties = std::collections::HashMap::new();
    
    for line in output.lines() {
        if let Some(eq_pos) = line.find('=') {
            let key = line[..eq_pos].trim();
            let value = line[eq_pos + 1..].trim();
            
            // 移除方括号
            let value = if value.starts_with('[') && value.ends_with(']') {
                &value[1..value.len() - 1]
            } else {
                value
            };
            
            properties.insert(key.to_string(), value.to_string());
        }
    }
    
    properties
}

/// 格式化文件大小
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
pub fn is_valid_serial(serial: &str) -> bool {
    !serial.is_empty() && serial.chars().all(|c| c.is_alphanumeric() || c == ':' || c == '.')
}
