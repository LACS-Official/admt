/**
 * 版本检测开发者工具
 * 仅在开发环境中显示，用于诊断和调试版本检测问题
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  makeStyles,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Textarea,
  Field,
} from '@fluentui/react-components';
import {
  Bug24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  Dismiss24Filled,
  Copy24Regular,
  Play24Regular,
  DocumentText24Regular,
} from '@fluentui/react-icons';
import { versionDiagnostic, VersionDiagnosticReport } from '../../utils/versionDiagnostic';
import { unifiedVersionService } from '../../services/unifiedVersionService';

const useStyles = makeStyles({
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '400px',
    maxHeight: '600px',
    zIndex: 9999,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `2px solid ${tokens.colorBrandBackground}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: '10px 10px 0 0',
  },

  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },

  content: {
    padding: '16px',
    maxHeight: '500px',
    overflowY: 'auto',
  },

  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },

  statusCard: {
    marginBottom: '12px',
    padding: '12px',
    borderRadius: '8px',
  },

  statusSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
  },

  statusWarning: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    border: `1px solid ${tokens.colorPaletteYellowBorder1}`,
  },

  statusError: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
  },

  statusHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },

  statusMessage: {
    fontSize: '14px',
    lineHeight: '1.4',
  },

  statusDetails: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },

  summary: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
  },

  summaryItem: {
    textAlign: 'center',
  },

  summaryNumber: {
    fontSize: '20px',
    fontWeight: '700',
    display: 'block',
  },

  summaryLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },

  reportTextarea: {
    fontFamily: 'monospace',
    fontSize: '12px',
    minHeight: '200px',
  },

  minimized: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    border: `2px solid ${tokens.colorBrandBackground}`,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
});

const VersionDevTools: React.FC = () => {
  const styles = useStyles();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<VersionDiagnosticReport | null>(null);
  const [showReport, setShowReport] = useState(false);

  // 只在开发环境中显示
  if (!import.meta.env.DEV) {
    return null;
  }

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await versionDiagnostic.runFullDiagnostic();
      setReport(diagnosticReport);
      console.log('🔍 版本检测诊断完成:', diagnosticReport);
    } catch (error) {
      console.error('❌ 诊断失败:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = () => {
    unifiedVersionService.clearCache();
    unifiedVersionService.clearMonitorLogs();
    console.log('🗑️ 版本检测缓存已清空');
  };

  const copyReport = () => {
    if (report) {
      const reportText = versionDiagnostic.exportReport(report);
      navigator.clipboard.writeText(reportText).then(() => {
        console.log('📋 诊断报告已复制到剪贴板');
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckmarkCircle24Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 'warning':
        return <Warning24Filled style={{ color: tokens.colorPaletteYellowForeground2 }} />;
      case 'error':
        return <Dismiss24Filled style={{ color: tokens.colorPaletteRedForeground1 }} />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return styles.statusSuccess;
      case 'warning':
        return styles.statusWarning;
      case 'error':
        return styles.statusError;
      default:
        return '';
    }
  };

  const getOverallStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge appearance="filled" color="success">健康</Badge>;
      case 'issues':
        return <Badge appearance="filled" color="warning">有问题</Badge>;
      case 'critical':
        return <Badge appearance="filled" color="danger">严重</Badge>;
      default:
        return <Badge appearance="outline">未知</Badge>;
    }
  };

  if (isMinimized) {
    return (
      <div
        className={`${styles.container} ${styles.minimized}`}
        onClick={() => {
          setIsMinimized(false);
          setIsVisible(true);
        }}
        title="版本检测开发工具"
      >
        <Bug24Regular />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Bug24Regular />
          <Text>版本检测工具</Text>
        </div>
        <Button
          appearance="subtle"
          size="small"
          onClick={() => setIsMinimized(true)}
          style={{ color: tokens.colorNeutralForegroundOnBrand }}
        >
          ×
        </Button>
      </div>

      <div className={styles.content}>
        <div className={styles.actionButtons}>
          <Button
            appearance="primary"
            size="small"
            icon={<Play24Regular />}
            onClick={runDiagnostic}
            disabled={isRunning}
          >
            {isRunning ? <Spinner size="tiny" /> : '运行诊断'}
          </Button>
          <Button
            appearance="secondary"
            size="small"
            onClick={clearCache}
          >
            清空缓存
          </Button>
          {report && (
            <Button
              appearance="secondary"
              size="small"
              icon={<DocumentText24Regular />}
              onClick={() => setShowReport(!showReport)}
            >
              {showReport ? '隐藏报告' : '显示报告'}
            </Button>
          )}
        </div>

        {report && (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryNumber}>{report.summary.totalChecks}</Text>
                <Text className={styles.summaryLabel}>总检查</Text>
              </div>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryNumber} style={{ color: tokens.colorPaletteGreenForeground1 }}>
                  {report.summary.passed}
                </Text>
                <Text className={styles.summaryLabel}>通过</Text>
              </div>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryNumber} style={{ color: tokens.colorPaletteYellowForeground2 }}>
                  {report.summary.warnings}
                </Text>
                <Text className={styles.summaryLabel}>警告</Text>
              </div>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryNumber} style={{ color: tokens.colorPaletteRedForeground1 }}>
                  {report.summary.errors}
                </Text>
                <Text className={styles.summaryLabel}>错误</Text>
              </div>
            </div>

            <MessageBar intent={report.overallStatus === 'healthy' ? 'success' : report.overallStatus === 'issues' ? 'warning' : 'error'}>
              <MessageBarBody>
                <MessageBarTitle>
                  整体状态: {getOverallStatusBadge(report.overallStatus)}
                </MessageBarTitle>
                环境: {report.environment} | 时间: {new Date(report.timestamp).toLocaleTimeString()}
              </MessageBarBody>
            </MessageBar>

            <Accordion multiple collapsible>
              <AccordionItem value="results">
                <AccordionHeader>检查结果 ({report.results.length})</AccordionHeader>
                <AccordionPanel>
                  {report.results.map((result, index) => (
                    <div key={index} className={`${styles.statusCard} ${getStatusClass(result.status)}`}>
                      <div className={styles.statusHeader}>
                        {getStatusIcon(result.status)}
                        <Text weight="semibold">{result.category}</Text>
                        <Badge appearance="outline" size="small">{result.title}</Badge>
                      </div>
                      <Text className={styles.statusMessage}>{result.message}</Text>
                      {result.solution && (
                        <Text className={styles.statusMessage} style={{ marginTop: '4px', fontStyle: 'italic' }}>
                          💡 {result.solution}
                        </Text>
                      )}
                      {result.details && (
                        <div className={styles.statusDetails}>
                          {JSON.stringify(result.details, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem value="recommendations">
                <AccordionHeader>修复建议 ({report.recommendations.length})</AccordionHeader>
                <AccordionPanel>
                  {report.recommendations.map((recommendation, index) => (
                    <Text key={index} style={{ display: 'block', marginBottom: '8px' }}>
                      {recommendation}
                    </Text>
                  ))}
                </AccordionPanel>
              </AccordionItem>

              {showReport && (
                <AccordionItem value="fullReport">
                  <AccordionHeader>
                    完整报告
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Copy24Regular />}
                      onClick={copyReport}
                      style={{ marginLeft: '8px' }}
                    >
                      复制
                    </Button>
                  </AccordionHeader>
                  <AccordionPanel>
                    <Field>
                      <Textarea
                        className={styles.reportTextarea}
                        value={versionDiagnostic.exportReport(report)}
                        readOnly
                      />
                    </Field>
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          </>
        )}

        {!report && !isRunning && (
          <MessageBar intent="info">
            <MessageBarBody>
              点击"运行诊断"开始检查版本检测系统状态
            </MessageBarBody>
          </MessageBar>
        )}
      </div>
    </div>
  );
};

export default VersionDevTools;