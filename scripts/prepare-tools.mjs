import { cpSync, existsSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const toolsRoot = resolve(projectRoot, "src-tauri/tools");
const platform =
  process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";

// adb-bin: 三平台必需（adb/fastboot）
// scrcpy: 三平台尽量提供（缺失时告警，投屏功能降级）
// lacs: 仅 Windows（USB 驱动修复脚本），其余平台跳过
const requiredTools = ["adb-bin"];
const optionalTools = ["scrcpy"];
const windowsOnlyTools = ["lacs"];

/** 复制后给可执行文件补执行权限（git 在 Windows 检出会丢失 exec 位） */
function ensureExecutable(dir) {
  if (platform === "windows") return;
  for (const name of ["adb", "fastboot", "scrcpy", "scrcpy-server"]) {
    const p = resolve(dir, name);
    if (existsSync(p)) {
      try {
        chmodSync(p, 0o755);
      } catch {
        // 忽略：运行时 cache.rs 的 ensure_executable 会兜底
      }
    }
  }
}

/** macOS scrcpy 需按 CPU 架构选择二进制并命名为 scrcpy */
function normalizeScrcpySource(source) {
  if (platform !== "macos") return source;
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  const archFile = resolve(source, `scrcpy-${arch}`);
  const plainFile = resolve(source, "scrcpy");
  if (!existsSync(plainFile) && existsSync(archFile)) {
    cpSync(archFile, plainFile);
    console.log(`[prepare-tools] macos/scrcpy: 选择 ${arch} 架构 -> scrcpy`);
  }
  return source;
}

function copyTool(name, { required }) {
  const source = normalizeScrcpySource(resolve(toolsRoot, platform, name));
  const target = resolve(toolsRoot, name);

  if (!existsSync(source)) {
    if (required) {
      throw new Error(`[prepare-tools] 缺少 ${platform} 平台工具目录: ${source}`);
    }
    if (!existsSync(target)) mkdirSync(target, { recursive: true });
    console.warn(`[prepare-tools] ${platform}/${name} 缺失，跳过（相关功能将降级）`);
    return;
  }

  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
  ensureExecutable(target);
  console.log(`[prepare-tools] ${platform}/${name} -> tools/${name}`);
}

if (platform === "windows") {
  console.log("[prepare-tools] windows: 使用 tools/ 根目录下已有的二进制");
  for (const name of requiredTools) {
    if (!existsSync(resolve(toolsRoot, name))) {
      throw new Error(`[prepare-tools] 缺少必备工具目录: tools/${name}`);
    }
  }
} else {
  for (const name of requiredTools) copyTool(name, { required: true });
  for (const name of optionalTools) copyTool(name, { required: false });

  // lacs（USB 驱动修复）仅 Windows 有意义，其余平台原样跳过
  for (const name of windowsOnlyTools) {
    console.log(`[prepare-tools] ${platform}: 跳过 ${name}（Windows 专有）`);
  }
}
