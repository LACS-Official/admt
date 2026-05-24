use crate::device::CommandResult;
use crate::error::Result;
use std::process::Command;

/// 打开设备管理器
#[tauri::command]
pub async fn open_device_manager() -> Result<CommandResult> {
    log::info!("Opening Device Manager using improved method");

    #[cfg(windows)]
    {
        // 方法1: 尝试直接启动 devmgmt.msc
        log::info!("Attempting to open Device Manager with devmgmt.msc");
        let mut cmd = Command::new("devmgmt.msc");

        // 设置工作目录为系统目录
        if let Ok(system_dir) = std::env::var("SYSTEMROOT") {
            cmd.current_dir(format!("{}\\System32", system_dir));
        }

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("Device Manager started successfully with PID: {}", pid);

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                return Ok(CommandResult {
                    success: true,
                    output: format!("设备管理器已成功打开 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::warn!("Direct method failed: {}", e);
            }
        }

        // 方法2: 使用 cmd /c start 作为备用方案
        log::info!("Attempting to open Device Manager with cmd /c start");
        let mut cmd2 = Command::new("cmd");
        cmd2.args(["/c", "start", "", "devmgmt.msc"]);

        match cmd2.spawn() {
            Ok(_) => {
                log::info!("Device Manager started via cmd /c start");

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

                return Ok(CommandResult {
                    success: true,
                    output: "设备管理器已成功打开 (通过cmd启动)".to_string(),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::warn!("CMD method failed: {}", e);
            }
        }

        // 方法3: 使用 explorer 作为最后的备用方案
        log::info!("Attempting to open Device Manager with explorer");
        let mut cmd3 = Command::new("explorer");
        cmd3.args(["devmgmt.msc"]);

        match cmd3.spawn() {
            Ok(_) => {
                log::info!("Device Manager started via explorer");

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

                return Ok(CommandResult {
                    success: true,
                    output: "设备管理器已成功打开 (通过explorer启动)".to_string(),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::error!("Explorer method also failed: {}", e);
            }
        }

        // 所有方法都失败
        log::error!("All methods failed to open Device Manager");
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("无法打开设备管理器，所有启动方法都失败了。请检查系统配置。".to_string()),
            exit_code: Some(1),
        })
    }

    #[cfg(not(windows))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("设备管理器功能仅在Windows系统上可用".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 打开任务管理器
#[tauri::command]
pub async fn open_task_manager() -> Result<CommandResult> {
    log::info!("Opening Task Manager");

    #[cfg(windows)]
    {
        // 方法1: 尝试直接启动 taskmgr.exe
        log::info!("Attempting to open Task Manager with taskmgr.exe");
        let mut cmd = Command::new("taskmgr.exe");

        // 设置工作目录为系统目录
        if let Ok(system_dir) = std::env::var("SYSTEMROOT") {
            cmd.current_dir(format!("{}\\System32", system_dir));
        }

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("Task Manager started successfully with PID: {}", pid);

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                return Ok(CommandResult {
                    success: true,
                    output: format!("任务管理器已成功打开 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::warn!("Direct method failed: {}", e);
            }
        }

        // 方法2: 使用 cmd /c start 作为备用方案
        log::info!("Attempting to open Task Manager with cmd /c start");
        let mut cmd2 = Command::new("cmd");
        cmd2.args(["/c", "start", "", "taskmgr.exe"]);

        match cmd2.spawn() {
            Ok(_) => {
                log::info!("Task Manager started via cmd /c start");

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

                return Ok(CommandResult {
                    success: true,
                    output: "任务管理器已成功打开 (通过cmd启动)".to_string(),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::warn!("CMD method failed: {}", e);
            }
        }

        // 方法3: 使用 explorer 作为最后的备用方案
        log::info!("Attempting to open Task Manager with explorer");
        let mut cmd3 = Command::new("explorer");
        cmd3.args(["taskmgr.exe"]);

        match cmd3.spawn() {
            Ok(_) => {
                log::info!("Task Manager started via explorer");

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

                return Ok(CommandResult {
                    success: true,
                    output: "任务管理器已成功打开 (通过explorer启动)".to_string(),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::error!("Explorer method also failed: {}", e);
            }
        }

        // 方法4: 使用 Ctrl+Shift+Esc 快捷键模拟
        log::info!("Attempting to open Task Manager with keyboard shortcut simulation");
        let mut cmd4 = Command::new("cmd");
        cmd4.args(["/c", "echo", "Set WshShell = WScript.CreateObject(\"WScript.Shell\") > %temp%\\open_taskmgr.vbs && echo WshShell.SendKeys \"^+{ESC}\" >> %temp%\\open_taskmgr.vbs && cscript //nologo %temp%\\open_taskmgr.vbs && del %temp%\\open_taskmgr.vbs"]);

        match cmd4.output() {
            Ok(_) => {
                log::info!("Task Manager opened via keyboard shortcut simulation");

                // 等待一小段时间确保进程启动
                tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

                return Ok(CommandResult {
                    success: true,
                    output: "任务管理器已成功打开 (通过快捷键模拟)".to_string(),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::error!("Keyboard shortcut simulation failed: {}", e);
            }
        }

        // 所有方法都失败
        log::error!("All methods failed to open Task Manager");
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("无法打开任务管理器，所有启动方法都失败了。请检查系统配置。".to_string()),
            exit_code: Some(1),
        })
    }

    #[cfg(target_os = "linux")]
    {
        log::info!("Attempting to open system monitor on Linux");
        let mut cmd = Command::new("gnome-system-monitor");
        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("System monitor started successfully with PID: {}", pid);
                return Ok(CommandResult {
                    success: true,
                    output: format!("系统监视器已成功打开 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                });
            }
            Err(e) => {
                log::error!("Failed to open gnome-system-monitor: {}", e);
                return Ok(CommandResult {
                    success: false,
                    output: String::new(),
                    error: Some(format!("无法打开系统监视器: {}", e)),
                    exit_code: Some(1),
                });
            }
        }
    }

    #[cfg(not(any(windows, target_os = "linux")))]
    {
        Ok(CommandResult {
            success: false,
            output: String::new(),
            error: Some("任务管理器功能目前仅支持 Windows 和 Linux".to_string()),
            exit_code: Some(1),
        })
    }
}
