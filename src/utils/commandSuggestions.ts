/**
 * 四种命令行的联想词库与候选匹配。
 * 候选项统一是「可直接执行的完整命令行」，不含 adb / fastboot / powershell / cmd 前缀，
 * 因为面板会自动剥离这些前缀。
 */

export type CommandMode = "adb" | "fastboot" | "powershell" | "cmd";

export interface CommandSuggestion {
  value: string;
  source: "history" | "builtin" | "library";
}

export const BUILTIN_COMMANDS: Record<CommandMode, string[]> = {
  adb: [
    "devices",
    "devices -l",
    "version",
    "help",
    "start-server",
    "kill-server",
    "connect",
    "disconnect",
    "wait-for-device",
    "get-state",
    "get-serialno",
    "tcpip 5555",
    "usb",
    "reboot",
    "reboot bootloader",
    "reboot recovery",
    "reboot sideload",
    "root",
    "unroot",
    "remount",
    "disable-verity",
    "sideload",
    "shell",
    "shell getprop",
    "shell getprop ro.product.model",
    "shell getprop ro.build.version.release",
    "shell dumpsys battery",
    "shell dumpsys window",
    "shell dumpsys package",
    "shell pm list packages",
    "shell pm list packages -3",
    "shell pm path",
    "shell pm clear",
    "shell am start",
    "shell am force-stop",
    "shell am broadcast",
    "shell settings get system",
    "shell settings put system",
    "shell wm size",
    "shell wm density",
    "shell input keyevent",
    "shell input tap",
    "shell input swipe",
    "shell input text",
    "shell screencap -p",
    "shell screenrecord",
    "shell ls",
    "shell cat",
    "shell ps",
    "shell top",
    "shell svc wifi enable",
    "shell svc wifi disable",
    "logcat",
    "logcat -c",
    "logcat -d",
    "logcat -v time",
    "bugreport",
    "install",
    "install -r",
    "install -t",
    "uninstall",
    "push",
    "pull",
    "forward --list",
    "reverse --list",
    "backup",
    "restore",
    "pair",
    "mdns",
  ],
  fastboot: [
    "devices",
    "devices -l",
    "reboot",
    "reboot bootloader",
    "reboot recovery",
    "reboot fastboot",
    "continue",
    "getvar all",
    "getvar version",
    "getvar product",
    "getvar unlocked",
    "getvar current-slot",
    "oem unlock",
    "oem lock",
    "oem unlock-go",
    "oem device-info",
    "flashing unlock",
    "flashing lock",
    "flashing get_unlock_ability",
    "flash boot",
    "flash init_boot",
    "flash vbmeta",
    "flash recovery",
    "flash system",
    "flash vendor",
    "flash super",
    "flash dtbo",
    "erase cache",
    "erase userdata",
    "erase misc",
    "boot",
    "update",
    "set_active a",
    "set_active b",
    "--version",
    "help",
  ],
  powershell: [
    "Get-Process",
    "Get-Service",
    "Get-ChildItem",
    "Get-Content",
    "Get-Command",
    "Get-Help",
    "Get-Location",
    "Set-Location",
    "Get-Date",
    "Get-NetIPConfiguration",
    "Test-NetConnection",
    "Test-Path",
    "Select-String",
    "Where-Object",
    "ForEach-Object",
    "Sort-Object",
    "Select-Object",
    "Out-File",
    "Start-Process",
    "Stop-Process",
    "New-Item",
    "Remove-Item",
    "Copy-Item",
    "Move-Item",
    "Rename-Item",
    "Invoke-WebRequest",
    "Invoke-RestMethod",
    "Get-ExecutionPolicy",
    "Set-ExecutionPolicy",
    "Clear-Host",
    "Get-History",
    "Get-Module",
    "Write-Output",
    "ipconfig",
    "ipconfig /all",
    "ping",
    "tracert",
    "netstat -ano",
    "systeminfo",
    "tasklist",
    "taskkill",
    "whoami",
    "cls",
    "dir",
    "type",
    "findstr",
    "adb devices",
    "fastboot devices",
    "ssh",
    "git status",
    "$PSVersionTable.PSVersion",
  ],
  cmd: [
    "dir",
    "cd",
    "cls",
    "echo",
    "ver",
    "date",
    "time",
    "type",
    "copy",
    "move",
    "del",
    "mkdir",
    "rmdir",
    "attrib",
    "chkdsk",
    "sfc /scannow",
    "DISM /Online /Cleanup-Image /RestoreHealth",
    "shutdown /s /t 0",
    "shutdown /r /t 0",
    "reg query",
    "schtasks",
    "findstr",
    "start",
    "exit",
    "ipconfig",
    "ipconfig /all",
    "ping",
    "tracert",
    "netstat -ano",
    "tasklist",
    "taskkill",
    "systeminfo",
    "whoami",
    "set",
    "path",
    "tree",
    "where",
    "robocopy",
    "adb devices",
    "fastboot devices",
    "ssh",
    "git status",
  ],
};

const MODE_PREFIX = /^(?:adb|fastboot|powershell|cmd)(?:\.exe)?\s+/i;

/** 去掉命令库里冗余的模式前缀，返回用户在输入框里真正需要的内容 */
export function normalizeCommandLine(raw: string): string {
  return raw.trim().replace(MODE_PREFIX, "").trim();
}

/**
 * 按当前输入生成候选：历史 > 内置常用命令 > 快捷命令库。
 * 空输入时返回最近使用 + 常用命令，方便一键选择。
 */
export function getCommandSuggestions(
  mode: CommandMode,
  input: string,
  history: string[] = [],
  libraryCommands: string[] = [],
  limit = 8
): CommandSuggestion[] {
  const query = normalizeCommandLine(input).toLowerCase();
  const seen = new Set<string>();
  const result: CommandSuggestion[] = [];

  const push = (raw: string, source: CommandSuggestion["source"]) => {
    if (result.length >= limit) return;
    const value = normalizeCommandLine(raw);
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    if (query && !key.startsWith(query)) return;
    seen.add(key);
    result.push({ value, source });
  };

  for (const item of history) push(item, "history");
  for (const item of BUILTIN_COMMANDS[mode] ?? []) push(item, "builtin");
  for (const item of libraryCommands) push(item, "library");

  return result;
}
