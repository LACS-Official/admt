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
mod root;
mod sys;
mod system_features;
mod utils;
mod version;
use crate::commands::{
    activate_application, backup_partition, cancel_download, check_activation_status,
    check_adb_availability, check_device_connection, check_fastboot_availability,
    check_file_exists, check_process_alive, cleanup_downloads, clear_all_cache, delete_file,
    diagnose_adb_fastboot_paths, download_and_extract_software, download_apk, download_file,
    execute_adb_command_with_path, execute_script_in_new_window, exit_app, fastboot_flash_image,
    get_apk_files, get_app_config, get_app_environment, get_cache_stats,
    get_default_download_directory, get_detailed_device_fingerprint, get_device_connection_info,
    get_device_fingerprint, get_device_memory_storage_info, get_device_partitions,
    get_device_performance_info, get_device_properties, get_device_realtime_monitor_data,
    get_download_size, get_downloads_directory, get_file_hash, get_platform_info,
    get_resource_path, get_security_config, get_system_arch, get_window_always_on_top,
    invalidate_device_cache, is_debug_mode, open_devtools, open_folder, read_chat_text_file, read_json_file,
    read_resource_file, save_app_config, scan_devices, set_window_always_on_top, terminate_process,
    validate_activation_code_format, validate_local_activation_data, validate_security_config,
    verify_command_safety, watch_config_file, write_json_file, parse_local_rom,
    extract_local_partition, parse_online_rom, extract_online_partition,
};

use crate::adb::app::app_management::*;
use crate::adb::command::adb_command_runer::{
    execute_adb_command, execute_adb_command_direct, execute_batch_file, execute_batch_file_stream,
    finish_adb_service,
};
use crate::adb::command::adb_system_controler::{
    fix_usb3_connection, restart_adb_service, unfix_usb3_connection,
};
use crate::adb::device::device_reboot::reboot_device;
use crate::adb::file::file::{list_device_files, pull_file, push_file};
use crate::adb::scrcpy::screen_mirror::{
    check_screen_mirror_support, diagnose_scrcpy, get_active_mirror_sessions, is_device_mirroring,
    start_screen_mirror, stop_screen_mirror, MirrorManager,
};
use crate::adb_commands::{get_adb_tools_info, verify_adb_tools_integrity};
use crate::cache::cache_cleanup_task;
use crate::core::log::{
    cleanup_expired_logs, clear_all_logs, clear_logs, get_log_file_info, get_log_statistics,
    get_logs, get_tool_paths_status, initialize_log_directory, persist_log, persist_log_to_file,
    verify_tools_integrity,
};
use core::log::*;
use downloads::get_rom::{download_rom, fetch_rom_list};
use fastboot::command::fastboot_command_runner::{
    execute_fastboot_command, execute_fastboot_command_with_path, get_current_active_slot,
    get_slot_info, switch_ab_partition,
};
use sys::sys_tool_opener::{open_device_manager, open_task_manager};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(MirrorManager::new())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
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
                    window
                        .dialog()
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
            crate::adb::pairing::start_adb_pairing_server,
            crate::adb::pairing::stop_adb_pairing_server,
            scan_devices,
            execute_adb_command,
            execute_adb_command_direct,
            get_resource_path,
            read_resource_file,
            execute_adb_command_with_path,
            verify_command_safety,
            read_chat_text_file,
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
            get_device_realtime_monitor_data,
            check_device_connection,
            get_device_connection_info,
            download_apk,
            get_download_size,
            download_file,
            cancel_download,
            get_downloads_directory,
            get_apk_files,
            cleanup_downloads,
            get_file_hash,
            check_screen_mirror_support,
            diagnose_scrcpy,
            start_screen_mirror,
            stop_screen_mirror,
            get_active_mirror_sessions,
            is_device_mirroring,
            validate_activation_code_format,
            activate_application,
            check_activation_status,
            validate_local_activation_data,
            crate::activation::check_activation_expiry,
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
            get_log_file_info,
            // 工具路径监控命令
            get_tool_paths_status,
            verify_tools_integrity,
            // 杂项控制功能命令
            restart_adb_service,
            fix_usb3_connection,
            unfix_usb3_connection,
            execute_batch_file,
            execute_batch_file_stream,
            finish_adb_service,
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
            check_process_alive,
            crate::root::patch::patch_boot_image_local,
            get_device_partitions,
            backup_partition,
            export_apk,
            parse_local_rom,
            extract_local_partition,
            parse_online_rom,
            extract_online_partition,
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
