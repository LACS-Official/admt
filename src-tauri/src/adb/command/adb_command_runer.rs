use crate::device::CommandResult;
use crate::error::Result;
use crate::utils::execute_adb_command as utils_execute_adb_command;
use std::process::{Command, Stdio};
use tauri::Emitter;

/// 执行批处理文件（用于线刷等操作）
#[tauri::command]
pub async fn execute_batch_file(
    batch_file_name: String,
    working_directory: String,
) -> Result<CommandResult> {
    log::info!(
        "Executing batch file: {} in directory: {}",
        batch_file_name,
        working_directory
    );

    #[cfg(windows)]
    {
        use std::path::Path;

        // 验证工作目录存在
        let work_dir = Path::new(&working_directory);
        if !work_dir.exists() {
            return Ok(CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("工作目录不存在: {}", working_directory)),
                exit_code: Some(1),
            });
        }

        // 构建批处理文件的完整路径
        let batch_path = work_dir.join(&batch_file_name);
        if !batch_path.exists() {
            return Ok(CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("批处理文件不存在: {}", batch_path.display())),
                exit_code: Some(1),
            });
        }

        log::info!("Executing batch file at: {}", batch_path.display());

        // 使用cmd执行批处理文件，确保继承完整的环境变量
        let system_root = std::env::var("SYSTEMROOT").unwrap_or("C:\\Windows".to_string());
        let current_path = std::env::var("PATH").unwrap_or_default();
        let enhanced_path = format!(
            "{};{}\\System32;{}\\System32\\Wbem",
            current_path, system_root, system_root
        );

        let mut cmd = Command::new("cmd");
        cmd.args(["/c", &batch_file_name])
            .current_dir(&working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .env("PATH", enhanced_path)
            .env("SYSTEMROOT", &system_root)
            .env("WINDIR", &system_root)
            .envs(std::env::vars().filter(|(key, _)| key != "PATH")); // 继承除PATH外的所有环境变量

        // 在发布版中隐藏控制台窗口，在调试版中保持可见
        #[cfg(all(windows, not(debug_assertions)))]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("批处理文件流式执行设置隐藏窗口");
        }

        // 在调试版中保持窗口可见以便调试
        #[cfg(all(windows, debug_assertions))]
        {
            log::debug!("批处理文件流式执行保持窗口可见 (调试版)");
        }

        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                let combined_output = if stderr.is_empty() {
                    stdout.to_string()
                } else {
                    format!("{}\n{}", stdout, stderr)
                };

                log::info!(
                    "Batch file execution completed with exit code: {:?}",
                    output.status.code()
                );

                Ok(CommandResult {
                    success: output.status.success(),
                    output: combined_output,
                    error: if output.status.success() {
                        None
                    } else {
                        Some(stderr.to_string())
                    },
                    exit_code: output.status.code(),
                })
            }
            Err(e) => {
                let error_msg = format!("执行批处理文件失败: {}", e);
                log::error!("{}", error_msg);
                Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(error_msg),
                    exit_code: Some(1),
                })
            }
        }
    }

    #[cfg(not(windows))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("批处理文件执行功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 执行ADB命令
#[tauri::command]
pub async fn execute_adb_command(
    serial: String,
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    let mut cmd_args = vec!["-s", &serial];
    cmd_args.push(&command);

    let string_args: Vec<String> = args
        .iter()
        .map(|s| s.as_str())
        .collect::<Vec<&str>>()
        .join(" ")
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    let str_args: Vec<&str> = string_args.iter().map(|s| s.as_str()).collect();
    cmd_args.extend(str_args);

    utils_execute_adb_command(&cmd_args, timeout).await
}

/// 执行直接的ADB命令（不带-s参数，用于全局命令如connect, pair）
#[tauri::command]
pub async fn execute_adb_command_direct(
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    let mut cmd_args = vec![command.as_str()];

    let string_args: Vec<String> = args
        .iter()
        .map(|s| s.as_str())
        .collect::<Vec<&str>>()
        .join(" ")
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    let str_args: Vec<&str> = string_args.iter().map(|s| s.as_str()).collect();
    cmd_args.extend(str_args);

    utils_execute_adb_command(&cmd_args, timeout).await
}

/// 结束ADB服务
#[tauri::command]
pub async fn finish_adb_service() -> Result<CommandResult> {
    log::info!("Finishing ADB service");

    #[cfg(windows)]
    {
        // 使用taskkill命令结束adb进程
        let mut cmd = Command::new("taskkill");
        cmd.args(["/F", "/IM", "adb.exe"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // 在发布版中隐藏控制台窗口，在调试版中保持可见
        #[cfg(all(windows, not(debug_assertions)))]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("结束ADB服务设置隐藏窗口 (发布版)");
        }

        // 在调试版中保持窗口可见以便调试
        #[cfg(all(windows, debug_assertions))]
        {
            log::debug!("结束ADB服务保持窗口可见 (调试版)");
        }

        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                let combined_output = if stderr.is_empty() {
                    stdout.to_string()
                } else {
                    format!("{}\n{}", stdout, stderr)
                };

                log::info!(
                    "ADB service termination completed with exit code: {:?}",
                    output.status.code()
                );

                Ok(CommandResult {
                    success: output.status.success(),
                    output: combined_output,
                    error: if output.status.success() {
                        None
                    } else {
                        Some(stderr.to_string())
                    },
                    exit_code: output.status.code(),
                })
            }
            Err(e) => {
                let error_msg = format!("结束ADB服务失败: {}", e);
                log::error!("{}", error_msg);
                Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(error_msg),
                    exit_code: Some(1),
                })
            }
        }
    }

    #[cfg(not(windows))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("结束ADB服务功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 结束ADB-5037端口
#[tauri::command]
pub async fn finish_adb5037() -> Result<CommandResult> {
    log::info!("Finishing ADB process on port 5037");

    #[cfg(windows)]
    {
        // 使用netstat和taskkill命令结束占用5037端口的进程
        let mut cmd = Command::new("cmd");
        cmd.args([
            "/C",
            "for /f \"tokens=5\" %a in ('netstat -aon ^| findstr :5037 ^| findstr LISTENING') do taskkill /F /PID %a"
        ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // 在发布版中隐藏控制台窗口，在调试版中保持可见
        #[cfg(all(windows, not(debug_assertions)))]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("结束ADB-5037端口设置隐藏窗口 (发布版)");
        }

        // 在调试版中保持窗口可见以便调试
        #[cfg(all(windows, debug_assertions))]
        {
            log::debug!("结束ADB-5037端口保持窗口可见 (调试版)");
        }

        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                let combined_output = if stderr.is_empty() {
                    stdout.to_string()
                } else {
                    format!("{}\n{}", stdout, stderr)
                };

                log::info!(
                    "ADB-5037 port termination completed with exit code: {:?}",
                    output.status.code()
                );

                Ok(CommandResult {
                    success: output.status.success(),
                    output: combined_output,
                    error: if output.status.success() {
                        None
                    } else {
                        Some(stderr.to_string())
                    },
                    exit_code: output.status.code(),
                })
            }
            Err(e) => {
                let error_msg = format!("结束ADB-5037端口失败: {}", e);
                log::error!("{}", error_msg);
                Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(error_msg),
                    exit_code: Some(1),
                })
            }
        }
    }

    #[cfg(not(windows))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("结束ADB-5037端口功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 执行批处理文件（支持实时流式输出）
#[tauri::command]
pub async fn execute_batch_file_stream(
    app_handle: tauri::AppHandle,
    batch_file_name: String,
    working_directory: String,
) -> Result<CommandResult> {
    log::info!(
        "Executing batch file with streaming: {} in directory: {}",
        batch_file_name,
        working_directory
    );

    #[cfg(windows)]
    {
        use std::io::{BufRead, BufReader};
        use std::path::Path;
        use tokio::task;

        // 验证工作目录存在
        let work_dir = Path::new(&working_directory);
        if !work_dir.exists() {
            return Ok(CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("工作目录不存在: {}", working_directory)),
                exit_code: Some(1),
            });
        }

        // 构建批处理文件的完整路径
        let batch_path = work_dir.join(&batch_file_name);
        if !batch_path.exists() {
            return Ok(CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("批处理文件不存在: {}", batch_path.display())),
                exit_code: Some(1),
            });
        }

        log::info!(
            "Executing batch file with streaming at: {}",
            batch_path.display()
        );

        // 使用cmd执行批处理文件，确保继承完整的环境变量
        let system_root = std::env::var("SYSTEMROOT").unwrap_or("C:\\Windows".to_string());
        let current_path = std::env::var("PATH").unwrap_or_default();
        let enhanced_path = format!(
            "{};{}\\System32;{}\\System32\\Wbem",
            current_path, system_root, system_root
        );

        let mut cmd = Command::new("cmd");
        cmd.args(["/c", &batch_file_name])
            .current_dir(&working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .env("PATH", enhanced_path)
            .env("SYSTEMROOT", &system_root)
            .env("WINDIR", &system_root)
            .envs(std::env::vars().filter(|(key, _)| key != "PATH")); // 继承除PATH外的所有环境变量

        // 在发布版中隐藏控制台窗口，在调试版中保持可见
        #[cfg(all(windows, not(debug_assertions)))]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("批处理文件流式执行设置隐藏窗口");
        }

        // 在调试版中保持窗口可见以便调试
        #[cfg(all(windows, debug_assertions))]
        {
            log::debug!("批处理文件流式执行保持窗口可见 (调试版)");
        }

        match cmd.spawn() {
            Ok(mut child) => {
                let stdout = child.stdout.take().unwrap();
                let stderr = child.stderr.take().unwrap();

                let app_handle_stdout = app_handle.clone();
                let app_handle_stderr = app_handle.clone();

                // 处理stdout流
                let stdout_handle = task::spawn_blocking(move || {
                    let reader = BufReader::new(stdout);
                    let mut output_lines = Vec::new();

                    for line in reader.lines() {
                        match line {
                            Ok(line_content) => {
                                output_lines.push(line_content.clone());

                                // 发送实时输出事件
                                let _ = app_handle_stdout.emit(
                                    "batch-output",
                                    serde_json::json!({
                                        "type": "stdout",
                                        "data": format!("{}\n", line_content)
                                    }),
                                );
                            }
                            Err(e) => {
                                log::error!("Error reading stdout line: {}", e);
                                break;
                            }
                        }
                    }
                    output_lines.join("\n")
                });

                // 处理stderr流
                let stderr_handle = task::spawn_blocking(move || {
                    let reader = BufReader::new(stderr);
                    let mut error_lines = Vec::new();

                    for line in reader.lines() {
                        match line {
                            Ok(line_content) => {
                                error_lines.push(line_content.clone());

                                // 发送实时错误输出事件
                                let _ = app_handle_stderr.emit(
                                    "batch-output",
                                    serde_json::json!({
                                        "type": "stderr",
                                        "data": format!("{}\n", line_content)
                                    }),
                                );
                            }
                            Err(e) => {
                                log::error!("Error reading stderr line: {}", e);
                                break;
                            }
                        }
                    }
                    error_lines.join("\n")
                });

                // 等待进程完成
                let exit_status = child.wait();

                // 等待输出流处理完成
                let stdout_result = stdout_handle.await.unwrap_or_default();
                let stderr_result = stderr_handle.await.unwrap_or_default();

                match exit_status {
                    Ok(status) => {
                        let combined_output = if stderr_result.is_empty() {
                            stdout_result
                        } else {
                            format!("{}\n{}", stdout_result, stderr_result)
                        };

                        log::info!(
                            "Batch file streaming execution completed with exit code: {:?}",
                            status.code()
                        );

                        Ok(CommandResult {
                            success: status.success(),
                            output: combined_output,
                            error: if status.success() {
                                None
                            } else {
                                Some(stderr_result)
                            },
                            exit_code: status.code(),
                        })
                    }
                    Err(e) => {
                        let error_msg = format!("等待批处理文件完成失败: {}", e);
                        log::error!("{}", error_msg);
                        Ok(CommandResult {
                            success: false,
                            output: stdout_result,
                            error: Some(error_msg),
                            exit_code: Some(1),
                        })
                    }
                }
            }
            Err(e) => {
                let error_msg = format!("启动批处理文件失败: {}", e);
                log::error!("{}", error_msg);
                Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(error_msg),
                    exit_code: Some(1),
                })
            }
        }
    }

    #[cfg(not(windows))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("批处理文件执行功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}
