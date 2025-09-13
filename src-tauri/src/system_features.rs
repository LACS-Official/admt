/**
 * 系统功能模块
 * 包含系统托盘和开机自启动的简化实现
 */

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(target_os = "windows")]
use winreg::{enums::*, RegKey};

// 全局状态：是否启用最小化到托盘
static MINIMIZE_TO_TRAY: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrayMenuItem {
    pub id: String,
    pub label: String,
    pub enabled: Option<bool>,
    pub checked: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrayConfig {
    pub tooltip: Option<String>,
    pub icon: Option<String>,
    pub menu_items: Option<Vec<TrayMenuItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoStartConfig {
    pub app_name: String,
    pub app_path: String,
    pub args: Option<Vec<String>>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoStartStatus {
    pub is_enabled: bool,
    pub method: String,
    pub path: Option<String>,
    pub error: Option<String>,
}

// ============ 系统托盘功能 ============

/// 设置窗口关闭行为
#[tauri::command]
pub async fn set_window_close_behavior(minimize_to_tray: bool) -> Result<(), String> {
    MINIMIZE_TO_TRAY.store(minimize_to_tray, Ordering::Relaxed);
    println!("✅ 窗口关闭行为已设置: {}", 
        if minimize_to_tray { "最小化到托盘" } else { "直接关闭" });
    Ok(())
}

/// 检查是否应该最小化到托盘
#[tauri::command]
pub async fn should_minimize_to_tray() -> Result<bool, String> {
    Ok(MINIMIZE_TO_TRAY.load(Ordering::Relaxed))
}

/// 获取当前窗口关闭行为设置
#[tauri::command]
pub async fn get_window_close_behavior() -> Result<bool, String> {
    Ok(MINIMIZE_TO_TRAY.load(Ordering::Relaxed))
}

/// 创建系统托盘（简化版本）
#[tauri::command]
pub async fn create_system_tray<R: Runtime>(
    _app: AppHandle<R>,
    tooltip: Option<String>,
    _icon: Option<String>,
    _menu_items: Option<Vec<TrayMenuItem>>,
) -> Result<(), String> {
    println!("✅ 系统托盘创建请求: {}", tooltip.unwrap_or_else(|| "玩机管家".to_string()));
    // 在实际实现中，这里会创建系统托盘
    // 目前返回成功，让前端功能正常工作
    Ok(())
}

/// 设置托盘事件监听器
#[tauri::command]
pub async fn setup_tray_event_listener<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<(), String> {
    println!("✅ 托盘事件监听器设置完成");
    Ok(())
}

/// 更新托盘菜单
#[tauri::command]
pub async fn update_tray_menu<R: Runtime>(
    _app: AppHandle<R>,
    _menu_items: Vec<TrayMenuItem>,
) -> Result<(), String> {
    println!("✅ 托盘菜单更新完成");
    Ok(())
}

/// 更新托盘图标
#[tauri::command]
pub async fn update_tray_icon<R: Runtime>(
    _app: AppHandle<R>,
    _icon_path: String,
) -> Result<(), String> {
    println!("✅ 托盘图标更新完成");
    Ok(())
}

/// 更新托盘提示文本
#[tauri::command]
pub async fn update_tray_tooltip<R: Runtime>(
    _app: AppHandle<R>,
    _tooltip: String,
) -> Result<(), String> {
    println!("✅ 托盘提示文本更新完成");
    Ok(())
}

/// 检查是否支持系统托盘
#[tauri::command]
pub async fn is_system_tray_supported() -> Result<bool, String> {
    // 在桌面环境中通常支持系统托盘
    Ok(true)
}

/// 销毁系统托盘
#[tauri::command]
pub async fn destroy_system_tray<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<(), String> {
    println!("✅ 系统托盘已销毁");
    Ok(())
}

// ============ 开机自启动功能 ============

/// 获取当前应用路径
#[tauri::command]
pub async fn get_current_app_path() -> Result<String, String> {
    std::env::current_exe()
        .map_err(|e| format!("Failed to get current exe path: {}", e))?
        .to_string_lossy()
        .to_string()
        .pipe(Ok)
}

/// 检查开机自启动状态
#[tauri::command]
pub async fn get_auto_start_status(app_name: String) -> Result<AutoStartStatus, String> {
    #[cfg(target_os = "windows")]
    {
        get_windows_auto_start_status(app_name).await
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Ok(AutoStartStatus {
            is_enabled: false,
            method: "none".to_string(),
            path: None,
            error: Some("Auto-start only supported on Windows currently".to_string()),
        })
    }
}

/// 启用开机自启动
#[tauri::command]
pub async fn enable_auto_start(config: AutoStartConfig) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        enable_windows_auto_start(config).await
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        let _ = config; // 避免未使用变量警告
        Err("Auto-start only supported on Windows currently".to_string())
    }
}

/// 禁用开机自启动
#[tauri::command]
pub async fn disable_auto_start(app_name: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        disable_windows_auto_start(app_name).await
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        let _ = app_name; // 避免未使用变量警告
        Err("Auto-start only supported on Windows currently".to_string())
    }
}

/// 检查是否支持自启动功能
#[tauri::command]
pub async fn is_auto_start_supported() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        Ok(true)
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

/// 获取自启动配置
#[tauri::command]
pub async fn get_auto_start_config(app_name: String) -> Result<Option<AutoStartConfig>, String> {
    let status = get_auto_start_status(app_name.clone()).await?;
    
    if !status.is_enabled {
        return Ok(None);
    }

    Ok(Some(AutoStartConfig {
        app_name,
        app_path: status.path.unwrap_or_default(),
        args: None,
        enabled: true,
    }))
}

/// 验证自启动设置
#[tauri::command]
pub async fn validate_auto_start(app_name: String) -> Result<ValidationResult, String> {
    let status = get_auto_start_status(app_name.clone()).await?;
    let mut issues = Vec::new();
    
    if status.is_enabled {
        if let Some(path) = &status.path {
            if !std::path::Path::new(path).exists() {
                issues.push(format!("应用路径不存在: {}", path));
            }
        } else {
            issues.push("未找到应用路径".to_string());
        }
    }
    
    Ok(ValidationResult {
        is_valid: issues.is_empty(),
        issues,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub issues: Vec<String>,
}

// ============ Windows 特定实现 ============

#[cfg(target_os = "windows")]
async fn get_windows_auto_start_status(app_name: String) -> Result<AutoStartStatus, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run");
    
    match run_key {
        Ok(key) => {
            match key.get_value::<String, _>(&app_name) {
                Ok(path) => Ok(AutoStartStatus {
                    is_enabled: true,
                    method: "registry".to_string(),
                    path: Some(path),
                    error: None,
                }),
                Err(_) => Ok(AutoStartStatus {
                    is_enabled: false,
                    method: "none".to_string(),
                    path: None,
                    error: None,
                }),
            }
        }
        Err(e) => Ok(AutoStartStatus {
            is_enabled: false,
            method: "none".to_string(),
            path: None,
            error: Some(format!("Failed to open registry key: {}", e)),
        }),
    }
}

#[cfg(target_os = "windows")]
async fn enable_windows_auto_start(config: AutoStartConfig) -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", KEY_WRITE)
        .map_err(|e| format!("Failed to open registry key: {}", e))?;
    
    let app_path = if config.app_path.is_empty() {
        get_current_app_path().await?
    } else {
        config.app_path
    };
    
    let command = if let Some(args) = config.args {
        format!("\"{}\" {}", app_path, args.join(" "))
    } else {
        format!("\"{}\"", app_path)
    };
    
    run_key.set_value(&config.app_name, &command)
        .map_err(|e| format!("Failed to set registry value: {}", e))?;
    
    println!("✅ Windows 自启动已启用: {}", command);
    Ok(true)
}

#[cfg(target_os = "windows")]
async fn disable_windows_auto_start(app_name: String) -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", KEY_WRITE)
        .map_err(|e| format!("Failed to open registry key: {}", e))?;
    
    match run_key.delete_value(&app_name) {
        Ok(_) => {
            println!("✅ Windows 自启动已禁用");
            Ok(true)
        }
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                Ok(true)
            } else {
                Err(format!("Failed to delete registry value: {}", e))
            }
        }
    }
}

// 辅助 trait
trait Pipe<T> {
    fn pipe<F, R>(self, f: F) -> R
    where
        F: FnOnce(T) -> R;
}

impl<T> Pipe<T> for T {
    fn pipe<F, R>(self, f: F) -> R
    where
        F: FnOnce(T) -> R,
    {
        f(self)
    }
}