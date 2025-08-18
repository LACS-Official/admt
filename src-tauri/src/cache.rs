use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use crate::device::{DeviceProperties, DeviceInfo};

/// 缓存统计信息
#[derive(Debug, Clone)]
pub struct CacheStats {
    pub path_cache_hits: u64,
    pub path_cache_misses: u64,
    pub device_cache_hits: u64,
    pub device_cache_misses: u64,
    pub cache_evictions: u64,
    pub last_reset: Instant,
}

impl Default for CacheStats {
    fn default() -> Self {
        Self {
            path_cache_hits: 0,
            path_cache_misses: 0,
            device_cache_hits: 0,
            device_cache_misses: 0,
            cache_evictions: 0,
            last_reset: Instant::now(),
        }
    }
}

impl CacheStats {
    pub fn path_hit_rate(&self) -> f64 {
        let total = self.path_cache_hits + self.path_cache_misses;
        if total == 0 {
            0.0
        } else {
            self.path_cache_hits as f64 / total as f64
        }
    }

    pub fn device_hit_rate(&self) -> f64 {
        let total = self.device_cache_hits + self.device_cache_misses;
        if total == 0 {
            0.0
        } else {
            self.device_cache_hits as f64 / total as f64
        }
    }


}

/// 带TTL的缓存项
#[derive(Debug, Clone)]
pub struct CacheItem<T> {
    pub value: T,
    pub created_at: Instant,
    pub ttl: Duration,
}

impl<T> CacheItem<T> {
    pub fn new(value: T, ttl: Duration) -> Self {
        Self {
            value,
            created_at: Instant::now(),
            ttl,
        }
    }

    pub fn is_expired(&self) -> bool {
        self.created_at.elapsed() > self.ttl
    }

    pub fn remaining_ttl(&self) -> Duration {
        self.ttl.saturating_sub(self.created_at.elapsed())
    }
}

/// 设备信息缓存
pub type DeviceCache = HashMap<String, CacheItem<DeviceProperties>>;

/// 设备列表缓存
pub type DeviceListCache = CacheItem<Vec<DeviceInfo>>;

/// 全局缓存管理器
pub struct CacheManager {
    device_cache: RwLock<DeviceCache>,
    device_list_cache: RwLock<Option<DeviceListCache>>,
    stats: RwLock<CacheStats>,
    device_cache_ttl: Duration,
    device_list_ttl: Duration,
}

impl CacheManager {
    pub fn new() -> Self {
        Self {
            device_cache: RwLock::new(HashMap::new()),
            device_list_cache: RwLock::new(None),
            stats: RwLock::new(CacheStats::default()),
            device_cache_ttl: Duration::from_secs(30), // 30秒TTL
            device_list_ttl: Duration::from_secs(5), // 5秒TTL，设备列表变化较快
        }
    }

    /// 获取设备属性缓存
    pub async fn get_device_properties(&self, serial: &str) -> Option<DeviceProperties> {
        let cache = self.device_cache.read().await;
        if let Some(item) = cache.get(serial) {
            if !item.is_expired() {
                // 缓存命中
                let mut stats = self.stats.write().await;
                stats.device_cache_hits += 1;
                log::debug!("Device cache hit for {}, TTL remaining: {:?}", 
                    serial, item.remaining_ttl());
                return Some(item.value.clone());
            } else {
                log::debug!("Device cache expired for {}", serial);
            }
        }
        
        // 缓存未命中
        let mut stats = self.stats.write().await;
        stats.device_cache_misses += 1;
        None
    }

    /// 设置设备属性缓存
    pub async fn set_device_properties(&self, serial: String, properties: DeviceProperties) {
        let mut cache = self.device_cache.write().await;
        let item = CacheItem::new(properties, self.device_cache_ttl);
        cache.insert(serial.clone(), item);
        log::debug!("Cached device properties for {}", serial);
    }

    /// 获取设备列表缓存
    pub async fn get_device_list(&self) -> Option<Vec<DeviceInfo>> {
        let cache = self.device_list_cache.read().await;
        if let Some(item) = cache.as_ref() {
            if !item.is_expired() {
                let mut stats = self.stats.write().await;
                stats.device_cache_hits += 1;
                log::debug!("Device list cache hit, TTL remaining: {:?}", item.remaining_ttl());
                return Some(item.value.clone());
            } else {
                log::debug!("Device list cache expired");
            }
        }

        let mut stats = self.stats.write().await;
        stats.device_cache_misses += 1;
        None
    }

    /// 设置设备列表缓存
    pub async fn set_device_list(&self, devices: Vec<DeviceInfo>) {
        let mut cache = self.device_list_cache.write().await;
        let item = CacheItem::new(devices, self.device_list_ttl);
        *cache = Some(item);
        log::debug!("Cached device list with {} devices", cache.as_ref().unwrap().value.len());
    }

    /// 清除过期的缓存项
    pub async fn cleanup_expired(&self) {
        let mut cache = self.device_cache.write().await;
        let mut list_cache = self.device_list_cache.write().await;
        let mut stats = self.stats.write().await;

        let initial_count = cache.len();
        cache.retain(|serial, item| {
            if item.is_expired() {
                log::debug!("Evicting expired cache for device: {}", serial);
                false
            } else {
                true
            }
        });

        // 检查设备列表缓存是否过期
        if let Some(item) = list_cache.as_ref() {
            if item.is_expired() {
                *list_cache = None;
                log::debug!("Evicted expired device list cache");
                stats.cache_evictions += 1;
            }
        }

        let evicted = initial_count - cache.len();
        stats.cache_evictions += evicted as u64;

        if evicted > 0 {
            log::info!("Evicted {} expired cache entries", evicted);
        }
    }

    /// 清除特定设备的缓存
    pub async fn invalidate_device(&self, serial: &str) {
        let mut cache = self.device_cache.write().await;
        if cache.remove(serial).is_some() {
            log::debug!("Invalidated cache for device: {}", serial);
        }
    }

    /// 清除所有缓存
    pub async fn clear_all(&self) {
        let mut cache = self.device_cache.write().await;
        let mut list_cache = self.device_list_cache.write().await;
        let mut stats = self.stats.write().await;

        let count = cache.len();
        let list_count = if list_cache.is_some() { 1 } else { 0 };

        cache.clear();
        *list_cache = None;
        stats.cache_evictions += (count + list_count) as u64;

        log::info!("Cleared all caches ({} device properties, {} device list)", count, list_count);
    }

    /// 获取缓存统计信息
    pub async fn get_stats(&self) -> CacheStats {
        self.stats.read().await.clone()
    }

    /// 重置统计信息
    #[allow(dead_code)]
    pub async fn reset_stats(&self) {
        let mut stats = self.stats.write().await;
        *stats = CacheStats::default();
        log::info!("Cache statistics reset");
    }

    /// 获取缓存大小信息
    pub async fn get_cache_info(&self) -> HashMap<String, usize> {
        let cache = self.device_cache.read().await;
        let list_cache = self.device_list_cache.read().await;
        let mut info = HashMap::new();
        info.insert("device_cache_size".to_string(), cache.len());
        info.insert("device_list_cached".to_string(), if list_cache.is_some() { 1 } else { 0 });
        info
    }

    /// 设置设备缓存TTL
    #[allow(dead_code)]
    pub fn set_device_cache_ttl(&mut self, ttl: Duration) {
        self.device_cache_ttl = ttl;
        log::info!("Device cache TTL set to {:?}", ttl);
    }
}

/// 全局缓存管理器实例
static CACHE_MANAGER: OnceLock<CacheManager> = OnceLock::new();

/// 获取全局缓存管理器
pub fn get_cache_manager() -> &'static CacheManager {
    CACHE_MANAGER.get_or_init(|| {
        log::info!("Initializing global cache manager");
        CacheManager::new()
    })
}

/// ADB路径缓存
static ADB_PATH: OnceLock<PathBuf> = OnceLock::new();

/// Fastboot路径缓存
static FASTBOOT_PATH: OnceLock<PathBuf> = OnceLock::new();

/// 获取缓存的ADB路径
pub fn get_cached_adb_path() -> &'static PathBuf {
    ADB_PATH.get_or_init(|| {
        let path = find_adb_path();
        log::info!("ADB path cached: {}", path.display());
        path
    })
}

/// 获取缓存的Fastboot路径
pub fn get_cached_fastboot_path() -> &'static PathBuf {
    FASTBOOT_PATH.get_or_init(|| {
        let path = find_fastboot_path();
        log::info!("Fastboot path cached: {}", path.display());
        path
    })
}

/// 记录路径缓存命中
pub async fn record_path_cache_hit() {
    let mut stats = get_cache_manager().stats.write().await;
    stats.path_cache_hits += 1;
}



/// 查找ADB路径（仅在首次调用时执行）
fn find_adb_path() -> PathBuf {
    log::info!("Starting ADB path discovery...");

    // 记录当前工作目录用于调试
    if let Ok(cwd) = std::env::current_dir() {
        log::info!("Current working directory: {}", cwd.display());
    }

    // 1. 优先使用固定的资源路径（生产环境）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let adb_path = parent.join("resources").join("adb.exe");
            log::info!("Checking app resources path: {}", adb_path.display());
            if adb_path.exists() {
                log::info!("✅ Found ADB at app resources: {}", adb_path.display());
                return adb_path;
            }
        }
    }

    // 2. 开发模式路径
    let dev_path = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("resources")
        .join("adb.exe");
    log::info!("Checking development path: {}", dev_path.display());
    if dev_path.exists() {
        log::info!("✅ Found ADB at development path: {}", dev_path.display());
        return dev_path;
    }

    // 3. 相对路径
    let relative_path = PathBuf::from("src-tauri/resources/adb.exe");
    log::info!("Checking relative path: {}", relative_path.display());
    if relative_path.exists() {
        log::info!("✅ Found ADB at relative path: {}", relative_path.display());
        return relative_path;
    }

    // 4. 特殊项目结构路径（保留兼容性）
    let special_path = PathBuf::from(r"D:\kaifa\HOUT\Res\adb.exe");
    log::info!("Checking special path: {}", special_path.display());
    if special_path.exists() {
        log::warn!("✅ Using hardcoded ADB path: {}", special_path.display());
        return special_path;
    }

    // 5. 尝试在系统 PATH 中查找 ADB
    if let Some(system_adb) = find_in_system_path("adb.exe") {
        log::info!("✅ Found ADB in system PATH: {}", system_adb.display());
        return system_adb;
    }

    // 6. 尝试常见的 Android SDK 安装路径
    let common_paths = [
        r"C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe",
        r"C:\Android\Sdk\platform-tools\adb.exe",
        r"C:\Program Files\Android\Android Studio\bin\adb.exe",
        r"D:\Android\Sdk\platform-tools\adb.exe",
    ];

    for path_template in &common_paths {
        let expanded_path = expand_environment_variables(path_template);
        log::info!("Checking common Android SDK path: {}", expanded_path.display());
        if expanded_path.exists() {
            log::info!("✅ Found ADB at common SDK path: {}", expanded_path.display());
            return expanded_path;
        }
    }

    // 如果都找不到，返回默认名称并记录详细错误信息
    log::error!("❌ ADB executable not found in any location!");
    log::error!("Searched paths:");
    log::error!("  - App resources directory");
    log::error!("  - Development resources directory");
    log::error!("  - Relative path");
    log::error!("  - System PATH");
    log::error!("  - Common Android SDK locations");
    log::error!("Please ensure adb.exe is available in one of these locations or in your system PATH");

    PathBuf::from("adb.exe")
}

/// 查找Fastboot路径（仅在首次调用时执行）
fn find_fastboot_path() -> PathBuf {
    log::info!("Starting Fastboot path discovery...");

    // 1. 优先使用固定的资源路径（生产环境）
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let fastboot_path = parent.join("resources").join("fastboot.exe");
            log::info!("Checking app resources path: {}", fastboot_path.display());
            if fastboot_path.exists() {
                log::info!("✅ Found Fastboot at app resources: {}", fastboot_path.display());
                return fastboot_path;
            }
        }
    }

    // 2. 开发模式路径
    let dev_path = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("src-tauri")
        .join("resources")
        .join("fastboot.exe");
    log::info!("Checking development path: {}", dev_path.display());
    if dev_path.exists() {
        log::info!("✅ Found Fastboot at development path: {}", dev_path.display());
        return dev_path;
    }

    // 3. 相对路径
    let relative_path = PathBuf::from("src-tauri/resources/fastboot.exe");
    log::info!("Checking relative path: {}", relative_path.display());
    if relative_path.exists() {
        log::info!("✅ Found Fastboot at relative path: {}", relative_path.display());
        return relative_path;
    }

    // 4. 特殊项目结构路径（保留兼容性）
    let special_path = PathBuf::from(r"D:\kaifa\HOUT\Res\fastboot.exe");
    log::info!("Checking special path: {}", special_path.display());
    if special_path.exists() {
        log::warn!("✅ Using hardcoded Fastboot path: {}", special_path.display());
        return special_path;
    }

    // 5. 尝试在系统 PATH 中查找 Fastboot
    if let Some(system_fastboot) = find_in_system_path("fastboot.exe") {
        log::info!("✅ Found Fastboot in system PATH: {}", system_fastboot.display());
        return system_fastboot;
    }

    // 6. 尝试常见的 Android SDK 安装路径
    let common_paths = [
        r"C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\fastboot.exe",
        r"C:\Android\Sdk\platform-tools\fastboot.exe",
        r"C:\Program Files\Android\Android Studio\bin\fastboot.exe",
        r"D:\Android\Sdk\platform-tools\fastboot.exe",
    ];

    for path_template in &common_paths {
        let expanded_path = expand_environment_variables(path_template);
        log::info!("Checking common Android SDK path: {}", expanded_path.display());
        if expanded_path.exists() {
            log::info!("✅ Found Fastboot at common SDK path: {}", expanded_path.display());
            return expanded_path;
        }
    }

    // 如果都找不到，返回默认名称并记录详细错误信息
    log::error!("❌ Fastboot executable not found in any location!");
    log::error!("Searched paths:");
    log::error!("  - App resources directory");
    log::error!("  - Development resources directory");
    log::error!("  - Relative path");
    log::error!("  - System PATH");
    log::error!("  - Common Android SDK locations");
    log::error!("Please ensure fastboot.exe is available in one of these locations or in your system PATH");

    PathBuf::from("fastboot.exe")
}

/// 在系统 PATH 中查找可执行文件
fn find_in_system_path(executable_name: &str) -> Option<PathBuf> {
    if let Ok(path_var) = std::env::var("PATH") {
        log::info!("Searching for {} in system PATH", executable_name);

        for path_dir in std::env::split_paths(&path_var) {
            let full_path = path_dir.join(executable_name);
            log::debug!("Checking PATH directory: {}", full_path.display());

            if full_path.exists() && full_path.is_file() {
                log::info!("Found {} in PATH: {}", executable_name, full_path.display());
                return Some(full_path);
            }
        }

        log::warn!("{} not found in any PATH directory", executable_name);
    } else {
        log::error!("PATH environment variable not found");
    }

    None
}

/// 展开环境变量（Windows 特定）
fn expand_environment_variables(path_template: &str) -> PathBuf {
    #[cfg(windows)]
    {
        // 简单的 %USERNAME% 替换
        if path_template.contains("%USERNAME%") {
            if let Ok(username) = std::env::var("USERNAME") {
                let expanded = path_template.replace("%USERNAME%", &username);
                return PathBuf::from(expanded);
            }
        }

        // 简单的 %USERPROFILE% 替换
        if path_template.contains("%USERPROFILE%") {
            if let Ok(userprofile) = std::env::var("USERPROFILE") {
                let expanded = path_template.replace("%USERPROFILE%", &userprofile);
                return PathBuf::from(expanded);
            }
        }
    }

    PathBuf::from(path_template)
}

/// 缓存清理任务
pub async fn cache_cleanup_task() {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(60)); // 每分钟清理一次

    loop {
        interval.tick().await;

        let cache_manager = get_cache_manager();
        cache_manager.cleanup_expired().await;

        // 每10分钟输出一次缓存统计
        let stats = cache_manager.get_stats().await;
        if stats.last_reset.elapsed().as_secs() >= 600 {
            log::info!("Cache stats - Path hit rate: {:.2}%, Device hit rate: {:.2}%, Evictions: {}",
                stats.path_hit_rate() * 100.0,
                stats.device_hit_rate() * 100.0,
                stats.cache_evictions
            );
        }
    }
}
