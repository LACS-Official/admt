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
  Input,
  Switch,
} from "@fluentui/react-components";
import {
  Battery2Regular,  
  ArrowReset24Regular,
  BatteryCharge24Regular,
  BatteryWarning24Regular,
  Temperature24Regular,
  PlugDisconnected24Regular,
  UsbPlug24Regular,
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
  inputControl: {
    width: "80px",
  },
  simulationSection: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid var(--colorNeutralStroke1)",
  },
  resetButton: {
    marginTop: "16px",
    width: "100%",
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

  // 电池模拟相关状态
  const [batterySimulation, setBatterySimulation] = useState({
    level: 50, // 电量百分比
    temperature: 25, // 温度，单位摄氏度
    isCharging: false, // 是否充电
    chargingMode: "none", // 充电模式: none, usb, ac, wireless
    isSimulationEnabled: false, // 是否启用模拟
  });

  // 真实电池状态（用于恢复）
  const [realBatteryStatus, setRealBatteryStatus] = useState({
    level: 50,
    temperature: 25,
    isCharging: false,
    chargingMode: "none",
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

  // 充电模式选项
  const chargingModeOptions = [
    { value: "none", label: "非充电模式" },
    { value: "usb", label: "USB充电模式" },
    { value: "ac", label: "直流充电模式" },
    { value: "wireless", label: "无线充电模式" },
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

  // 获取真实电池状态
  const fetchRealBatteryStatus = async () => {
    if (!device.connected) return;
    
    try {
      // 获取电池状态
      const batteryResult = await deviceService.executeAdbCommand(device.serial, "shell", ["dumpsys", "battery"]);
      if (batteryResult.success && batteryResult.output) {
        const output = batteryResult.output;
        // 解析电池状态
        const levelMatch = output.match(/level: (\d+)/);
        const tempMatch = output.match(/temperature: (\d+)/);
        const statusMatch = output.match(/status: (\d+)/);
        const healthMatch = output.match(/health: (\d+)/);
        
        // 解析充电状态
        let isCharging = false;
        if (statusMatch) {
          const status = parseInt(statusMatch[1]);
          isCharging = status === 2 || status === 5; // 2: Charging, 5: Full
        }
        
        // 解析充电模式
        let chargingMode = "none";
        if (healthMatch) {
          const health = parseInt(healthMatch[1]);
          if (health === 2) chargingMode = "ac"; // AC charger
          else if (health === 3) chargingMode = "usb"; // USB charger
          else if (health === 4) chargingMode = "wireless"; // Wireless charger
        }
        
        // 更新真实电池状态
        setRealBatteryStatus({
          level: levelMatch ? parseInt(levelMatch[1]) : 50,
          temperature: tempMatch ? parseInt(tempMatch[1]) / 10 : 25, // 温度单位转换
          isCharging,
          chargingMode,
        });
        
        // 如果模拟未启用，则更新模拟状态为真实状态
        if (!batterySimulation.isSimulationEnabled) {
          setBatterySimulation(prev => ({
            ...prev,
            level: levelMatch ? parseInt(levelMatch[1]) : 50,
            temperature: tempMatch ? parseInt(tempMatch[1]) / 10 : 25,
            isCharging,
            chargingMode,
          }));
        }
      }
    } catch (error) {
      console.error("获取电池状态失败:", error);
    }
  };

  // 组件挂载时获取电源管理设置
  useEffect(() => {
    if (device.connected && device.mode === "sys") {
      fetchPowerSettings();
      fetchRealBatteryStatus();
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

  // 应用电池模拟设置
  const applyBatterySimulation = async () => {
    const commandId = "apply_battery_simulation";
    setExecutingCommand(commandId);
    
    try {
      // 设置电量
      const levelResult = await deviceService.executeAdbCommand(
        device.serial, 
        "shell", 
        ["dumpsys", "battery", "set", "level", batterySimulation.level.toString()]
      );
      
      // 设置温度
      const tempResult = await deviceService.executeAdbCommand(
        device.serial, 
        "shell", 
        ["dumpsys", "battery", "set", "temp", (batterySimulation.temperature * 10).toString()]
      );
      
      // 设置充电状态
      const statusResult = await deviceService.executeAdbCommand(
        device.serial, 
        "shell", 
        ["dumpsys", "battery", "set", "status", batterySimulation.isCharging ? "2" : "1"]
      );
      
      // 设置充电模式
      let healthValue = "1"; // Unknown
      if (batterySimulation.chargingMode === "ac") healthValue = "2";
      else if (batterySimulation.chargingMode === "usb") healthValue = "3";
      else if (batterySimulation.chargingMode === "wireless") healthValue = "4";
      
      const healthResult = await deviceService.executeAdbCommand(
        device.serial, 
        "shell", 
        ["dumpsys", "battery", "set", "health", healthValue]
      );
      
      if (levelResult.success && tempResult.success && statusResult.success && healthResult.success) {
        setStatusBarMessage({
          type: "success",
          message: "电池模拟设置已应用",
        });
        
        // 重新获取电池状态以确保更新
        setTimeout(fetchRealBatteryStatus, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: "应用电池模拟设置失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `应用电池模拟设置失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 恢复真实电池状态
  const restoreRealBatteryStatus = async () => {
    const commandId = "restore_real_battery";
    setExecutingCommand(commandId);
    
    try {
      // 重置电池模拟
      const resetResult = await deviceService.executeAdbCommand(
        device.serial, 
        "shell", 
        ["dumpsys", "battery", "reset"]
      );
      
      if (resetResult.success) {
        setBatterySimulation(prev => ({
          ...prev,
          level: realBatteryStatus.level,
          temperature: realBatteryStatus.temperature,
          isCharging: realBatteryStatus.isCharging,
          chargingMode: realBatteryStatus.chargingMode,
          isSimulationEnabled: false,
        }));
        
        setStatusBarMessage({
          type: "success",
          message: "已恢复真实电池状态",
        });
        
        // 重新获取电池状态以确保更新
        setTimeout(fetchRealBatteryStatus, 500);
      } else {
        setStatusBarMessage({
          type: "error",
          message: "恢复真实电池状态失败",
        });
      }
    } catch (error) {
      setStatusBarMessage({
        type: "error",
        message: `恢复真实电池状态失败: ${error}`,
      });
    } finally {
      setExecutingCommand(null);
    }
  };

  // 更新电池模拟设置
  const updateBatterySimulation = (field: string, value: any) => {
    setBatterySimulation(prev => ({
      ...prev,
      [field]: value,
    }));
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

        {/* 电池模拟部分 */}
        <div className={styles.simulationSection}>
          <div className={styles.sectionTitle}>
            <BatteryCharge24Regular />
            <Text>电池模拟</Text>
            <Switch
              checked={batterySimulation.isSimulationEnabled}
              onChange={(_, data) => {
                updateBatterySimulation("isSimulationEnabled", data.checked);
                if (data.checked) {
                  // 启用模拟时，使用当前设置
                  applyBatterySimulation();
                } else {
                  // 禁用模拟时，恢复真实状态
                  restoreRealBatteryStatus();
                }
              }}
              disabled={!isDeviceAvailable || executingCommand !== null}
            />
          </div>

          {/* 电量控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>电量:</Text>
            <Input
              className={styles.inputControl}
              type="number"
              min="0"
              max="100"
              value={batterySimulation.level.toString()}
              onChange={(_, data) => {
                const value = parseInt(data.value) || 0;
                if (value >= 0 && value <= 100) {
                  updateBatterySimulation("level", value);
                }
              }}
              disabled={!isDeviceAvailable || !batterySimulation.isSimulationEnabled || executingCommand !== null}
            />
            <Button
              appearance="outline"
              size="small"
              disabled={!isDeviceAvailable || !batterySimulation.isSimulationEnabled || executingCommand !== null}
              onClick={() => applyBatterySimulation()}
            >
              应用
            </Button>
          </div>

          {/* 温度控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>温度:</Text>
            <Input
              className={styles.inputControl}
              type="number"
              min="-20"
              max="60"
              value={batterySimulation.temperature.toString()}
              onChange={(_, data) => {
                const value = parseInt(data.value) || 0;
                if (value >= -20 && value <= 60) {
                  updateBatterySimulation("temperature", value);
                }
              }}
              disabled={!isDeviceAvailable || !batterySimulation.isSimulationEnabled || executingCommand !== null}
            />
            <Button
              appearance="outline"
              size="small"
              disabled={!isDeviceAvailable || !batterySimulation.isSimulationEnabled || executingCommand !== null}
              onClick={() => applyBatterySimulation()}
            >
              应用
            </Button>
          </div>

          {/* 充电状态控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>充电状态:</Text>
            <Switch
              checked={batterySimulation.isCharging}
              onChange={(_, data) => {
                updateBatterySimulation("isCharging", data.checked);
                if (batterySimulation.isSimulationEnabled) {
                  applyBatterySimulation();
                }
              }}
              disabled={!isDeviceAvailable || !batterySimulation.isSimulationEnabled || executingCommand !== null}
            />
            <Text className={styles.controlValue}>
              {batterySimulation.isCharging ? "充电中" : "未充电"}
            </Text>
          </div>

          {/* 充电模式控制 */}
          <div className={styles.controlRow}>
            <Text className={styles.controlLabel}>充电模式:</Text>
            <Dropdown
              className={styles.dropdownControl}
              disabled={!isDeviceAvailable || !batterySimulation.isSimulationEnabled || executingCommand !== null}
              value={batterySimulation.chargingMode}
              onOptionSelect={(_, data) => {
                if (data.optionValue) {
                  updateBatterySimulation("chargingMode", data.optionValue);
                  if (batterySimulation.isSimulationEnabled) {
                    applyBatterySimulation();
                  }
                }
              }}
            >
              {chargingModeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
            <Text className={styles.controlValue}>
              {batterySimulation.chargingMode === "none" ? <PlugDisconnected24Regular /> :
               batterySimulation.chargingMode === "usb" ? <UsbPlug24Regular /> :
               batterySimulation.chargingMode === "ac" ? <BatteryCharge24Regular /> :
               batterySimulation.chargingMode === "wireless" ? <BatteryCharge24Regular /> : <BatteryWarning24Regular />}
            </Text>
          </div>

          {/* 恢复真实状态按钮 */}
          <Button
            className={styles.resetButton}
            appearance="primary"
            disabled={!isDeviceAvailable || executingCommand !== null}
            onClick={() => restoreRealBatteryStatus()}
          >
            恢复真实电池状态
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