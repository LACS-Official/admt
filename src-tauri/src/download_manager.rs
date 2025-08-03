use crate::error::{HoutError, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;
use std::io::{self, Write};
use reqwest;
use futures_util::StreamExt;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub id: String,
    pub total_size: u64,
    pub downloaded: u64,
    pub percentage: f64,
    pub speed: f64, // bytes per second
    pub status: DownloadStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Completed,
    Failed,
    Extracting,
    ExtractCompleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadRequest {
    pub id: String,
    pub url: String,
    pub software_name: String,
    pub openname: Option<String>,
    pub file_extension: Option<String>,
    pub download_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractProgress {
    pub id: String,
    pub current_file: String,
    pub total_files: usize,
    pub extracted_files: usize,
    pub percentage: f64,
}

pub struct DownloadManager;

impl DownloadManager {
    pub fn new() -> Self {
        Self
    }

    /// 下载文件并自动解压
    pub async fn download_and_extract<R: tauri::Runtime>(
        &self,
        app_handle: &tauri::AppHandle<R>,
        request: DownloadRequest,
    ) -> Result<PathBuf> {
        // 1. 下载文件
        let downloaded_file = self.download_file(app_handle, &request).await?;
        
        // 2. 检查是否需要解压
        if self.is_archive_file(&downloaded_file) {
            let extract_dir = self.extract_archive(app_handle, &downloaded_file, &request).await?;
            
            // 3. 生成配置文件
            if let Some(openname) = &request.openname {
                self.create_config_file(&extract_dir, openname)?;
            }
            
            // 4. 可选删除原压缩文件
            // 这里可以添加用户配置选项来决定是否删除
            
            Ok(extract_dir)
        } else {
            Ok(downloaded_file.parent().unwrap().to_path_buf())
        }
    }

    /// 下载文件
    async fn download_file<R: tauri::Runtime>(
        &self,
        app_handle: &tauri::AppHandle<R>,
        request: &DownloadRequest,
    ) -> Result<PathBuf> {
        let client = reqwest::Client::new();
        let response = client.get(&request.url).send().await
            .map_err(|e| HoutError::NetworkError(e.to_string()))?;

        if !response.status().is_success() {
            return Err(HoutError::NetworkError(format!("HTTP {}", response.status())));
        }

        let total_size = response.content_length().unwrap_or(0);
        
        // 构建文件名
        let file_extension = request.file_extension.as_deref().unwrap_or("bin");
        let filename = format!("{}.{}", request.software_name, file_extension);
        let file_path = Path::new(&request.download_dir).join(&filename);

        // 确保下载目录存在
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| HoutError::IoError { message: e.to_string() })?;
        }

        let mut file = fs::File::create(&file_path)
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;
        
        let mut downloaded = 0u64;
        let mut stream = response.bytes_stream();
        let start_time = std::time::Instant::now();

        // 发送初始进度
        let progress = DownloadProgress {
            id: request.id.clone(),
            total_size,
            downloaded: 0,
            percentage: 0.0,
            speed: 0.0,
            status: DownloadStatus::Downloading,
        };
        let _ = app_handle.emit("download-progress", &progress);

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| HoutError::NetworkError(e.to_string()))?;
            file.write_all(&chunk)
                .map_err(|e| HoutError::IoError { message: e.to_string() })?;
            
            downloaded += chunk.len() as u64;
            let elapsed = start_time.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 { downloaded as f64 / elapsed } else { 0.0 };
            let percentage = if total_size > 0 { 
                (downloaded as f64 / total_size as f64) * 100.0 
            } else { 
                0.0 
            };

            // 每下载一定量数据发送一次进度更新
            if downloaded % (1024 * 1024) == 0 || downloaded == total_size {
                let progress = DownloadProgress {
                    id: request.id.clone(),
                    total_size,
                    downloaded,
                    percentage,
                    speed,
                    status: DownloadStatus::Downloading,
                };
                let _ = app_handle.emit("download-progress", &progress);
            }
        }

        // 下载完成
        let progress = DownloadProgress {
            id: request.id.clone(),
            total_size,
            downloaded,
            percentage: 100.0,
            speed: 0.0,
            status: DownloadStatus::Completed,
        };
        let _ = app_handle.emit("download-progress", &progress);

        Ok(file_path)
    }

    /// 检查是否为压缩文件
    fn is_archive_file(&self, file_path: &Path) -> bool {
        if let Some(extension) = file_path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            matches!(ext.as_str(), "zip")
        } else {
            false
        }
    }

    /// 解压文件
    async fn extract_archive<R: tauri::Runtime>(
        &self,
        app_handle: &tauri::AppHandle<R>,
        archive_path: &Path,
        request: &DownloadRequest,
    ) -> Result<PathBuf> {
        let extract_dir = archive_path.parent().unwrap().join(&request.software_name);
        fs::create_dir_all(&extract_dir)
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;

        // 发送解压开始事件
        let progress = DownloadProgress {
            id: request.id.clone(),
            total_size: 0,
            downloaded: 0,
            percentage: 0.0,
            speed: 0.0,
            status: DownloadStatus::Extracting,
        };
        let _ = app_handle.emit("download-progress", &progress);

        let extension = archive_path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        match extension.as_str() {
            "zip" => self.extract_zip(archive_path, &extract_dir).await?,
            "7z" => {
                // 暂时不支持7z，返回错误提示
                return Err(HoutError::UnsupportedFormat("7z格式暂不支持自动解压，请手动解压".to_string()));
            },
            _ => return Err(HoutError::UnsupportedFormat(format!("不支持的压缩格式: {}", extension))),
        }

        // 发送解压完成事件
        let progress = DownloadProgress {
            id: request.id.clone(),
            total_size: 0,
            downloaded: 0,
            percentage: 100.0,
            speed: 0.0,
            status: DownloadStatus::ExtractCompleted,
        };
        let _ = app_handle.emit("download-progress", &progress);

        Ok(extract_dir)
    }

    /// 解压ZIP文件
    async fn extract_zip(&self, archive_path: &Path, extract_dir: &Path) -> Result<()> {
        
        let file = fs::File::open(archive_path)
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;
        let mut archive = zip::ZipArchive::new(file)
            .map_err(|e| HoutError::ExtractionError(e.to_string()))?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)
                .map_err(|e| HoutError::ExtractionError(e.to_string()))?;
            
            let outpath = match file.enclosed_name() {
                Some(path) => extract_dir.join(path),
                None => continue,
            };

            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath)
                    .map_err(|e| HoutError::IoError { message: e.to_string() })?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p)
                            .map_err(|e| HoutError::IoError { message: e.to_string() })?;
                    }
                }
                let mut outfile = fs::File::create(&outpath)
                    .map_err(|e| HoutError::IoError { message: e.to_string() })?;
                io::copy(&mut file, &mut outfile)
                    .map_err(|e| HoutError::IoError { message: e.to_string() })?;
            }
        }

        Ok(())
    }



    /// 创建配置文件
    fn create_config_file(&self, extract_dir: &Path, openname: &str) -> Result<()> {
        let config_path = extract_dir.join("launch.cfg");
        let config_content = format!(
            "# HOUT软件启动配置文件\n# 生成时间: {}\n\n[launch]\nopenname={}\n",
            chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
            openname
        );

        fs::write(&config_path, config_content)
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;

        // 同时创建JSON格式的配置文件
        let json_config_path = extract_dir.join("config.json");
        let json_config = serde_json::json!({
            "openname": openname,
            "created_at": chrono::Utc::now().to_rfc3339(),
            "created_by": "HOUT"
        });

        fs::write(&json_config_path, serde_json::to_string_pretty(&json_config).unwrap())
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;

        Ok(())
    }
}
