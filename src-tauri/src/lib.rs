mod commands;
mod device;
mod error;
mod screen_mirror;
mod utils;
mod activation;

#[cfg(test)]
mod activation_tests;

use commands::*;
use activation::check_activation_expiry;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_devices,
            get_device_info,
            execute_adb_command,
            reboot_device,
            install_apk,
            push_file,
            pull_file,
            list_device_files,
            get_device_properties,
            get_installed_apps,
            uninstall_app,
            get_apk_info,
            batch_install_apks,
            batch_uninstall_apps,
            check_adb_availability,
            check_fastboot_availability,
            check_device_connection,
            get_device_connection_info,
            download_apk,
            get_download_size,
            download_file,
            cancel_download,
            check_screen_mirror_support,
            start_screen_mirror,
            stop_screen_mirror,
            validate_activation_code_format,
            activate_application,
            check_activation_status,
            validate_local_activation_data,
            check_activation_expiry,
            get_device_fingerprint,
            get_app_config,
            save_app_config,
            get_security_config,
            validate_security_config,
            get_platform_info,
            get_system_arch,
            open_devtools,
            is_debug_mode,
            get_app_environment
        ])
        .setup(|app| {
            // 只在调试模式下初始化日志插件
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Debug)
                        .build(),
                )?;
            }

            // 初始化应用状态
            println!("HOUT Tauri application starting...");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
