/**
 * 退出确认对话框组件
 * 当用户不同意必要条款时显示
 */

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
} from '@fluentui/react-components';
import {
  Warning24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { exit } from '@tauri-apps/api/process';

const useStyles = makeStyles({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '8px 0',
  },
  warningSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--colorPaletteYellowBackground1)',
    borderRadius: '8px',
    border: '1px solid var(--colorPaletteYellowBorder1)',
  },
  warningIcon: {
    color: 'var(--colorPaletteYellowForeground1)',
    flexShrink: 0,
    marginTop: '2px',
  },
  warningText: {
    color: 'var(--colorPaletteYellowForeground1)',
    lineHeight: '1.4',
  },
  reasonList: {
    margin: '8px 0',
    paddingLeft: '16px',
  },
  reasonItem: {
    marginBottom: '4px',
    color: 'var(--colorNeutralForeground1)',
  },
  exitButton: {
    backgroundColor: 'var(--colorPaletteRedBackground3)',
    borderColor: 'var(--colorPaletteRedBorder2)',
    color: 'var(--colorPaletteRedForeground3)',
    '&:hover': {
      backgroundColor: 'var(--colorPaletteRedBackground2)',
      borderColor: 'var(--colorPaletteRedBorder1)',
    },
  },
});

interface ExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
  missingConsents: string[];
}

const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirmExit,
  missingConsents,
}) => {
  const styles = useStyles();

  const handleExitApp = async () => {
    try {
      // 记录用户拒绝使用的日志
      console.log('用户拒绝必要条款，退出应用:', missingConsents);
      
      // 调用 Tauri API 退出应用
      await exit(0);
    } catch (error) {
      console.error('退出应用失败:', error);
      // 如果 Tauri API 失败，使用浏览器方法
      window.close();
    }
  };

  const getConsentText = (consent: string): string => {
    switch (consent) {
      case 'userAgreement':
        return '用户服务协议';
      case 'privacyPolicy':
        return '隐私政策';
      case 'analyticsConsent':
        return '匿名数据收集';
      default:
        return consent;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogTitle>无法继续使用软件</DialogTitle>
        <DialogBody>
          <div className={styles.dialogContent}>
            <div className={styles.warningSection}>
              <Warning24Regular className={styles.warningIcon} />
              <div>
                <Text weight="semibold" className={styles.warningText}>
                  您尚未同意以下必要条款：
                </Text>
                <ul className={styles.reasonList}>
                  {missingConsents.map((consent, index) => (
                    <li key={index} className={styles.reasonItem}>
                      <Text size={300}>{getConsentText(consent)}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Text>
              玩机管家需要您同意所有必要条款才能正常运行。这些条款确保：
            </Text>

            <ul className={styles.reasonList}>
              <li className={styles.reasonItem}>
                <Text size={300}>
                  <strong>软件稳定性：</strong>匿名数据收集帮助我们及时发现和修复问题
                </Text>
              </li>
              <li className={styles.reasonItem}>
                <Text size={300}>
                  <strong>服务质量：</strong>使用统计帮助我们优化功能和性能
                </Text>
              </li>
              <li className={styles.reasonItem}>
                <Text size={300}>
                  <strong>法律合规：</strong>用户协议和隐私政策保护双方权益
                </Text>
              </li>
            </ul>

            <Text size={300} style={{ color: 'var(--colorNeutralForeground2)' }}>
              如果您不同意这些条款，软件将无法为您提供服务。您可以选择退出应用或返回重新考虑。
            </Text>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            appearance="secondary"
            onClick={() => onOpenChange(false)}
          >
            返回重新考虑
          </Button>
          <Button
            appearance="primary"
            className={styles.exitButton}
            icon={<Dismiss24Regular />}
            onClick={handleExitApp}
          >
            退出应用
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default ExitConfirmDialog;
