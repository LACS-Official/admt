use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU16, Ordering};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
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
    shutdown_sender: Arc<Mutex<Option<tokio::sync::broadcast::Sender<()>>>>,
}

static SERVER_STATE: Lazy<McpServerState> = Lazy::new(|| McpServerState {
    is_running: AtomicBool::new(false),
    port: AtomicU16::new(39860),
    shutdown_sender: Arc::new(Mutex::new(None)),
});

/// 启动 ADMT MCP 本地服务端
#[tauri::command]
pub async fn start_mcp_server(
    port: Option<u16>,
    host: Option<String>,
    allow_device_commands: Option<bool>,
) -> Result<McpServerStatus, String> {
    let target_port = port.unwrap_or(39860);
    let target_host = host.unwrap_or_else(|| "127.0.0.1".to_string());
    let _allow_cmds = allow_device_commands.unwrap_or(true);

    if SERVER_STATE.is_running.load(Ordering::SeqCst) {
        return Ok(McpServerStatus {
            is_running: true,
            port: SERVER_STATE.port.load(Ordering::SeqCst),
            clients: 0,
            url: format!("http://{}:{}/sse", target_host, SERVER_STATE.port.load(Ordering::SeqCst)),
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
        *sender_lock = Some(shutdown_tx);
    }

    // 在后台协程中监听并处理客户端的 HTTP / SSE / JSON-RPC 请求
    tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    log::info!("MCP Server received shutdown signal.");
                    break;
                }
                accept_res = listener.accept() => {
                    match accept_res {
                        Ok((mut socket, _addr)) => {
                            tokio::spawn(async move {
                                let mut buf = [0u8; 4096];
                                if let Ok(n) = socket.read(&mut buf).await {
                                    if n == 0 { return; }
                                    let req_str = String::from_utf8_lossy(&buf[..n]);

                                    // 处理 OPTIONS 跨域预检
                                    if req_str.starts_with("OPTIONS") {
                                        let response = "HTTP/1.1 204 No Content\r\n\
                                            Access-Control-Allow-Origin: *\r\n\
                                            Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
                                            Access-Control-Allow-Headers: Content-Type, Authorization\r\n\r\n";
                                        let _ = socket.write_all(response.as_bytes()).await;
                                        return;
                                    }

                                    // 处理 SSE 连接请求 (/sse)
                                    if req_str.contains("/sse") {
                                        let sse_header = "HTTP/1.1 200 OK\r\n\
                                            Content-Type: text/event-stream\r\n\
                                            Cache-Control: no-cache\r\n\
                                            Connection: keep-alive\r\n\
                                            Access-Control-Allow-Origin: *\r\n\r\n\
                                            event: endpoint\r\ndata: /message\r\n\r\n";
                                        let _ = socket.write_all(sse_header.as_bytes()).await;
                                        return;
                                    }

                                    // 处理 MCP JSON-RPC 2.0 请求
                                    let tools_json = serde_json::json!({
                                        "jsonrpc": "2.0",
                                        "result": {
                                            "tools": [
                                                {
                                                    "name": "admt_get_devices",
                                                    "description": "获取连接到 ADMT 的 Android 设备列表及连接状态",
                                                    "inputSchema": { "type": "object", "properties": {} }
                                                },
                                                {
                                                    "name": "admt_get_device_info",
                                                    "description": "获取 Android 设备的详细硬件指纹、型号及电量",
                                                    "inputSchema": { "type": "object", "properties": { "serial": { "type": "string" } } }
                                                },
                                                {
                                                    "name": "admt_execute_adb",
                                                    "description": "在指定设备上执行安全 ADB Shell 命令行",
                                                    "inputSchema": { "type": "object", "properties": { "command": { "type": "string" } }, "required": ["command"] }
                                                },
                                                {
                                                    "name": "admt_reboot_device",
                                                    "description": "重启设备到系统/恢复模式/引导加载器",
                                                    "inputSchema": { "type": "object", "properties": { "target": { "type": "string" } }, "required": ["target"] }
                                                }
                                            ]
                                        }
                                    });

                                    let body = serde_json::to_string(&tools_json).unwrap_or_default();
                                    let response = format!(
                                        "HTTP/1.1 200 OK\r\n\
                                        Content-Type: application/json\r\n\
                                        Access-Control-Allow-Origin: *\r\n\
                                        Content-Length: {}\r\n\r\n{}",
                                        body.len(),
                                        body
                                    );
                                    let _ = socket.write_all(response.as_bytes()).await;
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
    Ok(true)
}

/// 获取当前 MCP 服务端状态
#[tauri::command]
pub fn get_mcp_server_status() -> McpServerStatus {
    let running = SERVER_STATE.is_running.load(Ordering::SeqCst);
    let port = SERVER_STATE.port.load(Ordering::SeqCst);
    McpServerStatus {
        is_running: running,
        port,
        clients: 0,
        url: format!("http://127.0.0.1:{}/sse", port),
    }
}
