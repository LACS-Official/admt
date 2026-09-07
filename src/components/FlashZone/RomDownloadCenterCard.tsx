import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Field,
  Input,
  Select,
  ProgressBar,
  Spinner,
  Badge,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  ArrowDownload24Regular,
  ArrowSync24Regular,
  Copy24Regular,
  Open24Regular,
  DocumentChevronDouble24Regular,
  Code24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Search24Regular,
  FolderOpen24Regular,
  Filter24Regular,
  Dismiss24Regular,
  Info24Regular,
  Sparkle24Regular,
  ChevronUp24Regular,
  ChevronDown24Regular,
  BookOpen24Regular,
  Globe24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import {
  POPULAR_XIAOMI_DEVICES,
  XiaomiRomItem,
  extractXiaomiDeviceCode,
  extractXiaomiRomVersion,
  isXiaomiDevice,
  queryXiaomiRoms,
  generatePartitionExtractScript,
  detectXiaomiRegion,
  getRomMirrors,
  RomMirrorItem,
  getXiaomiSupportedVersions,
  SupportedSystemVersion,
} from "../../services/xiaomiRomService";
import {
  RomBrandCategory,
  MultiBrandRomItem,
  multiBrandRomService,
  AOSP_PROJECTS,
  EXOTIC_CATEGORIES,
} from "../../services/multiBrandRomService";
import { onlineResourcesService } from "../../services/onlineResourcesService";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px 18px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  brandTabBar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    padding: "4px",
    borderRadius: "9999px",
    backgroundColor: "var(--colorNeutralBackground3)",
    border: "1px solid var(--colorNeutralStroke2)",
    width: "fit-content",
    flexShrink: 0,
  },
  brandTabItem: {
    fontSize: "12px",
    padding: "5px 14px",
    borderRadius: "9999px",
    cursor: "pointer",
    userSelect: "none",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "none",
    fontWeight: 500,
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  brandTabItemActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
    boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
  },
  filterCard: {
    borderRadius: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    flexShrink: 0,
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 2px 10px -2px rgba(0, 0, 0, 0.03)",
  },
  collapsedBar: {
    borderRadius: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    padding: "10px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    flexShrink: 0,
    boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.02)",
  },
  summaryTags: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    paddingBottom: "10px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  filterSectionTitle: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--colorNeutralForeground1)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
    alignItems: "flex-start",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  filterItemLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  segmentedPillContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
    padding: "3px",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    border: "1px solid var(--colorNeutralStroke2)",
    width: "fit-content",
  },
  segmentedPill: {
    fontSize: "12px",
    padding: "4px 11px",
    borderRadius: "9999px",
    cursor: "pointer",
    userSelect: "none",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
    border: "none",
    fontWeight: 500,
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  segmentedPillActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
  },
  filterActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    paddingTop: "12px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
  },
  searchBarContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexShrink: 0,
  },
  contentArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
  },
  romGrid: {
    flex: 1,
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    paddingRight: "4px",
    alignContent: "start",
    minHeight: 0,
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  romCard: {
    padding: "14px 16px",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    "&:hover": {
      borderTopColor: "var(--colorBrandStroke1)",
      borderRightColor: "var(--colorBrandStroke1)",
      borderBottomColor: "var(--colorBrandStroke1)",
      borderLeftColor: "var(--colorBrandStroke1)",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.06)",
      transform: "translateY(-1px)",
    },
  },
  cardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
  },
  cardBadges: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  },
  cardModelInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  cardMetaPills: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  metaPill: {
    padding: "2px 8px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground3)",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "var(--colorNeutralForeground2)",
  },
  cardBottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "8px",
    borderTop: "1px solid var(--colorNeutralStroke3)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "48px 24px",
    color: "var(--colorNeutralForeground3)",
    textAlign: "center",
    margin: "auto",
  },
  detailDialogSurface: {
    maxWidth: "620px",
    width: "100%",
    borderRadius: "16px",
  },
  detailContent: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "10px 0",
  },
  detailMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px 16px",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "12px",
  },
  detailMetaItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  mirrorContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "var(--colorNeutralBackground3)",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  mirrorHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mirrorPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  mirrorPill: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    userSelect: "none",
    "&:hover": {
      borderTopColor: "var(--colorBrandStroke1)",
      borderRightColor: "var(--colorBrandStroke1)",
      borderBottomColor: "var(--colorBrandStroke1)",
      borderLeftColor: "var(--colorBrandStroke1)",
      color: "var(--colorBrandForeground1)",
    },
  },
  mirrorPillActive: {
    borderTopColor: "var(--colorBrandStroke1)",
    borderRightColor: "var(--colorBrandStroke1)",
    borderBottomColor: "var(--colorBrandStroke1)",
    borderLeftColor: "var(--colorBrandStroke1)",
    backgroundColor: "rgba(0, 113, 227, 0.12)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
  },
  mirrorUrlBox: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "11px",
    padding: "8px 10px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    wordBreak: "break-all",
    color: "var(--colorNeutralForeground2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  modalContent: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "12px 0",
  },
  codeBlock: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "12px",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground3)",
    border: "1px solid var(--colorNeutralStroke2)",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    color: "var(--colorNeutralForeground1)",
    maxHeight: "220px",
    overflowY: "auto",
  },
});

interface UnifiedRomItem {
  id: string;
  name: string;
  codename: string;
  version: string;
  android: string;
  branch: string;
  method: string;
  date: string;
  size: string;
  link: string;
  description?: string;
  authorOrMaintainer?: string;
  tags?: string[];
  mirrors: RomMirrorItem[];
  md5?: string;
  tutorialUrl?: string;
}

const BRAND_TABS: { id: RomBrandCategory; label: string; tag: string }[] = [
  { id: "xiaomi", label: "小米 (Xiaomi)", tag: "HyperOS/MIUI" },
  { id: "oppo", label: "OPPO", tag: "ColorOS" },
  { id: "oneplus", label: "一加 (OnePlus)", tag: "Color/氧OS" },
  { id: "realme", label: "真我 (Realme)", tag: "realme UI" },
  { id: "aosp", label: "类原生", tag: "PixelOS/Lineage" },
  { id: "exotic", label: "奇葩小玩意", tag: "Win11/Linux/车机" },
];

export const RomDownloadCenterCard: React.FC = () => {
  const styles = useStyles();
  const { selectedDevice, devices } = useDeviceStore();
  const { setStatusBarMessage, setCurrentView } = useAppStore();

  const activeDevice = selectedDevice || devices.find((d) => d.connected) || null;

  // 当前选中的品牌分类
  const [selectedBrand, setSelectedBrand] = useState<RomBrandCategory>("xiaomi");

  // 小米分类过滤参数
  const [codename, setCodename] = useState<string>("");
  const [selectedModelPreset, setSelectedModelPreset] = useState<string>("");
  const [versionFilter, setVersionFilter] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("cn");
  const [methodFilter, setMethodFilter] = useState<"all" | "Recovery" | "Fastboot">("all");
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(true);

  // 小米系统版本动态支持列表状态
  const [supportedVersions, setSupportedVersions] = useState<SupportedSystemVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);
  const [isCustomVersion, setIsCustomVersion] = useState<boolean>(false);

  // 其他品牌及类原生、奇葩小玩意的通用过滤参数
  const [otherBrandModel, setOtherBrandModel] = useState<string>("");
  const [otherBrandPreset, setOtherBrandPreset] = useState<string>("");
  const [otherVersionFilter, setOtherVersionFilter] = useState<string>("");
  const [selectedAospProject, setSelectedAospProject] = useState<string>("all");
  const [selectedExoticCat, setSelectedExoticCat] = useState<string>("all");

  // 列表内检索关键词
  const [listSearchQuery, setListSearchQuery] = useState<string>("");

  // 小米 ROM 状态
  const [loading, setLoading] = useState<boolean>(false);
  const [xiaomiRomList, setXiaomiRomList] = useState<XiaomiRomItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 详情弹窗与镜像切换状态
  const [detailModalItem, setDetailModalItem] = useState<UnifiedRomItem | null>(null);
  const [selectedMirrorId, setSelectedMirrorId] = useState<string>("");

  // 镜像流式提取弹窗状态 (小米专属)
  const [extractModalItem, setExtractModalItem] = useState<XiaomiRomItem | null>(null);
  const [targetPartition, setTargetPartition] = useState<string>("boot");
  const [outputDir, setOutputDir] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractProgress, setExtractProgress] = useState<number>(0);
  const [extractStatus, setExtractStatus] = useState<string>("");
  const [extractedFile, setExtractedFile] = useState<string | null>(null);

  // 提取脚本查看弹窗
  const [scriptModalItem, setScriptModalItem] = useState<XiaomiRomItem | null>(null);
  const [scriptType, setScriptType] = useState<"powershell" | "bash">("powershell");

  // 初始化下载路径与监听提取事件
  useEffect(() => {
    invoke<string>("get_downloads_directory")
      .then((dir) => setOutputDir(dir))
      .catch((err) => console.error("获取下载目录失败:", err));

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

  // 动态检索当前机型代号、地区版本、版本分支对应的系统版本支持列表
  useEffect(() => {
    if (selectedBrand !== "xiaomi") return;
    if (!codename.trim()) {
      setSupportedVersions([]);
      return;
    }

    let isMounted = true;
    setIsLoadingVersions(true);

    getXiaomiSupportedVersions({
      codename: codename.trim(),
      region: selectedRegion,
      branch: selectedBranch,
    })
      .then((versions) => {
        if (isMounted) {
          setSupportedVersions(versions);
          setIsLoadingVersions(false);
        }
      })
      .catch((err) => {
        console.error("加载支持系统版本列表失败:", err);
        if (isMounted) {
          setSupportedVersions([]);
          setIsLoadingVersions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBrand, codename, selectedRegion, selectedBranch]);

  // 其他品牌的系统版本动态列表
  const supportedOtherVersions = useMemo(() => {
    if (selectedBrand === "oppo" || selectedBrand === "oneplus" || selectedBrand === "realme") {
      return multiBrandRomService.getSupportedVersions(selectedBrand, otherBrandModel);
    }
    return [];
  }, [selectedBrand, otherBrandModel]);

  // 小米设备自动识别
  const handleAutoDetectCurrentDevice = () => {
    if (!activeDevice) {
      setStatusBarMessage({ type: "warning", message: "未检测到已连接的设备，请先通过 USB 连接手机" });
      return;
    }

    const brand = (activeDevice.properties?.brand || "").toLowerCase();
    const manufacturer = (activeDevice.properties?.manufacturer || "").toLowerCase();

    // 智能切换对应品牌选项卡
    if (brand.includes("oppo") || manufacturer.includes("oppo")) {
      setSelectedBrand("oppo");
      const model = activeDevice.properties?.model || "";
      setOtherBrandModel(model);
      setOtherBrandPreset(model);
      setStatusBarMessage({ type: "success", message: `已自动识别到 OPPO 设备 (${model})，并切换至对应专区` });
      return;
    }

    if (brand.includes("oneplus") || manufacturer.includes("oneplus")) {
      setSelectedBrand("oneplus");
      const model = activeDevice.properties?.model || "";
      setOtherBrandModel(model);
      setOtherBrandPreset(model);
      setStatusBarMessage({ type: "success", message: `已自动识别到 OnePlus 一加设备 (${model})，并切换至对应专区` });
      return;
    }

    if (brand.includes("realme") || manufacturer.includes("realme")) {
      setSelectedBrand("realme");
      const model = activeDevice.properties?.model || "";
      setOtherBrandModel(model);
      setOtherBrandPreset(model);
      setStatusBarMessage({ type: "success", message: `已自动识别到 Realme 真我设备 (${model})，并切换至对应专区` });
      return;
    }

    // 默认为小米生态
    const code = extractXiaomiDeviceCode(activeDevice);
    const sysVer = extractXiaomiRomVersion(activeDevice);

    if (!code) {
      setStatusBarMessage({ type: "warning", message: "未能从已连接设备中识别出机型代号" });
      return;
    }

    setSelectedBrand("xiaomi");
    setCodename(code);
    setSelectedModelPreset(code);

    if (sysVer) {
      setVersionFilter(sysVer);
      const reg = detectXiaomiRegion(sysVer);
      setSelectedRegion(reg || "cn");
      const isBeta = sysVer.toUpperCase().includes("DEV") || sysVer.toUpperCase().includes("BETA");
      setSelectedBranch(isBeta ? "Beta" : "Stable");
    } else {
      setSelectedRegion("cn");
      setSelectedBranch("all");
    }

    setStatusBarMessage({
      type: "success",
      message: `已自动识别当前小米设备配置: ${code} ${sysVer ? `(${sysVer})` : ""}`,
    });
  };

  // 获取小米 ROM 索引
  const handleSearchXiaomi = async (forceRefresh = false) => {
    if (!codename.trim()) {
      setStatusBarMessage({ type: "warning", message: "请在下拉框中选择或手动输入设备代号！" });
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const results = await queryXiaomiRoms({
        codename: codename.trim(),
        region: selectedRegion,
        versionFilter: versionFilter.trim(),
        branchFilter: selectedBranch,
        methodFilter,
        forceRefresh,
      });
      setXiaomiRomList(results);

      if (results.length === 0) {
        setStatusBarMessage({
          type: "info",
          message: `未找到与 ${codename} 匹配的小米官方 ROM，可尝试切换地区或清空版本筛选条件。`,
        });
      } else {
        setStatusBarMessage({
          type: "success",
          message: `成功获取到 ${results.length} 个 ${codename} 官方系统包！`,
        });
        setIsFilterExpanded(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || String(err));
      setStatusBarMessage({ type: "error", message: `获取 ROM 失败: ${err.message || String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  // 计算当前分类下展示的列表
  const displayedItems: UnifiedRomItem[] = useMemo(() => {
    const q = listSearchQuery.trim().toLowerCase();

    // 1. 小米生态
    if (selectedBrand === "xiaomi") {
      return xiaomiRomList
        .filter((rom) => {
          if (selectedBranch && selectedBranch !== "all") {
            const b = rom.branch.toLowerCase();
            if (selectedBranch === "Stable" && b.includes("beta")) return false;
            if (
              selectedBranch === "Beta" &&
              !b.includes("beta") &&
              !b.includes("weekly") &&
              !b.includes("dev")
            )
              return false;
          }
          if (selectedRegion && selectedRegion !== "all") {
            const reg = detectXiaomiRegion(rom.version);
            if (reg !== selectedRegion.toLowerCase()) {
              const kw = [selectedRegion.toLowerCase()];
              const match = kw.some((k) => rom.name.toLowerCase().includes(k));
              if (!match) return false;
            }
          }
          if (versionFilter.trim()) {
            const vf = versionFilter.trim().toLowerCase();
            if (!rom.version.toLowerCase().includes(vf) && !rom.name.toLowerCase().includes(vf)) {
              return false;
            }
          }
          if (methodFilter !== "all" && rom.method !== methodFilter) {
            return false;
          }
          if (q) {
            const match =
              rom.version.toLowerCase().includes(q) ||
              rom.name.toLowerCase().includes(q) ||
              rom.android.toLowerCase().includes(q) ||
              rom.date.toLowerCase().includes(q) ||
              rom.method.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        })
        .map((rom) => ({
          id: `${rom.version}_${rom.method}`,
          name: rom.name,
          codename: rom.codename,
          version: rom.version,
          android: rom.android,
          branch: rom.branch,
          method: rom.method,
          date: rom.date,
          size: rom.size,
          link: rom.link,
          description: `${rom.name} 官方固件 (${rom.version})`,
          authorOrMaintainer: "小米官方",
          mirrors: getRomMirrors(rom.link),
          md5: rom.md5,
        }));
    }

    // 2. OPPO / 一加 / 真我
    if (selectedBrand === "oppo" || selectedBrand === "oneplus" || selectedBrand === "realme") {
      const list = multiBrandRomService.getRomList(selectedBrand);
      return list
        .filter((item) => {
          if (otherBrandModel.trim()) {
            const m =
              item.name.toLowerCase().includes(otherBrandModel.trim().toLowerCase()) ||
              item.codename.toLowerCase().includes(otherBrandModel.trim().toLowerCase());
            if (!m) return false;
          }
          if (otherVersionFilter.trim()) {
            if (!item.version.toLowerCase().includes(otherVersionFilter.trim().toLowerCase())) return false;
          }
          if (q) {
            const match =
              item.name.toLowerCase().includes(q) ||
              item.version.toLowerCase().includes(q) ||
              item.codename.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        })
        .map((item) => ({
          ...item,
          mirrors: item.mirrors,
        }));
    }

    // 3. 类原生 (AOSP)
    if (selectedBrand === "aosp") {
      const list = multiBrandRomService.getRomList("aosp");
      return list
        .filter((item) => {
          if (selectedAospProject !== "all") {
            if (!item.version.toLowerCase().includes(selectedAospProject.toLowerCase()) && !item.tags?.includes(selectedAospProject)) {
              return false;
            }
          }
          if (otherBrandModel.trim()) {
            const m =
              item.name.toLowerCase().includes(otherBrandModel.trim().toLowerCase()) ||
              item.codename.toLowerCase().includes(otherBrandModel.trim().toLowerCase());
            if (!m) return false;
          }
          if (q) {
            const match =
              item.name.toLowerCase().includes(q) ||
              item.version.toLowerCase().includes(q) ||
              item.codename.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q);
            if (!match) return false;
          }
          return true;
        })
        .map((item) => ({ ...item, mirrors: item.mirrors }));
    }

    // 4. 奇葩小玩意 (Exotic)
    if (selectedBrand === "exotic") {
      const list = multiBrandRomService.getRomList("exotic");
      return list
        .filter((item) => {
          if (selectedExoticCat !== "all") {
            const matchCat =
              (selectedExoticCat === "woa" && (item.tags?.includes("Windows 11") || item.name.includes("Win11"))) ||
              (selectedExoticCat === "linux" && (item.tags?.includes("Ubuntu Touch") || item.name.includes("Linux"))) ||
              (selectedExoticCat === "kali" && item.tags?.includes("Kali NetHunter")) ||
              (selectedExoticCat === "car_tv" && item.tags?.includes("车载中控")) ||
              (selectedExoticCat === "retro" && item.tags?.includes("Smartisan OS"));
            if (!matchCat) return false;
          }
          if (q) {
            const match =
              item.name.toLowerCase().includes(q) ||
              item.version.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q) ||
              item.tags?.some((t) => t.toLowerCase().includes(q));
            if (!match) return false;
          }
          return true;
        })
        .map((item) => ({ ...item, mirrors: item.mirrors }));
    }

    return [];
  }, [
    selectedBrand,
    xiaomiRomList,
    selectedBranch,
    selectedRegion,
    versionFilter,
    methodFilter,
    listSearchQuery,
    otherBrandModel,
    otherVersionFilter,
    selectedAospProject,
    selectedExoticCat,
  ]);

  // 打开详情弹窗
  const handleOpenDetailModal = (item: UnifiedRomItem) => {
    setDetailModalItem(item);
    if (item.mirrors.length > 0) {
      setSelectedMirrorId(item.mirrors[0].id);
    } else {
      setSelectedMirrorId("");
    }
  };

  const activeMirror = useMemo(() => {
    if (!detailModalItem || detailModalItem.mirrors.length === 0) return null;
    return detailModalItem.mirrors.find((m) => m.id === selectedMirrorId) || detailModalItem.mirrors[0];
  }, [detailModalItem, selectedMirrorId]);

  const activeDownloadUrl = activeMirror ? activeMirror.url : detailModalItem?.link || "";

  // 添加到下载管理器
  const handleAddToDownloadManager = async () => {
    if (!detailModalItem || !activeDownloadUrl) return;

    try {
      let fileName = "";
      try {
        const u = new URL(activeDownloadUrl);
        fileName = u.pathname.split("/").pop() || "";
      } catch {
        fileName = `${detailModalItem.codename}_${detailModalItem.version}.zip`;
      }
      if (!fileName || fileName.length < 3) {
        fileName = `${detailModalItem.codename}_${detailModalItem.version}.zip`;
      }

      await onlineResourcesService.downloadCustomFile(
        fileName,
        activeDownloadUrl,
        `${detailModalItem.name} ${detailModalItem.version}`
      );

      setStatusBarMessage({
        type: "success",
        message: `已将 ${fileName} 添加至下载管理器，可在“下载管理”中查看实时速度与进度！`,
      });
    } catch (err: any) {
      setStatusBarMessage({
        type: "error",
        message: `添加下载任务失败: ${err.message || String(err)}`,
      });
    }
  };

  // 复制链接
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setStatusBarMessage({ type: "success", message: "下载直链已复制到剪贴板！" });
  };

  // 外部浏览器打开
  const handleOpenBrowser = async (url: string) => {
    try {
      await invoke("open_external_url", { url });
      setStatusBarMessage({ type: "info", message: "已在系统默认浏览器中打开下载链接" });
    } catch {
      window.open(url, "_blank");
    }
  };

  // 载入 ROM 管理
  const handleJumpToRomManager = (url: string) => {
    setCurrentView("flash-zone", {
      flashTab: "rom-manager",
      onlineUrl: url,
    });
    setStatusBarMessage({ type: "info", message: "已将固件下载直链载入 ROM 管理" });
  };

  return (
    <div className={styles.container}>
      {/* 顶部品牌与生态分段选择胶囊 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div className={styles.brandTabBar}>
          {BRAND_TABS.map((tab) => {
            const active = selectedBrand === tab.id;
            return (
              <div
                key={tab.id}
                className={`${styles.brandTabItem} ${active ? styles.brandTabItemActive : ""}`}
                onClick={() => {
                  setSelectedBrand(tab.id);
                  setListSearchQuery("");
                }}
              >
                <span>{tab.label}</span>
                <Badge size="small" appearance={active ? "filled" : "tint"}>
                  {tab.tag}
                </Badge>
              </div>
            );
          })}
        </div>

        <Button
          appearance="subtle"
          size="small"
          icon={<Sparkle24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
          onClick={handleAutoDetectCurrentDevice}
        >
          一键识别连接机型并切换
        </Button>
      </div>

      {/* 1. 小米专区专用筛选条件卡片 */}
      {selectedBrand === "xiaomi" && (
        isFilterExpanded ? (
          <div className={styles.filterCard}>
            <div className={styles.filterHeaderRow}>
              <div className={styles.filterSectionTitle}>
                <Filter24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                <span>小米 / Redmi / POCO 固件筛选与版本支持检索</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Sparkle24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
                  onClick={handleAutoDetectCurrentDevice}
                >
                  一键获取当前配置
                </Button>
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => {
                    setCodename("");
                    setSelectedModelPreset("");
                    setVersionFilter("");
                    setSelectedBranch("all");
                    setSelectedRegion("cn");
                  }}
                >
                  清空条件
                </Button>
                {xiaomiRomList.length > 0 && (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronUp24Regular />}
                    onClick={() => setIsFilterExpanded(false)}
                  >
                    收起筛选
                  </Button>
                )}
              </div>
            </div>

            <div className={styles.filterGrid}>
              {/* 机型预设与手动代号 */}
              <div className={styles.filterItem}>
                <span className={styles.filterItemLabel}>机型选择 (代号)</span>
                <Select
                  value={selectedModelPreset}
                  onChange={(_, data) => {
                    setSelectedModelPreset(data.value);
                    if (data.value) setCodename(data.value);
                  }}
                >
                  <option value="">-- 选择热门机型预设 --</option>
                  {POPULAR_XIAOMI_DEVICES.map((dev) => (
                    <option key={`${dev.codename}-${dev.name}`} value={dev.codename}>
                      {dev.series} {dev.name} ({dev.codename})
                    </option>
                  ))}
                </Select>
                <Input
                  value={codename}
                  onChange={(_, data) => {
                    setCodename(data.value);
                    setSelectedModelPreset(data.value);
                  }}
                  placeholder="手动输入机型代号 (如 houji, fuxi, dada...)"
                  contentBefore={<Search24Regular />}
                />
              </div>

              {/* 地区版本 */}
              <div className={styles.filterItem}>
                <span className={styles.filterItemLabel}>地区版本 (Region)</span>
                <div className={styles.segmentedPillContainer}>
                  {[
                    { id: "cn", label: "国内版 (CN)" },
                    { id: "global", label: "国际版 (Global)" },
                    { id: "eea", label: "欧洲版 (EEA)" },
                    { id: "ru", label: "俄罗斯 (RU)" },
                    { id: "in", label: "印度版 (IN)" },
                    { id: "tw", label: "台湾版 (TW)" },
                    { id: "all", label: "全部地区" },
                  ].map((r) => {
                    const active = selectedRegion === r.id;
                    return (
                      <div
                        key={r.id}
                        className={`${styles.segmentedPill} ${active ? styles.segmentedPillActive : ""}`}
                        onClick={() => setSelectedRegion(r.id)}
                      >
                        {r.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 版本分支 */}
              <div className={styles.filterItem}>
                <span className={styles.filterItemLabel}>版本分支 (Branch)</span>
                <div className={styles.segmentedPillContainer}>
                  {[
                    { id: "all", label: "全部分支" },
                    { id: "Stable", label: "正式版 (Stable)" },
                    { id: "Beta", label: "内测/开发版 (Beta)" },
                  ].map((b) => {
                    const active = selectedBranch === b.id;
                    return (
                      <div
                        key={b.id}
                        className={`${styles.segmentedPill} ${active ? styles.segmentedPillActive : ""}`}
                        onClick={() => setSelectedBranch(b.id)}
                      >
                        {b.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 系统版本动态支持列表 */}
              <div className={styles.filterItem}>
                <div className={styles.filterItemLabel}>
                  <span>系统版本</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isLoadingVersions ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--colorBrandForeground1)" }}>
                        <Spinner size="tiny" /> 检索支持版本...
                      </span>
                    ) : supportedVersions.length > 0 ? (
                      <Badge size="small" appearance="tint" color="brand">
                        {supportedVersions.length} 个版本支持
                      </Badge>
                    ) : null}
                    <Button
                      appearance="subtle"
                      size="small"
                      style={{ padding: "0 4px", minWidth: "auto", fontSize: "11px", height: "18px" }}
                      onClick={() => setIsCustomVersion(!isCustomVersion)}
                    >
                      {isCustomVersion ? "选择版本" : "手动输入"}
                    </Button>
                  </div>
                </div>

                {!isCustomVersion ? (
                  <Select
                    value={versionFilter}
                    onChange={(_, data) => setVersionFilter(data.value)}
                    disabled={isLoadingVersions}
                  >
                    <option value="">-- 全部版本 (最新优先) --</option>
                    {supportedVersions.map((v) => (
                      <option key={`${v.version}-${v.method || ""}`} value={v.version}>
                        {v.displayName}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={versionFilter}
                    onChange={(_, data) => setVersionFilter(data.value)}
                    placeholder="输入版本关键字 (如 OS1.0, OS2.0, V14)..."
                    contentBefore={<Search24Regular />}
                  />
                )}
              </div>

              {/* 打包方式 */}
              <div className={styles.filterItem}>
                <span className={styles.filterItemLabel}>打包方式</span>
                <Select
                  value={methodFilter}
                  onChange={(_, data) => setMethodFilter(data.value as any)}
                >
                  <option value="all">全部类型 (卡刷 + 线刷)</option>
                  <option value="Fastboot">线刷包 (.tgz)</option>
                  <option value="Recovery">卡刷包 (.zip)</option>
                </Select>
              </div>
            </div>

            <div className={styles.filterActions}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                支持检索当前机型代号全量历史版本及 BigOTA 官方直链；切换地区与分支将自动更新支持版本列表
              </Text>

              <Button
                appearance="primary"
                icon={loading ? <Spinner size="tiny" /> : <Search24Regular />}
                onClick={() => handleSearchXiaomi(false)}
                disabled={loading}
                style={{ borderRadius: "9999px", padding: "6px 20px" }}
              >
                {loading ? "检索固件中..." : "获取 ROM"}
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.collapsedBar}>
            <div className={styles.summaryTags}>
              <Badge appearance="tint" color="brand">机型: {codename || "未选择"}</Badge>
              <Badge appearance="outline">
                地区: {selectedRegion === "all" ? "全部地区" : selectedRegion.toUpperCase()}
              </Badge>
              <Badge appearance="outline">
                分支: {selectedBranch === "all" ? "全部分支" : selectedBranch}
              </Badge>
              <Badge appearance="outline">
                版本: {versionFilter || "全部版本"}
              </Badge>
              <Badge appearance="outline">
                打包: {methodFilter === "all" ? "全部类型" : methodFilter}
              </Badge>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button size="small" appearance="secondary" icon={<Filter24Regular />} onClick={() => setIsFilterExpanded(true)}>
                展开修改筛选
              </Button>
              <Button size="small" icon={<ArrowSync24Regular />} onClick={() => handleSearchXiaomi(true)} disabled={loading} title="刷新" />
            </div>
          </div>
        )
      )}

      {/* 2. OPPO / 一加 / 真我 专用筛选栏 */}
      {(selectedBrand === "oppo" || selectedBrand === "oneplus" || selectedBrand === "realme") && (
        <div className={styles.filterCard}>
          <div className={styles.filterHeaderRow}>
            <div className={styles.filterSectionTitle}>
              <Filter24Regular style={{ color: "var(--colorBrandForeground1)" }} />
              <span>
                {BRAND_TABS.find((t) => t.id === selectedBrand)?.label} 固件版本筛选
              </span>
            </div>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => {
                setOtherBrandModel("");
                setOtherBrandPreset("");
                setOtherVersionFilter("");
              }}
            >
              重置条件
            </Button>
          </div>

          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <span className={styles.filterItemLabel}>机型预设快捷选择</span>
              <Select
                value={otherBrandPreset}
                onChange={(_, data) => {
                  setOtherBrandPreset(data.value);
                  setOtherBrandModel(data.value);
                }}
              >
                <option value="">-- 选择机型预设 --</option>
                {multiBrandRomService.getDevicePresets(selectedBrand).map((dev) => (
                  <option key={dev.model} value={dev.model}>
                    {dev.series} · {dev.name} ({dev.model})
                  </option>
                ))}
              </Select>
            </div>

            <div className={styles.filterItem}>
              <span className={styles.filterItemLabel}>型号 / 关键词过滤</span>
              <Input
                value={otherBrandModel}
                onChange={(_, d) => setOtherBrandModel(d.value)}
                placeholder="输入型号 (如 PKB110, PJZ110, GT7)..."
                contentBefore={<Search24Regular />}
              />
            </div>

            <div className={styles.filterItem}>
              <div className={styles.filterItemLabel}>
                <span>系统版本支持列表</span>
                {supportedOtherVersions.length > 0 && (
                  <Badge size="small" appearance="tint" color="brand">
                    {supportedOtherVersions.length} 个版本
                  </Badge>
                )}
              </div>
              {supportedOtherVersions.length > 0 ? (
                <Select
                  value={otherVersionFilter}
                  onChange={(_, d) => setOtherVersionFilter(d.value)}
                >
                  <option value="">-- 全部系统版本 --</option>
                  {supportedOtherVersions.map((v) => (
                    <option key={v.version} value={v.version}>
                      {v.displayName}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={otherVersionFilter}
                  onChange={(_, d) => setOtherVersionFilter(d.value)}
                  placeholder={
                    selectedBrand === "oppo"
                      ? "如 15.0, 14.0..."
                      : selectedBrand === "oneplus"
                      ? "如 ColorOS 15, OxygenOS..."
                      : "如 6.0, 5.0..."
                  }
                />
              )}
            </div>
          </div>

          <div className={styles.filterActions}>
            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
              官方 OTA 全量直链与售后救砖 Fastboot 包已对齐，支持极速分流与多线路 CDN 镜像
            </Text>
          </div>
        </div>
      )}

      {/* 3. 类原生 (AOSP) 专用筛选栏 */}
      {selectedBrand === "aosp" && (
        <div className={styles.filterCard}>
          <div className={styles.filterHeaderRow}>
            <div className={styles.filterSectionTitle}>
              <Globe24Regular style={{ color: "var(--colorBrandForeground1)" }} />
              <span>类原生开源定制项目</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--colorNeutralForeground2)" }}>
              开源项目:
            </span>
            <div className={styles.segmentedPillContainer}>
              {AOSP_PROJECTS.map((proj) => {
                const active = selectedAospProject === proj.id;
                return (
                  <div
                    key={proj.id}
                    className={`${styles.segmentedPill} ${active ? styles.segmentedPillActive : ""}`}
                    onClick={() => setSelectedAospProject(proj.id)}
                  >
                    {proj.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "4px" }}>
            <Input
              style={{ flex: 1, maxWidth: "360px" }}
              placeholder="过滤适配机型代号 (如 houji, fuxi, alioth)..."
              value={otherBrandModel}
              onChange={(_, d) => setOtherBrandModel(d.value)}
              contentBefore={<Search24Regular />}
            />
            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
              收录热门设备官方认证构建，支持 SourceForge 官方源与国内清华/GitHub 加速镜像
            </Text>
          </div>
        </div>
      )}

      {/* 4. 奇葩小玩意 专用分类栏 */}
      {selectedBrand === "exotic" && (
        <div className={styles.filterCard}>
          <div className={styles.filterHeaderRow}>
            <div className={styles.filterSectionTitle}>
              <BookOpen24Regular style={{ color: "var(--colorBrandForeground1)" }} />
              <span>极客折腾镜像与跨界系统</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--colorNeutralForeground2)" }}>
              折腾分类:
            </span>
            <div className={styles.segmentedPillContainer}>
              {EXOTIC_CATEGORIES.map((cat) => {
                const active = selectedExoticCat === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`${styles.segmentedPill} ${active ? styles.segmentedPillActive : ""}`}
                    onClick={() => setSelectedExoticCat(cat.id)}
                  >
                    {cat.name}
                  </div>
                );
              })}
            </div>
          </div>
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)", paddingTop: "4px" }}>
            涵盖 Windows 11 on ARM、移动 Ubuntu/Debian Linux、车载中控、Kali 渗透系统与锤子拟物情怀移植，附折腾教程指南
          </Text>
        </div>
      )}

      {/* 结果检索条 */}
      {displayedItems.length > 0 && (
        <div className={styles.searchBarContainer}>
          <Input
            style={{ flex: 1, maxWidth: "360px" }}
            contentBefore={<Search24Regular />}
            placeholder="在当前列表中快速查找..."
            value={listSearchQuery}
            onChange={(_, d) => setListSearchQuery(d.value)}
          />
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            已列出 {displayedItems.length} 个固件或系统项目
          </Text>
        </div>
      )}

      {/* 结果列表区域：一行显示两个卡片 */}
      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.emptyState}>
            <Spinner size="large" label="正在连接官方固件库检索..." />
          </div>
        ) : displayedItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Info24Regular style={{ fontSize: "40px" }} />
            <Text weight="semibold">
              {selectedBrand === "xiaomi" && xiaomiRomList.length === 0
                ? "输入机型代号后点击【获取 ROM】以拉取官方系统包"
                : "未找到符合当前条件的固件或项目"}
            </Text>
            <Text size={200} style={{ maxWidth: "420px" }}>
              {selectedBrand === "xiaomi" && xiaomiRomList.length === 0
                ? "可选择上方快捷预设或直接点击【一键识别连接机型并切换】。"
                : "可尝试清空筛选限制，或在上方切换至其他品牌与生态。"}
            </Text>
          </div>
        ) : (
          <div className={styles.romGrid}>
            {displayedItems.map((rom, idx) => {
              const isRecovery = rom.method === "Recovery";
              const isFastboot = rom.method === "Fastboot";

              return (
                <div
                  key={`${rom.id}-${idx}`}
                  className={styles.romCard}
                  onClick={() => handleOpenDetailModal(rom)}
                >
                  <div className={styles.cardTopRow}>
                    <Text weight="bold" size={300} style={{ color: "var(--colorBrandForeground1)" }}>
                      {rom.version}
                    </Text>
                    <div className={styles.cardBadges}>
                      <Badge appearance="outline" color={isRecovery ? "informative" : isFastboot ? "warning" : "brand"}>
                        {rom.method}
                      </Badge>
                      <Badge size="small" appearance="filled">
                        {rom.branch}
                      </Badge>
                    </div>
                  </div>

                  <div className={styles.cardModelInfo}>
                    <Text weight="semibold" size={300}>
                      {rom.name}
                    </Text>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                      代号/标识: {rom.codename} {rom.authorOrMaintainer ? `· ${rom.authorOrMaintainer}` : ""}
                    </Text>
                  </div>

                  <div className={styles.cardMetaPills}>
                    <span className={styles.metaPill}>
                      {rom.android.includes("Boot") ? rom.android : `Android ${rom.android}`}
                    </span>
                    <span className={styles.metaPill}>
                      大小: {rom.size}
                    </span>
                    <span className={styles.metaPill}>
                      日期: {rom.date}
                    </span>
                  </div>

                  <div className={styles.cardBottomRow}>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                      {rom.mirrors.length > 0 ? `支持 ${rom.mirrors.length} 条加速镜像线路` : "官方直链分发"}
                    </Text>
                    <Button
                      size="small"
                      appearance="primary"
                      icon={<ArrowDownload24Regular />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailModal(rom);
                      }}
                    >
                      详情与下载
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 统一 ROM 详情弹窗：支持切换服务商（镜像）与下载操作 */}
      <Dialog
        open={!!detailModalItem}
        onOpenChange={(_, d) => !d.open && setDetailModalItem(null)}
      >
        <DialogSurface className={styles.detailDialogSurface}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                  onClick={() => setDetailModalItem(null)}
                />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span>{detailModalItem?.version}</span>
                <Badge appearance="outline" color="brand">
                  {detailModalItem?.method}
                </Badge>
                <Badge size="small" appearance="filled">
                  {detailModalItem?.branch}
                </Badge>
              </div>
            </DialogTitle>
            <DialogContent className={styles.detailContent}>
              {detailModalItem && (
                <>
                  <div className={styles.detailMetaGrid}>
                    <div className={styles.detailMetaItem}>
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>适配机型 / 项目</span>
                      <Text weight="semibold">{detailModalItem.name} ({detailModalItem.codename})</Text>
                    </div>
                    <div className={styles.detailMetaItem}>
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>系统版本 / 构建号</span>
                      <Text weight="semibold" style={{ color: "var(--colorBrandForeground1)" }}>
                        {detailModalItem.version}
                      </Text>
                    </div>
                    <div className={styles.detailMetaItem}>
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>底层基准 / 架构</span>
                      <Text weight="medium">{detailModalItem.android}</Text>
                    </div>
                    <div className={styles.detailMetaItem}>
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>固件大小</span>
                      <Text weight="medium">{detailModalItem.size}</Text>
                    </div>
                    <div className={styles.detailMetaItem}>
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>发布时间</span>
                      <Text weight="medium">{detailModalItem.date}</Text>
                    </div>
                    <div className={styles.detailMetaItem}>
                      <span style={{ color: "var(--colorNeutralForeground3)" }}>维护团队 / 作者</span>
                      <Text weight="medium">{detailModalItem.authorOrMaintainer || "官方维护"}</Text>
                    </div>
                    {detailModalItem.description && (
                      <div className={styles.detailMetaItem} style={{ gridColumn: "span 2" }}>
                        <span style={{ color: "var(--colorNeutralForeground3)" }}>说明简介</span>
                        <Text size={200}>{detailModalItem.description}</Text>
                      </div>
                    )}
                  </div>

                  {/* 服务商 / 镜像线路选择 */}
                  {detailModalItem.mirrors.length > 0 && (
                    <div className={styles.mirrorContainer}>
                      <div className={styles.mirrorHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Text weight="semibold" size={300}>
                            服务商加速线路
                          </Text>
                          <Badge size="small" appearance="tint" color="informative">
                            共 {detailModalItem.mirrors.length} 个可用分流镜像
                          </Badge>
                        </div>
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                          遇到卡顿可自由切换节点
                        </Text>
                      </div>

                      <div className={styles.mirrorPills}>
                        {detailModalItem.mirrors.map((m) => {
                          const active = m.id === selectedMirrorId;
                          return (
                            <div
                              key={m.id}
                              className={`${styles.mirrorPill} ${active ? styles.mirrorPillActive : ""}`}
                              onClick={() => setSelectedMirrorId(m.id)}
                            >
                              <span>{m.name}</span>
                              <Badge
                                size="small"
                                appearance={active ? "filled" : "outline"}
                                color={m.badge === "推荐" ? "brand" : "subtle"}
                              >
                                {m.badge}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>

                      {activeMirror && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                            {activeMirror.desc}
                          </Text>
                          <div className={styles.mirrorUrlBox}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {activeDownloadUrl}
                            </span>
                            <Tooltip content="复制该镜像线路直链" relationship="description">
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<Copy24Regular style={{ fontSize: "14px" }} />}
                                onClick={() => handleCopyLink(activeDownloadUrl)}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions style={{ flexWrap: "wrap", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {detailModalItem?.tutorialUrl && (
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<BookOpen24Regular />}
                    onClick={() => handleOpenBrowser(detailModalItem.tutorialUrl!)}
                  >
                    查看折腾教程指南
                  </Button>
                )}
                {detailModalItem?.method === "Recovery" && selectedBrand === "xiaomi" && (
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Sparkle24Regular />}
                    onClick={() => {
                      setExtractModalItem(detailModalItem as any);
                      setExtractedFile(null);
                      setExtractStatus("");
                      setExtractProgress(0);
                    }}
                  >
                    流式提取镜像
                  </Button>
                )}
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<DocumentChevronDouble24Regular />}
                  onClick={() => handleJumpToRomManager(activeDownloadUrl)}
                >
                  载入ROM管理
                </Button>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Open24Regular />}
                  onClick={() => handleOpenBrowser(activeDownloadUrl)}
                >
                  浏览器下载
                </Button>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <Button
                  appearance="secondary"
                  icon={<Copy24Regular />}
                  onClick={() => handleCopyLink(activeDownloadUrl)}
                >
                  复制直链
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleAddToDownloadManager}
                >
                  添加到下载管理
                </Button>
              </div>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 流式提取镜像弹窗 (小米 Recovery 包专属) */}
      <Dialog
        open={!!extractModalItem}
        onOpenChange={(_, data) => !isExtracting && !data.open && setExtractModalItem(null)}
      >
        <DialogSurface style={{ maxWidth: "520px" }}>
          <DialogBody>
            <DialogTitle>流式提取指定镜像 ({extractModalItem?.version})</DialogTitle>
            <DialogContent className={styles.modalContent}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                借助 HTTP Range 断点续传切片技术，无需完整下载数 GB 的全量包，即可在线秒级提取内部指定分区镜像。
              </Text>
              <Field label="目标提取分区">
                <Select value={targetPartition} onChange={(_, data) => setTargetPartition(data.value)} disabled={isExtracting}>
                  <option value="boot">boot (内核引导/Magisk修补)</option>
                  <option value="init_boot">init_boot (Android 13+ 内核引导/Root)</option>
                  <option value="recovery">recovery (恢复模式)</option>
                  <option value="vbmeta">vbmeta (启动完整性验证)</option>
                </Select>
              </Field>
              <Field label="输出保存目录">
                <Input value={outputDir} onChange={(_, d) => setOutputDir(d.value)} disabled={isExtracting} />
              </Field>
              {(isExtracting || extractedFile || extractStatus) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", borderRadius: "8px", backgroundColor: "var(--colorNeutralBackground3)" }}>
                  <Text weight="medium" size={200}>
                    {extractedFile ? "提取完成！" : isExtracting ? "正在在线切片提取..." : "状态"}
                  </Text>
                  {isExtracting && <ProgressBar value={extractProgress / 100} />}
                  <Text size={200}>{extractedFile ? `已保存至: ${extractedFile}` : extractStatus}</Text>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={isExtracting} onClick={() => setExtractModalItem(null)}>
                关闭
              </Button>
              <Button
                appearance="primary"
                disabled={isExtracting}
                icon={isExtracting ? <Spinner size="tiny" /> : <Sparkle24Regular />}
                onClick={async () => {
                  if (!extractModalItem) return;
                  setIsExtracting(true);
                  setExtractProgress(0);
                  setExtractStatus("初始化 Range 连接...");
                  try {
                    const saved = await invoke<string>("extract_online_partition", {
                      url: extractModalItem.link,
                      partName: targetPartition.trim(),
                      outDir: outputDir,
                    });
                    setExtractedFile(saved);
                  } catch (e: any) {
                    setExtractStatus(`提取失败: ${e.message || String(e)}`);
                  } finally {
                    setIsExtracting(false);
                  }
                }}
              >
                {isExtracting ? "提取中..." : "开始提取"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default RomDownloadCenterCard;
