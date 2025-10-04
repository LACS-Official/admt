use crate::adb::device::device_info::get_device_info;
use crate::device::CommandResult;
use crate::error::{AdmtError, Result};
use crate::utils::{
        execute_adb_command as utils_execute_adb_command, execute_fastboot_command,
};

#[tauri::command]
pub async fn reboot_device(serial: String, mode: String) -> Result<CommandResult> {
    let device = get_device_info(serial.clone()).await?;

    let reboot_args = match mode.as_str() {
        "system" => vec!["-s", &serial, "reboot"],
        "recovery" => vec!["-s", &serial, "reboot", "recovery"],
        "bootloader" | "fastboot" => vec!["-s", &serial, "reboot", "bootloader"],
        "sideload" => vec!["-s", &serial, "reboot", "sideload"],
        "edl" => vec!["-s", &serial, "reboot", "edl"],
        _ => return Err(AdmtError::InvalidDeviceMode { mode }),
    };

    if device.is_adb_available() {
        utils_execute_adb_command(&reboot_args, Some(10)).await
    } else if device.is_fastboot_available() && (mode == "system" || mode == "edl") {
        if mode == "edl" {
            execute_fastboot_command(&["-s", &serial, "oem", "edl"], Some(10)).await
        } else {
            execute_fastboot_command(&["-s", &serial, "reboot"], Some(10)).await
        }
    } else {
        Err(AdmtError::InvalidDeviceMode {
            mode: format!("{:?}", device.mode),
        })
    }
}