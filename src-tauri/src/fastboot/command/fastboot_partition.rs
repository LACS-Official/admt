use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use crate::device::CommandResult;
use crate::error::Result;
use crate::fastboot::command::fastboot_command_runner::execute_fastboot_command;
use crate::fastboot::device::device_info::get_fastboot_device_properties;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FastbootPartitionItem {
    pub name: String,
    pub display_name: String,
    pub size_bytes: Option<u64>,
    pub size_formatted: Option<String>,
    pub partition_type: Option<String>,
    pub slot: Option<String>, // "a" | "b" | "none"
    pub is_critical: bool,
    pub category: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FastbootPartitionListResult {
    pub current_slot: Option<String>,
    pub is_ab_device: bool,
    pub partitions: Vec<FastbootPartitionItem>,
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

fn get_partition_description(name: &str) -> (&'static str, bool, &'static str) {
    let clean = name.to_lowercase();
    let base = clean.trim_end_matches("_a").trim_end_matches("_b");
    
    // 返回 (描述, 是否关键分区, 分类类别)
    match base {
        // 核心引导与启动
        "boot" => ("系统核心启动内核与基础 Ramdisk", true, "boot"),
        "init_boot" => ("Android 13+ 专用启动 Ramdisk (包含通用 init)", true, "boot"),
        "vendor_boot" => ("厂商驱动与硬件初始化 Ramdisk", true, "boot"),
        "recovery" => ("恢复模式系统镜像", true, "boot"),
        "dtbo" => ("设备树覆盖层 (Device Tree Blob Overlay)", true, "boot"),
        "vbmeta" => ("AVB (Android Verified Boot) 根验证元数据", true, "security"),
        "vbmeta_system" => ("系统分区 AVB 验证签名", true, "security"),
        "vbmeta_vendor" => ("厂商分区 AVB 验证签名", true, "security"),
        "xbl" | "xbl_config" | "xbl_a" | "xbl_b" => ("Qualcomm 第一级 Bootloader (eXtensible Boot Loader)", true, "boot"),
        "abl" | "abl_a" | "abl_b" => ("Qualcomm 第二级 Bootloader (Android Boot Loader)", true, "boot"),
        "imagefv" => ("UEFI 固件卷镜像", true, "boot"),
        "uefisecapp" => ("UEFI 安全应用程序", true, "boot"),
        
        // 动态与核心系统
        "super" => ("动态超级分区 (包含 system/vendor/product/odm 等)", true, "system"),
        "system" => ("Android 核心系统分区", true, "system"),
        "system_ext" => ("系统扩展服务与私有 API 分区", true, "system"),
        "vendor" => ("芯片厂商底层驱动与硬件抽象 HAL 分区", true, "system"),
        "product" => ("OEM 定制应用与产品特性分区", true, "system"),
        "odm" => ("ODM 原始设备制造商定制分区", true, "system"),
        "userdata" => ("用户数据与内部存储空间", true, "system"),
        "metadata" => ("加密与动态分区元数据", true, "system"),
        "cust" => ("运营商或地区定制预装分区", false, "system"),
        "splash" | "logo" => ("开机第一屏引导画面", false, "system"),
        
        // 通信与基带
        "modem" | "radio" => ("基带与蜂窝通信射频固件", true, "communication"),
        "modemst1" | "modemst2" => ("基带 NV 存储与射频校准参数", true, "communication"),
        "fsg" | "fsc" => ("基带 Golden 黄金备份与配置数据", true, "communication"),
        "bluetooth" => ("蓝牙通信协议固件", false, "communication"),
        
        // 安全与密钥
        "keymaster" => ("硬件安全模块与硬件密钥库", true, "security"),
        "vm-keystore" => ("虚拟机密钥库存储", true, "security"),
        "secdata" => ("安全认证数据与防刷写配置", true, "security"),
        "storsec" => ("存储安全控制模块", true, "security"),
        "frp" => ("出厂重置保护 (Factory Reset Protection)", true, "security"),
        "devinfo" => ("设备状态与 Bootloader 锁状态标记", true, "security"),
        "persist" | "persistbak" => ("持久化传感器校准与设备唯一标识", true, "security"),
        
        // 硬件与底层芯片
        "aop" | "aop_config" => ("Always-on Processor 功耗控制固件", true, "hardware"),
        "tz" | "hyp" | "rpm" | "sbl1" | "uefi" => ("ARM TrustZone 安全执行环境 / 芯片底层固件", true, "hardware"),
        "cmnlib" | "cmnlib64" => ("TrustZone 通用库组件", true, "hardware"),
        "devcfg" => ("设备硬件描述配置参数", true, "hardware"),
        "qupfw" => ("QUP 硬件引擎固件", true, "hardware"),
        "dsp" => ("数字信号处理器 (DSP) 算法固件", false, "hardware"),
        "ddr" | "mdmddr" | "cdt" => ("DDR 内存校准与配置参数表", true, "hardware"),
        
        // 调试与日志
        "logdump" | "minidump" | "rawdump" | "oops" | "dbg" => ("底层系统崩溃与内核调试转储", false, "debug"),
        
        // 备份与恢复
        "rescue" => ("救砖与紧急恢复引导分区", false, "recovery"),
        "ffu" => ("快速固件升级专用分区", false, "recovery"),
        "msadp" | "apdp" => ("应用程序与系统调试策略配置", false, "recovery"),
        
        // 其他与厂商
        "misc" => ("Bootloader 指令与 Recovery 标志传递", false, "other"),
        _ => ("设备专用硬件/系统分区", false, "other"),
    }
}

/// 获取 Fastboot 设备的所有分区列表
#[tauri::command]
pub async fn get_fastboot_partitions(serial: String) -> Result<FastbootPartitionListResult> {
    log::info!("[fastboot_partition] get_fastboot_partitions: {}", serial);

    let props = get_fastboot_device_properties(serial.clone()).await.unwrap_or_default();
    let current_slot = props.current_slot.clone();
    let is_ab = props.slot_count.as_deref().map(|c| c != "0" && c != "1").unwrap_or(false)
        || current_slot.is_some();

    let mut found_names: HashSet<String> = HashSet::new();
    let mut partitions = Vec::new();

    // 1. 先从 props.partition_sizes 和 partition_types 收集实际探测到的分区
    for (name, size_str) in &props.partition_sizes {
        let clean_name = name.clone();
        found_names.insert(clean_name.clone());

        let size_val = if size_str.starts_with("0x") || size_str.starts_with("0X") {
            u64::from_str_radix(&size_str[2..], 16).ok()
        } else {
            size_str.parse::<u64>().ok()
        };

        let p_type = props.partition_types.get(name).cloned();
        let (desc, is_crit, cat) = get_partition_description(name);

        let slot = if name.ends_with("_a") {
            Some("a".to_string())
        } else if name.ends_with("_b") {
            Some("b".to_string())
        } else {
            None
        };

        partitions.push(FastbootPartitionItem {
            name: name.clone(),
            display_name: name.clone(),
            size_bytes: size_val,
            size_formatted: size_val.map(format_bytes),
            partition_type: p_type,
            slot,
            is_critical: is_crit,
            category: cat.to_string(),
            description: desc.to_string(),
        });
    }

    // 2. 如果 props 没扫描出完整的预设核心分区，则补充 Android 常见核心分区列表
    let standard_presets = vec![
        "boot", "init_boot", "vendor_boot", "recovery", "dtbo", "vbmeta",
        "vbmeta_system", "vbmeta_vendor", "super", "system", "vendor",
        "product", "system_ext", "odm", "modem", "userdata", "metadata", "persist", "misc"
    ];

    for preset in standard_presets {
        if is_ab {
            let name_a = format!("{}_a", preset);
            if !found_names.contains(&name_a) && !found_names.contains(preset) {
                let (desc, is_crit, cat) = get_partition_description(preset);
                partitions.push(FastbootPartitionItem {
                    name: preset.to_string(),
                    display_name: format!("{} (Slot: 当前/A/B)", preset),
                    size_bytes: None,
                    size_formatted: None,
                    partition_type: None,
                    slot: current_slot.clone(),
                    is_critical: is_crit,
                    category: cat.to_string(),
                    description: desc.to_string(),
                });
            }
        } else {
            if !found_names.contains(preset) {
                let (desc, is_crit, cat) = get_partition_description(preset);
                partitions.push(FastbootPartitionItem {
                    name: preset.to_string(),
                    display_name: preset.to_string(),
                    size_bytes: None,
                    size_formatted: None,
                    partition_type: None,
                    slot: None,
                    is_critical: is_crit,
                    category: cat.to_string(),
                    description: desc.to_string(),
                });
            }
        }
    }

    // 排序：boot/init_boot/recovery/vbmeta 放前面
    partitions.sort_by(|a, b| {
        let priority = |n: &str| -> i32 {
            let base = n.trim_end_matches("_a").trim_end_matches("_b");
            match base {
                "boot" => 1,
                "init_boot" => 2,
                "vendor_boot" => 3,
                "recovery" => 4,
                "vbmeta" => 5,
                "vbmeta_system" => 6,
                "vbmeta_vendor" => 7,
                "dtbo" => 8,
                "super" => 9,
                "system" => 10,
                "vendor" => 11,
                _ => 50,
            }
        };
        priority(&a.name).cmp(&priority(&b.name))
    });

    Ok(FastbootPartitionListResult {
        current_slot,
        is_ab_device: is_ab,
        partitions,
    })
}

/// 刷入指定分区镜像
#[tauri::command]
pub async fn fastboot_flash_partition(
    serial: String,
    partition: String,
    file_path: String,
    slot: Option<String>,
    disable_verity: Option<bool>,
    disable_verification: Option<bool>,
) -> Result<CommandResult> {
    log::info!(
        "[fastboot_partition] fastboot_flash_partition: serial={}, part={}, file={}, slot={:?}, disable_verity={:?}, disable_verification={:?}",
        serial, partition, file_path, slot, disable_verity, disable_verification
    );

    let mut args = Vec::new();

    if disable_verity.unwrap_or(false) {
        args.push("--disable-verity".to_string());
    }
    if disable_verification.unwrap_or(false) {
        args.push("--disable-verification".to_string());
    }

    // 目标分区名（如果指定了 slot a/b 且分区名未包含 slot 后缀）
    let target_partition = if let Some(ref s) = slot {
        if (s == "a" || s == "b") && !partition.ends_with("_a") && !partition.ends_with("_b") {
            format!("{}_{}", partition, s)
        } else {
            partition.clone()
        }
    } else {
        partition.clone()
    };

    args.push(target_partition);
    args.push(file_path);

    execute_fastboot_command(serial, "flash".to_string(), args, Some(300)).await
}

/// 从设备拉取/备份指定分区 (fastboot fetch)
#[tauri::command]
pub async fn fastboot_fetch_partition(
    serial: String,
    partition: String,
    output_path: String,
) -> Result<CommandResult> {
    log::info!(
        "[fastboot_partition] fastboot_fetch_partition: serial={}, part={}, out={}",
        serial, partition, output_path
    );

    let args = vec![partition.clone(), output_path.clone()];
    let res = execute_fastboot_command(serial, "fetch".to_string(), args, Some(300)).await?;

    if !res.success {
        let err_msg = res.error.as_deref().unwrap_or("fetch 命令执行失败");
        let extra_tip = if err_msg.contains("unknown command") || err_msg.contains("Command not supported") || err_msg.contains("remote:") {
            "\n提示：该设备的 Bootloader 锁定了 raw fetch 功能。这是多数手机厂商的默认安全策略。建议进入 Fastbootd、Recovery (TWRP) 模式，或使用已修补 Root 环境下的 dump 提取工具。"
        } else {
            ""
        };

        return Ok(CommandResult {
            success: false,
            output: res.output,
            error: Some(format!("{}{}", err_msg, extra_tip)),
            exit_code: res.exit_code,
        });
    }

    Ok(res)
}

/// 擦除指定分区 (fastboot erase)
#[tauri::command]
pub async fn fastboot_erase_partition(
    serial: String,
    partition: String,
    slot: Option<String>,
) -> Result<CommandResult> {
    log::info!(
        "[fastboot_partition] fastboot_erase_partition: serial={}, part={}, slot={:?}",
        serial, partition, slot
    );

    let target_partition = if let Some(ref s) = slot {
        if (s == "a" || s == "b") && !partition.ends_with("_a") && !partition.ends_with("_b") {
            format!("{}_{}", partition, s)
        } else {
            partition
        }
    } else {
        partition
    };

    let args = vec![target_partition];
    execute_fastboot_command(serial, "erase".to_string(), args, Some(60)).await
}
