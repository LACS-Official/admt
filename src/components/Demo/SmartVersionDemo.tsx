/**
 * 智能版本检测演示页面
 * 展示不同环境和用户类型下的版本检测行为
 */

import React, { useState, useEffect } from 'react';
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
  Spinner,
  Select,
  Field,
  Radio,
  RadioGroup
} from '@fluentui/react-components';
import {
  Settings24Regular,
  Play24Regular,
  Info24Regular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
  Warning24Filled
} from '@fluentui/react-icons';
import { makeStyles } from '@fluentui/react-components';
import { 
  smartVersionService, 
  UserType, 
  VersionChannel,
  SmartVersionInfo,
  VersionDetectionConfig,
  EnvironmentInfo
} from '../../services/smartVersionService';

const useStyles = makeStyles({
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  card: {
    height: 'fit-content'
  },
  configSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    padding: '15px'
  },
  resultSection: {
    padding: '15px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  json: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    maxHeight: '300px',
    overflow: 'auto'
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px'
  }
});

interface DemoResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: SmartVersionInfo;
  config: VersionDetectionConfig;
  environment: EnvironmentInfo;
  message: string;
}

const SmartVersionDemo: React.FC = () => {
  const styles = useStyles();
  const [selectedUserType, setSelectedUserType] = useState<UserType>('endUser');
  const [isLoading, setIsLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo | null>(null);

  // 初始化时获取环境信息
  useEffect(() => {
    const env = smartVersionService.detectEnvironment();
    setEnvironmentInfo(env);
  }, []);

  // 运行智能版本检测
  const runSmartVersionCheck = async () => {
    setIsLoading(true);
    setError(null);
    setDemoResult(null);

    try {
      const result = await smartVersionService.smartVersionCheck(selectedUserType);
      setDemoResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '检测失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取状态图标
  const getStatusIcon = (success: boolean, hasError: boolean = false) => {
    if (hasError) return <ErrorCircle24Filled style={{ color: '#d13438' }} />;
    if (success) return <CheckmarkCircle24Filled style={{ color: '#107c10' }} />;
    return <Warning24Filled style={{ color: '#ff8c00' }} />;
  };

  // 获取状态徽章
  const getStatusBadge = (status: boolean, trueText: string = '是', falseText: string = '否') => {
    return (
      <Badge 
        appearance={status ? 'filled' : 'outline'}
        color={status ? 'success' : 'subtle'}
      >
        {status ? trueText : falseText}
      </Badge>
    );
  };

  // 获取用户类型描述
  const getUserTypeDescription = (userType: UserType) => {
    const descriptions = {
      endUser: '普通用户 - 只看稳定版本',
      betaTester: '测试用户 - 包含测试版本',
      developer: '开发者 - 包含所有版本'
    };
    return descriptions[userType];
  };

  // 获取通道描述
  const getChannelDescription = (channel: VersionChannel) => {
    const descriptions = {
      stable: '稳定通道 - 仅正式发布版本',
      beta: '测试通道 - 包含测试版本',
      dev: '开发通道 - 包含开发版本',
      all: '全部通道 - 所有版本'
    };
    return descriptions[channel];
  };

  return (
    <div className={styles.container}>
      <Title3>智能版本检测演示</Title3>
      <Text>
        演示不同环境和用户类型下的版本检测行为差异
      </Text>

      <div className={styles.grid}>
        {/* 配置面板 */}
        <Card className={styles.card}>
          <CardHeader
            header={<Text weight="semibold">检测配置</Text>}
            description="选择用户类型来体验不同的版本检测策略"
          />
          <CardPreview>
            <div className={styles.configSection}>
              <Field label="用户类型">
                <RadioGroup
                  value={selectedUserType}
                  onChange={(_, data) => setSelectedUserType(data.value as UserType)}
                >
                  <Radio value="endUser" label="普通用户" />
                  <Radio value="betaTester" label="测试用户" />
                  <Radio value="developer" label="开发者" />
                </RadioGroup>
              </Field>

              <div>
                <Body1>当前选择:</Body1>
                <Caption1>{getUserTypeDescription(selectedUserType)}</Caption1>
              </div>

              <Button
                appearance="primary"
                icon={<Play24Regular />}
                onClick={runSmartVersionCheck}
                disabled={isLoading}
              >
                {isLoading ? '检测中...' : '开始智能检测'}
              </Button>
            </div>
          </CardPreview>
        </Card>

        {/* 环境信息 */}
        <Card className={styles.card}>
          <CardHeader
            header={<Text weight="semibold">当前环境</Text>}
            description="应用运行环境信息"
          />
          <CardPreview>
            <div className={styles.resultSection}>
              {environmentInfo ? (
                <div>
                  <div className={styles.row}>
                    <Body1>环境类型:</Body1>
                    <span className={styles.code}>{environmentInfo.type}</span>
                  </div>
                  <div className={styles.row}>
                    <Body1>开发模式:</Body1>
                    {getStatusBadge(environmentInfo.isDevelopment)}
                  </div>
                  <div className={styles.row}>
                    <Body1>生产模式:</Body1>
                    {getStatusBadge(environmentInfo.isProduction)}
                  </div>
                  <div className={styles.row}>
                    <Body1>构建模式:</Body1>
                    <span className={styles.code}>{environmentInfo.buildMode}</span>
                  </div>
                  <div className={styles.row}>
                    <Body1>版本通道:</Body1>
                    <span className={styles.code}>{environmentInfo.versionChannel}</span>
                  </div>
                  <div className={styles.row}>
                    <Body1>API地址:</Body1>
                    <span className={styles.code}>{environmentInfo.apiBaseUrl}</span>
                  </div>
                </div>
              ) : (
                <div className={styles.loading}>
                  <Spinner size="small" />
                  <Text>加载环境信息...</Text>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>

        {/* 检测结果 */}
        {(demoResult || error || isLoading) && (
          <Card className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <CardHeader
              header={<Text weight="semibold">检测结果</Text>}
              description="智能版本检测的详细结果"
            />
            <CardPreview>
              <div className={styles.resultSection}>
                {isLoading && (
                  <div className={styles.loading}>
                    <Spinner size="medium" />
                    <Text>正在进行智能版本检测...</Text>
                  </div>
                )}

                {error && (
                  <div className={styles.status}>
                    <ErrorCircle24Filled style={{ color: '#d13438' }} />
                    <Text style={{ color: '#d13438' }}>检测失败: {error}</Text>
                  </div>
                )}

                {demoResult && (
                  <div>
                    {/* 基本结果 */}
                    <div className={styles.row}>
                      <Body1>检测状态:</Body1>
                      <div className={styles.status}>
                        {getStatusIcon(true)}
                        <Text style={{ color: '#107c10' }}>检测成功</Text>
                      </div>
                    </div>
                    
                    <div className={styles.row}>
                      <Body1>当前版本:</Body1>
                      <span className={styles.code}>{demoResult.currentVersion}</span>
                    </div>

                    <div className={styles.row}>
                      <Body1>需要更新:</Body1>
                      {getStatusBadge(demoResult.hasUpdate, '需要更新', '已是最新')}
                    </div>

                    <div className={styles.row}>
                      <Body1>检测消息:</Body1>
                      <Text>{demoResult.message}</Text>
                    </div>

                    <Divider style={{ margin: '15px 0' }} />

                    {/* 配置信息 */}
                    <Title3 style={{ marginBottom: '10px' }}>检测配置</Title3>
                    <div className={styles.row}>
                      <Body1>用户类型:</Body1>
                      <span className={styles.code}>{demoResult.config.userType}</span>
                    </div>
                    <div className={styles.row}>
                      <Body1>版本通道:</Body1>
                      <span className={styles.code}>{demoResult.config.channel}</span>
                    </div>
                    <div className={styles.row}>
                      <Body1>通道描述:</Body1>
                      <Caption1>{getChannelDescription(demoResult.config.channel)}</Caption1>
                    </div>
                    <div className={styles.row}>
                      <Body1>包含预发布:</Body1>
                      {getStatusBadge(demoResult.config.includePrerelease)}
                    </div>
                    <div className={styles.row}>
                      <Body1>包含开发版:</Body1>
                      {getStatusBadge(demoResult.config.includeDevelopment)}
                    </div>
                    <div className={styles.row}>
                      <Body1>仅稳定版:</Body1>
                      {getStatusBadge(demoResult.config.onlyStable)}
                    </div>

                    {/* 最新版本信息 */}
                    {demoResult.latestVersion && (
                      <>
                        <Divider style={{ margin: '15px 0' }} />
                        <Title3 style={{ marginBottom: '10px' }}>最新版本信息</Title3>
                        <div className={styles.row}>
                          <Body1>版本号:</Body1>
                          <span className={styles.code}>{demoResult.latestVersion.version}</span>
                        </div>
                        <div className={styles.row}>
                          <Body1>版本通道:</Body1>
                          <span className={styles.code}>{demoResult.latestVersion.channel}</span>
                        </div>
                        <div className={styles.row}>
                          <Body1>版本类型:</Body1>
                          <span className={styles.code}>{demoResult.latestVersion.versionType}</span>
                        </div>
                        <div className={styles.row}>
                          <Body1>稳定版本:</Body1>
                          {getStatusBadge(demoResult.latestVersion.isStable)}
                        </div>
                        <div className={styles.row}>
                          <Body1>预发布版:</Body1>
                          {getStatusBadge(demoResult.latestVersion.isPrerelease)}
                        </div>
                        <div className={styles.row}>
                          <Body1>开发版本:</Body1>
                          {getStatusBadge(demoResult.latestVersion.isDevelopment)}
                        </div>
                        <div className={styles.row}>
                          <Body1>强制更新:</Body1>
                          {getStatusBadge(demoResult.latestVersion.forceUpdate)}
                        </div>
                        <div className={styles.row}>
                          <Body1>发布时间:</Body1>
                          <span className={styles.code}>
                            {new Date(demoResult.latestVersion.releaseDate).toLocaleString()}
                          </span>
                        </div>
                        <div className={styles.row}>
                          <Body1>下载链接:</Body1>
                          <span className={styles.code}>{demoResult.latestVersion.downloadUrl}</span>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <Body1>发布说明:</Body1>
                          <Caption1 style={{ marginTop: '5px', display: 'block' }}>
                            {demoResult.latestVersion.releaseNotes}
                          </Caption1>
                        </div>
                      </>
                    )}

                    {/* 完整结果JSON */}
                    <Divider style={{ margin: '15px 0' }} />
                    <Title3 style={{ marginBottom: '10px' }}>完整结果 (JSON)</Title3>
                    <div className={styles.json}>
                      {JSON.stringify(demoResult, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </CardPreview>
          </Card>
        )}

        {/* 使用说明 */}
        <Card className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <CardHeader
            header={<Text weight="semibold">使用说明</Text>}
            description="了解不同用户类型的版本检测策略"
          />
          <CardPreview>
            <div className={styles.resultSection}>
              <div style={{ marginBottom: '15px' }}>
                <Body1><strong>普通用户 (End User)</strong></Body1>
                <Caption1>
                  • 只显示稳定的正式发布版本<br/>
                  • 不包含预发布版本和开发版本<br/>
                  • 适合生产环境的最终用户<br/>
                  • 示例：1.0.0 → 1.0.1 (仅正式版本)
                </Caption1>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <Body1><strong>测试用户 (Beta Tester)</strong></Body1>
                <Caption1>
                  • 包含稳定版本和测试版本<br/>
                  • 可以体验新功能的预发布版本<br/>
                  • 适合参与测试的用户<br/>
                  • 示例：1.0.0 → 1.0.1-beta.1 (包含测试版)
                </Caption1>
              </div>

              <div>
                <Body1><strong>开发者 (Developer)</strong></Body1>
                <Caption1>
                  • 包含所有类型的版本<br/>
                  • 可以看到最新的开发版本<br/>
                  • 适合开发和调试环境<br/>
                  • 示例：1.0.0 → 1.0.1-dev.123 (包含开发版)
                </Caption1>
              </div>
            </div>
          </CardPreview>
        </Card>
      </div>
    </div>
  );
};

export default SmartVersionDemo;