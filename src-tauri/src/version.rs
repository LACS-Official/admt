#![allow(dead_code)]

use reqwest;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppVersion {
    pub version: String,
    pub build_date: String,
    pub commit_hash: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VersionConfig {
    pub version: String,
    #[serde(rename = "buildNumber")]
    pub build_number: u32,
    #[serde(rename = "versionName")]
    pub version_name: String,
    #[serde(rename = "releaseDate")]
    pub release_date: String,
    pub description: Option<String>,
    pub changelog: Option<Vec<String>>,
}

/// 从版本配置文件读取版本信息
fn read_version_config() -> Result<VersionConfig, String> {
    // 尝试读取版本配置文件
    let config_paths = [
        "version.config.json",
        "../version.config.json",
        "../../version.config.json",
    ];

    for config_path in &config_paths {
        if Path::new(config_path).exists() {
            match fs::read_to_string(config_path) {
                Ok(content) => match serde_json::from_str::<VersionConfig>(&content) {
                    Ok(config) => {
                        println!("✅ 成功读取版本配置文件: {}", config_path);
                        return Ok(config);
                    }
                    Err(e) => {
                        eprintln!("❌ 版本配置文件格式错误 {}: {}", config_path, e);
                    }
                },
                Err(e) => {
                    eprintln!("❌ 读取版本配置文件失败 {}: {}", config_path, e);
                }
            }
        }
    }

    // 如果无法读取配置文件，返回默认配置
    eprintln!("⚠️  无法读取版本配置文件，使用默认版本信息");
    Ok(VersionConfig {
        version: env!("CARGO_PKG_VERSION").to_string(),
        build_number: 1,
        version_name: env!("CARGO_PKG_VERSION").to_string(),
        release_date: "2025-01-11".to_string(),
        description: Some("默认版本配置".to_string()),
        changelog: None,
    })
}

/// 获取统一的版本号（优先使用配置文件）
fn get_unified_version() -> String {
    match read_version_config() {
        Ok(config) => config.version,
        Err(_) => env!("CARGO_PKG_VERSION").to_string(),
    }
}

#[command]
pub fn get_app_version() -> Result<String, String> {
    // 优先使用统一版本配置
    let version = get_unified_version();
    Ok(version)
}

#[command]
pub fn get_app_info() -> Result<AppVersion, String> {
    // 优先使用统一版本配置
    let version = get_unified_version();
    let build_date = env!("BUILD_DATE");

    // 在编译时获取Git提交哈希（如果可用）
    let commit_hash = option_env!("GIT_HASH").map(|s| s.to_string());

    Ok(AppVersion {
        version,
        build_date: build_date.to_string(),
        commit_hash,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCheckResult {
    pub has_update: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub download_url: Option<String>,
    pub release_notes: Option<String>,
    pub updated_at: Option<String>,
    pub error: Option<String>,
}

#[command]
pub async fn check_for_updates() -> Result<UpdateCheckResult, String> {
    let current_version = get_unified_version();

    // API端点配置
    let api_url = "https://api-g.lacs.cc/app/software/id/1";

    match check_version_from_api(&api_url, &current_version).await {
        Ok(result) => Ok(result),
        Err(e) => {
            // 网络错误时返回默认结果
            Ok(UpdateCheckResult {
                has_update: false,
                current_version: current_version.to_string(),
                latest_version: Some(current_version.to_string()),
                download_url: None,
                release_notes: None,
                updated_at: None,
                error: Some(format!("版本检查失败: {}", e)),
            })
        }
    }
}

async fn check_version_from_api(
    api_url: &str,
    current_version: &str,
) -> Result<UpdateCheckResult, Box<dyn std::error::Error>> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()?;

    let response = client
        .get(api_url)
        .header("User-Agent", format!("ADMT/{}", current_version))
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(format!("API请求失败: {}", response.status()).into());
    }

    let api_response: serde_json::Value = response.json().await?;

    // 检查API响应是否成功
    if api_response["success"].as_bool().unwrap_or(false) {
        let data = &api_response["data"];
        let latest_version = data["currentVersion"].as_str().unwrap_or(current_version);
        let official_website = data["officialWebsite"].as_str().unwrap_or("");
        let updated_at = data["updatedAt"].as_str().unwrap_or("");

        // 清理下载链接，移除可能存在的反引号
        let clean_download_url = official_website.trim_matches('`').trim();

        let has_update = compare_versions(current_version, latest_version);

        Ok(UpdateCheckResult {
            has_update,
            current_version: current_version.to_string(),
            latest_version: Some(latest_version.to_string()),
            download_url: if clean_download_url.is_empty() { None } else { Some(clean_download_url.to_string()) },
            release_notes: None,
            updated_at: Some(updated_at.to_string()),
            error: None,
        })
    } else {
        Err("API返回失败状态".into())
    }
}

fn compare_versions(current: &str, latest: &str) -> bool {
    // 清理版本号，移除可能的前缀（如 'v'）
    let clean_current = current.trim_start_matches('v').trim();
    let clean_latest = latest.trim_start_matches('v').trim();
    
    // 分割版本号并转换为数字数组
    let current_parts: Vec<u32> = clean_current.split('.')
        .filter_map(|s| s.parse().ok())
        .collect();
    let latest_parts: Vec<u32> = clean_latest.split('.')
        .filter_map(|s| s.parse().ok())
        .collect();
    
    // 确保两个版本号长度一致，不足的部分补0
    let max_len = std::cmp::max(current_parts.len(), latest_parts.len());
    let current_padded: Vec<u32> = current_parts.iter()
        .cloned()
        .chain(std::iter::repeat(0).take(max_len - current_parts.len()))
        .collect();
    let latest_padded: Vec<u32> = latest_parts.iter()
        .cloned()
        .chain(std::iter::repeat(0).take(max_len - latest_parts.len()))
        .collect();
    
    // 逐位比较版本号
    for i in 0..max_len {
        if latest_padded[i] > current_padded[i] {
            return true;
        } else if latest_padded[i] < current_padded[i] {
            return false;
        }
    }
    
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_version() {
        let result = get_app_version();
        assert!(result.is_ok());
        let version = result.unwrap();
        assert!(!version.is_empty());

        // 验证版本格式
        let parts: Vec<&str> = version.split('.').collect();
        assert_eq!(parts.len(), 3, "版本号应该是 major.minor.patch 格式");
    }

    #[test]
    fn test_get_app_info() {
        let result = get_app_info();
        assert!(result.is_ok());
        let info = result.unwrap();
        assert!(!info.version.is_empty());
        assert!(!info.build_date.is_empty());
    }

    #[test]
    fn test_compare_versions() {
        // 基本版本比较
        assert_eq!(compare_versions("1.0.0", "1.0.1"), true);
        assert_eq!(compare_versions("1.0.1", "1.0.0"), false);
        assert_eq!(compare_versions("1.0.0", "1.0.0"), false);
        assert_eq!(compare_versions("1.0.0", "2.0.0"), true);
        assert_eq!(compare_versions("2.0.0", "1.0.0"), false);
        
        // 带前缀的版本比较
        assert_eq!(compare_versions("v1.0.0", "1.0.1"), true);
        assert_eq!(compare_versions("1.0.0", "v1.0.1"), true);
        assert_eq!(compare_versions("v1.0.0", "v1.0.1"), true);
        assert_eq!(compare_versions("v1.0.1", "v1.0.0"), false);
        
        // 不同长度版本号比较
        assert_eq!(compare_versions("1.0", "1.0.1"), true);
        assert_eq!(compare_versions("1.0.1", "1.0"), false);
        assert_eq!(compare_versions("1", "1.0.1"), true);
        assert_eq!(compare_versions("1.0.1", "1"), false);
        
        // 复杂版本号比较
        assert_eq!(compare_versions("1.2.3", "1.2.4"), true);
        assert_eq!(compare_versions("1.2.3", "1.3.0"), true);
        assert_eq!(compare_versions("1.2.3", "2.0.0"), true);
        assert_eq!(compare_versions("2.0.0", "1.2.3"), false);
        assert_eq!(compare_versions("1.3.0", "1.2.3"), false);
        assert_eq!(compare_versions("1.2.4", "1.2.3"), false);
    }
}
