import React, { useEffect, useRef }  from 'react';
import {
  makeStyles,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
  Text,
  Badge,

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

import { usageTrackingService } from "../../services/usageTrackingService";


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
    width: "200px", // 增加宽度
    minWidth: "200px",
    maxWidth: "240px", // 更新最大宽度
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
    padding: "10px", // 增加内边距
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
  },
  deviceSelectorArea: {
    width: "100%",
    overflow: "hidden",
    marginTop: "4px", // 减少顶部间距
  },
  deviceIconSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "60px",
    height: "auto", // 改为自动高度
    minHeight: "100px", // 设置最小高度以匹配文字信息区域
    flexShrink: 0,
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
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
    flex: 1, // 占用剩余空间
    minWidth: 0, // 允许收缩
    overflow: "hidden",
  },
  deviceSelectDropdown: {
    width: "100%",
    padding: "4px 6px",
    fontSize: "11px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
    cursor: "pointer",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ":focus": {
      outline: "2px solid var(--colorBrandStroke1)",
      outlineOffset: "1px",
    },
  },
  deviceTextInfo: {
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
    marginBottom: "6px",
  },
  deviceName: {
    fontSize: "16px", // 进一步减小字体
    fontWeight: "600",
    color: "#00a0e9",
    lineHeight: "1.2",
    maxWidth: "100%",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: "0", // 移除底部间距
  },
  deviceCodename: {
    fontSize: "10px", // 进一步减小字体
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
  },
  statusLabel: {
    fontSize: "9px",
    color: "var(--colorNeutralForeground2)",
    minWidth: "24px",
    flexShrink: 0,
  },
  compactBadge: {
    fontSize: "10px", // 稍微增大字体
    padding: "3px 8px", // 增加内边距
    minHeight: "18px", // 增加高度
    borderRadius: "10px", // 更圆润的边角
    fontWeight: "500", // 增加字重
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)", // 添加微妙阴影
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
                    请连接Android设备并启用USB调试
                  </Text>
                </div>
              </div>
            </div>

            {/* 下半部分：设备选择区域（保持一致性） */}
            <div className={styles.deviceSelectorArea}>
              <div className={styles.deviceSelector}>
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
        </div>
      );
    }

    if (!selectedDevice) {
      // 如果有设备但没有选中，自动选择第一个
      handleDeviceSelect(connectedDevices[0]);
      return null;
    }

    const deviceIcon = getDeviceIcon(selectedDevice.mode);

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
                <Text className={styles.deviceName}>
                  {selectedDevice.properties?.marketName ||
                   selectedDevice.properties?.model ||
                   selectedDevice.serial}
                </Text>
                {selectedDevice.properties?.deviceName && (
                  <Text className={styles.deviceCodename}>
                    {selectedDevice.properties.deviceName}
                  </Text>
                )}
              </div>

              {/* 状态信息区域 */}
              <div className={styles.deviceStatusSection}>
                {/* 连接状态 */}
                <div className={styles.statusBadgeRow}>
                  <Text className={styles.statusLabel}>状态</Text>
                  <Badge
                    appearance="filled"
                    color={getStatusColor() === "success" ? "success" :
                           getStatusColor() === "warning" ? "warning" : "danger"}
                    size="small"
                    className={styles.compactBadge}
                    icon={<Circle12Filled />}
                  >
                    {selectedDevice.connected ? "已连接" : "未连接"}
                  </Badge>
                </div>

                {/* 设备模式 */}
                <div className={styles.statusBadgeRow}>
                  <Text className={styles.statusLabel}>模式</Text>
                  <Badge
                    appearance="outline"
                    color="brand"
                    size="small"
                    className={styles.compactBadge}
                  >
                    {getDeviceMode()}
                  </Badge>
                </div>

                {/* 连接类型 */}
                {getConnectionType() && (
                  <div className={styles.statusBadgeRow}>
                    <Text className={styles.statusLabel}>连接</Text>
                    <Badge
                      appearance="filled"
                      color={getConnectionType() === "ADB" ? "brand" : "important"}
                      size="small"
                      className={styles.compactBadge}
                    >
                      {getConnectionType()}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 下半部分：设备选择框 */}
          <div className={styles.deviceSelectorArea}>
            <div className={styles.deviceSelector}>
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
                    {device.properties?.marketName || device.properties?.model || device.serial}
                  </option>
                ))}
              </select>
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
    <div className={styles.container}>
      <div className={styles.sidebar}>
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

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;
