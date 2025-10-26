import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Input,
  Field,
  Text,
  Divider,
  Switch,
  Tooltip,
  Spinner,
  tokens,
  makeStyles,
  shorthands
} from '@fluentui/react-components';
import {
  ArrowClockwise24Regular,
  Checkmark24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  QuestionCircle24Regular,
  Settings24Regular,
  Desktop24Regular
} from '@fluentui/react-icons';
import { DeviceInfo } from "../../types/device";
import { useDeviceService } from "../../services/deviceService";
import { useAppStore } from '@/stores/appStore';

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "6px",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
  },
  cardHeader: {
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    paddingBottom: "8px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "12px",
  },
  section: {
    marginBottom: "16px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
  },
  controlRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "12px",
    flexWrap: "wrap",
  },
  controlLabel: {
    minWidth: "60px",
    fontSize: "12px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    alignSelf: "center",
  },
  controlValue: {
    minWidth: "60px",
    fontSize: "12px",
    color: "var(--colorNeutralForeground1)",
    padding: "3px 6px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "3px",
    fontWeight: "500",
    alignSelf: "center",
  },
  controlButton: {
    marginLeft: "6px",
  },
  inputControl: {
    width: "70px",
  },
  inputControlWide: {
    width: "100px",
  },
  loadingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "var(--colorBrandForeground1)",
  },
  resolutionContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: 1,
    flexWrap: "wrap",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  resolutionInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statusMessage: {
    fontSize: "12px",
    padding: "6px 10px",
    borderRadius: "4px",
    marginTop: "6px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  successMessage: {
    backgroundColor: "var(--colorSuccessBackground1)",
    color: "var(--colorSuccessForeground1)",
    border: "1px solid var(--colorSuccessStroke)",
  },
  errorMessage: {
    backgroundColor: "var(--colorDangerBackground1)",
    color: "var(--colorDangerForeground1)",
    border: "1px solid var(--colorDangerStroke)",
  },
  infoMessage: {
    backgroundColor: "var(--colorInfoBackground1)",
    color: "var(--colorInfoForeground1)",
    border: "1px solid var(--colorInfoStroke)",
  },
  disabledOverlay: {
    position: "relative",
    opacity: 0.6,
    pointerEvents: "none",
  },
  unitLabel: {
    marginLeft: "3px",
    fontSize: "13px",
    color: "var(--colorNeutralForeground3)",
  },
  deviceStatus: {
    textAlign: "center",
    padding: "16px",
    color: "var(--colorNeutralForeground3)",
  },
  helpButton: {
    marginLeft: "auto",
    minWidth: "24px",
    width: "24px",
    height: "24px",
  },
  actionButton: {
    marginLeft: "4px",
    minHeight: "24px",
    padding: "0 8px",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
    alignItems: "flex-end",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    flexWrap: "wrap",
  },
  currentValueContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  currentValueLabel: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  currentValue: {
    fontSize: "13px",
    fontWeight: "500",
    color: "var(--colorBrandForeground1)",
    padding: "3px 6px",
    backgroundColor: "var(--colorBrandBackground2)",
    borderRadius: "3px",
    width: "fit-content",
  },
  resolutionInputGroup: {
    display: "flex",
    alignItems: "flex-end",
    gap: "3px",
  },
  resolutionInput: {
    width: "60px",
  },
  densityInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
  },
  densityInput: {
    width: "70px",
  },
  fontScaleInput: {
    width: "80px",
  },
  controlSection: {
    marginBottom: "16px",
    padding: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
  },
  divider: {
    margin: "12px 0",
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
    fontScale: 1.0,
  });
  
  // 自定义输入状态
  const [customInputs, setCustomInputs] = useState({
    resolutionWidth: '',
    resolutionHeight: '',
    density: '',
    overscan: '',
    fontScale: '',
  });
  
  // 输入验证状态
  const [inputValidation, setInputValidation] = useState({
    resolutionWidth: { isValid: true, error: "" },
    resolutionHeight: { isValid: true, error: "" },
    density: { isValid: true, error: "" },
    fontScale: { isValid: true, error: "" },
  });
  
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({ type: null, message: '' });

  // 获取显示设置
  const fetchDisplaySettings = async () => {
    if (!device.connected) return;
    
    try {
      // 获取分辨率
      const wmSizeResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size"]);
      if (wmSizeResult.success) {
        const match = wmSizeResult.output.match(/Physical size: (\d+)x(\d+)/);
        if (match) {
          const width = parseInt(match[1]);
          const height = parseInt(match[2]);
          setDisplaySettings(prev => ({
            ...prev,
            resolution: { width, height }
          }));
          setCustomInputs(prev => ({
            ...prev,
            resolutionWidth: width.toString(),
            resolutionHeight: height.toString()
          }));
        }
      }
      
      // 获取密度
      const wmDensityResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density"]);
      if (wmDensityResult.success) {
        const match = wmDensityResult.output.match(/Physical density: (\d+)/);
        if (match) {
          const density = parseInt(match[1]);
          setDisplaySettings(prev => ({
            ...prev,
            density
          }));
          setCustomInputs(prev => ({
            ...prev,
            density: density.toString()
          }));
        }
      }
      
      // 获取字体缩放设置
      const fontScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "font_scale"]);
      if (fontScaleResult.success && fontScaleResult.output) {
        const fontScale = parseFloat(fontScaleResult.output);
        setDisplaySettings(prev => ({
          ...prev,
          fontScale
        }));
        setCustomInputs(prev => ({
          ...prev,
          fontScale: fontScale.toString()
        }));
      }
    } catch (error) {
      console.error("获取显示设置失败:", error);
    }
  };

  // 处理自定义输入变化
  const handleInputChange = (field: string, value: string) => {
    setCustomInputs(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 即时验证输入
    validateInput(field, value);
  };
  
  // 验证输入
  const validateInput = (field: string, value: string) => {
    let isValid = true;
    let error = "";
    
    switch (field) {
      case 'resolutionWidth':
      case 'resolutionHeight':
        const numValue = parseInt(value);
        if (value && (isNaN(numValue) || numValue <= 0 || numValue > 10000)) {
          isValid = false;
          error = "请输入1-10000之间的有效数字";
        }
        break;
      case 'density':
        const densityValue = parseInt(value);
        if (value && (isNaN(densityValue) || densityValue <= 0 || densityValue > 1000)) {
          isValid = false;
          error = "请输入1-1000之间的有效数字";
        }
        break;
      case 'fontScale':
        const scaleValue = parseFloat(value);
        if (value && (isNaN(scaleValue) || scaleValue < 0.1 || scaleValue > 3.0)) {
          isValid = false;
          error = "请输入0.1-3.0之间的有效数字";
        }
        break;
    }
    
    setInputValidation(prev => ({
      ...prev,
      [field]: { isValid, error }
    }));
  };
  
  // 处理权限错误
  const handlePermissionError = (operationName: string) => {
    const permissionErrorMsg = `${operationName}失败: 需要设备root权限或WRITE_SECURE_SETTINGS权限`;
    setOperationStatus({ type: 'error', message: permissionErrorMsg });
    setStatusBarMessage({ type: 'error', message: permissionErrorMsg });
  };
  
  // 处理操作成功
  const handleOperationSuccess = (operationName: string, details?: string) => {
    const successMsg = details 
      ? `${operationName}已设置为 ${details}` 
      : `${operationName}设置成功`;
    setOperationStatus({ type: 'success', message: successMsg });
    setStatusBarMessage({ type: 'success', message: successMsg });
  };
  
  // 应用自定义分辨率
  const applyCustomResolution = () => {
    const width = parseInt(customInputs.resolutionWidth);
    const height = parseInt(customInputs.resolutionHeight);
    
    if (!inputValidation.resolutionWidth.isValid || !inputValidation.resolutionHeight.isValid) {
      setOperationStatus({
        type: "error",
        message: "请修正输入错误后重试",
      });
      return;
    }
    
    if (width > 0 && height > 0) {
      setResolution(width, height);
    } else {
      setOperationStatus({
        type: "error",
        message: "请输入有效的分辨率值",
      });
    }
  };
  
  // 应用自定义显示密度
  const applyCustomDensity = () => {
    const density = parseInt(customInputs.density);
    
    if (!inputValidation.density.isValid) {
      setOperationStatus({
        type: "error",
        message: "请修正输入错误后重试",
      });
      return;
    }
    
    if (density > 0 && density <= 1000) {
      setDisplayDensity(density);
    } else {
      setOperationStatus({
        type: "error",
        message: "请输入有效的显示密度值 (1-1000)",
      });
    }
  };
  
  // 应用自定义字体缩放
  const applyCustomFontScale = () => {
    const fontScale = parseFloat(customInputs.fontScale);
    
    if (!inputValidation.fontScale.isValid) {
      setOperationStatus({
        type: "error",
        message: "请修正输入错误后重试",
      });
      return;
    }
    
    if (fontScale >= 0.1 && fontScale <= 3.0) {
      setFontScale(fontScale);
    } else {
      setOperationStatus({
        type: "error",
        message: "请输入有效的字体缩放值 (0.1-3.0)",
      });
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
        // 更新设置状态
        setDisplaySettings(prev => ({ 
          ...prev, 
          resolution: { width, height }
        }));
        
        // 显示成功消息
        handleOperationSuccess("屏幕分辨率", `${width}x${height}`);
        
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        // 检查是否是权限错误
        const errorMessage = result.error || "";
        if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
          handlePermissionError("设置屏幕分辨率");
        } else {
          const message = errorMessage || "设置屏幕分辨率失败";
          setOperationStatus({ type: 'error', message });
          setStatusBarMessage({ type: "error", message });
        }
      }
    } catch (error) {
      const errorMessage = String(error);
      if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
        handlePermissionError("设置屏幕分辨率");
      } else {
        const message = `设置屏幕分辨率失败: ${error}`;
        setOperationStatus({ type: 'error', message });
        setStatusBarMessage({ type: "error", message });
      }
    } finally {
      setExecutingCommand(null);
    }
  };


  // 清除自定义输入框的错误消息
  const clearStatusMessage = () => {
    setOperationStatus({ type: null, message: '' });
  };
  // 设置显示密度
  const setDisplayDensity = async (density: number) => {
    const commandId = "set_density";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", density.toString()]);
      if (result.success) {
        setDisplaySettings(prev => ({ ...prev, density }));
        handleOperationSuccess("显示密度", `${density} dpi`);
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        // 检查是否是权限错误
        if (result.error?.includes("WRITE_SECURE_SETTINGS") || result.error?.includes("SecurityException")) {
          handlePermissionError("设置显示密度");
        } else {
          const errorMessage = result.error || "设置显示密度失败";
          setOperationStatus({ type: 'error', message: errorMessage });
          setStatusBarMessage({ type: "error", message: errorMessage });
        }
      }
    } catch (error) {
      // 检查是否是权限错误
      if (String(error).includes("WRITE_SECURE_SETTINGS") || String(error).includes("SecurityException")) {
        handlePermissionError("设置显示密度");
      } else {
        const errorMessage = `设置显示密度失败: ${error}`;
        setOperationStatus({ type: 'error', message: errorMessage });
        setStatusBarMessage({ type: "error", message: errorMessage });
      }
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
        handleOperationSuccess("字体缩放", scale.toString());
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        // 检查是否是权限错误
        const errorMessage = result.error || "";
        if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
          handlePermissionError("设置字体缩放");
        } else {
          const message = errorMessage || "设置字体缩放失败";
          setOperationStatus({ type: 'error', message });
          setStatusBarMessage({ type: "error", message });
        }
      }
    } catch (error) {
      // 检查是否是权限错误
      const errorMessage = String(error);
      if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
        handlePermissionError("设置字体缩放");
      } else {
        const message = `设置字体缩放失败: ${error}`;
        setOperationStatus({ type: 'error', message });
        setStatusBarMessage({ type: "error", message });
      }
    } finally {
      setExecutingCommand(null);
    }
  };

  // 恢复默认设置
  const resetToDefault = async (type: "resolution" | "density") => {
    if (!isDeviceAvailable) return;
    
    try {
      setExecutingCommand(`reset-${type}`);
      let result;
      let operationName = "";
      
      switch (type) {
        case "resolution":
          result = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", "reset"]);
          operationName = "分辨率";
          break;
        case "density":
          result = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", "reset"]);
          operationName = "显示密度";
          break;
        default:
          return;
      }
      
      if (result.success) {
        setOperationStatus({ type: 'success', message: `成功恢复${operationName}默认设置` });
        setStatusBarMessage({ type: 'success', message: `成功恢复${operationName}默认设置` });
        // 重新获取显示设置
        await fetchDisplaySettings();
      } else {
        // 检查是否是权限错误
        if (result.error && result.error.includes("android.permission.WRITE_SECURE_SETTINGS")) {
          const permissionErrorMsg = "恢复默认设置失败: 需要设备root权限或无障碍服务权限";
          setOperationStatus({ type: 'error', message: permissionErrorMsg });
          setStatusBarMessage({ type: "error", message: permissionErrorMsg });
        } else {
          setOperationStatus({ type: 'error', message: result.error || "操作失败" });
          setStatusBarMessage({ type: "error", message: result.error || "操作失败" });
        }
      }
    } catch (error) {
      // 检查是否是权限错误
      if (String(error).includes("android.permission.WRITE_SECURE_SETTINGS")) {
        const permissionErrorMsg = "恢复默认设置失败: 需要设备root权限或无障碍服务权限";
        setOperationStatus({ type: 'error', message: permissionErrorMsg });
        setStatusBarMessage({ type: "error", message: permissionErrorMsg });
      } else {
        setOperationStatus({ type: 'error', message: String(error) || "操作失败" });
        setStatusBarMessage({ type: "error", message: String(error) || "操作失败" });
      }
    } finally {
      setExecutingCommand(null);
    }
  };

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
         className={styles.cardHeader}
         image={<Desktop24Regular />}
         header={<Text weight="semibold" size={300}>显示控制</Text>}
       />
      
      <div className={styles.content}>
        {/* 设备状态提示 */}
        {!isDeviceAvailable && (
          <div className={styles.deviceStatus}>
            <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
              设备未连接或不在系统模式
            </Text>
          </div>
        )}
        
        {isDeviceAvailable && (
          <>
            {/* 屏幕分辨率控制 */}
            <div className={styles.controlSection}>
              <div className={styles.sectionHeader}>
                <Text weight="medium">分辨率设置</Text>
                <Tooltip content="设置屏幕的宽度和高度像素值" relationship="label">
                   <Button 
                     size="small" 
                     appearance="subtle" 
                     icon={<QuestionCircle24Regular />}
                     className={styles.helpButton}
                   />
                 </Tooltip>
              </div>
              
              <div className={styles.controlRow}>
                <Text className={styles.controlLabel}>当前:</Text>
                <Text className={styles.controlValue}>
                  {displaySettings.resolution.width > 0 && displaySettings.resolution.height > 0 
                    ? `${displaySettings.resolution.width}x${displaySettings.resolution.height}` 
                    : "未知"}
                </Text>
                
                <div className={styles.resolutionInputGroup}>
                  <Field 
                    label="宽度" 
                    style={{ marginBottom: 0, marginRight: '6px' }}
                    validationState={inputValidation.resolutionWidth.isValid ? undefined : 'error'}
                  >
                    <Input
                      className={styles.resolutionInput}
                      type="number"
                      placeholder="宽度"
                      value={customInputs.resolutionWidth}
                      onChange={(e) => handleInputChange('resolutionWidth', e.target.value)}
                      disabled={executingCommand !== null}
                      onFocus={clearStatusMessage}
                      min="1"
                      max="10000"
                    />
                    {!inputValidation.resolutionWidth.isValid && (
                      <Text size={100} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                        {inputValidation.resolutionWidth.error}
                      </Text>
                    )}
                  </Field>
                  
                  <Text style={{ alignSelf: 'flex-end', marginBottom: '6px' }}>×</Text>
                  
                  <Field 
                    label="高度" 
                    style={{ marginBottom: 0, marginLeft: '6px' }}
                    validationState={inputValidation.resolutionHeight.isValid ? undefined : 'error'}
                  >
                    <Input
                      className={styles.resolutionInput}
                      type="number"
                      placeholder="高度"
                      value={customInputs.resolutionHeight}
                      onChange={(e) => handleInputChange('resolutionHeight', e.target.value)}
                      disabled={executingCommand !== null}
                      onFocus={clearStatusMessage}
                      min="1"
                      max="10000"
                    />
                    {!inputValidation.resolutionHeight.isValid && (
                      <Text size={100} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                        {inputValidation.resolutionHeight.error}
                      </Text>
                    )}
                  </Field>
                </div>
                
                <div className={styles.actionButtons}>
                  <Button
                    className={styles.actionButton}
                    appearance="primary"
                    size="small"
                    disabled={executingCommand !== null}
                    onClick={applyCustomResolution}
                  >
                    应用
                  </Button>
                  <Button
                    className={styles.actionButton}
                    appearance="secondary"
                    size="small"
                    disabled={executingCommand !== null}
                    onClick={() => resetToDefault("resolution")}
                  >
                    恢复默认
                  </Button>
                </div>
              </div>
            </div>

            <Divider className={styles.divider} />

            {/* 显示密度控制 */}
            <div className={styles.controlSection}>
              <div className={styles.sectionHeader}>
                <Text weight="medium">显示密度设置</Text>
                <Tooltip content="设置屏幕的像素密度，影响界面元素大小" relationship="label">
                   <Button 
                     size="small" 
                     appearance="subtle" 
                     icon={<QuestionCircle24Regular />}
                     className={styles.helpButton}
                   />
                 </Tooltip>
              </div>
              
              <div className={styles.controlRow}>
                <Text className={styles.controlLabel}>当前:</Text>
                <Text className={styles.controlValue}>
                  {displaySettings.density > 0 ? `${displaySettings.density} dpi` : "未知"}
                </Text>
                
                <div className={styles.densityInputGroup}>
                  <Field 
                    label="DPI" 
                    style={{ marginBottom: 0, flex: 1 }}
                    validationState={inputValidation.density.isValid ? undefined : 'error'}
                  >
                    <Input
                      className={styles.densityInput}
                      type="number"
                      placeholder="DPI"
                      value={customInputs.density}
                      onChange={(e) => handleInputChange('density', e.target.value)}
                      disabled={executingCommand !== null}
                      onFocus={clearStatusMessage}
                      min="1"
                      max="1000"
                    />
                    {!inputValidation.density.isValid && (
                      <Text size={100} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                        {inputValidation.density.error}
                      </Text>
                    )}
                  </Field>
                  <Text className={styles.unitLabel}>dpi</Text>
                </div>
                
                <div className={styles.actionButtons}>
                  <Button
                    className={styles.actionButton}
                    appearance="primary"
                    size="small"
                    disabled={executingCommand !== null}
                    onClick={applyCustomDensity}
                  >
                    应用
                  </Button>
                  <Button
                    className={styles.actionButton}
                    appearance="secondary"
                    size="small"
                    disabled={executingCommand !== null}
                    onClick={() => resetToDefault("density")}
                  >
                    恢复默认
                  </Button>
                </div>
              </div>
            </div>
            
            <Divider className={styles.divider} />
            
            {/* 字体缩放控制 */}
            <div className={styles.controlSection}>
              <div className={styles.sectionHeader}>
                <Text weight="medium">字体缩放设置</Text>
                <Tooltip content="调整系统字体大小，范围0.1-3.0" relationship="label">
                   <Button 
                     size="small" 
                     appearance="subtle" 
                     icon={<QuestionCircle24Regular />}
                     className={styles.helpButton}
                   />
                 </Tooltip>
              </div>
              
              <div className={styles.controlRow}>
                <Text className={styles.controlLabel}>当前:</Text>
                <Text className={styles.controlValue}>
                  {displaySettings.fontScale > 0 ? `${displaySettings.fontScale.toFixed(2)}` : "未知"}
                </Text>
                
                <Field 
                  label="缩放值" 
                  style={{ marginBottom: 0, flex: 1 }}
                  validationState={inputValidation.fontScale.isValid ? undefined : 'error'}
                >
                  <Input
                    className={styles.fontScaleInput}
                    type="number"
                    placeholder="缩放值"
                    value={customInputs.fontScale}
                    onChange={(e) => handleInputChange('fontScale', e.target.value)}
                    disabled={executingCommand !== null}
                    onFocus={clearStatusMessage}
                    min="0.1"
                    max="3.0"
                    step="0.01"
                  />
                  {!inputValidation.fontScale.isValid && (
                    <Text size={100} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                      {inputValidation.fontScale.error}
                    </Text>
                  )}
                </Field>
                
                <div className={styles.actionButtons}>
                  <Button
                    className={styles.actionButton}
                    appearance="primary"
                    size="small"
                    disabled={executingCommand !== null}
                    onClick={applyCustomFontScale}
                  >
                    应用
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 操作状态消息显示 */}
        {operationStatus.type && (
          <div className={`${styles.statusMessage} ${styles[operationStatus.type + 'Message']}`}>
            {operationStatus.type === 'success' && <Checkmark24Regular />}
             {operationStatus.type === 'error' && <ErrorCircle24Regular />}
             {operationStatus.type === 'info' && <Info24Regular />}
             <Text size={200}>{operationStatus.message}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DisplayControlCard;