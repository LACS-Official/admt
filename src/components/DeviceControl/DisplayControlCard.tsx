import React, { useState, useEffect }  from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Dropdown,
  Option,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Input,
  Field,
  Switch,
} from "@fluentui/react-components";
import {
  Desktop24Regular,
  Navigation24Regular,
  ArrowReset24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from '@/stores/appStore';

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minWidth: "400px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "12px 16px",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  controlRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "16px",
    gap: "12px",
    flexWrap: "wrap",
  },
  controlLabel: {
    minWidth: "120px",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
  },
  controlValue: {
    minWidth: "80px",
    fontSize: "14px",
    color: "var(--colorNeutralForeground3)",
    padding: "4px 8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "4px",
  },
  controlButton: {
    marginLeft: "8px",
  },
  dropdownControl: {
    minWidth: "180px",
    maxWidth: "220px",
  },
  inputControl: {
    width: "80px",
  },
  loadingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--colorBrandForeground1)",
  },
  resolutionContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  resolutionInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusMessage: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "4px",
    marginTop: "4px",
  },
  successMessage: {
    backgroundColor: "var(--colorSuccessBackground1)",
    color: "var(--colorSuccessForeground1)",
  },
  errorMessage: {
    backgroundColor: "var(--colorDangerBackground1)",
    color: "var(--colorDangerForeground1)",
  },
  disabledOverlay: {
    position: "relative",
    opacity: 0.6,
    pointerEvents: "none",
  },
  customResolutionButton: {
    marginLeft: "8px",
    fontSize: "12px",
  },
});

interface DisplayControlCardProps {
  device: DeviceInfo;
}

const DisplayControlCard: React.FC<DisplayControlCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const { setStatusBarMessage } = useAppStore();
  
  // 显示控制相关状态
  const [displaySettings, setDisplaySettings] = useState({
    resolution: { width: 0, height: 0 },
    density: 0,
    overscan: 0,
  });
  
  const [defaultSettings, setDefaultSettings] = useState({
    density: 1.0,
    overscan: 0,
  });

  // 自定义分辨率对话框状态
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [customResolution, setCustomResolution] = useState({ width: 0, height: 0 });
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // 常用分辨率选项
  const commonResolutions = [
    { width: 720, height: 1280, label: "720x1280 (HD)" },
    { width: 1080, height: 1920, label: "1080x1920 (FHD)" },
    { width: 1440, height: 2560, label: "1440x2560 (QHD)" },
    { width: 2160, height: 3840, label: "2160x3840 (4K)" },
    { width: 480, height: 800, label: "480x800 (WVGA)" },
    { width: 480, height: 854, label: "480x854 (FWVGA)" },
    { width: 540, height: 960, label: "540x960 (qHD)" },
    { width: 720, height: 1440, label: "720x1440 (HD+)" },
    { width: 1080, height: 2160, label: "1080x2160 (FHD+)" },
    { width: 1080, height: 2340, label: "1080x2340" },
    { width: 1440, height: 2880, label: "1440x2880 (QHD+)" },
    { width: 1440, height: 3120, label: "1440x3120" },
  ];

  // 获取显示设置
  const fetchDisplaySettings = async () => {
    if (!device.connected) return;
    
    try {
      // 获取分辨率
      const wmSizeResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size"]);
      if (wmSizeResult.success) {
        const match = wmSizeResult.output.match(/Physical size: (\d+)x(\d+)/);
        if (match) {
          setDisplaySettings(prev => ({
            ...prev,
            resolution: { width: parseInt(match[1]), height: parseInt(match[2]) }
          }));
        }
      }
      
      // 获取密度
      const wmDensityResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density"]);
      if (wmDensityResult.success) {
        const match = wmDensityResult.output.match(/Physical density: (\d+)/);
        if (match) {
          setDisplaySettings(prev => ({
            ...prev,
            density: parseInt(match[1])
          }));
        }
      }
      
      // 获取过扫描设置
      const overscanResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "overscan"]);
      if (overscanResult.success && overscanResult.output) {
        setDisplaySettings(prev => ({
          ...prev,
          overscan: parseInt(overscanResult.output)
        }));
      }
    } catch (error) {
      console.error("获取显示设置失败:", error);
    }
  };

  // 组件挂载时获取显示设置
  useEffect(() => {
    if (device.connected && device.mode === "sys") {
      fetchDisplaySettings();
    }
  }, [device.connected, device.mode]);

  // 设置屏幕分辨率
  const setResolution = async (width: number, height: number) => {
    const commandId = "set_resolution";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", `${width}x${height}`]);
      if (result.success) {
        setDisplaySettings(prev => ({ 
          ...prev, 
          resolution: { width, height }
        }));
        setStatusBarMessage({
          type: "success",
          message: `屏幕分辨率已设置为 ${width}x${height}`,
        });
        setOperationStatus({
          type: 'success',
          message: `屏幕分辨率已设置为 ${width}x${height}`
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "设置屏幕分辨率失败",
        });
        setOperationStatus({
          type: 'error',
          message: result.error || "设置屏幕分辨率失败"
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置屏幕分辨率失败: ${error}`,
      });
      setOperationStatus({
        type: 'error',
        message: `设置屏幕分辨率失败: ${error}`
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 设置过扫描
  const setOverscan = async (overscan: number) => {
    const commandId = "set_overscan";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "overscan", overscan.toString()]);
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, overscan }));
        setStatusBarMessage({
          type: "success",
          message: `过扫描已设置为 ${overscan}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "设置过扫描失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置过扫描失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 打开自定义分辨率对话框
  const openCustomResolutionDialog = () => {
    setCustomResolution({
      width: displaySettings.resolution.width || 1080,
      height: displaySettings.resolution.height || 1920
    });
    setOperationStatus({ type: null, message: '' });
    setIsResolutionDialogOpen(true);
  };

  // 应用自定义分辨率
  const applyCustomResolution = () => {
    if (customResolution.width > 0 && customResolution.height > 0) {
      setResolution(customResolution.width, customResolution.height);
      setIsResolutionDialogOpen(false);
    } else {
      setOperationStatus({
        type: 'error',
        message: '请输入有效的分辨率值'
      });
    }
  };
  const setDisplayDensity = async (density: number) => {
    const commandId = "set_density";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", density.toString()]);
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, density }));
        setStatusBarMessage({
          type: "success",
          message: `显示密度已设置为 ${density}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "设置显示密度失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置显示密度失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 设置字体缩放
  const setFontScale = async (scale: number) => {
    const commandId = "set_font_scale";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", scale.toString()]);
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, fontScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: `字体缩放已设置为 ${scale}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "设置字体缩放失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置字体缩放失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 恢复默认设置
  const resetToDefault = (settingType: string) => {
    switch (settingType) {
      case "density":
        setDisplayDensity(Math.round(defaultSettings.density * 160)); // Android中默认密度1.0对应160dpi
        break;
      case "overscan":
        setOverscan(defaultSettings.overscan);
        break;
      default:
        break;
    }
  };

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Desktop24Regular />}
        header={<Text weight="semibold">显示控制</Text>}
      />
      
      <div className={styles.content}>
        {/* 屏幕分辨率控制 */}
        <div className={styles.section}>
          
          {/* 分辨率控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>屏幕分辨率:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.resolution.width > 0 && displaySettings.resolution.height > 0 
                ? `${displaySettings.resolution.width}x${displaySettings.resolution.height}` 
                : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.resolution.width > 0 && displaySettings.resolution.height > 0 
                ? `${displaySettings.resolution.width}x${displaySettings.resolution.height}` 
                : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  const [width, height] = data.optionValue.split('x').map(Number);
                  setResolution(width, height);
                }
              }}
            >
              {commonResolutions.map((res) => (
                <Option key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
                  {res.label}
                </Option>
              ))}
            </Dropdown>
            <Button
              className={styles.customResolutionButton}
              appearance="outline"
              size="small"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={openCustomResolutionDialog}
            >
              自定义
            </Button>
          </div>

          {/* 显示密度控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>显示密度:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.density > 0 ? `${displaySettings.density} dpi` : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.density > 0 ? displaySettings.density.toString() : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setDisplayDensity(parseInt(data.optionValue));
                }
              }}
            >
              <Option value="120">120 dpi</Option>
              <Option value="160">160 dpi</Option>
              <Option value="213">213 dpi</Option>
              <Option value="240">240 dpi</Option>
              <Option value="280">280 dpi</Option>
              <Option value="320">320 dpi</Option>
              <Option value="360">360 dpi</Option>
              <Option value="400">400 dpi</Option>
              <Option value="420">420 dpi</Option>
              <Option value="480">480 dpi</Option>
              <Option value="560">560 dpi</Option>
              <Option value="640">640 dpi</Option>
            </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("density")}
            >
              恢复默认
            </Button>
          </div>

        </div>

        {!isDeviceAvailable && (
          <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
            设备未连接或不在系统模式
          </Text>
        )}

        {/* 自定义分辨率对话框 */}
        <Dialog open={isResolutionDialogOpen}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>自定义分辨率</DialogTitle>
              <div className={styles.dialogContent}>
                <div className={styles.resolutionInputRow}>
                  <Field label="宽度">
                    <Input
                      className={styles.inputControl}
                      type="number"
                      value={customResolution.width.toString()}
                      onChange={(e) => setCustomResolution(prev => ({
                        ...prev,
                        width: parseInt(e.target.value) || 0
                      }))}
                    />
                  </Field>
                  <Text style={{ alignSelf: 'center', margin: '0 8px' }}>×</Text>
                  <Field label="高度">
                    <Input
                      className={styles.inputControl}
                      type="number"
                      value={customResolution.height.toString()}
                      onChange={(e) => setCustomResolution(prev => ({
                        ...prev,
                        height: parseInt(e.target.value) || 0
                      }))}
                    />
                  </Field>
                </div>
                
                {operationStatus.type && (
                  <div className={`${styles.statusMessage} ${styles[operationStatus.type + 'Message']}`}>
                    {operationStatus.message}
                  </div>
                )}
              </div>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary" onClick={() => setIsResolutionDialogOpen(false)}>
                    取消
                  </Button>
                </DialogTrigger>
                <Button appearance="primary" onClick={applyCustomResolution}>
                  应用
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </Card>
  );
};

export default DisplayControlCard;