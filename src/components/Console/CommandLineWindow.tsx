import React from "react";
import { makeStyles } from "@fluentui/react-components";
import ConsoleTitleBar from "./ConsoleTitleBar";
import CommandExecutePanel from "../Others/CommandExecutePanel";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: "16px",
  },
});

const CommandLineWindow: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <ConsoleTitleBar />
      <div className={styles.content}>
        <CommandExecutePanel />
      </div>
    </div>
  );
};

export default CommandLineWindow;
