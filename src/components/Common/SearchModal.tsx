import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  Text,
  makeStyles,
  mergeClasses,
} from "@fluentui/react-components";
import {
  Search20Regular,
  Home20Regular,
  Code20Regular,
  CloudArrowUp20Regular,
  Settings20Regular,
  DocumentText20Regular,
  Bot20Regular,
  Camera20Regular,
  ArrowClockwise20Regular,
  WifiSettings20Regular,
  PhoneDesktop20Regular,
  Apps20Regular,
  Folder20Regular,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
  Copy20Regular,
  Globe20Regular,
  Dismiss16Regular,
  Play20Regular,
  Checkmark16Regular,
  PanelLeftContract20Regular,
  PanelLeftExpand20Regular,
  ArrowReset20Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { useThemeStore } from "../../stores/themeStore";
import { deviceService } from "../../services/deviceService";
import { AppView } from "../../types/app";

const useStyles = makeStyles({
  dialogSurface: {
    padding: "0",
    maxWidth: "620px",
    width: "100%",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
  },
  dialogBody: {
    padding: "0",
    margin: "0",
    display: "flex",
    flexDirection: "column",
  },
  searchHeader: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    gap: "10px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  searchIcon: {
    color: "var(--colorBrandForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: "14px",
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground1)",
    fontFamily: "inherit",
    "&::placeholder": {
      color: "var(--colorNeutralForeground4)",
    },
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    borderRadius: "6px",
    color: "var(--colorNeutralForeground3)",
    transition: "all 0.12s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  escBadge: {
    fontSize: "11px",
    fontWeight: "500",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground3)",
    border: "1px solid var(--colorNeutralStroke2)",
    userSelect: "none",
  },
  resultsContainer: {
    maxHeight: "420px",
    minHeight: "180px",
    overflowY: "auto",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  sectionHeader: {
    padding: "8px 12px 4px 12px",
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground3)",
    letterSpacing: "0.03em",
    userSelect: "none",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background-color 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
    userSelect: "none",
    gap: "10px",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
  resultItemSelected: {
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    "&:hover": {
      backgroundColor: "rgba(0, 113, 227, 0.12)",
    },
  },
  resultItemActiveDark: {
    backgroundColor: "rgba(41, 151, 255, 0.15)",
    "&:hover": {
      backgroundColor: "rgba(41, 151, 255, 0.2)",
    },
  },
  itemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground2)",
    fontSize: "16px",
    flexShrink: 0,
    border: "1px solid var(--colorNeutralStroke2)",
  },
  iconBoxSelected: {
    color: "var(--colorBrandForeground1)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  itemInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  itemTitle: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground1)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemDesc: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  categoryBadge: {
    fontSize: "10px",
    fontWeight: "500",
    padding: "2px 8px",
    borderRadius: "9999px",
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground3)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  noResults: {
    padding: "36px 16px",
    textAlign: "center",
    color: "var(--colorNeutralForeground3)",
    fontSize: "13px",
  },
  paletteFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    userSelect: "none",
  },
  footerHints: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  footerHintItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  kbd: {
    padding: "1px 5px",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    fontSize: "10px",
    fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
  },
});

export interface CommandItem {
  id: string;
  section: "action" | "device" | "navigation" | "tool";
  sectionTitle: string;
  title: string;
  description: string;
  keywords: string[];
  icon: React.ReactNode;
  onExecute: () => void | Promise<void>;
}

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { setCurrentView, setCommandLineModalOpen, setLogsModalOpen, setWirelessDebuggingDialogOpen, setStatusBarMessage, isSidebarCollapsed, toggleSidebar } = useAppStore();
  const { selectedDevice, devices, selectDevice } = useDeviceStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  

  // 构建快捷指令池
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // ==================== 1. 快捷设备操作 ====================
    if (selectedDevice) {
      list.push(
        {
          id: "act_screenshot",
          section: "action",
          sectionTitle: "快捷操作",
          title: "屏幕截图并保存",
          description: `截取已连接设备 ${selectedDevice.properties?.model || selectedDevice.serial} 的当前屏幕`,
          keywords: ["screenshot", "jietu", "jt", "screen", "cap", "截屏", "截图"],
          icon: <Camera20Regular />,
          onExecute: async () => {
            try {
              setStatusBarMessage({ type: "info", message: "正在截取设备屏幕..." });
              await deviceService.executeAdbCommand(selectedDevice.serial, "shell", ["screencap", "-p", "/sdcard/screenshot.png"], 15);
              setStatusBarMessage({ type: "success", message: "屏幕截图已保存至设备 /sdcard/screenshot.png" });
            } catch (err) {
              setStatusBarMessage({ type: "error", message: `截屏失败: ${err}` });
            }
          },
        },
        {
          id: "act_reboot_sys",
          section: "action",
          sectionTitle: "快捷操作",
          title: "重启设备 (系统)",
          description: "安全重启目标设备回 Android 系统",
          keywords: ["reboot", "restart", "chongqi", "cq", "重启系统"],
          icon: <ArrowClockwise20Regular />,
          onExecute: async () => {
            try {
              await deviceService.executeAdbCommand(selectedDevice.serial, "reboot", [], 30);
              setStatusBarMessage({ type: "success", message: "正在重启目标设备..." });
            } catch (err) {
              setStatusBarMessage({ type: "error", message: `重启失败: ${err}` });
            }
          },
        },
        {
          id: "act_reboot_recovery",
          section: "action",
          sectionTitle: "快捷操作",
          title: "重启到 Recovery 恢复模式",
          description: "将目标设备重启进入 Recovery 模式",
          keywords: ["recovery", "rec", "huifu", "hf", "恢复模式"],
          icon: <ArrowClockwise20Regular />,
          onExecute: async () => {
            try {
              await deviceService.executeAdbCommand(selectedDevice.serial, "reboot", ["recovery"], 30);
              setStatusBarMessage({ type: "success", message: "已发送重启至 Recovery 指令" });
            } catch (err) {
              setStatusBarMessage({ type: "error", message: `指令失败: ${err}` });
            }
          },
        },
        {
          id: "act_reboot_fastboot",
          section: "action",
          sectionTitle: "快捷操作",
          title: "重启到 Fastboot / Bootloader",
          description: "将目标设备重启进入 Fastboot 引导刷机模式",
          keywords: ["fastboot", "bootloader", "fb", "bl", "引导模式", "刷机模式"],
          icon: <CloudArrowUp20Regular />,
          onExecute: async () => {
            try {
              await deviceService.executeAdbCommand(selectedDevice.serial, "reboot", ["bootloader"], 30);
              setStatusBarMessage({ type: "success", message: "已发送重启至 Bootloader 指令" });
            } catch (err) {
              setStatusBarMessage({ type: "error", message: `指令失败: ${err}` });
            }
          },
        },
        {
          id: "act_copy_serial",
          section: "action",
          sectionTitle: "快捷操作",
          title: "复制设备序列号",
          description: `序列号: ${selectedDevice.serial}`,
          keywords: ["copy", "serial", "sn", "fuzhi", "fz", "序列号"],
          icon: <Copy20Regular />,
          onExecute: () => {
            navigator.clipboard.writeText(selectedDevice.serial);
            setStatusBarMessage({ type: "success", message: `已复制序列号: ${selectedDevice.serial}` });
          },
        }
      );
    }

    // 全局快捷操作（无论是否连接设备）
    list.push(
      {
        id: "act_toggle_theme",
        section: "action",
        sectionTitle: "快捷操作",
        title: `切换为${isDarkMode ? "浅色" : "深色"}外观`,
        description: `当前为${isDarkMode ? "深色石墨黑" : "浅色极简"}模式`,
        keywords: ["theme", "dark", "light", "zhuti", "zt", "ms", "模式", "深色", "浅色", "外观"],
        icon: isDarkMode ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />,
        onExecute: () => {
          toggleTheme();
          setStatusBarMessage({ type: "info", message: `已切换为${!isDarkMode ? "深色" : "浅色"}外观` });
        },
      },
      {
        id: "act_toggle_sidebar",
        section: "action",
        sectionTitle: "快捷操作",
        title: isSidebarCollapsed ? "展开左侧导航栏" : "折叠收起左侧导航栏",
        description: "切换侧边栏宽版与紧凑胶囊视图",
        keywords: ["sidebar", "cebianlan", "cbl", "cebian", "折叠", "展开"],
        icon: isSidebarCollapsed ? <PanelLeftExpand20Regular /> : <PanelLeftContract20Regular />,
        onExecute: () => {
          toggleSidebar();
        },
      },
      {
        id: "act_wireless_debug",
        section: "action",
        sectionTitle: "快捷操作",
        title: "无线调试配对与连接",
        description: "呼出免数据线 Wi-Fi 无线 ADB 调试配对窗口",
        keywords: ["wireless", "wifi", "wuxiandiaoshi", "wx", "无线调试", "配对"],
        icon: <WifiSettings20Regular />,
        onExecute: () => {
          setWirelessDebuggingDialogOpen(true);
        },
      }
    );

    // ==================== 2. 已连接设备切换 ====================
    if (devices.length > 0) {
      devices.forEach((d) => {
        const isSelected = selectedDevice?.serial === d.serial;
        list.push({
          id: `dev_${d.serial}`,
          section: "device",
          sectionTitle: "已连接设备",
          title: `${d.properties?.model || d.serial} ${isSelected ? "(当前)" : ""}`,
          description: `序列号: ${d.serial} · 模式: ${d.mode || "sys"}`,
          keywords: ["device", "shebei", "sb", d.serial, d.properties?.model || ""],
          icon: isSelected ? <Checkmark16Regular style={{ color: "var(--colorBrandForeground1)" }} /> : <PhoneDesktop20Regular />,
          onExecute: () => {
            selectDevice(d);
            setStatusBarMessage({ type: "info", message: `已切换当前操作目标设备: ${d.properties?.model || d.serial}` });
          },
        });
      });
    }

    // ==================== 3. 页面导航 ====================
    list.push(
      {
        id: "nav_home",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "主页概览与硬件监控",
        description: "设备状态、电量与参数监控总览",
        keywords: ["home", "main", "zhuye", "zy", "主页", "概览", "监控"],
        icon: <Home20Regular />,
        onExecute: () => setCurrentView("home"),
      },
      {
        id: "nav_app_manager",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "应用管理",
        description: "查看已安装应用、卸载/停用、提取 APK",
        keywords: ["app", "package", "yingyong", "yy", "应用管理", "安装包", "apk"],
        icon: <Apps20Regular />,
        onExecute: () => {
          setCurrentView("adb-zone", { subView: "app-manager" });
        },
      },
      {
        id: "nav_screen_mirror",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "屏幕投屏与控制",
        description: "低延迟高清屏幕镜像与触控模拟",
        keywords: ["mirror", "scrcpy", "touping", "tp", "投屏", "录屏", "屏幕"],
        icon: <PhoneDesktop20Regular />,
        onExecute: () => {
          setCurrentView("adb-zone", { subView: "screen-mirror" });
        },
      },
      {
        id: "nav_file_manager",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "设备文件管理",
        description: "浏览手机目录、快速上传与下载文件",
        keywords: ["file", "wenjian", "wj", "文件管理", "sdcard", "传输"],
        icon: <Folder20Regular />,
        onExecute: () => {
          setCurrentView("adb-zone", { subView: "file-manager" });
        },
      },
      {
        id: "nav_device_control",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "按键与设备控制",
        description: "模拟物理按键、媒体快捷控制与电量伪装",
        keywords: ["control", "key", "anjian", "aj", "按键模拟", "控制"],
        icon: <Play20Regular />,
        onExecute: () => {
          setCurrentView("adb-zone", { subView: "device-control" });
        },
      },
      {
        id: "nav_flash_zone",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "Fastboot 刷机专区",
        description: "固件刷写、线刷包解析与引导管理",
        keywords: ["flash", "shuaji", "sj", "刷机", "fastboot", "固件"],
        icon: <CloudArrowUp20Regular />,
        onExecute: () => setCurrentView("flash-zone"),
      },
      {
        id: "nav_online_resources",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "玩机资源中心",
        description: "热门玩机工具、驱动包与固件镜像下载",
        keywords: ["resource", "online", "ziyuan", "zy", "资源中心", "下载"],
        icon: <Globe20Regular />,
        onExecute: () => setCurrentView("online-resources"),
      },
      {
        id: "nav_settings",
        section: "navigation",
        sectionTitle: "页面导航",
        title: "软件设置",
        description: "常规设置、日志等级、快捷键与深浅外观",
        keywords: ["settings", "config", "shezhi", "sz", "设置", "偏好"],
        icon: <Settings20Regular />,
        onExecute: () => setCurrentView("settings"),
      }
    );

    // ==================== 4. 终端与工具 ====================
    list.push(
      {
        id: "tool_terminal",
        section: "tool",
        sectionTitle: "终端与工具",
        title: "终端命令行 (ADB / Fastboot / PS / CMD)",
        description: "内置多环境极速终端命令行窗口",
        keywords: ["terminal", "command", "cmd", "powershell", "ps", "adb", "zhongduan", "zd", "终端", "命令行"],
        icon: <Code20Regular />,
        onExecute: () => {
          setCommandLineModalOpen(true);
        },
      },
      {
        id: "tool_logs",
        section: "tool",
        sectionTitle: "终端与工具",
        title: "日志管理器",
        description: "查看 ADMT 运行日志与 Android Logcat 流",
        keywords: ["log", "logcat", "rizhi", "rz", "日志", "调试日志"],
        icon: <DocumentText20Regular />,
        onExecute: () => {
          setLogsModalOpen(true);
        },
      },
      {
        id: "tool_ai_chat",
        section: "tool",
        sectionTitle: "终端与工具",
        title: "AI 玩机助手",
        description: "智能诊断、命令生成与 Android 疑难解决",
        keywords: ["ai", "chat", "assistant", "zhushou", "zs", "智能助手", "问答"],
        icon: <Bot20Regular />,
        onExecute: () => {
          setCurrentView("ai-chat");
        },
      }
    );

    return list;
  }, [selectedDevice, devices, isDarkMode, isSidebarCollapsed, selectDevice, setCurrentView, setCommandLineModalOpen, setLogsModalOpen, setStatusBarMessage, setWirelessDebuggingDialogOpen, toggleTheme, toggleSidebar]);

  // 模糊匹配搜索
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const lower = query.toLowerCase().trim();
    return allCommands.filter((item) => {
      return (
        item.title.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.keywords.some((k) => k.toLowerCase().includes(lower))
      );
    });
  }, [allCommands, query]);

  // 保持选中索引在合法范围
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 弹窗打开时重置与聚焦
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = async (item: CommandItem) => {
    onOpenChange(false);
    try {
      await item.onExecute();
    } catch (err) {
      console.error("执行指令失败:", err);
    }
  };

  const scrollToIndex = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(`.${styles.resultItem}`);
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.min(prev + 1, filteredCommands.length - 1);
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        scrollToIndex(next);
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands.length > 0 && filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  // 分组展示
  let lastSection: string | null = null;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody className={styles.dialogBody}>
          {/* 顶部搜索框 */}
          <div className={styles.searchHeader}>
            <div className={styles.searchIcon}>
              <Search20Regular />
            </div>
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder="搜索操作、功能或已连接设备 (如: 截图、投屏、重启、终端、拼音首字母)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            {query ? (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                title="清空搜索"
              >
                <Dismiss16Regular />
              </button>
            ) : (
              <span className={styles.escBadge}>ESC</span>
            )}
          </div>

          {/* 搜索结果列表 */}
          <div className={styles.resultsContainer} ref={listRef}>
            {filteredCommands.length > 0 ? (
              filteredCommands.map((item, index) => {
                const showHeader = item.sectionTitle !== lastSection;
                lastSection = item.sectionTitle;
                const isSelected = index === selectedIndex;

                return (
                  <React.Fragment key={item.id}>
                    {showHeader && (
                      <div className={styles.sectionHeader}>{item.sectionTitle}</div>
                    )}
                    <div
                      className={mergeClasses(
                        styles.resultItem,
                        isSelected && (isDarkMode ? styles.resultItemActiveDark : styles.resultItemSelected)
                      )}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={styles.itemLeft}>
                        <div
                          className={mergeClasses(
                            styles.iconBox,
                            isSelected && styles.iconBoxSelected
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemTitle}>{item.title}</span>
                          <span className={styles.itemDesc}>{item.description}</span>
                        </div>
                      </div>

                      <div className={styles.itemRight}>
                        <span className={styles.categoryBadge}>{item.sectionTitle}</span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <div className={styles.noResults}>
                未找到匹配的指令或功能，请尝试换用关键字或拼音
              </div>
            )}
          </div>

          {/* 底部按键提示栏 */}
          <div className={styles.paletteFooter}>
            <div className={styles.footerHints}>
              <div className={styles.footerHintItem}>
                <span className={styles.kbd}>↑</span>
                <span className={styles.kbd}>↓</span>
                <span>选择</span>
              </div>
              <div className={styles.footerHintItem}>
                <span className={styles.kbd}>↵</span>
                <span>执行</span>
              </div>
              <div className={styles.footerHintItem}>
                <span className={styles.kbd}>ESC</span>
                <span>关闭</span>
              </div>
            </div>
            <div>
              <span>全局快捷指令面板</span>
            </div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default SearchModal;
