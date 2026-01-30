/**
 * 隐私政策同意页面组件
 * 用于显示隐私政策和用户协议，要求用户同意
 */

import React, { useState } from 'react';
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
  Link,
  Divider,
  Select,
  Switch,
  Label,
} from '@fluentui/react-components';
import { 
  ArrowLeft24Regular,
  Shield24Regular, 
  Document24Regular, 
  Warning24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  DocumentBulletList24Regular,
  ChevronRight24Regular,
  Open24Regular,
  Globe24Regular,
  Play24Regular,
  ArrowMinimize24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { usePrivacyConsentStore } from '../../stores/privacyConsentStore';
import { useAppStore } from '../../stores/appStore';
import { systemTrayManager } from '../../services/systemTrayManager';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorNeutralBackground1} 50%, ${tokens.colorBrandBackground2} 100%)`,
    backgroundSize: '400% 400%',
    animation: 'gradientBG 15s ease infinite',
    position: 'relative',
    overflow: 'hidden',
  },
  glassCard: {
    width: '900px',
    maxWidth: '90%',
    maxHeight: '85vh',
    display: 'flex', 
    flexDirection: 'row',
    borderRadius: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    border: `1px solid rgba(255, 255, 255, 0.5)`,
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    overflow: 'hidden',
    
    // Dark mode support
    '@media (prefers-color-scheme: dark)': {
      backgroundColor: 'rgba(30, 30, 30, 0.7)',
      border: `1px solid rgba(255, 255, 255, 0.1)`,
    }
  },
  leftPanel: {
    width: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalXL,
    borderRight: `1px solid rgba(0, 0, 0, 0.05)`,
    position: 'relative',
    
    '@media (prefers-color-scheme: dark)': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRight: `1px solid rgba(255, 255, 255, 0.05)`,
    }
  },
  rightPanel: {
    flex: 1,
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  appIconImage: {
    width: "128px",
    height: "128px",
    borderRadius: "24px",
    boxShadow: tokens.shadow8,
    marginBottom: tokens.spacingVerticalL,
  },
  welcomeTitle: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
    textAlign: 'left',
  },
  welcomeSubtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalXL,
    lineHeight: '1.5',
  },
  policyList: {
    display: 'flex',
    flexDirection: 'row',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXL,
  },
  policyItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid transparent`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    flex: 1,
    
    ':hover': {
        border: `1px solid ${tokens.colorBrandStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2Hover,
        transform: 'translateY(-2px)',
        boxShadow: tokens.shadow4,
    }
  },
  policyIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    backgroundColor: tokens.colorBrandBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorBrandForeground1,
  },
  policyInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  policyTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: tokens.spacingVerticalL,
  },
  checkboxWrapper: {
    marginBottom: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    
    '@media (prefers-color-scheme: dark)': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    }
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground1,
  },
  versionTag: {
    marginTop: tokens.spacingVerticalL,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
    textAlign: 'center',
  },
  quickSettings: {
    marginTop: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
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
  const { t, i18n } = useTranslation();
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { config, updateConfig } = useAppStore();

  const {
    acceptPrivacyPolicy,
    acceptUserAgreement,
    acceptDataCollection,
    completePrivacySetup,
    setShouldExitApp,
  } = usePrivacyConsentStore();

  const handleAccept = () => {
    if (!acceptedAll) {
      // Shake animation trigger could go here
      return;
    }

    acceptPrivacyPolicy();
    acceptUserAgreement();
    acceptDataCollection();
    completePrivacySetup();
    onAccept();
  };

  const handleReject = async () => {
    setShouldExitApp(true);
    onReject();

    try {
      const { exit } = await import('@tauri-apps/plugin-process');
      await exit(0);
    } catch (_error) {
      if (window.close) {
        window.close();
      }
    }
  };

  const policies = [
    {
      id: 'privacy',
      title: t('legal.privacy_policy'),
      description: t('legal.privacy_desc'),
      icon: <Shield24Regular />,
      url: 'https://admt.lacs.cc/agreement#privacy'
    },
    {
      id: 'agreement',
      title: t('legal.user_agreement'),
      description: t('legal.agreement_desc'),
      icon: <Document24Regular />,
      url: 'https://admt.lacs.cc/agreement#user'
    },
    {
      id: 'data',
      title: t('legal.data_collection'),
      description: t('legal.data_desc'),
      icon: <DocumentBulletList24Regular />,
      url: 'https://admt.lacs.cc/agreement#collection'
    }
  ];

  const handlePolicyClick = (url: string) => {
    try {
      import('@tauri-apps/plugin-shell').then(({ open }) => {
        open(url);
      }).catch(() => {
        window.open(url, '_blank');
      });
    } catch (_error) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className={styles.container} data-tauri-drag-region>
            {/* Background Animations */}
            <style>
              {`
                @keyframes gradientBG {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
              `}
            </style>
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className={styles.glassCard}
            >
              <div className={styles.leftPanel}>
                 <motion.img 
                    src={admtLogo512} 
                    alt="Logo" 
                    className={styles.appIconImage}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                 />
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                 >
                     <Text weight="bold" size={600} align="center" block>{t('welcome.app_name')}</Text>
                     <Text size={200} align="center" style={{ color: tokens.colorNeutralForeground3, marginTop: '8px' }} block>
                         {t('welcome.app_subtitle')}
                     </Text>
                 </motion.div>
                 
                 <div className={styles.versionTag}>
                    v1.2.0
                 </div>
              </div>

              <div className={styles.rightPanel}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Text className={styles.welcomeTitle} block>{t('welcome.title')}</Text>
                     <Text className={styles.welcomeSubtitle} block>
                         {t('welcome.subtitle')}
                     </Text>

                    <div className={styles.policyList}>
                        {policies.map((p, index) => (
                            <motion.div 
                                key={p.id}
                                className={styles.policyItem}
                                onClick={() => handlePolicyClick(p.url)}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (index * 0.1) }}
                            >
                                <div className={styles.policyIconBox}>
                                    {p.icon}
                                </div>
                                <div className={styles.policyInfo}>
                                    <span className={styles.policyTitle}>{p.title}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <Divider />

                    <div className={styles.quickSettings}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings24Regular />
                            <Text weight="semibold">{t('settings.title', '快速设置')}</Text>
                        </div>
                        
                        <div className={styles.settingRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe24Regular />
                                <Label>{t('settings.interface_language')}</Label>
                            </div>
                            <Select 
                                value={config.language} 
                                onChange={(_, data) => {
                                    updateConfig({ language: data.value as any });
                                    i18n.changeLanguage(data.value);
                                }}
                                style={{ minWidth: '120px' }}
                            >
                                <option value="zh-CN">简体中文</option>
                                <option value="zh-TW">繁体中文</option>
                                <option value="en-US">English</option>
                            </Select>
                        </div>

                        <div className={styles.settingRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Play24Regular />
                                <Label>通知音效</Label>
                            </div>
                            <Switch 
                                checked={config.soundEnabled} 
                                onChange={(_, data) => updateConfig({ soundEnabled: data.checked })} 
                            />
                        </div>

                        <div className={styles.settingRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowMinimize24Regular />
                                <Label>系统托盘</Label>
                            </div>
                            <Switch 
                                checked={config.systemTrayEnabled} 
                                onChange={async (_, data) => {
                                    const checked = data.checked;
                                    updateConfig({ systemTrayEnabled: checked });
                                    try {
                                        if (checked) {
                                            await systemTrayManager.initialize({
                                                systemTrayEnabled: true,
                                                minimizeToTrayOnClose: config.minimizeToTrayOnClose
                                            });
                                        } else {
                                            await systemTrayManager.updateConfig({
                                                systemTrayEnabled: false,
                                                minimizeToTrayOnClose: false
                                            });
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }} 
                            />
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.checkboxWrapper}>
                            <Checkbox
                                checked={acceptedAll}
                                onChange={(_, data) => setAcceptedAll(data.checked === true)}
                                label={<Text weight="medium">{t('legal.consent_checkbox')}</Text>}
                            />
                        </div>
                        
                        <div className={styles.actionButtons}>
                            <Button 
                                appearance="secondary"
                                onClick={() => setShowExitConfirm(true)}
                            >
                                {t('legal.exit_browse')}
                            </Button>
                            <Button 
                                appearance="primary"
                                size="large"
                                onClick={handleAccept}
                                disabled={!acceptedAll}
                                icon={<CheckmarkCircle24Regular />}
                            >
                                {t('legal.agree_continue')}
                            </Button>
                        </div>
                    </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 退出确认对话框 */}
      <Dialog open={showExitConfirm} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogHeader}>
                <Warning24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                {t('legal.confirm_exit_title')}
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>
                {t('legal.confirm_exit_desc')}
              </Text>
              <br />
              <Text style={{ marginTop: '10px', display: 'block' }}>
                {t('legal.data_promise')}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowExitConfirm(false)}
              >
                {t('common.think_again')}
              </Button>
              <Button
                appearance="primary"
                onClick={handleReject}
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: tokens.colorNeutralForegroundOnBrand }}
              >
                {t('common.confirm_exit')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default PrivacyConsentDialog;
