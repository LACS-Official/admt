use crate::device::{DeviceInfo, DeviceMode, DeviceProperties, CommandResult, InstalledApp, ApkInfo, BatchOperation, DeviceFile};
use crate::error::{HoutError, Result};
use crate::screen_mirror::{ScreenMirrorSession, ScreenMirrorConfig, ScreenMirrorDevice};
use crate::utils::{execute_adb_command as utils_execute_adb_command, execute_fastboot_command, parse_adb_device_list, parse_fastboot_device_list};
use crate::download_manager::DownloadManager;
use tauri::Emitter;
use crate::activation::{ActivationValidator, ActivationRequest, ActivationResponse, AppConfig};
use serde::{Deserialize, Serialize};
use tauri::Manager;





/// 扫描连接的设备
#[tauri::command]
pub async fn scan_devices() -> Result<Vec<DeviceInfo>> {
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
            log::warn!("Fastboot devices command failed: success={}, output={}, error={:?}",
                result.success, result.output, result.error);
        }
        Err(e) => {
            log::error!("Failed to execute Fastboot devices command: {}", e);
        }
    }
    
    log::info!("Found {} devices", devices.len());
    Ok(devices)
}

/// 获取设备详细信息
#[tauri::command]
pub async fn get_device_info(serial: String) -> Result<DeviceInfo> {
    // 首先验证设备是否存在
    let devices = scan_devices().await?;
    let device = devices
        .into_iter()
        .find(|d| d.serial == serial)
        .ok_or_else(|| HoutError::DeviceNotFound { serial: serial.clone() })?;
    
    if device.mode == DeviceMode::Unauthorized {
        return Err(HoutError::DeviceUnauthorized { serial });
    }
    
    Ok(device)
}

/// 获取设备属性
#[tauri::command]
pub async fn get_device_properties(serial: String) -> Result<DeviceProperties> {
    // 验证设备存在且可访问
    let device = get_device_info(serial.clone()).await?;
    
    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }
    
    let mut properties = DeviceProperties {
        // 设备基本信息
        market_name: None,
        product_name: None,
        brand: None,
        model: None,
        device_name: None,
        manufacturer: None,
        serial_number: None,

        // 系统版本信息
        android_version: None,
        sdk_version: None,
        build_id: None,
        build_display_id: None,
        system_version: None,
        security_patch_level: None,
        build_fingerprint: None,
        build_date: None,
        build_user: None,
        build_host: None,

        // 硬件信息
        cpu_abi: None,
        cpu_abi_list: None,
        soc_manufacturer: None,
        soc_model: None,
        hardware: None,
        hardware_chipname: None,
        board_platform: None,
        product_board: None,

        // 安全和启动信息
        bootloader_locked: None,
        verified_boot_state: None,
        verity_mode: None,
        debuggable: None,
        secure: None,
        adb_secure: None,

        // 显示和UI信息
        lcd_density: None,
        locale: None,
        timezone: None,

        // 网络和通信
        default_network: None,
        first_api_level: None,
        vndk_version: None,

        // 运行时信息
        imei: None,
        battery_level: None,
        screen_resolution: None,
        total_memory: None,
        available_storage: None,

        // 详细内存和存储信息
        memory_total: None,
        memory_used: None,
        memory_available: None,
        storage_total: None,
        storage_used: None,
        storage_available: None,
    };
    
    // 获取基本属性 - 扩展更多关键信息
    let property_keys = [
        // 设备基本信息
        "ro.product.marketname",
        "ro.product.name",
        "ro.product.brand",
        "ro.product.model",
        "ro.product.device",
        "ro.product.manufacturer",
        "ro.serialno",

        // 系统版本信息
        "ro.build.version.release",
        "ro.build.version.sdk",
        "ro.build.id",
        "ro.build.display.id",
        "ro.system.build.version.incremental",
        "ro.build.version.security_patch",
        "ro.build.fingerprint",
        "ro.build.date",
        "ro.build.user",
        "ro.build.host",

        // 硬件信息
        "ro.product.cpu.abi",
        "ro.product.cpu.abilist",
        "ro.soc.manufacturer",
        "ro.soc.model",
        "ro.hardware",
        "ro.hardware.chipname",
        "ro.board.platform",
        "ro.product.board",

        // 安全和启动信息
        "ro.boot.flash.locked",
        "ro.boot.verifiedbootstate",
        "ro.boot.veritymode",
        "ro.debuggable",
        "ro.secure",
        "ro.adb.secure",

        // 显示和UI信息
        "ro.sf.lcd_density",
        "ro.product.locale",
        "persist.sys.timezone",

        // 网络和通信
        "ro.telephony.default_network",
        "ro.product.first_api_level",
        "ro.vndk.version",
    ];
    
    for key in &property_keys {
        if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "getprop", key], Some(5)).await {
            if result.success {
                let value = result.output.trim();
                if !value.is_empty() {
                    match *key {
                        // 设备基本信息
                        "ro.product.marketname" => properties.market_name = Some(value.to_string()),
                        "ro.product.name" => properties.product_name = Some(value.to_string()),
                        "ro.product.brand" => properties.brand = Some(value.to_string()),
                        "ro.product.model" => properties.model = Some(value.to_string()),
                        "ro.product.device" => properties.device_name = Some(value.to_string()),
                        "ro.product.manufacturer" => properties.manufacturer = Some(value.to_string()),
                        "ro.serialno" => properties.serial_number = Some(value.to_string()),

                        // 系统版本信息
                        "ro.build.version.release" => properties.android_version = Some(value.to_string()),
                        "ro.build.version.sdk" => properties.sdk_version = Some(value.to_string()),
                        "ro.build.id" => properties.build_id = Some(value.to_string()),
                        "ro.build.display.id" => properties.build_display_id = Some(value.to_string()),
                        "ro.system.build.version.incremental" => properties.system_version = Some(value.to_string()),
                        "ro.build.version.security_patch" => properties.security_patch_level = Some(value.to_string()),
                        "ro.build.fingerprint" => properties.build_fingerprint = Some(value.to_string()),
                        "ro.build.date" => properties.build_date = Some(value.to_string()),
                        "ro.build.user" => properties.build_user = Some(value.to_string()),
                        "ro.build.host" => properties.build_host = Some(value.to_string()),

                        // 硬件信息
                        "ro.product.cpu.abi" => properties.cpu_abi = Some(value.to_string()),
                        "ro.product.cpu.abilist" => properties.cpu_abi_list = Some(value.to_string()),
                        "ro.soc.manufacturer" => properties.soc_manufacturer = Some(value.to_string()),
                        "ro.soc.model" => properties.soc_model = Some(value.to_string()),
                        "ro.hardware" => properties.hardware = Some(value.to_string()),
                        "ro.hardware.chipname" => properties.hardware_chipname = Some(value.to_string()),
                        "ro.board.platform" => properties.board_platform = Some(value.to_string()),
                        "ro.product.board" => properties.product_board = Some(value.to_string()),

                        // 安全和启动信息
                        "ro.boot.flash.locked" => properties.bootloader_locked = Some(value == "1"),
                        "ro.boot.verifiedbootstate" => properties.verified_boot_state = Some(value.to_string()),
                        "ro.boot.veritymode" => properties.verity_mode = Some(value.to_string()),
                        "ro.debuggable" => properties.debuggable = Some(value == "1"),
                        "ro.secure" => properties.secure = Some(value == "1"),
                        "ro.adb.secure" => properties.adb_secure = Some(value == "1"),

                        // 显示和UI信息
                        "ro.sf.lcd_density" => properties.lcd_density = Some(value.to_string()),
                        "ro.product.locale" => properties.locale = Some(value.to_string()),
                        "persist.sys.timezone" => properties.timezone = Some(value.to_string()),

                        // 网络和通信
                        "ro.telephony.default_network" => properties.default_network = Some(value.to_string()),
                        "ro.product.first_api_level" => properties.first_api_level = Some(value.to_string()),
                        "ro.vndk.version" => properties.vndk_version = Some(value.to_string()),

                        _ => {}
                    }
                }
            }
        }
    }
    
    // 获取电池电量和状态
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "dumpsys", "battery"], Some(10)).await {
        if result.success {
            for line in result.output.lines() {
                if line.trim().starts_with("level:") {
                    if let Some(level_str) = line.split(':').nth(1) {
                        if let Ok(level) = level_str.trim().parse::<i32>() {
                            properties.battery_level = Some(level);
                        }
                    }
                }
            }
        }
    }

    // 获取屏幕分辨率
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "wm", "size"], Some(5)).await {
        if result.success {
            for line in result.output.lines() {
                if line.contains("Physical size:") {
                    if let Some(size_part) = line.split("Physical size:").nth(1) {
                        properties.screen_resolution = Some(size_part.trim().to_string());
                    }
                }
            }
        }
    }

    // 获取内存信息
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/proc/meminfo"], Some(5)).await {
        if result.success {
            for line in result.output.lines() {
                if line.starts_with("MemTotal:") {
                    if let Some(mem_part) = line.split_whitespace().nth(1) {
                        if let Ok(mem_kb) = mem_part.parse::<u64>() {
                            let mem_mb = mem_kb / 1024;
                            properties.total_memory = Some(format!("{} MB", mem_mb));
                        }
                    }
                    break;
                }
            }
        }
    }

    // 获取存储信息
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "df", "/data"], Some(5)).await {
        if result.success {
            let lines: Vec<&str> = result.output.lines().collect();
            if lines.len() > 1 {
                let data_line = lines[1];
                let parts: Vec<&str> = data_line.split_whitespace().collect();
                if parts.len() >= 4 {
                    if let Ok(available_kb) = parts[3].parse::<u64>() {
                        let available_mb = available_kb / 1024;
                        properties.available_storage = Some(format!("{} MB", available_mb));
                    }
                }
            }
        }
    }
    
    // 获取屏幕分辨率
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "wm", "size"], Some(5)).await {
        if result.success {
            for line in result.output.lines() {
                if line.contains("Physical size:") {
                    if let Some(size) = line.split(':').nth(1) {
                        properties.screen_resolution = Some(size.trim().to_string());
                        break;
                    }
                }
            }
        }
    }
    
    Ok(properties)
}

/// 执行ADB命令
#[tauri::command]
pub async fn execute_adb_command(
    serial: String,
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    let mut cmd_args = vec!["-s", &serial];
    cmd_args.push(&command);

    let string_args: Vec<String> = args.iter().map(|s| s.as_str()).collect::<Vec<&str>>().join(" ").split_whitespace().map(|s| s.to_string()).collect();
    let str_args: Vec<&str> = string_args.iter().map(|s| s.as_str()).collect();
    cmd_args.extend(str_args);

    utils_execute_adb_command(&cmd_args, timeout).await
}

/// 重启设备到指定模式
#[tauri::command]
pub async fn reboot_device(serial: String, mode: String) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    let reboot_args = match mode.as_str() {
        "system" => vec!["-s", &serial, "reboot"],
        "recovery" => vec!["-s", &serial, "reboot", "recovery"],
        "bootloader" | "fastboot" => vec!["-s", &serial, "reboot", "bootloader"],
        "sideload" => vec!["-s", &serial, "reboot", "sideload"],
        "edl" => vec!["-s", &serial, "reboot", "edl"],
        _ => return Err(HoutError::InvalidDeviceMode { mode }),
    };

    if device.is_adb_available() {
        utils_execute_adb_command(&reboot_args, Some(10)).await
    } else if device.is_fastboot_available() && mode == "system" {
        execute_fastboot_command(&["-s", &serial, "reboot"], Some(10)).await
    } else {
        Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        })
    }
}

/// 安装APK文件
#[tauri::command]
pub async fn install_apk(serial: String, apk_path: String, replace: bool) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let mut args = vec!["-s", &serial, "install"];
    if replace {
        args.push("-r");
    }
    args.push(&apk_path);

    utils_execute_adb_command(&args, Some(120)).await
}

/// 推送文件到设备
#[tauri::command]
pub async fn push_file(
    serial: String,
    local_path: String,
    remote_path: String,
) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
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
        return Err(HoutError::InvalidDeviceMode {
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
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let args = vec!["-s", &serial, "shell", "ls", "-la", &path];
    let result = utils_execute_adb_command(&args, Some(30)).await?;

    if !result.success {
        return Err(HoutError::CommandFailed {
            command: "ls".to_string(),
            error: result.error.unwrap_or_else(|| "Unknown error".to_string()),
        });
    }

    let mut files = Vec::new();
    for line in result.output.lines() {
        if line.trim().is_empty() || line.starts_with("total") {
            continue;
        }

        // 解析ls -la输出格式
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 9 {
            let permissions = parts[0].to_string();
            let is_directory = permissions.starts_with('d');
            let size = if is_directory { None } else { parts[4].parse().ok() };
            let name = parts[8..].join(" ");

            // 跳过 . 和 .. 目录
            if name == "." || name == ".." {
                continue;
            }

            let file_path = if path.ends_with('/') {
                format!("{}{}", path, name)
            } else {
                format!("{}/{}", path, name)
            };

            files.push(DeviceFile {
                name,
                path: file_path,
                is_directory,
                size,
                permissions: Some(permissions),
                modified_time: None, // 可以后续解析时间信息
            });
        }
    }

    Ok(files)
}

/// 获取已安装应用列表
#[tauri::command]
pub async fn get_installed_apps(serial: String, include_system: bool) -> Result<Vec<InstalledApp>> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let mut args = vec!["-s", &serial, "shell", "pm", "list", "packages"];
    if include_system {
        args.push("-s");
    } else {
        args.push("-3");
    }
    args.push("-f");

    let result = utils_execute_adb_command(&args, Some(30)).await?;

    if !result.success {
        return Err(HoutError::CommandFailed {
            command: "pm list packages".to_string(),
            error: result.error.unwrap_or_default(),
        });
    }

    let mut apps = Vec::new();
    for line in result.output.lines() {
        if let Some(app) = parse_package_line(line, &serial).await {
            apps.push(app);
        }
    }

    Ok(apps)
}

/// 卸载应用
#[tauri::command]
pub async fn uninstall_app(serial: String, package_name: String, keep_data: bool) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let mut args = vec!["-s", &serial, "uninstall"];
    if keep_data {
        args.push("-k");
    }
    args.push(&package_name);

    utils_execute_adb_command(&args, Some(60)).await
}

/// 获取APK文件信息
#[tauri::command]
pub async fn get_apk_info(apk_path: String) -> Result<ApkInfo> {
    use std::fs;
    use std::path::Path;

    let path = Path::new(&apk_path);
    if !path.exists() {
        return Err(HoutError::FileNotFound {
            path: apk_path,
        });
    }

    let file_size = fs::metadata(&apk_path)
        .map_err(|e| HoutError::IoError {
            message: format!("Failed to get file size: {}", e)
        })?
        .len();

    // 使用aapt获取APK信息
    let result = utils_execute_adb_command(&["shell", "aapt", "dump", "badging", &apk_path], Some(30)).await;

    let mut apk_info = ApkInfo {
        file_path: apk_path.clone(),
        package_name: None,
        app_name: None,
        version_name: None,
        version_code: None,
        min_sdk_version: None,
        target_sdk_version: None,
        compile_sdk_version: None,
        permissions: Vec::new(),
        features: Vec::new(),
        file_size,
        is_debuggable: false,
        is_test_only: false,
        icon_path: None,
    };

    if let Ok(result) = result {
        if result.success {
            parse_aapt_output(&result.output, &mut apk_info);
        }
    }

    Ok(apk_info)
}

/// 批量安装APK
#[tauri::command]
pub async fn batch_install_apks(
    serial: String,
    apk_paths: Vec<String>,
    replace_existing: bool
) -> Result<BatchOperation> {
    use uuid::Uuid;
    use chrono::Utc;
    use crate::device::{BatchOperationType, BatchOperationStatus, BatchOperationItem, InstallStatus};

    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let operation_id = Uuid::new_v4().to_string();
    let mut batch_operation = BatchOperation {
        id: operation_id,
        operation_type: BatchOperationType::Install,
        total_items: apk_paths.len(),
        completed_items: 0,
        failed_items: 0,
        status: BatchOperationStatus::Running,
        items: apk_paths.iter().map(|path| {
            let file_name = std::path::Path::new(path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown.apk")
                .to_string();

            BatchOperationItem {
                id: Uuid::new_v4().to_string(),
                name: file_name,
                status: InstallStatus::Pending,
                message: None,
            }
        }).collect(),
        start_time: Utc::now(),
        end_time: None,
    };

    // 执行批量安装
    for (index, apk_path) in apk_paths.iter().enumerate() {
        batch_operation.items[index].status = InstallStatus::Installing;

        let mut args = vec!["-s", &serial, "install"];
        if replace_existing {
            args.push("-r");
        }
        args.push(apk_path);

        let result = utils_execute_adb_command(&args, Some(120)).await;

        match result {
            Ok(cmd_result) => {
                if cmd_result.success {
                    batch_operation.items[index].status = InstallStatus::Success;
                    batch_operation.items[index].message = Some("安装成功".to_string());
                    batch_operation.completed_items += 1;
                } else {
                    batch_operation.items[index].status = InstallStatus::Failed;
                    batch_operation.items[index].message = Some(cmd_result.error.unwrap_or_default());
                    batch_operation.failed_items += 1;
                }
            }
            Err(e) => {
                batch_operation.items[index].status = InstallStatus::Failed;
                batch_operation.items[index].message = Some(format!("安装失败: {}", e));
                batch_operation.failed_items += 1;
            }
        }
    }

    batch_operation.status = if batch_operation.failed_items == 0 {
        BatchOperationStatus::Completed
    } else if batch_operation.completed_items == 0 {
        BatchOperationStatus::Failed
    } else {
        BatchOperationStatus::Completed
    };

    batch_operation.end_time = Some(Utc::now());

    Ok(batch_operation)
}

/// 批量卸载应用
#[tauri::command]
pub async fn batch_uninstall_apps(
    serial: String,
    package_names: Vec<String>,
    keep_data: bool
) -> Result<BatchOperation> {
    use uuid::Uuid;
    use chrono::Utc;
    use crate::device::{BatchOperationType, BatchOperationStatus, BatchOperationItem, InstallStatus};

    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(HoutError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let operation_id = Uuid::new_v4().to_string();
    let mut batch_operation = BatchOperation {
        id: operation_id,
        operation_type: BatchOperationType::Uninstall,
        total_items: package_names.len(),
        completed_items: 0,
        failed_items: 0,
        status: BatchOperationStatus::Running,
        items: package_names.iter().map(|package| {
            BatchOperationItem {
                id: Uuid::new_v4().to_string(),
                name: package.clone(),
                status: InstallStatus::Pending,
                message: None,
            }
        }).collect(),
        start_time: Utc::now(),
        end_time: None,
    };

    // 执行批量卸载
    for (index, package_name) in package_names.iter().enumerate() {
        batch_operation.items[index].status = InstallStatus::Installing; // 使用Installing表示正在处理

        let mut args = vec!["-s", &serial, "uninstall"];
        if keep_data {
            args.push("-k");
        }
        args.push(package_name);

        let result = utils_execute_adb_command(&args, Some(60)).await;

        match result {
            Ok(cmd_result) => {
                if cmd_result.success {
                    batch_operation.items[index].status = InstallStatus::Success;
                    batch_operation.items[index].message = Some("卸载成功".to_string());
                    batch_operation.completed_items += 1;
                } else {
                    batch_operation.items[index].status = InstallStatus::Failed;
                    batch_operation.items[index].message = Some(cmd_result.error.unwrap_or_default());
                    batch_operation.failed_items += 1;
                }
            }
            Err(e) => {
                batch_operation.items[index].status = InstallStatus::Failed;
                batch_operation.items[index].message = Some(format!("卸载失败: {}", e));
                batch_operation.failed_items += 1;
            }
        }
    }

    batch_operation.status = if batch_operation.failed_items == 0 {
        BatchOperationStatus::Completed
    } else if batch_operation.completed_items == 0 {
        BatchOperationStatus::Failed
    } else {
        BatchOperationStatus::Completed
    };

    batch_operation.end_time = Some(Utc::now());

    Ok(batch_operation)
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

/// 专门扫描Fastboot设备（用于调试）
#[tauri::command]
pub async fn scan_fastboot_devices() -> Result<CommandResult> {
    log::info!("Scanning fastboot devices for debugging...");
    let result = execute_fastboot_command(&["devices"], Some(10)).await?;

    log::info!("Fastboot devices result: success={}, output='{}', error={:?}",
        result.success, result.output, result.error);

    Ok(result)
}

/// 获取设备内存、存储和电池详细信息
#[tauri::command]
pub async fn get_device_memory_storage_info(serial: String) -> Result<serde_json::Value> {
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
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/proc/meminfo"], Some(10)).await {
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
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "df", "/data"], Some(10)).await {
        if result.success {
            let lines: Vec<&str> = result.output.lines().collect();
            if lines.len() > 1 {
                let data_line = lines[1];
                let parts: Vec<&str> = data_line.split_whitespace().collect();
                if parts.len() >= 4 {
                    if let (Ok(total_kb), Ok(used_kb), Ok(available_kb)) = (
                        parts[1].parse::<u64>(),
                        parts[2].parse::<u64>(),
                        parts[3].parse::<u64>()
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
    if let Ok(result) = utils_execute_adb_command(&["-s", &serial, "shell", "dumpsys", "battery"], Some(10)).await {
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
                        log::warn!("Calculated capacity {} mAh is out of reasonable range, ignoring", actual_capacity_mah);
                    }
                } else {
                    log::warn!("Invalid data for capacity calculation: counter={:?}, level={:?}", charge_counter_uah, battery_level);
                }
            }

            // 尝试获取设计容量信息（标称容量）
            if let Ok(capacity_result) = utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/sys/class/power_supply/battery/charge_full_design"], Some(5)).await {
                if capacity_result.success {
                    if let Ok(design_capacity) = capacity_result.output.trim().parse::<u32>() {
                        battery_design_capacity = Some(design_capacity / 1000); // 转换为mAh
                        log::info!("Found design capacity: {} mAh", design_capacity / 1000);
                    }
                }
            }

            // 如果没有获取到设计容量，尝试另一个路径
            if battery_design_capacity.is_none() {
                if let Ok(capacity_result) = utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/sys/class/power_supply/battery/charge_full"], Some(5)).await {
                    if capacity_result.success {
                        if let Ok(full_capacity) = capacity_result.output.trim().parse::<u32>() {
                            battery_design_capacity = Some(full_capacity / 1000); // 转换为mAh
                            log::info!("Found full capacity as design capacity: {} mAh", full_capacity / 1000);
                        }
                    }
                }
            }

            // 如果 Charge counter 方法失败，回退到传统方法获取实际容量
            if battery_actual_capacity.is_none() {
                log::info!("Charge counter method failed, falling back to traditional method");

                if let Ok(capacity_result) = utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/sys/class/power_supply/battery/charge_now"], Some(5)).await {
                    if capacity_result.success {
                        if let Ok(current_capacity) = capacity_result.output.trim().parse::<u32>() {
                            battery_actual_capacity = Some(current_capacity / 1000); // 转换为mAh
                            log::info!("Found current capacity (fallback): {} mAh", current_capacity / 1000);
                        }
                    }
                }
            }

            // 计算电池健康度百分比和状态
            let (battery_health_percent, health_calculation_method) = if let (Some(actual), Some(design)) = (battery_actual_capacity, battery_design_capacity) {
                if design > 0 {
                    let health_percent = ((actual as f64 / design as f64) * 100.0).round() as u32;
                    let limited_health = std::cmp::min(health_percent, 150); // 允许稍微超过100%，但限制在150%以内
                    let method = if charge_counter_uah.is_some() {
                        "Charge counter 计算"
                    } else {
                        "系统文件计算"
                    };
                    log::info!("Battery health calculated: {}% using method: {}", limited_health, method);
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
                let version_line = version_result.output
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

/// 解析包列表行
async fn parse_package_line(line: &str, serial: &str) -> Option<InstalledApp> {
    // 解析 "package:/data/app/com.example.app/base.apk=com.example.app" 格式
    if !line.starts_with("package:") {
        return None;
    }

    let parts: Vec<&str> = line.splitn(2, '=').collect();
    if parts.len() != 2 {
        return None;
    }

    let apk_path = parts[0].strip_prefix("package:")?;
    let package_name = parts[1].to_string();

    // 获取应用详细信息
    let mut app = InstalledApp {
        package_name: package_name.clone(),
        app_name: None,
        version_name: None,
        version_code: None,
        install_location: Some(apk_path.to_string()),
        is_system_app: apk_path.starts_with("/system/"),
        is_enabled: true,
        apk_path: Some(apk_path.to_string()),
        install_time: None,
        update_time: None,
        permissions: Vec::new(),
    };

    // 获取应用名称
    if let Ok(result) = utils_execute_adb_command(&[
        "-s", serial, "shell", "pm", "dump", &package_name
    ], Some(10)).await {
        if result.success {
            parse_package_dump(&result.output, &mut app);
        }
    }

    Some(app)
}

/// 解析包转储信息
fn parse_package_dump(output: &str, app: &mut InstalledApp) {
    for line in output.lines() {
        let line = line.trim();

        if line.starts_with("versionName=") {
            app.version_name = line.strip_prefix("versionName=").map(|s| s.to_string());
        } else if line.starts_with("versionCode=") {
            app.version_code = line.strip_prefix("versionCode=")
                .and_then(|s| s.split_whitespace().next())
                .map(|s| s.to_string());
        } else if line.starts_with("firstInstallTime=") {
            app.install_time = line.strip_prefix("firstInstallTime=").map(|s| s.to_string());
        } else if line.starts_with("lastUpdateTime=") {
            app.update_time = line.strip_prefix("lastUpdateTime=").map(|s| s.to_string());
        } else if line.starts_with("enabled=") {
            app.is_enabled = line.strip_prefix("enabled=")
                .map(|s| s == "true")
                .unwrap_or(true);
        }
    }
}

/// 解析aapt输出
fn parse_aapt_output(output: &str, apk_info: &mut ApkInfo) {
    for line in output.lines() {
        let line = line.trim();

        if line.starts_with("package: name='") {
            if let Some(end) = line.find("' versionCode='") {
                apk_info.package_name = Some(line[15..end].to_string());

                if let Some(version_start) = line.find("versionCode='") {
                    if let Some(version_end) = line[version_start + 13..].find('\'') {
                        apk_info.version_code = Some(line[version_start + 13..version_start + 13 + version_end].to_string());
                    }
                }

                if let Some(name_start) = line.find("versionName='") {
                    if let Some(name_end) = line[name_start + 13..].find('\'') {
                        apk_info.version_name = Some(line[name_start + 13..name_start + 13 + name_end].to_string());
                    }
                }
            }
        } else if line.starts_with("application-label:'") {
            if let Some(end) = line.rfind('\'') {
                apk_info.app_name = Some(line[19..end].to_string());
            }
        } else if line.starts_with("sdkVersion:'") {
            if let Some(end) = line.rfind('\'') {
                apk_info.min_sdk_version = Some(line[12..end].to_string());
            }
        } else if line.starts_with("targetSdkVersion:'") {
            if let Some(end) = line.rfind('\'') {
                apk_info.target_sdk_version = Some(line[18..end].to_string());
            }
        } else if line.starts_with("uses-permission: name='") {
            if let Some(end) = line[24..].find('\'') {
                apk_info.permissions.push(line[24..24 + end].to_string());
            }
        } else if line.starts_with("uses-feature: name='") {
            if let Some(end) = line[20..].find('\'') {
                apk_info.features.push(line[20..20 + end].to_string());
            }
        } else if line.contains("application-debuggable") {
            apk_info.is_debuggable = true;
        } else if line.contains("testOnly='true'") {
            apk_info.is_test_only = true;
        }
    }
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
        let app_data_dir = data_dir.join("HOUT").join("downloads");
        return Ok(app_data_dir);
    }

    // 最后回退到临时目录
    Ok(std::env::temp_dir().join("hout_downloads"))
}

/// 下载APK文件
#[tauri::command]
pub async fn download_apk(
    url: String,
    file_name: String,
    is_direct: bool,
) -> Result<String> {

    use tokio::fs;
    use tokio::io::AsyncWriteExt;

    // 创建下载目录
    let downloads_dir = get_app_downloads_dir()?;
    fs::create_dir_all(&downloads_dir).await
        .map_err(|e| HoutError::Io(format!("Failed to create downloads directory: {}", e)))?;

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
    let response = client.get(&download_url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(HoutError::Network(format!("Download failed with status: {}", response.status())));
    }

    let mut file = fs::File::create(&file_path).await
        .map_err(|e| HoutError::Io(format!("Failed to create file: {}", e)))?;

    let mut stream = response.bytes_stream();
    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| HoutError::Network(format!("Failed to read chunk: {}", e)))?;
        file.write_all(&chunk).await
            .map_err(|e| HoutError::Io(format!("Failed to write chunk: {}", e)))?;
    }

    file.flush().await
        .map_err(|e| HoutError::Io(format!("Failed to flush file: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// 获取重定向URL
async fn get_redirect_url(url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| HoutError::Network(format!("Failed to create HTTP client: {}", e)))?;

    let response = client.head(url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to send HEAD request: {}", e)))?;

    if response.status().is_redirection() {
        if let Some(location) = response.headers().get("location") {
            let redirect_url = location.to_str()
                .map_err(|e| HoutError::Network(format!("Invalid redirect URL: {}", e)))?;
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
    let response = client.head(&download_url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to get file info: {}", e)))?;

    if let Some(content_length) = response.headers().get("content-length") {
        let size_str = content_length.to_str()
            .map_err(|e| HoutError::Network(format!("Invalid content-length header: {}", e)))?;
        let size = size_str.parse::<u64>()
            .map_err(|e| HoutError::Network(format!("Failed to parse content-length: {}", e)))?;
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
    use tokio::fs;
    use tokio::io::AsyncWriteExt;
    use futures_util::StreamExt;

    log::info!("开始下载文件: {} -> {}", url, file_name);

    // 创建下载目录（按日期分类）
    let downloads_dir = get_app_downloads_dir()?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily_dir = downloads_dir.join(&today);
    fs::create_dir_all(&daily_dir).await
        .map_err(|e| HoutError::Io(format!("Failed to create downloads directory: {}", e)))?;

    // 生成文件路径
    let file_path = daily_dir.join(&file_name);

    // 开始下载
    let client = reqwest::Client::new();
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(HoutError::Network(format!("Download failed with status: {}", response.status())));
    }

    // 获取文件总大小
    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded_size = 0u64;

    // 创建文件
    let mut file = fs::File::create(&file_path).await
        .map_err(|e| HoutError::Io(format!("Failed to create file: {}", e)))?;

    // 下载文件流
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| HoutError::Network(format!("Failed to read chunk: {}", e)))?;

        // 写入文件
        file.write_all(&chunk).await
            .map_err(|e| HoutError::Io(format!("Failed to write chunk: {}", e)))?;

        // 更新进度
        downloaded_size += chunk.len() as u64;
        let progress = if total_size > 0 {
            (downloaded_size as f64 / total_size as f64 * 100.0) as u32
        } else {
            0
        };

        // 发送进度事件到前端
        let _ = window.emit("download-progress", serde_json::json!({
            "taskId": task_id,
            "progress": progress,
            "downloadedSize": downloaded_size,
            "totalSize": total_size
        }));
    }

    // 确保文件写入完成
    file.flush().await
        .map_err(|e| HoutError::Io(format!("Failed to flush file: {}", e)))?;

    log::info!("文件下载完成: {}", file_path.display());
    Ok(file_path.to_string_lossy().to_string())
}

/// 取消下载
#[tauri::command]
pub async fn cancel_download(task_id: String, window: tauri::Window) -> Result<()> {
    log::info!("取消下载任务: {}", task_id);

    // 发送取消事件到前端
    let _ = window.emit("download-cancelled", serde_json::json!({
        "taskId": task_id
    }));

    Ok(())
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
    use tokio::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    let downloads_dir = get_app_downloads_dir()?;
    if !downloads_dir.exists() {
        return Ok(0);
    }

    let cutoff_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() - (older_than_days * 24 * 60 * 60);

    let mut deleted_count = 0;
    let mut entries = fs::read_dir(&downloads_dir).await
        .map_err(|e| HoutError::Io(format!("Failed to read downloads directory: {}", e)))?;

    while let Some(entry) = entries.next_entry().await
        .map_err(|e| HoutError::Io(format!("Failed to read directory entry: {}", e)))? {

        let metadata = entry.metadata().await
            .map_err(|e| HoutError::Io(format!("Failed to get file metadata: {}", e)))?;

        if let Ok(modified) = metadata.modified() {
            if let Ok(modified_secs) = modified.duration_since(UNIX_EPOCH) {
                if modified_secs.as_secs() < cutoff_time {
                    if metadata.is_file() {
                        fs::remove_file(entry.path()).await
                            .map_err(|e| HoutError::Io(format!("Failed to delete file: {}", e)))?;
                        deleted_count += 1;
                    } else if metadata.is_dir() {
                        fs::remove_dir_all(entry.path()).await
                            .map_err(|e| HoutError::Io(format!("Failed to delete directory: {}", e)))?;
                        deleted_count += 1;
                    }
                }
            }
        }
    }

    Ok(deleted_count)
}

// ==================== 投屏相关命令 ====================

/// 检查设备是否支持投屏
#[tauri::command]
pub async fn check_screen_mirror_support(device_serial: String) -> Result<ScreenMirrorDevice> {
    log::info!("Checking screen mirror support for device: {}", device_serial);

    // 检查设备连接状态
    let devices = scan_devices().await?;
    let device = devices.iter()
        .find(|d| d.serial == device_serial)
        .ok_or_else(|| HoutError::Device(format!("Device {} not found", device_serial)))?;

    if !device.connected {
        return Err(HoutError::Device(format!("Device {} is not connected", device_serial)));
    }

    // 只获取Android版本信息（轻量级检查）
    let android_version = match utils_execute_adb_command(&["-s", &device_serial, "shell", "getprop", "ro.build.version.release"], Some(5)).await {
        Ok(result) if result.success => {
            let version = result.output.trim().to_string();
            log::info!("Got Android version for device {}: {}", device_serial, version);
            version
        },
        Ok(result) => {
            log::error!("ADB command failed for device {}: {}", device_serial, result.output);
            return Ok(ScreenMirrorDevice {
                serial: device_serial,
                name: None,
                model: None,
                resolution: None,
                density: None,
                orientation: None,
                is_supported: false,
                supported_codecs: vec![],
            });
        },
        Err(e) => {
            log::error!("ADB command error for device {}: {}", device_serial, e);
            return Ok(ScreenMirrorDevice {
                serial: device_serial,
                name: None,
                model: None,
                resolution: None,
                density: None,
                orientation: None,
                is_supported: false,
                supported_codecs: vec![],
            });
        }
    };

    // 检查Android版本（scrcpy需要Android 5.0+）
    let is_supported = if android_version.is_empty() {
        false
    } else {
        // 解析版本号，支持主版本号 >= 5 的设备
        match android_version.split('.').next().and_then(|v| v.parse::<i32>().ok()) {
            Some(major_version) => major_version >= 5,
            None => false,
        }
    };

    // 获取屏幕分辨率
    let resolution = get_device_resolution(&device_serial).await.unwrap_or_default();

    Ok(ScreenMirrorDevice {
        serial: device_serial,
        name: None, // 暂时不获取详细信息，提高性能
        model: None,
        resolution: if resolution.is_empty() { None } else { Some(resolution) },
        density: None,
        orientation: None, // 需要实时获取
        is_supported,
        supported_codecs: vec!["h264".to_string()], // 默认支持h264
    })
}

/// 获取设备屏幕分辨率
async fn get_device_resolution(device_serial: &str) -> Result<String> {
    let result = utils_execute_adb_command(
        &["-s", device_serial, "shell", "wm", "size"],
        Some(10)
    ).await?;

    if result.success {
        // 解析输出，格式通常是 "Physical size: 1080x2340"
        for line in result.output.lines() {
            if line.contains("Physical size:") {
                if let Some(size) = line.split(':').nth(1) {
                    return Ok(size.trim().to_string());
                }
            }
        }
    }

    Ok(String::new())
}

/// 开始投屏
#[tauri::command]
pub async fn start_screen_mirror(device_serial: String, config: ScreenMirrorConfig) -> Result<ScreenMirrorSession> {
    log::info!("Starting screen mirror for device: {}", device_serial);

    // 检查设备支持
    let device = check_screen_mirror_support(device_serial.clone()).await?;
    if !device.is_supported {
        return Err(HoutError::Device("Device does not support screen mirroring".to_string()));
    }

    // 创建会话
    let mut session = ScreenMirrorSession::new(device_serial.clone(), config.clone());
    session.device_name = device.name;
    session.start();

    // 构建scrcpy命令
    let mut args = vec![
        "-s".to_string(),
        device_serial,
        "--max-size".to_string(),
        extract_resolution_number(&config.quality.resolution),
        "--video-bit-rate".to_string(),
        format!("{}M", config.quality.bitrate),
        "--max-fps".to_string(),
        config.quality.framerate.to_string(),

    ];

    // 添加其他选项
    if config.show_touches {
        args.push("--show-touches".to_string());
    }

    if config.stay_awake {
        args.push("--stay-awake".to_string());
    }

    if config.turn_screen_off {
        args.push("--turn-screen-off".to_string());
    }

    if !config.control_enabled {
        args.push("--no-control".to_string());
    }

    if !config.audio_enabled {
        args.push("--no-audio".to_string());
    }



    // 启动scrcpy进程
    match start_scrcpy_process(&args).await {
        Ok(process_id) => {
            session.set_connected(process_id, 8080); // 默认端口
            session.set_streaming();
            log::info!("Screen mirror started successfully with PID: {}", process_id);
            Ok(session)
        }
        Err(e) => {
            session.set_error(format!("Failed to start scrcpy: {}", e));
            Err(e)
        }
    }
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
    log::info!("Processing activation request for user: {}", request.user_config.username);

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
    use base64::{Engine as _, engine::general_purpose};
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
    log::info!("Saving app config for user: {}", config.user_config.username);
    // 这里应该将配置保存到本地存储
    // 暂时返回true表示保存成功
    Ok(true)
}

/// 停止投屏
#[tauri::command]
pub async fn stop_screen_mirror(session_id: String) -> Result<bool> {
    log::info!("Stopping screen mirror session: {}", session_id);

    // 这里应该从会话管理器中获取会话信息
    // 暂时返回成功，实际实现需要进程管理

    // TODO: 实现进程终止逻辑
    // 1. 根据session_id查找对应的进程ID
    // 2. 终止scrcpy进程
    // 3. 清理资源

    Ok(true)
}

/// 启动scrcpy进程
async fn start_scrcpy_process(args: &[String]) -> Result<u32> {
    use std::process::Command;

    // 检查scrcpy是否可用
    let scrcpy_path = find_scrcpy_executable()?;

    log::info!("Starting scrcpy with args: {:?}", args);

    // 启动进程
    let mut cmd = Command::new(&scrcpy_path);
    cmd.args(args);

    // 在Windows上隐藏命令行窗口
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match cmd.spawn() {
        Ok(child) => {
            let pid = child.id();
            log::info!("scrcpy process started with PID: {}", pid);
            Ok(pid)
        }
        Err(e) => {
            log::error!("Failed to start scrcpy process: {}", e);
            Err(HoutError::Process(format!("Failed to start scrcpy: {}", e)))
        }
    }
}

/// 查找scrcpy可执行文件
fn find_scrcpy_executable() -> Result<String> {
    log::info!("Searching for scrcpy executable...");

    // 1. 优先检查项目根目录下的 scrcpy
    if let Ok(project_scrcpy_path) = find_project_scrcpy() {
        log::info!("Found scrcpy in project directory: {}", project_scrcpy_path);
        return Ok(project_scrcpy_path);
    }

    // 2. 检查应用程序资源目录
    let exe_dir = std::env::current_exe()
        .map_err(|e| HoutError::Io(format!("Failed to get executable directory: {}", e)))?
        .parent()
        .ok_or_else(|| HoutError::Io("Failed to get parent directory".to_string()))?
        .to_path_buf();

    let scrcpy_path = exe_dir.join("scrcpy.exe");
    if scrcpy_path.exists() {
        log::info!("Found scrcpy in executable directory: {}", scrcpy_path.display());
        return Ok(scrcpy_path.to_string_lossy().to_string());
    }

    // 3. 最后检查系统PATH中是否有scrcpy
    {
        let mut cmd = std::process::Command::new("where");
        cmd.arg("scrcpy");

        // 在Windows上隐藏命令行窗口
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        if let Ok(output) = cmd.output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    log::info!("Found scrcpy in system PATH: {}", path);
                    return Ok(path);
                }
            }
        }
    }

    Err(HoutError::Tool("scrcpy not found. Please install scrcpy or place it in the project directory.".to_string()))
}

/// 查找项目根目录下的 scrcpy
fn find_project_scrcpy() -> Result<String> {
    // 获取当前可执行文件路径
    let exe_path = std::env::current_exe()
        .map_err(|e| HoutError::Io(format!("Failed to get executable path: {}", e)))?;

    let mut current_dir = exe_path.parent()
        .ok_or_else(|| HoutError::Io("Failed to get parent directory".to_string()))?;

    // 向上查找项目根目录（包含 package.json 的目录）
    for _ in 0..10 { // 最多向上查找10级目录
        // 检查是否是项目根目录（包含 package.json 或 src-tauri 目录）
        let package_json = current_dir.join("package.json");
        let src_tauri = current_dir.join("src-tauri");

        if package_json.exists() || src_tauri.exists() {
            // 找到项目根目录，检查 scrcpy 的可能位置
            let scrcpy_locations = [
                // 直接在根目录
                current_dir.join("scrcpy.exe"),
                // 在 scrcpy-win32 目录
                current_dir.join("scrcpy-win32-v3.3.1").join("scrcpy.exe"),
                // 在 scrcpy-win64 目录
                current_dir.join("scrcpy-win64-v3.3.1").join("scrcpy.exe"),
                // 在 scrcpy 目录
                current_dir.join("scrcpy").join("scrcpy.exe"),
                // 在 tools 目录
                current_dir.join("tools").join("scrcpy.exe"),
                current_dir.join("tools").join("scrcpy").join("scrcpy.exe"),
            ];

            for scrcpy_path in &scrcpy_locations {
                if scrcpy_path.exists() {
                    log::info!("Found scrcpy at: {}", scrcpy_path.display());
                    return Ok(scrcpy_path.to_string_lossy().to_string());
                }
            }

            // 如果在项目根目录但没找到 scrcpy，记录日志并继续
            log::warn!("Found project root at {} but no scrcpy executable found", current_dir.display());
            break;
        }

        // 向上一级目录
        if let Some(parent) = current_dir.parent() {
            current_dir = parent;
        } else {
            break;
        }
    }

    Err(HoutError::Tool("scrcpy not found in project directory".to_string()))
}

/// 从分辨率字符串中提取数字（用于scrcpy的max-size参数）
fn extract_resolution_number(resolution: &str) -> String {
    if resolution == "auto" {
        return "0".to_string(); // scrcpy中0表示不限制
    }

    // 从 "1920x1080" 格式中提取较大的数字
    if let Some(x_pos) = resolution.find('x') {
        let width: u32 = resolution[..x_pos].parse().unwrap_or(0);
        let height: u32 = resolution[x_pos + 1..].parse().unwrap_or(0);
        return width.max(height).to_string();
    }

    "1080".to_string() // 默认值
}

// ==================== 安全配置相关命令 ====================

/// 安全配置结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub api_base_url: String,
    pub api_key: String,
    pub app_id: String,
    pub app_secret: String,
    pub signature_secret: String,
    pub enable_signature: bool,
    pub enable_strict_user_agent: bool,
}

/// 获取安全配置
#[tauri::command]
pub async fn get_security_config() -> Result<SecurityConfig> {
    log::info!("Getting security configuration");

    // 在生产环境中，这些配置应该从安全的存储位置读取
    // 例如：加密的配置文件、系统密钥库等
    let config = SecurityConfig {
        api_base_url: "https://api-g.lacs.cc".to_string(), // 正确的API地址
        api_key: "7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e".to_string(),
        app_id: "wanjiguanjia-desktop-v1.0.0".to_string(),
        app_secret: "wjgj_2024_secure_app_secret_key_for_user_behavior_stats".to_string(),
        signature_secret: "signature_secret_2024_wanjiguanjia_user_behavior_api_protection".to_string(),
        enable_signature: false, // 开发环境暂时禁用
        enable_strict_user_agent: false, // 开发环境暂时禁用
    };

    log::info!("Security configuration loaded successfully");
    Ok(config)
}

/// 验证安全配置
#[tauri::command]
pub async fn validate_security_config() -> Result<bool> {
    log::info!("Validating security configuration");

    match get_security_config().await {
        Ok(config) => {
            // 验证配置完整性
            if config.api_key.len() < 32 {
                log::error!("API key is too weak");
                return Ok(false);
            }

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

/// 打开开发者工具（仅在调试模式下可用）
#[tauri::command]
pub async fn open_devtools(app: tauri::AppHandle) -> Result<()> {
    #[cfg(debug_assertions)]
    {
        if let Some(window) = app.get_webview_window("main") {
            window.open_devtools();
            log::info!("开发者工具已打开");
            Ok(())
        } else {
            log::error!("无法找到主窗口");
            Err(HoutError::FileOperationFailed { message: "无法找到主窗口".to_string() })
        }
    }

    #[cfg(not(debug_assertions))]
    {
        log::warn!("开发者工具在生产模式下不可用");
        Err(HoutError::FileOperationFailed { message: "开发者工具在生产模式下不可用".to_string() })
    }
}

/// 检查是否为调试模式
#[tauri::command]
pub async fn is_debug_mode() -> Result<bool> {
    Ok(cfg!(debug_assertions))
}

/// 获取应用环境信息
#[tauri::command]
pub async fn get_app_environment() -> Result<serde_json::Value> {
    let mut env_info = serde_json::Map::new();

    env_info.insert("debug_mode".to_string(), serde_json::Value::Bool(cfg!(debug_assertions)));
    env_info.insert("platform".to_string(), serde_json::Value::String(std::env::consts::OS.to_string()));
    env_info.insert("arch".to_string(), serde_json::Value::String(std::env::consts::ARCH.to_string()));
    env_info.insert("family".to_string(), serde_json::Value::String(std::env::consts::FAMILY.to_string()));

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
    let result_path = download_manager.download_and_extract(&app_handle, request).await?;
    Ok(result_path.to_string_lossy().to_string())
}

/// 获取默认下载目录（使用应用程序目录下的downloads）
#[tauri::command]
pub async fn get_default_download_directory() -> Result<String> {
    // 使用应用程序目录下的downloads文件夹
    let app_downloads_dir = get_app_downloads_dir()?;

    // 确保目录存在
    std::fs::create_dir_all(&app_downloads_dir)
        .map_err(|e| HoutError::IoError { message: e.to_string() })?;

    Ok(app_downloads_dir.to_string_lossy().to_string())
}

/// 打开文件夹
#[tauri::command]
pub async fn open_folder(path: String) -> Result<()> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err(HoutError::FileNotFound { path: path.to_string_lossy().to_string() });
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| HoutError::Process(e.to_string()))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| HoutError::Process(e.to_string()))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| HoutError::Process(e.to_string()))?;
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
        std::fs::remove_file(path)
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;
    } else if path.is_dir() {
        std::fs::remove_dir_all(path)
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;
    }

    Ok(())
}
