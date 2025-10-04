import React, { useRef, useState }  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  ProgressBar,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  Flash24Regular,
  Warning24Regular,
  Folder24Regular,
  Play24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import BatchExecutorDialog from "../Common/BatchExecutorDialog";
import { open } from "@tauri-apps/plugin-dialog";
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
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [flashStatus, setFlashStatus] = useState<FlashStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [flashLog, setFlashLog] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [deviceCompatible, setDeviceCompatible] = useState<boolean | null>(null);
  const [mode, setMode] = useState<string>("miui");
  const [riskAccepted, setRiskAccepted] = useState<boolean>(false);
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState<boolean>(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchDialogTitle, setBatchDialogTitle] = useState<string>("");
  const [batchFileName, setBatchFileName] = useState<string>("");
  const [batchWorkingDirectory, setBatchWorkingDirectory] = useState<string>("");

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
      console.error("读取目录失败", e);
      setMissingFiles(["读取目录失败"]);
    }
  };

  const handlePackageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error("解析线刷包失败:", error);
        alert("解析线刷包失败，请检查文件完整性");
      }
    }
  };

  const parsePackageInfo = async (files: FileList): Promise<any> => {
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

  const checkDeviceCompatibility = async (packageInfo: any, device: DeviceInfo): Promise<boolean> => {
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

  const handleFlashStart = () => {
    if (!selectedFolderPath) return;
    setShowConfirmDialog(true);
  };

  const handleFlashConfirm = async () => {
    if (!selectedFolderPath) return;
    // 这里保留模拟线刷逻辑；实际运行 .bat 使用下方三个专用按钮
    setShowConfirmDialog(false);
    setIsFlashing(true);
    setFlashStatus("checking");
    setProgress(0);
    setFlashLog("开始小米线刷流程...\n");

    try {
      // 设备检查阶段
      setFlashLog(prev => prev + "检查设备状态...\n");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFlashLog(prev => prev + "验证线刷包完整性...\n");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 开始刷机
      setFlashStatus("flashing");
      setFlashLog(prev => prev + "开始执行线刷脚本...\n");
      
      const flashSteps = [
        "清除用户数据分区...",
        "刷入引导程序...",
        "刷入基带固件...",
        "刷入系统镜像...",
        "刷入Vendor分区...",
        "刷入Recovery...",
        "刷入Boot镜像...",
        "重启设备...",
        "等待设备启动...",
        "验证刷入结果..."
      ];
      
      for (let i = 0; i < flashSteps.length; i++) {
        setFlashLog(prev => prev + flashSteps[i] + "\n");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setProgress(((i + 1) / flashSteps.length) * 100);
      }
      
      setFlashStatus("success");
      setFlashLog(prev => prev + "线刷完成！设备将自动重启。\n");
      
    } catch (error) {
      setFlashStatus("error");
      setFlashLog(prev => prev + `线刷失败: ${error}\n`);
    } finally {
      setIsFlashing(false);
    }
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
          image={<Flash24Regular />}
          header={<Text weight="semibold">线刷工具</Text>}
          description={<Text size={200}>提供小米线刷模式；其他模式开发中</Text>}
          action={
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {getStatusBadge()}
              <Dropdown
                aria-label="选择模式"
                selectedOptions={[mode]}
                onOptionSelect={(_, data) => setMode((data.optionValue as string) ?? "miui")}
                style={{ minWidth: 160 }}
              >
                <Option value="default">小米线刷</Option>
                <Option value="wip" disabled>正在开发中</Option>
              </Dropdown>
            </div>
          }
        />
        
        <div className={styles.content}>
          {/* 风险与步骤合并卡片 */}
          <div className={styles.section}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
              <Text weight="semibold">线刷风险与准备事项</Text>
            </div>

            {!riskAccepted ? (
              <>
                <div className={styles.warningSection}>
                  <Text size={300} style={{ color: "var(--colorPaletteRedForeground2)" }}>
                    线刷将之前请同意《免责声明》和《风险提示》后才可以进行下一步操作。
                  </Text>
                  <Button appearance="primary" onClick={() => setShowDisclaimerDialog(true)}>
                    阅读免责声明
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.infoSection}>
                  <Text size={300}>
                    你已同意《免责声明》和《风险提示》。可以继续进行线刷操作。
                  </Text>
                  <Button className="ml-2 mr-2" appearance="secondary" onClick={() => setShowDisclaimerDialog(true)}>
                    查看详情
                  </Button>
                </div>
              </>
            )}
          </div>

          {riskAccepted && (
            <>

              {/* 线刷包选择 */}
              <div className={styles.section}>
                <Text weight="semibold">1. 选择线刷包</Text>
                <div className={styles.packageSection}>
                  <div className={styles.packageInput}>
                    <Button
                      appearance="outline"
                      icon={<Folder24Regular />}
                      onClick={handlePackageSelect}
                      disabled={isFlashing || !riskAccepted}
                    >
                      选择文件夹
                    </Button>
                    {!selectedFolderPath ? (
                      <Text size={300}>选择包含 flash_all*.bat 的线刷包目录</Text>
                    ) : (
                      <>
                        <Text size={300}>已选择：{selectedFolderPath}</Text>
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
            </>
          )}
        </div>
      </Card>

      {/* 隐藏的文件夹输入 */}
      <input
        ref={folderInputRef}
        type="file"
        directory
        style={{ display: "none" }}
        onChange={handlePackageChange}
      />


      {/* 风险免责声明对话框 */}
      <Dialog open={showDisclaimerDialog} onOpenChange={(_, data) => setShowDisclaimerDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>风险提示与免责声明</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className={styles.warningSection}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                    <Text weight="semibold">重要风险提示</Text>
                  </div>
                  <Text size={300}>
                    线刷可能导致数据丢失、设备不可用或失去保修。请确保您了解并自行承担相关风险。
                  </Text>
                </div>
                <div className={styles.infoSection}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Info24Regular />
                    <Text weight="semibold">免责声明</Text>
                  </div>
                  <Text size={300}>
                    本工具按“现状”提供，不对因使用本工具进行线刷所造成的任何直接或间接损失负责。继续操作即表示您已充分理解并同意以上内容。
                  </Text>
                </div>
                <Accordion collapsible>
                  <AccordionItem value="steps">
                    <AccordionHeader>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Info24Regular />
                        <Text weight="semibold">线刷前准备步骤</Text>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.stepList}>
                        <div className={styles.stepItem}>
                          <Text>1.</Text>
                          <Text size={300}>确保设备 Bootloader 已解锁</Text>
                        </div>
                        <div className={styles.stepItem}>
                          <Text>2.</Text>
                          <Text size={300}>设备电量保持在 50% 以上</Text>
                        </div>
                        <div className={styles.stepItem}>
                          <Text>3.</Text>
                          <Text size={300}>使用原装或高质量数据线</Text>
                        </div>
                        <div className={styles.stepItem}>
                          <Text>4.</Text>
                          <Text size={300}>关闭杀毒软件和防火墙</Text>
                        </div>
                        <div className={styles.stepItem}>
                          <Text>5.</Text>
                          <Text size={300}>备份重要数据（线刷会清除所有数据）</Text>
                        </div>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </div>


            </DialogBody>
            <DialogActions>              
              <div style={{ height: "30px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>             
              <Button appearance="secondary" onClick={() => { setRiskAccepted(false); setShowDisclaimerDialog(false); }}>
                不同意
              </Button>
              <Button appearance="primary" onClick={() => { setRiskAccepted(true); setShowDisclaimerDialog(false); }}>
                我已阅读并同意
              </Button>
              </div>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>

      {/* 批处理文件执行弹窗 */}
      <BatchExecutorDialog
        open={batchDialogOpen}
        title={batchDialogTitle}
        batchFileName={batchFileName}
        workingDirectory={batchWorkingDirectory}
        onClose={() => setBatchDialogOpen(false)}
      />
    </>
  );
};

export default XiaomiFlashCard;
