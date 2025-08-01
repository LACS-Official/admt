import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Input,
  Button,
  Badge,
  Select,
  Textarea,
} from "@fluentui/react-components";
import {
  Wrench24Regular,
  Timer24Regular,
  Settings24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Search24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { DeviceService } from "../../services/deviceService";
import { logService } from "../../services/logService";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    height: "100%",
    overflow: "auto",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  card: {
    height: "fit-content",
  },
  cardContent: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  settingInfo: {
    flex: 1,
  },

  statusBadge: {
    marginTop: "8px",
  },
  helpText: {
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    padding: "12px",
    marginTop: "8px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
});

const ToolSettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { config, updateConfig } = useAppStore();
  const [adbStatus, setAdbStatus] = useState<"checking" | "found" | "not-found" | "error">("checking");
  const [fastbootStatus, setFastbootStatus] = useState<"checking" | "found" | "not-found" | "error">("checking");
  const [deviceService] = useState(() => new DeviceService());

  // 检测工具可用性
  const checkToolAvailability = async () => {
    setAdbStatus("checking");
    setFastbootStatus("checking");
    logService.info("开始检测ADB和Fastboot工具可用性", "ToolSettingsPanel");

    try {
      // 检测ADB
      const adbResult = await deviceService.checkAdbAvailability();
      const adbFound = adbResult.success;
      setAdbStatus(adbFound ? "found" : "not-found");
      logService.info(`ADB工具检测结果: ${adbFound ? "已找到" : "未找到"}`, "ToolSettingsPanel");
    } catch (error) {
      logService.error("ADB检测失败", "ToolSettingsPanel", error);
      setAdbStatus("error");
    }

    try {
      // 检测Fastboot
      const fastbootResult = await deviceService.checkFastbootAvailability();
      const fastbootFound = fastbootResult.success;
      setFastbootStatus(fastbootFound ? "found" : "not-found");
      logService.info(`Fastboot工具检测结果: ${fastbootFound ? "已找到" : "未找到"}`, "ToolSettingsPanel");
    } catch (error) {
      logService.error("Fastboot检测失败", "ToolSettingsPanel", error);
      setFastbootStatus("error");
    }
  };

  // 组件加载时检测工具
  useEffect(() => {
    checkToolAvailability();
  }, []);

  const handleAutoDetectChange = (checked: boolean) => {
    updateConfig({ autoDetectDevices: checked });
  };

  const handleScanIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval >= 1000) {
      updateConfig({ scanInterval: interval });
    }
  };

  const handleDeviceDetectionIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval >= 5000) {
      updateConfig({ deviceDetectionInterval: interval });
    }
  };



  const handleAutoDetectPaths = () => {
    // 重新检测工具路径
    checkToolAvailability();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "found":
        return (
          <Badge 
            appearance="filled" 
            color="success" 
            icon={<CheckmarkCircle24Regular />}
            className={styles.statusBadge}
          >
            已找到
          </Badge>
        );
      case "not-found":
        return (
          <Badge 
            appearance="filled" 
            color="danger" 
            icon={<ErrorCircle24Regular />}
            className={styles.statusBadge}
          >
            未找到
          </Badge>
        );
      case "error":
        return (
          <Badge 
            appearance="filled" 
            color="warning" 
            icon={<ErrorCircle24Regular />}
            className={styles.statusBadge}
          >
            错误
          </Badge>
        );
      default:
        return (
          <Badge 
            appearance="outline" 
            color="brand"
            className={styles.statusBadge}
          >
            检测中...
          </Badge>
        );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 工具状态检测 */}
        <Card className={`${styles.card} ${styles.fullWidth}`}>
          <CardHeader
            image={<Wrench24Regular />}
            header={<Text weight="semibold">工具状态检测</Text>}
            description={<Text size={200}>ADB和Fastboot工具可用性状态</Text>}
            action={
              <Button
                appearance="secondary"
                size="small"
                icon={<Search24Regular />}
                onClick={handleAutoDetectPaths}
              >
                重新检测
              </Button>
            }
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">ADB工具状态</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  Android Debug Bridge 调试工具
                </Text>
              </div>
              {getStatusBadge(adbStatus)}
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">Fastboot工具状态</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  Android Fastboot 刷机工具
                </Text>
              </div>
              {getStatusBadge(fastbootStatus)}
            </div>

            <div className={styles.helpText}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                💡 <strong>说明：</strong>
                <br />
                • 系统会自动检测并使用可用的ADB和Fastboot工具
                <br />
                • 工具状态会在应用启动时自动检测
                <br />
                • 如果检测失败，请确保已正确安装Android SDK Platform Tools
              </Text>
            </div>
          </div>
        </Card>

        {/* 设备连接设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Timer24Regular />}
            header={<Text weight="semibold">设备连接</Text>}
            description={<Text size={200}>设备检测和连接相关设置</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">自动检测设备</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  自动扫描连接的Android设备
                  {config.autoDetectDevices && (
                    <Badge
                      appearance="filled"
                      color="brand"
                      size="small"
                      style={{ marginLeft: "8px" }}
                    >
                      已启用
                    </Badge>
                  )}
                </Text>
              </div>
              <Switch
                checked={config.autoDetectDevices}
                onChange={(_, data) => handleAutoDetectChange(data.checked === true)}
              />
            </div>

            <Field
              label="扫描间隔 (毫秒):"
              disabled={!config.autoDetectDevices}
            >
              <Input
                type="number"
                value={config.scanInterval.toString()}
                onChange={(_, data) => handleScanIntervalChange(data.value)}
                min={1000}
                max={10000}
                step={500}
                disabled={!config.autoDetectDevices}
              />
              <Text size={200} style={{
                color: config.autoDetectDevices
                  ? "var(--colorNeutralForeground2)"
                  : "var(--colorNeutralForeground3)",
                marginTop: "4px"
              }}>
                建议值：2000-5000毫秒 {!config.autoDetectDevices && "(需要启用自动检测)"}
              </Text>
            </Field>

            <Field
              label="设备检测频率:"
              disabled={!config.autoDetectDevices}
            >
              <Select
                value={(config.deviceDetectionInterval || 5000).toString()}
                onChange={(_, data) => handleDeviceDetectionIntervalChange(data.value)}
                disabled={!config.autoDetectDevices}
              >
                <option value="5000">每5秒检测一次</option>
                <option value="10000">每10秒检测一次</option>
                <option value="30000">每30秒检测一次</option>
                <option value="60000">每分钟检测一次</option>
              </Select>
              <Text size={200} style={{
                color: config.autoDetectDevices
                  ? "var(--colorNeutralForeground2)"
                  : "var(--colorNeutralForeground3)",
                marginTop: "4px"
              }}>
                设备连接状态检测频率 {!config.autoDetectDevices && "(需要启用自动检测)"}
              </Text>
            </Field>
          </div>
        </Card>

        {/* 高级设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Settings24Regular />}
            header={<Text weight="semibold">高级设置</Text>}
            description={<Text size={200}>专业用户选项</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="日志级别:">
              <Select
                value={config.logLevel}
                onChange={(_, data) => updateConfig({ logLevel: data.value as "debug" | "info" | "warn" | "error" })}
              >
                <option value="error">错误 (Error)</option>
                <option value="warn">警告 (Warning)</option>
                <option value="info">信息 (Info)</option>
                <option value="debug">调试 (Debug)</option>
              </Select>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                调试级别会显示更多详细信息，但可能影响性能
              </Text>
            </Field>

            <Field label="自定义ADB参数:">
              <Textarea
                placeholder="例如: -H 127.0.0.1 -P 5037"
                rows={3}
              />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                高级用户可以添加自定义ADB连接参数
              </Text>
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ToolSettingsPanel;
