use std::path::{Path, PathBuf};
use std::process::Command;
use serde::{Deserialize, Serialize};
use crate::error::{HoutError, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbToolsInfo {
    pub adb_path: Option<String>,
    pub fastboot_path: Option<String>,
    pub is_available: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbIntegrityReport {
    pub success: bool,
    pub missing: Vec<String>,
}

/// 获取打包后的ADB工具路径信息
pub fn get_adb_tools_info(app_handle: &tauri::AppHandle) -> Result<AdbToolsInfo> {
    let mut adb_info = AdbToolsInfo {
        adb_path: None,
        fastboot_path: None,
        is_available: false,
        version: None,
        error: None,
    };

    // 尝试解析ADB工具路径
    match resolve_adb_tools_paths(app_handle) {
        Ok((adb_path, fastboot_path)) => {
            // 验证ADB可执行文件存在
            if adb_path.exists() {
                adb_info.adb_path = Some(adb_path.to_string_lossy().to_string());
                
                // 获取ADB版本
                if let Ok(version) = get_adb_version(&adb_path) {
                    adb_info.version = Some(version);
                }
            } else {
                adb_info.error = Some("ADB可执行文件不存在".to_string());
                return Ok(adb_info);
            }

            // 验证Fastboot可执行文件存在
            if fastboot_path.exists() {
                adb_info.fastboot_path = Some(fastboot_path.to_string_lossy().to_string());
            } else {
                log::warn!("Fastboot可执行文件不存在: {:?}", fastboot_path);
            }

            adb_info.is_available = true;
        }
        Err(e) => {
            adb_info.error = Some(format!("解析ADB工具路径失败: {}", e));
            log::error!("Failed to resolve ADB tools paths: {}", e);
        }
    }

    Ok(adb_info)
}

/// 解析ADB工具的完整路径
fn resolve_adb_tools_paths(_app_handle: &tauri::AppHandle) -> Result<(PathBuf, PathBuf)> {
    // 在 Tauri 2.0 中，使用 app_handle.app_data_dir() 或其他新的 API
    // 目前先使用相对路径作为临时解决方案
    let app_dir = std::env::current_exe()
        .map_err(|e| HoutError::PathResolution(format!("无法获取应用程序路径: {}", e)))?
        .parent()
        .ok_or_else(|| HoutError::PathResolution("无法获取应用程序目录".to_string()))?
        .to_path_buf();
    
    let adb_path = app_dir.join("tools").join("adb").join("adb.exe");
    let fastboot_path = app_dir.join("tools").join("adb").join("fastboot.exe");

    log::info!("Resolved ADB path: {:?}", adb_path);
    log::info!("Resolved Fastboot path: {:?}", fastboot_path);

    Ok((adb_path, fastboot_path))
}

/// 获取ADB版本信息
fn get_adb_version(adb_path: &Path) -> Result<String> {
    let output = Command::new(adb_path)
        .arg("version")
        .output()
        .map_err(|e| HoutError::Command(format!("执行ADB version命令失败: {}", e)))?;

    if !output.status.success() {
        return Err(HoutError::Command("ADB version命令执行失败".to_string()));
    }

    let version_output = String::from_utf8_lossy(&output.stdout);
    
    // 解析版本信息，提取版本号
    for line in version_output.lines() {
        if line.contains("Android Debug Bridge version") {
            return Ok(line.trim().to_string());
        }
    }

    Ok(version_output.trim().to_string())
}

/// 验证ADB工具文件完整性
pub fn verify_adb_tools_integrity(_app_handle: &tauri::AppHandle) -> Result<AdbIntegrityReport> {
    let required_files = vec![
        "tools/adb/adb.exe",
        "tools/adb/fastboot.exe",
        "tools/adb/AdbWinApi.dll",
        "tools/adb/AdbWinUsbApi.dll",
    ];

    let mut missing_files = Vec::new();
    
    // 获取应用程序目录
    let app_dir = match std::env::current_exe() {
        Ok(exe_path) => {
            match exe_path.parent() {
                Some(dir) => dir.to_path_buf(),
                None => {
                    missing_files.push("无法获取应用程序目录".to_string());
                    return Ok(AdbIntegrityReport {
                        success: false,
                        missing: missing_files,
                    });
                }
            }
        }
        Err(e) => {
            missing_files.push(format!("无法获取应用程序路径: {}", e));
            return Ok(AdbIntegrityReport {
                success: false,
                missing: missing_files,
            });
        }
    };

    for file_path in &required_files {
        let full_path = app_dir.join(file_path);
        if !full_path.exists() {
            missing_files.push(file_path.to_string());
            log::warn!("Missing ADB tool file: {}", file_path);
        } else {
            log::debug!("ADB tool file exists: {:?}", full_path);
        }
    }

    let success = missing_files.is_empty();
    
    if success {
        log::info!("ADB工具完整性验证通过");
    } else {
        log::error!("ADB工具完整性验证失败，缺失文件: {:?}", missing_files);
    }

    Ok(AdbIntegrityReport {
        success,
        missing: missing_files,
    })
}

/// 使用指定的ADB路径执行命令
pub async fn execute_adb_command_with_path(
    adb_path: &str,
    serial: &str,
    command: &str,
    args: &[String],
    timeout: Option<u64>,
) -> Result<crate::device::CommandResult> {
    let adb_path = Path::new(adb_path);
    
    // 验证ADB路径是否存在
    if !adb_path.exists() {
        return Err(HoutError::Command(format!("ADB可执行文件不存在: {}", adb_path.display())));
    }

    // 构建完整的命令参数
    let mut cmd_args = vec!["-s".to_string(), serial.to_string()];
    cmd_args.push(command.to_string());
    cmd_args.extend_from_slice(args);

    log::debug!("Executing ADB command: {:?} {:?}", adb_path, cmd_args);

    // 执行命令
    let mut cmd = Command::new(adb_path);
    cmd.args(&cmd_args);

    // 设置超时
    let timeout_duration = std::time::Duration::from_secs(timeout.unwrap_or(30));
    
    // 使用tokio执行命令（需要添加适当的异步处理）
    let output = tokio::time::timeout(timeout_duration, tokio::task::spawn_blocking(move || {
        cmd.output()
    }))
    .await
    .map_err(|_| HoutError::Command("命令执行超时".to_string()))?
    .map_err(|e| HoutError::Command(format!("命令执行任务失败: {}", e)))?
    .map_err(|e| HoutError::Command(format!("ADB命令执行失败: {}", e)))?;

    let success = output.status.success();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let result = crate::device::CommandResult {
        success,
        output: stdout,
        error: if stderr.is_empty() { None } else { Some(stderr) },
        exit_code: output.status.code(),
    };

    if success {
        log::debug!("ADB命令执行成功: {}", result.output);
    } else {
        log::warn!("ADB命令执行失败: {:?}", result.error);
    }

    Ok(result)
}

/// 使用指定的Fastboot路径执行命令
pub async fn execute_fastboot_command_with_path(
    fastboot_path: &str,
    serial: &str,
    command: &str,
    args: &[String],
    timeout: Option<u64>,
) -> Result<crate::device::CommandResult> {
    let fastboot_path = Path::new(fastboot_path);
    
    // 验证Fastboot路径是否存在
    if !fastboot_path.exists() {
        return Err(HoutError::Command(format!("Fastboot可执行文件不存在: {}", fastboot_path.display())));
    }

    // 构建完整的命令参数
    let mut cmd_args = vec!["-s".to_string(), serial.to_string()];
    cmd_args.push(command.to_string());
    cmd_args.extend_from_slice(args);

    log::debug!("Executing Fastboot command: {:?} {:?}", fastboot_path, cmd_args);

    // 执行命令
    let mut cmd = Command::new(fastboot_path);
    cmd.args(&cmd_args);

    // 设置超时
    let timeout_duration = std::time::Duration::from_secs(timeout.unwrap_or(30));
    
    // 使用tokio执行命令
    let output = tokio::time::timeout(timeout_duration, tokio::task::spawn_blocking(move || {
        cmd.output()
    }))
    .await
    .map_err(|_| HoutError::Command("命令执行超时".to_string()))?
    .map_err(|e| HoutError::Command(format!("命令执行任务失败: {}", e)))?
    .map_err(|e| HoutError::Command(format!("Fastboot命令执行失败: {}", e)))?;

    let success = output.status.success();
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    let result = crate::device::CommandResult {
        success,
        output: stdout,
        error: if stderr.is_empty() { None } else { Some(stderr) },
        exit_code: output.status.code(),
    };

    if success {
        log::debug!("Fastboot命令执行成功: {}", result.output);
    } else {
        log::warn!("Fastboot命令执行失败: {:?}", result.error);
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_adb_version() {
        // 这里可以添加单元测试
    }
}