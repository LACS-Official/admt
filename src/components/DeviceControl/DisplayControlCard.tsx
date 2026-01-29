import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Field,
  Text,
  Tooltip,
  makeStyles,
  shorthands,
  mergeClasses
} from '@fluentui/react-components';
import {
  ArrowClockwise24Regular,
  Checkmark24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  QuestionCircle24Regular,
  Desktop24Regular,
  Save24Regular
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
    ...shorthands.padding("12px", "16px"),
  },
  content: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "16px",
  },
  footer: {
    padding: "16px",
    borderTop: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  // Compact row styles
  controlRow: {
     display: "grid",
     gridTemplateColumns: "100px 1fr",
     alignItems: "center",
     gap: "16px",
  },
  labelContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  resolutionInput: {
    width: "80px",
  },
  densityInput: {
    width: "100px",
  },
  fontScaleInput: {
    width: "100px",
  },
  unitLabel: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
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
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground3)",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  helpButton: {
    color: "var(--colorNeutralForeground3)",
    "&:hover": {
        color: "var(--colorNeutralForeground2)",
    }
  },
  deviceStatus: {
    textAlign: "center",
    padding: "20px",
    color: "var(--colorNeutralForeground3)",
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
    fontScale: '',
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
    setOperationStatus({ type: null, message: '' });
  };
  
  // 应用所有更改
  const handleApplyAll = async () => {
    setExecutingCommand("apply_all");
    setOperationStatus({ type: null, message: '' });

    const width = parseInt(customInputs.resolutionWidth);
    const height = parseInt(customInputs.resolutionHeight);
    const density = parseInt(customInputs.density);
    const fontScale = parseFloat(customInputs.fontScale);

    let errors: string[] = [];
    let successCount = 0;

    // 1. Resolution
    if (width > 0 && height > 0) {
        try {
            const resResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", `${width}x${height}`]);
            if (!resResult.success) errors.push(t('device_control.resolution_settings') + ": " + (resResult.error || "Failed"));
            else successCount++;
        } catch (e) { errors.push(t('device_control.resolution_settings') + ": " + String(e)); }
    } else if (customInputs.resolutionWidth || customInputs.resolutionHeight) {
        errors.push(t('device_control.validation_resolution'));
    }

    // 2. Density
    if (density > 0 && density <= 1000) {
        try {
            const denResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", density.toString()]);
            if (!denResult.success) errors.push(t('device_control.density_settings') + ": " + (denResult.error || "Failed"));
            else successCount++;
        } catch (e) { errors.push(t('device_control.density_settings') + ": " + String(e)); }
    } else if (customInputs.density) {
        errors.push(t('device_control.validation_density'));
    }

    // 3. Font Scale
    if (fontScale >= 0.1 && fontScale <= 3.0) {
        try {
            const fontResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", fontScale.toString()]);
            if (!fontResult.success) errors.push(t('device_control.font_scale_settings') + ": " + (fontResult.error || "Failed"));
            else successCount++;
        } catch (e) { errors.push(t('device_control.font_scale_settings') + ": " + String(e)); }
    } else if (customInputs.fontScale) {
        errors.push(t('device_control.validation_font_scale'));
    }

    setExecutingCommand(null);

    if (errors.length > 0) {
        const errorMsg = errors.join("; ");
        setOperationStatus({ type: 'error', message: errorMsg });
        setStatusBarMessage({ type: 'error', message: errorMsg });
    } else if (successCount > 0) {
        const successMsg = t('common.success');
        setOperationStatus({ type: 'success', message: successMsg });
        setStatusBarMessage({ type: 'success', message: successMsg });
        setTimeout(fetchDisplaySettings, 1000);
    } else {
        setOperationStatus({ type: 'info', message: t('device_control.msg_fix_input') });
    }
  };

  // 恢复默认设置
  const handleRestoreAll = async () => {
    if (!confirm(t('common.confirm') + "?")) return; // Simple confirmation

    setExecutingCommand("restore_all");
    setOperationStatus({ type: null, message: '' });
    
    let errors: string[] = [];

    try {
        // Reset Resolution
        const resResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "size", "reset"]);
        if (!resResult.success) errors.push(t('device_control.resolution_settings'));

        // Reset Density
        const denResult = await deviceService.executeAdbCommand(device.serial, "shell", ["wm", "density", "reset"]);
        if (!denResult.success) errors.push(t('device_control.density_settings'));

        // Reset Font Scale (Default to 1.0)
        const fontResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "font_scale", "1.0"]);
        if (!fontResult.success) errors.push(t('device_control.font_scale_settings'));

    } catch (e) {
        errors.push(String(e));
    }

    setExecutingCommand(null);

    if (errors.length > 0) {
        const errorMsg = t('device_control.msg_reset_failed') + ": " + errors.join(", ");
        setOperationStatus({ type: 'error', message: errorMsg });
        setStatusBarMessage({ type: 'error', message: errorMsg });
    } else {
        const successMsg = t('device_control.msg_reset_success', { name: t('common.all') }); // You might need a key for "All" or similar
        setOperationStatus({ type: 'success', message: successMsg });
        setStatusBarMessage({ type: 'success', message: successMsg });
        setTimeout(fetchDisplaySettings, 1000);
    }
  };

  // 组件挂载时获取显示设置
  useEffect(() => {
    if (device.connected && device.mode === "sys") {
      fetchDisplaySettings();
    }
  }, [device.connected, device.mode]);

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
         className={styles.cardHeader}
         image={<Desktop24Regular />}
         header={<Text weight="semibold" size={300}>{t('device_control.display_control')}</Text>}
       />
      
      <div className={styles.content}>
        {!isDeviceAvailable ? (
          <div className={styles.deviceStatus}>
            <Text size={300}>{t('device_control.device_unavailable')}</Text>
          </div>
        ) : (
          <>
            {/* Resolution */}
            <div className={styles.controlRow}>
                <div className={styles.labelContainer}>
                    <Text weight="medium">{t('device_control.resolution_settings')}</Text>
                    <Tooltip content={t('device_control.tooltip_resolution')} relationship="label">
                       <Button size="small" appearance="subtle" icon={<QuestionCircle24Regular />} className={styles.helpButton} />
                    </Tooltip>
                </div>
                <div className={styles.inputGroup}>
                    <Input
                        className={styles.resolutionInput}
                        type="number"
                        placeholder={t('device_control.width')}
                        value={customInputs.resolutionWidth}
                        onChange={(e) => handleInputChange('resolutionWidth', e.target.value)}
                        disabled={executingCommand !== null}
                    />
                    <Text>×</Text>
                    <Input
                        className={styles.resolutionInput}
                        type="number"
                        placeholder={t('device_control.height')}
                        value={customInputs.resolutionHeight}
                        onChange={(e) => handleInputChange('resolutionHeight', e.target.value)}
                        disabled={executingCommand !== null}
                    />
                    <Text className={styles.unitLabel}>px</Text>
                </div>
            </div>

            {/* Density */}
            <div className={styles.controlRow}>
                <div className={styles.labelContainer}>
                    <Text weight="medium">{t('device_control.density_settings')}</Text>
                    <Tooltip content={t('device_control.tooltip_density')} relationship="label">
                       <Button size="small" appearance="subtle" icon={<QuestionCircle24Regular />} className={styles.helpButton} />
                    </Tooltip>
                </div>
                <div className={styles.inputGroup}>
                    <Input
                        className={styles.densityInput}
                        type="number"
                        placeholder={t('device_control.dpi_value')}
                        value={customInputs.density}
                        onChange={(e) => handleInputChange('density', e.target.value)}
                        disabled={executingCommand !== null}
                    />
                    <Text className={styles.unitLabel}>dpi</Text>
                </div>
            </div>

            {/* Font Scale */}
            <div className={styles.controlRow}>
                <div className={styles.labelContainer}>
                    <Text weight="medium">{t('device_control.font_scale_settings')}</Text>
                    <Tooltip content={t('device_control.tooltip_font_scale')} relationship="label">
                       <Button size="small" appearance="subtle" icon={<QuestionCircle24Regular />} className={styles.helpButton} />
                    </Tooltip>
                </div>
                <div className={styles.inputGroup}>
                    <Input
                        className={styles.fontScaleInput}
                        type="number"
                        placeholder="1.0"
                        value={customInputs.fontScale}
                        onChange={(e) => handleInputChange('fontScale', e.target.value)}
                        disabled={executingCommand !== null}
                        step="0.05"
                    />
                    <Text className={styles.unitLabel}>x</Text>
                </div>
            </div>

            {/* Status Message */}
            {operationStatus.type && (
                <div className={mergeClasses(styles.statusMessage, 
                    operationStatus.type === 'success' ? styles.successMessage :
                    operationStatus.type === 'error' ? styles.errorMessage : 
                    styles.infoMessage)}> // Fallback to infoMessage manually if needed or just styling
                    {operationStatus.type === 'success' && <Checkmark24Regular />}
                    {operationStatus.type === 'error' && <ErrorCircle24Regular />}
                    {operationStatus.type === 'info' && <Info24Regular />}
                    <Text>{operationStatus.message}</Text>
                </div>
            )}
          </>
        )}
      </div>

       {isDeviceAvailable && (
        <div className={styles.footer}>
            <Button 
                appearance="secondary" 
                icon={<ArrowClockwise24Regular />}
                onClick={handleRestoreAll}
                disabled={executingCommand !== null}
            >
                {t('device_control.restore_default')}
            </Button>
            <Button 
                appearance="primary" 
                icon={<Save24Regular />}
                onClick={handleApplyAll}
                disabled={executingCommand !== null}
            >
                {t('device_control.apply')}
            </Button>
        </div>
       )}
    </Card>
  );
};

export default DisplayControlCard;