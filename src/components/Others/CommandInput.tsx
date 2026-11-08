import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input, makeStyles, mergeClasses } from "@fluentui/react-components";
import {
  getCommandSuggestions,
  normalizeCommandLine,
  type CommandMode,
  type CommandSuggestion,
} from "../../utils/commandSuggestions";

const useStyles = makeStyles({
  wrapper: {
    position: "relative",
    flex: "1 1 0",
    minWidth: 0,
  },
  input: {
    width: "100%",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "12.5px",
  },
  popover: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: 0,
    width: "min(580px, 100%)",
    maxHeight: "264px",
    overflowY: "auto",
    padding: "6px",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "var(--shadow16)",
    zIndex: 200,
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "4px 10px 6px",
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    whiteSpace: "nowrap",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "7px 10px",
    border: "none",
    borderRadius: "9999px",
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground1)",
    fontSize: "12px",
    textAlign: "left",
    cursor: "pointer",
  },
  itemActive: {
    backgroundColor: "var(--colorSubtleBackgroundSelected)",
    color: "var(--colorBrandForeground1)",
  },
  itemText: {
    flex: "1 1 0",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  },
  itemSource: {
    flexShrink: 0,
    fontSize: "10px",
    color: "var(--colorNeutralForeground3)",
  },
});

const SOURCE_LABEL: Record<CommandSuggestion["source"], string> = {
  history: "历史",
  builtin: "常用",
  library: "命令库",
};

export interface CommandInputProps {
  mode: CommandMode;
  value: string;
  onChange: (value: string) => void;
  /** Enter 触发，参数是最终要执行的命令（可能来自联想候选项） */
  onSubmit: (value: string) => void;
  history: string[];
  libraryCommands?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export const CommandInput: React.FC<CommandInputProps> = ({
  mode,
  value,
  onChange,
  onSubmit,
  history,
  libraryCommands = [],
  placeholder,
  disabled = false,
}) => {
  const styles = useStyles();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Tab 循环期间冻结候选，避免输入框内容变化把列表越筛越短
  const cycleListRef = useRef<CommandSuggestion[]>([]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [cycleIndex, setCycleIndex] = useState(-1);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draft, setDraft] = useState("");

  const suggestions = useMemo(
    () => getCommandSuggestions(mode, value, history, libraryCommands, 8),
    [mode, value, history, libraryCommands]
  );
  const list = cycleListRef.current.length > 0 ? cycleListRef.current : suggestions;
  const query = normalizeCommandLine(value);

  useEffect(() => {
    cycleListRef.current = [];
    setCycleIndex(-1);
    setHistoryIndex(-1);
    setActiveIndex(-1);
    setOpen(false);
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open]);

  const resetCycle = () => {
    cycleListRef.current = [];
    setCycleIndex(-1);
    setActiveIndex(-1);
  };

  const handleChange = (next: string) => {
    onChange(next);
    resetCycle();
    setHistoryIndex(-1);
    setDraft("");
    setOpen(true);
  };

  const applyCandidate = (index: number) => {
    const candidate = list[index];
    if (!candidate) return;
    onChange(candidate.value);
    setCycleIndex(index);
    setHistoryIndex(-1);
    // 清掉鼠标悬停项，否则随后按 Enter 会执行旧的高亮候选
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const target =
        open && activeIndex >= 0 && activeIndex < list.length ? list[activeIndex].value : value;
      resetCycle();
      setOpen(false);
      onSubmit(target);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      if (list.length === 0) return;
      if (cycleListRef.current.length === 0) cycleListRef.current = suggestions;
      const total = list.length;
      const next = event.shiftKey
        ? cycleIndex <= 0
          ? total - 1
          : cycleIndex - 1
        : (cycleIndex + 1) % total;
      applyCandidate(next);
      setOpen(true);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;
      if (historyIndex === -1) setDraft(value);
      const next = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(next);
      onChange(history[next]);
      resetCycle();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === -1) {
        setOpen(true);
        return;
      }
      const next = historyIndex - 1;
      if (next < 0) {
        setHistoryIndex(-1);
        onChange(draft);
      } else {
        setHistoryIndex(next);
        onChange(history[next]);
      }
      resetCycle();
      return;
    }

    if (event.key === "Escape") {
      resetCycle();
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <Input
        ref={inputRef}
        className={styles.input}
        value={value}
        onChange={(_, data) => handleChange(data.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
      />

      {open && !disabled && list.length > 0 && (
        <div className={styles.popover}>
          <div className={styles.head}>
            <span>{query ? "自动联想" : "最近使用 / 常用命令"}</span>
            <span>Tab 补齐 · ↑ 历史 · Enter 执行</span>
          </div>
          {list.map((item, index) => (
            <button
              key={item.value}
              className={mergeClasses(
                styles.item,
                (activeIndex === index || cycleIndex === index) && styles.itemActive
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                applyCandidate(index);
                resetCycle();
                setOpen(false);
              }}
            >
              <span className={styles.itemText}>
                <strong>{item.value.slice(0, query.length)}</strong>
                {item.value.slice(query.length)}
              </span>
              <span className={styles.itemSource}>{SOURCE_LABEL[item.source]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommandInput;
