import React, { useRef, useState }  from 'react';
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
} from "@fluentui/react-components";
import {
  CloudArrowUp24Regular,
  Warning24Regular,
  Document24Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";


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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPartition, setSelectedPartition] = useState<string>("");
  const [flashStatus, setFlashStatus] = useState<FlashStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [flashLog, setFlashLog] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 检查文件格式
      const validExtensions = ['.img', '.bin', '.raw', '.sparse'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setFlashLog("");
        setFlashStatus("idle");
      } else {
        alert("不支持的文件格式。请选择 .img, .bin, .raw 或 .sparse 文件。");
      }
    }
  };

  const handleFlashStart = () => {
    if (!selectedFile || !selectedPartition) return;
    setShowConfirmDialog(true);
  };

  const handleFlashConfirm = async () => {
    if (!selectedFile || !selectedPartition) return;
    
    setShowConfirmDialog(false);
    setIsFlashing(true);
    setFlashStatus("preparing");
    setProgress(0);
    setFlashLog("准备刷入镜像...\n");

    try {
      // 模拟刷入过程
      setFlashStatus("flashing");
      setFlashLog(prev => prev + `开始刷入 ${selectedFile.name} 到 ${selectedPartition} 分区...\n`);
      
      // 这里应该调用实际的刷入服务
      // const result = await deviceService.flashImage(device.serial, selectedFile.path, selectedPartition);
      
      // 模拟进度更新
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress(i);
        setFlashLog(prev => prev + `刷入进度: ${i}%\n`);
      }
      
      setFlashStatus("success");
      setFlashLog(prev => prev + "镜像刷入完成！\n");
      
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
              
              {selectedFile && (
                <div className={styles.fileInfo}>
                  <div>文件名: {selectedFile.name}</div>
                  <div>大小: {formatFileSize(selectedFile.size)}</div>
                  <div>类型: {selectedFile.type || "未知"}</div>
                </div>
              )}
            </div>
          </div>

          {/* 分区选择 */}
          <div className={styles.section}>
            <Text weight="semibold">2. 选择目标分区</Text>
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
              disabled={!selectedFile || !selectedPartition || isFlashing}
            >
              {isFlashing ? "刷入中..." : "开始刷入"}
            </Button>
          </div>
        </div>
      </Card>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".img,.bin,.raw,.sparse"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

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
                  <div>设备: {device.properties?.model} ({device.serial})</div>
                  <div>文件: {selectedFile?.name}</div>
                  <div>分区: {partitions.find(p => p.value === selectedPartition)?.label}</div>
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
