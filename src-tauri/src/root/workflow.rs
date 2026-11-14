//! Root 工作流的安全闭环与设备端辅助修补通道。
//!
//! 提供：前置检查、原镜像备份、fastboot 在线探测、刷后 root 验证、
//! 日志落盘、备份清单，以及「把原镜像交给设备端官方 App 修补并取回产物」。

use crate::error::{AdmtError, Result};
use crate::root::patch::{
    sha256_file, validate_input_image, validate_patched_image, PatchOutcome, ERR_OUTPUT_INVALID,
};
use crate::utils::{execute_adb_command, execute_fastboot_command};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::Manager;

fn patch_err(detail: impl AsRef<str>) -> AdmtError {
    AdmtError::Command(format!("{}:{}", ERR_OUTPUT_INVALID, detail.as_ref()))
}

async fn adb_run(serial: &str, args: &[&str], timeout: u64) -> Result<String> {
    let mut full: Vec<&str> = vec!["-s", serial];
    full.extend_from_slice(args);
    let result = execute_adb_command(&full, Some(timeout)).await?;
    let output = if result.output.trim().is_empty() {
        result.error.clone().unwrap_or_default()
    } else {
        result.output
    };
    if !result.success {
        return Err(AdmtError::Command(format!(
            "设备命令执行失败: {}",
            output.trim()
        )));
    }
    Ok(output)
}

fn app_dir(app: &tauri::AppHandle) -> Result<PathBuf> {
    app.path()
        .app_data_dir()
        .map_err(|e| AdmtError::Io(format!("无法定位应用数据目录: {}", e)))
}

// ---------------------------------------------------------------- 前置检查

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RootPreflight {
    pub serial: String,
    pub connected: bool,
    pub model: Option<String>,
    pub sdk: Option<i32>,
    pub bootloader_unlocked: Option<bool>,
    pub verified_boot_state: Option<String>,
    pub ab_slot: Option<String>,
    pub anti_rollback: Option<String>,
    pub avb_enabled: Option<bool>,
    pub recommended_partition: String,
    pub requested_partition: String,
    pub blockers: Vec<String>,
    pub warnings: Vec<String>,
}

fn parse_getprop(output: &str, key: &str) -> Option<String> {
    output.lines().find_map(|line| {
        let line = line.trim();
        if !line.starts_with('[') {
            return None;
        }
        let mut parts = line.splitn(2, ']');
        let k = parts.next()?.trim_start_matches('[').trim();
        let rest = parts.next()?.trim();
        let value = rest
            .trim_start_matches(':')
            .trim()
            .trim_start_matches('[')
            .trim_end_matches(']')
            .trim();
        (k == key && !value.is_empty()).then(|| value.to_string())
    })
}

#[tauri::command]
pub async fn root_preflight(serial: String, partition: String) -> Result<RootPreflight> {
    let mut blockers = Vec::new();
    let mut warnings = Vec::new();

    let state = adb_run(&serial, &["get-state"], 15).await;
    let connected = state
        .as_ref()
        .map(|s| s.trim().contains("device"))
        .unwrap_or(false);
    if !connected {
        blockers.push("设备未通过 ADB 连接，或尚未授权调试".to_string());
    }

    let props = if connected {
        adb_run(&serial, &["shell", "getprop"], 30)
            .await
            .unwrap_or_default()
    } else {
        String::new()
    };

    let model = parse_getprop(&props, "ro.product.model");
    let sdk = parse_getprop(&props, "ro.build.version.sdk")
        .and_then(|v| v.parse::<i32>().ok());
    let locked = parse_getprop(&props, "ro.boot.flash.locked");
    let verified = parse_getprop(&props, "ro.boot.verifiedbootstate");
    let slot = parse_getprop(&props, "ro.boot.slot_suffix");
    let arb = parse_getprop(&props, "ro.boot.rollback_index")
        .or_else(|| parse_getprop(&props, "ro.boot.vbmeta.avb_version"));
    let avb_version = parse_getprop(&props, "ro.boot.vbmeta.avb_version")
        .or_else(|| parse_getprop(&props, "ro.boot.avb_version"));
    let avb_enabled = if connected {
        Some(avb_version.is_some() || verified.as_deref() == Some("yellow"))
    } else {
        None
    };

    let bootloader_unlocked = match locked.as_deref() {
        Some("0") => Some(true),
        Some("1") => Some(false),
        _ => match verified.as_deref() {
            Some("orange") => Some(true),
            Some("green") | Some("yellow") => Some(false),
            _ => None,
        },
    };

    match bootloader_unlocked {
        Some(false) => blockers.push("Bootloader 处于锁定状态，无法刷入第三方镜像".to_string()),
        None => warnings.push(
            "无法确认 Bootloader 解锁状态，请确认设备已解锁后再继续".to_string(),
        ),
        Some(true) => {}
    }

    if let Some(ref s) = slot {
        warnings.push(format!("检测到 A/B 槽位 {}，镜像将写入当前槽位", s));
    }
    if arb.is_some() {
        warnings.push("设备存在防回滚保护，请勿刷入低于当前安全等级的固件".to_string());
    }
    if avb_enabled == Some(true) {
        warnings.push(
            "设备启用了 AVB 校验；修补 boot 后若无法开机，需要提供 vbmeta 镜像并禁用校验后重刷"
                .to_string(),
        );
    }

    let recommended = if sdk.map(|v| v >= 33).unwrap_or(false) {
        "init_boot"
    } else {
        "boot"
    }
    .to_string();

    let requested = if partition == "auto" || partition.is_empty() {
        recommended.clone()
    } else {
        partition
    };
    if requested != recommended {
        warnings.push(format!(
            "当前系统建议写入 {} 分区，已选择 {}，请确认与机型一致",
            recommended, requested
        ));
    }

    Ok(RootPreflight {
        serial,
        connected,
        model,
        sdk,
        bootloader_unlocked,
        verified_boot_state: verified,
        ab_slot: slot,
        anti_rollback: arb,
        avb_enabled,
        recommended_partition: recommended,
        requested_partition: requested,
        blockers,
        warnings,
    })
}

/// 轮询 fastboot devices，替代固定时长的盲等。
#[tauri::command]
pub async fn root_wait_for_fastboot(serial: String, timeout_secs: Option<u64>) -> Result<bool> {
    let limit = timeout_secs.unwrap_or(60).clamp(5, 180);
    for _ in 0..limit {
        if let Ok(result) = execute_fastboot_command(&["devices"], Some(5)).await {
            let output = format!(
                "{} {}",
                result.output,
                result.error.clone().unwrap_or_default()
            );
            let found = output.lines().any(|line| {
                let line = line.trim();
                if line.is_empty() {
                    return false;
                }
                line.contains("fastboot")
                    && (serial.is_empty()
                        || line.split_whitespace().next() == Some(serial.as_str()))
            });
            if found {
                return Ok(true);
            }
        }
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }
    Ok(false)
}

/// 等待设备从 fastboot 重启回 ADB 在线状态。
#[tauri::command]
pub async fn root_wait_for_adb(serial: String, timeout_secs: Option<u64>) -> Result<bool> {
    let limit = timeout_secs.unwrap_or(180).clamp(10, 600);
    for _ in 0..limit {
        if let Ok(result) = execute_adb_command(&["devices"], Some(5)).await {
            let online = result.output.lines().any(|line| {
                let mut parts = line.split_whitespace();
                let dev = parts.next().unwrap_or("");
                let state = parts.next().unwrap_or("");
                dev == serial && state == "device"
            });
            if online {
                return Ok(true);
            }
        }
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }
    Ok(false)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RootVerification {
    pub rooted: bool,
    pub detail: String,
}

#[tauri::command]
pub async fn root_verify_root(serial: String) -> Result<RootVerification> {
    let output = match adb_run(&serial, &["shell", "su -c id"], 20).await {
        Ok(v) => v,
        Err(e) => {
            return Ok(RootVerification {
                rooted: false,
                detail: format!("未取得 root 授权: {}", e),
            })
        }
    };
    let rooted = output.contains("uid=0");
    Ok(RootVerification {
        rooted,
        detail: if rooted {
            "su 返回 uid=0，Root 生效".to_string()
        } else {
            format!("su 未返回 root 身份: {}", output.trim())
        },
    })
}

// ---------------------------------------------------------------- 备份与日志

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RootBackupRecord {
    pub image_path: String,
    pub meta_path: String,
    pub sha256: String,
    pub size: u64,
    pub serial: String,
    pub partition: String,
    pub created_at: String,
}

fn backups_dir(app: &tauri::AppHandle) -> Result<PathBuf> {
    let dir = app_dir(app)?.join("root-backups");
    fs::create_dir_all(&dir)
        .map_err(|e| AdmtError::Io(format!("创建备份目录失败: {}", e)))?;
    Ok(dir)
}

/// 备份流程中已提取到的原始镜像（不依赖设备 root 权限）。
#[tauri::command]
pub async fn root_backup_image(
    app_handle: tauri::AppHandle,
    image_path: String,
    serial: String,
    partition: String,
) -> Result<RootBackupRecord> {
    let source = PathBuf::from(&image_path);
    validate_input_image(&source)?;
    let dir = backups_dir(&app_handle)?;
    let stamp = chrono::Local::now().format("%Y%m%d-%H%M%S").to_string();
    let safe_partition = partition
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-')
        .collect::<String>();
    let base = format!("{}-{}", stamp, safe_partition);
    let dest = dir.join(format!("{}.img", base));
    fs::copy(&source, &dest)
        .map_err(|e| AdmtError::Io(format!("备份原镜像失败: {}", e)))?;

    let sha = sha256_file(&dest)?;
    let size = fs::metadata(&dest).map(|m| m.len()).unwrap_or(0);
    let created_at = chrono::Local::now().to_rfc3339();
    let record = RootBackupRecord {
        image_path: dest.to_string_lossy().into_owned(),
        meta_path: dir.join(format!("{}.json", base)).to_string_lossy().into_owned(),
        sha256: sha,
        size,
        serial,
        partition,
        created_at,
    };
    fs::write(
        &record.meta_path,
        serde_json::to_string_pretty(&record)
            .map_err(|e| AdmtError::Io(format!("写入备份元数据失败: {}", e)))?,
    )
    .map_err(|e| AdmtError::Io(format!("写入备份元数据失败: {}", e)))?;
    Ok(record)
}

#[tauri::command]
pub async fn root_list_backups(
    app_handle: tauri::AppHandle,
) -> Result<Vec<RootBackupRecord>> {
    let dir = backups_dir(&app_handle)?;
    let mut records = Vec::new();
    let entries = fs::read_dir(&dir)
        .map_err(|e| AdmtError::Io(format!("读取备份目录失败: {}", e)))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }
        if let Ok(text) = fs::read_to_string(&path) {
            if let Ok(record) = serde_json::from_str::<RootBackupRecord>(&text) {
                if Path::new(&record.image_path).is_file() {
                    records.push(record);
                }
            }
        }
    }
    records.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(records)
}

#[tauri::command]
pub async fn root_append_workflow_log(
    app_handle: tauri::AppHandle,
    lines: Vec<String>,
) -> Result<String> {
    let dir = app_dir(&app_handle)?.join("logs");
    fs::create_dir_all(&dir)
        .map_err(|e| AdmtError::Io(format!("创建日志目录失败: {}", e)))?;
    let path = dir.join(format!(
        "root-workflow-{}.log",
        chrono::Local::now().format("%Y-%m-%d")
    ));
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| AdmtError::Io(format!("打开日志文件失败: {}", e)))?;
    let stamp = chrono::Local::now().format("%H:%M:%S").to_string();
    for line in lines {
        writeln!(file, "[{}] {}", stamp, line)
            .map_err(|e| AdmtError::Io(format!("写入日志失败: {}", e)))?;
    }
    Ok(path.to_string_lossy().into_owned())
}

// ---------------------------------------------------------------- 设备端辅助修补

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DevicePatchSession {
    pub device_input: String,
    pub device_dir: String,
    pub suggested_output: String,
    pub engine: String,
    pub app_package: Option<String>,
    pub hint: String,
}

fn root_app_package(engine: &str) -> Option<&'static str> {
    match engine {
        "Magisk" => Some("com.topjohnwu.magisk"),
        "KernelSU" => Some("me.weishu.kernelsu"),
        "SukiSU Ultra" => Some("com.sukisu.ultra"),
        "APatch" => Some("me.bmax.apatch"),
        _ => None,
    }
}

#[tauri::command]
pub async fn root_prepare_device_patch(
    serial: String,
    image_path: String,
    engine: String,
) -> Result<DevicePatchSession> {
    let source = PathBuf::from(&image_path);
    validate_input_image(&source)?;
    let name = source
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("boot.img")
        .to_string();
    let dir = "/sdcard/Download/ADMT";
    adb_run(&serial, &["shell", "mkdir", "-p", dir], 20).await?;

    let device_input = format!("{}/{}", dir, name);
    let push = adb_run(
        &serial,
        &["push", &image_path, &device_input],
        600,
    )
    .await?;
    log::info!("[root-device-patch] push: {}", push.trim());

    let stem = source
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("boot");
    let suggested_output = format!("{}/{}_patched.img", dir, stem);
    let package = root_app_package(&engine);
    if let Some(pkg) = package {
        let _ = adb_run(&serial, &["shell", "monkey", "-p", pkg, "1"], 20).await;
    }

    Ok(DevicePatchSession {
        device_input,
        device_dir: dir.to_string(),
        suggested_output,
        engine: engine.clone(),
        app_package: package.map(str::to_string),
        hint: format!(
            "原镜像已推送到设备。请在 {} 官方 App 内选择「安装 / 修补镜像」并选中该文件；修补完成后把产物放回 {}，然后在下方点击「取回产物」。",
            engine, dir
        ),
    })
}

/// 列出设备上疑似修补产物的镜像文件，供用户选择取回。
#[tauri::command]
pub async fn root_scan_device_patched_images(
    serial: String,
) -> Result<Vec<String>> {
    let is_candidate = |name: &str| {
        let lower = name.to_ascii_lowercase();
        lower.ends_with(".img")
            && (lower.contains("patched")
                || lower.contains("magisk")
                || lower.contains("kernelsu")
                || lower.contains("apatch")
                || lower.contains("sukisu"))
    };
    let mut full = Vec::new();
    for dir in ["/sdcard/Download", "/sdcard/Download/ADMT"] {
        if let Ok(output) = adb_run(&serial, &["shell", "ls", "-1", dir], 30).await {
            for line in output.lines() {
                let name = line.trim();
                if !name.is_empty() && is_candidate(name) {
                    full.push(format!("{}/{}", dir, name));
                }
            }
        }
    }
    full.sort();
    full.dedup();
    Ok(full)
}

#[tauri::command]
pub async fn root_collect_device_patch(
    serial: String,
    device_path: String,
    original_path: String,
    out_dir: String,
    engine: String,
) -> Result<PatchOutcome> {
    if device_path.is_empty() || !device_path.starts_with("/sdcard/") {
        return Err(patch_err("设备端产物路径无效"));
    }
    let original = PathBuf::from(&original_path);
    validate_input_image(&original)?;
    let source_sha256 = sha256_file(&original)?;

    let name = Path::new(&device_path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("patched.img");
    let dest_dir = PathBuf::from(&out_dir);
    fs::create_dir_all(&dest_dir)
        .map_err(|e| AdmtError::Io(format!("创建输出目录失败: {}", e)))?;
    let dest = dest_dir.join(name);
    let _ = fs::remove_file(&dest);

    adb_run(&serial, &["pull", &device_path, &dest.to_string_lossy()], 600).await?;
    validate_patched_image(&original, &dest, &engine)?;
    let patched_sha256 = sha256_file(&dest)?;

    Ok(PatchOutcome {
        success: true,
        output: "设备端修补产物已取回并通过校验".to_string(),
        error: None,
        exit_code: Some(0),
        output_path: Some(dest.to_string_lossy().into_owned()),
        source_sha256,
        patched_sha256,
        engine,
    })
}

/// 把修补好的镜像刷入指定分区（fastboot flash）。disable_avb 为 true 时先以
/// `--disable-verification` 刷写 vbmeta，规避 AVB 校验导致的不开机。该操作高危，
/// 调用方必须已确认解锁且已备份原镜像。
#[tauri::command]
pub async fn root_flash_patched_image(
    serial: String,
    partition: String,
    image_path: String,
    disable_avb: Option<bool>,
) -> Result<crate::device::CommandResult> {
    let image = PathBuf::from(&image_path);
    validate_input_image(&image)?;
    if !partition
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        return Err(AdmtError::Command("分区名包含非法字符".to_string()));
    }

    if disable_avb.unwrap_or(false) {
        let vbmeta_args = vec![
            "-s",
            serial.as_str(),
            "flash",
            "--disable-verification",
            "vbmeta",
        ];
        let vbmeta = execute_fastboot_command(&vbmeta_args, Some(120)).await?;
        if !vbmeta.success {
            return Err(AdmtError::Command(format!(
                "禁用 AVB 校验失败（vbmeta 刷写未成功），已中止刷入以免变砖：{}",
                vbmeta.error.clone().unwrap_or_default()
            )));
        }
        log::info!("[root-flash] vbmeta disabled-verification flashed");
    }

    let args = vec![
        "-s",
        serial.as_str(),
        "flash",
        partition.as_str(),
        image_path.as_str(),
    ];
    let result = execute_fastboot_command(&args, Some(600)).await?;
    log::info!(
        "[root-flash] {}",
        json!({"serial": serial, "partition": partition, "disable_avb": disable_avb})
    );
    Ok(result)
}

/// 从已连接设备读取内核版本并解析出 KMI（Kernel Module Interface）。
/// 例如 `5.10.101-android12-9-gabcd` → `5.10-android12-9`。
#[tauri::command]
pub async fn root_detect_kmi(serial: String) -> Result<String> {
    let raw = adb_run(&serial, &["shell", "uname", "-r"], 15).await?;
    let trimmed = raw.trim();
    let parts: Vec<&str> = trimmed.split('-').collect();
    if parts.len() < 3 {
        return Err(AdmtError::Command(format!(
            "无法从内核版本解析 KMI：{}",
            trimmed
        )));
    }
    let ver_segs: Vec<&str> = parts[0].split('.').collect();
    let major_minor = if ver_segs.len() >= 2 {
        format!("{}.{}", ver_segs[0], ver_segs[1])
    } else {
        parts[0].to_string()
    };
    let kmi = format!("{}-{}-{}", major_minor, parts[1], parts[2]);
    Ok(kmi)
}

/// 回滚：把备份镜像重新刷回指定分区（供前端在验证失败时调用）。
#[tauri::command]
pub async fn root_restore_backup(
    serial: String,
    backup_path: String,
    partition: String,
) -> Result<crate::device::CommandResult> {
    let backup = PathBuf::from(&backup_path);
    validate_input_image(&backup)?;
    if !partition
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        return Err(AdmtError::Command("分区名包含非法字符".to_string()));
    }
    let args = vec![
        "-s",
        serial.as_str(),
        "flash",
        partition.as_str(),
        backup_path.as_str(),
    ];
    let result = execute_fastboot_command(&args, Some(600)).await?;
    log::info!("[root-rollback] {}", json!({"serial": serial, "partition": partition}));
    Ok(result)
}
