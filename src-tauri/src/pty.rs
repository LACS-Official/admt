//! 交互式终端会话（PTY）
//!
//! Windows 下由 portable-pty 走 ConPTY，Unix 下走原生 pty。与
//! `execute_host_command` 的一次性管道不同，这里启动的是**常驻的真实
//! shell 进程**：拥有控制台句柄、可写 stdin、增量输出与窗口尺寸信号。
//! PSReadLine、Tab 补全、上下箭头历史、Ctrl+C、VT 颜色和 ssh 密码交互
//! 因此与系统原生 PowerShell / CMD 一致。
//!
//! 输出以 base64 编码的原始字节流推送，避免在 Rust 侧按块做 UTF-8
//! 转换时切断多字节字符；解码与状态机交给前端 xterm 处理。

use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtyPair, PtySize, SlavePty};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

/// 单个终端会话持有的句柄。
///
/// `MasterPty` / `Writer` 只保证 Send，用 Mutex 包一层让整个结构体达到
/// Sync，从而可以放进 Arc 并被多个 Tauri command 并发访问。
pub struct PtySession {
    master: Mutex<Box<dyn MasterPty + Send>>,
    // Windows ConPTY 的从端句柄必须随会话保活，提前 drop 会关闭伪控制台；
    // 用 Mutex 包一层只为让 PtySession 满足 Sync，实际不做并发访问。
    _slave: Mutex<Box<dyn SlavePty + Send>>,
    writer: Mutex<Box<dyn Write + Send>>,
    killer: Mutex<Box<dyn ChildKiller + Send + Sync>>,
    pub shell: String,
}

#[derive(Default)]
pub struct PtyManager {
    sessions: Mutex<HashMap<String, Arc<PtySession>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }

    fn get(&self, id: &str) -> Result<Arc<PtySession>, String> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|_| "终端会话表已损坏".to_string())?;
        sessions
            .get(id)
            .cloned()
            .ok_or_else(|| "终端会话不存在或已结束".to_string())
    }
}

#[derive(Clone, Serialize)]
struct PtyOutputPayload {
    id: String,
    /// base64 编码的原始字节块
    chunk: String,
}

#[derive(Clone, Serialize)]
struct PtyExitPayload {
    id: String,
}

#[derive(Clone, Serialize)]
pub struct PtySessionInfo {
    pub id: String,
    pub shell: String,
}

/// 解析 shell 可执行文件候选列表：优先 PowerShell 7，回退 5.1。
fn shell_candidates(kind: &str) -> Vec<&'static str> {
    #[cfg(windows)]
    {
        match kind {
            "cmd" => vec!["cmd.exe"],
            // Windows 自带 5.1 必定存在，放在首位可避免「先 spawn 失败再回退」
            // 这条未验证路径；安装 PS7 后可在扩展中显式指定 pwsh.exe。
            "powershell" => vec!["powershell.exe", "powershell", "pwsh.exe", "pwsh"],
            _ => vec!["powershell.exe", "powershell"],
        }
    }
    #[cfg(not(windows))]
    {
        match kind {
            "cmd" => vec!["sh"],
            _ => vec!["sh", "bash"],
        }
    }
}

fn default_cwd() -> Option<String> {
    dirs::home_dir().map(|p| p.to_string_lossy().to_string())
}

fn build_command(exe: &str, cwd: &Option<String>) -> CommandBuilder {
    let mut cmd = CommandBuilder::new(exe);

    // 不加 -NonInteractive / -NoProfile：让 PSReadLine 与用户 profile
    // 按原生方式加载，这是「和原版 PowerShell 一样」的关键。
    #[cfg(windows)]
    if exe.contains("powershell") || exe.contains("pwsh") {
        cmd.arg("-NoLogo");
    }

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    if let Some(dir) = cwd.as_ref().filter(|d| !d.trim().is_empty()) {
        cmd.cwd(dir);
    } else if let Some(dir) = default_cwd() {
        cmd.cwd(dir);
    }
    cmd
}

fn spawn_shell(
    slave: &Box<dyn SlavePty + Send>,
    kind: &str,
    cwd: &Option<String>,
) -> Result<(Box<dyn portable_pty::Child + Send + Sync>, String), String> {
    let mut last_error = String::new();
    for exe in shell_candidates(kind) {
        match slave.spawn_command(build_command(exe, cwd)) {
            Ok(child) => return Ok((child, exe.to_string())),
            Err(e) => last_error = format!("{}: {}", exe, e),
        }
    }
    Err(format!("无法启动 {} 终端（{}）", kind, last_error))
}

/// 创建一个常驻交互会话，返回会话 ID。
#[tauri::command]
pub fn pty_create(
    app: AppHandle,
    manager: State<'_, PtyManager>,
    shell: Option<String>,
    cols: Option<u16>,
    rows: Option<u16>,
    cwd: Option<String>,
) -> Result<String, String> {
    let kind = shell
        .unwrap_or_else(|| "powershell".to_string())
        .to_ascii_lowercase();
    let kind = if kind == "cmd" { "cmd" } else { "powershell" };

    let pty_system = native_pty_system();
    let pair: PtyPair = pty_system
        .openpty(PtySize {
            rows: rows.unwrap_or(24).max(2),
            cols: cols.unwrap_or(80).max(20),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("创建伪终端失败: {}", e))?;

    let PtyPair { master, slave } = pair;
    let (mut child, exe) = spawn_shell(&slave, kind, &cwd)?;

    let killer = child.clone_killer();
    let reader = master
        .try_clone_reader()
        .map_err(|e| format!("打开终端输出流失败: {}", e))?;
    let writer = master
        .take_writer()
        .map_err(|e| format!("打开终端输入流失败: {}", e))?;

    let id = Uuid::new_v4().to_string();
    let session = Arc::new(PtySession {
        master: Mutex::new(master),
        _slave: Mutex::new(slave),
        writer: Mutex::new(writer),
        killer: Mutex::new(killer),
        shell: exe.clone(),
    });

    manager
        .sessions
        .lock()
        .map_err(|_| "终端会话表已损坏".to_string())?
        .insert(id.clone(), Arc::clone(&session));

    // 输出线程：按字节流增量推送，不做字符解码
    let read_id = id.clone();
    let read_app = app.clone();
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let payload = PtyOutputPayload {
                        id: read_id.clone(),
                        chunk: STANDARD.encode(&buf[..n]),
                    };
                    if read_app.emit("pty-output", payload).is_err() {
                        break;
                    }
                }
                Err(e) => {
                    log::debug!("pty reader stopped ({}): {}", read_id, e);
                    break;
                }
            }
        }
    });

    // 退出线程：进程真正结束后通知前端。会话表项由前端收到退出事件后
    // 调用 pty_close 清理，此处只负责 wait，避免形成僵尸进程。
    let wait_id = id.clone();
    let wait_app = app.clone();
    std::thread::spawn(move || {
        let _ = child.wait();
        let _ = wait_app.emit("pty-exit", PtyExitPayload { id: wait_id });
    });

    log::info!("PTY session created: {} ({})", id, exe);
    Ok(id)
}

/// 向会话写入按键字节（xterm onData 原样送入，含 \x03 等控制字符）。
#[tauri::command]
pub fn pty_write(manager: State<'_, PtyManager>, id: String, data: String) -> Result<(), String> {
    let session = manager.get(&id)?;
    let mut writer = session
        .writer
        .lock()
        .map_err(|_| "终端输入流已锁定".to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("写入终端失败: {}", e))?;
    writer.flush().map_err(|e| format!("刷新终端失败: {}", e))?;
    Ok(())
}

/// 同步终端尺寸，触发 shell 侧 SIGWINCH / ConPTY 重排。
#[tauri::command]
pub fn pty_resize(
    manager: State<'_, PtyManager>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let session = manager.get(&id)?;
    let master = session
        .master
        .lock()
        .map_err(|_| "终端尺寸控制已锁定".to_string())?;
    master
        .resize(PtySize {
            rows: rows.max(2),
            cols: cols.max(20),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("调整终端尺寸失败: {}", e))?;
    Ok(())
}

/// 结束会话：终止子进程并释放全部句柄。
#[tauri::command]
pub fn pty_close(manager: State<'_, PtyManager>, id: String) -> Result<(), String> {
    let session = manager
        .sessions
        .lock()
        .map_err(|_| "终端会话表已损坏".to_string())?
        .remove(&id);

    if let Some(session) = session {
        if let Ok(mut killer) = session.killer.lock() {
            let _ = killer.kill();
        }
        log::info!("PTY session closed: {}", id);
    }
    Ok(())
}

/// 当前活跃会话列表，便于排查与后续多标签扩展。
#[tauri::command]
pub fn pty_list(manager: State<'_, PtyManager>) -> Result<Vec<PtySessionInfo>, String> {
    let sessions = manager
        .sessions
        .lock()
        .map_err(|_| "终端会话表已损坏".to_string())?;
    Ok(sessions
        .iter()
        .map(|(id, s)| PtySessionInfo {
            id: id.clone(),
            shell: s.shell.clone(),
        })
        .collect())
}
