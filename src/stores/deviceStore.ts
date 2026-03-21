import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DeviceInfo, DeviceStatus } from "../types/device";

interface DeviceState extends DeviceStatus {
  setDevices: (devices: DeviceInfo[]) => void;
  selectDevice: (device: DeviceInfo | undefined) => void;
  updateDevice: (serial: string, updates: Partial<DeviceInfo>) => void;
  setScanning: (isScanning: boolean) => void;
  setFlashing: (isFlashing: boolean) => void;
  clearDevices: () => void;
  subscribeToStorageChanges: () => () => void;
  controlFavorites: string[];
  toggleControlFavorite: (controlId: string) => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      devices: [],
      selectedDevice: undefined,
      isScanning: false,
      isFlashing: false,
      lastUpdate: new Date(),
      controlFavorites: [],

      setDevices: (newDevices: DeviceInfo[]) => {
        const currentDevices = get().devices || [];
        const currentSelectedDeviceId = get().selectedDevice?.serial;

        // 智能合并：保留现有设备的属性 (properties, boardSerialNumber等)
        const mergedDevices = newDevices.map(newDevice => {
          const existing = currentDevices.find(d => d.serial === newDevice.serial);
          if (existing) {
            // 保留旧设备的 transient 属性，覆盖新扫描的核心信息 (connected, mode)
            return {
              ...existing,
              ...newDevice,
              properties: newDevice.properties || existing.properties,
              boardSerialNumber: newDevice.boardSerialNumber || existing.boardSerialNumber,
              fastbootVariables: newDevice.fastbootVariables || existing.fastbootVariables,
            };
          }
          return newDevice;
        });

        // 稳定保持选中设备的引用（如果它仍在列表中）
        let nextSelectedDevice = get().selectedDevice;
        if (nextSelectedDevice) {
           const stillPresent = mergedDevices.find(d => d.serial === currentSelectedDeviceId);
           if (stillPresent) {
             // 只有当选中设备的连接状态或模式真正改变时，才考虑更新引用以触发 React 重绘，
             // 这里我们由于想保住 properties 等属性，优先选 mergedDevices 里的（它已经合并过旧属性了）
             nextSelectedDevice = stillPresent;
           } else {
             nextSelectedDevice = undefined;
           }
        }

        set({ 
          devices: mergedDevices, 
          lastUpdate: new Date(),
          selectedDevice: nextSelectedDevice
        });
      },

      selectDevice: (device: DeviceInfo | undefined) => 
        set({ selectedDevice: device }),

      updateDevice: (serial: string, updates: Partial<DeviceInfo>) =>
        set((state) => ({
          devices: state.devices.map((device) =>
            device.serial === serial ? { ...device, ...updates } : device
          ),
          selectedDevice: state.selectedDevice?.serial === serial 
            ? { ...state.selectedDevice, ...updates }
            : state.selectedDevice,
          lastUpdate: new Date(),
        })),

      setScanning: (isScanning: boolean) => set({ isScanning }),

      setFlashing: (isFlashing: boolean) => set({ isFlashing }),

      clearDevices: () => set({ 
        devices: [], 
        selectedDevice: undefined, 
        lastUpdate: new Date() 
      }),

      subscribeToStorageChanges: () => {
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === "hout-device-storage" && event.newValue) {
            try {
              const newState = JSON.parse(event.newValue);
              const currentState = get();
              
              if (JSON.stringify(newState.state.selectedDevice) !== JSON.stringify(currentState.selectedDevice)) {
                set({ selectedDevice: newState.state.selectedDevice });
              }
              if (JSON.stringify(newState.state.devices) !== JSON.stringify(currentState.devices)) {
                set({ devices: newState.state.devices });
              }
            } catch (error) {
              console.error('Failed to parse device storage data:', error);
            }
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      },

      toggleControlFavorite: (controlId: string) => {
        set((state) => {
          const favorites = state.controlFavorites || [];
          const index = favorites.indexOf(controlId);
          if (index === -1) {
            return { controlFavorites: [...favorites, controlId] };
          } else {
            return { controlFavorites: favorites.filter(id => id !== controlId) };
          }
        });
      },
    }),
    {
      name: "hout-device-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
