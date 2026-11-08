//! 交互式终端冒烟测试：验证当前 Windows 会话下 ConPTY 能启动 shell、
//! 输出提示符，并能把按键写入 stdin 得到回显。
//! 运行：cargo run --example pty_smoke
//! 可用环境变量 PTY_SMOKE_EXE 指定可执行文件（默认 powershell.exe）。

use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::io::{Read, Write};
use std::sync::mpsc;
use std::time::{Duration, Instant};

fn main() {
    let exe = std::env::var("PTY_SMOKE_EXE").unwrap_or_else(|_| "powershell.exe".to_string());
    eprintln!("[step] exe = {}", exe);

    let system = native_pty_system();
    let pair: PtyPair = system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .expect("openpty 失败");
    eprintln!("[step] ConPTY created");

    let PtyPair { master, slave } = pair;

    // 可选：验证「首个候选不存在 -> 回退到下一个」这条路径是否可行
    if std::env::var("PTY_SMOKE_FAIL_FIRST").is_ok() {
        let bad = CommandBuilder::new("admt-no-such-shell.exe");
        eprintln!(
            "[step] intentional failed spawn = {:?}",
            slave.spawn_command(bad).is_err()
        );
    }

    let mut cmd = CommandBuilder::new(&exe);
    if exe.to_ascii_lowercase().contains("powershell") {
        cmd.arg("-NoLogo");
    }
    cmd.env("TERM", "xterm-256color");

    let mut child = slave.spawn_command(cmd).expect("启动 shell 失败");
    eprintln!("[step] spawned, pid = {:?}", child.process_id());
    // Windows ConPTY 的从端句柄必须保持存活
    let _keep_alive = slave;

    let reader = master.try_clone_reader().expect("打开输出流失败");
    let mut writer = master.take_writer().expect("打开输入流失败");
    eprintln!("[step] reader / writer ready");

    let (tx, rx) = mpsc::channel::<Vec<u8>>();
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    eprintln!("[reader] EOF");
                    break;
                }
                Ok(n) => {
                    eprintln!("[reader] {} bytes", n);
                    if tx.send(buf[..n].to_vec()).is_err() {
                        break;
                    }
                }
                Err(e) => {
                    eprintln!("[reader] error: {}", e);
                    break;
                }
            }
        }
    });

    std::thread::sleep(Duration::from_millis(2500));
    eprintln!("[step] try_wait = {:?}", child.try_wait());
    writer
        .write_all(b"echo PTY-SMOKE-OK\r")
        .expect("写入失败");
    writer.flush().expect("刷新失败");
    eprintln!("[step] command written");

    let deadline = Instant::now() + Duration::from_secs(8);
    let mut output = Vec::<u8>::new();
    let mut matched = false;
    let mut dsr_replied = false;
    while Instant::now() < deadline {
        match rx.recv_timeout(Duration::from_millis(250)) {
            Ok(chunk) => output.extend_from_slice(&chunk),
            Err(_) => {}
        }
        // 真实终端（xterm.js）会自动应答 ESC[6n 光标位置查询；
        // 冒烟脚本需要手动回一次，否则 shell 会一直等待而不输出提示符。
        if !dsr_replied && output.windows(4).any(|w| w == b"\x1b[6n") {
            writer.write_all(b"\x1b[1;1R").expect("回复 DSR 失败");
            writer.flush().expect("回复 DSR 失败");
            dsr_replied = true;
            eprintln!("[step] replied to ESC[6n");
        }
        let text = String::from_utf8_lossy(&output);
        if text.matches("PTY-SMOKE-OK").count() >= 2 {
            matched = true;
            break;
        }
    }

    let text = String::from_utf8_lossy(&output);
    println!("---- PTY OUTPUT ({} bytes) ----", output.len());
    println!("{}", text);
    println!("hex: {:02X?}", &output[..output.len().min(64)]);
    println!("---- 结果 ----");
    println!("回显与执行结果: {}", if matched { "OK" } else { "未匹配" });
    println!("包含提示符: {}", text.contains("PS ") || text.contains(">"));
    eprintln!("[step] final try_wait = {:?}", child.try_wait());

    let _ = child.kill();
    if matched {
        std::process::exit(0);
    }
    std::process::exit(1);
}
