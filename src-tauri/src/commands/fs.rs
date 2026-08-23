use crate::error::{AdmtError, Result};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{BufReader, Read};
use std::path::PathBuf;

/// 打开文件夹
#[tauri::command]
pub async fn open_folder(path: String) -> Result<()> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err(AdmtError::FileNotFound {
            path: path.to_string_lossy().to_string(),
        });
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| AdmtError::Process(e.to_string()))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| AdmtError::Process(e.to_string()))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| AdmtError::Process(e.to_string()))?;
    }

    Ok(())
}

/// 启动/运行已下载的软件资源启动程序
#[tauri::command]
pub async fn launch_software_resource(
    path: String,
    openname: Option<String>,
) -> Result<String> {
    log::info!(
        "[launch_software_resource] path: {}, openname: {:?}",
        path,
        openname
    );

    let base_path = std::path::Path::new(&path);
    if !base_path.exists() {
        return Err(AdmtError::FileNotFound {
            path: path.clone(),
        });
    }

    let mut target_exe: Option<std::path::PathBuf> = None;

    if base_path.is_file() {
        target_exe = Some(base_path.to_path_buf());
    } else if base_path.is_dir() {
        // 1. 如果提供了 openname，先匹配 openname
        if let Some(ref name) = openname {
            let clean_name = name.trim();
            if !clean_name.is_empty() {
                let direct = base_path.join(clean_name);
                if direct.exists() {
                    target_exe = Some(direct);
                } else if let Ok(entries) = std::fs::read_dir(base_path) {
                    for entry in entries.flatten() {
                        let sub_direct = entry.path().join(clean_name);
                        if sub_direct.exists() {
                            target_exe = Some(sub_direct);
                            break;
                        }
                    }
                }
            }
        }

        // 2. 尝试读取 lacs_config.json
        if target_exe.is_none() {
            let config_path = base_path.join("lacs_config.json");
            if config_path.exists() {
                if let Ok(content) = std::fs::read_to_string(&config_path) {
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                        if let Some(cfg_openname) = val.get("openname").and_then(|v| v.as_str()) {
                            let p = base_path.join(cfg_openname);
                            if p.exists() {
                                target_exe = Some(p);
                            }
                        }
                    }
                }
            }
        }

        // 3. 自动探测目录下的可执行文件 (.exe, .bat, .cmd)
        if target_exe.is_none() {
            if let Ok(entries) = std::fs::read_dir(base_path) {
                let mut candidates = Vec::new();
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_file() {
                        if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                            let ext_lower = ext.to_lowercase();
                            if ext_lower == "exe" || ext_lower == "bat" || ext_lower == "cmd" {
                                candidates.push(p);
                            }
                        }
                    }
                }
                // 优先排除 uninstall/unins
                if let Some(primary) = candidates.iter().find(|p| {
                    let file_stem = p
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                    !file_stem.contains("unins") && !file_stem.contains("uninstall")
                }) {
                    target_exe = Some(primary.clone());
                } else if !candidates.is_empty() {
                    target_exe = Some(candidates[0].clone());
                }
            }
        }
    }

    let exe_path = match target_exe {
        Some(p) => p,
        None => {
            // 如果未找到具体可执行文件，打开安装目录
            #[cfg(target_os = "windows")]
            {
                std::process::Command::new("explorer")
                    .arg(base_path)
                    .spawn()
                    .map_err(|e| AdmtError::Process(e.to_string()))?;
            }
            return Ok(format!("已为您打开软件目录: {}", base_path.display()));
        }
    };

    let working_dir = exe_path.parent().unwrap_or(base_path);

    #[cfg(target_os = "windows")]
    {
        let ext = exe_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if ext == "bat" || ext == "cmd" || ext == "exe" || ext == "msi" {
            std::process::Command::new("cmd")
                .args(["/C", "start", ""])
                .arg(&exe_path)
                .current_dir(working_dir)
                .spawn()
                .map_err(|e| AdmtError::Process(format!("启动程序失败: {}", e)))?;
        } else {
            std::process::Command::new("explorer")
                .arg(&exe_path)
                .spawn()
                .map_err(|e| AdmtError::Process(format!("打开文件失败: {}", e)))?;
        }
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&exe_path)
            .current_dir(working_dir)
            .spawn()
            .map_err(|e| AdmtError::Process(format!("启动程序失败: {}", e)))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&exe_path)
            .current_dir(working_dir)
            .spawn()
            .map_err(|e| AdmtError::Process(format!("启动程序失败: {}", e)))?;
    }

    let exe_name = exe_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("程序");
    Ok(format!("已启动启动程序: {}", exe_name))
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
        std::fs::remove_file(path).map_err(|e| AdmtError::Io(e.to_string()))?;
    } else if path.is_dir() {
        std::fs::remove_dir_all(path).map_err(|e| AdmtError::Io(e.to_string()))?;
    }

    Ok(())
}

/// 读取JSON文件内容
#[tauri::command]
pub async fn read_json_file(path: String) -> Result<serde_json::Value> {
    use std::fs;

    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err(AdmtError::FileNotFound {
            path: path.to_string_lossy().to_string(),
        });
    }

    let content = fs::read_to_string(path)
        .map_err(|e| AdmtError::Io(format!("Failed to read file: {}", e)))?;

    let json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| AdmtError::Io(format!("Failed to parse JSON: {}", e)))?;

    Ok(json)
}

/// 写入JSON文件内容
#[tauri::command]
pub async fn write_json_file(path: String, content: String) -> Result<()> {
    use std::fs;
    use std::path::Path;

    let path = Path::new(&path);

    // 确保父目录存在
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| AdmtError::Io(format!("Failed to create directory: {}", e)))?;
        }
    }

    // 验证内容是有效的JSON
    let _json: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| AdmtError::Io(format!("Invalid JSON content: {}", e)))?;

    // 写入文件
    fs::write(path, content).map_err(|e| AdmtError::Io(format!("Failed to write file: {}", e)))?;

    log::info!("Successfully wrote JSON file: {}", path.display());
    Ok(())
}

/// 获取资源文件的完整路径
#[tauri::command]
pub async fn get_resource_path<R: tauri::Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<String> {
    log::info!("Getting resource path for: {}", path);
    use tauri::Manager;

    // 1. 首先检查应用资源目录（适用于打包后的应用）
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let resource_path = resource_dir.join(&path);
        log::debug!("Checking app resource path: {:?}", resource_path);

        if resource_path.exists() {
            log::info!("Resource found in app resources at: {:?}", resource_path);
            return Ok(resource_path.to_string_lossy().to_string());
        }
        // 检查资源目录下是否有resource子目录，用于兼容bundle.resources配置
        let resource_path_with_subdir = resource_dir.join("resource").join(&path);
        log::debug!(
            "Checking app resource path with subdir: {:?}",
            resource_path_with_subdir
        );
        if resource_path_with_subdir.exists() {
            log::info!(
                "Resource found in app resources subdir at: {:?}",
                resource_path_with_subdir
            );
            return Ok(resource_path_with_subdir.to_string_lossy().to_string());
        }
    }

    // 2. 检查src-tauri/resource目录（开发环境）
    let resource_path = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("resource")
        .join(&path);

    log::debug!("Checking development resource path: {:?}", resource_path);

    if resource_path.exists() {
        log::info!("Resource found at: {:?}", resource_path);
        return Ok(resource_path.to_string_lossy().to_string());
    }

    // 3. 检查app data目录（备用方案）
    if let Ok(data_dir) = app_handle.path().app_data_dir() {
        let app_data_path = data_dir.join("resource").join(&path);
        log::debug!("Checking app data path: {:?}", app_data_path);

        if app_data_path.exists() {
            log::info!("Resource found in app data at: {:?}", app_data_path);
            return Ok(app_data_path.to_string_lossy().to_string());
        }
    }

    // 4. 检查当前可执行文件目录（适用于便携版）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let exe_resource_path = parent.join("resource").join(&path);
            log::debug!("Checking exe directory path: {:?}", exe_resource_path);

            if exe_resource_path.exists() {
                log::info!(
                    "Resource found in exe directory at: {:?}",
                    exe_resource_path
                );
                return Ok(exe_resource_path.to_string_lossy().to_string());
            }
        }
    }

    // 如果都找不到，返回错误
    log::error!("Resource not found: {}", path);
    Err(AdmtError::FileNotFound {
        path: path.to_string(),
    })
}

/// 读取资源文件内容并返回为字节数组
#[tauri::command]
pub async fn read_resource_file<R: tauri::Runtime>(
    app_handle: tauri::AppHandle<R>,
    path: String,
) -> Result<Vec<u8>> {
    log::info!("Reading resource file: {}", path);

    // 使用get_resource_path获取文件路径
    let file_path = get_resource_path(app_handle, path.clone()).await?;

    // 读取文件内容
    let content = std::fs::read(&file_path)
        .map_err(|e| AdmtError::Io(format!("Failed to read resource file {}: {}", file_path, e)))?;

    log::info!(
        "Successfully read resource file: {} ({} bytes)",
        file_path,
        content.len()
    );
    Ok(content)
}

/// 计算文件哈希 (SHA256)
#[tauri::command]
pub async fn get_file_hash(path: String) -> Result<String> {
    log::info!("Calculating hash for file: {}", path);

    // 在异步线程中执行耗时的IO操作
    let hash_result = tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(path);
        if !path.exists() {
            return Err(AdmtError::Io(format!("File not found: {:?}", path)));
        }

        let file = File::open(path).map_err(|e| AdmtError::Io(e.to_string()))?;
        let mut reader = BufReader::new(file);
        let mut hasher = Sha256::new();
        let mut buffer = [0; 8192]; // 8KB buffer

        loop {
            let count = reader
                .read(&mut buffer)
                .map_err(|e| AdmtError::Io(e.to_string()))?;
            if count == 0 {
                break;
            }
            hasher.update(&buffer[..count]);
        }

        let result = hasher.finalize();
        Ok(hex::encode(result))
    })
    .await
    .map_err(|e| AdmtError::Unknown {
        message: e.to_string(),
    })??;

    log::info!("Hash calculation completed: {}", hash_result);
    Ok(hash_result)
}

/// 获取下载目录路径
#[tauri::command]
pub async fn get_downloads_directory() -> Result<String> {
    let downloads_dir = super::download::get_app_downloads_dir()?;
    Ok(downloads_dir.to_string_lossy().to_string())
}

/// 获取APK文件列表
#[tauri::command]
pub async fn get_apk_files() -> Result<Vec<String>> {
    use tokio::fs;

    let downloads_dir = super::download::get_app_downloads_dir()?;
    let apk_dir = downloads_dir.join("apk");

    // 确保APK目录存在
    if !apk_dir.exists() {
        fs::create_dir_all(&apk_dir)
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to create APK directory: {}", e)))?;
        return Ok(Vec::new());
    }

    let mut apk_files = Vec::new();
    let mut entries = fs::read_dir(&apk_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read APK directory: {}", e)))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read directory entry: {}", e)))?
    {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("apk") {
            apk_files.push(path.to_string_lossy().to_string());
        }
    }

    Ok(apk_files)
}

/// 获取默认下载目录（使用应用程序目录下的downloads）
#[tauri::command]
pub async fn get_default_download_directory() -> Result<String> {
    // 使用应用程序目录下的downloads文件夹
    let app_downloads_dir = super::download::get_app_downloads_dir()?;

    // 确保目录存在
    std::fs::create_dir_all(&app_downloads_dir).map_err(|e| AdmtError::Io(e.to_string()))?;

    Ok(app_downloads_dir.to_string_lossy().to_string())
}

pub fn get_config_file_path() -> Result<PathBuf> {
    // 尝试多个可能的配置文件位置
    let possible_paths = vec![
        // 应用数据目录
        dirs::data_dir().map(|dir| dir.join("admt").join("config").join("adbCommands.json")),
        // 资源目录
        std::env::current_exe().ok().map(|exe| {
            exe.parent()
                .unwrap_or_else(|| std::path::Path::new("."))
                .join("config")
                .join("adbCommands.json")
        }),
        // 相对路径
        Some(PathBuf::from("./src-tauri/config/adbCommands.json")),
    ];

    for path in possible_paths.into_iter().flatten() {
        if path.exists() {
            return Ok(path);
        }
    }

    // 如果都不存在，返回默认路径（应用数据目录）
    let default_path = dirs::data_dir()
        .unwrap_or_else(|| std::path::Path::new(".").to_path_buf())
        .join("admt")
        .join("config")
        .join("adbCommands.json");

    Ok(default_path)
}
