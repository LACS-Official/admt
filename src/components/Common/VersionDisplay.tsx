import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Card,
  CardHeader,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Spinner,
  MessageBar,
  Badge,
} from '@fluentui/react-components';
import {
  Info24Regular,
  ArrowSync24Regular,
  Checkmark24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { versionManager, useVersionInfo, useVersionCheck } from '../../utils/versionManager';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  versionCard: {
    minWidth: '300px',
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
  },
  versionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--colorNeutralStroke2)',
  },
  versionLabel: {
    fontWeight: '500',
    color: 'var(--colorNeutralForeground2)',
  },
  versionValue: {
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginTop: '16px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: '400px',
  },
  statusBadge: {
    marginLeft: '8px',
  },
  environmentBadge: {
    fontSize: '12px',
  },
});

interface VersionDisplayProps {
  showCard?: boolean;
  showUpdateCheck?: boolean;
  compact?: boolean;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({
  showCard = true,
  showUpdateCheck = true,
  compact = false,
}) => {
  const styles = useStyles();
  const { versionInfo, loading, error } = useVersionInfo();
  const { checkResult, checking, checkForUpdates } = useVersionCheck();
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [versionDetails, setVersionDetails] = useState<any>(null);

  // 加载版本详细信息
  useEffect(() => {
    const loadDetails = async () => {
      try {
        const details = await versionManager.getVersionDetails();
        setVersionDetails(details);
      } catch (error) {
        console.error('加载版本详细信息失败:', error);
      }
    };

    if (versionInfo) {
      loadDetails();
    }
  }, [versionInfo]);

  const handleShowDetails = () => {
    setShowDetailsDialog(true);
  };

  const handleCheckUpdate = async () => {
    await checkForUpdates();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="small" />
        <Text>加载版本信息...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <MessageBar intent="warning">
        版本信息加载失败: {error}
      </MessageBar>
    );
  }

  const renderCompactVersion = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Text size={200} className={styles.versionValue}>
        v{versionInfo?.version || '1.0.0'}
      </Text>
      {versionInfo?.environment === 'development' && (
        <Badge appearance="outline" color="warning" className={styles.environmentBadge}>
          开发版
        </Badge>
      )}
      {showUpdateCheck && (
        <Button
          appearance="subtle"
          size="small"
          icon={<ArrowSync24Regular />}
          onClick={handleCheckUpdate}
          disabled={checking}
        >
          {checking ? '检查中...' : '检查更新'}
        </Button>
      )}
    </div>
  );

  const renderFullVersion = () => (
    <Card className={styles.versionCard}>
      <CardHeader
        image={<Info24Regular />}
        header={<Text weight="semibold">版本信息</Text>}
        action={
          versionInfo?.environment === 'development' ? (
            <Badge appearance="outline" color="warning">开发版</Badge>
          ) : (
            <Badge appearance="outline" color="success">正式版</Badge>
          )
        }
      />
      
      <div className={styles.versionInfo}>
        <div className={styles.versionRow}>
          <Text className={styles.versionLabel}>当前版本:</Text>
          <Text className={styles.versionValue}>v{versionInfo?.version || '1.0.0'}</Text>
        </div>
        
        <div className={styles.versionRow}>
          <Text className={styles.versionLabel}>构建号:</Text>
          <Text className={styles.versionValue}>#{versionInfo?.buildNumber || 1}</Text>
        </div>
        
        <div className={styles.versionRow}>
          <Text className={styles.versionLabel}>发布日期:</Text>
          <Text className={styles.versionValue}>{versionInfo?.releaseDate || '2025-01-11'}</Text>
        </div>

        {checkResult && (
          <div className={styles.versionRow}>
            <Text className={styles.versionLabel}>更新状态:</Text>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {checkResult.hasUpdate ? (
                <>
                  <Warning24Regular color="orange" />
                  <Text className={styles.statusBadge} color="warning">有新版本</Text>
                </>
              ) : (
                <>
                  <Checkmark24Regular color="green" />
                  <Text className={styles.statusBadge} color="success">已是最新</Text>
                </>
              )}
            </div>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <Button
            appearance="secondary"
            size="small"
            icon={<Info24Regular />}
            onClick={handleShowDetails}
          >
            详细信息
          </Button>
          
          {showUpdateCheck && (
            <Button
              appearance="primary"
              size="small"
              icon={<ArrowSync24Regular />}
              onClick={handleCheckUpdate}
              disabled={checking}
            >
              {checking ? '检查中...' : '检查更新'}
            </Button>
          )}
        </div>

        {checkResult?.error && (
          <MessageBar intent="warning" style={{ marginTop: '12px' }}>
            {checkResult.error}
          </MessageBar>
        )}
      </div>
    </Card>
  );

  return (
    <div className={styles.container}>
      {compact ? renderCompactVersion() : (showCard ? renderFullVersion() : renderCompactVersion())}
      
      {/* 详细信息对话框 */}
      <Dialog open={showDetailsDialog} onOpenChange={(_, data) => setShowDetailsDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>版本详细信息</DialogTitle>
          <DialogBody>
            <DialogContent>
              <div className={styles.dialogContent}>
                {versionDetails && (
                  <>
                    <div className={styles.versionRow}>
                      <Text className={styles.versionLabel}>版本号:</Text>
                      <Text className={styles.versionValue}>{versionDetails.version}</Text>
                    </div>
                    
                    <div className={styles.versionRow}>
                      <Text className={styles.versionLabel}>构建号:</Text>
                      <Text className={styles.versionValue}>#{versionDetails.buildNumber}</Text>
                    </div>
                    
                    <div className={styles.versionRow}>
                      <Text className={styles.versionLabel}>发布日期:</Text>
                      <Text className={styles.versionValue}>{versionDetails.releaseDate}</Text>
                    </div>
                    
                    {versionDetails.buildDate && (
                      <div className={styles.versionRow}>
                        <Text className={styles.versionLabel}>构建日期:</Text>
                        <Text className={styles.versionValue}>{versionDetails.buildDate}</Text>
                      </div>
                    )}
                    
                    <div className={styles.versionRow}>
                      <Text className={styles.versionLabel}>环境:</Text>
                      <Text className={styles.versionValue}>{versionDetails.environment}</Text>
                    </div>
                    
                    {versionDetails.commitHash && (
                      <div className={styles.versionRow}>
                        <Text className={styles.versionLabel}>提交哈希:</Text>
                        <Text className={styles.versionValue}>{versionDetails.commitHash}</Text>
                      </div>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowDetailsDialog(false)}>
                关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default VersionDisplay;