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
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  cardHeader: {
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    paddingBottom: "12px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "16px",
  },
  section: {
    marginBottom: "24px",
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
    alignItems: "flex-start",
    marginBottom: "16px",
    gap: "16px",
    flexWrap: "wrap",
  },
  controlLabel: {
    minWidth: "120px",
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--colorNeutralForeground2)",
    alignSelf: "center",
  },
  controlValue: {
    minWidth: "100px",
    fontSize: "14px",
    color: "var(--colorNeutralForeground1)",
    padding: "6px 10px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    fontWeight: "500",
    alignSelf: "center",
  },
  controlButton: {
    marginLeft: "8px",
  },
  inputControl: {
    width: "80px",
  },
  inputControlWide: {
    width: "120px",
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
    flex: 1,
    flexWrap: "wrap",
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
    fontSize: "13px",
    padding: "8px 12px",
    borderRadius: "6px",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
    marginLeft: "4px",
    fontSize: "14px",
    color: "var(--colorNeutralForeground3)",
  },
  deviceStatus: {
    textAlign: "center",
    padding: "20px",
    color: "var(--colorNeutralForeground3)",
  },
  helpButton: {
    marginLeft: "auto",
    minWidth: "32px",
    width: "32px",
    height: "32px",
  },
  actionButton: {
    marginLeft: "8px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    flexWrap: "wrap",
  },
  currentValueContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  currentValueLabel: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  currentValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--colorBrandForeground1)",
    padding: "4px 8px",
    backgroundColor: "var(--colorBrandBackground2)",
    borderRadius: "4px",
    width: "fit-content",
  },
  resolutionInputGroup: {
    display: "flex",
    alignItems: "flex-end",
    gap: "4px",
  },
  resolutionInput: {
    width: "80px",
  },
  densityInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  densityInput: {
    width: "100px",
  },
  fontScaleInput: {
    width: "120px",
  },
  controlSection: {
    marginBottom: "20px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  },
  divider: {
    margin: "16px 0",
  },
});

interface DisplayControlCardProps {
  device: DeviceInfo;
}

const DisplayControlCard: React.FC<DisplayControlCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
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
          error = t('device_control.validation_resolution');
        }
        break;
      case 'density':
        const densityValue = parseInt(value);
        if (value && (isNaN(densityValue) || densityValue <= 0 || densityValue > 1000)) {
          isValid = false;
          error = t('device_control.validation_density');
        }
        break;
      case 'fontScale':
        const scaleValue = parseFloat(value);
        if (value && (isNaN(scaleValue) || scaleValue < 0.1 || scaleValue > 3.0)) {
          isValid = false;
          error = t('device_control.validation_font_scale');
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
    const permissionErrorMsg = t('device_control.msg_perm_error', { name: operationName });
    setOperationStatus({ type: 'error', message: permissionErrorMsg });
    setStatusBarMessage({ type: 'error', message: permissionErrorMsg });
  };
  
  // 处理操作成功
  const handleOperationSuccess = (message: string) => {
    setOperationStatus({ type: 'success', message });
    setStatusBarMessage({ type: 'success', message });
  };
  
  // 应用自定义分辨率
  const applyCustomResolution = () => {
    const width = parseInt(customInputs.resolutionWidth);
    const height = parseInt(customInputs.resolutionHeight);
    
    if (!inputValidation.resolutionWidth.isValid || !inputValidation.resolutionHeight.isValid) {
      setOperationStatus({
        type: "error",
        message: t('device_control.msg_fix_input'),
      });
      return;
    }
    
    if (width > 0 && height > 0) {
      setResolution(width, height);
    } else {
      setOperationStatus({
        type: "error",
        message: t('device_control.msg_invalid_resolution'),
      });
    }
  };
  
  // 应用自定义显示密度
  const applyCustomDensity = () => {
    const density = parseInt(customInputs.density);
    
    if (!inputValidation.density.isValid) {
      setOperationStatus({
        type: "error",
        message: t('device_control.msg_fix_input'),
      });
      return;
    }
    
    if (density > 0 && density <= 1000) {
      setDisplayDensity(density);
    } else {
      setOperationStatus({
        type: "error",
        message: t('device_control.msg_invalid_density'),
      });
    }
  };
  
  // 应用自定义字体缩放
  const applyCustomFontScale = () => {
    const fontScale = parseFloat(customInputs.fontScale);
    
    if (!inputValidation.fontScale.isValid) {
      setOperationStatus({
        type: "error",
        message: t('device_control.msg_fix_input'),
      });
      return;
    }
    
    if (fontScale >= 0.1 && fontScale <= 3.0) {
      setFontScale(fontScale);
    } else {
      setOperationStatus({
        type: "error",
        message: t('device_control.msg_invalid_font_scale'),
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
        handleOperationSuccess(t('device_control.msg_resolution_success', { value: `${width}x${height}` }));
        
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        // 检查是否是权限错误
        const errorMessage = result.error || "";
        if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
          handlePermissionError(t('device_control.resolution_settings'));
        } else {
          const message = errorMessage || t('device_control.msg_operation_failed', { name: t('device_control.resolution_settings'), error: '' });
          setOperationStatus({ type: 'error', message });
          setStatusBarMessage({ type: "error", message });
        }
      }
    } catch (error) {
      const errorMessage = String(error);
      if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
        handlePermissionError(t('device_control.resolution_settings'));
      } else {
        const message = t('device_control.msg_operation_failed', { name: t('device_control.resolution_settings'), error: error });
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
        handleOperationSuccess(t('device_control.msg_density_success', { value: `${density} dpi` }));
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        // 检查是否是权限错误
        if (result.error?.includes("WRITE_SECURE_SETTINGS") || result.error?.includes("SecurityException")) {
          handlePermissionError(t('device_control.density_settings'));
        } else {
          const errorMessage = result.error || t('device_control.msg_operation_failed', { name: t('device_control.density_settings'), error: '' });
          setOperationStatus({ type: 'error', message: errorMessage });
          setStatusBarMessage({ type: "error", message: errorMessage });
        }
      }
    } catch (error) {
      // 检查是否是权限错误
      if (String(error).includes("WRITE_SECURE_SETTINGS") || String(error).includes("SecurityException")) {
        handlePermissionError(t('device_control.density_settings'));
      } else {
        const errorMessage = t('device_control.msg_operation_failed', { name: t('device_control.density_settings'), error: error });
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
        handleOperationSuccess(t('device_control.msg_font_scale_success', { value: scale.toString() }));
        // 重新获取设置以确保更新
        setTimeout(fetchDisplaySettings, 500);
      } else {
        // 检查是否是权限错误
        const errorMessage = result.error || "";
        if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
          handlePermissionError(t('device_control.font_scale_settings'));
        } else {
          const message = errorMessage || t('device_control.msg_operation_failed', { name: t('device_control.font_scale_settings'), error: '' });
          setOperationStatus({ type: 'error', message });
          setStatusBarMessage({ type: "error", message });
        }
      }
    } catch (error) {
      // 检查是否是权限错误
      const errorMessage = String(error);
      if (errorMessage.includes("WRITE_SECURE_SETTINGS") || errorMessage.includes("SecurityException")) {
        handlePermissionError(t('device_control.font_scale_settings'));
      } else {
        const message = t('device_control.msg_operation_failed', { name: t('device_control.font_scale_settings'), error: error });
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
          operationName = t('device_control.resolution_settings');
          break;
        case "density":
          result = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", "reset"]);
          operationName = t('device_control.density_settings');
          break;
        default:
          return;
      }
      
      if (result.success) {
        setOperationStatus({ type: 'success', message: t('device_control.msg_reset_success', { name: operationName }) });
        setStatusBarMessage({ type: 'success', message: t('device_control.msg_reset_success', { name: operationName }) });
        // 重新获取显示设置
        await fetchDisplaySettings();
      } else {
        // 检查是否是权限错误
        if (result.error && result.error.includes("android.permission.WRITE_SECURE_SETTINGS")) {
          const permissionErrorMsg = t('device_control.msg_reset_failed');
          setOperationStatus({ type: 'error', message: permissionErrorMsg });
          setStatusBarMessage({ type: "error", message: permissionErrorMsg });
        } else {
          setOperationStatus({ type: 'error', message: result.error || t('device_control.msg_unknown_error') });
          setStatusBarMessage({ type: "error", message: result.error || t('device_control.msg_unknown_error') });
        }
      }
    } catch (error) {
      // 检查是否是权限错误
      if (String(error).includes("android.permission.WRITE_SECURE_SETTINGS")) {
        const permissionErrorMsg = t('device_control.msg_reset_failed');
        setOperationStatus({ type: 'error', message: permissionErrorMsg });
        setStatusBarMessage({ type: "error", message: permissionErrorMsg });
      } else {
        setOperationStatus({ type: 'error', message: String(error) || t('device_control.msg_unknown_error') });
        setStatusBarMessage({ type: "error", message: String(error) || t('device_control.msg_unknown_error') });
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
         header={<Text weight="semibold" size={200}>{t('device_control.display_control')}</Text>}
       />
      
      <div className={styles.content}>
        {/* 设备状态提示 */}
        {!isDeviceAvailable && (
          <div className={styles.deviceStatus}>
            <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
              {t('device_control.device_unavailable')}
            </Text>
          </div>
        )}
        
        {isDeviceAvailable && (
          <>
            {/* 屏幕分辨率控制 */}
            <div className={styles.controlSection}>
              <div className={styles.sectionHeader}>
                <Text weight="medium">{t('device_control.resolution_settings')}</Text>
                <Tooltip content={t('device_control.tooltip_resolution')} relationship="label">
                   <Button 
                     size="small" 
                     appearance="subtle" 
                     icon={<QuestionCircle24Regular />}
                     className={styles.helpButton}
                   />
                 </Tooltip>
              </div>
              
              <div className={styles.controlRow}>
                
                <div className={styles.inputContainer}>
                  <div className={styles.resolutionInputGroup}>
                    <Field 
                      label={t('device_control.width')} 
                      style={{ marginBottom: 0, marginRight: '8px' }}
                      validationState={inputValidation.resolutionWidth.isValid ? undefined : 'error'}
                    >
                      <Input
                        className={styles.resolutionInput}
                        type="number"
                        placeholder={t('device_control.width')}
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
                    
                    <Text style={{ alignSelf: 'flex-end', marginBottom: '8px' }}>×</Text>
                    
                    <Field 
                      label={t('device_control.height')} 
                      style={{ marginBottom: 0, marginLeft: '8px' }}
                      validationState={inputValidation.resolutionHeight.isValid ? undefined : 'error'}
                    >
                      <Input
                        className={styles.resolutionInput}
                        type="number"
                        placeholder={t('device_control.height')}
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
                      {t('device_control.apply')}
                    </Button>
                    <Button
                      className={styles.actionButton}
                      appearance="secondary"
                      size="small"
                      disabled={executingCommand !== null}
                      onClick={() => resetToDefault("resolution")}
                    >
                      {t('device_control.restore_default')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 显示密度控制 */}
            <div className={styles.controlSection}>
              <div className={styles.sectionHeader}>
                <Text weight="medium">{t('device_control.density_settings')}</Text>
                <Tooltip content={t('device_control.tooltip_density')} relationship="label">
                   <Button 
                     size="small" 
                     appearance="subtle" 
                     icon={<QuestionCircle24Regular />}
                     className={styles.helpButton}
                   />
                 </Tooltip>
              </div>
              
              <div className={styles.controlRow}>
                
                <div className={styles.inputContainer}>
                  <Field 
                    style={{ marginBottom: 0, flex: 1 }}
                    validationState={inputValidation.density.isValid ? undefined : 'error'}
                  >
                    <div className={styles.densityInputGroup}>
                      <Input
                        className={styles.densityInput}
                        type="number"
                        placeholder={t('device_control.dpi_value')}
                        value={customInputs.density}
                        onChange={(e) => handleInputChange('density', e.target.value)}
                        disabled={executingCommand !== null}
                        onFocus={clearStatusMessage}
                        min="1"
                        max="1000"
                      />
                      <Text className={styles.unitLabel}>dpi</Text>
                    </div>
                    {!inputValidation.density.isValid && (
                      <Text size={100} style={{ color: "var(--colorPaletteRedForeground1)" }}>
                        {inputValidation.density.error}
                      </Text>
                    )}
                  </Field>
                  
                  <div className={styles.actionButtons}>
                    <Button
                      className={styles.actionButton}
                      appearance="primary"
                      size="small"
                      disabled={executingCommand !== null}
                      onClick={applyCustomDensity}
                    >
                      {t('device_control.apply')}
                    </Button>
                    <Button
                      className={styles.actionButton}
                      appearance="secondary"
                      size="small"
                      disabled={executingCommand !== null}
                      onClick={() => resetToDefault("density")}
                    >
                      {t('device_control.restore_default')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 字体缩放控制 */}
            <div className={styles.controlSection}>
              <div className={styles.sectionHeader}>
                <Text weight="medium">{t('device_control.font_scale_settings')}</Text>
                <Tooltip content={t('device_control.tooltip_font_scale')} relationship="label">
                   <Button 
                     size="small" 
                     appearance="subtle" 
                     icon={<QuestionCircle24Regular />}
                     className={styles.helpButton}
                   />
                 </Tooltip>
              </div>
              
              <div className={styles.controlRow}>
                
                <div className={styles.inputContainer}>
                  <Field 
                    label={t('device_control.font_scale_value')} 
                    style={{ marginBottom: 0, flex: 1 }}
                    validationState={inputValidation.fontScale.isValid ? undefined : 'error'}
                  >
                    <Input
                      className={styles.fontScaleInput}
                      type="number"
                      placeholder={t('device_control.font_scale_value')}
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
                      {t('device_control.apply')}
                    </Button>
                  </div>
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
             <Text size={300}>{operationStatus.message}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DisplayControlCard;