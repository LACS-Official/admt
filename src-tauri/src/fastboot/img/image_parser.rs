use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use crate::error::{Result, AdmtError};
use flate2::read::GzDecoder;

/// 分区镜像深度解包与元数据结构体
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PartitionImageInspection {
    pub file_name: String,
    pub file_size_bytes: u64,
    pub file_size_formatted: String,
    pub image_type: String, // "boot" | "vendor_boot" | "vbmeta" | "sparse" | "raw" | "unknown"
    pub magic: String,
    pub is_valid_image: bool,
    
    // Boot / Vendor Boot 元数据
    pub header_version: Option<u32>,
    pub os_version: Option<String>,
    pub os_patch_level: Option<String>,
    pub kernel_size: Option<u64>,
    pub ramdisk_size: Option<u64>,
    pub second_size: Option<u64>,
    pub dtb_size: Option<u64>,
    pub page_size: Option<u32>,
    pub cmdline: Option<String>,
    pub extra_cmdline: Option<String>,
    pub board_name: Option<String>,
    
    // AVB / Vbmeta 元数据
    pub avb_version: Option<String>,
    pub rollback_index: Option<u64>,
    pub avb_flags: Option<u32>,
    pub is_verity_disabled: Option<bool>,
    pub is_verification_disabled: Option<bool>,
    pub release_string: Option<String>,
    
    // Sparse 镜像元数据
    pub sparse_block_size: Option<u32>,
    pub sparse_total_blocks: Option<u32>,
    
    // Root 修补检测指纹
    pub root_detections: Vec<RootDetectionItem>,
    
    // 提取的系统关键属性
    pub extracted_properties: HashMap<String, String>,
    
    // 原始结构化文本摘要
    pub summary_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RootDetectionItem {
    pub name: String, // "Magisk" | "KernelSU" | "APatch" | "TWRP"
    pub status: String, // "detected" | "not_detected"
    pub details: String,
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

fn decode_os_version(val: u32) -> (Option<String>, Option<String>) {
    if val == 0 {
        return (None, None);
    }
    let a = (val >> 25) & 0x7f;
    let b = (val >> 18) & 0x7f;
    let c = (val >> 11) & 0x7f;
    let year = 2000 + ((val >> 4) & 0x7f);
    let month = val & 0xf;

    let os_ver = if a > 0 {
        format!("{}.{}.{}", a, b, c)
    } else {
        format!("Android")
    };
    let patch = format!("{:04}-{:02}", year, month);
    (Some(os_ver), Some(patch))
}

fn align_up(size: u64, align: u64) -> u64 {
    if align == 0 {
        size
    } else {
        ((size + align - 1) / align) * align
    }
}

/// 深度解析镜像
pub fn inspect_image_file<P: AsRef<Path>>(path: P) -> Result<PartitionImageInspection> {
    let path = path.as_ref();
    let mut file = File::open(path).map_err(|e| AdmtError::Io(e.to_string()))?;
    let metadata = file.metadata().map_err(|e| AdmtError::Io(e.to_string()))?;
    let file_size = metadata.len();
    let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("image.img").to_string();

    let mut result = PartitionImageInspection {
        file_name,
        file_size_bytes: file_size,
        file_size_formatted: format_bytes(file_size),
        image_type: "unknown".to_string(),
        magic: "".to_string(),
        is_valid_image: false,
        ..Default::default()
    };

    if file_size < 8 {
        result.summary_text = "文件体积过小，不是有效的 Android 镜像文件。".to_string();
        return Ok(result);
    }

    let mut header = vec![0u8; 4096.min(file_size as usize)];
    file.read_exact(&mut header).map_err(|e| AdmtError::Io(e.to_string()))?;

    // 1. 检查 Android Boot Image Magic: "ANDROID!" (41 4E 44 52 4F 49 44 21)
    if header.starts_with(b"ANDROID!") {
        result.magic = "ANDROID!".to_string();
        result.is_valid_image = true;
        result.image_type = "boot".to_string();
        parse_boot_image(&mut file, &header, file_size, &mut result)?;
        return Ok(result);
    }

    // 2. 检查 Vendor Boot Image Magic: "VNDRBOOT" (56 4E 44 52 42 4F 4F 54)
    if header.starts_with(b"VNDRBOOT") {
        result.magic = "VNDRBOOT".to_string();
        result.is_valid_image = true;
        result.image_type = "vendor_boot".to_string();
        parse_vendor_boot_image(&mut file, &header, file_size, &mut result)?;
        return Ok(result);
    }

    // 3. 检查 Vbmeta / AVB Magic: "AVB0" (41 56 42 30)
    if header.starts_with(b"AVB0") {
        result.magic = "AVB0".to_string();
        result.is_valid_image = true;
        result.image_type = "vbmeta".to_string();
        parse_vbmeta_image(&header, &mut result)?;
        return Ok(result);
    }

    // 4. 检查 Android Sparse Image: 0xED26FF3A (3A FF 26 ED in Little Endian)
    if header.len() >= 28 && header[0..4] == [0x3A, 0xFF, 0x26, 0xED] {
        result.magic = "SPARSE (0xED26FF3A)".to_string();
        result.is_valid_image = true;
        result.image_type = "sparse".to_string();
        let blk_sz = u32::from_le_bytes(header[12..16].try_into().unwrap_or_default());
        let total_blks = u32::from_le_bytes(header[16..20].try_into().unwrap_or_default());
        result.sparse_block_size = Some(blk_sz);
        result.sparse_total_blocks = Some(total_blks);
        result.summary_text = format!(
            "Android Sparse 压缩镜像。块大小: {} 字节, 总块数: {}, 解压后预计容量: {}",
            blk_sz, total_blks, format_bytes(blk_sz as u64 * total_blks as u64)
        );
        return Ok(result);
    }

    // 5. 检查 Ext4 文件系统 Magic: 0x53EF at offset 1080 (0x438)
    if file_size >= 1084 {
        let mut ext4_buf = [0u8; 2];
        if file.seek(SeekFrom::Start(1080)).is_ok() && file.read_exact(&mut ext4_buf).is_ok() {
            if ext4_buf == [0x53, 0xEF] {
                result.magic = "EXT4 (0xEF53)".to_string();
                result.is_valid_image = true;
                result.image_type = "raw".to_string();
                result.summary_text = format!("原始 Ext4 文件系统镜像 (大小: {})", result.file_size_formatted);
                return Ok(result);
            }
        }
    }

    // 6. 检查 EROFS 文件系统 Magic: 0xE0F5E1E2 at offset 1024
    if file_size >= 1028 {
        let mut erofs_buf = [0u8; 4];
        if file.seek(SeekFrom::Start(1024)).is_ok() && file.read_exact(&mut erofs_buf).is_ok() {
            if erofs_buf == [0xE2, 0xE1, 0xF5, 0xE0] {
                result.magic = "EROFS (0xE0F5E1E2)".to_string();
                result.is_valid_image = true;
                result.image_type = "raw".to_string();
                result.summary_text = format!("只读高性能 EROFS 文件系统镜像 (大小: {})", result.file_size_formatted);
                return Ok(result);
            }
        }
    }

    result.summary_text = format!("通用/Raw 分区数据镜像文件 (大小: {})", result.file_size_formatted);
    Ok(result)
}

fn parse_boot_image(
    file: &mut File,
    header: &[u8],
    file_size: u64,
    res: &mut PartitionImageInspection,
) -> Result<()> {
    if header.len() < 64 {
        return Ok(());
    }

    // 尝试识别 Header 版本:
    let h_version = u32::from_le_bytes(header[40..44].try_into().unwrap_or_default());
    res.header_version = Some(h_version);

    let (ramdisk_offset, ramdisk_size) = if h_version == 3 || h_version == 4 {
        // Boot Header v3/v4
        let kernel_sz = u32::from_le_bytes(header[8..12].try_into().unwrap_or_default()) as u64;
        let rd_sz = u32::from_le_bytes(header[12..16].try_into().unwrap_or_default()) as u64;
        let os_ver_raw = u32::from_le_bytes(header[16..20].try_into().unwrap_or_default());
        let page_sz = 4096u32; // v3/v4 固定 4096

        let (os_ver, os_patch) = decode_os_version(os_ver_raw);
        res.os_version = os_ver;
        res.os_patch_level = os_patch;
        res.kernel_size = Some(kernel_sz);
        res.ramdisk_size = Some(rd_sz);
        res.page_size = Some(page_sz);

        if header.len() >= 44 + 512 {
            let cmd_slice = &header[44..44 + 512];
            let cmd_str = read_c_str(cmd_slice);
            if !cmd_str.is_empty() {
                res.cmdline = Some(cmd_str);
            }
        }

        let hdr_sz = 4096u64;
        let offset = hdr_sz + align_up(kernel_sz, page_sz as u64);
        (offset, rd_sz)
    } else {
        // Boot Header v0, v1, v2
        let kernel_sz = u32::from_le_bytes(header[8..12].try_into().unwrap_or_default()) as u64;
        let rd_sz = u32::from_le_bytes(header[16..20].try_into().unwrap_or_default()) as u64;
        let sec_sz = u32::from_le_bytes(header[24..28].try_into().unwrap_or_default()) as u64;
        let page_sz = u32::from_le_bytes(header[36..40].try_into().unwrap_or_default());
        let os_ver_raw = u32::from_le_bytes(header[44..48].try_into().unwrap_or_default());

        let (os_ver, os_patch) = decode_os_version(os_ver_raw);
        res.os_version = os_ver;
        res.os_patch_level = os_patch;
        res.kernel_size = Some(kernel_sz);
        res.ramdisk_size = Some(rd_sz);
        res.second_size = Some(sec_sz);
        res.page_size = Some(page_sz);

        if header.len() >= 48 + 16 {
            let name_str = read_c_str(&header[48..64]);
            if !name_str.is_empty() {
                res.board_name = Some(name_str);
            }
        }

        if header.len() >= 64 + 512 {
            let cmd_str = read_c_str(&header[64..64 + 512]);
            if !cmd_str.is_empty() {
                res.cmdline = Some(cmd_str);
            }
        }

        let actual_page_sz = if page_sz == 0 { 2048u64 } else { page_sz as u64 };
        let offset = actual_page_sz + align_up(kernel_sz, actual_page_sz);
        (offset, rd_sz)
    };

    // 探测 Ramdisk 内容与 Root 指纹
    if ramdisk_size > 0 && ramdisk_offset + ramdisk_size <= file_size + 4096 {
        inspect_ramdisk_content(file, ramdisk_offset, ramdisk_size, res);
    }

    // 生成总结文本
    let mut summary = format!(
        "Android Boot 镜像 (Header v{})。\n- 内核大小: {}\n- Ramdisk 大小: {}",
        h_version,
        format_bytes(res.kernel_size.unwrap_or_default()),
        format_bytes(res.ramdisk_size.unwrap_or_default())
    );
    if let Some(ref ver) = res.os_version {
        summary.push_str(&format!("\n- 系统版本: {}", ver));
    }
    if let Some(ref patch) = res.os_patch_level {
        summary.push_str(&format!("\n- 安全补丁级别: {}", patch));
    }
    if let Some(ref cmd) = res.cmdline {
        summary.push_str(&format!("\n- 启动参数 (cmdline): {}", cmd));
    }
    res.summary_text = summary;

    Ok(())
}

fn parse_vendor_boot_image(
    _file: &mut File,
    header: &[u8],
    _file_size: u64,
    res: &mut PartitionImageInspection,
) -> Result<()> {
    if header.len() < 32 {
        return Ok(());
    }
    let h_version = u32::from_le_bytes(header[8..12].try_into().unwrap_or_default());
    let page_sz = u32::from_le_bytes(header[12..16].try_into().unwrap_or_default());
    let rd_sz = u32::from_le_bytes(header[24..28].try_into().unwrap_or_default()) as u64;

    res.header_version = Some(h_version);
    res.page_size = Some(page_sz);
    res.ramdisk_size = Some(rd_sz);

    if header.len() >= 28 + 2048 {
        let cmd_str = read_c_str(&header[28..28 + 2048]);
        if !cmd_str.is_empty() {
            res.cmdline = Some(cmd_str);
        }
    }

    res.summary_text = format!(
        "Vendor Boot (厂商引导镜像, Header v{})。\n- 厂商 Ramdisk 大小: {}\n- Page Size: {} 字节",
        h_version,
        format_bytes(rd_sz),
        page_sz
    );
    Ok(())
}

fn parse_vbmeta_image(header: &[u8], res: &mut PartitionImageInspection) -> Result<()> {
    if header.len() < 128 {
        return Ok(());
    }
    let major = u32::from_be_bytes(header[4..8].try_into().unwrap_or_default());
    let minor = u32::from_be_bytes(header[8..12].try_into().unwrap_or_default());
    let rollback_idx = u64::from_be_bytes(header[112..120].try_into().unwrap_or_default());
    let flags = u32::from_be_bytes(header[120..124].try_into().unwrap_or_default());

    let is_verity_disabled = (flags & 0x1) != 0;
    let is_verification_disabled = (flags & 0x2) != 0;

    res.avb_version = Some(format!("{}.{}", major, minor));
    res.rollback_index = Some(rollback_idx);
    res.avb_flags = Some(flags);
    res.is_verity_disabled = Some(is_verity_disabled);
    res.is_verification_disabled = Some(is_verification_disabled);

    let mut summary = format!(
        "AVB 2.0 / Vbmeta 镜像 (AVB v{}.{})。\n- 防回滚 Rollback Index: {}\n- Flags: 0x{:08X}",
        major, minor, rollback_idx, flags
    );
    summary.push_str(&format!(
        "\n- DM-Verity 校验: {}",
        if is_verity_disabled { "已禁用 (Disabled)" } else { "已启用 (Enabled)" }
    ));
    summary.push_str(&format!(
        "\n- AVB 签名验证: {}",
        if is_verification_disabled { "已禁用 (Disabled)" } else { "已启用 (Enabled)" }
    ));

    res.summary_text = summary;
    Ok(())
}

fn inspect_ramdisk_content(
    file: &mut File,
    offset: u64,
    size: u64,
    res: &mut PartitionImageInspection,
) {
    let read_len = (size.min(16 * 1024 * 1024)) as usize;
    if read_len == 0 {
        return;
    }

    if file.seek(SeekFrom::Start(offset)).is_err() {
        return;
    }

    let mut buf = vec![0u8; read_len];
    if file.read_exact(&mut buf).is_err() {
        return;
    }

    // 检查是否为 gzip 压缩 (1F 8B)
    let decompressed = if buf.starts_with(&[0x1F, 0x8B]) {
        let gz = GzDecoder::new(&buf[..]);
        let mut dec = Vec::new();
        // 最多解压 32MB 用于模式匹配
        let _ = gz.take(32 * 1024 * 1024).read_to_end(&mut dec);
        dec
    } else {
        buf
    };

    let haystack = &decompressed[..];

    // 检测 Magisk
    let has_magisk = contains_bytes(haystack, b"magiskinit")
        || contains_bytes(haystack, b".magisk")
        || contains_bytes(haystack, b"magiskboot")
        || contains_bytes(haystack, b"init.magisk.rc");

    if has_magisk {
        res.root_detections.push(RootDetectionItem {
            name: "Magisk".to_string(),
            status: "detected".to_string(),
            details: "检测到 Ramdisk 中嵌入了 magiskinit / .magisk 补丁指纹。".to_string(),
        });
    }

    // 检测 KernelSU
    let has_ksu = contains_bytes(haystack, b"kernelsu")
        || contains_bytes(haystack, b"ksu_init")
        || contains_bytes(haystack, b"/data/adb/ksud");

    if has_ksu {
        res.root_detections.push(RootDetectionItem {
            name: "KernelSU".to_string(),
            status: "detected".to_string(),
            details: "检测到 Ramdisk / 内核符号中包含 KernelSU (ksud/kernelsu) 引导逻辑。".to_string(),
        });
    }

    // 检测 APatch
    let has_apatch = contains_bytes(haystack, b"apatch")
        || contains_bytes(haystack, b"superkey")
        || contains_bytes(haystack, b"apd");

    if has_apatch {
        res.root_detections.push(RootDetectionItem {
            name: "APatch".to_string(),
            status: "detected".to_string(),
            details: "检测到 APatch (apd/superkey) 补丁签名指纹。".to_string(),
        });
    }

    // 提取 prop 信息
    extract_props_from_bytes(haystack, &mut res.extracted_properties);
}

fn contains_bytes(haystack: &[u8], needle: &[u8]) -> bool {
    haystack.windows(needle.len()).any(|w| w == needle)
}

fn extract_props_from_bytes(data: &[u8], props: &mut HashMap<String, String>) {
    if let Ok(text) = std::str::from_utf8(data) {
        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('#') || !trimmed.contains('=') {
                continue;
            }
            if let Some((k, v)) = trimmed.split_once('=') {
                let k = k.trim();
                let v = v.trim();
                if k.starts_with("ro.build.")
                    || k.starts_with("ro.product.")
                    || k.starts_with("ro.system.")
                    || k == "ro.board.platform"
                {
                    props.insert(k.to_string(), v.to_string());
                }
            }
        }
    }
}

fn read_c_str(slice: &[u8]) -> String {
    let null_pos = slice.iter().position(|&b| b == 0).unwrap_or(slice.len());
    String::from_utf8_lossy(&slice[..null_pos]).trim().to_string()
}

/// Tauri Command: 深度解析分区镜像文件
#[tauri::command]
pub async fn inspect_partition_image(file_path: String) -> Result<PartitionImageInspection> {
    log::info!("[image_parser] inspect_partition_image: {}", file_path);
    tokio::task::spawn_blocking(move || {
        inspect_image_file(&file_path)
    })
    .await
    .map_err(|e| AdmtError::Process(format!("Task join error: {}", e)))?
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnpackPartitionResult {
    pub success: bool,
    pub output_dir: String,
    pub extracted_files: Vec<String>,
    pub summary: String,
    pub error: Option<String>,
}

/// Tauri Command: 真实解包分区镜像到指定目录 (提取 Kernel, Ramdisk, DTB, 元数据等)
#[tauri::command]
pub async fn unpack_partition_image(
    image_path: String,
    output_dir: String,
) -> Result<UnpackPartitionResult> {
    log::info!(
        "[image_parser] unpack_partition_image: {} -> {}",
        image_path,
        output_dir
    );

    tokio::task::spawn_blocking(move || {
        let in_path = Path::new(&image_path);
        let out_dir = Path::new(&output_dir);

        if !in_path.exists() {
            return Ok(UnpackPartitionResult {
                success: false,
                output_dir: output_dir.clone(),
                extracted_files: Vec::new(),
                summary: "".to_string(),
                error: Some("镜像文件不存在".to_string()),
            });
        }

        if let Err(e) = std::fs::create_dir_all(out_dir) {
            return Ok(UnpackPartitionResult {
                success: false,
                output_dir: output_dir.clone(),
                extracted_files: Vec::new(),
                summary: "".to_string(),
                error: Some(format!("创建输出目录失败: {}", e)),
            });
        }

        let mut file = match File::open(in_path) {
            Ok(f) => f,
            Err(e) => {
                return Ok(UnpackPartitionResult {
                    success: false,
                    output_dir: output_dir.clone(),
                    extracted_files: Vec::new(),
                    summary: "".to_string(),
                    error: Some(format!("打开镜像文件失败: {}", e)),
                });
            }
        };

        let file_size = file.metadata().map(|m| m.len()).unwrap_or(0);
        let mut header = vec![0u8; 4096.min(file_size as usize)];
        if let Err(e) = file.read_exact(&mut header) {
            return Ok(UnpackPartitionResult {
                success: false,
                output_dir: output_dir.clone(),
                extracted_files: Vec::new(),
                summary: "".to_string(),
                error: Some(format!("读取镜像头失败: {}", e)),
            });
        }

        let mut extracted = Vec::new();

        // 1. Android Boot Image
        if header.starts_with(b"ANDROID!") {
            let h_version = u32::from_le_bytes(header[40..44].try_into().unwrap_or_default());
            let (page_sz, kernel_sz, ramdisk_sz, second_sz, dtb_sz, os_ver_val, cmdline) = if h_version < 3 {
                let k_sz = u32::from_le_bytes(header[8..12].try_into().unwrap_or_default()) as u64;
                let r_sz = u32::from_le_bytes(header[16..20].try_into().unwrap_or_default()) as u64;
                let s_sz = u32::from_le_bytes(header[24..28].try_into().unwrap_or_default()) as u64;
                let p_sz = u32::from_le_bytes(header[36..40].try_into().unwrap_or_default()) as u64;
                let os_v = u32::from_le_bytes(header[44..48].try_into().unwrap_or_default());
                let cmd = if header.len() >= 576 {
                    read_c_str(&header[64..576])
                } else {
                    "".to_string()
                };

                let d_sz = if h_version == 2 && header.len() >= 1636 {
                    u32::from_le_bytes(header[1632..1636].try_into().unwrap_or_default()) as u64
                } else {
                    0
                };
                (p_sz.max(2048), k_sz, r_sz, s_sz, d_sz, os_v, cmd)
            } else {
                let k_sz = u32::from_le_bytes(header[8..12].try_into().unwrap_or_default()) as u64;
                let r_sz = u32::from_le_bytes(header[12..16].try_into().unwrap_or_default()) as u64;
                let os_v = u32::from_le_bytes(header[16..20].try_into().unwrap_or_default());
                let cmd = if header.len() >= 1572 {
                    read_c_str(&header[44..1580])
                } else {
                    "".to_string()
                };
                (4096u64, k_sz, r_sz, 0u64, 0u64, os_v, cmd)
            };

            // 提取 Kernel
            let kernel_offset = page_sz;
            if kernel_sz > 0 && kernel_offset + kernel_sz <= file_size {
                if file.seek(SeekFrom::Start(kernel_offset)).is_ok() {
                    let mut k_data = vec![0u8; kernel_sz as usize];
                    if file.read_exact(&mut k_data).is_ok() {
                        let k_path = out_dir.join("kernel");
                        let _ = std::fs::write(&k_path, &k_data);
                        extracted.push("kernel".to_string());
                    }
                }
            }

            // 提取 Ramdisk
            let ramdisk_offset = kernel_offset + align_up(kernel_sz, page_sz);
            if ramdisk_sz > 0 && ramdisk_offset + ramdisk_sz <= file_size {
                if file.seek(SeekFrom::Start(ramdisk_offset)).is_ok() {
                    let mut r_data = vec![0u8; ramdisk_sz as usize];
                    if file.read_exact(&mut r_data).is_ok() {
                        let r_path = out_dir.join("ramdisk.img");
                        let _ = std::fs::write(&r_path, &r_data);
                        extracted.push("ramdisk.img".to_string());

                        // 尝试解压 gzip ramdisk
                        if r_data.starts_with(&[0x1f, 0x8b]) {
                            let mut decoder = GzDecoder::new(&r_data[..]);
                            let mut uncompressed = Vec::new();
                            if decoder.read_to_end(&mut uncompressed).is_ok() {
                                let un_path = out_dir.join("ramdisk.cpio");
                                let _ = std::fs::write(&un_path, &uncompressed);
                                extracted.push("ramdisk.cpio".to_string());
                            }
                        }
                    }
                }
            }

            // 提取 DTB
            if dtb_sz > 0 {
                let dtb_offset = ramdisk_offset + align_up(ramdisk_sz, page_sz) + align_up(second_sz, page_sz);
                if dtb_offset + dtb_sz <= file_size {
                    if file.seek(SeekFrom::Start(dtb_offset)).is_ok() {
                        let mut d_data = vec![0u8; dtb_sz as usize];
                        if file.read_exact(&mut d_data).is_ok() {
                            let d_path = out_dir.join("dtb.img");
                            let _ = std::fs::write(&d_path, &d_data);
                            extracted.push("dtb.img".to_string());
                        }
                    }
                }
            }

            // 写入引导元数据
            let (os_ver, patch) = decode_os_version(os_ver_val);
            let info_content = format!(
                "Header Version: v{}\nOS Version: {}\nOS Patch Level: {}\nKernel Size: {} bytes\nRamdisk Size: {} bytes\nDTB Size: {} bytes\nPage Size: {} bytes\nCmdline: {}\n",
                h_version,
                os_ver.unwrap_or_else(|| "Unknown".to_string()),
                patch.unwrap_or_else(|| "Unknown".to_string()),
                kernel_sz,
                ramdisk_sz,
                dtb_sz,
                page_sz,
                cmdline
            );
            let _ = std::fs::write(out_dir.join("boot_info.txt"), &info_content);
            extracted.push("boot_info.txt".to_string());

            if !cmdline.is_empty() {
                let _ = std::fs::write(out_dir.join("cmdline.txt"), &cmdline);
                extracted.push("cmdline.txt".to_string());
            }

            let summary_msg = format!("成功解包 Android Boot v{} 镜像，提取了 {} 个组件。", h_version, extracted.len());

            return Ok(UnpackPartitionResult {
                success: true,
                output_dir: output_dir.clone(),
                extracted_files: extracted,
                summary: summary_msg,
                error: None,
            });
        }

        // 2. Vendor Boot
        if header.starts_with(b"VNDRBOOT") {
            let h_version = u32::from_le_bytes(header[8..12].try_into().unwrap_or_default());
            let p_sz = u32::from_le_bytes(header[12..16].try_into().unwrap_or_default()) as u64;
            let r_sz = u32::from_le_bytes(header[20..24].try_into().unwrap_or_default()) as u64;
            let dtb_sz = u32::from_le_bytes(header[28..32].try_into().unwrap_or_default()) as u64;

            let ramdisk_offset = p_sz.max(2048);
            if r_sz > 0 && ramdisk_offset + r_sz <= file_size {
                if file.seek(SeekFrom::Start(ramdisk_offset)).is_ok() {
                    let mut r_data = vec![0u8; r_sz as usize];
                    if file.read_exact(&mut r_data).is_ok() {
                        let _ = std::fs::write(out_dir.join("vendor_ramdisk.img"), &r_data);
                        extracted.push("vendor_ramdisk.img".to_string());
                    }
                }
            }

            if dtb_sz > 0 {
                let dtb_offset = ramdisk_offset + align_up(r_sz, p_sz);
                if dtb_offset + dtb_sz <= file_size {
                    if file.seek(SeekFrom::Start(dtb_offset)).is_ok() {
                        let mut d_data = vec![0u8; dtb_sz as usize];
                        if file.read_exact(&mut d_data).is_ok() {
                            let _ = std::fs::write(out_dir.join("dtb.img"), &d_data);
                            extracted.push("dtb.img".to_string());
                        }
                    }
                }
            }

            let info_content = format!(
                "Vendor Boot Version: v{}\nPage Size: {}\nVendor Ramdisk Size: {}\nDTB Size: {}\n",
                h_version, p_sz, r_sz, dtb_sz
            );
            let _ = std::fs::write(out_dir.join("vendor_boot_info.txt"), &info_content);
            extracted.push("vendor_boot_info.txt".to_string());

            return Ok(UnpackPartitionResult {
                success: true,
                output_dir: output_dir.clone(),
                extracted_files: extracted,
                summary: format!("成功解包 Vendor Boot v{} 镜像组件。", h_version),
                error: None,
            });
        }

        // 3. 通用 Raw 分区解包
        let _ = std::fs::write(out_dir.join("raw_partition.bin"), &header);
        extracted.push("raw_partition.bin".to_string());

        Ok(UnpackPartitionResult {
            success: true,
            output_dir: output_dir.clone(),
            extracted_files: extracted,
            summary: "成功提取分区原始镜像数据。".to_string(),
            error: None,
        })
    })
    .await
    .map_err(|e| AdmtError::Process(format!("Task join error: {}", e)))?
}
