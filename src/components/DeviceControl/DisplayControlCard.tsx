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
  Timer24Regular,
  Settings24Regular,
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
    fontScale: 0,
    windowAnimationScale: 0,
    transitionAnimationScale: 0,
    animatorDurationScale: 0,
    screenTimeout: 0,
    overscan: 0,
  });
  
  const [defaultSettings, setDefaultSettings] = useState({
    density: 1.0,
    fontScale: 1.0,
    windowAnimationScale: 1.0,
    transitionAnimationScale: 1.0,
    animatorDurationScale: 1.0,
    screenTimeout: 30000, // 30秒
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
      
      // 获取字体缩放
      const fontScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "font_scale"]);
      if (fontScaleResult.success && fontScaleResult.output) {
        setDisplaySettings(prev => ({
          ...prev,
          fontScale: parseFloat(fontScaleResult.output)
        }));
      }
      
      // 获取动画缩放
      const windowAnimScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "window_animation_scale"]);
      const transitionAnimScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "transition_animation_scale"]);
      const animatorDurationScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "animator_duration_scale"]);
      
      if (windowAnimScaleResult.success && windowAnimScaleResult.output) {
        setDisplaySettings(prev => ({
          ...prev,
          windowAnimationScale: parseFloat(windowAnimScaleResult.output)
        }));
      }
      
      if (transitionAnimScaleResult.success && transitionAnimScaleResult.output) {
        setDisplaySettings(prev => ({
          ...prev,
          transitionAnimationScale: parseFloat(transitionAnimScaleResult.output)
        }));
      }
      
      if (animatorDurationScaleResult.success && animatorDurationScaleResult.output) {
        setDisplaySettings(prev => ({
          ...prev,
          animatorDurationScale: parseFloat(animatorDurationScaleResult.output)
        }));
      }
      
      // 获取屏幕超时
      const screenTimeoutResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "screen_off_timeout"]);
      if (screenTimeoutResult.success && screenTimeoutResult.output) {
        setDisplaySettings(prev => ({
          ...prev,
          screenTimeout: parseInt(screenTimeoutResult.output)
        }));
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

  // 设置窗口动画缩放
  const setWindowAnimationScale = async (scale: number) => {
    const commandId = "set_window_animation_scale";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "window_animation_scale", scale.toString()]);
      
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, windowAnimationScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: `窗口动画速度已设置为 ${scale}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: "设置窗口动画速度失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置窗口动画速度失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 设置过渡动画缩放
  const setTransitionAnimationScale = async (scale: number) => {
    const commandId = "set_transition_animation_scale";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "transition_animation_scale", scale.toString()]);
      
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, transitionAnimationScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: `过渡动画速度已设置为 ${scale}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: "设置过渡动画速度失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置过渡动画速度失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 设置动画持续时间缩放
  const setAnimatorDurationScale = async (scale: number) => {
    const commandId = "set_animator_duration_scale";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "animator_duration_scale", scale.toString()]);
      
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, animatorDurationScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: `程序动画速度已设置为 ${scale}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: "设置程序动画速度失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置程序动画速度失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 设置屏幕超时
  const setScreenTimeout = async (timeout: number) => {
    const commandId = "set_screen_timeout";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "screen_off_timeout", timeout.toString()]);
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, screenTimeout: timeout }));
        setStatusBarMessage({
          type: "success",
          message: `自动锁屏时间已设置为 ${timeout/1000} 秒`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "设置自动锁屏时间失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置自动锁屏时间失败: ${error}`,
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
      case "fontScale":
        setFontScale(defaultSettings.fontScale);
        break;
      case "windowAnimationScale":
          setWindowAnimationScale(defaultSettings.windowAnimationScale);
          break;
        case "transitionAnimationScale":
          setTransitionAnimationScale(defaultSettings.transitionAnimationScale);
          break;
        case "animatorDurationScale":
          setAnimatorDurationScale(defaultSettings.animatorDurationScale);
          break;
      case "screenTimeout":
        setScreenTimeout(defaultSettings.screenTimeout);
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
          <div className={styles.sectionTitle}>
            <Desktop24Regular />
            <Text>屏幕设置</Text>
          </div>
          
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

          {/* 过扫描控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>过扫描:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.overscan >= 0 ? `${displaySettings.overscan}%` : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.overscan >= 0 ? displaySettings.overscan.toString() : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setOverscan(parseInt(data.optionValue));
                }
              }}
            >
              <Option value="0">0% (关闭)</Option>
              <Option value="5">5%</Option>
              <Option value="10">10%</Option>
              <Option value="15">15%</Option>
              <Option value="20">20%</Option>
            </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("overscan")}
            >
              恢复默认
            </Button>
          </div>
        </div>

        {/* 显示效果控制 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Settings24Regular />
            <Text>显示效果</Text>
          </div>

          {/* 字体大小控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>字体大小:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.fontScale > 0 ? `${displaySettings.fontScale}x` : "未知"}
            </Text>
            <Dropdown
                className={styles.dropdownControl}
                disabled={!isDeviceAvailable || executingCommand !== null}
                value={displaySettings.fontScale > 0 ? displaySettings.fontScale.toString() : ""}
                onOptionSelect={(_, data) => {
                  if (data.optionValue) {
                    setFontScale(parseFloat(data.optionValue));
                  }
                }}
              >
                <Option value="0">0x</Option>
                <Option value="0.5">0.5x</Option>
                <Option value="0.85">0.85x (小)</Option>
                <Option value="1.0">1.0x (默认)</Option>
                <Option value="1.15">1.15x (大)</Option>
                <Option value="1.3">1.3x (特大)</Option>
                <Option value="1.5">1.5x</Option>
                <Option value="2.0">2.0x</Option>
                <Option value="3.0">3.0x</Option>
                <Option value="4.0">4.0x</Option>
                <Option value="5.0">5.0x</Option>
              </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("fontScale")}
            >
              恢复默认
            </Button>
          </div>

          {/* 窗口动画速度控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>窗口动画速度:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.windowAnimationScale >= 0 ? `${displaySettings.windowAnimationScale}x` : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.windowAnimationScale >= 0 ? displaySettings.windowAnimationScale.toString() : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setWindowAnimationScale(parseFloat(data.optionValue));
                }
              }}
            >
              <Option value="0">动画关闭</Option>
              <Option value="0.5">0.5x (慢)</Option>
              <Option value="1.0">1.0x (标准)</Option>
              <Option value="1.5">1.5x (快)</Option>
              <Option value="2.0">2.0x (更快)</Option>
            </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("windowAnimationScale")}
            >
              恢复默认
            </Button>
          </div>

          {/* 过渡动画速度控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>过渡动画速度:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.transitionAnimationScale >= 0 ? `${displaySettings.transitionAnimationScale}x` : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.transitionAnimationScale >= 0 ? displaySettings.transitionAnimationScale.toString() : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setTransitionAnimationScale(parseFloat(data.optionValue));
                }
              }}
            >
              <Option value="0">动画关闭</Option>
              <Option value="0.5">0.5x (慢)</Option>
              <Option value="1.0">1.0x (标准)</Option>
              <Option value="1.5">1.5x (快)</Option>
              <Option value="2.0">2.0x (更快)</Option>
            </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("transitionAnimationScale")}
            >
              恢复默认
            </Button>
          </div>

          {/* 程序动画速度控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>程序动画速度:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.animatorDurationScale >= 0 ? `${displaySettings.animatorDurationScale}x` : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.animatorDurationScale >= 0 ? displaySettings.animatorDurationScale.toString() : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setAnimatorDurationScale(parseFloat(data.optionValue));
                }
              }}
            >
              <Option value="0">动画关闭</Option>
              <Option value="0.5">0.5x (慢)</Option>
              <Option value="1.0">1.0x (标准)</Option>
              <Option value="1.5">1.5x (快)</Option>
              <Option value="2.0">2.0x (更快)</Option>
            </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("animatorDurationScale")}
            >
              恢复默认
            </Button>
          </div>
        </div>

        {/* 电源管理控制 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Timer24Regular />
            <Text>电源管理</Text>
          </div>

          {/* 自动锁屏时间控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>自动锁屏:</Text>
            <Text className={styles.controlValue}>
              {displaySettings.screenTimeout > 0 ? `${displaySettings.screenTimeout / 1000} 秒` : "未知"}
            </Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || executingCommand !== null}
              value={displaySettings.screenTimeout > 0 ? (displaySettings.screenTimeout / 1000).toString() : ""}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  setScreenTimeout(parseInt(data.optionValue) * 1000);
                }
              }}
            >
              <Option value="15">15 秒</Option>
              <Option value="30">30 秒</Option>
              <Option value="60">1 分钟</Option>
              <Option value="120">2 分钟</Option>
              <Option value="300">5 分钟</Option>
              <Option value="600">10 分钟</Option>
              <Option value="1800">30 分钟</Option>
              <Option value="-1">从不</Option>
            </Dropdown>
            <Button
              className={styles.controlButton}
              appearance="outline"
              disabled={!isDeviceAvailable || executingCommand !== null}
              onClick={() => resetToDefault("screenTimeout")}
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