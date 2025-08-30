mod commands;
mod device;
mod error;
mod screen_mirror;
mod utils;
mod activation;
mod download_manager;
mod cache;


use commands::*;
use activation::check_activation_expiry;
use cache::cache_cleanup_task;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
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
            scan_fastboot_devices,
            fastboot_flash_image,
            diagnose_adb_fastboot_paths,
            get_device_memory_storage_info,
            check_device_connection,
            get_device_connection_info,
            download_apk,
            get_download_size,
            download_file,
            cancel_download,
            get_downloads_directory,
            cleanup_downloads,
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
            set_window_always_on_top,
            get_window_always_on_top,
            get_app_environment,
            download_and_extract_software,
            get_default_download_directory,
            open_folder,
            check_file_exists,
            delete_file,
            read_json_file,
            execute_script_in_new_window,
            get_cache_stats,
            clear_all_cache,
            invalidate_device_cache,
            // 杂项控制功能命令
            restart_adb_service,
            install_device_driver,
            fix_usb3_connection,
            run_usb_fix_script,
            execute_batch_file,
            execute_batch_file_stream,
            open_device_manager,
            restart_application,
            get_detailed_device_fingerprint
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

            // 启动缓存清理任务（在应用启动后）
            tauri::async_runtime::spawn(async move {
                cache_cleanup_task().await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
