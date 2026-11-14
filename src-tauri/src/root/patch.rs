//! Root 镜像修补引擎。
//!
//! 设计原则：**不允许静默降级**。任何依赖缺失、注入失败或产物未发生变化的情况
//! 都必须返回结构化错误，绝不把未修补的原镜像当成成品交给刷写流程。
//!
//! 支持的引擎：
//! - Magisk：magiskboot + 从 APK 提取的 magiskinit（Ramdisk 注入）
//! - KernelSU / SukiSU Ultra：官方 `ksud` 工具（注入预编译 kernelsu.ko + ksuinit）
//! - APatch：KernelPatch `kptools` + `kpimg-android`（内核二进制修补）
//!
//! 三者均为「预编译载荷 + 容器 / Ramdisk 注入」，可在电脑端原生完成；仅修补内核
//! 二进制的 APatch 同样依赖预编译 kpimg，无需在设备端重编内核。

use crate::error::{AdmtError, Result};
use serde::Serialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use tauri::path::BaseDirectory;
use tauri::{Emitter, Manager};
use tokio::process::Command;
use zip::ZipArchive;

/// 前端可识别的结构化错误码前缀。
pub const ERR_DEPENDENCY: &str = "PATCH_DEPENDENCY_MISSING";
pub const ERR_NEEDS_PATCHER: &str = "PATCH_ENGINE_REQUIRES_PATCHER";
pub const ERR_NEEDS_DEVICE: &str = "PATCH_ENGINE_REQUIRES_DEVICE";
pub const ERR_OUTPUT_INVALID: &str = "PATCH_OUTPUT_INVALID";

pub const MAGISKBOOT_RELEASES: &str =
    "https://github.com/PinNaCode/magiskboot_build/releases";
pub const KSU_RELEASES: &str = "https://github.com/tiann/KernelSU/releases";
pub const KERNELPATCH_RELEASES: &str = "https://github.com/bmax121/KernelPatch/releases";

// 查询最新 release 必须用 GitHub API；网页地址（/releases/latest）返回 HTML，不能按 JSON 解析。
const MAGISKBOOT_LATEST_API: &str =
    "https://api.github.com/repos/PinNaCode/magiskboot_build/releases/latest";
const KSU_LATEST_API: &str = "https://api.github.com/repos/tiann/KernelSU/releases/latest";
const KERNELPATCH_LATEST_API: &str =
    "https://api.github.com/repos/bmax121/KernelPatch/releases/latest";

const ENGINES: [&str; 4] = ["Magisk", "KernelSU", "SukiSU Ultra", "APatch"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchOutcome {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub exit_code: Option<i32>,
    pub output_path: Option<String>,
    pub source_sha256: String,
    pub patched_sha256: String,
    pub engine: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineCapability {
    pub engine: String,
    /// pc_native | device_assisted | unavailable
    pub mode: String,
    pub available: bool,
    pub reason: String,
    pub required_files: Vec<String>,
    pub hint: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RootPatchCapabilities {
    pub engines: Vec<EngineCapability>,
    pub tools_dir: String,
    pub magiskboot_path: Option<String>,
    pub ksud_path: Option<String>,
    pub kptools_path: Option<String>,
    pub kpimg_path: Option<String>,
}

fn patch_err(code: &str, detail: impl AsRef<str>) -> AdmtError {
    AdmtError::Command(format!("{}:{}", code, detail.as_ref()))
}

fn dependency_err(tool: &str, detail: impl AsRef<str>) -> AdmtError {
    // 保留 DEPENDENCY_MISSING 前缀，供 PatchImagePanel 的依赖提示识别
    AdmtError::Command(format!(
        "DEPENDENCY_MISSING:{} ({}:{}) — {}",
        tool, ERR_DEPENDENCY, tool, detail.as_ref()
    ))
}

/// 应用可写的工具目录（跨平台），优先于只读的 Resource 目录。
pub fn tools_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("admt"))
        .join("tools")
}

fn magiskboot_name() -> String {
    crate::utils::executable_name("magiskboot")
}

fn ksud_name() -> String {
    crate::utils::executable_name("ksud")
}

fn kptools_name() -> String {
    crate::utils::executable_name("kptools")
}

fn kpimg_name() -> String {
    // kpimg-android 没有平台扩展名，自带 -android 后缀
    "kpimg-android".to_string()
}

/// 按「应用数据目录 → 随包 Resource → 可执行文件旁目录」的顺序查找 magiskboot。
pub fn find_magiskboot(app: &tauri::AppHandle) -> Option<PathBuf> {
    let name = magiskboot_name();
    let mut candidates: Vec<PathBuf> = Vec::new();
    candidates.push(tools_dir(app).join(&name));
    if let Ok(p) = app.path().resolve(
        format!("tools/adb/{}/{}", std::env::consts::OS, name),
        BaseDirectory::Resource,
    ) {
        candidates.push(p);
    }
    if let Some(mut p) = std::env::current_exe().ok() {
        p.pop();
        candidates.push(p.join("tools").join("adb").join(std::env::consts::OS).join(&name));
    }
    candidates.into_iter().find(|p| p.is_file())
}

/// 查找已下载的 ksud（KernelSU 官方 PC 修补器）。
pub fn find_ksud(app: &tauri::AppHandle) -> Option<PathBuf> {
    let name = ksud_name();
    tools_dir(app).join(&name).is_file().then(|| tools_dir(app).join(&name))
}

/// 查找已下载的 kptools（APatch 内核修补器）。
pub fn find_kptools(app: &tauri::AppHandle) -> Option<PathBuf> {
    let name = kptools_name();
    tools_dir(app).join(&name).is_file().then(|| tools_dir(app).join(&name))
}

/// 查找已下载的 kpimg-android（APatch KernelPatch 载荷）。
pub fn find_kpimg(app: &tauri::AppHandle) -> Option<PathBuf> {
    let name = kpimg_name();
    tools_dir(app).join(&name).is_file().then(|| tools_dir(app).join(&name))
}

pub fn normalize_engine(raw: &str) -> Result<&'static str> {
    ENGINES
        .iter()
        .find(|e| e.eq_ignore_ascii_case(raw.trim()))
        .copied()
        .ok_or_else(|| patch_err(ERR_NEEDS_PATCHER, format!("未知修补引擎 {}", raw)))
}

/// 查询各引擎当前可用的真实能力，供前端决定流程，而不是一律展示「一键」。
#[tauri::command]
pub async fn get_root_patch_capabilities(
    app_handle: tauri::AppHandle,
) -> Result<RootPatchCapabilities> {
    let mb = find_magiskboot(&app_handle);
    let ksud = find_ksud(&app_handle);
    let kptools = find_kptools(&app_handle);
    let kpimg = find_kpimg(&app_handle);

    let engines = ENGINES
        .iter()
        .map(|engine| match *engine {
            "Magisk" => EngineCapability {
                engine: engine.to_string(),
                mode: "pc_native".to_string(),
                available: mb.is_some(),
                reason: if mb.is_some() {
                    "magiskboot 已就绪，需提供 Magisk APK 以提取 magiskinit".to_string()
                } else {
                    "缺少 magiskboot".to_string()
                },
                required_files: vec![magiskboot_name(), "Magisk APK".to_string()],
                hint: if mb.is_some() {
                    "选择 Magisk 安装包后可在电脑端完成修补".to_string()
                } else {
                    format!("先安装 magiskboot：{}", MAGISKBOOT_RELEASES)
                },
            },
            "KernelSU" | "SukiSU Ultra" => {
                let ok = ksud.is_some();
                EngineCapability {
                    engine: engine.to_string(),
                    mode: "pc_native".to_string(),
                    available: ok,
                    reason: if ok {
                        "ksud 已就绪，注入预编译 kernelsu.ko（需正确 KMI）".to_string()
                    } else {
                        "缺少 ksud（KernelSU 官方 PC 修补器）".to_string()
                    },
                    required_files: vec![ksud_name()],
                    hint: if ok {
                        "提供原厂 boot/init_boot 镜像并填写 KMI 即可在电脑端完成修补".to_string()
                    } else {
                        format!("先安装 ksud：{}", KSU_RELEASES)
                    },
                }
            }
            "APatch" => {
                let ok = kptools.is_some() && kpimg.is_some();
                EngineCapability {
                    engine: engine.to_string(),
                    mode: "pc_native".to_string(),
                    available: ok,
                    reason: if ok {
                        "kptools + kpimg-android 已就绪，修补内核二进制（需 SuperKey）".to_string()
                    } else {
                        "缺少 kptools / kpimg-android".to_string()
                    },
                    required_files: vec![kptools_name(), kpimg_name()],
                    hint: if ok {
                        "提供原厂 boot 镜像并填写 SuperKey 即可在电脑端完成修补".to_string()
                    } else {
                        format!("先安装 kptools：{}", KERNELPATCH_RELEASES)
                    },
                }
            }
            other => EngineCapability {
                engine: engine.to_string(),
                mode: "device_assisted".to_string(),
                available: true,
                reason: "电脑端无官方修补器，需设备在官方 App 内完成修补".to_string(),
                required_files: vec!["设备端官方 App".to_string()],
                hint: format!(
                    "{} 会把原镜像推送到设备，请在官方 App 内选择「修补镜像」，完成后由应用取回产物",
                    other
                ),
            },
        })
        .collect();

    Ok(RootPatchCapabilities {
        engines,
        tools_dir: tools_dir(&app_handle).to_string_lossy().into_owned(),
        magiskboot_path: mb.map(|p| p.to_string_lossy().into_owned()),
        ksud_path: ksud.map(|p| p.to_string_lossy().into_owned()),
        kptools_path: kptools.map(|p| p.to_string_lossy().into_owned()),
        kpimg_path: kpimg.map(|p| p.to_string_lossy().into_owned()),
    })
}

/// 尝试自动安装修补工具。失败时返回明确错误与手动下载入口，绝不返回假成功。
#[tauri::command]
pub async fn ensure_root_patch_tool(
    app_handle: tauri::AppHandle,
    tool: String,
) -> Result<String> {
    let tool_key = tool.to_ascii_lowercase();
    log::info!("[root-patch] 开始安装修补工具: {}", tool_key);
    let outcome = match tool_key.as_str() {
        "magiskboot" => ensure_magiskboot(&app_handle).await,
        "ksud" => ensure_ksud(&app_handle).await,
        "kptools" | "kpimg-android" => ensure_kptools(&app_handle).await,
        _ => Err(patch_err(
            ERR_DEPENDENCY,
            format!("不支持自动安装 {}", tool),
        )),
    };
    match &outcome {
        Ok(path) => log::info!("[root-patch] 修补工具 {} 安装完成: {}", tool_key, path),
        Err(e) => log::error!("[root-patch] 修补工具 {} 安装失败: {}", tool_key, e),
    }
    outcome
}

async fn ensure_magiskboot(app: &tauri::AppHandle) -> Result<String> {
    if let Some(existing) = find_magiskboot(app) {
        return Ok(existing.to_string_lossy().into_owned());
    }
    #[cfg(not(windows))]
    {
        return Err(dependency_err(
            &magiskboot_name(),
            format!("当前平台需手动安装 magiskboot：{}", MAGISKBOOT_RELEASES),
        ));
    }
    #[cfg(windows)]
    {
        let target_dir = tools_dir(app);
        fs::create_dir_all(&target_dir)
            .map_err(|e| AdmtError::Io(format!("创建工具目录失败: {}", e)))?;
        let target = target_dir.join(magiskboot_name());
        let downloaded = tokio::task::spawn_blocking(move || download_magiskboot_windows(&target))
            .await
            .map_err(|e| AdmtError::Command(format!("下载任务异常: {}", e)))??;
        verify_downloaded_tool(&downloaded, &magiskboot_name(), MAGISKBOOT_RELEASES)
    }
}

async fn ensure_ksud(app: &tauri::AppHandle) -> Result<String> {
    if let Some(existing) = find_ksud(app) {
        return Ok(existing.to_string_lossy().into_owned());
    }
    #[cfg(not(windows))]
    {
        return Err(dependency_err(
            &ksud_name(),
            format!("当前平台需手动安装 ksud：{}", KSU_RELEASES),
        ));
    }
    #[cfg(windows)]
    {
        let target_dir = tools_dir(app);
        fs::create_dir_all(&target_dir)
            .map_err(|e| AdmtError::Io(format!("创建工具目录失败: {}", e)))?;
        let target = target_dir.join(ksud_name());
        let downloaded = tokio::task::spawn_blocking(move || download_ksud_windows(&target))
            .await
            .map_err(|e| AdmtError::Command(format!("下载任务异常: {}", e)))??;
        verify_downloaded_tool(&downloaded, &ksud_name(), KSU_RELEASES)
    }
}

async fn ensure_kptools(app: &tauri::AppHandle) -> Result<String> {
    if let (Some(kp), Some(_ki)) = (find_kptools(app), find_kpimg(app)) {
        return Ok(kp.to_string_lossy().into_owned());
    }
    #[cfg(not(windows))]
    {
        return Err(dependency_err(
            &kptools_name(),
            format!("当前平台需手动安装 kptools / kpimg-android：{}", KERNELPATCH_RELEASES),
        ));
    }
    #[cfg(windows)]
    {
        let target_dir = tools_dir(app);
        fs::create_dir_all(&target_dir)
            .map_err(|e| AdmtError::Io(format!("创建工具目录失败: {}", e)))?;
        let _ = tokio::task::spawn_blocking({
            let target_dir = target_dir.clone();
            move || download_kptools_windows(&target_dir)
        })
        .await
        .map_err(|e| AdmtError::Command(format!("下载任务异常: {}", e)))??;
        let kptools = target_dir.join(kptools_name());
        if !kptools.is_file() {
            return Err(dependency_err(
                &kptools_name(),
                format!("解压后未找到 kptools，请手动下载：{}", KERNELPATCH_RELEASES),
            ));
        }
        let kpimg = target_dir.join(kpimg_name());
        if !kpimg.is_file() {
            return Err(dependency_err(
                &kpimg_name(),
                format!("解压后未找到 kpimg-android，请手动下载：{}", KERNELPATCH_RELEASES),
            ));
        }
        Ok(kptools.to_string_lossy().into_owned())
    }
}

/// 验证下载文件大小合理（避免把错误页面当成工具），否则删除并返回明确错误。
fn verify_downloaded_tool(target: &Path, name: &str, releases: &str) -> Result<String> {
    if !target.is_file() {
        return Err(dependency_err(
            name,
            format!("下载后未找到工具，请手动安装：{}", releases),
        ));
    }
    let size = fs::metadata(target).map(|m| m.len()).unwrap_or(0);
    if size < 8 * 1024 {
        let _ = fs::remove_file(target);
        return Err(dependency_err(
            name,
            "下载文件异常（小于 8KB），已删除；请手动下载",
        ));
    }
    log::info!("root patcher installed at {:?} ({} bytes)", target, size);
    Ok(target.to_string_lossy().into_owned())
}

/// 从 Windows Internet Settings 注册表读取系统代理。
/// 环境变量只有从终端启动才会继承；双击 exe 启动时需靠注册表，否则 GitHub 资产域名会被直连拦截。
#[cfg(windows)]
fn windows_system_proxy() -> Option<String> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = hkcu
        .open_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings")
        .ok()?;
    let enabled: u32 = key.get_value("ProxyEnable").unwrap_or(0);
    if enabled == 0 {
        return None;
    }
    let raw: String = key.get_value("ProxyServer").ok()?;
    // ProxyServer 可能是 "host:port"，也可能是 "http=host:port;https=host:port"
    let addr = if raw.contains('=') {
        raw.split(';')
            .find_map(|part| {
                let mut kv = part.splitn(2, '=');
                let scheme = kv.next()?.trim().to_ascii_lowercase();
                let value = kv.next()?.trim();
                (scheme == "https" || scheme == "http" || scheme == "all")
                    .then(|| value.to_string())
            })
            .unwrap_or_default()
    } else {
        raw.trim().to_string()
    };
    if addr.is_empty() {
        return None;
    }
    Some(
        if addr.starts_with("http://") || addr.starts_with("https://") {
            addr
        } else {
            format!("http://{}", addr)
        },
    )
}

#[cfg(windows)]
fn system_proxy_url() -> Option<String> {
    for key in [
        "HTTPS_PROXY",
        "https_proxy",
        "HTTP_PROXY",
        "http_proxy",
    ] {
        if let Ok(v) = std::env::var(key) {
            let trimmed = v.trim();
            if !trimmed.is_empty() {
                log::info!("[root-patch] 代理来源=环境变量 {} -> {}", key, trimmed);
                return Some(trimmed.to_string());
            }
        }
    }
    if let Some(url) = windows_system_proxy() {
        log::info!("[root-patch] 代理来源=Windows 系统代理 -> {}", url);
        return Some(url);
    }
    log::warn!("[root-patch] 未检测到可用代理，GitHub 资产下载可能失败");
    None
}

#[cfg(windows)]
fn http_client() -> Result<reqwest::blocking::Client> {
    log::info!("[root-patch] 开始初始化下载客户端");
    let mut builder = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .user_agent("ADMT-RootTools/1.0")
        .redirect(reqwest::redirect::Policy::limited(10));
    // 尊重系统代理：本机/企业网环境下 GitHub 资产 CDN（objects.githubusercontent.com）
    // 需经代理访问，否则直连会被拦截。
    if let Some(proxy_url) = system_proxy_url() {
        match reqwest::Proxy::all(&proxy_url) {
            Ok(proxy) => builder = builder.proxy(proxy),
            Err(e) => log::warn!("[root-patch] 代理 {} 配置失败，将直连: {}", proxy_url, e),
        }
    }
    builder
        .build()
        .map_err(|e| {
            log::error!("[root-patch] 创建下载客户端失败: {}", e);
            AdmtError::Network(format!("创建下载客户端失败: {}", e))
        })
}

/// GitHub API 匿名限流为 60 次/小时/IP，超限会返回 403。
/// 直连失败时依次尝试公共镜像，避免用户连续点几次「安装工具」就彻底不可用。
#[cfg(windows)]
fn fetch_release_json(client: &reqwest::blocking::Client, api_url: &str) -> Result<Value> {
    let candidates = [
        api_url.to_string(),
        format!("https://gh-proxy.com/{}", api_url),
        format!("https://ghproxy.net/{}", api_url),
    ];
    let mut last_error = String::new();
    for (index, url) in candidates.iter().enumerate() {
        log::info!(
            "[root-patch] 查询最新版本 ({}/{}): {}",
            index + 1,
            candidates.len(),
            url
        );
        let result = client
            .get(url)
            .send()
            .and_then(|r| r.error_for_status())
            .and_then(|r| r.json::<Value>());
        match result {
            Ok(release) => {
                log::info!("[root-patch] 版本查询成功: {}", url);
                return Ok(release);
            }
            Err(e) => {
                log::warn!("[root-patch] 版本查询失败 url={} error={}", url, e);
                last_error = e.to_string();
            }
        }
    }
    log::error!("[root-patch] 所有版本查询地址均失败: {}", last_error);
    Err(AdmtError::Network(format!(
        "查询版本失败（直连与镜像均失败）: {}",
        last_error
    )))
}

#[cfg(windows)]
fn latest_release_asset(
    client: &reqwest::blocking::Client,
    api_url: &str,
    matcher: impl Fn(&str) -> bool,
) -> Result<(String, String)> {
    let release = fetch_release_json(client, api_url)?;

    let assets = release
        .get("assets")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    let found = assets
        .iter()
        .filter_map(|a| {
            let name = a.get("name")?.as_str()?;
            let url = a.get("browser_download_url")?.as_str()?;
            let lower = name.to_ascii_lowercase();
            (matcher(&lower)).then(|| (name.to_string(), url.to_string()))
        })
        .next()
        .ok_or_else(|| {
            log::error!("[root-patch] 发布页没有匹配的工具资源 url={}", api_url);
            AdmtError::Network(format!("发布页没有匹配的工具资源，请手动下载"))
        })?;

    log::info!("[root-patch] 匹配到资产: {}", found.0);
    Ok(found)
}

#[cfg(windows)]
fn is_github_asset(url: &str) -> bool {
    url.contains("github.com") || url.contains("githubusercontent.com")
}

#[cfg(windows)]
fn try_download(client: &reqwest::blocking::Client, url: &str) -> Result<Vec<u8>> {
    let resp = client
        .get(url)
        .send()
        .map_err(|e| {
            log::warn!("[root-patch] 下载请求失败 url={} error={}", url, e);
            AdmtError::Network(format!("下载失败: {}", e))
        })?
        .error_for_status()
        .map_err(|e| {
            log::warn!("[root-patch] 下载返回错误 url={} error={}", url, e);
            AdmtError::Network(format!("下载失败: {}", e))
        })?;
    let bytes = resp
        .bytes()
        .map_err(|e| AdmtError::Network(format!("读取下载内容失败: {}", e)))?;
    let body = bytes.to_vec();
    // 镜像有时返回 200 但空响应体，必须视为失败才能触发下一个候选
    if body.len() < 8 * 1024 {
        log::warn!("[root-patch] 下载内容过小 size={} url={}", body.len(), url);
        return Err(AdmtError::Network(format!(
            "下载内容异常（{} 字节），疑似空响应",
            body.len()
        )));
    }
    Ok(body)
}

#[cfg(windows)]
fn download_bytes(client: &reqwest::blocking::Client, url: &str) -> Result<Vec<u8>> {
    let mut candidates = vec![url.to_string()];
    if is_github_asset(url) {
        candidates.push(format!("https://ghproxy.net/{}", url));
        candidates.push(format!("https://gh-proxy.com/{}", url));
    }
    log::info!(
        "[root-patch] 开始下载资产，候选地址 {} 个: {}",
        candidates.len(),
        url
    );

    let mut last_error = String::new();
    for (index, candidate) in candidates.iter().enumerate() {
        match try_download(client, candidate) {
            Ok(bytes) => {
                log::info!(
                    "[root-patch] 下载完成 size={} bytes 来源={}/{} url={}",
                    bytes.len(),
                    index + 1,
                    candidates.len(),
                    candidate
                );
                return Ok(bytes);
            }
            Err(e) => {
                log::warn!(
                    "[root-patch] 下载失败 ({}/{}): {}",
                    index + 1,
                    candidates.len(),
                    e
                );
                last_error = e.to_string();
            }
        }
    }
    log::error!("[root-patch] 所有下载地址均失败 url={} error={}", url, last_error);
    Err(AdmtError::Network(format!(
        "下载失败（直连与镜像均失败）: {}",
        last_error
    )))
}

#[cfg(windows)]
fn download_magiskboot_windows(target: &Path) -> Result<PathBuf> {
    let client = http_client()?;
    let release = fetch_release_json(&client, MAGISKBOOT_LATEST_API)?;

    let assets = release
        .get("assets")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();

    let asset = assets
        .iter()
        .filter_map(|a| {
            let name = a.get("name")?.as_str()?;
            let url = a.get("browser_download_url")?.as_str()?;
            Some((name.to_ascii_lowercase(), url.to_string()))
        })
        .find(|(name, _)| {
            name.contains("win")
                && (name.ends_with(".zip") || name.ends_with(".exe"))
                && name.contains("magiskboot")
        })
        .or_else(|| {
            assets.iter().find_map(|a| {
                let name = a.get("name")?.as_str()?.to_ascii_lowercase();
                let url = a.get("browser_download_url")?.as_str()?;
                (name.contains("win") && (name.ends_with(".zip") || name.ends_with(".exe")))
                    .then(|| (name, url.to_string()))
            })
        })
        .ok_or_else(|| {
            dependency_err(
                &magiskboot_name(),
                format!("发布页没有找到 Windows 版资源，请手动下载：{}", MAGISKBOOT_RELEASES),
            )
        })?;

    let bytes = download_bytes(&client, &asset.1)?;
    if asset.0.ends_with(".exe") {
        fs::write(target, &bytes)
            .map_err(|e| AdmtError::Io(format!("写入 magiskboot 失败: {}", e)))?;
        return Ok(target.to_path_buf());
    }

    extract_zip_entry(&bytes, &magiskboot_name().to_ascii_lowercase(), target)
}

#[cfg(windows)]
fn download_ksud_windows(target: &Path) -> Result<PathBuf> {
    let client = http_client()?;
    let (name, url) = latest_release_asset(&client, KSU_LATEST_API, |n| {
        n.contains("ksud") && n.contains("win") && (n.ends_with(".zip") || n.ends_with(".exe"))
    })?;
    let bytes = download_bytes(&client, &url)?;
    if name.ends_with(".exe") {
        fs::write(target, &bytes)
            .map_err(|e| AdmtError::Io(format!("写入 ksud 失败: {}", e)))?;
        return Ok(target.to_path_buf());
    }
    extract_zip_entry(&bytes, &ksud_name().to_ascii_lowercase(), target)
}

#[cfg(windows)]
fn download_kptools_windows(target_dir: &Path) -> Result<()> {
    let client = http_client()?;
    let (_name, url) = latest_release_asset(&client, KERNELPATCH_LATEST_API, |n| {
        n.contains("kptools") && n.contains("win") && n.ends_with(".7z")
    })?;
    let bytes = download_bytes(&client, &url)?;
    // sevenz-rust 的 decompress_file 需要文件路径，先把 7z 落到临时文件再解压
    let tmp = target_dir.join("kptools.7z");
    fs::write(&tmp, &bytes)
        .map_err(|e| AdmtError::Io(format!("写入 kptools 压缩包失败: {}", e)))?;
    sevenz_rust::decompress_file(&tmp, target_dir)
        .map_err(|e| AdmtError::Io(format!("解压 kptools 失败: {}", e)))?;
    let _ = fs::remove_file(&tmp);
    // 7z 内同时包含 kptools(.exe) 与 kpimg-android，二者都需保留在工具目录
    log::info!("[root-patch] kptools archive extracted to {:?}", target_dir);
    Ok(())
}

#[cfg(windows)]
fn extract_zip_entry(bytes: &[u8], wanted: &str, target: &Path) -> Result<PathBuf> {
    let cursor = std::io::Cursor::new(bytes.to_vec());
    let mut archive = ZipArchive::new(cursor)
        .map_err(|e| AdmtError::Io(format!("解压失败: {}", e)))?;
    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| AdmtError::Io(format!("读取压缩包失败: {}", e)))?;
        let entry_name = Path::new(file.name())
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if entry_name == wanted {
            let mut out = Vec::new();
            file.read_to_end(&mut out)
                .map_err(|e| AdmtError::Io(format!("读取失败: {}", e)))?;
            fs::write(target, &out)
                .map_err(|e| AdmtError::Io(format!("写入失败: {}", e)))?;
            return Ok(target.to_path_buf());
        }
    }
    Err(dependency_err(
        wanted,
        format!("压缩包内没有 {}，请手动下载", wanted),
    ))
}

pub(crate) fn sha256_file(path: &Path) -> Result<String> {
    let mut file = fs::File::open(path)
        .map_err(|e| AdmtError::Io(format!("无法读取 {}: {}", path.display(), e)))?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = file
            .read(&mut buf)
            .map_err(|e| AdmtError::Io(format!("计算校验值失败: {}", e)))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

pub(crate) fn validate_input_image(path: &Path) -> Result<()> {
    if !path.is_file() {
        return Err(patch_err(ERR_OUTPUT_INVALID, "原始镜像文件不存在"));
    }
    let size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    if size < 1024 {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "原始镜像小于 1KB，不是有效的 boot / init_boot 镜像",
        ));
    }
    let mut magic = [0u8; 8];
    let mut f = fs::File::open(path)
        .map_err(|e| AdmtError::Io(format!("无法打开原始镜像: {}", e)))?;
    f.read_exact(&mut magic)
        .map_err(|e| AdmtError::Io(format!("读取镜像头失败: {}", e)))?;
    if &magic[..8] != b"ANDROID!" {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "文件头不是 ANDROID!，仅支持 boot / init_boot 镜像",
        ));
    }
    Ok(())
}

/// 校验修补产物：必须存在、非空、保持 boot 头、且与原镜像内容不同。
pub fn validate_patched_image(original: &Path, patched: &Path, engine: &str) -> Result<()> {
    if !patched.is_file() {
        return Err(patch_err(ERR_OUTPUT_INVALID, "未生成修补产物"));
    }
    let patched_size = fs::metadata(patched).map(|m| m.len()).unwrap_or(0);
    let original_size = fs::metadata(original).map(|m| m.len()).unwrap_or(0);
    if patched_size < 1024 {
        return Err(patch_err(ERR_OUTPUT_INVALID, "修补产物为空或过小"));
    }
    if patched_size > original_size.saturating_mul(4).saturating_add(16 * 1024 * 1024) {
        return Err(patch_err(ERR_OUTPUT_INVALID, "修补产物尺寸异常膨胀"));
    }
    let mut magic = [0u8; 8];
    let mut f = fs::File::open(patched)
        .map_err(|e| AdmtError::Io(format!("无法读取修补产物: {}", e)))?;
    f.read_exact(&mut magic)
        .map_err(|e| patch_err(ERR_OUTPUT_INVALID, format!("修补产物头无效: {}", e)))?;
    if &magic[..8] != b"ANDROID!" {
        return Err(patch_err(ERR_OUTPUT_INVALID, "修补产物不是有效的 boot 镜像"));
    }
    if sha256_file(original)? == sha256_file(patched)? {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "修补产物与原镜像完全一致，注入未生效",
        ));
    }
    log::info!("[root-patch] {} output validated ({} bytes)", engine, patched_size);
    Ok(())
}

async fn run_tool(tool: &Path, args: &[&str], cwd: &Path, what: &str) -> Result<String> {
    let mut cmd = Command::new(tool);
    cmd.current_dir(cwd)
        .args(args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    {
        cmd.creation_flags(0x08000000);
    }
    let output = cmd
        .output()
        .await
        .map_err(|e| AdmtError::Command(format!("{} 执行失败: {}", what, e)))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    if !output.status.success() {
        return Err(AdmtError::Command(format!(
            "{} 失败 (exit {:?}): {} {}",
            what,
            output.status.code(),
            stdout.trim(),
            stderr.trim()
        )));
    }
    log::info!("[root-patch] {} ok: {}", what, stdout.trim());
    Ok(stdout)
}

fn extract_magisk_bins(apk: &Path, out_dir: &Path) -> Result<()> {
    let file = fs::File::open(apk)
        .map_err(|e| AdmtError::Io(format!("无法打开 Magisk 安装包: {}", e)))?;
    let mut archive = ZipArchive::new(file)
        .map_err(|e| AdmtError::Io(format!("无法读取 Magisk 安装包: {}", e)))?;

    const WANTED: [&str; 8] = [
        "magiskinit",
        "magiskinit64",
        "magisk64",
        "magisk32",
        "boot_patch.sh",
        "util_functions.sh",
        "stub.apk",
        "magisk.apk",
    ];
    let mut found: Vec<String> = Vec::new();
    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| AdmtError::Io(format!("读取安装包条目失败: {}", e)))?;
        let base = Path::new(entry.name())
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();
        if WANTED.iter().any(|w| base.eq_ignore_ascii_case(w)) {
            let mut buf = Vec::new();
            entry
                .read_to_end(&mut buf)
                .map_err(|e| AdmtError::Io(format!("解压 {} 失败: {}", base, e)))?;
            fs::write(out_dir.join(&base), &buf)
                .map_err(|e| AdmtError::Io(format!("写入 {} 失败: {}", base, e)))?;
            found.push(base);
        }
    }

    let init = out_dir.join("magiskinit");
    if !init.is_file() {
        let init64 = out_dir.join("magiskinit64");
        if init64.is_file() {
            fs::copy(&init64, &init)
                .map_err(|e| AdmtError::Io(format!("准备 magiskinit 失败: {}", e)))?;
            found.push("magiskinit".to_string());
        }
    }
    if !init.is_file() {
        return Err(patch_err(
            ERR_NEEDS_PATCHER,
            "安装包内未找到 magiskinit，请确认选择的是完整 Magisk APK",
        ));
    }
    log::info!("[root-patch] extracted Magisk binaries: {:?}", found);
    Ok(())
}

/// 电脑端 Magisk 原生修补：magiskboot + 从 APK 提取的 magiskinit。
/// partition 决定镜像文件名（boot / init_boot / vendor_boot），GKI 设备必须正确。
async fn patch_magisk(
    app: &tauri::AppHandle,
    work_dir: &Path,
    patcher: &Path,
    window: &tauri::WebviewWindow,
    partition: &str,
) -> Result<()> {
    let mb_exe = find_magiskboot(app).ok_or_else(|| {
        dependency_err(
            &magiskboot_name(),
            format!("未找到 magiskboot，请安装：{}", MAGISKBOOT_RELEASES),
        )
    })?;
    let mb = work_dir.join(magiskboot_name());
    fs::copy(&mb_exe, &mb)
        .map_err(|e| AdmtError::Io(format!("复制 magiskboot 失败: {}", e)))?;

    if !patcher.is_file() {
        return Err(patch_err(
            ERR_NEEDS_PATCHER,
            "Magisk 修补需要提供完整的 Magisk 安装包（APK/ZIP）",
        ));
    }
    let _ = window.emit(
        "patch-progress",
        json!({"status": "提取修补组件...", "progress": 20}),
    );
    extract_magisk_bins(patcher, work_dir)?;

    let work_image = work_dir.join(format!("{}.img", partition));
    let _ = window.emit(
        "patch-progress",
        json!({"status": format!("解包 {} 镜像...", partition), "progress": 40}),
    );
    run_tool(
        &mb,
        &["unpack", work_image.to_str().unwrap_or("boot.img")],
        work_dir,
        "解包镜像",
    )
    .await?;

    if !work_dir.join("ramdisk.cpio").is_file() {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "解包后未得到 ramdisk.cpio，镜像格式可能不受支持",
        ));
    }

    let _ = window.emit(
        "patch-progress",
        json!({"status": "注入 magiskinit 并修补 ramdisk...", "progress": 65}),
    );
    run_tool(
        &mb,
        &["cpio", "ramdisk.cpio", "add 0750 init magiskinit", "patch"],
        work_dir,
        "注入 ramdisk",
    )
    .await?;

    let cpio_bytes = fs::read(work_dir.join("ramdisk.cpio"))
        .map_err(|e| AdmtError::Io(format!("读取修补后的 ramdisk 失败: {}", e)))?;
    let injected = cpio_bytes.windows(10).any(|w| {
        w == b"magiskinit".as_slice() || w == b"MAGISKINIT".as_slice()
    });
    if !injected {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "ramdisk 中未检出 magiskinit，注入未生效",
        ));
    }

    let _ = window.emit(
        "patch-progress",
        json!({"status": "重新打包镜像...", "progress": 85}),
    );
    run_tool(
        &mb,
        &[
            "repack",
            work_image.to_str().unwrap_or("boot.img"),
            &format!("new-{}.img", partition),
        ],
        work_dir,
        "重新打包",
    )
    .await?;

    Ok(())
}

/// 电脑端 KernelSU / SukiSU 原生修补：官方 ksud 工具注入预编译 kernelsu.ko。
/// KMI 必须正确（例如 android13-5.10）；分区名决定刷写目标（init_boot / boot）。
async fn patch_kernelsu(
    app: &tauri::AppHandle,
    work_dir: &Path,
    window: &tauri::WebviewWindow,
    partition: &str,
    kmi: &str,
) -> Result<()> {
    let ksud_exe = find_ksud(app).ok_or_else(|| {
        dependency_err(
            &ksud_name(),
            format!("未找到 ksud，请安装：{}", KSU_RELEASES),
        )
    })?;
    let ksud = work_dir.join(ksud_name());
    fs::copy(&ksud_exe, &ksud)
        .map_err(|e| AdmtError::Io(format!("复制 ksud 失败: {}", e)))?;

    if kmi.trim().is_empty() {
        return Err(patch_err(
            ERR_NEEDS_PATCHER,
            "KernelSU 修补必须提供 KMI（例如 android13-5.10），可在连接设备后点击「检测 KMI」",
        ));
    }

    let _ = window.emit(
        "patch-progress",
        json!({"status": format!("ksud 修补 {} (KMI {})...", partition, kmi), "progress": 50}),
    );

    let args: Vec<String> = vec![
        "boot-patch".to_string(),
        "-b".to_string(),
        format!("{}.img", partition),
        "--kmi".to_string(),
        kmi.to_string(),
        "--partition".to_string(),
        partition.to_string(),
        "-o".to_string(),
        format!("new-{}.img", partition),
    ];
    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    run_tool(&ksud, &arg_refs, work_dir, "ksud 修补").await?;

    if !work_dir.join(format!("new-{}.img", partition)).is_file() {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "ksud 未生成修补产物，请确认 KMI 与分区名与设备一致",
        ));
    }
    Ok(())
}

/// 电脑端 APatch 原生修补：KernelPatch kptools 修补内核二进制（仅支持 boot）。
async fn patch_apatch(
    app: &tauri::AppHandle,
    work_dir: &Path,
    window: &tauri::WebviewWindow,
    super_key: &str,
) -> Result<()> {
    let kptools_exe = find_kptools(app).ok_or_else(|| {
        dependency_err(
            &kptools_name(),
            format!("未找到 kptools，请安装：{}", KERNELPATCH_RELEASES),
        )
    })?;
    let kpimg = find_kpimg(app).ok_or_else(|| {
        dependency_err(
            &kpimg_name(),
            format!("未找到 kpimg-android，请安装：{}", KERNELPATCH_RELEASES),
        )
    })?;
    let kptools = work_dir.join(kptools_name());
    fs::copy(&kptools_exe, &kptools)
        .map_err(|e| AdmtError::Io(format!("复制 kptools 失败: {}", e)))?;
    let kpimg_work = work_dir.join(kpimg_name());
    fs::copy(&kpimg, &kpimg_work)
        .map_err(|e| AdmtError::Io(format!("复制 kpimg-android 失败: {}", e)))?;

    if super_key.trim().len() < 8 {
        return Err(patch_err(
            ERR_NEEDS_PATCHER,
            "APatch 修补必须提供 8-63 位 SuperKey",
        ));
    }

    let _ = window.emit(
        "patch-progress",
        json!({"status": "kptools 解包内核...", "progress": 35}),
    );
    run_tool(
        &kptools,
        &["unpack", "boot.img"],
        work_dir,
        "解包内核",
    )
    .await?;
    if !work_dir.join("kernel").is_file() {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "kptools 解包后未得到 kernel，镜像格式可能不受支持",
        ));
    }
    // 保留原内核备份为 kernel-b（kptools 读取原始内核）
    fs::copy(work_dir.join("kernel"), work_dir.join("kernel-b"))
        .map_err(|e| AdmtError::Io(format!("备份内核失败: {}", e)))?;

    let _ = window.emit(
        "patch-progress",
        json!({"status": "修补内核二进制...", "progress": 65}),
    );
    let args: Vec<String> = vec![
        "-p".to_string(),
        "--image".to_string(),
        "kernel-b".to_string(),
        "--skey".to_string(),
        super_key.to_string(),
        "--kpimg".to_string(),
        kpimg_name(),
        "--out".to_string(),
        "kernel".to_string(),
    ];
    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    run_tool(&kptools, &arg_refs, work_dir, "kptools 修补").await?;

    let _ = window.emit(
        "patch-progress",
        json!({"status": "重新打包镜像...", "progress": 85}),
    );
    run_tool(&kptools, &["repack", "boot.img"], work_dir, "重新打包").await?;

    if !work_dir.join("new-boot.img").is_file() {
        return Err(patch_err(
            ERR_OUTPUT_INVALID,
            "kptools 未生成修补产物 new-boot.img",
        ));
    }
    Ok(())
}

/// 电脑端修补入口。根据引擎分发到对应原生修补器。
#[tauri::command]
pub async fn patch_boot_image_local(
    app_handle: tauri::AppHandle,
    image_path: String,
    patcher_path: String,
    patch_type: String,
    partition: Option<String>,
    kmi: Option<String>,
    super_key: Option<String>,
) -> Result<PatchOutcome> {
    log::info!(
        "[root-patch] type={} image={} patcher={} partition={:?} kmi={:?}",
        patch_type,
        image_path,
        patcher_path,
        partition,
        kmi,
    );
    let engine = normalize_engine(&patch_type)?;
    let image = PathBuf::from(&image_path);
    validate_input_image(&image)?;
    let source_sha256 = sha256_file(&image)?;

    // APatch 仅支持 boot 分区
    let partition = if engine.eq_ignore_ascii_case("APatch") {
        "boot".to_string()
    } else {
        partition
            .filter(|p| !p.is_empty())
            .unwrap_or_else(|| "boot".to_string())
    };

    let window = app_handle
        .get_webview_window("main")
        .ok_or_else(|| AdmtError::Io("Main window not found".to_string()))?;

    let temp_dir = std::env::temp_dir().join(format!("admt_patch_{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&temp_dir)
        .map_err(|e| AdmtError::Io(format!("创建工作目录失败: {}", e)))?;
    let work_image = temp_dir.join(format!("{}.img", partition));
    fs::copy(&image, &work_image)
        .map_err(|e| AdmtError::Io(format!("复制原始镜像失败: {}", e)))?;

    let patch_result = match engine {
        "Magisk" => {
            patch_magisk(
                &app_handle,
                &temp_dir,
                Path::new(&patcher_path),
                &window,
                &partition,
            )
            .await
        }
        "KernelSU" | "SukiSU Ultra" => {
            patch_kernelsu(
                &app_handle,
                &temp_dir,
                &window,
                &partition,
                kmi.as_deref().unwrap_or(""),
            )
            .await
        }
        "APatch" => {
            patch_apatch(
                &app_handle,
                &temp_dir,
                &window,
                super_key.as_deref().unwrap_or(""),
            )
            .await
        }
        other => Err(patch_err(
            ERR_NEEDS_DEVICE,
            format!("{} 无法在电脑端自动注入，请使用设备端官方 App 修补通道", other),
        )),
    };

    if let Err(e) = patch_result {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(e);
    }

    let new_boot = temp_dir.join(format!("new-{}.img", partition));
    if let Err(e) = validate_patched_image(&work_image, &new_boot, engine) {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(e);
    }

    let out_target = image.with_file_name(format!(
        "{}_patched.img",
        image.file_stem().and_then(|s| s.to_str()).unwrap_or("boot")
    ));
    if let Err(e) = fs::copy(&new_boot, &out_target) {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(AdmtError::Io(format!("写出修补镜像失败: {}", e)));
    }
    let patched_sha256 = sha256_file(&out_target)?;
    let _ = fs::remove_dir_all(&temp_dir);

    let _ = window.emit(
        "patch-progress",
        json!({"status": "修补完成", "progress": 100}),
    );

    Ok(PatchOutcome {
        success: true,
        output: format!("{} 修补完成，产物已校验", engine),
        error: None,
        exit_code: Some(0),
        output_path: Some(out_target.to_string_lossy().into_owned()),
        source_sha256,
        patched_sha256,
        engine: engine.to_string(),
    })
}
