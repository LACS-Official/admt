use std::env;
use std::process::Command;

fn main() {
    // 确保OUT_DIR环境变量可用
    let _out_dir = env::var("OUT_DIR").unwrap_or_else(|_| {
        // 如果OUT_DIR未设置，使用默认值
        println!("cargo:warning=OUT_DIR not set, using default value");
        "target/build".to_string()
    });
    
    // 设置构建时间
    let build_date = chrono::Utc::now()
        .format("%Y-%m-%d %H:%M:%S UTC")
        .to_string();
    println!("cargo:rustc-env=BUILD_DATE={}", build_date);

    // 尝试获取Git提交哈希
    if let Ok(output) = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
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

    // 在发布构建中自动启用隐藏控制台特性
    if profile == "release" {
        println!("cargo:rustc-cfg=hide_console");
        println!("cargo:rustc-cfg=release_build");
        println!("cargo:warning=Building in release mode with hidden console windows");
    }

    // Windows平台特定配置
    if cfg!(target_os = "windows") {
        println!("cargo:rustc-link-lib=user32");
        println!("cargo:rustc-link-lib=kernel32");
        println!("cargo:rustc-cfg=windows_platform");
    }

    // 设置环境变量区分开发/发布模式
    if profile == "debug" {
        println!("cargo:rustc-env=APP_MODE=development");
    } else {
        println!("cargo:rustc-env=APP_MODE=production");
    }

    tauri_build::build()
}
