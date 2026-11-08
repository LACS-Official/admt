/** 按命令行模式分别保存历史，切模式、重启应用后仍可用「↑」调出上次指令。 */

import type { CommandMode } from "./commandSuggestions";

export const HISTORY_LIMIT = 50;
const STORAGE_KEY = "admt.commandHistory.v1";

export type CommandHistoryMap = Record<CommandMode, string[]>;

const EMPTY_HISTORY: CommandHistoryMap = {
  adb: [],
  fastboot: [],
  powershell: [],
  cmd: [],
};

export function loadCommandHistory(): CommandHistoryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_HISTORY };
    const parsed = JSON.parse(raw) as Partial<CommandHistoryMap>;
    return {
      adb: Array.isArray(parsed.adb) ? parsed.adb.slice(0, HISTORY_LIMIT) : [],
      fastboot: Array.isArray(parsed.fastboot) ? parsed.fastboot.slice(0, HISTORY_LIMIT) : [],
      powershell: Array.isArray(parsed.powershell) ? parsed.powershell.slice(0, HISTORY_LIMIT) : [],
      cmd: Array.isArray(parsed.cmd) ? parsed.cmd.slice(0, HISTORY_LIMIT) : [],
    };
  } catch {
    return { ...EMPTY_HISTORY };
  }
}

/** 返回新的历史表，同一模式内去重、最近执行的排最前 */
export function pushCommandHistory(
  map: CommandHistoryMap,
  mode: CommandMode,
  command: string
): CommandHistoryMap {
  const value = command.trim();
  if (!value) return map;
  const list = map[mode] ?? [];
  const next: CommandHistoryMap = {
    ...map,
    [mode]: [value, ...list.filter((item) => item !== value)].slice(0, HISTORY_LIMIT),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 隐私模式或存储不可用时只保留内存状态
  }
  return next;
}
