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

/// 读取本地文本文件内容（限制最大 2MB，仅支持 UTF-8）
#[tauri::command]
pub fn read_chat_text_file(path: String) -> Result<String, String> {
    use std::fs::File;
    use std::io::Read;
    
    let path_buf = std::path::PathBuf::from(&path);
    if !path_buf.exists() {
        return Err("所选文件不存在，请检查路径。".to_string());
    }
    
    let mut file = File::open(&path_buf).map_err(|e| format!("打开文件失败: {}", e))?;
    let metadata = file.metadata().map_err(|e| format!("读取文件元数据失败: {}", e))?;
    
    // 2MB 大小限制
    if metadata.len() > 2 * 1024 * 1024 {
        return Err("文件过大，为了性能和AI交互体验，附件最大限制为 2MB。".to_string());
    }
    
    let mut content = String::new();
    file.read_to_string(&mut content).map_err(|e| {
        format!(
            "读取文件内容失败（仅支持 UTF-8 编码的文本文件，请勿上传二进制或音视频等非文本格式文件）: {}",
            e
        )
    })?;
    
    Ok(content)
}

/// 腾讯云元宝搜索单条网页信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YuanbaoSearchPage {
    pub title: String,
    pub url: String,
    pub passage: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub site: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub score: Option<f64>,
}

/// 腾讯云元宝搜索统一响应结构
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YuanbaoSearchResponse {
    pub success: bool,
    pub query: String,
    pub pages: Vec<YuanbaoSearchPage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

/// 腾讯云元宝搜索 API 原生调用 (WSA / SearchPro)
#[tauri::command]
pub async fn yuanbao_search(
    query: String,
    api_key: String,
    cnt: Option<u32>,
    mode: Option<u32>,
    freshness: Option<String>,
) -> Result<YuanbaoSearchResponse, String> {
    let clean_query = query.trim();
    if clean_query.is_empty() {
        return Ok(YuanbaoSearchResponse {
            success: false,
            query: query.clone(),
            pages: vec![],
            error: Some("搜索关键词不能为空".to_string()),
            request_id: None,
        });
    }

    let clean_key = api_key.trim();
    if clean_key.is_empty() {
        return Ok(YuanbaoSearchResponse {
            success: false,
            query: clean_query.to_string(),
            pages: vec![],
            error: Some("请先配置腾讯云元宝搜索 API Key".to_string()),
            request_id: None,
        });
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| format!("初始化 HTTP 客户端失败: {}", e))?;

    let target_cnt = cnt.unwrap_or(0);
    // 腾讯云 SearchPro 接口：极速版/Lite 不支持 Cnt 和 Mode；标准版要求 10/20/30/40/50
    let api_cnt = if target_cnt <= 0 {
        0
    } else if target_cnt <= 10 {
        10
    } else if target_cnt <= 20 {
        20
    } else if target_cnt <= 30 {
        30
    } else if target_cnt <= 40 {
        40
    } else {
        50
    };

    let mut body = serde_json::json!({
        "Query": clean_query,
    });

    if api_cnt > 0 {
        if let Some(obj) = body.as_object_mut() {
            obj.insert("Cnt".to_string(), serde_json::Value::Number(api_cnt.into()));
            if let Some(m) = mode {
                if m > 0 {
                    obj.insert("Mode".to_string(), serde_json::Value::Number(m.into()));
                }
            }
        }
    }

    if let Some(fresh) = freshness.as_deref() {
        if !fresh.is_empty() && fresh != "noLimit" {
            if let Some(obj) = body.as_object_mut() {
                obj.insert("Freshness".to_string(), serde_json::Value::String(fresh.to_string()));
            }
        }
    }

    log::info!("发起腾讯云元宝搜索请求: query='{}', cnt={}, body={}", clean_query, api_cnt, body);

    let send_request = |req_body: serde_json::Value| {
        let client_clone = client.clone();
        let key_clone = clean_key.to_string();
        async move {
            client_clone
                .post("https://api.wsa.cloud.tencent.com/SearchPro")
                .header("Authorization", format!("Bearer {}", key_clone))
                .header("Content-Type", "application/json")
                .json(&req_body)
                .send()
                .await
        }
    };

    let res = send_request(body.clone())
        .await
        .map_err(|e| format!("请求腾讯云元宝搜索服务失败: {}", e))?;

    let mut status = res.status();
    let mut res_text = res
        .text()
        .await
        .map_err(|e| format!("读取搜索响应内容失败: {}", e))?;

    // 检查是否因 Cnt 或 Mode 被极速版拒收 (InvalidParameter: illegal Cnt / illegal Mode)
    let needs_lite_retry = res_text.contains("illegal Cnt") || res_text.contains("illegal Mode");
    if needs_lite_retry {
        log::warn!("检测到元宝搜索接口提示参数限制 (如极速版/Lite 不支持 Cnt/Mode)，自动降级无 Cnt 参数重试...");
        let mut lite_body = serde_json::json!({
            "Query": clean_query,
        });
        if let Some(fresh) = freshness.as_deref() {
            if !fresh.is_empty() && fresh != "noLimit" {
                if let Some(obj) = lite_body.as_object_mut() {
                    obj.insert("Freshness".to_string(), serde_json::Value::String(fresh.to_string()));
                }
            }
        }

        if let Ok(retry_res) = send_request(lite_body).await {
            status = retry_res.status();
            if let Ok(retry_text) = retry_res.text().await {
                res_text = retry_text;
            }
        }
    }

    if !status.is_success() {
        log::error!("元宝搜索接口返回错误: HTTP {}, body: {}", status, res_text);
        return Ok(YuanbaoSearchResponse {
            success: false,
            query: clean_query.to_string(),
            pages: vec![],
            error: Some(format!("HTTP {} ({})", status, res_text)),
            request_id: None,
        });
    }

    // 解析 JSON 结果
    let json_val: serde_json::Value = serde_json::from_str(&res_text)
        .map_err(|e| format!("解析元宝搜索响应 JSON 失败: {}, 原始文本: {}", e, res_text))?;

    // 检查是否有 Error 节点
    if let Some(err_node) = json_val
        .get("Response")
        .and_then(|r| r.get("Error"))
        .or_else(|| json_val.get("Error"))
    {
        let err_code = err_node.get("Code").and_then(|c| c.as_str()).unwrap_or("Unknown");
        let err_msg = err_node.get("Message").and_then(|m| m.as_str()).unwrap_or("元宝搜索服务返回未知错误");
        return Ok(YuanbaoSearchResponse {
            success: false,
            query: clean_query.to_string(),
            pages: vec![],
            error: Some(format!("{}: {}", err_code, err_msg)),
            request_id: json_val.get("Response").and_then(|r| r.get("RequestId")).and_then(|id| id.as_str()).map(|s| s.to_string()),
        });
    }

    let request_id = json_val
        .get("Response")
        .and_then(|r| r.get("RequestId"))
        .or_else(|| json_val.get("RequestId"))
        .and_then(|id| id.as_str())
        .map(|s| s.to_string());

    let raw_pages = json_val
        .get("Response")
        .and_then(|r| r.get("Pages"))
        .or_else(|| json_val.get("Pages"))
        .and_then(|p| p.as_array());

    let mut pages: Vec<YuanbaoSearchPage> = Vec::new();

    if let Some(page_arr) = raw_pages {
        for item in page_arr {
            // Pages 可能是字符串化的 JSON，也可能是直接的对象
            let item_obj = if let Some(s) = item.as_str() {
                serde_json::from_str::<serde_json::Value>(s).ok()
            } else if item.is_object() {
                Some(item.clone())
            } else {
                None
            };

            if let Some(obj) = item_obj {
                let title = obj.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let url = obj
                    .get("url")
                    .or_else(|| obj.get("href"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let passage = obj
                    .get("passage")
                    .or_else(|| obj.get("snippet"))
                    .or_else(|| obj.get("content"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let date = obj.get("date").and_then(|v| v.as_str()).map(|s| s.to_string());
                let site = obj.get("site").and_then(|v| v.as_str()).map(|s| s.to_string());
                let score = obj.get("score").and_then(|v| v.as_f64());

                if !title.is_empty() || !passage.is_empty() || !url.is_empty() {
                    pages.push(YuanbaoSearchPage {
                        title,
                        url,
                        passage,
                        date,
                        site,
                        score,
                    });
                }
            }
        }
    }

    if pages.len() > target_cnt as usize {
        pages.truncate(target_cnt as usize);
    }

    log::info!("元宝搜索解析成功: 命中 {} 条搜索结果", pages.len());

    Ok(YuanbaoSearchResponse {
        success: true,
        query: clean_query.to_string(),
        pages,
        error: None,
        request_id,
    })
}
