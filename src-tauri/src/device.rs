use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub serial: String,
    pub mode: DeviceMode,
    pub properties: Option<DeviceProperties>,
    pub connected: bool,
    pub last_seen: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DeviceMode {
    Sys,          // 系统模式
    Rec,          // Recovery模式
    Fastboot,     // Fastboot模式
    Fastbootd,    // Fastbootd模式
    Sideload,     // Sideload模式
    Edl,          // EDL模式
    Unauthorized, // 未授权
    Offline,      // 离线
    Unknown,      // 未知
}

impl DeviceMode {
    pub fn from_adb_status(status: &str) -> Self {
        match status.trim() {
            "device" => DeviceMode::Sys,
            "recovery" => DeviceMode::Rec,
            "sideload" => DeviceMode::Sideload,
            "unauthorized" => DeviceMode::Unauthorized,
            "offline" => DeviceMode::Offline,
            _ => DeviceMode::Unknown,
        }
    }

    #[allow(dead_code)]
    pub fn from_fastboot_status(_status: &str) -> Self {
        // Fastboot通常只返回设备序列号，需要进一步检测是fastboot还是fastbootd
        DeviceMode::Fastboot
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DeviceProperties {
    // 设备基本信息
    pub market_name: Option<String>,   // ro.product.marketname
    pub product_name: Option<String>,  // ro.product.name
    pub brand: Option<String>,         // ro.product.brand
    pub model: Option<String>,         // ro.product.model
    pub device_name: Option<String>,   // ro.product.device
    pub manufacturer: Option<String>,  // ro.product.manufacturer
    pub serial_number: Option<String>, // ro.serialno

    // 系统版本信息
    pub android_version: Option<String>, // ro.build.version.release
    pub sdk_version: Option<String>,     // ro.build.version.sdk
    pub build_id: Option<String>,        // ro.build.id
    pub build_display_id: Option<String>, // ro.build.display.id
    pub system_version: Option<String>,  // ro.system.build.version.incremental
    pub security_patch_level: Option<String>, // ro.build.version.security_patch
    pub build_fingerprint: Option<String>, // ro.build.fingerprint
    pub build_date: Option<String>,      // ro.build.date
    pub build_user: Option<String>,      // ro.build.user
    pub build_host: Option<String>,      // ro.build.host
    pub miui_version: Option<String>,    // ro.mi.ui.version.name



    // 硬件信息
    pub cpu_abi: Option<String>,           // ro.product.cpu.abi
    pub cpu_abi_list: Option<String>,      // ro.product.cpu.abilist
    pub soc_manufacturer: Option<String>,  // ro.soc.manufacturer
    pub soc_model: Option<String>,         // ro.soc.model
    pub hardware: Option<String>,          // ro.hardware
    pub hardware_chipname: Option<String>, // ro.hardware.chipname
    pub board_platform: Option<String>,    // ro.board.platform
    pub product_board: Option<String>,     // ro.product.board

    // 安全和启动信息
    pub bootloader_locked: Option<bool>, // ro.boot.flash.locked
    pub verified_boot_state: Option<String>, // ro.boot.verifiedbootstate
    pub verity_mode: Option<String>,     // ro.boot.veritymode
    pub debuggable: Option<bool>,        // ro.debuggable
    pub secure: Option<bool>,            // ro.secure
    pub adb_secure: Option<bool>,        // ro.adb.secure

    // 显示和UI信息
    pub lcd_density: Option<String>, // ro.sf.lcd_density
    pub locale: Option<String>,      // ro.product.locale
    pub timezone: Option<String>,    // persist.sys.timezone

    // 网络和通信
    pub default_network: Option<String>, // ro.telephony.default_network
    pub first_api_level: Option<String>, // ro.product.first_api_level
    pub vndk_version: Option<String>,    // ro.vndk.version

    // 运行时信息
    pub imei: Option<String>,              // 需要特殊权限获取
    pub battery_level: Option<i32>,        // dumpsys battery
    pub screen_resolution: Option<String>, // wm size
    pub total_memory: Option<String>,      // /proc/meminfo
    pub available_storage: Option<String>, // df /data

    // 详细内存和存储信息
    pub memory_total: Option<u64>,      // 总内存 (MB)
    pub memory_used: Option<u64>,       // 已使用内存 (MB)
    pub memory_available: Option<u64>,  // 可用内存 (MB)
    pub storage_total: Option<u64>,     // 总存储 (MB)
    pub storage_used: Option<u64>,      // 已使用存储 (MB)
    pub storage_available: Option<u64>, // 可用存储 (MB)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbCommand {
    pub command: String,
    pub args: Vec<String>,
    pub timeout: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileTransferProgress {
    pub id: String,
    pub file_name: String,
    pub total_size: u64,
    pub transferred: u64,
    pub progress: f64,
    pub speed: Option<String>,
    pub eta: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledApp {
    pub package_name: String,
    pub app_name: Option<String>,
    pub version_name: Option<String>,
    pub version_code: Option<String>,
    pub install_location: Option<String>,
    pub is_system_app: bool,
    pub is_enabled: bool,
    pub apk_path: Option<String>,
    pub install_time: Option<String>,
    pub update_time: Option<String>,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApkInfo {
    pub file_path: String,
    pub package_name: Option<String>,
    pub app_name: Option<String>,
    pub version_name: Option<String>,
    pub version_code: Option<String>,
    pub min_sdk_version: Option<String>,
    pub target_sdk_version: Option<String>,
    pub compile_sdk_version: Option<String>,
    pub permissions: Vec<String>,
    pub features: Vec<String>,
    pub file_size: u64,
    pub is_debuggable: bool,
    pub is_test_only: bool,
    pub icon_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
    pub id: String,
    pub file_name: String,
    pub package_name: Option<String>,
    pub status: InstallStatus,
    pub progress: f64,
    pub message: Option<String>,
    pub start_time: chrono::DateTime<chrono::Utc>,
    pub end_time: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InstallStatus {
    Pending,
    Installing,
    Success,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchOperation {
    pub id: String,
    pub operation_type: BatchOperationType,
    pub total_items: usize,
    pub completed_items: usize,
    pub failed_items: usize,
    pub status: BatchOperationStatus,
    pub items: Vec<BatchOperationItem>,
    pub start_time: chrono::DateTime<chrono::Utc>,
    pub end_time: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BatchOperationType {
    Install,
    Uninstall,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BatchOperationStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchOperationItem {
    pub id: String,
    pub name: String,
    pub status: InstallStatus,
    pub message: Option<String>,
}

impl DeviceInfo {
    pub fn new(serial: String, mode: DeviceMode) -> Self {
        Self {
            serial,
            mode,
            properties: None,
            connected: true,
            last_seen: Some(Utc::now()),
        }
    }

    #[allow(dead_code)]
    pub fn update_properties(&mut self, properties: DeviceProperties) {
        self.properties = Some(properties);
        self.last_seen = Some(Utc::now());
    }

    pub fn is_adb_available(&self) -> bool {
        matches!(
            self.mode,
            DeviceMode::Sys | DeviceMode::Rec | DeviceMode::Sideload
        )
    }

    pub fn is_fastboot_available(&self) -> bool {
        matches!(self.mode, DeviceMode::Fastboot | DeviceMode::Fastbootd)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceFile {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: Option<u64>,
    pub permissions: Option<String>,
    pub modified_time: Option<String>,
}
