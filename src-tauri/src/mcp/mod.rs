use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU16, AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use once_cell::sync::Lazy;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerStatus {
    pub is_running: bool,
    pub port: u16,
    pub clients: usize,
    pub url: String,
}

struct McpServerState {
    is_running: AtomicBool,
    port: AtomicU16,
    active_clients: AtomicUsize,
    shutdown_sender: Arc<Mutex<Option<tokio::sync::broadcast::Sender<()>>>>,
    sse_sender: tokio::sync::broadcast::Sender<String>,
}

static SERVER_STATE: Lazy<McpServerState> = Lazy::new(|| {
    let (tx, _) = tokio::sync::broadcast::channel::<String>(256);
    McpServerState {
        is_running: AtomicBool::new(false),
        port: AtomicU16::new(39860),
        active_clients: AtomicUsize::new(0),
        shutdown_sender: Arc::new(Mutex::new(None)),
        sse_sender: tx,
    }
});

#[derive(Debug)]
struct HttpRequest {
    method: String,
    uri: String,
    headers: HashMap<String, String>,
    body: Vec<u8>,
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack.windows(needle.len()).position(|window| window == needle)
}

async fn read_http_request(socket: &mut TcpStream) -> Result<HttpRequest, String> {
    let mut buf = Vec::with_capacity(4096);
    let mut temp = [0u8; 2048];
    let mut header_end = None;

    loop {
        let n = socket.read(&mut temp).await.map_err(|e| e.to_string())?;
        if n == 0 {
            if buf.is_empty() {
                return Err("EOF".to_string());
            }
            break;
        }
        buf.extend_from_slice(&temp[..n]);
        if let Some(pos) = find_subsequence(&buf, b"\r\n\r\n") {
            header_end = Some(pos);
            break;
        }
        if buf.len() > 65536 {
            return Err("HTTP header too large".to_string());
        }
    }

    let header_pos = header_end.ok_or_else(|| "Incomplete HTTP headers".to_string())?;
    let header_bytes = &buf[..header_pos];
    let body_start = header_pos + 4;
    let initial_body = buf[body_start..].to_vec();

    let header_str = String::from_utf8_lossy(header_bytes);
    let mut lines = header_str.lines();
    let request_line = lines.next().ok_or_else(|| "Empty request line".to_string())?;
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or("GET").to_uppercase();
    let uri = parts.next().unwrap_or("/").to_string();

    let mut headers = HashMap::new();
    for line in lines {
        if let Some((k, v)) = line.split_once(':') {
            headers.insert(k.trim().to_lowercase(), v.trim().to_string());
        }
    }

    let content_length: usize = headers
        .get("content-length")
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);

    let mut full_body = initial_body;
    while full_body.len() < content_length {
        let needed = content_length - full_body.len();
        let chunk_size = needed.min(temp.len());
        let n = socket.read(&mut temp[..chunk_size]).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        full_body.extend_from_slice(&temp[..n]);
    }

    Ok(HttpRequest {
        method,
        uri,
        headers,
        body: full_body,
    })
}

/// 所有 11 项内置 MCP 工具的规范 Schema 定义
fn get_all_mcp_tools() -> serde_json::Value {
    serde_json::json!({
        "tools": [
            {
                "name": "admt_get_devices",
                "description": "获取当前所有已通过 USB / WiFi 连接到 ADMT 玩机管家的 Android 设备列表及连接状态 (Device / Fastboot / Recovery)",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "admt_get_device_info",
                "description": "获取指定 Android 设备的详细硬件指纹、型号、厂商、安卓系统版本、电量、内存及存储使用情况",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "serial": {
                            "type": "string",
                            "description": "设备的 ADB Serial 序列号，不传则默认选择首个已连接设备"
                        }
                    }
                }
            },
            {
                "name": "admt_execute_adb",
                "description": "在指定的 Android 设备上安全执行一条 ADB Shell 命令并返回标准输出结果",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "需要执行的 ADB 指令（如 getprop ro.product.model, pm list packages 等）"
                        },
                        "serial": {
                            "type": "string",
                            "description": "目标设备序列号（可选）"
                        }
                    },
                    "required": ["command"]
                }
            },
            {
                "name": "admt_execute_fastboot",
                "description": "在 Fastboot 引导模式下执行 Fastboot 命令（如 getvar all, devices, reboot 等）",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "需要执行的 Fastboot 命令参数（如 getvar all, devices 等）"
                        }
                    },
                    "required": ["command"]
                }
            },
            {
                "name": "admt_reboot_device",
                "description": "一键将设备重启至系统 (system)、恢复模式 (recovery)、引导加载器 (bootloader/fastboot) 或 9008 (edl)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "target": {
                            "type": "string",
                            "description": "重启目标模式",
                            "enum": ["system", "recovery", "bootloader", "fastboot", "edl"]
                        },
                        "serial": {
                            "type": "string",
                            "description": "设备序列号（可选）"
                        }
                    },
                    "required": ["target"]
                }
            },
            {
                "name": "admt_take_screenshot",
                "description": "对当前已连接设备的屏幕进行截屏并保存到本地临时目录，返回 Base64 编码图片与时间戳",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "serial": {
                            "type": "string",
                            "description": "设备序列号（可选）"
                        }
                    }
                }
            },
            {
                "name": "admt_list_packages",
                "description": "列出设备中安装的应用包名列表，可按第三方应用 (third_party)、系统应用 (system) 或已停用应用 (disabled) 过滤",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filter": {
                            "type": "string",
                            "description": "过滤分类",
                            "enum": ["all", "third_party", "system", "disabled"]
                        },
                        "serial": {
                            "type": "string",
                            "description": "设备序列号（可选）"
                        }
                    }
                }
            },
            {
                "name": "admt_install_apk",
                "description": "向指定设备推送并静默安装本地 APK 安装包",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filePath": {
                            "type": "string",
                            "description": "电脑本地 APK 文件的绝对路径"
                        },
                        "serial": {
                            "type": "string",
                            "description": "设备序列号（可选）"
                        }
                    },
                    "required": ["filePath"]
                }
            },
            {
                "name": "admt_execute_host_command",
                "description": "在宿主电脑（Windows/macOS/Linux）上安全执行一条 CMD 或 PowerShell 命令行指令并返回标准输出。适用于查询本机网络 IP (ipconfig, ping)、端口占用 (netstat)、系统环境变量等",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "需要执行的命令行指令（如 ipconfig, ping -n 2 127.0.0.1 等）"
                        },
                        "shell": {
                            "type": "string",
                            "enum": ["powershell", "cmd"],
                            "description": "使用的终端 Shell 类型，Windows 平台默认为 powershell"
                        }
                    },
                    "required": ["command"]
                }
            },
            {
                "name": "admt_get_host_info",
                "description": "获取当前运行 ADMT 玩机管家的宿主电脑主机环境信息（包括本机局域网 IPv4 地址、主机名、操作系统平台与架构）",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "yuanbao_web_search",
                "description": "调用腾讯云元宝搜索 (Tencent Yuanbao Search / SearchPro) 检索全网实时权威信源。针对 Android 玩机、救砖、ROM 下载、变砖排错、Fastboot/ADB 报错分析提供精准联网问答与溯源支持",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "搜索关键词（例如：'Redmi K70 fastboot getvar all 报错'、'HyperOS 解锁 Bootloader 社区方案'）"
                        },
                        "freshness": {
                            "type": "string",
                            "description": "搜索时效性过滤范围",
                            "enum": ["noLimit", "oneDay", "oneWeek", "oneMonth", "oneYear"]
                        },
                        "apiKey": {
                            "type": "string",
                            "description": "可选的元宝搜索 API Key，不传则自动使用 ADMT 内部已配置的 Key"
                        }
                    },
                    "required": ["query"]
                }
            }
        ]
    })
}

/// 解析或自动匹配首个可用的设备 Serial
async fn resolve_serial(explicit_serial: Option<&str>) -> Result<String, String> {
    if let Some(s) = explicit_serial {
        let trimmed = s.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }

    let devs = crate::commands::device::scan_devices().await.map_err(|e| e.to_string())?;
    devs.into_iter()
        .next()
        .map(|d| d.serial)
        .ok_or_else(|| "未检测到已连接的 Android 设备，请连接手机并开启 USB 调试".to_string())
}

/// 执行 MCP 工具的核心分发器
async fn dispatch_tool_call(name: &str, args: &serde_json::Value) -> Result<String, String> {
    match name {
        "admt_get_devices" => {
            let devs = crate::commands::device::scan_devices().await.map_err(|e| e.to_string())?;
            if devs.is_empty() {
                return Ok("当前未检测到任何已连接的 Android 设备。请将设备通过 USB 或无线连接，并确保开启 USB 调试。".to_string());
            }
            let list: Vec<serde_json::Value> = devs.into_iter().map(|d| {
                serde_json::json!({
                    "serial": d.serial,
                    "mode": format!("{:?}", d.mode),
                    "connected": true
                })
            }).collect();
            let json_res = serde_json::json!({
                "devicesCount": list.len(),
                "devices": list
            });
            Ok(serde_json::to_string_pretty(&json_res).unwrap_or_default())
        }

        "admt_get_device_info" => {
            let target_serial = resolve_serial(args.get("serial").and_then(|v| v.as_str())).await?;
            match crate::adb::device::device_info::get_device_properties_batch(&target_serial).await {
                Ok(props) => {
                    let info = serde_json::json!({
                        "serial": target_serial,
                        "brand": props.brand,
                        "model": props.model,
                        "productName": props.product_name,
                        "marketName": props.market_name,
                        "androidVersion": props.android_version,
                        "sdkVersion": props.sdk_version,
                        "cpuAbi": props.cpu_abi,
                        "batteryLevel": props.battery_level,
                        "screenResolution": props.screen_resolution,
                        "totalMemory": props.total_memory,
                        "availableStorage": props.available_storage
                    });
                    Ok(serde_json::to_string_pretty(&info).unwrap_or_default())
                }
                Err(_) => {
                    let res = crate::utils::execute_adb_command(&["-s", &target_serial, "shell", "getprop"], Some(10))
                        .await
                        .map_err(|e| format!("获取设备参数失败: {}", e))?;
                    Ok(res.output)
                }
            }
        }

        "admt_execute_adb" => {
            let command = args.get("command").and_then(|v| v.as_str()).ok_or_else(|| "缺少 command 参数".to_string())?;
            let lower = command.to_lowercase();
            if lower.contains("rm -rf /") || lower.contains("mkfs") || lower.contains("dd if=/dev/zero") {
                return Err("安全拦截：该指令包含破坏性清空风险，已被 ADMT 安全网关拒绝执行".to_string());
            }

            let parts: Vec<&str> = command.split_whitespace().collect();
            if parts.is_empty() {
                return Err("命令内容为空".to_string());
            }

            let mut cmd_args = Vec::new();
            let serial = args.get("serial").and_then(|v| v.as_str()).map(|s| s.trim()).filter(|s| !s.is_empty());
            if let Some(s) = serial {
                cmd_args.push("-s");
                cmd_args.push(s);
            }
            cmd_args.extend(parts);

            let res = crate::utils::execute_adb_command(&cmd_args, Some(30))
                .await
                .map_err(|e| format!("执行 ADB 异常: {}", e))?;

            if res.success {
                if res.output.trim().is_empty() {
                    Ok("命令执行成功，无标准输出返回。".to_string())
                } else {
                    Ok(res.output)
                }
            } else {
                Err(res.error.unwrap_or(res.output))
            }
        }

        "admt_execute_fastboot" => {
            let command = args.get("command").and_then(|v| v.as_str()).ok_or_else(|| "缺少 command 参数".to_string())?;
            let parts: Vec<&str> = command.split_whitespace().collect();
            if parts.is_empty() {
                return Err("Fastboot 命令内容为空".to_string());
            }

            let res = crate::utils::execute_fastboot_command(&parts, Some(30))
                .await
                .map_err(|e| format!("执行 Fastboot 异常: {}", e))?;

            if res.success {
                let out = if res.output.trim().is_empty() {
                    res.error.unwrap_or_else(|| "Fastboot 命令执行完成".to_string())
                } else {
                    res.output
                };
                Ok(out)
            } else {
                Err(res.error.unwrap_or(res.output))
            }
        }

        "admt_reboot_device" => {
            let target = args.get("target").and_then(|v| v.as_str()).unwrap_or("system");
            let target_serial = resolve_serial(args.get("serial").and_then(|v| v.as_str())).await?;

            let res = crate::adb::device::device_reboot::reboot_device(target_serial.clone(), target.to_string())
                .await
                .map_err(|e| format!("重启设备指令失败: {}", e))?;

            if res.success {
                Ok(format!("设备 [{}] 已成功发送重启至 {} 模式指令", target_serial, target))
            } else {
                Err(res.error.unwrap_or(res.output))
            }
        }

        "admt_take_screenshot" => {
            let target_serial = resolve_serial(args.get("serial").and_then(|v| v.as_str())).await?;
            let base64_img = crate::adb::scrcpy::key_mapping::capture_device_screen(target_serial.clone())
                .await
                .map_err(|e| format!("截屏失败: {}", e))?;

            let res = serde_json::json!({
                "message": format!("已成功截取设备 [{}] 实时屏幕", target_serial),
                "imageBase64": base64_img,
                "timestamp": chrono::Utc::now().to_rfc3339()
            });
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }

        "admt_list_packages" => {
            let filter = args.get("filter").and_then(|v| v.as_str()).unwrap_or("all");
            let target_serial = resolve_serial(args.get("serial").and_then(|v| v.as_str())).await?;

            let mut pm_args = vec!["-s", &target_serial, "shell", "pm", "list", "packages"];
            match filter {
                "third_party" => pm_args.push("-3"),
                "system" => pm_args.push("-s"),
                "disabled" => pm_args.push("-d"),
                _ => {}
            }

            let res = crate::utils::execute_adb_command(&pm_args, Some(20))
                .await
                .map_err(|e| format!("获取应用列表失败: {}", e))?;

            let packages: Vec<String> = res.output
                .lines()
                .map(|l| l.trim().trim_start_matches("package:").to_string())
                .filter(|p| !p.is_empty())
                .collect();

            let sample = if packages.len() > 60 { &packages[..60] } else { &packages[..] };
            let json_res = serde_json::json!({
                "total": packages.len(),
                "filter": filter,
                "samplePackages": sample,
                "hasMore": packages.len() > 60
            });
            Ok(serde_json::to_string_pretty(&json_res).unwrap_or_default())
        }

        "admt_install_apk" => {
            let file_path = args.get("filePath").and_then(|v| v.as_str()).ok_or_else(|| "缺少 filePath 参数".to_string())?;
            let target_serial = resolve_serial(args.get("serial").and_then(|v| v.as_str())).await?;

            let res = crate::adb::app::app_management::install_apk(target_serial.clone(), file_path.to_string(), true)
                .await
                .map_err(|e| format!("安装 APK 异常: {}", e))?;

            if res.success {
                Ok(format!("APK [{}] 已成功安装到设备 [{}]", file_path, target_serial))
            } else {
                Err(res.error.unwrap_or(res.output))
            }
        }

        "admt_execute_host_command" => {
            let command = args.get("command").and_then(|v| v.as_str()).ok_or_else(|| "缺少 command 参数".to_string())?;
            let shell = args.get("shell").and_then(|v| v.as_str()).map(|s| s.to_string());

            let res = crate::commands::system::execute_host_command(command.to_string(), shell)
                .await
                .map_err(|e| format!("执行宿主命令失败: {}", e))?;

            let out = if !res.output.trim().is_empty() {
                res.output
            } else if let Some(err) = res.error {
                err
            } else {
                "命令执行完成，无输出返回".to_string()
            };
            Ok(out)
        }

        "admt_get_host_info" => {
            let info = crate::commands::system::get_host_network_info()
                .await
                .map_err(|e| format!("获取宿主信息失败: {}", e))?;
            Ok(serde_json::to_string_pretty(&info).unwrap_or_default())
        }

        "yuanbao_web_search" => {
            let query = args.get("query").and_then(|v| v.as_str()).ok_or_else(|| "缺少 query 搜索关键词参数".to_string())?;
            let freshness = args.get("freshness").and_then(|v| v.as_str()).unwrap_or("noLimit");

            let mut api_key = args.get("apiKey").and_then(|v| v.as_str()).unwrap_or("").trim().to_string();
            if api_key.is_empty() {
                if let Ok(env_key) = std::env::var("YUANBAO_API_KEY") {
                    api_key = env_key.trim().to_string();
                } else if let Ok(env_key) = std::env::var("WSA_API_KEY") {
                    api_key = env_key.trim().to_string();
                }
            }
            if api_key.is_empty() {
                // 尝试从本地配置文件读取
                if let Some(mut p) = dirs::config_dir() {
                    p.push("com.admt.app");
                    p.push("config");
                    p.push("app_config.json");
                    if p.exists() {
                        if let Ok(content) = std::fs::read_to_string(&p) {
                            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                                if let Some(key) = val.pointer("/userConfig/ai/yuanbaoSearch/apiKey").and_then(|k| k.as_str()) {
                                    api_key = key.trim().to_string();
                                }
                            }
                        }
                    }
                }
            }

            if api_key.is_empty() {
                return Err("未配置腾讯云元宝搜索 API Key，请在 ADMT「AI 资源与 MCP」面板中配置元宝 API Key，或在工具参数中传入 apiKey".to_string());
            }

            let search_res = crate::commands::ai::yuanbao_search(
                query.to_string(),
                api_key,
                Some(10),
                Some(0),
                Some(freshness.to_string()),
            ).await.map_err(|e| format!("元宝搜索失败: {}", e))?;

            if !search_res.success {
                return Err(search_res.error.unwrap_or_else(|| "元宝搜索未返回有效结果".to_string()));
            }

            let formatted = serde_json::json!({
                "query": query,
                "hitsCount": search_res.pages.len(),
                "sources": search_res.pages.into_iter().enumerate().map(|(idx, p)| {
                    serde_json::json!({
                        "index": idx + 1,
                        "title": p.title,
                        "snippet": p.passage,
                        "url": p.url,
                        "date": p.date,
                        "site": p.site
                    })
                }).collect::<Vec<_>>()
            });
            Ok(serde_json::to_string_pretty(&formatted).unwrap_or_default())
        }

        unknown => Err(format!("未知的 MCP 工具: {}", unknown)),
    }
}

/// 处理单条 JSON-RPC 请求
async fn handle_jsonrpc_request(req_val: serde_json::Value) -> Option<serde_json::Value> {
    let id = req_val.get("id").cloned();
    let method = match req_val.get("method").and_then(|v| v.as_str()) {
        Some(m) => m,
        None => {
            if id.is_some() {
                return Some(serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": { "code": -32600, "message": "Invalid Request: missing method" }
                }));
            }
            return None;
        }
    };

    match method {
        "initialize" => {
            Some(serde_json::json!({
                "jsonrpc": "2.0",
                "id": id.unwrap_or(serde_json::Value::Number(1.into())),
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": { "listChanged": false }
                    },
                    "serverInfo": {
                        "name": "admt-mcp-server",
                        "version": "1.0.0"
                    }
                }
            }))
        }

        "ping" => {
            Some(serde_json::json!({
                "jsonrpc": "2.0",
                "id": id.unwrap_or(serde_json::Value::Number(1.into())),
                "result": {}
            }))
        }

        "notifications/initialized" => {
            // MCP 通知消息无需返回响应
            None
        }

        "tools/list" => {
            let tools = get_all_mcp_tools();
            Some(serde_json::json!({
                "jsonrpc": "2.0",
                "id": id.unwrap_or(serde_json::Value::Number(1.into())),
                "result": tools
            }))
        }

        "tools/call" => {
            let params = req_val.get("params").cloned().unwrap_or(serde_json::Value::Null);
            let tool_name = params.get("name").and_then(|v| v.as_str()).unwrap_or("");
            let tool_args = params.get("arguments").cloned().unwrap_or(serde_json::json!({}));

            let result_response = match dispatch_tool_call(tool_name, &tool_args).await {
                Ok(output) => {
                    serde_json::json!({
                        "jsonrpc": "2.0",
                        "id": id.unwrap_or(serde_json::Value::Number(1.into())),
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": output
                                }
                            ],
                            "isError": false
                        }
                    })
                }
                Err(err_msg) => {
                    serde_json::json!({
                        "jsonrpc": "2.0",
                        "id": id.unwrap_or(serde_json::Value::Number(1.into())),
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": format!("执行失败: {}", err_msg)
                                }
                            ],
                            "isError": true
                        }
                    })
                }
            };
            Some(result_response)
        }

        unknown_method => {
            if id.is_some() {
                Some(serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": { "code": -32601, "message": format!("Method not found: {}", unknown_method) }
                }))
            } else {
                None
            }
        }
    }
}

/// 启动 ADMT MCP 本地服务端（标准 MCP 2024-11-05 SSE & HTTP 双协议支持）
#[tauri::command]
pub async fn start_mcp_server(
    port: Option<u16>,
    host: Option<String>,
    _allow_device_commands: Option<bool>,
) -> Result<McpServerStatus, String> {
    let target_port = port.unwrap_or(39860);
    let target_host = host.unwrap_or_else(|| "127.0.0.1".to_string());

    if SERVER_STATE.is_running.load(Ordering::SeqCst) {
        let current_port = SERVER_STATE.port.load(Ordering::SeqCst);
        let clients = SERVER_STATE.active_clients.load(Ordering::SeqCst);
        return Ok(McpServerStatus {
            is_running: true,
            port: current_port,
            clients,
            url: format!("http://{}:{}/sse", target_host, current_port),
        });
    }

    let bind_addr = format!("{}:{}", target_host, target_port);
    let listener = TcpListener::bind(&bind_addr)
        .await
        .map_err(|e| format!("绑定 MCP 端口 {} 失败: {}", target_port, e))?;

    SERVER_STATE.is_running.store(true, Ordering::SeqCst);
    SERVER_STATE.port.store(target_port, Ordering::SeqCst);

    let (shutdown_tx, mut shutdown_rx) = tokio::sync::broadcast::channel::<()>(1);
    {
        let mut sender_lock = SERVER_STATE.shutdown_sender.lock().await;
        *sender_lock = Some(shutdown_tx.clone());
    }

    // 在后台协程中监听并处理客户端的 HTTP / SSE / JSON-RPC 2.0 请求
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    log::info!("MCP Server 收到停机指令");
                    break;
                }
                accept_res = listener.accept() => {
                    match accept_res {
                        Ok((mut socket, _addr)) => {
                            let mut shutdown_rx_conn = shutdown_tx.subscribe();
                            tokio::spawn(async move {
                                // 循环处理长连接中可能的连续 HTTP/1.1 请求
                                loop {
                                    let req = tokio::select! {
                                        _ = shutdown_rx_conn.recv() => break,
                                        read_res = read_http_request(&mut socket) => {
                                            match read_res {
                                                Ok(r) => r,
                                                Err(_) => break, // 客户端断开连接或 EOF
                                            }
                                        }
                                    };

                                    // 处理 OPTIONS 跨域预检
                                    if req.method == "OPTIONS" {
                                        let response = "HTTP/1.1 204 No Content\r\n\
                                            Access-Control-Allow-Origin: *\r\n\
                                            Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
                                            Access-Control-Allow-Headers: *\r\n\
                                            Access-Control-Max-Age: 86400\r\n\r\n";
                                        let _ = socket.write_all(response.as_bytes()).await;
                                        continue;
                                    }

                                    // 处理 GET /sse (或 /events) 长连接事件流
                                    if req.method == "GET" && (req.uri.starts_with("/sse") || req.uri.starts_with("/events")) {
                                        let sse_header = "HTTP/1.1 200 OK\r\n\
                                            Content-Type: text/event-stream\r\n\
                                            Cache-Control: no-cache, no-transform\r\n\
                                            Connection: keep-alive\r\n\
                                            Access-Control-Allow-Origin: *\r\n\
                                            Access-Control-Allow-Headers: *\r\n\r\n\
                                            event: endpoint\r\ndata: /message\r\n\r\n";
                                        if socket.write_all(sse_header.as_bytes()).await.is_err() {
                                            break;
                                        }

                                        SERVER_STATE.active_clients.fetch_add(1, Ordering::SeqCst);
                                        let mut sse_rx = SERVER_STATE.sse_sender.subscribe();
                                        let mut ping_interval = tokio::time::interval(std::time::Duration::from_secs(15));
                                        let (mut reader, mut writer) = socket.into_split();
                                        let mut client_buf = [0u8; 128];

                                        loop {
                                            tokio::select! {
                                                _ = shutdown_rx_conn.recv() => break,
                                                _ = ping_interval.tick() => {
                                                    if writer.write_all(b": keep-alive\r\n\r\n").await.is_err() {
                                                        break;
                                                    }
                                                }
                                                msg = sse_rx.recv() => {
                                                    if let Ok(data) = msg {
                                                        let sse_msg = format!("event: message\r\ndata: {}\r\n\r\n", data);
                                                        if writer.write_all(sse_msg.as_bytes()).await.is_err() {
                                                            break;
                                                        }
                                                    }
                                                }
                                                read_res = reader.read(&mut client_buf) => {
                                                    match read_res {
                                                        Ok(0) => break, // 客户端正常关闭
                                                        Err(_) => break,
                                                        _ => {}
                                                    }
                                                }
                                            }
                                        }

                                        SERVER_STATE.active_clients.fetch_sub(1, Ordering::SeqCst);
                                        break;
                                    }

                                    // 处理 POST 请求（/message, /, /rpc）
                                    if req.method == "POST" {
                                        if let Ok(body_json) = serde_json::from_slice::<serde_json::Value>(&req.body) {
                                            let response_json = if let Some(arr) = body_json.as_array() {
                                                // Batch 请求
                                                let mut results = Vec::new();
                                                for item in arr {
                                                    if let Some(r) = handle_jsonrpc_request(item.clone()).await {
                                                        results.push(r);
                                                    }
                                                }
                                                if results.is_empty() {
                                                    None
                                                } else {
                                                    Some(serde_json::Value::Array(results))
                                                }
                                            } else {
                                                // 单个请求
                                                handle_jsonrpc_request(body_json).await
                                            };

                                            if let Some(resp_val) = response_json {
                                                let resp_body = serde_json::to_string(&resp_val).unwrap_or_default();
                                                // 同时推送到当前活跃的 SSE 事件流广播通道
                                                let _ = SERVER_STATE.sse_sender.send(resp_body.clone());

                                                let response = format!(
                                                    "HTTP/1.1 200 OK\r\n\
                                                    Content-Type: application/json\r\n\
                                                    Access-Control-Allow-Origin: *\r\n\
                                                    Access-Control-Allow-Headers: *\r\n\
                                                    Content-Length: {}\r\n\r\n{}",
                                                    resp_body.len(),
                                                    resp_body
                                                );
                                                let _ = socket.write_all(response.as_bytes()).await;
                                            } else {
                                                // 通知 (Notification) 返回 202
                                                let response = "HTTP/1.1 202 Accepted\r\n\
                                                    Access-Control-Allow-Origin: *\r\n\
                                                    Access-Control-Allow-Headers: *\r\n\
                                                    Content-Length: 0\r\n\r\n";
                                                let _ = socket.write_all(response.as_bytes()).await;
                                            }
                                        } else {
                                            let err_body = serde_json::json!({
                                                "jsonrpc": "2.0",
                                                "id": serde_json::Value::Null,
                                                "error": { "code": -32700, "message": "Parse error: Invalid JSON payload" }
                                            }).to_string();
                                            let response = format!(
                                                "HTTP/1.1 400 Bad Request\r\n\
                                                Content-Type: application/json\r\n\
                                                Access-Control-Allow-Origin: *\r\n\
                                                Content-Length: {}\r\n\r\n{}",
                                                err_body.len(),
                                                err_body
                                            );
                                            let _ = socket.write_all(response.as_bytes()).await;
                                        }

                                        // 若连接头标明 close，则退出连接
                                        if let Some(conn_header) = req.headers.get("connection") {
                                            if conn_header.eq_ignore_ascii_case("close") {
                                                break;
                                            }
                                        }
                                        continue;
                                    }

                                    // 其他未定义路径返回 404
                                    let not_found = "HTTP/1.1 404 Not Found\r\n\
                                        Content-Type: text/plain\r\n\
                                        Access-Control-Allow-Origin: *\r\n\
                                        Content-Length: 9\r\n\r\nNot Found";
                                    let _ = socket.write_all(not_found.as_bytes()).await;
                                    break;
                                }
                            });
                        }
                        Err(e) => {
                            log::warn!("MCP Server accept error: {}", e);
                        }
                    }
                }
            }
        }
        SERVER_STATE.is_running.store(false, Ordering::SeqCst);
    });

    Ok(McpServerStatus {
        is_running: true,
        port: target_port,
        clients: 0,
        url: format!("http://{}:{}/sse", target_host, target_port),
    })
}

/// 停止 ADMT MCP 本地服务端
#[tauri::command]
pub async fn stop_mcp_server() -> Result<bool, String> {
    let mut sender_lock = SERVER_STATE.shutdown_sender.lock().await;
    if let Some(sender) = sender_lock.take() {
        let _ = sender.send(());
    }
    SERVER_STATE.is_running.store(false, Ordering::SeqCst);
    SERVER_STATE.active_clients.store(0, Ordering::SeqCst);
    Ok(true)
}

/// 获取当前 MCP 服务端状态
#[tauri::command]
pub fn get_mcp_server_status() -> McpServerStatus {
    let running = SERVER_STATE.is_running.load(Ordering::SeqCst);
    let port = SERVER_STATE.port.load(Ordering::SeqCst);
    let clients = SERVER_STATE.active_clients.load(Ordering::SeqCst);
    McpServerStatus {
        is_running: running,
        port,
        clients,
        url: format!("http://127.0.0.1:{}/sse", port),
    }
}
