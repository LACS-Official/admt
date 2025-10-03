use crate::device::{
    BatchOperation, BatchOperationItem, BatchOperationStatus, BatchOperationType, CommandResult,
    InstallStatus, InstalledApp, ApkInfo,
};
use crate::error::{AdmtError, Result};
use crate::utils::execute_adb_command as utils_execute_adb_command;
use crate::adb::device::device_info::get_device_info;
use chrono::Utc;

use std::fs;
use std::path::Path;
use uuid::Uuid;

/// 获取已安装应用列表
#[tauri::command]
pub async fn get_installed_apps(serial: String, include_system: bool) -> Result<Vec<InstalledApp>> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
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
        return Err(AdmtError::CommandFailed {
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
        return Err(AdmtError::InvalidDeviceMode {
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
    let path = Path::new(&apk_path);
    if !path.exists() {
        return Err(AdmtError::FileNotFound { path: apk_path });
    }

    let file_size = fs::metadata(&apk_path)
        .map_err(|e| AdmtError::IoError {
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
        return Err(AdmtError::InvalidDeviceMode {
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
        return Err(AdmtError::InvalidDeviceMode {
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

/// 解析包信息输出
fn parse_package_dump(output: &str, app: &mut InstalledApp) {
    for line in output.lines() {
        if line.starts_with("versionName=") {
            app.version_name = Some(line.trim_start_matches("versionName=").to_string());
        } else if line.starts_with("versionCode=") {
            app.version_code = Some(line.trim_start_matches("versionCode=").to_string());
        } else if line.starts_with("applicationInfo:") {
            // 解析应用信息
            let parts: Vec<&str> = line.split_whitespace().collect();
            for part in parts {
                if part.starts_with("label=") {
                    if let Some(label) = part.strip_prefix("label=") {
                        // 移除可能的引号
                        let label = label.trim_matches('"');
                        if !label.is_empty() {
                            app.app_name = Some(label.to_string());
                        }
                    }
                } else if part.starts_with("enabled=") {
                    if let Some(enabled) = part.strip_prefix("enabled=") {
                        app.is_enabled = enabled == "true";
                    }
                }
            }
        } else if line.starts_with("install permissions:") {
            // 解析权限信息
            let mut in_permissions = false;
            for perm_line in output.lines() {
                if perm_line.starts_with("install permissions:") {
                    in_permissions = true;
                    continue;
                } else if perm_line.is_empty() && in_permissions {
                    break;
                } else if in_permissions && perm_line.starts_with("  ") {
                    let perm = perm_line.trim();
                    if !perm.is_empty() {
                        app.permissions.push(perm.to_string());
                    }
                }
            }
        } else if line.starts_with("firstInstallTime=") {
            app.install_time = Some(line.trim_start_matches("firstInstallTime=").to_string());
        } else if line.starts_with("lastUpdateTime=") {
            app.update_time = Some(line.trim_start_matches("lastUpdateTime=").to_string());
        }
    }
}

/// 解析AAPT输出
fn parse_aapt_output(output: &str, apk_info: &mut ApkInfo) {
    for line in output.lines() {
        if line.starts_with("package: name=") {
            // 解析包名
            if let Some(name_part) = line.split("name=").nth(1) {
                if let Some(name) = name_part.split('\'').nth(1) {
                    apk_info.package_name = Some(name.to_string());
                }
            }
            
            // 解析版本信息
            if let Some(version_part) = line.split("versionName=").nth(1) {
                if let Some(version) = version_part.split('\'').nth(1) {
                    apk_info.version_name = Some(version.to_string());
                }
            }
            
            if let Some(code_part) = line.split("versionCode=").nth(1) {
                if let Some(code) = code_part.split('\'').nth(1) {
                    apk_info.version_code = Some(code.to_string());
                }
            }
        } else if line.starts_with("sdkVersion:") {
            // 解析SDK版本
            if let Some(sdk) = line.split(':').nth(1) {
                apk_info.min_sdk_version = Some(sdk.trim().to_string());
            }
        } else if line.starts_with("targetSdkVersion:") {
            // 解析目标SDK版本
            if let Some(sdk) = line.split(':').nth(1) {
                apk_info.target_sdk_version = Some(sdk.trim().to_string());
            }
        } else if line.starts_with("uses-permission:") {
            // 解析权限
            if let Some(perm) = line.split("name=").nth(1) {
                if let Some(permission) = perm.split('\'').nth(1) {
                    apk_info.permissions.push(permission.to_string());
                }
            }
        } else if line.starts_with("uses-feature:") {
            // 解析特性
            if let Some(feature) = line.split("name=").nth(1) {
                if let Some(feat) = feature.split('\'').nth(1) {
                    apk_info.features.push(feat.to_string());
                }
            }
        } else if line.starts_with("application-label:") {
            // 解析应用标签
            if let Some(label) = line.split(':').nth(1) {
                apk_info.app_name = Some(label.trim().to_string());
            }
        } else if line.starts_with("application-debuggable") {
            // 检查是否可调试
            apk_info.is_debuggable = true;
        } else if line.starts_with("application: testOnly=") {
            // 检查是否仅测试
            if let Some(test_only) = line.split('=').nth(1) {
                apk_info.is_test_only = test_only.trim() == "true";
            }
        } else if line.starts_with("application-icon-160:") {
            // 解析图标路径
            if let Some(icon) = line.split(':').nth(1) {
                apk_info.icon_path = Some(icon.trim().to_string());
            }
        }
    }
}