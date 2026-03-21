import { create } from "zustand";
import { AdbCommandsConfig, loadAdbCommandsConfig } from "../utils/configLoader";

interface ConfigState {
  adbCommands: AdbCommandsConfig | null;
  isLoading: boolean;
  error: string | null;
  loadAdbCommands: () => Promise<void>;
  updateAdbCommands: (config: AdbCommandsConfig) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  adbCommands: null,
  isLoading: false,
  error: null,

  loadAdbCommands: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await loadAdbCommandsConfig();
      set({ adbCommands: config, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  updateAdbCommands: (config) => set({ adbCommands: config }),
}));
