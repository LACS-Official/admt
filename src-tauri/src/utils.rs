use crate::cache::{get_cached_adb_path, get_cached_fastboot_path, record_path_cache_hit};
use crate::error::{AdmtError, Result};
use std::path::PathBuf;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command as TokioCommand;
use tokio::time::timeout;

use std::env::consts::EXE_SUFFIX;

/// 根据当前操作系统获取可执行文件名称
pub fn executable_name(name: &str) -> String {
    format!("{}{}", name, EXE_SUFFIX)
}



/// 确保文件在 Unix 系统上具有执行权限
pub fn ensure_executable(path: &std::path::Path) -> Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if path.exists() {
            let mut perms = std::fs::metadata(path)?.permissions();
            perms.set_mode(0o755);
            std::fs::set_permissions(path, perms)?;
            log::info!("Set executable permission for: {}", path.display());
        }
    }
    #[cfg(not(unix))]
    {
        let _ = path;
    }
    Ok(())
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
    log::info!(
        "[utils] execute_fastboot_command called with args: {:?}, timeout: {:?}, fastboot_path: {}",
        args,
        timeout_secs,
        fastboot_path.display()
    );
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
                    log::info!(
                        "[utils] Fastboot output moved from stderr to stdout: {}",
                        cmd_result.output
                    );
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
        return Err(AdmtError::Io(format!(
            "{} executable not found in tools directory. Please ensure {} is placed in src-tauri/tools/adb/",
            tool_name,
            executable_name(&tool_name.to_lowercase())
        )));
    }

    // 检查程序文件是否存在
    if !program.exists() {
        return Err(AdmtError::Io(format!(
            "Program not found: {}. Please ensure the executable is placed in src-tauri/tools/adb/",
            program.display()
        )));
    }

    let mut cmd = TokioCommand::new(program);
    cmd.kill_on_drop(true);
    cmd.args(args).stdout(Stdio::piped()).stderr(Stdio::piped());

    // 在Windows上隐藏命令行窗口
    #[cfg(windows)]
    {
        #[allow(unused_imports)]
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        log::debug!("背景命令设置隐藏窗口: {}", program.display());
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
            Err(AdmtError::Io(error_msg))
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
            let parts: Vec<&str> = line.split_whitespace().collect();
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


