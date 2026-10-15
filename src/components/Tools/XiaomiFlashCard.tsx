import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Card,
  Text,
  Button,
  ProgressBar,
  Spinner,
  Badge,
  Tooltip,
} from "@fluentui/react-components";
import {
  Warning24Regular,
  Folder24Regular,
  Play24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  LockClosed24Regular,
  ShieldCheckmark24Regular,
  ShieldError24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import BatchExecutorDialog from "../Common/BatchExecutorDialog";
import { useTranslation } from "react-i18next";

import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";


const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  packageSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  packageInput: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
  },
  packageInfo: {
    padding: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  deviceInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    padding: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    fontSize: "13px",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  logOutput: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "12px",
    padding: "12px",
    maxHeight: "300px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
  },
  warningSection: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    border: "1px solid var(--colorPaletteRedBorder1)",
    padding: "16px",
    borderRadius: "12px",
  },
  infoSection: {
    backgroundColor: "var(--colorPaletteBlueBackground1)",
    border: "1px solid var(--colorPaletteBlueBorder1)",
    padding: "16px",
    borderRadius: "12px",
  },
  arbDangerAlert: {
    padding: "12px 16px",
    borderRadius: "12px",
    backgroundColor: "rgba(235, 87, 87, 0.12)",
    border: "1px solid rgba(235, 87, 87, 0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  arbSafeAlert: {
    padding: "10px 14px",
    borderRadius: "12px",
    backgroundColor: "rgba(39, 174, 96, 0.12)",
    border: "1px solid rgba(39, 174, 96, 0.35)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  stepList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingLeft: "16px",
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  actionButtonContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  actionButton: {
    minHeight: "36px",
    width: "100%",
    borderRadius: "9999px",
  },
});

interface XiaomiFlashCardProps {
  device: DeviceInfo | null;
  onFastbootRequired: () => void;
}

type FlashStatus = "idle" | "checking" | "flashing" | "success" | "error";

const XiaomiFlashCard: React.FC<XiaomiFlashCardProps> = ({ device, onFastbootRequired }) => {
  const styles = useStyles();
  useDeviceService();
  const { config, updateConfig, setStatusBarMessage, clearStatusBarMessage } = useAppStore();
  const { t } = useTranslation();

  // 页面高危提示移至状态栏显示，退出该页面时自动清理
  useEffect(() => {
    setStatusBarMessage({
      type: "warning",
      source: "tools:xiaomi-flash",
      message: `${t('flash.xiaomi_risk_title')}: ${t('flash.xiaomi_risk_desc1')} ${t('flash.xiaomi_risk_desc2')}`,
      duration: 0,
    });
    return () => {
      clearStatusBarMessage("tools:xiaomi-flash");
    };
  }, [setStatusBarMessage, clearStatusBarMessage, t]);

  
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [packageInfo, setPackageInfo] = useState<Record<string, unknown> | null>(null);
  const [flashStatus, setFlashStatus] = useState<FlashStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [flashLog, setFlashLog] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const [deviceCompatible, setDeviceCompatible] = useState<boolean | null>(null);
  const [mode, setMode] = useState<string>("miui");
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchDialogTitle, setBatchDialogTitle] = useState<string>("");
  const [batchFileName, setBatchFileName] = useState<string>("");
  const [batchWorkingDirectory, setBatchWorkingDirectory] = useState<string>("");
  const [originalAutoDetect, setOriginalAutoDetect] = useState<boolean>(config.autoDetectDevices);

  const [deviceAnti, setDeviceAnti] = useState<string | null>(null);
  const [romAnti, setRomAnti] = useState<string | null>(null);
  const [romProduct, setRomProduct] = useState<string | null>(null);
  const [arbStatus, setArbStatus] = useState<"safe" | "danger" | "unknown">("unknown");

  // 监听设备变化，在 Fastboot 模式下自动读取设备 ARB 硬件等级
  useEffect(() => {
    let isCancelled = false;
    const fetchDeviceArb = async () => {
      if (!device || (device.mode !== "fastboot" && device.mode !== "fastbootd")) {
        setDeviceAnti(null);
        return;
      }
      try {
        const res = await invoke<{ success: boolean; anti: string | null }>("fastboot_get_anti_rollback", {
          serial: device.serial,
        });
        if (!isCancelled && res && res.anti) {
          setDeviceAnti(res.anti);
        } else if (!isCancelled) {
          setDeviceAnti(null);
        }
      } catch {
        if (!isCancelled) setDeviceAnti(null);
      }
    };
    fetchDeviceArb();
    return () => {
      isCancelled = true;
    };
  }, [device]);

  // ARB 防回滚比对
  useEffect(() => {
    if (deviceAnti && romAnti) {
      const devNum = parseInt(deviceAnti, 10);
      const romNum = parseInt(romAnti, 10);
      if (!isNaN(devNum) && !isNaN(romNum)) {
        if (devNum > romNum) {
          setArbStatus("danger");
          return;
        } else {
          setArbStatus("safe");
          return;
        }
      }
    }
    setArbStatus("unknown");
  }, [deviceAnti, romAnti]);

  // 检查设备是否处于 Fastboot 或 Fastbootd 模式
  const checkMode = () => {
    if (!device) {
       setStatusBarMessage({ type: "warning", message: t('unlock.select_device_first') });
       return false;
    }

    // 检查模式：只能在 fastboot 或 fastbootd 模式下刷入
    if (device.mode !== "fastboot" && device.mode !== "fastbootd") {
      onFastbootRequired();
      return false;
    }

    return true;
  };

  const handleBatchDialogClose = () => {
    setBatchDialogOpen(false);
    // 恢复原始的自动检测状态
    if (originalAutoDetect) {
      updateConfig({ autoDetectDevices: true });
    }
  };

  const handlePackageSelect = async () => {
    try {
      // 使用 Tauri v2 的对话框API打开目录选择器
      const { open } = await import('@tauri-apps/plugin-dialog');
      
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('flash.xiaomi_step1')
      }) as string | string[] | null;
      
      if (!selected) return;
      
      // 确保路径是字符串类型
      const dir = Array.isArray(selected) ? selected[0] : selected;
      setSelectedFolderPath(dir);

      // 读取目录下文件，校验必要脚本是否存在
      const entries = await readDir(dir);
      const names = entries.map(e => e.name || "");
      const required = [
        "flash_all.bat",
        "flash_all_lock.bat",
        "flash_all_except_storage.bat",
      ];
      const missing = required.filter(r => !names.includes(r));
      setMissingFiles(missing);
      setSelectedPackage(dir.split(/[/\\]/).pop() || dir);

      // 读取 flash_all.bat 解析 ARB 和 product
      try {
        const batPath = `${dir}\\flash_all.bat`;
        const content = await readTextFile(batPath);
        const antiMatch = content.match(/CURRENT_ANTI_VER\s*=\s*(\d+)/i);
        if (antiMatch) {
          setRomAnti(antiMatch[1]);
        } else {
          setRomAnti(null);
        }

        const productMatch = content.match(/\^product:\s*\*([a-zA-Z0-9_-]+)/i) || content.match(/TARGET_PRODUCT\s*=\s*([a-zA-Z0-9_-]+)/i);
        if (productMatch) {
          setRomProduct(productMatch[1]);
        } else {
          setRomProduct(null);
        }
      } catch {
        setRomAnti(null);
        setRomProduct(null);
      }

      setFlashLog("");
      setFlashStatus("idle");
    } catch (e) {
      console.error(t('flash.read_dir_fail'), e);
      setMissingFiles([t('flash.read_dir_fail')]);
    }
  };


  return (
    <>
      <Card className={styles.card}>
        
        <div className={styles.content}>
          {/* 线刷包选择 */}
          <div className={styles.section}>
            <Text weight="semibold">{t('flash.xiaomi_step1')}</Text>
            <div className={styles.packageSection}>
              <div className={styles.packageInput}>
                <Button
                  appearance="outline"
                  icon={<Folder24Regular />}
                  onClick={handlePackageSelect}
                  disabled={isFlashing}
                >
                  {t('flash.select_folder')}
                </Button>
                {!selectedFolderPath ? (
                  <Text size={300}>{t('flash.xiaomi_select_hint')}</Text>
                ) : (
                  <>
                    <Button appearance="secondary" onClick={() => {
                          setSelectedFolderPath("");
                          setMissingFiles([]);
                          setSelectedPackage("");
                          setRomAnti(null);
                          setRomProduct(null);
                          setArbStatus("unknown");
                        }}>{t('common.clear')}</Button>
                  </>
                )}
              </div>
              {selectedFolderPath && (
                <div className={styles.packageInfo}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Text weight="semibold">{t('flash.directory')}</Text>
                    <Tooltip content={selectedFolderPath} relationship="label">
                      <Text style={{ 
                        flex: 1, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        fontFamily: 'monospace',
                        color: 'var(--colorNeutralForeground2)'
                      }}>
                        {selectedFolderPath}
                      </Text>
                    </Tooltip>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Badge 
                      appearance={missingFiles.includes('flash_all.bat') ? "ghost" : "filled"}
                      color={missingFiles.includes('flash_all.bat') ? "danger" : "brand"}
                      icon={missingFiles.includes('flash_all.bat') ? <ErrorCircle24Regular /> : <CheckmarkCircle24Regular />}
                    >
                      flash_all.bat ({t('common.clear')})
                    </Badge>
                    <Badge 
                      appearance={missingFiles.includes('flash_all_except_storage.bat') ? "ghost" : "filled"}
                      color={missingFiles.includes('flash_all_except_storage.bat') ? "danger" : "success"}
                      icon={missingFiles.includes('flash_all_except_storage.bat') ? <ErrorCircle24Regular /> : <CheckmarkCircle24Regular />}
                    >
                      flash_all_except_storage.bat ({t('common.keep')})
                    </Badge>
                    <Badge 
                      appearance={missingFiles.includes('flash_all_lock.bat') ? "ghost" : "filled"}
                      color={missingFiles.includes('flash_all_lock.bat') ? "danger" : "danger"}
                      icon={missingFiles.includes('flash_all_lock.bat') ? <ErrorCircle24Regular /> : <LockClosed24Regular />}
                    >
                      flash_all_lock.bat ({t('common.lock')})
                    </Badge>
                  </div>

                  {/* ARB 防回滚安全告警与状态展示 */}
                  {arbStatus === "danger" && (
                    <div className={styles.arbDangerAlert} style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldError24Regular style={{ color: 'var(--colorPaletteRedForeground1)', flexShrink: 0 }} />
                        <Text weight="semibold" style={{ color: 'var(--colorPaletteRedForeground1)' }}>
                          {t('flash.arb_danger_desc')}
                        </Text>
                      </div>
                      <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
                        {t('flash.arb_device_level')}: {deviceAnti} | {t('flash.arb_rom_level')}: {romAnti}
                      </Text>
                    </div>
                  )}

                  {arbStatus === "safe" && (
                    <div className={styles.arbSafeAlert} style={{ marginTop: '12px' }}>
                      <ShieldCheckmark24Regular style={{ color: 'var(--colorPaletteGreenForeground1)', flexShrink: 0 }} />
                      <Text size={200} style={{ color: 'var(--colorPaletteGreenForeground1)' }}>
                        {t('flash.arb_safe_desc')} ({t('flash.arb_device_level')}: {deviceAnti}, {t('flash.arb_rom_level')}: {romAnti})
                      </Text>
                    </div>
                  )}

                  {romAnti && arbStatus === "unknown" && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                      <Badge appearance="outline" color="informative">
                        {t('flash.arb_rom_level')}: {romAnti}
                      </Badge>
                      {romProduct && (
                        <Badge appearance="outline" color="informative">
                          目标型号: {romProduct}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 刷入进度 */}
              {flashStatus !== "idle" && (
                <div className={styles.section}>
                  <Text weight="semibold">{t('flash.xiaomi_progress')}</Text>
                  <div className={styles.progressSection}>
                    <ProgressBar value={progress / 100} />
                    <Text size={300}>{progress.toFixed(1)}%</Text>
                  </div>
                </div>
              )}

              {/* 日志输出 */}
              {flashLog && (
                <div className={styles.section}>
                  <Text weight="semibold">{t('flash.xiaomi_log')}</Text>
                  <div className={styles.logOutput}>
                    {flashLog}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: 'auto' }}>
                  {/* Clean Data */}
                  <div className={styles.actionButtonContainer}>
                    <Button 
                      className={styles.actionButton}
                      appearance="primary" 
                      icon={<Play24Regular />} 
                      disabled={!selectedFolderPath || missingFiles.includes('flash_all.bat') || isFlashing || arbStatus === "danger"}
                      onClick={() => {
                        if (!checkMode()) return;
                        setBatchDialogTitle(`${t('flash.flash_clean')} (flash_all.bat)`);
                        setBatchFileName("flash_all.bat");
                        setBatchWorkingDirectory(selectedFolderPath);
                        setBatchDialogOpen(true);
                      }}
                    >
                      {t('flash.flash_clean')}
                    </Button>
                    <Text size={200} align="center" style={{ color: "var(--colorNeutralForeground3)" }}>
                      {t('flash.flash_clean_sub')}
                    </Text>
                  </div>

                  {/* Keep Data */}
                  <div className={styles.actionButtonContainer}>
                    <Button 
                      className={styles.actionButton}
                      appearance="outline"
                      style={{ color: "var(--colorPaletteGreenForeground1)", borderColor: "var(--colorPaletteGreenBorder1)" }}
                      icon={<Play24Regular />} 
                      disabled={!selectedFolderPath || missingFiles.includes('flash_all_except_storage.bat') || isFlashing || arbStatus === "danger"}
                      onClick={() => {
                        if (!checkMode()) return;
                        setBatchDialogTitle(`${t('flash.flash_keep')} (flash_all_except_storage.bat)`);
                        setBatchFileName("flash_all_except_storage.bat");
                        setBatchWorkingDirectory(selectedFolderPath);
                        setBatchDialogOpen(true);
                      }}
                    >
                      {t('flash.flash_keep')}
                    </Button>
                    <Text size={200} align="center" style={{ color: "var(--colorNeutralForeground3)" }}>
                      {t('flash.flash_keep_sub')}
                    </Text>
                  </div>

                  {/* Lock */}
                  <div className={styles.actionButtonContainer}>
                    <Button 
                      className={styles.actionButton}
                      appearance="primary" 
                      style={{ backgroundColor: "var(--colorPaletteRedBackground3)", borderColor: "var(--colorPaletteRedBorderActive)" }}
                      icon={<LockClosed24Regular />} 
                      disabled={!selectedFolderPath || missingFiles.includes('flash_all_lock.bat') || isFlashing || arbStatus === "danger"}
                      onClick={() => {
                        if (!checkMode()) return;
                        setBatchDialogTitle(`${t('flash.flash_lock')} (flash_all_lock.bat)`);
                        setBatchFileName("flash_all_lock.bat");
                        setBatchWorkingDirectory(selectedFolderPath);
                        setBatchDialogOpen(true);
                      }}
                    >
                      {t('flash.flash_lock')}
                    </Button>
                    <Text size={200} align="center" style={{ color: "var(--colorPaletteRedForeground2)" }}>
                      {t('flash.flash_lock_sub')}
                    </Text>
                  </div>
              </div>
          </div>
      </Card>

      {/* 批处理文件执行弹窗 */}
      <BatchExecutorDialog
        open={batchDialogOpen}
        title={batchDialogTitle}
        batchFileName={batchFileName}
        workingDirectory={batchWorkingDirectory}
        onClose={handleBatchDialogClose}
      />
    </>
  );
};

export default XiaomiFlashCard;
