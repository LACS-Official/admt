use crate::adb::device::device_info::{get_device_info, get_device_properties_batch};
use crate::cache::get_cache_manager;
use crate::device::{DeviceInfo, DeviceMode, DeviceProperties};
use crate::error::{AdmtError, Result};
use crate::utils::{
    execute_adb_command as utils_execute_adb_command, execute_fastboot_command,
    parse_adb_device_list, parse_fastboot_device_list,
};

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
    let fastboot_props =
        crate::fastboot::device::device_info::get_fastboot_device_properties(serial.to_string())
            .await?;

    // 转换为通用的DeviceProperties
    let properties =
        crate::fastboot::device::device_info::convert_to_device_properties(&fastboot_props);

    log::info!(
        "Successfully got fastboot properties for device {}: product={:?}, serial={:?}",
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

/// 检查设备连接状态
#[tauri::command]
pub async fn check_device_connection(serial: String) -> Result<crate::device::CommandResult> {
    let result = utils_execute_adb_command(&["-s", &serial, "get-state"], Some(5)).await?;

    if result.success && result.output.trim() == "device" {
        Ok(crate::device::CommandResult {
            success: true,
            output: "device".to_string(),
            error: None,
            exit_code: Some(0),
        })
    } else {
        Ok(crate::device::CommandResult {
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

/// 清除设备属性缓存
#[tauri::command]
pub async fn invalidate_device_cache(serial: String) -> Result<()> {
    let cache_manager = get_cache_manager();
    cache_manager.invalidate_device(&serial).await;
    log::info!("Device cache invalidated for: {}", serial);
    Ok(())
}
