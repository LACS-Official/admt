use std::io::{Read, Seek, SeekFrom, Cursor, Write, Result as IoResult};
use std::path::Path;
use reqwest::blocking::Client;
use reqwest::header::RANGE;
use serde::Serialize;
use tauri::{WebviewWindow, Emitter};

// --- Partition Info Struct ---
#[derive(Serialize, Clone, Debug)]
pub struct PayloadPartitionInfo {
    pub name: String,
    pub size: u64,
}

// --- Extract Progress Struct ---
#[derive(Serialize, Clone)]
pub struct ExtractProgress {
    pub progress: u32,
    pub status: String,
}

// --- HTTP Range Reader with caching ---
pub struct HttpRangeReader {
    client: Client,
    url: String,
    pos: u64,
    size: u64,
    buffer: Vec<u8>,
    buffer_start: u64,
}

impl HttpRangeReader {
    pub fn new(url: &str) -> Result<Self, String> {
        let client = Client::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
            
        // Use a GET request with Range 0-0 to test connection and fetch content length
        let resp = client.get(url)
            .header(RANGE, "bytes=0-0")
            .send()
            .map_err(|e| format!("连接下载服务器失败: {}", e))?;
            
        let size = if let Some(content_range) = resp.headers().get(reqwest::header::CONTENT_RANGE) {
            let cr_str = content_range.to_str().unwrap_or("");
            if let Some(pos) = cr_str.rfind('/') {
                cr_str[pos + 1..].parse::<u64>().ok()
            } else {
                None
            }
        } else {
            resp.headers()
                .get(reqwest::header::CONTENT_LENGTH)
                .and_then(|val| val.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
        }.ok_or_else(|| "无法获取固件包的大小 (Content-Length 缺失)，服务器可能不支持断点续传。".to_string())?;

        Ok(HttpRangeReader {
            client,
            url: url.to_string(),
            pos: 0,
            size,
            buffer: Vec::new(),
            buffer_start: 0,
        })
    }

    #[allow(dead_code)]
    pub fn size(&self) -> u64 {
        self.size
    }
}

impl Read for HttpRangeReader {
    fn read(&mut self, buf: &mut [u8]) -> IoResult<usize> {
        if self.pos >= self.size {
            return Ok(0);
        }
        
        let buffer_len = self.buffer.len() as u64;
        let in_buffer = self.pos >= self.buffer_start && self.pos < self.buffer_start + buffer_len;
        
        if in_buffer {
            let offset_in_buf = (self.pos - self.buffer_start) as usize;
            let available = (buffer_len - offset_in_buf as u64) as usize;
            let copy_len = std::cmp::min(buf.len(), available);
            buf[..copy_len].copy_from_slice(&self.buffer[offset_in_buf..offset_in_buf + copy_len]);
            self.pos += copy_len as u64;
            return Ok(copy_len);
        }
        
        // Fetch 64KB block to cache future directory reads
        let fetch_len = std::cmp::max(buf.len() as u64, 65536);
        let fetch_end = std::cmp::min(self.pos + fetch_len - 1, self.size - 1);
        if self.pos > fetch_end {
            return Ok(0);
        }
        
        let range_header = format!("bytes={}-{}", self.pos, fetch_end);
        let resp = self.client.get(&self.url)
            .header(RANGE, range_header)
            .send()
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

        if !resp.status().is_success() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("HTTP error: {}", resp.status()),
            ));
        }

        let bytes = resp.bytes().map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
        self.buffer = bytes.to_vec();
        self.buffer_start = self.pos;
        
        let copy_len = std::cmp::min(buf.len(), self.buffer.len());
        buf[..copy_len].copy_from_slice(&self.buffer[..copy_len]);
        self.pos += copy_len as u64;
        Ok(copy_len)
    }
}

impl Seek for HttpRangeReader {
    fn seek(&mut self, pos: SeekFrom) -> IoResult<u64> {
        match pos {
            SeekFrom::Start(offset) => {
                self.pos = std::cmp::min(offset, self.size);
            }
            SeekFrom::End(offset) => {
                if offset < 0 {
                    let abs_offset = (-offset) as u64;
                    self.pos = if abs_offset > self.size {
                        0
                    } else {
                        self.size - abs_offset
                    };
                } else {
                    self.pos = self.size;
                }
            }
            SeekFrom::Current(offset) => {
                if offset < 0 {
                    let abs_offset = (-offset) as u64;
                    self.pos = if abs_offset > self.pos {
                        0
                    } else {
                        self.pos - abs_offset
                    };
                } else {
                    self.pos = std::cmp::min(self.pos + offset as u64, self.size);
                }
            }
        }
        Ok(self.pos)
    }
}

// --- SubReader for slicing uncompressed files inside zip ---
pub struct SubReader<R> {
    inner: R,
    start: u64,
    size: u64,
    pos: u64,
}

impl<R: Read + Seek> SubReader<R> {
    pub fn new(mut inner: R, start: u64, size: u64) -> std::io::Result<Self> {
        inner.seek(SeekFrom::Start(start))?;
        Ok(SubReader {
            inner,
            start,
            size,
            pos: 0,
        })
    }
}

impl<R: Read + Seek> Read for SubReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        if self.pos >= self.size {
            return Ok(0);
        }
        let max_read = std::cmp::min(buf.len() as u64, self.size - self.pos) as usize;
        let read_bytes = self.inner.read(&mut buf[..max_read])?;
        self.pos += read_bytes as u64;
        Ok(read_bytes)
    }
}

impl<R: Read + Seek> Seek for SubReader<R> {
    fn seek(&mut self, pos: SeekFrom) -> std::io::Result<u64> {
        let new_pos = match pos {
            SeekFrom::Start(offset) => offset,
            SeekFrom::End(offset) => {
                if offset < 0 {
                    self.size.saturating_sub((-offset) as u64)
                } else {
                    self.size
                }
            }
            SeekFrom::Current(offset) => {
                if offset < 0 {
                    self.pos.saturating_sub((-offset) as u64)
                } else {
                    std::cmp::min(self.pos + offset as u64, self.size)
                }
            }
        };
        self.inner.seek(SeekFrom::Start(self.start + new_pos))?;
        self.pos = new_pos;
        Ok(self.pos)
    }
}

// --- Protobuf decoding helpers ---
#[allow(dead_code)]
enum WireValue {
    Varint(u64),
    LengthDelimited(Vec<u8>),
    Fixed64(u64),
    Fixed32(u32),
}

fn read_varint<R: Read>(reader: &mut R) -> std::io::Result<u64> {
    let mut value = 0u64;
    let mut shift = 0;
    loop {
        let mut byte = [0u8; 1];
        reader.read_exact(&mut byte)?;
        let b = byte[0];
        value |= ((b & 0x7F) as u64) << shift;
        if (b & 0x80) == 0 {
            break;
        }
        shift += 7;
        if shift >= 64 {
            return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, "Varint overflow"));
        }
    }
    Ok(value)
}

fn read_field<R: Read>(reader: &mut R) -> std::io::Result<Option<(u32, WireValue)>> {
    let tag = match read_varint(reader) {
        Ok(t) => t,
        Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e),
    };
    let field_number = (tag >> 3) as u32;
    let wire_type = (tag & 0x07) as u8;
    
    let value = match wire_type {
        0 => WireValue::Varint(read_varint(reader)?),
        1 => {
            let mut buf = [0u8; 8];
            reader.read_exact(&mut buf)?;
            WireValue::Fixed64(u64::from_le_bytes(buf))
        }
        2 => {
            let len = read_varint(reader)? as usize;
            let mut buf = vec![0u8; len];
            reader.read_exact(&mut buf)?;
            WireValue::LengthDelimited(buf)
        }
        5 => {
            let mut buf = [0u8; 4];
            reader.read_exact(&mut buf)?;
            WireValue::Fixed32(u32::from_le_bytes(buf))
        }
        _ => return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, format!("Unsupported wire type: {}", wire_type))),
    };
    Ok(Some((field_number, value)))
}

// --- Protobuf structures ---
struct Partition {
    name: String,
    size: u64,
    operations: Vec<Op>,
}

struct Op {
    op_type: u32,
    data_offset: u64,
    data_length: u64,
    dst_extents: Vec<Extent>,
}

struct Extent {
    start_block: u64,
    num_blocks: u64,
}

fn parse_manifest(manifest_bytes: &[u8]) -> std::io::Result<Vec<Partition>> {
    let mut cursor = Cursor::new(manifest_bytes);
    let mut partitions = Vec::new();
    
    while let Some((field, value)) = read_field(&mut cursor)? {
        if field == 13 { // partitions
            if let WireValue::LengthDelimited(part_bytes) = value {
                if let Ok(part) = parse_partition_update(&part_bytes) {
                    partitions.push(part);
                }
            }
        }
    }
    Ok(partitions)
}

fn parse_partition_update(bytes: &[u8]) -> std::io::Result<Partition> {
    let mut cursor = Cursor::new(bytes);
    let mut name = String::new();
    let mut size = 0;
    let mut operations = Vec::new();
    
    while let Some((field, value)) = read_field(&mut cursor)? {
        match field {
            1 => { // partition_name
                if let WireValue::LengthDelimited(name_bytes) = value {
                    name = String::from_utf8_lossy(&name_bytes).into_owned();
                }
            }
            2 => { // new_partition_info
                if let WireValue::LengthDelimited(info_bytes) = value {
                    let mut info_cursor = Cursor::new(info_bytes);
                    while let Some((info_field, info_value)) = read_field(&mut info_cursor)? {
                        if info_field == 2 { // size
                            if let WireValue::Varint(s) = info_value {
                                size = s;
                            }
                        }
                    }
                }
            }
            3 => { // operations
                if let WireValue::LengthDelimited(op_bytes) = value {
                    if let Ok(op) = parse_operation(&op_bytes) {
                        operations.push(op);
                    }
                }
            }
            _ => {}
        }
    }
    Ok(Partition { name, size, operations })
}

fn parse_operation(bytes: &[u8]) -> std::io::Result<Op> {
    let mut cursor = Cursor::new(bytes);
    let mut op_type = 0;
    let mut data_offset = 0;
    let mut data_length = 0;
    let mut dst_extents = Vec::new();
    
    while let Some((field, value)) = read_field(&mut cursor)? {
        match field {
            1 => { // type
                if let WireValue::Varint(t) = value {
                    op_type = t as u32;
                }
            }
            2 => { // data_offset
                if let WireValue::Varint(offset) = value {
                    data_offset = offset;
                }
            }
            3 => { // data_length
                if let WireValue::Varint(len) = value {
                    data_length = len;
                }
            }
            5 => { // dst_extents
                if let WireValue::LengthDelimited(extent_bytes) = value {
                    if let Ok(extent) = parse_extent(&extent_bytes) {
                        dst_extents.push(extent);
                    }
                }
            }
            _ => {}
        }
    }
    Ok(Op { op_type, data_offset, data_length, dst_extents })
}

fn parse_extent(bytes: &[u8]) -> std::io::Result<Extent> {
    let mut cursor = Cursor::new(bytes);
    let mut start_block = 0;
    let mut num_blocks = 0;
    
    while let Some((field, value)) = read_field(&mut cursor)? {
        match field {
            1 => { // start_block
                if let WireValue::Varint(start) = value {
                    start_block = start;
                }
            }
            2 => { // num_blocks
                if let WireValue::Varint(num) = value {
                    num_blocks = num;
                }
            }
            _ => {}
        }
    }
    Ok(Extent { start_block, num_blocks })
}

// --- Universal Payload Extractor logic ---
fn parse_payload_reader<R: Read + Seek>(
    mut reader: R,
) -> Result<Vec<PayloadPartitionInfo>, String> {
    let mut magic = [0u8; 4];
    reader.read_exact(&mut magic).map_err(|e| format!("读取Magic魔数失败: {}", e))?;
    if &magic != b"CrAU" {
        return Err("ROM文件不是有效的 payload.bin，Magic校验失败。".to_string());
    }
    
    let mut buf8 = [0u8; 8];
    reader.read_exact(&mut buf8).map_err(|e| e.to_string())?;
    let version = u64::from_be_bytes(buf8);
    
    reader.read_exact(&mut buf8).map_err(|e| e.to_string())?;
    let manifest_len = u64::from_be_bytes(buf8);
    
    let header_size = if version >= 2 { 24 } else { 20 };
    reader.seek(SeekFrom::Start(header_size)).map_err(|e| e.to_string())?;
    
    let mut manifest_bytes = vec![0u8; manifest_len as usize];
    reader.read_exact(&mut manifest_bytes).map_err(|e| format!("读取清单失败: {}", e))?;
    
    let partitions = parse_manifest(&manifest_bytes)
        .map_err(|e| format!("Protobuf 清单解析失败: {}", e))?;
        
    Ok(partitions.into_iter().map(|p| PayloadPartitionInfo {
        name: p.name,
        size: p.size,
    }).collect())
}

fn extract_partition_from_payload_reader<R: Read + Seek>(
    mut payload_reader: R,
    partition_name: &str,
    output_path: &Path,
    on_progress: impl Fn(u32, &str),
) -> Result<(), String> {
    payload_reader.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
    let mut magic = [0u8; 4];
    payload_reader.read_exact(&mut magic).map_err(|e| e.to_string())?;
    if &magic != b"CrAU" {
        return Err("ROM文件不是有效的 payload.bin，Magic校验失败。".to_string());
    }
    
    let mut buf8 = [0u8; 8];
    payload_reader.read_exact(&mut buf8).map_err(|e| e.to_string())?;
    let version = u64::from_be_bytes(buf8);
    
    payload_reader.read_exact(&mut buf8).map_err(|e| e.to_string())?;
    let manifest_len = u64::from_be_bytes(buf8);
    
    let metadata_signature_len = if version >= 2 {
        let mut buf4 = [0u8; 4];
        payload_reader.read_exact(&mut buf4).map_err(|e| e.to_string())?;
        u32::from_be_bytes(buf4) as u64
    } else {
        0
    };
    
    let header_size = if version >= 2 { 24 } else { 20 };
    let manifest_start = header_size;
    let data_start = header_size + manifest_len + metadata_signature_len;
    
    payload_reader.seek(SeekFrom::Start(manifest_start)).map_err(|e| e.to_string())?;
    let mut manifest_bytes = vec![0u8; manifest_len as usize];
    payload_reader.read_exact(&mut manifest_bytes).map_err(|e| e.to_string())?;
    
    let partitions = parse_manifest(&manifest_bytes)
        .map_err(|e| format!("解析清单失败: {}", e))?;
    
    let part = partitions.iter()
        .find(|p| p.name == partition_name)
        .ok_or_else(|| format!("在 payload.bin 中找不到名为 {} 的分区", partition_name))?;
    
    let mut out_file = std::fs::File::create(output_path)
        .map_err(|e| format!("创建输出文件失败: {}", e))?;
    
    let total_ops = part.operations.len();
    on_progress(0, &format!("开始提取 {} 分区...", partition_name));
    
    for (i, op) in part.operations.iter().enumerate() {
        let progress = ((i as f32 / total_ops as f32) * 100.0) as u32;
        on_progress(progress, &format!("正在解析镜像块 {} / {} ...", i + 1, total_ops));
        
        let op_data_offset = data_start + op.data_offset;
        payload_reader.seek(SeekFrom::Start(op_data_offset)).map_err(|e| e.to_string())?;
        
        let mut op_data = vec![0u8; op.data_length as usize];
        payload_reader.read_exact(&mut op_data).map_err(|e| e.to_string())?;
        
        let decompressed_data = match op.op_type {
            0 => { // REPLACE
                op_data
            }
            2 => { // REPLACE_XZ
                let mut decompressed = Vec::new();
                lzma_rs::xz_decompress(&mut Cursor::new(op_data), &mut decompressed)
                    .map_err(|e| format!("XZ 压缩块解压失败: {:?}", e))?;
                decompressed
            }
            _ => {
                return Err(format!("不支持的解压块操作类型: {}", op.op_type));
            }
        };
        
        let mut data_cursor = Cursor::new(decompressed_data);
        for extent in &op.dst_extents {
            let write_offset = extent.start_block * 4096;
            let write_len = extent.num_blocks * 4096;
            
            let mut block_buf = vec![0u8; write_len as usize];
            let read_len = data_cursor.read(&mut block_buf).map_err(|e| e.to_string())?;
            
            out_file.seek(SeekFrom::Start(write_offset)).map_err(|e| e.to_string())?;
            out_file.write_all(&block_buf[..read_len]).map_err(|e| e.to_string())?;
        }
    }
    
    on_progress(100, &format!("分区提取成功: {:?}", output_path));
    Ok(())
}

fn open_local_payload_reader(rom_path: &str) -> Result<(SubReader<std::fs::File>, u64), String> {
    let file = std::fs::File::open(rom_path).map_err(|e| format!("无法打开本地文件: {}", e))?;
    let path_buf = Path::new(rom_path);
    
    if path_buf.extension().and_then(|s| s.to_str()) == Some("zip") {
        let mut archive = zip::ZipArchive::new(file).map_err(|e| format!("无法解压ZIP文件目录: {}", e))?;
        
                let (_, data_start, size) = (0..archive.len())
            .find_map(|i| {
                if let Ok(file) = archive.by_index(i) {
                    if file.name() == "payload.bin" {
                        Some((i, file.data_start(), file.compressed_size()))
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .ok_or_else(|| "在固件 ZIP 压缩包内找不到 payload.bin 文件".to_string())?;
            
        let file_reopened = std::fs::File::open(rom_path).map_err(|e| e.to_string())?;
        let sub = SubReader::new(file_reopened, data_start, size).map_err(|e| e.to_string())?;
        Ok((sub, size))
    } else {
        let file_len = file.metadata().map(|m| m.len()).unwrap_or(0);
        let sub = SubReader::new(file, 0, file_len).map_err(|e| e.to_string())?;
        Ok((sub, file_len))
    }
}

// --- Tauri Commands ---

#[tauri::command]
pub async fn parse_local_rom(path: String) -> Result<Vec<PayloadPartitionInfo>, String> {
    tokio::task::spawn_blocking(move || {
        let (reader, _) = open_local_payload_reader(&path)?;
        parse_payload_reader(reader)
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn extract_local_partition(
    rom_path: String,
    part_name: String,
    out_dir: String,
    window: WebviewWindow,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let (reader, _) = open_local_payload_reader(&rom_path)?;
        let rom_name = Path::new(&rom_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("extracted");
            
        let out_name = format!("{}_{}.img", rom_name, part_name);
        let output_path = Path::new(&out_dir).join(out_name);
        
        let win = window.clone();
        extract_partition_from_payload_reader(reader, &part_name, &output_path, move |prog, status| {
            let _ = win.emit("rom-extract-progress", ExtractProgress {
                progress: prog,
                status: status.to_string(),
            });
        })?;
        
        Ok(output_path.to_string_lossy().into_owned())
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn parse_online_rom(url: String) -> Result<Vec<PayloadPartitionInfo>, String> {
    tokio::task::spawn_blocking(move || {
        let mut range_reader = HttpRangeReader::new(&url)?;
        let mut magic = [0u8; 4];
        range_reader.read_exact(&mut magic).map_err(|e| format!("读取在线Magic魔数失败: {}", e))?;
        range_reader.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
        
        if &magic == b"PK\x03\x04" {
            let mut archive = zip::ZipArchive::new(range_reader).map_err(|e| format!("在线解析ZIP目录失败，可能该直链不支持断点续传: {}", e))?;
            let (data_start, size) = (0..archive.len())
                .find_map(|i| {
                    if let Ok(file) = archive.by_index(i) {
                        if file.name() == "payload.bin" {
                            Some((file.data_start(), file.compressed_size()))
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                })
                .ok_or_else(|| "在在线固件 ZIP 包内未找到 payload.bin".to_string())?;
                
            let range_reader_reopened = HttpRangeReader::new(&url)?;
            let sub = SubReader::new(range_reader_reopened, data_start, size).map_err(|e| e.to_string())?;
            parse_payload_reader(sub)
        } else {
            parse_payload_reader(range_reader)
        }
    }).await.map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn extract_online_partition(
    url: String,
    part_name: String,
    out_dir: String,
    window: WebviewWindow,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let mut range_reader = HttpRangeReader::new(&url)?;
        let mut magic = [0u8; 4];
        range_reader.read_exact(&mut magic).map_err(|e| e.to_string())?;
        range_reader.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
        
        let out_name = format!("online_{}_{}.img", part_name, uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or(""));
        let output_path = Path::new(&out_dir).join(out_name);
        
        let win = window.clone();
        if &magic == b"PK\x03\x04" {
            let mut archive = zip::ZipArchive::new(range_reader).map_err(|e| format!("在线解析ZIP目录失败: {}", e))?;
            let (data_start, size) = (0..archive.len())
                .find_map(|i| {
                    if let Ok(file) = archive.by_index(i) {
                        if file.name() == "payload.bin" {
                            Some((file.data_start(), file.compressed_size()))
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                })
                .ok_or_else(|| "在线固件包中未找到 payload.bin".to_string())?;
                
            let range_reader_reopened = HttpRangeReader::new(&url)?;
            let sub = SubReader::new(range_reader_reopened, data_start, size).map_err(|e| e.to_string())?;
            extract_partition_from_payload_reader(sub, &part_name, &output_path, move |prog, status| {
                let _ = win.emit("rom-extract-progress", ExtractProgress {
                    progress: prog,
                    status: status.to_string(),
                });
            })?;
        } else {
            extract_partition_from_payload_reader(range_reader, &part_name, &output_path, move |prog, status| {
                let _ = win.emit("rom-extract-progress", ExtractProgress {
                    progress: prog,
                    status: status.to_string(),
                });
            })?;
        }
        
        Ok(output_path.to_string_lossy().into_owned())
    }).await.map_err(|e| e.to_string())?
}
