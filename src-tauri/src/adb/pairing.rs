//! Android 11+ 无线调试 QR 配对编排器
//!
//! QR 配对流程中 PC 端**不需要**实现 SPAKE2：
//! 手机扫码后自行启动 pairing server 并通过 mDNS 广播 `_adb-tls-pairing._tcp`，
//! PC 端只需发现该实例并调用 `adb pair ip:port <code>`（TLS 1.3 + SPAKE2 由 adb
//! 二进制内置完成），成功后再发现 `_adb-tls-connect._tcp` 并 `adb connect`。
//!
//! 进度通过 `wireless-pairing-progress` 事件向前端推送：
//! `searching` → `device_found` → `pairing` → `paired` → `connecting` → `connected` / `failed`

use crate::error::{AdmtError, Result};
use crate::utils::execute_adb_command;
use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use once_cell::sync::Lazy;
use rand::{distr::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

/// 配对进度事件名
const EVENT_PAIRING_PROGRESS: &str = "wireless-pairing-progress";
/// 手机扫码后广播的配对服务类型
const SERVICE_PAIRING: &str = "_adb-tls-pairing._tcp.local.";
/// 无线调试连接服务类型（配对成功后用于 adb connect）
const SERVICE_CONNECT: &str = "_adb-tls-connect._tcp.local.";
/// 等待手机扫码并被发现的超时（留给用户操作时间）
const SCAN_TIMEOUT: Duration = Duration::from_secs(180);
/// 配对成功后发现连接服务的超时
const CONNECT_DISCOVERY_TIMEOUT: Duration = Duration::from_secs(45);
/// 单条 adb 命令超时
const ADB_OP_TIMEOUT: u64 = 30;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingInfo {
    pub service_name: String,
    pub pairing_code: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingProgress {
    /// searching | device_found | pairing | paired | connecting | connected | failed
    pub status: String,
    pub message: String,
    pub target: Option<String>,
}

struct PairingSession {
    stop: Arc<AtomicBool>,
    daemon: ServiceDaemon,
}

static PAIRING_SESSION: Lazy<Mutex<Option<PairingSession>>> = Lazy::new(|| Mutex::new(None));

/// 结束当前会话（幂等）：置停止标志、关闭 mDNS daemon、清空会话槽
fn end_session() {
    if let Some(session) = PAIRING_SESSION.lock().unwrap().take() {
        session.stop.store(true, Ordering::Relaxed);
        let _ = session.daemon.shutdown();
        log::info!("ADB QR pairing session ended");
    }
}

/// 取 mDNS 实例名（fullname 形如 `<instance>._adb-tls-pairing._tcp.local.`）
fn instance_name(info: &ServiceInfo) -> &str {
    info.get_fullname().split('.').next().unwrap_or("")
}

/// 在后台线程里监听 mDNS 事件，返回首个匹配服务的 (IPv4, 端口)
async fn find_service<F>(
    daemon: &ServiceDaemon,
    service_type: &str,
    stop: &Arc<AtomicBool>,
    timeout: Duration,
    matcher: F,
) -> Option<(String, u16)>
where
    F: Fn(&ServiceInfo) -> bool + Send + 'static,
{
    let receiver = match daemon.browse(service_type) {
        Ok(rx) => rx,
        Err(e) => {
            log::error!("[pairing] mDNS browse {} failed: {}", service_type, e);
            return None;
        }
    };

    let (tx, mut rx) = tokio::sync::mpsc::channel::<(String, u16)>(1);
    let stop2 = Arc::clone(stop);
    // 线程自身兜底期限：比调用方超时多 5 秒，避免遗漏唤醒后线程长挂
    let deadline = Instant::now() + timeout + Duration::from_secs(5);

    std::thread::spawn(move || {
        while !stop2.load(Ordering::Relaxed) && Instant::now() < deadline {
            match receiver.recv_timeout(Duration::from_millis(500)) {
                Ok(ServiceEvent::ServiceResolved(info)) => {
                    if matcher(&info) {
                        if let Some(ip) = info.get_addresses_v4().iter().next() {
                            let _ = tx.blocking_send((ip.to_string(), info.get_port()));
                            break;
                        }
                    }
                }
                Ok(_) => {}
                // flume RecvTimeoutError：Timeout 继续等，Disconnected 结束
                Err(_) => {
                    if receiver.is_disconnected() {
                        break;
                    }
                }
            }
        }
    });

    match tokio::time::timeout(timeout, rx.recv()).await {
        Ok(Some(target)) => Some(target),
        _ => None,
    }
}

/// QR 配对主流程
async fn run_qr_pairing(
    app: AppHandle,
    daemon: ServiceDaemon,
    service_name: String,
    pairing_code: String,
    stop: Arc<AtomicBool>,
) {
    let emit = |status: &str, message: &str, target: Option<String>| {
        let payload = PairingProgress {
            status: status.to_string(),
            message: message.to_string(),
            target,
        };
        if let Err(e) = app.emit(EVENT_PAIRING_PROGRESS, payload) {
            log::warn!("[pairing] emit progress failed: {}", e);
        }
    };

    emit(
        "searching",
        "Waiting for the phone to scan the QR code",
        None,
    );

    // 阶段一：手机扫码后自行广播 `_adb-tls-pairing._tcp`，按 QR 中的实例名匹配
    let pairing_target = {
        let sn = service_name.clone();
        find_service(&daemon, SERVICE_PAIRING, &stop, SCAN_TIMEOUT, move |info| {
            instance_name(info).eq_ignore_ascii_case(&sn)
        })
        .await
    };

    let (pair_ip, pair_port) = match pairing_target {
        Some(t) => t,
        None => {
            if !stop.load(Ordering::Relaxed) {
                emit(
                    "failed",
                    "Timed out waiting for the device. Make sure the phone scanned the QR code and is on the same LAN.",
                    None,
                );
                end_session();
            }
            return;
        }
    };

    let pair_addr = format!("{}:{}", pair_ip, pair_port);
    emit(
        "device_found",
        "Device discovered, starting pairing",
        Some(pair_addr.clone()),
    );
    emit("pairing", "Running adb pair", Some(pair_addr.clone()));

    // 阶段二：adb pair（TLS 1.3 + SPAKE2 由 adb 二进制内置完成）
    match execute_adb_command(&["pair", &pair_addr, &pairing_code], Some(ADB_OP_TIMEOUT)).await {
        Ok(r) if r.success => {
            log::info!("[pairing] adb pair succeeded: {}", pair_addr);
            emit("paired", "Paired successfully", Some(pair_addr.clone()));
        }
        Ok(r) => {
            let detail = if r.output.trim().is_empty() {
                r.error.clone().unwrap_or_default()
            } else {
                r.output.clone()
            };
            emit(
                "failed",
                &format!("adb pair failed: {}", detail.trim()),
                Some(pair_addr),
            );
            end_session();
            return;
        }
        Err(e) => {
            emit(
                "failed",
                &format!("adb pair failed: {}", e),
                Some(pair_addr),
            );
            end_session();
            return;
        }
    }

    // 阶段三：发现 `_adb-tls-connect._tcp`（同主机）并 adb connect
    let want_ip = pair_ip.clone();
    let connect_target = find_service(
        &daemon,
        SERVICE_CONNECT,
        &stop,
        CONNECT_DISCOVERY_TIMEOUT,
        move |info| {
            info.get_addresses_v4()
                .iter()
                .any(|ip| ip.to_string() == want_ip)
        },
    )
    .await;

    let (conn_ip, conn_port) = match connect_target {
        Some(t) => t,
        None => {
            if !stop.load(Ordering::Relaxed) {
                emit(
                    "failed",
                    "Paired, but the wireless debugging service was not found. Keep Wireless debugging enabled on the phone.",
                    Some(pair_addr),
                );
                end_session();
            }
            return;
        }
    };

    let conn_addr = format!("{}:{}", conn_ip, conn_port);
    emit(
        "connecting",
        "Connecting to wireless debugging",
        Some(conn_addr.clone()),
    );

    match execute_adb_command(&["connect", &conn_addr], Some(ADB_OP_TIMEOUT)).await {
        Ok(r) if r.success => {
            log::info!("[pairing] adb connect succeeded: {}", conn_addr);
            emit(
                "connected",
                "Wireless device connected",
                Some(conn_addr),
            );
        }
        Ok(r) => {
            let detail = if r.output.trim().is_empty() {
                r.error.clone().unwrap_or_default()
            } else {
                r.output.clone()
            };
            emit(
                "failed",
                &format!("adb connect failed: {}", detail.trim()),
                Some(conn_addr),
            );
        }
        Err(e) => {
            emit(
                "failed",
                &format!("adb connect failed: {}", e),
                Some(conn_addr),
            );
        }
    }
    end_session();
}

/// 创建 QR 配对会话：生成实例名与配对码，后台执行发现/配对/连接流程。
/// 返回的 `service_name` / `pairing_code` 用于前端拼二维码：
/// `WIFI:T:ADB;S:<serviceName>;P:<pairingCode>;;`
#[tauri::command]
pub async fn start_adb_pairing_server(app: AppHandle) -> Result<PairingInfo> {
    // 同时只允许一个会话
    end_session();

    let pairing_code: String = rand::rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();
    let service_name = format!("ADMT-{}", rand::rng().random_range(1000..9999));

    let daemon = ServiceDaemon::new().map_err(|e| AdmtError::Unknown {
        message: e.to_string(),
    })?;

    let stop = Arc::new(AtomicBool::new(false));
    *PAIRING_SESSION.lock().unwrap() = Some(PairingSession {
        stop: Arc::clone(&stop),
        daemon: daemon.clone(),
    });

    let app2 = app.clone();
    let sn = service_name.clone();
    let code = pairing_code.clone();
    tauri::async_runtime::spawn(async move {
        run_qr_pairing(app2, daemon, sn, code, stop).await;
    });

    log::info!(
        "[pairing] QR pairing session started: service={}, code={}",
        service_name,
        pairing_code
    );

    Ok(PairingInfo {
        service_name,
        pairing_code,
    })
}

#[tauri::command]
pub async fn stop_adb_pairing_server() -> Result<()> {
    end_session();
    Ok(())
}
