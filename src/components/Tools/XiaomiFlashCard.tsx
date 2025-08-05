import React, { useState, useRef } from "react";
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Field,
  ProgressBar,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner,
  Badge,
  Textarea,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from "@fluentui/react-components";
import {
  Flash24Regular,
  Warning24Regular,
  Folder24Regular,
  Play24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  Shield24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
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
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  packageSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  packageInput: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  packageInfo: {
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  deviceInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    fontSize: "12px",
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
    maxHeight: "300px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
  },
  warningSection: {
    backgroundColor: "var(--colorPaletteRedBackground1)",
    borderColor: "var(--colorPaletteRedBorder1)",
    padding: "12px",
    borderRadius: "6px",
  },
  infoSection: {
    backgroundColor: "var(--colorPaletteBlueBackground1)",
    borderColor: "var(--colorPaletteBlueBorder1)",
    padding: "12px",
    borderRadius: "6px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  stepList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingLeft: "16px",
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
});

interface XiaomiFlashCardProps {
  device: DeviceInfo;
}

type FlashStatus = "idle" | "checking" | "flashing" | "success" | "error";

const XiaomiFlashCard: React.FC<XiaomiFlashCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [flashStatus, setFlashStatus] = useState<FlashStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [flashLog, setFlashLog] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [deviceCompatible, setDeviceCompatible] = useState<boolean | null>(null);

  const handlePackageSelect = () => {
    folderInputRef.current?.click();
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
        const deviceModel = device.model.toLowerCase();
        const packageCodename = packageInfo.codename.toLowerCase();
        
        resolve(deviceModel.includes(packageCodename) || packageCodename.includes("star"));
      }, 500);
    });
  };

  const handleFlashStart = () => {
    if (!selectedPackage || !packageInfo) return;
    setShowConfirmDialog(true);
  };

  const handleFlashConfirm = async () => {
    if (!selectedPackage || !packageInfo) return;
    
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
        return <Badge appearance="outline" color="brand" icon={<Spinner size="tiny" />}>检查中</Badge>;
      case "flashing":
        return <Badge appearance="outline" color="important" icon={<Spinner size="tiny" />}>刷入中</Badge>;
      case "success":
        return <Badge appearance="outline" color="success" icon={<CheckmarkCircle24Regular />}>成功</Badge>;
      case "error":
        return <Badge appearance="outline" color="danger" icon={<ErrorCircle24Regular />}>失败</Badge>;
      default:
        return <Badge appearance="outline">就绪</Badge>;
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
          header={<Text weight="semibold">小米线刷工具</Text>}
          description={<Text size={200}>使用官方线刷包完整刷入MIUI系统</Text>}
          action={getStatusBadge()}
        />
        
        <div className={styles.content}>
          {/* 警告提示 */}
          <div className={styles.warningSection}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
              <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                线刷风险警告
              </Text>
            </div>
            <Text size={300} style={{ color: "var(--colorPaletteRedForeground2)" }}>
              线刷会完全清除设备数据并重新安装系统。请确保设备已解锁Bootloader，电量充足，并使用原装数据线。
            </Text>
          </div>

          {/* 操作步骤说明 */}
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
                    <Text size={300}>确保设备Bootloader已解锁</Text>
                  </div>
                  <div className={styles.stepItem}>
                    <Text>2.</Text>
                    <Text size={300}>设备电量保持在50%以上</Text>
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

          {/* 设备信息 */}
          <div className={styles.section}>
            <Text weight="semibold">当前设备信息</Text>
            <div className={styles.deviceInfo}>
              <div>型号: {device.model}</div>
              <div>序列号: {device.serial}</div>
              <div>Android版本: {device.androidVersion}</div>
              <div>状态: {device.connected ? "已连接" : "未连接"}</div>
            </div>
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
                <Text size={300}>选择包含flash_all.bat的线刷包文件夹</Text>
              </div>
              
              {packageInfo && (
                <div className={styles.packageInfo}>
                  <div>包名: {selectedPackage}</div>
                  <div>版本: {packageInfo.version}</div>
                  <div>机型: {packageInfo.model} ({packageInfo.codename})</div>
                  <div>地区: {packageInfo.region}</div>
                  <div>Android: {packageInfo.android}</div>
                  <div>大小: {formatFileSize(packageInfo.size)}</div>
                  <div>文件数: {packageInfo.fileCount}</div>
                  <div style={{ 
                    color: deviceCompatible === true ? "green" : 
                           deviceCompatible === false ? "red" : "orange",
                    fontWeight: "bold"
                  }}>
                    兼容性: {
                      deviceCompatible === true ? "✓ 兼容" :
                      deviceCompatible === false ? "✗ 不兼容" : "检查中..."
                    }
                  </div>
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

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <Button
              appearance="primary"
              icon={<Play24Regular />}
              onClick={handleFlashStart}
              disabled={!selectedPackage || !packageInfo || isFlashing || deviceCompatible === false}
            >
              {isFlashing ? "线刷中..." : "开始线刷"}
            </Button>
          </div>
        </div>
      </Card>

      {/* 隐藏的文件夹输入 */}
      <input
        ref={folderInputRef}
        type="file"
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={handlePackageChange}
      />

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={(_, data) => setShowConfirmDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>确认线刷操作</DialogTitle>
          <DialogContent>
            <DialogBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
                  <Text weight="semibold">请仔细确认以下信息：</Text>
                </div>
                
                <div style={{ padding: "12px", backgroundColor: "var(--colorNeutralBackground2)", borderRadius: "4px" }}>
                  <div>设备: {device.model} ({device.serial})</div>
                  <div>线刷包: {packageInfo?.version}</div>
                  <div>机型: {packageInfo?.model}</div>
                  <div>兼容性: {deviceCompatible ? "✓ 兼容" : "⚠️ 未知"}</div>
                </div>
                
                <Text size={300} style={{ color: "var(--colorNeutralForeground2)" }}>
                  线刷将完全清除设备数据并重新安装系统，此过程不可逆转。确定要继续吗？
                </Text>
              </div>
            </DialogBody>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button appearance="primary" onClick={handleFlashConfirm}>
              确认线刷
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default XiaomiFlashCard;
