use std::env;
use std::process::Command;

fn main() {
    // 设置构建时间
    let build_date = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();
    println!("cargo:rustc-env=BUILD_DATE={}", build_date);
    
    // 尝试获取Git提交哈希
    if let Ok(output) = Command::new("git")
        .args(&["rev-parse", "--short", "HEAD"])
        .output()
    {
        if output.status.success() {
            let git_hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
            println!("cargo:rustc-env=GIT_HASH={}", git_hash);
        }
    }
    
    // 设置构建环境
    let profile = env::var("PROFILE").unwrap_or_else(|_| "unknown".to_string());
    println!("cargo:rustc-env=BUILD_PROFILE={}", profile);
    
    // 检查是否为调试构建
    if profile == "debug" {
        println!("cargo:rustc-cfg=debug_build");
    }
    
    tauri_build::build()
}