import React from "react";
import { makeStyles } from "@fluentui/react-components";
import ConsoleTitleBar from "./ConsoleTitleBar";
import AIChatPanel from "@/components/Console/AIChatPanel";

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
  },
});

const AIChatWindow: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <ConsoleTitleBar />
      <div className={styles.content}>
        <AIChatPanel />
      </div>
    </div>
  );
};

export default AIChatWindow;
