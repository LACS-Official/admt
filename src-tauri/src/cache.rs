use crate::device::{DeviceInfo, DeviceProperties};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

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
            device_list_ttl: Duration::from_secs(5),   // 5秒TTL，设备列表变化较快
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
                log::debug!(
                    "Device cache hit for {}, TTL remaining: {:?}",
                    serial,
                    item.remaining_ttl()
                );
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
                log::debug!(
                    "Device list cache hit, TTL remaining: {:?}",
                    item.remaining_ttl()
                );
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
        log::debug!(
            "Cached device list with {} devices",
            cache.as_ref().unwrap().value.len()
        );
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

        log::info!(
            "Cleared all caches ({} device properties, {} device list)",
            count,
            list_count
        );
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
        info.insert(
            "device_list_cached".to_string(),
            if list_cache.is_some() { 1 } else { 0 },
        );
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

/// 工具路径监控和日志记录
pub async fn log_tool_paths() {
    let adb_path = get_cached_adb_path();
    let fastboot_path = get_cached_fastboot_path();

    log::info!("Tool paths status:");
    log::info!(
        "  ADB: {} (exists: {})",
        adb_path.display(),
        adb_path.exists()
    );
    log::info!(
        "  Fastboot: {} (exists: {})",
        fastboot_path.display(),
        fastboot_path.exists()
    );

    if !adb_path.exists() || !fastboot_path.exists() {
        log::error!("Critical tool files missing, functionality will be limited");
    }
}

/// 验证工具路径完整性
pub fn verify_tool_paths() -> bool {
    let adb_path = get_cached_adb_path();
    let fastboot_path = get_cached_fastboot_path();

    let adb_valid = adb_path.exists() && !adb_path.to_string_lossy().contains("INVALID");
    let fastboot_valid =
        fastboot_path.exists() && !fastboot_path.to_string_lossy().contains("INVALID");

    adb_valid && fastboot_valid
}

/// 查找ADB路径（仅在首次调用时执行）
/// 统一使用 tools/adb 目录中的可执行文件
fn find_adb_path() -> PathBuf {
    use std::env::consts::EXE_SUFFIX;
    let platform_dir = if cfg!(windows) { "windows" } else { "linux" };
    let adb_filename = format!("adb{}", EXE_SUFFIX);

    log::info!(
        "Starting ADB path discovery (platform={} suffix={})...",
        platform_dir,
        EXE_SUFFIX
    );

    // 1. 生产环境：可执行文件目录下的 tools/adb 文件夹
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            // 生产环境的多个可能路径
            let production_paths = [
                parent.join("tools").join("adb-bin").join(&adb_filename),
                parent
                    .join("resources")
                    .join("tools")
                    .join("adb-bin")
                    .join(&adb_filename),
                parent
                    .join("tools")
                    .join("adb")
                    .join(platform_dir)
                    .join(&adb_filename),
                parent
                    .join("resources")
                    .join("tools")
                    .join("adb")
                    .join(platform_dir)
                    .join(&adb_filename),
                parent.join("tools").join("adb").join(&adb_filename), // 兼容老路径
                parent.join("adb").join(&adb_filename),               // 兼容老路径
            ];

            for path in &production_paths {
                if path.exists() {
                    log::info!("✅ Found ADB at production path: {}", path.display());
                    // 确保具有执行权限 (针对 Linux)
                    let _ = crate::utils::ensure_executable(path);
                    return path.clone();
                }
            }
        }
    }

    // 2. 开发环境
    let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let dev_root = if current_dir.file_name().and_then(|n| n.to_str()) == Some("src-tauri") {
        current_dir
    } else {
        current_dir.join("src-tauri")
    };

    let dev_paths = [
        dev_root
            .join("tools")
            .join("adb")
            .join(platform_dir)
            .join(&adb_filename),
        dev_root.join("tools").join("adb").join(&adb_filename), // 兼容老路径
    ];

    for path in &dev_paths {
        if path.exists() {
            log::info!("✅ Found ADB at development path: {}", path.display());
            // 确保具有执行权限 (针对 Linux)
            let _ = crate::utils::ensure_executable(path);
            return path.clone();
        }
    }

    log::error!("❌ ADB executable not found!");
    PathBuf::from("INVALID_ADB_PATH")
}

/// 查找Fastboot路径（仅在首次调用时执行）
/// 统一使用 tools/adb 目录中的可执行文件
fn find_fastboot_path() -> PathBuf {
    use std::env::consts::EXE_SUFFIX;
    let platform_dir = if cfg!(windows) { "windows" } else { "linux" };
    let fb_filename = format!("fastboot{}", EXE_SUFFIX);

    log::info!(
        "Starting Fastboot path discovery (platform={} suffix={})...",
        platform_dir,
        EXE_SUFFIX
    );

    // 1. 生产环境
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let production_paths = [
                parent.join("tools").join("adb-bin").join(&fb_filename),
                parent
                    .join("resources")
                    .join("tools")
                    .join("adb-bin")
                    .join(&fb_filename),
                parent
                    .join("tools")
                    .join("adb")
                    .join(platform_dir)
                    .join(&fb_filename),
                parent
                    .join("resources")
                    .join("tools")
                    .join("adb")
                    .join(platform_dir)
                    .join(&fb_filename),
                parent.join("tools").join("adb").join(&fb_filename), // 兼容老路径
                parent.join("adb").join(&fb_filename),               // 兼容老路径
            ];

            for path in &production_paths {
                if path.exists() {
                    log::info!("✅ Found Fastboot at production path: {}", path.display());
                    // 确保具有执行权限 (针对 Linux)
                    let _ = crate::utils::ensure_executable(path);
                    return path.clone();
                }
            }
        }
    }

    // 2. 开发环境
    let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let dev_root = if current_dir.file_name().and_then(|n| n.to_str()) == Some("src-tauri") {
        current_dir
    } else {
        current_dir.join("src-tauri")
    };

    let dev_paths = [
        dev_root
            .join("tools")
            .join("adb")
            .join(platform_dir)
            .join(&fb_filename),
        dev_root.join("tools").join("adb").join(&fb_filename), // 兼容老路径
    ];

    for path in &dev_paths {
        if path.exists() {
            log::info!("✅ Found Fastboot at development path: {}", path.display());
            // 确保具有执行权限 (针对 Linux)
            let _ = crate::utils::ensure_executable(path);
            return path.clone();
        }
    }

    log::error!("❌ Fastboot executable not found!");
    PathBuf::from("INVALID_FASTBOOT_PATH")
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
            log::info!(
                "Cache stats - Path hit rate: {:.2}%, Device hit rate: {:.2}%, Evictions: {}",
                stats.path_hit_rate() * 100.0,
                stats.device_hit_rate() * 100.0,
                stats.cache_evictions
            );
        }
    }
}
