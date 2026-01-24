use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::error::Result;
use crate::fastboot::command::fastboot_command_runner::execute_fastboot_command;

/// Fastboot设备属性结构体
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct FastbootDeviceProperties {
    // 设备基础身份信息
    pub product: Option<String>,  // 设备型号代码
    pub serialno: Option<String>, // 设备序列号
    pub kernel: Option<String>,   // 设备启动方式

    // Bootloader状态与安全配置
    pub unlocked: Option<bool>,     // Bootloader解锁状态
    pub secure: Option<bool>,       // 安全启动状态
    pub anti: Option<String>,       // 防回滚保护
    pub is_userspace: Option<bool>, // 当前模式

    // A/B分区信息
    pub slot_count: Option<String>,         // 分区槽位数量
    pub current_slot: Option<String>,       // 当前活跃槽位
    pub slot_successful_a: Option<bool>,    // A槽启动状态
    pub slot_successful_b: Option<bool>,    // B槽启动状态
    pub slot_retry_count_a: Option<String>, // A槽重试次数
    pub slot_retry_count_b: Option<String>, // B槽重试次数

    // 硬件与电源状态
    pub hw_revision: Option<String>,     // 硬件版本号
    pub battery_voltage: Option<String>, // 电池电压
    pub battery_soc_ok: Option<bool>,    // 电池电量状态
    pub cpuid: Option<String>,           // CPU唯一ID

    // 存储与分区结构
    pub max_download_size: Option<String>,     // 最大下载大小
    pub parallel_download_flash: Option<bool>, // 并行刷写支持

    // 其他辅助参数
    pub off_mode_charge: Option<bool>,        // 关机充电模式
    pub charger_screen_enabled: Option<bool>, // 充电屏幕启用状态

    // 分区信息（存储为键值对）
    pub partition_types: HashMap<String, String>, // 分区类型
    pub partition_sizes: HashMap<String, String>, // 分区大小
}

/// 解析fastboot getvar all命令输出
pub fn parse_fastboot_getvar_all(output: &str) -> FastbootDeviceProperties {
    let mut properties = FastbootDeviceProperties::default();
    let mut partition_types = HashMap::new();
    let mut partition_sizes = HashMap::new();

    for line in output.lines() {
        // 跳过空行
        if line.trim().is_empty() {
            continue;
        }

        // 解析格式: (bootloader) key:value
        if let Some(stripped) = line.strip_prefix("(bootloader) ") {
            if let Some((key, value)) = stripped.split_once(':') {
                let key = key.trim();
                let value = value.trim();

                match key {
                    // 设备基础身份信息
                    "product" => properties.product = Some(value.to_string()),
                    "serialno" => properties.serialno = Some(value.to_string()),
                    "kernel" => properties.kernel = Some(value.to_string()),

                    // Bootloader状态与安全配置
                    "unlocked" => properties.unlocked = parse_bool(value),
                    "secure" => properties.secure = parse_bool(value),
                    "anti" => properties.anti = Some(value.to_string()),
                    "is-userspace" => properties.is_userspace = parse_bool(value),

                    // A/B分区信息
                    "slot-count" => properties.slot_count = Some(value.to_string()),
                    "current-slot" => properties.current_slot = Some(value.to_string()),
                    "slot-successful:a" => properties.slot_successful_a = parse_bool(value),
                    "slot-successful:b" => properties.slot_successful_b = parse_bool(value),
                    "slot-unbootable:a" => {
                        properties.slot_successful_a = parse_bool(value).map(|b| !b)
                    } // 可引导状态取反
                    "slot-unbootable:b" => {
                        properties.slot_successful_b = parse_bool(value).map(|b| !b)
                    } // 可引导状态取反
                    "slot-retry-count:a" => properties.slot_retry_count_a = Some(value.to_string()),
                    "slot-retry-count:b" => properties.slot_retry_count_b = Some(value.to_string()),

                    // 硬件与电源状态

                    //设备硬件版本号
                    "hw-revision" => properties.hw_revision = Some(value.to_string()),
                    // 电池电压
                    "battery-voltage" => properties.battery_voltage = Some(value.to_string()),
                    // 电池电量状态
                    "battery-soc-ok" => properties.battery_soc_ok = parse_bool(value),
                    //cpuid
                    "cpuid" => properties.cpuid = Some(parse_cpuid(value)),

                    // 存储与分区结构
                    "max-download-size" => properties.max_download_size = Some(value.to_string()),
                    // 存储与分区结构 - 并行刷写支持
                    "parallel-download-flash" => {
                        properties.parallel_download_flash = parse_bool(value)
                    }

                    // 其他辅助参数
                    "off-mode-charge" => properties.off_mode_charge = parse_bool(value),
                    "charger-screen-enabled" => {
                        properties.charger_screen_enabled = parse_bool(value)
                    }

                    // 分区信息
                    key if key.starts_with("partition-type:") => {
                        if let Some(partition_name) = key.strip_prefix("partition-type:") {
                            partition_types.insert(partition_name.to_string(), value.to_string());
                        }
                    }
                    key if key.starts_with("partition-size:") => {
                        if let Some(partition_name) = key.strip_prefix("partition-size:") {
                            partition_sizes.insert(partition_name.to_string(), value.to_string());
                        }
                    }

                    _ => {} // 忽略未知属性
                }
            }
        }
    }

    properties.partition_types = partition_types;
    properties.partition_sizes = partition_sizes;

    properties
}

/// 解析布尔值
fn parse_bool(value: &str) -> Option<bool> {
    match value.to_lowercase().as_str() {
        "yes" | "true" | "1" => Some(true),
        "no" | "false" | "0" => Some(false),
        _ => None,
    }
}

/// 解析cpuid值，支持十六进制格式
fn parse_cpuid(value: &str) -> String {
    // 如果是以0x开头的十六进制格式，去掉前缀并转换为大写
    if let Some(stripped) = value.strip_prefix("0x") {
        stripped.to_uppercase()
    } else {
        value.to_string()
    }
}

/// 获取fastboot设备属性
#[tauri::command]
pub async fn get_fastboot_device_properties(serial: String) -> Result<FastbootDeviceProperties> {
    log::info!("[fastboot_device_info] 获取fastboot设备属性: {}", serial);

    // 执行fastboot getvar all命令
    // 增加超时时间到60秒，以适应刷写过程中设备响应变慢的情况
    let result = execute_fastboot_command(
        serial.clone(),
        "getvar".to_string(),
        vec!["all".to_string()],
        Some(60), // 60秒超时
    )
    .await?;

    if !result.success {
        let error_msg = result.error.unwrap_or_else(|| "Unknown error".to_string());
        log::error!("[fastboot_device_info] 获取fastboot属性失败: {}", error_msg);
        return Err(crate::error::AdmtError::Device(format!(
            "Failed to get fastboot properties: {}",
            error_msg
        )));
    }

    log::info!(
        "[fastboot_device_info] fastboot getvar all输出长度: {} 字符",
        result.output.len()
    );

    // 解析输出
    let properties = parse_fastboot_getvar_all(&result.output);

    log::info!(
        "[fastboot_device_info] 解析完成，找到 {} 个分区类型，{} 个分区大小",
        properties.partition_types.len(),
        properties.partition_sizes.len()
    );

    Ok(properties)
}

/// 将Fastboot设备属性转换为通用的DeviceProperties
pub fn convert_to_device_properties(
    fastboot_props: &FastbootDeviceProperties,
) -> crate::device::DeviceProperties {
    let mut device_props = crate::device::DeviceProperties::default();

    // 设备基本信息
    device_props.product_name = fastboot_props.product.clone();
    device_props.serial_number = fastboot_props.serialno.clone();

    // 硬件信息
    device_props.hardware = fastboot_props.kernel.clone();
    device_props.soc_manufacturer = fastboot_props.hw_revision.clone(); // 使用实际的hw-revision值
    device_props.total_memory = fastboot_props.max_download_size.clone(); // 使用max-download-size作为内存参考
    device_props.imei = fastboot_props.cpuid.clone(); // 使用cpuid作为IMEI参考

    // 安全和启动信息
    device_props.bootloader_locked = fastboot_props.unlocked;
    device_props.secure = fastboot_props.secure;
    device_props.anti_rollback = fastboot_props
        .anti
        .clone()
        .and_then(|anti| parse_bool(&anti)); // 将anti字符串解析为布尔值
    device_props.cpuid = fastboot_props.cpuid.clone(); // 保存cpuid值

    // 分区信息
    device_props.first_api_level = fastboot_props.slot_count.clone(); // 使用slot-count作为API级别参考
    device_props.vndk_version = fastboot_props.current_slot.clone(); // 使用current-slot作为VNDK版本参考

    // 运行时信息
    if let Some(voltage) = &fastboot_props.battery_voltage {
        device_props.battery_level = Some(calculate_battery_level(voltage));
    }

    // 其他信息
    device_props.parallel_download_flash = fastboot_props.parallel_download_flash; // 使用parallel-download-flash作为并行刷写支持状态
    device_props.off_mode_charge = fastboot_props.off_mode_charge; // 使用off-mode-charge作为关机充电模式状态

    device_props
}

/// 根据电池电压估算电量百分比
fn calculate_battery_level(voltage: &str) -> i32 {
    if let Ok(voltage_mv) = voltage.parse::<i32>() {
        // 简单估算：4.2V为100%，3.7V为0%
        let voltage_v = voltage_mv as f32 / 1000.0;
        let level = ((voltage_v - 3.7) / (4.2 - 3.7) * 100.0).round() as i32;
        level.clamp(0, 100)
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_fastboot_getvar_all() {
        let output = r#"
(bootloader) crc:1
(bootloader) product:alioth
(bootloader) serialno:1c6fd5d9
(bootloader) kernel:uefi
(bootloader) unlocked:yes
(bootloader) secure:yes
(bootloader) anti:1
(bootloader) slot-count:2
(bootloader) current-slot:a
(bootloader) battery-voltage:4413
(bootloader) battery-soc-ok:yes
(bootloader) partition-type:boot_a:raw
(bootloader) partition-size:boot_a:0xC000000
(bootloader) partition-type:userdata:f2fs
(bootloader) partition-size:userdata:0x385B7FB000
"#;

        let props = parse_fastboot_getvar_all(output);

        assert_eq!(props.product, Some("alioth".to_string()));
        assert_eq!(props.serialno, Some("1c6fd5d9".to_string()));
        assert_eq!(props.kernel, Some("uefi".to_string()));
        assert_eq!(props.unlocked, Some(true));
        assert_eq!(props.secure, Some(true));
        assert_eq!(props.anti, Some("1".to_string()));
        assert_eq!(props.slot_count, Some("2".to_string()));
        assert_eq!(props.current_slot, Some("a".to_string()));
        assert_eq!(props.battery_voltage, Some("4413".to_string()));
        assert_eq!(props.battery_soc_ok, Some(true));

        assert_eq!(
            props.partition_types.get("boot_a"),
            Some(&"raw".to_string())
        );
        assert_eq!(
            props.partition_types.get("userdata"),
            Some(&"f2fs".to_string())
        );
        assert_eq!(
            props.partition_sizes.get("boot_a"),
            Some(&"0xC000000".to_string())
        );
        assert_eq!(
            props.partition_sizes.get("userdata"),
            Some(&"0x385B7FB000".to_string())
        );
    }

    #[test]
    fn test_parse_bool() {
        assert_eq!(parse_bool("yes"), Some(true));
        assert_eq!(parse_bool("YES"), Some(true));
        assert_eq!(parse_bool("no"), Some(false));
        assert_eq!(parse_bool("NO"), Some(false));
        assert_eq!(parse_bool("true"), Some(true));
        assert_eq!(parse_bool("false"), Some(false));
        assert_eq!(parse_bool("1"), Some(true));
        assert_eq!(parse_bool("0"), Some(false));
        assert_eq!(parse_bool("unknown"), None);
    }

    #[test]
    fn test_calculate_battery_level() {
        assert_eq!(calculate_battery_level("4200"), 100); // 4.2V = 100%
        assert_eq!(calculate_battery_level("3950"), 50); // 3.95V = 50%
        assert_eq!(calculate_battery_level("3700"), 0); // 3.7V = 0%
        assert_eq!(calculate_battery_level("4500"), 100); // 4.5V = 100% (钳位)
        assert_eq!(calculate_battery_level("3500"), 0); // 3.5V = 0% (钳位)
        assert_eq!(calculate_battery_level("invalid"), 0); // 无效输入
    }

    #[test]
    fn test_parse_cpuid() {
        // 测试十六进制格式
        assert_eq!(parse_cpuid("0x5d0946c4"), "5D0946C4");
        assert_eq!(parse_cpuid("0x1234abcd"), "1234ABCD");
        assert_eq!(parse_cpuid("0xABCDEF"), "ABCDEF");

        // 测试非十六进制格式
        assert_eq!(parse_cpuid("12345678"), "12345678");
        assert_eq!(parse_cpuid("cpuid-value"), "cpuid-value");
        assert_eq!(parse_cpuid(""), "");
    }

    #[test]
    fn test_parse_fastboot_getvar_all_with_cpuid() {
        let output = r#"
(bootloader) product:test_device
(bootloader) serialno:123456789
(bootloader) cpuid:0x5d0946c4
(bootloader) battery-voltage:4200
"#;

        let props = parse_fastboot_getvar_all(output);

        assert_eq!(props.product, Some("test_device".to_string()));
        assert_eq!(props.serialno, Some("123456789".to_string()));
        assert_eq!(props.cpuid, Some("5D0946C4".to_string())); // 验证十六进制格式被正确解析
        assert_eq!(props.battery_voltage, Some("4200".to_string()));
    }
}
