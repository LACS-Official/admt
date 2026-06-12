import React, { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  makeStyles,
  Card,
  Text,
  Button,
  Field,
  Input,
  ProgressBar,
  Spinner,
  Badge,
  TabList,
  Tab,
  tokens,
} from "@fluentui/react-components";
import {
  Folder24Regular,
  Document24Regular,
  Link24Regular,
  ArrowDownload24Regular,
  ArrowRight24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Info24Regular,
  FolderOpen24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "20px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  inputRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  tabList: {
    marginBottom: "8px",
  },
  partitionListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "8px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  partitionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "350px",
    overflowY: "auto",
    padding: "4px 0",
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "var(--colorNeutralStroke2)",
      borderRadius: "4px",
    },
  },
  partitionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground1)",
    transition: "all 0.2s ease",
    "&:hover": {
      borderTopColor: "var(--colorBrandStroke1)",
      borderBottomColor: "var(--colorBrandStroke1)",
      borderLeftColor: "var(--colorBrandStroke1)",
      borderRightColor: "var(--colorBrandStroke1)",
      transform: "translateX(2px)",
    },
  },
  partitionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  partitionMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  partitionName: {
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  partitionSize: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  successCard: {
    backgroundColor: "var(--colorPaletteGreenBackground1)",
    borderTopColor: "var(--colorPaletteGreenBorder1)",
    borderBottomColor: "var(--colorPaletteGreenBorder1)",
    borderLeftColor: "var(--colorPaletteGreenBorder1)",
    borderRightColor: "var(--colorPaletteGreenBorder1)",
    color: "var(--colorPaletteGreenForeground1)",
  },
  errorCard: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    borderTopColor: "var(--colorPaletteRedBorder1)",
    borderBottomColor: "var(--colorPaletteRedBorder1)",
    borderLeftColor: "var(--colorPaletteRedBorder1)",
    borderRightColor: "var(--colorPaletteRedBorder1)",
    color: "var(--colorPaletteRedForeground1)",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
});

interface PartitionInfo {
  name: string;
  size: number;
}

export const RomManagerCard: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage, setCurrentView } = useAppStore();

  const [activeTab, setActiveTab] = useState<"local" | "online">("local");
  const [romPath, setRomPath] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [outputDir, setOutputDir] = useState("");

  const [isParsing, setIsParsing] = useState(false);
  const [partitions, setPartitions] = useState<PartitionInfo[]>([]);
  const [parsedSource, setParsedSource] = useState<{ type: "local" | "online"; path: string } | null>(null);

  const [extractingPartition, setExtractingPartition] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState("");
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractedPath, setExtractedPath] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // 初始化下载目录
  useEffect(() => {
    const initOutputDir = async () => {
      try {
        const dir = await invoke<string>("get_downloads_directory");
        setOutputDir(dir);
      } catch (err) {
        console.error("Failed to get default downloads directory:", err);
      }
    };
    initOutputDir();
  }, []);

  // 监听 Rust 的提取进度事件
  useEffect(() => {
    const unlistenPromise = listen<{ progress: number; status: string }>(
      "rom-extract-progress",
      (event) => {
        setExtractProgress(event.payload.progress);
        setExtractStatus(event.payload.status);
      }
    );

    return () => {
      unlistenPromise.then((f) => f());
    };
  }, []);

  const handleSelectLocalFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "固件包 (.zip / payload.bin)", extensions: ["zip", "bin"] }],
      });
      if (typeof selected === "string") {
        setRomPath(selected);
        setPartitions([]);
        setParsedSource(null);
        setExtractedPath(null);
        setExtractError(null);
      }
    } catch (e: any) {
      setStatusBarMessage({ type: "error", message: `文件选择失败: ${e.message || String(e)}` });
    }
  };

  const handleSelectOutputDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (typeof selected === "string") {
        setOutputDir(selected);
      }
    } catch (e: any) {
      setStatusBarMessage({ type: "error", message: `目录选择失败: ${e.message || String(e)}` });
    }
  };

  const handleParseRom = async () => {
    const source = activeTab === "local" ? romPath : onlineUrl;
    if (!source.trim()) {
      setStatusBarMessage({ type: "warning", message: activeTab === "local" ? "请先选择本地ROM包！" : "请先输入在线ROM下载链接！" });
      return;
    }

    setIsParsing(true);
    setPartitions([]);
    setParsedSource(null);
    setExtractedPath(null);
    setExtractError(null);

    try {
      let list: PartitionInfo[] = [];
      if (activeTab === "local") {
        list = await invoke<PartitionInfo[]>("parse_local_rom", { path: romPath });
      } else {
        list = await invoke<PartitionInfo[]>("parse_online_rom", { url: onlineUrl });
      }

      // 智能排序：优先将 boot 和 init_boot 排在最前面，其他按名字字母排序
      const sortedList = [...list].sort((a, b) => {
        const isACommon = a.name === "boot" || a.name === "init_boot";
        const isBCommon = b.name === "boot" || b.name === "init_boot";
        if (isACommon && !isBCommon) return -1;
        if (!isACommon && isBCommon) return 1;
        return a.name.localeCompare(b.name);
      });

      setPartitions(sortedList);
      setParsedSource({ type: activeTab, path: source });
      setStatusBarMessage({ type: "success", message: `解析成功！共获取到 ${list.length} 个分区镜像。` });
    } catch (e: any) {
      console.error(e);
      setStatusBarMessage({ type: "error", message: `解析失败: ${e.message || String(e)}` });
    } finally {
      setIsParsing(false);
    }
  };

  const handleExtractPartition = async (partName: string) => {
    if (!outputDir) {
      setStatusBarMessage({ type: "warning", message: "请先选择提取保存目录！" });
      return;
    }

    setExtractingPartition(partName);
    setExtractProgress(0);
    setExtractStatus("初始化中...");
    setExtractedPath(null);
    setExtractError(null);

    try {
      let resultPath = "";
      if (parsedSource?.type === "local") {
        resultPath = await invoke<string>("extract_local_partition", {
          romPath: parsedSource.path,
          partName,
          outDir: outputDir,
        });
      } else if (parsedSource?.type === "online") {
        resultPath = await invoke<string>("extract_online_partition", {
          url: parsedSource.path,
          partName,
          outDir: outputDir,
        });
      }

      setExtractedPath(resultPath);
      setStatusBarMessage({ type: "success", message: `成功提取 ${partName} 分区镜像！` });
    } catch (e: any) {
      console.error(e);
      setExtractError(e.message || String(e));
      setStatusBarMessage({ type: "error", message: `提取分区 ${partName} 失败` });
    } finally {
      setExtractingPartition(null);
    }
  };

  const handleOpenFolder = async () => {
    if (extractedPath) {
      try {
        await invoke("open_folder", { path: outputDir });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleGoToPatch = () => {
    if (extractedPath) {
      // 导航到 Root 界面，并通过 navigationParams 自动带入镜像路径
      setCurrentView("root", { imagePath: extractedPath });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isCommonPartition = (name: string) => {
    return name === "boot" || name === "init_boot";
  };

  return (
    <Card className={styles.card}>
      {/* 说明区域 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Info24Regular style={{ color: "var(--colorBrandForeground1)" }} />
        <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
          直接在 ADMT 中解压/在线流式解析 ROM 固件（`payload.bin`），极速提取出修补 Root 权限所需的 `boot.img` 或 `init_boot.img` 镜像。
        </Text>
      </div>

      {/* 选择数据源 */}
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => {
          setActiveTab(data.value as "local" | "online");
          setPartitions([]);
          setParsedSource(null);
          setExtractedPath(null);
          setExtractError(null);
        }}
        className={styles.tabList}
      >
        <Tab value="local" icon={<Document24Regular />}>本地固件包</Tab>
        <Tab value="online" icon={<Link24Regular />}>在线固件下载直链</Tab>
      </TabList>

      <div className={styles.section}>
        {activeTab === "local" ? (
          <Field label="本地 ROM 包 (.zip) 或 payload.bin 文件路径">
            <div className={styles.inputRow}>
              <Input
                value={romPath}
                onChange={(_, data) => setRomPath(data.value)}
                placeholder="请选择或拖拽固件压缩包路径..."
                style={{ flex: 1 }}
              />
              <Button icon={<Folder24Regular />} onClick={handleSelectLocalFile}>
                选择固件
              </Button>
            </div>
          </Field>
        ) : (
          <Field label="ROM 直链 URL">
            <div className={styles.inputRow}>
              <Input
                value={onlineUrl}
                onChange={(_, data) => setOnlineUrl(data.value)}
                placeholder="请输入支持断点续传的 ROM 下载链接 (如 https://...)"
                style={{ flex: 1 }}
              />
            </div>
          </Field>
        )}

        <Field label="解压输出目录 (提取出来的镜像将存放于此)">
          <div className={styles.inputRow}>
            <Input
              value={outputDir}
              onChange={(_, data) => setOutputDir(data.value)}
              placeholder="请选择输出保存文件夹目录..."
              style={{ flex: 1 }}
            />
            <Button icon={<Folder24Regular />} onClick={handleSelectOutputDir}>
              选择目录
            </Button>
          </div>
        </Field>

        <Button
          appearance="primary"
          icon={<ArrowRight24Regular />}
          onClick={handleParseRom}
          disabled={isParsing || !!extractingPartition}
          style={{ marginTop: "8px", alignSelf: "flex-start" }}
        >
          {isParsing ? "正在流式解析中..." : "解析固件包"}
        </Button>
      </div>

      {/* 解析中加载态 */}
      {isParsing && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", gap: "12px" }}>
          <Spinner size="large" label="正在连接固件服务器并读取 payload.bin 信息..." />
          <Text size={200} style={{ color: "var(--colorNeutralForeground4)" }}>
            如果是读取在线直链，这可能需要十几秒来流式下载 zip 索引，请耐心等待
          </Text>
        </div>
      )}

      {/* 提取状态显示区域 */}
      {(extractingPartition || extractedPath || extractError) && (
        <div
          className={`${styles.statusSection} ${
            extractedPath ? styles.successCard : extractError ? styles.errorCard : ""
          }`}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {extractedPath ? (
              <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />
            ) : extractError ? (
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
            ) : (
              <Spinner size="tiny" />
            )}
            <Text weight="semibold">
              {extractingPartition
                ? `正在提取分区: ${extractingPartition}`
                : extractedPath
                ? "分区镜像提取成功！"
                : "镜像提取失败"}
            </Text>
          </div>

          {extractingPartition && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <ProgressBar value={extractProgress / 100} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text size={200}>{extractStatus}</Text>
                <Text size={200}>{extractProgress}%</Text>
              </div>
            </div>
          )}

          {extractedPath && (
            <div>
              <Text size={200} style={{ display: "block" }}>
                文件已生成于: <code>{extractedPath}</code>
              </Text>
              <div className={styles.actionButtons}>
                <Button size="small" icon={<FolderOpen24Regular />} onClick={handleOpenFolder}>
                  打开所在目录
                </Button>
                <Button size="small" appearance="primary" icon={<ArrowRight24Regular />} onClick={handleGoToPatch}>
                  一键去修补镜像
                </Button>
              </div>
            </div>
          )}

          {extractError && (
            <Text size={200} style={{ display: "block" }}>
              错误详情: {extractError}
            </Text>
          )}
        </div>
      )}

      {/* 分区展示列表 */}
      {partitions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflow: "hidden" }}>
          <div className={styles.partitionListHeader}>
            <Text weight="semibold">分区映像列表 ({partitions.length} 个)</Text>
            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
              推荐提取 boot 或 init_boot 用于 Magisk 修补
            </Text>
          </div>

          <div className={styles.partitionList}>
            {partitions.map((part) => (
              <div key={part.name} className={styles.partitionItem}>
                <div className={styles.partitionInfo}>
                  <div className={styles.partitionMeta}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Text className={styles.partitionName}>{part.name}</Text>
                      {isCommonPartition(part.name) && (
                        <Badge appearance="filled" color="success" size="small">
                          ✨ 推荐
                        </Badge>
                      )}
                    </div>
                    <Text className={styles.partitionSize}>{formatBytes(part.size)}</Text>
                  </div>
                </div>

                <Button
                  size="small"
                  appearance={isCommonPartition(part.name) ? "primary" : "outline"}
                  icon={<ArrowDownload24Regular />}
                  onClick={() => handleExtractPartition(part.name)}
                  disabled={isParsing || !!extractingPartition}
                >
                  提取
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
