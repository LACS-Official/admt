/**
 * 客户端环境与 Web 专用功能控制管理器
 * 禁用右键菜单、F12 开发者工具、F5 刷新等 Web 浏览器专用功能，保障桌面客户端体验
 */

// 环境检测
export const isDevelopment = (): boolean => {
  return (
    import.meta.env.DEV ||
    import.meta.env.MODE === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    (window.location.protocol === "tauri:" &&
      (window as any).__TAURI_INTERNALS__?.metadata?.debug === true)
  );
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};

/**
 * 禁用浏览器默认右键菜单
 */
export const disableContextMenu = (): void => {
  document.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    { capture: true }
  );
};

/**
 * 禁用 Web 专用快捷键与交互行为（F12、F5、Ctrl+R、Ctrl+Shift+I/J/C、源码查看、打印、保存等）
 */
export const disableWebShortcuts = (): void => {
  document.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      const key = event.key;
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // 1. F12 (打开 DevTools)
      if (key === "F12") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 2. F5 / Ctrl+F5 / Ctrl+R / Ctrl+Shift+R (页面刷新)
      if (key === "F5" || (isCtrl && (key === "r" || key === "R"))) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 3. Ctrl+Shift+I / J / C (审查元素 / 控制台)
      if (isCtrl && isShift && ["I", "i", "J", "j", "C", "c"].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 4. Ctrl+U (查看网页源代码)
      if (isCtrl && !isShift && (key === "u" || key === "U")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 5. Ctrl+S (保存网页为 HTML 文件)
      if (isCtrl && !isShift && (key === "s" || key === "S")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 6. Ctrl+P (打印网页)
      if (isCtrl && !isShift && (key === "p" || key === "P")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 7. Ctrl+O (浏览器打开本地文件)
      if (isCtrl && !isShift && (key === "o" || key === "O")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 8. Ctrl+H (浏览器历史) / Ctrl+J (下载列表) / Ctrl+D (书签)
      if (isCtrl && !isShift && ["h", "H", "j", "J", "d", "D"].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 9. Ctrl+N / Ctrl+T / Ctrl+W (浏览器标签页控制)
      if (isCtrl && !isShift && ["n", "N", "t", "T", "w", "W"].includes(key)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 10. Alt + Left / Right (浏览器后退/前进历史导航)
      if (isAlt && (key === "ArrowLeft" || key === "ArrowRight")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 11. F3 / Ctrl+G (浏览器默认查找)
      if (key === "F3" || (isCtrl && (key === "g" || key === "G"))) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 12. Backspace 键在非编辑元素中误触发历史返回
      if (key === "Backspace") {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement as HTMLElement)?.isContentEditable;
        if (!isInput) {
          event.preventDefault();
        }
      }
    },
    { capture: true }
  );
};

/**
 * 禁用鼠标侧键（前进/后退）导致的应用历史导航
 */
export const disableMouseNavigation = (): void => {
  window.addEventListener(
    "mouseup",
    (event: MouseEvent) => {
      // 鼠标侧键 3(后退) 和 4(前进)
      if (event.button === 3 || event.button === 4) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    { capture: true }
  );
};

/**
 * 禁用随意拖拽文件导致浏览器导航跳转到本地文件的行为
 */
export const disableDragDropNavigation = (): void => {
  window.addEventListener(
    "dragover",
    (event: DragEvent) => {
      event.preventDefault();
    },
    false
  );
  window.addEventListener(
    "drop",
    (event: DragEvent) => {
      // 防止浏览器默认把 drop 的文件作为 url 跳转打开
      event.preventDefault();
    },
    false
  );
};

/**
 * 全局初始化所有桌面端防护与 Web 功能禁用
 */
export const setupWebRestrictions = (): void => {
  disableContextMenu();
  disableWebShortcuts();
  disableMouseNavigation();
  disableDragDropNavigation();
};

export class DevToolsManager {
  private static instance: DevToolsManager;

  private constructor() {
    setupWebRestrictions();
  }

  public static getInstance(): DevToolsManager {
    if (!DevToolsManager.instance) {
      DevToolsManager.instance = new DevToolsManager();
    }
    return DevToolsManager.instance;
  }

  public async openDevTools(): Promise<void> {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_devtools");
    } catch (error) {
      console.warn("开发者工具调用受限:", error);
    }
  }
}

// 自动随模块加载执行桌面防护
export const devToolsManager = DevToolsManager.getInstance();
