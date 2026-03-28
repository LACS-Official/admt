import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  makeStyles,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
  Text,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  tokens,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Settings24Regular,
  CloudArrowUp24Regular,
  CloudArrowDown24Regular,
  Home24Regular,
  Icons24Regular,
  Notepad24Regular,
  ChevronDown24Regular,
  Warning24Regular,
  ShieldKeyhole24Regular,
  Wifi124Regular,
  Wrench24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
// import DeviceSelectionDialog from "./DeviceSelectionDialog";
import { getDeviceIcon } from "../../assets/icons";
import UnlinkIcon from "../../assets/icons/devices/Unlink.gif";
import { useAppStore } from "../../stores/appStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { useThemeStore } from "../../stores/themeStore";
import { useDeviceService } from "../../services/deviceService";
import { AppView } from "../../types/app";
import HomePage from "../Home/HomePage";
import AdbZonePanel from "../AdbTools/AdbZonePanel";
import FlashZonePanel from "../FlashZone/FlashZonePanel";
import ExtendedFeaturesPanel from "../ExtendedFeatures/ExtendedFeaturesPanel";
import OnlineZonePanel from "../OnlineResources/OnlineZonePanel";
import SettingsPanel from "../Settings/SettingsPanel";
import CarouselComponent from "./CarouselComponent";
import VersionChecker from "../Common/VersionChecker";
import RootPanel from "../Root/RootPanel";
import WirelessDebuggingPanel from "../AdbTools/WirelessDebuggingPanel";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import AutoMirrorManager from "../Common/AutoMirrorManager";

import { usageTrackingService } from "../../services/usageTrackingService";
import { systemTrayManager } from "../../services/systemTrayManager";

const useStyles = makeStyles({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    height: "100vh",
    backgroundColor: "var(--colorNeutralBackground1)",
    gap: "1px", // 添加分隔线效果
  },
  sidebar: {
    width: "180px", // 增加宽度
    maxWidth: "250px",
    backgroundColor: "var(--colorNeutralBackground2)", // 使用更深的背景色
    borderRight: "1px solid var(--colorNeutralStroke3)", // 更淡的边框
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "2px 0 16px rgba(0, 0, 0, 0.08)", // 更现代的阴影
    position: "relative",
    zIndex: 10,
    // 添加渐变背景
    background:
      "linear-gradient(180deg, var(--colorNeutralBackground2) 0%, var(--colorNeutralBackground1) 100%)",
  },
  deviceInfo: {
    padding: tokens.spacingHorizontalXS, // 增加内边距
    borderBottom: "1px solid var(--colorNeutralStroke3)", // 更淡的边框
    backdropFilter: "blur(10px)", // 毛玻璃效果
    overflow: "hidden",
    minHeight: "auto",
    position: "relative",
    boxSizing: "border-box",
    margin: tokens.spacingHorizontalS, // 添加外边距
    borderRadius: "8px", // 添加圆角
  },
  deviceInfoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // 半透明背景
    backdropFilter: "blur(2px)", // 模糊效果
    zIndex: 100, // 确保在最上层
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "all 0.2s ease",
    cursor: "pointer",
    borderRadius: "8px",

    "&:hover": {
      opacity: 1,
    },
  },
  deviceInfoOverlayText: {
    color: "white",
    fontSize: "13px",
    fontWeight: "600",
    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(4px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  deviceInfoContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2px", // 进一步减少间距
    width: "100%",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  deviceInfoTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "2px", // 进一步减少间距
    width: "100%",
    overflow: "hidden",
    marginBottom: tokens.spacingVerticalXS, // 减少底部间距
    borderRadius: "8px", // 添加圆角
    padding: tokens.spacingHorizontalXS, // 添加内边距
  },
  deviceSelectorArea: {
    width: "100%",
    marginTop: "2px",
  },
  deviceSelectCard: {
    width: "100%",
    padding: tokens.spacingHorizontalS,
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      border: "1px solid var(--colorNeutralStroke1)",
    },
  },
  deviceSelectCardContent: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flex: 1,
  },
  deviceSelectCardText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  deviceSelectCardTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  deviceSelectCardSubtitle: {
    fontSize: "10px",
    color: "var(--colorNeutralForeground3)",
  },
  noDeviceCard: {
    width: "100%",
    padding: tokens.spacingHorizontalM,
    border: "1px solid var(--colorNeutralStroke3)",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalS,
    cursor: "not-allowed",
  },
  noDeviceCardText: {
    fontSize: "14px",
    color: "var(--colorNeutralForeground3)",
  },
  deviceIconSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "auto", // 改为自动高度
    minHeight: "120px", // 设置最小高度以匹配文字信息区域
    flexShrink: 0,
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    marginLeft: tokens.spacingHorizontalXS, // 添加外边距
  },
  deviceSerialSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  deviceSerial: {
    fontSize: "10px",
    color: "var(--colorNeutralForeground3)",
    fontFamily: "monospace",
  },
  deviceSelector: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  deviceSelectorWrapper: {
    width: "100%",
  },
  deviceSelectDropdown: {
    width: "100%",
    maxWidth: "100%",
    minWidth: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: tokens.spacingHorizontalXS,
    minHeight: "20px",
    textAlign: "center",
    padding: tokens.spacingHorizontalXS,
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    color: "var(--colorNeutralForeground1)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  deviceTextInfo: {
    marginTop: tokens.spacingVerticalS,
    marginLeft: tokens.spacingHorizontalM,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px", // 进一步减少间距
    overflow: "hidden",
    minWidth: 0,
    padding: "0", // 移除内边距
    boxSizing: "border-box",
  },
  deviceNameSection: {
    marginBottom: "4px",
  },
  deviceName: {
    fontSize: "16px", // 进一步减小字体
    fontWeight: "600",
    color: "var (--colorNeutralForeground1)",
    lineHeight: "1.2",
    maxWidth: "100%",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: "4px", // 移除底部间距
  },
  deviceCodename: {
    fontSize: "12px", // 进一步减小字体
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.1",
    maxWidth: "100%",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    fontFamily: "monospace",
    marginTop: "4px", // 增加顶部间距
  },
  deviceStatusSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statusBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    minWidth: 0,
    marginTop: "4px", // 增加顶部间距
  },
  statusLabel: {
    fontSize: "9px",
    color: "var(--colorNeutralForeground2)",
    minWidth: "24px",
    flexShrink: 0,
  },
  compactBadge: {
    fontSize: "10px", // 稍微增大字体
    padding: "3px 6px", // 增加内边距
    minHeight: "18px", // 增加高度
    borderRadius: "8px", // 更圆润的边角
    fontWeight: "500", // 增加字重
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // 添加微妙阴影
    width: "80px", // 自适应宽度
  },

  deviceInfoHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "0",
  },
  deviceIcon: {
    color: "var(--colorBrandForeground1)",
  },
  deviceIconImage: {
    width: "95px", // 增加宽度以更好地填充容器
    height: "100%", // 高度填充整个容器
    maxHeight: "88px", // 设置最大高度，留出容器内边距空间
    borderRadius: "4px",
    objectFit: "contain", // 保持图片比例
    flexShrink: 0,
  },

  deviceTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.2",
  },
  deviceDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  deviceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    minWidth: 0, // 允许收缩
    overflow: "hidden",
  },
  deviceLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    minWidth: "40px",
    flexShrink: 0, // 防止标签被压缩
  },
  deviceValue: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground2)",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0, // 允许收缩
    maxWidth: "120px", // 限制最大宽度
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  noDevice: {
    padding: "12px",
    borderBottom: "1px solid var(--colorNeutralStroke3)",
    backgroundColor: "var(--colorNeutralBackground2)",
    textAlign: "center",
  },
  noDeviceIcon: {
    color: "var(--colorNeutralForeground3)",
    marginBottom: "4px",
  },
  noDeviceText: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  // 无设备状态的新样式
  noDeviceBackgroundImage: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    opacity: 0.6,
  },
  noDeviceMessageSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    justifyContent: "center",
    height: "100%",
    minHeight: "80px", // 与图片高度保持一致
  },
  noDeviceTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground2)",
    lineHeight: "1.2",
  },
  noDeviceSubtitle: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.3",
    wordBreak: "break-word",
  },
  sidebarHeader: {
    padding: "12px 16px 10px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    marginBottom: "8px",
    position: "relative",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",

    // Add a subtle gradient overlay
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: "-8px",
      left: 0,
      right: 0,
      height: "8px",
      background:
        "linear-gradient(to bottom, var(--colorNeutralBackground1), transparent)",
      pointerEvents: "none",
      zIndex: 1,
    },
  },
  tabList: {
    backgroundColor: "transparent",
    padding: "8px 10px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
    scrollBehavior: "smooth",
    scrollPaddingTop: "8px",
    scrollPaddingBottom: "16px",

    // Enhanced scrollbar styling
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "var(--colorNeutralBackground1)",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "var(--colorNeutralStroke2)",
      borderRadius: "4px",
      "&:hover": {
        background: "var(--colorNeutralStroke1)",
      },
    },
  },
  tab: {
    width: "100%",
    justifyContent: "flex-start",
    padding: "10px 12px", // Increased padding for better touch targets
    borderRadius: "8px",
    minHeight: "42px", // Increased height for better visibility
    maxWidth: "92%",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", // Smoother transition
    position: "relative",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground2)",
    cursor: "pointer",
    overflow: "hidden",
    boxSizing: "border-box",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)", // Subtle shadow for depth

    // Icon styles
    "& .fui-Tab__icon": {
      color: "var(--colorNeutralForeground3)",
      fontSize: "16px", // Slightly larger icons
      marginRight: "8px",
      transition: "all 0.2s ease",
      flexShrink: 0,
    },

    // Hover state
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2)",
      color: "var(--colorNeutralForeground1)",
      transform: "translateY(-1px)",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",

      "& .fui-Tab__icon": {
        color: "var(--colorBrandForeground1)",
        transform: "scale(1.05)",
      },
    },

    // Selected state
    "&[aria-selected='true']": {
      backgroundColor: "var(--colorBrandBackground2)",
      color: "var(--colorBrandForeground1)",
      border: "1px solid var(--colorBrandStroke2)",
      fontWeight: "600",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      paddingLeft: "16px", // Indent selected tab

      "& .fui-Tab__icon": {
        color: "var(--colorBrandForeground1)",
        transform: "scale(1.1)",
      },

      // Left indicator for selected tab
      "&::before": {
        content: '""',
        position: "absolute",
        left: "0",
        top: "50%",
        transform: "translateY(-50%)",
        width: "4px",
        height: "70%",
        backgroundColor: "var(--colorBrandForeground1)",
        borderRadius: "0 3px 3px 0",
        transition: "all 0.3s ease",
      },

      // Add subtle pulse animation on selection
      "@media (prefers-reduced-motion: no-preference)": {
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },

    // 简化活跃状态
    "&:active": {
      transform: "scale(0.98)",
    },
  },
  carouselContainer: {
    padding: "8px", // 减少内边距
    marginTop: "auto",
    borderTop: "1px solid var(--colorNeutralStroke2)", // 简化边框
    backgroundColor: "var(--colorNeutralBackground1)",
    position: "relative",
    boxSizing: "border-box",
  },
  buttonGroupContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px",
    maxHeight: "50px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxSizing: "border-box",
  },
  actionButton: {
    flex: 1,
    height: "34px",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    color: "var(--colorNeutralForeground2)",
    gap: "6px", // 添加图标和文字之间的间距

    "&:hover": {
      backgroundColor: "var(--colorBrandBackground2)",
      color: "var(--colorBrandForeground1)",
    },

    "&:active": {
      transform: "scale(0.98)",
    },
  },
  actionButtonSelected: {
    backgroundColor: "var(--colorBrandBackground1)",
    color: "var(--colorBrandForeground1)",
    border: "1px solid var(--colorBrandStroke1)",
  },
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "var(--colorNeutralBackground2)",
    position: "relative",

    // 添加微妙的纹理效果
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        "radial-gradient(circle at 50% 50%, var(--colorNeutralBackground2) 0%, transparent 70%)",
      opacity: 0.3,
      pointerEvents: "none",
    },
  },
  openConsoleButton: {
    // 增加一个明显的样式区分，或者保持 consistency
  }
});

const MainContent: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const currentView = useAppStore((state) => state.currentView);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const config = useAppStore((state) => state.config);
  const setStatusBarMessage = useAppStore((state) => state.setStatusBarMessage);
  const isWirelessDebuggingDialogOpen = useAppStore((state) => state.isWirelessDebuggingDialogOpen);
  const setWirelessDebuggingDialogOpen = useAppStore((state) => state.setWirelessDebuggingDialogOpen);

  const selectedDevice = useDeviceStore((state) => state.selectedDevice);
  const devices = useDeviceStore((state) => state.devices);
  const selectDevice = useDeviceStore((state) => state.selectDevice);

  const showConfetti = useThemeStore((state) => state.showConfetti);

  const tabs = [
    {
      id: "home" as AppView,
      label: t("sidebar.home"),
      icon: <Home24Regular />,
    },
    {
      id: "adb-zone" as AppView,
      label: t("sidebar.system_zone"),
      icon: <Code24Regular />,
    },
    {
      id: "flash-zone" as AppView,
      label: t("sidebar.flash_zone"),
      icon: <CloudArrowUp24Regular />,
    },
    {
      id: "online-resources" as AppView,
      label: t("sidebar.online_resources"),
      icon: <CloudArrowDown24Regular />,
    },
    {
      id: "root" as AppView,
      label: t("sidebar.root_zone"),
      icon: <ShieldKeyhole24Regular />,
    },
    {
      id: "settings" as AppView,
      label: t("sidebar.settings"),
      icon: <Settings24Regular />,
    },
  ];
  const { startScanning, stopScanning, refreshDeviceInfo } = useDeviceService();
  const prevConnectedCount = useRef<number>(0);
  const isOpeningWindowRef = useRef(false);

  // 版本检查相关状态
  const [triggerVersionCheck, setTriggerVersionCheck] = useState(false);
  const [updateCheckCompleted, setUpdateCheckCompleted] = useState(false);

  // 设备选择弹窗状态
  const [isDeviceSelectionDialogOpen, setIsDeviceSelectionDialogOpen] =
    useState(false);

  // 离线弹窗状态
  const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);

  // 未授权弹窗状态
  const [isUnauthorizedDialogOpen, setIsUnauthorizedDialogOpen] =
    useState(false);

  // 全局设备扫描 - 根据配置控制是否启用和扫描间隔
  useEffect(() => {
    if (config.autoDetectDevices) {
      // startScanning 内部已有 isScanningNow 检查，不会重复启动
      startScanning();
    } else {
      stopScanning();
    }
    // 页面内保持扫描运行，不随 useEffect 清理而停止
  }, [
    config.autoDetectDevices,
    config.scanInterval,
    startScanning,
    stopScanning,
  ]);

  // 监听设备状态变化，检测离线和未授权设备
  useEffect(() => {
    if (selectedDevice) {
      if (selectedDevice.mode === "offline") {
        setIsOfflineDialogOpen(true);
        setStatusBarMessage({
          type: "warning",
          message: t("status.device_offline"),
        });
      } else if (selectedDevice.mode === "unauthorized") {
        setIsUnauthorizedDialogOpen(true);
        setStatusBarMessage({
          type: "warning",
          message: t("status.device_unauthorized"),
        });
      }
    }
  }, [selectedDevice]);

  // 监听设备连接/断开，提示状态栏消息
  useEffect(() => {
    const connectedCount = devices.filter((d) => d.connected).length;
    const prev = prevConnectedCount.current;

    if (prev === 0 && connectedCount > 0) {
      // 首次检测到设备
      setStatusBarMessage({
        type: "success",
        message:
          connectedCount === 1
            ? t("status.device_detected_single")
            : t("status.device_detected_multiple", { count: connectedCount }),
      });
    } else if (prev > 0 && connectedCount === 0) {
      // 所有设备断开
      setStatusBarMessage({
        type: "warning",
        message: t("status.device_disconnected"),
      });
    } else if (connectedCount < prev && connectedCount > 0) {
      // 有设备断开但仍有设备连接
      setStatusBarMessage({
        type: "warning",
        message: t("status.device_disconnected_some"),
      });
    } else if (connectedCount > prev && prev > 0) {
      // 新增设备连接
      setStatusBarMessage({
        type: "success",
        message: t("status.device_new_connected"),
      });
    }

    prevConnectedCount.current = connectedCount;
  }, [devices]);

  // 当选择设备时自动获取设备属性
  useEffect(() => {
    if (
      selectedDevice &&
      selectedDevice.connected &&
      !selectedDevice.properties
    ) {
      setStatusBarMessage({
        type: "info",
        message: t("status.fetching_device_info"),
      });
      refreshDeviceInfo(selectedDevice.serial);
    }
  }, [selectedDevice, refreshDeviceInfo]);


  // 用户行为追踪 - 在MainContent组件挂载时发送使用数据（备用方案）
  useEffect(() => {
    const trackMainContentEntry = async () => {
      // 启动流程已经处理了 trackMainPageEntry
      console.log("🏢 MainContent 已挂载");
    };

    console.log("🏢 MainContent useEffect 被触发");
    trackMainContentEntry();

    // 首次进入应用的庆祝彩带 (如果刚刚同意了隐私政策，且开启了设置)
    const celebrationDone = sessionStorage.getItem(
      "app_entrance_celebration_done",
    );
    if (!celebrationDone && showConfetti) {
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          zIndex: 10000,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          zIndex: 10000,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      // 稍微延迟一下，确保主页面已经完全稳定并显示在最上层
      // 这里的 1200ms 大于 StartupTransition 的过渡时间 (800ms)
      setTimeout(() => {
        // 再次检查确认没执行过，避免重复
        if (!sessionStorage.getItem("app_entrance_celebration_done")) {
          frame();
          sessionStorage.setItem("app_entrance_celebration_done", "true");
        }
      }, 1200);
    }
  }, [showConfetti]); // 允许 showConfetti 变化时触发，但 sessionStorage 会确保本会话只执行一次

  // 系统托盘初始化 - 单例模式管理，确保只在应用启动时初始化一次
  useEffect(() => {
    const initializeSystemTray = async () => {
      try {
        // 检查是否已经初始化，避免重复初始化
        if (
          !systemTrayManager.isReady() &&
          !systemTrayManager.isInitializingNow()
        ) {
          await systemTrayManager.initialize({
            systemTrayEnabled: config.systemTrayEnabled,
            minimizeToTrayOnClose: config.minimizeToTrayOnClose,
          });
        }
      } catch (error) {
        console.error("系统托盘初始化失败:", error);
      }
    };

    initializeSystemTray();

    // 清理函数
    return () => {
      // 注意：这里不清理托盘，因为托盘应该在应用生命周期内保持存在
      // 只有在应用退出时才需要清理托盘
    };
  }, []); // 只在组件挂载时执行一次

  // 监听配置变化，更新系统托盘行为
  useEffect(() => {
    const updateTrayConfig = async () => {
      try {
        await systemTrayManager.updateConfig({
          systemTrayEnabled: config.systemTrayEnabled,
          minimizeToTrayOnClose: config.minimizeToTrayOnClose,
        });
      } catch (error) {
        console.error("更新系统托盘配置失败:", error);
      }
    };

    updateTrayConfig();
  }, [config.systemTrayEnabled, config.minimizeToTrayOnClose]);

  // 进入主页面时不再自动触发版本检查，除非确实没有完成（这已经在 StartupFlow 处理）
  useEffect(() => {
    // 这里仅作为兜底，如果因为某些原因 StartupFlow 没完成检查
    if (!updateCheckCompleted) {
      const timer = setTimeout(() => {
        // 如果是生产环境且未完成检查，则触发一次
        // 但建议保持手动触发或依赖 StartupFlow
        // console.log("🔄 开始自动检测更新...");
        // setTriggerVersionCheck(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateCheckCompleted]);

  // 处理版本检查完成
  const handleUpdateCheckComplete = () => {
    console.log("✅ 版本检查完成");
    setUpdateCheckCompleted(true);
    setTriggerVersionCheck(false);
  };

  const handleTabSelect = useCallback(
    (_event: SelectTabEvent, data: SelectTabData) => {
      if (data.value && data.value !== currentView) {
        setCurrentView(data.value as AppView);
      }
    },
    [currentView, setCurrentView],
  );

  const openDeviceSelectionWindow = useCallback(async () => {
    if (isOpeningWindowRef.current) return;
    isOpeningWindowRef.current = true;

    try {
      const label = 'device-selection';
      const title = '玩机管家 - 设备选择';
      
      let targetWindow = await WebviewWindow.getByLabel(label);
      
      if (targetWindow) {
        // 如果已存在，先尝试聚焦，忽略可能的琐碎错误
        try {
          await targetWindow.unminimize();
          await targetWindow.show();
          await targetWindow.setFocus();
        } catch (e) {
          console.warn("主应用聚焦已有设备选择窗口失败(非关键):", e);
        }
      } else {
        const url = `${window.location.origin}/index.html`;
        
        targetWindow = new WebviewWindow(label, {
          url: url,
          title: title,
          width: 500,
          height: 450,
          minWidth: 400,
          minHeight: 300,
          resizable: true,
          decorations: false,
          center: true,
          alwaysOnTop: true,
        });

        targetWindow.once('tauri://created', function () {
          console.log(`${title} 窗口创建成功`);
          targetWindow.show();
        });

        targetWindow.once('tauri://error', function (e) {
          console.error(`${title} 窗口创建失败:`, e);
          // 仅在创建失败时设置状态消息
          setStatusBarMessage({
            type: 'error',
            message: '设备选择窗口创建失败'
          });
        });
      }
    } catch (error) {
      // 检查是否是由于并发导致的标签冲突，这种情况下不需要报错提示
      const errorStr = String(error);
      if (errorStr.includes("already exists") || errorStr.includes("Label already exists")) {
        console.warn("设备选择窗口已在创建或显示过程中:", error);
      } else {
        console.error("打开设备选择窗口过程中发生异常:", error);
        setStatusBarMessage({
          type: 'error',
          message: '打开设备选择窗口失败'
        });
      }
    } finally {
      // 这里的延迟是为了防止瞬时的多次点击
      setTimeout(() => {
        isOpeningWindowRef.current = false;
      }, 500);
    }
  }, [setStatusBarMessage]);

  const openConsoleWindow = useCallback(async (tab: 'logs' | 'command-line') => {
    if (isOpeningWindowRef.current) return;
    isOpeningWindowRef.current = true;

    try {
      // 检查窗口是否已存在
      const label = tab; // 使用 'logs' 或 'command-line' 作为直接 label
      const title = tab === 'command-line' ? '玩机管家 - 命令行' : '玩机管家 - 日志';
      
      let targetWindow = await WebviewWindow.getByLabel(label);
      
      if (targetWindow) {
        // 如果已存在，明确显示、将其置顶并聚焦
        try {
          await targetWindow.unminimize();
          await targetWindow.show();
          await targetWindow.setFocus();
        } catch (e) {
          console.warn("主应用聚焦已有窗口失败(非关键):", e);
        }
      } else {
        // 如果不存在，创建新窗口
        const url = `${window.location.origin}/index.html`; // 路由逻辑现在由 main.tsx 中的 label 处理
        
        targetWindow = new WebviewWindow(label, {
          url: url,
          title: title,
          width: 900,
          height: 700,
          minWidth: 800,
          minHeight: 600,
          decorations: false,
          center: true,
        });

        targetWindow.once('tauri://created', function () {
          console.log(`${title} 窗口创建成功`);
          targetWindow.show();
        });

        targetWindow.once('tauri://error', function (e) {
          console.error(`${title} 窗口创建失败:`, e);
          setStatusBarMessage({
            type: 'error',
            message: `${title}窗口创建失败`
          });
        });
      }
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes("already exists") || errorStr.includes("Label already exists")) {
        console.warn("窗口已在创建或显示过程中:", error);
      } else {
        console.error("打开控制台子窗口失败:", error);
        setStatusBarMessage({
          type: 'error',
          message: '打开控制台窗口失败'
        });
      }
    } finally {
      setTimeout(() => {
        isOpeningWindowRef.current = false;
      }, 500);
    }
  }, [setStatusBarMessage]);

  const handleDeviceSelect = (device: any) => {
    selectDevice(device);
  };

  const getDeviceMode = () => {
    switch (selectedDevice.mode) {
      case "sys":
        return t("device_mode.system");
      case "rec":
        return t("device_mode.recovery");
      case "fastboot":
        return t("device_mode.fastboot");
      case "fastbootd":
        return t("device_mode.fastbootd");
      case "sideload":
        return t("device_mode.sideload");
      case "edl":
        return t("device_mode.edl");
      case "unauthorized":
        return t("device_mode.unauthorized");
      case "offline":
        return t("device_mode.offline");
      default:
        return t("device_mode.unknown");
    }
  };

  const getDeviceConnectionType = () => {
    if (!selectedDevice) return "";
    // 如果序列号包含冒号或点号（IP地址特征），或者是无线调试特定的序列号格式，判定为无线
    const isWireless = selectedDevice.serial.includes(':') || selectedDevice.serial.includes('.');
    return isWireless ? t('device_connection.wireless') : t('device_connection.wired');
  };

  const connectedDevices = devices.filter((d) => d.connected);

  // 自动选择第一个设备
  useEffect(() => {
    if (connectedDevices.length > 0 && !selectedDevice) {
      handleDeviceSelect(connectedDevices[0]);
    }
  }, [connectedDevices, selectedDevice]);

  const renderDeviceInfo = () => {
    if (connectedDevices.length === 0) {
      return (
        <div className={styles.deviceInfo} id="tour-device-info">
        <div
          className={styles.deviceInfoOverlay}
          onClick={openDeviceSelectionWindow}
        >
          <div className={styles.deviceInfoOverlayText}>
            {/* <Swap24Regular /> */}
            选择其他设备
          </div>
        </div>
          <div className={styles.deviceInfoContainer}>
            {/* 上半部分：左侧背景图片 + 右侧无设备提示 */}
            <div className={styles.deviceInfoTop}>
              {/* 左侧：设备状态图片 */}
              <div className={styles.deviceIconSection}>
                <img
                  src={UnlinkIcon}
                  alt="UnlinkIcon"
                  className={styles.deviceIconImage}
                />
              </div>

              {/* 右侧：无设备提示信息 */}
              <div className={styles.deviceTextInfo}>
                <div className={styles.noDeviceMessageSection}>
                  <Text className={styles.noDeviceTitle}>
                    {t("main.no_device_title")}
                  </Text>
                  <Text className={styles.noDeviceSubtitle}>
                    {t("main.no_device_desc")}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedDevice) {
      return null;
    }

    const deviceIcon = getDeviceIcon(selectedDevice.mode);

    // 获取设备名称，对于fastboot模式，使用fastboot getvar product命令获取
    const getDeviceName = () => {
      // 对于fastboot模式，优先使用product_name
      if (
        selectedDevice.mode === "fastboot" ||
        selectedDevice.mode === "fastbootd"
      ) {
        return selectedDevice.properties?.productName || selectedDevice.serial;
      }
      // 对于其他模式，使用原有的逻辑
      return (
        selectedDevice.properties?.marketName ||
        selectedDevice.properties?.model ||
        selectedDevice.serial
      );
    };

    const getDeviceOptionText = (device: any) => {
      // 直接返回设备序列号
      return device.serial;
    };

    const getDeviceCodeName = () => {
      if (
        selectedDevice.mode === "fastboot" ||
        selectedDevice.mode === "fastbootd"
      ) {
        // 对于fastboot模式，使用product_name作为设备代号
        return selectedDevice.properties?.productName || selectedDevice.serial;
      }
      return selectedDevice.properties?.deviceName || "";
    };

    return (
      <div className={styles.deviceInfo} id="tour-device-info">
        <div
          className={styles.deviceInfoOverlay}
          onClick={openDeviceSelectionWindow}
        >
          <div className={styles.deviceInfoOverlayText}>
            {/* <Swap24Regular /> */}
            选择其他设备
          </div>
        </div>
        <div className={styles.deviceInfoContainer}>
          {/* 上半部分：左侧设备状态图片 + 右侧设备文字信息 */}
          <div className={styles.deviceInfoTop}>
            {/* 左侧：设备状态图片 */}
            <div className={styles.deviceIconSection}>
              <img
                src={deviceIcon}
                alt="Device Icon"
                className={styles.deviceIconImage}
              />
            </div>

            {/* 右侧：设备文字信息 */}
            <div className={styles.deviceTextInfo}>
              {/* 设备名称区域 */}
              <div className={styles.deviceStatusSection}>
                {/* 设备序列号 */}
                <Text className={styles.deviceName}>{getDeviceName()}</Text>

                {/* 设备代号 */}
                {selectedDevice.properties?.deviceName && (
                  <Badge
                    appearance="tint"
                    color="brand"
                    size="medium"
                    className={styles.compactBadge}
                  >
                    {getDeviceCodeName()}
                  </Badge>
                )}
              </div>

              {/* 状态信息区域 */}
              <div className={styles.deviceStatusSection}>
                {/* 设备模式 */}
                <Badge
                  appearance="tint"
                  color="brand"
                  size="medium"
                  className={styles.compactBadge}
                >
                  {getDeviceMode()}
                </Badge>
                <Badge
                  appearance="tint"
                  color="brand"
                  size="medium"
                  className={styles.compactBadge}
                >
                  {getDeviceConnectionType()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case "home":
        return <HomePage />;
      case "adb-zone":
        return <AdbZonePanel />;
      case "flash-zone":
        return <FlashZonePanel />;
      case "root":
        return <RootPanel />;
      case "extended-features":
        return <ExtendedFeaturesPanel />;
      case "online-resources":
        return <OnlineZonePanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`${styles.container} startup-optimized`}>
      <div className={`${styles.sidebar} sidebar-enter`}>
        {/* 设备信息区域 */}
        {renderDeviceInfo()}

        {/* 标签列表 */}
        <TabList
          id="tour-nav-tabs"
          selectedValue={currentView}
          onTabSelect={handleTabSelect}
          className={styles.tabList}
          vertical // 设置为垂直模式
        >
          {tabs.map((tab) => (
            <Tab
              id={`tour-tab-${tab.id}`}
              key={tab.id}
              value={tab.id}
              icon={tab.icon}
              className={styles.tab}
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>

        {/* 轮播图区域 */}
        <div className={styles.carouselContainer}>
          <CarouselComponent autoPlayInterval={config.carouselInterval} />
        </div>
        <div className={styles.buttonGroupContainer}>
          {/* 打开命令行按钮 */}
          <div
            className={styles.actionButton}
            onClick={() => openConsoleWindow("command-line")}
            title={t("main.command_line")}
            id="tour-command-line"
          >
            <Icons24Regular />
            <Text>{t("main.command_line")}</Text>
          </div>
          {/* 打开日志窗口按钮 */}
          <div
            className={styles.actionButton}
            onClick={() => openConsoleWindow("logs")}
            title={t("main.logs")}
            id="tour-logs"
          >
            <Notepad24Regular />
            <Text>{t("main.logs")}</Text>
          </div>
        </div>
      </div>

      <div
        className={`${styles.content} main-content-enter`}
        id="tour-main-content"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20, filter: "blur(5px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(5px)" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              opacity: { duration: 0.2 },
              filter: { type: "tween", duration: 0.3, ease: "easeInOut" }
            }}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 版本检查组件 - 隐藏但功能完整 */}
      <VersionChecker
        triggerCheck={triggerVersionCheck}
        onCheckUpdate={() => console.log("🔄 开始检查更新...")}
        onUpdateFound={(result) => {
          console.log("🆕 发现新版本:", result);
          handleUpdateCheckComplete();
        }}
        onNoUpdate={(currentVersion) => {
          console.log("✅ 当前已是最新版本:", currentVersion);
          handleUpdateCheckComplete();
        }}
        onError={(error) => {
          console.error("❌ 版本检查失败:", error);
          handleUpdateCheckComplete();
        }}
        showStatusMessage={false} // 不显示状态消息，避免干扰用户
      />

      {/* 离线设备提示弹窗 */}
      <Dialog
        onOpenChange={(isOpen) => setIsOfflineDialogOpen(!!isOpen)}
        open={isOfflineDialogOpen}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("main.device_offline_title")}</DialogTitle>
            <DialogContent>
              <p>{t("main.device_offline_desc")}</p>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsOfflineDialogOpen(false)}
              >
                {t("main.i_know")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 未授权设备提示弹窗 */}
      <Dialog
        onOpenChange={(isOpen) => setIsUnauthorizedDialogOpen(!!isOpen)}
        open={isUnauthorizedDialogOpen}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t("main.device_unauthorized_title")}</DialogTitle>
            <DialogContent>
              <p>{t("main.device_unauthorized_desc")}</p>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setIsUnauthorizedDialogOpen(false)}
              >
                {t("main.i_know")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      {/* 全局随机无线调试弹窗 */}
      <Dialog 
        open={isWirelessDebuggingDialogOpen} 
        onOpenChange={(event, data) => setWirelessDebuggingDialogOpen(data.open)}
        modalType="modal"
      >
        <DialogSurface style={{ maxWidth: '800px', width: '90vw' }}>
          <DialogBody>
            <DialogTitle action={<Button appearance="subtle" icon={<Icons24Regular />} onClick={() => setWirelessDebuggingDialogOpen(false)} />}>
              {t('wireless.title')}
            </DialogTitle>
            <DialogContent>
              <WirelessDebuggingPanel 
                device={selectedDevice} 
                onAdbRequired={() => {
                  setWirelessDebuggingDialogOpen(false);
                  setStatusBarMessage({
                    type: "warning",
                    message: t('adb.adb_mode_required_desc'),
                  });
                }} 
              />
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <AutoMirrorManager />
    </div>
  );
};

export default MainContent;
