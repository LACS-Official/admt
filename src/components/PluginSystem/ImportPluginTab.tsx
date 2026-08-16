import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  Input,
  Text,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner,
  tokens,
  Card,
} from "@fluentui/react-components";
import {
  ArrowUpload24Regular,
  Globe24Regular,
  FolderOpen24Regular,
  ShieldCheckmark24Regular,
  Warning24Regular,
  CheckmarkCircle24Filled,
  Apps24Regular,
  Dismiss24Regular,
  Code24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { usePluginStore } from "../../stores/pluginStore";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    height: "100%",
    overflowY: "auto",
    paddingRight: "4px",
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    "@media (max-width: 800px)": {
      gridTemplateColumns: "1fr",
    },
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
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  iconBadge: {
    width: "36px",
    height: "36px",
    ...shorthands.borderRadius("8px"),
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },
  dropZone: {
    ...shorthands.border("2px", "dashed", "var(--colorNeutralStroke1)"),
    ...shorthands.borderRadius("10px"),
    ...shorthands.padding("32px", "16px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    backgroundColor: "var(--colorNeutralBackground2)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      ...shorthands.borderColor("var(--colorBrandStroke1)"),
    },
  },
  permissionList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    backgroundColor: "var(--colorNeutralBackground3)",
    ...shorthands.padding("12px"),
    ...shorthands.borderRadius("8px"),
    maxHeight: "180px",
    overflowY: "auto",
  },
  presetExamples: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px 20px"),
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
});

interface Props {
  onInstallSuccess?: () => void;
}

const ImportPluginTab: React.FC<Props> = ({ onInstallSuccess }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();
  const importLocalPlugin = usePluginStore((state) => state.importLocalPlugin);

  const [remoteUrl, setRemoteUrl] = useState("");
  const [isParsingRemote, setIsParsingRemote] = useState(false);
  const [pendingManifest, setPendingManifest] = useState<any | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const samplePluginManifest = {
    id: "com.community.fastboot.slotfix",
    name: "A/B 槽位引导智能修复器",
    nameEn: "A/B Slot Boot Fixer",
    version: "1.0.0",
    description: "自动侦测当前损坏的 Slot A/B 引导槽位并一键切换活跃槽位，修复卡 Fastboot 变砖问题。",
    author: { name: "Community Android Dev", url: "https://github.com" },
    category: "flash",
    tags: ["AB槽位", "Fastboot", "引导修复", "救砖"],
    permissions: ["fastboot:execute", "device:info", "ui:toast"],
    settingsSchema: [
      {
        id: "autoReboot",
        name: "切换槽位后自动重启",
        type: "boolean",
        default: true,
      },
    ],
  };

  const handleSelectLocalFile = () => {
    // 模拟选择本地插件包并解析 Manifest
    setPendingManifest(samplePluginManifest);
    setIsReviewOpen(true);
  };

  const handleParseRemoteUrl = async () => {
    if (!remoteUrl.trim()) {
      setStatusBarMessage({
        type: "warning",
        message: "请输入有效的远程插件 URL 或 Git 仓库地址",
      });
      return;
    }

    setIsParsingRemote(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // 模拟从远程拉取 manifest.json
      const remoteManifest = {
        id: "com.remote.device.tweaks",
        name: "远程开源 Android 性能微调模块",
        nameEn: "Remote Android Tweaks",
        version: "2.0.0",
        description: `从远程仓库 ${remoteUrl} 载入的性能优化插件。`,
        author: { name: "Git Remote Dev" },
        category: "tuning",
        tags: ["远程安装", "优化", "Git"],
        permissions: ["adb:execute", "device:info"],
      };

      setPendingManifest(remoteManifest);
      setIsReviewOpen(true);
    } catch (e) {
      setStatusBarMessage({
        type: "error",
        message: "远程插件清单获取失败，请检查 URL 是否可访问",
      });
    } finally {
      setIsParsingRemote(false);
    }
  };

  const handleConfirmInstall = async () => {
    if (!pendingManifest) return;

    const res = await importLocalPlugin(pendingManifest, "local");
    if (res.success) {
      setStatusBarMessage({
        type: "success",
        message: res.message,
      });
      setIsReviewOpen(false);
      setPendingManifest(null);
      setRemoteUrl("");
      if (onInstallSuccess) {
        onInstallSuccess();
      }
    } else {
      setStatusBarMessage({
        type: "error",
        message: res.message,
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionGrid}>
        {/* 本地安装卡片 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBadge}>
              <ArrowUpload24Regular />
            </div>
            <div>
              <Text weight="bold" size={300}>
                {t("plugin_system.import.local_title", "本地安装插件")}
              </Text>
              <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)" }}>
                {t("plugin_system.import.local_desc", "支持导入 .admt-plugin / .zip / manifest.json 本地插件包")}
              </div>
            </div>
          </div>

          <div className={styles.dropZone} onClick={handleSelectLocalFile}>
            <ArrowUpload24Regular style={{ fontSize: "36px", color: "var(--colorBrandForeground1)" }} />
            <Text weight="semibold" size={300}>
              {t("plugin_system.import.drag_or_click", "点击或拖拽插件包到此处进行安装")}
            </Text>
            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
              系统将自动进行格式校验与权限安全审查
            </Text>
          </div>

          <Button appearance="secondary" icon={<FolderOpen24Regular />} onClick={handleSelectLocalFile}>
            选择本地文件...
          </Button>
        </div>

        {/* 远程在线安装卡片 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBadge}>
              <Globe24Regular />
            </div>
            <div>
              <Text weight="bold" size={300}>
                {t("plugin_system.import.online_title", "远程在线导入")}
              </Text>
              <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)" }}>
                {t("plugin_system.import.online_desc", "从 Git 仓库或远程清单 URL 直接安装")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            <Input
              placeholder={t(
                "plugin_system.import.url_placeholder",
                "https://github.com/user/plugin-repo 或 manifest.json 链接"
              )}
              value={remoteUrl}
              onChange={(_, data) => setRemoteUrl(data.value)}
            />
            <Button
              appearance="primary"
              icon={isParsingRemote ? <Spinner size="tiny" /> : <ArrowUpload24Regular />}
              disabled={isParsingRemote || !remoteUrl.trim()}
              onClick={handleParseRemoteUrl}
            >
              {isParsingRemote ? "正在解析远程仓库..." : t("plugin_system.import.install_btn", "解析并安装")}
            </Button>
          </div>

          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--colorNeutralBackground2)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--colorNeutralForeground3)",
              lineHeight: "1.4",
              marginTop: "auto",
            }}
          >
            💡 提示：仅支持安装符合 ADMT 插件标准规范且包含完整 <code>manifest.json</code> 的开源仓库。
          </div>
        </div>
      </div>

      {/* 预置开发者测试示例 */}
      <div className={styles.presetExamples}>
        <Text weight="bold" size={300} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Code24Regular style={{ color: "var(--colorBrandForeground1)" }} />
          快速测试体验 (开发者预制包)
        </Text>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <span style={{ fontWeight: "600", fontSize: "13px" }}>A/B 槽位引导智能修复器 (Demo)</span>
            <span style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", marginLeft: "8px" }}>
              com.community.fastboot.slotfix • v1.0.0
            </span>
          </div>
          <Button size="small" appearance="secondary" onClick={() => handleSelectLocalFile()}>
            一键载入测试
          </Button>
        </div>
      </div>

      {/* 权限安全审查确认弹窗 */}
      <Dialog open={isReviewOpen} onOpenChange={(_, data) => !data.open && setIsReviewOpen(false)}>
        <DialogSurface style={{ maxWidth: "520px" }}>
          {pendingManifest && (
            <DialogBody>
              <DialogTitle action={<Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setIsReviewOpen(false)} />}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheckmark24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />
                  <span>{t("plugin_system.import.permission_review", "插件权限安全审查")}</span>
                </div>
              </DialogTitle>
              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ padding: "8px 12px", backgroundColor: "var(--colorNeutralBackground2)", borderRadius: "8px" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{pendingManifest.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                    ID: {pendingManifest.id} • 作者: {pendingManifest.author?.name || "未知"}
                  </div>
                </div>

                <div>
                  <Text size={200} weight="semibold" style={{ color: "var(--colorNeutralForeground3)" }}>
                    {t("plugin_system.import.permission_review_desc", "该插件申请了以下系统特权，请仔细确认来源安全：")}
                  </Text>
                  <div className={styles.permissionList} style={{ marginTop: "6px" }}>
                    {pendingManifest.permissions?.map((perm: string, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <Badge size="small" appearance="tint" color="brand">
                          {perm}
                        </Badge>
                        <span style={{ color: "var(--colorNeutralForeground2)" }}>
                          {perm === "adb:execute"
                            ? "允许向已连接设备发送并执行 ADB 命令行"
                            : perm === "fastboot:execute"
                            ? "允许在引导模式下执行 Fastboot 刷写或分区操作"
                            : perm === "device:info"
                            ? "允许读取设备型号、系统代号及硬件参数"
                            : perm}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setIsReviewOpen(false)}>
                  取消安装
                </Button>
                <Button appearance="primary" onClick={handleConfirmInstall}>
                  {t("plugin_system.import.confirm_install", "确认安装并信任")}
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ImportPluginTab;
