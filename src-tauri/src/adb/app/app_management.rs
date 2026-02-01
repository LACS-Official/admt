use crate::adb::device::device_info::get_device_info;
use crate::device::{
    ApkInfo, BatchOperation, BatchOperationItem, BatchOperationStatus, BatchOperationType,
    CommandResult, InstallStatus, InstalledApp,
};
use crate::error::{AdmtError, Result};
use crate::utils::execute_adb_command as utils_execute_adb_command;
use chrono::Utc;
use uuid::Uuid;


/// 获取已安装应用列表（分批加载版本）
#[tauri::command]
pub async fn get_installed_apps_batch(
    serial: String,
    include_system: bool,
    batch_size: usize,
    batch_index: usize,
) -> Result<(Vec<InstalledApp>, usize)> {
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

    let lines: Vec<&str> = result.output.lines().collect();
    let total_count = lines.len();

    // 计算当前批次的起始和结束索引
    let start_index = batch_index * batch_size;
    let end_index = std::cmp::min(start_index + batch_size, total_count);

    let mut apps = Vec::new();

    // 处理当前批次的应用
    for i in start_index..end_index {
        let line = lines[i];
        if line.starts_with("package:") {
            // 解析包名和APK路径
            if let Some(last_equals_pos) = line.rfind('=') {
                let package_name = line[last_equals_pos + 1..].to_string();
                let apk_path = line["package:".len()..last_equals_pos].to_string();

                // 创建基本应用信息
                let mut app = InstalledApp {
                    package_name: package_name.clone(),
                    version_name: None,
                    version_code: None,
                    install_location: Some(apk_path.clone()),
                    is_system_app: apk_path.starts_with("/system/"),
                    is_enabled: true,
                    apk_path: Some(apk_path.clone()),
                    install_time: None,
                    update_time: None,
                    permissions: Vec::new(),
                };

                // 批量获取应用详细信息，减少ADB命令调用次数
                // 使用一个命令获取多个应用的详细信息
                if i == start_index || i % 10 == 0 {
                    // 每10个应用获取一次详细信息
                    if let Ok(result) = utils_execute_adb_command(
                        &["-s", &serial, "shell", "dumpsys", "package", &package_name],
                        Some(5), // 减少超时时间
                    )
                    .await
                    {
                        if result.success {
                            parse_package_dump(&result.output, &mut app);
                        }
                    }
                } else {
                    // 对于其他应用，只获取基本信息，不调用dumpsys
                    // 这样可以大幅减少ADB命令调用次数
                    app.is_system_app = apk_path.starts_with("/system/");
                }

                apps.push(app);
            }
        }
    }

    Ok((apps, total_count))
}

/// 批量获取应用详细信息（优化版本）
#[tauri::command]
pub async fn get_batch_app_details(
    serial: String,
    package_names: Vec<String>,
) -> Result<Vec<InstalledApp>> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    let mut apps = Vec::new();

    // 分批处理，每批最多10个应用
    for chunk in package_names.chunks(10) {
        // 构建一个命令来获取多个应用的详细信息
        let mut script = String::new();
        for pkg in chunk {
            script.push_str(&format!("echo '===START_DUMP:{}==='; ", pkg));
            script.push_str(&format!("dumpsys package {}; ", pkg));
            script.push_str(&format!("echo '===END_DUMP:{}==='; ", pkg));
        }

        let args = ["-s", &serial, "shell", &script];

        if let Ok(result) = utils_execute_adb_command(&args, Some(15)).await {
            if result.success {
                // 解析批量获取的应用信息
                let output = result.output;
                for pkg in chunk {
                    // 查找当前应用的dump信息
                    let start_marker = format!("===START_DUMP:{}===", pkg);
                    let end_marker = format!("===END_DUMP:{}===", pkg);

                    if let Some(start) = output.find(&start_marker) {
                        if let Some(end) = output[start..].find(&end_marker) {
                            let dump_content = &output[start + start_marker.len()..start + end];

                            // 创建基本应用信息
                            let mut app = InstalledApp {
                                package_name: pkg.clone(),
                                version_name: None,
                                version_code: None,
                                install_location: None,
                                is_system_app: false,
                                is_enabled: true,
                                apk_path: None,
                                install_time: None,
                                update_time: None,
                                permissions: Vec::new(),
                            };

                            // 解析应用详细信息
                            parse_package_dump(dump_content, &mut app);
                            apps.push(app);
                        }
                    }
                }
            }
        }
    }

    Ok(apps)
}

/// 获取已安装应用列表（优化版本）
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
    let mut package_names = Vec::new();

    // 第一阶段：收集所有包名和基本信息
    for line in result.output.lines() {
        if line.starts_with("package:") {
            if let Some(last_equals_pos) = line.rfind('=') {
                let package_name = line[last_equals_pos + 1..].to_string();
                let apk_path = line["package:".len()..last_equals_pos].to_string();

                // 创建基本应用信息
                let app = InstalledApp {
                    package_name: package_name.clone(),
                    version_name: None,
                    version_code: None,
                    install_location: Some(apk_path.clone()),
                    is_system_app: apk_path.starts_with("/system/"),
                    is_enabled: true,
                    apk_path: Some(apk_path.clone()),
                    install_time: None,
                    update_time: None,
                    permissions: Vec::new(),
                };

                apps.push(app);
                package_names.push(package_name);
            }
        }
    }

    // 第二阶段：批量获取应用详细信息
    if !package_names.is_empty() {
        if let Ok(detailed_apps) = get_batch_app_details(serial, package_names).await {
            // 将详细信息合并到应用列表中
            for detailed_app in detailed_apps {
                if let Some(app) = apps
                    .iter_mut()
                    .find(|a| a.package_name == detailed_app.package_name)
                {
                    // 更新详细信息
                    app.version_name = detailed_app.version_name;
                    app.version_code = detailed_app.version_code;
                    app.is_enabled = detailed_app.is_enabled;
                    app.install_time = detailed_app.install_time;
                    app.update_time = detailed_app.update_time;
                    app.permissions = detailed_app.permissions;
                }
            }
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

/// 安装APK
#[tauri::command]
pub async fn install_apk(serial: String, apk_path: String, replace: bool) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
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

/// 获取APK信息
#[tauri::command]
pub async fn get_apk_info(serial: String, apk_path: String) -> Result<ApkInfo> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    // 先推送APK文件到设备
    let remote_path = format!("/data/local/tmp/{}.apk", uuid::Uuid::new_v4());
    let push_args = ["-s", &serial, "push", &apk_path, &remote_path];
    let push_result = utils_execute_adb_command(&push_args, Some(60)).await?;

    if !push_result.success {
        return Err(AdmtError::CommandFailed {
            command: "adb push".to_string(),
            error: push_result.error.unwrap_or_default(),
        });
    }

    // 获取APK信息
    let dump_args = [
        "-s",
        &serial,
        "shell",
        "aapt",
        "dump",
        "badging",
        &remote_path,
    ];
    let dump_result = utils_execute_adb_command(&dump_args, Some(30)).await?;

    // 清理临时文件
    let clean_args = ["-s", &serial, "shell", "rm", &remote_path];
    let _ = utils_execute_adb_command(&clean_args, Some(10)).await;

    if !dump_result.success {
        return Err(AdmtError::CommandFailed {
            command: "aapt dump badging".to_string(),
            error: dump_result.error.unwrap_or_default(),
        });
    }

    let mut apk_info = ApkInfo {
        file_path: apk_path.clone(),
        package_name: None,
        version_name: None,
        version_code: None,
        min_sdk_version: None,
        target_sdk_version: None,
        compile_sdk_version: None,
        permissions: Vec::new(),
        features: Vec::new(),
        file_size: 0,
        is_debuggable: false,
        is_test_only: false,
        icon_path: None,
    };

    parse_aapt_output(&dump_result.output, &mut apk_info);

    Ok(apk_info)
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

/// 批量安装APK
#[tauri::command]
pub async fn batch_install_apks(serial: String, apk_paths: Vec<String>) -> Result<BatchOperation> {
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
            .map(|apk_path| BatchOperationItem {
                id: Uuid::new_v4().to_string(),
                name: apk_path.clone(),
                status: InstallStatus::Pending,
                message: None,
            })
            .collect(),
        start_time: Utc::now(),
        end_time: None,
    };

    // 执行批量安装
    for (index, apk_path) in apk_paths.iter().enumerate() {
        batch_operation.items[index].status = InstallStatus::Installing; // 使用Installing表示正在处理

        let result = install_apk(serial.clone(), apk_path.clone(), true).await;

        match result {
            Ok(op_result) => {
                if op_result.success {
                    batch_operation.items[index].status = InstallStatus::Success;
                    batch_operation.items[index].message = Some(format!("安装成功: {}", apk_path));
                    batch_operation.completed_items += 1;
                } else {
                    batch_operation.items[index].status = InstallStatus::Failed;
                    batch_operation.items[index].message = Some(format!("安装失败: {}", apk_path));
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

/// 解析包列表行
#[allow(dead_code)]
async fn parse_package_line(line: &str, serial: &str) -> Option<InstalledApp> {
    // 解析各种格式的包列表行，包名始终是每一行最后一个等号(=)后面的字符串
    // 例如：
    // - "package:/data/app/MiShop/MiShop.apk=com.xiaomi.shop"
    // - "package:/data/app/com.ss.android.ugc.aweme_15/com.ss.android.ugc.aweme_15.apk=com.ss.android.ugc.aweme"
    // - "package:/data/app/~~eZRQwTTL2-CwMI3E2wLWqQ==/io.github.vvb2060.magisk-qNSUscO1eMB1xkl46MUfxA==/base.apk=io.github.vvb2060.magisk"
    if !line.starts_with("package:") {
        return None;
    }

    // 找到最后一个等号的位置
    let last_equals_pos = line.rfind('=')?;
    let package_name = line[last_equals_pos + 1..].to_string();
    let apk_path = line["package:".len()..last_equals_pos].to_string();

    // 获取应用详细信息
    let mut app = InstalledApp {
        package_name: package_name.clone(),
        version_name: None,
        version_code: None,
        install_location: Some(apk_path.clone()),
        is_system_app: apk_path.starts_with("/system/"),
        is_enabled: true,
        apk_path: Some(apk_path.clone()),
        install_time: None,
        update_time: None,
        permissions: Vec::new(),
    };

    // 获取应用名称和版本信息
    if let Ok(result) = utils_execute_adb_command(
        &["-s", serial, "shell", "dumpsys", "package", &package_name],
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
        if line.contains("versionName=") {
            // 处理 "    versionName=1.0.0" 格式
            if let Some(start) = line.find("versionName=") {
                let version_part = &line[start + 12..];
                let version_end = version_part.find(' ').unwrap_or(version_part.len());
                app.version_name = Some(version_part[..version_end].to_string());
            }
        } else if line.contains("versionCode=") {
            // 处理 "    versionCode=1" 格式
            if let Some(start) = line.find("versionCode=") {
                let version_part = &line[start + 12..];
                let version_end = version_part.find(' ').unwrap_or(version_part.len());
                app.version_code = Some(version_part[..version_end].to_string());
            }
        } else if line.trim_start().starts_with("PackageSignatures") {
            // 在PackageSignatures部分之前，我们可以找到应用的其他信息
            // 这里我们不做处理，只是作为一个标记
        } else if line.contains("enabled=") {
            // 处理 "    enabled=0" 或 "    enabled=1" 格式
            if let Some(start) = line.find("enabled=") {
                let enabled_part = &line[start + 8..];
                let enabled_end = enabled_part.find(' ').unwrap_or(enabled_part.len());
                let enabled_value = &enabled_part[..enabled_end];
                app.is_enabled = enabled_value != "0";
            }
        } else if line.contains("flags=") {
            // 处理 "    flags=[ SYSTEM ]" 格式，判断是否为系统应用
            if let Some(start) = line.find("flags=[") {
                let flags_part = &line[start + 7..];
                if let Some(end) = flags_part.find(']') {
                    let flags = &flags_part[..end];
                    app.is_system_app = flags.contains("SYSTEM");
                }
            }
        } else if line.contains("firstInstallTime=") {
            // 处理 "    firstInstallTime=2023-01-01 00:00:00" 格式
            if let Some(start) = line.find("firstInstallTime=") {
                let time_part = &line[start + 16..];
                let time_end = time_part.find(' ').unwrap_or(time_part.len());
                app.install_time = Some(time_part[..time_end].to_string());
            }
        } else if line.contains("lastUpdateTime=") {
            // 处理 "    lastUpdateTime=2023-01-01 00:00:00" 格式
            if let Some(start) = line.find("lastUpdateTime=") {
                let time_part = &line[start + 14..];
                let time_end = time_part.find(' ').unwrap_or(time_part.len());
                app.update_time = Some(time_part[..time_end].to_string());
            }
        } else if line.trim_start().starts_with("requested permissions:") {
            // 解析权限信息
            let mut in_permissions = false;
            for perm_line in output.lines() {
                if perm_line.trim_start().starts_with("requested permissions:") {
                    in_permissions = true;
                    continue;
                } else if perm_line.is_empty() && in_permissions {
                    break;
                } else if in_permissions
                    && perm_line.trim_start().starts_with("android.permission.")
                {
                    let perm = perm_line.trim();
                    if !perm.is_empty() {
                        app.permissions.push(perm.to_string());
                    }
                }
            }
        }
    }
}

/// 获取已冻结（被禁用）的应用列表
#[tauri::command]
pub async fn get_frozen_apps(serial: String) -> Result<Vec<InstalledApp>> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    // 尝试使用多种方法获取已冻结应用列表
    let mut result;

    // 方法1: 使用 pm list packages -d (标准方法)
    result = utils_execute_adb_command(&["-s", &serial, "shell", "pm list packages -d"], Some(30))
        .await?;

    // 如果方法1失败，尝试方法2: 使用 pm list packages | grep disabled
    if !result.success || result.output.is_empty() {
        result = utils_execute_adb_command(
            &["-s", &serial, "shell", "pm list packages | grep disabled"],
            Some(30),
        )
        .await?;
    }

    // 如果方法2也失败，尝试方法3: 直接查询所有应用然后检查状态
    if !result.success || result.output.is_empty() {
        // 先获取所有应用列表
        let all_apps_result =
            utils_execute_adb_command(&["-s", &serial, "shell", "pm list packages"], Some(30))
                .await?;

        if all_apps_result.success && !all_apps_result.output.is_empty() {
            let all_packages: Vec<String> = all_apps_result
                .output
                .lines()
                .map(|l| l.trim())
                .filter(|l| l.starts_with("package:"))
                .map(|l| l.replace("package:", ""))
                .filter(|l| !l.is_empty())
                .collect();

            // 检查每个应用的状态
            let mut disabled_packages = Vec::new();
            for pkg in all_packages {
                match utils_execute_adb_command(
                    &[
                        "-s",
                        &serial,
                        "shell",
                        &format!("dumpsys package {} | grep \"enabled=\"", pkg),
                    ],
                    Some(10),
                )
                .await
                {
                    Ok(status_result) => {
                        if status_result.success && status_result.output.contains("enabled=false") {
                            disabled_packages.push(pkg);
                        }
                    }
                    Err(e) => {
                        eprintln!("检查应用 {} 状态失败: {}", pkg, e);
                    }
                }
            }

            // 构造模拟的 pm list packages -d 输出
            result = CommandResult {
                success: true,
                output: disabled_packages
                    .iter()
                    .map(|pkg| format!("package:{}", pkg))
                    .collect::<Vec<_>>()
                    .join("\n"),
                error: None,
                exit_code: Some(0),
            };
        }
    }

    if result.success && !result.output.is_empty() {
        let packages: Vec<String> = result
            .output
            .lines()
            .map(|l| l.trim())
            .filter(|l| l.starts_with("package:"))
            .map(|l| l.replace("package:", ""))
            .filter(|l| !l.is_empty())
            .collect();

        let mut apps = Vec::new();

        for package_name in packages {
            // 获取应用详细信息
            match utils_execute_adb_command(
                &["-s", &serial, "shell", "dumpsys", "package", &package_name],
                Some(10),
            )
            .await
            {
                Ok(dump_result) => {
                    if dump_result.success {
                        let mut app = InstalledApp {
                            package_name: package_name.clone(),
                            version_name: None,
                            version_code: None,
                            install_location: None,
                            is_system_app: false,
                            is_enabled: false, // 已冻结应用肯定是禁用的
                            apk_path: None,
                            install_time: None,
                            update_time: None,
                            permissions: Vec::new(),
                        };

                        parse_package_dump(&dump_result.output, &mut app);
                        apps.push(app);
                    } else {
                        // 如果无法获取详细信息，创建基本应用对象
                        apps.push(InstalledApp {
                            package_name,
                            version_name: None,
                            version_code: None,
                            install_location: None,
                            is_system_app: false,
                            is_enabled: false,
                            apk_path: None,
                            install_time: None,
                            update_time: None,
                            permissions: Vec::new(),
                        });
                    }
                }
                Err(_) => {
                    // 如果无法获取详细信息，创建基本应用对象
                    apps.push(InstalledApp {
                        package_name,
                        version_name: None,
                        version_code: None,
                        install_location: None,
                        is_system_app: false,
                        is_enabled: false,
                        apk_path: None,
                        install_time: None,
                        update_time: None,
                        permissions: Vec::new(),
                    });
                }
            }
        }

        Ok(apps)
    } else {
        Err(AdmtError::CommandFailed {
            command: "pm list packages -d".to_string(),
            error: result.error.unwrap_or_default(),
        })
    }
}

/// 获取当前前台应用
#[tauri::command]
pub async fn get_current_app(serial: String) -> Result<Option<InstalledApp>> {
    let device = get_device_info(serial.clone()).await?;

    if !device.is_adb_available() {
        return Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        });
    }

    // 获取当前前台应用包名
    let activity_result = utils_execute_adb_command(
        &["-s", &serial, "shell", "dumpsys activity activities"],
        Some(30),
    )
    .await?;

    if !activity_result.success || activity_result.output.is_empty() {
        return Err(AdmtError::CommandFailed {
            command: "dumpsys activity activities".to_string(),
            error: activity_result.error.unwrap_or_default(),
        });
    }

    let lines: Vec<&str> = activity_result.output.lines().collect();
    // 查找包含 ResumedActivity 的行
    let resumed = lines
        .iter()
        .find(|l| l.contains("ResumedActivity") || l.contains("mResumedActivity"));

    if resumed.is_none() {
        return Ok(None);
    }

    // 解析形如 com.example/.MainActivity 或 com.example/com.example.MainActivity
    let package_name = if let Some(matched) = resumed.unwrap().find(" ") {
        let after_space = &resumed.unwrap()[matched + 1..];
        if let Some(slash_pos) = after_space.find('/') {
            after_space[..slash_pos].to_string()
        } else {
            return Ok(None);
        }
    } else {
        return Ok(None);
    };

    // 获取应用详细信息
    match utils_execute_adb_command(
        &["-s", &serial, "shell", "dumpsys", "package", &package_name],
        Some(10),
    )
    .await
    {
        Ok(dump_result) => {
            if dump_result.success {
                let mut app = InstalledApp {
                    package_name: package_name.clone(),
                    version_name: None,
                    version_code: None,
                    install_location: None,
                    is_system_app: false,
                    is_enabled: true, // 当前运行的应用肯定是启用的
                    apk_path: None,
                    install_time: None,
                    update_time: None,
                    permissions: Vec::new(),
                };

                parse_package_dump(&dump_result.output, &mut app);
                Ok(Some(app))
            } else {
                // 如果无法获取详细信息，创建基本应用对象
                Ok(Some(InstalledApp {
                    package_name,
                    version_name: None,
                    version_code: None,
                    install_location: None,
                    is_system_app: false,
                    is_enabled: true,
                    apk_path: None,
                    install_time: None,
                    update_time: None,
                    permissions: Vec::new(),
                }))
            }
        }
        Err(_) => {
            // 如果无法获取详细信息，创建基本应用对象
            Ok(Some(InstalledApp {
                package_name,
                version_name: None,
                version_code: None,
                install_location: None,
                is_system_app: false,
                is_enabled: true,
                apk_path: None,
                install_time: None,
                update_time: None,
                permissions: Vec::new(),
            }))
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
