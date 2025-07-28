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
    this.disableTextSelection();
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

      // F5 - 刷新页面
      if (this.refreshProtectionEnabled && e.key === 'F5') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+R - 刷新页面 (Windows/Linux)
      if (this.refreshProtectionEnabled && e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Cmd+R - 刷新页面 (Mac)
      if (this.refreshProtectionEnabled && e.metaKey && e.key === 'r') {
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
    // 方法1: 检测窗口尺寸变化
    // let windowHeight = window.outerHeight;
    // let windowWidth = window.outerWidth;

    // 方法2: 使用console.log检测
    const devtools = {
      open: false,
      orientation: null as string | null
    };

    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.handleDevToolsDetected();
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // 方法3: 使用debugger检测
    let element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        this.handleDevToolsDetected();
      }
    });

    setInterval(() => {
      console.dir(element);
      console.clear();
    }, 1000);
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
    const body = document.body;
    if (body) {
      body.style.display = 'none';
      
      // 创建警告页面
      const warningDiv = document.createElement('div');
      warningDiv.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #000;
          color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 24px;
          z-index: 999999;
        ">
          <div style="text-align: center;">
            <h1>访问受限</h1>
            <p>检测到开发者工具，页面已被保护</p>
            <p>请关闭开发者工具后刷新页面</p>
          </div>
        </div>
      `;
      document.documentElement.appendChild(warningDiv);
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
   * 销毁实例（用于测试或特殊情况）
   */
  public destroy(): void {
    if (this.devToolsCheckInterval) {
      clearInterval(this.devToolsCheckInterval);
      this.devToolsCheckInterval = null;
    }
    this.protectionEnabled = false;
    this.refreshProtectionEnabled = false;
  }
}

// 导出单例实例
export const securityProtection = SecurityProtection.getInstance();
