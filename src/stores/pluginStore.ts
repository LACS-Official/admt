import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ADMTPlugin, PluginStoreItem } from "../types/plugin";
import { BUILTIN_ADMT_PLUGINS } from "./builtinPlugins";

// 预置可供插件商店展示及安装的插件（生活/开发/常用全量插件）
export const PRESET_STORE_PLUGINS: PluginStoreItem[] = BUILTIN_ADMT_PLUGINS;

interface PluginStoreState {
  installedPlugins: ADMTPlugin[];
  storePlugins: PluginStoreItem[];
  searchQuery: string;
  selectedCategory: string;
  selectedPluginDetail: PluginStoreItem | null;
  isDetailModalOpen: boolean;
  activeGuiPlugin: ADMTPlugin | null;
  isGuiModalOpen: boolean;
  
  // Actions
  installPlugin: (plugin: PluginStoreItem | ADMTPlugin) => Promise<boolean>;
  uninstallPlugin: (pluginId: string) => Promise<boolean>;
  togglePlugin: (pluginId: string, enabled?: boolean) => void;
  updatePluginSettings: (pluginId: string, settings: Record<string, any>) => void;
  importLocalPlugin: (manifest: any, source?: "local" | "git") => Promise<{ success: boolean; message: string }>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedPluginDetail: (plugin: PluginStoreItem | null) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  openPluginGui: (plugin: ADMTPlugin) => void;
  closePluginGui: () => void;
  resetToBuiltinPlugins: () => void;
}

export const usePluginStore = create<PluginStoreState>()(
  persist(
    (set, get) => ({
      installedPlugins: BUILTIN_ADMT_PLUGINS.map(p => ({ ...p, isInstalled: true, isEnabled: true })),
      storePlugins: BUILTIN_ADMT_PLUGINS,
      searchQuery: "",
      selectedCategory: "all",
      selectedPluginDetail: null,
      isDetailModalOpen: false,
      activeGuiPlugin: null,
      isGuiModalOpen: false,

      installPlugin: async (plugin) => {
        const { installedPlugins, storePlugins } = get();
        const existingIndex = installedPlugins.findIndex((p) => p.manifest.id === plugin.manifest.id);
        const newPlugin: ADMTPlugin = {
          ...plugin,
          isInstalled: true,
          isEnabled: true,
          installedAt: new Date().toISOString().split("T")[0],
          source: plugin.source || "store",
          settings: plugin.settings || {},
        };

        let updatedInstalled: ADMTPlugin[];
        if (existingIndex >= 0) {
          updatedInstalled = [...installedPlugins];
          updatedInstalled[existingIndex] = newPlugin;
        } else {
          updatedInstalled = [newPlugin, ...installedPlugins];
        }

        const updatedStore = storePlugins.map((item) =>
          item.manifest.id === plugin.manifest.id ? { ...item, isInstalled: true, isEnabled: true } : item
        );

        set({
          installedPlugins: updatedInstalled,
          storePlugins: updatedStore,
        });
        return true;
      },

      uninstallPlugin: async (pluginId) => {
        const { installedPlugins, storePlugins } = get();
        const updatedInstalled = installedPlugins.filter((p) => p.manifest.id !== pluginId);
        const updatedStore = storePlugins.map((item) =>
          item.manifest.id === pluginId ? { ...item, isInstalled: false, isEnabled: false } : item
        );

        set({
          installedPlugins: updatedInstalled,
          storePlugins: updatedStore,
        });
        return true;
      },

      togglePlugin: (pluginId, enabled) => {
        const { installedPlugins, storePlugins } = get();
        const updatedInstalled = installedPlugins.map((p) => {
          if (p.manifest.id === pluginId) {
            const nextState = enabled !== undefined ? enabled : !p.isEnabled;
            return { ...p, isEnabled: nextState };
          }
          return p;
        });

        const updatedStore = storePlugins.map((p) => {
          if (p.manifest.id === pluginId) {
            const nextState = enabled !== undefined ? enabled : !p.isEnabled;
            return { ...p, isEnabled: nextState };
          }
          return p;
        });

        set({
          installedPlugins: updatedInstalled,
          storePlugins: updatedStore,
        });
      },

      updatePluginSettings: (pluginId, settings) => {
        const { installedPlugins } = get();
        const updatedInstalled = installedPlugins.map((p) => {
          if (p.manifest.id === pluginId) {
            return { ...p, settings: { ...p.settings, ...settings } };
          }
          return p;
        });
        set({ installedPlugins: updatedInstalled });
      },

      importLocalPlugin: async (manifest, source = "local") => {
        if (!manifest || !manifest.id || !manifest.name || !manifest.version) {
          return { success: false, message: "清单文件无效，缺少必需字段 (id, name, version)" };
        }

        const newPlugin: ADMTPlugin = {
          manifest: {
            id: manifest.id,
            name: manifest.name,
            nameEn: manifest.nameEn || manifest.name,
            version: manifest.version,
            description: manifest.description || "本地导入插件",
            descriptionEn: manifest.descriptionEn || manifest.description || "",
            author: manifest.author || { name: "开发者" },
            category: manifest.category || "tools",
            tags: manifest.tags || ["本地导入"],
            permissions: manifest.permissions || ["device:info"],
            settingsSchema: manifest.settingsSchema || [],
            homepage: manifest.homepage,
            repository: manifest.repository,
          },
          isEnabled: true,
          isInstalled: true,
          installedAt: new Date().toISOString().split("T")[0],
          source,
          fileSize: "自定义",
          rating: 5.0,
          settings: {},
        };

        const { installedPlugins } = get();
        const existingIndex = installedPlugins.findIndex((p) => p.manifest.id === newPlugin.manifest.id);
        let updated: ADMTPlugin[];
        if (existingIndex >= 0) {
          updated = [...installedPlugins];
          updated[existingIndex] = newPlugin;
        } else {
          updated = [newPlugin, ...installedPlugins];
        }

        set({ installedPlugins: updated });
        return { success: true, message: `插件【${newPlugin.manifest.name}】安装成功！` };
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSelectedPluginDetail: (selectedPluginDetail) => set({ selectedPluginDetail }),
      setIsDetailModalOpen: (isDetailModalOpen) => set({ isDetailModalOpen }),
      openPluginGui: (plugin: ADMTPlugin) => set({ activeGuiPlugin: plugin, isGuiModalOpen: true }),
      closePluginGui: () => set({ activeGuiPlugin: null, isGuiModalOpen: false }),
      resetToBuiltinPlugins: () => {
        set({
          installedPlugins: BUILTIN_ADMT_PLUGINS.map((p) => ({ ...p, isInstalled: true, isEnabled: true })),
          storePlugins: BUILTIN_ADMT_PLUGINS,
        });
      },
    }),
    {
      name: "admt-plugin-store",
      partialize: (state) => ({
        installedPlugins: state.installedPlugins,
      }),
    }
  )
);
