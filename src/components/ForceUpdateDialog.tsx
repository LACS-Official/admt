import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { openDownloadLink } from '../services/versionService';

const useStyles = makeStyles({
  dialog: {
    maxWidth: '500px',
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  content: {
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalL,
  },
  versionInfo: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  actions: {
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalM,
  },
});

interface ForceUpdateDialogProps {
  isOpen: boolean;
  currentVersion: string;
  localVersion: string;
  downloadUrl: string;
  updateLog?: string;
}

export const ForceUpdateDialog: React.FC<ForceUpdateDialogProps> = ({
  isOpen,
  currentVersion,
  localVersion,
  downloadUrl,
  updateLog,
}) => {
  const styles = useStyles();

  const handleDownload = async () => {
    try {
      // 固定使用默认下载页面，不使用传入的downloadUrl
      await openDownloadLink('https://admt.lacs.cc/download');
    } catch (error) {
      console.error('Failed to open download link:', error);
    }
  };

  return (
    <Dialog open={isOpen} modalType="modal">
      <DialogSurface className={styles.dialog}>
        <DialogTitle className={styles.title}>
          🚀 发现新版本
        </DialogTitle>
        <DialogBody>
          <div className={styles.content}>
            <Text>
              检测到应用有新版本可用，为了获得最佳体验和最新功能，请立即更新。
            </Text>
          </div>
          
          <div className={styles.versionInfo}>
            <div>当前版本: {localVersion}</div>
            <div>最新版本: {currentVersion}</div>
          </div>
          
          <div className={styles.content}>
            <Text>
              📋 请在下载页面查看相关内容
            </Text>
          </div>
          
          <div className={styles.content}>
            <Text>
              💡 点击下载按钮将在默认浏览器中打开下载页面
            </Text>
          </div>
        </DialogBody>
        <DialogActions className={styles.actions}>
          <Button 
            appearance="primary" 
            onClick={handleDownload}
            size="large"
          >
            打开下载页面
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};