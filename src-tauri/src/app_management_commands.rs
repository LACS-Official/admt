use crate::device::{
    ApkInfo, BatchOperation, BatchOperationItem, BatchOperationStatus, BatchOperationType,
    CommandResult, DeviceInfo, InstallStatus, InstalledApp,
};
use crate::error::{HoutError, Result};
use crate::utils::execute_adb_command as utils_execute_adb_command;
use chrono::Utc;
use uuid::Uuid;

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
pub async fn uninstall_app(
    serial: String,
    package_name: String,
    keep_data: bool,
) -> Result<CommandResult> {
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
        return Err(HoutError::FileNotFound { path: apk_path });
    }

    let file_size = fs::metadata(&apk_path)
        .map_err(|e| HoutError::IoError {
            message: format!("Failed to get file size: {}", e),
        })?
        .len();

    // 使用aapt获取APK信息
    let result =
        utils_execute_adb_command(&["shell", "aapt", "dump", "badging", &apk_path], Some(30)).await;

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
    replace_existing: bool,
) -> Result<BatchOperation> {
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
        items: apk_paths
            .iter()
            .map(|path| {
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
            })
            .collect(),
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
                    batch_operation.items[index].message =
                        Some(cmd_result.error.unwrap_or_default());
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
    keep_data: bool,
) -> Result<BatchOperation> {
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
        items: package_names
            .iter()
            .map(|package| BatchOperationItem {
                id: Uuid::new_v4().to_string(),
                name: package.clone(),
                status: InstallStatus::Pending,
                message: None,
            })
            .collect(),
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
                    batch_operation.items[index].message =
                        Some(cmd_result.error.unwrap_or_default());
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
    if let Ok(result) = utils_execute_adb_command(
        &["-s", serial, "shell", "pm", "dump", &package_name],
        Some(10),
    )
    .await
    {
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
            app.version_code = line
                .strip_prefix("versionCode=")
                .and_then(|s| s.split_whitespace().next())
                .map(|s| s.to_string());
        } else if line.starts_with("firstInstallTime=") {
            app.install_time = line
                .strip_prefix("firstInstallTime=")
                .map(|s| s.to_string());
        } else if line.starts_with("lastUpdateTime=") {
            app.update_time = line.strip_prefix("lastUpdateTime=").map(|s| s.to_string());
        } else if line.starts_with("enabled=") {
            app.is_enabled = line
                .strip_prefix("enabled=")
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
                        apk_info.version_code = Some(
                            line[version_start + 13..version_start + 13 + version_end].to_string(),
                        );
                    }
                }

                if let Some(name_start) = line.find("versionName='") {
                    if let Some(name_end) = line[name_start + 13..].find('\'') {
                        apk_info.version_name =
                            Some(line[name_start + 13..name_start + 13 + name_end].to_string());
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

/// 获取设备信息（内部函数）
async fn get_device_info(serial: String) -> Result<DeviceInfo> {
    use crate::commands::scan_devices;
    
    // 首先验证设备是否存在
    let devices = scan_devices().await?;
    let device = devices
        .into_iter()
        .find(|d| d.serial == serial)
        .ok_or_else(|| HoutError::DeviceNotFound {
            serial: serial.clone(),
        })?;

    if device.mode == crate::device::DeviceMode::Unauthorized {
        return Err(HoutError::DeviceUnauthorized { serial });
    }

    Ok(device)
}