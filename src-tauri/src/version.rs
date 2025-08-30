use tauri::command;
use serde::{Deserialize, Serialize};
use reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppVersion {
    pub version: String,
    pub build_date: String,
    pub commit_hash: Option<String>,
}

#[command]
pub fn get_app_version() -> Result<String, String> {
    // 从Cargo.toml获取版本信息
    let version = env!("CARGO_PKG_VERSION");
    Ok(version.to_string())
}

#[command]
pub fn get_app_info() -> Result<AppVersion, String> {
    let version = env!("CARGO_PKG_VERSION");
    let build_date = env!("BUILD_DATE");
    
    // 在编译时获取Git提交哈希（如果可用）
    let commit_hash = option_env!("GIT_HASH").map(|s| s.to_string());
    
    Ok(AppVersion {
        version: version.to_string(),
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
    pub error: Option<String>,
}

#[command]
pub async fn check_for_updates() -> Result<UpdateCheckResult, String> {
    let current_version = env!("CARGO_PKG_VERSION");
    
    // API端点配置
    let api_url = if cfg!(debug_assertions) {
        "http://localhost:3001/api/version/check"
    } else {
        "https://api-g.lacs.cc/api/version/check"
    };
    
    match check_version_from_api(api_url, current_version).await {
        Ok(result) => Ok(result),
        Err(e) => {
            // 网络错误时返回默认结果
            Ok(UpdateCheckResult {
                has_update: false,
                current_version: current_version.to_string(),
                latest_version: Some(current_version.to_string()),
                download_url: None,
                release_notes: None,
                error: Some(format!("版本检查失败: {}", e)),
            })
        }
    }
}

async fn check_version_from_api(api_url: &str, current_version: &str) -> Result<UpdateCheckResult, Box<dyn std::error::Error>> {
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
    
    let latest_version = api_response["version"]
        .as_str()
        .unwrap_or(current_version);
    
    let has_update = compare_versions(current_version, latest_version);
    
    Ok(UpdateCheckResult {
        has_update,
        current_version: current_version.to_string(),
        latest_version: Some(latest_version.to_string()),
        download_url: api_response["downloadUrl"].as_str().map(|s| s.to_string()),
        release_notes: api_response["releaseNotes"].as_str().map(|s| s.to_string()),
        error: None,
    })
}

fn compare_versions(current: &str, latest: &str) -> bool {
    // 简单的版本比较逻辑
    if current == latest {
        return false;
    }
    
    let current_parts: Vec<u32> = current.split('.')
        .filter_map(|s| s.parse().ok())
        .collect();
    let latest_parts: Vec<u32> = latest.split('.')
        .filter_map(|s| s.parse().ok())
        .collect();
    
    for i in 0..std::cmp::max(current_parts.len(), latest_parts.len()) {
        let current_part = current_parts.get(i).unwrap_or(&0);
        let latest_part = latest_parts.get(i).unwrap_or(&0);
        
        if latest_part > current_part {
            return true;
        } else if latest_part < current_part {
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
        assert_eq!(compare_versions("1.0.0", "1.0.1"), true);
        assert_eq!(compare_versions("1.0.1", "1.0.0"), false);
        assert_eq!(compare_versions("1.0.0", "1.0.0"), false);
        assert_eq!(compare_versions("1.0.0", "2.0.0"), true);
        assert_eq!(compare_versions("2.0.0", "1.0.0"), false);
    }
}