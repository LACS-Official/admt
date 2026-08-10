use crate::cache::{log_tool_paths, verify_tool_paths};
use crate::error::AdmtError;
use chrono::{Duration, Local, TimeZone, Utc};
use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

// 定义Result类型，使用自定义的AdmtError类型
type Result<T> = std::result::Result<T, AdmtError>;

/// 结构化日志条目
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StructuredLogEntry {
    pub level: String,
    pub message: String,
    pub module: String,
    pub timestamp: String,
    pub data: Option<serde_json::Value>,
}

/// 获取应用数据目录，支持多级降级策略
/// 1. 首先尝试从AppHandle获取
/// 2. 如果失败，尝试从环境变量获取
/// 3. 最后回退到当前工作目录
pub fn get_app_data_dir() -> Result<PathBuf> {
    // 1. 优先尝试从环境变量获取应用数据目录
    if let Ok(app_data_dir) = std::env::var("ADMT_APP_DATA_DIR") {
        if !app_data_dir.is_empty() {
            let path = PathBuf::from(app_data_dir);
            if path.exists() && path.is_dir() {
                return Ok(path);
            }
        }
    }

    // 2. 其次尝试用户系统的文档目录下的 admt 文件夹
    if let Some(doc_dir) = dirs::document_dir() {
        let admt_dir = doc_dir.join("admt");
        if let Err(err) = std::fs::create_dir_all(&admt_dir) {
            log::warn!("无法在文档目录创建 admt 文件夹: {}, 将尝试备选路径", err);
        } else {
            return Ok(admt_dir);
        }
    }

    // 3. 备选方案：尝试使用当前工作目录下的 admt_data
    if let Ok(current_dir) = std::env::current_dir() {
        let app_dir = current_dir.join("admt_data");
        if let Err(err) = std::fs::create_dir_all(&app_dir) {
            log::error!("无法在当前目录创建 admt_data 文件夹: {}", err);
        } else {
            return Ok(app_dir);
        }
    }

    // 4. 最后的回退：当前目录下的临时路径
    let default_path = PathBuf::from("./admt_data");
    let _ = std::fs::create_dir_all(&default_path);
    Ok(default_path)
}

/// 初始化日志目录
#[tauri::command]
pub fn initialize_log_directory() -> Result<PathBuf> {
    let app_dir = get_app_data_dir()?;
    let logs_dir = app_dir.join("logs");

    // 创建日志目录（如果不存在）
    if let Err(err) = fs::create_dir_all(&logs_dir) {
        log::error!("Failed to create logs directory: {}", err);
        return Err(AdmtError::FileOperationFailed {
            message: format!("创建日志目录失败: {}", err),
        });
    }

    Ok(logs_dir)
}

/// 持久化日志到文件（简化版本）
#[tauri::command]
pub fn persist_log(
    level: String,
    message: String,
    context: Option<serde_json::Value>,
) -> Result<()> {
    let log_entry = StructuredLogEntry {
        timestamp: Local::now().to_rfc3339(),
        level: level.parse().map_err(|_| AdmtError::InvalidInput {
            message: format!("Invalid log level: {}", level),
        })?,
        message,
        module: "frontend".to_string(),
        data: context,
    };

    persist_log_to_file(log_entry)
}

/// 将日志持久化到文件
#[tauri::command]
pub fn persist_log_to_file(log_entry: StructuredLogEntry) -> Result<()> {
    let logs_dir = initialize_log_directory()?;

    // 使用当前日期作为日志文件名的一部分，格式为 admt_log_YYYY-MM-DD.log
    let date_str = Local::now().format("%Y-%m-%d").to_string();
    let log_file_path = logs_dir.join(format!("admt_log_{}.log", date_str));

    // 打开日志文件（如果不存在则创建，如果存在则追加）
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_file_path)?;

    // 序列化日志条目为JSON并写入文件
    let log_json = serde_json::to_string(&log_entry)?;
    writeln!(file, "{}", log_json)?;

    Ok(())
}

/// 获取所有日志
#[tauri::command]
pub fn get_logs(limit: Option<usize>) -> Result<Vec<StructuredLogEntry>> {
    let logs_dir = initialize_log_directory()?;

    // 获取目录中的所有日志文件
    let mut log_files = Vec::new();
    if let Ok(entries) = fs::read_dir(&logs_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    let filename = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or("");

                    // 只处理符合命名格式的日志文件
                    if filename.starts_with("admt_log_") && filename.ends_with(".log") {
                        log_files.push(path);
                    }
                }
            }
        }
    }

    // 按文件名排序（倒序，以便先读取最新的日志文件）
    log_files.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    // 读取所有日志条目
    let mut all_logs = Vec::new();
    for log_file in log_files {
        if let Ok(content) = fs::read_to_string(&log_file) {
            for line in content.lines() {
                if let Ok(log_entry) = serde_json::from_str::<StructuredLogEntry>(line) {
                    all_logs.push(log_entry);

                    // 如果达到限制，则停止读取
                    if let Some(limit_val) = limit {
                        if all_logs.len() >= limit_val {
                            return Ok(all_logs);
                        }
                    }
                }
            }
        }
    }

    Ok(all_logs)
}

/// 获取日志统计信息
#[tauri::command]
pub fn get_log_statistics() -> Result<serde_json::Value> {
    let logs_dir = initialize_log_directory()?;

    // 统计不同级别的日志数量
    let mut counts = serde_json::Map::new();
    counts.insert("error".to_string(), serde_json::Value::Number(0.into()));
    counts.insert("warn".to_string(), serde_json::Value::Number(0.into()));
    counts.insert("info".to_string(), serde_json::Value::Number(0.into()));
    counts.insert("debug".to_string(), serde_json::Value::Number(0.into()));
    counts.insert("trace".to_string(), serde_json::Value::Number(0.into()));
    counts.insert("total".to_string(), serde_json::Value::Number(0.into()));

    // 统计每个模块的日志数量
    let mut modules = serde_json::Map::new();

    // 统计文件信息
    let mut file_count = 0;
    let mut total_size = 0;

    // 获取目录中的所有日志文件
    if let Ok(entries) = fs::read_dir(&logs_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    let filename = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or("");

                    // 只处理符合命名格式的日志文件
                    if filename.starts_with("admt_log_") && filename.ends_with(".log") {
                        file_count += 1;

                        // 获取文件大小
                        if let Ok(metadata) = fs::metadata(&path) {
                            total_size += metadata.len();
                        }

                        // 读取文件内容并统计日志
                        if let Ok(content) = fs::read_to_string(&path) {
                            for line in content.lines() {
                                if let Ok(log_entry) =
                                    serde_json::from_str::<StructuredLogEntry>(line)
                                {
                                    // 更新级别统计
                                    if let Some(count) = counts.get_mut(&log_entry.level) {
                                        if let serde_json::Value::Number(n) = count {
                                            if let Some(new_count) = n.as_u64().map(|x| x + 1) {
                                                *count =
                                                    serde_json::Value::Number(new_count.into());
                                            }
                                        }
                                    }

                                    // 更新总数
                                    if let Some(total) = counts.get_mut("total") {
                                        if let serde_json::Value::Number(n) = total {
                                            if let Some(new_total) = n.as_u64().map(|x| x + 1) {
                                                *total =
                                                    serde_json::Value::Number(new_total.into());
                                            }
                                        }
                                    }

                                    // 更新模块统计
                                    if let Some(module_count) = modules.get_mut(&log_entry.module) {
                                        if let serde_json::Value::Number(n) = module_count {
                                            if let Some(new_count) = n.as_u64().map(|x| x + 1) {
                                                *module_count =
                                                    serde_json::Value::Number(new_count.into());
                                            }
                                        }
                                    } else {
                                        modules.insert(
                                            log_entry.module.clone(),
                                            serde_json::Value::Number(1.into()),
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 构建统计结果
    let stats = serde_json::json!({
        "counts": counts,
        "modules": modules,
        "file_count": file_count,
        "total_size_bytes": total_size,
        "logs_directory": logs_dir.to_string_lossy(),
        "last_updated": Utc::now().to_rfc3339()
    });

    Ok(stats)
}

/// 清理过期日志
#[tauri::command]
pub fn cleanup_expired_logs(
    basic_cutoff_days: Option<u64>,
    error_cutoff_days: Option<u64>,
) -> Result<()> {
    let logs_dir = initialize_log_directory()?;

    // 默认保留期限：基本日志7天，错误日志30天
    let basic_cutoff = Duration::days(basic_cutoff_days.unwrap_or(7) as i64);
    let error_cutoff = Duration::days(error_cutoff_days.unwrap_or(30) as i64);

    let now = Utc::now();

    // 获取目录中的所有日志文件
    if let Ok(entries) = fs::read_dir(&logs_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    let filename = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or("");

                    // 只处理符合命名格式的日志文件
                    if filename.starts_with("admt_log_") && filename.ends_with(".log") {
                        // 尝试从文件名提取日期
                        if let Some(date_str) = filename
                            .strip_prefix("admt_log_")
                            .and_then(|s| s.strip_suffix(".log"))
                        {
                            if let Ok(file_date) =
                                chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
                            {
                                let file_datetime = Utc
                                    .timestamp_opt(
                                        file_date
                                            .and_hms_opt(0, 0, 0)
                                            .unwrap()
                                            .and_utc()
                                            .timestamp(),
                                        0,
                                    )
                                    .unwrap();

                                // 判断文件是否应该被清理
                                let should_cleanup =
                                    if date_str == now.format("%Y-%m-%d").to_string() {
                                        // 不清理当前日期的日志文件
                                        false
                                    } else {
                                        // 判断是否包含错误日志
                                        let mut contains_errors = false;
                                        if let Ok(content) = fs::read_to_string(&path) {
                                            for line in content.lines() {
                                                if let Ok(log_entry) =
                                                    serde_json::from_str::<StructuredLogEntry>(line)
                                                {
                                                    if log_entry.level == "error" {
                                                        contains_errors = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        // 根据是否包含错误决定清理期限
                                        let cutoff = if contains_errors {
                                            error_cutoff
                                        } else {
                                            basic_cutoff
                                        };
                                        now.signed_duration_since(file_datetime) > cutoff
                                    };

                                if should_cleanup {
                                    if let Err(err) = fs::remove_file(&path) {
                                        log::error!(
                                            "Failed to delete expired log file {}: {}",
                                            path.display(),
                                            err
                                        );
                                    } else {
                                        log::info!("Deleted expired log file: {}", path.display());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// 清空指定日期的日志
#[tauri::command]
pub fn clear_logs(date: Option<String>) -> Result<()> {
    let logs_dir = initialize_log_directory()?;

    // 如果没有指定日期，默认清空当前日期的日志
    let date_str = date.unwrap_or_else(|| Local::now().format("%Y%m%d").to_string());
    let log_file_path = logs_dir.join(format!("admt_log_{}.log", date_str));

    // 如果文件存在，则清空内容
    if log_file_path.exists() {
        File::create(log_file_path)?;
    }

    Ok(())
}

/// 清空所有日志
#[tauri::command]
pub fn clear_all_logs() -> Result<()> {
    let logs_dir = initialize_log_directory()?;

    // 获取目录中的所有日志文件
    if let Ok(entries) = fs::read_dir(&logs_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_file() {
                    let filename = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or("");

                    // 只删除符合命名格式的日志文件
                    if filename.starts_with("admt_log_") && filename.ends_with(".log") {
                        if let Err(err) = fs::remove_file(&path) {
                            log::error!("Failed to delete log file {}: {}", path.display(), err);
                            return Err(AdmtError::FileOperationFailed {
                                message: format!("删除日志文件失败: {}", err),
                            });
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// 批量写入日志
#[tauri::command]
pub fn write_logs_to_file(logs: Vec<StructuredLogEntry>) -> Result<()> {
    for log_entry in logs {
        if let Err(err) = persist_log_to_file(log_entry.clone()) {
            log::error!("Failed to write log entry: {}", err);
        }
    }
    Ok(())
}

/// 获取日志文件信息
#[tauri::command]
pub fn get_log_file_info() -> Result<serde_json::Value> {
    let app_dir = get_app_data_dir()?;
    let logs_dir = app_dir.join("logs");

    // 当前日志文件
    let date_str = Local::now().format("%Y%m%d").to_string();
    let current_filename = format!("admt_log_{}.log", date_str);
    let current_file_path = logs_dir.join(&current_filename);

    let info = serde_json::json!({
        "logsDirectory": logs_dir.to_string_lossy(),
        "currentLogFile": current_filename,
        "currentLogPath": current_file_path.to_string_lossy(),
        "logFileExists": current_file_path.exists(),
        "logsDirExists": logs_dir.exists()
    });

    Ok(info)
}

/// 获取工具路径状态
#[tauri::command]
pub async fn get_tool_paths_status() -> Result<serde_json::Value> {
    use crate::cache::{get_cached_adb_path, get_cached_fastboot_path};

    // 记录工具路径状态
    log_tool_paths().await;

    let adb_path = get_cached_adb_path();
    let fastboot_path = get_cached_fastboot_path();

    let status = serde_json::json!({
        "adb": {
            "path": adb_path.to_string_lossy(),
            "exists": adb_path.exists(),
            "valid": adb_path.exists() && !adb_path.to_string_lossy().contains("INVALID")
        },
        "fastboot": {
            "path": fastboot_path.to_string_lossy(),
            "exists": fastboot_path.exists(),
            "valid": fastboot_path.exists() && !fastboot_path.to_string_lossy().contains("INVALID")
        },
        "overall_valid": verify_tool_paths(),
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    Ok(status)
}

/// 验证并记录工具路径完整性
#[tauri::command]
pub async fn verify_tools_integrity() -> Result<bool> {
    // 记录详细的工具路径状态
    log_tool_paths().await;

    let is_valid = verify_tool_paths();

    if is_valid {
        log::info!("✅ All tools are properly configured and accessible");
    } else {
        log::error!("❌ Some tools are missing or inaccessible");
    }

    Ok(is_valid)
}
