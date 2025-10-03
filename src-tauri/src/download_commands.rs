use crate::error::{HoutError, Result};
use chrono;
use futures_util::StreamExt;
use std::sync::{Arc, Mutex, LazyLock};
use std::collections::HashSet;
use tauri::{Window, Emitter};
use tokio::fs;
use tokio::io::AsyncWriteExt;

// 全局取消下载任务集合
static CANCELLED_DOWNLOADS: LazyLock<Arc<Mutex<HashSet<String>>>> = LazyLock::new(|| {
    Arc::new(Mutex::new(HashSet::new()))
});

/// 获取应用下载目录
pub fn get_app_downloads_dir() -> Result<std::path::PathBuf> {
    // 尝试获取应用程序安装目录
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let downloads_dir = exe_dir.join("downloads");
            return Ok(downloads_dir);
        }
    }

    // 如果无法获取安装目录，使用应用数据目录
    if let Some(data_dir) = dirs::data_dir() {
        let app_data_dir = data_dir.join("ADMT").join("downloads");
        return Ok(app_data_dir);
    }

    // 最后回退到临时目录
    Ok(std::env::temp_dir().join("admt_downloads"))
}

/// 获取重定向URL
async fn get_redirect_url(url: &str) -> Result<String> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| HoutError::Network(format!("Failed to create HTTP client: {}", e)))?;

    let response = client
        .head(url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to send HEAD request: {}", e)))?;

    if response.status().is_redirection() {
        if let Some(location) = response.headers().get("location") {
            let redirect_url = location
                .to_str()
                .map_err(|e| HoutError::Network(format!("Invalid redirect URL: {}", e)))?;
            return Ok(redirect_url.to_string());
        }
    }

    // 如果没有重定向，返回原URL
    Ok(url.to_string())
}

/// 下载APK文件
#[tauri::command]
pub async fn download_apk(url: String, file_name: String, is_direct: bool) -> Result<String> {
    // 创建下载目录
    let downloads_dir = get_app_downloads_dir()?;
    fs::create_dir_all(&downloads_dir)
        .await
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
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(HoutError::Network(format!(
            "Download failed with status: {}",
            response.status()
        )));
    }

    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| HoutError::Io(format!("Failed to create file: {}", e)))?;

    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk =
            chunk.map_err(|e| HoutError::Network(format!("Failed to read chunk: {}", e)))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| HoutError::Io(format!("Failed to write chunk: {}", e)))?;
    }

    file.flush()
        .await
        .map_err(|e| HoutError::Io(format!("Failed to flush file: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string())
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
        .map_err(|e| HoutError::Network(format!("Failed to get file info: {}", e)))?;

    if let Some(content_length) = response.headers().get("content-length") {
        let size_str = content_length
            .to_str()
            .map_err(|e| HoutError::Network(format!("Invalid content-length header: {}", e)))?;
        let size = size_str
            .parse::<u64>()
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
    window: Window,
) -> Result<String> {
    use futures_util::StreamExt;

    log::info!("开始下载文件: {} -> {}", url, file_name);

    // 创建下载目录（按日期分类）
    let downloads_dir = get_app_downloads_dir()?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily_dir = downloads_dir.join(&today);
    fs::create_dir_all(&daily_dir)
        .await
        .map_err(|e| HoutError::Io(format!("Failed to create downloads directory: {}", e)))?;

    // 生成文件路径
    let file_path = daily_dir.join(&file_name);

    // 开始下载
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| HoutError::Network(format!("Failed to start download: {}", e)))?;

    if !response.status().is_success() {
        return Err(HoutError::Network(format!(
            "Download failed with status: {}",
            response.status()
        )));
    }

    // 获取文件总大小
    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded_size = 0u64;
    let start_time = std::time::Instant::now();

    // 创建文件
    let mut file = fs::File::create(&file_path)
        .await
        .map_err(|e| HoutError::Io(format!("Failed to create file: {}", e)))?;

    // 下载文件流
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk =
            chunk_result.map_err(|e| HoutError::Network(format!("Failed to read chunk: {}", e)))?;

        // 写入文件
        file.write_all(&chunk)
            .await
            .map_err(|e| HoutError::Io(format!("Failed to write chunk: {}", e)))?;

        // 更新进度
        downloaded_size += chunk.len() as u64;
        let elapsed = start_time.elapsed().as_secs_f64();
        let speed = if elapsed > 0.0 {
            downloaded_size as f64 / elapsed
        } else {
            0.0
        };
        let progress = if total_size > 0 {
            (downloaded_size as f64 / total_size as f64 * 100.0) as u32
        } else {
            0
        };

        // 发送进度事件到前端
        let _ = window.emit(
            "download-progress",
            serde_json::json!({
                "taskId": task_id,
                "progress": progress,
                "downloadedSize": downloaded_size,
                "totalSize": total_size,
                "speed": speed
            }),
        );

        // 检查是否取消
        if CANCELLED_DOWNLOADS.lock().unwrap().contains(&task_id) {
            // 删除部分下载的文件
            let _ = fs::remove_file(&file_path).await;
            CANCELLED_DOWNLOADS.lock().unwrap().remove(&task_id);
            return Err(HoutError::DownloadCancelled);
        }
    }

    // 确保文件写入完成
    file.flush()
        .await
        .map_err(|e| HoutError::Io(format!("Failed to flush file: {}", e)))?;

    log::info!("文件下载完成: {}", file_path.display());
    Ok(file_path.to_string_lossy().to_string())
}

/// 取消下载
#[tauri::command]
pub async fn cancel_download(task_id: String, window: Window) -> Result<()> {
    log::info!("取消下载任务: {}", task_id);

    // 发送取消事件到前端
    let _ = window.emit(
        "download-cancelled",
        serde_json::json!({
            "taskId": task_id
        }),
    );

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
    use std::time::{SystemTime, UNIX_EPOCH};

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
        .map_err(|e| HoutError::Io(format!("Failed to read downloads directory: {}", e)))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| HoutError::Io(format!("Failed to read directory entry: {}", e)))?
    {
        let metadata = entry
            .metadata()
            .await
            .map_err(|e| HoutError::Io(format!("Failed to get file metadata: {}", e)))?;

        if let Ok(modified) = metadata.modified() {
            if let Ok(modified_secs) = modified.duration_since(UNIX_EPOCH) {
                if modified_secs.as_secs() < cutoff_time {
                    if metadata.is_file() {
                        fs::remove_file(entry.path())
                            .await
                            .map_err(|e| HoutError::Io(format!("Failed to delete file: {}", e)))?;
                        deleted_count += 1;
                    } else if metadata.is_dir() {
                        fs::remove_dir_all(entry.path()).await.map_err(|e| {
                            HoutError::Io(format!("Failed to delete directory: {}", e))
                        })?;
                        deleted_count += 1;
                    }
                }
            }
        }
    }

    Ok(deleted_count)
}