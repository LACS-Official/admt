use std::path::{Path, PathBuf};
use std::process::Command;
use serde::{Deserialize, Serialize};
use crate::error::{HoutError, Result};

// Windows平台特有导入
#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdbToolsInfo {
    pub adb_path: Option<String>,
    pub fastboot_path: Option<String>,
    pub is_available: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
            log::info!("ADB工具路径解析成功: ADB={}, Fastboot={}", adb_path.display(), fastboot_path.display());
            
            // 验证ADB可执行文件存在
            if adb_path.exists() {
                adb_info.adb_path = Some(adb_path.to_string_lossy().to_string());
                log::info!("✅ ADB文件存在: {}", adb_path.display());
                
                // 获取ADB版本
                match get_adb_version(&adb_path) {
                    Ok(version) => {
                        adb_info.version = Some(version.clone());
                        log::info!("✅ ADB版本获取成功: {}", version);
                    }
                    Err(e) => {
                        log::warn!("⚠️ ADB版本获取失败: {}", e);
                        // 版本获取失败不影响可用性
                    }
                }
            } else {
                let error_msg = format!("ADB可执行文件不存在: {}", adb_path.display());
                adb_info.error = Some(error_msg.clone());
                log::error!("❌ {}", error_msg);
                return Ok(adb_info);
            }

            // 验证Fastboot可执行文件存在
            if fastboot_path.exists() {
                adb_info.fastboot_path = Some(fastboot_path.to_string_lossy().to_string());
                log::info!("✅ Fastboot文件存在: {}", fastboot_path.display());
            } else {
                log::warn!("⚠️ Fastboot可执行文件不存在: {}", fastboot_path.display());
                // Fastboot不存在不影响ADB的可用性
            }

            adb_info.is_available = true;
            log::info!("🎉 ADB工具初始化成功，可用性: true");
        }
        Err(e) => {
            let error_msg = format!("解析ADB工具路径失败: {}", e);
            adb_info.error = Some(error_msg.clone());
            log::error!("❌ {}", error_msg);
            // is_available 保持为 false
        }
    }

    Ok(adb_info)
}

/// 解析ADB工具的完整路径
fn resolve_adb_tools_paths(_app_handle: &tauri::AppHandle) -> Result<(PathBuf, PathBuf)> {
    // 使用与cache.rs相同的路径查找逻辑
    let adb_path = crate::cache::get_cached_adb_path().clone();
    let fastboot_path = crate::cache::get_cached_fastboot_path().clone();

    log::info!("Resolved ADB path: {:?}", adb_path);
    log::info!("Resolved Fastboot path: {:?}", fastboot_path);

    // 检查路径是否有效
    if adb_path.to_string_lossy().contains("INVALID_") {
        return Err(HoutError::PathResolution("ADB可执行文件路径无效".to_string()));
    }
    
    if fastboot_path.to_string_lossy().contains("INVALID_") {
        return Err(HoutError::PathResolution("Fastboot可执行文件路径无效".to_string()));
    }

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
    let mut missing_files = Vec::new();
    
    // 使用与cache.rs相同的路径查找逻辑
    let adb_path = crate::cache::get_cached_adb_path();
    let fastboot_path = crate::cache::get_cached_fastboot_path();
    
    // 检查ADB文件
    if !adb_path.exists() {
        missing_files.push(format!("adb.exe - {}", adb_path.display()));
        log::warn!("Missing ADB file: {}", adb_path.display());
    } else {
        log::debug!("ADB tool file exists: {:?}", adb_path);
    }
    
    // 检查Fastboot文件
    if !fastboot_path.exists() {
        missing_files.push(format!("fastboot.exe - {}", fastboot_path.display()));
        log::warn!("Missing Fastboot file: {}", fastboot_path.display());
    } else {
        log::debug!("Fastboot tool file exists: {:?}", fastboot_path);
    }
    
    // 检查ADB依赖DLL文件(仅在Windows上)
    #[cfg(windows)]
    {
        if let Some(adb_dir) = adb_path.parent() {
            let required_dlls = vec!["AdbWinApi.dll", "AdbWinUsbApi.dll"];
            for dll_name in required_dlls {
                let dll_path = adb_dir.join(dll_name);
                if !dll_path.exists() {
                    missing_files.push(format!("{} - {}", dll_name, dll_path.display()));
                    log::warn!("Missing ADB DLL file: {}", dll_path.display());
                } else {
                    log::debug!("ADB DLL file exists: {:?}", dll_path);
                }
            }
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
    let mut cmd = tokio::process::Command::new(adb_path);
    cmd.args(&cmd_args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    // 在发布版中隐藏控制台窗口，在调试版中保持可见
    #[cfg(all(windows, not(debug_assertions)))]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        log::debug!("ADB命令设置隐藏窗口 (发布版): {}", adb_path.display());
    }

    // 在调试版中保持窗口可见以便调试
    #[cfg(all(windows, debug_assertions))]
    {
        log::debug!("ADB命令保持窗口可见 (调试版): {}", adb_path.display());
    }

    // 非Windows平台的处理
    #[cfg(not(windows))]
    {
        log::debug!("ADB命令在非Windows平台执行: {}", adb_path.display());
    }

    // 设置超时
    let timeout_duration = std::time::Duration::from_secs(timeout.unwrap_or(30));
    
    // 使用tokio执行命令
    let output = tokio::time::timeout(timeout_duration, cmd.output())
        .await
        .map_err(|_| HoutError::Command("命令执行超时".to_string()))?
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
    let mut cmd = tokio::process::Command::new(fastboot_path);
    cmd.args(&cmd_args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    // 在发布版中隐藏控制台窗口，在调试版中保持可见
    #[cfg(all(windows, not(debug_assertions)))]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        log::debug!("Fastboot命令设置隐藏窗口 (发布版): {}", fastboot_path.display());
    }

    // 在调试版中保持窗口可见以便调试
    #[cfg(all(windows, debug_assertions))]
    {
        log::debug!("Fastboot命令保持窗口可见 (调试版): {}", fastboot_path.display());
    }

    // 非Windows平台的处理
    #[cfg(not(windows))]
    {
        log::debug!("Fastboot命令在非Windows平台执行: {}", fastboot_path.display());
    }

    // 设置超时
    let timeout_duration = std::time::Duration::from_secs(timeout.unwrap_or(30));
    
    // 使用tokio执行命令
    let output = tokio::time::timeout(timeout_duration, cmd.output())
        .await
        .map_err(|_| HoutError::Command("命令执行超时".to_string()))?
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