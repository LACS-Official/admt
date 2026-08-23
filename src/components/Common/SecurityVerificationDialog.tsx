import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Field,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { LockClosed24Regular, ShieldKeyhole24Regular } from "@fluentui/react-icons";
import { useSecurityStore, ProtectedActions } from "../../stores/securityStore";

const useStyles = makeStyles({
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalS,
  },
  actionBadge: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: "var(--colorNeutralBackground2)",
    borderRadius: "4px",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: "12px",
    color: "var(--colorBrandForeground1)",
  },
});

interface VerificationRequest {
  actionKey: keyof ProtectedActions;
  actionTitle: string;
  resolve: (value: boolean) => void;
}

let activeVerificationRequest: VerificationRequest | null = null;
let notifyDialog: (() => void) | null = null;

/**
 * 全局触发关键操作安全验证
 */
export function verifySecurityAction(
  actionKey: keyof ProtectedActions,
  actionTitle: string
): Promise<boolean> {
  const store = useSecurityStore.getState();
  if (!store.isActionProtected(actionKey)) {
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    activeVerificationRequest = {
      actionKey,
      actionTitle,
      resolve,
    };
    if (notifyDialog) {
      notifyDialog();
    }
  });
}

export const SecurityVerificationDialog: React.FC = () => {
  const styles = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { verifyPassword, lockUntil } = useSecurityStore();

  useEffect(() => {
    notifyDialog = () => {
      if (activeVerificationRequest) {
        setRequest(activeVerificationRequest);
        setPasswordInput("");
        setErrorMessage("");
        setIsOpen(true);
      }
    };

    return () => {
      notifyDialog = null;
    };
  }, []);

  const handleConfirm = () => {
    if (!passwordInput) {
      setErrorMessage("请输入安全密码");
      return;
    }

    const isLocked = lockUntil && Date.now() < lockUntil;
    if (isLocked) {
      const waitSec = Math.ceil((lockUntil! - Date.now()) / 1000);
      setErrorMessage(`尝试次数过多，请在 ${waitSec} 秒后重试`);
      return;
    }

    const passed = verifyPassword(passwordInput);
    if (passed) {
      setIsOpen(false);
      request?.resolve(true);
      activeVerificationRequest = null;
    } else {
      setErrorMessage("密码错误，请重新输入");
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    request?.resolve(false);
    activeVerificationRequest = null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && handleCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle className={styles.titleRow}>
            <ShieldKeyhole24Regular />
            <span>安全密码身份校验</span>
          </DialogTitle>
          <DialogContent className={styles.contentContainer}>
            <Text size={300}>
              正在执行受保护的关键高危操作，请输入软件安全密码以确认继续：
            </Text>
            {request?.actionTitle && (
              <div className={styles.actionBadge}>{request.actionTitle}</div>
            )}
            <Field
              label="软件安全密码"
              validationState={errorMessage ? "error" : "none"}
              validationMessage={errorMessage}
            >
              <Input
                type="password"
                value={passwordInput}
                onChange={(_, d) => {
                  setPasswordInput(d.value);
                  setErrorMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                }}
                autoFocus
                placeholder="请输入 4 位以上安全密码"
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleCancel}>
              取消操作
            </Button>
            <Button appearance="primary" onClick={handleConfirm}>
              验证并执行
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
