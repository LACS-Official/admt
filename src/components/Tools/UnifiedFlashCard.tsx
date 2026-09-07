import React, { useState } from "react";
import { makeStyles, TabList, Tab, Text } from "@fluentui/react-components";
import { CloudArrowUp24Regular, Flash24Regular } from "@fluentui/react-icons";
import { DeviceInfo } from "../../types/device";
import ImageFlashCard from "./ImageFlashCard";
import XiaomiFlashCard from "./XiaomiFlashCard";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  },
  modeTabBar: {
    flexShrink: 0,
    alignSelf: "flex-start",
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px 4px",
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minHeight: "34px",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "5px 14px",
      minHeight: "28px",
      borderRadius: "9999px",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      border: "none",
      fontWeight: 500,
      color: "var(--colorNeutralForeground2)",
      margin: "0 2px",
      "&:hover": {
        backgroundColor: "var(--colorNeutralBackground1Hover)",
        color: "var(--colorNeutralForeground1)",
      },
      "&[aria-selected='true']": {
        backgroundColor: "var(--colorNeutralBackground1)",
        color: "var(--colorBrandForeground1)",
        boxShadow: "0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        fontWeight: 600,
      },
    },
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
});

export interface UnifiedFlashCardProps {
  device: DeviceInfo | null;
  onFastbootRequired?: () => void;
  initialMode?: "image" | "package";
}

export const UnifiedFlashCard: React.FC<UnifiedFlashCardProps> = ({
  device,
  onFastbootRequired,
  initialMode = "image",
}) => {
  const styles = useStyles();
  const [mode, setMode] = useState<"image" | "package">(initialMode);

  return (
    <div className={styles.container}>
      <TabList
        selectedValue={mode}
        onTabSelect={(_, data) => setMode(data.value as "image" | "package")}
        className={styles.modeTabBar}
      >
        <Tab value="image" icon={<CloudArrowUp24Regular />}>
          单镜像刷写 (.img 分区)
        </Tab>
        <Tab value="package" icon={<Flash24Regular />}>
          完整线刷包 (Fastboot ROM)
        </Tab>
      </TabList>

      <div className={styles.contentArea}>
        {mode === "image" ? (
          <ImageFlashCard device={device} onFastbootRequired={onFastbootRequired} />
        ) : (
          <XiaomiFlashCard device={device} onFastbootRequired={onFastbootRequired} />
        )}
      </div>
    </div>
  );
};

export default UnifiedFlashCard;
