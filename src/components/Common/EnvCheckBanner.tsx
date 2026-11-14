import React, { useState } from "react";
import { MessageBar, MessageBarBody, MessageBarTitle, Button } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";

/**
 * 启动环境检测横幅：当 adb / fastboot 工具链不可用时，展示一条可关闭的提醒。
 * 非阻断式——不打断主流程，关闭后本次会话内不再出现（状态栏指示器仍常驻显示）。
 */
export const EnvCheckBanner: React.FC = () => {
  const envStatus = useAppStore((s) => s.envStatus);
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!envStatus || dismissed) return null;

  const badTools = [
    envStatus.adb !== "ok" ? t("env.adb") : null,
    envStatus.fastboot !== "ok" ? t("env.fastboot") : null,
  ].filter(Boolean) as string[];

  if (badTools.length === 0) return null;

  // 仅当后端明确返回不可用时用 error，未知（探测异常）降级为 warning，避免误报
  const hasUnavailable = envStatus.adb === "unavailable" || envStatus.fastboot === "unavailable";
  const intent = hasUnavailable ? "error" : "warning";

  return (
    <MessageBar intent={intent} style={{ margin: "12px 16px 0" }}>
      <MessageBarBody>
        <MessageBarTitle>{t("env.banner_title")}</MessageBarTitle>
        {t("env.banner_desc", { tools: badTools.join("、") })}
        <Button
          appearance="subtle"
          size="small"
          style={{ marginLeft: "auto" }}
          onClick={() => setDismissed(true)}
        >
          {t("common.close")}
        </Button>
      </MessageBarBody>
    </MessageBar>
  );
};

export default EnvCheckBanner;
