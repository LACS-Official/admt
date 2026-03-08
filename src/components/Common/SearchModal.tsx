import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  Input,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import {
  Search24Regular,
  Home24Regular,
  Wrench24Regular,
  Flash24Regular,
  PhoneDesktop24Regular,
  AppsList24Regular,
  Globe24Regular,
  Settings24Regular,
  ShieldKeyhole24Regular,
  Code24Regular,
  DocumentText24Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { AppView } from "../../types/app";

const useStyles = makeStyles({
  dialogSurface: {
    padding: "0",
    maxWidth: "600px",
    width: "100%",
    borderRadius: tokens.borderRadiusLarge,
    overflow: "hidden",
  },
  dialogBody: {
    padding: "0",
    margin: "0",
  },
  searchInputWrapper: {
    padding: "16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  searchInput: {
    width: "100%",
  },
  resultsContainer: {
    maxHeight: "400px",
    overflowY: "auto",
    padding: "8px",
  },
  resultItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  resultItemSelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Selected,
    },
  },
  resultIcon: {
    color: tokens.colorBrandForeground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  resultText: {
    display: "flex",
    flexDirection: "column",
  },
  resultTitle: {
    fontWeight: "600",
  },
  resultDesc: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  noResults: {
    padding: "32px",
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
});

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  view: AppView;
  icon: React.ReactNode;
}

const features: FeatureItem[] = [
  {
    id: "home",
    title: "首页 (Home)",
    description: "返回应用主屏幕",
    keywords: ["home", "首页", "shouye", "sy", "main", "zhuye", "zy"],
    view: "home",
    icon: <Home24Regular />,
  },
  {
    id: "adb-zone",
    title: "ADB 工具箱 (ADB Zone)",
    description: "执行各种 ADB 命令和设备调试",
    keywords: ["adb", "工具箱", "gongjuxiang", "gjx", "调试", "tiaoshi", "ts"],
    view: "adb-zone",
    icon: <Wrench24Regular />,
  },
  {
    id: "flash-zone",
    title: "刷机专区 (Flash Zone)",
    description: "设备刷机、固件更新相关功能",
    keywords: ["flash", "刷机", "shuaji", "sj", "固件", "gujian"],
    view: "flash-zone",
    icon: <Flash24Regular />,
  },
  {
    id: "device-management",
    title: "设备管理 (Device Management)",
    description: "查看和管理已连接的设备详细信息",
    keywords: ["device", "设备", "shebei", "sb", "管理", "guanli", "gl"],
    view: "device-management",
    icon: <PhoneDesktop24Regular />,
  },
  {
    id: "extended-features",
    title: "扩展功能 (Extended Features)",
    description: "更多高级功能和插件",
    keywords: ["extended", "扩展", "kuozhan", "kz", "插件", "chajian", "cj"],
    view: "extended-features",
    icon: <AppsList24Regular />,
  },
  {
    id: "online-resources",
    title: "在线资源 (Online Resources)",
    description: "下载固件、工具和其他资源",
    keywords: ["online", "资源", "ziyuan", "zy", "下载", "xiazai", "xz"],
    view: "online-resources",
    icon: <Globe24Regular />,
  },
  {
    id: "settings",
    title: "系统设置 (Settings)",
    description: "配置应用偏好和行为",
    keywords: ["settings", "设置", "shezhi", "sz", "配置", "peizhi", "pz"],
    view: "settings",
    icon: <Settings24Regular />,
  },
  {
    id: "root",
    title: "Root 专区 (Root Zone)",
    description: "管理设备的 Root 权限及高级操作",
    keywords: ["root", "权限", "quanxian", "qx", "超级用户", "chaojiyonghu"],
    view: "root",
    icon: <ShieldKeyhole24Regular />,
  },
  {
    id: "command-line",
    title: "命令行 (Command Line)",
    description: "内置终端窗口",
    keywords: [
      "command",
      "终端",
      "zhongduan",
      "zd",
      "命令行",
      "minglinghang",
      "mlh",
      "cmd",
      "terminal",
    ],
    view: "command-line",
    icon: <Code24Regular />,
  },
  {
    id: "logs",
    title: "日志面板 (Logs)",
    description: "查看应用运行日志和设备 logcat",
    keywords: ["logs", "日志", "rizhi", "rz", "logcat"],
    view: "logs",
    icon: <DocumentText24Regular />,
  },
  {
    id: "demo",
    title: "组件演示 (Demo)",
    description: "UI 组件预览和测试页面",
    keywords: ["demo", "演示", "yanshi", "ys", "组件", "zujian", "zj", "ui"],
    view: "demo",
    icon: <Play24Regular />,
  },
];

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
  const { setCurrentView } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredFeatures = React.useMemo(() => {
    if (!query.trim()) return features;

    const lowerQuery = query.toLowerCase();
    return features.filter(
      (feature) =>
        feature.title.toLowerCase().includes(lowerQuery) ||
        feature.description.toLowerCase().includes(lowerQuery) ||
        feature.keywords.some((keyword) =>
          keyword.toLowerCase().includes(lowerQuery),
        ),
    );
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (feature: FeatureItem) => {
    setCurrentView(feature.view);
    onOpenChange(false);
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
        const next = Math.min(prev + 1, filteredFeatures.length - 1);
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
      if (filteredFeatures.length > 0) {
        handleSelect(filteredFeatures[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody className={styles.dialogBody}>
          <div className={styles.searchInputWrapper}>
            <Input
              ref={inputRef}
              className={styles.searchInput}
              contentBefore={<Search24Regular />}
              placeholder="搜索功能或页面 (例如：ADB, 设置, 刷机, 拼音首字母)..."
              value={query}
              onChange={(e, data) => setQuery(data.value)}
              onKeyDown={handleKeyDown}
              appearance="filled-lighter"
              size="large"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className={styles.resultsContainer} ref={listRef}>
            {filteredFeatures.length > 0 ? (
              filteredFeatures.map((feature, index) => (
                <div
                  key={feature.id}
                  className={mergeClasses(
                    styles.resultItem,
                    index === selectedIndex && styles.resultItemSelected,
                  )}
                  onClick={() => handleSelect(feature)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.resultIcon}>{feature.icon}</div>
                  <div className={styles.resultText}>
                    <Text className={styles.resultTitle}>{feature.title}</Text>
                    <Text className={styles.resultDesc}>
                      {feature.description}
                    </Text>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <Text>未找到匹配的功能</Text>
              </div>
            )}
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
