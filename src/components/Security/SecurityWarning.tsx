import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Shield24Regular, Warning24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  warningDialog: {
    minWidth: '400px',
  },
  warningContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalM,
  },
  warningIcon: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '48px',
  },
  warningTitle: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  warningText: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  fullScreenWarning: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  fullScreenContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: tokens.spacingVerticalXL,
    padding: tokens.spacingHorizontalXXL,
    maxWidth: '600px',
  },
  shieldIcon: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '72px',
  },
  fullScreenTitle: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    margin: 0,
  },
  fullScreenText: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    margin: 0,
  },
  instructionsList: {
    textAlign: 'left',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
  },
});

interface SecurityWarningProps {
  isOpen: boolean;
  onClose?: () => void;
  fullScreen?: boolean;
  title?: string;
  message?: string;
}

export const SecurityWarning: React.FC<SecurityWarningProps> = ({
  isOpen,
  onClose,
  fullScreen = false,
  title = '安全警告',
  message = '检测到开发者工具已打开，为保护应用安全，页面访问受限。'
}) => {
  const styles = useStyles();

  const handleRefresh = () => {
    window.location.reload();
  };

  if (fullScreen && isOpen) {
    return (
      <div className={styles.fullScreenWarning}>
        <div className={styles.fullScreenContent}>
          <Shield24Regular className={styles.shieldIcon} />
          <h1 className={styles.fullScreenTitle}>访问受限</h1>
          <p className={styles.fullScreenText}>
            检测到开发者工具已打开，为保护应用安全，页面访问受限。
          </p>
          <div className={styles.instructionsList}>
            <p><strong>请按照以下步骤恢复访问：</strong></p>
            <ol>
              <li>关闭开发者工具（按 F12 或 Ctrl+Shift+I）</li>
              <li>确保没有其他调试工具在运行</li>
              <li>点击下方按钮刷新页面</li>
            </ol>
          </div>
          <Button 
            appearance="primary" 
            size="large"
            onClick={handleRefresh}
          >
            刷新页面
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen}>
      <DialogSurface className={styles.warningDialog}>
        <DialogBody>
          <DialogTitle>
            <div className={styles.warningContent}>
              <Warning24Regular className={styles.warningIcon} />
              <span className={styles.warningTitle}>{title}</span>
            </div>
          </DialogTitle>
          <div className={styles.warningContent}>
            <p className={styles.warningText}>{message}</p>
            <p className={styles.warningText}>
              请关闭开发者工具后继续使用应用。
            </p>
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="primary" onClick={handleRefresh}>
            刷新页面
          </Button>
          {onClose && (
            <Button appearance="secondary" onClick={onClose}>
              关闭
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
