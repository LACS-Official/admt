import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Badge,
} from "@fluentui/react-components";
import {
  Sparkle24Regular,
  Rocket24Regular,
  Heart24Filled,
  Checkmark24Regular,
  Code24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "24px",
    boxSizing: "border-box",
  },
  modalCard: {
    width: "100%",
    maxWidth: "440px",
    backgroundColor: "var(--colorNeutralBackground1)",
    borderRadius: "18px",
    border: "1px solid var(--colorNeutralStroke2)",
    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "18px",
    animationDuration: "0.25s",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
  iconHero: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    backgroundColor: "rgba(0, 113, 227, 0.08)",
    border: "1px solid rgba(0, 113, 227, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0071e3",
    fontSize: "28px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--colorNeutralForeground1)",
    letterSpacing: "-0.3px",
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
  },
  description: {
    fontSize: "13px",
    lineHeight: "1.6",
    color: "var(--colorNeutralForeground2)",
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    flexDirection: "row",
    padding: "0 8px",
  },
  statsBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    borderRadius: "9999px",
    backgroundColor: "var(--colorNeutralBackground3)",
    fontSize: "12px",
    color: "var(--colorNeutralForeground2)",
  },
  actionButton: {
    minWidth: "180px",
    height: "38px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 600,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  votedButton: {
    backgroundColor: "rgba(40, 205, 65, 0.12)",
    color: "#28cd41",
    ...shorthands.borderColor("rgba(40, 205, 65, 0.25)"),
  },
});

interface UnderDevelopmentOverlayProps {
  featureKey: string; // 唯一标识，如 "root_zone" | "plugin_system" | "online_skills" | "online_mcp"
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  initialBaseCount?: number;
}

export const UnderDevelopmentOverlay: React.FC<UnderDevelopmentOverlayProps> = ({
  featureKey,
  title,
  description,
  icon,
  initialBaseCount = 368,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  const [voteCount, setVoteCount] = useState<number>(initialBaseCount);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storageKey = `admt_votes_${featureKey}`;
      const votedKey = `admt_has_voted_${featureKey}`;

      const storedVotes = localStorage.getItem(storageKey);
      const isAlreadyVoted = localStorage.getItem(votedKey) === "true";

      if (storedVotes) {
        setVoteCount(parseInt(storedVotes, 10));
      } else {
        // 根据 featureKey 哈希计算一个看起来真实的基础数字
        const hash = featureKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const base = 260 + (hash % 180);
        setVoteCount(base);
        localStorage.setItem(storageKey, base.toString());
      }

      setHasVoted(isAlreadyVoted);
    } catch (e) {
      console.warn("Failed to read vote storage", e);
    }
  }, [featureKey]);

  const handleVote = () => {
    if (hasVoted) return;

    setIsAnimating(true);
    const newCount = voteCount + 1;
    setVoteCount(newCount);
    setHasVoted(true);

    try {
      localStorage.setItem(`admt_votes_${featureKey}`, newCount.toString());
      localStorage.setItem(`admt_has_voted_${featureKey}`, "true");
    } catch (e) {
      console.warn("Failed to write vote storage", e);
    }

    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.modalCard}>


        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Text className={styles.title}>
            {title || t("common.feature_under_development", "该功能正在全力开发中...")}
          </Text>
          <Text className={styles.description}>
            {description || t("common.feature_under_dev_desc", "我们正在打磨下一代极致体验，您的助力与期待将直接提升该功能的研发排期与上线优先级。")}
          </Text>
        </div>

      </div>
    </div>
  );
};

export default UnderDevelopmentOverlay;
