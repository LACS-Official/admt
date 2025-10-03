use crate::adb::device::device_info::get_device_info;
use crate::device::{CommandResult, DeviceFile};
use crate::error::{AdmtError, Result};
use crate::utils::execute_adb_command as utils_execute_adb_command;

/// 推送文件到设备
#[tauri::command]
pub async fn push_file(
    serial: String,
    local_path: String,
    remote_path: String,
) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let args = vec!["-s", &serial, "push", &local_path, &remote_path];
    utils_execute_adb_command(&args, Some(300)).await
}

/// 从设备拉取文件
#[tauri::command]
pub async fn pull_file(
    serial: String,
    remote_path: String,
    local_path: String,
) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let args = vec!["-s", &serial, "pull", &remote_path, &local_path];
    utils_execute_adb_command(&args, Some(300)).await
}

/// 列出设备文件
#[tauri::command]
pub async fn list_device_files(serial: String, path: String) -> Result<Vec<DeviceFile>> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    // 使用 ls -la：通用且可从权限位判断是否目录
    let args = vec!["-s", &serial, "shell", "ls", "-la", &path];
    let result = utils_execute_adb_command(&args, Some(30)).await?;

    // 调试输出：打印原始命令和结果
    println!("=== ADB 命令调试 ===");
    println!("执行命令: adb -s {} shell ls -la {}", serial, path);
    println!("命令成功: {}", result.success);
    println!("原始输出:\n{}", result.output);
    if let Some(ref error) = result.error {
        println!("错误信息: {}", error);
    }
    println!("=== 调试结束 ===");

    if !result.success {
        return Err(AdmtError::CommandFailed {
            command: "ls".to_string(),
            error: result.error.unwrap_or_else(|| "Unknown error".to_string()),
        });
    }

    let mut files = Vec::new();
    let mut line_count = 0;
    println!("=== 开始解析文件列表 ===");

    for line in result.output.lines() {
        line_count += 1;
        println!("处理第{}行: '{}'", line_count, line);

        if line.trim().is_empty() || line.starts_with("total") {
            println!("跳过空行或total行");
            continue;
        }

        // 解析 ls -la 输出：从权限位判断目录，并提取名称
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with("total") {
            println!("跳过空行/total行");
            continue;
        }

        // 例：drwxr-xr-x  2 u0_a123 u0_a123    4096 Aug  1 12:34 Download
        let is_directory = trimmed.chars().next() == Some('d');
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        println!("分割字段数: {}, 内容: {:?}", parts.len(), parts);

        let name = if parts.len() >= 9 {
            // 名称可能包含空格，使用 splitn 获取第9个字段之后的所有内容
            let name_part_vec: Vec<&str> = trimmed.splitn(9, ' ').collect();
            let mut nm = if name_part_vec.len() >= 9 {
                name_part_vec[8].to_string()
            } else {
                parts.last().unwrap_or(&"").to_string()
            };
            // 处理符号链接："name -> target" 取左侧 name
            if let Some(idx) = nm.find(" -> ") {
                nm = nm[..idx].to_string();
            }
            nm
        } else {
            // 回退：取最后一个字段
            parts.last().unwrap_or(&"").to_string()
        };

        println!("处理后文件名: '{}', 是目录: {}", name, is_directory);

        // 跳过 . 和 .. 目录
        if name == "." || name == ".." {
            println!("跳过特殊目录: {}", name);
            continue;
        }

        let file_path = if path.ends_with('/') {
            format!("{}{}", path, name)
        } else {
            format!("{}/{}", path, name)
        };

        let file = DeviceFile {
            name: name.clone(),
            path: file_path,
            is_directory,
            size: None,        // ls -F 没有大小信息
            permissions: None, // ls -F 没有权限信息
            modified_time: None,
        };

        println!("添加文件到列表: {:?}", file);
        files.push(file);
    }

    println!("=== 解析完成，共找到 {} 个文件 ===", files.len());
    Ok(files)
}