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
/// 只检查 src-tauri/resources 目录中的可执行文件
fn find_adb_path() -> PathBuf {
    log::info!("Starting ADB path discovery (resources directory only)...");

    // 记录当前工作目录用于调试
    if let Ok(cwd) = std::env::current_dir() {
        log::info!("Current working directory: {}", cwd.display());
    }

    // 1. 生产环境：可执行文件目录下的 resources 文件夹
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let adb_path = parent.join("resources").join("adb.exe");
            log::info!("Checking production resources path: {}", adb_path.display());
            if adb_path.exists() {
                log::info!("✅ Found ADB at production resources: {}", adb_path.display());
                return adb_path;
            } else {
                log::warn!("❌ ADB not found at production resources: {}", adb_path.display());
            }
        }
    }

    // 2. 开发环境：当前工作目录下的 resources（考虑当前目录可能已经在 src-tauri 中）
    let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let dev_path = if current_dir.file_name().and_then(|n| n.to_str()) == Some("src-tauri") {
        // 如果当前目录已经是 src-tauri，直接使用 resources
        current_dir.join("resources").join("adb.exe")
    } else {
        // 否则添加 src-tauri 路径
        current_dir.join("src-tauri").join("resources").join("adb.exe")
    };
    log::info!("Checking development resources path: {}", dev_path.display());
    if dev_path.exists() {
        log::info!("✅ Found ADB at development resources: {}", dev_path.display());
        return dev_path;
    } else {
        log::warn!("❌ ADB not found at development resources: {}", dev_path.display());
    }

    // 3. 相对路径：src-tauri/resources（备用）
    let relative_path = PathBuf::from("src-tauri/resources/adb.exe");
    log::info!("Checking relative resources path: {}", relative_path.display());
    if relative_path.exists() {
        log::info!("✅ Found ADB at relative resources: {}", relative_path.display());
        return relative_path;
    } else {
        log::warn!("❌ ADB not found at relative resources: {}", relative_path.display());
    }

    // 如果所有路径都找不到，记录错误并返回空路径
    log::error!("❌ ADB executable not found in any resources directory!");
    log::error!("Searched paths:");
    log::error!("  - Production: {{exe_dir}}/resources/adb.exe");
    log::error!("  - Development: src-tauri/resources/adb.exe");
    log::error!("  - Relative: src-tauri/resources/adb.exe");
    log::error!("Please ensure adb.exe is placed in the src-tauri/resources/ directory");

    // 返回一个明显无效的路径，这样后续的存在性检查会失败
    PathBuf::from("INVALID_ADB_PATH")
}

/// 查找Fastboot路径（仅在首次调用时执行）
/// 只检查 src-tauri/resources 目录中的可执行文件
fn find_fastboot_path() -> PathBuf {
    log::info!("Starting Fastboot path discovery (resources directory only)...");

    // 1. 生产环境：可执行文件目录下的 resources 文件夹
    if let Ok(exe_dir) = std::env::current_exe() {
        if let Some(parent) = exe_dir.parent() {
            let fastboot_path = parent.join("resources").join("fastboot.exe");
            log::info!("Checking production resources path: {}", fastboot_path.display());
            if fastboot_path.exists() {
                log::info!("✅ Found Fastboot at production resources: {}", fastboot_path.display());
                return fastboot_path;
            } else {
                log::warn!("❌ Fastboot not found at production resources: {}", fastboot_path.display());
            }
        }
    }

    // 2. 开发环境：当前工作目录下的 resources（考虑当前目录可能已经在 src-tauri 中）
    let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let dev_path = if current_dir.file_name().and_then(|n| n.to_str()) == Some("src-tauri") {
        // 如果当前目录已经是 src-tauri，直接使用 resources
        current_dir.join("resources").join("fastboot.exe")
    } else {
        // 否则添加 src-tauri 路径
        current_dir.join("src-tauri").join("resources").join("fastboot.exe")
    };
    log::info!("Checking development resources path: {}", dev_path.display());
    if dev_path.exists() {
        log::info!("✅ Found Fastboot at development resources: {}", dev_path.display());
        return dev_path;
    } else {
        log::warn!("❌ Fastboot not found at development resources: {}", dev_path.display());
    }

    // 3. 相对路径：src-tauri/resources（备用）
    let relative_path = PathBuf::from("src-tauri/resources/fastboot.exe");
    log::info!("Checking relative resources path: {}", relative_path.display());
    if relative_path.exists() {
        log::info!("✅ Found Fastboot at relative resources: {}", relative_path.display());
        return relative_path;
    } else {
        log::warn!("❌ Fastboot not found at relative resources: {}", relative_path.display());
    }

    // 如果所有路径都找不到，记录错误并返回空路径
    log::error!("❌ Fastboot executable not found in any resources directory!");
    log::error!("Searched paths:");
    log::error!("  - Production: {{exe_dir}}/resources/fastboot.exe");
    log::error!("  - Development: src-tauri/resources/fastboot.exe");
    log::error!("  - Relative: src-tauri/resources/fastboot.exe");
    log::error!("Please ensure fastboot.exe is placed in the src-tauri/resources/ directory");

    // 返回一个明显无效的路径，这样后续的存在性检查会失败
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
            log::info!("Cache stats - Path hit rate: {:.2}%, Device hit rate: {:.2}%, Evictions: {}",
                stats.path_hit_rate() * 100.0,
                stats.device_hit_rate() * 100.0,
                stats.cache_evictions
            );
        }
    }
}
