import React from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  makeStyles,
} from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { useConfirmStore } from "../../services/confirmService";

const useStyles = makeStyles({
  surface: {
    maxWidth: "min(92vw, 460px)",
  },
  message: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: 1.5,
  },
});

/** 全局确认对话框宿主，挂载于 App 根部，全局仅此一份。 */
const ConfirmDialogHost: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const settle = useConfirmStore((s) => s.settle);

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) settle(false);
      }}
    >
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            {options?.title ?? t("common.confirm_title", "请确认")}
          </DialogTitle>
          <DialogContent>
            <div className={styles.message}>{options?.message ?? ""}</div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => settle(false)}>
              {options?.cancelLabel ?? t("common.cancel", "取消")}
            </Button>
            <Button
              appearance={options?.danger ? "primary" : "primary"}
              onClick={() => settle(true)}
            >
              {options?.confirmLabel ?? t("common.confirm", "确定")}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ConfirmDialogHost;
