/**
 * 隐私政策同意页面组件
 * 用于显示隐私政策和用户协议，要求用户同意
 */

import React, { useState } from "react";
import { admtLogo512 } from "../../assets/icons";
import { wechatpay, alipay } from "../../assets/icons";
import DonationPanel from "../Settings/DonationPanel";
import {
  Button,
  Checkbox,
  Text,
  makeStyles,
  shorthands,
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

const useStyles = makeStyles({
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--colorNeutralBackground2)",
    position: "relative",
    overflow: "hidden",
  },
  glassCard: {
    width: "920px",
    maxWidth: "92%",
    maxHeight: "88vh",
    display: "flex",
    flexDirection: "row",
    borderRadius: "20px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.04)",
    overflow: "hidden",
  },
  leftPanel: {
    width: "38%",
    backgroundColor: "var(--colorNeutralBackground2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    borderRight: "1px solid var(--colorNeutralStroke2)",
    position: "relative",
  },
  rightPanel: {
    flex: 1,
    padding: "36px 40px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  appIconImage: {
    width: "112px",
    height: "112px",
    borderRadius: "22px",
    boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.12)",
    marginBottom: "16px",
  },
  welcomeTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: "var(--colorNeutralForeground1)",
    marginBottom: "6px",
    letterSpacing: "-0.02em",
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: "13px",
    color: "var(--colorNeutralForeground2)",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  policyList: {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    marginBottom: "20px",
  },
  policyItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 12px",
    borderRadius: "14px",
    backgroundColor: "var(--colorNeutralBackground2)",
    border: "1px solid var(--colorNeutralStroke2)",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    textDecoration: "none",
    flex: 1,

    ":hover": {
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
      backgroundColor: "var(--colorNeutralBackground1Hover)",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.06)",
    },
  },
  policyIconBox: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
    color: "var(--colorBrandForeground1)",
  },
  policyInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  policyTitle: {
    fontWeight: "600",
    fontSize: "12px",
    color: "var(--colorNeutralForeground1)",
  },
  footer: {
    marginTop: "auto",
    paddingTop: "16px",
  },
  checkboxWrapper: {
    marginBottom: "16px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  pillButton: {
    borderRadius: "9999px",
    fontWeight: 500,
    transition: "all 0.15s ease",
  },
  dialogSurface: {
    borderRadius: "18px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.2)",
  },
  dialogHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--colorPaletteRedForeground1)",
  },
  versionTag: {
    marginTop: "16px",
    fontSize: "12px",
    color: "var(--colorNeutralForeground4)",
    textAlign: "center",
  },
  quickSettings: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
  },
  sponsorshipLeftPanel: {
    width: "42%",
    backgroundColor: "var(--colorNeutralBackground2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    gap: "16px",
    borderRight: "1px solid var(--colorNeutralStroke2)",
  },
  qrImage: {
    width: "180px",
    height: "180px",
    borderRadius: "16px",
    objectFit: "cover",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 6px 20px -4px rgba(0, 0, 0, 0.08)",
  },
  segmentedTabs: {
    display: "flex",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px",
    gap: "4px",
    border: "1px solid var(--colorNeutralStroke2)",
    marginBottom: "8px",
  },
  segmentTab: {
    padding: "4px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--colorNeutralForeground2)",
    transition: "all 0.15s ease",
  },
  segmentTabActive: {
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorBrandForeground1)",
    fontWeight: 600,
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
  },
  sponsorshipContent: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    height: "100%",
    justifyContent: "center",
  },
  sponsorshipTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "var(--colorBrandForeground1)",
    letterSpacing: "-0.01em",
    marginBottom: "4px",
  },
  sponsorshipDescription: {
    fontSize: "13px",
    lineHeight: "1.5",
    color: "var(--colorNeutralForeground2)",
  },
  highlightBox: {
    padding: "14px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "14px",
    border: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  donationDialog: {
    width: "660px",
    maxWidth: "92vw",
    maxHeight: "85vh",
    borderRadius: "18px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 20px 48px -8px rgba(0, 0, 0, 0.24)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  donationDialogBody: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
  },
  donationDialogContent: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: "6px",
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
  const [sponsorshipChannel, setSponsorshipChannel] = useState<"alipay" | "wechat">("alipay");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
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
      return;
    }
    setStep("sponsorship");
  };

  const openDonationPage = () => {
    // 优先打开内置原生赞助/捐赠弹窗，同时尝试拉起外部浏览器备用
    setIsDonationDialogOpen(true);
    try {
      import("@tauri-apps/plugin-shell")
        .then(({ open }) => open("https://www.lacs.cc/donate"))
        .catch(() => {});
    } catch {
      // 忽略在无网络环境或受限环境下的浏览器弹窗
    }
  };

  const handleFinalAccept = () => {
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
                        {t("welcome.version_tag", "领创工作室全栈开发")}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="sponsorship-left"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: tokens.spacingVerticalM,
                        width: "100%",
                      }}
                    >
                      <div className={styles.segmentedTabs}>
                        <button
                          type="button"
                          className={`${styles.segmentTab} ${sponsorshipChannel === "alipay" ? styles.segmentTabActive : ""}`}
                          onClick={() => setSponsorshipChannel("alipay")}
                        >
                          {t("donation.alipay", "支付宝")}
                        </button>
                        <button
                          type="button"
                          className={`${styles.segmentTab} ${sponsorshipChannel === "wechat" ? styles.segmentTabActive : ""}`}
                          onClick={() => setSponsorshipChannel("wechat")}
                        >
                          {t("donation.wechat_pay", "微信支付")}
                        </button>
                      </div>

                      <motion.img
                        key={sponsorshipChannel}
                        src={sponsorshipChannel === "alipay" ? alipay : wechatpay}
                        alt={sponsorshipChannel}
                        className={styles.qrImage}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />

                      <Text size={200} style={{ color: "var(--colorNeutralForeground3)", marginTop: "4px" }}>
                        {sponsorshipChannel === "alipay" ? t("welcome.sponsorship_alipay", "支付宝扫码支持") : t("welcome.sponsorship_wechat", "微信扫码支持")}
                      </Text>
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
                            <Label>{t("welcome.sound_effect", "通知音效")}</Label>
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
                            <Label>{t("welcome.system_tray", "系统托盘")}</Label>
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
                            className={styles.pillButton}
                            onClick={() => setShowExitConfirm(true)}
                          >
                            {t("legal.exit_browse")}
                          </Button>
                          <Button
                            appearance="primary"
                            className={styles.pillButton}
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
                          {t("welcome.sponsorship_title", "支持开源 · 自愿赞助")}
                        </Text>
                        <Text className={styles.sponsorshipDescription} block>
                          {t("welcome.sponsorship_desc", "玩机管家是一款由领创工作室维护的开源免费项目。致力于为 Android 玩机爱好者与开发者提供高效、纯净、强大的现代化工具箱。")}
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
                          size={300}
                          block
                        >
                          {t("welcome.free_title", "开源项目，完全免费使用")}
                        </Text>
                        <Text
                          size={200}
                          block
                          style={{ color: "var(--colorNeutralForeground2)" }}
                        >
                          {t("welcome.free_desc", "本软件所有核心功能完全免费开放，捐赠与否均可体验完整功能。赞助资金将全部用于服务器带宽、开源维护与版本迭代。")}
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
                          size={300}
                          block
                        >
                          {t("welcome.thanks_title", "致谢与社区捐赠榜")}
                        </Text>
                        <Text
                          size={200}
                          block
                          style={{ color: "var(--colorNeutralForeground2)" }}
                        >
                          {t("welcome.thanks_desc", "无论金额大小，每一份支持都是我们持续迭代的动力。已赞助用户将记录于社区鸣谢榜。")}
                        </Text>
                      </motion.div>

                      <div
                        className={styles.footer}
                        style={{ marginTop: "auto" }}
                      >
                        <div className={styles.actionButtons}>
                          <Button
                            appearance="secondary"
                            className={styles.pillButton}
                            size="large"
                            onClick={openDonationPage}
                            icon={<Heart24Regular />}
                          >
                            {t("welcome.open_donation", "打开捐赠墙")}
                          </Button>
                          <Button
                            appearance="primary"
                            className={styles.pillButton}
                            size="large"
                            onClick={handleFinalAccept}
                            icon={<CheckmarkCircle24Regular />}
                          >
                            {t("welcome.enter_app", "我已了解，进入应用")}
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
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              <div className={styles.dialogHeader}>
                <Warning24Regular
                  style={{ color: "var(--colorPaletteRedForeground1)" }}
                />
                {t("legal.confirm_exit_title")}
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>{t("legal.confirm_exit_desc")}</Text>
              <br />
              <Text style={{ marginTop: "10px", display: "block", color: "var(--colorNeutralForeground3)", fontSize: "13px" }}>
                {t("legal.data_promise")}
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                className={styles.pillButton}
                onClick={() => setShowExitConfirm(false)}
              >
                {t("common.think_again")}
              </Button>
              <Button
                appearance="primary"
                className={styles.pillButton}
                onClick={handleReject}
                style={{
                  backgroundColor: "var(--colorPaletteRedBackground3)",
                  color: "var(--colorNeutralForegroundOnBrand)",
                }}
              >
                {t("common.confirm_exit")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 捐赠墙 / 赞助支持弹窗 */}
      <Dialog
        open={isDonationDialogOpen}
        onOpenChange={(_, d) => setIsDonationDialogOpen(d.open)}
      >
        <DialogSurface className={styles.donationDialog}>
          <DialogBody className={styles.donationDialogBody}>
            <DialogTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Heart24Regular style={{ color: "#e11d48" }} />
                <span>{t("welcome.open_donation", "社区捐赠榜")}</span>
              </div>
            </DialogTitle>
            <DialogContent className={styles.donationDialogContent}>
              <DonationPanel />
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                className={styles.pillButton}
                onClick={() => setIsDonationDialogOpen(false)}
              >
                {t("common.close", "关闭")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default PrivacyConsentDialog;
