use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AdmtError {
    #[error("ADB command failed: {message}")]
    AdbCommandFailed { message: String },

    #[error("Device not found: {serial}")]
    DeviceNotFound { serial: String },

    #[error("Device unauthorized: {serial}")]
    DeviceUnauthorized { serial: String },

    #[error("File operation failed: {message}")]
    FileOperationFailed { message: String },

    #[error("Invalid device mode: {mode}")]
    InvalidDeviceMode { mode: String },

    #[error("Command timeout: {command}")]
    CommandTimeout { command: String },

    #[error("Parse error: {message}")]
    ParseError { message: String },

    #[error("IO error: {message}")]
    IoError { message: String },

    #[error("Configuration error: {message}")]
    ConfigError { message: String },

    #[error("Unknown error: {message}")]
    Unknown { message: String },

    #[error("File not found: {path}")]
    FileNotFound { path: String },

    #[error("Command failed: {command} - {error}")]
    CommandFailed { command: String, error: String },

    #[error("APK parsing failed: {message}")]
    ApkParsingFailed { message: String },

    #[error("Installation failed: {package} - {reason}")]
    InstallationFailed { package: String, reason: String },

    #[error("Uninstallation failed: {package} - {reason}")]
    UninstallationFailed { package: String, reason: String },

    #[error("Device not ready: {serial} - {state}")]
    DeviceNotReady { serial: String, state: String },

    #[error("ADB not available: {message}")]
    AdbNotAvailable { message: String },

    #[error("Permission denied: {operation}")]
    PermissionDenied { operation: String },

    #[error("Insufficient storage: {required} bytes needed")]
    InsufficientStorage { required: u64 },

    #[error("Network error: {0}")]
    Network(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Device error: {0}")]
    Device(String),

    #[error("Process error: {0}")]
    Process(String),

    #[error("Tool error: {0}")]
    Tool(String),

    #[error("Tauri error: {0}")]
    Tauri(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Extraction error: {0}")]
    ExtractionError(String),

    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),

    #[error("Path resolution failed: {0}")]
    PathResolution(String),

    #[error("Command execution failed: {0}")]
    Command(String),

    #[error("Invalid input: {message}")]
    InvalidInput { message: String },
}

impl From<std::io::Error> for AdmtError {
    fn from(err: std::io::Error) -> Self {
        AdmtError::IoError {
            message: err.to_string(),
        }
    }
}

impl From<serde_json::Error> for AdmtError {
    fn from(err: serde_json::Error) -> Self {
        AdmtError::ParseError {
            message: err.to_string(),
        }
    }
}

impl From<anyhow::Error> for AdmtError {
    fn from(err: anyhow::Error) -> Self {
        AdmtError::Unknown {
            message: err.to_string(),
        }
    }
}

pub type Result<T> = std::result::Result<T, AdmtError>;
