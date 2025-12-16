import React, { useState }  from 'react';
import {
  makeStyles,
  Card,
  Text,
  Button,
  ProgressBar,
  Spinner,
  Badge,
} from "@fluentui/react-components";
import {
  Warning24Regular,
  Folder24Regular,
  Play24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useDeviceStore } from "../../stores/deviceStore";
import { useAppStore } from "../../stores/appStore";
import BatchExecutorDialog from "../Common/BatchExecutorDialog";

import { readDir } from "@tauri-apps/plugin-fs";


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
    borderRadius: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
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
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.5,
  },
  deviceInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    padding: "16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "8px",
    fontSize: "14px",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statusBadge: {
    alignSelf: "flex-start",
    transition: "all 0.2s ease",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  },
  logOutput: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    borderRadius: "8px",
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
    borderRadius: "8px",
  },
  infoSection: {
    backgroundColor: "var(--colorPaletteBlueBackground1)",
    border: "1px solid var(--colorPaletteBlueBorder1)",
    padding: "16px",
    borderRadius: "8px",
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
});

interface XiaomiFlashCardProps {
  device: DeviceInfo;
}

type FlashStatus = "idle" | "checking" | "flashing" | "success" | "error";

const XiaomiFlashCard: React.FC<XiaomiFlashCardProps> = ({ device }) => {
  const styles = useStyles();
  useDeviceService();
  const { setFlashing } = useDeviceStore();
  const { config, updateConfig } = useAppStore();
  
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
        title: '选择线刷包目录'
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

      // 将选择结果映射到旧字段以沿用展示（包名等后续仍为模拟）
      setSelectedPackage(dir.split(/[/\\]/).pop() || dir);
      // 清空旧的解析/状态
      setPackageInfo(null);
      setDeviceCompatible(null);
      setFlashLog("");
      setFlashStatus("idle");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("读取目录失败", e);
      setMissingFiles(["读取目录失败"]);
    }
  };

  const _handlePackageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const packagePath = file.webkitRelativePath.split('/')[0];
      
      try {
        // 检查是否包含必要的线刷文件
        const hasFlashScript = Array.from(files).some(f => 
          f.name === 'flash_all.bat' || f.name === 'flash_all.sh'
        );
        
        if (!hasFlashScript) {
          alert("未找到线刷脚本文件 (flash_all.bat/flash_all.sh)");
          return;
        }

        setSelectedPackage(packagePath);
        
        // 解析包信息
        const info = await parsePackageInfo(files);
        setPackageInfo(info);
        
        // 检查设备兼容性
        const compatible = await checkDeviceCompatibility(info, device);
        setDeviceCompatible(compatible);
        
        setFlashLog("");
        setFlashStatus("idle");
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("解析线刷包失败:", error);
        alert("解析线刷包失败，请检查文件完整性");
      }
    }
  };

  const parsePackageInfo = async (files: FileList): Promise<Record<string, unknown>> => {
    // 模拟解析线刷包信息
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          version: "V14.0.6.0.TKACNXM",
          codename: "star",
          model: "Mi Mix 3",
          region: "CN",
          android: "11",
          size: Array.from(files).reduce((total, file) => total + file.size, 0),
          fileCount: files.length,
        });
      }, 1000);
    });
  };

  const checkDeviceCompatibility = async (packageInfo: Record<string, unknown>, device: DeviceInfo): Promise<boolean> => {
    // 模拟设备兼容性检查
    return new Promise((resolve) => {
      setTimeout(() => {
        // 简单的兼容性检查逻辑
        const deviceModel = device?.properties?.model?.toLowerCase() || '';
        const packageCodename = packageInfo.codename.toLowerCase();
        
        resolve(deviceModel.includes(packageCodename) || packageCodename.includes("star"));
      }, 500);
    });
  };

  const _handleFlashStart = (_fileName: string, _title: string, _clearData: boolean, _relock: boolean) => {
    // 此函数不再使用，已由直接调用BatchExecutorDialog替代
  };

  const _handleFlashConfirm = async () => {
    // 此函数不再使用，已由BatchExecutorDialog组件处理
  };

  const getStatusBadge = () => {
    switch (flashStatus) {
      case "checking":
        return <Badge appearance="outline" color="brand" icon={<Spinner size="tiny" />} style={{ display: 'flex', flexDirection: 'row' }}>检查中</Badge>;
      case "flashing":
        return <Badge appearance="outline" color="important" icon={<Spinner size="tiny" />} style={{ display: 'flex', flexDirection: 'row' }}>刷入中</Badge>;
      case "success":
        return <Badge appearance="outline" color="success" icon={<CheckmarkCircle24Regular />} style={{ display: 'flex', flexDirection: 'row' }}>成功</Badge>;
      case "error":
        return <Badge appearance="outline" color="danger" icon={<ErrorCircle24Regular />} style={{ display: 'flex', flexDirection: 'row' }}>失败</Badge>;
        }
  };


  return (
    <>
      <Card className={styles.card}>
        
        <div className={styles.content}>
          {/* 风险提示卡片 */}
          <div className={styles.warningSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
              <Text weight="semibold">线刷风险提示</Text>
            </div>
            <Text size={300} style={{ marginTop: "8px" }}>
              线刷可能导致数据丢失、设备不可用或失去保修。请确保您了解并自行承担相关风险。
            </Text>
            <Text size={300} style={{ marginTop: "4px" }}>
              本工具按"现状"提供，不对因使用本工具进行线刷所造成的任何直接或间接损失负责。
            </Text>
          </div>

          {/* 线刷包选择 */}
          <div className={styles.section}>
            <Text weight="semibold">1. 选择线刷包</Text>
                <div className={styles.packageSection}>
                  <div className={styles.packageInput}>
                    <Button
                      appearance="outline"
                      icon={<Folder24Regular />}
                      onClick={handlePackageSelect}
                      disabled={isFlashing}
                    >
                      选择文件夹
                    </Button>
                    {!selectedFolderPath ? (
                      <Text size={300}>选择包含 flash_all*.bat 的线刷包目录</Text>
                    ) : (
                      <>
                        <Button appearance="secondary" onClick={() => {
                          setSelectedFolderPath("");
                          setMissingFiles([]);
                          setSelectedPackage("");
                          setPackageInfo(null);
                          setDeviceCompatible(null);
                        }}>清除</Button>
                      </>
                    )}
                  </div>
                  {selectedFolderPath && (
                    <div className={styles.packageInfo}>
                      <div>目录: {selectedFolderPath}</div>
                      {missingFiles.length > 0 ? (
                        <div style={{ color: "var(--colorPaletteRedForeground2)", fontWeight: 600 }}>
                          当前包体不完整，缺少: {missingFiles.join(", ")}
                        </div>
                      ) : (
                        <div style={{ color: "var(--colorPaletteGreenForeground1)", fontWeight: 600 }}>
                          已检测到必要脚本：flash_all.bat / flash_all_except_storage.bat / flash_all_lock.bat
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 刷入进度 */}
              {flashStatus !== "idle" && (
                <div className={styles.section}>
                  <Text weight="semibold">线刷进度</Text>
                  <div className={styles.progressSection}>
                    <ProgressBar value={progress / 100} />
                    <Text size={300}>{progress.toFixed(1)}%</Text>
                  </div>
                </div>
              )}

              {/* 日志输出 */}
              {flashLog && (
                <div className={styles.section}>
                  <Text weight="semibold">线刷日志</Text>
                  <div className={styles.logOutput}>
                    {flashLog}
                  </div>
                </div>
              )}

              {/* 操作按钮（仅当三个脚本都存在时显示） */}
              {selectedFolderPath && missingFiles.length === 0 && (
                <div className={styles.actions}>
                  <Text>2. 开始线刷</Text>
                  <Button appearance="primary" icon={<Play24Regular />} onClick={() => {
                    setBatchDialogTitle("线刷清数据 (flash_all.bat)");
                    setBatchFileName("flash_all.bat");
                    setBatchWorkingDirectory(selectedFolderPath);
                    setBatchDialogOpen(true);
                  }}>
                    线刷清数据
                  </Button>
                  <Button appearance="secondary" icon={<Play24Regular />} onClick={() => {
                    setBatchDialogTitle("线刷不清数据 (flash_all_except_storage.bat)");
                    setBatchFileName("flash_all_except_storage.bat");
                    setBatchWorkingDirectory(selectedFolderPath);
                    setBatchDialogOpen(true);
                  }}>
                    线刷不清数据
                  </Button>
                  <Button appearance="outline" icon={<Play24Regular />} onClick={() => {
                    setBatchDialogTitle("线刷回锁 (flash_all_lock.bat)");
                    setBatchFileName("flash_all_lock.bat");
                    setBatchWorkingDirectory(selectedFolderPath);
                    setBatchDialogOpen(true);
                  }}>
                    线刷清数据并回锁
                  </Button>
                </div>
          )}
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
