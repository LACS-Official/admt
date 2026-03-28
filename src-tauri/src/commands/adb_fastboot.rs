use crate::error::Result;
use crate::utils::{execute_adb_command as utils_execute_adb_command, execute_fastboot_command};

/// 检查ADB可用性
#[tauri::command]
pub async fn check_adb_availability() -> Result<crate::device::CommandResult> {
    let result = utils_execute_adb_command(&["version"], Some(5)).await?;

    if result.success {
        Ok(crate::device::CommandResult {
            success: true,
            output: result.output,
            error: None,
            exit_code: Some(0),
        })
    } else {
        Ok(crate::device::CommandResult {
            success: false,
            output: String::new(),
            error: Some("ADB不可用或未正确安装".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 诊断 ADB 和 Fastboot 路径问题
#[tauri::command]
pub async fn diagnose_adb_fastboot_paths() -> Result<serde_json::Value> {
    use crate::cache::{get_cached_adb_path, get_cached_fastboot_path};
    use std::collections::HashMap;

    log::info!("Starting ADB/Fastboot path diagnosis...");

    let mut diagnosis: HashMap<String, serde_json::Value> = HashMap::new();

    // 获取当前工作目录
    let current_dir = std::env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "Unknown".to_string());
    diagnosis.insert(
        "current_working_directory".to_string(),
        serde_json::Value::String(current_dir),
    );

    // 获取可执行文件目录
    let exe_dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.display().to_string()))
        .unwrap_or_else(|| "Unknown".to_string());
    diagnosis.insert(
        "executable_directory".to_string(),
        serde_json::Value::String(exe_dir),
    );

    // 获取 PATH 环境变量
    let path_env = std::env::var("PATH").unwrap_or_else(|_| "Not found".to_string());
    diagnosis.insert(
        "path_environment".to_string(),
        serde_json::Value::String(path_env),
    );

    // 获取缓存的 ADB 路径
    let adb_path = get_cached_adb_path();
    diagnosis.insert(
        "cached_adb_path".to_string(),
        serde_json::Value::String(adb_path.display().to_string()),
    );
    diagnosis.insert(
        "adb_exists".to_string(),
        serde_json::Value::Bool(adb_path.exists()),
    );

    // 获取缓存的 Fastboot 路径
    let fastboot_path = get_cached_fastboot_path();
    diagnosis.insert(
        "cached_fastboot_path".to_string(),
        serde_json::Value::String(fastboot_path.display().to_string()),
    );
    diagnosis.insert(
        "fastboot_exists".to_string(),
        serde_json::Value::Bool(fastboot_path.exists()),
    );

    // 检查资源目录（仅检查预期的路径）
    let mut resource_paths = Vec::new();
    use std::env::consts::EXE_SUFFIX;
    let adb_filename = format!("adb{}", EXE_SUFFIX);
    let fb_filename = format!("fastboot{}", EXE_SUFFIX);

    // 1. 生产环境资源目录
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let tools_dir = parent.join("tools").join("adb");
            resource_paths.push(serde_json::json!({
                "path": tools_dir.display().to_string(),
                "exists": tools_dir.exists(),
                "type": "production_tools",
                "adb_exists": tools_dir.join(&adb_filename).exists(),
                "fastboot_exists": tools_dir.join(&fb_filename).exists()
            }));
        }
    }

    // 2. 开发环境工具目录
    let dev_tools = std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("src-tauri")
        .join("tools")
        .join("adb");
    resource_paths.push(serde_json::json!({
        "path": dev_tools.display().to_string(),
        "exists": dev_tools.exists(),
        "type": "development_tools",
        "adb_exists": dev_tools.join(&adb_filename).exists(),
        "fastboot_exists": dev_tools.join(&fb_filename).exists()
    }));

    // 3. 相对路径工具目录
    let relative_tools = std::path::PathBuf::from("src-tauri/tools/adb");
    resource_paths.push(serde_json::json!({
        "path": relative_tools.display().to_string(),
        "exists": relative_tools.exists(),
        "type": "relative_tools",
        "adb_exists": relative_tools.join(&adb_filename).exists(),
        "fastboot_exists": relative_tools.join(&fb_filename).exists()
    }));

    diagnosis.insert(
        "resource_directories".to_string(),
        serde_json::Value::Array(resource_paths),
    );

    // 尝试执行 ADB 和 Fastboot 命令
    let adb_test = utils_execute_adb_command(&["version"], Some(5)).await;
    diagnosis.insert(
        "adb_command_test".to_string(),
        serde_json::json!({
            "success": adb_test.is_ok(),
            "result": match adb_test {
                Ok(result) => serde_json::json!({
                    "success": result.success,
                    "output": result.output,
                    "error": result.error
                }),
                Err(e) => serde_json::json!({
                    "error": e.to_string()
                })
            }
        }),
    );

    let fastboot_test = execute_fastboot_command(&["--version"], Some(5)).await;
    diagnosis.insert(
        "fastboot_command_test".to_string(),
        serde_json::json!({
            "success": fastboot_test.is_ok(),
            "result": match fastboot_test {
                Ok(result) => serde_json::json!({
                    "success": result.success,
                    "output": result.output,
                    "error": result.error
                }),
                Err(e) => serde_json::json!({
                    "error": e.to_string()
                })
            }
        }),
    );

    log::info!("ADB/Fastboot path diagnosis completed");
    Ok(serde_json::Value::Object(diagnosis.into_iter().collect()))
}

/// 检查Fastboot可用性
#[tauri::command]
pub async fn check_fastboot_availability() -> Result<crate::device::CommandResult> {
    let result = execute_fastboot_command(&["--version"], Some(5)).await?;

    if result.success {
        Ok(crate::device::CommandResult {
            success: true,
            output: result.output,
            error: None,
            exit_code: Some(0),
        })
    } else {
        Ok(crate::device::CommandResult {
            success: false,
            output: String::new(),
            error: Some("Fastboot不可用或未正确安装".to_string()),
            exit_code: Some(1),
        })
    }
}

/// 使用 Fastboot 刷入镜像到指定分区
#[tauri::command]
pub async fn fastboot_flash_image(
    serial: String,
    image_path: String,
    partition: String,
) -> Result<crate::device::CommandResult> {
    log::info!(
        "Fastboot flashing image. serial={}, partition={}, image_path={}",
        serial,
        partition,
        image_path
    );

    let args = vec!["-s", &serial, "flash", &partition, &image_path];
    // 增加刷写操作的超时时间到600秒（10分钟），以适应大型镜像的刷写
    let result = execute_fastboot_command(&args, Some(600)).await?;

    Ok(result)
}

/// 使用指定ADB路径执行命令
#[tauri::command]
pub async fn execute_adb_command_with_path(
    adb_path: String,
    serial: String,
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<crate::device::CommandResult> {
    crate::adb_commands::execute_adb_command_with_path(&adb_path, &serial, &command, &args, timeout)
        .await
}
