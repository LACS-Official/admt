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

    let is_windows = cfg!(windows);
    let _path_sep = if is_windows { ";" } else { ":" };

    // 验证工作目录存在
    let work_dir = std::path::Path::new(&working_directory);
    if !work_dir.exists() {
        return Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("工作目录不存在: {}", working_directory)),
            exit_code: Some(1),
        });
    }

    // 构建脚本文件的完整路径
    let script_path = work_dir.join(&batch_file_name);
    if !script_path.exists() {
        return Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("脚本文件不存在: {}", script_path.display())),
            exit_code: Some(1),
        });
    }

    log::info!("Executing script at: {}", script_path.display());

    // 确保具有执行权限 (针对 Linux)
    let _ = crate::utils::ensure_executable(&script_path);

    let mut cmd = if is_windows {
        let mut c = Command::new("cmd");
        c.args(["/c", &batch_file_name]);
        c
    } else {
        let mut c = Command::new("sh");
        c.arg(&batch_file_name);
        c
    };

    cmd.current_dir(&working_directory)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // 设置环境变量
    let current_path = std::env::var("PATH").unwrap_or_default();
    if is_windows {
        let system_root = std::env::var("SYSTEMROOT").unwrap_or("C:\\Windows".to_string());
        let enhanced_path = format!(
            "{};{}\\System32;{}\\System32\\Wbem",
            current_path, system_root, system_root
        );
        cmd.env("PATH", enhanced_path)
            .env("SYSTEMROOT", &system_root)
            .env("WINDIR", &system_root);
    } else {
        // Linux 平台环境变量增强 (如果需要)
        cmd.env(
            "PATH",
            format!("{}:/usr/local/bin:/usr/bin:/bin", current_path),
        );
    }

    // 继承除PATH外的所有环境变量
    cmd.envs(std::env::vars().filter(|(key, _)| key != "PATH"));

    // 在Windows端隐藏控制台窗口
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
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
                "Script execution completed with exit code: {:?}",
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
            let error_msg = format!("执行脚本失败: {}", e);
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

/// 判断是否为交互式 SSH 登录会话（即未提供要在远端执行的命令）
fn is_interactive_ssh(all_args: &[String]) -> (bool, String) {
    let mut i = 0;
    let mut target_host = String::new();
    let mut command_tokens = Vec::new();

    // 接收参数值的标准 SSH 选项
    let opt_with_arg = [
        "-B", "-b", "-c", "-D", "-E", "-e", "-F", "-I", "-i", "-J",
        "-L", "-l", "-m", "-O", "-o", "-p", "-Q", "-R", "-S", "-W", "-w",
    ];

    while i < all_args.len() {
        let arg = &all_args[i];
        if arg == "--" {
            i += 1;
            while i < all_args.len() {
                if target_host.is_empty() {
                    target_host = all_args[i].clone();
                } else {
                    command_tokens.push(all_args[i].clone());
                }
                i += 1;
            }
            break;
        }

        if arg.starts_with('-') {
            let matches_opt = opt_with_arg.iter().any(|&opt| arg == opt);
            if matches_opt {
                i += 2; // 跳过选项及其值
                continue;
            } else {
                i += 1;
                continue;
            }
        } else {
            if target_host.is_empty() {
                target_host = arg.clone();
            } else {
                command_tokens.push(arg.clone());
            }
            i += 1;
        }
    }

    let is_interactive = !target_host.is_empty() && command_tokens.is_empty();
    (is_interactive, target_host)
}

/// 执行SSH命令
#[tauri::command]
pub async fn execute_ssh_command(
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    log::info!("Executing SSH command: {} {:?}", command, args);

    let mut all_args = Vec::new();
    if !command.is_empty() {
        all_args.push(command);
    }
    all_args.extend(args);

    let (is_interactive, host) = is_interactive_ssh(&all_args);
    if is_interactive {
        #[cfg(windows)]
        {
            let ssh_args_escaped: Vec<String> = all_args
                .iter()
                .map(|a| {
                    if a.contains(' ') || a.contains('"') {
                        format!("\"{}\"", a.replace('"', "\\\""))
                    } else {
                        a.clone()
                    }
                })
                .collect();
            let ssh_cmd_line = format!("ssh {}", ssh_args_escaped.join(" "));
            let window_title = format!("SSH - {}", host);

            let mut spawn_cmd = std::process::Command::new("cmd");
            spawn_cmd.args([
                "/C",
                "start",
                &window_title,
                "cmd.exe",
                "/C",
                &format!(
                    "title {} & {} & echo. & echo [SSH 会话已结束] & pause",
                    window_title, ssh_cmd_line
                ),
            ]);

            match spawn_cmd.spawn() {
                Ok(_) => {
                    return Ok(CommandResult {
                        success: true,
                        output: format!(
                            "[✓] 已在独立终端窗口中启动交互式 SSH 会话\n目标: {}\n执行命令: {}\n提示: 请在弹出的控制台窗口中进行交互操作；会话结束后按任意键即可退出。",
                            host, ssh_cmd_line
                        ),
                        error: None,
                        exit_code: Some(0),
                    });
                }
                Err(e) => {
                    return Ok(CommandResult {
                        success: false,
                        output: String::new(),
                        error: Some(format!("启动外部 SSH 终端失败: {}", e)),
                        exit_code: Some(1),
                    });
                }
            }
        }
    }

    let timeout_duration = std::time::Duration::from_secs(timeout.unwrap_or(30));
    let mut cmd = tokio::process::Command::new("ssh");
    cmd.kill_on_drop(true);

    cmd.args(&all_args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(windows)]
    {
        #[allow(unused_imports)]
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match tokio::time::timeout(timeout_duration, cmd.output()).await {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            Ok(CommandResult {
                success: output.status.success(),
                output: stdout,
                error: if stderr.is_empty() { None } else { Some(stderr) },
                exit_code: output.status.code(),
            })
        }
        Ok(Err(e)) => Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some(format!("SSH 执行失败: {}", e)),
            exit_code: Some(1),
        }),
        Err(_) => Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("SSH 命令执行超时 (30s)".to_string()),
            exit_code: Some(124),
        }),
    }
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

        // 在Windows端隐藏控制台窗口
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("结束ADB服务设置隐藏窗口");
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

    #[cfg(target_os = "linux")]
    {
        // ... (Linux implementation stays same)
        // 在 Linux 上使用 pkill 结束 adb 进程
        let mut cmd = Command::new("pkill");
        cmd.args(["-f", "adb"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

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
                    "ADB service termination (Linux) completed with exit code: {:?}",
                    output.status.code()
                );

                Ok(CommandResult {
                    success: output.status.success() || output.status.code() == Some(1),
                    output: combined_output,
                    error: if output.status.success() || output.status.code() == Some(1) {
                        None
                    } else {
                        Some(stderr.to_string())
                    },
                    exit_code: output.status.code(),
                })
            }
            Err(e) => {
                let error_msg = format!("结束ADB服务失败 (Linux): {}", e);
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

    #[cfg(not(any(windows, target_os = "linux")))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("结束ADB服务功能目前仅支持 Windows 和 Linux".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 结束ADB-5037端口
#[tauri::command]
// 可选：如果不再需要可以删除，或者保留并加上 #[allow(dead_code)]
#[allow(dead_code)]
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

        // 在Windows端隐藏控制台窗口
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("结束ADB-5037端口设置隐藏窗口");
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

    #[cfg(target_os = "linux")]
    {
        // 在 Linux 上使用 fuser 结束占用 5037 端口的进程
        let mut cmd = Command::new("sh");
        cmd.args(["-c", "fuser -k 5037/tcp"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);

                log::info!(
                    "ADB-5037 port termination (Linux) completed with exit code: {:?}",
                    output.status.code()
                );

                Ok(CommandResult {
                    success: output.status.success(),
                    output: stdout.to_string(),
                    error: if output.status.success() {
                        None
                    } else {
                        Some(stderr.to_string())
                    },
                    exit_code: output.status.code(),
                })
            }
            Err(e) => {
                let error_msg = format!("结束ADB-5037端口失败 (Linux): {}", e);
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

    #[cfg(not(any(windows, target_os = "linux")))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("结束ADB-5037端口功能目前仅支持 Windows 和 Linux".to_string()),
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

    #[cfg(any(windows, target_os = "linux"))]
    {
        use std::io::{BufRead, BufReader};
        use std::path::Path;
        use tokio::task;

        let is_windows = cfg!(windows);

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

        // 构建脚本文件的完整路径
        let script_path = work_dir.join(&batch_file_name);
        if !script_path.exists() {
            return Ok(CommandResult {
                success: false,
                output: String::new(),
                error: Some(format!("脚本文件不存在: {}", script_path.display())),
                exit_code: Some(1),
            });
        }

        log::info!(
            "Executing script with streaming at: {}",
            script_path.display()
        );

        // 确保具有执行权限 (针对 Linux)
        if !is_windows {
            let _ = crate::utils::ensure_executable(&script_path);
        }

        let mut cmd = if is_windows {
            let system_root = std::env::var("SYSTEMROOT").unwrap_or("C:\\Windows".to_string());
            let current_path = std::env::var("PATH").unwrap_or_default();
            let enhanced_path = format!(
                "{};{}\\System32;{}\\System32\\Wbem",
                current_path, system_root, system_root
            );

            let mut c = Command::new("cmd");
            c.args(["/c", &batch_file_name]);
            c.env("PATH", enhanced_path);
            c.env("SYSTEMROOT", &system_root);
            c.env("WINDIR", &system_root);
            c
        } else {
            let current_path = std::env::var("PATH").unwrap_or_default();
            let mut c = Command::new("sh");
            c.arg(&batch_file_name);
            c.env(
                "PATH",
                format!("{}:/usr/local/bin:/usr/bin:/bin", current_path),
            );
            c
        };

        cmd.current_dir(&working_directory)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .envs(std::env::vars().filter(|(key, _)| key != "PATH")); // 继承除PATH外的所有环境变量

        // 在Windows端隐藏控制台窗口
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
            log::debug!("脚本文件流式执行设置隐藏窗口");
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
                            "Script streaming execution completed with exit code: {:?}",
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
                        let error_msg = format!("等待脚本文件完成失败: {}", e);
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
                let error_msg = format!("启动脚本文件失败: {}", e);
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

    #[cfg(not(any(windows, target_os = "linux")))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("脚本文件执行功能目前仅支持 Windows 和 Linux".to_string()),
            exit_code: Some(1),
        })
    }
}
