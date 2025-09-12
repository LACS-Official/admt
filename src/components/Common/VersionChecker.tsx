import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTrigger, 
  DialogSurface, 
  DialogTitle, 
  DialogBody, 
  DialogActions, 
  Button, 
  Text, 
  MessageBar, 
  Spinner,
  makeStyles
} from '@fluentui/react-components';
import { checkForUpdates, versionService, VersionCheckResult } from '../../services/versionServiceAdapter';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: 'var(--colorNeutralBackground2)',
    borderRadius: '8px',
  },
  versionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  releaseNotes: {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '12px',
    backgroundColor: 'var(--colorNeutralBackground1)',
    borderRadius: '6px',
    border: '1px solid var(--colorNeutralStroke2)',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: '16px',
  }
});

interface VersionCheckerProps {
  onUpdateAvailable?: (versionInfo: VersionCheckResult) => void;
  onCheckComplete?: (result: VersionCheckResult) => void;
  autoCheck?: boolean;
  showDialog?: boolean;
}

export const VersionChecker: React.FC<VersionCheckerProps> = ({
  onUpdateAvailable,
  onCheckComplete,
  autoCheck = true,
  showDialog = true
}) => {
  const styles = useStyles();
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<VersionCheckResult | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      console.log('🔍 开始检查版本更新...');
      const result = await versionService.checkForUpdates();
      
      console.log('📋 版本检查结果:', result);
      setCheckResult(result);
      
      // 调用回调
      onCheckComplete?.(result);
      
      if (result.needsUpdate && !result.error) {
        console.log('🆕 发现新版本:', result.latestVersion);
        onUpdateAvailable?.(result);
        
        if (showDialog) {
          setShowUpdateDialog(true);
        }
      } else if (result.error) {
        console.error('❌ 版本检查失败:', result.error);
      } else {
        console.log('✅ 当前已是最新版本');
      }
    } catch (error) {
      console.error('版本检查异常:', error);
      const errorResult: VersionCheckResult = {
        hasUpdate: false,
        needsUpdate: false,
        isForceUpdate: false,
        currentVersion: '未知',
        localVersion: '未知',
        error: error instanceof Error ? error.message : '检查失败',
        message: '版本检查异常'
      };
      setCheckResult(errorResult);
      onCheckComplete?.(errorResult);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (autoCheck) {
      // 延迟一点时间再检查，避免阻塞启动
      const timer = setTimeout(checkForUpdates, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoCheck]);

  const handleDownload = () => {
    if (checkResult?.versionInfo?.downloadUrl) {
      window.open(checkResult.versionInfo.downloadUrl, '_blank');
    }
    setShowUpdateDialog(false);
  };

  const handleSkip = () => {
    setShowUpdateDialog(false);
  };

  const renderCheckingState = () => (
    <div className={styles.loadingContainer}>
      <Spinner size="small" />
      <Text>正在检查版本更新...</Text>
    </div>
  );

  const renderErrorState = () => (
    <div className={styles.errorContainer}>
      <MessageBar intent="warning">
        版本检查失败: {checkResult?.error}
      </MessageBar>
    </div>
  );

  const renderUpdateDialog = () => {
    if (!checkResult?.versionInfo) return null;

    return (
      <Dialog open={showUpdateDialog} onOpenChange={(_, data) => setShowUpdateDialog(data.open)}>
        <DialogSurface>
          <DialogTitle>发现新版本</DialogTitle>
          <DialogBody>
            <div className={styles.dialogContent}>
              <div className={styles.versionInfo}>
                <div className={styles.versionRow}>
                  <Text weight="semibold">当前版本:</Text>
                  <Text>{checkResult.currentVersion}</Text>
                </div>
                <div className={styles.versionRow}>
                  <Text weight="semibold">最新版本:</Text>
                  <Text color="brand">{checkResult.latestVersion}</Text>
                </div>
                <div className={styles.versionRow}>
                  <Text weight="semibold">发布时间:</Text>
                  <Text>{new Date(checkResult.versionInfo.publishedAt).toLocaleDateString('zh-CN')}</Text>
                </div>
              </div>

              {checkResult.versionInfo.releaseNotes && (
                <div>
                  <Text weight="semibold">更新说明:</Text>
                  <div className={styles.releaseNotes}>
                    <Text size={300}>{checkResult.versionInfo.releaseNotes}</Text>
                  </div>
                </div>
              )}

              {checkResult.isForceUpdate && (
                <MessageBar intent="warning">
                  这是一个强制更新，建议立即下载安装。
                </MessageBar>
              )}
            </div>
          </DialogBody>
          <DialogActions>
            <Button appearance="primary" onClick={handleDownload}>
              立即下载
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    );
  };

  // 如果不显示对话框，只返回检查逻辑
  if (!showDialog) {
    return null;
  }

  return (
    <>
      {isChecking && renderCheckingState()}
      {checkResult?.error && renderErrorState()}
      {renderUpdateDialog()}
    </>
  );
};

export default VersionChecker;