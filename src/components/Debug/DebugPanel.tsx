/**
 * 调试面板组件
 * 用于开发模式下的问题排查和状态监控
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Title3,
  Card,
  CardHeader,
  CardPreview,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Badge,
  Textarea,
} from '@fluentui/react-components';
import {
  Bug24Regular,
  Info24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Code24Regular,
} from '@fluentui/react-icons';
import { useStartupFlowStore } from '../../stores/startupFlowStore';
import { useWelcomeStore, useAppConfigStore } from '../../stores/welcomeStore';
import { devToolsManager } from '../../utils/devtools';

const useStyles = makeStyles({
  container: {
    position: 'fixed',
    top: '10px',
    left: '10px',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    zIndex: 10000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--colorNeutralStroke1)',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--colorNeutralStroke2)',
  },
  content: {
    padding: '16px',
  },
  section: {
    marginBottom: '16px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--colorNeutralStroke3)',
  },
  statusLabel: {
    flex: 1,
  },
  logArea: {
    width: '100%',
    minHeight: '120px',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    minWidth: '32px',
    height: '32px',
  },
});

interface DebugPanelProps {
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const styles = useStyles();
  const startupFlowStore = useStartupFlowStore();
  const welcomeStore = useWelcomeStore();
  const appConfigStore = useAppConfigStore();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null);

  useEffect(() => {
    // 获取环境信息
    loadEnvironmentInfo();
    
    // 启用调试模式
    devToolsManager.enableDebugMode();
    devToolsManager.logEnvironmentInfo();
    
    // 监听控制台日志
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args.join(' '));
    };
    
    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args.join(' '));
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args.join(' '));
    };
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const loadEnvironmentInfo = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const envInfo = await invoke('get_app_environment');
      setEnvironmentInfo(envInfo);
    } catch (error) {
      console.error('获取环境信息失败:', error);
    }
  };

  const addLog = (level: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${level}: ${message}`;
    setLogs(prev => [...prev.slice(-49), logEntry]); // 保留最近50条日志
  };

  const handleOpenDevTools = async () => {
    await devToolsManager.openDevTools();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleExportLogs = () => {
    const logContent = logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hout-debug-${new Date().toISOString().slice(0, 19)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (condition: boolean) => {
    return condition ? (
      <Badge appearance="filled" color="success" icon={<Checkmark24Regular />}>
        正常
      </Badge>
    ) : (
      <Badge appearance="filled" color="danger" icon={<Dismiss24Regular />}>
        异常
      </Badge>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bug24Regular />
        <Title3>调试面板</Title3>
        <Button
          className={styles.closeButton}
          appearance="subtle"
          icon={<Dismiss24Regular />}
          onClick={onClose}
        />
      </div>
      
      <div className={styles.content}>
        <Accordion multiple collapsible>
          {/* 环境信息 */}
          <AccordionItem value="environment">
            <AccordionHeader icon={<Info24Regular />}>
              环境信息
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.section}>
                {environmentInfo && (
                  <>
                    <div className={styles.statusItem}>
                      <Text className={styles.statusLabel}>调试模式:</Text>
                      {getStatusBadge(environmentInfo.debug_mode)}
                    </div>
                    <div className={styles.statusItem}>
                      <Text className={styles.statusLabel}>平台:</Text>
                      <Text>{environmentInfo.platform}</Text>
                    </div>
                    <div className={styles.statusItem}>
                      <Text className={styles.statusLabel}>架构:</Text>
                      <Text>{environmentInfo.arch}</Text>
                    </div>
                    <div className={styles.statusItem}>
                      <Text className={styles.statusLabel}>版本:</Text>
                      <Text>{environmentInfo.version || 'N/A'}</Text>
                    </div>
                  </>
                )}
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* 启动流程状态 */}
          <AccordionItem value="startup">
            <AccordionHeader icon={<Warning24Regular />}>
              启动流程状态
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.section}>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>当前阶段:</Text>
                  <Badge appearance="outline">{startupFlowStore.currentPhase}</Badge>
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>版本检查:</Text>
                  {getStatusBadge(startupFlowStore.versionCheckCompleted)}
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>首次启动检测:</Text>
                  {getStatusBadge(startupFlowStore.firstLaunchDetected)}
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>隐私政策同意:</Text>
                  {getStatusBadge(startupFlowStore.privacyConsentGiven)}
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>激活验证:</Text>
                  {getStatusBadge(startupFlowStore.activationVerified)}
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>数据收集启用:</Text>
                  {getStatusBadge(startupFlowStore.dataCollectionEnabled)}
                </div>
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* 激活状态 */}
          <AccordionItem value="activation">
            <AccordionHeader icon={<Checkmark24Regular />}>
              激活状态
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.section}>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>激活状态:</Text>
                  <Badge appearance="outline">{welcomeStore.activationStatus}</Badge>
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>应用已激活:</Text>
                  {getStatusBadge(appConfigStore.isActivated)}
                </div>
                <div className={styles.statusItem}>
                  <Text className={styles.statusLabel}>激活码:</Text>
                  <Text>{welcomeStore.activationCode || 'N/A'}</Text>
                </div>
              </div>
            </AccordionPanel>
          </AccordionItem>

          {/* 实时日志 */}
          <AccordionItem value="logs">
            <AccordionHeader icon={<Code24Regular />}>
              实时日志 ({logs.length})
            </AccordionHeader>
            <AccordionPanel>
              <div className={styles.section}>
                <div className={styles.buttonGroup}>
                  <Button size="small" onClick={handleClearLogs}>
                    清空日志
                  </Button>
                  <Button size="small" onClick={handleExportLogs}>
                    导出日志
                  </Button>
                  <Button size="small" onClick={handleOpenDevTools}>
                    打开开发者工具
                  </Button>
                </div>
                <Textarea
                  className={styles.logArea}
                  value={logs.join('\n')}
                  readOnly
                  placeholder="日志将在这里显示..."
                />
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default DebugPanel;
