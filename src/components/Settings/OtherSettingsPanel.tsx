import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Select,
} from "@fluentui/react-components";
import {
  Globe24Regular,
  Accessibility24Regular,
  ArrowMinimize24Regular,
  Play24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { systemTrayService } from "../../services/systemTrayService";
import { autoStartService } from "../../services/autoStartService";

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
  buttonGroup: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sliderValue: {
    textAlign: "center",
    fontWeight: "600",
    color: "var(--colorBrandForeground1)",
  },
});

const OtherSettingsPanel: React.FC = () => {
  const styles = useStyles();

  const { config, updateConfig } = useAppStore();
  
  // 界面设置状态
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [startWithSystem, setStartWithSystem] = useState(false);
  const [traySupported, setTraySupported] = useState(false);
  const [autoStartSupported, setAutoStartSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  // 初始化系统功能状态
  useEffect(() => {
    const initializeSystemFeatures = async () => {
      try {
        setLoading(true);

        // 检查系统托盘支持
        const traySupport = await systemTrayService.isSystemTraySupported();
        setTraySupported(traySupport);

        // 检查开机自启动支持
        await autoStartService.initialize('玩机管家');
        const autoStartSupport = await autoStartService.isAutoStartSupported();
        setAutoStartSupported(autoStartSupport);

        // 获取当前自启动状态
        if (autoStartSupport) {
          const autoStartStatus = await autoStartService.getAutoStartStatus();
          setStartWithSystem(autoStartStatus.isEnabled);
        }

        console.log('✅ 系统功能状态初始化完成');
      } catch (error) {
        console.error('❌ 系统功能状态初始化失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSystemFeatures();
  }, []);

  const handleLanguageChange = (value: string) => {
    updateConfig({ language: value as "zh-CN" | "en-US" });
  };

  // 处理系统托盘切换
  const handleMinimizeToTrayChange = async (checked: boolean) => {
    try {
      setLoading(true);
      setMinimizeToTray(checked);

      if (checked) {
        // 启用系统托盘
        await systemTrayService.initialize({
          tooltip: '玩机管家',
          menuItems: [
            { id: 'show', label: '显示窗口' },
            { id: 'separator1', label: '-' },
            { id: 'exit', label: '退出应用' }
          ]
        });

        // 设置窗口关闭时最小化到托盘
        await systemTrayService.setupWindowCloseHandler(true);
        
        console.log('✅ 系统托盘已启用');
      } else {
        // 禁用系统托盘
        await systemTrayService.cleanup();
        console.log('✅ 系统托盘已禁用');
      }
    } catch (error) {
      console.error('❌ 系统托盘设置失败:', error);
      // 回滚状态
      setMinimizeToTray(!checked);
    } finally {
      setLoading(false);
    }
  };

  // 处理开机自启动切换
  const handleStartWithSystemChange = async (checked: boolean) => {
    try {
      setLoading(true);
      
      const success = checked 
        ? await autoStartService.enableAutoStart()
        : await autoStartService.disableAutoStart();

      if (success) {
        setStartWithSystem(checked);
        console.log(`✅ 开机自启动已${checked ? '启用' : '禁用'}`);
      } else {
        console.error('❌ 开机自启动设置失败');
      }
    } catch (error) {
      console.error('❌ 开机自启动设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        {/* 语言和地区 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Globe24Regular />}
            header={<Text weight="semibold">语言和地区</Text>}
            description={<Text size={200}>语言、时区和本地化设置</Text>}
          />

          <div className={styles.cardContent}>
            <Field label="界面语言:">
              <Select
                value={config.language}
                onChange={(_, data) => handleLanguageChange(data.value)}
              >
                <option value="zh-CN">简体中文</option>
                <option value="zh-CN">Chinese</option>
              </Select>
            </Field>

            <Field label="日期格式:">
              <Select defaultValue="yyyy-mm-dd">
                <option value="yyyy-mm-dd">2024-01-01</option>
              </Select>
            </Field>

            <Field label="时间格式:">
              <Select defaultValue="24h">
                <option value="24h">24小时制</option>
              </Select>
            </Field>
          </div>
        </Card>

        {/* 通知和声音
        <Card className={styles.card}>
          <CardHeader
            image={<Speaker224Regular />}
            header={<Text weight="semibold">通知和声音</Text>}
            description={<Text size={200}>提醒和音效设置</Text>}
          />

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">启用声音效果</Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  操作完成时播放提示音
                </Text>
              </div>
              <Switch
                checked={enableSounds}
                onChange={(_, data) => setEnableSounds(data.checked === true)}
              />
            </div>


            <Field label="通知类型:">
              <div className={styles.checkboxGroup}>
                <Checkbox label="操作完成通知" defaultChecked />
                <Checkbox label="错误警告通知" defaultChecked />
                <Checkbox label="设备连接通知" defaultChecked />
                <Checkbox label="更新提醒通知" />
              </div>
            </Field>
          </div>
        </Card> */}

        {/* 行为设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Accessibility24Regular />}
            header={<Text weight="semibold">行为设置</Text>}
            description={<Text size={200}>应用行为和启动选项</Text>}
          />

          <div className={styles.cardContent}>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">
                  <ArrowMinimize24Regular style={{ marginRight: '8px' }} />
                  最小化到系统托盘
                </Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {traySupported 
                    ? "关闭窗口时最小化到托盘" 
                    : "当前系统不支持系统托盘功能"
                  }
                </Text>
              </div>
              <Switch
                checked={minimizeToTray}
                disabled={!traySupported || loading}
                onChange={(_, data) => handleMinimizeToTrayChange(data.checked === true)}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">
                  <Play24Regular style={{ marginRight: '8px' }} />
                  开机自启动
                </Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {autoStartSupported 
                    ? "系统启动时自动运行应用" 
                    : "当前系统不支持开机自启动功能"
                  }
                </Text>
              </div>
              <Switch
                checked={startWithSystem}
                disabled={!autoStartSupported || loading}
                onChange={(_, data) => handleStartWithSystemChange(data.checked === true)}
              />
            </div>
          </div>
        </Card>


      </div>
    </div>
  );
};

export default OtherSettingsPanel;
