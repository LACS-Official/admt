import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Button,
  Badge,
  Spinner,
  Field,
  Select,
  tokens,
} from "@fluentui/react-components";
import {
  Home24Regular,
  ArrowClockwise24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from "../../stores/appStore";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

// 导入新的组件

import DeviceCoreInfoCard from "../DeviceInfo/DeviceCoreInfoCard";
import DeviceDetailsModal from "../DeviceInfo/DeviceDetailsModal";
import DeviceRebootCard from "./DeviceRebootCard";
import { DeviceOperationsCard } from "./DeviceOperationsCard";
import MiscellaneousCard from "./MiscellaneousCard";
import NotificationContainer from "../Common/NotificationContainer";
import NoDevicePrompt from "./NoDevicePrompt";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  backgroundDecoration: {
    position: "absolute",
    top: "0",
    right: "0",
    width: "200px",
    height: "200px",
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, transparent 70%)`,
    borderRadius: "0 0 0 100%",
    opacity: 0.1,
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    minHeight: "40px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  deviceSelector: {
    minWidth: "180px",
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    height: "100%",
  },
  // 无设备状态下的全屏显示
  noDeviceFullScreen: {
    height: "100%",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // 设备功能区域 - 适配1280x800px固定尺寸
  deviceSection: {
    height: "100%",
    minHeight: "720px", // 适配800px窗口高度
    display: "flex",
    flexDirection: "column",
    gap: "16px", // 增加间距以适配更大空间
  },
  // 设备卡片区域左右分栏布局 - 适配1280x800px固定尺寸
  deviceCardsSection: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // 左右各占50%
    gap: "16px", // 增加间距以适配更大空间
    flex: 1,
  },
  // 左侧：设备信息卡片
  deviceInfoSection: {
    display: "flex",
    flexDirection: "column",
  },
  deviceInfoCard: {
    height: "100%",
    overflow: "auto",
  },
  // 右侧：三个功能区域垂直排列 - 适配1280x800px
  functionsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px", // 增加间距以适配更大空间
  },
  rebootCard: {
    flex: "0 0 auto",
    minHeight: "140px", // 增加高度适配1280x800px
  },
  deviceOperationsCard: {
    flex: "0 0 auto",
    minHeight: "130px", // 增加高度适配1280x800px
  },
  miscCard: {
    flex: "1 1 auto",
    minHeight: "140px", // 增加高度适配1280x800px
    overflow: "auto",
  },
  // 固定尺寸1280x800px - 无需复杂响应式布局
  "@media (max-width: 1280px)": {
    mainContent: {
      gap: "16px", // 保持一致间距
    },
    deviceSection: {
      height: "100%",
      minHeight: "720px", // 固定尺寸适配
    },
    deviceCardsSection: {
      gridTemplateColumns: "1fr", // 移动端改为单列
      gap: "8px", // 减少间距
    },
    functionsSection: {
      gap: "6px", // 进一步减少间距
    },
    rebootCard: {
      minHeight: "100px", // 移动端进一步压缩
    },
    deviceOperationsCard: {
      minHeight: "90px", // 移动端进一步压缩
    },
    miscCard: {
      minHeight: "100px", // 移动端进一步压缩
    },
  },
  noDevice: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "48px 24px",
    textAlign: "center",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    border: "2px dashed var(--colorNeutralStroke2)",
  },
});

const HomePage: React.FC = () => {
  const styles = useStyles();
  const {
    devices,
    selectedDevice,
    selectDevice,
    isScanning
  } = useDeviceStore();
  const { refreshDeviceInfo } = useDeviceService();
  const { addNotification } = useAppStore();
  const { layoutSize } = useResponsiveLayout();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 注意：设备扫描现在在MainContent中全局启动，这里不再需要重复启动

  const connectedDevices = devices.filter(d => d.connected);

  const handleDeviceSelect = (serial: string) => {
    const device = devices.find(d => d.serial === serial);
    selectDevice(device);
  };

  const handleRefresh = async () => {
    if (selectedDevice) {
      await refreshDeviceInfo(selectedDevice.serial);
    }
  };

  // 手动刷新设备扫描
  const handleManualRefresh = () => {
    // 触发设备扫描刷新
    addNotification({
      type: "info",
      title: "设备扫描",
      message: "正在刷新设备列表...",
    });
  };

  const handleShowDetails = () => {
    setShowDetailsModal(true);
  };

  const handleCopyInfo = async () => {
    if (!selectedDevice) return;

    try {
      const deviceInfo = [
        `设备名称: ${selectedDevice.properties?.marketName || selectedDevice.properties?.model || '未知'}`,
        `品牌: ${selectedDevice.properties?.brand || '未知'}`,
        `型号: ${selectedDevice.properties?.model || '未知'}`,
        `序列号: ${selectedDevice.serial}`,
        `Android版本: ${selectedDevice.properties?.androidVersion || '未知'}`,
        `设备模式: ${selectedDevice.mode}`,
      ];

      await navigator.clipboard.writeText(deviceInfo.join('\n'));
      addNotification({
        type: "success",
        title: "复制成功",
        message: "设备信息已复制到剪贴板"
      });
    } catch (error) {
      addNotification({
        type: "error",
        title: "复制失败",
        message: "无法访问剪贴板"
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* 背景装饰 */}
      <div className={styles.backgroundDecoration} />

      {/* 页面头部 */}

      {/* 主要内容区域 - 动态布局切换 */}
      <div className={styles.mainContent}>
        {connectedDevices.length === 0 ? (
          /* 无设备连接时：显示全屏设备提示界面 */
          <NoDevicePrompt
            isScanning={isScanning}
            onRefresh={handleManualRefresh}
          />
        ) : (
          /* 有设备连接时：显示优化后的主页布局 */
          <div className={styles.deviceSection}>
              {selectedDevice ? (
                <>
                  {/* 左右分栏布局 */}
                  <div className={styles.deviceCardsSection}>
                    {/* 左侧：设备信息概览 */}
                    <div className={styles.deviceInfoSection}>
                      <div className={styles.deviceInfoCard}>
                        <DeviceCoreInfoCard
                          device={selectedDevice}
                          onShowDetails={handleShowDetails}
                          onCopyInfo={handleCopyInfo}
                        />
                      </div>
                    </div>

                    {/* 右侧：三个功能区域垂直排列 */}
                    <div className={styles.functionsSection}>
                      {/* 上方：设备重启卡片 */}
                      <div className={styles.rebootCard}>
                        <DeviceRebootCard />
                      </div>

                      {/* 中间：设备操作卡片 */}
                      <div className={styles.deviceOperationsCard}>
                        <DeviceOperationsCard />
                      </div>

                      {/* 下方：杂项功能卡片 */}
                      <div className={styles.miscCard}>
                        <MiscellaneousCard />
                      </div>
                    </div>
                  </div>

                  {/* 详细信息模态框 */}
                  <DeviceDetailsModal
                    device={selectedDevice}
                    open={showDetailsModal}
                    onOpenChange={setShowDetailsModal}
                  />
                </>
              ) : (
                <div className={styles.noDevice}>
                  <Home24Regular style={{ fontSize: "48px", color: "var(--colorNeutralForeground3)" }} />
                  <Text size={400}>请选择一个设备</Text>
                  <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                    从上方下拉菜单中选择要查看的设备
                  </Text>
                </div>
              )}
            </div>
        )}
      </div>

      {/* 通知容器 */}
      <NotificationContainer />
    </div>
  );
};

export default HomePage;
