import React, { useState, useMemo } from "react";
import {
  makeStyles,
  shorthands,
  Button,
  SearchBox,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner,
  Text,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Tooltip,
} from "@fluentui/react-components";
import {
  Apps24Regular,
  Search24Regular,
  ArrowDownload24Regular,
  Checkmark24Regular,
  Star24Filled,
  Person24Regular,
  ShieldCheckmark24Regular,
  Tag24Regular,
  Code24Regular,
  Globe24Regular,
  Info24Regular,
  Dismiss24Regular,
  Sparkle24Regular,
  Wrench24Regular,
  Flash24Regular,
  TopSpeed24Regular,
} from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";
import { usePluginStore } from "../../stores/pluginStore";
import { PluginCategory, PluginStoreItem } from "../../types/plugin";
import { useAppStore } from "../../stores/appStore";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: "16px",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.padding("14px", "18px"),
    ...shorthands.borderRadius("10px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
  },
  headerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  titleArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--colorNeutralForeground1)",
  },
  subtitleText: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  searchBox: {
    minWidth: "260px",
    maxWidth: "360px",
  },
  categoryRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "2px",
    "::-webkit-scrollbar": {
      display: "none",
    },
  },
  categoryChip: {
    ...shorthands.padding("6px", "14px"),
    ...shorthands.borderRadius("18px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke1)"),
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground2)",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground2Hover)",
      color: "var(--colorNeutralForeground1)",
      transform: "translateY(-1px)",
    },
  },
  categoryChipActive: {
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    ...shorthands.borderColor("var(--colorBrandStroke2)"),
    fontWeight: "600",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.06)",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    paddingRight: "4px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    "@media (max-width: 860px)": {
      gridTemplateColumns: "1fr",
    },
  },
  pluginCard: {
    backgroundColor: "var(--colorNeutralBackground1)",
    ...shorthands.borderRadius("12px"),
    ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
      ...shorthands.borderColor("var(--colorBrandStroke2)"),
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  iconBox: {
    width: "44px",
    height: "44px",
    ...shorthands.borderRadius("10px"),
    backgroundColor: "var(--colorBrandBackground2)",
    color: "var(--colorBrandForeground1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  pluginName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    lineHeight: "1.3",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pluginDesc: {
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
    lineHeight: "1.4",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "34px",
  },
  tagList: {
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
  cardBottom: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "8px",
    ...shorthands.borderTop("1px", "solid", "var(--colorNeutralStroke3)"),
    marginTop: "auto",
  },
  statGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  starBadge: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "var(--colorPaletteGoldForeground1)",
    fontWeight: "600",
  },
  actionsGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "280px",
    gap: "12px",
    color: "var(--colorNeutralForeground3)",
  },
  detailSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "8px",
  },
  permissionBox: {
    ...shorthands.padding("10px", "14px"),
    backgroundColor: "var(--colorNeutralBackground3)",
    ...shorthands.borderRadius("8px"),
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
});

const PluginStorePanel: React.FC = () => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith("zh");
  const { setStatusBarMessage } = useAppStore();

  const storePlugins = usePluginStore((state) => state.storePlugins);
  const installedPlugins = usePluginStore((state) => state.installedPlugins);
  const installPlugin = usePluginStore((state) => state.installPlugin);
  const searchQuery = usePluginStore((state) => state.searchQuery);
  const setSearchQuery = usePluginStore((state) => state.setSearchQuery);
  const selectedCategory = usePluginStore((state) => state.selectedCategory);
  const setSelectedCategory = usePluginStore((state) => state.setSelectedCategory);

  const [detailPlugin, setDetailPlugin] = useState<PluginStoreItem | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: t("online_resources.plugin_store.categories.all", "全部插件"), icon: <Apps24Regular /> },
    { id: "life", label: "🛋️ 生活助手", icon: <Globe24Regular /> },
    { id: "dev", label: "🛠️ 开发利器", icon: <Code24Regular /> },
    { id: "common", label: "📦 常用工具", icon: <Wrench24Regular /> },
    { id: "flash", label: t("online_resources.plugin_store.categories.flash", "刷机救砖"), icon: <Flash24Regular /> },
    { id: "tuning", label: t("online_resources.plugin_store.categories.tuning", "系统调优"), icon: <TopSpeed24Regular /> },
    { id: "ai", label: t("online_resources.plugin_store.categories.ai", "AI 赋能"), icon: <Sparkle24Regular /> },
  ];

  const filteredPlugins = useMemo(() => {
    return storePlugins.filter((item) => {
      const matchCat = selectedCategory === "all" || item.manifest.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.manifest.name.toLowerCase().includes(q) ||
        (item.manifest.nameEn && item.manifest.nameEn.toLowerCase().includes(q)) ||
        item.manifest.description.toLowerCase().includes(q) ||
        item.manifest.author.name.toLowerCase().includes(q) ||
        (item.manifest.tags && item.manifest.tags.some((tag) => tag.toLowerCase().includes(q)));
      return matchCat && matchSearch;
    });
  }, [storePlugins, selectedCategory, searchQuery]);

  const handleInstall = async (plugin: PluginStoreItem) => {
    setInstallingId(plugin.manifest.id);
    try {
      await new Promise((r) => setTimeout(r, 600)); // 模拟网络包下载与校验
      await installPlugin(plugin);
      setStatusBarMessage({
        type: "success",
        message: t("online_resources.plugin_store.install_success", "插件已成功安装并启用！"),
      });
      if (detailPlugin?.manifest.id === plugin.manifest.id) {
        setDetailPlugin((prev) => (prev ? { ...prev, isInstalled: true, isEnabled: true } : null));
      }
    } catch (e) {
      setStatusBarMessage({
        type: "error",
        message: "插件安装失败，请检查网络或权限",
      });
    } finally {
      setInstallingId(null);
    }
  };

  const isItemInstalled = (pluginId: string) => {
    return installedPlugins.some((p) => p.manifest.id === pluginId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "flash":
        return <Flash24Regular />;
      case "tuning":
        return <TopSpeed24Regular />;
      case "ai":
        return <Sparkle24Regular />;
      case "tools":
      default:
        return <Wrench24Regular />;
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部搜索与分类筛选栏 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <Apps24Regular style={{ color: "var(--colorBrandForeground1)", fontSize: "24px" }} />
            <div>
              <div className={styles.titleText}>
                {t("online_resources.plugin_store.title", "ADMT 插件应用商店")}
              </div>
              <div className={styles.subtitleText}>
                {t("online_resources.plugin_store.subtitle", "探索官方与社区开发者精心打造的玩机与深度定制扩展插件")}
              </div>
            </div>
          </div>

          <SearchBox
            placeholder={t("online_resources.plugin_store.search_placeholder", "搜索插件名称、作者或功能标签...")}
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            className={styles.searchBox}
          />
        </div>

        <div className={styles.categoryRow}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`${styles.categoryChip} ${selectedCategory === cat.id ? styles.categoryChipActive : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 插件卡片列表 */}
      <div className={styles.content}>
        {filteredPlugins.length === 0 ? (
          <div className={styles.emptyState}>
            <Search24Regular style={{ fontSize: "40px", opacity: 0.5 }} />
            <Text>未搜索到符合条件的插件</Text>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredPlugins.map((plugin) => {
              const installed = isItemInstalled(plugin.manifest.id);
              const isInstalling = installingId === plugin.manifest.id;

              return (
                <div key={plugin.manifest.id} className={styles.pluginCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.iconBox}>{getCategoryIcon(plugin.manifest.category)}</div>
                    <div className={styles.cardMeta}>
                      <div className={styles.pluginName}>
                        {isZh ? plugin.manifest.name : plugin.manifest.nameEn || plugin.manifest.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--colorNeutralForeground3)" }}>
                        <span>v{plugin.manifest.version}</span>
                        <span>•</span>
                        <span>{plugin.manifest.author.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.pluginDesc}>
                    {isZh ? plugin.manifest.description : plugin.manifest.descriptionEn || plugin.manifest.description}
                  </div>

                  {plugin.manifest.tags && plugin.manifest.tags.length > 0 && (
                    <div className={styles.tagList}>
                      {plugin.manifest.tags.slice(0, 4).map((tag, idx) => (
                        <span key={idx} className={styles.tagBadge}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.cardBottom}>
                    <div className={styles.statGroup}>
                      {plugin.rating && (
                        <div className={styles.starBadge}>
                          <Star24Filled style={{ fontSize: "14px" }} />
                          <span>{plugin.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {plugin.downloadsCount && (
                        <div>
                          {plugin.downloadsCount > 10000
                            ? `${(plugin.downloadsCount / 10000).toFixed(1)}w+`
                            : plugin.downloadsCount}{" "}
                          次下载
                        </div>
                      )}
                    </div>

                    <div className={styles.actionsGroup}>
                      <Button size="small" appearance="subtle" onClick={() => setDetailPlugin(plugin)}>
                        {t("online_resources.plugin_store.view_details", "详情")}
                      </Button>
                      <Button
                        size="small"
                        appearance={installed ? "secondary" : "primary"}
                        icon={installed ? <Checkmark24Regular /> : <ArrowDownload24Regular />}
                        disabled={isInstalling || installed}
                        onClick={() => handleInstall(plugin)}
                      >
                        {isInstalling
                          ? t("online_resources.plugin_store.installing", "安装中...")
                          : installed
                          ? t("online_resources.plugin_store.installed", "已安装")
                          : t("online_resources.plugin_store.install", "在线安装")}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 插件详情与权限弹窗 */}
      <Dialog open={!!detailPlugin} onOpenChange={(_, data) => !data.open && setDetailPlugin(null)}>
        <DialogSurface style={{ maxWidth: "600px" }}>
          {detailPlugin && (
            <DialogBody>
              <DialogTitle
                action={
                  <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDetailPlugin(null)} />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className={styles.iconBox} style={{ width: "36px", height: "36px", fontSize: "18px" }}>
                    {getCategoryIcon(detailPlugin.manifest.category)}
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: "700" }}>
                      {isZh ? detailPlugin.manifest.name : detailPlugin.manifest.nameEn || detailPlugin.manifest.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--colorNeutralForeground3)", fontWeight: "normal" }}>
                      ID: {detailPlugin.manifest.id} • v{detailPlugin.manifest.version}
                    </div>
                  </div>
                </div>
              </DialogTitle>

              <DialogContent className={styles.detailSection}>
                <div>
                  <Text weight="semibold" size={300}>
                    功能简介
                  </Text>
                  <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: "1.5", color: "var(--colorNeutralForeground2)" }}>
                    {detailPlugin.manifest.description}
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div className={styles.permissionBox}>
                    <Text size={200} weight="semibold" style={{ color: "var(--colorNeutralForeground3)" }}>
                      开发者
                    </Text>
                    <Text size={300}>{detailPlugin.manifest.author.name}</Text>
                  </div>
                  <div className={styles.permissionBox}>
                    <Text size={200} weight="semibold" style={{ color: "var(--colorNeutralForeground3)" }}>
                      包体体积
                    </Text>
                    <Text size={300}>{detailPlugin.fileSize || "1.5 MB"}</Text>
                  </div>
                </div>

                <div>
                  <Text weight="semibold" size={300} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheckmark24Regular style={{ color: "var(--colorPaletteGreenForeground1)" }} />
                    {t("online_resources.plugin_store.permissions_required", "所需权限")}
                  </Text>
                  <div className={styles.permissionBox} style={{ marginTop: "6px" }}>
                    {detailPlugin.manifest.permissions.map((perm, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                        <Badge size="small" appearance="tint" color="brand">
                          {perm}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {detailPlugin.manifest.settingsSchema && detailPlugin.manifest.settingsSchema.length > 0 && (
                  <div>
                    <Text weight="semibold" size={300}>
                      支持的可配置项
                    </Text>
                    <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {detailPlugin.manifest.settingsSchema.map((setting) => (
                        <div
                          key={setting.id}
                          style={{
                            fontSize: "12px",
                            padding: "6px 10px",
                            backgroundColor: "var(--colorNeutralBackground2)",
                            borderRadius: "6px",
                          }}
                        >
                          <span style={{ fontWeight: "600" }}>{setting.name}</span>: {setting.description || setting.id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DialogContent>

              <DialogActions>
                <Button appearance="secondary" onClick={() => setDetailPlugin(null)}>
                  关闭
                </Button>
                <Button
                  appearance={isItemInstalled(detailPlugin.manifest.id) ? "secondary" : "primary"}
                  icon={isItemInstalled(detailPlugin.manifest.id) ? <Checkmark24Regular /> : <ArrowDownload24Regular />}
                  disabled={installingId === detailPlugin.manifest.id || isItemInstalled(detailPlugin.manifest.id)}
                  onClick={() => handleInstall(detailPlugin)}
                >
                  {isItemInstalled(detailPlugin.manifest.id) ? "已就绪" : "立即安装到系统"}
                </Button>
              </DialogActions>
            </DialogBody>
          )}
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default PluginStorePanel;
