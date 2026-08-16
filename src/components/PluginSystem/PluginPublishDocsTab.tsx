import React from "react";
import {
  makeStyles,
  shorthands,
  Button,
  Text,
  Badge,
  Card,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Filled,
  Warning24Regular,
  ShieldCheckmark24Regular,
  ShareAndroid24Regular,
  Branch24Regular,
  DocumentSparkle24Regular,
  Open24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
    overflowY: "auto",
    paddingRight: "4px",
  },
  header: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.padding("16px 20px"),
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
  },
  card: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("20px"),
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
  },
  stepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "12px",
    backgroundColor: "var(--colorNeutralBackground2)",
    ...shorthands.borderRadius("8px"),
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: "var(--colorBrandBackground1)",
    color: "var(--colorBrandForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "13px",
    flexShrink: 0,
  },
  bulletList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "4px",
  },
  bulletItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
    color: "var(--colorNeutralForeground2)",
    lineHeight: "1.5",
  },
});

const PluginPublishDocsTab: React.FC = () => {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      {/* 头部标题 */}
      <div className={styles.header}>
        <Text weight="bold" size={400}>
          {t("plugin_system.docs.publish_title", "ADMT 插件上架与审核规范")}
        </Text>
        <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
          面向开源社区与官方插件生态的打包、安全准入、合规审查与持续发布指南
        </div>
      </div>

      {/* 1. 上架全流程 */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Branch24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "20px" }} />
          <Text weight="bold" size={300}>
            插件发布与上架到官方商店全流程
          </Text>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <div>
              <div style={{ fontWeight: "600", fontSize: "13px" }}>本地测试与打包打包</div>
              <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
                确保 <code>manifest.json</code> 格式无误，将代码与资源打包为 <code>.admt-plugin</code>（ZIP 格式压缩包），并通过本地导入面板验证各项功能。
              </div>
            </div>
          </div>

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <div>
              <div style={{ fontWeight: "600", fontSize: "13px" }}>提交 GitHub 仓库与 PR</div>
              <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
                Fork 官方插件仓库 <code>LACS-Official/admt-plugins</code>，在 <code>plugins/</code> 目录下添加你的插件元数据与发布 Release 链接，提交 Pull Request。
              </div>
            </div>
          </div>

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <div>
              <div style={{ fontWeight: "600", fontSize: "13px" }}>CI 自动化安全审查与人工审核</div>
              <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
                GitHub Actions 将自动扫描权限申请、恶意代码特征与病毒查杀，领创开发团队成员将在 48 小时内完成人工代码合规审核并合并。
              </div>
            </div>
          </div>

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>4</div>
            <div>
              <div style={{ fontWeight: "600", fontSize: "13px" }}>全球同步与在线商店上架</div>
              <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginTop: "2px" }}>
                合并完成后，官方 CDN 将自动同步元数据，所有 ADMT 用户即可在“插件商店”中一键搜索与安装你的插件！
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 安全合规底线 */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheckmark24Regular style={{ color: "var(--colorPaletteGreenForeground1)", fontSize: "20px" }} />
          <Text weight="bold" size={300}>
            安全审核与权限申请准则 (红线原则)
          </Text>
        </div>

        <div className={styles.bulletList}>
          <div className={styles.bulletItem}>
            <CheckmarkCircle24Filled style={{ color: "#107c41", fontSize: "16px", marginTop: "2px" }} />
            <span>
              <strong>最小特权原则：</strong>仅申请插件核心业务所需的权限，如仅读取设备信息勿申请全量 Fastboot 刷写权限。
            </span>
          </div>
          <div className={styles.bulletItem}>
            <CheckmarkCircle24Filled style={{ color: "#107c41", fontSize: "16px", marginTop: "2px" }} />
            <span>
              <strong>高危操作二次确认：</strong>涉及擦除数据 (fastboot erase/format)、格机或刷入第三方分区的操作，必须通过 <code>context.ui.showModal</code> 引导用户显式确认。
            </span>
          </div>
          <div className={styles.bulletItem}>
            <Warning24Regular style={{ color: "var(--colorPaletteRedForeground1)", fontSize: "16px", marginTop: "2px" }} />
            <span>
              <strong>严禁恶意行为：</strong>严禁包含静默植入后门、未经许可上传用户私有文件、挖矿脚本或暗刷流量，违者永久列入黑名单。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginPublishDocsTab;
