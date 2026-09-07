import React, { useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  makeStyles,
} from "@fluentui/react-components";
import { listen } from "@tauri-apps/api/event";
import { useAppStore } from "../../stores/appStore";
import { LogsPanel } from "../Others/LogsPanel";

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

export const LogsModal: React.FC = () => {
  const styles = useStyles();
  const isLogsModalOpen = useAppStore((state) => state.isLogsModalOpen);
  const setLogsModalOpen = useAppStore((state) => state.setLogsModalOpen);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("open-logs-modal", () => {
      setLogsModalOpen(true);
    }).then((fn) => (unlisten = fn));

    return () => {
      if (unlisten) unlisten();
    };
  }, [setLogsModalOpen]);

  return (
    <Dialog
      open={isLogsModalOpen}
      onOpenChange={(_, data) => setLogsModalOpen(data.open)}
      modalType="modal"
    >
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody className={styles.dialogBody}>
          <LogsPanel onClose={() => setLogsModalOpen(false)} />
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default LogsModal;
