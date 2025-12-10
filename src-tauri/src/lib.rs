mod activation;
mod adb;
mod adb_commands;
mod cache;
mod commands;
mod core;
mod device;
mod download_manager;
mod downloads;
mod error;
mod fastboot;
mod sys;
mod system_features;
mod utils;
mod version;
use crate::commands::{get_resource_path, read_resource_file};

use activation::check_activation_expiry;
use adb::app::app_management::*;
use adb::command::adb_system_controler::{restart_adb_service, fix_usb3_connection, unfix_usb3_connection};
use adb::command::adb_command_runer::{execute_batch_file, execute_batch_file_stream, finish_adb_service, finish_adb5037, execute_adb_command};
use adb::device::device_reboot::reboot_device;
use adb::file::file::{push_file, pull_file, list_device_files};
use adb::scrcpy::screen_mirror::{check_screen_mirror_support, diagnose_scrcpy, start_screen_mirror, stop_screen_mirror};
use cache::cache_cleanup_task;
use commands::{scan_devices, execute_adb_command_with_path, get_adb_tools_info, verify_adb_tools_integrity, get_device_properties, check_adb_availability, check_fastboot_availability, fastboot_flash_image, diagnose_adb_fastboot_paths, get_device_performance_info, get_device_memory_storage_info, check_device_connection, get_device_connection_info, download_apk, get_download_size, download_file, cancel_download, get_downloads_directory, cleanup_downloads, validate_activation_code_format, activate_application, check_activation_status, validate_local_activation_data, get_device_fingerprint, get_app_config, save_app_config, get_security_config, validate_security_config, get_platform_info, get_system_arch, open_devtools, is_debug_mode, set_window_always_on_top, get_window_always_on_top, get_app_environment, download_and_extract_software, get_default_download_directory, open_folder, check_file_exists, delete_file, read_json_file, write_json_file, watch_config_file, execute_script_in_new_window, get_cache_stats, clear_all_cache, invalidate_device_cache, get_detailed_device_fingerprint, exit_app, terminate_process, check_process_alive, get_apk_files};
use downloads::get_rom::{fetch_rom_list, download_rom};
use fastboot::command::fastboot_command_runner::{execute_fastboot_command, execute_fastboot_command_with_path, switch_ab_partition, get_current_active_slot, get_slot_info};
use core::log::*;
use sys::sys_tool_opener::{open_device_manager, open_task_manager};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // 当第二个实例启动时，显示提示信息
            println!("检测到第二个实例尝试启动");
            
            // 获取主窗口
            if let Some(window) = app.get_webview_window("main") {
                // 将主窗口置于前台
                let _ = window.show();
                let _ = window.set_focus();
                
                // 显示提示对话框
                tauri::async_runtime::spawn(async move {
                    window.dialog()
                        .message("玩机管家已经在运行中，无需重新打开。")
                        .title("提示")
                        .show(|_| {});
                });
            }
        }))
        .invoke_handler(tauri::generate_handler![
            version::get_app_version,
            version::get_app_info,
            version::check_for_updates,
            scan_devices,
            execute_adb_command,
            get_resource_path,
            read_resource_file,
            execute_adb_command_with_path,
            execute_fastboot_command,
            execute_fastboot_command_with_path,
            switch_ab_partition,
            get_current_active_slot,
            get_slot_info,
            get_adb_tools_info,
            verify_adb_tools_integrity,
            reboot_device,
            install_apk,
            get_current_app,
            get_frozen_apps,
            push_file,
            pull_file,
            list_device_files,
            get_device_properties,
            get_installed_apps,
            get_installed_apps_batch,
            uninstall_app,
            get_apk_info,
            batch_install_apks,
            batch_uninstall_apps,
            check_adb_availability,
            check_fastboot_availability,
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
            get_apk_files,
            cleanup_downloads,
            check_screen_mirror_support,
            diagnose_scrcpy,
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
            write_json_file,
            watch_config_file,
            execute_script_in_new_window,
            get_cache_stats,
            clear_all_cache,
            invalidate_device_cache,
            fetch_rom_list,
            download_rom,
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
            core::log::get_log_file_info,
            // 工具路径监控命令
            core::log::get_tool_paths_status,
            core::log::verify_tools_integrity,
            // 杂项控制功能命令
            restart_adb_service,
            fix_usb3_connection,
            unfix_usb3_connection,
            execute_batch_file,
            execute_batch_file_stream,
            finish_adb_service,
            finish_adb5037,
            open_device_manager,
            open_task_manager,
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
            system_features::validate_auto_start,
            exit_app,
            terminate_process,
            check_process_alive
        ])
        .setup(|_app| {
            // 初始化应用状态
            println!("ADMT Tauri application starting...");

            // 启动缓存清理任务（在应用启动后）
            tauri::async_runtime::spawn(async move {
                cache_cleanup_task().await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
