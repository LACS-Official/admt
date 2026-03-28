use crate::download_manager::DownloadManager;
use crate::error::{AdmtError, Result};
use std::path::PathBuf;
use tauri::Emitter;

/// 获取应用下载目录
pub fn get_app_downloads_dir() -> Result<PathBuf> {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            return Ok(exe_dir.join("downloads"));
        }
    }
    if let Some(data_dir) = dirs::data_dir() {
        return Ok(data_dir.join("ADMT").join("downloads"));
    }
    Ok(std::env::temp_dir().join("admt_downloads"))
}

/// 下载APK文件
#[tauri::command]
pub async fn download_apk(url: String, file_name: String, is_direct: bool) -> Result<String> {
    use tokio::fs;
    use tokio::io::AsyncWriteExt;

    let downloads_dir = get_app_downloads_dir()?;
    fs::create_dir_all(&downloads_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create downloads directory: {}", e)))?;

    let file_path = downloads_dir.join(&file_name);
    let download_url = if is_direct {
        url
    } else {
        get_redirect_url(&url).await?
    };

    let client = reqwest::Client::new();
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(AdmtError::Network(format!(
            "Download failed with status: {}",
            response.status()
        )));
    }

    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create file: {}", e)))?;

    let mut stream = response.bytes_stream();
    use futures_util::StreamExt;
    while let Some(chunk) = stream.next().await {
        let chunk =
            chunk.map_err(|e| AdmtError::Network(format!("Failed to read chunk: {}", e)))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to write chunk: {}", e)))?;
    }
    file.flush()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to flush file: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string())
}

async fn get_redirect_url(url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| AdmtError::Network(format!("Failed to create HTTP client: {}", e)))?;

    let response = client
        .head(url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to send HEAD request: {}", e)))?;

    if response.status().is_redirection() {
        if let Some(location) = response.headers().get("location") {
            let redirect_url = location
                .to_str()
                .map_err(|e| AdmtError::Network(format!("Invalid redirect URL: {}", e)))?;
            return Ok(redirect_url.to_string());
        }
    }
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
    let response = client
        .head(&download_url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to get file info: {}", e)))?;

    if let Some(content_length) = response.headers().get("content-length") {
        let size = content_length
            .to_str()
            .map_err(|e| AdmtError::Network(format!("Invalid content-length: {}", e)))?
            .parse::<u64>()
            .map_err(|e| AdmtError::Network(format!("Parse content-length failed: {}", e)))?;
        Ok(size)
    } else {
        Ok(0)
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
    use futures_util::StreamExt;
    use tokio::fs;
    use tokio::io::AsyncWriteExt;

    let downloads_dir = get_app_downloads_dir()?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily_dir = downloads_dir.join(&today);
    fs::create_dir_all(&daily_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create downloads directory: {}", e)))?;

    let file_path = daily_dir.join(&file_name);
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| AdmtError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(AdmtError::Network(format!(
            "Download failed with status: {}",
            response.status()
        )));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded_size = 0u64;
    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to create file: {}", e)))?;

    let mut stream = response.bytes_stream();
    while let Some(chunk_result) = stream.next().await {
        let chunk =
            chunk_result.map_err(|e| AdmtError::Network(format!("Failed to read chunk: {}", e)))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to write chunk: {}", e)))?;
        downloaded_size += chunk.len() as u64;
        let progress = if total_size > 0 {
            (downloaded_size as f64 / total_size as f64 * 100.0) as u32
        } else {
            0
        };
        let _ = window.emit("download-progress", serde_json::json!({
            "taskId": task_id, "progress": progress, "downloadedSize": downloaded_size, "totalSize": total_size
        }));
    }
    file.flush()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to flush file: {}", e)))?;
    Ok(file_path.to_string_lossy().to_string())
}

/// 取消下载
#[tauri::command]
pub async fn cancel_download(task_id: String, window: tauri::Window) -> Result<()> {
    let _ = window.emit(
        "download-cancelled",
        serde_json::json!({ "taskId": task_id }),
    );
    Ok(())
}

/// 下载并解压软件
#[tauri::command]
pub async fn download_and_extract_software<R: tauri::Runtime>(
    app_handle: tauri::AppHandle<R>,
    request: crate::download_manager::DownloadRequest,
) -> Result<String> {
    let download_manager = DownloadManager::new();
    let result_path = download_manager
        .download_and_extract(&app_handle, request)
        .await?;
    Ok(result_path.to_string_lossy().to_string())
}

/// 清理下载文件
#[tauri::command]
pub async fn cleanup_downloads(older_than_days: u64) -> Result<u64> {
    use std::time::{SystemTime, UNIX_EPOCH};
    use tokio::fs;

    let downloads_dir = get_app_downloads_dir()?;
    if !downloads_dir.exists() {
        return Ok(0);
    }

    let cutoff_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        - (older_than_days * 24 * 60 * 60);
    let mut deleted_count = 0;
    let mut entries = fs::read_dir(&downloads_dir)
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read downloads directory: {}", e)))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| AdmtError::Io(format!("Failed to read directory entry: {}", e)))?
    {
        let metadata = entry
            .metadata()
            .await
            .map_err(|e| AdmtError::Io(format!("Failed to get file metadata: {}", e)))?;
        if let Ok(modified) = metadata.modified() {
            if let Ok(modified_secs) = modified.duration_since(UNIX_EPOCH) {
                if modified_secs.as_secs() < cutoff_time {
                    if metadata.is_file() {
                        fs::remove_file(entry.path()).await?;
                        deleted_count += 1;
                    } else if metadata.is_dir() {
                        fs::remove_dir_all(entry.path()).await?;
                        deleted_count += 1;
                    }
                }
            }
        }
    }
    Ok(deleted_count)
}
