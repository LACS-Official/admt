/**
 * 隐私政策同意页面组件
 * 用于显示隐私政策和用户协议，要求用户同意
 */

import React, { useState } from "react";
import { admtLogo512 } from "../../assets/icons";
import { wechatpay, alipay } from "../../assets/icons";
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
} from "@fluentui/react-components";
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
  Heart24Regular,
} from "@fluentui/react-icons";
import { usePrivacyConsentStore } from "../../stores/privacyConsentStore";
import { useAppStore } from "../../stores/appStore";
import { systemTrayManager } from "../../services/systemTrayManager";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";

const useStyles = makeStyles({
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorNeutralBackground1} 50%, ${tokens.colorBrandBackground2} 100%)`,
    backgroundSize: "400% 400%",
    animation: "gradientBG 15s ease infinite",
    position: "relative",
    overflow: "hidden",
  },
  glassCard: {
    width: "900px",
    maxWidth: "90%",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "row",
    borderRadius: "24px",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    border: `1px solid rgba(255, 255, 255, 0.5)`,
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
    overflow: "hidden",

    // Dark mode support
    "@media (prefers-color-scheme: dark)": {
      backgroundColor: "rgba(30, 30, 30, 0.7)",
      border: `1px solid rgba(255, 255, 255, 0.1)`,
    },
  },
  leftPanel: {
    width: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingHorizontalXL,
    borderRight: `1px solid rgba(0, 0, 0, 0.05)`,
    position: "relative",

    "@media (prefers-color-scheme: dark)": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRight: `1px solid rgba(255, 255, 255, 0.05)`,
    },
  },
  rightPanel: {
    flex: 1,
    padding: tokens.spacingHorizontalXXL,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
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
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalXL,
    lineHeight: "1.5",
  },
  policyList: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalXL,
  },
  policyItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid transparent`,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textDecoration: "none",
    flex: 1,

    ":hover": {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      backgroundColor: tokens.colorNeutralBackground2Hover,
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow4,
    },
  },
  policyIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    backgroundColor: tokens.colorBrandBackground2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorBrandForeground1,
  },
  policyInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  policyTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  footer: {
    marginTop: "auto",
    paddingTop: tokens.spacingVerticalL,
  },
  checkboxWrapper: {
    marginBottom: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "rgba(255, 255, 255, 0.5)",

    "@media (prefers-color-scheme: dark)": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
  },
  actionButtons: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    justifyContent: "flex-end",
  },
  dialogHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground1,
  },
  versionTag: {
    marginTop: tokens.spacingVerticalL,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
    textAlign: "center",
  },
  quickSettings: {
    marginTop: tokens.spacingVerticalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  sponsorshipLeftPanel: {
    width: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingHorizontalXL,
    gap: tokens.spacingVerticalL,
    borderRight: `1px solid rgba(0, 0, 0, 0.05)`,
    "@media (prefers-color-scheme: dark)": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      borderRight: `1px solid rgba(255, 255, 255, 0.05)`,
    },
  },
  qrImage: {
    width: "220px",
    height: "220px",
    borderRadius: "16px",
    objectFit: "cover",
    border: `4px solid ${tokens.colorNeutralBackground1}`,
    transition: "transform 0.3s ease",
    ":hover": {
      transform: "scale(1.05)",
    },
  },
  sponsorshipContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    height: "100%",
    justifyContent: "center",
  },
  sponsorshipTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  sponsorshipDescription: {
    fontSize: tokens.fontSizeBase400,
    lineHeight: "1.6",
    color: tokens.colorNeutralForeground2,
  },
  highlightBox: {
    padding: tokens.spacingHorizontalL,
    paddingBlock: tokens.spacingVerticalL,
    backgroundColor: tokens.colorBrandBackground2,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    marginTop: tokens.spacingVerticalXL,
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
  const [step, setStep] = useState<"privacy" | "sponsorship">("privacy");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const { config, updateConfig } = useAppStore();
  const celebrationIntervalRef = React.useRef<any>(null);
  const isAcceptedRef = React.useRef(false);

  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      // 只有在非正常接受（如直接关闭或强行切换）时才在这里清理
      // 正常接受流程中，我们允许烟花继续燃放一会，它内部有自清理逻辑
      if (celebrationIntervalRef.current && !isAcceptedRef.current) {
        clearInterval(celebrationIntervalRef.current);
      }
    };
  }, []);

  const {
    acceptPrivacyPolicy,
    acceptUserAgreement,
    acceptDataCollection,
    completePrivacySetup,
    setShouldExitApp,
  } = usePrivacyConsentStore();

  const handleAccept = () => {
    if (!acceptedAll) {
      return;
    }
    setStep("sponsorship");
  };

  const openDonationPage = () => {
    window.open("https://www.lacs.cc/donate", "_blank");
  };

  const handleFinalAccept = () => {
    isAcceptedRef.current = true;
    // 触发庆祝烟花
    fireCelebration();

    // 延迟一点时间再调用后续逻辑，让用户能看到烟花开始
    // 在这期间不调用 completePrivacySetup，避免组件立即卸载
    setTimeout(() => {
      acceptPrivacyPolicy();
      acceptUserAgreement();
      acceptDataCollection();
      completePrivacySetup();
      onAccept();
    }, 1500);
  };

  const fireCelebration = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 10000,
    };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        celebrationIntervalRef.current = null;
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // 随机喷发位置
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });

      // 每隔一次增加一次中心大喷发
      if (Math.random() > 0.7) {
        confetti({
          ...defaults,
          particleCount: particleCount * 2,
          origin: { x: 0.5, y: 0.5 },
        });
      }
    }, 250);

    celebrationIntervalRef.current = interval;
  };

  const handleReject = async () => {
    setShouldExitApp(true);
    onReject();

    try {
      const { exit } = await import("@tauri-apps/plugin-process");
      await exit(0);
    } catch (_error) {
      if (window.close) {
        window.close();
      }
    }
  };

  const policies = [
    {
      id: "privacy",
      title: t("legal.privacy_policy"),
      description: t("legal.privacy_desc"),
      icon: <Shield24Regular />,
      url: "https://admt.lacs.cc/agreement#privacy",
    },
    {
      id: "agreement",
      title: t("legal.user_agreement"),
      description: t("legal.agreement_desc"),
      icon: <Document24Regular />,
      url: "https://admt.lacs.cc/agreement#user",
    },
    {
      id: "data",
      title: t("legal.data_collection"),
      description: t("legal.data_desc"),
      icon: <DocumentBulletList24Regular />,
      url: "https://admt.lacs.cc/agreement#collection",
    },
  ];

  const handlePolicyClick = (url: string) => {
    try {
      import("@tauri-apps/plugin-shell")
        .then(({ open }) => {
          open(url);
        })
        .catch(() => {
          window.open(url, "_blank");
        });
    } catch (_error) {
      window.open(url, "_blank");
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
              {/* 固定左侧面板结构 */}
              <div className={styles.leftPanel}>
                <AnimatePresence mode="wait">
                  {step === "privacy" ? (
                    <motion.div
                      key="privacy-left"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
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
                        <Text weight="bold" size={600} align="center" block>
                          {t("welcome.app_name")}
                        </Text>
                        <Text
                          size={200}
                          align="center"
                          style={{
                            color: tokens.colorNeutralForeground3,
                            marginTop: "8px",
                          }}
                          block
                        >
                          {t("welcome.app_subtitle")}
                        </Text>
                      </motion.div>
                      <div className={styles.versionTag}>
                        领创工作室全栈开发
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sponsorship-left"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: tokens.spacingVerticalL,
                        width: "100%",
                      }}
                    >
                      <Text className={styles.sponsorshipTitle} block>
                        支付宝 ↓
                      </Text>
                      <motion.img
                        src={alipay}
                        alt="Alipay"
                        className={styles.qrImage}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                      {/* 分割线 */}

                      <Text className={styles.sponsorshipTitle} block>
                        微信 ↓
                      </Text>
                      <motion.img
                        src={wechatpay}
                        alt="Wechat"
                        className={styles.qrImage}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 固定右侧面板结构 */}
              <div className={styles.rightPanel}>
                <AnimatePresence mode="wait">
                  {step === "privacy" ? (
                    <motion.div
                      key="privacy-right"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Text className={styles.welcomeTitle} block>
                        {t("welcome.title")}
                      </Text>
                      <Text className={styles.welcomeSubtitle} block>
                        {t("welcome.subtitle")}
                      </Text>

                      <div className={styles.policyList}>
                        {policies.map((p, index) => (
                          <motion.div
                            key={p.id}
                            className={styles.policyItem}
                            onClick={() => handlePolicyClick(p.url)}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                          >
                            <div className={styles.policyIconBox}>{p.icon}</div>
                            <div className={styles.policyInfo}>
                              <span className={styles.policyTitle}>
                                {p.title}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <Divider />

                      <div className={styles.quickSettings}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Settings24Regular />
                          <Text weight="semibold">
                            {t("settings.title", "快速设置")}
                          </Text>
                        </div>

                        <div className={styles.settingRow}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Globe24Regular />
                            <Label>{t("settings.interface_language")}</Label>
                          </div>
                          <Select
                            value={config.language}
                            onChange={(_, data) => {
                              updateConfig({ language: data.value as any });
                              i18n.changeLanguage(data.value);
                            }}
                            style={{ minWidth: "120px" }}
                          >
                            <option value="zh-CN">简体中文</option>
                            <option value="zh-TW">繁体中文</option>
                            <option value="en-US">English</option>
                          </Select>
                        </div>

                        <div className={styles.settingRow}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Play24Regular />
                            <Label>通知音效</Label>
                          </div>
                          <Switch
                            checked={config.soundEnabled}
                            onChange={(_, data) =>
                              updateConfig({ soundEnabled: data.checked })
                            }
                          />
                        </div>

                        <div className={styles.settingRow}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
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
                                    minimizeToTrayOnClose:
                                      config.minimizeToTrayOnClose,
                                  });
                                } else {
                                  await systemTrayManager.updateConfig({
                                    systemTrayEnabled: false,
                                    minimizeToTrayOnClose: false,
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
                            onChange={(_, data) =>
                              setAcceptedAll(data.checked === true)
                            }
                            label={
                              <Text weight="medium">
                                {t("legal.consent_checkbox")}
                              </Text>
                            }
                          />
                        </div>

                        <div className={styles.actionButtons}>
                          <Button
                            appearance="secondary"
                            onClick={() => setShowExitConfirm(true)}
                          >
                            {t("legal.exit_browse")}
                          </Button>
                          <Button
                            appearance="primary"
                            size="large"
                            onClick={handleAccept}
                            disabled={!acceptedAll}
                            icon={<CheckmarkCircle24Regular />}
                          >
                            {t("legal.agree_continue")}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sponsorship-right"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={styles.sponsorshipContent}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Text className={styles.sponsorshipTitle} block>
                          注意！使用本软件需要诚信捐赠￥6元+
                        </Text>
                        <Text className={styles.sponsorshipDescription} block>
                          玩机管家是一款由<b>领创工作室</b> 维护的免费项目
                          我们的目标是为 Android
                          玩家提供强大、简洁、优雅的调试工具箱。
                        </Text>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={styles.highlightBox}
                      >
                        <Text
                          weight="semibold"
                          size={400}
                          block
                          style={{ marginBottom: "8px" }}
                        >
                          请确保您已有捐赠意愿，这不是一种购买行为
                        </Text>
                        <Text
                          block
                          style={{ color: tokens.colorNeutralForeground2 }}
                        >
                          采取诚信付款机制，付款后将获得使用权
                          <br />
                          <b>若有捐赠意愿但暂无捐赠能力，可以暂不捐赠</b>
                          <br />
                          待有能力那天再来捐赠即可
                        </Text>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={styles.highlightBox}
                      >
                        <Text
                          weight="semibold"
                          size={400}
                          block
                          style={{ marginBottom: "8px" }}
                        >
                          为什么需要您的支持？
                        </Text>
                        <Text
                          block
                          style={{ color: tokens.colorNeutralForeground2 }}
                        >
                          赞助资金将直接用于服务器运营、官网维护以及支持开发者的持续开发热情。
                          无论金额大小，您的每一份支持都是我们前进的动力。
                        </Text>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={styles.highlightBox}
                      >
                        <Text
                          weight="semibold"
                          size={400}
                          block
                          style={{ marginBottom: "8px" }}
                        >
                          捐赠后即视为同意本页内容，付款后概不退款，请您了解
                        </Text>
                        <Text
                          block
                          style={{ color: tokens.colorBrandBackground3Static }}
                        >
                          已捐赠用户我们会记录到捐赠墙，感谢支持
                        </Text>
                      </motion.div>

                      <div
                        className={styles.footer}
                        style={{ marginTop: "auto" }}
                      >
                        <div className={styles.actionButtons}>
                        <Button
                          appearance="primary"
                          size="large"
                          onClick={openDonationPage}
                          icon={<Heart24Regular />}
                        >
                          打开捐赠墙
                        </Button>
                          <Button
                            appearance="primary"
                            size="large"
                            onClick={handleFinalAccept}
                            icon={<CheckmarkCircle24Regular />}
                          >
                            我已诚信付款，进入应用
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                <Warning24Regular
                  style={{ color: tokens.colorPaletteRedForeground1 }}
                />
                {t("legal.confirm_exit_title")}
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>{t("legal.confirm_exit_desc")}</Text>
              <br />
              <Text style={{ marginTop: "10px", display: "block" }}>
                {t("legal.data_promise")}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowExitConfirm(false)}
              >
                {t("common.think_again")}
              </Button>
              <Button
                appearance="primary"
                onClick={handleReject}
                style={{
                  backgroundColor: tokens.colorPaletteRedBackground3,
                  color: tokens.colorNeutralForegroundOnBrand,
                }}
              >
                {t("common.confirm_exit")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default PrivacyConsentDialog;
