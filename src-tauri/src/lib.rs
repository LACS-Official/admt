mod commands;
mod device;
mod error;
mod screen_mirror;
mod utils;
mod activation;
mod download_manager;
mod cache;
mod version;
mod system_features;
mod adb_commands;


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
            version::get_app_version,
            version::get_app_info,
            version::check_for_updates,
            scan_devices,
            get_device_info,
            execute_adb_command,
            execute_adb_command_with_path,
            execute_fastboot_command_with_path,
            get_adb_tools_info,
            verify_adb_tools_integrity,
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
            get_device_performance_info,
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
            // 日志系统命令
            initialize_log_directory,
            persist_log,
            persist_log_to_file,
            get_logs,
            get_log_statistics,
            clear_logs,
            cleanup_expired_logs,
            write_logs_to_file,
            clear_all_logs,
            get_log_file_info,
            // 工具路径监控命令
            get_tool_paths_status,
            verify_tools_integrity,
            // 杂项控制功能命令
            restart_adb_service,
            install_device_driver,
            fix_usb3_connection,
            run_usb_fix_script,
            execute_batch_file,
            execute_batch_file_stream,
            open_device_manager,
            restart_application,
            get_detailed_device_fingerprint,
            // 系统功能
            system_features::set_window_close_behavior,
            system_features::should_minimize_to_tray,
            system_features::get_window_close_behavior,
            system_features::create_system_tray,
            system_features::setup_tray_event_listener,
            system_features::update_tray_menu,
            system_features::update_tray_icon,
            system_features::update_tray_tooltip,
            system_features::is_system_tray_supported,
            system_features::destroy_system_tray,
            system_features::get_current_app_path,
            system_features::get_auto_start_status,
            system_features::enable_auto_start,
            system_features::disable_auto_start,
            system_features::is_auto_start_supported,
            system_features::get_auto_start_config,
            system_features::validate_auto_start
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
