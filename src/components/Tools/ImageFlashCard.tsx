import React, { useRef, useState }  from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Field,
  Dropdown,
  Option,
  ProgressBar,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  RadioGroup,
  Radio,
} from "@fluentui/react-components";
import {
  CloudArrowUp24Regular,
  Warning24Regular,
  Document24Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import { useTranslation } from "react-i18next";


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
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  fileSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fileInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  fileInfo: {
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  statusBadge: {
    alignSelf: "flex-start",
  },
  logOutput: {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "4px",
    padding: "8px",
    maxHeight: "200px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
  },
  warningSection: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    border: "1px solid var(--colorPaletteRedBorder1)",
    padding: "12px",
    borderRadius: "6px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
});

interface ImageFlashCardProps {
  device: DeviceInfo;
}

type FlashStatus = "idle" | "preparing" | "flashing" | "success" | "error";

const ImageFlashCard: React.FC<ImageFlashCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const { setFlashing } = useDeviceStore();
  const { config, updateConfig } = useAppStore();
  const { t } = useTranslation();
  
  // 选择的镜像文件（使用 Tauri 原生文件选择，保留真实路径）
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [selectedPartition, setSelectedPartition] = useState<string>("");
  const [flashStatus, setFlashStatus] = useState<FlashStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [flashLog, setFlashLog] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashMode, setFlashMode] = useState<'ab' | 'a' | 'b' | 'direct'>("direct");
  const [originalAutoDetect, setOriginalAutoDetect] = useState<boolean>(config.autoDetectDevices);

  // 常见分区列表
  const partitions = [
    { value: "boot", label: "Boot" },
    { value: "recovery", label: "Recovery" },
    { value: "system", label: "System" },
    { value: "vendor", label: "Vendor" },
    { value: "userdata", label: "Userdata" },
    { value: "cache", label: "Cache" },
    { value: "persist", label: "Persist" },
    { value: "modem", label: "Modem" },
    { value: "aboot", label: "Aboot" },
    { value: "splash", label: "Splash" },
  ];

  const handleFileSelect = async () => {
    const result = await open({
      multiple: false,
      filters: [
        { name: "Images", extensions: ["img", "bin", "raw", "sparse"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (typeof result === "string") {
      const path = result;
      const lower = path.toLowerCase();
      const valid = [".img", ".bin", ".raw", ".sparse"].some(ext => lower.endsWith(ext));
      if (!valid) {
        alert(t('flash.unsupported_format'));
        return;
      }
      const name = path.split(/[/\\]/).pop() || path;
      setSelectedFilePath(path);
      setSelectedFileName(name);
      setSelectedFileSize(null);
      setFlashLog("");
      setFlashStatus("idle");
    }
  };

  const handleFlashStart = () => {
    if (!selectedFilePath || !selectedPartition) return;
    setShowConfirmDialog(true);
  };

  const handleFlashConfirm = async () => {
  if (!selectedFilePath || !selectedPartition) return;
  
  setShowConfirmDialog(false);
  setIsFlashing(true);
  setFlashing(true); // 设置全局刷写状态
  setFlashStatus("preparing");
  setProgress(0);
  setFlashLog(t('flash.log_preparing'));
  
  // 保存原始的自动检测状态，并关闭自动检测
  setOriginalAutoDetect(config.autoDetectDevices);
  if (config.autoDetectDevices) {
    updateConfig({ autoDetectDevices: false });
  }

  try {
    // 实际刷入逻辑（fastboot）
    setFlashStatus("flashing");
    setProgress(10);
    setFlashLog(prev => prev + t('flash.log_start', { 
      file: selectedFileName, 
      partition: selectedPartition, 
      mode: flashMode === 'ab' ? t('flash.mode_ab') : flashMode === 'a' ? t('flash.mode_a') : flashMode === 'b' ? t('flash.mode_b') : t('flash.mode_direct') 
    }));

    // 可选：检查 fastboot 可用
    try {
      const chk = await deviceService.checkFastbootAvailability();
      if (!chk.success) {
        setFlashLog(prev => prev + `${t('flash.log_fastboot_unavailable')}: ${chk.error || chk.output}\n`);
      }
    } catch (_) {}

    // 计算目标分区列表
    const targets: string[] = (() => {
      if (flashMode === 'ab') return [`${selectedPartition}_a`, `${selectedPartition}_b`];
      if (flashMode === 'a') return [`${selectedPartition}_a`];
      if (flashMode === 'b') return [`${selectedPartition}_b`];
      return [selectedPartition]; // direct
    })();

    let overallSuccess = true;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      setFlashLog(prev => prev + t('flash.log_flashing_target', { target }));
      const stepStart = 10 + Math.floor((80 / targets.length) * i);
      setProgress(stepStart);

      const result = await deviceService.fastbootFlashImage(
        device.serial,
        selectedFilePath,
        target
      );

      setFlashLog(prev => prev + (result.output || "") + "\n");
      if (!result.success) {
        overallSuccess = false;
        setFlashLog(prev => prev + t('flash.log_flash_failed', { target, error: result.error || t('unlock.unknown_error') }));
        // A/B 同时模式下，若一个失败，继续尝试后续目标，但最终判定失败
      }
    }

    setProgress(100);
    if (overallSuccess) {
      setFlashStatus("success");
      setFlashLog(prev => prev + t('flash.log_all_success'));
    } else {
      setFlashStatus("error");
      setFlashLog(prev => prev + t('flash.log_error_check'));
    }
    
  } catch (error) {
    setFlashStatus("error");
    setFlashLog(prev => prev + t('flash.log_failed', { error }));
  } finally {
    setIsFlashing(false);
    setFlashing(false); // 清除全局刷写状态
    // 恢复原始的自动检测状态
    if (originalAutoDetect) {
      updateConfig({ autoDetectDevices: true });
    }
  }
};


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Card className={styles.card}>
        
        <div className={styles.content}>
          {/* 警告提示 */}
          <div className={styles.warningSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
              <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                {t('flash.risk_warning_title')}
              </Text>
            </div>
            <Text size={300} style={{ color: "var(--colorPaletteRedForeground2)" }}>
              {t('flash.risk_warning_desc')}
            </Text>
          </div>

          {/* 文件选择 */}
          <div className={styles.section}>
            <Text weight="semibold">{t('flash.step1_title')}</Text>
            <div className={styles.fileSection}>
              <div className={styles.fileInput}>
                <Button
                  appearance="outline"
                  icon={<Document24Regular />}
                  onClick={handleFileSelect}
                  disabled={isFlashing}
                >
                  {t('flash.select_file_btn')}
                </Button>
                <Text size={300}>{t('flash.supported_formats')}</Text>
              </div>
              
              {selectedFilePath && (
                <div className={styles.fileInfo}>
                  <div>{t('flash.file_name')}{selectedFileName}</div>
                  {selectedFileSize != null && (
                    <div>{t('flash.file_size')}{formatFileSize(selectedFileSize)}</div>
                  )}
                  <div>{t('flash.file_path')}{selectedFilePath}</div>
                </div>
              )}
            </div>
          </div>

          {/* 分区选择 */}
          <div className={styles.section}>
            <Text weight="semibold">{t('flash.step2_title')}</Text>
            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>{t('flash.step2_desc')}</Text>
            <Field>
              <Dropdown
                placeholder={t('flash.select_partition_placeholder')}
                value={selectedPartition}
                onOptionSelect={(_, data) => setSelectedPartition(data.optionValue || "")}
                disabled={isFlashing}
              >
                {partitions.map((partition) => (
                  <Option key={partition.value} value={partition.value}>
                    {partition.label}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </div>

          {/* 刷入模式 */}
          <div className={styles.section}>
            <Text weight="semibold">{t('flash.step3_title')}</Text>
            <RadioGroup
              value={flashMode}
              onChange={(_, data) => setFlashMode((data.value as 'ab' | 'a' | 'b' | 'direct'))}
            >
              <Radio value="ab" label={t('flash.mode_ab')} disabled={isFlashing} />
              <Radio value="a" label={t('flash.mode_a')} disabled={isFlashing} />
              <Radio value="b" label={t('flash.mode_b')} disabled={isFlashing} />
              <Radio value="direct" label={t('flash.mode_direct')} disabled={isFlashing} />
            </RadioGroup>
          </div>

          {/* 刷入进度 */}
          {flashStatus !== "idle" && (
            <div className={styles.section}>
              <Text weight="semibold">{t('flash.progress_title')}</Text>
              <div className={styles.progressSection}>
                <ProgressBar value={progress / 100} />
                <Text size={300}>{progress}%</Text>
              </div>
            </div>
          )}

          {/* 日志输出 */}
          {flashLog && (
            <div className={styles.section}>
              <Text weight="semibold">{t('flash.log_title')}</Text>
              <div className={styles.logOutput}>
                {flashLog}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<Play24Regular />}
              onClick={handleFlashStart}
              disabled={!selectedFilePath || !selectedPartition || isFlashing}
            >
              {isFlashing ? t('flash.flashing_btn') : t('flash.start_flash_btn')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={(_, data) => setShowConfirmDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>{t('flash.confirm_dialog_title')}</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                  <Text weight="semibold">{t('flash.confirm_dialog_desc')}</Text>
                </div>
                
                <div style={{ padding: "12px", backgroundColor: "var(--colorNeutralBackground2)", borderRadius: "4px" }}>
                  <div>{t('flash.device_label')}{device?.properties?.model || t('mirror.unknown_device')} ({device?.serial || t('mirror.unknown_device')})</div>
                  <div>{t('flash.file_label')}{selectedFileName || '未选择'}</div>
                  <div>{t('flash.partition_label')}{partitions.find(p => p.value === selectedPartition)?.label}</div>
                  <div>{t('flash.mode_label')}{flashMode === 'ab' ? t('flash.mode_ab') : flashMode === 'a' ? t('flash.mode_a') : flashMode === 'b' ? t('flash.mode_b') : t('flash.mode_direct')}</div>
                </div>
                
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('flash.confirm_warning')}
                </Text>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowConfirmDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button appearance="primary" onClick={handleFlashConfirm}>
              {t('flash.confirm_btn')}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default ImageFlashCard;
