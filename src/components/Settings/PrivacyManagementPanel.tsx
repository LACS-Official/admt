import React, { useState } from "react";
import {
  Text,
  Button,
  Checkbox,
  Input,
  Field,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
  Badge,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import {
  ShieldCheckmark24Regular,
  ShieldKeyhole24Regular,
  Broom24Regular,
  Warning24Regular,
  ArrowReset24Regular,
  Open20Regular,
  DocumentText20Regular,
  LockClosed20Regular,
  LockOpen20Regular,
  Key20Regular,
} from "@fluentui/react-icons";
import { useSecurityStore } from "../../stores/securityStore";
import { useAppStore } from "../../stores/appStore";
import { verifySecurityAction } from "../Common/SecurityVerificationDialog";

const useStyles = makeStyles({
  container: {
    padding: "4px 8px 32px 8px",
    height: "100%",
    overflowY: "auto",
    backgroundColor: "transparent",
    boxSizing: "border-box",
  },
  gridContent: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    maxWidth: "1080px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  bentoCard: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke1)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },
  iconSquircle: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 113, 227, 0.12)",
    color: "var(--colorBrandForeground1)",
    flexShrink: 0,
  },
  iconSquircleDanger: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "var(--colorPaletteRedForeground1)",
    flexShrink: 0,
  },
  headerTitles: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: "15px",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.01em",
  },
  headerSubtitle: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
    lineHeight: "1.4",
  },
  cardContent: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid var(--colorNeutralStroke2)",
    gap: "16px",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  rowInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontWeight: 600,
    fontSize: "13px",
    color: "var(--colorNeutralForeground1)",
  },
  rowDescription: {
    color: "var(--colorNeutralForeground2)",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  badgePill: {
    borderRadius: "9999px",
    fontWeight: 600,
    fontSize: "11px",
    padding: "3px 10px",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px 12px",
    padding: "12px 14px",
    marginTop: "8px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    "@media (max-width: 560px)": {
      gridTemplateColumns: "1fr",
    },
  },
  dangerBox: {
    padding: "14px 16px",
    borderRadius: "12px",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.24)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "4px",
  },
  dangerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  pillButton: {
    borderRadius: "9999px",
    fontWeight: 500,
    padding: "0 16px",
    height: "32px",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  dangerButton: {
    borderRadius: "9999px",
    fontWeight: 500,
    padding: "0 16px",
    height: "32px",
    backgroundColor: "var(--colorPaletteRedBackground3)",
    color: "var(--colorPaletteRedForeground1)",
    border: "none",
    flexShrink: 0,
    ":hover": {
      backgroundColor: "var(--colorPaletteRedBackground2)",
    },
  },
  dialogSurface: {
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 20px 48px -8px rgba(0, 0, 0, 0.24)",
    padding: "20px 24px",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
});

export const PrivacyManagementPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();

  const {
    isPasswordEnabled,
    protectedActions,
    setPassword,
    removePassword,
    toggleProtectedAction,
  } = useSecurityStore();

  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [showRemovePasswordDialog, setShowRemovePasswordDialog] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formError, setFormError] = useState("");

  const openExternalUrl = (url: string) => {
    try {
      import("@tauri-apps/plugin-shell")
        .then(({ open }) => open(url))
        .catch(() => window.open(url, "_blank"));
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleOpenSetDialog = () => {
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
    setShowSetPasswordDialog(true);
  };

  const handleSaveNewPassword = () => {
    if (newPassword.length < 4) {
      setFormError(t("privacy.dialog_pwd_min_len"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError(t("privacy.dialog_pwd_mismatch"));
      return;
    }

    const success = setPassword(newPassword);
    if (success) {
      setShowSetPasswordDialog(false);
      setStatusBarMessage({
        type: "success",
        message: t("privacy.dialog_pwd_saved"),
      });
    } else {
      setFormError("保存密码失败");
    }
  };

  const handleOpenRemoveDialog = () => {
    setCurrentPassword("");
    setFormError("");
    setShowRemovePasswordDialog(true);
  };

  const handleConfirmRemovePassword = () => {
    const success = removePassword(currentPassword);
    if (success) {
      setShowRemovePasswordDialog(false);
      setStatusBarMessage({
        type: "info",
        message: t("privacy.dialog_pwd_disabled"),
      });
    } else {
      setFormError(t("privacy.dialog_pwd_current_error"));
    }
  };

  const handleCleanCache = () => {
    setStatusBarMessage({
      type: "success",
      message: t("privacy.cache_cleaned_msg"),
    });
  };

  const handleResetApplication = async () => {
    const passed = await verifySecurityAction("resetApp", t("privacy.danger_warning_title"));
    if (!passed) return;

    try {
      localStorage.clear();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.gridContent}>
        {/* 卡片 1 (左上)：隐私合规与法律条款 */}
        <div className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.iconSquircle}>
                <ShieldCheckmark24Regular />
              </div>
              <div className={styles.headerTitles}>
                <span className={styles.headerTitle}>{t("privacy.privacy_compliance_title")}</span>
                <span className={styles.headerSubtitle}>{t("privacy.privacy_compliance_desc")}</span>
              </div>
            </div>
          </div>

          <div className={styles.cardContent}>
            {/* 隐私政策条款入口 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <span className={styles.rowTitle}>{t("legal.privacy_policy", "隐私保护政策")}</span>
                <span className={styles.rowDescription}>
                  {t("legal.privacy_desc", "了解我们如何保护您的设备与数据安全")}
                </span>
              </div>
              <Button
                size="small"
                appearance="subtle"
                className={styles.pillButton}
                icon={<DocumentText20Regular />}
                onClick={() => openExternalUrl("https://admt.lacs.cc/agreement#privacy")}
              >
                {t("privacy.open_policy", "查阅政策")}
              </Button>
            </div>

            {/* 用户协议条款入口 */}
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <span className={styles.rowTitle}>{t("legal.user_agreement", "用户服务协议")}</span>
                <span className={styles.rowDescription}>
                  {t("legal.agreement_desc", "软件使用规范、免责声明及服务准则")}
                </span>
              </div>
              <Button
                size="small"
                appearance="subtle"
                className={styles.pillButton}
                icon={<Open20Regular />}
                onClick={() => openExternalUrl("https://admt.lacs.cc/agreement#user")}
              >
                {t("privacy.open_agreement", "查阅协议")}
              </Button>
            </div>
          </div>
        </div>

        {/* 卡片 2 (右上)：关键操作安全屏障 */}
        <div className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.iconSquircle}>
                <ShieldKeyhole24Regular />
              </div>
              <div className={styles.headerTitles}>
                <span className={styles.headerTitle}>{t("privacy.security_barrier_title")}</span>
                <span className={styles.headerSubtitle}>{t("privacy.security_barrier_desc")}</span>
              </div>
            </div>
            <Badge
              className={styles.badgePill}
              appearance="tint"
              color={isPasswordEnabled ? "success" : "informative"}
            >
              {isPasswordEnabled ? t("privacy.password_enabled_badge") : t("privacy.password_disabled_badge")}
            </Badge>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <span className={styles.rowTitle}>{t("privacy.password_shield")}</span>
                <span className={styles.rowDescription}>{t("privacy.password_shield_desc")}</span>
              </div>
              {isPasswordEnabled ? (
                <div className={styles.actionGroup}>
                  <Button
                    size="small"
                    className={styles.pillButton}
                    icon={<Key20Regular />}
                    onClick={handleOpenSetDialog}
                  >
                    {t("privacy.btn_change_password")}
                  </Button>
                  <Button
                    size="small"
                    appearance="subtle"
                    className={styles.pillButton}
                    icon={<LockOpen20Regular />}
                    onClick={handleOpenRemoveDialog}
                  >
                    {t("privacy.btn_disable_password")}
                  </Button>
                </div>
              ) : (
                <Button
                  appearance="primary"
                  size="small"
                  className={styles.pillButton}
                  icon={<LockClosed20Regular />}
                  onClick={handleOpenSetDialog}
                >
                  {t("privacy.btn_set_password")}
                </Button>
              )}
            </div>

            {isPasswordEnabled && (
              <div style={{ marginTop: "4px" }}>
                <Text weight="semibold" size={200} block style={{ color: "var(--colorNeutralForeground1)" }}>
                  {t("privacy.protected_scope_title")}
                </Text>
                <div className={styles.checkboxGrid}>
                  <Checkbox
                    checked={protectedActions.rootFlash}
                    onChange={(_, d) => toggleProtectedAction("rootFlash", !!d.checked)}
                    label={t("privacy.scope_root")}
                  />
                  <Checkbox
                    checked={protectedActions.fastbootFlash}
                    onChange={(_, d) => toggleProtectedAction("fastbootFlash", !!d.checked)}
                    label={t("privacy.scope_fastboot")}
                  />
                  <Checkbox
                    checked={protectedActions.wipeDevice}
                    onChange={(_, d) => toggleProtectedAction("wipeDevice", !!d.checked)}
                    label={t("privacy.scope_wipe")}
                  />
                  <Checkbox
                    checked={protectedActions.resetApp}
                    onChange={(_, d) => toggleProtectedAction("resetApp", !!d.checked)}
                    label={t("privacy.scope_reset")}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 卡片 3 (左下)：本地存储与临时缓存 */}
        <div className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.iconSquircle}>
                <Broom24Regular />
              </div>
              <div className={styles.headerTitles}>
                <span className={styles.headerTitle}>{t("privacy.storage_cache_title")}</span>
                <span className={styles.headerSubtitle}>{t("privacy.storage_cache_desc")}</span>
              </div>
            </div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.settingRow}>
              <div className={styles.rowInfo}>
                <span className={styles.rowTitle}>{t("privacy.btn_clean_cache")}</span>
                <span className={styles.rowDescription}>{t("privacy.cache_cleanup_desc")}</span>
              </div>
              <Button
                size="small"
                className={styles.pillButton}
                icon={<Broom24Regular />}
                onClick={handleCleanCache}
              >
                {t("privacy.btn_clean_cache")}
              </Button>
            </div>
          </div>
        </div>

        {/* 卡片 4 (右下)：危险区域 · 应用恢复初始状态 */}
        <div className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.iconSquircleDanger}>
                <Warning24Regular />
              </div>
              <div className={styles.headerTitles}>
                <span className={styles.headerTitle}>{t("privacy.danger_zone_title")}</span>
                <span className={styles.headerSubtitle}>{t("privacy.danger_zone_desc")}</span>
              </div>
            </div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.dangerBox}>
              <div className={styles.dangerRow}>
                <div className={styles.rowInfo}>
                  <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                    {t("privacy.danger_warning_title")}
                  </Text>
                  <Text className={styles.rowDescription} style={{ color: "var(--colorNeutralForeground2)" }}>
                    {t("privacy.danger_warning_desc")}
                  </Text>
                </div>
                <Button
                  size="small"
                  className={styles.dangerButton}
                  icon={<ArrowReset24Regular />}
                  onClick={handleResetApplication}
                >
                  {t("privacy.btn_reset_app")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设置 / 修改密码弹窗 */}
      <Dialog open={showSetPasswordDialog} onOpenChange={(_, d) => !d.open && setShowSetPasswordDialog(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              {isPasswordEnabled ? t("privacy.dialog_change_pwd_title") : t("privacy.dialog_set_pwd_title")}
            </DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM, marginTop: "8px" }}>
              <Field
                label={t("privacy.dialog_pwd_new_label")}
                validationState={formError ? "error" : "none"}
              >
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(_, d) => { setNewPassword(d.value); setFormError(""); }}
                  placeholder="••••••••"
                />
              </Field>
              <Field
                label={t("privacy.dialog_pwd_confirm_label")}
                validationState={formError ? "error" : "none"}
                validationMessage={formError || undefined}
              >
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(_, d) => { setConfirmPassword(d.value); setFormError(""); }}
                  placeholder="••••••••"
                />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: "16px" }}>
              <Button appearance="subtle" className={styles.pillButton} onClick={() => setShowSetPasswordDialog(false)}>
                {t("common.cancel", "取消")}
              </Button>
              <Button appearance="primary" className={styles.pillButton} onClick={handleSaveNewPassword}>
                {t("common.confirm", "确定")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 关闭密码确认弹窗 */}
      <Dialog open={showRemovePasswordDialog} onOpenChange={(_, d) => !d.open && setShowRemovePasswordDialog(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>{t("privacy.btn_disable_password")}</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM, marginTop: "8px" }}>
              <Text size={200} style={{ color: "var(--colorNeutralForeground2)" }}>
                {t("privacy.dialog_pwd_current_hint")}
              </Text>
              <Field
                label={t("privacy.dialog_pwd_current_label")}
                validationState={formError ? "error" : "none"}
                validationMessage={formError || undefined}
              >
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(_, d) => { setCurrentPassword(d.value); setFormError(""); }}
                  placeholder="••••••••"
                />
              </Field>
            </DialogContent>
            <DialogActions style={{ marginTop: "16px" }}>
              <Button appearance="subtle" className={styles.pillButton} onClick={() => setShowRemovePasswordDialog(false)}>
                {t("common.cancel", "取消")}
              </Button>
              <Button appearance="primary" className={styles.pillButton} onClick={handleConfirmRemovePassword}>
                {t("common.confirm", "确定")}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PrivacyManagementPanel;
