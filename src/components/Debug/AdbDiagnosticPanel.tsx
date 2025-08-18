/**
 * ADB 和 Fastboot 路径诊断面板
 * 用于诊断和解决设备检测问题
 */

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Badge,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  makeStyles,
  tokens,
  Spinner,
} from '@fluentui/react-components';
import {
  Bug24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Info24Regular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  diagnosticItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  label: {
    fontWeight: tokens.fontWeightMedium,
  },
  value: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  pathValue: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    wordBreak: 'break-all',
    maxWidth: '400px',
  },
  statusBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
  },
  errorContainer: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
  },
  successContainer: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
  },
});

interface DiagnosticData {
  current_working_directory: string;
  executable_directory: string;
  path_environment: string;
  cached_adb_path: string;
  adb_exists: boolean;
  cached_fastboot_path: string;
  fastboot_exists: boolean;
  resource_directories: Array<{
    path: string;
    exists: boolean;
    type: string;
  }>;
  adb_command_test: {
    success: boolean;
    result: any;
  };
  fastboot_command_test: {
    success: boolean;
    result: any;
  };
}

const AdbDiagnosticPanel: React.FC = () => {
  const styles = useStyles();
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await invoke<DiagnosticData>('diagnose_adb_fastboot_paths');
      setDiagnosticData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '诊断失败');
      console.error('诊断失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge appearance="filled" color="success" icon={<CheckmarkCircle24Regular />}>
        正常
      </Badge>
    ) : (
      <Badge appearance="filled" color="danger" icon={<ErrorCircle24Regular />}>
        异常
      </Badge>
    );
  };

  const renderDiagnosticItem = (label: string, value: string | boolean, isPath = false) => (
    <div className={styles.diagnosticItem}>
      <Text className={styles.label}>{label}:</Text>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text className={isPath ? styles.pathValue : styles.value}>
          {typeof value === 'boolean' ? (value ? '是' : '否') : value}
        </Text>
        {typeof value === 'boolean' && (
          <div className={styles.statusBadge}>
            {getStatusBadge(value)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bug24Regular />
        <Title3>ADB/Fastboot 路径诊断</Title3>
        <Button
          appearance="primary"
          icon={<ArrowClockwise24Regular />}
          onClick={runDiagnostic}
          disabled={isLoading}
        >
          {isLoading ? '诊断中...' : '开始诊断'}
        </Button>
      </div>

      {isLoading && (
        <div className={styles.loadingContainer}>
          <Spinner size="medium" />
          <Text>正在诊断 ADB 和 Fastboot 路径配置...</Text>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <Text weight="semibold">诊断失败</Text>
          <Text>{error}</Text>
        </div>
      )}

      {diagnosticData && (
        <Accordion multiple collapsible>
          {/* 基本信息 */}
          <AccordionItem value="basic">
            <AccordionHeader icon={<Info24Regular />}>
              基本环境信息
            </AccordionHeader>
            <AccordionPanel>
              {renderDiagnosticItem('当前工作目录', diagnosticData.current_working_directory, true)}
              {renderDiagnosticItem('可执行文件目录', diagnosticData.executable_directory, true)}
              {renderDiagnosticItem('PATH 环境变量', diagnosticData.path_environment.substring(0, 100) + '...', true)}
            </AccordionPanel>
          </AccordionItem>

          {/* ADB 信息 */}
          <AccordionItem value="adb">
            <AccordionHeader icon={<CheckmarkCircle24Regular />}>
              ADB 配置状态
            </AccordionHeader>
            <AccordionPanel>
              {renderDiagnosticItem('ADB 路径', diagnosticData.cached_adb_path, true)}
              {renderDiagnosticItem('ADB 文件存在', diagnosticData.adb_exists)}
              {renderDiagnosticItem('ADB 命令测试', diagnosticData.adb_command_test.success)}
              {diagnosticData.adb_command_test.result && (
                <div className={styles.diagnosticItem}>
                  <Text className={styles.label}>ADB 版本信息:</Text>
                  <Text className={styles.value}>
                    {diagnosticData.adb_command_test.result.output || diagnosticData.adb_command_test.result.error || 'N/A'}
                  </Text>
                </div>
              )}
            </AccordionPanel>
          </AccordionItem>

          {/* Fastboot 信息 */}
          <AccordionItem value="fastboot">
            <AccordionHeader icon={<CheckmarkCircle24Regular />}>
              Fastboot 配置状态
            </AccordionHeader>
            <AccordionPanel>
              {renderDiagnosticItem('Fastboot 路径', diagnosticData.cached_fastboot_path, true)}
              {renderDiagnosticItem('Fastboot 文件存在', diagnosticData.fastboot_exists)}
              {renderDiagnosticItem('Fastboot 命令测试', diagnosticData.fastboot_command_test.success)}
              {diagnosticData.fastboot_command_test.result && (
                <div className={styles.diagnosticItem}>
                  <Text className={styles.label}>Fastboot 版本信息:</Text>
                  <Text className={styles.value}>
                    {diagnosticData.fastboot_command_test.result.output || diagnosticData.fastboot_command_test.result.error || 'N/A'}
                  </Text>
                </div>
              )}
            </AccordionPanel>
          </AccordionItem>

          {/* 资源目录 */}
          <AccordionItem value="resources">
            <AccordionHeader icon={<Info24Regular />}>
              资源目录状态
            </AccordionHeader>
            <AccordionPanel>
              {diagnosticData.resource_directories.map((dir, index) => (
                <div key={index}>
                  {renderDiagnosticItem(`${dir.type} 目录`, dir.path, true)}
                  {renderDiagnosticItem(`${dir.type} 存在`, dir.exists)}
                </div>
              ))}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {diagnosticData && (
        <Card>
          <CardHeader
            header={<Text weight="semibold">诊断建议</Text>}
            description="根据诊断结果提供的解决方案"
          />
          <CardPreview>
            <div style={{ padding: tokens.spacingVerticalM }}>
              {!diagnosticData.adb_exists && (
                <div className={styles.errorContainer}>
                  <Text weight="semibold">❌ ADB 文件不存在</Text>
                  <Text>请确保 adb.exe 文件位于 src-tauri/resources/ 目录中，或者在系统 PATH 中可用。</Text>
                </div>
              )}
              
              {!diagnosticData.fastboot_exists && (
                <div className={styles.errorContainer}>
                  <Text weight="semibold">❌ Fastboot 文件不存在</Text>
                  <Text>请确保 fastboot.exe 文件位于 src-tauri/resources/ 目录中，或者在系统 PATH 中可用。</Text>
                </div>
              )}
              
              {diagnosticData.adb_exists && diagnosticData.fastboot_exists && (
                <div className={styles.successContainer}>
                  <Text weight="semibold">✅ 路径配置正常</Text>
                  <Text>ADB 和 Fastboot 文件都已找到，设备检测应该可以正常工作。</Text>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>
      )}
    </div>
  );
};

export default AdbDiagnosticPanel;
