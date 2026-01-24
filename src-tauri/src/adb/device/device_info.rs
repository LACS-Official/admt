use crate::device::{DeviceInfo, DeviceMode, DeviceProperties};
use crate::error::AdmtError;
use crate::utils::execute_adb_command as utils_execute_adb_command;
use log;

/// 获取设备信息
pub async fn get_device_info(serial: String) -> Result<DeviceInfo, AdmtError> {
    // 首先验证设备是否存在
    let devices = crate::commands::scan_devices().await?;
    let mut device = devices
        .into_iter()
        .find(|d| d.serial == serial)
        .ok_or_else(|| AdmtError::DeviceNotFound {
            serial: serial.clone(),
        })?;

    if device.mode == DeviceMode::Unauthorized {
        return Err(AdmtError::DeviceUnauthorized { serial });
    }

    // 获取设备属性并更新设备信息
    match get_device_properties_batch(&serial).await {
        Ok(properties) => {
            device.properties = Some(properties);
        }
        Err(e) => {
            log::warn!("Failed to get device properties for {}: {}", serial, e);
        }
    }

    Ok(device)
}

/// 批量获取设备属性（优化版本）
pub async fn get_device_properties_batch(serial: &str) -> Result<DeviceProperties, AdmtError> {
    // 使用单个getprop命令获取所有属性
    let result = utils_execute_adb_command(&["-s", serial, "shell", "getprop"], Some(10)).await?;

    if !result.success {
        let error_msg = result.error.unwrap_or_else(|| "Unknown error".to_string());
        return Err(AdmtError::Device(format!(
            "Failed to get device properties: {}",
            error_msg
        )));
    }

    let mut properties = DeviceProperties::default();

    // 解析getprop输出
    for line in result.output.lines() {
        if let Some((key, value)) = parse_getprop_line(line) {
            match key.as_str() {
                // 设备基本信息
                "ro.product.marketname" => properties.market_name = Some(value),
                "ro.product.name" => properties.product_name = Some(value),
                "ro.product.brand" => properties.brand = Some(value),
                "ro.product.model" => properties.model = Some(value),
                "ro.product.device" => properties.device_name = Some(value),
                "ro.product.manufacturer" => properties.manufacturer = Some(value),
                "ro.serialno" => properties.serial_number = Some(value),

                // 系统版本信息
                "ro.build.version.release" => properties.android_version = Some(value),
                "ro.build.version.sdk" => properties.sdk_version = Some(value),
                "ro.build.id" => properties.build_id = Some(value),
                "ro.build.display.id" => properties.build_display_id = Some(value),
                "ro.system.build.version.incremental" => properties.system_version = Some(value),
                "ro.build.version.security_patch" => properties.security_patch_level = Some(value),
                "ro.build.fingerprint" => properties.build_fingerprint = Some(value),
                "ro.build.date" => properties.build_date = Some(value),
                "ro.build.user" => properties.build_user = Some(value),
                "ro.build.host" => properties.build_host = Some(value),
                "ro.miui.ui.version.name" => properties.miui_version = Some(value),

                // 硬件信息
                "ro.product.cpu.abi" => properties.cpu_abi = Some(value),
                "ro.product.cpu.abilist" => properties.cpu_abi_list = Some(value),
                "ro.soc.manufacturer" => properties.soc_manufacturer = Some(value),
                "ro.soc.model" => properties.soc_model = Some(value),
                "ro.hardware" => properties.hardware = Some(value),
                "ro.hardware.chipname" => properties.hardware_chipname = Some(value),
                "ro.board.platform" => properties.board_platform = Some(value),
                "ro.product.board" => properties.product_board = Some(value),

                // 安全和启动信息
                "ro.boot.flash.locked" => properties.bootloader_locked = parse_bool(&value),
                "ro.boot.verifiedbootstate" => properties.verified_boot_state = Some(value),
                "ro.boot.veritymode" => properties.verity_mode = Some(value),
                "ro.debuggable" => properties.debuggable = parse_bool(&value),
                "ro.secure" => properties.secure = parse_bool(&value),
                "ro.adb.secure" => properties.adb_secure = parse_bool(&value),

                // 显示和UI信息
                "ro.sf.lcd_density" => properties.lcd_density = Some(value),
                "ro.product.locale" => properties.locale = Some(value),
                "persist.sys.timezone" => properties.timezone = Some(value),

                // 网络和通信
                "ro.telephony.default_network" => properties.default_network = Some(value),
                "ro.product.first_api_level" => properties.first_api_level = Some(value),
                "ro.vndk.version" => properties.vndk_version = Some(value),
                _ => {} // 忽略其他属性
            }
        }
    }

    // 获取电池电量信息
    if let Ok(battery_result) =
        utils_execute_adb_command(&["-s", serial, "shell", "dumpsys", "battery"], Some(10)).await
    {
        if battery_result.success {
            properties.battery_level = parse_battery_level(&battery_result.output);
            log::debug!(
                "Battery level for {}: {:?}",
                serial,
                properties.battery_level
            );
        } else {
            log::warn!(
                "Failed to get battery info for {}: {:?}",
                serial,
                battery_result.error
            );
        }
    } else {
        log::warn!("Failed to execute battery command for {}", serial);
    }

    // 获取屏幕分辨率信息
    if let Ok(screen_result) =
        utils_execute_adb_command(&["-s", serial, "shell", "wm", "size"], Some(5)).await
    {
        if screen_result.success {
            properties.screen_resolution = parse_screen_resolution(&screen_result.output);
            log::debug!(
                "Screen resolution for {}: {:?}",
                serial,
                properties.screen_resolution
            );
        }
    }

    // 获取内存信息
    if let Ok(memory_result) =
        utils_execute_adb_command(&["-s", serial, "shell", "cat", "/proc/meminfo"], Some(5)).await
    {
        if memory_result.success {
            if let Some(total_memory) = parse_total_memory(&memory_result.output) {
                properties.total_memory = Some(format!("{} MB", total_memory / 1024));
                log::debug!("Total memory for {}: {:?}", serial, properties.total_memory);
            }
        }
    }

    // 获取存储信息
    if let Ok(storage_result) =
        utils_execute_adb_command(&["-s", serial, "shell", "df", "/data"], Some(5)).await
    {
        if storage_result.success {
            if let Some(available_storage) = parse_available_storage(&storage_result.output) {
                properties.available_storage = Some(format!("{} MB", available_storage / 1024));
                log::debug!(
                    "Available storage for {}: {:?}",
                    serial,
                    properties.available_storage
                );
            }
        }
    }

    Ok(properties)
}

/// 解析getprop输出行
fn parse_getprop_line(line: &str) -> Option<(String, String)> {
    // getprop输出格式: [key]: [value]
    if let Some(start) = line.find('[') {
        if let Some(end) = line.find("]: [") {
            let key = line[start + 1..end].to_string();
            if let Some(value_start) = line.rfind('[') {
                if let Some(value_end) = line.rfind(']') {
                    if value_start != start && value_end > value_start {
                        let value = line[value_start + 1..value_end].to_string();
                        if !value.is_empty() {
                            return Some((key, value));
                        }
                    }
                }
            }
        }
    }
    None
}

/// 解析布尔值字符串
fn parse_bool(value: &str) -> Option<bool> {
    match value.to_lowercase().as_str() {
        "1" | "true" | "yes" | "on" => Some(true),
        "0" | "false" | "no" | "off" => Some(false),
        _ => None,
    }
}

/// 解析电池电量信息
fn parse_battery_level(output: &str) -> Option<i32> {
    for line in output.lines() {
        let line = line.trim();
        if line.starts_with("level:") {
            if let Some(level_str) = line.split(':').nth(1) {
                if let Ok(level) = level_str.trim().parse::<i32>() {
                    if (0..=100).contains(&level) {
                        return Some(level);
                    }
                }
            }
        }
    }
    None
}

/// 解析屏幕分辨率信息
fn parse_screen_resolution(output: &str) -> Option<String> {
    for line in output.lines() {
        if line.contains("Physical size:") {
            if let Some(size_part) = line.split("Physical size:").nth(1) {
                return Some(size_part.trim().to_string());
            }
        }
    }
    None
}

/// 解析总内存信息（返回KB）
fn parse_total_memory(output: &str) -> Option<u64> {
    for line in output.lines() {
        if line.starts_with("MemTotal:") {
            if let Some(mem_part) = line.split_whitespace().nth(1) {
                if let Ok(mem_kb) = mem_part.parse::<u64>() {
                    return Some(mem_kb);
                }
            }
        }
    }
    None
}

/// 解析可用存储信息（返回KB）
fn parse_available_storage(output: &str) -> Option<u64> {
    let lines: Vec<&str> = output.lines().collect();
    if lines.len() > 1 {
        let data_line = lines[1];
        let parts: Vec<&str> = data_line.split_whitespace().collect();
        if parts.len() >= 4 {
            if let Ok(available_kb) = parts[3].parse::<u64>() {
                return Some(available_kb);
            }
        }
    }
    None
}
