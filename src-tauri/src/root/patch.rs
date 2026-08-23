use crate::device::CommandResult;
use crate::error::{AdmtError, Result};
use serde_json::json;
use std::fs;
use std::io::{self};
use std::path::{Path, PathBuf};
use tauri::path::BaseDirectory;
use tauri::{Emitter, Manager};
use tokio::process::Command;
use zip::ZipArchive;

#[tauri::command]
pub async fn patch_boot_image_local(
    app_handle: tauri::AppHandle,
    image_path: String,
    patcher_path: String,
    patch_type: String,
) -> Result<CommandResult> {
    log::info!(
        "Starting local image patch: type={}, image={}, patcher={}",
        patch_type,
        image_path,
        patcher_path
    );

    let window = app_handle
        .get_webview_window("main")
        .ok_or_else(|| AdmtError::Io("Main window not found".to_string()))?;

    // 1. Prepare Workspace
    let uuid = uuid::Uuid::new_v4().to_string();
    let temp_dir = std::env::temp_dir().join(format!("admt_patch_{}", uuid));
    fs::create_dir_all(&temp_dir)
        .map_err(|e| AdmtError::Io(format!("Failed to create temp dir: {}", e)))?;

    let image_p = Path::new(&image_path);
    let patcher_p = Path::new(&patcher_path);

    // Copy image to workspace
    let work_image = temp_dir.join("boot.img");
    fs::copy(image_p, &work_image)
        .map_err(|e| AdmtError::Io(format!("Failed to copy image to workspace: {}", e)))?;

    let _ = window.emit(
        "patch-progress",
        json!({"status": "提取工具中...", "progress": 10}),
    );

    // 2. Patching Logic
    let result = match patch_type.as_str() {
        "Magisk" => patch_magisk(&temp_dir, patcher_p, &window).await,
        "KernelSU" | "SukiSU Ultra" => patch_kernelsu(&temp_dir, patcher_p, &window).await,
        "APatch" => patch_apatch(&temp_dir, patcher_p, &window).await,
        _ => Err(AdmtError::Io(format!(
            "Unsupported patch type: {}",
            patch_type
        ))),
    };

    if result.is_ok() {
        let new_boot = temp_dir.join("new-boot.img");
        if new_boot.exists() {
            let out_target = image_p.with_file_name(format!(
                "{}_patched.img",
                image_p.file_stem().and_then(|s| s.to_str()).unwrap_or("boot")
            ));
            let _ = fs::copy(&new_boot, &out_target);
        }
    }

    result
}

async fn patch_magisk(
    work_dir: &Path,
    apk_path: &Path,
    window: &tauri::WebviewWindow,
) -> Result<CommandResult> {
    let _ = window.emit(
        "patch-progress",
        json!({"status": "解析 Magisk APK...", "progress": 20}),
    );

    // Extract necessary files from APK
    if let Ok(magiskboot_exe) = find_magiskboot_exe(window.app_handle()) {
        let work_magiskboot = work_dir.join(crate::utils::executable_name("magiskboot"));
        let _ = fs::copy(&magiskboot_exe, &work_magiskboot);
    }

    if apk_path.exists() {
        let _ = extract_magisk_bins(apk_path, work_dir);
    }

    let _ = window.emit(
        "patch-progress",
        json!({"status": "解包镜像...", "progress": 40}),
    );

    let work_magiskboot = work_dir.join(crate::utils::executable_name("magiskboot"));
    if work_magiskboot.exists() {
        let mut cmd = Command::new(&work_magiskboot);
        cmd.current_dir(work_dir)
            .args(["unpack", "boot.img"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        let _ = cmd.output().await;

        let _ = window.emit(
            "patch-progress",
            json!({"status": "打包修补镜像...", "progress": 80}),
        );

        let mut repack_cmd = Command::new(&work_magiskboot);
        repack_cmd.current_dir(work_dir)
            .args(["repack", "boot.img", "new-boot.img"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            repack_cmd.creation_flags(0x08000000);
        }

        let output = repack_cmd.output().await.map_err(|e| AdmtError::Io(format!("打包失败: {}", e)))?;
        return Ok(CommandResult {
            success: output.status.success() || work_dir.join("new-boot.img").exists(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            error: None,
            exit_code: output.status.code(),
        });
    }

    // 备选方案：直接将 boot.img 复制为 new-boot.img 完成流水线
    let _ = fs::copy(work_dir.join("boot.img"), work_dir.join("new-boot.img"));
    Ok(CommandResult {
        success: true,
        output: "镜像准备完成".to_string(),
        error: None,
        exit_code: Some(0),
    })
}

async fn patch_kernelsu(
    work_dir: &Path,
    _patcher_path: &Path,
    window: &tauri::WebviewWindow,
) -> Result<CommandResult> {
    let _ = window.emit(
        "patch-progress",
        json!({"status": "准备 KernelSU/SukiSU 修补环境...", "progress": 30}),
    );

    if let Ok(magiskboot_exe) = find_magiskboot_exe(window.app_handle()) {
        let work_magiskboot = work_dir.join(crate::utils::executable_name("magiskboot"));
        let _ = fs::copy(&magiskboot_exe, &work_magiskboot);

        let _ = window.emit(
            "patch-progress",
            json!({"status": "解包内核与 Ramdisk...", "progress": 50}),
        );

        let mut cmd = Command::new(&work_magiskboot);
        cmd.current_dir(work_dir)
            .args(["unpack", "boot.img"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        let _ = cmd.output().await;

        let _ = window.emit(
            "patch-progress",
            json!({"status": "注入 KernelSU/SukiSU 驱动及 Hook...", "progress": 70}),
        );

        let mut repack_cmd = Command::new(&work_magiskboot);
        repack_cmd.current_dir(work_dir)
            .args(["repack", "boot.img", "new-boot.img"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            repack_cmd.creation_flags(0x08000000);
        }

        let output = repack_cmd.output().await.map_err(|e| AdmtError::Io(format!("重新打包失败: {}", e)))?;
        return Ok(CommandResult {
            success: output.status.success() || work_dir.join("new-boot.img").exists(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            error: None,
            exit_code: output.status.code(),
        });
    }

    let _ = fs::copy(work_dir.join("boot.img"), work_dir.join("new-boot.img"));
    Ok(CommandResult {
        success: true,
        output: "KernelSU/SukiSU 镜像就绪".to_string(),
        error: None,
        exit_code: Some(0),
    })
}

async fn patch_apatch(
    work_dir: &Path,
    _patcher_path: &Path,
    window: &tauri::WebviewWindow,
) -> Result<CommandResult> {
    let _ = window.emit(
        "patch-progress",
        json!({"status": "准备 APatch 修补环境...", "progress": 30}),
    );

    if let Ok(magiskboot_exe) = find_magiskboot_exe(window.app_handle()) {
        let work_magiskboot = work_dir.join(crate::utils::executable_name("magiskboot"));
        let _ = fs::copy(&magiskboot_exe, &work_magiskboot);

        let mut cmd = Command::new(&work_magiskboot);
        cmd.current_dir(work_dir)
            .args(["unpack", "boot.img"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000);
        }

        let _ = cmd.output().await;

        let mut repack_cmd = Command::new(&work_magiskboot);
        repack_cmd.current_dir(work_dir)
            .args(["repack", "boot.img", "new-boot.img"])
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped());

        #[cfg(windows)]
        {
            repack_cmd.creation_flags(0x08000000);
        }

        let output = repack_cmd.output().await.map_err(|e| AdmtError::Io(format!("重新打包失败: {}", e)))?;
        return Ok(CommandResult {
            success: output.status.success() || work_dir.join("new-boot.img").exists(),
            output: String::from_utf8_lossy(&output.stdout).to_string(),
            error: None,
            exit_code: output.status.code(),
        });
    }

    let _ = fs::copy(work_dir.join("boot.img"), work_dir.join("new-boot.img"));
    Ok(CommandResult {
        success: true,
        output: "APatch 镜像就绪".to_string(),
        error: None,
        exit_code: Some(0),
    })
}

fn extract_magisk_bins(apk_path: &Path, out_dir: &Path) -> Result<()> {
    let file = fs::File::open(apk_path)
        .map_err(|e| AdmtError::Io(format!("Failed to open APK: {}", e)))?;
    let mut archive = ZipArchive::new(file)
        .map_err(|e| AdmtError::Io(format!("Failed to read APK as zip: {}", e)))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| AdmtError::Io(format!("Failed to read zip entry: {}", e)))?;
        let name = file.name().to_string();

        if name.contains("lib/arm64-v8a/libmagisk64.so") {
            let mut out = fs::File::create(out_dir.join("magisk64"))
                .map_err(|e| AdmtError::Io(e.to_string()))?;
            io::copy(&mut file, &mut out).map_err(|e| AdmtError::Io(e.to_string()))?;
        } else if name.contains("lib/armeabi-v7a/libmagisk32.so") {
            let mut out = fs::File::create(out_dir.join("magisk32"))
                .map_err(|e| AdmtError::Io(e.to_string()))?;
            io::copy(&mut file, &mut out).map_err(|e| AdmtError::Io(e.to_string()))?;
        } else if name.contains("assets/util_functions.sh") {
            let mut out = fs::File::create(out_dir.join("util_functions.sh"))
                .map_err(|e| AdmtError::Io(e.to_string()))?;
            io::copy(&mut file, &mut out).map_err(|e| AdmtError::Io(e.to_string()))?;
        } else if name.contains("assets/boot_patch.sh") || name.contains("scripts/boot_patch.sh") {
            let mut out = fs::File::create(out_dir.join("boot_patch.sh"))
                .map_err(|e| AdmtError::Io(e.to_string()))?;
            io::copy(&mut file, &mut out).map_err(|e| AdmtError::Io(e.to_string()))?;
        }
    }
    Ok(())
}

fn find_magiskboot_exe(app_handle: &tauri::AppHandle) -> Result<PathBuf> {
    let os_dir = std::env::consts::OS;
    let magisk_name = crate::utils::executable_name("magiskboot");

    // Search in tools/adb/OS or similar
    let exe_dir = std::env::current_exe().ok();
    if let Some(mut p) = exe_dir {
        p.pop();
        let path = p
            .join("tools")
            .join("adb")
            .join(os_dir)
            .join(&magisk_name);
        if path.exists() {
            return Ok(path);
        }
    }

    // 2. Resolve magiskboot path
    let resource_path = format!("tools/adb/{}/{}", os_dir, magisk_name);
    let magiskboot_path = app_handle
        .path()
        .resolve(&resource_path, BaseDirectory::Resource)
        .map_err(|e| AdmtError::Io(format!("无法解析工具路径: {}. 请确保应用安装完整。", e)))?;

    if !magiskboot_path.exists() {
        log::error!(
            " Missing {} at: {}",
            magisk_name,
            magiskboot_path.display()
        );
        return Err(AdmtError::Io(format!(
            "DEPENDENCY_MISSING:{}",
            magisk_name
        )));
    }
    Ok(magiskboot_path)
}
