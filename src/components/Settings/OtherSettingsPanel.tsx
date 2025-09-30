import React, { useState, useEffect, useMemo } from "react";
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Switch,
  Field,
  Select,
  Button,
  Spinner,
} from "@fluentui/react-components";
import {
  Globe24Regular,
  Accessibility24Regular,
  ArrowMinimize24Regular,
  Play24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../stores/appStore";
import { systemTrayService } from "../../services/systemTrayService";
import { autoStartService } from "../../services/autoStartService";

// 状态提示组件
interface SystemFeatureStatus {
  type: 'success' | 'error' | 'warning';
  message: string;
  action?: () => void;
}

const StatusIndicator: React.FC<{ status: SystemFeatureStatus | null }> = ({ status }) => {
  if (!status) return null;
  
  const getIcon = () => {
    switch (status.type) {
      case 'success': return <CheckmarkCircle24Regular style={{ color: 'var(--colorStatusSuccessBackground)' }} />;
      case 'error': return <Warning24Regular style={{ color: 'var(--colorStatusDangerBackground)' }} />;
      case 'warning': return <Warning24Regular style={{ color: 'var(--colorStatusWarningBackground)' }} />;
      default: return null;
    }
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      marginTop: '8px',
      padding: '8px',
      backgroundColor: 'var(--colorNeutralBackground2)',
      borderRadius: '4px'
    }}>
      {getIcon()}
      <Text size={100}>{status.message}</Text>
      {status.action && (
        <Button size="small" onClick={status.action}>
          重试
        </Button>
      )}
    </div>
  );
};

// 防抖函数
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  
  // 从配置中读取状态
  const [minimizeToTray, setMinimizeToTray] = useState(config.systemTrayEnabled);
  const [startWithSystem, setStartWithSystem] = useState(config.autoStartEnabled);
  const [startMinimizedToTray, setStartMinimizedToTray] = useState(config.startMinimizedToTray);
  const [minimizeToTrayOnClose, setMinimizeToTrayOnClose] = useState(config.minimizeToTrayOnClose);
  const [traySupported, setTraySupported] = useState(false);
  const [autoStartSupported, setAutoStartSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trayStatus, setTrayStatus] = useState<SystemFeatureStatus | null>(null);
  const [autoStartStatus, setAutoStartStatus] = useState<SystemFeatureStatus | null>(null);
  
  // 防抖检查系统功能，避免重复调用
  const checkSystemFeatures = useMemo(() => 
    debounce(async () => {
      try {
        const [traySupported, autoStartSupported] = await Promise.all([
          systemTrayService.isSystemTraySupported(),
          autoStartService.isAutoStartSupported()
        ]);
        
        setTraySupported(traySupported);
        setAutoStartSupported(autoStartSupported);
      } catch (error) {
        console.error('❌ 系统功能检查失败:', error);
      }
    }, 1000), []
  );

  // 初始化时同步状态
  useEffect(() => {
    const syncStates = async () => {
      try {
        setLoading(true);
        
        // 检查系统支持
        await checkSystemFeatures();
        
        // 同步托盘状态（不重复初始化）
        const trayStatus = await systemTrayService.isReady();
        if (trayStatus !== config.systemTrayEnabled) {
          console.log(`🔄 同步托盘状态: ${trayStatus ? '已启用' : '未启用'}`);
          updateConfig({ systemTrayEnabled: trayStatus });
          setMinimizeToTray(trayStatus);
        }

        // 同步自启动状态
        if (autoStartSupported) {
          await autoStartService.initialize('玩机管家');
          const autoStartStatus = await autoStartService.getAutoStartStatus();
          if (autoStartStatus.isEnabled !== config.autoStartEnabled) {
            updateConfig({ autoStartEnabled: autoStartStatus.isEnabled });
            setStartWithSystem(autoStartStatus.isEnabled);
          }
        }
      } catch (error) {
        console.error('❌ 状态同步失败:', error);
      } finally {
        setLoading(false);
      }
    };

    syncStates();
  }, []);

  // 更新配置时同步状态
  useEffect(() => {
    setMinimizeToTray(config.systemTrayEnabled);
    setStartWithSystem(config.autoStartEnabled);
    setStartMinimizedToTray(config.startMinimizedToTray);
  }, [config.systemTrayEnabled, config.autoStartEnabled, config.startMinimizedToTray]);

  // 优化的托盘切换处理
  const handleMinimizeToTrayChange = async (checked: boolean) => {
    try {
      setLoading(true);
      setMinimizeToTray(checked);
      setTrayStatus(null);

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
        
        setTrayStatus({
          type: 'success',
          message: '系统托盘已启用，关闭窗口时将最小化到托盘'
        });
      } else {
        // 禁用系统托盘
        await systemTrayService.setupWindowCloseHandler(false);
        await systemTrayService.cleanup();
        
        setTrayStatus({
          type: 'success',
          message: '系统托盘已禁用，关闭窗口时将直接退出'
        });
      }

      // 保存到配置
      updateConfig({ 
        systemTrayEnabled: checked,
        minimizeToTrayOnClose: checked 
      });

      console.log(`✅ 系统托盘已${checked ? '启用' : '禁用'}`);
    } catch (error) {
      console.error('❌ 系统托盘设置失败:', error);
      // 回滚状态
      setMinimizeToTray(!checked);
      setTrayStatus({
        type: 'error',
        message: '系统托盘设置失败，请检查系统权限',
        action: () => handleMinimizeToTrayChange(checked)
      });
    } finally {
      setLoading(false);
    }
  };

  // 优化的自启动切换处理
  const handleStartWithSystemChange = async (checked: boolean) => {
    try {
      setLoading(true);
      setAutoStartStatus(null);
      
      const success = checked 
        ? await autoStartService.enableAutoStartWithValidation()
        : await autoStartService.disableAutoStart();

      if (success) {
        setStartWithSystem(checked);
        updateConfig({ autoStartEnabled: checked });
        
        setAutoStartStatus({
          type: 'success',
          message: `开机自启动已${checked ? '启用' : '禁用'}`
        });
        
        console.log(`✅ 开机自启动已${checked ? '启用' : '禁用'}`);
      } else {
        // 回滚状态
        setStartWithSystem(!checked);
        
        setAutoStartStatus({
          type: 'error',
          message: `开机自启动${checked ? '启用' : '禁用'}失败，请以管理员身份运行`,
          action: () => handleStartWithSystemChange(checked)
        });
        
        console.error(`❌ 开机自启动${checked ? '启用' : '禁用'}失败`);
      }
    } catch (error) {
      console.error(`❌ 开机自启动${checked ? '启用' : '禁用'}失败:`, error);
      setStartWithSystem(!checked);
      
      setAutoStartStatus({
        type: 'error',
        message: '开机自启动设置失败，请检查系统权限',
        action: () => handleStartWithSystemChange(checked)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    updateConfig({ language: value as "zh-CN" | "en-US" });
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

        {/* 行为设置 */}
        <Card className={styles.card}>
          <CardHeader
            image={<Accessibility24Regular />}
            header={<Text weight="semibold">行为设置</Text>}
            description={<Text size={200}>应用行为和启动选项</Text>}
          />

          <div className={styles.cardContent}>
            {/* 加载指示器 */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Spinner size="tiny" />
                <Text size={200}>正在处理...</Text>
              </div>
            )}

            {/* 系统托盘设置 */}
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <Text weight="semibold">
                  <ArrowMinimize24Regular style={{ marginRight: '8px' }} />
                  启用系统托盘
                </Text>
                <br />
                <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                  {traySupported 
                    ? "启用后程序将显示在系统托盘中，关闭后将最小化到托盘" 
                    : "当前系统不支持系统托盘功能"
                  }
                </Text>
                <StatusIndicator status={trayStatus} />
              </div>
              <Switch
                checked={minimizeToTray}
                disabled={!traySupported || loading}
                onChange={(_, data) => handleMinimizeToTrayChange(data.checked === true)}
              />
            </div>


            {/* 开机自启动设置 */}
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
                <StatusIndicator status={autoStartStatus} />
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
