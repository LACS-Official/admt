import React from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Input,
  Select,
  Textarea,
} from "@fluentui/react-components";
import {
  Timer24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";

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







  return (
    <div className={styles.container}>
      <div className={styles.content}>


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
