/**
 * 隐私政策同意页面组件
 * 用于显示隐私政策和用户协议，要求用户同意
 */

import React, { useState }  from 'react';
import {
  Button,
  Checkbox,
  Text,
  makeStyles,
  tokens,
  Divider,
  MessageBar,
  Card,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import { 
  Shield24Regular, 
  Document24Regular, 
  Warning24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  DocumentBulletList24Regular,
  ArrowLeft24Regular,
  ChevronRight24Regular} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalM,
  },
  card: {
    width: '100%',
    maxWidth: '800px',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    borderRadius: '8px',
    boxShadow: tokens.shadow16,
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: tokens.shadow28,
    },
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalMNudge}`,
    textAlign: 'center',
    width: '100%',
    marginBottom: tokens.spacingVerticalXXL,
    backgroundColor: tokens.colorBrandBackground,
    border: `1px solid ${tokens.colorBrandStroke1}`,
    borderRadius: '8px',
  },
  iconContainer: {
    marginBottom: tokens.spacingVerticalM,
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: '50%',
    padding: tokens.spacingVerticalS,
    color: tokens.colorNeutralForegroundInverted,
  },
  title: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalS,
    color: tokens.colorBrandForeground2,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalS,
    fontWeight: tokens.fontWeightRegular,
    maxWidth: '600px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground1,
  },
  buttonGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  policyButton: {
    flex: 1,
    minWidth: '200px',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    borderRadius: '8px',
    textAlign: 'left',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground,
      border: `1px solid ${tokens.colorBrandStroke1}`,
      transform: 'translateY(-2px)',
    },
    transition: 'all 0.2s ease',
  },
  policyButtonIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
  },
  policyButtonText: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  policyButtonDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  policyButtonArrow: {
    alignSelf: 'flex-end',
    color: tokens.colorBrandForeground1,
  },
  checkboxSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  requiredCheckbox: {
    '& .fui-Checkbox__indicator': {
      border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    },
  },
  warningMessage: {
    marginTop: tokens.spacingVerticalM,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXXL,
    flexWrap: 'wrap',
  },
  exitButton: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
    '&:active': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  acceptButton: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundInverted,
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
    '&:active': {
      backgroundColor: tokens.colorBrandBackgroundPressed,
    },
    '&:disabled': {
      backgroundColor: tokens.colorNeutralBackgroundDisabled,
      color: tokens.colorNeutralForegroundDisabled,
      cursor: 'not-allowed',
    }
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
    padding: `${tokens.spacingVerticalS} 0`,
    color: tokens.colorBrandForeground1,
  },
  infoBanner: {
    backgroundColor: tokens.colorBrandBackground,
    borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
    padding: tokens.spacingVerticalM,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
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
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'agreement' | 'data' | null>(null);

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
    } catch (error) {
      console.error('退出应用失败:', error);
      // 如果 Tauri API 失败，尝试其他方法
      if (window.close) {
        window.close();
      }
    }
  };

  const privacyPolicyContent = `我们非常重视您的隐私权。本隐私政策说明了我们如何收集、使用和保护您的个人信息。

1. 信息收集

我们可能收集以下类型的信息：
• 设备信息：硬件配置、设备标识符
• 使用数据：应用使用统计、功能使用频率、错误日志
• 匿名分析数据：用于改进产品性能和用户体验

2. 信息使用

我们使用收集的信息用于：
• 提供和改进我们的服务
• 分析产品使用情况
• 修复错误和提升性能
• 提供技术支持

3. 信息保护

我们采用行业标准的安全措施保护您的信息：
• 数据加密传输和存储
• 访问控制和权限管理
• 定期安全审计

4. 信息共享

我们不会向第三方出售、交易或转让您的个人信息，除非：
• 获得您的明确同意
• 法律要求或政府部门要求
• 保护我们的权利和安全

5. 您的权利

您有权：
• 查看我们收集的关于您的信息
• 要求更正不准确的信息
• 要求删除您的个人信息
• 撤销对数据处理的同意`;

  const userAgreementContent = `欢迎使用我们的软件。使用本软件即表示您同意以下条款：

1. 软件许可

本软件按"现状"提供，我们授予您有限的、非独占的、不可转让的使用许可。

2. 使用限制

您不得：
• 逆向工程、反编译或反汇编软件
• 移除或修改任何版权声明
• 将软件用于非法目的
• 干扰软件的正常运行

3. 知识产权

软件及其所有相关知识产权均归我们所有。

4. 免责声明

在法律允许的最大范围内，我们不对因使用软件而产生的任何损失承担责任。

5. 服务变更

我们保留随时修改或终止服务的权利，恕不另行通知。

6. 争议解决

因本协议产生的争议应通过友好协商解决，协商不成的，提交有管辖权的法院解决。`;

  const dataCollectionContent = `为了提供更好的服务和用户体验，我们需要收集以下数据：

1. 设备数据

• 设备唯一标识符（匿名化处理）

2. 使用行为数据

• 应用启动（匿名化处理）

3. 数据处理原则

• 所有数据都经过匿名化处理
• 不收集任何可识别个人身份的信息
• 数据仅用于产品改进和技术支持
• 严格遵循最小化原则，只收集必要数据

4. 数据安全

• 采用加密传输和存储
• 定期删除过期数据
• 严格的访问控制

⚠️ 重要提示：
这些数据收集对于软件的正常运行是必需的。如果您不同意，软件将无法正常工作。`;

  const policies = [
    {
      id: 'privacy',
      title: '隐私政策',
      description: '我们如何收集、使用和保护您的个人信息',
      icon: <Shield24Regular />,
      content: privacyPolicyContent
    },
    {
      id: 'agreement',
      title: '用户协议',
      description: '使用本软件的服务条款和条件',
      icon: <Document24Regular />,
      content: userAgreementContent
    },
    {
      id: 'data',
      title: '数据收集说明',
      description: '详细说明我们需要收集的数据类型',
      icon: <DocumentBulletList24Regular />,
      content: dataCollectionContent
    }
  ];

  const getPolicyTitle = () => {
    const policy = policies.find(p => p.id === activePolicy);
    return policy ? policy.title : '';
  };

  const getPolicyContent = () => {
    const policy = policies.find(p => p.id === activePolicy);
    return policy ? policy.content : '';
  };

  const getPolicyIcon = () => {
    const policy = policies.find(p => p.id === activePolicy);
    return policy ? policy.icon : null;
  };

  return (
    <>
      {open && (
        <div className={styles.container}>
          {/* 添加淡入和上移动画效果 */}
          <div style={{
            animation: 'fadeInUp 0.3s ease-out forwards',
            opacity: 0,
            transform: 'translateY(20px)'
          }}>
            <Card className={styles.card}>
              <div className={styles.header}>
                <div className={styles.title}>玩机管家隐私和协议</div>
                <div className={styles.subtitle}>请仔细阅读并同意以下所有条款以继续使用应用</div>
              </div>

              <div className={styles.content}>
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>
                    <Document24Regular />
                    相关政策和协议
                  </div>
                  
                  <div className={styles.buttonGroup}>
                    {policies.map((policy) => (
                      <div 
                        key={policy.id}
                        style={{ transition: 'transform 0.2s ease' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        }}
                      >
                        <Button 
                          className={styles.policyButton}
                          appearance="subtle" 
                          onClick={() => setActivePolicy(policy.id as any)}
                          style={{ width: '100%' }}
                        >
                          <div className={styles.policyButtonIcon}>{policy.icon}</div>
                          <div>
                            <div className={styles.policyButtonText}>{policy.title}</div>
                            <div className={styles.policyButtonDesc}>{policy.description}</div>
                          </div>
                          <ChevronRight24Regular className={styles.policyButtonArrow} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                <div className={styles.section}>
                  <div className={styles.checkboxSection}>
                    <Checkbox
                      checked={acceptedAll}
                      onChange={(_, data) => setAcceptedAll(data.checked === true)}
                      label="我已阅读并同意以上所有协议和政策"
                      className={!acceptedAll ? styles.requiredCheckbox : undefined}
                      size="large"
                    />
                  </div>

                  {!acceptedAll && (
                    <MessageBar intent="warning" className={styles.warningMessage}>
                      <Warning24Regular />
                      请注意：必须同意所有协议和政策才能继续使用本软件。
                    </MessageBar>
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  appearance="secondary"
                  icon={<Dismiss24Regular />}
                  onClick={() => setShowExitConfirm(true)}
                  className={styles.exitButton}
                  size="large"
                >
                  不同意，退出应用
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleAccept}
                  disabled={!acceptedAll}
                  className={styles.acceptButton}
                  size="large"
                  icon={<CheckmarkCircle24Regular />}
                >
                  同意并继续
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 协议内容弹窗 */}
      <Dialog 
        open={!!activePolicy} 
        onOpenChange={(_, data) => !data.open && setActivePolicy(null)}
        modalType="modal"
      >
        <DialogSurface style={{
          animation: 'fadeIn 0.2s ease-out forwards'
        }}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogHeader}>
                {getPolicyIcon()}
                {getPolicyTitle()}
              </div>
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <div 
                style={{ 
                  whiteSpace: 'pre-line', 
                  lineHeight: '1.8',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                {getPolicyContent()}
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={() => setActivePolicy(null)}
                icon={<ArrowLeft24Regular />}
              >
                返回
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

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
                className={styles.exitButton}
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
