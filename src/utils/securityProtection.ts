/**
 * 安全防护工具类
 * 用于禁用开发者工具和保护应用安全
 */

export class SecurityProtection {
  private static instance: SecurityProtection;
  private isDevToolsOpen = false;
  private devToolsCheckInterval: number | null = null;
  private protectionEnabled = true;
  private refreshProtectionEnabled = true;
  private onDevToolsDetected?: () => void;

  private constructor() {
    // 在开发环境下默认禁用保护
    if (import.meta.env.DEV) {
      this.protectionEnabled = false;
      this.refreshProtectionEnabled = false;
      console.log('🔧 开发环境：安全保护已默认禁用');
    }
    this.init();
  }

  public static getInstance(): SecurityProtection {
    if (!SecurityProtection.instance) {
      SecurityProtection.instance = new SecurityProtection();
    }
    return SecurityProtection.instance;
  }

  /**
   * 初始化安全防护
   */
  private init(): void {
    if (!this.protectionEnabled) return;

    this.disableContextMenu();
    this.disableKeyboardShortcuts();
    this.startDevToolsDetection();
    this.disableAllTextSelection();
    this.preventDragAndDrop();
  }

  /**
   * 禁用右键菜单
   */
  private disableContextMenu(): void {
    document.addEventListener('contextmenu', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  /**
   * 禁用键盘快捷键
   */
  private disableKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.protectionEnabled) return;

      // F12 - 开发者工具
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I - 开发者工具 (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd+Option+I - 开发者工具 (Mac)
      if (e.metaKey && e.altKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J - 控制台 (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd+Option+J - 控制台 (Mac)
      if (e.metaKey && e.altKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U - 查看源代码 (Windows/Linux)
      if (e.ctrlKey && e.key === 'U') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd+U - 查看源代码 (Mac)
      if (e.metaKey && e.key === 'U') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C - 元素选择器
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // F5 - 刷新页面（在开发环境或特定情况下允许）
      if (this.refreshProtectionEnabled && e.key === 'F5') {
        // 在开发环境下允许刷新
        if (import.meta.env.DEV) {
          console.log('开发环境下允许F5刷新');
          return;
        }

        // 如果检测到开发者工具打开，允许刷新以恢复页面
        if (this.isDevToolsOpen) {
          console.log('检测到开发者工具，允许F5刷新以恢复页面');
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+R - 刷新页面 (Windows/Linux)
      if (this.refreshProtectionEnabled && e.ctrlKey && e.key === 'r') {
        // 在开发环境下允许刷新
        if (import.meta.env.DEV) {
          console.log('开发环境下允许Ctrl+R刷新');
          return;
        }

        // 如果检测到开发者工具打开，允许刷新以恢复页面
        if (this.isDevToolsOpen) {
          console.log('检测到开发者工具，允许Ctrl+R刷新以恢复页面');
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd+R - 刷新页面 (Mac)
      if (this.refreshProtectionEnabled && e.metaKey && e.key === 'r') {
        // 在开发环境下允许刷新
        if (import.meta.env.DEV) {
          console.log('开发环境下允许Cmd+R刷新');
          return;
        }

        // 如果检测到开发者工具打开，允许刷新以恢复页面
        if (this.isDevToolsOpen) {
          console.log('检测到开发者工具，允许Cmd+R刷新以恢复页面');
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  /**
   * 检测开发者工具是否打开
   */
  private startDevToolsDetection(): void {
    // 在开发环境下禁用检测，避免干扰开发
    if (import.meta.env.DEV) {
      console.log('开发环境下禁用开发者工具检测');
      return;
    }

    // 使用更温和的检测方法，减少误判
    const devtools = {
      open: false,
      orientation: null as string | null
    };

    // 提高阈值，减少误判
    const threshold = 200;
    let consecutiveDetections = 0;
    const requiredDetections = 3; // 需要连续检测到3次才认为是真的打开了开发者工具

    const checkInterval = setInterval(() => {
      if (!this.protectionEnabled) {
        clearInterval(checkInterval);
        return;
      }

      const heightDiff = window.outerHeight - window.innerHeight;
      const widthDiff = window.outerWidth - window.innerWidth;

      if (heightDiff > threshold || widthDiff > threshold) {
        consecutiveDetections++;
        if (consecutiveDetections >= requiredDetections && !devtools.open) {
          devtools.open = true;
          this.handleDevToolsDetected();
        }
      } else {
        consecutiveDetections = 0;
        if (devtools.open) {
          devtools.open = false;
          this.isDevToolsOpen = false;
          // 恢复页面显示
          this.restorePageContent();
        }
      }
    }, 1000); // 降低检测频率

    this.devToolsCheckInterval = checkInterval;
  }

  /**
   * 处理检测到开发者工具打开的情况
   */
  private handleDevToolsDetected(): void {
    if (this.isDevToolsOpen) return;
    
    this.isDevToolsOpen = true;
    
    if (this.onDevToolsDetected) {
      this.onDevToolsDetected();
    } else {
      // 默认处理：隐藏页面内容或跳转
      this.hidePageContent();
    }
  }

  /**
   * 隐藏页面内容
   */
  private hidePageContent(): void {
    // 在生产环境下才隐藏页面
    if (import.meta.env.DEV) {
      console.warn('开发环境下检测到开发者工具，但不隐藏页面');
      return;
    }

    const body = document.body;
    if (body && !document.getElementById('security-warning-overlay')) {
      // 不完全隐藏body，而是添加遮罩层
      const warningDiv = document.createElement('div');
      warningDiv.id = 'security-warning-overlay';
      warningDiv.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 18px;
          z-index: 999999;
          backdrop-filter: blur(10px);
        ">
          <div style="
            text-align: center;
            padding: 40px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          ">
            <div style="font-size: 48px; margin-bottom: 20px;">🛡️</div>
            <h1 style="margin: 0 0 16px 0; font-size: 24px;">安全保护已激活</h1>
            <p style="margin: 0 0 12px 0; opacity: 0.9;">检测到开发者工具已打开</p>
            <p style="margin: 0; opacity: 0.7; font-size: 14px;">关闭开发者工具后页面将自动恢复</p>
          </div>
        </div>
      `;
      document.documentElement.appendChild(warningDiv);
    }
  }

  /**
   * 恢复页面内容
   */
  private restorePageContent(): void {
    const warningOverlay = document.getElementById('security-warning-overlay');
    if (warningOverlay) {
      warningOverlay.remove();
    }
  }

  /**
   * 禁用文本选择
   */
  private disableTextSelection(): void {
    document.addEventListener('selectstart', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        return false;
      }
    });

    document.addEventListener('dragstart', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        return false;
      }
    });
  }

  /**
   * 禁用所有文本选择
   */
  private disableAllTextSelection(): void {
    // 添加全局禁用文本选择的类
    document.documentElement.classList.add('security-protected');

    // 禁用文本选择事件
    document.addEventListener('selectstart', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // 禁用复制事件
    document.addEventListener('copy', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  }

  /**
   * 防止拖拽操作
   */
  private preventDragAndDrop(): void {
    document.addEventListener('dragover', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    document.addEventListener('drop', (e) => {
      if (this.protectionEnabled) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  /**
   * 设置开发者工具检测回调
   */
  public setDevToolsDetectedCallback(callback: () => void): void {
    this.onDevToolsDetected = callback;
  }

  /**
   * 启用/禁用保护
   */
  public setProtectionEnabled(enabled: boolean): void {
    this.protectionEnabled = enabled;

    // 如果禁用保护，恢复页面内容
    if (!enabled) {
      this.restorePageContent();
      this.isDevToolsOpen = false;
    }
  }

  /**
   * 获取保护状态
   */
  public isProtectionEnabled(): boolean {
    return this.protectionEnabled;
  }

  /**
   * 启用/禁用刷新防护
   */
  public setRefreshProtectionEnabled(enabled: boolean): void {
    this.refreshProtectionEnabled = enabled;
  }

  /**
   * 获取刷新防护状态
   */
  public isRefreshProtectionEnabled(): boolean {
    return this.refreshProtectionEnabled;
  }

  /**
   * 检查是否为开发环境
   */
  public isDevelopmentMode(): boolean {
    return import.meta.env.DEV;
  }

  /**
   * 手动恢复页面（用于调试或紧急情况）
   */
  public forceRestorePage(): void {
    this.restorePageContent();
    this.isDevToolsOpen = false;
    console.log('页面已手动恢复');
  }

  /**
   * 销毁实例（用于测试或特殊情况）
   */
  public destroy(): void {
    if (this.devToolsCheckInterval) {
      clearInterval(this.devToolsCheckInterval);
      this.devToolsCheckInterval = null;
    }
    this.restorePageContent();
    this.protectionEnabled = false;
    this.refreshProtectionEnabled = false;
    this.isDevToolsOpen = false;
  }
}

// 导出单例实例
export const securityProtection = SecurityProtection.getInstance();

// 全局错误恢复机制
if (typeof window !== 'undefined') {
  // 添加全局快捷键用于紧急恢复
  window.addEventListener('keydown', (e) => {
    // Ctrl+Alt+Shift+R - 紧急恢复页面
    if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'R') {
      console.log('🚨 紧急恢复：强制恢复页面');
      securityProtection.forceRestorePage();
      securityProtection.setProtectionEnabled(false);
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // 在控制台提供恢复方法
  (window as any).emergencyRestore = () => {
    console.log('🚨 紧急恢复：通过控制台恢复页面');
    securityProtection.forceRestorePage();
    securityProtection.setProtectionEnabled(false);
    return '页面已恢复，安全保护已禁用';
  };

  // 开发环境下的额外提示
  if (import.meta.env.DEV) {
    console.log('🔧 开发提示：');
    console.log('  - 如遇页面白屏，可按 Ctrl+Alt+Shift+R 紧急恢复');
    console.log('  - 或在控制台执行 emergencyRestore() 恢复页面');
    console.log('  - 开发环境下安全保护默认禁用');
  }
}
