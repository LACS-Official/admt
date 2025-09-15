import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  makeStyles,
  Text,
  Button,
  Card,
  CardHeader,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import {
  Bug24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Info24Regular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  container: {
    padding: "16px",
    height: "100%",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  card: {
    marginBottom: "16px",
  },
  resultContainer: {
    marginTop: "16px",
  },
  jsonViewer: {
    backgroundColor: "var(--colorNeutralBackground2)",
    padding: "12px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    maxHeight: "400px",
    overflow: "auto",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
  },
  statusList: {
    margin: "12px 0",
  },
});

interface DiagnosisResult {
  scrcpy_found: boolean;
  scrcpy_path?: string;
  scrcpy_exists?: boolean;
  scrcpy_size?: number;
  dependencies?: Record<string, boolean>;
  current_exe?: string;
  exe_directory?: string;
  tools_directory_content?: string[];
  system_scrcpy?: string | null;
  error?: string;
}

const ScrcpyDiagnosticPanel: React.FC = () => {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = async () => {
    setIsLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const result = await invoke<DiagnosisResult>('diagnose_scrcpy');
      setDiagnosis(result);
    } catch (err) {
      setError(`诊断失败: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckmarkCircle24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />
    ) : (
      <ErrorCircle24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bug24Regular />
        <Text size={500} weight="semibold">scrcpy 诊断工具</Text>
      </div>

      <Card className={styles.card}>
        <CardHeader
          header={
            <Text size={400} weight="medium">
              运行 scrcpy 诊断，检查投屏功能可用性
            </Text>
          }
          description="此工具将检查 scrcpy 可执行文件的位置、依赖文件和配置"
          action={
            <Button
              appearance="primary"
              icon={isLoading ? <Spinner size="tiny" /> : <Bug24Regular />}
              onClick={runDiagnosis}
              disabled={isLoading}
            >
              {isLoading ? '诊断中...' : '开始诊断'}
            </Button>
          }
        />
      </Card>

      {error && (
        <Card className={styles.card}>
          <CardHeader
            header={<Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>}
          />
        </Card>
      )}

      {diagnosis && (
        <div className={styles.resultContainer}>
          <Card className={styles.card}>
            <CardHeader
              header={<Text size={400} weight="medium">诊断结果</Text>}
            />
            
            <div className={styles.statusList}>
              <div className={styles.statusItem}>
                <Text>scrcpy 可执行文件</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusIcon(diagnosis.scrcpy_found)}
                  <Badge 
                    appearance="filled" 
                    color={diagnosis.scrcpy_found ? "success" : "danger"}
                  >
                    {diagnosis.scrcpy_found ? '已找到' : '未找到'}
                  </Badge>
                </div>
              </div>

              {diagnosis.scrcpy_path && (
                <div className={styles.statusItem}>
                  <Text>scrcpy 路径</Text>
                  <Text style={{ fontFamily: "monospace", fontSize: "12px" }}>
                    {diagnosis.scrcpy_path}
                  </Text>
                </div>
              )}

              {diagnosis.scrcpy_exists !== undefined && (
                <div className={styles.statusItem}>
                  <Text>文件存在性</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(diagnosis.scrcpy_exists)}
                    <Badge 
                      appearance="filled" 
                      color={diagnosis.scrcpy_exists ? "success" : "danger"}
                    >
                      {diagnosis.scrcpy_exists ? '存在' : '不存在'}
                    </Badge>
                  </div>
                </div>
              )}

              {diagnosis.scrcpy_size && (
                <div className={styles.statusItem}>
                  <Text>文件大小</Text>
                  <Text>{formatFileSize(diagnosis.scrcpy_size)}</Text>
                </div>
              )}

              {diagnosis.current_exe && (
                <div className={styles.statusItem}>
                  <Text>当前程序路径</Text>
                  <Text style={{ fontFamily: "monospace", fontSize: "12px" }}>
                    {diagnosis.current_exe}
                  </Text>
                </div>
              )}

              {diagnosis.exe_directory && (
                <div className={styles.statusItem}>
                  <Text>程序目录</Text>
                  <Text style={{ fontFamily: "monospace", fontSize: "12px" }}>
                    {diagnosis.exe_directory}
                  </Text>
                </div>
              )}

              {diagnosis.system_scrcpy && (
                <div className={styles.statusItem}>
                  <Text>系统 scrcpy</Text>
                  <Text style={{ fontFamily: "monospace", fontSize: "12px" }}>
                    {diagnosis.system_scrcpy}
                  </Text>
                </div>
              )}
            </div>

            {diagnosis.dependencies && (
              <>
                <Text size={400} weight="medium" style={{ margin: "16px 0 8px 0" }}>
                  依赖文件检查
                </Text>
                <div className={styles.statusList}>
                  {Object.entries(diagnosis.dependencies).map(([file, exists]) => (
                    <div key={file} className={styles.statusItem}>
                      <Text>{file}</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getStatusIcon(exists)}
                        <Badge 
                          appearance="filled" 
                          color={exists ? "success" : "warning"}
                        >
                          {exists ? '存在' : '缺失'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {diagnosis.tools_directory_content && diagnosis.tools_directory_content.length > 0 && (
              <>
                <Text size={400} weight="medium" style={{ margin: "16px 0 8px 0" }}>
                  Tools 目录内容
                </Text>
                <div className={styles.jsonViewer}>
                  {diagnosis.tools_directory_content.join('\n')}
                </div>
              </>
            )}

            {diagnosis.error && (
              <>
                <Text size={400} weight="medium" style={{ margin: "16px 0 8px 0", color: "var(--colorPaletteRedForeground1)" }}>
                  错误信息
                </Text>
                <div className={styles.jsonViewer} style={{ backgroundColor: "var(--colorPaletteRedBackground1)" }}>
                  {diagnosis.error}
                </div>
              </>
            )}
          </Card>

          <Card className={styles.card}>
            <CardHeader
              header={<Text size={400} weight="medium">完整诊断数据</Text>}
            />
            <div className={styles.jsonViewer}>
              {JSON.stringify(diagnosis, null, 2)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ScrcpyDiagnosticPanel;