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
    pub file_path: Option<String>,
    pub extract_path: Option<String>,
    pub error: Option<String>,
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

    /// 获取应用程序下载目录
    fn get_app_downloads_dir() -> Result<PathBuf> {
        // 尝试获取应用程序可执行文件所在目录
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let downloads_dir = exe_dir.join("downloads");
                println!("🎯 使用应用程序目录下的downloads: {}", downloads_dir.display());
                return Ok(downloads_dir);
            }
        }

        // 如果无法获取可执行文件目录，使用应用数据目录作为备选
        if let Some(data_dir) = dirs::data_dir() {
            let app_data_dir = data_dir.join("ADMT").join("downloads");
            println!("🎯 使用应用数据目录: {}", app_data_dir.display());
            return Ok(app_data_dir);
        }

        // 最后回退到临时目录
        let temp_dir = std::env::temp_dir().join("admt_downloads");
        println!("🎯 使用临时目录: {}", temp_dir.display());
        Ok(temp_dir)
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
            println!("🗜️ 检测到压缩文件，开始自动解压: {}", downloaded_file.display());
            let extract_dir = self.extract_archive(app_handle, &downloaded_file, &request).await?;

            // 3. 生成配置文件
            if let Some(openname) = &request.openname {
                println!("📝 生成配置文件: {}", openname);
                self.create_config_file(&extract_dir, openname)?;
            }

            // 4. 保留原压缩文件（根据用户要求）
            println!("✅ 解压完成，保留原压缩文件: {}", downloaded_file.display());

            Ok(extract_dir)
        } else {
            println!("📄 非压缩文件，无需解压: {}", downloaded_file.display());
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
        
        // 获取应用程序下载目录
        let app_downloads_dir = Self::get_app_downloads_dir()?;

        // 构建文件名
        let file_extension = request.file_extension.as_deref().unwrap_or("bin");
        let filename = format!("{}.{}", request.software_name, file_extension);
        let file_path = app_downloads_dir.join(&filename);

        // 确保下载目录存在
        if let Some(parent) = file_path.parent() {
            println!("📁 创建下载目录: {}", parent.display());
            fs::create_dir_all(parent)
                .map_err(|e| HoutError::IoError { message: e.to_string() })?;
        }

        println!("📁 创建下载文件: {}", file_path.display());
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
            file_path: None,
            extract_path: None,
            error: None,
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
                    file_path: None,
                    extract_path: None,
                    error: None,
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
            file_path: Some(file_path.to_string_lossy().to_string()),
            extract_path: None,
            error: None,
        };
        let _ = app_handle.emit("download-progress", &progress);

        println!("✅ 文件下载完成: {}", file_path.display());
        Ok(file_path)
    }

    /// 检查是否为压缩文件
    fn is_archive_file(&self, file_path: &Path) -> bool {
        if let Some(extension) = file_path.extension() {
            let ext = extension.to_string_lossy().to_lowercase();
            matches!(ext.as_str(), "zip" | "7z")
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
            file_path: Some(archive_path.to_string_lossy().to_string()),
            extract_path: None,
            error: None,
        };
        let _ = app_handle.emit("download-progress", &progress);

        let extension = archive_path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("")
            .to_lowercase();

        match extension.as_str() {
            "zip" => self.extract_zip(archive_path, &extract_dir).await?,
            "7z" => self.extract_7z(archive_path, &extract_dir).await?,
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
            file_path: None,
            extract_path: Some(extract_dir.to_string_lossy().to_string()),
            error: None,
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

    /// 解压7Z文件
    async fn extract_7z(&self, archive_path: &Path, extract_dir: &Path) -> Result<()> {
        println!("🗜️ 开始解压7z文件: {}", archive_path.display());

        // 使用sevenz_rust的decompress_file函数进行解压
        sevenz_rust::decompress_file(archive_path, extract_dir)
            .map_err(|e| HoutError::ExtractionError(format!("7z文件解压失败: {}", e)))?;

        println!("✅ 7z文件解压完成");
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
            "created_by": "ADMT-By LACS"
        });

        fs::write(&json_config_path, serde_json::to_string_pretty(&json_config).unwrap())
            .map_err(|e| HoutError::IoError { message: e.to_string() })?;

        Ok(())
    }
}
