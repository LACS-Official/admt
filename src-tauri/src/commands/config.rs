use crate::cache::get_cache_manager;
use crate::error::{AdmtError, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

fn default_true() -> bool {
    true
}

/// 用户偏好配置
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserConfiguration {
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub language: String,
    #[serde(default)]
    pub theme: String,
    #[serde(default, rename = "autoStart")]
    pub auto_start: bool,
    #[serde(default, rename = "checkUpdates")]
    pub check_updates: bool,
    #[serde(default, rename = "enableTelemetry")]
    pub enable_telemetry: bool,
    pub ai: Option<serde_json::Value>,
}

/// 应用全局配置（开源纯净版，无需商业验证）
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    #[serde(default = "default_true", rename = "isActivated")]
    pub is_activated: bool,
    #[serde(default, rename = "activationStatus")]
    pub activation_status: String,
    #[serde(default, rename = "userConfig")]
    pub user_config: UserConfiguration,
    #[serde(default, rename = "features")]
    pub features: Vec<String>,
    #[serde(default)]
    pub version: String,
}

/// 验证激活码格式（兼容旧接口，开源版本恒真）
#[tauri::command]
pub async fn validate_activation_code_format(_activation_code: String) -> Result<bool> {
    Ok(true)
}

/// 激活应用（开源版本默认已激活）
#[tauri::command]
pub async fn activate_application(_request: serde_json::Value) -> Result<serde_json::Value> {
    Ok(serde_json::json!({
        "success": true,
        "status": "activated",
        "message": "开源版本已默认激活"
    }))
}

/// 检查激活状态（开源版本永不过期、免激活）
#[tauri::command]
pub async fn check_activation_status() -> Result<serde_json::Value> {
    Ok(serde_json::json!({
        "isActivated": true,
        "isExpired": false,
        "needsActivation": false,
        "message": "开源版本无需激活"
    }))
}

/// 验证本地存储数据（开源版本无害化处理）
#[tauri::command]
pub async fn validate_local_activation_data(_encrypted_data: String) -> Result<bool> {
    Ok(true)
}

/// 检查激活到期时间（开源版本永不到期）
#[tauri::command]
pub async fn check_activation_expiry(_activation_data: String) -> Result<serde_json::Value> {
    Ok(serde_json::json!({
        "isExpired": false,
        "remainingTime": 3153600000_i64,
        "message": "开源版本永不到期"
    }))
}

/// 生成设备指纹用于激活验证
#[tauri::command]
pub async fn get_device_fingerprint() -> Result<String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    log::info!("Generating device fingerprint");

    // 获取系统信息生成设备指纹
    let mut hasher = DefaultHasher::new();

    // 添加操作系统信息
    std::env::consts::OS.hash(&mut hasher);
    std::env::consts::ARCH.hash(&mut hasher);

    // 添加时间戳确保唯一性（在实际应用中应使用硬件信息）
    let timestamp = chrono::Utc::now().timestamp();
    timestamp.hash(&mut hasher);

    let fingerprint = format!("device_{:x}", hasher.finish());
    log::info!("Generated device fingerprint: {}", fingerprint);

    Ok(fingerprint)
}

/// 获取应用配置
#[tauri::command]
pub async fn get_app_config(app: tauri::AppHandle) -> Result<Option<AppConfig>> {
    let path = get_config_path(&app)?;
    if !path.exists() {
        log::info!("Config file not found at: {}", path.display());
        return Ok(None);
    }

    match std::fs::read_to_string(&path) {
        Ok(content) => match serde_json::from_str::<AppConfig>(&content) {
            Ok(config) => {
                log::info!("Successfully loaded app config from: {}", path.display());
                Ok(Some(config))
            }
            Err(e) => {
                log::error!("Failed to parse app config: {}", e);
                Err(AdmtError::ParseError {
                    message: e.to_string(),
                })
            }
        },
        Err(e) => {
            log::error!("Failed to read app config file: {}", e);
            Err(AdmtError::Io(e.to_string()))
        }
    }
}

/// 保存应用配置
#[tauri::command]
pub async fn save_app_config(app: tauri::AppHandle, config: AppConfig) -> Result<bool> {
    log::info!(
        "Saving app config for user: {}",
        config.user_config.username
    );

    let path = get_config_path(&app)?;
    match serde_json::to_string_pretty(&config) {
        Ok(content) => match std::fs::write(&path, content) {
            Ok(_) => {
                log::info!("Successfully saved app config to: {}", path.display());
                Ok(true)
            }
            Err(e) => {
                log::error!("Failed to write app config file: {}", e);
                Err(AdmtError::Io(e.to_string()))
            }
        },
        Err(e) => {
            log::error!("Failed to serialize app config: {}", e);
            Err(AdmtError::ParseError {
                message: e.to_string(),
            })
        }
    }
}

// ==================== 安全配置相关命令 ====================

/// 安全配置结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub api_base_url: String,
    pub app_id: String,
    pub app_secret: String,
    pub signature_secret: String,
    pub enable_signature: bool,
    pub enable_strict_user_agent: bool,
    pub app_version: String,
    pub software_id: i32,
}

/// 获取安全配置
#[tauri::command]
pub async fn get_security_config() -> Result<SecurityConfig> {
    log::info!("Getting security configuration");

    // 检测当前环境
    let is_debug = cfg!(debug_assertions);

    let config = SecurityConfig {
        api_base_url: "https://api-g.lacs.cc".to_string(),
        app_id: "wanjiguanjia-desktop-v1.0.0".to_string(),
        app_secret: std::env::var("APP_SECRET").unwrap_or_else(|_| "default_app_secret".to_string()),
        signature_secret: std::env::var("SIGNATURE_SECRET").unwrap_or_else(|_| "default_signature_secret".to_string()),
        enable_signature: !is_debug,
        enable_strict_user_agent: !is_debug,
        app_version: "1.0.0".to_string(),
        software_id: 1,
    };

    log::info!(
        "Security configuration loaded successfully, debug_mode: {}",
        is_debug
    );
    Ok(config)
}

/// 验证安全配置
#[tauri::command]
pub async fn validate_security_config() -> Result<bool> {
    log::info!("Validating security configuration");

    match get_security_config().await {
        Ok(config) => {
            if config.app_secret.len() < 16 {
                log::error!("App secret is too weak");
                return Ok(false);
            }

            if config.api_base_url.is_empty() {
                log::error!("API base URL is empty");
                return Ok(false);
            }

            log::info!("Security configuration validation passed");
            Ok(true)
        }
        Err(e) => {
            log::error!("Failed to validate security configuration: {}", e);
            Ok(false)
        }
    }
}

/// 详细设备指纹结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedDeviceFingerprint {
    pub fingerprint: String,
    pub os: String,
    pub arch: String,
    pub hostname: String,
    pub timestamp: i64,
}

/// 获取详细设备指纹（用于用户行为统计）
#[tauri::command]
pub async fn get_detailed_device_fingerprint() -> Result<DetailedDeviceFingerprint> {
    log::info!("Generating detailed device fingerprint for usage tracking");

    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    // 获取系统信息
    let os = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    let hostname = hostname::get()
        .unwrap_or_else(|_| std::ffi::OsString::from("unknown"))
        .to_string_lossy()
        .to_string();

    // 获取当前时间戳
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    // 生成设备指纹
    let mut hasher = DefaultHasher::new();
    os.hash(&mut hasher);
    arch.hash(&mut hasher);
    hostname.hash(&mut hasher);

    if let Ok(username) = std::env::var("USERNAME").or_else(|_| std::env::var("USER")) {
        username.hash(&mut hasher);
    }

    let fingerprint_hash = hasher.finish();
    let fingerprint = format!("fp_{:016x}", fingerprint_hash);

    let device_fingerprint = DetailedDeviceFingerprint {
        fingerprint,
        os,
        arch,
        hostname,
        timestamp,
    };

    log::info!("Detailed device fingerprint generated successfully");
    Ok(device_fingerprint)
}

/// 获取缓存统计信息
#[tauri::command]
pub async fn get_cache_stats() -> Result<serde_json::Value> {
    let cache_manager = get_cache_manager();
    let stats = cache_manager.get_stats().await;
    let cache_info = cache_manager.get_cache_info().await;

    let mut result = serde_json::json!({
        "path_cache_hits": stats.path_cache_hits,
        "path_cache_misses": stats.path_cache_misses,
        "device_cache_hits": stats.device_cache_hits,
        "device_cache_misses": stats.device_cache_misses,
        "cache_evictions": stats.cache_evictions,
        "path_hit_rate": stats.path_hit_rate(),
        "device_hit_rate": stats.device_hit_rate(),
        "uptime_seconds": stats.last_reset.elapsed().as_secs(),
    });

    for (key, value) in cache_info {
        result[key] = serde_json::Value::from(value);
    }

    Ok(result)
}

/// 清除所有缓存
#[tauri::command]
pub async fn clear_all_cache() -> Result<()> {
    let cache_manager = get_cache_manager();
    cache_manager.clear_all().await;
    log::info!("All caches cleared by user request");
    Ok(())
}

/// 监听配置文件变化
#[tauri::command]
pub async fn watch_config_file(_app_handle: tauri::AppHandle, window: tauri::Window) -> Result<()> {
    use notify::{Event, EventKind, RecursiveMode, Watcher};
    use std::sync::mpsc;
    use std::sync::Arc;
    use std::sync::Mutex;
    use std::time::Duration;
    use tauri::Emitter;

    let config_path = super::fs::get_config_file_path()
        .map_err(|e| AdmtError::Io(format!("Failed to get config path: {}", e)))?;

    let (tx, rx) = mpsc::channel();
    let mut watcher = notify::recommended_watcher(tx)
        .map_err(|e| AdmtError::Io(format!("Failed to create file watcher: {}", e)))?;

    let config_dir = config_path
        .parent()
        .ok_or_else(|| AdmtError::Io("Failed to get config directory".to_string()))?;

    watcher
        .watch(config_dir, RecursiveMode::NonRecursive)
        .map_err(|e| AdmtError::Io(format!("Failed to watch config directory: {}", e)))?;

    log::info!("Started watching config file: {}", config_path.display());

    let last_modified = Arc::new(Mutex::new(None));
    let config_path_clone = config_path.clone();
    let last_modified_clone = last_modified.clone();

    tauri::async_runtime::spawn(async move {
        while let Ok(event) = rx.recv() {
            match event {
                Ok(Event {
                    kind: EventKind::Modify(_),
                    paths,
                    ..
                }) => {
                    if paths.contains(&config_path_clone) {
                        if let Ok(metadata) = std::fs::metadata(&config_path_clone) {
                            if let Ok(modified_time) = metadata.modified() {
                                let mut last = last_modified_clone.lock().unwrap();
                                if Some(modified_time) != *last {
                                    *last = Some(modified_time);
                                    drop(last);

                                    log::info!(
                                        "Config file modified: {}",
                                        config_path_clone.display()
                                    );
                                    let timer = tokio::time::sleep(Duration::from_millis(500));
                                    let window_clone = window.clone();
                                    let config_path_str =
                                        config_path_clone.to_string_lossy().to_string();

                                    tokio::spawn(async move {
                                        timer.await;
                                        if std::path::Path::new(&config_path_str).exists() {
                                            if let Err(e) = window_clone
                                                .emit("config-file-changed", &config_path_str)
                                            {
                                                log::error!(
                                                    "Failed to emit config file changed event: {}",
                                                    e
                                                );
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
    });

    Ok(())
}

fn get_config_path(app: &tauri::AppHandle) -> Result<PathBuf> {
    let mut path = app
        .path()
        .app_data_dir()
        .map_err(|e| AdmtError::PathResolution(e.to_string()))?;

    if !path.exists() {
        let _ = std::fs::create_dir_all(&path);
    }

    path.push("config");
    if !path.exists() {
        let _ = std::fs::create_dir_all(&path);
    }

    path.push("app_config.json");
    Ok(path)
}
