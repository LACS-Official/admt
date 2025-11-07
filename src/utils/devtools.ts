/**
 * 开发者工具管理器
 * 提供环境检测和开发者工具控制功能
 */

// 环境检测
export const isDevelopment = (): boolean => {
  // 检查多个开发环境标识
  return (
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
    (typeof process !== 'undefined' && process.env?.TAURI_ENV === 'dev') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'tauri:' && (window as any).__TAURI_INTERNALS__?.metadata?.debug === true
  );
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};

// 开发者工具控制
export class DevToolsManager {
  private static instance: DevToolsManager;
  private isDevMode: boolean;
  private keyListenerAdded: boolean = false;

  private constructor() {
    this.isDevMode = isDevelopment();
    this.setupDevTools();
  }

  public static getInstance(): DevToolsManager {
    if (!DevToolsManager.instance) {
      DevToolsManager.instance = new DevToolsManager();
    }
    return DevToolsManager.instance;
  }

  private setupDevTools(): void {
    if (this.isDevMode) {
      console.log('🔧 开发模式：启用开发者工具');
      this.enableDevTools();
    } else {
      console.log('🔒 生产模式：禁用开发者工具');
      this.disableDevTools();
    }
  }

  private enableDevTools(): void {
    // 添加键盘快捷键监听
    if (!this.keyListenerAdded) {
      this.addKeyboardShortcuts();
      this.keyListenerAdded = true;
    }

    // 启用右键菜单（如果可能）
    this.enableContextMenu();

    // 注释掉开发者工具按钮的添加
    // this.addDevToolsButton();
  }

  private disableDevTools(): void {
    // 禁用右键菜单
    this.disableContextMenu();

    // 禁用F12和其他开发者快捷键
    this.disableKeyboardShortcuts();

    // 注释掉开发者工具按钮的移除（因为不再创建）
    // this.removeDevToolsButton();
  }

  private addKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isDevMode) return;

    // F12 打开开发者工具
    if (event.key === 'F12') {
      event.preventDefault();
      this.openDevTools();
      return;
    }

    // Ctrl+Shift+I 打开开发者工具
    if (event.ctrlKey && event.shiftKey && event.key === 'I') {
      event.preventDefault();
      this.openDevTools();
      return;
    }

    // Ctrl+Shift+J 打开控制台
    if (event.ctrlKey && event.shiftKey && event.key === 'J') {
      event.preventDefault();
      this.openDevTools();
      return;
    }

    // Ctrl+Shift+C 打开元素检查器
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      this.openDevTools();
      return;
    }
  }

  private disableKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // 禁用开发者工具快捷键
      if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(event.key)) ||
        (event.ctrlKey && event.key === 'U') || // 查看源代码
        // 禁用F3和F7以及其他功能键
        (event.key.startsWith('F') && event.key.length >= 2 && event.key.length <= 3)
      ) {
        // 特别处理F3和F7，确保它们被禁用
        if (event.key === 'F3' || event.key === 'F7') {
          event.preventDefault();
          event.stopPropagation();
          console.warn(`🔒 ${event.key}快捷键在生产模式下被禁用`);
          return;
        }
        
        // F5单独处理，因为可能有刷新页面的逻辑
        if (event.key === 'F5') {
          // 这里不处理F5，让其他逻辑处理
          return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        console.warn('🔒 开发者工具在生产模式下被禁用');
      }
    });
  }

  private enableContextMenu(): void {
    // 在开发模式下允许右键菜单
    document.addEventListener('contextmenu', (event) => {
      if (this.isDevMode) {
        // 允许右键菜单
        return true;
      }
    });
  }

  private disableContextMenu(): void {
    // 在生产模式下禁用右键菜单
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      console.warn('🔒 右键菜单在生产模式下被禁用');
    });
  }

  private addDevToolsButton(): void {
    // 创建开发者工具按钮
    const button = document.createElement('button');
    button.id = 'dev-tools-button';
    button.innerHTML = '🔧 DevTools';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: #007acc;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-family: monospace;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', () => {
      this.openDevTools();
    });

    // 添加到页面
    document.body.appendChild(button);
  }

  private removeDevToolsButton(): void {
    const button = document.getElementById('dev-tools-button');
    if (button) {
      button.remove();
    }
  }

  public async openDevTools(): Promise<void> {
    if (!this.isDevMode) {
      console.warn('🔒 开发者工具在生产模式下不可用');
      return;
    }

    try {
      // 尝试使用 Tauri API 打开开发者工具
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_devtools');
      console.log('🔧 开发者工具已打开');
    } catch (error) {
      console.error('❌ 无法打开开发者工具:', error);
      
      // 备用方案：尝试使用 window.open
      try {
        const devWindow = window.open('', '_blank');
        if (devWindow) {
          devWindow.document.write(`
            <html>
              <head><title>开发者控制台</title></head>
              <body>
                <h1>开发者控制台</h1>
                <p>请使用浏览器的开发者工具进行调试</p>
                <script>console.log('开发者控制台已打开');</script>
              </body>
            </html>
          `);
        }
      } catch (fallbackError) {
        console.error('❌ 备用方案也失败了:', fallbackError);
      }
    }
  }

  public logEnvironmentInfo(): void {
    console.group('🔍 环境信息');
    console.log('开发模式:', this.isDevMode);
    console.log('NODE_ENV:', typeof process !== 'undefined' ? process.env?.NODE_ENV : 'undefined');
    console.log('TAURI_ENV:', typeof process !== 'undefined' ? process.env?.TAURI_ENV : 'undefined');
    console.log('Location:', window.location.href);
    console.log('User Agent:', navigator.userAgent);
    console.log('Tauri 元数据:', (window as any).__TAURI_INTERNALS__?.metadata);
    console.groupEnd();
  }

  public enableDebugMode(): void {
    // 启用详细日志
    (window as any).DEBUG = true;
    
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
      console.error('🚨 全局错误:', event.error);
      console.error('文件:', event.filename);
      console.error('行号:', event.lineno);
      console.error('列号:', event.colno);
    });

    // 添加未处理的 Promise 拒绝处理
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 未处理的 Promise 拒绝:', event.reason);
    });

    console.log('🔧 调试模式已启用');
  }
}

// 导出单例实例
export const devToolsManager = DevToolsManager.getInstance();
