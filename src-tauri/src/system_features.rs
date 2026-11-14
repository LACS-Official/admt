/**
 * 系统功能模块
 * 包含系统托盘和开机自启动的简化实现
 */
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};

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
    println!(
        " 窗口关闭行为已设置: {}",
        if minimize_to_tray {
            "最小化到托盘"
        } else {
            "直接关闭"
        }
    );
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

// 全局状态：托盘是否已创建
static TRAY_CREATED: AtomicBool = AtomicBool::new(false);

const TRAY_ID: &str = "main-tray";

/// 根据菜单项构建托盘菜单；None 时使用默认「显示主页面 / 退出程序」菜单。
fn build_tray_menu<R: Runtime>(
    app: &AppHandle<R>,
    items: Option<Vec<TrayMenuItem>>,
) -> Result<Menu<R>, String> {
    let menu = Menu::new(app).map_err(|e| format!("Failed to create menu: {}", e))?;
    let list = items.unwrap_or_else(|| {
        vec![
            TrayMenuItem {
                id: "show".into(),
                label: "显示主页面".into(),
                enabled: Some(true),
                checked: None,
            },
            TrayMenuItem {
                id: "separator1".into(),
                label: "-".into(),
                enabled: None,
                checked: None,
            },
            TrayMenuItem {
                id: "exit".into(),
                label: "退出程序".into(),
                enabled: Some(true),
                checked: None,
            },
        ]
    });

    for it in list {
        if it.label == "-" || it.id.starts_with("separator") {
            let separator = PredefinedMenuItem::separator(app)
                .map_err(|e| format!("Failed to create separator: {}", e))?;
            menu.append(&separator)
                .map_err(|e| format!("Failed to append separator: {}", e))?;
        } else {
            let item = MenuItem::with_id(
                app,
                &it.id,
                &it.label,
                it.enabled.unwrap_or(true),
                None::<&str>,
            )
            .map_err(|e| format!("Failed to create menu item: {}", e))?;
            menu.append(&item)
                .map_err(|e| format!("Failed to append menu item: {}", e))?;
        }
    }
    Ok(menu)
}

/// 创建系统托盘
#[tauri::command]
pub async fn create_system_tray<R: Runtime>(
    app: AppHandle<R>,
    tooltip: Option<String>,
    icon: Option<String>,
    menu_items: Option<Vec<TrayMenuItem>>,
) -> Result<(), String> {
    // 参数名不能带下划线前缀，否则前端传的 `icon` / `menuItems` 无法完成
    // camelCase→snake_case 映射，会被静默忽略并退回默认菜单。
    // 自定义图标需要 tauri 的 image-png / image-ico feature，当前统一用应用默认图标。
    let _ = icon;

    // 同 id 的托盘必须先从资源表移除，否则重复 build 会冲突，
    // 表现为「关闭托盘后再打开就没反应」。
    app.remove_tray_by_id(TRAY_ID);

    let menu_result = build_tray_menu(&app, menu_items)?;

    // 构建托盘
    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .menu(&menu_result)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app_handle, event| {
            let id_str = event.id().as_ref().to_string();
            println!(" 托盘菜单项点击: {}", id_str);
            let _ = app_handle.emit("tray-menu-click", &id_str);

            if id_str == "show" || id_str == "custom-显示窗口" || id_str == "显示主页面" || id_str == "显示主界面" {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            } else if id_str == "exit" || id_str == "custom-退出应用" || id_str == "退出程序" || id_str == "退出玩机管家" {
                if let Some(mirror_mgr) = app_handle.try_state::<crate::adb::scrcpy::screen_mirror::MirrorManager>() {
                    mirror_mgr.cleanup_all();
                }
                std::process::exit(0);
            }
        })
        .on_tray_icon_event(move |tray, event| {
            let app = tray.app_handle();
            match event {
                TrayIconEvent::Click {
                    button,
                    button_state,
                    ..
                } => {
                    // 仅当左键点击释放时唤出/切换主窗口，右键由系统原生弹出菜单
                    if button == MouseButton::Left && button_state == MouseButtonState::Up {
                        let _ = app.emit("tray-icon-click", "click");
                    }
                }
                TrayIconEvent::DoubleClick { button, .. } => {
                    if button == MouseButton::Left {
                        let _ = app.emit("tray-icon-click", "double-click");
                    }
                }
                _ => {}
            }
        });

    if let Some(tt) = tooltip {
        builder = builder.tooltip(tt);
    } else {
        builder = builder.tooltip("玩机管家 (ADMT)");
    }

    let _tray = builder
        .build(&app)
        .map_err(|e| format!("build tray failed: {e}"))?;

    // 标记托盘已创建
    TRAY_CREATED.store(true, Ordering::Relaxed);

    println!(" 系统托盘已成功创建并挂载");
    Ok(())
}

/// 设置托盘事件监听器
#[tauri::command]
pub async fn setup_tray_event_listener<R: Runtime>(_app: AppHandle<R>) -> Result<(), String> {
    // 事件监听在 create_system_tray 中构建托盘时已设置，这里返回成功
    println!(" 托盘事件监听器设置完成");
    Ok(())
}

/// 更新托盘菜单
#[tauri::command]
pub async fn update_tray_menu<R: Runtime>(
    app: AppHandle<R>,
    menu_items: Vec<TrayMenuItem>,
) -> Result<(), String> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "系统托盘尚未创建".to_string())?;
    let menu = build_tray_menu(&app, Some(menu_items))?;
    tray.set_menu(Some(menu))
        .map_err(|e| format!("Failed to update tray menu: {e}"))?;
    Ok(())
}

/// 更新托盘图标
///
/// 运行时解码 PNG/ICO 需要 tauri 的 `image-png` / `image-ico` feature。
/// 当前命令没有调用方，为避免为一个边缘能力引入图像解码依赖，
/// 这里明确返回未实现，而不是像旧版那样打印日志后返回 Ok 骗过调用方。
#[tauri::command]
pub async fn update_tray_icon<R: Runtime>(
    _app: AppHandle<R>,
    _icon_path: String,
) -> Result<(), String> {
    Err("运行时托盘图标替换未启用（需要 tauri image-png / image-ico feature）".to_string())
}

/// 更新托盘提示文本
#[tauri::command]
pub async fn update_tray_tooltip<R: Runtime>(
    app: AppHandle<R>,
    tooltip: String,
) -> Result<(), String> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "系统托盘尚未创建".to_string())?;
    tray.set_tooltip(Some(tooltip))
        .map_err(|e| format!("Failed to update tray tooltip: {e}"))?;
    Ok(())
}

/// 检查是否支持系统托盘
#[tauri::command]
pub async fn is_system_tray_supported() -> Result<bool, String> {
    // 托盘是桌面端能力；浏览器预览 / 移动端返回 false，避免前端开关误放行
    #[cfg(desktop)]
    {
        Ok(true)
    }
    #[cfg(not(desktop))]
    {
        Ok(false)
    }
}

/// 销毁系统托盘
#[tauri::command]
pub async fn destroy_system_tray<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    // 仅仅 set_visible(false) 不会释放句柄，资源表里仍占着同 id，
    // 之后再调用 create_system_tray 会创建失败。这里必须真正移除。
    app.remove_tray_by_id(TRAY_ID);
    TRAY_CREATED.store(false, Ordering::Relaxed);
    println!(" 系统托盘已销毁");
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

    #[cfg(target_os = "linux")]
    {
        get_linux_auto_start_status(app_name).await
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        Ok(AutoStartStatus {
            is_enabled: false,
            method: "none".to_string(),
            path: None,
            error: Some("Auto-start only supported on Windows and Linux currently".to_string()),
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

    #[cfg(target_os = "linux")]
    {
        enable_linux_auto_start(config).await
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = config;
        Err("Auto-start only supported on Windows and Linux currently".to_string())
    }
}

/// 禁用开机自启动
#[tauri::command]
pub async fn disable_auto_start(app_name: String) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        disable_windows_auto_start(app_name).await
    }

    #[cfg(target_os = "linux")]
    {
        disable_linux_auto_start(app_name).await
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
    {
        let _ = app_name;
        Err("Auto-start only supported on Windows and Linux currently".to_string())
    }
}

/// 检查是否支持自启动功能
#[tauri::command]
pub async fn is_auto_start_supported() -> Result<bool, String> {
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        Ok(true)
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux")))]
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
        Ok(key) => match key.get_value::<String, _>(&app_name) {
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
        },
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
    let run_key = hkcu
        .open_subkey_with_flags(
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
            KEY_WRITE,
        )
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

    run_key
        .set_value(&config.app_name, &command)
        .map_err(|e| format!("Failed to set registry value: {}", e))?;

    println!(" Windows 自启动已启用: {}", command);
    Ok(true)
}

#[cfg(target_os = "windows")]
async fn disable_windows_auto_start(app_name: String) -> Result<bool, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu
        .open_subkey_with_flags(
            "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
            KEY_WRITE,
        )
        .map_err(|e| format!("Failed to open registry key: {}", e))?;

    match run_key.delete_value(&app_name) {
        Ok(_) => {
            println!(" Windows 自启动已禁用");
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

// ============ Linux 特定实现 ============

#[cfg(target_os = "linux")]
fn get_linux_autostart_path(app_name: &str) -> Result<std::path::PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| format!("Failed to get HOME env: {}", e))?;
    let path = std::path::PathBuf::from(home)
        .join(".config")
        .join("autostart")
        .join(format!("{}.desktop", app_name));
    Ok(path)
}

#[cfg(target_os = "linux")]
async fn get_linux_auto_start_status(app_name: String) -> Result<AutoStartStatus, String> {
    let path = get_linux_autostart_path(&app_name)?;
    if path.exists() {
        Ok(AutoStartStatus {
            is_enabled: true,
            method: "desktop_file".to_string(),
            path: Some(path.to_string_lossy().to_string()),
            error: None,
        })
    } else {
        Ok(AutoStartStatus {
            is_enabled: false,
            method: "none".to_string(),
            path: None,
            error: None,
        })
    }
}

#[cfg(target_os = "linux")]
async fn enable_linux_auto_start(config: AutoStartConfig) -> Result<bool, String> {
    let path = get_linux_autostart_path(&config.app_name)?;

    // Ensure dir exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create autostart dir: {}", e))?;
    }

    let app_path = if config.app_path.is_empty() {
        get_current_app_path().await?
    } else {
        config.app_path
    };

    let content = format!(
        "[Desktop Entry]\n\
        Type=Application\n\
        Name={}\n\
        Exec=\"{}\"\n\
        Terminal=false\n\
        X-GNOME-Autostart-enabled=true\n",
        config.app_name, app_path
    );

    std::fs::write(&path, content).map_err(|e| format!("Failed to write desktop file: {}", e))?;

    println!(" Linux 自启已启用: {}", path.display());
    Ok(true)
}

#[cfg(target_os = "linux")]
async fn disable_linux_auto_start(app_name: String) -> Result<bool, String> {
    let path = get_linux_autostart_path(&app_name)?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("Failed to remove desktop file: {}", e))?;
        println!(" Linux 自启已禁用");
    }
    Ok(true)
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

/// 获取系统主题（支持 Windows 注册表和系统检测，返回 "dark" 或 "light"）
#[tauri::command]
pub async fn get_system_theme<R: Runtime>(app: AppHandle<R>) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(key) = hkcu.open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize") {
            if let Ok(val) = key.get_value::<u32, _>("AppsUseLightTheme") {
                if val == 0 {
                    return Ok("dark".to_string());
                } else {
                    return Ok("light".to_string());
                }
            }
        }
    }

    if let Some(window) = app.get_webview_window("main") {
        if let Ok(theme) = window.theme() {
            return match theme {
                tauri::Theme::Dark => Ok("dark".to_string()),
                tauri::Theme::Light => Ok("light".to_string()),
                _ => Ok("light".to_string()),
            };
        }
    }

    Ok("light".to_string())
}

