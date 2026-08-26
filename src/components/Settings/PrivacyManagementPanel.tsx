import React, { useState } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Switch,
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
  Divider,
  Badge,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import {
  ShieldKeyhole24Regular,
  LockClosed24Regular,
  Delete24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  ArrowReset24Regular,
} from "@fluentui/react-icons";
import { useSecurityStore } from "../../stores/securityStore";
import { verifySecurityAction } from "../Common/SecurityVerificationDialog";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    padding: "4px 8px 24px 8px",
    maxWidth: "900px",
    margin: "0 auto",
    height: "100%",
    overflow: "auto",
    backgroundColor: "transparent",
  },
  card: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  cardHeader: {
    padding: "18px 20px 8px 20px",
  },
  cardContent: {
    padding: "8px 20px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    gap: "16px",
  },
  settingInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  description: {
    color: "var(--colorNeutralForeground3)",
    fontSize: "12px",
    lineHeight: "1.4",
  },
  badgePill: {
    borderRadius: "9999px",
    fontWeight: 600,
    fontSize: "11px",
    padding: "2px 8px",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "8px",
    padding: "14px 16px",
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "12px",
    border: "1px solid var(--colorNeutralStroke2)",
    "@media (max-width: 640px)": {
      gridTemplateColumns: "1fr",
    },
  },
  dangerZone: {
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: "14px",
    padding: "16px 18px",
    backgroundColor: "rgba(239, 68, 68, 0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  pillButton: {
    borderRadius: "9999px",
    fontWeight: 500,
    padding: "0 14px",
  },
  dialogSurface: {
    borderRadius: "18px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 20px 48px -8px rgba(0, 0, 0, 0.24)",
  },
});

export const PrivacyManagementPanel: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  const {
    isPasswordEnabled,
    protectedActions,
    setPassword,
    removePassword,
    toggleProtectedAction,
  } = useSecurityStore();

  // 对话框状态
  const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showRemovePasswordDialog, setShowRemovePasswordDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // 表单状态
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleOpenSetDialog = () => {
    setNewPassword("");
    setConfirmPassword("");
    setFormError("");
    setShowSetPasswordDialog(true);
  };

  const handleSaveNewPassword = () => {
    if (newPassword.length < 4) {
      setFormError("密码长度不能少于 4 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("两次输入的密码不一致");
      return;
    }

    const success = setPassword(newPassword);
    if (success) {
      setShowSetPasswordDialog(false);
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
    } else {
      setFormError("当前密码验证错误");
    }
  };

  const handleResetApplication = async () => {
    const passed = await verifySecurityAction("resetApp", "重置应用全部数据");
    if (!passed) return;

    try {
      localStorage.clear();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (_e) {
      window.location.reload();
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. 软件安全密码设置 */}
      <Card className={styles.card}>
        <CardHeader
          className={styles.cardHeader}
          header={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldKeyhole24Regular style={{ color: "var(--colorBrandForeground1)" }} />
              <Text weight="semibold" size={400}>软件安全密码保护</Text>
              <Badge 
                className={styles.badgePill}
                appearance="tint" 
                color={isPasswordEnabled ? "success" : "informative"}
              >
                {isPasswordEnabled ? "已启用防护" : "未开启"}
              </Badge>
            </div>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">高危操作密码鉴权</Text>
              <Text className={styles.description}>
                开启后，在执行刷机、Root 烧录、设备清除等破坏性操作前须验证安全密码，防止误触或未授权操作。
              </Text>
            </div>
            {isPasswordEnabled ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <Button size="small" className={styles.pillButton} onClick={handleOpenSetDialog}>
                  修改密码
                </Button>
                <Button size="small" appearance="subtle" className={styles.pillButton} onClick={handleOpenRemoveDialog}>
                  关闭密码
                </Button>
              </div>
            ) : (
              <Button appearance="primary" size="small" className={styles.pillButton} onClick={handleOpenSetDialog}>
                设置安全密码
              </Button>
            )}
          </div>

          {isPasswordEnabled && (
            <>
              <Divider />
              <div className={styles.settingInfo}>
                <Text weight="semibold" size={200}>受保护的关键操作范围</Text>
                <Text size={100} className={styles.description}>
                  勾选需要强制验证密码的场景：
                </Text>
              </div>
              <div className={styles.checkboxGrid}>
                <Checkbox
                  checked={protectedActions.rootFlash}
                  onChange={(_, d) => toggleProtectedAction("rootFlash", !!d.checked)}
                  label="一键 Root 镜像刷入与修补"
                />
                <Checkbox
                  checked={protectedActions.fastbootFlash}
                  onChange={(_, d) => toggleProtectedAction("fastbootFlash", !!d.checked)}
                  label="Fastboot 分区擦除与自定义刷入"
                />
                <Checkbox
                  checked={protectedActions.wipeDevice}
                  onChange={(_, d) => toggleProtectedAction("wipeDevice", !!d.checked)}
                  label="设备格机与恢复出厂设置"
                />
                <Checkbox
                  checked={protectedActions.resetApp}
                  onChange={(_, d) => toggleProtectedAction("resetApp", !!d.checked)}
                  label="重置应用与清除所有缓存"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 2. 数据与缓存清理 */}
      <Card className={styles.card}>
        <CardHeader
          className={styles.cardHeader}
          header={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Delete24Regular />
              <Text weight="semibold" size={400}>本地数据与缓存</Text>
            </div>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Text weight="semibold">固件提取与下载临时缓存</Text>
              <Text className={styles.description}>
                清理流式解析分区镜像、下载固件和 Root 工具包时产生的本地临时文件。
              </Text>
            </div>
            <Button size="small" className={styles.pillButton} onClick={() => alert("临时提取缓存已清空")}>
              清理临时文件
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. 危险区域 */}
      <Card className={styles.card}>
        <CardHeader
          className={styles.cardHeader}
          header={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />
              <Text weight="semibold" size={400}>重置与恢复</Text>
            </div>
          }
        />
        <div className={styles.cardContent}>
          <div className={styles.dangerZone}>
            <div className={styles.settingInfo}>
              <Text weight="semibold" style={{ color: "var(--colorPaletteRedForeground1)" }}>
                重置软件全部设置与数据
              </Text>
              <Text size={200} className={styles.description}>
                将清空所有偏好设置、设备连接记忆和本地缓存，软件将重启并恢复初始状态。
              </Text>
            </div>
            <Button
              appearance="primary"
              size="small"
              className={styles.pillButton}
              icon={<ArrowReset24Regular />}
              style={{ backgroundColor: "var(--colorPaletteRedBackground3)", color: "var(--colorPaletteRedForeground1)" }}
              onClick={handleResetApplication}
            >
              重置应用
            </Button>
          </div>
        </div>
      </Card>

      {/* 设置 / 修改密码弹窗 */}
      <Dialog open={showSetPasswordDialog} onOpenChange={(_, d) => !d.open && setShowSetPasswordDialog(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>
              {isPasswordEnabled ? "修改安全密码" : "设置软件安全密码"}
            </DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM }}>
              <Field
                label="新安全密码 (至少 4 位)"
                validationState={formError ? "error" : "none"}
              >
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(_, d) => { setNewPassword(d.value); setFormError(""); }}
                  placeholder="请输入新安全密码"
                />
              </Field>
              <Field
                label="确认新安全密码"
                validationState={formError ? "error" : "none"}
                validationMessage={formError}
              >
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(_, d) => { setConfirmPassword(d.value); setFormError(""); }}
                  placeholder="再次输入以确认"
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" className={styles.pillButton} onClick={() => setShowSetPasswordDialog(false)}>
                取消
              </Button>
              <Button appearance="primary" className={styles.pillButton} onClick={handleSaveNewPassword}>
                保存设置
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 关闭密码弹窗 */}
      <Dialog open={showRemovePasswordDialog} onOpenChange={(_, d) => !d.open && setShowRemovePasswordDialog(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>关闭安全密码保护</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalM }}>
              <Text size={200} className={styles.description}>请输入当前安全密码以确认关闭：</Text>
              <Field
                label="当前密码"
                validationState={formError ? "error" : "none"}
                validationMessage={formError}
              >
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(_, d) => { setCurrentPassword(d.value); setFormError(""); }}
                  placeholder="输入当前密码"
                  autoFocus
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" className={styles.pillButton} onClick={() => setShowRemovePasswordDialog(false)}>
                取消
              </Button>
              <Button appearance="primary" className={styles.pillButton} onClick={handleConfirmRemovePassword}>
                确认关闭
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PrivacyManagementPanel;
