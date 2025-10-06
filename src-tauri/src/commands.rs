use crate::activation::{ActivationRequest, ActivationResponse, ActivationValidator, AppConfig};
use crate::adb::device::device_info::{get_device_info, get_device_properties_batch};

use crate::adb_commands::{AdbIntegrityReport, AdbToolsInfo};
use crate::cache::get_cache_manager;
use crate::device::{
    CommandResult, DeviceInfo, DeviceMode, DeviceProperties,
};
use crate::download_manager::DownloadManager;
use crate::error::{AdmtError, Result};
use crate::utils::{
    execute_adb_command as utils_execute_adb_command, execute_fastboot_command,
    parse_adb_device_list, parse_fastboot_device_list,
};

use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tauri::Manager;

/// 扫描连接的设备（使用缓存）
#[tauri::command]
pub async fn scan_devices() -> Result<Vec<DeviceInfo>> {
    // 首先尝试从缓存获取
    let cache_manager = get_cache_manager();
    if let Some(cached_devices) = cache_manager.get_device_list().await {
        log::debug!(
            "Device list cache hit with {} devices",
            cached_devices.len()
        );
        return Ok(cached_devices);
    }

    let mut devices = Vec::new();

    // 扫描ADB设备
    match utils_execute_adb_command(&["devices"], Some(10)).await {
        Ok(result) if result.success => {
            let device_list = parse_adb_device_list(&result.output);
            for (serial, status) in device_list {
                let mode = DeviceMode::from_adb_status(&status);
                devices.push(DeviceInfo::new(serial, mode));
            }
        }
        Ok(result) => {
            log::warn!("ADB devices command failed: {:?}", result.error);
        }
        Err(e) => {
            log::error!("Failed to execute ADB devices command: {}", e);
        }
    }

    // 扫描Fastboot设备
    log::info!("Scanning for Fastboot devices...");
    match execute_fastboot_command(&["devices"], Some(10)).await {
        Ok(result) if result.success => {
            log::info!("Fastboot devices command output: {}", result.output);
            let device_list = parse_fastboot_device_list(&result.output);
            log::info!("Parsed {} fastboot devices", device_list.len());
            for (serial, status) in device_list {
                log::info!("Found fastboot device: {} with status: {}", serial, status);
                // 检查是否已经在ADB设备列表中
                if !devices.iter().any(|d| d.serial == serial) {
                    devices.push(DeviceInfo::new(serial, DeviceMode::Fastboot));
                    log::info!("Added fastboot device to list");
                } else {
                    log::info!("Device already in ADB list, skipping");
                }
            }
        }
        Ok(result) => {
            log::warn!(
                "Fastboot devices command failed: success={}, output={}, error={:?}",
                result.success,
                result.output,
                result.error
            );
        }
        Err(e) => {
            log::error!("Failed to execute Fastboot devices command: {}", e);
        }
    }

    log::info!("Found {} devices", devices.len());

    // 缓存设备列表
    cache_manager.set_device_list(devices.clone()).await;

    Ok(devices)
}

/// 获取Fastboot设备属性
async fn get_fastboot_device_properties(serial: &str) -> Result<DeviceProperties> {
    log::info!("Getting properties for fastboot device: {}", serial);
    
    // 使用新的fastboot设备信息获取实现
    let fastboot_props = crate::fastboot::device::device_info::get_fastboot_device_properties(serial.to_string()).await?;
    
    // 转换为通用的DeviceProperties
    let properties = crate::fastboot::device::device_info::convert_to_device_properties(&fastboot_props);
    
    log::info!("Successfully got fastboot properties for device {}: product={:?}, serial={:?}", 
        serial, 
        properties.product_name, 
        properties.serial_number
    );
    
    Ok(properties)
}

/// 获取设备属性（使用缓存）
#[tauri::command]
pub async fn get_device_properties(serial: String) -> Result<DeviceProperties> {
    // 首先尝试从缓存获取
    let cache_manager = get_cache_manager();
    if let Some(cached_properties) = cache_manager.get_device_properties(&serial).await {
        log::debug!("Device properties cache hit for {}", serial);
        return Ok(cached_properties);
    }

    // 验证设备存在且可访问
    let device = get_device_info(serial.clone()).await?;

    // 根据设备模式选择不同的属性获取方式
    let properties = match device.mode {
        DeviceMode::Fastboot | DeviceMode::Fastbootd => {
            get_fastboot_device_properties(&serial).await?
        }
        _ => {
            if !device.is_adb_available() {
                return Err(AdmtError::InvalidDeviceMode {
                    mode: format!("{:?}", device.mode),
                });
            }
            // 使用批量获取方法
            get_device_properties_batch(&serial).await?
        }
    };

    // 缓存设备属性
    cache_manager
        .set_device_properties(serial.clone(), properties.clone())
        .await;

    Ok(properties)
}

/// 获取缓存统计信息
#[tauri::command]
pub async fn get_cache_stats() -> Result<serde_json::Value> {
    let cache_manager = get_cache_manager();
    let stats = cache_manager.get_stats().await;
    let cache_info = cache_manager.get_cache_info().await;

    let mut result = serde_json::json!({
        "path_cache_hits": stats.path_cache_hits,
        "path_cache_misses": stats.path_cache_misses,
        "device_cache_hits": stats.device_cache_hits,
        "device_cache_misses": stats.device_cache_misses,
        "cache_evictions": stats.cache_evictions,
        "path_hit_rate": stats.path_hit_rate(),
        "device_hit_rate": stats.device_hit_rate(),
        "uptime_seconds": stats.last_reset.elapsed().as_secs(),
    });

    for (key, value) in cache_info {
        result[key] = serde_json::Value::from(value);
    }

    Ok(result)
}

/// 清除所有缓存
#[tauri::command]
pub async fn clear_all_cache() -> Result<()> {
    let cache_manager = get_cache_manager();
    cache_manager.clear_all().await;
    log::info!("All caches cleared by user request");
    Ok(())
}

/// 清除设备属性缓存
#[tauri::command]
pub async fn invalidate_device_cache(serial: String) -> Result<()> {
    let cache_manager = get_cache_manager();
    cache_manager.invalidate_device(&serial).await;
    log::info!("Device cache invalidated for: {}", serial);
    Ok(())
}

/// 检查ADB可用性
#[tauri::command]
pub async fn check_adb_availability() -> Result<CommandResult> {
    let result = utils_execute_adb_command(&["version"], Some(5)).await?;

    if result.success {
        Ok(CommandResult {
            success: true,
            output: result.output,
            error: None,
            exit_code: Some(0),
        })
    } else {
        Ok(CommandResult {
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

    // 1. 生产环境资源目录
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let tools_dir = parent.join("tools").join("adb");
            resource_paths.push(serde_json::json!({
                "path": tools_dir.display().to_string(),
                "exists": tools_dir.exists(),
                "type": "production_tools",
                "adb_exists": tools_dir.join("adb.exe").exists(),
                "fastboot_exists": tools_dir.join("fastboot.exe").exists()
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
        "adb_exists": dev_tools.join("adb.exe").exists(),
        "fastboot_exists": dev_tools.join("fastboot.exe").exists()
    }));

    // 3. 相对路径工具目录
    let relative_tools = std::path::PathBuf::from("src-tauri/tools/adb");
    resource_paths.push(serde_json::json!({
        "path": relative_tools.display().to_string(),
        "exists": relative_tools.exists(),
        "type": "relative_tools",
        "adb_exists": relative_tools.join("adb.exe").exists(),
        "fastboot_exists": relative_tools.join("fastboot.exe").exists()
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

/// 退出应用
#[tauri::command]
pub async fn exit_app(exit_code: i32) -> Result<()> {
    log::info!("应用退出请求，退出码: {}", exit_code);

    // 给一些时间让前端接收到响应
    tokio::time::sleep(std::time::Duration::from_millis(100)).await;

    // 退出应用
    std::process::exit(exit_code);
}

/// 检查Fastboot可用性
#[tauri::command]
pub async fn check_fastboot_availability() -> Result<CommandResult> {
    let result = execute_fastboot_command(&["--version"], Some(5)).await?;

    if result.success {
        Ok(CommandResult {
            success: true,
            output: result.output,
            error: None,
            exit_code: Some(0),
        })
    } else {
        Ok(CommandResult {
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
) -> Result<CommandResult> {
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

/// 获取ADB工具信息
#[tauri::command]
pub async fn get_adb_tools_info(app_handle: tauri::AppHandle) -> Result<AdbToolsInfo> {
    crate::adb_commands::get_adb_tools_info(&app_handle)
}

/// 验证ADB工具完整性
#[tauri::command]
pub async fn verify_adb_tools_integrity(
    app_handle: tauri::AppHandle,
) -> Result<AdbIntegrityReport> {
    crate::adb_commands::verify_adb_tools_integrity(&app_handle)
}

/// 使用指定ADB路径执行命令
#[tauri::command]
pub async fn execute_adb_command_with_path(
    adb_path: String,
    serial: String,
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    crate::adb_commands::execute_adb_command_with_path(&adb_path, &serial, &command, &args, timeout)
        .await
}




/// 获取设备性能信息
#[tauri::command]
pub async fn get_device_performance_info(serial: String) -> Result<serde_json::Value> {
    use serde_json::json;

    let mut memory_info = json!({
        "memory_total": null,
        "memory_used": null,
        "memory_available": null,
        "memory_usage_percent": null
    });

    let mut storage_info = json!({
        "storage_total": null,
        "storage_used": null,
        "storage_available": null,
        "storage_usage_percent": null
    });

    let mut battery_info = json!({
        "battery_health_percent": null,
        "battery_actual_capacity": null,
        "battery_design_capacity": null,
        "battery_health_status": null,
        "battery_level": null,
        "battery_temperature": null
    });

    // 获取内存信息
    if let Ok(result) =
        utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/proc/meminfo"], Some(10)).await
    {
        if result.success {
            let mut mem_total_kb = 0u64;
            let mut mem_available_kb = 0u64;

            for line in result.output.lines() {
                if line.starts_with("MemTotal:") {
                    if let Some(mem_part) = line.split_whitespace().nth(1) {
                        if let Ok(mem_kb) = mem_part.parse::<u64>() {
                            mem_total_kb = mem_kb;
                        }
                    }
                } else if line.starts_with("MemAvailable:") {
                    if let Some(mem_part) = line.split_whitespace().nth(1) {
                        if let Ok(mem_kb) = mem_part.parse::<u64>() {
                            mem_available_kb = mem_kb;
                        }
                    }
                }
            }

            if mem_total_kb > 0 {
                let mem_total_mb = mem_total_kb / 1024;
                let mem_available_mb = mem_available_kb / 1024;
                let mem_used_mb = mem_total_mb - mem_available_mb;
                let usage_percent = if mem_total_mb > 0 {
                    ((mem_used_mb as f64 / mem_total_mb as f64) * 100.0).round() as u32
                } else {
                    0
                };

                memory_info = json!({
                    "memory_total": mem_total_mb,
                    "memory_used": mem_used_mb,
                    "memory_available": mem_available_mb,
                    "memory_usage_percent": usage_percent
                });
            }
        }
    }

    // 获取存储信息
    if let Ok(result) =
        utils_execute_adb_command(&["-s", &serial, "shell", "df", "/data"], Some(10)).await
    {
        if result.success {
            let lines: Vec<&str> = result.output.lines().collect();
            if lines.len() > 1 {
                let data_line = lines[1];
                let parts: Vec<&str> = data_line.split_whitespace().collect();
                if parts.len() >= 4 {
                    if let (Ok(total_kb), Ok(used_kb), Ok(available_kb)) = (
                        parts[1].parse::<u64>(),
                        parts[2].parse::<u64>(),
                        parts[3].parse::<u64>(),
                    ) {
                        let total_mb = total_kb / 1024;
                        let used_mb = used_kb / 1024;
                        let available_mb = available_kb / 1024;
                        let usage_percent = if total_mb > 0 {
                            ((used_mb as f64 / total_mb as f64) * 100.0).round() as u32
                        } else {
                            0
                        };

                        storage_info = json!({
                            "storage_total": total_mb,
                            "storage_used": used_mb,
                            "storage_available": available_mb,
                            "storage_usage_percent": usage_percent
                        });
                    }
                }
            }
        }
    }

    // 获取电池信息
    if let Ok(result) =
        utils_execute_adb_command(&["-s", &serial, "shell", "dumpsys", "battery"], Some(10)).await
    {
        if result.success {
            let mut battery_level: Option<u32> = None;
            let mut battery_health_status: Option<String> = None;
            let mut battery_temperature: Option<f32> = None;
            let mut battery_actual_capacity: Option<u32> = None;
            let mut battery_design_capacity: Option<u32> = None;
            let mut charge_counter_uah: Option<i64> = None; // Charge counter in μAh

            for line in result.output.lines() {
                let line = line.trim();

                // 解析电池电量
                if line.starts_with("level:") {
                    if let Some(level_str) = line.split(':').nth(1) {
                        if let Ok(level) = level_str.trim().parse::<u32>() {
                            battery_level = Some(level);
                        }
                    }
                }
                // 解析电池健康状态
                else if line.starts_with("health:") {
                    if let Some(health_str) = line.split(':').nth(1) {
                        let health = health_str.trim();
                        battery_health_status = Some(health.to_string());
                    }
                }
                // 解析电池温度
                else if line.starts_with("temperature:") {
                    if let Some(temp_str) = line.split(':').nth(1) {
                        if let Ok(temp) = temp_str.trim().parse::<i32>() {
                            // 温度通常以十分之一摄氏度为单位
                            battery_temperature = Some(temp as f32 / 10.0);
                        }
                    }
                }
                // 解析 Charge counter（优先使用此方法）
                else if line.contains("Charge counter:") || line.contains("charge_counter:") {
                    if let Some(counter_str) = line.split(':').nth(1) {
                        if let Ok(counter) = counter_str.trim().parse::<i64>() {
                            // Charge counter 通常以 μAh 为单位
                            charge_counter_uah = Some(counter);
                            log::info!("Found Charge counter: {} μAh", counter);
                        }
                    }
                }
            }

            // 使用 Charge counter 和当前电量计算实际可用容量
            if let (Some(counter_uah), Some(level)) = (charge_counter_uah, battery_level) {
                if level > 0 && counter_uah > 0 {
                    // 计算实际可用容量：Charge counter ÷ 当前电量百分比
                    let actual_capacity_uah = (counter_uah as f64 / (level as f64 / 100.0)) as i64;
                    let actual_capacity_mah = (actual_capacity_uah / 1000) as u32;

                    // 验证计算结果的合理性（容量范围 500-15000 mAh）
                    if actual_capacity_mah >= 500 && actual_capacity_mah <= 15000 {
                        battery_actual_capacity = Some(actual_capacity_mah);
                        log::info!("Calculated actual capacity from Charge counter: {} mAh (counter: {} μAh, level: {}%)",
                                 actual_capacity_mah, counter_uah, level);
                    } else {
                        log::warn!(
                            "Calculated capacity {} mAh is out of reasonable range, ignoring",
                            actual_capacity_mah
                        );
                    }
                } else {
                    log::warn!(
                        "Invalid data for capacity calculation: counter={:?}, level={:?}",
                        charge_counter_uah,
                        battery_level
                    );
                }
            }

            // 尝试获取设计容量信息（标称容量）
            if let Ok(capacity_result) = utils_execute_adb_command(
                &[
                    "-s",
                    &serial,
                    "shell",
                    "cat",
                    "/sys/class/power_supply/battery/charge_full_design",
                ],
                Some(5),
            )
            .await
            {
                if capacity_result.success {
                    if let Ok(design_capacity) = capacity_result.output.trim().parse::<u32>() {
                        battery_design_capacity = Some(design_capacity / 1000); // 转换为mAh
                        log::info!("Found design capacity: {} mAh", design_capacity / 1000);
                    }
                }
            }

            // 如果没有获取到设计容量，尝试另一个路径
            if battery_design_capacity.is_none() {
                if let Ok(capacity_result) = utils_execute_adb_command(
                    &[
                        "-s",
                        &serial,
                        "shell",
                        "cat",
                        "/sys/class/power_supply/battery/charge_full",
                    ],
                    Some(5),
                )
                .await
                {
                    if capacity_result.success {
                        if let Ok(full_capacity) = capacity_result.output.trim().parse::<u32>() {
                            battery_design_capacity = Some(full_capacity / 1000); // 转换为mAh
                            log::info!(
                                "Found full capacity as design capacity: {} mAh",
                                full_capacity / 1000
                            );
                        }
                    }
                }
            }

            // 如果 Charge counter 方法失败，回退到传统方法获取实际容量
            if battery_actual_capacity.is_none() {
                log::info!("Charge counter method failed, falling back to traditional method");

                if let Ok(capacity_result) = utils_execute_adb_command(
                    &[
                        "-s",
                        &serial,
                        "shell",
                        "cat",
                        "/sys/class/power_supply/battery/charge_now",
                    ],
                    Some(5),
                )
                .await
                {
                    if capacity_result.success {
                        if let Ok(current_capacity) = capacity_result.output.trim().parse::<u32>() {
                            battery_actual_capacity = Some(current_capacity / 1000); // 转换为mAh
                            log::info!(
                                "Found current capacity (fallback): {} mAh",
                                current_capacity / 1000
                            );
                        }
                    }
                }
            }

            // 计算电池健康度百分比和状态
            let (battery_health_percent, health_calculation_method) = if let (
                Some(actual),
                Some(design),
            ) =
                (battery_actual_capacity, battery_design_capacity)
            {
                if design > 0 {
                    let health_percent = ((actual as f64 / design as f64) * 100.0).round() as u32;
                    let limited_health = std::cmp::min(health_percent, 150); // 允许稍微超过100%，但限制在150%以内
                    let method = if charge_counter_uah.is_some() {
                        "Charge counter 计算"
                    } else {
                        "系统文件计算"
                    };
                    log::info!(
                        "Battery health calculated: {}% using method: {}",
                        limited_health,
                        method
                    );
                    (Some(limited_health), Some(method.to_string()))
                } else {
                    log::warn!("Design capacity is 0, cannot calculate health");
                    (None, None)
                }
            } else if battery_actual_capacity.is_some() && battery_design_capacity.is_none() {
                log::info!("Have actual capacity but no design capacity, cannot calculate health percentage");
                (None, Some("无标称容量".to_string()))
            } else {
                log::info!("No capacity data available for health calculation");
                (None, None)
            };

            battery_info = json!({
                "battery_health_percent": battery_health_percent,
                "battery_actual_capacity": battery_actual_capacity,
                "battery_design_capacity": battery_design_capacity,
                "battery_health_status": battery_health_status,
                "battery_level": battery_level,
                "battery_temperature": battery_temperature,
                "health_calculation_method": health_calculation_method,
                "charge_counter_available": charge_counter_uah.is_some()
            });
        }
    }

    Ok(json!({
        "memory": memory_info,
        "storage": storage_info,
        "battery": battery_info
    }))
}

/// 获取设备内存、存储和电池信息（与 get_device_performance_info 相同的实现）
#[tauri::command]
pub async fn get_device_memory_storage_info(serial: String) -> Result<serde_json::Value> {
    get_device_performance_info(serial).await
}

/// 检查设备连接状态
#[tauri::command]
pub async fn check_device_connection(serial: String) -> Result<CommandResult> {
    let result = utils_execute_adb_command(&["-s", &serial, "get-state"], Some(5)).await?;

    if result.success && result.output.trim() == "device" {
        Ok(CommandResult {
            success: true,
            output: "device".to_string(),
            error: None,
            exit_code: Some(0),
        })
    } else {
        Ok(CommandResult {
            success: false,
            output: result.output,
            error: Some("设备未连接或不可用".to_string()),
            exit_code: result.exit_code,
        })
    }
}

/// 获取设备详细连接信息
#[tauri::command]
pub async fn get_device_connection_info(serial: String) -> Result<serde_json::Value> {
    use serde_json::json;

    // 检查设备状态
    let state_result = utils_execute_adb_command(&["-s", &serial, "get-state"], Some(5)).await;
    let state = match state_result {
        Ok(result) if result.success => result.output.trim().to_string(),
        _ => "unknown".to_string(),
    };

    // 获取设备属性
    let mut info = json!({
        "serial": serial,
        "state": state,
        "connected": state == "device",
        "adb_version": null,
        "usb_connection": false,
        "wifi_connection": false,
        "connection_type": "unknown"
    });

    if state == "device" {
        // 检查连接类型
        if serial.contains(":") {
            info["wifi_connection"] = json!(true);
            info["connection_type"] = json!("wifi");
        } else {
            info["usb_connection"] = json!(true);
            info["connection_type"] = json!("usb");
        }

        // 获取ADB版本
        if let Ok(version_result) = utils_execute_adb_command(&["version"], Some(5)).await {
            if version_result.success {
                let version_line = version_result
                    .output
                    .lines()
                    .find(|line| line.contains("Android Debug Bridge version"))
                    .unwrap_or("")
                    .to_string();
                info["adb_version"] = json!(version_line);
            }
        }
    }

    Ok(info)
}



/// 获取应用下载目录
fn get_app_downloads_dir() -> Result<std::path::PathBuf> {
    // 尝试获取应用程序安装目录
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let downloads_dir = exe_dir.join("downloads");
            return Ok(downloads_dir);
        }
    }

    // 如果无法获取安装目录，使用应用数据目录
    if let Some(data_dir) = dirs::data_dir() {
        let app_data_dir = data_dir.join("ADMT").join("downloads");
        return Ok(app_data_dir);
    }

    // 最后回退到临时目录
    Ok(std::env::temp_dir().join("admt_downloads"))
}

/// 下载APK文件
#[tauri::command]
pub async fn download_apk(url: String, file_name: String, is_direct: bool) -> Result<String> {
    use tokio::fs;
    use tokio::io::AsyncWriteExt;

    // 创建下载目录
    let downloads_dir = get_app_downloads_dir()?;
    fs::create_dir_all(&downloads_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create downloads directory: {}", e)))?;

    // 生成文件路径
    let file_path = downloads_dir.join(&file_name);

    // 如果不是直接下载链接，需要先获取真实下载地址
    let download_url = if is_direct {
        url
    } else {
        // 对于重定向链接，发送HEAD请求获取真实下载地址
        get_redirect_url(&url).await?
    };

    // 下载文件
    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(AdmtError::Network(format!(
            "Download failed with status: {}",
            response.status()
        )));
    }

    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create file: {}", e)))?;

    let mut stream = response.bytes_stream();
    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        let chunk =
            chunk.map_err(|e| AdmtError::Network(format!("Failed to read chunk: {}", e)))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to write chunk: {}", e)))?;
    }

    file.flush()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to flush file: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// 获取重定向URL
async fn get_redirect_url(url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| AdmtError::Network(format!("Failed to create HTTP client: {}", e)))?;

    let response = client
        .head(url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to send HEAD request: {}", e)))?;

    if response.status().is_redirection() {
        if let Some(location) = response.headers().get("location") {
            let redirect_url = location
                .to_str()
                .map_err(|e| AdmtError::Network(format!("Invalid redirect URL: {}", e)))?;
            return Ok(redirect_url.to_string());
        }
    }

    // 如果没有重定向，返回原URL
    Ok(url.to_string())
}

/// 获取文件大小
#[tauri::command]
pub async fn get_download_size(url: String, is_direct: bool) -> Result<u64> {
    let download_url = if is_direct {
        url
    } else {
        get_redirect_url(&url).await?
    };

    let client = reqwest::Client::new();
    let response = client
        .head(&download_url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to get file info: {}", e)))?;

    if let Some(content_length) = response.headers().get("content-length") {
        let size_str = content_length
            .to_str()
            .map_err(|e| AdmtError::Network(format!("Invalid content-length header: {}", e)))?;
        let size = size_str
            .parse::<u64>()
            .map_err(|e| AdmtError::Network(format!("Failed to parse content-length: {}", e)))?;
        Ok(size)
    } else {
        Ok(0) // 未知大小
    }
}

/// 下载文件（支持进度回调）
#[tauri::command]
pub async fn download_file(
    url: String,
    file_name: String,
    task_id: String,
    window: tauri::Window,
) -> Result<String> {
    use futures_util::StreamExt;
    use tokio::fs;
    use tokio::io::AsyncWriteExt;

    log::info!("开始下载文件: {} -> {}", url, file_name);

    // 创建下载目录（按日期分类）
    let downloads_dir = get_app_downloads_dir()?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily_dir = downloads_dir.join(&today);
    fs::create_dir_all(&daily_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create downloads directory: {}", e)))?;

    // 生成文件路径
    let file_path = daily_dir.join(&file_name);

    // 开始下载
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(AdmtError::Network(format!(
            "Download failed with status: {}",
            response.status()
        )));
    }

    // 获取文件总大小
    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded_size = 0u64;

    // 创建文件
    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create file: {}", e)))?;

    // 下载文件流
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk =
            chunk_result.map_err(|e| AdmtError::Network(format!("Failed to read chunk: {}", e)))?;

        // 写入文件
        file.write_all(&chunk)
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to write chunk: {}", e)))?;

        // 更新进度
        downloaded_size += chunk.len() as u64;
        let progress = if total_size > 0 {
            (downloaded_size as f64 / total_size as f64 * 100.0) as u32
        } else {
            0
        };

        // 发送进度事件到前端
        let _ = window.emit(
            "download-progress",
            serde_json::json!({
                "taskId": task_id,
                "progress": progress,
                "downloadedSize": downloaded_size,
                "totalSize": total_size
            }),
        );
    }

    // 确保文件写入完成
    file.flush()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to flush file: {}", e)))?;

    log::info!("文件下载完成: {}", file_path.display());
    Ok(file_path.to_string_lossy().to_string())
}

/// 取消下载
#[tauri::command]
pub async fn cancel_download(task_id: String, window: tauri::Window) -> Result<()> {
    log::info!("取消下载任务: {}", task_id);

    // 发送取消事件到前端
    let _ = window.emit(
        "download-cancelled",
        serde_json::json!({
            "taskId": task_id
        }),
    );

    Ok(())
}

/// 终止进程
#[tauri::command]
pub async fn terminate_process(process_id: u32) -> Result<bool> {
    log::info!("Terminating process with ID: {}", process_id);

    #[cfg(windows)]
    {
        use std::process::Command;
        
        let mut cmd = Command::new("taskkill");
        cmd.args(&["/F", "/PID", &process_id.to_string()]);
        
        match cmd.output() {
            Ok(output) => {
                let success = output.status.success();
                if success {
                    log::info!("Successfully terminated process with ID: {}", process_id);
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    log::error!("Failed to terminate process with ID: {}: {}", process_id, stderr);
                }
                Ok(success)
            }
            Err(e) => {
                log::error!("Failed to execute taskkill command for process ID {}: {}", process_id, e);
                Ok(false)
            }
        }
    }

    #[cfg(not(windows))]
    {
        use std::process::Command;
        
        let mut cmd = Command::new("kill");
        cmd.arg("-9");
        cmd.arg(process_id.to_string());
        
        match cmd.output() {
            Ok(output) => {
                let success = output.status.success();
                if success {
                    log::info!("Successfully terminated process with ID: {}", process_id);
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    log::error!("Failed to terminate process with ID: {}: {}", process_id, stderr);
                }
                Ok(success)
            }
            Err(e) => {
                log::error!("Failed to execute kill command for process ID {}: {}", process_id, e);
                Ok(false)
            }
        }
    }
}

/// 检查进程是否存活
#[tauri::command]
pub async fn check_process_alive(process_id: u32) -> Result<bool> {
    log::debug!("Checking if process with ID: {} is alive", process_id);

    #[cfg(windows)]
    {
        use std::process::Command;
        
        let mut cmd = Command::new("tasklist");
        cmd.args(&["/FI", &format!("PID eq {}", process_id), "/FO", "CSV", "/NH"]);
        
        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let is_alive = stdout.contains(&process_id.to_string());
                log::debug!("Process with ID: {} is alive: {}", process_id, is_alive);
                Ok(is_alive)
            }
            Err(e) => {
                log::error!("Failed to check process status for ID {}: {}", process_id, e);
                Ok(false)
            }
        }
    }

    #[cfg(not(windows))]
    {
        use std::process::Command;
        
        let mut cmd = Command::new("ps");
        cmd.arg("-p");
        cmd.arg(process_id.to_string());
        
        match cmd.output() {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let is_alive = stdout.contains(&process_id.to_string());
                log::debug!("Process with ID: {} is alive: {}", process_id, is_alive);
                Ok(is_alive)
            }
            Err(e) => {
                log::error!("Failed to check process status for ID {}: {}", process_id, e);
                Ok(false)
            }
        }
    }
}

/// 获取下载目录路径
#[tauri::command]
pub async fn get_downloads_directory() -> Result<String> {
    let downloads_dir = get_app_downloads_dir()?;
    Ok(downloads_dir.to_string_lossy().to_string())
}

/// 清理下载文件
#[tauri::command]
pub async fn cleanup_downloads(older_than_days: u64) -> Result<u64> {
    use std::time::{SystemTime, UNIX_EPOCH};
    use tokio::fs;

    let downloads_dir = get_app_downloads_dir()?;
    if !downloads_dir.exists() {
        return Ok(0);
    }

    let cutoff_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        - (older_than_days * 24 * 60 * 60);

    let mut deleted_count = 0;
    let mut entries = fs::read_dir(&downloads_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read downloads directory: {}", e)))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read directory entry: {}", e)))?
    {
        let metadata = entry
            .metadata()
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to get file metadata: {}", e)))?;

        if let Ok(modified) = metadata.modified() {
            if let Ok(modified_secs) = modified.duration_since(UNIX_EPOCH) {
                if modified_secs.as_secs() < cutoff_time {
                    if metadata.is_file() {
                        fs::remove_file(entry.path())
                            .await
                            .map_err(|e| AdmtError::Io(format!("Failed to delete file: {}", e)))?;
                        deleted_count += 1;
                    } else if metadata.is_dir() {
                        fs::remove_dir_all(entry.path()).await.map_err(|e| {
                            AdmtError::Io(format!("Failed to delete directory: {}", e))
                        })?;
                        deleted_count += 1;
                    }
                }
            }
        }
    }

    Ok(deleted_count)
}

/// 验证激活码格式
#[tauri::command]
pub async fn validate_activation_code_format(activation_code: String) -> Result<bool> {
    let validator = ActivationValidator::new();
    Ok(validator.validate_format(&activation_code))
}

/// 激活应用
#[tauri::command]
pub async fn activate_application(request: ActivationRequest) -> Result<ActivationResponse> {
    log::info!(
        "Processing activation request for user: {}",
        request.user_config.username
    );

    let validator = ActivationValidator::new();
    let response = validator.activate(request).await?;

    Ok(response)
}

/// 检查激活状态
#[tauri::command]
pub async fn check_activation_status() -> Result<serde_json::Value> {
    log::info!("Checking activation status...");

    // 返回详细的激活状态信息
    let status = serde_json::json!({
        "isActivated": false,
        "isExpired": false,
        "needsActivation": true,
        "message": "需要激活应用"
    });

    Ok(status)
}

/// 验证本地存储的激活数据完整性
#[tauri::command]
pub async fn validate_local_activation_data(encrypted_data: String) -> Result<bool> {
    log::info!("Validating local activation data integrity");

    // 这里可以添加更复杂的验证逻辑
    // 目前简单检查数据是否为空
    if encrypted_data.trim().is_empty() {
        log::warn!("Empty activation data provided");
        return Ok(false);
    }

    // 检查数据格式是否为有效的base64
    use base64::{engine::general_purpose, Engine as _};
    match general_purpose::STANDARD.decode(&encrypted_data) {
        Ok(_) => {
            log::info!("Local activation data format is valid");
            Ok(true)
        }
        Err(e) => {
            log::warn!("Invalid activation data format: {}", e);
            Ok(false)
        }
    }
}

/// 生成设备指纹用于激活验证
#[tauri::command]
pub async fn get_device_fingerprint() -> Result<String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    log::info!("Generating device fingerprint");

    // 获取系统信息生成设备指纹
    let mut hasher = DefaultHasher::new();

    // 添加操作系统信息
    std::env::consts::OS.hash(&mut hasher);
    std::env::consts::ARCH.hash(&mut hasher);

    // 添加时间戳确保唯一性（在实际应用中应使用硬件信息）
    let timestamp = chrono::Utc::now().timestamp();
    timestamp.hash(&mut hasher);

    let fingerprint = format!("device_{:x}", hasher.finish());
    log::info!("Generated device fingerprint: {}", fingerprint);

    Ok(fingerprint)
}

/// 获取应用配置
#[tauri::command]
pub async fn get_app_config() -> Result<Option<AppConfig>> {
    // 这里应该从本地存储读取配置
    // 暂时返回None
    Ok(None)
}

/// 保存应用配置
#[tauri::command]
pub async fn save_app_config(config: AppConfig) -> Result<bool> {
    log::info!(
        "Saving app config for user: {}",
        config.user_config.username
    );
    // 这里应该将配置保存到本地存储
    // 暂时返回true表示保存成功
    Ok(true)
}



// ==================== 安全配置相关命令 ====================

/// 安全配置结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub api_base_url: String,
    pub app_id: String,
    pub app_secret: String,
    pub signature_secret: String,
    pub enable_signature: bool,
    pub enable_strict_user_agent: bool,
    pub app_version: String,
    pub software_id: i32,
}

/// 获取安全配置
#[tauri::command]
pub async fn get_security_config() -> Result<SecurityConfig> {
    log::info!("Getting security configuration");

    // 在生产环境中，这些配置应该从安全的存储位置读取
    // 例如：加密的配置文件、系统密钥库等

    // 检测当前环境
    let is_debug = cfg!(debug_assertions);

    let config = SecurityConfig {
        api_base_url: "https://api-g.lacs.cc".to_string(), // 正确的API地址
        app_id: "wanjiguanjia-desktop-v1.0.0".to_string(),
        app_secret: "wjgj_2024_secure_app_secret_key_for_user_behavior_stats".to_string(),
        signature_secret: "signature_secret_2024_wanjiguanjia_user_behavior_api_protection"
            .to_string(),
        enable_signature: !is_debug, // 开发环境不启用签名，生产环境启用
        enable_strict_user_agent: !is_debug, // 开发环境不严格检查，生产环境严格检查
        app_version: "1.0.0".to_string(), // 应用版本号（测试强制更新）
        software_id: 1,              // 软件ID，对应API中的软件ID
    };

    log::info!(
        "Security configuration loaded successfully, debug_mode: {}",
        is_debug
    );
    Ok(config)
}

/// 验证安全配置
#[tauri::command]
pub async fn validate_security_config() -> Result<bool> {
    log::info!("Validating security configuration");

    match get_security_config().await {
        Ok(config) => {
            // 验证配置完整性
            if config.app_secret.len() < 16 {
                log::error!("App secret is too weak");
                return Ok(false);
            }

            if config.api_base_url.is_empty() {
                log::error!("API base URL is empty");
                return Ok(false);
            }

            log::info!("Security configuration validation passed");
            Ok(true)
        }
        Err(e) => {
            log::error!("Failed to validate security configuration: {}", e);
            Ok(false)
        }
    }
}

/// 获取平台信息
#[tauri::command]
pub async fn get_platform_info() -> Result<String> {
    Ok(std::env::consts::OS.to_string())
}

/// 获取系统架构信息
#[tauri::command]
pub async fn get_system_arch() -> Result<String> {
    Ok(std::env::consts::ARCH.to_string())
}

/// 详细设备指纹结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedDeviceFingerprint {
    pub fingerprint: String,
    pub os: String,
    pub arch: String,
    pub hostname: String,
    pub timestamp: i64,
}

/// 获取详细设备指纹（用于用户行为统计）
#[tauri::command]
pub async fn get_detailed_device_fingerprint() -> Result<DetailedDeviceFingerprint> {
    log::info!("Generating detailed device fingerprint for usage tracking");

    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    // 获取系统信息
    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    let hostname = hostname::get()
        .unwrap_or_else(|_| std::ffi::OsString::from("unknown"))
        .to_string_lossy()
        .to_string();

    // 获取当前时间戳
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    // 生成设备指纹
    let mut hasher = DefaultHasher::new();
    os.hash(&mut hasher);
    arch.hash(&mut hasher);
    hostname.hash(&mut hasher);

    // 添加一些系统特征信息
    if let Ok(username) = std::env::var("USERNAME").or_else(|_| std::env::var("USER")) {
        username.hash(&mut hasher);
    }

    let fingerprint_hash = hasher.finish();
    let fingerprint = format!("fp_{:016x}", fingerprint_hash);

    let device_fingerprint = DetailedDeviceFingerprint {
        fingerprint,
        os,
        arch,
        hostname,
        timestamp,
    };

    log::info!("Detailed device fingerprint generated successfully");
    Ok(device_fingerprint)
}

/// 打开开发者工具（仅在调试模式下可用）
#[tauri::command]
pub async fn open_devtools(_app: tauri::AppHandle) -> Result<()> {
    #[cfg(debug_assertions)]
    {
        if let Some(window) = _app.get_webview_window("main") {
            window.open_devtools();
            log::info!("开发者工具已打开");
            Ok(())
        } else {
            log::error!("无法找到主窗口");
            Err(AdmtError::FileOperationFailed {
                message: "无法找到主窗口".to_string(),
            })
        }
    }

    #[cfg(not(debug_assertions))]
    {
        log::warn!("开发者工具在生产模式下不可用");
        Err(AdmtError::FileOperationFailed {
            message: "开发者工具在生产模式下不可用".to_string(),
        })
    }
}

/// 检查是否为调试模式
#[tauri::command]
pub async fn is_debug_mode() -> Result<bool> {
    Ok(cfg!(debug_assertions))
}

/// 设置窗口置顶状态
#[tauri::command]
pub async fn set_window_always_on_top(app: tauri::AppHandle, always_on_top: bool) -> Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_always_on_top(always_on_top)
            .map_err(|e| AdmtError::FileOperationFailed {
                message: format!("设置窗口置顶状态失败: {}", e),
            })?;
        log::info!("窗口置顶状态已设置为: {}", always_on_top);
        Ok(())
    } else {
        log::error!("无法找到主窗口");
        Err(AdmtError::FileOperationFailed {
            message: "无法找到主窗口".to_string(),
        })
    }
}

/// 获取窗口置顶状态
#[tauri::command]
pub async fn get_window_always_on_top(app: tauri::AppHandle) -> Result<bool> {
    if let Some(window) = app.get_webview_window("main") {
        let is_always_on_top =
            window
                .is_always_on_top()
                .map_err(|e| AdmtError::FileOperationFailed {
                    message: format!("获取窗口置顶状态失败: {}", e),
                })?;
        log::info!("窗口置顶状态: {}", is_always_on_top);
        Ok(is_always_on_top)
    } else {
        log::error!("无法找到主窗口");
        Err(AdmtError::FileOperationFailed {
            message: "无法找到主窗口".to_string(),
        })
    }
}

/// 获取应用环境信息
#[tauri::command]
pub async fn get_app_environment() -> Result<serde_json::Value> {
    let mut env_info = serde_json::Map::new();

    env_info.insert(
        "debug_mode".to_string(),
        serde_json::Value::Bool(cfg!(debug_assertions)),
    );
    env_info.insert(
        "platform".to_string(),
        serde_json::Value::String(std::env::consts::OS.to_string()),
    );
    env_info.insert(
        "arch".to_string(),
        serde_json::Value::String(std::env::consts::ARCH.to_string()),
    );
    env_info.insert(
        "family".to_string(),
        serde_json::Value::String(std::env::consts::FAMILY.to_string()),
    );

    // 添加版本信息
    if let Ok(version) = std::env::var("CARGO_PKG_VERSION") {
        env_info.insert("version".to_string(), serde_json::Value::String(version));
    }

    Ok(serde_json::Value::Object(env_info))
}

/// 下载并解压软件
#[tauri::command]
pub async fn download_and_extract_software<R: tauri::Runtime>(
    app_handle: tauri::AppHandle<R>,
    request: crate::download_manager::DownloadRequest,
) -> Result<String> {
    let download_manager = DownloadManager::new();
    let result_path = download_manager
        .download_and_extract(&app_handle, request)
        .await?;
    Ok(result_path.to_string_lossy().to_string())
}

/// 获取APK文件列表
#[tauri::command]
pub async fn get_apk_files() -> Result<Vec<String>> {
    use tokio::fs;
    
    let downloads_dir = get_app_downloads_dir()?;
    let apk_dir = downloads_dir.join("apk");
    
    // 确保APK目录存在
    if !apk_dir.exists() {
        fs::create_dir_all(&apk_dir)
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to create APK directory: {}", e)))?;
        return Ok(Vec::new());
    }
    
    let mut apk_files = Vec::new();
    let mut entries = fs::read_dir(&apk_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read APK directory: {}", e)))?;
    
    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read directory entry: {}", e)))?
    {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("apk") {
            apk_files.push(path.to_string_lossy().to_string());
        }
    }
    
    Ok(apk_files)
}

/// 获取默认下载目录（使用应用程序目录下的downloads）
#[tauri::command]
pub async fn get_default_download_directory() -> Result<String> {
    // 使用应用程序目录下的downloads文件夹
    let app_downloads_dir = get_app_downloads_dir()?;

    // 确保目录存在
    std::fs::create_dir_all(&app_downloads_dir).map_err(|e| AdmtError::IoError {
        message: e.to_string(),
    })?;

    Ok(app_downloads_dir.to_string_lossy().to_string())
}

/// 打开文件夹
#[tauri::command]
pub async fn open_folder(path: String) -> Result<()> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err(AdmtError::FileNotFound {
            path: path.to_string_lossy().to_string(),
        });
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| AdmtError::Process(e.to_string()))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| AdmtError::Process(e.to_string()))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| AdmtError::Process(e.to_string()))?;
    }

    Ok(())
}

/// 检查文件是否存在
#[tauri::command]
pub async fn check_file_exists(path: String) -> Result<bool> {
    Ok(std::path::Path::new(&path).exists())
}

/// 删除文件
#[tauri::command]
pub async fn delete_file(path: String) -> Result<()> {
    let path = std::path::Path::new(&path);

    if path.is_file() {
        std::fs::remove_file(path).map_err(|e| AdmtError::IoError {
            message: e.to_string(),
        })?;
    } else if path.is_dir() {
        std::fs::remove_dir_all(path).map_err(|e| AdmtError::IoError {
            message: e.to_string(),
        })?;
    }

    Ok(())
}

/// 读取JSON文件内容
#[tauri::command]
pub async fn read_json_file(path: String) -> Result<serde_json::Value> {
    use std::fs;

    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err(AdmtError::FileNotFound {
            path: path.to_string_lossy().to_string(),
        });
    }

    let content = fs::read_to_string(path).map_err(|e| AdmtError::IoError {
        message: format!("Failed to read file: {}", e),
    })?;

    let json: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| AdmtError::IoError {
            message: format!("Failed to parse JSON: {}", e),
        })?;

    Ok(json)
}

/// 在新窗口中执行脚本文件
#[tauri::command]
pub async fn execute_script_in_new_window(script_path: String) -> Result<CommandResult> {
    use std::path::Path;
    use std::process::Command;

    // 转换为绝对路径
    let path = if Path::new(&script_path).is_absolute() {
        Path::new(&script_path).to_path_buf()
    } else {
        std::env::current_dir()
            .map_err(|e| AdmtError::IoError {
                message: format!("Failed to get current directory: {}", e),
            })?
            .join(&script_path)
    };

    if !path.exists() {
        log::error!("Script file not found: {}", path.display());
        return Err(AdmtError::FileNotFound {
            path: path.to_string_lossy().to_string(),
        });
    }

    log::info!("Executing script in new window: {}", path.display());

    #[cfg(target_os = "windows")]
    {
        // 获取脚本的绝对路径
        let script_absolute_path = path.canonicalize().map_err(|e| AdmtError::IoError {
            message: format!("Failed to canonicalize path: {}", e),
        })?;

        // 设置工作目录为脚本所在目录
        let working_dir = script_absolute_path
            .parent()
            .ok_or_else(|| AdmtError::IoError {
                message: "Failed to get script parent directory".to_string(),
            })?;

        log::info!("Script absolute path: {}", script_absolute_path.display());
        log::info!("Working directory: {}", working_dir.display());

        // 使用简单的start命令在新窗口中启动脚本
        let script_name = script_absolute_path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("bypass.cmd");

        let mut cmd = Command::new("cmd");
        cmd.args(&["/C", "start", script_name]);
        cmd.current_dir(working_dir);

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("Script started in new window with PID: {}", pid);

                Ok(CommandResult {
                    success: true,
                    output: format!("脚本已在新窗口中启动 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                })
            }
            Err(e) => {
                log::error!("Failed to start script in new window: {}", e);
                Err(AdmtError::Process(format!(
                    "Failed to execute script: {}",
                    e
                )))
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // 对于非Windows系统，使用默认终端
        let script_absolute_path = path.canonicalize().map_err(|e| AdmtError::IoError {
            message: format!("Failed to canonicalize path: {}", e),
        })?;

        let script_str = script_absolute_path.to_string_lossy().to_string();

        // 设置工作目录为脚本所在目录
        let working_dir = script_absolute_path
            .parent()
            .ok_or_else(|| AdmtError::IoError {
                message: "Failed to get script parent directory".to_string(),
            })?;

        log::info!("Script absolute path: {}", script_str);
        log::info!("Working directory: {}", working_dir.display());

        let mut cmd = Command::new("sh");
        cmd.args(&["-c", &script_str]);
        cmd.current_dir(working_dir);

        match cmd.spawn() {
            Ok(child) => {
                let pid = child.id();
                log::info!("Script started with PID: {}", pid);

                Ok(CommandResult {
                    success: true,
                    output: format!("脚本已启动 (进程ID: {})", pid),
                    error: None,
                    exit_code: Some(0),
                })
            }
            Err(e) => {
                log::error!("Failed to start script: {}", e);
                Err(AdmtError::Process(format!(
                    "Failed to execute script: {}",
                    e
                )))
            }
        }
    }
}

