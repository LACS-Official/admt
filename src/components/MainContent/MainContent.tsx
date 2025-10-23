import React, { useEffect, useRef, useState }  from 'react';
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
  DialogTrigger,
  Button,
} from "@fluentui/react-components";
import {
  Code24Regular,
  Settings24Regular,
  Wrench24Regular,
    CloudArrowUp24Regular,
  CloudArrowDown24Regular,
  Circle12Filled,
  Home24Regular,
  Beaker24Regular,
} from "@fluentui/react-icons";
import { getDeviceIcon } from "../../assets/icons";
import UnlinkIcon from "../../assets/icons/devices/unlink.gif";
import { useAppStore } from "../../stores/appStore";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { AppView } from "../../types/app";
import HomePage from "../Home/HomePage";
import AdbZonePanel from "../AdbTools/AdbZonePanel";
import FlashZonePanel from "../FlashZone/FlashZonePanel";
import ExtendedFeaturesPanel from "../ExtendedFeatures/ExtendedFeaturesPanel";
import OnlineResourcesPanel from "../OnlineResources/OnlineResourcesPanel";
import SettingsPanel from "../Settings/SettingsPanel";
import CarouselComponent from "./CarouselComponent";
import VersionChecker from "../Common/VersionChecker";
import RootPanel from "../Root/RootPanel";

import { usageTrackingService } from "../../services/usageTrackingService";
import { systemTrayManager } from "../../services/systemTrayManager";


const useStyles = makeStyles({
  '@keyframes pulse': {
    '&from': {
      opacity: "1",
    },
    '&50%': {
      opacity: "0.8",
    },
    '&to': {
      opacity: "1",
    },
  },
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
    background: "linear-gradient(180deg, var(--colorNeutralBackground2) 0%, var(--colorNeutralBackground1) 100%)",
  },
  deviceInfo: {
    padding: "5px", // 增加内边距
    borderBottom: "1px solid var(--colorNeutralStroke3)", // 更淡的边框
    backdropFilter: "blur(10px)", // 毛玻璃效果
    overflow: "hidden",
    minHeight: "auto",
    position: "relative",
    boxSizing: "border-box",
    margin: "8px", // 添加外边距
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
    marginBottom: "4px", // 减少底部间距
    border: "1px solid var(--colorNeutralStroke2)", // 更淡的边框
    borderRadius: "8px", // 添加圆角
    padding: "4px", // 添加内边距
  },
  deviceSelectorArea: {
    width: "100%",
    marginTop: "4px",
  },
  deviceIconSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "auto", // 改为自动高度
    minHeight: "100px", // 设置最小高度以匹配文字信息区域
    flexShrink: 0,
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    marginLeft: "4px", // 添加外边距
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
    gap: "4px",
    minHeight: "20px",
    textAlign: "center",
    padding: "4px",
    boxSizing: "border-box",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
    color: "var(--colorNeutralForeground1)",
    backgroundColor: "var(--colorNeutralBackground1)",

  },
  deviceTextInfo: {
    marginTop: "8px",
    marginLeft: "12px",
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
      background: "linear-gradient(to bottom, var(--colorNeutralBackground1), transparent)",
      pointerEvents: "none",
      zIndex: 1,
    }
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
      }
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
      background: "radial-gradient(circle at 50% 50%, var(--colorNeutralBackground1) 0%, transparent 70%)",
      opacity: 0.3,
      pointerEvents: "none",
    },
  },
});

const tabs = [
  {
    id: "home" as AppView,
    label: "主页",
    icon: <Home24Regular />,
  },
  {
    id: "adb-zone" as AppView,
    label: "系统专区",
    icon: <Code24Regular />,
  },
  {
    id: "flash-zone" as AppView,
    label: "刷机专区",
    icon: <CloudArrowUp24Regular />,
  },
  {
    id: "extended-features" as AppView,
    label: "扩展功能",
    icon: <Wrench24Regular />,
  },
  {
    id: "online-resources" as AppView,
    label: "在线资源",
    icon: <CloudArrowDown24Regular />,
  },
  {
    id: "settings" as AppView,
    label: "设置",
    icon: <Settings24Regular />,
  },

];

const MainContent: React.FC = () => {
  const styles = useStyles();
  const { currentView, setCurrentView, config, setStatusBarMessage } = useAppStore();
  const { selectedDevice, devices, selectDevice } = useDeviceStore();
  const { startScanning, stopScanning, refreshDeviceInfo } = useDeviceService();
  const prevConnectedCount = useRef<number>(0);
  
  // 版本检查相关状态
  const [triggerVersionCheck, setTriggerVersionCheck] = useState(false);
  const [updateCheckCompleted, setUpdateCheckCompleted] = useState(false);
  
  // 离线弹窗状态
  const [isOfflineDialogOpen, setIsOfflineDialogOpen] = useState(false);
  
  // 未授权弹窗状态
  const [isUnauthorizedDialogOpen, setIsUnauthorizedDialogOpen] = useState(false);

  // 全局设备扫描 - 根据配置控制是否启用和扫描间隔
  useEffect(() => {
    if (config.autoDetectDevices) {
      // 如果扫描间隔改变，需要重新启动扫描
      stopScanning();
      startScanning();
    } else {
      stopScanning();
    }
    return () => stopScanning();
  }, [config.autoDetectDevices, config.scanInterval, startScanning, stopScanning]);

  // 监听设备状态变化，检测离线和未授权设备
  useEffect(() => {
    if (selectedDevice) {
      if (selectedDevice.mode === "offline") {
        setIsOfflineDialogOpen(true);
        setStatusBarMessage({
          type: "warning",
          message: "当前设备已离线，无法获取详细信息。",
        });
      } else if (selectedDevice.mode === "unauthorized") {
        setIsUnauthorizedDialogOpen(true);
        setStatusBarMessage({
          type: "warning",
          message: "当前设备未授权，无法获取详细信息。",
        });
      }
    }
  }, [selectedDevice]);

  // 监听设备连接/断开，提示状态栏消息
  useEffect(() => {
    const connectedCount = devices.filter(d => d.connected).length;
    const prev = prevConnectedCount.current;

    if (prev === 0 && connectedCount > 0) {
      // 首次检测到设备
      setStatusBarMessage({
        type: "success",
        message: connectedCount === 1 ? "已检测到 1 台设备" : `已检测到 ${connectedCount} 台设备`,
      });
    } else if (prev > 0 && connectedCount === 0) {
      // 所有设备断开
      setStatusBarMessage({
        type: "warning",
        message: "设备已断开",
      });
    } else if (connectedCount < prev && connectedCount > 0) {
      // 有设备断开但仍有设备连接
      setStatusBarMessage({
        type: "warning",
        message: "有设备断开连接",
      });
    } else if (connectedCount > prev && prev > 0) {
      // 新增设备连接
      setStatusBarMessage({
        type: "success",
        message: "有新设备已连接",
      });
    }

    prevConnectedCount.current = connectedCount;
  }, [devices]);

  // 当选择设备时自动获取设备属性
  useEffect(() => {
    if (selectedDevice && selectedDevice.connected && !selectedDevice.properties) {
      setStatusBarMessage({ type: "info", message: "正在获取设备信息..." });
      refreshDeviceInfo(selectedDevice.serial);
    }
  }, [selectedDevice, refreshDeviceInfo]);

  // 调试设备属性变化
  useEffect(() => {
    if (selectedDevice?.properties) {
      console.log('设备属性已更新:', {
        marketName: selectedDevice.properties.marketName,
        model: selectedDevice.properties.model,
        brand: selectedDevice.properties.brand,
        manufacturer: selectedDevice.properties.manufacturer,
        deviceName: selectedDevice.properties.deviceName,
        serial: selectedDevice.serial
      });
      setStatusBarMessage({ type: "success", message: "设备信息已获取" });
    }
  }, [selectedDevice?.properties]);

  // 用户行为追踪 - 在MainContent组件挂载时发送使用数据（备用方案）
  useEffect(() => {
    const trackMainContentEntry = async () => {
      try {
        console.log('🏢 MainContent组件已挂载，开始备用追踪...');
        console.log('🏢 当前时间:', new Date().toISOString());
        console.log('🏢 组件挂载位置: MainContent.tsx useEffect');

        // 延迟一段时间，确保HomePage组件有机会先执行
        setTimeout(async () => {
          try {
            await usageTrackingService.trackMainPageEntry();
            console.log('🏢 MainContent备用追踪调用完成');
          } catch (error) {
            console.error('❌ MainContent备用追踪失败:', error);
          }
        }, 2000); // 2秒延迟

      } catch (error) {
        console.error('❌ MainContent备用追踪设置失败:', error);
      }
    };

    console.log('🏢 MainContent useEffect 被触发');
    trackMainContentEntry();
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

  // 系统托盘初始化 - 单例模式管理，确保只在应用启动时初始化一次
  useEffect(() => {
    const initializeSystemTray = async () => {
      try {
        // 检查是否已经初始化，避免重复初始化
        if (!systemTrayManager.isReady() && !systemTrayManager.isInitializingNow()) {
          await systemTrayManager.initialize({
            systemTrayEnabled: config.systemTrayEnabled,
            minimizeToTrayOnClose: config.minimizeToTrayOnClose
          });
        }
      } catch (error) {
        console.error('系统托盘初始化失败:', error);
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
          minimizeToTrayOnClose: config.minimizeToTrayOnClose
        });
      } catch (error) {
        console.error('更新系统托盘配置失败:', error);
      }
    };

    updateTrayConfig();
  }, [config.systemTrayEnabled, config.minimizeToTrayOnClose]);

  // 进入主页面时自动检测更新
  useEffect(() => {
    // 延迟执行版本检查，确保应用完全加载
    const timer = setTimeout(() => {
      if (!updateCheckCompleted) {
        console.log('🔄 开始自动检测更新...');
        setTriggerVersionCheck(true);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [updateCheckCompleted]);

  // 处理版本检查完成
  const handleUpdateCheckComplete = () => {
    console.log('✅ 版本检查完成');
    setUpdateCheckCompleted(true);
    setTriggerVersionCheck(false);
  };

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setCurrentView(data.value as AppView);
  };



  const handleDeviceSelect = (device: any) => {
    selectDevice(device);
  };



  const getDeviceMode = () => {
    if (!selectedDevice) return "";

    switch (selectedDevice.mode) {
      case "sys": return "系统模式";
      case "rec": return "Recovery";
      case "fastboot": return "Fastboot";
      case "fastbootd": return "Fastbootd";
      case "sideload": return "Sideload";
      case "edl": return "EDL模式";
      case "unauthorized": return "未授权";
      case "offline": return "离线";
      default: return "未知模式";
    }
  };

  const getConnectionType = () => {
    if (!selectedDevice) return "";

    if (selectedDevice.mode === "fastboot" || selectedDevice.mode === "fastbootd") {
      return "Fastboot";
    } else if (["sys", "rec", "sideload"].includes(selectedDevice.mode)) {
      return "ADB";
    }
    return "未知";
  };

  const getStatusColor = () => {
    if (!selectedDevice || !selectedDevice.connected) return "danger";
    if (selectedDevice.mode === "unauthorized") return "warning";
    if (selectedDevice.mode === "offline") return "warning";
    return "success";
  };



  const renderDeviceInfo = () => {
    const connectedDevices = devices.filter(d => d.connected);

    if (connectedDevices.length === 0) {
      return (
        <div className={styles.deviceInfo}>
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
                  <Text className={styles.noDeviceTitle}>未检测到设备</Text>
                  <Text className={styles.noDeviceSubtitle}>
                    请检查设备是否正常连接 对应驱动是否安装
                  </Text>
                </div>
              </div>
            </div>

            {/* 下半部分：设备选择区域（保持一致性） */}
            <div className={styles.deviceSelectorArea}>
              <select
                className={styles.deviceSelectDropdown}
                disabled
                value=""
              >
                <option value="">暂无可用设备</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedDevice) {
      // 如果有设备但没有选中，自动选择第一个
      handleDeviceSelect(connectedDevices[0]);
      return null;
    }

    const deviceIcon = getDeviceIcon(selectedDevice.mode);

    // 获取设备名称，对于fastboot模式，使用fastboot getvar product命令获取
    const getDeviceName = () => {
      // 对于fastboot模式，优先使用product_name
      if (selectedDevice.mode === "fastboot" || selectedDevice.mode === "fastbootd") {
        return selectedDevice.properties?.productName || selectedDevice.serial;
      }
      // 对于其他模式，使用原有的逻辑
      return selectedDevice.properties?.marketName ||
             selectedDevice.properties?.model ||
             selectedDevice.serial;
    };

    const getDeviceOptionText = (device: any) => {
      if (device.mode === "fastboot" || device.mode === "fastbootd") {
        // 对于fastboot模式，优先使用product_name，如果没有则使用serial
        return `选择设备: ${device.properties?.productName || device.serial}`;
      }
      // 对于其他模式，使用原有的逻辑
      return `选择设备: ${device.properties?.marketName || device.properties?.model || device.serial}`;
    };
    
    const getDeviceCodeName = () => {
      if (selectedDevice.mode === "fastboot" || selectedDevice.mode === "fastbootd") {
        // 对于fastboot模式，使用product_name作为设备代号
        return selectedDevice.properties?.productName || selectedDevice.serial;
      }
      return selectedDevice.properties?.deviceName || "";
    };

    return (
      <div className={styles.deviceInfo}>
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
              <div className={styles.deviceNameSection}>
                {/* 设备序列号 */}
                <Text className={styles.deviceName}>
                  {getDeviceName()}
                </Text>

                {/* 设备代号 */}
                {selectedDevice.properties?.deviceName && (
                  <Badge                     appearance="outline"
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
                <div className={styles.statusBadgeRow}>
                  <Badge
                    appearance="outline"
                    color="brand"
                    size="medium"
                    className={styles.compactBadge}
                  >
                    {getDeviceMode()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* 下半部分：设备选择框 */}
          <div className={styles.deviceSelectorArea}>
            <select
              className={styles.deviceSelectDropdown}
              value={selectedDevice.serial}
              onChange={(e) => {
                const device = connectedDevices.find(d => d.serial === e.target.value);
                if (device) handleDeviceSelect(device);
              }}
            >
              {connectedDevices.map((device) => (
                <option key={device.serial} value={device.serial}>
                  {getDeviceOptionText(device)}
                </option>
              ))}
            </select>
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
        return <OnlineResourcesPanel />;
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
          selectedValue={currentView}
          onTabSelect={handleTabSelect}
          className={styles.tabList}
          vertical // 设置为垂直模式
        >
          {tabs.map((tab) => (
            <Tab
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
          <CarouselComponent />
        </div>
      </div>

      <div className={`${styles.content} main-content-enter`}>
        {renderContent()}
      </div>

      {/* 版本检查组件 - 隐藏但功能完整 */}
      <VersionChecker
        triggerCheck={triggerVersionCheck}
        onCheckUpdate={() => console.log('🔄 开始检查更新...')}
        onUpdateFound={(result) => {
          console.log('🆕 发现新版本:', result);
          handleUpdateCheckComplete();
        }}
        onNoUpdate={(currentVersion) => {
          console.log('✅ 当前已是最新版本:', currentVersion);
          handleUpdateCheckComplete();
        }}
        onError={(error) => {
          console.error('❌ 版本检查失败:', error);
          handleUpdateCheckComplete();
        }}
        showStatusMessage={false} // 不显示状态消息，避免干扰用户
      />
      
      {/* 离线设备提示弹窗 */}
      <Dialog
        onOpenChange={
          (isOpen) => setIsOfflineDialogOpen(!!isOpen)
        }
        open={isOfflineDialogOpen}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>设备离线</DialogTitle>
            <DialogContent>
              <p>当前设备已离线，请重新连接设备后，重新插播数据线后重试</p>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsOfflineDialogOpen(false)}>我知道了</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      
      {/* 未授权设备提示弹窗 */}
      <Dialog
        onOpenChange={
          (isOpen) => setIsUnauthorizedDialogOpen(!!isOpen)
        }
        open={isUnauthorizedDialogOpen}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>设备未授权</DialogTitle>
            <DialogContent>
              <p>当前设备未授权，请在设备上允许USB调试授权后，重新插拔数据线。</p>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setIsUnauthorizedDialogOpen(false)}>我知道了</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default MainContent;
