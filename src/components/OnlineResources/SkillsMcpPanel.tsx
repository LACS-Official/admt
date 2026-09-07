import React, { useState } from "react";
import { makeStyles, TabList, Tab } from "@fluentui/react-components";
import { Brain24Regular, Server24Regular } from "@fluentui/react-icons";
import SkillsResourcesPanel from "./SkillsResourcesPanel";
import McpResourcesPanel from "./McpResourcesPanel";

const useStyles = makeStyles({
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minHeight: 0,
    overflow: "hidden",
  },
  subHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexShrink: 0,
  },
  subTabList: {
    backgroundColor: "var(--colorNeutralBackground3)",
    borderRadius: "9999px",
    padding: "3px",
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--colorNeutralStroke2)",
    "& .fui-Tab": {
      fontSize: "12px",
      padding: "5px 14px",
      minHeight: "28px",
      borderRadius: "9999px",
      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
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
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
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

export const SkillsMcpPanel: React.FC = () => {
  const styles = useStyles();
  const [activeSubTab, setActiveSubTab] = useState<"skills" | "mcp">("skills");

  return (
    <div className={styles.container}>
      <div className={styles.subHeader}>
        <TabList
          selectedValue={activeSubTab}
          onTabSelect={(_, data) => setActiveSubTab(data.value as "skills" | "mcp")}
          className={styles.subTabList}
        >
          <Tab value="skills" icon={<Brain24Regular />}>
            Skills 技能库
          </Tab>
          <Tab value="mcp" icon={<Server24Regular />}>
            MCP 服务与工具
          </Tab>
        </TabList>
      </div>
      <div className={styles.contentArea}>
        {activeSubTab === "skills" ? <SkillsResourcesPanel /> : <McpResourcesPanel />}
      </div>
    </div>
  );
};

export default SkillsMcpPanel;
