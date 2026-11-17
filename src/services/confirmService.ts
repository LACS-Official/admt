import { create } from "zustand";

/**
 * 应用内确认对话框的全局唯一入口。
 * - 组件层与纯 TS service 层都可通过 confirm() 调用，返回 Promise<boolean>
 * - 实际 UI 由挂载在 App 根部的 ConfirmDialogHost 渲染
 */
export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((result: boolean) => void) | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  settle: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      // 若上一个确认尚未处理，先以“取消”结清，避免 Promise 悬挂
      const pending = get().resolve;
      if (pending) pending(false);
      set({ open: true, options, resolve });
    }),
  settle: (result) => {
    const resolve = get().resolve;
    set({ open: false, options: null, resolve: null });
    if (resolve) resolve(result);
  },
}));

/** 命令式确认：替代 window.confirm，主题一致且长文本可换行。 */
export function confirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;
  return useConfirmStore.getState().request(opts);
}
