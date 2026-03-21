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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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

  const handleAutoScreenMirrorChange = (checked: boolean) => {
    updateConfig({ autoScreenMirror: checked });
  };



  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* 设备连接设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Timer24Regular />}
            header={<Text weight="semibold">{t('device_settings.device_connection')}</Text>}
            description={<Text size={200}>{t('device_settings.device_connection_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('device_settings.auto_detect')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('device_settings.auto_detect_desc')}
                </Text>
              </div>
              <Switch
                checked={config.autoDetectDevices}
                onChange={(_, data) => handleAutoDetectChange(data.checked === true)}
              />
            </div>

            <Field label={t('device_settings.scan_interval')}>
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
                {t('device_settings.scan_interval_hint')} {!config.autoDetectDevices && t('device_settings.need_auto_detect')}
              </Text>
            </Field>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('device_settings.auto_mirror_title')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('device_settings.auto_mirror_desc')}
                </Text>
              </div>
              <Switch
                checked={config.autoScreenMirror}
                onChange={(_, data) => handleAutoScreenMirrorChange(data.checked === true)}
              />
            </div>
          </div>
        </Card>

        {/* 设备硬件监控设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Pulse24Regular />}
            header={<Text weight="semibold">{t('device_settings.hardware_monitor')}</Text>}
            description={<Text size={200}>{t('device_settings.hardware_monitor_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('device_settings.monitor_auto_detect')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('device_settings.monitor_auto_detect_desc')}
                </Text>
              </div>
              <Switch
                checked={config.monitorAutoStart}
                onChange={(_, data) => handleMonitorAutoStartChange(data.checked === true)}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('device_settings.monitor_csv_output')}</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {t('device_settings.monitor_csv_output_desc')}
                </Text>
              </div>
              <Switch
                checked={config.monitorAutoCsvExport}
                onChange={(_, data) => handleMonitorAutoCsvExportChange(data.checked === true)}
              />
            </div>

            <Field label={t('device_settings.monitor_frequency')}>
              <Input
                type="number"
                value={config.cpuMonitorInterval.toString()}
                onChange={(_, data) => handleCpuMonitorIntervalChange(data.value)}
                min={500}
                max={10000}
                step={500}
              />
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)", marginTop: "4px" }}>
                {t('device_settings.monitor_frequency_hint')}
              </Text>
            </Field>
          </div>
        </Card>



      </div>
    </div>
  );
};

export default DeviceSettingsPanel;