import React, { useEffect, useRef, useState } from "react";
import { Button, Input, Tooltip, makeStyles, mergeClasses } from "@fluentui/react-components";
import {
  ArrowClockwise20Regular,
  Checkmark20Regular,
  ChevronDown16Regular,
  ChevronUp16Regular,
  ClipboardPaste20Regular,
  Copy20Regular,
  Delete20Regular,
  Dismiss16Regular,
  Search20Regular,
  WindowConsole20Regular,
} from "@fluentui/react-icons";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon, type ISearchOptions } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import { useThemeStore } from "../../stores/themeStore";
import {
  getCommandSuggestions,
  type CommandMode,
  type CommandSuggestion,
} from "../../utils/commandSuggestions";
import {
  closePtySession,
  createPtySession,
  decodePtyChunk,
  onPtyExit,
  onPtyOutput,
  resizePtySession,
  writePtySession,
  type PtyShell,
} from "../../services/ptyService";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    minHeight: 0,
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "6px 12px",
    flexShrink: 0,
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  status: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    whiteSpace: "nowrap",
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  shellName: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  iconBtn: {
    width: "28px",
    minWidth: "28px",
    height: "26px",
    padding: 0,
    borderRadius: "9999px",
  },
  iconBtnActive: {
    backgroundColor: "var(--colorSubtleBackgroundSelected)",
    color: "var(--colorBrandForeground1)",
  },
  pill: {
    height: "26px",
    padding: "0 12px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    flexShrink: 0,
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  searchInput: {
    width: "240px",
    maxWidth: "40%",
    flexShrink: 0,
  },
  matchText: {
    minWidth: "72px",
    fontSize: "11px",
    color: "var(--colorNeutralForeground2)",
    whiteSpace: "nowrap",
  },
  optionBtn: {
    height: "24px",
    minWidth: "28px",
    padding: "0 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "600",
  },
  optionBtnActive: {
    backgroundColor: "var(--colorSubtleBackgroundSelected)",
    color: "var(--colorBrandForeground1)",
  },
  screenWrapper: {
    position: "relative",
    flex: "1 1 0",
    minHeight: 0,
    overflow: "hidden",
  },
  suggestBar: {
    position: "absolute",
    top: "10px",
    left: "12px",
    right: "12px",
    zIndex: 6,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "var(--shadow8)",
  },
  suggestLabel: {
    flexShrink: 0,
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  suggestItems: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: "1 1 0",
    minWidth: 0,
    overflowX: "auto",
  },
  suggestChip: {
    flexShrink: 0,
    height: "24px",
    padding: "0 10px",
    borderRadius: "9999px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground1)",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "11px",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  suggestChipActive: {
    backgroundColor: "var(--colorSubtleBackgroundSelected)",
    color: "var(--colorBrandForeground1)",
  },
  suggestHint: {
    flexShrink: 0,
    fontSize: "10px",
    color: "var(--colorNeutralForeground3)",
    whiteSpace: "nowrap",
  },
  host: {
    height: "100%",
    width: "100%",
    padding: "10px 12px",
    overflow: "hidden",
  },
  copySelectionBtn: {
    position: "absolute",
    top: "10px",
    right: "18px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "26px",
    padding: "0 12px",
    borderRadius: "9999px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    boxShadow: "var(--shadow8)",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  contextMenu: {
    position: "fixed",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    width: "172px",
    padding: "6px",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "var(--shadow16)",
  },
  menuItem: {
    justifyContent: "flex-start",
    height: "30px",
    borderRadius: "9999px",
    fontSize: "12px",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "5px 14px",
    flexShrink: 0,
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  overlay: {
    flex: "1 1 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "24px",
    textAlign: "center",
    minHeight: 0,
  },
  overlayTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  overlayText: {
    maxWidth: "480px",
    fontSize: "12px",
    lineHeight: "1.6",
    color: "var(--colorNeutralForeground2)",
    wordBreak: "break-word",
  },
});

/** 与全局深浅主题对齐的 xterm 配色 */
function buildTheme(dark: boolean) {
  return dark
    ? {
        background: "#161617",
        foreground: "#e8e8ed",
        cursor: "#2997ff",
        cursorAccent: "#161617",
        selectionBackground: "rgba(41, 151, 255, 0.28)",
        black: "#1f1f22",
        red: "#f07178",
        green: "#5ad19a",
        yellow: "#e5c07b",
        blue: "#2997ff",
        magenta: "#c792ea",
        cyan: "#56b6c2",
        white: "#e8e8ed",
        brightBlack: "#6b6b73",
        brightRed: "#ff8b93",
        brightGreen: "#7ee0b4",
        brightYellow: "#f2d398",
        brightBlue: "#6cb6ff",
        brightMagenta: "#d9b0f2",
        brightCyan: "#7fd0d9",
        brightWhite: "#ffffff",
      }
    : {
        background: "#ffffff",
        foreground: "#1f1f22",
        cursor: "#0071e3",
        cursorAccent: "#ffffff",
        selectionBackground: "rgba(0, 113, 227, 0.16)",
        black: "#1f1f22",
        red: "#c0392b",
        green: "#1a7f4b",
        yellow: "#9a6700",
        blue: "#0071e3",
        magenta: "#8b5cf6",
        cyan: "#0e7490",
        white: "#e8e8ed",
        brightBlack: "#6b6b73",
        brightRed: "#e05252",
        brightGreen: "#2aa36b",
        brightYellow: "#c08a1e",
        brightBlue: "#3b9bff",
        brightMagenta: "#a97cf0",
        brightCyan: "#17a2b8",
        brightWhite: "#f5f5f7",
      };
}

/**
 * 查找高亮色。装饰背景走 DOM 样式，用半透明琥珀色保证文字始终可读；
 * 滚动条标尺走 canvas，只接受 #RRGGBB，无法直接读取 CSS 变量。
 */
function buildSearchDecorations(dark: boolean) {
  return dark
    ? {
        matchBackground: "rgba(240, 199, 90, 0.22)",
        matchBorder: "#6b571a",
        matchOverviewRuler: "#c9a227",
        activeMatchBackground: "rgba(240, 199, 90, 0.42)",
        activeMatchBorder: "#f0c75a",
        activeMatchColorOverviewRuler: "#f0c75a",
      }
    : {
        matchBackground: "rgba(224, 168, 24, 0.24)",
        matchBorder: "#e8c95e",
        matchOverviewRuler: "#e8c95e",
        activeMatchBackground: "rgba(224, 152, 16, 0.48)",
        activeMatchBorder: "#b8860b",
        activeMatchColorOverviewRuler: "#b8860b",
      };
}

/** 把终端缓冲区（含回滚区）还原成纯文本，自动合并自动换行产生的续行 */
function collectBufferText(term: Terminal): string {
  const buffer = term.buffer.active;
  const lines: string[] = [];
  for (let i = 0; i < buffer.length; i += 1) {
    const line = buffer.getLine(i);
    if (!line) continue;
    const text = line.translateToString(true);
    if (line.isWrapped && lines.length > 0) {
      lines[lines.length - 1] += text;
    } else {
      lines.push(text);
    }
  }
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

/** 是否含控制字符（换行、方向键序列等），避免把多行粘贴当成一行输入 */
function hasControlChar(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) < 32) return true;
  }
  return false;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // WebView 拒绝异步剪贴板时退回传统复制路径
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

type SessionStatus = "starting" | "ready" | "exited" | "error";

const STATUS_TEXT: Record<SessionStatus, string> = {
  starting: "正在连接",
  ready: "已连接",
  exited: "会话已结束",
  error: "启动失败",
};

const STATUS_COLOR: Record<SessionStatus, string> = {
  starting: "#f59e0b",
  ready: "#10b981",
  exited: "#9ca3af",
  error: "#ef4444",
};

interface TerminalActions {
  toggleSearch: () => void;
  closeSearch: () => void;
  openSearch: () => void;
  findNext: () => void;
  findPrevious: () => void;
  isSearchOpen: () => boolean;
  copy: () => void;
  paste: () => void;
  clear: () => void;
  acceptSuggestion: (reverse?: boolean, index?: number) => boolean;
}

const NOOP_BOOLEAN = () => false;

const NOOP_ACTIONS: TerminalActions = {
  toggleSearch: () => undefined,
  closeSearch: () => undefined,
  openSearch: () => undefined,
  findNext: () => undefined,
  findPrevious: () => undefined,
  isSearchOpen: () => false,
  copy: () => undefined,
  paste: () => undefined,
  clear: () => undefined,
  acceptSuggestion: NOOP_BOOLEAN,
};

export interface InteractiveTerminalProps {
  shell: PtyShell;
  /** 联想词库对应的命令行模式 */
  mode?: CommandMode;
  /** 该模式的历史指令，用于自动联想 */
  history?: string[];
  /** 快捷命令库里的完整命令 */
  libraryCommands?: string[];
  /** 用户在终端里回车执行命令后回写历史 */
  onCommandExecuted?: (command: string) => void;
  /** 由快捷命令库 / AI 注入，会话就绪后自动送入终端执行 */
  initialCommand?: string | null;
  onInitialCommandSent?: () => void;
  /** PTY 不可用时回退到一次性指令模式 */
  onFallback?: () => void;
}

/** 供外层命令面板的快捷按钮直接调用交互终端能力 */
export interface InteractiveTerminalHandle {
  toggleSearch: () => void;
  copy: () => void;
  clear: () => void;
}

export const InteractiveTerminal = React.forwardRef<
  InteractiveTerminalHandle,
  InteractiveTerminalProps
>(function InteractiveTerminal(
  {
    shell,
    mode = "powershell",
    history = [],
    libraryCommands = [],
    onCommandExecuted,
    initialCommand,
    onInitialCommandSent,
    onFallback,
  },
  ref
) {
  const styles = useStyles();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const darkRef = useRef(isDarkMode);
  darkRef.current = isDarkMode;

  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const sessionRef = useRef<string | null>(null);
  const searchRef = useRef<SearchAddon | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const copiedTimerRef = useRef<number | null>(null);
  // 查找插件会用「选中」标记当前匹配项，单独记录用户手动选中的文本，避免复制错内容
  const userSelectionRef = useRef("");
  const selectingRef = useRef(false);
  // xterm 的事件回调只在建会话时注册一次，通过 ref 始终拿到最新的状态与处理函数
  const actionsRef = useRef<TerminalActions>(NOOP_ACTIONS);

  // 输入联想：跟踪当前行的键入，Tab 采纳时把剩余字符补发给 PTY
  const modeRef = useRef<CommandMode>(mode);
  const historyRef = useRef(history);
  const libraryRef = useRef(libraryCommands);
  const onCommandExecutedRef = useRef(onCommandExecuted);
  modeRef.current = mode;
  historyRef.current = history;
  libraryRef.current = libraryCommands;
  onCommandExecutedRef.current = onCommandExecuted;
  const lineBufferRef = useRef("");
  const cycleBaseRef = useRef<string | null>(null);
  const cycleRef = useRef(-1);
  const suggestionsRef = useRef<CommandSuggestion[]>([]);
  const suggestOpenRef = useRef(false);

  const [status, setStatus] = useState<SessionStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  const [shellLabel, setShellLabel] = useState<string>("");
  const [generation, setGeneration] = useState(0);

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [invalidRegex, setInvalidRegex] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [cycleIndex, setCycleIndex] = useState(-1);
  suggestionsRef.current = suggestions;
  suggestOpenRef.current = suggestOpen;

  // 主题变化只更新配色，不重建会话（避免丢失工作目录、环境变量与历史）
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = buildTheme(isDarkMode);
    }
    const host = hostRef.current;
    if (host) {
      host.style.backgroundColor = isDarkMode ? "#161617" : "#ffffff";
    }
  }, [isDarkMode]);

  // shell 或重启计数变化才重建会话
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let frame = 0;
    let mouseUpTimer = 0;
    const unlisteners: Array<() => void> = [];
    // 会话创建期间可能已有输出推送，先按 id 缓存，拿到 id 后补写，避免丢失启动横幅与首个提示符
    const pending = new Map<string, Uint8Array[]>();

    setShowSearch(false);
    setSearchTerm("");
    setMatchCount(0);
    setMatchIndex(0);
    setInvalidRegex(false);
    setHasSelection(false);
    userSelectionRef.current = "";
    selectingRef.current = false;
    lineBufferRef.current = "";
    cycleBaseRef.current = null;
    cycleRef.current = -1;
    setSuggestions([]);
    setSuggestOpen(false);
    setCycleIndex(-1);

    const term = new Terminal({
      fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.35,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 8000,
      theme: buildTheme(darkRef.current),
      allowTransparency: false,
    });
    const fit = new FitAddon();
    const search = new SearchAddon();
    term.loadAddon(fit);
    term.loadAddon(search);
    term.open(host);
    termRef.current = term;
    searchRef.current = search;
    try {
      fit.fit();
    } catch {
      // 容器尚未布局完成时忽略，ResizeObserver 会在首帧后补齐
    }
    term.focus();

    /**
     * 只跟踪「当前输入行」用于联想，不接管终端编辑。
     * 方向键 / 历史召回 / Tab 由 shell 自己处理，此时内容无法可靠还原，直接清空跟踪。
     */
    const trackInput = (data: string) => {
      let next = lineBufferRef.current;
      let executed = "";
      const resetCycle = () => {
        cycleBaseRef.current = null;
        cycleRef.current = -1;
        setCycleIndex(-1);
      };

      if (data === "\r" || data === "\n") {
        executed = next.trim();
        next = "";
        resetCycle();
      } else if (data === "\x7f" || data === "\b") {
        next = next.slice(0, -1);
        resetCycle();
      } else if (data === "\x03" || data === "\x15") {
        next = "";
        resetCycle();
      } else if (data === "\t" || data.startsWith("\x1b")) {
        next = "";
        resetCycle();
      } else if (!hasControlChar(data)) {
        next += data;
        resetCycle();
      }
      lineBufferRef.current = next;
      if (executed) onCommandExecutedRef.current?.(executed);

      if (!next.trim()) {
        setSuggestions([]);
        setSuggestOpen(false);
        return;
      }
      const list = getCommandSuggestions(
        modeRef.current,
        next,
        historyRef.current,
        libraryRef.current,
        6
      ).filter((item) => item.value.toLowerCase().startsWith(next.toLowerCase()));
      setSuggestions(list);
      setSuggestOpen(list.length > 0);
    };

    term.onData((data) => {
      const id = sessionRef.current;
      if (id) void writePtySession(id, data);
      trackInput(data);
    });

    term.onResize(({ cols, rows }) => {
      const id = sessionRef.current;
      if (id) void resizePtySession(id, cols, rows);
    });

    const selectionSub = term.onSelectionChange(() => {
      if (!selectingRef.current) return;
      userSelectionRef.current = term.getSelection();
      setHasSelection(!!userSelectionRef.current);
    });
    const resultsSub = search.onDidChangeResults(({ resultIndex, resultCount }) => {
      setMatchCount(resultCount);
      setMatchIndex(resultCount > 0 && resultIndex >= 0 ? resultIndex + 1 : 0);
    });

    // Ctrl+Shift+C / V：复制选中内容（无选中则复制全部输出）、粘贴系统剪贴板
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      if (event.type !== "keydown") return true;
      if (event.key === "Tab" && !event.ctrlKey && !event.altKey) {
        // 有联想候选时由应用层补齐；否则交回 shell 原生 Tab 补齐
        if (actionsRef.current.acceptSuggestion(event.shiftKey)) return false;
        return true;
      }
      if (!event.ctrlKey || !event.shiftKey) return true;
      const key = event.key.toLowerCase();
      if (key === "c") {
        void actionsRef.current.copy();
        return false;
      }
      if (key === "v") {
        void actionsRef.current.paste();
        return false;
      }
      return true;
    });

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      // 右键不是拖选，保留此前手动选中的文本供菜单里的「复制」使用
      selectingRef.current = false;
      setMenu({
        x: Math.max(8, Math.min(event.clientX, window.innerWidth - 188)),
        y: Math.max(8, Math.min(event.clientY, window.innerHeight - 168)),
      });
    };
    term.element?.addEventListener("contextmenu", onContextMenu);

    const onMouseDown = () => {
      selectingRef.current = true;
    };
    const onMouseUp = () => {
      if (!selectingRef.current) return;
      window.clearTimeout(mouseUpTimer);
      mouseUpTimer = window.setTimeout(() => {
        if (cancelled) return;
        userSelectionRef.current = term.getSelection();
        setHasSelection(!!userSelectionRef.current);
        selectingRef.current = false;
      }, 0);
    };
    term.element?.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        try {
          fit.fit();
        } catch {
          // 尺寸为 0 时跳过
        }
      });
    });
    observer.observe(host);

    const start = async () => {
      try {
        const unOutput = await onPtyOutput(({ id, chunk }) => {
          const bytes = decodePtyChunk(chunk);
          const current = sessionRef.current;
          if (current && id === current) {
            term.write(bytes);
          } else if (!current) {
            const list = pending.get(id) ?? [];
            list.push(bytes);
            pending.set(id, list);
          }
        });
        const unExit = await onPtyExit(({ id }) => {
          if (id === sessionRef.current) {
            sessionRef.current = null;
            setStatus("exited");
            void closePtySession(id);
          }
        });
        if (cancelled) {
          unOutput();
          unExit();
          return;
        }
        unlisteners.push(unOutput, unExit);

        const dims = fit.proposeDimensions();
        const id = await createPtySession({
          shell,
          cols: dims?.cols ?? 80,
          rows: dims?.rows ?? 24,
        });
        if (cancelled) {
          void closePtySession(id);
          return;
        }

        sessionRef.current = id;
        for (const bytes of pending.get(id) ?? []) {
          term.write(bytes);
        }
        pending.delete(id);
        setShellLabel(shell === "cmd" ? "cmd.exe" : "PowerShell");
        setError(null);
        setStatus("ready");

        const latest = fit.proposeDimensions();
        if (latest) void resizePtySession(id, latest.cols, latest.rows);
        term.focus();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    };
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(mouseUpTimer);
      observer.disconnect();
      term.element?.removeEventListener("contextmenu", onContextMenu);
      term.element?.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      selectionSub.dispose();
      resultsSub.dispose();
      unlisteners.forEach((fn) => fn());
      const id = sessionRef.current;
      sessionRef.current = null;
      if (id) void closePtySession(id);
      searchRef.current = null;
      search.dispose();
      term.dispose();
      termRef.current = null;
    };
  }, [shell, generation]);

  // 全局快捷键：查找与逐项跳转（capture 阶段拦截，避免把组合键送进 shell）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        event.stopPropagation();
        actionsRef.current.toggleSearch();
        return;
      }
      if (event.key === "F3" && actionsRef.current.isSearchOpen()) {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) actionsRef.current.findPrevious();
        else actionsRef.current.findNext();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("mousedown", close);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    },
    []
  );

  // 外部注入的命令在会话就绪后送入
  useEffect(() => {
    if (!initialCommand || status !== "ready") return;
    const id = sessionRef.current;
    if (!id) return;
    void writePtySession(id, `${initialCommand}\r`);
    termRef.current?.focus();
    onInitialCommandSent?.();
  }, [initialCommand, status, onInitialCommandSent]);

  const flashCopied = () => {
    setCopied(true);
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1600);
  };

  const handleCopy = async () => {
    const term = termRef.current;
    if (!term) return;
    // 只认用户手动选中的文本；查找匹配产生的临时选中不参与复制
    const text = userSelectionRef.current || collectBufferText(term);
    if (!text) return;
    if (await writeClipboard(text)) flashCopied();
    setMenu(null);
    term.focus();
  };

  const handlePaste = async () => {
    setMenu(null);
    try {
      const text = await navigator.clipboard.readText();
      const id = sessionRef.current;
      if (text && id) {
        await writePtySession(id, text);
        termRef.current?.focus();
      }
    } catch {
      // 剪贴板不可用时忽略，与原版终端一致
    }
  };

  const makeSearchOptions = (override?: {
    caseSensitive: boolean;
    regex: boolean;
  }): ISearchOptions => ({
    regex: override?.regex ?? useRegex,
    caseSensitive: override?.caseSensitive ?? caseSensitive,
    incremental: true,
    decorations: buildSearchDecorations(darkRef.current),
  });

  const runFind = (
    direction: "next" | "previous",
    value: string,
    override?: { caseSensitive: boolean; regex: boolean }
  ) => {
    const addon = searchRef.current;
    if (!addon) return;
    if (!value) {
      addon.clearDecorations();
      setMatchCount(0);
      setMatchIndex(0);
      setInvalidRegex(false);
      return;
    }
    const options = makeSearchOptions(override);
    if (options.regex) {
      try {
        new RegExp(value, options.caseSensitive ? "g" : "gi");
      } catch {
        addon.clearDecorations();
        setInvalidRegex(true);
        setMatchCount(0);
        setMatchIndex(0);
        return;
      }
    }
    setInvalidRegex(false);
    if (direction === "next") addon.findNext(value, options);
    else addon.findPrevious(value, options);
  };

  const openSearch = () => {
    setMenu(null);
    const selected = userSelectionRef.current.trim();
    // 选中一段文字后打开查找，自动带入该文字（与系统终端一致）
    if (selected && !selected.includes("\n")) {
      setSearchTerm(selected);
      runFind("next", selected);
    }
    userSelectionRef.current = "";
    setHasSelection(false);
    setShowSearch(true);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchTerm("");
    setMatchCount(0);
    setMatchIndex(0);
    setInvalidRegex(false);
    setHasSelection(false);
    userSelectionRef.current = "";
    searchRef.current?.clearDecorations();
    termRef.current?.focus();
  };

  const toggleSearch = () => {
    if (showSearch) closeSearch();
    else openSearch();
  };

  const findNext = () => runFind("next", searchTerm);
  const findPrevious = () => runFind("previous", searchTerm);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    runFind("next", value);
  };

  const toggleCase = () => {
    const next = !caseSensitive;
    setCaseSensitive(next);
    runFind("next", searchTerm, { caseSensitive: next, regex: useRegex });
  };

  const toggleRegex = () => {
    const next = !useRegex;
    setUseRegex(next);
    runFind("next", searchTerm, { caseSensitive, regex: next });
  };

  const restart = () => {
    setStatus("starting");
    setError(null);
    setMenu(null);
    setGeneration((value) => value + 1);
  };

  const clearScreen = () => {
    const term = termRef.current;
    if (!term) return;
    term.clear();
    searchRef.current?.clearDecorations();
    userSelectionRef.current = "";
    setHasSelection(false);
    if (showSearch && searchTerm) runFind("next", searchTerm);
    setMenu(null);
    term.focus();
  };

  const selectAll = () => {
    const term = termRef.current;
    if (!term) return;
    term.selectAll();
    userSelectionRef.current = term.getSelection();
    setHasSelection(!!userSelectionRef.current);
    setMenu(null);
  };

  const closeSuggestions = () => {
    setSuggestOpen(false);
    setCycleIndex(-1);
    cycleBaseRef.current = null;
    cycleRef.current = -1;
    termRef.current?.focus();
  };

  /** 把候选补齐到 PTY：先删掉上次补的部分，再发送候选剩余字符，shell 状态保持同步 */
  const acceptSuggestion = (reverse = false, index?: number): boolean => {
    const list = suggestionsRef.current;
    if (!suggestOpenRef.current || list.length === 0) return false;
    const id = sessionRef.current;
    if (!id) return false;

    const base = cycleBaseRef.current ?? lineBufferRef.current;
    const current = lineBufferRef.current;
    let pick: number;
    if (typeof index === "number") {
      pick = index;
    } else if (cycleBaseRef.current === null) {
      pick = reverse ? list.length - 1 : 0;
    } else {
      pick = reverse
        ? cycleRef.current <= 0
          ? list.length - 1
          : cycleRef.current - 1
        : (cycleRef.current + 1) % list.length;
    }

    const candidate = list[pick];
    if (!candidate || !candidate.value.toLowerCase().startsWith(base.toLowerCase())) return false;

    cycleBaseRef.current = base;
    const backspaces = "\x7f".repeat(Math.max(0, current.length - base.length));
    const suffix = candidate.value.slice(base.length);
    if (backspaces || suffix) void writePtySession(id, backspaces + suffix);
    lineBufferRef.current = candidate.value;
    cycleRef.current = pick;
    setCycleIndex(pick);
    setSuggestOpen(true);
    return true;
  };

  // 每次渲染刷新，保证 xterm / 全局快捷键回调读到最新状态
  actionsRef.current = {
    toggleSearch,
    closeSearch,
    openSearch,
    findNext,
    findPrevious,
    isSearchOpen: () => showSearch,
    copy: () => void handleCopy(),
    paste: () => void handlePaste(),
    clear: () => clearScreen(),
    acceptSuggestion,
  };

  React.useImperativeHandle(
    ref,
    () => ({
      toggleSearch: () => actionsRef.current.toggleSearch(),
      copy: () => actionsRef.current.copy(),
      clear: () => actionsRef.current.clear(),
    }),
    []
  );

  const matchLabel = invalidRegex
    ? "表达式无效"
    : !searchTerm
      ? ""
      : matchCount > 0
        ? `${matchIndex} / ${matchCount}`
        : "无匹配项";

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.status}>
          <span className={styles.dot} style={{ backgroundColor: STATUS_COLOR[status] }} />
          <span>{STATUS_TEXT[status]}</span>
          <span className={styles.shellName}>{shellLabel || shell}</span>
        </div>

        <div className={styles.actions}>
          <Tooltip content={showSearch ? "收起查找" : "查找 (Ctrl+Shift+F)"} relationship="label">
            <Button
              appearance="subtle"
              size="small"
              aria-label="查找"
              icon={<Search20Regular />}
              className={mergeClasses(styles.iconBtn, showSearch && styles.iconBtnActive)}
              onClick={toggleSearch}
            />
          </Tooltip>
          <Tooltip
            content={copied ? "已复制" : hasSelection ? "复制选中内容" : "复制全部输出"}
            relationship="label"
          >
            <Button
              appearance="subtle"
              size="small"
              aria-label="复制"
              icon={copied ? <Checkmark20Regular /> : <Copy20Regular />}
              className={styles.iconBtn}
              onClick={() => void handleCopy()}
            />
          </Tooltip>
          <Tooltip content="粘贴 (Ctrl+Shift+V)" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              aria-label="粘贴"
              icon={<ClipboardPaste20Regular />}
              className={styles.iconBtn}
              onClick={() => void handlePaste()}
            />
          </Tooltip>
          <Tooltip content="清空屏幕显示" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<Delete20Regular />}
              className={styles.pill}
              onClick={clearScreen}
            >
              清屏
            </Button>
          </Tooltip>
          <Tooltip content="重启会话" relationship="label">
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowClockwise20Regular />}
              className={styles.pill}
              onClick={restart}
            >
              重启
            </Button>
          </Tooltip>
          {onFallback && (
            <Tooltip content="切换到一次性指令模式" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                icon={<WindowConsole20Regular />}
                className={styles.pill}
                onClick={onFallback}
              >
                兼容模式
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {showSearch && (
        <div className={styles.searchBar}>
          <Input
            ref={searchInputRef}
            size="small"
            className={styles.searchInput}
            placeholder="在当前终端中查找"
            value={searchTerm}
            onChange={(_, data) => handleSearchChange(data.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (event.shiftKey) findPrevious();
                else findNext();
              } else if (event.key === "Escape") {
                event.preventDefault();
                closeSearch();
              } else if (event.key === "F3") {
                event.preventDefault();
                if (event.shiftKey) findPrevious();
                else findNext();
              }
            }}
            contentBefore={<Search20Regular />}
            contentAfter={
              searchTerm ? (
                <Button
                  appearance="transparent"
                  size="small"
                  aria-label="清空查找内容"
                  icon={<Dismiss16Regular />}
                  onClick={() => handleSearchChange("")}
                  style={{ minWidth: "20px", padding: 0 }}
                />
              ) : undefined
            }
          />
          <span className={styles.matchText}>{matchLabel}</span>
          <div className={styles.actions}>
            <Tooltip content="区分大小写" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                className={mergeClasses(styles.optionBtn, caseSensitive && styles.optionBtnActive)}
                onClick={toggleCase}
              >
                Aa
              </Button>
            </Tooltip>
            <Tooltip content="正则表达式" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                className={mergeClasses(styles.optionBtn, useRegex && styles.optionBtnActive)}
                onClick={toggleRegex}
              >
                .*
              </Button>
            </Tooltip>
            <Tooltip content="上一个 (Shift+Enter)" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                aria-label="上一个匹配"
                icon={<ChevronUp16Regular />}
                className={styles.iconBtn}
                onClick={findPrevious}
                disabled={!searchTerm || matchCount === 0}
              />
            </Tooltip>
            <Tooltip content="下一个 (Enter)" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                aria-label="下一个匹配"
                icon={<ChevronDown16Regular />}
                className={styles.iconBtn}
                onClick={findNext}
                disabled={!searchTerm || matchCount === 0}
              />
            </Tooltip>
            <Tooltip content="关闭查找 (Esc)" relationship="label">
              <Button
                appearance="subtle"
                size="small"
                aria-label="关闭查找"
                icon={<Dismiss16Regular />}
                className={styles.iconBtn}
                onClick={closeSearch}
              />
            </Tooltip>
          </div>
        </div>
      )}

      {status === "error" ? (
        <div className={styles.overlay}>
          <span className={styles.overlayTitle}>无法启动交互终端</span>
          <span className={styles.overlayText}>{error}</span>
          <div className={styles.actions}>
            <Button appearance="primary" className={styles.pill} onClick={restart}>
              重试
            </Button>
            {onFallback && (
              <Button appearance="subtle" className={styles.pill} onClick={onFallback}>
                使用兼容模式
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.screenWrapper}>
          <div
            ref={hostRef}
            className={styles.host}
            style={{ backgroundColor: isDarkMode ? "#161617" : "#ffffff" }}
          />
          {suggestOpen && suggestions.length > 0 && (
            <div className={styles.suggestBar}>
              <span className={styles.suggestLabel}>联想</span>
              <div className={styles.suggestItems}>
                {suggestions.map((item, index) => (
                  <button
                    key={item.value}
                    className={mergeClasses(
                      styles.suggestChip,
                      cycleIndex === index && styles.suggestChipActive
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      if (acceptSuggestion(false, index)) closeSuggestions();
                    }}
                  >
                    {item.value}
                  </button>
                ))}
              </div>
              <span className={styles.suggestHint}>Tab 补齐 · ↑ 历史</span>
              <Button
                appearance="subtle"
                size="small"
                aria-label="关闭联想"
                icon={<Dismiss16Regular />}
                className={styles.iconBtn}
                onMouseDown={(event) => event.preventDefault()}
                onClick={closeSuggestions}
              />
            </div>
          )}
          {hasSelection && (
            <button
              className={styles.copySelectionBtn}
              style={{ top: suggestOpen && suggestions.length > 0 ? "58px" : "10px" }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void handleCopy()}
            >
              {copied ? <Checkmark20Regular /> : <Copy20Regular />}
              {copied ? "已复制" : "复制"}
            </button>
          )}
        </div>
      )}

      {menu && (
        <div
          className={styles.contextMenu}
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Button
            appearance="subtle"
            size="small"
            icon={<Copy20Regular />}
            className={styles.menuItem}
            onClick={() => void handleCopy()}
          >
            {hasSelection ? "复制选中内容" : "复制全部输出"}
          </Button>
          <Button
            appearance="subtle"
            size="small"
            icon={<ClipboardPaste20Regular />}
            className={styles.menuItem}
            onClick={() => void handlePaste()}
          >
            粘贴
          </Button>
          <Button
            appearance="subtle"
            size="small"
            icon={<Checkmark20Regular />}
            className={styles.menuItem}
            onClick={selectAll}
          >
            全选
          </Button>
          <Button
            appearance="subtle"
            size="small"
            icon={<Search20Regular />}
            className={styles.menuItem}
            onClick={openSearch}
          >
            查找
          </Button>
          <Button
            appearance="subtle"
            size="small"
            icon={<Delete20Regular />}
            className={styles.menuItem}
            onClick={clearScreen}
          >
            清屏
          </Button>
        </div>
      )}

      <div className={styles.footer}>
        <span>Tab 补齐 · ↑ 历史 · 自动联想 · Ctrl+Shift+C 复制 · Ctrl+Shift+V 粘贴 · Ctrl+Shift+F 查找</span>
        <span>{status === "exited" ? "点击「重启」开启新会话" : "右键可复制 / 粘贴 / 查找"}</span>
      </div>
    </div>
  );
});

export default InteractiveTerminal;
