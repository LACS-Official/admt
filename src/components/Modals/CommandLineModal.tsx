import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  makeStyles,
} from "@fluentui/react-components";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";

const CommandExecutePanel = React.lazy(() => import("../Others/CommandExecutePanel"));

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "1060px",
    width: "92vw",
    height: "82vh",
    maxHeight: "780px",
    padding: "0",
    overflow: "hidden",
    borderRadius: "16px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 24px 50px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  dialogBody: {
    height: "100%",
    width: "100%",
    margin: "0",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
});

export const CommandLineModal: React.FC = () => {
  const styles = useStyles();
  const isCommandLineModalOpen = useAppStore((state) => state.isCommandLineModalOpen);
  const setCommandLineModalOpen = useAppStore((state) => state.setCommandLineModalOpen);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  useEffect(() => {
    let unlistenOpen: (() => void) | undefined;
    let unlistenAi: (() => void) | undefined;

    listen<{ command?: string }>("open-command-line-modal", (event) => {
      setCommandLineModalOpen(true);
      if (event.payload?.command) {
        setPendingCommand(event.payload.command);
      }
    }).then((fn) => (unlistenOpen = fn));

    listen<{ command?: string }>("execute-command-from-ai", (event) => {
      setCommandLineModalOpen(true);
      if (event.payload?.command) {
        setPendingCommand(event.payload.command);
      }
    }).then((fn) => (unlistenAi = fn));

    return () => {
      if (unlistenOpen) unlistenOpen();
      if (unlistenAi) unlistenAi();
    };
  }, [setCommandLineModalOpen]);

  return (
    <Dialog
      open={isCommandLineModalOpen}
      onOpenChange={(_, data) => setCommandLineModalOpen(data.open)}
      modalType="modal"
    >
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody className={styles.dialogBody}>
          <React.Suspense fallback={null}>
            <CommandExecutePanel
              onClose={() => setCommandLineModalOpen(false)}
              initialCommand={pendingCommand}
              onClearInitialCommand={() => setPendingCommand(null)}
            />
          </React.Suspense>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CommandLineModal;
