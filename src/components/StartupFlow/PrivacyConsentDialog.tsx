/**
 * 隐私政策同意页面组件
 * 用于显示隐私政策和用户协议，要求用户同意
 */

import React, { useState }  from 'react';
import { admtLogo512 } from '../../assets/icons';
import {
  Button,
  Checkbox,
  Text,
  makeStyles,
  tokens,
  Card,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { 
  Shield24Regular, 
  Document24Regular, 
  Warning24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  DocumentBulletList24Regular,
  ChevronRight24Regular,
} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';

const useStyles = makeStyles({
    container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  leftPanel: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalXXL,
    boxSizing: 'border-box',
  },
  rightPanel: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalXXL,
    boxSizing: 'border-box',
  },
  appIconContainer: {
    width: "256px",
    height: "256px",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacingVerticalXL,
  },
  appIconImage: {
    width: "400px",
    height: "400px",
    borderRadius: "16px",
    objectFit: 'contain',
  },
  appTitle: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  card: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "16px",
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    boxShadow: tokens.shadow16,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    maxWidth: '500px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  policyButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    width: '100%',
    marginBottom: tokens.spacingVerticalM,
    transition: 'border-color 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  policyButtonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    maxHeight: "30px",
  },
  policyButtonIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  policyButtonText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  policyButtonTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
  },
  policyButtonDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXS,
  },
  policyButtonArrow: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  checkboxSection: {
    marginTop: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalXL,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXL,
  },
  dialogContent: {
    maxHeight: '60vh',
    overflowY: 'auto',
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    textAlign: 'left',
    '& p': {
      marginBottom: tokens.spacingVerticalM,
      marginTop: 0,
    },
    '& ul, & ol': {
      paddingLeft: tokens.spacingHorizontalL,
      marginBottom: tokens.spacingVerticalM,
    },
    '& li': {
      marginBottom: tokens.spacingVerticalXS,
      lineHeight: '1.6',
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: tokens.spacingVerticalL,
      marginBottom: tokens.spacingVerticalM,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorBrandForeground1,
    },
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground1,
  },
  infoBanner: {
    marginBottom: tokens.spacingVerticalL,
  },
});

interface PrivacyConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const PrivacyConsentDialog: React.FC<PrivacyConsentDialogProps> = ({
  open,
  onAccept,
  onReject,
}) => {
  const styles = useStyles();
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const {
    acceptPrivacyPolicy,
    acceptUserAgreement,
    acceptDataCollection,
    completePrivacySetup,
    setShouldExitApp,
  } = usePrivacyConsentStore();

  const handleAccept = () => {
    if (!acceptedAll) {
      setShowExitConfirm(true);
      return;
    }

    // 更新状态
    acceptPrivacyPolicy();
    acceptUserAgreement();
    acceptDataCollection();
    completePrivacySetup();
    onAccept();
  };

  const handleReject = async () => {
    setShouldExitApp(true);
    onReject();

    // 尝试退出应用
    try {
      const { exit } = await import('@tauri-apps/plugin-process');
      await exit(0);
    } catch (_error) {
      // 如果 Tauri API 失败，尝试其他方法
      if (window.close) {
        window.close();
      }
    }
  };

  const policies = [
    {
      id: 'privacy',
      title: '隐私政策',
      description: '我们如何收集、使用和保护您的个人信息',
      icon: <Shield24Regular />
    },
    {
      id: 'agreement',
      title: '用户协议',
      description: '使用本软件的服务条款和条件',
      icon: <Document24Regular />
    },
    {
      id: 'data',
      title: '数据收集说明',
      description: '详细说明我们需要收集的数据类型',
      icon: <DocumentBulletList24Regular />
    }
  ];


  const handlePolicyClick = (policyId: string) => {
    const policyUrls = {
      'agreement': 'https://admt.lacs.cc/agreement#user',
      'privacy': 'https://admt.lacs.cc/agreement#privacy', 
      'data': 'https://admt.lacs.cc/agreement#collection'
    };
    
    const url = policyUrls[policyId as keyof typeof policyUrls];
    if (url) {
      try {
        // 使用 Tauri 的 shell 插件打开外部浏览器
        import('@tauri-apps/plugin-shell').then(({ open }) => {
          open(url);
        }).catch(() => {
          // 如果 Tauri 不可用，使用 window.open
          window.open(url, '_blank');
        });
      } catch (_error) {
        // 最后的备选方案
        window.open(url, '_blank');
      }
    }
  };

  return (
    <>
      {open && (
        <div className={styles.container}>
          <div className={styles.leftPanel}>
            <div className={styles.appIconContainer}>
              <img src={admtLogo512} alt="appIcon" className={styles.appIconImage}/>
            </div>
          </div>

          <div className={styles.rightPanel}>
            <div style={{
              animation: 'fadeInUp 0.3s ease-out forwards',
              opacity: 0,
              transform: 'translateY(20px)',
              width: '100%',
            }}>
              <Card className={styles.card}>

                <div className={styles.content}>
                  <div className={styles.header}>
                    <Text className={styles.title}>欢迎使用玩机管家，请同意以下条款以继续使用</Text>
                  </div>

                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalM, justifyContent: 'center' }}>
                    {policies.map((policy) => (
                      <Button
                        key={policy.id}
                        className={styles.policyButton}
                        appearance="subtle"
                        onClick={() => handlePolicyClick(policy.id)}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <div className={styles.policyButtonContent}>
                          <div className={styles.policyButtonIcon}>{policy.icon}</div>
                          <div className={styles.policyButtonText}>
                            <div className={styles.policyButtonTitle}>{policy.title}</div>
                          </div>
                        </div>
                        <ChevronRight24Regular className={styles.policyButtonArrow} />
                      </Button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacingVerticalL }}>
                    <div style={{ flex: 1 }}>
                      <Checkbox
                        checked={acceptedAll}
                        onChange={(_, data) => setAcceptedAll(data.checked === true)}
                        label="我已阅读并同意以上所有条款"
                        size="large"
                        required
                      />
                    </div>
                    <div className={styles.actions} style={{ margin: 0 }}>
                      <Button
                        appearance="secondary"
                        icon={<Dismiss24Regular />}
                        onClick={() => setShowExitConfirm(true)}
                        size="large"
                        style={{ marginRight: tokens.spacingHorizontalS }}
                      >
                        不同意
                      </Button>
                      <Button
                        appearance="primary"
                        onClick={handleAccept}
                        disabled={!acceptedAll}
                        size="large"
                        icon={<CheckmarkCircle24Regular />}
                      >
                        同意
                      </Button>
                    </div>
                  </div>

                  <Text className={styles.policyButtonDesc}>
                    © 2020-2025 领创工作室. 保留所有权利。 
                  </Text>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}



      {/* 退出确认对话框 */}
      <Dialog open={showExitConfirm} modalType="modal">
        <DialogSurface style={{
          animation: 'fadeIn 0.2s ease-out forwards'
        }}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogHeader}>
                <Warning24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                确认退出
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>
                您选择不同意必需的条款。这意味着软件无法正常运行，将会退出应用。
              </Text>
              <Text>
                如果您改变主意，可以点击"返回"重新考虑。
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowExitConfirm(false)}
                icon={<ArrowLeft24Regular />}
              >
                返回重新考虑
              </Button>
              <Button
                appearance="primary"
                onClick={handleReject}
                icon={<Dismiss24Regular />}
              >
                确认退出应用
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

// 添加全局动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export default PrivacyConsentDialog;
