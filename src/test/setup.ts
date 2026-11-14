import { vi } from 'vitest';

// 测试运行在 jsdom 中，Tauri IPC 不可用。
// 统一 mock 掉 invoke，防止单元测试误触真实后端调用。
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}));

// jsdom 未实现 matchMedia，Fluent UI 等组件初始化时会读取。
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
