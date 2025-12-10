use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::error::{AdmtError, Result};

// 获取应用程序下载目录
fn get_app_downloads_dir() -> Result<std::path::PathBuf> {
    // 尝试获取应用程序可执行文件所在目录
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            let downloads_dir = exe_dir.join("downloads");
            return Ok(downloads_dir);
        }
    }
    
    // 如果无法获取可执行文件目录，使用用户文档目录
    if let Some(home_dir) = dirs::document_dir() {
        let downloads_dir = home_dir.join("ADMT").join("downloads");
        return Ok(downloads_dir);
    }
    
    // 最后使用临时目录
    Ok(std::env::temp_dir().join("admt_downloads"))
}

/// ROM信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RomInfo {
    pub id: String,
    pub version: String,
    pub codename: String,
    pub size: String,
    pub rom_type: String,
    pub date: String,
    pub url: String,
    pub token: Option<String>,
    pub device_code: Option<String>,
    pub android_version: Option<String>,
    pub miui_version: Option<String>,
    pub description: Option<String>,
}

/// ROM列表响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RomListResponse {
    pub status: String,
    pub code: String,
    pub count: String,
    pub data: std::collections::HashMap<String, String>,
}

/// 获取ROM列表
#[tauri::command]
pub async fn fetch_rom_list(device_code: String, token: Option<String>) -> Result<RomListResponse> {
    log::info!("正在获取设备 {} 的ROM列表", device_code);

    let client = Client::new();
    
    // 构建请求URL
    let mut api_url = format!("https://rom.jilin9527.top/api/v1/ls/?code={}", device_code);
    
    // 如果有token，添加到URL
    if let Some(token_str) = &token {
        api_url.push_str(&format!("&token={}", token_str));
    }
    
    match client.get(&api_url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        log::info!("成功获取ROM列表数据");
                        
                        // 解析API响应
                        if let (Some(status), Some(code), Some(count), Some(data_map)) = (
                            data["status"].as_str(),
                            data["code"].as_str(),
                            data["count"].as_str(),
                            data["data"].as_object()
                        ) {
                            let mut rom_data = std::collections::HashMap::new();
                            
                            // 转换为HashMap<String, String>
                            for (key, value) in data_map {
                                if let Some(value_str) = value.as_str() {
                                    rom_data.insert(key.clone(), value_str.to_string());
                                }
                            }

                            Ok(RomListResponse {
                                status: status.to_string(),
                                code: code.to_string(),
                                count: count.to_string(),
                                data: rom_data,
                            })
                        } else {
                            log::error!("API响应格式不正确");
                            Ok(RomListResponse {
                                status: "400".to_string(),
                                code: device_code,
                                count: "0".to_string(),
                                data: std::collections::HashMap::new(),
                            })
                        }
                    }
                    Err(e) => {
                        log::error!("解析ROM列表响应失败: {}", e);
                        Ok(RomListResponse {
                            status: "400".to_string(),
                            code: device_code,
                            count: "0".to_string(),
                            data: std::collections::HashMap::new(),
                        })
                    }
                }
            } else {
                log::error!("获取ROM列表失败，状态码: {}", response.status());
                Ok(RomListResponse {
                    status: response.status().to_string(),
                    code: device_code,
                    count: "0".to_string(),
                    data: std::collections::HashMap::new(),
                })
            }
        }
        Err(e) => {
            log::error!("网络请求失败: {}", e);
            Ok(RomListResponse {
                status: "503".to_string(),
                code: device_code,
                count: "0".to_string(),
                data: std::collections::HashMap::new(),
            })
        }
    }
}

/// 下载ROM响应
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RomDownloadResponse {
    pub status: String,
    pub device_code: String,
    pub version: String,
    pub file_type: String,
    pub download_url: Option<String>,
    pub expires_in: Option<String>,
    pub remaining_access: Option<i32>,
}

/// 获取下载链接
#[tauri::command]
pub async fn get_rom_download_url(
    device_code: String,
    version: String,
    file_type: String,
    token: Option<String>,
) -> Result<RomDownloadResponse> {
    log::info!("正在获取ROM下载链接: {} {} ({})", device_code, version, file_type);

    let client = Client::new();
    
    // 构建请求URL
    let mut api_url = format!(
        "https://Rom.jilin9527.top/api/v1/download/?code={}&version={}&type={}",
        device_code, version, file_type
    );

    // 如果有token，添加到URL
    if let Some(token_str) = &token {
        api_url.push_str(&format!("&token={}", token_str));
    }
    
    match client.get(&api_url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(data) => {
                        log::info!("成功获取ROM下载链接");
                        
                        // 解析API响应
                        if let (Some(status), Some(device), Some(ver), Some(ftype), Some(download_url)) = (
                            data["status"].as_str(),
                            data["device_code"].as_str(),
                            data["version"].as_str(),
                            data["file_type"].as_str(),
                            data["download_url"].as_str()
                        ) {
                            Ok(RomDownloadResponse {
                                status: status.to_string(),
                                device_code: device.to_string(),
                                version: ver.to_string(),
                                file_type: ftype.to_string(),
                                download_url: Some(download_url.to_string()),
                                expires_in: data["expires_in"].as_str().map(|s| s.to_string()),
                                remaining_access: data["remaining_access"].as_i64().map(|n| n as i32),
                            })
                        } else {
                            log::error!("API响应格式不正确");
                            Ok(RomDownloadResponse {
                                status: "400".to_string(),
                                device_code,
                                version,
                                file_type,
                                download_url: None,
                                expires_in: None,
                                remaining_access: None,
                            })
                        }
                    }
                    Err(e) => {
                        log::error!("解析ROM下载链接响应失败: {}", e);
                        Ok(RomDownloadResponse {
                            status: "400".to_string(),
                            device_code,
                            version,
                            file_type,
                            download_url: None,
                            expires_in: None,
                            remaining_access: None,
                        })
                    }
                }
            } else {
                log::error!("获取ROM下载链接失败，状态码: {}", response.status());
                Ok(RomDownloadResponse {
                    status: response.status().to_string(),
                    device_code,
                    version,
                    file_type,
                    download_url: None,
                    expires_in: None,
                    remaining_access: None,
                })
            }
        }
        Err(e) => {
            log::error!("网络请求失败: {}", e);
            Ok(RomDownloadResponse {
                status: "503".to_string(),
                device_code,
                version,
                file_type,
                download_url: None,
                expires_in: None,
                remaining_access: None,
            })
        }
    }
}

/// 下载ROM
#[tauri::command]
pub async fn download_rom(
    device_code: String,
    version: String,
    file_type: String,
    token: Option<String>,
) -> Result<RomDownloadResponse> {
    log::info!("正在下载ROM: {} {} ({})", device_code, version, file_type);

    // 首先获取下载链接
    let download_response = get_rom_download_url(
        device_code.clone(),
        version.clone(),
        file_type.clone(),
        token.clone()
    ).await?;
    
    if download_response.status != "200" {
        return Ok(download_response);
    }
    
    if let Some(download_url) = &download_response.download_url {
        // 创建下载目录
        let downloads_dir = get_app_downloads_dir()?;
        let roms_dir = downloads_dir.join("roms");
        tokio::fs::create_dir_all(&roms_dir)
            .await
            .map_err(|e| AdmtError::Io(format!("创建下载目录失败: {}", e)))?;

        // 生成文件名
        let file_name = format!("{}_{}_{}.{}", device_code, version, file_type, file_type);
        let file_path = roms_dir.join(&file_name);

        // 开始下载
        let client = Client::new();
        
        match client.get(download_url)
            .timeout(std::time::Duration::from_secs(300)) // 5分钟超时
            .send()
            .await
        {
            Ok(response) => {
                if response.status().is_success() {
                    // 保存文件
                    let bytes = response.bytes()
                        .await
                        .map_err(|e| AdmtError::Network(format!("下载文件失败: {}", e)))?;

                    tokio::fs::write(&file_path, &bytes)
                        .await
                        .map_err(|e| AdmtError::Io(format!("保存文件失败: {}", e)))?;

                    log::info!("ROM下载成功: {} ({} bytes)", file_name, bytes.len());

                    Ok(RomDownloadResponse {
                        status: "200".to_string(),
                        device_code,
                        version,
                        file_type,
                        download_url: Some(format!("file://{}", file_path.display())),
                        expires_in: download_response.expires_in,
                        remaining_access: download_response.remaining_access,
                    })
                } else {
                    log::error!("下载ROM失败，状态码: {}", response.status());
                    Ok(RomDownloadResponse {
                        status: response.status().to_string(),
                        device_code,
                        version,
                        file_type,
                        download_url: None,
                        expires_in: None,
                        remaining_access: None,
                    })
                }
            }
            Err(e) => {
                log::error!("下载ROM网络错误: {}", e);
                Ok(RomDownloadResponse {
                    status: "503".to_string(),
                    device_code,
                    version,
                    file_type,
                    download_url: None,
                    expires_in: None,
                    remaining_access: None,
                })
            }
        }
    } else {
        log::error!("获取下载链接失败");
        Ok(RomDownloadResponse {
            status: "400".to_string(),
            device_code,
            version,
            file_type,
            download_url: None,
            expires_in: None,
            remaining_access: None,
        })
    }
}
