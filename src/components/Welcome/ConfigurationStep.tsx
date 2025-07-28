import React from "react";
import {
  makeStyles,
  Text,
  Input,
  Dropdown,
  Option,
  Switch,
  Field,
  Card,
} from "@fluentui/react-components";
import {
  Person24Regular,
  LocalLanguage24Regular,
  WeatherMoon24Regular,
  Rocket24Regular,
  ArrowSync24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { useWelcomeStore } from "../../stores/welcomeStore";
import { LANGUAGE_OPTIONS, THEME_OPTIONS, UserConfiguration } from "../../types/welcome";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "16px",
  },
  header: {
    textAlign: "center",
    marginBottom: "16px",
  },
  icon: {
    fontSize: "48px",
    color: "var(--colorBrandBackground)",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  sectionIcon: {
    fontSize: "20px",
    color: "var(--colorBrandBackground)",
  },
  fieldGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  switchGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  switchItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "6px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  switchInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  switchDescription: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "12px",
  },
});

const ConfigurationStep: React.FC = () => {
  const styles = useStyles();
  const { userConfig, updateUserConfig } = useWelcomeStore();

  console.log('ConfigurationStep rendered, userConfig:', userConfig);

  const handleInputChange = (field: keyof UserConfiguration, value: string) => {
    updateUserConfig(field, value);
  };

  const handleSwitchChange = (field: keyof UserConfiguration, checked: boolean) => {
    updateUserConfig(field, checked);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Person24Regular className={styles.icon} />
        <Text size={600} weight="bold">
          基本配置
        </Text>
        <Text size={300} style={{ color: "var(--colorNeutralForeground2)", marginTop: "8px" }}>
          请完成基本设置，这些设置可以在稍后修改
        </Text>
      </div>

      <div className={styles.form}>
        {/* 用户信息 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Person24Regular className={styles.sectionIcon} />
            <Text size={400} weight="semibold">用户信息</Text>
          </div>
          
          <Field label="用户名" required>
            <Input
              placeholder="请输入您的用户名"
              value={userConfig.username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
          </Field>
        </div>

        {/* 界面设置 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <LocalLanguage24Regular className={styles.sectionIcon} />
            <Text size={400} weight="semibold">界面设置</Text>
          </div>
          
          <div className={styles.fieldGroup}>
            <Field label="语言">
              <Dropdown
                placeholder="选择语言"
                value={userConfig.language || 'zh-CN'}
                onOptionSelect={(e, data) => handleInputChange('language', data.optionValue as string)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <Option key={option.key} value={option.key}>
                    {option.text}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="主题">
              <Dropdown
                placeholder="选择主题"
                value={userConfig.theme || 'auto'}
                onOptionSelect={(e, data) => handleInputChange('theme', data.optionValue as string)}
              >
                {THEME_OPTIONS.map((option) => (
                  <Option key={option.key} value={option.key}>
                    {option.text}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </div>
        </div>

        {/* 应用设置 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Settings24Regular className={styles.sectionIcon} />
            <Text size={400} weight="semibold">应用设置</Text>
          </div>
          
          <div className={styles.switchGroup}>
            <div className={styles.switchItem}>
              <div className={styles.switchInfo}>
                <Text size={300} weight="semibold">开机自启动</Text>
                <Text className={styles.switchDescription}>
                  系统启动时自动运行HOUT工具箱
                </Text>
              </div>
              <Switch
                checked={userConfig.autoStart || false}
                onChange={(e) => handleSwitchChange('autoStart', e.currentTarget.checked)}
              />
            </div>

            <div className={styles.switchItem}>
              <div className={styles.switchInfo}>
                <Text size={300} weight="semibold">检查更新</Text>
                <Text className={styles.switchDescription}>
                  自动检查并提醒软件更新
                </Text>
              </div>
              <Switch
                checked={userConfig.checkUpdates !== false} // 默认为true
                onChange={(e) => handleSwitchChange('checkUpdates', e.currentTarget.checked)}
              />
            </div>

            <div className={styles.switchItem}>
              <div className={styles.switchInfo}>
                <Text size={300} weight="semibold">使用统计</Text>
                <Text className={styles.switchDescription}>
                  发送匿名使用统计以帮助改进软件
                </Text>
              </div>
              <Switch
                checked={userConfig.enableTelemetry || false}
                onChange={(e) => handleSwitchChange('enableTelemetry', e.currentTarget.checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStep;
