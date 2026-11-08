import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Rust 侧 pty.rs 推送的输出事件：chunk 为 base64 编码的原始字节块 */
export interface PtyOutputEvent {
  id: string;
  chunk: string;
}

export interface PtyExitEvent {
  id: string;
}

export interface PtySessionInfo {
  id: string;
  shell: string;
}

export type PtyShell = "powershell" | "cmd";

export interface CreatePtyOptions {
  shell: PtyShell;
  cols?: number;
  rows?: number;
  cwd?: string | null;
}

/** 创建常驻 shell 会话，返回会话 ID */
export function createPtySession(options: CreatePtyOptions): Promise<string> {
  return invoke<string>("pty_create", {
    shell: options.shell,
    cols: options.cols ?? 80,
    rows: options.rows ?? 24,
    cwd: options.cwd ?? null,
  });
}

/** 把 xterm 的按键数据原样写入会话 stdin（含 \x03 等控制字符） */
export function writePtySession(id: string, data: string): Promise<void> {
  return invoke<void>("pty_write", { id, data });
}

export function resizePtySession(id: string, cols: number, rows: number): Promise<void> {
  return invoke<void>("pty_resize", { id, cols, rows });
}

export function closePtySession(id: string): Promise<void> {
  return invoke<void>("pty_close", { id });
}

export function listPtySessions(): Promise<PtySessionInfo[]> {
  return invoke<PtySessionInfo[]>("pty_list");
}

export function onPtyOutput(handler: (event: PtyOutputEvent) => void): Promise<UnlistenFn> {
  return listen<PtyOutputEvent>("pty-output", (event) => handler(event.payload));
}

export function onPtyExit(handler: (event: PtyExitEvent) => void): Promise<UnlistenFn> {
  return listen<PtyExitEvent>("pty-exit", (event) => handler(event.payload));
}

/**
 * base64 -> Uint8Array。
 * 必须按字节交给 xterm：ConPTY 输出流可能在任意位置切断 UTF-8 多字节字符，
 * 在 JS 侧先转成字符串会破坏中文。xterm 内部自带 UTF-8 解码状态机。
 */
export function decodePtyChunk(chunk: string): Uint8Array {
  const binary = atob(chunk);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
