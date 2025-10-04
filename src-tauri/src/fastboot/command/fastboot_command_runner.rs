use crate::device::CommandResult;
use crate::error::Result;

/// 使用指定Fastboot路径执行命令
#[tauri::command]
pub async fn execute_fastboot_command_with_path(
    fastboot_path: String,
    serial: String,
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    crate::adb_commands::execute_fastboot_command_with_path(
        &fastboot_path,
        &serial,
        &command,
        &args,
        timeout,
    )
    .await
}

/// 执行Fastboot命令（使用缓存路径）
#[tauri::command]
pub async fn execute_fastboot_command(
    serial: String,
    command: String,
    args: Vec<String>,
    timeout: Option<u64>,
) -> Result<CommandResult> {
    log::info!("[fastboot_command_runner] execute_fastboot_command called with serial: {}, command: {}, args: {:?}, timeout: {:?}", serial, command, args, timeout);
    
    // 构建参数列表
    let mut cmd_args = Vec::new();
    
    // 如果提供了序列号，添加 -s 参数
    if !serial.is_empty() {
        cmd_args.push("-s");
        cmd_args.push(&serial);
    }
    
    // 添加命令
    cmd_args.push(&command);
    
    // 添加其他参数
    for arg in &args {
        cmd_args.push(arg);
    }
    
    // 将字符串向量转换为字符串切片向量
    let cmd_args_refs: Vec<&str> = cmd_args.iter().map(|s| *s).collect();
    
    log::info!("[fastboot_command_runner] 构建的命令参数: {:?}", cmd_args_refs);
    
    // 调用 utils::execute_fastboot_command
    let result = crate::utils::execute_fastboot_command(&cmd_args_refs, timeout).await;
    
    log::info!("[fastboot_command_runner] utils::execute_fastboot_command 返回结果: success={}, output_len={}, error={:?}, exit_code={:?}", 
              result.as_ref().map(|r| r.success).unwrap_or(false),
              result.as_ref().map(|r| r.output.len()).unwrap_or(0),
              result.as_ref().map(|r| r.error.as_ref()).unwrap_or(None),
              result.as_ref().map(|r| r.exit_code).unwrap_or(None));
    
    result
}