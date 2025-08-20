import React from "react";
import {
  makeStyles,
  Text,

  tokens,
} from "@fluentui/react-components";
import {
  Home24Regular,

} from "@fluentui/react-icons";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";

// 导入新的组件
import DeviceOverviewCard from "../DeviceInfo/DeviceOverviewCard";
import DeviceRebootCard from "./DeviceRebootCard";
import MiscellaneousCard from "./MiscellaneousCard";

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
  // 设备功能区域 - 新的上下两行布局结构
  deviceSection: {
    height: "100%",
    minHeight: "720px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  // 主要内容区域：上下两行布局
  mainContentGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    height: "100%",
  },
  // 第一行：设备概览信息区域 - 占据60%高度
  deviceOverviewSection: {
    flex: "0 0 50%", // 固定占据60%的高度
    display: "flex",
    flexDirection: "column",
    minHeight: "380px", // 稍微减少最小高度
    maxHeight: "60%", // 最大高度限制调整为60%
  },
  deviceInfoCard: {
    height: "100%",
    overflow: "auto",
  },
  // 第二行：功能控制区域 - 占据40%高度
  deviceActionsSection: {
    flex: "1 1 50%", // 占据剩余高度（40%）
    display: "flex",
    flexDirection: "row", // 水平排列两个卡片
    gap: "16px",
    minHeight: "260px", // 增加最小高度以适应40%的空间
  },
  // 重启卡片 - 40%宽度
  rebootCard: {
    flex: "0 0 40%", // 占据40%宽度
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
  },
  // 杂项功能卡片 - 60%宽度
  miscCard: {
    flex: "0 0 60%", // 占据60%宽度
    minHeight: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  },
  // 响应式布局 - 移动端和小屏幕适配
  "@media (max-width: 1024px)": {
    deviceSection: {
      minHeight: "600px", // 平板端减少最小高度
    },
    deviceOverviewSection: {
      flex: "0 0 50%", // 平板端保持60%高度
      minHeight: "320px",
    },
    deviceActionsSection: {
      flex: "1 1 50%", // 平板端功能区域40%高度
      minHeight: "220px", // 稍微增加最小高度
    },
    rebootCard: {
      flex: "0 0 40%", // 平板端保持40%宽度
    },
    miscCard: {
      flex: "0 0 60%", // 平板端保持60%宽度
    },
  },
  "@media (max-width: 768px)": {
    deviceSection: {
      minHeight: "500px", // 移动端进一步减少最小高度
      gap: "12px",
    },
    mainContentGrid: {
      gap: "12px", // 移动端减少间距
    },
    deviceOverviewSection: {
      flex: "0 0 55%", // 移动端设备概览区域占55%高度
      minHeight: "250px",
    },
    deviceActionsSection: {
      flex: "1 1 45%", // 移动端功能区域占45%高度
      flexDirection: "column", // 移动端改为垂直布局
      gap: "8px",
      minHeight: "200px",
    },
    rebootCard: {
      flex: "0 0 auto", // 移动端重启卡片自适应高度
      minHeight: "80px",
    },
    miscCard: {
      flex: "1 1 auto", // 移动端杂项卡片占据剩余空间
      minHeight: "100px",
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
    isScanning
  } = useDeviceStore();
  const { addNotification } = useAppStore();

  // 注意：设备扫描现在在MainContent中全局启动，这里不再需要重复启动

  const connectedDevices = devices.filter(d => d.connected);

  // 手动刷新设备扫描
  const handleManualRefresh = () => {
    // 触发设备扫描刷新
    addNotification({
      type: "info",
      title: "设备扫描",
      message: "正在刷新设备列表...",
    });
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

                  {/* 新的布局：上下两行布局 */}
                  <div className={styles.mainContentGrid}>
                    {/* 第一行：设备概览信息区域 - 占据60%高度 */}
                    <div className={styles.deviceOverviewSection}>
                      <div className={styles.deviceInfoCard}>
                        <DeviceOverviewCard
                          device={selectedDevice}
                          onShowDetails={() => {
                            // 处理显示详情的逻辑
                          }}
                          onCopyInfo={() => {
                            // 处理复制信息的逻辑
                            addNotification({
                              type: "success",
                              title: "复制成功",
                              message: "设备信息已复制到剪贴板",
                            });
                          }}
                          onCustomize={() => {
                            // 处理自定义设置的逻辑
                          }}
                        />
                      </div>
                    </div>

                    {/* 第二行：功能控制区域 - 占据40%高度 */}
                    <div className={styles.deviceActionsSection}>
                      {/* 左侧：设备重启卡片 */}
                      <div className={styles.rebootCard}>
                        <DeviceRebootCard />
                      </div>

                      {/* 右侧：杂项功能卡片 */}
                      <div className={styles.miscCard}>
                        <MiscellaneousCard />
                      </div>
                    </div>
                  </div>
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

    </div>
  );
};

export default HomePage;
