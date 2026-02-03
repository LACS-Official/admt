/**
 * 版本检查调试页面
 * 用于诊断版本检测问题
 */

import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardPreview,
  Text,
  Title3,
  Body1,
  Caption1,
  Badge,
  Divider,
  Spinner
} from '@fluentui/react-components';
import { 
  Bug24Regular,
  ArrowClockwise24Regular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
  Warning24Filled
} from '@fluentui/react-icons';
import { makeStyles } from '@fluentui/react-components';
import { debugVersionService, DebugVersionResult } from '../../services/debugVersionService';
import { unifiedVersionService as versionService, VersionCheckResult } from '../../services/unifiedVersionService';

const useStyles = makeStyles({
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  card: {
    padding: '16px'
  },
  section: {
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  json: {
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '200px',
    border: '1px solid #e0e0e0'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  }
});

const VersionDebugPage: React.FC = () => {
  const styles = useStyles();
  const [debugResult, setDebugResult] = useState<DebugVersionResult | null>(null);
  const [normalResult, setNormalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebugCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 开始运行调试版本检查...');
      
      // 清除缓存确保获取最新数据
      debugVersionService.clearCache();
      versionService.clearCache();
      
      // 运行调试检查
      const debugRes = await debugVersionService.debugCheckForUpdates();
      setDebugResult(debugRes);
      
      // 运行正常检查进行对比
      const normalRes = await versionService.checkForUpdates();
      setNormalResult(normalRes);
      
      console.log('✅ 调试检查完成');
      console.log('调试结果:', debugRes);
      console.log('正常结果:', normalRes);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      console.error('❌ 调试检查失败:', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    debugVersionService.clearCache();
    versionService.clearCache();
    setDebugResult(null);
    setNormalResult(null);
    console.log('🗑️ 缓存已清空');
  };

  const getStatusIcon = (success: boolean, hasError?: boolean) => {
    if (hasError) return <ErrorCircle24Filled style={{ color: '#d13438' }} />;
    if (success) return <CheckmarkCircle24Filled style={{ color: '#107c10' }} />;
    return <Warning24Filled style={{ color: '#ff8c00' }} />;
  };

  const getStatusBadge = (success: boolean, hasError?: boolean) => {
    if (hasError) return <Badge appearance="filled" color="danger">错误</Badge>;
    if (success) return <Badge appearance="filled" color="success">成功</Badge>;
    return <Badge appearance="filled" color="warning">失败</Badge>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bug24Regular />
        <Title3>版本检查调试工具</Title3>
      </div>

      <div className={styles.actions}>
        <Button 
          appearance="primary" 
          icon={<ArrowClockwise24Regular />}
          onClick={runDebugCheck}
          disabled={loading}
        >
          {loading ? '检查中...' : '运行调试检查'}
        </Button>
        <Button 
          appearance="secondary"
          onClick={clearCache}
        >
          清除缓存
        </Button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Spinner size="small" />
          <Body1>正在运行版本检查调试...</Body1>
        </div>
      )}

      {error && (
        <Card className={styles.card} style={{ marginBottom: '20px', borderColor: '#d13438' }}>
          <CardHeader
            header={
              <div className={styles.status}>
                <ErrorCircle24Filled style={{ color: '#d13438' }} />
                <Text weight="semibold">调试检查失败</Text>
              </div>
            }
          />
          <CardPreview>
            <Body1 style={{ color: '#d13438' }}>{error}</Body1>
          </CardPreview>
        </Card>
      )}

      {debugResult && (
        <div className={styles.grid}>
          {/* 版本源调试 */}
          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">版本源检测</Text>}
            />
            <CardPreview>
              <div className={styles.section}>
                <div className={styles.row}>
                  <Body1>最终版本:</Body1>
                  <span className={styles.code}>{debugResult.finalCurrentVersion}</span>
                </div>
                <Divider />
                
                {Object.entries(debugResult.versionSources).map(([source, info]) => (
                  <div key={source} className={styles.row}>
                    <Body1>{source.toUpperCase()}:</Body1>
                    <div className={styles.status}>
                      {getStatusIcon(info.success, !!info.error)}
                      {info.success ? (
                        <span className={styles.code}>{info.version}</span>
                      ) : (
                        <Caption1 style={{ color: '#d13438' }}>
                          {info.error || '获取失败'}
                        </Caption1>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardPreview>
          </Card>

          {/* API配置调试 */}
          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">API配置</Text>}
            />
            <CardPreview>
              <div className={styles.section}>
                <div className={styles.row}>
                  <Body1>基础URL:</Body1>
                  <span className={styles.code}>{debugResult.apiConfig.baseUrl}</span>
                </div>
                <div className={styles.row}>
                  <Body1>软件ID:</Body1>
                  <span className={styles.code}>{debugResult.apiConfig.softwareId}</span>
                </div>
                <div className={styles.row}>
                  <Body1>端点:</Body1>
                  <span className={styles.code} style={{ fontSize: '10px' }}>
                    {debugResult.apiConfig.endpoint}
                  </span>
                </div>
              </div>
            </CardPreview>
          </Card>

          {/* 缓存信息 */}
          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">缓存状态</Text>}
            />
            <CardPreview>
              <div className={styles.section}>
                <div className={styles.row}>
                  <Body1>缓存键:</Body1>
                  <span className={styles.code}>{debugResult.cacheInfo.cacheKey}</span>
                </div>
                <div className={styles.row}>
                  <Body1>有缓存数据:</Body1>
                  {getStatusBadge(debugResult.cacheInfo.hasCachedData)}
                </div>
                <div className={styles.row}>
                  <Body1>缓存有效:</Body1>
                  {getStatusBadge(debugResult.cacheInfo.isValidCache)}
                </div>
                {debugResult.cacheInfo.cacheAge && (
                  <div className={styles.row}>
                    <Body1>缓存年龄:</Body1>
                    <span className={styles.code}>
                      {Math.round(debugResult.cacheInfo.cacheAge / 1000)}秒
                    </span>
                  </div>
                )}
              </div>
            </CardPreview>
          </Card>

          {/* 版本比较调试 */}
          <Card className={styles.card}>
            <CardHeader
              header={<Text weight="semibold">版本比较</Text>}
            />
            <CardPreview>
              <div className={styles.section}>
                <div className={styles.row}>
                  <Body1>当前版本:</Body1>
                  <span className={styles.code}>{debugResult.versionComparison.current}</span>
                </div>
                <div className={styles.row}>
                  <Body1>最新版本:</Body1>
                  <span className={styles.code}>{debugResult.versionComparison.latest}</span>
                </div>
                <div className={styles.row}>
                  <Body1>比较结果:</Body1>
                  <span className={styles.code}>{debugResult.versionComparison.comparisonResult}</span>
                </div>
                <div className={styles.row}>
                  <Body1>需要更新:</Body1>
                  {getStatusBadge(debugResult.versionComparison.hasUpdate)}
                </div>
                {debugResult.versionComparison.error && (
                  <div className={styles.row}>
                    <Body1>错误:</Body1>
                    <Caption1 style={{ color: '#d13438' }}>
                      {debugResult.versionComparison.error}
                    </Caption1>
                  </div>
                )}
              </div>
            </CardPreview>
          </Card>

          {/* API响应 */}
          {debugResult.apiResponse && (
            <Card className={styles.card} style={{ gridColumn: '1 / -1' }}>
              <CardHeader
                header={<Text weight="semibold">API响应</Text>}
              />
              <CardPreview>
                <div className={styles.json}>
                  {JSON.stringify(debugResult.apiResponse, null, 2)}
                </div>
              </CardPreview>
            </Card>
          )}

          {/* API错误 */}
          {debugResult.apiError && (
            <Card className={styles.card} style={{ borderColor: '#d13438' }}>
              <CardHeader
                header={
                  <div className={styles.status}>
                    <ErrorCircle24Filled style={{ color: '#d13438' }} />
                    <Text weight="semibold">API错误</Text>
                  </div>
                }
              />
              <CardPreview>
                <Body1 style={{ color: '#d13438' }}>{debugResult.apiError}</Body1>
              </CardPreview>
            </Card>
          )}

          {/* 正常检查结果对比 */}
          {normalResult && (
            <Card className={styles.card} style={{ gridColumn: '1 / -1' }}>
              <CardHeader
                header={<Text weight="semibold">正常版本检查结果（对比）</Text>}
              />
              <CardPreview>
                <div className={styles.json}>
                  {JSON.stringify(normalResult, null, 2)}
                </div>
              </CardPreview>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionDebugPage;