import { create } from "zustand";
import {
  KeyMappingConfig,
  KeyMappingItem,
  KeyMappingProfile,
  InjectionMode,
} from "../types/keyMapping";
import KeyMappingService from "../services/keyMappingService";

interface KeyMappingState {
  profiles: KeyMappingProfile[];
  activeProfileId: string;
  isRunning: boolean;
  injectionMode: InjectionMode;
  activeWindowOnly: boolean;
  orientation: "landscape" | "portrait";
  selectedItemId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProfiles: () => Promise<void>;
  selectProfile: (id: string) => void;
  createProfile: (
    name: string,
    orientation?: "landscape" | "portrait",
  ) => Promise<KeyMappingProfile>;
  updateProfile: (profile: KeyMappingProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  duplicateProfile: (id: string) => Promise<KeyMappingProfile>;
  importProfile: (jsonStr: string) => Promise<void>;
  exportProfile: (profile: KeyMappingProfile) => string;

  // Item operations within active profile
  addItem: (item: Partial<KeyMappingItem>) => void;
  updateItem: (id: string, updates: Partial<KeyMappingItem>) => void;
  deleteItem: (id: string) => void;

  // Settings
  setOrientation: (orientation: "landscape" | "portrait") => void;
  setInjectionMode: (mode: InjectionMode) => void;
  setActiveWindowOnly: (val: boolean) => void;
  setSelectedItemId: (id: string | null) => void;

  // Runtime control
  startMapping: (deviceSerial: string) => Promise<boolean>;
  stopMapping: () => Promise<boolean>;
}

export const useKeyMappingStore = create<KeyMappingState>((set, get) => ({
  profiles: [],
  activeProfileId: "preset_moba",
  isRunning: false,
  injectionMode: "auto",
  activeWindowOnly: true,
  orientation: "landscape",
  selectedItemId: null,
  isLoading: false,
  error: null,

  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await KeyMappingService.getKeyMappingProfiles();
      const isRunning = await KeyMappingService.isKeyMappingActive();

      const activeId =
        profiles.find((p) => p.id === get().activeProfileId)?.id ||
        profiles[0]?.id ||
        "preset_moba";
      const activeProfile = profiles.find((p) => p.id === activeId);

      set({
        profiles,
        activeProfileId: activeId,
        orientation: (activeProfile?.orientation as any) || "landscape",
        isRunning,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: String(err), isLoading: false });
    }
  },

  selectProfile: (id: string) => {
    const profile = get().profiles.find((p) => p.id === id);
    set({
      activeProfileId: id,
      orientation: (profile?.orientation as any) || get().orientation,
      selectedItemId: null,
    });
  },

  createProfile: async (
    name: string,
    orientation: "landscape" | "portrait" = "landscape",
  ) => {
    const newProfile: KeyMappingProfile = {
      id: `profile_${Date.now()}`,
      name,
      orientation,
      items: [],
    };
    await KeyMappingService.saveKeyMappingProfile(newProfile);
    set((state) => ({
      profiles: [...state.profiles, newProfile],
      activeProfileId: newProfile.id,
      orientation,
      selectedItemId: null,
    }));
    return newProfile;
  },

  updateProfile: async (profile: KeyMappingProfile) => {
    await KeyMappingService.saveKeyMappingProfile(profile);
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === profile.id ? profile : p)),
    }));
  },

  deleteProfile: async (id: string) => {
    await KeyMappingService.deleteKeyMappingProfile(id);
    const updated = get().profiles.filter((p) => p.id !== id);
    const nextActive = updated[0]?.id || "";
    set({
      profiles: updated,
      activeProfileId: nextActive,
      selectedItemId: null,
    });
  },

  duplicateProfile: async (id: string) => {
    const target = get().profiles.find((p) => p.id === id);
    if (!target) throw new Error("目标配置不存在");
    const duplicated: KeyMappingProfile = {
      ...target,
      id: `profile_${Date.now()}`,
      name: `${target.name} (副本)`,
      items: target.items.map((item) => ({
        ...item,
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    await KeyMappingService.saveKeyMappingProfile(duplicated);
    set((state) => ({
      profiles: [...state.profiles, duplicated],
      activeProfileId: duplicated.id,
      selectedItemId: null,
    }));
    return duplicated;
  },

  importProfile: async (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr) as KeyMappingProfile;
      if (!parsed.name || !Array.isArray(parsed.items)) {
        throw new Error("格式无效，缺少必要字段");
      }
      const imported: KeyMappingProfile = {
        ...parsed,
        id: `profile_import_${Date.now()}`,
        name: `${parsed.name} (导入)`,
      };
      await KeyMappingService.saveKeyMappingProfile(imported);
      set((state) => ({
        profiles: [...state.profiles, imported],
        activeProfileId: imported.id,
        orientation: (imported.orientation as any) || "landscape",
      }));
    } catch (err: any) {
      throw new Error(`导入配置失败: ${err.message || err}`);
    }
  },

  exportProfile: (profile: KeyMappingProfile) => {
    return JSON.stringify(profile, null, 2);
  },

  addItem: (item: Partial<KeyMappingItem>) => {
    const activeProfile = get().profiles.find(
      (p) => p.id === get().activeProfileId,
    );
    if (!activeProfile) return;

    const newItem: KeyMappingItem = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name || "新按键",
      key: item.key || "J",
      actionType: item.actionType || "click",
      x: typeof item.x === "number" ? item.x : 0.5,
      y: typeof item.y === "number" ? item.y : 0.5,
      burstRate: item.burstRate ?? (item.actionType === "burst" ? 15 : undefined),
      radius:
        item.radius ?? (item.actionType === "joystick" ? 0.12 : undefined),
      keyUp: item.keyUp ?? "W",
      keyDown: item.keyDown ?? "S",
      keyLeft: item.keyLeft ?? "A",
      keyRight: item.keyRight ?? "D",
      endX: item.endX,
      endY: item.endY,
      durationMs: item.durationMs,
    };

    const updatedProfile: KeyMappingProfile = {
      ...activeProfile,
      items: [...activeProfile.items, newItem],
    };

    get().updateProfile(updatedProfile);
    set({ selectedItemId: newItem.id });
  },

  updateItem: (id: string, updates: Partial<KeyMappingItem>) => {
    const activeProfile = get().profiles.find(
      (p) => p.id === get().activeProfileId,
    );
    if (!activeProfile) return;

    const updatedItems = activeProfile.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );

    const updatedProfile: KeyMappingProfile = {
      ...activeProfile,
      items: updatedItems,
    };

    get().updateProfile(updatedProfile);
  },

  deleteItem: (id: string) => {
    const activeProfile = get().profiles.find(
      (p) => p.id === get().activeProfileId,
    );
    if (!activeProfile) return;

    const updatedItems = activeProfile.items.filter((item) => item.id !== id);
    const updatedProfile: KeyMappingProfile = {
      ...activeProfile,
      items: updatedItems,
    };

    get().updateProfile(updatedProfile);
    if (get().selectedItemId === id) {
      set({ selectedItemId: null });
    }
  },

  setOrientation: (orientation: "landscape" | "portrait") => {
    const activeProfile = get().profiles.find(
      (p) => p.id === get().activeProfileId,
    );
    if (activeProfile) {
      get().updateProfile({ ...activeProfile, orientation });
    }
    set({ orientation });
  },

  setInjectionMode: (injectionMode: InjectionMode) => set({ injectionMode }),
  setActiveWindowOnly: (activeWindowOnly: boolean) => set({ activeWindowOnly }),
  setSelectedItemId: (selectedItemId: string | null) => set({ selectedItemId }),

  startMapping: async (deviceSerial: string) => {
    const activeProfile = get().profiles.find(
      (p) => p.id === get().activeProfileId,
    );
    if (!activeProfile) {
      throw new Error("请先选择或创建一个映射配置");
    }

    const config: KeyMappingConfig = {
      deviceSerial,
      windowTitle: `ADMT - ${deviceSerial}`,
      injectionMode: get().injectionMode,
      activeWindowOnly: get().activeWindowOnly,
      profile: activeProfile,
    };

    try {
      const ok = await KeyMappingService.startKeyMapping(config);
      set({ isRunning: ok, error: null });
      return ok;
    } catch (err: any) {
      set({ error: String(err), isRunning: false });
      throw err;
    }
  },

  stopMapping: async () => {
    try {
      const ok = await KeyMappingService.stopKeyMapping();
      set({ isRunning: false });
      return ok;
    } catch (err: any) {
      set({ error: String(err) });
      return false;
    }
  },
}));

export default useKeyMappingStore;
