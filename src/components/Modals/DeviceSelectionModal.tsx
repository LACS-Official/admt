import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  makeStyles,
  shorthands,
  Text,
  Badge,
  Button,
  mergeClasses,
  Tooltip,
} from "@fluentui/react-components";
import {
  Phone24Regular,
  CheckmarkCircle24Regular,
  Dismiss20Regular,
  ArrowClockwise20Regular,
  Wifi124Regular,
} from "@fluentui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { useDeviceService } from "../../services/deviceService";
import { DeviceInfo } from "../../types/device";
import { listen } from "@tauri-apps/api/event";

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "520px",
    width: "90vw",
    maxHeight: "620px",
    padding: "0",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 24px 50px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    backgroundColor: "var(--colorNeutralBackground1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  dialogBody: {
    height: "100%",
    width: "100%",
    margin: "0",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground1)",
    flexShrink: 0,
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  actionBtn: {
    minWidth: "32px",
    height: "32px",
    padding: "0 6px",
    borderRadius: "8px",
    color: "var(--colorNeutralForeground2)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground3)",
      color: "var(--colorNeutralForeground1)",
    },
  },
  rotating: {
    animationName: {
      from: { transform: "rotate(0deg)" },
      to: { transform: "rotate(360deg)" },
    },
    animationDuration: "0.8s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",
  },
  content: {
    flex: 1,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    gap: "10px",
  },
  deviceList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  deviceItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    cursor: "pointer",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      ...shorthands.borderColor("var(--colorNeutralStroke1Hover)"),
      transform: "translateY(-1px)",
    },
  },
  selectedDevice: {
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    border: "1px solid rgba(0, 113, 227, 0.35)",
    "&:hover": {
      backgroundColor: "rgba(0, 113, 227, 0.12)",
    },
  },
  deviceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  statusIndicator: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  statusOnline: {
    backgroundColor: "#10b981",
    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.25)",
  },
  statusFastboot: {
    backgroundColor: "#8b5cf6",
    boxShadow: "0 0 0 2px rgba(139, 92, 246, 0.25)",
  },
  statusRecovery: {
    backgroundColor: "#f59e0b",
    boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.25)",
  },
  statusUnauthorized: {
    backgroundColor: "#ef4444",
    boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.25)",
  },
  deviceDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    minWidth: 0,
    flex: 1,
  },
  deviceName: {
    fontWeight: "600",
    fontSize: "14px",
    color: "var(--colorNeutralForeground1)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  deviceMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  serialText: {
    fontSize: "11px",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    color: "var(--colorNeutralForeground3)",
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "36px 16px",
    color: "var(--colorNeutralForeground3)",
  },
  emptyIcon: {
    fontSize: "42px",
    color: "var(--colorNeutralForeground4)",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
    flexShrink: 0,
  },
});

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export const DeviceSelectionModal: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { devices, selectedDevice, selectDevice } = useDeviceStore();
  const isDeviceSelectionModalOpen = useAppStore((state) => state.isDeviceSelectionModalOpen);
  const setDeviceSelectionModalOpen = useAppStore((state) => state.setDeviceSelectionModalOpen);
  const setWirelessDebuggingDialogOpen = useAppStore((state) => state.setWirelessDebuggingDialogOpen);
  const setStatusBarMessage = useAppStore((state) => state.setStatusBarMessage);
  const { startScanning } = useDeviceService();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("open-device-selection-modal", () => {
      setDeviceSelectionModalOpen(true);
    }).then((fn) => (unlisten = fn));

    return () => {
      if (unlisten) unlisten();
    };
  }, [setDeviceSelectionModalOpen]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    startScanning();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  }, [startScanning]);

  const getDeviceStatusColor = (mode: string) => {
    switch (mode) {
      case "sys":
        return styles.statusOnline;
      case "fastboot":
      case "fastbootd":
        return styles.statusFastboot;
      case "rec":
        return styles.statusRecovery;
      case "unauthorized":
        return styles.statusUnauthorized;
      default:
        return styles.statusOnline;
    }
  };

  const getDeviceDisplayName = (device: DeviceInfo) => {
    const marketName = device.properties?.marketName;
    const deviceName = device.properties?.deviceName;
    const productName = device.properties?.productName;
    if (marketName && deviceName) return `${marketName} (${deviceName})`;
    return marketName || productName || deviceName || device.properties?.model || device.serial;
  };

  const handleDeviceSelect = (device: DeviceInfo) => {
    selectDevice(device);
    setDeviceSelectionModalOpen(false);
    setStatusBarMessage({
      type: "success",
      message: `已切换至设备: ${getDeviceDisplayName(device)}`,
    });
  };

  const handleOpenWireless = () => {
    setDeviceSelectionModalOpen(false);
    setWirelessDebuggingDialogOpen(true);
  };

  return (
    <Dialog
      open={isDeviceSelectionModalOpen}
      onOpenChange={(_, data) => setDeviceSelectionModalOpen(data.open)}
      modalType="modal"
    >
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <Text className={styles.title}>{t("device_selection.title", "选择设备")}</Text>
              <Text className={styles.subtitle}>
                {devices.length > 0
                  ? `共检测到 ${devices.length} 台可用设备，点击直接切换`
                  : "当前未检测到已连接的设备"}
              </Text>
            </div>

            <div className={styles.headerActions}>
              <Tooltip content="刷新设备列表" relationship="label">
                <Button
                  appearance="subtle"
                  icon={
                    <ArrowClockwise20Regular
                      className={mergeClasses(isRefreshing && styles.rotating)}
                    />
                  }
                  className={styles.actionBtn}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                />
              </Tooltip>

              <Tooltip content="关闭" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Dismiss20Regular />}
                  className={styles.actionBtn}
                  onClick={() => setDeviceSelectionModalOpen(false)}
                />
              </Tooltip>
            </div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {devices.length === 0 ? (
              <div className={styles.emptyContainer}>
                <Phone24Regular className={styles.emptyIcon} />
                <Text size={300} weight="semibold" style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t("device_selection.no_devices", "暂无已连接设备")}
                </Text>
                <Text size={200} style={{ textAlign: "center", maxWidth: "280px" }}>
                  {t(
                    "device_selection.no_devices_hint",
                    "请使用 USB 数据线连接手机并开启开发者选项与 USB 调试，或使用无线调试"
                  )}
                </Text>
              </div>
            ) : (
              <motion.div
                className={styles.deviceList}
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {devices.map((device) => {
                    const isSelected = selectedDevice?.serial === device.serial;
                    return (
                      <motion.div
                        key={device.serial}
                        variants={itemVariants}
                        layout
                        className={mergeClasses(
                          styles.deviceItem,
                          isSelected && styles.selectedDevice
                        )}
                        onClick={() => handleDeviceSelect(device)}
                      >
                        <div className={styles.deviceInfo}>
                          <div
                            className={mergeClasses(
                              styles.statusIndicator,
                              getDeviceStatusColor(device.mode)
                            )}
                          />
                          <div className={styles.deviceDetails}>
                            <Text className={styles.deviceName}>
                              {getDeviceDisplayName(device)}
                            </Text>
                            <div className={styles.deviceMeta}>
                              <span className={styles.serialText}>{device.serial}</span>
                              <Badge appearance="tint" color="brand" size="small">
                                {device.mode.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckmarkCircle24Regular
                            style={{ color: "#0071e3", flexShrink: 0 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Button
              appearance="subtle"
              icon={<Wifi124Regular />}
              size="small"
              onClick={handleOpenWireless}
            >
              无线调试连接
            </Button>
            <Button
              appearance="secondary"
              size="small"
              onClick={() => setDeviceSelectionModalOpen(false)}
            >
              关闭
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DeviceSelectionModal;
