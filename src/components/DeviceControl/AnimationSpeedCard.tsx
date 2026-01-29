import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Card,
  CardHeader,
  Text,
  Button,
  Dropdown,
  Option,
  Spinner,
} from "@fluentui/react-components";
import {
  Timer24Regular,
  ArrowReset24Regular,
} from "@fluentui/react-icons";
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
    minWidth: "400px",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "8px",
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
});

interface AnimationSpeedCardProps {
  device: DeviceInfo;
}

const AnimationSpeedCard: React.FC<AnimationSpeedCardProps> = ({ device }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { deviceService } = useDeviceService();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const { setStatusBarMessage } = useAppStore();
  
  // 动画设置相关状态
  const [animationSettings, setAnimationSettings] = useState({
    windowAnimationScale: 0,
    transitionAnimationScale: 0,
    animatorDurationScale: 0,
  });
  
  const [defaultSettings] = useState({
    windowAnimationScale: 1.0,
    transitionAnimationScale: 1.0,
    animatorDurationScale: 1.0,
  });

  // 动画速度选项
  const animationScaleOptions = [
    { value: "0", label: t('device_control.anim_off') },
    { value: "0.5", label: t('device_control.anim_speed', { scale: '.5' }) },
    { value: "1", label: t('device_control.anim_speed_default') },
    { value: "1.5", label: t('device_control.anim_speed', { scale: '1.5' }) },
    { value: "2", label: t('device_control.anim_speed', { scale: '2' }) },
    { value: "5", label: t('device_control.anim_speed', { scale: '5' }) },
    { value: "10", label: t('device_control.anim_speed', { scale: '10' }) },
  ];

  // 获取动画设置
  const fetchAnimationSettings = async () => {
    if (!device.connected) return;
    
    try {
      // 获取窗口动画缩放
      const windowAnimScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "window_animation_scale"]);
      const transitionAnimScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "transition_animation_scale"]);
      const animatorDurationScaleResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "animator_duration_scale"]);
      
      if (windowAnimScaleResult.success && windowAnimScaleResult.output) {
        const scaleValue = parseFloat(windowAnimScaleResult.output);
        setAnimationSettings(prev => ({
          ...prev,
          windowAnimationScale: isNaN(scaleValue) ? 0 : scaleValue
        }));
      }
      
      if (transitionAnimScaleResult.success && transitionAnimScaleResult.output) {
        const scaleValue = parseFloat(transitionAnimScaleResult.output);
        setAnimationSettings(prev => ({
          ...prev,
          transitionAnimationScale: isNaN(scaleValue) ? 0 : scaleValue
        }));
      }
      
      if (animatorDurationScaleResult.success && animatorDurationScaleResult.output) {
        const scaleValue = parseFloat(animatorDurationScaleResult.output);
        setAnimationSettings(prev => ({
          ...prev,
          animatorDurationScale: isNaN(scaleValue) ? 0 : scaleValue
        }));
      }
    } catch (error) {
      console.error("获取动画设置失败:", error);
    }
  };

  // 组件挂载时获取动画设置
  useEffect(() => {
    if (device.connected && device.mode === "sys") {
      fetchAnimationSettings();
    }
  }, [device.connected, device.mode]);

  // 设置窗口动画缩放
  const setWindowAnimationScale = async (scale: number) => {
    const commandId = "set_window_animation_scale";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "window_animation_scale", scale.toString()]);
      
      if (result.success) {
        setAnimationSettings(prev => ({ ...prev, windowAnimationScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: t('device_control.msg_window_anim_success', { scale: scale }),
        });
        // 重新获取设置以确保更新
        setTimeout(fetchAnimationSettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: t('device_control.msg_window_anim_failed'),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `${t('device_control.msg_window_anim_failed')}: ${error}`,
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
        setAnimationSettings(prev => ({ ...prev, transitionAnimationScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: t('device_control.msg_transition_anim_success', { scale: scale }),
        });
        // 重新获取设置以确保更新
        setTimeout(fetchAnimationSettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: t('device_control.msg_transition_anim_failed'),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `${t('device_control.msg_transition_anim_failed')}: ${error}`,
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
        setAnimationSettings(prev => ({ ...prev, animatorDurationScale: scale }));
        setStatusBarMessage({
          type: "success",
          message: t('device_control.msg_animator_duration_success', { scale: scale }),
        });
        // 重新获取设置以确保更新
        setTimeout(fetchAnimationSettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: t('device_control.msg_animator_duration_failed'),
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `${t('device_control.msg_animator_duration_failed')}: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 恢复默认设置
  const resetToDefault = (settingType: string) => {
    switch (settingType) {
      case "windowAnimationScale":
        setWindowAnimationScale(defaultSettings.windowAnimationScale);
        break;
      case "transitionAnimationScale":
        setTransitionAnimationScale(defaultSettings.transitionAnimationScale);
        break;
      case "animatorDurationScale":
        setAnimatorDurationScale(defaultSettings.animatorDurationScale);
        break;
      default:
        break;
    }
  };

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
         image={<Timer24Regular />}
        header={<Text weight="semibold">{t('device_control.animation_speed')}</Text>}
      />
      
      <div className={styles.content}>
        {/* 窗口动画控制 */}
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>{t('device_control.window_animation')}:</Text>
          <Text className={styles.controlValue}>
            {isNaN(animationSettings.windowAnimationScale) ? "0" : animationSettings.windowAnimationScale}
          </Text>
          <Dropdown
            className={styles.dropdownControl}
            disabled={!isDeviceAvailable || executingCommand !== null}
            value={isNaN(animationSettings.windowAnimationScale) ? "0" : animationSettings.windowAnimationScale.toString()}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setWindowAnimationScale(parseFloat(data.optionValue));
              }
            }}
          >
            {animationScaleOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
          <Button
            appearance="outline"
            size="small"
            disabled={!isDeviceAvailable || executingCommand !== null}
            onClick={() => resetToDefault("windowAnimationScale")}
          >
            <ArrowReset24Regular />
          </Button>
        </div>

        {/* 过渡动画控制 */}
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>{t('device_control.transition_animation')}:</Text>
          <Text className={styles.controlValue}>
            {isNaN(animationSettings.transitionAnimationScale) ? "0" : animationSettings.transitionAnimationScale}
          </Text>
          <Dropdown
            className={styles.dropdownControl}
            disabled={!isDeviceAvailable || executingCommand !== null}
            value={isNaN(animationSettings.transitionAnimationScale) ? "0" : animationSettings.transitionAnimationScale.toString()}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setTransitionAnimationScale(parseFloat(data.optionValue));
              }
            }}
          >
            {animationScaleOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
          <Button
            appearance="outline"
            size="small"
            disabled={!isDeviceAvailable || executingCommand !== null}
            onClick={() => resetToDefault("transitionAnimationScale")}
          >
            <ArrowReset24Regular />
          </Button>
        </div>

        {/* 程序动画控制 */}
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>{t('device_control.animator_duration')}:</Text>
          <Text className={styles.controlValue}>
            {isNaN(animationSettings.animatorDurationScale) ? "0" : animationSettings.animatorDurationScale}
          </Text>
          <Dropdown
            className={styles.dropdownControl}
            disabled={!isDeviceAvailable || executingCommand !== null}
            value={isNaN(animationSettings.animatorDurationScale) ? "0" : animationSettings.animatorDurationScale.toString()}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setAnimatorDurationScale(parseFloat(data.optionValue));
              }
            }}
          >
            {animationScaleOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
          <Button
            appearance="outline"
            size="small"
            disabled={!isDeviceAvailable || executingCommand !== null}
            onClick={() => resetToDefault("animatorDurationScale")}
          >
            <ArrowReset24Regular />
          </Button>
        </div>

        {!isDeviceAvailable && (
          <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
            {t('device_control.device_unavailable')}
          </Text>
        )}
      </div>
    </Card>
  );
};

export default AnimationSpeedCard;