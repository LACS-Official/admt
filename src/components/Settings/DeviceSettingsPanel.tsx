import React from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Badge,
  TabList,
  Tab,
  Divider,
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
    gap: "16px",
    maxWidth: "1000px",
    margin: "0 auto",
    "@media (max-width: 820px)": {
      gridTemplateColumns: "1fr",
    },
  },
  card: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    height: "fit-content",
  },
  cardHeader: {
    padding: "16px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "8px 0",
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
  segmentedPillContainer: {
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px",
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--colorNeutralStroke2)",
    flexShrink: 0,
    "& .fui-TabList": {
      minHeight: "26px",
      backgroundColor: "transparent",
    },
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "3px 10px",
      minHeight: "26px",
      borderRadius: "9999px",
      transition: "all 0.15s ease",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 6px -1px rgba(0, 0, 0, 0.08)",
        fontWeight: 600,
      },
    },
  },
  badgePill: {
    borderRadius: "9999px",
    fontWeight: 600,
    fontSize: "11px",
    padding: "2px 8px",
  },
});

const DeviceSettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { config, updateConfig } = useAppStore();

  const handleAutoDetectChange = (checked: boolean) => {
    updateConfig({ autoDetectDevices: checked });
  };

  const handleScanIntervalSelect = (val: string) => {
    const ms = parseInt(val, 10);
    if (!isNaN(ms)) {
      updateConfig({ scanInterval: ms });
    }
  };

  const handleCpuMonitorIntervalSelect = (val: string) => {
    const ms = parseInt(val, 10);
    if (!isNaN(ms)) {
      updateConfig({ cpuMonitorInterval: ms });
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
        {/* 卡片 1: 设备连接与扫描 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Timer24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
            header={<Text weight="semibold" size={400}>{t('device_settings.device_connection')}</Text>}
            description={<Text size={200} className={styles.settingDescription}>{t('device_settings.device_connection_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 自动检测设备 */}
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

            <Divider />

            {/* 扫描间隔时间（分段药丸选择器） */}
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('device_settings.scan_interval')}</Text>
                <Text className={styles.settingDescription}>
                  {t('device_settings.scan_interval_hint')}
                </Text>
              </div>
              <div className={styles.segmentedPillContainer}>
                <TabList
                  selectedValue={String(config.scanInterval || 2000)}
                  onTabSelect={(_, d) => handleScanIntervalSelect(d.value as string)}
                  appearance="subtle"
                  disabled={!config.autoDetectDevices}
                >
                  <Tab value="1000">1s</Tab>
                  <Tab value="2000">2s</Tab>
                  <Tab value="3000">3s</Tab>
                  <Tab value="5000">5s</Tab>
                </TabList>
              </div>
            </div>

            <Divider />

            {/* 自动屏幕镜像 */}
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

            <Divider />

            {/* 设备概览自动刷新 */}
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">设备概览自动刷新</Text>
                <Text className={styles.settingDescription}>
                  定时自动获取并更新电池、温度、ROM存储及RAM内存状态
                </Text>
              </div>
              <Switch
                checked={config.overviewAutoRefresh ?? true}
                onChange={(_, data) => updateConfig({ overviewAutoRefresh: data.checked === true })}
              />
            </div>

            <Divider />

            {/* 概览刷新频率 */}
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">概览刷新频率</Text>
                <Text className={styles.settingDescription}>
                  设置设备概览硬件状态指标的自动更新间隔时间
                </Text>
              </div>
              <div className={styles.segmentedPillContainer}>
                <TabList
                  selectedValue={String(config.overviewRefreshInterval || 5000)}
                  onTabSelect={(_, d) => {
                    const ms = parseInt(d.value as string, 10);
                    if (!isNaN(ms)) {
                      updateConfig({ overviewRefreshInterval: ms });
                    }
                  }}
                  appearance="subtle"
                  disabled={config.overviewAutoRefresh === false}
                >
                  <Tab value="2000">2s</Tab>
                  <Tab value="3000">3s</Tab>
                  <Tab value="5000">5s</Tab>
                  <Tab value="10000">10s</Tab>
                </TabList>
              </div>
            </div>
          </div>
        </Card>

        {/* 卡片 2: 设备实时状态监控 */}
        <Card className={styles.card}>
          <CardHeader
            className={styles.cardHeader}
            image={<Pulse24Regular style={{ color: "var(--colorBrandForeground1)" }} />}
            header={<Text weight="semibold" size={400}>{t('device_settings.hardware_monitor')}</Text>}
            description={<Text size={200} className={styles.settingDescription}>{t('device_settings.hardware_monitor_desc')}</Text>}
          />

          <div className={styles.cardContent}>
            {/* 自动开启监控 */}
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

            <Divider />

            {/* 监控采样频率（分段药丸选择器） */}
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">{t('device_settings.monitor_frequency')}</Text>
                <Text className={styles.settingDescription}>
                  {t('device_settings.monitor_frequency_hint')}
                </Text>
              </div>
              <div className={styles.segmentedPillContainer}>
                <TabList
                  selectedValue={String(config.cpuMonitorInterval || 1000)}
                  onTabSelect={(_, d) => handleCpuMonitorIntervalSelect(d.value as string)}
                  appearance="subtle"
                  disabled={!config.monitorAutoStart}
                >
                  <Tab value="500">0.5s</Tab>
                  <Tab value="1000">1.0s</Tab>
                  <Tab value="2000">2.0s</Tab>
                  <Tab value="5000">5.0s</Tab>
                </TabList>
              </div>
            </div>

            <Divider />

            {/* 自动导出 CSV */}
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
        </Card>
      </div>
    </div>
  );
};

export default DeviceSettingsPanel;