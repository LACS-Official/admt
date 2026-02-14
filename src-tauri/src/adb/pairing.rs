use crate::error::{AdmtError, Result};
use mdns_sd::{ServiceDaemon, ServiceInfo};
use once_cell::sync::Lazy;
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::TcpListener;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairingInfo {
    pub service_name: String,
    pub port: u16,
    pub pairing_code: String,
}

pub struct PairingServer {
    #[allow(dead_code)]
    daemon: ServiceDaemon,
    pairing_code: String,
    port: u16,
}

static PAIRING_SERVER: Lazy<Mutex<Option<PairingServer>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
pub async fn start_adb_pairing_server() -> Result<PairingInfo> {
    let mut server_guard = PAIRING_SERVER.lock().unwrap();
    if server_guard.is_some() {
        // Already running, return existing info
        let s = server_guard.as_ref().unwrap();
        return Ok(PairingInfo {
            service_name: "ADMT-Pairing".to_string(), // Simplified for now
            port: s.port,
            pairing_code: s.pairing_code.clone(),
        });
    }

    let pairing_code: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(6)
        .map(char::from)
        .collect();

    // Find an available port
    let listener = TcpListener::bind("0.0.0.0:0")?;
    let port = listener.local_addr()?.port();
    drop(listener); // Close and reopen with tokio

    let service_name = format!("ADMT-{}", rand::thread_rng().gen_range(1000..9999));

    let mdns = ServiceDaemon::new().map_err(|e| AdmtError::Unknown {
        message: e.to_string(),
    })?;
    let service_type = "_adb-tls-pairing._tcp.local.";
    let instance_name = &service_name;
    let host_name = "admt-host.local.";
    let properties: HashMap<String, String> = HashMap::new();

    let my_service = ServiceInfo::new(
        service_type,
        instance_name,
        host_name,
        "0.0.0.0", // mDNS responder will fill this correctly
        port,
        properties,
    )
    .map_err(|e| AdmtError::Unknown {
        message: e.to_string(),
    })?;

    mdns.register(my_service).map_err(|e| AdmtError::Unknown {
        message: e.to_string(),
    })?;

    // TODO: Spawn tokio task to handle TCP and SPAKE2
    // This is a complex task and requires bit-level protocol handling
    // For the initial PR, we focus on the UI and basic wiring.

    *server_guard = Some(PairingServer {
        daemon: mdns,
        pairing_code: pairing_code.clone(),
        port,
    });

    Ok(PairingInfo {
        service_name,
        port,
        pairing_code,
    })
}

#[tauri::command]
pub async fn stop_adb_pairing_server() -> Result<()> {
    let mut server_guard = PAIRING_SERVER.lock().unwrap();
    if let Some(_server) = server_guard.take() {
        // mdns-sd daemon will be dropped here, unregistering service
        log::info!("ADB pairing server stopped");
    }
    Ok(())
}
