use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafetyCheckResult {
    pub is_safe: bool,
    pub danger_level: String, // "safe" | "warn" | "blocked"
    pub message: String,
}

/// 验证由 AI 助手建议的 ADB / Fastboot 命令是否安全
#[tauri::command]
pub fn verify_command_safety(command: String) -> SafetyCheckResult {
    let raw_cmd = command.trim();
    if raw_cmd.is_empty() {
        return SafetyCheckResult {
            is_safe: true,
            danger_level: "safe".to_string(),
            message: "命令为空".to_string(),
        };
    }

    // 转换为小写并清理多余空格以便匹配
    let lower_cmd = raw_cmd.to_lowercase();
    let parts: Vec<&str> = lower_cmd.split_whitespace().collect();

    if parts.is_empty() {
        return SafetyCheckResult {
            is_safe: true,
            danger_level: "safe".to_string(),
            message: "".to_string(),
        };
    }

    // 检查高危被拒指令 (blocked)
    
    // 1. dd 命令直接写入分区
    if parts.contains(&"dd") {
        for part in &parts {
            if part.starts_with("of=/dev/") {
                return SafetyCheckResult {
                    is_safe: false,
                    danger_level: "blocked".to_string(),
                    message: "高危操作：检测到试图使用 dd 直接向系统分区或物理设备写入数据，这极易导致设备彻底砖化（Brick）。该操作已被系统拦截。".to_string(),
                };
            }
        }
    }

    // 2. 擦除或格式化命令
    if parts.contains(&"format") || parts.contains(&"erase") {
        // Fastboot 的 erase 或 format 操作，以及 adb shell 里的 format
        let is_fastboot_erase = parts.contains(&"erase") || parts.contains(&"format");
        if is_fastboot_erase {
            // 检查是不是系统关键分区
            let critical_partitions = vec!["system", "vendor", "boot", "bootloader", "radio", "recovery", "rawdump", "metadata", "partition"];
            for part in &parts {
                if critical_partitions.contains(part) {
                    return SafetyCheckResult {
                        is_safe: false,
                        danger_level: "blocked".to_string(),
                        message: format!("高危操作：检测到试图格式化/擦除关键系统分区 '{}'。这会导致系统无法启动，已被系统拦截。", part).to_string(),
                    };
                }
            }
        }
    }

    // 3. 危险的删除操作 (rm -rf)
    if parts.contains(&"rm") {
        let has_recursive = parts.contains(&"-rf") || parts.contains(&"-r") || parts.contains(&"-f") || parts.contains(&"-fr") || parts.contains(&"-rf");
        
        // 查找 rm 指向的路径
        let mut target_path = "";
        for (i, part) in parts.iter().enumerate() {
            if *part == "rm" && i + 1 < parts.len() {
                // 找到 rm 后的路径参数
                for j in (i+1)..parts.len() {
                    if !parts[j].starts_with('-') {
                        target_path = parts[j];
                        break;
                    }
                }
            }
        }

        if has_recursive && (target_path == "/" || target_path == "*" || target_path.contains("/system") || target_path.contains("/vendor") || target_path.is_empty()) {
            return SafetyCheckResult {
                is_safe: false,
                danger_level: "blocked".to_string(),
                message: "高危操作：检测到试图对根目录或系统关键目录执行递归删除 (rm -rf)。该操作已被系统拦截。".to_string(),
            };
        }

        // 提示警告警告：一般的删除非临时目录文件
        if !target_path.is_empty() && !target_path.contains("/data/local/tmp") && !target_path.contains("/sdcard") && !target_path.contains("tmp") {
            return SafetyCheckResult {
                is_safe: true,
                danger_level: "warn".to_string(),
                message: format!("敏感操作：此指令将删除设备中的路径 '{}'。请确认该路径非系统关键文件，且操作后果可控。", target_path),
            };
        }
    }

    // 4. 重启到特殊模式或刷写命令 (Warning / Medium Danger)
    if parts.contains(&"reboot") {
        if parts.contains(&"bootloader") || parts.contains(&"recovery") || parts.contains(&"fastboot") || parts.contains(&"edl") {
            return SafetyCheckResult {
                is_safe: true,
                danger_level: "warn".to_string(),
                message: format!("提示：此操作将导致您的设备重启进入 '{}' 模式。重启过程中设备会暂时断开连接。", parts.last().unwrap_or(&"")),
            };
        }
    }

    if parts.contains(&"flash") {
        // fastboot flash <partition> <file>
        let partition = if parts.len() > 2 { parts[2] } else { "未知" };
        return SafetyCheckResult {
            is_safe: true,
            danger_level: "warn".to_string(),
            message: format!("敏感操作：此指令将向设备的 '{}' 分区刷写镜像文件。写入错误的分区镜像可能导致设备无法开机，请确保刷入的文件与当前机型完美适配。", partition),
        };
    }

    // 5. 权限修改 (chmod / chown)
    if parts.contains(&"chmod") || parts.contains(&"chown") {
        return SafetyCheckResult {
            is_safe: true,
            danger_level: "warn".to_string(),
            message: "提示：该指令会修改设备中文件或目录的权限。如果修改了系统核心路径权限，可能会导致应用闪退或系统异常。".to_string(),
        };
    }

    // 6. 清理应用数据
    if parts.contains(&"clear") && parts.contains(&"pm") {
        return SafetyCheckResult {
            is_safe: true,
            danger_level: "warn".to_string(),
            message: "提示：该命令将清除指定应用的全部数据（包括账号和本地缓存），操作不可逆。".to_string(),
        };
    }

    // 默认安全
    SafetyCheckResult {
        is_safe: true,
        danger_level: "safe".to_string(),
        message: "".to_string(),
    }
}
