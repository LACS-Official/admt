import { invoke } from "@tauri-apps/api/core";
import type { CommandResult } from "../types/device";
import type { EnvCheckStatus, EnvToolStatus } from "../stores/appStore";

/**
 * 探测单个工具可用性：调用后端已有的 check_adb_availability / check_fastboot_availability。
 * 这两个命令会真正执行 `adb version` / `fastboot --version`，
 * 因此能覆盖「内置二进制缺失」「被杀软隔离」「路径损坏」等情况。
 */
async function probe(command: string): Promise<EnvToolStatus> {
  try {
    const result = await invoke<CommandResult>(command, {});
    // 后端在工具不可用时返回 success:false（不会抛异常）
    return result.success ? "ok" : "unavailable";
  } catch {
    // 极少情况：命令调用本身失败（如 IPC 异常），标记为未知而非误报
    return "unknown";
  }
}

/**
 * 启动环境检测：并行探测 adb 与 fastboot 工具链。
 * 返回结构化状态，供状态栏指示器与提示横幅消费。
 */
export async function checkEnvironment(): Promise<EnvCheckStatus> {
  const [adb, fastboot] = await Promise.all([
    probe("check_adb_availability"),
    probe("check_fastboot_availability"),
  ]);

  return {
    adb,
    fastboot,
    checkedAt: Date.now(),
  };
}
