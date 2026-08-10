use crate::error::{AdmtError, Result};
use crate::utils::execute_adb_command as utils_execute_adb_command;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorCpuData {
    pub total_usage: f64,
    pub core_usages: Vec<f64>,
    pub frequencies: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorMemoryData {
    pub total: u64,
    pub free: u64,
    pub available: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorTempData {
    pub cpu: f64,
    pub battery: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorBatteryData {
    pub level: i32,
    pub current: f64,
    pub voltage: f64,
    pub health: Option<String>,
    pub power: f64, // Calculation: current * voltage / 1000000.0 (W)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorNetworkData {
    pub rx_speed: f64, // Bytes per second
    pub tx_speed: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorGpuData {
    pub load: f64,
    pub freq: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorProcessData {
    pub name: String,
    pub cpu: f64,
    pub mem: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorDataPoint {
    pub timestamp: i64,
    pub cpu: MonitorCpuData,
    pub memory: MonitorMemoryData,
    pub temperature: MonitorTempData,
    pub battery: MonitorBatteryData,
    pub network: MonitorNetworkData,
    pub gpu: MonitorGpuData,
    pub processes: Vec<MonitorProcessData>,
}

#[derive(Debug, Clone)]
struct CpuCounters {
    total: f64,
    non_idle: f64,
}

static CPU_CACHE: Lazy<Mutex<HashMap<String, HashMap<String, CpuCounters>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Clone)]
struct NetworkCounters {
    timestamp: i64,
    rx_bytes: u64,
    tx_bytes: u64,
}

static NETWORK_CACHE: Lazy<Mutex<HashMap<String, NetworkCounters>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

fn normalize_temp(v: f64) -> f64 {
    if v > 10000.0 {
        v / 1000.0
    } else if v > 1000.0 {
        v / 100.0
    } else if v > 100.0 {
        v / 10.0
    } else {
        v
    }
}

/// 获取实时监控数据
#[tauri::command]
pub async fn get_device_realtime_monitor_data(serial: String) -> Result<MonitorDataPoint> {
    let _start_time = std::time::Instant::now();

    // 1. 批量采集基础硬件信息 (使用分隔符确保解析可靠性，加入 su -c 自动提权读取)
    let batch_cmd = r#"
        cat_file() {
            if [ -f "$1" ]; then
                cat "$1" 2>/dev/null || su -c "cat '$1'" 2>/dev/null
            fi
        }
        echo '<<<STAT>>>'
        cat_file /proc/stat
        
        echo '<<<MEM>>>'
        cat_file /proc/meminfo
        
        echo '<<<NET>>>'
        cat_file /proc/net/dev
        
        echo '<<<FREQ>>>'
        for f in /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq; do
            if [ -f "$f" ]; then
                cat "$f" 2>/dev/null || su -c "cat '$f'" 2>/dev/null
            fi
        done
        
        echo '<<<TEMP>>>'
        found=0
        for z in $(ls -d /sys/class/thermal/thermal_zone* 2>/dev/null || su -c "ls -d /sys/class/thermal/thermal_zone*" 2>/dev/null); do
            if [ -f "$z/temp" ] || [ -f "/sys/class/thermal/$(basename $z)/temp" ]; then
                type=$(cat "$z/type" 2>/dev/null || su -c "cat '$z/type'" 2>/dev/null)
                case "$type" in
                    *cpu*|*CPU*|*tsens*|*soc*|*ap*|*bms*)
                        cat "$z/temp" 2>/dev/null || su -c "cat '$z/temp'" 2>/dev/null
                        found=1
                        break
                        ;;
                esac
            fi
        done
        if [ "$found" -eq 0 ]; then
            cat_file /sys/class/thermal/thermal_zone0/temp
        fi
        
        echo '<<<BTEMP>>>'
        btemp=$(cat_file /sys/class/power_supply/battery/temp)
        if [ -z "$btemp" ]; then
            dumpsys battery 2>/dev/null | grep "  temperature:" | awk -F: '{print $2}' | tr -d ' '
        else
            echo "$btemp"
        fi
        
        echo '<<<BCAP>>>'
        bcap=$(cat_file /sys/class/power_supply/battery/capacity)
        if [ -z "$bcap" ]; then
            dumpsys battery 2>/dev/null | grep "  level:" | awk -F: '{print $2}' | tr -d ' '
        else
            echo "$bcap"
        fi
        
        echo '<<<BCUR>>>'
        bcur=""
        for f in current_now current_avg; do
            val=$(cat_file /sys/class/power_supply/battery/$f)
            if [ ! -z "$val" ]; then
                bcur="$val"
                break
            fi
        done
        if [ -z "$bcur" ]; then
            bcur=$(cat_file /sys/class/power_supply/battery/BatteryAverageCurrent)
        fi
        if [ -z "$bcur" ] || [ "$bcur" = "0" ]; then
            cmd_cur=$(cmd battery get -f current_now 2>/dev/null)
            if [ ! -z "$cmd_cur" ] && [ "$cmd_cur" != "invalid" ]; then
                bcur="$cmd_cur"
            else
                cmd_avg=$(cmd battery get -f current_average 2>/dev/null)
                if [ ! -z "$cmd_avg" ] && [ "$cmd_avg" != "invalid" ]; then
                    bcur="$cmd_avg"
                fi
            fi
        fi
        echo "$bcur"
        
        echo '<<<BVOLT>>>'
        bvolt=$(cat_file /sys/class/power_supply/battery/voltage_now)
        if [ -z "$bvolt" ]; then
            dumpsys battery 2>/dev/null | grep "  voltage:" | awk -F: '{print $2}' | tr -d ' '
        else
            echo "$bvolt"
        fi
        
        echo '<<<GPU>>>'
        gpubusy=$(cat_file /sys/class/kgsl/kgsl-3d0/gpubusy)
        if [ ! -z "$gpubusy" ]; then
            echo "$gpubusy"
        else
            mali_busy=$(cat_file /sys/class/misc/mali0/device/utilization)
            if [ ! -z "$mali_busy" ]; then
                echo "$mali_busy"
            fi
        fi
        
        echo '<<<GCLK>>>'
        gpuclk=$(cat_file /sys/class/kgsl/kgsl-3d0/gpuclk)
        if [ ! -z "$gpuclk" ]; then
            echo "$gpuclk"
        else
            gpuclk_df=$(cat_file /sys/class/kgsl/kgsl-3d0/devfreq/cur_freq)
            if [ ! -z "$gpuclk_df" ]; then
                echo "$gpuclk_df"
            else
                mali_clk=$(cat_file /sys/class/misc/mali0/device/clock)
                if [ ! -z "$mali_clk" ]; then
                    echo "$mali_clk"
                else
                    mali_clk_df=$(cat_file /sys/class/misc/mali0/device/cur_freq)
                    if [ ! -z "$mali_clk_df" ]; then
                        echo "$mali_clk_df"
                    fi
                fi
            fi
        fi
        
        echo '<<<END>>>'
    "#.to_string();

    let serial_batch = serial.clone();
    let batch_task = tokio::spawn(async move {
        utils_execute_adb_command(&["-s", &serial_batch, "shell", &batch_cmd], Some(5)).await
    });

    // 2. 进程排行采集 (保持独立)
    let proc_serial = serial.clone();
    let proc_task = tokio::spawn(async move {
        utils_execute_adb_command(
            &[
                "-s",
                &proc_serial,
                "shell",
                "top -b -n 1 -o %CPU,%MEM | head -n 12",
            ],
            Some(5),
        )
        .await
    });

    let batch_output = match batch_task.await {
        Ok(Ok(res)) if res.success => res.output,
        _ => String::new(),
    };

    // 按分隔符分割数据
    let mut sections: HashMap<String, String> = HashMap::new();
    let mut current_section = String::new();
    let mut current_content = Vec::new();

    for line in batch_output.lines() {
        let line = line.trim();
        if line.starts_with("<<<") && line.ends_with(">>>") {
            if !current_section.is_empty() {
                sections.insert(current_section.clone(), current_content.join("\n"));
            }
            current_section = line[3..line.len() - 3].to_string();
            current_content.clear();
        } else {
            current_content.push(line.to_string());
        }
    }
    if !current_section.is_empty() {
        sections.insert(current_section, current_content.join("\n"));
    }

    // 解析各部分数据
    let (total_usage, core_usages) = calculate_realtime_cpu_usage(
        &serial,
        sections.get("STAT").map(|s| s.as_str()).unwrap_or(""),
    );
    let (mem_total, mem_free, mem_avail) =
        parse_meminfo(sections.get("MEM").map(|s| s.as_str()).unwrap_or(""));
    let (rx_speed, tx_speed) = calculate_network_speed(
        &serial,
        sections.get("NET").map(|s| s.as_str()).unwrap_or(""),
    );

    let mut frequencies = HashMap::new();
    if let Some(freq_str) = sections.get("FREQ") {
        for (i, line) in freq_str.lines().enumerate() {
            if let Ok(val) = line.trim().parse::<u64>() {
                frequencies.insert(format!("cpu{}", i), val / 1000);
            }
        }
    }

    let cpu_temp = sections
        .get("TEMP")
        .and_then(|s| s.trim().parse::<f64>().ok())
        .map(normalize_temp)
        .unwrap_or(0.0);
    let clean_parse_i32 = |s: &str| -> Option<i32> {
        let first_line = s.lines().next()?.trim();
        let cleaned: String = first_line.chars().filter(|c| c.is_ascii_digit() || *c == '-').collect();
        cleaned.parse::<i32>().ok()
    };

    let clean_parse_f64 = |s: &str| -> Option<f64> {
        let first_line = s.lines().next()?.trim();
        let cleaned: String = first_line.chars().filter(|c| c.is_ascii_digit() || *c == '-' || *c == '.').collect();
        cleaned.parse::<f64>().ok()
    };

    let batt_temp = sections
        .get("BTEMP")
        .and_then(|s| clean_parse_f64(s))
        .map(normalize_temp)
        .unwrap_or(0.0);
    let batt_level = sections
        .get("BCAP")
        .and_then(|s| clean_parse_i32(s))
        .unwrap_or(0);
    let current = sections
        .get("BCUR")
        .and_then(|s| clean_parse_f64(s))
        .unwrap_or(0.0);
    let voltage = sections
        .get("BVOLT")
        .and_then(|s| clean_parse_f64(s))
        .unwrap_or(0.0);

    let mut gpu_load = 0.0;
    if let Some(gpu_str) = sections.get("GPU") {
        let gpu_str = gpu_str.trim().replace('%', "");
        let parts: Vec<&str> = gpu_str.split_whitespace().collect();
        if parts.len() == 2 {
            if let (Ok(busy), Ok(total)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
                if total > 0.0 {
                    gpu_load = (busy / total * 100.0).clamp(0.0, 100.0);
                }
            }
        } else if parts.len() == 1 {
            if let Ok(load) = parts[0].parse::<f64>() {
                gpu_load = load.clamp(0.0, 100.0);
            }
        }
    }
    let gpu_freq = sections
        .get("GCLK")
        .and_then(|s| s.trim().parse::<u64>().ok())
        .map(|v| {
            if v > 10_000_000 {
                v / 1_000_000
            } else if v > 10_000 {
                v / 1_000
            } else {
                v
            }
        })
        .unwrap_or(0);

    let processes = match proc_task.await {
        Ok(Ok(res)) if res.success => parse_top_processes(&res.output),
        _ => Vec::new(),
    };

    let abs_current = current.abs();
    let norm_current = if abs_current > 100000.0 {
        abs_current / 1000000.0
    } else {
        abs_current / 1000.0
    };
    let norm_voltage = if voltage > 100000.0 {
        voltage / 1000000.0
    } else {
        voltage / 1000.0
    };
    let power = norm_current * norm_voltage;

    Ok(MonitorDataPoint {
        timestamp: chrono::Local::now().timestamp_millis(),
        cpu: MonitorCpuData {
            total_usage,
            core_usages,
            frequencies,
        },
        memory: MonitorMemoryData {
            total: mem_total,
            free: mem_free,
            available: mem_avail,
        },
        temperature: MonitorTempData {
            cpu: cpu_temp,
            battery: batt_temp,
        },
        battery: MonitorBatteryData {
            level: batt_level,
            current,
            voltage,
            health: None,
            power,
        },
        network: MonitorNetworkData { rx_speed, tx_speed },
        gpu: MonitorGpuData {
            load: gpu_load,
            freq: gpu_freq,
        },
        processes,
    })
}

fn parse_meminfo(output: &str) -> (u64, u64, u64) {
    let mut total = 0;
    let mut free = 0;
    let mut avail = 0;
    for line in output.lines() {
        if line.starts_with("MemTotal:") {
            total = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
        } else if line.starts_with("MemFree:") {
            free = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
        } else if line.starts_with("MemAvailable:") {
            avail = line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);
        }
    }
    (total, free, avail)
}

fn calculate_realtime_cpu_usage(serial: &str, output: &str) -> (f64, Vec<f64>) {
    let mut current_counters = HashMap::new();

    for line in output.lines() {
        if line.starts_with("cpu") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 5 {
                let id = parts[0].to_string();
                let user: f64 = parts[1].parse().unwrap_or(0.0);
                let nice: f64 = parts[2].parse().unwrap_or(0.0);
                let system: f64 = parts[3].parse().unwrap_or(0.0);
                let idle: f64 = parts[4].parse().unwrap_or(0.0);
                let iowait: f64 = parts.get(5).and_then(|&s| s.parse().ok()).unwrap_or(0.0);
                let irq: f64 = parts.get(6).and_then(|&s| s.parse().ok()).unwrap_or(0.0);
                let softirq: f64 = parts.get(7).and_then(|&s| s.parse().ok()).unwrap_or(0.0);

                let non_idle = user + nice + system + irq + softirq;
                let total = non_idle + idle + iowait;

                current_counters.insert(id, CpuCounters { total, non_idle });
            }
        }
    }

    let mut cache = CPU_CACHE.lock().unwrap();
    let device_cache = cache.entry(serial.to_string()).or_insert_with(HashMap::new);

    let mut total_usage = 0.0;
    let mut core_usages = Vec::new();

    // 计算总使用率
    if let Some(curr) = current_counters.get("cpu") {
        if let Some(prev) = device_cache.get("cpu") {
            let total_delta = curr.total - prev.total;
            let non_idle_delta = curr.non_idle - prev.non_idle;
            if total_delta > 0.0 {
                total_usage = (non_idle_delta / total_delta * 100.0).clamp(0.0, 100.0);
            }
        }
    }

    // 计算各核心使用率
    let mut i = 0;
    while let Some(id) = Some(format!("cpu{}", i)) {
        if let Some(curr) = current_counters.get(&id) {
            if let Some(prev) = device_cache.get(&id) {
                let total_delta = curr.total - prev.total;
                let non_idle_delta = curr.non_idle - prev.non_idle;
                if total_delta > 0.0 {
                    core_usages.push((non_idle_delta / total_delta * 100.0).clamp(0.0, 100.0));
                } else {
                    core_usages.push(0.0);
                }
            } else {
                core_usages.push(0.0);
            }
            i += 1;
        } else {
            break;
        }
    }

    // 更新缓存
    *device_cache = current_counters;

    (total_usage, core_usages)
}

#[allow(dead_code)]
fn parse_battery_level_and_health(output: &str) -> (i32, Option<String>) {
    let mut level = 0;
    let mut health = None;
    for line in output.lines() {
        let line = line.trim();
        if line.starts_with("level:") {
            level = line
                .split(':')
                .nth(1)
                .and_then(|s| s.trim().parse().ok())
                .unwrap_or(0);
        } else if line.starts_with("health:") {
            health = line.split(':').nth(1).map(|s| s.trim().to_string());
        }
    }
    (level, health)
}

fn calculate_network_speed(serial: &str, output: &str) -> (f64, f64) {
    let mut rx_bytes = 0u64;
    let mut tx_bytes = 0u64;

    for line in output.lines() {
        if let Some(pos) = line.find(':') {
            let iface = line[..pos].trim();
            // 过滤掉虚拟回环、隧道等无关网卡
            if iface == "lo"
                || iface.starts_with("sit")
                || iface.starts_with("tun")
                || iface.starts_with("ip6")
                || iface.starts_with("dummy")
            {
                continue;
            }

            let data = &line[pos + 1..];
            let parts: Vec<&str> = data.split_whitespace().collect();
            if parts.len() >= 9 {
                let r: u64 = parts[0].parse().unwrap_or(0);
                let t: u64 = parts[8].parse().unwrap_or(0);
                rx_bytes += r;
                tx_bytes += t;
            }
        }
    }

    let now = chrono::Local::now().timestamp_millis();
    let mut cache = NETWORK_CACHE.lock().unwrap();
    let prev = cache.get(serial).cloned();

    let mut rx_speed = 0.0;
    let mut tx_speed = 0.0;

    if let Some(p) = prev {
        let time_delta = (now - p.timestamp) as f64 / 1000.0;
        if time_delta > 0.1 {
            rx_speed = (rx_bytes.saturating_sub(p.rx_bytes) as f64 / time_delta).max(0.0);
            tx_speed = (tx_bytes.saturating_sub(p.tx_bytes) as f64 / time_delta).max(0.0);
        }
    }

    cache.insert(
        serial.to_string(),
        NetworkCounters {
            timestamp: now,
            rx_bytes,
            tx_bytes,
        },
    );

    (rx_speed, tx_speed)
}

fn parse_top_processes(output: &str) -> Vec<MonitorProcessData> {
    let mut processes = Vec::new();
    let lines: Vec<&str> = output.lines().collect();

    // Skip header lines to find the actual data
    // top -b -n 1 -o %CPU,%MEM output format:
    // PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ ARGS
    let mut data_start = 0;
    for (i, line) in lines.iter().enumerate() {
        if line.contains("PID") && (line.contains("CPU") || line.contains("MEM")) {
            data_start = i + 1;
            break;
        }
    }

    if data_start == 0 {
        return processes;
    }

    for line in lines.iter().skip(data_start).take(5) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 12 {
            // PID USER PR NI VIRT RES SHR S [%CPU] [%MEM] TIME+ [NAME]
            let cpu: f64 = parts[8].parse().unwrap_or(0.0);
            let mem: f64 = parts[9].parse().unwrap_or(0.0);
            let name = parts[11].to_string();
            processes.push(MonitorProcessData { name, cpu, mem });
        }
    }

    processes
}

/// 获取设备分区列表
#[tauri::command]
pub async fn get_device_partitions(serial: String) -> Result<Vec<String>> {
    log::info!("Getting partition list for device: {}", serial);

    // 尝试通过 /dev/block/by-name/ 获取
    let result = utils_execute_adb_command(
        &["-s", &serial, "shell", "ls", "/dev/block/by-name/"],
        Some(10),
    )
    .await?;

    if result.success {
        let partitions: Vec<String> = result
            .output
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();
        return Ok(partitions);
    }

    // 回退方案：通过 /proc/partitions 获取
    log::warn!("Failed to read /dev/block/by-name/, falling back to /proc/partitions");
    let result = utils_execute_adb_command(
        &["-s", &serial, "shell", "cat", "/proc/partitions"],
        Some(10),
    )
    .await?;

    if result.success {
        let mut partitions = Vec::new();
        for line in result.output.lines().skip(2) {
            // 跳过前两行标题
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                partitions.push(parts[3].to_string());
            }
        }
        return Ok(partitions);
    }

    Err(AdmtError::Command("无法获取分区列表".to_string()))
}

/// 备份分区
#[tauri::command]
pub async fn backup_partition(
    serial: String,
    partition: String,
    output_path: String,
) -> Result<crate::device::CommandResult> {
    log::info!(
        "Backing up partition. serial={}, partition={}, output_path={}",
        serial,
        partition,
        output_path
    );

    // 1. 在设备端执行 dd 备份到临时位置
    // 注意：这需要设备有 root 权限，通常使用 'su -c dd ...'
    let temp_device_path = format!("/data/local/tmp/{}.img", partition);
    let dd_cmd = format!(
        "su -c 'dd if=/dev/block/by-name/{} of={}'",
        partition, temp_device_path
    );

    log::info!("Executing dd on device: {}", dd_cmd);
    let result = utils_execute_adb_command(
        &["-s", &serial, "shell", &dd_cmd],
        Some(300), // 5分钟超时
    )
    .await?;

    if !result.success {
        return Ok(crate::device::CommandResult {
            success: false,
            output: result.output,
            error: Some(format!("备份到设备端失败: {:?}", result.error)),
            exit_code: result.exit_code,
        });
    }

    // 2. 将设备端的备份文件拉取到电脑
    log::info!("Pulling backup from device to: {}", output_path);
    let pull_result = utils_execute_adb_command(
        &["-s", &serial, "pull", &temp_device_path, &output_path],
        Some(600), // 10分钟超时
    )
    .await?;

    // 3. 清理设备端临时文件
    let _ = utils_execute_adb_command(&["-s", &serial, "shell", "rm", &temp_device_path], Some(10))
        .await;

    Ok(crate::device::CommandResult {
        success: pull_result.success,
        output: pull_result.output,
        error: pull_result.error,
        exit_code: pull_result.exit_code,
    })
}

/// 获取设备性能信息
#[tauri::command]
pub async fn get_device_performance_info(serial: String) -> Result<serde_json::Value> {
    use serde_json::json;

    let mut memory_info = json!({
        "memory_total": null,
        "memory_used": null,
        "memory_available": null,
        "memory_usage_percent": null
    });

    let mut storage_info = json!({
        "storage_total": null,
        "storage_used": null,
        "storage_available": null,
        "storage_usage_percent": null
    });

    let mut battery_info = json!({
        "battery_health_percent": null,
        "battery_actual_capacity": null,
        "battery_design_capacity": null,
        "battery_health_status": null,
        "battery_level": null,
        "battery_temperature": null
    });

    // 获取内存信息
    if let Ok(result) =
        utils_execute_adb_command(&["-s", &serial, "shell", "cat", "/proc/meminfo"], Some(10)).await
    {
        if result.success {
            let mut mem_total_kb = 0u64;
            let mut mem_available_kb = 0u64;

            for line in result.output.lines() {
                if line.starts_with("MemTotal:") {
                    if let Some(mem_part) = line.split_whitespace().nth(1) {
                        if let Ok(mem_kb) = mem_part.parse::<u64>() {
                            mem_total_kb = mem_kb;
                        }
                    }
                } else if line.starts_with("MemAvailable:") {
                    if let Some(mem_part) = line.split_whitespace().nth(1) {
                        if let Ok(mem_kb) = mem_part.parse::<u64>() {
                            mem_available_kb = mem_kb;
                        }
                    }
                }
            }

            if mem_total_kb > 0 {
                let mem_total_mb = mem_total_kb / 1024;
                let mem_available_mb = mem_available_kb / 1024;
                let mem_used_mb = mem_total_mb - mem_available_mb;
                let usage_percent = if mem_total_mb > 0 {
                    ((mem_used_mb as f64 / mem_total_mb as f64) * 100.0).round() as u32
                } else {
                    0
                };

                memory_info = json!({
                    "memory_total": mem_total_mb,
                    "memory_used": mem_used_mb,
                    "memory_available": mem_available_mb,
                    "memory_usage_percent": usage_percent
                });
            }
        }
    }

    // 获取存储信息
    if let Ok(result) =
        utils_execute_adb_command(&["-s", &serial, "shell", "df", "/data"], Some(10)).await
    {
        if result.success {
            let lines: Vec<&str> = result.output.lines().collect();
            if lines.len() > 1 {
                let data_line = lines[1];
                let parts: Vec<&str> = data_line.split_whitespace().collect();
                if parts.len() >= 4 {
                    if let (Ok(total_kb), Ok(used_kb), Ok(available_kb)) = (
                        parts[1].parse::<u64>(),
                        parts[2].parse::<u64>(),
                        parts[3].parse::<u64>(),
                    ) {
                        let total_mb = total_kb / 1024;
                        let used_mb = used_kb / 1024;
                        let available_mb = available_kb / 1024;
                        let usage_percent = if total_mb > 0 {
                            ((used_mb as f64 / total_mb as f64) * 100.0).round() as u32
                        } else {
                            0
                        };

                        storage_info = json!({
                            "storage_total": total_mb,
                            "storage_used": used_mb,
                            "storage_available": available_mb,
                            "storage_usage_percent": usage_percent
                        });
                    }
                }
            }
        }
    }

    // 获取电池信息
    if let Ok(result) =
        utils_execute_adb_command(&["-s", &serial, "shell", "dumpsys", "battery"], Some(10)).await
    {
        if result.success {
            let mut battery_level: Option<u32> = None;
            let mut battery_health_status: Option<String> = None;
            let mut battery_temperature: Option<f32> = None;
            let mut battery_actual_capacity: Option<u32> = None;
            let mut battery_design_capacity: Option<u32> = None;
            let mut charge_counter_uah: Option<i64> = None; // Charge counter in μAh

            for line in result.output.lines() {
                let line = line.trim();

                // 解析电池电量
                if line.starts_with("level:") {
                    if let Some(level_str) = line.split(':').nth(1) {
                        if let Ok(level) = level_str.trim().parse::<u32>() {
                            battery_level = Some(level);
                        }
                    }
                }
                // 解析电池健康状态
                else if line.starts_with("health:") {
                    if let Some(health_str) = line.split(':').nth(1) {
                        let health = health_str.trim();
                        battery_health_status = Some(health.to_string());
                    }
                }
                // 解析电池温度
                else if line.starts_with("temperature:") {
                    if let Some(temp_str) = line.split(':').nth(1) {
                        if let Ok(temp) = temp_str.trim().parse::<i32>() {
                            // 温度通常以十分之一摄氏度为单位
                            battery_temperature = Some(temp as f32 / 10.0);
                        }
                    }
                }
                // 解析 Charge counter（优先使用此方法）
                else if line.contains("Charge counter:") || line.contains("charge_counter:") {
                    if let Some(counter_str) = line.split(':').nth(1) {
                        if let Ok(counter) = counter_str.trim().parse::<i64>() {
                            // Charge counter 通常以 μAh 为单位
                            charge_counter_uah = Some(counter);
                            log::info!("Found Charge counter: {} μAh", counter);
                        }
                    }
                }
            }

            // 使用 Charge counter 和当前电量计算实际可用容量
            if let (Some(counter_uah), Some(level)) = (charge_counter_uah, battery_level) {
                if level > 0 && counter_uah > 0 {
                    // 计算实际可用容量：Charge counter ÷ 当前电量百分比
                    let actual_capacity_uah = (counter_uah as f64 / (level as f64 / 100.0)) as i64;
                    let actual_capacity_mah = (actual_capacity_uah / 1000) as u32;

                    // 验证计算结果的合理性（容量范围 500-15000 mAh）
                    if (500..=15000).contains(&actual_capacity_mah) {
                        battery_actual_capacity = Some(actual_capacity_mah);
                        log::info!("Calculated actual capacity from Charge counter: {} mAh (counter: {} μAh, level: {}%)",
                                 actual_capacity_mah, counter_uah, level);
                    } else {
                        log::warn!(
                            "Calculated capacity {} mAh is out of reasonable range, ignoring",
                            actual_capacity_mah
                        );
                    }
                } else {
                    log::warn!(
                        "Invalid data for capacity calculation: counter={:?}, level={:?}",
                        charge_counter_uah,
                        battery_level
                    );
                }
            }

            // 尝试获取设计容量信息（标称容量）
            if let Ok(capacity_result) = utils_execute_adb_command(
                &[
                    "-s",
                    &serial,
                    "shell",
                    "cat",
                    "/sys/class/power_supply/battery/charge_full_design",
                ],
                Some(5),
            )
            .await
            {
                if capacity_result.success {
                    if let Ok(design_capacity) = capacity_result.output.trim().parse::<u32>() {
                        battery_design_capacity = Some(design_capacity / 1000); // 转换为mAh
                        log::info!("Found design capacity: {} mAh", design_capacity / 1000);
                    }
                }
            }

            // 如果没有获取到设计容量，尝试另一个路径
            if battery_design_capacity.is_none() {
                if let Ok(capacity_result) = utils_execute_adb_command(
                    &[
                        "-s",
                        &serial,
                        "shell",
                        "cat",
                        "/sys/class/power_supply/battery/charge_full",
                    ],
                    Some(5),
                )
                .await
                {
                    if capacity_result.success {
                        if let Ok(full_capacity) = capacity_result.output.trim().parse::<u32>() {
                            battery_design_capacity = Some(full_capacity / 1000); // 转换为mAh
                            log::info!(
                                "Found full capacity as design capacity: {} mAh",
                                full_capacity / 1000
                            );
                        }
                    }
                }
            }

            // 如果 Charge counter 方法失败，回退到传统方法获取实际容量
            if battery_actual_capacity.is_none() {
                log::info!("Charge counter method failed, falling back to traditional method");

                if let Ok(capacity_result) = utils_execute_adb_command(
                    &[
                        "-s",
                        &serial,
                        "shell",
                        "cat",
                        "/sys/class/power_supply/battery/charge_now",
                    ],
                    Some(5),
                )
                .await
                {
                    if capacity_result.success {
                        if let Ok(current_capacity) = capacity_result.output.trim().parse::<u32>() {
                            battery_actual_capacity = Some(current_capacity / 1000); // 转换为mAh
                            log::info!(
                                "Found current capacity (fallback): {} mAh",
                                current_capacity / 1000
                            );
                        }
                    }
                }
            }

            // 计算电池健康度百分比和状态
            let (battery_health_percent, health_calculation_method) = if let (
                Some(actual),
                Some(design),
            ) =
                (battery_actual_capacity, battery_design_capacity)
            {
                if design > 0 {
                    let health_percent = ((actual as f64 / design as f64) * 100.0).round() as u32;
                    let limited_health = std::cmp::min(health_percent, 150); // 允许稍微超过100%，但限制在150%以内
                    let method = if charge_counter_uah.is_some() {
                        "Charge counter 计算"
                    } else {
                        "系统文件计算"
                    };
                    log::info!(
                        "Battery health calculated: {}% using method: {}",
                        limited_health,
                        method
                    );
                    (Some(limited_health), Some(method.to_string()))
                } else {
                    log::warn!("Design capacity is 0, cannot calculate health");
                    (None, None)
                }
            } else if battery_actual_capacity.is_some() && battery_design_capacity.is_none() {
                log::info!("Have actual capacity but no design capacity, cannot calculate health percentage");
                (None, Some("无标称容量".to_string()))
            } else {
                log::info!("No capacity data available for health calculation");
                (None, None)
            };

            battery_info = json!({
                "battery_health_percent": battery_health_percent,
                "battery_actual_capacity": battery_actual_capacity,
                "battery_design_capacity": battery_design_capacity,
                "battery_health_status": battery_health_status,
                "battery_level": battery_level,
                "battery_temperature": battery_temperature,
                "health_calculation_method": health_calculation_method,
                "charge_counter_available": charge_counter_uah.is_some()
            });
        }
    }

    Ok(json!({
        "memory": memory_info,
        "storage": storage_info,
        "battery": battery_info
    }))
}

/// 获取设备内存、存储和电池信息（与 get_device_performance_info 相同的实现）
#[tauri::command]
pub async fn get_device_memory_storage_info(serial: String) -> Result<serde_json::Value> {
    get_device_performance_info(serial).await
}
