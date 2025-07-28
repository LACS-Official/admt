import React, { useState } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Select,
  Input,
  Button,
  Badge,
  Tab,
  TabList,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  WeatherMoon24Regular,
  Globe24Regular,
  Timer24Regular,
  FolderOpen24Regular,
  Info24Regular,
  Bug24Regular,
  Apps24Regular,
  Play24Regular,
  Shield24Regular,
  ShieldCheckmark24Regular,
} from "@fluentui/react-icons";
import { useThemeStore } from "../../stores/themeStore";
import { useAppStore } from "../../stores/appStore";
// import ApiDataDiagnostic from "../Debug/ApiDataDiagnostic";
// import ApkCacheDebug from "../Debug/ApkCacheDebug";
// import NetworkDiagnostic from "../Debug/NetworkDiagnostic";
// import ApiTestPanel from "../Debug/ApiTestPanel";
import { SecuritySettings, SecurityTest } from "../Security";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    height: "calc(100% - 80px)",
  },
  card: {
    height: "fit-content",
  },
  cardContent: {
    padding: "16px",
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
  aboutSection: {
    gridColumn: "1 / -1",
  },
  aboutContent: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    textAlign: "center",
  },
  versionBadge: {
    alignSelf: "center",
  },
});

const SettingsPanel: React.FC = () => {
  const styles = useStyles();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { config, updateConfig } = useAppStore();
  const [selectedTab, setSelectedTab] = useState<string>("general");

  const handleThemeChange = () => {
    toggleTheme();
    updateConfig({ theme: isDarkMode ? "light" : "dark" });
  };

  const handleLanguageChange = (value: string) => {
    updateConfig({ language: value as "zh-CN" | "en-US" });
  };

  const handleAutoDetectChange = (checked: boolean) => {
    updateConfig({ autoDetectDevices: checked });
  };

  const handleScanIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval >= 1000) {
      updateConfig({ scanInterval: interval });
    }
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case "general":
        return renderGeneralSettings();
      case "security":
        return <SecuritySettings />;
      case "security-test":
        return <SecurityTest />;
      case "debug":
        return <div style={{ padding: '20px', textAlign: 'center' }}>调试功能暂时不可用</div>;
      case "apk-debug":
        return <div style={{ padding: '20px', textAlign: 'center' }}>APK调试功能暂时不可用</div>;
      case "network-debug":
        return <div style={{ padding: '20px', textAlign: 'center' }}>网络诊断功能暂时不可用</div>;
      case "api-test":
        return <div style={{ padding: '20px', textAlign: 'center' }}>API测试功能暂时不可用</div>;
      default:
        return renderGeneralSettings();
    }
  };

  const renderGeneralSettings = () => (
    <div className={styles.content}>
        {/* 外观设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<WeatherMoon24Regular />}
            header={<Text weight="semibold">外观</Text>}
            description={<Text size={200}>主题和界面设置</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">深色主题</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  切换应用主题外观
                </Text>
              </div>
              <Switch
                checked={isDarkMode}
                onChange={handleThemeChange}
              />
            </div>

            <Field label="语言设置:">
              <Select
                value={config.language}
                onChange={(_, data) => handleLanguageChange(data.value)}
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* 设备设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Timer24Regular />}
            header={<Text weight="semibold">设备</Text>}
            description={<Text size={200}>设备检测和连接设置</Text>}
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
                max={10000}
                step={500}
              />
            </Field>
          </div>
        </Card>

        {/* 工具路径设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<FolderOpen24Regular />}
            header={<Text weight="semibold">工具路径</Text>}
            description={<Text size={200}>ADB和Fastboot工具路径配置</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="ADB路径:">
              <Input
                value={config.adbPath || ""}
                onChange={(_, data) => updateConfig({ adbPath: data.value })}
                placeholder="自动检测或手动指定ADB路径"
              />
            </Field>

            <Field label="Fastboot路径:">
              <Input
                value={config.fastbootPath || ""}
                onChange={(_, data) => updateConfig({ fastbootPath: data.value })}
                placeholder="自动检测或手动指定Fastboot路径"
              />
            </Field>

            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
              💡 留空将使用内置工具或系统PATH中的工具
            </Text>
          </div>
        </Card>

        {/* 日志设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Globe24Regular />}
            header={<Text weight="semibold">日志</Text>}
            description={<Text size={200}>应用日志和调试设置</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="日志级别:">
              <Select
                value={config.logLevel}
                onChange={(_, data) => updateConfig({ logLevel: data.value as "debug" | "info" | "warn" | "error" })}
              >
                <option value="debug">调试 (Debug)</option>
                <option value="info">信息 (Info)</option>
                <option value="warn">警告 (Warning)</option>
                <option value="error">错误 (Error)</option>
              </Select>
            </Field>

            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
              调试级别会显示更多详细信息，但可能影响性能
            </Text>
          </div>
        </Card>

        {/* 关于信息 */}
        <Card className={`${styles.card} ${styles.aboutSection}`}>
          <CardHeader
            image={<Info24Regular />}
            header={<Text weight="semibold">关于</Text>}
            description={<Text size={200}>应用信息和版本</Text>}
          />

          <div className={styles.aboutContent}>
            <Text size={600} weight="bold">HOUT - 澎湃解锁工具箱</Text>
            <Text size={300}>Tauri版本</Text>

            <Badge appearance="filled" color="brand" className={styles.versionBadge}>
              v1.0.0
            </Badge>

            <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
              基于Tauri框架开发的现代化Android设备管理工具
            </Text>

            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <Button appearance="secondary" size="small">
                检查更新
              </Button>
              <Button appearance="secondary" size="small">
                用户手册
              </Button>
              <Button appearance="secondary" size="small">
                问题反馈
              </Button>
            </div>

            <Text size={100} style={{ color: "var(--colorNeutralForeground3)" }}>
              © 2024 HOUT Team. 基于MIT许可证开源
            </Text>
          </div>
        </Card>
      </div>
    );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Settings24Regular />
          <Text size={500} weight="semibold">设置</Text>
        </div>
      </div>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        style={{ marginBottom: "16px" }}
      >
        <Tab value="general" icon={<Settings24Regular />}>
          常规设置
        </Tab>
        <Tab value="security" icon={<Shield24Regular />}>
          安全防护
        </Tab>
        <Tab value="security-test" icon={<ShieldCheckmark24Regular />}>
          安全测试
        </Tab>
        <Tab value="debug" icon={<Bug24Regular />}>
          设备调试
        </Tab>
        <Tab value="apk-debug" icon={<Apps24Regular />}>
          APK调试
        </Tab>
        <Tab value="network-debug" icon={<Globe24Regular />}>
          网络诊断
        </Tab>
        <Tab value="api-test" icon={<Play24Regular />}>
          API测试
        </Tab>
      </TabList>

      {renderTabContent()}
    </div>
  );
};

export default SettingsPanel;
