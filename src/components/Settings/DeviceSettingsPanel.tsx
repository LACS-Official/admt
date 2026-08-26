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

const useStyles = makeStyles({
  container: {
    padding: "4px 8px 24px 8px",
    height: "100%",
    overflow: "auto",
    backgroundColor: "transparent",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    maxWidth: "1000px",
    margin: "0 auto",
    "@media (max-width: 800px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    height: "fit-content",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  cardHeader: {
    padding: "18px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  settingTile: {
    padding: "14px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
    },
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    width: "100%",
  },
  settingInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  settingDescription: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.4",
  },
  fieldWrapper: {
    marginTop: "4px",
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
            className={styles.cardHeader}
            image={<Timer24Regular />}
            header={<Text weight="semibold" size={400}>{t('device_settings.device_connection')}</Text>}
            description={<Text size={200} className={styles.settingDescription}>{t('device_settings.device_connection_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 自动检测设备 */}
            <div className={styles.settingTile}>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Text weight="semibold">{t('device_settings.auto_detect')}</Text>
                  <Text className={styles.settingDescription}>
                    {t('device_settings.auto_detect_desc')}
                  </Text>
                </div>
                <Switch
                  checked={config.autoDetectDevices}
                  onChange={(_, data) => handleAutoDetectChange(data.checked === true)}
                />
              </div>

              <div className={styles.fieldWrapper}>
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
                      ? "var(--colorNeutralForeground3)"
                      : "var(--colorNeutralForeground4)",
                    marginTop: "4px"
                  }}>
                    {t('device_settings.scan_interval_hint')} {!config.autoDetectDevices && t('device_settings.need_auto_detect')}
                  </Text>
                </Field>
              </div>
            </div>

            {/* 自动投屏 */}
            <div className={styles.settingTile}>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Text weight="semibold">{t('device_settings.auto_mirror_title')}</Text>
                  <Text className={styles.settingDescription}>
                    {t('device_settings.auto_mirror_desc')}
                  </Text>
                </div>
                <Switch
                  checked={config.autoScreenMirror}
                  onChange={(_, data) => handleAutoScreenMirrorChange(data.checked === true)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 设备硬件监控设置 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Pulse24Regular />}
            header={<Text weight="semibold" size={400}>{t('device_settings.hardware_monitor')}</Text>}
            description={<Text size={200} className={styles.settingDescription}>{t('device_settings.hardware_monitor_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 自动开启监控 */}
            <div className={styles.settingTile}>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Text weight="semibold">{t('device_settings.monitor_auto_detect')}</Text>
                  <Text className={styles.settingDescription}>
                    {t('device_settings.monitor_auto_detect_desc')}
                  </Text>
                </div>
                <Switch
                  checked={config.monitorAutoStart}
                  onChange={(_, data) => handleMonitorAutoStartChange(data.checked === true)}
                />
              </div>
            </div>

            {/* 自动导出 CSV */}
            <div className={styles.settingTile}>
              <div className={styles.settingRow}>
                <div className={styles.settingInfo}>
                  <Text weight="semibold">{t('device_settings.monitor_csv_output')}</Text>
                  <Text className={styles.settingDescription}>
                    {t('device_settings.monitor_csv_output_desc')}
                  </Text>
                </div>
                <Switch
                  checked={config.monitorAutoCsvExport}
                  onChange={(_, data) => handleMonitorAutoCsvExportChange(data.checked === true)}
                />
              </div>
            </div>

            {/* 监控采样频率 */}
            <div className={styles.settingTile}>
              <Field label={t('device_settings.monitor_frequency')}>
                <Input
                  type="number"
                  value={config.cpuMonitorInterval.toString()}
                  onChange={(_, data) => handleCpuMonitorIntervalChange(data.value)}
                  min={500}
                  max={10000}
                  step={500}
                />
                <Text size={200} style={{ color: "var(--colorNeutralForeground3)", marginTop: "4px" }}>
                  {t('device_settings.monitor_frequency_hint')}
                </Text>
              </Field>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeviceSettingsPanel;