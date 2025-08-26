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

  // 常见分区列表
  const partitions = [
    { value: "boot", label: "Boot (启动分区)" },
    { value: "recovery", label: "Recovery (恢复分区)" },
    { value: "system", label: "System (系统分区)" },
    { value: "vendor", label: "Vendor (厂商分区)" },
    { value: "userdata", label: "Userdata (用户数据)" },
    { value: "cache", label: "Cache (缓存分区)" },
    { value: "persist", label: "Persist (持久化分区)" },
    { value: "modem", label: "Modem (基带分区)" },
    { value: "aboot", label: "Aboot (引导程序)" },
    { value: "splash", label: "Splash (开机画面)" },
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
        alert("不支持的文件格式。请选择 .img, .bin, .raw 或 .sparse 文件。");
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
    setFlashStatus("preparing");
    setProgress(0);
    setFlashLog("准备刷入镜像...\n");

    try {
      // 实际刷入逻辑（fastboot）
      setFlashStatus("flashing");
      setProgress(10);
      setFlashLog(prev => prev + `开始刷入 ${selectedFileName} 到 ${selectedPartition} 分区，模式：${
        flashMode === 'ab' ? 'A/B 同时' : flashMode === 'a' ? '仅 A' : flashMode === 'b' ? '仅 B' : '直接分区'
      }...\n`);

      // 可选：检查 fastboot 可用
      try {
        const chk = await deviceService.checkFastbootAvailability();
        if (!chk.success) {
          setFlashLog(prev => prev + `Fastboot 不可用: ${chk.error || chk.output}\n`);
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
        setFlashLog(prev => prev + `\n>>> 正在刷入分区：${target}\n`);
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
          setFlashLog(prev => prev + `分区 ${target} 刷入失败: ${result.error || '未知错误'}\n`);
          // A/B 同时模式下，若一个失败，继续尝试后续目标，但最终判定失败
        }
      }

      setProgress(100);
      if (overallSuccess) {
        setFlashStatus("success");
        setFlashLog(prev => prev + "\n所有目标分区刷入完成！\n");
      } else {
        setFlashStatus("error");
        setFlashLog(prev => prev + "\n刷入过程中发生错误，请检查日志。\n");
      }
      
    } catch (error) {
      setFlashStatus("error");
      setFlashLog(prev => prev + `刷入失败: ${error}\n`);
    } finally {
      setIsFlashing(false);
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
        <CardHeader
          image={<CloudArrowUp24Regular />}
          header={<Text weight="semibold">镜像刷入工具</Text>}
          description={<Text size={200}>刷入自定义镜像文件到指定分区</Text>}
        />
        
        <div className={styles.content}>
          {/* 警告提示 */}
          <div className={styles.warningSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
              <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                刷入风险警告
              </Text>
            </div>
            <Text size={300} style={{ color: "var(--colorPaletteRedForeground2)" }}>
              错误的镜像文件或分区选择可能导致设备无法启动。请确保镜像文件与设备型号匹配，并已备份原始分区。
            </Text>
          </div>

          {/* 文件选择 */}
          <div className={styles.section}>
            <Text weight="semibold">1. 选择镜像文件</Text>
            <div className={styles.fileSection}>
              <div className={styles.fileInput}>
                <Button
                  appearance="outline"
                  icon={<Document24Regular />}
                  onClick={handleFileSelect}
                  disabled={isFlashing}
                >
                  选择文件
                </Button>
                <Text size={300}>支持格式: .img, .bin, .raw, .sparse</Text>
              </div>
              
              {selectedFilePath && (
                <div className={styles.fileInfo}>
                  <div>文件名: {selectedFileName}</div>
                  {selectedFileSize != null && (
                    <div>大小: {formatFileSize(selectedFileSize)}</div>
                  )}
                  <div>路径: {selectedFilePath}</div>
                </div>
              )}
            </div>
          </div>

          {/* 分区选择 */}
          <div className={styles.section}>
            <Text weight="semibold">2. 选择目标分区</Text>
            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>选择基础分区名称，A/B 模式会自动附加后缀 _a / _b</Text>
            <Field>
              <Dropdown
                placeholder="选择要刷入的分区"
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
            <Text weight="semibold">3. 选择刷入模式（四选一）</Text>
            <RadioGroup
              value={flashMode}
              onChange={(_, data) => setFlashMode((data.value as 'ab' | 'a' | 'b' | 'direct'))}
            >
              <Radio value="ab" label="同时刷入 A/B 分区（例如：boot_a 与 boot_b）" disabled={isFlashing} />
              <Radio value="a" label="仅刷入 A 分区（例如：boot_a）" disabled={isFlashing} />
              <Radio value="b" label="仅刷入 B 分区（例如：boot_b）" disabled={isFlashing} />
              <Radio value="direct" label="直接刷入所选分区（不加 _a/_b 后缀）" disabled={isFlashing} />
            </RadioGroup>
          </div>

          {/* 刷入进度 */}
          {flashStatus !== "idle" && (
            <div className={styles.section}>
              <Text weight="semibold">刷入进度</Text>
              <div className={styles.progressSection}>
                <ProgressBar value={progress / 100} />
                <Text size={300}>{progress}%</Text>
              </div>
            </div>
          )}

          {/* 日志输出 */}
          {flashLog && (
            <div className={styles.section}>
              <Text weight="semibold">操作日志</Text>
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
              {isFlashing ? "刷入中..." : "开始刷入"}
            </Button>
          </div>
        </div>
      </Card>

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={(_, data) => setShowConfirmDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>确认刷入操作</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                  <Text weight="semibold">请仔细确认以下信息：</Text>
                </div>
                
                <div style={{ padding: "12px", backgroundColor: "var(--colorNeutralBackground2)", borderRadius: "4px" }}>
                  <div>设备: {device?.properties?.model || '未知设备'} ({device?.serial || '未知序列号'})</div>
                  <div>文件: {selectedFileName || '未选择'}</div>
                  <div>分区: {partitions.find(p => p.value === selectedPartition)?.label}</div>
                  <div>模式: {flashMode === 'ab' ? '同时刷入 A/B' : flashMode === 'a' ? '仅 A' : flashMode === 'b' ? '仅 B' : '直接分区'}</div>
                </div>
                
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                  此操作不可逆转，错误的操作可能导致设备无法启动。确定要继续吗？
                </Text>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button appearance="primary" onClick={handleFlashConfirm}>
              确认刷入
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default ImageFlashCard;
