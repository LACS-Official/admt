use crate::device::CommandResult;
use crate::error::Result;
use crate::utils::execute_adb_command as utils_execute_adb_command;

/// 重启ADB服务
#[tauri::command]
pub async fn restart_adb_service() -> Result<CommandResult> {
    log::info!("Attempting to restart ADB service");

    // 第一步：停止ADB服务
    log::info!("Step 1: Stopping ADB server");
    let kill_result = utils_execute_adb_command(&["kill-server"], Some(10)).await;

    match &kill_result {
        Ok(result) => {
            log::info!(
                "ADB kill-server result: success={}, output={}",
                result.success,
                result.output
            );
            if let Some(ref error) = result.error {
                log::warn!("ADB kill-server error: {}", error);
            }
        }
        Err(e) => {
            log::warn!("ADB kill-server command failed: {}", e);
        }
    }

    // 等待ADB服务完全停止
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    // 第二步：验证ADB服务已停止（通过检查进程）
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut check_cmd = Command::new("tasklist");
        check_cmd.args(["/FI", "IMAGENAME eq adb.exe", "/FO", "CSV"]);
        check_cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = check_cmd.output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut adb_running = false;
            for line in stdout.lines() {
                if line.contains("adb.exe") && !line.contains("映像名称") {
                    adb_running = true;
                    break;
                }
            }

            if adb_running {
                log::warn!("ADB processes still running, attempting to force kill");
                let mut force_kill = Command::new("taskkill");
                force_kill.args(["/F", "/IM", "adb.exe", "/T"]);
                force_kill.creation_flags(CREATE_NO_WINDOW);
                let _ = force_kill.output();

                // 再等待一秒
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        }
    }

    #[cfg(not(windows))]
    {
        use std::process::Command;

        let mut check_cmd = Command::new("pgrep");
        check_cmd.arg("-x").arg("adb");

        if let Ok(output) = check_cmd.output() {
            if output.status.success() {
                log::warn!("ADB processes still running, attempting to force kill");
                let mut force_kill = Command::new("killall");
                force_kill.args(["-9", "adb"]);
                let _ = force_kill.output();

                // 再等待一秒
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        }
    }

    // 第三步：启动ADB服务
    log::info!("Step 2: Starting ADB server");
    let start_result = utils_execute_adb_command(&["start-server"], Some(15)).await;

    match start_result {
        Ok(result) => {
            log::info!(
                "ADB start-server result: success={}, output={}",
                result.success,
                result.output
            );

            if result.success || result.output.contains("daemon started successfully") {
                // 第四步：验证ADB服务是否正常工作
                log::info!("Step 3: Verifying ADB service");
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

                let verify_result = utils_execute_adb_command(&["version"], Some(5)).await;
                match verify_result {
                    Ok(verify) => {
                        if verify.success && verify.output.contains("Android Debug Bridge") {
                            log::info!("ADB service verification successful");
                            Ok(CommandResult {
                                success: true,
                                output: "ADB服务已成功重启并验证正常工作".to_string(),
                                error: None,
                                exit_code: Some(0),
                            })
                        } else {
                            log::warn!("ADB service verification failed: {}", verify.output);
                            Ok(CommandResult {
                                success: false,
                                output: "ADB服务启动但验证失败".to_string(),
                                error: Some(format!("验证失败: {}", verify.output)),
                                exit_code: Some(1),
                            })
                        }
                    }
                    Err(e) => {
                        log::error!("ADB service verification error: {}", e);
                        Ok(CommandResult {
                            success: false,
                            output: "ADB服务启动但无法验证".to_string(),
                            error: Some(format!("验证错误: {}", e)),
                            exit_code: Some(1),
                        })
                    }
                }
            } else {
                log::warn!("ADB start-server failed: {:?}", result.error);
                Ok(CommandResult {
                    success: false,
                    output: format!("ADB服务启动失败: {}", result.output),
                    error: result.error,
                    exit_code: result.exit_code,
                })
            }
        }
        Err(e) => {
            log::error!("Failed to start ADB service: {}", e);
            Err(e)
        }
    }
}

/// USB 3.0修复
#[tauri::command]
pub async fn fix_usb3_connection() -> Result<CommandResult> {
    log::info!("Attempting to fix USB 3.0 connection");

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // 获取批处理文件的路径
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let bat_path = std::path::Path::new(&manifest_dir)
            .join("tools")
            .join("lacs")
            .join("Usb_fix.bat");

        let mut command = Command::new("cmd");
        command.args(["/C", &bat_path.to_string_lossy()]);
        command.creation_flags(CREATE_NO_WINDOW);

        match command.output() {
            Ok(result) => {
                let stdout = String::from_utf8_lossy(&result.stdout);
                let stderr = String::from_utf8_lossy(&result.stderr);

                let output = format!("输出: {}\n错误: {}", stdout, stderr);

                if result.status.success() {
                    log::info!("USB 3.0 registry modifications completed");
                    Ok(CommandResult {
                        success: true,
                        output: "USB 3.0注册表修改完成，请重新连接设备".to_string(),
                        error: None,
                        exit_code: Some(0),
                    })
                } else {
                    log::error!("Failed to modify USB 3.0 registry: {}", stderr);
                    Ok(CommandResult {
                        success: false,
                        output: format!("USB 3.0注册表修改失败: {}", output),
                        error: Some(stderr.to_string()),
                        exit_code: Some(1),
                    })
                }
            }
            Err(e) => {
                log::error!("Failed to execute USB 3.0 fix script: {}", e);
                Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("执行USB 3.0修复脚本失败: {}", e)),
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
            error: Some("USB 3.0修复功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}

/// USB 3.0修复撤销
#[tauri::command]
pub async fn unfix_usb3_connection() -> Result<CommandResult> {
    log::info!("Attempting to undo USB 3.0 connection fix");

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // 获取批处理文件的路径
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let bat_path = std::path::Path::new(&manifest_dir)
            .join("tools")
            .join("lacs")
            .join("Usb_Unfix.bat");

        let mut command = Command::new("cmd");
        command.args(["/C", &bat_path.to_string_lossy()]);
        command.creation_flags(CREATE_NO_WINDOW);

        match command.output() {
            Ok(result) => {
                let stdout = String::from_utf8_lossy(&result.stdout);
                let stderr = String::from_utf8_lossy(&result.stderr);

                let output = format!("输出: {}\n错误: {}", stdout, stderr);

                if result.status.success() {
                    log::info!("USB 3.0 registry modifications reverted");
                    Ok(CommandResult {
                        success: true,
                        output: "USB 3.0注册表修改已撤销，请重新连接设备".to_string(),
                        error: None,
                        exit_code: Some(0),
                    })
                } else {
                    log::error!("Failed to revert USB 3.0 registry: {}", stderr);
                    Ok(CommandResult {
                        success: false,
                        output: format!("USB 3.0注册表撤销失败: {}", output),
                        error: Some(stderr.to_string()),
                        exit_code: Some(1),
                    })
                }
            }
            Err(e) => {
                log::error!("Failed to execute USB 3.0 unfix script: {}", e);
                Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("执行USB 3.0撤销脚本失败: {}", e)),
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
            error: Some("USB 3.0修复撤销功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}
