import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  Switch,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Text,
  tokens,
  Tooltip,
} from "@fluentui/react-components";
import {
  Play24Regular,
  Settings24Regular,
  Delete24Regular,
  Info24Regular,
  AppsAddIn24Regular,
  Code24Regular,
  Wrench24Regular,
  Flash24Regular,
  Sparkle24Regular,
  Dismiss24Regular,
  Search24Regular,
  ArrowReset24Regular,
  Globe24Regular,
  Open24Regular,
  HeartPulse24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { usePluginStore } from "../../stores/pluginStore";
import { ADMTPlugin, PluginCategory } from "../../types/plugin";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    height: "100%",
    overflowY: "auto",
    paddingRight: "4px",
  },
  topFilterBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("10px"),
    ...shorthands.padding("8px 12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
    flexWrap: "wrap",
    gap: "10px",
  },
  categoryNav: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  catButton: {
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid transparent",
  },
  catButtonActive: {
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    border: "1px solid var(--colorBrandStroke2)",
    fontWeight: 600,
  },
  pluginGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "14px",
  },
  pluginCard: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    "&:hover": {
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
      ...shorthands.borderColor("var(--colorBrandStroke2)"),
      transform: "translateY(-1px)",
    },
  },
  pluginCardDisabled: {
    opacity: 0.6,
    backgroundColor: "var(--colorNeutralBackground2)",
    cursor: "default",
    "&:hover": {
      transform: "none",
      boxShadow: "none",
    },
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "10px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: "40px",
    height: "40px",
    ...shorthands.borderRadius("10px"),
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  titleMeta: {
    flex: 1,
    minWidth: 0,
  },
  pluginName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  descText: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.45",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "35px",
  },
  tagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  tagBadge: {
    fontSize: "11px",
    ...shorthands.padding("2px", "6px"),
    backgroundColor: "var(--colorNeutralBackground3)",
    color: "var(--colorNeutralForeground2)",
    ...shorthands.borderRadius("4px"),
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "10px",
    ...shorthands.borderTop("1px", "solid", "var(--colorNeutralStroke3)"),
    marginTop: "auto",
  },
  footerActions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
    gap: "14px",
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "dashed", "var(--colorNeutralStroke2)"),
    color: "var(--colorNeutralForeground3)",
  },
  guiIframe: {
    width: "100%",
    height: "560px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
});

interface Props {
  onGoToStore?: () => void;
  onGoToImport?: () => void;
}

const InstalledPluginsTab: React.FC<Props> = ({ onGoToStore, onGoToImport }) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const { setStatusBarMessage } = useAppStore();

  const installedPlugins = usePluginStore((state) => state.installedPlugins);
  const togglePlugin = usePluginStore((state) => state.togglePlugin);
  const uninstallPlugin = usePluginStore((state) => state.uninstallPlugin);
  const updatePluginSettings = usePluginStore((state) => state.updatePluginSettings);
  const openPluginGui = usePluginStore((state) => state.openPluginGui);
  const closePluginGui = usePluginStore((state) => state.closePluginGui);
  const isGuiModalOpen = usePluginStore((state) => state.isGuiModalOpen);
  const activeGuiPlugin = usePluginStore((state) => state.activeGuiPlugin);
  const resetToBuiltinPlugins = usePluginStore((state) => state.resetToBuiltinPlugins);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [settingsPlugin, setSettingsPlugin] = useState<ADMTPlugin | null>(null);
  const [tempSettings, setTempSettings] = useState<Record<string, any>>({});
  const [uninstallTarget, setUninstallTarget] = useState<ADMTPlugin | null>(null);

  const categories = [
    { id: "all", label: "全部插件", count: installedPlugins.length },
    { id: "life", label: "🛋️ 生活助手", count: installedPlugins.filter((p) => p.manifest.category === "life").length },
    { id: "dev", label: "🛠️ 开发利器", count: installedPlugins.filter((p) => p.manifest.category === "dev").length },
    { id: "common", label: "📦 常用工具", count: installedPlugins.filter((p) => p.manifest.category === "common").length },
  ];

  const filteredPlugins = installedPlugins.filter((p) => {
    const matchCategory = filterCategory === "all" || p.manifest.category === filterCategory;
    const matchSearch =
      !searchFilter.trim() ||
      p.manifest.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.manifest.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.manifest.tags && p.manifest.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase())));
    return matchCategory && matchSearch;
  });

  const getCategoryIcon = (category: PluginCategory) => {
    switch (category) {
      case "life":
        return "🛋️";
      case "dev":
        return "🛠️";
      case "common":
        return "📦";
      case "flash":
        return "⚡";
      case "tuning":
        return "🏎️";
      case "ai":
        return "✨";
      default:
        return "🧩";
    }
  };

  const handleCardClick = (plugin: ADMTPlugin, e: React.MouseEvent) => {
    // 避免点击开关或功能按钮时触发卡片点击
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".fui-Switch")) {
      return;
    }
    if (!plugin.isEnabled) {
      setStatusBarMessage({
        type: "warning",
        message: `插件【${plugin.manifest.name}】处于已禁用状态，请先开启右上角开关`,
      });
      return;
    }
    openPluginGui(plugin);
  };

  const handleOpenSettings = (plugin: ADMTPlugin, e: React.MouseEvent) => {
    e.stopPropagation();
    setSettingsPlugin(plugin);
    setTempSettings(plugin.settings || {});
  };

  const handleSaveSettings = () => {
    if (settingsPlugin) {
      updatePluginSettings(settingsPlugin.manifest.id, tempSettings);
      setStatusBarMessage({
        type: "success",
        message: `插件【${settingsPlugin.manifest.name}】配置已更新保存`,
      });
      setSettingsPlugin(null);
    }
  };

  const handleConfirmUninstall = async () => {
    if (uninstallTarget) {
      await uninstallPlugin(uninstallTarget.manifest.id);
      setStatusBarMessage({
        type: "success",
        message: t("plugin_system.installed.uninstall_success", "插件卸载成功"),
      });
      setUninstallTarget(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部分类与搜索过滤栏 */}
      <div className={styles.topFilterBar}>
        <div className={styles.categoryNav}>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="small"
              appearance={filterCategory === cat.id ? "primary" : "subtle"}
              className={`${styles.catButton} ${filterCategory === cat.id ? styles.catButtonActive : ""}`}
              onClick={() => setFilterCategory(cat.id)}
            >
              {cat.label} ({cat.count})
            </Button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Input
            size="small"
            placeholder="搜索已安装插件..."
            contentBefore={<Search24Regular />}
            value={searchFilter}
            onChange={(_, data) => setSearchFilter(data.value)}
            style={{ width: "180px" }}
          />

          <Tooltip content="一键恢复所有官方生活/开发/常用内置插件" relationship="label">
            <Button
              size="small"
              appearance="subtle"
              icon={<ArrowReset24Regular />}
              onClick={() => {
                resetToBuiltinPlugins();
                setStatusBarMessage({
                  type: "success",
                  message: "已重置并载入 14 款官方精选生活/开发/常用内置插件",
                });
              }}
            >
              重置预置
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 插件卡片网格列表 */}
      {filteredPlugins.length === 0 ? (
        <div className={styles.emptyBox}>
          <AppsAddIn24Regular style={{ fontSize: "44px", color: "var(--colorBrandForeground1)" }} />
          <Text weight="bold" size={400}>
            {t("plugin_system.installed.empty_title", "暂无符合条件的插件")}
          </Text>
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            可点击右上角「重置预置」快速载入 14 款官方内置生活、开发与常用工具插件
          </Text>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <Button appearance="primary" icon={<ArrowReset24Regular />} onClick={resetToBuiltinPlugins}>
              重置载入内置插件
            </Button>
            {onGoToStore && (
              <Button appearance="secondary" onClick={onGoToStore}>
                前往插件商店
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.pluginGrid}>
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.manifest.id}
              className={`${styles.pluginCard} ${!plugin.isEnabled ? styles.pluginCardDisabled : ""}`}
              onClick={(e) => handleCardClick(plugin, e)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                  <div className={styles.iconBox}>
                    <span style={{ fontSize: "20px" }}>{getCategoryIcon(plugin.manifest.category)}</span>
                  </div>
                  <div className={styles.titleMeta}>
                    <div className={styles.pluginName}>{plugin.manifest.name}</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        color: "var(--colorNeutralForeground3)",
                        marginTop: "2px",
                      }}
                    >
                      <span>v{plugin.manifest.version}</span>
                      <span>•</span>
                      <span>{plugin.manifest.author.name}</span>
                      <Badge
                        size="small"
                        appearance="tint"
                        color={plugin.manifest.category === "life" ? "success" : plugin.manifest.category === "dev" ? "brand" : "informative"}
                      >
                        {plugin.manifest.category === "life" ? "生活" : plugin.manifest.category === "dev" ? "开发" : "常用"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Tooltip content={plugin.isEnabled ? "点击禁用插件" : "点击启用插件"} relationship="label">
                  <Switch
                    checked={plugin.isEnabled}
                    onChange={(_, data) => togglePlugin(plugin.manifest.id, data.checked)}
                  />
                </Tooltip>
              </div>

              <div className={styles.descText}>{plugin.manifest.description}</div>

              {plugin.manifest.tags && (
                <div className={styles.tagRow}>
                  {plugin.manifest.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className={styles.tagBadge}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.cardFooter}>
                <div style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                  评分: ★ {plugin.rating || 4.9}
                </div>

                <div className={styles.footerActions}>
                  {plugin.manifest.settingsSchema && plugin.manifest.settingsSchema.length > 0 && (
                    <Tooltip content="插件参数设置" relationship="label">
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Settings24Regular />}
                        disabled={!plugin.isEnabled}
                        onClick={(e) => handleOpenSettings(plugin, e)}
                      />
                    </Tooltip>
                  )}

                  <Tooltip content="卸载插件" relationship="label">
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Delete24Regular style={{ color: "var(--colorPaletteRedForeground1)" }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setUninstallTarget(plugin);
                      }}
                    />
                  </Tooltip>

                  <Button
                    size="small"
                    appearance="primary"
                    icon={<Open24Regular />}
                    disabled={!plugin.isEnabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPluginGui(plugin);
                    }}
                  >
                    打开界面
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 插件原生 HTML GUI 交互弹窗 (全屏/大尺寸二级窗口) */}
      <Dialog open={isGuiModalOpen} onOpenChange={(_, data) => !data.open && closePluginGui()}>
        <DialogSurface style={{ maxWidth: "880px", width: "90vw", padding: "16px" }}>
          {activeGuiPlugin && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    onClick={closePluginGui}
                  />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className={styles.iconBox} style={{ width: "32px", height: "32px", fontSize: "16px" }}>
                    <span>{getCategoryIcon(activeGuiPlugin.manifest.category)}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>{activeGuiPlugin.manifest.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)", fontWeight: 400 }}>
                      v{activeGuiPlugin.manifest.version} · {activeGuiPlugin.manifest.author.name} · 内置交互式 GUI
                    </div>
                  </div>
                </div>
              </DialogTitle>

              <DialogContent style={{ padding: "8px 0" }}>
                {activeGuiPlugin.manifest.guiHtml ? (
                  <iframe
                    className={styles.guiIframe}
                    srcDoc={activeGuiPlugin.manifest.guiHtml}
                    sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                    title={activeGuiPlugin.manifest.name}
                  />
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--colorNeutralForeground3)" }}>
                    该插件尚未配置可视化 HTML GUI 界面。
                  </div>
                )}
              </DialogContent>

              <DialogActions>
                <Button appearance="secondary" onClick={closePluginGui}>
                  关闭窗口
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>

      {/* 插件参数设置弹窗 */}
      <Dialog open={!!settingsPlugin} onOpenChange={(_, data) => !data.open && setSettingsPlugin(null)}>
        <DialogSurface style={{ maxWidth: "520px" }}>
          {settingsPlugin && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    onClick={() => setSettingsPlugin(null)}
                  />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Settings24Regular style={{ color: "var(--colorBrandForeground1)" }} />
                  <span>插件配置: {settingsPlugin.manifest.name}</span>
                </div>
              </DialogTitle>
              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
                {settingsPlugin.manifest.settingsSchema?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      backgroundColor: "var(--colorNeutralBackground2)",
                      borderRadius: "8px",
                    }}
                  >
                    <div>
                      <Text weight="semibold" size={300}>
                        {item.name}
                      </Text>
                      {item.description && (
                        <div style={{ fontSize: "12px", color: "var(--colorNeutralForeground3)" }}>
                          {item.description}
                        </div>
                      )}
                    </div>

                    {item.type === "boolean" ? (
                      <Switch
                        checked={tempSettings[item.id] !== undefined ? tempSettings[item.id] : item.default}
                        onChange={(_, data) =>
                          setTempSettings((prev) => ({ ...prev, [item.id]: data.checked }))
                        }
                      />
                    ) : (
                      <Input
                        value={tempSettings[item.id] || item.default || ""}
                        onChange={(_, data) =>
                          setTempSettings((prev) => ({ ...prev, [item.id]: data.value }))
                        }
                        style={{ maxWidth: "160px" }}
                      />
                    )}
                  </div>
                ))}
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setSettingsPlugin(null)}>
                  取消
                </Button>
                <Button appearance="primary" onClick={handleSaveSettings}>
                  保存配置
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>

      {/* 卸载确认弹窗 */}
      <Dialog open={!!uninstallTarget} onOpenChange={(_, data) => !data.open && setUninstallTarget(null)}>
        <DialogSurface style={{ maxWidth: "420px" }}>
          {uninstallTarget && (
            <DialogBody>
              <DialogTitle>确认卸载插件</DialogTitle>
              <DialogContent>
                确定要卸载插件【{uninstallTarget.manifest.name}】吗？该插件的所有本地配置将被移除。
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={() => setUninstallTarget(null)}>
                  取消
                </Button>
                <Button appearance="primary" onClick={handleConfirmUninstall}>
                  确认卸载
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default InstalledPluginsTab;
