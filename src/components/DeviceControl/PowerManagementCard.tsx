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
  Battery2Regular,  
  ArrowReset24Regular,
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

interface PowerManagementCardProps {
  device: DeviceInfo;
}

const PowerManagementCard: React.FC<PowerManagementCardProps> = ({ device }) => {
  const styles = useStyles();
  const { deviceService } = useDeviceService();
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const { setStatusBarMessage } = useAppStore();
  
  // 电源管理相关状态
  const [powerSettings, setPowerSettings] = useState({
    screenTimeout: 0,
    stayOnWhilePluggedIn: 0,
  });
  
  const [defaultSettings] = useState({
    screenTimeout: 30000, // 30秒
    stayOnWhilePluggedIn: 1, // 默认充电时保持唤醒
  });

  // 屏幕超时选项
  const screenTimeoutOptions = [
    { value: "15000", label: "15秒" },
    { value: "30000", label: "30秒" },
    { value: "60000", label: "1分钟" },
    { value: "120000", label: "2分钟" },
    { value: "300000", label: "5分钟" },
    { value: "600000", label: "10分钟" },
    { value: "1800000", label: "30分钟" },
    { value: "-1", label: "永不" },
  ];

  // 充电时保持唤醒选项
  const stayOnWhilePluggedInOptions = [
    { value: "0", label: "关闭" },
    { value: "1", label: "充电时保持唤醒" },
    { value: "2", label: "USB连接时保持唤醒" },
    { value: "7", label: "无线充电时保持唤醒" },
  ];

  // 获取电源管理设置
  const fetchPowerSettings = async () => {
    if (!device.connected) return;
    
    try {
      // 获取屏幕超时
      const screenTimeoutResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "system", "screen_off_timeout"]);
      if (screenTimeoutResult.success && screenTimeoutResult.output) {
        setPowerSettings(prev => ({
          ...prev,
          screenTimeout: parseInt(screenTimeoutResult.output)
        }));
      }
      
      // 获取充电时保持唤醒设置
      const stayOnResult = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "get", "global", "stay_on_while_plugged_in"]);
      if (stayOnResult.success && stayOnResult.output) {
        setPowerSettings(prev => ({
          ...prev,
          stayOnWhilePluggedIn: parseInt(stayOnResult.output)
        }));
      }
    } catch (error) {
      console.error("获取电源管理设置失败:", error);
    }
  };

  // 组件挂载时获取电源管理设置
  useEffect(() => {
    if (device.connected && device.mode === "sys") {
      fetchPowerSettings();
    }
  }, [device.connected, device.mode]);

  // 设置屏幕超时
  const setScreenTimeout = async (timeout: number) => {
    const commandId = "set_screen_timeout";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "system", "screen_off_timeout", timeout.toString()]);
      if (result.success) {
        setPowerSettings(prev => ({ ...prev, screenTimeout: timeout }));
        setStatusBarMessage({
          type: "success",
          message: `自动锁屏时间已设置为 ${timeout < 0 ? '永不' : timeout/1000 + '秒'}`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchPowerSettings, 500);
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

  // 设置充电时保持唤醒
  const setStayOnWhilePluggedIn = async (value: number) => {
    const commandId = "set_stay_on_while_plugged_in";
    setExecutingCommand(commandId);
    try {
      const result = await deviceService.executeAdbCommand(device.serial, "shell", ["settings", "put", "global", "stay_on_while_plugged_in", value.toString()]);
      if (result.success) {
        setPowerSettings(prev => ({ ...prev, stayOnWhilePluggedIn: value }));
        setStatusBarMessage({
          type: "success",
          message: `充电时保持唤醒设置已更新`,
        });
        // 重新获取设置以确保更新
        setTimeout(fetchPowerSettings, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: result.error || "设置充电时保持唤醒失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `设置充电时保持唤醒失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 恢复默认设置
  const resetToDefault = (settingType: string) => {
    switch (settingType) {
      case "screenTimeout":
        setScreenTimeout(defaultSettings.screenTimeout);
        break;
      case "stayOnWhilePluggedIn":
        setStayOnWhilePluggedIn(defaultSettings.stayOnWhilePluggedIn);
        break;
      default:
        break;
    }
  };

  const isDeviceAvailable = device.connected && device.mode === "sys";

  return (
    <Card className={styles.card}>
      <CardHeader
        image={<Battery2Regular />}
        header={<Text weight="semibold">电源管理</Text>}
      />
      
      <div className={styles.content}>
        {/* 屏幕超时控制 */}
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>自动锁屏:</Text>
          <Text className={styles.controlValue}>
            {powerSettings.screenTimeout < 0 ? "永不" : `${powerSettings.screenTimeout/1000}秒`}
          </Text>
          <Dropdown
            className={styles.dropdownControl}
            disabled={!isDeviceAvailable || executingCommand !== null}
            value={powerSettings.screenTimeout.toString()}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setScreenTimeout(parseInt(data.optionValue));
              }
            }}
          >
            {screenTimeoutOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
          <Button
            appearance="outline"
            size="small"
            disabled={!isDeviceAvailable || executingCommand !== null}
            onClick={() => resetToDefault("screenTimeout")}
          >
            <ArrowReset24Regular />
          </Button>
        </div>

        {/* 充电时保持唤醒控制 */}
        <div className={styles.controlRow}>
          <Text className={styles.controlLabel}>充电时唤醒:</Text>
          <Text className={styles.controlValue}>
            {powerSettings.stayOnWhilePluggedIn === 0 ? "关闭" : 
             powerSettings.stayOnWhilePluggedIn === 1 ? "充电时" :
             powerSettings.stayOnWhilePluggedIn === 2 ? "USB连接时" :
             powerSettings.stayOnWhilePluggedIn === 7 ? "无线充电时" : "未知"}
          </Text>
          <Dropdown
            className={styles.dropdownControl}
            disabled={!isDeviceAvailable || executingCommand !== null}
            value={powerSettings.stayOnWhilePluggedIn.toString()}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setStayOnWhilePluggedIn(parseInt(data.optionValue));
              }
            }}
          >
            {stayOnWhilePluggedInOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Dropdown>
          <Button
            appearance="outline"
            size="small"
            disabled={!isDeviceAvailable || executingCommand !== null}
            onClick={() => resetToDefault("stayOnWhilePluggedIn")}
          >
            <ArrowReset24Regular />
          </Button>
        </div>

        {!isDeviceAvailable && (
          <Text size={200} style={{ textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
            设备未连接或不在系统模式
          </Text>
        )}
      </div>
    </Card>
  );
};

export default PowerManagementCard;