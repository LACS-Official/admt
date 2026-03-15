import React from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Input,
  Field,
  Badge,
} from "@fluentui/react-components";
import {
  Timer24Regular,
  Pulse24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles( {
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
    borderRadius: "8px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  cardContent: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  fullWidthCard: {
    gridColumn: "1 / -1",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  settingLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  settingDescription: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  statusOnline: {
    backgroundColor: "var(--colorStatusSuccessBackground2)",
    color: "var(--colorStatusSuccessForeground2)",
  },
  settingInfo: {
    flex: 1,
  },
});

const DeviceSettingsPanel: React.FC = () => {
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

  const handleCpuMonitorIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval >= 500) {
      updateConfig({ cpuMonitorInterval: interval });
    }
  };

  const handleMonitorAutoStartChange = (checked: boolean) => {
    updateConfig({ monitorAutoStart: checked });
  };

  const handleMonitorAutoCsvExportChange = (checked: boolean) => {
    updateConfig({ monitorAutoCsvExport: checked });
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
                </Text>
              </div>
              <Switch
                checked={config.autoDetectDevices}
                onChange={(_, data) => handleAutoDetectChange(data.checked === true)}
              />
            </div>

            <Field label="扫描间隔 (毫秒):">
              <Input
                type="number"
                value={config.scanInterval.toString()}
                onChange={(_, data) => handleScanIntervalChange(data.value)}
                min={1000}
                max={5000}
                step={1000}
                disabled={!config.autoDetectDevices}
              />
              <Text size={200} style={{
                color: config.autoDetectDevices
                  ? "var(--colorNeutralForeground2)"
                  : "var(--colorNeutralForeground3)",
                marginTop: "4px"
              }}>
                建议值：1000-5000毫秒 {!config.autoDetectDevices && "(需要启用自动检测)"}
              </Text>
            </Field>

          </div>
        </Card>

        {/* 设备硬件监控设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Pulse24Regular />}
            header={<Text weight="semibold">设备硬件监控</Text>}
            description={<Text size={200}>CPU、频率、温度及电池监控设置</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">打开工具自动检测</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  进入监控页面或连接设备时自动启动循环抓取
                </Text>
              </div>
              <Switch
                checked={config.monitorAutoStart}
                onChange={(_, data) => handleMonitorAutoStartChange(data.checked === true)}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">实时输出CSV数据</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  开启检测时同步在下载目录生成实时监控表格
                </Text>
              </div>
              <Switch
                checked={config.monitorAutoCsvExport}
                onChange={(_, data) => handleMonitorAutoCsvExportChange(data.checked === true)}
              />
            </div>

            <Field label="监控检测抓取频率 (毫秒):">
              <Input
                type="number"
                value={config.cpuMonitorInterval.toString()}
                onChange={(_, data) => handleCpuMonitorIntervalChange(data.value)}
                min={500}
                max={10000}
                step={500}
              />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                建议值：500-2000毫秒（越小越精确但功耗越高）
              </Text>
            </Field>
          </div>
        </Card>



      </div>
    </div>
  );
};

export default DeviceSettingsPanel;