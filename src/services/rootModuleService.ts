import { deviceService } from "./deviceService";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

export type RootModuleType = "magisk" | "ksu" | "lsposed" | "apatch";

export interface UnifiedRootModule {
  id: string; // 唯一标识：目录名 (Magisk/KSU) 或 包名 (LSPosed)
  name: string; // 模块名称
  version: string; // 版本号
  versionCode?: number | string; // 版本代号
  author: string; // 作者
  description: string; // 模块详细描述
  type: RootModuleType; // 模块生态分类
  enabled: boolean; // 是否处于启用状态
  pendingRemove?: boolean; // 是否待重启后移除 (Magisk/KSU)
  path?: string; // 模块存储路径或 APK 路径
  packageName?: string; // 包名（针对于 LSPosed 模块）
}

export interface RootEnvironmentInfo {
  hasRoot: boolean;
  magiskVersion: string | null;
  ksuVersion: string | null;
  apatchVersion: string | null;
  lsposedInstalled: boolean;
  lsposedVersion: string | null;
}

export interface OnlineCoreModuleInfo {
  id: string;
  name: string;
  author: string;
  repo: string;
  description: string;
  category: "framework" | "hide" | "fix" | "custom";
  targetType: RootModuleType;
  targetEnv: string;
  version: string;
  releaseDate?: string;
  downloadUrl: string;
  fileName: string;
  fileSize?: string;
  notes?: string;
  isLatest?: boolean;
}

const GH_PROXY_PREFIX = "https://ghproxy.net/";

export const DEFAULT_ONLINE_CORE_MODULES: OnlineCoreModuleInfo[] = [
  {
    id: "lsposed_mod",
    name: "LSPosed Mod (Zygisk)",
    author: "mywalkb / LSPosed",
    repo: "mywalkb/LSPosed_mod",
    description: "Android 14/15 深度适配与持续维护的 Xposed 运行时框架，全生态 Hook 基石",
    category: "framework",
    targetType: "magisk",
    targetEnv: "Zygisk / KernelSU / APatch / Magisk",
    version: "v1.9.3_mod",
    releaseDate: "2024-05",
    downloadUrl: "https://github.com/mywalkb/LSPosed_mod/releases/download/v1.9.3_mod/LSPosed-v1.9.3_mod-7054-zygisk-release.zip",
    fileName: "LSPosed-v1.9.3_mod-zygisk-release.zip",
    fileSize: "2.51 MB",
    notes: "推荐搭载 Zygisk Next 或官方 Zygisk 运行",
  },
  {
    id: "zygisk_next",
    name: "Zygisk Next",
    author: "Dr-TSNG",
    repo: "Dr-TSNG/ZygiskNext",
    description: "独立高性能的通用 Zygisk 注入环境，原生支持 KernelSU、APatch 与 Magisk",
    category: "framework",
    targetType: "ksu",
    targetEnv: "KernelSU / APatch / Magisk",
    version: "v1.5.0",
    releaseDate: "2025-01",
    downloadUrl: "https://github.com/Dr-TSNG/ZygiskNext/releases/download/v1.5.0/Zygisk-Next-v1.5.0-release.zip",
    fileName: "Zygisk-Next-v1.5.0-release.zip",
    fileSize: "7.18 MB",
    notes: "KernelSU 与 APatch 用户运行 LSPosed / Shamiko 等模块的必备底层",
  },
  {
    id: "tricky_store",
    name: "Tricky Store",
    author: "5ec1cff",
    repo: "5ec1cff/TrickyStore",
    description: "强大的硬件级密钥库伪装 (Keystore / TEE Broken Bypass)，通过 Play 强完整性验证",
    category: "fix",
    targetType: "ksu",
    targetEnv: "KernelSU / APatch / Magisk",
    version: "1.4.1",
    releaseDate: "2025-02",
    downloadUrl: "https://github.com/5ec1cff/TrickyStore/releases/download/1.4.1/Tricky-Store-1.4.1.zip",
    fileName: "Tricky-Store-1.4.1.zip",
    fileSize: "2.71 MB",
    notes: "突破各种银行类应用与 Google Play 强安全检查",
  },
  {
    id: "shamiko",
    name: "Shamiko (Root 深度隐藏)",
    author: "LSPosed Team",
    repo: "LSPosed/Shamiko",
    description: "白名单级 Root 环境特征隐藏，专为对抗各类严苛反作弊与金融检测打造",
    category: "hide",
    targetType: "magisk",
    targetEnv: "Zygisk 依赖",
    version: "v1.1.1",
    releaseDate: "2024-04",
    downloadUrl: "https://github.com/LSPosed/Shamiko/releases/download/v1.1.1/Shamiko-v1.1.1-357-release.zip",
    fileName: "Shamiko-v1.1.1-release.zip",
    fileSize: "1.2 MB",
    notes: "需开启 Zygisk 并在模块启用后生效",
  },
  {
    id: "play_integrity_fix",
    name: "Play Integrity Fix",
    author: "chiteroman",
    repo: "chiteroman/PlayIntegrityFix",
    description: "动态修补 GMS 认证参数，通过 Google Play Integrity 与 SafetyNet CTS 验证",
    category: "fix",
    targetType: "ksu",
    targetEnv: "全平台通用",
    version: "v18.5",
    releaseDate: "2025-01",
    downloadUrl: "https://github.com/chiteroman/PlayIntegrityFix/releases/download/v18.5/PlayIntegrityFix_v18.5.zip",
    fileName: "PlayIntegrityFix_v18.5.zip",
    fileSize: "180 KB",
    notes: "解决 Google Play 无法下载认证应用、设备未通过认证提示",
  },
  {
    id: "hyperceiler",
    name: "HyperCeiler (澎湃增强)",
    author: "ReChronoX",
    repo: "ReChronoX/HyperCeiler",
    description: "小米 HyperOS / MIUI 深度系统增强模块应用，支持系统动画、锁屏、状态栏魔改",
    category: "custom",
    targetType: "lsposed",
    targetEnv: "LSPosed 模块应用 (.apk)",
    version: "2.6.2",
    releaseDate: "2024-11",
    downloadUrl: "https://github.com/ReChronoX/HyperCeiler/releases/download/2.6.2/HyperCeiler_2.6.2.apk",
    fileName: "HyperCeiler_2.6.2.apk",
    fileSize: "8.5 MB",
    notes: "APK 模块应用，刷入后将在设备端安装并自动注册到 LSPosed",
  },
];

class RootModuleService {
  private static instance: RootModuleService;

  private constructor() {}

  public static getInstance(): RootModuleService {
    if (!RootModuleService.instance) {
      RootModuleService.instance = new RootModuleService();
    }
    return RootModuleService.instance;
  }

  /**
   * 检测设备 Root 权限与各框架安装状态
   */
  async getEnvironmentInfo(serial: string): Promise<RootEnvironmentInfo> {
    const envInfo: RootEnvironmentInfo = {
      hasRoot: false,
      magiskVersion: null,
      ksuVersion: null,
      apatchVersion: null,
      lsposedInstalled: false,
      lsposedVersion: null,
    };

    if (!serial) return envInfo;

    try {
      // 1. 检测 Root 提权环境
      const rootCheck = await deviceService.executeAdbCommand(serial, "shell", [
        "su",
        "-c",
        "id",
      ]);
      envInfo.hasRoot = !!(
        rootCheck.success &&
        rootCheck.output &&
        rootCheck.output.includes("uid=0")
      );
    } catch {
      envInfo.hasRoot = false;
    }

    if (envInfo.hasRoot) {
      // 2. 检测 Magisk
      try {
        const magiskCheck = await deviceService.executeAdbCommand(serial, "shell", [
          "su",
          "-c",
          "magisk -v 2>/dev/null || [ -f /data/adb/magisk/magisk ] && echo 'installed' || echo ''",
        ]);
        if (magiskCheck.output && magiskCheck.output.trim()) {
          const v = magiskCheck.output.trim();
          envInfo.magiskVersion = v === "installed" ? "已安装" : v;
        }
      } catch {
        // ignore
      }

      // 3. 检测 KernelSU
      try {
        const ksuCheck = await deviceService.executeAdbCommand(serial, "shell", [
          "su",
          "-c",
          "ksud -V 2>/dev/null || [ -d /data/adb/ksu ] && echo 'KernelSU' || cat /proc/version | grep -i 'KernelSU' || echo ''",
        ]);
        if (ksuCheck.output && ksuCheck.output.trim()) {
          envInfo.ksuVersion = ksuCheck.output.trim().split("\n")[0].trim();
        }
      } catch {
        // ignore
      }

      // 4. 检测 APatch
      try {
        const apCheck = await deviceService.executeAdbCommand(serial, "shell", [
          "su",
          "-c",
          "apd -V 2>/dev/null || [ -d /data/adb/ap ] && echo 'APatch' || echo ''",
        ]);
        if (apCheck.output && apCheck.output.trim()) {
          envInfo.apatchVersion = apCheck.output.trim().split("\n")[0].trim();
        }
      } catch {
        // ignore
      }

      // 5. 检测 LSPosed 框架本体是否安装在模块中
      try {
        const lspCheck = await deviceService.executeAdbCommand(serial, "shell", [
          "su",
          "-c",
          "ls -d /data/adb/modules/*lsposed* /data/adb/lspd 2>/dev/null || echo ''",
        ]);
        if (lspCheck.output && lspCheck.output.trim()) {
          envInfo.lsposedInstalled = true;
          envInfo.lsposedVersion = "框架运行中";
        }
      } catch {
        // ignore
      }
    } else {
      // 非 Root 下尝试检查 LSPosed Manager 是否安装
      try {
        const lspAppCheck = await deviceService.executeAdbCommand(serial, "shell", [
          "pm",
          "list",
          "packages",
          "org.lsposed.manager",
        ]);
        if (lspAppCheck.output && lspAppCheck.output.includes("org.lsposed.manager")) {
          envInfo.lsposedInstalled = true;
          envInfo.lsposedVersion = "LSPosed Manager 已安装";
        }
      } catch {
        // ignore
      }
    }

    return envInfo;
  }

  /**
   * 扫描 Magisk / KernelSU / APatch 模块列表
   */
  async scanMagiskAndKsuModules(
    serial: string,
    env: RootEnvironmentInfo
  ): Promise<UnifiedRootModule[]> {
    if (!serial || !env.hasRoot) return [];

    const modules: UnifiedRootModule[] = [];

    try {
      const script = `for d in /data/adb/modules/*; do
  if [ -f "$d/module.prop" ]; then
    echo "===ADMT_MOD==="
    echo "dir=$d"
    if [ -f "$d/disable" ]; then echo "enabled=0"; else echo "enabled=1"; fi
    if [ -f "$d/remove" ]; then echo "remove=1"; else echo "remove=0"; fi
    cat "$d/module.prop"
  fi
done`;

      const result = await deviceService.executeAdbCommand(serial, "shell", [
        "su",
        "-c",
        script,
      ]);

      if (!result.success || !result.output) {
        return modules;
      }

      const rawBlocks = result.output.split("===ADMT_MOD===");

      for (const block of rawBlocks) {
        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;

        const modData: Record<string, string> = {};
        for (const line of lines) {
          const eqIdx = line.indexOf("=");
          if (eqIdx !== -1) {
            const key = line.substring(0, eqIdx).trim();
            const val = line.substring(eqIdx + 1).trim();
            modData[key] = val;
          }
        }

        if (!modData.id && !modData.dir) continue;

        const id = modData.id || modData.dir?.split("/").pop() || "";
        const dir = modData.dir || `/data/adb/modules/${id}`;
        const isEnabled = modData.enabled !== "0";
        const isPendingRemove = modData.remove === "1";

        // 判断所属生态类型
        let type: RootModuleType = "magisk";
        if (env.ksuVersion && !env.magiskVersion) {
          type = "ksu";
        } else if (env.apatchVersion && !env.magiskVersion && !env.ksuVersion) {
          type = "apatch";
        } else if (env.ksuVersion && env.magiskVersion) {
          type = dir.includes("ksu") ? "ksu" : "magisk";
        }

        modules.push({
          id,
          name: modData.name || id,
          version: modData.version || "1.0",
          versionCode: modData.versionCode || "",
          author: modData.author || "未知作者",
          description: modData.description || "无详细描述",
          type,
          enabled: isEnabled,
          pendingRemove: isPendingRemove,
          path: dir,
        });
      }
    } catch (e) {
      console.error("扫描 Magisk / KSU 模块异常:", e);
    }

    return modules;
  }

  /**
   * 扫描 LSPosed (Xposed) 模块
   * 通过识别 APK 中的 assets/xposed_init 入口点与包名元数据
   */
  async scanLsposedModules(serial: string): Promise<UnifiedRootModule[]> {
    if (!serial) return [];

    const modules: UnifiedRootModule[] = [];

    try {
      // 1. 获取所有安装的第三方应用 APK 路径与包名
      const pmRes = await deviceService.executeAdbCommand(serial, "shell", [
        "pm",
        "list",
        "packages",
        "-3",
        "-f",
      ]);

      if (!pmRes.success || !pmRes.output) {
        return modules;
      }

      const rawLines = pmRes.output.split(/\r?\n/);
      const candidates: { apkPath: string; packageName: string }[] = [];

      for (const rawLine of rawLines) {
        const line = rawLine.trim();
        if (!line.startsWith("package:")) continue;

        const content = line.substring(8);
        const lastEq = content.lastIndexOf("=");
        if (lastEq === -1) continue;

        const apkPath = content.substring(0, lastEq);
        const packageName = content.substring(lastEq + 1);

        candidates.push({ apkPath, packageName });
      }

      if (candidates.length === 0) return modules;

      // 2. 批量检查哪些 APK 具有 assets/xposed_init
      // 为保证效率与稳定性，每 15 个一组执行一次 shell 检查
      const batchSize = 15;
      const xposedPackages: { apkPath: string; packageName: string }[] = [];

      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        // 构建检测脚本
        const checks = batch.map(
          (c) => `unzip -l "${c.apkPath}" assets/xposed_init >/dev/null 2>&1 && echo "XP:${c.packageName}|${c.apkPath}"`
        );
        const script = checks.join(" ; ");

        try {
          const res = await deviceService.executeAdbCommand(serial, "shell", [
            "sh",
            "-c",
            script,
          ]);

          if (res.output) {
            const outLines = res.output.split(/\r?\n/);
            for (const outLine of outLines) {
              if (outLine.startsWith("XP:")) {
                const parts = outLine.substring(3).split("|");
                if (parts.length >= 2) {
                  xposedPackages.push({
                    packageName: parts[0].trim(),
                    apkPath: parts[1].trim(),
                  });
                }
              }
            }
          }
        } catch {
          // continue next batch
        }
      }

      // 3. 对识别出的 LSPosed 模块拉取其版本与名称
      for (const item of xposedPackages) {
        let versionName = "未知版本";
        try {
          const dump = await deviceService.executeAdbCommand(serial, "shell", [
            "dumpsys",
            "package",
            item.packageName,
          ]);
          if (dump.output) {
            const vMatch = dump.output.match(/versionName=([^\s]+)/);
            if (vMatch && vMatch[1]) {
              versionName = vMatch[1];
            }
          }
        } catch {
          // ignore
        }

        // 格式化友好名称
        const formattedName = this.formatLsposedModuleName(item.packageName);

        modules.push({
          id: item.packageName,
          name: formattedName,
          version: versionName,
          author: "LSPosed 模块",
          description: `基于 LSPosed / Xposed 框架运行的代码挂钩模块 (${item.packageName})`,
          type: "lsposed",
          enabled: true, // 默认处于已装载可用状态
          path: item.apkPath,
          packageName: item.packageName,
        });
      }
    } catch (e) {
      console.error("扫描 LSPosed 模块异常:", e);
    }

    return modules;
  }

  /**
   * 全量扫描所有生态下的模块（Magisk, KernelSU, LSPosed）
   */
  async scanAllModules(serial: string): Promise<{
    environment: RootEnvironmentInfo;
    modules: UnifiedRootModule[];
  }> {
    const environment = await this.getEnvironmentInfo(serial);

    const [magiskKsuModules, lsposedModules] = await Promise.all([
      this.scanMagiskAndKsuModules(serial, environment),
      this.scanLsposedModules(serial),
    ]);

    return {
      environment,
      modules: [...magiskKsuModules, ...lsposedModules],
    };
  }

  /**
   * 切换模块启用 / 禁用状态
   */
  async toggleModule(
    serial: string,
    mod: UnifiedRootModule,
    enable: boolean
  ): Promise<boolean> {
    if (!serial) return false;

    if (mod.type === "magisk" || mod.type === "ksu" || mod.type === "apatch") {
      const disableFile = `${mod.path || `/data/adb/modules/${mod.id}`}/disable`;
      const cmd = enable
        ? `rm -f "${disableFile}"`
        : `touch "${disableFile}"`;

      const res = await deviceService.executeAdbCommand(serial, "shell", [
        "su",
        "-c",
        cmd,
      ]);
      return res.success;
    }

    if (mod.type === "lsposed" && mod.packageName) {
      // 对 LSPosed 模块可以通过启用/停用 App 状态或控制包
      const cmd = enable
        ? `pm enable "${mod.packageName}"`
        : `pm disable-user "${mod.packageName}"`;

      const res = await deviceService.executeAdbCommand(serial, "shell", [
        "sh",
        "-c",
        cmd,
      ]);
      return res.success;
    }

    return false;
  }

  /**
   * 卸载模块
   */
  async uninstallModule(
    serial: string,
    mod: UnifiedRootModule
  ): Promise<{ success: boolean; message: string }> {
    if (!serial) {
      return { success: false, message: "未连接有效设备" };
    }

    if (mod.type === "magisk" || mod.type === "ksu" || mod.type === "apatch") {
      // 标记为待重启卸载或直接清理
      const dir = mod.path || `/data/adb/modules/${mod.id}`;
      const cmd = `rm -rf "${dir}" || touch "${dir}/remove"`;

      const res = await deviceService.executeAdbCommand(serial, "shell", [
        "su",
        "-c",
        cmd,
      ]);

      if (res.success) {
        return {
          success: true,
          message: `模块 ${mod.name} 已标记移除，部分模块重启手机后完全生效。`,
        };
      } else {
        return {
          success: false,
          message: `移除模块失败: ${res.error || "提权执行失败"}`,
        };
      }
    }

    if (mod.type === "lsposed" && mod.packageName) {
      const res = await deviceService.executeAdbCommand(serial, "shell", [
        "pm",
        "uninstall",
        mod.packageName,
      ]);

      if (res.success) {
        return {
          success: true,
          message: `LSPosed 模块应用 ${mod.name} 已成功从设备卸载！`,
        };
      } else {
        return {
          success: false,
          message: `卸载失败: ${res.error || "ADB 拒绝访问"}`,
        };
      }
    }

    return { success: false, message: "未知模块类型" };
  }

  /**
   * 安装新模块 (.zip 适用于 Magisk/KernelSU，.apk 适用于 LSPosed)
   */
  async installModuleFile(
    serial: string,
    filePath: string
  ): Promise<{ success: boolean; message: string }> {
    if (!serial || !filePath) {
      return { success: false, message: "参数不完整" };
    }

    const lower = filePath.toLowerCase();

    // 1. APK 安装为 LSPosed 模块
    if (lower.endsWith(".apk")) {
      const res = await deviceService.installApk(serial, filePath, true);
      if (res.success) {
        return {
          success: true,
          message: "LSPosed 模块应用已成功安装，请在 LSPosed 作用域中按需勾选！",
        };
      } else {
        return {
          success: false,
          message: `安装 APK 失败: ${res.error || "安装中断"}`,
        };
      }
    }

    // 2. ZIP 安装为 Magisk / KernelSU 内核模块
    if (lower.endsWith(".zip")) {
      try {
        const remoteZip = "/data/local/tmp/admt_install_module.zip";
        // 推送文件
        await deviceService.executeAdbCommand(serial, "push", [
          filePath,
          remoteZip,
        ]);

        // 尝试通过 magisk 或 ksud 刷入
        const flashScript = `
if command -v magisk >/dev/null 2>&1; then
  magisk --install-module "${remoteZip}"
elif command -v ksud >/dev/null 2>&1; then
  ksud module install "${remoteZip}"
elif [ -f /data/adb/ksud ]; then
  /data/adb/ksud module install "${remoteZip}"
else
  echo "未检测到可用的 magisk 或 ksud 刷入引擎"
  exit 1
fi
rm -f "${remoteZip}"
`;
        const res = await deviceService.executeAdbCommand(serial, "shell", [
          "su",
          "-c",
          flashScript,
        ]);

        if (res.success && !res.output?.includes("exit 1")) {
          return {
            success: true,
            message: "模块已成功刷入系统，重启手机后即可完全生效！",
          };
        } else {
          return {
            success: false,
            message: `刷入失败: ${res.output || res.error || "未检测到模块安装工具"}`,
          };
        }
      } catch (e: any) {
        return {
          success: false,
          message: `刷入模块异常: ${e.message || String(e)}`,
        };
      }
    }

    return { success: false, message: "仅支持 .zip 模块包或 .apk 模块应用" };
  }

  /**
   * 格式化已知 LSPosed 模块名称，避免裸包名展示
   */
  private formatLsposedModuleName(pkg: string): string {
    const knownMap: Record<string, string> = {
      "com.sevtinge.hyperceiler": "HyperCeiler (HyperOS 深度定制)",
      "com.forbidad4tieba.hook": "贴吧净化助手",
      "gm.tieba.tabswitch": "贴吧底部栏切换",
      "org.lsposed.manager": "LSPosed 管理器",
      "io.github.duzhaokun666.chiter": "赤兔 (MIUI 系统魔改)",
      "top.canyie.dreamland.manager": "梦境管理器",
      "me.weishu.kernelsu": "KernelSU 管理器",
      "com.topjohnwu.magisk": "Magisk 管理器",
      "org.matrix.miui": "MIUI 性能大师",
      "me.bmax.apatch": "APatch 管理器",
      "com.fkzhang.wechatxposed": "微 X 模块",
      "com.solohky.bingo": "QNotified",
    };

    if (knownMap[pkg]) {
      return knownMap[pkg];
    }

    // 默认拆分末尾作为友好名称
    const parts = pkg.split(".");
    const tail = parts[parts.length - 1];
    return tail.charAt(0).toUpperCase() + tail.slice(1);
  }

  /**
   * 获取在线核心推荐模块真实最新版本信息
   */
  async fetchOnlineCoreModules(
    forceRefresh = false,
    _useMirror = true
  ): Promise<OnlineCoreModuleInfo[]> {
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem("admt_online_core_modules_cache_v1");
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (_e) {}
    }

    const modules = JSON.parse(JSON.stringify(DEFAULT_ONLINE_CORE_MODULES)) as OnlineCoreModuleInfo[];

    // 并行异步检索 GitHub Releases 最新版本
    await Promise.allSettled(
      modules.map(async (mod) => {
        try {
          const apiUrl = `https://api.github.com/repos/${mod.repo}/releases?per_page=1`;
          const resp = await fetch(apiUrl, {
            headers: { Accept: "application/vnd.github.v3+json" },
            signal: AbortSignal.timeout(6000),
          });

          if (!resp.ok) return;
          const releases = await resp.json();
          if (!Array.isArray(releases) || releases.length === 0) return;

          const latest = releases[0];
          const tag = latest.tag_name || latest.name || "";
          if (tag) {
            mod.version = tag;
            mod.isLatest = true;
          }
          if (latest.published_at) {
            mod.releaseDate = latest.published_at.slice(0, 10);
          }

          if (latest.assets && latest.assets.length > 0) {
            const isApk = mod.targetType === "lsposed" || mod.fileName.endsWith(".apk");
            const asset = latest.assets.find((a: any) => {
              const n = (a.name || "").toLowerCase();
              if (isApk) return n.endsWith(".apk");
              if (mod.id === "lsposed_mod") return n.includes("zygisk") && n.endsWith(".zip");
              return n.endsWith(".zip");
            }) || latest.assets[0];

            if (asset && asset.browser_download_url) {
              mod.downloadUrl = asset.browser_download_url;
              mod.fileName = asset.name || mod.fileName;
              if (asset.size) {
                const mb = (asset.size / (1024 * 1024)).toFixed(2);
                mod.fileSize = `${mb} MB`;
              }
            }
          }
        } catch (_err) {
          // 单个拉取失败不影响整体展示
        }
      })
    );

    try {
      localStorage.setItem("admt_online_core_modules_cache_v1", JSON.stringify(modules));
    } catch (_e) {}

    return modules;
  }

  /**
   * 一键从在线核心模块下载并刷入到设备
   */
  async downloadAndInstallOnlineModule(
    serial: string,
    mod: OnlineCoreModuleInfo,
    useMirror = true,
    onProgress: (percent: number, status: string) => void
  ): Promise<{ success: boolean; message: string }> {
    onProgress(10, `准备连接节点下载: ${mod.name} (${mod.version})...`);

    let downloadUrl = mod.downloadUrl;
    if (useMirror && downloadUrl.includes("github.com") && !downloadUrl.startsWith(GH_PROXY_PREFIX)) {
      downloadUrl = `${GH_PROXY_PREFIX}${downloadUrl}`;
    }

    const taskId = `mod_dl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    try {
      let unlistenProgress: (() => void) | null = null;
      let localFilePath = "";

      try {
        const window = getCurrentWindow();
        unlistenProgress = await listen<any>(`download-progress-${taskId}`, (event) => {
          const payload = event.payload;
          if (payload && typeof payload.progress === "number") {
            const pct = Math.min(80, Math.max(10, Math.round(payload.progress * 0.8)));
            onProgress(pct, `正在下载 ${mod.fileName}: ${pct}%`);
          }
        });

        onProgress(25, `正在下载模块数据: ${mod.fileName}...`);
        localFilePath = await invoke<string>("download_file", {
          url: downloadUrl,
          fileName: mod.fileName,
          taskId,
          window,
        });

        if (unlistenProgress) unlistenProgress();
      } catch (beErr) {
        if (unlistenProgress) unlistenProgress();
        console.warn("[RootModule] invoke download_file 异常，回退至 fetch 模式:", beErr);
        onProgress(30, `正在通过备用通道拉取数据: ${mod.fileName}...`);
        const resp = await fetch(downloadUrl);
        if (!resp.ok) {
          throw new Error(`网络拉取失败: HTTP ${resp.status}`);
        }
        // 如果后端下载异常且前端无直接文件句柄，提示用户
        return {
          success: false,
          message: `下载模块文件失败，请确认网络连接或手动通过直链下载`,
        };
      }

      onProgress(85, `文件已就绪，正在刷入设备并注册: ${mod.fileName}...`);
      const installRes = await this.installModuleFile(serial, localFilePath);

      onProgress(100, installRes.message);
      return installRes;
    } catch (err: any) {
      const msg = err.message || String(err);
      onProgress(0, `安装中断: ${msg}`);
      return { success: false, message: msg };
    }
  }

  /**
   * 通过任意在线 URL 直链下载并刷入模块
   */
  async installModuleFromUrl(
    serial: string,
    url: string,
    useMirror = true,
    onProgress: (percent: number, status: string) => void
  ): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim().startsWith("http")) {
      return { success: false, message: "请输入有效的 HTTP/HTTPS 下载直链" };
    }

    const cleanUrl = url.trim();
    let finalUrl = cleanUrl;
    if (useMirror && finalUrl.includes("github.com") && !finalUrl.startsWith(GH_PROXY_PREFIX)) {
      finalUrl = `${GH_PROXY_PREFIX}${finalUrl}`;
    }

    const rawFileName = cleanUrl.split("/").pop()?.split("?")[0] || "custom_module.zip";
    const taskId = `url_mod_${Date.now()}`;

    try {
      onProgress(15, `正在解析直链并建立连接: ${rawFileName}...`);
      const window = getCurrentWindow();

      const localFilePath = await invoke<string>("download_file", {
        url: finalUrl,
        fileName: rawFileName,
        taskId,
        window,
      });

      onProgress(80, `下载完成，正在推送到设备并执行刷入...`);
      const res = await this.installModuleFile(serial, localFilePath);
      onProgress(100, res.message);
      return res;
    } catch (err: any) {
      const msg = err.message || String(err);
      onProgress(0, `直链安装失败: ${msg}`);
      return { success: false, message: msg };
    }
  }

  /**
   * 检查已安装模块是否有可用的在线新版本
   */
  checkInstalledModulesUpdates(
    installedModules: UnifiedRootModule[],
    onlineModules: OnlineCoreModuleInfo[]
  ): Map<string, { latestVersion: string; moduleInfo: OnlineCoreModuleInfo }> {
    const updateMap = new Map<string, { latestVersion: string; moduleInfo: OnlineCoreModuleInfo }>();

    for (const inst of installedModules) {
      const instName = inst.name.toLowerCase();
      const instId = inst.id.toLowerCase();

      // 匹配核心在线模块
      const matched = onlineModules.find((online) => {
        const onId = online.id.toLowerCase();
        const onName = online.name.toLowerCase();

        if (instId.includes("zygisk") || instName.includes("zygisk next")) {
          return onId === "zygisk_next";
        }
        if (instId.includes("lsposed") || instName.includes("lsposed")) {
          return onId === "lsposed_mod";
        }
        if (instId.includes("tricky") || instName.includes("tricky store")) {
          return onId === "tricky_store";
        }
        if (instId.includes("shamiko") || instName.includes("shamiko")) {
          return onId === "shamiko";
        }
        if (instId.includes("playintegrity") || instName.includes("play integrity")) {
          return onId === "play_integrity_fix";
        }
        if (inst.packageName === "com.sevtinge.hyperceiler" || instName.includes("hyperceiler")) {
          return onId === "hyperceiler";
        }
        return onName.includes(instName) || instName.includes(onName);
      });

      if (matched && matched.version) {
        const cleanInstVer = inst.version.replace(/^v/i, "").trim();
        const cleanOnlineVer = matched.version.replace(/^v/i, "").trim();

        if (cleanInstVer && cleanOnlineVer && cleanInstVer !== cleanOnlineVer) {
          updateMap.set(inst.id, {
            latestVersion: matched.version,
            moduleInfo: matched,
          });
        }
      }
    }

    return updateMap;
  }
}

export const rootModuleService = RootModuleService.getInstance();
