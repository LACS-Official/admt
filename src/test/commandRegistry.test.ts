import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();

function registeredCommands(): Set<string> {
  const lib = readFileSync(resolve(ROOT, 'src-tauri/src/lib.rs'), 'utf-8');
  const block = lib.match(/generate_handler!\s*\[([\s\S]*?)\]/);
  if (!block) throw new Error('未找到 generate_handler! 块');
  const names = new Set<string>();
  for (const raw of block[1].split(/[,\n]/)) {
    const cleaned = raw
      .replace(/\/\/.*$/, '')
      .trim()
      .split('::')
      .pop()
      ?.trim() ?? '';
    if (/^[a-z][a-z0-9_]*$/.test(cleaned)) names.add(cleaned);
  }
  return names;
}

function collectSourceFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) {
      result.push(full);
    }
  }
  return result;
}

describe('Tauri 命令注册契约', () => {
  it('前端静态 invoke 的命令全部已在后端注册', () => {
    const registered = registeredCommands();
    expect(registered.size).toBeGreaterThan(100);

    const missing = new Map<string, string>();
    const pattern = /invoke(?:<[^>]*>)?\(\s*['"`]([a-z][a-z0-9_]*)['"`]/g;
    for (const file of collectSourceFiles(resolve(ROOT, 'src'))) {
      const content = readFileSync(file, 'utf-8');
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        if (!registered.has(match[1])) missing.set(match[1], file);
      }
    }
    expect(
      [...missing.entries()].map(([cmd, file]) => `${cmd} <- ${file}`).sort(),
    ).toEqual([]);
  });

  it('get_rom_download_url 与 watch_fastboot_config_file 均已注册', () => {
    const registered = registeredCommands();
    expect(registered.has('get_rom_download_url')).toBe(true);
    expect(registered.has('watch_fastboot_config_file')).toBe(true);
  });
});

describe('系统托盘能力契约', () => {
  it('后端提供能力探测命令，销毁托盘时真正移除句柄', () => {
    const registered = registeredCommands();
    expect(registered.has('is_system_tray_supported')).toBe(true);

    const backend = readFileSync(
      resolve(ROOT, 'src-tauri/src/system_features.rs'),
      'utf-8',
    );
    // 旧实现只 set_visible(false)，同 id 再次 build 会失败，导致「关掉后开不回来」
    expect(backend).toContain('remove_tray_by_id(TRAY_ID)');
    expect(backend).not.toContain('托盘菜单更新完成（需要重新创建托盘以更新菜单）');
  });

  it('前端用 Tauri 2 官方 isTauri() 判定，不再依赖 Tauri 1 的 window.__TAURI__', () => {
    const svc = readFileSync(
      resolve(ROOT, 'src/services/systemTrayService.ts'),
      'utf-8',
    );
    expect(svc).toContain('isTauri()');
    expect(svc).toContain("invoke<boolean>('is_system_tray_supported')");
    expect(svc).not.toContain('!window.__TAURI__');
  });

  it('设置页不会用「托盘是否已创建」反向覆盖用户刚打开的开关', () => {
    const panel = readFileSync(
      resolve(ROOT, 'src/components/Settings/OtherSettingsPanel.tsx'),
      'utf-8',
    );
    expect(panel).not.toContain('trayReady !== config.systemTrayEnabled');
    expect(panel).toContain('systemTrayManager.initialize');
  });
});

describe('按键映射注入链路契约', () => {
  it('键盘桥接与运行时诊断命令均已注册', () => {
    const registered = registeredCommands();
    expect(registered.has('inject_key_mapping_event')).toBe(true);
    expect(registered.has('get_key_mapping_diagnostics')).toBe(true);
  });

  it('后端使用设备真实分辨率，且启动失败不会静默当作成功', () => {
    const src = readFileSync(
      resolve(ROOT, 'src-tauri/src/adb/scrcpy/key_mapping.rs'),
      'utf-8',
    );
    expect(src).toContain('query_screen_size');
    expect(src).toContain('supports_motion_event');
    // 旧版把分辨率写死成 1080x2400，且用 .ok() 吞掉 ADB 会话创建失败
    expect(src).not.toMatch(/\(2400\.0,\s*1080\.0\)/);
    expect(src).not.toContain('AdbTouchSession::new(&config.device_serial).ok()');
  });

  it('应用窗口键盘桥接与失焦释放均已接入', () => {
    const panel = readFileSync(
      resolve(ROOT, 'src/components/AdbTools/ScreenMirrorPanel.tsx'),
      'utf-8',
    );
    expect(panel).toContain('injectKeyEvent');
    expect(panel).toContain('__release_all__');
  });
});

describe('托盘参数与下载取消契约', () => {
  it('create_system_tray 参数名可被前端 camelCase 映射', () => {
    const backend = readFileSync(
      resolve(ROOT, 'src-tauri/src/system_features.rs'),
      'utf-8',
    );
    expect(backend).toContain('menu_items: Option<Vec<TrayMenuItem>>');
    expect(backend).not.toContain('_menu_items: Option<Vec<TrayMenuItem>>');
    expect(backend).toContain('build_tray_menu(&app, menu_items)');
  });

  it('cancel_download 真正中断写盘并删除残件，前端不误报失败', () => {
    const backend = readFileSync(
      resolve(ROOT, 'src-tauri/src/commands/download.rs'),
      'utf-8',
    );
    expect(backend).toContain('is_cancelled(&task_id)');
    expect(backend).toContain('DOWNLOAD_CANCELLED');
    expect(backend).toContain('fs::remove_file(&file_path)');

    const front = readFileSync(
      resolve(ROOT, 'src/services/onlineResourcesService.ts'),
      'utf-8',
    );
    expect(front).toContain("errorMessage.includes('DOWNLOAD_CANCELLED')");
  });
});

describe('Root 镜像修补（Magisk / KernelSU / APatch）契约', () => {
  it('新增的刷入与 KMI 探测命令均已注册', () => {
    const registered = registeredCommands();
    expect(registered.has('root_flash_patched_image')).toBe(true);
    expect(registered.has('root_detect_kmi')).toBe(true);
  });

  it('patch_boot_image_local 支持分区参数化（boot/init_boot/vendor_boot）与 KMI/SuperKey', () => {
    const src = readFileSync(
      resolve(ROOT, 'src-tauri/src/root/patch.rs'),
      'utf-8',
    );
    // 旧实现硬编码 boot.img / new-boot.img，GKI（Android 13+）设备会走错文件
    expect(src).toContain('partition: Option<String>');
    expect(src).toContain('kmi: Option<String>');
    expect(src).toContain('super_key: Option<String>');
    // 工作镜像按分区命名，而非永远 boot.img
    expect(src).toContain('format!("{}.img", partition)');
    expect(src).toContain('format!("new-{}.img", partition)');
    // APatch 仅支持 boot 分区（强制覆盖用户选择）
    expect(src).toContain('eq_ignore_ascii_case("APatch")');
    expect(src).toContain('"boot".to_string()');
  });

  it('ensure_root_patch_tool 可自动安装 ksud 与 kptools/kpimg（PC 原生修补）', () => {
    const src = readFileSync(
      resolve(ROOT, 'src-tauri/src/root/patch.rs'),
      'utf-8',
    );
    expect(src).toContain('"ksud" => ensure_ksud');
    expect(src).toContain('"kptools" | "kpimg-android" => ensure_kptools');
    // 不再把 KSU/APatch 一律判为「需设备端」
    expect(src).not.toContain('该引擎无法在电脑端自动注入内核');
  });

  it('前端引擎选择覆盖四种引擎，并按引擎透传 KMI / SuperKey', () => {
    const panel = readFileSync(
      resolve(ROOT, 'src/components/Root/PatchImagePanel.tsx'),
      'utf-8',
    );
    expect(panel).toContain('"KernelSU"');
    expect(panel).toContain('"SukiSU Ultra"');
    expect(panel).toContain('"APatch"');
    expect(panel).toContain('partition: partition === "auto" ? null : partition');
    expect(panel).toContain('kmi: (patchType === "KernelSU" || patchType === "SukiSU Ultra") ? kmi : null');
    expect(panel).toContain('superKey: patchType === "APatch" ? superKey : null');
  });

  it('刷入命令支持禁用 AVB 校验（高危写 vbmeta）', () => {
    const src = readFileSync(
      resolve(ROOT, 'src-tauri/src/root/workflow.rs'),
      'utf-8',
    );
    expect(src).toContain('disable_avb: Option<bool>');
    expect(src).toContain('"--disable-verification"');
  });
});

describe('标准日志规则与工具下载链路', () => {
  it('AGENTS.md 已固化标准日志规范', () => {
    const doc = readFileSync(resolve(ROOT, 'AGENTS.md'), 'utf-8');
    expect(doc).toContain('6. 标准日志规范');
    expect(doc).toContain('log::{info, warn, error, debug}');
    expect(doc).toContain('logService');
  });

  it('read_plugin_log_files 已注册且读取 tauri-plugin-log 的 LogDir', () => {
    const lib = readFileSync(resolve(ROOT, 'src-tauri/src/lib.rs'), 'utf-8');
    const handler = lib.match(/generate_handler!\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    expect(handler).toContain('read_plugin_log_files');
    const core = readFileSync(resolve(ROOT, 'src-tauri/src/core/log.rs'), 'utf-8');
    expect(core).toContain('pub fn read_plugin_log_files');
    expect(core).toContain('app_log_dir()');
  });

  it('日志页提供载入历史与打开日志目录，并接入统一 logService', () => {
    const panel = readFileSync(
      resolve(ROOT, 'src/components/Others/LogsPanel.tsx'),
      'utf-8',
    );
    expect(panel).toContain('logService.refreshFromBackend(500)');
    expect(panel).toContain('logService.getPluginLogDirectory()');
    expect(panel).toContain('invoke("open_folder", { path: dir })');
    const svc = readFileSync(resolve(ROOT, 'src/services/logService.ts'), 'utf-8');
    expect(svc).toContain('"read_plugin_log_files"');
    expect(svc).toContain('importHistoryLines');
    expect(svc).toContain('parsePluginLogLine');
  });

  it('默认采集级别包含 info，功能日志默认可见', () => {
    const store = readFileSync(resolve(ROOT, 'src/stores/appStore.ts'), 'utf-8');
    expect(store).toContain('logRecordingLevels: ["error", "warning", "info"]');
    const svc = readFileSync(resolve(ROOT, 'src/services/logService.ts'), 'utf-8');
    expect(svc).toContain('["error", "warning", "info"]');
    const settings = readFileSync(
      resolve(ROOT, 'src/components/Settings/OtherSettingsPanel.tsx'),
      'utf-8',
    );
    expect(settings).toContain('["error", "warning", "info"] as LogRecordingLevel[]');
  });

  it('工具下载改走 GitHub API，并支持系统代理与镜像兜底', () => {
    const src = readFileSync(resolve(ROOT, 'src-tauri/src/root/patch.rs'), 'utf-8');
    expect(src).toContain('KSU_LATEST_API');
    expect(src).toContain('KERNELPATCH_LATEST_API');
    expect(src).toContain('https://api.github.com/repos/tiann/KernelSU/releases/latest');
    expect(src).not.toContain('format!("{}/latest", KSU_RELEASES)');
    expect(src).toContain('windows_system_proxy()');
    expect(src).toContain('ProxyEnable');
    expect(src).toContain('https://ghproxy.net/');
    expect(src).toContain('https://gh-proxy.com/');
    expect(src).toContain('fetch_release_json');
    expect(src).toContain('[root-patch]');
    // 空响应体必须视为失败，否则镜像返回 200 但 0 字节会被当成成功
    expect(src).toContain('下载内容异常');
  });

  it('三语 logs_panel 新增按钮文案一致', () => {
    for (const locale of ['zh-CN', 'en-US', 'zh-TW']) {
      const json = JSON.parse(
        readFileSync(resolve(ROOT, `src/i18n/locales/${locale}.json`), 'utf-8'),
      );
      expect(json.logs_panel.load_history).toBeTruthy();
      expect(json.logs_panel.open_log_dir).toBeTruthy();
    }
  });
});
