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
        check_cmd.args(&["/FI", "IMAGENAME eq adb.exe", "/FO", "CSV"]);
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
                force_kill.args(&["/F", "/IM", "adb.exe", "/T"]);
                force_kill.creation_flags(CREATE_NO_WINDOW);
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
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut output = String::new();
        let mut success = true;
        let mut error_msg = None;

        // 执行注册表修改命令
        let commands = vec![
            "reg add \"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\usbflags\\18D1D00D0100\" /v \"osvc\" /t REG_BINARY /d \"0000\" /f",
            "reg add \"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\usbflags\\18D1D00D0100\" /v \"SkipContainerIdQuery\" /t REG_BINARY /d \"01000000\" /f",
            "reg add \"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\usbflags\\18D1D00D0100\" /v \"SkipBOSDescriptorQuery\" /t REG_BINARY /d \"01000000\" /f"
        ];

        for cmd in commands {
            let mut command = Command::new("cmd");
            command.args(&["/C", cmd]);
            command.creation_flags(CREATE_NO_WINDOW);

            match command.output() {
                Ok(result) => {
                    let stdout = String::from_utf8_lossy(&result.stdout);
                    let stderr = String::from_utf8_lossy(&result.stderr);
                    output.push_str(&format!("命令: {}\n", cmd));
                    output.push_str(&format!("输出: {}\n", stdout));
                    if !stderr.is_empty() {
                        output.push_str(&format!("错误: {}\n", stderr));
                    }
                    output.push_str("---\n");

                    if !result.status.success() {
                        success = false;
                        error_msg = Some(format!("命令执行失败: {}", cmd));
                    }
                }
                Err(e) => {
                    output.push_str(&format!("命令执行错误: {}\n", e));
                    success = false;
                    error_msg = Some(e.to_string());
                }
            }
        }

        if success {
            log::info!("USB 3.0 registry modifications completed");
            Ok(CommandResult {
                success: true,
                output: "USB 3.0注册表修改完成，请重新连接设备".to_string(),
                error: None,
                exit_code: Some(0),
            })
        } else {
            log::error!("Failed to modify USB 3.0 registry: {:?}", error_msg);
            Ok(CommandResult {
                success: false,
                output: format!("USB 3.0注册表修改失败: {}", output),
                error: error_msg,
                exit_code: Some(1),
            })
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
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let mut output = String::new();
        let mut success = true;
        let mut error_msg = None;

        // 执行注册表删除命令
        let commands = vec![
            "reg delete \"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\usbflags\\18D1D00D0100\" /v \"osvc\" /f",
            "reg delete \"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\usbflags\\18D1D00D0100\" /v \"SkipContainerIdQuery\" /f",
            "reg delete \"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\usbflags\\18D1D00D0100\" /v \"SkipBOSDescriptorQuery\" /f"
        ];

        for cmd in commands {
            let mut command = Command::new("cmd");
            command.args(&["/C", cmd]);
            command.creation_flags(CREATE_NO_WINDOW);

            match command.output() {
                Ok(result) => {
                    let stdout = String::from_utf8_lossy(&result.stdout);
                    let stderr = String::from_utf8_lossy(&result.stderr);
                    output.push_str(&format!("命令: {}\n", cmd));
                    output.push_str(&format!("输出: {}\n", stdout));
                    if !stderr.is_empty() {
                        output.push_str(&format!("错误: {}\n", stderr));
                    }
                    output.push_str("---\n");

                    if !result.status.success() {
                        success = false;
                        error_msg = Some(format!("命令执行失败: {}", cmd));
                    }
                }
                Err(e) => {
                    output.push_str(&format!("命令执行错误: {}\n", e));
                    success = false;
                    error_msg = Some(e.to_string());
                }
            }
        }

        if success {
            log::info!("USB 3.0 registry modifications undone");
            Ok(CommandResult {
                success: true,
                output: "USB 3.0注册表修改已撤销，请重新连接设备".to_string(),
                error: None,
                exit_code: Some(0),
            })
        } else {
            log::error!("Failed to undo USB 3.0 registry modifications: {:?}", error_msg);
            Ok(CommandResult {
                success: false,
                output: format!("USB 3.0注册表修改撤销失败: {}", output),
                error: error_msg,
                exit_code: Some(1),
            })
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